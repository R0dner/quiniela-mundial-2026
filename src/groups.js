// src/groups.js - Sistema de grupos SIN CONTRASEÑAS (auto-registro de usuarios)

const GRUPOS_INICIALES = {};

let todosLosPartidosGlobal = [];

export function setPartidosGlobal(partidos) {
    todosLosPartidosGlobal = partidos;
}

// ============ GRUPOS ============

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

export function crearGrupo(grupoId, config) {
    const grupos = getGrupos();
    if (grupos[grupoId]) {
        throw new Error(`El grupo ${grupoId} ya existe`);
    }
    if (!grupoId || grupoId.trim() === '') {
        throw new Error('El ID del grupo es obligatorio');
    }
    grupos[grupoId] = {
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
    guardarGrupos(grupos);
    return grupos[grupoId];
}

export function eliminarGrupo(grupoId) {
    const grupos = getGrupos();
    if (!grupos[grupoId]) {
        throw new Error(`El grupo ${grupoId} no existe`);
    }
    delete grupos[grupoId];
    guardarGrupos(grupos);
}

// ============ AUTO-REGISTRO DE PARTICIPANTES ============

export function registrarParticipanteEnGrupo(grupoId, nombre, telefono = '') {
    const grupos = getGrupos();
    if (!grupos[grupoId]) return { success: false, message: 'El grupo no existe' };
    
    const nombreNormalizado = nombre.trim();
    if (!nombreNormalizado) {
        return { success: false, message: 'El nombre es obligatorio' };
    }
    
    const existe = grupos[grupoId].participantes.some(
        p => p.toLowerCase() === nombreNormalizado.toLowerCase()
    );
    
    if (existe) {
        return { success: false, message: 'Ya estás registrado en este grupo' };
    }
    
    grupos[grupoId].participantes.push(nombreNormalizado);
    
    if (!grupos[grupoId].participantesInfo) {
        grupos[grupoId].participantesInfo = {};
    }
    
    grupos[grupoId].participantesInfo[nombreNormalizado] = {
        telefono: telefono,
        fechaRegistro: new Date().toISOString()
    };
    
    guardarGrupos(grupos);
    return { success: true, message: `¡Bienvenido ${nombreNormalizado}!` };
}

export function participanteRegistrado(grupoId, nombre) {
    const grupo = getGrupo(grupoId);
    if (!grupo) return false;
    return grupo.participantes.some(p => p.toLowerCase() === nombre.toLowerCase());
}

export function getParticipantesDelGrupo(grupoId) {
    const grupo = getGrupo(grupoId);
    return grupo ? grupo.participantes : [];
}

export function getInfoParticipante(grupoId, nombre) {
    const grupo = getGrupo(grupoId);
    if (!grupo) return null;
    return grupo.participantesInfo?.[nombre] || { telefono: '', fechaRegistro: '' };
}

export function eliminarParticipanteDeGrupo(grupoId, nombre) {
    const grupos = getGrupos();
    if (!grupos[grupoId]) return false;
    
    const index = grupos[grupoId].participantes.findIndex(
        p => p.toLowerCase() === nombre.toLowerCase()
    );
    
    if (index !== -1) {
        grupos[grupoId].participantes.splice(index, 1);
        if (grupos[grupoId].participantesInfo?.[nombre]) {
            delete grupos[grupoId].participantesInfo[nombre];
        }
        if (grupos[grupoId].apuestas[nombre]) {
            delete grupos[grupoId].apuestas[nombre];
        }
        guardarGrupos(grupos);
        return true;
    }
    return false;
}

// ============ LÍMITE DE APUESTAS EXTRA ============

export function getLimiteApuestasParticipante(grupoId, participante) {
    const grupo = getGrupo(grupoId);
    if (!grupo) return 1;
    
    if (!grupo.apuestasExtras) {
        grupo.apuestasExtras = {};
    }
    
    return grupo.apuestasExtras[participante] || 1;
}

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

export function getApuestasExtrasDelGrupo(grupoId) {
    const grupo = getGrupo(grupoId);
    if (!grupo) return {};
    return grupo.apuestasExtras || {};
}

// ============ APUESTAS ============

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

// ============ RESULTADOS ============

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

// ============ CÁLCULO DE PUNTOS Y RANKING ============

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

export function getRankingDelGrupo(grupoId) {
    const grupo = getGrupo(grupoId);
    if (!grupo) return [];
    
    const ranking = grupo.participantes.map(participante => {
        return {
            nombre: participante,
            puntos: calcularPuntosMultiples(grupoId, participante),
            telefono: grupo.participantesInfo?.[participante]?.telefono || '',
            fechaRegistro: grupo.participantesInfo?.[participante]?.fechaRegistro || ''
        };
    });
    
    ranking.sort((a, b) => b.puntos - a.puntos);
    
    return ranking.map((item, index) => ({
        ...item,
        posicion: index + 1
    }));
}

export function getRankingDelGrupoPorDia(grupoId, fecha) {
    const grupo = getGrupo(grupoId);
    if (!grupo) return [];
    
    const partidosDeFecha = todosLosPartidosGlobal.filter(p => p.fecha === fecha);
    const partidosIds = partidosDeFecha.map(p => p.id);
    
    const ranking = grupo.participantes.map(participante => {
        let puntos = 0;
        const apuestasPorPartido = grupo.apuestas[participante] || {};
        const resultados = grupo.resultados || {};
        const reglas = grupo.reglas;
        
        for (const partidoId of partidosIds) {
            const apuestas = apuestasPorPartido[partidoId];
            const resultado = resultados[partidoId];
            if (apuestas && Array.isArray(apuestas) && resultado) {
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
        
        return {
            nombre: participante,
            puntos: puntos,
            telefono: grupo.participantesInfo?.[participante]?.telefono || ''
        };
    });
    
    ranking.sort((a, b) => b.puntos - a.puntos);
    
    return ranking.map((item, index) => ({
        ...item,
        posicion: index + 1
    }));
}

// ============ REGLAS Y PREMIOS ============

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

// ============ GRUPO GENERAL (ESPECIAL) ============

export function obtenerGrupoGeneral() {
    const grupos = getGrupos();
    
    if (!grupos['general']) {
        grupos['general'] = {
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
        guardarGrupos(grupos);
        console.log('✅ Grupo General creado automáticamente con pozo mayor');
    }
    
    return grupos['general'];
}

export function unirseAlGrupoGeneral(nombre, telefono = '') {
    const grupos = getGrupos();
    let grupoGeneral = grupos['general'];
    
    if (!grupoGeneral) {
        obtenerGrupoGeneral();
        grupoGeneral = grupos['general'];
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
    
    guardarGrupos(grupos);
    return { success: true, message: `🎉 ¡Bienvenido al GRUPO GENERAL! 🎉\nTienes premios mayores y puntos extra.` };
}

export function esGrupoGeneral(grupoId) {
    const grupo = getGrupo(grupoId);
    return grupo ? grupo.esGrupoGeneral === true : false;
}

export function getEstadisticasGrupoGeneral() {
    const grupo = getGrupo('general');
    if (!grupo) return null;
    
    const totalParticipantes = grupo.participantes.length;
    const totalApuestas = Object.values(grupo.apuestas || {}).reduce((sum, p) => 
        sum + Object.keys(p).length, 0);
    
    return {
        totalParticipantes,
        totalApuestas,
        premioPrimero: grupo.premios.primero,
        premioSegundo: grupo.premios.segundo,
        premioTercero: grupo.premios.tercero,
        puntosExacto: grupo.reglas.puntosExacto,
        puntosGanador: grupo.reglas.puntosGanador
    };
}