// src/main.js - Con selección de grupos, auto-registro y popup de reglas
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
    getGrupo,
    registrarParticipanteEnGrupo,
    participanteRegistrado,
    agregarApuestaEnGrupo,
    getApuestasMultiplesDeParticipante,
    getResultadosDelGrupo,
    eliminarApuesta,
    getApuestasDePartido,
    getLimiteApuestasParticipante,
    getReglasDelGrupo,
    getPremiosDelGrupo
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

// ============ POPUP DE REGLAS ============

function mostrarPopupReglas() {
    const noMostrar = localStorage.getItem('quiniela_no_mostrar_reglas');
    if (noMostrar === 'true') {
        return;
    }
    
    const popup = document.getElementById('popup-rules');
    if (popup) {
        popup.style.display = 'flex';
        
        const cerrarBtn = document.getElementById('cerrar-rules-btn');
        const noMostrarCheck = document.getElementById('no-mostrar-rules');
        
        const cerrarPopup = () => {
            popup.style.display = 'none';
            if (noMostrarCheck && noMostrarCheck.checked) {
                localStorage.setItem('quiniela_no_mostrar_reglas', 'true');
            }
        };
        
        const newCerrarBtn = cerrarBtn.cloneNode(true);
        if (cerrarBtn && cerrarBtn.parentNode) {
            cerrarBtn.parentNode.replaceChild(newCerrarBtn, cerrarBtn);
        }
        
        if (newCerrarBtn) {
            newCerrarBtn.addEventListener('click', cerrarPopup);
        }
        
        popup.addEventListener('click', (e) => {
            if (e.target === popup) {
                cerrarPopup();
            }
        });
        
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                cerrarPopup();
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
    }
}

// ============ NOTIFICACIÓN CENTRAL ============

function mostrarNotificacion(mensaje, tipo = 'success') {
    const notificacion = document.createElement('div');
    notificacion.className = `notificacion-central ${tipo}`;
    notificacion.innerHTML = `
        <div class="notificacion-contenido">
            <span class="notificacion-icono">${tipo === 'success' ? '✅' : tipo === 'error' ? '❌' : 'ℹ️'}</span>
            <span class="notificacion-mensaje">${mensaje}</span>
        </div>
    `;
    
    document.body.appendChild(notificacion);
    
    setTimeout(() => {
        notificacion.classList.add('mostrar');
    }, 10);
    
    setTimeout(() => {
        notificacion.classList.remove('mostrar');
        setTimeout(() => {
            notificacion.remove();
        }, 300);
    }, 3000);
}

// ============ MANEJADOR GLOBAL PARA AGREGAR APUESTAS ============

let ultimoClick = 0;
const TIEMPO_ESPERA = 1000; // 1 segundo de espera entre clicks

window.agregarApuestaHandler = async function(partidoId, btnElement) {
    // Evitar múltiples clicks rápidos
    const ahora = Date.now();
    if (ahora - ultimoClick < TIEMPO_ESPERA) {
        console.log('⚠️ Click demasiado rápido, ignorando...');
        return;
    }
    ultimoClick = ahora;
    
    // Evitar si el botón ya está deshabilitado
    if (btnElement.disabled) {
        console.log('⚠️ Botón ya deshabilitado, ignorando...');
        return;
    }
    
    const card = btnElement.closest('.apuesta-card');
    if (!card) return;
    
    const localInput = card.querySelector('.score-local');
    const visitanteInput = card.querySelector('.score-visitante');
    
    const local = parseInt(localInput.value);
    const visitante = parseInt(visitanteInput.value);
    
    if (isNaN(local) || isNaN(visitante)) {
        mostrarNotificacion('❌ Ingresá un marcador válido', 'error');
        return;
    }
    
    if (local < 0 || local > 20 || visitante < 0 || visitante > 20) {
        mostrarNotificacion('❌ Usá números entre 0 y 20', 'error');
        return;
    }
    
    const limite = await getLimiteApuestasParticipante(currentGrupoId, currentParticipante);
    const apuestasActuales = await getApuestasDePartido(currentGrupoId, currentParticipante, partidoId);
    
    // Verificar si ya existe el mismo marcador
    const yaExiste = apuestasActuales.some(a => a.local === local && a.visitante === visitante);
    if (yaExiste) {
        mostrarNotificacion(`❌ Ya tienes el pronóstico ${local}-${visitante} para este partido`, 'error');
        return;
    }
    
    if (apuestasActuales.length >= limite) {
        mostrarNotificacion(`❌ Límite alcanzado (${limite} pronósticos)`, 'error');
        return;
    }
    
    // Deshabilitar botón
    btnElement.disabled = true;
    const textoOriginal = btnElement.textContent;
    btnElement.textContent = '⏳ Guardando...';
    
    const apuestaId = await agregarApuestaEnGrupo(currentGrupoId, currentParticipante, partidoId, { local, visitante });
    
    if (apuestaId) {
            mostrarNotificacion(`✅ Pronóstico ${local}-${visitante} agregado`, 'success');
            localInput.value = '';
            visitanteInput.value = '';
            await cargarPartidos(currentFecha);
            mostrarQR();
        } else {
            mostrarNotificacion('❌ Error al agregar pronóstico o ya existe', 'error');
            btnElement.disabled = false;
            btnElement.textContent = textoOriginal;
        }
};

window.apostarEmpateHandler = async function(partidoId, btnElement) {
    const ahora = Date.now();
    if (ahora - ultimoClick < TIEMPO_ESPERA) return;
    ultimoClick = ahora;

    if (btnElement.disabled) return;

    const limite = await getLimiteApuestasParticipante(currentGrupoId, currentParticipante);
    const apuestasActuales = await getApuestasDePartido(currentGrupoId, currentParticipante, partidoId);

    const yaTieneEmpate = apuestasActuales.some(a => a.esEmpate === true);
    if (yaTieneEmpate) {
        mostrarNotificacion('❌ Ya tienes un pronóstico de empate para este partido', 'error');
        return;
    }

    if (apuestasActuales.length >= limite) {
        mostrarNotificacion(`❌ Límite alcanzado (${limite} pronósticos)`, 'error');
        return;
    }

    btnElement.disabled = true;
    const textoOriginal = btnElement.textContent;
    btnElement.textContent = '⏳ Guardando...';

    const apuestaId = await agregarApuestaEnGrupo(
        currentGrupoId,
        currentParticipante,
        partidoId,
        { local: -1, visitante: -1, esEmpate: true }
    );

    if (apuestaId) {
        mostrarNotificacion('🤝 Pronóstico de EMPATE agregado', 'success');
        await cargarPartidos(currentFecha);
        mostrarQR();
    } else {
        mostrarNotificacion('❌ Error al agregar empate', 'error');
        btnElement.disabled = false;
        btnElement.textContent = textoOriginal;
    }
};

window.eliminarApuestaHandler = async function(partidoId, apuestaId, btnElement) {
    if (btnElement.disabled) return;
    
    if (confirm('¿Eliminar este pronóstico?')) {
        btnElement.disabled = true;
        btnElement.textContent = '⏳';
        
        const resultado = await eliminarApuesta(currentGrupoId, currentParticipante, partidoId, apuestaId);
        if (resultado) {
            mostrarNotificacion('🗑️ Pronóstico eliminado correctamente', 'success');
            await cargarPartidos(currentFecha);
        } else {
            mostrarNotificacion('❌ Error al eliminar pronóstico', 'error');
            btnElement.disabled = false;
            btnElement.textContent = '🗑️';
        }
    }
};

// ============ INICIALIZACIÓN ============
async function init() {
    console.log('🚀 Iniciando aplicación...');
    await cargarListaGrupos();
    configurarEventListeners();
    await verificarSesionGuardada();
    mostrarPopupReglas();
}

async function verificarSesionGuardada() {
    const sesionGuardada = sessionStorage.getItem('quiniela_sesion_actual');
    if (sesionGuardada) {
        try {
            const sesion = JSON.parse(sesionGuardada);
            const grupos = await getGrupos();
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
// REEMPLAZAR toda la función por esta:
async function cargarListaGrupos() {
    console.log('📋 Cargando lista de grupos...');
    const grupos = await getGrupos();
    const gruposKeys = Object.keys(grupos);

    if (gruposKeys.length === 0) {
        gruposLista.innerHTML = '<div class="loading">⚠️ No hay grupos disponibles. Contactá al administrador.</div>';
        return;
    }

    // Ocultar el banner del grupo general (ya no existe)
    const banner = document.getElementById('banner-grupo-general');
    if (banner) banner.style.display = 'none';

    // Buscar el grupo principal (familia o el primero que exista)
    const GRUPO_PRINCIPAL_ID = 'familia'; // ← ID de tu grupo FAMPER'S

    const grupoPrincipal = grupos[GRUPO_PRINCIPAL_ID];

    if (!grupoPrincipal) {
        gruposLista.innerHTML = '<div class="loading">⚠️ No hay grupos disponibles.</div>';
        return;
    }

    // Mostrar SOLO el grupo principal con estilo de banner especial
    const seleccionDiv = document.getElementById('seleccion-grupos');
    if (seleccionDiv) {
        seleccionDiv.innerHTML = `
            <div id="banner-grupo-principal" 
                 class="banner-grupo-general" 
                 style="cursor:pointer; margin-bottom: 20px;"
                 onclick="window._handleGrupoPrincipal()">
                <div class="banner-content">
                    <div class="banner-icon">🏆</div>
                    <div class="banner-text">
                        <h3>${grupoPrincipal.nombre}</h3>
                        <p>${grupoPrincipal.descripcion || 'Premios más altos • Puntos extra • Participación especial'}</p>
                        <p style="font-size:0.8rem; margin-top:6px; color:rgba(255,255,255,0.5);">
                            👥 ${grupoPrincipal.participantes.length} participantes registrados
                        </p>
                    </div>
                    <button class="btn-unirse-general" onclick="event.stopPropagation(); window._handleGrupoPrincipal()">
                        🎯 Ingresar al Grupo
                    </button>
                </div>
            </div>
        `;
    }

    // Handler global para el grupo principal
    window._handleGrupoPrincipal = () => {
        handleGrupoSeleccionado(GRUPO_PRINCIPAL_ID, grupoPrincipal.nombre);
    };
}

async function mostrarBannerGrupoGeneral() {
    const grupos = await getGrupos();
    const banner = document.getElementById('banner-grupo-general');
    
    if (currentParticipante && grupos['general'] && 
        grupos['general'].participantes.includes(currentParticipante)) {
        if (banner) banner.style.display = 'none';
        return;
    }
    
    if (banner && grupos['general']) {
        banner.style.display = 'block';
        
        const btnUnirse = document.getElementById('btn-unirse-general');
        if (btnUnirse) {
            btnUnirse.onclick = (e) => {
                e.stopPropagation();
                mostrarModalGrupoGeneral();
            };
        }
        
        banner.onclick = (e) => {
            if (e.target === btnUnirse || btnUnirse?.contains(e.target)) return;
            mostrarModalGrupoGeneral();
        };
    }
}

// ============ MODAL GRUPO GENERAL ============

function mostrarModalGrupoGeneral() {
    const modal = document.getElementById('modal-general');
    if (!modal) return;

    // Limpiar todos los inputs
    const campos = ['general-nombre-ingresar', 'general-nombre-registro', 'general-telefono-registro'];
    campos.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    // Ocultar todos los mensajes de error
    const errores = ['general-error-ingresar', 'general-error-registro'];
    errores.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    // Siempre mostrar solo el paso 1 al abrir
    const pasoVerificar = document.getElementById('general-paso-verificar');
    const pasoIngresar = document.getElementById('general-paso-ingresar');
    const pasoRegistro = document.getElementById('general-paso-registro');

    if (pasoVerificar) pasoVerificar.style.display = 'block';
    if (pasoIngresar) pasoIngresar.style.display = 'none';
    if (pasoRegistro) pasoRegistro.style.display = 'none';

    modal.style.display = 'flex';
}

function cerrarModalGeneral() {
    const modal = document.getElementById('modal-general');
    modal.style.display = 'none';
}

function mostrarPasoIngresar() {
    const pasoVerificar = document.getElementById('general-paso-verificar');
    const pasoIngresar = document.getElementById('general-paso-ingresar');
    const pasoRegistro = document.getElementById('general-paso-registro');
    const nombreInput = document.getElementById('general-nombre-ingresar');
    const errorDiv = document.getElementById('general-error-ingresar');
    
    if (pasoVerificar) pasoVerificar.style.display = 'none';
    if (pasoIngresar) pasoIngresar.style.display = 'block';
    if (pasoRegistro) pasoRegistro.style.display = 'none';
    if (errorDiv) errorDiv.style.display = 'none';
    if (nombreInput) nombreInput.focus();
}

function mostrarPasoRegistro() {
    const pasoVerificar = document.getElementById('general-paso-verificar');
    const pasoIngresar = document.getElementById('general-paso-ingresar');
    const pasoRegistro = document.getElementById('general-paso-registro');
    const nombreInput = document.getElementById('general-nombre-registro');
    const errorDiv = document.getElementById('general-error-registro');
    
    if (pasoVerificar) pasoVerificar.style.display = 'none';
    if (pasoIngresar) pasoIngresar.style.display = 'none';
    if (pasoRegistro) pasoRegistro.style.display = 'block';
    if (errorDiv) errorDiv.style.display = 'none';
    if (nombreInput) nombreInput.focus();
}

function volverAlVerificar() {
    const pasoVerificar = document.getElementById('general-paso-verificar');
    const pasoIngresar = document.getElementById('general-paso-ingresar');
    const pasoRegistro = document.getElementById('general-paso-registro');
    const errorIngresar = document.getElementById('general-error-ingresar');
    const errorRegistro = document.getElementById('general-error-registro');
    
    if (pasoVerificar) pasoVerificar.style.display = 'block';
    if (pasoIngresar) pasoIngresar.style.display = 'none';
    if (pasoRegistro) pasoRegistro.style.display = 'none';
    if (errorIngresar) errorIngresar.style.display = 'none';
    if (errorRegistro) errorRegistro.style.display = 'none';
}

async function ingresarAlGrupoGeneral() {
    const nombre = document.getElementById('general-nombre-ingresar').value.trim();
    const errorDiv = document.getElementById('general-error-ingresar');
    
    if (!nombre) {
        if (errorDiv) {
            errorDiv.textContent = '❌ Por favor, ingresa tu nombre';
            errorDiv.style.display = 'block';
        }
        return;
    }
    
    const grupos = await getGrupos();
    const grupoGeneral = grupos['general'];
    
    if (!grupoGeneral) {
        if (errorDiv) {
            errorDiv.textContent = '❌ Error: Grupo General no disponible';
            errorDiv.style.display = 'block';
        }
        return;
    }
    
    const existe = grupoGeneral.participantes.some(p => p.toLowerCase() === nombre.toLowerCase());
    
    if (existe) {
        currentGrupoId = 'general';
        currentGrupoNombre = grupoGeneral.nombre;
        currentParticipante = nombre;
        
        sessionStorage.setItem('quiniela_sesion_actual', JSON.stringify({
            participante: nombre,
            grupoId: 'general',
            timestamp: Date.now()
        }));
        
        cerrarModalGeneral();
        iniciarPanelApuestas();
        mostrarNotificacion(`🎉 Bienvenido de vuelta ${nombre}!`, 'success');
    } else {
        if (errorDiv) {
            errorDiv.textContent = `❌ El nombre "${nombre}" no está registrado en el Grupo General. Verifica o regístrate.`;
            errorDiv.style.display = 'block';
        }
    }
}

async function registrarEnGrupoGeneral() {
    const nombre = document.getElementById('general-nombre-registro').value.trim();
    const telefono = document.getElementById('general-telefono-registro').value.trim();
    const errorDiv = document.getElementById('general-error-registro');
    
    if (!nombre) {
        if (errorDiv) {
            errorDiv.textContent = '❌ El nombre es obligatorio';
            errorDiv.style.display = 'block';
        }
        return;
    }
    
    const grupos = await getGrupos();
    const grupoGeneral = grupos['general'];
    
    if (!grupoGeneral) {
        if (errorDiv) {
            errorDiv.textContent = '❌ Error: Grupo General no disponible';
            errorDiv.style.display = 'block';
        }
        return;
    }
    
    const existe = grupoGeneral.participantes.some(p => p.toLowerCase() === nombre.toLowerCase());
    
    if (existe) {
        if (errorDiv) {
            errorDiv.textContent = `❌ El nombre "${nombre}" ya está registrado. Usa la opción "Ya estoy registrado".`;
            errorDiv.style.display = 'block';
        }
        return;
    }
    
    const resultado = await unirseAlGrupoGeneral(nombre, telefono);
    
    if (resultado && resultado.success) {
        currentGrupoId = 'general';
        currentGrupoNombre = grupoGeneral.nombre;
        currentParticipante = nombre;
        
        sessionStorage.setItem('quiniela_sesion_actual', JSON.stringify({
            participante: nombre,
            grupoId: 'general',
            timestamp: Date.now()
        }));
        
        cerrarModalGeneral();
        iniciarPanelApuestas();
        mostrarNotificacion(`🎉 ${resultado.message}`, 'success');
    } else {
        if (errorDiv) {
            errorDiv.textContent = `❌ ${resultado?.message || 'Error al registrar'}`;
            errorDiv.style.display = 'block';
        }
    }
}

// ============ SELECCIÓN DE GRUPOS NORMALES ============

async function handleGrupoSeleccionado(grupoId, grupoNombre) {
    currentGrupoId = grupoId;
    currentGrupoNombre = grupoNombre;
    
    const grupos = await getGrupos();
    const grupo = grupos[grupoId];
    const totalParticipantes = grupo ? grupo.participantes.length : 0;
    
    const modal = document.getElementById('modal-verificacion');
    const modalGrupoNombre = document.getElementById('modal-grupo-nombre');
    const modalGrupoInfo = document.getElementById('modal-grupo-info');
    const nombreInput = document.getElementById('modal-nombre-input');
    const errorDiv = document.getElementById('modal-error-mensaje');
    
    modalGrupoNombre.textContent = `🏆 ${grupoNombre}`;
    modalGrupoInfo.innerHTML = `📊 ${totalParticipantes} participantes registrados<br>🔐 Grupo abierto para nuevos miembros`;
    
    nombreInput.value = '';
    errorDiv.style.display = 'none';
    
    modal.dataset.grupoId = grupoId;
    modal.dataset.grupoNombre = grupoNombre;
    
    modal.style.display = 'flex';
    setTimeout(() => nombreInput.focus(), 100);
}

function cerrarModalVerificacion() {
    const modal = document.getElementById('modal-verificacion');
    modal.style.display = 'none';
}

async function verificarYAEstoyRegistrado() {
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
    
    const existe = await participanteRegistrado(grupoId, nombre);
    
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
        mostrarNotificacion(`🎉 Bienvenido de vuelta ${nombre}!`, 'success');
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
    
    const resultado = await registrarParticipanteEnGrupo(currentGrupoId, nombre, telefono);
    
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
            mostrarNotificacion(`🎉 ${resultado.message}`, 'success');
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
        estadoDia.innerHTML = '<span class="badge-activo">✅ DÍA ACTIVO - Puedes apostar</span>';
    } else {
        estadoDia.innerHTML = '<span class="badge-futuro">⏳ DÍA FUTURO - Apuestas disponibles el día del partido</span>';
    }
}

async function cargarPartidos(fecha) {
    const partidos = getPartidosPorDia(fecha);
    const esPasado = isPartidoPasado(fecha);
    const esHoy = !esPasado && (fecha === getDiaActualLocal());
    
    const limiteParticipante = await getLimiteApuestasParticipante(currentGrupoId, currentParticipante);
    
    apuestasContainer.innerHTML = partidos.map(partido => {
        const puedeApostar = esHoy && puedeApostarPartido(partido.fecha, partido.hora);
        
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
                    <div class="score-inputs" style="flex-direction: column; align-items: center; gap: 8px;">
                        
                        <!-- Etiquetas con nombres de equipos -->
                        <div style="display: flex; align-items: center; gap: 12px; width: 100%; justify-content: center; margin-bottom: 4px;">
                            <span style="font-size: 0.75rem; color: #ffd700; font-weight: 600; width: 85px; text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                ${partido.local}
                            </span>
                            <span style="width: 40px;"></span>
                            <span style="font-size: 0.75rem; color: #ffd700; font-weight: 600; width: 85px; text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                ${partido.visitante}
                            </span>
                            <span style="width: 120px;"></span>
                        </div>

                        <!-- Inputs con placeholder más claro -->
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="text-align: center;">
                                <input type="number" class="score-local" 
                                    placeholder="0" min="0" max="20"
                                    style="text-align: center;">
                                <div style="font-size: 0.65rem; color: rgba(255,255,255,0.4); margin-top: 3px;">LOCAL</div>
                            </div>
                            <span class="vs">-</span>
                            <div style="text-align: center;">
                                <input type="number" class="score-visitante" 
                                    placeholder="0" min="0" max="20"
                                    style="text-align: center;">
                                <div style="font-size: 0.65rem; color: rgba(255,255,255,0.4); margin-top: 3px;">VISITANTE</div>
                            </div>
                            <button class="btn-agregar-apuesta" data-id="${partido.id}" 
                                    onclick="agregarApuestaHandler(${partido.id}, this)">
                                ➕ Agregar
                            </button>
                        </div>
                    </div>
                        <div class="btn-empate-container" style="text-align:center; margin-top:10px;">
                            <button class="btn-empate" onclick="apostarEmpateHandler(${partido.id}, this)">🤝 Apostar Empate (X)</button>
                        </div>
                        <div class="limite-apuestas">📊 Límite: ${limiteParticipante} pronóstico(s)</div>
                    </div>
                ` : `<div class="score-readonly" id="readonly-${partido.id}"></div>`}
            </div>
        `;
    }).join('');
    
    await cargarApuestasExistentes(fecha);
}

async function cargarApuestasExistentes(fecha) {
    const todasApuestas = await getApuestasMultiplesDeParticipante(currentGrupoId, currentParticipante);
    const partidos = getPartidosPorDia(fecha);
    const resultados = await getResultadosDelGrupo(currentGrupoId);
    const esHoy = !isPartidoPasado(fecha) && (fecha === getDiaActualLocal());
    const puedeApostar = esHoy;
    
    const limiteParticipante = await getLimiteApuestasParticipante(currentGrupoId, currentParticipante);
    
    for (const partido of partidos) {
        let apuestasPartido = todasApuestas[partido.id] || [];
        
        // Eliminar duplicados en los datos (por si acaso)
        const unicas = [];
        const claves = new Set();
        for (const apuesta of apuestasPartido) {
            const clave = `${apuesta.local}-${apuesta.visitante}`;
            if (!claves.has(clave)) {
                claves.add(clave);
                unicas.push(apuesta);
            }
        }
        apuestasPartido = unicas;
        
        const container = document.getElementById(`apuestas-lista-${partido.id}`);
        const readonlyContainer = document.getElementById(`readonly-${partido.id}`);
        
        // Actualizar límite mostrado
        const limiteSpan = document.querySelector(`.apuesta-card[data-id="${partido.id}"] .limite-apuestas`);
        const agregarBtn = document.querySelector(`.apuesta-card[data-id="${partido.id}"] .btn-agregar-apuesta`);
        
        if (limiteSpan && puedeApostar) {
            const usados = apuestasPartido.length;
            limiteSpan.innerHTML = `📊 Usados: ${usados}/${limiteParticipante} pronósticos`;
            
            // Si ya se alcanzó el límite, deshabilitar el botón de agregar
            if (agregarBtn) {
                if (usados >= limiteParticipante) {
                    agregarBtn.disabled = true;
                    agregarBtn.textContent = '🔒 Límite alcanzado';
                } else {
                    agregarBtn.disabled = false;
                    agregarBtn.textContent = '➕ Agregar';
                }
            }
        }
        
        if (container) {
            if (apuestasPartido.length === 0) {
                container.innerHTML = '<div class="no-apuestas">📭 Sin pronósticos</div>';
            } else {
                let html = '<div class="apuestas-multiples">';
                apuestasPartido.forEach((apuesta, idx) => {
                    const resultado = resultados[partido.id];
                    const esEmpate = apuesta.esEmpate === true;
                    const marcador = esEmpate ? '🤝 EMPATE (X)' : `${apuesta.local} - ${apuesta.visitante}`;
                    let clase = '';
                    if (resultado) {
                        if (esEmpate) {
                            if (resultado.local === resultado.visitante) clase = 'acierto-ganador';
                            else clase = 'acierto-error';
                        } else {
                            if (apuesta.local === resultado.local && apuesta.visitante === resultado.visitante) clase = 'acierto-exacto';
                            else if ((apuesta.local > apuesta.visitante && resultado.local > resultado.visitante) ||
                                     (apuesta.local < apuesta.visitante && resultado.local < resultado.visitante) ||
                                     (apuesta.local === apuesta.visitante && resultado.local === resultado.visitante)) clase = 'acierto-ganador';
                            else clase = 'acierto-error';
                        }
                    }
                    html += `<div class="apuesta-item ${clase}" data-apuesta-id="${apuesta.id}">
                        <span>Pronóstico ${idx + 1}: ${marcador}</span>
                        ${puedeApostar ? `<button class="btn-eliminar-apuesta" onclick="eliminarApuestaHandler(${partido.id}, '${apuesta.id}', this)">🗑️</button>` : ''}
                    </div>`;
                });
                html += '</div>';
                container.innerHTML = html;
            }
        }
        
        if (readonlyContainer && !puedeApostar && resultados[partido.id]) {
            readonlyContainer.innerHTML = `<div class="resultado-oficial">🏆 Resultado oficial: ${resultados[partido.id].local} - ${resultados[partido.id].visitante}</div>`;
        }
    }
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
    cargarListaGrupos(); // recarga el banner principal
    mostrarNotificacion('🔄 Has salido del grupo', 'info');
}

// ============ VER MIS APUESTAS ============
async function mostrarMisApuestas() {
    console.log('Mostrando apuestas para:', currentParticipante, 'en grupo:', currentGrupoId);
    
    if (!currentParticipante) {
        mostrarNotificacion('❌ Primero selecciona un grupo y regístrate', 'error');
        return;
    }
    
    const todasApuestas = await getApuestasMultiplesDeParticipante(currentGrupoId, currentParticipante);
    const resultados = await getResultadosDelGrupo(currentGrupoId);
    const modalBody = document.getElementById('modal-body');
    const modal = document.getElementById('modal-apuestas');
    const reglas = await getReglasDelGrupo(currentGrupoId);
    
    if (!modalBody || !modal) {
        console.error('Modal no encontrado');
        return;
    }
    
    if (Object.keys(todasApuestas).length === 0) {
        modalBody.innerHTML = `
            <div style="text-align:center; padding:60px 20px;">
                <div style="font-size: 4rem; margin-bottom: 15px;">📭</div>
                <div style="color: rgba(255,255,255,0.7); font-size: 1.1rem;">No has realizado ningún pronóstico</div>
                <div style="color: rgba(255,255,255,0.4); font-size: 0.85rem; margin-top: 8px;">Selecciona un día y comienza a apostar</div>
            </div>
        `;
        modal.style.display = 'block';
        return;
    }
    
    // Preparar array de apuestas
    const apuestasDetalladas = [];
    for (const [partidoId, apuestas] of Object.entries(todasApuestas)) {
        const partido = todosLosPartidos.find(p => p.id === parseInt(partidoId));
        if (partido && apuestas.length > 0) {
            apuestas.forEach(apuesta => {
                const resultado = resultados[partidoId];
                let puntos = 0;
                let estado = 'pendiente';
                let claseEstado = '';
                let mensajeEstado = '';
                
                if (resultado) {
                    if (apuesta.esEmpate === true) {
                        if (resultado.local === resultado.visitante) {
                            puntos = 2;
                            estado = 'ganador';
                            claseEstado = 'ganador';
                            mensajeEstado = '¡EMPATE CORRECTO!';
                        } else {
                            puntos = 0;
                            estado = 'error';
                            claseEstado = 'error';
                            mensajeEstado = 'EMPATE INCORRECTO';
                        }
                    } else if (apuesta.local === resultado.local && apuesta.visitante === resultado.visitante) {
                        puntos = reglas.puntosExacto;
                        estado = 'exacto';
                        claseEstado = 'exacto';
                        mensajeEstado = '¡RESULTADO EXACTO!';
                    } else if (
                        (apuesta.local > apuesta.visitante && resultado.local > resultado.visitante) ||
                        (apuesta.local < apuesta.visitante && resultado.local < resultado.visitante) ||
                        (apuesta.local === apuesta.visitante && resultado.local === resultado.visitante)
                    ) {
                        puntos = reglas.puntosGanador;
                        estado = 'ganador';
                        claseEstado = 'ganador';
                        mensajeEstado = 'GANADOR CORRECTO';
                    } else {
                        puntos = 0;
                        estado = 'error';
                        claseEstado = 'error';
                        mensajeEstado = 'INCORRECTO';
                    }
                }
                
                apuestasDetalladas.push({
                    partido,
                    apuesta,
                    resultado,
                    puntos,
                    estado,
                    claseEstado,
                    mensajeEstado,
                    fechaApuesta: apuesta.fecha || new Date().toISOString()
                });
            });
        }
    }
    
    apuestasDetalladas.sort((a, b) => a.partido.fecha.localeCompare(b.partido.fecha));
    
    const totalPronosticos = apuestasDetalladas.length;
    const aciertosExactos = apuestasDetalladas.filter(a => a.estado === 'exacto').length;
    const aciertosGanador = apuestasDetalladas.filter(a => a.estado === 'ganador').length;
    const errores = apuestasDetalladas.filter(a => a.estado === 'error').length;
    const pendientes = apuestasDetalladas.filter(a => a.estado === 'pendiente').length;
    const totalPuntos = apuestasDetalladas.reduce((sum, a) => sum + a.puntos, 0);
    
    const esGrupoGeneral = currentGrupoId === 'general';
    const grupoNombre = esGrupoGeneral ? '🏆 GRUPO GENERAL - POZO MAYOR' : `🏆 ${currentGrupoNombre}`;
    
    let html = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
            <h2 style="margin: 0; font-size: 1.3rem;">📋 ${grupoNombre}</h2>
            <div style="background: rgba(255,215,0,0.15); padding: 5px 12px; border-radius: 20px;">
                <span style="color: #ffd700;">👤 ${currentParticipante}</span>
            </div>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 12px; margin-bottom: 25px;">
            <div style="background: rgba(0,0,0,0.3); border-radius: 12px; padding: 12px; text-align: center;">
                <div style="font-size: 1.8rem; font-weight: bold; color: #ffd700;">${totalPronosticos}</div>
                <div style="font-size: 0.7rem; color: rgba(255,255,255,0.6);">TOTAL PRONÓSTICOS</div>
            </div>
            <div style="background: rgba(76,175,80,0.15); border-radius: 12px; padding: 12px; text-align: center;">
                <div style="font-size: 1.8rem; font-weight: bold; color: #4caf50;">${aciertosExactos}</div>
                <div style="font-size: 0.7rem; color: rgba(255,255,255,0.6);">RESULTADOS EXACTOS</div>
            </div>
            <div style="background: rgba(255,193,7,0.15); border-radius: 12px; padding: 12px; text-align: center;">
                <div style="font-size: 1.8rem; font-weight: bold; color: #ffc107;">${aciertosGanador}</div>
                <div style="font-size: 0.7rem; color: rgba(255,255,255,0.6);">GANADORES CORRECTOS</div>
            </div>
            <div style="background: rgba(244,67,54,0.15); border-radius: 12px; padding: 12px; text-align: center;">
                <div style="font-size: 1.8rem; font-weight: bold; color: #f44336;">${errores}</div>
                <div style="font-size: 0.7rem; color: rgba(255,255,255,0.6);">INCORRECTOS</div>
            </div>
            <div style="background: rgba(33,150,243,0.15); border-radius: 12px; padding: 12px; text-align: center;">
                <div style="font-size: 1.8rem; font-weight: bold; color: #2196f3;">${pendientes}</div>
                <div style="font-size: 0.7rem; color: rgba(255,255,255,0.6);">PENDIENTES</div>
            </div>
        </div>
        
        <div style="background: linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,100,0,0.1)); border-radius: 16px; padding: 15px; text-align: center; margin-bottom: 25px; border: 1px solid rgba(255,215,0,0.3);">
            <div style="font-size: 0.8rem; color: rgba(255,255,255,0.7);">🏆 PUNTOS TOTALES ACUMULADOS 🏆</div>
            <div style="font-size: 2.5rem; font-weight: bold; color: #ffd700;">${totalPuntos}</div>
            <div style="font-size: 0.7rem; color: rgba(255,255,255,0.5); margin-top: 5px;">⭐ Sistema de puntuación: ${reglas.puntosExacto} pts exacto / ${reglas.puntosGanador} pts ganador</div>
        </div>
    `;
    
    let currentFechaDisplay = '';
    for (const ap of apuestasDetalladas) {
        const fechaPartido = ap.partido.fecha;
        const fechaFormateada = formatearFecha(fechaPartido);
        
        if (currentFechaDisplay !== fechaPartido) {
            currentFechaDisplay = fechaPartido;
            const esFechaPasada = isPartidoPasado(fechaPartido);
            const iconoFecha = esFechaPasada ? '🔒' : '📅';
            html += `
                <div style="margin-top: 25px; margin-bottom: 15px;">
                    <div style="display: flex; align-items: center; gap: 10px; border-bottom: 1px solid rgba(255,215,0,0.2); padding-bottom: 8px;">
                        <span style="font-size: 1.2rem;">${iconoFecha}</span>
                        <h3 style="margin: 0; color: #ffd700; font-size: 1rem;">${fechaFormateada}</h3>
                        <span style="font-size: 0.7rem; color: rgba(255,255,255,0.5);">${esFechaPasada ? 'FINALIZADO' : 'PRÓXIMO'}</span>
                    </div>
                </div>
            `;
        }
        
        let bgColor = 'rgba(0,0,0,0.3)';
        let borderColor = 'rgba(255,215,0,0.15)';
        let resultadoHtml = '';
        
        if (ap.estado === 'exacto') {
            bgColor = 'rgba(76,175,80,0.1)';
            borderColor = '#4caf50';
            resultadoHtml = `<div style="display: inline-block; background: rgba(76,175,80,0.2); color: #4caf50; padding: 4px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: bold;">✅ EXACTO +${ap.puntos} pts</div>`;
        } else if (ap.estado === 'ganador') {
            bgColor = 'rgba(255,193,7,0.1)';
            borderColor = '#ffc107';
            resultadoHtml = `<div style="display: inline-block; background: rgba(255,193,7,0.2); color: #ffc107; padding: 4px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: bold;">🎯 GANADOR +${ap.puntos} pts</div>`;
        } else if (ap.estado === 'error') {
            bgColor = 'rgba(244,67,54,0.1)';
            borderColor = '#f44336';
            resultadoHtml = `<div style="display: inline-block; background: rgba(244,67,54,0.2); color: #f44336; padding: 4px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: bold;">❌ INCORRECTO 0 pts</div>`;
        } else {
            resultadoHtml = `<div style="display: inline-block; background: rgba(33,150,243,0.2); color: #2196f3; padding: 4px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: bold;">⏳ RESULTADO PENDIENTE</div>`;
        }
        
        html += `
            <div style="background: ${bgColor}; border-left: 3px solid ${borderColor}; border-radius: 12px; padding: 15px; margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 12px;">
                    <div style="display: flex; align-items: center; gap: 15px; flex-wrap: wrap;">
                        <span style="font-weight: bold; font-size: 0.85rem; color: rgba(255,255,255,0.7);">⚽ ${ap.partido.local} vs ${ap.partido.visitante}</span>
                        <span style="font-size: 0.7rem; color: rgba(255,255,255,0.4);">🕐 ${ap.partido.hora}</span>
                    </div>
                    ${resultadoHtml}
                </div>
                
                <div style="display: flex; align-items: center; justify-content: center; gap: 20px; margin: 15px 0; flex-wrap: wrap;">
                    <div style="text-align: center;">
                        <div style="font-size: 0.7rem; color: rgba(255,255,255,0.5);">TU PRONÓSTICO</div>
                        ${ap.apuesta.esEmpate === true
                            ? `<div style="font-size: 1.4rem; font-weight: bold; color: #aaaaff; background: rgba(100,100,255,0.2); border: 1px solid rgba(150,150,255,0.4); border-radius: 12px; padding: 8px 20px; margin-top: 5px;">🤝 EMPATE (X)</div>`
                            : `<div style="font-size: 1.8rem; font-weight: bold; color: #ffd700; display: flex; align-items: center; gap: 15px;">
                                <span>${ap.apuesta.local}</span>
                                <span style="font-size: 1.2rem;">-</span>
                                <span>${ap.apuesta.visitante}</span>
                               </div>`
                        }
                    </div>
                    
                    ${ap.resultado ? `
                        <div style="text-align: center;">
                            <div style="font-size: 0.7rem; color: rgba(255,255,255,0.5);">RESULTADO OFICIAL</div>
                            <div style="font-size: 1.8rem; font-weight: bold; color: #ffd700; display: flex; align-items: center; gap: 15px;">
                                <span>${ap.resultado.local}</span>
                                <span style="font-size: 1.2rem;">-</span>
                                <span>${ap.resultado.visitante}</span>
                            </div>
                        </div>
                    ` : `
                        <div style="text-align: center;">
                            <div style="font-size: 0.7rem; color: rgba(255,255,255,0.5);">ESTADO</div>
                            <div style="font-size: 1rem; font-weight: bold; color: #ffc107;">⏳ Esperando resultado</div>
                        </div>
                    `}
                </div>
                
                ${ap.fechaApuesta ? `
                    <div style="font-size: 0.65rem; color: rgba(255,255,255,0.3); text-align: center; margin-top: 8px;">
                        📝 Pronóstico realizado: ${new Date(ap.fechaApuesta).toLocaleString()}
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    const premios = await getPremiosDelGrupo(currentGrupoId);
    const cantidadGanadores = premios?.cantidadGanadores || 3;
    
    html += `
        <div style="background: rgba(0,0,0,0.3); border-radius: 16px; padding: 15px; margin-top: 20px; text-align: center;">
            <div style="color: #ffd700; font-size: 0.85rem; margin-bottom: 8px;">💰 INFORMACIÓN DE PREMIOS DEL GRUPO</div>
            <div style="display: flex; justify-content: center; gap: 20px; flex-wrap: wrap; font-size: 0.75rem; color: rgba(255,255,255,0.6);">
                <span>🏆 ${cantidadGanadores} Ganador(es)</span>
                <span>🥇 1er: ${premios?.primero || 50}%</span>
                ${cantidadGanadores >= 2 ? `<span>🥈 2do: ${premios?.segundo || 30}%</span>` : ''}
                ${cantidadGanadores >= 3 ? `<span>🥉 3ro: ${premios?.tercero || 20}%</span>` : ''}
            </div>
            <div style="font-size: 0.65rem; color: rgba(255,255,255,0.3); margin-top: 8px;">
                📌 Los premios se reparten al finalizar cada jornada para ganadores
            </div>
        </div>
    `;
    
    modalBody.innerHTML = html;
    modal.style.display = 'block';
}

// ============ UTILIDADES ============
function mostrarMensaje(msg, tipo) {
    mostrarNotificacion(msg, tipo);
}

function configurarEventListeners() {
    if (registrarBtn) registrarBtn.addEventListener('click', registrarNuevoParticipante);
    if (cambiarGrupoBtn) cambiarGrupoBtn.addEventListener('click', cambiarDeGrupo);
    if (verApuestasBtn) verApuestasBtn.addEventListener('click', mostrarMisApuestas);
    
    // Modal de verificación
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
    
    // Modal General
    const btnSi = document.getElementById('general-btn-si');
    const btnNo = document.getElementById('general-btn-no');
    const btnIngresar = document.getElementById('general-btn-ingresar');
    const btnRegistrar = document.getElementById('general-btn-registrar');
    const btnVolver = document.getElementById('general-btn-volver');
    const btnVolver2 = document.getElementById('general-btn-volver2');
    const btnCancelarGeneral = document.getElementById('general-cancelar');
    const modalGeneral = document.getElementById('modal-general');
    const generalNombreIngresar = document.getElementById('general-nombre-ingresar');
    const generalNombreRegistro = document.getElementById('general-nombre-registro');
    
    if (btnSi) btnSi.addEventListener('click', mostrarPasoIngresar);
    if (btnNo) btnNo.addEventListener('click', mostrarPasoRegistro);
    if (btnIngresar) btnIngresar.addEventListener('click', ingresarAlGrupoGeneral);
    if (btnRegistrar) btnRegistrar.addEventListener('click', registrarEnGrupoGeneral);
    if (btnVolver) btnVolver.addEventListener('click', volverAlVerificar);
    if (btnVolver2) btnVolver2.addEventListener('click', volverAlVerificar);
    if (btnCancelarGeneral) btnCancelarGeneral.addEventListener('click', cerrarModalGeneral);
    
    if (modalGeneral) {
        modalGeneral.addEventListener('click', (e) => {
            if (e.target === modalGeneral) cerrarModalGeneral();
        });
    }
    
    if (generalNombreIngresar) {
        generalNombreIngresar.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') ingresarAlGrupoGeneral();
        });
    }
    
    if (generalNombreRegistro) {
        generalNombreRegistro.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') registrarEnGrupoGeneral();
        });
    }
    
    // Modal de apuestas
    const modal = document.getElementById('modal-apuestas');
    const closeBtn = document.querySelector('.modal-close');
    if (closeBtn) closeBtn.addEventListener('click', () => modal.style.display = 'none');
    if (modal) window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
}
// ============ MOSTRAR QR DESPUÉS DE APOSTAR ============

let qrMostrado = false;

function mostrarQR() {
    const qrDiv = document.getElementById('qr-pago');

    if (qrDiv && !qrMostrado) {
        qrDiv.style.display = 'block';
        qrMostrado = true;

        // ACTIVAR BOTÓN DE WHATSAPP
        setupWhatsAppButton();

        setTimeout(() => {
            qrDiv.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }, 500);
    }
}

// Configurar el botón de WhatsApp
function configurarBotonWhatsApp() {
    const btnWhatsApp = document.getElementById('btn-enviar-comprobante');
    if (btnWhatsApp) {
        btnWhatsApp.addEventListener('click', () => {
            const nombre = currentParticipante || 'Participante';
            const grupo = currentGrupoNombre || 'Grupo';
            const mensaje = `Hola%2C%20deseo%20inscribirme%20en%20la%20quiniela%20del%20Mundial%202026.%0A%0A📌%20Mi%20nombre%20es%3A%20${encodeURIComponent(nombre)}%0A📌%20Grupo%3A%20${encodeURIComponent(grupo)}%0A📌%20Total%20a%20pagar%3A%20Bs.%205%0A%0AAdjunto%20mi%20comprobante%20de%20pago.`;
            window.open(`https://wa.me/59174277508?text=${mensaje}`, '_blank');
        });
    }
}

// Función para enviar comprobante por WhatsApp (versión reducida)
function setupWhatsAppButton() {
    const btnWhatsApp = document.getElementById('btn-enviar-comprobante');
    if (!btnWhatsApp) return;
    
    // Eliminar event listeners anteriores para evitar duplicados
    const newBtn = btnWhatsApp.cloneNode(true);
    btnWhatsApp.parentNode.replaceChild(newBtn, btnWhatsApp);
    
    newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Obtener información del participante
        const participanteNombre = document.getElementById('participante-nombre-display')?.innerText || 'No especificado';
        
        // Contar cuántas apuestas tiene el participante
        const apuestasItems = document.querySelectorAll('.apuesta-item');
        const cantidadApuestas = apuestasItems.length;
        
        // Calcular monto total (Bs. 5 por partido/apuesta)
        const montoTotal = cantidadApuestas * 5;
        
        // Crear mensaje simple para WhatsApp
        const mensaje = `*PAGO QUINIELA MUNDIAL 2026*\n\n` +
                       `👤 *Nombre:* ${participanteNombre}\n` +
                       `📎 Adjunto comprobante de pago`;
        
        // Codificar mensaje y abrir WhatsApp
        const urlWhatsApp = `https://wa.me/59174277508?text=${encodeURIComponent(mensaje)}`;
        window.open(urlWhatsApp, '_blank');
    });
}

setupWhatsAppButton();

init();