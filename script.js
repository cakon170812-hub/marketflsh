* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

body {
    min-height: 100vh;
    font-family: Arial, Helvetica, sans-serif;
    background:
        radial-gradient(circle at 50% 20%, rgba(0, 220, 255, 0.14), transparent 30%),
        radial-gradient(circle at 20% 80%, rgba(0, 110, 255, 0.10), transparent 30%),
        #020711;
    color: white;
    overflow-x: hidden;
}

/* EFECTO DIGITAL */

body::before {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    background-image:
        linear-gradient(rgba(0, 200, 255, 0.035) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 200, 255, 0.035) 1px, transparent 1px);
    background-size: 35px 35px;
}

/* PANTALLAS */

.pantalla {
    display: none;
    min-height: 100vh;
    padding: 30px 20px 90px;
    position: relative;
    z-index: 2;
}

.pantalla.activa {
    display: flex;
}

/* PRINCIPAL */

#pantallaPrincipal {
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
}

.logo-principal {
    margin-bottom: 60px;
}

.logo-principal h1 {
    font-size: clamp(35px, 8vw, 70px);
    letter-spacing: 7px;
    color: #ffffff;
    text-shadow:
        0 0 10px #00d9ff,
        0 0 25px #00d9ff,
        0 0 50px #008cff;
}

.logo-principal p {
    margin-top: 12px;
    color: #8cecff;
    letter-spacing: 2px;
}

.rayo {
    font-size: 85px;
    margin-bottom: 10px;
    animation: rayoParpadea 1.5s infinite;
}

@keyframes rayoParpadea {
    0%, 45%, 100% {
        opacity: 1;
        transform: scale(1);
        filter: drop-shadow(0 0 20px #00d9ff);
    }

    50%, 60% {
        opacity: .35;
        transform: scale(.92);
        filter: drop-shadow(0 0 3px #00d9ff);
    }
}

/* BOTONES */

.botones-principales {
    width: min(420px, 100%);
    display: flex;
    flex-direction: column;
    gap: 22px;
}

.btn-futurista,
.btn-secundario,
.btn-config,
.navegacion button,
.flash-dia,
.media-btn {
    border: 1px solid rgba(0, 220, 255, .7);
    color: white;
    background: rgba(0, 130, 180, .12);
    cursor: pointer;
    transition: .25s ease;
}

.btn-futurista {
    width: 100%;
    padding: 18px;
    border-radius: 12px;
    font-size: 17px;
    font-weight: bold;
    letter-spacing: 2px;
    box-shadow:
        0 0 10px rgba(0, 220, 255, .25),
        inset 0 0 20px rgba(0, 220, 255, .04);
}

.btn-futurista:hover,
.btn-secundario:hover,
.flash-dia:hover,
.media-btn:hover {
    transform: translateY(-2px);
    background: rgba(0, 210, 255, .20);
    box-shadow:
        0 0 18px rgba(0, 220, 255, .45),
        inset 0 0 20px rgba(0, 220, 255, .08);
}

.btn-secundario {
    width: 100%;
    padding: 14px;
    margin-top: 12px;
    border-radius: 10px;
    font-size: 14px;
}

.btn-peligro {
    border-color: rgba(255, 70, 90, .8);
}

/* VENTANAS */

.ventana {
    width: min(500px, 100%);
    margin: auto;
    padding: 28px;
    border: 1px solid rgba(0, 220, 255, .35);
    border-radius: 20px;
    background: rgba(2, 13, 25, .88);
    box-shadow:
        0 0 30px rgba(0, 180, 255, .12),
        inset 0 0 30px rgba(0, 180, 255, .04);
    backdrop-filter: blur(12px);
}

.titulo-ventana {
    text-align: center;
    font-size: 22px;
    font-weight: bold;
    letter-spacing: 2px;
    color: #8cecff;
    margin-bottom: 28px;
    text-shadow: 0 0 12px #00cfff;
}

.ventana input,
.ventana textarea,
.buscador input {
    width: 100%;
    padding: 15px;
    margin-bottom: 13px;
    border: 1px solid rgba(0, 220, 255, .25);
    border-radius: 10px;
    outline: none;
    color: white;
    background: rgba(0, 0, 0, .35);
    font-size: 15px;
}

.ventana input:focus,
.ventana textarea:focus,
.buscador input:focus {
    border-color: #00d9ff;
    box-shadow: 0 0 12px rgba(0, 217, 255, .25);
}

.ventana textarea {
    resize: vertical;
}

.terminos {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 8px 0 20px;
    color: #a7cbd4;
    font-size: 13px;
}

.terminos input {
    width: auto;
    margin: 0;
}

/* BARRA SUPERIOR */

#pantallaInicio {
    display: none;
    flex-direction: column;
    padding: 0 0 80px;
}

#pantallaInicio.activa {
    display: flex;
}

.barra-superior {
    width: 100%;
    height: 70px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 18px;
    border-bottom: 1px solid rgba(0, 220, 255, .18);
    background: rgba(1, 9, 18, .88);
    position: sticky;
    top: 0;
    z-index: 10;
    backdrop-filter: blur(12px);
}

.mini-logo {
    font-weight: bold;
    letter-spacing: 2px;
    color: #8cecff;
    text-shadow: 0 0 10px #00cfff;
}

.btn-config {
    width: 43px;
    height: 43px;
    border-radius: 50%;
    font-size: 20px;
}

/* CONTENIDO */

.contenido {
    width: min(900px, 100%);
    margin: auto;
    padding: 25px 18px;
}

.saludo {
    text-align: center;
    padding: 20px 0 30px;
}

.rayo-pequeno {
    font-size: 35px;
    animation: rayoParpadea 1.7s infinite;
}

.saludo h2 {
    font-size: clamp(22px, 5vw, 34px);
    margin: 8px 0;
}

.saludo p {
    color: #7eabb7;
}

.buscador {
    margin-bottom: 20px;
}

/* FLASH DEL DÍA */

.flash-dia {
    width: 100%;
    min-height: 90px;
    border-radius: 18px;
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 16px 20px;
    margin-bottom: 30px;
    text-align: left;
    background:
        linear-gradient(100deg,
        rgba(0, 220, 255, .15),
        rgba(0, 80, 150, .10));
    box-shadow:
        0 0 18px rgba(0, 220, 255, .18),
        inset 0 0 25px rgba(0, 220, 255, .05);
}

.flash-icon {
    font-size: 42px;
    animation: rayoParpadea 1.4s infinite;
}

.flash-dia strong {
    display: block;
    color: #ffffff;
    font-size: 19px;
    letter-spacing: 2px;
}

.flash-dia small {
    display: block;
    margin-top: 6px;
    color: #73dff3;
}

.flash-arrow {
    margin-left: auto;
    font-size: 35px;
    color: #00d9ff;
}

/* SECCIONES */

.titulo-seccion {
    color: #8cecff;
    font-weight: bold;
    letter-spacing: 2px;
    margin-bottom: 15px;
}

.publicaciones {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 15px;
}

.sin-publicaciones {
    grid-column: 1 / -1;
    padding: 50px 20px;
    text-align: center;
    border: 1px dashed rgba(0, 220, 255, .25);
    border-radius: 15px;
    color: #688d98;
}

.sin-publicaciones span {
    font-size: 35px;
}

/* TARJETAS FLASH */

.flash-card {
    border: 1px solid rgba(0, 220, 255, .30);
    border-radius: 16px;
    padding: 18px;
    background: rgba(0, 40, 60, .25);
    cursor: pointer;
    transition: .25s;
}

.flash-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 0 20px rgba(0, 220, 255, .22);
}

.flash-card h3 {
    color: #8cecff;
    margin-bottom: 8px;
}

.flash-card p {
    color: #b3cbd1;
    line-height: 1.5;
}

.flash-card .autor {
    margin-top: 12px;
    font-size: 12px;
    color: #5caebe;
}

/* NAVEGACIÓN */

.navegacion {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 72px;
    display: flex;
    background: rgba(1, 8, 16, .94);
    border-top: 1px solid rgba(0, 220, 255, .2);
    z-index: 20;
    backdrop-filter: blur(12px);
}

.navegacion button {
    flex: 1;
    border-width: 0 1px 0 0;
    background: transparent;
    color: #789aa3;
    font-size: 11px;
}

.navegacion button span {
    display: block;
    font-size: 22px;
    margin-bottom: 4px;
}

.navegacion button:hover {
    color: #00d9ff;
}

/* FLASH FORM */

.texto-flash {
    color: #89aeb8;
    line-height: 1.5;
    margin-bottom: 20px;
    text-align: center;
}

.media-botones {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 15px;
}

.media-btn {
    min-height: 90px;
    border-radius: 14px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 7px;
    font-size: 28px;
    text-align: center;
}

.media-btn span {
    font-size: 11px;
    letter-spacing: 1px;
}

.media-btn input {
    display: none;
}

.preview-media {
    margin-bottom: 12px;
}

.preview-media img,
.preview-media video {
    width: 100%;
    max-height: 250px;
    object-fit: cover;
    border-radius: 12px;
    border: 1px solid rgba(0, 220, 255, .25);
}

/* CHAT */

.chat-info {
    color: #8cecff;
    padding: 12px;
    margin-bottom: 12px;
    border-radius: 10px;
    background: rgba(0, 180, 220, .08);
}

.mensajes-chat {
    height: 330px;
    overflow-y: auto;
    padding: 10px;
    border: 1px solid rgba(0, 220, 255, .18);
    border-radius: 12px;
    margin-bottom: 12px;
}

.mensaje {
    max-width: 80%;
    padding: 10px 12px;
    margin-bottom: 9px;
    border-radius: 12px;
    background: rgba(0, 150, 200, .13);
    border: 1px solid rgba(0, 220, 255, .15);
}

.mensaje.mio {
    margin-left: auto;
    background: rgba(0, 220, 255, .16);
}

.mensaje small {
    display: block;
    margin-top: 4px;
    color: #60828c;
    font-size: 9px;
}

.chat-enviar {
    display: flex;
    gap: 8px;
}

.chat-enviar input {
    margin: 0;
}

.chat-enviar button {
    width: 52px;
    border-radius: 10px;
    border: 1px solid #00d9ff;
    color: white;
    background: rgba(0, 190, 230, .15);
    cursor: pointer;
}

/* PERFIL */

.datos-perfil {
    line-height: 2;
    color: #b9d8df;
    margin-bottom: 20px;
}

.datos-perfil div {
    border-bottom: 1px solid rgba(0, 220, 255, .1);
    padding: 5px;
}

/* CONFIGURACIÓN */

.config-opcion {
    padding: 16px;
    border: 1px solid rgba(0, 220, 255, .15);
    border-radius: 12px;
    margin-bottom: 20px;
}

.config-opcion strong,
.config-opcion small {
    display: block;
}

.config-opcion small {
    margin-top: 5px;
    color: #6f9da8;
}

/* ALERTAS */

.alerta-vacia {
    text-align: center;
    color: #668a94;
    padding: 50px 10px;
}

.alerta-vacia span {
    display: block;
    font-size: 40px;
    margin-bottom: 10px;
}

/* PROPIEDAD */

.propiedad {
    position: fixed;
    right: 10px;
    bottom: 5px;
    z-index: 100;
    font-size: 9px;
    color: rgba(130, 210, 225, .55);
    letter-spacing: .5px;
}

/* RESPONSIVE */

@media (max-width: 500px) {

    .ventana {
        padding: 20px;
    }

    .media-botones {
        grid-template-columns: 1fr;
    }

    .logo-principal {
        margin-bottom: 45px;
    }

    .logo-principal h1 {
        letter-spacing: 4px;
    }
}
