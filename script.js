/* =========================================
   MARKET FLASH
   JavaScript principal
   ========================================= */


/* STORAGE */

const STORAGE_USER = "mf_user";
const STORAGE_PRODUCTS = "mf_products";
const STORAGE_CONFIG = "mf_config";


/* DATOS INICIALES */

const defaultProducts = [

    {
        id: 1,
        name: "iPhone 15 Pro",
        price: 65000,
        category: "Tecnología",
        description: "iPhone 15 Pro en excelente condición.",
        location: "Santo Domingo",
        image: "",
        whatsapp: true,
        views: 125,
        likes: 18,
        saved: 7,
        seller: "Julio"
    },

    {
        id: 2,
        name: "Samsung Galaxy S24",
        price: 48000,
        category: "Tecnología",
        description: "Samsung Galaxy S24 completamente funcional.",
        location: "Santo Domingo Este",
        image: "",
        whatsapp: true,
        views: 94,
        likes: 12,
        saved: 4,
        seller: "Market Seller"
    },

    {
        id: 3,
        name: "Laptop",
        price: 35000,
        category: "Tecnología",
        description: "Laptop para trabajo y estudio.",
        location: "Distrito Nacional",
        image: "",
        whatsapp: true,
        views: 77,
        likes: 9,
        saved: 3,
        seller: "Usuario MF"
    },

    {
        id: 4,
        name: "PlayStation 5",
        price: 42000,
        category: "Tecnología",
        description: "PS5 en buen estado.",
        location: "Santo Domingo",
        image: "",
        whatsapp: true,
        views: 210,
        likes: 30,
        saved: 15,
        seller: "Gaming RD"
    }

];


/* VARIABLES */

let products = [];
let selectedCategory = "Todos";
let selectedPlan = null;
let selectedPlanPrice = 0;


/* INICIALIZAR */

document.addEventListener("DOMContentLoaded", () => {

    loadProducts();

    renderProducts();

    loadUser();

});


/* PRODUCTOS */

function loadProducts() {

    const saved = localStorage.getItem(STORAGE_PRODUCTS);

    if (saved) {

        try {

            products = JSON.parse(saved);

        } catch (error) {

            products = [...defaultProducts];

        }

    } else {

        products = [...defaultProducts];

        saveProducts();

    }

}


function saveProducts() {

    localStorage.setItem(
        STORAGE_PRODUCTS,
        JSON.stringify(products)
    );

}


/* FORMATO DE DINERO */

function formatMoney(value) {

    return new Intl.NumberFormat(
        "es-DO",
        {
            style: "currency",
            currency: "DOP",
            maximumFractionDigits: 0
        }
    ).format(value);

}


/* MOSTRAR PRODUCTOS */

function renderProducts(list = products) {

    const grid =
        document.getElementById("productsGrid");

    if (!grid) return;

    if (list.length === 0) {

        grid.innerHTML = `
            <div style="
                grid-column:1/-1;
                text-align:center;
                padding:40px;
            ">
                <h3>No encontramos productos</h3>
                <p>Prueba otra búsqueda.</p>
            </div>
        `;

        return;
    }


    grid.innerHTML = list.map(product => {

        let imageHTML = "📦";

        if (product.image) {

            imageHTML = `
                <img
                    src="${product.image}"
                    alt="${escapeHTML(product.name)}"
                >
            `;

        }

        return `

            <article
                class="product-card"
                onclick="openProduct(${product.id})"
            >

                <div class="product-image">
                    ${imageHTML}
                </div>

                <div class="product-info">

                    <h3>
                        ${escapeHTML(product.name)}
                    </h3>

                    <div class="product-price">
                        ${formatMoney(product.price)}
                    </div>

                    <div class="product-location">
                        📍 ${escapeHTML(product.location)}
                    </div>

                    <div class="product-stats">
                        👁️ ${product.views}
                        ❤️ ${product.likes}
                        🔖 ${product.saved}
                    </div>

                </div>

            </article>

        `;

    }).join("");

}


/* ESCAPAR HTML */

function escapeHTML(value) {

    if (!value) return "";

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* BUSQUEDA */

function searchProducts() {

    const query =
        document
        .getElementById("searchInput")
        .value
        .toLowerCase()
        .trim();


    let filtered = products.filter(product => {

        const matchesText =
            product.name
                .toLowerCase()
                .includes(query)
            ||
            product.description
                .toLowerCase()
                .includes(query)
            ||
            product.category
                .toLowerCase()
                .includes(query);


        const matchesCategory =
            selectedCategory === "Todos"
            ||
            product.category === selectedCategory;


        return matchesText && matchesCategory;

    });


    renderProducts(filtered);

}


/* CATEGORIA */

function filterCategory(category) {

    selectedCategory = category;

    searchProducts();

}


function showAllProducts() {

    selectedCategory = "Todos";

    document.getElementById("searchInput").value = "";

    renderProducts(products);

}


/* MODAL */

function openModal(id) {

    document
        .getElementById(id)
        .classList.add("show");

}


function closeModal(id) {

    document
        .getElementById(id)
        .classList.remove("show");

}


/* PUBLICAR */

function openPublishModal() {

    openModal("publishModal");

}


function createProduct() {

    const name =
        document.getElementById("productName").value.trim();

    const price =
        Number(
            document.getElementById("productPrice").value
        );

    const category =
        document.getElementById("productCategory").value;

    const description =
        document.getElementById("productDescription").value.trim();

    const location =
        document.getElementById("productLocation").value.trim();

    const whatsapp =
        document.getElementById("whatsappEnabled").checked;

    const media =
        document.getElementById("productMedia").files;


    if (!name) {

        alert("Escribe el nombre del producto.");

        return;

    }


    if (!price || price <= 0) {

        alert("Escribe un precio válido.");

        return;

    }


    if (!description) {

        alert("Escribe una descripción.");

        return;

    }


    if (!location) {

        alert("Escribe la ubicación.");

        return;

    }


    const product = {

        id: Date.now(),

        name,

        price,

        category,

        description,

        location,

        image: "",

        whatsapp,

        views: 0,

        likes: 0,

        saved: 0,

        seller: "Usuario Market Flash",

        createdAt: new Date().toISOString()

    };


    /*
       Por ahora guardamos la publicación localmente.
       Más adelante conectaremos esta parte con
       Supabase Storage.
    */

    if (media.length > 0) {

        const file = media[0];

        if (file.type.startsWith("image/")) {

            const reader = new FileReader();

            reader.onload = function(event) {

                product.image =
                    event.target.result;

                products.unshift(product);

                saveProducts();

                renderProducts();

                closeModal("publishModal");

                clearPublishForm();

                alert("¡Producto publicado!");

            };

            reader.readAsDataURL(file);

            return;

        }

    }


    products.unshift(product);

    saveProducts();

    renderProducts();

    closeModal("publishModal");

    clearPublishForm();

    alert("¡Producto publicado!");

}


/* LIMPIAR FORMULARIO */

function clearPublishForm() {

    document.getElementById("productName").value = "";

    document.getElementById("productPrice").value = "";

    document.getElementById("productDescription").value = "";

    document.getElementById("productLocation").value = "";

    document.getElementById("productMedia").value = "";

}


/* DETALLE PRODUCTO */

function openProduct(id) {

    const product =
        products.find(item => item.id === id);

    if (!product) return;


    product.views++;

    saveProducts();


    const imageHTML = product.image

        ? `
            <img
                src="${product.image}"
                style="
                    width:100%;
                    max-height:350px;
                    object-fit:cover;
                    border-radius:15px;
                "
            >
        `

        : `
            <div style="
                height:250px;
                background:#eaf2ff;
                display:flex;
                align-items:center;
                justify-content:center;
                font-size:80px;
                border-radius:15px;
            ">
                📦
            </div>
        `;


    let whatsappButton = "";

    if (product.whatsapp) {

        whatsappButton = `

            <button
                class="primary-button"
                onclick="contactWhatsApp('${escapeHTML(product.name)}')"
            >
                📱 Contactar por WhatsApp
            </button>

        `;

    }


    document.getElementById("productDetails").innerHTML = `

        <div class="modal-header">

            <h2>
                ${escapeHTML(product.name)}
            </h2>

            <button onclick="closeModal('productModal')">
                ✕
            </button>

        </div>

        ${imageHTML}

        <h2 style="
            color:#0066ff;
            margin-top:15px;
        ">
            ${formatMoney(product.price)}
        </h2>

        <p style="margin-top:10px;">
            ${escapeHTML(product.description)}
        </p>

        <p style="
            margin-top:10px;
            color:#697386;
        ">
            📍 ${escapeHTML(product.location)}
        </p>

        <p style="
            margin-top:10px;
            color:#697386;
        ">
            👤 ${escapeHTML(product.seller)}
        </p>

        <div class="product-stats" style="
            margin-top:15px;
            font-size:13px;
        ">
            👁️ ${product.views}
            ❤️ ${product.likes}
            🔖 ${product.saved}
        </div>

        <button
            class="secondary-button"
            onclick="likeProduct(${product.id})"
        >
            ❤️ Me gusta
        </button>

        <button
            class="secondary-button"
            onclick="saveProduct(${product.id})"
        >
            🔖 Guardar
        </button>

        <button
            class="secondary-button"
            onclick="openMessages()"
        >
            💬 Escribir al vendedor
        </button>

        ${whatsappButton}

    `;


    renderProducts();

    openModal("productModal");

}


/* LIKE */

function likeProduct(id) {

    const product =
        products.find(item => item.id === id);

    if (!product) return;

    product.likes++;

    saveProducts();

    renderProducts();

    alert("❤️ Me gusta agregado.");

}


/* GUARDAR */

function saveProduct(id) {

    const product =
        products.find(item => item.id === id);

    if (!product) return;

    product.saved++;

    saveProducts();

    renderProducts();

    alert("🔖 Producto guardado.");

}


/* WHATSAPP */

function contactWhatsApp(productName) {

    const user =
        JSON.parse(
            localStorage.getItem(STORAGE_USER)
        ) || {};


    if (!user.whatsapp) {

        alert(
            "El vendedor todavía no tiene WhatsApp configurado."
        );

        return;

    }


    const message =
        `Hola, estoy interesado en tu producto: ${productName}`;


    const url =
        `https://wa.me/${user.whatsapp}?text=${encodeURIComponent(message)}`;


    window.open(url, "_blank");

}


/* FILTROS */

function openFilters() {

    openModal("filterModal");

}


function applyFilters() {

    const min =
        Number(
            document.getElementById("minPrice").value
        ) || 0;

    const max =
        Number(
            document.getElementById("maxPrice").value
        ) || Infinity;


    const filtered =
        products.filter(product => {

            const categoryMatch =
                selectedCategory === "Todos"
                ||
                product.category === selectedCategory;

            return (
                product.price >= min
                &&
                product.price <= max
                &&
                categoryMatch
            );

        });


    renderProducts(filtered);

    closeModal("filterModal");

}


/* PERFIL */

function openProfile() {

    loadUser();

    openModal("profileModal");

}


function loadUser() {

    const saved =
        localStorage.getItem(STORAGE_USER);

    if (!saved) return;


    try {

        const user = JSON.parse(saved);

        document.getElementById("profileName").textContent =
            user.name || "Usuario Market Flash";

        document.getElementById("profilePhone").textContent =
            user.whatsapp
            ? `WhatsApp: ${user.whatsapp}`
            : "WhatsApp no configurado";

    } catch (error) {

        console.log(error);

    }

}


/* ESTADISTICAS */

function openStats() {

    const totalViews =
        products.reduce(
            (sum, item) => sum + item.views,
            0
        );

    const totalLikes =
        products.reduce(
            (sum, item) => sum + item.likes,
            0
        );

    const totalSaved =
        products.reduce(
            (sum, item) => sum + item.saved,
            0
        );


    document.getElementById("totalViews").textContent =
        totalViews;

    document.getElementById("totalLikes").textContent =
        totalLikes;

    document.getElementById("totalSaved").textContent =
        totalSaved;

    document.getElementById("profileVisits").textContent =
        Math.floor(totalViews / 3);


    openModal("statsModal");

}


/* PROMOCIONES */

function openPromotion() {

    openModal("promotionModal");

}


function selectPlan(name, price) {

    selectedPlan = name;

    selectedPlanPrice = price;

    document.getElementById("paymentStep")
        .classList.remove("hidden");


    alert(
        `Plan ${name} seleccionado: ${formatMoney(price)}`
    );

}


function submitPromotion() {

    if (!selectedPlan) {

        alert("Selecciona un plan.");

        return;

    }


    const method =
        document.getElementById("paymentMethod").value;

    const receipt =
        document.getElementById("paymentReceipt").files;


    if (!method) {

        alert("Selecciona un método de pago.");

        return;

    }


    if (receipt.length === 0) {

        alert("Sube el comprobante de pago.");

        return;

    }


    /*
       Más adelante esta solicitud será enviada
       directamente a Supabase para que aparezca
       en el panel administrativo.
    */

    const promotion = {

        id: Date.now(),

        plan: selectedPlan,

        price: selectedPlanPrice,

        paymentMethod: method,

        status: "Pendiente",

        createdAt: new Date().toISOString()

    };


    const promotions =
        JSON.parse(
            localStorage.getItem("mf_promotions")
        ) || [];


    promotions.push(promotion);


    localStorage.setItem(
        "mf_promotions",
        JSON.stringify(promotions)
    );


    alert(
        "✅ Solicitud enviada. Esperando aprobación del administrador."
    );


    closeModal("promotionModal");

}


/* CHAT */

function openMessages() {

    alert(
        "💬 Sistema de chat de Market Flash. Lo conectaremos con Supabase en el siguiente paso."
    );

}


/* FAVORITOS */

function openFavorites() {

    const saved =
        products.filter(product => product.saved > 0);

    renderProducts(saved);

}


/* INICIO */

function goHome() {

    showAllProducts();

}


/* NOTIFICACIONES */

function showNotifications() {

    alert(
        "🔔 No tienes nuevas notificaciones."
    );

}


/* ELIMINAR CUENTA */

function deleteAccount() {

    const confirmation =
        confirm(
            "¿Estás seguro de que quieres eliminar tu cuenta? Esta acción requiere confirmación."
        );


    if (!confirmation) return;


    const secondConfirmation =
        confirm(
            "Esta acción eliminará tus datos locales. ¿Continuar?"
        );


    if (!secondConfirmation) return;


    localStorage.removeItem(STORAGE_USER);

    alert(
        "Cuenta eliminada."
    );


    location.reload();

}


/* CERRAR MODAL AL HACER CLICK AFUERA */

document.addEventListener("click", function(event) {

    if (!event.target.classList.contains("modal")) {
        return;
    }


    event.target.classList.remove("show");

});
