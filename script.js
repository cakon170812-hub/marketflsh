document.addEventListener("DOMContentLoaded", () => {

    // ==============================
    // PANTALLAS
    // ==============================

    const welcomeScreen = document.getElementById("welcome-screen");
    const loginScreen = document.getElementById("login-screen");
    const registerScreen = document.getElementById("register-screen");
    const dashboardScreen = document.getElementById("dashboard-screen");

    // ==============================
    // BOTONES
    // ==============================

    const loginButton = document.getElementById("login-button");
    const registerButton = document.getElementById("register-button");

    const backFromLogin = document.getElementById("back-from-login");
    const backFromRegister = document.getElementById("back-from-register");

    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");

    const settingsButton = document.getElementById("settings-button");
    const closeSettingsButton = document.getElementById("close-settings");
    const logoutButton = document.getElementById("logout-button");

    const settingsPanel = document.getElementById("settings-panel");

    const dashboardUserName = document.getElementById("dashboard-user-name");

    // ==============================
    // MOSTRAR PANTALLA
    // ==============================

    function showScreen(screen) {

        if (!screen) return;

        const screens = [
            welcomeScreen,
            loginScreen,
            registerScreen,
            dashboardScreen
        ];

        screens.forEach((item) => {
            if (item) {
                item.classList.remove("active");
            }
        });

        screen.classList.add("active");
    }

    // ==============================
    // OBTENER USUARIO GUARDADO
    // ==============================

    function getSavedUser() {

        const savedUser = localStorage.getItem("marketFlashUser");

        if (!savedUser) {
            return null;
        }

        try {
            return JSON.parse(savedUser);
        } catch (error) {
            console.error("Error leyendo el usuario guardado:", error);
            return null;
        }
    }

    // ==============================
    // ACTUALIZAR NOMBRE DEL USUARIO
    // ==============================

    function updateDashboardUser() {

        const user = getSavedUser();

        if (dashboardUserName && user) {
            dashboardUserName.textContent = user.name || "Usuario";
        }
    }

    // ==============================
    // INICIO
    // ==============================

    if (loginButton) {

        loginButton.addEventListener("click", () => {

            showScreen(loginScreen);

        });

    }

    // ==============================
    // CREAR CUENTA
    // ==============================

    if (registerButton) {

        registerButton.addEventListener("click", () => {

            showScreen(registerScreen);

        });

    }

    // ==============================
    // VOLVER DESDE LOGIN
    // ==============================

    if (backFromLogin) {

        backFromLogin.addEventListener("click", () => {

            showScreen(welcomeScreen);

        });

    }

    // ==============================
    // VOLVER DESDE REGISTRO
    // ==============================

    if (backFromRegister) {

        backFromRegister.addEventListener("click", () => {

            showScreen(welcomeScreen);

        });

    }

    // ==============================
    // REGISTRAR CUENTA
    // ==============================

    if (registerForm) {

        registerForm.addEventListener("submit", (event) => {

            event.preventDefault();

            const name = document.getElementById("register-name").value.trim();
            const cedula = document.getElementById("register-cedula").value.trim();
            const phone = document.getElementById("register-phone").value.trim();
            const password = document.getElementById("register-password").value;
            const passwordConfirm = document.getElementById("register-password-confirm").value;

            // Verificar campos
            if (!name || !cedula || !phone || !password || !passwordConfirm) {

                alert("Por favor, completa todos los campos.");

                return;

            }

            // Verificar contraseña
            if (password !== passwordConfirm) {

                alert("Las contraseñas no coinciden.");

                return;

            }

            // Longitud mínima
            if (password.length < 6) {

                alert("La contraseña debe tener al menos 6 caracteres.");

                return;

            }

            // Crear usuario
            const user = {
                name: name,
                cedula: cedula,
                phone: phone,
                password: password
            };

            // Guardar usuario
            localStorage.setItem(
                "marketFlashUser",
                JSON.stringify(user)
            );

            // Mantener sesión iniciada
            localStorage.setItem(
                "marketFlashLoggedIn",
                "true"
            );

            // Actualizar nombre
            updateDashboardUser();

            // Limpiar formulario
            registerForm.reset();

            // Entrar directamente a Market Flash
            showScreen(dashboardScreen);

            alert("¡Cuenta creada correctamente! Bienvenido a Market Flash.");

        });

    }

    // ==============================
    // INICIAR SESIÓN
    // ==============================

    if (loginForm) {

        loginForm.addEventListener("submit", (event) => {

            event.preventDefault();

            const cedula = document.getElementById("login-cedula").value.trim();
            const password = document.getElementById("login-password").value;

            const user = getSavedUser();

            // No existe cuenta
            if (!user) {

                alert("No existe una cuenta registrada. Primero debes crear una cuenta.");

                return;

            }

            // Verificar datos
            if (
                cedula === user.cedula &&
                password === user.password
            ) {

                // Guardar sesión
                localStorage.setItem(
                    "marketFlashLoggedIn",
                    "true"
                );

                // Actualizar nombre
                updateDashboardUser();

                // Limpiar formulario
                loginForm.reset();

                // Entrar al Dashboard
                showScreen(dashboardScreen);

            } else {

                alert("La cédula o la contraseña son incorrectas.");

            }

        });

    }

    // ==============================
    // ABRIR CONFIGURACIÓN
    // ==============================

    if (settingsButton) {

        settingsButton.addEventListener("click", () => {

            if (settingsPanel) {
                settingsPanel.classList.add("open");
            }

        });

    }

    // ==============================
    // CERRAR CONFIGURACIÓN
    // ==============================

    if (closeSettingsButton) {

        closeSettingsButton.addEventListener("click", () => {

            if (settingsPanel) {
                settingsPanel.classList.remove("open");
            }

        });

    }

    // ==============================
    // CERRAR SESIÓN
    // ==============================

    if (logoutButton) {

        logoutButton.addEventListener("click", () => {

            // Eliminar solamente la sesión activa
            localStorage.removeItem("marketFlashLoggedIn");

            // Cerrar panel de configuración
            if (settingsPanel) {
                settingsPanel.classList.remove("open");
            }

            // Volver a pantalla inicial
            showScreen(welcomeScreen);

        });

    }

    // ==============================
    // RECUPERAR SESIÓN AL CARGAR
    // ==============================

    const loggedIn = localStorage.getItem("marketFlashLoggedIn");
    const savedUser = getSavedUser();

    if (loggedIn === "true" && savedUser) {

        // Hay una sesión activa.
        // No mostrar INICIO ni CREAR CUENTA.
        // Entrar directamente al Dashboard.

        updateDashboardUser();

        showScreen(dashboardScreen);

    } else {

        // No hay sesión activa.
        showScreen(welcomeScreen);

    }

});
