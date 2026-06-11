// src/main.js - Con múltiples apuestas y límite por participante
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
    getParticipantesDelGrupo, 
    agregarApuestaEnGrupo,
    getApuestasMultiplesDeParticipante,
    getResultadosDelGrupo,
    participantePerteneceAlGrupo,
    validarContrasenaGrupo,
    eliminarApuesta,
    getApuestasDePartido,
    getLimiteApuestasParticipante
} from './groups.js';

let currentGrupoId = '';
let currentFecha = '';
let currentParticipante = '';
let grupoAutenticado = false;

function cargarYMostrarReglas() {
    const reglasGuardadas = localStorage.getItem('quiniela_reglas');
    const reglasDiv = document.getElementById('reglas-display');
    if (reglasDiv) {
        if (reglasGuardadas) {
            reglasDiv.innerHTML = reglasGuardadas;
        } else {
            reglasDiv.innerHTML = `<p><strong>📌 SISTEMA DE PUNTUACIÓN:</strong></p>
<p>• <strong>3 puntos</strong> - Resultado exacto</p>
<p>• <strong>1 punto</strong> - Ganador correcto</p>
<p><strong>📊 APUESTAS MÚLTIPLES:</strong></p>
<p>• Cada participante tiene un límite de pronósticos por partido</p>
<p>• El administrador puede aumentar tu límite</p>
<p>• Se suman los puntos de TODOS tus pronósticos acertados</p>

<p><strong>⏰ FECHAS Y APUESTAS:</strong></p>
<p>• Solo se puede apostar el DÍA del partido</p>
<p>• Las apuestas se cierran a la HORA de inicio</p>

<p><strong>⚽ ¡BUENA SUERTE! ⚽</strong></p>`;
        }
    }
}

function mostrarPopupReglas() {
    const modal = document.getElementById('modal-reglas');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function init() {
    cargarYMostrarReglas();
    cargarGrupos();
    cargarCalendario();
    setupEventListeners();
    mostrarPopupReglas();
}

function cargarGrupos() {
    const grupos = getGrupos();
    const select = document.getElementById('grupo-select');
    if (!select) return;
    
    const gruposKeys = Object.keys(grupos);
    
    if (gruposKeys.length === 0) {
        select.innerHTML = '<option value="">⚠️ No hay grupos - Contactá al admin</option>';
        select.disabled = true;
        return;
    }
    
    select.disabled = false;
    let options = '<option value="">🏆 Seleccioná un grupo...</option>';
    for (const [id, grupo] of Object.entries(grupos)) {
        options += `<option value="${id}">${grupo.nombre}</option>`;
    }
    select.innerHTML = options;
    
    select.addEventListener('change', (e) => {
        const nuevoGrupo = e.target.value;
        if (nuevoGrupo !== currentGrupoId) {
            grupoAutenticado = false;
            currentGrupoId = nuevoGrupo;
            currentParticipante = '';
            
            if (currentGrupoId) {
                document.getElementById('contrasena-panel').style.display = 'block';
                document.getElementById('grupo-contrasena').value = '';
                document.getElementById('contrasena-error').innerHTML = '';
                document.getElementById('dia-select').disabled = true;
                document.getElementById('participante-nombre').disabled = true;
                document.getElementById('participante-nombre').value = '';
                document.getElementById('ver-mis-apuestas').disabled = true;
                
                const container = document.getElementById('apuestas-container');
                if (container) container.innerHTML = '<div class="empty-state">🔐 Validá la contraseña del grupo para continuar</div>';
            } else {
                document.getElementById('contrasena-panel').style.display = 'none';
                document.getElementById('dia-select').disabled = true;
                document.getElementById('participante-nombre').disabled = true;
                document.getElementById('ver-mis-apuestas').disabled = true;
            }
        }
    });
}

function validarContrasena() {
    if (!currentGrupoId) {
        mostrarMensaje('Seleccioná un grupo primero', 'error');
        return;
    }
    
    const contrasena = document.getElementById('grupo-contrasena').value;
    if (!contrasena) {
        document.getElementById('contrasena-error').innerHTML = '❌ Ingresá la contraseña del grupo';
        return;
    }
    
    const esValida = validarContrasenaGrupo(currentGrupoId, contrasena);
    
    if (esValida) {
        grupoAutenticado = true;
        document.getElementById('contrasena-panel').style.display = 'none';
        document.getElementById('contrasena-error').innerHTML = '';
        document.getElementById('dia-select').disabled = false;
        document.getElementById('participante-nombre').disabled = false;
        document.getElementById('ver-mis-apuestas').disabled = false;
        
        cargarParticipantesDelGrupo();
        
        if (currentFecha) {
            cargarPartidosDelDia(currentFecha);
            actualizarEstadoDia(currentFecha);
        }
        
        mostrarMensaje(`✅ Acceso concedido al grupo`, 'success');
        sessionStorage.setItem(`grupo_auth_${currentGrupoId}`, 'true');
        sessionStorage.setItem(`grupo_auth_time_${currentGrupoId}`, Date.now());
    } else {
        document.getElementById('contrasena-error').innerHTML = '❌ Contraseña incorrecta. Acceso denegado.';
        grupoAutenticado = false;
    }
}

function cargarParticipantesDelGrupo() {
    if (!currentGrupoId || !grupoAutenticado) return;
    
    const participantes = getParticipantesDelGrupo(currentGrupoId);
    const datalist = document.getElementById('participantes-list');
    const input = document.getElementById('participante-nombre');
    
    if (datalist) {
        datalist.innerHTML = participantes.map(p => `<option value="${p}">`).join('');
    }
    
    if (input) {
        if (participantes.length === 0) {
            input.placeholder = "⚠️ No hay participantes - El admin debe agregarlos";
            input.disabled = true;
        } else {
            input.placeholder = `Tu nombre (${participantes.length} participantes en el grupo)`;
            input.disabled = false;
        }
    }
}

function setupEventListeners() {
    const validarBtn = document.getElementById('validar-contrasena-btn');
    if (validarBtn) {
        validarBtn.addEventListener('click', validarContrasena);
    }
    
    const contrasenaInput = document.getElementById('grupo-contrasena');
    if (contrasenaInput) {
        contrasenaInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') validarContrasena();
        });
    }
    
    const diaSelect = document.getElementById('dia-select');
    if (diaSelect) {
        diaSelect.addEventListener('change', (e) => {
            currentFecha = e.target.value;
            if (currentFecha && grupoAutenticado) {
                cargarPartidosDelDia(currentFecha);
                actualizarEstadoDia(currentFecha);
            }
        });
    }
    
    const nombreInput = document.getElementById('participante-nombre');
    if (nombreInput) {
        nombreInput.addEventListener('change', (e) => {
            currentParticipante = e.target.value.trim();
            if (currentParticipante && currentFecha && grupoAutenticado) {
                validarYRecargar();
            }
        });
    }
    
    const verBtn = document.getElementById('ver-mis-apuestas');
    if (verBtn) verBtn.addEventListener('click', mostrarModalApuestas);
    
    const modalApuestas = document.getElementById('modal-apuestas');
    const closeBtn = document.querySelector('.modal-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            if (modalApuestas) modalApuestas.style.display = 'none';
        });
    }
    window.addEventListener('click', (e) => {
        if (e.target === modalApuestas) modalApuestas.style.display = 'none';
    });
    
    const cerrarReglas = document.getElementById('cerrar-reglas');
    const modalReglas = document.getElementById('modal-reglas');
    if (cerrarReglas) {
        cerrarReglas.addEventListener('click', () => {
            if (modalReglas) modalReglas.style.display = 'none';
        });
    }
    window.addEventListener('click', (e) => {
        if (e.target === modalReglas) modalReglas.style.display = 'none';
    });
}

function validarYRecargar() {
    if (!grupoAutenticado) {
        mostrarMensaje('Primero validá la contraseña del grupo', 'error');
        return;
    }
    
    if (!currentGrupoId) {
        mostrarMensaje('Primero seleccioná un grupo', 'error');
        return;
    }
    
    const existe = participantePerteneceAlGrupo(currentGrupoId, currentParticipante);
    const errorDiv = document.getElementById('error-nombre');
    
    if (!existe) {
        if (errorDiv) {
            errorDiv.innerHTML = `❌ "${currentParticipante}" no está registrado en este grupo`;
        }
        mostrarMensaje(`❌ "${currentParticipante}" no está registrado en este grupo`, 'error');
        return;
    } else {
        if (errorDiv) {
            errorDiv.innerHTML = '';
        }
    }
    
    if (currentFecha) {
        recargarConParticipante();
    }
}

function recargarConParticipante() {
    if (currentFecha && currentParticipante && grupoAutenticado) {
        const esPasado = isPartidoPasado(currentFecha);
        const esHoy = !esPasado && (currentFecha === getDiaActualLocal());
        const hayDisponibles = hayPartidosDisponiblesParaApostar(currentFecha);
        
        if (esPasado || (esHoy && !hayDisponibles)) {
            cargarApuestasSoloLectura(currentParticipante, currentFecha);
        } else {
            cargarApuestasMultiples(currentParticipante, currentFecha);
        }
    }
}

function cargarCalendario() {
    const dias = getDiasCalendario();
    const select = document.getElementById('dia-select');
    if (!select) return;
    
    if (dias.length === 0) {
        select.innerHTML = '<option>No hay partidos cargados</option>';
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
    select.innerHTML = options;
    
    const hoy = getDiaActualLocal();
    if (dias.includes(hoy)) {
        select.value = hoy;
        currentFecha = hoy;
        if (grupoAutenticado) {
            cargarPartidosDelDia(hoy);
            actualizarEstadoDia(hoy);
        }
    } else {
        const hoyDate = new Date();
        const hoyLocal = new Date(hoyDate.getFullYear(), hoyDate.getMonth(), hoyDate.getDate());
        
        let diaSeleccionado = null;
        for (const dia of dias) {
            const [y, m, d] = dia.split('-');
            const fechaDia = new Date(y, m - 1, d);
            if (fechaDia >= hoyLocal) {
                diaSeleccionado = dia;
                break;
            }
        }
        
        if (diaSeleccionado) {
            select.value = diaSeleccionado;
            currentFecha = diaSeleccionado;
            if (grupoAutenticado) {
                cargarPartidosDelDia(diaSeleccionado);
                actualizarEstadoDia(diaSeleccionado);
            }
        } else if (dias[0]) {
            select.value = dias[0];
            currentFecha = dias[0];
            if (grupoAutenticado) {
                cargarPartidosDelDia(dias[0]);
                actualizarEstadoDia(dias[0]);
            }
        }
    }
}

function actualizarEstadoDia(fecha) {
    const estadoDiv = document.getElementById('estado-dia');
    if (!estadoDiv) return;
    
    if (!grupoAutenticado) {
        estadoDiv.innerHTML = '<span class="badge-info">🔐 Validá la contraseña del grupo para comenzar</span>';
        return;
    }
    
    const esPasado = isPartidoPasado(fecha);
    const esHoy = !esPasado && (fecha === getDiaActualLocal());
    const hayPartidosDisponibles = hayPartidosDisponiblesParaApostar(fecha);
    
    if (esPasado) {
        estadoDiv.innerHTML = '<span class="badge-pasado">🔒 DÍA FINALIZADO - Solo consulta tus apuestas</span>';
    } else if (esHoy && hayPartidosDisponibles) {
        estadoDiv.innerHTML = '<span class="badge-activo">✅ DÍA ACTIVO - Podés agregar pronósticos</span>';
    } else if (esHoy && !hayPartidosDisponibles) {
        estadoDiv.innerHTML = '<span class="badge-finalizado">⏰ Todos los partidos de hoy ya comenzaron</span>';
    } else {
        estadoDiv.innerHTML = '<span class="badge-futuro">⏳ DÍA FUTURO - Apuestas disponibles el día del partido</span>';
    }
}

function cargarPartidosDelDia(fecha) {
    const partidos = getPartidosPorDia(fecha);
    const container = document.getElementById('apuestas-container');
    if (!container) return;
    
    if (!grupoAutenticado) {
        container.innerHTML = '<div class="empty-state">🔐 Validá la contraseña del grupo para ver los partidos</div>';
        return;
    }
    
    const esPasado = isPartidoPasado(fecha);
    const esHoy = !esPasado && (fecha === getDiaActualLocal());
    
    container.innerHTML = partidos.map(partido => {
        const puedeApostar = esHoy && puedeApostarPartido(partido.fecha, partido.hora) && grupoAutenticado;
        
        // Obtener límite del participante (si ya está logueado)
        let limiteParticipante = 1;
        let apuestasActuales = 0;
        if (currentParticipante && currentGrupoId) {
            limiteParticipante = getLimiteApuestasParticipante(currentGrupoId, currentParticipante);
            apuestasActuales = getApuestasDePartido(currentGrupoId, currentParticipante, partido.id).length;
        }
        
        let mensajeBloqueo = '';
        if (!puedeApostar) {
            if (!grupoAutenticado) {
                mensajeBloqueo = ' | 🔐 Validá la contraseña';
            } else if (esPasado) {
                mensajeBloqueo = ' | 🔒 Partido finalizado';
            } else if (!esHoy) {
                mensajeBloqueo = ' | ⏳ Apuestas solo el día del partido';
            } else {
                mensajeBloqueo = ' | ⏰ Apuestas cerradas';
            }
        }
        
        return `
            <div class="apuesta-card ${!puedeApostar ? 'bloqueado' : ''}" data-id="${partido.id}" data-fecha="${partido.fecha}" data-hora="${partido.hora}">
                <div class="match-info">
                    <div class="match-teams">${conBandera(partido.local)} vs ${conBandera(partido.visitante)}</div>
                    <div class="match-date">
                        🕐 ${partido.hora} | ${getFaseNombre(partido.fase)}
                        ${partido.grupo ? ` | Grupo ${partido.grupo}` : ''}
                        ${!puedeApostar ? mensajeBloqueo : ''}
                    </div>
                </div>
                
                <!-- Lista de pronósticos existentes -->
                <div id="apuestas-lista-${partido.id}" class="apuestas-lista"></div>
                
                <!-- Formulario para nuevo pronóstico -->
                ${puedeApostar ? `
                    <div class="nueva-apuesta-form">
                        <div class="score-inputs">
                            <input type="number" class="score-local" placeholder="Local" min="0" max="20">
                            <span class="vs">-</span>
                            <input type="number" class="score-visitante" placeholder="Visitante" min="0" max="20">
                            <button class="btn-agregar-apuesta" data-id="${partido.id}">➕ Agregar Pronóstico</button>
                        </div>
                        <div class="limite-apuestas">📊 Tu límite: ${apuestasActuales}/${limiteParticipante} pronósticos usados</div>
                    </div>
                ` : `
                    <div class="score-readonly" id="readonly-${partido.id}">
                        <span>Cargando tus pronósticos...</span>
                    </div>
                `}
            </div>
        `;
    }).join('');
    
    if (currentParticipante && grupoAutenticado) {
        if (esPasado || (esHoy && !hayPartidosDisponiblesParaApostar(fecha))) {
            cargarApuestasSoloLectura(currentParticipante, fecha);
        } else {
            cargarApuestasMultiples(currentParticipante, fecha);
        }
    }
    
    setupAgregarApuestas();
}

function setupAgregarApuestas() {
    document.querySelectorAll('.btn-agregar-apuesta').forEach(btn => {
        btn.removeEventListener('click', handleAgregarApuesta);
        btn.addEventListener('click', handleAgregarApuesta);
    });
}

async function handleAgregarApuesta(e) {
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
    
    if (!currentParticipante) {
        mostrarMensaje('Ingresá tu nombre primero', 'error');
        return;
    }
    
    const partido = todosLosPartidos.find(p => p.id === partidoId);
    if (partido && !puedeApostarPartido(partido.fecha, partido.hora)) {
        mostrarMensaje('⏰ Ya no se puede apostar a este partido', 'error');
        return;
    }
    
    // VERIFICAR LÍMITE DE APUESTAS DEL PARTICIPANTE
    const limiteActual = getLimiteApuestasParticipante(currentGrupoId, currentParticipante);
    const apuestasActuales = getApuestasDePartido(currentGrupoId, currentParticipante, partidoId);
    
    if (apuestasActuales.length >= limiteActual) {
        mostrarMensaje(`❌ Has alcanzado tu límite de ${limiteActual} pronóstico(s) para este partido`, 'error');
        return;
    }
    
    const apuestaId = agregarApuestaEnGrupo(currentGrupoId, currentParticipante, partidoId, { local, visitante });
    
    if (apuestaId) {
        mostrarMensaje(`✅ Pronóstico ${local}-${visitante} agregado (${apuestasActuales.length + 1}/${limiteActual})`, 'success');
        localInput.value = '';
        visitanteInput.value = '';
        cargarApuestasMultiples(currentParticipante, currentFecha);
    } else {
        mostrarMensaje('❌ Error al agregar pronóstico', 'error');
    }
}

function cargarApuestasMultiples(nombre, fecha) {
    if (!grupoAutenticado || !currentGrupoId) return;
    
    const todasApuestas = getApuestasMultiplesDeParticipante(currentGrupoId, nombre);
    const partidos = getPartidosPorDia(fecha);
    const resultados = getResultadosDelGrupo(currentGrupoId);
    const limiteParticipante = getLimiteApuestasParticipante(currentGrupoId, nombre);
    
    partidos.forEach(partido => {
        const apuestasPartido = todasApuestas[partido.id] || [];
        const container = document.getElementById(`apuestas-lista-${partido.id}`);
        const esPasado = isPartidoPasado(fecha);
        const esHoy = !esPasado && (fecha === getDiaActualLocal());
        const puedeApostar = esHoy && puedeApostarPartido(partido.fecha, partido.hora);
        
        if (container) {
            if (apuestasPartido.length === 0) {
                container.innerHTML = '<div class="no-apuestas">📭 Sin pronósticos aún</div>';
            } else {
                let html = '<div class="apuestas-multiples">';
                apuestasPartido.forEach((apuesta, idx) => {
                    const resultado = resultados[partido.id];
                    let claseAcierto = '';
                    let iconoAcierto = '';
                    
                    if (resultado) {
                        if (apuesta.local === resultado.local && apuesta.visitante === resultado.visitante) {
                            claseAcierto = 'acierto-exacto';
                            iconoAcierto = '🎯✅ ';
                        } else if (
                            (apuesta.local > apuesta.visitante && resultado.local > resultado.visitante) ||
                            (apuesta.local < apuesta.visitante && resultado.local < resultado.visitante) ||
                            (apuesta.local === apuesta.visitante && resultado.local === resultado.visitante)
                        ) {
                            claseAcierto = 'acierto-ganador';
                            iconoAcierto = '🎯 ';
                        } else {
                            claseAcierto = 'acierto-error';
                            iconoAcierto = '❌ ';
                        }
                    }
                    
                    html += `
                        <div class="apuesta-item ${claseAcierto}" data-apuesta-id="${apuesta.id}">
                            <span class="apuesta-marcador">${iconoAcierto}Pronóstico ${idx + 1}: ${apuesta.local} - ${apuesta.visitante}</span>
                            ${puedeApostar ? `<button class="btn-eliminar-apuesta" data-partido="${partido.id}" data-apuesta="${apuesta.id}">🗑️</button>` : ''}
                        </div>
                    `;
                });
                html += '</div>';
                container.innerHTML = html;
            }
        }
        
        // Actualizar el límite mostrado
        const limiteSpan = document.querySelector(`.apuesta-card[data-id="${partido.id}"] .limite-apuestas`);
        if (limiteSpan && puedeApostar) {
            limiteSpan.innerHTML = `📊 Tu límite: ${apuestasPartido.length}/${limiteParticipante} pronósticos usados`;
        }
        
        if (!puedeApostar && resultados[partido.id]) {
            const resultado = resultados[partido.id];
            const readonlyDiv = document.getElementById(`readonly-${partido.id}`);
            if (readonlyDiv) {
                readonlyDiv.innerHTML = `
                    <div class="resultado-oficial">🏆 Resultado oficial: ${resultado.local} - ${resultado.visitante}</div>
                `;
            }
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
    
    if (confirm('¿Eliminar este pronóstico?')) {
        const resultado = eliminarApuesta(currentGrupoId, currentParticipante, partidoId, apuestaId);
        if (resultado) {
            mostrarMensaje('Pronóstico eliminado', 'success');
            cargarApuestasMultiples(currentParticipante, currentFecha);
        } else {
            mostrarMensaje('Error al eliminar pronóstico', 'error');
        }
    }
}

function cargarApuestasSoloLectura(nombre, fecha) {
    if (!grupoAutenticado || !currentGrupoId) return;
    
    const todasApuestas = getApuestasMultiplesDeParticipante(currentGrupoId, nombre);
    const resultados = getResultadosDelGrupo(currentGrupoId);
    const partidos = getPartidosPorDia(fecha);
    
    partidos.forEach(partido => {
        const apuestasPartido = todasApuestas[partido.id] || [];
        const readonlyDiv = document.getElementById(`readonly-${partido.id}`);
        
        if (readonlyDiv) {
            if (apuestasPartido.length === 0) {
                readonlyDiv.innerHTML = '<div class="apuesta-info">📝 No realizaste ningún pronóstico para este partido</div>';
            } else {
                let apuestasText = '<div class="apuesta-info">📝 Tus pronósticos:</div><div class="apuestas-multiples">';
                apuestasPartido.forEach((apuesta, idx) => {
                    const resultado = resultados[partido.id];
                    let claseAcierto = '';
                    let iconoAcierto = '';
                    let puntosHtml = '';
                    
                    if (resultado) {
                        if (apuesta.local === resultado.local && apuesta.visitante === resultado.visitante) {
                            claseAcierto = 'acierto-exacto';
                            iconoAcierto = '🎯✅ ';
                            puntosHtml = '<span class="puntos"> +3 pts</span>';
                        } else if (
                            (apuesta.local > apuesta.visitante && resultado.local > resultado.visitante) ||
                            (apuesta.local < apuesta.visitante && resultado.local < resultado.visitante) ||
                            (apuesta.local === apuesta.visitante && resultado.local === resultado.visitante)
                        ) {
                            claseAcierto = 'acierto-ganador';
                            iconoAcierto = '🎯 ';
                            puntosHtml = '<span class="puntos"> +1 pt</span>';
                        } else {
                            claseAcierto = 'acierto-error';
                            iconoAcierto = '❌ ';
                            puntosHtml = '<span class="puntos"> 0 pts</span>';
                        }
                    }
                    
                    apuestasText += `
                        <div class="apuesta-item ${claseAcierto}">
                            <span class="apuesta-marcador">${iconoAcierto}Pronóstico ${idx + 1}: ${apuesta.local} - ${apuesta.visitante}${puntosHtml}</span>
                        </div>
                    `;
                });
                apuestasText += '</div>';
                
                if (resultados[partido.id]) {
                    apuestasText += `<div class="resultado-oficial">🏆 Resultado oficial: ${resultados[partido.id].local} - ${resultados[partido.id].visitante}</div>`;
                }
                
                readonlyDiv.innerHTML = apuestasText;
            }
        }
    });
}

function mostrarModalApuestas() {
    if (!grupoAutenticado) {
        mostrarMensaje('Primero validá la contraseña del grupo', 'error');
        return;
    }
    
    const nombre = document.getElementById('participante-nombre').value.trim();
    if (!nombre) {
        mostrarMensaje('Ingresá tu nombre primero', 'error');
        return;
    }
    
    const existe = participantePerteneceAlGrupo(currentGrupoId, nombre);
    if (!existe) {
        mostrarMensaje('❌ Nombre no registrado en este grupo', 'error');
        return;
    }
    
    const todasApuestas = getApuestasMultiplesDeParticipante(currentGrupoId, nombre);
    const resultados = getResultadosDelGrupo(currentGrupoId);
    const modalBody = document.getElementById('modal-body');
    const modal = document.getElementById('modal-apuestas');
    const grupos = getGrupos();
    const grupo = grupos[currentGrupoId];
    
    if (!modalBody || !modal) return;
    
    if (Object.keys(todasApuestas).length === 0) {
        modalBody.innerHTML = `<p style="text-align:center;">📭 No has realizado ningún pronóstico en "${grupo?.nombre}" aún</p>`;
        modal.style.display = 'block';
        return;
    }
    
    const apuestasConFecha = [];
    for (const [partidoId, apuestas] of Object.entries(todasApuestas)) {
        const partido = todosLosPartidos.find(p => p.id === parseInt(partidoId));
        if (partido && Array.isArray(apuestas)) {
            apuestas.forEach(apuesta => {
                apuestasConFecha.push({
                    ...apuesta,
                    partido,
                    resultado: resultados[partidoId],
                    partidoId: parseInt(partidoId)
                });
            });
        }
    }
    
    apuestasConFecha.sort((a, b) => a.partido.fecha.localeCompare(b.partido.fecha));
    
    let html = `<h2>📋 Grupo: ${grupo?.nombre}</h2>`;
    let currentFecha = '';
    let totalPuntos = 0;
    const reglas = grupo?.reglas || { puntosExacto: 3, puntosGanador: 1 };
    
    apuestasConFecha.forEach(ap => {
        if (currentFecha !== ap.partido.fecha) {
            currentFecha = ap.partido.fecha;
            html += `<h3 style="margin-top:20px;">📅 ${formatearFecha(currentFecha)}</h3>`;
        }
        
        let puntos = '';
        let puntosValor = 0;
        if (ap.resultado) {
            if (ap.local === ap.resultado.local && ap.visitante === ap.resultado.visitante) {
                puntos = `✅ +${reglas.puntosExacto} puntos`;
                puntosValor = reglas.puntosExacto;
            } else if (
                (ap.local > ap.visitante && ap.resultado.local > ap.resultado.visitante) ||
                (ap.local < ap.visitante && ap.resultado.local < ap.resultado.visitante) ||
                (ap.local === ap.visitante && ap.resultado.local === ap.resultado.visitante)
            ) {
                puntos = `🎯 +${reglas.puntosGanador} puntos`;
                puntosValor = reglas.puntosGanador;
            } else {
                puntos = '❌ 0 puntos';
                puntosValor = 0;
            }
            totalPuntos += puntosValor;
        } else {
            puntos = '⏳ Resultado pendiente';
        }
        
        html += `
            <div class="apuesta-resumen">
                <strong>${conBandera(ap.partido.local)} vs ${conBandera(ap.partido.visitante)}</strong>
                <div>📝 Pronóstico: ${ap.local} - ${ap.visitante}</div>
                ${ap.resultado ? `<div>🏆 Resultado oficial: ${ap.resultado.local} - ${ap.resultado.visitante}</div>` : ''}
                <div class="puntos">${puntos}</div>
            </div>
        `;
    });
    
    html += `<div class="total-puntos">🏆 TOTAL DE PUNTOS ACUMULADOS: ${totalPuntos}</div>`;
    
    modalBody.innerHTML = html;
    modal.style.display = 'block';
}

function mostrarMensaje(msg, tipo) {
    const mensajeDiv = document.getElementById('mensaje');
    if (mensajeDiv) {
        mensajeDiv.textContent = msg;
        mensajeDiv.className = `mensaje ${tipo}`;
        setTimeout(() => {
            mensajeDiv.textContent = '';
            mensajeDiv.className = 'mensaje';
        }, 3000);
    }
}

init();