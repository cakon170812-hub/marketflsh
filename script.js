/* =========================================================
   MARKET FLASH
   script.js
   PARTE 1 DE 2
   ========================================================= */

"use strict";

/* =========================================================
   REFERENCIAS GLOBALES
   ========================================================= */

const MF = window.MarketFlashData || {};
const MFSupabase = window.MarketFlashSupabase || {};

const STORAGE_USER =
  (window.STORAGE_KEYS && window.STORAGE_KEYS.USER) ||
  "mf_user";

const STORAGE_PRODUCTS =
  (window.STORAGE_KEYS && window.STORAGE_KEYS.PRODUCTS) ||
  "mf_products";

const STORAGE_CONFIG =
  (window.STORAGE_KEYS && window.STORAGE_KEYS.CONFIG) ||
  "mf_config";

const STORAGE_NOTIFICATIONS =
  (window.STORAGE_KEYS && window.STORAGE_KEYS.NOTIFICATIONS) ||
  "mf_notifications";

const STORAGE_MESSAGES =
  (window.STORAGE_KEYS && window.STORAGE_KEYS.MESSAGES) ||
  "mf_messages";

const STORAGE_STATISTICS =
  (window.STORAGE_KEYS && window.STORAGE_KEYS.STATISTICS) ||
  "mf_statistics";

const STORAGE_ADMIN =
  (window.STORAGE_KEYS && window.STORAGE_KEYS.ADMIN) ||
  "mf_admin";

const STORAGE_THEME =
  (window.STORAGE_KEYS && window.STORAGE_KEYS.THEME) ||
  "mf_theme";

/* =========================================================
   ESTADO PRINCIPAL DE MARKET FLASH
   ========================================================= */

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
   UTILIDADES
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

function safeJsonParse(value, fallback = null) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.warn("Market Flash: JSON inválido:", error);
    return fallback;
  }
}

function getStorage(key, fallback = null) {
  try {
    const value = localStorage.getItem(key);

    if (value === null) {
      return fallback;
    }

    return safeJsonParse(value, fallback);
  } catch (error) {
    console.warn("No se pudo leer localStorage:", error);
    return fallback;
  }
}

function setStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error("No se pudo guardar en localStorage:", error);
    return false;
  }
}

function removeStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn("No se pudo eliminar:", error);
  }
}

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

function formatMoney(value) {
  const number = Number(value) || 0;

  try {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "DOP",
      maximumFractionDigits: 0
    }).format(number);
  } catch {
    return `RD$ ${number.toLocaleString("es-DO")}`;
  }
}

function formatNumber(value) {
  const number = Number(value) || 0;

  return new Intl.NumberFormat("es-DO").format(number);
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("es-DO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function formatTime(dateValue) {
  if (!dateValue) {
    return "";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString("es-DO", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function generateId(prefix = "mf") {
  return (
    prefix +
    "_" +
    Date.now().toString(36) +
    "_" +
    Math.random().toString(36).substring(2, 9)
  );
}

/* =========================================================
   CONFIGURACIÓN
   ========================================================= */

function getDefaultConfig() {
  if (MF.DEFAULT_CONFIG) {
    return {
      ...MF.DEFAULT_CONFIG
    };
  }

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
    STORAGE_CONFIG,
    getDefaultConfig()
  );

  AppState.config = {
    ...getDefaultConfig(),
    ...(saved || {})
  };

  applyConfiguration();
}

function saveConfiguration() {
  setStorage(
    STORAGE_CONFIG,
    AppState.config
  );
}

function applyConfiguration() {
  const body = document.body;

  if (!body) {
    return;
  }

  body.classList.toggle(
    "dark-mode",
    Boolean(AppState.config.darkMode)
  );

  body.classList.toggle(
    "compact-mode",
    Boolean(AppState.config.compactMode)
  );

  body.classList.toggle(
    "no-animations",
    AppState.config.animations === false
  );

  document.documentElement.setAttribute(
    "data-theme",
    AppState.config.theme || "default"
  );
}

/* =========================================================
   PRODUCTOS
   ========================================================= */

function loadProducts() {
  let products = [];

  if (typeof MF.getProducts === "function") {
    products = MF.getProducts();
  } else {
    products = getStorage(
      STORAGE_PRODUCTS,
      []
    );
  }

  if (!Array.isArray(products)) {
    products = [];
  }

  AppState.products = products;

  AppState.filteredProducts =
    [...AppState.products];
}

function saveProducts() {
  if (typeof MF.saveProducts === "function") {
    MF.saveProducts(AppState.products);
    return;
  }

  setStorage(
    STORAGE_PRODUCTS,
    AppState.products
  );
}

function getProductId(product) {
  return (
    product?.id ||
    product?.product_id ||
    product?.uuid ||
    ""
  );
}

function getProductName(product) {
  return (
    product?.name ||
    product?.product_name ||
    "Producto sin nombre"
  );
}

function getProductPrice(product) {
  return (
    product?.price ||
    0
  );
}

function getProductDescription(product) {
  return (
    product?.description ||
    ""
  );
}

function getProductCategory(product) {
  return (
    product?.category ||
    product?.type ||
    "other"
  );
}

function getProductLocation(product) {
  return (
    product?.location ||
    product?.address ||
    "República Dominicana"
  );
}

function getProductImages(product) {
  if (Array.isArray(product?.images)) {
    return product.images;
  }

  if (Array.isArray(product?.image_urls)) {
    return product.image_urls;
  }

  if (product?.image) {
    return [product.image];
  }

  return [];
}

function getProductImage(product) {
  const images =
    getProductImages(product);

  if (images.length > 0) {
    return images[0];
  }

  return (
    product?.image ||
    "https://placehold.co/600x600?text=Market+Flash"
  );
}

/* =========================================================
   RENDER DE PRODUCTOS
   ========================================================= */

function renderProducts(products = AppState.filteredProducts) {
  const grid =
    byId("productsGrid") ||
    $(".products-grid");

  if (!grid) {
    return;
  }

  if (!Array.isArray(products) || products.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📦</div>
        <h3>No hay productos todavía</h3>
        <p>
          Publica un producto y aparecerá aquí
          automáticamente.
        </p>
      </div>
    `;

    return;
  }

  grid.innerHTML = products
    .map(renderProductCard)
    .join("");
}

function renderProductCard(product) {
  const id =
    escapeHTML(getProductId(product));

  const name =
    escapeHTML(getProductName(product));

  const price =
    formatMoney(getProductPrice(product));

  const image =
    escapeHTML(getProductImage(product));

  const location =
    escapeHTML(getProductLocation(product));

  const views =
    Number(product?.views || 0);

  const likes =
    Number(product?.likes || 0);

  const saved =
    Number(product?.saved || product?.saves || 0);

  const featured =
    Boolean(
      product?.featured ||
      product?.promoted ||
      product?.advertised
    );

  return `
    <article
      class="product-card"
      data-product-id="${id}"
      data-action="open-product"
    >

      <div class="product-image-container">

        <img
          class="product-image"
          src="${image}"
          alt="${name}"
          loading="lazy"
          onerror="
            this.src='https://placehold.co/600x600?text=Market+Flash'
          "
        >

        ${
          featured
            ? `
              <span class="product-featured">
                ⭐ PROMOCIONADO
              </span>
            `
            : ""
        }

        <button
          class="product-favorite"
          type="button"
          data-action="toggle-save"
          data-product-id="${id}"
          aria-label="Guardar producto"
        >
          ♡
        </button>

      </div>

      <div class="product-info">

        <div class="product-name">
          ${name}
        </div>

        <div class="product-price">
          ${price}
        </div>

        <div class="product-location">
          📍 ${location}
        </div>

        <div class="product-stats">

          <span class="product-stat">
            👁 ${formatNumber(views)}
          </span>

          <span class="product-stat">
            ♥ ${formatNumber(likes)}
          </span>

          <span class="product-stat">
            🔖 ${formatNumber(saved)}
          </span>

        </div>

      </div>

    </article>
  `;
}

/* =========================================================
   BÚSQUEDA Y FILTROS
   ========================================================= */

function filterProducts() {
  const search =
    AppState.searchText
      .trim()
      .toLowerCase();

  const category =
    AppState.currentCategory;

  AppState.filteredProducts =
    AppState.products.filter(product => {

      const name =
        getProductName(product)
          .toLowerCase();

      const description =
        getProductDescription(product)
          .toLowerCase();

      const location =
        getProductLocation(product)
          .toLowerCase();

      const productCategory =
        getProductCategory(product);

      const matchesSearch =
        !search ||
        name.includes(search) ||
        description.includes(search) ||
        location.includes(search);

      const matchesCategory =
        !category ||
        category === "all" ||
        productCategory === category;

      return (
        matchesSearch &&
        matchesCategory
      );
    });

  renderProducts(
    AppState.filteredProducts
  );
}

function setupSearch() {
  const searchInput =
    byId("searchInput") ||
    $(".search-box") ||
    $('input[type="search"]');

  if (!searchInput) {
    return;
  }

  searchInput.addEventListener(
    "input",
    event => {
      AppState.searchText =
        event.target.value || "";

      filterProducts();
    }
  );
}

function setupCategories() {
  const categoryButtons =
    $$(".category-chip");

  categoryButtons.forEach(button => {

    button.addEventListener(
      "click",
      () => {

        categoryButtons.forEach(item => {
          item.classList.remove("active");
        });

        button.classList.add("active");

        AppState.currentCategory =
          button.dataset.category ||
          button.dataset.type ||
          "all";

        filterProducts();
      }
    );
  });
}

/* =========================================================
   MODALES
   ========================================================= */

function openModal(id) {
  const modal = byId(id);

  if (!modal) {
    return;
  }

  modal.classList.add("active");

  modal.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.classList.add(
    "modal-open"
  );
}

function closeModal(id) {
  const modal = byId(id);

  if (!modal) {
    return;
  }

  modal.classList.remove("active");

  modal.setAttribute(
    "aria-hidden",
    "true"
  );

  if (
    !document.querySelector(
      ".modal.active"
    )
  ) {
    document.body.classList.remove(
      "modal-open"
    );
  }
}

function closeAllModals() {
  $$(".modal.active").forEach(
    modal => {
      modal.classList.remove("active");

      modal.setAttribute(
        "aria-hidden",
        "true"
      );
    }
  );

  document.body.classList.remove(
    "modal-open"
  );
}

function setupModalCloseButtons() {
  $$(
    ".close-btn, [data-close-modal]"
  ).forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const modalId =
          button.dataset.closeModal;

        if (modalId) {
          closeModal(modalId);
        } else {
          const parentModal =
            button.closest(".modal");

          if (parentModal) {
            parentModal.classList.remove(
              "active"
            );
          }
        }

        if (
          !document.querySelector(
            ".modal.active"
          )
        ) {
          document.body.classList.remove(
            "modal-open"
          );
        }
      }
    );
  });

  $$(".modal").forEach(modal => {

    modal.addEventListener(
      "click",
      event => {

        if (
          event.target === modal
        ) {
          modal.classList.remove(
            "active"
          );

          if (
            !document.querySelector(
              ".modal.active"
            )
          ) {
            document.body.classList.remove(
              "modal-open"
            );
          }
        }
      }
    );
  });
}

/* =========================================================
   TOAST
   ========================================================= */

let toastTimer = null;

function showToast(
  message,
  type = "default"
) {
  let toast =
    byId("toast");

  if (!toast) {
    toast =
      document.createElement("div");

    toast.id = "toast";

    toast.className = "toast";

    document.body.appendChild(toast);
  }

  toast.textContent = message;

  toast.dataset.type = type;

  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(
    () => {
      toast.classList.remove(
        "show"
      );
    },
    2800
  );
}

/* =========================================================
   USUARIO
   ========================================================= */

function loadUser() {
  if (
    typeof MF.getUser === "function"
  ) {
    AppState.currentUser =
      MF.getUser();
  } else {
    AppState.currentUser =
      getStorage(
        STORAGE_USER,
        null
      );
  }

  updateUserInterface();
}

function saveUser(user) {
  AppState.currentUser =
    user;

  if (
    typeof MF.saveUser === "function"
  ) {
    MF.saveUser(user);
  } else {
    setStorage(
      STORAGE_USER,
      user
    );
  }

  updateUserInterface();
}

function clearUser() {
  AppState.currentUser =
    null;

  removeStorage(
    STORAGE_USER
  );

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

  const name =
    user?.name ||
    user?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email ||
    "Usuario";

  const phone =
    user?.phone ||
    user?.whatsapp ||
    user?.user_metadata?.phone ||
    "";

  const nameElements =
    $$(
      "[data-user-name], .profile-name"
    );

  nameElements.forEach(
    element => {
      element.textContent =
        name;
    }
  );

  const phoneElements =
    $$(
      "[data-user-phone], .profile-phone"
    );

  phoneElements.forEach(
    element => {
      element.textContent =
        phone;
    }
  );

  const adminItems =
    $$(
      '[data-admin-only], #adminMenuItem'
    );

  const admin =
    Boolean(
      AppState.isAdmin ||
      AppState.currentUser?.isAdmin ||
      AppState.currentUser?.role === "admin"
    );

  adminItems.forEach(
    element => {
      element.classList.toggle(
        "hidden",
        !admin
      );
    }
  );
}

/* =========================================================
   AUTENTICACIÓN
   ========================================================= */

async function registerUser(data) {
  if (
    MFSupabase &&
    typeof MFSupabase.supabaseRegister ===
      "function"
  ) {
    try {
      const result =
        await MFSupabase.supabaseRegister(
          data.email,
          data.password,
          {
            full_name: data.name,
            phone: data.phone,
            whatsapp: data.whatsapp || data.phone
          }
        );

      if (
        result &&
        !result.error
      ) {
        showToast(
          "Cuenta creada correctamente.",
          "success"
        );

        return result;
      }
    } catch (error) {
      console.warn(
        "Registro Supabase no disponible:",
        error
      );
    }
  }

  const user = {
    id: generateId("user"),
    name: data.name,
    email: data.email,
    phone: data.phone,
    whatsapp:
      data.whatsapp ||
      data.phone,
    created_at:
      new Date().toISOString()
  };

  saveUser(user);

  showToast(
    "Cuenta creada correctamente.",
    "success"
  );

  return {
    user,
    local: true
  };
}

async function loginUser(
  email,
  password
) {
  if (
    MFSupabase &&
    typeof MFSupabase.supabaseLogin ===
      "function"
  ) {
    try {
      const result =
        await MFSupabase.supabaseLogin(
          email,
          password
        );

      if (
        result &&
        !result.error &&
        result.user
      ) {
        saveUser(result.user);

        showToast(
          "Sesión iniciada.",
          "success"
        );

        return result;
      }
    } catch (error) {
      console.warn(
        "Login Supabase no disponible:",
        error
      );
    }
  }

  const savedUser =
    getStorage(
      STORAGE_USER,
      null
    );

  if (
    savedUser &&
    savedUser.email === email
  ) {
    saveUser(savedUser);

    showToast(
      "Sesión iniciada.",
      "success"
    );

    return {
      user: savedUser,
      local: true
    };
  }

  showToast(
    "No se pudo iniciar sesión.",
    "error"
  );

  return {
    error: true
  };
}

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
      "Error cerrando sesión Supabase:",
      error
    );
  }

  clearUser();

  AppState.adminAuthenticated =
    false;

  closeAllModals();

  showToast(
    "Sesión cerrada."
  );
}

/* =========================================================
   PUBLICAR PRODUCTO
   ========================================================= */

function getPublishFormData() {
  const getValue = id => {
    const element = byId(id);

    return element
      ? element.value.trim()
      : "";
  };

  const name =
    getValue("productName") ||
    getValue("publishProductName") ||
    getValue("name");

  const category =
    getValue("productCategory") ||
    getValue("publishCategory") ||
    getValue("category") ||
    "other";

  const price =
    Number(
      getValue("productPrice") ||
      getValue("publishPrice") ||
      getValue("price") ||
      0
    );

  const quantity =
    Number(
      getValue("productQuantity") ||
      getValue("publishQuantity") ||
      getValue("quantity") ||
      1
    );

  const description =
    getValue("productDescription") ||
    getValue("publishDescription") ||
    getValue("description");

  const location =
    getValue("productLocation") ||
    getValue("publishLocation") ||
    getValue("location");

  const whatsappElement =
    byId("whatsappToggle") ||
    byId("publishWhatsapp") ||
    $('[name="whatsapp"]');

  const chatElement =
    byId("chatToggle") ||
    byId("publishChat") ||
    $('[name="chat"]');

  return {
    name,
    category,
    price,
    quantity,
    description,
    location,

    whatsappEnabled:
      whatsappElement
        ? Boolean(whatsappElement.checked)
        : true,

    chatEnabled:
      chatElement
        ? Boolean(chatElement.checked)
        : true
  };
}

function validateProductData(data) {
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
      "Introduce un precio válido."
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

function createLocalProduct(data) {
  const user =
    AppState.currentUser;

  const product = {
    id: generateId("product"),

    name: data.name,

    category: data.category,

    price: data.price,

    quantity:
      data.quantity > 0
        ? data.quantity
        : 1,

    description:
      data.description,

    location:
      data.location ||
      "República Dominicana",

    images:
      AppState.selectedImages
        .map(item => item.url || item),

    video:
      AppState.selectedVideo,

    whatsappEnabled:
      data.whatsappEnabled,

    chatEnabled:
      data.chatEnabled,

    seller: {
      id:
        user?.id ||
        generateId("seller"),

      name:
        user?.name ||
        user?.full_name ||
        "Vendedor",

      phone:
        user?.phone ||
        user?.whatsapp ||
        "",

      avatar:
        user?.avatar ||
        user?.photo ||
        ""
    },

    seller_id:
      user?.id || null,

    views: 0,

    likes: 0,

    comments: 0,

    saved: 0,

    profileVisits: 0,

    featured: false,

    promoted: false,

    advertisingApproved: false,

    created_at:
      new Date().toISOString(),

    updated_at:
      new Date().toISOString()
  };

  return product;
}

async function publishProduct() {
  const data =
    getPublishFormData();

  if (
    !validateProductData(data)
  ) {
    return;
  }

  const product =
    createLocalProduct(data);

  let savedProduct =
    product;

  /* Intentar guardar en Supabase */

  if (
    MFSupabase &&
    typeof MFSupabase.supabaseCreateProduct ===
      "function"
  ) {
    try {
      const result =
        await MFSupabase.supabaseCreateProduct(
          product
        );

      if (
        result &&
        !result.error
      ) {
        savedProduct =
          result.data ||
          result.product ||
          product;
      }
    } catch (error) {
      console.warn(
        "No se pudo publicar en Supabase. Se usará almacenamiento local:",
        error
      );
    }
  }

  /* Guardar localmente */

  AppState.products.unshift(
    savedProduct
  );

  saveProducts();

  /* El producto aparece inmediatamente
     en PRODUCTOS RECIENTES */

  AppState.filteredProducts =
    [...AppState.products];

  renderProducts();

  updateStatisticsAfterPublish();

  resetPublishForm();

  closeModal(
    "publishModal"
  );

  showToast(
    "¡Producto publicado! Ya aparece en Productos recientes.",
    "success"
  );
}

function resetPublishForm() {
  AppState.selectedImages =
    [];

  AppState.selectedVideo =
    null;

  const form =
    byId("publishForm");

  if (form) {
    form.reset();
  }

  const imagePreview =
    byId("imagePreviewGrid") ||
    $(".image-preview-grid");

  if (imagePreview) {
    imagePreview.innerHTML =
      "";
  }

  const videoPreview =
    byId("videoPreview");

  if (videoPreview) {
    videoPreview.innerHTML =
      "";
  }
}

/* =========================================================
   IMÁGENES
   ========================================================= */

function handleImageFiles(
  files
) {
  if (!files) {
    return;
  }

  const fileArray =
    Array.from(files);

  fileArray.forEach(file => {

    if (
      !file.type.startsWith("image/")
    ) {
      return;
    }

    const reader =
      new FileReader();

    reader.onload = event => {

      AppState.selectedImages.push({
        id: generateId("img"),
        url: event.target.result,
        name: file.name
      });

      renderImagePreviews();
    };

    reader.readAsDataURL(file);
  });
}

function renderImagePreviews() {
  const container =
    byId("imagePreviewGrid") ||
    $(".image-preview-grid");

  if (!container) {
    return;
  }

  container.innerHTML =
    AppState.selectedImages
      .map((image, index) => {

        return `
          <div
            class="image-preview"
            data-image-index="${index}"
          >
            <img
              src="${escapeHTML(image.url)}"
              alt="Imagen ${index + 1}"
            >
          </div>
        `;
      })
      .join("");
}

function handleVideoFile(file) {
  if (!file) {
    return;
  }

  if (
    !file.type.startsWith("video/")
  ) {
    showToast(
      "Selecciona un archivo de vídeo válido."
    );

    return;
  }

  const reader =
    new FileReader();

  reader.onload = event => {

    AppState.selectedVideo =
      event.target.result;

    const preview =
      byId("videoPreview");

    if (preview) {
      preview.innerHTML = `
        <video
          src="${escapeHTML(event.target.result)}"
          controls
          style="
            width:100%;
            border-radius:12px;
            margin-top:10px;
          "
        ></video>
      `;
    }
  };

  reader.readAsDataURL(file);
}

/* =========================================================
   ESTADÍSTICAS
   ========================================================= */

function loadStatistics() {
  if (
    typeof MF.getStatistics ===
      "function"
  ) {
    AppState.statistics =
      MF.getStatistics();
  } else {
    AppState.statistics =
      getStorage(
        STORAGE_STATISTICS,
        MF.DEFAULT_STATISTICS ||
          {
            sales: 0,
            views: 0,
            likes: 0,
            comments: 0,
            saved: 0,
            profileVisits: 0,
            productsPublished: 0,
            messagesReceived: 0,
            totalIncome: 0
          }
      );
  }

  if (
    !AppState.statistics ||
    typeof AppState.statistics !==
      "object"
  ) {
    AppState.statistics = {};
  }
}

function saveStatistics() {
  if (
    typeof MF.saveStatistics ===
      "function"
  ) {
    MF.saveStatistics(
      AppState.statistics
    );
  } else {
    setStorage(
      STORAGE_STATISTICS,
      AppState.statistics
    );
  }
}

function updateStatisticsAfterPublish() {
  AppState.statistics.productsPublished =
    Number(
      AppState.statistics.productsPublished ||
        0
    ) + 1;

  saveStatistics();

  renderStatistics();
}

function renderStatistics() {
  const stats =
    AppState.statistics ||
    {};

  const mapping = {
    sales:
      stats.sales || 0,

    views:
      stats.views || 0,

    likes:
      stats.likes || 0,

    comments:
      stats.comments || 0,

    saved:
      stats.saved || 0,

    profileVisits:
      stats.profileVisits || 0,

    productsPublished:
      stats.productsPublished || 0,

    messagesReceived:
      stats.messagesReceived || 0,

    totalIncome:
      formatMoney(
        stats.totalIncome || 0
      )
  };

  Object.entries(mapping)
    .forEach(
      ([key, value]) => {

        $$(
          `[data-stat="${key}"]`
        ).forEach(
          element => {
            element.textContent =
              value;
          }
        );
      }
    );
}

/* =========================================================
   NOTIFICACIONES
   ========================================================= */

function loadNotifications() {
  if (
    typeof MF.getNotifications ===
      "function"
  ) {
    AppState.notifications =
      MF.getNotifications();
  } else {
    AppState.notifications =
      getStorage(
        STORAGE_NOTIFICATIONS,
        []
      );
  }

  if (
    !Array.isArray(
      AppState.notifications
    )
  ) {
    AppState.notifications =
      [];
  }

  updateNotificationBadge();
}

function saveNotifications() {
  if (
    typeof MF.saveNotifications ===
      "function"
  ) {
    MF.saveNotifications(
      AppState.notifications
    );
  } else {
    setStorage(
      STORAGE_NOTIFICATIONS,
      AppState.notifications
    );
  }
}

function addNotification(
  title,
  message,
  type = "info"
) {
  const notification = {
    id: generateId("notification"),

    title,

    message,

    type,

    read: false,

    created_at:
      new Date().toISOString()
  };

  AppState.notifications.unshift(
    notification
  );

  saveNotifications();

  updateNotificationBadge();
}

function updateNotificationBadge() {
  const unread =
    AppState.notifications.filter(
      item => !item.read
    ).length;

  const dots =
    $$(".notification-dot");

  dots.forEach(dot => {
    dot.classList.toggle(
      "hidden",
      unread === 0
    );
  });
}

/* =========================================================
   MENSAJES / CHAT
   ========================================================= */

function loadMessages() {
  if (
    typeof MF.getMessages ===
      "function"
  ) {
    AppState.messages =
      MF.getMessages();
  } else {
    AppState.messages =
      getStorage(
        STORAGE_MESSAGES,
        []
      );
  }

  if (
    !Array.isArray(
      AppState.messages
    )
  ) {
    AppState.messages =
      [];
  }
}

function saveMessages() {
  if (
    typeof MF.saveMessages ===
      "function"
  ) {
    MF.saveMessages(
      AppState.messages
    );
  } else {
    setStorage(
      STORAGE_MESSAGES,
      AppState.messages
    );
  }
}

function getChatKey(
  productId,
  sellerId
) {
  return `${productId || "none"}_${sellerId || "none"}`;
}

function getConversation(
  productId,
  sellerId
) {
  const key =
    getChatKey(
      productId,
      sellerId
    );

  return AppState.messages.filter(
    message =>
      message.chat_key === key
  );
}

function openSellerChat(product) {
  if (!product) {
    return;
  }

  if (
    !AppState.config.chatEnabled
  ) {
    showToast(
      "El chat está desactivado en Configuración."
    );

    return;
  }

  AppState.currentProduct =
    product;

  AppState.currentSeller =
    product.seller ||
    {
      id:
        product.seller_id,

      name:
        "Vendedor",

      avatar:
        ""
    };

  AppState.currentChat =
    getChatKey(
      getProductId(product),
      AppState.currentSeller.id
    );

  renderChatHeader();

  renderChatMessages();

  openModal(
    "chatModal"
  );
}

function renderChatHeader() {
  const seller =
    AppState.currentSeller ||
    {};

  const name =
    seller.name ||
    seller.full_name ||
    "Vendedor";

  const avatar =
    seller.avatar ||
    seller.photo ||
    "https://placehold.co/100x100?text=MF";

  const nameElement =
    byId("chatSellerName") ||
    $(".chat-user-name");

  const avatarElement =
    byId("chatSellerAvatar") ||
    $(".chat-avatar img");

  if (nameElement) {
    nameElement.textContent =
      name;
  }

  if (
    avatarElement &&
    avatarElement.tagName ===
      "IMG"
  ) {
    avatarElement.src =
      avatar;
  }
}

function renderChatMessages() {
  const container =
    byId("chatMessages") ||
    $(".chat-messages");

  if (!container) {
    return;
  }

  const messages =
    AppState.messages.filter(
      message =>
        message.chat_key ===
        AppState.currentChat
    );

  if (messages.length === 0) {
    container.innerHTML = `
      <div
        style="
          text-align:center;
          padding:30px 15px;
          color:#697386;
          font-size:12px;
        "
      >
        ☁️<br>
        <strong>Inicia la conversación</strong>
        <br>
        Pregúntale al vendedor sobre este producto.
      </div>
    `;

    return;
  }

  const currentUserId =
    AppState.currentUser?.id;

  container.innerHTML =
    messages
      .map(message => {

        const sent =
          message.sender_id ===
          currentUserId;

        return `
          <div
            class="message ${
              sent
                ? "sent"
                : "received"
            }"
          >
            <div class="message-bubble">

              ${escapeHTML(
                message.text || ""
              )}

              <span class="message-time">
                ${formatTime(
                  message.created_at
                )}
              </span>

            </div>
          </div>
        `;
      })
      .join("");

  const body =
    byId("chatBody") ||
    $(".chat-body");

  if (body) {
    body.scrollTop =
      body.scrollHeight;
  }
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

  if (!AppState.currentChat) {
    showToast(
      "No hay una conversación abierta."
    );

    return;
  }

  const message = {
    id: generateId("message"),

    chat_key:
      AppState.currentChat,

    product_id:
      getProductId(
        AppState.currentProduct
      ),

    sender_id:
      AppState.currentUser?.id ||
      "guest",

    receiver_id:
      AppState.currentSeller?.id ||
      null,

    text,

    created_at:
      new Date().toISOString(),

    read: false
  };

  AppState.messages.push(
    message
  );

  saveMessages();

  input.value = "";

  renderChatMessages();

  addNotification(
    "Mensaje enviado",
    "Tu mensaje fue enviado al vendedor.",
    "chat"
  );
}

/* =========================================================
   FIN DE LA PARTE 1
   =========================================================

   IMPORTANTE:
   La PARTE 2 continúa exactamente
   debajo de este código.

   No cierres ni reemplaces este archivo.
   ========================================================= *//* =========================================================
   MARKET FLASH
   script.js
   PARTE 2 DE 2
   ========================================================= */

/* =========================================================
   PERFIL
   ========================================================= */

function openProfile() {
  updateUserInterface();
  renderStatistics();

  openModal("profileModal");
}

function openStatistics() {
  loadStatistics();
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
    AppState.config || {};

  const toggleMap = {
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

    darkMode:
      config.darkMode,

    compactMode:
      config.compactMode,

    animations:
      config.animations,

    showOnlineStatus:
      config.showOnlineStatus
  };

  Object.entries(toggleMap)
    .forEach(([key, value]) => {

      const selectors = [
        `#${key}`,
        `[data-setting="${key}"]`,
        `[name="${key}"]`
      ];

      selectors.forEach(
        selector => {

          $$(selector).forEach(
            element => {

              if (
                element.type ===
                "checkbox"
              ) {
                element.checked =
                  Boolean(value);
              }
            }
          );
        }
      );
    });
}

function updateSetting(
  setting,
  value
) {
  AppState.config[setting] =
    value;

  saveConfiguration();

  applyConfiguration();

  renderSettingsState();
}

/* =========================================================
   CAMBIO DE ESTILO
   ========================================================= */

function cycleTheme() {
  const themes = [
    "default",
    "blue",
    "green",
    "purple",
    "sunset"
  ];

  const current =
    AppState.config.theme ||
    "default";

  const index =
    themes.indexOf(current);

  const next =
    themes[
      (index + 1) %
      themes.length
    ];

  AppState.config.theme =
    next;

  saveConfiguration();

  applyConfiguration();

  showToast(
    `Estilo cambiado a ${next}.`
  );
}

/* =========================================================
   ADMINISTRACIÓN
   ========================================================= */

function loadAdminConfig() {
  if (
    typeof MF.getAdminConfig ===
      "function"
  ) {
    AppState.adminConfig =
      MF.getAdminConfig();
  } else {
    AppState.adminConfig =
      getStorage(
        STORAGE_ADMIN,
        MF.DEFAULT_ADMIN_CONFIG ||
          {
            isAdmin: false,
            advertisingEnabled: true,
            promotionsEnabled: true,
            paymentsEnabled: true,
            userManagementEnabled: true,
            productModerationEnabled: true,
            statisticsEnabled: true
          }
      );
  }

  if (
    !AppState.adminConfig ||
    typeof AppState.adminConfig !==
      "object"
  ) {
    AppState.adminConfig = {};
  }

  AppState.isAdmin =
    Boolean(
      AppState.adminConfig.isAdmin ||
      AppState.currentUser?.isAdmin ||
      AppState.currentUser?.role ===
        "admin"
    );
}

function saveAdminConfig() {
  if (
    typeof MF.saveAdminConfig ===
      "function"
  ) {
    MF.saveAdminConfig(
      AppState.adminConfig
    );
  } else {
    setStorage(
      STORAGE_ADMIN,
      AppState.adminConfig
    );
  }
}

function requestAdminAccess() {
  if (
    AppState.isAdmin &&
    AppState.adminAuthenticated
  ) {
    openAdminPanel();

    return;
  }

  openModal(
    "adminPasswordModal"
  );
}

function verifyAdminPassword() {
  const input =
    byId("adminPassword") ||
    byId("adminPasswordInput") ||
    $(
      '#adminPasswordModal input[type="password"]'
    );

  if (!input) {
    showToast(
      "No se encontró el campo de contraseña."
    );

    return;
  }

  const password =
    input.value.trim();

  if (!password) {
    showToast(
      "Introduce la contraseña de administrador."
    );

    return;
  }

  /*
   * IMPORTANTE:
   *
   * En esta versión de desarrollo NO
   * colocamos la contraseña real dentro
   * del código.
   *
   * La autenticación definitiva debe
   * realizarse con Supabase Auth/RLS.
   *
   * Si el backend devuelve un usuario
   * con rol admin, se permitirá el acceso.
   */

  const adminUser =
    AppState.currentUser;

  const authorized =
    Boolean(
      adminUser?.isAdmin ||
      adminUser?.role === "admin" ||
      adminUser?.user_metadata?.role ===
        "admin"
    );

  if (!authorized) {
    showToast(
      "Acceso de administrador pendiente de configurar con Supabase.",
      "error"
    );

    return;
  }

  AppState.adminAuthenticated =
    true;

  closeModal(
    "adminPasswordModal"
  );

  openAdminPanel();
}

function openAdminPanel() {
  if (
    !AppState.adminAuthenticated &&
    !AppState.isAdmin
  ) {
    requestAdminAccess();

    return;
  }

  renderAdminPanel();

  openModal(
    "adminPanelModal"
  );
}

function renderAdminPanel() {
  const config =
    AppState.adminConfig ||
    {};

  const stats =
    AppState.statistics ||
    {};

  const adminValues = {
    users:
      getUserCount(),

    products:
      AppState.products.length,

    advertising:
      config.advertisingEnabled
        ? "Activo"
        : "Apagado",

    payments:
      config.paymentsEnabled
        ? "Activo"
        : "Apagado",

    views:
      stats.views || 0
  };

  Object.entries(adminValues)
    .forEach(
      ([key, value]) => {

        $$(
          `[data-admin-stat="${key}"]`
        ).forEach(
          element => {
            element.textContent =
              value;
          }
        );
      }
    );
}

/* =========================================================
   USUARIOS
   ========================================================= */

function getUserCount() {
  /*
   * La cantidad real de usuarios
   * será obtenida de Supabase cuando
   * el panel administrativo esté
   * conectado al backend.
   *
   * Para desarrollo local:
   */

  return AppState.currentUser
    ? 1
    : 0;
}

/* =========================================================
   CAMBIAR CONTRASEÑA ADMIN
   ========================================================= */

function openChangeAdminPassword() {
  openModal(
    "changeAdminPasswordModal"
  );
}

function changeAdminPassword() {
  const current =
    byId("currentAdminPassword") ||
    $(
      '[name="currentAdminPassword"]'
    );

  const newPassword =
    byId("newAdminPassword") ||
    $(
      '[name="newAdminPassword"]'
    );

  const confirm =
    byId("confirmAdminPassword") ||
    $(
      '[name="confirmAdminPassword"]'
    );

  if (
    !current ||
    !newPassword ||
    !confirm
  ) {
    showToast(
      "No se encontraron todos los campos."
    );

    return;
  }

  if (
    !current.value ||
    !newPassword.value ||
    !confirm.value
  ) {
    showToast(
      "Completa todos los campos."
    );

    return;
  }

  if (
    newPassword.value !==
    confirm.value
  ) {
    showToast(
      "Las nuevas contraseñas no coinciden."
    );

    return;
  }

  if (
    newPassword.value.length <
    6
  ) {
    showToast(
      "La contraseña debe tener al menos 6 caracteres."
    );

    return;
  }

  /*
   * El cambio real de contraseña
   * administrativa debe hacerse en
   * Supabase Auth/backend.
   */

  showToast(
    "El cambio de contraseña quedará conectado a Supabase Auth."
  );

  current.value = "";
  newPassword.value = "";
  confirm.value = "";

  closeModal(
    "changeAdminPasswordModal"
  );
}

/* =========================================================
   PUBLICIDAD
   ========================================================= */

function isAdvertisingEnabled() {
  return Boolean(
    AppState.adminConfig
      ?.advertisingEnabled
  );
}

function getAdvertisingProducts() {
  if (
    !isAdvertisingEnabled()
  ) {
    return [];
  }

  return AppState.products.filter(
    product =>
      Boolean(
        product.promoted ||
        product.featured ||
        (
          product.advertisingApproved &&
          product.advertisingActive
        )
      )
  );
}

function renderAdvertising() {
  const container =
    byId("advertisingContainer") ||
    $(".ad-container");

  if (!container) {
    return;
  }

  const ads =
    getAdvertisingProducts();

  if (ads.length === 0) {
    container.innerHTML = `
      <div class="ad-content">

        <span class="ad-badge">
          MARKET FLASH
        </span>

        <div class="ad-title">
          Publicidad
        </div>

        <div class="ad-description">
          Aquí aparecerán las publicaciones
          promocionadas aprobadas por administración.
        </div>

      </div>
    `;

    return;
  }

  const ad =
    ads[0];

  container.innerHTML = `
    <div
      class="ad-content"
      data-product-id="${escapeHTML(
        getProductId(ad)
      )}"
      style="cursor:pointer;"
    >

      <span class="ad-badge">
        ⭐ PUBLICACIÓN PROMOCIONADA
      </span>

      <div class="ad-title">
        ${escapeHTML(
          getProductName(ad)
        )}
      </div>

      <div class="ad-description">
        ${escapeHTML(
          getProductDescription(ad)
        )}
      </div>

      <div class="ad-price">
        ${formatMoney(
          getProductPrice(ad)
        )}
      </div>

    </div>
  `;
}

/* =========================================================
   PROMOCIONES
   ========================================================= */

function getAdPlans() {
  if (
    Array.isArray(MF.AD_PLANS)
  ) {
    return MF.AD_PLANS;
  }

  return [
    {
      id: "basic",
      name: "Básico",
      price: 100,
      duration: 3
    },
    {
      id: "normal",
      name: "Normal",
      price: 250,
      duration: 7
    },
    {
      id: "pro",
      name: "Pro",
      price: 500,
      duration: 15
    }
  ];
}

function selectPromotionPlan(planId) {
  const plan =
    getAdPlans().find(
      item =>
        item.id === planId
    );

  if (!plan) {
    return;
  }

  AppState.selectedPromotion =
    plan;

  $$(".plan-card").forEach(
    card => {

      card.classList.toggle(
        "active",
        card.dataset.plan ===
          planId
      );
    }
  );
}

function selectPaymentMethod(
  method
) {
  AppState.selectedPaymentMethod =
    method;

  $$(
    "[data-payment-method]"
  ).forEach(
    button => {

      button.classList.toggle(
        "active",
        button.dataset.paymentMethod ===
          method
      );
    }
  );
}

function submitPromotion() {
  if (
    !AppState.selectedPromotion
  ) {
    showToast(
      "Selecciona un plan de publicidad."
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
   * El comprobante de pago se
   * conectará posteriormente con
   * Supabase Storage.
   */

  addNotification(
    "Promoción enviada",
    "Tu solicitud de promoción fue enviada para revisión.",
    "promotion"
  );

  showToast(
    "Solicitud enviada a administración.",
    "success"
  );
}

/* =========================================================
   ABRIR PRODUCTO
   ========================================================= */

function openProductById(
  productId
) {
  const product =
    AppState.products.find(
      item =>
        String(
          getProductId(item)
        ) ===
        String(productId)
    );

  if (!product) {
    showToast(
      "Producto no encontrado."
    );

    return;
  }

  AppState.currentProduct =
    product;

  incrementProductViews(
    product
  );

  openProductDetail(
    product
  );
}

function openProductDetail(
  product
) {
  /*
   * Si existe un modal de detalle
   * en una versión futura, se utilizará.
   *
   * Por ahora mostramos la información
   * principal y ofrecemos abrir el chat.
   */

  const chatButton =
    byId("openSellerChat");

  if (chatButton) {
    chatButton.dataset.productId =
      getProductId(product);
  }

  const name =
    getProductName(product);

  showToast(
    `${name} seleccionado.`
  );
}

function incrementProductViews(
  product
) {
  product.views =
    Number(product.views || 0) +
    1;

  AppState.statistics.views =
    Number(
      AppState.statistics.views || 0
    ) + 1;

  saveProducts();

  saveStatistics();

  renderProducts(
    AppState.filteredProducts
  );
}

/* =========================================================
   LIKES
   ========================================================= */

function toggleLikeProduct(
  productId
) {
  const product =
    AppState.products.find(
      item =>
        String(
          getProductId(item)
        ) ===
        String(productId)
    );

  if (!product) {
    return;
  }

  const liked =
    product._likedByCurrentUser ===
    true;

  if (liked) {
    product.likes =
      Math.max(
        0,
        Number(product.likes || 0) -
          1
      );

    product._likedByCurrentUser =
      false;

    AppState.statistics.likes =
      Math.max(
        0,
        Number(
          AppState.statistics.likes ||
            0
        ) - 1
      );
  } else {
    product.likes =
      Number(product.likes || 0) +
      1;

    product._likedByCurrentUser =
      true;

    AppState.statistics.likes =
      Number(
        AppState.statistics.likes || 0
      ) + 1;
  }

  saveProducts();

  saveStatistics();

  filterProducts();
}

/* =========================================================
   GUARDAR PRODUCTO
   ========================================================= */

function toggleSaveProduct(
  productId
) {
  const product =
    AppState.products.find(
      item =>
        String(
          getProductId(item)
        ) ===
        String(productId)
    );

  if (!product) {
    return;
  }

  const saved =
    product._savedByCurrentUser ===
    true;

  if (saved) {
    product.saved =
      Math.max(
        0,
        Number(product.saved || 0) -
          1
      );

    product._savedByCurrentUser =
      false;

    AppState.statistics.saved =
      Math.max(
        0,
        Number(
          AppState.statistics.saved ||
            0
        ) - 1
      );
  } else {
    product.saved =
      Number(product.saved || 0) +
      1;

    product._savedByCurrentUser =
      true;

    AppState.statistics.saved =
      Number(
        AppState.statistics.saved || 0
      ) + 1;
  }

  saveProducts();

  saveStatistics();

  filterProducts();
}

/* =========================================================
   EDICIÓN DE PERFIL
   ========================================================= */

function openEditProfile() {
  const user =
    AppState.currentUser ||
    {};

  const name =
    byId("editProfileName");

  const phone =
    byId("editProfilePhone");

  const email =
    byId("editProfileEmail");

  if (name) {
    name.value =
      user.name ||
      user.full_name ||
      "";
  }

  if (phone) {
    phone.value =
      user.phone ||
      user.whatsapp ||
      "";
  }

  if (email) {
    email.value =
      user.email ||
      "";
  }

  openModal(
    "editProfileModal"
  );
}

function saveProfileChanges() {
  const user =
    {
      ...(AppState.currentUser || {})
    };

  const name =
    byId("editProfileName");

  const phone =
    byId("editProfilePhone");

  const email =
    byId("editProfileEmail");

  if (name) {
    user.name =
      name.value.trim();
  }

  if (phone) {
    user.phone =
      phone.value.trim();

    user.whatsapp =
      phone.value.trim();
  }

  if (email) {
    user.email =
      email.value.trim();
  }

  saveUser(user);

  closeModal(
    "editProfileModal"
  );

  showToast(
    "Perfil actualizado.",
    "success"
  );
}

/* =========================================================
   CAMBIO DE FOTO DE PERFIL
   ========================================================= */

function handleProfilePhoto(
  file
) {
  if (!file) {
    return;
  }

  if (
    !file.type.startsWith("image/")
  ) {
    showToast(
      "Selecciona una imagen válida."
    );

    return;
  }

  const reader =
    new FileReader();

  reader.onload = event => {

    const user =
      {
        ...(AppState.currentUser ||
          {})
      };

    user.avatar =
      event.target.result;

    user.photo =
      event.target.result;

    saveUser(user);

    updateProfileImages();

    showToast(
      "Foto de perfil actualizada.",
      "success"
    );
  };

  reader.readAsDataURL(file);
}

function updateProfileImages() {
  const user =
    AppState.currentUser ||
    {};

  const avatar =
    user.avatar ||
    user.photo;

  if (!avatar) {
    return;
  }

  $$(
    ".profile-photo img, [data-user-avatar]"
  ).forEach(
    image => {
      image.src =
        avatar;
    }
  );
}

/* =========================================================
   ELIMINAR CUENTA
   ========================================================= */

function requestDeleteAccount() {
  const confirmed =
    window.confirm(
      "¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no debería realizarse sin confirmar nuevamente."
    );

  if (!confirmed) {
    return;
  }

  const secondConfirm =
    window.confirm(
      "Confirmación final: ¿eliminar definitivamente tu cuenta?"
    );

  if (!secondConfirm) {
    return;
  }

  deleteAccount();
}

async function deleteAccount() {
  /*
   * La eliminación definitiva deberá
   * ejecutarse mediante una función
   * segura del backend/Supabase.
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
      "No se pudo cerrar sesión Supabase:",
      error
    );
  }

  clearUser();

  removeStorage(
    STORAGE_PRODUCTS
  );

  closeAllModals();

  showToast(
    "La sesión local fue eliminada."
  );
}

/* =========================================================
   NOTIFICACIONES
   ========================================================= */

function openNotifications() {
  const notifications =
    AppState.notifications;

  if (
    notifications.length === 0
  ) {
    showToast(
      "No tienes notificaciones nuevas."
    );

    return;
  }

  const unread =
    notifications.filter(
      item => !item.read
    );

  if (unread.length > 0) {
    notifications.forEach(
      item => {
        item.read = true;
      }
    );

    saveNotifications();

    updateNotificationBadge();
  }

  const message =
    notifications
      .slice(0, 3)
      .map(
        item =>
          `${item.title}: ${item.message}`
      )
      .join(" | ");

  showToast(message);
}

/* =========================================================
   NAVEGACIÓN INFERIOR
   ========================================================= */

function setupBottomNavigation() {
  $$(
    ".nav-item"
  ).forEach(
    item => {

      item.addEventListener(
        "click",
        event => {

          event.preventDefault();

          const target =
            item.dataset.target ||
            item.dataset.nav ||
            item.getAttribute(
              "href"
            );

          if (
            item.classList.contains(
              "publish-nav"
            ) ||
            target === "publish"
          ) {
            openPublishModal();

            return;
          }

          if (
            target === "home" ||
            target === "#home"
          ) {
            scrollToTop();

            return;
          }

          if (
            target === "search" ||
            target === "#search"
          ) {
            focusSearch();

            return;
          }

          if (
            target === "chat" ||
            target === "#chat"
          ) {
            openGeneralChat();

            return;
          }

          if (
            target === "profile" ||
            target === "#profile"
          ) {
            openProfile();

            return;
          }
        }
      );
    }
  );
}

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function focusSearch() {
  const input =
    byId("searchInput") ||
    $(".search-box") ||
    $('input[type="search"]');

  if (!input) {
    return;
  }

  input.focus();

  input.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}

function openGeneralChat() {
  showToast(
    "Selecciona un producto para iniciar un chat con su vendedor."
  );
}

/* =========================================================
   PUBLICAR
   ========================================================= */

function openPublishModal() {
  if (!isLoggedIn()) {
    showToast(
      "Inicia sesión para publicar."
    );

    openModal(
      "loginModal"
    );

    return;
  }

  resetPublishForm();

  openModal(
    "publishModal"
  );
}

/* =========================================================
   EVENTOS GENERALES
   ========================================================= */

function setupGlobalEvents() {

  document.addEventListener(
    "click",
    event => {

      const actionElement =
        event.target.closest(
          "[data-action]"
        );

      if (!actionElement) {
        return;
      }

      const action =
        actionElement.dataset.action;

      const productId =
        actionElement.dataset.productId;

      switch (action) {

        case "open-product":
          if (
            event.target.closest(
              "[data-action='toggle-save']"
            )
          ) {
            return;
          }

          openProductById(
            productId
          );
          break;

        case "toggle-save":
          event.stopPropagation();

          toggleSaveProduct(
            productId
          );
          break;

        case "toggle-like":
          event.stopPropagation();

          toggleLikeProduct(
            productId
          );
          break;

        case "chat-seller": {

          const product =
            AppState.products.find(
              item =>
                String(
                  getProductId(item)
                ) ===
                String(productId)
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

        case "statistics":
          openStatistics();
          break;

        case "settings":
          openSettings();
          break;

        case "admin":
          requestAdminAccess();
          break;

        case "logout":
          logoutUser();
          break;

        case "publish":
          openPublishModal();
          break;
      }
    }
  );

  /* Notificaciones */

  const notificationButtons =
    $$(
      "#notificationBtn, .notification-btn"
    );

  notificationButtons.forEach(
    button => {

      button.addEventListener(
        "click",
        openNotifications
      );
    }
  );

  /* Configuración */

  const settingsButtons =
    $$(
      "#settingsBtn, .settings-btn"
    );

  settingsButtons.forEach(
    button => {

      button.addEventListener(
        "click",
        openSettings
      );
    }
  );

  /* Perfil */

  $$(
    "#profileBtn, [data-open-profile]"
  ).forEach(
    button => {

      button.addEventListener(
        "click",
        openProfile
      );
    }
  );

  /* Estadísticas */

  $$(
    "#statisticsBtn, [data-open-statistics]"
  ).forEach(
    button => {

      button.addEventListener(
        "click",
        openStatistics
      );
    }
  );

  /* Publicar */

  $$(
    "#publishBtn, #publishNavBtn, .publish-nav"
  ).forEach(
    button => {

      button.addEventListener(
        "click",
        openPublishModal
      );
    }
  );

  /* Chat */

  const sendButton =
    byId("chatSend") ||
    $(".chat-send");

  if (sendButton) {
    sendButton.addEventListener(
      "click",
      sendChatMessage
    );
  }

  const chatInput =
    byId("chatInput") ||
    $(".chat-input");

  if (chatInput) {

    chatInput.addEventListener(
      "keydown",
      event => {

        if (
          event.key ===
          "Enter"
        ) {
          event.preventDefault();

          sendChatMessage();
        }
      }
    );
  }

  /* Formulario de publicación */

  const publishButton =
    byId("publishProductBtn") ||
    byId("publishSubmit");

  if (publishButton) {

    publishButton.addEventListener(
      "click",
      publishProduct
    );
  }

  /* Imágenes */

  const imageInput =
    byId("productImages") ||
    byId("publishImages") ||
    $('[type="file"][accept*="image"]');

  if (imageInput) {

    imageInput.addEventListener(
      "change",
      event => {
        handleImageFiles(
          event.target.files
        );
      }
    );
  }

  /* Vídeo */

  const videoInput =
    byId("productVideo") ||
    byId("publishVideo") ||
    $('[type="file"][accept*="video"]');

  if (videoInput) {

    videoInput.addEventListener(
      "change",
      event => {

        const file =
          event.target.files?.[0];

        handleVideoFile(
          file
        );
      }
    );
  }

  /* Login */

  const loginButton =
    byId("loginSubmit") ||
    byId("loginBtn");

  if (loginButton) {

    loginButton.addEventListener(
      "click",
      async () => {

        const email =
          (
            byId("loginEmail") ||
            byId("email")
          )?.value.trim();

        const password =
          (
            byId("loginPassword") ||
            byId("password")
          )?.value;

        if (
          !email ||
          !password
        ) {
          showToast(
            "Completa correo y contraseña."
          );

          return;
        }

        await loginUser(
          email,
          password
        );
      }
    );
  }

  /* Registro */

  const registerButton =
    byId("registerSubmit") ||
    byId("registerBtn");

  if (registerButton) {

    registerButton.addEventListener(
      "click",
      async () => {

        const data = {

          name:
            (
              byId("registerName")
            )?.value.trim() ||
            "",

          email:
            (
              byId("registerEmail")
            )?.value.trim() ||
            "",

          password:
            (
              byId("registerPassword")
            )?.value ||
            "",

          phone:
            (
              byId("registerPhone")
            )?.value.trim() ||
            "",

          whatsapp:
            (
              byId("registerWhatsapp")
            )?.value.trim() ||
            ""
        };

        if (
          !data.name ||
          !data.email ||
          !data.password ||
          !data.phone
        ) {
          showToast(
            "Completa los datos obligatorios."
          );

          return;
        }

        await registerUser(
          data
        );
      }
    );
  }

  /* Logout */

  $$(
    "#logoutBtn, [data-logout]"
  ).forEach(
    button => {

      button.addEventListener(
        "click",
        logoutUser
      );
    }
  );

  /* Admin */

  $$(
    "#adminBtn, [data-open-admin]"
  ).forEach(
    button => {

      button.addEventListener(
        "click",
        requestAdminAccess
      );
    }
  );

  const adminLoginButton =
    byId("verifyAdminPassword") ||
    byId("adminLoginBtn");

  if (adminLoginButton) {

    adminLoginButton.addEventListener(
      "click",
      verifyAdminPassword
    );
  }

  const changeAdminButton =
    byId("changeAdminPasswordBtn");

  if (changeAdminButton) {

    changeAdminButton.addEventListener(
      "click",
      openChangeAdminPassword
    );
  }

  const saveAdminPasswordButton =
    byId("saveAdminPasswordBtn");

  if (saveAdminPasswordButton) {

    saveAdminPasswordButton.addEventListener(
      "click",
      changeAdminPassword
    );
  }

  /* Editar perfil */

  $$(
    "#editProfileBtn, [data-edit-profile]"
  ).forEach(
    button => {

      button.addEventListener(
        "click",
        openEditProfile
      );
    }
  );

  const saveProfileButton =
    byId("saveProfileBtn");

  if (saveProfileButton) {

    saveProfileButton.addEventListener(
      "click",
      saveProfileChanges
    );
  }

  /* Foto perfil */

  const profilePhotoInput =
    byId("profilePhotoInput");

  if (profilePhotoInput) {

    profilePhotoInput.addEventListener(
      "change",
      event => {

        handleProfilePhoto(
          event.target.files?.[0]
        );
      }
    );
  }

  /* Eliminar cuenta */

  $$(
    "#deleteAccountBtn, [data-delete-account]"
  ).forEach(
    button => {

      button.addEventListener(
        "click",
        requestDeleteAccount
      );
    }
  );

  /* Cambio de estilo */

  $$(
    "#changeStyleBtn, [data-change-style]"
  ).forEach(
    button => {

      button.addEventListener(
        "click",
        cycleTheme
      );
    }
  );

  /* =====================================================
     TOGGLES DE CONFIGURACIÓN
     ===================================================== */

  $$(
    "[data-setting]"
  ).forEach(
    element => {

      if (
        element.type !==
        "checkbox"
      ) {
        return;
      }

      element.addEventListener(
        "change",
        event => {

          updateSetting(
            element.dataset.setting,
            event.target.checked
          );
        }
      );
    }
  );

  /* También soportar IDs conocidos */

  const knownSettings = [
    "notifications",
    "soundNotifications",
    "chatEnabled",
    "whatsappEnabled",
    "locationEnabled",
    "darkMode",
    "compactMode",
    "animations",
    "showOnlineStatus"
  ];

  knownSettings.forEach(
    setting => {

      const element =
        byId(setting);

      if (
        element &&
        element.type ===
          "checkbox"
      ) {

        element.addEventListener(
          "change",
          event => {

            updateSetting(
              setting,
              event.target.checked
            );
          }
        );
      }
    }
  );

  /* Navegación */

  setupBottomNavigation();

  /* Cerrar modales */

  setupModalCloseButtons();
}

/* =========================================================
   INICIALIZACIÓN
   ========================================================= */

async function initializeMarketFlash() {

  if (
    AppState.initialized
  ) {
    return;
  }

  AppState.initialized =
    true;

  /* Configuración */

  loadConfiguration();

  /* Usuario */

  loadUser();

  /* Datos */

  loadProducts();

  loadNotifications();

  loadMessages();

  loadStatistics();

  loadAdminConfig();

  /* Render */

  filterProducts();

  renderStatistics();

  renderAdvertising();

  updateProfileImages();

  updateUserInterface();

  /* Eventos */

  setupSearch();

  setupCategories();

  setupGlobalEvents();

  /* Supabase */

  try {

    if (
      MFSupabase &&
      typeof MFSupabase.supabaseGetCurrentUser ===
        "function"
    ) {

      const result =
        await MFSupabase.supabaseGetCurrentUser();

      if (
        result &&
        !result.error &&
        result.user
      ) {

        saveUser(
          result.user
        );
      }
    }

  } catch (error) {

    console.warn(
      "Supabase todavía no está configurado:",
      error
    );
  }

  /* Actualizar nuevamente */

  loadAdminConfig();

  updateUserInterface();

  renderStatistics();

  renderAdvertising();

  /* Quitar pantalla de carga */

  const loading =
    byId("loadingScreen") ||
    $(".loading-screen");

  if (loading) {

    setTimeout(
      () => {

        loading.classList.add(
          "hidden"
        );

      },
      300
    );
  }

  console.log(
    "Market Flash iniciado correctamente."
  );
}

/* =========================================================
   ATAJOS GLOBALES
   ========================================================= */

window.MarketFlash = {

  state:
    AppState,

  openModal,

  closeModal,

  closeAllModals,

  showToast,

  publishProduct,

  openPublishModal,

  openProfile,

  openStatistics,

  openSettings,

  requestAdminAccess,

  openAdminPanel,

  openSellerChat,

  sendChatMessage,

  logoutUser,

  filterProducts,

  toggleLikeProduct,

  toggleSaveProduct,

  updateSetting
};

/* =========================================================
   EVENTOS DEL DOCUMENTO
   ========================================================= */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initializeMarketFlash
  );

} else {

  initializeMarketFlash();
}

/* =========================================================
   ESCAPE PARA CERRAR MODALES
   ========================================================= */

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Escape"
    ) {

      const activeModal =
        document.querySelector(
          ".modal.active"
        );

      if (activeModal) {

        activeModal.classList.remove(
          "active"
        );

        if (
          !document.querySelector(
            ".modal.active"
          )
        ) {
          document.body.classList.remove(
            "modal-open"
          );
        }
      }
    }
  }
);

/* =========================================================
   FIN DE SCRIPT.JS
   ========================================================= */
