/**
 * LinkedIn Post Summarizer - Background Script
 * Handles extension initialization and background tasks
 */

// Initialize settings when extension is installed or updated
chrome.runtime.onInstalled.addListener(async () => {
  // Initialize storage with default settings
  chrome.storage.local.set({
    enabled: true,
    model: 'gpt-3.5-turbo',
    summaryLength: 'medium',
    translateSummaries: false
  }, () => {
    console.log('LinkedIn Post Summarizer initialized with default settings');
  });
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'getStatus':
      // Return current status
      chrome.storage.local.get(
        ['enabled', 'apiKey', 'model', 'summaryLength', 'translateSummaries'], 
        (data) => {
          sendResponse({
            enabled: data.enabled === undefined ? true : data.enabled,
            hasApiKey: !!data.apiKey,
            model: data.model || 'gpt-3.5-turbo',
            summaryLength: data.summaryLength || 'medium',
            translateSummaries: data.translateSummaries || false
          });
        }
      );
      return true; // Required for async sendResponse
      
    case 'callOpenAI':
      // Handle OpenAI API requests
      handleOpenAIRequest(message, sendResponse);
      return true; // Required for async sendResponse
  }
});

/**
 * Handle OpenAI API requests
 * @param {Object} message - Message with API request details
 * @param {Function} sendResponse - Function to send response back
 */
async function handleOpenAIRequest(message, sendResponse) {
  try {
    const { prompt, type, postContent } = message;
    const response = await apiService.callAPI(prompt, type, postContent);
    sendResponse(response);
  } catch (error) {
    console.error('Error in OpenAI API request:', error);
    sendResponse({ error: 'Error processing request: ' + error.message });
  }
} 