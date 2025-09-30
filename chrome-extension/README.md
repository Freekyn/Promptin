# PromptInSTYL Chrome Extension

A modern AI-powered prompt engineering assistant built with React and Tailwind CSS.

## Features

- 🚀 **Modern UI**: Built with React and Tailwind CSS for a beautiful, responsive interface
- 🔐 **Authentication**: Secure user authentication with persistent sessions
- 🎭 **Role Selection**: Choose from various professional roles or create custom ones
- 🔧 **Framework Selection**: AI-powered framework recommendations
- 📄 **Multiple Export Formats**: Export prompts as TXT, MD, HTML, JSON, PDF, or PNG
- 🤖 **AI Platform Recommendations**: Get suggestions for the best AI platforms
- ⚡ **Quick Access**: Keyboard shortcuts and context menu integration
- 🌐 **Floating Button**: Easy access on any webpage

## Development Setup

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Chrome browser

### Installation

1. **Install dependencies:**
   ```bash
   cd chrome-extension
   npm install
   ```

2. **Build the extension:**
   ```bash
   npm run build
   ```
   
   Or use the PowerShell script:
   ```powershell
   .\build-extension.ps1
   ```

3. **Load in Chrome:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

### Development

For development with hot reload:
```bash
npm run dev
```

This will watch for changes and rebuild automatically.

## Project Structure

```
chrome-extension/
├── src/
│   ├── popup/
│   │   ├── components/          # React components
│   │   ├── contexts/           # React contexts (Auth, API)
│   │   ├── App.jsx            # Main app component
│   │   ├── index.js           # Entry point
│   │   ├── index.css          # Tailwind CSS
│   │   └── popup.html         # HTML template
│   ├── background.js          # Service worker
│   └── content.js             # Content script
├── images/                    # Extension icons
├── dist/                      # Built extension (generated)
├── webpack.config.js          # Webpack configuration
├── tailwind.config.js         # Tailwind configuration
├── postcss.config.js          # PostCSS configuration
├── package.json               # Dependencies
└── manifest.json              # Extension manifest
```

## API Integration

The extension connects to the PromptInSTYL API server. If the server is unavailable, it falls back to mock data for demonstration purposes.

### API Endpoints

- `POST /api/analyze-intent-enhanced` - Generate enhanced prompts
- `GET /api/roles` - Get available roles
- `GET /api/frameworks/list` - Get available frameworks
- `POST /api/export-prompt` - Export prompts in various formats

## Authentication

The extension uses Chrome's storage API to persist user sessions. Authentication is currently in demo mode - any email/password combination will work.

## Building for Production

1. Update version in `manifest.json`
2. Run `npm run build`
3. Test the extension thoroughly
4. Package the `dist` folder for distribution

## Troubleshooting

### Common Issues

1. **"Failed to connect to server"**
   - Check internet connection
   - Verify server is running
   - Check browser console for detailed errors

2. **Extension not loading**
   - Ensure all files are in the `dist` folder
   - Check manifest.json for syntax errors
   - Reload the extension in Chrome

3. **Build errors**
   - Clear `node_modules` and reinstall dependencies
   - Check Node.js version compatibility
   - Review webpack configuration

### Debug Mode

Enable debug logging by opening Chrome DevTools and checking the console for detailed error messages.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
