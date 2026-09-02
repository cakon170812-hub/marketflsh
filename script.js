/* ========================================
   MARKET FLASH
   SISTEMA PRINCIPAL
======================================== */


/* ========================================
   CAMBIO DE PANTALLAS
======================================== */

function mostrarPantalla(id) {

    const pantallas =
        document.querySelectorAll(".pantalla");

    pantallas.forEach(function(pantalla) {

        pantalla.classList.remove("activa");

    });

    document
        .getElementById(id)
        .classList.add("activa");
}


/* ========================================
   PANTALLA PRINCIPAL
======================================== */

function volverPrincipal() {

    mostrarPantalla("pantallaPrincipal");

}


/* ========================================
   ABRIR REGISTRO
======================================== */

function abrirRegistro() {

    limpiarRegistro();

    mostrarPantalla("pantallaRegistro");

}


/* ========================================
   ABRIR LOGIN
======================================== */

function abrirLogin() {

    document.getElementById("loginCedula").value = "";
    document.getElementById("loginPassword").value = "";

    mostrarPantalla("pantallaLogin");

}


/* ========================================
   REGISTRAR USUARIO
======================================== */

function registrarUsuario() {

    const nombre =
        document.getElementById("nombre").value.trim();

    const apodo =
        document.getElementById("apodo").value.trim();

    const telefono =
        document.getElementById("telefono").value.trim();

    const cedula =
        document.getElementById("cedula").value.trim();

    const password =
        document.getElementById("passwordRegistro").value;

    const confirmar =
        document.getElementById("confirmarPassword").value;

    const terminos =
        document.getElementById("aceptarTerminos").checked;


    /* Validaciones */

    if (!nombre ||
        !apodo ||
        !telefono ||
        !cedula ||
        !password ||
        !confirmar) {

        alert("⚠️ Completa todos los campos.");

        return;
    }


    if (password !== confirmar) {

        alert("⚠️ Las contraseñas no coinciden.");

        return;
    }


    if (!terminos) {

        alert(
            "⚠️ Debes aceptar los términos y condiciones."
        );

        return;
    }


    /* Crear usuario */

    const usuario = {

        nombre: nombre,

        apodo: apodo,

        telefono: telefono,

        cedula: cedula,

        password: password

    };


    /*
       Guardamos temporalmente
       el usuario en el navegador.
    */

    localStorage.setItem(
        "marketFlashUsuario",
        JSON.stringify(usuario)
    );


    /* Sesión activa */

    localStorage.setItem(
        "marketFlashSesion",
        "activa"
    );


    /* Entrar directamente al Inicio */

    entrarAlInicio(usuario);

}


/* ========================================
   INICIAR SESIÓN
======================================== */

function iniciarSesion() {

    const cedula =
        document.getElementById("loginCedula")
            .value.trim();

    const password =
        document.getElementById("loginPassword")
            .value;


    if (!cedula || !password) {

        alert(
            "⚠️ Introduce tu número de cédula y contraseña."
        );

        return;
    }


    const datosGuardados =
        localStorage.getItem(
            "marketFlashUsuario"
        );


    if (!datosGuardados) {

        alert(
            "⚠️ No encontramos una cuenta registrada en este dispositivo."
        );

        return;
    }


    const usuario =
        JSON.parse(datosGuardados);


    if (
        usuario.cedula !== cedula ||
        usuario.password !== password
    ) {

        alert(
            "❌ La cédula o contraseña son incorrectas."
        );

        return;
    }


    /* Sesión */

    localStorage.setItem(
        "marketFlashSesion",
        "activa"
    );


    /* Entrar */

    entrarAlInicio(usuario);

}


/* ========================================
   ENTRAR AL INICIO
======================================== */

function entrarAlInicio(usuario) {

    const saludo =
        document.getElementById(
            "saludoUsuario"
        );

    saludo.textContent =
        "¡Bienvenido, " +
        usuario.apodo +
        "! ⚡";


    mostrarPantalla(
        "pantallaInicio"
    );

}


/* ========================================
   PERFIL
======================================== */

function mostrarPerfil() {

    const datosGuardados =
        localStorage.getItem(
            "marketFlashUsuario"
        );


    if (!datosGuardados) {

        return;

    }


    const usuario =
        JSON.parse(datosGuardados);


    document.getElementById(
        "perfilNombre"
    ).textContent =
        usuario.nombre;


    document.getElementById(
        "perfilApodo"
    ).textContent =
        "@" + usuario.apodo;


    document.getElementById(
        "perfilTelefono"
    ).textContent =
        usuario.telefono;


    document.getElementById(
        "perfilCedula"
    ).textContent =
        usuario.cedula;


    mostrarPantalla(
        "pantallaPerfil"
    );

}


/* ========================================
   VOLVER AL INICIO
======================================== */

function irInicio() {

    const datosGuardados =
        localStorage.getItem(
            "marketFlashUsuario"
        );


    if (datosGuardados) {

        const usuario =
            JSON.parse(datosGuardados);

        entrarAlInicio(usuario);

    } else {

        volverPrincipal();

    }

}


/* ========================================
   CERRAR SESIÓN
======================================== */

function cerrarSesion() {

    localStorage.removeItem(
        "marketFlashSesion"
    );

    mostrarPantalla(
        "pantallaPrincipal"
    );

}


/* ========================================
   LIMPIAR REGISTRO
======================================== */

function limpiarRegistro() {

    document.getElementById("nombre").value = "";

    document.getElementById("apodo").value = "";

    document.getElementById("telefono").value = "";

    document.getElementById("cedula").value = "";

    document.getElementById("passwordRegistro").value = "";

    document.getElementById("confirmarPassword").value = "";

    document.getElementById("aceptarTerminos").checked = false;

}


/* ========================================
   BUSCADOR
======================================== */

function buscarPublicaciones() {

    const texto =
        document.getElementById(
            "buscar"
        ).value.toLowerCase();


    /*
       Por ahora mostramos un mensaje.
       Después conectaremos este buscador
       con las publicaciones reales.
    */

    if (texto.length > 0) {

        console.log(
            "Buscando:",
            texto
        );

    }

}


/* ========================================
   MENSAJES TEMPORALES
======================================== */

function mostrarMensaje(mensaje) {

    alert("⚡ " + mensaje);

}


/* ========================================
   COMPROBAR SESIÓN AL ABRIR
======================================== */

window.addEventListener(
    "DOMContentLoaded",
    function() {

        const sesion =
            localStorage.getItem(
                "marketFlashSesion"
            );

        const datos =
            localStorage.getItem(
                "marketFlashUsuario"
            );


        if (
            sesion === "activa" &&
            datos
        ) {

            const usuario =
                JSON.parse(datos);

            entrarAlInicio(usuario);

        } else {

            mostrarPantalla(
                "pantallaPrincipal"
            );

        }

    }
);
