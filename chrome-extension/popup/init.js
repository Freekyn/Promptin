// Chrome Extension Initialization Script
// This file handles the initialization of the PromptInSTYLExtension

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  // Small delay to ensure Firebase is loaded
  setTimeout(() => {
    if (typeof PromptInSTYLExtension !== 'undefined') {
      new PromptInSTYLExtension();
    } else {
      console.error('PromptInSTYLExtension class not found');
    }
  }, 100);
});
