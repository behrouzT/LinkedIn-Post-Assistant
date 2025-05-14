/**
 * LinkedIn Post Summarizer - Posts Module
 * Handles interactions with LinkedIn posts
 */

const postsManager = {
  processedPostIds: new Set(),
  visiblePostsCache: [],
  selectedPostId: null,
  lastSelectedPost: null,
  isEnabled: true,
  
  // Post selectors for different LinkedIn page types
  postSelectors: [
    '.feed-shared-update-v2',
    '.occludable-update',
    '.artdeco-card'
  ].join(', '),
  
  // Initialize observer
  observer: null,
  
  /**
   * Initialize post handling
   */
  async initialize() {
    // Load settings
    this.isEnabled = await storageManager.getSetting('enabled', true);
    
    // Set up observers and event listeners
    this.setupPostObserver();
    document.addEventListener('click', this.handlePostSelection.bind(this));
    
    // Process visible posts after a short delay to allow LinkedIn to load
    if (this.isEnabled) {
      setTimeout(() => {
        this.summarizePosts();
        this.cacheVisiblePosts();
      }, 2000);
    }
    
    // Add scroll listener to process new posts as they appear
    window.addEventListener('scroll', debounce(() => {
      if (this.isEnabled) {
        this.summarizePosts();
        this.cacheVisiblePosts();
      }
    }, 500));
  },
  
  /**
   * Set up a mutation observer to detect when LinkedIn adds new posts
   */
  setupPostObserver() {
    // Disconnect any existing observer
    if (this.observer) {
      this.observer.disconnect();
    }
    
    // Create new observer
    this.observer = new MutationObserver(debounce((mutations) => {
      if (this.isEnabled) {
        this.summarizePosts();
        this.cacheVisiblePosts();
      }
    }, 500));
    
    // Start observing
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  },
  
  /**
   * Extract post content from a post element
   * @param {HTMLElement} post - Post element
   * @returns {string} Post content
   */
  extractPostContent(post) {
    // Try multiple selectors to find the content element
    const contentElement = this.getPostContentElement(post);
    
    if (contentElement) {
      return contentElement.innerText;
    }
    
    return '';
  },
  
  /**
   * Find the content element within a post
   * @param {HTMLElement} post - Post element
   * @returns {HTMLElement|null} Content element
   */
  getPostContentElement(post) {
    // Try multiple selectors to find the content element
    const selectors = [
      '.feed-shared-update-v2__description',
      '.feed-shared-text',
      '.feed-shared-inline-show-more-text',
      '.update-components-text'
    ];
    
    for (const selector of selectors) {
      const element = post.querySelector(selector);
      if (element) {
        return element;
      }
    }
    
    return null;
  },
  
  /**
   * Cache all visible posts for use in popup
   */
  cacheVisiblePosts() {
    const posts = document.querySelectorAll(this.postSelectors);
    
    this.visiblePostsCache = [];
    
    posts.forEach(post => {
      // Generate a unique ID for this post if it doesn't have one
      if (!post.dataset.postId) {
        post.dataset.postId = generateUniqueId();
      }
      
      const postContent = this.extractPostContent(post);
      if (postContent && postContent.trim().length > 0) {
        this.visiblePostsCache.push({
          id: post.dataset.postId,
          content: postContent,
          element: post
        });
      }
    });
  },
  
  /**
   * Handle selection of a post (for Q&A)
   * @param {Event} e - Click event
   */
  handlePostSelection(e) {
    // Check if clicked element is part of a post
    const postElement = e.target.closest(this.postSelectors);
    
    if (postElement && !e.target.closest('.linkedin-post-summary, .linkedin-post-qa')) {
      // Remove highlight from previously selected post
      if (this.selectedPostId) {
        const previousPost = document.querySelector(`[data-post-id="${this.selectedPostId}"]`);
        if (previousPost) {
          previousPost.style.boxShadow = '';
        }
      }
      
      // Generate a unique ID for this post if it doesn't have one
      if (!postElement.dataset.postId) {
        postElement.dataset.postId = generateUniqueId();
      }
      
      // Store selected post and highlight it
      this.selectedPostId = postElement.dataset.postId;
      postElement.style.boxShadow = '0 0 0 3px #0a66c2';
      
      // Extract post content
      this.lastSelectedPost = this.extractPostContent(postElement);
      
      // Show notification
      showNotification('Post selected for Q&A. Use the extension popup to ask questions.');
    }
  },
  
  /**
   * Process and summarize all visible posts
   */
  async summarizePosts() {
    // Check if enabled and API key is available
    const hasApiKey = await storageManager.hasApiKey();
    if (!this.isEnabled || !hasApiKey) return;
    
    // Find all posts
    const posts = document.querySelectorAll(this.postSelectors);
    
    // Process each post
    for (const post of posts) {
      // Skip if already processed
      if (post.querySelector('.linkedin-post-summary')) continue;
      if (!post.dataset.postId) {
        post.dataset.postId = generateUniqueId();
      }
      if (this.processedPostIds.has(post.dataset.postId)) continue;
      
      // Get post content
      const postContent = this.extractPostContent(post);
      if (!postContent || postContent.length < 100) continue; // Skip short posts
      
      // Mark as processed
      this.processedPostIds.add(post.dataset.postId);
      
      // Create summary element
      const summaryContainer = document.createElement('div');
      summaryContainer.className = 'linkedin-post-summary';
      summaryContainer.style.cssText = `
        margin: 10px 0;
        padding: 12px;
        border-radius: 8px;
        background-color: #f3f6f8;
        border-left: 4px solid #0a66c2;
      `;
      
      // Add loading indicator
      const loadingDiv = document.createElement('div');
      loadingDiv.textContent = 'Summarizing...';
      loadingDiv.style.color = '#0a66c2';
      summaryContainer.appendChild(loadingDiv);
      
      // Add to DOM
      const contentElement = this.getPostContentElement(post);
      if (contentElement) {
        contentElement.parentNode.insertBefore(summaryContainer, contentElement);
      } else {
        continue; // Skip if we can't find where to insert
      }
      
      try {
        // Get summary from OpenAI
        const response = await apiService.callAPI('', 'summary', postContent);
        
        if (response.error) {
          loadingDiv.textContent = `Error: ${response.error}`;
          loadingDiv.style.color = '#d93025';
        } else {
          // Replace loading with summary
          summaryContainer.removeChild(loadingDiv);
          
          // Create header
          const summaryHeader = document.createElement('div');
          summaryHeader.textContent = '🔍 Summary';
          summaryHeader.style.fontWeight = 'bold';
          summaryHeader.style.marginBottom = '8px';
          summaryHeader.style.color = '#0a66c2';
          summaryContainer.appendChild(summaryHeader);
          
          // Process response for summary and key points
          let summaryText = response.result;
          let keyPointsText = '';
          
          // Try to separate summary from key points
          const keyPointsPattern = /Key Points:/i;
          const match = response.result.match(keyPointsPattern);
          
          if (match) {
            const parts = response.result.split(match[0]);
            if (parts.length > 1) {
              summaryText = parts[0].trim();
              keyPointsText = parts[1].trim();
            }
          }
          
          // Create summary text
          const summaryTextDiv = document.createElement('div');
          summaryTextDiv.textContent = summaryText;
          
          // Check and set direction if RTL language
          if (isRTLLanguage(summaryText)) {
            summaryTextDiv.style.direction = 'rtl';
            summaryTextDiv.style.textAlign = 'right';
          }
          
          summaryContainer.appendChild(summaryTextDiv);
          
          // Add key points if present
          if (keyPointsText) {
            const keyPointsDiv = document.createElement('div');
            keyPointsDiv.style.marginTop = '10px';
            keyPointsDiv.style.paddingTop = '10px';
            keyPointsDiv.style.borderTop = '1px solid #e0e0e0';
            
            // Create a header for key points
            const keyPointsHeaderDiv = document.createElement('div');
            keyPointsHeaderDiv.textContent = '🔑 Key Points';
            keyPointsHeaderDiv.style.fontWeight = 'bold';
            keyPointsHeaderDiv.style.marginBottom = '8px';
            keyPointsHeaderDiv.style.color = '#0a66c2';
            keyPointsHeaderDiv.style.direction = 'ltr';
            keyPointsHeaderDiv.style.textAlign = 'left';
            keyPointsDiv.appendChild(keyPointsHeaderDiv);
            
            // Create content div for key points
            const keyPointsContentDiv = document.createElement('div');
            keyPointsContentDiv.innerHTML = keyPointsText.replace(/•/g, '&#8226;').replace(/\n/g, '<br>');
            
            // Check if it's RTL language for styling
            if (isRTLLanguage(keyPointsText)) {
              keyPointsDiv.style.direction = 'rtl';
              keyPointsDiv.style.textAlign = 'right';
              keyPointsContentDiv.style.direction = 'rtl';
              keyPointsContentDiv.style.textAlign = 'right';
            }
            
            keyPointsDiv.appendChild(keyPointsContentDiv);
            summaryContainer.appendChild(keyPointsDiv);
          }
          
          // Add "Ask a Question" button
          const askQuestionDiv = document.createElement('div');
          askQuestionDiv.className = 'linkedin-post-qa';
          askQuestionDiv.style.cssText = `
            margin-top: 10px;
            padding-top: 8px;
            border-top: 1px solid #e0e0e0;
          `;
          
          const askQuestionBtn = document.createElement('button');
          askQuestionBtn.textContent = '❓ Ask a question about this post';
          askQuestionBtn.style.cssText = `
            background: none;
            border: none;
            color: #0a66c2;
            font-weight: 500;
            cursor: pointer;
            padding: 4px 0;
            font-size: 14px;
            display: flex;
            align-items: center;
          `;
          
          askQuestionBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Set this post as the selected post
            this.selectedPostId = post.dataset.postId;
            this.lastSelectedPost = postContent;
            
            // Remove highlight from all posts
            document.querySelectorAll(this.postSelectors).forEach(p => {
              p.style.boxShadow = '';
            });
            
            // Highlight the current post
            post.style.boxShadow = '0 0 0 3px #0a66c2';
            
            // Store selected post info for popup access
            chrome.storage.local.set({
              selectedPostId: post.dataset.postId,
              selectedPostContent: postContent,
              questionMode: true
            });
            
            // Show notification to click extension icon
            showNotification('Click the extension icon to ask questions about this post');
          });
          
          askQuestionDiv.appendChild(askQuestionBtn);
          summaryContainer.appendChild(askQuestionDiv);
        }
      } catch (error) {
        loadingDiv.textContent = `Error: ${error.message}`;
        loadingDiv.style.color = '#d93025';
      }
    }
  },
  
  /**
   * Remove all summaries from posts
   */
  removeSummaries() {
    const summaries = document.querySelectorAll('.linkedin-post-summary');
    summaries.forEach(summary => summary.remove());
  },
  
  /**
   * Force re-summarize all posts
   */
  forceResummarize() {
    // Clear processed posts set
    this.processedPostIds.clear();
    
    // Remove existing summaries
    this.removeSummaries();
    
    // Re-summarize
    this.summarizePosts();
  },
  
  /**
   * Get currently selected post content
   * @returns {string} Post content
   */
  getSelectedPostContent() {
    return this.lastSelectedPost;
  },
  
  /**
   * Get all visible posts
   * @returns {Array} Array of visible posts
   */
  getVisiblePosts() {
    this.cacheVisiblePosts();
    return this.visiblePostsCache.map(p => ({ id: p.id, content: p.content }));
  },
  
  /**
   * Set the selected post by ID
   * @param {string} postId - Post ID to select
   */
  setSelectedPostById(postId) {
    if (!postId) return;
    
    // Remove highlight from previously selected post
    if (this.selectedPostId) {
      const previousPost = document.querySelector(`[data-post-id="${this.selectedPostId}"]`);
      if (previousPost) {
        previousPost.style.boxShadow = '';
      }
    }
    
    // Set new selected post and highlight it
    this.selectedPostId = postId;
    const post = document.querySelector(`[data-post-id="${this.selectedPostId}"]`);
    
    if (post) {
      post.style.boxShadow = '0 0 0 3px #0a66c2';
      this.lastSelectedPost = this.extractPostContent(post);
      // Scroll to the post
      post.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}; 