# Ask AI Feature

The Ask AI feature integrates a local LLM (Large Language Model) into API Courier, allowing users to analyze API responses and ask questions about their API testing results without sending any data to external services.

## Features

- **Local AI Integration**: Uses `llama-server` running on `localhost:8080` with OpenAI-compatible API
- **Contextual Analysis**: Automatically captures request and response context when creating AI sessions
- **Persistent Sessions**: Chat sessions are saved locally and can be resumed
- **Professional UI**: Clean, dark-themed interface with chat bubbles and session management
- **Secure**: All data stays on your machine - no external API calls

## Setup

### Prerequisites

1. Install and run `llama-server` with a compatible model:
   ```bash
   llama-server --model your-model.gguf --port 8080
   ```

2. Default model ID is `qwen2.5-7b` (configurable in AI settings)

### Usage

1. **Create AI Session**: Click the "Ask AI" button above any JSON response
2. **Chat Interface**: Ask questions about the response, suggest tests, or analyze issues
3. **Session Management**: View all sessions in the left sidebar, search and organize them
4. **Settings**: Adjust temperature, max tokens, and other AI parameters

## Configuration

### Model Settings

Access via the settings gear icon in the AI chat:

- **Model**: Currently read-only, set to `qwen2.5-7b`
- **Temperature**: Controls response creativity (0.0 = deterministic, 1.0 = creative)
- **Max Tokens**: Maximum response length (100-4096)

### Engine Detection

The feature automatically detects if the local AI engine is running:

- **Engine Status**: Shows banner when `llama-server` is not accessible
- **Auto-retry**: Click "Check Again" to re-test connection
- **Health Checks**: Periodic background checks to monitor engine status

## Data Privacy

- **Local Only**: All AI processing happens on your machine
- **No External Calls**: Zero network requests to external AI services
- **Secret Masking**: Automatically redacts Authorization headers, tokens, and passwords
- **Session Storage**: Chat history stored in browser localStorage (can be cleared)

## Troubleshooting

### Engine Not Detected

If you see "Local AI engine not detected":

1. **Check llama-server**: Ensure it's running on `localhost:8080`
2. **Model Loading**: Wait for model to fully load (can take 1-2 minutes)
3. **Port Conflicts**: Verify port 8080 is available
4. **Firewall**: Check that localhost connections are allowed

### Common Commands

Start llama-server with different models:
```bash
# For Qwen2.5-7B (recommended)
llama-server --model qwen2.5-7b-instruct-q4_k_m.gguf --port 8080

# For other models
llama-server --model your-model.gguf --port 8080 --ctx-size 4096
```

### Performance Tips

- **Model Size**: Smaller quantized models (Q4_K_M) balance quality and speed
- **Context Size**: Larger contexts use more memory but provide better analysis
- **Temperature**: Lower values (0.1-0.3) for focused analysis, higher for creative suggestions

## Technical Details

### API Integration

The feature uses OpenAI-compatible endpoints:
- **URL**: `http://127.0.0.1:8080/v1/chat/completions`
- **Health Check**: `http://127.0.0.1:8080/health` (fallback to main endpoint)
- **Format**: Standard OpenAI chat completion format

### Security Configuration

The Content Security Policy (CSP) has been configured to allow connections to the local LLM:
```html
connect-src 'self' http://127.0.0.1:8080 http://localhost:8080;
```

This ensures the frontend can communicate with `llama-server` while maintaining security by only allowing connections to localhost.

### Data Flow

1. **Context Capture**: Request/response data captured when "Ask AI" is clicked
2. **Secret Masking**: Sensitive data automatically redacted
3. **Summarization**: Large JSON responses truncated intelligently (120KB limit)
4. **System Prompt**: Provides context about the API testing environment
5. **Local Processing**: All analysis happens via local `llama-server`

### Architecture

- **Service Layer**: `askAiService.ts` - API communication and data processing
- **Storage**: `askAiStore.ts` - Session management and persistence
- **Health**: `engineGuard.ts` - Engine status monitoring
- **UI**: `AskAiTab.ts` - Chat interface and user interactions

### Session Management

- **Auto-titles**: Sessions named after endpoint and timestamp
- **Message Limits**: 100 messages per session (auto-pruned)
- **Storage Limits**: 50 sessions maximum (oldest removed)
- **Search**: Filter sessions by title/content

## Disabling the Feature

To disable AI features:

1. **Remove Tab**: Comment out the Ask AI tab in `index.html`
2. **Remove Button**: Hide the "Ask AI" button in response actions
3. **Skip Initialization**: Comment out `askAiTab.initialize()` in `index.ts`

The feature gracefully degrades when the engine is not available.

## Development

### Adding New Features

- **Streaming Responses**: TODO - implement SSE streaming for real-time responses
- **Custom Prompts**: Add user-defined system prompts
- **Export Options**: Export conversations as markdown/JSON
- **Model Switching**: Dynamic model selection in settings

### Testing

- **Unit Tests**: Test service functions with mock responses
- **Integration Tests**: Verify engine communication
- **UI Tests**: Check chat interface interactions

### Production Considerations

- **Logging**: Secrets are automatically masked in all logs
- **Error Handling**: Graceful fallbacks when engine is unavailable
- **Memory Usage**: Automatic cleanup of old sessions and large responses
- **Security**: No external network calls, all processing local