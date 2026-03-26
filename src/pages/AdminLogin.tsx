import { useState } from "react";
import { useNavigate } from "react-router-dom";

const AUTH_URL = "https://functions.poehali.dev/bb2b6c52-50c6-48fd-bb5b-ed83fcec807d";
const SETUP_URL = "https://functions.poehali.dev/44f160bb-e6bd-41f3-8c60-0c9c2fa2ac9a";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [setupMode, setSetupMode] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.ok) {
        localStorage.setItem("admin_token", data.token);
        localStorage.setItem("admin_username", data.username);
        navigate("/admin");
      } else {
        setError(data.error || "Ошибка входа");
      }
    } catch {
      setError("Ошибка соединения");
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(SETUP_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setSetupMode(false);
        setError("");
        alert(`Администратор "${data.username}" создан! Теперь войдите.`);
      } else {
        setError(data.error || "Ошибка");
      }
    } catch {
      setError("Ошибка соединения");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "white", border: "var(--border)", boxShadow: "var(--shadow)", padding: "40px", width: "100%", maxWidth: "400px" }}>
        <div style={{ fontFamily: "Unbounded, sans-serif", fontWeight: 800, fontSize: "24px", marginBottom: "8px" }}>
          COFFEE*CAFÉ
        </div>
        <p style={{ color: "#666", marginBottom: "32px", fontSize: "14px" }}>
          {setupMode ? "Создание администратора" : "Вход в админ-панель"}
        </p>

        <form onSubmit={setupMode ? handleSetup : handleLogin}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", marginBottom: "8px" }}>Логин</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="admin"
              required
              style={{ width: "100%", padding: "10px 14px", border: "var(--border)", fontSize: "14px", outline: "none", background: "var(--bg)" }}
            />
          </div>
          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", marginBottom: "8px" }}>Пароль</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{ width: "100%", padding: "10px 14px", border: "var(--border)", fontSize: "14px", outline: "none", background: "var(--bg)" }}
            />
          </div>

          {error && (
            <div style={{ background: "#fff0f0", border: "2px solid var(--primary)", padding: "10px 14px", marginBottom: "16px", fontSize: "14px", color: "var(--primary)", fontWeight: 600 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-cta"
            style={{ width: "100%", background: "var(--dark)", color: "white", padding: "14px", fontSize: "14px" }}
          >
            {loading ? "..." : setupMode ? "Создать администратора" : "Войти"}
          </button>
        </form>

        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <button
            onClick={() => { setSetupMode(!setupMode); setError(""); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#999", fontSize: "12px", textDecoration: "underline" }}
          >
            {setupMode ? "Уже есть аккаунт? Войти" : "Создать первого администратора"}
          </button>
        </div>
      </div>
    </div>
  );
}
