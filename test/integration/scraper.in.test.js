import { Miniflare } from 'miniflare';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Cloudflare Scraper Integration Test', () => {
  let mf;

  beforeAll(async () => {
    try {
      mf = new Miniflare({
        scriptPath: path.join(__dirname, 'test-worker-with-scraper.js'),
        modules: true,
        modulesRules: [{ type: "ESModule", include: ["**/*.js"] }],
        rootPath: path.resolve(__dirname, '../..'),
        envPath: path.join(__dirname, '../../.env'),
        packagePath: true,
        sourceMap: true,
      });
    } catch (error) {
      console.error('Error initializing Miniflare:', error);
      throw error;
    }
  });

  afterAll(async () => {
    await mf.dispose();
  });
 

  describe('Single operations', () => {
    test('Should extract text content', async () => {
      const res = await mf.dispatchFetch('http://localhost:8787/single', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://example.com',
          operations: { selector: 'p', extractor: 'text' }
        })
      });
      const result = await res.json();
      expect(result).toContain('This domain is for use in illustrative examples in documents.');
    });


    test('Should extract HTML content', async () => {
      const res = await mf.dispatchFetch('http://localhost:8787/single', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://example.com',
          operations: { selector: 'h1', extractor: 'html' }
        })
      });
      const result = await res.json();
      console.log(result);
      expect(result).toContain('<h1>Example Domain</h1>');
    });

    
    test('Should extract HTML content 2', async () => {
      const res = await mf.dispatchFetch('http://localhost:8787/single', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://example.com',
          operations: { selector: 'a', extractor: 'html' }
        })
      });
      const result = await res.json();
      console.log(result);
      expect(result).toContain('<a href="https://www.iana.org/domains/example">More information...</a>');
    });


    test('Should extract attribute', async () => {
      const res = await mf.dispatchFetch('http://localhost:8787/single', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://example.com',
          operations: { selector: 'a', extractor: 'attribute', attribute: 'href' }
        })
      });
      const result = await res.json();
      expect(result).toBe('https://www.iana.org/domains/example');
    });

    test('Should handle text extraction with spacing option', async () => {
      const res = await mf.dispatchFetch('http://localhost:8787/single', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://example.com',
          operations: { selector: 'style', extractor: 'text', options: { spaced: true } }
        })
      });
      const result = await res.json();
      expect(result).toContain('\n');
    });
  });

  describe('Multiple operations (chained)', () => {
    test('Should perform multiple operations in a chain', async () => {
      const res = await mf.dispatchFetch('http://localhost:8787/multiple', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://example.com',
          operations: [
            { selector: 'h1', type: 'html' },
            { selector: 'p', type: 'text' },
            { selector: 'a', type: 'attribute', attribute: 'href' }
          ]
        })
      });
      const result = await res.json();
      expect(result).toHaveLength(3);
      expect(result[0]).toContain('<h1>Example Domain</h1>');
      expect(result[1]).toContain('This domain is for use in illustrative examples in documents.');
      expect(result[2]).toBe('https://www.iana.org/domains/example');
    });
  });

  describe('Error handling', () => {
    test('Should handle invalid selectors', async () => {
      const res = await mf.dispatchFetch('http://localhost:8787/single', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://example.com',
          operations: { selector: '#non-existent', type: 'text' }
        })
      });
      const result = await res.json();
      expect(result).toBe('');
    });

    test('Should handle network errors', async () => {
      const res = await mf.dispatchFetch('http://localhost:8787/single', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://non-existent-url.com',
          operations: { selector: 'h1', type: 'text' }
        })
      });
      expect(res.status).toBe(500);
    });
  });
});
