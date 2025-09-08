# API Courier

A professional API testing tool built with Electron and TypeScript - like Postman/Insomnia.

## Features

### Current Implementation
- **Multi-tab Interface**: API, JSON Viewer, JSON Compare, Load Testing, and Ask AI tabs
- **Professional Dark Theme**: With 4 theme options (Dark, Light, Purple, Blue)
- **3-Panel Layout** for API tab:
  - **Collections Panel**: Import/export collections, organize requests in folders
  - **Request Panel**: Full-featured request builder
  - **Response Panel**: Detailed response viewer with syntax highlighting
- **Request Builder**:
  - Multiple HTTP methods (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS)
  - Tabs for Params, Body, Headers, and Auth
  - Multiple body types (JSON, Raw, Form Data, URL Encoded)
  - Authentication support (None, Basic, Bearer Token, API Key, OAuth 1.0/2.0)
- **Response Viewer**:
  - Status code, response time, and size display
  - Formatted JSON and other content types
  - Response headers viewer
- **Collection Management**:
  - Import/export collections as JSON
  - Nested folder structure support
  - Persistent storage with LowDB

### Architecture
- **Electron**: Multi-process architecture with main, preload, and renderer processes
- **TypeScript**: Full type safety throughout the codebase
- **Webpack**: Modern build system with hot reloading
- **SCSS**: Professional styling with CSS variables for theming
- **Event-driven**: Decoupled architecture using EventBus pattern
- **Modular**: Clean separation of concerns with multiple managers

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/shivam96anand/api-courier2.0.git
cd api-courier-2

# Install dependencies
npm install

# Build and run in development mode
npm run dev

# Or build for production
npm run build
npm start
```

### Available Scripts
- `npm run build:dev` - Build in development mode
- `npm run build:watch` - Build and watch for changes
- `npm run dev` - Build and run in development mode
- `npm start` - Build and run in production mode

## Project Structure

```
src/
├── main/                   # Electron main process
│   ├── modules/           
│   │   ├── window-manager.ts    # Window management
│   │   ├── ipc-manager.ts       # Inter-process communication
│   │   ├── store-manager.ts     # Data persistence
│   │   └── request-manager.ts   # HTTP request handling
│   └── index.ts           # Main process entry point
├── preload/               # Preload scripts
│   └── index.ts          # IPC API exposure
├── renderer/              # Renderer process (UI)
│   ├── components/        # UI components
│   │   ├── ui-manager.ts        # General UI management
│   │   ├── collections-manager.ts # Collection handling
│   │   ├── request-manager.ts   # Request form management
│   │   └── response-manager.ts  # Response display
│   ├── styles/           # SCSS stylesheets
│   │   └── main.scss     # Main stylesheet with theming
│   ├── utils/            # Utility classes
│   │   ├── event-bus.ts  # Event communication
│   │   └── theme-manager.ts # Theme handling
│   ├── index.ts          # Renderer entry point
│   └── index.html        # HTML template
└── shared/               # Shared types and interfaces
    ├── types.ts          # Type definitions
    └── ipc.ts           # IPC channel definitions
```

## Key Features Implemented

### 1. Multi-Theme Support
The application supports 4 professional themes:
- Dark (default)
- Light  
- Purple
- Blue

Themes can be changed via the dropdown in the top-right corner.

### 2. Resizable Panels
The main API interface has 3 resizable panels:
- Collections (left): 200-500px width
- Request (middle): Flexible
- Response (right): 300-600px width

### 3. Collection Management
- Import JSON collections from file
- Export collections to JSON
- Create new collections
- Nested folder support
- Persistent storage

### 4. Request Builder
- URL and method selection
- Parameter editor with key-value pairs
- Request body with multiple formats
- Header management
- Authentication configuration

### 5. Response Handling
- Real-time status, timing, and size display
- Formatted response body
- Response headers viewer
- Error handling and display

## Technical Highlights

### Security
- Context isolation enabled
- Node integration disabled
- Sandbox mode compatible
- Secure IPC communication

### Performance  
- Webpack optimized builds
- Efficient event system
- Minimal memory footprint
- Fast startup time

### Development Experience
- TypeScript throughout
- Source maps for debugging
- Hot reloading in development
- Comprehensive error handling

## Next Steps

The following features are planned for future releases:
- JSON Viewer tab implementation
- JSON Compare functionality  
- Load testing capabilities
- AI-powered API assistance
- Request history
- Environment variables
- Code generation
- API documentation
- Team collaboration features

## Contributing

This project follows clean architecture principles:
1. **Separation of Concerns**: Each module has a single responsibility
2. **Event-Driven**: Loose coupling between components
3. **Type Safety**: Full TypeScript coverage
4. **Testable**: Modular design for easy testing
5. **Scalable**: Easy to add new features

## License

MIT License - see LICENSE file for details.

---

**API Courier** - Making API testing professional and efficient! 🚀
