/* =========================================================
   MARKET FLASH — script.js
   ========================================================= */

const STORAGE_KEY = "marketFlashData";

const defaultData = {
  users: [],
  products: [],
  chats: [],
  notifications: [],
  paymentMethods: [
    { id: "cash", name: "Pago en efectivo", price: 0, icon: "💵" },
    { id: "transfer", name: "Transferencia bancaria", price: 0, icon: "🏦" }
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

let data = loadData();
let currentProductId = null;
let currentChatId = null;
let currentDetailImages = [];
let currentDetailImageIndex = 0;
let selectedCategory = "Todos";

/* =========================================================
   STORAGE
   ========================================================= */

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
      settings: {
        ...defaultData.settings,
        ...(parsed.settings || {})
      }
    };
  } catch (error) {
    console.error(error);
    return structuredClone(defaultData);
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/* =========================================================
   HELPERS
   ========================================================= */

function $(id) {
  return document.getElementById(id);
}

function all(selector) {
  return [...document.querySelectorAll(selector)];
}

function escapeHTML(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function uid(prefix = "id") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function money(value) {
  const number = Number(value) || 0;

  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    maximumFractionDigits: 0
  }).format(number);
}

function formatDate(date = new Date()) {
  return new Date(date).toLocaleDateString("es-DO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function formatTime(date = new Date()) {
  return new Date(date).toLocaleTimeString("es-DO", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function currentUser() {
  if (!data.currentUser) return null;

  return data.users.find(
    user => user.id === data.currentUser
  ) || null;
}

function isLogged() {
  return !!currentUser();
}

function requireLogin() {
  if (!isLogged()) {
    showPage("loginPage");
    toast("Debes iniciar sesión primero.");
    return false;
  }

  return true;
}

/* =========================================================
   TOAST
   ========================================================= */

function toast(message) {
  const element = $("toast");

  if (!element) return;

  element.textContent = message;
  element.classList.add("show");

  clearTimeout(window.marketFlashToastTimer);

  window.marketFlashToastTimer = setTimeout(() => {
    element.classList.remove("show");
  }, 2800);
}

/* =========================================================
   PAGE NAVIGATION
   ========================================================= */

function showPage(pageId) {
  all(".page").forEach(page => {
    page.classList.remove("active");
  });

  const page = $(pageId);

  if (page) {
    page.classList.add("active");
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

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
    renderChatList();
  }

  if (pageId === "adminPanelPage") {
    renderAdmin();
  }
}

function updateNavigation(pageId) {
  all(".nav-item").forEach(button => {
    button.classList.remove("active");
  });

  const map = {
    homePage: "homeNavBtn",
    activityPage: "activityNavBtn",
    publishPage: "publishNavBtn",
    chatsPage: "chatsNavBtn",
    profilePage: "profileNavBtn"
  };

  const buttonId = map[pageId];

  if ($(buttonId)) {
    $(buttonId).classList.add("active");
  }
}

/* =========================================================
   AUTH
   ========================================================= */

function registerUser() {
  const name = $("registerName")?.value.trim();
  const phone = $("registerPhone")?.value.trim();
  const cedula = $("registerCedula")?.value.trim();
  const password = $("registerPassword")?.value;

  if (!name || !phone || !cedula || !password) {
    toast("Completa todos los campos.");
    return;
  }

  const exists = data.users.some(
    user => user.phone === phone || user.cedula === cedula
  );

  if (exists) {
    toast("Ese teléfono o cédula ya está registrado.");
    return;
  }

  const user = {
    id: uid("user"),
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

  toast("Cuenta creada correctamente.");

  clearRegisterForm();
  showPage("homePage");
  renderProfile();
}

function loginUser() {
  const phone = $("loginPhone")?.value.trim();
  const password = $("loginPassword")?.value;

  if (!phone || !password) {
    toast("Escribe tu teléfono y contraseña.");
    return;
  }

  const user = data.users.find(
    item => item.phone === phone && item.password === password
  );

  if (!user) {
    toast("Teléfono o contraseña incorrectos.");
    return;
  }

  data.currentUser = user.id;
  saveData();

  toast(`Bienvenido, ${user.name}.`);

  showPage("homePage");
  renderProfile();
}

function logoutUser() {
  data.currentUser = null;
  saveData();

  showPage("loginPage");
  toast("Sesión cerrada.");
}

function clearRegisterForm() {
  ["registerName", "registerPhone", "registerCedula", "registerPassword"]
    .forEach(id => {
      if ($(id)) $(id).value = "";
    });
}

function recoverPassword() {
  const phone = $("recoveryPhone")?.value.trim();

  if (!phone) {
    toast("Escribe tu teléfono.");
    return;
  }

  const user = data.users.find(item => item.phone === phone);

  if (!user) {
    toast("No encontramos una cuenta con ese teléfono.");
    return;
  }

  toast("Cuenta encontrada. Contacta al administrador para recuperar el acceso.");
}

/* =========================================================
   PROFILE
   ========================================================= */

function renderProfile() {
  const user = currentUser();

  if (!user) return;

  if ($("profileName")) {
    $("profileName").textContent = user.name;
  }

  if ($("profilePhone")) {
    $("profilePhone").textContent = user.phone;
  }

  if ($("profileAvatar")) {
    $("profileAvatar").src =
      user.photo ||
      "https://ui-avatars.com/api/?name=" +
      encodeURIComponent(user.name) +
      "&background=ff5a1f&color=fff";
  }
}

function saveProfile() {
  const user = currentUser();

  if (!user) return;

  const name = $("editProfileName")?.value.trim();
  const phone = $("editProfilePhone")?.value.trim();

  if (!name || !phone) {
    toast("Completa los datos.");
    return;
  }

  user.name = name;
  user.phone = phone;

  saveData();

  renderProfile();
  showPage("profilePage");

  toast("Perfil actualizado.");
}

function loadEditProfile() {
  const user = currentUser();

  if (!user) return;

  if ($("editProfileName")) {
    $("editProfileName").value = user.name;
  }

  if ($("editProfilePhone")) {
    $("editProfilePhone").value = user.phone;
  }

  showPage("editProfilePage");
}

/* =========================================================
   PROFILE PHOTO
   ========================================================= */

function handleProfileImage(event) {
  const file = event.target.files?.[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    const user = currentUser();

    if (!user) return;

    user.photo = reader.result;

    saveData();
    renderProfile();

    toast("Foto de perfil actualizada.");
  };

  reader.readAsDataURL(file);
}

/* =========================================================
   PRODUCTS
   ========================================================= */

function getApprovedProducts() {
  return data.products.filter(
    product => product.status !== "rejected" && product.status !== "pending"
  );
}

function renderProducts() {
  const grid = $("productsGrid");
  const empty = $("emptyProducts");

  if (!grid) return;

  const search = $("searchInput")?.value.trim().toLowerCase() || "";

  let products = getApprovedProducts();

  if (selectedCategory !== "Todos") {
    products = products.filter(
      product => product.category === selectedCategory
    );
  }

  if (search) {
    products = products.filter(product => {
      const text = [
        product.title,
        product.description,
        product.category,
        product.location
      ]
        .join(" ")
        .toLowerCase();

      return text.includes(search);
    });
  }

  grid.innerHTML = "";

  if (!products.length) {
    if (empty) empty.classList.remove("hidden");
    updatePublicationCount(0);
    return;
  }

  if (empty) empty.classList.add("hidden");

  products.forEach(product => {
    grid.appendChild(createProductCard(product));
  });

  updatePublicationCount(products.length);
}

function updatePublicationCount(count) {
  all(".publication-count").forEach(element => {
    element.textContent = `${count} publicación${count === 1 ? "" : "es"}`;
  });
}

function createProductCard(product) {
  const card = document.createElement("article");

  card.className = "product-card";

  const images = Array.isArray(product.images)
    ? product.images
    : [];

  const firstImage = images[0] || "";

  card.innerHTML = `
    <div class="product-image-container"
         onclick="openProductDetail('${product.id}')">

      ${
        firstImage
          ? `<img class="product-image"
                  src="${firstImage}"
                  alt="${escapeHTML(product.title)}">`
          : `<div class="product-no-image">📷</div>`
      }

      ${
        images.length > 1
          ? `<span class="image-count">📷 ${images.length}</span>`
          : ""
      }
    </div>

    <div class="product-card-body">

      <div class="product-category">
        ${escapeHTML(product.category || "General")}
      </div>

      <div class="product-price">
        ${money(product.price)}
      </div>

      <div class="product-location">
        📍 ${escapeHTML(product.location || "República Dominicana")}
      </div>

      <h3 class="mt-1">
        ${escapeHTML(product.title)}
      </h3>

      <div class="product-actions">

        <button
          class="like-btn ${product.likes?.includes(data.currentUser) ? "active" : ""}"
          onclick="event.stopPropagation(); toggleLike('${product.id}')">
          👍 ${product.likes?.length || 0}
        </button>

        <button
          class="dislike-btn ${product.dislikes?.includes(data.currentUser) ? "active" : ""}"
          onclick="event.stopPropagation(); toggleDislike('${product.id}')">
          👎 ${product.dislikes?.length || 0}
        </button>

        <button
          class="chat-product-btn"
          onclick="event.stopPropagation(); startChat('${product.id}')">
          💬 Chat
        </button>

        <button
          class="whatsapp-btn"
          onclick="event.stopPropagation(); contactWhatsApp('${product.id}')">
          WhatsApp
        </button>

      </div>
    </div>
  `;

  return card;
}

/* =========================================================
   PRODUCT DETAIL
   ========================================================= */

function openProductDetail(productId) {
  const product = data.products.find(
    item => item.id === productId
  );

  if (!product) return;

  currentProductId = productId;

  const container = $("productDetail");

  if (!container) return;

  const images = Array.isArray(product.images)
    ? product.images
    : [];

  currentDetailImages = images;
  currentDetailImageIndex = 0;

  const owner = data.users.find(
    user => user.id === product.userId
  );

  const isOwner =
    !!currentUser() &&
    currentUser().id === product.userId;

  container.innerHTML = `
    <div class="detail-card">

      <div class="detail-images">

        ${
          images.length
            ? `
              <img
                id="detailMainImage"
                class="detail-main-image"
                src="${images[0]}"
                alt="${escapeHTML(product.title)}"
                onclick="openImageViewer(0)">
            `
            : `
              <div class="detail-no-image">
                📷
              </div>
            `
        }

        ${
          images.length
            ? `<div class="expand-image-hint">
                 🔍 Toca la imagen para verla grande
               </div>`
            : ""
        }

        ${
          images.length > 1
            ? `
              <div class="detail-thumbnails">
                ${images.map((image, index) => `
                  <button
                    class="${index === 0 ? "active" : ""}"
                    onclick="changeDetailImage(${index})">
                    <img src="${image}" alt="">
                  </button>
                `).join("")}
              </div>
            `
            : ""
        }

      </div>

      <div class="detail-body">

        <div class="product-category">
          ${escapeHTML(product.category || "General")}
        </div>

        <h1>${escapeHTML(product.title)}</h1>

        <div class="detail-price">
          ${money(product.price)}
        </div>

        <div class="detail-location">
          📍 ${escapeHTML(product.location || "República Dominicana")}
        </div>

        <div class="detail-stats">
          <span>👍 ${product.likes?.length || 0}</span>
          <span>👎 ${product.dislikes?.length || 0}</span>
          <span>👁️ ${product.views || 0}</span>
        </div>

        <div class="detail-description">
          ${escapeHTML(product.description || "Sin descripción.")}
        </div>

        <div class="mt-2 text-muted">
          Vendedor: <strong>${escapeHTML(owner?.name || "Usuario")}</strong>
        </div>

        <div class="detail-actions">

          <button
            class="like-large-btn ${product.likes?.includes(data.currentUser) ? "active" : ""}"
            onclick="toggleLike('${product.id}')">
            👍 Me gusta
          </button>

          <button
            class="dislike-large-btn ${product.dislikes?.includes(data.currentUser) ? "active" : ""}"
            onclick="toggleDislike('${product.id}')">
            👎 No me gusta
          </button>

          <button
            class="chat-large-btn"
            onclick="startChat('${product.id}')">
            💬 Chat
          </button>

          <button
            class="whatsapp-large-btn"
            onclick="contactWhatsApp('${product.id}')">
            WhatsApp
          </button>

        </div>

        ${
          isOwner
            ? `
              <div class="owner-actions">

                <button
                  class="edit-product-btn"
                  onclick="editProduct('${product.id}')">
                  ✏️ Editar
                </button>

                <button
                  class="delete-product-btn"
                  onclick="deleteProduct('${product.id}')">
                  🗑️ Eliminar
                </button>

              </div>
            `
            : ""
        }

      </div>
    </div>
  `;

  product.views = (product.views || 0) + 1;
  saveData();

  showPage("productDetailPage");
}

function changeDetailImage(index) {
  if (!currentDetailImages[index]) return;

  currentDetailImageIndex = index;

  const image = $("detailMainImage");

  if (image) {
    image.src = currentDetailImages[index];
  }

  all(".detail-thumbnails button").forEach((button, i) => {
    button.classList.toggle("active", i === index);
  });
}

/* =========================================================
   IMAGE VIEWER
   ========================================================= */

function openImageViewer(index = 0) {
  if (!currentDetailImages.length) return;

  currentDetailImageIndex = index;

  const viewer = $("imageViewer");
  const image = $("fullScreenImage");
  const counter = $("imageViewerCounter");

  if (!viewer || !image) return;

  image.src = currentDetailImages[index];

  if (counter) {
    counter.textContent =
      `${index + 1} / ${currentDetailImages.length}`;
  }

  viewer.classList.remove("hidden");
}

function closeImageViewer() {
  $("imageViewer")?.classList.add("hidden");
}

function nextDetailImage() {
  if (!currentDetailImages.length) return;

  currentDetailImageIndex =
    (currentDetailImageIndex + 1) %
    currentDetailImages.length;

  openImageViewer(currentDetailImageIndex);
}

function previousDetailImage() {
  if (!currentDetailImages.length) return;

  currentDetailImageIndex =
    (currentDetailImageIndex - 1 + currentDetailImages.length) %
    currentDetailImages.length;

  openImageViewer(currentDetailImageIndex);
}

/* =========================================================
   LIKE / DISLIKE
   ========================================================= */

function toggleLike(productId) {
  if (!requireLogin()) return;

  const product = data.products.find(
    item => item.id === productId
  );

  if (!product) return;

  product.likes ||= [];
  product.dislikes ||= [];

  const userId = data.currentUser;

  product.dislikes =
    product.dislikes.filter(id => id !== userId);

  if (product.likes.includes(userId)) {
    product.likes =
      product.likes.filter(id => id !== userId);
  } else {
    product.likes.push(userId);
  }

  saveData();

  if ($("productDetailPage")?.classList.contains("active")) {
    openProductDetail(productId);
  } else {
    renderProducts();
  }
}

function toggleDislike(productId) {
  if (!requireLogin()) return;

  const product = data.products.find(
    item => item.id === productId
  );

  if (!product) return;

  product.likes ||= [];
  product.dislikes ||= [];

  const userId = data.currentUser;

  product.likes =
    product.likes.filter(id => id !== userId);

  if (product.dislikes.includes(userId)) {
    product.dislikes =
      product.dislikes.filter(id => id !== userId);
  } else {
    product.dislikes.push(userId);
  }

  saveData();

  if ($("productDetailPage")?.classList.contains("active")) {
    openProductDetail(productId);
  } else {
    renderProducts();
  }
}

/* =========================================================
   PUBLISH IMAGE HANDLING
   ========================================================= */

let selectedImages = [];

function handleProductImages(event) {
  const files = [...(event.target.files || [])];

  if (!files.length) return;

  files.forEach(file => {
    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();

    reader.onload = () => {
      selectedImages.push(reader.result);
      renderImagePreview();
    };

    reader.readAsDataURL(file);
  });

  event.target.value = "";
}

function renderImagePreview() {
  const preview = $("imagePreview");

  if (!preview) return;

  preview.innerHTML = "";

  selectedImages.forEach((image, index) => {
    const wrapper = document.createElement("div");

    wrapper.className = "preview-image-wrapper";

    wrapper.innerHTML = `
      <img src="${image}" alt="Vista previa">

      <button
        type="button"
        onclick="removeSelectedImage(${index})">
        ×
      </button>
    `;

    preview.appendChild(wrapper);
  });
}

function removeSelectedImage(index) {
  selectedImages.splice(index, 1);
  renderImagePreview();
}

/* =========================================================
   PUBLISH PRODUCT
   ========================================================= */

function publishProduct() {
  if (!requireLogin()) return;

  const title = $("productTitle")?.value.trim();
  const category = $("productCategory")?.value;
  const price = $("productPrice")?.value;
  const location = $("productLocation")?.value.trim();
  const description = $("productDescription")?.value.trim();

  if (!title || !category || !price || !location) {
    toast("Completa los datos de la publicación.");
    return;
  }

  if (!selectedImages.length) {
    toast("Agrega al menos una foto.");
    return;
  }

  const product = {
    id: uid("product"),
    userId: data.currentUser,
    title,
    category,
    price: Number(price),
    location,
    description,
    images: [...selectedImages],
    likes: [],
    dislikes: [],
    views: 0,
    status: "pending",
    createdAt: new Date().toISOString()
  };

  data.products.push(product);

  data.notifications.unshift({
    id: uid("notification"),
    type: "admin",
    title: "Nueva publicación",
    message: `${currentUser()?.name || "Usuario"} publicó "${title}".`,
    createdAt: new Date().toISOString()
  });

  saveData();

  clearPublishForm();

  toast(
    data.settings.advertisingEnabled
      ? "Publicación enviada para aprobación."
      : "Publicación creada."
  );

  showPage("myPublicationsPage");
}

function clearPublishForm() {
  [
    "productTitle",
    "productPrice",
    "productLocation",
    "productDescription"
  ].forEach(id => {
    if ($(id)) $(id).value = "";
  });

  if ($("productCategory")) {
    $("productCategory").selectedIndex = 0;
  }

  selectedImages = [];
  renderImagePreview();
}

/* =========================================================
   MY PUBLICATIONS
   ========================================================= */

function renderMyPublications() {
  const container = $("myPublicationsList");

  if (!container) return;

  const user = currentUser();

  if (!user) {
    container.innerHTML =
      `<p class="text-muted text-center">Inicia sesión para ver tus publicaciones.</p>`;
    return;
  }

  const products = data.products.filter(
    product => product.userId === user.id
  );

  container.innerHTML = "";

  if (!products.length) {
    container.innerHTML =
      `<p class="text-muted text-center">Todavía no tienes publicaciones.</p>`;
    return;
  }

  products.forEach(product => {
    const element = document.createElement("div");

    element.className = "admin-publication-card";

    element.innerHTML = `
      <div class="admin-publication-main">

        <div class="admin-publication-image">
          ${
            product.images?.[0]
              ? `<img src="${product.images[0]}" alt="">`
              : "📷"
          }
        </div>

        <div class="admin-publication-info">

          <strong>${escapeHTML(product.title)}</strong>

          <p>${money(product.price)}</p>

          <span class="status-badge status-${product.status}">
            ${
              product.status === "approved"
                ? "Aprobada"
                : product.status === "rejected"
                ? "Rechazada"
                : "Pendiente"
            }
          </span>

        </div>
      </div>

      <div class="admin-publication-actions">

        <button
          class="admin-action"
          onclick="openProductDetail('${product.id}')">
          👁️ Ver
        </button>

        <button
          class="admin-action approve-action"
          onclick="editProduct('${product.id}')">
          ✏️ Editar
        </button>

        <button
          class="admin-action delete-action"
          onclick="deleteProduct('${product.id}')">
          🗑️ Eliminar
        </button>

        <button
          class="admin-action receipt-action"
          onclick="showReceipt('${product.id}')">
          🧾 Recibo
        </button>

      </div>
    `;

    container.appendChild(element);
  });
}

/* =========================================================
   EDIT PRODUCT
   ========================================================= */

function editProduct(productId) {
  if (!requireLogin()) return;

  const product = data.products.find(
    item => item.id === productId
  );

  if (!product) return;

  if (product.userId !== data.currentUser) {
    toast("No puedes editar esta publicación.");
    return;
  }

  currentProductId = productId;

  if ($("editProductTitle")) {
    $("editProductTitle").value = product.title;
  }

  if ($("editProductCategory")) {
    $("editProductCategory").value = product.category;
  }

  if ($("editProductPrice")) {
    $("editProductPrice").value = product.price;
  }

  if ($("editProductLocation")) {
    $("editProductLocation").value = product.location;
  }

  if ($("editProductDescription")) {
    $("editProductDescription").value =
      product.description || "";
  }

  showPage("editProductPage");
}

function saveEditedProduct() {
  if (!currentProductId) return;

  const product = data.products.find(
    item => item.id === currentProductId
  );

  if (!product) return;

  product.title =
    $("editProductTitle")?.value.trim() || product.title;

  product.category =
    $("editProductCategory")?.value || product.category;

  product.price =
    Number($("editProductPrice")?.value) || product.price;

  product.location =
    $("editProductLocation")?.value.trim() || product.location;

  product.description =
    $("editProductDescription")?.value.trim() ||
    product.description;

  saveData();

  toast("Publicación actualizada.");

  openProductDetail(product.id);
}

/* =========================================================
   DELETE PRODUCT
   ========================================================= */

function deleteProduct(productId) {
  if (!requireLogin()) return;

  const product = data.products.find(
    item => item.id === productId
  );

  if (!product) return;

  if (
    product.userId !== data.currentUser &&
    !data.adminLogged
  ) {
    toast("No tienes permiso para eliminarla.");
    return;
  }

  showConfirm(
    "Eliminar publicación",
    "¿Seguro que quieres eliminar esta publicación completamente?",
    () => {
      data.products =
        data.products.filter(
          item => item.id !== productId
        );

      saveData();

      closeConfirm();

      toast("Publicación eliminada completamente.");

      showPage("homePage");
      renderProducts();
    }
  );
}

/* =========================================================
   WHATSAPP
   ========================================================= */

function contactWhatsApp(productId) {
  const product = data.products.find(
    item => item.id === productId
  );

  if (!product) return;

  const seller = data.users.find(
    user => user.id === product.userId
  );

  if (!seller?.phone) {
    toast("El vendedor no tiene WhatsApp disponible.");
    return;
  }

  let phone = seller.phone.replace(/\D/g, "");

  if (phone.length === 10 && phone.startsWith("8")) {
    phone = "1" + phone;
  }

  if (!phone.startsWith("1")) {
    phone = "1" + phone;
  }

  const message =
    `Hola, vi tu publicación en Market Flash: ${product.title}. ` +
    `¿Todavía está disponible?`;

  window.open(
    `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
    "_blank"
  );
}

/* =========================================================
   CHAT
   ========================================================= */

function startChat(productId) {
  if (!requireLogin()) return;

  const product = data.products.find(
    item => item.id === productId
  );

  if (!product) return;

  if (product.userId === data.currentUser) {
    toast("Esta es tu propia publicación.");
    return;
  }

  let chat = data.chats.find(item =>
    item.productId === productId &&
    (
      item.user1 === data.currentUser ||
      item.user2 === data.currentUser
    )
  );

  if (!chat) {
    chat = {
      id: uid("chat"),
      productId,
      user1: data.currentUser,
      user2: product.userId,
      messages: [],
      updatedAt: new Date().toISOString()
    };

    data.chats.push(chat);
    saveData();
  }

  currentChatId = chat.id;

  renderChat(chat.id);
}

function renderChatList() {
  const container = $("chatList");

  if (!container) return;

  if (!isLogged()) {
    container.innerHTML =
      `<p class="text-muted text-center">Inicia sesión para usar el chat.</p>`;
    return;
  }

  const userId = data.currentUser;

  const chats = data.chats.filter(
    chat =>
      chat.user1 === userId ||
      chat.user2 === userId
  );

  container.innerHTML = "";

  if (!chats.length) {
    container.innerHTML =
      `<div class="empty-notifications">Todavía no tienes chats.</div>`;
    return;
  }

  chats.forEach(chat => {
    const otherId =
      chat.user1 === userId
        ? chat.user2
        : chat.user1;

    const otherUser = data.users.find(
      user => user.id === otherId
    );

    const product = data.products.find(
      item => item.id === chat.productId
    );

    const lastMessage =
      chat.messages?.[chat.messages.length - 1];

    const item = document.createElement("div");

    item.className = "chat-list-item";

    item.onclick = () => renderChat(chat.id);

    item.innerHTML = `
      <div class="chat-list-avatar">
        ${(otherUser?.name || "?").charAt(0).toUpperCase()}
      </div>

      <div class="chat-list-info">

        <strong>
          ${escapeHTML(otherUser?.name || "Usuario")}
        </strong>

        <span>
          ${
            lastMessage
              ? escapeHTML(lastMessage.text)
              : escapeHTML(product?.title || "Chat")
          }
        </span>

      </div>
    `;

    container.appendChild(item);
  });
}

function renderChat(chatId) {
  const chat = data.chats.find(
    item => item.id === chatId
  );

  if (!chat) return;

  currentChatId = chatId;

  const otherId =
    chat.user1 === data.currentUser
      ? chat.user2
      : chat.user1;

  const otherUser = data.users.find(
    user => user.id === otherId
  );

  const product = data.products.find(
    item => item.id === chat.productId
  );

  if ($("chatUserName")) {
    $("chatUserName").textContent =
      otherUser?.name || "Usuario";
  }

  if ($("chatProductName")) {
    $("chatProductName").textContent =
      product?.title || "";
  }

  const container = $("messagesContainer");

  if (!container) return;

  container.innerHTML = "";

  (chat.messages || []).forEach(message => {
    const element = document.createElement("div");

    element.className =
      "message " +
      (
        message.userId === data.currentUser
          ? "mine"
          : "received"
      );

    element.innerHTML = `
      <div class="message-bubble">

        ${escapeHTML(message.text)}

        <span class="message-time">
          ${escapeHTML(message.time || "")}
        </span>

      </div>
    `;

    container.appendChild(element);
  });

  container.scrollTop = container.scrollHeight;

  showPage("chatPage");
}

function sendChatMessage() {
  if (!requireLogin()) return;

  if (!currentChatId) return;

  const input = $("chatMessageInput");

  if (!input) return;

  const text = input.value.trim();

  if (!text) return;

  const chat = data.chats.find(
    item => item.id === currentChatId
  );

  if (!chat) return;

  chat.messages ||= [];

  chat.messages.push({
    id: uid("message"),
    userId: data.currentUser,
    text,
    time: formatTime(),
    createdAt: new Date().toISOString()
  });

  chat.updatedAt = new Date().toISOString();

  saveData();

  input.value = "";

  renderChat(currentChatId);
}

/* =========================================================
   NOTIFICATIONS
   ========================================================= */

function renderNotifications() {
  const container = $("notificationsList");

  if (!container) return;

  const notifications = data.notifications.slice(0, 50);

  container.innerHTML = "";

  if (!notifications.length) {
    container.innerHTML =
      `<div class="empty-notifications">No tienes notificaciones.</div>`;
    return;
  }

  notifications.forEach(notification => {
    const item = document.createElement("div");

    item.className = "notification-item";

    item.innerHTML = `
      <strong>${escapeHTML(notification.title)}</strong>

      <p>${escapeHTML(notification.message)}</p>

      <small class="text-muted">
        ${formatDate(notification.createdAt)}
      </small>
    `;

    container.appendChild(item);
  });
}

function toggleNotifications() {
  const panel = $("notificationsPanel");

  if (!panel) return;

  panel.classList.toggle("hidden");

  if (!panel.classList.contains("hidden")) {
    renderNotifications();
  }
}

/* =========================================================
   ADMIN LOGIN
   ========================================================= */

function adminLogin() {
  const username = $("adminUsername")?.value.trim();
  const password = $("adminPassword")?.value;

  /*
   * Puedes cambiar estas credenciales después.
   */
  const ADMIN_USER = "admin";
  const ADMIN_PASSWORD = "123456";

  if (
    username !== ADMIN_USER ||
    password !== ADMIN_PASSWORD
  ) {
    toast("Datos de administrador incorrectos.");
    return;
  }

  data.adminLogged = true;

  saveData();

  toast("Acceso de administrador correcto.");

  showPage("adminPanelPage");
  renderAdmin();
}

function adminLogout() {
  data.adminLogged = false;
  saveData();

  showPage("homePage");
}

/* =========================================================
   ADMIN PANEL
   ========================================================= */

function renderAdmin() {
  if (!data.adminLogged) {
    showPage("adminLoginPage");
    return;
  }

  if ($("adminUsersCount")) {
    $("adminUsersCount").textContent =
      data.users.length;
  }

  if ($("adminProductsCount")) {
    $("adminProductsCount").textContent =
      data.products.length;
  }

  if ($("adminAdsCount")) {
    $("adminAdsCount").textContent =
      data.advertisingRequests.length;
  }

  if ($("adminChatsCount")) {
    $("adminChatsCount").textContent =
      data.chats.length;
  }

  if ($("advertisingToggle")) {
    $("advertisingToggle").checked =
      !!data.settings.advertisingEnabled;
  }

  if ($("advertisingPrice")) {
    $("advertisingPrice").value =
      data.settings.advertisingPrice || 0;
  }

  renderAdminPublications();
  renderPaymentMethods();
  renderAdvertisingRequests();
}

function renderAdminPublications() {
  const container = $("adminPublicationsList");

  if (!container) return;

  container.innerHTML = "";

  if (!data.products.length) {
    container.innerHTML =
      `<p class="text-muted text-center">No hay publicaciones.</p>`;
    return;
  }

  data.products.forEach(product => {
    const user = data.users.find(
      item => item.id === product.userId
    );

    const element = document.createElement("div");

    element.className = "admin-publication-card";

    element.innerHTML = `
      <div class="admin-publication-main">

        <div class="admin-publication-image">
          ${
            product.images?.[0]
              ? `<img src="${product.images[0]}" alt="">`
              : "📷"
          }
        </div>

        <div class="admin-publication-info">

          <strong>${escapeHTML(product.title)}</strong>

          <p>
            ${money(product.price)} ·
            ${escapeHTML(user?.name || "Usuario")}
          </p>

          <span class="status-badge status-${product.status}">
            ${
              product.status === "approved"
                ? "Aprobada"
                : product.status === "rejected"
                ? "Rechazada"
                : "Pendiente"
            }
          </span>

        </div>
      </div>

      <div class="admin-publication-actions">

        <button
          class="admin-action receipt-action"
          onclick="showReceipt('${product.id}')">
          🧾 Ver comprobante
        </button>

        <button
          class="admin-action approve-action"
          onclick="approveProduct('${product.id}')">
          ✅ Aprobar
        </button>

        <button
          class="admin-action reject-action"
          onclick="rejectProduct('${product.id}')">
          ❌ Rechazar
        </button>

        <button
          class="admin-action delete-action"
          onclick="adminDeleteProduct('${product.id}')">
          🗑️ Eliminar
        </button>

      </div>
    `;

    container.appendChild(element);
  });
}

/* =========================================================
   ADMIN PRODUCT ACTIONS
   ========================================================= */

function approveProduct(productId) {
  if (!data.adminLogged) return;

  const product = data.products.find(
    item => item.id === productId
  );

  if (!product) return;

  product.status = "approved";

  data.notifications.unshift({
    id: uid("notification"),
    userId: product.userId,
    title: "Publicación aprobada",
    message: `Tu publicación "${product.title}" fue aprobada.`,
    createdAt: new Date().toISOString()
  });

  saveData();

  renderAdmin();
  renderProducts();

  toast("Publicación aprobada.");
}

function rejectProduct(productId) {
  if (!data.adminLogged) return;

  const product = data.products.find(
    item => item.id === productId
  );

  if (!product) return;

  product.status = "rejected";

  data.notifications.unshift({
    id: uid("notification"),
    userId: product.userId,
    title: "Publicación rechazada",
    message: `Tu publicación "${product.title}" fue rechazada.`,
    createdAt: new Date().toISOString()
  });

  saveData();

  renderAdmin();
  renderProducts();

  toast("Publicación rechazada.");
}

function adminDeleteProduct(productId) {
  if (!data.adminLogged) return;

  showConfirm(
    "Eliminar publicación",
    "Esta acción eliminará la publicación completamente.",
    () => {
      data.products =
        data.products.filter(
          product => product.id !== productId
        );

      saveData();

      closeConfirm();
      renderAdmin();
      renderProducts();

      toast("Publicación eliminada completamente.");
    }
  );
}

/* =========================================================
   PAYMENT METHODS
   ========================================================= */

function renderPaymentMethods() {
  const container = $("paymentMethodsList");

  if (!container) return;

  container.innerHTML = "";

  data.paymentMethods.forEach(method => {
    const element = document.createElement("div");

    element.className = "payment-method-card";

    element.innerHTML = `
      <div class="payment-method-icon">
        ${method.icon || "💳"}
      </div>

      <div class="payment-method-info">

        <strong>
          ${escapeHTML(method.name)}
        </strong>

        <div class="payment-method-price">
          ${money(method.price)}
        </div>

      </div>

      <div class="payment-method-actions">

        <button
          class="danger-icon-btn"
          onclick="editPaymentMethod('${method.id}')">
          ✏️
        </button>

        <button
          class="danger-icon-btn"
          onclick="deletePaymentMethod('${method.id}')">
          🗑️
        </button>

      </div>
    `;

    container.appendChild(element);
  });
}

function openPaymentMethodModal(methodId = null) {
  const modal = $("paymentMethodModal");

  if (!modal) return;

  modal.dataset.methodId = methodId || "";

  if (methodId) {
    const method = data.paymentMethods.find(
      item => item.id === methodId
    );

    if (!method) return;

    if ($("paymentModalTitle")) {
      $("paymentModalTitle").textContent =
        "Editar método de pago";
    }

    if ($("paymentMethodName")) {
      $("paymentMethodName").value = method.name;
    }

    if ($("paymentMethodPrice")) {
      $("paymentMethodPrice").value = method.price;
    }
  } else {
    if ($("paymentModalTitle")) {
      $("paymentModalTitle").textContent =
        "Agregar método de pago";
    }

    if ($("paymentMethodName")) {
      $("paymentMethodName").value = "";
    }

    if ($("paymentMethodPrice")) {
      $("paymentMethodPrice").value = "";
    }
  }

  modal.classList.remove("hidden");
}

function closePaymentMethodModal() {
  $("paymentMethodModal")?.classList.add("hidden");
}

function savePaymentMethod() {
  const modal = $("paymentMethodModal");

  if (!modal) return;

  const methodId = modal.dataset.methodId;

  const name =
    $("paymentMethodName")?.value.trim();

  const price =
    Number($("paymentMethodPrice")?.value) || 0;

  if (!name) {
    toast("Escribe el nombre del método.");
    return;
  }

  if (methodId) {
    const method = data.paymentMethods.find(
      item => item.id === methodId
    );

    if (method) {
      method.name = name;
      method.price = price;
    }
  } else {
    data.paymentMethods.push({
      id: uid("payment"),
      name,
      price,
      icon: "💳"
    });
  }

  saveData();

  closePaymentMethodModal();
  renderPaymentMethods();

  toast("Método de pago guardado.");
}

function editPaymentMethod(methodId) {
  openPaymentMethodModal(methodId);
}

function deletePaymentMethod(methodId) {
  showConfirm(
    "Eliminar método de pago",
    "¿Quieres eliminar este método de pago?",
    () => {
      data.paymentMethods =
        data.paymentMethods.filter(
          method => method.id !== methodId
        );

      saveData();

      closeConfirm();
      renderPaymentMethods();

      toast("Método eliminado.");
    }
  );
}

/* =========================================================
   ADVERTISING
   ========================================================= */

function updateAdvertisingSettings() {
  if (!data.adminLogged) return;

  data.settings.advertisingEnabled =
    !!$("advertisingToggle")?.checked;

  data.settings.advertisingPrice =
    Number($("advertisingPrice")?.value) || 0;

  saveData();

  toast(
    data.settings.advertisingEnabled
      ? "Publicaciones de pago activadas."
      : "Publicaciones gratuitas activadas."
  );
}

function requestAdvertising() {
  if (!requireLogin()) return;

  const request = {
    id: uid("ad"),
    userId: data.currentUser,
    status: "pending",
    price: data.settings.advertisingPrice,
    createdAt: new Date().toISOString()
  };

  data.advertisingRequests.push(request);

  saveData();

  toast("Solicitud de publicidad enviada.");

  showPage("advertisingStatusPage");
}

function renderAdvertisingRequests() {
  const container = $("adminAdvertisingRequests");

  if (!container) return;

  container.innerHTML = "";

  if (!data.advertisingRequests.length) {
    container.innerHTML =
      `<p class="text-muted text-center">No hay solicitudes.</p>`;
    return;
  }

  data.advertisingRequests.forEach(request => {
    const user = data.users.find(
      item => item.id === request.userId
    );

    const element = document.createElement("div");

    element.className = "admin-request-card";

    element.innerHTML = `
      <strong>
        ${escapeHTML(user?.name || "Usuario")}
      </strong>

      <p class="text-muted">
        ${money(request.price)}
      </p>

      <span class="status-badge status-${request.status}">
        ${escapeHTML(request.status)}
      </span>

      ${
        request.status === "pending"
          ? `
            <div class="request-actions">

              <button
                class="primary-btn"
                onclick="approveAdvertising('${request.id}')">
                Aprobar
              </button>

              <button
                class="danger-btn"
                onclick="rejectAdvertising('${request.id}')">
                Rechazar
              </button>

            </div>
          `
          : ""
      }
    `;

    container.appendChild(element);
  });
}

function approveAdvertising(requestId) {
  const request = data.advertisingRequests.find(
    item => item.id === requestId
  );

  if (!request) return;

  request.status = "approved";

  saveData();

  renderAdvertisingRequests();

  toast("Publicidad aprobada.");
}

function rejectAdvertising(requestId) {
  const request = data.advertisingRequests.find(
    item => item.id === requestId
  );

  if (!request) return;

  request.status = "rejected";

  saveData();

  renderAdvertisingRequests();

  toast("Publicidad rechazada.");
}

/* =========================================================
   RECEIPTS
   ========================================================= */

function showReceipt(productId) {
  const product = data.products.find(
    item => item.id === productId
  );

  if (!product) return;

  const user = data.users.find(
    item => item.id === product.userId
  );

  const container = $("receiptContent");

  if (!container) return;

  container.innerHTML = `
    <div class="receipt">

      <div class="receipt-header">

        <h2>MARKET FLASH</h2>

        <p>Comprobante de publicación</p>

      </div>

      <div class="receipt-row">
        <strong>Producto</strong>
        <span>${escapeHTML(product.title)}</span>
      </div>

      <div class="receipt-row">
        <strong>Vendedor</strong>
        <span>${escapeHTML(user?.name || "Usuario")}</span>
      </div>

      <div class="receipt-row">
        <strong>Teléfono</strong>
        <span>${escapeHTML(user?.phone || "")}</span>
      </div>

      <div class="receipt-row">
        <strong>Precio</strong>
        <span>${money(product.price)}</span>
      </div>

      <div class="receipt-row">
        <strong>Fecha</strong>
        <span>${formatDate(product.createdAt)}</span>
      </div>

      <div class="receipt-row">
        <strong>Estado</strong>
        <span>${escapeHTML(product.status)}</span>
      </div>

    </div>
  `;

  $("receiptModal")?.classList.remove("hidden");
}

function closeReceipt() {
  $("receiptModal")?.classList.add("hidden");
}

/* =========================================================
   CONFIRM MODAL
   ========================================================= */

let confirmCallback = null;

function showConfirm(title, message, callback) {
  if ($("confirmTitle")) {
    $("confirmTitle").textContent = title;
  }

  if ($("confirmMessage")) {
    $("confirmMessage").textContent = message;
  }

  confirmCallback = callback;

  $("confirmModal")?.classList.remove("hidden");
}

function closeConfirm() {
  $("confirmModal")?.classList.add("hidden");
  confirmCallback = null;
}

function executeConfirm() {
  if (typeof confirmCallback === "function") {
    confirmCallback();
  }
}

/* =========================================================
   SEARCH / CATEGORY
   ========================================================= */

function handleSearch() {
  renderProducts();
}

function selectCategory(category, button) {
  selectedCategory = category;

  all(".category-btn").forEach(item => {
    item.classList.remove("active");
  });

  if (button) {
    button.classList.add("active");
  }

  renderProducts();
}

/* =========================================================
   SETTINGS
   ========================================================= */

function updateNotificationsSetting() {
  data.settings.notificationsEnabled =
    !!$("notificationsToggle")?.checked;

  saveData();

  toast(
    data.settings.notificationsEnabled
      ? "Notificaciones activadas."
      : "Notificaciones desactivadas."
  );
}

/* =========================================================
   EVENT LISTENERS
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  /* SEARCH */

  $("searchInput")?.addEventListener(
    "input",
    handleSearch
  );

  /* REGISTER */

  $("registerBtn")?.addEventListener(
    "click",
    registerUser
  );

  /* LOGIN */

  $("loginBtn")?.addEventListener(
    "click",
    loginUser
  );

  /* RECOVERY */

  $("recoveryBtn")?.addEventListener(
    "click",
    recoverPassword
  );

  /* LOGOUT */

  $("logoutBtn")?.addEventListener(
    "click",
    logoutUser
  );

  /* PROFILE */

  $("editProfileBtn")?.addEventListener(
    "click",
    loadEditProfile
  );

  $("saveProfileBtn")?.addEventListener(
    "click",
    saveProfile
  );

  $("profileCameraInput")?.addEventListener(
    "change",
    handleProfileImage
  );

  $("profileGalleryInput")?.addEventListener(
    "change",
    handleProfileImage
  );

  /* PRODUCT IMAGES */

  $("cameraInput")?.addEventListener(
    "change",
    handleProductImages
  );

  $("galleryInput")?.addEventListener(
    "change",
    handleProductImages
  );

  /* PUBLISH */

  $("publishBtn")?.addEventListener(
    "click",
    publishProduct
  );

  /* EDIT PRODUCT */

  $("saveEditedProductBtn")?.addEventListener(
    "click",
    saveEditedProduct
  );

  /* CHAT */

  $("chatSendBtn")?.addEventListener(
    "click",
    sendChatMessage
  );

  $("chatMessageInput")?.addEventListener(
    "keydown",
    event => {
      if (event.key === "Enter") {
        event.preventDefault();
        sendChatMessage();
      }
    }
  );

  /* NOTIFICATIONS */

  $("notificationBtn")?.addEventListener(
    "click",
    toggleNotifications
  );

  $("closeNotificationsBtn")?.addEventListener(
    "click",
    () => {
      $("notificationsPanel")?.classList.add("hidden");
    }
  );

  /* ADMIN */

  $("adminLoginBtn")?.addEventListener(
    "click",
    adminLogin
  );

  $("adminLogoutBtn")?.addEventListener(
    "click",
    adminLogout
  );

  $("advertisingToggle")?.addEventListener(
    "change",
    updateAdvertisingSettings
  );

  $("advertisingPrice")?.addEventListener(
    "change",
    updateAdvertisingSettings
  );

  /* PAYMENT */

  $("addPaymentMethodBtn")?.addEventListener(
    "click",
    () => openPaymentMethodModal()
  );

  $("savePaymentMethodBtn")?.addEventListener(
    "click",
    savePaymentMethod
  );

  $("closePaymentMethodBtn")?.addEventListener(
    "click",
    closePaymentMethodModal
  );

  /* ADVERTISING */

  $("requestAdvertisingBtn")?.addEventListener(
    "click",
    requestAdvertising
  );

  /* RECEIPT */

  $("closeReceiptBtn")?.addEventListener(
    "click",
    closeReceipt
  );

  /* CONFIRM */

  $("confirmCancelBtn")?.addEventListener(
    "click",
    closeConfirm
  );

  $("confirmActionBtn")?.addEventListener(
    "click",
    executeConfirm
  );

  /* IMAGE VIEWER */

  $("closeImageViewerBtn")?.addEventListener(
    "click",
    closeImageViewer
  );

  $("imageViewer")?.addEventListener(
    "click",
    event => {
      if (event.target === $("imageViewer")) {
        closeImageViewer();
      }
    }
  );

  /* NOTIFICATIONS CLOSE WHEN CLICKING OUTSIDE */

  document.addEventListener("click", event => {
    const panel = $("notificationsPanel");
    const button = $("notificationBtn");

    if (
      panel &&
      !panel.classList.contains("hidden") &&
      !panel.contains(event.target) &&
      !button?.contains(event.target)
    ) {
      panel.classList.add("hidden");
    }
  });

  /* KEYBOARD IMAGE VIEWER */

  document.addEventListener("keydown", event => {

    if ($("imageViewer")?.classList.contains("hidden")) {
      return;
    }

    if (event.key === "Escape") {
      closeImageViewer();
    }

    if (event.key === "ArrowRight") {
      nextDetailImage();
    }

    if (event.key === "ArrowLeft") {
      previousDetailImage();
    }
  });

  /* INITIAL RENDER */

  renderProducts();
  renderProfile();

  if ($("notificationsToggle")) {
    $("notificationsToggle").checked =
      data.settings.notificationsEnabled;
  }

});

/* =========================================================
   GLOBAL FUNCTIONS
   ========================================================= */

window.showPage = showPage;
window.selectCategory = selectCategory;
window.openProductDetail = openProductDetail;
window.toggleLike = toggleLike;
window.toggleDislike = toggleDislike;
window.startChat = startChat;
window.contactWhatsApp = contactWhatsApp;
window.openImageViewer = openImageViewer;
window.closeImageViewer = closeImageViewer;
window.changeDetailImage = changeDetailImage;
window.nextDetailImage = nextDetailImage;
window.previousDetailImage = previousDetailImage;
window.removeSelectedImage = removeSelectedImage;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.adminDeleteProduct = adminDeleteProduct;
window.approveProduct = approveProduct;
window.rejectProduct = rejectProduct;
window.showReceipt = showReceipt;
window.closeReceipt = closeReceipt;
window.showConfirm = showConfirm;
window.closeConfirm = closeConfirm;
window.executeConfirm = executeConfirm;
window.openPaymentMethodModal = openPaymentMethodModal;
window.closePaymentMethodModal = closePaymentMethodModal;
window.editPaymentMethod = editPaymentMethod;
window.deletePaymentMethod = deletePaymentMethod;
window.approveAdvertising = approveAdvertising;
window.rejectAdvertising = rejectAdvertising;
window.sendChatMessage = sendChatMessage;
window.renderChat = renderChat;
window.toggleNotifications = toggleNotifications;
window.updateNotificationsSetting = updateNotificationsSetting;
window.requestAdvertising = requestAdvertising;
