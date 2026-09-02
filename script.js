/* =========================================================
   MARKET FLASH
   script.js
   Propiedad Julio Alcántara Gómez
========================================================= */

"use strict";

/* =========================================================
   CONFIGURACIÓN
========================================================= */

const APP_NAME = "Market Flash";
const OWNER = "Propiedad Julio Alcántara Gómez";

const STORAGE = {
  products: "mf_products",
  user: "mf_user",
  chats: "mf_chats",
  notifications: "mf_notifications",
  settings: "mf_settings",
  ads: "mf_ads",
  admin: "mf_admin",
  complaints: "mf_complaints",
  activities: "mf_activities"
};

/* =========================================================
   UTILIDADES
========================================================= */

function $(id) {
  return document.getElementById(id);
}

function qs(selector) {
  return document.querySelector(selector);
}

function qsa(selector) {
  return [...document.querySelectorAll(selector)];
}

function load(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function uid(prefix = "mf") {
  return `${prefix}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function escapeHTML(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatMoney(value) {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

function formatDate(date = Date.now()) {
  return new Intl.DateTimeFormat("es-DO", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(date));
}

function toast(message, type = "normal") {
  const el = $("toast");
  if (!el) return;

  el.textContent = message;
  el.className = `toast ${type}`;

  clearTimeout(window.mfToastTimer);

  window.mfToastTimer = setTimeout(() => {
    el.classList.add("hidden");
  }, 3200);
}

function hideModal() {
  const modal = $("modal");
  if (!modal) return;

  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
  $("modalCard").innerHTML = "";
}

function showModal(content) {
  const modal = $("modal");
  const card = $("modalCard");

  if (!modal || !card) return;

  card.innerHTML = content;
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
}

function pressAnimation(button) {
  if (!button) return;

  button.classList.remove("mf-press");
  void button.offsetWidth;
  button.classList.add("mf-press");

  setTimeout(() => {
    button.classList.remove("mf-press");
  }, 300);
}

/* =========================================================
   DATOS INICIALES
========================================================= */

let products = load(STORAGE.products, [
  {
    id: "product_demo_1",
    title: "iPhone 14 Pro",
    description: "Excelente estado. Equipo disponible para entrega.",
    price: 39000,
    category: "Celulares",
    seller: "Vendedor Market Flash",
    sellerId: "demo_seller",
    views: 18,
    likes: 4,
    rating: 4.8,
    sold: false,
    sellerSold: false,
    buyerBought: false,
    createdAt: Date.now() - 86400000
  },
  {
    id: "product_demo_2",
    title: "PlayStation 4",
    description: "Consola funcionando correctamente.",
    price: 18500,
    category: "Videojuegos",
    seller: "Vendedor Market Flash",
    sellerId: "demo_seller_2",
    views: 31,
    likes: 7,
    rating: 4.6,
    sold: false,
    sellerSold: false,
    buyerBought: false,
    createdAt: Date.now() - 172800000
  }
]);

let user = load(STORAGE.user, {
  id: "user_local",
  name: "Usuario",
  phone: "",
  cedula: "",
  messenger: "",
  password: "1234",
  avatar: ""
});

let chats = load(STORAGE.chats, []);

let notifications = load(STORAGE.notifications, []);

let settings = load(STORAGE.settings, {
  appColor: "#2563eb",
  chatColor: "#2563eb",
  chatBackground: "gradient",
  chatCustomImage: "",
  chatStyle: "modern"
});

let ads = load(STORAGE.ads, []);

let complaints = load(STORAGE.complaints, []);

let activities = load(STORAGE.activities, []);

let admin = load(STORAGE.admin, {
  password: "1234",
  plans: {
    basic: 250,
    pro: 500,
    premium: 900
  },
  paymentMethods: {
    popular: {
      enabled: true,
      name: "Banco Popular",
      account: ""
    },
    banreservas: {
      enabled: true,
      name: "Banreservas",
      account: ""
    },
    binance: {
      enabled: true,
      name: "Binance",
      account: ""
    },
    paypal: {
      enabled: true,
      name: "PayPal",
      account: ""
    }
  }
});

save(STORAGE.products, products);
save(STORAGE.user, user);
save(STORAGE.chats, chats);
save(STORAGE.notifications, notifications);
save(STORAGE.settings, settings);
save(STORAGE.ads, ads);
save(STORAGE.complaints, complaints);
save(STORAGE.activities, activities);
save(STORAGE.admin, admin);

/* =========================================================
   NAVEGACIÓN
========================================================= */

function showPage(pageName) {
  const pages = {
    home: $("homePage"),
    chat: $("chatPage"),
    activity: $("activityPage"),
    profile: $("profilePage")
  };

  Object.values(pages).forEach(page => {
    if (page) page.classList.add("hidden");
  });

  if (pages[pageName]) {
    pages[pageName].classList.remove("hidden");
  }

  qsa(".nav-item").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.page === pageName
    );
  });

  if (pageName === "home") {
    renderHome();
  }

  if (pageName === "chat") {
    renderChats();
  }

  if (pageName === "activity") {
    renderActivity();
  }

  if (pageName === "profile") {
    renderProfile();
  }
}

/* =========================================================
   NAVEGACIÓN INFERIOR
========================================================= */

qsa(".nav-item").forEach(button => {
  button.addEventListener("click", () => {
    pressAnimation(button);
    showPage(button.dataset.page);
  });
});

/* =========================================================
   PERFIL
========================================================= */

function renderProfile() {
  $("profileName").textContent = user.name || "Usuario";

  $("profilePhone").textContent =
    user.phone || "Teléfono no registrado";

  $("profileCedula").textContent =
    user.cedula
      ? `Cédula: ${maskCedula(user.cedula)}`
      : "Cédula: protegida";

  $("profileNameInfo").textContent =
    user.name || "-";

  $("profilePhoneInfo").textContent =
    user.phone || "-";

  $("profileMessengerInfo").textContent =
    user.messenger
      ? "Conectado"
      : "No conectado";

  const avatar = $("profileAvatar");

  if (avatar) {
    if (user.avatar) {
      avatar.innerHTML =
        `<img src="${user.avatar}" alt="Foto de perfil">`;
    } else {
      avatar.textContent = "👤";
    }
  }

  renderMyProducts();
}

function maskCedula(value) {
  if (!value) return "protegida";

  const str = String(value);

  if (str.length <= 4) {
    return "••••";
  }

  return "••••••" + str.slice(-4);
}

$("editProfileBtn")?.addEventListener("click", () => {
  pressAnimation($("editProfileBtn"));

  showModal(`
    <button class="modal-close" data-close-modal>×</button>

    <div class="modal-header">
      <small>MI PERFIL</small>
      <h2>Editar perfil</h2>
      <p>Actualiza tus datos personales.</p>
    </div>

    <div class="form-card">

      <label>Nombre</label>

      <input
        id="editNameInput"
        type="text"
        value="${escapeHTML(user.name)}"
        placeholder="Tu nombre"
      >

      <label>Número de teléfono</label>

      <input
        id="editPhoneInput"
        type="tel"
        value="${escapeHTML(user.phone)}"
        placeholder="809-000-0000"
      >

      <label>Cédula</label>

      <input
        type="text"
        value="${escapeHTML(maskCedula(user.cedula))}"
        disabled
      >

      <label>Foto de perfil</label>

      <input
        id="profileImageInput"
        type="file"
        accept="image/*"
      >

      <button
        id="saveProfileBtn"
        class="primary-btn"
        type="button"
      >
        Guardar cambios
      </button>

    </div>
  `);

  $("saveProfileBtn")?.addEventListener("click", saveProfile);

  $("profileImageInput")?.addEventListener("change", event => {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      user.avatar = reader.result;
    };

    reader.readAsDataURL(file);
  });
});

function saveProfile() {
  const name = $("editNameInput")?.value.trim();
  const phone = $("editPhoneInput")?.value.trim();

  if (!name) {
    toast("Escribe tu nombre.", "error");
    return;
  }

  user.name = name;
  user.phone = phone;

  save(STORAGE.user, user);

  hideModal();
  renderProfile();

  addActivity(
    "Perfil actualizado",
    "Tus datos fueron actualizados correctamente."
  );

  toast("Perfil actualizado correctamente.", "success");
}

/* =========================================================
   CAMBIAR TELÉFONO
========================================================= */

$("savePhoneBtn")?.addEventListener("click", () => {
  const phone = $("newPhoneInput")?.value.trim();

  if (!phone) {
    toast("Escribe un número de teléfono.", "error");
    return;
  }

  user.phone = phone;

  save(STORAGE.user, user);

  renderProfile();

  toast("Número de teléfono actualizado.", "success");
});

/* =========================================================
   MESSENGER
========================================================= */

$("saveMessengerBtn")?.addEventListener("click", () => {
  const link = $("messengerLinkInput")?.value.trim();

  if (!link) {
    toast("Escribe el enlace de Messenger.", "error");
    return;
  }

  user.messenger = link;

  save(STORAGE.user, user);

  renderProfile();

  toast("Messenger conectado.", "success");
});

$("messengerProfileBtn")?.addEventListener("click", () => {
  $("profileSettings")?.classList.remove("hidden");

  $("messengerLinkInput")?.focus();
});

/* =========================================================
   CONFIGURACIÓN DEL PERFIL
========================================================= */

$("profileSettingsBtn")?.addEventListener("click", () => {
  const settingsPanel = $("profileSettings");

  if (!settingsPanel) return;

  settingsPanel.classList.toggle("hidden");

  if (!settingsPanel.classList.contains("hidden")) {
    settingsPanel.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
});

/* =========================================================
   CAMBIAR COLOR DE LA APLICACIÓN
========================================================= */

$("appColorBtn")?.addEventListener("click", () => {
  showModal(`
    <button class="modal-close" data-close-modal>×</button>

    <div class="modal-header">
      <small>PERSONALIZACIÓN</small>
      <h2>Color de Market Flash</h2>
      <p>Selecciona el color principal de la aplicación.</p>
    </div>

    <div class="color-picker-grid">

      <button data-app-color="#2563eb">Azul</button>
      <button data-app-color="#7c3aed">Morado</button>
      <button data-app-color="#059669">Verde</button>
      <button data-app-color="#db2777">Rosa</button>
      <button data-app-color="#ea580c">Naranja</button>
      <button data-app-color="#111827">Oscuro</button>

    </div>
  `);

  qsa("[data-app-color]").forEach(button => {
    button.addEventListener("click", () => {
      settings.appColor = button.dataset.appColor;

      save(STORAGE.settings, settings);

      applySettings();

      hideModal();

      toast("Color actualizado.", "success");
    });
  });
});

/* =========================================================
   ESTILO DEL CHAT
========================================================= */

$("chatStyleBtn")?.addEventListener("click", () => {
  showModal(`
    <button class="modal-close" data-close-modal>×</button>

    <div class="modal-header">
      <small>CHAT</small>
      <h2>Estilo del chat</h2>
      <p>Elige cómo quieres ver tus conversaciones.</p>
    </div>

    <div class="settings-choice">

      <button data-chat-style="modern">
        ✨ Moderno
      </button>

      <button data-chat-style="classic">
        💬 Clásico
      </button>

      <button data-chat-style="glass">
        🔮 Cristal
      </button>

      <button data-chat-style="minimal">
        ◻️ Minimalista
      </button>

    </div>
  `);

  qsa("[data-chat-style]").forEach(button => {
    button.addEventListener("click", () => {
      settings.chatStyle =
        button.dataset.chatStyle;

      save(STORAGE.settings, settings);

      applySettings();

      hideModal();

      toast("Estilo del chat actualizado.", "success");
    });
  });
});

/* =========================================================
   FONDO DEL CHAT
========================================================= */

$("chatBackgroundBtn")?.addEventListener("click", () => {
  showModal(`
    <button class="modal-close" data-close-modal>×</button>

    <div class="modal-header">
      <small>CHAT</small>
      <h2>Fondo del chat</h2>
      <p>Personaliza el fondo de tus conversaciones.</p>
    </div>

    <div class="landscape-grid">

      <button data-landscape="gradient">
        🌌
        <span>Atardecer digital</span>
      </button>

      <button data-landscape="beach">
        🏝️
        <span>Playa</span>
      </button>

      <button data-landscape="forest">
        🌲
        <span>Bosque</span>
      </button>

      <button data-landscape="mountain">
        🏔️
        <span>Montañas</span>
      </button>

      <button data-landscape="night">
        🌙
        <span>Noche</span>
      </button>

    </div>
  `);

  qsa("[data-landscape]").forEach(button => {
    button.addEventListener("click", () => {
      settings.chatBackground =
        button.dataset.landscape;

      save(STORAGE.settings, settings);

      applySettings();

      hideModal();

      toast("Fondo del chat actualizado.", "success");
    });
  });
});

/* =========================================================
   PAISAJES INTEGRADOS
========================================================= */

$("builtInLandscapeBtn")?.addEventListener("click", () => {
  $("chatBackgroundBtn")?.click();
});

/* =========================================================
   IMAGEN PERSONALIZADA DEL CHAT
========================================================= */

$("chatCustomImageBtn")?.addEventListener("click", () => {
  $("chatCustomImageInput")?.click();
});

$("chatCustomImageInput")?.addEventListener("change", event => {
  const file = event.target.files?.[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    toast("Selecciona una imagen válida.", "error");
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    settings.chatCustomImage = reader.result;
    settings.chatBackground = "custom";

    save(STORAGE.settings, settings);

    applySettings();

    toast("Imagen personalizada guardada.", "success");
  };

  reader.readAsDataURL(file);
});

/* =========================================================
   APLICAR CONFIGURACIÓN
========================================================= */

function applySettings() {
  document.documentElement.style.setProperty(
    "--mf-primary",
    settings.appColor
  );

  document.documentElement.style.setProperty(
    "--mf-chat-color",
    settings.chatColor
  );

  document.body.dataset.chatStyle =
    settings.chatStyle;

  document.body.dataset.chatBackground =
    settings.chatBackground;

  if (settings.chatBackground === "custom" &&
      settings.chatCustomImage) {

    document.documentElement.style.setProperty(
      "--mf-chat-image",
      `url("${settings.chatCustomImage}")`
    );

  } else {
    document.documentElement.style.removeProperty(
      "--mf-chat-image"
    );
  }
}

/* =========================================================
   CONTRASEÑA DEL USUARIO
========================================================= */

$("changePasswordBtn")?.addEventListener("click", () => {
  const current =
    $("currentPasswordInput")?.value;

  const next =
    $("newPasswordInput")?.value;

  if (!current || !next) {
    toast("Completa las dos contraseñas.", "error");
    return;
  }

  if (current !== user.password) {
    toast("La contraseña actual es incorrecta.", "error");
    return;
  }

  if (next.length < 4) {
    toast(
      "La nueva contraseña debe tener al menos 4 caracteres.",
      "error"
    );
    return;
  }

  user.password = next;

  save(STORAGE.user, user);

  $("currentPasswordInput").value = "";
  $("newPasswordInput").value = "";

  toast("Contraseña cambiada correctamente.", "success");
});

/* =========================================================
   ELIMINAR CUENTA
========================================================= */

$("deleteAccountBtn")?.addEventListener("click", () => {
  showModal(`
    <button class="modal-close" data-close-modal>×</button>

    <div class="modal-header">
      <small>CUENTA</small>
      <h2>Eliminar cuenta</h2>

      <p>
        Esta acción eliminará tus datos locales de Market Flash.
      </p>
    </div>

    <div class="form-card">

      <p>
        ¿Estás seguro de que deseas continuar?
      </p>

      <button
        id="confirmDeleteAccount"
        class="danger-outline"
        type="button"
      >
        Sí, eliminar mi cuenta
      </button>

      <button
        id="cancelDeleteAccount"
        class="secondary-btn"
        type="button"
      >
        Cancelar
      </button>

    </div>
  `);

  $("cancelDeleteAccount")?.addEventListener(
    "click",
    hideModal
  );

  $("confirmDeleteAccount")?.addEventListener(
    "click",
    deleteAccount
  );
});

function deleteAccount() {
  const deletedUser = {
    ...user,
    deletedAt: Date.now()
  };

  activities.push({
    id: uid("activity"),
    type: "account_deleted",
    title: "Cuenta eliminada",
    description: `Cuenta de ${user.name}`,
    createdAt: Date.now()
  });

  save(STORAGE.activities, activities);

  localStorage.removeItem(STORAGE.user);

  user = {
    id: uid("user"),
    name: "Usuario",
    phone: "",
    cedula: "",
    messenger: "",
    password: "1234",
    avatar: ""
  };

  save(STORAGE.user, user);

  hideModal();

  renderProfile();

  toast("La cuenta fue eliminada.", "success");
}

/* =========================================================
   PUBLICAR
========================================================= */

$("publishBtn")?.addEventListener("click", () => {
  pressAnimation($("publishBtn"));
  openPublishModal();
});

function openPublishModal() {
  showModal(`
    <button class="modal-close" data-close-modal>×</button>

    <div class="modal-header">
      <small>MARKET FLASH</small>
      <h2>Publicar producto</h2>
      <p>Publica lo que quieras vender.</p>
    </div>

    <div class="form-card">

      <label>Nombre del producto</label>

      <input
        id="productTitleInput"
        type="text"
        placeholder="Ej. iPhone 15 Pro"
      >

      <label>Descripción</label>

      <textarea
        id="productDescriptionInput"
        rows="4"
        placeholder="Describe tu producto..."
      ></textarea>

      <label>Precio</label>

      <input
        id="productPriceInput"
        type="number"
        min="0"
        placeholder="Precio en RD$"
      >

      <label>Categoría</label>

      <select id="productCategoryInput">

        <option value="Celulares">Celulares</option>
        <option value="Electrónica">Electrónica</option>
        <option value="Videojuegos">Videojuegos</option>
        <option value="Vehículos">Vehículos</option>
        <option value="Hogar">Hogar</option>
        <option value="Ropa">Ropa</option>
        <option value="Otros">Otros</option>

      </select>

      <label>Foto</label>

      <input
        id="productImageInput"
        type="file"
        accept="image/*"
      >

      <button
        id="saveProductBtn"
        class="primary-btn"
        type="button"
      >
        Publicar ahora
      </button>

    </div>
  `);

  $("saveProductBtn")?.addEventListener(
    "click",
    createProduct
  );
}

function createProduct() {
  const title =
    $("productTitleInput")?.value.trim();

  const description =
    $("productDescriptionInput")?.value.trim();

  const price =
    Number($("productPriceInput")?.value);

  const category =
    $("productCategoryInput")?.value;

  if (!title || !description || !price) {
    toast(
      "Completa nombre, descripción y precio.",
      "error"
    );
    return;
  }

  const file =
    $("productImageInput")?.files?.[0];

  const create = image => {
    const product = {
      id: uid("product"),
      title,
      description,
      price,
      category,
      image: image || "",
      seller: user.name || "Usuario",
      sellerId: user.id,
      views: 0,
      likes: 0,
      rating: 5,
      sold: false,
      sellerSold: false,
      buyerBought: false,
      createdAt: Date.now()
    };

    products.unshift(product);

    save(STORAGE.products, products);

    addActivity(
      "Publicación creada",
      `${title} fue publicado correctamente.`
    );

    hideModal();

    showPage("home");

    toast(
      "Tu publicación fue creada correctamente.",
      "success"
    );
  };

  if (file) {
    const reader = new FileReader();

    reader.onload = () => create(reader.result);

    reader.readAsDataURL(file);
  } else {
    create("");
  }
}

/* =========================================================
   HOME
========================================================= */

let currentCategory = "Todos";
let searchTerm = "";

function renderHome() {
  renderCategories();
  renderProducts();
  renderFlashStatus();
  renderNotifications();
}

function renderCategories() {
  const row = $("categoryRow");

  if (!row) return;

  const categories = [
    "Todos",
    "Celulares",
    "Electrónica",
    "Videojuegos",
    "Vehículos",
    "Hogar",
    "Ropa",
    "Otros"
  ];

  row.innerHTML = categories.map(category => `
    <button
      class="chip ${currentCategory === category ? "active" : ""}"
      data-category="${escapeHTML(category)}"
      type="button"
    >
      ${escapeHTML(category)}
    </button>
  `).join("");

  qsa("[data-category]").forEach(button => {
    button.addEventListener("click", () => {
      currentCategory = button.dataset.category;
      renderCategories();
      renderProducts();
    });
  });
}

function renderProducts() {
  const grid = $("productsGrid");

  if (!grid) return;

  let filtered = [...products];

  if (currentCategory !== "Todos") {
    filtered = filtered.filter(
      product =>
        product.category === currentCategory
    );
  }

  if (searchTerm) {
    const query = searchTerm.toLowerCase();

    filtered = filtered.filter(product =>
      `${product.title} ${product.description} ${product.category}`
        .toLowerCase()
        .includes(query)
    );
  }

  $("productCount").textContent =
    `${filtered.length} publicaciones`;

  if (!filtered.length) {
    grid.innerHTML = `
      <div class="empty-card">
        <div>🔎</div>
        <h3>No encontramos publicaciones</h3>
        <p>Prueba con otra búsqueda o categoría.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(productCard).join("");

  qsa("[data-product-id]").forEach(card => {
    card.addEventListener("click", event => {
      if (
        event.target.closest("button") ||
        event.target.closest("a")
      ) {
        return;
      }

      openProduct(product.id);
    });
  });

  qsa("[data-like-product]").forEach(button => {
    button.addEventListener("click", () => {
      likeProduct(button.dataset.likeProduct);
    });
  });

  qsa("[data-contact-product]").forEach(button => {
    button.addEventListener("click", () => {
      openProduct(button.dataset.contactProduct);
    });
  });
}

function productCard(product) {
  return `
    <article
      class="product-card"
      data-product-id="${product.id}"
    >

      <div class="product-image">

        ${
          product.image
            ? `<img src="${product.image}" alt="${escapeHTML(product.title)}">`
            : `<div class="product-placeholder">📦</div>`
        }

        ${
          product.sold
            ? `<span class="sold-label">VENDIDO</span>`
            : ""
        }

      </div>

      <div class="product-body">

        <div class="product-category">
          ${escapeHTML(product.category)}
        </div>

        <h3>
          ${escapeHTML(product.title)}
        </h3>

        <p>
          ${escapeHTML(product.description)}
        </p>

        <strong class="product-price">
          ${formatMoney(product.price)}
        </strong>

        <div class="product-meta">
          <span>👁 ${product.views || 0}</span>
          <span>❤️ ${product.likes || 0}</span>
          <span>⭐ ${product.rating || 5}</span>
        </div>

        <div class="product-seller">
          Vendedor: ${escapeHTML(product.seller)}
        </div>

        <div class="product-actions">

          <button
            type="button"
            data-like-product="${product.id}"
          >
            ❤️
          </button>

          <button
            type="button"
            data-contact-product="${product.id}"
          >
            💬 Contactar
          </button>

        </div>

      </div>

    </article>
  `;
}

/* =========================================================
   BÚSQUEDA
========================================================= */

$("searchInput")?.addEventListener(
  "input",
  event => {
    searchTerm =
      event.target.value.trim();

    renderProducts();
  }
);

/* =========================================================
   LIKE
========================================================= */

function likeProduct(productId) {
  const product =
    products.find(item => item.id === productId);

  if (!product) return;

  product.likes =
    Number(product.likes || 0) + 1;

  save(STORAGE.products, products);

  renderProducts();

  toast("Te gusta esta publicación ❤️");
}

/* =========================================================
   PRODUCTO
========================================================= */

function openProduct(productId) {
  const product =
    products.find(item => item.id === productId);

  if (!product) return;

  product.views =
    Number(product.views || 0) + 1;

  save(STORAGE.products, products);

  showModal(`
    <button class="modal-close" data-close-modal>×</button>

    <div class="product-viewer">

      <div class="product-view-image">

        ${
          product.image
            ? `<img src="${product.image}" alt="${escapeHTML(product.title)}">`
            : `<div class="product-placeholder large">📦</div>`
        }

      </div>

      <div class="product-view-content">

        <small>
          ${escapeHTML(product.category)}
        </small>

        <h2>
          ${escapeHTML(product.title)}
        </h2>

        <strong class="product-price">
          ${formatMoney(product.price)}
        </strong>

        <p>
          ${escapeHTML(product.description)}
        </p>

        <div class="product-stats">
          <span>👁 ${product.views}</span>
          <span>❤️ ${product.likes}</span>
          <span>⭐ ${product.rating}</span>
        </div>

        <div class="seller-box">

          <strong>
            ${escapeHTML(product.seller)}
          </strong>

          <span>
            ⭐ ${product.rating || 5} / 5
          </span>

        </div>

        ${
          product.sellerId === user.id
            ? sellerSaleControls(product)
            : `
              <button
                id="contactSellerBtn"
                class="primary-btn"
                type="button"
              >
                💬 Contactar vendedor
              </button>
            `
        }

      </div>

    </div>
  `);

  $("contactSellerBtn")?.addEventListener(
    "click",
    () => openChatWithSeller(product)
  );

  qsa("[data-seller-sold]").forEach(button => {
    button.addEventListener("click", () => {
      sellerMarkSold(button.dataset.sellerSold);
    });
  });
}

function sellerSaleControls(product) {
  return `
    <div class="sale-status-box">

      ${
        product.sellerSold
          ? `
            <div class="sale-process">
              🟠 En proceso de venta
            </div>
          `
          : `
            <button
              class="primary-btn"
              data-seller-sold="${product.id}"
              type="button"
            >
              Marcar como Vendido
            </button>
          `
      }

      ${
        product.buyerBought
          ? `
            <div class="sale-confirmed">
              🟢 Comprado confirmado
            </div>
          `
          : `
            <p>
              La publicación solo se eliminará cuando
              vendedor y comprador confirmen la operación.
            </p>
          `
      }

    </div>
  `;
}

function sellerMarkSold(productId) {
  const product =
    products.find(item => item.id === productId);

  if (!product) return;

  product.sellerSold = true;

  save(STORAGE.products, products);

  addActivity(
    "Venta marcada",
    `${product.title} está en proceso de venta.`
  );

  hideModal();

  renderProducts();

  toast(
    "Producto marcado como vendido. Queda en proceso de venta.",
    "success"
  );
}

/* =========================================================
   CHAT
========================================================= */

function openChatWithSeller(product) {
  const existing =
    chats.find(chat =>
      chat.productId === product.id &&
      chat.sellerId === product.sellerId
    );

  if (!existing) {
    const chat = {
      id: uid("chat"),
      productId: product.id,
      productTitle: product.title,
      sellerId: product.sellerId,
      sellerName: product.seller,
      buyerId: user.id,
      buyerName: user.name,
      messages: [],
      sellerSold: false,
      buyerBought: false,
      createdAt: Date.now()
    };

    chats.unshift(chat);

    save(STORAGE.chats, chats);
  }

  hideModal();

  showPage("chat");

  const chat =
    chats.find(item =>
      item.productId === product.id
    );

  if (chat) {
    openChat(chat.id);
  }
}

function renderChats() {
  const list = $("conversationList");
  const empty = $("chatEmpty");

  if (!list) return;

  if (!chats.length) {
    list.innerHTML = "";
    empty?.classList.remove("hidden");
    return;
  }

  empty?.classList.add("hidden");

  list.innerHTML = chats.map(chat => {

    const last =
      chat.messages?.[chat.messages.length - 1];

    return `
      <button
        class="conversation-item"
        data-open-chat="${chat.id}"
        type="button"
      >

        <div class="conversation-avatar">
          💬
        </div>

        <div class="conversation-copy">

          <strong>
            ${escapeHTML(chat.sellerName || chat.buyerName || "Usuario")}
          </strong>

          <span>
            ${escapeHTML(
              last?.text || "Nueva conversación"
            )}
          </span>

        </div>

        <div class="conversation-arrow">
          ›
        </div>

      </button>
    `;
  }).join("");

  qsa("[data-open-chat]").forEach(button => {
    button.addEventListener("click", () => {
      openChat(button.dataset.openChat);
    });
  });

  updateBadges();
}

function openChat(chatId) {
  const chat =
    chats.find(item => item.id === chatId);

  if (!chat) return;

  const messages = chat.messages || [];

  showModal(`
    <button class="modal-close" data-close-modal>×</button>

    <div class="chat-window">

      <div class="chat-window-header">

        <div>
          <small>CONVERSACIÓN</small>

          <h2>
            ${escapeHTML(chat.productTitle)}
          </h2>
        </div>

      </div>

      <div
        id="chatMessages"
        class="chat-messages"
      >

        ${
          messages.length
            ? messages.map(messageBubble).join("")
            : `
              <div class="chat-empty-message">
                <div>💬</div>
                <p>
                  Inicia la conversación.
                </p>
              </div>
            `
        }

      </div>

      <div class="chat-actions">

        <button
          id="reportChatBtn"
          type="button"
        >
          🚩 Reclamar
        </button>

        <button
          id="whatsappBtn"
          type="button"
        >
          WhatsApp
        </button>

        <button
          id="messengerChatBtn"
          type="button"
        >
          Messenger
        </button>

      </div>

      ${
        chat.sellerSold
          ? `
            <div class="sale-process-banner">
              🟠 El vendedor marcó el artículo como Vendido.
              Esperando confirmación del comprador.
            </div>
          `
          : ""
      }

      <div class="chat-input-row">

        <input
          id="chatInput"
          type="text"
          placeholder="Escribe un mensaje..."
        >

        <button
          id="sendChatBtn"
          type="button"
        >
          ➤
        </button>

      </div>

      ${
        chat.sellerId !== user.id
          ? `
            <button
              id="buyerBoughtBtn"
              class="primary-btn"
              type="button"
            >
              🛒 Marcar como Comprado
            </button>
          `
          : ""
      }

    </div>
  `);

  $("sendChatBtn")?.addEventListener(
    "click",
    () => sendChatMessage(chat.id)
  );

  $("chatInput")?.addEventListener(
    "keydown",
    event => {
      if (event.key === "Enter") {
        sendChatMessage(chat.id);
      }
    }
  );

  $("reportChatBtn")?.addEventListener(
    "click",
    () => openComplaint(chat)
  );

  $("whatsappBtn")?.addEventListener(
    "click",
    () => openWhatsApp(chat)
  );

  $("messengerChatBtn")?.addEventListener(
    "click",
    () => openMessenger()
  );

  $("buyerBoughtBtn")?.addEventListener(
    "click",
    () => buyerMarkBought(chat.id)
  );
}

function messageBubble(message) {
  const mine =
    message.senderId === user.id;

  return `
    <div class="message-row ${mine ? "mine" : "theirs"}">

      <div class="message-bubble">

        <p>
          ${escapeHTML(message.text)}
        </p>

        <small>
          ${formatDate(message.createdAt)}
        </small>

      </div>

    </div>
  `;
}

function sendChatMessage(chatId) {
  const input = $("chatInput");

  if (!input) return;

  const text = input.value.trim();

  if (!text) return;

  const chat =
    chats.find(item => item.id === chatId);

  if (!chat) return;

  chat.messages ||= [];

  chat.messages.push({
    id: uid("message"),
    senderId: user.id,
    senderName: user.name,
    text,
    createdAt: Date.now(),
    read: false
  });

  save(STORAGE.chats, chats);

  input.value = "";

  openChat(chatId);

  addNotification(
    "Nuevo mensaje",
    `Mensaje enviado en ${chat.productTitle}`,
    "chat"
  );
}

function openWhatsApp(chat) {
  const text =
    encodeURIComponent(
      `Hola, te contacto por ${chat.productTitle} en Market Flash.`
    );

  window.open(
    `https://wa.me/?text=${text}`,
    "_blank"
  );
}

function openMessenger() {
  if (!user.messenger) {
    toast(
      "Primero conecta tu Messenger desde tu perfil.",
      "error"
    );
    return;
  }

  window.open(
    user.messenger,
    "_blank"
  );
}

/* =========================================================
   COMPRADOR: MARCAR COMPRADO
========================================================= */

function buyerMarkBought(chatId) {
  const chat =
    chats.find(item => item.id === chatId);

  if (!chat) return;

  const product =
    products.find(item =>
      item.id === chat.productId
    );

  if (!product) return;

  chat.buyerBought = true;

  product.buyerBought = true;

  save(STORAGE.chats, chats);
  save(STORAGE.products, products);

  if (
    product.sellerSold &&
    product.buyerBought
  ) {
    completeSale(chat, product);
    return;
  }

  openChat(chatId);

  toast(
    "Marcaste el producto como comprado.",
    "success"
  );
}

function completeSale(chat, product) {
  product.sold = true;

  save(STORAGE.products, products);

  chats =
    chats.filter(item => item.id !== chat.id);

  save(STORAGE.chats, chats);

  addActivity(
    "Venta completada",
    `${product.title}: vendedor y comprador confirmaron.`
  );

  hideModal();

  renderProducts();
  renderChats();

  toast(
    "Venta completada. La publicación y el chat fueron eliminados.",
    "success"
  );
}

/* =========================================================
   RECLAMACIONES
========================================================= */

function openComplaint(chat) {
  showModal(`
    <button class="modal-close" data-close-modal>×</button>

    <div class="modal-header">
      <small>SOPORTE</small>
      <h2>Presentar reclamación</h2>

      <p>
        Envía la información del problema al administrador.
      </p>
    </div>

    <div class="form-card">

      <label>Motivo</label>

      <textarea
        id="complaintText"
        rows="6"
        placeholder="Explica qué ocurrió..."
      ></textarea>

      <label>Prueba o captura</label>

      <input
        id="complaintFile"
        type="file"
        accept="image/*"
      >

      <button
        id="sendComplaintBtn"
        class="primary-btn"
        type="button"
      >
        🚩 Enviar reclamación
      </button>

    </div>
  `);

  $("sendComplaintBtn")?.addEventListener(
    "click",
    () => submitComplaint(chat)
  );
}

function submitComplaint(chat) {
  const text =
    $("complaintText")?.value.trim();

  if (!text) {
    toast(
      "Explica el motivo de la reclamación.",
      "error"
    );
    return;
  }

  const file =
    $("complaintFile")?.files?.[0];

  const createComplaint = evidence => {

    complaints.unshift({
      id: uid("complaint"),
      chatId: chat.id,
      productId: chat.productId,
      accuser: {
        id: user.id,
        name: user.name
      },
      accused: {
        id: chat.sellerId,
        name: chat.sellerName
      },
      text,
      evidence: evidence || "",
      status: "pending",
      createdAt: Date.now()
    });

    save(STORAGE.complaints, complaints);

    addNotification(
      "Reclamación enviada",
      "Tu reclamación fue enviada a soporte.",
      "support"
    );

    addActivity(
      "Reclamación enviada",
      `Reclamación sobre ${chat.productTitle}.`
    );

    hideModal();

    toast(
      "Reclamación enviada al administrador.",
      "success"
    );
  };

  if (file) {
    const reader = new FileReader();

    reader.onload = () => {
      createComplaint(reader.result);
    };

    reader.readAsDataURL(file);
  } else {
    createComplaint("");
  }
}

/* =========================================================
   FLASH DEL DÍA
========================================================= */

$("flashDayBtn")?.addEventListener(
  "click",
  () => {
    pressAnimation($("flashDayBtn"));
    openFlashDay();
  }
);

function openFlashDay() {
  const approvedAds =
    ads.filter(ad => ad.status === "approved");

  showModal(`
    <button class="modal-close" data-close-modal>×</button>

    <div class="modal-header">
      <small>PUBLICIDAD</small>
      <h2>Publicación Flash del Día</h2>
      <p>
        Anuncios destacados de Market Flash.
      </p>
    </div>

    ${
      approvedAds.length
        ? `
          <div class="flash-ad-list">
            ${approvedAds.map(flashAdCard).join("")}
          </div>
        `
        : `
          <div class="empty-card">
            <div>⚡</div>
            <h3>Aún no hay publicidad publicada</h3>
            <p>
              Sé el primero en destacar tu negocio.
            </p>
          </div>
        `
    }

    <button
      id="createAdBtn"
      class="primary-btn"
      type="button"
    >
      📢 Crear mi Publicidad Flash
    </button>
  `);

  $("createAdBtn")?.addEventListener(
    "click",
    openAdvertisingForm
  );

  qsa("[data-view-ad]").forEach(button => {
    button.addEventListener("click", () => {
      openAdViewer(button.dataset.viewAd);
    });
  });
}

function flashAdCard(ad) {
  return `
    <article class="flash-ad-card">

      ${
        ad.mediaType === "video"
          ? `
            <video
              src="${ad.media}"
              muted
              autoplay
              loop
              playsinline
            ></video>
          `
          : `
            <img
              src="${ad.media}"
              alt="${escapeHTML(ad.title)}"
            >
          `
      }

      <div class="flash-ad-content">

        <span>
          ⚡ Flash del Día
        </span>

        <h3>
          ${escapeHTML(ad.title)}
        </h3>

        <p>
          ${escapeHTML(ad.description)}
        </p>

        <div class="ad-stats">
          <span>❤️ ${ad.likes || 0}</span>
          <span>👁 ${ad.views || 0}</span>
        </div>

        <button
          class="primary-btn"
          data-view-ad="${ad.id}"
          type="button"
        >
          Ver publicidad
        </button>

      </div>

    </article>
  `;
}

/* =========================================================
   CREAR PUBLICIDAD
========================================================= */

function openAdvertisingForm() {
  showModal(`
    <button class="modal-close" data-close-modal>×</button>

    <div class="modal-header">
      <small>PUBLICIDAD FLASH</small>

      <h2>
        Crear publicidad
      </h2>

      <p>
        Envía tu anuncio para revisión.
      </p>
    </div>

    <div class="form-card">

      <label>Foto o vídeo</label>

      <input
        id="adMediaInput"
        type="file"
        accept="image/*,video/*"
      >

      <label>Nombre de la publicidad</label>

      <input
        id="adTitleInput"
        type="text"
        placeholder="Nombre de tu negocio o producto"
      >

      <label>Descripción</label>

      <textarea
        id="adDescriptionInput"
        rows="4"
        placeholder="Describe tu publicidad..."
      ></textarea>

      <label>Plan</label>

      <select id="adPlanInput">

        <option value="basic">
          Básico — ${formatMoney(admin.plans.basic)}
        </option>

        <option value="pro">
          Profesional — ${formatMoney(admin.plans.pro)}
        </option>

        <option value="premium">
          Premium — ${formatMoney(admin.plans.premium)}
        </option>

      </select>

      <label>Método de pago</label>

      <select id="adPaymentInput">

        ${paymentOptions()}

      </select>

      <label>Comprobante de pago</label>

      <input
        id="adProofInput"
        type="file"
        accept="image/*"
      >

      <button
        id="submitAdBtn"
        class="primary-btn"
        type="button"
      >
        Enviar publicidad para revisión
      </button>

    </div>
  `);

  $("submitAdBtn")?.addEventListener(
    "click",
    submitAdvertising
  );
}

function paymentOptions() {
  return Object.entries(admin.paymentMethods)
    .filter(([, method]) => method.enabled)
    .map(([key, method]) => `
      <option value="${key}">
        ${escapeHTML(method.name)}
      </option>
    `)
    .join("");
}

function submitAdvertising() {
  const title =
    $("adTitleInput")?.value.trim();

  const description =
    $("adDescriptionInput")?.value.trim();

  const plan =
    $("adPlanInput")?.value;

  const payment =
    $("adPaymentInput")?.value;

  const mediaFile =
    $("adMediaInput")?.files?.[0];

  const proofFile =
    $("adProofInput")?.files?.[0];

  if (
    !title ||
    !description ||
    !mediaFile ||
    !proofFile
  ) {
    toast(
      "Completa todos los campos y agrega publicidad y comprobante.",
      "error"
    );
    return;
  }

  const readFile = file =>
    new Promise(resolve => {
      const reader = new FileReader();

      reader.onload = () =>
        resolve(reader.result);

      reader.readAsDataURL(file);
    });

  Promise.all([
    readFile(mediaFile),
    readFile(proofFile)
  ]).then(([media, proof]) => {

    const ad = {
      id: uid("ad"),
      userId: user.id,
      userName: user.name,
      title,
      description,
      plan,
      payment,
      price: admin.plans[plan],
      media,
      mediaType: mediaFile.type.startsWith("video/")
        ? "video"
        : "image",
      proof,
      status: "pending",
      views: 0,
      likes: 0,
      createdAt: Date.now()
    };

    ads.unshift(ad);

    save(STORAGE.ads, ads);

    addNotification(
      "Publicidad enviada",
      "Tu publicidad está en chequeo.",
      "advertising"
    );

    addActivity(
      "Publicidad enviada",
      `${title} está en proceso de revisión.`
    );

    hideModal();

    renderFlashStatus();

    toast(
      "Publicidad enviada. Está en chequeo.",
      "success"
    );
  });
}

/* =========================================================
   ESTADO DE MI PUBLICIDAD
========================================================= */

function renderFlashStatus() {
  const button =
    $("myAdStatusBtn");

  if (!button) return;

  const myAds =
    ads
      .filter(ad => ad.userId === user.id)
      .sort((a, b) => b.createdAt - a.createdAt);

  if (!myAds.length) {
    button.classList.add("hidden");
    return;
  }

  button.classList.remove("hidden");

  const latest = myAds[0];

  const icon = $("myAdStatusIcon");
  const title = $("myAdStatusTitle");
  const text = $("myAdStatusText");

  if (
    latest.status === "pending"
  ) {
    icon.textContent = "⏳";
    title.textContent = "Publicidad en chequeo";
    text.textContent =
      "Tu publicidad está en proceso de prueba y revisión.";
  }

  if (
    latest.status === "rejected"
  ) {
    icon.textContent = "✕";
    title.textContent = "Publicidad rechazada";
    text.textContent =
      latest.rejectionReason ||
      "El pago fue incorrecto o no fue confirmado.";
  }

  if (
    latest.status === "approved"
  ) {
    icon.textContent = "✨";
    title.textContent = "¡Publicidad publicada!";
    text.textContent =
      "Tu publicidad fue aprobada y aparece en Flash del Día.";

    button.classList.add("ad-approved");
  } else {
    button.classList.remove("ad-approved");
  }
}

$("myAdStatusBtn")?.addEventListener(
  "click",
  () => {

    const myAds =
      ads
        .filter(ad => ad.userId === user.id)
        .sort((a, b) => b.createdAt - a.createdAt);

    if (!myAds.length) return;

    openAdStatus(myAds[0]);
  }
);

function openAdStatus(ad) {
  let statusTitle = "";
  let statusText = "";

  if (ad.status === "pending") {
    statusTitle = "⏳ En chequeo";
    statusText =
      "Estamos revisando tu publicidad y el comprobante de pago.";
  }

  if (ad.status === "rejected") {
    statusTitle = "✕ Publicidad rechazada";
    statusText =
      ad.rejectionReason ||
      "Su publicidad fue rechazada porque el pago fue incorrecto o no pudo ser confirmado.";
  }

  if (ad.status === "approved") {
    statusTitle = "✨ ¡Publicidad publicada!";
    statusText =
      "Tu publicidad fue aprobada y está rotando en Flash del Día.";
  }

  showModal(`
    <button class="modal-close" data-close-modal>×</button>

    <div class="ad-status-view">

      <div class="ad-status-icon">
        ${ad.status === "approved" ? "✨" : ad.status === "rejected" ? "✕" : "⏳"}
      </div>

      <small>MI PUBLICIDAD</small>

      <h2>
        ${escapeHTML(ad.title)}
      </h2>

      <h3>
        ${statusTitle}
      </h3>

      <p>
        ${escapeHTML(statusText)}
      </p>

      ${
        ad.status === "approved"
          ? `
            <button
              id="openApprovedAdBtn"
              class="primary-btn"
              type="button"
            >
              Ver publicidad
            </button>
          `
          : ""
      }

    </div>
  `);

  $("openApprovedAdBtn")?.addEventListener(
    "click",
    () => openAdViewer(ad.id)
  );
}

/* =========================================================
   VISOR DE PUBLICIDAD
========================================================= */

function openAdViewer(adId) {
  const ad =
    ads.find(item => item.id === adId);

  if (!ad) return;

  if (ad.status !== "approved") {
    toast(
      "Esta publicidad todavía no está publicada.",
      "error"
    );
    return;
  }

  ad.views =
    Number(ad.views || 0) + 1;

  save(STORAGE.ads, ads);

  showModal(`
    <button class="modal-close" data-close-modal>×</button>

    <div class="ad-fullscreen-viewer">

      <div class="ad-media-large">

        ${
          ad.mediaType === "video"
            ? `
              <video
                src="${ad.media}"
                autoplay
                muted
                loop
                controls
                playsinline
              ></video>
            `
            : `
              <img
                src="${ad.media}"
                alt="${escapeHTML(ad.title)}"
              >
            `
        }

      </div>

      <div class="ad-viewer-info">

        <span>⚡ FLASH DEL DÍA</span>

        <h2>
          ${escapeHTML(ad.title)}
        </h2>

        <p>
          ${escapeHTML(ad.description)}
        </p>

        <div class="ad-viewer-stats">

          <button
            id="adLikeBtn"
            type="button"
          >
            ❤️ ${ad.likes || 0}
          </button>

          <span>
            👁 ${ad.views || 0}
          </span>

        </div>

        <div class="ad-navigation">

          <button
            id="previousAdBtn"
            type="button"
          >
            ‹
          </button>

          <span>
            Flash del Día
          </span>

          <button
            id="nextAdBtn"
            type="button"
          >
            ›
          </button>

        </div>

      </div>

    </div>
  `);

  $("adLikeBtn")?.addEventListener(
    "click",
    () => {
      ad.likes =
        Number(ad.likes || 0) + 1;

      save(STORAGE.ads, ads);

      openAdViewer(ad.id);
    }
  );

  $("previousAdBtn")?.addEventListener(
    "click",
    () => navigateAd(ad.id, -1)
  );

  $("nextAdBtn")?.addEventListener(
    "click",
    () => navigateAd(ad.id, 1)
  );
}

function navigateAd(currentId, direction) {
  const approved =
    ads.filter(ad => ad.status === "approved");

  if (!approved.length) return;

  const index =
    approved.findIndex(ad => ad.id === currentId);

  let nextIndex =
    index + direction;

  if (nextIndex < 0) {
    nextIndex = approved.length - 1;
  }

  if (nextIndex >= approved.length) {
    nextIndex = 0;
  }

  openAdViewer(approved[nextIndex].id);
}

/* =========================================================
   NOTIFICACIONES
========================================================= */

function addNotification(
  title,
  text,
  type = "general"
) {
  notifications.unshift({
    id: uid("notification"),
    title,
    text,
    type,
    read: false,
    createdAt: Date.now()
  });

  save(STORAGE.notifications, notifications);

  updateBadges();
}

function renderNotifications() {
  updateBadges();
}

function updateBadges() {
  const unread =
    notifications.filter(
      notification => !notification.read
    ).length;

  const chatUnread =
    chats.reduce((total, chat) => {
      const unreadMessages =
        (chat.messages || []).filter(
          message =>
            message.senderId !== user.id &&
            !message.read
        ).length;

      return total + unreadMessages;
    }, 0);

  setBadge(
    $("notifyBadge"),
    unread
  );

  setBadge(
    $("chatBadge"),
    chatUnread
  );

  setBadge(
    $("profileBadge"),
    unread
  );
}

function setBadge(element, count) {
  if (!element) return;

  if (count > 0) {
    element.textContent =
      count > 99 ? "99+" : count;

    element.classList.remove("hidden");
  } else {
    element.classList.add("hidden");
  }
}

$("notifyBtn")?.addEventListener(
  "click",
  () => {

    pressAnimation($("notifyBtn"));

    notifications.forEach(
      notification =>
        notification.read = true
    );

    save(
      STORAGE.notifications,
      notifications
    );

    showModal(`
      <button class="modal-close" data-close-modal>×</button>

      <div class="modal-header">
        <small>MARKET FLASH</small>
        <h2>Notificaciones</h2>
      </div>

      ${
        notifications.length
          ? `
            <div class="notification-list">

              ${notifications.map(notification => `
                <article class="notification-item">

                  <div>
                    ${notification.type === "chat" ? "💬" :
                      notification.type === "advertising" ? "📢" :
                      notification.type === "support" ? "🚩" :
                      "🔔"}
                  </div>

                  <div>
                    <strong>
                      ${escapeHTML(notification.title)}
                    </strong>

                    <p>
                      ${escapeHTML(notification.text)}
                    </p>

                    <small>
                      ${formatDate(notification.createdAt)}
                    </small>
                  </div>

                </article>
              `).join("")}

            </div>
          `
          : `
            <div class="empty-card">
              <div>🔔</div>
              <h3>No tienes notificaciones</h3>
              <p>Aquí aparecerán tus avisos.</p>
            </div>
          `
      }
    `);

    updateBadges();
  }
);

/* =========================================================
   ACTIVIDAD
========================================================= */

function addActivity(title, description) {
  activities.unshift({
    id: uid("activity"),
    title,
    description,
    createdAt: Date.now()
  });

  activities =
    activities.slice(0, 100);

  save(STORAGE.activities, activities);
}

function renderActivity() {
  const container =
    $("activityContent");

  if (!container) return;

  if (!activities.length) {
    container.innerHTML = `
      <div class="empty-card">
        <div>▣</div>
        <h3>Sin actividad todavía</h3>
        <p>
          Aquí aparecerán tus publicaciones,
          ventas y acciones.
        </p>
      </div>
    `;

    return;
  }

  container.innerHTML =
    activities.map(activity => `
      <article class="activity-item">

        <div class="activity-icon">
          ✨
        </div>

        <div>

          <strong>
            ${escapeHTML(activity.title)}
          </strong>

          <p>
            ${escapeHTML(activity.description)}
          </p>

          <small>
            ${formatDate(activity.createdAt)}
          </small>

        </div>

      </article>
    `).join("");
}

/* =========================================================
   MIS PUBLICACIONES
========================================================= */

function renderMyProducts() {
  const container =
    $("myProducts");

  if (!container) return;

  const mine =
    products.filter(
      product => product.sellerId === user.id
    );

  if (!mine.length) {
    container.innerHTML = `
      <div class="empty-card">
        <div>📦</div>
        <h3>No tienes publicaciones</h3>
        <p>
          Pulsa el botón + para publicar.
        </p>
      </div>
    `;

    return;
  }

  container.innerHTML =
    mine.map(productCard).join("");

  qsa("[data-product-id]").forEach(card => {
    card.addEventListener("click", () => {
      openProduct(card.dataset.productId);
    });
  });
}

/* =========================================================
   ADMIN
========================================================= */

function openAdminPanel() {
  const password =
    prompt("Contraseña del panel de administrador:");

  if (password !== admin.password) {
    toast(
      "Contraseña de administrador incorrecta.",
      "error"
    );
    return;
  }

  renderAdminPanel();
}

function renderAdminPanel() {
  showModal(`
    <button class="modal-close" data-close-modal>×</button>

    <div class="admin-panel">

      <div class="admin-header">

        <small>MARKET FLASH</small>

        <h2>
          Panel de Administrador
        </h2>

        <p>
          Control de usuarios, publicidad,
          pagos, reclamaciones y configuración.
        </p>

      </div>

      <div class="admin-alert">
        🚨
        <strong>
          ${pendingAdminItems()} asuntos pendientes
        </strong>
      </div>

      <div class="admin-grid">

        <button data-admin-section="ads">
          📢 Publicidad
        </button>

        <button data-admin-section="payments">
          💳 Pagos
        </button>

        <button data-admin-section="complaints">
          🚩 Reclamaciones
        </button>

        <button data-admin-section="users">
          👥 Usuarios
        </button>

        <button data-admin-section="messages">
          💬 Mensajes
        </button>

        <button data-admin-section="settings">
          ⚙️ Configuración
        </button>

      </div>

      <div id="adminContent"></div>

    </div>
  `);

  qsa("[data-admin-section]").forEach(button => {
    button.addEventListener("click", () => {
      renderAdminSection(
        button.dataset.adminSection
      );
    });
  });

  renderAdminSection("ads");
}

function pendingAdminItems() {
  return (
    ads.filter(ad => ad.status === "pending").length +
    complaints.filter(
      complaint => complaint.status === "pending"
    ).length
  );
}

/* =========================================================
   ADMIN SECCIONES
========================================================= */

function renderAdminSection(section) {
  const container =
    $("adminContent");

  if (!container) return;

  if (section === "ads") {
    renderAdminAds(container);
  }

  if (section === "payments") {
    renderAdminPayments(container);
  }

  if (section === "complaints") {
    renderAdminComplaints(container);
  }

  if (section === "users") {
    renderAdminUsers(container);
  }

  if (section === "messages") {
    renderAdminMessages(container);
  }

  if (section === "settings") {
    renderAdminSettings(container);
  }
}

/* =========================================================
   ADMIN PUBLICIDAD
========================================================= */

function renderAdminAds(container) {
  const pending =
    ads.filter(ad => ad.status === "pending");

  container.innerHTML = `
    <div class="admin-section">

      <h3>
        🚨 Solicitudes de publicidad
      </h3>

      ${
        pending.length
          ? pending.map(ad => `
            <article class="admin-card">

              <strong>
                ${escapeHTML(ad.title)}
              </strong>

              <p>
                Usuario:
                ${escapeHTML(ad.userName)}
              </p>

              <p>
                Plan:
                ${escapeHTML(ad.plan)}
              </p>

              <p>
                Método:
                ${escapeHTML(
                  admin.paymentMethods[ad.payment]?.name ||
                  ad.payment
                )}
              </p>

              <p>
                Importe:
                ${formatMoney(ad.price)}
              </p>

              <div class="admin-actions">

                <button
                  data-admin-view-proof="${ad.id}"
                  type="button"
                >
                  Ver comprobante
                </button>

                <button
                  data-admin-approve-ad="${ad.id}"
                  type="button"
                >
                  ✓ Aprobar
                </button>

                <button
                  data-admin-reject-ad="${ad.id}"
                  type="button"
                >
                  ✕ Rechazar
                </button>

              </div>

            </article>
          `).join("")
          : `
            <div class="empty-card">
              No hay solicitudes pendientes.
            </div>
          `
      }

    </div>
  `;

  qsa("[data-admin-view-proof]").forEach(button => {
    button.addEventListener("click", () => {
      viewPaymentProof(
        button.dataset.adminViewProof
      );
    });
  });

  qsa("[data-admin-approve-ad]").forEach(button => {
    button.addEventListener("click", () => {
      approveAd(
        button.dataset.adminApproveAd
      );
    });
  });

  qsa("[data-admin-reject-ad]").forEach(button => {
    button.addEventListener("click", () => {
      rejectAd(
        button.dataset.adminRejectAd
      );
    });
  });
}

function viewPaymentProof(adId) {
  const ad =
    ads.find(item => item.id === adId);

  if (!ad) return;

  showModal(`
    <button class="modal-close" data-close-modal>×</button>

    <div class="payment-proof">

      <small>COMPROBANTE</small>

      <h2>
        ${escapeHTML(ad.title)}
      </h2>

      ${
        ad.proof
          ? `
            <img
              src="${ad.proof}"
              alt="Comprobante de pago"
            >
          `
          : `
            <div class="empty-card">
              Sin comprobante.
            </div>
          `
      }

      <p>
        Usuario:
        ${escapeHTML(ad.userName)}
      </p>

      <p>
        Importe:
        ${formatMoney(ad.price)}
      </p>

    </div>
  `);
}

function approveAd(adId) {
  const ad =
    ads.find(item => item.id === adId);

  if (!ad) return;

  ad.status = "approved";
  ad.approvedAt = Date.now();

  save(STORAGE.ads, ads);

  addNotification(
    "Publicidad aprobada",
    `Tu publicidad "${ad.title}" fue publicada.`,
    "advertising"
  );

  addActivity(
    "Publicidad aprobada",
    `${ad.title} está ahora en Flash del Día.`
  );

  renderAdminPanel();

  toast(
    "Publicidad aprobada y publicada.",
    "success"
  );
}

function rejectAd(adId) {
  const ad =
    ads.find(item => item.id === adId);

  if (!ad) return;

  const reason =
    prompt(
      "Escribe el motivo del rechazo:",
      "Su publicidad fue rechazada porque el pago fue incorrecto o no pudo ser confirmado."
    );

  if (reason === null) return;

  ad.status = "rejected";
  ad.rejectionReason =
    reason ||
    "Su publicidad fue rechazada porque el pago fue incorrecto.";

  save(STORAGE.ads, ads);

  addNotification(
    "Publicidad rechazada",
    ad.rejectionReason,
    "advertising"
  );

  renderAdminPanel();

  toast(
    "Publicidad rechazada.",
    "success"
  );
}

/* =========================================================
   ADMIN PAGOS
========================================================= */

function renderAdminPayments(container) {
  container.innerHTML = `
    <div class="admin-section">

      <h3>💳 Pagos</h3>

      ${Object.entries(admin.paymentMethods).map(
        ([key, method]) => `
          <article class="admin-card">

            <strong>
              ${escapeHTML(method.name)}
            </strong>

            <p>
              Cuenta:
              ${escapeHTML(method.account || "No configurada")}
            </p>

            <p>
              Estado:
              ${method.enabled ? "Activo" : "Desactivado"}
            </p>

            <button
              data-toggle-payment="${key}"
              type="button"
            >
              ${method.enabled ? "Desactivar" : "Activar"}
            </button>

          </article>
        `
      ).join("")}

      <h3>
        💰 Precios de publicidad
      </h3>

      <div class="form-card">

        <label>Básico</label>
        <input
          id="adminBasicPrice"
          type="number"
          value="${admin.plans.basic}"
        >

        <label>Profesional</label>
        <input
          id="adminProPrice"
          type="number"
          value="${admin.plans.pro}"
        >

        <label>Premium</label>
        <input
          id="adminPremiumPrice"
          type="number"
          value="${admin.plans.premium}"
        >

        <button
          id="saveAdPricesBtn"
          class="primary-btn"
          type="button"
        >
          Guardar precios
        </button>

      </div>

    </div>
  `;

  qsa("[data-toggle-payment]").forEach(button => {
    button.addEventListener("click", () => {

      const key =
        button.dataset.togglePayment;

      admin.paymentMethods[key].enabled =
        !admin.paymentMethods[key].enabled;

      save(STORAGE.admin, admin);

      renderAdminPayments(container);
    });
  });

  $("saveAdPricesBtn")?.addEventListener(
    "click",
    () => {

      admin.plans.basic =
        Number($("adminBasicPrice").value);

      admin.plans.pro =
        Number($("adminProPrice").value);

      admin.plans.premium =
        Number($("adminPremiumPrice").value);

      save(STORAGE.admin, admin);

      toast(
        "Precios actualizados.",
        "success"
      );
    }
  );
}

/* =========================================================
   ADMIN RECLAMACIONES
========================================================= */

function renderAdminComplaints(container) {
  container.innerHTML = `
    <div class="admin-section">

      <h3>🚩 Reclamaciones</h3>

      ${
        complaints.length
          ? complaints.map(complaint => `
            <article class="admin-card">

              <strong>
                ${escapeHTML(complaint.text)}
              </strong>

              <p>
                Acusador:
                ${escapeHTML(complaint.accuser.name)}
              </p>

              <p>
                Acusado:
                ${escapeHTML(complaint.accused.name)}
              </p>

              <p>
                Estado:
                ${escapeHTML(complaint.status)}
              </p>

              ${
                complaint.evidence
                  ? `
                    <img
                      class="admin-evidence"
                      src="${complaint.evidence}"
                      alt="Evidencia"
                    >
                  `
                  : ""
              }

              <div class="admin-actions">

                <button
                  data-message-complainant="${complaint.id}"
                  type="button"
                >
                  💬 Escribir
                </button>

                <button
                  data-sanction-complaint="${complaint.id}"
                  type="button"
                >
                  ⚖️ Sancionar
                </button>

              </div>

            </article>
          `).join("")
          : `
            <div class="empty-card">
              No hay reclamaciones.
            </div>
          `
      }

    </div>
  `;

  qsa("[data-message-complainant]").forEach(button => {
    button.addEventListener("click", () => {

      const complaint =
        complaints.find(
          item =>
            item.id === button.dataset.messageComplainant
        );

      if (!complaint) return;

      const message =
        prompt(
          `Mensaje para ${complaint.accuser.name}:`
        );

      if (!message) return;

      toast(
        "Mensaje preparado para soporte.",
        "success"
      );
    });
  });

  qsa("[data-sanction-complaint]").forEach(button => {
    button.addEventListener("click", () => {

      const complaint =
        complaints.find(
          item =>
            item.id === button.dataset.sanctionComplaint
        );

      if (!complaint) return;

      openSanctionModal(complaint);
    });
  });
}

/* =========================================================
   SANCIONES / MULTAS
========================================================= */

function openSanctionModal(complaint) {
  showModal(`
    <button class="modal-close" data-close-modal>×</button>

    <div class="modal-header">

      <small>ADMINISTRACIÓN</small>

      <h2>
        Sancionar usuario
      </h2>

      <p>
        Selecciona la medida correspondiente.
      </p>

    </div>

    <div class="settings-choice">

      <button
        data-sanction="warning"
      >
        ⚠️ Advertencia
      </button>

      <button
        data-sanction="temporary_block"
      >
        🚫 Bloqueo temporal
      </button>

      <button
        data-sanction="fine"
      >
        💰 Multa
      </button>

      <button
        data-sanction="permanent_block"
      >
        ⛔ Bloqueo permanente
      </button>

    </div>
  `);

  qsa("[data-sanction]").forEach(button => {
    button.addEventListener("click", () => {

      const type =
        button.dataset.sanction;

      applySanction(
        complaint,
        type
      );
    });
  });
}

function applySanction(complaint, type) {
  complaint.status = "resolved";
  complaint.sanction = {
    type,
    createdAt: Date.now()
  };

  if (type === "fine") {
    complaint.fineAmount =
      Number(
        prompt(
          "Monto de la multa en RD$:",
          "500"
        )
      ) || 0;
  }

  save(
    STORAGE.complaints,
    complaints
  );

  hideModal();

  toast(
    "Sanción aplicada.",
    "success"
  );
}

/* =========================================================
   ADMIN USUARIOS
========================================================= */

function renderAdminUsers(container) {
  const names = new Set(
    products.map(product => product.seller)
  );

  if (user.name) {
    names.add(user.name);
  }

  container.innerHTML = `
    <div class="admin-section">

      <h3>
        👥 Usuarios registrados
      </h3>

      <div class="admin-card">
        <strong>
          ${names.size}
        </strong>

        <p>
          Usuarios detectados en esta instalación.
        </p>
      </div>

      ${
        [...names].map(name => `
          <article class="admin-card">

            <strong>
              ${escapeHTML(name)}
            </strong>

            <p>
              Usuario Market Flash
            </p>

            <button type="button">
              Ver perfil
            </button>

          </article>
        `).join("")
      }

    </div>
  `;
}

/* =========================================================
   ADMIN MENSAJES
========================================================= */

function renderAdminMessages(container) {
  const totalMessages =
    chats.reduce(
      (total, chat) =>
        total + (chat.messages || []).length,
      0
    );

  container.innerHTML = `
    <div class="admin-section">

      <h3>
        💬 Mensajes
      </h3>

      <div class="admin-alert">
        💬
        ${totalMessages} mensajes registrados
      </div>

      ${
        chats.map(chat => `
          <article class="admin-card">

            <strong>
              ${escapeHTML(chat.productTitle)}
            </strong>

            <p>
              ${escapeHTML(
                chat.sellerName || "Usuario"
              )}
            </p>

            <p>
              ${(chat.messages || []).length}
              mensajes
            </p>

          </article>
        `).join("")
      }

    </div>
  `;
}

/* =========================================================
   ADMIN CONFIGURACIÓN
========================================================= */

function renderAdminSettings(container) {
  container.innerHTML = `
    <div class="admin-section">

      <h3>
        ⚙️ Configuración del panel
      </h3>

      <div class="form-card">

        <label>
          Nueva contraseña del administrador
        </label>

        <input
          id="adminNewPassword"
          type="password"
          placeholder="Nueva contraseña"
        >

        <button
          id="saveAdminPassword"
          class="primary-btn"
          type="button"
        >
          Cambiar contraseña
        </button>

      </div>

      <div class="form-card">

        <h3>
          Datos de pago
        </h3>

        ${Object.entries(admin.paymentMethods)
          .map(([key, method]) => `
            <label>
              ${escapeHTML(method.name)}
            </label>

            <input
              data-payment-account="${key}"
              type="text"
              value="${escapeHTML(method.account || "")}"
              placeholder="Cuenta / correo / referencia"
            >
          `).join("")}

        <button
          id="savePaymentAccounts"
          class="primary-btn"
          type="button"
        >
          Guardar datos de pago
        </button>

      </div>

    </div>
  `;

  $("saveAdminPassword")?.addEventListener(
    "click",
    () => {

      const password =
        $("adminNewPassword")?.value.trim();

      if (!password || password.length < 4) {
        toast(
          "La contraseña debe tener al menos 4 caracteres.",
          "error"
        );
        return;
      }

      admin.password = password;

      save(STORAGE.admin, admin);

      toast(
        "Contraseña de administrador actualizada.",
        "success"
      );
    }
  );

  $("savePaymentAccounts")?.addEventListener(
    "click",
    () => {

      qsa("[data-payment-account]")
        .forEach(input => {

          const key =
            input.dataset.paymentAccount;

          admin.paymentMethods[key].account =
            input.value.trim();

        });

      save(STORAGE.admin, admin);

      toast(
        "Datos de pago guardados.",
        "success"
      );
    }
  );
}

/* =========================================================
   ACCESO ADMINISTRADOR
========================================================= */

/*
   Puedes abrir el panel escribiendo:

   Ctrl + Shift + A

   También puedes llamar:
   openAdminPanel()
*/

document.addEventListener(
  "keydown",
  event => {

    if (
      event.ctrlKey &&
      event.shiftKey &&
      event.key.toLowerCase() === "a"
    ) {
      openAdminPanel();
    }

  }
);

/* =========================================================
   CERRAR MODALES
========================================================= */

document.addEventListener(
  "click",
  event => {

    if (
      event.target.matches("[data-close-modal]")
    ) {
      hideModal();
    }

  }
);

$("modal")?.addEventListener(
  "click",
  event => {

    if (event.target === $("modal")) {
      hideModal();
    }

  }
);

/* =========================================================
   NOTIFICACIONES DEL NAVEGADOR
========================================================= */

function requestBrowserNotifications() {
  if (
    "Notification" in window &&
    Notification.permission === "default"
  ) {
    Notification.requestPermission();
  }
}

function browserNotification(title, body) {
  if (
    "Notification" in window &&
    Notification.permission === "granted"
  ) {
    new Notification(title, {
      body,
      icon: ""
    });
  }
}

/* =========================================================
   ESTADO DE PUBLICIDAD + NOTIFICACIÓN
========================================================= */

function notifyAdStatus(ad) {
  if (ad.status === "approved") {
    browserNotification(
      "Market Flash",
      `Tu publicidad "${ad.title}" fue aprobada.`
    );
  }

  if (ad.status === "rejected") {
    browserNotification(
      "Market Flash",
      `Tu publicidad "${ad.title}" fue rechazada.`
    );
  }
}

/* =========================================================
   INICIO
========================================================= */

applySettings();

renderHome();

renderProfile();

renderActivity();

renderChats();

updateBadges();

requestBrowserNotifications();

/* =========================================================
   EXPONER FUNCIONES PARA PRUEBAS
========================================================= */

window.MarketFlash = {
  openAdminPanel,
  openFlashDay,
  openAdvertisingForm,
  renderHome,
  renderChats,
  renderProfile,
  renderActivity,
  showPage,
  products,
  ads,
  chats,
  notifications
};

console.log(
  `%c${APP_NAME}`,
  "font-size:20px;font-weight:bold;"
);

console.log(
  OWNER
);

console.log(
  "Market Flash iniciado correctamente."
);
