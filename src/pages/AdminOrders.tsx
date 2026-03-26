import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const ORDERS_URL = "https://functions.poehali.dev/543e5a58-fc16-4bf4-ab12-812ef6ce6ded";
const AUTH_URL = "https://functions.poehali.dev/bb2b6c52-50c6-48fd-bb5b-ed83fcec807d";
const SETUP_URL = "https://functions.poehali.dev/44f160bb-e6bd-41f3-8c60-0c9c2fa2ac9a";

interface OrderItem { name: string; price: number; qty: number; }
interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  items: OrderItem[];
  total: number;
  status: string;
  comment: string;
  created_at: string;
}

const STATUSES = [
  { value: "new", label: "Принят", color: "#6f4e37" },
  { value: "confirmed", label: "Подтверждён", color: "#2d31fa" },
  { value: "preparing", label: "Готовится", color: "#f5a623" },
  { value: "ready", label: "Готов к выдаче", color: "#2ecc71" },
  { value: "done", label: "Выдан", color: "#999" },
  { value: "cancelled", label: "Отменён", color: "#c0392b" },
];

const statusInfo = (s: string) => STATUSES.find(x => x.value === s) || { label: s, color: "#999" };

export default function AdminOrders() {
  const navigate = useNavigate();
  const token = localStorage.getItem("admin_token") || "";
  const username = localStorage.getItem("admin_username") || "";
  const role = localStorage.getItem("admin_role") || "admin";

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [selected, setSelected] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Создание кассира (только для admin)
  const [cashierOpen, setCashierOpen] = useState(false);
  const [cashierLogin, setCashierLogin] = useState("");
  const [cashierPass, setCashierPass] = useState("");
  const [cashierMsg, setCashierMsg] = useState("");

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${ORDERS_URL}/all`, { headers: { "X-Session-Id": token } });
      const data = await res.json();
      if (Array.isArray(data)) setOrders(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (!token) { navigate("/admin/login"); return; }
    loadOrders();
    const interval = setInterval(loadOrders, 20000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (order: Order, newStatus: string) => {
    setUpdatingId(order.id);
    await fetch(`${ORDERS_URL}/${order.id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Session-Id": token },
      body: JSON.stringify({ status: newStatus }),
    });
    setUpdatingId(null);
    if (selected?.id === order.id) setSelected({ ...selected, status: newStatus });
    loadOrders();
  };

  const createCashier = async () => {
    setCashierMsg("");
    const res = await fetch(`${SETUP_URL}/cashier`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Session-Id": token },
      body: JSON.stringify({ username: cashierLogin, password: cashierPass }),
    });
    const data = await res.json();
    if (res.ok) { setCashierMsg(`Кассир "${data.username}" создан!`); setCashierLogin(""); setCashierPass(""); }
    else setCashierMsg(data.error || "Ошибка");
  };

  const filtered = filterStatus === "all" ? orders : orders.filter(o => o.status === filterStatus);
  const newCount = orders.filter(o => o.status === "new").length;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <header style={{ background: "white", borderBottom: "var(--border)", padding: "0 24px", height: "70px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button onClick={() => navigate(role === "cashier" ? "/admin/login" : "/admin")} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <Icon name="ArrowLeft" size={20} />
          </button>
          <span style={{ fontFamily: "Unbounded, sans-serif", fontWeight: 800, fontSize: "18px" }}>ЗАКАЗЫ</span>
          {newCount > 0 && <span style={{ background: "var(--primary)", color: "white", borderRadius: "50%", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 800, border: "2px solid #1a1a1a" }}>{newCount}</span>}
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <span style={{ fontSize: "13px", color: "#666" }}>{username} · {role === "cashier" ? "Кассир" : "Админ"}</span>
          {role === "admin" && (
            <button onClick={() => setCashierOpen(true)} className="btn-cta" style={{ fontSize: "11px", padding: "6px 12px" }}>+ Кассир</button>
          )}
          <button onClick={() => { fetch(`${AUTH_URL}/logout`, { method: "POST", headers: { "X-Session-Id": token } }); localStorage.clear(); navigate("/admin/login"); }} className="btn-cta" style={{ fontSize: "11px", padding: "6px 12px" }}>Выйти</button>
        </div>
      </header>

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "24px 20px" }}>
        {/* Фильтр */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "24px" }}>
          <button onClick={() => setFilterStatus("all")} className="btn-cta" style={{ fontSize: "12px", background: filterStatus === "all" ? "var(--dark)" : "white", color: filterStatus === "all" ? "white" : "inherit" }}>Все ({orders.length})</button>
          {STATUSES.map(s => {
            const cnt = orders.filter(o => o.status === s.value).length;
            if (cnt === 0 && filterStatus !== s.value) return null;
            return (
              <button key={s.value} onClick={() => setFilterStatus(s.value)} className="btn-cta" style={{ fontSize: "12px", background: filterStatus === s.value ? s.color : "white", color: filterStatus === s.value ? "white" : "inherit" }}>
                {s.label} ({cnt})
              </button>
            );
          })}
          <button onClick={loadOrders} className="btn-cta" style={{ fontSize: "12px", marginLeft: "auto" }}><Icon name="RefreshCw" size={13} /></button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#999" }}>Загрузка...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px", border: "2px dashed #ccc", color: "#999" }}>Заказов нет</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {filtered.map(order => {
              const si = statusInfo(order.status);
              return (
                <div key={order.id} onClick={() => setSelected(order)} style={{ background: "white", border: "var(--border)", padding: "16px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: "16px", transition: "box-shadow 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = "var(--shadow)")}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}>
                  <div style={{ fontFamily: "Unbounded, sans-serif", fontWeight: 800, fontSize: "22px", minWidth: "80px" }}>#{order.order_number}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, marginBottom: "2px" }}>{order.customer_name}</div>
                    <div style={{ fontSize: "13px", color: "#666" }}>
                      {order.items.map(i => `${i.name} ×${i.qty}`).join(", ")}
                    </div>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: "16px", color: "var(--primary)", minWidth: "70px", textAlign: "right" }}>{order.total} ₽</div>
                  <span style={{ background: si.color, color: "white", padding: "4px 10px", fontSize: "12px", fontWeight: 800, border: "2px solid #1a1a1a", whiteSpace: "nowrap" }}>{si.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Детали заказа */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex" }}>
          <div style={{ flex: 1, background: "rgba(0,0,0,0.4)" }} onClick={() => setSelected(null)} />
          <div style={{ width: "100%", maxWidth: "420px", background: "var(--bg)", borderLeft: "var(--border)", overflowY: "auto" }}>
            <div style={{ padding: "20px 24px", borderBottom: "var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "white", position: "sticky", top: 0 }}>
              <span style={{ fontFamily: "Unbounded, sans-serif", fontWeight: 800 }}>#{selected.order_number}</span>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><Icon name="X" size={20} /></button>
            </div>
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <div style={{ fontWeight: 700, marginBottom: "4px" }}>{selected.customer_name}</div>
                {selected.customer_phone && <div style={{ fontSize: "14px", color: "#666" }}>{selected.customer_phone}</div>}
                {selected.comment && <div style={{ fontSize: "14px", color: "#666", marginTop: "4px", fontStyle: "italic" }}>"{selected.comment}"</div>}
              </div>
              <div style={{ background: "white", border: "var(--border)", padding: "16px" }}>
                {selected.items.map((it, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", marginBottom: "8px" }}>
                    <span>{it.name} × {it.qty}</span>
                    <span style={{ fontWeight: 700 }}>{it.price * it.qty} ₽</span>
                  </div>
                ))}
                <div style={{ borderTop: "2px solid #1a1a1a", paddingTop: "10px", display: "flex", justifyContent: "space-between", fontWeight: 800 }}>
                  <span>Итого</span><span style={{ color: "var(--primary)" }}>{selected.total} ₽</span>
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "13px", textTransform: "uppercase", marginBottom: "10px" }}>Изменить статус:</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {STATUSES.map(s => (
                    <button key={s.value} disabled={selected.status === s.value || updatingId === selected.id}
                      onClick={() => updateStatus(selected, s.value)}
                      className="btn-cta"
                      style={{ background: selected.status === s.value ? s.color : "white", color: selected.status === s.value ? "white" : "inherit", fontSize: "13px", textAlign: "left", opacity: updatingId === selected.id ? 0.6 : 1 }}>
                      {selected.status === s.value && "✓ "}{s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Создание кассира */}
      {cashierOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "white", border: "var(--border)", boxShadow: "var(--shadow)", width: "100%", maxWidth: "380px", padding: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <span style={{ fontFamily: "Unbounded, sans-serif", fontWeight: 800, fontSize: "16px" }}>НОВЫЙ КАССИР</span>
              <button onClick={() => { setCashierOpen(false); setCashierMsg(""); }} style={{ background: "none", border: "none", cursor: "pointer" }}><Icon name="X" size={18} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input value={cashierLogin} onChange={e => setCashierLogin(e.target.value)} placeholder="Логин" style={{ padding: "10px 14px", border: "var(--border)", fontSize: "14px", outline: "none", background: "var(--bg)" }} />
              <input type="password" value={cashierPass} onChange={e => setCashierPass(e.target.value)} placeholder="Пароль" style={{ padding: "10px 14px", border: "var(--border)", fontSize: "14px", outline: "none", background: "var(--bg)" }} />
              {cashierMsg && <div style={{ fontWeight: 700, color: cashierMsg.includes("создан") ? "#2ecc71" : "var(--primary)", fontSize: "14px" }}>{cashierMsg}</div>}
              <button onClick={createCashier} className="btn-cta" style={{ background: "var(--dark)", color: "white", padding: "12px" }}>Создать кассира</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}