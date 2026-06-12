// src/admin.js - Admin con todas las funciones (con Firebase)
import { 
    getGrupos, 
    guardarGrupos, 
    crearGrupo, 
    eliminarGrupo,
    getParticipantesDelGrupo,
    eliminarParticipanteDeGrupo,
    getInfoParticipante,
    guardarResultadoEnGrupo,
    getResultadosDelGrupo,
    actualizarReglasDelGrupo,
    getReglasDelGrupo,
    getPremiosDelGrupo,
    actualizarPremiosDelGrupo,
    actualizarLimiteApuestasParticipante,
    getApuestasExtrasDelGrupo,
    obtenerGrupoGeneral
} from './groups.js';
import { todosLosPartidos, conBandera, getFaseNombre } from './data.js';
import { sincronizarLocalAFirebase, cargarFirebaseALocal } from './firebase.js';

let todosLosPartidosData = todosLosPartidos;
let currentGrupoId = '';

function init() {
    console.log('Admin inicializado - Con sincronización en la nube');
    cargarGruposEnSelectores();
    cargarListaGrupos();
    actualizarEstadisticas();
    setupEventListeners();
    cargarSelectoresApuestasExtra();
    cargarSelectoresSincronizacion();
}

function setupEventListeners() {
    // === GRUPOS ===
    const crearGrupoBtn = document.getElementById('crear-grupo-btn');
    if (crearGrupoBtn) {
        crearGrupoBtn.addEventListener('click', crearNuevoGrupo);
    }
    
    // === PARTICIPANTES POR GRUPO ===
    const grupoParticipantesSelect = document.getElementById('grupo-participantes-select');
    if (grupoParticipantesSelect) {
        grupoParticipantesSelect.addEventListener('change', (e) => {
            currentGrupoId = e.target.value;
            if (currentGrupoId) {
                cargarParticipantesDelGrupoEnPanel(currentGrupoId);
                document.getElementById('participantes-panel').style.display = 'block';
            } else {
                document.getElementById('participantes-panel').style.display = 'none';
            }
        });
    }
    
    // === RESULTADOS POR GRUPO ===
    const grupoResultadosSelect = document.getElementById('grupo-resultados-select');
    if (grupoResultadosSelect) {
        grupoResultadosSelect.addEventListener('change', async (e) => {
            currentGrupoId = e.target.value;
            if (currentGrupoId) {
                document.getElementById('resultados-panel').style.display = 'block';
                await cargarResultados(currentGrupoId, 'all');
            } else {
                document.getElementById('resultados-panel').style.display = 'none';
            }
        });
    }

    const filtroFase = document.getElementById('filtro-fase-resultados');
    if (filtroFase) {
        filtroFase.addEventListener('change', async (e) => {
            if (currentGrupoId) {
                await cargarResultados(currentGrupoId, e.target.value);
            }
        });
    }

    const guardarResultadosBtn = document.getElementById('guardar-resultados-grupo');
    if (guardarResultadosBtn) {
        guardarResultadosBtn.addEventListener('click', () => guardarResultadosDelGrupo(currentGrupoId));
    }
    
    // === REGLAS POR GRUPO ===
    const grupoReglasSelect = document.getElementById('grupo-reglas-select');
    if (grupoReglasSelect) {
        grupoReglasSelect.addEventListener('change', (e) => {
            const grupoId = e.target.value;
            if (grupoId) {
                cargarReglasDelGrupoEnPanel(grupoId);
                document.getElementById('reglas-panel').style.display = 'block';
            } else {
                document.getElementById('reglas-panel').style.display = 'none';
            }
        });
    }
    
    const guardarReglasBtn = document.getElementById('guardar-reglas-grupo-btn');
    if (guardarReglasBtn) {
        guardarReglasBtn.addEventListener('click', guardarReglasDelGrupo);
    }
    
    // === PREMIOS POR GRUPO ===
    const grupoPremiosSelect = document.getElementById('grupo-premios-select');
    if (grupoPremiosSelect) {
        grupoPremiosSelect.addEventListener('change', (e) => {
            const grupoId = e.target.value;
            if (grupoId) {
                cargarPremiosDelGrupoEnPanel(grupoId);
                document.getElementById('premios-panel').style.display = 'block';
            } else {
                document.getElementById('premios-panel').style.display = 'none';
            }
        });
    }
    
    const guardarPremiosBtn = document.getElementById('guardar-premios-btn');
    if (guardarPremiosBtn) {
        guardarPremiosBtn.addEventListener('click', guardarPremiosDelGrupo);
    }
    
    const cantidadGanadoresSelect = document.getElementById('cantidad-ganadores');
    if (cantidadGanadoresSelect) {
        cantidadGanadoresSelect.addEventListener('change', (e) => {
            const cantidad = parseInt(e.target.value);
            const segundoGroup = document.getElementById('segundo-puesto-group');
            const tercerGroup = document.getElementById('tercer-puesto-group');
            if (segundoGroup) segundoGroup.style.display = cantidad >= 2 ? 'block' : 'none';
            if (tercerGroup) tercerGroup.style.display = cantidad >= 3 ? 'block' : 'none';
        });
    }
}

function cargarGruposEnSelectores() {
    getGrupos().then(grupos => {
        const selectores = [
            'grupo-participantes-select',
            'grupo-resultados-select',
            'grupo-reglas-select',
            'grupo-premios-select',
            'grupo-apuestasextras-select'
        ];
        
        selectores.forEach(selectorId => {
            const select = document.getElementById(selectorId);
            if (select) {
                let options = '<option value="">-- Seleccionar grupo --</option>';
                for (const [id, grupo] of Object.entries(grupos)) {
                    options += `<option value="${id}">${grupo.nombre}</option>`;
                }
                select.innerHTML = options;
            }
        });
    });
}

function cargarListaGrupos() {
    getGrupos().then(grupos => {
        const container = document.getElementById('lista-grupos');
        if (!container) return;
        
        if (Object.keys(grupos).length === 0) {
            container.innerHTML = '<p class="empty">No hay grupos creados. Creá el primero 👆</p>';
            return;
        }
        
        let html = '';
        for (const [id, grupo] of Object.entries(grupos)) {
            const premios = grupo.premios || { cantidadGanadores: 3, primero: 50, segundo: 30, tercero: 20 };
            html += `
                <div class="grupo-card">
                    <h3>🏆 ${grupo.nombre}</h3>
                    <p><strong>ID:</strong> ${id}</p>
                    <p><strong>👥 Participantes:</strong> ${grupo.participantes.length}</p>
                    <p><strong>📜 Reglas:</strong> ${grupo.reglas?.puntosExacto || 3} pts exacto / ${grupo.reglas?.puntosGanador || 1} pts ganador</p>
                    <p><strong>🏆 Premios:</strong> ${premios.cantidadGanadores} ganador(es) (${premios.primero}% / ${premios.segundo}% / ${premios.tercero}%)</p>
                    <div class="grupo-actions">
                        <button class="btn-danger btn-small" data-grupo="${id}">🗑️ Eliminar Grupo</button>
                    </div>
                </div>
            `;
        }
        container.innerHTML = html;
        
        document.querySelectorAll('.btn-danger[data-grupo]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const grupoId = btn.dataset.grupo;
                if (confirm(`¿Eliminar el grupo "${grupoId}"? Se perderán todas las apuestas.`)) {
                    await eliminarGrupo(grupoId);
                    mostrarMensaje(`Grupo "${grupoId}" eliminado`, 'success');
                    cargarListaGrupos();
                    cargarGruposEnSelectores();
                    actualizarEstadisticas();
                }
            });
        });
    });
}

async function crearNuevoGrupo() {
    const grupoId = document.getElementById('nuevo-grupo-id').value.trim();
    const grupoNombre = document.getElementById('nuevo-grupo-nombre').value.trim();
    
    if (!grupoId) {
        mostrarMensaje('Ingresá un ID para el grupo', 'error');
        return;
    }
    
    if (!grupoNombre) {
        mostrarMensaje('Ingresá un nombre visible para el grupo', 'error');
        return;
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(grupoId)) {
        mostrarMensaje('El ID solo puede contener letras, números, guiones y guiones bajos', 'error');
        return;
    }
    
    try {
        await crearGrupo(grupoId, {
            nombre: grupoNombre,
            codigo: grupoId.toUpperCase()
        });
        mostrarMensaje(`✅ Grupo "${grupoNombre}" creado exitosamente`, 'success');
        
        document.getElementById('nuevo-grupo-id').value = '';
        document.getElementById('nuevo-grupo-nombre').value = '';
        
        cargarListaGrupos();
        cargarGruposEnSelectores();
        actualizarEstadisticas();
    } catch (error) {
        mostrarMensaje(error.message, 'error');
    }
}

// ============ PARTICIPANTES POR GRUPO ============

async function cargarParticipantesDelGrupoEnPanel(grupoId) {
    const participantes = await getParticipantesDelGrupo(grupoId);
    const container = document.getElementById('lista-participantes-grupo');
    
    if (participantes.length === 0) {
        container.innerHTML = '<p class="empty">No hay participantes registrados en este grupo</p>';
        return;
    }
    
    let html = '';
    for (const participante of participantes) {
        const info = await getInfoParticipante(grupoId, participante);
        html += `
            <div class="participante-item" data-nombre="${participante}">
                <div class="participante-info">
                    <span>👤 <strong>${participante}</strong></span>
                    ${info.telefono ? `<span>📞 ${info.telefono}</span>` : '<span style="color:#666;">📞 Sin teléfono</span>'}
                    <span style="font-size:0.7rem; color:#888;">📅 ${new Date(info.fechaRegistro).toLocaleDateString()}</span>
                </div>
                <div class="participante-actions">
                    <button class="btn-danger btn-small" data-participante="${participante}">🗑️ Eliminar</button>
                </div>
            </div>
        `;
    }
    container.innerHTML = html;
    
    document.querySelectorAll('#lista-participantes-grupo .btn-danger').forEach(btn => {
        btn.addEventListener('click', async () => {
            const participante = btn.dataset.participante;
            if (confirm(`¿Eliminar a "${participante}" del grupo? Se perderán todas sus apuestas.`)) {
                await eliminarParticipanteDeGrupo(currentGrupoId, participante);
                mostrarMensaje(`${participante} eliminado del grupo`, 'success');
                await cargarParticipantesDelGrupoEnPanel(currentGrupoId);
                cargarListaGrupos();
                actualizarEstadisticas();
            }
        });
    });
}

// ============ RESULTADOS MEJORADOS - REEMPLAZAR COMPLETAMENTE ESTA SECCIÓN ============

async function cargarResultados(grupoId, filtro = 'all') {
    const resultados = await getResultadosDelGrupo(grupoId);
    const container = document.getElementById('resultados-container');
    if (!container) return;
    
    // Filtrar partidos por fase si es necesario
    let partidosFiltrados = todosLosPartidosData;
    switch(filtro) {
        case 'grupos':
            partidosFiltrados = todosLosPartidosData.filter(p => p.fase === 'grupos');
            break;
        case 'octavos':
            partidosFiltrados = todosLosPartidosData.filter(p => p.fase === 'octavos');
            break;
        case 'cuartos':
            partidosFiltrados = todosLosPartidosData.filter(p => p.fase === 'cuartos');
            break;
        case 'semis':
            partidosFiltrados = todosLosPartidosData.filter(p => p.fase === 'semis');
            break;
        case 'finales':
            partidosFiltrados = todosLosPartidosData.filter(p => p.fase === 'final' || p.fase === 'tercer');
            break;
        default:
            partidosFiltrados = todosLosPartidosData;
    }
    
    // Agrupar partidos por fecha
    const partidosPorFecha = {};
    partidosFiltrados.forEach(partido => {
        if (!partidosPorFecha[partido.fecha]) {
            partidosPorFecha[partido.fecha] = [];
        }
        partidosPorFecha[partido.fecha].push(partido);
    });
    
    // Ordenar fechas
    const fechasOrdenadas = Object.keys(partidosPorFecha).sort();
    
    if (fechasOrdenadas.length === 0) {
        container.innerHTML = '<div class="empty">No hay partidos en esta fase</div>';
        return;
    }
    
    // Estado de colapso (usando localStorage para recordar)
    const collapsedState = JSON.parse(localStorage.getItem('resultadosCollapsedState') || '{}');
    
    let html = `
        <style>
            .resultados-fecha-group {
                margin-bottom: 20px;
                border-radius: 12px;
                overflow: hidden;
                background: rgba(0,0,0,0.2);
            }
            .resultados-fecha-header {
                background: rgba(255,215,0,0.15);
                padding: 12px 15px;
                cursor: pointer;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-weight: bold;
                color: #ffd700;
            }
            .resultados-fecha-header:hover {
                background: rgba(255,215,0,0.25);
            }
            .resultados-fecha-body {
                display: block;
            }
            .resultados-fecha-body.collapsed {
                display: none;
            }
            .resultado-card-mejorado {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 15px;
                border-bottom: 1px solid rgba(255,255,255,0.05);
                flex-wrap: wrap;
                gap: 10px;
            }
            .resultado-card-mejorado:hover {
                background: rgba(255,255,255,0.03);
            }
            .resultado-card-mejorado:last-child {
                border-bottom: none;
            }
            .match-info-mejorado {
                flex: 2;
                min-width: 200px;
            }
            .match-teams {
                font-weight: bold;
                font-size: 0.95rem;
            }
            .match-teams img {
                width: 24px;
                height: 18px;
                vertical-align: middle;
                margin-right: 5px;
            }
            .match-metadata {
                font-size: 0.7rem;
                color: rgba(255,255,255,0.5);
                margin-top: 4px;
            }
            .score-inputs-mejorado {
                display: flex;
                align-items: center;
                gap: 8px;
                background: rgba(0,0,0,0.3);
                padding: 5px 12px;
                border-radius: 30px;
            }
            .score-inputs-mejorado input {
                width: 50px;
                padding: 6px;
                text-align: center;
                font-size: 1rem;
                font-weight: bold;
                background: rgba(255,255,255,0.1);
                border: 1px solid rgba(255,215,0,0.3);
                border-radius: 6px;
                color: white;
            }
            .score-inputs-mejorado input:focus {
                outline: none;
                border-color: #ffd700;
            }
            .score-inputs-mejorado .vs {
                font-weight: bold;
                color: #ffd700;
            }
            .badge-fase {
                background: rgba(255,215,0,0.1);
                padding: 2px 8px;
                border-radius: 20px;
                font-size: 0.65rem;
                color: #ffd700;
            }
            .btn-guardar-resultado {
                background: rgba(76, 175, 80, 0.2);
                border: 1px solid rgba(76, 175, 80, 0.5);
                color: #4caf50;
                padding: 5px 12px;
                border-radius: 20px;
                cursor: pointer;
                font-size: 0.8rem;
                transition: all 0.2s;
            }
            .btn-guardar-resultado:hover {
                background: rgba(76, 175, 80, 0.4);
            }
            .resultado-guardado {
                font-size: 0.75rem;
                color: #4caf50;
                margin-left: 8px;
            }
            @media (max-width: 768px) {
                .resultado-card-mejorado {
                    flex-direction: column;
                    align-items: stretch;
                }
                .score-inputs-mejorado {
                    justify-content: center;
                }
                .match-info-mejorado {
                    text-align: center;
                }
            }
        </style>
    `;
    
    fechasOrdenadas.forEach(fecha => {
        const partidos = partidosPorFecha[fecha];
        // Ordenar partidos por hora dentro de cada fecha
        const partidosOrdenados = [...partidos].sort((a, b) => {
            return (a.hora || '00:00').localeCompare(b.hora || '00:00');
        });
        
        const fechaFormateada = formatearFechaLocal(fecha);
        const isCollapsed = collapsedState[fecha] === true;
        
        html += `
            <div class="resultados-fecha-group" data-fecha="${fecha}">
                <div class="resultados-fecha-header" onclick="window.toggleResultadosFecha('${fecha}')">
                    <span>📅 ${fechaFormateada} (${partidos.length} partidos)</span>
                    <span class="toggle-icon">${isCollapsed ? '▶' : '▼'}</span>
                </div>
                <div class="resultados-fecha-body ${isCollapsed ? 'collapsed' : ''}" data-body="${fecha}">
                    ${generarPartidosResultadosHTML(partidosOrdenados, resultados)}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function generarPartidosResultadosHTML(partidos, resultados) {
    return partidos.map(partido => {
        const resultado = resultados[partido.id];
        const tieneResultado = resultado && (resultado.local !== undefined && resultado.visitante !== undefined);
        const faseNombre = getFaseNombre(partido.fase);
        const grupoInfo = partido.grupo ? `Grupo ${partido.grupo}` : '';
        
        // Determinar si el partido ya pasó (para estilo visual)
        const partidoPasado = isPartidoPasadoLocal(partido.fecha, partido.hora);
        
        return `
            <div class="resultado-card-mejorado" data-id="${partido.id}" style="${partidoPasado && !tieneResultado ? 'border-left: 3px solid #ff9800;' : ''}">
                <div class="match-info-mejorado">
                    <div class="match-teams">
                        ${conBandera(partido.local)} vs ${conBandera(partido.visitante)}
                    </div>
                    <div class="match-metadata">
                        ⏰ ${partido.hora || '--:--'} hrs | 
                        🏟️ ${partido.estadio} | 
                        <span class="badge-fase">${faseNombre}</span>
                        ${grupoInfo ? ` | ${grupoInfo}` : ''}
                        ${partidoPasado && !tieneResultado ? ' | ⚠️ Partido pasado sin resultado' : ''}
                    </div>
                </div>
                <div class="score-inputs-mejorado">
                    <input type="number" 
                           class="resultado-local-${partido.id}" 
                           placeholder="0" 
                           min="0" 
                           max="20" 
                           value="${resultado?.local !== undefined && resultado.local !== null ? resultado.local : ''}"
                           style="${tieneResultado ? 'border-color: #4caf50;' : ''}">
                    <span class="vs">-</span>
                    <input type="number" 
                           class="resultado-visitante-${partido.id}" 
                           placeholder="0" 
                           min="0" 
                           max="20" 
                           value="${resultado?.visitante !== undefined && resultado.visitante !== null ? resultado.visitante : ''}"
                           style="${tieneResultado ? 'border-color: #4caf50;' : ''}">
                    <button class="btn-guardar-resultado" onclick="window.guardarResultadoUnico(${partido.id})">
                        💾 Guardar
                    </button>
                    ${tieneResultado ? `<span class="resultado-guardado">✓ ${resultado.local} - ${resultado.visitante}</span>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Función para verificar si el partido ya pasó
function isPartidoPasadoLocal(fechaPartido, horaPartido) {
    if (!horaPartido) return false;
    const [year, month, day] = fechaPartido.split('-');
    const [hour, minute] = horaPartido.split(':');
    const fechaHoraPartido = new Date(year, month - 1, day, parseInt(hour), parseInt(minute || '0'));
    const ahora = new Date();
    return ahora > fechaHoraPartido;
}

// Función global para colapsar/expandir fechas
window.toggleResultadosFecha = (fecha) => {
    const body = document.querySelector(`.resultados-fecha-body[data-body="${fecha}"]`);
    const icon = document.querySelector(`.resultados-fecha-group[data-fecha="${fecha}"] .toggle-icon`);
    if (body && icon) {
        const isCollapsed = body.classList.contains('collapsed');
        if (isCollapsed) {
            body.classList.remove('collapsed');
            icon.textContent = '▼';
        } else {
            body.classList.add('collapsed');
            icon.textContent = '▶';
        }
        // Guardar estado
        const collapsedState = JSON.parse(localStorage.getItem('resultadosCollapsedState') || '{}');
        collapsedState[fecha] = !isCollapsed;
        localStorage.setItem('resultadosCollapsedState', JSON.stringify(collapsedState));
    }
};

// Función para guardar un resultado individual
window.guardarResultadoUnico = async (idPartido) => {
    const localInput = document.querySelector(`.resultado-local-${idPartido}`);
    const visitanteInput = document.querySelector(`.resultado-visitante-${idPartido}`);
    
    if (!localInput || !visitanteInput) return;
    
    const local = parseInt(localInput.value);
    const visitante = parseInt(visitanteInput.value);
    
    if (isNaN(local) || isNaN(visitante)) {
        mostrarMensagem('Ingresá ambos marcadores', 'error');
        return;
    }
    
    const grupoId = document.getElementById('grupo-resultados-select').value;
    if (!grupoId) {
        mostrarMensagem('Seleccioná un grupo primero', 'error');
        return;
    }
    
    try {
        await guardarResultadoEnGrupo(grupoId, idPartido, { local, visitante });
        
        // Cambiar estilo visual
        localInput.style.borderColor = '#4caf50';
        visitanteInput.style.borderColor = '#4caf50';
        
        // Actualizar o añadir el indicador de guardado
        const parent = localInput.closest('.score-inputs-mejorado');
        let savedSpan = parent.querySelector('.resultado-guardado');
        if (!savedSpan) {
            savedSpan = document.createElement('span');
            savedSpan.className = 'resultado-guardado';
            parent.appendChild(savedSpan);
        }
        savedSpan.textContent = `✓ ${local} - ${visitante}`;
        
        // También actualizar el borde del card si estaba marcado
        const card = parent.closest('.resultado-card-mejorado');
        if (card) {
            card.style.borderLeft = '3px solid #4caf50';
        }
        
        mostrarMensagem(`✅ Resultado ${local}-${visitante} guardado`, 'success');
        
        // Actualizar estadísticas
        actualizarEstadisticas();
    } catch (error) {
        mostrarMensagem(`Error: ${error.message}`, 'error');
    }
};

// Función de guardado masivo (reescrita para trabajar con la nueva UI)
async function guardarResultadosDelGrupo(grupoId) {
    if (!grupoId) {
        mostrarMensagem('Seleccioná un grupo', 'error');
        return;
    }
    
    // Recoger resultados de todos los inputs en la nueva UI
    const cards = document.querySelectorAll('.resultado-card-mejorado');
    const resultados = {};
    let contador = 0;
    
    cards.forEach(card => {
        const id = parseInt(card.dataset.id);
        const localInput = card.querySelector(`.resultado-local-${id}`);
        const visitanteInput = card.querySelector(`.resultado-visitante-${id}`);
        
        if (localInput && visitanteInput) {
            const local = parseInt(localInput.value);
            const visitante = parseInt(visitanteInput.value);
            
            if (!isNaN(local) && !isNaN(visitante)) {
                resultados[id] = { local, visitante };
                contador++;
            }
        }
    });
    
    if (contador === 0) {
        mostrarMensagem('No ingresaste ningún resultado', 'error');
        return;
    }
    
    mostrarMensagem(`💾 Guardando ${contador} resultados...`, 'info');
    
    for (const [id, resultado] of Object.entries(resultados)) {
        await guardarResultadoEnGrupo(grupoId, parseInt(id), resultado);
    }
    
    mostrarMensagem(`✅ ${contador} resultados guardados en el grupo`, 'success');
    actualizarEstadisticas();
    
    // Recargar para mostrar los indicadores visuales
    const filtroActual = document.getElementById('filtro-fase-resultados')?.value || 'all';
    await cargarResultados(grupoId, filtroActual);
}

// Función auxiliar para formatear fecha
function formatearFechaLocal(fecha) {
    if (typeof formatearFecha === 'function') {
        return formatearFecha(fecha);
    }
    // Fallback si no existe la función
    const [year, month, day] = fecha.split('-');
    const fechaObj = new Date(year, month - 1, day);
    return fechaObj.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

// ============ REGLAS ============

async function cargarReglasDelGrupoEnPanel(grupoId) {
    const reglas = await getReglasDelGrupo(grupoId);
    document.getElementById('puntos-exacto').value = reglas.puntosExacto || 3;
    document.getElementById('puntos-ganador').value = reglas.puntosGanador || 1;
    document.getElementById('puntos-empate').value = reglas.puntosEmpate || 2;
}

async function guardarReglasDelGrupo() {
    const grupoId = document.getElementById('grupo-reglas-select').value;
    if (!grupoId) {
        mostrarMensaje('Seleccioná un grupo', 'error');
        return;
    }
    
    const nuevasReglas = {
        puntosExacto: parseInt(document.getElementById('puntos-exacto').value),
        puntosGanador: parseInt(document.getElementById('puntos-ganador').value),
        puntosEmpate: parseInt(document.getElementById('puntos-empate').value),
        permiteModificar: true,
        cierreAutomatico: true
    };
    
    await actualizarReglasDelGrupo(grupoId, nuevasReglas);
    mostrarMensaje(`✅ Reglas actualizadas para el grupo ${grupoId}`, 'success');
    cargarListaGrupos();
}

// ============ PREMIOS ============

async function cargarPremiosDelGrupoEnPanel(grupoId) {
    const premios = await getPremiosDelGrupo(grupoId);
    document.getElementById('cantidad-ganadores').value = premios.cantidadGanadores || 3;
    document.getElementById('premio-primero').value = premios.primero || 50;
    document.getElementById('premio-segundo').value = premios.segundo || 30;
    document.getElementById('premio-tercero').value = premios.tercero || 20;
    
    const cantidad = premios.cantidadGanadores || 3;
    const segundoGroup = document.getElementById('segundo-puesto-group');
    const tercerGroup = document.getElementById('tercer-puesto-group');
    if (segundoGroup) segundoGroup.style.display = cantidad >= 2 ? 'block' : 'none';
    if (tercerGroup) tercerGroup.style.display = cantidad >= 3 ? 'block' : 'none';
}

async function guardarPremiosDelGrupo() {
    const grupoId = document.getElementById('grupo-premios-select').value;
    if (!grupoId) {
        mostrarMensaje('Seleccioná un grupo', 'error');
        return;
    }
    
    const cantidadGanadores = parseInt(document.getElementById('cantidad-ganadores').value);
    const nuevosPremios = {
        cantidadGanadores: cantidadGanadores,
        primero: parseInt(document.getElementById('premio-primero').value),
        segundo: cantidadGanadores >= 2 ? parseInt(document.getElementById('premio-segundo').value) : 0,
        tercero: cantidadGanadores >= 3 ? parseInt(document.getElementById('premio-tercero').value) : 0
    };
    
    await actualizarPremiosDelGrupo(grupoId, nuevosPremios);
    mostrarMensaje(`✅ Premios actualizados para el grupo ${grupoId}`, 'success');
    cargarListaGrupos();
}

// ============ APUESTAS EXTRA ============

function cargarSelectoresApuestasExtra() {
    const grupoSelect = document.getElementById('grupo-apuestasextras-select');
    if (grupoSelect) {
        grupoSelect.addEventListener('change', async (e) => {
            const grupoId = e.target.value;
            if (grupoId) {
                await cargarApuestasExtraEnPanel(grupoId);
                document.getElementById('apuestasextras-panel').style.display = 'block';
            } else {
                document.getElementById('apuestasextras-panel').style.display = 'none';
            }
        });
    }
}

async function cargarApuestasExtraEnPanel(grupoId) {
    const participantes = await getParticipantesDelGrupo(grupoId);
    const apuestasExtras = await getApuestasExtrasDelGrupo(grupoId);
    const container = document.getElementById('lista-apuestasextras');
    
    if (participantes.length === 0) {
        container.innerHTML = '<p class="empty">No hay participantes en este grupo</p>';
        return;
    }
    
    let html = '<table class="tabla-limites"><thead><tr><th>Participante</th><th>Límite actual</th><th>Nuevo límite</th><th>Acción</th></tr></thead><tbody>';
    
    participantes.forEach(participante => {
        const limiteActual = apuestasExtras[participante] || 1;
        const participanteId = participante.replace(/\s/g, '').replace(/[^a-zA-Z0-9]/g, '');
        html += `
            <tr>
                <td><strong>${participante}</strong></td>
                <td><span class="limite-actual" id="limite-${participanteId}">${limiteActual}</span> pronóstico(s)</td>
                <td>
                    <select id="select-${participanteId}" class="form-input" style="width: 140px;">
                        <option value="1" ${limiteActual === 1 ? 'selected' : ''}>1 pronóstico (normal)</option>
                        <option value="2" ${limiteActual === 2 ? 'selected' : ''}>2 pronósticos</option>
                        <option value="3" ${limiteActual === 3 ? 'selected' : ''}>3 pronósticos</option>
                        <option value="4" ${limiteActual === 4 ? 'selected' : ''}>4 pronósticos</option>
                        <option value="5" ${limiteActual === 5 ? 'selected' : ''}>5 pronósticos</option>
                        <option value="10" ${limiteActual === 10 ? 'selected' : ''}>10 pronósticos</option>
                        <option value="20" ${limiteActual === 20 ? 'selected' : ''}>20 pronósticos</option>
                    </select>
                </td>
                <td>
                    <button class="btn-actualizar-limite" data-participante="${participante}" data-participante-id="${participanteId}">💾 Actualizar</button>
                </td>
            </tr>
        `;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
    
    document.querySelectorAll('.btn-actualizar-limite').forEach(btn => {
        btn.addEventListener('click', async () => {
            const participante = btn.dataset.participante;
            const participanteId = btn.dataset.participanteId;
            const select = document.getElementById(`select-${participanteId}`);
            const nuevoLimite = parseInt(select.value);
            const resultado = await actualizarLimiteApuestasParticipante(grupoId, participante, nuevoLimite);
            
            if (resultado) {
                const limiteSpan = document.getElementById(`limite-${participanteId}`);
                if (limiteSpan) limiteSpan.textContent = nuevoLimite;
                mostrarMensagem(`✅ Límite de ${participante} actualizado a ${nuevoLimite} pronóstico(s)`, 'success');
            } else {
                mostrarMensagem(`❌ Error al actualizar límite de ${participante}`, 'error');
            }
        });
    });
}

// ============ SINCRONIZACIÓN CON FIREBASE ============

function cargarSelectoresSincronizacion() {
    const syncBtn = document.getElementById('sincronizar-ahora');
    const forceBtn = document.getElementById('forzar-carga');
    
    if (syncBtn) {
        syncBtn.addEventListener('click', async () => {
            mostrarMensagem('🔄 Sincronizando con la nube...', 'info');
            await sincronizarLocalAFirebase();
            mostrarMensagem('✅ Datos sincronizados correctamente', 'success');
        });
    }
    
    if (forceBtn) {
        forceBtn.addEventListener('click', async () => {
            mostrarMensagem('📥 Cargando datos desde la nube...', 'info');
            const cargados = await cargarFirebaseALocal();
            if (cargados) {
                mostrarMensagem('✅ Datos cargados desde la nube. Recargando...', 'success');
                setTimeout(() => location.reload(), 1500);
            } else {
                mostrarMensagem('❌ No hay datos en la nube', 'error');
            }
        });
    }
}

// ============ ESTADÍSTICAS ============

async function actualizarEstadisticas() {
    const grupos = await getGrupos();
    
    const totalGrupos = Object.keys(grupos).length;
    const totalParticipantesGrupos = Object.values(grupos).reduce((sum, grupo) => sum + grupo.participantes.length, 0);
    const totalApuestas = Object.values(grupos).reduce((sum, grupo) => {
        const apuestasGrupo = grupo.apuestas || {};
        return sum + Object.values(apuestasGrupo).reduce((s, p) => s + Object.keys(p).length, 0);
    }, 0);
    
    const totalGruposSpan = document.getElementById('total-grupos');
    const totalParticipantesSpan = document.getElementById('total-participantes');
    const totalApuestasSpan = document.getElementById('total-apuestas');
    
    if (totalGruposSpan) totalGruposSpan.textContent = totalGrupos;
    if (totalParticipantesSpan) totalParticipantesSpan.textContent = totalParticipantesGrupos;
    if (totalApuestasSpan) totalApuestasSpan.textContent = totalApuestas;
}

function mostrarMensagem(msg, tipo) {
    const toast = document.createElement('div');
    toast.textContent = msg;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${tipo === 'success' ? '#4caf50' : tipo === 'error' ? '#f44336' : '#2196f3'};
        color: white;
        padding: 12px 24px;
        border-radius: 12px;
        font-weight: bold;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Inicializar
setTimeout(() => {
    if (document.getElementById('admin-content')?.style.display !== 'none') {
        init();
    }
}, 100);