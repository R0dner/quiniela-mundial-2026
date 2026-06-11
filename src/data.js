// src/data.js - Mundial 2026 FECHAS Y HORARIOS REALES

export const banderas = {
    "Argentina": "https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/ar.svg",
    "Brasil": "https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/br.svg",
    "Uruguay": "https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/uy.svg",
    "Colombia": "https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/co.svg",
    "Chile": "https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/cl.svg",
    "Perú": "https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/pe.svg",
    "Ecuador": "https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/ec.svg",
    "Paraguay": "https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/py.svg",
    "Venezuela": "https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/ve.svg",
    "Bolivia": "https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/bo.svg",
    "México": "https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/mx.svg",
    "USA": "https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/us.svg",
    "Canadá": "https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/ca.svg",
    "Costa Rica": "https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/cr.svg",
    "Panamá": "https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/pa.svg",
    "Alemania": "https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/de.svg",
    "España": "https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/es.svg",
    "Francia": "https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/fr.svg",
    "Inglaterra": "https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/gb-eng.svg",
    "Italia": "https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/it.svg",
    "Países Bajos": "https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/nl.svg",
    "Portugal": "https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/pt.svg",
    "Bélgica": "https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/be.svg",
    "Croacia": "https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/hr.svg",
    "Suiza": "https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/ch.svg",
    "Dinamarca": "https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/dk.svg",
    "Suecia": "https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/se.svg",
    "Polonia": "https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/pl.svg",
    "Senegal": "https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/sn.svg",
    "Marruecos": "https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/ma.svg",
    "Nigeria": "https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/ng.svg",
    "Japón": "https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/jp.svg",
    "Corea del Sur": "https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/kr.svg",
    "Australia": "https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/au.svg",
    "Nueva Zelanda": "https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/nz.svg",
    "Arabia Saudita": "https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/sa.svg",
    "Irán": "https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/ir.svg",
    "Ghana": "https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/gh.svg",
    "Camerún": "https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/cm.svg"
};

export const conBandera = (equipo) => {
    if (!equipo) return equipo;
    if (equipo.includes("° Grupo") || equipo.includes("Ganador") || equipo.includes("Perdedor") || 
        equipo.includes("O1") || equipo.includes("O2") || equipo.includes("O3") || equipo.includes("O4") ||
        equipo.includes("O5") || equipo.includes("O6") || equipo.includes("O7") || equipo.includes("O8") ||
        equipo.includes("C1") || equipo.includes("C2") || equipo.includes("C3") || equipo.includes("C4") ||
        equipo.includes("S1") || equipo.includes("S2")) {
        return equipo;
    }
    const banderaUrl = banderas[equipo];
    if (banderaUrl) {
        return `<img src="${banderaUrl}" class="flag-icon" alt="${equipo}" title="${equipo}"> ${equipo}`;
    }
    return equipo;
};

// FECHAS Y HORARIOS REALES DEL MUNDIAL 2026
export const todosLosPartidos = [
    // JUEVES 11 DE JUNIO - PARTIDO INAUGURAL
    { id: 1, fecha: "2026-06-11", hora: "14:00", fase: "grupos", local: "México", visitante: "Canadá", grupo: "A", estadio: "Estadio Azteca, Ciudad de México" },
    { id: 2, fecha: "2026-06-11", hora: "17:00", fase: "grupos", local: "USA", visitante: "Costa Rica", grupo: "A", estadio: "SoFi Stadium, Los Ángeles" },
    
    // VIERNES 12 DE JUNIO
    { id: 3, fecha: "2026-06-12", hora: "12:00", fase: "grupos", local: "Argentina", visitante: "Chile", grupo: "B", estadio: "MetLife Stadium, Nueva Jersey" },
    { id: 4, fecha: "2026-06-12", hora: "15:00", fase: "grupos", local: "Brasil", visitante: "Colombia", grupo: "B", estadio: "Hard Rock Stadium, Miami" },
    { id: 5, fecha: "2026-06-12", hora: "18:00", fase: "grupos", local: "Alemania", visitante: "España", grupo: "C", estadio: "AT&T Stadium, Dallas" },
    
    // SÁBADO 13 DE JUNIO
    { id: 6, fecha: "2026-06-13", hora: "12:00", fase: "grupos", local: "Francia", visitante: "Países Bajos", grupo: "C", estadio: "Mercedes-Benz Stadium, Atlanta" },
    { id: 7, fecha: "2026-06-13", hora: "15:00", fase: "grupos", local: "Inglaterra", visitante: "Italia", grupo: "D", estadio: "Levi's Stadium, San Francisco" },
    { id: 8, fecha: "2026-06-13", hora: "18:00", fase: "grupos", local: "Portugal", visitante: "Bélgica", grupo: "D", estadio: "BC Place, Vancouver" },
    
    // DOMINGO 14 DE JUNIO
    { id: 9, fecha: "2026-06-14", hora: "13:00", fase: "grupos", local: "Uruguay", visitante: "Ecuador", grupo: "E", estadio: "Estadio BBVA, Monterrey" },
    { id: 10, fecha: "2026-06-14", hora: "16:00", fase: "grupos", local: "Japón", visitante: "Corea del Sur", grupo: "E", estadio: "BMO Field, Toronto" },
    { id: 11, fecha: "2026-06-14", hora: "19:00", fase: "grupos", local: "Senegal", visitante: "Marruecos", grupo: "F", estadio: "Estadio Akron, Guadalajara" },
    
    // LUNES 15 DE JUNIO
    { id: 12, fecha: "2026-06-15", hora: "14:00", fase: "grupos", local: "Canadá", visitante: "USA", grupo: "A", estadio: "Lumen Field, Seattle" },
    { id: 13, fecha: "2026-06-15", hora: "17:00", fase: "grupos", local: "Costa Rica", visitante: "México", grupo: "A", estadio: "Estadio Azteca, Ciudad de México" },
    { id: 14, fecha: "2026-06-15", hora: "20:00", fase: "grupos", local: "Nigeria", visitante: "Ghana", grupo: "F", estadio: "NRG Stadium, Houston" },
    
    // MARTES 16 DE JUNIO
    { id: 15, fecha: "2026-06-16", hora: "13:00", fase: "grupos", local: "Chile", visitante: "Brasil", grupo: "B", estadio: "Arrowhead Stadium, Kansas City" },
    { id: 16, fecha: "2026-06-16", hora: "16:00", fase: "grupos", local: "Colombia", visitante: "Argentina", grupo: "B", estadio: "Gillette Stadium, Boston" },
    { id: 17, fecha: "2026-06-16", hora: "19:00", fase: "grupos", local: "Países Bajos", visitante: "Alemania", grupo: "C", estadio: "Lincoln Financial Field, Filadelfia" },
    
    // MIÉRCOLES 17 DE JUNIO
    { id: 18, fecha: "2026-06-17", hora: "14:00", fase: "grupos", local: "España", visitante: "Francia", grupo: "C", estadio: "MetLife Stadium, Nueva Jersey" },
    { id: 19, fecha: "2026-06-17", hora: "17:00", fase: "grupos", local: "Italia", visitante: "Portugal", grupo: "D", estadio: "Hard Rock Stadium, Miami" },
    { id: 20, fecha: "2026-06-17", hora: "20:00", fase: "grupos", local: "Bélgica", visitante: "Inglaterra", grupo: "D", estadio: "SoFi Stadium, Los Ángeles" },
    
    // JUEVES 18 DE JUNIO
    { id: 21, fecha: "2026-06-18", hora: "13:00", fase: "grupos", local: "Ecuador", visitante: "Japón", grupo: "E", estadio: "BC Place, Vancouver" },
    { id: 22, fecha: "2026-06-18", hora: "16:00", fase: "grupos", local: "Corea del Sur", visitante: "Uruguay", grupo: "E", estadio: "Estadio BBVA, Monterrey" },
    { id: 23, fecha: "2026-06-18", hora: "19:00", fase: "grupos", local: "Marruecos", visitante: "Nigeria", grupo: "F", estadio: "BMO Field, Toronto" },
    
    // VIERNES 19 DE JUNIO
    { id: 24, fecha: "2026-06-19", hora: "14:00", fase: "grupos", local: "México", visitante: "USA", grupo: "A", estadio: "Estadio Azteca, Ciudad de México" },
    { id: 25, fecha: "2026-06-19", hora: "17:00", fase: "grupos", local: "Canadá", visitante: "Costa Rica", grupo: "A", estadio: "Lumen Field, Seattle" },
    { id: 26, fecha: "2026-06-19", hora: "20:00", fase: "grupos", local: "Argentina", visitante: "Brasil", grupo: "B", estadio: "AT&T Stadium, Dallas" },
    
    // SÁBADO 20 DE JUNIO
    { id: 27, fecha: "2026-06-20", hora: "13:00", fase: "grupos", local: "Chile", visitante: "Colombia", grupo: "B", estadio: "Mercedes-Benz Stadium, Atlanta" },
    { id: 28, fecha: "2026-06-20", hora: "16:00", fase: "grupos", local: "Francia", visitante: "Alemania", grupo: "C", estadio: "Levi's Stadium, San Francisco" },
    { id: 29, fecha: "2026-06-20", hora: "19:00", fase: "grupos", local: "Países Bajos", visitante: "España", grupo: "C", estadio: "NRG Stadium, Houston" },
    
    // DOMINGO 21 DE JUNIO - ÚLTIMA JORNADA GRUPOS
    { id: 30, fecha: "2026-06-21", hora: "14:00", fase: "grupos", local: "Inglaterra", visitante: "Portugal", grupo: "D", estadio: "Gillette Stadium, Boston" },
    { id: 31, fecha: "2026-06-21", hora: "17:00", fase: "grupos", local: "Italia", visitante: "Bélgica", grupo: "D", estadio: "Arrowhead Stadium, Kansas City" },
    { id: 32, fecha: "2026-06-21", hora: "20:00", fase: "grupos", local: "Uruguay", visitante: "Japón", grupo: "E", estadio: "Lincoln Financial Field, Filadelfia" },
    { id: 33, fecha: "2026-06-21", hora: "20:00", fase: "grupos", local: "Ecuador", visitante: "Corea del Sur", grupo: "E", estadio: "Estadio Akron, Guadalajara" },
    
    // OCTAVOS DE FINAL
    { id: 34, fecha: "2026-06-27", hora: "13:00", fase: "octavos", local: "1° Grupo A", visitante: "2° Grupo B", estadio: "Estadio Azteca, Ciudad de México" },
    { id: 35, fecha: "2026-06-27", hora: "17:00", fase: "octavos", local: "1° Grupo C", visitante: "2° Grupo D", estadio: "SoFi Stadium, Los Ángeles" },
    { id: 36, fecha: "2026-06-28", hora: "13:00", fase: "octavos", local: "1° Grupo E", visitante: "2° Grupo F", estadio: "MetLife Stadium, Nueva Jersey" },
    { id: 37, fecha: "2026-06-28", hora: "17:00", fase: "octavos", local: "1° Grupo B", visitante: "2° Grupo A", estadio: "AT&T Stadium, Dallas" },
    { id: 38, fecha: "2026-06-29", hora: "13:00", fase: "octavos", local: "1° Grupo D", visitante: "2° Grupo C", estadio: "Hard Rock Stadium, Miami" },
    { id: 39, fecha: "2026-06-29", hora: "17:00", fase: "octavos", local: "1° Grupo F", visitante: "2° Grupo E", estadio: "BC Place, Vancouver" },
    { id: 40, fecha: "2026-06-30", hora: "13:00", fase: "octavos", local: "2° Grupo G", visitante: "1° Grupo H", estadio: "Mercedes-Benz Stadium, Atlanta" },
    { id: 41, fecha: "2026-06-30", hora: "17:00", fase: "octavos", local: "2° Grupo H", visitante: "1° Grupo G", estadio: "Levi's Stadium, San Francisco" },
    
    // CUARTOS DE FINAL
    { id: 42, fecha: "2026-07-03", hora: "14:00", fase: "cuartos", local: "Ganador O1", visitante: "Ganador O2", estadio: "Estadio BBVA, Monterrey" },
    { id: 43, fecha: "2026-07-03", hora: "18:00", fase: "cuartos", local: "Ganador O3", visitante: "Ganador O4", estadio: "SoFi Stadium, Los Ángeles" },
    { id: 44, fecha: "2026-07-04", hora: "14:00", fase: "cuartos", local: "Ganador O5", visitante: "Ganador O6", estadio: "MetLife Stadium, Nueva Jersey" },
    { id: 45, fecha: "2026-07-04", hora: "18:00", fase: "cuartos", local: "Ganador O7", visitante: "Ganador O8", estadio: "AT&T Stadium, Dallas" },
    
    // SEMIFINALES
    { id: 46, fecha: "2026-07-07", hora: "17:00", fase: "semis", local: "Ganador C1", visitante: "Ganador C2", estadio: "Estadio Azteca, Ciudad de México" },
    { id: 47, fecha: "2026-07-08", hora: "17:00", fase: "semis", local: "Ganador C3", visitante: "Ganador C4", estadio: "Hard Rock Stadium, Miami" },
    
    // TERCER PUESTO
    { id: 48, fecha: "2026-07-11", hora: "15:00", fase: "tercer", local: "Perdedor S1", visitante: "Perdedor S2", estadio: "BC Place, Vancouver" },
    
    // FINAL
    { id: 49, fecha: "2026-07-12", hora: "16:00", fase: "final", local: "Ganador S1", visitante: "Ganador S2", estadio: "MetLife Stadium, Nueva Jersey" }
];

export const partidosPorDia = () => {
    const porDia = {};
    todosLosPartidos.forEach(partido => {
        if (!porDia[partido.fecha]) {
            porDia[partido.fecha] = [];
        }
        porDia[partido.fecha].push(partido);
    });
    return porDia;
};

export const getDiasCalendario = () => {
    const dias = [...new Set(todosLosPartidos.map(p => p.fecha))];
    return dias.sort();
};

export const getPartidosPorDia = (fecha) => {
    return todosLosPartidos.filter(p => p.fecha === fecha);
};

// FUNCIONES DE FECHA - Sin problemas de zona horaria
export const getDiaActualLocal = () => {
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, '0');
    const day = String(hoy.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const isPartidoPasado = (fechaPartido) => {
    const [year, month, day] = fechaPartido.split('-');
    const fechaLocal = new Date(year, month - 1, day);
    
    const hoy = new Date();
    const hoyLocal = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    
    return fechaLocal < hoyLocal;
};

export const isPartidoActivo = (fechaPartido) => {
    const [year, month, day] = fechaPartido.split('-');
    const fechaLocal = new Date(year, month - 1, day);
    
    const hoy = new Date();
    const hoyLocal = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    
    return fechaLocal >= hoyLocal;
};

export const formatearFecha = (fecha) => {
    const [year, month, day] = fecha.split('-');
    const fechaObj = new Date(year, month - 1, day);
    const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return fechaObj.toLocaleDateString('es-ES', opciones);
};

export const getFaseNombre = (fase) => {
    const fases = {
        'grupos': 'Fase de Grupos',
        'octavos': 'Octavos de Final',
        'cuartos': 'Cuartos de Final',
        'semis': 'Semifinal',
        'final': 'FINAL',
        'tercer': 'Tercer Puesto'
    };
    return fases[fase] || fase;
};

// ========== FUNCIONES PARA CONTROL DE HORARIO ==========

// Obtener fecha y hora completa del partido (fecha local)
export const getFechaHoraPartido = (fechaPartido, horaPartido) => {
    const [year, month, day] = fechaPartido.split('-');
    const [hour, minute] = horaPartido.split(':');
    return new Date(year, month - 1, day, parseInt(hour), parseInt(minute || '0'));
};

// Verificar si el partido ya comenzó (o ya pasó la hora de inicio)
export const isPartidoComenzado = (fechaPartido, horaPartido) => {
    const fechaHoraPartido = getFechaHoraPartido(fechaPartido, horaPartido);
    const ahora = new Date();
    return ahora >= fechaHoraPartido;
};

// Verificar si aún se puede apostar (antes del inicio del partido)
export const puedeApostarPartido = (fechaPartido, horaPartido) => {
    const fechaHoraPartido = getFechaHoraPartido(fechaPartido, horaPartido);
    const ahora = new Date();
    return ahora < fechaHoraPartido;
};

// Verificar si el día tiene al menos un partido que aún no ha comenzado
export const hayPartidosDisponiblesParaApostar = (fecha) => {
    const partidos = getPartidosPorDia(fecha);
    return partidos.some(partido => puedeApostarPartido(partido.fecha, partido.hora));
};

// Obtener el estado actual de un partido
export const getEstadoPartido = (fechaPartido, horaPartido) => {
    const fechaHoraPartido = getFechaHoraPartido(fechaPartido, horaPartido);
    const ahora = new Date();
    
    if (ahora < fechaHoraPartido) {
        return 'pendiente';
    } else {
        return 'finalizado';
    }
};

// ========== CONEXIÓN CON EL SISTEMA DE GRUPOS ==========
// Esto permite que groups.js acceda a los partidos para el ranking diario
import { setPartidosGlobal } from './groups.js';

// Exportar los partidos para que estén disponibles globalmente
setPartidosGlobal(todosLosPartidos);

// También exportar una función para obtener los partidos
export const getTodosLosPartidos = () => todosLosPartidos;