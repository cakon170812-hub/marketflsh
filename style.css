/* =========================================================
   MARKET FLASH — style.css
   Diseño completo, grande, moderno y responsive
   ========================================================= */

:root {
  --primary: #ff5a1f;
  --primary-dark: #e9470d;
  --secondary: #ffb703;
  --accent: #7c3aed;
  --success: #16a34a;
  --danger: #dc2626;
  --info: #2563eb;

  --bg: #f6f7fb;
  --card: #ffffff;
  --text: #171717;
  --muted: #6b7280;
  --border: #e5e7eb;

  --shadow-sm: 0 2px 8px rgba(0, 0, 0, .07);
  --shadow: 0 8px 25px rgba(0, 0, 0, .09);
  --shadow-lg: 0 15px 45px rgba(0, 0, 0, .14);

  --radius-sm: 10px;
  --radius: 16px;
  --radius-lg: 22px;

  --nav-height: 72px;
}

/* =========================================================
   RESET
   ========================================================= */

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  scroll-behavior: smooth;
}

body {
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  font-family: Arial, Helvetica, sans-serif;
  font-size: 16px;
  line-height: 1.5;
}

button,
input,
textarea,
select {
  font: inherit;
}

button {
  cursor: pointer;
}

img {
  max-width: 100%;
  display: block;
}

a {
  color: inherit;
  text-decoration: none;
}

.hidden {
  display: none !important;
}

/* =========================================================
   GENERAL
   ========================================================= */

.text-center {
  text-align: center;
}

.text-muted {
  color: var(--muted);
}

.mt-1 { margin-top: 8px; }
.mt-2 { margin-top: 16px; }
.mt-3 { margin-top: 24px; }

.mb-1 { margin-bottom: 8px; }
.mb-2 { margin-bottom: 16px; }
.mb-3 { margin-bottom: 24px; }

.flex {
  display: flex;
}

.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.gap-1 { gap: 8px; }
.gap-2 { gap: 16px; }
.gap-3 { gap: 24px; }

/* =========================================================
   APP / PAGES
   ========================================================= */

.app-shell {
  min-height: 100vh;
  width: 100%;
}

.page {
  display: none;
  min-height: 100vh;
}

.page.active {
  display: block;
}

.page-container {
  width: min(1200px, 100%);
  margin: 0 auto;
  padding: 24px 16px calc(var(--nav-height) + 30px);
}

/* =========================================================
   TOP BAR
   ========================================================= */

.topbar {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: rgba(255, 255, 255, .96);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--border);
  box-shadow: 0 3px 15px rgba(0, 0, 0, .06);
}

.topbar-inner {
  width: min(1200px, 100%);
  min-height: 78px;
  margin: 0 auto;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 11px;
  min-width: 0;
}

.brand-mark {
  width: 52px;
  height: 52px;
  flex: 0 0 52px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: #fff;
  font-size: 27px;
  font-weight: 900;
  box-shadow: 0 7px 18px rgba(255, 90, 31, .28);
}

.brand-text {
  min-width: 0;
}

.brand-title {
  color: var(--primary);
  font-size: 27px;
  line-height: 1;
  font-weight: 900;
  letter-spacing: -.8px;
}

.brand-subtitle {
  margin-top: 3px;
  color: var(--muted);
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-btn {
  position: relative;
  width: 46px;
  height: 46px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: #fff;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  transition: .2s;
}

.icon-btn:hover {
  transform: translateY(-1px);
  border-color: var(--primary);
  color: var(--primary);
}

#notificationBadge {
  position: absolute;
  top: -4px;
  right: -3px;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border-radius: 50px;
  background: var(--danger);
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* =========================================================
   SEARCH
   ========================================================= */

.search-wrapper {
  margin: 20px 0;
  position: relative;
}

#searchInput {
  width: 100%;
  height: 56px;
  padding: 0 20px;
  border: 2px solid var(--border);
  border-radius: 18px;
  outline: none;
  background: #fff;
  font-size: 17px;
  transition: .2s;
  box-shadow: var(--shadow-sm);
}

#searchInput:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(255, 90, 31, .10);
}

/* =========================================================
   CATEGORIES
   ========================================================= */

.categories {
  display: flex;
  gap: 9px;
  overflow-x: auto;
  padding: 3px 1px 10px;
  scrollbar-width: none;
}

.categories::-webkit-scrollbar {
  display: none;
}

.category-btn {
  flex: 0 0 auto;
  border: 1px solid var(--border);
  background: #fff;
  color: #444;
  border-radius: 50px;
  padding: 11px 17px;
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
  transition: .2s;
}

.category-btn:hover {
  border-color: var(--primary);
}

.category-btn.active {
  border-color: var(--primary);
  background: var(--primary);
  color: #fff;
  box-shadow: 0 5px 14px rgba(255, 90, 31, .22);
}

/* =========================================================
   PROMO BANNER
   ========================================================= */

.promo-banner {
  margin: 20px 0 26px;
  padding: 24px;
  border-radius: 22px;
  color: #fff;
  background:
    linear-gradient(135deg, rgba(255, 90, 31, .98), rgba(124, 58, 237, .94));
  box-shadow: var(--shadow);
  overflow: hidden;
  position: relative;
}

.promo-banner::after {
  content: "";
  position: absolute;
  width: 150px;
  height: 150px;
  right: -45px;
  top: -55px;
  border-radius: 50%;
  background: rgba(255, 255, 255, .12);
}

.promo-banner h2,
.promo-banner h3 {
  position: relative;
  z-index: 1;
}

.promo-banner p {
  margin-top: 5px;
  position: relative;
  z-index: 1;
  opacity: .93;
}

/* =========================================================
   SECTION HEADERS
   ========================================================= */

.section-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin: 24px 0 16px;
}

.section-title {
  font-size: 24px;
  font-weight: 900;
  letter-spacing: -.4px;
}

.section-subtitle {
  margin-top: 3px;
  color: var(--muted);
  font-size: 14px;
}

.publication-count {
  color: var(--primary);
  font-weight: 800;
  white-space: nowrap;
}

/* =========================================================
   PRODUCT GRID
   ========================================================= */

#productsGrid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

#emptyProducts {
  padding: 45px 20px;
  text-align: center;
  color: var(--muted);
}

/* =========================================================
   PRODUCT CARD
   ========================================================= */

.product-card {
  min-width: 0;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: transform .2s, box-shadow .2s;
}

.product-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow);
}

.product-image-container {
  position: relative;
  width: 100%;
  height: 175px;
  background: #f0f1f4;
  overflow: hidden;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-no-image {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 42px;
}

.image-count {
  position: absolute;
  left: 9px;
  bottom: 9px;
  padding: 5px 9px;
  border-radius: 50px;
  background: rgba(0, 0, 0, .62);
  color: #fff;
  font-size: 11px;
  font-weight: 800;
}

.product-card-body {
  padding: 13px;
}

.product-category {
  color: var(--primary);
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: .4px;
}

.product-price {
  margin-top: 3px;
  font-size: 21px;
  font-weight: 900;
  color: #111;
}

.product-location {
  margin-top: 4px;
  color: var(--muted);
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 7px;
  margin-top: 12px;
}

.product-actions button {
  min-height: 40px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: #fff;
  font-size: 12px;
  font-weight: 800;
  transition: .2s;
}

.product-actions button:hover {
  transform: translateY(-1px);
}

.like-btn.active,
.like-large-btn.active {
  color: var(--primary);
  border-color: var(--primary);
  background: rgba(255, 90, 31, .08);
}

.dislike-btn.active,
.dislike-large-btn.active {
  color: var(--danger);
  border-color: var(--danger);
  background: rgba(220, 38, 38, .07);
}

.chat-product-btn,
.chat-large-btn {
  color: var(--accent);
  border-color: rgba(124, 58, 237, .25) !important;
}

.whatsapp-btn,
.whatsapp-large-btn {
  color: var(--success);
  border-color: rgba(22, 163, 74, .28) !important;
}

/* =========================================================
   BUTTONS
   ========================================================= */

.primary-btn,
.secondary-btn,
.danger-btn,
.full-btn {
  min-height: 48px;
  border-radius: 13px;
  padding: 12px 18px;
  font-weight: 800;
  border: none;
  transition: .2s;
}

.primary-btn,
.full-btn {
  background: var(--primary);
  color: #fff;
  box-shadow: 0 5px 14px rgba(255, 90, 31, .20);
}

.primary-btn:hover,
.full-btn:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
}

.secondary-btn {
  background: #fff;
  color: #333;
  border: 1px solid var(--border);
}

.secondary-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.danger-btn {
  background: var(--danger);
  color: #fff;
}

.danger-btn:hover {
  filter: brightness(.93);
}

.full-btn {
  width: 100%;
}

/* =========================================================
   FORMS
   ========================================================= */

.form-card {
  max-width: 650px;
  margin: 0 auto;
  padding: 24px;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 22px;
  box-shadow: var(--shadow);
}

.form-group {
  margin-bottom: 18px;
}

.form-group label {
  display: block;
  margin-bottom: 7px;
  font-size: 14px;
  font-weight: 800;
  color: #333;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  min-height: 50px;
  padding: 12px 14px;
  border: 2px solid var(--border);
  border-radius: 13px;
  background: #fff;
  color: #222;
  outline: none;
  font-size: 16px;
  transition: .2s;
}

.form-group textarea {
  min-height: 120px;
  resize: vertical;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(255, 90, 31, .09);
}

/* =========================================================
   IMAGE UPLOAD
   ========================================================= */

.image-upload-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 10px;
}

.image-upload-btn {
  min-height: 100px;
  border: 2px dashed #d5d7dc;
  border-radius: 17px;
  background: #fafafa;
  color: #444;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-weight: 800;
  transition: .2s;
}

.image-upload-btn:hover {
  border-color: var(--primary);
  background: rgba(255, 90, 31, .04);
  color: var(--primary);
}

.upload-icon {
  font-size: 30px;
}

#imagePreview {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 9px;
  margin-top: 14px;
}

.preview-image-wrapper {
  position: relative;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  background: #eee;
}

.preview-image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-image-wrapper button {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 50%;
  background: rgba(0, 0, 0, .7);
  color: #fff;
  font-weight: 900;
}

/* =========================================================
   AUTH
   ========================================================= */

.auth-page {
  min-height: 100vh;
  padding: 30px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at top left, rgba(255, 183, 3, .18), transparent 35%),
    radial-gradient(circle at bottom right, rgba(124, 58, 237, .15), transparent 35%),
    var(--bg);
}

.auth-card {
  width: min(440px, 100%);
  padding: 30px 24px;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 25px;
  box-shadow: var(--shadow-lg);
}

.auth-logo-circle {
  width: 80px;
  height: 80px;
  margin: 0 auto 16px;
  border-radius: 25px;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 38px;
  font-weight: 900;
  box-shadow: 0 10px 25px rgba(255, 90, 31, .25);
}

.auth-card h1,
.auth-card h2 {
  text-align: center;
  font-size: 27px;
  font-weight: 900;
}

.auth-subtitle {
  margin: 7px 0 23px;
  color: var(--muted);
  text-align: center;
}

.auth-links {
  margin-top: 17px;
  display: flex;
  flex-direction: column;
  gap: 9px;
  text-align: center;
}

.auth-links button {
  border: 0;
  background: transparent;
  color: var(--primary);
  font-weight: 800;
}

/* =========================================================
   PROFILE
   ========================================================= */

.profile-card {
  max-width: 700px;
  margin: 0 auto;
  overflow: hidden;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 23px;
  box-shadow: var(--shadow);
}

.profile-header {
  padding: 30px 20px;
  text-align: center;
  color: #fff;
  background: linear-gradient(135deg, var(--primary), var(--accent));
}

.profile-avatar {
  width: 105px;
  height: 105px;
  margin: 0 auto 13px;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid rgba(255, 255, 255, .9);
  background: #fff;
  box-shadow: var(--shadow);
}

#profileAvatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

#profileName {
  font-size: 23px;
  font-weight: 900;
}

#profilePhone {
  margin-top: 3px;
  opacity: .9;
}

.profile-body {
  padding: 22px;
}

/* =========================================================
   BOTTOM NAV
   ========================================================= */

.bottom-nav {
  position: fixed;
  z-index: 1100;
  left: 0;
  right: 0;
  bottom: 0;
  height: var(--nav-height);
  background: rgba(255, 255, 255, .97);
  backdrop-filter: blur(15px);
  border-top: 1px solid var(--border);
  box-shadow: 0 -5px 20px rgba(0, 0, 0, .07);
}

.bottom-nav-inner {
  width: min(700px, 100%);
  height: 100%;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
}

.nav-item {
  border: 0;
  background: transparent;
  color: #7b7f87;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  font-size: 11px;
  font-weight: 700;
}

.nav-icon {
  font-size: 22px;
  line-height: 1;
}

.nav-item.active {
  color: var(--primary);
}

/* =========================================================
   PRODUCT DETAIL
   ========================================================= */

.detail-card {
  max-width: 850px;
  margin: 0 auto;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 23px;
  overflow: hidden;
  box-shadow: var(--shadow);
}

.detail-images {
  background: #f1f2f4;
}

.detail-main-image {
  width: 100%;
  height: 320px;
  object-fit: contain;
  background: #f1f2f4;
  cursor: zoom-in;
}

.expand-image-hint {
  padding: 8px;
  text-align: center;
  color: var(--muted);
  font-size: 12px;
  background: #fff;
}

.detail-thumbnails {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 10px;
  background: #fff;
}

.detail-thumbnails button {
  flex: 0 0 65px;
  width: 65px;
  height: 65px;
  padding: 0;
  border: 2px solid transparent;
  border-radius: 10px;
  overflow: hidden;
  background: #eee;
}

.detail-thumbnails button.active {
  border-color: var(--primary);
}

.detail-thumbnails img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.detail-no-image {
  height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #aaa;
  font-size: 55px;
}

.detail-body {
  padding: 22px;
}

.detail-body h1 {
  font-size: 27px;
  line-height: 1.15;
}

.detail-price {
  margin-top: 8px;
  font-size: 30px;
  color: var(--primary);
  font-weight: 900;
}

.detail-location {
  margin-top: 6px;
  color: var(--muted);
}

.detail-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 18px 0;
}

.detail-stats span {
  padding: 8px 12px;
  border-radius: 50px;
  background: #f5f5f6;
  color: #555;
  font-size: 13px;
  font-weight: 700;
}

.detail-description {
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid var(--border);
  white-space: pre-wrap;
}

.detail-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 9px;
  margin-top: 20px;
}

.detail-actions button {
  min-height: 48px;
  border-radius: 12px;
  font-weight: 800;
  background: #fff;
  border: 1px solid var(--border);
}

.owner-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 14px;
}

.edit-product-btn {
  background: #eff6ff !important;
  color: var(--info);
  border-color: #bfdbfe !important;
}

.delete-product-btn {
  background: #fef2f2 !important;
  color: var(--danger);
  border-color: #fecaca !important;
}

/* =========================================================
   CHAT
   ========================================================= */

.chat-list {
  max-width: 750px;
  margin: 0 auto;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 20px;
  overflow: hidden;
}

.chat-list-item {
  min-height: 80px;
  padding: 13px 15px;
  display: flex;
  align-items: center;
  gap: 13px;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
}

.chat-list-item:last-child {
  border-bottom: 0;
}

.chat-list-item:hover {
  background: #fafafa;
}

.chat-list-avatar {
  width: 52px;
  height: 52px;
  flex: 0 0 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 21px;
  font-weight: 900;
}

.chat-list-info {
  min-width: 0;
  flex: 1;
}

.chat-list-info strong {
  display: block;
  font-size: 16px;
}

.chat-list-info span {
  display: block;
  margin-top: 2px;
  color: var(--muted);
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-header {
  max-width: 750px;
  margin: 0 auto;
  padding: 15px;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 18px 18px 0 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.chat-header-info {
  min-width: 0;
}

#chatUserName {
  font-size: 18px;
  font-weight: 900;
}

#chatProductName {
  color: var(--muted);
  font-size: 12px;
}

#messagesContainer {
  max-width: 750px;
  height: 52vh;
  margin: 0 auto;
  padding: 18px;
  background: #eef1f5;
  overflow-y: auto;
  border-left: 1px solid var(--border);
  border-right: 1px solid var(--border);
}

.message {
  display: flex;
  margin-bottom: 11px;
}

.message.mine {
  justify-content: flex-end;
}

.message.received {
  justify-content: flex-start;
}

.message-bubble {
  max-width: 78%;
  padding: 10px 13px;
  border-radius: 16px;
  font-size: 14px;
  box-shadow: var(--shadow-sm);
}

.message.mine .message-bubble {
  background: var(--primary);
  color: #fff;
  border-bottom-right-radius: 4px;
}

.message.received .message-bubble {
  background: #fff;
  color: #222;
  border-bottom-left-radius: 4px;
}

.message-time {
  display: block;
  margin-top: 3px;
  font-size: 10px;
  opacity: .65;
}

.chat-input-area {
  max-width: 750px;
  margin: 0 auto;
  padding: 10px;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 0 0 18px 18px;
  display: flex;
  gap: 8px;
}

#chatMessageInput {
  flex: 1;
  min-width: 0;
  height: 48px;
  padding: 0 14px;
  border: 2px solid var(--border);
  border-radius: 14px;
  outline: none;
}

#chatMessageInput:focus {
  border-color: var(--primary);
}

.chat-send-btn {
  width: 50px;
  height: 48px;
  border: 0;
  border-radius: 14px;
  background: var(--primary);
  color: #fff;
  font-size: 20px;
  font-weight: 900;
}

/* =========================================================
   NOTIFICATIONS
   ========================================================= */

#notificationsPanel {
  position: fixed;
  z-index: 2000;
  top: 78px;
  right: 12px;
  width: min(390px, calc(100vw - 24px));
  max-height: 75vh;
  overflow-y: auto;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 18px;
  box-shadow: var(--shadow-lg);
}

#notificationsPanel.hidden {
  display: none !important;
}

#notificationsPanel > div:first-child {
  position: sticky;
  top: 0;
  z-index: 2;
  padding: 15px;
  background: #fff;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

#closeNotificationsBtn {
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 50%;
  background: #f1f1f1;
}

.notification-item {
  padding: 15px;
  border-bottom: 1px solid var(--border);
}

.notification-item strong {
  display: block;
}

.notification-item p {
  margin-top: 3px;
  color: var(--muted);
  font-size: 13px;
}

.empty-notifications {
  padding: 35px 20px;
  text-align: center;
  color: var(--muted);
}

/* =========================================================
   ADMIN
   ========================================================= */

.admin-page {
  min-height: 100vh;
  background: #f4f5f8;
}

.admin-header {
  padding: 22px 16px;
  color: #fff;
  background: linear-gradient(135deg, #111827, #374151);
}

.admin-header h1 {
  font-size: 27px;
  font-weight: 900;
}

.admin-header p {
  margin-top: 4px;
  opacity: .75;
}

.admin-page > .page-container {
  padding-top: 18px;
}

.admin-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.admin-stat-card {
  padding: 17px;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 17px;
  box-shadow: var(--shadow-sm);
}

.admin-stat-card span {
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
}

.admin-stat-card strong {
  display: block;
  margin-top: 3px;
  font-size: 28px;
}

.admin-section {
  margin-bottom: 20px;
  padding: 18px;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 19px;
  box-shadow: var(--shadow-sm);
}

.admin-section-title {
  margin-bottom: 14px;
  font-size: 20px;
  font-weight: 900;
}

.admin-publication-card {
  padding: 13px;
  margin-bottom: 11px;
  border: 1px solid var(--border);
  border-radius: 15px;
  background: #fafafa;
}

.admin-publication-main {
  display: flex;
  align-items: center;
  gap: 12px;
}

.admin-publication-image {
  width: 75px;
  height: 75px;
  flex: 0 0 75px;
  border-radius: 12px;
  overflow: hidden;
  background: #e5e7eb;
}

.admin-publication-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.admin-publication-info {
  min-width: 0;
  flex: 1;
}

.admin-publication-info strong {
  display: block;
  font-size: 15px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.admin-publication-info p {
  margin-top: 3px;
  color: var(--muted);
  font-size: 12px;
}

.status-badge {
  display: inline-flex;
  margin-top: 5px;
  padding: 4px 8px;
  border-radius: 50px;
  font-size: 10px;
  font-weight: 900;
}

.status-approved {
  color: #166534;
  background: #dcfce7;
}

.status-pending {
  color: #92400e;
  background: #fef3c7;
}

.status-rejected {
  color: #991b1b;
  background: #fee2e2;
}

/* LOS 4 BOTONES SIEMPRE EN UNA SOLA FILA */

.admin-publication-actions {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
  margin-top: 12px;
}

.admin-action {
  min-width: 0;
  min-height: 39px;
  padding: 5px 3px;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: #fff;
  font-size: 10px;
  font-weight: 900;
  line-height: 1.1;
  transition: .2s;
}

.admin-action:hover {
  transform: translateY(-1px);
}

.receipt-action {
  color: var(--info);
  border-color: #bfdbfe;
  background: #eff6ff;
}

.approve-action {
  color: #166534;
  border-color: #bbf7d0;
  background: #f0fdf4;
}

.reject-action {
  color: #92400e;
  border-color: #fde68a;
  background: #fffbeb;
}

.delete-action {
  color: #991b1b;
  border-color: #fecaca;
  background: #fef2f2;
}

/* =========================================================
   PAYMENT METHODS
   ========================================================= */

.payment-method-card {
  padding: 14px;
  margin-bottom: 10px;
  border: 1px solid var(--border);
  border-radius: 15px;
  display: flex;
  align-items: center;
  gap: 11px;
}

.payment-method-info {
  flex: 1;
  min-width: 0;
}

.payment-method-info strong {
  display: block;
}

.payment-method-icon {
  width: 45px;
  height: 45px;
  flex: 0 0 45px;
  border-radius: 12px;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 21px;
}

.payment-method-price {
  margin-top: 3px;
  color: var(--primary);
  font-size: 14px;
  font-weight: 900;
}

.payment-method-actions {
  display: flex;
  gap: 5px;
}

.danger-icon-btn {
  width: 38px;
  height: 38px;
  border: 1px solid #fecaca;
  border-radius: 10px;
  background: #fef2f2;
  color: var(--danger);
}

/* =========================================================
   ADVERTISING
   ========================================================= */

.advertising-status-card {
  padding: 20px;
  border-radius: 18px;
  background: linear-gradient(135deg, #fff7ed, #fffbeb);
  border: 1px solid #fed7aa;
}

.admin-request-card {
  padding: 15px;
  margin-bottom: 10px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: #fff;
}

.request-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

/* =========================================================
   SWITCH
   ========================================================= */

.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  padding: 13px 0;
}

.switch {
  position: relative;
  width: 54px;
  height: 30px;
  flex: 0 0 54px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  inset: 0;
  cursor: pointer;
  border-radius: 50px;
  background: #d1d5db;
  transition: .2s;
}

.slider::before {
  content: "";
  position: absolute;
  width: 22px;
  height: 22px;
  left: 4px;
  top: 4px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2px 5px rgba(0, 0, 0, .2);
  transition: .2s;
}

.switch input:checked + .slider {
  background: var(--primary);
}

.switch input:checked + .slider::before {
  transform: translateX(24px);
}

/* =========================================================
   RECEIPT
   ========================================================= */

.receipt {
  padding: 22px;
  background: #fff;
  color: #111;
  border: 1px dashed #bbb;
  border-radius: 8px;
  font-family: Arial, Helvetica, sans-serif;
}

.receipt-header {
  padding-bottom: 15px;
  margin-bottom: 15px;
  text-align: center;
  border-bottom: 1px dashed #aaa;
}

.receipt-header h2 {
  font-size: 23px;
}

.receipt-row {
  display: flex;
  justify-content: space-between;
  gap: 15px;
  padding: 8px 0;
  border-bottom: 1px dotted #ddd;
}

/* =========================================================
   MODALS
   ========================================================= */

#modalOverlay,
#confirmModal,
#paymentMethodModal,
#receiptModal {
  position: fixed;
  z-index: 3000;
  inset: 0;
  padding: 18px;
  background: rgba(0, 0, 0, .60);
  display: flex;
  align-items: center;
  justify-content: center;
}

#modalOverlay.hidden,
#confirmModal.hidden,
#paymentMethodModal.hidden,
#receiptModal.hidden {
  display: none !important;
}

#modalContent {
  width: min(600px, 100%);
  max-height: 90vh;
  overflow-y: auto;
  padding: 22px;
  background: #fff;
  border-radius: 22px;
  box-shadow: var(--shadow-lg);
}

#confirmModal > div,
#paymentMethodModal > div,
#receiptModal > div {
  width: min(600px, 100%);
  max-height: 90vh;
  overflow-y: auto;
  padding: 22px;
  background: #fff;
  border-radius: 22px;
  box-shadow: var(--shadow-lg);
}

#confirmTitle,
#paymentModalTitle {
  font-size: 21px;
  font-weight: 900;
}

#confirmMessage {
  margin-top: 9px;
  color: var(--muted);
}

.confirm-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 20px;
}

/* =========================================================
   IMAGE FULLSCREEN VIEWER
   ========================================================= */

#imageViewer {
  position: fixed;
  z-index: 5000;
  inset: 0;
  background: rgba(0, 0, 0, .94);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

#imageViewer.hidden {
  display: none !important;
}

#fullScreenImage {
  max-width: 96vw;
  max-height: 88vh;
  width: auto;
  height: auto;
  object-fit: contain;
}

.image-viewer-close {
  position: absolute;
  top: 15px;
  right: 15px;
  width: 48px;
  height: 48px;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, .15);
  color: #fff;
  font-size: 25px;
}

#closeImageViewerBtn {
  position: absolute;
  top: 15px;
  right: 15px;
}

#imageViewerCounter {
  position: absolute;
  left: 50%;
  bottom: 18px;
  transform: translateX(-50%);
  padding: 6px 12px;
  border-radius: 50px;
  background: rgba(255, 255, 255, .15);
  color: #fff;
  font-size: 13px;
}

/* =========================================================
   TOAST
   ========================================================= */

#toast {
  position: fixed;
  z-index: 6000;
  left: 50%;
  bottom: calc(var(--nav-height) + 18px);
  transform: translate(-50%, 20px);
  max-width: calc(100vw - 30px);
  padding: 13px 18px;
  border-radius: 13px;
  background: #171717;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  text-align: center;
  box-shadow: var(--shadow-lg);
  opacity: 0;
  pointer-events: none;
  transition: .25s;
}

#toast.show {
  opacity: 1;
  transform: translate(-50%, 0);
}

/* =========================================================
   DESKTOP
   ========================================================= */

@media (min-width: 700px) {

  :root {
    --nav-height: 0px;
  }

  .page-container {
    padding: 30px 24px 50px;
  }

  .topbar-inner {
    min-height: 88px;
    padding: 13px 24px;
  }

  .brand-mark {
    width: 58px;
    height: 58px;
    flex-basis: 58px;
    font-size: 30px;
  }

  .brand-title {
    font-size: 32px;
  }

  .brand-subtitle {
    font-size: 12px;
  }

  #productsGrid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 18px;
  }

  .product-image-container {
    height: 220px;
  }

  .product-card-body {
    padding: 16px;
  }

  .product-price {
    font-size: 23px;
  }

  .product-actions {
    grid-template-columns: repeat(4, 1fr);
  }

  .bottom-nav {
    position: static;
    height: 64px;
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    box-shadow: none;
  }

  .bottom-nav-inner {
    max-width: 700px;
  }

  .nav-item {
    flex-direction: row;
    gap: 7px;
    font-size: 13px;
  }

  .nav-icon {
    font-size: 20px;
  }

  .detail-main-image {
    height: 400px;
  }

  .detail-no-image {
    height: 400px;
  }

  .admin-stats {
    grid-template-columns: repeat(4, 1fr);
  }

  .admin-section {
    padding: 22px;
  }

  #toast {
    bottom: 25px;
  }
}

/* =========================================================
   LARGE DESKTOP
   ========================================================= */

@media (min-width: 1050px) {

  #productsGrid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .product-image-container {
    height: 230px;
  }

  .page-container {
    padding-left: 30px;
    padding-right: 30px;
  }
}

/* =========================================================
   SMALL PHONES
   ========================================================= */

@media (max-width: 380px) {

  .brand-title {
    font-size: 23px;
  }

  .brand-mark {
    width: 46px;
    height: 46px;
    flex-basis: 46px;
    font-size: 23px;
    border-radius: 13px;
  }

  .icon-btn {
    width: 42px;
    height: 42px;
  }

  #productsGrid {
    gap: 9px;
  }

  .product-image-container {
    height: 150px;
  }

  .product-card-body {
    padding: 10px;
  }

  .product-price {
    font-size: 18px;
  }

  .product-actions {
    gap: 5px;
  }

  .product-actions button {
    font-size: 10px;
    min-height: 37px;
  }

  .admin-publication-actions {
    gap: 4px;
  }

  .admin-action {
    font-size: 9px;
  }
}
