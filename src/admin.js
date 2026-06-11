// src/admin.js - Con integración completa de grupos, contraseñas y premios
import { 
    getParticipantes, 
    agregarParticipante, 
    eliminarParticipante, 
    togglePagoParticipante,
    editarNombreParticipante,
    getResultados,
    saveResultados,
    getApuestas
} from './storage.js';
import { 
    getGrupos, 
    guardarGrupos, 
    crearGrupo, 
    eliminarGrupo,
    getParticipantesDelGrupo,
    agregarParticipanteAGrupo,
    eliminarParticipanteDeGrupo,
    guardarResultadoEnGrupo,
    getResultadosDelGrupo,
    actualizarReglasDelGrupo,
    getReglasDelGrupo,
    actualizarContrasenaGrupo,
    getPremiosDelGrupo,
    actualizarPremiosDelGrupo
} from './groups.js';
import { todosLosPartidos, conBandera, getFaseNombre } from './data.js';

let todosLosPartidosData = todosLosPartidos;
let currentGrupoId = '';

function init() {
    console.log('Admin inicializado con grupos, contraseñas y premios');
    cargarGruposEnSelectores();
    cargarListaGrupos();
    cargarListaParticipantesOriginal();
    actualizarEstadisticas();
    setupEventListeners();
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
    
    const agregarParticipanteGrupoBtn = document.getElementById('agregar-participante-grupo-btn');
    if (agregarParticipanteGrupoBtn) {
        agregarParticipanteGrupoBtn.addEventListener('click', agregarParticipanteAlGrupo);
    }
    
    // === RESULTADOS POR GRUPO ===
    const grupoResultadosSelect = document.getElementById('grupo-resultados-select');
    if (grupoResultadosSelect) {
        grupoResultadosSelect.addEventListener('change', (e) => {
            currentGrupoId = e.target.value;
            if (currentGrupoId) {
                document.getElementById('resultados-panel').style.display = 'block';
                cargarResultados(currentGrupoId, 'all');
            } else {
                document.getElementById('resultados-panel').style.display = 'none';
            }
        });
    }
    
    const filtroFase = document.getElementById('filtro-fase-resultados');
    if (filtroFase) {
        filtroFase.addEventListener('change', (e) => {
            if (currentGrupoId) {
                cargarResultados(currentGrupoId, e.target.value);
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
                cargarPremiosDelGrupoEnPanel(grupoId);
                document.getElementById('reglas-panel').style.display = 'block';
            } else {
                document.getElementById('reglas-panel').style.display = 'none';
            }
        });
    }
    
    const guardarReglasGrupoBtn = document.getElementById('guardar-reglas-grupo-btn');
    if (guardarReglasGrupoBtn) {
        guardarReglasGrupoBtn.addEventListener('click', () => guardarReglasDelGrupo());
    }
    
    // === PREMIOS ===
    const guardarPremiosBtn = document.getElementById('guardar-premios-btn');
    if (guardarPremiosBtn) {
        guardarPremiosBtn.addEventListener('click', guardarPremiosDelGrupo);
    }
    
    const cantidadGanadoresSelect = document.getElementById('cantidad-ganadores');
    if (cantidadGanadoresSelect) {
        cantidadGanadoresSelect.addEventListener('change', (e) => {
            const cantidad = parseInt(e.target.value);
            document.getElementById('segundo-puesto-group').style.display = cantidad >= 2 ? 'block' : 'none';
            document.getElementById('tercer-puesto-group').style.display = cantidad >= 3 ? 'block' : 'none';
        });
    }
    
    // === CAMBIAR CONTRASEÑA ===
    const cambiarContrasenaBtn = document.getElementById('cambiar-contrasena-grupo-btn');
    if (cambiarContrasenaBtn) {
        cambiarContrasenaBtn.addEventListener('click', () => {
            const grupoId = document.getElementById('grupo-reglas-select').value;
            if (grupoId) {
                const grupos = getGrupos();
                const grupoNombre = grupos[grupoId]?.nombre || grupoId;
                abrirModalCambiarContrasena(grupoId, grupoNombre);
            } else {
                mostrarMensaje('Seleccioná un grupo primero', 'error');
            }
        });
    }
    
    // === PARTICIPANTES ORIGINALES (para compatibilidad) ===
    const agregarBtn = document.getElementById('agregar-participante');
    if (agregarBtn) {
        agregarBtn.addEventListener('click', () => {
            const nombre = document.getElementById('nombre-participante').value.trim();
            const telefono = document.getElementById('telefono-participante').value.trim();
            const pago = document.getElementById('pago-participante').checked;
            
            if (!nombre) {
                alert('El nombre es obligatorio');
                return;
            }
            
            if (agregarParticipante(nombre, telefono, pago)) {
                document.getElementById('nombre-participante').value = '';
                document.getElementById('telefono-participante').value = '';
                document.getElementById('pago-participante').checked = false;
                cargarListaParticipantesOriginal();
                actualizarEstadisticas();
                mostrarMensaje(`✅ ${nombre} agregado correctamente`, 'success');
            } else {
                mostrarMensaje(`❌ El participante ${nombre} ya existe`, 'error');
            }
        });
    }
}

// ============ GRUPOS ============
function cargarGruposEnSelectores() {
    const grupos = getGrupos();
    const selectores = [
        'grupo-participantes-select',
        'grupo-resultados-select',
        'grupo-reglas-select'
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
}

function cargarListaGrupos() {
    const grupos = getGrupos();
    const container = document.getElementById('lista-grupos');
    if (!container) return;
    
    if (Object.keys(grupos).length === 0) {
        container.innerHTML = '<p class="empty">No hay grupos creados. Creá el primero 👆</p>';
        return;
    }
    
    let html = '';
    for (const [id, grupo] of Object.entries(grupos)) {
        const contrasenaMostrada = '•'.repeat((grupo.contrasena || '').length) || 'No establecida';
        const premios = grupo.premios || { cantidadGanadores: 3, primero: 50, segundo: 30, tercero: 20 };
        html += `
            <div class="grupo-card">
                <h3>🏆 ${grupo.nombre}</h3>
                <p><strong>ID:</strong> ${id}</p>
                <p><strong>🔐 Contraseña:</strong> ${contrasenaMostrada}</p>
                <p><strong>👥 Participantes:</strong> ${grupo.participantes.length}</p>
                <p><strong>📜 Reglas:</strong> ${grupo.reglas?.puntosExacto || 3} pts exacto / ${grupo.reglas?.puntosGanador || 1} pts ganador</p>
                <p><strong>🏆 Premios:</strong> ${premios.cantidadGanadores} ganador(es) (${premios.primero}% / ${premios.segundo}% / ${premios.tercero}%)</p>
                <div class="grupo-actions">
                    <button class="btn-cambiar-contrasena" data-grupo="${id}" data-nombre="${grupo.nombre}">🔑 Cambiar Contraseña</button>
                    <button class="btn-danger btn-small" data-grupo="${id}">🗑️ Eliminar Grupo</button>
                </div>
            </div>
        `;
    }
    container.innerHTML = html;
    
    // Eventos para eliminar grupos
    document.querySelectorAll('.btn-danger[data-grupo]').forEach(btn => {
        btn.addEventListener('click', () => {
            const grupoId = btn.dataset.grupo;
            if (confirm(`¿Eliminar el grupo "${grupoId}"? Se perderán todas las apuestas.`)) {
                eliminarGrupo(grupoId);
                mostrarMensaje(`Grupo "${grupoId}" eliminado`, 'success');
                cargarListaGrupos();
                cargarGruposEnSelectores();
                actualizarEstadisticas();
            }
        });
    });
    
    // Eventos para cambiar contraseña
    document.querySelectorAll('.btn-cambiar-contrasena').forEach(btn => {
        btn.addEventListener('click', () => {
            const grupoId = btn.dataset.grupo;
            const grupoNombre = btn.dataset.nombre;
            abrirModalCambiarContrasena(grupoId, grupoNombre);
        });
    });
}

function abrirModalCambiarContrasena(grupoId, grupoNombre) {
    const modal = document.createElement('div');
    modal.className = 'modal-editar';
    modal.innerHTML = `
        <div class="modal-editar-content">
            <h3>🔐 Cambiar Contraseña</h3>
            <p>Grupo: <strong>${grupoNombre}</strong></p>
            <label>Nueva contraseña:</label>
            <input type="password" id="nueva-contrasena" placeholder="Ingresá la nueva contraseña" class="form-input">
            <label>Confirmar contraseña:</label>
            <input type="password" id="confirmar-contrasena" placeholder="Confirmá la nueva contraseña" class="form-input">
            <div class="modal-buttons">
                <button id="guardar-contrasena" class="btn-primary">💾 Guardar</button>
                <button id="cancelar-contrasena" class="btn-secondary">Cancelar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    
    const guardarBtn = document.getElementById('guardar-contrasena');
    const cancelarBtn = document.getElementById('cancelar-contrasena');
    
    guardarBtn?.addEventListener('click', () => {
        const nuevaContrasena = document.getElementById('nueva-contrasena').value;
        const confirmarContrasena = document.getElementById('confirmar-contrasena').value;
        
        if (!nuevaContrasena) {
            mostrarMensaje('La contraseña no puede estar vacía', 'error');
            return;
        }
        
        if (nuevaContrasena !== confirmarContrasena) {
            mostrarMensaje('Las contraseñas no coinciden', 'error');
            return;
        }
        
        const resultado = actualizarContrasenaGrupo(grupoId, nuevaContrasena);
        if (resultado) {
            mostrarMensaje(`✅ Contraseña del grupo "${grupoNombre}" actualizada`, 'success');
            cargarListaGrupos();
            modal.remove();
        } else {
            mostrarMensaje('Error al actualizar la contraseña', 'error');
        }
    });
    
    cancelarBtn?.addEventListener('click', () => {
        modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

function crearNuevoGrupo() {
    const grupoId = document.getElementById('nuevo-grupo-id').value.trim();
    const grupoNombre = document.getElementById('nuevo-grupo-nombre').value.trim();
    const contrasena = document.getElementById('nuevo-grupo-contrasena').value;
    
    if (!grupoId) {
        mostrarMensaje('Ingresá un ID para el grupo', 'error');
        return;
    }
    
    if (!grupoNombre) {
        mostrarMensaje('Ingresá un nombre visible para el grupo', 'error');
        return;
    }
    
    if (!contrasena) {
        mostrarMensaje('Ingresá una contraseña para el grupo', 'error');
        return;
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(grupoId)) {
        mostrarMensaje('El ID solo puede contener letras, números, guiones y guiones bajos', 'error');
        return;
    }
    
    try {
        crearGrupo(grupoId, {
            nombre: grupoNombre,
            codigo: grupoId.toUpperCase(),
            contrasena: contrasena
        });
        mostrarMensaje(`✅ Grupo "${grupoNombre}" creado exitosamente`, 'success');
        
        document.getElementById('nuevo-grupo-id').value = '';
        document.getElementById('nuevo-grupo-nombre').value = '';
        document.getElementById('nuevo-grupo-contrasena').value = '';
        
        cargarListaGrupos();
        cargarGruposEnSelectores();
        actualizarEstadisticas();
    } catch (error) {
        mostrarMensaje(error.message, 'error');
    }
}

// ============ PARTICIPANTES POR GRUPO ============
function cargarParticipantesDelGrupoEnPanel(grupoId) {
    const participantes = getParticipantesDelGrupo(grupoId);
    const container = document.getElementById('lista-participantes-grupo');
    
    if (participantes.length === 0) {
        container.innerHTML = '<p class="empty">No hay participantes en este grupo</p>';
        return;
    }
    
    let html = '';
    participantes.forEach(participante => {
        html += `
            <div class="participante-item">
                <span>👤 ${participante}</span>
                <button class="btn-danger btn-small" data-participante="${participante}">Eliminar</button>
            </div>
        `;
    });
    container.innerHTML = html;
    
    document.querySelectorAll('#lista-participantes-grupo .btn-danger').forEach(btn => {
        btn.addEventListener('click', () => {
            const participante = btn.dataset.participante;
            if (confirm(`¿Eliminar a "${participante}" del grupo?`)) {
                eliminarParticipanteDeGrupo(grupoId, participante);
                mostrarMensaje(`${participante} eliminado del grupo`, 'success');
                cargarParticipantesDelGrupoEnPanel(grupoId);
                cargarListaGrupos();
                actualizarEstadisticas();
            }
        });
    });
}

function agregarParticipanteAlGrupo() {
    if (!currentGrupoId) {
        mostrarMensaje('Seleccioná un grupo primero', 'error');
        return;
    }
    
    const nombre = document.getElementById('nuevo-participante-grupo').value.trim();
    if (!nombre) {
        mostrarMensaje('Ingresá un nombre', 'error');
        return;
    }
    
    const resultado = agregarParticipanteAGrupo(currentGrupoId, nombre);
    if (resultado) {
        mostrarMensaje(`✅ "${nombre}" agregado al grupo`, 'success');
        document.getElementById('nuevo-participante-grupo').value = '';
        cargarParticipantesDelGrupoEnPanel(currentGrupoId);
        cargarListaGrupos();
        actualizarEstadisticas();
    } else {
        mostrarMensaje(`❌ "${nombre}" ya existe en este grupo`, 'error');
    }
}

// ============ RESULTADOS POR GRUPO ============
function cargarResultados(grupoId, filtro = 'all') {
    const resultados = getResultadosDelGrupo(grupoId);
    const container = document.getElementById('resultados-container');
    if (!container) return;
    
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
    
    container.innerHTML = partidosFiltrados.map(partido => {
        const resultado = resultados[partido.id];
        return `
            <div class="apuesta-card resultado-card" data-id="${partido.id}">
                <div class="match-info">
                    <div class="match-teams">${conBandera(partido.local)} vs ${conBandera(partido.visitante)}</div>
                    <div class="match-date">📅 ${partido.fecha} ${partido.hora || ''} | ${getFaseNombre(partido.fase)}</div>
                </div>
                <div class="score-inputs">
                    <input type="number" class="resultado-local" placeholder="0" min="0" max="20" value="${resultado?.local !== undefined ? resultado.local : ''}">
                    <span class="vs">-</span>
                    <input type="number" class="resultado-visitante" placeholder="0" min="0" max="20" value="${resultado?.visitante !== undefined ? resultado.visitante : ''}">
                </div>
            </div>
        `;
    }).join('');
}

function guardarResultadosDelGrupo(grupoId) {
    if (!grupoId) {
        mostrarMensaje('Seleccioná un grupo', 'error');
        return;
    }
    
    const cards = document.querySelectorAll('#resultados-container .resultado-card');
    const resultados = {};
    
    cards.forEach(card => {
        const id = parseInt(card.dataset.id);
        const localInput = card.querySelector('.resultado-local');
        const visitanteInput = card.querySelector('.resultado-visitante');
        const local = parseInt(localInput.value);
        const visitante = parseInt(visitanteInput.value);
        
        if (!isNaN(local) && !isNaN(visitante)) {
            resultados[id] = { local, visitante };
        }
    });
    
    if (Object.keys(resultados).length === 0) {
        mostrarMensaje('No ingresaste ningún resultado', 'error');
        return;
    }
    
    for (const [id, resultado] of Object.entries(resultados)) {
        guardarResultadoEnGrupo(grupoId, parseInt(id), resultado);
    }
    
    mostrarMensaje(`✅ ${Object.keys(resultados).length} resultados guardados en el grupo`, 'success');
    actualizarEstadisticas();
}

// ============ REGLAS POR GRUPO ============
function cargarReglasDelGrupoEnPanel(grupoId) {
    const reglas = getReglasDelGrupo(grupoId);
    document.getElementById('puntos-exacto').value = reglas.puntosExacto || 3;
    document.getElementById('puntos-ganador').value = reglas.puntosGanador || 1;
}

function guardarReglasDelGrupo() {
    const grupoId = document.getElementById('grupo-reglas-select').value;
    if (!grupoId) {
        mostrarMensaje('Seleccioná un grupo', 'error');
        return;
    }
    
    const nuevasReglas = {
        puntosExacto: parseInt(document.getElementById('puntos-exacto').value),
        puntosGanador: parseInt(document.getElementById('puntos-ganador').value),
        permiteModificar: true,
        cierreAutomatico: true
    };
    
    actualizarReglasDelGrupo(grupoId, nuevasReglas);
    mostrarMensaje(`✅ Reglas actualizadas para el grupo`, 'success');
    cargarListaGrupos();
}

// ============ PREMIOS POR GRUPO ============
function cargarPremiosDelGrupoEnPanel(grupoId) {
    const premios = getPremiosDelGrupo(grupoId);
    document.getElementById('cantidad-ganadores').value = premios.cantidadGanadores || 3;
    document.getElementById('premio-primero').value = premios.primero || 50;
    document.getElementById('premio-segundo').value = premios.segundo || 30;
    document.getElementById('premio-tercero').value = premios.tercero || 20;
    
    const cantidad = premios.cantidadGanadores || 3;
    document.getElementById('segundo-puesto-group').style.display = cantidad >= 2 ? 'block' : 'none';
    document.getElementById('tercer-puesto-group').style.display = cantidad >= 3 ? 'block' : 'none';
}

function guardarPremiosDelGrupo() {
    const grupoId = document.getElementById('grupo-reglas-select').value;
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
    
    actualizarPremiosDelGrupo(grupoId, nuevosPremios);
    mostrarMensaje(`✅ Premios actualizados para el grupo`, 'success');
    cargarListaGrupos();
}

// ============ PARTICIPANTES ORIGINALES (Compatibilidad) ============
function cargarListaParticipantesOriginal() {
    const participantes = getParticipantes();
    const container = document.getElementById('lista-participantes');
    if (!container) return;
    
    if (participantes.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:20px;">No hay participantes. Agregá el primero 👆</p>';
        return;
    }
    
    container.innerHTML = participantes.map(p => `
        <div class="participante-item" data-id="${p.id}">
            <div class="participante-info">
                <span class="participante-nombre">📌 <strong>${p.nombre}</strong></span>
                ${p.telefono ? `<span>📞 ${p.telefono}</span>` : ''}
                <span class="${p.pago ? 'pagado-badge' : 'no-pagado-badge'}">
                    ${p.pago ? '✅ Pagó' : '⏳ Pendiente'}
                </span>
            </div>
            <div class="participante-actions">
                <button class="btn-toggle-pago" data-id="${p.id}" data-pago="${p.pago}">
                    ${p.pago ? '💰 Marcar no pagó' : '💵 Marcar pagó'}
                </button>
                <button class="btn-eliminar" data-id="${p.id}">🗑️ Eliminar</button>
            </div>
        </div>
    `).join('');
    
    document.querySelectorAll('.btn-toggle-pago').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(btn.dataset.id);
            togglePagoParticipante(id);
            cargarListaParticipantesOriginal();
            actualizarEstadisticas();
            mostrarMensaje('🔄 Estado de pago actualizado', 'success');
        });
    });
    
    document.querySelectorAll('.btn-eliminar').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(btn.dataset.id);
            const participante = participantes.find(p => p.id === id);
            if (confirm(`¿Eliminar a "${participante?.nombre}"? Se perderán TODAS sus apuestas.`)) {
                eliminarParticipante(id);
                cargarListaParticipantesOriginal();
                actualizarEstadisticas();
                mostrarMensaje(`🗑️ ${participante?.nombre} eliminado`, 'success');
            }
        });
    });
}

// ============ ESTADÍSTICAS ============
function actualizarEstadisticas() {
    const grupos = getGrupos();
    const participantes = getParticipantes();
    const apuestas = getApuestas();
    
    const totalGrupos = Object.keys(grupos).length;
    const totalParticipantesGrupos = Object.values(grupos).reduce((sum, grupo) => sum + grupo.participantes.length, 0);
    const totalApuestas = Object.values(apuestas).reduce((sum, participanteApuestas) => {
        return sum + Object.keys(participanteApuestas).length;
    }, 0);
    
    const totalGruposSpan = document.getElementById('total-grupos');
    const totalParticipantesSpan = document.getElementById('total-participantes');
    const totalApuestasSpan = document.getElementById('total-apuestas');
    
    if (totalGruposSpan) totalGruposSpan.textContent = totalGrupos;
    if (totalParticipantesSpan) totalParticipantesSpan.textContent = totalParticipantesGrupos;
    if (totalApuestasSpan) totalApuestasSpan.textContent = totalApuestas;
}

// ============ UTILIDADES ============
function mostrarMensaje(msg, tipo) {
    const toast = document.createElement('div');
    toast.textContent = msg;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${tipo === 'success' ? '#4caf50' : '#f44336'};
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