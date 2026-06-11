// src/jornada.js - Utilidades para gestión de jornadas
import { partidosPorJornada, obtenerPartidosPorJornada } from './data.js';

export const getInfoJornada = (jornadaNum) => {
    const partidos = obtenerPartidosPorJornada(jornadaNum);
    if (partidos.length === 0) return null;
    
    const fechas = partidos.map(p => p.fecha);
    const fechaInicio = fechas.sort()[0];
    const fechaFin = fechas.sort()[fechas.length - 1];
    
    return {
        numero: jornadaNum,
        partidos: partidos.length,
        fechaInicio,
        fechaFin,
        fase: partidos[0]?.fase || 'desconocida'
    };
};

export const getAllJornadasInfo = () => {
    const jornadas = [];
    for (let i = 1; i <= 7; i++) {
        const info = getInfoJornada(i);
        if (info) jornadas.push(info);
    }
    return jornadas;
};

export const getNombreJornada = (jornadaNum) => {
    const nombres = {
        1: '📅 Jornada 1 - Fase Grupos (Días 1-3)',
        2: '📅 Jornada 2 - Fase Grupos (Días 4-6)',
        3: '📅 Jornada 3 - Fase Grupos (Días 7-9)',
        4: '🏆 Octavos de Final',
        5: '🏆 Cuartos de Final',
        6: '🏆 Semifinales',
        7: '🏆 Final y Tercer Puesto'
    };
    return nombres[jornadaNum] || `Jornada ${jornadaNum}`;
};

export const getResumenApuestasPorJornada = (apuestas, jornadaNum) => {
    const partidosJornada = obtenerPartidosPorJornada(jornadaNum);
    const apuestasJornada = {};
    
    partidosJornada.forEach(partido => {
        if (apuestas[partido.id]) {
            apuestasJornada[partido.id] = apuestas[partido.id];
        }
    });
    
    return {
        totalPartidos: partidosJornada.length,
        partidosApostados: Object.keys(apuestasJornada).length,
        apuestas: apuestasJornada
    };
};