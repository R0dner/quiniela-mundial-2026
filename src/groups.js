// src/main.js - Con selección de grupos y auto-registro
import { 
    getPartidosPorDia, 
    getDiasCalendario, 
    formatearFecha, 
    conBandera, 
    isPartidoPasado, 
    getFaseNombre,
    getDiaActualLocal,
    puedeApostarPartido,
    hayPartidosDisponiblesParaApostar,
    todosLosPartidos
} from './data.js';
import { 
    getGrupos, 
    registrarParticipanteEnGrupo,
    participanteRegistrado,
    getInfoParticipante,
    agregarApuestaEnGrupo,
    getApuestasMultiplesDeParticipante,
    getResultadosDelGrupo,
    eliminarApuesta,
    getApuestasDePartido,
    getLimiteApuestasParticipante,
    getReglasDelGrupo
} from './groups.js';

let currentGrupoId = '';
let currentGrupoNombre = '';
let currentParticipante = '';
let currentFecha = '';

// Elementos del DOM
const gruposLista = document.getElementById('grupos-lista');
const registroPanel = document.getElementById('registro-panel');
const apuestasPanel = document.getElementById('apuestas-panel');
const seleccionGruposDiv = document.getElementById('seleccion-grupos');
const grupoSeleccionadoNombre = document.getElementById('grupo-seleccionado-nombre');
const registroNombre = document.getElementById('registro-nombre');
const registroTelefono = document.getElementById('registro-telefono');
const registrarBtn = document.getElementById('registrar-btn');
const registroMensaje = document.getElementById('registro-mensaje');
const cambiarGrupoBtn = document.getElementById('cambiar-grupo-btn');
const participanteNombreDisplay = document.getElementById('participante-nombre-display');
const participanteGrupoDisplay = document.getElementById('participante-grupo-display');
const diaSelect = document.getElementById('dia-select');
const estadoDia = document.getElementById('estado-dia');
const apuestasContainer = document.getElementById('apuestas-container');
const verApuestasBtn = document.getElementById('ver-mis-apuestas');

function init() {
    cargarGrupos();
    setupEventListeners();
    verificarSesion();
}

function verificarSesion() {
    const sesionGuardada = sessionStorage.getItem('quiniela_sesion_actual');
    if (sesionGuardada) {
        const sesion = JSON.parse(sesionGuardada);
        const grupos = getGrupos();
        if (grupos[sesion.grupoId]) {
            currentGrupoId = sesion.grupoId;
            currentGrupoNombre = grupos[sesion.grupoId].nombre;
            currentParticipante = sesion.participante;
            iniciarSesionParticipante();
        }
    }
}

function cargarGrupos() {
    const grupos = getGrupos();
    const gruposKeys = Object.keys(grupos);
    
    if (gruposKeys.length === 0) {
        gruposLista.innerHTML = '<div class="loading">⚠️ No hay grupos disponibles. Contactá al administrador.</div>';
        return;
    }
    
    let html = '';
    for (const [id, grupo] of Object.entries(grupos)) {
        html += `
            <div class="grupo-card-selector" data-grupo-id="${id}" data-grupo-nombre="${grupo.nombre}">
                <div class="grupo-nombre">🏆 ${grupo.nombre}</div>
                <div class="grupo-descripcion">${grupo.descripcion || 'Participa en este grupo'}</div>
                <div class="grupo-descripcion" style="font-size:0.7rem; margin-top:8px;">👥 ${grupo.participantes.length} participantes</div>
            </div>
        `;
    }
    gruposLista.innerHTML = html;
    
    document.querySelectorAll('.grupo-card-selector').forEach(card => {
        card.addEventListener('click', () => {
            const grupoId = card.dataset.grupoId;
            const grupoNombre = card.dataset.grupoNombre;
            manejarSeleccionGrupo(grupoId, grupoNombre);
        });
    });
}

function manejarSeleccionGrupo(grupoId, grupoNombre) {
    currentGrupoId = grupoId;
    currentGrupoNombre = grupoNombre;
    
    // Preguntar si ya está registrado
    const respuesta = prompt(`¿Ya estás registrado en el grupo "${grupoNombre}"?\n\n- Si ya estás registrado, ingresa tu nombre exacto.\n- Si es tu primera vez, escribe "nuevo" o deja vacío.`);
    
    if (respuesta && respuesta.toLowerCase() !== 'nuevo' && respuesta.trim() !== '') {
        // Verificar si el nombre existe en el grupo
        const existe = participanteRegistrado(grupoId, respuesta);
        if (existe) {
            currentParticipante = respuesta;
            sessionStorage.setItem('quiniela_sesion_actual', JSON.stringify({
                participante: respuesta,
                grupoId: grupoId,
                timestamp: Date.now()
            }));
            iniciarSesionParticipante();
            return;
        } else {
            alert(`❌ El nombre "${respuesta}" no está registrado en este grupo. Por favor, regístrate.`);
        }
    }
    
    // Si no está registrado o eligió "nuevo", mostrar formulario de registro
    mostrarFormularioRegistro(grupoId, grupoNombre);
}

function mostrarFormularioRegistro(grupoId, grupoNombre) {
    currentParticipante = '';
    registroPanel.style.display = 'block';
    apuestasPanel.style.display = 'none';
    seleccionGruposDiv.style.display = 'block';
    grupoSeleccionadoNombre.innerHTML = `🏆 ${grupoNombre}`;
    registroMensaje.innerHTML = '';
    registroNombre.value = '';
    registroTelefono.value = '';
    
    registroPanel.scrollIntoView({ behavior: 'smooth' });
}

async function registrarParticipante() {
    const nombre = registroNombre.value.trim();
    const telefono = registroTelefono.value.trim();
    
    if (!nombre) {
        registroMensaje.innerHTML = '<div class="mensaje-error">❌ El nombre es obligatorio</div>';
        return;
    }
    
    const resultado = registrarParticipanteEnGrupo(currentGrupoId, nombre, telefono);
    
    if (resultado.success) {
        registroMensaje.innerHTML = `<div class="mensaje-exito">✅ ${resultado.message}</div>`;
        currentParticipante = nombre;
        
        sessionStorage.setItem('quiniela_sesion_actual', JSON.stringify({
            participante: nombre,
            grupoId: currentGrupoId,
            timestamp: Date.now()
        }));
        
        setTimeout(() => {
            iniciarSesionParticipante();
        }, 1000);
    } else {
        registroMensaje.innerHTML = `<div class="mensaje-error">❌ ${resultado.message}</div>`;
    }
}

function iniciarSesionParticipante() {
    registroPanel.style.display = 'none';
    apuestasPanel.style.display = 'block';
    seleccionGruposDiv.style.display = 'none';
    
    participanteNombreDisplay.textContent = currentParticipante;
    participanteGrupoDisplay.textContent = `Grupo: ${currentGrupoNombre}`;
    
    cargarDias();
    cargarEventosCalendario();
}

function cargarDias() {
    const dias = getDiasCalendario();
    
    if (dias.length === 0) {
        diaSelect.innerHTML = '<option>No hay partidos cargados</option>';
        return;
    }
    
    let options = '<option value="">📅 Seleccioná un día...</option>';
    dias.forEach(dia => {
        const fechaFormateada = formatearFecha(dia);
        const esPasado = isPartidoPasado(dia);
        const esHoy = !esPasado && (dia === getDiaActualLocal());
        let icono = '';
        if (esPasado) icono = '🔒 ';
        else if (esHoy) icono = '✅ ';
        else icono = '⏳ ';
        options += `<option value="${dia}">${icono}${fechaFormateada}</option>`;
    });
    diaSelect.innerHTML = options;
    
    const hoy = getDiaActualLocal();
    if (dias.includes(hoy)) {
        diaSelect.value = hoy;
        currentFecha = hoy;
        cargarPartidosDelDia(hoy);
        actualizarEstadoDia(hoy);
    } else if (dias[0]) {
        diaSelect.value = dias[0];
        currentFecha = dias[0];
        cargarPartidosDelDia(dias[0]);
        actualizarEstadoDia(dias[0]);
    }
}

function cargarEventosCalendario() {
    diaSelect.addEventListener('change', (e) => {
        currentFecha = e.target.value;
        if (currentFecha) {
            cargarPartidosDelDia(currentFecha);
            actualizarEstadoDia(currentFecha);
        }
    });
}

function actualizarEstadoDia(fecha) {
    const esPasado = isPartidoPasado(fecha);
    const esHoy = !esPasado && (fecha === getDiaActualLocal());
    
    if (esPasado) {
        estadoDia.innerHTML = '<span class="badge-pasado">🔒 DÍA FINALIZADO - Solo consulta</span>';
    } else if (esHoy) {
        estadoDia.innerHTML = '<span class="badge-activo">✅ DÍA ACTIVO - Podés apostar</span>';
    } else {
        estadoDia.innerHTML = '<span class="badge-futuro">⏳ DÍA FUTURO - Apuestas disponibles el día del partido</span>';
    }
}

function cargarPartidosDelDia(fecha) {
    const partidos = getPartidosPorDia(fecha);
    const esPasado = isPartidoPasado(fecha);
    const esHoy = !esPasado && (fecha === getDiaActualLocal());
    
    apuestasContainer.innerHTML = partidos.map(partido => {
        const puedeApostar = esHoy && puedeApostarPartido(partido.fecha, partido.hora);
        const limiteParticipante = getLimiteApuestasParticipante(currentGrupoId, currentParticipante);
        const apuestasActuales = getApuestasDePartido(currentGrupoId, currentParticipante, partido.id).length;
        
        let mensajeBloqueo = '';
        if (!puedeApostar) {
            if (esPasado) mensajeBloqueo = '🔒 Partido finalizado';
            else if (!esHoy) mensajeBloqueo = '⏳ Apuestas solo el día del partido';
            else mensajeBloqueo = '⏰ Apuestas cerradas';
        }
        
        return `
            <div class="apuesta-card ${!puedeApostar ? 'bloqueado' : ''}" data-id="${partido.id}">
                <div class="match-info">
                    <div class="match-teams">${conBandera(partido.local)} vs ${conBandera(partido.visitante)}</div>
                    <div class="match-date">
                        🕐 ${partido.hora} | ${getFaseNombre(partido.fase)}
                        ${!puedeApostar ? ` | ${mensajeBloqueo}` : ' | ✅ Disponible'}
                    </div>
                </div>
                
                <div id="apuestas-lista-${partido.id}" class="apuestas-lista"></div>
                
                ${puedeApostar ? `
                    <div class="nueva-apuesta-form">
                        <div class="score-inputs">
                            <input type="number" class="score-local" placeholder="Local" min="0" max="20">
                            <span class="vs">-</span>
                            <input type="number" class="score-visitante" placeholder="Visitante" min="0" max="20">
                            <button class="btn-agregar-apuesta" data-id="${partido.id}">➕ Agregar</button>
                        </div>
                        <div class="limite-apuestas">📊 Usados: ${apuestasActuales}/${limiteParticipante}</div>
                    </div>
                ` : `
                    <div class="score-readonly" id="readonly-${partido.id}"></div>
                `}
            </div>
        `;
    }).join('');
    
    cargarApuestasExistentes(fecha);
    setupAgregarApuestas();
}

function cargarApuestasExistentes(fecha) {
    const todasApuestas = getApuestasMultiplesDeParticipante(currentGrupoId, currentParticipante);
    const partidos = getPartidosPorDia(fecha);
    const resultados = getResultadosDelGrupo(currentGrupoId);
    const esHoy = !isPartidoPasado(fecha) && (fecha === getDiaActualLocal());
    const puedeApostar = esHoy;
    
    partidos.forEach(partido => {
        const apuestasPartido = todasApuestas[partido.id] || [];
        const container = document.getElementById(`apuestas-lista-${partido.id}`);
        const readonlyContainer = document.getElementById(`readonly-${partido.id}`);
        
        if (container) {
            if (apuestasPartido.length === 0) {
                container.innerHTML = '<div class="no-apuestas">📭 Sin pronósticos</div>';
            } else {
                let html = '<div class="apuestas-multiples">';
                apuestasPartido.forEach((apuesta, idx) => {
                    const resultado = resultados[partido.id];
                    let claseAcierto = '';
                    if (resultado) {
                        if (apuesta.local === resultado.local && apuesta.visitante === resultado.visitante) {
                            claseAcierto = 'acierto-exacto';
                        } else if (
                            (apuesta.local > apuesta.visitante && resultado.local > resultado.visitante) ||
                            (apuesta.local < apuesta.visitante && resultado.local < resultado.visitante) ||
                            (apuesta.local === apuesta.visitante && resultado.local === resultado.visitante)
                        ) {
                            claseAcierto = 'acierto-ganador';
                        } else {
                            claseAcierto = 'acierto-error';
                        }
                    }
                    html += `
                        <div class="apuesta-item ${claseAcierto}">
                            <span>Pronóstico ${idx + 1}: ${apuesta.local} - ${apuesta.visitante}</span>
                            ${puedeApostar ? `<button class="btn-eliminar-apuesta" data-partido="${partido.id}" data-apuesta="${apuesta.id}">🗑️</button>` : ''}
                        </div>
                    `;
                });
                html += '</div>';
                container.innerHTML = html;
            }
        }
        
        if (readonlyContainer && !puedeApostar && resultados[partido.id]) {
            readonlyContainer.innerHTML = `<div class="resultado-oficial">🏆 Resultado oficial: ${resultados[partido.id].local} - ${resultados[partido.id].visitante}</div>`;
        } else if (readonlyContainer && !puedeApostar && apuestasPartido.length > 0) {
            let html = '<div class="apuestas-multiples">';
            apuestasPartido.forEach((apuesta, idx) => {
                html += `<div class="apuesta-item">Pronóstico ${idx + 1}: ${apuesta.local} - ${apuesta.visitante}</div>`;
            });
            html += '</div>';
            readonlyContainer.innerHTML = html;
        }
    });
    
    document.querySelectorAll('.btn-eliminar-apuesta').forEach(btn => {
        btn.removeEventListener('click', handleEliminarApuesta);
        btn.addEventListener('click', handleEliminarApuesta);
    });
}

function handleEliminarApuesta(e) {
    const btn = e.currentTarget;
    const partidoId = parseInt(btn.dataset.partido);
    const apuestaId = btn.dataset.apuesta;
    eliminarApuesta(currentGrupoId, currentParticipante, partidoId, apuestaId);
    cargarPartidosDelDia(currentFecha);
    mostrarMensaje('Pronóstico eliminado', 'success');
}

function setupAgregarApuestas() {
    document.querySelectorAll('.btn-agregar-apuesta').forEach(btn => {
        btn.removeEventListener('click', handleAgregarApuesta);
        btn.addEventListener('click', handleAgregarApuesta);
    });
}

function handleAgregarApuesta(e) {
    const btn = e.currentTarget;
    const partidoId = parseInt(btn.dataset.id);
    const card = btn.closest('.apuesta-card');
    const localInput = card.querySelector('.score-local');
    const visitanteInput = card.querySelector('.score-visitante');
    
    const local = parseInt(localInput.value);
    const visitante = parseInt(visitanteInput.value);
    
    if (isNaN(local) || isNaN(visitante)) {
        mostrarMensaje('Ingresá un marcador válido', 'error');
        return;
    }
    
    if (local < 0 || local > 20 || visitante < 0 || visitante > 20) {
        mostrarMensaje('Usá números entre 0 y 20', 'error');
        return;
    }
    
    const partido = todosLosPartidos.find(p => p.id === partidoId);
    if (partido && !puedeApostarPartido(partido.fecha, partido.hora)) {
        mostrarMensaje('⏰ Ya no se puede apostar a este partido', 'error');
        return;
    }
    
    const limite = getLimiteApuestasParticipante(currentGrupoId, currentParticipante);
    const actuales = getApuestasDePartido(currentGrupoId, currentParticipante, partidoId).length;
    
    if (actuales >= limite) {
        mostrarMensaje(`❌ Límite alcanzado (${limite} pronósticos)`, 'error');
        return;
    }
    
    agregarApuestaEnGrupo(currentGrupoId, currentParticipante, partidoId, { local, visitante });
    mostrarMensaje(`✅ Pronóstico ${local}-${visitante} agregado (${actuales + 1}/${limite})`, 'success');
    localInput.value = '';
    visitanteInput.value = '';
    cargarPartidosDelDia(currentFecha);
}

function mostrarMensaje(msg, tipo) {
    const mensajeDiv = document.getElementById('mensaje');
    mensajeDiv.textContent = msg;
    mensajeDiv.className = `mensaje ${tipo}`;
    setTimeout(() => {
        mensajeDiv.textContent = '';
        mensajeDiv.className = 'mensaje';
    }, 3000);
}

function cambiarGrupo() {
    sessionStorage.removeItem('quiniela_sesion_actual');
    currentGrupoId = '';
    currentGrupoNombre = '';
    currentParticipante = '';
    
    registroPanel.style.display = 'none';
    apuestasPanel.style.display = 'none';
    seleccionGruposDiv.style.display = 'block';
    
    cargarGrupos();
}

function verMisApuestas() {
    const todasApuestas = getApuestasMultiplesDeParticipante(currentGrupoId, currentParticipante);
    const resultados = getResultadosDelGrupo(currentGrupoId);
    const modalBody = document.getElementById('modal-body');
    const modal = document.getElementById('modal-apuestas');
    const reglas = getReglasDelGrupo(currentGrupoId);
    
    if (Object.keys(todasApuestas).length === 0) {
        modalBody.innerHTML = '<p style="text-align:center;">📭 No has realizado ningún pronóstico</p>';
        modal.style.display = 'block';
        return;
    }
    
    let html = `<h3>Grupo: ${currentGrupoNombre}</h3>`;
    let totalPuntos = 0;
    
    const apuestasArray = [];
    for (const [partidoId, apuestas] of Object.entries(todasApuestas)) {
        const partido = todosLosPartidos.find(p => p.id === parseInt(partidoId));
        if (partido && apuestas.length > 0) {
            apuestas.forEach(apuesta => {
                apuestasArray.push({
                    ...apuesta,
                    partido,
                    resultado: resultados[partidoId]
                });
            });
        }
    }
    apuestasArray.sort((a, b) => a.partido.fecha.localeCompare(b.partido.fecha));
    
    let currentFechaHtml = '';
    apuestasArray.forEach(ap => {
        if (currentFechaHtml !== ap.partido.fecha) {
            currentFechaHtml = ap.partido.fecha;
            html += `<h4>📅 ${formatearFecha(ap.partido.fecha)} - ${ap.partido.local} vs ${ap.partido.visitante}</h4>`;
        }
        
        let puntos = 0;
        let acierto = '';
        if (ap.resultado) {
            if (ap.local === ap.resultado.local && ap.visitante === ap.resultado.visitante) {
                puntos = reglas.puntosExacto;
                acierto = '✅ EXACTO';
            } else if (
                (ap.local > ap.visitante && ap.resultado.local > ap.resultado.visitante) ||
                (ap.local < ap.visitante && ap.resultado.local < ap.resultado.visitante) ||
                (ap.local === ap.visitante && ap.resultado.local === ap.resultado.visitante)
            ) {
                puntos = reglas.puntosGanador;
                acierto = '🎯 GANADOR';
            } else {
                acierto = '❌ ERROR';
            }
            totalPuntos += puntos;
        }
        
        html += `<div class="apuesta-resumen">
            Pronóstico: ${ap.local} - ${ap.visitante}
            ${ap.resultado ? `<br>Resultado: ${ap.resultado.local} - ${ap.resultado.visitante}<br>${acierto} ${puntos > 0 ? `(+${puntos})` : ''}` : '<br>⏳ Resultado pendiente'}
        </div>`;
    });
    
    html += `<div class="total-puntos">🏆 TOTAL DE PUNTOS: ${totalPuntos}</div>`;
    modalBody.innerHTML = html;
    modal.style.display = 'block';
}

function setupEventListeners() {
    registrarBtn.addEventListener('click', registrarParticipante);
    cambiarGrupoBtn.addEventListener('click', cambiarGrupo);
    verApuestasBtn.addEventListener('click', verMisApuestas);
    
    const modal = document.getElementById('modal-apuestas');
    const closeBtn = document.querySelector('.modal-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => modal.style.display = 'none');
    }
    window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
}

init();