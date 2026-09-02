"use strict";

/* =========================================================
   MARKET FLASH
   JAVASCRIPT PRINCIPAL
========================================================= */

const STORAGE_KEY = "marketFlashData";

const ADMIN_USER = "admin";
const ADMIN_PASSWORD = "123456";

let data = null;
let selectedCategory = "Todos";
let selectedImages = [];
let currentProductId = null;
let currentChatId = null;
let currentImageIndex = 0;
let editingProductId = null;
let editingPaymentMethodId = null;
let confirmCallback = null;


/* =========================================================
   DATOS INICIALES
========================================================= */

function createDefaultData() {
  return {
    users: [],
    products: [],
    chats: [],
    notifications: [],
    paymentMethods: [
      {
        id: "payment_1",
        name: "Transferencia bancaria",
        price: 0
      }
    ],
    advertisingRequests: [],
    settings: {
      advertisingEnabled: false,
      advertisingPrice: 0,
      notificationsEnabled: true
    },
    currentUser: null,
    adminLogged: false
  };
}


/* =========================================================
   CARGAR / GUARDAR
========================================================= */

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      data = createDefaultData();
      saveData();
      return;
    }

    const parsed = JSON.parse(saved);

    data = {
      ...createDefaultData(),
      ...parsed,
      settings: {
        ...createDefaultData().settings,
        ...(parsed.settings || {})
      }
    };

  } catch (error) {
    console.error("Error cargando datos:", error);
    data = createDefaultData();
    saveData();
  }
}


function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
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


function formatPrice(value) {
  const number = Number(value) || 0;

  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    maximumFractionDigits: 0
  }).format(number);
}


function formatDate(dateValue) {
  if (!dateValue) return "";

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
  if (!dateValue) return "";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString("es-DO", {
    hour: "2-digit",
    minute: "2-digit"
  });
}


function generateId(prefix = "id") {
  return (
    prefix +
    "_" +
    Date.now() +
    "_" +
    Math.random().toString(36).slice(2, 9)
  );
}


function currentUser() {
  if (!data.currentUser) {
    return null;
  }

  return data.users.find(
    user => user.id === data.currentUser
  ) || null;
}


function requireLogin() {
  if (!currentUser()) {
    showPage("loginPage");
    showToast("Inicia sesión para continuar.");
    return false;
  }

  return true;
}


function showToast(message) {
  const toast = $("toast");

  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(showToast.timer);

  showToast.timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2800);
}


/* =========================================================
   NAVEGACIÓN
========================================================= */

function showPage(pageId) {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active");
  });

  const page = $(pageId);

  if (!page) {
    console.warn("Página no encontrada:", pageId);
    return;
  }

  page.classList.add("active");

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

  updateNavigation(pageId);

  if (pageId === "homePage") {
    renderProducts();
  }

  if (pageId === "profilePage") {
    renderProfile();
  }

  if (pageId === "myPublicationsPage") {
    renderMyPublications();
  }

  if (pageId === "chatsPage") {
    renderChats();
  }

  if (pageId === "adminPanelPage") {
    renderAdminPanel();
  }

  updateNotificationBadge();
}


function updateNavigation(pageId) {
  document.querySelectorAll(".nav-item").forEach(button => {
    button.classList.remove("active");
  });

  if (pageId === "homePage") {
    $("navHomeBtn")?.classList.add("active");
  }

  if (pageId === "activityPage") {
    $("navActivityBtn")?.classList.add("active");
  }

  if (pageId === "publishPage") {
    $("navPublishBtn")?.classList.add("active");
  }

  if (pageId === "chatsPage") {
    $("navChatsBtn")?.classList.add("active");
  }

  if (pageId === "profilePage") {
    $("navProfileBtn")?.classList.add("active");
  }
}


/* =========================================================
   LOGIN
========================================================= */

function loginUser() {
  const phone = $("loginPhone")?.value.trim();
  const password = $("loginPassword")?.value;

  if (!phone || !password) {
    showToast("Completa todos los campos.");
    return;
  }

  const user = data.users.find(
    item =>
      item.phone === phone &&
      item.password === password
  );

  if (!user) {
    showToast("Teléfono o contraseña incorrectos.");
    return;
  }

  data.currentUser = user.id;
  saveData();

  $("loginForm")?.reset();

  renderProfile();
  updateNotificationBadge();

  showToast("¡Bienvenido a Market Flash!");

  setTimeout(() => {
    showPage("homePage");
  }, 300);
}


/* =========================================================
   REGISTRO
========================================================= */

function registerUser() {
  const name = $("registerName")?.value.trim();
  const phone = $("registerPhone")?.value.trim();
  const cedula = $("registerId")?.value.trim();
  const password = $("registerPassword")?.value;
  const confirmPassword =
    $("registerPasswordConfirm")?.value;

  if (!name || !phone || !cedula || !password) {
    showToast("Completa todos los campos.");
    return;
  }

  if (password !== confirmPassword) {
    showToast("Las contraseñas no coinciden.");
    return;
  }

  const existingPhone = data.users.some(
    user => user.phone === phone
  );

  if (existingPhone) {
    showToast("Ese teléfono ya está registrado.");
    return;
  }

  const existingCedula = data.users.some(
    user => user.cedula === cedula
  );

  if (existingCedula) {
    showToast("Esa cédula ya está registrada.");
    return;
  }

  const user = {
    id: generateId("user"),
    name,
    phone,
    cedula,
    password,
    photo: "",
    createdAt: new Date().toISOString()
  };

  data.users.push(user);
  data.currentUser = user.id;

  saveData();

  $("registerForm")?.reset();

  showToast("Cuenta creada correctamente.");

  setTimeout(() => {
    showPage("homePage");
  }, 400);
}


/* =========================================================
   RECUPERACIÓN
========================================================= */

function recoverAccount() {
  const phone = $("recoveryPhone")?.value.trim();
  const cedula = $("recoveryId")?.value.trim();
  const newPassword = $("recoveryNewPassword")?.value;

  if (!phone || !cedula || !newPassword) {
    showToast("Completa todos los campos.");
    return;
  }

  const user = data.users.find(
    item =>
      item.phone === phone &&
      item.cedula === cedula
  );

  if (!user) {
    showToast("No encontramos una cuenta con esos datos.");
    return;
  }

  user.password = newPassword;

  saveData();

  $("recoveryForm")?.reset();

  showToast("Contraseña actualizada.");

  setTimeout(() => {
    showPage("loginPage");
  }, 500);
}


/* =========================================================
   LOGOUT
========================================================= */

function logoutUser() {
  data.currentUser = null;
  saveData();

  showToast("Sesión cerrada.");

  setTimeout(() => {
    showPage("loginPage");
  }, 300);
}


/* =========================================================
   PERFIL
========================================================= */

function renderProfile() {
  const user = currentUser();

  if (!user) {
    $("profileName").textContent = "Invitado";
    $("profilePhone").textContent = "Sin sesión";

    if ($("profileAvatar")) {
      $("profileAvatar").style.display = "none";
    }

    if ($("profileAvatarFallback")) {
      $("profileAvatarFallback").style.display = "block";
    }

    return;
  }

  $("profileName").textContent = user.name;
  $("profilePhone").textContent = user.phone;

  const avatar = $("profileAvatar");
  const fallback = $("profileAvatarFallback");

  if (user.photo) {
    avatar.src = user.photo;
    avatar.style.display = "block";
    fallback.style.display = "none";
  } else {
    avatar.removeAttribute("src");
    avatar.style.display = "none";
    fallback.style.display = "block";
  }
}


function openEditProfile() {
  if (!requireLogin()) return;

  const user = currentUser();

  $("editProfileName").value = user.name || "";
  $("editProfilePhone").value = user.phone || "";

  showPage("editProfilePage");
}


function saveProfile() {
  if (!requireLogin()) return;

  const user = currentUser();

  const name = $("editProfileName").value.trim();
  const phone = $("editProfilePhone").value.trim();

  if (!name || !phone) {
    showToast("Completa los datos.");
    return;
  }

  const duplicate = data.users.find(
    item =>
      item.phone === phone &&
      item.id !== user.id
  );

  if (duplicate) {
    showToast("Ese teléfono ya pertenece a otra cuenta.");
    return;
  }

  user.name = name;
  user.phone = phone;

  saveData();

  renderProfile();

  showToast("Perfil actualizado.");

  showPage("profilePage");
}


/* =========================================================
   FOTO DE PERFIL
========================================================= */

function readProfileImage(file) {
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    showToast("Selecciona una imagen válida.");
    return;
  }

  const reader = new FileReader();

  reader.onload = event => {
    const user = currentUser();

    if (!user) return;

    user.photo = event.target.result;

    saveData();
    renderProfile();

    showToast("Foto de perfil actualizada.");
  };

  reader.readAsDataURL(file);
}


/* =========================================================
   IMÁGENES DE PRODUCTO
========================================================= */

function resetSelectedImages() {
  selectedImages = [];

  if ($("imagePreview")) {
    $("imagePreview").innerHTML = "";
  }
}


function handleProductFiles(files) {
  if (!files || !files.length) {
    return;
  }

  const fileArray = Array.from(files);

  fileArray.forEach(file => {
    if (!file.type.startsWith("image/")) {
      return;
    }

    const reader = new FileReader();

    reader.onload = event => {
      selectedImages.push(event.target.result);
      renderImagePreview();
    };

    reader.readAsDataURL(file);
  });
}


function renderImagePreview() {
  const container = $("imagePreview");

  if (!container) return;

  container.innerHTML = "";

  selectedImages.forEach((src, index) => {

    const wrapper =
      document.createElement("div");

    wrapper.className =
      "preview-image-wrapper";

    const img =
      document.createElement("img");

    img.src = src;
    img.alt = "Vista previa";

    const removeButton =
      document.createElement("button");

    removeButton.type = "button";
    removeButton.textContent = "✕";

    removeButton.addEventListener(
      "click",
      () => {
        selectedImages.splice(index, 1);
        renderImagePreview();
      }
    );

    wrapper.appendChild(img);
    wrapper.appendChild(removeButton);

    container.appendChild(wrapper);
  });
}


/* =========================================================
   PUBLICAR PRODUCTO
========================================================= */

function publishProduct(event) {
  if (event) {
    event.preventDefault();
  }

  if (!requireLogin()) return;

  const title = $("productTitle")?.value.trim();
  const category = $("productCategory")?.value;
  const price = $("productPrice")?.value;
  const location = $("productLocation")?.value.trim();
  const description =
    $("productDescription")?.value.trim();

  if (
    !title ||
    !category ||
    !price ||
    !location ||
    !description
  ) {
    showToast("Completa todos los campos.");
    return;
  }

  const user = currentUser();

  const product = {
    id: generateId("product"),
    userId: user.id,
    title,
    category,
    price: Number(price),
    location,
    description,
    images: [...selectedImages],
    likes: [],
    dislikes: [],
    createdAt: new Date().toISOString(),

    /*
      Si la publicidad pagada está activada,
      la publicación queda pendiente.
      Si está desactivada, aparece inmediatamente.
    */
    status: data.settings.advertisingEnabled
      ? "pending"
      : "approved"
  };

  data.products.push(product);

  if (data.settings.advertisingEnabled) {

    data.notifications.push({
      id: generateId("notification"),
      userId: user.id,
      message:
        "Tu publicación fue enviada y está pendiente de aprobación.",
      read: false,
      createdAt: new Date().toISOString()
    });

    showToast(
      "Publicación enviada. Está pendiente de aprobación."
    );

  } else {

    data.notifications.push({
      id: generateId("notification"),
      userId: user.id,
      message:
        "Tu publicación fue publicada correctamente.",
      read: false,
      createdAt: new Date().toISOString()
    });

    showToast(
      "¡Producto publicado correctamente!"
    );
  }

  saveData();

  $("publishForm")?.reset();

  resetSelectedImages();

  setTimeout(() => {
    showPage("homePage");
  }, 500);
}


/* =========================================================
   PRODUCTOS APROBADOS
========================================================= */

function getApprovedProducts() {
  return data.products.filter(
    product => product.status === "approved"
  );
}


/* =========================================================
   RENDER PRODUCTOS
========================================================= */

function renderProducts() {
  const grid = $("productsGrid");
  const empty = $("emptyProducts");
  const count = $("publicationCount");

  if (!grid) return;

  const search =
    $("searchInput")?.value.trim().toLowerCase() || "";

  let products = getApprovedProducts();

  if (selectedCategory !== "Todos") {
    products = products.filter(
      product =>
        product.category === selectedCategory
    );
  }

  if (search) {
    products = products.filter(product => {

      const text = [
        product.title,
        product.category,
        product.location,
        product.description
      ]
        .join(" ")
        .toLowerCase();

      return text.includes(search);
    });
  }

  products.sort(
    (a, b) =>
      new Date(b.createdAt) -
      new Date(a.createdAt)
  );

  count.textContent = products.length;

  grid.innerHTML = "";

  if (!products.length) {
    empty?.classList.remove("hidden");
    return;
  }

  empty?.classList.add("hidden");

  products.forEach(product => {
    grid.appendChild(
      createProductCard(product)
    );
  });
}


/* =========================================================
   TARJETA PRODUCTO
========================================================= */

function createProductCard(product) {

  const card =
    document.createElement("article");

  card.className = "product-card";

  const firstImage =
    product.images?.[0] || "";

  const imageHTML = firstImage
    ? `
      <img
        class="product-image"
        src="${firstImage}"
        alt="${escapeHTML(product.title)}"
        data-product-id="${product.id}">
    `
    : `
      <div class="product-no-image">
        📦
      </div>
    `;

  card.innerHTML = `
    <div class="product-image-container">

      ${imageHTML}

      ${
        product.images?.length > 1
          ? `<span class="image-count">
              📷 ${product.images.length}
             </span>`
          : ""
      }

    </div>

    <div class="product-card-body">

      <div class="product-category">
        ${escapeHTML(product.category)}
      </div>

      <h3>
        ${escapeHTML(product.title)}
      </h3>

      <div class="product-price">
        ${formatPrice(product.price)}
      </div>

      <div class="product-location">
        📍 ${escapeHTML(product.location)}
      </div>

      <div class="product-actions">

        <button
          type="button"
          class="like-btn ${
            product.likes?.includes(data.currentUser)
              ? "active"
              : ""
          }"
          data-action="like"
          data-id="${product.id}">
          👍 ${product.likes?.length || 0}
        </button>

        <button
          type="button"
          class="dislike-btn ${
            product.dislikes?.includes(data.currentUser)
              ? "active"
              : ""
          }"
          data-action="dislike"
          data-id="${product.id}">
          👎 ${product.dislikes?.length || 0}
        </button>

        <button
          type="button"
          class="chat-product-btn"
          data-action="chat"
          data-id="${product.id}">
          💬
        </button>

        <button
          type="button"
          class="whatsapp-btn"
          data-action="whatsapp"
          data-id="${product.id}">
          WhatsApp
        </button>

      </div>

    </div>
  `;

  card
    .querySelector(".product-image")
    ?.addEventListener("click", event => {

      event.stopPropagation();

      openProductDetail(product.id);
    });

  card.addEventListener("click", event => {

    if (
      event.target.closest("button") ||
      event.target.closest("img")
    ) {
      return;
    }

    openProductDetail(product.id);
  });

  card
    .querySelectorAll("[data-action]")
    .forEach(button => {

      button.addEventListener("click", event => {

        event.stopPropagation();

        const action =
          button.dataset.action;

        const id =
          button.dataset.id;

        if (action === "like") {
          toggleLike(id);
        }

        if (action === "dislike") {
          toggleDislike(id);
        }

        if (action === "chat") {
          startChatWithProduct(id);
        }

        if (action === "whatsapp") {
          openWhatsApp(id);
        }
      });
    });

  return card;
}


/* =========================================================
   DETALLE
========================================================= */

function openProductDetail(productId) {

  const product =
    data.products.find(
      item => item.id === productId
    );

  if (!product) {
    showToast("Producto no encontrado.");
    return;
  }

  currentProductId = productId;

  renderProductDetail(product);

  showPage("productDetailPage");
}


function renderProductDetail(product) {

  const container = $("productDetail");

  if (!container) return;

  const owner =
    data.users.find(
      user => user.id === product.userId
    );

  const images = product.images || [];

  let imagesHTML = "";

  if (images.length) {

    imagesHTML = `
      <div class="detail-images">

        <img
          id="detailMainImage"
          class="detail-main-image"
          src="${images[0]}"
          alt="${escapeHTML(product.title)}">

        <div class="expand-image-hint">
          🔍 Toca la imagen para verla grande
        </div>

        <div class="detail-thumbnails">

          ${images.map((image, index) => `
            <button
              type="button"
              class="${
                index === 0 ? "active" : ""
              }"
              data-image-index="${index}">

              <img
                src="${image}"
                alt="Imagen ${index + 1}">

            </button>
          `).join("")}

        </div>

      </div>
    `;

  } else {

    imagesHTML = `
      <div class="detail-images">
        <div class="detail-no-image">
          📦
        </div>
      </div>
    `;
  }

  const userIsOwner =
    data.currentUser &&
    product.userId === data.currentUser;

  container.innerHTML = `
    <article class="detail-card">

      ${imagesHTML}

      <div class="detail-body">

        <div class="product-category">
          ${escapeHTML(product.category)}
        </div>

        <h1>
          ${escapeHTML(product.title)}
        </h1>

        <div class="detail-price">
          ${formatPrice(product.price)}
        </div>

        <div class="detail-location">
          📍 ${escapeHTML(product.location)}
        </div>

        <div class="detail-stats">

          <span>
            👍 ${product.likes?.length || 0} Me gusta
          </span>

          <span>
            👎 ${product.dislikes?.length || 0} No me gusta
          </span>

          <span>
            👤 ${escapeHTML(owner?.name || "Usuario")}
          </span>

        </div>

        <div class="detail-description">
          ${escapeHTML(product.description)}
        </div>

        ${
          userIsOwner
            ? `
              <div class="owner-actions">

                <button
                  type="button"
                  class="edit-product-btn"
                  id="detailEditProductBtn">
                  ✏️ Editar
                </button>

                <button
                  type="button"
                  class="delete-product-btn"
                  id="detailDeleteProductBtn">
                  🗑️ Eliminar
                </button>

              </div>
            `
            : `
              <div class="detail-actions">

                <button
                  type="button"
                  class="like-large-btn ${
                    product.likes?.includes(data.currentUser)
                      ? "active"
                      : ""
                  }"
                  id="detailLikeBtn">
                  👍 ${product.likes?.length || 0}
                </button>

                <button
                  type="button"
                  class="dislike-large-btn ${
                    product.dislikes?.includes(data.currentUser)
                      ? "active"
                      : ""
                  }"
                  id="detailDislikeBtn">
                  👎 ${product.dislikes?.length || 0}
                </button>

                <button
                  type="button"
                  class="chat-large-btn"
                  id="detailChatBtn">
                  💬 Chat
                </button>

                <button
                  type="button"
                  class="whatsapp-large-btn"
                  id="detailWhatsAppBtn">
                  WhatsApp
                </button>

              </div>
            `
        }

      </div>

    </article>
  `;


  if (images.length) {

    $("detailMainImage")?.addEventListener(
      "click",
      () => {
        openImageViewer(images, 0);
      }
    );

    container
      .querySelectorAll("[data-image-index]")
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            const index =
              Number(button.dataset.imageIndex);

            const main =
              $("detailMainImage");

            if (main) {
              main.src = images[index];
            }

            container
              .querySelectorAll(
                "[data-image-index]"
              )
              .forEach(item =>
                item.classList.remove("active")
              );

            button.classList.add("active");

            currentImageIndex = index;
          }
        );
      });
  }


  $("detailLikeBtn")?.addEventListener(
    "click",
    () => toggleLike(product.id)
  );

  $("detailDislikeBtn")?.addEventListener(
    "click",
    () => toggleDislike(product.id)
  );

  $("detailChatBtn")?.addEventListener(
    "click",
    () => startChatWithProduct(product.id)
  );

  $("detailWhatsAppBtn")?.addEventListener(
    "click",
    () => openWhatsApp(product.id)
  );

  $("detailEditProductBtn")?.addEventListener(
    "click",
    () => openEditProduct(product.id)
  );

  $("detailDeleteProductBtn")?.addEventListener(
    "click",
    () => confirmDeleteProduct(product.id)
  );
}


/* =========================================================
   ME GUSTA
========================================================= */

function toggleLike(productId) {

  if (!requireLogin()) return;

  const product =
    data.products.find(
      item => item.id === productId
    );

  if (!product) return;

  product.likes ||= [];
  product.dislikes ||= [];

  const userId = data.currentUser;

  const likedIndex =
    product.likes.indexOf(userId);

  if (likedIndex >= 0) {

    product.likes.splice(likedIndex, 1);

  } else {

    product.likes.push(userId);

    const dislikeIndex =
      product.dislikes.indexOf(userId);

    if (dislikeIndex >= 0) {
      product.dislikes.splice(dislikeIndex, 1);
    }
  }

  saveData();

  renderProducts();

  if (
    $("productDetailPage")?.classList.contains("active")
  ) {
    renderProductDetail(product);
  }
}


/* =========================================================
   NO ME GUSTA
========================================================= */

function toggleDislike(productId) {

  if (!requireLogin()) return;

  const product =
    data.products.find(
      item => item.id === productId
    );

  if (!product) return;

  product.likes ||= [];
  product.dislikes ||= [];

  const userId = data.currentUser;

  const index =
    product.dislikes.indexOf(userId);

  if (index >= 0) {

    product.dislikes.splice(index, 1);

  } else {

    product.dislikes.push(userId);

    const likeIndex =
      product.likes.indexOf(userId);

    if (likeIndex >= 0) {
      product.likes.splice(likeIndex, 1);
    }
  }

  saveData();

  renderProducts();

  if (
    $("productDetailPage")?.classList.contains("active")
  ) {
    renderProductDetail(product);
  }
}


/* =========================================================
   WHATSAPP
========================================================= */

function openWhatsApp(productId) {

  const product =
    data.products.find(
      item => item.id === productId
    );

  if (!product) return;

  const seller =
    data.users.find(
      user => user.id === product.userId
    );

  if (!seller || !seller.phone) {
    showToast("El vendedor no tiene teléfono.");
    return;
  }

  let phone =
    seller.phone.replace(/\D/g, "");

  if (phone.length === 10) {
    phone = "1" + phone;
  }

  const message =
    `Hola, vi tu publicación "${product.title}" en Market Flash y me interesa.`;

  const url =
    `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  window.open(url, "_blank");
}


/* =========================================================
   EDITAR PRODUCTO
========================================================= */

function openEditProduct(productId) {

  if (!requireLogin()) return;

  const product =
    data.products.find(
      item => item.id === productId
    );

  if (!product) return;

  if (product.userId !== data.currentUser) {
    showToast("No puedes editar esta publicación.");
    return;
  }

  editingProductId = productId;

  $("editProductTitle").value =
    product.title || "";

  $("editProductCategory").value =
    product.category || "";

  $("editProductPrice").value =
    product.price || "";

  $("editProductLocation").value =
    product.location || "";

  $("editProductDescription").value =
    product.description || "";

  showPage("editProductPage");
}


function saveEditedProduct(event) {

  if (event) {
    event.preventDefault();
  }

  if (!requireLogin()) return;

  const product =
    data.products.find(
      item => item.id === editingProductId
    );

  if (!product) {
    showToast("Publicación no encontrada.");
    return;
  }

  const title =
    $("editProductTitle").value.trim();

  const category =
    $("editProductCategory").value;

  const price =
    $("editProductPrice").value;

  const location =
    $("editProductLocation").value.trim();

  const description =
    $("editProductDescription").value.trim();

  if (
    !title ||
    !category ||
    !price ||
    !location ||
    !description
  ) {
    showToast("Completa todos los campos.");
    return;
  }

  product.title = title;
  product.category = category;
  product.price = Number(price);
  product.location = location;
  product.description = description;

  saveData();

  showToast("Publicación actualizada.");

  editingProductId = null;

  setTimeout(() => {
    if (currentProductId) {
      openProductDetail(currentProductId);
    } else {
      showPage("myPublicationsPage");
    }
  }, 400);
}


/* =========================================================
   ELIMINAR PRODUCTO
========================================================= */

function confirmDeleteProduct(productId) {

  openConfirm(
    "Eliminar publicación",
    "¿Seguro que quieres eliminar esta publicación completamente?",
    () => deleteProduct(productId)
  );
}


function deleteProduct(productId) {

  const index =
    data.products.findIndex(
      item => item.id === productId
    );

  if (index < 0) {
    showToast("Publicación no encontrada.");
    return;
  }

  const product =
    data.products[index];

  if (
    product.userId !== data.currentUser &&
    !data.adminLogged
  ) {
    showToast("No tienes permiso para eliminarla.");
    return;
  }

  data.products.splice(index, 1);

  data.advertisingRequests =
    data.advertisingRequests.filter(
      request =>
        request.productId !== productId
    );

  saveData();

  closeConfirm();

  showToast("Publicación eliminada completamente.");

  currentProductId = null;

  setTimeout(() => {
    showPage("homePage");
  }, 400);
}


/* =========================================================
   MIS PUBLICACIONES
========================================================= */

function renderMyPublications() {

  const list = $("myPublicationsList");
  const empty = $("emptyMyPublications");

  if (!list) return;

  if (!currentUser()) {
    list.innerHTML = "";
    empty?.classList.remove("hidden");
    return;
  }

  const products =
    data.products
      .filter(
        product =>
          product.userId === data.currentUser
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt) -
          new Date(a.createdAt)
      );

  list.innerHTML = "";

  if (!products.length) {
    empty?.classList.remove("hidden");
    return;
  }

  empty?.classList.add("hidden");

  products.forEach(product => {

    const card =
      document.createElement("div");

    card.className = "form-card";

    card.innerHTML = `
      <div class="section-header">

        <div>
          <h3>
            ${escapeHTML(product.title)}
          </h3>

          <p class="text-muted">
            ${formatPrice(product.price)}
          </p>
        </div>

        <span class="status-badge ${
          product.status === "approved"
            ? "status-approved"
            : product.status === "pending"
              ? "status-pending"
              : "status-rejected"
        }">
          ${
            product.status === "approved"
              ? "Publicada"
              : product.status === "pending"
                ? "Pendiente"
                : "Rechazada"
          }
        </span>

      </div>

      <button
        type="button"
        class="secondary-btn full-btn"
        data-view-product="${product.id}">
        👁️ Ver
      </button>

      <button
        type="button"
        class="primary-btn full-btn"
        data-edit-product="${product.id}">
        ✏️ Editar
      </button>

      <button
        type="button"
        class="danger-btn full-btn"
        data-delete-product="${product.id}">
        🗑️ Eliminar
      </button>
    `;

    card
      .querySelector("[data-view-product]")
      ?.addEventListener(
        "click",
        () => openProductDetail(product.id)
      );

    card
      .querySelector("[data-edit-product]")
      ?.addEventListener(
        "click",
        () => openEditProduct(product.id)
      );

    card
      .querySelector("[data-delete-product]")
      ?.addEventListener(
        "click",
        () => confirmDeleteProduct(product.id)
      );

    list.appendChild(card);
  });
}


/* =========================================================
   CHATS
========================================================= */

function getChatParticipants(chat) {
  return chat.participants || [];
}


function renderChats() {

  const list = $("chatList");
  const empty = $("emptyChats");

  if (!list) return;

  if (!currentUser()) {
    list.innerHTML = "";
    empty?.classList.remove("hidden");
    return;
  }

  const chats =
    data.chats.filter(
      chat =>
        getChatParticipants(chat)
          .includes(data.currentUser)
    );

  list.innerHTML = "";

  if (!chats.length) {
    empty?.classList.remove("hidden");
    return;
  }

  empty?.classList.add("hidden");

  chats.sort(
    (a, b) =>
      new Date(
        b.updatedAt || b.createdAt
      ) -
      new Date(
        a.updatedAt || a.createdAt
      )
  );

  chats.forEach(chat => {

    const otherId =
      chat.participants.find(
        id => id !== data.currentUser
      );

    const otherUser =
      data.users.find(
        user => user.id === otherId
      );

    const lastMessage =
      chat.messages?.[
        chat.messages.length - 1
      ];

    const item =
      document.createElement("div");

    item.className = "chat-list-item";

    item.innerHTML = `
      <div class="chat-list-avatar">
        ${
          otherUser?.photo
            ? `<img src="${otherUser.photo}" alt="">`
            : "👤"
        }
      </div>

      <div class="chat-list-info">

        <strong>
          ${escapeHTML(
            otherUser?.name || "Usuario"
          )}
        </strong>

        <span>
          ${
            lastMessage
              ? escapeHTML(lastMessage.text)
              : "Nueva conversación"
          }
        </span>

      </div>
    `;

    item.addEventListener(
      "click",
      () => openChat(chat.id)
    );

    list.appendChild(item);
  });
}


/* =========================================================
   INICIAR CHAT
========================================================= */

function startChatWithProduct(productId) {

  if (!requireLogin()) return;

  const product =
    data.products.find(
      item => item.id === productId
    );

  if (!product) return;

  if (product.userId === data.currentUser) {
    showToast("Esta es tu propia publicación.");
    return;
  }

  let chat =
    data.chats.find(item =>
      item.productId === productId &&
      item.participants?.includes(data.currentUser) &&
      item.participants?.includes(product.userId)
    );

  if (!chat) {

    chat = {
      id: generateId("chat"),
      productId,
      participants: [
        data.currentUser,
        product.userId
      ],
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    data.chats.push(chat);

    saveData();
  }

  openChat(chat.id);
}


function openChat(chatId) {

  if (!requireLogin()) return;

  const chat =
    data.chats.find(
      item => item.id === chatId
    );

  if (!chat) {
    showToast("Chat no encontrado.");
    return;
  }

  currentChatId = chatId;

  renderChat(chat);

  showPage("chatPage");
}


function renderChat(chat) {

  const otherId =
    chat.participants.find(
      id => id !== data.currentUser
    );

  const otherUser =
    data.users.find(
      user => user.id === otherId
    );

  const product =
    data.products.find(
      item => item.id === chat.productId
    );

  $("chatUserName").textContent =
    otherUser?.name || "Usuario";

  $("chatProductName").textContent =
    product?.title || "Market Flash";

  const container =
    $("messagesContainer");

  if (!container) return;

  container.innerHTML = "";

  if (!chat.messages?.length) {

    const empty =
      document.createElement("div");

    empty.className = "empty-state";

    empty.innerHTML = `
      <div class="empty-icon">💬</div>
      <p>Comienza la conversación.</p>
    `;

    container.appendChild(empty);

  } else {

    chat.messages.forEach(message => {

      const wrapper =
        document.createElement("div");

      wrapper.className =
        "message " +
        (
          message.senderId === data.currentUser
            ? "mine"
            : "received"
        );

      wrapper.innerHTML = `
        <div class="message-bubble">

          ${escapeHTML(message.text)}

          <span class="message-time">
            ${formatTime(message.createdAt)}
          </span>

        </div>
      `;

      container.appendChild(wrapper);
    });
  }

  container.scrollTop =
    container.scrollHeight;
}


function sendChatMessage() {

  if (!requireLogin()) return;

  const input =
    $("chatMessageInput");

  const text =
    input?.value.trim();

  if (!text) return;

  const chat =
    data.chats.find(
      item => item.id === currentChatId
    );

  if (!chat) return;

  chat.messages ||= [];

  chat.messages.push({
    id: generateId("message"),
    senderId: data.currentUser,
    text,
    createdAt: new Date().toISOString()
  });

  chat.updatedAt =
    new Date().toISOString();

  const otherId =
    chat.participants.find(
      id => id !== data.currentUser
    );

  data.notifications.push({
    id: generateId("notification"),
    userId: otherId,
    message:
      `Tienes un nuevo mensaje de ${currentUser().name}.`,
    read: false,
    createdAt: new Date().toISOString()
  });

  saveData();

  input.value = "";

  renderChat(chat);
}


/* =========================================================
   NOTIFICACIONES
========================================================= */

function updateNotificationBadge() {

  const badge =
    $("notificationBadge");

  if (!badge) return;

  if (!currentUser()) {
    badge.classList.add("hidden");
    return;
  }

  const unread =
    data.notifications.filter(
      notification =>
        notification.userId === data.currentUser &&
        !notification.read
    ).length;

  badge.textContent = unread;

  if (unread > 0) {
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }
}


function renderNotifications() {

  const list =
    $("notificationsList");

  if (!list) return;

  if (!currentUser()) {

    list.innerHTML = `
      <div class="empty-notifications">
        Inicia sesión para ver tus notificaciones.
      </div>
    `;

    return;
  }

  const notifications =
    data.notifications
      .filter(
        item =>
          item.userId === data.currentUser
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt) -
          new Date(a.createdAt)
      );

  list.innerHTML = "";

  if (!notifications.length) {

    list.innerHTML = `
      <div class="empty-notifications">
        No tienes notificaciones.
      </div>
    `;

    return;
  }

  notifications.forEach(notification => {

    const item =
      document.createElement("div");

    item.className = "notification-item";

    item.innerHTML = `
      <strong>
        🔔 Market Flash
      </strong>

      <p>
        ${escapeHTML(notification.message)}
      </p>

      <small>
        ${formatDate(notification.createdAt)}
      </small>
    `;

    list.appendChild(item);

    notification.read = true;
  });

  saveData();

  updateNotificationBadge();
}


/* =========================================================
   VISOR DE IMAGEN
========================================================= */

function openImageViewer(images, index = 0) {

  if (!images?.length) return;

  currentImageIndex = index;

  const viewer =
    $("imageViewer");

  const image =
    $("fullScreenImage");

  const counter =
    $("imageViewerCounter");

  image.src = images[currentImageIndex];

  counter.textContent =
    `${currentImageIndex + 1} / ${images.length}`;

  viewer.classList.remove("hidden");

  viewer.dataset.images =
    JSON.stringify(images);
}


function closeImageViewer() {

  $("imageViewer")
    ?.classList.add("hidden");
}


function changeViewerImage(direction) {

  const viewer =
    $("imageViewer");

  if (!viewer) return;

  let images = [];

  try {
    images =
      JSON.parse(
        viewer.dataset.images || "[]"
      );
  } catch {
    images = [];
  }

  if (!images.length) return;

  currentImageIndex += direction;

  if (currentImageIndex < 0) {
    currentImageIndex =
      images.length - 1;
  }

  if (currentImageIndex >= images.length) {
    currentImageIndex = 0;
  }

  $("fullScreenImage").src =
    images[currentImageIndex];

  $("imageViewerCounter").textContent =
    `${currentImageIndex + 1} / ${images.length}`;
}


/* =========================================================
   MODAL CONFIRMACIÓN
========================================================= */

function openConfirm(title, message, callback) {

  $("confirmTitle").textContent = title;
  $("confirmMessage").textContent = message;

  confirmCallback = callback;

  $("confirmModal")
    ?.classList.remove("hidden");
}


function closeConfirm() {

  $("confirmModal")
    ?.classList.add("hidden");

  confirmCallback = null;
}


/* =========================================================
   ADMIN LOGIN
========================================================= */

function loginAdmin() {

  const username =
    $("adminUsername")?.value.trim();

  const password =
    $("adminPassword")?.value;

  if (
    username !== ADMIN_USER ||
    password !== ADMIN_PASSWORD
  ) {
    showToast("Usuario o contraseña incorrectos.");
    return;
  }

  data.adminLogged = true;

  saveData();

  $("adminLoginForm")?.reset();

  showToast("Bienvenido al panel de administración.");

  setTimeout(() => {
    showPage("adminPanelPage");
  }, 300);
}


function logoutAdmin() {

  data.adminLogged = false;

  saveData();

  showPage("homePage");

  showToast("Sesión de administrador cerrada.");
}


/* =========================================================
   ADMIN PANEL
========================================================= */

function renderAdminPanel() {

  if (!data.adminLogged) {
    showPage("adminLoginPage");
    return;
  }

  $("adminUsersCount").textContent =
    data.users.length;

  $("adminProductsCount").textContent =
    data.products.length;

  $("adminAdsCount").textContent =
    data.advertisingRequests.length;

  $("adminChatsCount").textContent =
    data.chats.length;

  $("advertisingToggle").checked =
    Boolean(data.settings.advertisingEnabled);

  $("advertisingPrice").value =
    data.settings.advertisingPrice || 0;

  renderAdminPublications();
  renderPaymentMethods();
  renderAdvertisingRequests();
}


/* =========================================================
   ADMIN PUBLICACIONES
========================================================= */

function renderAdminPublications() {

  const list =
    $("adminPublicationsList");

  if (!list) return;

  list.innerHTML = "";

  const products =
    [...data.products].sort(
      (a, b) =>
        new Date(b.createdAt) -
        new Date(a.createdAt)
    );

  if (!products.length) {

    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📦</div>
        <p>No hay publicaciones.</p>
      </div>
    `;

    return;
  }

  products.forEach(product => {

    const seller =
      data.users.find(
        user => user.id === product.userId
      );

    const card =
      document.createElement("div");

    card.className =
      "admin-publication-card";

    const image =
      product.images?.[0];

    card.innerHTML = `

      <div class="admin-publication-image">

        ${
          image
            ? `<img
                src="${image}"
                alt="${escapeHTML(product.title)}">`
            : "📦"
        }

      </div>

      <div class="admin-publication-main">

        <div class="admin-publication-info">

          <h3>
            ${escapeHTML(product.title)}
          </h3>

          <p>
            ${formatPrice(product.price)}
            · ${escapeHTML(seller?.name || "Usuario")}
          </p>

          <span class="status-badge ${
            product.status === "approved"
              ? "status-approved"
              : product.status === "pending"
                ? "status-pending"
                : "status-rejected"
          }">

            ${
              product.status === "approved"
                ? "Aprobada"
                : product.status === "pending"
                  ? "Pendiente"
                  : "Rechazada"
            }

          </span>

        </div>

      </div>

      <div class="admin-publication-actions">

        <button
          type="button"
          class="admin-action receipt-action"
          data-admin-action="receipt"
          data-id="${product.id}">
          Ver comprobante
        </button>

        <button
          type="button"
          class="admin-action approve-action"
          data-admin-action="approve"
          data-id="${product.id}">
          Aprobar
        </button>

        <button
          type="button"
          class="admin-action reject-action"
          data-admin-action="reject"
          data-id="${product.id}">
          Rechazar
        </button>

        <button
          type="button"
          class="admin-action delete-action"
          data-admin-action="delete"
          data-id="${product.id}">
          Eliminar
        </button>

      </div>
    `;

    card
      .querySelectorAll("[data-admin-action]")
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            const action =
              button.dataset.adminAction;

            const id =
              button.dataset.id;

            if (action === "receipt") {
              showReceipt(id);
            }

            if (action === "approve") {
              approveProduct(id);
            }

            if (action === "reject") {
              rejectProduct(id);
            }

            if (action === "delete") {
              adminDeleteProduct(id);
            }
          }
        );
      });

    list.appendChild(card);
  });
}


/* =========================================================
   APROBAR
========================================================= */

function approveProduct(productId) {

  if (!data.adminLogged) return;

  const product =
    data.products.find(
      item => item.id === productId
    );

  if (!product) return;

  product.status = "approved";

  data.notifications.push({
    id: generateId("notification"),
    userId: product.userId,
    message:
      `Tu publicación "${product.title}" fue aprobada.`,
    read: false,
    createdAt: new Date().toISOString()
  });

  saveData();

  renderAdminPanel();

  showToast("Publicación aprobada.");
}


/* =========================================================
   RECHAZAR
========================================================= */

function rejectProduct(productId) {

  if (!data.adminLogged) return;

  const product =
    data.products.find(
      item => item.id === productId
    );

  if (!product) return;

  product.status = "rejected";

  data.notifications.push({
    id: generateId("notification"),
    userId: product.userId,
    message:
      `Tu publicación "${product.title}" fue rechazada.`,
    read: false,
    createdAt: new Date().toISOString()
  });

  saveData();

  renderAdminPanel();

  showToast("Publicación rechazada.");
}


/* =========================================================
   ELIMINAR ADMIN
========================================================= */

function adminDeleteProduct(productId) {

  if (!data.adminLogged) return;

  openConfirm(
    "Eliminar publicación",
    "Esta publicación será eliminada completamente. ¿Continuar?",
    () => {

      const index =
        data.products.findIndex(
          item => item.id === productId
        );

      if (index < 0) return;

      const product =
        data.products[index];

      data.products.splice(index, 1);

      data.advertisingRequests =
        data.advertisingRequests.filter(
          request =>
            request.productId !== productId
        );

      saveData();

      closeConfirm();

      renderAdminPanel();

      showToast("Publicación eliminada completamente.");
    }
  );
}


/* =========================================================
   COMPROBANTE
========================================================= */

function showReceipt(productId) {

  const product =
    data.products.find(
      item => item.id === productId
    );

  if (!product) return;

  const seller =
    data.users.find(
      user => user.id === product.userId
    );

  $("receiptContent").innerHTML = `
    <div class="receipt">

      <div class="receipt-header">

        <h2>Market Flash</h2>

        <p>
          Comprobante de publicación
        </p>

      </div>

      <div class="receipt-row">
        <strong>Producto</strong>
        <span>
          ${escapeHTML(product.title)}
        </span>
      </div>

      <div class="receipt-row">
        <strong>Vendedor</strong>
        <span>
          ${escapeHTML(seller?.name || "Usuario")}
        </span>
      </div>

      <div class="receipt-row">
        <strong>Teléfono</strong>
        <span>
          ${escapeHTML(seller?.phone || "")}
        </span>
      </div>

      <div class="receipt-row">
        <strong>Precio</strong>
        <span>
          ${formatPrice(product.price)}
        </span>
      </div>

      <div class="receipt-row">
        <strong>Estado</strong>
        <span>
          ${
            product.status === "approved"
              ? "Aprobada"
              : product.status === "pending"
                ? "Pendiente"
                : "Rechazada"
          }
        </span>
      </div>

      <div class="receipt-row">
        <strong>Fecha</strong>
        <span>
          ${formatDate(product.createdAt)}
        </span>
      </div>

    </div>
  `;

  $("receiptModal")
    ?.classList.remove("hidden");
}


/* =========================================================
   CONFIGURACIÓN ADMIN
========================================================= */

function saveAdvertisingSettings() {

  if (!data.adminLogged) return;

  data.settings.advertisingEnabled =
    $("advertisingToggle").checked;

  data.settings.advertisingPrice =
    Number(
      $("advertisingPrice").value
    ) || 0;

  saveData();

  showToast("Configuración guardada.");

  renderAdminPanel();
}


/* =========================================================
   MÉTODOS DE PAGO
========================================================= */

function renderPaymentMethods() {

  const list =
    $("paymentMethodsList");

  if (!list) return;

  list.innerHTML = "";

  if (!data.paymentMethods.length) {

    list.innerHTML = `
      <div class="empty-state">
        No hay métodos de pago.
      </div>
    `;

    return;
  }

  data.paymentMethods.forEach(method => {

    const card =
      document.createElement("div");

    card.className =
      "payment-method-card";

    card.innerHTML = `

      <div class="payment-method-icon">
        💳
      </div>

      <div class="payment-method-info">

        <strong>
          ${escapeHTML(method.name)}
        </strong>

        <div class="payment-method-price">
          ${formatPrice(method.price)}
        </div>

      </div>

      <div class="payment-method-actions">

        <button
          type="button"
          class="secondary-btn"
          data-payment-edit="${method.id}">
          ✏️
        </button>

        <button
          type="button"
          class="danger-icon-btn"
          data-payment-delete="${method.id}">
          🗑️
        </button>

      </div>
    `;

    card
      .querySelector("[data-payment-edit]")
      ?.addEventListener(
        "click",
        () => openPaymentMethodModal(method.id)
      );

    card
      .querySelector("[data-payment-delete]")
      ?.addEventListener(
        "click",
        () => deletePaymentMethod(method.id)
      );

    list.appendChild(card);
  });
}


function openPaymentMethodModal(methodId = null) {

  if (!data.adminLogged) return;

  editingPaymentMethodId = methodId;

  if (methodId) {

    const method =
      data.paymentMethods.find(
        item => item.id === methodId
      );

    if (!method) return;

    $("paymentModalTitle").textContent =
      "Editar método de pago";

    $("paymentMethodName").value =
      method.name;

    $("paymentMethodPrice").value =
      method.price;

  } else {

    $("paymentModalTitle").textContent =
      "Agregar método de pago";

    $("paymentMethodName").value = "";
    $("paymentMethodPrice").value = 0;
  }

  $("paymentMethodModal")
    ?.classList.remove("hidden");
}


function closePaymentMethodModal() {

  $("paymentMethodModal")
    ?.classList.add("hidden");

  editingPaymentMethodId = null;
}


function savePaymentMethod() {

  if (!data.adminLogged) return;

  const name =
    $("paymentMethodName").value.trim();

  const price =
    Number(
      $("paymentMethodPrice").value
    ) || 0;

  if (!name) {
    showToast("Escribe el nombre del método.");
    return;
  }

  if (editingPaymentMethodId) {

    const method =
      data.paymentMethods.find(
        item =>
          item.id === editingPaymentMethodId
      );

    if (method) {
      method.name = name;
      method.price = price;
    }

  } else {

    data.paymentMethods.push({
      id: generateId("payment"),
      name,
      price
    });
  }

  saveData();

  closePaymentMethodModal();

  renderPaymentMethods();

  showToast("Método de pago guardado.");
}


function deletePaymentMethod(methodId) {

  if (!data.adminLogged) return;

  openConfirm(
    "Eliminar método de pago",
    "¿Quieres eliminar este método de pago?",
    () => {

      data.paymentMethods =
        data.paymentMethods.filter(
          method =>
            method.id !== methodId
        );

      saveData();

      closeConfirm();

      renderPaymentMethods();

      showToast("Método eliminado.");
    }
  );
}


/* =========================================================
   PUBLICIDAD
========================================================= */

function renderAdvertisingRequests() {

  const container =
    $("adminAdvertisingRequests");

  if (!container) return;

  container.innerHTML = "";

  if (!data.advertisingRequests.length) {

    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📢</div>
        <p>No hay solicitudes de publicidad.</p>
      </div>
    `;

    return;
  }

  data.advertisingRequests.forEach(request => {

    const product =
      data.products.find(
        item =>
          item.id === request.productId
      );

    const user =
      data.users.find(
        item =>
          item.id === request.userId
      );

    const card =
      document.createElement("div");

    card.className =
      "admin-request-card";

    card.innerHTML = `

      <h3>
        ${escapeHTML(
          product?.title || "Producto eliminado"
        )}
      </h3>

      <p>
        Usuario:
        ${escapeHTML(
          user?.name || "Usuario"
        )}
      </p>

      <p>
        Estado:
        ${escapeHTML(request.status)}
      </p>

      <div class="request-actions">

        <button
          type="button"
          class="primary-btn"
          data-ad-approve="${request.id}">
          Aprobar
        </button>

        <button
          type="button"
          class="danger-btn"
          data-ad-reject="${request.id}">
          Rechazar
        </button>

      </div>
    `;

    card
      .querySelector("[data-ad-approve]")
      ?.addEventListener(
        "click",
        () => approveAdvertisingRequest(request.id)
      );

    card
      .querySelector("[data-ad-reject]")
      ?.addEventListener(
        "click",
        () => rejectAdvertisingRequest(request.id)
      );

    container.appendChild(card);
  });
}


function requestAdvertising() {

  if (!requireLogin()) return;

  if (!data.settings.advertisingEnabled) {
    showToast(
      "La publicidad pagada está desactivada actualmente."
    );
    return;
  }

  const productId =
    $("advertisingProduct")?.value;

  if (!productId) {
    showToast("Selecciona una publicación.");
    return;
  }

  const existing =
    data.advertisingRequests.find(
      request =>
        request.productId === productId &&
        request.userId === data.currentUser &&
        request.status === "pending"
    );

  if (existing) {
    showToast("Ya tienes una solicitud pendiente.");
    return;
  }

  data.advertisingRequests.push({
    id: generateId("ad"),
    productId,
    userId: data.currentUser,
    price: data.settings.advertisingPrice,
    status: "pending",
    createdAt: new Date().toISOString()
  });

  saveData();

  showToast("Solicitud de publicidad enviada.");

  showPage("advertisingStatusPage");
}


function approveAdvertisingRequest(requestId) {

  if (!data.adminLogged) return;

  const request =
    data.advertisingRequests.find(
      item => item.id === requestId
    );

  if (!request) return;

  request.status = "approved";

  data.notifications.push({
    id: generateId("notification"),
    userId: request.userId,
    message:
      "Tu solicitud de publicidad fue aprobada.",
    read: false,
    createdAt: new Date().toISOString()
  });

  saveData();

  renderAdminPanel();

  showToast("Publicidad aprobada.");
}


function rejectAdvertisingRequest(requestId) {

  if (!data.adminLogged) return;

  const request =
    data.advertisingRequests.find(
      item => item.id === requestId
    );

  if (!request) return;

  request.status = "rejected";

  data.notifications.push({
    id: generateId("notification"),
    userId: request.userId,
    message:
      "Tu solicitud de publicidad fue rechazada.",
    read: false,
    createdAt: new Date().toISOString()
  });

  saveData();

  renderAdminPanel();

  showToast("Publicidad rechazada.");
}


/* =========================================================
   RELLENAR PUBLICIDAD
========================================================= */

function renderAdvertisingProducts() {

  const select =
    $("advertisingProduct");

  if (!select || !currentUser()) return;

  const products =
    data.products.filter(
      product =>
        product.userId === data.currentUser
    );

  select.innerHTML =
    `<option value="">Selecciona una publicación</option>`;

  products.forEach(product => {

    const option =
      document.createElement("option");

    option.value = product.id;

    option.textContent =
      `${product.title} — ${formatPrice(product.price)}`;

    select.appendChild(option);
  });

  updateAdvertisingPriceInfo();
}


function updateAdvertisingPriceInfo() {

  const info =
    $("advertisingPriceInfo");

  if (!info) return;

  info.textContent =
    `Precio de promoción: ${formatPrice(
      data.settings.advertisingPrice
    )}`;
}


/* =========================================================
   CONFIGURACIÓN NOTIFICACIONES
========================================================= */

function saveNotificationSetting() {

  if (!currentUser()) return;

  data.settings.notificationsEnabled =
    $("notificationsToggle").checked;

  saveData();

  showToast("Configuración guardada.");
}


/* =========================================================
   EVENTOS
========================================================= */

function setupEvents() {

  /* -----------------------------------------
     NAVEGACIÓN INFERIOR
  ----------------------------------------- */

  $("navHomeBtn")?.addEventListener(
    "click",
    () => showPage("homePage")
  );

  $("navActivityBtn")?.addEventListener(
    "click",
    () => showPage("activityPage")
  );

  $("navPublishBtn")?.addEventListener(
    "click",
    () => {
      if (requireLogin()) {
        showPage("publishPage");
      }
    }
  );

  $("navChatsBtn")?.addEventListener(
    "click",
    () => {
      if (requireLogin()) {
        showPage("chatsPage");
      }
    }
  );

  $("navProfileBtn")?.addEventListener(
    "click",
    () => showPage("profilePage")
  );


  /* -----------------------------------------
     LOGIN
  ----------------------------------------- */

  $("loginForm")?.addEventListener(
    "submit",
    event => {
      event.preventDefault();
      loginUser();
    }
  );

  $("goRegisterBtn")?.addEventListener(
    "click",
    () => showPage("registerPage")
  );

  $("goRecoveryBtn")?.addEventListener(
    "click",
    () => showPage("recoveryPage")
  );

  $("goLoginBtn")?.addEventListener(
    "click",
    () => showPage("loginPage")
  );

  $("recoveryBackBtn")?.addEventListener(
    "click",
    () => showPage("loginPage")
  );


  /* -----------------------------------------
     REGISTRO
  ----------------------------------------- */

  $("registerForm")?.addEventListener(
    "submit",
    event => {
      event.preventDefault();
      registerUser();
    }
  );


  /* -----------------------------------------
     RECUPERACIÓN
  ----------------------------------------- */

  $("recoveryForm")?.addEventListener(
    "submit",
    event => {
      event.preventDefault();
      recoverAccount();
    }
  );


  /* -----------------------------------------
     PERFIL
  ----------------------------------------- */

  $("profileTopBtn")?.addEventListener(
    "click",
    () => showPage("profilePage")
  );

  $("editProfileBtn")?.addEventListener(
    "click",
    openEditProfile
  );

  $("saveProfileBtn")?.addEventListener(
    "click",
    event => {
      event.preventDefault();
      saveProfile();
    }
  );

  $("editProfileForm")?.addEventListener(
    "submit",
    event => {
      event.preventDefault();
      saveProfile
