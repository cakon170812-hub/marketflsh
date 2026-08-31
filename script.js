"use strict";

/* =========================================================
   MARKET FLASH
   SCRIPT.JS
   Versión limpia y sincronizada con el index.html actual
   ========================================================= */


/* =========================================================
   1. CONFIGURACIÓN DE SUPABASE
   ========================================================= */

const MARKET_FLASH_SUPABASE_URL =
    "https://osxuhmgnpgbxfopqdhqr.supabase.co";

const MARKET_FLASH_SUPABASE_KEY =
    "sb_publishable_6qLmRFGHrwGq_CKqsIH7jA_Oz8TTlQZ";


/*
 * El index.html carga primero la librería oficial:
 *
 * https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2
 *
 * Aquí creamos UNA sola instancia con un nombre propio.
 */

let marketFlashClient = null;


if (
    window.supabase &&
    typeof window.supabase.createClient === "function"
) {

    marketFlashClient =
        window.supabase.createClient(
            MARKET_FLASH_SUPABASE_URL,
            MARKET_FLASH_SUPABASE_KEY,
            {
                auth: {
                    autoRefreshToken: true,
                    persistSession: true,
                    detectSessionInUrl: true
                }
            }
        );

} else {

    console.error(
        "Market Flash: no se pudo cargar Supabase."
    );

}


/* =========================================================
   2. ESTADO GLOBAL
   ========================================================= */

const MARKET_FLASH_STATE = {

    user: null,

    profile: null,

    isAdmin: false,

    currentSection: "inicio",

    selectedProduct: null,

    products: [],

    favorites: new Set(),

    search: "",

    category: "Todos",

    publicationMode: "paid",

    promotionsActive: true

};


/* =========================================================
   3. FUNCIONES CORTAS
   ========================================================= */

function byId(id) {

    return document.getElementById(id);

}


function all(selector) {

    return Array.from(
        document.querySelectorAll(selector)
    );

}


function showMessage(
    text,
    type = "info"
) {

    const box =
        byId("app-message");


    if (!box) {

        console.log(text);

        return;

    }


    box.textContent =
        text;


    box.className =
        "app-message show";


    if (
        type === "success"
    ) {

        box.classList.add(
            "success"
        );

    }


    if (
        type === "error"
    ) {

        box.classList.add(
            "error"
        );

    }


    if (
        type === "warning"
    ) {

        box.classList.add(
            "warning"
        );

    }


    clearTimeout(
        box._marketFlashTimer
    );


    box._marketFlashTimer =
        setTimeout(
            () => {

                box.classList.remove(
                    "show"
                );

            },
            4000
        );

}


/* =========================================================
   4. NAVEGACIÓN
   ========================================================= */

const MARKET_FLASH_SECTIONS = [

    "inicio",
    "categorias",
    "registro",
    "inicio-sesion",
    "publicar",
    "pago",
    "perfil",
    "promocionar",
    "videos",
    "notificaciones",
    "calificaciones",
    "reclamos",
    "soporte",
    "contactar-vendedor",
    "administrador",
    "politicas"

];


function showSection(
    sectionId
) {

    if (
        !MARKET_FLASH_SECTIONS.includes(
            sectionId
        )
    ) {

        return;

    }


    MARKET_FLASH_SECTIONS.forEach(
        id => {

            const section =
                document.getElementById(id);


            if (!section) {
                return;
            }


            section.classList.toggle(
                "active",
                id === sectionId
            );

        }
    );


    all(
        "[data-section]"
    ).forEach(
        button => {

            button.classList.toggle(
                "active",
                button.dataset.section ===
                sectionId
            );

        }
    );


    MARKET_FLASH_STATE.currentSection =
        sectionId;


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });


    /*
     * Acciones al entrar en determinadas áreas.
     */

    if (
        sectionId === "perfil"
    ) {

        if (
            !MARKET_FLASH_STATE.user
        ) {

            showMessage(
                "Debes iniciar sesión para acceder a tu perfil.",
                "warning"
            );


            showSection(
                "inicio-sesion"
            );


            return;

        }


        renderProfile();

        renderMyProducts();

        renderFavorites();

        renderSoldProducts();

    }


    if (
        sectionId === "administrador"
    ) {

        if (
            !MARKET_FLASH_STATE.isAdmin
        ) {

            showMessage(
                "No tienes permisos de administrador.",
                "error"
            );


            showSection(
                "inicio"
            );


            return;

        }


        loadAdminDashboard();

    }


    if (
        sectionId === "notificaciones"
    ) {

        loadNotifications();

    }


    if (
        sectionId === "promocionar"
    ) {

        loadPromotions();

    }

}


/* =========================================================
   5. NAVEGACIÓN GENERAL
   ========================================================= */

function setupNavigation() {

    all(
        "[data-section]"
    ).forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const target =
                        button.dataset.section;


                    /*
                     * Publicar requiere cuenta.
                     */

                    if (
                        target ===
                        "publicar"
                    ) {

                        if (
                            !MARKET_FLASH_STATE.user
                        ) {

                            showMessage(
                                "Para publicar necesitas una cuenta.",
                                "warning"
                            );


                            showSection(
                                "inicio-sesion"
                            );


                            return;

                        }

                    }


                    /*
                     * Perfil requiere cuenta.
                     */

                    if (
                        target ===
                        "perfil"
                    ) {

                        if (
                            !MARKET_FLASH_STATE.user
                        ) {

                            showMessage(
                                "Para entrar a tu perfil necesitas iniciar sesión.",
                                "warning"
                            );


                            showSection(
                                "inicio-sesion"
                            );


                            return;

                        }

                    }


                    /*
                     * Administrador.
                     */

                    if (
                        target ===
                        "administrador"
                    ) {

                        if (
                            !MARKET_FLASH_STATE.isAdmin
                        ) {

                            showMessage(
                                "Acceso reservado al administrador.",
                                "error"
                            );


                            return;

                        }

                    }


                    showSection(
                        target
                    );

                }
            );

        }
    );

}


/* =========================================================
   6. BOTONES DEL HEADER
   ========================================================= */

function setupHeaderButtons() {

    byId(
        "btn-registrarse"
    )?.addEventListener(
        "click",
        () => {

            showSection(
                "registro"
            );

        }
    );


    byId(
        "btn-iniciar-sesion"
    )?.addEventListener(
        "click",
        () => {

            showSection(
                "inicio-sesion"
            );

        }
    );


    byId(
        "btn-perfil"
    )?.addEventListener(
        "click",
        () => {

            if (
                !MARKET_FLASH_STATE.user
            ) {

                showSection(
                    "inicio-sesion"
                );


                return;

            }


            showSection(
                "perfil"
            );

        }
    );

}


/* =========================================================
   7. REGISTRO
   ========================================================= */

async function registerUser(
    event
) {

    event.preventDefault();


    if (
        !marketFlashClient
    ) {

        showMessage(
            "Supabase no está disponible.",
            "error"
        );


        return;

    }


    const form =
        event.currentTarget;


    const name =
        byId(
            "registro-nombre"
        )?.value.trim();


    const email =
        byId(
            "registro-correo"
        )?.value.trim();


    const documentNumber =
        byId(
            "registro-documento"
        )?.value.trim();


    const phone =
        byId(
            "registro-telefono"
        )?.value.trim();


    const whatsapp =
        byId(
            "registro-whatsapp"
        )?.value.trim();


    const messenger =
        byId(
            "registro-messenger"
        )?.value.trim();


    const password =
        byId(
            "registro-password"
        )?.value;


    if (
        !name ||
        !email ||
        !documentNumber ||
        !phone ||
        !password
    ) {

        showMessage(
            "Completa todos los campos obligatorios.",
            "warning"
        );


        return;

    }


    if (
        password.length < 6
    ) {

        showMessage(
            "La contraseña debe tener al menos 6 caracteres.",
            "warning"
        );


        return;

    }


    const button =
        form.querySelector(
            'button[type="submit"]'
        );


    if (button) {

        button.disabled =
            true;

    }


    try {

        const result =
            await marketFlashClient.auth.signUp({

                email:
                    email,

                password:
                    password,

                options: {

                    data: {

                        full_name:
                            name,

                        documento:
                            documentNumber,

                        phone:
                            phone,

                        whatsapp:
                            whatsapp,

                        messenger:
                            messenger

                    }

                }

            });


        if (
            result.error
        ) {

            throw result.error;

        }


        /*
         * El trigger de Supabase debe crear
         * automáticamente el registro en profiles.
         */

        form.reset();


        /*
         * Si Supabase devuelve sesión inmediatamente,
         * el usuario puede continuar.
         */

        if (
            result.data.session
        ) {

            MARKET_FLASH_STATE.user =
                result.data.user;


            await loadProfile();


            updateInterface();


            showMessage(
                "Cuenta creada correctamente.",
                "success"
            );


            showSection(
                "inicio"
            );


        } else {

            /*
             * Si está activada la confirmación por correo,
             * todavía no tendremos sesión.
             */

            showMessage(
                "Cuenta creada. Revisa tu correo para confirmar la cuenta.",
                "success"
            );


            showSection(
                "inicio-sesion"
            );

        }

    } catch (error) {

        console.error(
            "Market Flash - registro:",
            error
        );


        showMessage(
            error.message ||
            "No se pudo crear la cuenta.",
            "error"
        );

    } finally {

        if (button) {

            button.disabled =
                false;

        }

    }

}


/* =========================================================
   8. INICIO DE SESIÓN
   ========================================================= */

async function loginUser(
    event
) {

    event.preventDefault();


    if (
        !marketFlashClient
    ) {

        showMessage(
            "Supabase no está disponible.",
            "error"
        );


        return;

    }


    const form =
        event.currentTarget;


    const email =
        byId(
            "login-correo"
        )?.value.trim();


    const password =
        byId(
            "login-password"
        )?.value;


    if (
        !email ||
        !password
    ) {

        showMessage(
            "Escribe tu correo y contraseña.",
            "warning"
        );


        return;

    }


    const button =
        form.querySelector(
            'button[type="submit"]'
        );


    if (button) {

        button.disabled =
            true;

    }


    try {

        const result =
            await marketFlashClient.auth
                .signInWithPassword({

                    email:
                        email,

                    password:
                        password

                });


        if (
            result.error
        ) {

            throw result.error;

        }


        MARKET_FLASH_STATE.user =
            result.data.user;


        await loadProfile();


        updateInterface();


        form.reset();


        /*
         * Ahora sí llevamos al usuario
         * directamente a su perfil.
         */

        showSection(
            "perfil"
        );


        showMessage(
            MARKET_FLASH_STATE.isAdmin
                ? "Sesión iniciada. Cuenta de administrador."
                : "Sesión iniciada correctamente.",
            "success"
        );


    } catch (error) {

        console.error(
            "Market Flash - login:",
            error
        );


        showMessage(
            error.message ||
            "No se pudo iniciar sesión.",
            "error"
        );

    } finally {

        if (button) {

            button.disabled =
                false;

        }

    }

}


/* =========================================================
   9. RESTAURAR SESIÓN
   ========================================================= */

async function restoreSession() {

    if (
        !marketFlashClient
    ) {
        return;
    }


    try {

        const result =
            await marketFlashClient.auth
                .getSession();


        if (
            result.error
        ) {

            throw result.error;

        }


        MARKET_FLASH_STATE.user =
            result.data.session?.user ||
            null;


        if (
            MARKET_FLASH_STATE.user
        ) {

            await loadProfile();

        }


        updateInterface();

    } catch (error) {

        console.error(
            "Market Flash - sesión:",
            error
        );

    }

}


/* =========================================================
   10. ESCUCHAR CAMBIOS DE SESIÓN
   ========================================================= */

function setupAuthListener() {

    if (
        !marketFlashClient
    ) {
        return;
    }


    marketFlashClient.auth
        .onAuthStateChange(
            (
                event,
                session
            ) => {

                setTimeout(
                    async () => {

                        MARKET_FLASH_STATE.user =
                            session?.user ||
                            null;


                        if (
                            MARKET_FLASH_STATE.user
                        ) {

                            await loadProfile();

                        } else {

                            MARKET_FLASH_STATE.profile =
                                null;

                            MARKET_FLASH_STATE.isAdmin =
                                false;

                        }


                        updateInterface();

                    },
                    0
                );

            }
        );

}


/* =========================================================
   11. CARGAR PERFIL
   ========================================================= */

async function loadProfile() {

    if (
        !MARKET_FLASH_STATE.user ||
        !marketFlashClient
    ) {

        MARKET_FLASH_STATE.profile =
            null;

        MARKET_FLASH_STATE.isAdmin =
            false;

        return;

    }


    try {

        const result =
            await marketFlashClient
                .from("profiles")
                .select(
                    "id,full_name,documento,phone,whatsapp,messenger,role"
                )
                .eq(
                    "id",
                    MARKET_FLASH_STATE.user.id
                )
                .maybeSingle();


        if (
            result.error
        ) {

            console.error(
                "Market Flash - perfil:",
                result.error
            );


            MARKET_FLASH_STATE.profile =
                null;


            MARKET_FLASH_STATE.isAdmin =
                false;


            return;

        }


        MARKET_FLASH_STATE.profile =
            result.data;


        MARKET_FLASH_STATE.isAdmin =
            result.data?.role ===
            "admin";

    } catch (error) {

        console.error(
            "Market Flash - perfil:",
            error
        );

    }

}


/* =========================================================
   12. ACTUALIZAR INTERFAZ
   ========================================================= */

function updateInterface() {

    const registerButton =
        byId(
            "btn-registrarse"
        );


    const loginButton =
        byId(
            "btn-iniciar-sesion"
        );


    const profileButton =
        byId(
            "btn-perfil"
        );


    if (
        MARKET_FLASH_STATE.user
    ) {

        if (registerButton) {

            registerButton.style.display =
                "none";

        }


        if (loginButton) {

            loginButton.style.display =
                "none";

        }


        if (profileButton) {

            profileButton.style.display =
                "inline-flex";

        }

    } else {

        if (registerButton) {

            registerButton.style.display =
                "inline-flex";

        }


        if (loginButton) {

            loginButton.style.display =
                "inline-flex";

        }


        if (profileButton) {

            profileButton.style.display =
                "none";

        }

    }


    renderProfile();

}


/* =========================================================
   13. MOSTRAR PERFIL
   ========================================================= */

function renderProfile() {

    const profile =
        MARKET_FLASH_STATE.profile;


    if (!profile) {
        return;
    }


    const user =
        MARKET_FLASH_STATE.user;


    const values = {

        "perfil-nombre":
            profile.full_name ||
            "Usuario",

        "perfil-correo":
            user?.email ||
            "-",

        "perfil-telefono":
            profile.phone ||
            "-",

        "perfil-whatsapp":
            profile.whatsapp ||
            "-",

        "perfil-messenger":
            profile.messenger ||
            "-",

        "perfil-documento":
            profile.documento ||
            "-"

    };


    Object.entries(
        values
    ).forEach(
        ([id, value]) => {

            const element =
                byId(id);


            if (element) {

                element.textContent =
                    value;

            }

        }
    );

}


/* =========================================================
   14. EDITAR PERFIL
   ========================================================= */

async function editProfile() {

    if (
        !MARKET_FLASH_STATE.user
    ) {

        showSection(
            "inicio-sesion"
        );


        return;

    }


    const profile =
        MARKET_FLASH_STATE.profile ||
        {};


    const name =
        prompt(
            "Nombre completo:",
            profile.full_name ||
            ""
        );


    if (
        name === null
    ) {
        return;
    }


    const phone =
        prompt(
            "Teléfono:",
            profile.phone ||
            ""
        );


    if (
        phone === null
    ) {
        return;
    }


    const whatsapp =
        prompt(
            "WhatsApp:",
            profile.whatsapp ||
            ""
        );


    if (
        whatsapp === null
    ) {
        return;
    }


    const messenger =
        prompt(
            "Messenger:",
            profile.messenger ||
            ""
        );


    if (
        messenger === null
    ) {
        return;
    }


    const result =
        await marketFlashClient
            .from("profiles")
            .update({

                full_name:
                    name.trim(),

                phone:
                    phone.trim(),

                whatsapp:
                    whatsapp.trim(),

                messenger:
                    messenger.trim()

            })
            .eq(
                "id",
                MARKET_FLASH_STATE.user.id
            )
            .select()
            .single();


    if (
        result.error
    ) {

        showMessage(
            result.error.message,
            "error"
        );


        return;

    }


    MARKET_FLASH_STATE.profile =
        result.data;


    renderProfile();


    showMessage(
        "Perfil actualizado correctamente.",
        "success"
    );

}


/* =========================================================
   15. CERRAR SESIÓN
   ========================================================= */

async function logoutUser() {

    if (
        !marketFlashClient
    ) {
        return;
    }


    const result =
        await marketFlashClient
            .auth
            .signOut();


    if (
        result.error
    ) {

        showMessage(
            result.error.message,
            "error"
        );


        return;

    }


    MARKET_FLASH_STATE.user =
        null;

    MARKET_FLASH_STATE.profile =
        null;

    MARKET_FLASH_STATE.isAdmin =
        false;


    updateInterface();


    showSection(
        "inicio"
    );


    showMessage(
        "Has cerrado sesión.",
        "success"
    );

}


/* =========================================================
   16. RECUPERACIÓN DE CONTRASEÑA
   ========================================================= */

async function recoverPassword() {

    if (
        !marketFlashClient
    ) {
        return;
    }


    const email =
        prompt(
            "Escribe tu correo electrónico:"
        );


    if (!email) {
        return;
    }


    const redirect =
        window.location.origin +
        window.location.pathname;


    const result =
        await marketFlashClient
            .auth
            .resetPasswordForEmail(
                email.trim(),
                {
                    redirectTo:
                        redirect
                }
            );


    if (
        result.error
    ) {

        showMessage(
            result.error.message,
            "error"
        );


        return;

    }


    showMessage(
        "Te enviamos las instrucciones a tu correo.",
        "success"
    );

}


/* =========================================================
   17. CONFIGURAR AUTENTICACIÓN
   ========================================================= */

function setupAuthentication() {

    byId(
        "formulario-registro"
    )?.addEventListener(
        "submit",
        registerUser
    );


    byId(
        "formulario-login"
    )?.addEventListener(
        "submit",
        loginUser
    );


    byId(
        "btn-ir-login"
    )?.addEventListener(
        "click",
        () => {

            showSection(
                "inicio-sesion"
            );

        }
    );


    byId(
        "btn-ir-registro"
    )?.addEventListener(
        "click",
        () => {

            showSection(
                "registro"
            );

        }
    );


    byId(
        "btn-recuperar-password"
    )?.addEventListener(
        "click",
        recoverPassword
    );


    byId(
        "btn-editar-perfil"
    )?.addEventListener(
        "click",
        editProfile
    );


    byId(
        "btn-cerrar-sesion"
    )?.addEventListener(
        "click",
        logoutUser
    );

}


/* =========================================================
   18. INICIO
   ========================================================= */

function setupHome() {

    /*
     * El buscador pertenece exclusivamente
     * a la sección Inicio.
     */

    const form =
        byId(
            "form-busqueda"
        );


    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const value =
                byId(
                    "buscar"
                )?.value.trim()
                .toLowerCase() ||
                "";


            MARKET_FLASH_STATE.search =
                value;


            renderProducts();


            showSection(
                "inicio"
            );

        }
    );


    byId(
        "btn-limpiar-busqueda"
    )?.addEventListener(
        "click",
        () => {

            const input =
                byId(
                    "buscar"
                );


            if (input) {

                input.value =
                    "";

            }


            MARKET_FLASH_STATE.search =
                "";


            renderProducts();

        }
    );

}


/* =========================================================
   19. CATEGORÍAS
   ========================================================= */

function setupCategories() {

    all(
        ".category-card"
    ).forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    MARKET_FLASH_STATE.category =
                        button.dataset.category ||
                        "Todos";


                    all(
                        ".category-card"
                    )
                    .forEach(
                        item => {

                            item.classList.toggle(
                                "active",
                                item === button
                            );

                        }
                    );


                    renderProducts();


                    showSection(
                        "inicio"
                    );

                }
            );

        }
    );

}


/* =========================================================
   20. CARGAR PRODUCTOS
   ========================================================= */

async function loadProducts() {

    if (
        !marketFlashClient
    ) {
        return;
    }


    try {

        const result =
            await marketFlashClient
                .from("products")
                .select(
                    "id,user_id,nombre,categoria,precio,cantidad,descripcion,contacto,status,image_urls,views,created_at"
                )
                .order(
                    "created_at",
                    {
                        ascending:
                            false
                    }
                );


        if (
            result.error
        ) {

            console.error(
                "Market Flash - productos:",
                result.error
            );


            return;

        }


        MARKET_FLASH_STATE.products =
            result.data ||
            [];


        renderProducts();


        if (
            MARKET_FLASH_STATE.user
        ) {

            renderMyProducts();

            renderSoldProducts();

        }

    } catch (error) {

        console.error(
            "Market Flash - productos:",
            error
        );

    }

}


/* =========================================================
   21. FILTRAR PRODUCTOS
   ========================================================= */

function getPublicProducts() {

    let products =
        MARKET_FLASH_STATE.products
            .filter(
                product =>
                    product.status ===
                    "approved"
            );


    if (
        MARKET_FLASH_STATE.category !==
        "Todos"
    ) {

        products =
            products.filter(
                product =>
                    String(
                        product.categoria ||
                        ""
                    )
                    .toLowerCase() ===
                    String(
                        MARKET_FLASH_STATE.category
                    )
                    .toLowerCase()
            );

    }


    if (
        MARKET_FLASH_STATE.search
    ) {

        products =
            products.filter(
                product => {

                    const text =
                        [
                            product.nombre,
                            product.categoria,
                            product.descripcion
                        ]
                            .filter(Boolean)
                            .join(" ")
                            .toLowerCase();


                    return text.includes(
                        MARKET_FLASH_STATE.search
                    );

                }
            );

    }


    return products;

}


/* =========================================================
   22. PRECIO
   ========================================================= */

function formatPrice(
    value
) {

    const number =
        Number(value);


    if (
        Number.isNaN(number)
    ) {

        return "0.00";

    }


    return number.toLocaleString(
        "es-DO",
        {
            minimumFractionDigits:
                2,

            maximumFractionDigits:
                2
        }
    );

}


/* =========================================================
   23. TARJETA DE PRODUCTO
   ========================================================= */

function createProductCard(
    product
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "product-card";


    const imageBox =
        document.createElement(
            "div"
        );


    imageBox.className =
        "product-image";


    const imageUrls =
        Array.isArray(
            product.image_urls
        )
            ? product.image_urls
            : [];


    if (
        imageUrls.length
    ) {

        const image =
            document.createElement(
                "img"
            );


        image.src =
            imageUrls[0];


        image.alt =
            product.nombre ||
            "Producto";


        image.loading =
            "lazy";


        imageBox.appendChild(
            image
        );

    } else {

        const placeholder =
            document.createElement(
                "span"
            );


        placeholder.className =
            "product-image-placeholder";


        placeholder.textContent =
            "Sin imagen";


        imageBox.appendChild(
            placeholder
        );

    }


    const body =
        document.createElement(
            "div"
        );


    body.className =
        "product-body";


    const category =
        document.createElement(
            "div"
        );


    category.className =
        "product-category";


    category.textContent =
        product.categoria ||
        "Otros";


    const title =
        document.createElement(
            "h3"
        );


    title.className =
        "product-title";


    title.textContent =
        product.nombre ||
        "Producto";


    const description =
        document.createElement(
            "p"
        );


    description.className =
        "product-description";


    description.textContent =
        product.descripcion ||
        "";


    const price =
        document.createElement(
            "div"
        );


    price.className =
        "product-price";


    price.textContent =
        `RD$ ${formatPrice(
            product.precio
        )}`;


    const meta =
        document.createElement(
            "div"
        );


    meta.className =
        "product-meta";


    const quantity =
        document.createElement(
            "span"
        );


    quantity.textContent =
        `Cantidad: ${
            product.cantidad ??
            0
        }`;


    const views =
        document.createElement(
            "span"
        );


    views.textContent =
        `Vistas: ${
            product.views ??
            0
        }`;


    meta.appendChild(
        quantity
    );

    meta.appendChild(
        views
    );


    const actions =
        document.createElement(
            "div"
        );


    actions.className =
        "product-actions";


    const viewButton =
        document.createElement(
            "button"
        );


    viewButton.type =
        "button";


    viewButton.className =
        "secondary-button";


    viewButton.textContent =
        "Ver producto";


    viewButton.addEventListener(
        "click",
        () => {

            selectProduct(
                product
            );

        }
    );


    actions.appendChild(
        viewButton
    );


    const favoriteButton =
        document.createElement(
            "button"
        );


    favoriteButton.type =
        "button";


    favoriteButton.className =
        "secondary-button";


    favoriteButton.textContent =
        MARKET_FLASH_STATE.favorites.has(
            product.id
        )
            ? "★ Favorito"
            : "☆ Favorito";


    favoriteButton.addEventListener(
        "click",
        () => {

            toggleFavorite(
                product.id
            );

        }
    );


    actions.appendChild(
        favoriteButton
    );


    body.appendChild(
        category
    );

    body.appendChild(
        title
    );

    body.appendChild(
        description
    );

    body.appendChild(
        price
    );

    body.appendChild(
        meta
    );

    body.appendChild(
        actions
    );


    card.appendChild(
        imageBox
    );

    card.appendChild(
        body
    );


    return card;

}


/* =========================================================
   24. MOSTRAR PRODUCTOS
   ========================================================= */

function renderProducts() {

    const container =
        byId(
            "lista-productos"
        );


    const empty =
        byId(
            "sin-productos"
        );


    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    const products =
        getPublicProducts();


    if (
        !products.length
    ) {

        if (empty) {

            empty.style.display =
                "grid";

        }


        return;

    }


    if (empty) {

        empty.style.display =
            "none";

    }


    products.forEach(
        product => {

            container.appendChild(
                createProductCard(
                    product
                )
            );

        }
    );

}


/* =========================================================
   25. SELECCIONAR PRODUCTO
   ========================================================= */

async function selectProduct(
    product
) {

    MARKET_FLASH_STATE.selectedProduct =
        product;


    /*
     * El producto se puede ver sin cuenta.
     * Solo las acciones posteriores exigirán cuenta.
     */

    if (
        MARKET_FLASH_STATE.user?.id !==
        product.user_id
    ) {

        try {

            const newViews =
                Number(
                    product.views ||
                    0
                ) + 1;


            await marketFlashClient
                .from("products")
                .update({
                    views:
                        newViews
                })
                .eq(
                    "id",
                    product.id
                );


            product.views =
                newViews;

        } catch (error) {

            console.error(
                "Error actualizando vistas:",
                error
            );

        }

    }


    const sellerName =
        byId(
            "contacto-vendedor-nombre"
        );


    if (
        sellerName
    ) {

        sellerName.textContent =
            `Producto seleccionado: ${
                product.nombre
            }`;

    }


    showSection(
        "contactar-vendedor"
    );

}


/* =========================================================
   26. FAVORITOS
   ========================================================= */

async function loadFavorites() {

    if (
        !MARKET_FLASH_STATE.user
    ) {
        return;
    }


    const result =
        await marketFlashClient
            .from("favorites")
            .select(
                "product_id"
            )
            .eq(
                "user_id",
                MARKET_FLASH_STATE.user.id
            );


    if (
        result.error
    ) {

        console.error(
            "Favoritos:",
            result.error
        );


        return;

    }


    MARKET_FLASH_STATE.favorites =
        new Set(
            (result.data || [])
                .map(
                    item =>
                        item.product_id
                )
        );


    renderFavorites();


    renderProducts();

}


async function toggleFavorite(
    productId
) {

    if (
        !MARKET_FLASH_STATE.user
    ) {

        showMessage(
            "Para guardar favoritos necesitas una cuenta.",
            "warning"
        );


        showSection(
            "inicio-sesion"
        );


        return;

    }


    const exists =
        MARKET_FLASH_STATE.favorites.has(
            productId
        );


    if (
        exists
    ) {

        const result =
            await marketFlashClient
                .from("favorites")
                .delete()
                .eq(
                    "user_id",
                    MARKET_FLASH_STATE.user.id
                )
                .eq(
                    "product_id",
                    productId
                );


        if (
            result.error
        ) {

            showMessage(
                result.error.message,
                "error"
            );


            return;

        }


        MARKET_FLASH_STATE.favorites.delete(
            productId
        );


        showMessage(
            "Eliminado de favoritos.",
            "success"
        );

    } else {

        const result =
            await marketFlashClient
                .from("favorites")
                .insert({

                    user_id:
                        MARKET_FLASH_STATE.user.id,

                    product_id:
                        productId

                });


        if (
            result.error
        ) {

            showMessage(
                result.error.message,
                "error"
            );


            return;

        }


        MARKET_FLASH_STATE.favorites.add(
            productId
        );


        showMessage(
            "Añadido a favoritos.",
            "success"
        );

    }


    renderFavorites();

    renderProducts();

}


/* =========================================================
   27. FAVORITOS EN PERFIL
   ========================================================= */

function renderFavorites() {

    const container =
        byId(
            "lista-favoritos"
        );


    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    if (
        !MARKET_FLASH_STATE.user
    ) {

        return;

    }


    const favorites =
        MARKET_FLASH_STATE.products
            .filter(
                product =>
                    MARKET_FLASH_STATE.favorites
                        .has(
                            product.id
                        )
            );


    if (
        !favorites.length
    ) {

        renderEmpty(
            container,
            "No tienes productos favoritos."
        );


        return;

    }


    favorites.forEach(
        product => {

            container.appendChild(
                createProductCard(
                    product
                )
            );

        }
    );

}


/* =========================================================
   28. MIS PUBLICACIONES
   ========================================================= */

function renderMyProducts() {

    const container =
        byId(
            "mis-publicaciones"
        );


    if (
        !container ||
        !MARKET_FLASH_STATE.user
    ) {
        return;
    }


    container.innerHTML =
        "";


    const products =
        MARKET_FLASH_STATE.products
            .filter(
                product =>
                    product.user_id ===
                    MARKET_FLASH_STATE.user.id
            );


    if (
        !products.length
    ) {

        renderEmpty(
            container,
            "Todavía no tienes publicaciones."
        );


        return;

    }


    products.forEach(
        product => {

            container.appendChild(
                createProductCard(
                    product
                )
            );

        }
    );

}


/* =========================================================
   29. PRODUCTOS VENDIDOS
   ========================================================= */

function renderSoldProducts() {

    const container =
        byId(
            "lista-vendidos"
        );


    if (
        !container ||
        !MARKET_FLASH_STATE.user
    ) {
        return;
    }


    container.innerHTML =
        "";


    const sold =
        MARKET_FLASH_STATE.products
            .filter(
                product =>
                    product.user_id ===
                    MARKET_FLASH_STATE.user.id &&
                    product.status ===
                    "sold"
            );


    if (
        !sold.length
    ) {

        renderEmpty(
            container,
            "No tienes productos vendidos."
        );


        return;

    }


    sold.forEach(
        product => {

            container.appendChild(
                createProductCard(
                    product
                )
            );

        }
    );

}


/* =========================================================
   30. PREVISUALIZACIÓN DE IMÁGENES
   ========================================================= */

function setupImagePreview() {

    const input =
        byId(
            "producto-imagen"
        );


    const preview =
        byId(
            "preview-imagenes"
        );


    if (
        !input ||
        !preview
    ) {
        return;
    }


    input.addEventListener(
        "change",
        () => {

            preview.innerHTML =
                "";


            Array.from(
                input.files ||
                []
            )
            .forEach(
                file => {

                    if (
                        !file.type.startsWith(
                            "image/"
                        )
                    ) {

                        return;

                    }


                    const wrapper =
                        document.createElement(
                            "div"
                        );


                    wrapper.className =
                        "image-preview-item";


                    const image =
                        document.createElement(
                            "img"
                        );


                    image.src =
                        URL.createObjectURL(
                            file
                        );


                    image.alt =
                        "Vista previa";


                    wrapper.appendChild(
                        image
                    );


                    preview.appendChild(
                        wrapper
                    );

                }
            );

        }
    );

}


/* =========================================================
   31. SUBIR IMÁGENES
   ========================================================= */

async function uploadProductImages(
    files
) {

    if (
        !files.length
    ) {

        return [];

    }


    const urls = [];


    for (
        const file of files
    ) {

        if (
            !file.type.startsWith(
                "image/"
            )
        ) {

            continue;

        }


        const extension =
            file.name
                .split(".")
                .pop()
                .toLowerCase();


        const fileName =
            `${crypto.randomUUID()}.${extension}`;


        const path =
            `${MARKET_FLASH_STATE.user.id}/${fileName}`;


        const result =
            await marketFlashClient
                .storage
                .from(
                    "product-images"
                )
                .upload(
                    path,
                    file,
                    {

                        cacheControl:
                            "3600",

                        upsert:
                            false,

                        contentType:
                            file.type

                    }
                );


        if (
            result.error
        ) {

            throw result.error;

        }


        const publicUrl =
            marketFlashClient
                .storage
                .from(
                    "product-images"
                )
                .getPublicUrl(
                    path
                );


        if (
            publicUrl.data?.publicUrl
        ) {

            urls.push(
                publicUrl.data.publicUrl
            );

        }

    }


    return urls;

}


/* =========================================================
   32. CREAR PRODUCTO
   ========================================================= */

async function createProduct(
    event
) {

    event.preventDefault();


    if (
        !MARKET_FLASH_STATE.user
    ) {

        showMessage(
            "Debes iniciar sesión para publicar.",
            "warning"
        );


        showSection(
            "inicio-sesion"
        );


        return;

    }


    const name =
        byId(
            "producto-nombre"
        )?.value.trim();


    const category =
        byId(
            "producto-categoria"
        )?.value;


    const price =
        Number(
            byId(
                "producto-precio"
            )?.value
        );


    const quantity =
        Number(
            byId(
                "producto-cantidad"
            )?.value
        );


    const description =
        byId(
            "producto-descripcion"
        )?.value.trim();


    const contact =
        byId(
            "producto-contacto"
        )?.value;


    const imageInput =
        byId(
            "producto-imagen"
        );


    if (
        !name ||
        !category ||
        Number.isNaN(price) ||
        price <= 0 ||
        quantity < 1 ||
        !description ||
        !contact
    ) {

        showMessage(
            "Completa correctamente todos los datos del producto.",
            "warning"
        );


        return;

    }


    const button =
        event.currentTarget.querySelector(
            'button[type="submit"]'
        );


    if (button) {

        button.disabled =
            true;

    }


    try {

        const files =
            Array.from(
                imageInput?.files ||
                []
            );


        const imageUrls =
            await uploadProductImages(
                files
            );


        const result =
            await marketFlashClient
                .from("products")
                .insert({

                    user_id:
                        MARKET_FLASH_STATE.user.id,

                    nombre:
                        name,

                    categoria:
                        category,

                    precio:
                        price,

                    cantidad:
                        quantity,

                    descripcion:
                        description,

                    contacto:
                        contact,

                    status:
                        "pending",

                    image_urls:
                        imageUrls,

                    views:
                        0

                })
                .select()
                .single();


        if (
            result.error
        ) {

            throw result.error;

        }


        MARKET_FLASH_STATE.selectedProduct =
            result.data;


        event.currentTarget.reset();


        const preview =
            byId(
                "preview-imagenes"
            );


        if (preview) {

            preview.innerHTML =
                "";

        }


        await loadProducts();


        showMessage(
            "Publicación enviada para revisión.",
            "success"
        );


        /*
         * Si las publicaciones están configuradas
         * como de pago, pasamos al pago.
         * De lo contrario terminamos en perfil.
         */

        if (
            MARKET_FLASH_STATE.publicationMode ===
            "paid"
        ) {

            showSection(
                "pago"
            );

        } else {

            showSection(
                "perfil"
            );

        }

    } catch (error) {

        console.error(
            "Market Flash - publicar:",
            error
        );


        showMessage(
            error.message ||
            "No se pudo publicar el producto.",
            "error"
        );

    } finally {

        if (button) {

            button.disabled =
                false;

        }

    }

}


/* =========================================================
   33. FORMULARIO DE PUBLICAR
   ========================================================= */

function setupProductForm() {

    byId(
        "form-publicacion"
    )?.addEventListener(
        "submit",
        createProduct
    );

}


/* =========================================================
   34. CONFIGURACIÓN DE PAGOS
   ========================================================= */

function setupPayment() {

    all(
        'input[name="metodo-pago"]'
    ).forEach(
        radio => {

            radio.addEventListener(
                "change",
                () => {

                    const binance =
                        byId(
                            "bloque-binance"
                        );


                    const paypal =
                        byId(
                            "bloque-paypal"
                        );


                    if (binance) {

                        binance.classList.toggle(
                            "hidden",
                            radio.value !==
                            "binance"
                        );

                    }


                    if (paypal) {

                        paypal.classList.toggle(
                            "hidden",
                            radio.value !==
                            "paypal"
                        );

                    }

                }
            );

        }
    );


    byId(
        "comprobante-pago"
    )?.addEventListener(
        "change",
        previewReceipt
    );


    byId(
        "btn-copiar-binance"
    )?.addEventListener(
        "click",
        () => {

            if (
                !APP_BINANCE_ADDRESS
            ) {

                showMessage(
                    "La dirección de Binance todavía no está configurada.",
                    "warning"
                );


                return;

            }


            navigator.clipboard
                .writeText(
                    APP_BINANCE_ADDRESS
                )
                .then(
                    () => {

                        showMessage(
                            "Dirección copiada.",
                            "success"
                        );

                    }
                );

        }
    );


    byId(
        "btn-enviar-comprobante"
    )?.addEventListener(
        "click",
        submitPayment
    );

}


/* =========================================================
   35. CONFIGURACIÓN FIJA DE PAGO
   ========================================================= */

const APP_BINANCE_ADDRESS =
    "";

const APP_PAYPAL_ACCOUNT =
    "";


/* =========================================================
   36. PREVISUALIZACIÓN COMPROBANTE
   ========================================================= */

function previewReceipt(
    event
) {

    const preview =
        byId(
            "preview-comprobante"
        );


    if (!preview) {
        return;
    }


    preview.innerHTML =
        "";


    const file =
        event.currentTarget.files?.[0];


    if (!file) {
        return;
    }


    if (
        file.type.startsWith(
            "image/"
        )
    ) {

        const image =
            document.createElement(
                "img"
            );


        image.src =
            URL.createObjectURL(
                file
            );


        image.alt =
            "Comprobante de pago";


        preview.appendChild(
            image
        );

    } else {

        preview.textContent =
            `Archivo seleccionado: ${
                file.name
            }`;

    }

}


/* =========================================================
   37. SUBIR COMPROBANTE
   ========================================================= */

async function uploadPaymentReceipt(
    file
) {

    const extension =
        file.name
            .split(".")
            .pop()
            .toLowerCase();


    const fileName =
        `${crypto.randomUUID()}.${extension}`;


    const path =
        `${MARKET_FLASH_STATE.user.id}/${fileName}`;


    const result =
        await marketFlashClient
            .storage
            .from(
                "payment-receipts"
            )
            .upload(
                path,
                file,
                {

                    cacheControl:
                        "3600",

                    upsert:
                        false,

                    contentType:
                        file.type

                }
            );


    if (
        result.error
    ) {

        throw result.error;

    }


    const url =
        marketFlashClient
            .storage
            .from(
                "payment-receipts"
            )
            .getPublicUrl(
                path
            );


    return url.data?.publicUrl ||
        null;

}


/* =========================================================
   38. ENVIAR COMPROBANTE
   ========================================================= */

async function submitPayment() {

    if (
        !MARKET_FLASH_STATE.user
    ) {

        showMessage(
            "Debes iniciar sesión.",
            "warning"
        );


        showSection(
            "inicio-sesion"
        );


        return;

    }


    if (
        !MARKET_FLASH_STATE.selectedProduct
    ) {

        showMessage(
            "No hay una publicación seleccionada.",
            "warning"
        );


        return;

    }


    const method =
        document.querySelector(
            'input[name="metodo-pago"]:checked'
        )?.value;


    const file =
        byId(
            "comprobante-pago"
        )?.files?.[0];


    if (!method) {

        showMessage(
            "Selecciona un método de pago.",
            "warning"
        );


        return;

    }


    if (!file) {

        showMessage(
            "Selecciona el comprobante.",
            "warning"
        );


        return;

    }


    const button =
        byId(
            "btn-enviar-comprobante"
        );


    if (button) {

        button.disabled =
            true;

    }


    try {

        const receiptUrl =
            await uploadPaymentReceipt(
                file
            );


        const result =
            await marketFlashClient
                .from("payments")
                .insert({

                    user_id:
                        MARKET_FLASH_STATE.user.id,

                    product_id:
                        MARKET_FLASH_STATE.selectedProduct.id,

                    method:
                        method,

                    amount:
                        100,

                    receipt_url:
                        receiptUrl,

                    status:
                        "pending"

                });


        if (
            result.error
        ) {

            throw result.error;

        }


        const status =
            byId(
                "estado-pago"
            );


        if (status) {

            status.textContent =
                "Estado: comprobante enviado para revisión.";

        }


        byId(
            "comprobante-pago"
        ).value =
            "";


        byId(
            "preview-comprobante"
        ).innerHTML =
            "";


        showMessage(
            "Comprobante enviado correctamente.",
            "success"
        );


    } catch (error) {

        console.error(
            "Market Flash - pago:",
            error
        );


        showMessage(
            error.message ||
            "No se pudo enviar el comprobante.",
            "error"
        );

    } finally {

        if (button) {

            button.disabled =
                false;

        }

    }

}


/* =========================================================
   39. PROMOCIONES
   ========================================================= */

function setupPromotions() {

    all(
        "[data-promotion]"
    ).forEach(
        button => {

            button.addEventListener(
                "click",
                async () => {

                    if (
                        !MARKET_FLASH_STATE.user
                    ) {

                        showMessage(
                            "Inicia sesión para solicitar una promoción.",
                            "warning"
                        );


                        showSection(
                            "inicio-sesion"
                        );


                        return;

                    }


                    if (
                        !MARKET_FLASH_STATE.promotionsActive
                    ) {

                        showMessage(
                            "Las promociones están temporalmente desactivadas.",
                            "warning"
                        );


                        return;

                    }


                    try {

                        const result =
                            await marketFlashClient
                                .from("promotions")
                                .insert({

                                    user_id:
                                        MARKET_FLASH_STATE.user.id,

                                    promotion_type:
                                        button.dataset.promotion,

                                    status:
                                        "pending"

                                });


                        if (
                            result.error
                        ) {

                            throw result.error;

                        }


                        showMessage(
                            "Solicitud de promoción enviada.",
                            "success"
                        );


                        loadPromotions();

                    } catch (error) {

                        showMessage(
                            error.message,
                            "error"
                        );

                    }

                }
            );

        }
    );

}


async function loadPromotions() {

    const container =
        byId(
            "lista-promociones"
        );


    if (
        !container ||
        !MARKET_FLASH_STATE.user
    ) {

        return;

    }


    const result =
        await marketFlashClient
            .from("promotions")
            .select(
                "id,promotion_type,status,created_at"
            )
            .eq(
                "user_id",
                MARKET_FLASH_STATE.user.id
            )
            .order(
                "created_at",
                {
                    ascending:
                        false
                }
            );


    if (
        result.error
    ) {
        return;
    }


    container.innerHTML =
        "";


    if (
        !result.data?.length
    ) {

        renderEmpty(
            container,
            "No tienes promociones."
        );


        return;

    }


    result.data.forEach(
        item => {

            const element =
                document.createElement(
                    "div"
                );


            element.className =
                "promotion-list-item";


            element.textContent =
                `${item.promotion_type} — ${item.status}`;


            container.appendChild(
                element
            );

        }
    );

}


/* =========================================================
   40. VÍDEOS
   ========================================================= */

function setupVideos() {

    byId(
        "form-video"
    )?.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            if (
                !MARKET_FLASH_STATE.user
            ) {

                showMessage(
                    "Inicia sesión para publicar un vídeo.",
                    "warning"
                );


                showSection(
                    "inicio-sesion"
                );


                return;

            }


            const title =
                byId(
                    "video-titulo"
                )?.value.trim();


            const description =
                byId(
                    "video-descripcion"
                )?.value.trim();


            const file =
                byId(
                    "video-archivo"
                )?.files?.[0];


            if (
                !title ||
                !file
            ) {

                showMessage(
                    "Completa el título y selecciona un vídeo.",
                    "warning"
                );


                return;

            }


            try {

                const extension =
                    file.name
                        .split(".")
                        .pop()
                        .toLowerCase();


                const filename =
                    `${crypto.randomUUID()}.${extension}`;


                const path =
                    `${MARKET_FLASH_STATE.user.id}/${filename}`;


                const upload =
                    await marketFlashClient
                        .storage
                        .from(
                            "market-videos"
                        )
                        .upload(
                            path,
                            file,
                            {

                                cacheControl:
                                    "3600",

                                upsert:
                                    false,

                                contentType:
                                    file.type

                            }
                        );


                if (
                    upload.error
                ) {

                    throw upload.error;

                }


                const publicUrl =
                    marketFlashClient
                        .storage
                        .from(
                            "market-videos"
                        )
                        .getPublicUrl(
                            path
                        );


                const insert =
                    await marketFlashClient
                        .from("videos")
                        .insert({

                            user_id:
                                MARKET_FLASH_STATE.user.id,

                            title:
                                title,

                            description:
                                description,

                            video_url:
                                publicUrl.data?.publicUrl,

                            status:
                                "pending"

                        });


                if (
                    insert.error
                ) {

                    throw insert.error;

                }


                event.currentTarget.reset();


                showMessage(
                    "Vídeo enviado para revisión.",
                    "success"
                );

            } catch (error) {

                showMessage(
                    error.message,
                    "error"
                );

            }

        }
    );

}


/* =========================================================
   41. CALIFICACIONES
   ========================================================= */

function setupReviews() {

    byId(
        "form-calificacion"
    )?.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            if (
                !MARKET_FLASH_STATE.user ||
                !MARKET_FLASH_STATE.selectedProduct
            ) {

                showMessage(
                    "Inicia sesión y selecciona un producto.",
                    "warning"
                );


                return;

            }


            const rating =
                Number(
                    byId(
                        "calificacion-estrellas"
                    )?.value
                );


            const comment =
                byId(
                    "calificacion-comentario"
                )?.value.trim();


            if (
                rating < 1 ||
                rating > 5
            ) {

                showMessage(
                    "Selecciona una calificación válida.",
                    "warning"
                );


                return;

            }


            const result =
                await marketFlashClient
                    .from("reviews")
                    .insert({

                        reviewer_id:
                            MARKET_FLASH_STATE.user.id,

                        product_id:
                            MARKET_FLASH_STATE.selectedProduct.id,

                        seller_id:
                            MARKET_FLASH_STATE.selectedProduct.user_id,

                        rating:
                            rating,

                        comment:
                            comment ||
                            ""

                    });


            if (
                result.error
            ) {

                showMessage(
                    result.error.message,
                    "error"
                );


                return;

            }


            event.currentTarget.reset();


            showMessage(
                "Calificación enviada.",
                "success"
            );

        }
    );

}


/* =========================================================
   42. RECLAMOS
   ========================================================= */

function setupReports() {

    byId(
        "form-reclamo"
    )?.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            if (
                !MARKET_FLASH_STATE.user
            ) {

                showMessage(
                    "Inicia sesión para enviar un reclamo.",
                    "warning"
                );


                showSection(
                    "inicio-sesion"
                );


                return;

            }


            const reason =
                byId(
                    "reclamo-motivo"
                )?.value;


            const details =
                byId(
                    "reclamo-detalle"
                )?.value.trim();


            if (
                !reason ||
                !details
            ) {

                showMessage(
                    "Completa el motivo y los detalles.",
                    "warning"
                );


                return;

            }


            const result =
                await marketFlashClient
                    .from("reports")
                    .insert({

                        user_id:
                            MARKET_FLASH_STATE.user.id,

                        reason:
                            reason,

                        details:
                            details,

                        status:
                            "pending"

                    });


            if (
                result.error
            ) {

                showMessage(
                    result.error.message,
                    "error"
                );


                return;

            }


            event.currentTarget.reset();


            showMessage(
                "Reclamo enviado correctamente.",
                "success"
            );

        }
    );

}


/* =========================================================
   43. NOTIFICACIONES
   ========================================================= */

async function loadNotifications() {

    const container =
        byId(
            "lista-notificaciones"
        );


    if (
        !container ||
        !MARKET_FLASH_STATE.user
    ) {

        return;

    }


    const result =
        await marketFlashClient
            .from("notifications")
            .select(
                "id,title,message,read,created_at"
            )
            .eq(
                "user_id",
                MARKET_FLASH_STATE.user.id
            )
            .order(
                "created_at",
                {
                    ascending:
                        false
                }
            )
            .limit(
                50
            );


    if (
        result.error
    ) {
        return;
    }


    container.innerHTML =
        "";


    if (
        !result.data?.length
    ) {

        renderEmpty(
            container,
            "No tienes notificaciones."
        );


        return;

    }


    result.data.forEach(
        notification => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "notification-card";


            if (
                !notification.read
            ) {

                card.classList.add(
                    "unread"
                );

            }


            const title =
                document.createElement(
                    "h3"
                );


            title.textContent =
                notification.title;


            const text =
                document.createElement(
                    "p"
                );


            text.textContent =
                notification.message;


            const date =
                document.createElement(
                    "span"
                );


            date.className =
                "notification-time";


            date.textContent =
                formatDate(
                    notification.created_at
                );


            card.appendChild(
                title
            );

            card.appendChild(
                text
            );

            card.appendChild(
                date
            );


            container.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   44. ADMIN — ESTADÍSTICAS
   ========================================================= */

async function loadAdminDashboard() {

    if (
        !MARKET_FLASH_STATE.isAdmin
    ) {

        return;

    }


    await loadAdminStats();

    await loadAdminPayments();

    await loadAdminPendingProducts();

    await loadAdminActiveProducts();

    await loadAdminUsers();

    await loadAdminReports();

    await loadAdminSettings();

}


/* =========================================================
   45. ADMIN — STATS
   ========================================================= */

async function loadAdminStats() {

    const [
        users,
        pending,
        payments,
        approved
    ] =
        await Promise.all([

            marketFlashClient
                .from("profiles")
                .select(
                    "id",
                    {
                        count:
                            "exact",
                        head:
                            true
                    }
                ),

            marketFlashClient
                .from("products")
                .select(
                    "id",
                    {
                        count:
                            "exact",
                        head:
                            true
                    }
                )
                .eq(
                    "status",
                    "pending"
                ),

            marketFlashClient
                .from("payments")
                .select(
                    "id",
                    {
                        count:
                            "exact",
                        head:
                            true
                    }
                )
                .eq(
                    "status",
                    "pending"
                ),

            marketFlashClient
                .from("products")
                .select(
                    "id",
                    {
                        count:
                            "exact",
                        head:
                            true
                    }
                )
                .eq(
                    "status",
                    "approved"
                )

        ]);


    setText(
        "admin-total-usuarios",
        users.count ??
        0
    );


    setText(
        "admin-total-pendientes",
        pending.count ??
        0
    );


    setText(
        "admin-total-pagos",
        payments.count ??
        0
    );


    setText(
        "admin-total-activas",
        approved.count ??
        0
    );

}


/* =========================================================
   46. ADMIN — PAGOS
   ========================================================= */

async function loadAdminPayments() {

    const container =
        byId(
            "admin-comprobantes"
        );


    if (!container) {
        return;
    }


    const result =
        await marketFlashClient
            .from("payments")
            .select(
                "id,user_id,product_id,method,amount,receipt_url,status,created_at"
            )
            .eq(
                "status",
                "pending"
            )
            .order(
                "created_at",
                {
                    ascending:
                        false
                }
            );


    if (
        result.error
    ) {

        console.error(
            "Pagos admin:",
            result.error
        );


        return;

    }


    container.innerHTML =
        "";


    if (
        !result.data?.length
    ) {

        renderEmpty(
            container,
            "No hay comprobantes pendientes."
        );


        return;

    }


    result.data.forEach(
        payment => {

            const item =
                document.createElement(
                    "article"
                );


            item.className =
                "admin-item";


            const title =
                document.createElement(
                    "h4"
                );


            title.textContent =
                "Comprobante pendiente";


            const information =
                document.createElement(
                    "p"
                );


            information.textContent =
                `Método: ${
                    payment.method
                } — RD$ ${
                    formatPrice(
                        payment.amount
                    )
                }`;


            item.appendChild(
                title
            );

            item.appendChild(
                information
            );


            if (
                payment.receipt_url
            ) {

                const link =
                    document.createElement(
                        "a"
                    );


                link.href =
                    payment.receipt_url;


                link.target =
                    "_blank";


                link.rel =
                    "noopener";


                link.textContent =
                    "Ver comprobante";


                item.appendChild(
                    link
                );

            }


            const actions =
                document.createElement(
                    "div"
                );


            actions.className =
                "admin-item-actions";


            const approve =
                document.createElement(
                    "button"
                );


            approve.type =
                "button";


            approve.className =
                "primary-button";


            approve.textContent =
                "Aprobar";


            approve.addEventListener(
                "click",
                () =>
                    reviewPayment(
                        payment.id,
                        "approved"
                    )
            );


            const reject =
                document.createElement(
                    "button"
                );


            reject.type =
                "button";


            reject.className =
                "danger-button";


            reject.textContent =
                "Rechazar";


            reject.addEventListener(
                "click",
                () =>
                    reviewPayment(
                        payment.id,
                        "rejected"
                    )
            );


            actions.appendChild(
                approve
            );

            actions.appendChild(
                reject
            );


            item.appendChild(
                actions
            );


            container.appendChild(
                item
            );

        }
    );

}


/* =========================================================
   47. ADMIN — REVISAR PAGO
   ========================================================= */

async function reviewPayment(
    paymentId,
    status
) {

    const payment =
        await marketFlashClient
            .from("payments")
            .select(
                "id,user_id,product_id"
            )
            .eq(
                "id",
                paymentId
            )
            .single();


    if (
        payment.error
    ) {

        showMessage(
            payment.error.message,
            "error"
        );


        return;

    }


    const update =
        await marketFlashClient
            .from("payments")
            .update({

                status:
                    status,

                reviewed_at:
                    new Date().toISOString()

            })
            .eq(
                "id",
                paymentId
            );


    if (
        update.error
    ) {

        showMessage(
            update.error.message,
            "error"
        );


        return;

    }


    if (
        status ===
        "approved"
    ) {

        await marketFlashClient
            .from("products")
            .update({
                status:
                    "approved"
            })
            .eq(
                "id",
                payment.data.product_id
            );

    }


    await createNotification(
        payment.data.user_id,

        status === "approved"
            ? "Pago aprobado"
            : "Pago rechazado",

        status === "approved"
            ? "Tu comprobante fue aprobado."
            : "Tu comprobante fue rechazado."
    );


    showMessage(
        status === "approved"
            ? "Pago aprobado."
            : "Pago rechazado.",
        "success"
    );


    await loadProducts();

    await loadAdminDashboard();

}


/* =========================================================
   48. ADMIN — PRODUCTOS PENDIENTES
   ========================================================= */

async function loadAdminPendingProducts() {

    const container =
        byId(
            "admin-publicaciones-pendientes"
        );


    if (!container) {
        return;
    }


    const result =
        await marketFlashClient
            .from("products")
            .select(
                "id,user_id,nombre,categoria,precio,cantidad,descripcion,status,created_at"
            )
            .eq(
                "status",
                "pending"
            )
            .order(
                "created_at",
                {
                    ascending:
                        false
                }
            );


    if (
        result.error
    ) {
        return;
    }


    container.innerHTML =
        "";


    if (
        !result.data?.length
    ) {

        renderEmpty(
            container,
            "No hay publicaciones pendientes."
        );


        return;

    }


    result.data.forEach(
        product => {

            const item =
                document.createElement(
                    "article"
                );


            item.className =
                "admin-item";


            const title =
                document.createElement(
                    "h4"
                );


            title.textContent =
                product.nombre;


            const info =
                document.createElement(
                    "p"
                );


            info.textContent =
                `${product.categoria} — RD$ ${
                    formatPrice(
                        product.precio
                    )
                }`;


            const details =
                document.createElement(
                    "p"
                );


            details.textContent =
                product.descripcion ||
                "";


            const actions =
                document.createElement(
                    "div"
                );


            actions.className =
                "admin-item-actions";


            const approve =
                document.createElement(
                    "button"
                );


            approve.type =
                "button";


            approve.className =
                "primary-button";


            approve.textContent =
                "Aprobar";


            approve.addEventListener(
                "click",
                () =>
                    reviewProduct(
                        product.id,
                        "approved"
                    )
            );


            const reject =
                document.createElement(
                    "button"
                );


            reject.type =
                "button";


            reject.className =
                "danger-button";


            reject.textContent =
                "Rechazar";


            reject.addEventListener(
                "click",
                () =>
                    reviewProduct(
                        product.id,
                        "rejected"
                    )
            );


            actions.appendChild(
                approve
            );

            actions.appendChild(
                reject
            );


            item.appendChild(
                title
            );

            item.appendChild(
                info
            );

            item.appendChild(
                details
            );

            item.appendChild(
                actions
            );


            container.appendChild(
                item
            );

        }
    );

}


/* =========================================================
   49. ADMIN — REVISAR PRODUCTO
   ========================================================= */

async function reviewProduct(
    productId,
    status
) {

    const result =
        await marketFlashClient
            .from("products")
            .update({
                status:
                    status
            })
            .eq(
                "id",
                productId
            );


    if (
        result.error
    ) {

        showMessage(
            result.error.message,
            "error"
        );


        return;

    }


    showMessage(
        status === "approved"
            ? "Publicación aprobada."
            : "Publicación rechazada.",
        "success"
    );


    await loadProducts();

    await loadAdminDashboard();

}


/* =========================================================
   50. ADMIN — PUBLICACIONES ACTIVAS
   ========================================================= */

async function loadAdminActiveProducts() {

    const container =
        byId(
            "admin-publicaciones-activas"
        );


    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    const active =
        MARKET_FLASH_STATE.products
            .filter(
                product =>
                    product.status ===
                    "approved"
            );


    if (
        !active.length
    ) {

        renderEmpty(
            container,
            "No hay publicaciones activas."
        );


        return;

    }


    active.forEach(
        product => {

            container.appendChild(
                createProductCard(
                    product
                )
            );

        }
    );

}


/* =========================================================
   51. ADMIN — USUARIOS
   ========================================================= */

async function loadAdminUsers() {

    const container =
        byId(
            "admin-usuarios"
        );


    if (!container) {
        return;
    }


    const result =
        await marketFlashClient
            .from("profiles")
            .select(
                "id,full_name,documento,phone,whatsapp,messenger,role"
            )
            .order(
                "full_name",
                {
                    ascending:
                        true
                }
            );


    if (
        result.error
    ) {
        return;
    }


    container.innerHTML =
        "";


    if (
        !result.data?.length
    ) {

        renderEmpty(
            container,
            "No hay usuarios."
        );


        return;

    }


    result.data.forEach(
        user => {

            const item =
                document.createElement(
                    "article"
                );


            item.className =
                "admin-item";


            const name =
                document.createElement(
                    "h4"
                );


            name.textContent =
                user.full_name ||
                "Usuario";


            const phone =
                document.createElement(
                    "p"
                );


            phone.textContent =
                `Teléfono: ${
                    user.phone ||
                    "-"
                }`;


            const role =
                document.createElement(
                    "p"
                );


            role.textContent =
                `Rol: ${
                    user.role ||
                    "user"
                }`;


            item.appendChild(
                name
            );

            item.appendChild(
                phone
            );

            item.appendChild(
                role
            );


            container.appendChild(
                item
            );

        }
    );

}


/* =========================================================
   52. ADMIN — RECLAMOS
   ========================================================= */

async function loadAdminReports() {

    const container =
        byId(
            "admin-reclamos"
        );


    if (!container) {
        return;
    }


    const result =
        await marketFlashClient
            .from("reports")
            .select(
                "id,user_id,reason,details,status,created_at"
            )
            .order(
                "created_at",
                {
                    ascending:
                        false
                }
            );


    if (
        result.error
    ) {
        return;
    }


    container.innerHTML =
        "";


    if (
        !result.data?.length
    ) {

        renderEmpty(
            container,
            "No hay reclamos."
        );


        return;

    }


    result.data.forEach(
        report => {

            const item =
                document.createElement(
                    "article"
                );


            item.className =
                "admin-item";


            const title =
                document.createElement(
                    "h4"
                );


            title.textContent =
                report.reason;


            const details =
                document.createElement(
                    "p"
                );


            details.textContent =
                report.details;


            const status =
                document.createElement(
                    "p"
                );


            status.textContent =
                `Estado: ${
                    report.status
                }`;


            item.appendChild(
                title
            );

            item.appendChild(
                details
            );

            item.appendChild(
                status
            );


            container.appendChild(
                item
            );

        }
    );

}


/* =========================================================
   53. ADMIN — CONFIGURACIÓN
   ========================================================= */

async function loadAdminSettings() {

    const result =
        await marketFlashClient
            .from("settings")
            .select(
                "key,value"
            );


    if (
        result.error
    ) {
        return;
    }


    const settings =
        Object.fromEntries(
            (result.data || [])
                .map(
                    item => [
                        item.key,
                        item.value
                    ]
                )
        );


    MARKET_FLASH_STATE.publicationMode =
        settings.publications_mode ||
        "paid";


    MARKET_FLASH_STATE.promotionsActive =
        settings.promotions_active !==
        "false";


    setText(
        "admin-texto-publicaciones",
        MARKET_FLASH_STATE.publicationMode ===
        "paid"
            ? "Las publicaciones requieren pago."
            : "Las publicaciones son gratuitas."
    );


    setText(
        "admin-texto-promociones",
        MARKET_FLASH_STATE.promotionsActive
            ? "Las promociones están activas."
            : "Las promociones están desactivadas."
    );


    setText(
        "texto-estado-publicacion",
        MARKET_FLASH_STATE.publicationMode ===
        "paid"
            ? "La publicación requiere un pago y comprobante."
            : "La publicación es gratuita y queda pendiente de revisión."
    );


    const binance =
        byId(
            "direccion-binance"
        );


    const paypal =
        byId(
            "cuenta-paypal"
        );


    if (binance) {

        binance.textContent =
            APP_BINANCE_ADDRESS ||
            "Pendiente de configuración";

    }


    if (paypal) {

        paypal.textContent =
            APP_PAYPAL_ACCOUNT ||
            "Pendiente de configuración";

    }

}


/* =========================================================
   54. ADMIN — CAMBIAR PUBLICACIONES
   ========================================================= */

async function togglePublicationMode() {

    if (
        !MARKET_FLASH_STATE.isAdmin
    ) {
        return;
    }


    const next =
        MARKET_FLASH_STATE.publicationMode ===
        "paid"
            ? "free"
            : "paid";


    const result =
        await marketFlashClient
            .from("settings")
            .upsert({

                key:
                    "publications_mode",

                value:
                    next

            });


    if (
        result.error
    ) {

        showMessage(
            result.error.message,
            "error"
        );


        return;

    }


    MARKET_FLASH_STATE.publicationMode =
        next;


    await loadAdminSettings();


    showMessage(
        next === "paid"
            ? "Publicaciones de pago activadas."
            : "Publicaciones gratuitas activadas.",
        "success"
    );

}


/* =========================================================
   55. ADMIN — CAMBIAR PROMOCIONES
   ========================================================= */

async function togglePromotions() {

    if (
        !MARKET_FLASH_STATE.isAdmin
    ) {
        return;
    }


    const next =
        !MARKET_FLASH_STATE.promotionsActive;


    const result =
        await marketFlashClient
            .from("settings")
            .upsert({

                key:
                    "promotions_active",

                value:
                    String(next)

            });


    if (
        result.error
    ) {

        showMessage(
            result.error.message,
            "error"
        );


        return;

    }


    MARKET_FLASH_STATE.promotionsActive =
        next;


    await loadAdminSettings();


    showMessage(
        next
            ? "Promociones activadas."
            : "Promociones desactivadas.",
        "success"
    );

}


/* =========================================================
   56. CREAR NOTIFICACIÓN
   ========================================================= */

async function createNotification(
    userId,
    title,
    text
) {

    if (
        !userId
    ) {
        return;
    }


    const result =
        await marketFlashClient
            .from("notifications")
            .insert({

                user_id:
                    userId,

                title:
                    title,

                message:
                    text,

                read:
                    false

            });


    if (
        result.error
    ) {

        console.error(
            "Notificación:",
            result.error
        );

    }

}


/* =========================================================
   57. BOTONES DE ADMIN
   ========================================================= */

function setupAdminButtons() {

    byId(
        "admin-toggle-publicaciones"
    )?.addEventListener(
        "click",
        togglePublicationMode
    );


    byId(
        "admin-toggle-promociones"
    )?.addEventListener(
        "click",
        togglePromotions
    );

}


/* =========================================================
   58. CONTACTO Y SOPORTE
   ========================================================= */

function setupSupport() {

    byId(
        "soporte-ayuda"
    )?.addEventListener(
        "click",
        () => {

            showMessage(
                "Desde Market Flash puedes comprar, vender, publicar y contactar con otros usuarios.",
                "info"
            );

        }
    );


    byId(
        "soporte-whatsapp"
    )?.addEventListener(
        "click",
        () => {

            showSupportWhatsApp();

        }
    );


    byId(
        "soporte-messenger"
    )?.addEventListener(
        "click",
        () => {

            showSupportMessenger();

        }
    );


    byId(
        "footer-whatsapp"
    )?.addEventListener(
        "click",
        () => {

            showSupportWhatsApp();

        }
    );


    byId(
        "footer-messenger"
    )?.addEventListener(
        "click",
        () => {

            showSupportMessenger();

        }
    );

}


function showSupportWhatsApp() {

    if (
        !MARKET_FLASH_STATE.user
    ) {

        showMessage(
            "Puedes ver la plataforma sin cuenta, pero necesitas iniciar sesión para contactar con soporte.",
            "warning"
        );


        return;

    }


    if (
        !MARKET_FLASH_STATE.profile?.whatsapp
    ) {

        showMessage(
            "El WhatsApp de soporte todavía no está configurado.",
            "warning"
        );


        return;

    }


    const number =
        MARKET_FLASH_STATE.profile.whatsapp
            .replace(
                /\D/g,
                ""
            );


    window.open(
        `https://wa.me/${number}`,
        "_blank",
        "noopener"
    );

}


function showSupportMessenger() {

    showMessage(
        "El Messenger de soporte todavía está pendiente de configuración.",
        "warning"
    );

}


/* =========================================================
   59. CONTACTAR AL VENDEDOR
   ========================================================= */

function setupSellerContact() {

    byId(
        "btn-contactar-whatsapp"
    )?.addEventListener(
        "click",
        () => {

            contactSeller(
                "WhatsApp"
            );

        }
    );


    byId(
        "btn-contactar-messenger"
    )?.addEventListener(
        "click",
        () => {

            contactSeller(
                "Messenger"
            );

        }
    );

}


async function contactSeller(
    type
) {

    if (
        !MARKET_FLASH_STATE.user
    ) {

        showMessage(
            "Para contactar al vendedor necesitas una cuenta.",
            "warning"
        );


        showSection(
            "inicio-sesion"
        );


        return;

    }


    if (
        !MARKET_FLASH_STATE.selectedProduct
    ) {

        showMessage(
            "Selecciona primero un producto.",
            "warning"
        );


        return;

    }


    const sellerId =
        MARKET_FLASH_STATE.selectedProduct.user_id;


    const result =
        await marketFlashClient
            .from("profiles")
            .select(
                "full_name,whatsapp,messenger"
            )
            .eq(
                "id",
                sellerId
            )
            .maybeSingle();


    if (
        result.error
    ) {

        showMessage(
            result.error.message,
            "error"
        );


        return;

    }


    const seller =
        result.data;


    if (
        type ===
        "WhatsApp"
    ) {

        if (
            !seller?.whatsapp
        ) {

            showMessage(
                "El vendedor todavía no tiene WhatsApp configurado.",
                "warning"
            );


            return;

        }


        const number =
            seller.whatsapp.replace(
                /\D/g,
                ""
            );


        window.open(
            `https://wa.me/${number}`,
            "_blank",
            "noopener"
        );


        return;

    }


    if (
        type ===
        "Messenger"
    ) {

        if (
            !seller?.messenger
        ) {

            showMessage(
                "El vendedor todavía no tiene Messenger configurado.",
                "warning"
            );


            return;

        }


        const username =
            seller.messenger;


        const url =
            username.startsWith(
                "http"
            )
                ? username
                : `https://m.me/${username}`;


        window.open(
            url,
            "_blank",
            "noopener"
        );

    }

}


/* =========================================================
   60. UTILIDADES UI
   ========================================================= */

function setText(
    id,
    value
) {

    const element =
        byId(id);


    if (element) {

        element.textContent =
            String(value);

    }

}


function renderEmpty(
    container,
    text
) {

    container.innerHTML =
        "";


    const empty =
        document.createElement(
            "div"
        );


    empty.className =
        "empty-state";


    empty.textContent =
        text;


    container.appendChild(
        empty
    );

}


function formatDate(
    value
) {

    if (!value) {
        return "";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    return date.toLocaleString(
        "es-DO",
        {
            dateStyle:
                "medium",

            timeStyle:
                "short"
        }
    );

}


/* =========================================================
   61. INICIAR TODO
   ========================================================= */

async function initializeMarketFlash() {

    console.log(
        "Market Flash: iniciando aplicación..."
    );


    if (
        !marketFlashClient
    ) {

        console.error(
            "Market Flash: Supabase no está disponible."
        );


        return;

    }


    setupNavigation();

    setupHeaderButtons();

    setupAuthentication();

    setupCategories();

    setupHome();

    setupImagePreview();

    setupProductForm();

    setupPayment();

    setupPromotions();

    setupVideos();

    setupReviews();

    setupReports();

    setupSellerContact();

    setupAdminButtons();

    setupSupport();

    setupAuthListener();


    await restoreSession();


    await loadProducts();


    await loadAdminSettings();


    if (
        MARKET_FLASH_STATE.user
    ) {

        await loadFavorites();

        await loadPromotions();

        await loadNotifications();

        renderMyProducts();

        renderSoldProducts();

    }


    updateInterface();


    showSection(
        "inicio"
    );


    console.log(
        "Market Flash: aplicación lista."
    );

}


/* =========================================================
   62. ARRANQUE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeMarketFlash();

    }
);
