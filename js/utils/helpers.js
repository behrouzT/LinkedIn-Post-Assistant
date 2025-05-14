/**
 * LinkedIn Post Summarizer - Helper Utilities
 */

/**
 * Debounce function to limit execution frequency
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Check if a text contains RTL (Right-to-Left) characters
 * @param {string} text - Text to check
 * @returns {boolean} True if text contains RTL characters
 */
function isRTLLanguage(text) {
  // Check for RTL characters (Arabic, Persian, Hebrew etc.)
  const rtlChars = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;
  return rtlChars.test(text);
}

/**
 * Display a temporary notification on the page
 * @param {string} message - Message to display
 * @param {number} duration - Duration in milliseconds
 */
function showNotification(message, duration = 3000) {
  // Check if notification container exists, if not create it
  let notificationContainer = document.getElementById('linkedin-post-summarizer-notification');
  
  if (!notificationContainer) {
    notificationContainer = document.createElement('div');
    notificationContainer.id = 'linkedin-post-summarizer-notification';
    notificationContainer.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background-color: #0a66c2;
      color: white;
      padding: 10px 20px;
      border-radius: 5px;
      z-index: 10000;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      transition: opacity 0.3s ease-in-out;
      opacity: 0;
    `;
    document.body.appendChild(notificationContainer);
  }
  
  // Set message and show notification
  notificationContainer.textContent = message;
  notificationContainer.style.opacity = '1';
  
  // Hide notification after duration
  setTimeout(() => {
    notificationContainer.style.opacity = '0';
  }, duration);
}

/**
 * Generate a unique ID
 * @returns {string} Unique ID
 */
function generateUniqueId() {
  return 'id-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
} 