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
    validarContrasenaGrupo,
    agregarApuestaEnGrupo,
    getApuestasMultiplesDeParticipante,
    getResultadosDelGrupo,
    eliminarApuesta,
    getApuestasDePartido,
    getLimiteApuestasParticipante
} from './groups.js';

let currentGrupoId = '';
let currentGrupoNombre = '';
let currentParticipante = '';
let grupoAutenticado = false;
let currentFecha = '';

// Elementos del DOM
const gruposLista = document.getElementById('grupos-lista');
const contrasenaPanel = document.getElementById('contrasena-panel');
const registroPanel = document.getElementById('registro-panel');
const apuestasPanel = document.getElementById('apuestas-panel');
const grupoSeleccionadoNombre = document.getElementById('grupo-seleccionado-nombre');
const registroNombre = document.getElementById('registro-nombre');
const registroTelefono = document.getElementById('registro-telefono');
const registrarBtn = document.getElementById('registrar-btn');
const validarContrasenaBtn = document.getElementById('validar-contrasena-btn');
const grupoContrasena = document.getElementById('grupo-contrasena');
const contrasenaError = document.getElementById('contrasena-error');
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
    cargarReglas();
}

function cargarReglas() {
    const reglasGuardadas = localStorage.getItem('quiniela_reglas');
    const reglasDiv = document.getElementById('reglas-display');
    if (reglasDiv && reglasGuardadas) {
        reglasDiv.innerHTML = reglasGuardadas;
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
    
    // Eventos para seleccionar grupo
    document.querySelectorAll('.grupo-card-selector').forEach(card => {
        card.addEventListener('click', () => {
            const grupoId = card.dataset.grupoId;
            const grupoNombre = card.dataset.grupoNombre;
            seleccionarGrupo(grupoId, grupoNombre);
        });
    });
}

function seleccionarGrupo(grupoId, grupoNombre) {
    currentGrupoId = grupoId;
    currentGrupoNombre = grupoNombre;
    grupoAutenticado = false;
    currentParticipante = '';
    
    // Limpiar estados
    contrasenaPanel.style.display = 'block';
    registroPanel.style.display = 'none';
    apuestasPanel.style.display = 'none';
    grupoSeleccionadoNombre.innerHTML = `🏆 ${grupoNombre}`;
    grupoContrasena.value = '';
    contrasenaError.innerHTML = '';
    registroMensaje.innerHTML = '';
    registroNombre.value = '';
    registroTelefono.value = '';
    
    // Verificar si ya hay una sesión guardada para este grupo
    const sesionGuardada = sessionStorage.getItem(`quiniela_sesion_${grupoId}`);
    if (sesionGuardada) {
        const sesion = JSON.parse(sesionGuardada);
        if (sesion.participante) {
            currentParticipante = sesion.participante;
            grupoAutenticado = true;
            contrasenaPanel.style.display = 'none';
            iniciarSesionParticipante();
        }
    }
}

function validarContrasena() {
    const contrasena = grupoContrasena.value;
    if (!contrasena) {
        contrasenaError.innerHTML = '❌ Ingresá la contraseña del grupo';
        return;
    }
    
    const esValida = validarContrasenaGrupo(currentGrupoId, contrasena);
    
    if (esValida) {
        contrasenaPanel.style.display = 'none';
        registroPanel.style.display = 'block';
        contrasenaError.innerHTML = '';
    } else {
        contrasenaError.innerHTML = '❌ Contraseña incorrecta';
    }
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
        grupoAutenticado = true;
        
        // Guardar sesión
        sessionStorage.setItem(`quiniela_sesion_${currentGrupoId}`, JSON.stringify({
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
    
    participanteNombreDisplay.textContent = currentParticipante;
    participanteGrupoDisplay.textContent = `Grupo: ${currentGrupoNombre}`;
    
    cargarCalendario();
    cargarDias();
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
    } else if (dias[0]) {
        diaSelect.value = dias[0];
        currentFecha = dias[0];
        cargarPartidosDelDia(dias[0]);
    }
}

function cargarCalendario() {
    diaSelect.addEventListener('change', (e) => {
        currentFecha = e.target.value;
        if (currentFecha) {
            cargarPartidosDelDia(currentFecha);
        }
    });
}

function cargarPartidosDelDia(fecha) {
    const partidos = getPartidosPorDia(fecha);
    const esPasado = isPartidoPasado(fecha);
    const esHoy = !esPasado && (fecha === getDiaActualLocal());
    
    apuestasContainer.innerHTML = partidos.map(partido => {
        const puedeApostar = esHoy && puedeApostarPartido(partido.fecha, partido.hora);
        const limiteParticipante = getLimiteApuestasParticipante(currentGrupoId, currentParticipante);
        const apuestasActuales = getApuestasDePartido(currentGrupoId, currentParticipante, partido.id).length;
        
        return `
            <div class="apuesta-card ${!puedeApostar ? 'bloqueado' : ''}" data-id="${partido.id}">
                <div class="match-info">
                    <div class="match-teams">${conBandera(partido.local)} vs ${conBandera(partido.visitante)}</div>
                    <div class="match-date">
                        🕐 ${partido.hora} | ${getFaseNombre(partido.fase)}
                        ${!puedeApostar ? ' | 🔒 Partido cerrado' : ' | ✅ Disponible'}
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
        
        if (container && apuestasPartido.length > 0) {
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
        } else if (container && apuestasPartido.length === 0) {
            container.innerHTML = '<div class="no-apuestas">📭 Sin pronósticos</div>';
        }
        
        if (readonlyContainer && !puedeApostar && resultados[partido.id]) {
            readonlyContainer.innerHTML = `<div class="resultado-oficial">🏆 Resultado: ${resultados[partido.id].local} - ${resultados[partido.id].visitante}</div>`;
        }
    });
    
    // Eventos para eliminar
    document.querySelectorAll('.btn-eliminar-apuesta').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const partidoId = parseInt(btn.dataset.partido);
            const apuestaId = btn.dataset.apuesta;
            eliminarApuesta(currentGrupoId, currentParticipante, partidoId, apuestaId);
            cargarPartidosDelDia(currentFecha);
        });
    });
}

function setupAgregarApuestas() {
    document.querySelectorAll('.btn-agregar-apuesta').forEach(btn => {
        btn.addEventListener('click', () => {
            const partidoId = parseInt(btn.dataset.id);
            const card = btn.closest('.apuesta-card');
            const local = parseInt(card.querySelector('.score-local').value);
            const visitante = parseInt(card.querySelector('.score-visitante').value);
            
            if (isNaN(local) || isNaN(visitante)) {
                mostrarMensaje('Ingresá un marcador válido', 'error');
                return;
            }
            
            const limite = getLimiteApuestasParticipante(currentGrupoId, currentParticipante);
            const actuales = getApuestasDePartido(currentGrupoId, currentParticipante, partidoId).length;
            
            if (actuales >= limite) {
                mostrarMensaje(`❌ Límite alcanzado (${limite} pronósticos)`, 'error');
                return;
            }
            
            agregarApuestaEnGrupo(currentGrupoId, currentParticipante, partidoId, { local, visitante });
            mostrarMensaje(`✅ Pronóstico ${local}-${visitante} agregado`, 'success');
            cargarPartidosDelDia(currentFecha);
        });
    });
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
    // Limpiar sesión
    sessionStorage.removeItem(`quiniela_sesion_${currentGrupoId}`);
    currentGrupoId = '';
    currentGrupoNombre = '';
    currentParticipante = '';
    grupoAutenticado = false;
    
    // Resetear UI
    contrasenaPanel.style.display = 'none';
    registroPanel.style.display = 'none';
    apuestasPanel.style.display = 'none';
    
    // Recargar grupos
    cargarGrupos();
}

function verMisApuestas() {
    const todasApuestas = getApuestasMultiplesDeParticipante(currentGrupoId, currentParticipante);
    const resultados = getResultadosDelGrupo(currentGrupoId);
    const modalBody = document.getElementById('modal-body');
    const modal = document.getElementById('modal-apuestas');
    
    if (Object.keys(todasApuestas).length === 0) {
        modalBody.innerHTML = '<p style="text-align:center;">📭 No has realizado ningún pronóstico</p>';
        modal.style.display = 'block';
        return;
    }
    
    let html = `<h3>Grupo: ${currentGrupoNombre}</h3>`;
    let totalPuntos = 0;
    
    for (const [partidoId, apuestas] of Object.entries(todasApuestas)) {
        const partido = todosLosPartidos.find(p => p.id === parseInt(partidoId));
        if (partido && apuestas.length > 0) {
            html += `<h4>📅 ${formatearFecha(partido.fecha)} - ${partido.local} vs ${partido.visitante}</h4>`;
            apuestas.forEach(apuesta => {
                const resultado = resultados[partidoId];
                let puntos = 0;
                let acierto = '';
                if (resultado) {
                    if (apuesta.local === resultado.local && apuesta.visitante === resultado.visitante) {
                        puntos = 3;
                        acierto = '✅ EXACTO +3';
                    } else if (
                        (apuesta.local > apuesta.visitante && resultado.local > resultado.visitante) ||
                        (apuesta.local < apuesta.visitante && resultado.local < resultado.visitante) ||
                        (apuesta.local === apuesta.visitante && resultado.local === resultado.visitante)
                    ) {
                        puntos = 1;
                        acierto = '🎯 GANADOR +1';
                    } else {
                        acierto = '❌ ERROR 0';
                    }
                    totalPuntos += puntos;
                }
                html += `<div class="apuesta-resumen">
                    Pronóstico: ${apuesta.local} - ${apuesta.visitante}
                    ${resultado ? `<br>Resultado: ${resultado.local} - ${resultado.visitante}<br>${acierto} ${puntos > 0 ? `(+${puntos})` : ''}` : '<br>⏳ Resultado pendiente'}
                </div>`;
            });
        }
    }
    
    html += `<div class="total-puntos">🏆 TOTAL DE PUNTOS: ${totalPuntos}</div>`;
    modalBody.innerHTML = html;
    modal.style.display = 'block';
}

function setupEventListeners() {
    validarContrasenaBtn.addEventListener('click', validarContrasena);
    registrarBtn.addEventListener('click', registrarParticipante);
    cambiarGrupoBtn.addEventListener('click', cambiarGrupo);
    verApuestasBtn.addEventListener('click', verMisApuestas);
    
    // Modal close
    const modal = document.getElementById('modal-apuestas');
    const closeBtn = document.querySelector('.modal-close');
    closeBtn?.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
}

// Cargar reglas en el modal
function cargarReglasEnModal() {
    const reglasGuardadas = localStorage.getItem('quiniela_reglas');
    const reglasDiv = document.getElementById('reglas-display');
    if (reglasDiv && reglasGuardadas) {
        reglasDiv.innerHTML = reglasGuardadas;
    }
}

init();
cargarReglasEnModal();