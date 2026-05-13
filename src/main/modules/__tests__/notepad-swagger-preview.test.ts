import { get } from 'http';

import { afterEach, describe, expect, it } from 'vitest';

import {
  disposeSwaggerPreviewServer,
  prepareSwaggerPreview,
} from '../notepad-swagger-preview';

function requestPreview(url: string): Promise<{
  body: string;
  headers: Record<string, string | string[] | undefined>;
  statusCode: number;
}> {
  return new Promise((resolve, reject) => {
    const req = get(url, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          body,
          headers: res.headers,
          statusCode: res.statusCode ?? 0,
        });
      });
    });

    req.on('error', reject);
  });
}

describe('prepareSwaggerPreview', () => {
  afterEach(async () => {
    await disposeSwaggerPreviewServer();
  });

  it('serves preview JSON over a loopback HTTP URL', async () => {
    const content = '{"openapi":"3.0.1"}';
    const preview = await prepareSwaggerPreview(content);
    const response = await requestPreview(preview.previewUrl);

    expect(preview.previewUrl).toContain(
      `/swagger-preview/${preview.previewId}.json`
    );
    expect(response.statusCode).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe('*');
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body).toBe(content);
  });
});
