/* =========================================================
   MARKET FLASH
   SCRIPT.JS COMPLETO
   SUPABASE + AUTENTICACIÓN + MARKETPLACE
   ========================================================= */

"use strict";

/* =========================================================
   CONFIGURACIÓN SUPABASE
   ========================================================= */

const SUPABASE_URL =
    "https://osxuhmgnpgbxfopqdhqr.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_6qLmRFGHrwGq_CKqsIH7jA_Oz8TTlQZ";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY,
        {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true
            },
            db: {
                schema: "public"
            }
        }
    );


/* =========================================================
   CONFIGURACIÓN DE LA APLICACIÓN
   ========================================================= */

const CONFIG = {

    whatsapp:
        "",

    messenger:
        "",

    facebook:
        "",

    paypal:
        "",

    binance:
        "",

    publicacionesDePago:
        true,

    promocionesActivas:
        true

};


/* =========================================================
   ESTADO GLOBAL
   ========================================================= */

const state = {

    session:
        null,

    user:
        null,

    profile:
        null,

    products:
        [],

    favorites:
        [],

    notifications:
        [],

    promotions:
        [],

    complaints:
        [],

    ratings:
        [],

    payments:
        [],

    currentProduct:
        null,

    currentCategory:
        "Todos",

    currentPage:
        "inicio"

};


/* =========================================================
   SELECTORES
   ========================================================= */

const $ = (selector) =>
    document.querySelector(selector);

const $$ = (selector) =>
    document.querySelectorAll(selector);


/* =========================================================
   MENSAJES
   ========================================================= */

function showMessage(
    message,
    type = "info"
) {

    const box =
        $("#app-message");

    if (!box) {
        alert(message);
        return;
    }

    box.textContent =
        message;

    box.className =
        "app-message show";

    if (
        type === "success" ||
        type === "error" ||
        type === "warning"
    ) {
        box.classList.add(type);
    }

    clearTimeout(
        box._timer
    );

    box._timer =
        setTimeout(() => {

            box.className =
                "app-message";

        }, 4000);

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =========================================================
   FECHA
   ========================================================= */

function formatDate(date) {

    if (!date) {
        return "";
    }

    try {

        return new Intl.DateTimeFormat(
            "es-DO",
            {
                dateStyle: "medium",
                timeStyle: "short"
            }
        ).format(
            new Date(date)
        );

    } catch {
        return "";
    }

}


/* =========================================================
   NAVEGACIÓN
   ========================================================= */

const SECTION_NAMES = [

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


function hideAllSections() {

    SECTION_NAMES.forEach(
        (name) => {

            const section =
                document.getElementById(
                    name
                );

            if (section) {

                section.classList.remove(
                    "active"
                );

                section.style.display =
                    "none";

            }

        }
    );

}


function showSection(
    sectionName
) {

    hideAllSections();

    const section =
        document.getElementById(
            sectionName
        );

    if (!section) {
        return;
    }

    section.classList.add(
        "active"
    );

    section.style.display =
        "block";

    state.currentPage =
        sectionName;


    $$(".main-nav button").forEach(
        (button) => {

            button.classList.toggle(
                "active",
                button.dataset.section ===
                sectionName
            );

        }
    );


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


function setupNavigation() {

    $$("[data-section]").forEach(
        (button) => {

            button.addEventListener(
                "click",
                () => {

                    const section =
                        button.dataset.section;

                    if (!section) {
                        return;
                    }

                    if (
                        section === "publicar"
                    ) {

                        if (!state.user) {

                            showMessage(
                                "Debes iniciar sesión para publicar.",
                                "warning"
                            );

                            showSection(
                                "inicio-sesion"
                            );

                            return;
                        }

                    }

                    showSection(
                        section
                    );

                }
            );

        }
    );

}


/* =========================================================
   AUTENTICACIÓN
   ========================================================= */

async function loadSession() {

    const result =
        await supabaseClient.auth.getSession();

    if (result.error) {

        console.error(
            "Error obteniendo sesión:",
            result.error
        );

        return;
    }

    state.session =
        result.data.session;

    state.user =
        result.data.session?.user || null;

}


async function loadProfile() {

    if (!state.user) {

        state.profile =
            null;

        return;
    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from("profiles")
            .select("*")
            .eq(
                "id",
                state.user.id
            )
            .maybeSingle();


    if (error) {

        console.warn(
            "No se pudo cargar profiles:",
            error.message
        );

        state.profile =
            null;

        return;
    }


    state.profile =
        data;

}


async function registerUser(
    event
) {

    event.preventDefault();

    const form =
        event.currentTarget;

    const name =
        $("#registro-nombre")?.value.trim();

    const email =
        $("#registro-correo")?.value.trim();

    const documentNumber =
        $("#registro-documento")?.value.trim();

    const phone =
        $("#registro-telefono")?.value.trim();

    const whatsapp =
        $("#registro-whatsapp")?.value.trim();

    const messenger =
        $("#registro-messenger")?.value.trim();

    const password =
        $("#registro-password")?.value;


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


    if (password.length < 6) {

        showMessage(
            "La contraseña debe tener al menos 6 caracteres.",
            "warning"
        );

        return;
    }


    showMessage(
        "Creando tu cuenta..."
    );


    const {
        data,
        error
    } =
        await supabaseClient.auth.signUp({

            email,
            password,

            options: {
                data: {

                    full_name:
                        name,

                    document_number:
                        documentNumber,

                    phone,

                    whatsapp,

                    messenger

                }
            }

        });


    if (error) {

        console.error(
            error
        );

        showMessage(
            error.message,
            "error"
        );

        return;
    }


    if (
        data.user
    ) {

        showMessage(
            "Cuenta creada correctamente.",
            "success"
        );

        form.reset();

        showSection(
            "inicio-sesion"
        );

    }

}


async function loginUser(
    event
) {

    event.preventDefault();


    const email =
        $("#login-correo")?.value.trim();

    const password =
        $("#login-password")?.value;


    if (!email || !password) {

        showMessage(
            "Escribe tu correo y contraseña.",
            "warning"
        );

        return;
    }


    showMessage(
        "Iniciando sesión..."
    );


    const {
        data,
        error
    } =
        await supabaseClient.auth.signInWithPassword({

            email,
            password

        });


    if (error) {

        console.error(
            error
        );

        showMessage(
            error.message,
            "error"
        );

        return;
    }


    state.session =
        data.session;

    state.user =
        data.user;


    await loadProfile();

    await refreshApplication();


    showMessage(
        "Sesión iniciada correctamente.",
        "success"
    );


    const form =
        event.currentTarget;

    form.reset();

    showSection(
        "inicio"
    );

}


async function logoutUser() {

    const {
        error
    } =
        await supabaseClient.auth.signOut();


    if (error) {

        showMessage(
            error.message,
            "error"
        );

        return;
    }


    state.session =
        null;

    state.user =
        null;

    state.profile =
        null;

    state.products =
        [];

    state.favorites =
        [];

    updateInterface();


    showMessage(
        "Has cerrado sesión.",
        "success"
    );

    showSection(
        "inicio"
    );

}


async function resetPassword() {

    const email =
        prompt(
            "Escribe el correo de tu cuenta:"
        );


    if (!email) {
        return;
    }


    const {
        error
    } =
        await supabaseClient.auth
            .resetPasswordForEmail(
                email,
                {
                    redirectTo:
                        window.location.href
                }
            );


    if (error) {

        showMessage(
            error.message,
            "error"
        );

        return;
    }


    showMessage(
        "Te hemos enviado las instrucciones para recuperar tu contraseña.",
        "success"
    );

}


/* =========================================================
   PERFIL
   ========================================================= */

function renderProfile() {

    const profile =
        state.profile;


    if (!profile && !state.user) {

        if ($("#perfil-nombre")) {
            $("#perfil-nombre").textContent =
                "Usuario";
        }

        if ($("#perfil-correo")) {
            $("#perfil-correo").textContent =
                "-";
        }

        return;
    }


    const metadata =
        state.user?.user_metadata || {};


    const name =
        profile?.full_name ||
        metadata.full_name ||
        "Usuario";


    const email =
        state.user?.email ||
        profile?.email ||
        "-";


    const phone =
        profile?.phone ||
        metadata.phone ||
        "-";


    const whatsapp =
        profile?.whatsapp ||
        metadata.whatsapp ||
        "-";


    const messenger =
        profile?.messenger ||
        metadata.messenger ||
        "-";


    const documentNumber =
        profile?.document_number ||
        metadata.document_number ||
        "-";


    if ($("#perfil-nombre")) {

        $("#perfil-nombre").textContent =
            name;

    }


    if ($("#perfil-correo")) {

        $("#perfil-correo").textContent =
            email;

    }


    if ($("#perfil-telefono")) {

        $("#perfil-telefono").textContent =
            phone;

    }


    if ($("#perfil-whatsapp")) {

        $("#perfil-whatsapp").textContent =
            whatsapp;

    }


    if ($("#perfil-messenger")) {

        $("#perfil-messenger").textContent =
            messenger;

    }


    if ($("#perfil-documento")) {

        $("#perfil-documento").textContent =
            documentNumber;

    }

}


async function editProfile() {

    if (!state.user) {

        showMessage(
            "Debes iniciar sesión.",
            "warning"
        );

        return;
    }


    const currentName =
        state.profile?.full_name ||
        state.user.user_metadata?.full_name ||
        "";


    const currentPhone =
        state.profile?.phone ||
        "";


    const currentWhatsapp =
        state.profile?.whatsapp ||
        "";


    const currentMessenger =
        state.profile?.messenger ||
        "";


    const fullName =
        prompt(
            "Nombre completo:",
            currentName
        );


    if (fullName === null) {
        return;
    }


    const phone =
        prompt(
            "Teléfono:",
            currentPhone
        );


    if (phone === null) {
        return;
    }


    const whatsapp =
        prompt(
            "WhatsApp:",
            currentWhatsapp
        );


    if (whatsapp === null) {
        return;
    }


    const messenger =
        prompt(
            "Messenger:",
            currentMessenger
        );


    if (messenger === null) {
        return;
    }


    const metadata =
        {
            ...(state.user.user_metadata || {}),
            full_name:
                fullName.trim(),
            phone:
                phone.trim(),
            whatsapp:
                whatsapp.trim(),
            messenger:
                messenger.trim()
        };


    const {
        error:
        authError
    } =
        await supabaseClient.auth.updateUser({
            data:
                metadata
        });


    if (authError) {

        showMessage(
            authError.message,
            "error"
        );

        return;
    }


    const {
        error:
        profileError
    } =
        await supabaseClient
            .from("profiles")
            .upsert(
                {
                    id:
                        state.user.id,

                    full_name:
                        fullName.trim(),

                    email:
                        state.user.email,

                    phone:
                        phone.trim(),

                    whatsapp:
                        whatsapp.trim(),

                    messenger:
                        messenger.trim()
                },
                {
                    onConflict:
                        "id"
                }
            );


    if (profileError) {

        console.warn(
            profileError
        );

    }


    await loadProfile();

    renderProfile();


    showMessage(
        "Perfil actualizado.",
        "success"
    );

}


/* =========================================================
   PUBLICACIONES
   ========================================================= */

async function loadProducts() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("products")
            .select("*")
            .eq(
                "status",
                "approved"
            )
            .order(
                "created_at",
                {
                    ascending:
                        false
                }
            );


    if (error) {

        console.warn(
            "No se pudieron cargar products:",
            error.message
        );

        state.products =
            [];

        renderProducts();

        return;
    }


    state.products =
        data || [];


    renderProducts();

}


function getProductImages(
    product
) {

    if (
        Array.isArray(
            product.images
        )
    ) {

        return product.images;
    }


    if (
        typeof product.images ===
        "string"
    ) {

        try {

            const parsed =
                JSON.parse(
                    product.images
                );

            if (
                Array.isArray(parsed)
            ) {
                return parsed;
            }

        } catch {
            return [];
        }

    }


    if (
        product.image_url
    ) {

        return [
            product.image_url
        ];

    }


    return [];

}


function renderProducts(
    customProducts =
        state.products
) {

    const container =
        $("#lista-productos");

    const empty =
        $("#sin-productos");


    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    if (
        !customProducts ||
        !customProducts.length
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


    customProducts.forEach(
        (product) => {

            const card =
                createProductCard(
                    product
                );

            container.appendChild(
                card
            );

        }
    );

}


function createProductCard(
    product
) {

    const article =
        document.createElement(
            "article"
        );


    article.className =
        "product-card";


    const images =
        getProductImages(
            product
        );


    const imageHtml =
        images.length
            ? `
                <img
                    src="${escapeHtml(images[0])}"
                    alt="${escapeHtml(
                        product.name ||
                        "Producto"
                    )}"
                    loading="lazy"
                >
              `
            : `
                <div class="product-image-placeholder">
                    Sin imagen
                </div>
              `;


    const category =
        product.category ||
        "Otros";


    const
