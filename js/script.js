import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push, onValue, update, remove, set } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { firebaseConfig } from "./config.js";
import { initialMockData } from "./mockData.js";

// --- INICIALIZACIÓN DE FIREBASE ---
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
// Apuntamos al nodo independiente para la Demo
const dbRef = ref(db, 'registros_demo');

// --- CONTROLES DE INTERFAZ ---
const mainWorkspace = document.getElementById('mainWorkspace');
const adminWorkspace = document.getElementById('adminWorkspace');
const btnToggleAdmin = document.getElementById('btnToggleAdmin');
const btnNavText = document.getElementById('btnNavText');
const btnNavIcon = document.getElementById('btnNavIcon');

const monthFilter = document.getElementById('monthFilter');
const userFilter = document.getElementById('userFilter');

// Modales
const deleteModal = document.getElementById('deleteModal');
const editModal = document.getElementById('editModal');
const editDetailInput = document.getElementById('editDetailInput');

let targetRecordId = null;
let cachedSnapshotData = null;

// Seteamos el mes actual por defecto en el filtro
const d = new Date();
monthFilter.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

// --- NAVEGACIÓN DINÁMICA ---
btnToggleAdmin.onclick = () => {
    const mostrandoAdmin = mainWorkspace.classList.contains('hidden');

    if (mostrandoAdmin) {
        adminWorkspace.classList.add('hidden');
        mainWorkspace.classList.remove('hidden');
        btnNavText.innerText = 'Ver Historial';
        btnNavIcon.innerText = '📊';
    } else {
        mainWorkspace.classList.add('hidden');
        adminWorkspace.classList.remove('hidden');
        btnNavText.innerText = 'Volver a Hoy';
        btnNavIcon.innerText = '🏠';
    }
};

// --- MANEJO DE MODALES (Edición y Borrado) ---

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
        remove(ref(db, `registros_demo/${targetRecordId}`));
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
        update(ref(db, `registros_demo/${targetRecordId}`), { detail: nuevoDetalle });
        editModal.close();
        targetRecordId = null;
    }
};

// --- LÓGICA DE GUARDADO ---
const saveEntry = (type, detail) => {
    const user = document.getElementById('userSelect').value;
    const now = new Date();

    // Formateamos la hora en formato 24h (ej. "14:35")
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newEntry = {
        user: user,
        type: type,
        detail: detail,
        timestamp: now.toISOString(),
        dateStr: now.toLocaleDateString(),
        timeStr: timeStr,
        fullTime: now.getTime()
    };

    push(dbRef, newEntry);
};

document.getElementById('btnIn').onclick = () => saveEntry('Entrada', 'Presencial');
document.getElementById('btnOut').onclick = () => saveEntry('Salida', 'Fin de jornada');

document.getElementById('expenseForm').onsubmit = (e) => {
    e.preventDefault();
    const concept = document.getElementById('expConcept').value;
    const amount = document.getElementById('expAmount').value;
    saveEntry('Gasto', `${concept}: $${amount}`);
    e.target.reset();
};

// --- RENDERS DE TABLAS Y FILTROS ---
const procesarYRenderizarTodo = (data) => {
    const historyBody = document.getElementById('historyBody');
    const adminHistoryBody = document.getElementById('adminHistoryBody');
    const statsGrid = document.getElementById('statsGrid');

    const ahora = new Date();
    const todayStr = ahora.toLocaleDateString();
    const mesActualStr = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`;

    // Obtener la lista de usuarios directamente de los <option> del selector
    const userSelect = document.getElementById('userSelect');
    const usuariosDisponibles = Array.from(userSelect.options).map(opt => opt.value);

    // Inicializar estructura de totales dinámicamente
    const totalesMesActual = {};
    usuariosDisponibles.forEach(u => {
        totalesMesActual[u] = { horas: 0, gastos: 0, ultimaEntrada: null };
    });

    if (!data) {
        historyBody.innerHTML = "<tr><td colspan='4'>No hay actividades registradas hoy.</td></tr>";
        adminHistoryBody.innerHTML = "<tr><td colspan='5'>No hay datos archivados.</td></tr>";
        statsGrid.innerHTML = usuariosDisponibles.map(u => `
            <div class="card stats-card">
                <h3>Resumen ${u} (Mes Actual)</h3>
                <div class="total">Horas: 0.00h | $: 0.00</div>
            </div>
        `).join('');
        return;
    }

    // Convertimos a array ordenado cronológicamente
    const todosLosRegistros = Object.entries(data)
        .map(([id, val]) => ({ id, ...val }))
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // --- PROCESAMIENTO A: Tarjetas de Resumen (Mes Corriente) ---
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

    // Renderizar tarjetas de resumen
    statsGrid.innerHTML = Object.entries(totalesMesActual).map(([u, datos]) => `
        <div class="card stats-card">
            <h3>Resumen ${u} (Mes Actual)</h3>
            <div class="total">Horas: ${datos.horas.toFixed(2)}h | $: ${datos.gastos.toFixed(2)}</div>
        </div>
    `).join('');

    // --- PROCESAMIENTO B: Tabla Principal (SOLO REGISTROS DE HOY CON HORA) ---
    const registrosDeHoy = todosLosRegistros
        .filter(reg => reg.dateStr === todayStr)
        .reverse();

    if (registrosDeHoy.length === 0) {
        historyBody.innerHTML = "<tr><td colspan='4'>No hay marcas o gastos registrados hoy.</td></tr>";
    } else {
        historyBody.innerHTML = registrosDeHoy.map(reg => {
            const hora = reg.timeStr || (reg.timestamp ? new Date(reg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--');
            return `
                <tr>
                    <td>${hora}</td>
                    <td>${reg.user}</td>
                    <td><span class="badge ${(reg.type || '').toLowerCase()}">${reg.type}</span></td>
                    <td>${reg.detail}</td>
                </tr>
            `;
        }).join('');
    }

    // --- PROCESAMIENTO C: Tabla Histórica (FECHA Y HORA CON FILTROS) ---
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
        adminHistoryBody.innerHTML = registrosHistorialFiltrados.map(reg => {
            const hora = reg.timeStr || (reg.timestamp ? new Date(reg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');
            const fechaHora = hora ? `${reg.dateStr} ${hora}` : reg.dateStr;

            return `
                <tr>
                    <td>${fechaHora}</td>
                    <td>${reg.user}</td>
                    <td><span class="badge ${(reg.type || '').toLowerCase()}">${reg.type}</span></td>
                    <td>${reg.detail}</td>
                    <td style="text-align: center;">
                        <button class="action-btn" onclick="editarDetalle('${reg.id}', '${reg.detail}')">✏️</button>
                        <button class="action-btn" onclick="borrarRegistro('${reg.id}')">🗑️</button>
                    </td>
                </tr>
            `;
        }).join('');
    }
};

// --- ESCUCHADORES EN TIEMPO REAL ---
onValue(dbRef, (snapshot) => {
    const data = snapshot.val();

    if (!data) {
        set(dbRef, initialMockData());
        return;
    }

    cachedSnapshotData = data;
    procesarYRenderizarTodo(data);
});

// Reactividad al cambiar los filtros de búsqueda
[monthFilter, userFilter].forEach(element => {
    element.addEventListener('change', () => {
        if (cachedSnapshotData) {
            procesarYRenderizarTodo(cachedSnapshotData);
        }
    });
});