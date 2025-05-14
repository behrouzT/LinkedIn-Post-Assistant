/**
 * LinkedIn Post Summarizer - Popup Script
 * Handles the popup UI and interactions
 */

// DOM Elements
let toggleSwitch, statusText, apiKeyInput, saveKeyButton, apiKeyStatus;
let modelSelect, summaryLengthSelect, translateSwitch;
let summarizeButton, questionInput, askButton, qaContainer;
let selectedPostDisplay, selectedPostContent, postSelector;
let tabButtons;

// Initialize popup UI when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize UI elements
  initializeUIElements();
  
  // Load current settings
  await loadSettings();
  
  // Add event listeners
  setupEventListeners();
  
  // Show default tab
  openTab('summarize');
});

/**
 * Initialize UI element references
 */
function initializeUIElements() {
  // Settings elements
  toggleSwitch = document.getElementById('toggle');
  statusText = document.getElementById('status');
  apiKeyInput = document.getElementById('apiKey');
  saveKeyButton = document.getElementById('saveKey');
  apiKeyStatus = document.getElementById('apiKeyStatus');
  modelSelect = document.getElementById('model');
  summaryLengthSelect = document.getElementById('summaryLength');
  translateSwitch = document.getElementById('translate');
  
  // Summarize elements
  summarizeButton = document.getElementById('summarizeNow');
  
  // Q&A elements
  questionInput = document.getElementById('question');
  askButton = document.getElementById('askQuestion');
  qaContainer = document.getElementById('qaContainer');
  selectedPostDisplay = document.getElementById('selectedPost');
  selectedPostContent = selectedPostDisplay.querySelector('.post-content');
  postSelector = document.getElementById('postSelector');
  
  // Tab elements
  tabButtons = document.querySelectorAll('.tablinks');
}

/**
 * Load current settings from storage
 */
async function loadSettings() {
  // Get status from background script
  chrome.runtime.sendMessage({ action: 'getStatus' }, (status) => {
    if (!status) return;
    
    // Update toggle switch
    toggleSwitch.checked = status.enabled;
    statusText.textContent = status.enabled ? 'Enabled' : 'Disabled';
    
    // Update API key status
    if (status.hasApiKey) {
      apiKeyStatus.textContent = 'API key is set';
      apiKeyStatus.className = 'success';
    } else {
      apiKeyStatus.textContent = 'API key not set';
      apiKeyStatus.className = 'danger';
    }
    
    // Update model and summary length selectors
    modelSelect.value = status.model;
    summaryLengthSelect.value = status.summaryLength;
    translateSwitch.checked = status.translateSummaries;
    
    // Update selected post display
    updateSelectedPost();
    
    // Load visible posts for selector
    loadVisiblePosts();
    
    // Check if we need to open in question mode
    chrome.storage.local.get('questionMode', (data) => {
      if (data.questionMode) {
        // Switch to Q&A tab if in question mode
        openTab('qa');
        
        // Focus the question input
        setTimeout(() => {
          questionInput.focus();
        }, 100);
        
        // Clear the question mode flag
        chrome.storage.local.remove('questionMode');
      }
    });
  });
}

/**
 * Set up event listeners for UI elements
 */
function setupEventListeners() {
  // Toggle extension enabled/disabled
  toggleSwitch.addEventListener('change', async () => {
    const isEnabled = toggleSwitch.checked;
    statusText.textContent = isEnabled ? 'Enabled' : 'Disabled';
    
    // Save setting
    chrome.storage.local.set({ enabled: isEnabled });
    
    // Send message to content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url.includes('linkedin.com')) {
        chrome.tabs.sendMessage(tabs[0].id, { action: isEnabled ? 'enable' : 'disable' });
      }
    });
  });
  
  // Save API key
  saveKeyButton.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    
    if (apiKey) {
      chrome.storage.local.set({ apiKey: apiKey }, () => {
        apiKeyStatus.textContent = 'API key saved successfully';
        apiKeyStatus.className = 'success';
        apiKeyInput.value = '';
        
        // Notify content script that API key was updated
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0] && tabs[0].url.includes('linkedin.com')) {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'apiKeyUpdated' });
          }
        });
      });
    } else {
      apiKeyStatus.textContent = 'Please enter a valid API key';
      apiKeyStatus.className = 'danger';
    }
  });
  
  // Enter key in API input should trigger save
  apiKeyInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      saveKeyButton.click();
    }
  });
  
  // Change model
  modelSelect.addEventListener('change', async () => {
    chrome.storage.local.set({ model: modelSelect.value });
    
    // Notify content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url.includes('linkedin.com')) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'modelUpdated' });
      }
    });
  });
  
  // Change summary length
  summaryLengthSelect.addEventListener('change', async () => {
    chrome.storage.local.set({ summaryLength: summaryLengthSelect.value });
    
    // Notify content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url.includes('linkedin.com')) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'summaryLengthUpdated' });
      }
    });
  });
  
  // Toggle translation
  translateSwitch.addEventListener('change', async () => {
    const translateEnabled = translateSwitch.checked;
    chrome.storage.local.set({ translateSummaries: translateEnabled });
    
    // Notify content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url.includes('linkedin.com')) {
        chrome.tabs.sendMessage(tabs[0].id, { 
          action: 'translationUpdated',
          translate: translateEnabled
        });
      }
    });
  });
  
  // Summarize now button
  summarizeButton.addEventListener('click', () => {
    // Notify content script to force re-summarize
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url.includes('linkedin.com')) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'summarizeNow' });
      }
    });
  });
  
  // Ask question button
  askButton.addEventListener('click', askQuestion);
  
  // Allow pressing Enter to ask question
  questionInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      askQuestion();
    }
  });
  
  // Tab navigation
  tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      openTab(button.dataset.tab);
    });
  });
  
  // Post selection change
  postSelector.addEventListener('change', () => {
    const selectedPostId = postSelector.value;
    
    if (selectedPostId) {
      // Send selected post ID to content script
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].url.includes('linkedin.com')) {
          chrome.tabs.sendMessage(tabs[0].id, { 
            action: 'setSelectedPostId',
            postId: selectedPostId
          });
        }
      });
    }
    
    // Update selected post display
    updateSelectedPost();
  });
}

// Function to handle asking a question
async function askQuestion() {
  const question = questionInput.value.trim();
  
  if (!question) {
    return;
  }
  
  // Show loading state
  askButton.disabled = true;
  let loadingQA = addQA(question, '<div class="loading"></div>');
  
  // Send question to content script
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    if (tabs[0] && tabs[0].url.includes('linkedin.com')) {
      try {
        const response = await new Promise((resolve) => {
          chrome.tabs.sendMessage(tabs[0].id, { 
            action: 'askQuestion',
            question: question
          }, (result) => {
            resolve(result);
          });
        });
        
        // Replace loading with answer
        const answerElement = loadingQA.querySelector('.qa-answer');
        
        if (response && response.result) {
          // Format text better for display
          let formattedAnswer = response.result;
          
          // Apply RTL formatting if needed
          const isAnswerRTL = isRTLText(response.result);
          
          if (isAnswerRTL) {
            // Better formatting for Persian text
            formattedAnswer = response.result
              .replace(/\n\n/g, '<br><br>')
              .replace(/\n/g, '<br>')
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
              
            answerElement.innerHTML = formattedAnswer;
            answerElement.classList.add('rtl');
          } else {
            // Standard formatting for Latin text
            formattedAnswer = response.result
              .replace(/\n\n/g, '<br><br>')
              .replace(/\n/g, '<br>')
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
              
            answerElement.innerHTML = formattedAnswer;
            answerElement.classList.add('ltr');
          }
        } else if (response && response.error) {
          answerElement.textContent = response.error;
          answerElement.className = 'qa-answer danger';
        } else {
          answerElement.textContent = 'Error: Could not get answer. Make sure your API key is set correctly.';
        }
        
        // Clear input
        questionInput.value = '';
      } catch (error) {
        const answerElement = loadingQA.querySelector('.qa-answer');
        answerElement.textContent = `Error: ${error.message || 'Could not process request'}`;
      } finally {
        // Restore button
        askButton.disabled = false;
      }
    }
  });
}

/**
 * Opens a tab in the popup
 */
function openTab(tabName) {
  // Hide all tab contents
  const tabContents = document.querySelectorAll('.tabcontent');
  tabContents.forEach((tab) => {
    tab.style.display = 'none';
  });
  
  // Remove active class from all tab buttons
  tabButtons.forEach((button) => {
    button.classList.remove('active');
  });
  
  // Show the selected tab content
  document.getElementById(tabName).style.display = 'block';
  
  // Add active class to the button that opened the tab
  document.querySelector(`.tablinks[data-tab="${tabName}"]`).classList.add('active');
  
  // If Q&A tab is opened, update the selected post display and load posts
  if (tabName === 'qa') {
    updateSelectedPost();
    loadVisiblePosts();
  }
}

/**
 * Update selected post display
 */
async function updateSelectedPost() {
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    if (tabs[0] && tabs[0].url.includes('linkedin.com')) {
      try {
        const response = await new Promise((resolve) => {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'getSelectedPost' }, (result) => {
            resolve(result);
          });
        });
        
        if (response && response.postContent) {
          selectedPostContent.textContent = truncateText(response.postContent, 200);
          
          // Set RTL if needed
          if (isRTLText(response.postContent)) {
            selectedPostContent.classList.add('rtl');
            selectedPostContent.classList.remove('ltr');
          } else {
            selectedPostContent.classList.add('ltr');
            selectedPostContent.classList.remove('rtl');
          }
        } else {
          selectedPostContent.textContent = 'No post selected. Click on a post on the LinkedIn page to select it.';
          selectedPostContent.classList.remove('rtl');
          selectedPostContent.classList.add('ltr');
        }
      } catch (error) {
        selectedPostContent.textContent = 'Could not get selected post. Please make sure you are on LinkedIn.';
        selectedPostContent.classList.remove('rtl');
        selectedPostContent.classList.add('ltr');
      }
    }
  });
}

/**
 * Check if text is RTL
 */
function isRTLText(text) {
  // If not a string, return false
  if (typeof text !== 'string') return false;

  // Enhanced check for RTL characters (Arabic, Hebrew, Persian, etc.)
  const rtlChars = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;
  
  // Check if the text has Persian specific characters
  const persianChars = /[\u06A9\u06AF\u06C0\u06CC\u067E\u0686\u06F0-\u06F9]/;
  const isPersian = persianChars.test(text);
  
  // If the text contains more than 20% RTL characters, consider it RTL
  const rtlCharCount = (text.match(rtlChars) || []).length;
  const rtlPercent = rtlCharCount / text.length;
  
  return isPersian || (rtlCharCount > 0 && rtlPercent > 0.2);
}

/**
 * Load visible posts for selector
 */
async function loadVisiblePosts() {
  // Ask content script for visible posts
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && tabs[0].url.includes('linkedin.com')) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'getVisiblePosts' }, (response) => {
        if (response && response.posts && response.posts.length > 0) {
          // Clear current options (except the default)
          while (postSelector.options.length > 1) {
            postSelector.remove(1);
          }
          
          // Add posts to selector
          response.posts.forEach((post) => {
            const option = document.createElement('option');
            option.value = post.id;
            option.textContent = truncateText(post.content, 40);
            postSelector.appendChild(option);
          });
          
          // Update selected post in dropdown if needed
          chrome.tabs.sendMessage(tabs[0].id, { action: 'getSelectedPostId' }, (response) => {
            if (response && response.postId) {
              // Try to select the matching option
              const option = postSelector.querySelector(`option[value="${response.postId}"]`);
              if (option) {
                postSelector.value = response.postId;
              }
            }
          });
        }
      });
    }
  });
}

/**
 * Add a question and answer to the QA container
 */
function addQA(question, answer) {
  // Create QA item
  const qaItem = document.createElement('div');
  qaItem.className = 'qa-item';
  
  // Add question
  const questionElement = document.createElement('div');
  questionElement.className = 'qa-question';
  questionElement.textContent = question;
  
  // Apply RTL if needed
  const isQuestionRTL = isRTLText(question);
  if (isQuestionRTL) {
    questionElement.classList.add('rtl');
    questionElement.style.fontFamily = "'Vazirmatn', 'Tahoma', 'Roboto', sans-serif";
    questionElement.style.lineHeight = "1.6";
    questionElement.style.textAlign = "right";
  } else {
    questionElement.classList.add('ltr');
  }
  
  // Add answer
  const answerElement = document.createElement('div');
  answerElement.className = 'qa-answer';
  
  // If answer is a loading indicator, just add it without RTL checking
  if (answer === '<div class="loading"></div>') {
    answerElement.innerHTML = answer;
  } else {
    // Check if answer is a string and apply RTL if needed
    if (typeof answer === 'string') {
      const isAnswerRTL = isRTLText(answer);
      
      if (isAnswerRTL) {
        answerElement.classList.add('rtl');
        answerElement.style.fontFamily = "'Vazirmatn', 'Tahoma', 'Roboto', sans-serif";
        answerElement.style.lineHeight = "1.8";
        answerElement.style.textAlign = "right";
        answerElement.style.direction = "rtl";
        answerElement.style.padding = "15px";
        
        // Format paragraphs in persian text better
        const formattedAnswer = answer.replace(/\n/g, '<br><br>');
        answerElement.innerHTML = formattedAnswer;
      } else {
        answerElement.classList.add('ltr');
        answerElement.innerHTML = answer;
      }
    } else {
      answerElement.innerHTML = answer;
    }
  }
  
  // Assemble QA item
  qaItem.appendChild(questionElement);
  qaItem.appendChild(answerElement);
  
  // Add to container at the top
  qaContainer.insertBefore(qaItem, qaContainer.firstChild);
  
  // Scroll to top of container
  qaContainer.scrollTop = 0;
  
  return qaItem;
}

/**
 * Truncate text to a specified length
 */
function truncateText(text, length) {
  if (!text) return '';
  
  return text.length > length ? text.substring(0, length) + '...' : text;
} 