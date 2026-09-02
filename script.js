/* =========================================================
   MARKET FLASH — SCRIPT.JS
   Versión frontend completa
   ========================================================= */

"use strict";

/* =========================
   CONFIGURACIÓN
========================= */

const STORAGE = {
  user: "mf_user",
  products: "mf_products_v2",
  ads: "mf_ads_v2",
  config: "mf_config_v2",
  messages: "mf_messages_v2",
  claims: "mf_claims_v2",
  sanctions: "mf_sanctions_v2",
  stats: "mf_stats_v2"
};

const DEFAULT_CONFIG = {
  adminPassword: "MarketFlash2026!",
  siteName: "Market Flash",
  tagline: "Encuentra lo que necesitas",
  currency: "RD$",

  plans: {
    cheap: {
      name: "Flash Básico",
      price: 250
    },
    normal: {
      name: "Flash Destacado",
      price: 500
    },
    pro: {
      name: "Flash Premium",
      price: 1000
    }
  },

  payments: {
    "Banco Popular": {
      enabled: true,
      account: "Configurar cuenta",
      cheap: 250,
      normal: 500,
      pro: 1000
    },

    "Banreservas": {
      enabled: true,
      account: "Configurar cuenta",
      cheap: 250,
      normal: 500,
      pro: 1000
    },

    "Binance": {
      enabled: true,
      account: "Configurar cuenta",
      cheap: 250,
      normal: 500,
      pro: 1000
    },

    "PayPal": {
      enabled: true,
      account: "Configurar cuenta",
      cheap: 250,
      normal: 500,
      pro: 1000
    }
  },

  panel: {
    compact: false,
    rounded: true,
    animations: true
  }
};

/* =========================
   UTILIDADES
========================= */

function getJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getConfig() {
  const stored = getJSON(STORAGE.config, null);

  if (!stored) {
    saveJSON(STORAGE.config, DEFAULT_CONFIG);
    return structuredClone(DEFAULT_CONFIG);
  }

  return {
    ...DEFAULT_CONFIG,
    ...stored,
    plans: {
      ...DEFAULT_CONFIG.plans,
      ...(stored.plans || {})
    },
    payments: {
      ...DEFAULT_CONFIG.payments,
      ...(stored.payments || {})
    },
    panel: {
      ...DEFAULT_CONFIG.panel,
      ...(stored.panel || {})
    }
  };
}

function currentUser() {
  return getJSON(STORAGE.user, null);
}

function setCurrentUser(user) {
  if (user) {
    saveJSON(STORAGE.user, user);
  } else {
    localStorage.removeItem(STORAGE.user);
  }
}

function uid(prefix = "mf") {
  return prefix + "_" + Date.now() + "_" +
    Math.random().toString(36).slice(2, 9);
}

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function money(value) {
  const config = getConfig();
  return config.currency + " " +
    Number(value || 0).toLocaleString("es-DO");
}

function formatDate(date) {
  return new Date(date).toLocaleString("es-DO", {
    dateStyle: "short",
    timeStyle: "short"
  });
}

function toast(message, type = "") {
  const el = document.getElementById("toast");

  if (!el) return;

  el.textContent = message;
  el.className = "toast " + type;

  clearTimeout(window.__mfToastTimer);

  window.__mfToastTimer = setTimeout(() => {
    el.className = "toast hidden";
  }, 3000);
}

function openModal(html) {
  const modal = document.getElementById("modal");
  const card = document.getElementById("modalCard");

  card.innerHTML = html;
  modal.classList.remove("hidden");

  document.body.classList.add("modal-open");
}

function closeModal() {
  const modal = document.getElementById("modal");

  if (!modal) return;

  modal.classList.add("hidden");
  document.body.classList.remove("modal-open");
}

function randomId() {
  return Math.floor(Math.random() * 999999);
}

/* =========================
   DATOS INICIALES
========================= */

function seedData() {
  let products = getJSON(STORAGE.products, null);

  if (!products) {
    products = [
      {
        id: uid("product"),
        title: "iPhone 15 Pro",
        category: "Celulares",
        price: 52000,
        description: "iPhone 15 Pro en excelentes condiciones.",
        image:
          "https://images.unsplash.com/photo-1696446701796-da61225697cc?auto=format&fit=crop&w=900&q=80",
        seller: "Vendedor Market Flash",
        sellerId: "demo_seller_1",
        views: 0,
        likes: 0,
        sold: false,
        buyerConfirmed: false,
        sellerConfirmed: false,
        createdAt: Date.now()
      },

      {
        id: uid("product"),
        title: "Samsung Galaxy S24",
        category: "Celulares",
        price: 41000,
        description: "Samsung Galaxy S24. Excelente equipo.",
        image:
          "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=900&q=80",
        seller: "Tecnología Flash",
        sellerId: "demo_seller_2",
        views: 0,
        likes: 0,
        sold: false,
        buyerConfirmed: false,
        sellerConfirmed: false,
        createdAt: Date.now()
      },

      {
        id: uid("product"),
        title: "Laptop",
        category: "Computadoras",
        price: 35000,
        description: "Laptop para trabajo, estudios y entretenimiento.",
        image:
          "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80",
        seller: "Market Flash",
        sellerId: "demo_seller_3",
        views: 0,
        likes: 0,
        sold: false,
        buyerConfirmed: false,
        sellerConfirmed: false,
        createdAt: Date.now()
      },

      {
        id: uid("product"),
        title: "PlayStation 5",
        category: "Videojuegos",
        price: 39000,
        description: "PS5 en muy buen estado.",
        image:
          "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=900&q=80",
        seller: "Game Flash",
        sellerId: "demo_seller_4",
        views: 0,
        likes: 0,
        sold: false,
        buyerConfirmed: false,
        sellerConfirmed: false,
        createdAt: Date.now()
      }
    ];

    saveJSON(STORAGE.products, products);
  }

  if (!localStorage.getItem(STORAGE.ads)) {
    saveJSON(STORAGE.ads, []);
  }

  if (!localStorage.getItem(STORAGE.messages)) {
    saveJSON(STORAGE.messages, []);
  }

  if (!localStorage.getItem(STORAGE.claims)) {
    saveJSON(STORAGE.claims, []);
  }

  if (!localStorage.getItem(STORAGE.sanctions)) {
    saveJSON(STORAGE.sanctions, []);
  }

  if (!localStorage.getItem(STORAGE.stats)) {
    saveJSON(STORAGE.stats, {
      totalViews: 0,
      totalLikes: 0,
      totalAds: 0,
      totalUsers: 0
    });
  }
}

/* =========================
   NAVEGACIÓN
========================= */

let currentPage = "home";
let currentCategory = "Todos";
let searchTerm = "";

function setActiveNav(page) {
  document.querySelectorAll(".nav-item").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.page === page
    );
  });
}

function goPage(page) {
  currentPage = page;
  setActiveNav(page);

  if (page === "home") {
    renderHome();
  }

  if (page === "chat") {
    renderChat();
  }

  if (page === "activity") {
    renderActivity();
  }

  if (page === "profile") {
    renderProfile();
  }
}

/* =========================
   INICIO
========================= */

function renderHome() {
  const main = document.getElementById("mainContent");

  if (!main) return;

  main.innerHTML = `
    <section class="hero">
      <div>
        <small>MARKET FLASH</small>
        <h1>Encuentra lo que necesitas</h1>
        <p>Compra, vende y conecta con personas de tu zona.</p>
      </div>
    </section>

    <button id="flashDayBtn" class="flash-day" type="button">
      <div class="flash-icon">⚡</div>

      <div class="flash-copy">
        <span>PUBLICIDAD</span>
        <strong>Publicación Flash del Día</strong>
        <small>Descubre anuncios destacados y oportunidades.</small>
      </div>

      <div class="arrow">›</div>
    </button>

    <div class="section-title">
      <h2>Publicaciones</h2>
      <span id="productCount"></span>
    </div>

    <div id="categoryRow" class="chips"></div>

    <section id="productsGrid" class="products-grid"></section>
  `;

  document
    .getElementById("flashDayBtn")
    ?.addEventListener("click", showFlashDay);

  renderCategories();
  renderProducts();
}

/* =========================
   CATEGORÍAS
========================= */

function renderCategories() {
  const products = getJSON(STORAGE.products, []);
  const categories = [
    "Todos",
    ...new Set(
      products.map(product => product.category).filter(Boolean)
    )
  ];

  const row = document.getElementById("categoryRow");

  if (!row) return;

  row.innerHTML = categories.map(category => `
    <button
      class="chip ${currentCategory === category ? "active" : ""}"
      data-category="${escapeHTML(category)}"
    >
      ${escapeHTML(category)}
    </button>
  `).join("");

  row.querySelectorAll(".chip").forEach(button => {
    button.addEventListener("click", () => {
      currentCategory = button.dataset.category;
      renderCategories();
      renderProducts();
    });
  });
}

/* =========================
   PRODUCTOS
========================= */

function renderProducts() {
  const grid = document.getElementById("productsGrid");
  const count = document.getElementById("productCount");

  if (!grid) return;

  let products = getJSON(STORAGE.products, []);

  products = products.filter(product => !product.sold);

  if (currentCategory !== "Todos") {
    products = products.filter(
      product => product.category === currentCategory
    );
  }

  if (searchTerm.trim()) {
    const query = searchTerm.toLowerCase();

    products = products.filter(product =>
      `${product.title} ${product.description} ${product.category} ${product.seller}`
        .toLowerCase()
        .includes(query)
    );
  }

  if (count) {
    count.textContent = products.length + " publicación" +
      (products.length === 1 ? "" : "es");
  }

  if (!products.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <div>🔎</div>
        <h3>No encontramos publicaciones</h3>
        <p>Prueba otra búsqueda o categoría.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = products.map(product => `
    <article class="product-card">

      <button
        class="product-image-btn"
        data-product="${product.id}"
        type="button"
      >
        <img
          src="${escapeHTML(product.image)}"
          alt="${escapeHTML(product.title)}"
          loading="lazy"
        >
      </button>

      <div class="product-body">

        <div class="product-category">
          ${escapeHTML(product.category)}
        </div>

        <h3>${escapeHTML(product.title)}</h3>

        <strong class="product-price">
          ${money(product.price)}
        </strong>

        <p>
          ${escapeHTML(product.description)}
        </p>

        <div class="product-meta">
          <span>👁 ${product.views || 0}</span>
          <span>❤️ ${product.likes || 0}</span>
        </div>

        <div class="seller-line">
          <span>👤 ${escapeHTML(product.seller)}</span>
        </div>

        <button
          class="primary-btn open-product"
          data-product="${product.id}"
          type="button"
        >
          Ver publicación
        </button>

      </div>

    </article>
  `).join("");

  grid.querySelectorAll("[data-product]").forEach(button => {
    button.addEventListener("click", () => {
      openProduct(button.dataset.product);
    });
  });
}

/* =========================
   DETALLE PRODUCTO
========================= */

function openProduct(productId) {
  const products = getJSON(STORAGE.products, []);
  const product = products.find(item => item.id === productId);

  if (!product) return;

  product.views = Number(product.views || 0) + 1;

  saveJSON(STORAGE.products, products);

  const stats = getJSON(STORAGE.stats, {});
  stats.totalViews = Number(stats.totalViews || 0) + 1;
  saveJSON(STORAGE.stats, stats);

  openModal(`
    <div class="modal-header">
      <button class="close-modal" id="closeProduct">×</button>
      <h2>${escapeHTML(product.title)}</h2>
    </div>

    <div class="product-detail">

      <img
        class="detail-image"
        src="${escapeHTML(product.image)}"
        alt="${escapeHTML(product.title)}"
      >

      <div class="detail-category">
        ${escapeHTML(product.category)}
      </div>

      <h1>${escapeHTML(product.title)}</h1>

      <div class="detail-price">
        ${money(product.price)}
      </div>

      <p>${escapeHTML(product.description)}</p>

      <div class="detail-info">
        <span>👁 ${product.views || 0} vistas</span>
        <span>❤️ ${product.likes || 0} me gusta</span>
      </div>

      <div class="seller-card">
        <strong>Vendedor</strong>
        <span>${escapeHTML(product.seller)}</span>
        <small>⭐ Buena reputación</small>
      </div>

      <div class="action-stack">

        <button
          class="primary-btn"
          id="chatSeller"
        >
          💬 Chatear con vendedor
        </button>

        <button
          class="secondary-btn"
          id="whatsappSeller"
        >
          WhatsApp
        </button>

        <button
          class="secondary-btn"
          id="messengerSeller"
        >
          Messenger
        </button>

        <button
          class="secondary-btn"
          id="likeProduct"
        >
          ❤️ Me gusta
        </button>

        <button
          class="danger-outline"
          id="claimProduct"
        >
          ⚠️ Reclamar publicación
        </button>

      </div>

    </div>
  `);

  document
    .getElementById("closeProduct")
    ?.addEventListener("click", closeModal);

  document
    .getElementById("likeProduct")
    ?.addEventListener("click", () => likeProduct(product.id));

  document
    .getElementById("chatSeller")
    ?.addEventListener("click", () => openChatWithSeller(product));

  document
    .getElementById("whatsappSeller")
    ?.addEventListener("click", () => {
      const phone = product.phone || "";
      const text = encodeURIComponent(
        `Hola, vi tu publicación "${product.title}" en Market Flash.`
      );

      if (phone) {
        window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
      } else {
        toast("El vendedor todavía no agregó WhatsApp.");
      }
    });

  document
    .getElementById("messengerSeller")
    ?.addEventListener("click", () => {
      window.open("https://www.facebook.com/messages/", "_blank");
    });

  document
    .getElementById("claimProduct")
    ?.addEventListener("click", () => showClaimForm(product.id));
}

/* =========================
   LIKE
========================= */

function likeProduct(productId) {
  const products = getJSON(STORAGE.products, []);
  const product = products.find(item => item.id === productId);

  if (!product) return;

  product.likes = Number(product.likes || 0) + 1;

  saveJSON(STORAGE.products, products);

  const stats = getJSON(STORAGE.stats, {});
  stats.totalLikes = Number(stats.totalLikes || 0) + 1;
  saveJSON(STORAGE.stats, stats);

  toast("❤️ Me gusta agregado");
  closeModal();
  renderProducts();
}

/* =========================
   CHAT
========================= */

function getMessages() {
  return getJSON(STORAGE.messages, []);
}

function saveMessages(messages) {
  saveJSON(STORAGE.messages, messages);
}

function openChatWithSeller(product) {
  const user = currentUser();

  if (!user) {
    showLogin();
    return;
  }

  openChat(product.sellerId, product.seller, product.id);
}

function openChat(sellerId, sellerName, productId = "") {
  const user = currentUser();

  if (!user) {
    showLogin();
    return;
  }

  const messages = getMessages();

  const conversation = messages.filter(message =>
    (
      message.from === user.id &&
      message.to === sellerId
    ) ||
    (
      message.from === sellerId &&
      message.to === user.id
    )
  );

  openModal(`
    <div class="modal-header">
      <button class="close-modal" id="closeChat">×</button>
      <h2>💬 ${escapeHTML(sellerName)}</h2>
    </div>

    <div class="chat-window" id="chatWindow">

      ${
        conversation.length
          ? conversation.map(message => `
            <div class="chat-message ${
              message.from === user.id ? "mine" : "theirs"
            }">
              <div>${escapeHTML(message.text)}</div>
              <small>${formatDate(message.createdAt)}</small>
            </div>
          `).join("")
          : `
            <div class="chat-empty">
              <div>💬</div>
              <p>Comienza la conversación.</p>
            </div>
          `
      }

    </div>

    <div class="chat-controls">

      <textarea
        id="chatText"
        placeholder="Escribe un mensaje..."
        rows="2"
      ></textarea>

      <div class="chat-buttons">

        <button
          class="primary-btn"
          id="sendChat"
        >
          Enviar
        </button>

        <button
          class="danger-outline"
          id="claimChat"
        >
          ⚠️ Reclamar
        </button>

      </div>

    </div>
  `);

  document
    .getElementById("closeChat")
    ?.addEventListener("click", closeModal);

  document
    .getElementById("sendChat")
    ?.addEventListener("click", () => {
      const input = document.getElementById("chatText");
      const text = input.value.trim();

      if (!text) {
        toast("Escribe un mensaje.");
        return;
      }

      const allMessages = getMessages();

      allMessages.push({
        id: uid("message"),
        from: user.id,
        to: sellerId,
        productId,
        text,
        read: false,
        createdAt: Date.now()
      });

      saveMessages(allMessages);

      toast("Mensaje enviado");
      openChat(sellerId, sellerName, productId);
    });

  document
    .getElementById("claimChat")
    ?.addEventListener("click", () => {
      showClaimForm(productId, sellerId);
    });

  const windowChat = document.getElementById("chatWindow");

  if (windowChat) {
    windowChat.scrollTop = windowChat.scrollHeight;
  }
}

function renderChat() {
  const main = document.getElementById("mainContent");

  if (!main) return;

  const user = currentUser();

  if (!user) {
    main.innerHTML = `
      <section class="page-card">
        <div class="big-icon">💬</div>
        <h2>Tu Chat</h2>
        <p>Inicia sesión para ver tus conversaciones.</p>
        <button class="primary-btn" id="loginFromChat">
          Iniciar sesión
        </button>
      </section>
    `;

    document
      .getElementById("loginFromChat")
      ?.addEventListener("click", showLogin);

    return;
  }

  const messages = getMessages();

  const conversations = {};

  messages.forEach(message => {
    if (
      message.from !== user.id &&
      message.to !== user.id
    ) return;

    const other =
      message.from === user.id
        ? message.to
        : message.from;

    conversations[other] = message;
  });

  const list = Object.values(conversations);

  main.innerHTML = `
    <section class="page-card chat-page">

      <div class="page-heading">
        <div>
          <small>MARKET FLASH</small>
          <h2>💬 Mis conversaciones</h2>
        </div>
      </div>

      ${
        list.length
          ? list.map(message => `
            <button
              class="conversation"
              data-user="${escapeHTML(
                message.from === user.id
                  ? message.to
                  : message.from
              )}"
            >
              <span class="avatar">●</span>
              <span>
                <strong>
                  ${
                    message.from === user.id
                      ? "Conversación"
                      : "Nuevo mensaje"
                  }
                </strong>
                <small>${escapeHTML(message.text)}</small>
              </span>
            </button>
          `).join("")
          : `
            <div class="empty-state">
              <div>💬</div>
              <h3>No tienes conversaciones</h3>
              <p>Cuando contactes a un vendedor aparecerán aquí.</p>
            </div>
          `
      }

    </section>
  `;
}

/* =========================
   RECLAMOS
========================= */

function showClaimForm(productId = "", otherUser = "") {
  openModal(`
    <div class="modal-header">
      <button class="close-modal" id="closeClaim">×</button>
      <h2>⚠️ Reclamar</h2>
    </div>

    <div class="form-card">

      <p>
        Explica el problema. El reclamo será enviado al área
        especial de administración.
      </p>

      <label>Motivo</label>

      <select id="claimReason">
        <option>Problema con la publicación</option>
        <option>Posible estafa</option>
        <option>Producto diferente al anunciado</option>
        <option>Conducta inapropiada</option>
        <option>Otro</option>
      </select>

      <label>Descripción</label>

      <textarea
        id="claimText"
        rows="5"
        placeholder="Explica detalladamente lo ocurrido..."
      ></textarea>

      <label>Información adicional / evidencia</label>

      <textarea
        id="claimEvidence"
        rows="3"
        placeholder="Escribe aquí cualquier información útil..."
      ></textarea>

      <button
        class="primary-btn"
        id="sendClaim"
      >
        Enviar reclamo al administrador
      </button>

    </div>
  `);

  document
    .getElementById("closeClaim")
    ?.addEventListener("click", closeModal);

  document
    .getElementById("sendClaim")
    ?.addEventListener("click", () => {
      const user = currentUser();

      if (!user) {
        showLogin();
        return;
      }

      const description =
        document.getElementById("claimText").value.trim();

      if (!description) {
        toast("Escribe el motivo del reclamo.");
        return;
      }

      const claims = getJSON(STORAGE.claims, []);

      claims.push({
        id: uid("claim"),
        userId: user.id,
        userName: user.name,
        productId,
        otherUser,
        reason:
          document.getElementById("claimReason").value,
        description,
        evidence:
          document.getElementById("claimEvidence").value.trim(),
        status: "pending",
        createdAt: Date.now()
      });

      saveJSON(STORAGE.claims, claims);

      toast("⚠️ Reclamo enviado al administrador");
      closeModal();
      updateBadges();
    });
}

/* =========================
   ACTIVIDAD
========================= */

function renderActivity() {
  const main = document.getElementById("mainContent");

  if (!main) return;

  const user = currentUser();

  if (!user) {
    main.innerHTML = `
      <section class="page-card">
        <div class="big-icon">▣</div>
        <h2>Actividad</h2>
        <p>Inicia sesión para ver tu actividad.</p>
        <button class="primary-btn" id="loginActivity">
          Iniciar sesión
        </button>
      </section>
    `;

    document
      .getElementById("loginActivity")
      ?.addEventListener("click", showLogin);

    return;
  }

  const products = getJSON(STORAGE.products, []);

  const mine = products.filter(
    product => product.sellerId === user.id
  );

  main.innerHTML = `
    <section class="page-card">

      <div class="page-heading">
        <div>
          <small>MARKET FLASH</small>
          <h2>▣ Mi actividad</h2>
        </div>
      </div>

      <div class="stats-grid">
        <div>
          <strong>${mine.length}</strong>
          <small>Publicaciones</small>
        </div>

        <div>
          <strong>
            ${mine.reduce(
              (sum, product) =>
                sum + Number(product.views || 0),
              0
            )}
          </strong>
          <small>Vistas</small>
        </div>

        <div>
          <strong>
            ${mine.reduce(
              (sum, product) =>
                sum + Number(product.likes || 0),
              0
            )}
          </strong>
          <small>Me gusta</small>
        </div>
      </div>

      <h3>Mis publicaciones</h3>

      ${
        mine.length
          ? mine.map(product => `
            <div class="activity-item">

              <img
                src="${escapeHTML(product.image)}"
                alt=""
              >

              <div>
                <strong>${escapeHTML(product.title)}</strong>
                <span>${money(product.price)}</span>

                ${
                  product.sold
                    ? `<small class="sold-label">VENDIDO</small>`
                    : `
                      <button
                        class="secondary-btn mark-sold"
                        data-id="${product.id}"
                      >
                        Marcar como Vendido
                      </button>
                    `
                }

                ${
                  product.sellerConfirmed
                    ? `<small>✓ Tú confirmaste vendido</small>`
                    : ""
                }

              </div>

            </div>
          `).join("")
          : `
            <div class="empty-state">
              <div>📦</div>
              <p>Todavía no tienes publicaciones.</p>
            </div>
          `
      }

    </section>
  `;

  document.querySelectorAll(".mark-sold").forEach(button => {
    button.addEventListener("click", () => {
      markSold(button.dataset.id);
    });
  });
}

function markSold(productId) {
  const user = currentUser();

  if (!user) {
    showLogin();
    return;
  }

  const products = getJSON(STORAGE.products, []);
  const product = products.find(item => item.id === productId);

  if (!product) return;

  product.sellerConfirmed = true;

  if (product.buyerConfirmed) {
    product.sold = true;
  }

  saveJSON(STORAGE.products, products);

  toast(
    product.sold
      ? "✓ Venta confirmada por ambas partes"
      : "✓ Marcaste el producto como vendido"
  );

  renderActivity();
}

/* =========================
   PERFIL
========================= */

function renderProfile() {
  const main = document.getElementById("mainContent");

  if (!main) return;

  const user = currentUser();

  if (!user) {
    main.innerHTML = `
      <section class="page-card profile-login">

        <div class="avatar-large">●</div>

        <h2>Mi perfil</h2>

        <p>
          Crea tu cuenta para publicar, vender y chatear.
        </p>

        <button class="primary-btn" id="registerBtn">
          Crear cuenta
        </button>

        <button class="secondary-btn" id="loginBtn">
          Ya tengo una cuenta
        </button>

        <button class="admin-link" id="adminLoginBtn">
          Panel de administrador
        </button>

      </section>
    `;

    document
      .getElementById("registerBtn")
      ?.addEventListener("click", showRegister);

    document
      .getElementById("loginBtn")
      ?.addEventListener("click", showLogin);

    document
      .getElementById("adminLoginBtn")
      ?.addEventListener("click", showAdminLogin);

    return;
  }

  main.innerHTML = `
    <section class="page-card">

      <div class="profile-header">
        <div class="avatar-large">●</div>

        <div>
          <small>MI PERFIL</small>
          <h2>${escapeHTML(user.name)}</h2>
          <p>⭐ Reputación del vendedor: Excelente</p>
        </div>
      </div>

      <div class="profile-info">
        <div>
          <small>Cédula</small>
          <strong>${escapeHTML(user.cedula)}</strong>
        </div>

        <div>
          <small>Teléfono</small>
          <strong>${escapeHTML(user.phone)}</strong>
        </div>
      </div>

      <div class="profile-actions">

        <button class="secondary-btn" id="changePassword">
          🔐 Cambiar contraseña
        </button>

        <button class="secondary-btn" id="adminPanel">
          ⚙️ Panel de administración
        </button>

        <button class="secondary-btn" id="logoutBtn">
          Cerrar sesión
        </button>

        <button class="danger-btn" id="deleteAccount">
          Eliminar mi cuenta
        </button>

      </div>

    </section>
  `;

  document
    .getElementById("changePassword")
    ?.addEventListener("click", showChangePassword);

  document
    .getElementById("adminPanel")
    ?.addEventListener("click", showAdminLogin);

  document
    .getElementById("logoutBtn")
    ?.addEventListener("click", () => {
      setCurrentUser(null);
      toast("Sesión cerrada");
      renderProfile();
      updateBadges();
    });

  document
    .getElementById("deleteAccount")
    ?.addEventListener("click", deleteAccount);
}

/* =========================
   REGISTRO
========================= */

function showRegister() {
  openModal(`
    <div class="modal-header">
      <button class="close-modal" id="closeRegister">×</button>
      <h2>Crear cuenta</h2>
    </div>

    <div class="form-card">

      <label>Nombre completo</label>
      <input id="registerName" placeholder="Tu nombre">

      <label>Número de cédula</label>
      <input id="registerCedula" placeholder="000-0000000-0">

      <label>Número de teléfono</label>
      <input id="registerPhone" placeholder="8090000000">

      <label>Contraseña</label>
      <input id="registerPassword" type="password">

      <label>Confirmar contraseña</label>
      <input id="registerPassword2" type="password">

      <button class="primary-btn" id="createAccount">
        Crear mi cuenta
      </button>

      <button class="secondary-btn" id="goLogin">
        Ya tengo cuenta
      </button>

    </div>
  `);

  document
    .getElementById("closeRegister")
    ?.addEventListener("click", closeModal);

  document
    .getElementById("goLogin")
    ?.addEventListener("click", showLogin);

  document
    .getElementById("createAccount")
    ?.addEventListener("click", registerUser);
}

function registerUser() {
  const name =
    document.getElementById("registerName").value.trim();

  const cedula =
    document.getElementById("registerCedula").value.trim();

  const phone =
    document.getElementById("registerPhone").value.trim();

  const password =
    document.getElementById("registerPassword").value;

  const password2 =
    document.getElementById("registerPassword2").value;

  if (!name || !cedula || !phone || !password) {
    toast("Completa todos los campos.");
    return;
  }

  if (password !== password2) {
    toast("Las contraseñas no coinciden.");
    return;
  }

  const user = {
    id: uid("user"),
    name,
    cedula,
    phone,
    password,
    createdAt: Date.now()
  };

  setCurrentUser(user);

  const stats = getJSON(STORAGE.stats, {});
  stats.totalUsers = Number(stats.totalUsers || 0) + 1;
  saveJSON(STORAGE.stats, stats);

  toast("🎉 Cuenta creada correctamente");
  closeModal();
  renderProfile();
  updateBadges();
}

/* =========================
   LOGIN
========================= */

function showLogin() {
  openModal(`
    <div class="modal-header">
      <button class="close-modal" id="closeLogin">×</button>
      <h2>Iniciar sesión</h2>
    </div>

    <div class="form-card">

      <label>Cédula o teléfono</label>
      <input id="loginIdentifier">

      <label>Contraseña</label>
      <input id="loginPassword" type="password">

      <button class="primary-btn" id="doLogin">
        Entrar
      </button>

      <button class="secondary-btn" id="newAccount">
        Crear cuenta
      </button>

    </div>
  `);

  document
    .getElementById("closeLogin")
    ?.addEventListener("click", closeModal);

  document
    .getElementById("newAccount")
    ?.addEventListener("click", showRegister);

  document
    .getElementById("doLogin")
    ?.addEventListener("click", loginUser);
}

function loginUser() {
  /*
    En este prototipo los usuarios se guardan localmente.
    Para una aplicación real se necesita una base de datos
    y autenticación en servidor.
  */

  const identifier =
    document.getElementById("loginIdentifier").value.trim();

  const password =
    document.getElementById("loginPassword").value;

  const saved = currentUser();

  if (
    saved &&
    (
      saved.cedula === identifier ||
      saved.phone === identifier
    ) &&
    saved.password === password
  ) {
    toast("Bienvenido/a " + saved.name);
    closeModal();
    renderProfile();
    return;
  }

  toast(
    "En este prototipo solo se puede iniciar sesión con la cuenta registrada en este dispositivo."
  );
}

/* =========================
   CAMBIAR CONTRASEÑA
========================= */

function showChangePassword() {
  openModal(`
    <div class="modal-header">
      <button class="close-modal" id="closePassword">×</button>
      <h2>🔐 Cambiar contraseña</h2>
    </div>

    <div class="form-card">

      <label>Contraseña actual</label>
      <input id="oldPassword" type="password">

      <label>Nueva contraseña</label>
      <input id="newPassword" type="password">

      <label>Confirmar nueva contraseña</label>
      <input id="newPassword2" type="password">

      <button class="primary-btn" id="savePassword">
        Guardar contraseña
      </button>

    </div>
  `);

  document
    .getElementById("closePassword")
    ?.addEventListener("click", closeModal);

  document
    .getElementById("savePassword")
    ?.addEventListener("click", changePassword);
}

function changePassword() {
  const user = currentUser();

  if (!user) return;

  const oldPassword =
    document.getElementById("oldPassword").value;

  const newPassword =
    document.getElementById("newPassword").value;

  const newPassword2 =
    document.getElementById("newPassword2").value;

  if (oldPassword !== user.password) {
    toast("La contraseña actual es incorrecta.");
    return;
  }

  if (!newPassword || newPassword.length < 6) {
    toast("La nueva contraseña debe tener al menos 6 caracteres.");
    return;
  }

  if (newPassword !== newPassword2) {
    toast("Las contraseñas nuevas no coinciden.");
    return;
  }

  user.password = newPassword;
  setCurrentUser(user);

  toast("Contraseña cambiada correctamente");
  closeModal();
}

/* =========================
   ELIMINAR CUENTA
========================= */

function deleteAccount() {
  const user = currentUser();

  if (!user) return;

  const confirmed = confirm(
    "¿Seguro que quieres eliminar tu cuenta?"
  );

  if (!confirmed) return;

  user.deletedAt = Date.now();

  /*
    Guardamos registro local de la eliminación para que
    el administrador pueda visualizarla en este prototipo.
  */

  const deletedUsers =
    getJSON("mf_deleted_users_v2", []);

  deletedUsers.push(user);

  saveJSON("mf_deleted_users_v2", deletedUsers);

  setCurrentUser(null);

  toast("Tu cuenta fue eliminada.");

  renderProfile();
}

/* =========================
   PUBLICAR PRODUCTO
========================= */

function showPublish() {
  const user = currentUser();

  if (!user) {
    showLogin();
    return;
  }

  openModal(`
    <div class="modal-header">
      <button class="close-modal" id="closePublish">×</button>
      <h2>＋ Publicar producto</h2>
    </div>

    <div class="form-card">

      <label>Nombre del producto</label>
      <input id="productTitle" placeholder="Ej.: iPhone 16">

      <label>Categoría</label>
      <select id="productCategory">
        <option>Celulares</option>
        <option>Computadoras</option>
        <option>Electrodomésticos</option>
        <option>Vehículos</option>
        <option>Videojuegos</option>
        <option>Ropa</option>
        <option>Hogar</option>
        <option>Otros</option>
      </select>

      <label>Precio</label>
      <input
        id="productPrice"
        type="number"
        min="0"
        placeholder="0"
      >

      <label>Descripción</label>
      <textarea
        id="productDescription"
        rows="5"
        placeholder="Describe el producto..."
      ></textarea>

      <label>Foto del producto</label>
      <input
        id="productImage"
        type="file"
        accept="image/*"
        capture="environment"
      >

      <button
        class="primary-btn"
        id="publishProduct"
      >
        Publicar
      </button>

    </div>
  `);

  document
    .getElementById("closePublish")
    ?.addEventListener("click", closeModal);

  document
    .getElementById("publishProduct")
    ?.addEventListener("click", createProduct);
}

function createProduct() {
  const user = currentUser();

  if (!user) return;

  const title =
    document.getElementById("productTitle").value.trim();

  const category =
    document.getElementById("productCategory").value;

  const price =
    Number(document.getElementById("productPrice").value);

  const description =
    document.getElementById("productDescription").value.trim();

  const imageInput =
    document.getElementById("productImage");

  if (!title || !price || !description) {
    toast("Completa los datos del producto.");
    return;
  }

  const file = imageInput.files[0];

  if (file) {
    const reader = new FileReader();

    reader.onload = event => {
      saveProduct(
        title,
        category,
        price,
        description,
        event.target.result
      );
    };

    reader.readAsDataURL(file);
  } else {
    saveProduct(
      title,
      category,
      price,
      description,
      "https://images.unsplash.com/photo-1560393464-5c69a73c5c18?auto=format&fit=crop&w=900&q=80"
    );
  }
}

function saveProduct(
  title,
  category,
  price,
  description,
  image
) {
  const user = currentUser();

  const products = getJSON(STORAGE.products, []);

  products.unshift({
    id: uid("product"),
    title,
    category,
    price,
    description,
    image,
    seller: user.name,
    sellerId: user.id,
    phone: user.phone,
    views: 0,
    likes: 0,
    sold: false,
    buyerConfirmed: false,
    sellerConfirmed: false,
    createdAt: Date.now()
  });

  saveJSON(STORAGE.products, products);

  toast("🎉 Publicación creada");
  closeModal();

  currentCategory = "Todos";
  searchTerm = "";

  renderHome();
}

/* =========================
   COMPRADOR — MARCAR COMPRADO
========================= */

function markPurchased(productId) {
  const user = currentUser();

  if (!user) {
    showLogin();
    return;
  }

  const products = getJSON(STORAGE.products, []);
  const product = products.find(item => item.id === productId);

  if (!product) return;

  product.buyerConfirmed = true;

  if (product.sellerConfirmed) {
    product.sold = true;
  }

  saveJSON(STORAGE.products, products);

  toast(
    product.sold
      ? "✓ Compra confirmada por ambas partes"
      : "✓ Marcaste el producto como comprado"
  );

  closeModal();
  renderHome();
}

/* =========================
   FLASH DEL DÍA
========================= */

let flashIndex = 0;
let flashTimer = null;

function approvedAds() {
  return getJSON(STORAGE.ads, [])
    .filter(ad => ad.status === "approved");
}

function showFlashDay() {
  const ads = approvedAds();

  if (!ads.length) {
    openModal(`
      <div class="modal-header">
        <button class="close-modal" id="closeFlash">×</button>
        <h2>⚡ Publicación Flash del Día</h2>
      </div>

      <div class="empty-state">
        <div>⚡</div>
        <h3>Próximamente</h3>
        <p>
          Todavía no hay publicidad aprobada.
        </p>

        <button
          class="primary-btn"
          id="advertiseNow"
        >
          Publicar mi publicidad
        </button>
      </div>
    `);

    document
      .getElementById("closeFlash")
      ?.addEventListener("click", closeModal);

    document
      .getElementById("advertiseNow")
      ?.addEventListener("click", showAdvertising);

    return;
  }

  flashIndex = 0;

  openModal(`
    <div class="modal-header">
      <button class="close-modal" id="closeFlash">×</button>
      <h2>⚡ Flash del Día</h2>
    </div>

    <div id="flashContent"></div>

    <button
      class="secondary-btn"
      id="nextFlash"
    >
      Siguiente anuncio →
    </button>

    <button
      class="primary-btn"
      id="advertiseFlash"
    >
      📣 Publicar mi publicidad
    </button>
  `);

  document
    .getElementById("closeFlash")
    ?.addEventListener("click", () => {
      clearInterval(flashTimer);
      closeModal();
    });

  document
    .getElementById("nextFlash")
    ?.addEventListener("click", () => {
      flashIndex =
        (flashIndex + 1) % approvedAds().length;

      renderFlashAd();
    });

  document
    .getElementById("advertiseFlash")
    ?.addEventListener("click", showAdvertising);

  renderFlashAd();

  clearInterval(flashTimer);

  flashTimer = setInterval(() => {
    const modal = document.getElementById("modal");

    if (modal?.classList.contains("hidden")) {
      clearInterval(flashTimer);
      return;
    }

    const ads = approvedAds();

    if (!ads.length) return;

    flashIndex = (flashIndex + 1) % ads.length;

    renderFlashAd();
  }, 5000);
}

function renderFlashAd() {
  const container =
    document.getElementById("flashContent");

  const ads = approvedAds();

  if (!container || !ads.length) return;

  const ad = ads[flashIndex % ads.length];

  let media = "";

  if (ad.mediaType === "video") {
    media = `
      <video
        class="flash-media"
        src="${escapeHTML(ad.media)}"
        autoplay
        muted
        loop
        playsinline
        controls
      ></video>
    `;
  } else {
    media = `
      <img
        class="flash-media"
        src="${escapeHTML(ad.media)}"
        alt="${escapeHTML(ad.title)}"
      >
    `;
  }

  container.innerHTML = `
    <article class="flash-ad-card">

      ${media}

      <div class="flash-ad-copy">
        <span>PUBLICIDAD DESTACADA</span>

        <h3>${escapeHTML(ad.title)}</h3>

        <p>${escapeHTML(ad.description)}</p>

        <small>
          Publicidad ${escapeHTML(ad.planName || "")}
        </small>
      </div>

    </article>
  `;
}

/* =========================
   PUBLICIDAD
========================= */

function showAdvertising() {
  const user = currentUser();

  if (!user) {
    showLogin();
    return;
  }

  const config = getConfig();

  const methods = Object.entries(config.payments)
    .filter(([, value]) => value.enabled);

  openModal(`
    <div class="modal-header">
      <button class="close-modal" id="closeAdvertising">×</button>
      <h2>📣 Publicar publicidad</h2>
    </div>

    <div class="form-card">

      <label>Título de la publicidad</label>
      <input
        id="adTitle"
        placeholder="Nombre de tu negocio o producto"
      >

      <label>Descripción</label>
      <textarea
        id="adDescription"
        rows="4"
        placeholder="Describe tu oferta..."
      ></textarea>

      <label>Foto o video</label>

      <input
        id="adMedia"
        type="file"
        accept="image/*,video/*"
        capture="environment"
      >

      <label>Plan de publicidad</label>

      <select id="adPlan">

        <option value="cheap">
          ${escapeHTML(config.plans.cheap.name)}
          — ${money(config.plans.cheap.price)}
        </option>

        <option value="normal">
          ${escapeHTML(config.plans.normal.name)}
          — ${money(config.plans.normal.price)}
        </option>

        <option value="pro">
          ${escapeHTML(config.plans.pro.name)}
          — ${money(config.plans.pro.price)}
        </option>

      </select>

      <label>Método de pago</label>

      <select id="adPayment">

        ${
          methods.length
            ? methods.map(([name, data]) => `
              <option value="${escapeHTML(name)}">
                ${escapeHTML(name)}
              </option>
            `).join("")
            : `<option>No hay métodos disponibles</option>`
        }

      </select>

      <div id="paymentInfo" class="payment-info"></div>

      <label>Comprobante de pago</label>

      <input
        id="adProof"
        type="file"
        accept="image/*,.pdf"
      >

      <button
        class="primary-btn"
        id="submitAdvertising"
      >
        Enviar publicidad para revisión
      </button>

    </div>
  `);

  document
    .getElementById("closeAdvertising")
    ?.addEventListener("click", closeModal);

  document
    .getElementById("adPlan")
    ?.addEventListener("change", updatePaymentInfo);

  document
    .getElementById("adPayment")
    ?.addEventListener("change", updatePaymentInfo);

  document
    .getElementById("submitAdvertising")
    ?.addEventListener("click", submitAdvertising);

  updatePaymentInfo();
}

function updatePaymentInfo() {
  const config = getConfig();

  const plan =
    document.getElementById("adPlan")?.value;

  const method =
    document.getElementById("adPayment")?.value;

  const box =
    document.getElementById("paymentInfo");

  if (!box || !plan || !method) return;

  const payment = config.payments[method];

  if (!payment) return;

  box.innerHTML = `
    <strong>${escapeHTML(method)}</strong>

    <p>
      Cuenta / dato de pago:
      <b>${escapeHTML(payment.account)}</b>
    </p>

    <p>
      Total:
      <strong>${money(payment[plan])}</strong>
    </p>
  `;
}

function submitAdvertising() {
  const user = currentUser();

  if (!user) {
    showLogin();
    return;
  }

  const title =
    document.getElementById("adTitle").value.trim();

  const description =
    document.getElementById("adDescription").value.trim();

  const plan =
    document.getElementById("adPlan").value;

  const payment =
    document.getElementById("adPayment").value;

  const mediaInput =
    document.getElementById("adMedia");

  const proofInput =
    document.getElementById("adProof");

  if (!title || !description) {
    toast("Completa el título y la descripción.");
    return;
  }

  if (!mediaInput.files[0]) {
    toast("Selecciona una foto o video.");
    return;
  }

  if (!proofInput.files[0]) {
    toast("Debes adjuntar el comprobante de pago.");
    return;
  }

  const mediaFile = mediaInput.files[0];
  const proofFile = proofInput.files[0];

  const mediaReader = new FileReader();

  mediaReader.onload = event => {

    const media =
      event.target.result;

    const proofReader = new FileReader();

    proofReader.onload = proofEvent => {

      const config = getConfig();

      const ads = getJSON(STORAGE.ads, []);

      ads.push({
        id: uid("ad"),
        userId: user.id,
        userName: user.name,
        title,
        description,
        media,
        mediaType:
          mediaFile.type.startsWith("video/")
            ? "video"
            : "image",
        proof: proofEvent.target.result,
        proofName: proofFile.name,
        plan,
        planName: config.plans[plan].name,
        paymentMethod: payment,
        amount:
          config.payments[payment]?.[plan] ||
          config.plans[plan].price,
        status: "pending",
        createdAt: Date.now()
      });

      saveJSON(STORAGE.ads, ads);

      const stats =
        getJSON(STORAGE.stats, {});

      stats.totalAds =
        Number(stats.totalAds || 0) + 1;

      saveJSON(STORAGE.stats, stats);

      toast(
        "📣 Publicidad enviada. Esperando aprobación."
      );

      closeModal();
      updateBadges();
    };

    proofReader.readAsDataURL(proofFile);
  };

  mediaReader.readAsDataURL(mediaFile);
}

/* =========================
   ADMIN
========================= */

function showAdminLogin() {
  openModal(`
    <div class="modal-header">
      <button class="close-modal" id="closeAdminLogin">×</button>
      <h2>🔐 Administrador</h2>
    </div>

    <div class="form-card">

      <p>
        Introduce la contraseña del panel de administración.
      </p>

      <input
        id="adminPassword"
        type="password"
        placeholder="Contraseña"
      >

      <button
        class="primary-btn"
        id="enterAdmin"
      >
        Entrar al panel
      </button>

    </div>
  `);

  document
    .getElementById("closeAdminLogin")
    ?.addEventListener("click", closeModal);

  document
    .getElementById("enterAdmin")
    ?.addEventListener("click", () => {

      const config = getConfig();

      const password =
        document.getElementById("adminPassword").value;

      if (password !== config.adminPassword) {
        toast("Contraseña incorrecta.");
        return;
      }

      closeModal();
      showAdminPanel();
    });
}

function showAdminPanel() {
  const config = getConfig();

  const ads = getJSON(STORAGE.ads, []);
  const claims = getJSON(STORAGE.claims, []);
  const sanctions = getJSON(STORAGE.sanctions, []);
  const messages = getMessages();
  const deletedUsers =
    getJSON("mf_deleted_users_v2", []);

  const products =
    getJSON(STORAGE.products, []);

  const pendingAds =
    ads.filter(ad => ad.status === "pending");

  openModal(`
    <div class="admin-panel">

      <div class="admin-header">

        <div>
          <small>MARKET FLASH</small>
          <h2>⚙️ Panel de Administración</h2>
        </div>

        <button
          class="close-modal"
          id="closeAdmin"
        >
          ×
        </button>

      </div>

      ${
        pendingAds.length
          ? `
            <button
              class="admin-alert"
              id="pendingAlert"
            >
              🔴 ${pendingAds.length}
              publicidad(es) pendiente(s)
            </button>
          `
          : ""
      }

      <div class="admin-stats">

        <div>
          <strong>${products.length}</strong>
          <small>Publicaciones</small>
        </div>

        <div>
          <strong>${ads.length}</strong>
          <small>Publicidad</small>
        </div>

        <div>
          <strong>${claims.length}</strong>
          <small>Reclamos</small>
        </div>

        <div>
          <strong>${deletedUsers.length}</strong>
          <small>Cuentas eliminadas</small>
        </div>

      </div>

      <div class="admin-menu">

        <button data-admin="ads">
          📣 Publicidad
        </button>

        <button data-admin="payments">
          💳 Pagos y precios
        </button>

        <button data-admin="claims">
          ⚠️ Reclamos
        </button>

        <button data-admin="users">
          👥 Usuarios
        </button>

        <button data-admin="messages">
          💬 Chat administrativo
        </button>

        <button data-admin="sanctions">
          🚫 Sanciones y multas
        </button>

        <button data-admin="password">
          🔐 Cambiar contraseña
        </button>

        <button data-admin="settings">
          ⚙️ Configuración del panel
        </button>

      </div>

      <div id="adminSection"></div>

    </div>
  `);

  document
    .getElementById("closeAdmin")
    ?.addEventListener("click", closeModal);

  document
    .getElementById("pendingAlert")
    ?.addEventListener("click", () => {
      renderAdminAds();
    });

  document
    .querySelectorAll("[data-admin]")
    .forEach(button => {
      button.addEventListener("click", () => {

        const section =
          button.dataset.admin;

        if (section === "ads") {
          renderAdminAds();
        }

        if (section === "payments") {
          renderAdminPayments();
        }

        if (section === "claims") {
          renderAdminClaims();
        }

        if (section === "users") {
          renderAdminUsers();
        }

        if (section === "messages") {
          renderAdminMessages();
        }

        if (section === "sanctions") {
          renderAdminSanctions();
        }

        if (section === "password") {
          renderAdminPassword();
        }

        if (section === "settings") {
          renderAdminSettings();
        }
      });
    });

  renderAdminAds();
}

/* =========================
   ADMIN — PUBLICIDAD
========================= */

function renderAdminAds() {
  const box =
    document.getElementById("adminSection");

  if (!box) return;

  const ads =
    getJSON(STORAGE.ads, []);

  box.innerHTML = `
    <div class="admin-section">

      <h3>📣 Solicitudes de publicidad</h3>

      ${
        ads.length
          ? ads.slice().reverse().map(ad => `
            <div class="admin-ad">

              ${
                ad.mediaType === "video"
                  ? `
                    <video
                      src="${escapeHTML(ad.media)}"
                      controls
                    ></video>
                  `
                  : `
                    <img
                      src="${escapeHTML(ad.media)}"
                      alt=""
                    >
                  `
              }

              <div>

                <span class="status ${ad.status}">
                  ${escapeHTML(ad.status)}
                </span>

                <h4>${escapeHTML(ad.title)}</h4>

                <p>${escapeHTML(ad.description)}</p>

                <small>
                  Usuario:
                  ${escapeHTML(ad.userName)}
                </small>

                <small>
                  Plan:
                  ${escapeHTML(ad.planName)}
                </small>

                <small>
                  Pago:
                  ${escapeHTML(ad.paymentMethod)}
                </small>

                <small>
                  Total:
                  ${money(ad.amount)}
                </small>

                <div class="admin-buttons">

                  <button
                    class="secondary-btn view-proof"
                    data-id="${ad.id}"
                  >
                    Ver comprobante
                  </button>

                  ${
                    ad.status === "pending"
                      ? `
                        <button
                          class="primary-btn approve-ad"
                          data-id="${ad.id}"
                        >
                          ✓ Aprobar
                        </button>

                        <button
                          class="danger-btn reject-ad"
                          data-id="${ad.id}"
                        >
                          ✕ Rechazar
                        </button>
                      `
                      : ""
                  }

                </div>

              </div>

            </div>
          `).join("")
          : `
            <div class="empty-state">
              <div>📣</div>
              <p>No hay solicitudes de publicidad.</p>
            </div>
          `
      }

    </div>
  `;

  document
    .querySelectorAll(".approve-ad")
    .forEach(button => {
      button.addEventListener("click", () => {
        changeAdStatus(button.dataset.id, "approved");
      });
    });

  document
    .querySelectorAll(".reject-ad")
    .forEach(button => {
      button.addEventListener("click", () => {
        changeAdStatus(button.dataset.id, "rejected");
      });
    });

  document
    .querySelectorAll(".view-proof")
    .forEach(button => {
      button.addEventListener("click", () => {
        viewProof(button.dataset.id);
      });
    });
}

function changeAdStatus(id, status) {
  const ads =
    getJSON(STORAGE.ads, []);

  const ad =
    ads.find(item => item.id === id);

  if (!ad) return;

  ad.status = status;
  ad.reviewedAt = Date.now();

  saveJSON(STORAGE.ads, ads);

  toast(
    status === "approved"
      ? "✓ Publicidad aprobada"
      : "Publicidad rechazada"
  );

  renderAdminAds();
  updateBadges();
}

function viewProof(id) {
  const ads =
    getJSON(STORAGE.ads, []);

  const ad =
    ads.find(item => item.id === id);

  if (!ad) return;

  openModal(`
    <div class="modal-header">
      <button class="close-modal" id="closeProof">×</button>
      <h2>🧾 Comprobante</h2>
    </div>

    <div class="proof-view">

      <h3>${escapeHTML(ad.title)}</h3>

      <p>
        ${escapeHTML(ad.paymentMethod)}
      </p>

      <p>
        Total: <strong>${money(ad.amount)}</strong>
      </p>

      ${
        String(ad.proof || "").startsWith("data:image")
          ? `
            <img
              src="${escapeHTML(ad.proof)}"
              alt="Comprobante"
            >
          `
          : `
            <p>
              Comprobante:
              ${escapeHTML(ad.proofName || "Archivo")}
            </p>
          `
      }

    </div>
  `);

  document
    .getElementById("closeProof")
    ?.addEventListener("click", closeModal);
}

/* =========================
   ADMIN — PAGOS
========================= */

function renderAdminPayments() {
  const config = getConfig();
  const box =
    document.getElementById("adminSection");

  if (!box) return;

  box.innerHTML = `
    <div class="admin-section">

      <h3>💳 Métodos de pago y precios</h3>

      <p>
        Puedes activar/desactivar métodos y cambiar
        los precios de cada plan.
      </p>

      ${
        Object.entries(config.payments).map(
          ([name, payment]) => `
            <div class="payment-admin-card">

              <h4>${escapeHTML(name)}</h4>

              <label>
                <input
                  type="checkbox"
                  class="payment-enabled"
                  data-method="${escapeHTML(name)}"
                  ${payment.enabled ? "checked" : ""}
                >
                Método activo
              </label>

              <label>Cuenta / información de pago</label>

              <input
                class="payment-account"
                data-method="${escapeHTML(name)}"
                value="${escapeHTML(payment.account)}"
              >

              <div class="price-grid">

                <label>
                  Básico
                  <input
                    type="number"
                    class="payment-price"
                    data-method="${escapeHTML(name)}"
                    data-plan="cheap"
                    value="${payment.cheap}"
                  >
                </label>

                <label>
                  Destacado
                  <input
                    type="number"
                    class="payment-price"
                    data-method="${escapeHTML(name)}"
                    data-plan="normal"
                    value="${payment.normal}"
                  >
                </label>

                <label>
                  Premium
                  <input
                    type="number"
                    class="payment-price"
                    data-method="${escapeHTML(name)}"
                    data-plan="pro"
                    value="${payment.pro}"
                  >
                </label>

              </div>

            </div>
          `
        ).join("")
      }

      <button
        class="primary-btn"
        id="savePayments"
      >
        Guardar métodos y precios
      </button>

    </div>
  `;

  document
    .getElementById("savePayments")
    ?.addEventListener("click", savePayments);
}

function savePayments() {
  const config = getConfig();

  Object.entries(config.payments)
    .forEach(([name, payment]) => {

      const enabled =
        document.querySelector(
          `.payment-enabled[data-method="${CSS.escape(name)}"]`
        );

      const account =
        document.querySelector(
          `.payment-account[data-method="${CSS.escape(name)}"]`
        );

      payment.enabled = !!enabled?.checked;

      if (account) {
        payment.account = account.value.trim();
      }

      ["cheap", "normal", "pro"].forEach(plan => {

        const input =
          document.querySelector(
            `.payment-price[data-method="${CSS.escape(name)}"][data-plan="${plan}"]`
          );

        if (input) {
          payment[plan] = Number(input.value || 0);
        }
      });
    });

  saveJSON(STORAGE.config, config);

  toast("✓ Configuración de pagos guardada");
}

/* =========================
   ADMIN — RECLAMOS
========================= */

function renderAdminClaims() {
  const box =
    document.getElementById("adminSection");

  if (!box) return;

  const claims =
    getJSON(STORAGE.claims, []);

  box.innerHTML = `
    <div class="admin-section">

      <h3>⚠️ Reclamos</h3>

      ${
        claims.length
          ? claims.slice().reverse().map(claim => `
            <div class="claim-admin">

              <span class="status ${claim.status}">
                ${escapeHTML(claim.status)}
              </span>

              <h4>
                ${escapeHTML(claim.reason)}
              </h4>

              <p>
                <strong>Usuario:</strong>
                ${escapeHTML(claim.userName)}
              </p>

              <p>
                ${escapeHTML(claim.description)}
              </p>

              ${
                claim.evidence
                  ? `
                    <p>
                      <strong>Evidencia:</strong>
                      ${escapeHTML(claim.evidence)}
                    </p>
                  `
                  : ""
              }

              <small>
                ${formatDate(claim.createdAt)}
              </small>

              ${
                claim.status === "pending"
                  ? `
                    <div class="admin-buttons">

                      <button
                        class="primary-btn resolve-claim"
                        data-id="${claim.id}"
                      >
                        ✓ Resolver
                      </button>

                      <button
                        class="danger-btn sanction-claim"
                        data-id="${claim.id}"
                      >
                        🚫 Sancionar
                      </button>

                    </div>
                  `
                  : ""
              }

            </div>
          `).join("")
          : `
            <div class="empty-state">
              <div>⚠️</div>
              <p>No hay reclamos.</p>
            </div>
          `
      }

    </div>
  `;

  document
    .querySelectorAll(".resolve-claim")
    .forEach(button => {
      button.addEventListener("click", () => {
        resolveClaim(button.dataset.id);
      });
    });

  document
    .querySelectorAll(".sanction-claim")
    .forEach(button => {
      button.addEventListener("click", () => {
        sanctionFromClaim(button.dataset.id);
      });
    });
}

function resolveClaim(id) {
  const claims =
    getJSON(STORAGE.claims, []);

  const claim =
    claims.find(item => item.id === id);

  if (!claim) return;

  claim.status = "resolved";
  claim.resolvedAt = Date.now();

  saveJSON(STORAGE.claims, claims);

  toast("✓ Reclamo resuelto");
  renderAdminClaims();
}

function sanctionFromClaim(id) {
  const claims =
    getJSON(STORAGE.claims, []);

  const claim =
    claims.find(item => item.id === id);

  if (!claim) return;

  showSanctionForm(claim.userId, claim.userName, id);
}

/* =========================
   ADMIN — USUARIOS
========================= */

function renderAdminUsers() {
  const box =
    document.getElementById("adminSection");

  if (!box) return;

  const deletedUsers =
    getJSON("mf_deleted_users_v2", []);

  const user =
    currentUser();

  box.innerHTML = `
    <div class="admin-section">

      <h3>👥 Usuarios</h3>

      <div class="user-admin-card">

        <h4>Usuario registrado en este dispositivo</h4>

        ${
          user
            ? `
              <p>
                <strong>Nombre:</strong>
                ${escapeHTML(user.name)}
              </p>

              <p>
                <strong>Cédula:</strong>
                ${escapeHTML(user.cedula)}
              </p>

              <p>
                <strong>Teléfono:</strong>
                ${escapeHTML(user.phone)}
              </p>

              <p>
                <strong>Registro:</strong>
                ${formatDate(user.createdAt)}
              </p>
            `
            : `
              <p>No hay usuario activo.</p>
            `
        }

      </div>

      <h4>Cuentas eliminadas</h4>

      ${
        deletedUsers.length
          ? deletedUsers.map(user => `
            <div class="deleted-user">
              <strong>${escapeHTML(user.name)}</strong>
              <small>${escapeHTML(user.phone)}</small>
              <small>Eliminada: ${formatDate(user.deletedAt)}</small>
            </div>
          `).join("")
          : `<p>No hay cuentas eliminadas.</p>`
      }

    </div>
  `;
}

/* =========================
   ADMIN — CHAT
========================= */

function renderAdminMessages() {
  const box =
    document.getElementById("adminSection");

  if (!box) return;

  const messages =
    getMessages();

  box.innerHTML = `
    <div class="admin-section">

      <h3>💬 Chat administrativo</h3>

      <p>
        Aquí aparecen los mensajes relacionados con
        la administración y los reclamos.
      </p>

      ${
        messages.length
          ? messages.slice().reverse().map(message => `
            <div class="admin-message">

              <small>
                ${formatDate(message.createdAt)}
              </small>

              <p>
                ${escapeHTML(message.text)}
              </p>

              <small>
                De:
                ${escapeHTML(message.from)}
              </small>

              <small>
                Para:
                ${escapeHTML(message.to)}
              </small>

            </div>
          `).join("")
          : `
            <div class="empty-state">
              <div>💬</div>
              <p>No hay mensajes.</p>
            </div>
          `
      }

    </div>
  `;
}

/* =========================
   ADMIN — SANCIONES
========================= */

function renderAdminSanctions() {
  const box =
    document.getElementById("adminSection");

  if (!box) return;

  const sanctions =
    getJSON(STORAGE.sanctions, []);

  box.innerHTML = `
    <div class="admin-section">

      <h3>🚫 Sanciones y multas</h3>

      <button
        class="primary-btn"
        id="newSanction"
      >
        ＋ Crear sanción / multa
      </button>

      ${
        sanctions.length
          ? sanctions.slice().reverse().map(item => `
            <div class="sanction-admin">

              <span class="status">
                ${escapeHTML(item.type)}
              </span>

              <h4>${escapeHTML(item.userName)}</h4>

              <p>${escapeHTML(item.reason)}</p>

              ${
                item.amount
                  ? `<strong>Multa: ${money(item.amount)}</strong>`
                  : ""
              }

              <small>
                ${formatDate(item.createdAt)}
              </small>

            </div>
          `).join("")
          : `
            <div class="empty-state">
              <p>No hay sanciones.</p>
            </div>
          `
      }

    </div>
  `;

  document
    .getElementById("newSanction")
    ?.addEventListener("click", () => {
      showSanctionForm();
    });
}

function showSanctionForm(
  userId = "",
  userName = "",
  claimId = ""
) {
  openModal(`
    <div class="modal-header">
      <button class="close-modal" id="closeSanction">×</button>
      <h2>🚫 Sancionar usuario</h2>
    </div>

    <div class="form-card">

      <label>Usuario</label>
      <input
        id="sanctionUser"
        value="${escapeHTML(userName)}"
        placeholder="Nombre del usuario"
      >

      <label>ID del usuario</label>
      <input
        id="sanctionUserId"
        value="${escapeHTML(userId)}"
      >

      <label>Tipo de sanción</label>

      <select id="sanctionType">
        <option>Advertencia</option>
        <option>Bloqueo temporal</option>
        <option>Bloqueo permanente</option>
        <option>Multa</option>
        <option>Eliminación de publicación</option>
      </select>

      <label>Motivo</label>

      <textarea
        id="sanctionReason"
        rows="4"
        placeholder="Motivo de la sanción..."
      ></textarea>

      <label>Monto de multa</label>

      <input
        id="sanctionAmount"
        type="number"
        min="0"
        placeholder="0"
      >

      <label>Días de bloqueo</label>

      <input
        id="sanctionDays"
        type="number"
        min="0"
        placeholder="0"
      >

      <button
        class="danger-btn"
        id="saveSanction"
      >
        Aplicar sanción
      </button>

    </div>
  `);

  document
    .getElementById("closeSanction")
    ?.addEventListener("click", closeModal);

  document
    .getElementById("saveSanction")
    ?.addEventListener("click", () => {

      const sanctions =
        getJSON(STORAGE.sanctions, []);

      const type =
        document.getElementById("sanctionType").value;

      const amount =
        Number(
          document.getElementById("sanctionAmount").value || 0
        );

      const days =
        Number(
          document.getElementById("sanctionDays").value || 0
        );

      sanctions.push({
        id: uid("sanction"),
        userId:
          document.getElementById("sanctionUserId").value.trim(),
        userName:
          document.getElementById("sanctionUser").value.trim(),
        type,
        reason:
          document.getElementById("sanctionReason").value.trim(),
        amount,
        days,
        createdAt: Date.now(),
        active: true
      });

      saveJSON(STORAGE.sanctions, sanctions);

      if (claimId) {
        const claims =
          getJSON(STORAGE.claims, []);

        const claim =
          claims.find(item => item.id === claimId);

        if (claim) {
          claim.status = "sanctioned";
          saveJSON(STORAGE.claims, claims);
        }
      }

      toast("🚫 Sanción aplicada");
      closeModal();
      renderAdminSanctions();
    });
}

/* =========================
   ADMIN — CONTRASEÑA
========================= */

function renderAdminPassword() {
  const box =
    document.getElementById("adminSection");

  if (!box) return;

  box.innerHTML = `
    <div class="admin-section">

      <h3>🔐 Cambiar contraseña del administrador</h3>

      <div class="form-card">

        <label>Contraseña actual</label>
        <input
          id="adminOldPassword"
          type="password"
        >

        <label>Nueva contraseña</label>
        <input
          id="adminNewPassword"
          type="password"
        >

        <label>Confirmar nueva contraseña</label>
        <input
          id="adminNewPassword2"
          type="password"
        >

        <button
          class="primary-btn"
          id="saveAdminPassword"
        >
          Guardar contraseña
        </button>

      </div>

    </div>
  `;

  document
    .getElementById("saveAdminPassword")
    ?.addEventListener("click", saveAdminPassword);
}

function saveAdminPassword() {
  const config = getConfig();

  const oldPassword =
    document.getElementById("adminOldPassword").value;

  const newPassword =
    document.getElementById("adminNewPassword").value;

  const newPassword2 =
    document.getElementById("adminNewPassword2").value;

  if (oldPassword !== config.adminPassword) {
    toast("La contraseña actual es incorrecta.");
    return;
  }

  if (newPassword.length < 6) {
    toast("La nueva contraseña debe tener al menos 6 caracteres.");
    return;
  }

  if (newPassword !== newPassword2) {
    toast("Las contraseñas no coinciden.");
    return;
  }

  config.adminPassword = newPassword;

  saveJSON(STORAGE.config, config);

  toast("✓ Contraseña del administrador cambiada");
}

/* =========================
   ADMIN — CONFIGURACIÓN
========================= */

function renderAdminSettings() {
  const config = getConfig();

  const box =
    document.getElementById("adminSection");

  if (!box) return;

  box.innerHTML = `
    <div class="admin-section">

      <h3>⚙️ Configuración del panel</h3>

      <div class="settings-list">

        <label>
          <input
            type="checkbox"
            id="panelCompact"
            ${config.panel.compact ? "checked" : ""}
          >
          Panel compacto
        </label>

        <label>
          <input
            type="checkbox"
            id="panelRounded"
            ${config.panel.rounded ? "checked" : ""}
          >
          Bordes redondeados
        </label>

        <label>
          <input
            type="checkbox"
            id="panelAnimations"
            ${config.panel.animations ? "checked" : ""}
          >
          Animaciones
        </label>

      </div>

      <label>Nombre de la plataforma</label>

      <input
        id="siteName"
        value="${escapeHTML(config.siteName)}"
      >

      <label>Frase principal</label>

      <input
        id="siteTagline"
        value="${escapeHTML(config.tagline)}"
      >

      <h4>Precios generales de los planes</h4>

      <div class="price-grid">

        <label>
          Básico
          <input
            id="cheapPrice"
            type="number"
            value="${config.plans.cheap.price}"
          >
        </label>

        <label>
          Destacado
          <input
            id="normalPrice"
            type="number"
            value="${config.plans.normal.price}"
          >
        </label>

        <label>
          Premium
          <input
            id="proPrice"
            type="number"
            value="${config.plans.pro.price}"
          >
        </label>

      </div>

      <button
        class="primary-btn"
        id="savePanelSettings"
      >
        Guardar configuración
      </button>

    </div>
  `;

  document
    .getElementById("savePanelSettings")
    ?.addEventListener("click", savePanelSettings);
}

function savePanelSettings() {
  const config = getConfig();

  config.panel.compact =
    document.getElementById("panelCompact").checked;

  config.panel.rounded =
    document.getElementById("panelRounded").checked;

  config.panel.animations =
    document.getElementById("panelAnimations").checked;

  config.siteName =
    document.getElementById("siteName").value.trim();

  config.tagline =
    document.getElementById("siteTagline").value.trim();

  config.plans.cheap.price =
    Number(document.getElementById("cheapPrice").value || 0);

  config.plans.normal.price =
    Number(document.getElementById("normalPrice").value || 0);

  config.plans.pro.price =
    Number(document.getElementById("proPrice").value || 0);

  saveJSON(STORAGE.config, config);

  applyPanelSettings();

  toast("✓ Configuración guardada");
}

/* =========================
   BADGES / NOTIFICACIONES
========================= */

function updateBadges() {
  const ads =
    getJSON(STORAGE.ads, []);

  const pending =
    ads.filter(ad => ad.status === "pending").length;

  const badge =
    document.getElementById("notifyBadge");

  if (badge) {
    badge.textContent = pending;

    badge.classList.toggle(
      "hidden",
      pending === 0
    );
  }

  const chatBadge =
    document.getElementById("chatBadge");

  const user =
    currentUser();

  let unread = 0;

  if (user) {
    unread =
      getMessages().filter(message =>
        message.to === user.id &&
        !message.read
      ).length;
  }

  if (chatBadge) {
    chatBadge.textContent = unread;

    chatBadge.classList.toggle(
      "hidden",
      unread === 0
    );
  }
}

/* =========================
   NOTIFICACIONES
========================= */

function showNotifications() {
  const ads =
    getJSON(STORAGE.ads, []);

  const pending =
    ads.filter(ad => ad.status === "pending");

  const user =
    currentUser();

  const unread =
    user
      ? getMessages().filter(
          message =>
            message.to === user.id &&
            !message.read
        )
      : [];

  openModal(`
    <div class="modal-header">
      <button class="close-modal" id="closeNotifications">×</button>
      <h2>🔔 Notificaciones</h2>
    </div>

    <div class="notification-list">

      ${
        pending.length
          ? `
            <div class="notification warning">
              🔴 Hay ${pending.length}
              publicidad(es) esperando revisión administrativa.
            </div>
          `
          : ""
      }

      ${
        unread.length
          ? unread.map(message => `
            <div class="notification">
              💬 ${escapeHTML(message.text)}
            </div>
          `).join("")
          : ""
      }

      ${
        !pending.length && !unread.length
          ? `
            <div class="empty-state">
              <div>🔔</div>
              <p>No tienes notificaciones nuevas.</p>
            </div>
          `
          : ""
      }

    </div>
  `);

  document
    .getElementById("closeNotifications")
    ?.addEventListener("click", closeModal);
}

/* =========================
   CONFIGURACIÓN VISUAL
========================= */

function applyPanelSettings() {
  const config = getConfig();

  document.body.classList.toggle(
    "mf-compact",
    !!config.panel.compact
  );

  document.body.classList.toggle(
    "mf-no-rounded",
    !config.panel.rounded
  );

  document.body.classList.toggle(
    "mf-no-animations",
    !config.panel.animations
  );
}

/* =========================
   EVENTOS PRINCIPALES
========================= */

function setupEvents() {

  document
    .querySelectorAll(".nav-item")
    .forEach(button => {
      button.addEventListener("click", () => {
        goPage(button.dataset.page);
      });
    });

  document
    .getElementById("publishBtn")
    ?.addEventListener("click", showPublish);

  document
    .getElementById("notifyBtn")
    ?.addEventListener("click", showNotifications);

  document
    .getElementById("searchInput")
    ?.addEventListener("input", event => {

      searchTerm =
        event.target.value;

      if (currentPage === "home") {
        renderProducts();
      }
    });

  document
    .getElementById("modal")
    ?.addEventListener("click", event => {

      if (event.target.id === "modal") {
        closeModal();
      }
    });
}

/* =========================
   INICIO DE LA APP
========================= */

function initMarketFlash() {

  seedData();

  applyPanelSettings();

  setupEvents();

  renderHome();

  updateBadges();

  /*
    Actualiza notificaciones periódicamente.
  */
  setInterval(updateBadges, 3000);
}

/* =========================
   ARRANQUE
========================= */

if (
  document.readyState === "loading"
) {
  document.addEventListener(
    "DOMContentLoaded",
    initMarketFlash
  );
} else {
  initMarketFlash();
}
