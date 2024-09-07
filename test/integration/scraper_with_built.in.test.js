import { Miniflare } from 'miniflare';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Cloudflare Scraper Integration Test', () => {
  let mf;
  let localHtml;

  beforeAll(async () => {
    try {
      mf = new Miniflare({
        scriptPath: path.join(__dirname, 'test-worker-with-scraper-built.js'),
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
 

  describe('example.com', () => {
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

      test('Should handle text extraction with remove whitespace option', async () => {
        const res = await mf.dispatchFetch('http://localhost:8787/single', {
          method: 'POST',
          body: JSON.stringify({
            url: 'https://example.com',
            operations: { selector: 'style', extractor: 'text', options: { preserveWhitespace : false } }
          })
        });
        const result = await res.json();
        expect(result).toEqual(`body { background-color: #f0f0f2; margin: 0; padding: 0; font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", "Open Sans", "Helvetica Neue", Helvetica, Arial, sans-serif; } div { width: 600px; margin: 5em auto; padding: 2em; background-color: #fdfdff; border-radius: 0.5em; box-shadow: 2px 3px 7px 2px rgba(0,0,0,0.02); } a:link, a:visited { color: #38488f; text-decoration: none; } @media (max-width: 700px) { div { margin: 0 auto; width: auto; } }`);
      });

      test('Should handle text extraction with preserve whitespace option', async () => {
        const res = await mf.dispatchFetch('http://localhost:8787/single', {
          method: 'POST',
          body: JSON.stringify({
            url: 'https://example.com',
            operations: { selector: 'style', extractor: 'text', options: { preserveWhitespace : true } }
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
              { selector: 'h1', extractor: 'html' },
              { selector: 'p', extractor: 'text' },
              { selector: 'a', extractor: 'attribute', attribute: 'href' }
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
  });

  describe('Error handling', () => {
    test('Should handle invalid selectors', async () => {
      const res = await mf.dispatchFetch('http://localhost:8787/single', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://example.com',
          operations: { selector: '#non-existent', extractor: 'text' }
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
          operations: { selector: 'h1', extractor: 'text' }
        })
      });
      expect(res.status).toBe(500);
    });
  });

  describe('Local HTML', () => {
    beforeEach(() => {
      localHtml = fs.readFileSync(path.join(__dirname, 'test.html'), 'utf-8');
    });

    describe('Single operations', () => {
      test('Should extract text content', async () => {
        const res = await mf.dispatchFetch('http://localhost:8787/single', {
          method: 'POST',
          body: JSON.stringify({
            html: localHtml,
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
            html: localHtml,
            operations: { selector: 'h1', extractor: 'html' }
          })
        });
        const result = await res.json();
        expect(result).toContain('<h1>Example Domain</h1>');
      });

      
      test('Should extract HTML content 2', async () => {
        const res = await mf.dispatchFetch('http://localhost:8787/single', {
          method: 'POST',
          body: JSON.stringify({
            html: localHtml,
            operations: { selector: 'a', extractor: 'html' }
          })
        });
        const result = await res.json();        
        expect(result).toContain('<a href="https://www.iana.org/domains/example">More information...</a>');
      });


      test('Should extract attribute', async () => {
        const res = await mf.dispatchFetch('http://localhost:8787/single', {
          method: 'POST',
          body: JSON.stringify({
            html: localHtml,
            operations: { selector: 'a', extractor: 'attribute', attribute: 'href' }
          })
        });
        const result = await res.json();
        expect(result).toBe('https://www.iana.org/domains/example');
      });

      test('Should handle text extraction with remove whitespace option', async () => {
        const res = await mf.dispatchFetch('http://localhost:8787/single', {
          method: 'POST',
          body: JSON.stringify({
            html: localHtml,
            operations: { selector: 'style', extractor: 'text', options: { preserveWhitespace : false } }
          })
        });
        const result = await res.json();
        expect(result).toEqual(`body { background-color: #f0f0f2; margin: 0; padding: 0; font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", "Open Sans", "Helvetica Neue", Helvetica, Arial, sans-serif; } div { width: 600px; margin: 5em auto; padding: 2em; background-color: #fdfdff; border-radius: 0.5em; box-shadow: 2px 3px 7px 2px rgba(0,0,0,0.02); } a:link, a:visited { color: #38488f; text-decoration: none; } @media (max-width: 700px) { div { margin: 0 auto; width: auto; } }`);
      });

      test('Should handle text extraction with preserve whitespace option', async () => {
        const res = await mf.dispatchFetch('http://localhost:8787/single', {
          method: 'POST',
          body: JSON.stringify({
            html: localHtml,
            operations: { selector: 'style', extractor: 'text', options: { preserveWhitespace : true } }
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
            html: localHtml,
            operations: [
              { selector: 'h1', extractor: 'html' },
              { selector: 'p', extractor: 'text' },
              { selector: 'a', extractor: 'attribute', attribute: 'href' }
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
  });
});
