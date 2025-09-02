export function toast(message, bg = 'var(--secondary-color)') {
  const messageEl = document.createElement('div');
  messageEl.style.cssText = `
    position: fixed;
    top: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: ${bg};
    color: var(--bg-color);
    padding: 12px 20px;
    z-index: 1000;
    font-size: 0.9rem;
    animation: slideIn 0.3s ease-out;
  `;
  messageEl.textContent = message;
  document.body.appendChild(messageEl);
  setTimeout(() => {
    messageEl.style.animation = 'slideOut 0.3s ease-in forwards';
    setTimeout(() => messageEl.remove(), 300);
  }, 2000);
}

export function showThemeChangeNotification(themeName) {
  toast(`🎨 Theme changed to ${themeName.charAt(0).toUpperCase() + themeName.slice(1)}`, 'var(--primary-color)');
}

export function showGridChangeNotification(gridName) {
  const name = gridName.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  toast(`📐 Grid changed to ${name}`, 'var(--secondary-color)');
}

export function showJackNotification() {
  toast(`🧠 Moved to "I Know That Jack!" category`, 'var(--tertiary-color)');
}

export function showImportSuccess(count) {
  const el = document.createElement('div');
  el.style.cssText = `
    position: fixed;
    top: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(78, 205, 196, 0.9);
    color: white;
    padding: 12px 20px;
    z-index: 1000;
    font-size: 0.9rem;
  `;
  el.textContent = `✓ Imported ${count} facts successfully!`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

export function showDownloadSuccess(count) {
  const el = document.createElement('div');
  el.style.cssText = `
    position: fixed;
    top: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(78, 205, 196, 0.9);
    color: white;
    padding: 12px 20px;
    z-index: 1000;
    font-size: 0.9rem;
  `;
  el.textContent = `✓ Downloaded ${count} favorite facts!`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

export function createFloatingElements() {
  const container = document.createElement('div');
  container.className = 'floating-elements';
  for (let i = 0; i < 6; i++) {
    const element = document.createElement('div');
    element.className = 'floating-element';
    element.style.cssText = `
      width: ${Math.random() * 50 + 20}px;
      height: ${Math.random() * 50 + 20}px;
      background: var(--primary-color);
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      animation-delay: ${Math.random() * 10}s;
      animation-duration: ${Math.random() * 5 + 8}s;
    `;
    container.appendChild(element);
  }
  document.body.appendChild(container);
}