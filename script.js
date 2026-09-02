/* =========================================================
   MARKET FLASH
   script.js
   Versión frontend/local
========================================================= */

"use strict";

/* =========================================================
   CONFIGURACIÓN
========================================================= */

const STORAGE_KEY = "marketFlashData_v1";

const DEFAULT_DATA = {
  profile: {
    name: "Usuario",
    phone: "",
    cedula: "",
    messenger: "",
    password: "1234",
    avatar: ""
  },

  products: [],

  conversations: [],

  notifications: [],

  activity: [],

  settings: {
    appColor: "#1677ff",
    chatStyle: "bubble",
    chatBackground: "default",
    chatCustomImage: ""
  },

  advertising: {
    status: "",
    title: "",
    text: "",
    submittedAt: null
  }
};


/* =========================================================
   UTILIDADES
========================================================= */

function cloneDefaultData() {
  return JSON.parse(JSON.stringify(DEFAULT_DATA));
}


function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      const fresh = cloneDefaultData();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      return fresh;
    }

    const parsed = JSON.parse(saved);

    return {
      ...cloneDefaultData(),
      ...parsed,
      profile: {
        ...DEFAULT_DATA.profile,
        ...(parsed.profile || {})
      },
      settings: {
        ...DEFAULT_DATA.settings,
        ...(parsed.settings || {})
      },
      products: Array.isArray(parsed.products) ? parsed.products : [],
      conversations: Array.isArray(parsed.conversations)
        ? parsed.conversations
        : [],
      notifications: Array.isArray(parsed.notifications)
        ? parsed.notifications
        : [],
      activity: Array.isArray(parsed.activity)
        ? parsed.activity
        : [],
      advertising: {
        ...DEFAULT_DATA.advertising,
        ...(parsed.advertising || {})
      }
    };

  } catch (error) {
    console.error("Error cargando datos:", error);

    const fresh = cloneDefaultData();

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    } catch (_) {}

    return fresh;
  }
}


let data = loadData();


function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error("No se pudieron guardar los datos:", error);

    showToast(
      "No hay suficiente espacio del navegador. Algunas fotos o videos pueden ser demasiado grandes."
    );

    return false;
  }
}


function generateId(prefix = "id") {
  return (
    prefix +
    "_" +
    Date.now() +
    "_" +
    Math.random().toString(36).substring(2, 9)
  );
}


function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function formatMoney(value) {
  const number = Number(value) || 0;

  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    maximumFractionDigits: 0
  }).format(number);
}


function formatDate(timestamp) {
  if (!timestamp) return "";

  try {
    return new Date(timestamp).toLocaleString("es-DO", {
      dateStyle: "short",
      timeStyle: "short"
    });
  } catch (_) {
    return "";
  }
}


function showToast(message) {
  const toast = document.getElementById("toast");

  if (!toast) return;

  toast.textContent = message;
  toast.classList.remove("hidden");

  clearTimeout(window.marketFlashToastTimer);

  window.marketFlashToastTimer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 3000);
}


/* =========================================================
   REFERENCIAS HTML
========================================================= */

const $ = (id) => document.getElementById(id);


/* =========================================================
   MODAL
========================================================= */

function openModal(content, options = {}) {
  const modal = $("modal");
  const card = $("modalCard");

  if (!modal || !card) return;

  card.innerHTML = content;

  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");

  if (options.onOpen) {
    setTimeout(() => options.onOpen(), 0);
  }
}


function closeModal() {
  const modal = $("modal");
  const card = $("modalCard");

  if (!modal || !card) return;

  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
  card.innerHTML = "";
}


function bindModalClose() {
  const modal = $("modal");

  if (!modal) return;

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

const pages = {
  home: "homePage",
  chat: "chatPage",
  activity: "activityPage",
  profile: "profilePage"
};


function showPage(pageName) {
  Object.values(pages).forEach((id) => {
    const section = $(id);

    if (section) {
      section.classList.add("hidden");
    }
  });

  const selected = $(pages[pageName]);

  if (selected) {
    selected.classList.remove("hidden");
  }

  document.querySelectorAll(".nav-item[data-page]").forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.page === pageName
    );
  });

  if (pageName === "home") {
    renderHome();
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

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


function bindNavigation() {
  document.querySelectorAll(".nav-item[data-page]").forEach((button) => {
    button.addEventListener("click", () => {
      showPage(button.dataset.page);
    });
  });
}


/* =========================================================
   PERFIL
========================================================= */

function renderProfile() {
  const profile = data.profile;

  if ($("profileName")) {
    $("profileName").textContent =
      profile.name || "Usuario";
  }

  if ($("profilePhone")) {
    $("profilePhone").textContent =
      profile.phone || "Teléfono no registrado";
  }

  if ($("profileCedula")) {
    $("profileCedula").textContent =
      profile.cedula
        ? "Cédula: " + maskCedula(profile.cedula)
        : "Cédula: protegida";
  }

  if ($("profileNameInfo")) {
    $("profileNameInfo").textContent =
      profile.name || "-";
  }

  if ($("profilePhoneInfo")) {
    $("profilePhoneInfo").textContent =
      profile.phone || "-";
  }

  if ($("profileMessengerInfo")) {
    $("profileMessengerInfo").textContent =
      profile.messenger
        ? "Conectado"
        : "No conectado";
  }

  renderAvatar();
  renderMyProducts();
  updateProfileBadge();
}


function maskCedula(cedula) {
  const value = String(cedula || "");

  if (value.length <= 4) {
    return "protegida";
  }

  return "******" + value.slice(-4);
}


function renderAvatar() {
  const avatar = $("profileAvatarBtn");

  if (!avatar) return;

  if (data.profile.avatar) {
    avatar.innerHTML = `
      <img
        src="${escapeHTML(data.profile.avatar)}"
        alt="Foto de perfil"
      >
    `;
  } else {
    avatar.textContent = "👤";
  }
}


function bindProfileButtons() {

  const avatarButton = $("profileAvatarBtn");

  if (avatarButton) {
    avatarButton.addEventListener("click", () => {
      const input = $("profileImageInput");

      if (input) {
        input.click();
      }
    });
  }


  const profileImageInput = $("profileImageInput");

  if (profileImageInput) {
    profileImageInput.addEventListener("change", async () => {

      const file = profileImageInput.files[0];

      if (!file) return;

      if (!file.type.startsWith("image/")) {
        showToast("Selecciona una imagen.");
        return;
      }

      try {
        const image = await fileToCompressedDataURL(
          file,
          700,
          0.75
        );

        data.profile.avatar = image;

        saveData();
        renderProfile();

        showToast("Foto de perfil actualizada.");
      } catch (error) {
        console.error(error);
        showToast("No se pudo cargar la foto.");
      }

      profileImageInput.value = "";
    });
  }


  const editProfileBtn = $("editProfileBtn");

  if (editProfileBtn) {
    editProfileBtn.addEventListener("click", openEditProfile);
  }


  const settingsButton = $("profileSettingsBtn");

  if (settingsButton) {
    settingsButton.addEventListener("click", () => {
      const settings = $("profileSettings");

      if (!settings) return;

      settings.classList.toggle("hidden");

      if (!settings.classList.contains("hidden")) {
        setTimeout(() => {
          settings.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        }, 100);
      }
    });
  }


  const messengerButton = $("messengerProfileBtn");

  if (messengerButton) {
    messengerButton.addEventListener("click", openMessengerModal);
  }


  const savePhoneButton = $("savePhoneBtn");

  if (savePhoneButton) {
    savePhoneButton.addEventListener("click", savePhone);
  }


  const saveMessengerButton = $("saveMessengerBtn");

  if (saveMessengerButton) {
    saveMessengerButton.addEventListener(
      "click",
      saveMessenger
    );
  }


  const changePasswordButton = $("changePasswordBtn");

  if (changePasswordButton) {
    changePasswordButton.addEventListener(
      "click",
      changePassword
    );
  }


  const deleteAccountButton = $("deleteAccountBtn");

  if (deleteAccountButton) {
    deleteAccountButton.addEventListener(
      "click",
      deleteAccount
    );
  }


  const appColorButton = $("appColorBtn");

  if (appColorButton) {
    appColorButton.addEventListener(
      "click",
      openColorSettings
    );
  }


  const chatStyleButton = $("chatStyleBtn");

  if (chatStyleButton) {
    chatStyleButton.addEventListener(
      "click",
      openChatStyleSettings
    );
  }


  const chatBackgroundButton = $("chatBackgroundBtn");

  if (chatBackgroundButton) {
    chatBackgroundButton.addEventListener(
      "click",
      openChatBackgroundSettings
    );
  }


  const customImageButton = $("chatCustomImageBtn");

  if (customImageButton) {
    customImageButton.addEventListener(
      "click",
      () => {
        const input = $("chatCustomImageInput");

        if (input) {
          input.click();
        }
      }
    );
  }


  const customImageInput = $("chatCustomImageInput");

  if (customImageInput) {
    customImageInput.addEventListener(
      "change",
      async () => {

        const file = customImageInput.files[0];

        if (!file) return;

        if (!file.type.startsWith("image/")) {
          showToast("Selecciona una imagen.");
          return;
        }

        try {
          const image =
            await fileToCompressedDataURL(
              file,
              1200,
              0.78
            );

          data.settings.chatCustomImage = image;
          data.settings.chatBackground = "custom";

          saveData();
          applyChatBackground();

          showToast(
            "Fondo personalizado guardado."
          );

        } catch (error) {
          console.error(error);
          showToast(
            "No se pudo cargar la imagen."
          );
        }

        customImageInput.value = "";
      }
    );
  }


  const landscapeButton = $("builtInLandscapeBtn");

  if (landscapeButton) {
    landscapeButton.addEventListener(
      "click",
      () => {
        data.settings.chatBackground = "landscape";

        saveData();
        applyChatBackground();

        showToast(
          "Paisaje de Market Flash seleccionado."
        );
      }
    );
  }
}


function openEditProfile() {

  openModal(`
    <div class="modal-header">
      <div>
        <small>MI PERFIL</small>
        <h2>Editar perfil</h2>
      </div>

      <button
        class="modal-close"
        type="button"
        data-close-modal
      >×</button>
    </div>

    <div class="form-card">

      <label for="editNameInput">
        Nombre
      </label>

      <input
        id="editNameInput"
        type="text"
        maxlength="60"
        value="${escapeHTML(data.profile.name)}"
        placeholder="Tu nombre"
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

  bindModalButtons();

  const button = $("saveProfileBtn");

  if (button) {
    button.addEventListener("click", () => {

      const input = $("editNameInput");

      const name = input
        ? input.value.trim()
        : "";

      if (name.length < 2) {
        showToast(
          "Escribe un nombre válido."
        );
        return;
      }

      data.profile.name = name;

      saveData();
      renderProfile();

      addActivity(
        "profile",
        "Actualizaste tu nombre de perfil."
      );

      closeModal();

      showToast(
        "Perfil actualizado."
      );
    });
  }
}


function savePhone() {

  const input = $("newPhoneInput");

  if (!input) return;

  const phone = input.value.trim();

  if (phone.length < 7) {
    showToast(
      "Escribe un número de teléfono válido."
    );
    return;
  }

  data.profile.phone = phone;

  saveData();

  addActivity(
    "profile",
    "Actualizaste tu número de teléfono."
  );

  renderProfile();

  input.value = "";

  showToast(
    "Número guardado correctamente."
  );
}


function openMessengerModal() {

  openModal(`
    <div class="modal-header">
      <div>
        <small>CONTACTO</small>
        <h2>Messenger</h2>
      </div>

      <button
        class="modal-close"
        type="button"
        data-close-modal
      >×</button>
    </div>

    <div class="form-card">

      <p>
        Introduce el enlace de tu perfil de Messenger.
      </p>

      <input
        id="messengerModalInput"
        type="url"
        placeholder="https://m.me/..."
        value="${escapeHTML(data.profile.messenger)}"
      >

      <button
        id="saveMessengerModalBtn"
        class="primary-btn"
        type="button"
      >
        Guardar
      </button>

    </div>
  `);

  bindModalButtons();

  const button = $("saveMessengerModalBtn");

  if (button) {
    button.addEventListener(
      "click",
      () => {

        const input = $("messengerModalInput");

        const value = input
          ? input.value.trim()
          : "";

        if (
          value &&
          !/^https?:\/\/.+/i.test(value)
        ) {
          showToast(
            "Escribe un enlace válido."
          );
          return;
        }

        data.profile.messenger = value;

        saveData();
        renderProfile();

        addActivity(
          "messenger",
          value
            ? "Conectaste tu perfil de Messenger."
            : "Desconectaste Messenger."
        );

        closeModal();

        showToast(
          value
            ? "Messenger conectado."
            : "Messenger desconectado."
        );
      }
    );
  }
}


function saveMessenger() {

  const input = $("messengerLinkInput");

  if (!input) return;

  const value = input.value.trim();

  if (
    value &&
    !/^https?:\/\/.+/i.test(value)
  ) {
    showToast(
      "Escribe un enlace válido."
    );
    return;
  }

  data.profile.messenger = value;

  saveData();

  addActivity(
    "messenger",
    value
      ? "Conectaste tu perfil de Messenger."
      : "Desconectaste Messenger."
  );

  renderProfile();

  showToast(
    value
      ? "Messenger conectado."
      : "Messenger desconectado."
  );
}


function changePassword() {

  const current = $("currentPasswordInput");
  const next = $("newPasswordInput");

  if (!current || !next) return;

  if (
    current.value !== data.profile.password
  ) {
    showToast(
      "La contraseña actual no es correcta."
    );
    return;
  }

  if (next.value.length < 4) {
    showToast(
      "La nueva contraseña debe tener al menos 4 caracteres."
    );
    return;
  }

  data.profile.password = next.value;

  saveData();

  current.value = "";
  next.value = "";

  addActivity(
    "security",
    "Cambiaste la contraseña de tu cuenta."
  );

  showToast(
    "Contraseña cambiada correctamente."
  );
}


function deleteAccount() {

  const confirmed = window.confirm(
    "¿Seguro que quieres eliminar todos los datos locales de Market Flash en este dispositivo?"
  );

  if (!confirmed) return;

  localStorage.removeItem(STORAGE_KEY);

  data = cloneDefaultData();

  saveData();

  renderAll();

  showPage("home");

  showToast(
    "Los datos locales de la cuenta fueron eliminados."
  );
}


/* =========================================================
   PRODUCTOS
========================================================= */

function renderHome() {

  renderCategories();
  renderProducts();
  renderProductCount();
  renderAdvertisingStatus();
  updateNotificationBadge();
}


function renderProductCount() {

  const count = $("productCount");

  if (!count) return;

  count.textContent =
    `${data.products.length} ${
      data.products.length === 1
        ? "publicación"
        : "publicaciones"
    }`;
}


function getCategories() {

  const categories = new Set();

  data.products.forEach((product) => {
    if (product.category) {
      categories.add(product.category);
    }
  });

  const defaultCategories = [
    "Todos",
    "Celulares",
    "Electrónica",
    "Vehículos",
    "Hogar",
    "Ropa",
    "Servicios",
    "Otros"
  ];

  defaultCategories.forEach((category) => {
    categories.add(category);
  });

  return Array.from(categories);
}


let selectedCategory = "Todos";


function renderCategories() {

  const row = $("categoryRow");

  if (!row) return;

  row.innerHTML = getCategories()
    .map((category) => `
      <button
        class="chip ${
          selectedCategory === category
            ? "active"
            : ""
        }"
        type="button"
        data-category="${escapeHTML(category)}"
      >
        ${escapeHTML(category)}
      </button>
    `)
    .join("");

  row.querySelectorAll(
    "[data-category]"
  ).forEach((button) => {

    button.addEventListener(
      "click",
      () => {

        selectedCategory =
          button.dataset.category;

        renderCategories();
        renderProducts();
      }
    );
  });
}


function getFilteredProducts() {

  const input = $("searchInput");

  const search = input
    ? input.value.trim().toLowerCase()
    : "";

  return data.products.filter((product) => {

    const categoryMatches =
      selectedCategory === "Todos" ||
      product.category === selectedCategory;

    if (!categoryMatches) {
      return false;
    }

    if (!search) {
      return true;
    }

    const text = [
      product.title,
      product.description,
      product.category,
      product.location,
      product.sellerName
    ]
      .join(" ")
      .toLowerCase();

    return text.includes(search);
  });
}


function renderProducts() {

  const grid = $("productsGrid");

  if (!grid) return;

  const products = getFilteredProducts();

  if (!products.length) {

    grid.innerHTML = `
      <div class="empty-state">
        <div>📦</div>

        <h3>
          No hay publicaciones
        </h3>

        <p>
          ${
            data.products.length
              ? "Prueba otra búsqueda o categoría."
              : "Sé el primero en publicar algo."
          }
        </p>
      </div>
    `;

    return;
  }

  grid.innerHTML = products
    .map(productCardHTML)
    .join("");

  bindProductCards();
}


function productCardHTML(product) {

  const image =
    Array.isArray(product.images) &&
    product.images.length
      ? product.images[0]
      : "";

  const imageHTML = image
    ? `
      <img
        src="${escapeHTML(image)}"
        alt="${escapeHTML(product.title)}"
        loading="lazy"
      >
    `
    : `
      <div class="product-placeholder">
        📦
      </div>
    `;

  return `
    <article
      class="product-card"
      data-product-id="${escapeHTML(product.id)}"
    >

      <div class="product-image">
        ${imageHTML}

        ${
          product.featured
            ? `<span class="product-featured">FLASH</span>`
            : ""
        }
      </div>

      <div class="product-body">

        <small class="product-category">
          ${escapeHTML(product.category || "Otros")}
        </small>

        <h3>
          ${escapeHTML(product.title)}
        </h3>

        <strong class="product-price">
          ${formatMoney(product.price)}
        </strong>

        <p class="product-location">
          📍 ${escapeHTML(product.location || "República Dominicana")}
        </p>

        <div class="product-seller">
          ${escapeHTML(product.sellerName || "Usuario")}
        </div>

      </div>

    </article>
  `;
}


function bindProductCards() {

  document
    .querySelectorAll(".product-card[data-product-id]")
    .forEach((card) => {

      card.addEventListener(
        "click",
        () => {

          const product =
            data.products.find(
              (item) =>
                item.id ===
                card.dataset.productId
            );

          if (product) {
            openProductDetails(product);
          }
        }
      );
    });
}


/* =========================================================
   PUBLICAR PRODUCTO
========================================================= */

function openPublishModal() {

  openModal(`
    <div class="modal-header">

      <div>
        <small>MARKET FLASH</small>
        <h2>Publicar producto</h2>
      </div>

      <button
        class="modal-close"
        type="button"
        data-close-modal
      >×</button>

    </div>

    <form id="publishForm">

      <div class="form-card">

        <label for="productTitleInput">
          Título
        </label>

        <input
          id="productTitleInput"
          type="text"
          maxlength="80"
          placeholder="Ej. iPhone 14 Pro"
          required
        >

        <label for="productPriceInput">
          Precio
        </label>

        <input
          id="productPriceInput"
          type="number"
          min="0"
          step="1"
          placeholder="Ej. 35000"
          required
        >

        <label for="productCategoryInput">
          Categoría
        </label>

        <select id="productCategoryInput">
          <option>Celulares</option>
          <option>Electrónica</option>
          <option>Vehículos</option>
          <option>Hogar</option>
          <option>Ropa</option>
          <option>Servicios</option>
          <option>Otros</option>
        </select>

        <label for="productLocationInput">
          Ubicación
        </label>

        <input
          id="productLocationInput"
          type="text"
          maxlength="80"
          placeholder="Ej. Santo Domingo"
        >

        <label for="productDescriptionInput">
          Descripción
        </label>

        <textarea
          id="productDescriptionInput"
          rows="4"
          maxlength="800"
          placeholder="Describe el producto..."
        ></textarea>

      </div>


      <div class="form-card">

        <h3>📷 Fotos</h3>

        <p>
          Puedes usar la cámara o seleccionar fotos de tu galería.
        </p>

        <div class="profile-actions">

          <button
            id="takeProductPhotoBtn"
            class="secondary-btn"
            type="button"
          >
            📷 Cámara
          </button>

          <button
            id="chooseProductPhotosBtn"
            class="secondary-btn"
            type="button"
          >
            🖼️ Galería
          </button>

        </div>

        <div
          id="productImagePreview"
          class="upload-preview"
        ></div>

      </div>


      <div class="form-card">

        <h3>🎥 Video</h3>

        <p>
          Opcional. Para evitar problemas de almacenamiento,
          utiliza videos pequeños.
        </p>

        <div class="profile-actions">

          <button
            id="takeProductVideoBtn"
            class="secondary-btn"
            type="button"
          >
            🎥 Grabar
          </button>

          <button
            id="chooseProductVideoBtn"
            class="secondary-btn"
            type="button"
          >
            🎞️ Galería
          </button>

        </div>

        <div
          id="productVideoPreview"
          class="upload-preview"
        ></div>

      </div>


      <button
        class="primary-btn"
        type="submit"
      >
        🚀 Publicar ahora
      </button>

    </form>
  `);

  bindModalButtons();

  const form = $("publishForm");

  const cameraButton =
    $("takeProductPhotoBtn");

  const galleryButton =
    $("chooseProductPhotosBtn");

  const videoCameraButton =
    $("takeProductVideoBtn");

  const videoGalleryButton =
    $("chooseProductVideoBtn");

  const cameraInput =
    $("productCameraInput");

  const galleryInput =
    $("productGalleryInput");

  const videoCameraInput =
    $("productVideoCameraInput");

  const videoGalleryInput =
    $("productVideoGalleryInput");


  window.marketFlashPublishImages = [];
  window.marketFlashPublishVideo = null;


  if (cameraButton && cameraInput) {
    cameraButton.addEventListener(
      "click",
      () => cameraInput.click()
    );

    cameraInput.onchange =
      async () => {

        const file = cameraInput.files[0];

        if (!file) return;

        await addPublishImage(file);

        cameraInput.value = "";
      };
  }


  if (galleryButton && galleryInput) {
    galleryButton.addEventListener(
      "click",
      () => galleryInput.click()
    );

    galleryInput.onchange =
      async () => {

        const files =
          Array.from(galleryInput.files || []);

        for (const file of files) {
          await addPublishImage(file);
        }

        galleryInput.value = "";
      };
  }


  if (
    videoCameraButton &&
    videoCameraInput
  ) {

    videoCameraButton.addEventListener(
      "click",
      () => videoCameraInput.click()
    );

    videoCameraInput.onchange =
      async () => {

        const file =
          videoCameraInput.files[0];

        if (!file) return;

        await addPublishVideo(file);

        videoCameraInput.value = "";
      };
  }


  if (
    videoGalleryButton &&
    videoGalleryInput
  ) {

    videoGalleryButton.addEventListener(
      "click",
      () => videoGalleryInput.click()
    );

    videoGalleryInput.onchange =
      async () => {

        const file =
          videoGalleryInput.files[0];

        if (!file) return;

        await addPublishVideo(file);

        videoGalleryInput.value = "";
      };
  }


  if (form) {
    form.addEventListener(
      "submit",
      async (event) => {

        event.preventDefault();

        await createProduct();
      }
    );
  }
}


async function addPublishImage(file) {

  if (!file.type.startsWith("image/")) {
    showToast("El archivo no es una imagen.");
    return;
  }

  if (
    window.marketFlashPublishImages.length >= 8
  ) {
    showToast(
      "Puedes agregar hasta 8 fotos."
    );
    return;
  }

  try {

    showToast("Procesando foto...");

    const image =
      await fileToCompressedDataURL(
        file,
        1200,
        0.78
      );

    window.marketFlashPublishImages.push(
      image
    );

    renderPublishImagePreview();

  } catch (error) {

    console.error(error);

    showToast(
      "No se pudo procesar la foto."
    );
  }
}


function renderPublishImagePreview() {

  const preview =
    $("productImagePreview");

  if (!preview) return;

  preview.innerHTML =
    window.marketFlashPublishImages
      .map(
        (image, index) => `
          <div class="upload-item">

            <img
              src="${escapeHTML(image)}"
              alt="Foto ${index + 1}"
            >

            <button
              type="button"
              class="danger-outline"
              data-remove-image="${index}"
            >
              Eliminar
            </button>

          </div>
        `
      )
      .join("");

  preview
    .querySelectorAll(
      "[data-remove-image]"
    )
    .forEach((button) => {

      button.addEventListener(
        "click",
        () => {

          const index =
            Number(
              button.dataset.removeImage
            );

          window.marketFlashPublishImages
            .splice(index, 1);

          renderPublishImagePreview();
        }
      );
    });
}


async function addPublishVideo(file) {

  if (!file.type.startsWith("video/")) {
    showToast("El archivo no es un video.");
    return;
  }

  const maxVideoSize =
    3 * 1024 * 1024;

  if (file.size > maxVideoSize) {

    showToast(
      "El video debe pesar menos de 3 MB."
    );

    return;
  }

  try {

    showToast("Procesando video...");

    window.marketFlashPublishVideo =
      await fileToDataURL(file);

    renderPublishVideoPreview();

  } catch (error) {

    console.error(error);

    showToast(
      "No se pudo procesar el video."
    );
  }
}


function renderPublishVideoPreview() {

  const preview =
    $("productVideoPreview");

  if (!preview) return;

  if (!window.marketFlashPublishVideo) {
    preview.innerHTML = "";
    return;
  }

  preview.innerHTML = `
    <div class="upload-item">

      <video
        src="${escapeHTML(window.marketFlashPublishVideo)}"
        controls
        playsinline
      ></video>

      <button
        id="removeProductVideoBtn"
        type="button"
        class="danger-outline"
      >
        Eliminar video
      </button>

    </div>
  `;

  const remove =
    $("removeProductVideoBtn");

  if (remove) {
    remove.addEventListener(
      "click",
      () => {

        window.marketFlashPublishVideo =
          null;

        renderPublishVideoPreview();
      }
    );
  }
}


async function createProduct() {

  const title =
    $("productTitleInput")?.value.trim() || "";

  const price =
    Number(
      $("productPriceInput")?.value || 0
    );

  const category =
    $("productCategoryInput")?.value ||
    "Otros";

  const location =
    $("productLocationInput")?.value.trim() ||
    "República Dominicana";

  const description =
    $("productDescriptionInput")?.value.trim() ||
    "";


  if (title.length < 2) {
    showToast(
      "Escribe el nombre del producto."
    );
    return;
  }


  if (price <= 0) {
    showToast(
      "Escribe un precio válido."
    );
    return;
  }


  if (
    !window.marketFlashPublishImages.length
  ) {
    const continueWithoutPhoto =
      window.confirm(
        "No agregaste una foto. ¿Quieres publicar sin foto?"
      );

    if (!continueWithoutPhoto) {
      return;
    }
  }


  const product = {
    id: generateId("product"),

    title,

    price,

    category,

    location,

    description,

    sellerName:
      data.profile.name || "Usuario",

    sellerPhone:
      data.profile.phone || "",

    sellerMessenger:
      data.profile.messenger || "",

    sellerAvatar:
      data.profile.avatar || "",

    images:
      [...window.marketFlashPublishImages],

    videos:
      window.marketFlashPublishVideo
        ? [window.marketFlashPublishVideo]
        : [],

    featured: false,

    createdAt: Date.now()
  };


  data.products.unshift(product);

  const saved = saveData();

  if (!saved) {

    data.products =
      data.products.filter(
        (item) =>
          item.id !== product.id
      );

    return;
  }


  addActivity(
    "product",
    `Publicaste "${title}".`
  );


  addNotification(
    "Nueva publicación",
    `Tu publicación "${title}" fue creada.`
  );


  window.marketFlashPublishImages = [];
  window.marketFlashPublishVideo = null;


  closeModal();

  renderHome();
  renderProfile();

  showPage("home");

  showToast(
    "¡Publicación creada correctamente!"
  );
}


/* =========================================================
   DETALLES DE PRODUCTO
========================================================= */

function openProductDetails(product) {

  const isMine =
    product.sellerName ===
      data.profile.name &&
    (
      product.sellerPhone ===
      data.profile.phone
    );


  const images =
    Array.isArray(product.images)
      ? product.images
      : [];


  const videos =
    Array.isArray(product.videos)
      ? product.videos
      : [];


  let mediaHTML = "";


  if (images.length) {

    mediaHTML += `
      <div class="product-detail-gallery">

        ${images
          .map(
            (image) => `
              <img
                src="${escapeHTML(image)}"
                alt="${escapeHTML(product.title)}"
              >
            `
          )
          .join("")}

      </div>
    `;
  } else {

    mediaHTML += `
      <div class="product-detail-no-image">
        📦
      </div>
    `;
  }


  if (videos.length) {

    mediaHTML += `
      <div class="product-detail-videos">

        ${videos
          .map(
            (video) => `
              <video
                src="${escapeHTML(video)}"
                controls
                playsinline
              ></video>
            `
          )
          .join("")}

      </div>
    `;
  }


  openModal(`
    <div class="modal-header">

      <div>
        <small>
          ${escapeHTML(product.category || "OTROS")}
        </small>

        <h2>
          ${escapeHTML(product.title)}
        </h2>
      </div>

      <button
        class="modal-close"
        type="button"
        data-close-modal
      >×</button>

    </div>


    ${mediaHTML}


    <div class="page-card">

      <strong class="product-price">
        ${formatMoney(product.price)}
      </strong>

      <p>
        ${escapeHTML(
          product.description ||
          "Sin descripción."
        )}
      </p>

      <p>
        📍 ${escapeHTML(
          product.location ||
          "República Dominicana"
        )}
      </p>

      <p>
        👤 ${escapeHTML(
          product.sellerName ||
          "Usuario"
        )}
      </p>

      <small>
        Publicado:
        ${formatDate(product.createdAt)}
      </small>

    </div>


    <div class="profile-actions">

      ${
        isMine
          ? `
            <button
              id="deleteProductDetailBtn"
              class="danger-outline"
              type="button"
            >
              🗑️ Eliminar publicación
            </button>
          `
          : `
            <button
              id="contactSellerBtn"
              class="primary-btn"
              type="button"
            >
              💬 Contactar vendedor
            </button>

            ${
              product.sellerMessenger
                ? `
                  <button
                    id="openSellerMessengerBtn"
                    class="secondary-btn"
                    type="button"
                  >
                    Messenger
                  </button>
                `
                : ""
            }
          `
      }

    </div>
  `);


  bindModalButtons();


  const deleteButton =
    $("deleteProductDetailBtn");

  if (deleteButton) {

    deleteButton.addEventListener(
      "click",
      () => {

        const confirmed =
          window.confirm(
            "¿Quieres eliminar esta publicación?"
          );

        if (!confirmed) return;

        data.products =
          data.products.filter(
            (item) =>
              item.id !== product.id
          );

        saveData();

        addActivity(
          "product",
          `Eliminaste "${product.title}".`
        );

        closeModal();

        renderAll();

        showToast(
          "Publicación eliminada."
        );
      }
    );
  }


  const contactButton =
    $("contactSellerBtn");

  if (contactButton) {

    contactButton.addEventListener(
      "click",
      () => {

        openChatWithSeller(product);

      }
    );
  }


  const messengerButton =
    $("openSellerMessengerBtn");

  if (messengerButton) {

    messengerButton.addEventListener(
      "click",
      () => {

        if (product.sellerMessenger) {

          window.open(
            product.sellerMessenger,
            "_blank",
            "noopener,noreferrer"
          );

        }
      }
    );
  }
}


/* =========================================================
   MIS PRODUCTOS
========================================================= */

function getMyProducts() {

  return data.products.filter(
    (product) => {

      const sameName =
        product.sellerName ===
        data.profile.name;

      const samePhone =
        product.sellerPhone &&
        data.profile.phone &&
        product.sellerPhone ===
        data.profile.phone;

      return sameName || samePhone;
    }
  );
}


function renderMyProducts() {

  const grid = $("myProducts");
  const count = $("myProductCount");

  if (!grid) return;

  const products = getMyProducts();

  if (count) {
    count.textContent =
      String(products.length);
  }

  if (!products.length) {

    grid.innerHTML = `
      <div class="empty-state">
        <div>📦</div>
        <h3>No tienes publicaciones</h3>
        <p>
          Pulsa "Publicar" para comenzar.
        </p>
      </div>
    `;

    return;
  }

  grid.innerHTML =
    products
      .map(productCardHTML)
      .join("");

  bindProductCards();
}


/* =========================================================
   CHAT
========================================================= */

function renderChat() {

  const list =
    $("conversationList");

  const empty =
    $("chatEmpty");

  const contacts =
    $("contactsList");


  if (!list) return;


  if (!data.conversations.length) {

    list.innerHTML = "";

    if (empty) {
      empty.classList.remove("hidden");
    }

  } else {

    if (empty) {
      empty.classList.add("hidden");
    }

    list.innerHTML =
      data.conversations
        .slice()
        .sort(
          (a, b) =>
            (b.updatedAt || 0) -
            (a.updatedAt || 0)
        )
        .map(conversationHTML)
        .join("");

    bindConversationButtons();
  }


  if (contacts) {
    renderContacts(contacts);
  }

  updateChatBadge();
}


function conversationHTML(conversation) {

  const messages =
    Array.isArray(conversation.messages)
      ? conversation.messages
      : [];

  const last =
    messages.length
      ? messages[messages.length - 1]
      : null;


  return `
    <button
      class="conversation-item"
      type="button"
      data-conversation-id="${escapeHTML(conversation.id)}"
    >

      <div class="conversation-avatar">
        💬
      </div>

      <div class="conversation-copy">

        <strong>
          ${escapeHTML(
            conversation.name ||
            "Usuario"
          )}
        </strong>

        <p>
          ${escapeHTML(
            last
              ? last.text
              : "Nueva conversación"
          )}
        </p>

      </div>

      <small>
        ${
          conversation.updatedAt
            ? formatDate(
                conversation.updatedAt
              )
            : ""
        }
      </small>

    </button>
  `;
}


function bindConversationButtons() {

  document
    .querySelectorAll(
      "[data-conversation-id]"
    )
    .forEach((button) => {

      button.addEventListener(
        "click",
        () => {

          const conversation =
            data.conversations.find(
              (item) =>
                item.id ===
                button.dataset.conversationId
            );

          if (conversation) {
            openConversation(conversation);
          }
        }
      );
    });
}


function renderContacts(container) {

  const contacts = getContacts();

  if (!contacts.length) {

    container.innerHTML = `
      <div class="empty-state">
        <div>👥</div>
        <h3>No tienes contactos</h3>
        <p>
          Tus contactos aparecerán aquí
          cuando inicies conversaciones.
        </p>
      </div>
    `;

    return;
  }


  container.innerHTML =
    contacts
      .map(
        (contact) => `
          <button
            class="conversation-item"
            type="button"
            data-contact-id="${escapeHTML(contact.id)}"
          >

            <div class="conversation-avatar">
              👤
            </div>

            <div class="conversation-copy">

              <strong>
                ${escapeHTML(contact.name)}
              </strong>

              <p>
                ${escapeHTML(
                  contact.phone ||
                  "Contacto de Market Flash"
                )}
              </p>

            </div>

          </button>
        `
      )
      .join("");


  container
    .querySelectorAll(
      "[data-contact-id]"
    )
    .forEach((button) => {

      button.addEventListener(
        "click",
        () => {

          const contact =
            contacts.find(
              (item) =>
                item.id ===
                button.dataset.contactId
            );

          if (contact) {
            startConversationWithContact(
              contact
            );
          }
        }
      );
    });
}


function getContacts() {

  const map = new Map();

  data.conversations.forEach(
    (conversation) => {

      if (!conversation.name) {
        return;
      }

      map.set(
        conversation.contactId ||
          conversation.id,
        {
          id:
            conversation.contactId ||
            conversation.id,

          name:
            conversation.name,

          phone:
            conversation.phone || "",

          messenger:
            conversation.messenger || ""
        }
      );
    }
  );

  return Array.from(map.values());
}


function bindChatButtons() {

  const contactsButton =
    $("chatContactsBtn");

  if (contactsButton) {

    contactsButton.addEventListener(
      "click",
      () => {

        const list =
          $("contactsList");

        if (!list) return;

        list.classList.toggle("hidden");

        if (!list.classList.contains("hidden")) {
          renderContacts(list);
        }
      }
    );
  }
}


function openChatWithSeller(product) {

  closeModal();

  const conversation =
    findOrCreateConversation(
      product.id,
      product.sellerName,
      product.sellerPhone,
      product.sellerMessenger
    );

  showPage("chat");

  setTimeout(() => {
    openConversation(conversation);
  }, 100);
}


function findOrCreateConversation(
  contactId,
  name,
  phone,
  messenger
) {

  let conversation =
    data.conversations.find(
      (item) =>
        item.contactId === contactId
    );


  if (!conversation) {

    conversation = {
      id: generateId("conversation"),

      contactId,

      name:
        name || "Usuario",

      phone:
        phone || "",

      messenger:
        messenger || "",

      messages: [],

      updatedAt: Date.now()
    };

    data.conversations.push(
      conversation
    );

    saveData();
  }

  return conversation;
}


function startConversationWithContact(
  contact
) {

  const conversation =
    findOrCreateConversation(
      contact.id,
      contact.name,
      contact.phone,
      contact.messenger
    );

  openConversation(conversation);
}


function openConversation(conversation) {

  openModal(`
    <div class="modal-header">

      <div>
        <small>CHAT</small>

        <h2>
          ${escapeHTML(
            conversation.name ||
            "Usuario"
          )}
        </h2>
      </div>

      <button
        class="modal-close"
        type="button"
        data-close-modal
      >×</button>

    </div>


    <div
      id="messageList"
      class="message-list"
    >

      ${
        conversation.messages.length
          ? conversation.messages
              .map(messageHTML)
              .join("")
          : `
            <div class="empty-state">
              <div>💬</div>
              <p>
                Comienza la conversación.
              </p>
            </div>
          `
      }

    </div>


    <form
      id="messageForm"
      class="message-form"
    >

      <input
        id="messageInput"
        type="text"
        maxlength="500"
        placeholder="Escribe un mensaje..."
        autocomplete="off"
        required
      >

      <button
        class="primary-btn"
        type="submit"
      >
        Enviar
      </button>

    </form>


    ${
      conversation.messenger
        ? `
          <button
            id="conversationMessengerBtn"
            class="secondary-btn"
            type="button"
          >
            💬 Abrir Messenger
          </button>
        `
        : ""
    }
  `);


  bindModalButtons();


  const form =
    $("messageForm");

  if (form) {

    form.addEventListener(
      "submit",
      (event) => {

        event.preventDefault();

        const input =
          $("messageInput");

        if (!input) return;

        const text =
          input.value.trim();

        if (!text) return;

        conversation.messages.push({
          id: generateId("message"),

          sender: "me",

          text,

          createdAt: Date.now()
        });

        conversation.updatedAt =
          Date.now();

        saveData();

        input.value = "";

        refreshConversationModal(
          conversation
        );

        renderChat();

        addActivity(
          "chat",
          `Enviaste un mensaje a ${conversation.name}.`
        );
      }
    );
  }


  const messenger =
    $("conversationMessengerBtn");

  if (messenger) {

    messenger.addEventListener(
      "click",
      () => {

        if (conversation.messenger) {

          window.open(
            conversation.messenger,
            "_blank",
            "noopener,noreferrer"
          );

        }
      }
    );
  }
}


function refreshConversationModal(
  conversation
) {

  const messageList =
    $("messageList");

  if (!messageList) return;

  messageList.innerHTML =
    conversation.messages.length
      ? conversation.messages
          .map(messageHTML)
          .join("")
      : `
        <div class="empty-state">
          <div>💬</div>
          <p>
            Comienza la conversación.
          </p>
        </div>
      `;

  messageList.scrollTop =
    messageList.scrollHeight;
}


function messageHTML(message) {

  return `
    <div
      class="message ${
        message.sender === "me"
          ? "message-me"
          : "message-other"
      }"
    >

      <div class="message-bubble">
        ${escapeHTML(message.text)}
      </div>

      <small>
        ${formatDate(message.createdAt)}
      </small>

    </div>
  `;
}


function updateChatBadge() {

  const badge =
    $("chatBadge");

  if (!badge) return;

  const unread =
    data.conversations.reduce(
      (total, conversation) =>
        total +
        Number(
          conversation.unread || 0
        ),
      0
    );

  if (unread > 0) {

    badge.textContent =
      unread > 99
        ? "99+"
        : String(unread);

    badge.classList.remove("hidden");

  } else {

    badge.classList.add("hidden");
  }
}


/* =========================================================
   ACTIVIDAD
========================================================= */

function addActivity(type, text) {

  data.activity.unshift({
    id: generateId("activity"),

    type,

    text,

    createdAt: Date.now()
  });

  data.activity =
    data.activity.slice(0, 100);

  saveData();
}


function renderActivity() {

  const container =
    $("activityContent");

  if (!container) return;

  if (!data.activity.length) {

    container.innerHTML = `
      <div class="empty-state">
        <div>📋</div>

        <h3>
          No hay actividad todavía
        </h3>

        <p>
          Aquí aparecerán tus publicaciones,
          mensajes y cambios de cuenta.
        </p>
      </div>
    `;

    return;
  }


  container.innerHTML =
    data.activity
      .map(
        (item) => `
          <div class="activity-item">

            <div class="activity-icon">
              ${activityIcon(item.type)}
            </div>

            <div>

              <strong>
                ${escapeHTML(item.text)}
              </strong>

              <small>
                ${formatDate(item.createdAt)}
              </small>

            </div>

          </div>
        `
      )
      .join("");
}


function activityIcon(type) {

  const icons = {
    product: "📦",
    chat: "💬",
    profile: "👤",
    security: "🔐",
    messenger: "🟢",
    advertising: "📣",
    system: "⚙️"
  };

  return icons[type] || "📋";
}


/* =========================================================
   NOTIFICACIONES
========================================================= */

function addNotification(title, text) {

  data.notifications.unshift({
    id: generateId("notification"),

    title,

    text,

    read: false,

    createdAt: Date.now()
  });

  data.notifications =
    data.notifications.slice(0, 50);

  saveData();

  updateNotificationBadge();
}


function updateNotificationBadge() {

  const badge =
    $("notifyBadge");

  if (!badge) return;

  const unread =
    data.notifications.filter(
      (item) => !item.read
    ).length;


  if (unread > 0) {

    badge.textContent =
      unread > 99
        ? "99+"
        : String(unread);

    badge.classList.remove(
      "hidden"
    );

  } else {

    badge.classList.add("hidden");
  }
}


function updateProfileBadge() {

  const badge =
    $("profileBadge");

  if (!badge) return;

  badge.classList.add("hidden");
}


function openNotifications() {

  data.notifications.forEach(
    (notification) => {
      notification.read = true;
    }
  );

  saveData();

  updateNotificationBadge();


  const notifications =
    data.notifications;


  openModal(`
    <div class="modal-header">

      <div>
        <small>MARKET FLASH</small>
        <h2>Notificaciones</h2>
      </div>

      <button
        class="modal-close"
        type="button"
        data-close-modal
      >×</button>

    </div>


    <div class="notification-list">

      ${
        notifications.length
          ? notifications
              .map(
                (item) => `
                  <div class="notification-item">

                    <strong>
                      ${escapeHTML(item.title)}
                    </strong>

                    <p>
                      ${escapeHTML(item.text)}
                    </p>

                    <small>
                      ${formatDate(item.createdAt)}
                    </small>

                  </div>
                `
              )
              .join("")
          : `
            <div class="empty-state">
              <div>🔔</div>
              <h3>
                No tienes notificaciones
              </h3>
            </div>
          `
      }

    </div>
  `);


  bindModalButtons();
}


/* =========================================================
   FLASH DEL DÍA / PUBLICIDAD
========================================================= */

function bindAdvertisingButtons() {

  const flashButton =
    $("flashDayBtn");

  if (flashButton) {

    flashButton.addEventListener(
      "click",
      openFlashDay
    );
  }


  const statusButton =
    $("myAdStatusBtn");

  if (statusButton) {

    statusButton.addEventListener(
      "click",
      openAdvertisingStatus
    );
  }
}


function openFlashDay() {

  openModal(`
    <div class="modal-header">

      <div>
        <small>PUBLICIDAD</small>

        <h2>
          Publicación Flash del Día
        </h2>
      </div>

      <button
        class="modal-close"
        type="button"
        data-close-modal
      >×</button>

    </div>


    <div class="page-card">

      <p>
        Envía tu propuesta para aparecer
        como publicidad destacada en
        Market Flash.
      </p>

      <div class="form-card">

        <label for="adTitleInput">
          Título de la publicidad
        </label>

        <input
          id="adTitleInput"
          type="text"
          maxlength="100"
          placeholder="Ej. Oferta especial"
        >

        <label for="adTextInput">
          Descripción
        </label>

        <textarea
          id="adTextInput"
          rows="5"
          maxlength="800"
          placeholder="Describe tu promoción..."
        ></textarea>

        <button
          id="submitAdBtn"
          class="primary-btn"
          type="button"
        >
          📣 Enviar publicidad
        </button>

      </div>

    </div>
  `);


  bindModalButtons();


  const submit =
    $("submitAdBtn");

  if (submit) {

    submit.addEventListener(
      "click",
      submitAdvertising
    );
  }
}


function submitAdvertising() {

  const title =
    $("adTitleInput")?.value.trim() || "";

  const text =
    $("adTextInput")?.value.trim() || "";


  if (title.length < 3) {

    showToast(
      "Escribe un título para la publicidad."
    );

    return;
  }


  if (text.length < 5) {

    showToast(
      "Escribe una descripción."
    );

    return;
  }


  data.advertising = {
    status: "pending",

    title,

    text,

    submittedAt: Date.now()
  };


  saveData();

  addActivity(
    "advertising",
    "Enviaste una publicidad para revisión."
  );


  addNotification(
    "Publicidad enviada",
    "Tu publicidad está pendiente de revisión."
  );


  closeModal();

  renderAdvertisingStatus();

  showToast(
    "Publicidad enviada para revisión."
  );
}


function renderAdvertisingStatus() {

  const button =
    $("myAdStatusBtn");

  if (!button) return;

  const ad =
    data.advertising;


  if (!ad.status) {

    button.classList.add("hidden");

    return;
  }


  button.classList.remove("hidden");


  const title =
    $("myAdStatusTitle");

  const text =
    $("myAdStatusText");

  const icon =
    $("myAdStatusIcon");


  if (
    ad.status === "pending"
  ) {

    if (title) {
      title.textContent =
        "Publicidad en revisión";
    }

    if (text) {
      text.textContent =
        "Tu publicidad fue enviada y está pendiente.";
    }

    if (icon) {
      icon.textContent = "⏳";
    }

  } else if (
    ad.status === "approved"
  ) {

    if (title) {
      title.textContent =
        "Publicidad aprobada";
    }

    if (text) {
      text.textContent =
        "Tu publicidad fue aprobada.";
    }

    if (icon) {
      icon.textContent = "✅";
    }

  } else if (
    ad.status === "rejected"
  ) {

    if (title) {
      title.textContent =
        "Publicidad rechazada";
    }

    if (text) {
      text.textContent =
        "Revisa los detalles de tu publicidad.";
    }

    if (icon) {
      icon.textContent = "❌";
    }
  }
}


function openAdvertisingStatus() {

  const ad =
    data.advertising;


  openModal(`
    <div class="modal-header">

      <div>
        <small>MI PUBLICIDAD</small>
        <h2>
          Estado de publicidad
        </h2>
      </div>

      <button
        class="modal-close"
        type="button"
        data-close-modal
      >×</button>

    </div>


    <div class="page-card">

      <h3>
        ${escapeHTML(
          ad.title || "Sin título"
        )}
      </h3>

      <p>
        ${escapeHTML(
          ad.text || ""
        )}
      </p>

      <p>
        <strong>Estado:</strong>
        ${advertisingStatusText(
          ad.status
        )}
      </p>

      ${
        ad.submittedAt
          ? `
            <small>
              Enviada:
              ${formatDate(
                ad.submittedAt
              )}
            </small>
          `
          : ""
      }

    </div>
  `);


  bindModalButtons();
}


function advertisingStatusText(status) {

  const states = {
    pending: "⏳ Pendiente",
    approved: "✅ Aprobada",
    rejected: "❌ Rechazada"
  };

  return states[status] || "Sin estado";
}


/* =========================================================
   CONFIGURACIÓN DE COLOR
========================================================= */

function openColorSettings() {

  openModal(`
    <div class="modal-header">

      <div>
        <small>CONFIGURACIÓN</small>
        <h2>Color de Market Flash</h2>
      </div>

      <button
        class="modal-close"
        type="button"
        data-close-modal
      >×</button>

    </div>


    <div class="form-card">

      <label for="appColorInput">
        Selecciona un color
      </label>

      <input
        id="appColorInput"
        type="color"
        value="${escapeHTML(
          data.settings.appColor
        )}"
      >

      <button
        id="saveAppColorBtn"
        class="primary-btn"
        type="button"
      >
        Guardar color
      </button>

    </div>
  `);


  bindModalButtons();


  const button =
    $("saveAppColorBtn");

  if (button) {

    button.addEventListener(
      "click",
      () => {

        const input =
          $("appColorInput");

        if (!input) return;

        data.settings.appColor =
          input.value;

        saveData();

        applyTheme();

        closeModal();

        showToast(
          "Color de la aplicación actualizado."
        );
      }
    );
  }
}


function applyTheme() {

  const color =
    data.settings.appColor ||
    "#1677ff";


  document.documentElement.style.setProperty(
    "--mf-primary",
    color
  );


  document.documentElement.style.setProperty(
    "--mf-primary-dark",
    darkenColor(color, 20)
  );


  document.documentElement.style.setProperty(
    "--mf-primary-light",
    lightenColor(color, 85)
  );
}


function darkenColor(hex, amount) {

  const rgb = hexToRGB(hex);

  if (!rgb) return hex;

  const factor =
    1 - amount / 100;

  return rgbToHex(
    Math.round(rgb.r * factor),
    Math.round(rgb.g * factor),
    Math.round(rgb.b * factor)
  );
}


function lightenColor(hex, amount) {

  const rgb = hexToRGB(hex);

  if (!rgb) return hex;

  return rgbToHex(
    Math.round(
      rgb.r +
      (255 - rgb.r) *
      (amount / 100)
    ),

    Math.round(
      rgb.g +
      (255 - rgb.g) *
      (amount / 100)
    ),

    Math.round(
      rgb.b +
      (255 - rgb.b) *
      (amount / 100)
    )
  );
}


function hexToRGB(hex) {

  const value =
    String(hex || "")
      .replace("#", "");

  if (value.length !== 6) {
    return null;
  }

  const number =
    parseInt(value, 16);

  if (Number.isNaN(number)) {
    return null;
  }

  return {
    r: (number >> 16) & 255,
    g: (number >> 8) & 255,
    b: number & 255
  };
}


function rgbToHex(r, g, b) {

  return (
    "#" +
    [r, g, b]
      .map(
        (value) =>
          value
            .toString(16)
            .padStart(2, "0")
      )
      .join("")
  );
}


/* =========================================================
   ESTILO DEL CHAT
========================================================= */

function openChatStyleSettings() {

  openModal(`
    <div class="modal-header">

      <div>
        <small>CHAT</small>
        <h2>Estilo del chat</h2>
      </div>

      <button
        class="modal-close"
        type="button"
        data-close-modal
      >×</button>

    </div>


    <div class="form-card">

      <button
        class="secondary-btn"
        type="button"
        data-chat-style="bubble"
      >
        💬 Burbujas
      </button>

      <button
        class="secondary-btn"
        type="button"
        data-chat-style="minimal"
      >
        ▫️ Minimalista
      </button>

      <button
        class="secondary-btn"
        type="button"
        data-chat-style="rounded"
      >
        🔵 Redondeado
      </button>

    </div>
  `);


  bindModalButtons();


  document
    .querySelectorAll(
      "[data-chat-style]"
    )
    .forEach((button) => {

      button.addEventListener(
        "click",
        () => {

          data.settings.chatStyle =
            button.dataset.chatStyle;

          saveData();

          applyChatStyle();

          closeModal();

          showToast(
            "Estilo del chat actualizado."
          );
        }
      );
    });
}


function applyChatStyle() {

  document.body.dataset.chatStyle =
    data.settings.chatStyle ||
    "bubble";
}


/* =========================================================
   FONDO DEL CHAT
========================================================= */

function openChatBackgroundSettings() {

  openModal(`
    <div class="modal-header">

      <div>
        <small>CHAT</small>
        <h2>Fondo del chat</h2>
      </div>

      <button
        class="modal-close"
        type="button"
        data-close-modal
      >×</button>

    </div>


    <div class="form-card">

      <button
        class="secondary-btn"
        type="button"
        data-chat-bg="default"
      >
        ◻️ Fondo normal
      </button>

      <button
        class="secondary-btn"
        type="button"
        data-chat-bg="landscape"
      >
        🌴 Paisaje
      </button>

      ${
        data.settings.chatCustomImage
          ? `
            <button
              class="secondary-btn"
              type="button"
              data-chat-bg="custom"
            >
              🖼️ Mi imagen
            </button>
          `
          : ""
      }

    </div>
  `);


  bindModalButtons();


  document
    .querySelectorAll(
      "[data-chat-bg]"
    )
    .forEach((button) => {

      button.addEventListener(
        "click",
        () => {

          const value =
            button.dataset.chatBg;

          if (
            value === "custom" &&
            !data.settings.chatCustomImage
          ) {
            showToast(
              "Primero sube una imagen."
            );
            return;
          }

          data.settings.chatBackground =
            value;

          saveData();

          applyChatBackground();

          closeModal();

          showToast(
            "Fondo del chat actualizado."
          );
        }
      );
    });
}


function applyChatBackground() {

  const root =
    document.documentElement;

  root.style.removeProperty(
    "--mf-chat-background"
  );


  if (
    data.settings.chatBackground ===
    "custom"
  ) {

    if (data.settings.chatCustomImage) {

      root.style.setProperty(
        "--mf-chat-background",
        `url("${data.settings.chatCustomImage}")`
      );
    }

    return;
  }


  if (
    data.settings.chatBackground ===
    "landscape"
  ) {

    root.style.setProperty(
      "--mf-chat-background",
      "linear-gradient(160deg, #87ceeb 0%, #dff6ff 45%, #80c783 46%, #4e9f4a 100%)"
    );

    return;
  }


  root.style.setProperty(
    "--mf-chat-background",
    "linear-gradient(135deg, #f4f7fb, #ffffff)"
  );
}


/* =========================================================
   BOTONES DEL MODAL
========================================================= */

function bindModalButtons() {

  document
    .querySelectorAll(
      "[data-close-modal]"
    )
    .forEach((button) => {

      button.addEventListener(
        "click",
        closeModal
      );
    });
}


/* =========================================================
   ARCHIVOS
========================================================= */

function fileToDataURL(file) {

  return new Promise(
    (resolve, reject) => {

      const reader =
        new FileReader();

      reader.onload = () =>
        resolve(reader.result);

      reader.onerror = reject;

      reader.readAsDataURL(file);
    }
  );
}


function fileToCompressedDataURL(
  file,
  maxSize = 1200,
  quality = 0.78
) {

  return new Promise(
    (resolve, reject) => {

      const reader =
        new FileReader();

      reader.onload = () => {

        const image =
          new Image();

        image.onload = () => {

          let width =
            image.naturalWidth;

          let height =
            image.naturalHeight;


          if (
            width > maxSize ||
            height > maxSize
          ) {

            const ratio =
              Math.min(
                maxSize / width,
                maxSize / height
              );

            width =
              Math.round(
                width * ratio
              );

            height =
              Math.round(
                height * ratio
              );
          }


          const canvas =
            document.createElement(
              "canvas"
            );

          canvas.width = width;
          canvas.height = height;


          const context =
            canvas.getContext(
              "2d"
            );

          if (!context) {
            reject(
              new Error(
                "Canvas no disponible."
              )
            );
            return;
          }


          context.drawImage(
            image,
            0,
            0,
            width,
            height
          );


          resolve(
            canvas.toDataURL(
              "image/jpeg",
              quality
            )
          );
        };


        image.onerror = () =>
          reject(
            new Error(
              "No se pudo leer la imagen."
            )
          );


        image.src =
          reader.result;
      };


      reader.onerror = reject;

      reader.readAsDataURL(file);
    }
  );
}


/* =========================================================
   BUSCADOR
========================================================= */

function bindSearch() {

  const input =
    $("searchInput");

  if (!input) return;

  input.addEventListener(
    "input",
    () => {

      if (
        !document
          .getElementById("homePage")
          ?.classList.contains("hidden")
      ) {
        renderProducts();
      }
    }
  );
}


/* =========================================================
   BOTÓN DE PUBLICAR
========================================================= */

function bindPublishButton() {

  const button =
    $("publishBtn");

  if (!button) return;

  button.addEventListener(
    "click",
    openPublishModal
  );
}


/* =========================================================
   NOTIFICACIONES
========================================================= */

function bindNotificationButton() {

  const button =
    $("notifyBtn");

  if (!button) return;

  button.addEventListener(
    "click",
    openNotifications
  );
}


/* =========================================================
   FIRMA DEL PROPIETARIO
========================================================= */

function setupOwnerSignature() {

  const signature =
    $("ownerSignature");

  if (!signature) return;


  if (
    "IntersectionObserver" in window
  ) {

    const observer =
      new IntersectionObserver(
        (entries) => {

          entries.forEach(
            (entry) => {

              if (entry.isIntersecting) {

                signature.classList.add(
                  "visible"
                );

              }
            }
          );
        },
        {
          threshold: 0.25
        }
      );


    observer.observe(signature);

  } else {

    signature.classList.add(
      "visible"
    );
  }
}


/* =========================================================
   BOTONES DE ARCHIVOS DE COMPROBANTE
   Preparados para futuras funciones de pago/publicidad.
========================================================= */

function bindPaymentProofInputs() {

  [
    "paymentProofCameraInput",
    "paymentProofGalleryInput"
  ].forEach((id) => {

    const input = $(id);

    if (!input) return;

    input.addEventListener(
      "change",
      () => {

        if (input.files.length) {

          showToast(
            "Comprobante seleccionado."
          );
        }
      }
    );
  });
}


/* =========================================================
   RENDER GENERAL
========================================================= */

function renderAll() {

  renderHome();

  renderProfile();

  renderChat();

  renderActivity();

  updateNotificationBadge();

  updateChatBadge();

  applyTheme();

  applyChatStyle();

  applyChatBackground();
}


/* =========================================================
   INICIALIZACIÓN
========================================================= */

function initMarketFlash() {

  console.log(
    "Market Flash iniciado correctamente."
  );


  bindNavigation();

  bindSearch();

  bindPublishButton();

  bindNotificationButton();

  bindProfileButtons();

  bindChatButtons();

  bindAdvertisingButtons();

  bindPaymentProofInputs();

  bindModalClose();

  setupOwnerSignature();


  applyTheme();

  applyChatStyle();

  applyChatBackground();


  renderAll();


  showPage("home");
}


/* =========================================================
   INICIAR CUANDO EL DOM ESTÉ LISTO
========================================================= */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initMarketFlash
  );

} else {

  initMarketFlash();
}
