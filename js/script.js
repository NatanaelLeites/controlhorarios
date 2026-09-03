import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push, onValue, update, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
// Importamos la configuración desde nuestro archivo independiente
import { firebaseConfig } from "./config.js";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const dbRef = ref(db, 'registros');

// --- CONTROLES DE INTERFAZ (Tabs virtuales) ---
const mainWorkspace = document.getElementById('mainWorkspace');
const adminWorkspace = document.getElementById('adminWorkspace');
const btnToggleAdmin = document.getElementById('btnToggleAdmin');
const btnBackToMain = document.getElementById('btnBackToMain');

const monthFilter = document.getElementById('monthFilter');
const userFilter = document.getElementById('userFilter');

let cachedSnapshotData = null;

// Seteamos el mes actual por defecto
const d = new Date();
monthFilter.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

// Eventos para cambiar de pantalla
btnToggleAdmin.onclick = () => {
    mainWorkspace.classList.add('hidden');
    adminWorkspace.classList.remove('hidden');
};
btnBackToMain.onclick = () => {
    adminWorkspace.classList.add('hidden');
    mainWorkspace.classList.remove('hidden');
};

// --- MANEJO DE MODALES (Edición y Borrado) ---
const deleteModal = document.getElementById('deleteModal');
const editModal = document.getElementById('editModal');
const editDetailInput = document.getElementById('editDetailInput');

let targetRecordId = null;

// Modal de Borrado
window.borrarRegistro = (id) => {
    targetRecordId = id;
    deleteModal.showModal();
};

document.getElementById('btnCancelDelete').onclick = () => {
    deleteModal.close();
    targetRecordId = null;
};

document.getElementById('btnConfirmDelete').onclick = () => {
    if (targetRecordId) {
        remove(ref(db, `registros/${targetRecordId}`));
        deleteModal.close();
        targetRecordId = null;
    }
};

// Modal de Edición
window.editarDetalle = (id, valorActual) => {
    targetRecordId = id;
    editDetailInput.value = valorActual;
    editModal.showModal();
};

document.getElementById('btnCancelEdit').onclick = () => {
    editModal.close();
    targetRecordId = null;
};

document.getElementById('btnSaveEdit').onclick = () => {
    const nuevoDetalle = editDetailInput.value.trim();
    if (targetRecordId && nuevoDetalle !== "") {
        update(ref(db, `registros/${targetRecordId}`), { detail: nuevoDetalle });
        editModal.close();
        targetRecordId = null;
    }
};

// --- LÓGICA DE GUARDADO ---
const saveEntry = (type, detail) => {
    const user = document.getElementById('userSelect').value;
    const now = new Date();

    const newEntry = {
        user: user,
        type: type,
        detail: detail,
        timestamp: now.toISOString(),
        dateStr: now.toLocaleDateString(),
        fullTime: now.getTime()
    };

    push(dbRef, newEntry);
};

// --- RENDERS DE TABLAS Y FILTROS ---
const procesarYRenderizarTodo = (data) => {
    const historyBody = document.getElementById('historyBody');
    const adminHistoryBody = document.getElementById('adminHistoryBody');

    const ahora = new Date();
    const todayStr = ahora.toLocaleDateString();
    const mesActualStr = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`;

    // Reset de totales para el mes en curso (Tarjeta principal)
    const totalesMesActual = {
        "Diego": { horas: 0, gastos: 0, ultimaEntrada: null },
        "Nata": { horas: 0, gastos: 0, ultimaEntrada: null }
    };

    if (!data) {
        historyBody.innerHTML = "<tr><td colspan='4'>No hay datos.</td></tr>";
        adminHistoryBody.innerHTML = "<tr><td colspan='5'>No hay datos archivados.</td></tr>";
        return;
    }

    // Convertimos a array con IDs
    const todosLosRegistros = Object.entries(data)
        .map(([id, val]) => ({ id, ...val }))
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // --- PROCESAMIENTO A: Tarjetas del Mes Corriente ---
    todosLosRegistros.forEach(reg => {
        const u = reg.user;
        if (!totalesMesActual[u]) return;

        const mesReg = reg.timestamp ? reg.timestamp.substring(0, 7) : '';
        if (mesReg === mesActualStr) {
            if (reg.type === "Entrada") {
                totalesMesActual[u].ultimaEntrada = new Date(reg.timestamp);
            }
            else if (reg.type === "Salida" && totalesMesActual[u].ultimaEntrada) {
                const salida = new Date(reg.timestamp);
                const diffMs = salida - totalesMesActual[u].ultimaEntrada;
                totalesMesActual[u].horas += diffMs / (1000 * 60 * 60);
                totalesMesActual[u].ultimaEntrada = null;
            }
            else if (reg.type === "Gasto") {
                const monto = parseFloat((reg.detail || '').split('$')[1]) || 0;
                totalesMesActual[u].gastos += monto;
            }
        }
    });

    for (const user in totalesMesActual) {
        const div = document.getElementById(`stats-${user}`);
        if (div) {
            div.innerText = `Horas: ${totalesMesActual[user].horas.toFixed(2)}h | $: ${totalesMesActual[user].gastos.toFixed(2)}`;
        }
    }

    // --- PROCESAMIENTO B: Tabla de "Hoy" ---
    const entradasDeHoy = todosLosRegistros
        .filter(item => item.dateStr === todayStr)
        .reverse();

    if (entradasDeHoy.length === 0) {
        historyBody.innerHTML = "<tr><td colspan='4'>No hay actividad hoy.</td></tr>";
    } else {
        historyBody.innerHTML = entradasDeHoy.map(item => `
            <tr>
                <td>${item.user}</td>
                <td>${item.type}</td>
                <td>${item.detail}</td>
                <td>${new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
            </tr>
        `).join('');
    }

    // --- PROCESAMIENTO C: Historial Avanzado con Filtros ---
    const filtroMesSeleccionado = monthFilter.value;
    const filtroUsuarioSeleccionado = userFilter.value;

    const registrosHistorialFiltrados = todosLosRegistros
        .filter(reg => {
            const mesReg = reg.timestamp ? reg.timestamp.substring(0, 7) : '';
            const cumpleMes = mesReg === filtroMesSeleccionado;
            const cumpleUser = (filtroUsuarioSeleccionado === "Todos") ? true : reg.user === filtroUsuarioSeleccionado;
            return cumpleMes && cumpleUser;
        })
        .reverse();

    if (registrosHistorialFiltrados.length === 0) {
        adminHistoryBody.innerHTML = "<tr><td colspan='5'>No se encontraron registros para este mes o usuario.</td></tr>";
    } else {
        adminHistoryBody.innerHTML = registrosHistorialFiltrados.map(reg => `
            <tr>
                <td>${reg.dateStr}</td>
                <td>${reg.user}</td>
                <td><span class="badge ${(reg.type || '').toLowerCase()}">${reg.type}</span></td>
                <td>${reg.detail}</td>
                <td style="text-align: center;">
                    <button class="action-btn" onclick="editarDetalle('${reg.id}', '${reg.detail}')">✏️</button>
                    <button class="action-btn" onclick="borrarRegistro('${reg.id}')">🗑️</button>
                </td>
            </tr>
        `).join('');
    }
};

// --- ESCUCHADORES DE EVENTOS REALTIME ---
onValue(dbRef, (snapshot) => {
    const data = snapshot.val();
    cachedSnapshotData = data;
    procesarYRenderizarTodo(data);
});

[monthFilter, userFilter].forEach(element => {
    element.addEventListener('change', () => {
        if (cachedSnapshotData) {
            procesarYRenderizarTodo(cachedSnapshotData);
        }
    });
});

document.getElementById('btnIn').onclick = () => saveEntry('Entrada', 'Presencial');
document.getElementById('btnOut').onclick = () => saveEntry('Salida', 'Fin de jornada');

document.getElementById('expenseForm').onsubmit = (e) => {
    e.preventDefault();
    const concept = document.getElementById('expConcept').value;
    const amount = document.getElementById('expAmount').value;
    saveEntry('Gasto', `${concept}: $${amount}`);
    e.target.reset();
};