/**
 * LinkedIn Post Summarizer - Storage Module
 * Handles all interactions with Chrome's storage API
 */

const storageManager = {
  /**
   * Default settings for the extension
   */
  get defaultSettings() {
    return {
      enabled: true,
      model: 'gpt-3.5-turbo',
      summaryLength: 'medium',
      translateSummaries: false
    };
  },

  /**
   * Initialize storage with default settings
   * @returns {Promise<void>}
   */
  async initializeStorage() {
    const currentSettings = await this.getAllSettings();
    
    // Only set default values for settings that don't exist
    const settings = {
      ...this.defaultSettings,
      ...currentSettings
    };
    
    return new Promise((resolve) => {
      chrome.storage.local.set(settings, () => {
        console.log('LinkedIn Post Summarizer initialized with default settings');
        resolve();
      });
    });
  },

  /**
   * Get all settings from storage
   * @returns {Promise<Object>} All settings
   */
  async getAllSettings() {
    return new Promise((resolve) => {
      chrome.storage.local.get(null, (data) => {
        resolve(data);
      });
    });
  },

  /**
   * Get a specific setting from storage
   * @param {string} key - The setting key to get
   * @param {any} defaultValue - Default value if setting doesn't exist
   * @returns {Promise<any>} The setting value
   */
  async getSetting(key, defaultValue = null) {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (data) => {
        resolve(data[key] === undefined ? defaultValue : data[key]);
      });
    });
  },

  /**
   * Save a setting to storage
   * @param {string} key - The setting key
   * @param {any} value - The setting value
   * @returns {Promise<void>}
   */
  async saveSetting(key, value) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, () => {
        resolve();
      });
    });
  },

  /**
   * Save multiple settings at once
   * @param {Object} settings - Key-value pairs of settings
   * @returns {Promise<void>}
   */
  async saveSettings(settings) {
    return new Promise((resolve) => {
      chrome.storage.local.set(settings, () => {
        resolve();
      });
    });
  },

  /**
   * Check if API key is set
   * @returns {Promise<boolean>} True if API key is set
   */
  async hasApiKey() {
    const apiKey = await this.getSetting('apiKey', '');
    return !!apiKey;
  },

  /**
   * Get current status summary of the extension
   * @returns {Promise<Object>} Status object
   */
  async getStatus() {
    const [enabled, apiKey, model, summaryLength, translateSummaries] = await Promise.all([
      this.getSetting('enabled', true),
      this.getSetting('apiKey', ''),
      this.getSetting('model', 'gpt-3.5-turbo'),
      this.getSetting('summaryLength', 'medium'),
      this.getSetting('translateSummaries', false)
    ]);
    
    return {
      enabled,
      hasApiKey: !!apiKey,
      model,
      summaryLength,
      translateSummaries
    };
  }
}; 