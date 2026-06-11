// src/firebase.js - Conexión con Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getFirestore, doc, setDoc, getDoc, getDocs, collection, updateDoc, arrayUnion, arrayRemove, query, where, deleteDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDUvg4anoICh5_cXqcrp3D3ljid06COkkM",
  authDomain: "quiniela-mundial-2026-b02eb.firebaseapp.com",
  projectId: "quiniela-mundial-2026-b02eb",
  storageBucket: "quiniela-mundial-2026-b02eb.firebasestorage.app",
  messagingSenderId: "490180467242",
  appId: "1:490180467242:web:84f19878a66605446e4153",
  measurementId: "G-P0WF5N56DL"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log('✅ Firebase conectado correctamente');

// ============ FUNCIONES PARA GRUPOS ============

// Guardar un grupo en Firebase
export async function guardarGrupoEnFirebase(grupoId, grupoData) {
    try {
        const grupoRef = doc(db, 'grupos', grupoId);
        await setDoc(grupoRef, grupoData);
        console.log(`✅ Grupo ${grupoId} guardado en Firebase`);
        return true;
    } catch (error) {
        console.error('Error al guardar en Firebase:', error);
        return false;
    }
}

// Obtener un grupo de Firebase
export async function obtenerGrupoDeFirebase(grupoId) {
    try {
        const grupoRef = doc(db, 'grupos', grupoId);
        const docSnap = await getDoc(grupoRef);
        if (docSnap.exists()) {
            return docSnap.data();
        }
        return null;
    } catch (error) {
        console.error('Error al obtener de Firebase:', error);
        return null;
    }
}

// Obtener todos los grupos de Firebase
export async function obtenerTodosLosGruposDeFirebase() {
    try {
        const gruposRef = collection(db, 'grupos');
        const querySnapshot = await getDocs(gruposRef);
        const grupos = {};
        querySnapshot.forEach(doc => {
            grupos[doc.id] = doc.data();
        });
        return grupos;
    } catch (error) {
        console.error('Error al obtener grupos de Firebase:', error);
        return {};
    }
}

// Eliminar un grupo de Firebase
export async function eliminarGrupoDeFirebase(grupoId) {
    try {
        const grupoRef = doc(db, 'grupos', grupoId);
        await deleteDoc(grupoRef);
        console.log(`✅ Grupo ${grupoId} eliminado de Firebase`);
        return true;
    } catch (error) {
        console.error('Error al eliminar grupo de Firebase:', error);
        return false;
    }
}

// ============ FUNCIONES PARA PARTICIPANTES ============

// Registrar un participante en un grupo
export async function registrarParticipanteEnFirebase(grupoId, nombre, telefono = '') {
    try {
        const grupoRef = doc(db, 'grupos', grupoId);
        const grupoActual = await getDoc(grupoRef);
        
        let grupoData = {};
        if (grupoActual.exists()) {
            grupoData = grupoActual.data();
        }
        
        if (!grupoData.participantes) grupoData.participantes = [];
        if (!grupoData.participantesInfo) grupoData.participantesInfo = {};
        
        const nombreNormalizado = nombre.trim();
        const existe = grupoData.participantes.some(p => p.toLowerCase() === nombreNormalizado.toLowerCase());
        
        if (existe) {
            return { success: false, message: 'Ya estás registrado en este grupo' };
        }
        
        grupoData.participantes.push(nombreNormalizado);
        grupoData.participantesInfo[nombreNormalizado] = {
            telefono: telefono,
            fechaRegistro: new Date().toISOString()
        };
        
        await setDoc(grupoRef, grupoData);
        return { success: true, message: `¡Bienvenido ${nombreNormalizado}!` };
    } catch (error) {
        console.error('Error al registrar en Firebase:', error);
        return { success: false, message: 'Error de conexión' };
    }
}

// Eliminar participante de un grupo en Firebase
export async function eliminarParticipanteDeFirebase(grupoId, nombre) {
    try {
        const grupoRef = doc(db, 'grupos', grupoId);
        const grupoActual = await getDoc(grupoRef);
        
        if (!grupoActual.exists()) {
            return false;
        }
        
        const grupoData = grupoActual.data();
        const index = grupoData.participantes.findIndex(p => p.toLowerCase() === nombre.toLowerCase());
        
        if (index !== -1) {
            grupoData.participantes.splice(index, 1);
            if (grupoData.participantesInfo?.[nombre]) {
                delete grupoData.participantesInfo[nombre];
            }
            if (grupoData.apuestas?.[nombre]) {
                delete grupoData.apuestas[nombre];
            }
            await setDoc(grupoRef, grupoData);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error al eliminar participante de Firebase:', error);
        return false;
    }
}

// ============ FUNCIONES PARA APUESTAS ============

// Agregar una apuesta en Firebase
export async function agregarApuestaEnFirebase(grupoId, participante, partidoId, apuesta) {
    try {
        const grupoRef = doc(db, 'grupos', grupoId);
        const grupoActual = await getDoc(grupoRef);
        
        if (!grupoActual.exists()) {
            return false;
        }
        
        const grupoData = grupoActual.data();
        
        if (!grupoData.apuestas) grupoData.apuestas = {};
        if (!grupoData.apuestas[participante]) grupoData.apuestas[participante] = {};
        if (!grupoData.apuestas[participante][partidoId]) grupoData.apuestas[participante][partidoId] = [];
        
        const apuestaId = Date.now() + '-' + Math.random().toString(36).substr(2, 8);
        
        grupoData.apuestas[participante][partidoId].push({
            id: apuestaId,
            local: apuesta.local,
            visitante: apuesta.visitante,
            fecha: new Date().toISOString()
        });
        
        await setDoc(grupoRef, grupoData);
        return apuestaId;
    } catch (error) {
        console.error('Error al agregar apuesta en Firebase:', error);
        return false;
    }
}

// Eliminar una apuesta en Firebase
export async function eliminarApuestaEnFirebase(grupoId, participante, partidoId, apuestaId) {
    try {
        const grupoRef = doc(db, 'grupos', grupoId);
        const grupoActual = await getDoc(grupoRef);
        
        if (!grupoActual.exists()) {
            return false;
        }
        
        const grupoData = grupoActual.data();
        const apuestasPartido = grupoData.apuestas?.[participante]?.[partidoId];
        
        if (apuestasPartido && Array.isArray(apuestasPartido)) {
            const index = apuestasPartido.findIndex(a => a.id === apuestaId);
            if (index !== -1) {
                apuestasPartido.splice(index, 1);
                if (apuestasPartido.length === 0) {
                    delete grupoData.apuestas[participante][partidoId];
                }
                await setDoc(grupoRef, grupoData);
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error('Error al eliminar apuesta en Firebase:', error);
        return false;
    }
}

// ============ FUNCIONES PARA RESULTADOS ============

// Guardar resultado en Firebase
export async function guardarResultadoEnFirebase(grupoId, partidoId, resultado) {
    try {
        const grupoRef = doc(db, 'grupos', grupoId);
        const grupoActual = await getDoc(grupoRef);
        
        let grupoData = {};
        if (grupoActual.exists()) {
            grupoData = grupoActual.data();
        }
        
        if (!grupoData.resultados) grupoData.resultados = {};
        grupoData.resultados[partidoId] = resultado;
        
        await setDoc(grupoRef, grupoData);
        return true;
    } catch (error) {
        console.error('Error al guardar resultado en Firebase:', error);
        return false;
    }
}

// ============ FUNCIONES PARA REGLAS Y PREMIOS ============

// Actualizar reglas de un grupo en Firebase
export async function actualizarReglasEnFirebase(grupoId, nuevasReglas) {
    try {
        const grupoRef = doc(db, 'grupos', grupoId);
        const grupoActual = await getDoc(grupoRef);
        
        if (!grupoActual.exists()) {
            return false;
        }
        
        const grupoData = grupoActual.data();
        grupoData.reglas = {
            ...grupoData.reglas,
            ...nuevasReglas
        };
        
        await setDoc(grupoRef, grupoData);
        return true;
    } catch (error) {
        console.error('Error al actualizar reglas en Firebase:', error);
        return false;
    }
}

// Actualizar premios de un grupo en Firebase
export async function actualizarPremiosEnFirebase(grupoId, nuevosPremios) {
    try {
        const grupoRef = doc(db, 'grupos', grupoId);
        const grupoActual = await getDoc(grupoRef);
        
        if (!grupoActual.exists()) {
            return false;
        }
        
        const grupoData = grupoActual.data();
        grupoData.premios = {
            ...grupoData.premios,
            ...nuevosPremios
        };
        
        await setDoc(grupoRef, grupoData);
        return true;
    } catch (error) {
        console.error('Error al actualizar premios en Firebase:', error);
        return false;
    }
}

// ============ SINCRONIZACIÓN ============

// Sincronizar datos locales con Firebase (subir)
export async function sincronizarLocalAFirebase() {
    const gruposLocales = localStorage.getItem('quiniela_grupos');
    if (gruposLocales) {
        const grupos = JSON.parse(gruposLocales);
        for (const [id, data] of Object.entries(grupos)) {
            await guardarGrupoEnFirebase(id, data);
        }
        console.log('✅ Datos locales sincronizados con Firebase');
        return true;
    }
    return false;
}

// Cargar datos desde Firebase a localStorage (descargar)
export async function cargarFirebaseALocal() {
    try {
        const gruposFirebase = await obtenerTodosLosGruposDeFirebase();
        if (Object.keys(gruposFirebase).length > 0) {
            localStorage.setItem('quiniela_grupos', JSON.stringify(gruposFirebase));
            console.log('✅ Datos cargados desde Firebase a localStorage');
            window.dispatchEvent(new Event('grupos-actualizados'));
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error al cargar desde Firebase:', error);
        return false;
    }
}

// Sincronización bidireccional
export async function sincronizarConFirebase() {
    // Primero cargar desde Firebase
    const cargados = await cargarFirebaseALocal();
    // Luego subir locales (para asegurar que todo esté actualizado)
    await sincronizarLocalAFirebase();
    return cargados;
}

// Escuchar cambios en tiempo real (Firestore)
export function escucharCambiosEnGrupos(callback) {
    const gruposRef = collection(db, 'grupos');
    const unsubscribe = onSnapshot(gruposRef, (snapshot) => {
        const grupos = {};
        snapshot.forEach(doc => {
            grupos[doc.id] = doc.data();
        });
        localStorage.setItem('quiniela_grupos', JSON.stringify(grupos));
        callback(grupos);
        console.log('🔄 Cambios detectados en Firebase, actualizando...');
    });
    return unsubscribe;
}