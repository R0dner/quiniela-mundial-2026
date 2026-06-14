// src/admin.js - Admin con todas las funciones (con Firebase)
import { 
    getGrupos, 
    getGrupo,
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

    // AGREGAR al final de setupEventListeners():
    const grupoPozoSelect = document.getElementById('grupo-pozo-select');
    if (grupoPozoSelect) {
        grupoPozoSelect.addEventListener('change', async (e) => {
            const grupoId = e.target.value;
            if (grupoId) {
                await cargarPozoEnPanel(grupoId);
                document.getElementById('pozo-panel').style.display = 'block';
            } else {
                document.getElementById('pozo-panel').style.display = 'none';
            }
        });
    }

    const guardarPozoBtn = document.getElementById('guardar-pozo-btn');
    if (guardarPozoBtn) {
        guardarPozoBtn.addEventListener('click', guardarPozo);
    }
}

function cargarGruposEnSelectores() {
    getGrupos().then(grupos => {
        const selectores = [
            'grupo-participantes-select',
            'grupo-resultados-select',
            'grupo-reglas-select',
            'grupo-premios-select',
            'grupo-pozo-select',
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

// ============ PARTICIPANTES POR GRUPO (MEJORADO CON EDITAR) ============

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
        const cantidadPronosticos = await getCantidadPronosticosParticipante(grupoId, participante);
        
        html += `
            <div class="participante-item" data-nombre="${participante}" style="border: 1px solid rgba(255,215,0,0.2); border-radius: 10px; margin-bottom: 10px; padding: 12px;">
                <div class="participante-info" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                    <div style="flex: 1;">
                        <div><strong>👤 ${participante}</strong></div>
                        <div style="font-size: 0.8rem; color: #aaa;">📞 ${info.telefono || 'Sin teléfono'}</div>
                        <div style="font-size: 0.75rem; color: #ffd700;">📝 ${cantidadPronosticos} pronóstico(s)</div>
                        <div style="font-size: 0.7rem; color: #666;">📅 ${new Date(info.fechaRegistro).toLocaleDateString()}</div>
                    </div>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <button class="btn-editar-participante btn-secondary btn-small" 
                                data-participante="${participante}" 
                                style="background: rgba(255,215,0,0.2); border-color: #ffd700; color: #ffd700; padding: 6px 12px; border-radius: 6px; cursor: pointer;">
                            ✏️ Editar
                        </button>
                        <button class="btn-danger btn-small" data-participante="${participante}" style="padding: 6px 12px; border-radius: 6px; cursor: pointer;">
                            🗑️ Eliminar
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    container.innerHTML = html;
    
    // Evento para editar participante
    document.querySelectorAll('.btn-editar-participante').forEach(btn => {
        btn.addEventListener('click', async () => {
            const participante = btn.dataset.participante;
            await abrirModalEditarParticipante(currentGrupoId, participante);
        });
    });
    
    // Evento para eliminar participante
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

// REEMPLAZAR la función por:
async function getCantidadPronosticosParticipante(grupoId, participanteNombre) {
    try {
        const grupo = await getGrupo(grupoId); // ← usa getGrupo directo, no getGrupos
        if (!grupo?.apuestas?.[participanteNombre]) return 0;
        
        const apuestasPorPartido = grupo.apuestas[participanteNombre];
        let total = 0;
        
        for (const apuestasRaw of Object.values(apuestasPorPartido)) {
            // Normalizar objeto Firebase a array
            if (Array.isArray(apuestasRaw)) {
                total += apuestasRaw.length;
            } else if (typeof apuestasRaw === 'object' && apuestasRaw !== null) {
                total += Object.values(apuestasRaw).length;
            }
        }
        
        return total;
    } catch (error) {
        return 0;
    }
}

// ============ MODAL EDITAR PARTICIPANTE Y ELIMINAR PRONÓSTICOS ============

async function abrirModalEditarParticipante(grupoId, participanteNombre) {
    const info = await getInfoParticipante(grupoId, participanteNombre);
    
    const modalHtml = `
        <div id="modal-editar-participante" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 10000; display: flex; align-items: center; justify-content: center;">
            <div style="background: #1a1a2e; border-radius: 16px; max-width: 600px; width: 90%; max-height: 85%; overflow-y: auto; padding: 20px; border: 1px solid #ffd700;">
                <h3 style="color: #ffd700; margin-bottom: 20px;">✏️ Editar Participante: ${participanteNombre}</h3>
                
                <div class="form-group">
                    <label>📛 Nombre del participante:</label>
                    <input type="text" id="edit-nombre" class="form-input" value="${participanteNombre}" style="width: 100%; padding: 10px; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,215,0,0.3); border-radius: 8px; color: white;">
                </div>
                
                <div class="form-group">
                    <label>📞 Teléfono (opcional):</label>
                    <input type="text" id="edit-telefono" class="form-input" value="${info.telefono || ''}" style="width: 100%; padding: 10px; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,215,0,0.3); border-radius: 8px; color: white;">
                </div>
                
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button id="guardar-edicion" class="btn-primary" style="background: linear-gradient(135deg, #ffd700, #ffed4e); color: #0a1e3c; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer;">💾 Guardar Cambios</button>
                    <button id="cancelar-edicion" class="btn-secondary" style="background: rgba(255,215,0,0.15); border: 1px solid rgba(255,215,0,0.3); color: #ffd700; padding: 10px 20px; border-radius: 8px; cursor: pointer;">Cancelar</button>
                </div>
                
                <hr style="margin: 20px 0; border-color: rgba(255,215,0,0.2);">
                
                <h4 style="color: #ffd700;">📝 Pronósticos de ${participanteNombre}</h4>
                <div id="pronosticos-lista" style="max-height: 300px; overflow-y: auto;">
                    Cargando pronósticos...
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Cargar pronósticos del participante
    await cargarPronosticosParticipante(grupoId, participanteNombre);
    
    // Eventos
    document.getElementById('guardar-edicion').addEventListener('click', async () => {
        const nuevoNombre = document.getElementById('edit-nombre').value.trim();
        const nuevoTelefono = document.getElementById('edit-telefono').value.trim();
        
        if (!nuevoNombre) {
            mostrarMensaje('El nombre no puede estar vacío', 'error');
            return;
        }
        
        if (nuevoNombre !== participanteNombre) {
            await renombrarParticipante(grupoId, participanteNombre, nuevoNombre);
        }
        
        await actualizarTelefonoParticipante(grupoId, nuevoNombre, nuevoTelefono);
        
        mostrarMensaje('✅ Datos actualizados correctamente', 'success');
        document.getElementById('modal-editar-participante').remove();
        
        await cargarParticipantesDelGrupoEnPanel(grupoId);
    });
    
    document.getElementById('cancelar-edicion').addEventListener('click', () => {
        document.getElementById('modal-editar-participante').remove();
    });
}

async function cargarPronosticosParticipante(grupoId, participanteNombre) {
    const container = document.getElementById('pronosticos-lista');
    if (!container) return;
    
    try {
        // ← CAMBIO CLAVE: usar getGrupo() directo a Firebase, no getGrupos() del caché
        const grupo = await getGrupo(grupoId);
        
        if (!grupo || !grupo.apuestas || !grupo.apuestas[participanteNombre]) {
            container.innerHTML = '<p style="color: #888;">No hay pronósticos para este participante</p>';
            return;
        }
        
        const pronosticos = grupo.apuestas[participanteNombre];
        const partidosMap = {};
        todosLosPartidosData.forEach(p => { partidosMap[p.id] = p; });
        
        if (Object.keys(pronosticos).length === 0) {
            container.innerHTML = '<p style="color: #888;">No hay pronósticos para este participante</p>';
            return;
        }
        
        let html = '<table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">';
        html += '<thead><tr style="background: rgba(255,215,0,0.1);"><th style="padding: 8px;">Partido</th><th>Pronóstico</th><th>Acción</th></tr></thead><tbody>';
        
        for (const [partidoId, apuestasRaw] of Object.entries(pronosticos)) {
            const partido = partidosMap[parseInt(partidoId)];
            if (!partido) continue;
            
            // Normalizar objeto Firebase {0:{...}} a array
            let apuestasArray = [];
            if (Array.isArray(apuestasRaw)) {
                apuestasArray = apuestasRaw;
            } else if (typeof apuestasRaw === 'object' && apuestasRaw !== null) {
                apuestasArray = Object.values(apuestasRaw);
            }
            
            for (const apuesta of apuestasArray) {
                const esEmpate = apuesta.esEmpate === true;
                const pronosticoTexto = esEmpate 
                    ? '🤝 EMPATE (X)' 
                    : `${apuesta.local}-${apuesta.visitante}`;
                const partidoTexto = `${partido.local} vs ${partido.visitante}`;
                const fechaCorta = partido.fecha ? partido.fecha.slice(5) : '';
                
                html += `
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <td style="padding: 8px;">
                            ${partidoTexto}
                            <span style="font-size:0.7rem; color:rgba(255,255,255,0.4); margin-left:5px;">${fechaCorta}</span>
                        </td>
                        <td style="padding: 8px; text-align: center; font-weight: bold; color: #ffd700;">
                            ${pronosticoTexto}
                        </td>
                        <td style="padding: 8px;">
                            <button onclick="window.eliminarPronostico('${grupoId}', '${participanteNombre}', ${partidoId}, '${apuesta.id}')" 
                                    style="background: rgba(244,67,54,0.2); border: 1px solid #f44336; color: #f44336; padding: 4px 10px; border-radius: 5px; cursor: pointer;">
                                🗑️
                            </button>
                        </td>
                    </tr>
                `;
            }
        }
        
        html += '</tbody></table>';
        container.innerHTML = html;
        
        // Contar total real
        let totalReal = 0;
        for (const apuestasRaw of Object.values(pronosticos)) {
            if (Array.isArray(apuestasRaw)) totalReal += apuestasRaw.length;
            else if (typeof apuestasRaw === 'object') totalReal += Object.values(apuestasRaw).length;
        }
        
        container.innerHTML += `
            <div style="margin-top:10px; padding:8px; background:rgba(255,215,0,0.08); border-radius:8px; text-align:center; font-size:0.8rem; color:rgba(255,255,255,0.6);">
                📊 Total pronósticos encontrados en Firebase: <strong style="color:#ffd700;">${totalReal}</strong>
            </div>
            <div style="margin-top: 15px; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                <button id="limpiar-duplicados" style="background: rgba(255,152,0,0.2); border: 1px solid #ff9800; color: #ff9800; padding: 8px 16px; border-radius: 8px; cursor: pointer;">
                    🔧 Limpiar duplicados
                </button>
                <button id="eliminar-todos-pronosticos" style="background: rgba(244,67,54,0.2); border: 1px solid #f44336; color: #f44336; padding: 8px 16px; border-radius: 8px; cursor: pointer;">
                    🗑️ Eliminar TODOS los pronósticos de ${participanteNombre}
                </button>
            </div>
        `;
        
        document.getElementById('limpiar-duplicados')?.addEventListener('click', () => {
            if (confirm(`🔧 ¿Limpiar duplicados de ${participanteNombre}?`)) {
                window.limpiarPronosticosDuplicados(grupoId, participanteNombre);
            }
        });
        
        document.getElementById('eliminar-todos-pronosticos')?.addEventListener('click', () => {
            if (confirm(`⚠️ ¿Eliminar TODOS los pronósticos de ${participanteNombre}?`)) {
                eliminarTodosPronosticos(grupoId, participanteNombre);
            }
        });
        
    } catch (error) {
        console.error('Error cargando pronósticos:', error);
        container.innerHTML = '<p style="color: #f44336;">Error al cargar pronósticos: ' + error.message + '</p>';
    }
}

window.eliminarPronostico = async (grupoId, participanteNombre, partidoId, apuestaId) => {
    if (!confirm(`¿Eliminar este pronóstico?`)) return;
    
    try {
        // Leer fresco de Firebase
        const grupo = await getGrupo(grupoId);
        const grupos = await getGrupos();
        
        if (grupo?.apuestas?.[participanteNombre]?.[partidoId]) {
            const apuestasRaw = grupo.apuestas[participanteNombre][partidoId];
            
            // Normalizar a array
            let apuestasArray = Array.isArray(apuestasRaw) 
                ? apuestasRaw 
                : Object.values(apuestasRaw);
            
            // Filtrar la apuesta eliminada
            apuestasArray = apuestasArray.filter(a => a.id !== apuestaId);
            
            // Actualizar en el objeto de grupos
            if (!grupos[grupoId]) grupos[grupoId] = grupo;
            
            if (apuestasArray.length === 0) {
                delete grupos[grupoId].apuestas[participanteNombre][partidoId];
            } else {
                // Guardar como objeto indexado
                const comoObjeto = {};
                apuestasArray.forEach((a, i) => { comoObjeto[i] = a; });
                grupos[grupoId].apuestas[participanteNombre][partidoId] = comoObjeto;
            }
            
            await guardarGrupos(grupos);
            mostrarMensaje('✅ Pronóstico eliminado', 'success');
            await cargarPronosticosParticipante(grupoId, participanteNombre);
            await cargarParticipantesDelGrupoEnPanel(grupoId);
            actualizarEstadisticas();
        }
    } catch (error) {
        mostrarMensaje('Error: ' + error.message, 'error');
    }
};

async function eliminarTodosPronosticos(grupoId, participanteNombre) {
    try {
        const grupos = await getGrupos();
        const grupo = grupos[grupoId];
        
        if (grupo && grupo.apuestas) {
            delete grupo.apuestas[participanteNombre];
            await guardarGrupos(grupos);
            mostrarMensaje(`✅ Todos los pronósticos de ${participanteNombre} han sido eliminados`, 'success');
            
            document.getElementById('modal-editar-participante')?.remove();
            await cargarParticipantesDelGrupoEnPanel(grupoId);
            actualizarEstadisticas();
        }
    } catch (error) {
        mostrarMensaje('Error al eliminar: ' + error.message, 'error');
    }
}

async function renombrarParticipante(grupoId, nombreActual, nuevoNombre) {
    const grupos = await getGrupos();
    const grupo = grupos[grupoId];
    
    if (!grupo) return false;
    
    if (grupo.apuestas && grupo.apuestas[nombreActual]) {
        grupo.apuestas[nuevoNombre] = grupo.apuestas[nombreActual];
        delete grupo.apuestas[nombreActual];
    }
    
    const index = grupo.participantes.indexOf(nombreActual);
    if (index !== -1) {
        grupo.participantes[index] = nuevoNombre;
    }
    
    if (grupo.participantesInfo && grupo.participantesInfo[nombreActual]) {
        grupo.participantesInfo[nuevoNombre] = grupo.participantesInfo[nombreActual];
        delete grupo.participantesInfo[nombreActual];
    }
    
    await guardarGrupos(grupos);
    return true;
}

async function actualizarTelefonoParticipante(grupoId, participanteNombre, telefono) {
    const grupos = await getGrupos();
    const grupo = grupos[grupoId];
    
    if (!grupo) return false;
    
    if (!grupo.participantesInfo) {
        grupo.participantesInfo = {};
    }
    
    if (!grupo.participantesInfo[participanteNombre]) {
        grupo.participantesInfo[participanteNombre] = {};
    }
    
    grupo.participantesInfo[participanteNombre].telefono = telefono;
    await guardarGrupos(grupos);
    return true;
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
                mostrarMensaje(`✅ Límite de ${participante} actualizado a ${nuevoLimite} pronóstico(s)`, 'success');
            } else {
                mostrarMensaje(`❌ Error al actualizar límite de ${participante}`, 'error');
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
            mostrarMensaje('🔄 Sincronizando con la nube...', 'info');
            await sincronizarLocalAFirebase();
            mostrarMensaje('✅ Datos sincronizados correctamente', 'success');
        });
    }
    
    if (forceBtn) {
        forceBtn.addEventListener('click', async () => {
            mostrarMensaje('📥 Cargando datos desde la nube...', 'info');
            const cargados = await cargarFirebaseALocal();
            if (cargados) {
                mostrarMensaje('✅ Datos cargados desde la nube. Recargando...', 'success');
                setTimeout(() => location.reload(), 1500);
            } else {
                mostrarMensaje('❌ No hay datos en la nube', 'error');
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

function mostrarMensaje(msg, tipo) {
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

// AGREGAR estas funciones nuevas:
async function cargarPozoEnPanel(grupoId) {
    const grupos = await getGrupos();
    const grupo = grupos[grupoId];
    if (!grupo) return;

    const pozo = grupo.pozo || { monto: 0, mensaje: '' };
    document.getElementById('pozo-monto').value = pozo.monto || 0;
    document.getElementById('pozo-mensaje').value = pozo.mensaje || '';

    const pozoActual = document.getElementById('pozo-actual');
    const pozoMontoDisplay = document.getElementById('pozo-monto-display');
    const pozoMensajeDisplay = document.getElementById('pozo-mensaje-display');

    pozoActual.style.display = 'block';
    pozoMontoDisplay.textContent = pozo.monto || 0;
    pozoMensajeDisplay.textContent = pozo.mensaje || '';
}

async function guardarPozo() {
    const grupoId = document.getElementById('grupo-pozo-select').value;
    if (!grupoId) {
        mostrarMensaje('Seleccioná un grupo', 'error');
        return;
    }

    const monto = parseInt(document.getElementById('pozo-monto').value) || 0;
    const mensaje = document.getElementById('pozo-mensaje').value.trim();

    const grupos = await getGrupos();
    if (grupos[grupoId]) {
        grupos[grupoId].pozo = { monto, mensaje, actualizado: new Date().toISOString() };
        await guardarGrupos(grupos);
        mostrarMensaje(`✅ Pozo actualizado: Bs. ${monto}`, 'success');

        // Actualizar display
        document.getElementById('pozo-actual').style.display = 'block';
        document.getElementById('pozo-monto-display').textContent = monto;
        document.getElementById('pozo-mensaje-display').textContent = mensaje;
    }
}



// Inicializar
setTimeout(() => {
    if (document.getElementById('admin-content')?.style.display !== 'none') {
        init();
    }
}, 100);

// ============ LIMPIAR PRONÓSTICOS DUPLICADOS (VERSIÓN MEJORADA) ============
window.limpiarPronosticosDuplicados = async (grupoId, participanteNombre) => {
    if (!confirm(`⚠️ ¿Limpiar TODOS los pronósticos duplicados de ${participanteNombre}? Se mantendrá SOLO UN pronóstico por partido.`)) return;
    
    try {
        const grupos = await getGrupos();
        const grupo = grupos[grupoId];
        
        if (!grupo || !grupo.apuestas || !grupo.apuestas[participanteNombre]) {
            mostrarMensaje('No hay pronósticos para este participante', 'error');
            return;
        }
        
        const pronosticos = grupo.apuestas[participanteNombre];
        const pronosticosLimpios = {};
        let eliminados = 0;
        let partidosConDuplicados = [];
        
        // Mostrar qué pronósticos existían antes
        console.log('Pronósticos ANTES:', pronosticos);
        
        // Para cada partido, mantener SOLO el primer pronóstico (o el más reciente)
        for (const [partidoId, apuesta] of Object.entries(pronosticos)) {
            if (!pronosticosLimpios[partidoId]) {
                // Si no tenemos ningún pronóstico para este partido, lo guardamos
                pronosticosLimpios[partidoId] = apuesta;
            } else {
                // Ya existe un pronóstico para este partido, este es duplicado
                eliminados++;
                if (!partidosConDuplicados.includes(partidoId)) {
                    partidosConDuplicados.push(partidoId);
                }
                console.log(`Eliminando duplicado para partido ${partidoId}: ${apuesta.local}-${apuesta.visitante}`);
            }
        }
        
        if (eliminados === 0) {
            mostrarMensaje(`✅ ${participanteNombre} no tiene pronósticos duplicados`, 'success');
            return;
        }
        
        // Reemplazar con los pronósticos limpios
        grupo.apuestas[participanteNombre] = pronosticosLimpios;
        await guardarGrupos(grupos);
        
        mostrarMensaje(`✅ Eliminados ${eliminados} pronóstico(s) duplicado(s) de ${participanteNombre} (${partidosConDuplicados.length} partido(s) afectados)`, 'success');
        
        // Recargar el modal para mostrar los cambios
        await cargarPronosticosParticipante(grupoId, participanteNombre);
        await cargarParticipantesDelGrupoEnPanel(grupoId);
        actualizarEstadisticas();
        
        const nuevosPronosticos = Object.keys(pronosticosLimpios).length;
        mostrarMensaje(`📊 ${participanteNombre} ahora tiene ${nuevosPronosticos} pronóstico(s) único(s)`, 'info');
        
    } catch (error) {
        console.error('Error al limpiar:', error);
        mostrarMensaje('Error al limpiar: ' + error.message, 'error');
    }
};

// ============ REFERENCIA DE IDs DE PARTIDOS ============

window.mostrarReferenciaPartidos = function() {
    const existente = document.getElementById('modal-referencia-partidos');
    if (existente) { existente.remove(); return; }

    const grupos = ['A','B','C','D','E','F','G','H','I','J','K','L'];
    
    let tabsHtml = grupos.map(g => 
        `<button onclick="filtrarGrupoRef('${g}')" 
            id="tab-ref-${g}"
            style="padding:6px 14px; border-radius:20px; border:1px solid rgba(255,215,0,0.3); 
                   background:rgba(255,215,0,0.1); color:#ffd700; cursor:pointer; font-size:0.8rem;">
            Grupo ${g}
        </button>`
    ).join('');

    tabsHtml += `
        <button onclick="filtrarGrupoRef('octavos')" id="tab-ref-octavos"
            style="padding:6px 14px; border-radius:20px; border:1px solid rgba(100,200,255,0.3); 
                   background:rgba(100,200,255,0.1); color:#64c8ff; cursor:pointer; font-size:0.8rem;">
            Octavos
        </button>
        <button onclick="filtrarGrupoRef('cuartos')" id="tab-ref-cuartos"
            style="padding:6px 14px; border-radius:20px; border:1px solid rgba(100,200,255,0.3); 
                   background:rgba(100,200,255,0.1); color:#64c8ff; cursor:pointer; font-size:0.8rem;">
            Cuartos
        </button>
        <button onclick="filtrarGrupoRef('semis')" id="tab-ref-semis"
            style="padding:6px 14px; border-radius:20px; border:1px solid rgba(100,200,255,0.3); 
                   background:rgba(100,200,255,0.1); color:#64c8ff; cursor:pointer; font-size:0.8rem;">
            Semis + Final
        </button>
    `;

    const modal = document.createElement('div');
    modal.id = 'modal-referencia-partidos';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.92); z-index: 99999;
        display: flex; align-items: flex-start; justify-content: center;
        overflow-y: auto; padding: 20px;
    `;

    modal.innerHTML = `
        <div style="background: #0d1b35; border-radius: 16px; max-width: 900px; width: 100%; 
                    padding: 24px; border: 1px solid rgba(255,215,0,0.3); margin: auto;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                <h3 style="color:#ffd700; margin:0;">🗺️ Mapa de IDs de Partidos — Mundial 2026</h3>
                <button onclick="document.getElementById('modal-referencia-partidos').remove()"
                    style="background:rgba(255,255,255,0.1); border:none; color:white; 
                           width:32px; height:32px; border-radius:50%; cursor:pointer; font-size:1.1rem;">✕</button>
            </div>
            <p style="color:rgba(255,255,255,0.5); font-size:0.8rem; margin-bottom:16px;">
                Usá este mapa cuando trabajés directamente en Firebase para saber a qué partido corresponde cada ID.
            </p>

            <!-- Filtros por grupo -->
            <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:20px;">
                <button onclick="filtrarGrupoRef('todos')" id="tab-ref-todos"
                    style="padding:6px 14px; border-radius:20px; border:1px solid #ffd700; 
                           background:rgba(255,215,0,0.2); color:#ffd700; cursor:pointer; font-size:0.8rem; font-weight:bold;">
                    Todos
                </button>
                ${tabsHtml}
            </div>

            <!-- Tabla -->
            <div id="tabla-referencia-partidos" style="overflow-x:auto;"></div>

            <!-- Búsqueda por ID -->
            <div style="margin-top:20px; display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
                <input type="number" id="buscar-id-partido" placeholder="Buscar por ID (ej: 15)"
                    style="padding:8px 14px; background:rgba(0,0,0,0.5); border:1px solid rgba(255,215,0,0.3); 
                           border-radius:8px; color:white; width:180px;">
                <button onclick="buscarPartidoPorId()"
                    style="padding:8px 16px; background:rgba(255,215,0,0.2); border:1px solid #ffd700; 
                           color:#ffd700; border-radius:8px; cursor:pointer;">
                    🔍 Buscar
                </button>
                <span id="resultado-busqueda" style="color:#ffd700; font-size:0.9rem;"></span>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

    // Mostrar todos al abrir
    filtrarGrupoRef('todos');
};

window.filtrarGrupoRef = function(filtro) {
    const container = document.getElementById('tabla-referencia-partidos');
    if (!container) return;

    let partidos = todosLosPartidosData;

    if (filtro === 'todos') {
        partidos = todosLosPartidosData;
    } else if (['octavos','cuartos'].includes(filtro)) {
        partidos = todosLosPartidosData.filter(p => p.fase === filtro);
    } else if (filtro === 'semis') {
        partidos = todosLosPartidosData.filter(p => ['semis','final','tercer'].includes(p.fase));
    } else {
        // Es un grupo (A-L)
        partidos = todosLosPartidosData.filter(p => p.grupo === filtro);
    }

    if (partidos.length === 0) {
        container.innerHTML = '<p style="color:#888; text-align:center; padding:20px;">No hay partidos para este filtro</p>';
        return;
    }

    const faseColores = {
        'grupos':  { bg: 'rgba(255,215,0,0.08)',  border: 'rgba(255,215,0,0.2)',  label: '🟡' },
        'octavos': { bg: 'rgba(100,200,255,0.08)', border: 'rgba(100,200,255,0.2)', label: '🔵' },
        'cuartos': { bg: 'rgba(150,255,150,0.08)', border: 'rgba(150,255,150,0.2)', label: '🟢' },
        'semis':   { bg: 'rgba(255,150,50,0.08)',  border: 'rgba(255,150,50,0.2)',  label: '🟠' },
        'final':   { bg: 'rgba(255,80,80,0.08)',   border: 'rgba(255,80,80,0.2)',   label: '🔴' },
        'tercer':  { bg: 'rgba(180,180,180,0.08)', border: 'rgba(180,180,180,0.2)', label: '⚪' },
    };

    let html = `
        <table style="width:100%; border-collapse:collapse; font-size:0.85rem;">
            <thead>
                <tr style="background:rgba(255,215,0,0.15);">
                    <th style="padding:10px 8px; color:#ffd700; text-align:center; width:60px;">ID Firebase</th>
                    <th style="padding:10px 8px; color:#ffd700;">Local</th>
                    <th style="padding:10px 8px; color:#ffd700; text-align:center;">-</th>
                    <th style="padding:10px 8px; color:#ffd700;">Visitante</th>
                    <th style="padding:10px 8px; color:#ffd700; text-align:center;">Fecha</th>
                    <th style="padding:10px 8px; color:#ffd700; text-align:center;">Hora (BOL)</th>
                    <th style="padding:10px 8px; color:#ffd700; text-align:center;">Fase</th>
                    ${filtro === 'todos' ? '<th style="padding:10px 8px; color:#ffd700; text-align:center;">Grupo</th>' : ''}
                </tr>
            </thead>
            <tbody>
    `;

    partidos.forEach(p => {
        const c = faseColores[p.fase] || faseColores['grupos'];
        html += `
            <tr style="background:${c.bg}; border-bottom:1px solid ${c.border}; transition:background 0.2s;"
                onmouseover="this.style.background='rgba(255,215,0,0.12)'"
                onmouseout="this.style.background='${c.bg}'">
                <td style="padding:8px; text-align:center;">
                    <span style="background:rgba(255,215,0,0.2); border:1px solid #ffd700; 
                                 border-radius:6px; padding:3px 10px; font-weight:bold; color:#ffd700; font-size:0.9rem;">
                        ${p.id}
                    </span>
                </td>
                <td style="padding:8px; font-weight:500; color:white;">${p.local}</td>
                <td style="padding:8px; text-align:center; color:rgba(255,255,255,0.4);">vs</td>
                <td style="padding:8px; font-weight:500; color:white;">${p.visitante}</td>
                <td style="padding:8px; text-align:center; color:rgba(255,255,255,0.6); font-size:0.8rem;">
                    ${formatearFechaCorta(p.fecha)}
                </td>
                <td style="padding:8px; text-align:center; color:rgba(255,255,255,0.6); font-size:0.8rem;">
                    ${p.hora}
                </td>
                <td style="padding:8px; text-align:center; font-size:0.75rem;">
                    ${c.label} ${getFaseNombre(p.fase)}
                    ${p.grupo ? `<span style="font-size:0.7rem; color:rgba(255,255,255,0.4);"> Gr.${p.grupo}</span>` : ''}
                </td>
                ${filtro === 'todos' ? `<td style="padding:8px; text-align:center; color:rgba(255,255,255,0.5);">${p.grupo || '—'}</td>` : ''}
            </tr>
        `;
    });

    html += `</tbody></table>
        <div style="text-align:right; margin-top:8px; color:rgba(255,255,255,0.3); font-size:0.75rem;">
            ${partidos.length} partido(s) mostrado(s)
        </div>`;

    container.innerHTML = html;
};

window.buscarPartidoPorId = function() {
    const idBuscado = parseInt(document.getElementById('buscar-id-partido').value);
    const resultado = document.getElementById('resultado-busqueda');
    
    if (isNaN(idBuscado)) {
        resultado.textContent = '❌ Ingresá un número válido';
        return;
    }

    const partido = todosLosPartidosData.find(p => p.id === idBuscado);
    
    if (partido) {
        resultado.innerHTML = `
            ✅ ID <strong>${idBuscado}</strong>: 
            <span style="color:white;">${partido.local} vs ${partido.visitante}</span> — 
            ${formatearFechaCorta(partido.fecha)} ${partido.hora} — 
            <span style="color:#aaa;">${getFaseNombre(partido.fase)}${partido.grupo ? ` Gr.${partido.grupo}` : ''}</span>
        `;
    } else {
        resultado.textContent = `❌ No existe ningún partido con ID ${idBuscado}`;
    }
};

function formatearFechaCorta(fecha) {
    const [y, m, d] = fecha.split('-');
    const meses = ['','Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return `${d} ${meses[parseInt(m)]}`;
}