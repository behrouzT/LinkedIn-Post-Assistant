/**
 * LinkedIn Post Summarizer - OpenAI API Module
 * Handles all API interactions with OpenAI
 */

const apiService = {
  apiUrl: 'https://api.openai.com/v1/chat/completions',

  /**
   * Get the OpenAI API key from storage
   * @returns {Promise<string>} The API key
   */
  async getApiKey() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['apiKey'], (data) => {
        resolve(data.apiKey || '');
      });
    });
  },

  /**
   * Get the model preference from storage
   * @returns {Promise<string>} The model name
   */
  async getModel() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['model'], (data) => {
        resolve(data.model || 'gpt-3.5-turbo');
      });
    });
  },

  /**
   * Get translate summaries preference
   * @returns {Promise<boolean>} Whether summaries should be translated
   */
  async getTranslatePreference() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['translateSummaries'], (data) => {
        resolve(data.translateSummaries || false);
      });
    });
  },

  /**
   * Call the OpenAI API
   * @param {string} prompt - The prompt for the API
   * @param {string} type - The type of request ('summary' or 'question')
   * @param {string} postContent - The content of the post
   * @returns {Promise<Object>} The API response
   */
  async callAPI(prompt, type, postContent) {
    try {
      const apiKey = await this.getApiKey();
      
      if (!apiKey) {
        return { error: 'API key not found. Please set your OpenAI API key in the extension settings.' };
      }
      
      const model = await this.getModel();
      const translateSummaries = await this.getTranslatePreference();
      
      let systemPrompt;
      let userPrompt;
      
      if (type === 'summary') {
        if (translateSummaries) {
          systemPrompt = "You are an AI summarization assistant that can work with any language. Detect the language of the LinkedIn post. Always summarize the post in Persian/Farsi regardless of the original language. Keep summaries concise and informative. After the summary, provide a list of key points from the post labeled as 'Key Points:' with each point on a new line prefixed with a bullet point.";
        } else {
          systemPrompt = "You are an AI summarization assistant that can work with any language. Summarize the LinkedIn post in the SAME LANGUAGE as the original post. Focus on the main points and key takeaways. Keep the summary concise and informative. After the summary, provide a list of key points from the post labeled as 'Key Points:' with each point on a new line prefixed with a bullet point.";
        }
        userPrompt = `Summarize this LinkedIn post in a few sentences, then list 3-5 key points:\n\n${postContent}`;
      } else if (type === 'question') {
        if (translateSummaries) {
          systemPrompt = "You are an AI assistant answering questions about LinkedIn posts. You can work with any language. Detect the language of the post and answer the question in Persian/Farsi regardless of the language the question was asked in. Provide clear, accurate, and helpful answers based solely on the post content.";
        } else {
          systemPrompt = "You are an AI assistant answering questions about LinkedIn posts. You can work with any language. Detect the language of the post and answer the question in the SAME LANGUAGE as the question was asked. Provide clear, accurate, and helpful answers based solely on the post content.";
        }
        userPrompt = `LinkedIn Post:\n${postContent}\n\nQuestion: ${prompt}\n\nAnswer the question based only on the information in the post.`;
      }
      
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          max_tokens: 400,
          temperature: 0.5
        })
      });
      
      const responseData = await response.json();
      
      if (responseData.error) {
        return { error: responseData.error.message || 'Error with OpenAI API request' };
      }
      
      if (responseData.choices && responseData.choices[0]) {
        return { result: responseData.choices[0].message.content.trim() };
      } else {
        return { error: 'Unexpected API response format' };
      }
    } catch (error) {
      console.error('Error in OpenAI API request:', error);
      return { error: 'Error processing request: ' + error.message };
    }
  }
}; 