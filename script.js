/* =========================================================
   MARKET FLASH
   SCRIPT.JS — PARTE 1/3
   Supabase + autenticación + utilidades + navegación
   ========================================================= */

"use strict";

/* =========================================================
   1. SUPABASE
   ========================================================= */

const SUPABASE_URL =
    window.MARKET_FLASH_SUPABASE_URL ||
    "https://osxuhmgnpgbxfopqdhqr.supabase.co";

const SUPABASE_KEY =
    window.MARKET_FLASH_SUPABASE_KEY ||
    "sb_publishable_6qLmRFGHrwGq_CKqsIH7jA_Oz8TTlQZ";

let mfSupabase = null;

function initializeSupabase() {
    try {
        if (!window.supabase) {
            console.error("Supabase JS no está cargado.");
            showToast("No se pudo cargar Supabase.", "error");
            return false;
        }

        mfSupabase = window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_KEY
        );

        return true;
    } catch (error) {
        console.error("Error iniciando Supabase:", error);
        showToast("Error al conectar con la base de datos.", "error");
        return false;
    }
}

/* =========================================================
   2. ESTADO GLOBAL
   ========================================================= */

const MF = {
    user: null,
    profile: null,

    publications: [],
    currentPublication: null,

    publicationImages: [],
    publicationVideo: null,

    selectedTariff: null,
    selectedPaymentMethod: null,
    currentPaymentRequest: null,

    conversations: [],
    currentConversation: null,
    messageSubscription: null,

    isAdmin: false,
    adminProfile: null,

    tariffs: [],
    paymentMethods: [],

    notifications: []
};

/* =========================================================
   3. UTILIDADES
   ========================================================= */

function $(id) {
    return document.getElementById(id);
}

function exists(id) {
    return !!$(id);
}

function safeText(value) {
    return value == null ? "" : String(value);
}

function escapeHTML(value) {
    return safeText(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatMoney(value) {
    const number = Number(value || 0);

    return new Intl.NumberFormat("es-DO", {
        style: "currency",
        currency: "DOP",
        minimumFractionDigits: 2
    }).format(number);
}

function formatNumber(value) {
    return new Intl.NumberFormat("es-DO").format(
        Number(value || 0)
    );
}

function formatDateTime(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return new Intl.DateTimeFormat("es-DO", {
        dateStyle: "medium",
        timeStyle: "short"
    }).format(date);
}

function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return new Intl.DateTimeFormat("es-DO", {
        dateStyle: "medium"
    }).format(date);
}

function normalizePhone(phone) {
    return safeText(phone)
        .replace(/[^\d+]/g, "")
        .replace(/^00/, "+");
}

function safeFileName(name) {
    return safeText(name)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9._-]/g, "_");
}

function generateId() {
    if (window.crypto && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return (
        Date.now().toString(36) +
        Math.random().toString(36).substring(2)
    );
}

function isImageFile(file) {
    return file && file.type && file.type.startsWith("image/");
}

function isVideoFile(file) {
    return file && file.type && file.type.startsWith("video/");
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/* =========================================================
   4. TOAST
   ========================================================= */

function showToast(message, type = "info") {
    const toast = $("toast");

    if (!toast) {
        console.log(`[${type}]`, message);
        return;
    }

    toast.textContent = message;
    toast.className = `toast toast-${type}`;
    toast.classList.add("show");

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
        toast.classList.remove("show");
    }, 3500);
}

/* =========================================================
   5. LOADING
   ========================================================= */

function showLoading(show = true, message = "Cargando...") {
    const overlay = $("loading-overlay");

    if (!overlay) return;

    const text =
        overlay.querySelector(".loading-text") ||
        overlay.querySelector("p");

    if (text) {
        text.textContent = message;
    }

    overlay.classList.toggle("hidden", !show);
    overlay.classList.toggle("active", show);
}

/* =========================================================
   6. PANELES
   ========================================================= */

function openPanel(id) {
    const panel = $(id);

    if (!panel) return;

    panel.classList.remove("hidden");
    panel.classList.add("active");

    document.body.classList.add("panel-open");
}

function closePanel(id) {
    const panel = $(id);

    if (!panel) return;

    panel.classList.remove("active");
    panel.classList.add("hidden");

    if (!document.querySelector(".panel.active")) {
        document.body.classList.remove("panel-open");
    }
}

function closeAllPanels() {
    document.querySelectorAll(".panel").forEach(panel => {
        panel.classList.remove("active");
        panel.classList.add("hidden");
    });

    document.body.classList.remove("panel-open");
}

/* =========================================================
   7. PANTALLAS
   ========================================================= */

function showScreen(id) {
    document.querySelectorAll(".screen").forEach(screen => {
        screen.classList.remove("active");
        screen.classList.add("hidden");
    });

    const screen = $(id);

    if (screen) {
        screen.classList.remove("hidden");
        screen.classList.add("active");
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

/* =========================================================
   8. WHATSAPP
   ========================================================= */

function openWhatsApp(phone, text = "") {
    let number = normalizePhone(phone);

    if (!number) {
        showToast("El vendedor no tiene WhatsApp registrado.", "error");
        return;
    }

    number = number.replace(/\D/g, "");

    if (number.length === 10) {
        number = "1" + number;
    }

    const url =
        "https://wa.me/" +
        number +
        "?text=" +
        encodeURIComponent(text);

    window.open(url, "_blank", "noopener,noreferrer");
}

/* =========================================================
   9. STORAGE
   ========================================================= */

function getPublicStorageUrl(bucket, path) {
    if (!mfSupabase || !path) return "";

    const result = mfSupabase.storage
        .from(bucket)
        .getPublicUrl(path);

    return result?.data?.publicUrl || "";
}

async function getSignedStorageUrl(bucket, path) {
    if (!mfSupabase || !path) return "";

    try {
        const { data, error } = await mfSupabase.storage
            .from(bucket)
            .createSignedUrl(path, 3600);

        if (error) {
            console.error(error);
            return "";
        }

        return data?.signedUrl || "";
    } catch (error) {
        console.error(error);
        return "";
    }
}

/* =========================================================
   10. SESIÓN
   ========================================================= */

async function getCurrentSession() {
    if (!mfSupabase) return null;

    const { data, error } =
        await mfSupabase.auth.getSession();

    if (error) {
        console.error("Error obteniendo sesión:", error);
        return null;
    }

    return data?.session || null;
}

async function getCurrentUser() {
    if (!mfSupabase) return null;

    const { data, error } =
        await mfSupabase.auth.getUser();

    if (error) {
        return null;
    }

    return data?.user || null;
}

/* =========================================================
   11. PERFIL
   ========================================================= */

async function loadProfile(userId = null) {
    if (!mfSupabase) return null;

    const id =
        userId ||
        MF.user?.id;

    if (!id) return null;

    const { data, error } = await mfSupabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    if (error) {
        console.error("Error cargando perfil:", error);
        return null;
    }

    MF.profile = data || null;

    return MF.profile;
}

async function createProfileIfMissing(user) {
    if (!user || !mfSupabase) return null;

    const existing = await loadProfile(user.id);

    if (existing) {
        return existing;
    }

    const metadata = user.user_metadata || {};

    const profile = {
        id: user.id,
        full_name: metadata.full_name || "Usuario Market Flash",
        cedula: metadata.cedula || "",
        phone: metadata.phone || "",
        avatar_url: null,
        role: "user",
        is_admin: false,
        status: "active"
    };

    const { data, error } = await mfSupabase
        .from("profiles")
        .insert(profile)
        .select()
        .single();

    if (error) {
        console.error("Error creando perfil:", error);
        return null;
    }

    MF.profile = data;

    return data;
}

/* =========================================================
   12. ÚLTIMA CONEXIÓN
   ========================================================= */

async function updateLastSeen() {
    if (!MF.user || !mfSupabase) return;

    try {
        await mfSupabase
            .from("profiles")
            .update({
                last_seen_at: new Date().toISOString()
            })
            .eq("id", MF.user.id);
    } catch (error) {
        console.warn("No se pudo actualizar last_seen_at.", error);
    }
}

/* =========================================================
   13. COMPROBAR ADMIN
   ========================================================= */

async function checkAdmin() {
    MF.isAdmin = false;

    if (!MF.profile) {
        return false;
    }

    MF.isAdmin =
        MF.profile.role === "admin" ||
        MF.profile.is_admin === true;

    return MF.isAdmin;
}

/* =========================================================
   14. REGISTRO
   ========================================================= */

async function handleRegister(event) {
    event.preventDefault();

    if (!mfSupabase) {
        showToast("Supabase no está conectado.", "error");
        return;
    }

    const name =
        $("register-name")?.value.trim() || "";

    const cedula =
        $("register-cedula")?.value.trim() || "";

    const phone =
        $("register-phone")?.value.trim() || "";

    const password =
        $("register-password")?.value || "";

    const confirmPassword =
        $("register-password-confirm")?.value || "";

    if (!name || !cedula || !phone || !password) {
        showToast(
            "Completa todos los campos obligatorios.",
            "error"
        );
        return;
    }

    if (password.length < 6) {
        showToast(
            "La contraseña debe tener al menos 6 caracteres.",
            "error"
        );
        return;
    }

    if (password !== confirmPassword) {
        showToast(
            "Las contraseñas no coinciden.",
            "error"
        );
        return;
    }

    showLoading(true, "Creando tu cuenta...");

    try {
        /*
         * El sistema utiliza una dirección interna basada
         * en la cédula para poder usar cédula + contraseña.
         *
         * El correo real NO se muestra al usuario.
         */
        const internalEmail =
            `${cedula.replace(/\D/g, "")}@marketflash.local`;

        const { data, error } =
            await mfSupabase.auth.signUp({
                email: internalEmail,
                password,
                options: {
                    data: {
                        full_name: name,
                        cedula,
                        phone
                    }
                }
            });

        if (error) {
            console.error(error);

            if (
                error.message?.toLowerCase().includes("already")
            ) {
                showToast(
                    "Esta cédula ya está registrada.",
                    "error"
                );
            } else {
                showToast(
                    error.message || "No se pudo crear la cuenta.",
                    "error"
                );
            }

            return;
        }

        /*
         * Si Supabase entrega sesión inmediatamente,
         * creamos/cargamos el perfil.
         */
        if (data?.user) {
            MF.user = data.user;

            await createProfileIfMissing(data.user);

            showToast(
                "Cuenta creada correctamente.",
                "success"
            );

            await sleep(500);

            await enterApplication();
            return;
        }

        /*
         * Si no hay sesión significa normalmente que está
         * activada la confirmación de correo en Supabase.
         *
         * Como el usuario no recibe ese correo interno,
         * se informa claramente.
         */
        showToast(
            "La cuenta fue creada, pero Supabase exige confirmación de correo. Desactiva la confirmación de email en Auth para este sistema.",
            "error"
        );

    } catch (error) {
        console.error(error);

        showToast(
            "Ocurrió un error durante el registro.",
            "error"
        );
    } finally {
        showLoading(false);
    }
}

/* =========================================================
   15. LOGIN
   ========================================================= */

async function handleLogin(event) {
    event.preventDefault();

    if (!mfSupabase) {
        showToast("Supabase no está conectado.", "error");
        return;
    }

    const cedula =
        $("login-cedula")?.value.trim() || "";

    const password =
        $("login-password")?.value || "";

    if (!cedula || !password) {
        showToast(
            "Introduce tu cédula y contraseña.",
            "error"
        );
        return;
    }

    showLoading(true, "Iniciando sesión...");

    try {
        const internalEmail =
            `${cedula.replace(/\D/g, "")}@marketflash.local`;

        const { data, error } =
            await mfSupabase.auth.signInWithPassword({
                email: internalEmail,
                password
            });

        if (error) {
            console.error(error);

            showToast(
                "Cédula o contraseña incorrecta.",
                "error"
            );

            return;
        }

        MF.user = data.user;

        const profile =
            await loadProfile(data.user.id);

        if (!profile) {
            await createProfileIfMissing(data.user);
        }

        if (
            MF.profile?.status === "blocked" ||
            MF.profile?.status === "suspended" ||
            MF.profile?.status === "deleted"
        ) {
            await mfSupabase.auth.signOut();

            showToast(
                "Esta cuenta no puede iniciar sesión actualmente.",
                "error"
            );

            return;
        }

        await updateLastSeen();

        await enterApplication();

    } catch (error) {
        console.error(error);

        showToast(
            "No se pudo iniciar sesión.",
            "error"
        );
    } finally {
        showLoading(false);
    }
}

/* =========================================================
   16. ENTRAR A LA APLICACIÓN
   ========================================================= */

async function enterApplication() {
    closeAllPanels();

    await checkAdmin();

    showScreen("dashboard-screen");

    await updateProfileUI();
    await loadDashboardData();

    if (MF.isAdmin) {
        showAdminButton();
    } else {
        hideAdminButton();
    }
}

/* =========================================================
   17. UI DEL PERFIL
   ========================================================= */

async function updateProfileUI() {
    const profile = MF.profile;

    if (!profile) return;

    if ($("profile-name")) {
        $("profile-name").textContent =
            profile.full_name || "Usuario";
    }

    if ($("profile-phone")) {
        $("profile-phone").textContent =
            profile.phone || "Sin teléfono";
    }

    if ($("profile-photo")) {
        if (profile.avatar_url) {
            $("profile-photo").src =
                profile.avatar_url;
        }
    }
}

/* =========================================================
   18. ADMIN BUTTON
   ========================================================= */

function showAdminButton() {
    const button = $("administration-button");

    if (button) {
        button.classList.remove("hidden");
        button.style.display = "";
    }
}

function hideAdminButton() {
    const button = $("administration-button");

    if (button) {
        button.classList.add("hidden");
        button.style.display = "none";
    }
}

/* =========================================================
   19. CERRAR SESIÓN
   ========================================================= */

async function logoutUser() {
    if (!mfSupabase) return;

    showLoading(true, "Cerrando sesión...");

    try {
        if (MF.messageSubscription) {
            await mfSupabase.removeChannel(
                MF.messageSubscription
            );

            MF.messageSubscription = null;
        }

        await mfSupabase.auth.signOut();

        MF.user = null;
        MF.profile = null;
        MF.isAdmin = false;
        MF.currentPublication = null;
        MF.currentConversation = null;

        closeAllPanels();

        showScreen("welcome-screen");

        showToast(
            "Sesión cerrada correctamente.",
            "success"
        );

    } catch (error) {
        console.error(error);

        showToast(
            "No se pudo cerrar la sesión.",
            "error"
        );
    } finally {
        showLoading(false);
    }
}

/* =========================================================
   20. ELIMINAR CUENTA
   ========================================================= */

async function deleteOwnAccount() {
    if (!MF.user || !mfSupabase) return;

    const confirmed = window.confirm(
        "¿Seguro que quieres eliminar tu cuenta de Market Flash?\n\n" +
        "Tu perfil quedará marcado como eliminado y se cerrará la sesión."
    );

    if (!confirmed) return;

    showLoading(true, "Eliminando cuenta...");

    try {
        const { error } = await mfSupabase
            .from("profiles")
            .update({
                status: "deleted"
            })
            .eq("id", MF.user.id);

        if (error) {
            throw error;
        }

        await mfSupabase.auth.signOut();

        MF.user = null;
        MF.profile = null;
        MF.isAdmin = false;

        closeAllPanels();

        showScreen("welcome-screen");

        showToast(
            "Tu cuenta ha sido eliminada.",
            "success"
        );

    } catch (error) {
        console.error(error);

        showToast(
            "No se pudo eliminar la cuenta.",
            "error"
        );
    } finally {
        showLoading(false);
    }
}

/* =========================================================
   21. RECUPERACIÓN DE CONTRASEÑA
   ========================================================= */

async function handleForgotPassword() {
    showToast(
        "La recuperación por cédula necesita un sistema seguro de OTP o backend. La dejaremos preparada para la siguiente fase.",
        "info"
    );
}

/* =========================================================
   22. RESTAURAR SESIÓN
   ========================================================= */

async function restoreSession() {
    if (!mfSupabase) return;

    try {
        const session =
            await getCurrentSession();

        if (!session?.user) {
            showScreen("welcome-screen");
            return;
        }

        MF.user = session.user;

        let profile =
            await loadProfile(session.user.id);

        if (!profile) {
            profile =
                await createProfileIfMissing(session.user);
        }

        if (
            profile?.status === "blocked" ||
            profile?.status === "suspended" ||
            profile?.status === "deleted"
        ) {
            await mfSupabase.auth.signOut();

            MF.user = null;
            MF.profile = null;

            showScreen("welcome-screen");

            showToast(
                "Esta cuenta no está activa.",
                "error"
            );

            return;
        }

        await updateLastSeen();

        await enterApplication();

    } catch (error) {
        console.error(
            "Error restaurando sesión:",
            error
        );

        showScreen("welcome-screen");
    }
}

/* =========================================================
   23. NAVEGACIÓN PRINCIPAL
   ========================================================= */

function goHome() {
    closeAllPanels();
    showScreen("dashboard-screen");
}

function openProfilePanel() {
    updateProfileUI();
    openPanel("profile-panel");
}

function openSettingsPanel() {
    openPanel("settings-panel");
}

function openEditProfilePanel() {
    if (!MF.profile) return;

    if ($("edit-profile-name")) {
        $("edit-profile-name").value =
            MF.profile.full_name || "";
    }

    if ($("edit-profile-phone")) {
        $("edit-profile-phone").value =
            MF.profile.phone || "";
    }

    openPanel("edit-profile-panel");
}

/* =========================================================
   24. EDITAR PERFIL
   ========================================================= */

async function handleEditProfile(event) {
    event.preventDefault();

    if (!MF.user || !mfSupabase) return;

    const name =
        $("edit-profile-name")?.value.trim() || "";

    const phone =
        $("edit-profile-phone")?.value.trim() || "";

    const photo =
        $("edit-profile-photo")?.files?.[0] || null;

    if (!name) {
        showToast(
            "El nombre no puede estar vacío.",
            "error"
        );
        return;
    }

    showLoading(true, "Actualizando perfil...");

    try {
        let avatarUrl =
            MF.profile?.avatar_url || null;

        if (photo) {
            if (!isImageFile(photo)) {
                showToast(
                    "El archivo seleccionado no es una imagen.",
                    "error"
                );
                return;
            }

            const path =
                `profiles/${MF.user.id}/${Date.now()}-${safeFileName(photo.name)}`;

            const { error: uploadError } =
                await mfSupabase.storage
                    .from("profile-photos")
                    .upload(path, photo, {
                        cacheControl: "3600",
                        upsert: false
                    });

            if (uploadError) {
                throw uploadError;
            }

            avatarUrl =
                getPublicStorageUrl(
                    "profile-photos",
                    path
                );
        }

        const { data, error } =
            await mfSupabase
                .from("profiles")
                .update({
                    full_name: name,
                    phone,
                    avatar_url: avatarUrl
                })
                .eq("id", MF.user.id)
                .select()
                .single();

        if (error) {
            throw error;
        }

        MF.profile = data;

        await updateProfileUI();

        closePanel("edit-profile-panel");

        showToast(
            "Perfil actualizado correctamente.",
            "success"
        );

    } catch (error) {
        console.error(error);

        showToast(
            "No se pudo actualizar el perfil.",
            "error"
        );
    } finally {
        showLoading(false);
    }
}

/* =========================================================
   25. EVENTOS DE AUTENTICACIÓN
   ========================================================= */

function setupAuthEvents() {

    $("login-button")?.addEventListener(
        "click",
        () => showScreen("login-screen")
    );

    $("register-button")?.addEventListener(
        "click",
        () => showScreen("register-screen")
    );

    $("back-from-login")?.addEventListener(
        "click",
        () => showScreen("welcome-screen")
    );

    $("back-from-register")?.addEventListener(
        "click",
        () => showScreen("welcome-screen")
    );

    $("login-form")?.addEventListener(
        "submit",
        handleLogin
    );

    $("register-form")?.addEventListener(
        "submit",
        handleRegister
    );

    $("forgot-password-button")?.addEventListener(
        "click",
        handleForgotPassword
    );
}

/* =========================================================
   26. EVENTOS DE PERFIL Y CONFIGURACIÓN
   ========================================================= */

function setupProfileEvents() {

    $("profile-nav-button")?.addEventListener(
        "click",
        openProfilePanel
    );

    $("settings-button")?.addEventListener(
        "click",
        openSettingsPanel
    );

    $("profile-settings-button")?.addEventListener(
        "click",
        openSettingsPanel
    );

    $("settings-profile-button")?.addEventListener(
        "click",
        () => {
            closePanel("settings-panel");
            openProfilePanel();
        }
    );

    $("edit-profile-button")?.addEventListener(
        "click",
        () => {
            closePanel("profile-panel");
            openEditProfilePanel();
        }
    );

    $("edit-profile-form")?.addEventListener(
        "submit",
        handleEditProfile
    );

    $("logout-button")?.addEventListener(
        "click",
        logoutUser
    );

    $("logout-profile-button")?.addEventListener(
        "click",
        logoutUser
    );

    $("delete-account-button")?.addEventListener(
        "click",
        deleteOwnAccount
    );

    $("close-profile-panel")?.addEventListener(
        "click",
        () => closePanel("profile-panel")
    );

    $("close-settings")?.addEventListener(
        "click",
        () => closePanel("settings-panel")
    );

    $("close-edit-profile-panel")?.addEventListener(
        "click",
        () => closePanel("edit-profile-panel")
    );

    $("home-nav-button")?.addEventListener(
        "click",
        goHome
    );
}

/* =========================================================
   27. ARRANQUE
   ========================================================= */

async function initializeApplication() {

    const connected =
        initializeSupabase();

    if (!connected) {
        return;
    }

    setupAuthEvents();
    setupProfileEvents();

    showScreen("welcome-screen");

    await restoreSession();

    /*
     * Escuchamos cambios de autenticación para mantener
     * Market Flash sincronizado con Supabase.
     */
    mfSupabase.auth.onAuthStateChange(
        async (event, session) => {

            if (event === "SIGNED_OUT") {
                MF.user = null;
                MF.profile = null;
                MF.isAdmin = false;

                closeAllPanels();
                showScreen("welcome-screen");

                return;
            }

            if (
                event === "SIGNED_IN" &&
                session?.user
            ) {
                MF.user = session.user;

                await loadProfile(session.user.id);

                if (!MF.profile) {
                    await createProfileIfMissing(
                        session.user
                    );
                }
            }
        }
    );
}

/* =========================================================
   28. DOM READY
   ========================================================= */

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        initializeApplication
    );

} else {

    initializeApplication();

}

/* =========================================================
   FIN DE LA PARTE 1/3
   ========================================================= *//* =========================================================
   MARKET FLASH
   SCRIPT.JS — PARTE 2/3
   PUBLICACIONES + MEDIA + MÉTRICAS + CHAT + WHATSAPP
   ========================================================= */

/* =========================================================
   29. REFERENCIAS DE PUBLICACIÓN
   ========================================================= */

const publicationState = {
    filteredPublications: [],
    selectedCategory: "Todas",
    searchText: ""
};

/* =========================================================
   30. OBTENER VALOR DE INPUT
   ========================================================= */

function getInputValue(id) {
    return $(id)?.value?.trim() || "";
}

function getInputNumber(id) {
    const value = getInputValue(id);
    return Number(value || 0);
}

/* =========================================================
   31. LIMPIAR FORMULARIO DE PUBLICACIÓN
   ========================================================= */

function resetPublicationForm() {

    const form = $("publication-form");

    if (form) {
        form.reset();
    }

    MF.publicationImages = [];
    MF.publicationVideo = null;

    const imagePreview =
        $("publication-photo-preview");

    if (imagePreview) {
        imagePreview.innerHTML = "";
    }

    const videoPreview =
        $("publication-video-preview");

    if (videoPreview) {
        videoPreview.innerHTML = "";
    }

    if ($("publication-whatsapp")) {
        $("publication-whatsapp").checked = true;
    }
}

/* =========================================================
   32. ABRIR CREACIÓN DE PUBLICACIÓN
   ========================================================= */

function openPublicationPanel() {

    if (!MF.user) {
        showToast(
            "Debes iniciar sesión para publicar.",
            "error"
        );
        return;
    }

    resetPublicationForm();

    openPanel("publication-panel");
}

/* =========================================================
   33. CERRAR PUBLICACIÓN
   ========================================================= */

function closePublicationCreator() {
    closePanel("publication-panel");
}

/* =========================================================
   34. SELECCIONAR FOTOS
   ========================================================= */

function handlePublicationImages(event) {

    const files =
        Array.from(event.target.files || []);

    if (!files.length) return;

    const validFiles =
        files.filter(isImageFile);

    if (!validFiles.length) {
        showToast(
            "Selecciona archivos de imagen.",
            "error"
        );
        return;
    }

    /*
     * Permitimos varias imágenes.
     * Se limita a 10 para evitar publicaciones
     * demasiado pesadas.
     */
    const combined = [
        ...MF.publicationImages,
        ...validFiles
    ];

    MF.publicationImages =
        combined.slice(0, 10);

    if (combined.length > 10) {
        showToast(
            "Puedes seleccionar hasta 10 fotos.",
            "info"
        );
    }

    renderPublicationImagePreview();

    event.target.value = "";
}

/* =========================================================
   35. PREVISUALIZACIÓN DE FOTOS
   ========================================================= */

function renderPublicationImagePreview() {

    const container =
        $("publication-photo-preview");

    if (!container) return;

    container.innerHTML = "";

    MF.publicationImages.forEach(
        (file, index) => {

            const wrapper =
                document.createElement("div");

            wrapper.className =
                "publication-preview-image";

            const image =
                document.createElement("img");

            image.alt =
                `Foto ${index + 1}`;

            image.src =
                URL.createObjectURL(file);

            const remove =
                document.createElement("button");

            remove.type = "button";
            remove.className =
                "remove-preview-image";

            remove.textContent = "×";

            remove.addEventListener(
                "click",
                () => {

                    MF.publicationImages
                        .splice(index, 1);

                    renderPublicationImagePreview();
                }
            );

            wrapper.appendChild(image);
            wrapper.appendChild(remove);

            container.appendChild(wrapper);
        }
    );
}

/* =========================================================
   36. SELECCIONAR VÍDEO
   ========================================================= */

function handlePublicationVideo(event) {

    const file =
        event.target.files?.[0];

    if (!file) return;

    if (!isVideoFile(file)) {
        showToast(
            "Selecciona un archivo de vídeo válido.",
            "error"
        );

        event.target.value = "";
        return;
    }

    /*
     * Límite práctico para evitar archivos gigantes
     * desde el navegador.
     */
    const maxSize =
        100 * 1024 * 1024;

    if (file.size > maxSize) {
        showToast(
            "El vídeo no puede superar 100 MB.",
            "error"
        );

        event.target.value = "";
        return;
    }

    MF.publicationVideo = file;

    renderPublicationVideoPreview();
}

/* =========================================================
   37. PREVISUALIZACIÓN DE VÍDEO
   ========================================================= */

function renderPublicationVideoPreview() {

    const container =
        $("publication-video-preview");

    if (!container) return;

    container.innerHTML = "";

    if (!MF.publicationVideo) {
        return;
    }

    const wrapper =
        document.createElement("div");

    wrapper.className =
        "publication-video-preview-item";

    const video =
        document.createElement("video");

    video.controls = true;
    video.playsInline = true;

    video.src =
        URL.createObjectURL(
            MF.publicationVideo
        );

    const remove =
        document.createElement("button");

    remove.type = "button";
    remove.className =
        "remove-preview-video";

    remove.textContent =
        "Eliminar vídeo";

    remove.addEventListener(
        "click",
        () => {

            MF.publicationVideo = null;

            if ($("publication-video")) {
                $("publication-video").value = "";
            }

            renderPublicationVideoPreview();
        }
    );

    wrapper.appendChild(video);
    wrapper.appendChild(remove);

    container.appendChild(wrapper);
}

/* =========================================================
   38. VALIDAR PUBLICACIÓN
   ========================================================= */

function validatePublicationForm() {

    const name =
        getInputValue("publication-name");

    const category =
        getInputValue("publication-category");

    const price =
        getInputNumber("publication-price");

    const quantity =
        getInputNumber("publication-quantity");

    const description =
        getInputValue("publication-description");

    const location =
        getInputValue("publication-location");

    if (!name) {
        showToast(
            "Escribe el nombre del producto.",
            "error"
        );
        return false;
    }

    if (!category) {
        showToast(
            "Selecciona una categoría.",
            "error"
        );
        return false;
    }

    if (!Number.isFinite(price) || price < 0) {
        showToast(
            "Introduce un precio válido.",
            "error"
        );
        return false;
    }

    if (
        !Number.isFinite(quantity) ||
        quantity < 1
    ) {
        showToast(
            "La cantidad debe ser al menos 1.",
            "error"
        );
        return false;
    }

    if (!description) {
        showToast(
            "Escribe una descripción.",
            "error"
        );
        return false;
    }

    if (!location) {
        showToast(
            "Indica la ubicación.",
            "error"
        );
        return false;
    }

    if (
        MF.publicationImages.length === 0 &&
        !MF.publicationVideo
    ) {
        showToast(
            "Añade al menos una foto o un vídeo.",
            "error"
        );
        return false;
    }

    return true;
}

/* =========================================================
   39. DATOS DEL FORMULARIO
   ========================================================= */

function getPublicationFormData() {

    return {
        name:
            getInputValue("publication-name"),

        category:
            getInputValue("publication-category"),

        price:
            getInputNumber("publication-price"),

        quantity:
            getInputNumber("publication-quantity"),

        description:
            getInputValue("publication-description"),

        location:
            getInputValue("publication-location"),

        whatsapp:
            $("publication-whatsapp")
                ? $("publication-whatsapp").checked
                : true
    };
}

/* =========================================================
   40. ABRIR PREVIEW
   ========================================================= */

function openPublicationPreview() {

    if (!validatePublicationForm()) {
        return;
    }

    const data =
        getPublicationFormData();

    renderPublicationPreview(data);

    openPanel(
        "publication-preview-panel"
    );
}

/* =========================================================
   41. RENDER PREVIEW
   ========================================================= */

function renderPublicationPreview(data) {

    const container =
        $("publication-preview");

    if (!container) return;

    let mediaHTML = "";

    if (MF.publicationImages.length) {

        mediaHTML = `
            <div class="preview-media-grid">
                ${MF.publicationImages
                    .map(
                        (file) => `
                            <img
                                src="${URL.createObjectURL(file)}"
                                alt="Foto del producto"
                            >
                        `
                    )
                    .join("")}
            </div>
        `;
    }

    if (MF.publicationVideo) {

        mediaHTML += `
            <video
                class="preview-video"
                controls
                playsinline
                src="${URL.createObjectURL(
                    MF.publicationVideo
                )}">
            </video>
        `;
    }

    container.innerHTML = `
        <article class="publication-card preview-card">

            ${mediaHTML}

            <div class="publication-card-content">

                <span class="publication-category">
                    ${escapeHTML(data.category)}
                </span>

                <h3>
                    ${escapeHTML(data.name)}
                </h3>

                <strong class="publication-price">
                    ${formatMoney(data.price)}
                </strong>

                <p>
                    ${escapeHTML(data.description)}
                </p>

                <div class="publication-location">
                    📍 ${escapeHTML(data.location)}
                </div>

                <div class="publication-quantity">
                    Cantidad disponible:
                    ${formatNumber(data.quantity)}
                </div>

                ${
                    data.whatsapp
                        ? `
                            <div class="whatsapp-preview-badge">
                                WhatsApp activado
                            </div>
                          `
                        : ""
                }

            </div>

        </article>
    `;
}

/* =========================================================
   42. SUBIR MEDIA DE PUBLICACIÓN
   ========================================================= */

async function uploadPublicationMedia(
    publicationId
) {

    const uploaded = [];

    /*
     * FOTOS
     */
    for (
        let index = 0;
        index < MF.publicationImages.length;
        index++
    ) {

        const file =
            MF.publicationImages[index];

        const path =
            `publications/${MF.user.id}/${publicationId}/${Date.now()}-${index}-${safeFileName(file.name)}`;

        const {
            error: uploadError
        } = await mfSupabase.storage
            .from("publication-media")
            .upload(path, file, {
                cacheControl: "3600",
                upsert: false
            });

        if (uploadError) {
            throw uploadError;
        }

        uploaded.push({
            publication_id: publicationId,
            media_type: "image",
            storage_path: path,
            media_url:
                getPublicStorageUrl(
                    "publication-media",
                    path
                ),
            sort_order: index
        });
    }

    /*
     * VÍDEO
     */
    if (MF.publicationVideo) {

        const file =
            MF.publicationVideo;

        const path =
            `publications/${MF.user.id}/${publicationId}/${Date.now()}-video-${safeFileName(file.name)}`;

        const {
            error: uploadError
        } = await mfSupabase.storage
            .from("publication-media")
            .upload(path, file, {
                cacheControl: "3600",
                upsert: false
            });

        if (uploadError) {
            throw uploadError;
        }

        uploaded.push({
            publication_id: publicationId,
            media_type: "video",
            storage_path: path,
            media_url:
                getPublicStorageUrl(
                    "publication-media",
                    path
                ),
            sort_order: 999
        });
    }

    if (!uploaded.length) {
        return [];
    }

    const {
        data,
        error
    } = await mfSupabase
        .from("publication_media")
        .insert(uploaded)
        .select();

    if (error) {
        throw error;
    }

    return data || [];
}

/* =========================================================
   43. CREAR PUBLICACIÓN
   ========================================================= */

async function publishPublication() {

    if (!MF.user) {
        showToast(
            "Debes iniciar sesión.",
            "error"
        );
        return;
    }

    if (!validatePublicationForm()) {
        return;
    }

    const data =
        getPublicationFormData();

    showLoading(
        true,
        "Publicando tu producto..."
    );

    let publicationId = null;

    try {

        /*
         * Primero creamos la publicación.
         */
        const {
            data: publication,
            error
        } = await mfSupabase
            .from("publications")
            .insert({
                seller_id: MF.user.id,
                title: data.name,
                category: data.category,
                price: data.price,
                quantity: data.quantity,
                description: data.description,
                location: data.location,
                whatsapp_enabled: data.whatsapp,
                status: "published",
                is_flash: false
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        publicationId =
            publication.id;

        /*
         * Después subimos las fotos/vídeo.
         */
        await uploadPublicationMedia(
            publicationId
        );

        closePanel(
            "publication-preview-panel"
        );

        closePanel(
            "publication-panel"
        );

        resetPublicationForm();

        showToast(
            "¡Publicación publicada correctamente!",
            "success"
        );

        await loadDashboardData();

    } catch (error) {

        console.error(
            "Error publicando:",
            error
        );

        /*
         * Si algo falló después de crear la publicación,
         * intentamos eliminarla para no dejar basura.
         */
        if (publicationId) {
            await mfSupabase
                .from("publications")
                .delete()
                .eq("id", publicationId);
        }

        showToast(
            error?.message ||
            "No se pudo publicar el producto.",
            "error"
        );

    } finally {
        showLoading(false);
    }
}

/* =========================================================
   44. CARGAR PUBLICACIONES
   ========================================================= */

async function loadPublications() {

    if (!mfSupabase) return [];

    const {
        data,
        error
    } = await mfSupabase
        .from("publications")
        .select("*")
        .eq("status", "published")
        .order("created_at", {
            ascending: false
        });

    if (error) {
        console.error(
            "Error cargando publicaciones:",
            error
        );

        return [];
    }

    const publications =
        data || [];

    if (!publications.length) {
        return [];
    }

    /*
     * Cargamos media por separado para evitar
     * problemas con relaciones de Supabase.
     */
    const ids =
        publications.map(
            publication => publication.id
        );

    const {
        data: media
    } = await mfSupabase
        .from("publication_media")
        .select("*")
        .in("publication_id", ids)
        .order("sort_order", {
            ascending: true
        });

    /*
     * Cargamos los perfiles de vendedores.
     */
    const sellerIds =
        [
            ...new Set(
                publications
                    .map(p => p.seller_id)
                    .filter(Boolean)
            )
        ];

    let profiles = [];

    if (sellerIds.length) {

        const {
            data: profileData
        } = await mfSupabase
            .from("profiles")
            .select(
                "id,full_name,phone,avatar_url,status"
            )
            .in("id", sellerIds);

        profiles =
            profileData || [];
    }

    const mediaMap = {};

    (media || []).forEach(item => {

        if (!mediaMap[item.publication_id]) {
            mediaMap[item.publication_id] = [];
        }

        mediaMap[item.publication_id].push(item);
    });

    const profileMap = {};

    profiles.forEach(profile => {
        profileMap[profile.id] =
            profile;
    });

    return publications.map(
        publication => ({
            ...publication,

            media:
                mediaMap[publication.id] || [],

            seller:
                profileMap[publication.seller_id] || null
        })
    );
}

/* =========================================================
   45. CARGAR DASHBOARD
   ========================================================= */

async function loadDashboardData() {

    if (!mfSupabase || !MF.user) {
        return;
    }

    const publications =
        await loadPublications();

    MF.publications =
        publications;

    publicationState.filteredPublications =
        [...publications];

    renderPublications(
        publicationState.filteredPublications
    );

    renderFlashPromotions();

    updateProfilePublicationStats();
}

/* =========================================================
   46. IMAGEN PRINCIPAL
   ========================================================= */

function getMainMedia(publication) {

    const media =
        publication?.media || [];

    const image =
        media.find(
            item =>
                item.media_type === "image"
        );

    const video =
        media.find(
            item =>
                item.media_type === "video"
        );

    return image || video || null;
}

/* =========================================================
   47. HTML DE MEDIA
   ========================================================= */

function publicationMediaHTML(
    publication
) {

    const media =
        getMainMedia(publication);

    if (!media) {

        return `
            <div class="publication-no-image">
                📦
            </div>
        `;
    }

    if (media.media_type === "video") {

        return `
            <video
                class="publication-card-video"
                muted
                playsinline
                preload="metadata"
                src="${escapeHTML(
                    media.media_url
                )}">
            </video>
        `;
    }

    return `
        <img
            class="publication-card-image"
            src="${escapeHTML(
                media.media_url
            )}"
            alt="${escapeHTML(
                publication.title
            )}"
            loading="lazy"
        >
    `;
}

/* =========================================================
   48. TARJETA DE PUBLICACIÓN
   ========================================================= */

function publicationCardHTML(
    publication
) {

    const seller =
        publication.seller || {};

    const whatsapp =
        publication.whatsapp_enabled;

    const flash =
        publication.is_flash;

    return `
        <article
            class="publication-card"
            data-publication-id="${publication.id}"
        >

            <div class="publication-media-wrapper">

                ${publicationMediaHTML(
                    publication
                )}

                ${
                    flash
                        ? `
                            <span class="flash-mini-badge">
                                ⚡ FLASH
                            </span>
                          `
                        : ""
                }

            </div>

            <div class="publication-card-content">

                <span class="publication-category">
                    ${escapeHTML(
                        publication.category || ""
                    )}
                </span>

                <h3>
                    ${escapeHTML(
                        publication.title
                    )}
                </h3>

                <strong class="publication-price">
                    ${formatMoney(
                        publication.price
                    )}
                </strong>

                <p class="publication-description">
                    ${escapeHTML(
                        publication.description || ""
                    )}
                </p>

                <div class="publication-location">
                    📍 ${escapeHTML(
                        publication.location || ""
                    )}
                </div>

                <div class="publication-metrics">

                    <span>
                        👁️
                        ${formatNumber(
                            publication.views_count
                        )}
                    </span>

                    <span>
                        ❤️
                        ${formatNumber(
                            publication.likes_count
                        )}
                    </span>

                    <span>
                        🔖
                        ${formatNumber(
                            publication.saves_count
                        )}
                    </span>

                </div>

                <div class="publication-card-actions">

                    <button
                        type="button"
                        class="primary-button publication-open-button"
                        data-id="${publication.id}"
                    >
                        Ver publicación
                    </button>

                    ${
                        whatsapp
                            ? `
                                <button
                                    type="button"
                                    class="whatsapp-button publication-whatsapp-card-button"
                                    data-id="${publication.id}"
                                >
                                    WhatsApp
                                </button>
                              `
                            : ""
                    }

                </div>

            </div>

        </article>
    `;
}

/* =========================================================
   49. MOSTRAR PUBLICACIONES
   ========================================================= */

function renderPublications(
    publications
) {

    const container =
        $("publications-list");

    if (!container) return;

    if (!publications.length) {

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">
                    📦
                </div>

                <h3>
                    No hay publicaciones todavía
                </h3>

                <p>
                    Sé el primero en publicar algo en Market Flash.
                </p>
            </div>
        `;

        return;
    }

    container.innerHTML =
        publications
            .map(publicationCardHTML)
            .join("");

    container
        .querySelectorAll(
            ".publication-open-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const id =
                        Number(
                            button.dataset.id
                        );

                    openPublicationDetail(id);
                }
            );
        });

    container
        .querySelectorAll(
            ".publication-whatsapp-card-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    const id =
                        Number(
                            button.dataset.id
                        );

                    const publication =
                        MF.publications.find(
                            p =>
                                Number(p.id) === id
                        );

                    if (!publication) return;

                    const phone =
                        publication.seller?.phone ||
                        "";

                    openWhatsApp(
                        phone,
                        `Hola, vi tu publicación "${publication.title}" en Market Flash y estoy interesado/a.`
                    );
                }
            );
        });
}

/* =========================================================
   50. BÚSQUEDA
   ========================================================= */

function filterPublications() {

    const search =
        publicationState.searchText
            .toLowerCase()
            .trim();

    const category =
        publicationState.selectedCategory;

    let result =
        [...MF.publications];

    if (search) {

        result =
            result.filter(
                publication => {

                    const text = [
                        publication.title,
                        publication.description,
                        publication.category,
                        publication.location
                    ]
                        .join(" ")
                        .toLowerCase();

                    return text.includes(search);
                }
            );
    }

    if (
        category &&
        category !== "Todas"
    ) {

        result =
            result.filter(
                publication =>
                    safeText(
                        publication.category
                    ).toLowerCase() ===
                    category.toLowerCase()
            );
    }

    publicationState.filteredPublications =
        result;

    renderPublications(result);
}

/* =========================================================
   51. EVENTO DE BÚSQUEDA
   ========================================================= */

function setupSearch() {

    $("market-search")?.addEventListener(
        "input",
        event => {

            publicationState.searchText =
                event.target.value || "";

            filterPublications();
        }
    );
}

/* =========================================================
   52. CATEGORÍAS
   ========================================================= */

function setupCategories() {

    const container =
        $("categories-list");

    if (!container) return;

    container
        .querySelectorAll(
            "[data-category]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    container
                        .querySelectorAll(
                            "[data-category]"
                        )
                        .forEach(item =>
                            item.classList.remove(
                                "active"
                            )
                        );

                    button.classList.add(
                        "active"
                    );

                    publicationState
                        .selectedCategory =
                        button.dataset.category ||
                        "Todas";

                    filterPublications();
                }
            );
        });
}

/* =========================================================
   53. ABRIR DETALLE
   ========================================================= */

async function openPublicationDetail(
    publicationId
) {

    const publication =
        MF.publications.find(
            item =>
                Number(item.id) ===
                Number(publicationId)
        );

    if (!publication) {
        showToast(
            "No se encontró la publicación.",
            "error"
        );
        return;
    }

    MF.currentPublication =
        publication;

    renderPublicationDetail(
        publication
    );

    openPanel(
        "publication-detail-panel"
    );

    await registerPublicationView(
        publication.id
    );
}

/* =========================================================
   54. DETALLE DE PUBLICACIÓN
   ========================================================= */

function renderPublicationDetail(
    publication
) {

    const mediaContainer =
        $("publication-detail-media");

    const infoContainer =
        $("publication-detail-info");

    if (mediaContainer) {

        const media =
            publication.media || [];

        mediaContainer.innerHTML =
            media.length
                ? media
                    .map(item => {

                        if (
                            item.media_type ===
                            "video"
                        ) {
                            return `
                                <video
                                    controls
                                    playsinline
                                    src="${escapeHTML(
                                        item.media_url
                                    )}">
                                </video>
                            `;
                        }

                        return `
                            <img
                                src="${escapeHTML(
                                    item.media_url
                                )}"
                                alt="${escapeHTML(
                                    publication.title
                                )}"
                            >
                        `;
                    })
                    .join("")
                : `
                    <div class="publication-no-image">
                        📦
                    </div>
                `;
    }

    if (infoContainer) {

        const seller =
            publication.seller || {};

        infoContainer.innerHTML = `

            <span class="publication-category">
                ${escapeHTML(
                    publication.category || ""
                )}
            </span>

            <h2>
                ${escapeHTML(
                    publication.title
                )}
            </h2>

            <strong class="publication-price">
                ${formatMoney(
                    publication.price
                )}
            </strong>

            <p>
                ${escapeHTML(
                    publication.description || ""
                )}
            </p>

            <div class="detail-location">
                📍 ${escapeHTML(
                    publication.location || ""
                )}
            </div>

            <div class="detail-seller">
                Vendedor:
                <strong>
                    ${escapeHTML(
                        seller.full_name ||
                        "Usuario"
                    )}
                </strong>
            </div>

            <div class="detail-quantity">
                Cantidad disponible:
                ${formatNumber(
                    publication.quantity
                )}
            </div>
        `;
    }

    if ($("detail-view-count")) {
        $("detail-view-count").textContent =
            formatNumber(
                publication.views_count
            );
    }

    if ($("detail-like-count")) {
        $("detail-like-count").textContent =
            formatNumber(
                publication.likes_count
            );
    }

    if ($("detail-save-count")) {
        $("detail-save-count").textContent =
            formatNumber(
                publication.saves_count
            );
    }

    const whatsappButton =
        $("publication-whatsapp-button");

    if (whatsappButton) {

        whatsappButton.style.display =
            publication.whatsapp_enabled
                ? ""
                : "none";
    }
}

/* =========================================================
   55. REGISTRAR VISTA
   ========================================================= */

async function registerPublicationView(
    publicationId
) {

    if (!MF.user || !mfSupabase) {
        return;
    }

    /*
     * Una vista por usuario/publicación.
     * La restricción UNIQUE de la base de datos
     * evita duplicados.
     */
    const {
        error
    } = await mfSupabase
        .from("publication_views")
        .insert({
            publication_id:
                publicationId,
            user_id:
                MF.user.id
        });

    /*
     * 23505 = registro duplicado.
     * En ese caso no incrementamos el contador.
     */
    if (
        error &&
        error.code !== "23505"
    ) {
        console.warn(
            "No se pudo registrar la vista:",
            error
        );

        return;
    }

    if (error?.code === "23505") {
        return;
    }

    const publication =
        MF.publications.find(
            item =>
                Number(item.id) ===
                Number(publicationId)
        );

    if (!publication) return;

    const newCount =
        Number(
            publication.views_count || 0
        ) + 1;

    const {
        error: updateError
    } = await mfSupabase
        .from("publications")
        .update({
            views_count: newCount
        })
        .eq("id", publicationId);

    if (updateError) {
        console.warn(
            "No se pudo actualizar vistas:",
            updateError
        );
        return;
    }

    publication.views_count =
        newCount;

    if (
        MF.currentPublication &&
        Number(
            MF.currentPublication.id
        ) === Number(publicationId)
    ) {
        MF.currentPublication.views_count =
            newCount;
    }

    if ($("detail-view-count")) {
        $("detail-view-count").textContent =
            formatNumber(newCount);
    }
}

/* =========================================================
   56. LIKE
   ========================================================= */

async function togglePublicationLike() {

    const publication =
        MF.currentPublication;

    if (!publication || !MF.user) {
        showToast(
            "Debes iniciar sesión.",
            "error"
        );
        return;
    }

    const {
        data: existing,
        error: checkError
    } = await mfSupabase
        .from("publication_likes")
        .select("id")
        .eq("publication_id", publication.id)
        .eq("user_id", MF.user.id)
        .maybeSingle();

    if (checkError) {
        console.error(checkError);
        return;
    }

    if (existing) {

        const {
            error
        } = await mfSupabase
            .from("publication_likes")
            .delete()
            .eq("id", existing.id);

        if (error) {
            showToast(
                "No se pudo quitar el like.",
                "error"
            );
            return;
        }

        await changePublicationCounter(
            publication.id,
            "likes_count",
            -1
        );

        showToast(
            "Like eliminado.",
            "info"
        );

    } else {

        const {
            error
        } = await mfSupabase
            .from("publication_likes")
            .insert({
                publication_id:
                    publication.id,
                user_id:
                    MF.user.id
            });

        if (error) {
            if (error.code === "23505") {
                return;
            }

            console.error(error);

            showToast(
                "No se pudo marcar el like.",
                "error"
            );

            return;
        }

        await changePublicationCounter(
            publication.id,
            "likes_count",
            1
        );

        showToast(
            "❤️ ¡Te gusta esta publicación!",
            "success"
        );
    }
}

/* =========================================================
   57. GUARDAR
   ========================================================= */

async function togglePublicationSave() {

    const publication =
        MF.currentPublication;

    if (!publication || !MF.user) {
        showToast(
            "Debes iniciar sesión.",
            "error"
        );
        return;
    }

    const {
        data: existing,
        error: checkError
    } = await mfSupabase
        .from("publication_saves")
        .select("id")
        .eq("publication_id", publication.id)
        .eq("user_id", MF.user.id)
        .maybeSingle();

    if (checkError) {
        console.error(checkError);
        return;
    }

    if (existing) {

        const {
            error
        } = await mfSupabase
            .from("publication_saves")
            .delete()
            .eq("id", existing.id);

        if (error) {
            showToast(
                "No se pudo quitar de guardados.",
                "error"
            );
            return;
        }

        await changePublicationCounter(
            publication.id,
            "saves_count",
            -1
        );

        showToast(
            "Publicación eliminada de guardados.",
            "info"
        );

    } else {

        const {
            error
        } = await mfSupabase
            .from("publication_saves")
            .insert({
                publication_id:
                    publication.id,
                user_id:
                    MF.user.id
            });

        if (error) {
            if (error.code === "23505") {
                return;
            }

            console.error(error);

            showToast(
                "No se pudo guardar.",
                "error"
            );

            return;
        }

        await changePublicationCounter(
            publication.id,
            "saves_count",
            1
        );

        showToast(
            "🔖 Publicación guardada.",
            "success"
        );
    }
}

/* =========================================================
   58. ACTUALIZAR CONTADOR
   ========================================================= */

async function changePublicationCounter(
    publicationId,
    column,
    change
) {

    const publication =
        MF.publications.find(
            item =>
                Number(item.id) ===
                Number(publicationId)
        );

    if (!publication) return;

    const current =
        Number(
            publication[column] || 0
        );

    const next =
        Math.max(
            0,
            current + Number(change)
        );

    const update = {};

    update[column] = next;

    const {
        error
    } = await mfSupabase
        .from("publications")
        .update(update)
        .eq("id", publicationId);

    if (error) {
        console.error(error);
        return;
    }

    publication[column] =
        next;

    if (
        MF.currentPublication &&
        Number(
            MF.currentPublication.id
        ) === Number(publicationId)
    ) {
        MF.currentPublication[column] =
            next;
    }

    if (column === "likes_count" &&
        $("detail-like-count")) {

        $("detail-like-count").textContent =
            formatNumber(next);
    }

    if (column === "saves_count" &&
        $("detail-save-count")) {

        $("detail-save-count").textContent =
            formatNumber(next);
    }
}

/* =========================================================
   59. BOTÓN WHATSAPP DEL DETALLE
   ========================================================= */

function handleDetailWhatsApp() {

    const publication =
        MF.currentPublication;

    if (!publication) return;

    if (!publication.whatsapp_enabled) {
        showToast(
            "El vendedor no activó WhatsApp.",
            "info"
        );
        return;
    }

    const phone =
        publication.seller?.phone ||
        "";

    openWhatsApp(
        phone,
        `Hola, vi tu publicación "${publication.title}" en Market Flash y estoy interesado/a.`
    );
}

/* =========================================================
   60. CHAT: CONVERSACIÓN
   ========================================================= */

async function getOrCreateConversation(
    sellerId,
    publicationId = null
) {

    if (!MF.user || !mfSupabase) {
        return null;
    }

    if (
        String(sellerId) ===
        String(MF.user.id)
    ) {
        showToast(
            "No puedes abrir un chat contigo mismo.",
            "info"
        );
        return null;
    }

    /*
     * Buscamos conversaciones donde participe
     * el usuario actual.
     */
    const {
        data: mine,
        error
    } = await mfSupabase
        .from("conversations")
        .select("*")
        .or(
            `user_one.eq.${MF.user.id},user_two.eq.${MF.user.id}`
        )
        .order("created_at", {
            ascending: false
        });

    if (error) {
        console.error(error);
    }

    const found =
        (mine || []).find(
            conversation =>
                (
                    conversation.user_one ===
                        MF.user.id &&
                    conversation.user_two ===
                        sellerId
                ) ||
                (
                    conversation.user_two ===
                        MF.user.id &&
                    conversation.user_one ===
                        sellerId
                )
        );

    if (found) {
        return found;
    }

    const {
        data,
        error: createError
    } = await mfSupabase
        .from("conversations")
        .insert({
            user_one: MF.user.id,
            user_two: sellerId,
            publication_id:
                publicationId
        })
        .select()
        .single();

    if (createError) {
        console.error(
            "No se pudo crear conversación:",
            createError
        );

        return null;
    }

    return data;
}

/* =========================================================
   61. ABRIR CHAT DESDE PUBLICACIÓN
   ========================================================= */

async function openPublicationChat() {

    const publication =
        MF.currentPublication;

    if (!publication) return;

    if (!MF.user) {
        showToast(
            "Debes iniciar sesión.",
            "error"
        );
        return;
    }

    const sellerId =
        publication.seller_id;

    const conversation =
        await getOrCreateConversation(
            sellerId,
            publication.id
        );

    if (!conversation) {
        return;
    }

    MF.currentConversation =
        conversation;

    openPanel("chat-panel");

    await loadChatMessages(
        conversation.id
    );

    subscribeToChat(
        conversation.id
    );
}

/* =========================================================
   62. CARGAR MENSAJES
   ========================================================= */

async function loadChatMessages(
    conversationId
) {

    const container =
        $("chat-messages");

    if (!container) return;

    container.innerHTML = `
        <div class="chat-loading">
            Cargando mensajes...
        </div>
    `;

    const {
        data,
        error
    } = await mfSupabase
        .from("messages")
        .select("*")
        .eq(
            "conversation_id",
            conversationId
        )
        .order("created_at", {
            ascending: true
        });

    if (error) {
        console.error(error);

        container.innerHTML = `
            <div class="chat-empty">
                No se pudieron cargar los mensajes.
            </div>
        `;

        return;
    }

    renderChatMessages(data || []);
}

/* =========================================================
   63. MOSTRAR MENSAJES
   ========================================================= */

function renderChatMessages(
    messages
) {

    const container =
        $("chat-messages");

    if (!container) return;

    if (!messages.length) {

        container.innerHTML = `
            <div class="chat-empty">
                <div>💬</div>
                <p>
                    Comienza la conversación.
                </p>
            </div>
        `;

        return;
    }

    container.innerHTML =
        messages
            .map(message => {

                const mine =
                    message.sender_id ===
                    MF.user?.id;

                return `
                    <div class="chat-message ${
                        mine
                            ? "chat-message-mine"
                            : "chat-message-other"
                    }">

                        <div class="chat-message-bubble">
                            ${escapeHTML(
                                message.body ||
                                message.content ||
                                ""
                            )}
                        </div>

                        <small>
                            ${formatDateTime(
                                message.created_at
                            )}
                        </small>

                    </div>
                `;
            })
            .join("");

    container.scrollTop =
        container.scrollHeight;
}

/* =========================================================
   64. ENVIAR MENSAJE
   ========================================================= */

async function sendChatMessage() {

    if (
        !MF.user ||
        !MF.currentConversation
    ) {
        return;
    }

    const input =
        $("chat-input");

    if (!input) return;

    const body =
        input.value.trim();

    if (!body) return;

    const conversationId =
        MF.currentConversation.id;

    const {
        data,
        error
    } = await mfSupabase
        .from("messages")
        .insert({
            conversation_id:
                conversationId,
            sender_id:
                MF.user.id,
            body
        })
        .select()
        .single();

    if (error) {
        console.error(error);

        showToast(
            "No se pudo enviar el mensaje.",
            "error"
        );

        return;
    }

    input.value = "";

    /*
     * Mostramos inmediatamente el mensaje.
     * El realtime también lo recibirá, por lo que
     * evitamos duplicados comprobando el id.
     */
    const container =
        $("chat-messages");

    if (container) {

        const current =
            container.querySelectorAll(
                ".chat-message"
            );

        if (current.length === 1 &&
            container.querySelector(
                ".chat-empty"
            )) {

            container.innerHTML = "";
        }

        appendChatMessage(data);
    }

    /*
     * Algunas configuraciones RLS pueden impedir
     * actualizar last_message_at desde el cliente.
     * El mensaje ya fue enviado, así que no hacemos
     * fallar el chat por este detalle.
     */
    try {
        await mfSupabase
            .from("conversations")
            .update({
                last_message_at:
                    new Date().toISOString()
            })
            .eq(
                "id",
                conversationId
            );
    } catch (error) {
        console.warn(
            "No se actualizó last_message_at.",
            error
        );
    }
}

/* =========================================================
   65. AÑADIR MENSAJE AL CHAT
   ========================================================= */

function appendChatMessage(
    message
) {

    const container =
        $("chat-messages");

    if (!container) return;

    if (
        container.dataset.lastMessageId ===
        String(message.id)
    ) {
        return;
    }

    container.dataset.lastMessageId =
        String(message.id);

    const mine =
        message.sender_id ===
        MF.user?.id;

    const wrapper =
        document.createElement("div");

    wrapper.className =
        `chat-message ${
            mine
                ? "chat-message-mine"
                : "chat-message-other"
        }`;

    wrapper.dataset.messageId =
        message.id;

    wrapper.innerHTML = `
        <div class="chat-message-bubble">
            ${escapeHTML(
                message.body ||
                message.content ||
                ""
            )}
        </div>

        <small>
            ${formatDateTime(
                message.created_at
            )}
        </small>
    `;

    container.appendChild(wrapper);

    container.scrollTop =
        container.scrollHeight;
}

/* =========================================================
   66. REALTIME DEL CHAT
   ========================================================= */

function subscribeToChat(
    conversationId
) {

    if (!mfSupabase) return;

    if (MF.messageSubscription) {

        mfSupabase.removeChannel(
            MF.messageSubscription
        );

        MF.messageSubscription = null;
    }

    MF.messageSubscription =
        mfSupabase
            .channel(
                `market-flash-chat-${conversationId}`
            )
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    filter:
                        `conversation_id=eq.${conversationId}`
                },
                payload => {

                    if (payload?.new) {
                        appendChatMessage(
                            payload.new
                        );
                    }
                }
            )
            .subscribe();
}

/* =========================================================
   67. CONTINUAR CHAT POR WHATSAPP
   ========================================================= */

function continueChatByWhatsApp() {

    const publication =
        MF.currentPublication;

    if (!publication) return;

    const phone =
        publication.seller?.phone ||
        "";

    openWhatsApp(
        phone,
        `Hola, estoy hablando contigo por Market Flash sobre "${publication.title}".`
    );
}

/* =========================================================
   68. ESTADÍSTICAS DEL PERFIL
   ========================================================= */

function updateProfilePublicationStats() {

    if (!MF.user) return;

    const mine =
        MF.publications.filter(
            publication =>
                publication.seller_id ===
                MF.user.id
        );

    if ($("profile-publications-count")) {
        $("profile-publications-count")
            .textContent =
            formatNumber(mine.length);
    }

    const likes =
        mine.reduce(
            (total, publication) =>
                total +
                Number(
                    publication.likes_count ||
                    0
                ),
            0
        );

    const saves =
        mine.reduce(
            (total, publication) =>
                total +
                Number(
                    publication.saves_count ||
                    0
                ),
            0
        );

    if ($("profile-likes-count")) {
        $("profile-likes-count")
            .textContent =
            formatNumber(likes);
    }

    if ($("profile-saves-count")) {
        $("profile-saves-count")
            .textContent =
            formatNumber(saves);
    }
}

/* =========================================================
   69. EVENTOS DE PUBLICACIONES
   ========================================================= */

function setupPublicationEvents() {

    $("create-publication-button")
        ?.addEventListener(
            "click",
            openPublicationPanel
        );

    $("promote-button")
        ?.addEventListener(
            "click",
            openPromotionPanel
        );

    $("close-publication-panel")
        ?.addEventListener(
            "click",
            closePublicationCreator
        );

    $("cancel-publication-button")
        ?.addEventListener(
            "click",
            closePublicationCreator
        );

    $("take-photo-button")
        ?.addEventListener(
            "click",
            () => {
                $("publication-images")
                    ?.click();
            }
        );

    $("choose-photo-button")
        ?.addEventListener(
            "click",
            () => {
                $("publication-images")
                    ?.click();
            }
        );

    $("publication-images")
        ?.addEventListener(
            "change",
            handlePublicationImages
        );

    $("choose-video-button")
        ?.addEventListener(
            "click",
            () => {
                $("publication-video")
                    ?.click();
            }
        );

    $("publication-video")
        ?.addEventListener(
            "change",
            handlePublicationVideo
        );

    $("publication-form")
        ?.addEventListener(
            "submit",
            event => {
                event.preventDefault();
                openPublicationPreview();
            }
        );

    $("close-publication-preview")
        ?.addEventListener(
            "click",
            () => closePanel(
                "publication-preview-panel"
            )
        );

    $("edit-preview-button")
        ?.addEventListener(
            "click",
            () => closePanel(
                "publication-preview-panel"
            )
        );

    $("confirm-publication-button")
        ?.addEventListener(
            "click",
            publishPublication
        );

    $("close-publication-detail")
        ?.addEventListener(
            "click",
            () => closePanel(
                "publication-detail-panel"
            )
        );

    $("publication-like-button")
        ?.addEventListener(
            "click",
            togglePublicationLike
        );

    $("publication-save-button")
        ?.addEventListener(
            "click",
            togglePublicationSave
        );

    $("publication-whatsapp-button")
        ?.addEventListener(
            "click",
            handleDetailWhatsApp
        );

    $("publication-chat-button")
        ?.addEventListener(
            "click",
            openPublicationChat
        );

    $("chat-input")
        ?.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter" &&
                    !event.shiftKey
                ) {
                    event.preventDefault();
                    sendChatMessage();
                }
            }
        );

    /*
     * Si existe un botón específico para enviar
     * mensajes, lo conectamos.
     */
    document
        .querySelector(
            "#send-chat-button"
        )
        ?.addEventListener(
            "click",
            sendChatMessage
        );

    $("chat-whatsapp-button")
        ?.addEventListener(
            "click",
            continueChatByWhatsApp
        );

    setupSearch();
    setupCategories();
}

/* =========================================================
   70. CERRAR CHAT
   ========================================================= */

$("close-chat-panel")
    ?.addEventListener(
        "click",
        () => {

            closePanel(
                "chat-panel"
            );

            if (
                MF.messageSubscription &&
                mfSupabase
            ) {

                mfSupabase.removeChannel(
                    MF.messageSubscription
                );

                MF.messageSubscription =
                    null;
            }
        }
    );

/* =========================================================
   71. CONECTAR EVENTOS DE PUBLICACIÓN
   ========================================================= */

const originalInitializeApplication =
    initializeApplication;

initializeApplication = async function () {

    await originalInitializeApplication();

    setupPublicationEvents();

    /*
     * Si la aplicación ya restauró una sesión,
     * cargamos nuevamente los datos con los
     * eventos de publicación conectados.
     */
    if (MF.user) {
        await loadDashboardData();
    }
};

/* =========================================================
   FIN DE LA PARTE 2/3
   ========================================================= *//* =========================================================
   MARKET FLASH
   SCRIPT.JS — PARTE 3/3
   FLASH + PAGOS + ADMINISTRACIÓN + NOTIFICACIONES
   ========================================================= */

/* =========================================================
   72. FLASH DEL DÍA
   ========================================================= */

async function loadTariffs() {

    if (!mfSupabase) return [];

    const {
        data,
        error
    } = await mfSupabase
        .from("flash_tariffs")
        .select("*")
        .eq("active", true)
        .order("sort_order", {
            ascending: true
        });

    if (error) {
        console.error(
            "Error cargando tarifas:",
            error
        );
        return [];
    }

    MF.tariffs = data || [];

    return MF.tariffs;
}

/* =========================================================
   73. MÉTODOS DE PAGO
   ========================================================= */

async function loadPaymentMethods() {

    if (!mfSupabase) return [];

    const {
        data,
        error
    } = await mfSupabase
        .from("payment_methods")
        .select("*")
        .eq("active", true)
        .order("sort_order", {
            ascending: true
        });

    if (error) {
        console.error(
            "Error cargando métodos de pago:",
            error
        );

        return [];
    }

    MF.paymentMethods = data || [];

    return MF.paymentMethods;
}

/* =========================================================
   74. ABRIR PANEL FLASH
   ========================================================= */

async function openPromotionPanel() {

    if (!MF.user) {
        showToast(
            "Debes iniciar sesión para promocionar.",
            "error"
        );
        return;
    }

    showLoading(
        true,
        "Cargando opciones de promoción..."
    );

    try {

        await loadTariffs();
        await loadPaymentMethods();

        renderPromotionTariffs();

        renderPaymentMethods();

        openPanel("promotion-panel");

    } finally {

        showLoading(false);
    }
}

/* =========================================================
   75. MOSTRAR TARIFAS
   ========================================================= */

function renderPromotionTariffs() {

    const form =
        $("promotion-form");

    if (!form) return;

    let container =
        document.querySelector(
            "#promotion-tariffs"
        );

    if (!container) {

        container =
            document.createElement("div");

        container.id =
            "promotion-tariffs";

        container.className =
            "promotion-tariffs";

        const price =
            $("promotion-price");

        if (price?.parentElement) {
            price.parentElement
                .insertBefore(
                    container,
                    price
                );
        } else {
            form.prepend(container);
        }
    }

    /*
     * Siempre mostramos las 3 tarifas.
     */
    const tariffs =
        MF.tariffs.slice(0, 3);

    container.innerHTML =
        tariffs
            .map(
                (tariff, index) => `
                    <button
                        type="button"
                        class="tariff-card ${
                            MF.selectedTariff?.id ===
                            tariff.id
                                ? "active"
                                : ""
                        }"
                        data-tariff-id="${escapeHTML(
                            tariff.id
                        )}"
                    >
                        <span>
                            ${escapeHTML(
                                tariff.name ||
                                `Tarifa ${index + 1}`
                            )}
                        </span>

                        <strong>
                            ${formatMoney(
                                tariff.price
                            )}
                        </strong>

                        <small>
                            ${escapeHTML(
                                tariff.description ||
                                "Promoción Flash"
                            )}
                        </small>
                    </button>
                `
            )
            .join("");

    container
        .querySelectorAll(
            "[data-tariff-id]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const tariff =
                        MF.tariffs.find(
                            item =>
                                String(
                                    item.id
                                ) ===
                                String(
                                    button.dataset
                                        .tariffId
                                )
                        );

                    if (!tariff) return;

                    MF.selectedTariff =
                        tariff;

                    if ($("promotion-price")) {
                        $("promotion-price")
                            .value =
                            tariff.price;
                    }

                    renderPromotionTariffs();
                }
            );
        });
}

/* =========================================================
   76. MOSTRAR MÉTODOS DE PAGO
   ========================================================= */

function renderPaymentMethods() {

    const container =
        $("payment-methods-list");

    if (!container) return;

    const methods =
        MF.paymentMethods.slice(0, 3);

    if (!methods.length) {

        container.innerHTML = `
            <div class="proof-empty">
                No hay métodos de pago disponibles.
            </div>
        `;

        return;
    }

    container.innerHTML =
        methods
            .map(
                (method, index) => `
                    <button
                        type="button"
                        class="payment-method-card ${
                            MF.selectedPaymentMethod?.id ===
                            method.id
                                ? "active"
                                : ""
                        }"
                        data-payment-method-id="${escapeHTML(
                            method.id
                        )}"
                    >

                        <span class="payment-method-icon">
                            ${
                                index === 0
                                    ? "🏦"
                                    : index === 1
                                        ? "💳"
                                        : "💰"
                            }
                        </span>

                        <span class="payment-method-content">
                            <strong>
                                ${escapeHTML(
                                    method.name
                                )}
                            </strong>

                            <small>
                                ${escapeHTML(
                                    method.details ||
                                    ""
                                )}
                            </small>
                        </span>

                        <span class="payment-method-arrow">
                            ›
                        </span>

                    </button>
                `
            )
            .join("");

    container
        .querySelectorAll(
            "[data-payment-method-id]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const method =
                        MF.paymentMethods.find(
                            item =>
                                String(
                                    item.id
                                ) ===
                                String(
                                    button.dataset
                                        .paymentMethodId
                                )
                        );

                    if (!method) return;

                    MF.selectedPaymentMethod =
                        method;

                    renderPaymentMethods();
                }
            );
        });
}

/* =========================================================
   77. CREAR SOLICITUD FLASH
   ========================================================= */

async function createFlashPaymentRequest() {

    if (!MF.user) {
        showToast(
            "Debes iniciar sesión.",
            "error"
        );
        return;
    }

    const title =
        getInputValue(
            "promotion-title"
        );

    const description =
        getInputValue(
            "promotion-description"
        );

    if (!title) {
        showToast(
            "Escribe el título de la promoción.",
            "error"
        );
        return;
    }

    if (!MF.selectedTariff) {
        showToast(
            "Selecciona una de las 3 tarifas.",
            "error"
        );
        return;
    }

    if (!MF.selectedPaymentMethod) {
        showToast(
            "Selecciona uno de los 3 métodos de pago.",
            "error"
        );
        return;
    }

    /*
     * Para Flash utilizamos una publicación existente
     * del usuario. Así no necesitamos crear una segunda
     * estructura de imágenes para la promoción.
     */
    const ownPublications =
        MF.publications.filter(
            publication =>
                publication.seller_id ===
                MF.user.id
        );

    if (!ownPublications.length) {
        showToast(
            "Primero debes tener una publicación para promocionarla.",
            "error"
        );
        return;
    }

    const publication =
        ownPublications[0];

    MF.currentPaymentRequest = {
        title,
        description,
        publication,
        tariff:
            MF.selectedTariff,
        paymentMethod:
            MF.selectedPaymentMethod
    };

    openPanel(
        "payment-proof-panel"
    );
}

/* =========================================================
   78. MOSTRAR COMPROBANTE
   ========================================================= */

function previewPaymentProof(event) {

    const file =
        event.target.files?.[0];

    const preview =
        $("payment-proof-preview");

    if (!preview) return;

    preview.innerHTML = "";

    if (!file) return;

    if (!isImageFile(file)) {
        showToast(
            "El comprobante debe ser una imagen.",
            "error"
        );

        event.target.value = "";
        return;
    }

    const image =
        document.createElement("img");

    image.className =
        "payment-proof-image";

    image.src =
        URL.createObjectURL(file);

    image.alt =
        "Vista previa del comprobante";

    preview.appendChild(image);
}

/* =========================================================
   79. SUBIR COMPROBANTE
   ========================================================= */

async function submitPaymentProof() {

    if (
        !MF.user ||
        !MF.currentPaymentRequest
    ) {
        return;
    }

    const file =
        $("payment-proof-file")
            ?.files?.[0];

    if (!file) {
        showToast(
            "Selecciona el comprobante de pago.",
            "error"
        );
        return;
    }

    if (!isImageFile(file)) {
        showToast(
            "El comprobante debe ser una imagen.",
            "error"
        );
        return;
    }

    showLoading(
        true,
        "Enviando comprobante..."
    );

    try {

        const request =
            MF.currentPaymentRequest;

        const path =
            `payments/${MF.user.id}/${Date.now()}-${safeFileName(file.name)}`;

        const {
            error: uploadError
        } = await mfSupabase.storage
            .from("payment-proofs")
            .upload(path, file, {
                cacheControl: "3600",
                upsert: false
            });

        if (uploadError) {
            throw uploadError;
        }

        const {
            data,
            error
        } = await mfSupabase
            .from("flash_payment_requests")
            .insert({
                user_id:
                    MF.user.id,

                publication_id:
                    request.publication.id,

                tariff_id:
                    request.tariff.id,

                payment_method_id:
                    request.paymentMethod.id,

                amount:
                    request.tariff.price,

                title:
                    request.title,

                description:
                    request.description,

                proof_path:
                    path,

                status:
                    "pending"
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        /*
         * Intentamos crear notificación.
         * Si RLS la bloquea, la solicitud sigue siendo válida.
         */
        try {

            await mfSupabase
                .from("notifications")
                .insert({
                    user_id:
                        MF.user.id,
                    type:
                        "flash_payment",
                    title:
                        "Solicitud Flash enviada",
                    body:
                        "Tu comprobante fue enviado y está pendiente de revisión.",
                    data: {
                        request_id:
                            data.id
                    }
                });

        } catch (notificationError) {

            console.warn(
                "No se pudo crear notificación:",
                notificationError
            );
        }

        MF.currentPaymentRequest = null;

        closePanel(
            "payment-proof-panel"
        );

        closePanel(
            "promotion-panel"
        );

        if ($("payment-proof-file")) {
            $("payment-proof-file").value = "";
        }

        showToast(
            "Comprobante enviado. El administrador revisará tu pago.",
            "success"
        );

    } catch (error) {

        console.error(error);

        showToast(
            error?.message ||
            "No se pudo enviar el comprobante.",
            "error"
        );

    } finally {

        showLoading(false);
    }
}

/* =========================================================
   80. CARGAR FLASH ACTIVOS
   ========================================================= */

async function renderFlashPromotions() {

    const container =
        $("flash-promotions-list");

    if (!container || !mfSupabase) {
        return;
    }

    const {
        data,
        error
    } = await mfSupabase
        .from("flash_promotions")
        .select("*")
        .eq("status", "active")
        .order("created_at", {
            ascending: false
        });

    if (error) {
        console.error(error);
        return;
    }

    const promotions =
        data || [];

    if (!promotions.length) {

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">
                    ⚡
                </div>

                <h3>
                    Flash del Día
                </h3>

                <p>
                    Todavía no hay promociones Flash activas.
                </p>
            </div>
        `;

        return;
    }

    /*
     * Buscamos las publicaciones asociadas.
     */
    const publicationIds =
        promotions
            .map(
                item =>
                    item.publication_id
            )
            .filter(Boolean);

    let publicationMap = {};

    if (publicationIds.length) {

        const {
            data: publicationData
        } = await mfSupabase
            .from("publications")
            .select("*")
            .in(
                "id",
                publicationIds
            );

        (publicationData || [])
            .forEach(
                publication => {
                    publicationMap[
                        publication.id
                    ] = publication;
                }
            );
    }

    container.innerHTML =
        promotions
            .map(
                promotion => {

                    const publication =
                        publicationMap[
                            promotion.publication_id
                        ];

                    if (!publication) {
                        return "";
                    }

                    return `
                        <article
                            class="flash-promotion-card"
                        >

                            <span class="flash-badge">
                                ⚡ FLASH DEL DÍA
                            </span>

                            <h3>
                                ${escapeHTML(
                                    promotion.title ||
                                    publication.title
                                )}
                            </h3>

                            <p>
                                ${escapeHTML(
                                    promotion.description ||
                                    publication.description ||
                                    ""
                                )}
                            </p>

                            <strong>
                                ${formatMoney(
                                    publication.price
                                )}
                            </strong>

                            <button
                                type="button"
                                class="primary-button"
                                data-flash-publication="${publication.id}"
                            >
                                Ver oferta
                            </button>

                        </article>
                    `;
                }
            )
            .join("");

    container
        .querySelectorAll(
            "[data-flash-publication]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    openPublicationDetail(
                        Number(
                            button.dataset
                                .flashPublication
                        )
                    );
                }
            );
        });
}

/* =========================================================
   81. ADMIN: ABRIR
   ========================================================= */

async function openAdministration() {

    if (!MF.isAdmin) {
        showToast(
            "No tienes permisos de administrador.",
            "error"
        );
        return;
    }

    openPanel(
        "administration-panel"
    );

    await loadAdminDashboard();
}

/* =========================================================
   82. ESTADÍSTICAS ADMIN
   ========================================================= */

async function loadAdminDashboard() {

    if (!MF.isAdmin) return;

    showLoading(
        true,
        "Cargando administración..."
    );

    try {

        await Promise.all([
            loadAdminStats(),
            loadAdminUsers(),
            loadAdminPublications(),
            loadAdminPaymentRequests(),
            loadAdminSettings()
        ]);

    } finally {

        showLoading(false);
    }
}

/* =========================================================
   83. ESTADÍSTICAS
   ========================================================= */

async function loadAdminStats() {

    const {
        data: profiles
    } = await mfSupabase
        .from("profiles")
        .select(
            "id,status"
        );

    const {
        data: publications
    } = await mfSupabase
        .from("publications")
        .select(
            "id,is_flash,status"
        );

    const users =
        profiles || [];

    const posts =
        publications || [];

    const activeUsers =
        users.filter(
            user =>
                user.status === "active"
        ).length;

    const deletedUsers =
        users.filter(
            user =>
                user.status === "deleted"
        ).length;

    const flashes =
        posts.filter(
            publication =>
                publication.is_flash === true
        ).length;

    if ($("admin-total-users")) {
        $("admin-total-users")
            .textContent =
            formatNumber(users.length);
    }

    if ($("admin-active-users")) {
        $("admin-active-users")
            .textContent =
            formatNumber(activeUsers);
    }

    if ($("admin-total-publications")) {
        $("admin-total-publications")
            .textContent =
            formatNumber(posts.length);
    }

    if ($("admin-total-flashes")) {
        $("admin-total-flashes")
            .textContent =
            formatNumber(flashes);
    }

    if ($("admin-deleted-users")) {
        $("admin-deleted-users")
            .textContent =
            formatNumber(deletedUsers);
    }
}

/* =========================================================
   84. ADMIN: USUARIOS
   ========================================================= */

async function loadAdminUsers(
    search = ""
) {

    if (!MF.isAdmin) return;

    const container =
        $("admin-users-list");

    if (!container) return;

    const {
        data,
        error
    } = await mfSupabase
        .from("profiles")
        .select("*")
        .order("created_at", {
            ascending: false
        });

    if (error) {
        console.error(error);
        return;
    }

    let users =
        data || [];

    const term =
        search
            .toLowerCase()
            .trim();

    if (term) {

        users =
            users.filter(
                user =>
                    safeText(
                        user.full_name
                    )
                        .toLowerCase()
                        .includes(term) ||

                    safeText(
                        user.cedula
                    )
                        .toLowerCase()
                        .includes(term) ||

                    safeText(
                        user.phone
                    )
                        .toLowerCase()
                        .includes(term)
            );
    }

    if (!users.length) {

        container.innerHTML = `
            <div class="proof-empty">
                No se encontraron usuarios.
            </div>
        `;

        return;
    }

    container.innerHTML =
        users
            .map(
                user => `

                    <article
                        class="admin-user-card"
                    >

                        <div class="admin-user-header">

                            <strong>
                                ${escapeHTML(
                                    user.full_name ||
                                    "Sin nombre"
                                )}
                            </strong>

                            <span
                                class="user-status user-status-${escapeHTML(
                                    user.status ||
                                    "active"
                                )}"
                            >
                                ${escapeHTML(
                                    user.status ||
                                    "active"
                                )}
                            </span>

                        </div>

                        <div class="admin-user-details">

                            <div>
                                Cédula:
                                ${escapeHTML(
                                    user.cedula ||
                                    "—"
                                )}
                            </div>

                            <div>
                                Teléfono:
                                ${escapeHTML(
                                    user.phone ||
                                    "—"
                                )}
                            </div>

                            <div>
                                Registro:
                                ${formatDateTime(
                                    user.created_at
                                )}
                            </div>

                            <div>
                                Última conexión:
                                ${formatDateTime(
                                    user.last_seen_at
                                )}
                            </div>

                            <div>
                                Rol:
                                ${escapeHTML(
                                    user.role ||
                                    "user"
                                )}
                            </div>

                        </div>

                        <div class="admin-user-actions">

                            ${
                                user.id !==
                                MF.user?.id
                                    ? `
                                        <button
                                            type="button"
                                            class="admin-action-button"
                                            data-user-action="block"
                                            data-user-id="${user.id}"
                                        >
                                            Bloquear
                                        </button>

                                        <button
                                            type="button"
                                            class="admin-action-button"
                                            data-user-action="suspend"
                                            data-user-id="${user.id}"
                                        >
                                            Suspender
                                        </button>

                                        <button
                                            type="button"
                                            class="admin-action-button"
                                            data-user-action="review"
                                            data-user-id="${user.id}"
                                        >
                                            En revisión
                                        </button>

                                        <button
                                            type="button"
                                            class="admin-action-button"
                                            data-user-action="active"
                                            data-user-id="${user.id}"
                                        >
                                            Reactivar
                                        </button>

                                        <button
                                            type="button"
                                            class="admin-action-button danger"
                                            data-user-action="delete"
                                            data-user-id="${user.id}"
                                        >
                                            Eliminar
                                        </button>
                                    `
                                    : `
                                        <span class="admin-account-main-label">
                                            Tu cuenta de administrador
                                        </span>
                                    `
                            }

                        </div>

                    </article>
                `
            )
            .join("");

    container
        .querySelectorAll(
            "[data-user-action]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    updateAdminUserStatus(
                        button.dataset.userId,
                        button.dataset.userAction
                    );
                }
            );
        });
}

/* =========================================================
   85. CAMBIAR ESTADO USUARIO
   ========================================================= */

async function updateAdminUserStatus(
    userId,
    action
) {

    if (!MF.isAdmin) return;

    if (
        String(userId) ===
        String(MF.user?.id)
    ) {
        showToast(
            "No puedes modificar tu propia cuenta desde aquí.",
            "error"
        );
        return;
    }

    let status =
        action;

    if (action === "delete") {

        const confirmed =
            window.confirm(
                "¿Seguro que quieres eliminar este usuario?"
            );

        if (!confirmed) return;

        status = "deleted";
    }

    const {
        error
    } = await mfSupabase
        .from("profiles")
        .update({
            status
        })
        .eq(
            "id",
            userId
        );

    if (error) {
        console.error(error);

        showToast(
            "No se pudo cambiar el estado del usuario.",
            "error"
        );

        return;
    }

    showToast(
        "Estado del usuario actualizado.",
        "success"
    );

    await loadAdminUsers();
    await loadAdminStats();
}

/* =========================================================
   86. ADMIN: PUBLICACIONES
   ========================================================= */

async function loadAdminPublications() {

    if (!MF.isAdmin) return;

    const container =
        $("admin-publications-list");

    if (!container) return;

    const {
        data,
        error
    } = await mfSupabase
        .from("publications")
        .select("*")
        .order("created_at", {
            ascending: false
        });

    if (error) {
        console.error(error);
        return;
    }

    const posts =
        data || [];

    if (!posts.length) {

        container.innerHTML = `
            <div class="proof-empty">
                No hay publicaciones.
            </div>
        `;

        return;
    }

    container.innerHTML =
        posts
            .map(
                post => `

                    <article
                        class="admin-publication-card"
                    >

                        <div class="admin-publication-header">

                            <strong>
                                ${escapeHTML(
                                    post.title
                                )}
                            </strong>

                            <span
                                class="publication-status publication-status-${escapeHTML(
                                    post.status ||
                                    "published"
                                )}"
                            >
                                ${escapeHTML(
                                    post.status ||
                                    "published"
                                )}
                            </span>

                        </div>

                        <div class="admin-publication-info">

                            <div>
                                Categoría:
                                ${escapeHTML(
                                    post.category ||
                                    "—"
                                )}
                            </div>

                            <div>
                                Precio:
                                ${formatMoney(
                                    post.price
                                )}
                            </div>

                            <div>
                                Publicada:
                                ${formatDateTime(
                                    post.created_at
                                )}
                            </div>

                        </div>

                        <div class="admin-publication-metrics">

                            👁️ ${formatNumber(
                                post.views_count
                            )}

                            ❤️ ${formatNumber(
                                post.likes_count
                            )}

                            🔖 ${formatNumber(
                                post.saves_count
                            )}

                        </div>

                        <div class="admin-user-actions">

                            <button
                                type="button"
                                data-post-action="review"
                                data-post-id="${post.id}"
                            >
                                En revisión
                            </button>

                            <button
                                type="button"
                                data-post-action="published"
                                data-post-id="${post.id}"
                            >
                                Publicar
                            </button>

                            ${
                                post.status ===
                                "deleted"
                                    ? `
                                        <button
                                            type="button"
                                            data-post-action="restore"
                                            data-post-id="${post.id}"
                                        >
                                            Reactivar
                                        </button>
                                    `
                                    : `
                                        <button
                                            type="button"
                                            class="danger"
                                            data-post-action="delete"
                                            data-post-id="${post.id}"
                                        >
                                            Eliminar
                                        </button>
                                    `
                            }

                        </div>

                    </article>
                `
            )
            .join("");

    container
        .querySelectorAll(
            "[data-post-action]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    updateAdminPublication(
                        button.dataset.postId,
                        button.dataset.postAction
                    );
                }
            );
        });
}

/* =========================================================
   87. CAMBIAR PUBLICACIÓN
   ========================================================= */

async function updateAdminPublication(
    publicationId,
    action
) {

    if (!MF.isAdmin) return;

    let status =
        action;

    if (action === "restore") {
        status = "published";
    }

    if (action === "delete") {

        const confirmed =
            window.confirm(
                "¿Eliminar esta publicación?"
            );

        if (!confirmed) return;

        status = "deleted";
    }

    const update = {
        status
    };

    if (status === "deleted") {
        update.is_flash = false;
    }

    const {
        error
    } = await mfSupabase
        .from("publications")
        .update(update)
        .eq(
            "id",
            publicationId
        );

    if (error) {
        console.error(error);

        showToast(
            "No se pudo actualizar la publicación.",
            "error"
        );

        return;
    }

    /*
     * Si fue eliminada, cancelamos sus Flash activos.
     */
    if (status === "deleted") {

        await mfSupabase
            .from("flash_promotions")
            .update({
                status: "cancelled"
            })
            .eq(
                "publication_id",
                publicationId
            )
            .eq(
                "status",
                "active"
            );
    }

    showToast(
        "Publicación actualizada.",
        "success"
    );

    await loadAdminPublications();
    await loadAdminStats();
}

/* =========================================================
   88. ADMIN: COMPROBANTES
   ========================================================= */

async function loadAdminPaymentRequests() {

    if (!MF.isAdmin) return;

    const container =
        $("admin-payment-proofs-list");

    if (!container) return;

    const {
        data,
        error
    } = await mfSupabase
        .from("flash_payment_requests")
        .select("*")
        .order("created_at", {
            ascending: false
        });

    if (error) {
        console.error(error);
        return;
    }

    const requests =
        data || [];

    const pending =
        requests.filter(
            request =>
                request.status === "pending"
        );

    if ($("pending-proof-count")) {
        $("pending-proof-count")
            .textContent =
            formatNumber(
                pending.length
            );
    }

    if (!requests.length) {

        container.innerHTML = `
            <div class="proof-empty">
                No hay comprobantes.
            </div>
        `;

        return;
    }

    container.innerHTML =
        requests
            .map(
                request => `

                    <article
                        class="admin-payment-card"
                    >

                        <div class="admin-payment-header">

                            <strong>
                                ${escapeHTML(
                                    request.title ||
                                    "Solicitud Flash"
                                )}
                            </strong>

                            <span
                                class="payment-status payment-status-${escapeHTML(
                                    request.status
                                )}"
                            >
                                ${escapeHTML(
                                    request.status
                                )}
                            </span>

                        </div>

                        <div class="admin-payment-info">

                            <div>
                                Monto:
                                <strong>
                                    ${formatMoney(
                                        request.amount
                                    )}
                                </strong>
                            </div>

                            <div>
                                Fecha:
                                ${formatDateTime(
                                    request.created_at
                                )}
                            </div>

                        </div>

                        ${
                            request.status ===
                            "pending"
                                ? `
                                    <div class="admin-payment-actions">

                                        <button
                                            type="button"
                                            data-proof-action="view"
                                            data-proof-id="${request.id}"
                                        >
                                            Ver comprobante
                                        </button>

                                        <button
                                            type="button"
                                            data-proof-action="reject"
                                            data-proof-id="${request.id}"
                                        >
                                            Rechazar
                                        </button>

                                        <button
                                            type="button"
                                            data-proof-action="accept"
                                            data-proof-id="${request.id}"
                                        >
                                            Aceptar
                                        </button>

                                    </div>
                                `
                                : ""
                        }

                    </article>
                `
            )
            .join("");

    container
        .querySelectorAll(
            "[data-proof-action]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const id =
                        Number(
                            button.dataset
                                .proofId
                        );

                    const action =
                        button.dataset
                            .proofAction;

                    const request =
                        requests.find(
                            item =>
                                Number(
                                    item.id
                                ) === id
                        );

                    if (!request) return;

                    if (action === "view") {
                        openAdminProofDetail(
                            request
                        );
                    }

                    if (action === "reject") {
                        rejectPaymentRequest(
                            request
                        );
                    }

                    if (action === "accept") {
                        acceptPaymentRequest(
                            request
                        );
                    }
                }
            );
        });
}

/* =========================================================
   89. DETALLE COMPROBANTE
   ========================================================= */

async function openAdminProofDetail(
    request
) {

    const container =
        $("admin-proof-detail");

    if (!container) return;

    let imageUrl = "";

    if (request.proof_path) {

        imageUrl =
            await getSignedStorageUrl(
                "payment-proofs",
                request.proof_path
            );
    }

    container.innerHTML = `

        <div class="proof-detail-block">

            <h3>
                ${escapeHTML(
                    request.title ||
                    "Solicitud Flash"
                )}
            </h3>

            <p class="proof-detail-description">
                ${escapeHTML(
                    request.description ||
                    "Sin descripción."
                )}
            </p>

            <p>
                Monto:
                <strong>
                    ${formatMoney(
                        request.amount
                    )}
                </strong>
            </p>

            <p>
                Fecha:
                ${formatDateTime(
                    request.created_at
                )}
            </p>

            ${
                imageUrl
                    ? `
                        <img
                            class="payment-proof-image"
                            src="${escapeHTML(
                                imageUrl
                            )}"
                            alt="Comprobante de pago"
                        >
                    `
                    : `
                        <div class="proof-empty">
                            No se pudo abrir el comprobante.
                        </div>
                    `
            }

        </div>
    `;

    openPanel(
        "admin-proof-detail-panel"
    );

    const accept =
        $("accept-proof-button");

    const reject =
        $("reject-proof-button");

    const view =
        $("view-proof-button");

    if (accept) {
        accept.onclick =
            () => acceptPaymentRequest(
                request
            );
    }

    if (reject) {
        reject.onclick =
            () => rejectPaymentRequest(
                request
            );
    }

    if (view) {

        view.onclick = async () => {

            if (!imageUrl) return;

            if ($("proof-fullscreen-image")) {
                $("proof-fullscreen-image")
                    .src = imageUrl;
            }

            openPanel(
                "proof-fullscreen-viewer"
            );
        };
    }
}

/* =========================================================
   90. RECHAZAR PAGO
   ========================================================= */

async function rejectPaymentRequest(
    request
) {

    if (!MF.isAdmin) return;

    const confirmed =
        window.confirm(
            "¿Rechazar este comprobante?"
        );

    if (!confirmed) return;

    const {
        error
    } = await mfSupabase
        .from("flash_payment_requests")
        .update({
            status: "rejected",
            reviewed_by:
                MF.user.id,
            reviewed_at:
                new Date().toISOString()
        })
        .eq(
            "id",
            request.id
        );

    if (error) {
        console.error(error);

        showToast(
            "No se pudo rechazar el comprobante.",
            "error"
        );

        return;
    }

    showToast(
        "Comprobante rechazado.",
        "success"
    );

    closePanel(
        "admin-proof-detail-panel"
    );

    await loadAdminPaymentRequests();
}

/* =========================================================
   91. ACEPTAR PAGO
   ========================================================= */

async function acceptPaymentRequest(
    request
) {

    if (!MF.isAdmin) return;

    const confirmed =
        window.confirm(
            "¿Aceptar este comprobante y activar la promoción Flash?"
        );

    if (!confirmed) return;

    showLoading(
        true,
        "Activando promoción..."
    );

    let promotionId = null;

    try {

        /*
         * Primero creamos la promoción.
         */
        const {
            data: promotion,
            error: promotionError
        } = await mfSupabase
            .from("flash_promotions")
            .insert({
                publication_id:
                    request.publication_id,

                user_id:
                    request.user_id,

                tariff_id:
                    request.tariff_id,

                payment_request_id:
                    request.id,

                title:
                    request.title,

                description:
                    request.description,

                status:
                    "active"
            })
            .select()
            .single();

        if (promotionError) {
            throw promotionError;
        }

        promotionId =
            promotion.id;

        /*
         * Marcamos la publicación como Flash.
         */
        const {
            error: publicationError
        } = await mfSupabase
            .from("publications")
            .update({
                is_flash: true
            })
            .eq(
                "id",
                request.publication_id
            );

        if (publicationError) {
            throw publicationError;
        }

        /*
         * Finalmente aprobamos el pago.
         */
        const {
            error: requestError
        } = await mfSupabase
            .from("flash_payment_requests")
            .update({
                status: "approved",
                reviewed_by:
                    MF.user.id,
                reviewed_at:
                    new Date().toISOString()
            })
            .eq(
                "id",
                request.id
            );

        if (requestError) {
            throw requestError;
        }

        showToast(
            "¡Pago aceptado y Flash activado!",
            "success"
        );

        closePanel(
            "admin-proof-detail-panel"
        );

        await loadAdminPaymentRequests();
        await loadAdminPublications();
        await loadAdminStats();
        await renderFlashPromotions();

    } catch (error) {

        console.error(error);

        /*
         * Si falló después de crear la promoción,
         * intentamos eliminarla para mantener consistencia.
         */
        if (promotionId) {

            await mfSupabase
                .from("flash_promotions")
                .delete()
                .eq(
                    "id",
                    promotionId
                );
        }

        showToast(
            "No se pudo activar la promoción.",
            "error"
        );

    } finally {

        showLoading(false);
    }
}

/* =========================================================
   92. CONFIGURACIÓN ADMIN
   ========================================================= */

async function loadAdminSettings() {

    if (!MF.isAdmin) return;

    const {
        data,
        error
    } = await mfSupabase
        .from("admin_settings")
        .select("*")
        .eq(
            "id",
            "main"
        )
        .maybeSingle();

    if (error) {
        console.error(error);
    }

    if (data) {

        if ($("admin-username")) {
            $("admin-username").value =
                data.username || "";
        }
    }

    await loadAdminTariffSettings();
    await loadAdminPaymentSettings();
}

/* =========================================================
   93. CONFIGURAR TARIFAS ADMIN
   ========================================================= */

async function loadAdminTariffSettings() {

    await loadTariffs();

    const tariffs =
        MF.tariffs.slice(0, 3);

    tariffs.forEach(
        (tariff, index) => {

            const input =
                $(
                    `membership-price-${index + 1}`
                );

            if (input) {
                input.value =
                    tariff.price;
            }
        }
    );
}

/* =========================================================
   94. GUARDAR TARIFAS
   ========================================================= */

async function saveAdminTariffs() {

    if (!MF.isAdmin) return;

    await loadTariffs();

    const tariffs =
        MF.tariffs.slice(0, 3);

    for (
        let index = 0;
        index < 3;
        index++
    ) {

        const tariff =
            tariffs[index];

        const input =
            $(
                `membership-price-${index + 1}`
            );

        if (!tariff || !input) {
            continue;
        }

        const price =
            Number(input.value);

        if (
            !Number.isFinite(price) ||
            price < 0
        ) {
            showToast(
                "Introduce precios válidos.",
                "error"
            );
            return;
        }

        const {
            error
        } = await mfSupabase
            .from("flash_tariffs")
            .update({
                price
            })
            .eq(
                "id",
                tariff.id
            );

        if (error) {
            console.error(error);

            showToast(
                "No se pudieron guardar las tarifas.",
                "error"
            );

            return;
        }
    }

    await loadTariffs();

    showToast(
        "Las 3 tarifas fueron actualizadas.",
        "success"
    );
}

/* =========================================================
   95. MÉTODOS DE PAGO ADMIN
   ========================================================= */

async function loadAdminPaymentSettings() {

    await loadPaymentMethods();

    const container =
        $("admin-payment-methods-list");

    if (!container) return;

    const methods =
        MF.paymentMethods.slice(0, 3);

    container.innerHTML =
        methods
            .map(
                (method, index) => `

                    <div
                        class="admin-payment-method-edit"
                    >

                        <strong>
                            Método ${index + 1}
                        </strong>

                        <input
                            type="text"
                            class="payment-method-name-input"
                            data-method-name="${escapeHTML(
                                method.id
                            )}"
                            value="${escapeHTML(
                                method.name || ""
                            )}"
                            placeholder="Nombre del banco o método"
                        >

                        <textarea
                            class="payment-method-details-input"
                            data-method-details="${escapeHTML(
                                method.id
                            )}"
                            placeholder="Detalles para realizar el pago"
                        >${escapeHTML(
                            method.details || ""
                        )}</textarea>

                        <label class="admin-toggle-row">

                            <input
                                type="checkbox"
                                data-method-active="${escapeHTML(
                                    method.id
                                )}"
                                ${
                                    method.active
                                        ? "checked"
                                        : ""
                                }
                            >

                            Método activo

                        </label>

                    </div>
                `
            )
            .join("");
}

/* =========================================================
   96. GUARDAR MÉTODOS DE PAGO
   ========================================================= */

async function saveAdminPaymentMethods() {

    if (!MF.isAdmin) return;

    await loadPaymentMethods();

    const methods =
        MF.paymentMethods.slice(0, 3);

    for (const method of methods) {

        const nameInput =
            document.querySelector(
                `[data-method-name="${CSS.escape(
                    String(method.id)
                )}"]`
            );

        const detailsInput =
            document.querySelector(
                `[data-method-details="${CSS.escape(
                    String(method.id)
                )}"]`
            );

        const activeInput =
            document.querySelector(
                `[data-method-active="${CSS.escape(
                    String(method.id)
                )}"]`
            );

        if (!nameInput) continue;

        const {
            error
        } = await mfSupabase
            .from("payment_methods")
            .update({
                name:
                    nameInput.value.trim(),

                details:
                    detailsInput?.value.trim() ||
                    "",

                active:
                    activeInput?.checked ??
                    true
            })
            .eq(
                "id",
                method.id
            );

        if (error) {
            console.error(error);

            showToast(
                "No se pudieron guardar los métodos de pago.",
                "error"
            );

            return;
        }
    }

    await loadPaymentMethods();

    showToast(
        "Los 3 métodos de pago fueron actualizados.",
        "success"
    );
}

/* =========================================================
   97. CREDENCIALES PRINCIPALES ADMIN
   ========================================================= */

async function saveAdminCredentials() {

    if (!MF.isAdmin || !MF.user) return;

    const username =
        getInputValue(
            "admin-username"
        );

    const password =
        $("admin-password")?.value || "";

    if (!username) {
        showToast(
            "Introduce un usuario de administrador.",
            "error"
        );
        return;
    }

    const {
        error: settingsError
    } = await mfSupabase
        .from("admin_settings")
        .update({
            username
        })
        .eq(
            "id",
            "main"
        );

    if (settingsError) {
        console.error(settingsError);

        showToast(
            "No se pudo guardar el usuario administrador.",
            "error"
        );

        return;
    }

    /*
     * La contraseña NO se guarda en admin_settings
     * ni en localStorage.
     *
     * Se cambia directamente en Auth.
     */
    if (password) {

        if (password.length < 6) {
            showToast(
                "La nueva contraseña debe tener al menos 6 caracteres.",
                "error"
            );
            return;
        }

        const {
            error
        } = await mfSupabase.auth.updateUser({
            password
        });

        if (error) {
            console.error(error);

            showToast(
                "No se pudo cambiar la contraseña.",
                "error"
            );

            return;
        }

        if ($("admin-password")) {
            $("admin-password").value = "";
        }
    }

    showToast(
        "Configuración del administrador guardada.",
        "success"
    );
}

/* =========================================================
   98. CREAR ADMINISTRADOR ADICIONAL
   ========================================================= */

function openCreateAdminPanel() {

    if (!MF.isAdmin) {
        showToast(
            "Solo un administrador puede crear otro administrador.",
            "error"
        );
        return;
    }

    /*
     * Si el formulario todavía no existe en el HTML,
     * lo creamos para mantener compatibilidad.
     */
    if (!$("create-admin-form")) {

        const panel =
            $("create-admin-panel");

        if (!panel) {
            showToast(
                "No se encontró el panel de creación de administrador.",
                "error"
            );
            return;
        }

        panel.innerHTML = `

            <div class="panel-header">

                <h2>
                    Crear administrador
                </h2>

                <button
                    type="button"
                    id="close-create-admin-generated"
                >
                    ×
                </button>

            </div>

            <form id="create-admin-form">

                <input
                    id="create-admin-name"
                    type="text"
                    placeholder="Nombre completo"
                    required
                >

                <input
                    id="create-admin-cedula"
                    type="text"
                    placeholder="Cédula"
                    required
                >

                <input
                    id="create-admin-phone"
                    type="tel"
                    placeholder="WhatsApp / teléfono"
                    required
                >

                <input
                    id="create-admin-password"
                    type="password"
                    placeholder="Contraseña"
                    minlength="6"
                    required
                >

                <button
                    type="submit"
                    class="primary-button"
                >
                    Crear administrador
                </button>

            </form>
        `;

        $("close-create-admin-generated")
            ?.addEventListener(
                "click",
                () => closePanel(
                    "create-admin-panel"
                )
            );

        $("create-admin-form")
            ?.addEventListener(
                "submit",
                handleCreateAdmin
            );
    }

    openPanel(
        "create-admin-panel"
    );
}

/* =========================================================
   99. PROCESAR NUEVO ADMIN
   ========================================================= */

async function handleCreateAdmin(
    event
) {

    event.preventDefault();

    if (!MF.isAdmin || !MF.user) {
        return;
    }

    const name =
        getInputValue(
            "create-admin-name"
        );

    const cedula =
        getInputValue(
            "create-admin-cedula"
        );

    const phone =
        getInputValue(
            "create-admin-phone"
        );

    const password =
        $("create-admin-password")
            ?.value || "";

    if (
        !name ||
        !cedula ||
        !phone ||
        !password
    ) {
        showToast(
            "Completa todos los campos.",
            "error"
        );
        return;
    }

    if (password.length < 6) {
        showToast(
            "La contraseña debe tener al menos 6 caracteres.",
            "error"
        );
        return;
    }

    /*
     * Guardamos la sesión actual.
     */
    const {
        data: sessionData
    } = await mfSupabase.auth.getSession();

    const oldSession =
        sessionData?.session;

    showLoading(
        true,
        "Creando administrador..."
    );

    try {

        const internalEmail =
            `${cedula.replace(
                /\D/g,
                ""
            )}@marketflash.local`;

        const {
            data,
            error
        } = await mfSupabase.auth.signUp({
            email:
                internalEmail,
            password,
            options: {
                data: {
                    full_name:
                        name,
                    cedula:
                        cedula,
                    phone:
                        phone
                }
            }
        });

        if (error) {
            throw error;
        }

        if (!data?.user) {
            throw new Error(
                "Supabase no entregó una sesión para el nuevo administrador."
            );
        }

        const newUserId =
            data.user.id;

        /*
         * La sesión puede haber cambiado al nuevo usuario.
         */
        const {
            error: profileError
        } = await mfSupabase
            .from("profiles")
            .update({
                role: "admin",
                is_admin: true,
                status: "active"
            })
            .eq(
                "id",
                newUserId
            );

        if (profileError) {
            /*
             * Si RLS impide esto, se informa.
             * No intentamos saltarnos la seguridad.
             */
            throw profileError;
        }

        /*
         * Restauramos la sesión del administrador principal.
         */
        if (oldSession) {

            await mfSupabase.auth.setSession({
                access_token:
                    oldSession.access_token,

                refresh_token:
                    oldSession.refresh_token
            });
        }

        await loadProfile(
            MF.user.id
        );

        showToast(
            "Administrador creado correctamente.",
            "success"
        );

        closePanel(
            "create-admin-panel"
        );

        await loadAdminAccounts();

    } catch (error) {

        console.error(error);

        /*
         * Intentamos volver a la sesión principal.
         */
        if (oldSession) {

            try {

                await mfSupabase.auth.setSession({
                    access_token:
                        oldSession.access_token,

                    refresh_token:
                        oldSession.refresh_token
                });

            } catch (restoreError) {

                console.error(
                    restoreError
                );
            }
        }

        showToast(
            error?.message ||
            "No se pudo crear el administrador.",
            "error"
        );

    } finally {

        showLoading(false);
    }
}

/* =========================================================
   100. LISTA DE ADMINISTRADORES
   ========================================================= */

async function loadAdminAccounts() {

    const container =
        $("admin-list");

    if (!container || !MF.isAdmin) {
        return;
    }

    const {
        data,
        error
    } = await mfSupabase
        .from("profiles")
        .select(
            "id,full_name,cedula,phone,role,is_admin,status,created_at,last_seen_at"
        )
        .eq(
            "is_admin",
            true
        )
        .order(
            "created_at",
            {
                ascending: true
            }
        );

    if (error) {
        console.error(error);
        return;
    }

    container.innerHTML =
        (data || [])
            .map(
                account => `

                    <article
                        class="admin-account-card"
                    >

                        <div class="admin-account-header">

                            <strong>
                                ${escapeHTML(
                                    account.full_name ||
                                    "Administrador"
                                )}
                            </strong>

                            <span class="admin-badge">
                                ADMIN
                            </span>

                        </div>

                        <div class="admin-account-details">

                            Cédula:
                            ${escapeHTML(
                                account.cedula ||
                                "—"
                            )}

                            <br>

                            Teléfono:
                            ${escapeHTML(
                                account.phone ||
                                "—"
                            )}

                            <br>

                            Registro:
                            ${formatDateTime(
                                account.created_at
                            )}

                            <br>

                            Última conexión:
                            ${formatDateTime(
                                account.last_seen_at
                            )}

                        </div>

                    </article>
                `
            )
            .join("");
}

/* =========================================================
   101. NOTIFICACIONES
   ========================================================= */

async function loadNotifications() {

    if (!MF.user || !mfSupabase) {
        return;
    }

    const {
        data,
        error
    } = await mfSupabase
        .from("notifications")
        .select("*")
        .eq(
            "user_id",
            MF.user.id
        )
        .order(
            "created_at",
            {
                ascending: false
            }
        )
        .limit(50);

    if (error) {
        console.warn(
            "No se pudieron cargar notificaciones:",
            error
        );
        return;
    }

    MF.notifications =
        data || [];

    renderNotifications();
}

/* =========================================================
   102. MOSTRAR NOTIFICACIONES
   ========================================================= */

function renderNotifications() {

    const container =
        $("notifications-list");

    if (!container) return;

    if (!MF.notifications.length) {

        container.innerHTML = `
            <div class="notification-empty">
                No tienes notificaciones.
            </div>
        `;

        return;
    }

    container.innerHTML =
        MF.notifications
            .map(
                notification => `

                    <article
                        class="notification-card ${
                            notification.read_at
                                ? ""
                                : "unread"
                        }"
                    >

                        <div class="notification-icon">
                            🔔
                        </div>

                        <div class="notification-content">

                            <strong>
                                ${escapeHTML(
                                    notification.title ||
                                    "Notificación"
                                )}
                            </strong>

                            <p>
                                ${escapeHTML(
                                    notification.body ||
                                    ""
                                )}
                            </p>

                            <small>
                                ${formatDateTime(
                                    notification.created_at
                                )}
                            </small>

                        </div>

                    </article>
                `
            )
            .join("");
}

/* =========================================================
   103. MARCAR NOTIFICACIÓN LEÍDA
   ========================================================= */

async function markNotificationRead(
    notificationId
) {

    if (!MF.user) return;

    const {
        error
    } = await mfSupabase
        .from("notifications")
        .update({
            read_at:
                new Date().toISOString()
        })
        .eq(
            "id",
            notificationId
        )
        .eq(
            "user_id",
            MF.user.id
        );

    if (error) {
        console.warn(error);
        return;
    }

    await loadNotifications();
}

/* =========================================================
   104. EVENTOS ADMIN
   ========================================================= */

function setupAdminEvents() {

    $("administration-button")
        ?.addEventListener(
            "click",
            openAdministration
        );

    $("close-administration-panel")
        ?.addEventListener(
            "click",
            () => closePanel(
                "administration-panel"
            )
        );

    $("create-admin-button")
        ?.addEventListener(
            "click",
            openCreateAdminPanel
        );

    $("admin-users-button")
        ?.addEventListener(
            "click",
            () => loadAdminUsers()
        );

    $("save-membership-settings")
        ?.addEventListener(
            "click",
            saveAdminTariffs
        );

    $("save-payment-methods-button")
        ?.addEventListener(
            "click",
            saveAdminPaymentMethods
        );

    $("save-admin-credentials-button")
        ?.addEventListener(
            "click",
            saveAdminCredentials
        );

    $("close-admin-proof-detail")
        ?.addEventListener(
            "click",
            () => closePanel(
                "admin-proof-detail-panel"
            )
        );

    $("close-proof-fullscreen")
        ?.addEventListener(
            "click",
            () => closePanel(
                "proof-fullscreen-viewer"
            )
        );

    $("add-payment-method-button")
        ?.addEventListener(
            "click",
            () => {

                showToast(
                    "Market Flash utiliza exactamente 3 métodos de pago editables.",
                    "info"
                );
            }
        );

    /*
     * Buscador administrativo.
     */
    const adminSearch =
        $("admin-user-search");

    adminSearch?.addEventListener(
        "input",
        event => {

            loadAdminUsers(
                event.target.value
            );
        }
    );
}

/* =========================================================
   105. EVENTOS FLASH Y PAGOS
   ========================================================= */

function setupPromotionEvents() {

    $("close-promotion-panel")
        ?.addEventListener(
            "click",
            () => closePanel(
                "promotion-panel"
            )
        );

    $("promotion-form")
        ?.addEventListener(
            "submit",
            event => {

                event.preventDefault();

                createFlashPaymentRequest();
            }
        );

    $("close-payment-method-panel")
        ?.addEventListener(
            "click",
            () => closePanel(
                "payment-method-panel"
            )
        );

    $("close-payment-proof-panel")
        ?.addEventListener(
            "click",
            () => closePanel(
                "payment-proof-panel"
            )
        );

    $("payment-proof-file")
        ?.addEventListener(
            "change",
            previewPaymentProof
        );

    $("send-payment-proof-button")
        ?.addEventListener(
            "click",
            submitPaymentProof
        );
}

/* =========================================================
   106. EVENTOS EXTRA
   ========================================================= */

function setupExtraEvents() {

    /*
     * Botones de cerrar genéricos.
     */
    document
        .querySelectorAll(
            "[data-close-panel]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const target =
                        button.dataset
                            .closePanel;

                    if (target) {
                        closePanel(target);
                    }
                }
            );
        });
}

/* =========================================================
   107. RECONSTRUIR ARRANQUE
   ========================================================= */

const mfOriginalInitialize =
    initializeApplication;

/*
 * La PARTE 1 ya contiene el arranque.
 * Aquí añadimos los eventos que dependen de
 * las funciones de las partes 2 y 3.
 */
initializeApplication =
    async function () {

        await mfOriginalInitialize();

        setupPublicationEvents();
        setupPromotionEvents();
        setupAdminEvents();
        setupExtraEvents();

        if (MF.user) {

            await loadDashboardData();
            await loadNotifications();

            if (MF.isAdmin) {
                await loadAdminAccounts();
            }
        }
    };

/* =========================================================
   108. EVITAR DOBLE REGISTRO DE EVENTOS
   ========================================================= */

window.MarketFlash = {
    state: MF,

    reload: async function () {

        if (!MF.user) return;

        await loadDashboardData();
        await loadNotifications();

        if (MF.isAdmin) {
            await loadAdminDashboard();
        }
    },

    logout: logoutUser,

    openProfile: openProfilePanel,

    openPublication:
        openPublicationPanel,

    openAdmin:
        openAdministration
};

/* =========================================================
   109. ARRANQUE FINAL DE SEGURIDAD
   ========================================================= */

if (
    document.readyState !==
    "loading"
) {

    /*
     * Los eventos de la PARTE 3 se conectan aquí
     * si el documento ya estaba cargado.
     */
    setTimeout(
        () => {

            setupPromotionEvents();
            setupAdminEvents();
            setupExtraEvents();

        },
        0
    );
}

/* =========================================================
   110. FIN DEL SCRIPT.JS
   ========================================================= */
/* =========================================================
   MARKET FLASH - CORRECCIÓN DE ARRANQUE
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    const welcome = document.getElementById("welcome-screen");
    const login = document.getElementById("login-screen");
    const register = document.getElementById("register-screen");
    const dashboard = document.getElementById("dashboard-screen");

    const loginButton = document.getElementById("login-button");
    const registerButton = document.getElementById("register-button");

    const backLogin = document.getElementById("back-from-login");
    const backRegister = document.getElementById("back-from-register");

    const publishButton = document.getElementById("create-publication-button");
    const publicationPanel = document.getElementById("publication-panel");
    const closePublication = document.getElementById("close-publication-panel");
    const cancelPublication = document.getElementById("cancel-publication-button");

    function hideAllScreens() {
        [welcome, login, register, dashboard].forEach(el => {
            if (el) el.style.display = "none";
        });
    }

    function showWelcome() {
        hideAllScreens();
        if (welcome) welcome.style.display = "";
    }

    function showLogin() {
        hideAllScreens();
        if (login) login.style.display = "";
    }

    function showRegister() {
        hideAllScreens();
        if (register) register.style.display = "";
    }

    function showDashboard() {
        hideAllScreens();
        if (dashboard) dashboard.style.display = "";
    }

    /* BOTÓN INICIAR SESIÓN */
    if (loginButton) {
        loginButton.addEventListener("click", () => {
            showLogin();
        });
    }

    /* BOTÓN CREAR CUENTA */
    if (registerButton) {
        registerButton.addEventListener("click", () => {
            showRegister();
        });
    }

    /* VOLVER DESDE LOGIN */
    if (backLogin) {
        backLogin.addEventListener("click", () => {
            showWelcome();
        });
    }

    /* VOLVER DESDE REGISTRO */
    if (backRegister) {
        backRegister.addEventListener("click", () => {
            showWelcome();
        });
    }

    /* PUBLICAR */
    if (publishButton) {
        publishButton.addEventListener("click", () => {

            if (!MF || !MF.user) {
                alert("Debes iniciar sesión o crear una cuenta para publicar.");
                showWelcome();
                return;
            }

            if (publicationPanel) {
                publicationPanel.style.display = "";
            }
        });
    }

    /* CERRAR PUBLICACIÓN */
    if (closePublication) {
        closePublication.addEventListener("click", () => {
            if (publicationPanel) {
                publicationPanel.style.display = "none";
            }
        });
    }

    if (cancelPublication) {
        cancelPublication.addEventListener("click", () => {
            if (publicationPanel) {
                publicationPanel.style.display = "none";
            }
        });
    }

    /* COMPROBAR SESIÓN REAL DE SUPABASE */
    try {

        if (typeof supabase !== "undefined" && supabase.auth) {

            const { data } = await supabase.auth.getSession();

            if (data && data.session && data.session.user) {

                if (typeof MF !== "undefined") {
                    MF.user = data.session.user;
                }

                showDashboard();

            } else {

                showWelcome();

            }

        } else {

            showWelcome();

        }

    } catch (error) {

        console.error("Error comprobando sesión:", error);
        showWelcome();

    }

});
