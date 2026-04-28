/* global API */

const Auth = (() => {
  const TOKEN_KEY = "token";
  const USER_KEY = "user";

  function roleIsAdmin(role) {
    return String(role || "")
      .trim()
      .toLowerCase() === "admin";
  }

  function decodeJwtPayload(token) {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length < 2) return null;
    try {
      let b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const pad = b64.length % 4;
      if (pad) b64 += "=".repeat(4 - pad);
      const binary = atob(b64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const json = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
      return JSON.parse(json);
    } catch (_) {
      return null;
    }
  }

  function setSession({ token, user } = {}) {
    if (token != null && String(token).length > 0 && String(token) !== "undefined") {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
    if (user != null && typeof user === "object") {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  function getUser() {
    let stored = null;
    try {
      const raw = localStorage.getItem(USER_KEY);
      stored = raw ? JSON.parse(raw) : null;
    } catch (_) {
      stored = null;
    }

    const token = localStorage.getItem(TOKEN_KEY);
    const payload = decodeJwtPayload(token);
    if (!payload) return stored && typeof stored === "object" ? stored : null;

    const base = stored && typeof stored === "object" ? { ...stored } : {};
    let repaired = false;
    if (payload.sub && !base.id) {
      base.id = payload.sub;
      repaired = true;
    }
    if (payload.email && !base.email) {
      base.email = payload.email;
      repaired = true;
    }
    if (payload.role != null && payload.role !== "" && !base.role) {
      base.role = payload.role;
      repaired = true;
    }
    if (repaired) {
      localStorage.setItem(USER_KEY, JSON.stringify(base));
    }
    return Object.keys(base).length ? base : null;
  }

  function isLoggedIn() {
    return Boolean(localStorage.getItem(TOKEN_KEY));
  }

  function isAdmin() {
    const u = getUser();
    if (u && roleIsAdmin(u.role)) return true;
    const p = decodeJwtPayload(localStorage.getItem(TOKEN_KEY));
    return Boolean(p && roleIsAdmin(p.role));
  }

  function requireLogin({ redirectTo = "login.html" } = {}) {
    if (!isLoggedIn()) {
      window.location.href = redirectTo;
      return false;
    }
    return true;
  }

  function requireAdmin({ redirectTo = "login.html" } = {}) {
    if (!requireLogin({ redirectTo })) return false;
    if (!isAdmin()) {
      window.location.href = "dashboard.html";
      return false;
    }
    return true;
  }

  async function login(email, password) {
    const data = await API.request("/api/login", { method: "POST", body: { email, password } });
    setSession(data);
    return data;
  }

  async function register(name, email, password) {
    const data = await API.request("/api/register", { method: "POST", body: { name, email, password } });
    setSession(data);
    return data;
  }

  function logout() {
    clearSession();
    window.location.href = "index.html";
  }

  function wireNavAuth() {
    const user = getUser();

    document.querySelectorAll("[data-auth='guest']").forEach((el) => {
      el.style.display = isLoggedIn() ? "none" : "";
    });
    document.querySelectorAll("[data-auth='user']").forEach((el) => {
      el.style.display = isLoggedIn() ? "" : "none";
    });
    document.querySelectorAll("[data-auth='admin']").forEach((el) => {
      el.style.display = isAdmin() ? "" : "none";
    });

    const nameEl = document.querySelector("[data-auth-name]");
    if (nameEl) nameEl.textContent = user ? user.name : "";

    document.querySelectorAll("[data-logout]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        logout();
      });
    });
  }

  return {
    login,
    register,
    logout,
    getUser,
    isLoggedIn,
    isAdmin,
    requireLogin,
    requireAdmin,
    wireNavAuth
  };
})();

