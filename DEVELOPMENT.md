# Development Guide

## Quick Start

1. **Install dependencies**: `npm install`
2. **Development mode**: `npm run dev` (builds and runs with DevTools)
3. **Production build**: `npm run build && npm start`

## Key Components

### Main Process (`src/main/`)
- **WindowManager**: Creates and manages application windows
- **IPCManager**: Handles inter-process communication
- **StoreManager**: Manages data persistence with LowDB
- **RequestManager**: Handles HTTP requests using Node.js built-in modules

### Renderer Process (`src/renderer/`)
- **UIManager**: Manages tabs, window controls, and resizable panels
- **CollectionsManager**: Handles collection CRUD operations
- **RequestManager**: Manages request form state and validation
- **ResponseManager**: Displays and formats API responses
- **ThemeManager**: Handles theme switching and persistence
- **EventBus**: Provides event-driven communication between components

## Adding New Features

### 1. Adding a New Tab
1. Update HTML in `src/renderer/index.html`
2. Add tab handling in `UIManager.setupTabNavigation()`
3. Create component manager if needed
4. Add styles in `src/renderer/styles/main.scss`

### 2. Adding New Request Features
1. Update types in `src/shared/types.ts`
2. Modify UI in `src/renderer/index.html`
3. Update `RequestManager` component
4. Add server-side handling in main process

### 3. Adding New Themes
1. Add theme definition in `src/renderer/utils/theme-manager.ts`
2. Add CSS variables in `src/renderer/styles/main.scss`
3. Update theme selector options

## Code Standards

- Use TypeScript for all code
- Follow event-driven architecture
- Keep components loosely coupled
- Use proper error handling
- Add type definitions for all APIs
- Follow existing naming conventions

## Testing the App

The application runs in development mode with DevTools open. Check the console for any errors and test all functionality:

1. **Theme switching**: Top-right dropdown
2. **Tab navigation**: Left sidebar
3. **Panel resizing**: Drag handles
4. **Collection management**: Import/export buttons
5. **Request building**: All tabs and form fields
6. **Response viewing**: Send test requests

## Build Process

The webpack configuration handles:
- TypeScript compilation
- SCSS processing
- HTML template processing
- Development/production modes
- Source map generation

Files are output to `dist/` directory with separate folders for main, preload, and renderer processes.
