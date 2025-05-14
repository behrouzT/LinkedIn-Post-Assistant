# LinkedIn Post Assistant

A Chrome extension that enhances your LinkedIn experience using OpenAI to summarize posts, extract key points, answer questions, and provide translation capabilities.

## Features

- Automatically summarizes long LinkedIn posts using OpenAI
- Extracts key points from posts for quick scanning
- Ask questions about specific posts and get AI-powered answers
- Works on your feed, profile pages, and company pages
- Toggle summarization on/off with a simple switch
- Force re-summarization of all visible posts with a button click
- Choose between GPT-3.5 and GPT-4 models
- Adjust summary length to your preference
- Automatic language detection with proper RTL/LTR text alignment
- Translation between English and Persian

## Project Structure

```
LinkedIn Post Assistant/
 ├── assets/                  # Static assets
 │   └── icons/               # Extension icons
 ├── js/                      # JavaScript files
 │   ├── modules/             # Modularized code
 │   │   ├── api.js           # OpenAI API handling
 │   │   ├── posts.js         # Post handling functionality
 │   │   └── storage.js       # Storage management
 │   ├── utils/               # Utility functions
 │   │   └── helpers.js       # Helper utilities
 │   ├── background.js        # Extension background script
 │   ├── content.js           # Content script for LinkedIn pages
 │   └── popup.js             # Popup UI interactions
 ├── styles/                  # CSS stylesheets
 │   └── styles.css           # Main stylesheet
 ├── manifest.json            # Extension manifest
 ├── popup.html               # Extension popup HTML
 └── README.md                # This documentation
```

## Installation

### Download the Extension from Release

1. Visit the releases page of the repository.
2. Find the latest version (e.g., `LinkedIn Post Assistant - v1`) and download the zip file (e.g., `LinkedIn-Post-Assistant-v1.zip`).
2. Extract the ZIP file to a folder on your system.

### Install the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable "`Developer mode`" in the top right corner.
3. Click "`Load unpacked`" and select the extracted LinkedIn Post Assistant folder.
4. The extension is now installed and will automatically work when you visit LinkedIn.

### From Chrome Web Store

Coming soon!

## Usage

### Setting up
1. Click the extension icon in your browser toolbar
2. Go to the "Settings" tab
3. Enter your OpenAI API key and save it
4. Choose your preferred model and summary length

### Summarizing Posts
- The extension will automatically summarize long posts on LinkedIn
- Click the extension icon and use the "Summarize" tab to:
  - Toggle summarization on/off
  - Force re-summarization of all visible posts
- Summaries appear at the top of each post in a blue-bordered box

### Key Points Extraction
- The extension extracts important key points from posts
- These appear as bullet points for quick scanning and understanding
- Especially useful for longer, information-dense posts

### Asking Questions
1. Click on a LinkedIn post to select it (it will be highlighted with a blue border)
2. Click the extension icon and go to the Q&A tab
3. Type your question about the selected post and click "Ask Question"
4. The answer will appear in the popup

## Language Support
- The extension automatically detects the language of posts
- Persian and other RTL language posts are properly right-aligned
- You can toggle automatic translation between English and Persian

## Development

### Build and Test Locally
1. Clone this repository
2. Open the project in your code editor
3. Load the `LinkedIn Post Assistant` folder as an unpacked extension in Chrome

### Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## Requirements

- Chrome browser
- OpenAI API key

## Privacy

Your API key is stored locally in your browser and is only used to make requests to OpenAI's API. Post content is sent to OpenAI for summarization, key point extraction, and question answering but is not stored anywhere else.

## Contact

For questions, bug reports, or feature requests:

- LinkedIn: [https://www.linkedin.com/in/behrouztorabi91/](https://www.linkedin.com/in/behrouztorabi91/)
- GitHub: [https://github.com/behrouzT](https://github.com/behrouzT)

## License

MIT 
