// src/ranking.js - Ranking diario y acumulado por grupos (con Firebase)
import { 
    getGrupos, 
    getRankingDelGrupo,
    getRankingDelGrupoPorDia,   
    getReglasDelGrupo,
    getPremiosDelGrupo,
    getApuestasMultiplesDeParticipante, 
    getResultadosDelGrupo  
} from './groups.js';
import { getDiasCalendario, formatearFecha } from './data.js';

let grupos = {};
let currentGrupoId = '';
let currentTipoRanking = 'acumulado';
let currentFecha = '';

function init() {
    console.log('🏆 Ranking inicializado');
    cargarGrupos();
    setupEventListeners();
    
    window.addEventListener('grupos-actualizados', () => {
        if (currentGrupoId) {
            actualizarRanking();
        }
    });
}

async function cargarGrupos() {
    console.log('📋 Cargando grupos para ranking...');
    grupos = await getGrupos();
    const select = document.getElementById('grupo-select-ranking');
    if (!select) return;
    
    const gruposKeys = Object.keys(grupos);
    
    if (gruposKeys.length === 0) {
        select.innerHTML = '<option value="">⚠️ No hay grupos disponibles</option>';
        select.disabled = true;
        document.getElementById('ranking-table').innerHTML = '<div class="empty-ranking">🏆 No hay grupos creados. El administrador debe crear un grupo primero.</div>';
        return;
    }
    
    select.disabled = false;
    let options = '<option value="">🏆 Seleccioná un grupo...</option>';
    for (const [id, grupo] of Object.entries(grupos)) {
        const participantesCount = grupo.participantes.length;
        options += `<option value="${id}">${grupo.nombre} (${participantesCount} participantes)</option>`;
    }
    select.innerHTML = options;
    
    const ultimoGrupo = localStorage.getItem('ultimo_grupo_ranking');
    if (ultimoGrupo && grupos[ultimoGrupo]) {
        select.value = ultimoGrupo;
        currentGrupoId = ultimoGrupo;
        await cargarRankingDelGrupo(currentGrupoId);
    }
    
    select.addEventListener('change', async (e) => {
        currentGrupoId = e.target.value;
        if (currentGrupoId) {
            localStorage.setItem('ultimo_grupo_ranking', currentGrupoId);
            await cargarRankingDelGrupo(currentGrupoId);
        } else {
            ocultarRanking();
        }
    });
}

function ocultarRanking() {
    document.getElementById('grupo-info-panel').style.display = 'none';
    document.getElementById('tipo-ranking-selector').style.display = 'none';
    document.getElementById('dia-selector-container').style.display = 'none';
    document.getElementById('podium-container').style.display = 'none';
    document.getElementById('premios-info').style.display = 'none';
    document.getElementById('ranking-table').innerHTML = '<div class="empty-ranking">🏆 Seleccioná un grupo para ver su ranking</div>';
    document.getElementById('exportar-csv').style.display = 'none';
}

async function cargarRankingDelGrupo(grupoId) {
    const grupo = grupos[grupoId];
    if (!grupo) return;
    
    document.getElementById('grupo-info-panel').style.display = 'flex';
    document.getElementById('tipo-ranking-selector').style.display = 'flex';
    document.getElementById('premios-info').style.display = 'block';
    document.getElementById('exportar-csv').style.display = 'block';
    
    document.getElementById('grupo-nombre-display').innerHTML = `🏆 ${grupo.nombre}`;
    document.getElementById('grupo-participantes-display').innerHTML = `👥 ${grupo.participantes.length} participantes`;
    
    const reglas = await getReglasDelGrupo(grupoId);
    document.getElementById('grupo-reglas-display').innerHTML = `📜 ${reglas.puntosExacto} pts exacto / ${reglas.puntosGanador} pts ganador / ${reglas.puntosEmpate || 2} pts empate`;
    
    await cargarDiasDisponibles();
    await actualizarRanking();
}

async function cargarDiasDisponibles() {
    const dias = getDiasCalendario();
    const select = document.getElementById('dia-select-ranking');
    if (!select) return;
    
    let options = '<option value="">-- Seleccionar día --</option>';
    dias.forEach(dia => {
        const fechaFormateada = formatearFecha(dia);
        options += `<option value="${dia}">${fechaFormateada}</option>`;
    });
    select.innerHTML = options;
    
    if (dias.length > 0 && !currentFecha) {
        select.value = dias[0];
        currentFecha = dias[0];
    }
    
    const newSelect = select.cloneNode(true);
    select.parentNode.replaceChild(newSelect, select);
    newSelect.addEventListener('change', async (e) => {
        currentFecha = e.target.value;
        if (currentFecha && currentTipoRanking === 'diario') {
            await actualizarRanking();
        }
    });
}

async function actualizarRanking() {
    if (!currentGrupoId) return;
    
    let ranking = [];
    
    if (currentTipoRanking === 'acumulado') {
        ranking = await getRankingDelGrupo(currentGrupoId);
        document.getElementById('dia-selector-container').style.display = 'none';
    } else {
        if (!currentFecha) {
            const dias = getDiasCalendario();
            if (dias.length > 0) currentFecha = dias[0];
        }
        ranking = await getRankingDelGrupoPorDia(currentGrupoId, currentFecha); // ← ahora usa la de groups.js
        document.getElementById('dia-selector-container').style.display = 'flex';
    }
    
    const premios = await getPremiosDelGrupo(currentGrupoId);
    const cantidadGanadores = premios.cantidadGanadores || 3;
    mostrarPodio(ranking, cantidadGanadores);
    
    await mostrarPremios(currentGrupoId);
    mostrarRanking(ranking, currentTipoRanking, currentFecha);
}


function mostrarPodio(ranking, cantidadGanadores) {
    const container = document.getElementById('podium-container');
    if (!container) return;
    
    const podio = ranking.slice(0, cantidadGanadores);
    
    if (podio.length === 0) {
        container.innerHTML = '<div class="empty-ranking" style="width:100%;">📊 Aún no hay participantes con puntaje</div>';
        container.style.display = 'flex';
        return;
    }
    
    const medallas = ['🥇', '🥈', '🥉'];
    const colores = ['podium-1', 'podium-2', 'podium-3'];
    
    let html = '';
    podio.forEach((participante, index) => {
        const medalla = medallas[index] || `#${index + 1}`;
        const colorClass = colores[index] || 'podium-1';
        html += `
                <div class="podium-item ${colorClass}">
                    <div class="podium-medal">${medalla}</div>
                    <div class="podium-name">${participante.nombre}</div>
                    <div class="podium-points">${participante.puntos} pts</div>
                    <div class="podium-stats">
                        ${index === 0 ? '🏆 LÍDER' : index === 1 ? '🥈 SUBCAMPEÓN' : '🥉 TERCER LUGAR'}
                    </div>
                    <!-- ← AGREGAR ESTE BOTÓN -->
                    <button 
                        class="btn-ver-historial-podio" 
                        onclick="verHistorialParticipante('${participante.nombre}')"
                        style="margin-top:8px; background:rgba(255,255,255,0.15); border:1px solid rgba(255,255,255,0.3); color:white; padding:5px 12px; border-radius:20px; cursor:pointer; font-size:0.75rem;">
                        📋 Ver pronósticos
                    </button>
                </div>
        `;
    });
    
    container.innerHTML = html;
    container.style.display = 'flex';
}

async function mostrarPremios(grupoId) {
    const container = document.getElementById('premios-info');
    if (!container) return;
    
    const grupo = grupos[grupoId];
    const premios = await getPremiosDelGrupo(grupoId);
    const cantidadGanadores = premios.cantidadGanadores || 3;
    
    let premiosHtml = '';
    if (cantidadGanadores >= 1) {
        premiosHtml += `<p>🥇 1er Puesto: <span>${premios.primero}%</span> del pozo</p>`;
    }
    if (cantidadGanadores >= 2) {
        premiosHtml += `<p>🥈 2do Puesto: <span>${premios.segundo}%</span> del pozo</p>`;
    }
    if (cantidadGanadores >= 3) {
        premiosHtml += `<p>🥉 3er Puesto: <span>${premios.tercero}%</span> del pozo</p>`;
    }
    
    container.innerHTML = `
        <h4>💰 PREMIOS DEL GRUPO: ${grupo.nombre}</h4>
        ${premiosHtml}
        <small>📌 ${cantidadGanadores} ganador(es) por ${currentTipoRanking === 'acumulado' ? 'torneo' : 'día'}</small>
    `;
}

function mostrarRanking(ranking, tipo, fecha) {
    const container = document.getElementById('ranking-table');
    if (!container) return;
    
    if (ranking.length === 0) {
        container.innerHTML = '<div class="empty-ranking">📊 Aún no hay participantes en este grupo</div>';
        return;
    }
    
    const titulo = tipo === 'acumulado' 
        ? '<h3 style="margin-bottom:15px;">🏆 RANKING ACUMULADO DEL TORNEO</h3>'
        : `<h3 style="margin-bottom:15px;">📅 RANKING DEL DÍA: ${formatearFecha(fecha)}</h3>`;
    
    const html = `
        ${titulo}
        <table class="ranking-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Participante</th>
                    <th>📞 Teléfono</th>
                    <th>🏆 Puntos</th>
                </tr>
            </thead>
            <tbody>
                ${ranking.map((p, index) => {
                    let medalla = '';
                    let claseTop = '';
                    if (index === 0) {
                        medalla = '🥇 ';
                        claseTop = 'top-1';
                    } else if (index === 1) {
                        medalla = '🥈 ';
                        claseTop = 'top-2';
                    } else if (index === 2) {
                        medalla = '🥉 ';
                        claseTop = 'top-3';
                    }
                    
                    return `
                        <tr class="${claseTop}">
                            <td><span class="posicion-medal">${medalla}${p.posicion}</span></td>
                            <td>
                                <strong>${p.nombre}</strong>
                                <!-- ← AGREGAR ESTE BOTÓN -->
                                <button 
                                    onclick="verHistorialParticipante('${p.nombre}')"
                                    style="margin-left:8px; background:rgba(255,215,0,0.2); border:1px solid rgba(255,215,0,0.4); color:#ffd700; padding:3px 8px; border-radius:12px; cursor:pointer; font-size:0.7rem;">
                                    📋
                                </button>
                            </td>
                            <td>${p.telefono || '—'}</td>
                            <td style="font-size:1.3rem; font-weight:800; color:#ffd700;">${p.puntos}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
    
    const totalParticipantes = ranking.length;
    const totalPuntos = ranking.reduce((sum, p) => sum + p.puntos, 0);
    const promedioGeneral = totalParticipantes > 0 ? (totalPuntos / totalParticipantes).toFixed(2) : 0;
    
    const resumen = document.createElement('div');
    resumen.style.cssText = 'margin-top:20px; padding:15px; background:rgba(0,0,0,0.3); border-radius:12px; text-align:center;';
    resumen.innerHTML = `
        <strong>📊 Resumen:</strong> ${totalParticipantes} participantes | 
        Total puntos: ${totalPuntos} | 
        Promedio: ${promedioGeneral} pts/participante
    `;
    container.appendChild(resumen);
}

function setupEventListeners() {
    const tipoBtns = document.querySelectorAll('.tipo-btn');
    tipoBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            tipoBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTipoRanking = btn.dataset.tipo;
            await actualizarRanking();
        });
    });
    
    const exportarBtn = document.getElementById('exportar-csv');
    if (exportarBtn) {
        exportarBtn.addEventListener('click', exportarCSV);
    }
}

async function exportarCSV() {
    if (!currentGrupoId) {
        mostrarToast('Seleccioná un grupo primero', 'error');
        return;
    }
    
    const grupo = grupos[currentGrupoId];
    let ranking = [];
    
    if (currentTipoRanking === 'acumulado') {
        ranking = await getRankingDelGrupo(currentGrupoId);
    } else {
        ranking = await getRankingDelGrupoPorDia(currentGrupoId, currentFecha);
    }
    
    const titulo = currentTipoRanking === 'acumulado' 
        ? `Ranking Acumulado - ${grupo.nombre}`
        : `Ranking ${formatearFecha(currentFecha)} - ${grupo.nombre}`;
    
    const headers = ['Posición', 'Participante', 'Teléfono', 'Puntos'];
    
    const rows = ranking.map((p) => [
        p.posicion,
        p.nombre,
        p.telefono || '',
        p.puntos
    ]);
    
    const csvContent = [
        [titulo],
        [],
        headers, 
        ...rows
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    const fechaStr = currentTipoRanking === 'acumulado' ? 'acumulado' : currentFecha;
    link.setAttribute('download', `ranking_${grupo.nombre}_${fechaStr}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    mostrarToast(`📎 Ranking exportado a CSV`, 'success');
}

function mostrarToast(msg, tipo) {
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
    setTimeout(() => toast.remove(), 3000);
}

window.verHistorialParticipante = async function(nombreParticipante) {
    const modal = document.getElementById('modal-historial-ranking');
    const contenido = document.getElementById('modal-historial-contenido');
    
    if (!modal || !contenido || !currentGrupoId) return;
    
    contenido.innerHTML = '<div style="text-align:center; padding:40px; color:white;">⏳ Cargando pronósticos...</div>';
    modal.style.display = 'block';
    
    // Obtener datos
    const todasApuestas = await getApuestasMultiplesDeParticipante(currentGrupoId, nombreParticipante);
    const resultados = await getResultadosDelGrupo(currentGrupoId);
    const reglas = await getReglasDelGrupo(currentGrupoId);
    
    // Filtrar partidos según tipo de ranking
    let partidosFiltrados = todosLosPartidos;
    if (currentTipoRanking === 'diario' && currentFecha) {
        partidosFiltrados = todosLosPartidos.filter(p => p.fecha === currentFecha);
    }
    
    // Solo mostrar partidos que ya tienen resultado
    const partidosConResultado = partidosFiltrados.filter(p => resultados[p.id]);
    
    if (partidosConResultado.length === 0) {
        contenido.innerHTML = `
            <h3 style="color:#ffd700; margin-bottom:20px;">📋 ${nombreParticipante}</h3>
            <div style="text-align:center; padding:40px; color:rgba(255,255,255,0.6);">
                📭 No hay partidos con resultado aún
            </div>
        `;
        return;
    }
    
    let totalPuntos = 0;
    let html = `
        <h3 style="color:#ffd700; margin-bottom:5px;">📋 Pronósticos de: ${nombreParticipante}</h3>
        <p style="color:rgba(255,255,255,0.5); font-size:0.8rem; margin-bottom:20px;">
            ${currentTipoRanking === 'diario' ? `📅 ${formatearFecha(currentFecha)}` : '🏆 Ranking Acumulado'}
        </p>
    `;
    
    for (const partido of partidosConResultado) {
        const apuestasDelPartido = todasApuestas[partido.id] || [];
        const resultado = resultados[partido.id];
        
        let puntosPartido = 0;
        let apuestasHtml = '';
        
        if (apuestasDelPartido.length === 0) {
            apuestasHtml = '<span style="color:rgba(255,255,255,0.4); font-size:0.8rem;">Sin pronóstico</span>';
        } else {
            apuestasDelPartido.forEach(apuesta => {
                let pts = 0;
                let claseColor = '#f44336';
                let icono = '❌';
                
                if (apuesta.esEmpate === true) {
                    if (resultado.local === resultado.visitante) {
                        pts = reglas.puntosEmpate || 2;
                        claseColor = '#ffc107';
                        icono = '🎯';
                    }
                    apuestasHtml += `
                        <div style="display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,0.08); border-radius:8px; padding:4px 10px; margin:3px;">
                            <span style="font-size:0.85rem;">🤝 EMPATE</span>
                            <span style="color:${claseColor}; font-weight:bold;">${icono} +${pts}pts</span>
                        </div>
                    `;
                } else {
                    if (apuesta.local === resultado.local && apuesta.visitante === resultado.visitante) {
                        pts = reglas.puntosExacto;
                        claseColor = '#4caf50';
                        icono = '✅';
                    } else if (
                        (apuesta.local > apuesta.visitante && resultado.local > resultado.visitante) ||
                        (apuesta.local < apuesta.visitante && resultado.local < resultado.visitante) ||
                        (apuesta.local === apuesta.visitante && resultado.local === resultado.visitante)
                    ) {
                        pts = reglas.puntosGanador;
                        claseColor = '#ffc107';
                        icono = '🎯';
                    }
                    apuestasHtml += `
                        <div style="display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,0.08); border-radius:8px; padding:4px 10px; margin:3px;">
                            <span style="font-size:0.85rem;">${apuesta.local} - ${apuesta.visitante}</span>
                            <span style="color:${claseColor}; font-weight:bold;">${icono} +${pts}pts</span>
                        </div>
                    `;
                }
                puntosPartido += pts;
            });
        }
        
        totalPuntos += puntosPartido;
        
        html += `
            <div style="background:rgba(0,0,0,0.3); border-radius:12px; padding:15px; margin-bottom:12px; border-left:3px solid rgba(255,215,0,0.3);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; flex-wrap:wrap; gap:8px;">
                    <div>
                        <span style="font-weight:bold; color:white;">⚽ ${partido.local} vs ${partido.visitante}</span>
                        <span style="color:rgba(255,255,255,0.4); font-size:0.75rem; margin-left:8px;">🕐 ${partido.hora}</span>
                    </div>
                    <div style="background:rgba(255,215,0,0.1); border:1px solid rgba(255,215,0,0.3); border-radius:8px; padding:3px 10px;">
                        <span style="color:rgba(255,255,255,0.6); font-size:0.75rem;">Resultado: </span>
                        <span style="color:#ffd700; font-weight:bold;">${resultado.local} - ${resultado.visitante}</span>
                    </div>
                </div>
                <div style="margin-top:8px;">
                    <span style="color:rgba(255,255,255,0.5); font-size:0.75rem; margin-right:6px;">Pronósticos:</span>
                    ${apuestasHtml}
                </div>
                ${puntosPartido > 0 ? `
                    <div style="text-align:right; margin-top:8px; font-size:0.8rem; color:#4caf50;">
                        +${puntosPartido} pts en este partido
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    // Resumen final
    html += `
        <div style="background:linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,100,0,0.1)); border-radius:16px; padding:15px; text-align:center; margin-top:15px; border:1px solid rgba(255,215,0,0.3);">
            <div style="color:rgba(255,255,255,0.7); font-size:0.8rem;">TOTAL DE PUNTOS</div>
            <div style="color:#ffd700; font-size:2.2rem; font-weight:bold;">${totalPuntos}</div>
        </div>
    `;
    
    contenido.innerHTML = html;
};


init();