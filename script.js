/* =========================================================
   MARKET FLASH — SCRIPT.JS
   Versión base funcional
========================================================= */

"use strict";

/* =========================================================
   ESTADO DE LA APLICACIÓN
========================================================= */

const MF = {
  storageKey: "marketFlashData",

  data: {
    user: {
      name: "Usuario",
      phone: "",
      cedula: "",
      messenger: "",
      whatsapp: "",
      avatar: "",
      password: ""
    },

    products: [],

    conversations: [],

    contacts: [],

    activity: [],

    ads: [],

    settings: {
      appColor: "#1677ff",
      chatStyle: "normal",
      chatBackground: "",
      chatCustomImage: ""
    },

    admin: {
      enabled: false,
      administrators: []
    }
  }
};


/* =========================================================
   REFERENCIAS HTML
========================================================= */

const $ = (id) => document.getElementById(id);

const modal = $("modal");
const modalCard = $("modalCard");
const toast = $("toast");

const pages = {
  home: $("homePage"),
  chat: $("chatPage"),
  activity: $("activityPage"),
  profile: $("profilePage")
};


/* =========================================================
   UTILIDADES
========================================================= */

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function createId(prefix = "mf") {
  return (
    prefix +
    "_" +
    Date.now() +
    "_" +
    Math.random().toString(36).slice(2, 9)
  );
}


function saveData() {
  localStorage.setItem(
    MF.storageKey,
    JSON.stringify(MF.data)
  );
}


function loadData() {
  try {
    const saved = localStorage.getItem(MF.storageKey);

    if (!saved) {
      saveData();
      return;
    }

    const parsed = JSON.parse(saved);

    if (parsed && typeof parsed === "object") {
      MF.data = {
        ...MF.data,
        ...parsed,
        user: {
          ...MF.data.user,
          ...(parsed.user || {})
        },
        settings: {
          ...MF.data.settings,
          ...(parsed.settings || {})
        },
        admin: {
          ...MF.data.admin,
          ...(parsed.admin || {})
        }
      };
    }

  } catch (error) {
    console.error("Error cargando Market Flash:", error);
  }
}


function showToast(message) {
  if (!toast) return;

  toast.textContent = message;
  toast.classList.remove("hidden");

  clearTimeout(window.mfToastTimer);

  window.mfToastTimer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 2600);
}


/* =========================================================
   MODAL
========================================================= */

function openModal(content) {
  if (!modal || !modalCard) return;

  modalCard.innerHTML = content;
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");

  document.body.classList.add("modal-open");
}


function closeModal() {
  if (!modal || !modalCard) return;

  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
  modalCard.innerHTML = "";

  document.body.classList.remove("modal-open");
}


if (modal) {
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });
}


document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal();
  }
});


/* =========================================================
   NAVEGACIÓN
========================================================= */

function showPage(pageName) {

  Object.values(pages).forEach((page) => {
    if (page) {
      page.classList.add("hidden");
    }
  });

  if (pages[pageName]) {
    pages[pageName].classList.remove("hidden");
  }

  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.page === pageName
    );
  });

  if (pageName === "home") {
    renderProducts();
  }

  if (pageName === "chat") {
    renderChat();
  }

  if (pageName === "activity") {
    renderActivity();
  }

  if (pageName === "profile") {
    renderProfile();
  }
}


document.querySelectorAll(".nav-item").forEach((button) => {

  button.addEventListener("click", () => {

    const page = button.dataset.page;

    if (page) {
      showPage(page);
    }

  });

});


/* =========================================================
   PRODUCTOS DE EJEMPLO
========================================================= */

function createDemoProducts() {

  if (MF.data.products.length > 0) {
    return;
  }

  MF.data.products = [
    {
      id: createId("product"),
      title: "Publicación de ejemplo",
      description: "Aquí aparecerán las publicaciones de los usuarios.",
      price: 0,
      category: "Todos",
      seller: "Usuario",
      sellerId: "demo",
      image: "",
      whatsapp: "",
      messenger: "",
      views: 0,
      likes: 0,
      dislikes: 0,
      createdAt: Date.now()
    }
  ];

  saveData();
}


/* =========================================================
   CATEGORÍAS
========================================================= */

const categories = [
  "Todos",
  "Tecnología",
  "Teléfonos",
  "Vehículos",
  "Hogar",
  "Ropa",
  "Servicios",
  "Otros"
];


function renderCategories() {

  const row = $("categoryRow");

  if (!row) return;

  row.innerHTML = "";

  categories.forEach((category, index) => {

    const button = document.createElement("button");

    button.type = "button";
    button.className = "chip";

    if (index === 0) {
      button.classList.add("active");
    }

    button.textContent = category;

    button.addEventListener("click", () => {

      document
        .querySelectorAll("#categoryRow .chip")
        .forEach((chip) => chip.classList.remove("active"));

      button.classList.add("active");

      renderProducts(category);

    });

    row.appendChild(button);

  });
}


/* =========================================================
   PRODUCTOS
========================================================= */

let currentCategory = "Todos";


function renderProducts(category = currentCategory) {

  currentCategory = category;

  const grid = $("productsGrid");

  if (!grid) return;

  let products = [...MF.data.products];

  if (category !== "Todos") {
    products = products.filter(
      product => product.category === category
    );
  }

  const searchInput = $("searchInput");

  const search = searchInput
    ? searchInput.value.trim().toLowerCase()
    : "";

  if (search) {
    products = products.filter(product => {

      return (
        String(product.title || "")
          .toLowerCase()
          .includes(search) ||

        String(product.description || "")
          .toLowerCase()
          .includes(search) ||

        String(product.category || "")
          .toLowerCase()
          .includes(search) ||

        String(product.seller || "")
          .toLowerCase()
          .includes(search)
      );

    });
  }

  const count = $("productCount");

  if (count) {
    count.textContent = `${products.length} publicación${products.length === 1 ? "" : "es"}`;
  }

  grid.innerHTML = "";

  if (products.length === 0) {

    grid.innerHTML = `
      <div class="page-card">
        <h3>No hay publicaciones</h3>
        <p>No encontramos publicaciones con esos criterios.</p>
      </div>
    `;

    return;
  }

  products.forEach(product => {

    const card = document.createElement("article");

    card.className = "product-card";

    card.innerHTML = `
      <div class="product-image">
        ${
          product.image
            ? `<img src="${escapeHTML(product.image)}" alt="${escapeHTML(product.title)}">`
            : `<span>📦</span>`
        }
      </div>

      <div class="product-body">

        <small>
          ${escapeHTML(product.category || "Otros")}
        </small>

        <h3>
          ${escapeHTML(product.title)}
        </h3>

        <p>
          ${escapeHTML(product.description || "")}
        </p>

        ${
          Number(product.price) > 0
            ? `<strong class="product-price">RD$ ${Number(product.price).toLocaleString("es-DO")}</strong>`
            : ""
        }

        <div class="product-meta">
          <span>👁️ ${Number(product.views || 0)}</span>
          <span>👍 ${Number(product.likes || 0)}</span>
          <span>👎 ${Number(product.dislikes || 0)}</span>
        </div>

      </div>
    `;

    card.addEventListener("click", () => {
      openProduct(product.id);
    });

    grid.appendChild(card);

  });
}


/* =========================================================
   VER PUBLICACIÓN
========================================================= */

function openProduct(productId) {

  const product = MF.data.products.find(
    item => item.id === productId
  );

  if (!product) return;

  product.views = Number(product.views || 0) + 1;

  addActivity(
    `Viste la publicación "${product.title}".`
  );

  saveData();

  openModal(`

    <div class="modal-header">

      <div>
        <small>PUBLICACIÓN</small>
        <h2>${escapeHTML(product.title)}</h2>
      </div>

      <button
        type="button"
        class="secondary-btn"
        data-close-modal
      >
        ✕
      </button>

    </div>

    <div class="product-detail">

      <div class="product-detail-image">

        ${
          product.image
            ? `<img src="${escapeHTML(product.image)}" alt="">`
            : `<div class="empty-product-image">📦</div>`
        }

      </div>

      <p>
        ${escapeHTML(product.description || "Sin descripción.")}
      </p>

      ${
        Number(product.price) > 0
          ? `<h3>RD$ ${Number(product.price).toLocaleString("es-DO")}</h3>`
          : ""
      }

      <p>
        Publicado por:
        <strong>${escapeHTML(product.seller || "Usuario")}</strong>
      </p>

      <div class="reaction-buttons">

        <button
          type="button"
          class="primary-btn"
          data-like="${product.id}"
        >
          👍 Me gusta
        </button>

        <button
          type="button"
          class="secondary-btn"
          data-dislike="${product.id}"
        >
          👎 No me gusta
        </button>

      </div>

      <div class="contact-options">

        <h3>Contactar</h3>

        <button
          type="button"
          class="primary-btn"
          data-platform-chat="${product.id}"
        >
          💬 Chat Market Flash
        </button>

        ${
          product.whatsapp
            ? `
              <button
                type="button"
                class="secondary-btn"
                data-whatsapp="${escapeHTML(product.whatsapp)}"
              >
                🟢 WhatsApp
              </button>
            `
            : ""
        }

        ${
          product.messenger
            ? `
              <button
                type="button"
                class="secondary-btn"
                data-messenger="${escapeHTML(product.messenger)}"
              >
                🔵 Messenger
              </button>
            `
            : ""
        }

      </div>

    </div>
  `);

  bindModalActions();
}


/* =========================================================
   ACCIONES DEL MODAL
========================================================= */

function bindModalActions() {

  document
    .querySelectorAll("[data-close-modal]")
    .forEach(button => {

      button.addEventListener("click", closeModal);

    });


  document
    .querySelectorAll("[data-like]")
    .forEach(button => {

      button.addEventListener("click", () => {

        const product = MF.data.products.find(
          item => item.id === button.dataset.like
        );

        if (!product) return;

        product.likes = Number(product.likes || 0) + 1;

        saveData();

        showToast("👍 Me gusta registrado");

        openProduct(product.id);

      });

    });


  document
    .querySelectorAll("[data-dislike]")
    .forEach(button => {

      button.addEventListener("click", () => {

        const product = MF.data.products.find(
          item => item.id === button.dataset.dislike
        );

        if (!product) return;

        product.dislikes = Number(product.dislikes || 0) + 1;

        saveData();

        showToast("👎 No me gusta registrado");

        openProduct(product.id);

      });

    });


  document
    .querySelectorAll("[data-platform-chat]")
    .forEach(button => {

      button.addEventListener("click", () => {

        const product = MF.data.products.find(
          item => item.id === button.dataset.platformChat
        );

        if (!product) return;

        startConversation(product);

      });

    });


  document
    .querySelectorAll("[data-whatsapp]")
    .forEach(button => {

      button.addEventListener("click", () => {

        const number = button.dataset.whatsapp
          .replace(/\D/g, "");

        if (!number) {
          showToast("Este usuario no tiene WhatsApp configurado.");
          return;
        }

        window.open(
          `https://wa.me/${number}`,
          "_blank",
          "noopener,noreferrer"
        );

      });

    });


  document
    .querySelectorAll("[data-messenger]")
    .forEach(button => {

      button.addEventListener("click", () => {

        const url = button.dataset.messenger;

        if (url) {
          window.open(
            url,
            "_blank",
            "noopener,noreferrer"
          );
        }

      });

    });

}


/* =========================================================
   PUBLICAR
========================================================= */

const publishBtn = $("publishBtn");

if (publishBtn) {

  publishBtn.addEventListener("click", () => {

    openPublishModal();

  });

}


function openPublishModal() {

  openModal(`

    <div class="modal-header">

      <div>
        <small>MARKET FLASH</small>
        <h2>Publicar producto</h2>
      </div>

      <button
        type="button"
        class="secondary-btn"
        data-close-modal
      >
        ✕
      </button>

    </div>

    <form id="publishForm">

      <label>Título</label>

      <input
        id="publishTitle"
        type="text"
        required
        maxlength="100"
        placeholder="Ej. iPhone 14 Pro"
      >

      <label>Categoría</label>

      <select id="publishCategory">

        ${categories
          .filter(c => c !== "Todos")
          .map(c => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`)
          .join("")}

      </select>

      <label>Descripción</label>

      <textarea
        id="publishDescription"
        rows="4"
        maxlength="1000"
        placeholder="Describe tu publicación..."
      ></textarea>

      <label>Precio</label>

      <input
        id="publishPrice"
        type="number"
        min="0"
        step="1"
        placeholder="0"
      >

      <label>WhatsApp</label>

      <input
        id="publishWhatsapp"
        type="tel"
        placeholder="8090000000"
        value="${escapeHTML(MF.data.user.whatsapp || MF.data.user.phone || "")}"
      >

      <label>Messenger</label>

      <input
        id="publishMessenger"
        type="url"
        placeholder="https://m.me/..."
        value="${escapeHTML(MF.data.user.messenger || "")}"
      >

      <div class="form-actions">

        <button
          type="button"
          class="secondary-btn"
          id="chooseProductPhoto"
        >
          📷 Foto
        </button>

        <button
          type="button"
          class="secondary-btn"
          id="chooseProductGallery"
        >
          🖼️ Galería
        </button>

      </div>

      <div id="publishPreview"></div>

      <button
        type="submit"
        class="primary-btn"
      >
        Publicar
      </button>

    </form>
  `);

  bindModalActions();

  const photoInput = $("productCameraInput");
  const galleryInput = $("productGalleryInput");

  $("chooseProductPhoto")?.addEventListener(
    "click",
    () => photoInput?.click()
  );

  $("chooseProductGallery")?.addEventListener(
    "click",
    () => galleryInput?.click()
  );

  photoInput?.addEventListener("change", handleProductImage);

  galleryInput?.addEventListener("change", handleProductImage);

  $("publishForm")?.addEventListener(
    "submit",
    handlePublish
  );
}


let selectedProductImage = "";


function handleProductImage(event) {

  const file = event.target.files?.[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    showToast("Selecciona una imagen válida.");
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {

    selectedProductImage = reader.result;

    const preview = $("publishPreview");

    if (preview) {
      preview.innerHTML = `
        <img
          src="${escapeHTML(selectedProductImage)}"
          alt="Vista previa"
          style="max-width:100%;border-radius:12px;"
        >
      `;
    }

  };

  reader.readAsDataURL(file);
}


function handlePublish(event) {

  event.preventDefault();

  const title = $("publishTitle")?.value.trim();

  if (!title) {
    showToast("Escribe el título de la publicación.");
    return;
  }

  const product = {

    id: createId("product"),

    title,

    category:
      $("publishCategory")?.value || "Otros",

    description:
      $("publishDescription")?.value.trim() || "",

    price:
      Number($("publishPrice")?.value || 0),

    seller:
      MF.data.user.name || "Usuario",

    sellerId:
      MF.data.user.cedula || createId("user"),

    image:
      selectedProductImage,

    whatsapp:
      $("publishWhatsapp")?.value.trim() || "",

    messenger:
      $("publishMessenger")?.value.trim() || "",

    views: 0,

    likes: 0,

    dislikes: 0,

    createdAt: Date.now()

  };

  MF.data.products.unshift(product);

  addActivity(
    `Publicaste "${product.title}".`
  );

  saveData();

  selectedProductImage = "";

  closeModal();

  renderProducts();

  renderProfile();

  showToast("✅ Publicación creada correctamente.");
}


/* =========================================================
   FLASH DEL DÍA
========================================================= */

$("flashDayBtn")?.addEventListener(
  "click",
  openFlashDay
);


function openFlashDay() {

  const approvedAds = MF.data.ads.filter(
    ad => ad.status === "approved"
  );

  openModal(`

    <div class="modal-header">

      <div>
        <small>PUBLICIDAD</small>
        <h2>Publicación Flash del Día</h2>
      </div>

      <button
        type="button"
        class="secondary-btn"
        data-close-modal
      >
        ✕
      </button>

    </div>

    ${
      approvedAds.length
        ? `
          <div class="flash-ads">

            ${approvedAds.map(ad => `
              <article class="flash-ad">

                ${
                  ad.media
                    ? `<img src="${escapeHTML(ad.media)}" alt="">`
                    : `<div class="empty-product-image">⚡</div>`
                }

                <small>${escapeHTML(ad.plan || "Plan")}</small>

                <h3>
                  ${escapeHTML(ad.title || "Publicidad")}
                </h3>

                <p>
                  ${escapeHTML(ad.description || "")}
                </p>

                ${
                  ad.contact
                    ? `<a href="${escapeHTML(ad.contact)}" target="_blank" rel="noopener noreferrer" class="primary-btn">Contactar</a>`
                    : ""
                }

              </article>
            `).join("")}

          </div>
        `
        : `
          <div class="page-card">

            <h3>⚡ Flash del Día</h3>

            <p>
              Todavía no hay publicidad aprobada para mostrar.
            </p>

          </div>
        `
    }

    <button
      type="button"
      class="primary-btn"
      id="createFlashAdBtn"
    >
      📢 Crear publicidad Flash
    </button>

  `);

  bindModalActions();

  $("createFlashAdBtn")?.addEventListener(
    "click",
    openFlashAdForm
  );
}


/* =========================================================
   CREAR PUBLICIDAD FLASH
========================================================= */

function openFlashAdForm() {

  openModal(`

    <div class="modal-header">

      <div>
        <small>PUBLICIDAD</small>
        <h2>Crear Flash del Día</h2>
      </div>

      <button
        type="button"
        class="secondary-btn"
        data-close-modal
      >
        ✕
      </button>

    </div>

    <form id="flashAdForm">

      <label>Título</label>

      <input
        id="flashTitle"
        required
        maxlength="100"
        placeholder="Título de la publicidad"
      >

      <label>Descripción</label>

      <textarea
        id="flashDescription"
        rows="4"
        placeholder="Describe tu publicidad..."
      ></textarea>

      <label>Plan</label>

      <select id="flashPlan">

        <option value="basico">Básico</option>
        <option value="estandar">Estándar</option>
        <option value="premium">Premium</option>

      </select>

      <label>Número de contacto o URL</label>

      <input
        id="flashContact"
        type="text"
        placeholder="WhatsApp, teléfono o URL"
      >

      <div class="form-actions">

        <button
          type="button"
          class="secondary-btn"
          id="flashCameraBtn"
        >
          📷 Tomar foto
        </button>

        <button
          type="button"
          class="secondary-btn"
          id="flashGalleryBtn"
        >
          🖼️ Galería
        </button>

        <button
          type="button"
          class="secondary-btn"
          id="flashVideoCameraBtn"
        >
          🎥 Grabar vídeo
        </button>

        <button
          type="button"
          class="secondary-btn"
          id="flashVideoGalleryBtn"
        >
          🎬 Vídeo
        </button>

      </div>

      <div id="flashMediaPreview"></div>

      <button
        type="submit"
        class="primary-btn"
      >
        Enviar para revisión
      </button>

    </form>
  `);

  bindModalActions();

  let selectedMedia = "";

  function selectMedia(input) {

    const file = input.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {

      selectedMedia = reader.result;

      const preview = $("flashMediaPreview");

      if (!preview) return;

      if (file.type.startsWith("video/")) {

        preview.innerHTML = `
          <video
            src="${escapeHTML(selectedMedia)}"
            controls
            style="width:100%;border-radius:12px;"
          ></video>
        `;

      } else {

        preview.innerHTML = `
          <img
            src="${escapeHTML(selectedMedia)}"
            alt="Vista previa"
            style="width:100%;border-radius:12px;"
          >
        `;

      }

    };

    reader.readAsDataURL(file);
  }


  $("flashCameraBtn")?.addEventListener(
    "click",
    () => $("productCameraInput")?.click()
  );

  $("flashGalleryBtn")?.addEventListener(
    "click",
    () => $("productGalleryInput")?.click()
  );

  $("flashVideoCameraBtn")?.addEventListener(
    "click",
    () => $("productVideoCameraInput")?.click()
  );

  $("flashVideoGalleryBtn")?.addEventListener(
    "click",
    () => $("productVideoGalleryInput")?.click()
  );


  [
    $("productCameraInput"),
    $("productGalleryInput"),
    $("productVideoCameraInput"),
    $("productVideoGalleryInput")
  ]
    .filter(Boolean)
    .forEach(input => {

      input.addEventListener(
        "change",
        () => selectMedia(input)
      );

    });


  $("flashAdForm")?.addEventListener(
    "submit",
    (event) => {

      event.preventDefault();

      const ad = {

        id: createId("ad"),

        user:
          MF.data.user.name || "Usuario",

        title:
          $("flashTitle")?.value.trim() || "",

        description:
          $("flashDescription")?.value.trim() || "",

        plan:
          $("flashPlan")?.value || "basico",

        contact:
          $("flashContact")?.value.trim() || "",

        media:
          selectedMedia,

        status:
          "pending",

        views: 0,

        likes: 0,

        dislikes: 0,

        createdAt:
          Date.now()

      };

      MF.data.ads.push(ad);

      addActivity(
        "Enviaste una publicidad Flash del Día para revisión."
      );

      saveData();

      closeModal();

      updateMyAdStatus();

      showToast(
        "📢 Publicidad enviada para revisión."
      );

    }
  );
}


/* =========================================================
   ESTADO DE MI PUBLICIDAD
========================================================= */

function updateMyAdStatus() {

  const button = $("myAdStatusBtn");

  if (!button) return;

  const myAds = MF.data.ads.filter(
    ad =>
      ad.user === MF.data.user.name
  );

  if (!myAds.length) {

    button.classList.add("hidden");

    return;
  }

  const latest = myAds[myAds.length - 1];

  button.classList.remove("hidden");

  const title = $("myAdStatusTitle");
  const text = $("myAdStatusText");
  const icon = $("myAdStatusIcon");

  const states = {

    pending: {
      title: "Publicidad en revisión",
      text: "Tu publicidad está pendiente de revisión.",
      icon: "⏳"
    },

    approved: {
      title: "Publicidad aprobada",
      text: "Tu publicidad está aprobada para Flash del Día.",
      icon: "✅"
    },

    rejected: {
      title: "Publicidad rechazada",
      text: latest.reason || "Consulta los detalles de la revisión.",
      icon: "❌"
    }

  };

  const state =
    states[latest.status] || states.pending;

  if (title) title.textContent = state.title;
  if (text) text.textContent = state.text;
  if (icon) icon.textContent = state.icon;
}


$("myAdStatusBtn")?.addEventListener(
  "click",
  () => {

    const myAds = MF.data.ads.filter(
      ad => ad.user === MF.data.user.name
    );

    openModal(`

      <div class="modal-header">

        <div>
          <small>MI PUBLICIDAD</small>
          <h2>Estado</h2>
        </div>

        <button
          type="button"
          class="secondary-btn"
          data-close-modal
        >
          ✕
        </button>

      </div>

      ${myAds.map(ad => `

        <div class="page-card">

          <h3>
            ${escapeHTML(ad.title)}
          </h3>

          <p>
            Plan:
            <strong>${escapeHTML(ad.plan)}</strong>
          </p>

          <p>
            Estado:
            <strong>${escapeHTML(ad.status)}</strong>
          </p>

          ${
            ad.reason
              ? `<p>${escapeHTML(ad.reason)}</p>`
              : ""
          }

        </div>

      `).join("")}

    `);

    bindModalActions();

  }
);


/* =========================================================
   CHAT
========================================================= */

function renderChat() {

  const list = $("conversationList");
  const empty = $("chatEmpty");
  const contacts = $("contactsList");

  if (!list) return;

  list.innerHTML = "";

  if (!MF.data.conversations.length) {

    if (empty) {
      empty.classList.remove("hidden");
    }

  } else {

    if (empty) {
      empty.classList.add("hidden");
    }

    MF.data.conversations.forEach(conversation => {

      const item = document.createElement("button");

      item.type = "button";
      item.className = "conversation-item";

      item.innerHTML = `
        <strong>${escapeHTML(conversation.name)}</strong>
        <span>${escapeHTML(conversation.lastMessage || "Sin mensajes")}</span>
      `;

      item.addEventListener(
        "click",
        () => openConversation(conversation.id)
      );

      list.appendChild(item);

    });

  }

  if (contacts) {
    renderContacts();
  }

  updateBadges();
}


function renderContacts() {

  const list = $("contactsList");

  if (!list) return;

  list.innerHTML = "";

  if (!MF.data.contacts.length) {

    list.innerHTML = `
      <div class="page-card">
        <h3>No tienes contactos</h3>
        <p>Puedes enviar y aceptar solicitudes desde aquí.</p>
      </div>
    `;

    return;
  }

  MF.data.contacts.forEach(contact => {

    const item = document.createElement("div");

    item.className = "conversation-item";

    item.innerHTML = `
      <strong>${escapeHTML(contact.name)}</strong>

      <span>
        ${contact.status === "accepted"
          ? "✅ Contacto"
          : "⏳ Solicitud pendiente"}
      </span>

      ${
        contact.status !== "accepted"
          ? `
            <button
              type="button"
              class="primary-btn"
              data-accept-contact="${contact.id}"
            >
              Aceptar
            </button>
          `
          : ""
      }
    `;

    list.appendChild(item);

  });

  list.querySelectorAll(
    "[data-accept-contact]"
  ).forEach(button => {

    button.addEventListener("click", () => {

      const contact = MF.data.contacts.find(
        c => c.id === button.dataset.acceptContact
      );

      if (!contact) return;

      contact.status = "accepted";

      saveData();

      renderContacts();

      showToast("✅ Contacto agregado.");

    });

  });
}


function startConversation(product) {

  let conversation = MF.data.conversations.find(
    c => c.userId === product.sellerId
  );

  if (!conversation) {

    conversation = {

      id: createId("conversation"),

      userId: product.sellerId,

      name: product.seller || "Usuario",

      lastMessage: "",

      messages: []

    };

    MF.data.conversations.push(conversation);

  }

  saveData();

  closeModal();

  showPage("chat");

  openConversation(conversation.id);

}


function openConversation(conversationId) {

  const conversation = MF.data.conversations.find(
    c => c.id === conversationId
  );

  if (!conversation) return;

  openModal(`

    <div class="modal-header">

      <div>
        <small>CHAT MARKET FLASH</small>
        <h2>${escapeHTML(conversation.name)}</h2>
      </div>

      <button
        type="button"
        class="secondary-btn"
        data-close-modal
      >
        ✕
      </button>

    </div>

    <div
      id="messagesContainer"
      class="messages-container"
    >

      ${
        conversation.messages.length
          ? conversation.messages.map(message => `
              <div class="message">
                ${escapeHTML(message.text)}
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

    <form id="messageForm">

      <input
        id="messageInput"
        type="text"
        placeholder="Escribe un mensaje..."
        autocomplete="off"
        required
      >

      <button
        type="submit"
        class="primary-btn"
      >
        Enviar
      </button>

    </form>
  `);

  bindModalActions();

  $("messageForm")?.addEventListener(
    "submit",
    event => {

      event.preventDefault();

      const input = $("messageInput");

      const text = input?.value.trim();

      if (!text) return;

      conversation.messages.push({

        id: createId("message"),

        text,

        sender:
          MF.data.user.name,

        createdAt:
          Date.now()

      });

      conversation.lastMessage = text;

      saveData();

      openConversation(conversation.id);

      showToast("Mensaje enviado.");

    }
  );
}


/* =========================================================
   CONTACTOS
========================================================= */

$("chatContactsBtn")?.addEventListener(
  "click",
  () => {

    const list = $("contactsList");

    if (!list) return;

    list.classList.toggle("hidden");

    renderContacts();

  }
);


/* =========================================================
   ACTIVIDAD
========================================================= */

function addActivity(text) {

  MF.data.activity.unshift({

    id: createId("activity"),

    text,

    createdAt: Date.now()

  });

  MF.data.activity =
    MF.data.activity.slice(0, 100);

  saveData();
}


function renderActivity() {

  const content = $("activityContent");

  if (!content) return;

  content.innerHTML = "";

  if (!MF.data.activity.length) {

    content.innerHTML = `
      <div class="page-card">
        <h3>Sin actividad todavía</h3>
        <p>Aquí aparecerá tu actividad.</p>
      </div>
    `;

    return;
  }

  MF.data.activity.forEach(item => {

    const row = document.createElement("div");

    row.className = "activity-item";

    row.innerHTML = `

      <strong>
        ${escapeHTML(item.text)}
      </strong>

      <small>
        ${new Date(item.createdAt).toLocaleString("es-DO")}
      </small>

    `;

    content.appendChild(row);

  });
}


/* =========================================================
   PERFIL
========================================================= */

function renderProfile() {

  const user = MF.data.user;

  if ($("profileName"))
    $("profileName").textContent =
      user.name || "Usuario";

  if ($("profilePhone"))
    $("profilePhone").textContent =
      user.phone || "Teléfono no registrado";

  if ($("profileCedula"))
    $("profileCedula").textContent =
      user.cedula
        ? "Cédula: protegida"
        : "Cédula: protegida";

  if ($("profileNameInfo"))
    $("profileNameInfo").textContent =
      user.name || "-";

  if ($("profilePhoneInfo"))
    $("profilePhoneInfo").textContent =
      user.phone || "-";

  if ($("profileMessengerInfo"))
    $("profileMessengerInfo").textContent =
      user.messenger
        ? "Conectado"
        : "No conectado";

  const myProducts =
    MF.data.products.filter(
      product =>
        product.sellerId === user.cedula ||
        product.seller === user.name
    );

  if ($("myProductCount"))
    $("myProductCount").textContent =
      `${myProducts.length}`;

  const myProductsContainer =
    $("myProducts");

  if (myProductsContainer) {

    myProductsContainer.innerHTML = "";

    myProducts.forEach(product => {

      const card = document.createElement("article");

      card.className = "product-card";

      card.innerHTML = `
        <div class="product-image">
          ${
            product.image
              ? `<img src="${escapeHTML(product.image)}" alt="">`
              : `<span>📦</span>`
          }
        </div>

        <div class="product-body">

          <small>
            ${escapeHTML(product.category)}
          </small>

          <h3>
            ${escapeHTML(product.title)}
          </h3>

          <div class="product-meta">
            <span>👁️ ${product.views}</span>
            <span>👍 ${product.likes}</span>
            <span>👎 ${product.dislikes}</span>
          </div>

        </div>
      `;

      card.addEventListener(
        "click",
        () => openProduct(product.id)
      );

      myProductsContainer.appendChild(card);

    });

  }

  updateAvatar();

  updateMyAdStatus();

  updateBadges();
}


/* =========================================================
   FOTO DE PERFIL
========================================================= */

$("profileAvatarBtn")?.addEventListener(
  "click",
  () => $("profileImageInput")?.click()
);


$("profileImageInput")?.addEventListener(
  "change",
  event => {

    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Selecciona una imagen.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {

      MF.data.user.avatar = reader.result;

      saveData();

      updateAvatar();

      showToast("📷 Foto de perfil actualizada.");

    };

    reader.readAsDataURL(file);

  }
);


function updateAvatar() {

  const avatar = $("profileAvatarBtn");

  if (!avatar) return;

  if (MF.data.user.avatar) {

    avatar.innerHTML = `
      <img
        src="${escapeHTML(MF.data.user.avatar)}"
        alt="Foto de perfil"
      >
    `;

  } else {

    avatar.textContent = "👤";

  }
}


/* =========================================================
   EDITAR PERFIL
========================================================= */

$("editProfileBtn")?.addEventListener(
  "click",
  openEditProfile
);


function openEditProfile() {

  openModal(`

    <div class="modal-header">

      <div>
        <small>MI PERFIL</small>
        <h2>Editar perfil</h2>
      </div>

      <button
        type="button"
        class="secondary-btn"
        data-close-modal
      >
        ✕
      </button>

    </div>

    <form id="editProfileForm">

      <label>Nombre</label>

      <input
        id="editName"
        value="${escapeHTML(MF.data.user.name)}"
        required
      >

      <label>Teléfono</label>

      <input
        id="editPhone"
        type="tel"
        value="${escapeHTML(MF.data.user.phone)}"
      >

      <button
        type="submit"
        class="primary-btn"
      >
        Guardar cambios
      </button>

    </form>
  `);

  bindModalActions();

  $("editProfileForm")?.addEventListener(
    "submit",
    event => {

      event.preventDefault();

      MF.data.user.name =
        $("editName").value.trim();

      MF.data.user.phone =
        $("editPhone").value.trim();

      saveData();

      closeModal();

      renderProfile();

      showToast("✅ Perfil actualizado.");

    }
  );
}


/* =========================================================
   CONFIGURACIÓN DEL PERFIL
========================================================= */

$("profileSettingsBtn")?.addEventListener(
  "click",
  () => {

    const settings = $("profileSettings");

    if (settings) {
      settings.classList.toggle("hidden");
    }

  }
);


/* =========================================================
   CAMBIAR TELÉFONO
========================================================= */

$("savePhoneBtn")?.addEventListener(
  "click",
  () => {

    const input = $("newPhoneInput");

    if (!input) return;

    const phone = input.value.trim();

    if (!phone) {
      showToast("Escribe el nuevo número.");
      return;
    }

    MF.data.user.phone = phone;
    MF.data.user.whatsapp = phone;

    saveData();

    renderProfile();

    showToast("📱 Número actualizado.");

  }
);


/* =========================================================
   MESSENGER
========================================================= */

$("messengerProfileBtn")?.addEventListener(
  "click",
  () => {

    const settings = $("profileSettings");

    if (settings) {
      settings.classList.remove("hidden");
    }

    $("messengerLinkInput")?.focus();

  }
);


$("saveMessengerBtn")?.addEventListener(
  "click",
  () => {

    const input = $("messengerLinkInput");

    if (!input) return;

    const url = input.value.trim();

    if (
      url &&
      !/^https?:\/\//i.test(url)
    ) {

      showToast(
        "El enlace debe comenzar con https://"
      );

      return;

    }

    MF.data.user.messenger = url;

    saveData();

    renderProfile();

    showToast(
      url
        ? "🔵 Messenger conectado."
        : "Messenger desconectado."
    );

  }
);


/* =========================================================
   CAMBIAR COLOR
========================================================= */

$("appColorBtn")?.addEventListener(
  "click",
  () => {

    openModal(`

      <div class="modal-header">

        <div>
          <small>CONFIGURACIÓN</small>
          <h2>Color de la aplicación</h2>
        </div>

        <button
          type="button"
          class="secondary-btn"
          data-close-modal
        >
          ✕
        </button>

      </div>

      <div class="color-options">

        <button
          class="primary-btn"
          data-app-color="#1677ff"
        >
          Azul
        </button>

        <button
          class="secondary-btn"
          data-app-color="#7c3aed"
        >
          Morado
        </button>

        <button
          class="secondary-btn"
          data-app-color="#059669"
        >
          Verde
        </button>

        <button
          class="secondary-btn"
          data-app-color="#ea580c"
        >
          Naranja
        </button>

      </div>
    `);

    bindModalActions();

    document
      .querySelectorAll("[data-app-color]")
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            MF.data.settings.appColor =
              button.dataset.appColor;

            applySettings();

            saveData();

            closeModal();

            showToast("🎨 Color actualizado.");

          }
        );

      });

  }
);


/* =========================================================
   CHAT — ESTILO
========================================================= */

$("chatStyleBtn")?.addEventListener(
  "click",
  () => {

    const styles = [
      "normal",
      "compact",
      "large"
    ];

    const current =
      MF.data.settings.chatStyle;

    const index =
      styles.indexOf(current);

    MF.data.settings.chatStyle =
      styles[(index + 1) % styles.length];

    saveData();

    applySettings();

    showToast(
      `💬 Estilo de chat: ${MF.data.settings.chatStyle}`
    );

  }
);


/* =========================================================
   FONDO DEL CHAT
========================================================= */

$("chatBackgroundBtn")?.addEventListener(
  "click",
  () => {

    openModal(`

      <div class="modal-header">

        <div>
          <small>CHAT</small>
          <h2>Fondo del chat</h2>
        </div>

        <button
          type="button"
          class="secondary-btn"
          data-close-modal
        >
          ✕
        </button>

      </div>

      <button
        type="button"
        class="primary-btn"
        id="defaultChatBackground"
      >
        Fondo normal
      </button>

      <button
        type="button"
        class="secondary-btn"
        id="landscapeChatBackground"
      >
        🌴 Paisaje
      </button>

    `);

    bindModalActions();

    $("defaultChatBackground")?.addEventListener(
      "click",
      () => {

        MF.data.settings.chatBackground = "";

        saveData();

        applySettings();

        closeModal();

      }
    );

    $("landscapeChatBackground")?.addEventListener(
      "click",
      () => {

        MF.data.settings.chatBackground =
          "linear-gradient(135deg,#1677ff,#7c3aed)";

        saveData();

        applySettings();

        closeModal();

      }
    );

  }
);


/* =========================================================
   IMAGEN PERSONALIZADA DEL CHAT
========================================================= */

$("chatCustomImageBtn")?.addEventListener(
  "click",
  () => $("chatCustomImageInput")?.click()
);


$("chatCustomImageInput")?.addEventListener(
  "change",
  event => {

    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {

      MF.data.settings.chatCustomImage =
        reader.result;

      saveData();

      applySettings();

      showToast(
        "🏞️ Fondo personalizado guardado."
      );

    };

    reader.readAsDataURL(file);

  }
);


/* =========================================================
   PAISAJES
========================================================= */

$("builtInLandscapeBtn")?.addEventListener(
  "click",
  () => {

    MF.data.settings.chatBackground =
      "linear-gradient(135deg,#0ea5e9,#22c55e)";

    MF.data.settings.chatCustomImage = "";

    saveData();

    applySettings();

    showToast(
      "🌴 Paisaje de Market Flash seleccionado."
    );

  }
);


/* =========================================================
   APLICAR CONFIGURACIÓN
========================================================= */

function applySettings() {

  const color =
    MF.data.settings.appColor;

  document.documentElement.style.setProperty(
    "--mf-primary",
    color
  );

  const root =
    document.documentElement;

  if (
    MF.data.settings.chatCustomImage
  ) {

    root.style.setProperty(
      "--mf-chat-background",
      `url("${MF.data.settings.chatCustomImage}")`
    );

  } else if (
    MF.data.settings.chatBackground
  ) {

    root.style.setProperty(
      "--mf-chat-background",
      MF.data.settings.chatBackground
    );

  } else {

    root.style.removeProperty(
      "--mf-chat-background"
    );

  }

  document.body.dataset.chatStyle =
    MF.data.settings.chatStyle;
}


/* =========================================================
   CONTRASEÑA
========================================================= */

$("changePasswordBtn")?.addEventListener(
  "click",
  () => {

    const current =
      $("currentPasswordInput")?.value || "";

    const next =
      $("newPasswordInput")?.value || "";

    if (!current || !next) {

      showToast(
        "Completa las dos contraseñas."
      );

      return;
    }

    if (
      MF.data.user.password &&
      current !== MF.data.user.password
    ) {

      showToast(
        "❌ La contraseña actual no es correcta."
      );

      return;
    }

    if (next.length < 6) {

      showToast(
        "La nueva contraseña debe tener al menos 6 caracteres."
      );

      return;
    }

    MF.data.user.password = next;

    saveData();

    $("currentPasswordInput").value = "";
    $("newPasswordInput").value = "";

    showToast(
      "🔐 Contraseña actualizada."
    );

  }
);


/* =========================================================
   ELIMINAR CUENTA
========================================================= */

$("deleteAccountBtn")?.addEventListener(
  "click",
  () => {

    openModal(`

      <div class="modal-header">

        <div>
          <small>CUENTA</small>
          <h2>Eliminar cuenta</h2>
        </div>

        <button
          type="button"
          class="secondary-btn"
          data-close-modal
        >
          ✕
        </button>

      </div>

      <p>
        Esta acción eliminará los datos guardados
        localmente en este navegador.
      </p>

      <button
        type="button"
        class="danger-outline"
        id="confirmDeleteAccount"
      >
        Eliminar definitivamente
      </button>

    `);

    bindModalActions();

    $("confirmDeleteAccount")?.addEventListener(
      "click",
      () => {

        localStorage.removeItem(
          MF.storageKey
        );

        location.reload();

      }
    );

  }
);


/* =========================================================
   PANEL DE ADMINISTRADOR
========================================================= */

function openAdminPanel() {

  openModal(`

    <div class="modal-header">

      <div>
        <small>MARKET FLASH</small>
        <h2>🛡️ Panel de administrador</h2>
      </div>

      <button
        type="button"
        class="secondary-btn"
        data-close-modal
      >
        ✕
      </button>

    </div>

    <div class="page-card">

      <h3>Administración</h3>

      <button
        type="button"
        class="primary-btn"
        id="adminAdsBtn"
      >
        📢 Gestionar publicidad
      </button>

      <button
        type="button"
        class="secondary-btn"
        id="adminUsersBtn"
      >
        👥 Administrar usuarios
      </button>

      <button
        type="button"
        class="secondary-btn"
        id="adminStatsBtn"
      >
        📊 Estadísticas
      </button>

      <button
        type="button"
        class="secondary-btn"
        id="adminAddBtn"
      >
        ➕ Agregar administrador
      </button>

    </div>

  `);

  bindModalActions();

  $("adminAdsBtn")?.addEventListener(
    "click",
    openAdminAds
  );

  $("adminUsersBtn")?.addEventListener(
    "click",
    openAdminUsers
  );

  $("adminStatsBtn")?.addEventListener(
    "click",
    openAdminStats
  );

  $("adminAddBtn")?.addEventListener(
    "click",
    openAddAdministrator
  );
}


/* =========================================================
   PUBLICIDADES — ADMIN
========================================================= */

function openAdminAds() {

  const ads = MF.data.ads;

  openModal(`

    <div class="modal-header">

      <div>
        <small>ADMINISTRACIÓN</small>
        <h2>Publicidad</h2>
      </div>

      <button
        type="button"
        class="secondary-btn"
        data-close-modal
      >
        ✕
      </button>

    </div>

    ${
      ads.length
        ? ads.map(ad => `

          <div class="page-card">

            <h3>
              ${escapeHTML(ad.title)}
            </h3>

            <p>
              Usuario:
              ${escapeHTML(ad.user)}
            </p>

            <p>
              Plan:
              <strong>${escapeHTML(ad.plan)}</strong>
            </p>

            <p>
              Estado:
              <strong>${escapeHTML(ad.status)}</strong>
            </p>

            ${
              ad.status === "pending"
                ? `
                  <button
                    type="button"
                    class="primary-btn"
                    data-approve-ad="${ad.id}"
                  >
                    ✅ Aprobar
                  </button>

                  <button
                    type="button"
                    class="danger-outline"
                    data-reject-ad="${ad.id}"
                  >
                    ❌ Rechazar
                  </button>
                `
                : ""
            }

          </div>

        `).join("")
        : `
          <div class="page-card">
            <h3>No hay publicidad.</h3>
          </div>
        `
    }

  `);

  bindModalActions();

  document
    .querySelectorAll("[data-approve-ad]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const ad = MF.data.ads.find(
            item => item.id === button.dataset.approveAd
          );

          if (!ad) return;

          ad.status = "approved";

          saveData();

          openAdminAds();

          updateMyAdStatus();

          showToast("Publicidad aprobada.");

        }
      );

    });


  document
    .querySelectorAll("[data-reject-ad]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const ad = MF.data.ads.find(
            item => item.id === button.dataset.rejectAd
          );

          if (!ad) return;

          ad.status = "rejected";

          ad.reason =
            "Publicidad no aprobada por el administrador.";

          saveData();

          openAdminAds();

          updateMyAdStatus();

          showToast("Publicidad rechazada.");

        }
      );

    });

}


/* =========================================================
   USUARIOS — ADMIN
========================================================= */

function openAdminUsers() {

  const users = new Map();

  MF.data.products.forEach(product => {

    const id =
      product.sellerId ||
      product.seller;

    if (!users.has(id)) {

      users.set(id, {
        name: product.seller,
        products: 0
      });

    }

    users.get(id).products++;

  });

  openModal(`

    <div class="modal-header">

      <div>
        <small>ADMINISTRACIÓN</small>
        <h2>Usuarios</h2>
      </div>

      <button
        type="button"
        class="secondary-btn"
        data-close-modal
      >
        ✕
      </button>

    </div>

    ${
      users.size
        ? [...users.values()].map(user => `

            <div class="settings-row">

              <span>
                👤 ${escapeHTML(user.name)}
              </span>

              <strong>
                ${user.products} publicaciones
              </strong>

            </div>

        `).join("")
        : `
          <p>No hay usuarios registrados en los datos locales.</p>
        `
    }

  `);

  bindModalActions();
}


/* =========================================================
   ESTADÍSTICAS — ADMIN
========================================================= */

function openAdminStats() {

  const totalViews =
    MF.data.products.reduce(
      (sum, product) =>
        sum + Number(product.views || 0),
      0
    );

  const totalLikes =
    MF.data.products.reduce(
      (sum, product) =>
        sum + Number(product.likes || 0),
      0
    );

  const totalDislikes =
    MF.data.products.reduce(
      (sum, product) =>
        sum + Number(product.dislikes || 0),
      0
    );

  openModal(`

    <div class="modal-header">

      <div>
        <small>ADMINISTRACIÓN</small>
        <h2>📊 Estadísticas</h2>
      </div>

      <button
        type="button"
        class="secondary-btn"
        data-close-modal
      >
        ✕
      </button>

    </div>

    <div class="settings-list">

      <div class="settings-row">
        <span>📦 Publicaciones</span>
        <strong>${MF.data.products.length}</strong>
      </div>

      <div class="settings-row">
        <span>👁️ Vistas</span>
        <strong>${totalViews}</strong>
      </div>

      <div class="settings-row">
        <span>👍 Me gusta</span>
        <strong>${totalLikes}</strong>
      </div>

      <div class="settings-row">
        <span>👎 No me gusta</span>
        <strong>${totalDislikes}</strong>
      </div>

      <div class="settings-row">
        <span>📢 Publicidades</span>
        <strong>${MF.data.ads.length}</strong>
      </div>

    </div>
  `);

  bindModalActions();
}


/* =========================================================
   AGREGAR ADMINISTRADOR
========================================================= */

function openAddAdministrator() {

  openModal(`

    <div class="modal-header">

      <div>
        <small>SEGURIDAD</small>
        <h2>➕ Agregar administrador</h2>
      </div>

      <button
        type="button"
        class="secondary-btn"
        data-close-modal
      >
        ✕
      </button>

    </div>

    <form id="addAdminForm">

      <label>Nombre</label>

      <input
        id="newAdminName"
        required
      >

      <label>Identificador del administrador</label>

      <input
        id="newAdminId"
        required
        placeholder="Identificador"
      >

      <button
        type="submit"
        class="primary-btn"
      >
        Agregar administrador
      </button>

    </form>

  `);

  bindModalActions();

  $("addAdminForm")?.addEventListener(
    "submit",
    event => {

      event.preventDefault();

      const name =
        $("newAdminName").value.trim();

      const id =
        $("newAdminId").value.trim();

      if (!name || !id) return;

      MF.data.admin.administrators.push({

        id,

        name,

        createdAt: Date.now()

      });

      saveData();

      closeModal();

      showToast(
        "🛡️ Administrador agregado."
      );

    }
  );
}


/* =========================================================
   BOTÓN DE PANEL DE ADMINISTRADOR
   Se agrega dentro de configuración.
========================================================= */

function createAdminButton() {

  const settings =
    $("profileSettings");

  if (!settings) return;

  if ($("adminPanelBtn")) return;

  const wrapper =
    document.createElement("div");

  wrapper.className = "account-admin";

  wrapper.innerHTML = `

    <button
      id="adminPanelBtn"
      type="button"
      class="primary-btn admin-highlight"
    >
      🛡️ PANEL DE ADMINISTRADOR
    </button>

  `;

  settings.appendChild(wrapper);

  $("adminPanelBtn")?.addEventListener(
    "click",
    openAdminLogin
  );
}


/* =========================================================
   ACCESO ADMIN
========================================================= */

function openAdminLogin() {

  openModal(`

    <div class="modal-header">

      <div>
        <small>MARKET FLASH</small>
        <h2>🛡️ Panel de administrador</h2>
      </div>

      <button
        type="button"
        class="secondary-btn"
        data-close-modal
      >
        ✕
      </button>

    </div>

    <form id="adminLoginForm">

      <label>Identificador / cédula</label>

      <input
        id="adminIdInput"
        type="text"
        autocomplete="off"
        required
      >

      <label>Contraseña del panel</label>

      <input
        id="adminPasswordInput"
        type="password"
        autocomplete="current-password"
        required
      >

      <button
        type="submit"
        class="primary-btn admin-highlight"
      >
        🔐 Entrar al panel
      </button>

    </form>
  `);

  bindModalActions();

  $("adminLoginForm")?.addEventListener(
    "submit",
    event => {

      event.preventDefault();

      const id =
        $("adminIdInput").value.trim();

      const password =
        $("adminPasswordInput").value;

      /*
        La autenticación definitiva debe hacerse
        en el servidor/backend.

        Aquí solamente comprobamos administradores
        guardados en la aplicación local.
      */

      const admin =
        MF.data.admin.administrators.find(
          item => item.id === id
        );

      if (!admin) {

        showToast(
          "❌ Administrador no encontrado."
        );

        return;
      }

      if (
        MF.data.admin.password &&
        password !== MF.data.admin.password
      ) {

        showToast(
          "❌ Contraseña incorrecta."
        );

        return;
      }

      MF.data.admin.enabled = true;

      saveData();

      openAdminPanel();

    }
  );
}


/* =========================================================
   BÚSQUEDA
========================================================= */

$("searchInput")?.addEventListener(
  "input",
  () => renderProducts(currentCategory)
);


/* =========================================================
   NOTIFICACIONES
========================================================= */

$("notifyBtn")?.addEventListener(
  "click",
  () => {

    openModal(`

      <div class="modal-header">

        <div>
          <small>MARKET FLASH</small>
          <h2>🔔 Notificaciones</h2>
        </div>

        <button
          type="button"
          class="secondary-btn"
          data-close-modal
        >
          ✕
        </button>

      </div>

      <div class="page-card">

        <h3>Sin notificaciones nuevas</h3>

        <p>
          Aquí aparecerán avisos de Market Flash.
        </p>

      </div>

    `);

    bindModalActions();

  }
);


/* =========================================================
   BADGES
========================================================= */

function updateBadges() {

  const chatBadge = $("chatBadge");

  if (chatBadge) {

    const count =
      MF.data.conversations.length;

    chatBadge.textContent = count;

    chatBadge.classList.toggle(
      "hidden",
      count === 0
    );

  }

  const notifyBadge =
    $("notifyBadge");

  if (notifyBadge) {

    notifyBadge.classList.add("hidden");

  }

}


/* =========================================================
   BOTÓN DE MESSENGER
========================================================= */

$("messengerProfileBtn")?.addEventListener(
  "click",
  () => {

    if (MF.data.user.messenger) {

      window.open(
        MF.data.user.messenger,
        "_blank",
        "noopener,noreferrer"
      );

      return;
    }

    const settings =
      $("profileSettings");

    settings?.classList.remove("hidden");

    $("messengerLinkInput")?.focus();

  }
);


/* =========================================================
   INICIO DE LA APLICACIÓN
========================================================= */

function initMarketFlash() {

  loadData();

  createDemoProducts();

  renderCategories();

  applySettings();

  renderProducts();

  renderProfile();

  renderChat();

  renderActivity();

  createAdminButton();

  updateMyAdStatus();

  showPage("home");

}


document.addEventListener(
  "DOMContentLoaded",
  initMarketFlash
);


/* =========================================================
   PROTECCIÓN BÁSICA DE ERRORES
========================================================= */

window.addEventListener(
  "error",
  event => {

    console.error(
      "Market Flash:",
      event.error || event.message
    );

  }
);


/* =========================================================
   FIN SCRIPT.JS
========================================================= */
