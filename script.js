// Simple local Login (development)
function login() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const error = document.getElementById("error");

    if (!username || !password) {
        error.textContent = "Please Fill All Fields";
        return;
    }

    // ====== Fixed Dev Credentials ======
    const DEV_USERNAME = "whjwjqkqk1k";
    const DEV_PASSWORD = "wegotblacklist";

    if (username === DEV_USERNAME && password === DEV_PASSWORD) {
        const user = {
            username: DEV_USERNAME,
            rank: "Chief Of Staff" // initial rank for testing; change later if needed
        };
        localStorage.setItem("loggedUser", JSON.stringify(user));
        window.location.href = "dashboard.html";
    } else {
        error.textContent = "Invalid Username Or Password";
    }
}
