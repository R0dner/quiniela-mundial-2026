// src/data.js - Mundial 2026 FECHAS Y HORARIOS REALES (según FIFA.com)
// Horarios convertidos a hora de Bolivia (GMT-4)

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
    "Camerún": "https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/cm.svg",
    "Sudáfrica": "https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/za.svg",
    "República Checa": "https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/cz.svg",
    "Bosnia y Herzegovina": "https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/ba.svg",
    "Catar": "https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/qa.svg",
    "Haití": "https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/ht.svg",
    "Escocia": "https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/gb-sct.svg",
    "Turquía": "https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/tr.svg",
    "Curazao": "https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/cw.svg",
    "Costa de Marfil": "https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/ci.svg",
    "Túnez": "https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/tn.svg",
    "Cabo Verde": "https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/cv.svg",
    "Egipto": "https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/eg.svg",
    "Irak": "https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/iq.svg",
    "Noruega": "https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/no.svg",
    "Argelia": "https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/dz.svg",
    "Austria": "https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/at.svg",
    "Jordania": "https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/jo.svg",
    "RD Congo": "https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/cd.svg",
    "Uzbekistán": "https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/uz.svg"
};

// Función optimizada con expresión regular
export const conBandera = (equipo) => {
    if (!equipo) return equipo;
    // Excluye placeholders de eliminatorias (más fácil de mantener)
    if (/[°°] Grupo|Ganador|Perdedor|O[1-8]|C[1-4]|S[1-2]/.test(equipo)) {
        return equipo;
    }
    const banderaUrl = banderas[equipo];
    if (banderaUrl) {
        return `<img src="${banderaUrl}" class="flag-icon" alt="${equipo}" title="${equipo}"> ${equipo}`;
    }
    return equipo;
};

// ========== FIXTURE COMPLETO CORREGIDO ==========
export const todosLosPartidos = [
    // ========== GRUPO A ==========
    { id: 1, fecha: "2026-06-11", hora: "15:00", fase: "grupos", local: "México", visitante: "Sudáfrica", grupo: "A", estadio: "Estadio Azteca, Ciudad de México" },
    { id: 2, fecha: "2026-06-11", hora: "22:00", fase: "grupos", local: "Corea del Sur", visitante: "República Checa", grupo: "A", estadio: "Estadio Akron, Guadalajara" },
    { id: 3, fecha: "2026-06-16", hora: "21:00", fase: "grupos", local: "México", visitante: "Corea del Sur", grupo: "A", estadio: "Estadio Akron, Guadalajara" },
    { id: 4, fecha: "2026-06-17", hora: "12:00", fase: "grupos", local: "República Checa", visitante: "Sudáfrica", grupo: "A", estadio: "Mercedes-Benz Stadium, Atlanta" },
    { id: 5, fecha: "2026-06-21", hora: "21:00", fase: "grupos", local: "República Checa", visitante: "México", grupo: "A", estadio: "Estadio Azteca, Ciudad de México" },
    { id: 6, fecha: "2026-06-21", hora: "21:00", fase: "grupos", local: "Sudáfrica", visitante: "Corea del Sur", grupo: "A", estadio: "Estadio BBVA, Monterrey" },
    
    // ========== GRUPO B (CORREGIDO: se añade partido faltante y se ordena) ==========
    { id: 7, fecha: "2026-06-12", hora: "15:00", fase: "grupos", local: "Canadá", visitante: "Bosnia y Herzegovina", grupo: "B", estadio: "BMO Field, Toronto" },
    { id: 8, fecha: "2026-06-13", hora: "15:00", fase: "grupos", local: "Catar", visitante: "Suiza", grupo: "B", estadio: "Levi's Stadium, San Francisco" }, // CORREGIDO: Ahora grupo B
    { id: 9, fecha: "2026-06-18", hora: "18:00", fase: "grupos", local: "Canadá", visitante: "Catar", grupo: "B", estadio: "BC Place, Vancouver" },
    { id: 10, fecha: "2026-06-18", hora: "15:00", fase: "grupos", local: "Suiza", visitante: "Bosnia y Herzegovina", grupo: "B", estadio: "SoFi Stadium, Los Ángeles" },
    { id: 11, fecha: "2026-06-21", hora: "15:00", fase: "grupos", local: "Suiza", visitante: "Canadá", grupo: "B", estadio: "BC Place, Vancouver" },
    { id: 12, fecha: "2026-06-21", hora: "15:00", fase: "grupos", local: "Bosnia y Herzegovina", visitante: "Catar", grupo: "B", estadio: "Lumen Field, Seattle" },
    
    // ========== GRUPO C (CORREGIDO: se añade el partido Catar vs Suiza que antes estaba mal ubicado) ==========
    // Nota: El partido Catar vs Suiza (id:8) ahora está en Grupo B. El Grupo C comienza con Brasil vs Marruecos.
    { id: 13, fecha: "2026-06-13", hora: "18:00", fase: "grupos", local: "Brasil", visitante: "Marruecos", grupo: "C", estadio: "MetLife Stadium, Nueva Jersey" },
    { id: 14, fecha: "2026-06-13", hora: "21:00", fase: "grupos", local: "Haití", visitante: "Escocia", grupo: "C", estadio: "Gillette Stadium, Boston" },
    { id: 15, fecha: "2026-06-17", hora: "18:00", fase: "grupos", local: "Escocia", visitante: "Marruecos", grupo: "C", estadio: "Gillette Stadium, Boston" },
    { id: 16, fecha: "2026-06-17", hora: "21:00", fase: "grupos", local: "Brasil", visitante: "Haití", grupo: "C", estadio: "Lincoln Financial Field, Filadelfia" },
    { id: 17, fecha: "2026-06-21", hora: "18:00", fase: "grupos", local: "Escocia", visitante: "Brasil", grupo: "C", estadio: "Hard Rock Stadium, Miami" },
    { id: 18, fecha: "2026-06-21", hora: "18:00", fase: "grupos", local: "Marruecos", visitante: "Haití", grupo: "C", estadio: "Mercedes-Benz Stadium, Atlanta" },
    
    // ========== GRUPO D (SIN DUPLICADOS) ==========
    { id: 19, fecha: "2026-06-12", hora: "21:00", fase: "grupos", local: "Estados Unidos", visitante: "Paraguay", grupo: "D", estadio: "SoFi Stadium, Los Ángeles" },
    { id: 20, fecha: "2026-06-14", hora: "00:00", fase: "grupos", local: "Australia", visitante: "Turquía", grupo: "D", estadio: "BC Place, Vancouver" }, // ID 20 (antes 16 y 23)
    { id: 21, fecha: "2026-06-16", hora: "15:00", fase: "grupos", local: "Estados Unidos", visitante: "Australia", grupo: "D", estadio: "Lumen Field, Seattle" },
    { id: 22, fecha: "2026-06-18", hora: "00:00", fase: "grupos", local: "Turquía", visitante: "Paraguay", grupo: "D", estadio: "Levi's Stadium, San Francisco" }, // ID 22 (antes 19 y 25)
    { id: 23, fecha: "2026-06-22", hora: "22:00", fase: "grupos", local: "Turquía", visitante: "Estados Unidos", grupo: "D", estadio: "SoFi Stadium, Los Ángeles" },
    { id: 24, fecha: "2026-06-22", hora: "22:00", fase: "grupos", local: "Paraguay", visitante: "Australia", grupo: "D", estadio: "Levi's Stadium, San Francisco" },
    
    // ========== GRUPO E ==========
    { id: 25, fecha: "2026-06-14", hora: "13:00", fase: "grupos", local: "Alemania", visitante: "Curazao", grupo: "E", estadio: "NRG Stadium, Houston" },
    { id: 26, fecha: "2026-06-14", hora: "19:00", fase: "grupos", local: "Costa de Marfil", visitante: "Ecuador", grupo: "E", estadio: "Lincoln Financial Field, Filadelfia" },
    { id: 27, fecha: "2026-06-18", hora: "16:00", fase: "grupos", local: "Alemania", visitante: "Costa de Marfil", grupo: "E", estadio: "BMO Field, Toronto" },
    { id: 28, fecha: "2026-06-18", hora: "22:00", fase: "grupos", local: "Ecuador", visitante: "Curazao", grupo: "E", estadio: "Arrowhead Stadium, Kansas City" },
    { id: 29, fecha: "2026-06-22", hora: "16:00", fase: "grupos", local: "Curazao", visitante: "Costa de Marfil", grupo: "E", estadio: "Lincoln Financial Field, Filadelfia" },
    { id: 30, fecha: "2026-06-22", hora: "16:00", fase: "grupos", local: "Ecuador", visitante: "Alemania", grupo: "E", estadio: "MetLife Stadium, Nueva Jersey" },
    
    // ========== GRUPO F ==========
    { id: 31, fecha: "2026-06-14", hora: "16:00", fase: "grupos", local: "Países Bajos", visitante: "Japón", grupo: "F", estadio: "AT&T Stadium, Dallas" },
    { id: 32, fecha: "2026-06-14", hora: "22:00", fase: "grupos", local: "Suecia", visitante: "Túnez", grupo: "F", estadio: "Estadio BBVA, Monterrey" },
    { id: 33, fecha: "2026-06-18", hora: "13:00", fase: "grupos", local: "Países Bajos", visitante: "Suecia", grupo: "F", estadio: "NRG Stadium, Houston" },
    { id: 34, fecha: "2026-06-19", hora: "00:00", fase: "grupos", local: "Túnez", visitante: "Japón", grupo: "F", estadio: "Estadio BBVA, Monterrey" },
    { id: 35, fecha: "2026-06-22", hora: "19:00", fase: "grupos", local: "Japón", visitante: "Suecia", grupo: "F", estadio: "AT&T Stadium, Dallas" },
    { id: 36, fecha: "2026-06-22", hora: "19:00", fase: "grupos", local: "Túnez", visitante: "Países Bajos", grupo: "F", estadio: "Arrowhead Stadium, Kansas City" },
    
    // ========== GRUPO G ==========
    { id: 37, fecha: "2026-06-15", hora: "15:00", fase: "grupos", local: "Bélgica", visitante: "Egipto", grupo: "G", estadio: "Lumen Field, Seattle" },
    { id: 38, fecha: "2026-06-15", hora: "21:00", fase: "grupos", local: "Irán", visitante: "Nueva Zelanda", grupo: "G", estadio: "SoFi Stadium, Los Ángeles" },
    { id: 39, fecha: "2026-06-19", hora: "15:00", fase: "grupos", local: "Bélgica", visitante: "Irán", grupo: "G", estadio: "SoFi Stadium, Los Ángeles" },
    { id: 40, fecha: "2026-06-19", hora: "21:00", fase: "grupos", local: "Nueva Zelanda", visitante: "Egipto", grupo: "G", estadio: "BC Place, Vancouver" },
    { id: 41, fecha: "2026-06-23", hora: "23:00", fase: "grupos", local: "Egipto", visitante: "Irán", grupo: "G", estadio: "Lumen Field, Seattle" },
    { id: 42, fecha: "2026-06-23", hora: "23:00", fase: "grupos", local: "Nueva Zelanda", visitante: "Bélgica", grupo: "G", estadio: "BC Place, Vancouver" },
    
    // ========== GRUPO H ==========
    { id: 43, fecha: "2026-06-15", hora: "12:00", fase: "grupos", local: "España", visitante: "Cabo Verde", grupo: "H", estadio: "Mercedes-Benz Stadium, Atlanta" },
    { id: 44, fecha: "2026-06-15", hora: "18:00", fase: "grupos", local: "Arabia Saudita", visitante: "Uruguay", grupo: "H", estadio: "Hard Rock Stadium, Miami" },
    { id: 45, fecha: "2026-06-19", hora: "12:00", fase: "grupos", local: "España", visitante: "Arabia Saudita", grupo: "H", estadio: "Mercedes-Benz Stadium, Atlanta" },
    { id: 46, fecha: "2026-06-19", hora: "18:00", fase: "grupos", local: "Uruguay", visitante: "Cabo Verde", grupo: "H", estadio: "Hard Rock Stadium, Miami" },
    { id: 47, fecha: "2026-06-23", hora: "20:00", fase: "grupos", local: "Cabo Verde", visitante: "Arabia Saudita", grupo: "H", estadio: "NRG Stadium, Houston" },
    { id: 48, fecha: "2026-06-23", hora: "20:00", fase: "grupos", local: "Uruguay", visitante: "España", grupo: "H", estadio: "Estadio Akron, Guadalajara" },
    
    // ========== GRUPO I ==========
    { id: 49, fecha: "2026-06-16", hora: "15:00", fase: "grupos", local: "Francia", visitante: "Senegal", grupo: "I", estadio: "MetLife Stadium, Nueva Jersey" },
    { id: 50, fecha: "2026-06-16", hora: "18:00", fase: "grupos", local: "Irak", visitante: "Noruega", grupo: "I", estadio: "Gillette Stadium, Boston" },
    { id: 51, fecha: "2026-06-20", hora: "17:00", fase: "grupos", local: "Francia", visitante: "Irak", grupo: "I", estadio: "Lincoln Financial Field, Filadelfia" },
    { id: 52, fecha: "2026-06-20", hora: "20:00", fase: "grupos", local: "Noruega", visitante: "Senegal", grupo: "I", estadio: "MetLife Stadium, Nueva Jersey" },
    { id: 53, fecha: "2026-06-23", hora: "15:00", fase: "grupos", local: "Noruega", visitante: "Francia", grupo: "I", estadio: "Gillette Stadium, Boston" }, // CORREGIDO: "Francia"
    { id: 54, fecha: "2026-06-23", hora: "15:00", fase: "grupos", local: "Senegal", visitante: "Irak", grupo: "I", estadio: "BMO Field, Toronto" },
    
    // ========== GRUPO J (SIN DUPLICADOS) ==========
    { id: 55, fecha: "2026-06-16", hora: "21:00", fase: "grupos", local: "Argentina", visitante: "Argelia", grupo: "J", estadio: "Arrowhead Stadium, Kansas City" },
    { id: 56, fecha: "2026-06-17", hora: "00:00", fase: "grupos", local: "Austria", visitante: "Jordania", grupo: "J", estadio: "Levi's Stadium, San Francisco" },
    { id: 57, fecha: "2026-06-20", hora: "13:00", fase: "grupos", local: "Argentina", visitante: "Austria", grupo: "J", estadio: "AT&T Stadium, Dallas" }, // ID 57 (antes 54 y 62)
    { id: 58, fecha: "2026-06-20", hora: "23:00", fase: "grupos", local: "Jordania", visitante: "Argelia", grupo: "J", estadio: "Levi's Stadium, San Francisco" }, // ID 58 (antes 57 y 63)
    { id: 59, fecha: "2026-06-24", hora: "22:00", fase: "grupos", local: "Argelia", visitante: "Austria", grupo: "J", estadio: "Arrowhead Stadium, Kansas City" },
    { id: 60, fecha: "2026-06-24", hora: "22:00", fase: "grupos", local: "Jordania", visitante: "Argentina", grupo: "J", estadio: "AT&T Stadium, Dallas" },
    
    // ========== GRUPO K ==========
    { id: 61, fecha: "2026-06-17", hora: "13:00", fase: "grupos", local: "Portugal", visitante: "RD Congo", grupo: "K", estadio: "NRG Stadium, Houston" },
    { id: 62, fecha: "2026-06-17", hora: "22:00", fase: "grupos", local: "Uzbekistán", visitante: "Colombia", grupo: "K", estadio: "Estadio Azteca, Ciudad de México" },
    { id: 63, fecha: "2026-06-21", hora: "13:00", fase: "grupos", local: "Portugal", visitante: "Uzbekistán", grupo: "K", estadio: "NRG Stadium, Houston" },
    { id: 64, fecha: "2026-06-21", hora: "19:30", fase: "grupos", local: "Colombia", visitante: "RD Congo", grupo: "K", estadio: "Hard Rock Stadium, Miami" },
    { id: 65, fecha: "2026-06-24", hora: "19:30", fase: "grupos", local: "Colombia", visitante: "Portugal", grupo: "K", estadio: "Hard Rock Stadium, Miami" },
    { id: 66, fecha: "2026-06-24", hora: "19:30", fase: "grupos", local: "RD Congo", visitante: "Uzbekistán", grupo: "K", estadio: "Mercedes-Benz Stadium, Atlanta" },
    
    // ========== GRUPO L ==========
    { id: 67, fecha: "2026-06-17", hora: "16:00", fase: "grupos", local: "Inglaterra", visitante: "Croacia", grupo: "L", estadio: "AT&T Stadium, Dallas" },
    { id: 68, fecha: "2026-06-17", hora: "19:00", fase: "grupos", local: "Ghana", visitante: "Panamá", grupo: "L", estadio: "BMO Field, Toronto" },
    { id: 69, fecha: "2026-06-21", hora: "16:00", fase: "grupos", local: "Inglaterra", visitante: "Ghana", grupo: "L", estadio: "Gillette Stadium, Boston" },
    { id: 70, fecha: "2026-06-21", hora: "19:00", fase: "grupos", local: "Panamá", visitante: "Croacia", grupo: "L", estadio: "BMO Field, Toronto" },
    { id: 71, fecha: "2026-06-24", hora: "17:00", fase: "grupos", local: "Panamá", visitante: "Inglaterra", grupo: "L", estadio: "MetLife Stadium, Nueva Jersey" },
    { id: 72, fecha: "2026-06-24", hora: "17:00", fase: "grupos", local: "Croacia", visitante: "Ghana", grupo: "L", estadio: "Lincoln Financial Field, Filadelfia" },
    
    // ========== OCTAVOS DE FINAL (CORREGIDO: SIN GRUPOS M/N) ==========
    { id: 73, fecha: "2026-06-27", hora: "14:00", fase: "octavos", local: "2° Grupo A", visitante: "2° Grupo B", estadio: "SoFi Stadium, Los Ángeles" },
    { id: 74, fecha: "2026-06-27", hora: "18:00", fase: "octavos", local: "1° Grupo C", visitante: "3° Grupo D/E/F", estadio: "NRG Stadium, Houston" },
    { id: 75, fecha: "2026-06-28", hora: "14:00", fase: "octavos", local: "1° Grupo A", visitante: "3° Grupo C/E/F", estadio: "Estadio Azteca, Ciudad de México" },
    { id: 76, fecha: "2026-06-28", hora: "18:00", fase: "octavos", local: "1° Grupo B", visitante: "3° Grupo A/C/D", estadio: "Mercedes-Benz Stadium, Atlanta" },
    { id: 77, fecha: "2026-06-29", hora: "14:00", fase: "octavos", local: "1° Grupo D", visitante: "3° Grupo B/E/F", estadio: "Hard Rock Stadium, Miami" },
    { id: 78, fecha: "2026-06-29", hora: "18:00", fase: "octavos", local: "1° Grupo F", visitante: "2° Grupo E", estadio: "AT&T Stadium, Dallas" },
    { id: 79, fecha: "2026-06-30", hora: "14:00", fase: "octavos", local: "1° Grupo E", visitante: "2° Grupo D", estadio: "Levi's Stadium, San Francisco" },
    { id: 80, fecha: "2026-06-30", hora: "18:00", fase: "octavos", local: "1° Grupo G", visitante: "2° Grupo H", estadio: "Lumen Field, Seattle" },
    { id: 81, fecha: "2026-07-01", hora: "14:00", fase: "octavos", local: "1° Grupo H", visitante: "2° Grupo G", estadio: "SoFi Stadium, Los Ángeles" },
    { id: 82, fecha: "2026-07-01", hora: "18:00", fase: "octavos", local: "1° Grupo I", visitante: "2° Grupo J", estadio: "MetLife Stadium, Nueva Jersey" },
    { id: 83, fecha: "2026-07-02", hora: "14:00", fase: "octavos", local: "1° Grupo J", visitante: "2° Grupo I", estadio: "Hard Rock Stadium, Miami" },
    { id: 84, fecha: "2026-07-02", hora: "18:00", fase: "octavos", local: "1° Grupo K", visitante: "2° Grupo L", estadio: "AT&T Stadium, Dallas" },
    { id: 85, fecha: "2026-07-03", hora: "14:00", fase: "octavos", local: "1° Grupo L", visitante: "2° Grupo K", estadio: "Lincoln Financial Field, Filadelfia" },
    // NOTA: Los octavos 91 y 92 (Grupo M/N) fueron eliminados porque no existen en un Mundial de 48 equipos con 12 grupos.
    
    // ========== CUARTOS DE FINAL ==========
    { id: 86, fecha: "2026-07-06", hora: "15:00", fase: "cuartos", local: "Ganador O1", visitante: "Ganador O2", estadio: "SoFi Stadium, Los Ángeles" },
    { id: 87, fecha: "2026-07-06", hora: "19:00", fase: "cuartos", local: "Ganador O3", visitante: "Ganador O4", estadio: "AT&T Stadium, Dallas" },
    { id: 88, fecha: "2026-07-07", hora: "15:00", fase: "cuartos", local: "Ganador O5", visitante: "Ganador O6", estadio: "Hard Rock Stadium, Miami" },
    { id: 89, fecha: "2026-07-07", hora: "19:00", fase: "cuartos", local: "Ganador O7", visitante: "Ganador O8", estadio: "MetLife Stadium, Nueva Jersey" },
    
    // ========== SEMIFINALES ==========
    { id: 90, fecha: "2026-07-10", hora: "16:00", fase: "semis", local: "Ganador C1", visitante: "Ganador C2", estadio: "AT&T Stadium, Dallas" },
    { id: 91, fecha: "2026-07-11", hora: "16:00", fase: "semis", local: "Ganador C3", visitante: "Ganador C4", estadio: "Hard Rock Stadium, Miami" },
    
    // ========== TERCER PUESTO ==========
    { id: 92, fecha: "2026-07-14", hora: "15:00", fase: "tercer", local: "Perdedor S1", visitante: "Perdedor S2", estadio: "Mercedes-Benz Stadium, Atlanta" },
    
    // ========== FINAL ==========
    { id: 93, fecha: "2026-07-15", hora: "16:00", fase: "final", local: "Ganador S1", visitante: "Ganador S2", estadio: "MetLife Stadium, Nueva Jersey" }
];

// ========== FUNCIONES DE UTILIDAD (SIN CAMBIOS) ==========
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

export const getFechaHoraPartido = (fechaPartido, horaPartido) => {
    const [year, month, day] = fechaPartido.split('-');
    const [hour, minute] = horaPartido.split(':');
    return new Date(year, month - 1, day, parseInt(hour), parseInt(minute || '0'));
};

export const isPartidoComenzado = (fechaPartido, horaPartido) => {
    const fechaHoraPartido = getFechaHoraPartido(fechaPartido, horaPartido);
    const ahora = new Date();
    return ahora >= fechaHoraPartido;
};

export const puedeApostarPartido = (fechaPartido, horaPartido) => {
    const fechaHoraPartido = getFechaHoraPartido(fechaPartido, horaPartido);
    const ahora = new Date();
    return ahora < fechaHoraPartido;
};

export const hayPartidosDisponiblesParaApostar = (fecha) => {
    const partidos = getPartidosPorDia(fecha);
    return partidos.some(partido => puedeApostarPartido(partido.fecha, partido.hora));
};

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
import { setPartidosGlobal } from './groups.js';
setPartidosGlobal(todosLosPartidos);
export const getTodosLosPartidos = () => todosLosPartidos;