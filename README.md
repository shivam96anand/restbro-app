# API Courier

A modern, professional API testing tool built with Electron, TypeScript, and modern web technologies. Inspired by Postman and Insomnia, API Courier provides a clean, intuitive interface for testing and managing your APIs.

## Features

### ✅ Currently Implemented

- **5-Tab Interface**: API, JSON Viewer, JSON Compare, Load Testing, and Ask AI tabs
- **API Tab with 3 Sections**:
  - **Collections Panel**: Create and manage folders and subfolders for organizing requests
  - **Request Panel**: Full-featured request builder with support for all HTTP methods
  - **Response Panel**: View responses with formatted body and headers
- **Request Tabs**: Manage multiple open requests with tabs
- **Theme System**: 5 color themes (Blue, Green, Purple, Orange, Red) with dark base
- **Collections Management**:
  - Create nested folders and subfolders
  - Add requests to collections
  - Context menu with rename/delete options
- **Request Builder**:
  - Support for GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS
  - Headers editor with key-value pairs
  - Body editor with JSON, Raw, and Form URL Encoded support
  - Authentication (Basic, Bearer Token, API Key)
- **Response Viewer**:
  - Auto-formatted JSON responses
  - Headers display in table format
  - Response metadata (status, time, size)

### 🚧 Coming Soon

- JSON Viewer tab
- JSON Compare tab
- Load Testing tab
- Ask AI tab
- Import/Export functionality
- Advanced authentication (OAuth 2.0)
- Environment variables
- Request history

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd api-courier-2
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the application:
   ```bash
   npm run build
   ```

4. Start the application:
   ```bash
   npm start
   ```

### Development

For development with hot reload:

```bash
npm run dev
```

This will start the webpack dev server and watch for file changes.

## Architecture

API Courier follows Electron security best practices:

- **Main Process**: Handles file system operations, networking, and data persistence
- **Preload Script**: Secure bridge between main and renderer processes
- **Renderer Process**: UI running with context isolation and sandbox enabled
- **Modular Design**: Each component is kept under ~300 lines for maintainability

### Project Structure

```
src/
├── main/           # Electron main process
│   ├── modules/    # Modular main process components
│   └── index.ts    # Main entry point
├── preload/        # Secure IPC bridge
├── renderer/       # UI components and logic
│   ├── components/ # UI component managers
│   ├── styles/     # SCSS styles
│   └── utils/      # Utility functions
└── shared/         # Types and constants shared across processes
```

## Usage

1. **Creating Collections**: Click the "+" button in the Collections panel to create folders or requests
2. **Making Requests**: Select a request method, enter a URL, add headers/body as needed, and click "Send"
3. **Managing Tabs**: Use the "+" button to create new request tabs, click tabs to switch between them
4. **Changing Themes**: Use the dropdown in the top-right corner to select your preferred color theme

## Contributing

This project follows enterprise-level development practices:

- TypeScript for type safety
- ESLint + Prettier for code quality
- Modular architecture for maintainability
- Secure Electron practices

## License

MIT License - see LICENSE file for details