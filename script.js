/* =========================================
   MARKET FLASH
   SISTEMA PRINCIPAL
========================================= */

const CLAVE_USUARIO = "marketFlashUsuario";
const CLAVE_SESION = "marketFlashSesion";


/* =========================================
   CAMBIAR DE PANTALLA
========================================= */

function mostrarPantalla(idPantalla) {

    const pantallas = document.querySelectorAll(".pantalla");

    pantallas.forEach(function(pantalla) {
        pantalla.classList.remove("activa");
    });

    const pantalla = document.getElementById(idPantalla);

    if (pantalla) {
        pantalla.classList.add("activa");
    }
}


/* =========================================
   VOLVER AL INICIO
========================================= */

function volverPrincipal() {
    mostrarPantalla("pantallaPrincipal");
}


/* =========================================
   ABRIR REGISTRO
========================================= */

function abrirRegistro() {

    mostrarPantalla("pantallaRegistro");

    const campoNombre = document.getElementById("nombreCompleto");

    if (campoNombre) {
        setTimeout(function() {
            campoNombre.focus();
        }, 200);
    }
}


/* =========================================
   ABRIR LOGIN
========================================= */

function abrirInicio() {

    mostrarPantalla("pantallaLogin");

    const campoCedula = document.getElementById("loginCedula");

    if (campoCedula) {
        setTimeout(function() {
            campoCedula.focus();
        }, 200);
    }
}


/* =========================================
   CREAR CUENTA
========================================= */

function crearCuenta() {

    const nombre = document
        .getElementById("nombreCompleto")
        .value
        .trim();

    const apodo = document
        .getElementById("apodo")
        .value
        .trim();

    const cedula = document
        .getElementById("cedula")
        .value
        .trim();

    const telefono = document
        .getElementById("telefono")
        .value
        .trim();

    const correo = document
        .getElementById("correo")
        .value
        .trim();

    const contrasena = document
        .getElementById("contrasena")
        .value;

    const confirmar = document
        .getElementById("confirmarContrasena")
        .value;

    const direccion = document
        .getElementById("direccion")
        .value
        .trim();


    if (
        !nombre ||
        !apodo ||
        !cedula ||
        !telefono ||
        !correo ||
        !contrasena ||
        !confirmar ||
        !direccion
    ) {

        alert("⚠️ Completa todos los campos.");

        return;
    }


    if (contrasena !== confirmar) {

        alert("⚠️ Las contraseñas no coinciden.");

        return;
    }


    if (contrasena.length < 4) {

        alert("⚠️ La contraseña debe tener al menos 4 caracteres.");

        return;
    }


    const usuarioExistente =
        JSON.parse(
            localStorage.getItem(CLAVE_USUARIO)
        );


    if (
        usuarioExistente &&
        usuarioExistente.cedula === cedula
    ) {

        alert("⚠️ Ya existe una cuenta con esa cédula.");

        return;
    }


    const nuevoUsuario = {

        nombre: nombre,

        apodo: apodo,

        cedula: cedula,

        telefono: telefono,

        correo: correo,

        contrasena: contrasena,

        direccion: direccion
    };


    localStorage.setItem(
        CLAVE_USUARIO,
        JSON.stringify(nuevoUsuario)
    );


    localStorage.setItem(
        CLAVE_SESION,
        "activa"
    );


    alert(
        "⚡ ¡Cuenta creada correctamente!\n\nBienvenido a Market Flash."
    );


    limpiarRegistro();

    entrarAlPanel();
}


/* =========================================
   INICIAR SESIÓN
========================================= */

function iniciarSesion() {

    const cedula = document
        .getElementById("loginCedula")
        .value
        .trim();

    const contrasena = document
        .getElementById("loginContrasena")
        .value;


    if (!cedula || !contrasena) {

        alert("⚠️ Escribe tu cédula y contraseña.");

        return;
    }


    const usuario =
        JSON.parse(
            localStorage.getItem(CLAVE_USUARIO)
        );


    if (!usuario) {

        alert(
            "⚠️ No existe una cuenta todavía.\n\nPrimero debes crear una cuenta."
        );

        return;
    }


    if (
        usuario.cedula === cedula &&
        usuario.contrasena === contrasena
    ) {

        localStorage.setItem(
            CLAVE_SESION,
            "activa"
        );

        entrarAlPanel();

    } else {

        alert(
            "❌ Cédula o contraseña incorrecta."
        );
    }
}


/* =========================================
   ENTRAR AL PANEL
========================================= */

function entrarAlPanel() {

    mostrarPantalla("panelPrincipal");
}


/* =========================================
   CONFIGURACIÓN
========================================= */

function abrirConfiguracion() {

    mostrarPantalla("pantallaConfiguracion");
}


/* =========================================
   VOLVER AL PANEL
========================================= */

function volverPanel() {

    mostrarPantalla("panelPrincipal");
}


/* =========================================
   CERRAR SESIÓN
========================================= */

function cerrarSesion() {

    localStorage.removeItem(CLAVE_SESION);

    const loginCedula =
        document.getElementById("loginCedula");

    const loginContrasena =
        document.getElementById("loginContrasena");


    if (loginCedula) {
        loginCedula.value = "";
    }

    if (loginContrasena) {
        loginContrasena.value = "";
    }


    mostrarPantalla("pantallaPrincipal");
}


/* =========================================
   LIMPIAR REGISTRO
========================================= */

function limpiarRegistro() {

    const campos = [

        "nombreCompleto",
        "apodo",
        "cedula",
        "telefono",
        "correo",
        "contrasena",
        "confirmarContrasena",
        "direccion"

    ];


    campos.forEach(function(id) {

        const campo =
            document.getElementById(id);

        if (campo) {
            campo.value = "";
        }

    });
}


/* =========================================
   RECUPERAR SESIÓN
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        const sesion =
            localStorage.getItem(CLAVE_SESION);

        const usuario =
            localStorage.getItem(CLAVE_USUARIO);


        if (
            sesion === "activa" &&
            usuario
        ) {

            mostrarPantalla("panelPrincipal");

        } else {

            mostrarPantalla("pantallaPrincipal");
        }

    }
);
