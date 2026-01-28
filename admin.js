const form = document.getElementById("adminLoginForm");
const errorMsg = document.getElementById("errorMsg");
const loginBtn = document.getElementById("loginBtn");
const btnText = document.getElementById("btnText");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  errorMsg.classList.add("hidden");
  btnText.textContent = "Signing in...";

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Login failed");
    }

    // Save token
    localStorage.setItem("adminToken", data.token);

    // Redirect
    window.location.href = "admin-dashboard.html";

  } catch (error) {
    errorMsg.textContent = error.message;
    errorMsg.classList.remove("hidden");
  } finally {
    btnText.textContent = "Login";
  }
});

