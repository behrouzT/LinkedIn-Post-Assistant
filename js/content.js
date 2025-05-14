/**
 * LinkedIn Post Summarizer - Content Script
 * This script runs on LinkedIn pages to summarize posts and handle interactions
 */

// Initialize when the page is fully loaded
window.addEventListener('load', async () => {
  console.log('LinkedIn Post Summarizer extension activated');
  
  // Initialize posts manager
  await postsManager.initialize();
});

// Listen for messages from popup or background script
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  switch (message.action) {
    case 'enable':
      postsManager.isEnabled = true;
      postsManager.summarizePosts();
      break;
      
    case 'disable':
      postsManager.isEnabled = false;
      postsManager.removeSummaries();
      break;
      
    case 'summarizeNow':
      postsManager.forceResummarize();
      postsManager.cacheVisiblePosts();
      break;
      
    case 'apiKeyUpdated':
      // Force re-summarize when API key is updated
      postsManager.forceResummarize();
      break;
      
    case 'modelUpdated':
      // No need to re-summarize, just update the model for future summaries
      break;
      
    case 'summaryLengthUpdated':
      // Update all summaries with new length preference
      postsManager.forceResummarize();
      break;
      
    case 'translationUpdated':
      storageManager.saveSetting('translateSummaries', message.translate);
      postsManager.forceResummarize();
      break;
      
    case 'getSelectedPost':
      // Check storage first for selected post content from "Ask a Question" button
      chrome.storage.local.get(['selectedPostId', 'selectedPostContent'], (data) => {
        if (data.selectedPostId && data.selectedPostContent) {
          postsManager.selectedPostId = data.selectedPostId;
          postsManager.lastSelectedPost = data.selectedPostContent;
          
          // Clear from storage after retrieving
          chrome.storage.local.remove(['selectedPostId', 'selectedPostContent']);
        }
        
        // Return the content of the currently selected post
        sendResponse({ postContent: postsManager.getSelectedPostContent() });
      });
      return true; // Required for async sendResponse
      
    case 'getVisiblePosts':
      // Update the cache and send it
      sendResponse({ posts: postsManager.getVisiblePosts() });
      break;
      
    case 'setSelectedPostId':
      // Set the selected post ID from the popup
      postsManager.setSelectedPostById(message.postId);
      break;
      
    case 'askQuestion':
      // Handle question about a post
      handleQuestion(message.question, sendResponse);
      return true; // Required for async sendResponse
  }
  
  return true; // Required for async sendResponse
});

/**
 * Handle a question about the selected post
 * @param {string} question - The question to answer
 * @param {Function} sendResponse - Function to send response back
 */
async function handleQuestion(question, sendResponse) {
  const postContent = postsManager.getSelectedPostContent();
  
  // Check if a post is selected
  if (!postContent) {
    sendResponse({ error: 'No post selected. Please click on a post first.' });
    return;
  }
  
  try {
    // Get answer from API
    const response = await apiService.callAPI(question, 'question', postContent);
    
    // Format the response to make it compatible with popup.js
    if (response.result) {
      sendResponse({ result: response.result, answer: response.result }); // Keep both for backward compatibility
    } else if (response.error) {
      sendResponse({ error: response.error });
    } else {
      sendResponse({ error: 'Unexpected response format from API' });
    }
  } catch (error) {
    console.error('Error handling question:', error);
    sendResponse({ error: 'Error processing question: ' + error.message });
  }
} 