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

});
