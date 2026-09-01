/* =========================================================
   MARKET FLASH - JAVASCRIPT COMPLETO
   ========================================================= */

"use strict";

/* =========================================================
   DATOS Y CONFIGURACIÓN
   ========================================================= */

const STORAGE_KEYS = {
    user: "mf_user",
    products: "mf_products",
    config: "mf_config",
    ads: "mf_ads",
    stats: "mf_stats",
    notifications: "mf_notifications"
};

let currentCategory = "Todos";
let currentProductId = null;
let selectedProductImages = [];
let selectedAdvertisingImage = "";
let selectedProofImage = "";
let selectedProfileImage = "";


/* =========================================================
   CONFIGURACIÓN INICIAL
   ========================================================= */

const DEFAULT_CONFIG = {
    advertisingEnabled: true,
    advertisingPrice: 500,
    paymentMethods: [
        "Transferencia bancaria",
        "Pago móvil",
        "Depósito bancario"
    ]
};


/* =========================================================
   PRODUCTOS INICIALES
   ========================================================= */

const DEFAULT_PRODUCTS = [
    {
        id: "seed-iphone-15-pro",
        name: "iPhone 15 Pro",
        category: "Celulares",
        price: 65000,
        location: "Santo Domingo",
        description: "iPhone 15 Pro en excelentes condiciones.",
        whatsapp: "8090000000",
        images: [],
        ownerId: "demo",
        ownerName: "Market Flash",
        createdAt: new Date().toISOString(),
        views: 0,
        likes: 0
    },
    {
        id: "seed-samsung-s24",
        name: "Samsung Galaxy S24",
        category: "Celulares",
        price: 45000,
        location: "Santo Domingo",
        description: "Samsung Galaxy S24 disponible.",
        whatsapp: "8090000000",
        images: [],
        ownerId: "demo",
        ownerName: "Market Flash",
        createdAt: new Date().toISOString(),
        views: 0,
        likes: 0
    },
    {
        id: "seed-laptop",
        name: "Laptop profesional",
        category: "Computadoras",
        price: 55000,
        location: "Santo Domingo",
        description: "Laptop ideal para trabajo y estudios.",
        whatsapp: "8090000000",
        images: [],
        ownerId: "demo",
        ownerName: "Market Flash",
        createdAt: new Date().toISOString(),
        views: 0,
        likes: 0
    },
    {
        id: "seed-ps5",
        name: "PlayStation 5",
        category: "Videojuegos",
        price: 35000,
        location: "Santo Domingo",
        description: "PlayStation 5 en buen estado.",
        whatsapp: "8090000000",
        images: [],
        ownerId: "demo",
        ownerName: "Market Flash",
        createdAt: new Date().toISOString(),
        views: 0,
        likes: 0
    }
];


/* =========================================================
   UTILIDADES
   ========================================================= */

function getStorage(key, fallback) {
    try {
        const value = localStorage.getItem(key);

        if (value === null) {
            return fallback;
        }

        return JSON.parse(value);
    } catch (error) {
        console.error("Error leyendo almacenamiento:", error);
        return fallback;
    }
}


function setStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error("Error guardando almacenamiento:", error);
        return false;
    }
}


function getUser() {
    return getStorage(STORAGE_KEYS.user, null);
}


function getProducts() {
    return getStorage(STORAGE_KEYS.products, []);
}


function saveProducts(products) {
    return setStorage(STORAGE_KEYS.products, products);
}


function getConfig() {
    const config = getStorage(
        STORAGE_KEYS.config,
        DEFAULT_CONFIG
    );

    return {
        ...DEFAULT_CONFIG,
        ...config,
        paymentMethods:
            Array.isArray(config.paymentMethods)
                ? config.paymentMethods
                : DEFAULT_CONFIG.paymentMethods
    };
}


function saveConfig(config) {
    return setStorage(STORAGE_KEYS.config, config);
}


function getAds() {
    return getStorage(STORAGE_KEYS.ads, []);
}


function saveAds(ads) {
    return setStorage(STORAGE_KEYS.ads, ads);
}


function getStats() {
    return getStorage(
        STORAGE_KEYS.stats,
        {
            registered: 0,
            deleted: 0
        }
    );
}


function saveStats(stats) {
    return setStorage(STORAGE_KEYS.stats, stats);
}


function getNotifications() {
    return getStorage(
        STORAGE_KEYS.notifications,
        []
    );
}


function saveNotifications(notifications) {
    return setStorage(
        STORAGE_KEYS.notifications,
        notifications
    );
}


function generateId(prefix = "mf") {
    return (
        prefix +
        "-" +
        Date.now() +
        "-" +
        Math.random()
            .toString(36)
            .substring(2, 9)
    );
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


function formatPrice(value) {
    const number = Number(value) || 0;

    return number.toLocaleString(
        "es-DO",
        {
            style: "currency",
            currency: "DOP",
            maximumFractionDigits: 0
        }
    );
}


function formatDate(dateValue) {
    if (!dateValue) {
        return "";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toLocaleDateString(
        "es-DO",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );
}


function normalizePhone(phone) {
    return String(phone || "")
        .replace(/\D/g, "");
}


function showElement(id) {
    const element = document.getElementById(id);

    if (element) {
        element.classList.remove("hidden");
    }
}


function hideElement(id) {
    const element = document.getElementById(id);

    if (element) {
        element.classList.add("hidden");
    }
}


function setText(id, text) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = text;
    }
}


/* =========================================================
   TOAST
   ========================================================= */

function toast(message, type = "success") {

    const container =
        document.getElementById("toastContainer");

    if (!container) {
        alert(message);
        return;
    }

    const toastElement =
        document.createElement("div");

    toastElement.className =
        "toast toast-" + type;

    toastElement.textContent = message;

    container.appendChild(toastElement);

    setTimeout(() => {
        toastElement.classList.add("toast-hide");

        setTimeout(() => {
            toastElement.remove();
        }, 300);

    }, 3000);
}


/* =========================================================
   OVERLAY
   ========================================================= */

function openOverlay() {
    const overlay =
        document.getElementById("overlay");

    if (overlay) {
        overlay.classList.remove("hidden");
    }
}


function closeOverlay(event) {

    if (
        event &&
        event.target &&
        event.target.id !== "overlay"
    ) {
        return;
    }

    const overlay =
        document.getElementById("overlay");

    if (overlay) {
        overlay.classList.add("hidden");
    }
}


/* =========================================================
   MODALES
   ========================================================= */

function openModal(id) {

    const modal =
        document.getElementById(id);

    if (!modal) {
        return;
    }

    modal.classList.remove("hidden");

    openOverlay();
}


function closeModal(id) {

    const modal =
        document.getElementById(id);

    if (modal) {
        modal.classList.add("hidden");
    }

    const visibleModals =
        document.querySelectorAll(
            ".modal:not(.hidden)"
        );

    if (visibleModals.length === 0) {
        const overlay =
            document.getElementById("overlay");

        if (overlay) {
            overlay.classList.add("hidden");
        }
    }
}


/* =========================================================
   NAVEGACIÓN
   ========================================================= */

function hideAllPages() {

    document
        .querySelectorAll(".page")
        .forEach(page => {
            page.classList.remove("active-page");
        });
}


function goHome() {

    hideAllPages();

    const home =
        document.getElementById("homePage");

    if (home) {
        home.classList.add("active-page");
    }

    updateBottomNavigation("home");

    renderProducts();
}


function openActivity() {

    hideAllPages();

    const page =
        document.getElementById("activityPage");

    if (page) {
        page.classList.add("active-page");
    }

    updateBottomNavigation("activity");

    renderActivity();
}


function openProfile() {

    hideAllPages();

    const page =
        document.getElementById("profilePage");

    if (page) {
        page.classList.add("active-page");
    }

    updateBottomNavigation("profile");

    renderProfile();
}


function openSettings() {

    hideAllPages();

    const page =
        document.getElementById("settingsPage");

    if (page) {
        page.classList.add("active-page");
    }

    updateBottomNavigation("profile");
}


function updateBottomNavigation(active) {

    const homeButton =
        document.getElementById("homeNavBtn");

    const activityButton =
        document.getElementById("activityNavBtn");

    if (homeButton) {
        homeButton.classList.toggle(
            "active",
            active === "home"
        );
    }

    if (activityButton) {
        activityButton.classList.toggle(
            "active",
            active === "activity"
        );
    }
}


/* =========================================================
   PRODUCTOS
   ========================================================= */

function initializeProducts() {

    const products =
        getProducts();

    if (!Array.isArray(products) || products.length === 0) {
        saveProducts(DEFAULT_PRODUCTS);
    }
}


function renderProducts() {

    const grid =
        document.getElementById("productsGrid");

    const empty =
        document.getElementById("emptyProducts");

    if (!grid) {
        return;
    }

    const searchInput =
        document.getElementById("searchInput");

    const search =
        searchInput
            ? searchInput.value.trim().toLowerCase()
            : "";

    const products =
        getProducts();

    const filtered =
        products.filter(product => {

            const categoryMatch =
                currentCategory === "Todos" ||
                product.category === currentCategory;

            const searchableText = [
                product.name,
                product.category,
                product.location,
                product.description
            ]
                .join(" ")
                .toLowerCase();

            const searchMatch =
                !search ||
                searchableText.includes(search);

            return categoryMatch && searchMatch;
        });


    grid.innerHTML = "";


    if (filtered.length === 0) {

        if (empty) {
            empty.classList.remove("hidden");
        }

        setText(
            "productsCounter",
            "0 productos encontrados"
        );

        return;
    }


    if (empty) {
        empty.classList.add("hidden");
    }


    filtered.forEach(product => {

        const card =
            createProductCard(product);

        grid.appendChild(card);

    });


    setText(
        "productsCounter",
        `${filtered.length} ${
            filtered.length === 1
                ? "producto"
                : "productos"
        }`
    );
}


function createProductCard(product) {

    const card =
        document.createElement("article");

    card.className = "product-card";

    card.dataset.productId =
        product.id;


    let imageHTML = "";

    if (
        Array.isArray(product.images) &&
        product.images.length > 0
    ) {

        imageHTML = `
            <img
                src="${product.images[0]}"
                alt="${escapeHTML(product.name)}"
                class="product-card-image"
            >
        `;

    } else {

        imageHTML = `
            <div class="product-card-placeholder">
                📦
            </div>
        `;
    }


    card.innerHTML = `

        <div
            class="product-card-image-wrapper"
            onclick="openProductDetail('${product.id}')"
        >
            ${imageHTML}

            <span class="product-category-badge">
                ${escapeHTML(product.category)}
            </span>
        </div>

        <div class="product-card-body">

            <h3>
                ${escapeHTML(product.name)}
            </h3>

            <strong class="product-price">
                ${formatPrice(product.price)}
            </strong>

            <p class="product-location">
                📍 ${escapeHTML(product.location)}
            </p>

            <div class="product-card-footer">

                <span>
                    👁️ ${Number(product.views) || 0}
                </span>

                <span>
                    ❤️ ${Number(product.likes) || 0}
                </span>

            </div>

        </div>
    `;

    return card;
}


function filterCategory(category) {

    currentCategory = category;

    document
        .querySelectorAll(".category-button")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.category === category
            );

        });

    renderProducts();
}


function searchProducts() {
    renderProducts();
}


function clearSearch() {

    const input =
        document.getElementById("searchInput");

    if (input) {
        input.value = "";
    }

    renderProducts();
}


/* =========================================================
   DETALLE DEL PRODUCTO
   ========================================================= */

function openProductDetail(productId) {

    const products =
        getProducts();

    const product =
        products.find(
            item => item.id === productId
        );

    if (!product) {
        toast(
            "Producto no encontrado.",
            "error"
        );

        return;
    }

    currentProductId = productId;

    product.views =
        (Number(product.views) || 0) + 1;

    saveProducts(products);


    const container =
        document.getElementById("productDetail");

    if (!container) {
        return;
    }


    let galleryHTML = "";

    if (
        Array.isArray(product.images) &&
        product.images.length > 0
    ) {

        galleryHTML = `
            <div class="detail-gallery">
                ${product.images.map(image => `
                    <img
                        src="${image}"
                        alt="${escapeHTML(product.name)}"
                    >
                `).join("")}
            </div>
        `;

    } else {

        galleryHTML = `
            <div class="detail-placeholder">
                📦
            </div>
        `;
    }


    const whatsapp =
        normalizePhone(product.whatsapp);


    const whatsappURL =
        `https://wa.me/${whatsapp}`;


    container.innerHTML = `

        ${galleryHTML}

        <div class="detail-information">

            <span class="detail-category">
                ${escapeHTML(product.category)}
            </span>

            <h2>
                ${escapeHTML(product.name)}
            </h2>

            <strong class="detail-price">
                ${formatPrice(product.price)}
            </strong>

            <p>
                📍 ${escapeHTML(product.location)}
            </p>

            <p>
                ${escapeHTML(product.description)}
            </p>

            <div class="detail-stats">

                <span>
                    👁️ ${Number(product.views) || 0}
                </span>

                <span>
                    ❤️ ${Number(product.likes) || 0}
                </span>

            </div>

            <div class="detail-actions">

                <button
                    type="button"
                    class="secondary-button"
                    onclick="likeProduct('${product.id}')"
                >
                    ❤️ Me interesa
                </button>

                <a
                    class="primary-button whatsapp-button"
                    href="${whatsappURL}"
                    target="_blank"
                    rel="noopener"
                >
                    WhatsApp
                </a>

            </div>

        </div>
    `;


    openModal("productDetailModal");
}


function closeProductDetail() {

    currentProductId = null;

    closeModal("productDetailModal");
}


function likeProduct(productId) {

    const products =
        getProducts();

    const product =
        products.find(
            item => item.id === productId
        );

    if (!product) {
        return;
    }

    product.likes =
        (Number(product.likes) || 0) + 1;

    saveProducts(products);

    toast(
        "Marcaste este producto como interesado.",
        "success"
    );

    if (currentProductId === productId) {
        openProductDetail(productId);
    }
}


/* =========================================================
   PUBLICAR PRODUCTO
   ========================================================= */

function openPublish() {

    const user = getUser();

    if (!user) {

        toast(
            "Debes iniciar sesión para publicar.",
            "error"
        );

        openLogin();

        return;
    }

    resetPublishForm();

    openModal("publishModal");
}


function closePublish() {
    closeModal("publishModal");
}


function resetPublishForm() {

    const form =
        document.getElementById("publishForm");

    if (form) {
        form.reset();
    }

    selectedProductImages = [];

    const preview =
        document.getElementById(
            "productImagePreview"
        );

    if (preview) {
        preview.innerHTML = "";
    }


    const user =
        getUser();

    const whatsapp =
        document.getElementById(
            "productWhatsapp"
        );

    if (user && whatsapp) {
        whatsapp.value =
            user.whatsapp || "";
    }
}


function openProductCamera() {

    const input =
        document.getElementById(
            "productCameraInput"
        );

    if (input) {
        input.click();
    }
}


function openProductGallery() {

    const input =
        document.getElementById(
            "productGalleryInput"
        );

    if (input) {
        input.click();
    }
}


function handleProductImages(files) {

    if (!files || files.length === 0) {
        return;
    }

    const fileArray =
        Array.from(files);

    selectedProductImages = [];

    let processed = 0;


    fileArray.forEach(file => {

        if (!file.type.startsWith("image/")) {
            processed++;
            return;
        }

        const reader =
            new FileReader();

        reader.onload = event => {

            selectedProductImages.push(
                event.target.result
            );

            processed++;

            if (processed === fileArray.length) {
                renderProductImagePreview();
            }

        };

        reader.readAsDataURL(file);
    });
}


function renderProductImagePreview() {

    const preview =
        document.getElementById(
            "productImagePreview"
        );

    if (!preview) {
        return;
    }

    preview.innerHTML = "";


    selectedProductImages.forEach(
        (image, index) => {

            const wrapper =
                document.createElement("div");

            wrapper.className =
                "preview-image-wrapper";

            wrapper.innerHTML = `

                <img
                    src="${image}"
                    alt="Vista previa"
                >

                <button
                    type="button"
                    class="preview-remove"
                    onclick="removeProductImage(${index})"
                >
                    ✕
                </button>

            `;

            preview.appendChild(wrapper);
        }
    );
}


function removeProductImage(index) {

    selectedProductImages.splice(
        index,
        1
    );

    renderProductImagePreview();
}


function publishProduct(event) {

    event.preventDefault();


    const user =
        getUser();

    if (!user) {

        toast(
            "Debes iniciar sesión.",
            "error"
        );

        return;
    }


    const name =
        document.getElementById(
            "productName"
        )?.value.trim();


    const category =
        document.getElementById(
            "productCategory"
        )?.value;


    const price =
        Number(
            document.getElementById(
                "productPrice"
            )?.value
        );


    const location =
        document.getElementById(
            "productLocation"
        )?.value.trim();


    const description =
        document.getElementById(
            "productDescription"
        )?.value.trim();


    const whatsapp =
        document.getElementById(
            "productWhatsapp"
        )?.value.trim();


    if (!name || !category || !price || !location || !description || !whatsapp) {

        toast(
            "Completa todos los campos obligatorios.",
            "error"
        );

        return;
    }


    const product = {

        id: generateId("product"),

        name,

        category,

        price,

        location,

        description,

        whatsapp,

        images: [
            ...selectedProductImages
        ],

        ownerId:
            user.cedula,

        ownerName:
            user.name,

        createdAt:
            new Date().toISOString(),

        views: 0,

        likes: 0
    };


    const products =
        getProducts();

    products.unshift(product);

    saveProducts(products);


    addNotification(
        "Nueva publicación",
        `Tu producto "${name}" fue publicado correctamente.`
    );


    closePublish();

    renderProducts();

    renderActivity();

    toast(
        "Producto publicado correctamente.",
        "success"
    );
}


/* =========================================================
   PERFIL
   ========================================================= */

function renderProfile() {

    const user =
        getUser();

    if (!user) {

        setText(
            "profileName",
            "Invitado"
        );

        setText(
            "profilePhone",
            "Inicia sesión para ver tu perfil"
        );

        return;
    }


    setText(
        "profileName",
        user.name || "Usuario"
    );


    setText(
        "profilePhone",
        user.whatsapp
            ? `WhatsApp: ${user.whatsapp}`
            : "WhatsApp no registrado"
    );


    setText(
        "profileCedula",
        user.cedula
            ? `Cédula: ${user.cedula}`
            : ""
    );


    const image =
        document.getElementById(
            "profilePhoto"
        );

    const placeholder =
        document.getElementById(
            "profilePhotoPlaceholder"
        );


    if (user.profilePhoto) {

        if (image) {
            image.src =
                user.profilePhoto;

            image.classList.remove(
                "hidden"
            );
        }

        if (placeholder) {
            placeholder.classList.add(
                "hidden"
            );
        }

    } else {

        if (image) {
            image.classList.add(
                "hidden"
            );
        }

        if (placeholder) {
            placeholder.classList.remove(
                "hidden"
            );
        }
    }
}


/* =========================================================
   FOTO DE PERFIL
   ========================================================= */

function openProfilePhotoOptions() {

    const user = getUser();

    if (!user) {

        toast(
            "Debes iniciar sesión.",
            "error"
        );

        openLogin();

        return;
    }

    openModal("profilePhotoModal");
}


function closeProfilePhotoOptions() {
    closeModal("profilePhotoModal");
}


function openProfileCamera() {

    const input =
        document.getElementById(
            "profileCameraInput"
        );

    if (input) {
        input.click();
    }
}


function openProfileGallery() {

    const input =
        document.getElementById(
            "profileGalleryInput"
        );

    if (input) {
        input.click();
    }
}


function handleProfileImage(file) {

    if (!file) {
        return;
    }

    if (!file.type.startsWith("image/")) {

        toast(
            "Selecciona una imagen válida.",
            "error"
        );

        return;
    }


    const reader =
        new FileReader();


    reader.onload = event => {

        selectedProfileImage =
            event.target.result;

        const user =
            getUser();

        if (!user) {
            return;
        }

        user.profilePhoto =
            selectedProfileImage;

        setStorage(
            STORAGE_KEYS.user,
            user
        );

        renderProfile();

        closeProfilePhotoOptions();

        toast(
            "Foto de perfil actualizada.",
            "success"
        );
    };


    reader.readAsDataURL(file);
}


/* =========================================================
   REGISTRO
   ========================================================= */

function openRegister() {

    closeLogin();

    const form =
        document.getElementById(
            "registerForm"
        );

    if (form) {
        form.reset();
    }

    openModal("registerModal");
}


function closeRegister() {
    closeModal("registerModal");
}


function registerUser(event) {

    event.preventDefault();


    const name =
        document.getElementById(
            "registerName"
        )?.value.trim();


    const cedula =
        document.getElementById(
            "registerCedula"
        )?.value.trim();


    const whatsapp =
        document.getElementById(
            "registerWhatsapp"
        )?.value.trim();


    const password =
        document.getElementById(
            "registerPassword"
        )?.value;


    const recoveryQuestion =
        document.getElementById(
            "registerRecoveryQuestion"
        )?.value;


    const recoveryAnswer =
        document.getElementById(
            "registerRecoveryAnswer"
        )?.value.trim();


    const email =
        document.getElementById(
            "registerEmail"
        )?.value.trim();


    if (
        !name ||
        !cedula ||
        !whatsapp ||
        !password ||
        !recoveryQuestion ||
        !recoveryAnswer
    ) {

        toast(
            "Completa todos los campos obligatorios.",
            "error"
        );

        return;
    }


    const existingUsers =
        getStorage(
            "mf_registered_users",
            []
        );


    const exists =
        existingUsers.some(
            user =>
                user.cedula === cedula
        );


    if (exists) {

        toast(
            "Ya existe una cuenta con esa cédula.",
            "error"
        );

        return;
    }


    const newUser = {

        id: generateId("user"),

        name,

        cedula,

        whatsapp,

        password,

        recoveryQuestion,

        recoveryAnswer,

        email,

        profilePhoto: "",

        createdAt:
            new Date().toISOString()
    };


    existingUsers.push(newUser);

    setStorage(
        "mf_registered_users",
        existingUsers
    );


    const stats =
        getStats();

    stats.registered =
        (Number(stats.registered) || 0) + 1;

    saveStats(stats);


    setStorage(
        STORAGE_KEYS.user,
        newUser
    );


    addNotification(
        "Bienvenido a Market Flash",
        `Hola ${name}, tu cuenta fue creada correctamente.`
    );


    closeRegister();

    renderProfile();

    toast(
        "Cuenta creada correctamente.",
        "success"
    );
}


/* =========================================================
   LOGIN
   ========================================================= */

function openLogin() {

    closeRegister();

    const form =
        document.getElementById(
            "loginForm"
        );

    if (form) {
        form.reset();
    }

    openModal("loginModal");
}


function closeLogin() {
    closeModal("loginModal");
}


function login(event) {

    event.preventDefault();


    const cedula =
        document.getElementById(
            "loginCedula"
        )?.value.trim();


    const password =
        document.getElementById(
            "loginPassword"
        )?.value;


    if (!cedula || !password) {

        toast(
            "Escribe tu cédula y contraseña.",
            "error"
        );

        return;
    }


    const users =
        getStorage(
            "mf_registered_users",
            []
        );


    const user =
        users.find(
            item =>
                item.cedula === cedula &&
                item.password === password
        );


    if (!user) {

        toast(
            "Cédula o contraseña incorrecta.",
            "error"
        );

        return;
    }


    setStorage(
        STORAGE_KEYS.user,
        user
    );


    closeLogin();

    renderProfile();

    toast(
        `Bienvenido, ${user.name}.`,
        "success"
    );
}


/* =========================================================
   RECUPERACIÓN DE CONTRASEÑA
   ========================================================= */

function openRecovery() {

    closeLogin();

    const form =
        document.getElementById(
            "recoveryForm"
        );

    if (form) {
        form.reset();
    }

    hideElement(
        "recoveryQuestionContainer"
    );

    openModal("recoveryModal");
}


function closeRecovery() {
    closeModal("recoveryModal");
}


function findRecoveryQuestion() {

    const cedula =
        document.getElementById(
            "recoveryCedula"
        )?.value.trim();


    if (!cedula) {

        toast(
            "Escribe tu número de cédula.",
            "error"
        );

        return;
    }


    const users =
        getStorage(
            "mf_registered_users",
            []
        );


    const user =
        users.find(
            item =>
                item.cedula === cedula
        );


    if (!user) {

        toast(
            "No encontramos una cuenta con esa cédula.",
            "error"
        );

        return;
    }


    const question =
        document.getElementById(
            "recoveryQuestion"
        );


    if (question) {
        question.textContent =
            getRecoveryQuestionText(
                user.recoveryQuestion
            );
    }


    showElement(
        "recoveryQuestionContainer"
    );
}


function getRecoveryQuestionText(value) {

    const questions = {

        mascota:
            "¿Cuál era el nombre de tu primera mascota?",

        ciudad:
            "¿En qué ciudad naciste?",

        madre:
            "¿Cuál es el segundo nombre de tu madre?",

        escuela:
            "¿Cuál era el nombre de tu primera escuela?"
    };


    return (
        questions[value] ||
        "Pregunta de seguridad"
    );
}


function recoverPassword(event) {

    event.preventDefault();


    const cedula =
        document.getElementById(
            "recoveryCedula"
        )?.value.trim();


    const answer =
        document.getElementById(
            "recoveryAnswer"
        )?.value.trim();


    const newPassword =
        document.getElementById(
            "newPassword"
        )?.value;


    if (!cedula || !answer || !newPassword) {

        toast(
            "Completa todos los campos.",
            "error"
        );

        return;
    }


    const users =
        getStorage(
            "mf_registered_users",
            []
        );


    const index =
        users.findIndex(
            item =>
                item.cedula === cedula
        );


    if (index === -1) {

        toast(
            "Cuenta no encontrada.",
            "error"
        );

        return;
    }


    const user =
        users[index];


    if (
        String(user.recoveryAnswer)
            .toLowerCase()
            .trim() !==
        String(answer)
            .toLowerCase()
            .trim()
    ) {

        toast(
            "La respuesta de seguridad no coincide.",
            "error"
        );

        return;
    }


    user.password =
        newPassword;

    users[index] =
        user;


    setStorage(
        "mf_registered_users",
        users
    );


    toast(
        "Contraseña actualizada correctamente.",
        "success"
    );


    closeRecovery();

    openLogin();
}


/* =========================================================
   CERRAR SESIÓN
   ========================================================= */

function logout() {

    const confirmed =
        confirm(
            "¿Seguro que quieres cerrar sesión?"
        );

    if (!confirmed) {
        return;
    }


    localStorage.removeItem(
        STORAGE_KEYS.user
    );


    goHome();


    toast(
        "Sesión cerrada.",
        "success"
    );
}


/* =========================================================
   EDITAR PERFIL
   ========================================================= */

function openEditProfile() {

    const user =
        getUser();

    if (!user) {

        toast(
            "Debes iniciar sesión.",
            "error"
        );

        openLogin();

        return;
    }


    const name =
        document.getElementById(
            "editName"
        );


    const whatsapp =
        document.getElementById(
            "editWhatsapp"
        );


    const email =
        document.getElementById(
            "editEmail"
        );


    if (name) {
        name.value =
            user.name || "";
    }


    if (whatsapp) {
        whatsapp.value =
            user.whatsapp || "";
    }


    if (email) {
        email.value =
            user.email || "";
    }


    openModal("editProfileModal");
}


function closeEditProfile() {
    closeModal("editProfileModal");
}


function saveProfile(event) {

    event.preventDefault();


    const user =
        getUser();

    if (!user) {
        return;
    }


    user.name =
        document.getElementById(
            "editName"
        )?.value.trim();


    user.whatsapp =
        document.getElementById(
            "editWhatsapp"
        )?.value.trim();


    user.email =
        document.getElementById(
            "editEmail"
        )?.value.trim();


    setStorage(
        STORAGE_KEYS.user,
        user
    );


    const users =
        getStorage(
            "mf_registered_users",
            []
        );


    const index =
        users.findIndex(
            item =>
                item.cedula === user.cedula
        );


    if (index !== -1) {
        users[index] =
            user;

        setStorage(
            "mf_registered_users",
            users
        );
    }


    renderProfile();

    closeEditProfile();


    toast(
        "Perfil actualizado.",
        "success"
    );
}


/* =========================================================
   ELIMINAR CUENTA
   ========================================================= */

function confirmDeleteAccount() {

    const firstConfirm =
        confirm(
            "¿Seguro que quieres eliminar tu cuenta?"
        );

    if (!firstConfirm) {
        return;
    }


    const secondConfirm =
        confirm(
            "Esta acción eliminará tu cuenta local. ¿Continuar?"
        );

    if (!secondConfirm) {
        return;
    }


    deleteAccount();
}


function deleteAccount() {

    const user =
        getUser();

    if (!user) {
        return;
    }


    const users =
        getStorage(
            "mf_registered_users",
            []
        );


    const remainingUsers =
        users.filter(
            item =>
                item.cedula !== user.cedula
        );


    setStorage(
        "mf_registered_users",
        remainingUsers
    );


    const products =
        getProducts();


    const remainingProducts =
        products.filter(
            product =>
                product.ownerId !== user.cedula
        );


    saveProducts(
        remainingProducts
    );


    const stats =
        getStats();

    stats.deleted =
        (Number(stats.deleted) || 0) + 1;

    saveStats(stats);


    localStorage.removeItem(
        STORAGE_KEYS.user
    );


    goHome();


    toast(
        "Cuenta eliminada.",
        "success"
    );
}


/* =========================================================
   ACTIVIDAD
   ========================================================= */

function renderActivity() {

    const user =
        getUser();

    const products =
        getProducts();


    if (!user) {

        setText(
            "myViews",
            "0"
        );

        setText(
            "myInterests",
            "0"
        );

        setText(
            "myPublicationsCount",
            "0"
        );

        return;
    }


    const myProducts =
        products.filter(
            product =>
                product.ownerId === user.cedula
        );


    const views =
        myProducts.reduce(
            (total, product) =>
                total +
                (Number(product.views) || 0),
            0
        );


    const interests =
        myProducts.reduce(
            (total, product) =>
                total +
                (Number(product.likes) || 0),
            0
        );


    setText(
        "myViews",
        String(views)
    );


    setText(
        "myInterests",
        String(interests)
    );


    setText(
        "myPublicationsCount",
        String(myProducts.length)
    );


    renderMyProducts();

    renderReceipts();
}


function renderMyProducts() {

    const container =
        document.getElementById(
            "myProductsList"
        );


    const empty =
        document.getElementById(
            "emptyMyProducts"
        );


    if (!container) {
        return;
    }


    const user =
        getUser();


    if (!user) {

        container.innerHTML = "";

        if (empty) {
            empty.classList.remove(
                "hidden"
            );
        }

        return;
    }


    const products =
        getProducts().filter(
            product =>
                product.ownerId === user.cedula
        );


    container.innerHTML = "";


    if (products.length === 0) {

        if (empty) {
            empty.classList.remove(
                "hidden"
            );
        }

        return;
    }


    if (empty) {
        empty.classList.add(
            "hidden"
        );
    }


    products.forEach(product => {

        const item =
            document.createElement("div");

        item.className =
            "my-product-item";


        item.innerHTML = `

            <div class="my-product-info">

                <strong>
                    ${escapeHTML(product.name)}
                </strong>

                <span>
                    ${formatPrice(product.price)}
                </span>

                <small>
                    ${escapeHTML(product.category)}
                    ·
                    ${formatDate(product.createdAt)}
                </small>

            </div>

            <div class="my-product-stats">

                <span>
                    👁️ ${Number(product.views) || 0}
                </span>

                <span>
                    ❤️ ${Number(product.likes) || 0}
                </span>

            </div>
        `;


        container.appendChild(item);

    });
}


function renderReceipts() {

    const container =
        document.getElementById(
            "receiptsList"
        );


    if (container) {
        container.innerHTML = "";
    }
}


/* =========================================================
   NOTIFICACIONES
   ========================================================= */

function addNotification(title, message) {

    const notifications =
        getNotifications();


    notifications.unshift({

        id: generateId("notification"),

        title,

        message,

        createdAt:
            new Date().toISOString(),

        read: false
    });


    if (notifications.length > 50) {
        notifications.splice(
            50
        );
    }


    saveNotifications(
        notifications
    );
}


function openNotifications() {

    renderNotifications();

    openModal(
        "notificationsModal"
    );
}


function closeNotifications() {
    closeModal(
        "notificationsModal"
    );
}


function renderNotifications() {

    const list =
        document.getElementById(
            "notificationsList"
        );


    const empty =
        document.getElementById(
            "emptyNotifications"
        );


    if (!list) {
        return;
    }


    const notifications =
        getNotifications();


    list.innerHTML = "";


    if (notifications.length === 0) {

        if (empty) {
            empty.classList.remove(
                "hidden"
            );
        }

        return;
    }


    if (empty) {
        empty.classList.add(
            "hidden"
        );
    }


    notifications.forEach(
        notification => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "notification-item";


            item.innerHTML = `

                <div class="notification-icon">
                    🔔
                </div>

                <div class="notification-content">

                    <strong>
                        ${escapeHTML(notification.title)}
                    </strong>

                    <p>
                        ${escapeHTML(notification.message)}
                    </p>

                    <small>
                        ${formatDate(notification.createdAt)}
                    </small>

                </div>

            `;


            list.appendChild(item);

        }
    );
}


/* =========================================================
   PUBLICIDAD
   ========================================================= */

function openAdvertising() {

    const config =
        getConfig();


    if (!config.advertisingEnabled) {

        toast(
            "La publicidad está desactivada actualmente.",
            "error"
        );

        return;
    }


    resetAdvertisingForm();

    renderAdvertisingIntro();

    openModal(
        "advertisingModal"
    );
}


function closeAdvertising() {
    closeModal(
        "advertisingModal"
    );
}


function renderAdvertisingIntro() {

    showElement(
        "advertisingIntro"
    );

    hideElement(
        "advertisingCreate"
    );

    hideElement(
        "advertisingHowItWorks"
    );

    hideElement(
        "advertisingStatus"
    );
}


function openCreateAdvertising() {

    const user =
        getUser();


    if (!user) {

        toast(
            "Debes iniciar sesión para crear publicidad.",
            "error"
        );

        closeAdvertising();

        openLogin();

        return;
    }


    const config =
        getConfig();


    if (!config.advertisingEnabled) {

        toast(
            "La publicidad está desactivada.",
            "error"
        );

        return;
    }


    hideElement(
        "advertisingIntro"
    );

    showElement(
        "advertisingCreate"
    );

    hideElement(
        "advertisingHowItWorks"
    );

    hideElement(
        "advertisingStatus"
    );


    setText(
        "advertisingPrice",
        formatPrice(
            config.advertisingPrice
        )
    );


    renderPaymentMethods();
}


function resetAdvertisingForm() {

    const form =
        document.getElementById(
            "advertisingForm"
        );


    if (form) {
        form.reset();
    }


    selectedAdvertisingImage = "";

    selectedProofImage = "";


    const imagePreview =
        document.getElementById(
            "advertisingImagePreview"
        );


    const proofPreview =
        document.getElementById(
            "proofImagePreview"
        );


    if (imagePreview) {
        imagePreview.innerHTML = "";
    }


    if (proofPreview) {
        proofPreview.innerHTML = "";
    }


    const user =
        getUser();


    const whatsapp =
        document.getElementById(
            "advertisingWhatsapp"
        );


    if (user && whatsapp) {
        whatsapp.value =
            user.whatsapp || "";
    }
}


function renderPaymentMethods() {

    const container =
        document.getElementById(
            "paymentMethods"
        );


    if (!container) {
        return;
    }


    const config =
        getConfig();


    container.innerHTML = "";


    config.paymentMethods.forEach(
        (method, index) => {

            const label =
                document.createElement(
                    "label"
                );


            label.className =
                "payment-method-option";


            label.innerHTML = `

                <input
                    type="radio"
                    name="paymentMethod"
                    value="${escapeHTML(method)}"
                    ${index === 0 ? "checked" : ""}
                >

                <span>
                    ${escapeHTML(method)}
                </span>

            `;


            container.appendChild(label);

        }
    );
}


/* =========================================================
   IMAGEN PUBLICIDAD
   ========================================================= */

function openAdvertisingCamera() {

    const input =
        document.getElementById(
            "advertisingCameraInput"
        );


    if (input) {
        input.click();
    }
}


function openAdvertisingGallery() {

    const input =
        document.getElementById(
            "advertisingGalleryInput"
        );


    if (input) {
        input.click();
    }
}


function handleAdvertisingImage(file) {

    if (!file) {
        return;
    }


    if (!file.type.startsWith("image/")) {

        toast(
            "Selecciona una imagen válida.",
            "error"
        );

        return;
    }


    const reader =
        new FileReader();


    reader.onload = event => {

        selectedAdvertisingImage =
            event.target.result;


        const preview =
            document.getElementById(
                "advertisingImagePreview"
            );


        if (preview) {

            preview.innerHTML = `

                <div class="preview-image-wrapper">

                    <img
                        src="${selectedAdvertisingImage}"
                        alt="Publicidad"
                    >

                    <button
                        type="button"
                        class="preview-remove"
                        onclick="removeAdvertisingImage()"
                    >
                        ✕
                    </button>

                </div>

            `;
        }
    };


    reader.readAsDataURL(file);
}


function removeAdvertisingImage() {

    selectedAdvertisingImage = "";


    const preview =
        document.getElementById(
            "advertisingImagePreview"
        );


    if (preview) {
        preview.innerHTML = "";
    }
}


/* =========================================================
   COMPROBANTE
   ========================================================= */

function openProofGallery() {

    const input =
        document.getElementById(
            "proofGalleryInput"
        );


    if (input) {
        input.click();
    }
}


function handleProofImage(file) {

    if (!file) {
        return;
    }


    if (!file.type.startsWith("image/")) {

        toast(
            "Selecciona una imagen válida.",
            "error"
        );

        return;
    }


    const reader =
        new FileReader();


    reader.onload = event => {

        selectedProofImage =
            event.target.result;


        const preview =
            document.getElementById(
                "proofImagePreview"
            );


        if (preview) {

            preview.innerHTML = `

                <div class="preview-image-wrapper">

                    <img
                        src="${selectedProofImage}"
                        alt="Comprobante"
                    >

                    <button
                        type="button"
                        class="preview-remove"
                        onclick="removeProofImage()"
                    >
                        ✕
                    </button>

                </div>

            `;
        }
    };


    reader.readAsDataURL(file);
}


function removeProofImage() {

    selectedProofImage = "";


    const preview =
        document.getElementById(
            "proofImagePreview"
        );


    if (preview) {
        preview.innerHTML = "";
    }
}


/* =========================================================
   CREAR PUBLICIDAD
   ========================================================= */

function createAdvertising(event) {

    event.preventDefault();


    const user =
        getUser();


    if (!user) {

        toast(
            "Debes iniciar sesión.",
            "error"
        );

        return;
    }


    const title =
        document.getElementById(
            "advertisingTitle"
        )?.value.trim();


    const description =
        document.getElementById(
            "advertisingDescription"
        )?.value.trim();


    const whatsapp =
        document.getElementById(
            "advertisingWhatsapp"
        )?.value.trim();


    const payment =
        document.querySelector(
            'input[name="paymentMethod"]:checked'
        )?.value;


    if (
        !title ||
        !description ||
        !whatsapp ||
        !payment
    ) {

        toast(
            "Completa todos los campos.",
            "error"
        );

        return;
    }


    if (!selectedAdvertisingImage) {

        toast(
            "Debes agregar una imagen para la publicidad.",
            "error"
        );

        return;
    }


    if (!selectedProofImage) {

        toast(
            "Debes agregar el comprobante de pago.",
            "error"
        );

        return;
    }


    const config =
        getConfig();


    const ad = {

        id: generateId("ad"),

        ownerId:
            user.cedula,

        ownerName:
            user.name,

        title,

        description,

        whatsapp,

        image:
            selectedAdvertisingImage,

        proof:
            selectedProofImage,

        paymentMethod:
            payment,

        price:
            Number(config.advertisingPrice) || 0,

        status:
            "pending",

        createdAt:
            new Date().toISOString()
    };


    const ads =
        getAds();


    ads.unshift(ad);

    saveAds(ads);


    addNotification(
        "Publicidad enviada",
        "Tu publicidad fue enviada y está pendiente de revisión."
    );


    renderAdvertisingStatus(ad);


    toast(
        "Publicidad enviada correctamente.",
        "success"
    );
}


/* =========================================================
   ESTADO DE PUBLICIDAD
   ========================================================= */

function renderAdvertisingStatus(ad) {

    hideElement(
        "advertisingIntro"
    );

    hideElement(
        "advertisingCreate"
    );

    hideElement(
        "advertisingHowItWorks"
    );

    showElement(
        "advertisingStatus"
    );


    const container =
        document.getElementById(
            "advertisingStatus"
        );


    if (!container) {
        return;
    }


    let statusText =
        "Pendiente de revisión";

    let statusClass =
        "status-pending";


    if (ad.status === "approved") {

        statusText =
            "Publicidad aprobada";

        statusClass =
            "status-approved";

    } else if (ad.status === "rejected") {

        statusText =
            "Publicidad rechazada";

        statusClass =
            "status-rejected";
    }


    container.innerHTML = `

        <div class="advertising-status-card ${statusClass}">

            <div class="status-icon">
                ${
                    ad.status === "approved"
                        ? "✅"
                        : ad.status === "rejected"
                            ? "❌"
                            : "⏳"
                }
            </div>

            <h3>
                ${statusText}
            </h3>

            <p>
                ${escapeHTML(ad.title)}
            </p>

            <small>
                Enviado el ${formatDate(ad.createdAt)}
            </small>

        </div>

    `;
}


/* =========================================================
   ANUNCIOS APROBADOS EN LA PÁGINA PRINCIPAL
   ========================================================= */

function renderAdvertisingSpot() {

    const container =
        document.getElementById(
            "advertisingSpot"
        );


    if (!container) {
        return;
    }


    const ads =
        getAds().filter(
            ad =>
                ad.status === "approved"
        );


    if (ads.length === 0) {

        container.innerHTML = "";

        return;
    }


    const ad =
        ads[0];


    container.innerHTML = `

        <div
            class="public-ad-card"
            onclick="openPublicAd('${ad.id}')"
        >

            ${
                ad.image
                    ? `
                        <img
                            src="${ad.image}"
                            alt="${escapeHTML(ad.title)}"
                        >
                    `
                    : ""
            }

            <div class="public-ad-content">

                <span>
                    PUBLICIDAD
                </span>

                <h3>
                    ${escapeHTML(ad.title)}
                </h3>

                <p>
                    ${escapeHTML(ad.description)}
                </p>

            </div>

        </div>
    `;
}


function openPublicAd(adId) {

    const ad =
        getAds().find(
            item =>
                item.id === adId
        );


    if (!ad) {
        return;
    }


    const phone =
        normalizePhone(
            ad.whatsapp
        );


    const url =
        `https://wa.me/${phone}`;


    alert(
        `${ad.title}\n\n${ad.description}\n\nWhatsApp: ${ad.whatsapp}`
    );


    if (phone) {

        const openWhatsApp =
            confirm(
                "¿Quieres contactar por WhatsApp?"
            );


        if (openWhatsApp) {
            window.open(
                url,
                "_blank"
            );
        }
    }
}


/* =========================================================
   CÓMO FUNCIONA PUBLICIDAD
   ========================================================= */

function openAdvertisingHowItWorks() {

    hideElement(
        "advertisingIntro"
    );

    hideElement(
        "advertisingCreate"
    );

    hideElement(
        "advertisingStatus"
    );

    showElement(
        "advertisingHowItWorks"
    );
}


/* =========================================================
   ADMINISTRADOR
   ========================================================= */

function openAdminLogin() {

    const form =
        document.getElementById(
            "adminLoginForm"
        );


    if (form) {
        form.reset();
    }


    openModal(
        "adminLoginModal"
    );
}


function closeAdminLogin() {
    closeModal(
        "adminLoginModal"
    );
}


function adminLogin(event) {

    event.preventDefault();


    const username =
        document.getElementById(
            "adminUsername"
        )?.value.trim();


    const password =
        document.getElementById(
            "adminPassword"
        )?.value;


    /*
       Credenciales de demostración.
       Deben cambiarse cuando se conecte
       el sistema real de administración.
    */

    if (
        username !== "admin" ||
        password !== "admin123"
    ) {

        toast(
            "Usuario o contraseña de administrador incorrectos.",
            "error"
        );

        return;
    }


    closeAdminLogin();

    openAdmin();
}


function openAdmin() {

    renderAdminStats();

    renderAdminConfig();

    renderAdminAds();

    openModal(
        "adminModal"
    );
}


function closeAdmin() {
    closeModal(
        "adminModal"
    );
}


/* =========================================================
   ESTADÍSTICAS ADMIN
   ========================================================= */

function renderAdminStats() {

    const stats =
        getStats();

    const users =
        getStorage(
            "mf_registered_users",
            []
        );

    const products =
        getProducts();

    const ads =
        getAds();


    setText(
        "adminRegisteredCount",
        String(users.length)
    );


    setText(
        "adminDeletedCount",
        String(stats.deleted || 0)
    );


    setText(
        "adminProductsCount",
        String(products.length)
    );


    setText(
        "adminAdsCount",
        String(ads.length)
    );
}


/* =========================================================
   CONFIG ADMIN
   ========================================================= */

function renderAdminConfig() {

    const config =
        getConfig();


    const enabled =
        document.getElementById(
            "adminAdvertisingEnabled"
        );


    const price =
        document.getElementById(
            "adminAdvertisingPrice"
        );


    if (enabled) {
        enabled.checked =
            Boolean(
                config.advertisingEnabled
            );
    }


    if (price) {
        price.value =
            Number(
                config.advertisingPrice
            ) || 0;
    }


    renderAdminPaymentMethods();
}


function toggleAdvertisingEnabled() {

    const enabled =
        document.getElementById(
            "adminAdvertisingEnabled"
        );


    if (!enabled) {
        return;
    }


    const config =
        getConfig();


    config.advertisingEnabled =
        enabled.checked;


    saveConfig(config);


    toast(
        enabled.checked
            ? "Publicidad activada."
            : "Publicidad desactivada.",
        "success"
    );
}


function saveAdvertisingConfig() {

    const config =
        getConfig();


    const enabled =
        document.getElementById(
            "adminAdvertisingEnabled"
        );


    const price =
        document.getElementById(
            "adminAdvertisingPrice"
        );


    if (enabled) {
        config.advertisingEnabled =
            enabled.checked;
    }


    if (price) {
        config.advertisingPrice =
            Number(price.value) || 0;
    }


    saveConfig(config);


    toast(
        "Configuración guardada.",
        "success"
    );


    renderAdvertisingSpot();
}


/* =========================================================
   MÉTODOS DE PAGO ADMIN
   ========================================================= */

function renderAdminPaymentMethods() {

    const container =
        document.getElementById(
            "adminPaymentMethods"
        );


    if (!container) {
        return;
    }


    const config =
        getConfig();


    container.innerHTML = "";


    config.paymentMethods.forEach(
        (method, index) => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "admin-payment-method";


            item.innerHTML = `

                <span>
                    ${escapeHTML(method)}
                </span>

                <button
                    type="button"
                    class="danger-button"
                    onclick="removePaymentMethod(${index})"
                >
                    Eliminar
                </button>

            `;


            container.appendChild(item);

        }
    );
}


function addPaymentMethod() {

    const input =
        document.getElementById(
            "newPaymentMethod"
        );


    if (!input) {
        return;
    }


    const method =
        input.value.trim();


    if (!method) {

        toast(
            "Escribe el método de pago.",
            "error"
        );

        return;
    }


    const config =
        getConfig();


    const exists =
        config.paymentMethods.some(
            item =>
                item.toLowerCase() ===
                method.toLowerCase()
        );


    if (exists) {

        toast(
            "Ese método de pago ya existe.",
            "error"
        );

        return;
    }


    config.paymentMethods.push(
        method
    );


    saveConfig(config);


    input.value = "";

    renderAdminPaymentMethods();

    toast(
        "Método de pago agregado.",
        "success"
    );
}


function removePaymentMethod(index) {

    const config =
        getConfig();


    if (
        index < 0 ||
        index >= config.paymentMethods.length
    ) {
        return;
    }


    const method =
        config.paymentMethods[index];


    const confirmed =
        confirm(
            `¿Eliminar "${method}"?`
        );


    if (!confirmed) {
        return;
    }


    config.paymentMethods.splice(
        index,
        1
    );


    saveConfig(config);

    renderAdminPaymentMethods();

    toast(
        "Método de pago eliminado.",
        "success"
    );
}


/* =========================================================
   PUBLICIDADES ADMIN
   ========================================================= */

function renderAdminAds() {

    const container =
        document.getElementById(
            "adminAdsList"
        );


    if (!container) {
        return;
    }


    const ads =
        getAds();


    container.innerHTML = "";


    if (ads.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📢</div>
                <h3>No hay publicidades</h3>
                <p>
                    Todavía no se han enviado anuncios.
                </p>
            </div>
        `;

        return;
    }


    ads.forEach(ad => {

        const item =
            document.createElement(
                "div"
            );


        item.className =
            "admin-ad-item";


        const statusText =
            ad.status === "approved"
                ? "Aprobada"
                : ad.status === "rejected"
                    ? "Rechazada"
                    : "Pendiente";


        item.innerHTML = `

            <div class="admin-ad-image">

                ${
                    ad.image
                        ? `
                            <img
                                src="${ad.image}"
                                alt="${escapeHTML(ad.title)}"
                            >
                        `
                        : "📢"
                }

            </div>


            <div class="admin-ad-info">

                <h4>
                    ${escapeHTML(ad.title)}
                </h4>

                <p>
                    ${escapeHTML(ad.description)}
                </p>

                <small>
                    Usuario:
                    ${escapeHTML(ad.ownerName)}
                </small>

                <small>
                    Pago:
                    ${escapeHTML(ad.paymentMethod)}
                </small>

                <small>
                    Estado:
                    ${statusText}
                </small>


                <div class="admin-ad-actions">

                    <button
                        type="button"
                        class="secondary-button"
                        onclick="viewProof('${ad.id}')"
                    >
                        Ver comprobante
                    </button>


                    <button
                        type="button"
                        class="primary-button"
                        onclick="changeAdStatus('${ad.id}', 'approved')"
                    >
                        Aprobar
                    </button>


                    <button
                        type="button"
                        class="danger-button"
                        onclick="changeAdStatus('${ad.id}', 'rejected')"
                    >
                        Rechazar
                    </button>

                </div>

            </div>

        `;


        container.appendChild(item);

    });
}


function changeAdStatus(adId, status) {

    const ads =
        getAds();


    const index =
        ads.findIndex(
            ad =>
                ad.id === adId
        );


    if (index === -1) {
        return;
    }


    ads[index].status =
        status;


    ads[index].reviewedAt =
        new Date().toISOString();


    saveAds(ads);


    const ad =
        ads[index];


    if (status === "approved") {

        addNotification(
            "Publicidad aprobada",
            `La publicidad "${ad.title}" fue aprobada.`
        );

    } else {

        addNotification(
            "Publicidad rechazada",
            `La publicidad "${ad.title}" fue rechazada.`
        );
    }


    renderAdminAds();

    renderAdminStats();

    renderAdvertisingSpot();


    toast(
        status === "approved"
            ? "Publicidad aprobada."
            : "Publicidad rechazada.",
        "success"
    );
}


/* =========================================================
   COMPROBANTE ADMIN
   ========================================================= */

function viewProof(adId) {

    const ad =
        getAds().find(
            item =>
                item.id === adId
        );


    if (!ad) {
        return;
    }


    const viewer =
        document.getElementById(
            "proofViewer"
        );


    if (!viewer) {
        return;
    }


    viewer.innerHTML = `

        ${
            ad.proof
                ? `
                    <img
                        src="${ad.proof}"
                        alt="Comprobante de pago"
                        class="proof-image"
                    >
                `
                : `
                    <div class="empty-state">
                        No hay comprobante.
                    </div>
                `
        }

    `;


    openModal(
        "proofViewerModal"
    );
}


function closeProofViewer() {
    closeModal(
        "proofViewerModal"
    );
}


/* =========================================================
   INICIALIZACIÓN
   ========================================================= */

function initializeStorage() {

    initializeProducts();


    const config =
        getStorage(
            STORAGE_KEYS.config,
            null
        );


    if (!config) {
        saveConfig(
            DEFAULT_CONFIG
        );
    }


    const stats =
        getStorage(
            STORAGE_KEYS.stats,
            null
        );


    if (!stats) {

        saveStats({
            registered: 0,
            deleted: 0
        });

    }


    const notifications =
        getStorage(
            STORAGE_KEYS.notifications,
            null
        );


    if (!notifications) {
        saveNotifications([]);
    }
}


/* =========================================================
   EVENTOS DE ARCHIVOS
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeStorage();


        const productCamera =
            document.getElementById(
                "productCameraInput"
            );


        const productGallery =
            document.getElementById(
                "productGalleryInput"
            );


        if (productCamera) {

            productCamera.addEventListener(
                "change",
                event => {

                    handleProductImages(
                        event.target.files
                    );

                    event.target.value = "";

                }
            );
        }


        if (productGallery) {

            productGallery.addEventListener(
                "change",
                event => {

                    handleProductImages(
                        event.target.files
                    );

                    event.target.value = "";

                }
            );
        }


        const profileCamera =
            document.getElementById(
                "profileCameraInput"
            );


        const profileGallery =
            document.getElementById(
                "profileGalleryInput"
            );


        if (profileCamera) {

            profileCamera.addEventListener(
                "change",
                event => {

                    const file =
                        event.target.files?.[0];

                    handleProfileImage(file);

                    event.target.value = "";

                }
            );
        }


        if (profileGallery) {

            profileGallery.addEventListener(
                "change",
                event => {

                    const file =
                        event.target.files?.[0];

                    handleProfileImage(file);

                    event.target.value = "";

                }
            );
        }


        const advertisingCamera =
            document.getElementById(
                "advertisingCameraInput"
            );


        const advertisingGallery =
            document.getElementById(
                "advertisingGalleryInput"
            );


        if (advertisingCamera) {

            advertisingCamera.addEventListener(
                "change",
                event => {

                    const file =
                        event.target.files?.[0];

                    handleAdvertisingImage(file);

                    event.target.value = "";

                }
            );
        }


        if (advertisingGallery) {

            advertisingGallery.addEventListener(
                "change",
                event => {

                    const file =
                        event.target.files?.[0];

                    handleAdvertisingImage(file);

                    event.target.value = "";

                }
            );
        }


        const proofInput =
            document.getElementById(
                "proofGalleryInput"
            );


        if (proofInput) {

            proofInput.addEventListener(
                "change",
                event => {

                    const file =
                        event.target.files?.[0];

                    handleProofImage(file);

                    event.target.value = "";

                }
            );
        }


        renderProducts();

        renderAdvertisingSpot();

        renderProfile();

    }
);


/* =========================================================
   CERRAR MODALES CON ESC
   ========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (event.key !== "Escape") {
            return;
        }


        document
            .querySelectorAll(
                ".modal:not(.hidden)"
            )
            .forEach(modal => {

                modal.classList.add(
                    "hidden"
                );

            });


        const overlay =
            document.getElementById(
                "overlay"
            );


        if (overlay) {
            overlay.classList.add(
                "hidden"
            );
        }

    }
);


/* =========================================================
   ACTUALIZACIÓN DE PESTAÑA
   ========================================================= */

window.addEventListener(
    "storage",
    event => {

        if (
            event.key === STORAGE_KEYS.products
        ) {
            renderProducts();
            renderActivity();
        }


        if (
            event.key === STORAGE_KEYS.config
        ) {
            renderAdvertisingSpot();
        }


        if (
            event.key === STORAGE_KEYS.ads
        ) {
            renderAdvertisingSpot();
        }

    }
);
