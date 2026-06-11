// src/admin.js - Solo gestión de grupos y resultados
import { 
    getGrupos, 
    crearGrupo, 
    eliminarGrupo,
    getParticipantesDelGrupo,
    getInfoParticipante,
    guardarResultadoEnGrupo,
    getResultadosDelGrupo
} from './groups.js';
import { todosLosPartidos, conBandera, getFaseNombre } from './data.js';

let currentGrupoId = '';

function init() {
    cargarListaGrupos();
    cargarSelectores();
    setupEventListeners();
}

function cargarSelectores() {
    const grupos = getGrupos();
    const selectores = ['grupo-participantes-select', 'grupo-resultados-select'];
    
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
        container.innerHTML = '<p>No hay grupos creados</p>';
        return;
    }
    
    let html = '';
    for (const [id, grupo] of Object.entries(grupos)) {
        html += `
            <div class="grupo-card">
                <h3>🏆 ${grupo.nombre}</h3>
                <p><strong>ID:</strong> ${id}</p>
                <p><strong>👥 Participantes:</strong> ${grupo.participantes.length}</p>
                <button class="btn-eliminar-grupo" data-id="${id}">🗑️ Eliminar</button>
            </div>
        `;
    }
    container.innerHTML = html;
    
    document.querySelectorAll('.btn-eliminar-grupo').forEach(btn => {
        btn.addEventListener('click', () => {
            if (confirm('¿Eliminar este grupo?')) {
                eliminarGrupo(btn.dataset.id);
                cargarListaGrupos();
                cargarSelectores();
            }
        });
    });
}

function setupEventListeners() {
    document.getElementById('crear-grupo-btn')?.addEventListener('click', () => {
        const id = document.getElementById('nuevo-grupo-id').value.trim();
        const nombre = document.getElementById('nuevo-grupo-nombre').value.trim();
        const contrasena = document.getElementById('nuevo-grupo-contrasena').value;
        
        if (!id || !nombre || !contrasena) {
            alert('Completa todos los campos');
            return;
        }
        
        try {
            crearGrupo(id, { nombre, contrasena });
            alert('Grupo creado');
            document.getElementById('nuevo-grupo-id').value = '';
            document.getElementById('nuevo-grupo-nombre').value = '';
            document.getElementById('nuevo-grupo-contrasena').value = '';
            cargarListaGrupos();
            cargarSelectores();
        } catch(e) {
            alert(e.message);
        }
    });
    
    document.getElementById('grupo-participantes-select')?.addEventListener('change', (e) => {
        const grupoId = e.target.value;
        if (grupoId) {
            const participantes = getParticipantesDelGrupo(grupoId);
            const container = document.getElementById('participantes-lista');
            
            if (participantes.length === 0) {
                container.innerHTML = '<p>No hay participantes registrados</p>';
            } else {
                let html = '<div class="participantes-lista">';
                participantes.forEach(p => {
                    const info = getInfoParticipante(grupoId, p);
                    html += `<div class="participante-item">
                        <span>👤 ${p}</span>
                        <span>📞 ${info.telefono || 'Sin teléfono'}</span>
                        <span>📅 ${new Date(info.fechaRegistro).toLocaleDateString()}</span>
                    </div>`;
                });
                html += '</div>';
                container.innerHTML = html;
            }
        }
    });
    
    document.getElementById('grupo-resultados-select')?.addEventListener('change', (e) => {
        currentGrupoId = e.target.value;
        if (currentGrupoId) {
            cargarResultados();
        }
    });
    
    document.getElementById('guardar-resultados')?.addEventListener('click', () => {
        const cards = document.querySelectorAll('.resultado-card');
        const resultados = {};
        
        cards.forEach(card => {
            const id = parseInt(card.dataset.id);
            const local = parseInt(card.querySelector('.resultado-local').value);
            const visitante = parseInt(card.querySelector('.resultado-visitante').value);
            if (!isNaN(local) && !isNaN(visitante)) {
                resultados[id] = { local, visitante };
            }
        });
        
        for (const [id, resultado] of Object.entries(resultados)) {
            guardarResultadoEnGrupo(currentGrupoId, parseInt(id), resultado);
        }
        alert('Resultados guardados');
    });
}

function cargarResultados() {
    const resultados = getResultadosDelGrupo(currentGrupoId);
    const container = document.getElementById('resultados-container');
    
    container.innerHTML = todosLosPartidos.map(partido => {
        const resultado = resultados[partido.id];
        return `
            <div class="apuesta-card resultado-card" data-id="${partido.id}">
                <div class="match-info">
                    <div class="match-teams">${conBandera(partido.local)} vs ${conBandera(partido.visitante)}</div>
                    <div class="match-date">📅 ${partido.fecha} | ${getFaseNombre(partido.fase)}</div>
                </div>
                <div class="score-inputs">
                    <input type="number" class="resultado-local" placeholder="0" value="${resultado?.local || ''}">
                    <span>-</span>
                    <input type="number" class="resultado-visitante" placeholder="0" value="${resultado?.visitante || ''}">
                </div>
            </div>
        `;
    }).join('');
}

init();