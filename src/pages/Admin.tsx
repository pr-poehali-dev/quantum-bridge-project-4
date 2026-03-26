import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const MENU_URL = "https://functions.poehali.dev/d6fbe275-295d-4202-a295-0f80c3ddc5fd";
const AUTH_URL = "https://functions.poehali.dev/bb2b6c52-50c6-48fd-bb5b-ed83fcec807d";

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  tag: string;
  tag_color: string;
  image_url: string;
  is_active: boolean;
  sort_order: number;
}

const EMPTY_ITEM: Omit<MenuItem, "id"> = {
  name: "",
  description: "",
  price: 0,
  tag: "",
  tag_color: "default",
  image_url: "",
  is_active: true,
  sort_order: 0,
};

export default function Admin() {
  const navigate = useNavigate();
  const token = localStorage.getItem("admin_token") || "";
  const username = localStorage.getItem("admin_username") || "Админ";

  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState(EMPTY_ITEM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) { navigate("/admin/login"); return; }
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    const res = await fetch(`${MENU_URL}/all`, { headers: { "X-Session-Id": token } });
    const data = await res.json();
    setItems(data);
    setLoading(false);
  };

  const logout = async () => {
    await fetch(`${AUTH_URL}/logout`, { method: "POST", headers: { "X-Session-Id": token } });
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_username");
    navigate("/admin/login");
  };

  const openCreate = () => {
    setEditItem(null);
    setForm(EMPTY_ITEM);
    setModalOpen(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditItem(item);
    setForm({ name: item.name, description: item.description, price: item.price, tag: item.tag, tag_color: item.tag_color, image_url: item.image_url, is_active: item.is_active, sort_order: item.sort_order });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    if (editItem) {
      await fetch(`${MENU_URL}/${editItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-Session-Id": token },
        body: JSON.stringify(form),
      });
    } else {
      await fetch(MENU_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Session-Id": token },
        body: JSON.stringify(form),
      });
    }
    setSaving(false);
    setModalOpen(false);
    loadItems();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Удалить позицию?")) return;
    await fetch(`${MENU_URL}/${id}`, { method: "DELETE", headers: { "X-Session-Id": token } });
    loadItems();
  };

  const toggleActive = async (item: MenuItem) => {
    await fetch(`${MENU_URL}/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Session-Id": token },
      body: JSON.stringify({ ...item, is_active: !item.is_active }),
    });
    loadItems();
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <header style={{ background: "white", borderBottom: "var(--border)", padding: "0 24px", height: "70px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ fontFamily: "Unbounded, sans-serif", fontWeight: 800, fontSize: "18px" }}>COFFEE*CAFÉ</div>
          <span style={{ background: "var(--accent)", padding: "2px 10px", border: "var(--border)", fontSize: "11px", fontWeight: 800, textTransform: "uppercase" }}>Админ</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ fontSize: "14px", color: "#666" }}>{username}</span>
          <button onClick={logout} className="btn-cta" style={{ fontSize: "12px", padding: "8px 16px" }}>Выйти</button>
        </div>
      </header>

      <main style={{ padding: "32px 24px", maxWidth: "900px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <h1 style={{ fontFamily: "Unbounded, sans-serif", fontSize: "28px", fontWeight: 800 }}>МЕНЮ</h1>
          <button onClick={openCreate} className="btn-cta" style={{ background: "var(--dark)", color: "white", display: "flex", alignItems: "center", gap: "8px" }}>
            <Icon name="Plus" size={16} />
            Добавить позицию
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#999" }}>Загрузка...</div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px", border: "2px dashed #ccc", color: "#999" }}>
            <Icon name="Coffee" size={40} />
            <p style={{ marginTop: "16px" }}>Меню пустое. Добавьте первую позицию!</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {items.map(item => (
              <div key={item.id} style={{ background: "white", border: "var(--border)", padding: "16px 20px", display: "flex", alignItems: "center", gap: "16px", opacity: item.is_active ? 1 : 0.5 }}>
                {item.image_url && (
                  <img src={item.image_url} alt={item.name} style={{ width: "64px", height: "64px", objectFit: "cover", border: "2px solid #1a1a1a", flexShrink: 0 }} />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                    <span style={{ fontWeight: 800, fontSize: "16px" }}>{item.name}</span>
                    {item.tag && <span style={{ fontSize: "11px", fontWeight: 700, background: "var(--accent)", padding: "2px 8px", border: "1px solid #1a1a1a" }}>{item.tag}</span>}
                    {!item.is_active && <span style={{ fontSize: "11px", color: "#999", fontWeight: 600 }}>скрыто</span>}
                  </div>
                  <p style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>{item.description}</p>
                  <span style={{ fontWeight: 800, fontSize: "16px", color: "var(--primary)" }}>{item.price} ₽</span>
                </div>
                <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                  <button onClick={() => toggleActive(item)} className="btn-cta" style={{ padding: "8px", fontSize: "12px" }} title={item.is_active ? "Скрыть" : "Показать"}>
                    <Icon name={item.is_active ? "EyeOff" : "Eye"} size={14} />
                  </button>
                  <button onClick={() => openEdit(item)} className="btn-cta" style={{ padding: "8px", fontSize: "12px" }}>
                    <Icon name="Pencil" size={14} />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="btn-cta" style={{ padding: "8px", fontSize: "12px", background: "var(--primary)", color: "white" }}>
                    <Icon name="Trash2" size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {modalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "white", border: "var(--border)", boxShadow: "var(--shadow)", width: "100%", maxWidth: "520px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ padding: "24px", borderBottom: "var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontFamily: "Unbounded, sans-serif", fontWeight: 800, fontSize: "18px" }}>
                {editItem ? "Редактировать" : "Добавить позицию"}
              </h2>
              <button onClick={() => setModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <Icon name="X" size={20} />
              </button>
            </div>
            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              {[
                { label: "Название", key: "name", type: "text", placeholder: "Флэт Уайт" },
                { label: "Ссылка на фото", key: "image_url", type: "text", placeholder: "https://..." },
                { label: "Тег (например: Хит, Новинка)", key: "tag", type: "text", placeholder: "Хит" },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label style={{ display: "block", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", marginBottom: "6px" }}>{label}</label>
                  <input
                    type={type}
                    value={(form as Record<string, string | number | boolean>)[key] as string}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    style={{ width: "100%", padding: "10px 14px", border: "var(--border)", fontSize: "14px", outline: "none", background: "var(--bg)" }}
                  />
                </div>
              ))}
              <div>
                <label style={{ display: "block", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", marginBottom: "6px" }}>Описание</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Описание напитка..."
                  rows={3}
                  style={{ width: "100%", padding: "10px 14px", border: "var(--border)", fontSize: "14px", outline: "none", background: "var(--bg)", resize: "vertical" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", marginBottom: "6px" }}>Цена (₽)</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
                  style={{ width: "100%", padding: "10px 14px", border: "var(--border)", fontSize: "14px", outline: "none", background: "var(--bg)" }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                  style={{ width: "18px", height: "18px" }}
                />
                <label htmlFor="is_active" style={{ fontWeight: 700, fontSize: "14px" }}>Показывать на сайте</label>
              </div>
            </div>
            <div style={{ padding: "16px 24px", borderTop: "var(--border)", display: "flex", gap: "12px" }}>
              <button onClick={handleSave} disabled={saving} className="btn-cta" style={{ flex: 1, background: "var(--dark)", color: "white", padding: "14px" }}>
                {saving ? "Сохраняю..." : "Сохранить"}
              </button>
              <button onClick={() => setModalOpen(false)} className="btn-cta" style={{ padding: "14px 20px" }}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}