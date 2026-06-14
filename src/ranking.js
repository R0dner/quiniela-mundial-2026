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
import { getDiasCalendario, formatearFecha, todosLosPartidos } from './data.js';

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

        const premios = await getPremiosDelGrupo(currentGrupoId);
        mostrarPodio(ranking, premios.cantidadGanadores || 3);
        await mostrarPremios(currentGrupoId);
        mostrarRanking(ranking, 'acumulado', currentFecha);

    } else {
        // Modo diario: ocultar podio, mostrar rankings por partido
        if (!currentFecha) {
            const dias = getDiasCalendario();
            if (dias.length > 0) currentFecha = dias[0];
        }
        document.getElementById('dia-selector-container').style.display = 'flex';

        // Ocultar podio en modo diario (no aplica por partido)
        const podioContainer = document.getElementById('podium-container');
        if (podioContainer) podioContainer.style.display = 'none';

        // Mostrar rankings por partido directamente
        mostrarRanking([], 'diario', currentFecha);
    }
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

    if (tipo === 'acumulado') {
        // Ranking acumulado: mostrar tabla normal
        if (ranking.length === 0) {
            container.innerHTML = '<div class="empty-ranking">📊 Aún no hay participantes en este grupo</div>';
            return;
        }

        const html = `
            <h3 style="margin-bottom:15px;">🏆 RANKING ACUMULADO DEL TORNEO</h3>
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
                        if (index === 0) { medalla = '🥇 '; claseTop = 'top-1'; }
                        else if (index === 1) { medalla = '🥈 '; claseTop = 'top-2'; }
                        else if (index === 2) { medalla = '🥉 '; claseTop = 'top-3'; }
                        return `
                            <tr class="${claseTop}">
                                <td><span class="posicion-medal">${medalla}${p.posicion}</span></td>
                                <td>
                                    <strong>${p.nombre}</strong>
                                    <button onclick="verHistorialParticipante('${p.nombre}')"
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

    } else {
        // Ranking por día: mostrar un ranking POR PARTIDO
        mostrarRankingPorPartidos(fecha, container);
    }
}

async function mostrarRankingPorPartidos(fecha, container) {
    if (!currentGrupoId || !fecha) return;

    container.innerHTML = `
        <div style="text-align:center; padding:20px; color:#ffd700;">
            ⏳ Cargando rankings por partido...
        </div>
    `;

    try {
        const { obtenerGrupoDeFirebase } = await import('./firebase.js'); // ← directo sin caché
        const grupo = await obtenerGrupoDeFirebase(currentGrupoId);
        
        if (!grupo) {
            container.innerHTML = '<div class="empty-ranking">❌ Error cargando datos</div>';
            return;
        }

        // Obtener partidos del día
        const { getPartidosPorDia, formatearFecha } = await import('./data.js');
        const partidosDelDia = getPartidosPorDia(fecha);

        if (partidosDelDia.length === 0) {
            container.innerHTML = '<div class="empty-ranking">📅 No hay partidos este día</div>';
            return;
        }

        const reglas = grupo.reglas || { puntosExacto: 3, puntosGanador: 1, puntosEmpate: 2 };
        const resultados = grupo.resultados || {};
        const apuestas = grupo.apuestas || {};

        let htmlTotal = `<h3 style="margin-bottom:20px;">📅 RANKINGS DEL DÍA: ${formatearFecha(fecha)}</h3>`;

        for (const partido of partidosDelDia) {
            const resultado = resultados[partido.id];

            // Recopilar todos los jugadores que apostaron en este partido
            const jugadoresConApuesta = [];

            for (const [nombreJugador, apuestasPorPartido] of Object.entries(apuestas)) {
                const apuestasRaw = apuestasPorPartido[partido.id];
                if (!apuestasRaw) continue;

                // Normalizar a array
                let apuestasArray = [];
                if (Array.isArray(apuestasRaw)) {
                    apuestasArray = apuestasRaw;
                } else if (typeof apuestasRaw === 'object') {
                    apuestasArray = Object.values(apuestasRaw);
                }

                if (apuestasArray.length === 0) continue;

                // Calcular puntos para este partido
                let puntosPartido = 0;
                const pronosticosTexto = [];

                for (const apuesta of apuestasArray) {
                    let pts = 0;
                    let estado = '';

                    if (resultado) {
                        if (apuesta.esEmpate === true) {
                            if (resultado.local === resultado.visitante) {
                                pts = reglas.puntosEmpate || 2;
                                estado = '✅';
                            } else {
                                estado = '❌';
                            }
                            pronosticosTexto.push(`🤝 X ${estado} +${pts}`);
                        } else {
                            if (apuesta.local === resultado.local && apuesta.visitante === resultado.visitante) {
                                pts = reglas.puntosExacto;
                                estado = '✅';
                            } else if (
                                (apuesta.local > apuesta.visitante && resultado.local > resultado.visitante) ||
                                (apuesta.local < apuesta.visitante && resultado.local < resultado.visitante) ||
                                (apuesta.local === apuesta.visitante && resultado.local === resultado.visitante)
                            ) {
                                pts = reglas.puntosGanador;
                                estado = '🎯';
                            } else {
                                estado = '❌';
                            }
                            pronosticosTexto.push(`${apuesta.local}-${apuesta.visitante} ${estado} +${pts}`);
                        }
                        puntosPartido += pts;
                    } else {
                        if (apuesta.esEmpate === true) {
                            pronosticosTexto.push('🤝 X ⏳');
                        } else {
                            pronosticosTexto.push(`${apuesta.local}-${apuesta.visitante} ⏳`);
                        }
                    }
                }

                jugadoresConApuesta.push({
                    nombre: nombreJugador,
                    puntos: puntosPartido,
                    pronosticos: pronosticosTexto,
                    telefono: grupo.participantesInfo?.[nombreJugador]?.telefono || ''
                });
            }

            // Ordenar por puntos
            jugadoresConApuesta.sort((a, b) => b.puntos - a.puntos);

            // Estado del resultado
            const resultadoTexto = resultado 
                ? `<span style="color:#4caf50; font-weight:bold;">✅ ${resultado.local} - ${resultado.visitante}</span>`
                : `<span style="color:#ffc107;">⏳ Sin resultado aún</span>`;

            // Construir tabla del partido
            let tablaHtml = '';
            if (jugadoresConApuesta.length === 0) {
                tablaHtml = `<p style="color:rgba(255,255,255,0.4); font-size:0.85rem; padding:10px; text-align:center;">
                    📭 Ningún jugador apostó en este partido
                </p>`;
            } else {
                tablaHtml = `
                    <table style="width:100%; border-collapse:collapse; font-size:0.85rem; margin-top:10px;">
                        <thead>
                            <tr style="background:rgba(255,215,0,0.1);">
                                <th style="padding:8px 10px; text-align:left; color:#ffd700;">#</th>
                                <th style="padding:8px 10px; text-align:left; color:#ffd700;">Jugador</th>
                                <th style="padding:8px 10px; text-align:center; color:#ffd700;">Pronóstico(s)</th>
                                <th style="padding:8px 10px; text-align:center; color:#ffd700;">Pts</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${jugadoresConApuesta.map((j, idx) => {
                                let medalla = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`;
                                let bgRow = idx === 0 ? 'rgba(255,215,0,0.08)' 
                                          : idx === 1 ? 'rgba(192,192,192,0.06)' 
                                          : idx === 2 ? 'rgba(205,127,50,0.06)' 
                                          : 'transparent';
                                return `
                                    <tr style="border-bottom:1px solid rgba(255,255,255,0.08); background:${bgRow};">
                                        <td style="padding:8px 10px; font-size:1rem;">${medalla}</td>
                                        <td style="padding:8px 10px;">
                                            <strong style="color:white;">${j.nombre}</strong>
                                            ${j.telefono ? `<br><span style="font-size:0.7rem; color:rgba(255,255,255,0.4);">📞 ${j.telefono}</span>` : ''}
                                        </td>
                                        <td style="padding:8px 10px; text-align:center;">
                                            ${j.pronosticos.map(p => 
                                                `<span style="display:inline-block; background:rgba(255,215,0,0.1); border:1px solid rgba(255,215,0,0.2); border-radius:20px; padding:2px 10px; margin:2px; font-size:0.8rem; color:#ffd700;">${p}</span>`
                                            ).join('')}
                                        </td>
                                        <td style="padding:8px 10px; text-align:center; font-size:1.2rem; font-weight:800; color:#ffd700;">${j.puntos}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                    <div style="text-align:right; font-size:0.75rem; color:rgba(255,255,255,0.4); margin-top:5px;">
                        ${jugadoresConApuesta.length} jugador(es) apostaron
                    </div>
                `;
            }

            htmlTotal += `
                <div style="background:rgba(0,0,0,0.3); border-radius:16px; padding:20px; margin-bottom:20px; border:1px solid rgba(255,215,0,0.15);">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:10px;">
                        <div>
                            <div style="font-size:1rem; font-weight:bold; color:#ffd700;">
                                ⚽ ${partido.local} vs ${partido.visitante}
                            </div>
                            <div style="font-size:0.75rem; color:rgba(255,255,255,0.5); margin-top:3px;">
                                🕐 ${partido.hora} | ID: ${partido.id}
                            </div>
                        </div>
                        <div style="text-align:right;">
                            <div style="font-size:0.75rem; color:rgba(255,255,255,0.5);">Resultado oficial:</div>
                            <div style="font-size:0.9rem;">${resultadoTexto}</div>
                        </div>
                    </div>
                    ${tablaHtml}
                </div>
            `;
        }

        container.innerHTML = htmlTotal;

    } catch (error) {
        console.error('Error cargando rankings por partido:', error);
        container.innerHTML = `<div class="empty-ranking">❌ Error: ${error.message}</div>`;
    }
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