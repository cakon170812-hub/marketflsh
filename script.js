/* =========================================
   MICHAEL FLASH
   SISTEMA BASE
========================================= */


const CLAVE_USUARIO = "michaelFlashUsuario";

const CLAVE_SESION = "michaelFlashSesion";


/* =========================================
   MOSTRAR PANTALLA
========================================= */

function mostrarPantalla(id) {

    const pantallas = document.querySelectorAll(".pantalla");

    pantallas.forEach(function(pantalla) {

        pantalla.classList.remove("activa");

    });


    const pantalla = document.getElementById(id);

    if (pantalla) {

        pantalla.classList.add("activa");

    }


    window.scrollTo(0, 0);
}


/* =========================================
   VOLVER A PRINCIPAL
========================================= */

function volverPrincipal() {

    mostrarPantalla("pantallaPrincipal");
}


/* =========================================
   ABRIR REGISTRO
========================================= */

function abrirRegistro() {

    limpiarRegistro();

    mostrarPantalla("pantallaRegistro");
}


/* =========================================
   ABRIR INICIO
========================================= */

function abrirInicio() {

    document.getElementById("loginCedula").value = "";

    document.getElementById("loginPassword").value = "";

    mostrarPantalla("pantallaLogin");
}


/* =========================================
   CREAR CUENTA
========================================= */

function crearCuenta() {

    const nombre =
        document.getElementById("nombre").value.trim();

    const apodo =
        document.getElementById("apodo").value.trim();

    const cedula =
        document.getElementById("cedula").value.trim();

    const telefono =
        document.getElementById("telefono").value.trim();

    const correo =
        document.getElementById("correo").value.trim();

    const password =
        document.getElementById("password").value;

    const confirmarPassword =
        document.getElementById("confirmarPassword").value;

    const direccion =
        document.getElementById("direccion").value.trim();


    /* COMPROBAR CAMPOS */

    if (
        !nombre ||
        !apodo ||
        !cedula ||
        !telefono ||
        !correo ||
        !password ||
        !confirmarPassword ||
        !direccion
    ) {

        alert("Completa todos los campos.");

        return;
    }


    /* COMPROBAR CONTRASEÑA */

    if (password !== confirmarPassword) {

        alert("Las contraseñas no coinciden.");

        return;
    }


    if (password.length < 4) {

        alert("La contraseña debe tener al menos 4 caracteres.");

        return;
    }


    /* COMPROBAR CUENTA EXISTENTE */

    const usuarioAnterior =
        JSON.parse(
            localStorage.getItem(CLAVE_USUARIO)
        );


    if (
        usuarioAnterior &&
        usuarioAnterior.cedula === cedula
    ) {

        alert("Ya existe una cuenta con esa cédula.");

        return;
    }


    /* CREAR USUARIO */

    const usuario = {

        nombre: nombre,

        apodo: apodo,

        cedula: cedula,

        telefono: telefono,

        correo: correo,

        password: password,

        direccion: direccion

    };


    localStorage.setItem(

        CLAVE_USUARIO,

        JSON.stringify(usuario)

    );


    /* ACTIVAR SESIÓN */

    localStorage.setItem(

        CLAVE_SESION,

        "activa"

    );


    alert("¡Cuenta creada correctamente!");


    /* IR DIRECTAMENTE AL PANEL */

    entrarAlPanel();
}


/* =========================================
   INICIAR SESIÓN
========================================= */

function iniciarSesion() {

    const cedula =
        document.getElementById("loginCedula").value.trim();

    const password =
        document.getElementById("loginPassword").value;


    const usuario =
        JSON.parse(
            localStorage.getItem(CLAVE_USUARIO)
        );


    if (!usuario) {

        alert(
            "No existe una cuenta. Primero debes crear una cuenta."
        );

        return;
    }


    if (
        usuario.cedula !== cedula ||
        usuario.password !== password
    ) {

        alert(
            "La cédula o contraseña es incorrecta."
        );

        return;
    }


    localStorage.setItem(

        CLAVE_SESION,

        "activa"

    );


    entrarAlPanel();
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

    alert("Sesión cerrada correctamente.");

    volverPrincipal();
}


/* =========================================
   LIMPIAR REGISTRO
========================================= */

function limpiarRegistro() {

    const campos = [

        "nombre",

        "apodo",

        "cedula",

        "telefono",

        "correo",

        "password",

        "confirmarPassword",

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
   COMPROBAR SESIÓN AL ABRIR
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        const sesion =
            localStorage.getItem(
                CLAVE_SESION
            );


        if (sesion === "activa") {

            entrarAlPanel();

        } else {

            volverPrincipal();

        }

    }
);
