/**
 * Swagger/OpenAPI preview renderer for the notepad preview pane.
 *
 * Parses YAML/JSON specs with js-yaml and renders them via SwaggerUI in an
 * iframe. The parsed spec is published over a loopback HTTP URL in the main
 * process so SwaggerUI can resolve recursive internal $ref values against a
 * normal hierarchical URL instead of a viewer document or file URL.
 */
import jsyaml from 'js-yaml';

interface SwaggerSpec {
  openapi?: string;
  swagger?: string;
  [key: string]: unknown;
}

let latestRenderId = 0;

/**
 * Parse YAML or JSON content to a Swagger spec object.
 */
function parseSwaggerContent(content: string): SwaggerSpec | null {
  const trimmed = content.trim();
  if (!trimmed) return null;

  // Try JSON first
  if (trimmed.startsWith('{')) {
    try {
      return JSON.parse(trimmed) as SwaggerSpec;
    } catch {
      // Fall through to YAML
    }
  }

  // Parse as YAML
  try {
    const doc = jsyaml.load(trimmed);
    if (doc && typeof doc === 'object' && !Array.isArray(doc)) {
      return doc as SwaggerSpec;
    }
  } catch (err) {
    // Surface YAML parse errors so users can diagnose failures with large specs.
    console.warn(
      '[Swagger Preview] YAML parse error:',
      err instanceof Error ? err.message : err
    );
  }

  return null;
}

function renderSwaggerError(container: HTMLElement, message: string): void {
  container.innerHTML = `<pre class="swagger-error">${message}</pre>`;
}

/**
 * Check if the content is a valid Swagger/OpenAPI spec.
 */
export function isSwaggerContent(content: string): boolean {
  const spec = parseSwaggerContent(content);
  if (!spec) return false;
  return !!(spec.openapi || spec.swagger);
}

/**
 * Render the Swagger preview by loading swagger-viewer.html in an iframe and
 * passing the parsed spec via postMessage.
 *
 * swagger-viewer.html has its own CSP that allows inline scripts, so it is
 * not subject to the parent page's strict `script-src 'self'` policy.
 * SwaggerUI is NOT initialized until it receives the spec via postMessage,
 * preventing any spurious fetch attempts.
 */
export async function renderSwagger(
  source: string,
  container: HTMLElement
): Promise<void> {
  const renderId = ++latestRenderId;
  container.innerHTML = '';

  const spec = parseSwaggerContent(source);
  if (!spec || (!spec.openapi && !spec.swagger)) {
    const hint = source.trim()
      ? ' (YAML/JSON parse failed — check DevTools console for details)'
      : '';
    renderSwaggerError(
      container,
      `Not a valid Swagger/OpenAPI specification${hint}`
    );
    return;
  }

  let previewResult:
    | {
        ok?: boolean;
        error?: string;
        previewUrl?: string;
      }
    | undefined;

  try {
    previewResult = await window.restbro.notepad.prepareSwaggerPreview(
      JSON.stringify(spec)
    );
  } catch {
    previewResult = {
      ok: false,
      error: 'Failed to prepare Swagger preview',
    };
  }

  if (renderId !== latestRenderId) {
    return;
  }

  if (!previewResult?.ok || !previewResult.previewUrl) {
    renderSwaggerError(
      container,
      previewResult?.error || 'Failed to prepare Swagger preview'
    );
    return;
  }

  const iframe = document.createElement('iframe');
  iframe.className = 'notepad-swagger-iframe';
  iframe.src = 'swagger-viewer.html';

  // Once the iframe document is ready, post the spec so SwaggerUI can render.
  iframe.addEventListener('load', () => {
    if (renderId !== latestRenderId) {
      return;
    }

    try {
      iframe.contentWindow?.postMessage(
        { type: 'swagger-preview-url', url: previewResult.previewUrl },
        '*'
      );
    } catch {
      // Silently ignore if the iframe window is unavailable.
    }
  });

  container.appendChild(iframe);
}
