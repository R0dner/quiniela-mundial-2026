// src/storage.js - ACTUALIZADO con función editar

const STORAGE_KEYS = {
    PARTICIPANTES: 'mundial2026_participantes',
    APUESTAS: 'mundial2026_apuestas',
    RESULTADOS: 'mundial2026_resultados'
};

// Participantes
export const getParticipantes = () => {
    const data = localStorage.getItem(STORAGE_KEYS.PARTICIPANTES);
    return data ? JSON.parse(data) : [];
};

export const saveParticipantes = (participantes) => {
    localStorage.setItem(STORAGE_KEYS.PARTICIPANTES, JSON.stringify(participantes));
};

export const agregarParticipante = (nombre, telefono, pago = false) => {
    const participantes = getParticipantes();
    if (participantes.some(p => p.nombre.toLowerCase() === nombre.toLowerCase())) {
        return false;
    }
    participantes.push({ id: Date.now(), nombre, telefono, pago, fechaRegistro: new Date().toISOString() });
    saveParticipantes(participantes);
    return true;
};

// NUEVA FUNCIÓN: Editar participante
export const editarNombreParticipante = (id, nuevoNombre, nuevoTelefono, nuevoPago) => {
    const participantes = getParticipantes();
    const index = participantes.findIndex(p => p.id === id);
    
    if (index === -1) {
        return { success: false, message: 'Participante no encontrado' };
    }
    
    // Verificar que el nuevo nombre no exista en otro participante
    const nombreExiste = participantes.some(p => p.id !== id && p.nombre.toLowerCase() === nuevoNombre.toLowerCase());
    if (nombreExiste) {
        return { success: false, message: `El nombre "${nuevoNombre}" ya está registrado` };
    }
    
    const apuestas = getApuestas();
    const nombreAntiguo = participantes[index].nombre;
    
    // Actualizar participante
    participantes[index] = {
        ...participantes[index],
        nombre: nuevoNombre,
        telefono: nuevoTelefono,
        pago: nuevoPago
    };
    saveParticipantes(participantes);
    
    // Actualizar las apuestas si cambió el nombre
    if (nombreAntiguo !== nuevoNombre && apuestas[nombreAntiguo]) {
        apuestas[nuevoNombre] = apuestas[nombreAntiguo];
        delete apuestas[nombreAntiguo];
        saveApuestas(apuestas);
    }
    
    return { success: true, message: `✅ Nombre actualizado a "${nuevoNombre}"` };
};

export const eliminarParticipante = (id) => {
    const participantes = getParticipantes();
    const participante = participantes.find(p => p.id === id);
    if (participante) {
        const apuestas = getApuestas();
        delete apuestas[participante.nombre];
        saveApuestas(apuestas);
    }
    const nuevos = participantes.filter(p => p.id !== id);
    saveParticipantes(nuevos);
};

export const togglePagoParticipante = (id) => {
    const participantes = getParticipantes();
    const index = participantes.findIndex(p => p.id === id);
    if (index !== -1) {
        participantes[index].pago = !participantes[index].pago;
        saveParticipantes(participantes);
    }
};

// Apuestas
export const getApuestas = () => {
    const data = localStorage.getItem(STORAGE_KEYS.APUESTAS);
    return data ? JSON.parse(data) : {};
};

export const saveApuestas = (apuestas) => {
    localStorage.setItem(STORAGE_KEYS.APUESTAS, JSON.stringify(apuestas));
};

export const getApuestasPorParticipante = (nombre) => {
    const apuestas = getApuestas();
    return apuestas[nombre] || {};
};

export const guardarApuestasParticipante = (nombre, apuestasPartido) => {
    const todas = getApuestas();
    todas[nombre] = apuestasPartido;
    saveApuestas(todas);
};

// Resultados oficiales
export const getResultados = () => {
    const data = localStorage.getItem(STORAGE_KEYS.RESULTADOS);
    return data ? JSON.parse(data) : {};
};

export const saveResultados = (resultados) => {
    localStorage.setItem(STORAGE_KEYS.RESULTADOS, JSON.stringify(resultados));
};

export const actualizarResultado = (partidoId, localGoles, visitanteGoles) => {
    const resultados = getResultados();
    resultados[partidoId] = { local: localGoles, visitante: visitanteGoles };
    saveResultados(resultados);
};

// Cálculo de puntos
export const calcularPuntosParticipante = (nombre, resultados) => {
    const apuestas = getApuestasPorParticipante(nombre);
    let puntos = 0;
    
    for (const [partidoId, apuesta] of Object.entries(apuestas)) {
        const resultado = resultados[partidoId];
        if (resultado) {
            if (apuesta.local === resultado.local && apuesta.visitante === resultado.visitante) {
                puntos += 3;
            } else if ((apuesta.local > apuesta.visitante && resultado.local > resultado.visitante) ||
                       (apuesta.local < apuesta.visitante && resultado.local < resultado.visitante) ||
                       (apuesta.local === apuesta.visitante && resultado.local === resultado.visitante)) {
                puntos += 1;
            }
        }
    }
    return puntos;
};

export const obtenerRanking = () => {
    const participantes = getParticipantes();
    const resultados = getResultados();
    const ranking = participantes.map(p => ({
        ...p,
        puntos: calcularPuntosParticipante(p.nombre, resultados),
        totalApuestas: Object.keys(getApuestasPorParticipante(p.nombre)).length
    }));
    ranking.sort((a, b) => b.puntos - a.puntos);
    return ranking;
};