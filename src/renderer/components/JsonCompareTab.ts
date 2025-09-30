/**
 * JSON Compare Tab - Vanilla TypeScript integration wrapper
 * This wraps the React component for the existing app architecture
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import JsonCompareTab from '../tabs/json-compare/JsonCompareTab';

export class JsonCompareTabManager {
  private container: HTMLElement;
  private reactRoot: ReactDOM.Root | null = null;

  constructor() {
    this.container = document.getElementById('json-compare-tab')!;
    this.initialize();
  }

  private initialize(): void {
    if (!this.container) {
      console.error('JSON Compare tab container not found');
      return;
    }

    // Clear the "Coming Soon" placeholder
    this.container.innerHTML = '<div id="json-compare-root"></div>';

    const rootElement = document.getElementById('json-compare-root');
    if (!rootElement) return;

    // Create Material-UI dark theme
    const darkTheme = createTheme({
      palette: {
        mode: 'dark',
        primary: {
          main: '#3b82f6',
        },
        background: {
          default: '#1a1a1a',
          paper: '#2d2d2d',
        },
      },
    });

    // Mount React component
    this.reactRoot = ReactDOM.createRoot(rootElement);
    this.reactRoot.render(
      React.createElement(ThemeProvider, { theme: darkTheme },
        React.createElement(React.Fragment, null,
          React.createElement(CssBaseline),
          React.createElement(JsonCompareTab)
        )
      )
    );
  }

  public destroy(): void {
    if (this.reactRoot) {
      this.reactRoot.unmount();
      this.reactRoot = null;
    }
  }
}