// src/groups.js - Sistema de grupos con Firebase (SIN CONTRASEÑAS)
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
let guardandoApuesta = false; // Variable para controlar duplicados

export function setPartidosGlobal(partidos) {
    todosLosPartidosGlobal = partidos;
}

// ============ GRUPOS ============

export async function getGrupos() {
    if (Object.keys(gruposCache).length > 0) {
        return gruposCache;
    }
    
    try {
        const gruposFirebase = await obtenerTodosLosGruposDeFirebase();
        if (Object.keys(gruposFirebase).length > 0) {
            gruposCache = gruposFirebase;
            localStorage.setItem('quiniela_grupos', JSON.stringify(gruposFirebase));
            console.log('✅ Grupos cargados desde Firebase:', Object.keys(gruposFirebase).length);
            return gruposFirebase;
        }
    } catch (error) {
        console.error('Error cargando desde Firebase:', error);
    }
    
    const gruposGuardados = localStorage.getItem('quiniela_grupos');
    if (gruposGuardados) {
        gruposCache = JSON.parse(gruposGuardados);
        console.log('📦 Grupos cargados desde localStorage:', Object.keys(gruposCache).length);
        return gruposCache;
    }
    
    return {};
}

export async function guardarGrupos(grupos) {
    gruposCache = grupos;
    localStorage.setItem('quiniela_grupos', JSON.stringify(grupos));
    window.dispatchEvent(new Event('grupos-actualizados'));
    
    if (!sincronizando) {
        sincronizando = true;
        for (const [id, data] of Object.entries(grupos)) {
            await guardarGrupoEnFirebase(id, data);
        }
        sincronizando = false;
    }
}

export async function getGrupo(grupoId) {
    const grupos = await getGrupos();
    return grupos[grupoId];
}

export async function crearGrupo(grupoId, config) {
    const grupos = await getGrupos();
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
    const grupos = await getGrupos();
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
        const grupos = await getGrupos();
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
    const grupo = await getGrupo(grupoId);
    if (!grupo) return false;
    return grupo.participantes.some(p => p.toLowerCase() === nombre.toLowerCase());
}

export async function getParticipantesDelGrupo(grupoId) {
    const grupo = await getGrupo(grupoId);
    return grupo ? grupo.participantes : [];
}

export async function getInfoParticipante(grupoId, nombre) {
    const grupo = await getGrupo(grupoId);
    if (!grupo) return null;
    return grupo.participantesInfo?.[nombre] || { telefono: '', fechaRegistro: '' };
}

export async function eliminarParticipanteDeGrupo(grupoId, nombre) {
    const resultado = await eliminarParticipanteDeFirebase(grupoId, nombre);
    if (resultado) {
        const grupos = await getGrupos();
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

// ============ APUESTAS (CON CONTROL DE DUPLICADOS) ============

export async function agregarApuestaEnGrupo(grupoId, participante, partidoId, apuesta) {
    // Evitar llamadas simultáneas
    if (guardandoApuesta) {
        console.log('⚠️ Ya hay una apuesta guardándose, ignorando...');
        return false;
    }
    
    guardandoApuesta = true;
    
    try {
        const grupos = await getGrupos();
        if (!grupos[grupoId]) return false;
        
        // Verificar si ya existe exactamente la misma apuesta para este partido
        const apuestasExistentes = grupos[grupoId].apuestas?.[participante]?.[partidoId] || [];
        const apuestaExistente = apuestasExistentes.find(a => 
            a.local === apuesta.local && a.visitante === apuesta.visitante
        );
        
        if (apuestaExistente) {
            console.log('⚠️ Esta apuesta ya existe, no se duplicará');
            guardandoApuesta = false;
            return false;
        }
        
        if (!grupos[grupoId].apuestas[participante]) {
            grupos[grupoId].apuestas[participante] = {};
        }
        
        if (!grupos[grupoId].apuestas[participante][partidoId]) {
            grupos[grupoId].apuestas[participante][partidoId] = [];
        }
        
        const apuestaId = Date.now() + '-' + Math.random().toString(36).substr(2, 8);
        
        grupos[grupoId].apuestas[participante][partidoId].push({
            id: apuestaId,
            local: apuesta.local,
            visitante: apuesta.visitante,
            fecha: new Date().toISOString()
        });
        
        await guardarGrupos(grupos);
        guardandoApuesta = false;
        return apuestaId;
    } catch (error) {
        console.error('Error al agregar apuesta:', error);
        guardandoApuesta = false;
        return false;
    }
}

export async function getApuestasMultiplesDeParticipante(grupoId, participante) {
    const grupo = await getGrupo(grupoId);
    if (!grupo || !grupo.apuestas[participante]) return {};
    return grupo.apuestas[participante];
}

export async function getApuestasDePartido(grupoId, participante, partidoId) {
    const grupo = await getGrupo(grupoId);
    if (!grupo || !grupo.apuestas[participante]) return [];
    return grupo.apuestas[participante][partidoId] || [];
}

export async function eliminarApuesta(grupoId, participante, partidoId, apuestaId) {
    const resultado = await eliminarApuestaEnFirebase(grupoId, participante, partidoId, apuestaId);
    if (resultado) {
        const grupos = await getGrupos();
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

// ============ RESULTADOS ============

export async function guardarResultadoEnGrupo(grupoId, partidoId, resultado) {
    const exito = await guardarResultadoEnFirebase(grupoId, partidoId, resultado);
    if (exito) {
        const grupos = await getGrupos();
        if (grupos[grupoId]) {
            if (!grupos[grupoId].resultados) grupos[grupoId].resultados = {};
            grupos[grupoId].resultados[partidoId] = resultado;
            await guardarGrupos(grupos);
        }
    }
    return exito;
}

export async function getResultadosDelGrupo(grupoId) {
    const grupo = await getGrupo(grupoId);
    return grupo ? grupo.resultados || {} : {};
}

// ============ CÁLCULO DE PUNTOS ============

export async function calcularPuntosMultiples(grupoId, participante) {
    const grupo = await getGrupo(grupoId);
    if (!grupo) return 0;
    
    const apuestasPorPartido = grupo.apuestas[participante] || {};
    const resultados = grupo.resultados || {};
    const reglas = grupo.reglas;
    
    let puntos = 0;
    
    for (const [partidoId, apuestas] of Object.entries(apuestasPorPartido)) {
        const resultado = resultados[partidoId];
        if (resultado && Array.isArray(apuestas)) {
            // DEDUPLICAR: una sola apuesta por marcador
            const unicas = [];
            const claves = new Set();
            for (const apuesta of apuestas) {
                const clave = `${apuesta.local}-${apuesta.visitante}`;
                if (!claves.has(clave)) {
                    claves.add(clave);
                    unicas.push(apuesta);
                }
            }
            
            for (const apuesta of unicas) {
                if (apuesta.local === resultado.local && apuesta.visitante === resultado.visitante) {
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
    }
    
    return puntos;
}

export async function getRankingDelGrupo(grupoId) {
    const grupo = await getGrupo(grupoId);
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
    
    // Obtener los IDs de los partidos de esa fecha
    const partidosDeFecha = getPartidosPorFecha(fecha);
    const partidosIds = partidosDeFecha.map(p => p.id);
    
    const ranking = [];
    for (const participante of grupo.participantes) {
        let puntos = 0;
        const apuestasPorPartido = grupo.apuestas[participante] || {};
        const resultados = grupo.resultados || {};
        const reglas = grupo.reglas;
        
        for (const partidoId of partidosIds) {
            const apuestas = apuestasPorPartido[partidoId];
            const resultado = resultados[partidoId];
            if (apuestas && Array.isArray(apuestas) && resultado) {
                // DEDUPLICAR: una sola apuesta por marcador
                const unicas = [];
                const claves = new Set();
                for (const apuesta of apuestas) {
                    const clave = `${apuesta.local}-${apuesta.visitante}`;
                    if (!claves.has(clave)) {
                        claves.add(clave);
                        unicas.push(apuesta);
                    }
                }
                
                for (const apuesta of unicas) {
                    if (apuesta.local === resultado.local && apuesta.visitante === resultado.visitante) {
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
        }
        
        ranking.push({
            nombre: participante,
            puntos: puntos,
            telefono: grupo.participantesInfo?.[participante]?.telefono || '',
            fechaRegistro: grupo.participantesInfo?.[participante]?.fechaRegistro || ''
        });
    }
    
    ranking.sort((a, b) => b.puntos - a.puntos);
    return ranking.map((item, index) => ({ ...item, posicion: index + 1 }));
}

// ============ REGLAS Y PREMIOS ============

export async function actualizarReglasDelGrupo(grupoId, nuevasReglas) {
    const exito = await actualizarReglasEnFirebase(grupoId, nuevasReglas);
    if (exito) {
        const grupos = await getGrupos();
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

export async function actualizarPremiosDelGrupo(grupoId, nuevosPremios) {
    const exito = await actualizarPremiosEnFirebase(grupoId, nuevosPremios);
    if (exito) {
        const grupos = await getGrupos();
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
    const grupo = await getGrupo(grupoId);
    return grupo ? grupo.premios : { 
        cantidadGanadores: 3,
        primero: 50, 
        segundo: 30, 
        tercero: 20 
    };
}

export async function getReglasDelGrupo(grupoId) {
    const grupo = await getGrupo(grupoId);
    return grupo ? grupo.reglas : { puntosExacto: 3, puntosGanador: 1 };
}

// ============ LÍMITE DE APUESTAS EXTRA ============

export async function getLimiteApuestasParticipante(grupoId, participante) {
    const grupo = await getGrupo(grupoId);
    if (!grupo) return 1;
    
    if (!grupo.apuestasExtras) {
        return 1;
    }
    
    return grupo.apuestasExtras[participante] || 1;
}

export async function actualizarLimiteApuestasParticipante(grupoId, participante, limite) {
    const grupos = await getGrupos();
    if (!grupos[grupoId]) return false;
    
    if (!grupos[grupoId].apuestasExtras) {
        grupos[grupoId].apuestasExtras = {};
    }
    
    grupos[grupoId].apuestasExtras[participante] = limite;
    await guardarGrupos(grupos);
    return true;
}

export async function getApuestasExtrasDelGrupo(grupoId) {
    const grupo = await getGrupo(grupoId);
    if (!grupo) return {};
    return grupo.apuestasExtras || {};
}

// ============ GRUPO GENERAL ============

export async function obtenerGrupoGeneral() {
    const grupos = await getGrupos();
    
    if (!grupos['general']) {
        const nuevoGrupo = {
            nombre: "🏆 GRUPO GENERAL - POZO MAYOR 🏆",
            codigo: "GENERAL",
            descripcion: "Grupo principal con pozo mayor. ¡Participa y gana grandes premios!",
            reglas: {
                puntosExacto: 5,
                puntosGanador: 2,
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
    const grupos = await getGrupos();
    let grupoGeneral = grupos['general'];
    
    if (!grupoGeneral) {
        await obtenerGrupoGeneral();
        const gruposActualizados = await getGrupos();
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

