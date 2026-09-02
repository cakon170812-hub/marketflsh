/* =========================================================
   MARKET FLASH
   SCRIPT PRINCIPAL
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       PANTALLAS
       ===================================================== */

    const welcomeScreen = document.getElementById("welcome-screen");
    const loginScreen = document.getElementById("login-screen");
    const registerScreen = document.getElementById("register-screen");
    const dashboardScreen = document.getElementById("dashboard-screen");

    /* =====================================================
       BOTONES
       ===================================================== */

    const loginButton = document.getElementById("login-button");
    const registerButton = document.getElementById("register-button");

    const backFromLogin = document.getElementById("back-from-login");
    const backFromRegister = document.getElementById("back-from-register");

    const settingsButton = document.getElementById("settings-button");
    const closeSettings = document.getElementById("close-settings");
    const logoutButton = document.getElementById("logout-button");

    const settingsPanel = document.getElementById("settings-panel");

    /* =====================================================
       FORMULARIOS
       ===================================================== */

    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");

    const userNameDisplay =
        document.getElementById("user-name-display");


    /* =====================================================
       FUNCIONES DE NAVEGACIÓN
       ===================================================== */

    function showScreen(screenToShow) {

        const screens = [
            welcomeScreen,
            loginScreen,
            registerScreen,
            dashboardScreen
        ];

        screens.forEach(screen => {

            if (!screen) return;

            screen.classList.remove("active");

        });

        if (screenToShow) {

            screenToShow.classList.add("active");

        }

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }


    /* =====================================================
       IR A INICIO DE SESIÓN
       ===================================================== */

    loginButton.addEventListener("click", () => {

        showScreen(loginScreen);

    });


    /* =====================================================
       IR A CREAR CUENTA
       ===================================================== */

    registerButton.addEventListener("click", () => {

        showScreen(registerScreen);

    });


    /* =====================================================
       VOLVER DESDE LOGIN
       ===================================================== */

    backFromLogin.addEventListener("click", () => {

        loginForm.reset();

        showScreen(welcomeScreen);

    });


    /* =====================================================
       VOLVER DESDE REGISTRO
       ===================================================== */

    backFromRegister.addEventListener("click", () => {

        registerForm.reset();

        showScreen(welcomeScreen);

    });


    /* =====================================================
       REGISTRO DE USUARIO
       ===================================================== */

    registerForm.addEventListener("submit", event => {

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
            document.getElementById("register-password-confirm").value;


        /* -----------------------------------------------
           VALIDACIONES
           ----------------------------------------------- */

        if (!name || !cedula || !phone || !password || !passwordConfirm) {

            alert("Por favor, completa todos los campos.");

            return;
        }


        if (password !== passwordConfirm) {

            alert("Las contraseñas no coinciden.");

            return;
        }


        if (password.length < 6) {

            alert("La contraseña debe tener al menos 6 caracteres.");

            return;
        }


        /* -----------------------------------------------
           CREAR USUARIO LOCAL
           ----------------------------------------------- */

        const user = {

            name: name,

            cedula: cedula,

            phone: phone,

            password: password

        };


        /*
         * NOTA:
         * Esto es almacenamiento local para la primera versión.
         * Más adelante conectaremos un sistema seguro de usuarios.
         */

        localStorage.setItem(
            "marketFlashUser",
            JSON.stringify(user)
        );


        /* -----------------------------------------------
           SESIÓN AUTOMÁTICA
           ----------------------------------------------- */

        localStorage.setItem(
            "marketFlashLoggedIn",
            "true"
        );


        /* -----------------------------------------------
           MOSTRAR NOMBRE
           ----------------------------------------------- */

        userNameDisplay.textContent = name;


        /* -----------------------------------------------
           LIMPIAR FORMULARIO
           ----------------------------------------------- */

        registerForm.reset();


        /* -----------------------------------------------
           ENTRAR DIRECTAMENTE AL PANEL
           ----------------------------------------------- */

        showScreen(dashboardScreen);


        alert(
            "Cuenta creada correctamente. Bienvenido a Market Flash."
        );

    });


    /* =====================================================
       INICIO DE SESIÓN
       ===================================================== */

    loginForm.addEventListener("submit", event => {

        event.preventDefault();


        const cedula =
            document.getElementById("login-cedula").value.trim();

        const password =
            document.getElementById("login-password").value;


        /* -----------------------------------------------
           BUSCAR USUARIO
           ----------------------------------------------- */

        const savedUser =
            localStorage.getItem("marketFlashUser");


        if (!savedUser) {

            alert(
                "No existe una cuenta registrada en este dispositivo."
            );

            return;
        }


        let user;

        try {

            user = JSON.parse(savedUser);

        } catch (error) {

            alert(
                "No se pudo leer la información de la cuenta."
            );

            return;
        }


        /* -----------------------------------------------
           COMPROBAR CÉDULA
           ----------------------------------------------- */

        if (cedula !== user.cedula) {

            alert("El número de cédula no es correcto.");

            return;
        }


        /* -----------------------------------------------
           COMPROBAR CONTRASEÑA
           ----------------------------------------------- */

        if (password !== user.password) {

            alert("La contraseña no es correcta.");

            return;
        }


        /* -----------------------------------------------
           CREAR SESIÓN
           ----------------------------------------------- */

        localStorage.setItem(
            "marketFlashLoggedIn",
            "true"
        );


        userNameDisplay.textContent = user.name;


        loginForm.reset();


        showScreen(dashboardScreen);

    });


    /* =====================================================
       ABRIR CONFIGURACIÓN
       ===================================================== */

    settingsButton.addEventListener("click", () => {

        settingsPanel.classList.add("open");

    });


    /* =====================================================
       CERRAR CONFIGURACIÓN
       ===================================================== */

    closeSettings.addEventListener("click", () => {

        settingsPanel.classList.remove("open");

    });


    /* =====================================================
       CERRAR SESIÓN
       ===================================================== */

    logoutButton.addEventListener("click", () => {

        localStorage.removeItem(
            "marketFlashLoggedIn"
        );

        settingsPanel.classList.remove("open");

        showScreen(welcomeScreen);

    });


    /* =====================================================
       COMPROBAR SI YA EXISTE UNA SESIÓN
       ===================================================== */

    const loggedIn =
        localStorage.getItem("marketFlashLoggedIn");

    const savedUser =
        localStorage.getItem("marketFlashUser");


    if (loggedIn === "true" && savedUser) {

        try {

            const user = JSON.parse(savedUser);

            userNameDisplay.textContent =
                user.name || "Market Flash";

        } catch (error) {

            localStorage.removeItem(
                "marketFlashLoggedIn"
            );

        }

    }


    /* =====================================================
       PANTALLA INICIAL
       ===================================================== */

    showScreen(welcomeScreen);

});
