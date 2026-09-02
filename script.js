/* =========================================================
   MARKET FLASH — SCRIPT.JS
========================================================= */

const ADMIN_CREDENTIALS = {
    username: "admin",
    password: "admin123"
};

const STORAGE_KEYS = {
    users: "mf_users",
    products: "mf_products",
    currentUser: "mf_current_user",
    notifications: "mf_notifications",
    chats: "mf_chats",
    advertising: "mf_advertising",
    paymentMethods: "mf_payment_methods",
    settings: "mf_settings"
};

let selectedCategory = "Todos";
let currentProductId = null;
let currentChatId = null;
let currentImageIndex = 0;
let currentProductImages = [];
let editingProductId = null;
let editingPaymentMethodId = null;


/* =========================================================
   UTILIDADES
========================================================= */

function generateId(prefix = "mf") {
    return prefix + "_" + Date.now() + "_" +
        Math.random().toString(36).substring(2, 9);
}

function getStorage(key, fallback = []) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
    } catch (error) {
        return fallback;
    }
}

function setStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function escapeHTML(value) {
    if (value === null || value === undefined) return "";

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatPrice(price) {
    return Number(price || 0).toLocaleString("es-DO", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function formatDate(date) {
    if (!date) return "";

    return new Date(date).toLocaleDateString("es-DO", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}

function getCurrentUser() {
    return JSON.parse(
        localStorage.getItem(STORAGE_KEYS.currentUser) || "null"
    );
}

function saveCurrentUser(user) {
    localStorage.setItem(
        STORAGE_KEYS.currentUser,
        JSON.stringify(user)
    );
}


/* =========================================================
   INICIALIZACIÓN
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    initializeStorage();
    initializeSearch();
    updateInterface();

    const currentUser = getCurrentUser();

    if (currentUser) {
        showPage("homePage");
    } else {
        showPage("homePage");
    }

});


function initializeStorage() {

    if (!localStorage.getItem(STORAGE_KEYS.users)) {
        setStorage(STORAGE_KEYS.users, []);
    }

    if (!localStorage.getItem(STORAGE_KEYS.products)) {
        setStorage(STORAGE_KEYS.products, []);
    }

    if (!localStorage.getItem(STORAGE_KEYS.notifications)) {
        setStorage(STORAGE_KEYS.notifications, []);
    }

    if (!localStorage.getItem(STORAGE_KEYS.chats)) {
        setStorage(STORAGE_KEYS.chats, []);
    }

    if (!localStorage.getItem(STORAGE_KEYS.advertising)) {
        setStorage(STORAGE_KEYS.advertising, {
            enabled: true,
            price: 500,
            requests: []
        });
    }

    if (!localStorage.getItem(STORAGE_KEYS.paymentMethods)) {
        setStorage(STORAGE_KEYS.paymentMethods, [
            {
                id: generateId("pay"),
                name: "Transferencia bancaria",
                price: 0
            }
        ]);
    }

    if (!localStorage.getItem(STORAGE_KEYS.settings)) {
        setStorage(STORAGE_KEYS.settings, {
            advertisingEnabled: true,
            advertisingPrice: 500
        });
    }
}


/* =========================================================
   NAVEGACIÓN
========================================================= */

function showPage(pageId) {

    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active");
    });

    const page = document.getElementById(pageId);

    if (page) {
        page.classList.add("active");
    }

    document.querySelectorAll(".nav-item").forEach(item => {
        item.classList.remove("active");

        if (item.dataset.page === pageId) {
            item.classList.add("active");
        }
    });

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    updateInterface();
}


function openLogin() {
    showPage("loginPage");
}

function openRegister() {
    showPage("registerPage");
}

function openRecovery() {
    showPage("recoveryPage");
}

function openPublish() {

    const user = getCurrentUser();

    if (!user) {
        showToast("Debes iniciar sesión para publicar.");
        openLogin();
        return;
    }

    editingProductId = null;

    resetPublishForm();

    showPage("publishPage");
}

function openProfile() {

    const user = getCurrentUser();

    if (!user) {
        openLogin();
        return;
    }

    renderProfile();
    showPage("profilePage");
}

function openMyPublications() {

    const user = getCurrentUser();

    if (!user) {
        openLogin();
        return;
    }

    renderMyPublications();
    showPage("myPublicationsPage");
}

function openMyChats() {

    const user = getCurrentUser();

    if (!user) {
        openLogin();
        return;
    }

    renderChatList();
    showPage("chatsPage");
}

function openSettings() {
    showPage("settingsPage");
}


/* =========================================================
   BUSCADOR
========================================================= */

function initializeSearch() {

    const input = document.getElementById("searchInput");

    if (!input) return;

    input.addEventListener("input", () => {
        renderProducts();
    });
}


function filterCategory(category) {

    selectedCategory = category;

    document.querySelectorAll(".category-btn").forEach(button => {

        button.classList.toggle(
            "active",
            button.dataset.category === category
        );

    });

    renderProducts();
}


/* =========================================================
   PUBLICACIONES
========================================================= */

function getProducts() {
    return getStorage(STORAGE_KEYS.products, []);
}

function saveProducts(products) {
    setStorage(STORAGE_KEYS.products, products);
}


function renderProducts() {

    const grid = document.getElementById("productsGrid");

    if (!grid) return;

    const searchInput = document.getElementById("searchInput");

    const search = searchInput
        ? searchInput.value.toLowerCase().trim()
        : "";

    let products = getProducts();

    products = products.filter(product => {

        const categoryMatch =
            selectedCategory === "Todos" ||
            product.category === selectedCategory;

        const text =
            `${product.name} ${product.description} ${product.location}`
                .toLowerCase();

        const searchMatch =
            !search || text.includes(search);

        return categoryMatch && searchMatch;
    });


    grid.innerHTML = "";

    products.forEach(product => {

        grid.insertAdjacentHTML(
            "beforeend",
            createProductCard(product)
        );

    });


    const count = document.getElementById("publicationCount");

    if (count) {
        count.textContent =
            `${products.length} publicación${products.length === 1 ? "" : "es"}`;
    }


    const empty = document.getElementById("emptyProducts");

    if (empty) {
        empty.classList.toggle(
            "hidden",
            products.length > 0
        );
    }
}


function createProductCard(product) {

    const image =
        product.images && product.images.length
            ? product.images[0]
            : "";


    const likedBy =
        product.likedBy || [];

    const dislikedBy =
        product.dislikedBy || [];

    const currentUser = getCurrentUser();

    const userId = currentUser
        ? currentUser.id
        : null;


    const liked =
        userId && likedBy.includes(userId);

    const disliked =
        userId && dislikedBy.includes(userId);


    return `
        <article class="product-card">

            <div
                class="product-image-container"
                onclick="openProductDetail('${product.id}')">

                ${
                    image
                    ? `
                        <img
                            src="${image}"
                            alt="${escapeHTML(product.name)}"
                            class="product-image">
                    `
                    : `
                        <div class="product-no-image">
                            📦
                        </div>
                    `
                }

                ${
                    product.images && product.images.length > 1
                    ? `
                        <span class="image-count">
                            📷 ${product.images.length}
                        </span>
                    `
                    : ""
                }

            </div>


            <div class="product-card-body">

                <div class="product-category">
                    ${escapeHTML(product.category || "Otros")}
                </div>

                <h3>
                    ${escapeHTML(product.name)}
                </h3>

                <div class="product-price">
                    RD$ ${formatPrice(product.price)}
                </div>

                ${
                    product.location
                    ? `
                        <div class="product-location">
                            📍 ${escapeHTML(product.location)}
                        </div>
                    `
                    : ""
                }


                <div class="product-actions">

                    <button
                        class="like-btn ${liked ? "active" : ""}"
                        onclick="toggleLike('${product.id}')">

                        👍
                        <span>
                            ${likedBy.length}
                        </span>

                    </button>


                    <button
                        class="dislike-btn ${disliked ? "active" : ""}"
                        onclick="toggleDislike('${product.id}')">

                        👎
                        <span>
                            ${dislikedBy.length}
                        </span>

                    </button>


                    <button
                        class="chat-product-btn"
                        onclick="startChatFromProduct('${product.id}')">

                        💬 Chat

                    </button>


                    <button
                        class="whatsapp-btn"
                        onclick="openWhatsApp('${product.id}')">

                        WhatsApp

                    </button>

                </div>

            </div>

        </article>
    `;
}


/* =========================================================
   DETALLE DEL PRODUCTO
========================================================= */

function openProductDetail(productId) {

    const products = getProducts();

    const product =
        products.find(item => item.id === productId);

    if (!product) return;

    currentProductId = productId;

    product.views = Number(product.views || 0) + 1;

    saveProducts(products);

    renderProductDetail(product);

    showPage("productDetailPage");
}


function renderProductDetail(product) {

    const container =
        document.getElementById("productDetail");

    if (!container) return;


    currentProductImages =
        product.images && product.images.length
            ? product.images
            : [];


    const currentUser = getCurrentUser();

    const isOwner =
        currentUser &&
        product.userId === currentUser.id;


    const likedBy =
        product.likedBy || [];

    const dislikedBy =
        product.dislikedBy || [];


    const liked =
        currentUser &&
        likedBy.includes(currentUser.id);

    const disliked =
        currentUser &&
        dislikedBy.includes(currentUser.id);


    const imagesHTML =
        currentProductImages.length
        ? `
            <div class="detail-images">

                <div
                    class="detail-main-image"
                    onclick="openImageViewer(0)">

                    <img
                        src="${currentProductImages[0]}"
                        alt="${escapeHTML(product.name)}">

                    <div class="expand-image-hint">
                        ⛶ Ampliar
                    </div>

                </div>


                ${
                    currentProductImages.length > 1
                    ? `
                        <div class="detail-thumbnails">

                            ${currentProductImages.map(
                                (image, index) => `
                                    <button
                                        onclick="openImageViewer(${index})">

                                        <img
                                            src="${image}"
                                            alt="Imagen ${index + 1}">

                                    </button>
                                `
                            ).join("")}

                        </div>
                    `
                    : ""
                }

            </div>
        `
        : `
            <div class="detail-no-image">
                📦
            </div>
        `;


    container.innerHTML = `

        ${imagesHTML}


        <div class="detail-body">

            <div class="product-category">
                ${escapeHTML(product.category || "Otros")}
            </div>


            <h1>
                ${escapeHTML(product.name)}
            </h1>


            <div class="detail-price">
                RD$ ${formatPrice(product.price)}
            </div>


            ${
                product.location
                ? `
                    <div class="detail-location">
                        📍 ${escapeHTML(product.location)}
                    </div>
                `
                : ""
            }


            <div class="detail-stats">

                <span>
                    👁️ ${product.views || 0} vistas
                </span>

                <span>
                    👍 ${likedBy.length}
                </span>

                <span>
                    👎 ${dislikedBy.length}
                </span>

            </div>


            <div class="detail-description">

                <h3>Descripción</h3>

                <p>
                    ${escapeHTML(
                        product.description ||
                        "Sin descripción."
                    )}
                </p>

            </div>


            <div class="detail-actions">

                <button
                    class="like-large-btn ${liked ? "active" : ""}"
                    onclick="toggleLike('${product.id}')">

                    👍 Me gusta
                    (${likedBy.length})

                </button>


                <button
                    class="dislike-large-btn ${disliked ? "active" : ""}"
                    onclick="toggleDislike('${product.id}')">

                    👎 No me gusta
                    (${dislikedBy.length})

                </button>


                <button
                    class="chat-large-btn"
                    onclick="startChatFromProduct('${product.id}')">

                    💬 Chat

                </button>


                <button
                    class="whatsapp-large-btn"
                    onclick="openWhatsApp('${product.id}')">

                    🟢 WhatsApp

                </button>

            </div>


            ${
                isOwner
                ? `
                    <div class="owner-actions">

                        <h3>
                            Administrar publicación
                        </h3>


                        <button
                            class="edit-product-btn"
                            onclick="editProduct('${product.id}')">

                            ✏️ Editar publicación

                        </button>


                        <button
                            class="delete-product-btn"
                            onclick="deleteProduct('${product.id}')">

                            🗑️ Eliminar publicación

                        </button>

                    </div>
                `
                : ""
            }

        </div>
    `;
}


/* =========================================================
   ME GUSTA
========================================================= */

function toggleLike(productId) {

    const user = getCurrentUser();

    if (!user) {
        showToast("Inicia sesión para votar.");
        openLogin();
        return;
    }


    const products = getProducts();

    const product =
        products.find(item => item.id === productId);

    if (!product) return;


    product.likedBy = product.likedBy || [];
    product.dislikedBy = product.dislikedBy || [];


    const likedIndex =
        product.likedBy.indexOf(user.id);

    const dislikedIndex =
        product.dislikedBy.indexOf(user.id);


    if (likedIndex >= 0) {

        product.likedBy.splice(likedIndex, 1);

    } else {

        product.likedBy.push(user.id);

        if (dislikedIndex >= 0) {
            product.dislikedBy.splice(dislikedIndex, 1);
        }

    }


    saveProducts(products);

    renderProducts();


    if (currentProductId === productId) {
        renderProductDetail(product);
    }
}


/* =========================================================
   NO ME GUSTA
========================================================= */

function toggleDislike(productId) {

    const user = getCurrentUser();

    if (!user) {
        showToast("Inicia sesión para votar.");
        openLogin();
        return;
    }


    const products = getProducts();

    const product =
        products.find(item => item.id === productId);

    if (!product) return;


    product.likedBy = product.likedBy || [];
    product.dislikedBy = product.dislikedBy || [];


    const likedIndex =
        product.likedBy.indexOf(user.id);

    const dislikedIndex =
        product.dislikedBy.indexOf(user.id);


    if (dislikedIndex >= 0) {

        product.dislikedBy.splice(dislikedIndex, 1);

    } else {

        product.dislikedBy.push(user.id);

        if (likedIndex >= 0) {
            product.likedBy.splice(likedIndex, 1);
        }

    }


    saveProducts(products);

    renderProducts();


    if (currentProductId === productId) {
        renderProductDetail(product);
    }
}


/* =========================================================
   WHATSAPP
========================================================= */

function openWhatsApp(productId) {

    const product =
        getProducts().find(item => item.id === productId);

    if (!product) return;


    let phone =
        product.whatsapp ||
        "";


    phone = phone.replace(/\D/g, "");


    if (!phone) {
        showToast(
            "Esta publicación no tiene WhatsApp registrado."
        );
        return;
    }


    if (phone.length === 10) {
        phone = "1" + phone;
    }


    const message =
        `Hola, vi tu publicación "${product.name}" en Market Flash y estoy interesado/a.`;


    const url =
        `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;


    window.open(url, "_blank");
}


/* =========================================================
   CÁMARA Y GALERÍA
========================================================= */

function openCamera() {

    const input =
        document.getElementById("cameraInput");

    if (input) {
        input.click();
    }
}


function openGallery() {

    const input =
        document.getElementById("galleryInput");

    if (input) {
        input.click();
    }
}


function handleImageSelection(event) {

    const files =
        Array.from(event.target.files || []);

    if (!files.length) return;


    const preview =
        document.getElementById("imagePreview");

    if (!preview) return;


    preview.innerHTML = "";


    files.forEach((file, index) => {

        if (!file.type.startsWith("image/")) {
            return;
        }


        const reader = new FileReader();


        reader.onload = function(e) {

            const wrapper =
                document.createElement("div");

            wrapper.className =
                "preview-image-wrapper";


            wrapper.innerHTML = `

                <img
                    src="${e.target.result}"
                    alt="Vista previa">

                <button
                    type="button"
                    onclick="removePreviewImage(this)">

                    ✕

                </button>

            `;


            preview.appendChild(wrapper);

        };


        reader.readAsDataURL(file);
    });
}


function removePreviewImage(button) {

    const wrapper =
        button.parentElement;

    if (wrapper) {
        wrapper.remove();
    }
}


/* =========================================================
   PUBLICAR PRODUCTO
========================================================= */

async function publishProduct(event) {

    event.preventDefault();


    const user = getCurrentUser();

    if (!user) {
        showToast("Debes iniciar sesión.");
        return;
    }


    const name =
        document.getElementById("productName").value.trim();

    const category =
        document.getElementById("productCategory").value;

    const price =
        document.getElementById("productPrice").value;

    const location =
        document.getElementById("productLocation").value.trim();

    const description =
        document.getElementById("productDescription").value.trim();

    const whatsapp =
        document.getElementById("productWhatsapp").value.trim();


    const images =
        Array.from(
            document.querySelectorAll(
                "#imagePreview img"
            )
        ).map(img => img.src);


    const products = getProducts();


    if (editingProductId) {

        const index =
            products.findIndex(
                product =>
                    product.id === editingProductId
            );


        if (index === -1) {
            showToast("No se encontró la publicación.");
            return;
        }


        products[index] = {
            ...products[index],
            name,
            category,
            price: Number(price),
            location,
            description,
            whatsapp,
            images:
                images.length
                    ? images
                    : products[index].images || [],
            updatedAt: new Date().toISOString()
        };


        saveProducts(products);

        showToast("Publicación actualizada.");

    } else {

        const product = {

            id: generateId("product"),

            userId: user.id,

            sellerName: user.name,

            name,

            category,

            price: Number(price),

            location,

            description,

            whatsapp,

            images,

            likedBy: [],

            dislikedBy: [],

            views: 0,

            createdAt: new Date().toISOString(),

            status: "approved"

        };


        products.unshift(product);

        saveProducts(products);

        showToast("Publicación creada correctamente.");
    }


    editingProductId = null;

    resetPublishForm();

    renderProducts();

    openMyPublications();
}


/* =========================================================
   EDITAR PUBLICACIÓN
========================================================= */

function editProduct(productId) {

    const user = getCurrentUser();

    if (!user) return;


    const products = getProducts();

    const product =
        products.find(
            item =>
                item.id === productId
        );


    if (!product) return;


    if (product.userId !== user.id) {

        showToast(
            "Solo puedes editar tus propias publicaciones."
        );

        return;
    }


    editingProductId = productId;


    document.getElementById("productName").value =
        product.name || "";

    document.getElementById("productCategory").value =
        product.category || "";

    document.getElementById("productPrice").value =
        product.price || "";

    document.getElementById("productLocation").value =
        product.location || "";

    document.getElementById("productDescription").value =
        product.description || "";

    document.getElementById("productWhatsapp").value =
        product.whatsapp || "";


    const preview =
        document.getElementById("imagePreview");


    if (preview) {

        preview.innerHTML = "";


        (product.images || []).forEach(image => {

            preview.insertAdjacentHTML(
                "beforeend",
                `
                    <div class="preview-image-wrapper">

                        <img
                            src="${image}"
                            alt="Imagen">

                        <button
                            type="button"
                            onclick="removePreviewImage(this)">

                            ✕

                        </button>

                    </div>
                `
            );

        });
    }


    showPage("publishPage");
}


/* =========================================================
   ELIMINAR PUBLICACIÓN DEL USUARIO
========================================================= */

function deleteProduct(productId) {

    const user = getCurrentUser();

    if (!user) return;


    const products = getProducts();

    const product =
        products.find(
            item =>
                item.id === productId
        );


    if (!product) return;


    if (product.userId !== user.id) {

        showToast(
            "No puedes eliminar esta publicación."
        );

        return;
    }


    openConfirmModal(
        "Eliminar publicación",
        "¿Seguro que quieres eliminar esta publicación? Esta acción no se puede deshacer.",
        () => {

            const updatedProducts =
                getProducts().filter(
                    item =>
                        item.id !== productId
                );


            saveProducts(updatedProducts);

            showToast(
                "La publicación fue eliminada por completo."
            );


            currentProductId = null;

            renderProducts();

            openMyPublications();

        }
    );
}


/* =========================================================
   MIS PUBLICACIONES
========================================================= */

function renderMyPublications() {

    const user = getCurrentUser();

    const container =
        document.getElementById(
            "myPublicationsList"
        );

    const empty =
        document.getElementById(
            "emptyMyPublications"
        );


    if (!container || !user) return;


    const products =
        getProducts().filter(
            product =>
                product.userId === user.id
        );


    container.innerHTML = "";


    products.forEach(product => {

        const image =
            product.images &&
            product.images.length
                ? product.images[0]
                : "";


        container.insertAdjacentHTML(
            "beforeend",
            `
                <div class="my-publication-card">

                    <div class="my-publication-image">

                        ${
                            image
                            ? `
                                <img
                                    src="${image}"
                                    alt="${escapeHTML(product.name)}">
                            `
                            : `
                                <span>📦</span>
                            `
                        }

                    </div>


                    <div class="my-publication-info">

                        <h3>
                            ${escapeHTML(product.name)}
                        </h3>

                        <strong>
                            RD$ ${formatPrice(product.price)}
                        </strong>

                        <small>
                            ${escapeHTML(product.category || "")}
                        </small>

                    </div>


                    <div class="my-publication-actions">

                        <button
                            onclick="editProduct('${product.id}')">

                            ✏️ Editar

                        </button>


                        <button
                            class="danger-btn"
                            onclick="deleteProduct('${product.id}')">

                            🗑️ Eliminar

                        </button>

                    </div>

                </div>
            `
        );

    });


    if (empty) {

        empty.classList.toggle(
            "hidden",
            products.length > 0
        );

    }
}


/* =========================================================
   RESET FORMULARIO
========================================================= */

function resetPublishForm() {

    const form =
        document.getElementById("publishForm");

    if (form) {
        form.reset();
    }


    const preview =
        document.getElementById("imagePreview");

    if (preview) {
        preview.innerHTML = "";
    }


    const camera =
        document.getElementById("cameraInput");

    const gallery =
        document.getElementById("galleryInput");


    if (camera) camera.value = "";

    if (gallery) gallery.value = "";
}


/* =========================================================
   VISOR DE IMÁGENES A PANTALLA COMPLETA
========================================================= */

function openImageViewer(index = 0) {

    if (!currentProductImages.length) return;

    currentImageIndex = index;

    renderImageViewer();

    const viewer =
        document.getElementById("imageViewer");

    if (viewer) {
        viewer.classList.remove("hidden");
    }
}


function renderImageViewer() {

    const image =
        document.getElementById(
            "fullScreenImage"
        );

    const counter =
        document.getElementById(
            "imageViewerCounter"
        );


    if (!image) return;


    image.src =
        currentProductImages[currentImageIndex];


    if (counter) {

        counter.textContent =
            `${currentImageIndex + 1} / ${currentProductImages.length}`;

    }
}


function closeImageViewer() {

    const viewer =
        document.getElementById("imageViewer");

    if (viewer) {
        viewer.classList.add("hidden");
    }
}


function previousImage() {

    if (!currentProductImages.length) return;


    currentImageIndex--;

    if (currentImageIndex < 0) {
        currentImageIndex =
            currentProductImages.length - 1;
    }


    renderImageViewer();
}


function nextImage() {

    if (!currentProductImages.length) return;


    currentImageIndex++;

    if (
        currentImageIndex >=
        currentProductImages.length
    ) {
        currentImageIndex = 0;
    }


    renderImageViewer();
}


/* =========================================================
   CHAT
========================================================= */

function getChats() {
    return getStorage(STORAGE_KEYS.chats, []);
}

function saveChats(chats) {
    setStorage(STORAGE_KEYS.chats, chats);
}


function startChatFromProduct(productId) {

    const user = getCurrentUser();

    if (!user) {

        showToast(
            "Inicia sesión para usar el chat."
        );

        openLogin();

        return;
    }


    const product =
        getProducts().find(
            item =>
                item.id === productId
        );


    if (!product) return;


    if (product.userId === user.id) {

        showToast(
            "No puedes iniciar un chat contigo mismo."
        );

        return;
    }


    const chats = getChats();


    let chat =
        chats.find(item =>
            item.productId === productId &&
            (
                item.buyerId === user.id ||
                item.sellerId === user.id
            )
        );


    if (!chat) {

        chat = {

            id: generateId("chat"),

            productId: product.id,

            productName: product.name,

            buyerId: user.id,

            buyerName: user.name,

            sellerId: product.userId,

            sellerName: product.sellerName,

            messages: [],

            createdAt: new Date().toISOString()

        };


        chats.unshift(chat);

        saveChats(chats);
    }


    openChat(chat.id);
}


function openChat(chatId) {

    const chat =
        getChats().find(
            item =>
                item.id === chatId
        );


    if (!chat) return;


    currentChatId = chatId;


    const user =
        getCurrentUser();


    const otherName =
        chat.buyerId === user.id
            ? chat.sellerName
            : chat.buyerName;


    document.getElementById(
        "chatUserName"
    ).textContent = otherName || "Usuario";


    document.getElementById(
        "chatProductName"
    ).textContent =
        chat.productName || "Producto";


    renderMessages(chat);

    showPage("chatPage");
}


function renderMessages(chat) {

    const container =
        document.getElementById(
            "messagesContainer"
        );


    if (!container) return;


    const user =
        getCurrentUser();


    container.innerHTML = "";


    chat.messages.forEach(message => {

        const mine =
            message.senderId === user.id;


        container.insertAdjacentHTML(
            "beforeend",
            `
                <div
                    class="message ${mine ? "mine" : "received"}">

                    <div class="message-bubble">

                        ${escapeHTML(message.text)}

                    </div>

                    <small>
                        ${formatDate(message.createdAt)}
                    </small>

                </div>
            `
        );

    });


    container.scrollTop =
        container.scrollHeight;
}


function sendMessage(event) {

    event.preventDefault();


    const user =
        getCurrentUser();


    if (!user || !currentChatId) return;


    const input =
        document.getElementById(
            "chatMessageInput"
        );


    const text =
        input.value.trim();


    if (!text) return;


    const chats =
        getChats();


    const chat =
        chats.find(
            item =>
                item.id === currentChatId
        );


    if (!chat) return;


    chat.messages =
        chat.messages || [];


    chat.messages.push({

        id: generateId("msg"),

        senderId: user.id,

        senderName: user.name,

        text,

        createdAt: new Date().toISOString()

    });


    chat.lastMessage = text;

    chat.lastMessageAt =
        new Date().toISOString();


    saveChats(chats);


    input.value = "";


    renderMessages(chat);
}


function renderChatList() {

    const user =
        getCurrentUser();


    const container =
        document.getElementById(
            "chatList"
        );


    const empty =
        document.getElementById(
            "emptyChats"
        );


    if (!container || !user) return;


    const chats =
        getChats().filter(
            chat =>
                chat.buyerId === user.id ||
                chat.sellerId === user.id
        );


    container.innerHTML = "";


    chats.forEach(chat => {

        const otherName =
            chat.buyerId === user.id
                ? chat.sellerName
                : chat.buyerName;


        container.insertAdjacentHTML(
            "beforeend",
            `
                <button
                    class="chat-list-item"
                    onclick="openChat('${chat.id}')">

                    <div class="chat-list-avatar">
                        💬
                    </div>

                    <div class="chat-list-info">

                        <strong>
                            ${escapeHTML(otherName || "Usuario")}
                        </strong>

                        <small>
                            ${escapeHTML(
                                chat.lastMessage ||
                                "Nueva conversación"
                            )}
                        </small>

                    </div>

                    <span>›</span>

                </button>
            `
        );

    });


    if (empty) {

        empty.classList.toggle(
            "hidden",
            chats.length > 0
        );

    }
}


/* =========================================================
   REGISTRO
========================================================= */

function registerUser(event) {

    event.preventDefault();


    const name =
        document.getElementById(
            "registerName"
        ).value.trim();


    const cedula =
        document.getElementById(
            "registerCedula"
        ).value.trim();


    const phone =
        document.getElementById(
            "registerPhone"
        ).value.trim();


    const password =
        document.getElementById(
            "registerPassword"
        ).value;


    const confirmPassword =
        document.getElementById(
            "registerPasswordConfirm"
        ).value;


    if (password !== confirmPassword) {

        showToast(
            "Las contraseñas no coinciden."
        );

        return;
    }


    const users =
        getStorage(STORAGE_KEYS.users, []);


    if (
        users.some(
            user =>
                user.phone === phone
        )
    ) {

        showToast(
            "Ese número ya está registrado."
        );

        return;
    }


    const user = {

        id: generateId("user"),

        name,

        cedula,

        phone,

        password,

        createdAt:
            new Date().toISOString()

    };


    users.push(user);

    setStorage(
        STORAGE_KEYS.users,
        users
    );


    saveCurrentUser(user);


    showToast(
        "Cuenta creada correctamente."
    );


    openProfile();
}


/* =========================================================
   LOGIN
========================================================= */

function login(event) {

    event.preventDefault();


    const phone =
        document.getElementById(
            "loginPhone"
        ).value.trim();


    const password =
        document.getElementById(
            "loginPassword"
        ).value;


    const users =
        getStorage(STORAGE_KEYS.users, []);


    const user =
        users.find(
            item =>
                item.phone === phone &&
                item.password === password
        );


    if (!user) {

        showToast(
            "Teléfono o contraseña incorrectos."
        );

        return;
    }


    saveCurrentUser(user);


    showToast(
        `Bienvenido/a, ${user.name}.`
    );


    openProfile();
}


/* =========================================================
   RECUPERAR CONTRASEÑA
========================================================= */

function recoverPassword(event) {

    event.preventDefault();


    const phone =
        document.getElementById(
            "recoveryPhone"
        ).value.trim();


    const users =
        getStorage(STORAGE_KEYS.users, []);


    const user =
        users.find(
            item =>
                item.phone === phone
        );


    if (!user) {

        showToast(
            "No encontramos una cuenta con ese teléfono."
        );

        return;
    }


    showToast(
        "La recuperación está preparada para conectarse a un sistema real de recuperación."
    );
}


/* =========================================================
   PERFIL
========================================================= */

function renderProfile() {

    const user =
        getCurrentUser();


    if (!user) return;


    const name =
        document.getElementById(
            "profileName"
        );


    const phone =
        document.getElementById(
            "profilePhone"
        );


    if (name) {
        name.textContent =
            user.name || "Usuario";
    }


    if (phone) {
        phone.textContent =
            user.phone || "";
    }


    const avatar =
        document.getElementById(
            "profileAvatar"
        );


    if (avatar) {

        if (user.photo) {

            avatar.innerHTML =
                `<img src="${user.photo}" alt="Perfil">`;

        } else {

            avatar.textContent = "👤";

        }
    }
}


function openEditProfile() {

    const user =
        getCurrentUser();


    if (!user) return;


    document.getElementById(
        "editName"
    ).value =
        user.name || "";


    document.getElementById(
        "editPhone"
    ).value =
        user.phone || "";


    showPage("editProfilePage");
}


function saveProfile(event) {

    event.preventDefault();


    const user =
        getCurrentUser();


    if (!user) return;


    const name =
        document.getElementById(
            "editName"
        ).value.trim();


    const phone =
        document.getElementById(
            "editPhone"
        ).value.trim();


    const users =
        getStorage(STORAGE_KEYS.users, []);


    const index =
        users.findIndex(
            item =>
                item.id === user.id
        );


    if (index === -1) return;


    users[index].name = name;

    users[index].phone = phone;


    setStorage(
        STORAGE_KEYS.users,
        users
    );


    saveCurrentUser(users[index]);


    showToast(
        "Perfil actualizado."
    );


    openProfile();
}


/* =========================================================
   FOTO DE PERFIL
========================================================= */

function openProfileImageOptions() {

    openModal(`
        <div class="profile-photo-options">

            <h3>Cambiar foto de perfil</h3>

            <button
                class="primary-btn"
                onclick="closeModal(); document.getElementById('profileCameraInput').click();">

                📷 Tomar foto

            </button>

            <button
                class="secondary-btn"
                onclick="closeModal(); document.getElementById('profileGalleryInput').click();">

                🖼️ Elegir de galería

            </button>

        </div>
    `);
}


function handleProfileImage(event) {

    const file =
        event.target.files &&
        event.target.files[0];


    if (!file) return;


    const reader =
        new FileReader();


    reader.onload =
        function(e) {

            const user =
                getCurrentUser();


            if (!user) return;


            const users =
                getStorage(
                    STORAGE_KEYS.users,
                    []
                );


            const index =
                users.findIndex(
                    item =>
                        item.id === user.id
                );


            if (index === -1) return;


            users[index].photo =
                e.target.result;


            setStorage(
                STORAGE_KEYS.users,
                users
            );


            saveCurrentUser(
                users[index]
            );


            renderProfile();

            showToast(
                "Foto de perfil actualizada."
            );

        };


    reader.readAsDataURL(file);
}


/* =========================================================
   ADMINISTRADOR
========================================================= */

function openAdminLogin() {

    showPage("adminLoginPage");
}


function adminLogin(event) {

    event.preventDefault();


    const username =
        document.getElementById(
            "adminUsername"
        ).value.trim();


    const password =
        document.getElementById(
            "adminPassword"
        ).value;


    if (
        username ===
        ADMIN_CREDENTIALS.username &&
        password ===
        ADMIN_CREDENTIALS.password
    ) {

        sessionStorage.setItem(
            "mf_admin_logged",
            "true"
        );


        showToast(
            "Acceso de administrador correcto."
        );


        openAdminPanel();

    } else {

        showToast(
            "Usuario o contraseña incorrectos."
        );

    }
}


function isAdminLogged() {

    return (
        sessionStorage.getItem(
            "mf_admin_logged"
        ) === "true"
    );
}


function openAdminPanel() {

    if (!isAdminLogged()) {

        openAdminLogin();

        return;
    }


    renderAdminPanel();

    showPage("adminPanelPage");
}


function adminLogout() {

    sessionStorage.removeItem(
        "mf_admin_logged"
    );


    showToast(
        "Sesión de administrador cerrada."
    );


    openProfile();
}


/* =========================================================
   PANEL ADMIN
========================================================= */

function renderAdminPanel() {

    if (!isAdminLogged()) return;


    const users =
        getStorage(
            STORAGE_KEYS.users,
            []
        );


    const products =
        getProducts();


    const chats =
        getChats();


    const advertising =
        getStorage(
            STORAGE_KEYS.advertising,
            {}
        );


    document.getElementById(
        "adminUsersCount"
    ).textContent =
        users.length;


    document.getElementById(
        "adminProductsCount"
    ).textContent =
        products.length;


    document.getElementById(
        "adminAdsCount"
    ).textContent =
        (advertising.requests || []).length;


    document.getElementById(
        "adminChatsCount"
    ).textContent =
        chats.length;


    const toggle =
        document.getElementById(
            "advertisingToggle"
        );


    if (toggle) {
        toggle.checked =
            advertising.enabled !== false;
    }


    const price =
        document.getElementById(
            "advertisingPrice"
        );


    if (price) {
        price.value =
            advertising.price || 0;
    }


    renderAdminPublications();

    renderPaymentMethods();

    renderAdminAdvertisingRequests();
}


/* =========================================================
   PUBLICACIONES DEL PANEL ADMIN
========================================================= */

function renderAdminPublications() {

    const container =
        document.getElementById(
            "adminPublicationsList"
        );


    if (!container) return;


    const products =
        getProducts();


    container.innerHTML = "";


    if (!products.length) {

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📦</div>
                <h3>No hay publicaciones</h3>
                <p>No hay publicaciones registradas.</p>
            </div>
        `;

        return;
    }


    products.forEach(product => {

        const status =
            product.status || "approved";


        container.insertAdjacentHTML(
            "beforeend",
            `
                <div class="admin-publication-card">

                    <div class="admin-publication-main">

                        <div class="admin-publication-image">

                            ${
                                product.images &&
                                product.images.length
                                ? `
                                    <img
                                        src="${product.images[0]}"
                                        alt="${escapeHTML(product.name)}">
                                `
                                : `
                                    <span>📦</span>
                                `
                            }

                        </div>


                        <div class="admin-publication-info">

                            <h3>
                                ${escapeHTML(product.name)}
                            </h3>

                            <strong>
                                RD$ ${formatPrice(product.price)}
                            </strong>

                            <small>
                                Vendedor:
                                ${escapeHTML(
                                    product.sellerName ||
                                    "Usuario"
                                )}
                            </small>

                            <span
                                class="status-badge status-${status}">
                                ${getStatusText(status)}
                            </span>

                        </div>

                    </div>


                    <!-- CUATRO BOTONES -->

                    <div class="admin-publication-actions">

                        <button
                            class="admin-action receipt-action"
                            onclick="viewProductReceipt('${product.id}')">

                            🧾
                            <span>Ver comprobante</span>

                        </button>


                        <button
                            class="admin-action approve-action"
                            onclick="approveProduct('${product.id}')">

                            ✓
                            <span>Aprobar</span>

                        </button>


                        <button
                            class="admin-action reject-action"
                            onclick="rejectProduct('${product.id}')">

                            ✕
                            <span>Rechazar</span>

                        </button>


                        <button
                            class="admin-action delete-action"
                            onclick="adminDeleteProduct('${product.id}')">

                            🗑️
                            <span>Eliminar</span>

                        </button>

                    </div>

                </div>
            `
        );

    });
}


function getStatusText(status) {

    const statuses = {

        approved: "Aprobada",

        pending: "Pendiente",

        rejected: "Rechazada"

    };


    return (
        statuses[status] ||
        "Sin estado"
    );
}


/* =========================================================
   APROBAR
========================================================= */

function approveProduct(productId) {

    const products =
        getProducts();


    const product =
        products.find(
            item =>
                item.id === productId
        );


    if (!product) return;


    product.status =
        "approved";


    saveProducts(products);


    addNotification(
        product.userId,
        "Tu publicación fue aprobada."
    );


    showToast(
        "Publicación aprobada."
    );


    renderAdminPanel();

    renderProducts();
}


/* =========================================================
   RECHAZAR
========================================================= */

function rejectProduct(productId) {

    openConfirmModal(
        "Rechazar publicación",
        "¿Quieres rechazar esta publicación?",
        () => {

            const products =
                getProducts();


            const product =
                products.find(
                    item =>
                        item.id === productId
                );


            if (!product) return;


            product.status =
                "rejected";


            saveProducts(products);


            addNotification(
                product.userId,
                "Tu publicación fue rechazada."
            );


            showToast(
                "Publicación rechazada."
            );


            renderAdminPanel();

            renderProducts();

        }
    );
}


/* =========================================================
   ELIMINAR DESDE ADMIN
========================================================= */

function adminDeleteProduct(productId) {

    openConfirmModal(
        "Eliminar publicación",
        "Esta publicación será eliminada completamente. ¿Deseas continuar?",
        () => {

            const products =
                getProducts();


            const exists =
                products.some(
                    item =>
                        item.id === productId
                );


            if (!exists) return;


            const updated =
                products.filter(
                    item =>
                        item.id !== productId
                );


            saveProducts(updated);


            showToast(
                "Publicación eliminada completamente."
            );


            renderAdminPanel();

            renderProducts();

        }
    );
}


/* =========================================================
   COMPROBANTE
========================================================= */

function viewProductReceipt(productId) {

    const product =
        getProducts().find(
            item =>
                item.id === productId
        );


    if (!product) return;


    const receipt =
        document.getElementById(
            "receiptContent"
        );


    receipt.innerHTML = `

        <div class="receipt">

            <div class="receipt-header">

                <strong>
                    MARKET FLASH
                </strong>

                <small>
                    Comprobante de publicación
                </small>

            </div>


            <div class="receipt-row">

                <span>Producto</span>

                <strong>
                    ${escapeHTML(product.name)}
                </strong>

            </div>


            <div class="receipt-row">

                <span>Precio</span>

                <strong>
                    RD$ ${formatPrice(product.price)}
                </strong>

            </div>


            <div class="receipt-row">

                <span>Categoría</span>

                <strong>
                    ${escapeHTML(product.category || "")}
                </strong>

            </div>


            <div class="receipt-row">

                <span>Vendedor</span>

                <strong>
                    ${escapeHTML(
                        product.sellerName || ""
                    )}
                </strong>

            </div>


            <div class="receipt-row">

                <span>Fecha</span>

                <strong>
                    ${formatDate(product.createdAt)}
                </strong>

            </div>

        </div>
    `;


    document
        .getElementById("receiptModal")
        .classList.remove("hidden");
}


function closeReceiptModal() {

    document
        .getElementById("receiptModal")
        .classList.add("hidden");
}


/* =========================================================
   MÉTODOS DE PAGO
========================================================= */

function getPaymentMethods() {

    return getStorage(
        STORAGE_KEYS.paymentMethods,
        []
    );
}


function savePaymentMethods(methods) {

    setStorage(
        STORAGE_KEYS.paymentMethods,
        methods
    );
}


function openAddPaymentMethod() {

    editingPaymentMethodId = null;


    document.getElementById(
        "paymentModalTitle"
    ).textContent =
        "Agregar método de pago";


    document.getElementById(
        "paymentMethodName"
    ).value = "";


    document.getElementById(
        "paymentMethodPrice"
    ).value = "";


    document
        .getElementById(
            "paymentMethodModal"
        )
        .classList.remove("hidden");
}


function editPaymentMethod(id) {

    const method =
        getPaymentMethods().find(
            item =>
                item.id === id
        );


    if (!method) return;


    editingPaymentMethodId = id;


    document.getElementById(
        "paymentModalTitle"
    ).textContent =
        "Editar método de pago";


    document.getElementById(
        "paymentMethodName"
    ).value =
        method.name || "";


    document.getElementById(
        "paymentMethodPrice"
    ).value =
        method.price || "";


    document
        .getElementById(
            "paymentMethodModal"
        )
        .classList.remove("hidden");
}


function closePaymentMethodModal() {

    document
        .getElementById(
            "paymentMethodModal"
        )
        .classList.add("hidden");
}


function savePaymentMethod() {

    const name =
        document.getElementById(
            "paymentMethodName"
        ).value.trim();


    const price =
        Number(
            document.getElementById(
                "paymentMethodPrice"
            ).value || 0
        );


    if (!name) {

        showToast(
            "Escribe el nombre del método de pago."
        );

        return;
    }


    const methods =
        getPaymentMethods();


    if (editingPaymentMethodId) {

        const method =
            methods.find(
                item =>
                    item.id ===
                    editingPaymentMethodId
            );


        if (method) {

            method.name = name;

            method.price = price;

        }

    } else {

        methods.push({

            id: generateId("pay"),

            name,

            price

        });

    }


    savePaymentMethods(methods);


    closePaymentMethodModal();


    showToast(
        "Método de pago guardado."
    );


    renderPaymentMethods();
}


function deletePaymentMethod(id) {

    openConfirmModal(
        "Eliminar método",
        "¿Quieres eliminar este método de pago?",
        () => {

            const methods =
                getPaymentMethods()
                    .filter(
                        item =>
                            item.id !== id
                    );


            savePaymentMethods(methods);

            renderPaymentMethods();

            showToast(
                "Método de pago eliminado."
            );

        }
    );
}


function renderPaymentMethods() {

    const container =
        document.getElementById(
            "paymentMethodsList"
        );


    if (!container) return;


    const methods =
        getPaymentMethods();


    container.innerHTML = "";


    methods.forEach(method => {

        container.insertAdjacentHTML(
            "beforeend",
            `
                <div class="payment-method-card">

                    <div class="payment-method-info">

                        <div class="payment-method-icon">
                            💳
                        </div>

                        <div>

                            <strong>
                                ${escapeHTML(method.name)}
                            </strong>

                            <small>
                                Precio:
                                RD$ ${formatPrice(method.price)}
                            </small>

                        </div>

                    </div>


                    <div class="payment-method-actions">

                        <button
                            onclick="editPaymentMethod('${method.id}')">

                            ✏️

                        </button>


                        <button
                            class="danger-icon-btn"
                            onclick="deletePaymentMethod('${method.id}')">

                            🗑️

                        </button>

                    </div>

                </div>
            `
        );

    });
}


/* =========================================================
   PUBLICIDAD ADMIN
========================================================= */

function toggleAdvertising() {

    const toggle =
        document.getElementById(
            "advertisingToggle"
        );


    const advertising =
        getStorage(
            STORAGE_KEYS.advertising,
            {}
        );


    advertising.enabled =
        toggle.checked;


    setStorage(
        STORAGE_KEYS.advertising,
        advertising
    );


    showToast(
        advertising.enabled
            ? "Publicidad activada."
            : "Publicidad desactivada."
    );
}


function saveAdvertisingSettings() {

    const price =
        Number(
            document.getElementById(
                "advertisingPrice"
            ).value || 0
        );


    const advertising =
        getStorage(
            STORAGE_KEYS.advertising,
            {}
        );


    advertising.price =
        price;


    setStorage(
        STORAGE_KEYS.advertising,
        advertising
    );


    showToast(
        "Precio de publicidad guardado."
    );
}


/* =========================================================
   SOLICITUDES DE PUBLICIDAD
========================================================= */

function createAdvertising(event) {

    event.preventDefault();


    const user =
        getCurrentUser();


    if (!user) {

        showToast(
            "Debes iniciar sesión."
        );

        return;
    }


    const title =
        document.getElementById(
            "adTitle"
        ).value.trim();


    const description =
        document.getElementById(
            "adDescription"
        ).value.trim();


    const whatsapp =
        document.getElementById(
            "adWhatsapp"
        ).value.trim();


    const advertising =
        getStorage(
            STORAGE_KEYS.advertising,
            {}
        );


    advertising.requests =
        advertising.requests || [];


    advertising.requests.unshift({

        id: generateId("ad"),

        userId: user.id,

        userName: user.name,

        title,

        description,

        whatsapp,

        status: "pending",

        createdAt:
            new Date().toISOString()

    });


    setStorage(
        STORAGE_KEYS.advertising,
        advertising
    );


    showToast(
        "Solicitud de publicidad enviada."
    );


    openAdvertisingStatus();
}


function renderAdminAdvertisingRequests() {

    const container =
        document.getElementById(
            "adminAdvertisingRequests"
        );


    if (!container) return;


    const advertising =
        getStorage(
            STORAGE_KEYS.advertising,
            {}
        );


    const requests =
        advertising.requests || [];


    container.innerHTML = "";


    requests.forEach(request => {

        container.insertAdjacentHTML(
            "beforeend",
            `
                <div class="admin-request-card">

                    <div>

                        <strong>
                            ${escapeHTML(request.title)}
                        </strong>

                        <p>
                            ${escapeHTML(request.description)}
                        </p>

                        <small>
                            ${escapeHTML(
                                request.userName
                            )}
                        </small>

                    </div>


                    <div class="request-actions">

                        <button
                            onclick="approveAdvertising('${request.id}')">

                            ✓ Aprobar

                        </button>


                        <button
                            onclick="rejectAdvertising('${request.id}')">

                            ✕ Rechazar

                        </button>

                    </div>

                </div>
            `
        );

    });
}


function approveAdvertising(id) {

    const advertising =
        getStorage(
            STORAGE_KEYS.advertising,
            {}
        );


    const request =
        (advertising.requests || [])
            .find(
                item =>
                    item.id === id
            );


    if (!request) return;


    request.status =
        "approved";


    setStorage(
        STORAGE_KEYS.advertising,
        advertising
    );


    addNotification(
        request.userId,
        "Tu publicidad fue aprobada."
    );


    renderAdminPanel();


    showToast(
        "Publicidad aprobada."
    );
}


function rejectAdvertising(id) {

    const advertising =
        getStorage(
            STORAGE_KEYS.advertising,
            {}
        );


    const request =
        (advertising.requests || [])
            .find(
                item =>
                    item.id === id
            );


    if (!request) return;


    request.status =
        "rejected";


    setStorage(
        STORAGE_KEYS.advertising,
        advertising
    );


    addNotification(
        request.userId,
        "Tu publicidad fue rechazada."
    );


    renderAdminPanel();


    showToast(
        "Publicidad rechazada."
    );
}


/* =========================================================
   PUBLICIDAD DEL USUARIO
========================================================= */

function openAdvertisingIntro() {

    const advertising =
        getStorage(
            STORAGE_KEYS.advertising,
            {}
        );


    if (advertising.enabled === false) {

        showToast(
            "La publicidad está temporalmente desactivada."
        );

        return;
    }


    showPage(
        "advertisingIntroPage"
    );
}


function openAdvertisingCreate() {

    showPage(
        "advertisingCreatePage"
    );
}


function openAdvertisingInfo() {

    showPage(
        "advertisingInfoPage"
    );
}


function openAdvertisingStatus() {

    renderAdvertisingStatus();

    showPage(
        "advertisingStatusPage"
    );
}


function renderAdvertisingStatus() {

    const container =
        document.getElementById(
            "advertisingStatus"
        );


    const user =
        getCurrentUser();


    if (!container || !user) return;


    const advertising =
        getStorage(
            STORAGE_KEYS.advertising,
            {}
        );


    const requests =
        (advertising.requests || [])
            .filter(
                item =>
                    item.userId === user.id
            );


    container.innerHTML = "";


    requests.forEach(request => {

        container.insertAdjacentHTML(
            "beforeend",
            `
                <div class="advertising-status-card">

                    <h3>
                        ${escapeHTML(request.title)}
                    </h3>

                    <p>
                        ${escapeHTML(request.description)}
                    </p>

                    <strong>
                        Estado:
                        ${getStatusText(request.status)}
                    </strong>

                </div>
            `
        );

    });


    if (!requests.length) {

        container.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    📢
                </div>

                <h3>
                    No tienes solicitudes
                </h3>

                <p>
                    Aquí aparecerán tus solicitudes de publicidad.
                </p>

            </div>
        `;

    }
}


/* =========================================================
   NOTIFICACIONES
========================================================= */

function addNotification(userId, message) {

    const notifications =
        getStorage(
            STORAGE_KEYS.notifications,
            []
        );


    notifications.unshift({

        id: generateId("notification"),

        userId,

        message,

        read: false,

        createdAt:
            new Date().toISOString()

    });


    setStorage(
        STORAGE_KEYS.notifications,
        notifications
    );


    updateNotificationBadge();
}


function openNotifications() {

    renderNotifications();


    const panel =
        document.getElementById(
            "notificationsPanel"
        );


    if (panel) {
        panel.classList.remove("hidden");
    }
}


function closeNotifications() {

    const panel =
        document.getElementById(
            "notificationsPanel"
        );


    if (panel) {
        panel.classList.add("hidden");
    }
}


function renderNotifications() {

    const container =
        document.getElementById(
            "notificationsList"
        );


    const user =
        getCurrentUser();


    if (!container || !user) return;


    const notifications =
        getStorage(
            STORAGE_KEYS.notifications,
            []
        ).filter(
            item =>
                item.userId === user.id
        );


    container.innerHTML = "";


    notifications.forEach(notification => {

        container.insertAdjacentHTML(
            "beforeend",
            `
                <div class="notification-item">

                    <span>🔔</span>

                    <div>

                        <p>
                            ${escapeHTML(
                                notification.message
                            )}
                        </p>

                        <small>
                            ${formatDate(
                                notification.createdAt
                            )}
                        </small>

                    </div>

                </div>
            `
        );

    });


    if (!notifications.length) {

        container.innerHTML = `
            <div class="empty-notifications">
                No tienes notificaciones.
            </div>
        `;

    }


    notifications.forEach(item => {
        item.read = true;
    });


    const all =
        getStorage(
            STORAGE_KEYS.notifications,
            []
        );


    notifications.forEach(item => {

        const original =
            all.find(
                notification =>
                    notification.id === item.id
            );


        if (original) {
            original.read = true;
        }

    });


    setStorage(
        STORAGE_KEYS.notifications,
        all
    );


    updateNotificationBadge();
}


function updateNotificationBadge() {

    const user =
        getCurrentUser();


    const badge =
        document.getElementById(
            "notificationBadge"
        );


    if (!badge || !user) return;


    const notifications =
        getStorage(
            STORAGE_KEYS.notifications,
            []
        );


    const unread =
        notifications.filter(
            item =>
                item.userId === user.id &&
                !item.read
        ).length;


    badge.textContent =
        unread;


    badge.classList.toggle(
        "hidden",
        unread === 0
    );
}


/* =========================================================
   MODALES
========================================================= */

function openModal(content) {

    const overlay =
        document.getElementById(
            "modalOverlay"
        );


    const modalContent =
        document.getElementById(
            "modalContent"
        );


    if (!overlay || !modalContent) return;


    modalContent.innerHTML =
        content;


    overlay.classList.remove(
        "hidden"
    );
}


function closeModal(event) {

    if (
        event &&
        event.target !==
        document.getElementById(
            "modalOverlay"
        )
    ) {
        return;
    }


    document
        .getElementById(
            "modalOverlay"
        )
        .classList.add("hidden");
}


function openConfirmModal(
    title,
    message,
    callback
) {

    const modal =
        document.getElementById(
            "confirmModal"
        );


    document.getElementById(
        "confirmTitle"
    ).textContent =
        title;


    document.getElementById(
        "confirmMessage"
    ).textContent =
        message;


    const button =
        document.getElementById(
            "confirmActionBtn"
        );


    button.onclick = () => {

        closeConfirmModal();

        callback();

    };


    modal.classList.remove(
        "hidden"
    );
}


function closeConfirmModal() {

    document
        .getElementById(
            "confirmModal"
        )
        .classList.add("hidden");
}


/* =========================================================
   TOAST
========================================================= */

let toastTimeout;


function showToast(message) {

    const toast =
        document.getElementById(
            "toast"
        );


    if (!toast) return;


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimeout
    );


    toastTimeout =
        setTimeout(() => {

            toast.classList.remove(
                "show"
            );

        }, 3000);
}


/* =========================================================
   INFORMACIÓN
========================================================= */

function showPrivacyInfo() {

    openModal(`
        <div class="info-modal">

            <h2>
                Privacidad y seguridad
            </h2>

            <p>
                Market Flash protege los datos
                dentro de las funciones disponibles
                en esta versión.
            </p>

            <button
                class="primary-btn"
                onclick="closeModal()">

                Cerrar

            </button>

        </div>
    `);
}


function showAbout() {

    openModal(`
        <div class="info-modal">

            <div class="auth-logo-circle">
                ⚡
            </div>

            <h2>
                Market Flash
            </h2>

            <p>
                Plataforma para comprar,
                vender y conectar.
            </p>

            <button
                class="primary-btn"
                onclick="closeModal()">

                Cerrar

            </button>

        </div>
    `);
}


/* =========================================================
   LOGOUT
========================================================= */

function logout() {

    openConfirmModal(
        "Cerrar sesión",
        "¿Quieres cerrar tu sesión?",
        () => {

            localStorage.removeItem(
                STORAGE_KEYS.currentUser
            );


            showToast(
                "Sesión cerrada."
            );


            showPage(
                "homePage"
            );

        }
    );
}


/* =========================================================
   ACTUALIZAR INTERFAZ
========================================================= */

function updateInterface() {

    renderProducts();

    updateNotificationBadge();

    const user =
        getCurrentUser();


    if (user) {
        renderProfile();
    }

}


/* =========================================================
   ATAJOS DEL TECLADO PARA EL VISOR
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        const viewer =
            document.getElementById(
                "imageViewer"
            );


        if (
            viewer &&
            !viewer.classList.contains(
                "hidden"
            )
        ) {

            if (event.key === "Escape") {
                closeImageViewer();
            }

            if (event.key === "ArrowLeft") {
                previousImage();
            }

            if (event.key === "ArrowRight") {
                nextImage();
            }

        }

    }
);


/* =========================================================
   FIN DE SCRIPT.JS
========================================================= */
