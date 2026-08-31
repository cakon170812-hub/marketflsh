// ==========================================
// MARKET FLASH - SCRIPT PRINCIPAL
// ==========================================

"use strict";

document.addEventListener("DOMContentLoaded", () => {

    console.log("Market Flash iniciado correctamente.");

});// ==========================================
// NAVEGACIÓN DE MARKET FLASH
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    const botones = {
        inicio: document.querySelector('header nav button:nth-child(1)'),
        categorias: document.querySelector('header nav button:nth-child(2)'),
        publicar: document.querySelector('header nav button:nth-child(3)'),
        promocionar: document.querySelector('header nav button:nth-child(4)'),
        reclamos: document.querySelector('header nav button:nth-child(5)'),
        soporte: document.querySelector('header nav button:nth-child(6)')
    };

    const secciones = {
        inicio: document.querySelector("#publicaciones"),
        categorias: document.querySelector("#categorias"),
        publicar: document.querySelector("#formulario-publicar"),
        promocionar: document.querySelector("#promocionar"),
        reclamos: document.querySelector("#reclamos"),
        soporte: document.querySelector("#soporte")
    };

    function irASeccion(seccion) {
        if (!seccion) {
            console.warn("Sección no encontrada.");
            return;
        }

        seccion.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    botones.inicio?.addEventListener("click", () => {
        irASeccion(secciones.inicio);
    });

    botones.categorias?.addEventListener("click", () => {
        irASeccion(secciones.categorias);
    });

    botones.publicar?.addEventListener("click", () => {
        irASeccion(secciones.publicar);
    });

    botones.promocionar?.addEventListener("click", () => {
        irASeccion(secciones.promocionar);
    });

    botones.reclamos?.addEventListener("click", () => {
        irASeccion(secciones.reclamos);
    });

    botones.soporte?.addEventListener("click", () => {
        irASeccion(secciones.soporte);
    });

});// ==========================================
// BÚSQUEDA DE PUBLICACIONES
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    const formularioBusqueda = document.querySelector("#busqueda form");
    const campoBusqueda = document.querySelector("#buscar");

    if (!formularioBusqueda || !campoBusqueda) {
        return;
    }

    formularioBusqueda.addEventListener("submit", (evento) => {

        evento.preventDefault();

        const textoBusqueda = campoBusqueda.value
            .trim()
            .toLowerCase();

        const publicaciones = document.querySelectorAll(
            ".publicacion"
        );

        if (textoBusqueda === "") {

            publicaciones.forEach((publicacion) => {
                publicacion.style.display = "";
            });

            return;
        }

        publicaciones.forEach((publicacion) => {

            const contenido = publicacion.textContent
                .toLowerCase();

            if (contenido.includes(textoBusqueda)) {
                publicacion.style.display = "";
            } else {
                publicacion.style.display = "none";
            }

        });

    });

});// ==========================================
// REGISTRO DE USUARIO
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    const formularioRegistro = document.querySelector(
        "#formulario-registro"
    );

    if (!formularioRegistro) {
        return;
    }

    formularioRegistro.addEventListener("submit", (evento) => {

        evento.preventDefault();

        const nombre = document.querySelector("#nombre")?.value.trim();
        const correo = document.querySelector("#correo")?.value.trim();
        const cedula = document.querySelector("#cedula")?.value.trim();
        const telefono = document.querySelector("#telefono")?.value.trim();
        const whatsapp = document.querySelector("#whatsapp")?.value.trim();
        const messenger = document.querySelector("#messenger")?.value.trim();

        if (!nombre || !correo || !cedula || !telefono) {
            alert("Completa todos los campos obligatorios.");
            return;
        }

        const usuario = {
            nombre,
            correo,
            cedula,
            telefono,
            whatsapp,
            messenger
        };

        localStorage.setItem(
            "marketFlashUsuario",
            JSON.stringify(usuario)
        );

        alert(
            "Registro guardado correctamente. " +
            "Más adelante conectaremos este formulario " +
            "con la base de datos."
        );

        formularioRegistro.reset();

    });

});// ==========================================
// MOSTRAR PERFIL DEL USUARIO
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    const datosGuardados = localStorage.getItem(
        "marketFlashUsuario"
    );

    if (!datosGuardados) {
        return;
    }

    try {

        const usuario = JSON.parse(datosGuardados);

        const nombre = document.querySelector("#perfil-nombre");
        const telefono = document.querySelector("#perfil-telefono");
        const whatsapp = document.querySelector("#perfil-whatsapp");
        const messenger = document.querySelector("#perfil-messenger");

        if (nombre) {
            nombre.textContent = usuario.nombre || "No registrado";
        }

        if (telefono) {
            telefono.textContent = usuario.telefono || "No registrado";
        }

        if (whatsapp) {
            whatsapp.textContent = usuario.whatsapp || "No registrado";
        }

        if (messenger) {
            messenger.textContent = usuario.messenger || "No registrado";
        }

    } catch (error) {

        console.error(
            "No se pudieron cargar los datos del usuario:",
            error
        );

    }

});
