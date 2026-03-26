import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const MENU_URL = "https://functions.poehali.dev/d6fbe275-295d-4202-a295-0f80c3ddc5fd";
const EXTRAS_URL = "https://functions.poehali.dev/caace81a-183f-475a-a3d4-4478f98fb195";
const ORDERS_URL = "https://functions.poehali.dev/543e5a58-fc16-4bf4-ab12-812ef6ce6ded";
const AUTH_URL = "https://functions.poehali.dev/bb2b6c52-50c6-48fd-bb5b-ed83fcec807d";

interface MenuItem { id: number; name: string; price: number; tag: string; image_url: string; description: string; }
interface Extra { id: number; name: string; price: number; }
interface CartExtra { id: number; name: string; price: number; }
interface CartItem extends MenuItem { qty: number; extras: CartExtra[]; }
interface Order { id: number; order_number: string; customer_name: string; items: { name: string; qty: number; price: number; extras?: CartExtra[] }[]; total: number; status: string; comment: string; created_at: string; }

const STATUSES = [
  { value: "new", label: "Новый", color: "#6f4e37" },
  { value: "confirmed", label: "Подтверждён", color: "#2d31fa" },
  { value: "preparing", label: "Готовится", color: "#f5a623" },
  { value: "ready", label: "Готов", color: "#2ecc71" },
  { value: "done", label: "Выдан", color: "#aaa" },
  { value: "cancelled", label: "Отменён", color: "#c0392b" },
];
const si = (s: string) => STATUSES.find(x => x.value === s) || { label: s, color: "#999" };

type View = "orders" | "new-order";

export default function Cashier() {
  const navigate = useNavigate();
  const token = localStorage.getItem("admin_token") || "";
  const username = localStorage.getItem("admin_username") || "";
  const role = localStorage.getItem("admin_role") || "";

  const [view, setView] = useState<View>("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [allExtras, setAllExtras] = useState<Extra[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("active");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const prevNewCount = useRef(0);
  const audioCtx = useRef<AudioContext | null>(null);

  // Новый заказ (касса)
  const [cart, setCart] = useState<CartItem[]>([]);
  const [extrasModal, setExtrasModal] = useState<MenuItem | null>(null);
  const [selExtras, setSelExtras] = useState<CartExtra[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [comment, setComment] = useState("");
  const [placing, setPlacing] = useState(false);
  const [lastOrderNum, setLastOrderNum] = useState("");

  useEffect(() => {
    if (!token) { navigate("/admin/login"); return; }
    loadAll();
    const interval = setInterval(loadOrders, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadAll = async () => {
    setLoading(true);
    const [mRes, eRes] = await Promise.all([
      fetch(MENU_URL),
      fetch(EXTRAS_URL),
    ]);
    const [menuData, extrasData] = await Promise.all([mRes.json(), eRes.json()]);
    setMenuItems(Array.isArray(menuData) ? menuData : []);
    setAllExtras(Array.isArray(extrasData) ? extrasData : []);
    await loadOrders();
    setLoading(false);
  };

  const loadOrders = useCallback(async () => {
    try {
      const res = await fetch(`${ORDERS_URL}/all`, { headers: { "X-Session-Id": token } });
      const data = await res.json();
      if (Array.isArray(data)) {
        const newCount = data.filter((o: Order) => o.status === "new").length;
        if (newCount > prevNewCount.current && prevNewCount.current >= 0) playBeep();
        prevNewCount.current = newCount;
        setOrders(data);
      }
    } catch (e) { console.error(e); }
  }, [token]);

  const playBeep = () => {
    try {
      if (!audioCtx.current) audioCtx.current = new AudioContext();
      const osc = audioCtx.current.createOscillator();
      const gain = audioCtx.current.createGain();
      osc.connect(gain); gain.connect(audioCtx.current.destination);
      osc.frequency.value = 880; gain.gain.value = 0.3;
      osc.start(); osc.stop(audioCtx.current.currentTime + 0.2);
    } catch (_) { /* ignore */ }
  };

  const updateStatus = async (order: Order, newStatus: string) => {
    await fetch(`${ORDERS_URL}/${order.id}/status`, {
      method: "PUT", headers: { "Content-Type": "application/json", "X-Session-Id": token },
      body: JSON.stringify({ status: newStatus }),
    });
    if (selectedOrder?.id === order.id) setSelectedOrder({ ...selectedOrder, status: newStatus });
    loadOrders();
  };

  // Касса — создание заказа
  const openExtras = (item: MenuItem) => {
    setExtrasModal(item);
    setSelExtras(cart.find(c => c.id === item.id)?.extras || []);
  };
  const toggleExtra = (ex: Extra) => setSelExtras(prev => prev.find(e => e.id === ex.id) ? prev.filter(e => e.id !== ex.id) : [...prev, ex]);
  const confirmAdd = () => {
    if (!extrasModal) return;
    const item = extrasModal;
    setCart(prev => {
      const exist = prev.find(c => c.id === item.id);
      if (exist) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1, extras: selExtras } : c);
      return [...prev, { ...item, qty: 1, extras: selExtras }];
    });
    setExtrasModal(null);
  };
  const changeQty = (id: number, d: number) => setCart(prev => prev.map(c => c.id === id ? { ...c, qty: c.qty + d } : c).filter(c => c.qty > 0));
  const itemTotal = (c: CartItem) => (c.price + c.extras.reduce((s, e) => s + e.price, 0)) * c.qty;
  const cartTotal = cart.reduce((s, c) => s + itemTotal(c), 0);

  const placeOrder = async () => {
    if (!cart.length) return;
    setPlacing(true);
    const res = await fetch(ORDERS_URL, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_name: customerName.trim() || "Касса",
        comment: comment.trim(),
        items: cart.map(c => ({ id: c.id, name: c.name, price: c.price + c.extras.reduce((s, e) => s + e.price, 0), qty: c.qty, extras: c.extras })),
        total: cartTotal,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setLastOrderNum(data.order_number);
      setCart([]); setCustomerName(""); setComment("");
      loadOrders();
    }
    setPlacing(false);
  };

  const logout = async () => {
    await fetch(`${AUTH_URL}/logout`, { method: "POST", headers: { "X-Session-Id": token } });
    localStorage.clear(); navigate("/admin/login");
  };

  const activeOrders = orders.filter(o => !["done", "cancelled"].includes(o.status));
  const filteredOrders = filterStatus === "active" ? activeOrders : filterStatus === "all" ? orders : orders.filter(o => o.status === filterStatus);
  const newCount = orders.filter(o => o.status === "new").length;

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5", display: "flex", flexDirection: "column" }}>
      {/* Шапка */}
      <header style={{ background: "var(--dark)", color: "white", padding: "0 20px", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontFamily: "Unbounded, sans-serif", fontWeight: 800, fontSize: "16px", color: "var(--accent)" }}>КАССА</span>
          {newCount > 0 && <span style={{ background: "var(--primary)", color: "white", borderRadius: "50%", width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800 }}>{newCount}</span>}
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={{ fontSize: "13px", color: "#aaa" }}>{username}</span>
          {role === "admin" && <button onClick={() => navigate("/admin")} className="btn-cta" style={{ fontSize: "11px", padding: "6px 12px" }}>Админка</button>}
          <button onClick={() => navigate("/admin/orders")} className="btn-cta" style={{ fontSize: "11px", padding: "6px 12px" }}>Заказы</button>
          <button onClick={logout} style={{ background: "none", border: "1px solid #555", color: "white", padding: "5px 12px", cursor: "pointer", fontSize: "12px" }}>Выйти</button>
        </div>
      </header>

      {/* Переключатель */}
      <div style={{ background: "white", borderBottom: "2px solid #eee", display: "flex" }}>
        {([["orders", "Заказы"], ["new-order", "Новый заказ"]] as [View, string][]).map(([v, label]) => (
          <button key={v} onClick={() => setView(v)} style={{ padding: "14px 24px", fontWeight: 800, fontSize: "13px", textTransform: "uppercase", border: "none", borderBottom: view === v ? "3px solid var(--dark)" : "3px solid transparent", background: "none", cursor: "pointer", color: view === v ? "var(--dark)" : "#aaa" }}>
            {label}
          </button>
        ))}
      </div>

      {loading ? <div style={{ textAlign: "center", padding: "60px", color: "#aaa" }}>Загрузка...</div> : (

        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

          {/* ── ЗАКАЗЫ ── */}
          {view === "orders" && (
            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
              {/* Список */}
              <div style={{ width: "340px", borderRight: "2px solid #eee", overflowY: "auto", background: "white" }}>
                {/* Фильтр статусов */}
                <div style={{ padding: "12px", display: "flex", gap: "6px", flexWrap: "wrap", borderBottom: "2px solid #eee" }}>
                  {([["active", `Активные (${activeOrders.length})`], ["all", `Все (${orders.length})`]] as [string, string][]).map(([v, label]) => (
                    <button key={v} onClick={() => setFilterStatus(v)} style={{ padding: "5px 10px", fontSize: "11px", fontWeight: 700, border: "2px solid #1a1a1a", background: filterStatus === v ? "var(--dark)" : "white", color: filterStatus === v ? "white" : "inherit", cursor: "pointer" }}>{label}</button>
                  ))}
                </div>
                {filteredOrders.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px", color: "#aaa" }}>Заказов нет</div>
                ) : filteredOrders.map(order => (
                  <div key={order.id} onClick={() => setSelectedOrder(order)} style={{ padding: "14px 16px", borderBottom: "1px solid #eee", cursor: "pointer", background: selectedOrder?.id === order.id ? "#f9f5ee" : "white", borderLeft: selectedOrder?.id === order.id ? "4px solid var(--dark)" : "4px solid transparent" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span style={{ fontFamily: "Unbounded, sans-serif", fontWeight: 800, fontSize: "18px" }}>#{order.order_number}</span>
                      <span style={{ background: si(order.status).color, color: "white", padding: "2px 8px", fontSize: "11px", fontWeight: 700, borderRadius: "2px" }}>{si(order.status).label}</span>
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: 600 }}>{order.customer_name}</div>
                    <div style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}>{order.items.map(i => `${i.name} ×${i.qty}`).join(", ")}</div>
                    <div style={{ fontWeight: 800, color: "var(--primary)", marginTop: "4px", fontSize: "14px" }}>{order.total} ₽</div>
                  </div>
                ))}
              </div>

              {/* Детали */}
              <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
                {!selectedOrder ? (
                  <div style={{ textAlign: "center", padding: "60px", color: "#aaa" }}>
                    <Icon name="MousePointerClick" size={40} />
                    <p style={{ marginTop: "16px", fontWeight: 600 }}>Выберите заказ слева</p>
                  </div>
                ) : (
                  <div style={{ maxWidth: "500px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                      <h2 style={{ fontFamily: "Unbounded, sans-serif", fontWeight: 800, fontSize: "24px" }}>#{selectedOrder.order_number}</h2>
                      <span style={{ background: si(selectedOrder.status).color, color: "white", padding: "6px 14px", fontWeight: 800, fontSize: "13px" }}>{si(selectedOrder.status).label}</span>
                    </div>
                    <div style={{ background: "white", border: "2px solid #eee", padding: "16px", marginBottom: "16px", borderRadius: "4px" }}>
                      <div style={{ fontWeight: 700, marginBottom: "4px", fontSize: "15px" }}>{selectedOrder.customer_name}</div>
                      {selectedOrder.comment && <div style={{ fontSize: "13px", color: "#888", fontStyle: "italic" }}>"{selectedOrder.comment}"</div>}
                    </div>
                    <div style={{ background: "white", border: "2px solid #eee", padding: "16px", marginBottom: "16px", borderRadius: "4px" }}>
                      {selectedOrder.items.map((it, i) => (
                        <div key={i} style={{ marginBottom: "10px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "15px", fontWeight: 600 }}>
                            <span>{it.name} × {it.qty}</span>
                            <span style={{ fontWeight: 800 }}>{it.price * it.qty} ₽</span>
                          </div>
                          {it.extras && it.extras.length > 0 && <div style={{ fontSize: "12px", color: "#aaa", paddingLeft: "10px" }}>{it.extras.map((e: CartExtra) => e.name).join(", ")}</div>}
                        </div>
                      ))}
                      <div style={{ borderTop: "2px solid #eee", paddingTop: "10px", display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "18px" }}>
                        <span>Итого</span><span style={{ color: "var(--primary)" }}>{selectedOrder.total} ₽</span>
                      </div>
                    </div>
                    {/* Кнопки статусов */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      {STATUSES.filter(s => s.value !== selectedOrder.status).map(s => (
                        <button key={s.value} onClick={() => updateStatus(selectedOrder, s.value)} style={{ padding: "12px", fontWeight: 800, fontSize: "13px", border: "2px solid #1a1a1a", background: s.color, color: "white", cursor: "pointer", transition: "opacity 0.1s" }}
                          onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
                          onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
                          → {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── НОВЫЙ ЗАКАЗ (КАССА) ── */}
          {view === "new-order" && (
            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
              {/* Меню */}
              <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                {lastOrderNum && (
                  <div style={{ background: "#1a1a1a", color: "var(--accent)", padding: "14px 20px", borderRadius: "4px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontWeight: 700 }}>Заказ создан!</span>
                    <span style={{ fontFamily: "Unbounded, sans-serif", fontWeight: 800, fontSize: "22px", letterSpacing: "4px" }}>#{lastOrderNum}</span>
                    <button onClick={() => setLastOrderNum("")} style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer" }}>✕</button>
                  </div>
                )}
                <p style={{ fontWeight: 700, fontSize: "13px", color: "#888", textTransform: "uppercase", marginBottom: "4px" }}>Выберите позиции:</p>
                {menuItems.map(item => {
                  const inCart = cart.find(c => c.id === item.id);
                  return (
                    <div key={item.id} style={{ background: "white", border: "2px solid #eee", padding: "14px 16px", display: "flex", alignItems: "center", gap: "14px", borderRadius: "4px" }}>
                      {item.image_url && <img src={item.image_url} alt={item.name} style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "4px", flexShrink: 0 }} />}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: "15px" }}>{item.name}</div>
                        <div style={{ fontWeight: 800, color: "var(--primary)" }}>{item.price} ₽</div>
                      </div>
                      {inCart ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <button onClick={() => changeQty(item.id, -1)} style={{ width: "30px", height: "30px", border: "2px solid #1a1a1a", background: "white", fontWeight: 800, fontSize: "16px", cursor: "pointer" }}>−</button>
                          <span style={{ fontWeight: 800, minWidth: "20px", textAlign: "center" }}>{inCart.qty}</span>
                          <button onClick={() => changeQty(item.id, 1)} style={{ width: "30px", height: "30px", border: "2px solid #1a1a1a", background: "var(--dark)", color: "white", fontWeight: 800, fontSize: "16px", cursor: "pointer" }}>+</button>
                          {allExtras.length > 0 && <button onClick={() => openExtras(item)} style={{ padding: "5px 10px", border: "2px solid var(--secondary)", background: "white", color: "var(--secondary)", fontWeight: 700, fontSize: "11px", cursor: "pointer" }}>+ добавки</button>}
                        </div>
                      ) : (
                        <button onClick={() => allExtras.length > 0 ? openExtras(item) : setCart(p => [...p, { ...item, qty: 1, extras: [] }])}
                          style={{ padding: "8px 16px", border: "2px solid var(--dark)", background: "var(--dark)", color: "white", fontWeight: 700, cursor: "pointer", fontSize: "13px" }}>
                          + Добавить
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Корзина кассира */}
              <div style={{ width: "320px", borderLeft: "2px solid #eee", display: "flex", flexDirection: "column", background: "white" }}>
                <div style={{ padding: "16px 20px", borderBottom: "2px solid #eee", fontFamily: "Unbounded, sans-serif", fontWeight: 800, fontSize: "15px" }}>ЗАКАЗ</div>
                <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
                  {cart.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 20px", color: "#bbb" }}>
                      <Icon name="ShoppingCart" size={32} />
                      <p style={{ marginTop: "10px", fontSize: "13px" }}>Добавьте позиции из меню</p>
                    </div>
                  ) : cart.map(item => (
                    <div key={item.id} style={{ borderBottom: "1px solid #f0f0f0", paddingBottom: "10px", marginBottom: "10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: 600, fontSize: "14px" }}>{item.name}</span>
                        <span style={{ fontWeight: 800, color: "var(--primary)", fontSize: "14px" }}>{itemTotal(item)} ₽</span>
                      </div>
                      {item.extras.length > 0 && <div style={{ fontSize: "11px", color: "#aaa", margin: "2px 0" }}>{item.extras.map(e => e.name).join(", ")}</div>}
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                        <button onClick={() => changeQty(item.id, -1)} style={{ width: "24px", height: "24px", border: "1px solid #ccc", background: "white", cursor: "pointer", fontSize: "14px", fontWeight: 700 }}>−</button>
                        <span style={{ fontWeight: 700, fontSize: "13px" }}>{item.qty}</span>
                        <button onClick={() => changeQty(item.id, 1)} style={{ width: "24px", height: "24px", border: "1px solid #ccc", background: "white", cursor: "pointer", fontSize: "14px", fontWeight: 700 }}>+</button>
                      </div>
                    </div>
                  ))}
                </div>
                {cart.length > 0 && (
                  <div style={{ padding: "14px 16px", borderTop: "2px solid #eee" }}>
                    <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Имя клиента (необязательно)"
                      style={{ width: "100%", padding: "8px 12px", border: "2px solid #eee", fontSize: "13px", outline: "none", marginBottom: "8px" }} />
                    <input value={comment} onChange={e => setComment(e.target.value)} placeholder="Комментарий"
                      style={{ width: "100%", padding: "8px 12px", border: "2px solid #eee", fontSize: "13px", outline: "none", marginBottom: "12px" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "18px", marginBottom: "12px" }}>
                      <span>Итого</span><span style={{ color: "var(--primary)" }}>{cartTotal} ₽</span>
                    </div>
                    <button onClick={placeOrder} disabled={placing} style={{ width: "100%", padding: "14px", background: "#2ecc71", border: "2px solid #1a1a1a", fontWeight: 800, fontSize: "15px", cursor: "pointer", color: "white" }}>
                      {placing ? "Создаю..." : "✓ Принять заказ"}
                    </button>
                    <button onClick={() => setCart([])} style={{ width: "100%", padding: "8px", background: "none", border: "none", color: "#bbb", cursor: "pointer", fontSize: "12px", marginTop: "6px" }}>Очистить</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Модал добавок (касса) */}
      {extrasModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "white", border: "var(--border)", width: "100%", maxWidth: "400px", maxHeight: "80vh", overflowY: "auto" }}>
            <div style={{ padding: "16px 20px", borderBottom: "var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 800, fontSize: "15px" }}>{extrasModal.name} — добавки</span>
              <button onClick={() => setExtrasModal(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><Icon name="X" size={18} /></button>
            </div>
            <div style={{ padding: "12px 20px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {allExtras.map(ex => {
                const sel = selExtras.find(e => e.id === ex.id);
                return (
                  <button key={ex.id} onClick={() => toggleExtra(ex)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", border: sel ? "2px solid var(--dark)" : "2px solid #eee", background: sel ? "#f9f5ee" : "white", cursor: "pointer" }}>
                    <span style={{ fontWeight: 600, fontSize: "14px" }}>{sel ? "✓ " : ""}{ex.name}</span>
                    <span style={{ fontWeight: 800, color: "var(--primary)" }}>{ex.price > 0 ? `+${ex.price} ₽` : "бесплатно"}</span>
                  </button>
                );
              })}
            </div>
            <div style={{ padding: "12px 20px", borderTop: "var(--border)" }}>
              <div style={{ fontWeight: 700, fontSize: "13px", color: "#888", marginBottom: "8px" }}>
                Цена: {extrasModal.price + selExtras.reduce((s, e) => s + e.price, 0)} ₽
              </div>
              <button onClick={confirmAdd} style={{ width: "100%", padding: "12px", background: "var(--dark)", color: "white", border: "none", fontWeight: 800, fontSize: "14px", cursor: "pointer" }}>
                Добавить в заказ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
