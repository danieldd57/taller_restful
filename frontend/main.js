const API_URL = "http://localhost:3000";

// ---------- LOGIN ----------
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (res.ok) {
    localStorage.setItem("token", data.token);
    window.location.href = "dashboard.html";
  } else {
    alert(data.message);
  }
}

// ---------- REGISTRO ----------
async function register() {
  const nombre = document.getElementById("nombre").value;
  const email = document.getElementById("emailReg").value;
  const password = document.getElementById("passwordReg").value;

  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, email, password }),
  });

  const data = await res.json();
  if (res.ok) {
    alert("Usuario registrado. Ahora puedes iniciar sesión.");
  } else {
    alert(data.message);
  }
}

async function loadAccounts() {
    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "index.html";
        return;
    }

    const container = document.getElementById("accounts");
    const createSection = document.getElementById("create-account-section");

    container.innerHTML = `<p>Cargando cuentas...</p>`; 
    createSection.style.display = "none";

    let res;
    try {
        res = await fetch(`${API_URL}/accounts`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
            if (res.status === 401 || res.status === 403) {
                alert("Sesión expirada o no autorizada. Por favor, inicia sesión de nuevo.");
                logout(); 
                return;
            }
            let errorData;
            try {
                errorData = await res.json();
            } catch (e) {
                container.innerHTML = `<p style="color:red;">Error del servidor: ${res.status}. El token puede ser inválido o la API no está funcionando.</p>`;
                return;
            }
            
            container.innerHTML = `<p style="color:red;">Error al cargar cuentas: ${errorData.message || res.statusText}</p>`;
            return;
        }

    } catch (error) {
        container.innerHTML = `<p style="color:red;">Error de conexión: Asegúrate de que el servidor (${API_URL}) esté activo.</p>`;
        console.error('Error de conexión:', error);
        return;
    }

    const data = await res.json(); 
    container.innerHTML = "";

    if (data.length > 0) {
        // Si hay cuentas, mostrarlas
        data.forEach(acc => {
            const div = document.createElement("div");
            div.className = "account-card";
            div.innerHTML = `
                <h3>${acc.nombre}</h3>
                <p>Saldo: $${acc.saldo}</p>
                <button onclick="selectAccount('${acc._id}', '${acc.nombre}')">Ver transacciones</button>
            `;
            container.appendChild(div);
        });
    } else {
        // Si no hay cuentas, mostrar el mensaje y la sección de crear
        container.innerHTML = `<p>No tienes cuentas. Crea una nueva para empezar.</p>`;
        createSection.style.display = "block";
    }
}
// Crear nueva cuenta
async function createAccount() {
  const token = localStorage.getItem("token");
  const nombre = document.getElementById("nombreCuenta").value;

  if (!nombre) {
      alert("Por favor, ingresa un nombre para la cuenta.");
      return;
  }

  const res = await fetch(`${API_URL}/accounts`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ nombre }),
  });

  const data = await res.json();
  if (res.ok) {
    alert("Cuenta creada con éxito");
    document.getElementById("nombreCuenta").value = ""; // Limpiar input
    loadAccounts();
  } else {
    alert(data.message);
  }
}

// Seleccionar cuenta y pasar a transacciones
function selectAccount(accountId, accountName) {
  localStorage.setItem("selectedAccount", accountId);
  localStorage.setItem("selectedAccountName", accountName);
  window.location.href = "transactions.html";
}

// ---------- TRANSACCIONES ----------
async function loadTransactions() {
  const token = localStorage.getItem("token");
  const accountId = localStorage.getItem("selectedAccount");
  const accountName = localStorage.getItem("selectedAccountName");

  // Redirigir si no hay cuenta seleccionada o token
  if (!token) {
    window.location.href = "index.html";
    return;
  }
  if (!accountId) {
    window.location.href = "dashboard.html";
    return;
  }

  document.getElementById("accountName").innerText = `Cuenta: ${accountName}`;

  const res = await fetch(`${API_URL}/accounts/${accountId}/transactions`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  const container = document.getElementById("transactions");
  container.innerHTML = "";

  if (res.ok && data.length > 0) {
    data.forEach(tr => {
      const div = document.createElement("div");
      div.className = "transaction-card";
      // Formatear la fecha
      const formattedDate = new Date(tr.fecha).toLocaleString('es-ES', { 
          year: 'numeric', month: 'numeric', day: 'numeric', 
          hour: '2-digit', minute: '2-digit' 
      });
      div.innerHTML = `
        <p><strong>${tr.tipo}</strong>: $${tr.monto} - ${tr.descripcion} - <small>${formattedDate}</small></p>
      `;
      container.appendChild(div);
    });
  } else {
    container.innerHTML = `<p>No hay transacciones aún.</p>`;
  }
}

// Agregar transacción
async function addTransaction() {
  const token = localStorage.getItem("token");
  const accountId = localStorage.getItem("selectedAccount");
  const tipo = document.getElementById("tipo").value;
  const monto = parseFloat(document.getElementById("monto").value);
  const descripcion = document.getElementById("descripcion").value;

  if (isNaN(monto) || monto <= 0 || !descripcion) {
      alert("Por favor, ingresa un monto válido y una descripción.");
      return;
  }

  const res = await fetch(`${API_URL}/accounts/${accountId}/transactions`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ tipo, monto, descripcion }),
  });

  const data = await res.json();
  if (res.ok) {
    alert("Transacción agregada");
    document.getElementById("monto").value = "";
    document.getElementById("descripcion").value = "";
    loadTransactions();
  } else {
    alert(data.message);
  }
}

// ---------- LOGOUT ----------
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("selectedAccount");
  localStorage.removeItem("selectedAccountName");
  window.location.href = "index.html";
}

// ---------- INIT - Lógica de enrutamiento inicial ----------
// Se llama a esta función al final para ejecutar la lógica inicial
function initApp() {
    const path = window.location.pathname;
    
    // Proteger las rutas que requieren autenticación
    if (path.includes("dashboard.html") || path.includes("transactions.html")) {
        const token = localStorage.getItem("token");
        if (!token) {
            // Si no hay token, redirigir al login y detener la ejecución
            window.location.href = "index.html";
            return;
        }
    }

    if (path.includes("dashboard.html")) {
        loadAccounts();
    } else if (path.includes("transactions.html")) {
        loadTransactions();
    } else if (path.includes("index.html") && localStorage.getItem("token")) {
        // Si ya hay token y está en el login, redirigir al dashboard
        window.location.href = "dashboard.html";
    }
}

initApp();