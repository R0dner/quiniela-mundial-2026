// src/groups.js - Sistema de grupos con Firebase (CORREGIDO - PERSISTENCIA ASEGURADA)
import { 
    guardarGrupoEnFirebase, 
    obtenerGrupoDeFirebase, 
    obtenerTodosLosGruposDeFirebase,
    eliminarGrupoDeFirebase,
    registrarParticipanteEnFirebase,
    eliminarParticipanteDeFirebase,
    agregarApuestaEnFirebase,
    eliminarApuestaEnFirebase,
    guardarResultadoEnFirebase,
    actualizarReglasEnFirebase,
    actualizarPremiosEnFirebase,
    cargarFirebaseALocal,
    sincronizarLocalAFirebase
} from './firebase.js';

let todosLosPartidosGlobal = [];
let gruposCache = {};
let sincronizando = false;
let guardandoApuesta = false;
let ultimaActualizacionGrupos = 0;
const TIEMPO_CACHE_MS = 2000; // 2 segundos de caché

export function setPartidosGlobal(partidos) {
    todosLosPartidosGlobal = partidos;
}

// ============ GRUPOS (CON CONTROL DE CACHÉ) ============

// REEMPLAZAR la función getGrupos() por esta:
export async function getGrupos() {
    try {
        const gruposFirebase = await obtenerTodosLosGruposDeFirebase();
        if (Object.keys(gruposFirebase).length > 0) {
            gruposCache = gruposFirebase;
            localStorage.setItem('quiniela_grupos', JSON.stringify(gruposFirebase));
            return gruposFirebase;
        }
    } catch (error) {
        console.error('Error cargando desde Firebase:', error);
    }
    
    // Solo usar localStorage como fallback si Firebase falla
    const gruposGuardados = localStorage.getItem('quiniela_grupos');
    if (gruposGuardados) {
        gruposCache = JSON.parse(gruposGuardados);
        return gruposCache;
    }
    
    return {};
}

export async function guardarGrupos(grupos) {
    gruposCache = grupos;
    localStorage.setItem('quiniela_grupos', JSON.stringify(grupos));
    ultimaActualizacionGrupos = Date.now();
    window.dispatchEvent(new Event('grupos-actualizados'));
    
    if (!sincronizando) {
        sincronizando = true;
        try {
            for (const [id, data] of Object.entries(grupos)) {
                await guardarGrupoEnFirebase(id, data);
            }
            console.log('✅ Grupos guardados en Firebase');
        } catch (error) {
            console.error('❌ Error guardando en Firebase:', error);
        } finally {
            sincronizando = false;
        }
    }
}

// REEMPLAZAR getGrupo por:
export async function getGrupo(grupoId) {
    try {
        // SIEMPRE ir a Firebase, nunca usar caché
        const { obtenerGrupoDeFirebase } = await import('./firebase.js');
        const grupoFirebase = await obtenerGrupoDeFirebase(grupoId);
        if (grupoFirebase) {
            gruposCache[grupoId] = grupoFirebase;
            return grupoFirebase;
        }
    } catch (error) {
        console.error('Error leyendo grupo de Firebase:', error);
    }
    return gruposCache[grupoId] || null;
}

export async function crearGrupo(grupoId, config) {
    const grupos = await getGrupos(true);
    if (grupos[grupoId]) {
        throw new Error(`El grupo ${grupoId} ya existe`);
    }
    if (!grupoId || grupoId.trim() === '') {
        throw new Error('El ID del grupo es obligatorio');
    }
    
    const nuevoGrupo = {
        nombre: config.nombre,
        codigo: config.codigo || grupoId.toUpperCase(),
        descripcion: config.descripcion || '',
        reglas: {
            puntosExacto: config.reglas?.puntosExacto || 3,
            puntosGanador: config.reglas?.puntosGanador || 1,
            puntosEmpate: config.reglas?.puntosEmpate || 2,
            permiteModificar: true,
            cierreAutomatico: true
        },
        premios: config.premios || {
            cantidadGanadores: 3,
            primero: 50,
            segundo: 30,
            tercero: 20
        },
        participantes: [],
        participantesInfo: {},
        apuestas: {},
        resultados: {},
        apuestasExtras: {},
        fechaCreacion: new Date().toISOString(),
        activo: true
    };
    
    grupos[grupoId] = nuevoGrupo;
    await guardarGrupos(grupos);
    return nuevoGrupo;
}

export async function eliminarGrupo(grupoId) {
    const grupos = await getGrupos(true);
    if (!grupos[grupoId]) {
        throw new Error(`El grupo ${grupoId} no existe`);
    }
    delete grupos[grupoId];
    await guardarGrupos(grupos);
    await eliminarGrupoDeFirebase(grupoId);
}

// ============ PARTICIPANTES ============

export async function registrarParticipanteEnGrupo(grupoId, nombre, telefono = '') {
    const resultado = await registrarParticipanteEnFirebase(grupoId, nombre, telefono);
    if (resultado.success) {
        const grupos = await getGrupos(true);
        if (grupos[grupoId]) {
            if (!grupos[grupoId].participantes.includes(nombre)) {
                grupos[grupoId].participantes.push(nombre);
                if (!grupos[grupoId].participantesInfo) grupos[grupoId].participantesInfo = {};
                grupos[grupoId].participantesInfo[nombre] = {
                    telefono: telefono,
                    fechaRegistro: new Date().toISOString()
                };
                await guardarGrupos(grupos);
            }
        }
    }
    return resultado;
}

export async function participanteRegistrado(grupoId, nombre) {
    const grupo = await getGrupo(grupoId, true);
    if (!grupo) return false;
    return grupo.participantes.some(p => p.toLowerCase() === nombre.toLowerCase());
}

export async function getParticipantesDelGrupo(grupoId) {
    const grupo = await getGrupo(grupoId, true);
    return grupo ? grupo.participantes : [];
}

export async function getInfoParticipante(grupoId, nombre) {
    const grupo = await getGrupo(grupoId, true);
    if (!grupo) return null;
    return grupo.participantesInfo?.[nombre] || { telefono: '', fechaRegistro: '' };
}

export async function eliminarParticipanteDeGrupo(grupoId, nombre) {
    const resultado = await eliminarParticipanteDeFirebase(grupoId, nombre);
    if (resultado) {
        const grupos = await getGrupos(true);
        if (grupos[grupoId]) {
            const index = grupos[grupoId].participantes.findIndex(p => p.toLowerCase() === nombre.toLowerCase());
            if (index !== -1) {
                grupos[grupoId].participantes.splice(index, 1);
                if (grupos[grupoId].participantesInfo?.[nombre]) {
                    delete grupos[grupoId].participantesInfo[nombre];
                }
                await guardarGrupos(grupos);
            }
        }
    }
    return resultado;
}

// ============ APUESTAS (CORREGIDO - AHORA GUARDA CORRECTAMENTE) ============

export async function agregarApuestaEnGrupo(grupoId, participante, partidoId, apuesta) {
    // Evitar llamadas simultáneas
    if (guardandoApuesta) {
        console.log('⚠️ Ya hay una apuesta guardándose, ignorando...');
        return false;
    }
    
    guardandoApuesta = true;
    
    try {
        // FORZAR RECARGA desde Firebase para obtener datos actualizados
        const grupos = await getGrupos(true);
        
        if (!grupos[grupoId]) {
            console.error('❌ Grupo no encontrado:', grupoId);
            guardandoApuesta = false;
            return false;
        }
        
        // Inicializar estructuras correctamente
        if (!grupos[grupoId].apuestas) {
            grupos[grupoId].apuestas = {};
        }
        if (!grupos[grupoId].apuestas[participante]) {
            grupos[grupoId].apuestas[participante] = {};
        }
        // IMPORTANTE: Cada partido debe tener un ARRAY de apuestas
        if (!grupos[grupoId].apuestas[participante][partidoId]) {
            grupos[grupoId].apuestas[participante][partidoId] = [];
        }
        
        // Verificar si ya existe exactamente la misma apuesta para este partido
        const apuestasExistentes = grupos[grupoId].apuestas[participante][partidoId];
        const apuestaExistente = apuestasExistentes.find(a => 
            a.local === apuesta.local && a.visitante === apuesta.visitante
        );
        
        if (apuestaExistente) {
            console.log('⚠️ Esta apuesta ya existe, no se duplicará');
            guardandoApuesta = false;
            return false;
        }
        
        // Crear ID único para la apuesta
        const apuestaId = Date.now() + '-' + Math.random().toString(36).substr(2, 8);
        
        // Agregar la nueva apuesta
        const nuevaApuesta = {
            id: apuestaId,
            local: apuesta.local,
            visitante: apuesta.visitante,
            esEmpate: apuesta.esEmpate || false,
            fecha: new Date().toISOString()
        };
        
        grupos[grupoId].apuestas[participante][partidoId].push(nuevaApuesta);
        
        console.log(`💾 Guardando apuesta para ${participante} en partido ${partidoId}:`, nuevaApuesta);
        
        // Guardar en Firebase y actualizar caché
        await guardarGrupos(grupos);
        
        console.log('✅ Apuesta guardada correctamente');
        guardandoApuesta = false;
        return apuestaId;
        
    } catch (error) {
        console.error('❌ Error al agregar apuesta:', error);
        guardandoApuesta = false;
        return false;
    }
}

export async function getApuestasMultiplesDeParticipante(grupoId, participante) {
    const grupo = await getGrupo(grupoId);
    if (!grupo || !grupo.apuestas || !grupo.apuestas[participante]) return {};
    
    const apuestasBrutas = grupo.apuestas[participante];
    const apuestasLimpias = {};
    
    for (const [partidoId, valor] of Object.entries(apuestasBrutas)) {
        if (!valor) continue;
        
        // Firebase convierte arrays a objetos {0:{...}, 1:{...}}
        // Hay que convertirlos de vuelta a array
        if (Array.isArray(valor)) {
            apuestasLimpias[partidoId] = valor;
        } else if (typeof valor === 'object') {
            apuestasLimpias[partidoId] = Object.values(valor);
        }
    }
    
    return apuestasLimpias;
}

export async function getApuestasDePartido(grupoId, participante, partidoId) {
    const grupo = await getGrupo(grupoId);
    if (!grupo || !grupo.apuestas || !grupo.apuestas[participante]) return [];
    
    const valor = grupo.apuestas[participante][partidoId];
    if (!valor) return [];
    
    // Mismo fix: Firebase puede devolver objeto en lugar de array
    if (Array.isArray(valor)) return valor;
    if (typeof valor === 'object') return Object.values(valor);
    return [];
}

export async function eliminarApuesta(grupoId, participante, partidoId, apuestaId) {
    const resultado = await eliminarApuestaEnFirebase(grupoId, participante, partidoId, apuestaId);
    if (resultado) {
        const grupos = await getGrupos(true);
        if (grupos[grupoId]?.apuestas?.[participante]?.[partidoId]) {
            const index = grupos[grupoId].apuestas[participante][partidoId].findIndex(a => a.id === apuestaId);
            if (index !== -1) {
                grupos[grupoId].apuestas[participante][partidoId].splice(index, 1);
                if (grupos[grupoId].apuestas[participante][partidoId].length === 0) {
                    delete grupos[grupoId].apuestas[participante][partidoId];
                }
                await guardarGrupos(grupos);
            }
        }
    }
    return resultado;
}

// Función de depuración para verificar apuestas
export async function verificarApuestasEnFirebase(grupoId, participante) {
    try {
        const grupos = await getGrupos(true);
        const grupo = grupos[grupoId];
        
        if (!grupo) {
            console.log('❌ Grupo no encontrado:', grupoId);
            return null;
        }
        
        const apuestas = grupo.apuestas?.[participante];
        console.log(`🔍 Verificando apuestas para ${participante} en ${grupoId}:`, apuestas);
        
        return {
            existe: !!apuestas,
            cantidadPartidos: apuestas ? Object.keys(apuestas).length : 0,
            totalApuestas: apuestas ? Object.values(apuestas).reduce((sum, arr) => sum + (arr?.length || 0), 0) : 0
        };
    } catch (error) {
        console.error('Error verificando:', error);
        return null;
    }
}

// ============ RESULTADOS ============

export async function guardarResultadoEnGrupo(grupoId, partidoId, resultado) {
    const exito = await guardarResultadoEnFirebase(grupoId, partidoId, resultado);
    if (exito) {
        const grupos = await getGrupos(true);
        if (grupos[grupoId]) {
            if (!grupos[grupoId].resultados) grupos[grupoId].resultados = {};
            grupos[grupoId].resultados[partidoId] = resultado;
            await guardarGrupos(grupos);
        }
    }
    return exito;
}

export async function getResultadosDelGrupo(grupoId) {
    const grupo = await getGrupo(grupoId, true);
    return grupo ? grupo.resultados || {} : {};
}

// ============ CÁLCULO DE PUNTOS ============

// REEMPLAZAR calcularPuntosMultiples por:
export async function calcularPuntosMultiples(grupoId, participante) {
    const grupo = await getGrupo(grupoId);
    if (!grupo) return 0;
    
    const apuestasPorPartido = grupo.apuestas?.[participante] || {};
    const resultados = grupo.resultados || {};
    const reglas = grupo.reglas;
    
    let puntos = 0;
    
    for (const [partidoId, apuestasRaw] of Object.entries(apuestasPorPartido)) {
        const resultado = resultados[partidoId];
        if (!resultado || !apuestasRaw) continue;
        
        // ← NORMALIZAR: objeto Firebase {0:{...}} → array [{...}]
        let apuestas = [];
        if (Array.isArray(apuestasRaw)) {
            apuestas = apuestasRaw;
        } else if (typeof apuestasRaw === 'object') {
            apuestas = Object.values(apuestasRaw);
        }
        
        // Deduplicar
        const unicas = [];
        const claves = new Set();
        for (const apuesta of apuestas) {
            const clave = apuesta.esEmpate ? 'empate' : `${apuesta.local}-${apuesta.visitante}`;
            if (!claves.has(clave)) {
                claves.add(clave);
                unicas.push(apuesta);
            }
        }
        
        for (const apuesta of unicas) {
            if (apuesta.esEmpate === true) {
                if (resultado.local === resultado.visitante) {
                    puntos += reglas.puntosEmpate || 2;
                }
            } else if (apuesta.local === resultado.local && apuesta.visitante === resultado.visitante) {
                puntos += reglas.puntosExacto;
            } else if (
                (apuesta.local > apuesta.visitante && resultado.local > resultado.visitante) ||
                (apuesta.local < apuesta.visitante && resultado.local < resultado.visitante) ||
                (apuesta.local === apuesta.visitante && resultado.local === resultado.visitante)
            ) {
                puntos += reglas.puntosGanador;
            }
        }
    }
    
    return puntos;
}

export async function getRankingDelGrupo(grupoId) {
    const grupo = await getGrupo(grupoId, true);
    if (!grupo) return [];
    
    const ranking = [];
    for (const participante of grupo.participantes) {
        ranking.push({
            nombre: participante,
            puntos: await calcularPuntosMultiples(grupoId, participante),
            telefono: grupo.participantesInfo?.[participante]?.telefono || ''
        });
    }
    
    ranking.sort((a, b) => b.puntos - a.puntos);
    
    return ranking.map((item, index) => ({
        ...item,
        posicion: index + 1
    }));
}

export async function getRankingDelGrupoPorDia(grupoId, fecha) {
    const grupo = await getGrupo(grupoId);
    if (!grupo) return [];
    
    const partidosDeFecha = todosLosPartidosGlobal.filter(p => p.fecha === fecha);
    const partidosIds = partidosDeFecha.map(p => p.id);
    
    const ranking = [];
    for (const participante of grupo.participantes) {
        let puntos = 0;
        let tienePronósticos = false; // ← NUEVO
        const apuestasPorPartido = grupo.apuestas?.[participante] || {};
        const resultados = grupo.resultados || {};
        const reglas = grupo.reglas;
        
        for (const partidoId of partidosIds) {
            const apuestasRaw = apuestasPorPartido[partidoId];
            if (!apuestasRaw) continue;
            
            // Normalizar a array
            let apuestas = Array.isArray(apuestasRaw) 
                ? apuestasRaw 
                : Object.values(apuestasRaw);
            
            if (apuestas.length > 0) {
                tienePronósticos = true; // ← tiene al menos un pronóstico ese día
            }
            
            const resultado = resultados[partidoId];
            if (!resultado) continue;
            
            const unicas = [];
            const claves = new Set();
            for (const apuesta of apuestas) {
                const clave = apuesta.esEmpate ? 'empate' : `${apuesta.local}-${apuesta.visitante}`;
                if (!claves.has(clave)) {
                    claves.add(clave);
                    unicas.push(apuesta);
                }
            }
            
            for (const apuesta of unicas) {
                if (apuesta.esEmpate === true) {
                    if (resultado.local === resultado.visitante) {
                        puntos += reglas.puntosEmpate || 2;
                    }
                } else if (apuesta.local === resultado.local && apuesta.visitante === resultado.visitante) {
                    puntos += reglas.puntosExacto;
                } else if (
                    (apuesta.local > apuesta.visitante && resultado.local > resultado.visitante) ||
                    (apuesta.local < apuesta.visitante && resultado.local < resultado.visitante) ||
                    (apuesta.local === apuesta.visitante && resultado.local === resultado.visitante)
                ) {
                    puntos += reglas.puntosGanador;
                }
            }
        }
        
        ranking.push({
            nombre: participante,
            puntos,
            tienePronósticos, // ← AGREGAR al objeto
            telefono: grupo.participantesInfo?.[participante]?.telefono || ''
        });
    }
    
    ranking.sort((a, b) => b.puntos - a.puntos);
    return ranking.map((item, index) => ({ ...item, posicion: index + 1 }));
}

// ============ REGLAS Y PREMIOS ============

export async function actualizarReglasDelGrupo(grupoId, nuevasReglas) {
    const exito = await actualizarReglasEnFirebase(grupoId, nuevasReglas);
    if (exito) {
        const grupos = await getGrupos(true);
        if (grupos[grupoId]) {
            grupos[grupoId].reglas = {
                ...grupos[grupoId].reglas,
                ...nuevasReglas
            };
            await guardarGrupos(grupos);
        }
    }
    return exito;
}

export async function getReglasDelGrupo(grupoId) {
    const grupo = await getGrupo(grupoId, true);
    return grupo ? grupo.reglas : { puntosExacto: 3, puntosGanador: 1, puntosEmpate: 2 };
}

export async function actualizarPremiosDelGrupo(grupoId, nuevosPremios) {
    const exito = await actualizarPremiosEnFirebase(grupoId, nuevosPremios);
    if (exito) {
        const grupos = await getGrupos(true);
        if (grupos[grupoId]) {
            grupos[grupoId].premios = {
                ...grupos[grupoId].premios,
                ...nuevosPremios
            };
            await guardarGrupos(grupos);
        }
    }
    return exito;
}

export async function getPremiosDelGrupo(grupoId) {
    const grupo = await getGrupo(grupoId, true);
    return grupo ? grupo.premios : { 
        cantidadGanadores: 3,
        primero: 50, 
        segundo: 30, 
        tercero: 20 
    };
}

// ============ LÍMITE DE APUESTAS EXTRA ============

export async function getLimiteApuestasParticipante(grupoId, participante) {
    const grupo = await getGrupo(grupoId, true);
    if (!grupo) return 1;
    return grupo.apuestasExtras?.[participante] || 1;
}

export async function actualizarLimiteApuestasParticipante(grupoId, participante, limite) {
    const grupos = await getGrupos(true);
    if (!grupos[grupoId]) return false;
    
    if (!grupos[grupoId].apuestasExtras) {
        grupos[grupoId].apuestasExtras = {};
    }
    
    grupos[grupoId].apuestasExtras[participante] = limite;
    await guardarGrupos(grupos);
    return true;
}

export async function getApuestasExtrasDelGrupo(grupoId) {
    const grupo = await getGrupo(grupoId, true);
    return grupo?.apuestasExtras || {};
}

// ============ GRUPO GENERAL ============

export async function obtenerGrupoGeneral() {
    const grupos = await getGrupos(true);
    
    if (!grupos['general']) {
        const nuevoGrupo = {
            nombre: "🏆 GRUPO GENERAL - POZO MAYOR 🏆",
            codigo: "GENERAL",
            descripcion: "Grupo principal con pozo mayor. ¡Participa y gana grandes premios!",
            reglas: {
                puntosExacto: 5,
                puntosGanador: 2,
                puntosEmpate: 2,
                permiteModificar: true,
                cierreAutomatico: true
            },
            premios: {
                cantidadGanadores: 3,
                primero: 60,
                segundo: 25,
                tercero: 15
            },
            participantes: [],
            participantesInfo: {},
            apuestas: {},
            resultados: {},
            apuestasExtras: {},
            fechaCreacion: new Date().toISOString(),
            activo: true,
            esGrupoGeneral: true
        };
        grupos['general'] = nuevoGrupo;
        await guardarGrupos(grupos);
        console.log('✅ Grupo General creado automáticamente con pozo mayor');
    }
    
    return grupos['general'];
}

export async function unirseAlGrupoGeneral(nombre, telefono = '') {
    const grupos = await getGrupos(true);
    let grupoGeneral = grupos['general'];
    
    if (!grupoGeneral) {
        await obtenerGrupoGeneral();
        const gruposActualizados = await getGrupos(true);
        grupoGeneral = gruposActualizados['general'];
    }
    
    const nombreNormalizado = nombre.trim();
    if (!nombreNormalizado) {
        return { success: false, message: 'El nombre es obligatorio' };
    }
    
    const existe = grupoGeneral.participantes.some(
        p => p.toLowerCase() === nombreNormalizado.toLowerCase()
    );
    
    if (existe) {
        return { success: false, message: 'Ya estás registrado en el Grupo General' };
    }
    
    grupoGeneral.participantes.push(nombreNormalizado);
    
    if (!grupoGeneral.participantesInfo) {
        grupoGeneral.participantesInfo = {};
    }
    
    grupoGeneral.participantesInfo[nombreNormalizado] = {
        telefono: telefono,
        fechaRegistro: new Date().toISOString(),
        esMiembroGeneral: true
    };
    
    await guardarGrupos(grupos);
    return { success: true, message: `🎉 ¡Bienvenido al GRUPO GENERAL! 🎉\nTienes premios mayores y puntos extra.` };
}