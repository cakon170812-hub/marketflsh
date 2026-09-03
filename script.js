/* =========================================================
   MARKET FLASH
   script.js — PARTE 1/2
   ========================================================= */

"use strict";

/* =========================================================
   DATOS PRINCIPALES
   ========================================================= */

const MFData = window.MarketFlashData || {};
const MFSupabase = window.MarketFlashSupabase || {};

const STORAGE = MFData.STORAGE_KEYS || {
  USER: "mf_user",
  PRODUCTS: "mf_products",
  CONFIG: "mf_config",
  NOTIFICATIONS: "mf_notifications",
  MESSAGES: "mf_messages",
  STATISTICS: "mf_statistics",
  ADMIN: "mf_admin",
  THEME: "mf_theme"
};

const AppState = {
  currentUser: null,
  products: [],
  filteredProducts: [],

  currentCategory: "all",
  searchText: "",

  currentProduct: null,
  currentSeller: null,
  currentChat: null,

  selectedImages: [],
  selectedVideo: null,

  selectedPromotion: null,
  selectedPaymentMethod: null,

  isAdmin: false,
  adminAuthenticated: false,

  notifications: [],
  messages: [],
  statistics: {},
  config: {},
  adminConfig: {},

  initialized: false
};

/* =========================================================
   FUNCIONES DOM
   ========================================================= */

function $(selector) {
  return document.querySelector(selector);
}

function $$(selector) {
  return Array.from(document.querySelectorAll(selector));
}

function byId(id) {
  return document.getElementById(id);
}

/* =========================================================
   SEGURIDAD / TEXTO
   ========================================================= */

function escapeHTML(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

/* =========================================================
   LOCAL STORAGE
   ========================================================= */

function getStorage(key, fallback = null) {
  try {
    const value = localStorage.getItem(key);

    if (value === null) {
      return fallback;
    }

    return safeJsonParse(value, fallback);
  } catch (error) {
    console.warn("Market Flash: error leyendo almacenamiento.", error);
    return fallback;
  }
}

function setStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn("Market Flash: error guardando almacenamiento.", error);
    return false;
  }
}

function removeStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn("Market Flash: error eliminando almacenamiento.", error);
  }
}

/* =========================================================
   UTILIDADES
   ========================================================= */

function generateId(prefix = "mf") {
  return (
    prefix +
    "_" +
    Date.now().toString(36) +
    "_" +
    Math.random().toString(36).substring(2, 9)
  );
}

function formatMoney(value) {
  const number = Number(value) || 0;

  try {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "DOP",
      maximumFractionDigits: 0
    }).format(number);
  } catch (error) {
    return "RD$" + number.toLocaleString("es-DO");
  }
}

function formatNumber(value) {
  const number = Number(value) || 0;

  try {
    return new Intl.NumberFormat("es-DO").format(number);
  } catch (error) {
    return String(number);
  }
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  try {
    return new Intl.DateTimeFormat("es-DO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).format(date);
  } catch (error) {
    return date.toLocaleDateString();
  }
}

function formatTime(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  try {
    return new Intl.DateTimeFormat("es-DO", {
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  } catch (error) {
    return date.toLocaleTimeString();
  }
}

/* =========================================================
   CONFIGURACIÓN
   ========================================================= */

function getDefaultConfig() {
  return {
    theme: "default",
    language: "es",
    notifications: true,
    soundNotifications: true,
    chatEnabled: true,
    whatsappEnabled: true,
    locationEnabled: true,
    darkMode: false,
    compactMode: false,
    animations: true,
    showOnlineStatus: true
  };
}

function loadConfiguration() {
  const saved = getStorage(
    STORAGE.CONFIG,
    getDefaultConfig()
  );

  AppState.config = {
    ...getDefaultConfig(),
    ...(saved || {})
  };

  return AppState.config;
}

function saveConfiguration() {
  setStorage(STORAGE.CONFIG, AppState.config);
  applyConfiguration();
}

function applyConfiguration() {
  const config = AppState.config || getDefaultConfig();

  document.body.classList.toggle(
    "dark-mode",
    Boolean(config.darkMode)
  );

  document.body.classList.toggle(
    "compact-mode",
    Boolean(config.compactMode)
  );

  document.body.classList.toggle(
    "no-animations",
    config.animations === false
  );

  try {
    document.documentElement.setAttribute(
      "data-theme",
      config.theme || "default"
    );
  } catch (error) {
    console.warn("No se pudo aplicar el tema.");
  }
}

/* =========================================================
   PRODUCTOS
   ========================================================= */

function loadProducts() {
  let products = getStorage(STORAGE.PRODUCTS, []);

  if (!Array.isArray(products)) {
    products = [];
  }

  /*
   * Si no existen productos guardados,
   * utilizamos los productos demo de app-data.js.
   */
  if (
    products.length === 0 &&
    Array.isArray(MFData.SEED_PRODUCTS)
  ) {
    products = MFData.SEED_PRODUCTS.map(product => ({
      ...product
    }));

    setStorage(STORAGE.PRODUCTS, products);
  }

  AppState.products = products;

  return products;
}

function saveProducts() {
  setStorage(STORAGE.PRODUCTS, AppState.products);
}

function normalizeProduct(product) {
  const item = product || {};

  return {
    id: item.id || generateId("product"),

    name:
      item.name ||
      item.product_name ||
      "Producto sin nombre",

    price:
      Number(
        item.price ||
        item.precio ||
        0
      ),

    quantity:
      Number(
        item.quantity ||
        item.cantidad ||
        1
      ),

    description:
      item.description ||
      item.descripcion ||
      "",

    category:
      item.category ||
      item.type ||
      item.categoria ||
      "other",

    location:
      item.location ||
      item.ubicacion ||
      "República Dominicana",

    image:
      item.image ||
      item.image_url ||
      item.photo ||
      "https://placehold.co/600x600?text=Market+Flash",

    images:
      Array.isArray(item.images)
        ? item.images
        : [],

    video:
      item.video ||
      item.video_url ||
      "",

    whatsappEnabled:
      item.whatsappEnabled !== false,

    chatEnabled:
      item.chatEnabled !== false,

    seller:
      item.seller || {
        id: item.user_id || "",
        name: "Vendedor",
        avatar:
          "https://placehold.co/100x100?text=MF"
      },

    views:
      Number(item.views || 0),

    likes:
      Number(item.likes || 0),

    saved:
      Number(item.saved || 0),

    comments:
      Number(item.comments || 0),

    profileVisits:
      Number(item.profileVisits || 0),

    promoted:
      Boolean(item.promoted),

    approved:
      item.approved !== false,

    createdAt:
      item.createdAt ||
      item.created_at ||
      new Date().toISOString()
  };
}

function getProductById(id) {
  return AppState.products.find(
    product => String(product.id) === String(id)
  );
}

/* =========================================================
   RENDER PRODUCTOS
   ========================================================= */

function renderProducts(products = AppState.filteredProducts) {
  const grid =
    byId("productsGrid") ||
    $(".products-grid") ||
    $("#products-grid");

  if (!grid) {
    return;
  }

  if (!Array.isArray(products) || products.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📦</div>

        <div class="empty-state-title">
          No hay productos
        </div>

        <div class="empty-state-text">
          Cuando se publiquen productos aparecerán aquí.
        </div>
      </div>
    `;

    return;
  }

  grid.innerHTML = products
    .map(product => renderProductCard(product))
    .join("");
}

function renderProductCard(product) {
  const item = normalizeProduct(product);

  const image =
    item.image ||
    "https://placehold.co/600x600?text=Market+Flash";

  const promoted = item.promoted
    ? `<span class="promoted-badge">⭐ PROMOCIONADO</span>`
    : "";

  return `
    <article
      class="product-card"
      data-product-id="${escapeHTML(item.id)}"
    >

      ${promoted}

      <img
        class="product-image"
        src="${escapeHTML(image)}"
        alt="${escapeHTML(item.name)}"
        loading="lazy"
        onerror="this.src='https://placehold.co/600x600?text=Market+Flash'"
      >

      <div class="product-info">

        <div class="product-title">
          ${escapeHTML(item.name)}
        </div>

        <div class="product-price">
          ${formatMoney(item.price)}
        </div>

        <div class="product-location">
          📍 ${escapeHTML(item.location)}
        </div>

        <div class="product-meta">

          <div class="product-stats">
            <span class="product-stat">
              👁 ${formatNumber(item.views)}
            </span>

            <span class="product-stat">
              ♥ ${formatNumber(item.likes)}
            </span>

            <span class="product-stat">
              🔖 ${formatNumber(item.saved)}
            </span>
          </div>

        </div>

        <div class="product-actions">

          <button
            type="button"
            class="product-action-btn primary"
            data-action="open-product"
            data-product-id="${escapeHTML(item.id)}"
          >
            Ver
          </button>

          <button
            type="button"
            class="product-action-btn"
            data-action="like-product"
            data-product-id="${escapeHTML(item.id)}"
          >
            ♥
          </button>

          <button
            type="button"
            class="product-action-btn"
            data-action="save-product"
            data-product-id="${escapeHTML(item.id)}"
          >
            🔖
          </button>

        </div>

      </div>
    </article>
  `;
}

/* =========================================================
   FILTROS Y BÚSQUEDA
   ========================================================= */

function applyProductFilters() {
  const text = (
    AppState.searchText || ""
  ).trim().toLowerCase();

  const category =
    AppState.currentCategory || "all";

  let result = [...AppState.products];

  if (text) {
    result = result.filter(product => {
      const item = normalizeProduct(product);

      const searchable = [
        item.name,
        item.description,
        item.location,
        item.category
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(text);
    });
  }

  if (category !== "all") {
    result = result.filter(product => {
      const item = normalizeProduct(product);

      return (
        String(item.category).toLowerCase() ===
        String(category).toLowerCase()
      );
    });
  }

  /*
   * Los productos más nuevos aparecen primero.
   */
  result.sort((a, b) => {
    const dateA = new Date(
      a.createdAt || a.created_at || 0
    ).getTime();

    const dateB = new Date(
      b.createdAt || b.created_at || 0
    ).getTime();

    return dateB - dateA;
  });

  AppState.filteredProducts = result;

  renderProducts(result);
}

function setCategory(category) {
  AppState.currentCategory =
    category || "all";

  $$(".category-chip").forEach(button => {
    const buttonCategory =
      button.dataset.category ||
      button.dataset.type ||
      "all";

    button.classList.toggle(
      "active",
      buttonCategory === AppState.currentCategory
    );
  });

  applyProductFilters();
}

function setupSearch() {
  const inputs = [
    byId("searchInput"),
    $(".search-input"),
    $(".search-box input")
  ].filter(Boolean);

  inputs.forEach(input => {
    input.addEventListener("input", event => {
      AppState.searchText =
        event.target.value || "";

      applyProductFilters();
    });
  });
}

function setupCategories() {
  $$(".category-chip").forEach(button => {
    button.addEventListener("click", () => {
      const category =
        button.dataset.category ||
        button.dataset.type ||
        "all";

      setCategory(category);
    });
  });
}

/* =========================================================
   MODALES
   ========================================================= */

function openModal(id) {
  const modal = byId(id);

  if (!modal) {
    return false;
  }

  modal.classList.add("active");
  modal.classList.add("show");

  modal.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.classList.add("modal-open");

  return true;
}

function closeModal(id) {
  const modal = byId(id);

  if (!modal) {
    return;
  }

  modal.classList.remove("active");
  modal.classList.remove("show");

  modal.setAttribute(
    "aria-hidden",
    "true"
  );

  if ($$(".modal.active, .modal.show").length === 0) {
    document.body.classList.remove("modal-open");
  }
}

function closeAllModals() {
  $$(".modal").forEach(modal => {
    modal.classList.remove("active");
    modal.classList.remove("show");

    modal.setAttribute(
      "aria-hidden",
      "true"
    );
  });

  document.body.classList.remove("modal-open");
}

function setupModalButtons() {
  $$(".modal-close").forEach(button => {
    button.addEventListener("click", () => {
      const modal =
        button.closest(".modal");

      if (modal && modal.id) {
        closeModal(modal.id);
      }
    });
  });

  $$(".modal").forEach(modal => {
    modal.addEventListener("click", event => {
      if (
        event.target === modal ||
        event.target.classList.contains(
          "modal-overlay"
        )
      ) {
        if (modal.dataset.preventClose === "true") {
          return;
        }

        closeModal(modal.id);
      }
    });
  });
}

/* =========================================================
   TOAST
   ========================================================= */

let toastTimer = null;

function showToast(message, type = "normal") {
  let toast =
    byId("toast") ||
    $(".toast");

  if (!toast) {
    toast = document.createElement("div");

    toast.id = "toast";
    toast.className = "toast";

    document.body.appendChild(toast);
  }

  toast.textContent = message;

  toast.dataset.type = type;

  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

/* =========================================================
   USUARIO
   ========================================================= */

function loadCurrentUser() {
  const user = getStorage(
    STORAGE.USER,
    null
  );

  AppState.currentUser = user;

  return user;
}

function saveCurrentUser(user) {
  AppState.currentUser = user;

  setStorage(
    STORAGE.USER,
    user
  );

  updateUserInterface();
}

function clearCurrentUser() {
  AppState.currentUser = null;

  removeStorage(STORAGE.USER);

  updateUserInterface();
}

function isLoggedIn() {
  return Boolean(
    AppState.currentUser
  );
}

function updateUserInterface() {
  const user =
    AppState.currentUser;

  const profileNameElements = $$(
    "[data-user-name]"
  );

  profileNameElements.forEach(element => {
    element.textContent =
      user?.name ||
      user?.full_name ||
      "Mi perfil";
  });

  const profilePhoneElements = $$(
    "[data-user-phone]"
  );

  profilePhoneElements.forEach(element => {
    element.textContent =
      user?.phone ||
      user?.whatsapp ||
      "";
  });

  const adminElements = $$(
    "[data-admin-only]"
  );

  adminElements.forEach(element => {
    element.style.display =
      AppState.isAdmin
        ? ""
        : "none";
  });
}

/* =========================================================
   REGISTRO
   ========================================================= */

async function registerUser() {
  const name =
    byId("registerName")?.value.trim() ||
    "";

  const email =
    byId("registerEmail")?.value.trim() ||
    "";

  const password =
    byId("registerPassword")?.value ||
    "";

  const phone =
    byId("registerPhone")?.value.trim() ||
    "";

  const cedula =
    byId("registerCedula")?.value.trim() ||
    "";

  if (!name) {
    showToast("Escribe tu nombre.");
    return;
  }

  if (!phone) {
    showToast(
      "El número de WhatsApp es obligatorio."
    );
    return;
  }

  if (!password || password.length < 6) {
    showToast(
      "La contraseña debe tener al menos 6 caracteres."
    );
    return;
  }

  const user = {
    id: generateId("user"),
    name,
    email,
    password,
    phone,
    whatsapp: phone,
    cedula,

    avatar:
      "https://placehold.co/100x100?text=MF",

    createdAt:
      new Date().toISOString(),

    lastOnline:
      new Date().toISOString(),

    role: "user"
  };

  /*
   * Primero intentamos Supabase.
   * Si todavía no está configurado,
   * usamos el modo local de desarrollo.
   */
  try {
    if (
      MFSupabase &&
      typeof MFSupabase.supabaseRegister ===
        "function"
    ) {
      const result =
        await MFSupabase.supabaseRegister(
          email,
          password,
          {
            name,
            phone,
            whatsapp: phone,
            cedula
          }
        );

      if (result?.user) {
        saveCurrentUser({
          ...user,
          id: result.user.id
        });
      } else {
        saveCurrentUser(user);
      }
    } else {
      saveCurrentUser(user);
    }
  } catch (error) {
    console.warn(
      "Registro Supabase no disponible. Modo local.",
      error
    );

    saveCurrentUser(user);
  }

  closeModal("registerModal");

  showToast(
    "Cuenta creada correctamente."
  );

  updateUserInterface();
}

/* =========================================================
   LOGIN
   ========================================================= */

async function loginUser() {
  const email =
    byId("loginEmail")?.value.trim() ||
    "";

  const password =
    byId("loginPassword")?.value ||
    "";

  if (!email || !password) {
    showToast(
      "Completa correo y contraseña."
    );
    return;
  }

  let loggedUser = null;

  try {
    if (
      MFSupabase &&
      typeof MFSupabase.supabaseLogin ===
        "function"
    ) {
      const result =
        await MFSupabase.supabaseLogin(
          email,
          password
        );

      if (result?.user) {
        loggedUser = {
          id: result.user.id,
          email:
            result.user.email ||
            email,
          name:
            result.user.user_metadata?.name ||
            result.user.user_metadata?.full_name ||
            "Usuario Market Flash",
          phone:
            result.user.user_metadata?.phone ||
            "",
          whatsapp:
            result.user.user_metadata?.whatsapp ||
            "",
          cedula:
            result.user.user_metadata?.cedula ||
            "",
          avatar:
            result.user.user_metadata?.avatar ||
            "https://placehold.co/100x100?text=MF",
          role:
            result.user.user_metadata?.role ||
            "user"
        };
      }
    }
  } catch (error) {
    console.warn(
      "Inicio de sesión Supabase no disponible.",
      error
    );
  }

  /*
   * Modo local de desarrollo.
   */
  if (!loggedUser) {
    const savedUser =
      getStorage(STORAGE.USER, null);

    if (
      savedUser &&
      (
        savedUser.email === email ||
        savedUser.phone === email
      )
    ) {
      loggedUser = savedUser;
    }
  }

  if (!loggedUser) {
    showToast(
      "No se encontró una cuenta con esos datos."
    );
    return;
  }

  AppState.currentUser =
    loggedUser;

  AppState.currentUser.lastOnline =
    new Date().toISOString();

  saveCurrentUser(
    AppState.currentUser
  );

  closeModal("loginModal");

  showToast(
    "Has iniciado sesión correctamente."
  );

  updateUserInterface();
}

/* =========================================================
   LOGOUT
   ========================================================= */

async function logoutUser() {
  try {
    if (
      MFSupabase &&
      typeof MFSupabase.supabaseLogout ===
        "function"
    ) {
      await MFSupabase.supabaseLogout();
    }
  } catch (error) {
    console.warn(
      "No se pudo cerrar sesión en Supabase.",
      error
    );
  }

  clearCurrentUser();

  AppState.isAdmin = false;
  AppState.adminAuthenticated = false;

  closeAllModals();

  showToast(
    "Sesión cerrada correctamente."
  );
}

/* =========================================================
   PUBLICAR PRODUCTO
   ========================================================= */

function getPublishFormData() {
  const name =
    byId("productName")?.value.trim() ||
    byId("publishProductName")?.value.trim() ||
    "";

  const category =
    byId("productCategory")?.value ||
    byId("publishCategory")?.value ||
    "other";

  const price =
    Number(
      byId("productPrice")?.value ||
      byId("publishPrice")?.value ||
      0
    );

  const quantity =
    Number(
      byId("productQuantity")?.value ||
      byId("publishQuantity")?.value ||
      1
    );

  const description =
    byId("productDescription")?.value.trim() ||
    byId("publishDescription")?.value.trim() ||
    "";

  const location =
    byId("productLocation")?.value.trim() ||
    byId("publishLocation")?.value.trim() ||
    "República Dominicana";

  const whatsappToggle =
    byId("whatsappToggle") ||
    byId("publishWhatsapp");

  const chatToggle =
    byId("chatToggle") ||
    byId("publishChat");

  return {
    name,
    category,
    price,
    quantity,
    description,
    location,

    whatsappEnabled:
      whatsappToggle
        ? Boolean(whatsappToggle.checked)
        : true,

    chatEnabled:
      chatToggle
        ? Boolean(chatToggle.checked)
        : true
  };
}

function validatePublishData(data) {
  if (!data.name) {
    showToast(
      "Escribe el nombre del producto."
    );
    return false;
  }

  if (
    !Number.isFinite(data.price) ||
    data.price <= 0
  ) {
    showToast(
      "Escribe un precio válido."
    );
    return false;
  }

  if (
    !Number.isFinite(data.quantity) ||
    data.quantity < 1
  ) {
    showToast(
      "La cantidad debe ser al menos 1."
    );
    return false;
  }

  if (!data.description) {
    showToast(
      "Escribe una descripción."
    );
    return false;
  }

  return true;
}

async function publishProduct() {
  const data =
    getPublishFormData();

  if (!validatePublishData(data)) {
    return;
  }

  if (!isLoggedIn()) {
    showToast(
      "Inicia sesión para publicar productos."
    );

    openModal("loginModal");

    return;
  }

  const user =
    AppState.currentUser;

  const firstImage =
    AppState.selectedImages[0] ||
    "https://placehold.co/600x600?text=Market+Flash";

  const product = {
    id: generateId("product"),

    name: data.name,
    price: data.price,
    quantity: data.quantity,

    category: data.category,

    description:
      data.description,

    location:
      data.location,

    image: firstImage,

    images:
      [...AppState.selectedImages],

    video:
      AppState.selectedVideo || "",

    whatsappEnabled:
      data.whatsappEnabled,

    chatEnabled:
      data.chatEnabled,

    seller: {
      id: user.id,
      name:
        user.name ||
        "Usuario Market Flash",

      avatar:
        user.avatar ||
        "https://placehold.co/100x100?text=MF",

      phone:
        user.phone ||
        user.whatsapp ||
        ""
    },

    views: 0,
    likes: 0,
    saved: 0,
    comments: 0,
    profileVisits: 0,

    promoted: false,

    /*
     * Todo producto publicado normalmente aparece
     * inmediatamente en Productos recientes.
     */
    approved: true,

    createdAt:
      new Date().toISOString()
  };

  let savedInBackend = false;

  /*
   * Intentamos guardar en Supabase.
   * Si todavía no está configurado,
   * continuamos utilizando localStorage.
   */
  try {
    if (
      MFSupabase &&
      typeof MFSupabase.supabaseCreateProduct ===
        "function"
    ) {
      const result =
        await MFSupabase.supabaseCreateProduct(
          product
        );

      if (result) {
        savedInBackend = true;

        if (result.id) {
          product.id =
            result.id;
        }
      }
    }
  } catch (error) {
    console.warn(
      "Supabase no disponible para publicación.",
      error
    );
  }

  /*
   * Siempre mantenemos una copia local durante
   * la etapa de desarrollo para evitar que la
   * aplicación desaparezca si Supabase todavía
   * no está configurado.
   */
  if (!savedInBackend) {
    AppState.products.unshift(
      product
    );

    saveProducts();
  } else {
    /*
     * También actualizamos la memoria local.
     */
    AppState.products.unshift(
      product
    );

    saveProducts();
  }

  /*
   * IMPORTANTE:
   * Al publicar, el producto aparece automáticamente
   * en Productos recientes.
   */
  AppState.currentCategory = "all";
  AppState.searchText = "";

  applyProductFilters();

  resetPublishForm();

  closeModal("publishModal");

  showToast(
    "¡Producto publicado! Ya aparece en Productos recientes."
  );

  updateStatistics({
    productsPublished: 1
  });
}

/* =========================================================
   LIMPIAR FORMULARIO DE PUBLICACIÓN
   ========================================================= */

function resetPublishForm() {
  AppState.selectedImages = [];
  AppState.selectedVideo = null;

  const form =
    byId("publishForm");

  if (form) {
    try {
      form.reset();
    } catch (error) {
      console.warn(
        "No se pudo reiniciar el formulario."
      );
    }
  }

  const imageInput =
    byId("productImages") ||
    byId("publishImages");

  if (imageInput) {
    imageInput.value = "";
  }

  const videoInput =
    byId("productVideo") ||
    byId("publishVideo");

  if (videoInput) {
    videoInput.value = "";
  }

  const preview =
    byId("imagePreview") ||
    byId("imagePreviewContainer") ||
    $(".image-preview-container");

  if (preview) {
    preview.innerHTML = "";
  }
}

/* =========================================================
   IMÁGENES
   ========================================================= */

function setupImageUpload() {
  const input =
    byId("productImages") ||
    byId("publishImages");

  if (!input) {
    return;
  }

  input.addEventListener(
    "change",
    event => {
      const files =
        Array.from(
          event.target.files || []
        );

      AppState.selectedImages = [];

      if (files.length === 0) {
        renderImagePreviews();
        return;
      }

      files.forEach(file => {
        if (!file.type.startsWith("image/")) {
          return;
        }

        const reader =
          new FileReader();

        reader.onload = e => {
          AppState.selectedImages.push(
            e.target.result
          );

          renderImagePreviews();
        };

        reader.readAsDataURL(file);
      });
    }
  );
}

function renderImagePreviews() {
  const container =
    byId("imagePreview") ||
    byId("imagePreviewContainer") ||
    $(".image-preview-container");

  if (!container) {
    return;
  }

  container.innerHTML =
    AppState.selectedImages
      .map(
        (image, index) => `
          <div class="image-preview">

            <img
              src="${escapeHTML(image)}"
              alt="Imagen ${index + 1}"
            >

            <button
              type="button"
              class="remove-image"
              data-remove-image="${index}"
            >
              ×
            </button>

          </div>
        `
      )
      .join("");
}

/* =========================================================
   VIDEO
   ========================================================= */

function setupVideoUpload() {
  const input =
    byId("productVideo") ||
    byId("publishVideo");

  if (!input) {
    return;
  }

  input.addEventListener(
    "change",
    event => {
      const file =
        event.target.files?.[0];

      if (!file) {
        AppState.selectedVideo = null;
        return;
      }

      if (!file.type.startsWith("video/")) {
        showToast(
          "Selecciona un archivo de vídeo válido."
        );

        input.value = "";

        AppState.selectedVideo = null;

        return;
      }

      const reader =
        new FileReader();

      reader.onload = e => {
        AppState.selectedVideo =
          e.target.result;

        showToast(
          "Vídeo preparado correctamente."
        );
      };

      reader.readAsDataURL(file);
    }
  );
}

/* =========================================================
   ESTADÍSTICAS
   ========================================================= */

function loadStatistics() {
  const defaults =
    MFData.DEFAULT_STATISTICS || {
      sales: 0,
      views: 0,
      likes: 0,
      comments: 0,
      saved: 0,
      profileVisits: 0,
      productsPublished: 0,
      messagesReceived: 0,
      totalIncome: 0
    };

  const saved =
    getStorage(
      STORAGE.STATISTICS,
      defaults
    );

  AppState.statistics = {
    ...defaults,
    ...(saved || {})
  };

  return AppState.statistics;
}

function saveStatistics() {
  setStorage(
    STORAGE.STATISTICS,
    AppState.statistics
  );
}

function updateStatistics(changes = {}) {
  Object.keys(changes).forEach(key => {
    const amount =
      Number(changes[key]) || 0;

    if (
      typeof AppState.statistics[key] !==
      "number"
    ) {
      AppState.statistics[key] = 0;
    }

    AppState.statistics[key] +=
      amount;
  });

  saveStatistics();

  renderStatistics();
}

function calculateProductStatistics() {
  const userId =
    AppState.currentUser?.id;

  if (!userId) {
    return {
      sales: 0,
      views: 0,
      likes: 0,
      comments: 0,
      saved: 0,
      profileVisits: 0
    };
  }

  const myProducts =
    AppState.products.filter(
      product =>
        String(
          product.seller?.id ||
          product.user_id ||
          ""
        ) === String(userId)
    );

  return {
    sales: Number(
      AppState.statistics.sales || 0
    ),

    views: myProducts.reduce(
      (sum, product) =>
        sum +
        Number(
          product.views || 0
        ),
      0
    ),

    likes: myProducts.reduce(
      (sum, product) =>
        sum +
        Number(
          product.likes || 0
        ),
      0
    ),

    comments: myProducts.reduce(
      (sum, product) =>
        sum +
        Number(
          product.comments || 0
        ),
      0
    ),

    saved: myProducts.reduce(
      (sum, product) =>
        sum +
        Number(
          product.saved || 0
        ),
      0
    ),

    profileVisits:
      myProducts.reduce(
        (sum, product) =>
          sum +
          Number(
            product.profileVisits || 0
          ),
        0
      )
  };
}

function renderStatistics() {
  const stats =
    calculateProductStatistics();

  const values = {
    sales:
      stats.sales,

    views:
      stats.views,

    likes:
      stats.likes,

    comments:
      stats.comments,

    saved:
      stats.saved,

    profileVisits:
      stats.profileVisits
  };

  Object.keys(values).forEach(key => {
    $$(
      `[data-stat="${key}"]`
    ).forEach(element => {
      element.textContent =
        formatNumber(values[key]);
    });
  });

  const mapping = {
    sales: [
      "statSales",
      "statisticsSales"
    ],

    views: [
      "statViews",
      "statisticsViews"
    ],

    likes: [
      "statLikes",
      "statisticsLikes"
    ],

    comments: [
      "statComments",
      "statisticsComments"
    ],

    saved: [
      "statSaved",
      "statisticsSaved"
    ],

    profileVisits: [
      "statProfileVisits",
      "statisticsProfileVisits"
    ]
  };

  Object.keys(mapping).forEach(key => {
    mapping[key].forEach(id => {
      const element = byId(id);

      if (element) {
        element.textContent =
          formatNumber(values[key]);
      }
    });
  });
}

/* =========================================================
   NOTIFICACIONES
   ========================================================= */

function loadNotifications() {
  const notifications =
    getStorage(
      STORAGE.NOTIFICATIONS,
      MFData.DEFAULT_NOTIFICATIONS || []
    );

  AppState.notifications =
    Array.isArray(notifications)
      ? notifications
      : [];

  updateNotificationBadge();
}

function saveNotifications() {
  setStorage(
    STORAGE.NOTIFICATIONS,
    AppState.notifications
  );
}

function addNotification(
  title,
  message,
  type = "info"
) {
  AppState.notifications.unshift({
    id: generateId("notification"),

    title,
    message,
    type,

    read: false,

    createdAt:
      new Date().toISOString()
  });

  saveNotifications();

  updateNotificationBadge();
}

function updateNotificationBadge() {
  const unread =
    AppState.notifications.filter(
      notification =>
        notification.read !== true
    ).length;

  const badges = $$(".notification-badge");

  badges.forEach(badge => {
    if (unread > 0) {
      badge.textContent =
        unread > 99
          ? "99+"
          : String(unread);

      badge.style.display =
        "flex";
    } else {
      badge.textContent = "";
      badge.style.display =
        "none";
    }
  });
}

function showNotifications() {
  const unread =
    AppState.notifications.filter(
      notification =>
        notification.read !== true
    );

  if (unread.length === 0) {
    showToast(
      "No tienes notificaciones nuevas."
    );
  } else {
    const first =
      unread[0];

    showToast(
      first.title ||
      first.message ||
      "Tienes una notificación nueva."
    );
  }

  AppState.notifications =
    AppState.notifications.map(
      notification => ({
        ...notification,
        read: true
      })
    );

  saveNotifications();

  updateNotificationBadge();
}

/* =========================================================
   MENSAJES / CHAT
   ========================================================= */

function loadMessages() {
  const messages =
    getStorage(
      STORAGE.MESSAGES,
      MFData.DEFAULT_MESSAGES || []
    );

  AppState.messages =
    Array.isArray(messages)
      ? messages
      : [];
}

function saveMessages() {
  setStorage(
    STORAGE.MESSAGES,
    AppState.messages
  );
}

function getConversation(
  userA,
  userB
) {
  return AppState.messages.filter(
    message => {
      const from =
        String(message.from || "");

      const to =
        String(message.to || "");

      return (
        (
          from === String(userA) &&
          to === String(userB)
        ) ||
        (
          from === String(userB) &&
          to === String(userA)
        )
      );
    }
  );
}

function openSellerChat(product) {
  if (!product) {
    return;
  }

  const item =
    normalizeProduct(product);

  if (
    item.chatEnabled === false
  ) {
    showToast(
      "Este vendedor no tiene activado el chat."
    );

    return;
  }

  AppState.currentProduct =
    item;

  AppState.currentSeller =
    item.seller;

  AppState.currentChat = {
    sellerId:
      item.seller?.id || "",
    productId:
      item.id
  };

  renderChatHeader();

  renderChatMessages();

  openModal("chatModal");
}

function renderChatHeader() {
  const seller =
    AppState.currentSeller || {};

  const avatar =
    seller.avatar ||
    "https://placehold.co/100x100?text=MF";

  const name =
    seller.name ||
    "Vendedor";

  const avatarElements = $$(
    "[data-chat-seller-avatar]"
  );

  avatarElements.forEach(element => {
    element.src = avatar;
  });

  const nameElements = $$(
    "[data-chat-seller-name]"
  );

  nameElements.forEach(element => {
    element.textContent =
      name;
  });

  const statusElements = $$(
    "[data-chat-seller-status]"
  );

  statusElements.forEach(element => {
    element.textContent =
      AppState.config.showOnlineStatus
        ? "● Disponible"
        : "";
  });

  const defaultAvatar =
    byId("chatSellerAvatar");

  if (defaultAvatar) {
    defaultAvatar.src = avatar;
  }

  const defaultName =
    byId("chatSellerName");

  if (defaultName) {
    defaultName.textContent =
      name;
  }

  const defaultStatus =
    byId("chatSellerStatus");

  if (defaultStatus) {
    defaultStatus.textContent =
      AppState.config.showOnlineStatus
        ? "● Disponible"
        : "";
  }
}

function renderChatMessages() {
  const container =
    byId("chatMessages") ||
    $(".chat-messages");

  if (!container) {
    return;
  }

  const currentUserId =
    AppState.currentUser?.id ||
    "";

  const sellerId =
    AppState.currentSeller?.id ||
    "";

  let messages =
    getConversation(
      currentUserId,
      sellerId
    );

  /*
   * Si no existe conversación,
   * mostramos un mensaje de bienvenida.
   */
  if (messages.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          💬
        </div>

        <div class="empty-state-title">
          Inicia la conversación
        </div>

        <div class="empty-state-text">
          Pregunta al vendedor sobre este producto.
        </div>
      </div>
    `;

    return;
  }

  messages.sort(
    (a, b) =>
      new Date(a.createdAt).getTime() -
      new Date(b.createdAt).getTime()
  );

  container.innerHTML =
    messages
      .map(message => {
        const sent =
          String(message.from) ===
          String(currentUserId);

        return `
          <div class="message ${
            sent
              ? "sent"
              : "received"
          }">

            <div class="message-bubble">

              <div>
                ${escapeHTML(
                  message.text || ""
                )}
              </div>

              <div class="message-time">
                ${formatTime(
                  message.createdAt
                )}
              </div>

            </div>

          </div>
        `;
      })
      .join("");

  container.scrollTop =
    container.scrollHeight;
}

function sendChatMessage() {
  const input =
    byId("chatInput") ||
    $(".chat-input");

  if (!input) {
    return;
  }

  const text =
    input.value.trim();

  if (!text) {
    return;
  }

  if (!isLoggedIn()) {
    showToast(
      "Inicia sesión para enviar mensajes."
    );

    return;
  }

  const sellerId =
    AppState.currentSeller?.id;

  if (!sellerId) {
    showToast(
      "No se encontró el vendedor."
    );

    return;
  }

  const message = {
    id: generateId("message"),

    from:
      AppState.currentUser.id,

    to:
      sellerId,

    productId:
      AppState.currentProduct?.id ||
      "",

    text,

    read: false,

    createdAt:
      new Date().toISOString()
  };

  AppState.messages.push(
    message
  );

  saveMessages();

  input.value = "";

  renderChatMessages();

  updateStatistics({
    messagesReceived: 1
  });
}

/* =========================================================
   AQUÍ TERMINA LA PARTE 1/2
   ========================================================= *//* =========================================================
   MARKET FLASH
   script.js — PARTE 2/2
   ========================================================= */

/* =========================================================
   PERFIL
   ========================================================= */

function openProfile() {
  if (!isLoggedIn()) {
    openModal("loginModal");

    showToast(
      "Inicia sesión para ver tu perfil."
    );

    return;
  }

  updateUserInterface();

  renderStatistics();

  openModal("profileModal");
}

/* =========================================================
   MIS ESTADÍSTICAS
   ========================================================= */

function openStatistics() {
  if (!isLoggedIn()) {
    showToast(
      "Inicia sesión para ver tus estadísticas."
    );

    openModal("loginModal");

    return;
  }

  renderStatistics();

  openModal("statisticsModal");
}

/* =========================================================
   CONFIGURACIÓN
   ========================================================= */

function openSettings() {
  renderSettingsState();

  openModal("settingsModal");
}

function renderSettingsState() {
  const config =
    AppState.config ||
    getDefaultConfig();

  const switches = {
    notifications:
      config.notifications,

    soundNotifications:
      config.soundNotifications,

    chatEnabled:
      config.chatEnabled,

    whatsappEnabled:
      config.whatsappEnabled,

    locationEnabled:
      config.locationEnabled,

    showOnlineStatus:
      config.showOnlineStatus,

    darkMode:
      config.darkMode,

    compactMode:
      config.compactMode,

    animations:
      config.animations
  };

  Object.keys(switches).forEach(key => {
    const elements = $$(
      `[data-setting="${key}"]`
    );

    elements.forEach(element => {
      if (
        element.type === "checkbox"
      ) {
        element.checked =
          Boolean(switches[key]);
      }
    });

    const bySettingId =
      byId(
        `setting-${key}`
      );

    if (
      bySettingId &&
      bySettingId.type === "checkbox"
    ) {
      bySettingId.checked =
        Boolean(switches[key]);
    }
  });

  applyConfiguration();
}

function updateSetting(
  setting,
  value
) {
  if (
    !Object.prototype.hasOwnProperty.call(
      AppState.config,
      setting
    )
  ) {
    return;
  }

  AppState.config[setting] =
    value;

  saveConfiguration();

  renderSettingsState();

  showToast(
    "Configuración actualizada."
  );
}

function cycleTheme() {
  const themes = [
    "default",
    "blue",
    "dark"
  ];

  const current =
    AppState.config.theme ||
    "default";

  const index =
    themes.indexOf(current);

  const next =
    themes[
      (index + 1) % themes.length
    ];

  AppState.config.theme =
    next;

  if (next === "dark") {
    AppState.config.darkMode =
      true;
  } else {
    AppState.config.darkMode =
      false;
  }

  saveConfiguration();

  showToast(
    `Tema cambiado a ${next}.`
  );
}

/* =========================================================
   ADMINISTRACIÓN
   ========================================================= */

function loadAdminConfig() {
  const defaults =
    MFData.DEFAULT_ADMIN_CONFIG || {
      isAdmin: false,
      advertisingEnabled: true,
      promotionsEnabled: true,
      paymentsEnabled: true,
      userManagementEnabled: true,
      productModerationEnabled: true,
      statisticsEnabled: true
    };

  const saved =
    getStorage(
      STORAGE.ADMIN,
      defaults
    );

  AppState.adminConfig = {
    ...defaults,
    ...(saved || {})
  };

  /*
   * El estado administrativo real debe venir
   * del usuario/autenticación del backend.
   */
  const user =
    AppState.currentUser;

  AppState.isAdmin =
    Boolean(
      user &&
      (
        user.role === "admin" ||
        user.isAdmin === true
      )
    );

  return AppState.adminConfig;
}

function saveAdminConfig() {
  setStorage(
    STORAGE.ADMIN,
    AppState.adminConfig
  );
}

function requestAdminAccess() {
  if (!isLoggedIn()) {
    showToast(
      "Inicia sesión para entrar al panel."
    );

    openModal("loginModal");

    return;
  }

  /*
   * No colocamos la contraseña administrativa
   * dentro del JavaScript público.
   *
   * La verificación definitiva se realizará
   * mediante Supabase/backend.
   */
  openModal(
    "adminPasswordModal"
  );
}

async function verifyAdminPassword() {
  const input =
    byId("adminPassword") ||
    byId("adminPasswordInput");

  const password =
    input?.value || "";

  if (!password) {
    showToast(
      "Introduce la contraseña de administración."
    );

    return;
  }

  /*
   * SEGURIDAD:
   *
   * No se almacena aquí una contraseña administrativa
   * real. El frontend no debe contener secretos.
   *
   * Para desarrollo, comprobamos únicamente que
   * la cuenta tenga rol administrativo.
   */
  const user =
    AppState.currentUser;

  const hasAdminRole =
    Boolean(
      user &&
      (
        user.role === "admin" ||
        user.isAdmin === true
      )
    );

  if (!hasAdminRole) {
    showToast(
      "Esta cuenta no tiene permisos de administrador."
    );

    return;
  }

  AppState.adminAuthenticated =
    true;

  AppState.isAdmin =
    true;

  updateUserInterface();

  closeModal(
    "adminPasswordModal"
  );

  openAdminPanel();
}

function openAdminPanel() {
  if (
    !AppState.isAdmin ||
    !AppState.adminAuthenticated
  ) {
    requestAdminAccess();
    return;
  }

  renderAdminPanel();

  openModal("adminModal");
}

function renderAdminPanel() {
  loadAdminConfig();

  const userCount =
    $$(
      "[data-admin-users]"
    );

  userCount.forEach(element => {
    element.textContent =
      "—";
  });

  const productCount =
    $$(
      "[data-admin-products]"
    );

  productCount.forEach(element => {
    element.textContent =
      formatNumber(
        AppState.products.length
      );
  });

  const statisticsElements =
    $$(
      "[data-admin-statistics]"
    );

  statisticsElements.forEach(
    element => {
      element.textContent =
        formatNumber(
          AppState.products.reduce(
            (sum, product) =>
              sum +
              Number(
                product.views || 0
              ),
            0
          )
        );
    }
  );

  const advertisingElements =
    $$(
      "[data-admin-advertising]"
    );

  advertisingElements.forEach(
    element => {
      element.textContent =
        AppState.adminConfig
          .advertisingEnabled
          ? "ACTIVA"
          : "DESACTIVADA";
    }
  );
}

/* =========================================================
   CAMBIAR CONTRASEÑA ADMINISTRATIVA
   ========================================================= */

async function changeAdminPassword() {
  if (
    !AppState.isAdmin ||
    !AppState.adminAuthenticated
  ) {
    showToast(
      "No tienes acceso administrativo."
    );

    return;
  }

  const currentPassword =
    byId("currentAdminPassword")
      ?.value || "";

  const newPassword =
    byId("newAdminPassword")
      ?.value || "";

  const confirmPassword =
    byId("confirmAdminPassword")
      ?.value || "";

  if (
    !currentPassword ||
    !newPassword ||
    !confirmPassword
  ) {
    showToast(
      "Completa todos los campos."
    );

    return;
  }

  if (newPassword.length < 6) {
    showToast(
      "La nueva contraseña debe tener al menos 6 caracteres."
    );

    return;
  }

  if (
    newPassword !==
    confirmPassword
  ) {
    showToast(
      "Las contraseñas nuevas no coinciden."
    );

    return;
  }

  /*
   * El cambio definitivo se hará mediante
   * Supabase Auth/backend.
   */
  try {
    if (
      MFSupabase &&
      typeof MFSupabase.supabaseUpdatePassword ===
        "function"
    ) {
      await MFSupabase.supabaseUpdatePassword(
        newPassword
      );
    }
  } catch (error) {
    console.warn(
      "No se pudo cambiar la contraseña mediante Supabase.",
      error
    );
  }

  closeModal(
    "changeAdminPasswordModal"
  );

  showToast(
    "Solicitud de cambio de contraseña procesada."
  );
}

/* =========================================================
   PUBLICIDAD
   ========================================================= */

function renderAdvertising() {
  const container =
    byId("advertisingContainer") ||
    $(".ad-container");

  if (!container) {
    return;
  }

  const enabled =
    AppState.adminConfig
      ?.advertisingEnabled !== false;

  if (!enabled) {
    container.innerHTML = `
      <div class="ad-content">
        <div class="ad-title">
          Publicidad
        </div>

        <div class="ad-text">
          La publicidad está temporalmente desactivada.
        </div>
      </div>
    `;

    return;
  }

  const promoted =
    AppState.products.filter(
      product =>
        product.promoted === true &&
        product.approved !== false
    );

  if (promoted.length === 0) {
    container.innerHTML = `
      <div class="ad-content">

        <div class="ad-title">
          MARKET FLASH
        </div>

        <div class="ad-text">
          Aquí aparecerán las publicaciones
          promocionadas aprobadas por administración.
        </div>

      </div>
    `;

    return;
  }

  const product =
    normalizeProduct(
      promoted[0]
    );

  container.innerHTML = `
    <div class="ad-content">

      <div class="ad-title">
        ⭐ ${escapeHTML(product.name)}
      </div>

      <div class="ad-text">
        ${formatMoney(product.price)}
        · ${escapeHTML(product.location)}
      </div>

      <button
        type="button"
        class="ad-button"
        data-action="open-product"
        data-product-id="${escapeHTML(product.id)}"
      >
        Ver publicación
      </button>

    </div>
  `;
}

/* =========================================================
   PLANES DE PROMOCIÓN
   ========================================================= */

function renderPromotionPlans() {
  const container =
    byId("promotionPlans") ||
    $(".promotion-plans");

  if (!container) {
    return;
  }

  const plans =
    MFData.AD_PLANS || {
      basic: {
        name: "Básico",
        price: 100,
        days: 3
      },

      normal: {
        name: "Normal",
        price: 250,
        days: 7
      },

      pro: {
        name: "Pro",
        price: 500,
        days: 15
      }
    };

  container.innerHTML =
    Object.entries(plans)
      .map(
        ([key, plan]) => `
          <button
            type="button"
            class="promotion-plan ${
              AppState.selectedPromotion === key
                ? "selected"
                : ""
            }"
            data-promotion="${escapeHTML(key)}"
          >

            <div class="promotion-plan-title">
              ${escapeHTML(plan.name)}
            </div>

            <div class="promotion-plan-price">
              ${formatMoney(plan.price)}
            </div>

            <div class="promotion-plan-duration">
              ${formatNumber(plan.days)}
              días
            </div>

          </button>
        `
      )
      .join("");
}

function selectPromotionPlan(
  plan
) {
  AppState.selectedPromotion =
    plan;

  renderPromotionPlans();
}

/* =========================================================
   MÉTODOS DE PAGO
   ========================================================= */

function renderPaymentMethods() {
  const container =
    byId("paymentMethods") ||
    $(".payment-methods");

  if (!container) {
    return;
  }

  const methods =
    MFData.PAYMENT_METHODS || {
      bank: "Banco",
      paypal: "PayPal",
      binance: "Binance"
    };

  container.innerHTML =
    Object.entries(methods)
      .map(
        ([key, name]) => `
          <button
            type="button"
            class="payment-method ${
              AppState.selectedPaymentMethod === key
                ? "selected"
                : ""
            }"
            data-payment="${escapeHTML(key)}"
          >
            ${escapeHTML(name)}
          </button>
        `
      )
      .join("");
}

function selectPaymentMethod(
  method
) {
  AppState.selectedPaymentMethod =
    method;

  renderPaymentMethods();
}

/* =========================================================
   ENVIAR PROMOCIÓN
   ========================================================= */

function submitPromotion() {
  if (!isLoggedIn()) {
    showToast(
      "Inicia sesión para promocionar."
    );

    openModal("loginModal");

    return;
  }

  if (
    !AppState.selectedPromotion
  ) {
    showToast(
      "Selecciona un plan de promoción."
    );

    return;
  }

  if (
    !AppState.selectedPaymentMethod
  ) {
    showToast(
      "Selecciona un método de pago."
    );

    return;
  }

  /*
   * El comprobante real se conectará posteriormente
   * con Storage de Supabase.
   */
  addNotification(
    "Promoción enviada",
    "Tu solicitud de promoción fue enviada para revisión administrativa.",
    "promotion"
  );

  closeModal(
    "promotionModal"
  );

  showToast(
    "Promoción enviada para revisión."
  );
}

/* =========================================================
   PRODUCTO
   ========================================================= */

function openProductDetail(
  productId
) {
  const product =
    getProductById(productId);

  if (!product) {
    showToast(
      "No se encontró el producto."
    );

    return;
  }

  AppState.currentProduct =
    normalizeProduct(product);

  incrementProductViews(
    productId
  );

  /*
   * Si existe un modal de detalle en el HTML,
   * lo utilizamos.
   */
  const detailModal =
    byId("productDetailModal");

  if (detailModal) {
    const title =
      detailModal.querySelector(
        "[data-product-title]"
      );

    const price =
      detailModal.querySelector(
        "[data-product-price]"
      );

    const description =
      detailModal.querySelector(
        "[data-product-description]"
      );

    const image =
      detailModal.querySelector(
        "[data-product-image]"
      );

    if (title) {
      title.textContent =
        AppState.currentProduct.name;
    }

    if (price) {
      price.textContent =
        formatMoney(
          AppState.currentProduct.price
        );
    }

    if (description) {
      description.textContent =
        AppState.currentProduct.description;
    }

    if (image) {
      image.src =
        AppState.currentProduct.image;
    }

    openModal(
      "productDetailModal"
    );

    return;
  }

  showToast(
    `${AppState.currentProduct.name} · ${formatMoney(AppState.currentProduct.price)}`
  );
}

function incrementProductViews(
  productId
) {
  const product =
    getProductById(productId);

  if (!product) {
    return;
  }

  product.views =
    Number(product.views || 0) +
    1;

  saveProducts();

  updateStatistics({
    views: 0
  });

  renderProducts(
    AppState.filteredProducts
  );
}

/* =========================================================
   ME GUSTA
   ========================================================= */

function likeProduct(
  productId
) {
  const product =
    getProductById(productId);

  if (!product) {
    return;
  }

  product.likes =
    Number(product.likes || 0) +
    1;

  saveProducts();

  renderProducts(
    AppState.filteredProducts
  );

  showToast(
    "Te gusta esta publicación."
  );
}

/* =========================================================
   GUARDAR
   ========================================================= */

function saveProduct(
  productId
) {
  const product =
    getProductById(productId);

  if (!product) {
    return;
  }

  product.saved =
    Number(product.saved || 0) +
    1;

  saveProducts();

  renderProducts(
    AppState.filteredProducts
  );

  showToast(
    "Producto guardado."
  );
}

/* =========================================================
   EDITAR PERFIL
   ========================================================= */

function openEditProfile() {
  if (!isLoggedIn()) {
    openModal("loginModal");
    return;
  }

  const user =
    AppState.currentUser;

  const nameInput =
    byId("editProfileName");

  const phoneInput =
    byId("editProfilePhone");

  const emailInput =
    byId("editProfileEmail");

  if (nameInput) {
    nameInput.value =
      user.name || "";
  }

  if (phoneInput) {
    phoneInput.value =
      user.phone ||
      user.whatsapp ||
      "";
  }

  if (emailInput) {
    emailInput.value =
      user.email || "";
  }

  openModal(
    "editProfileModal"
  );
}

function saveProfileChanges() {
  if (!isLoggedIn()) {
    return;
  }

  const user =
    AppState.currentUser;

  const name =
    byId("editProfileName")
      ?.value.trim();

  const phone =
    byId("editProfilePhone")
      ?.value.trim();

  const email =
    byId("editProfileEmail")
      ?.value.trim();

  if (name) {
    user.name = name;
  }

  if (phone) {
    user.phone = phone;
    user.whatsapp = phone;
  }

  if (email) {
    user.email = email;
  }

  user.lastOnline =
    new Date().toISOString();

  saveCurrentUser(user);

  closeModal(
    "editProfileModal"
  );

  showToast(
    "Perfil actualizado."
  );
}

/* =========================================================
   FOTO DE PERFIL
   ========================================================= */

function setupProfilePhotoUpload() {
  const input =
    byId("profilePhotoInput");

  if (!input) {
    return;
  }

  input.addEventListener(
    "change",
    event => {
      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      if (!file.type.startsWith("image/")) {
        showToast(
          "Selecciona una imagen válida."
        );

        return;
      }

      const reader =
        new FileReader();

      reader.onload = e => {
        if (!AppState.currentUser) {
          return;
        }

        AppState.currentUser.avatar =
          e.target.result;

        saveCurrentUser(
          AppState.currentUser
        );

        $$(
          "[data-user-avatar]"
        ).forEach(image => {
          image.src =
            e.target.result;
        });

        showToast(
          "Foto de perfil actualizada."
        );
      };

      reader.readAsDataURL(file);
    }
  );
}

/* =========================================================
   ELIMINAR CUENTA
   ========================================================= */

async function deleteAccount() {
  if (!isLoggedIn()) {
    return;
  }

  const confirmed =
    window.confirm(
      "¿Seguro que quieres eliminar tu cuenta de Market Flash? Esta acción requiere confirmación."
    );

  if (!confirmed) {
    return;
  }

  /*
   * La eliminación definitiva de la cuenta de Supabase
   * requiere una función segura en backend.
   */
  try {
    if (
      MFSupabase &&
      typeof MFSupabase.supabaseLogout ===
        "function"
    ) {
      await MFSupabase.supabaseLogout();
    }
  } catch (error) {
    console.warn(
      "Error cerrando sesión.",
      error
    );
  }

  clearCurrentUser();

  AppState.products =
    AppState.products.filter(
      product =>
        String(
          product.seller?.id || ""
        ) !==
        String(
          AppState.currentUser?.id || ""
        )
    );

  closeAllModals();

  showToast(
    "Sesión eliminada del dispositivo."
  );
}

/* =========================================================
   NAVEGACIÓN INFERIOR
   ========================================================= */

function setupBottomNavigation() {
  $$(".nav-item").forEach(
    button => {
      button.addEventListener(
        "click",
        () => {
          const target =
            button.dataset.target ||
            button.dataset.nav ||
            "";

          if (
            target === "home" ||
            target === "inicio"
          ) {
            window.scrollTo({
              top: 0,
              behavior: "smooth"
            });

            return;
          }

          if (
            target === "search" ||
            target === "buscar"
          ) {
            const search =
              byId("searchInput") ||
              $(".search-input");

            if (search) {
              search.focus();
            }

            return;
          }

          if (
            target === "chat"
          ) {
            showToast(
              "Selecciona un producto para iniciar un chat."
            );

            return;
          }

          if (
            target === "profile"
          ) {
            openProfile();

            return;
          }
        }
      );
    }
  );
}

/* =========================================================
   BOTÓN PUBLICAR
   ========================================================= */

function openPublishModal() {
  if (!isLoggedIn()) {
    openModal("loginModal");

    showToast(
      "Inicia sesión para publicar."
    );

    return;
  }

  resetPublishForm();

  openModal(
    "publishModal"
  );
}

/* =========================================================
   EVENTOS GLOBALES
   ========================================================= */

function setupGlobalEvents() {
  document.addEventListener(
    "click",
    event => {
      const target =
        event.target.closest(
          "[data-action]"
        );

      if (!target) {
        return;
      }

      const action =
        target.dataset.action;

      const productId =
        target.dataset.productId;

      switch (action) {
        case "open-product":
          openProductDetail(
            productId
          );
          break;

        case "like-product":
          likeProduct(
            productId
          );
          break;

        case "save-product":
          saveProduct(
            productId
          );
          break;

        case "chat-seller": {
          const product =
            getProductById(
              productId
            );

          if (product) {
            openSellerChat(
              product
            );
          }

          break;
        }

        case "open-profile":
          openProfile();
          break;

        case "open-statistics":
          openStatistics();
          break;

        case "open-settings":
          openSettings();
          break;

        case "publish":
          openPublishModal();
          break;

        case "logout":
          logoutUser();
          break;

        case "admin":
          requestAdminAccess();
          break;

        case "edit-profile":
          openEditProfile();
          break;

        case "save-profile":
          saveProfileChanges();
          break;

        case "delete-account":
          deleteAccount();
          break;

        case "send-chat":
          sendChatMessage();
          break;

        default:
          break;
      }
    }
  );

  /*
   * Quitar imágenes seleccionadas.
   */
  document.addEventListener(
    "click",
    event => {
      const button =
        event.target.closest(
          "[data-remove-image]"
        );

      if (!button) {
        return;
      }

      const index =
        Number(
          button.dataset.removeImage
        );

      if (
        Number.isInteger(index)
      ) {
        AppState.selectedImages
          .splice(index, 1);

        renderImagePreviews();
      }
    }
  );

  /*
   * Categorías.
   */
  setupCategories();

  /*
   * Búsqueda.
   */
  setupSearch();

  /*
   * Modales.
   */
  setupModalButtons();

  /*
   * Navegación.
   */
  setupBottomNavigation();

  /*
   * Fotos.
   */
  setupImageUpload();

  /*
   * Vídeo.
   */
  setupVideoUpload();

  /*
   * Foto de perfil.
   */
  setupProfilePhotoUpload();

  /*
   * Enter para enviar chat.
   */
  document.addEventListener(
    "keydown",
    event => {
      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {
        const active =
          document.activeElement;

        if (
          active &&
          (
            active.id ===
              "chatInput" ||
            active.classList.contains(
              "chat-input"
            )
          )
        ) {
          event.preventDefault();

          sendChatMessage();
        }
      }
    }
  );

  /*
   * Escape para cerrar modales.
   */
  document.addEventListener(
    "keydown",
    event => {
      if (
        event.key === "Escape"
      ) {
        closeAllModals();
      }
    }
  );
}

/* =========================================================
   BOTONES ESPECÍFICOS
   ========================================================= */

function setupSpecificButtons() {
  const notificationButtons =
    $$(
      ".notification-btn, #notificationBtn, [data-notifications]"
    );

  notificationButtons.forEach(
    button => {
      button.addEventListener(
        "click",
        showNotifications
      );
    }
  );

  const settingsButtons =
    $$(
      ".settings-btn, #settingsBtn, [data-settings]"
    );

  settingsButtons.forEach(
    button => {
      button.addEventListener(
        "click",
        openSettings
      );
    }
  );

  const profileButtons =
    $$(
      "[data-open-profile]"
    );

  profileButtons.forEach(
    button => {
      button.addEventListener(
        "click",
        openProfile
      );
    }
  );

  const statisticsButtons =
    $$(
      "[data-open-statistics]"
    );

  statisticsButtons.forEach(
    button => {
      button.addEventListener(
        "click",
        openStatistics
      );
    }
  );

  const publishButtons =
    $$(
      ".publish-nav-button, .plus-button, #publishButton, [data-publish]"
    );

  publishButtons.forEach(
    button => {
      button.addEventListener(
        "click",
        openPublishModal
      );
    }
  );

  const loginButtons =
    $$(
      "#loginSubmit, [data-login]"
    );

  loginButtons.forEach(
    button => {
      button.addEventListener(
        "click",
        loginUser
      );
    }
  );

  const registerButtons =
    $$(
      "#registerSubmit, [data-register]"
    );

  registerButtons.forEach(
    button => {
      button.addEventListener(
        "click",
        registerUser
      );
    }
  );

  const logoutButtons =
    $$(
      "#logoutButton, [data-logout]"
    );

  logoutButtons.forEach(
    button => {
      button.addEventListener(
        "click",
        logoutUser
      );
    }
  );

  const publishSubmitButtons =
    $$(
      "#publishSubmit, [data-submit-product]"
    );

  publishSubmitButtons.forEach(
    button => {
      button.addEventListener(
        "click",
        publishProduct
      );
  });

  const chatSendButtons =
    $$(
      "#chatSendButton, #sendChatButton, [data-send-chat]"
    );

  chatSendButtons.forEach(
    button => {
      button.addEventListener(
        "click",
        sendChatMessage
      );
    }
  );

  const adminButtons =
    $$(
      "#adminPanelButton, [data-open-admin]"
    );

  adminButtons.forEach(
    button => {
      button.addEventListener(
        "click",
        requestAdminAccess
      );
    }
  );

  const adminVerifyButtons =
    $$(
      "#verifyAdminButton, [data-verify-admin]"
    );

  adminVerifyButtons.forEach(
    button => {
      button.addEventListener(
        "click",
        verifyAdminPassword
      );
    }
  );

  const adminChangeButtons =
    $$(
      "#changeAdminPasswordButton, [data-change-admin-password]"
    );

  adminChangeButtons.forEach(
    button => {
      button.addEventListener(
        "click",
        changeAdminPassword
      );
    }
  );
}

/* =========================================================
   CONFIGURACIÓN DE SWITCHES
   ========================================================= */

function setupSettingSwitches() {
  $$(
    "input[data-setting]"
  ).forEach(input => {
    input.addEventListener(
      "change",
      event => {
        updateSetting(
          input.dataset.setting,
          Boolean(
            event.target.checked
          )
        );
      }
    );
  });
}

/* =========================================================
   INICIALIZACIÓN PRINCIPAL
   ========================================================= */

async function initializeMarketFlash() {
  /*
   * Evitamos inicializaciones duplicadas.
   */
  if (AppState.initialized) {
    return;
  }

  AppState.initialized = true;

  try {
    /*
     * 1. Configuración
     */
    loadConfiguration();

    /*
     * 2. Usuario
     */
    loadCurrentUser();

    /*
     * 3. Productos
     */
    loadProducts();

    /*
     * 4. Estadísticas
     */
    loadStatistics();

    /*
     * 5. Notificaciones
     */
    loadNotifications();

    /*
     * 6. Mensajes
     */
    loadMessages();

    /*
     * 7. Administración
     */
    loadAdminConfig();

    /*
     * 8. Eventos
     */
    setupGlobalEvents();

    setupSpecificButtons();

    setupSettingSwitches();

    /*
     * 9. Render inicial
     */
    AppState.products =
      AppState.products.map(
        normalizeProduct
      );

    applyProductFilters();

    renderStatistics();

    renderAdvertising();

    renderPromotionPlans();

    renderPaymentMethods();

    updateUserInterface();

  } catch (error) {
    /*
     * MUY IMPORTANTE:
     *
     * Un error aquí NO debe dejar Market Flash
     * congelado en la pantalla de carga.
     */
    console.error(
      "Market Flash initialization error:",
      error
    );

    showToast(
      "Market Flash se inició con algunas funciones limitadas."
    );
  } finally {
    /*
     * SIEMPRE quitamos la pantalla de carga.
     */
    hideLoadingScreen();
  }
}

/* =========================================================
   PANTALLA DE CARGA
   ========================================================= */

function hideLoadingScreen() {
  const screens = [
    byId("loadingScreen"),
    $(".loading-screen"),
    $("#loading-screen")
  ].filter(Boolean);

  screens.forEach(screen => {
    screen.style.opacity = "0";
    screen.style.pointerEvents =
      "none";

    setTimeout(() => {
      screen.style.display = "none";

      if (
        screen.parentElement
      ) {
        /*
         * No eliminamos el elemento,
         * simplemente lo dejamos oculto.
         */
        screen.setAttribute(
          "aria-hidden",
          "true"
        );
      }
    }, 250);
  });

  /*
   * Compatibilidad con cualquier pantalla
   * de carga que utilice una clase diferente.
   */
  document.body.classList.add(
    "market-flash-ready"
  );
}

/* =========================================================
   PLAN DE SEGURIDAD CONTRA CARGA INFINITA
   ========================================================= */

function emergencyHideLoadingScreen() {
  /*
   * Este respaldo garantiza que un fallo inesperado
   * no bloquee la aplicación indefinidamente.
   */
  hideLoadingScreen();
}

/*
 * Aunque una función de inicialización externa falle,
 * Market Flash queda visible después de unos segundos.
 */
setTimeout(
  emergencyHideLoadingScreen,
  5000
);

/* =========================================================
   API GLOBAL MARKET FLASH
   ========================================================= */

window.MarketFlash = {
  state: AppState,

  openModal,
  closeModal,
  closeAllModals,

  loginUser,
  registerUser,
  logoutUser,

  openProfile,
  openStatistics,
  openSettings,

  openPublishModal,
  publishProduct,

  openSellerChat,
  sendChatMessage,

  openProductDetail,
  likeProduct,
  saveProduct,

  openAdminPanel,
  requestAdminAccess,

  showToast,

  refresh: () => {
    loadProducts();

    applyProductFilters();

    renderStatistics();

    renderAdvertising();
  }
};

/* =========================================================
   ARRANQUE
   ========================================================= */

function startMarketFlash() {
  /*
   * Ejecutamos una sola vez cuando el DOM esté listo.
   */
  initializeMarketFlash();
}

if (
  document.readyState ===
  "loading"
) {
  document.addEventListener(
    "DOMContentLoaded",
    startMarketFlash,
    {
      once: true
    }
  );
} else {
  startMarketFlash();
}

/* =========================================================
   FIN DE SCRIPT.JS
   ========================================================= */
