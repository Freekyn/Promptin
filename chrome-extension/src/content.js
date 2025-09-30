// Content script for PromptInSTYL Chrome Extension

// Inject a floating action button
function injectFloatingButton() {
  // Remove existing button if any
  const existingButton = document.getElementById('promptinstyl-floating-btn');
  if (existingButton) {
    existingButton.remove();
  }

  // Create floating button
  const button = document.createElement('div');
  button.id = 'promptinstyl-floating-btn';
  button.innerHTML = `
    <div style="
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
      z-index: 10000;
      transition: all 0.3s ease;
      font-size: 24px;
    " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
      🚀
    </div>
  `;

  // Add click handler
  button.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'openPopup' });
  });

  document.body.appendChild(button);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectFloatingButton);
} else {
  injectFloatingButton();
}

// Re-inject if content changes (for SPAs)
const observer = new MutationObserver(() => {
  const existingButton = document.getElementById('promptinstyl-floating-btn');
  if (!existingButton) {
    injectFloatingButton();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
