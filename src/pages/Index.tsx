import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const MENU_URL = "https://functions.poehali.dev/d6fbe275-295d-4202-a295-0f80c3ddc5fd";

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  tag: string;
  tag_color: string;
  image_url: string;
}

interface CartItem extends MenuItem {
  qty: number;
}

const TAG_COLORS: Record<string, string> = {
  default: "var(--primary)",
  secondary: "var(--secondary)",
  accent: "var(--accent)",
};

export default function Index() {
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [trackOpen, setTrackOpen] = useState(false);
  const [trackNumber, setTrackNumber] = useState("");
  const [trackResult, setTrackResult] = useState<null | { order_number: string; status: string; customer_name: string; items: CartItem[]; total: number; created_at: string }>(null);
  const [trackError, setTrackError] = useState("");
  const [trackLoading, setTrackLoading] = useState(false);

  useEffect(() => {
    fetch(MENU_URL).then(r => r.json()).then(setMenuItems).catch(() => {});
  }, []);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const exist = prev.find(c => c.id === item.id);
      if (exist) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...item, qty: 1 }];
    });
    setCartOpen(true);
  };

  const changeQty = (id: number, delta: number) => {
    setCart(prev => prev.map(c => c.id === id ? { ...c, qty: c.qty + delta } : c).filter(c => c.qty > 0));
  };

  const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  const handleTrack = async () => {
    if (!trackNumber.trim()) return;
    setTrackLoading(true);
    setTrackError("");
    setTrackResult(null);
    try {
      const res = await fetch(`https://functions.poehali.dev/543e5a58-fc16-4bf4-ab12-812ef6ce6ded?order_number=${trackNumber.trim()}`);
      const data = await res.json();
      if (res.ok) setTrackResult(data);
      else setTrackError(data.error || "Заказ не найден");
    } catch {
      setTrackError("Ошибка соединения");
    } finally {
      setTrackLoading(false);
    }
  };

  const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    new: { label: "Принят", color: "#6f4e37" },
    confirmed: { label: "Подтверждён", color: "#2d31fa" },
    preparing: { label: "Готовится", color: "#f5a623" },
    ready: { label: "Готов к выдаче", color: "#2ecc71" },
    done: { label: "Выдан", color: "#999" },
    cancelled: { label: "Отменён", color: "var(--primary)" },
  };

  const displayItems = menuItems.length > 0 ? menuItems : [
    { id: 1, name: "Флэт Уайт", description: "Двойной эспрессо, бархатистое молоко и тонкая молочная пенка.", price: 280, tag: "Хит", tag_color: "default", image_url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" },
    { id: 2, name: "Карамельный Латте", description: "Нежный латте с домашней карамелью и щепоткой морской соли.", price: 350, tag: "Новинка", tag_color: "secondary", image_url: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" },
    { id: 3, name: "Матча Латте", description: "Японский матча премиум-класса с овсяным молоком.", price: 380, tag: "Популярное", tag_color: "accent", image_url: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" },
  ];

  return (
    <>
      <div className="grain-overlay" />

      <header className="header">
        <div className="logo">COFFEE*CAFÉ</div>
        <nav>
          <a href="#">Меню</a>
          <a href="#">О нас</a>
          <a href="#">Атмосфера</a>
          <a href="#">Контакты</a>
        </nav>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button className="btn-cta" onClick={() => setTrackOpen(true)} style={{ background: "white", fontSize: "12px" }}>
            Мой заказ
          </button>
          <button className="btn-cta" onClick={() => setCartOpen(true)} style={{ background: "var(--accent)", position: "relative", display: "flex", alignItems: "center", gap: "6px" }}>
            <Icon name="ShoppingCart" size={16} />
            {cartCount > 0 && <span style={{ background: "var(--primary)", color: "white", borderRadius: "50%", width: "18px", height: "18px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800, position: "absolute", top: "-8px", right: "-8px", border: "2px solid white" }}>{cartCount}</span>}
          </button>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-content">
            <h1 className="hero-title">
              ТВОЙ КОФЕ,
              <br />
              ТВОЙ <span>Момент</span>
            </h1>
            <p className="text-base md:text-lg lg:text-xl mb-8 md:mb-10 leading-relaxed text-[#555]">
              Современная кофейня с характером. Отборные зёрна, авторские напитки и атмосфера, в которой хочется остаться подольше.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
              <button className="btn-cta" style={{ background: "var(--primary)", color: "white" }} onClick={() => document.getElementById('menu-section')?.scrollIntoView({ behavior: 'smooth' })}>
                Смотреть меню
              </button>
              <button className="btn-cta" onClick={() => setTrackOpen(true)} style={{ background: "white" }}>
                Отследить заказ
              </button>
            </div>
          </div>
          <div className="hero-img">
            <div className="sticker">СВЕЖАЯ<br />ОБЖАРКА</div>
            <div className="floating-tag hidden md:block" style={{ top: "20%", left: "10%" }}>#COFFEEVIBES</div>
            <div className="floating-tag hidden md:block" style={{ bottom: "30%", right: "20%" }}>АРТ</div>
          </div>
        </section>

        <div className="marquee">
          <div className="marquee-content">
            &nbsp; * АВТОРСКИЙ КОФЕ * SPECIALTY ЗЁРНА * УЮТНАЯ АТМОСФЕРА * ОТКРЫТЫ С 8:00 * ЛУЧШИЙ КАПУЧИНО В ГОРОДЕ *
            АВТОРСКИЙ КОФЕ * SPECIALTY ЗЁРНА * УЮТНАЯ АТМОСФЕРА * ОТКРЫТЫ С 8:00 * ЛУЧШИЙ КАПУЧИНО В ГОРОДЕ
          </div>
        </div>

        <section className="section-padding" id="menu-section">
          <div className="section-header">
            <h2 className="section-title">НАШЕ МЕНЮ</h2>
          </div>
          <div className="menu-grid">
            {displayItems.map(item => {
              const inCart = cart.find(c => c.id === item.id);
              return (
                <div key={item.id} className="menu-card">
                  {item.tag && (
                    <span className="menu-tag" style={{ background: TAG_COLORS[item.tag_color] || TAG_COLORS.default, color: item.tag_color === "accent" ? "var(--dark)" : "white" }}>
                      {item.tag}
                    </span>
                  )}
                  {item.image_url && <img src={item.image_url} alt={item.name} />}
                  <div className="menu-card-body">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <h3>{item.name}</h3>
                      <span className="price">{item.price} ₽</span>
                    </div>
                    <p style={{ fontSize: "14px", color: "#666", marginBottom: "14px" }}>{item.description}</p>
                    {inCart ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <button onClick={() => changeQty(item.id, -1)} className="btn-cta" style={{ padding: "6px 12px", fontSize: "16px" }}>−</button>
                        <span style={{ fontWeight: 800, fontSize: "16px" }}>{inCart.qty}</span>
                        <button onClick={() => changeQty(item.id, 1)} className="btn-cta" style={{ padding: "6px 12px", fontSize: "16px" }}>+</button>
                      </div>
                    ) : (
                      <button onClick={() => addToCart(item)} className="btn-cta" style={{ background: "var(--dark)", color: "white", width: "100%" }}>
                        В корзину
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="retro-vibe">
          <div>
            <h2 className="vibe-title">МЕСТО, ГДЕ ВРЕМЯ ЗАМЕДЛЯЕТСЯ.</h2>
            <p className="vibe-text">
              Мы создаём пространство, где каждая чашка — это ритуал. Тёплый свет, мягкие кресла, джазовые плейлисты и запах свежесмолотого кофе.
            </p>
            <button className="btn-cta" style={{ background: "var(--dark)", color: "white", borderColor: "white" }}>
              Наша история
            </button>
          </div>
          <div className="vibe-img"></div>
        </section>

        <section className="section-padding">
          <h2 className="section-title" style={{ marginBottom: "40px", textAlign: "center" }}>@COFFEE.CAFÉ</h2>
          <div className="social-grid">
            {[
              "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
              "https://images.unsplash.com/photo-1442512595331-e89e73853f31?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
              "https://images.unsplash.com/photo-1453614512568-c4024d13c247?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
              "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
            ].map((src, i) => (
              <div key={i} className="social-item"><img src={src} alt={`Кофе ${i + 1}`} /></div>
            ))}
          </div>
        </section>
      </main>

      <footer>
        <div>
          <div className="footer-logo">COFFEE*CAFÉ</div>
          <p style={{ color: "#666", lineHeight: 1.6 }}>Современная кофейня для тех, кто ценит вкус и атмосферу.</p>
        </div>
        <div className="footer-links">
          <h4>Навигация</h4>
          <ul>
            <li><a href="#" style={{ color: "inherit", textDecoration: "none" }}>Меню</a></li>
            <li><a href="#" style={{ color: "inherit", textDecoration: "none" }}>О нас</a></li>
            <li><a href="#" style={{ color: "inherit", textDecoration: "none" }}>Контакты</a></li>
          </ul>
        </div>
        <div className="footer-links">
          <h4>Часы работы</h4>
          <ul>
            <li>Пн–Пт: 08:00–22:00</li>
            <li>Сб–Вс: 09:00–23:00</li>
          </ul>
        </div>
        <div className="footer-links">
          <h4>Контакты</h4>
          <ul>
            <li>+7 (999) 000-00-00</li>
            <li>hello@coffeecafe.ru</li>
          </ul>
        </div>
      </footer>

      {/* КОРЗИНА */}
      {cartOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex" }}>
          <div style={{ flex: 1, background: "rgba(0,0,0,0.4)" }} onClick={() => setCartOpen(false)} />
          <div style={{ width: "100%", maxWidth: "420px", background: "var(--bg)", borderLeft: "var(--border)", display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
            <div style={{ padding: "20px 24px", borderBottom: "var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "white", position: "sticky", top: 0, zIndex: 1 }}>
              <span style={{ fontFamily: "Unbounded, sans-serif", fontWeight: 800, fontSize: "18px" }}>КОРЗИНА</span>
              <button onClick={() => setCartOpen(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><Icon name="X" size={22} /></button>
            </div>

            {cart.length === 0 ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", color: "#999", padding: "40px" }}>
                <Icon name="ShoppingCart" size={48} />
                <p style={{ fontWeight: 700 }}>Корзина пуста</p>
                <button onClick={() => setCartOpen(false)} className="btn-cta" style={{ background: "var(--dark)", color: "white" }}>Перейти в меню</button>
              </div>
            ) : (
              <>
                <div style={{ flex: 1, padding: "16px 24px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  {cart.map(item => (
                    <div key={item.id} style={{ display: "flex", gap: "12px", alignItems: "center", background: "white", border: "var(--border)", padding: "12px" }}>
                      {item.image_url && <img src={item.image_url} alt={item.name} style={{ width: "52px", height: "52px", objectFit: "cover", border: "2px solid #1a1a1a", flexShrink: 0 }} />}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: "14px" }}>{item.name}</div>
                        <div style={{ fontWeight: 800, color: "var(--primary)" }}>{item.price} ₽</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <button onClick={() => changeQty(item.id, -1)} className="btn-cta" style={{ padding: "4px 10px" }}>−</button>
                        <span style={{ fontWeight: 800, minWidth: "20px", textAlign: "center" }}>{item.qty}</span>
                        <button onClick={() => changeQty(item.id, 1)} className="btn-cta" style={{ padding: "4px 10px" }}>+</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: "16px 24px", borderTop: "var(--border)", background: "white", position: "sticky", bottom: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                    <span style={{ fontWeight: 700 }}>Итого:</span>
                    <span style={{ fontFamily: "Unbounded, sans-serif", fontWeight: 800, fontSize: "20px" }}>{total} ₽</span>
                  </div>
                  <button onClick={() => { setCartOpen(false); navigate("/checkout", { state: { cart, total } }); }} className="btn-cta" style={{ width: "100%", background: "var(--dark)", color: "white", padding: "14px", fontSize: "15px" }}>
                    Оформить самовывоз
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ОТСЛЕДИТЬ ЗАКАЗ */}
      {trackOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "white", border: "var(--border)", boxShadow: "var(--shadow)", width: "100%", maxWidth: "440px" }}>
            <div style={{ padding: "20px 24px", borderBottom: "var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "Unbounded, sans-serif", fontWeight: 800, fontSize: "16px" }}>МОЙ ЗАКАЗ</span>
              <button onClick={() => { setTrackOpen(false); setTrackResult(null); setTrackError(""); setTrackNumber(""); }} style={{ background: "none", border: "none", cursor: "pointer" }}><Icon name="X" size={20} /></button>
            </div>
            <div style={{ padding: "24px" }}>
              <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                <input
                  value={trackNumber}
                  onChange={e => setTrackNumber(e.target.value)}
                  placeholder="Номер заказа (6 цифр)"
                  onKeyDown={e => e.key === "Enter" && handleTrack()}
                  style={{ flex: 1, padding: "10px 14px", border: "var(--border)", fontSize: "14px", outline: "none", background: "var(--bg)" }}
                />
                <button onClick={handleTrack} className="btn-cta" style={{ background: "var(--dark)", color: "white" }} disabled={trackLoading}>
                  {trackLoading ? "..." : <Icon name="Search" size={16} />}
                </button>
              </div>
              {trackError && <div style={{ color: "var(--primary)", fontWeight: 700, marginBottom: "16px" }}>{trackError}</div>}
              {trackResult && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <span style={{ fontWeight: 700 }}>Заказ #{trackResult.order_number}</span>
                    <span style={{ background: STATUS_LABELS[trackResult.status]?.color || "#999", color: "white", padding: "4px 12px", fontWeight: 800, fontSize: "12px", border: "2px solid #1a1a1a" }}>
                      {STATUS_LABELS[trackResult.status]?.label || trackResult.status}
                    </span>
                  </div>
                  <p style={{ fontSize: "14px", color: "#666", marginBottom: "12px" }}>Имя: <b>{trackResult.customer_name}</b></p>
                  <div style={{ borderTop: "1px solid #eee", paddingTop: "12px" }}>
                    {(trackResult.items as CartItem[]).map((it, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", marginBottom: "6px" }}>
                        <span>{it.name} × {it.qty}</span>
                        <span style={{ fontWeight: 700 }}>{it.price * it.qty} ₽</span>
                      </div>
                    ))}
                    <div style={{ borderTop: "1px solid #eee", paddingTop: "10px", display: "flex", justifyContent: "space-between", fontWeight: 800 }}>
                      <span>Итого</span>
                      <span>{trackResult.total} ₽</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
