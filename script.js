from pathlib import Path

script = r'''/* =========================================================
   MARKET FLASH
   SCRIPT PRINCIPAL
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    /* =========================================================
       REFERENCIAS DOM
       ========================================================= */

    const welcomeScreen = document.getElementById("welcome-screen");
    const loginScreen = document.getElementById("login-screen");
    const registerScreen = document.getElementById("register-screen");
    const dashboardScreen = document.getElementById("dashboard-screen");

    const loginButton = document.getElementById("login-button");
    const registerButton = document.getElementById("register-button");
    const backFromLogin = document.getElementById("back-from-login");
    const backFromRegister = document.getElementById("back-from-register");

    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");

    const settingsButton = document.getElementById("settings-button");
    const settingsPanel = document.getElementById("settings-panel");
    const closeSettings = document.getElementById("close-settings");
    const appSettingsButton = document.getElementById("app-settings-button");
    const settingsProfileButton = document.getElementById("settings-profile-button");
    const logoutButton = document.getElementById("logout-button");

    const homeNavButton = document.getElementById("home-nav-button");
    const createPublicationButton = document.getElementById("create-publication-button");
    const profileNavButton = document.getElementById("profile-nav-button");

    const publicationPanel = document.getElementById("publication-panel");
    const closePublicationPanel = document.getElementById("close-publication-panel");
    const publicationForm = document.getElementById("publication-form");

    const promotionPanel = document.getElementById("promotion-panel");
    const closePromotionPanel = document.getElementById("close-promotion-panel");
    const promotionForm = document.getElementById("promotion-form");
    const promoteButton = document.getElementById("promote-button");

    const membershipPanel = document.getElementById("membership-panel");
    const closeMembershipPanel = document.getElementById("close-membership-panel");

    const paymentMethodPanel = document.getElementById("payment-method-panel");
    const closePaymentMethodPanel = document.getElementById("close-payment-method-panel");

    const paymentProofPanel = document.getElementById("payment-proof-panel");
    const closePaymentProofPanel = document.getElementById("close-payment-proof-panel");

    const profilePanel = document.getElementById("profile-panel");
    const closeProfilePanel = document.getElementById("close-profile-panel");
    const profileSettingsButton = document.getElementById("profile-settings-button");
    const editProfileButton = document.getElementById("edit-profile-button");
    const administrationButton = document.getElementById("administration-button");
    const logoutProfileButton = document.getElementById("logout-profile-button");
    const deleteAccountButton = document.getElementById("delete-account-button");

    const administrationPanel = document.getElementById("administration-panel");
    const closeAdministrationPanel = document.getElementById("close-administration-panel");
    const saveMembershipSettings = document.getElementById("save-membership-settings");
    const adminPaymentMethodsList = document.getElementById("admin-payment-methods-list");
    const addPaymentMethodButton = document.getElementById("add-payment-method-button");
    const savePaymentMethodsButton = document.getElementById("save-payment-methods-button");

    const adminPaymentProofsList = document.getElementById("admin-payment-proofs-list");
    const pendingProofCount = document.getElementById("pending-proof-count");

    const adminProofDetailPanel = document.getElementById("admin-proof-detail-panel");
    const closeAdminProofDetail = document.getElementById("close-admin-proof-detail");
    const approveProofButton = document.getElementById("approve-proof-button");
    const rejectProofButton = document.getElementById("reject-proof-button");
    const viewProofFullscreenButton = document.getElementById("view-proof-fullscreen-button");

    const proofFullscreenViewer = document.getElementById("proof-fullscreen-viewer");
    const closeProofFullscreen = document.getElementById("close-proof-fullscreen");

    /* =========================================================
       ESTADO
       ========================================================= */

    let currentUser = getSavedUser();
    let selectedMembershipId = null;
    let selectedPaymentMethodId = null;
    let selectedPaymentAmount = 0;
    let currentProofId = null;
    let currentProofImage = "";
    let publicationMedia = [];
    let promotionMedia = [];
    let proofImage = "";

    /* =========================================================
       CONFIGURACIÓN
       ========================================================= */

    const FALLBACK_MEMBERSHIPS = {
        basica: {
            id: "basica",
            name: "Membresía Básica",
            description: "Promoción destacada para comenzar.",
            price: null,
            features: [
                "⚡ Promoción destacada",
                "📱 Publicación en FLASH DEL DÍA",
                "📸 Fotos y videos"
            ]
        },
        premium: {
            id: "premium",
            name: "Membresía Premium",
            description: "Más prioridad y visibilidad.",
            price: null,
            features: [
                "⚡ Mayor prioridad",
                "🔥 Mayor visibilidad",
                "📸 Fotos y videos"
            ]
        },
        vip: {
            id: "vip",
            name: "Membresía VIP",
            description: "Máxima prioridad y visibilidad.",
            price: null,
            features: [
                "👑 Máxima prioridad",
                "⚡ Máxima visibilidad",
                "🔥 Destacado VIP",
                "📸 Fotos y videos"
            ]
        }
    };

    const FALLBACK_PAYMENT_METHODS = [
        {
            id: "banreservas",
            name: "BanReservas",
            prices: {
                basica: null,
                premium: null,
                vip: null
            }
        },
        {
            id: "bhd",
            name: "BHD",
            prices: {
                basica: null,
                premium: null,
                vip: null
            }
        },
        {
            id: "popular",
            name: "Banco Popular",
            prices: {
                basica: null,
                premium: null,
                vip: null
            }
        }
    ];

    const MEMBERSHIP_STORAGE_KEY = "marketFlashMembershipSettings";
    const PAYMENT_METHODS_STORAGE_KEY = "marketFlashPaymentMethods";
    const PAYMENT_PROOFS_STORAGE_KEY = "marketFlashPaymentProofs";
    const PUBLICATIONS_STORAGE_KEY = "marketFlashPublications";
    const PROMOTIONS_STORAGE_KEY = "marketFlashPromotions";
    const USER_STORAGE_KEY = "marketFlashUser";
    const LOGIN_STORAGE_KEY = "marketFlashLoggedIn";
    const PENDING_PROMOTION_KEY = "marketFlashPendingPromotion";

    const appData = window.MARKET_FLASH_DATA || {};

    /* =========================================================
       UTILIDADES
       ========================================================= */

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function money(value) {
        const number = Number(value);
        if (!Number.isFinite(number)) {
            return "RD$ 0.00";
        }

        return "RD$ " + number.toLocaleString("es-DO", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function numericValue(value) {
        if (value === "" || value === null || value === undefined) {
            return null;
        }

        const number = Number(value);
        return Number.isFinite(number) ? number : null;
    }

    function readJSON(key, fallback) {
        try {
            const value = localStorage.getItem(key);
            if (!value) {
                return clone(fallback);
            }

            return JSON.parse(value);
        } catch (error) {
            console.error("No se pudo leer", key, error);
            return clone(fallback);
        }
    }

    function writeJSON(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function closeAllPanels() {
        document.querySelectorAll(".modal-panel").forEach(function (panel) {
            panel.classList.remove("active");
        });

        if (settingsPanel) {
            settingsPanel.classList.remove("active");
        }

        if (proofFullscreenViewer) {
            proofFullscreenViewer.classList.remove("active");
        }
    }

    function showScreen(screen) {
        document.querySelectorAll(".screen").forEach(function (item) {
            item.classList.remove("active");
        });

        if (screen) {
            screen.classList.add("active");
        }
    }

    function openPanel(panel) {
        if (!panel) return;
        closeAllPanels();
        panel.classList.add("active");
    }

    function formatDate(value) {
        if (!value) return "—";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return String(value);
        }

        return date.toLocaleString("es-DO", {
            dateStyle: "short",
            timeStyle: "short"
        });
    }

    /* =========================================================
       USUARIO / SESIÓN
       ========================================================= */

    function getSavedUser() {
        try {
            const saved = localStorage.getItem(USER_STORAGE_KEY);
            return saved ? JSON.parse(saved) : null;
        } catch (error) {
            return null;
        }
    }

    function updateUserInformation(user) {
        currentUser = user;
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        localStorage.setItem(LOGIN_STORAGE_KEY, "true");
        updateProfile();
    }

    function logout() {
        localStorage.removeItem(USER_STORAGE_KEY);
        localStorage.removeItem(LOGIN_STORAGE_KEY);
        currentUser = null;
        closeAllPanels();
        showScreen(welcomeScreen);
    }

    function updateProfile() {
        if (!currentUser) return;

        const name = document.getElementById("profile-user-name");
        const cedula = document.getElementById("profile-user-cedula");
        const phone = document.getElementById("profile-user-phone");

        if (name) name.textContent = currentUser.name || "Usuario";
        if (cedula) cedula.textContent = currentUser.cedula || "—";
        if (phone) phone.textContent = currentUser.phone || "—";
    }

    /* =========================================================
       MEMBRESÍAS
       ========================================================= */

    function getMemberships() {
        const source = appData.memberships || FALLBACK_MEMBERSHIPS;
        const saved = readJSON(MEMBERSHIP_STORAGE_KEY, source);

        const result = {};

        Object.keys(FALLBACK_MEMBERSHIPS).forEach(function (id) {
            const base = clone(FALLBACK_MEMBERSHIPS[id]);
            const configured = saved && saved[id] ? saved[id] : {};
            const sourceConfigured = source && source[id] ? source[id] : {};

            result[id] = {
                ...base,
                ...sourceConfigured,
                ...configured,
                id: id,
                features: Array.isArray(
                    configured.features ??
                    sourceConfigured.features ??
                    base.features
                )
                    ? clone(
                        configured.features ??
                        sourceConfigured.features ??
                        base.features
                    )
                    : clone(base.features)
            };
        });

        return result;
    }

    function saveMemberships(memberships) {
        writeJSON(MEMBERSHIP_STORAGE_KEY, memberships);

        if (window.MARKET_FLASH_DATA) {
            window.MARKET_FLASH_DATA.memberships = clone(memberships);
        }
    }

    function getMembership(id) {
        const memberships = getMemberships();
        return memberships[id] || null;
    }

    function updateMembershipDisplay() {
        const memberships = getMemberships();

        Object.keys(memberships).forEach(function (id) {
            const membership = memberships[id];

            const priceElement = document.getElementById(
                "membership-price-" + id
            );

            const descriptionElement = document.getElementById(
                "membership-description-" + id
            );

            const featuresElement = document.getElementById(
                "membership-features-" + id
            );

            if (priceElement) {
                priceElement.textContent =
                    membership.price === null ||
                    membership.price === undefined
                        ? "RD$ 0.00"
                        : money(membership.price);
            }

            if (descriptionElement) {
                descriptionElement.textContent =
                    membership.description || "";
            }

            if (featuresElement) {
                featuresElement.innerHTML = "";

                (membership.features || []).forEach(function (feature) {
                    const li = document.createElement("li");
                    li.textContent = feature;
                    featuresElement.appendChild(li);
                });
            }
        });
    }

    function loadMembershipAdminForm() {
        const memberships = getMemberships();

        Object.keys(memberships).forEach(function (id) {
            const membership = memberships[id];

            const nameInput = document.getElementById(
                "admin-" + id + "-name"
            );

            const descriptionInput = document.getElementById(
                "admin-" + id + "-description"
            );

            const priceInput = document.getElementById(
                "admin-" + id + "-price"
            );

            const featuresInput = document.getElementById(
                "admin-" + id + "-features"
            );

            if (nameInput) {
                nameInput.value = membership.name || "";
            }

            if (descriptionInput) {
                descriptionInput.value = membership.description || "";
            }

            if (priceInput) {
                priceInput.value =
                    membership.price === null ||
                    membership.price === undefined
                        ? ""
                        : membership.price;
            }

            if (featuresInput) {
                featuresInput.value = (membership.features || []).join("\n");
            }
        });
    }

    function saveMembershipAdminForm() {
        const memberships = getMemberships();

        Object.keys(memberships).forEach(function (id) {
            const membership = memberships[id];

            const nameInput = document.getElementById(
                "admin-" + id + "-name"
            );

            const descriptionInput = document.getElementById(
                "admin-" + id + "-description"
            );

            const priceInput = document.getElementById(
                "admin-" + id + "-price"
            );

            const featuresInput = document.getElementById(
                "admin-" + id + "-features"
            );

            if (nameInput) {
                membership.name =
                    nameInput.value.trim() || membership.name;
            }

            if (descriptionInput) {
                membership.description =
                    descriptionInput.value.trim() ||
                    membership.description;
            }

            if (priceInput) {
                membership.price = numericValue(priceInput.value);
            }

            if (featuresInput) {
                membership.features = featuresInput.value
                    .split("\n")
                    .map(function (item) {
                        return item.trim();
                    })
                    .filter(Boolean);
            }
        });

        saveMemberships(memberships);
        updateMembershipDisplay();
        updatePaymentSelectionSummary();

        alert("Membresías guardadas correctamente.");
    }

    /* =========================================================
       MÉTODOS DE PAGO
       ========================================================= */

    function normalizePaymentMethods(methods) {
        if (!Array.isArray(methods)) {
            methods = [];
        }

        return methods.map(function (method, index) {
            const prices = method && method.prices
                ? method.prices
                : {};

            return {
                id:
                    method.id ||
                    ("payment_" + Date.now() + "_" + index),
                name:
                    method.name ||
                    "Método de pago",
                prices: {
                    basica:
                        prices.basica !== undefined
                            ? prices.basica
                            : null,
                    premium:
                        prices.premium !== undefined
                            ? prices.premium
                            : null,
                    vip:
                        prices.vip !== undefined
                            ? prices.vip
                            : null
                }
            };
        });
    }

    function getPaymentMethods() {
        const source =
            Array.isArray(appData.paymentMethods)
                ? appData.paymentMethods
                : FALLBACK_PAYMENT_METHODS;

        return normalizePaymentMethods(
            readJSON(PAYMENT_METHODS_STORAGE_KEY, source)
        );
    }

    function savePaymentMethods(methods) {
        const normalized = normalizePaymentMethods(methods);

        writeJSON(PAYMENT_METHODS_STORAGE_KEY, normalized);

        if (window.MARKET_FLASH_DATA) {
            window.MARKET_FLASH_DATA.paymentMethods =
                clone(normalized);
        }
    }

    function getPaymentPrice(method, membershipId) {
        if (!method || !method.prices) {
            return null;
        }

        const value = method.prices[membershipId];

        if (value === null || value === undefined || value === "") {
            return null;
        }

        return numericValue(value);
    }

    function renderPaymentMethods() {
        const list = document.getElementById("payment-methods-list");

        if (!list) return;

        const methods = getPaymentMethods();

        if (!methods.length) {
            list.innerHTML = `
                <div class="empty-payment-methods">
                    <div>💳</div>
                    <h3>No hay métodos configurados</h3>
                    <p>El administrador todavía no ha configurado los métodos de pago.</p>
                </div>
            `;
            return;
        }

        list.innerHTML = "";

        methods.forEach(function (method) {
            const price = getPaymentPrice(
                method,
                selectedMembershipId
            );

            const button = document.createElement("button");
            button.type = "button";
            button.className = "payment-method-card";
            button.dataset.paymentMethod = method.id;

            button.innerHTML = `
                <strong>${escapeHtml(method.name)}</strong>
                <span>${price === null ? "Precio no configurado" : money(price)}</span>
            `;

            button.addEventListener("click", function () {
                selectPaymentMethod(method.id);
            });

            list.appendChild(button);
        });

        updatePaymentSelectionSummary();
    }

    function renderAdminPaymentMethods() {
        if (!adminPaymentMethodsList) return;

        const methods = getPaymentMethods();

        adminPaymentMethodsList.innerHTML = "";

        if (!methods.length) {
            adminPaymentMethodsList.innerHTML = `
                <div class="empty-admin-proofs">
                    <div>💳</div>
                    <h3>No hay métodos de pago</h3>
                    <p>Agrega un método para comenzar.</p>
                </div>
            `;
            return;
        }

        methods.forEach(function (method) {
            const card = document.createElement("div");
            card.className = "admin-payment-method-card";
            card.dataset.paymentId = method.id;

            card.innerHTML = `
                <div class="admin-card-heading">
                    <strong>${escapeHtml(method.name)}</strong>
                    <button
                        type="button"
                        class="delete-payment-method-button"
                        data-delete-payment="${escapeHtml(method.id)}"
                    >
                        🗑️ ELIMINAR
                    </button>
                </div>

                <label>Nombre del método</label>
                <input
                    type="text"
                    class="admin-payment-name"
                    value="${escapeHtml(method.name)}"
                >

                <label>Precio BÁSICA</label>
                <input
                    type="number"
                    min="0"
                    step="0.01"
                    class="admin-payment-price"
                    data-membership-price="basica"
                    value="${method.prices.basica ?? ""}"
                    placeholder="0.00"
                >

                <label>Precio PREMIUM</label>
                <input
                    type="number"
                    min="0"
                    step="0.01"
                    class="admin-payment-price"
                    data-membership-price="premium"
                    value="${method.prices.premium ?? ""}"
                    placeholder="0.00"
                >

                <label>Precio VIP</label>
                <input
                    type="number"
                    min="0"
                    step="0.01"
                    class="admin-payment-price"
                    data-membership-price="vip"
                    value="${method.prices.vip ?? ""}"
                    placeholder="0.00"
                >
            `;

            adminPaymentMethodsList.appendChild(card);
        });

        adminPaymentMethodsList
            .querySelectorAll(".delete-payment-method-button")
            .forEach(function (button) {
                button.addEventListener("click", function () {
                    const id = button.dataset.deletePayment;

                    if (!confirm("¿Eliminar este método de pago?")) {
                        return;
                    }

                    const methods = getPaymentMethods().filter(
                        function (method) {
                            return method.id !== id;
                        }
                    );

                    savePaymentMethods(methods);
                    renderAdminPaymentMethods();
                    renderPaymentMethods();
                });
            });
    }

    function addPaymentMethod() {
        const methods = getPaymentMethods();

        methods.push({
            id:
                "payment_" +
                Date.now() +
                "_" +
                Math.random().toString(36).slice(2, 8),
            name: "Nuevo método",
            prices: {
                basica: null,
                premium: null,
                vip: null
            }
        });

        savePaymentMethods(methods);
        renderAdminPaymentMethods();
        renderPaymentMethods();
    }

    function saveAdminPaymentMethods() {
        if (!adminPaymentMethodsList) return;

        const currentMethods = getPaymentMethods();

        const updatedMethods = [];

        adminPaymentMethodsList
            .querySelectorAll(".admin-payment-method-card")
            .forEach(function (card, index) {
                const original = currentMethods[index];

                if (!original) return;

                const nameInput =
                    card.querySelector(".admin-payment-name");

                const priceInputs =
                    card.querySelectorAll(".admin-payment-price");

                const method = clone(original);

                method.name =
                    nameInput && nameInput.value.trim()
                        ? nameInput.value.trim()
                        : method.name;

                priceInputs.forEach(function (input) {
                    const membershipId =
                        input.dataset.membershipPrice;

                    method.prices[membershipId] =
                        numericValue(input.value);
                });

                updatedMethods.push(method);
            });

        savePaymentMethods(updatedMethods);
        renderAdminPaymentMethods();
        renderPaymentMethods();
        updatePaymentSelectionSummary();

        alert("Métodos de pago guardados correctamente.");
    }

    /* =========================================================
       SELECCIÓN DE MEMBRESÍA / PAGO
       ========================================================= */

    function selectMembership(membershipId) {
        const membership = getMembership(membershipId);

        if (!membership) return;

        selectedMembershipId = membershipId;
        selectedPaymentMethodId = null;
        selectedPaymentAmount = 0;

        const nameElement =
            document.getElementById("selected-membership-name");

        const priceElement =
            document.getElementById("selected-membership-price");

        if (nameElement) {
            nameElement.textContent = membership.name;
        }

        if (priceElement) {
            priceElement.textContent =
                membership.price === null
                    ? "RD$ 0.00"
                    : money(membership.price);
        }

        renderPaymentMethods();

        openPanel(paymentMethodPanel);
    }

    function selectPaymentMethod(paymentMethodId) {
        const method = getPaymentMethods().find(
            function (item) {
                return item.id === paymentMethodId;
            }
        );

        if (!method || !selectedMembershipId) {
            return;
        }

        const price = getPaymentPrice(
            method,
            selectedMembershipId
        );

        if (price === null) {
            alert(
                "Este método de pago todavía no tiene un precio configurado para la membresía seleccionada."
            );
            return;
        }

        selectedPaymentMethodId = paymentMethodId;
        selectedPaymentAmount = price;

        updatePaymentSelectionSummary();

        document
            .querySelectorAll(".payment-method-card")
            .forEach(function (card) {
                card.classList.toggle(
                    "selected",
                    card.dataset.paymentMethod === paymentMethodId
                );
            });
    }

    function updatePaymentSelectionSummary() {
        const method = getPaymentMethods().find(
            function (item) {
                return item.id === selectedPaymentMethodId;
            }
        );

        const methodElement =
            document.getElementById("selected-payment-method");

        const priceElement =
            document.getElementById("selected-payment-price");

        const continueButton =
            document.getElementById("continue-to-proof-button");

        if (methodElement) {
            methodElement.textContent =
                method ? method.name : "—";
        }

        if (priceElement) {
            priceElement.textContent =
                selectedPaymentAmount
                    ? money(selectedPaymentAmount)
                    : "RD$ 0.00";
        }

        if (continueButton) {
            continueButton.disabled =
                !selectedMembershipId ||
                !selectedPaymentMethodId ||
                !selectedPaymentAmount;
        }
    }

    function openProofPanel() {
        const membership = getMembership(selectedMembershipId);
        const method = getPaymentMethods().find(
            function (item) {
                return item.id === selectedPaymentMethodId;
            }
        );

        if (!membership || !method || !selectedPaymentAmount) {
            alert("Selecciona una membresía y un método de pago.");
            return;
        }

        const membershipName =
            document.getElementById("proof-membership-name");

        const paymentMethod =
            document.getElementById("proof-payment-method");

        const amount =
            document.getElementById("proof-payment-amount");

        if (membershipName) {
            membershipName.textContent = membership.name;
        }

        if (paymentMethod) {
            paymentMethod.textContent = method.name;
        }

        if (amount) {
            amount.textContent = money(selectedPaymentAmount);
        }

        proofImage = "";
        renderProofPreview();
        openPanel(paymentProofPanel);
    }

    /* =========================================================
       ARCHIVOS / PREVISUALIZACIONES
       ========================================================= */

    function readFileAsDataURL(file) {
        return new Promise(function (resolve, reject) {
            const reader = new FileReader();

            reader.onload = function () {
                resolve(reader.result);
            };

            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    function renderMediaPreview(container, files) {
        if (!container) return;

        container.innerHTML = "";

        if (!files.length) {
            return;
        }

        files.forEach(function (item) {
            const wrapper = document.createElement("div");
            wrapper.className = "media-preview-item";

            if (item.type && item.type.startsWith("video/")) {
                wrapper.innerHTML = `
                    <video
                        src="${item.data}"
                        controls
                        playsinline
                    ></video>
                `;
            } else {
                wrapper.innerHTML = `
                    <img
                        src="${item.data}"
                        alt="Vista previa"
                    >
                `;
            }

            container.appendChild(wrapper);
        });
    }

    async function addPublicationFiles(fileList) {
        const files = Array.from(fileList || []);

        for (const file of files) {
            try {
                const data = await readFileAsDataURL(file);

                publicationMedia.push({
                    name: file.name,
                    type: file.type,
                    data: data
                });
            } catch (error) {
                console.error("No se pudo leer el archivo.", error);
            }
        }

        renderMediaPreview(
            document.getElementById("publication-media-preview"),
            publicationMedia
        );
    }

    async function addPromotionFiles(fileList) {
        const files = Array.from(fileList || []);

        for (const file of files) {
            try {
                const data = await readFileAsDataURL(file);

                promotionMedia.push({
                    name: file.name,
                    type: file.type,
                    data: data
                });
            } catch (error) {
                console.error("No se pudo leer el archivo.", error);
            }
        }

        renderMediaPreview(
            document.getElementById("promotion-media-preview"),
            promotionMedia
        );
    }

    function renderProofPreview() {
        const preview =
            document.getElementById("payment-proof-preview");

        const sendButton =
            document.getElementById("send-payment-proof-button");

        if (!preview) return;

        if (!proofImage) {
            preview.innerHTML = `
                <div class="proof-empty-state">
                    <div>🧾</div>
                    <p>Todavía no has seleccionado un comprobante.</p>
                </div>
            `;

            if (sendButton) {
                sendButton.disabled = true;
            }

            return;
        }

        preview.innerHTML = `
            <img
                src="${proofImage}"
                alt="Vista previa del comprobante"
            >
        `;

        if (sendButton) {
            sendButton.disabled = false;
        }
    }

    async function handleProofFile(file) {
        if (!file) return;

        try {
            proofImage = await readFileAsDataURL(file);
            renderProofPreview();
        } catch (error) {
            console.error(error);
            alert("No se pudo cargar el comprobante.");
        }
    }

    /* =========================================================
       PUBLICACIONES
       ========================================================= */

    function getPublications() {
        return readJSON(PUBLICATIONS_STORAGE_KEY, []);
    }

    function savePublications(items) {
        writeJSON(PUBLICATIONS_STORAGE_KEY, items);
    }

    function renderPublications() {
        const list = document.getElementById("publications-list");

        if (!list) return;

        const publications = getPublications();

        if (!publications.length) {
            list.innerHTML = `
                <div class="empty-publications">
                    <div class="empty-publications-icon">＋</div>
                    <h3>No hay publicaciones todavía</h3>
                    <p>Crea una publicación gratis.</p>
                </div>
            `;
            return;
        }

        list.innerHTML = "";

        publications
            .slice()
            .reverse()
            .forEach(function (publication) {
                const article =
                    document.createElement("article");

                article.className = "publication-card";

                let mediaHtml = "";

                if (
                    Array.isArray(publication.media) &&
                    publication.media.length
                ) {
                    const first = publication.media[0];

                    if (
                        first.type &&
                        first.type.startsWith("video/")
                    ) {
                        mediaHtml = `
                            <video
                                src="${first.data}"
                                controls
                                playsinline
                            ></video>
                        `;
                    } else {
                        mediaHtml = `
                            <img
                                src="${first.data}"
                                alt="${escapeHtml(publication.title)}"
                            >
                        `;
                    }
                }

                article.innerHTML = `
                    ${mediaHtml}

                    <div class="publication-card-body">
                        <span class="publication-badge">GRATIS</span>
                        <h3>${escapeHtml(publication.title)}</h3>
                        <p>${escapeHtml(publication.description)}</p>

                        ${
                            publication.price !== null &&
                            publication.price !== undefined &&
                            publication.price !== ""
                                ? `<strong>${money(publication.price)}</strong>`
                                : ""
                        }

                        ${
                            publication.contact
                                ? `<div>📞 ${escapeHtml(publication.contact)}</div>`
                                : ""
                        }
                    </div>
                `;

                list.appendChild(article);
            });
    }

    function createPublication(event) {
        event.preventDefault();

        if (!currentUser) {
            alert("Debes iniciar sesión para publicar.");
            return;
        }

        const title =
            document.getElementById("publication-title").value.trim();

        const description =
            document.getElementById("publication-description").value.trim();

        const price =
            numericValue(
                document.getElementById("publication-price").value
            );

        const contact =
            document.getElementById("publication-contact").value.trim();

        const publication = {
            id:
                "pub_" +
                Date.now() +
                "_" +
                Math.random().toString(36).slice(2, 8),
            userId: currentUser.id || currentUser.cedula,
            userName: currentUser.name,
            title: title,
            description: description,
            price: price,
            contact: contact,
            media: clone(publicationMedia),
            createdAt: new Date().toISOString()
        };

        const publications = getPublications();
        publications.push(publication);
        savePublications(publications);

        if (typeof window.addMarketFlashPublication === "function") {
            window.addMarketFlashPublication(publication);
        }

        publicationForm.reset();
        publicationMedia = [];
        renderMediaPreview(
            document.getElementById("publication-media-preview"),
            publicationMedia
        );

        closeAllPanels();
        renderPublications();

        alert("Publicación creada correctamente.");
    }

    /* =========================================================
       PROMOCIONES
       ========================================================= */

    function getPromotions() {
        return readJSON(PROMOTIONS_STORAGE_KEY, []);
    }

    function savePromotions(items) {
        writeJSON(PROMOTIONS_STORAGE_KEY, items);
    }

    function renderFlashPromotions() {
        const list =
            document.getElementById("flash-promotions-list");

        if (!list) return;

        const promotions = getPromotions().filter(
            function (promotion) {
                return (
                    promotion.status === "APROBADO" ||
                    promotion.status === "ACTIVA"
                );
            }
        );

        if (!promotions.length) {
            list.innerHTML = `
                <div class="empty-flash">
                    <div class="empty-flash-icon">⚡</div>
                    <h3>Todavía no hay promociones</h3>
                    <p>Sé el primero en promocionar tu producto.</p>
                </div>
            `;
            return;
        }

        list.innerHTML = "";

        promotions
            .slice()
            .reverse()
            .forEach(function (promotion) {
                const card =
                    document.createElement("article");

                card.className = "flash-promotion-card";

                let mediaHtml = "";

                if (
                    Array.isArray(promotion.media) &&
                    promotion.media.length
                ) {
                    const first = promotion.media[0];

                    if (
                        first.type &&
                        first.type.startsWith("video/")
                    ) {
                        mediaHtml = `
                            <video
                                src="${first.data}"
                                controls
                                playsinline
                            ></video>
                        `;
                    } else {
                        mediaHtml = `
                            <img
                                src="${first.data}"
                                alt="${escapeHtml(promotion.title)}"
                            >
                        `;
                    }
                }

                card.innerHTML = `
                    ${mediaHtml}

                    <div class="flash-promotion-body">
                        <span class="flash-promotion-badge">
                            ⚡ FLASH DEL DÍA
                        </span>

                        <h3>${escapeHtml(promotion.title)}</h3>
                        <p>${escapeHtml(promotion.description)}</p>

                        ${
                            promotion.price !== null &&
                            promotion.price !== undefined &&
                            promotion.price !== ""
                                ? `<strong>${money(promotion.price)}</strong>`
                                : ""
                        }

                        ${
                            promotion.contact
                                ? `<div>📞 ${escapeHtml(promotion.contact)}</div>`
                                : ""
                        }
                    </div>
                `;

                list.appendChild(card);
            });
    }

    function createPendingPromotion(event) {
        event.preventDefault();

        if (!currentUser) {
            alert("Debes iniciar sesión para promocionar.");
            return;
        }

        const promotion = {
            id:
                "promotion_" +
                Date.now() +
                "_" +
                Math.random().toString(36).slice(2, 8),

            userId: currentUser.id || currentUser.cedula,
            userName: currentUser.name,

            title:
                document
                    .getElementById("promotion-title")
                    .value
                    .trim(),

            description:
                document
                    .getElementById("promotion-description")
                    .value
                    .trim(),

            price:
                numericValue(
                    document
                        .getElementById("promotion-price")
                        .value
                ),

            contact:
                document
                    .getElementById("promotion-contact")
                    .value
                    .trim(),

            media: clone(promotionMedia),

            status: "PENDIENTE_MEMBRESIA",
            createdAt: new Date().toISOString()
        };

        localStorage.setItem(
            PENDING_PROMOTION_KEY,
            JSON.stringify(promotion)
        );

        promotionForm.reset();
        promotionMedia = [];

        renderMediaPreview(
            document.getElementById("promotion-media-preview"),
            promotionMedia
        );

        closeAllPanels();
        openPanel(membershipPanel);
    }

    function completePromotionAfterPayment(proof) {
        const pending =
            readJSON(PENDING_PROMOTION_KEY, null);

        if (!pending) {
            return;
        }

        pending.membershipId = selectedMembershipId;
        pending.membershipName =
            getMembership(selectedMembershipId)?.name || "";

        pending.paymentMethodId = selectedPaymentMethodId;

        const method = getPaymentMethods().find(
            function (item) {
                return item.id === selectedPaymentMethodId;
            }
        );

        pending.paymentMethodName =
            method ? method.name : "";

        pending.amount = selectedPaymentAmount;
        pending.proofId = proof.id;
        pending.status = "PENDIENTE";
        pending.updatedAt = new Date().toISOString();

        const promotions = getPromotions();
        promotions.push(pending);
        savePromotions(promotions);

        if (
            typeof window.addMarketFlashPromotion ===
            "function"
        ) {
            window.addMarketFlashPromotion(pending);
        }

        localStorage.removeItem(PENDING_PROMOTION_KEY);

        renderFlashPromotions();
    }

    /* =========================================================
       COMPROBANTES
       ========================================================= */

    function getPaymentProofs() {
        return readJSON(PAYMENT_PROOFS_STORAGE_KEY, []);
    }

    function savePaymentProofs(items) {
        writeJSON(PAYMENT_PROOFS_STORAGE_KEY, items);
    }

    async function sendPaymentProof() {
        if (
            !currentUser ||
            !selectedMembershipId ||
            !selectedPaymentMethodId ||
            !selectedPaymentAmount ||
            !proofImage
        ) {
            alert("Completa todos los datos y selecciona el comprobante.");
            return;
        }

        const membership =
            getMembership(selectedMembershipId);

        const method = getPaymentMethods().find(
            function (item) {
                return item.id === selectedPaymentMethodId;
            }
        );

        const proof = {
            id:
                "proof_" +
                Date.now() +
                "_" +
                Math.random().toString(36).slice(2, 8),

            userId:
                currentUser.id ||
                currentUser.cedula,

            userName:
                currentUser.name || "Usuario",

            userCedula:
                currentUser.cedula || "",

            userPhone:
                currentUser.phone || "",

            membershipId:
                selectedMembershipId,

            membershipName:
                membership ? membership.name : "",

            paymentMethodId:
                selectedPaymentMethodId,

            paymentMethodName:
                method ? method.name : "",

            amount:
                selectedPaymentAmount,

            image:
                proofImage,

            status:
                "PENDIENTE",

            createdAt:
                new Date().toISOString()
        };

        const proofs = getPaymentProofs();
        proofs.push(proof);
        savePaymentProofs(proofs);

        if (
            typeof window.addMarketFlashPaymentProof ===
            "function"
        ) {
            window.addMarketFlashPaymentProof(proof);
        }

        /*
           Supabase queda preparado para recibir el comprobante
           cuando la política/almacenamiento del proyecto esté
           configurada. No se usa la Secret Key desde el navegador.
        */
        if (
            window.supabaseClient &&
            typeof window.supabaseClient.from === "function"
        ) {
            try {
                /*
                   La imagen en Base64 se mantiene localmente por ahora.
                   Solo intentamos guardar los datos que coinciden
                   con la tabla actual.
                */
                await window.supabaseClient
                    .from("payment_proofs")
                    .insert({
                        user_id: proof.userId,
                        membership_id: proof.membershipId,
                        payment_method_id: proof.paymentMethodId,
                        amount: proof.amount,
                        status: proof.status
                    });
            } catch (error) {
                console.warn(
                    "El comprobante quedó guardado localmente. Supabase no pudo recibirlo todavía:",
                    error
                );
            }
        }

        completePromotionAfterPayment(proof);

        proofImage = "";
        selectedMembershipId = null;
        selectedPaymentMethodId = null;
        selectedPaymentAmount = 0;

        closeAllPanels();
        renderAdminPaymentProofs();

        alert(
            "Comprobante enviado. Tu pago quedó PENDIENTE de revisión."
        );
    }

    function renderAdminPaymentProofs() {
        if (!adminPaymentProofsList) return;

        const proofs = getPaymentProofs();

        const pending = proofs.filter(
            function (proof) {
                return proof.status === "PENDIENTE";
            }
        ).length;

        if (pendingProofCount) {
            pendingProofCount.textContent =
                pending + " PENDIENTES";
        }

        if (!proofs.length) {
            adminPaymentProofsList.innerHTML = `
                <div class="empty-admin-proofs">
                    <div>🧾</div>
                    <h3>No hay comprobantes</h3>
                    <p>Los comprobantes enviados aparecerán aquí.</p>
                </div>
            `;
            return;
        }

        adminPaymentProofsList.innerHTML = "";

        proofs
            .slice()
            .reverse()
            .forEach(function (proof) {
                const card =
                    document.createElement("button");

                card.type = "button";
                card.className = "admin-proof-card";
                card.dataset.proofId = proof.id;

                card.innerHTML = `
                    <div>
                        <strong>${escapeHtml(
                            proof.userName || "Usuario"
                        )}</strong>

                        <span>
                            ${escapeHtml(
                                proof.membershipName || "—"
                            )}
                        </span>
                    </div>

                    <div>
                        <strong>${money(proof.amount)}</strong>

                        <span>
                            ${escapeHtml(
                                proof.paymentMethodName || "—"
                            )}
                        </span>
                    </div>

                    <div>
                        <span>
                            ${formatDate(proof.createdAt)}
                        </span>

                        <strong class="proof-status proof-status-${String(
                            proof.status || ""
                        ).toLowerCase()}">
                            ${escapeHtml(
                                proof.status || "PENDIENTE"
                            )}
                        </strong>
                    </div>
                `;

                card.addEventListener("click", function () {
                    openProofDetail(proof.id);
                });

                adminPaymentProofsList.appendChild(card);
            });
    }

    function openProofDetail(proofId) {
        const proof = getPaymentProofs().find(
            function (item) {
                return item.id === proofId;
            }
        );

        if (!proof) return;

        currentProofId = proofId;
        currentProofImage = proof.image || "";

        const fields = {
            "admin-proof-user":
                proof.userName || "—",

            "admin-proof-membership":
                proof.membershipName || "—",

            "admin-proof-method":
                proof.paymentMethodName || "—",

            "admin-proof-amount":
                money(proof.amount),

            "admin-proof-date":
                formatDate(proof.createdAt),

            "admin-proof-status":
                proof.status || "PENDIENTE"
        };

        Object.keys(fields).forEach(function (id) {
            const element = document.getElementById(id);

            if (element) {
                element.textContent = fields[id];
            }
        });

        const image =
            document.getElementById("admin-proof-image");

        if (image) {
            image.src = proof.image || "";
        }

        if (approveProofButton) {
            approveProofButton.disabled =
                proof.status === "APROBADO";
        }

        if (rejectProofButton) {
            rejectProofButton.disabled =
                proof.status === "RECHAZADO";
        }

        openPanel(adminProofDetailPanel);
    }

    function updateProofStatus(status) {
        if (!currentProofId) return;

        const proofs = getPaymentProofs();

        const index = proofs.findIndex(
            function (proof) {
                return proof.id === currentProofId;
            }
        );

        if (index === -1) return;

        proofs[index].status = status;
        proofs[index].reviewedAt =
            new Date().toISOString();

        savePaymentProofs(proofs);

        /*
           También actualizamos la promoción relacionada
           cuando existe.
        */
        const promotions = getPromotions();

        const promotionIndex =
            promotions.findIndex(function (promotion) {
                return promotion.proofId === currentProofId;
            });

        if (promotionIndex !== -1) {
            promotions[promotionIndex].status =
                status === "APROBADO"
                    ? "APROBADO"
                    : "RECHAZADO";

            promotions[promotionIndex].updatedAt =
                new Date().toISOString();

            savePromotions(promotions);
        }

        renderAdminPaymentProofs();
        renderFlashPromotions();
        openProofDetail(currentProofId);

        alert(
            status === "APROBADO"
                ? "Comprobante aprobado."
                : "Comprobante rechazado."
        );
    }

    /* =========================================================
       REGISTRO / LOGIN
       ========================================================= */

    registerForm?.addEventListener("submit", function (event) {
        event.preventDefault();

        const name =
            document.getElementById("register-name").value.trim();

        const cedula =
            document.getElementById("register-cedula").value.trim();

        const phone =
            document.getElementById("register-phone").value.trim();

        const password =
            document.getElementById("register-password").value;

        const passwordConfirm =
            document.getElementById(
                "register-password-confirm"
            ).value;

        if (password.length < 6) {
            alert("La contraseña debe tener al menos 6 caracteres.");
            return;
        }

        if (password !== passwordConfirm) {
            alert("Las contraseñas no coinciden.");
            return;
        }

        const user = {
            id:
                "user_" +
                Date.now() +
                "_" +
                Math.random().toString(36).slice(2, 8),

            name,
            cedula,
            phone,
            password,

            createdAt:
                new Date().toISOString()
        };

        updateUserInformation(user);

        if (typeof window.addMarketFlashUser === "function") {
            window.addMarketFlashUser(user);
        }

        registerForm.reset();

        closeAllPanels();
        showScreen(dashboardScreen);
        updateProfile();

        alert("Cuenta creada correctamente.");
    });

    loginForm?.addEventListener("submit", function (event) {
        event.preventDefault();

        const cedula =
            document.getElementById("login-cedula").value.trim();

        const password =
            document.getElementById("login-password").value;

        const user = getSavedUser();

        if (
            !user ||
            user.cedula !== cedula ||
            user.password !== password
        ) {
            alert("Cédula o contraseña incorrecta.");
            return;
        }

        updateUserInformation(user);

        loginForm.reset();

        closeAllPanels();
        showScreen(dashboardScreen);
        updateProfile();
        renderPublications();
        renderFlashPromotions();
    });

    /* =========================================================
       NAVEGACIÓN INICIAL
       ========================================================= */

    loginButton?.addEventListener("click", function () {
        showScreen(loginScreen);
    });

    registerButton?.addEventListener("click", function () {
        showScreen(registerScreen);
    });

    backFromLogin?.addEventListener("click", function () {
        showScreen(welcomeScreen);
    });

    backFromRegister?.addEventListener("click", function () {
        showScreen(welcomeScreen);
    });

    homeNavButton?.addEventListener("click", function () {
        closeAllPanels();
        showScreen(dashboardScreen);

        if (homeNavButton) {
            homeNavButton.classList.add("active");
        }

        if (profileNavButton) {
            profileNavButton.classList.remove("active");
        }
    });

    createPublicationButton?.addEventListener("click", function () {
        if (!currentUser) {
            alert("Primero debes iniciar sesión.");
            showScreen(loginScreen);
            return;
        }

        publicationMedia = [];
        publicationForm?.reset();

        renderMediaPreview(
            document.getElementById("publication-media-preview"),
            publicationMedia
        );

        openPanel(publicationPanel);
    });

    profileNavButton?.addEventListener("click", function () {
        if (!currentUser) {
            showScreen(loginScreen);
            return;
        }

        updateProfile();
        openPanel(profilePanel);

        if (profileNavButton) {
            profileNavButton.classList.add("active");
        }

        if (homeNavButton) {
            homeNavButton.classList.remove("active");
        }
    });

    /* =========================================================
       PUBLICACIÓN
       ========================================================= */

    closePublicationPanel?.addEventListener(
        "click",
        closeAllPanels
    );

    publicationForm?.addEventListener(
        "submit",
        createPublication
    );

    document
        .getElementById("publication-camera-button")
        ?.addEventListener("click", function () {
            document
                .getElementById("publication-camera-input")
                ?.click();
        });

    document
        .getElementById("publication-gallery-button")
        ?.addEventListener("click", function () {
            document
                .getElementById("publication-gallery-input")
                ?.click();
        });

    document
        .getElementById("publication-camera-input")
        ?.addEventListener("change", function (event) {
            addPublicationFiles(event.target.files);
            event.target.value = "";
        });

    document
        .getElementById("publication-gallery-input")
        ?.addEventListener("change", function (event) {
            addPublicationFiles(event.target.files);
            event.target.value = "";
        });

    /* =========================================================
       PROMOCIÓN
       ========================================================= */

    promoteButton?.addEventListener("click", function () {
        if (!currentUser) {
            alert("Primero debes iniciar sesión.");
            showScreen(loginScreen);
            return;
        }

        promotionMedia = [];
        promotionForm?.reset();

        renderMediaPreview(
            document.getElementById("promotion-media-preview"),
            promotionMedia
        );

        openPanel(promotionPanel);
    });

    closePromotionPanel?.addEventListener(
        "click",
        closeAllPanels
    );

    promotionForm?.addEventListener(
        "submit",
        createPendingPromotion
    );

    document
        .getElementById("promotion-camera-button")
        ?.addEventListener("click", function () {
            document
                .getElementById("promotion-camera-photo-input")
                ?.click();
        });

    document
        .getElementById("promotion-gallery-button")
        ?.addEventListener("click", function () {
            document
                .getElementById("promotion-gallery-input")
                ?.click();
        });

    document
        .getElementById("promotion-camera-photo-input")
        ?.addEventListener("change", function (event) {
            addPromotionFiles(event.target.files);
            event.target.value = "";
        });

    document
        .getElementById("promotion-camera-video-input")
        ?.addEventListener("change", function (event) {
            addPromotionFiles(event.target.files);
            event.target.value = "";
        });

    document
        .getElementById("promotion-gallery-input")
        ?.addEventListener("change", function (event) {
            addPromotionFiles(event.target.files);
            event.target.value = "";
        });

    /* =========================================================
       MEMBRESÍAS
       ========================================================= */

    document
        .querySelectorAll(".membership-card")
        .forEach(function (card) {
            card.addEventListener("click", function () {
                selectMembership(
                    card.dataset.membership
                );
            });
        });

    closeMembershipPanel?.addEventListener(
        "click",
        closeAllPanels
    );

    /* =========================================================
       PAGO
       ========================================================= */

    closePaymentMethodPanel?.addEventListener(
        "click",
        closeAllPanels
    );

    document
        .getElementById("continue-to-proof-button")
        ?.addEventListener("click", openProofPanel);

    closePaymentProofPanel?.addEventListener(
        "click",
        closeAllPanels
    );

    document
        .getElementById("proof-camera-button")
        ?.addEventListener("click", function () {
            document
                .getElementById("proof-camera-input")
                ?.click();
        });

    document
        .getElementById("proof-gallery-button")
        ?.addEventListener("click", function () {
            document
                .getElementById("proof-gallery-input")
                ?.click();
        });

    document
        .getElementById("proof-camera-input")
        ?.addEventListener("change", function (event) {
            handleProofFile(event.target.files?.[0]);
            event.target.value = "";
        });

    document
        .getElementById("proof-gallery-input")
        ?.addEventListener("change", function (event) {
            handleProofFile(event.target.files?.[0]);
            event.target.value = "";
        });

    document
        .getElementById("send-payment-proof-button")
        ?.addEventListener("click", sendPaymentProof);

    /* =========================================================
       PERFIL
       ========================================================= */

    closeProfilePanel?.addEventListener(
        "click",
        closeAllPanels
    );

    profileSettingsButton?.addEventListener(
        "click",
        function () {
            closeAllPanels();

            if (settingsPanel) {
                settingsPanel.classList.add("active");
            }
        }
    );

    editProfileButton?.addEventListener(
        "click",
        function () {
            if (!currentUser) return;

            const newName =
                prompt(
                    "Nombre completo:",
                    currentUser.name || ""
                );

            if (newName === null) return;

            const newPhone =
                prompt(
                    "Número de teléfono:",
                    currentUser.phone || ""
                );

            if (newPhone === null) return;

            currentUser.name =
                newName.trim() || currentUser.name;

            currentUser.phone =
                newPhone.trim() || currentUser.phone;

            updateUserInformation(currentUser);

            alert("Perfil actualizado.");
        }
    );

    administrationButton?.addEventListener(
        "click",
        function () {
            closeAllPanels();

            loadMembershipAdminForm();
            renderAdminPaymentMethods();
            renderAdminPaymentProofs();

            openPanel(administrationPanel);
        }
    );

    logoutProfileButton?.addEventListener(
        "click",
        logout
    );

    deleteAccountButton?.addEventListener(
        "click",
        function () {
            if (
                !confirm(
                    "¿Seguro que deseas eliminar la cuenta guardada en este dispositivo?"
                )
            ) {
                return;
            }

            localStorage.removeItem(USER_STORAGE_KEY);
            localStorage.removeItem(LOGIN_STORAGE_KEY);

            currentUser = null;

            closeAllPanels();
            showScreen(welcomeScreen);
        }
    );

    /* =========================================================
       ADMINISTRACIÓN
       ========================================================= */

    closeAdministrationPanel?.addEventListener(
        "click",
        closeAllPanels
    );

    saveMembershipSettings?.addEventListener(
        "click",
        saveMembershipAdminForm
    );

    addPaymentMethodButton?.addEventListener(
        "click",
        addPaymentMethod
    );

    savePaymentMethodsButton?.addEventListener(
        "click",
        saveAdminPaymentMethods
    );

    closeAdminProofDetail?.addEventListener(
        "click",
        closeAllPanels
    );

    approveProofButton?.addEventListener(
        "click",
        function () {
            updateProofStatus("APROBADO");
        }
    );

    rejectProofButton?.addEventListener(
        "click",
        function () {
            updateProofStatus("RECHAZADO");
        }
    );

    viewProofFullscreenButton?.addEventListener(
        "click",
        function () {
            if (!currentProofImage) return;

            const image =
                document.getElementById(
                    "proof-fullscreen-image"
                );

            if (image) {
                image.src = currentProofImage;
            }

            proofFullscreenViewer?.classList.add("active");
        }
    );

    closeProofFullscreen?.addEventListener(
        "click",
        function () {
            proofFullscreenViewer?.classList.remove("active");
        }
    );

    /* =========================================================
       CONFIGURACIÓN
       ========================================================= */

    settingsButton?.addEventListener(
        "click",
        function () {
            if (!settingsPanel) return;

            settingsPanel.classList.toggle("active");
        }
    );

    closeSettings?.addEventListener(
        "click",
        function () {
            settingsPanel?.classList.remove("active");
        }
    );

    appSettingsButton?.addEventListener(
        "click",
        function () {
            alert(
                "La configuración general de Market Flash se administra desde los archivos de configuración de la aplicación."
            );
        }
    );

    settingsProfileButton?.addEventListener(
        "click",
        function () {
            settingsPanel?.classList.remove("active");

            if (currentUser) {
                updateProfile();
                openPanel(profilePanel);
            } else {
                showScreen(loginScreen);
            }
        }
    );

    logoutButton?.addEventListener(
        "click",
        logout
    );

    /* =========================================================
       INICIALIZACIÓN
       ========================================================= */

    updateMembershipDisplay();
    renderPaymentMethods();
    renderPublications();
    renderFlashPromotions();
    renderAdminPaymentMethods();
    renderAdminPaymentProofs();
    updateProfile();

    if (currentUser &&
        localStorage.getItem(LOGIN_STORAGE_KEY) === "true") {

        showScreen(dashboardScreen);

    } else {

        showScreen(welcomeScreen);
    }

});
'''

path = Path("/mnt/data/script.js")
path.write_text(script, encoding="utf-8")
print(f"Archivo creado: {path}")
print(f"Líneas: {len(script.splitlines())}")
