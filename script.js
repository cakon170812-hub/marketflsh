<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <meta
        name="description"
        content="Market Flash - Compra, vende y promociona productos."
    >

    <meta
        name="theme-color"
        content="#111827"
    >

    <title>Market Flash</title>

    <link
        rel="stylesheet"
        href="style.css"
    >
</head>

<body>

    <!-- =====================================================
         ENCABEZADO
         ===================================================== -->

    <header class="site-header">

        <div class="brand">

            <div class="brand-logo">
                MF
            </div>

            <div class="brand-text">

                <h1>
                    Market Flash
                </h1>

                <p>
                    Compra, vende y promociona
                </p>

            </div>

        </div>


        <nav
            class="main-navigation"
            aria-label="Navegación principal"
        >

            <button
                type="button"
                data-section="inicio"
            >
                Inicio
            </button>

            <button
                type="button"
                data-section="categorias"
            >
                Categorías
            </button>

            <button
                type="button"
                data-section="publicar"
            >
                Publicar
            </button>

            <button
                type="button"
                data-section="promocionar"
            >
                Promocionar
            </button>

            <button
                type="button"
                data-section="reclamos"
            >
                Reclamos
            </button>

            <button
                type="button"
                data-section="soporte"
            >
                Soporte
            </button>

        </nav>


        <div class="header-actions">

            <button
                type="button"
                id="btn-registrarse"
            >
                Registrarse
            </button>

            <button
                type="button"
                id="btn-iniciar-sesion"
            >
                Iniciar sesión
            </button>

            <button
                type="button"
                id="btn-mi-perfil"
            >
                Mi perfil
            </button>

        </div>

    </header>


    <!-- =====================================================
         CONTENIDO PRINCIPAL
         ===================================================== -->

    <main id="app">


        <!-- =================================================
             INICIO
             ================================================= -->

        <section
            id="inicio"
            class="page-section active-section"
        >

            <div class="hero">

                <div class="hero-content">

                    <span class="badge">
                        MARKET FLASH
                    </span>

                    <h2>
                        Compra y vende
                        de forma sencilla
                    </h2>

                    <p>
                        Encuentra productos, publica tus
                        artículos y conecta directamente
                        con compradores y vendedores.
                    </p>

                    <div class="hero-actions">

                        <button
                            type="button"
                            class="primary-button"
                            data-section="publicar"
                        >
                            Publicar producto
                        </button>

                        <button
                            type="button"
                            class="secondary-button"
                            data-section="categorias"
                        >
                            Explorar categorías
                        </button>

                    </div>

                </div>

            </div>


            <!-- BÚSQUEDA -->

            <div
                id="busqueda"
                class="content-card"
            >

                <div class="section-heading">

                    <span class="section-kicker">
                        BUSCAR
                    </span>

                    <h2>
                        Encuentra lo que necesitas
                    </h2>

                </div>


                <form id="form-busqueda">

                    <input
                        type="search"
                        id="buscar"
                        name="buscar"
                        placeholder="Busca teléfonos, vehículos, ropa..."
                        autocomplete="off"
                    >

                    <button
                        type="submit"
                        class="primary-button"
                    >
                        Buscar
                    </button>

                    <button
                        type="button"
                        id="btn-limpiar-busqueda"
                        class="secondary-button"
                    >
                        Limpiar
                    </button>

                </form>

            </div>


            <!-- PUBLICIDAD -->

            <div
                id="publicidad-inicio"
                class="content-card"
            >

                <div class="section-heading">

                    <span class="section-kicker">
                        DESTACADOS
                    </span>

                    <h2>
                        Publicidad destacada
                    </h2>

                </div>


                <div
                    id="contenedor-anuncios"
                    class="advertisement-slider"
                >

                    <article class="advertisement-card">

                        <div class="advertisement-placeholder">
                            Publicidad
                        </div>

                        <div class="advertisement-content">

                            <span>
                                PATROCINADO
                            </span>

                            <h3>
                                Promociona tu producto
                            </h3>

                            <p>
                                Haz que más personas
                                conozcan tu publicación.
                            </p>

                            <button
                                type="button"
                                class="secondary-button"
                                data-advertisement="1"
                            >
                                Ver publicidad
                            </button>

                        </div>

                    </article>


                    <article class="advertisement-card">

                        <div class="advertisement-placeholder">
                            Publicidad
                        </div>

                        <div class="advertisement-content">

                            <span>
                                PATROCINADO
                            </span>

                            <h3>
                                Tu negocio puede aparecer aquí
                            </h3>

                            <p>
                                Utiliza el espacio publicitario
                                de Market Flash.
                            </p>

                            <button
                                type="button"
                                class="secondary-button"
                                data-advertisement="2"
                            >
                                Ver publicidad
                            </button>

                        </div>

                    </article>


                    <article class="advertisement-card">

                        <div class="advertisement-placeholder">
                            Publicidad
                        </div>

                        <div class="advertisement-content">

                            <span>
                                PATROCINADO
                            </span>

                            <h3>
                                Anuncio destacado
                            </h3>

                            <p>
                                Los productos promocionados
                                tendrán mayor visibilidad.
                            </p>

                            <button
                                type="button"
                                class="secondary-button"
                                data-advertisement="3"
                            >
                                Ver publicidad
                            </button>

                        </div>

                    </article>

                </div>


                <div class="slider-controls">

                    <button
                        type="button"
                        id="anuncio-anterior"
                        class="secondary-button"
                    >
                        ←
                    </button>

                    <button
                        type="button"
                        id="anuncio-siguiente"
                        class="secondary-button"
                    >
                        →
                    </button>

                </div>

            </div>


            <!-- PUBLICACIONES -->

            <div
                id="publicaciones"
                class="content-card"
            >

                <div class="section-heading">

                    <span class="section-kicker">
                        MARKETPLACE
                    </span>

                    <h2>
                        Productos
                    </h2>

                    <p>
                        Explora las publicaciones disponibles
                        en Market Flash.
                    </p>

                </div>


                <div
                    id="lista-publicaciones"
                    class="products-grid"
                >

                    <div
                        id="mensaje-sin-publicaciones"
                        class="empty-state"
                    >

                        <div class="empty-state-icon">
                            MF
                        </div>

                        <h3>
                            Aún no hay productos
                        </h3>

                        <p>
                            Sé el primero en publicar.
                        </p>

                    </div>

                </div>

            </div>

        </section>


        <!-- =================================================
             CATEGORÍAS
             ================================================= -->

        <section
            id="categorias"
            class="page-section"
        >

            <div class="section-heading">

                <span class="section-kicker">
                    EXPLORA
                </span>

                <h2>
                    Categorías
                </h2>

                <p>
                    Encuentra rápidamente el producto
                    que estás buscando.
                </p>

            </div>


            <div
                id="lista-categorias"
                class="categories-grid"
            >

                <button
                    type="button"
                    class="category-card"
                    data-category="Todos"
                >
                    <span>
                        Todos
                    </span>
                </button>

                <button
                    type="button"
                    class="category-card"
                    data-category="Teléfonos"
                >
                    <span>
                        Teléfonos
                    </span>
                </button>

                <button
                    type="button"
                    class="category-card"
                    data-category="Electrónica"
                >
                    <span>
                        Electrónica
                    </span>
                </button>

                <button
                    type="button"
                    class="category-card"
                    data-category="Vehículos"
                >
                    <span>
                        Vehículos
                    </span>
                </button>

                <button
                    type="button"
                    class="category-card"
                    data-category="Ropa"
                >
                    <span>
                        Ropa
                    </span>
                </button>

                <button
                    type="button"
                    class="category-card"
                    data-category="Joyas y Oro"
                >
                    <span>
                        Joyas y Oro
                    </span>
                </button>

                <button
                    type="button"
                    class="category-card"
                    data-category="Hogar"
                >
                    <span>
                        Hogar
                    </span>
                </button>

                <button
                    type="button"
                    class="category-card"
                    data-category="Servicios"
                >
                    <span>
                        Servicios
                    </span>
                </button>

                <button
                    type="button"
                    class="category-card"
                    data-category="Otros"
                >
                    <span>
                        Otros
                    </span>
                </button>

            </div>


            <div
                class="category-results"
                id="resultados-categoria"
            >

                <h3>
                    Productos de la categoría
                </h3>

                <div
                    id="lista-resultados-categoria"
                    class="products-grid"
                >
                </div>

            </div>

        </section>


        <!-- =================================================
             REGISTRO
             ================================================= -->

        <section
            id="registro"
            class="page-section"
        >

            <div class="auth-layout">

                <div class="auth-information">

                    <span class="section-kicker">
                        CREA TU CUENTA
                    </span>

                    <h2>
                        Únete a Market Flash
                    </h2>

                    <p>
                        Regístrate para publicar productos,
                        guardar favoritos y contactar con
                        compradores y vendedores.
                    </p>

                </div>


                <div class="form-card">

                    <form id="formulario-registro">

                        <div class="form-group">

                            <label for="registro-nombre">
                                Nombre completo
                            </label>

                            <input
                                type="text"
                                id="registro-nombre"
                                name="nombre"
                                placeholder="Tu nombre completo"
                                required
                            >

                        </div>


                        <div class="form-group">

                            <label for="registro-correo">
                                Correo electrónico
                            </label>

                            <input
                                type="email"
                                id="registro-correo"
                                name="correo"
                                placeholder="correo@ejemplo.com"
                                required
                            >

                        </div>


                        <div class="form-group">

                            <label for="registro-cedula">
                                Cédula o pasaporte
                            </label>

                            <input
                                type="text"
                                id="registro-cedula"
                                name="cedula"
                                placeholder="Número de cédula o pasaporte"
                                required
                            >

                        </div>


                        <div class="form-group">

                            <label for="registro-telefono">
                                Número de teléfono
                            </label>

                            <input
                                type="tel"
                                id="registro-telefono"
                                name="telefono"
                                placeholder="+1 809 000 0000"
                                required
                            >

                        </div>


                        <div class="form-group">

                            <label for="registro-whatsapp">
                                WhatsApp
                            </label>

                            <input
                                type="tel"
                                id="registro-whatsapp"
                                name="whatsapp"
                                placeholder="Número de WhatsApp"
                            >

                        </div>


                        <div class="form-group">

                            <label for="registro-messenger">
                                Usuario o enlace de Messenger
                            </label>

                            <input
                                type="text"
                                id="registro-messenger"
                                name="messenger"
                                placeholder="Usuario de Messenger"
                            >

                        </div>


                        <div class="form-group">

                            <label for="registro-password">
                                Contraseña
                            </label>

                            <input
                                type="password"
                                id="registro-password"
                                name="password"
                                placeholder="Crea una contraseña"
                                minlength="6"
                                required
                            >

                        </div>


                        <button
                            type="submit"
                            class="primary-button full-width"
                        >
                            Crear cuenta
                        </button>

                    </form>


                    <div class="form-footer">

                        <p>
                            ¿Ya tienes una cuenta?
                        </p>

                        <button
                            type="button"
                            id="btn-ir-login"
                            class="text-button"
                        >
                            Iniciar sesión
                        </button>

                    </div>

                </div>

            </div>

        </section>


        <!-- =================================================
             INICIO DE SESIÓN
             ================================================= -->

        <section
            id="inicio-sesion"
            class="page-section"
        >

            <div class="auth-layout">

                <div class="auth-information">

                    <span class="section-kicker">
                        BIENVENIDO
                    </span>

                    <h2>
                        Inicia sesión
                    </h2>

                    <p>
                        Accede a tu cuenta para continuar
                        utilizando Market Flash.
                    </p>

                </div>


                <div class="form-card">

                    <form id="formulario-login">

                        <div class="form-group">

                            <label for="login-correo">
                                Correo electrónico
                            </label>

                            <input
                                type="email"
                                id="login-correo"
                                name="correo"
                                placeholder="correo@ejemplo.com"
                                required
                            >

                        </div>


                        <div class="form-group">

                            <label for="login-password">
                                Contraseña
                            </label>

                            <input
                                type="password"
                                id="login-password"
                                name="password"
                                placeholder="Tu contraseña"
                                required
                            >

                        </div>


                        <button
                            type="submit"
                            class="primary-button full-width"
                        >
                            Iniciar sesión
                        </button>

                    </form>


                    <div class="form-footer">

                        <button
                            type="button"
                            id="btn-recuperar-password"
                            class="text-button"
                        >
                            ¿Olvidaste tu contraseña?
                        </button>

                        <button
                            type="button"
                            id="btn-ir-registro"
                            class="text-button"
                        >
                            Crear una cuenta
                        </button>

                    </div>

                </div>

            </div>

        </section>


        <!-- =================================================
             PUBLICAR
             ================================================= -->

        <section
            id="publicar"
            class="page-section"
        >

            <div class="section-heading">

                <span class="section-kicker">
                    VENDE
                </span>

                <h2>
                    Publicar producto
                </h2>

                <p>
                    Completa la información de tu producto.
                </p>

            </div>


            <div class="form-card wide-card">

                <form id="form-publicacion">

                    <div class="form-grid">

                        <div class="form-group">

                            <label for="nombre-producto">
                                Nombre del producto
                            </label>

                            <input
                                type="text"
                                id="nombre-producto"
                                name="nombre"
                                placeholder="Ejemplo: iPhone 14 Pro"
                                required
                            >

                        </div>


                        <div class="form-group">

                            <label for="categoria-producto">
                                Categoría
                            </label>

                            <select
                                id="categoria-producto"
                                name="categoria"
                                required
                            >

                                <option value="">
                                    Seleccionar categoría
                                </option>

                                <option value="Teléfonos">
                                    Teléfonos
                                </option>

                                <option value="Electrónica">
                                    Electrónica
                                </option>

                                <option value="Vehículos">
                                    Vehículos
                                </option>

                                <option value="Ropa">
                                    Ropa
                                </option>

                                <option value="Joyas y Oro">
                                    Joyas y Oro
                                </option>

                                <option value="Hogar">
                                    Hogar
                                </option>

                                <option value="Servicios">
                                    Servicios
                                </option>

                                <option value="Otros">
                                    Otros
                                </option>

                            </select>

                        </div>


                        <div class="form-group">

                            <label for="precio-producto">
                                Precio
                            </label>

                            <input
                                type="number"
                                id="precio-producto"
                                name="precio"
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                required
                            >

                        </div>


                        <div class="form-group">

                            <label for="cantidad-producto">
                                Cantidad
                            </label>

                            <input
                                type="number"
                                id="cantidad-producto"
                                name="cantidad"
                                placeholder="1"
                                min="1"
                                step="1"
                                required
                            >

                        </div>

                    </div>


                    <div class="form-group">

                        <label for="imagen-producto">
                            Fotos del producto
                        </label>

                        <input
                            type="file"
                            id="imagen-producto"
                            name="imagen"
                            accept="image/*"
                            multiple
                        >

                        <small>
                            Puedes seleccionar una o varias imágenes.
                        </small>

                    </div>


                    <div
                        id="vista-previa-imagenes"
                        class="image-preview-grid"
                    >
                    </div>


                    <div class="form-group">

                        <label for="descripcion-producto">
                            Descripción
                        </label>

                        <textarea
                            id="descripcion-producto"
                            name="descripcion"
                            rows="6"
                            placeholder="Describe tu producto..."
                            required
                        ></textarea>

                    </div>


                    <div class="form-group">

                        <label for="contacto-preferido">
                            Método de contacto
                        </label>

                        <select
                            id="contacto-preferido"
                            name="contacto"
                            required
                        >

                            <option value="">
                                Seleccionar
                            </option>

                            <option value="whatsapp">
                                WhatsApp
                            </option>

                            <option value="messenger">
                                Messenger
                            </option>

                        </select>

                    </div>


                    <div class="posting-notice">

                        <strong>
                            Publicación
                        </strong>

                        <p id="estado-configuracion-publicacion">
                            Cargando configuración...
                        </p>

                    </div>


                    <button
                        type="submit"
                        class="primary-button"
                    >
                        Continuar
                    </button>

                </form>

            </div>

        </section>


        <!-- =================================================
             PAGO
             ================================================= -->

        <section
            id="pago-publicacion"
            class="page-section"
        >

            <div class="section-heading">

                <span class="section-kicker">
                    PUBLICACIÓN
                </span>

                <h2>
                    Pago de publicación
                </h2>

                <p>
                    Selecciona el método de pago y envía
                    tu comprobante para revisión.
                </p>

            </div>


            <div class="payment-layout">


                <div class="payment-methods">

                    <div class="payment-method">

                        <input
                            type="radio"
                            id="metodo-binance"
                            name="metodo-pago"
                            value="binance"
                        >

                        <label for="metodo-binance">
                            Binance
                        </label>

                    </div>


                    <div class="payment-method">

                        <input
                            type="radio"
                            id="metodo-paypal"
                            name="metodo-pago"
                            value="paypal"
                        >

                        <label for="metodo-paypal">
                            PayPal
                        </label>

                    </div>

                </div>


                <div
                    id="pago-binance"
                    class="payment-box hidden"
                >

                    <h3>
                        Pagar con Binance
                    </h3>

                    <p>
                        Utiliza la dirección de pago configurada
                        por Market Flash.
                    </p>


                    <div class="payment-address">

                        <span>
                            Dirección de Binance
                        </span>

                        <code id="direccion-binance">
                            Pendiente de configuración
                        </code>

                        <button
                            type="button"
                            id="btn-copiar-binance"
                            class="secondary-button"
                        >
                            Copiar
                        </button>

                    </div>

                </div>


                <div
                    id="pago-paypal"
                    class="payment-box hidden"
                >

                    <h3>
                        Pagar con PayPal
                    </h3>

                    <p>
                        Utiliza la cuenta configurada
                        por Market Flash.
                    </p>


                    <div class="payment-address">

                        <span>
                            Cuenta de PayPal
                        </span>

                        <code id="cuenta-paypal">
                            Pendiente de configuración
                        </code>

                    </div>

                </div>


                <div class="form-card">

                    <div class="form-group">

                        <label for="captura-pago">
                            Comprobante de pago
                        </label>

                        <input
                            type="file"
                            id="captura-pago"
                            name="comprobante"
                            accept="image/*,.pdf"
                        >

                    </div>


                    <div
                        id="vista-previa-comprobante"
                        class="receipt-preview"
                    >
                    </div>


                    <button
                        type="button"
                        id="enviar-comprobante"
                        class="primary-button"
                    >
                        Enviar comprobante
                    </button>


                    <div
                        id="estado-pago"
                        class="status-box"
                    >
                        Estado:
                        pendiente
                    </div>

                </div>

            </div>

        </section>


        <!-- =================================================
             PERFIL
             ================================================= -->

        <section
            id="perfil"
            class="page-section"
        >

            <div class="section-heading">

                <span class="section-kicker">
                    MI CUENTA
                </span>

                <h2>
                    Mi perfil
                </h2>

            </div>


            <div class="profile-layout">

                <div class="profile-card">

                    <div class="profile-avatar">
                        MF
                    </div>

                    <h3 id="perfil-nombre">
                        Usuario
                    </h3>

                    <p id="perfil-correo">
                        -
                    </p>

                </div>


                <div class="profile-details">

                    <div class="profile-detail">
                        <span>
                            Teléfono
                        </span>

                        <strong id="perfil-telefono">
                            -
                        </strong>
                    </div>


                    <div class="profile-detail">
                        <span>
                            WhatsApp
                        </span>

                        <strong id="perfil-whatsapp">
                            -
                        </strong>
                    </div>


                    <div class="profile-detail">
                        <span>
                            Messenger
                        </span>

                        <strong id="perfil-messenger">
                            -
                        </strong>
                    </div>


                    <div class="profile-detail">
                        <span>
                            Documento
                        </span>

                        <strong id="perfil-documento">
                            -
                        </strong>
                    </div>


                    <div class="profile-actions">

                        <button
                            type="button"
                            id="btn-editar-perfil"
                            class="secondary-button"
                        >
                            Editar perfil
                        </button>

                        <button
                            type="button"
                            id="btn-cerrar-sesion"
                            class="danger-button"
                        >
                            Cerrar sesión
                        </button>

                    </div>

                </div>

            </div>


            <!-- PERFIL: PUBLICACIONES -->

            <div class="content-card">

                <div class="section-heading">

                    <h3>
                        Mis publicaciones
                    </h3>

                </div>

                <div
                    id="mis-publicaciones"
                    class="products-grid"
                >
                </div>

            </div>


            <!-- PERFIL: FAVORITOS -->

            <div class="content-card">

                <div class="section-heading">

                    <h3>
                        Mis favoritos
                    </h3>

                </div>

                <div
                    id="lista-favoritos"
                    class="products-grid"
                >
                </div>

            </div>


            <!-- PERFIL: VENDIDOS -->

            <div class="content-card">

                <div class="section-heading">

                    <h3>
                        Productos vendidos
                    </h3>

                </div>

                <div
                    id="lista-vendidos"
                    class="products-grid"
                >
                </div>

            </div>

        </section>


        <!-- =================================================
             PROMOCIONAR
             ================================================= -->

        <section
            id="promocionar"
            class="page-section"
        >

            <div class="section-heading">

                <span class="section-kicker">
                    MÁS VISIBILIDAD
                </span>

                <h2>
                    Promociona tu producto
                </h2>

                <p>
                    Solicita una promoción para destacar
                    tu publicación.
                </p>

            </div>


            <div class="promotion-grid">

                <article class="promotion-card">

                    <h3>
                        Promoción básica
                    </h3>

                    <p>
                        Mayor visibilidad en Market Flash.
                    </p>

                    <strong>
                        Próximamente
                    </strong>

                    <button
                        type="button"
                        class="primary-button"
                        data-promotion="basica"
                    >
                        Solicitar
                    </button>

                </article>


                <article class="promotion-card featured">

                    <span class="promotion-badge">
                        DESTACADA
                    </span>

                    <h3>
                        Promoción destacada
                    </h3>

                    <p>
                        Tu producto tendrá una posición
                        más visible.
                    </p>

                    <strong>
                        Próximamente
                    </strong>

                    <button
                        type="button"
                        class="primary-button"
                        data-promotion="destacada"
                    >
                        Solicitar
                    </button>

                </article>


                <article class="promotion-card">

                    <h3>
                        Publicidad patrocinada
                    </h3>

                    <p>
                        Aparece en el área publicitaria
                        de Market Flash.
                    </p>

                    <strong>
                        Próximamente
                    </strong>

                    <button
                        type="button"
                        class="primary-button"
                        data-promotion="patrocinada"
                    >
                        Solicitar
                    </button>

                </article>

            </div>


            <div
                id="mis-promociones"
                class="content-card"
            >

                <h3>
                    Mis solicitudes de promoción
                </h3>

                <div id="lista-promociones">
                </div>

            </div>

        </section>


        <!-- =================================================
             VÍDEOS
             ================================================= -->

        <section
            id="videos"
            class="page-section"
        >

            <div class="section-heading">

                <span class="section-kicker">
                    CONTENIDO
                </span>

                <h2>
                    Vídeos
                </h2>

                <p>
                    Muestra tus productos mediante vídeos.
                </p>

            </div>


            <div class="form-card wide-card">

                <form id="form-video">

                    <div class="form-group">

                        <label for="titulo-video">
                            Título
                        </label>

                        <input
                            type="text"
                            id="titulo-video"
                            name="titulo"
                            placeholder="Título del vídeo"
                            required
                        >

                    </div>


                    <div class="form-group">

                        <label for="archivo-video">
                            Vídeo
                        </label>

                        <input
                            type="file"
                            id="archivo-video"
                            name="video"
                            accept="video/*"
                            required
                        >

                    </div>


                    <div class="form-group">

                        <label for="descripcion-video">
                            Descripción
                        </label>

                        <textarea
                            id="descripcion-video"
                            name="descripcion"
                            rows="4"
                            placeholder="Describe tu vídeo..."
                        ></textarea>

                    </div>


                    <button
                        type="submit"
                        class="primary-button"
                    >
                        Publicar vídeo
                    </button>

                </form>

            </div>


            <div
                id="lista-videos"
                class="video-grid"
            >
            </div>

        </section>


        <!-- =================================================
             NOTIFICACIONES
             ================================================= -->

        <section
            id="notificaciones"
            class="page-section"
        >

            <div class="section-heading">

                <span class="section-kicker">
                    AVISOS
                </span>

                <h2>
                    Notificaciones
                </h2>

            </div>


            <div
                id="lista-notificaciones"
                class="notifications-list"
            >

                <div class="empty-state">
                    <h3>
                        No hay notificaciones
                    </h3>

                    <p>
                        Aquí aparecerán tus avisos.
                    </p>
                </div>

            </div>

        </section>


        <!-- =================================================
             CALIFICACIONES
             ================================================= -->

        <section
            id="calificaciones"
            class="page-section"
        >

            <div class="section-heading">

                <span class="section-kicker">
                    REPUTACIÓN
                </span>

                <h2>
                    Calificaciones
                </h2>

            </div>


            <div class="form-card">

                <form id="form-calificacion">

                    <div class="form-group">

                        <label for="estrellas">
                            Calificación
                        </label>

                        <select
                            id="estrellas"
                            name="estrellas"
                            required
                        >

                            <option value="">
                                Seleccionar
                            </option>

                            <option value="5">
                                ★★★★★
                            </option>

                            <option value="4">
                                ★★★★☆
                            </option>

                            <option value="3">
                                ★★★☆☆
                            </option>

                            <option value="2">
                                ★★☆☆☆
                            </option>

                            <option value="1">
                                ★☆☆☆☆
                            </option>

                        </select>

                    </div>


                    <div class="form-group">

                        <label for="comentario-calificacion">
                            Comentario
                        </label>

                        <textarea
                            id="comentario-calificacion"
                            name="comentario"
                            rows="5"
                            placeholder="Escribe tu experiencia..."
                        ></textarea>

                    </div>


                    <button
                        type="submit"
                        class="primary-button"
                    >
                        Enviar calificación
                    </button>

                </form>

            </div>

        </section>


        <!-- =================================================
             RECLAMOS
             ================================================= -->

        <section
            id="reclamos"
            class="page-section"
        >

            <div class="section-heading">

                <span class="section-kicker">
                    AYUDA
                </span>

                <h2>
                    Reclamos y reportes
                </h2>

                <p>
                    Informa de una publicación o situación
                    que necesite revisión.
                </p>

            </div>


            <div class="form-card">

                <form id="form-reclamo">

                    <div class="form-group">

                        <label for="motivo-reclamo">
                            Motivo
                        </label>

                        <select
                            id="motivo-reclamo"
                            name="motivo"
                            required
                        >

                            <option value="">
                                Seleccionar motivo
                            </option>

                            <option value="fraude">
                                Posible fraude
                            </option>

                            <option value="producto-falso">
                                Producto falso
                            </option>

                            <option value="contenido-inapropiado">
                                Contenido inapropiado
                            </option>

                            <option value="informacion-incorrecta">
                                Información incorrecta
                            </option>

                            <option value="otro">
                                Otro
                            </option>

                        </select>

                    </div>


                    <div class="form-group">

                        <label for="detalle-reclamo">
                            Detalles
                        </label>

                        <textarea
                            id="detalle-reclamo"
                            name="detalle"
                            rows="6"
                            placeholder="Explica el problema..."
                            required
                        ></textarea>

                    </div>


                    <button
                        type="submit"
                        class="primary-button"
                    >
                        Enviar reclamo
                    </button>

                </form>

            </div>

        </section>


        <!-- =================================================
             SOPORTE
             ================================================= -->

        <section
            id="soporte"
            class="page-section"
        >

            <div class="section-heading">

                <span class="section-kicker">
                    SOPORTE
                </span>

                <h2>
                    Centro de soporte
                </h2>

                <p>
                    Estamos preparando los canales de
                    atención de Market Flash.
                </p>

            </div>


            <div class="support-grid">

                <article class="support-card">

                    <div class="support-icon">
                        W
                    </div>

                    <h3>
                        WhatsApp
                    </h3>

                    <p>
                        Contacto directo con soporte.
                    </p>

                    <button
                        type="button"
                        id="contacto-whatsapp"
                        class="primary-button"
                    >
                        Contactar
                    </button>

                </article>


                <article class="support-card">

                    <div class="support-icon">
                        M
                    </div>

                    <h3>
                        Messenger
                    </h3>

                    <p>
                        Escríbenos por Messenger.
                    </p>

                    <button
                        type="button"
                        id="contacto-messenger"
                        class="primary-button"
                    >
                        Contactar
                    </button>

                </article>


                <article class="support-card">

                    <div class="support-icon">
                        ?
                    </div>

                    <h3>
                        Ayuda
                    </h3>

                    <p>
                        Consulta información sobre
                        Market Flash.
                    </p>

                    <button
                        type="button"
                        id="contacto-ayuda"
                        class="secondary-button"
                    >
                        Ver ayuda
                    </button>

                </article>

            </div>

        </section>


        <!-- =================================================
             CONTACTAR VENDEDOR
             ================================================= -->

        <section
            id="contactar-vendedor"
            class="page-section"
        >

            <div class="section-heading">

                <span class="section-kicker">
                    CONTACTO
                </span>

                <h2>
                    Contactar vendedor
                </h2>

                <p id="contacto-vendedor-nombre">
                    Selecciona el método de contacto.
                </p>

            </div>


            <div class="contact-options">

                <button
                    type="button"
                    id="btn-contactar-whatsapp"
                    class="whatsapp-button"
                >
                    WhatsApp
                </button>

                <button
                    type="button"
                    id="btn-contactar-messenger"
                    class="messenger-button"
                >
                    Messenger
                </button>

            </div>

        </section>


        <!-- =================================================
             ADMINISTRADOR
             ================================================= -->

        <section
            id="panel-administrador"
            class="page-section"
        >

            <div class="section-heading">

                <span class="section-kicker">
                    ADMINISTRACIÓN
                </span>

                <h2>
                    Panel de administrador
                </h2>

                <p>
                    Área privada para gestionar Market Flash.
                </p>

            </div>


            <!-- RESUMEN -->

            <div
                id="resumen-administrador"
                class="admin-stats"
            >

                <div class="admin-stat">

                    <span>
                        Usuarios
                    </span>

                    <strong id="total-usuarios">
                        0
                    </strong>

                </div>


                <div class="admin-stat">

                    <span>
                        Publicaciones pendientes
                    </span>

                    <strong id="total-pendientes">
                        0
                    </strong>

                </div>


                <div class="admin-stat">

                    <span>
                        Pagos pendientes
                    </span>

                    <strong id="total-pagos-pendientes">
                        0
                    </strong>

                </div>


                <div class="admin-stat">

                    <span>
                        Publicaciones activas
                    </span>

                    <strong id="total-publicaciones-activas">
                        0
                    </strong>

                </div>

            </div>


            <!-- CONFIGURACIÓN -->

            <div class="content-card">

                <div class="section-heading">

                    <h3>
                        Configuración
                    </h3>

                </div>


                <div class="admin-settings">

                    <div class="setting-row">

                        <div>

                            <strong>
                                Publicaciones
                            </strong>

                            <p id="texto-configuracion-publicaciones">
                                Cargando...
                            </p>

                        </div>

                        <button
                            type="button"
                            id="btn-toggle-publicaciones"
                            class="secondary-button"
                        >
                            Cambiar
                        </button>

                    </div>


                    <div class="setting-row">

                        <div>

                            <strong>
                                Promociones
                            </strong>

                            <p id="texto-configuracion-promociones">
                                Cargando...
                            </p>

                        </div>

                        <button
                            type="button"
                            id="btn-toggle-promociones"
                            class="secondary-button"
                        >
                            Cambiar
                        </button>

                    </div>

                </div>

            </div>


            <!-- PAGOS PENDIENTES -->

            <div class="content-card">

                <div class="section-heading">

                    <h3>
                        Pagos pendientes
                    </h3>

                    <p>
                        Revisa los comprobantes enviados.
                    </p>

                </div>


                <div
                    id="lista-comprobantes-admin"
                    class="admin-list"
                >
                </div>

            </div>


            <!-- PUBLICACIONES PENDIENTES -->

            <div class="content-card">

                <div class="section-heading">

                    <h3>
                        Publicaciones pendientes
                    </h3>

                </div>


                <div
                    id="lista-pendientes-admin"
                    class="admin-list"
                >
                </div>

            </div>


            <!-- PUBLICACIONES ACTIVAS -->

            <div class="content-card">

                <div class="section-heading">

                    <h3>
                        Publicaciones activas
                    </h3>

                </div>


                <div
                    id="lista-activas-admin"
                    class="products-grid"
                >
                </div>

            </div>


            <!-- REPORTES -->

            <div class="content-card">

                <div class="section-heading">

                    <h3>
                        Reclamos y reportes
                    </h3>

                </div>


                <div
                    id="lista-reportes-admin"
                    class="admin-list"
                >
                </div>

            </div>


            <!-- USUARIOS -->

            <div class="content-card">

                <div class="section-heading">

                    <h3>
                        Usuarios
                    </h3>

                </div>


                <div
                    id="lista-usuarios-admin"
                    class="admin-list"
                >
                </div>

            </div>

        </section>


        <!-- =================================================
             POLÍTICAS
             ================================================= -->

        <section
            id="politicas"
            class="page-section"
        >

            <div class="section-heading">

                <span class="section-kicker">
                    INFORMACIÓN
                </span>

                <h2>
                    Seguridad y reglas
                </h2>

            </div>


            <div class="policy-grid">

                <article class="policy-card">

                    <h3>
                        Publicaciones
                    </h3>

                    <p>
                        Las publicaciones deben cumplir
                        las reglas de Market Flash.
                    </p>

                </article>


                <article class="policy-card">

                    <h3>
                        Pagos
                    </h3>

                    <p>
                        Los comprobantes pueden ser revisados
                        antes de aprobar una publicación.
                    </p>

                </article>


                <article class="policy-card">

                    <h3>
                        Reportes
                    </h3>

                    <p>
                        Puedes reportar publicaciones que
                        consideres problemáticas.
                    </p>

                </article>

            </div>

        </section>

    </main>


    <!-- =====================================================
         PIE DE PÁGINA
         ===================================================== -->

    <footer class="site-footer">

        <div class="footer-grid">

            <div>

                <div class="footer-brand">
                    Market Flash
                </div>

                <p>
                    Compra, vende y promociona
                    desde un solo lugar.
                </p>

            </div>


            <div>

                <h3>
                    Market Flash
                </h3>

                <button
                    type="button"
                    data-section="inicio"
                    class="footer-link"
                >
                    Inicio
                </button>

                <button
                    type="button"
                    data-section="categorias"
                    class="footer-link"
                >
                    Categorías
                </button>

                <button
                    type="button"
                    data-section="publicar"
                    class="footer-link"
                >
                    Publicar
                </button>

            </div>


            <div>

                <h3>
                    Ayuda
                </h3>

                <button
                    type="button"
                    data-section="reclamos"
                    class="footer-link"
                >
                    Reclamos
                </button>

                <button
                    type="button"
                    data-section="soporte"
                    class="footer-link"
                >
                    Soporte
                </button>

                <button
                    type="button"
                    data-section="politicas"
                    class="footer-link"
                >
                    Reglas
                </button>

            </div>


            <div>

                <h3>
                    Contacto
                </h3>

                <button
                    type="button"
                    id="footer-whatsapp"
                    class="footer-link"
                >
                    WhatsApp
                </button>

                <button
                    type="button"
                    id="footer-messenger"
                    class="footer-link"
                >
                    Messenger
                </button>

                <a
                    href="#"
                    id="footer-facebook"
                    class="footer-link"
                >
                    Facebook
                </a>

            </div>

        </div>


        <div class="footer-bottom">

            <p>
                © 2026 Market Flash
            </p>

            <p>
                Propiedad de Julio Alcántara Gómez
            </p>

        </div>

    </footer>


    <!-- =====================================================
         MENSAJES
         ===================================================== -->

    <div
        id="app-message"
        class="app-message"
        aria-live="polite"
    >
    </div>


    <!-- =====================================================
         SUPABASE
         ===================================================== -->

    <script
        src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"
    ></script>


    <!-- =====================================================
         JAVASCRIPT DE MARKET FLASH
         ===================================================== -->

    <script
        src="script.js"
    ></script>

</body>
</html>
