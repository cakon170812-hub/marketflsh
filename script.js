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
