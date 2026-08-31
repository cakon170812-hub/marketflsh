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
// ==========================================
// INICIO DE SESIÓN
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    const formularioLogin = document.querySelector(
        "#formulario-login"
    );

    if (!formularioLogin) {
        return;
    }

    formularioLogin.addEventListener("submit", (evento) => {

        evento.preventDefault();

        const correo = document.querySelector(
            "#login-correo"
        )?.value.trim();

        const password = document.querySelector(
            "#login-password"
        )?.value;

        if (!correo || !password) {
            alert("Escribe tu correo y contraseña.");
            return;
        }

        const usuarioGuardado = localStorage.getItem(
            "marketFlashUsuario"
        );

        if (!usuarioGuardado) {
            alert(
                "No existe una cuenta guardada en este navegador."
            );
            return;
        }

        try {

            const usuario = JSON.parse(usuarioGuardado);

            /*
             * Por ahora hacemos una comprobación básica.
             * La autenticación real se conectará después
             * con la base de datos.
             */

            if (correo !== usuario.correo) {
                alert("El correo no coincide con la cuenta registrada.");
                return;
            }

            localStorage.setItem(
                "marketFlashSesion",
                "activa"
            );

            alert("Inicio de sesión realizado correctamente.");

            formularioLogin.reset();

        } catch (error) {

            console.error(
                "Error al iniciar sesión:",
                error
            );

            alert(
                "No se pudo procesar el inicio de sesión."
            );
        }

    });

});// ==========================================
// CREAR PUBLICACIÓN
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    const formularioPublicacion = document.querySelector(
        "#form-publicacion"
    );

    const listaPublicaciones = document.querySelector(
        "#lista-publicaciones"
    );

    if (!formularioPublicacion || !listaPublicaciones) {
        return;
    }

    formularioPublicacion.addEventListener("submit", (evento) => {

        evento.preventDefault();

        const nombre = document.querySelector(
            "#nombre-producto"
        )?.value.trim();

        const categoria = document.querySelector(
            "#categoria-producto"
        )?.value;

        const precio = document.querySelector(
            "#precio-producto"
        )?.value;

        const cantidad = document.querySelector(
            "#cantidad-producto"
        )?.value;

        const descripcion = document.querySelector(
            "#descripcion-producto"
        )?.value.trim();

        const contacto = document.querySelector(
            "#contacto-preferido"
        )?.value;

        const imagenInput = document.querySelector(
            "#imagen-producto"
        );

        if (
            !nombre ||
            !categoria ||
            !precio ||
            !cantidad ||
            !descripcion ||
            !contacto
        ) {
            alert("Completa todos los campos obligatorios.");
            return;
        }

        const publicacion = {
            id: Date.now(),
            nombre,
            categoria,
            precio,
            cantidad,
            descripcion,
            contacto,
            estado: "Pendiente de aprobación"
        };

        let publicaciones = [];

        try {

            publicaciones = JSON.parse(
                localStorage.getItem(
                    "marketFlashPublicaciones"
                )
            ) || [];

        } catch (error) {

            console.error(
                "Error al cargar publicaciones:",
                error
            );

            publicaciones = [];
        }

        publicaciones.push(publicacion);

        localStorage.setItem(
            "marketFlashPublicaciones",
            JSON.stringify(publicaciones)
        );


        // Crear tarjeta visual
        const articulo = document.createElement("article");

        articulo.className = "publicacion";

        articulo.innerHTML = `
            <div class="imagen-producto">
                <img
                    src=""
                    alt="${nombre}"
                >
            </div>

            <div class="informacion-publicacion">

                <h3>${nombre}</h3>

                <p>
                    <strong>Categoría:</strong>
                    ${categoria}
                </p>

                <p>
                    ${descripcion}
                </p>

                <p>
                    <strong>Precio:</strong>
                    RD$ ${precio}
                </p>

                <p>
                    <strong>Cantidad:</strong>
                    ${cantidad}
                </p>

                <p>
                    <strong>Contacto:</strong>
                    ${contacto}
                </p>

                <p>
                    <strong>Estado:</strong>
                    Pendiente de aprobación
                </p>

                <button type="button">
                    Ver publicación
                </button>

            </div>
        `;

        listaPublicaciones.appendChild(articulo);


        // Mostrar imagen seleccionada
        if (
            imagenInput &&
            imagenInput.files &&
            imagenInput.files[0]
        ) {

            const archivo = imagenInput.files[0];

            const lector = new FileReader();

            lector.onload = (resultado) => {

                const imagen = articulo.querySelector(
                    ".imagen-producto img"
                );

                if (imagen) {
                    imagen.src = resultado.target.result;
                }

            };

            lector.readAsDataURL(archivo);
        }


        formularioPublicacion.reset();

        alert(
            "Publicación creada y enviada " +
            "para aprobación."
        );

    });

});// ==========================================
// CARGAR PUBLICACIONES GUARDADAS
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    const listaPublicaciones = document.querySelector(
        "#lista-publicaciones"
    );

    if (!listaPublicaciones) {
        return;
    }

    let publicaciones = [];

    try {

        publicaciones = JSON.parse(
            localStorage.getItem(
                "marketFlashPublicaciones"
            )
        ) || [];

    } catch (error) {

        console.error(
            "No se pudieron cargar las publicaciones:",
            error
        );

        publicaciones = [];
    }


    publicaciones.forEach((publicacion) => {

        const articulo = document.createElement("article");

        articulo.className = "publicacion";

        articulo.innerHTML = `
            <div class="imagen-producto">
                <img
                    src=""
                    alt="${publicacion.nombre}"
                >
            </div>

            <div class="informacion-publicacion">

                <h3>${publicacion.nombre}</h3>

                <p>
                    <strong>Categoría:</strong>
                    ${publicacion.categoria}
                </p>

                <p>
                    ${publicacion.descripcion}
                </p>

                <p>
                    <strong>Precio:</strong>
                    RD$ ${publicacion.precio}
                </p>

                <p>
                    <strong>Cantidad:</strong>
                    ${publicacion.cantidad}
                </p>

                <p>
                    <strong>Contacto:</strong>
                    ${publicacion.contacto}
                </p>

                <p>
                    <strong>Estado:</strong>
                    ${publicacion.estado}
                </p>

                <button type="button">
                    Ver publicación
                </button>

            </div>
        `;

        listaPublicaciones.appendChild(articulo);

    });

});// ==========================================
// SISTEMA DE FAVORITOS
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    const listaPublicaciones = document.querySelector(
        "#lista-publicaciones"
    );

    const listaFavoritos = document.querySelector(
        "#lista-favoritos"
    );

    if (!listaPublicaciones) {
        return;
    }

    function obtenerFavoritos() {

        try {

            return JSON.parse(
                localStorage.getItem(
                    "marketFlashFavoritos"
                )
            ) || [];

        } catch (error) {

            console.error(
                "Error al cargar favoritos:",
                error
            );

            return [];
        }
    }


    function guardarFavoritos(favoritos) {

        localStorage.setItem(
            "marketFlashFavoritos",
            JSON.stringify(favoritos)
        );

    }


    function actualizarFavoritos() {

        if (!listaFavoritos) {
            return;
        }

        const favoritos = obtenerFavoritos();

        listaFavoritos.innerHTML = "";

        if (favoritos.length === 0) {

            listaFavoritos.innerHTML = `
                <p>
                    Todavía no tienes productos favoritos.
                </p>
            `;

            return;
        }

        favoritos.forEach((favorito) => {

            const elemento = document.createElement("article");

            elemento.className = "mi-publicacion";

            elemento.innerHTML = `
                <h3>${favorito.nombre}</h3>

                <p>
                    <strong>Precio:</strong>
                    RD$ ${favorito.precio}
                </p>

                <button
                    type="button"
                    data-quitar-favorito="${favorito.id}"
                >
                    Quitar de favoritos
                </button>
            `;

            listaFavoritos.appendChild(elemento);

        });

    }


    function agregarBotonesFavoritos() {

        const publicaciones = document.querySelectorAll(
            ".publicacion"
        );

        publicaciones.forEach((publicacion, indice) => {

            if (
                publicacion.querySelector(
                    ".boton-favorito"
                )
            ) {
                return;
            }

            const boton = document.createElement("button");

            boton.type = "button";
            boton.className = "boton-favorito";
            boton.textContent = "Añadir a favoritos";

            boton.addEventListener("click", () => {

                const titulo = publicacion.querySelector(
                    "h3"
                )?.textContent || "Producto";

                const precioTexto = publicacion.querySelector(
                    ".informacion-publicacion p:nth-of-type(2)"
                )?.textContent || "RD$ 0";

                const favoritos = obtenerFavoritos();

                const id = `publicacion-${indice}`;

                const existe = favoritos.some(
                    (favorito) => favorito.id === id
                );

                if (existe) {

                    alert(
                        "Este producto ya está en favoritos."
                    );

                    return;
                }

                favoritos.push({
                    id,
                    nombre: titulo,
                    precio: precioTexto
                });

                guardarFavoritos(favoritos);

                actualizarFavoritos();

                alert(
                    "Producto añadido a favoritos."
                );

            });

            const contenedor = publicacion.querySelector(
                ".informacion-publicacion"
            );

            if (contenedor) {
                contenedor.appendChild(boton);
            }

        });

    }


    listaFavoritos?.addEventListener("click", (evento) => {

        const boton = evento.target.closest(
            "[data-quitar-favorito]"
        );

        if (!boton) {
            return;
        }

        const id = boton.dataset.quitarFavorito;

        const favoritos = obtenerFavoritos().filter(
            (favorito) => favorito.id !== id
        );

        guardarFavoritos(favoritos);

        actualizarFavoritos();

    });


    agregarBotonesFavoritos();
    actualizarFavoritos();

});// ==========================================
// NOTIFICACIONES DE MARKET FLASH
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    const listaNotificaciones = document.querySelector(
        "#lista-notificaciones"
    );

    if (!listaNotificaciones) {
        return;
    }

    function obtenerPublicaciones() {

        try {

            return JSON.parse(
                localStorage.getItem(
                    "marketFlashPublicaciones"
                )
            ) || [];

        } catch (error) {

            console.error(
                "No se pudieron cargar las publicaciones:",
                error
            );

            return [];
        }
    }


    function mostrarNotificaciones() {

        const publicaciones = obtenerPublicaciones();

        const pendientes = publicaciones.filter(
            (publicacion) =>
                publicacion.estado === "Pendiente de aprobación"
        );

        listaNotificaciones.innerHTML = "";

        if (pendientes.length === 0) {

            listaNotificaciones.innerHTML = `
                <article class="notificacion">
                    <h3>Sin notificaciones nuevas</h3>

                    <p>
                        No hay publicaciones pendientes
                        de revisión.
                    </p>
                </article>
            `;

            return;
        }


        pendientes.forEach((publicacion) => {

            const notificacion =
                document.createElement("article");

            notificacion.className = "notificacion";

            notificacion.innerHTML = `
                <h3>
                    Pago pendiente de verificación
                </h3>

                <p>
                    La publicación
                    <strong>${publicacion.nombre}</strong>
                    está esperando aprobación.
                </p>

                <p>
                    <strong>Precio:</strong>
                    RD$ ${publicacion.precio}
                </p>

                <p>
                    <strong>Estado:</strong>
                    ${publicacion.estado}
                </p>

                <button
                    type="button"
                    data-publicacion-id="${publicacion.id}"
                >
                    Revisar publicación
                </button>
            `;

            listaNotificaciones.appendChild(
                notificacion
            );

        });

    }


    listaNotificaciones.addEventListener(
        "click",
        (evento) => {

            const boton = evento.target.closest(
                "[data-publicacion-id]"
            );

            if (!boton) {
                return;
            }

            const id = Number(
                boton.dataset.publicacionId
            );

            const publicaciones =
                obtenerPublicaciones();

            const publicacion = publicaciones.find(
                (item) => item.id === id
            );

            if (!publicacion) {
                alert(
                    "No se encontró la publicación."
                );
                return;
            }

            alert(
                `Publicación: ${publicacion.nombre}\n` +
                `Precio: RD$ ${publicacion.precio}\n` +
                `Estado: ${publicacion.estado}\n\n` +
                `La revisión real del comprobante ` +
                `se conectará posteriormente.`
            );

        }
    );


    mostrarNotificaciones();

});// ==========================================
// APROBAR O RECHAZAR PUBLICACIONES
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    const botonAprobar = document.querySelector(
        "#aprobar-publicacion"
    );

    const botonRechazar = document.querySelector(
        "#rechazar-publicacion"
    );

    if (!botonAprobar && !botonRechazar) {
        return;
    }

    function obtenerPublicaciones() {

        try {

            return JSON.parse(
                localStorage.getItem(
                    "marketFlashPublicaciones"
                )
            ) || [];

        } catch (error) {

            console.error(
                "Error al cargar publicaciones:",
                error
            );

            return [];
        }
    }


    function guardarPublicaciones(publicaciones) {

        localStorage.setItem(
            "marketFlashPublicaciones",
            JSON.stringify(publicaciones)
        );

    }


    function cambiarEstado(nuevoEstado) {

        const publicaciones = obtenerPublicaciones();

        if (publicaciones.length === 0) {

            alert(
                "No hay publicaciones pendientes."
            );

            return;
        }

        const indice = publicaciones.findIndex(
            (publicacion) =>
                publicacion.estado ===
                "Pendiente de aprobación"
        );

        if (indice === -1) {

            alert(
                "No hay publicaciones pendientes."
            );

            return;
        }

        publicaciones[indice].estado = nuevoEstado;

        guardarPublicaciones(publicaciones);

        if (nuevoEstado === "Aprobada") {

            alert(
                "Publicación aprobada correctamente."
            );

        } else {

            alert(
                "Publicación rechazada."
            );
        }

        window.location.reload();

    }


    botonAprobar?.addEventListener(
        "click",
        () => {

            cambiarEstado("Aprobada");

        }
    );


    botonRechazar?.addEventListener(
        "click",
        () => {

            cambiarEstado("Rechazada");

        }
    );

});// ==========================================
// MARCAR PRODUCTO COMO VENDIDO
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    const listaMisPublicaciones = document.querySelector(
        "#lista-mis-publicaciones"
    );

    const listaVendidos = document.querySelector(
        "#lista-vendidos"
    );

    if (!listaMisPublicaciones) {
        return;
    }

    function obtenerPublicaciones() {

        try {

            return JSON.parse(
                localStorage.getItem(
                    "marketFlashPublicaciones"
                )
            ) || [];

        } catch (error) {

            console.error(
                "Error al cargar publicaciones:",
                error
            );

            return [];
        }
    }


    function guardarPublicaciones(publicaciones) {

        localStorage.setItem(
            "marketFlashPublicaciones",
            JSON.stringify(publicaciones)
        );

    }


    function mostrarPublicaciones() {

        const publicaciones =
            obtenerPublicaciones();

        listaMisPublicaciones.innerHTML = "";

        if (publicaciones.length === 0) {

            listaMisPublicaciones.innerHTML = `
                <p>
                    No tienes publicaciones todavía.
                </p>
            `;

            return;
        }


        publicaciones.forEach((publicacion) => {

            const articulo =
                document.createElement("article");

            articulo.className = "mi-publicacion";

            articulo.innerHTML = `
                <h3>
                    ${publicacion.nombre}
                </h3>

                <p>
                    <strong>Precio:</strong>
                    RD$ ${publicacion.precio}
                </p>

                <p>
                    <strong>Estado:</strong>
                    ${publicacion.estado}
                </p>

                <button
                    type="button"
                    data-vendido-id="${publicacion.id}"
                >
                    Marcar como vendido
                </button>
            `;

            listaMisPublicaciones.appendChild(
                articulo
            );

        });

    }


    mostrarPublicaciones();


    listaMisPublicaciones.addEventListener(
        "click",
        (evento) => {

            const boton = evento.target.closest(
                "[data-vendido-id]"
            );

            if (!boton) {
                return;
            }

            const id = Number(
                boton.dataset.vendidoId
            );

            const publicaciones =
                obtenerPublicaciones();

            const indice =
                publicaciones.findIndex(
                    (publicacion) =>
                        publicacion.id === id
                );

            if (indice === -1) {
                alert(
                    "No se encontró la publicación."
                );
                return;
            }

            publicaciones[indice].estado =
                "Vendido";

            guardarPublicaciones(
                publicaciones
            );

            alert(
                "El producto fue marcado como vendido."
            );

            mostrarPublicaciones();

            if (listaVendidos) {

                const producto =
                    document.createElement("article");

                producto.className =
                    "mi-publicacion";

                producto.innerHTML = `
                    <h3>
                        ${publicaciones[indice].nombre}
                    </h3>

                    <p>
                        Producto vendido correctamente.
                    </p>
                `;

                listaVendidos.appendChild(
                    producto
                );
            }

        }
    );

});// ==========================================
// SOLICITAR PROMOCIÓN
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    const botonPromocionar = document.querySelector(
        "#promocionar button"
    );

    if (!botonPromocionar) {
        return;
    }

    botonPromocionar.addEventListener(
        "click",
        () => {

            const usuarioGuardado =
                localStorage.getItem(
                    "marketFlashUsuario"
                );

            if (!usuarioGuardado) {

                alert(
                    "Primero debes registrarte " +
                    "o iniciar sesión."
                );

                return;
            }

            let solicitudes = [];

            try {

                solicitudes = JSON.parse(
                    localStorage.getItem(
                        "marketFlashPromociones"
                    )
                ) || [];

            } catch (error) {

                console.error(
                    "Error al cargar promociones:",
                    error
                );

                solicitudes = [];
            }


            const solicitud = {
                id: Date.now(),
                fecha: new Date().toISOString(),
                estado: "Pendiente"
            };


            solicitudes.push(solicitud);


            localStorage.setItem(
                "marketFlashPromociones",
                JSON.stringify(solicitudes)
            );


            alert(
                "Solicitud de promoción creada. " +
                "Más adelante añadiremos el proceso " +
                "de pago y aprobación."
            );

        }
    );

});// ==========================================
// SISTEMA DE CALIFICACIONES
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    const formularioCalificacion = document.querySelector(
        "#form-calificacion"
    );

    if (!formularioCalificacion) {
        return;
    }

    formularioCalificacion.addEventListener(
        "submit",
        (evento) => {

            evento.preventDefault();

            const estrellas = document.querySelector(
                "#estrellas"
            )?.value;

            const comentario = document.querySelector(
                "#comentario-calificacion"
            )?.value.trim();

            if (!estrellas) {
                alert(
                    "Selecciona una calificación."
                );
                return;
            }

            let calificaciones = [];

            try {

                calificaciones = JSON.parse(
                    localStorage.getItem(
                        "marketFlashCalificaciones"
                    )
                ) || [];

            } catch (error) {

                console.error(
                    "Error al cargar calificaciones:",
                    error
                );

                calificaciones = [];
            }

            calificaciones.push({
                id: Date.now(),
                estrellas: Number(estrellas),
                comentario: comentario || "",
                fecha: new Date().toISOString()
            });

            localStorage.setItem(
                "marketFlashCalificaciones",
                JSON.stringify(calificaciones)
            );

            alert(
                "Gracias. Tu calificación fue registrada."
            );

            formularioCalificacion.reset();

        }
    );

});// ==========================================
// SISTEMA DE REPORTES
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    const formularioReporte = document.querySelector(
        "#form-reporte"
    );

    if (!formularioReporte) {
        return;
    }

    formularioReporte.addEventListener(
        "submit",
        (evento) => {

            evento.preventDefault();

            const motivo = document.querySelector(
                "#motivo-reporte"
            )?.value;

            const detalle = document.querySelector(
                "#detalle-reporte"
            )?.value.trim();

            if (!motivo || !detalle) {

                alert(
                    "Completa el motivo y los detalles del reporte."
                );

                return;
            }

            let reportes = [];

            try {

                reportes = JSON.parse(
                    localStorage.getItem(
                        "marketFlashReportes"
                    )
                ) || [];

            } catch (error) {

                console.error(
                    "Error al cargar los reportes:",
                    error
                );

                reportes = [];
            }

            const reporte = {
                id: Date.now(),
                motivo,
                detalle,
                estado: "Pendiente",
                fecha: new Date().toISOString()
            };

            reportes.push(reporte);

            localStorage.setItem(
                "marketFlashReportes",
                JSON.stringify(reportes)
            );

            alert(
                "Tu reporte fue enviado correctamente."
            );

            formularioReporte.reset();

        }
    );

});// ==========================================
// CERRAR SESIÓN
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    const botonesPerfil = document.querySelectorAll(
        "#opciones-perfil button"
    );

    if (!botonesPerfil.length) {
        return;
    }

    botonesPerfil.forEach((boton) => {

        if (
            boton.textContent
                .trim()
                .toLowerCase() !== "cerrar sesión"
        ) {
            return;
        }

        boton.addEventListener("click", () => {

            const sesion = localStorage.getItem(
                "marketFlashSesion"
            );

            if (sesion !== "activa") {

                alert(
                    "No hay una sesión iniciada."
                );

                return;
            }

            localStorage.removeItem(
                "marketFlashSesion"
            );

            alert(
                "Has cerrado sesión correctamente."
            );

            window.location.reload();

        });

    });

});// ==========================================
// COPIAR DIRECCIÓN DE BINANCE
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    const botonCopiar = document.querySelector(
        "#pago-binance button"
    );

    const direccionElemento = document.querySelector(
        "#direccion-binance p:last-child"
    );

    if (!botonCopiar || !direccionElemento) {
        return;
    }

    botonCopiar.addEventListener("click", async () => {

        const direccion =
            direccionElemento.textContent.trim();

        if (
            !direccion ||
            direccion === "PENDIENTE DE CONFIGURAR"
        ) {

            alert(
                "La dirección de Binance todavía no está configurada."
            );

            return;
        }

        try {

            await navigator.clipboard.writeText(
                direccion
            );

            alert(
                "Dirección de Binance copiada."
            );

        } catch (error) {

            console.error(
                "No se pudo copiar la dirección:",
                error
            );

            alert(
                "No se pudo copiar la dirección."
            );
        }

    });

});// ==========================================
// ENVÍO DE COMPROBANTE DE PAGO
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    const botonComprobante = document.querySelector(
        "#enviar-comprobante"
    );

    const archivoComprobante = document.querySelector(
        "#captura-pago"
    );

    if (!botonComprobante || !archivoComprobante) {
        return;
    }

    botonComprobante.addEventListener("click", () => {

        const archivo = archivoComprobante.files[0];

        if (!archivo) {

            alert(
                "Selecciona primero la captura del comprobante."
            );

            return;
        }

        const usuario = localStorage.getItem(
            "marketFlashUsuario"
        );

        if (!usuario) {

            alert(
                "Primero debes registrarte o iniciar sesión."
            );

            return;
        }

        let comprobantes = [];

        try {

            comprobantes = JSON.parse(
                localStorage.getItem(
                    "marketFlashComprobantes"
                )
            ) || [];

        } catch (error) {

            console.error(
                "Error al cargar comprobantes:",
                error
            );

            comprobantes = [];
        }

        const comprobante = {
            id: Date.now(),
            nombreArchivo: archivo.name,
            tipoArchivo: archivo.type,
            estado: "Pendiente de revisión",
            fecha: new Date().toISOString()
        };

        comprobantes.push(comprobante);

        localStorage.setItem(
            "marketFlashComprobantes",
            JSON.stringify(comprobantes)
        );

        const estadoPago = document.querySelector(
            "#estado-pago"
        );

        if (estadoPago) {

            estadoPago.innerHTML = `
                <p>
                    <strong>Estado:</strong>
                    Pendiente de revisión
                </p>

                <p>
                    Tu comprobante fue enviado
                    correctamente.
                </p>
            `;
        }

        archivoComprobante.value = "";

        alert(
            "Comprobante enviado correctamente. " +
            "El administrador deberá revisarlo."
        );

    });

});// ==========================================
// SELECCIÓN DEL MÉTODO DE PAGO
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    const opcionesPago = document.querySelectorAll(
        'input[name="metodo-pago"]'
    );

    const pagoBinance = document.querySelector(
        "#pago-binance"
    );

    const pagoPaypal = document.querySelector(
        "#pago-paypal"
    );

    if (
        !opcionesPago.length ||
        !pagoBinance ||
        !pagoPaypal
    ) {
        return;
    }


    function actualizarMetodoPago() {

        const seleccion =
            document.querySelector(
                'input[name="metodo-pago"]:checked'
            )?.value;


        if (seleccion === "binance") {

            pagoBinance.style.display = "block";
            pagoPaypal.style.display = "none";

            return;
        }


        if (seleccion === "paypal") {

            pagoBinance.style.display = "none";
            pagoPaypal.style.display = "block";

            return;
        }


        pagoBinance.style.display = "none";
        pagoPaypal.style.display = "none";

    }


    opcionesPago.forEach((opcion) => {

        opcion.addEventListener(
            "change",
            actualizarMetodoPago
        );

    });


    actualizarMetodoPago();

});
