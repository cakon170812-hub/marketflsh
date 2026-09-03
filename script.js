/* =========================================================
   MARKET FLASH
   STYLE.CSS
   Diseño principal
   ========================================================= */

* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

:root {
    --bg: #050b18;
    --bg-secondary: #091326;
    --panel: #0c172b;
    --panel-light: #11213b;
    --blue: #168cff;
    --blue-light: #42b4ff;
    --cyan: #00e5ff;
    --green: #18d878;
    --red: #ff3d62;
    --yellow: #ffd429;
    --white: #ffffff;
    --text: #f5f8ff;
    --muted: #9eabc0;
    --border: rgba(66, 180, 255, 0.22);
    --shadow: 0 0 25px rgba(22, 140, 255, 0.18);
    --radius: 18px;
}

html,
body {
    width: 100%;
    min-height: 100%;
    background: var(--bg);
    color: var(--text);
    font-family: Arial, Helvetica, sans-serif;
}

body {
    overflow-x: hidden;
}

button,
input,
textarea,
select {
    font: inherit;
}

button {
    border: 0;
    cursor: pointer;
}

input,
textarea,
select {
    width: 100%;
    color: var(--white);
    background: rgba(5, 11, 24, 0.92);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 14px;
    outline: none;
}

input:focus,
textarea:focus,
select:focus {
    border-color: var(--blue-light);
    box-shadow: 0 0 14px rgba(66, 180, 255, 0.2);
}

textarea {
    resize: vertical;
}

label {
    display: block;
    margin: 16px 0 7px;
    color: var(--text);
    font-weight: 700;
}

/* =========================================================
   PANTALLAS
   ========================================================= */

.screen {
    display: none;
    min-height: 100vh;
    width: 100%;
}

.screen.active {
    display: flex;
}

/* =========================================================
   BIENVENIDA
   ========================================================= */

#welcome-screen {
    position: relative;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background:
        radial-gradient(circle at 50% 25%, rgba(0, 229, 255, 0.14), transparent 32%),
        radial-gradient(circle at 20% 80%, rgba(22, 140, 255, 0.18), transparent 35%),
        var(--bg);
}

.welcome-background {
    position: absolute;
    inset: 0;
    pointer-events: none;
}

.lightning-background {
    position: absolute;
    top: 8%;
    left: 50%;
    transform: translateX(-50%);
    font-size: clamp(110px, 30vw, 240px);
    opacity: 0.07;
    filter: drop-shadow(0 0 30px var(--cyan));
}

.neon-circle {
    position: absolute;
    border-radius: 50%;
    border: 1px solid rgba(0, 229, 255, 0.12);
    box-shadow: 0 0 50px rgba(0, 229, 255, 0.08);
}

.circle-one {
    width: 300px;
    height: 300px;
    top: -100px;
    right: -100px;
}

.circle-two {
    width: 250px;
    height: 250px;
    bottom: -90px;
    left: -90px;
}

.welcome-content {
    position: relative;
    z-index: 2;
    width: min(92%, 500px);
    text-align: center;
}

.brand-area {
    margin-bottom: 45px;
}

.brand-lightning {
    font-size: 65px;
    margin-bottom: 10px;
    filter: drop-shadow(0 0 15px var(--cyan));
    animation: flashPulse 1.8s infinite;
}

.brand-area h1 {
    font-size: clamp(34px, 10vw, 60px);
    letter-spacing: 2px;
    text-shadow:
        0 0 8px var(--blue),
        0 0 25px var(--cyan);
}

.brand-area p {
    margin-top: 10px;
    color: var(--muted);
    font-size: 16px;
}

.welcome-buttons {
    display: grid;
    gap: 15px;
}

.ownership {
    margin-top: 55px;
    color: #65748c;
    font-size: 12px;
}

/* =========================================================
   BOTONES
   ========================================================= */

.main-button,
.publish-button,
.flash-promote-button {
    width: 100%;
    min-height: 52px;
    padding: 14px 18px;
    border-radius: 14px;
    color: white;
    font-weight: 800;
    letter-spacing: 0.5px;
    background: linear-gradient(
        135deg,
        #0878ef,
        #21a9ff
    );
    box-shadow:
        0 0 12px rgba(22, 140, 255, 0.45),
        inset 0 1px rgba(255, 255, 255, 0.2);
    transition: 0.2s ease;
}

.main-button:hover,
.publish-button:hover,
.flash-promote-button:hover {
    transform: translateY(-2px);
    box-shadow:
        0 0 22px rgba(22, 140, 255, 0.65),
        inset 0 1px rgba(255, 255, 255, 0.25);
}

.main-button:active,
.publish-button:active,
.flash-promote-button:active {
    transform: scale(0.98);
}

.secondary-button {
    background: transparent;
    border: 1px solid var(--blue);
}

.back-button,
.text-button {
    display: block;
    width: 100%;
    margin-top: 18px;
    background: transparent;
    color: var(--blue-light);
}

.text-button {
    font-size: 14px;
}

.cancel-button,
.danger-button,
.secondary-action-button,
.small-admin-button,
.settings-option-button,
.media-button,
.action-button {
    min-height: 46px;
    border-radius: 12px;
    padding: 10px 14px;
    font-weight: 700;
}

.cancel-button {
    background: rgba(255, 255, 255, 0.07);
    color: var(--text);
    border: 1px solid var(--border);
}

.danger-button {
    background: rgba(255, 61, 98, 0.13);
    border: 1px solid rgba(255, 61, 98, 0.4);
    color: #ff6681;
}

.secondary-action-button {
    background: rgba(22, 140, 255, 0.08);
    border: 1px solid var(--border);
    color: var(--blue-light);
}

/* =========================================================
   FORMULARIOS
   ========================================================= */

.form-container {
    width: min(92%, 480px);
    margin: auto;
    padding: 30px 0;
}

.form-logo {
    width: 70px;
    height: 70px;
    display: grid;
    place-items: center;
    margin: 0 auto 18px;
    border-radius: 22px;
    font-size: 36px;
    background: rgba(22, 140, 255, 0.12);
    border: 1px solid var(--border);
    box-shadow: var(--shadow);
}

.form-container h2 {
    text-align: center;
    font-size: 28px;
}

.form-subtitle {
    margin: 8px 0 25px;
    text-align: center;
    color: var(--muted);
}

/* =========================================================
   DASHBOARD
   ========================================================= */

#dashboard-screen {
    display: none;
    flex-direction: column;
    padding-bottom: 90px;
    background:
        radial-gradient(circle at 90% 5%, rgba(0, 229, 255, 0.08), transparent 25%),
        var(--bg);
}

#dashboard-screen.active {
    display: flex;
}

.dashboard-header {
    position: sticky;
    top: 0;
    z-index: 20;
    display: flex;
    justify-content: space-between;
    align-items: center;
    min-height: 65px;
    padding: 10px 16px;
    background: rgba(5, 11, 24, 0.94);
    border-bottom: 1px solid var(--border);
    backdrop-filter: blur(15px);
}

.dashboard-brand {
    font-weight: 900;
    letter-spacing: 1px;
}

.dashboard-brand span {
    color: var(--cyan);
    margin-right: 5px;
}

.settings-button {
    width: 43px;
    height: 43px;
    border-radius: 12px;
    background: rgba(22, 140, 255, 0.1);
    color: var(--white);
    border: 1px solid var(--border);
    font-size: 22px;
}

.market-home {
    width: min(100%, 1100px);
    margin: 0 auto;
    padding: 16px;
}

/* =========================================================
   BUSCADOR
   ========================================================= */

.search-box {
    position: relative;
}

.search-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
}

.search-box input {
    padding-left: 45px;
    border-radius: 15px;
}

/* =========================================================
   CATEGORÍAS
   ========================================================= */

.section-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    margin-bottom: 14px;
}

.section-title h2 {
    font-size: 18px;
}

.section-title p {
    color: var(--muted);
    font-size: 12px;
    margin-top: 4px;
}

.section-title > span {
    padding: 5px 9px;
    border-radius: 20px;
    background: rgba(22, 140, 255, 0.12);
    color: var(--blue-light);
    font-size: 11px;
    font-weight: 800;
}

.categories-section {
    margin: 24px 0;
}

.categories-list {
    display: flex;
    gap: 9px;
    overflow-x: auto;
    scrollbar-width: none;
    padding-bottom: 4px;
}

.categories-list::-webkit-scrollbar {
    display: none;
}

.category-chip {
    flex: 0 0 auto;
    padding: 9px 13px;
    border-radius: 30px;
    color: var(--muted);
    background: var(--panel);
    border: 1px solid var(--border);
}

.category-chip.active {
    color: white;
    background: rgba(22, 140, 255, 0.22);
    border-color: var(--blue);
}

/* =========================================================
   FLASH DEL DÍA
   ========================================================= */

.flash-day-section {
    position: relative;
    overflow: hidden;
    padding: 18px;
    margin: 20px 0 30px;
    border-radius: 20px;
    background:
        linear-gradient(
            145deg,
            rgba(22, 140, 255, 0.16),
            rgba(0, 229, 255, 0.04)
        ),
        var(--panel);
    border: 1px solid rgba(66, 180, 255, 0.3);
    box-shadow: var(--shadow);
}

.flash-day-header {
    display: flex;
    align-items: center;
    gap: 13px;
}

.flash-icon {
    width: 50px;
    height: 50px;
    display: grid;
    place-items: center;
    border-radius: 15px;
    font-size: 27px;
    background: rgba(255, 212, 41, 0.12);
    color: var(--yellow);
    box-shadow: 0 0 18px rgba(255, 212, 41, 0.18);
}

.flash-day-header h2 {
    font-size: 20px;
}

.flash-day-header p {
    margin-top: 4px;
    color: var(--muted);
    font-size: 13px;
}

.flash-promotions-list {
    margin: 18px 0;
}

.empty-flash,
.empty-publications {
    padding: 30px 15px;
    text-align: center;
    border: 1px dashed rgba(66, 180, 255, 0.2);
    border-radius: 16px;
    color: var(--muted);
}

.empty-flash-icon,
.empty-publications-icon {
    font-size: 38px;
    margin-bottom: 10px;
    opacity: 0.7;
}

.empty-flash h3,
.empty-publications h3 {
    color: var(--text);
    margin-bottom: 6px;
}

.empty-flash p,
.empty-publications p {
    font-size: 13px;
}

.flash-promote-button {
    background: linear-gradient(
        135deg,
        #ffb400,
        #ffd429
    );
    color: #171000;
}

/* =========================================================
   PUBLICACIONES
   ========================================================= */

.publications-section {
    margin-top: 25px;
}

.publications-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
}

.publication-card {
    overflow: hidden;
    border-radius: 17px;
    background: var(--panel);
    border: 1px solid var(--border);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

.publication-card-image {
    width: 100%;
    aspect-ratio: 1 / 1;
    object-fit: cover;
    display: block;
    background: #071020;
}

.publication-card-body {
    padding: 12px;
}

.publication-card-title {
    font-size: 15px;
    font-weight: 800;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.publication-card-price {
    margin-top: 7px;
    color: var(--blue-light);
    font-weight: 900;
}

.publication-card-location {
    margin-top: 5px;
    color: var(--muted);
    font-size: 11px;
}

.publication-card-metrics {
    display: flex;
    gap: 9px;
    margin-top: 10px;
    color: var(--muted);
    font-size: 11px;
}

/* =========================================================
   NAVEGACIÓN
   ========================================================= */

.bottom-navigation {
    position: fixed;
    z-index: 50;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    justify-content: space-around;
    align-items: center;
    height: 78px;
    padding: 7px 20px;
    background: rgba(5, 11, 24, 0.96);
    border-top: 1px solid var(--border);
    backdrop-filter: blur(18px);
}

.nav-button {
    min-width: 70px;
    background: transparent;
    color: var(--muted);
}

.nav-button span {
    display: block;
    font-size: 24px;
}

.nav-button small,
.publish-nav-button small {
    display: block;
    margin-top: 2px;
}

.nav-button.active {
    color: var(--blue-light);
}

.publish-nav-button {
    width: 66px;
    height: 66px;
    margin-top: -30px;
    border-radius: 50%;
    color: white;
    background: linear-gradient(
        145deg,
        #0878ef,
        #20b7ff
    );
    box-shadow:
        0 0 25px rgba(22, 140, 255, 0.55),
        0 8px 25px rgba(0, 0, 0, 0.4);
}

.publish-nav-button span {
    display: block;
    font-size: 30px;
    line-height: 27px;
}

/* =========================================================
   PANELES
   ========================================================= */

.overlay-panel {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: none;
    align-items: flex-end;
    justify-content: center;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(7px);
}

.overlay-panel.active {
    display: flex;
}

.panel-content {
    width: min(100%, 760px);
    max-height: 94vh;
    overflow-y: auto;
    padding: 20px;
    border-radius: 25px 25px 0 0;
    background:
        linear-gradient(
            145deg,
            rgba(17, 33, 59, 0.98),
            rgba(7, 16, 32, 0.99)
        );
    border: 1px solid var(--border);
    box-shadow: 0 -10px 45px rgba(0, 0, 0, 0.4);
}

.panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 15px;
    margin-bottom: 20px;
}

.panel-header > div {
    display: flex;
    align-items: center;
    gap: 10px;
}

.panel-header h2 {
    font-size: 20px;
}

.panel-icon {
    font-size: 23px;
}

.close-panel-button {
    width: 40px;
    height: 40px;
    flex: 0 0 auto;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.07);
    color: white;
    font-size: 27px;
}

/* =========================================================
   SUBIDA DE MEDIOS
   ========================================================= */

.upload-section {
    margin-bottom: 20px;
}

.media-preview-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-top: 8px;
}

.media-preview-grid img {
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    border-radius: 12px;
}

.media-buttons {
    display: flex;
    gap: 8px;
    margin-top: 10px;
}

.media-button {
    flex: 1;
    background: rgba(22, 140, 255, 0.1);
    border: 1px solid var(--border);
    color: var(--blue-light);
}

.video-preview video {
    width: 100%;
    max-height: 250px;
    margin-top: 8px;
    border-radius: 13px;
}

/* =========================================================
   WHATSAPP TOGGLE
   ========================================================= */

.whatsapp-option {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 15px;
    margin: 20px 0;
    padding: 15px;
    border-radius: 15px;
    background: rgba(24, 216, 120, 0.06);
    border: 1px solid rgba(24, 216, 120, 0.2);
}

.whatsapp-option strong {
    color: var(--green);
}

.whatsapp-option p {
    margin-top: 5px;
    color: var(--muted);
    font-size: 12px;
    line-height: 1.4;
}

.switch {
    position: relative;
    width: 52px;
    height: 29px;
    flex: 0 0 auto;
    margin: 0;
}

.switch input {
    display: none;
}

.slider {
    position: absolute;
    inset: 0;
    border-radius: 30px;
    background: #26354c;
    cursor: pointer;
    transition: 0.2s;
}

.slider::before {
    content: "";
    position: absolute;
    width: 21px;
    height: 21px;
    left: 4px;
    top: 4px;
    border-radius: 50%;
    background: white;
    transition: 0.2s;
}

.switch input:checked + .slider {
    background: var(--green);
    box-shadow: 0 0 15px rgba(24, 216, 120, 0.45);
}

.switch input:checked + .slider::before {
    transform: translateX(23px);
}

/* =========================================================
   ACCIONES DE FORMULARIO
   ========================================================= */

.form-actions {
    display: flex;
    gap: 10px;
    margin-top: 20px;
}

.form-actions > * {
    flex: 1;
}

/* =========================================================
   VISTA PREVIA
   ========================================================= */

.publication-preview {
    overflow: hidden;
    border-radius: 18px;
    background: var(--panel);
    border: 1px solid var(--border);
}

.preview-main-image {
    width: 100%;
    max-height: 450px;
    object-fit: contain;
    background: #020711;
}

.preview-info {
    padding: 16px;
}

.preview-info h3 {
    font-size: 22px;
}

.preview-price {
    margin-top: 8px;
    color: var(--blue-light);
    font-size: 20px;
    font-weight: 900;
}

.preview-description {
    margin-top: 15px;
    color: var(--muted);
    line-height: 1.5;
}

.preview-confirmation {
    margin-top: 18px;
    padding: 16px;
    border-radius: 16px;
    background: rgba(22, 140, 255, 0.07);
    border: 1px solid var(--border);
}

.preview-confirmation p {
    margin-top: 6px;
    color: var(--muted);
    font-size: 13px;
}

/* =========================================================
   DETALLE DE PUBLICACIÓN
   ========================================================= */

.publication-detail-content {
    position: relative;
    width: min(100%, 900px);
    max-height: 100vh;
    overflow-y: auto;
    background: var(--bg);
}

.detail-back-button {
    position: fixed;
    z-index: 10;
    top: 15px;
    left: 15px;
    width: 45px;
    height: 45px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.65);
    color: white;
    font-size: 25px;
}

.publication-detail-media {
    width: 100%;
    background: #020711;
}

.publication-detail-media img,
.publication-detail-media video {
    display: block;
    width: 100%;
    max-height: 65vh;
    object-fit: contain;
    margin: auto;
}

.publication-detail-info {
    padding: 20px;
}

.publication-detail-info h1 {
    font-size: 25px;
}

.publication-detail-info .detail-price {
    margin-top: 8px;
    color: var(--blue-light);
    font-size: 22px;
    font-weight: 900;
}

.detail-description {
    margin-top: 15px;
    color: var(--muted);
    line-height: 1.55;
}

.detail-location {
    margin-top: 14px;
    color: var(--muted);
}

.publication-metrics {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    padding: 0 20px 20px;
}

.publication-metrics > div {
    padding: 12px 5px;
    text-align: center;
    border-radius: 14px;
    background: var(--panel);
    border: 1px solid var(--border);
}

.publication-metrics span,
.publication-metrics strong,
.publication-metrics small {
    display: block;
}

.publication-metrics span {
    margin-bottom: 4px;
}

.publication-metrics strong {
    font-size: 18px;
}

.publication-metrics small {
    margin-top: 3px;
    color: var(--muted);
    font-size: 10px;
}

.publication-actions {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    padding: 0 20px 30px;
}

.action-button {
    background: var(--panel);
    color: var(--text);
    border: 1px solid var(--border);
}

.like-action {
    color: #ff6681;
}

.save-action {
    color: var(--yellow);
}

.chat-action {
    color: var(--blue-light);
}

.whatsapp-action {
    color: var(--green);
    border-color: rgba(24, 216, 120, 0.3);
}

/* =========================================================
   PERFIL
   ========================================================= */

.profile-header {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 20px;
}

.profile-photo {
    width: 75px;
    height: 75px;
    display: grid;
    place-items: center;
    overflow: hidden;
    border-radius: 50%;
    background: var(--panel-light);
    border: 2px solid var(--blue);
    font-size: 35px;
}

.profile-photo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.profile-header h3 {
    font-size: 21px;
}

.profile-header p {
    margin-top: 5px;
    color: var(--muted);
}

.profile-statistics {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-bottom: 20px;
}

.profile-statistics > div {
    padding: 14px 5px;
    text-align: center;
    border-radius: 14px;
    background: var(--panel);
    border: 1px solid var(--border);
}

.profile-statistics strong,
.profile-statistics small {
    display: block;
}

.profile-statistics small {
    margin-top: 4px;
    color: var(--muted);
    font-size: 10px;
}

.profile-content > button {
    margin-top: 10px;
}

.admin-button {
    width: 100%;
    min-height: 50px;
    margin-top: 10px;
    border-radius: 13px;
    background: linear-gradient(
        135deg,
        #692cff,
        #b32cff
    );
    color: white;
    font-weight: 800;
    box-shadow: 0 0 20px rgba(105, 44, 255, 0.3);
}

.discreet-delete {
    width: auto;
    min-height: auto;
    margin: 25px auto 0 !important;
    padding: 7px 10px;
    background: transparent;
    border: 0;
    font-size: 11px;
    color: #6f7b8f;
}

/* =========================================================
   CONFIGURACIÓN
   ========================================================= */

.settings-option-button {
    display: block;
    width: 100%;
    margin-top: 10px;
    text-align: left;
    color: var(--text);
    background: rgba(22, 140, 255, 0.07);
    border: 1px solid var(--border);
}

/* =========================================================
   ADMINISTRACIÓN
   ========================================================= */

.admin-content {
    max-width: 950px;
}

.admin-dashboard {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin-bottom: 25px;
}

.admin-stat-card {
    padding: 16px;
    border-radius: 16px;
    background: var(--panel);
    border: 1px solid var(--border);
}

.admin-stat-card span,
.admin-stat-card strong,
.admin-stat-card small {
    display: block;
}

.admin-stat-card span {
    font-size: 20px;
}

.admin-stat-card strong {
    margin-top: 8px;
    font-size: 25px;
}

.admin-stat-card small {
    margin-top: 4px;
    color: var(--muted);
    font-size: 11px;
}

.admin-section {
    margin-top: 22px;
    padding: 16px;
    border-radius: 18px;
    background: rgba(12, 23, 43, 0.75);
    border: 1px solid var(--border);
}

.admin-section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-bottom: 15px;
}

.admin-section-header h3 {
    font-size: 17px;
}

.admin-section-header p {
    margin-top: 4px;
    color: var(--muted);
    font-size: 11px;
}

.small-admin-button {
    flex: 0 0 auto;
    color: var(--blue-light);
    background: rgba(22, 140, 255, 0.1);
    border: 1px solid var(--border);
}

.admin-list,
.admin-users-list,
.admin-publications-list,
.admin-payment-proofs-list,
.admin-payment-methods-list {
    display: grid;
    gap: 9px;
}

.admin-item {
    padding: 13px;
    border-radius: 13px;
    background: var(--bg-secondary);
    border: 1px solid rgba(66, 180, 255, 0.13);
}

.admin-item-title {
    font-weight: 800;
}

.admin-item-meta {
    margin-top: 4px;
    color: var(--muted);
    font-size: 11px;
}

.admin-item-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    margin-top: 10px;
}

.admin-item-actions button {
    flex: 1;
    min-width: 90px;
}

.notification-badge {
    display: grid;
    place-items: center;
    min-width: 28px;
    height: 28px;
    padding: 0 7px;
    border-radius: 20px;
    color: white;
    background: var(--red);
    font-size: 12px;
    font-weight: 900;
}

.membership-settings {
    display: grid;
    gap: 4px;
}

/* =========================================================
   PAGOS
   ========================================================= */

.payment-method-card {
    padding: 14px;
    border-radius: 14px;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
}

.payment-method-card h4 {
    margin-bottom: 8px;
}

.payment-method-card p {
    color: var(--muted);
    font-size: 12px;
    line-height: 1.5;
}

.payment-method-card button {
    margin-top: 10px;
}

.payment-proof-preview {
    margin: 15px 0;
}

.payment-proof-preview img {
    display: block;
    width: 100%;
    max-height: 400px;
    object-fit: contain;
    border-radius: 14px;
    background: #020711;
}

.admin-proof-actions {
    display: grid;
    gap: 9px;
    margin-top: 18px;
}

.admin-proof-detail {
    color: var(--muted);
    line-height: 1.5;
}

/* =========================================================
   CHAT
   ========================================================= */

.chat-panel {
    align-items: stretch;
}

.chat-panel-content {
    display: flex;
    flex-direction: column;
    width: min(100%, 700px);
    height: 100%;
    margin-left: auto;
    margin-right: auto;
    background: var(--bg);
}

.chat-header {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 65px;
    padding: 10px 15px;
    background: var(--panel);
    border-bottom: 1px solid var(--border);
}

.chat-back-button {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    background: rgba(22, 140, 255, 0.1);
    color: white;
    font-size: 23px;
}

.chat-header small {
    display: block;
    margin-top: 3px;
    color: var(--muted);
}

.chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 15px;
}

.chat-message {
    max-width: 80%;
    margin-bottom: 10px;
    padding: 10px 13px;
    border-radius: 15px;
    line-height: 1.4;
    font-size: 14px;
}

.chat-message.mine {
    margin-left: auto;
    background: var(--blue);
}

.chat-message.other {
    background: var(--panel-light);
}

.chat-input-area {
    display: flex;
    gap: 8px;
    padding: 10px;
    border-top: 1px solid var(--border);
    background: var(--panel);
}

.chat-input-area input {
    flex: 1;
}

.chat-input-area button {
    width: 50px;
    border-radius: 13px;
    background: var(--blue);
    color: white;
}

.whatsapp-chat-button {
    margin: 0 10px 10px;
    min-height: 50px;
    border-radius: 13px;
    background: #19c96b;
    color: white;
    font-weight: 800;
    box-shadow: 0 0 18px rgba(24, 216, 120, 0.25);
}

/* =========================================================
   VISOR COMPLETO
   ========================================================= */

.fullscreen-viewer {
    position: fixed;
    inset: 0;
    z-index: 300;
    display: none;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: rgba(0, 0, 0, 0.95);
}

.fullscreen-viewer.active {
    display: flex;
}

.fullscreen-close-button {
    position: absolute;
    top: 15px;
    right: 15px;
    width: 45px;
    height: 45px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    font-size: 28px;
}

.fullscreen-content {
    max-width: 100%;
    max-height: 90vh;
}

.fullscreen-content img {
    max-width: 100%;
    max-height: 90vh;
    object-fit: contain;
}

/* =========================================================
   TOAST
   ========================================================= */

.toast-container {
    position: fixed;
    z-index: 500;
    top: 75px;
    right: 12px;
    left: 12px;
    display: grid;
    gap: 8px;
    pointer-events: none;
}

.toast {
    width: min(100%, 420px);
    margin-left: auto;
    padding: 13px 15px;
    border-radius: 13px;
    background: #102039;
    border: 1px solid var(--border);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
    color: white;
    font-size: 13px;
    animation: toastIn 0.25s ease;
}

/* =========================================================
   CARGANDO
   ========================================================= */

.loading-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: grid;
    place-items: center;
    background: rgba(2, 7, 17, 0.86);
    backdrop-filter: blur(5px);
}

.loading-overlay[hidden] {
    display: none;
}

.loading-box {
    width: min(85%, 330px);
    padding: 25px;
    text-align: center;
    border-radius: 20px;
    background: var(--panel);
    border: 1px solid var(--border);
    box-shadow: var(--shadow);
}

.loading-lightning {
    font-size: 45px;
    animation: flashPulse 1s infinite;
}

.loading-spinner {
    width: 38px;
    height: 38px;
    margin: 15px auto;
    border: 3px solid rgba(255, 255, 255, 0.12);
    border-top-color: var(--blue-light);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

.loading-box p {
    color: var(--muted);
    font-size: 13px;
}

/* =========================================================
   ANIMACIONES
   ========================================================= */

@keyframes flashPulse {
    0%,
    100% {
        opacity: 0.65;
        transform: scale(1);
    }

    50% {
        opacity: 1;
        transform: scale(1.05);
    }
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

@keyframes toastIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* =========================================================
   TABLET
   ========================================================= */

@media (min-width: 650px) {

    .welcome-buttons {
        grid-template-columns: repeat(2, 1fr);
    }

    .publications-list {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .admin-dashboard {
        grid-template-columns: repeat(4, 1fr);
    }

    .publication-actions {
        grid-template-columns: repeat(4, 1fr);
    }

}

/* =========================================================
   ESCRITORIO
   ========================================================= */

@media (min-width: 950px) {

    .market-home {
        padding: 25px;
    }

    .publications-list {
        grid-template-columns: repeat(4, minmax(0, 1fr));
    }

    .bottom-navigation {
        left: 50%;
        right: auto;
        width: min(600px, 90%);
        transform: translateX(-50%);
        bottom: 15px;
        border: 1px solid var(--border);
        border-radius: 25px;
    }

    #dashboard-screen {
        padding-bottom: 110px;
    }

}

/* =========================================================
   UTILIDADES
   ========================================================= */

[hidden] {
    display: none !important;
}

body.no-scroll {
    overflow: hidden;
}/* =========================================================
   MARKET FLASH
   SCRIPT PRINCIPAL
   PARTE 2
   AUTENTICACIÓN + SESIÓN + PERFIL + AJUSTES
   ========================================================= */


/* =========================================================
   REFERENCIAS DEL DOM
   ========================================================= */

const welcomeScreen = $("welcome-screen");
const loginScreen = $("login-screen");
const registerScreen = $("register-screen");
const dashboardScreen = $("dashboard-screen");

const loginButton = $("login-button");
const registerButton = $("register-button");

const loginForm = $("login-form");
const loginCedula = $("login-cedula");
const loginPassword = $("login-password");
const forgotPasswordButton = $("forgot-password-button");
const backFromLogin = $("back-from-login");

const registerForm = $("register-form");
const registerName = $("register-name");
const registerCedula = $("register-cedula");
const registerPhone = $("register-phone");
const registerPassword = $("register-password");
const registerPasswordConfirm = $("register-password-confirm");
const backFromRegister = $("back-from-register");

const settingsButton = $("settings-button");

const profileNavButton = $("profile-nav-button");
const homeNavButton = $("home-nav-button");

const profilePanel = $("profile-panel");
const closeProfilePanel = $("close-profile-panel");

const profilePhoto = $("profile-photo");
const profileName = $("profile-name");
const profilePhone = $("profile-phone");
const profilePublicationsCount = $("profile-publications-count");
const profileLikesCount = $("profile-likes-count");
const profileSavesCount = $("profile-saves-count");

const editProfileButton = $("edit-profile-button");
const profileSettingsButton = $("profile-settings-button");
const administrationButton = $("administration-button");
const logoutProfileButton = $("logout-profile-button");
const deleteAccountButton = $("delete-account-button");

const settingsPanel = $("settings-panel");
const closeSettings = $("close-settings");

const appSettingsButton = $("app-settings-button");
const settingsProfileButton = $("settings-profile-button");
const logoutButton = $("logout-button");

const editProfilePanel = $("edit-profile-panel");
const closeEditProfilePanel = $("close-edit-profile-panel");

const editProfileForm = $("edit-profile-form");
const editProfileName = $("edit-profile-name");
const editProfilePhone = $("edit-profile-phone");
const editProfilePhoto = $("edit-profile-photo");


/* =========================================================
   UTILIDADES DE AUTENTICACIÓN
   ========================================================= */

function normalizeCedula(value) {
    return String(value || "").replace(/\D/g, "");
}


/*
   Supabase Auth trabaja con email/phone.
   Como Market Flash utilizará la cédula como identificador
   de inicio de sesión, generamos un correo interno único.

   IMPORTANTE:
   Este correo NO sustituye la cédula que guardaremos
   en el perfil del usuario.
*/

function makeAuthEmail(cedula) {
    const cleanCedula = normalizeCedula(cedula);

    return `${cleanCedula}@marketflash.app`;
}


/* =========================================================
   INICIALIZACIÓN GENERAL
   ========================================================= */

async function initializeApplication() {
    console.log("Inicializando aplicación Market Flash...");

    bindAuthenticationEvents();
    bindNavigationEvents();
    bindProfileEvents();
    bindSettingsEvents();

    await restoreSession();

    console.log("Market Flash listo.");
}


/* =========================================================
   EVENTOS DE AUTENTICACIÓN
   ========================================================= */

function bindAuthenticationEvents() {

    if (loginButton) {
        loginButton.addEventListener("click", function () {
            showScreen("login-screen");
        });
    }

    if (registerButton) {
        registerButton.addEventListener("click", function () {
            showScreen("register-screen");
        });
    }

    if (backFromLogin) {
        backFromLogin.addEventListener("click", function () {
            showScreen("welcome-screen");
        });
    }

    if (backFromRegister) {
        backFromRegister.addEventListener("click", function () {
            showScreen("welcome-screen");
        });
    }

    if (loginForm) {
        loginForm.addEventListener("submit", handleLogin);
    }

    if (registerForm) {
        registerForm.addEventListener("submit", handleRegistration);
    }

    if (forgotPasswordButton) {
        forgotPasswordButton.addEventListener(
            "click",
            handleForgotPassword
        );
    }
}


/* =========================================================
   REGISTRO
   ========================================================= */

async function handleRegistration(event) {

    event.preventDefault();

    if (!supabaseClient) {
        showToast(
            "Supabase todavía no está conectado.",
            "error"
        );
        return;
    }

    const name = String(registerName?.value || "").trim();
    const cedula = normalizeCedula(registerCedula?.value);
    const phone = normalizePhone(registerPhone?.value);
    const password = String(registerPassword?.value || "");
    const passwordConfirm =
        String(registerPasswordConfirm?.value || "");

    if (!name) {
        showToast(
            "Escribe tu nombre completo.",
            "error"
        );
        registerName?.focus();
        return;
    }

    if (!cedula) {
        showToast(
            "Escribe tu cédula.",
            "error"
        );
        registerCedula?.focus();
        return;
    }

    if (cedula.length < 6) {
        showToast(
            "La cédula parece incompleta.",
            "error"
        );
        registerCedula?.focus();
        return;
    }

    if (!phone) {
        showToast(
            "Escribe tu número de WhatsApp.",
            "error"
        );
        registerPhone?.focus();
        return;
    }

    if (password.length < 6) {
        showToast(
            "La contraseña debe tener al menos 6 caracteres.",
            "error"
        );
        registerPassword?.focus();
        return;
    }

    if (password !== passwordConfirm) {
        showToast(
            "Las contraseñas no coinciden.",
            "error"
        );
        registerPasswordConfirm?.focus();
        return;
    }

    showLoading("Creando tu cuenta...");

    try {

        /*
           Primero comprobamos si la cédula ya existe
           en la tabla profiles.

           Si la tabla todavía no existe, el error se mostrará
           claramente. Más adelante la crearemos con el SQL.
        */

        const {
            data: existingProfile,
            error: profileCheckError
        } = await supabaseClient
            .from("profiles")
            .select("id, cedula")
            .eq("cedula", cedula)
            .maybeSingle();

        if (
            profileCheckError &&
            profileCheckError.code !== "PGRST116"
        ) {
            console.error(
                "Error comprobando cédula:",
                profileCheckError
            );
        }

        if (existingProfile) {
            hideLoading();

            showToast(
                "Ya existe una cuenta con esa cédula.",
                "error"
            );

            return;
        }

        const authEmail = makeAuthEmail(cedula);

        const {
            data,
            error
        } = await supabaseClient.auth.signUp({
            email: authEmail,
            password: password,
            options: {
                data: {
                    full_name: name,
                    cedula: cedula,
                    phone: phone
                }
            }
        });

        if (error) {
            console.error(
                "Error registrando usuario:",
                error
            );

            hideLoading();

            if (
                error.message &&
                error.message.toLowerCase().includes("already registered")
            ) {
                showToast(
                    "Ya existe una cuenta con esos datos.",
                    "error"
                );
            } else {
                showToast(
                    error.message || "No se pudo crear la cuenta.",
                    "error"
                );
            }

            return;
        }

        if (!data?.user) {
            hideLoading();

            showToast(
                "Supabase no devolvió el usuario creado.",
                "error"
            );

            return;
        }


        /*
           Si Supabase permite iniciar sesión inmediatamente,
           guardamos también el perfil.
        */

        if (data.session) {

            await createOrUpdateProfile(
                data.user,
                {
                    full_name: name,
                    cedula: cedula,
                    phone: phone
                }
            );

            currentUser = data.user;

            await loadCurrentUserProfile();

            saveLocalUser({
                id: data.user.id,
                name: name,
                cedula: cedula,
                phone: phone
            });

            await updateLastSeen();

            hideLoading();

            showToast(
                "¡Cuenta creada correctamente!",
                "success"
            );

            clearRegistrationForm();

            showScreen("dashboard-screen");

            return;
        }


        /*
           Si la confirmación de correo está activa en Supabase,
           no tendremos sesión inmediatamente.

           Como este proyecto utiliza la cédula como acceso,
           posteriormente dejaremos la configuración de Auth
           preparada para que no dependa de un correo visible
           para el usuario.
        */

        hideLoading();

        showToast(
            "La cuenta fue creada. Revisa la configuración de Auth de Supabase antes de continuar.",
            "success"
        );

        clearRegistrationForm();

        showScreen("login-screen");

    } catch (error) {

        console.error(
            "Error inesperado durante el registro:",
            error
        );

        hideLoading();

        showToast(
            "Ocurrió un error creando la cuenta.",
            "error"
        );
    }
}


/* =========================================================
   CREAR / ACTUALIZAR PERFIL
   ========================================================= */

async function createOrUpdateProfile(
    user,
    profileData = {}
) {

    if (!supabaseClient || !user) {
        return null;
    }

    const payload = {
        id: user.id,
        full_name:
            profileData.full_name ||
            user.user_metadata?.full_name ||
            "",
        cedula:
            profileData.cedula ||
            user.user_metadata?.cedula ||
            "",
        phone:
            profileData.phone ||
            user.user_metadata?.phone ||
            "",
        status: "active"
    };

    const {
        data,
        error
    } = await supabaseClient
        .from("profiles")
        .upsert(
            payload,
            {
                onConflict: "id"
            }
        )
        .select()
        .maybeSingle();

    if (error) {
        console.error(
            "No se pudo guardar el perfil:",
            error
        );

        return null;
    }

    return data;
}


/* =========================================================
   INICIO DE SESIÓN
   ========================================================= */

async function handleLogin(event) {

    event.preventDefault();

    if (!supabaseClient) {
        showToast(
            "Supabase todavía no está conectado.",
            "error"
        );
        return;
    }

    const cedula = normalizeCedula(loginCedula?.value);
    const password = String(loginPassword?.value || "");

    if (!cedula) {
        showToast(
            "Escribe tu cédula.",
            "error"
        );
        loginCedula?.focus();
        return;
    }

    if (!password) {
        showToast(
            "Escribe tu contraseña.",
            "error"
        );
        loginPassword?.focus();
        return;
    }

    showLoading("Iniciando sesión...");

    try {

        const authEmail = makeAuthEmail(cedula);

        const {
            data,
            error
        } = await supabaseClient.auth.signInWithPassword({
            email: authEmail,
            password: password
        });

        if (error) {
            console.error(
                "Error iniciando sesión:",
                error
            );

            hideLoading();

            showToast(
                "Cédula o contraseña incorrecta.",
                "error"
            );

            return;
        }

        if (!data?.user) {
            hideLoading();

            showToast(
                "No se pudo obtener la sesión.",
                "error"
            );

            return;
        }

        currentUser = data.user;

        await loadCurrentUserProfile();

        if (
            currentProfile &&
            ["blocked", "suspended", "deleted"].includes(
                currentProfile.status
            )
        ) {

            await supabaseClient.auth.signOut();

            currentUser = null;
            currentProfile = null;

            hideLoading();

            showToast(
                "Esta cuenta no puede acceder a Market Flash.",
                "error"
            );

            return;
        }

        saveLocalUser({
            id: data.user.id,
            name:
                currentProfile?.full_name ||
                data.user.user_metadata?.full_name ||
                "",
            cedula:
                currentProfile?.cedula ||
                cedula,
            phone:
                currentProfile?.phone ||
                data.user.user_metadata?.phone ||
                ""
        });

        await updateLastSeen();

        hideLoading();

        loginForm?.reset();

        showScreen("dashboard-screen");

        await refreshDashboardAfterLogin();

        showToast(
            "¡Bienvenido nuevamente!",
            "success"
        );

    } catch (error) {

        console.error(
            "Error inesperado iniciando sesión:",
            error
        );

        hideLoading();

        showToast(
            "No se pudo iniciar sesión.",
            "error"
        );
    }
}


/* =========================================================
   CARGAR PERFIL ACTUAL
   ========================================================= */

async function loadCurrentUserProfile() {

    if (!supabaseClient || !currentUser) {
        return null;
    }

    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("profiles")
            .select("*")
            .eq("id", currentUser.id)
            .maybeSingle();

        if (error) {
            console.error(
                "Error cargando perfil:",
                error
            );

            return null;
        }

        if (data) {

            currentProfile = data;

            renderProfile();

            return data;
        }


        /*
           Si todavía no existe el perfil, intentamos crearlo
           utilizando los metadatos de Supabase Auth.
        */

        const metadata = currentUser.user_metadata || {};

        const createdProfile =
            await createOrUpdateProfile(
                currentUser,
                {
                    full_name:
                        metadata.full_name || "",
                    cedula:
                        metadata.cedula || "",
                    phone:
                        metadata.phone || ""
                }
            );

        currentProfile = createdProfile;

        renderProfile();

        return createdProfile;

    } catch (error) {

        console.error(
            "Error obteniendo perfil:",
            error
        );

        return null;
    }
}


/* =========================================================
   SESIÓN EXISTENTE
   ========================================================= */

async function restoreSession() {

    if (!supabaseClient) {
        return;
    }

    try {

        const {
            data,
            error
        } = await supabaseClient.auth.getSession();

        if (error) {
            console.error(
                "Error recuperando sesión:",
                error
            );

            showScreen("welcome-screen");

            return;
        }

        if (data?.session?.user) {

            currentUser = data.session.user;

            await loadCurrentUserProfile();

            if (
                currentProfile &&
                ["blocked", "suspended", "deleted"].includes(
                    currentProfile.status
                )
            ) {

                await supabaseClient.auth.signOut();

                currentUser = null;
                currentProfile = null;

                showScreen("welcome-screen");

                showToast(
                    "Tu cuenta no tiene acceso actualmente.",
                    "error"
                );

                return;
            }

            await updateLastSeen();

            saveLocalUser({
                id: currentUser.id,
                name:
                    currentProfile?.full_name ||
                    currentUser.user_metadata?.full_name ||
                    "",
                cedula:
                    currentProfile?.cedula ||
                    "",
                phone:
                    currentProfile?.phone ||
                    ""
            });

            showScreen("dashboard-screen");

            await refreshDashboardAfterLogin();

        } else {

            showScreen("welcome-screen");
        }

    } catch (error) {

        console.error(
            "Error restaurando sesión:",
            error
        );

        showScreen("welcome-screen");
    }


    /*
       Escuchamos cambios posteriores de autenticación.
    */

    supabaseClient.auth.onAuthStateChange(
        function (event, session) {

            console.log(
                "Cambio de autenticación:",
                event
            );

            if (session?.user) {
                currentUser = session.user;
            }

            if (event === "SIGNED_OUT") {

                currentUser = null;
                currentProfile = null;

                clearLocalUser();

                showScreen("welcome-screen");
            }
        }
    );
}


/* =========================================================
   ÚLTIMA ACTIVIDAD
   ========================================================= */

async function updateLastSeen() {

    if (!supabaseClient || !currentUser) {
        return;
    }

    try {

        await supabaseClient
            .from("profiles")
            .update({
                last_seen_at: new Date().toISOString()
            })
            .eq("id", currentUser.id);

    } catch (error) {

        console.warn(
            "No se pudo actualizar la última conexión:",
            error
        );
    }
}


/* =========================================================
   NAVEGACIÓN PRINCIPAL
   ========================================================= */

function bindNavigationEvents() {

    if (homeNavButton) {
        homeNavButton.addEventListener(
            "click",
            function () {

                closePanel("profile-panel");
                closePanel("settings-panel");
                closePanel("edit-profile-panel");

                showScreen("dashboard-screen");

                if (typeof loadPublications === "function") {
                    loadPublications();
                }
            }
        );
    }

    if (profileNavButton) {
        profileNavButton.addEventListener(
            "click",
            function () {
                openProfile();
            }
        );
    }

    if (settingsButton) {
        settingsButton.addEventListener(
            "click",
            function () {
                openSettings();
            }
        );
    }
}


/* =========================================================
   PERFIL
   ========================================================= */

function bindProfileEvents() {

    if (closeProfilePanel) {
        closeProfilePanel.addEventListener(
            "click",
            function () {
                closePanel("profile-panel");
            }
        );
    }

    if (editProfileButton) {
        editProfileButton.addEventListener(
            "click",
            function () {
                openEditProfile();
            }
        );
    }

    if (profileSettingsButton) {
        profileSettingsButton.addEventListener(
            "click",
            function () {
                closePanel("profile-panel");
                openSettings();
            }
        );
    }

    if (administrationButton) {
        administrationButton.addEventListener(
            "click",
            openAdministrationFromProfile
        );
    }

    if (logoutProfileButton) {
        logoutProfileButton.addEventListener(
            "click",
            handleLogout
        );
    }

    if (deleteAccountButton) {
        deleteAccountButton.addEventListener(
            "click",
            handleDeleteAccount
        );
    }

    if (closeEditProfilePanel) {
        closeEditProfilePanel.addEventListener(
            "click",
            function () {
                closePanel("edit-profile-panel");
            }
        );
    }

    if (editProfileForm) {
        editProfileForm.addEventListener(
            "submit",
            handleEditProfile
        );
    }
}


/* =========================================================
   ABRIR PERFIL
   ========================================================= */

async function openProfile() {

    if (!currentUser) {
        showScreen("welcome-screen");
        return;
    }

    await loadCurrentUserProfile();

    renderProfile();

    openPanel("profile-panel");
}


/* =========================================================
   RENDERIZAR PERFIL
   ========================================================= */

function renderProfile() {

    if (!currentProfile) {
        return;
    }

    if (profileName) {
        profileName.textContent =
            currentProfile.full_name ||
            "Usuario Market Flash";
    }

    if (profilePhone) {
        profilePhone.textContent =
            currentProfile.phone ||
            "Sin número registrado";
    }

    if (profilePhoto) {

        profilePhoto.src =
            currentProfile.avatar_url ||
            defaultProductImage();
    }

    if (profilePublicationsCount) {
        profilePublicationsCount.textContent =
            currentProfile.publications_count || 0;
    }

    if (profileLikesCount) {
        profileLikesCount.textContent =
            currentProfile.likes_received || 0;
    }

    if (profileSavesCount) {
        profileSavesCount.textContent =
            currentProfile.saves_received || 0;
    }


    /*
       El botón de administración solo se muestra
       a usuarios que tengan permisos administrativos.
    */

    if (administrationButton) {

        const admin =
            currentProfile.role === "admin" ||
            currentProfile.is_admin === true;

        administrationButton.hidden = !admin;
    }
}


/* =========================================================
   AJUSTES
   ========================================================= */

function bindSettingsEvents() {

    if (closeSettings) {
        closeSettings.addEventListener(
            "click",
            function () {
                closePanel("settings-panel");
            }
        );
    }

    if (settingsProfileButton) {
        settingsProfileButton.addEventListener(
            "click",
            function () {

                closePanel("settings-panel");

                openEditProfile();
            }
        );
    }

    if (appSettingsButton) {
        appSettingsButton.addEventListener(
            "click",
            function () {

                showToast(
                    "Las opciones generales de Market Flash se configurarán aquí.",
                    "info"
                );
            }
        );
    }

    if (logoutButton) {
        logoutButton.addEventListener(
            "click",
            handleLogout
        );
    }
}


function openSettings() {

    if (!currentUser) {
        showScreen("welcome-screen");
        return;
    }

    openPanel("settings-panel");
}


/* =========================================================
   EDITAR PERFIL
   ========================================================= */

function openEditProfile() {

    if (!currentUser) {
        return;
    }

    closePanel("profile-panel");
    closePanel("settings-panel");

    if (editProfileName) {
        editProfileName.value =
            currentProfile?.full_name || "";
    }

    if (editProfilePhone) {
        editProfilePhone.value =
            currentProfile?.phone || "";
    }

    editingProfilePhoto = null;

    if (editProfilePhoto) {
        editProfilePhoto.value = "";
    }

    openPanel("edit-profile-panel");
}


/* =========================================================
   FOTO DEL PERFIL
   ========================================================= */

if (editProfilePhoto) {

    editProfilePhoto.addEventListener(
        "change",
        function () {

            const file =
                editProfilePhoto.files?.[0];

            if (!file) {
                editingProfilePhoto = null;
                return;
            }

            if (!file.type.startsWith("image/")) {

                showToast(
                    "Selecciona una imagen válida.",
                    "error"
                );

                editProfilePhoto.value = "";
                editingProfilePhoto = null;

                return;
            }

            if (file.size > 5 * 1024 * 1024) {

                showToast(
                    "La foto no puede superar 5 MB.",
                    "error"
                );

                editProfilePhoto.value = "";
                editingProfilePhoto = null;

                return;
            }

            editingProfilePhoto = file;

            showToast(
                "Nueva foto seleccionada.",
                "success"
            );
        }
    );
}


/* =========================================================
   GUARDAR CAMBIOS DEL PERFIL
   ========================================================= */

async function handleEditProfile(event) {

    event.preventDefault();

    if (!supabaseClient || !currentUser) {
        showToast(
            "No hay una sesión activa.",
            "error"
        );
        return;
    }

    const name =
        String(editProfileName?.value || "").trim();

    const phone =
        normalizePhone(editProfilePhone?.value);

    if (!name) {
        showToast(
            "El nombre no puede estar vacío.",
            "error"
        );
        return;
    }

    if (!phone) {
        showToast(
            "Escribe un número de teléfono.",
            "error"
        );
        return;
    }

    showLoading("Guardando perfil...");

    try {

        let avatarUrl =
            currentProfile?.avatar_url || null;


        /*
           Si el usuario seleccionó una foto,
           la subimos al bucket profile-photos.
        */

        if (editingProfilePhoto) {

            const extension =
                getFileExtension(
                    editingProfilePhoto.name
                );

            const filePath =
                `${currentUser.id}/avatar-${Date.now()}.${extension}`;

            const {
                error: uploadError
            } = await supabaseClient
                .storage
                .from("profile-photos")
                .upload(
                    filePath,
                    editingProfilePhoto,
                    {
                        upsert: true,
                        contentType:
                            editingProfilePhoto.type
                    }
                );

            if (uploadError) {

                console.error(
                    "Error subiendo foto:",
                    uploadError
                );

                hideLoading();

                showToast(
                    "No se pudo subir la foto. Primero debemos configurar Storage en Supabase.",
                    "error"
                );

                return;
            }

            const {
                data: publicUrlData
            } = supabaseClient
                .storage
                .from("profile-photos")
                .getPublicUrl(filePath);

            avatarUrl =
                publicUrlData?.publicUrl ||
                avatarUrl;
        }


        const {
            data,
            error
        } = await supabaseClient
            .from("profiles")
            .update({
                full_name: name,
                phone: phone,
                avatar_url: avatarUrl
            })
            .eq("id", currentUser.id)
            .select()
            .maybeSingle();

        if (error) {

            console.error(
                "Error actualizando perfil:",
                error
            );

            hideLoading();

            showToast(
                error.message ||
                "No se pudo guardar el perfil.",
                "error"
            );

            return;
        }

        currentProfile =
            data || {
                ...currentProfile,
                full_name: name,
                phone: phone,
                avatar_url: avatarUrl
            };

        saveLocalUser({
            id: currentUser.id,
            name: name,
            cedula:
                currentProfile.cedula || "",
            phone: phone
        });

        renderProfile();

        closePanel("edit-profile-panel");

        hideLoading();

        showToast(
            "Perfil actualizado correctamente.",
            "success"
        );

    } catch (error) {

        console.error(
            "Error inesperado actualizando perfil:",
            error
        );

        hideLoading();

        showToast(
            "No se pudo actualizar el perfil.",
            "error"
        );
    }
}


/* =========================================================
   CERRAR SESIÓN
   ========================================================= */

async function handleLogout() {

    if (!supabaseClient) {
        return;
    }

    const confirmed =
        window.confirm(
            "¿Seguro que quieres cerrar sesión?"
        );

    if (!confirmed) {
        return;
    }

    showLoading("Cerrando sesión...");

    try {

        const {
            error
        } = await supabaseClient.auth.signOut();

        if (error) {
            console.error(
                "Error cerrando sesión:",
                error
            );

            hideLoading();

            showToast(
                "No se pudo cerrar la sesión.",
                "error"
            );

            return;
        }

        currentUser = null;
        currentProfile = null;
        currentPublication = null;
        currentConversation = null;

        clearLocalUser();

        closePanel("profile-panel");
        closePanel("settings-panel");
        closePanel("edit-profile-panel");

        hideLoading();

        showScreen("welcome-screen");

        showToast(
            "Sesión cerrada.",
            "success"
        );

    } catch (error) {

        console.error(
            "Error inesperado cerrando sesión:",
            error
        );

        hideLoading();

        showToast(
            "Ocurrió un error cerrando la sesión.",
            "error"
        );
    }
}


/* =========================================================
   ELIMINAR CUENTA
   ========================================================= */

async function handleDeleteAccount() {

    if (!supabaseClient || !currentUser) {
        return;
    }

    const firstConfirm =
        window.confirm(
            "¿Seguro que quieres eliminar tu cuenta de Market Flash?"
        );

    if (!firstConfirm) {
        return;
    }

    const secondConfirm =
        window.confirm(
            "Esta acción marcará tu cuenta como eliminada y cerrará tu sesión. ¿Continuar?"
        );

    if (!secondConfirm) {
        return;
    }

    showLoading("Eliminando cuenta...");

    try {

        /*
           Por seguridad, desde el navegador no utilizamos
           la service_role key para borrar directamente
           auth.users.

           Primero marcamos la cuenta como eliminada.
           Más adelante el backend podrá realizar la
           eliminación definitiva de Auth.
        */

        const {
            error
        } = await supabaseClient
            .from("profiles")
            .update({
                status: "deleted",
                deleted_at: new Date().toISOString()
            })
            .eq("id", currentUser.id);

        if (error) {

            console.error(
                "Error eliminando cuenta:",
                error
            );

            hideLoading();

            showToast(
                "No se pudo eliminar la cuenta.",
                "error"
            );

            return;
        }

        await supabaseClient.auth.signOut();

        currentUser = null;
        currentProfile = null;

        clearLocalUser();

        closePanel("profile-panel");
        closePanel("settings-panel");
        closePanel("edit-profile-panel");

        hideLoading();

        showScreen("welcome-screen");

        showToast(
            "Tu cuenta ha sido eliminada.",
            "success"
        );

    } catch (error) {

        console.error(
            "Error inesperado eliminando cuenta:",
            error
        );

        hideLoading();

        showToast(
            "No se pudo completar la eliminación.",
            "error"
        );
    }
}


/* =========================================================
   RECUPERACIÓN DE CONTRASEÑA
   ========================================================= */

async function handleForgotPassword() {

    const cedula =
        normalizeCedula(
            window.prompt(
                "Escribe tu cédula para iniciar la recuperación:"
            )
        );

    if (!cedula) {
        return;
    }

    /*
       Como el acceso se realiza mediante una cédula
       convertida internamente en un identificador de Auth,
       la recuperación definitiva por cédula necesitará
       un flujo seguro de backend/Edge Function.

       No vamos a poner una contraseña maestra ni una
       clave privada en JavaScript.
    */

    showToast(
        "La recuperación segura por cédula se conectará con Supabase en el siguiente bloque.",
        "info"
    );
}


/* =========================================================
   ADMINISTRACIÓN
   ========================================================= */

function openAdministrationFromProfile() {

    if (!currentUser || !currentProfile) {
        showToast(
            "Debes iniciar sesión.",
            "error"
        );
        return;
    }

    const isAdmin =
        currentProfile.role === "admin" ||
        currentProfile.is_admin === true;

    if (!isAdmin) {

        showToast(
            "No tienes permisos de administrador.",
            "error"
        );

        return;
    }

    closePanel("profile-panel");

    /*
       La función completa del panel administrativo
       se añadirá en la parte correspondiente.
    */

    if (typeof openAdministrationPanel === "function") {
        openAdministrationPanel();
    } else {
        showToast(
            "El panel administrativo se conectará en la siguiente parte.",
            "info"
        );
    }
}


/* =========================================================
   EXTENSIONES DE ARCHIVO
   ========================================================= */

function getFileExtension(filename) {

    const cleanName =
        String(filename || "").trim();

    const parts =
        cleanName.split(".");

    if (parts.length < 2) {
        return "jpg";
    }

    return parts
        .pop()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "") || "jpg";
}


/* =========================================================
   LIMPIAR FORMULARIO DE REGISTRO
   ========================================================= */

function clearRegistrationForm() {

    if (registerForm) {
        registerForm.reset();
    }
}


/* =========================================================
   REFRESCO DESPUÉS DEL LOGIN
   ========================================================= */

async function refreshDashboardAfterLogin() {

    /*
       Estas funciones serán creadas en las siguientes partes.
       Comprobamos primero que existan para evitar errores.
    */

    if (typeof loadCategories === "function") {
        await loadCategories();
    }

    if (typeof loadFlashPromotions === "function") {
        await loadFlashPromotions();
    }

    if (typeof loadPublications === "function") {
        await loadPublications();
    }

    if (typeof updateDashboardMetrics === "function") {
        await updateDashboardMetrics();
    }
}/* =========================================================
   MARKET FLASH
   SCRIPT PRINCIPAL
   PARTE 3
   PUBLICACIONES + FOTOS + VIDEO + VISTA PREVIA
   ========================================================= */


/* =========================================================
   REFERENCIAS DE PUBLICACIONES
   ========================================================= */

const publicationPanel = $("publication-panel");
const closePublicationPanel = $("close-publication-panel");

const publicationForm = $("publication-form");

const publicationPhotoPreview = $("publication-photo-preview");
const takePhotoButton = $("take-photo-button");
const choosePhotoButton = $("choose-photo-button");
const publicationImages = $("publication-images");

const publicationVideoPreview = $("publication-video-preview");
const chooseVideoButton = $("choose-video-button");
const publicationVideo = $("publication-video");

const publicationName = $("publication-name");
const publicationCategory = $("publication-category");
const publicationPrice = $("publication-price");
const publicationQuantity = $("publication-quantity");
const publicationDescription = $("publication-description");
const publicationLocation = $("publication-location");
const publicationWhatsapp = $("publication-whatsapp");

const cancelPublicationButton =
    $("cancel-publication-button");


/* =========================================================
   REFERENCIAS DE VISTA PREVIA
   ========================================================= */

const publicationPreviewPanel =
    $("publication-preview-panel");

const closePublicationPreview =
    $("close-publication-preview");

const publicationPreview =
    $("publication-preview");

const editPreviewButton =
    $("edit-preview-button");

const confirmPublicationButton =
    $("confirm-publication-button");


/* =========================================================
   ABRIR CREACIÓN DE PUBLICACIÓN
   ========================================================= */

function openPublicationCreator() {

    if (!currentUser) {

        showToast(
            "Debes iniciar sesión para publicar.",
            "error"
        );

        showScreen("login-screen");

        return;
    }

    resetPublicationCreator();

    openPanel("publication-panel");
}


/* =========================================================
   EVENTOS DE PUBLICACIÓN
   ========================================================= */

function bindPublicationEvents() {

    const createPublicationButton =
        $("create-publication-button");

    const promoteButton =
        $("promote-button");

    if (createPublicationButton) {

        createPublicationButton.addEventListener(
            "click",
            openPublicationCreator
        );
    }

    if (closePublicationPanel) {

        closePublicationPanel.addEventListener(
            "click",
            function () {

                closePanel(
                    "publication-panel"
                );

                resetPublicationCreator();
            }
        );
    }

    if (cancelPublicationButton) {

        cancelPublicationButton.addEventListener(
            "click",
            function () {

                closePanel(
                    "publication-panel"
                );

                resetPublicationCreator();
            }
        );
    }

    if (takePhotoButton) {

        takePhotoButton.addEventListener(
            "click",
            function () {

                if (publicationImages) {
                    publicationImages.setAttribute(
                        "capture",
                        "environment"
                    );

                    publicationImages.click();
                }
            }
        );
    }

    if (choosePhotoButton) {

        choosePhotoButton.addEventListener(
            "click",
            function () {

                if (publicationImages) {
                    publicationImages.removeAttribute(
                        "capture"
                    );

                    publicationImages.click();
                }
            }
        );
    }

    if (publicationImages) {

        publicationImages.addEventListener(
            "change",
            handlePublicationImages
        );
    }

    if (chooseVideoButton) {

        chooseVideoButton.addEventListener(
            "click",
            function () {

                if (publicationVideo) {
                    publicationVideo.click();
                }
            }
        );
    }

    if (publicationVideo) {

        publicationVideo.addEventListener(
            "change",
            handlePublicationVideo
        );
    }

    if (publicationForm) {

        publicationForm.addEventListener(
            "submit",
            handlePublicationFormSubmit
        );
    }

    if (closePublicationPreview) {

        closePublicationPreview.addEventListener(
            "click",
            function () {
                closePanel(
                    "publication-preview-panel"
                );
            }
        );
    }

    if (editPreviewButton) {

        editPreviewButton.addEventListener(
            "click",
            function () {

                closePanel(
                    "publication-preview-panel"
                );

                openPanel(
                    "publication-panel"
                );
            }
        );
    }

    if (confirmPublicationButton) {

        confirmPublicationButton.addEventListener(
            "click",
            publishConfirmedPublication
        );
    }

    if (promoteButton) {

        promoteButton.addEventListener(
            "click",
            function () {

                if (
                    typeof openPromotionPanel ===
                    "function"
                ) {
                    openPromotionPanel();
                } else {

                    showToast(
                        "La promoción Flash se conectará en la siguiente parte.",
                        "info"
                    );
                }
            }
        );
    }
}


/* =========================================================
   FOTOS DE LA PUBLICACIÓN
   ========================================================= */

async function handlePublicationImages(event) {

    const files =
        Array.from(
            event.target.files || []
        );

    if (!files.length) {
        return;
    }

    const validImages = [];

    for (const file of files) {

        if (!file.type.startsWith("image/")) {

            showToast(
                `${file.name} no es una imagen válida.`,
                "error"
            );

            continue;
        }

        if (file.size > 10 * 1024 * 1024) {

            showToast(
                `${file.name} supera el límite de 10 MB.`,
                "error"
            );

            continue;
        }

        validImages.push(file);
    }

    if (!validImages.length) {
        return;
    }


    /*
       Permitimos varias imágenes.
       La primera imagen será la portada.
    */

    selectedPublicationImages = [
        ...selectedPublicationImages,
        ...validImages
    ].slice(0, 10);

    renderPublicationImagePreviews();

    showToast(
        `${selectedPublicationImages.length} foto(s) seleccionada(s).`,
        "success"
    );

    event.target.value = "";
}


/* =========================================================
   PREVISUALIZAR FOTOS
   ========================================================= */

function renderPublicationImagePreviews() {

    if (!publicationPhotoPreview) {
        return;
    }

    publicationPhotoPreview.innerHTML = "";

    if (!selectedPublicationImages.length) {

        publicationPhotoPreview.innerHTML = `
            <div class="media-empty">
                <span>📷</span>
                <p>Aún no has seleccionado fotos</p>
            </div>
        `;

        return;
    }

    selectedPublicationImages.forEach(
        function (file, index) {

            const wrapper =
                document.createElement("div");

            wrapper.className =
                "selected-media-item";

            const image =
                document.createElement("img");

            image.alt =
                `Foto ${index + 1}`;

            image.src =
                URL.createObjectURL(file);

            const number =
                document.createElement("span");

            number.className =
                "media-number";

            number.textContent =
                index + 1;

            const remove =
                document.createElement("button");

            remove.type = "button";
            remove.className =
                "remove-media-button";

            remove.textContent = "×";

            remove.title =
                "Eliminar foto";

            remove.addEventListener(
                "click",
                function () {

                    selectedPublicationImages
                        .splice(index, 1);

                    renderPublicationImagePreviews();
                }
            );

            wrapper.appendChild(image);
            wrapper.appendChild(number);
            wrapper.appendChild(remove);

            publicationPhotoPreview
                .appendChild(wrapper);
        }
    );
}


/* =========================================================
   VIDEO
   ========================================================= */

function handlePublicationVideo(event) {

    const file =
        event.target.files?.[0];

    if (!file) {
        selectedPublicationVideo = null;
        return;
    }

    if (!file.type.startsWith("video/")) {

        showToast(
            "Selecciona un vídeo válido.",
            "error"
        );

        event.target.value = "";
        return;
    }

    /*
       Para evitar archivos enormes desde el teléfono,
       ponemos un límite inicial de 100 MB.
    */

    if (file.size > 100 * 1024 * 1024) {

        showToast(
            "El vídeo no puede superar 100 MB.",
            "error"
        );

        event.target.value = "";
        return;
    }

    selectedPublicationVideo = file;

    renderPublicationVideoPreview();

    showToast(
        "Vídeo seleccionado correctamente.",
        "success"
    );
}


/* =========================================================
   PREVISUALIZAR VIDEO
   ========================================================= */

function renderPublicationVideoPreview() {

    if (!publicationVideoPreview) {
        return;
    }

    publicationVideoPreview.innerHTML = "";

    if (!selectedPublicationVideo) {
        return;
    }

    const wrapper =
        document.createElement("div");

    wrapper.className =
        "selected-video-item";

    const video =
        document.createElement("video");

    video.controls = true;
    video.playsInline = true;

    video.src =
        URL.createObjectURL(
            selectedPublicationVideo
        );

    const remove =
        document.createElement("button");

    remove.type = "button";

    remove.className =
        "remove-media-button";

    remove.textContent = "×";

    remove.title =
        "Eliminar vídeo";

    remove.addEventListener(
        "click",
        function () {

            selectedPublicationVideo = null;

            if (publicationVideo) {
                publicationVideo.value = "";
            }

            renderPublicationVideoPreview();
        }
    );

    wrapper.appendChild(video);
    wrapper.appendChild(remove);

    publicationVideoPreview
        .appendChild(wrapper);
}


/* =========================================================
   VALIDAR PUBLICACIÓN
   ========================================================= */

function validatePublicationForm() {

    const name =
        String(
            publicationName?.value || ""
        ).trim();

    const category =
        String(
            publicationCategory?.value || ""
        ).trim();

    const price =
        Number(
            publicationPrice?.value || 0
        );

    const quantity =
        Number(
            publicationQuantity?.value || 0
        );

    const description =
        String(
            publicationDescription?.value || ""
        ).trim();

    const location =
        String(
            publicationLocation?.value || ""
        ).trim();

    if (!name) {

        showToast(
            "Escribe el nombre del producto.",
            "error"
        );

        publicationName?.focus();

        return false;
    }

    if (!category) {

        showToast(
            "Selecciona una categoría.",
            "error"
        );

        publicationCategory?.focus();

        return false;
    }

    if (
        !Number.isFinite(price) ||
        price < 0
    ) {

        showToast(
            "Escribe un precio válido.",
            "error"
        );

        publicationPrice?.focus();

        return false;
    }

    if (
        !Number.isFinite(quantity) ||
        quantity < 1
    ) {

        showToast(
            "La cantidad debe ser de al menos 1.",
            "error"
        );

        publicationQuantity?.focus();

        return false;
    }

    if (!description) {

        showToast(
            "Escribe una descripción.",
            "error"
        );

        publicationDescription?.focus();

        return false;
    }

    if (!location) {

        showToast(
            "Indica la ubicación del producto.",
            "error"
        );

        publicationLocation?.focus();

        return false;
    }

    /*
       No obligamos a tener foto.
       El usuario puede publicar texto/datos,
       aunque recomendamos añadir imágenes.
    */

    return true;
}


/* =========================================================
   ENVIAR FORMULARIO
   ========================================================= */

function handlePublicationFormSubmit(event) {

    event.preventDefault();

    if (!currentUser) {

        showToast(
            "Debes iniciar sesión.",
            "error"
        );

        return;
    }

    if (!validatePublicationForm()) {
        return;
    }

    buildPublicationPreview();

    closePanel(
        "publication-panel"
    );

    openPanel(
        "publication-preview-panel"
    );
}


/* =========================================================
   CONSTRUIR VISTA PREVIA
   ========================================================= */

function buildPublicationPreview() {

    if (!publicationPreview) {
        return;
    }

    const name =
        String(
            publicationName?.value || ""
        ).trim();

    const category =
        String(
            publicationCategory?.value || ""
        ).trim();

    const price =
        Number(
            publicationPrice?.value || 0
        );

    const quantity =
        Number(
            publicationQuantity?.value || 1
        );

    const description =
        String(
            publicationDescription?.value || ""
        ).trim();

    const location =
        String(
            publicationLocation?.value || ""
        ).trim();

    const whatsappEnabled =
        Boolean(
            publicationWhatsapp?.checked
        );

    let mediaHTML = "";


    /* IMÁGENES */

    if (selectedPublicationImages.length) {

        const imagesHTML =
            selectedPublicationImages
                .map(
                    function (file, index) {

                        return `
                            <div class="preview-image">
                                <img
                                    src="${URL.createObjectURL(file)}"
                                    alt="Imagen ${index + 1}"
                                >
                            </div>
                        `;
                    }
                )
                .join("");

        mediaHTML += `
            <div class="preview-images">
                ${imagesHTML}
            </div>
        `;
    }


    /* VIDEO */

    if (selectedPublicationVideo) {

        mediaHTML += `
            <div class="preview-video">
                <video
                    controls
                    playsinline
                    src="${URL.createObjectURL(
                        selectedPublicationVideo
                    )}">
                </video>
            </div>
        `;
    }


    /* PUBLICACIÓN */

    publicationPreview.innerHTML = `

        <article class="preview-publication-card">

            <div class="preview-media-container">
                ${mediaHTML}
            </div>

            <div class="preview-publication-content">

                <span class="publication-category">
                    ${escapeHTML(category)}
                </span>

                <h2>
                    ${escapeHTML(name)}
                </h2>

                <div class="preview-price">
                    ${formatMoney(price)}
                </div>

                <div class="preview-quantity">
                    Cantidad disponible:
                    <strong>
                        ${quantity}
                    </strong>
                </div>

                <p class="preview-description">
                    ${escapeHTML(description)}
                </p>

                <div class="preview-location">
                    📍 ${escapeHTML(location)}
                </div>

                ${
                    whatsappEnabled
                    ? `
                        <div class="preview-whatsapp">
                            <span>🟢</span>
                            WhatsApp activado
                        </div>
                    `
                    : `
                        <div class="preview-whatsapp disabled">
                            WhatsApp desactivado
                        </div>
                    `
                }

            </div>

        </article>
    `;
}


/* =========================================================
   PUBLICAR DESPUÉS DE CONFIRMAR
   ========================================================= */

async function publishConfirmedPublication() {

    if (!currentUser) {

        showToast(
            "Tu sesión expiró. Inicia sesión nuevamente.",
            "error"
        );

        closePanel(
            "publication-preview-panel"
        );

        showScreen("login-screen");

        return;
    }

    if (!validatePublicationForm()) {

        closePanel(
            "publication-preview-panel"
        );

        openPanel(
            "publication-panel"
        );

        return;
    }

    showLoading(
        "Publicando tu producto..."
    );

    try {

        /*
           1. Creamos primero la publicación.
        */

        const publicationPayload = {
            seller_id: currentUser.id,
            title:
                String(
                    publicationName?.value || ""
                ).trim(),
            category:
                String(
                    publicationCategory?.value || ""
                ).trim(),
            price:
                Number(
                    publicationPrice?.value || 0
                ),
            quantity:
                Number(
                    publicationQuantity?.value || 1
                ),
            description:
                String(
                    publicationDescription?.value || ""
                ).trim(),
            location:
                String(
                    publicationLocation?.value || ""
                ).trim(),
            whatsapp_enabled:
                Boolean(
                    publicationWhatsapp?.checked
                ),
            status: "published",
            views_count: 0,
            likes_count: 0,
            saves_count: 0
        };

        const {
            data: publication,
            error: publicationError
        } = await supabaseClient
            .from("publications")
            .insert(publicationPayload)
            .select()
            .single();

        if (publicationError) {

            console.error(
                "Error creando publicación:",
                publicationError
            );

            hideLoading();

            showToast(
                publicationError.message ||
                "No se pudo crear la publicación.",
                "error"
            );

            return;
        }


        /*
           2. Subimos las imágenes.
        */

        if (
            selectedPublicationImages.length
        ) {

            await uploadPublicationImages(
                publication.id
            );
        }


        /*
           3. Subimos el vídeo si existe.
        */

        if (selectedPublicationVideo) {

            await uploadPublicationVideo(
                publication.id
            );
        }


        /*
           4. Limpiamos y cerramos.
        */

        closePanel(
            "publication-preview-panel"
        );

        resetPublicationCreator();

        hideLoading();

        showToast(
            "🎉 ¡Tu publicación fue publicada correctamente!",
            "success"
        );


        /*
           Actualizamos inmediatamente el listado
           si la función ya existe.
        */

        if (
            typeof loadPublications ===
            "function"
        ) {
            await loadPublications();
        }

        if (
            typeof updateDashboardMetrics ===
            "function"
        ) {
            await updateDashboardMetrics();
        }

    } catch (error) {

        console.error(
            "Error publicando producto:",
            error
        );

        hideLoading();

        showToast(
            "Ocurrió un error al publicar.",
            "error"
        );
    }
}


/* =========================================================
   SUBIR IMÁGENES
   ========================================================= */

async function uploadPublicationImages(
    publicationId
) {

    if (
        !supabaseClient ||
        !currentUser ||
        !publicationId
    ) {
        return;
    }

    for (
        let index = 0;
        index < selectedPublicationImages.length;
        index++
    ) {

        const file =
            selectedPublicationImages[index];

        const extension =
            getFileExtension(file.name);

        const filePath =
            `${currentUser.id}/${publicationId}/image-${Date.now()}-${index}.${extension}`;


        const {
            error: uploadError
        } = await supabaseClient
            .storage
            .from("publication-media")
            .upload(
                filePath,
                file,
                {
                    upsert: false,
                    contentType: file.type
                }
            );

        if (uploadError) {

            console.error(
                "Error subiendo imagen:",
                uploadError
            );

            continue;
        }


        const {
            data: publicUrlData
        } = supabaseClient
            .storage
            .from("publication-media")
            .getPublicUrl(filePath);

        const publicUrl =
            publicUrlData?.publicUrl || "";


        /*
           Guardamos cada archivo en la tabla
           publication_media.
        */

        const {
            error: mediaError
        } = await supabaseClient
            .from("publication_media")
            .insert({
                publication_id:
                    publicationId,
                media_type: "image",
                storage_path:
                    filePath,
                public_url:
                    publicUrl,
                sort_order:
                    index
            });

        if (mediaError) {

            console.error(
                "Error guardando imagen:",
                mediaError
            );
        }
    }
}


/* =========================================================
   SUBIR VIDEO
   ========================================================= */

async function uploadPublicationVideo(
    publicationId
) {

    if (
        !supabaseClient ||
        !currentUser ||
        !publicationId ||
        !selectedPublicationVideo
    ) {
        return;
    }

    const file =
        selectedPublicationVideo;

    const extension =
        getFileExtension(file.name);

    const filePath =
        `${currentUser.id}/${publicationId}/video-${Date.now()}.${extension}`;


    const {
        error: uploadError
    } = await supabaseClient
        .storage
        .from("publication-media")
        .upload(
            filePath,
            file,
            {
                upsert: false,
                contentType: file.type
            }
        );

    if (uploadError) {

        console.error(
            "Error subiendo vídeo:",
            uploadError
        );

        showToast(
            "La publicación se creó, pero el vídeo no pudo subirse.",
            "error"
        );

        return;
    }


    const {
        data: publicUrlData
    } = supabaseClient
        .storage
        .from("publication-media")
        .getPublicUrl(filePath);

    const publicUrl =
        publicUrlData?.publicUrl || "";


    const {
        error: mediaError
    } = await supabaseClient
        .from("publication_media")
        .insert({
            publication_id:
                publicationId,
            media_type: "video",
            storage_path:
                filePath,
            public_url:
                publicUrl,
            sort_order: 0
        });

    if (mediaError) {

        console.error(
            "Error guardando vídeo:",
            mediaError
        );
    }
}


/* =========================================================
   REINICIAR CREADOR
   ========================================================= */

function resetPublicationCreator() {

    selectedPublicationImages = [];
    selectedPublicationVideo = null;

    if (publicationForm) {
        publicationForm.reset();
    }

    if (publicationPhotoPreview) {

        publicationPhotoPreview.innerHTML = `
            <div class="media-empty">
                <span>📷</span>
                <p>Aún no has seleccionado fotos</p>
            </div>
        `;
    }

    if (publicationVideoPreview) {
        publicationVideoPreview.innerHTML = "";
    }

    if (publicationImages) {
        publicationImages.value = "";
    }

    if (publicationVideo) {
        publicationVideo.value = "";
    }
}


/* =========================================================
   INICIALIZAR EVENTOS DE PUBLICACIONES
   ========================================================= */

bindPublicationEvents();
/* =========================================================
   MARKET FLASH
   SCRIPT PRINCIPAL
   PARTE 4
   LISTADO + BÚSQUEDA + CATEGORÍAS + DETALLE + MÉTRICAS
   ========================================================= */


/* =========================================================
   REFERENCIAS DEL DASHBOARD
   ========================================================= */

const marketSearch = $("market-search");
const categoriesList = $("categories-list");

const flashDelDia = $("flash-del-dia");
const flashPromotionsList = $("flash-promotions-list");

const normalPublications = $("normal-publications");
const publicationsList = $("publications-list");


/* =========================================================
   REFERENCIAS DEL DETALLE
   ========================================================= */

const publicationDetailPanel =
    $("publication-detail-panel");

const closePublicationDetail =
    $("close-publication-detail");

const publicationDetailMedia =
    $("publication-detail-media");

const publicationDetailInfo =
    $("publication-detail-info");

const detailViewCount =
    $("detail-view-count");

const detailLikeCount =
    $("detail-like-count");

const detailSaveCount =
    $("detail-save-count");

const publicationLikeButton =
    $("publication-like-button");

const publicationSaveButton =
    $("publication-save-button");

const publicationChatButton =
    $("publication-chat-button");

const publicationWhatsappButton =
    $("publication-whatsapp-button");


/* =========================================================
   EVENTOS DEL DASHBOARD
   ========================================================= */

function bindDashboardEvents() {

    if (marketSearch) {

        marketSearch.addEventListener(
            "input",
            function () {

                currentSearch =
                    String(
                        marketSearch.value || ""
                    )
                    .trim()
                    .toLowerCase();

                loadPublications();
            }
        );
    }

    if (categoriesList) {

        categoriesList.addEventListener(
            "click",
            function (event) {

                const button =
                    event.target.closest(
                        "[data-category]"
                    );

                if (!button) {
                    return;
                }

                currentCategory =
                    button.dataset.category ||
                    "todos";

                document
                    .querySelectorAll(
                        "[data-category]"
                    )
                    .forEach(
                        function (item) {
                            item.classList.toggle(
                                "active",
                                item === button
                            );
                        }
                    );

                loadPublications();
            }
        );
    }

    if (closePublicationDetail) {

        closePublicationDetail.addEventListener(
            "click",
            function () {
                closePanel(
                    "publication-detail-panel"
                );

                currentPublication = null;
            }
        );
    }

    if (publicationLikeButton) {

        publicationLikeButton.addEventListener(
            "click",
            handlePublicationLike
        );
    }

    if (publicationSaveButton) {

        publicationSaveButton.addEventListener(
            "click",
            handlePublicationSave
        );
    }

    if (publicationChatButton) {

        publicationChatButton.addEventListener(
            "click",
            handlePublicationChat
        );
    }

    if (publicationWhatsappButton) {

        publicationWhatsappButton.addEventListener(
            "click",
            handlePublicationWhatsApp
        );
    }
}


/* =========================================================
   CATEGORÍAS
   ========================================================= */

async function loadCategories() {

    /*
       Las categorías principales ya vienen preparadas
       en index.html.

       Aquí dejamos preparada la conexión para que,
       posteriormente, también puedan administrarse
       desde Supabase.
    */

    if (!categoriesList) {
        return;
    }

    const existingButtons =
        categoriesList.querySelectorAll(
            "[data-category]"
        );

    if (!existingButtons.length) {
        return;
    }

    existingButtons.forEach(
        function (button) {

            button.classList.toggle(
                "active",
                button.dataset.category ===
                currentCategory
            );
        }
    );
}


/* =========================================================
   CARGAR PUBLICACIONES
   ========================================================= */

async function loadPublications() {

    if (!supabaseClient) {
        return;
    }

    if (!publicationsList) {
        return;
    }

    try {

        let queryBuilder =
            supabaseClient
                .from("publications")
                .select(`
                    *,
                    profiles:seller_id (
                        id,
                        full_name,
                        phone,
                        avatar_url
                    ),
                    publication_media (
                        id,
                        media_type,
                        storage_path,
                        public_url,
                        sort_order
                    )
                `)
                .eq(
                    "status",
                    "published"
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );


        /*
           Filtrar por categoría.
        */

        if (
            currentCategory &&
            currentCategory !== "todos"
        ) {

            queryBuilder =
                queryBuilder.eq(
                    "category",
                    currentCategory
                );
        }


        /*
           Obtenemos las publicaciones.
        */

        const {
            data,
            error
        } = await queryBuilder;

        if (error) {

            console.error(
                "Error cargando publicaciones:",
                error
            );

            renderEmptyPublications(
                "No se pudieron cargar las publicaciones."
            );

            return;
        }

        let publications =
            Array.isArray(data)
                ? data
                : [];


        /*
           Filtro de búsqueda local.
        */

        if (currentSearch) {

            publications =
                publications.filter(
                    function (publication) {

                        const text = [
                            publication.title,
                            publication.category,
                            publication.description,
                            publication.location
                        ]
                        .join(" ")
                        .toLowerCase();

                        return text.includes(
                            currentSearch
                        );
                    }
                );
        }


        /*
           Renderizamos.
        */

        renderPublications(
            publications
        );

    } catch (error) {

        console.error(
            "Error inesperado cargando publicaciones:",
            error
        );

        renderEmptyPublications(
            "No se pudieron cargar los productos."
        );
    }
}


/* =========================================================
   RENDERIZAR PUBLICACIONES
   ========================================================= */

function renderPublications(
    publications
) {

    if (!publicationsList) {
        return;
    }

    publicationsList.innerHTML = "";

    if (!publications.length) {

        renderEmptyPublications(
            currentSearch
                ? "No encontramos productos con esa búsqueda."
                : "Todavía no hay publicaciones."
        );

        return;
    }

    publications.forEach(
        function (publication) {

            const card =
                createPublicationCard(
                    publication
                );

            publicationsList.appendChild(
                card
            );
        }
    );
}


/* =========================================================
   TARJETA DE PUBLICACIÓN
   ========================================================= */

function createPublicationCard(
    publication
) {

    const article =
        document.createElement("article");

    article.className =
        "publication-card";

    article.dataset.publicationId =
        publication.id;


    /*
       Ordenamos los archivos.
    */

    const media =
        Array.isArray(
            publication.publication_media
        )
            ? [...publication.publication_media]
                .sort(
                    function (a, b) {
                        return (
                            Number(
                                a.sort_order || 0
                            ) -
                            Number(
                                b.sort_order || 0
                            )
                        );
                    }
                )
            : [];


    const firstImage =
        media.find(
            function (item) {
                return item.media_type === "image";
            }
        );

    const firstVideo =
        media.find(
            function (item) {
                return item.media_type === "video";
            }
        );


    let mediaHTML = "";


    if (firstImage?.public_url) {

        mediaHTML = `
            <img
                class="publication-card-image"
                src="${escapeHTML(
                    firstImage.public_url
                )}"
                alt="${escapeHTML(
                    publication.title || "Producto"
                )}"
                loading="lazy"
            >
        `;

    } else if (firstVideo?.public_url) {

        mediaHTML = `
            <video
                class="publication-card-image"
                muted
                playsinline
                preload="metadata"
                src="${escapeHTML(
                    firstVideo.public_url
                )}">
            </video>
        `;

    } else {

        mediaHTML = `
            <img
                class="publication-card-image"
                src="${defaultProductImage()}"
                alt="Producto Market Flash"
                loading="lazy"
            >
        `;
    }


    const sellerName =
        publication.profiles?.full_name ||
        "Vendedor Market Flash";


    article.innerHTML = `

        <div class="publication-card-media">
            ${mediaHTML}

            ${
                media.length > 1
                    ? `
                        <span class="media-count-badge">
                            📷 ${media.length}
                        </span>
                    `
                    : ""
            }
        </div>

        <div class="publication-card-body">

            <span class="publication-category">
                ${escapeHTML(
                    publication.category || "General"
                )}
            </span>

            <h3>
                ${escapeHTML(
                    publication.title || "Producto"
                )}
            </h3>

            <strong class="publication-price">
                ${formatMoney(
                    publication.price || 0
                )}
            </strong>

            <p class="publication-location">
                📍 ${escapeHTML(
                    publication.location || "Sin ubicación"
                )}
            </p>

            <div class="publication-card-metrics">

                <span>
                    👁️
                    ${Number(
                        publication.views_count || 0
                    )}
                </span>

                <span>
                    ❤️
                    ${Number(
                        publication.likes_count || 0
                    )}
                </span>

                <span>
                    🔖
                    ${Number(
                        publication.saves_count || 0
                    )}
                </span>

            </div>

            <div class="publication-seller">
                ${escapeHTML(
                    sellerName
                )}
            </div>

        </div>
    `;


    article.addEventListener(
        "click",
        function () {
            openPublicationDetail(
                publication.id
            );
        }
    );


    return article;
}


/* =========================================================
   PUBLICACIONES VACÍAS
   ========================================================= */

function renderEmptyPublications(
    message
) {

    if (!publicationsList) {
        return;
    }

    publicationsList.innerHTML = `

        <div class="empty-state">

            <div class="empty-state-icon">
                🔎
            </div>

            <h3>
                Market Flash
            </h3>

            <p>
                ${escapeHTML(message)}
            </p>

        </div>
    `;
}


/* =========================================================
   ABRIR DETALLE
   ========================================================= */

async function openPublicationDetail(
    publicationId
) {

    if (!publicationId) {
        return;
    }

    showLoading(
        "Cargando publicación..."
    );

    try {

        const {
            data: publication,
            error
        } = await supabaseClient
            .from("publications")
            .select(`
                *,
                profiles:seller_id (
                    id,
                    full_name,
                    phone,
                    avatar_url
                ),
                publication_media (
                    id,
                    media_type,
                    storage_path,
                    public_url,
                    sort_order
                )
            `)
            .eq(
                "id",
                publicationId
            )
            .maybeSingle();

        if (error) {

            console.error(
                "Error cargando detalle:",
                error
            );

            hideLoading();

            showToast(
                "No se pudo abrir la publicación.",
                "error"
            );

            return;
        }

        if (!publication) {

            hideLoading();

            showToast(
                "La publicación ya no está disponible.",
                "error"
            );

            return;
        }

        currentPublication =
            publication;


        /*
           Registrar visita.
        */

        await registerPublicationView(
            publication
        );


        renderPublicationDetail(
            publication
        );

        closePanel(
            "publication-panel"
        );

        closePanel(
            "publication-preview-panel"
        );

        openPanel(
            "publication-detail-panel"
        );

        hideLoading();

    } catch (error) {

        console.error(
            "Error inesperado abriendo publicación:",
            error
        );

        hideLoading();

        showToast(
            "No se pudo abrir la publicación.",
            "error"
        );
    }
}


/* =========================================================
   RENDERIZAR DETALLE
   ========================================================= */

function renderPublicationDetail(
    publication
) {

    renderPublicationDetailMedia(
        publication
    );

    renderPublicationDetailInfo(
        publication
    );

    if (detailViewCount) {
        detailViewCount.textContent =
            Number(
                publication.views_count || 0
            );
    }

    if (detailLikeCount) {
        detailLikeCount.textContent =
            Number(
                publication.likes_count || 0
            );
    }

    if (detailSaveCount) {
        detailSaveCount.textContent =
            Number(
                publication.saves_count || 0
            );
    }


    /*
       WhatsApp solo aparece si el vendedor
       activó el botón en esa publicación.
    */

    if (publicationWhatsappButton) {

        publicationWhatsappButton.hidden =
            !publication.whatsapp_enabled;
    }


    updateLikeSaveButtonState();
}


/* =========================================================
   MEDIA DEL DETALLE
   ========================================================= */

function renderPublicationDetailMedia(
    publication
) {

    if (!publicationDetailMedia) {
        return;
    }

    const media =
        Array.isArray(
            publication.publication_media
        )
            ? [...publication.publication_media]
                .sort(
                    function (a, b) {
                        return (
                            Number(
                                a.sort_order || 0
                            ) -
                            Number(
                                b.sort_order || 0
                            )
                        );
                    }
                )
            : [];

    publicationDetailMedia.innerHTML = "";


    if (!media.length) {

        publicationDetailMedia.innerHTML = `
            <img
                src="${defaultProductImage()}"
                alt="Producto Market Flash"
            >
        `;

        return;
    }


    media.forEach(
        function (item) {

            if (!item.public_url) {
                return;
            }

            if (item.media_type === "video") {

                const video =
                    document.createElement("video");

                video.src =
                    item.public_url;

                video.controls = true;
                video.playsInline = true;

                video.className =
                    "detail-media-video";

                publicationDetailMedia
                    .appendChild(video);

                return;
            }


            const image =
                document.createElement("img");

            image.src =
                item.public_url;

            image.alt =
                publication.title ||
                "Producto";

            image.loading =
                "lazy";

            image.className =
                "detail-media-image";

            publicationDetailMedia
                .appendChild(image);
        }
    );
}


/* =========================================================
   INFORMACIÓN DEL DETALLE
   ========================================================= */

function renderPublicationDetailInfo(
    publication
) {

    if (!publicationDetailInfo) {
        return;
    }

    const seller =
        publication.profiles || {};

    const whatsapp =
        normalizePhone(
            seller.phone || ""
        );


    publicationDetailInfo.innerHTML = `

        <div class="detail-category">
            ${escapeHTML(
                publication.category || "General"
            )}
        </div>

        <h1>
            ${escapeHTML(
                publication.title || "Producto"
            )}
        </h1>

        <div class="detail-price">
            ${formatMoney(
                publication.price || 0
            )}
        </div>

        <div class="detail-quantity">
            📦 Cantidad:
            <strong>
                ${Number(
                    publication.quantity || 0
                )}
            </strong>
        </div>

        <div class="detail-description">
            <h3>
                Descripción
            </h3>

            <p>
                ${escapeHTML(
                    publication.description || ""
                )}
            </p>
        </div>

        <div class="detail-location">
            📍 ${escapeHTML(
                publication.location || "Sin ubicación"
            )}
        </div>

        <div class="detail-seller">

            <div class="detail-seller-photo">

                <img
                    src="${
                        seller.avatar_url ||
                        defaultProductImage()
                    }"
                    alt="Vendedor"
                >

            </div>

            <div>

                <span>
                    Publicado por
                </span>

                <strong>
                    ${escapeHTML(
                        seller.full_name ||
                        "Vendedor"
                    )}
                </strong>

            </div>

        </div>

        ${
            publication.whatsapp_enabled &&
            whatsapp
                ? `
                    <div class="detail-whatsapp-status">
                        🟢 El vendedor permite contacto por WhatsApp.
                    </div>
                `
                : ""
        }

    `;
}


/* =========================================================
   REGISTRAR VISITA
   ========================================================= */

async function registerPublicationView(
    publication
) {

    if (!supabaseClient || !publication) {
        return;
    }

    /*
       No contamos nuestra propia visita si somos
       el propietario de la publicación.
    */

    if (
        currentUser &&
        publication.seller_id === currentUser.id
    ) {
        return;
    }

    try {

        /*
           Primero intentamos guardar una visita individual.
           La tabla publication_views permitirá evitar
           duplicados posteriormente mediante una restricción
           única por usuario/publicación.
        */

        if (currentUser) {

            const {
                error: viewError
            } = await supabaseClient
                .from("publication_views")
                .insert({
                    publication_id:
                        publication.id,
                    user_id:
                        currentUser.id
                });

            /*
               Si ya existía la visita, no debemos mostrar
               un error al usuario.
            */

            if (
                viewError &&
                viewError.code !== "23505"
            ) {

                console.warn(
                    "No se pudo registrar la visita:",
                    viewError
                );
            }
        }


        /*
           Actualizamos el contador.
        */

        const newCount =
            Number(
                publication.views_count || 0
            ) + 1;

        const {
            error: updateError
        } = await supabaseClient
            .from("publications")
            .update({
                views_count:
                    newCount
            })
            .eq(
                "id",
                publication.id
            );

        if (!updateError) {

            publication.views_count =
                newCount;

            if (detailViewCount) {
                detailViewCount.textContent =
                    newCount;
            }
        }

    } catch (error) {

        console.warn(
            "Error registrando visita:",
            error
        );
    }
}


/* =========================================================
   LIKE
   ========================================================= */

async function handlePublicationLike() {

    if (!currentUser) {

        showToast(
            "Inicia sesión para dar Me gusta.",
            "error"
        );

        return;
    }

    if (!currentPublication) {
        return;
    }

    try {

        const {
            data: existingLike,
            error: checkError
        } = await supabaseClient
            .from("publication_likes")
            .select("id")
            .eq(
                "publication_id",
                currentPublication.id
            )
            .eq(
                "user_id",
                currentUser.id
            )
            .maybeSingle();

        if (
            checkError &&
            checkError.code !== "PGRST116"
        ) {
            throw checkError;
        }


        if (existingLike) {

            await supabaseClient
                .from("publication_likes")
                .delete()
                .eq(
                    "id",
                    existingLike.id
                );

            currentPublication.likes_count =
                Math.max(
                    0,
                    Number(
                        currentPublication.likes_count || 0
                    ) - 1
                );

        } else {

            const {
                error
            } = await supabaseClient
                .from("publication_likes")
                .insert({
                    publication_id:
                        currentPublication.id,
                    user_id:
                        currentUser.id
                });

            if (error) {
                throw error;
            }

            currentPublication.likes_count =
                Number(
                    currentPublication.likes_count || 0
                ) + 1;
        }


        await supabaseClient
            .from("publications")
            .update({
                likes_count:
                    currentPublication.likes_count
            })
            .eq(
                "id",
                currentPublication.id
            );


        if (detailLikeCount) {
            detailLikeCount.textContent =
                currentPublication.likes_count;
        }

        updateLikeSaveButtonState();

    } catch (error) {

        console.error(
            "Error con Me gusta:",
            error
        );

        showToast(
            "No se pudo actualizar el Me gusta.",
            "error"
        );
    }
}


/* =========================================================
   GUARDAR PUBLICACIÓN
   ========================================================= */

async function handlePublicationSave() {

    if (!currentUser) {

        showToast(
            "Inicia sesión para guardar publicaciones.",
            "error"
        );

        return;
    }

    if (!currentPublication) {
        return;
    }

    try {

        const {
            data: existingSave,
            error: checkError
        } = await supabaseClient
            .from("publication_saves")
            .select("id")
            .eq(
                "publication_id",
                currentPublication.id
            )
            .eq(
                "user_id",
                currentUser.id
            )
            .maybeSingle();

        if (
            checkError &&
            checkError.code !== "PGRST116"
        ) {
            throw checkError;
        }


        if (existingSave) {

            await supabaseClient
                .from("publication_saves")
                .delete()
                .eq(
                    "id",
                    existingSave.id
                );

            currentPublication.saves_count =
                Math.max(
                    0,
                    Number(
                        currentPublication.saves_count || 0
                    ) - 1
                );

        } else {

            const {
                error
            } = await supabaseClient
                .from("publication_saves")
                .insert({
                    publication_id:
                        currentPublication.id,
                    user_id:
                        currentUser.id
                });

            if (error) {
                throw error;
            }

            currentPublication.saves_count =
                Number(
                    currentPublication.saves_count || 0
                ) + 1;
        }


        await supabaseClient
            .from("publications")
            .update({
                saves_count:
                    currentPublication.saves_count
            })
            .eq(
                "id",
                currentPublication.id
            );


        if (detailSaveCount) {
            detailSaveCount.textContent =
                currentPublication.saves_count;
        }

        updateLikeSaveButtonState();

    } catch (error) {

        console.error(
            "Error guardando publicación:",
            error
        );

        showToast(
            "No se pudo actualizar Guardados.",
            "error"
        );
    }
}


/* =========================================================
   ESTADO DE LIKE / GUARDADO
   ========================================================= */

async function updateLikeSaveButtonState() {

    if (
        !currentUser ||
        !currentPublication
    ) {
        return;
    }

    try {

        const [
            likeResult,
            saveResult
        ] = await Promise.all([

            supabaseClient
                .from("publication_likes")
                .select("id")
                .eq(
                    "publication_id",
                    currentPublication.id
                )
                .eq(
                    "user_id",
                    currentUser.id
                )
                .maybeSingle(),

            supabaseClient
                .from("publication_saves")
                .select("id")
                .eq(
                    "publication_id",
                    currentPublication.id
                )
                .eq(
                    "user_id",
                    currentUser.id
                )
                .maybeSingle()
        ]);


        if (publicationLikeButton) {

            publicationLikeButton.classList.toggle(
                "active",
                Boolean(
                    likeResult.data
                )
            );
        }

        if (publicationSaveButton) {

            publicationSaveButton.classList.toggle(
                "active",
                Boolean(
                    saveResult.data
                )
            );
        }

    } catch (error) {

        console.warn(
            "No se pudo consultar el estado de interacción:",
            error
        );
    }
}


/* =========================================================
   WHATSAPP
   ========================================================= */

function handlePublicationWhatsApp() {

    if (!currentPublication) {
        return;
    }

    if (
        !currentPublication.whatsapp_enabled
    ) {

        showToast(
            "El vendedor no activó WhatsApp para esta publicación.",
            "info"
        );

        return;
    }

    const sellerPhone =
        normalizePhone(
            currentPublication
                .profiles
                ?.phone || ""
        );

    if (!sellerPhone) {

        showToast(
            "El vendedor no tiene un número de WhatsApp disponible.",
            "error"
        );

        return;
    }

    const message =
        `Hola, vi tu publicación "${currentPublication.title}" en Market Flash y estoy interesado/a.`;

    openWhatsApp(
        sellerPhone,
        message
    );
}


/* =========================================================
   CHAT
   ========================================================= */

async function handlePublicationChat() {

    if (!currentUser) {

        showToast(
            "Inicia sesión para contactar al vendedor.",
            "error"
        );

        return;
    }

    if (!currentPublication) {
        return;
    }

    if (
        currentPublication.seller_id ===
        currentUser.id
    ) {

        showToast(
            "Esta es tu propia publicación.",
            "info"
        );

        return;
    }


    if (
        typeof openChatWithUser ===
        "function"
    ) {

        await openChatWithUser(
            currentPublication.seller_id,
            currentPublication
        );

        return;
    }


    showToast(
        "El chat se conectará en la siguiente parte.",
        "info"
    );
}


/* =========================================================
   FLASH DEL DÍA
   ========================================================= */

async function loadFlashPromotions() {

    if (!supabaseClient) {
        return;
    }

    if (!flashPromotionsList) {
        return;
    }

    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("flash_promotions")
            .select(`
                *,
                publications (
                    id,
                    title,
                    price,
                    category,
                    location,
                    publication_media (
                        id,
                        media_type,
                        public_url,
                        sort_order
                    )
                )
            `)
            .eq(
                "status",
                "active"
            )
            .lte(
                "starts_at",
                new Date().toISOString()
            )
            .gte(
                "ends_at",
                new Date().toISOString()
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );

        if (error) {

            console.error(
                "Error cargando Flash del Día:",
                error
            );

            renderEmptyFlash();

            return;
        }

        renderFlashPromotions(
            data || []
        );

    } catch (error) {

        console.error(
            "Error inesperado cargando Flash:",
            error
        );

        renderEmptyFlash();
    }
}


/* =========================================================
   RENDER FLASH
   ========================================================= */

function renderFlashPromotions(
    promotions
) {

    if (!flashPromotionsList) {
        return;
    }

    flashPromotionsList.innerHTML = "";

    if (!promotions.length) {

        renderEmptyFlash();

        return;
    }

    promotions.forEach(
        function (promotion) {

            const card =
                document.createElement("article");

            card.className =
                "flash-promotion-card";

            const publication =
                promotion.publications || {};

            const media =
                Array.isArray(
                    publication.publication_media
                )
                    ? [...publication.publication_media]
                        .sort(
                            function (a, b) {
                                return (
                                    Number(
                                        a.sort_order || 0
                                    ) -
                                    Number(
                                        b.sort_order || 0
                                    )
                                );
                            }
                        )
                    : [];

            const image =
                media.find(
                    function (item) {
                        return (
                            item.media_type ===
                            "image"
                        );
                    }
                );


            card.innerHTML = `

                <div class="flash-card-image">

                    <img
                        src="${
                            image?.public_url ||
                            defaultProductImage()
                        }"
                        alt="${escapeHTML(
                            publication.title ||
                            promotion.title ||
                            "Flash del Día"
                        )}"
                        loading="lazy"
                    >

                    <span class="flash-badge">
                        ⚡ FLASH
                    </span>

                </div>

                <div class="flash-card-content">

                    <h3>
                        ${escapeHTML(
                            publication.title ||
                            promotion.title ||
                            "Promoción"
                        )}
                    </h3>

                    <strong>
                        ${formatMoney(
                            publication.price ||
                            0
                        )}
                    </strong>

                    <p>
                        ${escapeHTML(
                            promotion.description ||
                            ""
                        )}
                    </p>

                </div>
            `;


            if (publication.id) {

                card.addEventListener(
                    "click",
                    function () {
                        openPublicationDetail(
                            publication.id
                        );
                    }
                );
            }

            flashPromotionsList
                .appendChild(card);
        }
    );
}


/* =========================================================
   FLASH VACÍO
   ========================================================= */

function renderEmptyFlash() {

    if (!flashPromotionsList) {
        return;
    }

    flashPromotionsList.innerHTML = `

        <div class="empty-state flash-empty">

            <div class="empty-state-icon">
                ⚡
            </div>

            <h3>
                Flash del Día
            </h3>

            <p>
                Aquí aparecerán las publicaciones promocionadas.
            </p>

        </div>
    `;
}


/* =========================================================
   MÉTRICAS DEL DASHBOARD
   ========================================================= */

async function updateDashboardMetrics() {

    /*
       Las estadísticas completas del usuario se calcularán
       directamente desde Supabase cuando estén creadas
       todas las tablas de métricas.
    */

    if (
        !supabaseClient ||
        !currentUser ||
        !currentProfile
    ) {
        return;
    }

    try {

        const {
            count: publicationsCount,
            error: publicationsError
        } = await supabaseClient
            .from("publications")
            .select(
                "id",
                {
                    count: "exact",
                    head: true
                }
            )
            .eq(
                "seller_id",
                currentUser.id
            )
            .neq(
                "status",
                "deleted"
            );

        if (!publicationsError) {

            currentProfile.publications_count =
                publicationsCount || 0;
        }


        const {
            data: publicationIds
        } = await supabaseClient
            .from("publications")
            .select("id")
            .eq(
                "seller_id",
                currentUser.id
            );


        const ids =
            (publicationIds || [])
                .map(
                    function (item) {
                        return item.id;
                    }
                );


        if (ids.length) {

            const [
                likesResult,
                savesResult
            ] = await Promise.all([

                supabaseClient
                    .from("publication_likes")
                    .select(
                        "id",
                        {
                            count: "exact",
                            head: true
                        }
                    )
                    .in(
                        "publication_id",
                        ids
                    ),

                supabaseClient
                    .from("publication_saves")
                    .select(
                        "id",
                        {
                            count: "exact",
                            head: true
                        }
                    )
                    .in(
                        "publication_id",
                        ids
                    )
            ]);


            currentProfile.likes_received =
                likesResult.count || 0;

            currentProfile.saves_received =
                savesResult.count || 0;
        }

        renderProfile();

    } catch (error) {

        console.warn(
            "No se pudieron actualizar las métricas:",
            error
        );
    }
}


/* =========================================================
   INICIALIZAR DASHBOARD
   ========================================================= */

bindDashboardEvents();


/*
   Añadimos también los eventos de publicación
   nuevamente de forma segura por si esta parte se
   carga después de la Parte 3.
*/

if (
    typeof loadPublications ===
    "function"
) {
    console.log(
        "Módulo de publicaciones cargado."
    );
}/* =========================================================
   MARKET FLASH
   SCRIPT PRINCIPAL
   PARTE 5
   CHAT INTERNO + CONVERSACIONES + MENSAJES
   ========================================================= */


/* =========================================================
   REFERENCIAS DEL CHAT
   ========================================================= */

const chatPanel = $("chat-panel");
const closeChatPanel = $("close-chat-panel");

const chatMessages = $("chat-messages");
const chatInput = $("chat-input");
const chatSendButton = $("chat-send-button");
const chatWhatsappButton = $("chat-whatsapp-button");


/* =========================================================
   ESTADO DEL CHAT
   ========================================================= */

let chatSubscription = null;
let chatMessagesSubscription = null;


/* =========================================================
   EVENTOS DEL CHAT
   ========================================================= */

function bindChatEvents() {

    if (closeChatPanel) {

        closeChatPanel.addEventListener(
            "click",
            closeCurrentChat
        );
    }

    if (chatSendButton) {

        chatSendButton.addEventListener(
            "click",
            sendChatMessage
        );
    }

    if (chatInput) {

        chatInput.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Enter" &&
                    !event.shiftKey
                ) {

                    event.preventDefault();

                    sendChatMessage();
                }
            }
        );
    }

    if (chatWhatsappButton) {

        chatWhatsappButton.addEventListener(
            "click",
            continueChatOnWhatsApp
        );
    }
}


/* =========================================================
   ABRIR CHAT CON UN USUARIO
   ========================================================= */

async function openChatWithUser(
    sellerId,
    publication = null
) {

    if (!currentUser) {

        showToast(
            "Debes iniciar sesión para utilizar el chat.",
            "error"
        );

        return;
    }

    if (!sellerId) {

        showToast(
            "No se encontró el vendedor.",
            "error"
        );

        return;
    }

    if (
        sellerId ===
        currentUser.id
    ) {

        showToast(
            "No puedes abrir un chat contigo mismo.",
            "info"
        );

        return;
    }

    showLoading(
        "Abriendo chat..."
    );

    try {

        /*
           Buscamos una conversación existente entre
           el usuario actual y el vendedor.
        */

        let conversation =
            await findExistingConversation(
                sellerId
            );


        /*
           Si no existe, creamos una nueva.
        */

        if (!conversation) {

            conversation =
                await createConversation(
                    sellerId,
                    publication
                );
        }

        if (!conversation) {

            hideLoading();

            showToast(
                "No se pudo crear la conversación.",
                "error"
            );

            return;
        }

        currentConversation =
            conversation;


        /*
           Cerramos el detalle de la publicación.
        */

        closePanel(
            "publication-detail-panel"
        );


        /*
           Cargamos mensajes.
        */

        await loadChatMessages(
            conversation.id
        );


        /*
           Abrimos el panel.
        */

        openPanel(
            "chat-panel"
        );


        /*
           Activamos actualización en tiempo real.
        */

        subscribeToChat(
            conversation.id
        );


        /*
           Marcamos mensajes como leídos.
        */

        await markConversationAsRead(
            conversation.id
        );


        /*
           Preparamos botón de WhatsApp.
        */

        await prepareChatWhatsAppButton(
            sellerId,
            publication
        );

        hideLoading();

    } catch (error) {

        console.error(
            "Error abriendo chat:",
            error
        );

        hideLoading();

        showToast(
            "No se pudo abrir el chat.",
            "error"
        );
    }
}


/* =========================================================
   BUSCAR CONVERSACIÓN EXISTENTE
   ========================================================= */

async function findExistingConversation(
    otherUserId
) {

    if (
        !supabaseClient ||
        !currentUser
    ) {
        return null;
    }

    try {

        /*
           Obtenemos conversaciones donde participa
           el usuario actual.
        */

        const {
            data: myParticipations,
            error
        } = await supabaseClient
            .from("conversation_participants")
            .select(
                "conversation_id"
            )
            .eq(
                "user_id",
                currentUser.id
            );

        if (error) {
            throw error;
        }

        const conversationIds =
            (myParticipations || [])
                .map(
                    function (item) {
                        return item.conversation_id;
                    }
                );

        if (!conversationIds.length) {
            return null;
        }


        /*
           Buscamos conversaciones donde también
           participe el otro usuario.
        */

        const {
            data: otherParticipations,
            error: otherError
        } = await supabaseClient
            .from("conversation_participants")
            .select(
                "conversation_id"
            )
            .eq(
                "user_id",
                otherUserId
            )
            .in(
                "conversation_id",
                conversationIds
            );

        if (otherError) {
            throw otherError;
        }

        if (!otherParticipations?.length) {
            return null;
        }

        const conversationId =
            otherParticipations[0]
                .conversation_id;


        const {
            data: conversation,
            error: conversationError
        } = await supabaseClient
            .from("conversations")
            .select("*")
            .eq(
                "id",
                conversationId
            )
            .maybeSingle();

        if (conversationError) {
            throw conversationError;
        }

        return conversation || null;

    } catch (error) {

        console.error(
            "Error buscando conversación:",
            error
        );

        return null;
    }
}


/* =========================================================
   CREAR CONVERSACIÓN
   ========================================================= */

async function createConversation(
    otherUserId,
    publication = null
) {

    if (
        !supabaseClient ||
        !currentUser
    ) {
        return null;
    }

    try {

        const {
            data: conversation,
            error
        } = await supabaseClient
            .from("conversations")
            .insert({
                created_by:
                    currentUser.id,
                publication_id:
                    publication?.id || null,
                last_message_at:
                    new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        if (!conversation) {
            return null;
        }


        /*
           Añadimos los dos participantes.
        */

        const {
            error: participantsError
        } = await supabaseClient
            .from("conversation_participants")
            .insert([
                {
                    conversation_id:
                        conversation.id,
                    user_id:
                        currentUser.id
                },
                {
                    conversation_id:
                        conversation.id,
                    user_id:
                        otherUserId
                }
            ]);

        if (participantsError) {
            throw participantsError;
        }

        return conversation;

    } catch (error) {

        console.error(
            "Error creando conversación:",
            error
        );

        return null;
    }
}


/* =========================================================
   CARGAR MENSAJES
   ========================================================= */

async function loadChatMessages(
    conversationId
) {

    if (
        !supabaseClient ||
        !conversationId ||
        !chatMessages
    ) {
        return;
    }

    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("messages")
            .select(`
                id,
                conversation_id,
                sender_id,
                message,
                created_at,
                profiles:sender_id (
                    id,
                    full_name,
                    avatar_url
                )
            `)
            .eq(
                "conversation_id",
                conversationId
            )
            .order(
                "created_at",
                {
                    ascending: true
                }
            );

        if (error) {
            throw error;
        }

        renderChatMessages(
            data || []
        );

    } catch (error) {

        console.error(
            "Error cargando mensajes:",
            error
        );

        if (chatMessages) {

            chatMessages.innerHTML = `

                <div class="empty-state">

                    <div class="empty-state-icon">
                        💬
                    </div>

                    <p>
                        No se pudieron cargar los mensajes.
                    </p>

                </div>
            `;
        }
    }
}


/* =========================================================
   RENDERIZAR MENSAJES
   ========================================================= */

function renderChatMessages(
    messages
) {

    if (!chatMessages) {
        return;
    }

    chatMessages.innerHTML = "";

    if (!messages.length) {

        chatMessages.innerHTML = `

            <div class="chat-empty">

                <div>
                    👋
                </div>

                <strong>
                    Inicia la conversación
                </strong>

                <p>
                    Escribe un mensaje al vendedor.
                </p>

            </div>
        `;

        return;
    }


    messages.forEach(
        function (item) {

            const isMine =
                item.sender_id ===
                currentUser?.id;

            const messageElement =
                document.createElement("div");

            messageElement.className =
                isMine
                    ? "chat-message mine"
                    : "chat-message";

            const senderName =
                item.profiles?.full_name ||
                "Usuario";


            messageElement.innerHTML = `

                <div class="chat-message-bubble">

                    ${
                        !isMine
                            ? `
                                <span class="chat-sender">
                                    ${escapeHTML(
                                        senderName
                                    )}
                                </span>
                              `
                            : ""
                    }

                    <div class="chat-message-text">
                        ${escapeHTML(
                            item.message || ""
                        )}
                    </div>

                    <time>
                        ${formatDateTime(
                            item.created_at
                        )}
                    </time>

                </div>
            `;

            chatMessages.appendChild(
                messageElement
            );
        }
    );


    /*
       Bajamos automáticamente al mensaje más reciente.
    */

    chatMessages.scrollTop =
        chatMessages.scrollHeight;
}


/* =========================================================
   ENVIAR MENSAJE
   ========================================================= */

async function sendChatMessage() {

    if (
        !supabaseClient ||
        !currentUser ||
        !currentConversation
    ) {

        showToast(
            "No hay una conversación abierta.",
            "error"
        );

        return;
    }

    const message =
        String(
            chatInput?.value || ""
        ).trim();

    if (!message) {
        return;
    }

    if (message.length > 2000) {

        showToast(
            "El mensaje no puede superar 2000 caracteres.",
            "error"
        );

        return;
    }

    try {

        if (chatSendButton) {
            chatSendButton.disabled = true;
        }

        const {
            data,
            error
        } = await supabaseClient
            .from("messages")
            .insert({
                conversation_id:
                    currentConversation.id,
                sender_id:
                    currentUser.id,
                message:
                    message
            })
            .select()
            .single();

        if (error) {
            throw error;
        }


        /*
           Actualizamos la conversación.
        */

        await supabaseClient
            .from("conversations")
            .update({
                last_message_at:
                    new Date().toISOString(),
                last_message:
                    message
            })
            .eq(
                "id",
                currentConversation.id
            );


        if (chatInput) {
            chatInput.value = "";
        }


        /*
           Si Realtime está activo, el mensaje aparecerá
           automáticamente. También lo agregamos localmente
           para que la interfaz responda inmediatamente.
        */

        if (data) {

            appendChatMessage(
                data
            );
        }

    } catch (error) {

        console.error(
            "Error enviando mensaje:",
            error
        );

        showToast(
            "No se pudo enviar el mensaje.",
            "error"
        );

    } finally {

        if (chatSendButton) {
            chatSendButton.disabled = false;
        }
    }
}


/* =========================================================
   AÑADIR MENSAJE A LA VISTA
   ========================================================= */

function appendChatMessage(
    item
) {

    if (!chatMessages || !item) {
        return;
    }

    /*
       Evitamos duplicados si Realtime también
       entrega el mismo mensaje.
    */

    const existing =
        chatMessages.querySelector(
            `[data-message-id="${item.id}"]`
        );

    if (existing) {
        return;
    }


    const isMine =
        item.sender_id ===
        currentUser?.id;

    const element =
        document.createElement("div");

    element.className =
        isMine
            ? "chat-message mine"
            : "chat-message";

    element.dataset.messageId =
        item.id;


    element.innerHTML = `

        <div class="chat-message-bubble">

            ${
                !isMine
                    ? `
                        <span class="chat-sender">
                            ${escapeHTML(
                                item.profiles?.full_name ||
                                "Usuario"
                            )}
                        </span>
                      `
                    : ""
            }

            <div class="chat-message-text">
                ${escapeHTML(
                    item.message || ""
                )}
            </div>

            <time>
                ${formatDateTime(
                    item.created_at
                )}
            </time>

        </div>
    `;

    chatMessages.appendChild(
        element
    );

    chatMessages.scrollTop =
        chatMessages.scrollHeight;
}


/* =========================================================
   REALTIME DEL CHAT
   ========================================================= */

function subscribeToChat(
    conversationId
) {

    if (
        !supabaseClient ||
        !conversationId
    ) {
        return;
    }


    /*
       Eliminamos una suscripción anterior.
    */

    unsubscribeFromChat();


    chatMessagesSubscription =
        supabaseClient
            .channel(
                `market-flash-chat-${conversationId}`
            )
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    filter:
                        `conversation_id=eq.${conversationId}`
                },
                async function (payload) {

                    const message =
                        payload.new;

                    /*
                       Intentamos obtener el perfil
                       del remitente.
                    */

                    try {

                        const {
                            data: sender
                        } = await supabaseClient
                            .from("profiles")
                            .select(
                                "id, full_name, avatar_url"
                            )
                            .eq(
                                "id",
                                message.sender_id
                            )
                            .maybeSingle();

                        message.profiles =
                            sender || null;

                    } catch (error) {

                        console.warn(
                            "No se pudo cargar el remitente:",
                            error
                        );
                    }

                    appendChatMessage(
                        message
                    );

                    if (
                        message.sender_id !==
                        currentUser?.id
                    ) {

                        await markConversationAsRead(
                            conversationId
                        );
                    }
                }
            )
            .subscribe(
                function (status) {

                    console.log(
                        "Estado Realtime del chat:",
                        status
                    );
                }
            );
}


/* =========================================================
   CERRAR REALTIME
   ========================================================= */

function unsubscribeFromChat() {

    if (
        supabaseClient &&
        chatMessagesSubscription
    ) {

        supabaseClient.removeChannel(
            chatMessagesSubscription
        );

        chatMessagesSubscription =
            null;
    }

    if (
        supabaseClient &&
        chatSubscription
    ) {

        supabaseClient.removeChannel(
            chatSubscription
        );

        chatSubscription = null;
    }
}


/* =========================================================
   MARCAR CONVERSACIÓN COMO LEÍDA
   ========================================================= */

async function markConversationAsRead(
    conversationId
) {

    if (
        !supabaseClient ||
        !currentUser ||
        !conversationId
    ) {
        return;
    }

    try {

        /*
           La tabla conversation_participants tendrá
           last_read_at para cada participante.
        */

        await supabaseClient
            .from("conversation_participants")
            .update({
                last_read_at:
                    new Date().toISOString()
            })
            .eq(
                "conversation_id",
                conversationId
            )
            .eq(
                "user_id",
                currentUser.id
            );

    } catch (error) {

        console.warn(
            "No se pudo marcar como leído:",
            error
        );
    }
}


/* =========================================================
   PREPARAR WHATSAPP DEL CHAT
   ========================================================= */

async function prepareChatWhatsAppButton(
    sellerId,
    publication = null
) {

    if (!chatWhatsappButton) {
        return;
    }

    chatWhatsappButton.hidden = true;

    if (!sellerId) {
        return;
    }

    try {

        const {
            data: seller,
            error
        } = await supabaseClient
            .from("profiles")
            .select(
                "id, full_name, phone"
            )
            .eq(
                "id",
                sellerId
            )
            .maybeSingle();

        if (error) {
            throw error;
        }

        const phone =
            normalizePhone(
                seller?.phone || ""
            );

        if (!phone) {
            return;
        }

        /*
           Guardamos temporalmente los datos para
           continueChatOnWhatsApp().
        */

        chatWhatsappButton.dataset.phone =
            phone;

        chatWhatsappButton.dataset.publicationTitle =
            publication?.title || "";

        chatWhatsappButton.hidden = false;

    } catch (error) {

        console.warn(
            "No se pudo preparar WhatsApp:",
            error
        );
    }
}


/* =========================================================
   CONTINUAR POR WHATSAPP
   ========================================================= */

function continueChatOnWhatsApp() {

    if (!chatWhatsappButton) {
        return;
    }

    const phone =
        chatWhatsappButton.dataset.phone || "";

    if (!phone) {

        showToast(
            "WhatsApp no está disponible para este vendedor.",
            "error"
        );

        return;
    }

    const publicationTitle =
        chatWhatsappButton.dataset
            .publicationTitle || "";

    let message =
        "Hola, te contacto desde Market Flash.";

    if (publicationTitle) {

        message +=
            ` Estoy interesado/a en tu publicación "${publicationTitle}".`;
    }

    openWhatsApp(
        phone,
        message
    );
}


/* =========================================================
   CERRAR CHAT
   ========================================================= */

function closeCurrentChat() {

    unsubscribeFromChat();

    currentConversation =
        null;

    closePanel(
        "chat-panel"
    );
}


/* =========================================================
   CARGAR MIS CONVERSACIONES
   ========================================================= */

async function loadMyConversations() {

    if (
        !supabaseClient ||
        !currentUser
    ) {
        return [];
    }

    try {

        const {
            data: participations,
            error
        } = await supabaseClient
            .from("conversation_participants")
            .select(`
                conversation_id,
                last_read_at,
                conversations (
                    id,
                    created_by,
                    publication_id,
                    last_message,
                    last_message_at,
                    created_at
                )
            `)
            .eq(
                "user_id",
                currentUser.id
            )
            .order(
                "last_read_at",
                {
                    ascending: false,
                    nullsFirst: true
                }
            );

        if (error) {
            throw error;
        }

        return participations || [];

    } catch (error) {

        console.error(
            "Error cargando conversaciones:",
            error
        );

        return [];
    }
}


/* =========================================================
   NOTIFICACIÓN LOCAL DE MENSAJES
   ========================================================= */

function showNewMessageNotification(
    senderName
) {

    showToast(
        `💬 Nuevo mensaje de ${senderName || "un usuario"}.`,
        "info"
    );
}


/* =========================================================
   INICIALIZAR CHAT
   ========================================================= */

bindChatEvents();


console.log(
    "Módulo de chat Market Flash cargado."
);/* =========================================================
   MARKET FLASH
   SCRIPT PRINCIPAL
   PARTE 6
   FLASH DEL DÍA + TARIFAS + PAGOS + COMPROBANTES
   ========================================================= */

let pendingPromotionRequest = null;
let selectedPromotionTariff = null;
let selectedPaymentMethod = null;


/* =========================================================
   REFERENCIAS
   ========================================================= */

const promotionPanel = $("promotion-panel");
const closePromotionPanelButton = $("close-promotion-panel");
const promotionForm = $("promotion-form");
const promotionTitle = $("promotion-title");
const promotionDescription = $("promotion-description");
const promotionPrice = $("promotion-price");

const paymentMethodPanel = $("payment-method-panel");
const closePaymentMethodPanelButton = $("close-payment-method-panel");
const paymentMethodsList = $("payment-methods-list");

const paymentProofPanel = $("payment-proof-panel");
const closePaymentProofPanelButton = $("close-payment-proof-panel");
const paymentProofFile = $("payment-proof-file");
const paymentProofPreview = $("payment-proof-preview");
const sendPaymentProofButton = $("send-payment-proof-button");


/* =========================================================
   INICIALIZACIÓN
   ========================================================= */

function initializeFlashPromotionSystem() {
    if (closePromotionPanelButton) {
        closePromotionPanelButton.addEventListener("click", function () {
            closePanel("promotion-panel");
            pendingPromotionRequest = null;
            selectedPromotionTariff = null;
        });
    }

    if (closePaymentMethodPanelButton) {
        closePaymentMethodPanelButton.addEventListener("click", function () {
            closePanel("payment-method-panel");
        });
    }

    if (closePaymentProofPanelButton) {
        closePaymentProofPanelButton.addEventListener("click", function () {
            closePanel("payment-proof-panel");
        });
    }

    const promoteButton = $("promote-button");

    if (promoteButton) {
        promoteButton.addEventListener("click", function () {
            openPromotionPanel();
        });
    }

    if (promotionForm) {
        promotionForm.addEventListener(
            "submit",
            handlePromotionFormSubmit
        );
    }

    if (paymentProofFile) {
        paymentProofFile.addEventListener(
            "change",
            handlePaymentProofPreview
        );
    }

    if (sendPaymentProofButton) {
        sendPaymentProofButton.addEventListener(
            "click",
            sendPaymentProof
        );
    }
}


/* =========================================================
   CARGAR CONFIGURACIÓN
   ========================================================= */

async function getFlashTariffs() {
    const fallback = DEFAULT_CONFIG.flashPrices || [];

    if (!supabaseClient) {
        return fallback;
    }

    try {
        const { data, error } = await supabaseClient
            .from("flash_tariffs")
            .select("*")
            .eq("active", true)
            .order("sort_order", { ascending: true });

        if (error || !data || data.length === 0) {
            return fallback;
        }

        return data.map(function (item) {
            return {
                id: item.id,
                name: item.name,
                price: Number(item.price || 0)
            };
        });
    } catch (error) {
        console.warn("No se pudieron cargar las tarifas:", error);
        return fallback;
    }
}


async function getPaymentMethods() {
    const fallback = DEFAULT_CONFIG.paymentMethods || [];

    if (!supabaseClient) {
        return fallback;
    }

    try {
        const { data, error } = await supabaseClient
            .from("payment_methods")
            .select("*")
            .eq("active", true)
            .order("sort_order", { ascending: true });

        if (error || !data || data.length === 0) {
            return fallback;
        }

        return data.map(function (item) {
            return {
                id: item.id,
                name: item.name,
                details: item.details || ""
            };
        });
    } catch (error) {
        console.warn(
            "No se pudieron cargar los métodos de pago:",
            error
        );

        return fallback;
    }
}


/* =========================================================
   ABRIR FLASH DEL DÍA
   ========================================================= */

async function openPromotionPanel() {
    if (!currentUser) {
        showToast(
            "Debes iniciar sesión para promocionar una publicación.",
            "error"
        );
        return;
    }

    openPanel("promotion-panel");

    await preparePromotionForm();
}


/* =========================================================
   PREPARAR FORMULARIO
   ========================================================= */

async function preparePromotionForm() {
    if (!promotionForm) {
        return;
    }

    let publicationSelector =
        document.getElementById("promotion-publication");

    if (!publicationSelector) {
        const wrapper = document.createElement("div");

        wrapper.className = "form-group";

        wrapper.innerHTML = `
            <label for="promotion-publication">
                Publicación que quieres promocionar
            </label>

            <select
                id="promotion-publication"
                required
            >
                <option value="">
                    Selecciona una publicación
                </option>
            </select>
        `;

        const firstField =
            promotionTitle?.closest(".form-group") ||
            promotionTitle?.parentElement;

        if (firstField) {
            firstField.parentNode.insertBefore(
                wrapper,
                firstField
            );
        } else {
            promotionForm.prepend(wrapper);
        }

        publicationSelector =
            document.getElementById("promotion-publication");
    }

    await loadMyPublicationsForPromotion(
        publicationSelector
    );

    await renderPromotionTariffs();
}


/* =========================================================
   PUBLICACIONES DEL USUARIO
   ========================================================= */

async function loadMyPublicationsForPromotion(selectElement) {
    if (!selectElement || !currentUser) {
        return;
    }

    selectElement.innerHTML = `
        <option value="">
            Cargando tus publicaciones...
        </option>
    `;

    try {
        const { data, error } = await supabaseClient
            .from("publications")
            .select("id, title, price, status")
            .eq("seller_id", currentUser.id)
            .neq("status", "deleted")
            .order("created_at", {
                ascending: false
            });

        if (error) {
            console.error(
                "Error cargando publicaciones:",
                error
            );

            selectElement.innerHTML = `
                <option value="">
                    No se pudieron cargar
                </option>
            `;

            return;
        }

        if (!data || data.length === 0) {
            selectElement.innerHTML = `
                <option value="">
                    Primero debes publicar un producto
                </option>
            `;

            return;
        }

        selectElement.innerHTML = `
            <option value="">
                Selecciona una publicación
            </option>
        `;

        data.forEach(function (publication) {
            const option =
                document.createElement("option");

            option.value = publication.id;

            option.textContent =
                publication.title +
                " — " +
                formatMoney(publication.price);

            selectElement.appendChild(option);
        });

    } catch (error) {
        console.error(
            "Error inesperado cargando publicaciones:",
            error
        );
    }
}


/* =========================================================
   MOSTRAR TARIFAS
   ========================================================= */

async function renderPromotionTariffs() {
    const tariffs = await getFlashTariffs();

    let tariffContainer =
        document.getElementById(
            "promotion-tariffs"
        );

    if (!tariffContainer) {
        tariffContainer =
            document.createElement("div");

        tariffContainer.id =
            "promotion-tariffs";

        tariffContainer.className =
            "promotion-tariffs";

        const priceField =
            promotionPrice?.closest(".form-group") ||
            promotionPrice?.parentElement;

        if (priceField) {
            priceField.parentNode.insertBefore(
                tariffContainer,
                priceField
            );
        } else {
            promotionForm.prepend(
                tariffContainer
            );
        }
    }

    tariffContainer.innerHTML = `
        <label class="section-label">
            Elige tu tarifa
        </label>

        <div class="tariff-grid">
            ${tariffs.map(function (tariff) {
                return `
                    <button
                        type="button"
                        class="tariff-card"
                        data-tariff-id="${escapeHTML(
                            String(tariff.id)
                        )}"
                    >
                        <strong>
                            ${escapeHTML(tariff.name)}
                        </strong>

                        <span>
                            ${formatMoney(tariff.price)}
                        </span>
                    </button>
                `;
            }).join("")}
        </div>
    `;

    const tariffButtons =
        tariffContainer.querySelectorAll(
            ".tariff-card"
        );

    tariffButtons.forEach(function (button) {
        button.addEventListener(
            "click",
            function () {
                const tariffId =
                    button.dataset.tariffId;

                selectedPromotionTariff =
                    tariffs.find(function (tariff) {
                        return String(tariff.id) ===
                            String(tariffId);
                    });

                tariffButtons.forEach(function (item) {
                    item.classList.remove("active");
                });

                button.classList.add("active");

                if (promotionPrice) {
                    promotionPrice.value =
                        selectedPromotionTariff
                            ? selectedPromotionTariff.price
                            : "";
                }
            }
        );
    });
}


/* =========================================================
   ENVIAR SOLICITUD DE PROMOCIÓN
   ========================================================= */

async function handlePromotionFormSubmit(event) {
    event.preventDefault();

    if (!currentUser) {
        showToast(
            "Debes iniciar sesión.",
            "error"
        );
        return;
    }

    const publicationSelector =
        document.getElementById(
            "promotion-publication"
        );

    const publicationId =
        publicationSelector
            ? publicationSelector.value
            : "";

    const title =
        promotionTitle
            ? promotionTitle.value.trim()
            : "";

    const description =
        promotionDescription
            ? promotionDescription.value.trim()
            : "";

    if (!publicationId) {
        showToast(
            "Selecciona una publicación.",
            "error"
        );
        return;
    }

    if (!selectedPromotionTariff) {
        showToast(
            "Selecciona una tarifa.",
            "error"
        );
        return;
    }

    pendingPromotionRequest = {
        publication_id: publicationId,
        title: title,
        description: description,
        tariff_id: selectedPromotionTariff.id,
        tariff_name: selectedPromotionTariff.name,
        amount: selectedPromotionTariff.price
    };

    await openPaymentMethodSelection();
}


/* =========================================================
   MÉTODOS DE PAGO
   ========================================================= */

async function openPaymentMethodSelection() {
    closePanel("promotion-panel");

    selectedPaymentMethod = null;

    const methods =
        await getPaymentMethods();

    if (!paymentMethodsList) {
        return;
    }

    paymentMethodsList.innerHTML = "";

    methods.forEach(function (method) {
        const button =
            document.createElement("button");

        button.type = "button";
        button.className =
            "payment-method-card";

        button.dataset.paymentId =
            method.id;

        button.innerHTML = `
            <span class="payment-method-icon">
                💳
            </span>

            <span class="payment-method-content">
                <strong>
                    ${escapeHTML(method.name)}
                </strong>

                <small>
                    ${escapeHTML(
                        method.details ||
                        "Información de pago"
                    )}
                </small>
            </span>

            <span class="payment-method-arrow">
                ›
            </span>
        `;

        button.addEventListener(
            "click",
            function () {
                selectedPaymentMethod =
                    method;

                openPaymentProofPanel();
            }
        );

        paymentMethodsList.appendChild(
            button
        );
    });

    openPanel("payment-method-panel");
}


/* =========================================================
   COMPROBANTE
   ========================================================= */

function openPaymentProofPanel() {
    closePanel("payment-method-panel");

    if (paymentProofFile) {
        paymentProofFile.value = "";
    }

    selectedPaymentProof = null;

    if (paymentProofPreview) {
        paymentProofPreview.innerHTML = `
            <div class="proof-empty">
                <span>📷</span>
                <p>
                    Selecciona una foto del comprobante
                </p>
            </div>
        `;
    }

    openPanel("payment-proof-panel");
}


/* =========================================================
   VISTA PREVIA DEL COMPROBANTE
   ========================================================= */

function handlePaymentProofPreview(event) {
    const file =
        event.target.files &&
        event.target.files[0];

    if (!file) {
        selectedPaymentProof = null;
        return;
    }

    const maxSize =
        15 * 1024 * 1024;

    if (file.size > maxSize) {
        showToast(
            "El comprobante no puede superar 15 MB.",
            "error"
        );

        event.target.value = "";
        selectedPaymentProof = null;
        return;
    }

    selectedPaymentProof = file;

    if (!paymentProofPreview) {
        return;
    }

    if (file.type.startsWith("image/")) {
        const reader =
            new FileReader();

        reader.onload = function (readerEvent) {
            paymentProofPreview.innerHTML = `
                <img
                    src="${readerEvent.target.result}"
                    alt="Comprobante de pago"
                    class="payment-proof-image"
                >
            `;
        };

        reader.readAsDataURL(file);

    } else {
        paymentProofPreview.innerHTML = `
            <div class="proof-file">
                📄
                <strong>
                    ${escapeHTML(file.name)}
                </strong>
            </div>
        `;
    }
}


/* =========================================================
   SUBIR COMPROBANTE
   ========================================================= */

async function uploadPaymentProof(file) {
    if (!file || !currentUser) {
        throw new Error(
            "No existe un comprobante válido."
        );
    }

    const extension =
        file.name.includes(".")
            ? file.name
                .split(".")
                .pop()
                .toLowerCase()
            : "jpg";

    const fileName =
        `${currentUser.id}/` +
        `${Date.now()}_` +
        `${crypto.randomUUID()}.` +
        extension;

    const { error } =
        await supabaseClient.storage
            .from("payment-proofs")
            .upload(
                fileName,
                file,
                {
                    cacheControl: "3600",
                    upsert: false
                }
            );

    if (error) {
        throw error;
    }

    return fileName;
}


/* =========================================================
   CREAR SOLICITUD DE PAGO
   ========================================================= */

async function createFlashPaymentRequest(
    proofPath
) {
    if (
        !pendingPromotionRequest ||
        !selectedPaymentMethod ||
        !currentUser
    ) {
        throw new Error(
            "Faltan datos de la solicitud."
        );
    }

    const requestData = {
        user_id: currentUser.id,

        publication_id:
            pendingPromotionRequest
                .publication_id,

        tariff_id:
            pendingPromotionRequest
                .tariff_id,

        tariff_name:
            pendingPromotionRequest
                .tariff_name,

        amount:
            pendingPromotionRequest
                .amount,

        payment_method_id:
            selectedPaymentMethod.id,

        payment_method_name:
            selectedPaymentMethod.name,

        promotion_title:
            pendingPromotionRequest
                .title,

        promotion_description:
            pendingPromotionRequest
                .description,

        proof_path: proofPath,

        status: "pending"
    };

    const { data, error } =
        await supabaseClient
            .from("flash_payment_requests")
            .insert(requestData)
            .select()
            .single();

    if (error) {
        throw error;
    }

    return data;
}


/* =========================================================
   NOTIFICAR A LOS ADMINISTRADORES
   ========================================================= */

async function notifyAdminsOfPayment(
    paymentRequest
) {
    try {
        const { data: admins } =
            await supabaseClient
                .from("profiles")
                .select("id")
                .or(
                    "role.eq.admin,is_admin.eq.true"
                );

        if (!admins || admins.length === 0) {
            console.warn(
                "No se encontraron administradores."
            );
            return;
        }

        const notifications =
            admins.map(function (admin) {
                return {
                    user_id: admin.id,

                    type:
                        "flash_payment_pending",

                    title:
                        "Nuevo comprobante de Flash del Día",

                    message:
                        `${currentProfile?.name || "Un usuario"} ` +
                        `envió un comprobante por ` +
                        `${formatMoney(
                            paymentRequest.amount
                        )}.`,

                    related_id:
                        paymentRequest.id,

                    is_read: false
                };
            });

        const { error } =
            await supabaseClient
                .from("notifications")
                .insert(notifications);

        if (error) {
            console.warn(
                "No se pudo crear la notificación:",
                error
            );
        }

    } catch (error) {
        console.warn(
            "Error notificando al administrador:",
            error
        );
    }
}


/* =========================================================
   ENVIAR COMPROBANTE
   ========================================================= */

async function sendPaymentProof() {
    if (!currentUser) {
        showToast(
            "Debes iniciar sesión.",
            "error"
        );
        return;
    }

    if (!pendingPromotionRequest) {
        showToast(
            "La solicitud de promoción no está completa.",
            "error"
        );
        return;
    }

    if (!selectedPaymentMethod) {
        showToast(
            "Selecciona un método de pago.",
            "error"
        );
        return;
    }

    if (!selectedPaymentProof) {
        showToast(
            "Debes subir el comprobante.",
            "error"
        );
        return;
    }

    try {
        showLoading(
            "Enviando comprobante..."
        );

        const proofPath =
            await uploadPaymentProof(
                selectedPaymentProof
            );

        const paymentRequest =
            await createFlashPaymentRequest(
                proofPath
            );

        await notifyAdminsOfPayment(
            paymentRequest
        );

        closePanel(
            "payment-proof-panel"
        );

        pendingPromotionRequest = null;
        selectedPromotionTariff = null;
        selectedPaymentMethod = null;
        selectedPaymentProof = null;

        if (promotionForm) {
            promotionForm.reset();
        }

        showToast(
            "Comprobante enviado. El administrador revisará tu solicitud.",
            "success"
        );

    } catch (error) {
        console.error(
            "Error enviando comprobante:",
            error
        );

        showToast(
            "No se pudo enviar el comprobante. Revisa la configuración de Supabase.",
            "error"
        );

    } finally {
        hideLoading();
    }
}


/* =========================================================
   ACTUALIZAR PRECIO DE PROMOCIÓN
   ========================================================= */

function updatePromotionPriceDisplay() {
    if (
        promotionPrice &&
        selectedPromotionTariff
    ) {
        promotionPrice.value =
            selectedPromotionTariff.price;
    }
}


/* =========================================================
   INICIAR SISTEMA
   ========================================================= */

initializeFlashPromotionSystem();/* =========================================================
   MARKET FLASH
   SCRIPT PRINCIPAL
   PARTE 7
   ADMINISTRACIÓN DE FLASH DEL DÍA
   ========================================================= */

let currentAdminPaymentRequest = null;


/* =========================================================
   REFERENCIAS ADMINISTRACIÓN FLASH
   ========================================================= */

const adminPaymentProofsList =
    $("admin-payment-proofs-list");

const pendingProofCount =
    $("pending-proof-count");

const adminProofDetailPanel =
    $("admin-proof-detail-panel");

const closeAdminProofDetail =
    $("close-admin-proof-detail");

const adminProofDetail =
    $("admin-proof-detail");

const rejectProofButton =
    $("reject-proof-button");

const acceptProofButton =
    $("accept-proof-button");

const viewProofButton =
    $("view-proof-button");

const proofFullscreenViewer =
    $("proof-fullscreen-viewer");

const proofFullscreenImage =
    $("proof-fullscreen-image");

const closeProofFullscreen =
    $("close-proof-fullscreen");


/* =========================================================
   INICIALIZAR ADMINISTRACIÓN DE PAGOS
   ========================================================= */

function initializeAdminFlashSystem() {

    if (closeAdminProofDetail) {
        closeAdminProofDetail.addEventListener(
            "click",
            function () {
                closePanel(
                    "admin-proof-detail-panel"
                );

                currentAdminPaymentRequest = null;
            }
        );
    }

    if (rejectProofButton) {
        rejectProofButton.addEventListener(
            "click",
            function () {
                processFlashPaymentDecision(
                    "rejected"
                );
            }
        );
    }

    if (acceptProofButton) {
        acceptProofButton.addEventListener(
            "click",
            function () {
                processFlashPaymentDecision(
                    "approved"
                );
            }
        );
    }

    if (viewProofButton) {
        viewProofButton.addEventListener(
            "click",
            openCurrentProofFullscreen
        );
    }

    if (closeProofFullscreen) {
        closeProofFullscreen.addEventListener(
            "click",
            function () {
                closeProofFullscreenViewer();
            }
        );
    }

    if (proofFullscreenViewer) {
        proofFullscreenViewer.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    proofFullscreenViewer
                ) {
                    closeProofFullscreenViewer();
                }

            }
        );
    }
}


/* =========================================================
   COMPROBAR ADMIN
   ========================================================= */

function isCurrentUserAdmin() {

    if (!currentProfile) {
        return false;
    }

    return (
        currentProfile.role === "admin" ||
        currentProfile.is_admin === true
    );
}


/* =========================================================
   CARGAR COMPROBANTES
   ========================================================= */

async function loadAdminPaymentProofs() {

    if (!isCurrentUserAdmin()) {
        return;
    }

    if (!adminPaymentProofsList) {
        return;
    }

    adminPaymentProofsList.innerHTML = `
        <div class="admin-loading">
            Cargando solicitudes...
        </div>
    `;

    try {

        const { data, error } =
            await supabaseClient
                .from("flash_payment_requests")
                .select(`
                    *,
                    profiles:user_id (
                        id,
                        name,
                        phone,
                        cedula
                    ),
                    publications:publication_id (
                        id,
                        title,
                        price
                    )
                `)
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );

        if (error) {
            throw error;
        }

        renderAdminPaymentProofs(
            data || []
        );

    } catch (error) {

        console.error(
            "Error cargando comprobantes:",
            error
        );

        adminPaymentProofsList.innerHTML = `
            <div class="admin-empty">
                No se pudieron cargar
                las solicitudes.
            </div>
        `;
    }
}


/* =========================================================
   RENDERIZAR COMPROBANTES
   ========================================================= */

function renderAdminPaymentProofs(
    requests
) {

    if (!adminPaymentProofsList) {
        return;
    }

    const pending =
        requests.filter(function (request) {
            return request.status === "pending";
        });

    if (pendingProofCount) {
        pendingProofCount.textContent =
            String(pending.length);
    }

    if (requests.length === 0) {

        adminPaymentProofsList.innerHTML = `
            <div class="admin-empty">
                No hay solicitudes de Flash del Día.
            </div>
        `;

        return;
    }

    adminPaymentProofsList.innerHTML =
        requests.map(function (request) {

            const profile =
                request.profiles || {};

            const publication =
                request.publications || {};

            let statusText =
                "Pendiente";

            if (request.status === "approved") {
                statusText = "Aceptado";
            }

            if (request.status === "rejected") {
                statusText = "Rechazado";
            }

            return `
                <article
                    class="admin-payment-card"
                    data-payment-id="${escapeHTML(
                        String(request.id)
                    )}"
                >

                    <div class="admin-payment-header">

                        <div>
                            <strong>
                                ${escapeHTML(
                                    profile.name ||
                                    "Usuario"
                                )}
                            </strong>

                            <small>
                                ${formatDateTime(
                                    request.created_at
                                )}
                            </small>
                        </div>

                        <span
                            class="payment-status payment-status-${escapeHTML(
                                request.status || "pending"
                            )}"
                        >
                            ${statusText}
                        </span>

                    </div>

                    <div class="admin-payment-info">

                        <p>
                            <strong>
                                Publicación:
                            </strong>

                            ${escapeHTML(
                                publication.title ||
                                request.promotion_title ||
                                "Sin título"
                            )}
                        </p>

                        <p>
                            <strong>
                                Tarifa:
                            </strong>

                            ${escapeHTML(
                                request.tariff_name ||
                                "Flash"
                            )}
                        </p>

                        <p>
                            <strong>
                                Monto:
                            </strong>

                            ${formatMoney(
                                request.amount
                            )}
                        </p>

                        <p>
                            <strong>
                                Pago:
                            </strong>

                            ${escapeHTML(
                                request.payment_method_name ||
                                "No indicado"
                            )}
                        </p>

                    </div>

                    <div class="admin-payment-actions">

                        <button
                            type="button"
                            class="admin-action-button"
                            data-proof-action="view"
                            data-payment-id="${escapeHTML(
                                String(request.id)
                            )}"
                        >
                            👁 Ver comprobante
                        </button>

                        ${
                            request.status === "pending"
                            ? `
                                <button
                                    type="button"
                                    class="admin-action-button danger"
                                    data-proof-action="reject"
                                    data-payment-id="${escapeHTML(
                                        String(request.id)
                                    )}"
                                >
                                    ❌ Rechazar
                                </button>

                                <button
                                    type="button"
                                    class="admin-action-button success"
                                    data-proof-action="accept"
                                    data-payment-id="${escapeHTML(
                                        String(request.id)
                                    )}"
                                >
                                    ✅ Aceptar
                                </button>
                            `
                            : ""
                        }

                    </div>

                </article>
            `;

        }).join("");

    bindAdminPaymentCardActions();
}


/* =========================================================
   ACCIONES DE TARJETAS
   ========================================================= */

function bindAdminPaymentCardActions() {

    const buttons =
        adminPaymentProofsList.querySelectorAll(
            "[data-proof-action]"
        );

    buttons.forEach(function (button) {

        button.addEventListener(
            "click",
            async function () {

                const paymentId =
                    button.dataset.paymentId;

                const action =
                    button.dataset.proofAction;

                const request =
                    await getFlashPaymentRequest(
                        paymentId
                    );

                if (!request) {
                    showToast(
                        "No se encontró la solicitud.",
                        "error"
                    );

                    return;
                }

                if (action === "view") {

                    currentAdminPaymentRequest =
                        request;

                    openAdminProofDetail(
                        request
                    );

                    return;
                }

                if (action === "reject") {

                    currentAdminPaymentRequest =
                        request;

                    await processFlashPaymentDecision(
                        "rejected"
                    );

                    return;
                }

                if (action === "accept") {

                    currentAdminPaymentRequest =
                        request;

                    await processFlashPaymentDecision(
                        "approved"
                    );
                }

            }
        );
    });
}


/* =========================================================
   OBTENER SOLICITUD
   ========================================================= */

async function getFlashPaymentRequest(
    paymentId
) {

    try {

        const { data, error } =
            await supabaseClient
                .from("flash_payment_requests")
                .select(`
                    *,
                    profiles:user_id (
                        id,
                        name,
                        phone,
                        cedula
                    ),
                    publications:publication_id (
                        id,
                        title,
                        price
                    )
                `)
                .eq(
                    "id",
                    paymentId
                )
                .single();

        if (error) {
            throw error;
        }

        return data;

    } catch (error) {

        console.error(
            "Error obteniendo solicitud:",
            error
        );

        return null;
    }
}


/* =========================================================
   DETALLE DEL COMPROBANTE
   ========================================================= */

function openAdminProofDetail(
    request
) {

    if (!adminProofDetail) {
        return;
    }

    const profile =
        request.profiles || {};

    const publication =
        request.publications || {};

    adminProofDetail.innerHTML = `

        <div class="proof-detail-block">

            <h3>
                Solicitud de Flash del Día
            </h3>

            <p>
                <strong>Usuario:</strong>
                ${escapeHTML(
                    profile.name ||
                    "Sin nombre"
                )}
            </p>

            <p>
                <strong>Cédula:</strong>
                ${escapeHTML(
                    profile.cedula ||
                    "No disponible"
                )}
            </p>

            <p>
                <strong>WhatsApp:</strong>
                ${escapeHTML(
                    profile.phone ||
                    "No disponible"
                )}
            </p>

            <p>
                <strong>Publicación:</strong>
                ${escapeHTML(
                    publication.title ||
                    request.promotion_title ||
                    "Sin título"
                )}
            </p>

            <p>
                <strong>Tarifa:</strong>
                ${escapeHTML(
                    request.tariff_name ||
                    "Flash"
                )}
            </p>

            <p>
                <strong>Monto:</strong>
                ${formatMoney(
                    request.amount
                )}
            </p>

            <p>
                <strong>Método de pago:</strong>
                ${escapeHTML(
                    request.payment_method_name ||
                    "No disponible"
                )}
            </p>

            <p>
                <strong>Fecha:</strong>
                ${formatDateTime(
                    request.created_at
                )}
            </p>

        </div>

        <div class="proof-detail-description">

            <strong>
                Descripción:
            </strong>

            <p>
                ${escapeHTML(
                    request.promotion_description ||
                    "Sin descripción."
                )}
            </p>

        </div>

    `;

    openPanel(
        "admin-proof-detail-panel"
    );
}


/* =========================================================
   DESCARGAR / MOSTRAR COMPROBANTE
   ========================================================= */

async function getPaymentProofUrl(
    proofPath
) {

    if (!proofPath) {
        return null;
    }

    try {

        const { data, error } =
            await supabaseClient.storage
                .from("payment-proofs")
                .createSignedUrl(
                    proofPath,
                    300
                );

        if (error) {
            throw error;
        }

        return data?.signedUrl || null;

    } catch (error) {

        console.error(
            "Error generando URL del comprobante:",
            error
        );

        return null;
    }
}


/* =========================================================
   ABRIR COMPROBANTE EN PANTALLA COMPLETA
   ========================================================= */

async function openCurrentProofFullscreen() {

    if (!currentAdminPaymentRequest) {
        return;
    }

    const proofPath =
        currentAdminPaymentRequest.proof_path;

    if (!proofPath) {

        showToast(
            "Esta solicitud no tiene comprobante.",
            "error"
        );

        return;
    }

    try {

        showLoading(
            "Abriendo comprobante..."
        );

        const signedUrl =
            await getPaymentProofUrl(
                proofPath
            );

        if (!signedUrl) {
            throw new Error(
                "No se pudo obtener el comprobante."
            );
        }

        const isImage =
            /\.(jpg|jpeg|png|webp|gif)$/i
                .test(proofPath);

        if (
            isImage &&
            proofFullscreenImage
        ) {

            proofFullscreenImage.src =
                signedUrl;

            proofFullscreenImage.style.display =
                "block";

        } else {

            if (proofFullscreenImage) {
                proofFullscreenImage.style.display =
                    "none";
            }

            window.open(
                signedUrl,
                "_blank",
                "noopener,noreferrer"
            );

            hideLoading();

            return;
        }

        if (proofFullscreenViewer) {
            proofFullscreenViewer.classList.add(
                "active"
            );
        }

    } catch (error) {

        console.error(
            "Error mostrando comprobante:",
            error
        );

        showToast(
            "No se pudo abrir el comprobante.",
            "error"
        );

    } finally {

        hideLoading();
    }
}


/* =========================================================
   CERRAR VISOR
   ========================================================= */

function closeProofFullscreenViewer() {

    if (proofFullscreenViewer) {
        proofFullscreenViewer.classList.remove(
            "active"
        );
    }

    if (proofFullscreenImage) {
        proofFullscreenImage.src = "";
    }
}


/* =========================================================
   ACEPTAR / RECHAZAR
   ========================================================= */

async function processFlashPaymentDecision(
    decision
) {

    if (!isCurrentUserAdmin()) {

        showToast(
            "No tienes permisos de administrador.",
            "error"
        );

        return;
    }

    if (!currentAdminPaymentRequest) {

        showToast(
            "No hay una solicitud seleccionada.",
            "error"
        );

        return;
    }

    const request =
        currentAdminPaymentRequest;

    if (request.status !== "pending") {

        showToast(
            "Esta solicitud ya fue procesada.",
            "error"
        );

        return;
    }

    const accepted =
        decision === "approved";

    const confirmationMessage =
        accepted
            ? "¿Aceptar este comprobante y activar el Flash del Día?"
            : "¿Rechazar este comprobante?";

    if (
        !window.confirm(
            confirmationMessage
        )
    ) {
        return;
    }

    try {

        showLoading(
            accepted
                ? "Aceptando solicitud..."
                : "Rechazando solicitud..."
        );

        const { error:
            paymentUpdateError } =
            await supabaseClient
                .from("flash_payment_requests")
                .update({
                    status: decision,
                    reviewed_by:
                        currentUser.id,
                    reviewed_at:
                        new Date().toISOString()
                })
                .eq(
                    "id",
                    request.id
                )
                .eq(
                    "status",
                    "pending"
                );

        if (paymentUpdateError) {
            throw paymentUpdateError;
        }

        if (accepted) {

            await activateFlashPromotion(
                request
            );

        } else {

            await notifyPaymentResult(
                request,
                "rejected"
            );
        }

        closePanel(
            "admin-proof-detail-panel"
        );

        currentAdminPaymentRequest = null;

        await loadAdminPaymentProofs();

        showToast(
            accepted
                ? "Flash del Día aceptado y activado."
                : "Comprobante rechazado.",
            "success"
        );

    } catch (error) {

        console.error(
            "Error procesando solicitud:",
            error
        );

        showToast(
            "No se pudo procesar la solicitud.",
            "error"
        );

    } finally {

        hideLoading();
    }
}


/* =========================================================
   ACTIVAR FLASH
   ========================================================= */

async function activateFlashPromotion(
    request
) {

    const startedAt =
        new Date();

    const endsAt =
        new Date(
            startedAt.getTime() +
            24 * 60 * 60 * 1000
        );

    const promotionData = {

        publication_id:
            request.publication_id,

        payment_request_id:
            request.id,

        tariff_id:
            request.tariff_id,

        tariff_name:
            request.tariff_name,

        amount:
            request.amount,

        title:
            request.promotion_title,

        description:
            request.promotion_description,

        starts_at:
            startedAt.toISOString(),

        ends_at:
            endsAt.toISOString(),

        status:
            "active"
    };

    const { error } =
        await supabaseClient
            .from("flash_promotions")
            .insert(
                promotionData
            );

    if (error) {
        throw error;
    }

    await supabaseClient
        .from("publications")
        .update({
            is_flash: true
        })
        .eq(
            "id",
            request.publication_id
        );

    await notifyPaymentResult(
        request,
        "approved"
    );
}


/* =========================================================
   NOTIFICAR RESULTADO AL USUARIO
   ========================================================= */

async function notifyPaymentResult(
    request,
    result
) {

    if (!request.user_id) {
        return;
    }

    const approved =
        result === "approved";

    const notification = {

        user_id:
            request.user_id,

        type:
            approved
                ? "flash_payment_approved"
                : "flash_payment_rejected",

        title:
            approved
                ? "Flash del Día aprobado"
                : "Flash del Día rechazado",

        message:
            approved
                ? "Tu comprobante fue aprobado. Tu publicación ya está promocionada en Flash del Día."
                : "Tu comprobante de Flash del Día fue rechazado. Puedes revisar los datos de pago y enviar una nueva solicitud.",

        related_id:
            request.id,

        is_read:
            false
    };

    try {

        const { error } =
            await supabaseClient
                .from("notifications")
                .insert(
                    notification
                );

        if (error) {
            console.warn(
                "No se pudo enviar la notificación:",
                error
            );
        }

    } catch (error) {

        console.warn(
            "Error notificando resultado:",
            error
        );
    }
}


/* =========================================================
   ACTUALIZAR FLASH DEL DÍA
   ========================================================= */

async function refreshFlashSection() {

    if (
        typeof loadFlashPromotions ===
        "function"
    ) {
        await loadFlashPromotions();
    }

}


/* =========================================================
   INICIAR ADMINISTRACIÓN
   ========================================================= */

initializeAdminFlashSystem();/* =========================================================
   MARKET FLASH
   SCRIPT PRINCIPAL
   PARTE 8
   ADMINISTRACIÓN DE USUARIOS Y PUBLICACIONES
   ========================================================= */


/* =========================================================
   REFERENCIAS
   ========================================================= */

const adminUsersButton =
    $("admin-users-button");

const adminUsersList =
    $("admin-users-list");

const adminPublicationsList =
    $("admin-publications-list");

const adminTotalUsers =
    $("admin-total-users");

const adminActiveUsers =
    $("admin-active-users");

const adminTotalPublications =
    $("admin-total-publications");


/* =========================================================
   ESTADO DEL ADMIN
   ========================================================= */

let adminUsersCache = [];
let adminPublicationsCache = [];


/* =========================================================
   INICIALIZAR ADMIN USERS
   ========================================================= */

function initializeAdminManagement() {

    if (adminUsersButton) {

        adminUsersButton.addEventListener(
            "click",
            async function () {

                if (!isCurrentUserAdmin()) {

                    showToast(
                        "No tienes permisos de administrador.",
                        "error"
                    );

                    return;
                }

                await loadAdminUsers();
                await loadAdminPublications();
                await updateAdminStatistics();

            }
        );
    }

}


/* =========================================================
   CARGAR USUARIOS
   ========================================================= */

async function loadAdminUsers() {

    if (!isCurrentUserAdmin()) {
        return;
    }

    if (!adminUsersList) {
        return;
    }

    adminUsersList.innerHTML = `
        <div class="admin-loading">
            Cargando usuarios...
        </div>
    `;

    try {

        const { data, error } =
            await supabaseClient
                .from("profiles")
                .select(`
                    id,
                    name,
                    cedula,
                    phone,
                    role,
                    is_admin,
                    status,
                    created_at,
                    last_seen_at
                `)
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );

        if (error) {
            throw error;
        }

        adminUsersCache =
            data || [];

        renderAdminUsers(
            adminUsersCache
        );

    } catch (error) {

        console.error(
            "Error cargando usuarios:",
            error
        );

        adminUsersList.innerHTML = `
            <div class="admin-empty">
                No se pudieron cargar los usuarios.
            </div>
        `;
    }
}


/* =========================================================
   RENDER USUARIOS
   ========================================================= */

function renderAdminUsers(
    users
) {

    if (!adminUsersList) {
        return;
    }

    if (!users || users.length === 0) {

        adminUsersList.innerHTML = `
            <div class="admin-empty">
                No hay usuarios registrados.
            </div>
        `;

        return;
    }

    adminUsersList.innerHTML =
        users.map(function (user) {

            const status =
                user.status ||
                "active";

            let statusText =
                "Activo";

            if (status === "blocked") {
                statusText =
                    "Bloqueado";
            }

            if (status === "suspended") {
                statusText =
                    "Suspendido";
            }

            if (status === "deleted") {
                statusText =
                    "Eliminado";
            }

            if (status === "pending") {
                statusText =
                    "Pendiente";
            }

            const isAdmin =
                user.role === "admin" ||
                user.is_admin === true;

            return `
                <article
                    class="admin-user-card"
                    data-user-id="${escapeHTML(
                        String(user.id)
                    )}"
                >

                    <div class="admin-user-header">

                        <div class="admin-user-avatar">
                            ${escapeHTML(
                                getInitials(
                                    user.name ||
                                    "Usuario"
                                )
                            )}
                        </div>

                        <div class="admin-user-main">

                            <strong>
                                ${escapeHTML(
                                    user.name ||
                                    "Sin nombre"
                                )}
                            </strong>

                            ${
                                isAdmin
                                ? `
                                    <span class="admin-badge">
                                        ADMIN
                                    </span>
                                `
                                : ""
                            }

                            <small>
                                ${escapeHTML(
                                    user.phone ||
                                    "Sin teléfono"
                                )}
                            </small>

                        </div>

                        <span
                            class="user-status user-status-${escapeHTML(
                                status
                            )}"
                        >
                            ${statusText}
                        </span>

                    </div>


                    <div class="admin-user-details">

                        <p>
                            <strong>
                                Cédula:
                            </strong>

                            ${escapeHTML(
                                user.cedula ||
                                "No disponible"
                            )}
                        </p>

                        <p>
                            <strong>
                                Registrado:
                            </strong>

                            ${formatDateTime(
                                user.created_at
                            )}
                        </p>

                        <p>
                            <strong>
                                Última conexión:
                            </strong>

                            ${
                                user.last_seen_at
                                ? formatDateTime(
                                    user.last_seen_at
                                )
                                : "Nunca"
                            }
                        </p>

                    </div>


                    <div class="admin-user-actions">

                        ${
                            status === "blocked"
                            ? `
                                <button
                                    type="button"
                                    class="admin-action-button success"
                                    data-user-action="unblock"
                                    data-user-id="${escapeHTML(
                                        String(user.id)
                                    )}"
                                >
                                    🔓 Desbloquear
                                </button>
                            `
                            : `
                                <button
                                    type="button"
                                    class="admin-action-button warning"
                                    data-user-action="block"
                                    data-user-id="${escapeHTML(
                                        String(user.id)
                                    )}"
                                >
                                    🔒 Bloquear
                                </button>
                            `
                        }


                        ${
                            status === "suspended"
                            ? `
                                <button
                                    type="button"
                                    class="admin-action-button success"
                                    data-user-action="activate"
                                    data-user-id="${escapeHTML(
                                        String(user.id)
                                    )}"
                                >
                                    ▶️ Reactivar
                                </button>
                            `
                            : `
                                ${
                                    status !== "deleted"
                                    ? `
                                        <button
                                            type="button"
                                            class="admin-action-button warning"
                                            data-user-action="suspend"
                                            data-user-id="${escapeHTML(
                                                String(user.id)
                                            )}"
                                        >
                                            ⏸ Suspender
                                        </button>
                                    `
                                    : ""
                                }
                            `
                        }


                        ${
                            status !== "deleted"
                            ? `
                                <button
                                    type="button"
                                    class="admin-action-button danger"
                                    data-user-action="delete"
                                    data-user-id="${escapeHTML(
                                        String(user.id)
                                    )}"
                                >
                                    🗑 Eliminar
                                </button>
                            `
                            : `
                                <button
                                    type="button"
                                    class="admin-action-button success"
                                    data-user-action="activate"
                                    data-user-id="${escapeHTML(
                                        String(user.id)
                                    )}"
                                >
                                    ♻️ Reactivar
                                </button>
                            `
                        }

                    </div>

                </article>
            `;

        }).join("");

    bindAdminUserActions();
}


/* =========================================================
   INICIALES
   ========================================================= */

function getInitials(
    name
) {

    if (!name) {
        return "MF";
    }

    const parts =
        String(name)
            .trim()
            .split(/\s+/)
            .filter(Boolean);

    if (parts.length === 1) {
        return parts[0]
            .substring(0, 2)
            .toUpperCase();
    }

    return (
        parts[0][0] +
        parts[parts.length - 1][0]
    ).toUpperCase();
}


/* =========================================================
   ACCIONES DE USUARIO
   ========================================================= */

function bindAdminUserActions() {

    if (!adminUsersList) {
        return;
    }

    const buttons =
        adminUsersList.querySelectorAll(
            "[data-user-action]"
        );

    buttons.forEach(function (button) {

        button.addEventListener(
            "click",
            async function () {

                const userId =
                    button.dataset.userId;

                const action =
                    button.dataset.userAction;

                await processAdminUserAction(
                    userId,
                    action
                );

            }
        );

    });
}


/* =========================================================
   PROCESAR USUARIO
   ========================================================= */

async function processAdminUserAction(
    userId,
    action
) {

    if (!isCurrentUserAdmin()) {

        showToast(
            "No tienes permisos de administrador.",
            "error"
        );

        return;
    }

    if (
        String(userId) ===
        String(currentUser?.id)
    ) {

        showToast(
            "No puedes modificar tu propia cuenta desde aquí.",
            "error"
        );

        return;
    }

    const user =
        adminUsersCache.find(function (item) {
            return String(item.id) ===
                String(userId);
        });

    if (!user) {
        return;
    }

    let newStatus =
        user.status || "active";

    let confirmation =
        "";

    switch (action) {

        case "block":

            newStatus =
                "blocked";

            confirmation =
                "¿Quieres bloquear este usuario?";

            break;

        case "unblock":

            newStatus =
                "active";

            confirmation =
                "¿Quieres desbloquear este usuario?";

            break;

        case "suspend":

            newStatus =
                "suspended";

            confirmation =
                "¿Quieres suspender este usuario?";

            break;

        case "activate":

            newStatus =
                "active";

            confirmation =
                "¿Quieres reactivar este usuario?";

            break;

        case "delete":

            newStatus =
                "deleted";

            confirmation =
                "¿Quieres eliminar esta cuenta?";

            break;

        default:
            return;
    }

    if (!window.confirm(confirmation)) {
        return;
    }

    try {

        showLoading(
            "Actualizando usuario..."
        );

        const { error } =
            await supabaseClient
                .from("profiles")
                .update({
                    status:
                        newStatus
                })
                .eq(
                    "id",
                    userId
                );

        if (error) {
            throw error;
        }

        await createAdminActionNotification(
            userId,
            action
        );

        await loadAdminUsers();
        await updateAdminStatistics();

        showToast(
            "Usuario actualizado correctamente.",
            "success"
        );

    } catch (error) {

        console.error(
            "Error actualizando usuario:",
            error
        );

        showToast(
            "No se pudo actualizar el usuario.",
            "error"
        );

    } finally {

        hideLoading();
    }
}


/* =========================================================
   NOTIFICACIÓN DE ACCIÓN ADMIN
   ========================================================= */

async function createAdminActionNotification(
    userId,
    action
) {

    let title =
        "Actualización de cuenta";

    let message =
        "Tu cuenta ha sido actualizada.";

    if (action === "block") {

        title =
            "Cuenta bloqueada";

        message =
            "Tu cuenta de Market Flash ha sido bloqueada por un administrador.";

    }

    if (action === "unblock") {

        title =
            "Cuenta desbloqueada";

        message =
            "Tu cuenta de Market Flash ha sido desbloqueada.";

    }

    if (action === "suspend") {

        title =
            "Cuenta suspendida";

        message =
            "Tu cuenta de Market Flash ha sido suspendida.";

    }

    if (action === "activate") {

        title =
            "Cuenta reactivada";

        message =
            "Tu cuenta de Market Flash ha sido reactivada.";

    }

    if (action === "delete") {

        title =
            "Cuenta eliminada";

        message =
            "Tu cuenta de Market Flash ha sido marcada como eliminada.";

    }

    try {

        await supabaseClient
            .from("notifications")
            .insert({
                user_id:
                    userId,

                type:
                    "admin_account_action",

                title:
                    title,

                message:
                    message,

                is_read:
                    false
            });

    } catch (error) {

        console.warn(
            "No se pudo crear la notificación:",
            error
        );
    }
}


/* =========================================================
   CARGAR PUBLICACIONES ADMIN
   ========================================================= */

async function loadAdminPublications() {

    if (!isCurrentUserAdmin()) {
        return;
    }

    if (!adminPublicationsList) {
        return;
    }

    adminPublicationsList.innerHTML = `
        <div class="admin-loading">
            Cargando publicaciones...
        </div>
    `;

    try {

        const { data, error } =
            await supabaseClient
                .from("publications")
                .select(`
                    id,
                    title,
                    category,
                    price,
                    quantity,
                    location,
                    status,
                    is_flash,
                    views_count,
                    likes_count,
                    saves_count,
                    created_at,
                    seller_id,
                    profiles:seller_id (
                        name,
                        phone
                    )
                `)
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );

        if (error) {
            throw error;
        }

        adminPublicationsCache =
            data || [];

        renderAdminPublications(
            adminPublicationsCache
        );

    } catch (error) {

        console.error(
            "Error cargando publicaciones:",
            error
        );

        adminPublicationsList.innerHTML = `
            <div class="admin-empty">
                No se pudieron cargar las publicaciones.
            </div>
        `;
    }
}


/* =========================================================
   RENDER PUBLICACIONES
   ========================================================= */

function renderAdminPublications(
    publications
) {

    if (!adminPublicationsList) {
        return;
    }

    if (
        !publications ||
        publications.length === 0
    ) {

        adminPublicationsList.innerHTML = `
            <div class="admin-empty">
                No hay publicaciones.
            </div>
        `;

        return;
    }

    adminPublicationsList.innerHTML =
        publications.map(function (
            publication
        ) {

            const seller =
                publication.profiles ||
                {};

            const status =
                publication.status ||
                "published";

            let statusText =
                "Publicada";

            if (status === "review") {
                statusText =
                    "En revisión";
            }

            if (status === "pending") {
                statusText =
                    "Pendiente";
            }

            if (status === "deleted") {
                statusText =
                    "Eliminada";
            }

            if (status === "draft") {
                statusText =
                    "Borrador";
            }

            return `
                <article
                    class="admin-publication-card"
                    data-publication-id="${escapeHTML(
                        String(publication.id)
                    )}"
                >

                    <div class="admin-publication-header">

                        <div>

                            <strong>
                                ${escapeHTML(
                                    publication.title ||
                                    "Sin título"
                                )}
                            </strong>

                            <small>
                                ${escapeHTML(
                                    seller.name ||
                                    "Vendedor"
                                )}
                            </small>

                        </div>

                        <span
                            class="publication-status publication-status-${escapeHTML(
                                status
                            )}"
                        >
                            ${statusText}
                        </span>

                    </div>


                    <div class="admin-publication-info">

                        <p>
                            <strong>
                                Precio:
                            </strong>

                            ${formatMoney(
                                publication.price
                            )}
                        </p>

                        <p>
                            <strong>
                                Categoría:
                            </strong>

                            ${escapeHTML(
                                publication.category ||
                                "Sin categoría"
                            )}
                        </p>

                        <p>
                            <strong>
                                Ubicación:
                            </strong>

                            ${escapeHTML(
                                publication.location ||
                                "No indicada"
                            )}
                        </p>

                        <p>
                            <strong>
                                Publicada:
                            </strong>

                            ${formatDateTime(
                                publication.created_at
                            )}
                        </p>

                    </div>


                    <div class="admin-publication-metrics">

                        <span>
                            👁
                            ${Number(
                                publication.views_count || 0
                            )}
                        </span>

                        <span>
                            ❤️
                            ${Number(
                                publication.likes_count || 0
                            )}
                        </span>

                        <span>
                            🔖
                            ${Number(
                                publication.saves_count || 0
                            )}
                        </span>

                        ${
                            publication.is_flash
                            ? `
                                <span class="flash-mini-badge">
                                    ⚡ FLASH
                                </span>
                            `
                            : ""
                        }

                    </div>


                    <div class="admin-publication-actions">

                        ${
                            status === "published"
                            ? `
                                <button
                                    type="button"
                                    class="admin-action-button warning"
                                    data-publication-action="review"
                                    data-publication-id="${escapeHTML(
                                        String(publication.id)
                                    )}"
                                >
                                    🔎 En revisión
                                </button>
                            `
                            : ""
                        }


                        ${
                            status === "review" ||
                            status === "pending"
                            ? `
                                <button
                                    type="button"
                                    class="admin-action-button success"
                                    data-publication-action="publish"
                                    data-publication-id="${escapeHTML(
                                        String(publication.id)
                                    )}"
                                >
                                    ✅ Publicar
                                </button>
                            `
                            : ""
                        }


                        ${
                            status === "deleted"
                            ? `
                                <button
                                    type="button"
                                    class="admin-action-button success"
                                    data-publication-action="restore"
                                    data-publication-id="${escapeHTML(
                                        String(publication.id)
                                    )}"
                                >
                                    ♻️ Restaurar
                                </button>
                            `
                            : `
                                <button
                                    type="button"
                                    class="admin-action-button danger"
                                    data-publication-action="delete"
                                    data-publication-id="${escapeHTML(
                                        String(publication.id)
                                    )}"
                                >
                                    🗑 Eliminar
                                </button>
                            `
                        }

                    </div>

                </article>
            `;

        }).join("");

    bindAdminPublicationActions();
}


/* =========================================================
   ACCIONES PUBLICACIONES
   ========================================================= */

function bindAdminPublicationActions() {

    if (!adminPublicationsList) {
        return;
    }

    const buttons =
        adminPublicationsList.querySelectorAll(
            "[data-publication-action]"
        );

    buttons.forEach(function (button) {

        button.addEventListener(
            "click",
            async function () {

                const publicationId =
                    button.dataset.publicationId;

                const action =
                    button.dataset.publicationAction;

                await processAdminPublicationAction(
                    publicationId,
                    action
                );

            }
        );

    });
}


/* =========================================================
   PROCESAR PUBLICACIÓN
   ========================================================= */

async function processAdminPublicationAction(
    publicationId,
    action
) {

    if (!isCurrentUserAdmin()) {

        showToast(
            "No tienes permisos de administrador.",
            "error"
        );

        return;
    }

    const publication =
        adminPublicationsCache.find(
            function (item) {
                return String(item.id) ===
                    String(publicationId);
            }
        );

    if (!publication) {
        return;
    }

    let newStatus =
        publication.status;

    let confirmation =
        "";

    if (action === "review") {

        newStatus =
            "review";

        confirmation =
            "¿Poner esta publicación en revisión?";

    } else if (action === "publish") {

        newStatus =
            "published";

        confirmation =
            "¿Publicar nuevamente esta publicación?";

    } else if (action === "delete") {

        newStatus =
            "deleted";

        confirmation =
            "¿Eliminar esta publicación?";

    } else if (action === "restore") {

        newStatus =
            "published";

        confirmation =
            "¿Restaurar esta publicación?";

    } else {

        return;
    }

    if (!window.confirm(confirmation)) {
        return;
    }

    try {

        showLoading(
            "Actualizando publicación..."
        );

        const updateData = {
            status:
                newStatus
        };

        /*
         * Cuando una publicación se elimina,
         * también dejamos de mostrarla como Flash.
         */

        if (
            action === "delete"
        ) {
            updateData.is_flash =
                false;
        }

        const { error } =
            await supabaseClient
                .from("publications")
                .update(
                    updateData
                )
                .eq(
                    "id",
                    publicationId
                );

        if (error) {
            throw error;
        }

        /*
         * Si la publicación fue eliminada,
         * desactivamos cualquier Flash activo.
         */

        if (
            action === "delete"
        ) {

            await supabaseClient
                .from("flash_promotions")
                .update({
                    status:
                        "cancelled"
                })
                .eq(
                    "publication_id",
                    publicationId
                )
                .eq(
                    "status",
                    "active"
                );
        }

        await createPublicationAdminNotification(
            publication,
            action
        );

        await loadAdminPublications();
        await updateAdminStatistics();

        if (
            typeof loadPublications ===
            "function"
        ) {
            await loadPublications();
        }

        showToast(
            "Publicación actualizada correctamente.",
            "success"
        );

    } catch (error) {

        console.error(
            "Error actualizando publicación:",
            error
        );

        showToast(
            "No se pudo actualizar la publicación.",
            "error"
        );

    } finally {

        hideLoading();
    }
}


/* =========================================================
   NOTIFICAR AL VENDEDOR
   ========================================================= */

async function createPublicationAdminNotification(
    publication,
    action
) {

    if (!publication.seller_id) {
        return;
    }

    let title =
        "Actualización de publicación";

    let message =
        "Tu publicación ha sido actualizada.";

    if (action === "review") {

        title =
            "Publicación en revisión";

        message =
            `Tu publicación "${publication.title}" ` +
            `ha sido puesta en revisión por un administrador.`;
    }

    if (action === "publish") {

        title =
            "Publicación aprobada";

        message =
            `Tu publicación "${publication.title}" ` +
            `ha sido publicada nuevamente.`;
    }

    if (action === "delete") {

        title =
            "Publicación eliminada";

        message =
            `Tu publicación "${publication.title}" ` +
            `ha sido eliminada por un administrador.`;
    }

    if (action === "restore") {

        title =
            "Publicación restaurada";

        message =
            `Tu publicación "${publication.title}" ` +
            `ha sido restaurada.`;
    }

    try {

        await supabaseClient
            .from("notifications")
            .insert({
                user_id:
                    publication.seller_id,

                type:
                    "admin_publication_action",

                title:
                    title,

                message:
                    message,

                related_id:
                    publication.id,

                is_read:
                    false
            });

    } catch (error) {

        console.warn(
            "No se pudo crear notificación:",
            error
        );
    }
}


/* =========================================================
   ESTADÍSTICAS ADMIN
   ========================================================= */

async function updateAdminStatistics() {

    if (!isCurrentUserAdmin()) {
        return;
    }

    try {

        const { count:
            totalUsers } =
            await supabaseClient
                .from("profiles")
                .select(
                    "id",
                    {
                        count: "exact",
                        head: true
                    }
                )
                .neq(
                    "status",
                    "deleted"
                );

        const { count:
            activeUsers } =
            await supabaseClient
                .from("profiles")
                .select(
                    "id",
                    {
                        count: "exact",
                        head: true
                    }
                )
                .eq(
                    "status",
                    "active"
                );

        const { count:
            totalPublications } =
            await supabaseClient
                .from("publications")
                .select(
                    "id",
                    {
                        count: "exact",
                        head: true
                    }
                )
                .neq(
                    "status",
                    "deleted"
                );

        const { count:
            totalFlashes } =
            await supabaseClient
                .from("flash_promotions")
                .select(
                    "id",
                    {
                        count: "exact",
                        head: true
                    }
                )
                .eq(
                    "status",
                    "active"
                );

        if (adminTotalUsers) {
            adminTotalUsers.textContent =
                String(
                    totalUsers || 0
                );
        }

        if (adminActiveUsers) {
            adminActiveUsers.textContent =
                String(
                    activeUsers || 0
                );
        }

        if (adminTotalPublications) {
            adminTotalPublications.textContent =
                String(
                    totalPublications || 0
                );
        }

        const adminTotalFlashes =
            $("admin-total-flashes");

        if (adminTotalFlashes) {
            adminTotalFlashes.textContent =
                String(
                    totalFlashes || 0
                );
        }

    } catch (error) {

        console.warn(
            "No se pudieron actualizar las estadísticas:",
            error
        );
    }
}


/* =========================================================
   BÚSQUEDA DE USUARIOS ADMIN
   ========================================================= */

function searchAdminUsers(
    searchText
) {

    const search =
        String(
            searchText || ""
        )
        .trim()
        .toLowerCase();

    if (!search) {

        renderAdminUsers(
            adminUsersCache
        );

        return;
    }

    const filtered =
        adminUsersCache.filter(
            function (user) {

                return (
                    String(
                        user.name || ""
                    )
                    .toLowerCase()
                    .includes(search)
                    ||

                    String(
                        user.cedula || ""
                    )
                    .toLowerCase()
                    .includes(search)
                    ||

                    String(
                        user.phone || ""
                    )
                    .toLowerCase()
                    .includes(search)
                );

            }
        );

    renderAdminUsers(
        filtered
    );
}


/* =========================================================
   CREAR BUSCADOR ADMIN AUTOMÁTICAMENTE
   ========================================================= */

function createAdminUserSearch() {

    if (!adminUsersList) {
        return;
    }

    let searchInput =
        document.getElementById(
            "admin-user-search"
        );

    if (searchInput) {
        return;
    }

    searchInput =
        document.createElement("input");

    searchInput.type =
        "search";

    searchInput.id =
        "admin-user-search";

    searchInput.className =
        "admin-search-input";

    searchInput.placeholder =
        "Buscar por nombre, cédula o teléfono...";

    adminUsersList.parentElement.insertBefore(
        searchInput,
        adminUsersList
    );

    searchInput.addEventListener(
        "input",
        function () {
            searchAdminUsers(
                searchInput.value
            );
        }
    );
}


/* =========================================================
   INICIAR ADMINISTRACIÓN
   ========================================================= */

initializeAdminManagement();

createAdminUserSearch();
