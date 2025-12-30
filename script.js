/* ===============================
   Global App State
   =============================== */
const App = {
  api: "https://js-2-6f3k.onrender.com",
  user: null,

  loadUser() {
    const u = localStorage.getItem("user");
    this.user = u ? JSON.parse(u) : null;
    return this.user;
  },

  setUser(user) {
    this.user = user;
    localStorage.setItem("user", JSON.stringify(user));
  },

  clearUser() {
    this.user = null;
    localStorage.removeItem("user");
  }
};

/* ===============================
   Login Logic (index.html)
   =============================== */
async function login() {
  const username = document.getElementById("username")?.value.trim();
  const password = document.getElementById("password")?.value;
  const error = document.getElementById("error");

  if (!username || !password) {
    error.textContent = "Please enter username and password";
    return;
  }

  try {
    const res = await fetch(`${App.api}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!res.ok) {
      error.textContent = data.error || "Login failed";
      return;
    }

    App.setUser(data.user);
    window.location.href = "dashboard.html";

  } catch (e) {
    error.textContent = "API connection error";
  }
}

/* ===============================
   Logout
   =============================== */
function logout() {
  App.clearUser();
  window.location.href = "index.html";
}

