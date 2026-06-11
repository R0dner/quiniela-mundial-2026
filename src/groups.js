// src/groups.js - Sistema de grupos con contraseñas y LÍMITES POR PARTICIPANTE

const GRUPOS_INICIALES = {};

let todosLosPartidosGlobal = [];

export function setPartidosGlobal(partidos) {
    todosLosPartidosGlobal = partidos;
}

export function getGrupos() {
    const gruposGuardados = localStorage.getItem('quiniela_grupos');
    if (gruposGuardados) {
        return JSON.parse(gruposGuardados);
    }
    return { ...GRUPOS_INICIALES };
}

export function guardarGrupos(grupos) {
    localStorage.setItem('quiniela_grupos', JSON.stringify(grupos));
    window.dispatchEvent(new Event('grupos-actualizados'));
}

export function getGrupo(grupoId) {
    const grupos = getGrupos();
    return grupos[grupoId];
}

export function grupoExiste(grupoId) {
    const grupos = getGrupos();
    return grupos.hasOwnProperty(grupoId);
}

export function crearGrupo(grupoId, config) {
    const grupos = getGrupos();
    if (grupos[grupoId]) {
        throw new Error(`El grupo ${grupoId} ya existe`);
    }
    if (!grupoId || grupoId.trim() === '') {
        throw new Error('El ID del grupo es obligatorio');
    }
    if (!config.contrasena || config.contrasena.trim() === '') {
        throw new Error('La contraseña del grupo es obligatoria');
    }
    grupos[grupoId] = {
        nombre: config.nombre,
        codigo: config.codigo || grupoId.toUpperCase(),
        contrasena: config.contrasena,
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
        participantesTelefonos: {},
        apuestas: {},
        resultados: {},
        apuestasExtras: {},
        fechaCreacion: new Date().toISOString(),
        activo: true
    };
    guardarGrupos(grupos);
    return grupos[grupoId];
}

export function validarContrasenaGrupo(grupoId, contrasena) {
    const grupo = getGrupo(grupoId);
    if (!grupo) return false;
    return grupo.contrasena === contrasena;
}

export function eliminarGrupo(grupoId) {
    const grupos = getGrupos();
    if (!grupos[grupoId]) {
        throw new Error(`El grupo ${grupoId} no existe`);
    }
    delete grupos[grupoId];
    guardarGrupos(grupos);
}

export function actualizarContrasenaGrupo(grupoId, nuevaContrasena) {
    const grupos = getGrupos();
    if (!grupos[grupoId]) return false;
    grupos[grupoId].contrasena = nuevaContrasena;
    guardarGrupos(grupos);
    return true;
}

// ============ PARTICIPANTES POR GRUPO ============

export function getParticipantesDelGrupo(grupoId) {
    const grupo = getGrupo(grupoId);
    return grupo ? grupo.participantes : [];
}

export function getTelefonoParticipante(grupoId, nombre) {
    const grupo = getGrupo(grupoId);
    if (!grupo) return '';
    return grupo.participantesTelefonos?.[nombre] || '';
}

export function agregarParticipanteAGrupo(grupoId, nombre, telefono = '') {
    const grupos = getGrupos();
    if (!grupos[grupoId]) return false;
    
    const nombreNormalizado = nombre.trim();
    const existe = grupos[grupoId].participantes.some(
        p => p.toLowerCase() === nombreNormalizado.toLowerCase()
    );
    
    if (!existe) {
        grupos[grupoId].participantes.push(nombreNormalizado);
        if (!grupos[grupoId].participantesTelefonos) {
            grupos[grupoId].participantesTelefonos = {};
        }
        grupos[grupoId].participantesTelefonos[nombreNormalizado] = telefono;
        guardarGrupos(grupos);
        return true;
    }
    return false;
}

export function actualizarTelefonoParticipante(grupoId, nombre, telefono) {
    const grupos = getGrupos();
    if (!grupos[grupoId]) return false;
    
    if (!grupos[grupoId].participantesTelefonos) {
        grupos[grupoId].participantesTelefonos = {};
    }
    
    grupos[grupoId].participantesTelefonos[nombre.trim()] = telefono;
    guardarGrupos(grupos);
    return true;
}

export function eliminarParticipanteDeGrupo(grupoId, nombre) {
    const grupos = getGrupos();
    if (!grupos[grupoId]) return false;
    
    const index = grupos[grupoId].participantes.findIndex(
        p => p.toLowerCase() === nombre.toLowerCase()
    );
    
    if (index !== -1) {
        grupos[grupoId].participantes.splice(index, 1);
        if (grupos[grupoId].participantesTelefonos?.[nombre]) {
            delete grupos[grupoId].participantesTelefonos[nombre];
        }
        if (grupos[grupoId].apuestas[nombre]) {
            delete grupos[grupoId].apuestas[nombre];
        }
        if (grupos[grupoId].apuestasExtras?.[nombre]) {
            delete grupos[grupoId].apuestasExtras[nombre];
        }
        guardarGrupos(grupos);
        return true;
    }
    return false;
}

// ============ LÍMITE DE APUESTAS POR PARTICIPANTE ============

// Obtener límite de apuestas por participante (1 = normal, más = con apuestas extra)
export function getLimiteApuestasParticipante(grupoId, participante) {
    const grupo = getGrupo(grupoId);
    if (!grupo) return 1;
    
    if (!grupo.apuestasExtras) {
        grupo.apuestasExtras = {};
    }
    
    return grupo.apuestasExtras[participante] || 1;
}

// Actualizar límite de apuestas para un participante (admin)
export function actualizarLimiteApuestasParticipante(grupoId, participante, limite) {
    const grupos = getGrupos();
    if (!grupos[grupoId]) return false;
    
    if (!grupos[grupoId].apuestasExtras) {
        grupos[grupoId].apuestasExtras = {};
    }
    
    grupos[grupoId].apuestasExtras[participante] = limite;
    guardarGrupos(grupos);
    return true;
}

// Verificar si un participante puede agregar más apuestas
export function puedeAgregarApuesta(grupoId, participante, partidoId) {
    const limite = getLimiteApuestasParticipante(grupoId, participante);
    const apuestasActuales = getApuestasDePartido(grupoId, participante, partidoId);
    return apuestasActuales.length < limite;
}

// Obtener información de apuestas extra de todos los participantes
export function getApuestasExtrasDelGrupo(grupoId) {
    const grupo = getGrupo(grupoId);
    if (!grupo) return {};
    return grupo.apuestasExtras || {};
}

// ============ MÚLTIPLES APUESTAS ============

// Agregar una nueva apuesta
export function agregarApuestaEnGrupo(grupoId, participante, partidoId, apuesta) {
    const grupos = getGrupos();
    if (!grupos[grupoId]) return false;
    
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
    
    guardarGrupos(grupos);
    return apuestaId;
}

export function getApuestasMultiplesDeParticipante(grupoId, participante) {
    const grupo = getGrupo(grupoId);
    if (!grupo || !grupo.apuestas[participante]) return {};
    return grupo.apuestas[participante];
}

export function getApuestasDePartido(grupoId, participante, partidoId) {
    const grupo = getGrupo(grupoId);
    if (!grupo || !grupo.apuestas[participante]) return [];
    return grupo.apuestas[participante][partidoId] || [];
}

export function eliminarApuesta(grupoId, participante, partidoId, apuestaId) {
    const grupos = getGrupos();
    if (!grupos[grupoId]) return false;
    
    const apuestasPartido = grupos[grupoId].apuestas[participante]?.[partidoId];
    if (apuestasPartido && Array.isArray(apuestasPartido)) {
        const index = apuestasPartido.findIndex(a => a.id === apuestaId);
        if (index !== -1) {
            apuestasPartido.splice(index, 1);
            if (apuestasPartido.length === 0) {
                delete grupos[grupoId].apuestas[participante][partidoId];
            }
            guardarGrupos(grupos);
            return true;
        }
    }
    return false;
}

// ============ CÁLCULO DE PUNTOS ============

export function calcularPuntosMultiples(grupoId, participante) {
    const grupo = getGrupo(grupoId);
    if (!grupo) return 0;
    
    const apuestasPorPartido = grupo.apuestas[participante] || {};
    const resultados = grupo.resultados || {};
    const reglas = grupo.reglas;
    
    let puntos = 0;
    
    for (const [partidoId, apuestas] of Object.entries(apuestasPorPartido)) {
        const resultado = resultados[partidoId];
        if (resultado && Array.isArray(apuestas)) {
            for (const apuesta of apuestas) {
                if (apuesta.local === resultado.local && apuesta.visitante === resultado.visitante) {
                    puntos += reglas.puntosExacto;
                }
                else if (
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

export function calcularPuntosMultiplesPorDia(grupoId, participante, fecha) {
    const grupo = getGrupo(grupoId);
    if (!grupo) return 0;
    
    const apuestasPorPartido = grupo.apuestas[participante] || {};
    const resultados = grupo.resultados || {};
    const reglas = grupo.reglas;
    
    let puntos = 0;
    
    for (const [partidoId, apuestas] of Object.entries(apuestasPorPartido)) {
        const partido = todosLosPartidosGlobal?.find(p => p.id === parseInt(partidoId));
        if (partido && partido.fecha === fecha) {
            const resultado = resultados[partidoId];
            if (resultado && Array.isArray(apuestas)) {
                for (const apuesta of apuestas) {
                    if (apuesta.local === resultado.local && apuesta.visitante === resultado.visitante) {
                        puntos += reglas.puntosExacto;
                    }
                    else if (
                        (apuesta.local > apuesta.visitante && resultado.local > resultado.visitante) ||
                        (apuesta.local < apuesta.visitante && resultado.local < resultado.visitante) ||
                        (apuesta.local === apuesta.visitante && resultado.local === resultado.visitante)
                    ) {
                        puntos += reglas.puntosGanador;
                    }
                }
            }
        }
    }
    
    return puntos;
}

export function getRankingMultiple(grupoId) {
    const grupo = getGrupo(grupoId);
    if (!grupo) return [];
    
    const ranking = grupo.participantes.map(participante => {
        return {
            nombre: participante,
            puntos: calcularPuntosMultiples(grupoId, participante),
            telefono: grupo.participantesTelefonos?.[participante] || '',
            limiteApuestas: getLimiteApuestasParticipante(grupoId, participante)
        };
    });
    
    ranking.sort((a, b) => b.puntos - a.puntos);
    
    return ranking.map((item, index) => ({
        ...item,
        posicion: index + 1
    }));
}

export function getRankingMultiplePorDia(grupoId, fecha) {
    const grupo = getGrupo(grupoId);
    if (!grupo) return [];
    
    const ranking = grupo.participantes.map(participante => {
        return {
            nombre: participante,
            puntos: calcularPuntosMultiplesPorDia(grupoId, participante, fecha),
            telefono: grupo.participantesTelefonos?.[participante] || ''
        };
    });
    
    ranking.sort((a, b) => b.puntos - a.puntos);
    
    return ranking.map((item, index) => ({
        ...item,
        posicion: index + 1
    }));
}

export function getRankingDelGrupo(grupoId) {
    return getRankingMultiple(grupoId);
}

export function getRankingDelGrupoPorDia(grupoId, fecha) {
    return getRankingMultiplePorDia(grupoId, fecha);
}

// ============ RESULTADOS POR GRUPO ============

export function guardarResultadoEnGrupo(grupoId, partidoId, resultado) {
    const grupos = getGrupos();
    if (!grupos[grupoId]) return false;
    
    if (!grupos[grupoId].resultados) {
        grupos[grupoId].resultados = {};
    }
    
    grupos[grupoId].resultados[partidoId] = resultado;
    guardarGrupos(grupos);
    return true;
}

export function getResultadosDelGrupo(grupoId) {
    const grupo = getGrupo(grupoId);
    return grupo ? grupo.resultados || {} : {};
}

// ============ PREMIOS ============

export function getPremiosDelGrupo(grupoId) {
    const grupo = getGrupo(grupoId);
    return grupo ? grupo.premios : { 
        cantidadGanadores: 3,
        primero: 50, 
        segundo: 30, 
        tercero: 20 
    };
}

export function actualizarPremiosDelGrupo(grupoId, nuevosPremios) {
    const grupos = getGrupos();
    if (!grupos[grupoId]) return false;
    
    grupos[grupoId].premios = {
        ...grupos[grupoId].premios,
        ...nuevosPremios
    };
    guardarGrupos(grupos);
    return true;
}

// ============ REGLAS ============

export function actualizarReglasDelGrupo(grupoId, nuevasReglas) {
    const grupos = getGrupos();
    if (!grupos[grupoId]) return false;
    
    grupos[grupoId].reglas = {
        ...grupos[grupoId].reglas,
        ...nuevasReglas
    };
    guardarGrupos(grupos);
    return true;
}

export function getReglasDelGrupo(grupoId) {
    const grupo = getGrupo(grupoId);
    return grupo ? grupo.reglas : { puntosExacto: 3, puntosGanador: 1 };
}

// ============ VALIDACIONES ============

export function participantePerteneceAlGrupo(grupoId, nombre) {
    const grupo = getGrupo(grupoId);
    if (!grupo) return false;
    return grupo.participantes.some(p => p.toLowerCase() === nombre.toLowerCase());
}

export function getGruposDelParticipante(nombre) {
    const grupos = getGrupos();
    const gruposDelParticipante = [];
    
    for (const [groupId, grupo] of Object.entries(grupos)) {
        if (grupo.participantes.some(p => p.toLowerCase() === nombre.toLowerCase())) {
            gruposDelParticipante.push({
                id: groupId,
                nombre: grupo.nombre,
                codigo: grupo.codigo
            });
        }
    }
    
    return gruposDelParticipante;
}

export function exportarGrupo(grupoId) {
    const grupo = getGrupo(grupoId);
    if (!grupo) return null;
    return JSON.stringify(grupo, null, 2);
}

export function importarGrupo(grupoId, dataJson) {
    try {
        const grupoData = JSON.parse(dataJson);
        const grupos = getGrupos();
        grupos[grupoId] = grupoData;
        guardarGrupos(grupos);
        return true;
    } catch (error) {
        console.error('Error al importar grupo:', error);
        return false;
    }
}