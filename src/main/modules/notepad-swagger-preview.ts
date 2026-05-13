import { randomUUID } from 'crypto';
import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from 'http';

const PREVIEW_HOST = '127.0.0.1';
const PREVIEW_ROUTE_PREFIX = '/swagger-preview/';
const MAX_PREVIEW_ENTRIES = 24;

const previewContents = new Map<string, string>();
const previewOrder: string[] = [];

let previewServer: Server | null = null;
let previewServerPort: number | null = null;
let previewServerPromise: Promise<number> | null = null;

function setCorsHeaders(res: ServerResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, max-age=0'
  );
}

function trimPreviewCache(): void {
  while (previewOrder.length > MAX_PREVIEW_ENTRIES) {
    const oldestId = previewOrder.shift();
    if (oldestId) {
      previewContents.delete(oldestId);
    }
  }
}

function matchPreviewId(req: IncomingMessage): string | null {
  const reqUrl = req.url ?? '/';
  const parsedUrl = new URL(reqUrl, `http://${PREVIEW_HOST}`);
  const match = parsedUrl.pathname.match(
    /^\/swagger-preview\/([0-9a-f-]+)\.json$/i
  );
  return match?.[1] ?? null;
}

function handlePreviewRequest(req: IncomingMessage, res: ServerResponse): void {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const previewId = matchPreviewId(req);
  if (!previewId) {
    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'Preview not found' }));
    return;
  }

  const content = previewContents.get(previewId);
  if (!content) {
    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'Preview not found' }));
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(content);
}

async function ensurePreviewServer(): Promise<number> {
  if (previewServerPort !== null) {
    return previewServerPort;
  }

  if (previewServerPromise) {
    return previewServerPromise;
  }

  previewServerPromise = new Promise<number>((resolve, reject) => {
    const server = createServer(handlePreviewRequest);

    server.once('error', (error) => {
      previewServer = null;
      previewServerPort = null;
      previewServerPromise = null;
      reject(error);
    });

    server.listen(0, PREVIEW_HOST, () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        previewServer = null;
        previewServerPort = null;
        previewServerPromise = null;
        server.close();
        reject(new Error('Failed to determine Swagger preview server port'));
        return;
      }

      previewServer = server;
      previewServer.unref();
      previewServerPort = address.port;
      previewServerPromise = null;
      resolve(address.port);
    });
  });

  return previewServerPromise;
}

export async function prepareSwaggerPreview(content: string): Promise<{
  previewId: string;
  previewUrl: string;
}> {
  const port = await ensurePreviewServer();
  const previewId = randomUUID();

  previewContents.set(previewId, content);
  previewOrder.push(previewId);
  trimPreviewCache();

  return {
    previewId,
    previewUrl: `http://${PREVIEW_HOST}:${port}${PREVIEW_ROUTE_PREFIX}${previewId}.json`,
  };
}

export async function disposeSwaggerPreviewServer(): Promise<void> {
  previewContents.clear();
  previewOrder.length = 0;

  if (previewServerPromise) {
    await previewServerPromise.catch(() => undefined);
  }

  if (!previewServer) {
    previewServerPort = null;
    previewServerPromise = null;
    return;
  }

  const server = previewServer;
  previewServer = null;
  previewServerPort = null;
  previewServerPromise = null;

  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}
