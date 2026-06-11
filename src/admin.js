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

// ============ RESULTADOS ============

async function cargarResultados(grupoId, filtro = 'all') {
    const resultados = await getResultadosDelGrupo(grupoId);
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

async function guardarResultadosDelGrupo(grupoId) {
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
        await guardarResultadoEnGrupo(grupoId, parseInt(id), resultado);
    }
    
    mostrarMensaje(`✅ ${Object.keys(resultados).length} resultados guardados en el grupo`, 'success');
    actualizarEstadisticas();
}

// ============ REGLAS ============

async function cargarReglasDelGrupoEnPanel(grupoId) {
    const reglas = await getReglasDelGrupo(grupoId);
    document.getElementById('puntos-exacto').value = reglas.puntosExacto || 3;
    document.getElementById('puntos-ganador').value = reglas.puntosGanador || 1;
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