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
}
