/* =========================================================
   MARKET FLASH
   SCRIPT.JS
   Sistema principal de la aplicación
   ========================================================= */

"use strict";


/* =========================================================
   CONFIGURACIÓN GENERAL
   ========================================================= */

const MF = {
  userKey: "market_flash_user",
  productsKey: "market_flash_products",
  adsKey: "market_flash_ads",
  chatsKey: "market_flash_chats",
  configKey: "market_flash_config",
  statsKey: "market_flash_stats",
  reportsKey: "market_flash_reports",
  sanctionsKey: "market_flash_sanctions",
  notificationsKey: "market_flash_notifications",
  adminKey: "market_flash_admin"
};


/* =========================================================
   ESTADO
   ========================================================= */

let currentUser =
  JSON.parse(localStorage.getItem(MF.userKey) || "null");

let products =
  JSON.parse(localStorage.getItem(MF.productsKey) || "null") || [];

let advertisements =
  JSON.parse(localStorage.getItem(MF.adsKey) || "null") || [];

let chats =
  JSON.parse(localStorage.getItem(MF.chatsKey) || "null") || [];

let reports =
  JSON.parse(localStorage.getItem(MF.reportsKey) || "null") || [];

let sanctions =
  JSON.parse(localStorage.getItem(MF.sanctionsKey) || "null") || [];

let notificationsList =
  JSON.parse(localStorage.getItem(MF.notificationsKey) || "null") || [];

let appConfig =
  JSON.parse(localStorage.getItem(MF.configKey) || "null") || {
    appName: "Market Flash",

    advertisingEnabled: true,

    flashDayEnabled: true,

    plans: {
      basic: {
        name: "Básico",
        price: 500,
        duration: 7,
        rotation: 1
      },

      standard: {
        name: "Estándar",
        price: 1000,
        duration: 15,
        rotation: 2
      },

      premium: {
        name: "Premium",
        price: 2000,
        duration: 30,
        rotation: 4
      }
    },

    payments: {
      popular: {
        name: "Banco Popular",
        enabled: true,
        account: "",
        owner: ""
      },

      reservas: {
        name: "Banco de Reservas",
        enabled: true,
        account: "",
        owner: ""
      },

      binance: {
        name: "Binance",
        enabled: true,
        account: "",
        owner: ""
      },

      paypal: {
        name: "PayPal",
        enabled: true,
        account: "",
        owner: ""
      }
    },

    chatBackground:
      "paisaje",

    allowWhatsApp: true,

    allowMessenger: true,

    allowInternalChat: true
  };


let statistics =
  JSON.parse(localStorage.getItem(MF.statsKey) || "null") || {
    registered: 0,
    deleted: 0,
    sales: 0,
    purchases: 0
  };


/* =========================================================
   GUARDADO
   ========================================================= */

function saveAll() {

  localStorage.setItem(
    MF.userKey,
    JSON.stringify(currentUser)
  );

  localStorage.setItem(
    MF.productsKey,
    JSON.stringify(products)
  );

  localStorage.setItem(
    MF.adsKey,
    JSON.stringify(advertisements)
  );

  localStorage.setItem(
    MF.chatsKey,
    JSON.stringify(chats)
  );

  localStorage.setItem(
    MF.reportsKey,
    JSON.stringify(reports)
  );

  localStorage.setItem(
    MF.sanctionsKey,
    JSON.stringify(sanctions)
  );

  localStorage.setItem(
    MF.notificationsKey,
    JSON.stringify(notificationsList)
  );

  localStorage.setItem(
    MF.configKey,
    JSON.stringify(appConfig)
  );

  localStorage.setItem(
    MF.statsKey,
    JSON.stringify(statistics)
  );
}


/* =========================================================
   UTILIDADES
   ========================================================= */

function $(id) {
  return document.getElementById(id);
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

  return new Intl.NumberFormat(
    "es-DO",
    {
      style: "currency",
      currency: "DOP",
      maximumFractionDigits: 0
    }
  ).format(Number(value) || 0);
}


function showToast(message) {

  const toast = $("toast");

  if (!toast) return;

  toast.textContent = message;

  toast.classList.remove("hidden");

  clearTimeout(window.mfToast);

  window.mfToast = setTimeout(() => {

    toast.classList.add("hidden");

  }, 2800);
}


function vibrate() {

  if (
    "vibrate" in navigator
  ) {
    navigator.vibrate(25);
  }
}


function buttonFeedback(button) {

  if (!button) return;

  button.classList.add("pressed");

  setTimeout(() => {
    button.classList.remove("pressed");
  }, 180);

  vibrate();
}


function saveFileData(file) {

  return new Promise((resolve, reject) => {

    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result);
    };

    reader.onerror = reject;

    reader.readAsDataURL(file);

  });
}


/* =========================================================
   MODALES
   ========================================================= */

function openModal(html) {

  const modal = $("modal");
  const card = $("modalCard");

  if (!modal || !card) return;

  card.innerHTML = html;

  modal.classList.remove("hidden");

  document.body.classList.add("modal-open");
}


function closeModal() {

  const modal = $("modal");

  if (!modal) return;

  modal.classList.add("hidden");

  document.body.classList.remove("modal-open");
}


if ($("modal")) {

  $("modal").addEventListener(
    "click",
    function(event) {

      if (event.target === $("modal")) {
        closeModal();
      }

    }
  );
}


/* =========================================================
   CATEGORÍAS
   ========================================================= */

const categories = [
  "Todos",
  "Celulares",
  "Computadoras",
  "Videojuegos",
  "Ropa",
  "Hogar",
  "Vehículos",
  "Otros"
];


function renderCategories() {

  const row = $("categoryRow");

  if (!row) return;

  row.innerHTML = categories.map(
    (category, index) => `

      <button
        class="chip ${index === 0 ? "active" : ""}"
        data-category="${escapeHTML(category)}"
      >
        ${escapeHTML(category)}
      </button>

    `
  ).join("");

  row.querySelectorAll(".chip")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          row.querySelectorAll(".chip")
            .forEach(item =>
              item.classList.remove("active")
            );

          button.classList.add("active");

          renderProducts(
            button.dataset.category
          );

          buttonFeedback(button);

        }
      );

    });
}


/* =========================================================
   PRODUCTOS DE EJEMPLO
   ========================================================= */

function createDemoProducts() {

  if (products.length) return;

  products = [

    {
      id: "p1",
      name: "iPhone 15 Pro",
      category: "Celulares",
      price: 45000,
      description:
        "iPhone 15 Pro en excelente condición.",
      seller: "Market Flash",
      sellerId: "demo1",
      location: "Santo Domingo",
      image:
        "https://images.unsplash.com/photo-1696446702183-cbd13d5f2e88?auto=format&fit=crop&w=800&q=80",
      views: 1284,
      likes: 86,
      rating: 4.9,
      sales: 24,
      status: "active",
      sold: false,
      purchased: false
    },

    {
      id: "p2",
      name: "Samsung Galaxy S24",
      category: "Celulares",
      price: 38000,
      description:
        "Samsung Galaxy S24 listo para entrega.",
      seller: "Tecnología RD",
      sellerId: "demo2",
      location: "Santiago",
      image:
        "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=800&q=80",
      views: 743,
      likes: 51,
      rating: 4.8,
      sales: 18,
      status: "active",
      sold: false,
      purchased: false
    },

    {
      id: "p3",
      name: "Laptop profesional",
      category: "Computadoras",
      price: 52000,
      description:
        "Laptop profesional para trabajo y estudio.",
      seller: "Tech Store",
      sellerId: "demo3",
      location: "Santo Domingo",
      image:
        "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80",
      views: 491,
      likes: 29,
      rating: 4.7,
      sales: 13,
      status: "active",
      sold: false,
      purchased: false
    },

    {
      id: "p4",
      name: "PlayStation 5",
      category: "Videojuegos",
      price: 32000,
      description:
        "PlayStation 5 en excelentes condiciones.",
      seller: "Gaming RD",
      sellerId: "demo4",
      location: "Santo Domingo Este",
      image:
        "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&q=80",
      views: 952,
      likes: 73,
      rating: 4.9,
      sales: 31,
      status: "active",
      sold: false,
      purchased: false
    }

  ];

  saveAll();
}


/* =========================================================
   MOSTRAR PRODUCTOS
   ========================================================= */

function renderProducts(category = "Todos") {

  const grid = $("productsGrid");

  if (!grid) return;

  const search =
    $("searchInput")?.value
      .trim()
      .toLowerCase() || "";

  let list = products.filter(product => {

    const categoryOK =
      category === "Todos" ||
      product.category === category;

    const searchOK =
      !search ||
      product.name.toLowerCase().includes(search) ||
      product.category.toLowerCase().includes(search) ||
      product.location.toLowerCase().includes(search) ||
      product.description.toLowerCase().includes(search);

    return (
      categoryOK &&
      searchOK &&
      product.status !== "deleted"
    );

  });


  if ($("productCount")) {

    $("productCount").textContent =
      `${list.length} ${
        list.length === 1
          ? "publicación"
          : "publicaciones"
      }`;

  }


  if (!list.length) {

    grid.innerHTML = `

      <div class="empty-state">

        <div class="empty-icon">
          🔎
        </div>

        <h3>
          No encontramos publicaciones
        </h3>

        <p>
          Prueba otra búsqueda o categoría.
        </p>

      </div>

    `;

    return;
  }


  grid.innerHTML = list.map(
    product => `

      <article
        class="product-card"
        onclick="openProduct('${product.id}')"
      >

        <div class="product-image-wrap">

          <img
            src="${escapeHTML(product.image)}"
            alt="${escapeHTML(product.name)}"
          >

          ${
            product.sold
              ? `
                <span class="sold-label">
                  VENDIDO
                </span>
              `
              : ""
          }

        </div>


        <div class="product-info">

          <h3>
            ${escapeHTML(product.name)}
          </h3>

          <strong class="product-price">
            ${money(product.price)}
          </strong>

          <p>
            📍 ${escapeHTML(product.location)}
          </p>

          <div class="mini-stats">

            <span>
              👁 ${product.views || 0}
            </span>

            <span>
              ❤️ ${product.likes || 0}
            </span>

            <span>
              ⭐ ${product.rating || 0}
            </span>

          </div>

        </div>

      </article>

    `
  ).join("");
}


/* =========================================================
   DETALLE DEL PRODUCTO
   ========================================================= */

function openProduct(id) {

  const product =
    products.find(item => item.id === id);

  if (!product) return;

  product.views =
    Number(product.views || 0) + 1;

  saveAll();


  openModal(`

    <div class="modal-header">

      <button
        class="back-btn"
        onclick="closeModal()"
      >
        ←
      </button>

      <h2>
        Publicación
      </h2>

      <button
        class="close-btn"
        onclick="closeModal()"
      >
        ×
      </button>

    </div>


    <div class="detail-content">

      <img
        class="detail-image"
        src="${escapeHTML(product.image)}"
        alt="${escapeHTML(product.name)}"
      >


      ${
        product.sold
          ? `
            <div class="status-banner sold">
              🔴 PRODUCTO VENDIDO
            </div>
          `
          : ""
      }


      <h1>
        ${escapeHTML(product.name)}
      </h1>

      <div class="detail-price">
        ${money(product.price)}
      </div>


      <p class="detail-description">
        ${escapeHTML(product.description)}
      </p>


      <div class="seller-box">

        <strong>
          👤 ${escapeHTML(product.seller)}
        </strong>

        <span>
          ⭐ ${product.rating || 0}
          · ${product.sales || 0} ventas
        </span>

      </div>


      <div class="detail-stats">

        <span>
          👁 ${product.views || 0} visualizaciones
        </span>

        <span>
          ❤️ ${product.likes || 0} me gusta
        </span>

      </div>


      ${
        !product.sold
          ? `

            <div class="contact-buttons">

              ${
                appConfig.allowInternalChat
                  ? `
                    <button
                      class="primary-btn"
                      onclick="openChat('${product.sellerId}','${product.seller}')"
                    >
                      💬 Chat
                    </button>
                  `
                  : ""
              }


              ${
                appConfig.allowWhatsApp
                  ? `
                    <button
                      class="whatsapp-btn"
                      onclick="contactWhatsApp('${product.seller}')"
                    >
                      🟢 WhatsApp
                    </button>
                  `
                  : ""
              }


              ${
                appConfig.allowMessenger
                  ? `
                    <button
                      class="messenger-btn"
                      onclick="contactMessenger('${product.seller}')"
                    >
                      🔵 Messenger
                    </button>
                  `
                  : ""
              }

            </div>


            <div class="transaction-buttons">

              <button
                class="purchase-btn"
                onclick="markPurchased('${product.id}')"
              >
                🛒 Marcar como comprado
              </button>

              <button
                class="report-btn"
                onclick="openReport('${product.id}')"
              >
                🚨 Reclamar
              </button>

            </div>

          `
          : `

            <div class="notice-box">
              Esta publicación ya fue retirada porque
              la operación fue confirmada.
            </div>

          `
      }

    </div>

  `);
}


/* =========================================================
   FLASH DEL DÍA
   ========================================================= */

function renderFlashDay() {

  const activeAds =
    advertisements.filter(
      ad =>
        ad.status === "approved" &&
        ad.active !== false
    );


  if (!activeAds.length) return;


  const ad =
    activeAds[
      Math.floor(
        Math.random() * activeAds.length
      )
    ];


  const flash = $("flashDayBtn");

  if (!flash) return;


  flash.innerHTML = `

    <div class="flash-media">

      ${
        ad.type === "video"
          ? `
            <video
              src="${escapeHTML(ad.media)}"
              autoplay
              muted
              loop
              playsinline
            ></video>
          `
          : `
            <img
              src="${escapeHTML(ad.media)}"
              alt="${escapeHTML(ad.title)}"
            >
          `
      }

    </div>


    <div class="flash-overlay">

      <span>
        ⚡ FLASH DEL DÍA
      </span>

      <strong>
        ${escapeHTML(ad.title)}
      </strong>

      <small>
        ${escapeHTML(ad.description || "")}
      </small>

    </div>

  `;

}


function openAdvertising() {

  if (!currentUser) {

    loginRequired(
      "Para publicar una publicidad primero debes crear tu cuenta."
    );

    return;
  }


  openAdvertisingForm();
}


/* =========================================================
   CREAR PUBLICIDAD
   ========================================================= */

function openAdvertisingForm() {

  const plans =
    Object.entries(appConfig.plans);


  openModal(`

    <div class="modal-header">

      <button
        class="back-btn"
        onclick="closeModal()"
      >
        ←
      </button>

      <h2>
        Crear publicidad
      </h2>

      <button
        class="close-btn"
        onclick="closeModal()"
      >
        ×
      </button>

    </div>


    <div class="form">

      <div class="media-title">
        📸 Selecciona tu foto o video
      </div>


      <div class="media-options">

        <label class="media-option">

          <span>
            📷
          </span>

          <strong>
            Foto
          </strong>

          <input
            id="adPhoto"
            type="file"
            accept="image/*"
            hidden
          >

        </label>


        <label class="media-option">

          <span>
            🎥
          </span>

          <strong>
            Video
          </strong>

          <input
            id="adVideo"
            type="file"
            accept="video/*"
            hidden
          >

        </label>

      </div>


      <div id="adMediaPreview"></div>


      <label>
        Nombre de la publicidad

        <input
          id="adTitle"
          type="text"
          placeholder="Ej.: Venta de celulares"
        >

      </label>


      <label>
        Descripción

        <textarea
          id="adDescription"
          placeholder="Describe tu producto o negocio..."
        ></textarea>

      </label>


      <h3>
        Selecciona tu plan
      </h3>


      <div class="plans">

        ${plans.map(
          ([key, plan]) => `

            <button
              class="plan-card"
              data-plan="${key}"
              onclick="selectAdPlan('${key}')"
            >

              <strong>
                ${escapeHTML(plan.name)}
              </strong>

              <span>
                ${money(plan.price)}
              </span>

              <small>
                ${plan.duration} días
              </small>

            </button>

          `
        ).join("")}

      </div>


      <div id="selectedPlanInfo"></div>


      <button
        class="primary-btn"
        onclick="continueAdvertisingPayment()"
      >
        Continuar con el pago →
      </button>

    </div>

  `);


  setupAdvertisingFiles();
}


let selectedAdvertisingPlan = "basic";


function selectAdPlan(plan) {

  selectedAdvertisingPlan = plan;

  document
    .querySelectorAll(".plan-card")
    .forEach(card =>
      card.classList.remove("selected")
    );


  document
    .querySelector(
      `[data-plan="${plan}"]`
    )
    ?.classList.add("selected");


  const selected =
    appConfig.plans[plan];


  if ($("selectedPlanInfo")) {

    $("selectedPlanInfo").innerHTML = `

      <div class="selected-plan">

        <strong>
          ${escapeHTML(selected.name)}
        </strong>

        <span>
          ${money(selected.price)}
        </span>

      </div>

    `;

  }
}


function setupAdvertisingFiles() {

  ["adPhoto", "adVideo"].forEach(id => {

    const input = $(id);

    if (!input) return;

    input.addEventListener(
      "change",
      async function() {

        const file = this.files?.[0];

        if (!file) return;

        try {

          const data =
            await saveFileData(file);

          window.pendingAdMedia = data;

          window.pendingAdType =
            file.type.startsWith("video/")
              ? "video"
              : "image";


          $("adMediaPreview").innerHTML =
            window.pendingAdType === "video"
              ? `
                <video
                  class="preview-media"
                  src="${data}"
                  controls
                ></video>
              `
              : `
                <img
                  class="preview-media"
                  src="${data}"
                  alt="Vista previa"
                >
              `;

        } catch {

          showToast(
            "No se pudo cargar el archivo."
          );

        }

      }
    );

  });

}


function continueAdvertisingPayment() {

  const title =
    $("adTitle")?.value.trim();

  const description =
    $("adDescription")?.value.trim();


  if (!window.pendingAdMedia) {

    showToast(
      "Selecciona una foto o video."
    );

    return;
  }


  if (!title) {

    showToast(
      "Escribe el nombre de la publicidad."
    );

    return;
  }


  const plan =
    appConfig.plans[
      selectedAdvertisingPlan
    ];


  openPaymentForm({
    title,
    description,
    media: window.pendingAdMedia,
    type: window.pendingAdType,
    plan: selectedAdvertisingPlan,
    price: plan.price
  });
}


/* =========================================================
   PAGOS DE PUBLICIDAD
   ========================================================= */

function openPaymentForm(adData) {

  const payments =
    Object.entries(appConfig.payments)
      .filter(([, payment]) => payment.enabled);


  openModal(`

    <div class="modal-header">

      <button
        class="back-btn"
        onclick="openAdvertisingForm()"
      >
        ←
      </button>

      <h2>
        💳 Pago de publicidad
      </h2>

      <button
        class="close-btn"
        onclick="closeModal()"
      >
        ×
      </button>

    </div>


    <div class="payment-summary">

      <strong>
        ${escapeHTML(adData.title)}
      </strong>

      <span>
        Plan ${escapeHTML(
          appConfig.plans[adData.plan].name
        )}
      </span>

      <b>
        ${money(adData.price)}
      </b>

    </div>


    <h3>
      Selecciona método de pago
    </h3>


    <div class="payment-list">

      ${payments.map(
        ([key, payment]) => `

          <button
            class="payment-option"
            onclick="selectPaymentMethod('${key}')"
          >

            <strong>
              ${escapeHTML(payment.name)}
            </strong>

            <small>
              Toca para ver los datos de pago
            </small>

          </button>

        `
      ).join("")}

    </div>


    <div id="paymentDetails"></div>


    <label>
      📸 Comprobante de pago

      <input
        id="paymentProof"
        type="file"
        accept="image/*"
      >

    </label>


    <button
      id="sendPaymentBtn"
      class="primary-btn"
      disabled
      onclick="submitAdvertisingPayment(${JSON.stringify(
        adData
      ).replace(/"/g, "&quot;")})"
    >
      📤 Enviar comprobante
    </button>

  `);

}


let selectedPaymentMethod = null;


function selectPaymentMethod(method) {

  selectedPaymentMethod = method;

  const payment =
    appConfig.payments[method];


  if ($("paymentDetails")) {

    $("paymentDetails").innerHTML = `

      <div class="payment-details">

        <strong>
          ${escapeHTML(payment.name)}
        </strong>

        <p>
          Cuenta:
          ${escapeHTML(
            payment.account || "Pendiente de configurar"
          )}
        </p>

        <p>
          Titular:
          ${escapeHTML(
            payment.owner || "Pendiente de configurar"
          )}
        </p>

      </div>

    `;

  }


  const proof =
    $("paymentProof");


  if (proof) {

    proof.addEventListener(
      "change",
      () => {

        if (
          selectedPaymentMethod &&
          proof.files?.length
        ) {

          $("sendPaymentBtn")
            ?.removeAttribute("disabled");

        }

      },
      { once: true }
    );

  }
}


async function submitAdvertisingPayment(adData) {

  const proof =
    $("paymentProof")?.files?.[0];


  if (!selectedPaymentMethod) {

    showToast(
      "Selecciona un método de pago."
    );

    return;
  }


  if (!proof) {

    showToast(
      "Sube el comprobante de pago."
    );

    return;
  }


  const proofData =
    await saveFileData(proof);


  const ad = {

    id:
      "ad_" +
      Date.now(),

    userId:
      currentUser.id,

    userName:
      currentUser.name,

    title:
      adData.title,

    description:
      adData.description,

    media:
      adData.media,

    type:
      adData.type,

    plan:
      adData.plan,

    price:
      adData.price,

    paymentMethod:
      selectedPaymentMethod,

    paymentProof:
      proofData,

    status:
      "pending",

    active:
      false,

    createdAt:
      new Date().toISOString(),

    views:
      0,

    likes:
      0

  };


  advertisements.push(ad);

  saveAll();


  addAdminNotification(
    `💰 Nuevo pago de publicidad de ${currentUser.name}`
  );


  showToast(
    "Publicidad enviada. Esperando aprobación."
  );


  closeModal();

}


/* =========================================================
   REGISTRO
   ========================================================= */

function openRegister() {

  openModal(`

    <div class="modal-header">

      <h2>
        📝 Crear cuenta
      </h2>

      <button
        class="close-btn"
        onclick="closeModal()"
      >
        ×
      </button>

    </div>


    <form
      class="form"
      onsubmit="registerUser(event)"
    >

      <label>
        Nombre completo

        <input
          id="registerName"
          required
          type="text"
        >

      </label>


      <label>
        Número de cédula

        <input
          id="registerId"
          required
          type="text"
        >

      </label>


      <label>
        Teléfono / WhatsApp

        <input
          id="registerPhone"
          required
          type="tel"
        >

      </label>


      <label>
        Contraseña

        <input
          id="registerPassword"
          required
          type="password"
        >

      </label>


      <label class="check-line">

        <input
          id="acceptRules"
          type="checkbox"
          required
        >

        <span>
          Acepto las normas de Market Flash.
        </span>

      </label>


      <button class="primary-btn">
        Crear mi cuenta
      </button>

    </form>

  `);
}


function registerUser(event) {

  event.preventDefault();


  const name =
    $("registerName").value.trim();

  const cedula =
    $("registerId").value.trim();

  const phone =
    $("registerPhone").value.trim();

  const password =
    $("registerPassword").value;


  currentUser = {

    id:
      "user_" + Date.now(),

    name,
    cedula,
    phone,
    whatsapp: phone,
    password,

    rating:
      5,

    sales:
      0,

    purchases:
      0,

    createdAt:
      new Date().toISOString(),

    blocked:
      false

  };


  statistics.registered++;

  saveAll();


  showToast(
    "Cuenta creada correctamente."
  );


  closeModal();

  updateUI();

}


/* =========================================================
   LOGIN
   ========================================================= */

function openLogin() {

  openModal(`

    <div class="modal-header">

      <h2>
        🔐 Iniciar sesión
      </h2>

      <button
        class="close-btn"
        onclick="closeModal()"
      >
        ×
      </button>

    </div>


    <form
      class="form"
      onsubmit="loginUser(event)"
    >

      <label>
        Cédula o teléfono

        <input
          id="loginIdentifier"
          required
        >

      </label>


      <label>
        Contraseña

        <input
          id="loginPassword"
          type="password"
          required
        >

      </label>


      <button class="primary-btn">
        Entrar
      </button>

    </form>

  `);
}


function loginUser(event) {

  event.preventDefault();


  if (!currentUser) {

    showToast(
      "No existe una cuenta en este dispositivo."
    );

    return;
  }


  const identifier =
    $("loginIdentifier").value.trim();

  const password =
    $("loginPassword").value;


  if (
    (
      identifier === currentUser.cedula ||
      identifier === currentUser.phone
    ) &&
    password === currentUser.password
  ) {

    if (currentUser.blocked) {

      showToast(
        "Tu cuenta está bloqueada."
      );

      return;
    }


    showToast(
      "Sesión iniciada correctamente."
    );

    closeModal();

  } else {

    showToast(
      "Los datos de acceso no son correctos."
    );

  }

}


/* =========================================================
   PERFIL
   ========================================================= */

function openProfile() {

  if (!currentUser) {

    openModal(`

      <div class="profile-login">

        <div class="big-icon">
          👤
        </div>

        <h2>
          Mi perfil
        </h2>

        <p>
          Crea una cuenta o inicia sesión.
        </p>


        <button
          class="primary-btn"
          onclick="openRegister()"
        >
          📝 Crear cuenta
        </button>


        <button
          class="secondary-btn"
          onclick="openLogin()"
        >
          🔐 Iniciar sesión
        </button>

      </div>

    `);

    return;
  }


  openModal(`

    <div class="modal-header">

      <h2>
        👤 Mi perfil
      </h2>

      <button
        class="close-btn"
        onclick="closeModal()"
      >
        ×
      </button>

    </div>


    <div class="profile-card">

      <div class="profile-avatar">
        👤
      </div>

      <h2>
        ${escapeHTML(currentUser.name)}
      </h2>

      <p>
        📱 ${escapeHTML(currentUser.phone)}
      </p>

      <div class="profile-rating">
        ⭐ ${currentUser.rating || 5}
      </div>

    </div>


    <div class="profile-menu">

      <button onclick="openMyActivity()">
        📊 Mi actividad
      </button>

      <button onclick="openSettings()">
        ⚙️ Configuración
      </button>

      <button onclick="openMySales()">
        🛍 Mis ventas
      </button>

      <button onclick="openMyPurchases()">
        🛒 Mis compras
      </button>

      <button onclick="openMyAdvertisements()">
        📣 Mis publicidades
      </button>

      <button onclick="openRules()">
        📜 Normas de Market Flash
      </button>

      <button
        class="danger-text"
        onclick="confirmDeleteAccount()"
      >
        🗑 Eliminar mi cuenta
      </button>

      <button
        class="secondary-btn"
        onclick="logout()"
      >
        🚪 Cerrar sesión
      </button>

    </div>

  `);
}


/* =========================================================
   CONFIGURACIÓN DEL USUARIO
   ========================================================= */

function openSettings() {

  openModal(`

    <div class="modal-header">

      <button
        class="back-btn"
        onclick="openProfile()"
      >
        ←
      </button>

      <h2>
        ⚙️ Configuración
      </h2>

      <button
        class="close-btn"
        onclick="closeModal()"
      >
        ×
      </button>

    </div>


    <div class="settings-list">

      <button onclick="openChatSettings()">
        💬 Configuración del chat
      </button>

      <button onclick="toggleNotifications()">
        🔔 Notificaciones
      </button>

      <button onclick="openSecuritySettings()">
        🔐 Seguridad
      </button>

      <button onclick="openRules()">
        📜 Normas
      </button>

    </div>

  `);
}


function openChatSettings() {

  openModal(`

    <div class="modal-header">

      <h2>
        💬 Chat
      </h2>

      <button
        class="close-btn"
        onclick="openSettings()"
      >
        ×
      </button>

    </div>


    <div class="chat-background-options">

      <button
        onclick="setChatBackground('paisaje')"
      >
        🌅 Paisaje
      </button>

      <button
        onclick="setChatBackground('montanas')"
      >
        🏔️ Montañas
      </button>

      <button
        onclick="setChatBackground('playa')"
      >
        🏝️ Playa
      </button>

      <button
        onclick="setChatBackground('noche')"
      >
        🌌 Noche
      </button>

    </div>

  `);
}


function setChatBackground(background) {

  appConfig.chatBackground =
    background;

  saveAll();

  showToast(
    "Fondo del chat actualizado."
  );

}


/* =========================================================
   ACTIVIDAD
   ========================================================= */

function openMyActivity() {

  if (!currentUser) {

    loginRequired();

    return;
  }


  const myProducts =
    products.filter(
      product =>
        product.sellerId === currentUser.id
    );


  openModal(`

    <div class="modal-header">

      <h2>
        📊 Mi actividad
      </h2>

      <button
        class="close-btn"
        onclick="closeModal()"
      >
        ×
      </button>

    </div>


    <div class="activity-stats">

      <div>
        <b>${myProducts.length}</b>
        <span>Publicaciones</span>
      </div>

      <div>
        <b>
          ${myProducts.reduce(
            (sum,p) =>
              sum + Number(p.views || 0),
            0
          )}
        </b>
        <span>Visualizaciones</span>
      </div>

      <div>
        <b>
          ${myProducts.reduce(
            (sum,p) =>
              sum + Number(p.likes || 0),
            0
          )}
        </b>
        <span>Me gusta</span>
      </div>

      <div>
        <b>
          ${currentUser.sales || 0}
        </b>
        <span>Ventas</span>
      </div>

    </div>

  `);
}


function openMySales() {

  openMyActivity();

}


function openMyPurchases() {

  openModal(`

    <div class="modal-header">

      <h2>
        🛒 Mis compras
      </h2>

      <button
        class="close-btn"
        onclick="closeModal()"
      >
        ×
      </button>

    </div>

    <div class="empty-state">

      <div class="empty-icon">
        🛒
      </div>

      <h3>
        Historial de compras
      </h3>

      <p>
        Aquí aparecerán tus compras confirmadas.
      </p>

    </div>

  `);

}


/* =========================================================
   CHAT
   ========================================================= */

function openChat(sellerId, sellerName) {

  if (!currentUser) {

    loginRequired();

    return;
  }


  const chatId =
    [currentUser.id, sellerId]
      .sort()
      .join("_");


  renderChat(chatId, sellerId, sellerName);
}


function renderChat(
  chatId,
  otherId,
  otherName
) {

  const messages =
    chats.filter(
      message =>
        message.chatId === chatId
    );


  openModal(`

    <div class="modal-header">

      <h2>
        💬 ${escapeHTML(otherName)}
      </h2>

      <button
        class="close-btn"
        onclick="closeModal()"
      >
        ×
      </button>

    </div>


    <div
      id="chatMessages"
      class="chat-messages chat-bg-${escapeHTML(
        appConfig.chatBackground
      )}"
    >

      ${
        messages.length
          ? messages.map(
              message => `

                <div
                  class="chat-message ${
                    message.senderId === currentUser.id
                      ? "mine"
                      : "theirs"
                  }"
                >
                  ${escapeHTML(message.text)}
                </div>

              `
            ).join("")
          : `
            <div class="chat-empty">
              👋 Inicia la conversación.
            </div>
          `
      }

    </div>


    <form
      class="chat-form"
      onsubmit="sendChatMessage(event,'${chatId}','${otherId}','${otherName}')"
    >

      <input
        id="chatInput"
        placeholder="Escribe un mensaje..."
        autocomplete="off"
      >

      <button>
        ➤
      </button>

    </form>


    <button
      class="claim-chat-btn"
      onclick="openReportFromChat('${chatId}','${otherId}')"
    >
      🚨 Reclamar
    </button>

  `);


  setTimeout(() => {

    const box =
      $("chatMessages");

    if (box) {
      box.scrollTop =
        box.scrollHeight;
    }

  }, 50);

}


function sendChatMessage(
  event,
  chatId,
  receiverId,
  receiverName
) {

  event.preventDefault();


  const input =
    $("chatInput");

  const text =
    input?.value.trim();


  if (!text) return;


  chats.push({

    id:
      "msg_" + Date.now(),

    chatId,

    senderId:
      currentUser.id,

    receiverId,

    receiverName,

    text,

    createdAt:
      new Date().toISOString(),

    read:
      false

  });


  saveAll();

  input.value = "";

  renderChat(
    chatId,
    receiverId,
    receiverName
  );

}


/* =========================================================
   CONTACTO EXTERNO
   ========================================================= */

function contactWhatsApp(name) {

  showToast(
    `WhatsApp preparado para contactar a ${name}.`
  );

}


function contactMessenger(name) {

  showToast(
    `Messenger preparado para contactar a ${name}.`
  );

}


/* =========================================================
   COMPRADO / VENDIDO
   ========================================================= */

function markPurchased(productId) {

  const product =
    products.find(
      item => item.id === productId
    );


  if (!product) return;


  product.purchased = true;


  showToast(
    "Has marcado el artículo como comprado."
  );


  saveAll();


  openSellerConfirmation(productId);
}


function openSellerConfirmation(productId) {

  const product =
    products.find(
      item => item.id === productId
    );


  if (!product) return;


  openModal(`

    <div class="confirmation-box">

      <div class="big-icon">
        🛒
      </div>

      <h2>
        Compra registrada
      </h2>

      <p>
        El comprador ha marcado este artículo como comprado.
      </p>

      <p>
        El vendedor debe confirmar la venta.
      </p>

      <button
        class="primary-btn"
        onclick="markSold('${productId}')"
      >
        ✅ Confirmar como vendido
      </button>

      <button
        class="secondary-btn"
        onclick="closeModal()"
      >
        Todavía no
      </button>

    </div>

  `);

}


function markSold(productId) {

  const product =
    products.find(
      item => item.id === productId
    );


  if (!product) return;


  product.sold = true;

  product.status = "sold";


  if (
    product.purchased &&
    product.sold
  ) {

    product.status =
      "completed";

    statistics.sales++;

    statistics.purchases++;

    advertisements =
      advertisements.filter(
        ad =>
          ad.productId !== productId
      );

  }


  saveAll();


  showToast(
    "Venta confirmada. La publicación fue retirada."
  );


  closeModal();

  renderProducts();

}


/* =========================================================
   RECLAMOS
   ========================================================= */

function openReport(productId) {

  openModal(`

    <div class="modal-header">

      <h2>
        🚨 Crear reclamo
      </h2>

      <button
        class="close-btn"
        onclick="closeModal()"
      >
        ×
      </button>

    </div>


    <form
      class="form"
      onsubmit="submitReport(event,'${productId}')"
    >

      <label>
        Motivo del reclamo

        <textarea
          id="reportReason"
          required
          placeholder="Explica detalladamente lo ocurrido..."
        ></textarea>

      </label>


      <label>
        📸 Captura o prueba

        <input
          id="reportEvidence"
          type="file"
          accept="image/*,video/*"
        >

      </label>


      <button class="danger-btn">
        🚨 Enviar reclamo
      </button>

    </form>

  `);
}


function openReportFromChat(
  chatId,
  otherId
) {

  openModal(`

    <div class="modal-header">

      <h2>
        🚨 Reclamo del chat
      </h2>

      <button
        class="close-btn"
        onclick="closeModal()"
      >
        ×
      </button>

    </div>


    <form
      class="form"
      onsubmit="submitChatReport(event,'${chatId}','${otherId}')"
    >

      <textarea
        id="chatReportReason"
        required
        placeholder="Explica el problema..."
      ></textarea>


      <input
        id="chatReportEvidence"
        type="file"
        accept="image/*,video/*"
      >


      <button class="danger-btn">
        📤 Enviar reclamo al administrador
      </button>

    </form>

  `);
}


async function submitReport(
  event,
  productId
) {

  event.preventDefault();


  const reason =
    $("reportReason").value.trim();

  const file =
    $("reportEvidence")?.files?.[0];


  let evidence = "";


  if (file) {
    evidence =
      await saveFileData(file);
  }


  reports.push({

    id:
      "report_" + Date.now(),

    type:
      "product",

    productId,

    userId:
      currentUser.id,

    userName:
      currentUser.name,

    reason,

    evidence,

    status:
      "pending",

    createdAt:
      new Date().toISOString()

  });


  saveAll();


  addAdminNotification(
    `🚨 Nuevo reclamo de ${currentUser.name}`
  );


  showToast(
    "Reclamo enviado al administrador."
  );


  closeModal();

}


async function submitChatReport(
  event,
  chatId,
  otherId
) {

  event.preventDefault();


  const reason =
    $("chatReportReason")
      .value
      .trim();

  const file =
    $("chatReportEvidence")
      ?.files?.[0];


  let evidence = "";

  if (file) {
    evidence =
      await saveFileData(file);
  }


  reports.push({

    id:
      "report_" + Date.now(),

    type:
      "chat",

    chatId,

    otherId,

    userId:
      currentUser.id,

    userName:
      currentUser.name,

    reason,

    evidence,

    status:
      "pending",

    createdAt:
      new Date().toISOString()

  });


  saveAll();


  addAdminNotification(
    `🚨 Reclamo recibido en el chat de ${currentUser.name}`
  );


  showToast(
    "El reclamo fue enviado."
  );


  closeModal();

}


/* =========================================================
   NOTIFICACIONES
   ========================================================= */

function addAdminNotification(message) {

  notificationsList.unshift({

    id:
      "notification_" + Date.now(),

    message,

    admin:
      true,

    read:
      false,

    createdAt:
      new Date().toISOString()

  });


  saveAll();

  updateNotificationBadges();

}


function updateNotificationBadges() {

  const unread =
    notificationsList.filter(
      notification =>
        !notification.read
    ).length;


  const badge =
    $("notifyBadge");


  if (badge) {

    badge.textContent =
      unread;

    badge.classList.toggle(
      "hidden",
      unread === 0
    );

  }

}


/* =========================================================
   ADMINISTRADOR
   ========================================================= */

const DEFAULT_ADMIN_PASSWORD =
  "MarketFlashAdmin";


function getAdminPassword() {

  return (
    localStorage.getItem(
      MF.adminKey
    ) ||
    DEFAULT_ADMIN_PASSWORD
  );

}


function openAdmin() {

  openModal(`

    <div class="modal-header">

      <h2>
        👑 Administración
      </h2>

      <button
        class="close-btn"
        onclick="closeModal()"
      >
        ×
      </button>

    </div>


    <form
      class="form"
      onsubmit="adminLogin(event)"
    >

      <label>
        Contraseña de administrador

        <input
          id="adminPassword"
          type="password"
          required
        >

      </label>


      <button class="primary-btn">
        🔐 Entrar al panel
      </button>

    </form>

  `);
}


function adminLogin(event) {

  event.preventDefault();


  const password =
    $("adminPassword").value;


  if (
    password === getAdminPassword()
  ) {

    openAdminPanel();

  } else {

    showToast(
      "Contraseña de administrador incorrecta."
    );

  }

}


/* =========================================================
   PANEL ADMINISTRADOR
   ========================================================= */

function openAdminPanel() {

  const pendingAds =
    advertisements.filter(
      ad => ad.status === "pending"
    );

  const pendingReports =
    reports.filter(
      report => report.status === "pending"
    );

  const unread =
    notificationsList.filter(
      item =>
        item.admin &&
        !item.read
    ).length;


  openModal(`

    <div class="admin-panel">

      <div class="admin-header">

        <div>

          <span>
            PANEL DE ADMINISTRADOR
          </span>

          <h2>
            Market Flash 👑
          </h2>

        </div>

        <button
          class="close-btn"
          onclick="closeModal()"
        >
          ×
        </button>

      </div>


      ${
        unread
          ? `
            <button
              class="admin-alert"
              onclick="openAdminNotifications()"
            >
              🚨 Tienes ${unread}
              mensaje${
                unread === 1
                  ? ""
                  : "s"
              } pendiente${
                unread === 1
                  ? ""
                  : "s"
              }
            </button>
          `
          : ""
      }


      <div class="admin-stats">

        <div>
          <b>
            ${statistics.registered}
          </b>
          <span>
            Registrados
          </span>
        </div>

        <div>
          <b>
            ${statistics.deleted}
          </b>
          <span>
            Eliminados
          </span>
        </div>

        <div>
          <b>
            ${products.length}
          </b>
          <span>
            Publicaciones
          </span>
        </div>

        <div>
          <b>
            ${pendingAds.length}
          </b>
          <span>
            Pagos pendientes
          </span>
        </div>

      </div>


      <div class="admin-menu">

        <button onclick="openAdminAdvertising()">
          📣 Publicidades
          <span>${pendingAds.length}</span>
        </button>

        <button onclick="openAdminReports()">
          🚨 Reclamos
          <span>${pendingReports.length}</span>
        </button>

        <button onclick="openAdminUsers()">
          👥 Usuarios
        </button>

        <button onclick="openAdminRanking()">
          🏆 Ranking
        </button>

        <button onclick="openAdminSanctions()">
          ⚠️ Sanciones y multas
        </button>

        <button onclick="openAdminPayments()">
          💳 Métodos y precios
        </button>

        <button onclick="openAdminSettings()">
          ⚙️ Configuración del panel
        </button>

        <button onclick="changeAdminPassword()">
          🔐 Cambiar contraseña
        </button>

      </div>

    </div>

  `);

}


/* =========================================================
   PUBLICIDADES ADMIN
   ========================================================= */

function openAdminAdvertising() {

  const pending =
    advertisements.filter(
      ad => ad.status === "pending"
    );


  openModal(`

    <div class="modal-header">

      <h2>
        📣 Publicidades pendientes
      </h2>

      <button
        class="close-btn"
        onclick="openAdminPanel()"
      >
        ×
      </button>

    </div>


    ${
      pending.length
        ? pending.map(
            ad => `

              <div class="admin-ad-card">

                <strong>
                  ${escapeHTML(ad.title)}
                </strong>

                <p>
                  Usuario:
                  ${escapeHTML(ad.userName)}
                </p>

                <p>
                  Plan:
                  ${escapeHTML(
                    appConfig.plans[ad.plan].name
                  )}
                </p>

                <p>
                  Método:
                  ${escapeHTML(
                    appConfig.payments[
                      ad.paymentMethod
                    ]?.name ||
                    ad.paymentMethod
                  )}
                </p>


                ${
                  ad.type === "video"
                    ? `
                      <video
                        class="admin-proof-media"
                        src="${escapeHTML(ad.media)}"
                        controls
                      ></video>
                    `
                    : `
                      <img
                        class="admin-proof-media"
                        src="${escapeHTML(ad.media)}"
                      >
                    `
                }


                <h4>
                  Comprobante de pago
                </h4>


                <img
                  class="admin-proof-media"
                  src="${escapeHTML(ad.paymentProof)}"
                >


                <div class="admin-actions">

                  <button
                    class="approve-btn"
                    onclick="approveAdvertisement('${ad.id}')"
                  >
                    ✅ Aprobar
                  </button>

                  <button
                    class="reject-btn"
                    onclick="rejectAdvertisement('${ad.id}')"
                  >
                    ❌ Rechazar
                  </button>

                </div>

              </div>

            `
          ).join("")
        : `
          <div class="empty-state">
            <div class="empty-icon">📭</div>
            <h3>No hay pagos pendientes</h3>
          </div>
        `
    }

  `);

}


function approveAdvertisement(id) {

  const ad =
    advertisements.find(
      item => item.id === id
    );


  if (!ad) return;


  ad.status =
    "approved";

  ad.active =
    true;

  ad.approvedAt =
    new Date().toISOString();


  saveAll();


  showToast(
    "Publicidad aprobada y publicada en Flash del Día."
  );


  openAdminAdvertising();

}


function rejectAdvertisement(id) {

  const ad =
    advertisements.find(
      item => item.id === id
    );


  if (!ad) return;


  ad.status =
    "rejected";

  ad.active =
    false;


  saveAll();


  showToast(
    "Publicidad rechazada."
  );


  openAdminAdvertising();

}


/* =========================================================
   RECLAMOS ADMIN
   ========================================================= */

function openAdminReports() {

  openModal(`

    <div class="modal-header">

      <h2>
        🚨 Reclamos
      </h2>

      <button
        class="close-btn"
        onclick="openAdminPanel()"
      >
        ×
      </button>

    </div>


    ${
      reports.length
        ? reports.map(
            report => `

              <div class="report-card">

                <strong>
                  🚨 Reclamo
                </strong>

                <p>
                  Usuario:
                  ${escapeHTML(report.userName)}
                </p>

                <p>
                  ${escapeHTML(report.reason)}
                </p>


                ${
                  report.evidence
                    ? `
                      <img
                        class="admin-proof-media"
                        src="${escapeHTML(report.evidence)}"
                      >
                    `
                    : ""
                }


                <div class="admin-actions">

                  <button
                    onclick="resolveReport('${report.id}')"
                  >
                    ✅ Resolver
                  </button>

                  <button
                    class="danger-btn"
                    onclick="openSanctionForReport('${report.id}')"
                  >
                    ⚠️ Sancionar
                  </button>

                </div>

              </div>

            `
          ).join("")
        : `
          <div class="empty-state">
            <div class="empty-icon">✅</div>
            <h3>No hay reclamos</h3>
          </div>
        `
    }

  `);

}


function resolveReport(id) {

  const report =
    reports.find(
      item => item.id === id
    );


  if (!report) return;


  report.status =
    "resolved";


  saveAll();

  showToast(
    "Reclamo marcado como resuelto."
  );

  openAdminReports();

}


/* =========================================================
   SANCIONES / MULTAS
   ========================================================= */

function openSanctionForReport(reportId) {

  const report =
    reports.find(
      item => item.id === reportId
    );


  if (!report) return;


  openModal(`

    <div class="modal-header">

      <h2>
        ⚠️ Aplicar sanción
      </h2>

      <button
        class="close-btn"
        onclick="openAdminReports()"
      >
        ×
      </button>

    </div>


    <form
      class="form"
      onsubmit="submitSanction(event,'${report.userId}','${reportId}')"
    >

      <label>
        Tipo de sanción

        <select id="sanctionType">

          <option value="warning">
            Advertencia
          </option>

          <option value="block">
            Bloqueo
          </option>

          <option value="temporary">
            Bloqueo temporal
          </option>

          <option value="fine">
            Multa
          </option>

          <option value="delete">
            Eliminación de cuenta
          </option>

        </select>

      </label>


      <label>
        Días de bloqueo

        <input
          id="sanctionDays"
          type="number"
          min="1"
          value="7"
        >

      </label>


      <label>
        Monto de multa

        <input
          id="fineAmount"
          type="number"
          min="0"
          placeholder="0"
        >

      </label>


      <label>
        Motivo

        <textarea
          id="sanctionReason"
          required
        ></textarea>

      </label>


      <button class="danger-btn">
        ⚠️ Aplicar sanción
      </button>

    </form>

  `);

}


function submitSanction(
  event,
  userId,
  reportId
) {

  event.preventDefault();


  const type =
    $("sanctionType").value;

  const days =
    Number($("sanctionDays").value);

  const fine =
    Number($("fineAmount").value) || 0;

  const reason =
    $("sanctionReason").value.trim();


  sanctions.push({

    id:
      "sanction_" + Date.now(),

    userId,

    reportId,

    type,

    days,

    fine,

    reason,

    createdAt:
      new Date().toISOString()

  });


  const report =
    reports.find(
      item => item.id === reportId
    );


  if (report) {
    report.status =
      "resolved";
  }


  saveAll();


  showToast(
    "Sanción registrada."
  );


  openAdminReports();

}


/* =========================================================
   USUARIOS
   ========================================================= */

function openAdminUsers() {

  openModal(`

    <div class="modal-header">

      <h2>
        👥 Usuarios
      </h2>

      <button
        class="close-btn"
        onclick="openAdminPanel()"
      >
        ×
      </button>

    </div>


    <div class="admin-user-summary">

      <div>
        <b>
          ${statistics.registered}
        </b>

        <span>
          Personas registradas
        </span>
      </div>


      <div>
        <b>
          ${statistics.deleted}
        </b>

        <span>
          Cuentas eliminadas
        </span>
      </div>

    </div>


    ${
      currentUser
        ? `
          <div class="admin-user-card">

            <strong>
              ${escapeHTML(currentUser.name)}
            </strong>

            <p>
              Cédula:
              ${escapeHTML(currentUser.cedula)}
            </p>

            <p>
              Teléfono:
              ${escapeHTML(currentUser.phone)}
            </p>

            <p>
              Ventas:
              ${currentUser.sales || 0}
            </p>

            <p>
              Ranking:
              ⭐ ${currentUser.rating || 5}
            </p>

          </div>
        `
        : ""
    }

  `);

}


/* =========================================================
   RANKING
   ========================================================= */

function openAdminRanking() {

  const ranking =
    [...products]
      .sort(
        (a,b) =>
          Number(b.sales || 0) -
          Number(a.sales || 0)
      )
      .slice(0,10);


  openModal(`

    <div class="modal-header">

      <h2>
        🏆 Ranking de vendedores
      </h2>

      <button
        class="close-btn"
        onclick="openAdminPanel()"
      >
        ×
      </button>

    </div>


    <div class="ranking-list">

      ${ranking.map(
        (product,index) => `

          <div class="ranking-item">

            <strong>
              #${index + 1}
            </strong>

            <span>
              ${escapeHTML(product.seller)}
            </span>

            <b>
              ${product.sales || 0} ventas
            </b>

          </div>

        `
      ).join("")}

    </div>

  `);

}


/* =========================================================
   MÉTODOS DE PAGO Y PRECIOS
   ========================================================= */

function openAdminPayments() {

  openModal(`

    <div class="modal-header">

      <h2>
        💳 Pagos y precios
      </h2>

      <button
        class="close-btn"
        onclick="openAdminPanel()"
      >
        ×
      </button>

    </div>


    <form
      class="form"
      onsubmit="saveAdminPayments(event)"
    >

      ${Object.entries(
        appConfig.payments
      ).map(
        ([key,payment]) => `

          <div class="payment-admin-card">

            <h3>
              ${escapeHTML(payment.name)}
            </h3>

            <label>
              Cuenta / dirección

              <input
                id="account_${key}"
                value="${escapeHTML(payment.account)}"
              >

            </label>


            <label>
              Titular

              <input
                id="owner_${key}"
                value="${escapeHTML(payment.owner)}"
              >

            </label>

          </div>

        `
      ).join("")}


      <h3>
        Planes de publicidad
      </h3>


      ${Object.entries(
        appConfig.plans
      ).map(
        ([key,plan]) => `

          <div class="payment-admin-card">

            <h3>
              ${escapeHTML(plan.name)}
            </h3>

            <label>
              Precio

              <input
                id="price_${key}"
                type="number"
                value="${plan.price}"
              >

            </label>


            <label>
              Duración en días

              <input
                id="duration_${key}"
                type="number"
                value="${plan.duration}"
              >

            </label>

          </div>

        `
      ).join("")}


      <button class="primary-btn">
        💾 Guardar configuración
      </button>

    </form>

  `);

}


function saveAdminPayments(event) {

  event.preventDefault();


  Object.keys(
    appConfig.payments
  ).forEach(key => {

    appConfig.payments[key].account =
      $(`account_${key}`).value;

    appConfig.payments[key].owner =
      $(`owner_${key}`).value;

  });


  Object.keys(
    appConfig.plans
  ).forEach(key => {

    appConfig.plans[key].price =
      Number(
        $(`price_${key}`).value
      );

    appConfig.plans[key].duration =
      Number(
        $(`duration_${key}`).value
      );

  });


  saveAll();

  showToast(
    "Precios y métodos de pago actualizados."
  );

  openAdminPanel();

}


/* =========================================================
   CONFIGURACIÓN DEL PANEL
   ========================================================= */

function openAdminSettings() {

  openModal(`

    <div class="modal-header">

      <h2>
        ⚙️ Configuración del panel
      </h2>

      <button
        class="close-btn"
        onclick="openAdminPanel()"
      >
        ×
      </button>

    </div>


    <div class="admin-settings">

      <label class="switch-row">

        <span>
          Flash del Día
        </span>

        <input
          id="adminFlashToggle"
          type="checkbox"
          ${
            appConfig.flashDayEnabled
              ? "checked"
              : ""
          }
        >

      </label>


      <label class="switch-row">

        <span>
          Publicidad activada
        </span>

        <input
          id="adminAdsToggle"
          type="checkbox"
          ${
            appConfig.advertisingEnabled
              ? "checked"
              : ""
          }
        >

      </label>


      <label>
        Nombre de la aplicación

        <input
          id="adminAppName"
          value="${escapeHTML(appConfig.appName)}"
        >

      </label>


      <button
        class="primary-btn"
        onclick="saveAdminSettings()"
      >
        💾 Guardar
      </button>

    </div>

  `);

}


function saveAdminSettings() {

  appConfig.flashDayEnabled =
    $("adminFlashToggle").checked;

  appConfig.advertisingEnabled =
    $("adminAdsToggle").checked;

  appConfig.appName =
    $("adminAppName").value.trim() ||
    "Market Flash";


  saveAll();

  showToast(
    "Configuración guardada."
  );

  closeModal();

}


/* =========================================================
   CAMBIAR CONTRASEÑA ADMIN
   ========================================================= */

function changeAdminPassword() {

  openModal(`

    <div class="modal-header">

      <h2>
        🔐 Cambiar contraseña
      </h2>

      <button
        class="close-btn"
        onclick="openAdminPanel()"
      >
        ×
      </button>

    </div>


    <form
      class="form"
      onsubmit="saveAdminPassword(event)"
    >

      <label>
        Contraseña actual

        <input
          id="oldAdminPassword"
          type="password"
          required
        >

      </label>


      <label>
        Nueva contraseña

        <input
          id="newAdminPassword"
          type="password"
          minlength="6"
          required
        >

      </label>


      <label>
        Confirmar nueva contraseña

        <input
          id="confirmAdminPassword"
          type="password"
          minlength="6"
          required
        >

      </label>


      <button class="primary-btn">
        🔐 Cambiar contraseña
      </button>

    </form>

  `);

}


function saveAdminPassword(event) {

  event.preventDefault();


  const oldPassword =
    $("oldAdminPassword").value;

  const newPassword =
    $("newAdminPassword").value;

  const confirmPassword =
    $("confirmAdminPassword").value;


  if (
    oldPassword !==
    getAdminPassword()
  ) {

    showToast(
      "La contraseña actual no coincide."
    );

    return;
  }


  if (
    newPassword !==
    confirmPassword
  ) {

    showToast(
      "Las nuevas contraseñas no coinciden."
    );

    return;
  }


  localStorage.setItem(
    MF.adminKey,
    newPassword
  );


  showToast(
    "Contraseña cambiada correctamente."
  );


  openAdminPanel();

}


/* =========================================================
   NOTIFICACIONES ADMIN
   ========================================================= */

function openAdminNotifications() {

  notificationsList
    .filter(
      notification =>
        notification.admin
    )
    .forEach(
      notification =>
        notification.read = true
    );


  saveAll();


  openModal(`

    <div class="modal-header">

      <h2>
        🔔 Mensajes del administrador
      </h2>

      <button
        class="close-btn"
        onclick="openAdminPanel()"
      >
        ×
      </button>

    </div>


    ${
      notificationsList.length
        ? notificationsList.map(
            notification => `

              <div class="notification-card">

                ${escapeHTML(
                  notification.message
                )}

              </div>

            `
          ).join("")
        : `
          <div class="empty-state">
            No hay mensajes.
          </div>
        `
    }

  `);

}


/* =========================================================
   NORMAS
   ========================================================= */

function openRules() {

  openModal(`

    <div class="modal-header">

      <h2>
        📜 Normas de Market Flash
      </h2>

      <button
        class="close-btn"
        onclick="closeModal()"
      >
        ×
      </button>

    </div>


    <div class="rules">

      <p>
        1. Publica información verdadera sobre tus productos.
      </p>

      <p>
        2. No publiques contenido ilegal.
      </p>

      <p>
        3. No engañes a compradores o vendedores.
      </p>

      <p>
        4. Respeta a los demás usuarios.
      </p>

      <p>
        5. Los reclamos serán revisados por administración.
      </p>

      <p>
        6. Las infracciones pueden generar advertencias,
        bloqueos, multas o eliminación de la cuenta,
        según las reglas establecidas.
      </p>

    </div>

  `);

}


/* =========================================================
   ELIMINAR CUENTA
   ========================================================= */

function confirmDeleteAccount() {

  openModal(`

    <div class="confirmation-box">

      <div class="big-icon">
        ⚠️
      </div>

      <h2>
        ¿Eliminar tu cuenta?
      </h2>

      <p>
        Esta acción eliminará tu cuenta de este dispositivo.
      </p>

      <button
        class="danger-btn"
        onclick="deleteAccount()"
      >
        🗑 Sí, eliminar mi cuenta
      </button>

      <button
        class="secondary-btn"
        onclick="closeModal()"
      >
        Cancelar
      </button>

    </div>

  `);

}


function deleteAccount() {

  statistics.deleted++;

  currentUser = null;

  localStorage.removeItem(
    MF.userKey
  );

  saveAll();

  showToast(
    "Tu cuenta ha sido eliminada."
  );

  closeModal();

  updateUI();

}


/* =========================================================
   SESIÓN
   ========================================================= */

function logout() {

  currentUser = null;

  localStorage.removeItem(
    MF.userKey
  );

  closeModal();

  updateUI();

  showToast(
    "Sesión cerrada."
  );

}


/* =========================================================
   ACTIVIDAD DE LA BARRA
   ========================================================= */

function openActivity() {

  if (!currentUser) {

    loginRequired();

    return;
  }


  openMyActivity();
}


/* =========================================================
   LOGIN NECESARIO
   ========================================================= */

function loginRequired(message) {

  openModal(`

    <div class="confirmation-box">

      <div class="big-icon">
        👤
      </div>

      <h2>
        Inicia sesión
      </h2>

      <p>
        ${
          escapeHTML(
            message ||
            "Necesitas una cuenta para utilizar esta función."
          )
        }
      </p>


      <button
        class="primary-btn"
        onclick="openRegister()"
      >
        📝 Crear cuenta
      </button>


      <button
        class="secondary-btn"
        onclick="openLogin()"
      >
        🔐 Iniciar sesión
      </button>

    </div>

  `);

}


/* =========================================================
   NAVEGACIÓN
   ========================================================= */

function setActiveNav(page) {

  document
    .querySelectorAll(".nav-item")
    .forEach(
      item =>
        item.classList.remove("active")
    );


  const target =
    document.querySelector(
      `.nav-item[data-page="${page}"]`
    );


  target?.classList.add("active");

}


function goHome() {

  closeModal();

  setActiveNav("home");

  renderProducts();

}


/* =========================================================
   BOTÓN +
   ========================================================= */

function openPublishMenu() {

  if (!currentUser) {

    loginRequired(
      "Crea una cuenta para publicar."
    );

    return;
  }


  openModal(`

    <div class="publish-menu">

      <div class="big-icon">
        ＋
      </div>

      <h2>
        ¿Qué quieres publicar?
      </h2>


      <button
        class="publish-option"
        onclick="openNormalPublish()"
      >
        🛍 Publicar producto
      </button>


      <button
        class="publish-option"
        onclick="openAdvertising()"
      >
        ⚡ Publicación Flash del Día
      </button>

    </div>

  `);

}


/* =========================================================
   PUBLICACIÓN NORMAL
   ========================================================= */

function openNormalPublish() {

  openModal(`

    <div class="modal-header">

      <h2>
        🛍 Publicar producto
      </h2>

      <button
        class="close-btn"
        onclick="closeModal()"
      >
        ×
      </button>

    </div>


    <form
      class="form"
      onsubmit="createProduct(event)"
    >

      <label>
        📷 Foto del producto

        <input
          id="productImage"
          type="file"
          accept="image/*"
          required
        >

      </label>


      <label>
        Nombre

        <input
          id="productName"
          required
        >

      </label>


      <label>
        Categoría

        <select id="productCategory">

          ${categories
            .filter(
              c => c !== "Todos"
            )
            .map(
              c =>
                `<option>${escapeHTML(c)}</option>`
            )
            .join("")}

        </select>

      </label>


      <label>
        Precio

        <input
          id="productPrice"
          type="number"
          min="0"
          required
        >

      </label>


      <label>
        Ubicación

        <input
          id="productLocation"
          placeholder="Ej.: Santo Domingo Este"
          required
        >

      </label>


      <label>
        Descripción

        <textarea
          id="productDescription"
          required
        ></textarea>

      </label>


      <button class="primary-btn">
        🚀 Publicar
      </button>

    </form>

  `);

}


async function createProduct(event) {

  event.preventDefault();


  const file =
    $("productImage")
      ?.files?.[0];


  if (!file) return;


  const image =
    await saveFileData(file);


  const product = {

    id:
      "p_" + Date.now(),

    name:
      $("productName").value.trim(),

    category:
      $("productCategory").value,

    price:
      Number(
        $("productPrice").value
      ),

    location:
      $("productLocation").value.trim(),

    description:
      $("productDescription").value.trim(),

    seller:
      currentUser.name,

    sellerId:
      currentUser.id,

    image,

    views:
      0,

    likes:
      0,

    rating:
      currentUser.rating || 5,

    sales:
      currentUser.sales || 0,

    status:
      "active",

    sold:
      false,

    purchased:
      false

  };


  products.unshift(product);

  saveAll();

  closeModal();

  renderProducts();

  showToast(
    "Publicación creada correctamente."
  );

}


/* =========================================================
   ACTUALIZAR INTERFAZ
   ========================================================= */

function updateUI() {

  updateNotificationBadges();

  renderProducts();

}


/* =========================================================
   EVENTOS PRINCIPALES
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    createDemoProducts();

    renderCategories();

    renderProducts();

    renderFlashDay();

    updateNotificationBadges();


    $("searchInput")
      ?.addEventListener(
        "input",
        () => {

          const active =
            document.querySelector(
              ".chip.active"
            );

          renderProducts(
            active?.dataset.category ||
            "Todos"
          );

        }
      );


    $("publishBtn")
      ?.addEventListener(
        "click",
        event => {

          buttonFeedback(
            event.currentTarget
          );

          openPublishMenu();

        }
      );


    $("flashDayBtn")
      ?.addEventListener(
        "click",
        event => {

          buttonFeedback(
            event.currentTarget
          );

          openAdvertising();

        }
      );


    $("notifyBtn")
      ?.addEventListener(
        "click",
        event => {

          buttonFeedback(
            event.currentTarget
          );

          if (currentUser) {
            openAdminNotifications();
          } else {
            showToast(
              "No tienes notificaciones nuevas."
            );
          }

        }
      );


    document
      .querySelectorAll(".nav-item")
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            const page =
              button.dataset.page;

            buttonFeedback(button);

            setActiveNav(page);


            if (page === "home") {
              goHome();
            }

            if (page === "chat") {

              if (!currentUser) {
                loginRequired();
              } else {
                showToast(
                  "Selecciona una publicación para iniciar un chat."
                );
              }

            }

            if (page === "activity") {
              openActivity();
            }

            if (page === "profile") {
              openProfile();
            }

          }
        );

      });

  }
);


/* =========================================================
   FUNCIONES COMPATIBLES CON EL INDEX
   ========================================================= */

window.openAdvertising =
  openAdvertising;

window.openPublish =
  openPublishMenu;

window.openProfile =
  openProfile;

window.openActivity =
  openActivity;

window.home =
  goHome;

window.closeModal =
  closeModal;

window.openProduct =
  openProduct;

window.openChat =
  openChat;

window.openReport =
  openReport;

window.markPurchased =
  markPurchased;

window.markSold =
  markSold;

window.openAdmin =
  openAdmin;

window.openRegister =
  openRegister;

window.openLogin =
  openLogin;

window.settings =
  openSettings;

window.admin =
  openAdmin;

window.notifications =
  () => openAdminNotifications();
