// src/main.js - Con selección de grupos, auto-registro y modal profesional
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
    agregarApuestaEnGrupo,
    getApuestasMultiplesDeParticipante,
    getResultadosDelGrupo,
    eliminarApuesta,
    getApuestasDePartido,
    getLimiteApuestasParticipante,
    getReglasDelGrupo
} from './groups.js';

// Variables globales
let currentGrupoId = '';
let currentGrupoNombre = '';
let currentParticipante = '';
let currentFecha = '';

// Elementos DOM
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

// ============ INICIALIZACIÓN ============
function init() {
    console.log('Iniciando aplicación...');
    cargarListaGrupos();
    configurarEventListeners();
    verificarSesionGuardada();
}

function verificarSesionGuardada() {
    const sesionGuardada = sessionStorage.getItem('quiniela_sesion_actual');
    if (sesionGuardada) {
        try {
            const sesion = JSON.parse(sesionGuardada);
            const grupos = getGrupos();
            if (grupos[sesion.grupoId]) {
                currentGrupoId = sesion.grupoId;
                currentGrupoNombre = grupos[sesion.grupoId].nombre;
                currentParticipante = sesion.participante;
                iniciarPanelApuestas();
            }
        } catch(e) {
            console.error('Error al cargar sesión:', e);
        }
    }
}

// ============ GRUPOS ============
function cargarListaGrupos() {
    const grupos = getGrupos();
    const gruposKeys = Object.keys(grupos);
    
    if (gruposKeys.length === 0) {
        gruposLista.innerHTML = '<div class="loading">⚠️ No hay grupos disponibles. Contactá al administrador.</div>';
        return;
    }
    
    let html = '';
    for (const [id, grupo] of Object.entries(grupos)) {
        html += `
            <div class="grupo-card-selector" data-id="${id}" data-nombre="${grupo.nombre}">
                <div class="grupo-nombre">🏆 ${grupo.nombre}</div>
                <div class="grupo-descripcion">${grupo.descripcion || 'Participa en este grupo'}</div>
                <div class="grupo-descripcion" style="font-size:0.7rem; margin-top:8px;">👥 ${grupo.participantes.length} participantes</div>
            </div>
        `;
    }
    gruposLista.innerHTML = html;
    
    // Agregar eventos a las tarjetas
    document.querySelectorAll('.grupo-card-selector').forEach(card => {
        card.addEventListener('click', () => {
            const grupoId = card.dataset.id;
            const grupoNombre = card.dataset.nombre;
            handleGrupoSeleccionado(grupoId, grupoNombre);
        });
    });
}

function handleGrupoSeleccionado(grupoId, grupoNombre) {
    currentGrupoId = grupoId;
    currentGrupoNombre = grupoNombre;
    
    // Obtener información del grupo
    const grupos = getGrupos();
    const grupo = grupos[grupoId];
    const totalParticipantes = grupo ? grupo.participantes.length : 0;
    
    // Mostrar modal personalizado
    const modal = document.getElementById('modal-verificacion');
    const modalGrupoNombre = document.getElementById('modal-grupo-nombre');
    const modalGrupoInfo = document.getElementById('modal-grupo-info');
    const nombreInput = document.getElementById('modal-nombre-input');
    const errorDiv = document.getElementById('modal-error-mensaje');
    
    modalGrupoNombre.textContent = `🏆 ${grupoNombre}`;
    modalGrupoInfo.innerHTML = `📊 ${totalParticipantes} participantes registrados<br>🔐 Grupo abierto para nuevos miembros`;
    nombreInput.value = '';
    errorDiv.style.display = 'none';
    
    // Guardar referencia para usar en los botones
    modal.dataset.grupoId = grupoId;
    modal.dataset.grupoNombre = grupoNombre;
    
    modal.style.display = 'flex';
    
    // Enfocar el input
    setTimeout(() => nombreInput.focus(), 100);
}

function cerrarModalVerificacion() {
    const modal = document.getElementById('modal-verificacion');
    modal.style.display = 'none';
}

function verificarYAEstoyRegistrado() {
    const modal = document.getElementById('modal-verificacion');
    const grupoId = modal.dataset.grupoId;
    const grupoNombre = modal.dataset.grupoNombre;
    const nombre = document.getElementById('modal-nombre-input').value.trim();
    const errorDiv = document.getElementById('modal-error-mensaje');
    
    if (!nombre) {
        errorDiv.textContent = '❌ Por favor, ingresa tu nombre';
        errorDiv.style.display = 'block';
        return;
    }
    
    const existe = participanteRegistrado(grupoId, nombre);
    
    if (existe) {
        currentGrupoId = grupoId;
        currentGrupoNombre = grupoNombre;
        currentParticipante = nombre;
        
        sessionStorage.setItem('quiniela_sesion_actual', JSON.stringify({
            participante: nombre,
            grupoId: grupoId,
            timestamp: Date.now()
        }));
        
        cerrarModalVerificacion();
        iniciarPanelApuestas();
    } else {
        errorDiv.textContent = `❌ El nombre "${nombre}" no está registrado en "${grupoNombre}". Verifica que esté escrito correctamente o regístrate.`;
        errorDiv.style.display = 'block';
    }
}

function irARegistro() {
    const modal = document.getElementById('modal-verificacion');
    const grupoId = modal.dataset.grupoId;
    const grupoNombre = modal.dataset.grupoNombre;
    
    currentGrupoId = grupoId;
    currentGrupoNombre = grupoNombre;
    
    cerrarModalVerificacion();
    mostrarFormularioRegistro();
}

function mostrarFormularioRegistro() {
    registroPanel.style.display = 'block';
    apuestasPanel.style.display = 'none';
    seleccionGruposDiv.style.display = 'block';
    grupoSeleccionadoNombre.innerHTML = `🏆 ${currentGrupoNombre}`;
    registroMensaje.innerHTML = '';
    registroNombre.value = '';
    registroTelefono.value = '';
    registroPanel.scrollIntoView({ behavior: 'smooth' });
}

// ============ REGISTRO ============
async function registrarNuevoParticipante() {
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
            iniciarPanelApuestas();
        }, 1000);
    } else {
        registroMensaje.innerHTML = `<div class="mensaje-error">❌ ${resultado.message}</div>`;
    }
}

// ============ PANEL DE APUESTAS ============
function iniciarPanelApuestas() {
    registroPanel.style.display = 'none';
    apuestasPanel.style.display = 'block';
    seleccionGruposDiv.style.display = 'none';
    
    participanteNombreDisplay.textContent = currentParticipante;
    participanteGrupoDisplay.textContent = `Grupo: ${currentGrupoNombre}`;
    
    cargarSelectorDias();
    configurarSelectorDias();
}

function cargarSelectorDias() {
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
    const diasArray = getDiasCalendario();
    if (diasArray.includes(hoy)) {
        diaSelect.value = hoy;
        currentFecha = hoy;
        cargarPartidos(hoy);
        actualizarEstadoDia(hoy);
    } else if (diasArray[0]) {
        diaSelect.value = diasArray[0];
        currentFecha = diasArray[0];
        cargarPartidos(diasArray[0]);
        actualizarEstadoDia(diasArray[0]);
    }
}

function configurarSelectorDias() {
    diaSelect.addEventListener('change', (e) => {
        currentFecha = e.target.value;
        if (currentFecha) {
            cargarPartidos(currentFecha);
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

function cargarPartidos(fecha) {
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
                ` : `<div class="score-readonly" id="readonly-${partido.id}"></div>`}
            </div>
        `;
    }).join('');
    
    cargarApuestasExistentes(fecha);
    configurarBotonesAgregar();
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
                    let clase = '';
                    if (resultado) {
                        if (apuesta.local === resultado.local && apuesta.visitante === resultado.visitante) clase = 'acierto-exacto';
                        else if ((apuesta.local > apuesta.visitante && resultado.local > resultado.visitante) ||
                                 (apuesta.local < apuesta.visitante && resultado.local < resultado.visitante) ||
                                 (apuesta.local === apuesta.visitante && resultado.local === resultado.visitante)) clase = 'acierto-ganador';
                        else clase = 'acierto-error';
                    }
                    html += `<div class="apuesta-item ${clase}">
                        <span>Pronóstico ${idx + 1}: ${apuesta.local} - ${apuesta.visitante}</span>
                        ${puedeApostar ? `<button class="btn-eliminar-apuesta" data-partido="${partido.id}" data-apuesta="${apuesta.id}">🗑️</button>` : ''}
                    </div>`;
                });
                html += '</div>';
                container.innerHTML = html;
            }
        }
        
        if (readonlyContainer && !puedeApostar && resultados[partido.id]) {
            readonlyContainer.innerHTML = `<div class="resultado-oficial">🏆 Resultado oficial: ${resultados[partido.id].local} - ${resultados[partido.id].visitante}</div>`;
        }
    });
    
    document.querySelectorAll('.btn-eliminar-apuesta').forEach(btn => {
        btn.onclick = () => {
            const partidoId = parseInt(btn.dataset.partido);
            const apuestaId = btn.dataset.apuesta;
            eliminarApuesta(currentGrupoId, currentParticipante, partidoId, apuestaId);
            cargarPartidos(currentFecha);
            mostrarMensaje('Pronóstico eliminado', 'success');
        };
    });
}

function configurarBotonesAgregar() {
    document.querySelectorAll('.btn-agregar-apuesta').forEach(btn => {
        btn.onclick = () => {
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
            mostrarMensaje(`✅ Pronóstico ${local}-${visitante} agregado (${actuales + 1}/${limite})`, 'success');
            cargarPartidos(currentFecha);
        };
    });
}

// ============ CAMBIAR GRUPO ============
function cambiarDeGrupo() {
    sessionStorage.removeItem('quiniela_sesion_actual');
    currentGrupoId = '';
    currentGrupoNombre = '';
    currentParticipante = '';
    registroPanel.style.display = 'none';
    apuestasPanel.style.display = 'none';
    seleccionGruposDiv.style.display = 'block';
    cargarListaGrupos();
}

// ============ VER MIS APUESTAS ============
function mostrarMisApuestas() {
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
                apuestasArray.push({ ...apuesta, partido, resultado: resultados[partidoId] });
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
            } else if ((ap.local > ap.visitante && ap.resultado.local > ap.resultado.visitante) ||
                       (ap.local < ap.visitante && ap.resultado.local < ap.resultado.visitante) ||
                       (ap.local === ap.visitante && ap.resultado.local === ap.resultado.visitante)) {
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

// ============ UTILIDADES ============
function mostrarMensaje(msg, tipo) {
    const mensajeDiv = document.getElementById('mensaje');
    mensajeDiv.textContent = msg;
    mensajeDiv.className = `mensaje ${tipo}`;
    setTimeout(() => {
        mensajeDiv.textContent = '';
        mensajeDiv.className = 'mensaje';
    }, 3000);
}

function configurarEventListeners() {
    if (registrarBtn) registrarBtn.addEventListener('click', registrarNuevoParticipante);
    if (cambiarGrupoBtn) cambiarGrupoBtn.addEventListener('click', cambiarDeGrupo);
    if (verApuestasBtn) verApuestasBtn.addEventListener('click', mostrarMisApuestas);
    
    // Eventos del modal de verificación
    const btnVerificar = document.getElementById('btn-verificar');
    const btnRegistrarNuevo = document.getElementById('btn-registrar-nuevo');
    const btnCancelar = document.getElementById('btn-cancelar-modal');
    const modalVerificacion = document.getElementById('modal-verificacion');
    const nombreInput = document.getElementById('modal-nombre-input');
    
    if (btnVerificar) btnVerificar.addEventListener('click', verificarYAEstoyRegistrado);
    if (btnRegistrarNuevo) btnRegistrarNuevo.addEventListener('click', irARegistro);
    if (btnCancelar) btnCancelar.addEventListener('click', cerrarModalVerificacion);
    
    if (modalVerificacion) {
        modalVerificacion.addEventListener('click', (e) => {
            if (e.target === modalVerificacion) cerrarModalVerificacion();
        });
    }
    
    if (nombreInput) {
        nombreInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') verificarYAEstoyRegistrado();
        });
    }
    
    // Modal de apuestas
    const modal = document.getElementById('modal-apuestas');
    const closeBtn = document.querySelector('.modal-close');
    if (closeBtn) closeBtn.addEventListener('click', () => modal.style.display = 'none');
    if (modal) window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
}

// Iniciar
init();