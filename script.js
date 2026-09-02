/* =========================================================
   MARKET FLASH
   JAVASCRIPT PRINCIPAL
   ========================================================= */

"use strict";

/* =========================================================
   CONFIGURACIÓN
   ========================================================= */

const STORAGE_KEY = "marketFlashData_v2";

/* Administrador principal */
const ADMIN_CEDULA = "402-1260-49-75-3";

/* =========================================================
   DATOS
   ========================================================= */

const defaultData = {
  currentUser: {
    id: "user_local",
    name: "Usuario",
    phone: "",
    whatsapp: "",
    cedula: "",
    messenger: "",
    password: "1234",
    avatar: "",
    isAdmin: false
  },

  users: [],

  products: [],

  conversations: [],

  contactRequests: [],

  contacts: [],

  notifications: [],

  activity: [],

  settings: {
    appColor: "#1677ff",
    chatStyle: "normal",
    chatBackground: "",
    chatCustomImage: ""
  },

  flashAds: [],

  currentFlashIndex: 0
};

let data = loadData();
let selectedCategory = "Todas";
let searchText = "";

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

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return structuredClone(defaultData);
    }

    const parsed = JSON.parse(saved);

    return {
      ...structuredClone(defaultData),
      ...parsed,
      currentUser: {
        ...defaultData.currentUser,
        ...(parsed.currentUser || {})
      },
      settings: {
        ...defaultData.settings,
        ...(parsed.settings || {})
      }
    };

  } catch (error) {
    console.error("Error cargando datos:", error);
    return structuredClone(defaultData);
  }
}

function toast(message) {
  const el = $("toast");

  if (!el) return;

  el.textContent = message;
  el.classList.remove("hidden");

  clearTimeout(window.toastTimer);

  window.toastTimer = setTimeout(() => {
    el.classList.add("hidden");
  }, 2800);
}

function money(value) {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

function now() {
  return new Date().toISOString();
}

function currentUserId() {
  return data.currentUser.id;
}

function isAdmin() {
  return (
    data.currentUser.isAdmin === true ||
    data.currentUser.cedula === ADMIN_CEDULA
  );
}

function makeId(prefix = "id") {
  return (
    prefix +
    "_" +
    Date.now() +
    "_" +
    Math.random().toString(36).slice(2, 8)
  );
}

/* =========================================================
   ADMINISTRADOR PRINCIPAL
   ========================================================= */

function checkAdmin() {
  if (data.currentUser.cedula === ADMIN_CEDULA) {
    data.currentUser.isAdmin = true;
    saveData();
  }

  const button = $("adminPanelBtn");

  if (button) {
    button.classList.toggle("hidden", !isAdmin());
  }
}

/* =========================================================
   NAVEGACIÓN
   ========================================================= */

function showPage(page) {
  const pages = {
    home: $("homePage"),
    chat: $("chatPage"),
    activity: $("activityPage"),
    profile: $("profilePage")
  };

  Object.values(pages).forEach(pageEl => {
    if (pageEl) pageEl.classList.add("hidden");
  });

  if (pages[page]) {
    pages[page].classList.remove("hidden");
  }

  document.querySelectorAll(".nav-item").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.page === page
    );
  });

  if (page === "home") renderProducts();
  if (page === "chat") renderChat();
  if (page === "activity") renderActivity();
  if (page === "profile") renderProfile();
}

/* =========================================================
   MODAL
   ========================================================= */

function openModal(html) {
  const modal = $("modal");
  const card = $("modalCard");

  if (!modal || !card) return;

  card.innerHTML = html;

  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  const modal = $("modal");

  if (!modal) return;

  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");

  const card = $("modalCard");

  if (card) card.innerHTML = "";
}

function modalCloseButton() {
  return `
    <button
      type="button"
      class="modal-close mf-press"
      onclick="closeModal()"
    >
      ✕
    </button>
  `;
}

/* =========================================================
   CATEGORÍAS
   ========================================================= */

const categories = [
  "Todas",
  "Celulares",
  "Electrónica",
  "Vehículos",
  "Hogar",
  "Ropa",
  "Servicios",
  "Otros"
];

function renderCategories() {
  const row = $("categoryRow");

  if (!row) return;

  row.innerHTML = categories.map(category => `
    <button
      type="button"
      class="chip ${selectedCategory === category ? "active" : ""}"
      onclick="selectCategory('${escapeHTML(category)}')"
    >
      ${escapeHTML(category)}
    </button>
  `).join("");
}

function selectCategory(category) {
  selectedCategory = category;
  renderCategories();
  renderProducts();
}

/* =========================================================
   PRODUCTOS
   ========================================================= */

function renderProducts() {
  const grid = $("productsGrid");

  if (!grid) return;

  const query = searchText.toLowerCase();

  let products = data.products.filter(product => {

    const matchesCategory =
      selectedCategory === "Todas" ||
      product.category === selectedCategory;

    const text = [
      product.title,
      product.description,
      product.location,
      product.category,
      product.sellerName
    ]
      .join(" ")
      .toLowerCase();

    return matchesCategory && text.includes(query);
  });

  const count = $("productCount");

  if (count) {
    count.textContent = `${products.length} publicación${products.length === 1 ? "" : "es"}`;
  }

  if (!products.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <div>📦</div>
        <h3>No hay publicaciones</h3>
        <p>Cuando alguien publique algo aparecerá aquí.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = products.map(productCard).join("");
}

function productCard(product) {

  const image =
    product.images && product.images.length
      ? `<img src="${product.images[0]}" alt="${escapeHTML(product.title)}">`
      : `<div class="product-placeholder">📦</div>`;

  return `
    <article
      class="product-card mf-press"
      onclick="openProduct('${product.id}')"
    >

      <div class="product-image">
        ${image}
      </div>

      <div class="product-body">

        <small>
          ${escapeHTML(product.category || "Otros")}
        </small>

        <h3>
          ${escapeHTML(product.title)}
        </h3>

        <strong class="product-price">
          ${money(product.price)}
        </strong>

        <p>
          📍 ${escapeHTML(product.location || "República Dominicana")}
        </p>

        <small>
          👤 ${escapeHTML(product.sellerName || "Usuario")}
        </small>

      </div>

    </article>
  `;
}

/* =========================================================
   DETALLE DE PUBLICACIÓN
   ========================================================= */

function openProduct(id) {

  const product = data.products.find(p => p.id === id);

  if (!product) return;

  product.views = Number(product.views || 0) + 1;

  addActivity(
    `Viste la publicación "${product.title}"`
  );

  saveData();

  const own =
    product.sellerId === currentUserId();

  const whatsapp = product.whatsapp || "";
  const messenger = product.messenger || "";

  let contactButtons = "";

  if (!own) {
    contactButtons += `
      <button
        class="primary-btn"
        onclick="contactSeller('${product.id}')"
      >
        💬 Chat Market Flash
      </button>
    `;
  } else {
    contactButtons += `
      <button
        class="secondary-btn"
        onclick="editProduct('${product.id}')"
      >
        ✏️ Editar publicación
      </button>
    `;
  }

  if (whatsapp) {
    const clean = whatsapp.replace(/\D/g, "");

    contactButtons += `
      <a
        class="secondary-btn"
        href="https://wa.me/${clean}"
        target="_blank"
        rel="noopener"
      >
        🟢 WhatsApp
      </a>
    `;
  }

  if (messenger) {
    contactButtons += `
      <a
        class="secondary-btn"
        href="${escapeHTML(messenger)}"
        target="_blank"
        rel="noopener"
      >
        🔵 Messenger
      </a>
    `;
  }

  openModal(`
    <div class="modal-content">

      ${modalCloseButton()}

      <h2>
        ${escapeHTML(product.title)}
      </h2>

      <div class="product-detail-image">

        ${
          product.images?.length
            ? `<img src="${product.images[0]}" alt="">`
            : "📦"
        }

      </div>

      <h3>
        ${money(product.price)}
      </h3>

      <p>
        ${escapeHTML(product.description || "")}
      </p>

      <p>
        📍 ${escapeHTML(product.location || "")}
      </p>

      <p>
        👤 ${escapeHTML(product.sellerName || "")}
      </p>

      <div class="contact-buttons">
        ${contactButtons}
      </div>

      <div class="reaction-buttons">

        <button
          class="secondary-btn"
          onclick="likeProduct('${product.id}')"
        >
          👍 Me gusta
        </button>

        <button
          class="secondary-btn"
          onclick="dislikeProduct('${product.id}')"
        >
          👎 No me gusta
        </button>

        <button
          class="danger-outline"
          onclick="reportProduct('${product.id}')"
        >
          🚩 Reclamar
        </button>

      </div>

    </div>
  `);
}

/* =========================================================
   ME GUSTA / NO ME GUSTA
   ========================================================= */

function likeProduct(id) {

  const product = data.products.find(p => p.id === id);

  if (!product) return;

  product.likes = Number(product.likes || 0) + 1;

  addActivity(`Marcaste "Me gusta" en "${product.title}"`);

  saveData();

  toast("👍 Me gusta registrado");
}

function dislikeProduct(id) {

  const product = data.products.find(p => p.id === id);

  if (!product) return;

  product.dislikes = Number(product.dislikes || 0) + 1;

  addActivity(`Marcaste "No me gusta" en "${product.title}"`);

  saveData();

  toast("👎 No me gusta registrado");
}

/* =========================================================
   RECLAMOS
   ========================================================= */

function reportProduct(id) {

  const product = data.products.find(p => p.id === id);

  if (!product) return;

  openModal(`
    <div class="modal-content">

      ${modalCloseButton()}

      <h2>
        🚩 Reclamar publicación
      </h2>

      <p>
        Indica el motivo del reclamo.
      </p>

      <select id="reportReason">

        <option value="Contenido inapropiado">
          Contenido inapropiado
        </option>

        <option value="Fraude o estafa">
          Fraude o estafa
        </option>

        <option value="Producto prohibido">
          Producto prohibido
        </option>

        <option value="Información falsa">
          Información falsa
        </option>

        <option value="Otro">
          Otro
        </option>

      </select>

      <textarea
        id="reportDescription"
        placeholder="Describe el problema..."
      ></textarea>

      <button
        class="danger-outline"
        onclick="submitReport('${product.id}')"
      >
        Enviar reclamo
      </button>

    </div>
  `);
}

function submitReport(productId) {

  const reason = $("reportReason")?.value;
  const description = $("reportDescription")?.value.trim();

  data.notifications.push({
    id: makeId("report"),
    type: "report",
    productId,
    reason,
    description,
    from: currentUserId(),
    createdAt: now(),
    status: "pendiente"
  });

  addActivity("Enviaste un reclamo");

  saveData();

  closeModal();

  toast("🚩 Reclamo enviado correctamente");
}

/* =========================================================
   CONTACTOS
   ========================================================= */

function contactSeller(productId) {

  const product = data.products.find(p => p.id === productId);

  if (!product) return;

  if (product.sellerId === currentUserId()) {
    toast("Esta publicación pertenece a tu cuenta.");
    return;
  }

  const existing = data.contacts.find(
    c =>
      c.userA === currentUserId() &&
      c.userB === product.sellerId ||
      c.userB === currentUserId() &&
      c.userA === product.sellerId
  );

  if (existing) {
    openConversation(product.sellerId);
    return;
  }

  sendContactRequest(product.sellerId);
}

function sendContactRequest(userId) {

  const exists = data.contactRequests.find(
    request =>
      request.from === currentUserId() &&
      request.to === userId &&
      request.status === "pendiente"
  );

  if (exists) {
    toast("Ya enviaste una solicitud.");
    return;
  }

  data.contactRequests.push({
    id: makeId("request"),
    from: currentUserId(),
    to: userId,
    status: "pendiente",
    createdAt: now()
  });

  saveData();

  toast("👥 Solicitud de contacto enviada");
}

function acceptContactRequest(id) {

  const request = data.contactRequests.find(
    r => r.id === id
  );

  if (!request) return;

  request.status = "aceptada";

  data.contacts.push({
    id: makeId("contact"),
    userA: request.from,
    userB: request.to,
    createdAt: now()
  });

  saveData();

  renderChat();

  toast("👥 Contacto agregado");
}

function rejectContactRequest(id) {

  const request = data.contactRequests.find(
    r => r.id === id
  );

  if (!request) return;

  request.status = "rechazada";

  saveData();

  renderChat();

  toast("Solicitud rechazada");
}

/* =========================================================
   OBTENER USUARIO
   ========================================================= */

function getUser(id) {

  if (id === currentUserId()) {
    return data.currentUser;
  }

  return data.users.find(user => user.id === id) || {
    id,
    name: "Usuario",
    phone: "",
    whatsapp: "",
    messenger: "",
    avatar: ""
  };
}

/* =========================================================
   CHAT
   ========================================================= */

function renderChat() {

  renderContactRequests();

  const list = $("conversationList");
  const empty = $("chatEmpty");

  if (!list) return;

  const conversations = data.conversations.filter(
    conversation =>
      conversation.userA === currentUserId() ||
      conversation.userB === currentUserId()
  );

  if (!conversations.length) {

    list.innerHTML = "";

    if (empty) {
      empty.classList.remove("hidden");
    }

    return;
  }

  if (empty) {
    empty.classList.add("hidden");
  }

  list.innerHTML = conversations
    .map(conversation => {

      const otherId =
        conversation.userA === currentUserId()
          ? conversation.userB
          : conversation.userA;

      const user = getUser(otherId);

      const messages = conversation.messages || [];

      const last =
        messages[messages.length - 1];

      return `
        <button
          type="button"
          class="conversation-item"
          onclick="openConversation('${otherId}')"
        >

          <div class="conversation-avatar">
            ${user.avatar
              ? `<img src="${user.avatar}" alt="">`
              : "👤"
            }
          </div>

          <div>

            <strong>
              ${escapeHTML(user.name)}
            </strong>

            <p>
              ${escapeHTML(last?.text || "Nueva conversación")}
            </p>

          </div>

        </button>
      `;

    })
    .join("");
}

function renderContactRequests() {

  const section = $("contactRequestsSection");
  const list = $("contactRequestsList");
  const count = $("contactRequestCount");

  if (!section || !list) return;

  const requests = data.contactRequests.filter(
    r =>
      r.to === currentUserId() &&
      r.status === "pendiente"
  );

  section.classList.toggle(
    "hidden",
    requests.length === 0
  );

  if (count) {
    count.textContent = requests.length;
    count.classList.toggle(
      "hidden",
      requests.length === 0
    );
  }

  list.innerHTML = requests.map(request => {

    const user = getUser(request.from);

    return `
      <div class="request-card">

        <strong>
          ${escapeHTML(user.name)}
        </strong>

        <p>
          Quiere agregarte como contacto.
        </p>

        <div>

          <button
            class="primary-btn"
            onclick="acceptContactRequest('${request.id}')"
          >
            ✓ Aceptar
          </button>

          <button
            class="secondary-btn"
            onclick="rejectContactRequest('${request.id}')"
          >
            ✕ Rechazar
          </button>

        </div>

      </div>
    `;

  }).join("");
}

function openConversation(userId) {

  let conversation = data.conversations.find(
    c =>
      c.userA === currentUserId() &&
      c.userB === userId ||
      c.userB === currentUserId() &&
      c.userA === userId
  );

  if (!conversation) {

    conversation = {
      id: makeId("conversation"),
      userA: currentUserId(),
      userB: userId,
      messages: []
    };

    data.conversations.push(conversation);
  }

  const user = getUser(userId);

  openModal(`
    <div class="modal-content chat-modal">

      ${modalCloseButton()}

      <h2>
        💬 ${escapeHTML(user.name)}
      </h2>

      <div
        id="chatMessages"
        class="chat-messages"
      >

        ${
          conversation.messages.length
            ? conversation.messages.map(message => `
              <div class="
                chat-message
                ${message.sender === currentUserId() ? "mine" : ""}
              ">
                ${escapeHTML(message.text)}
              </div>
            `).join("")
            : `
              <div class="chat-empty">
                No hay mensajes todavía.
              </div>
            `
        }

      </div>

      <div class="chat-input-row">

        <input
          id="chatMessageInput"
          type="text"
          placeholder="Escribe un mensaje..."
        >

        <button
          class="primary-btn"
          onclick="sendMessage('${conversation.id}')"
        >
          ➤
        </button>

      </div>

    </div>
  `);

  setTimeout(() => {
    $("chatMessageInput")?.focus();
  }, 100);
}

function sendMessage(conversationId) {

  const input = $("chatMessageInput");

  if (!input) return;

  const text = input.value.trim();

  if (!text) return;

  const conversation =
    data.conversations.find(
      c => c.id === conversationId
    );

  if (!conversation) return;

  conversation.messages.push({
    id: makeId("message"),
    sender: currentUserId(),
    text,
    createdAt: now()
  });

  saveData();

  const otherId =
    conversation.userA === currentUserId()
      ? conversation.userB
      : conversation.userA;

  openConversation(otherId);
}

/* =========================================================
   ACTIVIDAD
   ========================================================= */

function addActivity(text) {

  data.activity.unshift({
    id: makeId("activity"),
    text,
    createdAt: now()
  });

  data.activity =
    data.activity.slice(0, 100);

  saveData();
}

function renderActivity() {

  const publications =
    data.products.filter(
      p => p.sellerId === currentUserId()
    );

  const contacts =
    data.contacts.filter(
      c =>
        c.userA === currentUserId() ||
        c.userB === currentUserId()
    ).length;

  let views = 0;
  let likes = 0;
  let dislikes = 0;

  publications.forEach(product => {
    views += Number(product.views || 0);
    likes += Number(product.likes || 0);
    dislikes += Number(product.dislikes || 0);
  });

  if ($("activityContactsCount"))
    $("activityContactsCount").textContent = contacts;

  if ($("activityViewsCount"))
    $("activityViewsCount").textContent = views;

  if ($("activityLikesCount"))
    $("activityLikesCount").textContent = likes;

  if ($("activityDislikesCount"))
    $("activityDislikesCount").textContent = dislikes;

  if ($("activityProductCount"))
    $("activityProductCount").textContent = publications.length;

  const publicationBox =
    $("activityPublications");

  if (publicationBox) {

    publicationBox.innerHTML =
      publications.length
        ? publications.map(p => `
          <div class="activity-publication">

            <strong>
              ${escapeHTML(p.title)}
            </strong>

            <span>
              👁️ ${p.views || 0}
              &nbsp; 👍 ${p.likes || 0}
              &nbsp; 👎 ${p.dislikes || 0}
            </span>

          </div>
        `).join("")
        : `
          <p>
            Todavía no tienes publicaciones.
          </p>
        `;
  }

  const box = $("activityContent");

  if (!box) return;

  box.innerHTML =
    data.activity.length
      ? data.activity.map(item => `
        <div class="activity-row">

          <span>
            •
          </span>

          <div>
            ${escapeHTML(item.text)}

            <small>
              ${new Date(item.createdAt).toLocaleString("es-DO")}
            </small>
          </div>

        </div>
      `).join("")
      : `
        <p>
          No hay actividad reciente.
        </p>
      `;
}

/* =========================================================
   PERFIL
   ========================================================= */

function renderProfile() {

  const user = data.currentUser;

  setText("profileName", user.name || "Usuario");
  setText("profilePhone", user.phone || "Teléfono no registrado");

  setText(
    "profileCedula",
    user.cedula
      ? "Cédula: protegida"
      : "Cédula: no registrada"
  );

  setText("profileNameInfo", user.name || "-");
  setText("profilePhoneInfo", user.phone || "-");

  setText(
    "profileMessengerInfo",
    user.messenger
      ? "Conectado"
      : "No conectado"
  );

  setText(
    "profileWhatsappInfo",
    user.whatsapp
      ? user.whatsapp
      : "No configurado"
  );

  const publications =
    data.products.filter(
      p => p.sellerId === currentUserId()
    );

  const contacts =
    data.contacts.filter(
      c =>
        c.userA === currentUserId() ||
        c.userB === currentUserId()
    );

  let views = 0;

  publications.forEach(
    p => views += Number(p.views || 0)
  );

  setText(
    "profilePublicationsCount",
    publications.length
  );

  setText(
    "profileContactsCount",
    contacts.length
  );

  setText(
    "profileViewsCount",
    views
  );

  setText(
    "myProductCount",
    publications.length
  );

  const myProducts = $("myProducts");

  if (myProducts) {
    myProducts.innerHTML =
      publications.length
        ? publications.map(productCard).join("")
        : `
          <div class="empty-state">
            <div>📦</div>
            <h3>No tienes publicaciones</h3>
          </div>
        `;
  }

  checkAdmin();

  updateProfileAvatar();
}

function setText(id, text) {

  const el = $(id);

  if (el) {
    el.textContent = text;
  }
}

function updateProfileAvatar() {

  const buttons = [
    $("profileAvatarBtn"),
    $("editProfilePhotoBtn")
  ];

  buttons.forEach(button => {

    if (!button) return;

    if (data.currentUser.avatar) {
      button.innerHTML = `
        <img
          src="${data.currentUser.avatar}"
          alt="Foto de perfil"
        >
      `;
    } else {
      button.textContent = "👤";
    }

  });
}

/* =========================================================
   EDITAR PERFIL
   ========================================================= */

function openEditProfile() {

  const user = data.currentUser;

  if ($("editProfileNameInput"))
    $("editProfileNameInput").value = user.name || "";

  if ($("editProfilePhoneInput"))
    $("editProfilePhoneInput").value = user.phone || "";

  if ($("editProfileWhatsappInput"))
    $("editProfileWhatsappInput").value =
      user.whatsapp || "";

  $("profileEditSection")?.classList.remove("hidden");

  $("profileEditSection")?.scrollIntoView({
    behavior: "smooth"
  });
}

function saveProfile() {

  const name =
    $("editProfileNameInput")?.value.trim();

  const phone =
    $("editProfilePhoneInput")?.value.trim();

  const whatsapp =
    $("editProfileWhatsappInput")?.value.trim();

  if (name) data.currentUser.name = name;

  data.currentUser.phone = phone;
  data.currentUser.whatsapp = whatsapp;

  saveData();

  renderProfile();

  toast("✅ Perfil actualizado");
}

function handleProfileImage(file) {

  if (!file) return;

  const reader = new FileReader();

  reader.onload = event => {

    data.currentUser.avatar =
      event.target.result;

    saveData();

    renderProfile();

    toast("📷 Foto de perfil actualizada");
  };

  reader.readAsDataURL(file);
}

/* =========================================================
   CONFIGURACIÓN
   ========================================================= */

function toggleSettings() {

  const settings = $("profileSettings");

  if (!settings) return;

  settings.classList.toggle("hidden");

  if (!settings.classList.contains("hidden")) {
    settings.scrollIntoView({
      behavior: "smooth"
    });
  }
}

function savePhone() {

  const value =
    $("newPhoneInput")?.value.trim();

  if (!value) {
    toast("Escribe un número.");
    return;
  }

  data.currentUser.phone = value;

  saveData();
  renderProfile();

  toast("📱 Número guardado");
}

function saveWhatsapp() {

  const value =
    $("whatsappNumberInput")?.value.trim();

  data.currentUser.whatsapp = value;

  saveData();
  renderProfile();

  toast("🟢 WhatsApp guardado");
}

function saveMessenger() {

  const value =
    $("messengerLinkInput")?.value.trim();

  data.currentUser.messenger = value;

  saveData();
  renderProfile();

  toast("💬 Messenger guardado");
}

function changePassword() {

  const current =
    $("currentPasswordInput")?.value;

  const next =
    $("newPasswordInput")?.value;

  if (current !== data.currentUser.password) {
    toast("❌ La contraseña actual no coincide.");
    return;
  }

  if (!next || next.length < 4) {
    toast("La nueva contraseña debe tener al menos 4 caracteres.");
    return;
  }

  data.currentUser.password = next;

  saveData();

  $("currentPasswordInput").value = "";
  $("newPasswordInput").value = "";

  toast("🔐 Contraseña cambiada");
}

/* =========================================================
   PUBLICAR PRODUCTO
   ========================================================= */

function openPublishModal() {

  openModal(`
    <div class="modal-content">

      ${modalCloseButton()}

      <h2>
        ➕ Publicar producto
      </h2>

      <label>
        Título
      </label>

      <input
        id="productTitleInput"
        type="text"
        placeholder="Ej.: iPhone 14 Pro"
      >

      <label>
        Precio
      </label>

      <input
        id="productPriceInput"
        type="number"
        placeholder="Precio"
      >

      <label>
        Categoría
      </label>

      <select id="productCategoryInput">

        ${categories
          .filter(c => c !== "Todas")
          .map(c => `
            <option value="${escapeHTML(c)}">
              ${escapeHTML(c)}
            </option>
          `)
          .join("")
        }

      </select>

      <label>
        Ubicación
      </label>

      <input
        id="productLocationInput"
        type="text"
        placeholder="Santo Domingo"
      >

      <label>
        Descripción
      </label>

      <textarea
        id="productDescriptionInput"
        placeholder="Describe tu producto..."
      ></textarea>

      <div class="upload-buttons">

        <button
          class="secondary-btn"
          onclick="$('productCameraInput').click()"
        >
          📷 Cámara
        </button>

        <button
          class="secondary-btn"
          onclick="$('productGalleryInput').click()"
        >
          🖼️ Galería
        </button>

        <button
          class="secondary-btn"
          onclick="$('productVideoCameraInput').click()"
        >
          🎥 Grabar video
        </button>

        <button
          class="secondary-btn"
          onclick="$('productVideoGalleryInput').click()"
        >
          🎬 Video
        </button>

      </div>

      <div id="productMediaPreview"></div>

      <button
        class="primary-btn"
        onclick="createProduct()"
      >
        Publicar
      </button>

    </div>
  `);

  window.tempProductImages = [];
}

function createProduct() {

  const title =
    $("productTitleInput")?.value.trim();

  const price =
    Number($("productPriceInput")?.value || 0);

  const category =
    $("productCategoryInput")?.value;

  const location =
    $("productLocationInput")?.value.trim();

  const description =
    $("productDescriptionInput")?.value.trim();

  if (!title) {
    toast("Escribe el título.");
    return;
  }

  const product = {

    id: makeId("product"),

    sellerId: currentUserId(),

    sellerName: data.currentUser.name,

    phone: data.currentUser.phone,

    whatsapp: data.currentUser.whatsapp,

    messenger: data.currentUser.messenger,

    title,

    price,

    category,

    location,

    description,

    images: window.tempProductImages || [],

    video: "",

    views: 0,

    likes: 0,

    dislikes: 0,

    createdAt: now()
  };

  data.products.unshift(product);

  addActivity(
    `Publicaste "${title}"`
  );

  saveData();

  closeModal();

  renderProducts();

  toast("✅ Publicación creada");
}

/* =========================================================
   IMÁGENES
   ========================================================= */

function processImage(file) {

  if (!file) return;

  const reader = new FileReader();

  reader.onload = event => {

    window.tempProductImages =
      window.tempProductImages || [];

    window.tempProductImages.push(
      event.target.result
    );

    renderMediaPreview();
  };

  reader.readAsDataURL(file);
}

function renderMediaPreview() {

  const box = $("productMediaPreview");

  if (!box) return;

  box.innerHTML =
    (window.tempProductImages || [])
      .map((image, index) => `
        <div class="media-preview-item">

          <img src="${image}" alt="">

          <button
            type="button"
            onclick="removeTempImage(${index})"
          >
            ✕
          </button>

        </div>
      `)
      .join("");
}

function removeTempImage(index) {

  window.tempProductImages.splice(
    index,
    1
  );

  renderMediaPreview();
}

/* =========================================================
   FLASH DEL DÍA
   ========================================================= */

function openFlashDay() {

  openModal(`
    <div class="modal-content">

      ${modalCloseButton()}

      <h2>
        ⚡ Publicación Flash del Día
      </h2>

      <p>
        Publicidad destacada que aparecerá en primera plana.
      </p>

      <label>
        Título
      </label>

      <input
        id="flashTitleInput"
        type="text"
        placeholder="Título de la publicidad"
      >

      <label>
        Descripción
      </label>

      <textarea
        id="flashDescriptionInput"
        placeholder="Describe tu publicidad..."
      ></textarea>

      <label>
        Número de contacto
      </label>

      <input
        id="flashContactInput"
        type="tel"
        placeholder="809-000-0000"
      >

      <label>
        URL de contacto
      </label>

      <input
        id="flashUrlInput"
        type="url"
        placeholder="https://..."
      >

      <div class="upload-buttons">

        <button
          class="secondary-btn"
          onclick="$('flashPhotoCameraInput').click()"
        >
          📷 Tomar foto
        </button>

        <button
          class="secondary-btn"
          onclick="$('flashPhotoGalleryInput').click()"
        >
          🖼️ Galería
        </button>

        <button
          class="secondary-btn"
          onclick="$('flashVideoCameraInput').click()"
        >
          🎥 Grabar video
        </button>

        <button
          class="secondary-btn"
          onclick="$('flashVideoGalleryInput').click()"
        >
          🎬 Elegir video
        </button>

      </div>

      <div id="flashMediaPreview"></div>

      <button
        class="primary-btn"
        onclick="createFlashAd()"
      >
        ⚡ Enviar publicidad
      </button>

    </div>
  `);

  window.tempFlashImages = [];
  window.tempFlashVideo = "";
}

function createFlashAd() {

  const title =
    $("flashTitleInput")?.value.trim();

  const description =
    $("flashDescriptionInput")?.value.trim();

  const contact =
    $("flashContactInput")?.value.trim();

  const url =
    $("flashUrlInput")?.value.trim();

  if (!title) {
    toast("Escribe un título.");
    return;
  }

  const ad = {

    id: makeId("flash"),

    userId: currentUserId(),

    userName: data.currentUser.name,

    title,

    description,

    contact,

    url,

    images: window.tempFlashImages || [],

    video: window.tempFlashVideo || "",

    plan: "premium",

    status: "pendiente",

    createdAt: now(),

    views: 0,

    likes: 0,

    dislikes: 0
  };

  data.flashAds.push(ad);

  saveData();

  closeModal();

  updateFlashStatus();

  toast(
    "⚡ Publicidad enviada para revisión"
  );
}

/* =========================================================
   ESTADO FLASH
   ========================================================= */

function updateFlashStatus() {

  const button =
    $("myAdStatusBtn");

  if (!button) return;

  const mine =
    data.flashAds
      .filter(
        ad => ad.userId === currentUserId()
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt) -
          new Date(a.createdAt)
      )[0];

  if (!mine) {
    button.classList.add("hidden");
    return;
  }

  button.classList.remove("hidden");

  setText(
    "myAdStatusTitle",
    mine.status === "aprobada"
      ? "Publicidad aprobada"
      : mine.status === "rechazada"
      ? "Publicidad rechazada"
      : "Publicidad en revisión"
  );

  setText(
    "myAdStatusText",
    mine.status === "aprobada"
      ? "Tu publicidad está activa."
      : mine.status === "rechazada"
      ? "Tu publicidad fue rechazada."
      : "Tu publicidad está esperando revisión."
  );
}

/* =========================================================
   ADMINISTRADOR
   ========================================================= */

function openAdminPanel() {

  if (!isAdmin()) {
    toast("⛔ Acceso de administrador requerido.");
    return;
  }

  openModal(`
    <div class="modal-content admin-panel">

      ${modalCloseButton()}

      <h2>
        🛡️ Panel de Administrador
      </h2>

      <p>
        Administración de Market Flash.
      </p>

      <div class="admin-actions">

        <button
          class="primary-btn"
          onclick="manageFlashAds()"
        >
          ⚡ Publicidades Flash
        </button>

        <button
          class="secondary-btn"
          onclick="manageReports()"
        >
          🚩 Reclamos
        </button>

        <button
          class="secondary-btn"
          onclick="manageAdmins()"
        >
          👥 Administradores
        </button>

        <button
          class="secondary-btn"
          onclick="adminStatistics()"
        >
          📊 Estadísticas
        </button>

      </div>

    </div>
  `);
}

/* =========================================================
   ADMIN - FLASH
   ========================================================= */

function manageFlashAds() {

  const ads = data.flashAds;

  openModal(`
    <div class="modal-content">

      ${modalCloseButton()}

      <h2>
        ⚡ Publicidades Flash
      </h2>

      ${
        ads.length
          ? ads.map(ad => `
            <div class="admin-item">

              <strong>
                ${escapeHTML(ad.title)}
              </strong>

              <p>
                ${escapeHTML(ad.userName)}
              </p>

              <small>
                Plan: ${escapeHTML(ad.plan)}
                · Estado: ${escapeHTML(ad.status)}
              </small>

              <div>

                <button
                  class="primary-btn"
                  onclick="approveFlash('${ad.id}')"
                >
                  ✓ Aprobar
                </button>

                <button
                  class="danger-outline"
                  onclick="rejectFlash('${ad.id}')"
                >
                  ✕ Rechazar
                </button>

              </div>

            </div>
          `).join("")
          : "<p>No hay publicidades.</p>"
      }

    </div>
  `);
}

function approveFlash(id) {

  const ad =
    data.flashAds.find(a => a.id === id);

  if (!ad) return;

  ad.status = "aprobada";

  saveData();

  manageFlashAds();

  toast("⚡ Publicidad aprobada");
}

function rejectFlash(id) {

  const ad =
    data.flashAds.find(a => a.id === id);

  if (!ad) return;

  ad.status = "rechazada";

  saveData();

  manageFlashAds();

  toast("Publicidad rechazada");
}

/* =========================================================
   ADMIN - RECLAMOS
   ========================================================= */

function manageReports() {

  const reports =
    data.notifications.filter(
      n => n.type === "report"
    );

  openModal(`
    <div class="modal-content">

      ${modalCloseButton()}

      <h2>
        🚩 Reclamos
      </h2>

      ${
        reports.length
          ? reports.map(report => `
            <div class="admin-item">

              <strong>
                ${escapeHTML(report.reason)}
              </strong>

              <p>
                ${escapeHTML(report.description || "")}
              </p>

              <small>
                Estado: ${escapeHTML(report.status)}
              </small>

            </div>
          `).join("")
          : "<p>No hay reclamos.</p>"
      }

    </div>
  `);
}

/* =========================================================
   ADMIN - AGREGAR ADMINISTRADORES
   ========================================================= */

function manageAdmins() {

  if (!isAdmin()) return;

  openModal(`
    <div class="modal-content">

      ${modalCloseButton()}

      <h2>
        👥 Administradores
      </h2>

      <div class="form-card">

        <input
          id="adminNameInput"
          type="text"
          placeholder="Nombre"
        >

        <input
          id="adminCedulaInput"
          type="text"
          placeholder="Cédula"
        >

        <input
          id="adminPasswordInput"
          type="password"
          placeholder="Contraseña"
        >

        <button
          class="primary-btn"
          onclick="addAdministrator()"
        >
          ➕ Agregar administrador
        </button>

      </div>

      <div>

        ${
          data.users
            .filter(user => user.isAdmin)
            .map(user => `
              <div class="admin-item">

                <strong>
                  ${escapeHTML(user.name)}
                </strong>

                <small>
                  Administrador
                </small>

              </div>
            `)
            .join("")
          || "<p>No hay administradores adicionales.</p>"
        }

      </div>

    </div>
  `);
}

function addAdministrator() {

  const name =
    $("adminNameInput")?.value.trim();

  const cedula =
    $("adminCedulaInput")?.value.trim();

  const password =
    $("adminPasswordInput")?.value;

  if (!name || !cedula || !password) {
    toast("Completa todos los campos.");
    return;
  }

  const exists =
    data.users.some(
      user => user.cedula === cedula
    );

  if (exists) {
    toast("Esa cédula ya existe.");
    return;
  }

  data.users.push({
    id: makeId("admin"),
    name,
    cedula,
    password,
    phone: "",
    whatsapp: "",
    messenger: "",
    avatar: "",
    isAdmin: true
  });

  saveData();

  manageAdmins();

  toast("👥 Administrador agregado");
}

/* =========================================================
   ESTADÍSTICAS ADMIN
   ========================================================= */

function adminStatistics() {

  const totalViews =
    data.products.reduce(
      (sum, p) => sum + Number(p.views || 0),
      0
    );

  const totalLikes =
    data.products.reduce(
      (sum, p) => sum + Number(p.likes || 0),
      0
    );

  const totalDislikes =
    data.products.reduce(
      (sum, p) => sum + Number(p.dislikes || 0),
      0
    );

  openModal(`
    <div class="modal-content">

      ${modalCloseButton()}

      <h2>
        📊 Estadísticas
      </h2>

      <div class="activity-stats">

        <div class="stat-card">
          <small>Usuarios</small>
          <strong>${data.users.length + 1}</strong>
        </div>

        <div class="stat-card">
          <small>Publicaciones</small>
          <strong>${data.products.length}</strong>
        </div>

        <div class="stat-card">
          <small>Vistas</small>
          <strong>${totalViews}</strong>
        </div>

        <div class="stat-card">
          <small>Me gusta</small>
          <strong>${totalLikes}</strong>
        </div>

        <div class="stat-card">
          <small>No me gusta</small>
          <strong>${totalDislikes}</strong>
        </div>

      </div>

    </div>
  `);
}

/* =========================================================
   CAMBIAR COLOR
   ========================================================= */

function changeAppColor() {

  const colors = [
    "#1677ff",
    "#7c3aed",
    "#059669",
    "#ea580c",
    "#dc2626"
  ];

  const current =
    data.settings.appColor;

  let index =
    colors.indexOf(current);

  index =
    (index + 1) % colors.length;

  data.settings.appColor =
    colors[index];

  applySettings();

  saveData();

  toast("🎨 Color actualizado");
}

function applySettings() {

  document.documentElement.style.setProperty(
    "--mf-primary",
    data.settings.appColor
  );
}

/* =========================================================
   BUSCADOR
   ========================================================= */

function handleSearch(event) {

  searchText =
    event.target.value.trim();

  renderProducts();
}

/* =========================================================
   EVENTOS
   ========================================================= */

function setupEvents() {

  document.querySelectorAll(
    ".nav-item[data-page]"
  ).forEach(button => {

    button.addEventListener(
      "click",
      () => showPage(button.dataset.page)
    );

  });


  $("searchInput")
    ?.addEventListener(
      "input",
      handleSearch
    );


  $("publishBtn")
    ?.addEventListener(
      "click",
      openPublishModal
    );


  $("flashDayBtn")
    ?.addEventListener(
      "click",
      openFlashDay
    );


  $("myAdStatusBtn")
    ?.addEventListener(
      "click",
      updateFlashStatus
    );


  $("notifyBtn")
    ?.addEventListener(
      "click",
      showNotifications
    );


  $("editProfileBtn")
    ?.addEventListener(
      "click",
      openEditProfile
    );


  $("profileAvatarBtn")
    ?.addEventListener(
      "click",
      () => $("profileImageInput")?.click()
    );


  $("editProfilePhotoBtn")
    ?.addEventListener(
      "click",
      () => $("profileImageInput")?.click()
    );


  $("profileImageInput")
    ?.addEventListener(
      "change",
      event =>
        handleProfileImage(
          event.target.files[0]
        )
    );


  $("saveProfileBtn")
    ?.addEventListener(
      "click",
      saveProfile
    );


  $("profileSettingsBtn")
    ?.addEventListener(
      "click",
      toggleSettings
    );


  $("savePhoneBtn")
    ?.addEventListener(
      "click",
      savePhone
    );


  $("saveWhatsappBtn")
    ?.addEventListener(
      "click",
      saveWhatsapp
    );


  $("saveMessengerBtn")
    ?.addEventListener(
      "click",
      saveMessenger
    );


  $("changePasswordBtn")
    ?.addEventListener(
      "click",
      changePassword
    );


  $("appColorBtn")
    ?.addEventListener(
      "click",
      changeAppColor
    );


  $("myContactsBtn")
    ?.addEventListener(
      "click",
      () => showPage("chat")
    );


  $("myActivityBtn")
    ?.addEventListener(
      "click",
      () => showPage("activity")
    );


  $("chatContactsBtn")
    ?.addEventListener(
      "click",
      showContacts
    );


  $("adminPanelBtn")
    ?.addEventListener(
      "click",
      openAdminPanel
    );


  /* Productos - cámara */
  $("productCameraInput")
    ?.addEventListener(
      "change",
      event =>
        processImage(
          event.target.files[0]
        )
    );


  /* Productos - galería */
  $("productGalleryInput")
    ?.addEventListener(
      "change",
      event => {

        [...event.target.files]
          .forEach(processImage);

      }
    );


  /* Flash - cámara */
  $("flashPhotoCameraInput")
    ?.addEventListener(
      "change",
      event =>
        processFlashImage(
          event.target.files[0]
        )
    );


  /* Flash - galería */
  $("flashPhotoGalleryInput")
    ?.addEventListener(
      "change",
      event => {

        [...event.target.files]
          .forEach(processFlashImage);

      }
    );


  /* Flash - video */
  $("flashVideoCameraInput")
    ?.addEventListener(
      "change",
      event =>
        processFlashVideo(
          event.target.files[0]
        )
    );


  $("flashVideoGalleryInput")
    ?.addEventListener(
      "change",
      event =>
        processFlashVideo(
          event.target.files[0]
        )
    );


  /* Video producto */
  $("productVideoCameraInput")
    ?.addEventListener(
      "change",
      event =>
        processProductVideo(
          event.target.files[0]
        )
    );


  $("productVideoGalleryInput")
    ?.addEventListener(
      "change",
      event =>
        processProductVideo(
          event.target.files[0]
        )
    );


  /* Cerrar modal */
  $("modal")
    ?.addEventListener(
      "click",
      event => {

        if (event.target.id === "modal") {
          closeModal();
        }

      }
    );

}

/* =========================================================
   FLASH MEDIA
   ========================================================= */

function processFlashImage(file) {

  if (!file) return;

  const reader = new FileReader();

  reader.onload = event => {

    window.tempFlashImages =
      window.tempFlashImages || [];

    window.tempFlashImages.push(
      event.target.result
    );

    renderFlashPreview();
  };

  reader.readAsDataURL(file);
}

function processFlashVideo(file) {

  if (!file) return;

  if (file.size > 20 * 1024 * 1024) {
    toast("El video no puede superar 20 MB.");
    return;
  }

  const reader = new FileReader();

  reader.onload = event => {

    window.tempFlashVideo =
      event.target.result;

    renderFlashPreview();
  };

  reader.readAsDataURL(file);
}

function renderFlashPreview() {

  const box =
    $("flashMediaPreview");

  if (!box) return;

  box.innerHTML = `
    <div class="flash-media-preview">

      ${(window.tempFlashImages || [])
        .map(image =>
          `<img src="${image}" alt="">`
        )
        .join("")
      }

      ${
        window.tempFlashVideo
          ? `
            <video
              src="${window.tempFlashVideo}"
              controls
              playsinline
            ></video>
          `
          : ""
      }

    </div>
  `;
}

function processProductVideo(file) {

  if (!file) return;

  if (file.size > 20 * 1024 * 1024) {
    toast("El video no puede superar 20 MB.");
    return;
  }

  const reader = new FileReader();

  reader.onload = event => {

    window.tempProductVideo =
      event.target.result;

    toast("🎥 Video preparado");

  };

  reader.readAsDataURL(file);
}

/* =========================================================
   CONTACTOS
   ========================================================= */

function showContacts() {

  const list =
    $("contactsList");

  if (!list) return;

  list.classList.remove("hidden");

  const contacts =
    data.contacts.filter(
      c =>
        c.userA === currentUserId() ||
        c.userB === currentUserId()
    );

  if (!contacts.length) {

    list.innerHTML = `
      <div class="chat-empty">

        <div>
          👥
        </div>

        <h3>
          No tienes contactos
        </h3>

        <p>
          Puedes enviar solicitudes desde las publicaciones.
        </p>

      </div>
    `;

    return;
  }

  list.innerHTML = contacts.map(contact => {

    const id =
      contact.userA === currentUserId()
        ? contact.userB
        : contact.userA;

    const user =
      getUser(id);

    return `
      <button
        class="conversation-item"
        onclick="openConversation('${id}')"
      >

        <div class="conversation-avatar">
          ${user.avatar
            ? `<img src="${user.avatar}" alt="">`
            : "👤"
          }
        </div>

        <div>

          <strong>
            ${escapeHTML(user.name)}
          </strong>

          <p>
            Contacto agregado
          </p>

        </div>

      </button>
    `;

  }).join("");
}

/* =========================================================
   NOTIFICACIONES
   ========================================================= */

function showNotifications() {

  const notifications =
    data.notifications;

  openModal(`
    <div class="modal-content">

      ${modalCloseButton()}

      <h2>
        🔔 Notificaciones
      </h2>

      ${
        notifications.length
          ? notifications.map(n => `
            <div class="notification-item">

              <strong>
                ${escapeHTML(
                  n.reason ||
                  n.text ||
                  "Nueva notificación"
                )}
              </strong>

              <small>
                ${new Date(
                  n.createdAt
                ).toLocaleString("es-DO")}
              </small>

            </div>
          `).join("")
          : `
            <p>
              No tienes notificaciones.
            </p>
          `
      }

    </div>
  `);

  updateBadges();
}

function updateBadges() {

  const requests =
    data.contactRequests.filter(
      r =>
        r.to === currentUserId() &&
        r.status === "pendiente"
    ).length;

  const chatBadge =
    $("chatBadge");

  if (chatBadge) {
    chatBadge.textContent = requests;
    chatBadge.classList.toggle(
      "hidden",
      requests === 0
    );
  }

  const profileBadge =
    $("profileBadge");

  if (profileBadge) {
    profileBadge.textContent = requests;
    profileBadge.classList.toggle(
      "hidden",
      requests === 0
    );
  }
}

/* =========================================================
   INICIALIZACIÓN
   ========================================================= */

function init() {

  applySettings();

  checkAdmin();

  renderCategories();

  renderProducts();

  renderProfile();

  renderActivity();

  renderChat();

  updateFlashStatus();

  updateBadges();

  setupEvents();

  /* Firma al llegar al final */
  const signature =
    $("ownerSignature");

  if (signature) {

    const observer =
      new IntersectionObserver(
        entries => {

          entries.forEach(entry => {

            if (entry.isIntersecting) {
              signature.classList.add("visible");
            }

          });

        }
      );

    observer.observe(signature);
  }

}

/* =========================================================
   DOM READY
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  init
);

/* =========================================================
   FUNCIONES DISPONIBLES GLOBALMENTE
   ========================================================= */

window.closeModal = closeModal;
window.selectCategory = selectCategory;
window.openProduct = openProduct;
window.likeProduct = likeProduct;
window.dislikeProduct = dislikeProduct;
window.reportProduct = reportProduct;
window.submitReport = submitReport;
window.contactSeller = contactSeller;
window.sendContactRequest = sendContactRequest;
window.acceptContactRequest = acceptContactRequest;
window.rejectContactRequest = rejectContactRequest;
window.openConversation = openConversation;
window.sendMessage = sendMessage;
window.removeTempImage = removeTempImage;
window.createProduct = createProduct;
window.openFlashDay = openFlashDay;
window.createFlashAd = createFlashAd;
window.approveFlash = approveFlash;
window.rejectFlash = rejectFlash;
window.manageFlashAds = manageFlashAds;
window.manageReports = manageReports;
window.manageAdmins = manageAdmins;
window.addAdministrator = addAdministrator;
window.adminStatistics = adminStatistics;
window.openAdminPanel = openAdminPanel;
window.showContacts = showContacts;
window.processFlashImage = processFlashImage;
window.processFlashVideo = processFlashVideo;
window.processProductVideo = processProductVideo;
