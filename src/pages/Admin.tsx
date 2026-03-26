import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const MENU_URL = "https://functions.poehali.dev/d6fbe275-295d-4202-a295-0f80c3ddc5fd";
const AUTH_URL = "https://functions.poehali.dev/bb2b6c52-50c6-48fd-bb5b-ed83fcec807d";
const EXTRAS_URL = "https://functions.poehali.dev/caace81a-183f-475a-a3d4-4478f98fb195";

interface MenuItem {
  id: number; name: string; description: string; price: number;
  tag: string; tag_color: string; image_url: string; is_active: boolean; sort_order: number;
}
interface Extra {
  id: number; name: string; price: number; is_active: boolean; sort_order: number;
}

const EMPTY_ITEM: Omit<MenuItem, "id"> = { name: "", description: "", price: 0, tag: "", tag_color: "default", image_url: "", is_active: true, sort_order: 0 };
const EMPTY_EXTRA: Omit<Extra, "id"> = { name: "", price: 0, is_active: true, sort_order: 0 };

type Tab = "menu" | "extras";

export default function Admin() {
  const navigate = useNavigate();
  const token = localStorage.getItem("admin_token") || "";
  const username = localStorage.getItem("admin_username") || "Админ";

  const [tab, setTab] = useState<Tab>("menu");
  const [items, setItems] = useState<MenuItem[]>([]);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [loading, setLoading] = useState(true);

  // Меню modal
  const [menuModal, setMenuModal] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState(EMPTY_ITEM);
  const [saving, setSaving] = useState(false);

  // Быстрое редактирование цены
  const [editingPrice, setEditingPrice] = useState<number | null>(null);
  const [priceVal, setPriceVal] = useState("");

  // Extras modal
  const [extrasModal, setExtrasModal] = useState(false);
  const [editExtra, setEditExtra] = useState<Extra | null>(null);
  const [extraForm, setExtraForm] = useState(EMPTY_EXTRA);

  useEffect(() => {
    if (!token) { navigate("/admin/login"); return; }
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    const [mRes, eRes] = await Promise.all([
      fetch(`${MENU_URL}/all`, { headers: { "X-Session-Id": token } }),
      fetch(`${EXTRAS_URL}/all`, { headers: { "X-Session-Id": token } }),
    ]);
    setItems(await mRes.json());
    setExtras(await eRes.json());
    setLoading(false);
  };

  const logout = async () => {
    await fetch(`${AUTH_URL}/logout`, { method: "POST", headers: { "X-Session-Id": token } });
    localStorage.clear();
    navigate("/admin/login");
  };

  // ── Меню ──
  const openCreate = () => { setEditItem(null); setForm(EMPTY_ITEM); setMenuModal(true); };
  const openEdit = (item: MenuItem) => {
    setEditItem(item);
    setForm({ name: item.name, description: item.description, price: item.price, tag: item.tag, tag_color: item.tag_color, image_url: item.image_url, is_active: item.is_active, sort_order: item.sort_order });
    setMenuModal(true);
  };
  const handleSave = async () => {
    setSaving(true);
    const url = editItem ? `${MENU_URL}/${editItem.id}` : MENU_URL;
    const method = editItem ? "PUT" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json", "X-Session-Id": token }, body: JSON.stringify(form) });
    setSaving(false); setMenuModal(false); loadAll();
  };
  const handleDelete = async (id: number) => {
    if (!confirm("Удалить позицию из меню?")) return;
    await fetch(`${MENU_URL}/${id}`, { method: "DELETE", headers: { "X-Session-Id": token } });
    loadAll();
  };
  const toggleActive = async (item: MenuItem) => {
    await fetch(`${MENU_URL}/${item.id}`, { method: "PUT", headers: { "Content-Type": "application/json", "X-Session-Id": token }, body: JSON.stringify({ ...item, is_active: !item.is_active }) });
    loadAll();
  };
  const savePrice = async (item: MenuItem) => {
    const newPrice = parseInt(priceVal);
    if (isNaN(newPrice) || newPrice < 0) { setEditingPrice(null); return; }
    await fetch(`${MENU_URL}/${item.id}`, { method: "PUT", headers: { "Content-Type": "application/json", "X-Session-Id": token }, body: JSON.stringify({ ...item, price: newPrice }) });
    setEditingPrice(null); loadAll();
  };

  // ── Добавки ──
  const openExtraCreate = () => { setEditExtra(null); setExtraForm(EMPTY_EXTRA); setExtrasModal(true); };
  const openExtraEdit = (e: Extra) => { setEditExtra(e); setExtraForm({ name: e.name, price: e.price, is_active: e.is_active, sort_order: e.sort_order }); setExtrasModal(true); };
  const handleExtraSave = async () => {
    setSaving(true);
    const url = editExtra ? `${EXTRAS_URL}/${editExtra.id}` : EXTRAS_URL;
    const method = editExtra ? "PUT" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json", "X-Session-Id": token }, body: JSON.stringify(extraForm) });
    setSaving(false); setExtrasModal(false); loadAll();
  };
  const handleExtraDelete = async (id: number) => {
    if (!confirm("Удалить добавку?")) return;
    await fetch(`${EXTRAS_URL}/${id}`, { method: "DELETE", headers: { "X-Session-Id": token } });
    loadAll();
  };
  const toggleExtra = async (e: Extra) => {
    await fetch(`${EXTRAS_URL}/${e.id}`, { method: "PUT", headers: { "Content-Type": "application/json", "X-Session-Id": token }, body: JSON.stringify({ ...e, is_active: !e.is_active }) });
    loadAll();
  };

  const headerBtns = (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <span style={{ fontSize: "14px", color: "#666" }}>{username}</span>
      <button onClick={() => navigate("/admin/cashier")} className="btn-cta" style={{ fontSize: "12px", padding: "8px 14px", background: "var(--secondary)", color: "white" }}>Касса</button>
      <button onClick={() => navigate("/admin/orders")} className="btn-cta" style={{ fontSize: "12px", padding: "8px 14px", background: "var(--primary)", color: "white" }}>Заказы</button>
      <button onClick={logout} className="btn-cta" style={{ fontSize: "12px", padding: "8px 14px" }}>Выйти</button>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <header style={{ background: "white", borderBottom: "var(--border)", padding: "0 24px", height: "70px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ fontFamily: "Unbounded, sans-serif", fontWeight: 800, fontSize: "18px" }}>COFFEE*CAFÉ</div>
          <span style={{ background: "var(--accent)", padding: "2px 10px", border: "var(--border)", fontSize: "11px", fontWeight: 800, textTransform: "uppercase" }}>Админ</span>
        </div>
        {headerBtns}
      </header>

      {/* Табы */}
      <div style={{ background: "white", borderBottom: "var(--border)", display: "flex" }}>
        {([["menu", "Меню"], ["extras", "Добавки"]] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "16px 28px", fontWeight: 800, fontSize: "14px", textTransform: "uppercase", border: "none", borderBottom: tab === t ? "3px solid var(--dark)" : "3px solid transparent", background: "none", cursor: "pointer", color: tab === t ? "var(--dark)" : "#999" }}>
            {label}
          </button>
        ))}
      </div>

      <main style={{ padding: "28px 24px", maxWidth: "900px", margin: "0 auto" }}>

        {/* ── TAB: МЕНЮ ── */}
        {tab === "menu" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h1 style={{ fontFamily: "Unbounded, sans-serif", fontSize: "24px", fontWeight: 800 }}>МЕНЮ</h1>
              <button onClick={openCreate} className="btn-cta" style={{ background: "var(--dark)", color: "white", display: "flex", alignItems: "center", gap: "8px" }}>
                <Icon name="Plus" size={15} /> Добавить
              </button>
            </div>
            {loading ? <div style={{ textAlign: "center", padding: "60px", color: "#999" }}>Загрузка...</div> : items.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px", border: "2px dashed #ccc", color: "#999" }}>Меню пустое</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {items.map(item => (
                  <div key={item.id} style={{ background: "white", border: "var(--border)", padding: "14px 18px", display: "flex", alignItems: "center", gap: "14px", opacity: item.is_active ? 1 : 0.5 }}>
                    {item.image_url && <img src={item.image_url} alt={item.name} style={{ width: "58px", height: "58px", objectFit: "cover", border: "2px solid #1a1a1a", flexShrink: 0 }} />}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                        <span style={{ fontWeight: 800, fontSize: "15px" }}>{item.name}</span>
                        {item.tag && <span style={{ fontSize: "10px", fontWeight: 700, background: "var(--accent)", padding: "1px 7px", border: "1px solid #1a1a1a" }}>{item.tag}</span>}
                        {!item.is_active && <span style={{ fontSize: "11px", color: "#bbb" }}>скрыто</span>}
                      </div>
                      {/* Быстрое редактирование цены */}
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {editingPrice === item.id ? (
                          <>
                            <input autoFocus value={priceVal} onChange={e => setPriceVal(e.target.value)} onKeyDown={e => { if (e.key === "Enter") savePrice(item); if (e.key === "Escape") setEditingPrice(null); }}
                              style={{ width: "80px", padding: "3px 8px", border: "2px solid var(--dark)", fontWeight: 800, fontSize: "15px", outline: "none" }} />
                            <span style={{ fontSize: "13px" }}>₽</span>
                            <button onClick={() => savePrice(item)} className="btn-cta" style={{ padding: "3px 10px", fontSize: "12px", background: "var(--dark)", color: "white" }}>✓</button>
                            <button onClick={() => setEditingPrice(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#999" }}>✕</button>
                          </>
                        ) : (
                          <button onClick={() => { setEditingPrice(item.id); setPriceVal(String(item.price)); }} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", padding: 0 }}>
                            <span style={{ fontWeight: 800, fontSize: "16px", color: "var(--primary)" }}>{item.price} ₽</span>
                            <Icon name="Pencil" size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                      <button onClick={() => toggleActive(item)} className="btn-cta" style={{ padding: "7px 10px" }} title={item.is_active ? "Скрыть" : "Показать"}>
                        <Icon name={item.is_active ? "EyeOff" : "Eye"} size={14} />
                      </button>
                      <button onClick={() => openEdit(item)} className="btn-cta" style={{ padding: "7px 10px" }}>
                        <Icon name="Pencil" size={14} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="btn-cta" style={{ padding: "7px 10px", background: "var(--primary)", color: "white" }}>
                        <Icon name="Trash2" size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── TAB: ДОБАВКИ ── */}
        {tab === "extras" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h1 style={{ fontFamily: "Unbounded, sans-serif", fontSize: "24px", fontWeight: 800 }}>ДОБАВКИ</h1>
              <button onClick={openExtraCreate} className="btn-cta" style={{ background: "var(--dark)", color: "white", display: "flex", alignItems: "center", gap: "8px" }}>
                <Icon name="Plus" size={15} /> Добавить
              </button>
            </div>
            <p style={{ fontSize: "14px", color: "#888", marginBottom: "20px" }}>Добавки доступны клиентам при выборе напитка. Цена добавки прибавляется к стоимости заказа.</p>
            {loading ? <div style={{ textAlign: "center", padding: "60px", color: "#999" }}>Загрузка...</div> : extras.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px", border: "2px dashed #ccc", color: "#999" }}>Добавок нет</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {extras.map(ex => (
                  <div key={ex.id} style={{ background: "white", border: "var(--border)", padding: "14px 18px", display: "flex", alignItems: "center", gap: "14px", opacity: ex.is_active ? 1 : 0.5 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: "15px" }}>{ex.name}</div>
                      {!ex.is_active && <span style={{ fontSize: "11px", color: "#bbb" }}>скрыто</span>}
                    </div>
                    <span style={{ fontWeight: 800, fontSize: "16px", color: ex.price > 0 ? "var(--primary)" : "#999" }}>
                      {ex.price > 0 ? `+${ex.price} ₽` : "бесплатно"}
                    </span>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button onClick={() => toggleExtra(ex)} className="btn-cta" style={{ padding: "7px 10px" }}>
                        <Icon name={ex.is_active ? "EyeOff" : "Eye"} size={14} />
                      </button>
                      <button onClick={() => openExtraEdit(ex)} className="btn-cta" style={{ padding: "7px 10px" }}>
                        <Icon name="Pencil" size={14} />
                      </button>
                      <button onClick={() => handleExtraDelete(ex.id)} className="btn-cta" style={{ padding: "7px 10px", background: "var(--primary)", color: "white" }}>
                        <Icon name="Trash2" size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* ── Модал: Меню ── */}
      {menuModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "white", border: "var(--border)", boxShadow: "var(--shadow)", width: "100%", maxWidth: "500px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ padding: "20px 24px", borderBottom: "var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontFamily: "Unbounded, sans-serif", fontWeight: 800, fontSize: "16px" }}>{editItem ? "Редактировать" : "Добавить позицию"}</h2>
              <button onClick={() => setMenuModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><Icon name="X" size={20} /></button>
            </div>
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "14px" }}>
              {([["name","Название","Флэт Уайт"],["image_url","Ссылка на фото","https://..."],["tag","Тег","Хит, Новинка..."]] as [keyof typeof form, string, string][]).map(([key, label, ph]) => (
                <div key={key}>
                  <label style={{ display: "block", fontWeight: 700, fontSize: "11px", textTransform: "uppercase", marginBottom: "5px" }}>{label}</label>
                  <input value={form[key] as string} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={ph}
                    style={{ width: "100%", padding: "9px 13px", border: "var(--border)", fontSize: "14px", outline: "none", background: "var(--bg)" }} />
                </div>
              ))}
              <div>
                <label style={{ display: "block", fontWeight: 700, fontSize: "11px", textTransform: "uppercase", marginBottom: "5px" }}>Описание</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                  style={{ width: "100%", padding: "9px 13px", border: "var(--border)", fontSize: "14px", outline: "none", background: "var(--bg)", resize: "vertical" }} />
              </div>
              <div>
                <label style={{ display: "block", fontWeight: 700, fontSize: "11px", textTransform: "uppercase", marginBottom: "5px" }}>Цена (₽)</label>
                <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
                  style={{ width: "100%", padding: "9px 13px", border: "var(--border)", fontSize: "14px", outline: "none", background: "var(--bg)" }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input type="checkbox" id="is_active_m" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} style={{ width: "16px", height: "16px" }} />
                <label htmlFor="is_active_m" style={{ fontWeight: 700, fontSize: "13px" }}>Показывать на сайте</label>
              </div>
            </div>
            <div style={{ padding: "14px 24px", borderTop: "var(--border)", display: "flex", gap: "10px" }}>
              <button onClick={handleSave} disabled={saving} className="btn-cta" style={{ flex: 1, background: "var(--dark)", color: "white", padding: "13px" }}>{saving ? "Сохраняю..." : "Сохранить"}</button>
              <button onClick={() => setMenuModal(false)} className="btn-cta" style={{ padding: "13px 18px" }}>Отмена</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Модал: Добавки ── */}
      {extrasModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "white", border: "var(--border)", boxShadow: "var(--shadow)", width: "100%", maxWidth: "400px" }}>
            <div style={{ padding: "20px 24px", borderBottom: "var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontFamily: "Unbounded, sans-serif", fontWeight: 800, fontSize: "16px" }}>{editExtra ? "Редактировать добавку" : "Новая добавка"}</h2>
              <button onClick={() => setExtrasModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><Icon name="X" size={20} /></button>
            </div>
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontWeight: 700, fontSize: "11px", textTransform: "uppercase", marginBottom: "5px" }}>Название</label>
                <input value={extraForm.name} onChange={e => setExtraForm(f => ({ ...f, name: e.target.value }))} placeholder="Доп. шот эспрессо"
                  style={{ width: "100%", padding: "9px 13px", border: "var(--border)", fontSize: "14px", outline: "none", background: "var(--bg)" }} />
              </div>
              <div>
                <label style={{ display: "block", fontWeight: 700, fontSize: "11px", textTransform: "uppercase", marginBottom: "5px" }}>Доплата (₽, 0 = бесплатно)</label>
                <input type="number" value={extraForm.price} onChange={e => setExtraForm(f => ({ ...f, price: Number(e.target.value) }))}
                  style={{ width: "100%", padding: "9px 13px", border: "var(--border)", fontSize: "14px", outline: "none", background: "var(--bg)" }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input type="checkbox" id="is_active_e" checked={extraForm.is_active} onChange={e => setExtraForm(f => ({ ...f, is_active: e.target.checked }))} style={{ width: "16px", height: "16px" }} />
                <label htmlFor="is_active_e" style={{ fontWeight: 700, fontSize: "13px" }}>Показывать клиентам</label>
              </div>
            </div>
            <div style={{ padding: "14px 24px", borderTop: "var(--border)", display: "flex", gap: "10px" }}>
              <button onClick={handleExtraSave} disabled={saving} className="btn-cta" style={{ flex: 1, background: "var(--dark)", color: "white", padding: "13px" }}>{saving ? "Сохраняю..." : "Сохранить"}</button>
              <button onClick={() => setExtrasModal(false)} className="btn-cta" style={{ padding: "13px 18px" }}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
