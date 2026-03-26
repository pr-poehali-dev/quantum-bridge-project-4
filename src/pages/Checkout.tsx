import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const ORDERS_URL = "https://functions.poehali.dev/543e5a58-fc16-4bf4-ab12-812ef6ce6ded";

interface CartExtra { id: number; name: string; price: number; }
interface CartItem {
  id: number;
  name: string;
  price: number;
  qty: number;
  image_url?: string;
  extras: CartExtra[];
}

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { cart = [], total = 0 } = (location.state || {}) as { cart: CartItem[]; total: number };

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderNumber, setOrderNumber] = useState("");

  if (cart.length === 0 && !orderNumber) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "20px" }}>
        <Icon name="ShoppingCart" size={48} />
        <p style={{ fontWeight: 700, fontSize: "18px" }}>Корзина пуста</p>
        <button onClick={() => navigate("/")} className="btn-cta" style={{ background: "var(--dark)", color: "white" }}>На главную</button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Введите ваше имя"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(ORDERS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: name.trim(),
          customer_phone: phone.trim(),
          comment: comment.trim(),
          items: cart.map(c => ({ id: c.id, name: c.name, price: c.price + (c.extras || []).reduce((s: number, e: CartExtra) => s + e.price, 0), qty: c.qty, extras: c.extras || [] })),
          total,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setOrderNumber(data.order_number);
      } else {
        setError(data.error || "Ошибка при оформлении");
      }
    } catch {
      setError("Ошибка соединения");
    } finally {
      setLoading(false);
    }
  };

  if (orderNumber) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div style={{ background: "white", border: "var(--border)", boxShadow: "var(--shadow)", padding: "40px", width: "100%", maxWidth: "440px", textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>☕</div>
          <h2 style={{ fontFamily: "Unbounded, sans-serif", fontWeight: 800, fontSize: "22px", marginBottom: "12px" }}>ЗАКАЗ ПРИНЯТ!</h2>
          <p style={{ color: "#666", marginBottom: "24px" }}>Ваш номер заказа:</p>
          <div style={{ background: "var(--dark)", color: "var(--accent)", fontFamily: "Unbounded, sans-serif", fontWeight: 800, fontSize: "42px", padding: "20px", border: "var(--border)", letterSpacing: "8px", marginBottom: "24px" }}>
            {orderNumber}
          </div>
          <p style={{ fontSize: "14px", color: "#666", marginBottom: "32px", lineHeight: 1.6 }}>
            Сохраните номер — по нему можно отслеживать статус заказа на главной странице. Мы готовим ваш кофе!
          </p>
          <button onClick={() => navigate("/")} className="btn-cta" style={{ background: "var(--dark)", color: "white", width: "100%", padding: "14px", fontSize: "15px" }}>
            На главную
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <header style={{ background: "white", borderBottom: "var(--border)", padding: "0 24px", height: "70px", display: "flex", alignItems: "center", gap: "16px" }}>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer" }}>
          <Icon name="ArrowLeft" size={22} />
        </button>
        <span style={{ fontFamily: "Unbounded, sans-serif", fontWeight: 800, fontSize: "18px" }}>ОФОРМЛЕНИЕ</span>
      </header>

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "32px 20px", display: "flex", flexDirection: "column", gap: "24px" }}>

        {/* Состав заказа */}
        <div style={{ background: "white", border: "var(--border)" }}>
          <div style={{ padding: "16px 20px", borderBottom: "var(--border)", fontWeight: 800, textTransform: "uppercase", fontFamily: "Unbounded, sans-serif", fontSize: "14px" }}>
            Ваш заказ
          </div>
          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {cart.map(item => {
              const unitPrice = item.price + (item.extras || []).reduce((s: number, e: CartExtra) => s + e.price, 0);
              return (
                <div key={item.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "15px" }}>
                    <span>{item.name} <span style={{ color: "#999" }}>× {item.qty}</span></span>
                    <span style={{ fontWeight: 700 }}>{unitPrice * item.qty} ₽</span>
                  </div>
                  {item.extras && item.extras.length > 0 && <div style={{ fontSize: "12px", color: "#aaa", paddingLeft: "8px", marginTop: "2px" }}>{item.extras.map((e: CartExtra) => `${e.name}${e.price > 0 ? ` +${e.price}₽` : ""}`).join(", ")}</div>}
                </div>
              );
            })}
            <div style={{ borderTop: "2px solid #1a1a1a", paddingTop: "12px", display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "18px" }}>
              <span>Итого</span>
              <span style={{ color: "var(--primary)" }}>{total} ₽</span>
            </div>
          </div>
        </div>

        {/* Тип получения */}
        <div style={{ background: "white", border: "var(--border)" }}>
          <div style={{ padding: "16px 20px", borderBottom: "var(--border)", fontWeight: 800, textTransform: "uppercase", fontFamily: "Unbounded, sans-serif", fontSize: "14px" }}>
            Способ получения
          </div>
          <div style={{ padding: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "20px", height: "20px", background: "var(--dark)", border: "var(--border)", borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: "8px", height: "8px", background: "var(--accent)", borderRadius: "50%" }} />
            </div>
            <div>
              <div style={{ fontWeight: 800 }}>Самовывоз</div>
              <div style={{ fontSize: "13px", color: "#666" }}>Заберите заказ на кассе, когда будет готов</div>
            </div>
          </div>
        </div>

        {/* Данные */}
        <form onSubmit={handleSubmit} style={{ background: "white", border: "var(--border)" }}>
          <div style={{ padding: "16px 20px", borderBottom: "var(--border)", fontWeight: 800, textTransform: "uppercase", fontFamily: "Unbounded, sans-serif", fontSize: "14px" }}>
            Ваши данные
          </div>
          <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", marginBottom: "6px" }}>Имя *</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ваше имя"
                required
                style={{ width: "100%", padding: "10px 14px", border: "var(--border)", fontSize: "14px", outline: "none", background: "var(--bg)" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", marginBottom: "6px" }}>Телефон</label>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+7 (999) 000-00-00"
                style={{ width: "100%", padding: "10px 14px", border: "var(--border)", fontSize: "14px", outline: "none", background: "var(--bg)" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", marginBottom: "6px" }}>Комментарий</label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Без сахара, больше молока..."
                rows={2}
                style={{ width: "100%", padding: "10px 14px", border: "var(--border)", fontSize: "14px", outline: "none", background: "var(--bg)", resize: "vertical" }}
              />
            </div>
            {error && <div style={{ color: "var(--primary)", fontWeight: 700 }}>{error}</div>}
            <button type="submit" disabled={loading} className="btn-cta" style={{ background: "var(--dark)", color: "white", padding: "16px", fontSize: "15px", width: "100%" }}>
              {loading ? "Оформляю..." : `Подтвердить заказ — ${total} ₽`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}