# 📊 WorkTracker & Expense Manager

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)

**WorkTracker & Expense Manager** es una aplicación web SPA (*Single Page Application*) ligera, intuitiva y reactiva, diseñada para optimizar el registro diario de asistencia laboral y el control de gastos operativos en tiempo real. 

El proyecto demuestra la integración de una interfaz moderna basada en **Vanilla JavaScript** con un backend Serverless mediante **Firebase Realtime Database**.

---

## 🚀 Características Principales

* **Control de Asistencia en Tiempo Real:** Marcación directa de entradas y salidas diarias con marca temporal exacta (`ISO` y `timeStr`).
* **Gestión de Gastos Operativos:** Registro de egresos detallando concepto y monto monetario.
* **Módulos de Vista Separados:**
  * **Vista del Día (Hoy):** Muestra de forma limpia únicamente las marcas y gastos del día en curso.
  * **Historial Centralizado:** Panel histórico con filtrado interactivo por mes y por usuario.
* **Cálculo Automático de Métricas:** Tarjetas dinámicas que resumen el total de horas trabajadas y dinero gastado por persona durante el mes activo.
* **Operaciones CRUD:** Edición y eliminación de registros mediante modales nativos de HTML5 (`<dialog>`).

---

## 🛠️ Stack Tecnológico

* **Frontend:** Vanilla JavaScript (ES6+ Modules), HTML5 semántico, CSS3 (Variables, Flexbox, CSS Grid).
* **Backend & Persistence:** Firebase Realtime Database v10 (SDK JavaScript modular).
* **Arquitectura:** Manejo del estado en memoria, manipulación del DOM nativa y delegación de eventos.

---

## 🔄 Manejo de Datos en la Demo (Mock Data Seeding)

Para facilitar la evaluación interactiva sin requerir autenticación previa ni presentar una base de datos vacía, la aplicación incluye una lógica de **Auto-Seeding**:

* Al iniciar la aplicación, si el nodo activo de la base de datos se encuentra vacío, la app detecta la falta de registros e inyecta automáticamente un conjunto de datos ficticios (`js/mockData.js`) adaptados al mes corriente.
* Todas las acciones posteriores (nuevas marcas, ediciones o borrados) sincronizan en tiempo real sobre la base de datos de pruebas (`registros_demo`), asegurando una experiencia completa de prueba sin alterar entornos de producción.

---

## 🔮 Roadmap / Próximas Mejoras (v2.0)

Aunque esta versión enfoca su diseño en la velocidad de prueba e interacción directa, la arquitectura está preparada para escalar con las siguientes características:

- [ ] **Autenticación de Usuarios:** Integración con *Firebase Authentication* (Email/Password y proveedores OAuth como Google).
- [ ] **Control de Acceso Basado en Roles (RBAC):** Restricción de acceso al panel de edición e historial para usuarios con rol de Administrador.
- [ ] **Exportación de Datos:** Descarga de reportes mensuales consolidando horas y gastos en formato PDF / Excel.
- [ ] **Filtros Avanzados:** Búsqueda por rango de fechas personalizadas.

---

## 💻 Instalación Local

1. **Clonar el repositorio:**
   ```bash
   git clone [https://github.com/tu-usuario/worktracker-expense-manager.git](https://github.com/tu-usuario/worktracker-expense-manager.git)
   cd worktracker-expense-manager