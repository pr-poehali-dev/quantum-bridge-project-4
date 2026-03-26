export default function Index() {
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
        <button className="btn-cta">Забронировать</button>
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
              <button className="btn-cta" style={{ background: "var(--primary)", color: "white" }}>
                Смотреть меню
              </button>
              <button className="btn-cta" style={{ background: "white" }}>
                О нас
              </button>
            </div>
          </div>
          <div className="hero-img">
            <div className="sticker">
              СВЕЖАЯ
              <br />
              ОБЖАРКА
            </div>
            <div className="floating-tag hidden md:block" style={{ top: "20%", left: "10%" }}>
              #COFFEEVIBES
            </div>
            <div className="floating-tag hidden md:block" style={{ bottom: "30%", right: "20%" }}>
              АРТ
            </div>
          </div>
        </section>

        <div className="marquee">
          <div className="marquee-content">
            &nbsp; * АВТОРСКИЙ КОФЕ * SPECIALTY ЗЁРНА * УЮТНАЯ АТМОСФЕРА * ОТКРЫТЫ С 8:00 * ЛУЧШИЙ КАПУЧИНО В ГОРОДЕ *
            АВТОРСКИЙ КОФЕ * SPECIALTY ЗЁРНА * УЮТНАЯ АТМОСФЕРА * ОТКРЫТЫ С 8:00 * ЛУЧШИЙ КАПУЧИНО В ГОРОДЕ
          </div>
        </div>

        <section className="section-padding">
          <div className="section-header">
            <h2 className="section-title">НАШЕ МЕНЮ</h2>
            <a
              href="#"
              className="text-sm md:text-base"
              style={{ color: "var(--dark)", fontWeight: 800, textTransform: "uppercase" }}
            >
              Всё меню
            </a>
          </div>

          <div className="menu-grid">
            {/* Item 1 */}
            <div className="menu-card">
              <span className="menu-tag">Хит</span>
              <img
                src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                alt="Флэт Уайт"
              />
              <div className="menu-card-body">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                  }}
                >
                  <h3>Флэт Уайт</h3>
                  <span className="price">280 ₽</span>
                </div>
                <p style={{ fontSize: "14px", color: "#666" }}>
                  Двойной эспрессо, бархатистое молоко и тонкая молочная пенка. Классика в чистом виде.
                </p>
              </div>
            </div>

            {/* Item 2 */}
            <div className="menu-card">
              <span className="menu-tag" style={{ background: "var(--secondary)" }}>
                Новинка
              </span>
              <img
                src="https://images.unsplash.com/photo-1461023058943-07fcbe16d735?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                alt="Латте с карамелью"
              />
              <div className="menu-card-body">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                  }}
                >
                  <h3>Карамельный Латте</h3>
                  <span className="price">350 ₽</span>
                </div>
                <p style={{ fontSize: "14px", color: "#666" }}>Нежный латте с домашней карамелью и щепоткой морской соли.</p>
              </div>
            </div>

            {/* Item 3 */}
            <div className="menu-card">
              <span className="menu-tag" style={{ background: "var(--accent)", color: "var(--dark)" }}>
                Популярное
              </span>
              <img
                src="https://images.unsplash.com/photo-1572442388796-11668a67e53d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                alt="Матча Латте"
              />
              <div className="menu-card-body">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                  }}
                >
                  <h3>Матча Латте</h3>
                  <span className="price">380 ₽</span>
                </div>
                <p style={{ fontSize: "14px", color: "#666" }}>
                  Японский матча премиум-класса с овсяным молоком. Мягко, зелено и очень вкусно.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="retro-vibe">
          <div>
            <h2 className="vibe-title">МЕСТО, ГДЕ ВРЕМЯ ЗАМЕДЛЯЕТСЯ.</h2>
            <p className="vibe-text">
              Мы создаём пространство, где каждая чашка — это ритуал. Тёплый свет, мягкие кресла, джазовые плейлисты и запах свежесмолотого кофе. Идеально для работы, встреч и просто хорошего утра.
            </p>
            <button className="btn-cta" style={{ background: "var(--dark)", color: "white", borderColor: "white" }}>
              Наша история
            </button>
          </div>
          <div className="vibe-img"></div>
        </section>

        <section className="section-padding">
          <h2 className="section-title" style={{ marginBottom: "40px", textAlign: "center" }}>
            @COFFEE.CAFÉ
          </h2>
          <div className="social-grid">
            <div className="social-item">
              <img
                src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
                alt="Кофе 1"
              />
            </div>
            <div className="social-item">
              <img
                src="https://images.unsplash.com/photo-1442512595331-e89e73853f31?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
                alt="Кофе 2"
              />
            </div>
            <div className="social-item">
              <img
                src="https://images.unsplash.com/photo-1453614512568-c4024d13c247?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
                alt="Кофе 3"
              />
            </div>
            <div className="social-item">
              <img
                src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
                alt="Кофе 4"
              />
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div>
          <div className="footer-logo">COFFEE*CAFÉ</div>
          <p style={{ color: "#666", lineHeight: 1.6 }}>
            Современная кофейня для тех, кто ценит вкус и атмосферу. Каждая чашка — с любовью.
          </p>
        </div>
        <div className="footer-links">
          <h4>Навигация</h4>
          <ul>
            <li>
              <a href="#" style={{ color: "inherit", textDecoration: "none" }}>
                Меню
              </a>
            </li>
            <li>
              <a href="#" style={{ color: "inherit", textDecoration: "none" }}>
                О нас
              </a>
            </li>
            <li>
              <a href="#" style={{ color: "inherit", textDecoration: "none" }}>
                Контакты
              </a>
            </li>
            <li>
              <a href="#" style={{ color: "inherit", textDecoration: "none" }}>
                Политика
              </a>
            </li>
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
            <li>Instagram</li>
          </ul>
        </div>
      </footer>
    </>
  );
}
