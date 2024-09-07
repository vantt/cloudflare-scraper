import { jest } from '@jest/globals';
import Scraper from '../../src/index.js';

// Mock HTMLRewriter
class MockHTMLRewriter {
    constructor() {
      this.handlers = {};
      this.mockHTML = '';
    }
  
    on(selector, handlers) {
      this.handlers[selector] = handlers;
      return this;
    }
  
    transform(response) {
      return {
        arrayBuffer: async () => {
          // Simulate processing
          for (const [selector, handlers] of Object.entries(this.handlers)) {
            if (this.mockHTML.includes(selector)) {
              const mockElement = {
                getAttribute: (attr) => `mock-${attr}`,                
              };
              handlers.element(mockElement);
              handlers.text({ text: 'Mock Content', lastInTextNode: true });
            }
          }
        }
      };
    }
  
    setMockHTML(html) {
      this.mockHTML = html;
    }
  }

// Mock fetch function
global.fetch = jest.fn();

// Mock HTMLRewriter
global.HTMLRewriter = MockHTMLRewriter;

describe('Scraper', () => {
  let scraper;
  let mockResponse;

  beforeEach(() => {
    scraper = new Scraper();
    mockResponse = {
      headers: new Map(),
      status: 200,
      clone: () => mockResponse,
    };
    global.fetch.mockResolvedValue(mockResponse);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('fetch method should set response and handle errors', async () => {
    await scraper.fetch('https://example.com');
    expect(scraper.response).toBe(mockResponse);

    // Test error handling
    global.fetch.mockRejectedValueOnce(new Error('Network error'));
    await expect(scraper.fetch('https://example.com')).rejects.toThrow('Failed to fetch URL: Network error');
  });

  test('html method should extract HTML content', async () => {
    await scraper.fetch('https://example.com');
    scraper.rewriter.setMockHTML('<div>Mock Content</div>');
    
    const result = await scraper.html('div');
    expect(result).toBe('<div>Mock Content</div>');
  });

  test('text method should extract text content', async () => {
    await scraper.fetch('https://example.com');
    scraper.rewriter.setMockHTML('<p>Mock Content</p>');
    
    const result = await scraper.text('p');
    expect(result).toBe('Mock Content');
  });

  test('attribute method should extract attribute value', async () => {
    await scraper.fetch('https://example.com');
    scraper.rewriter.setMockHTML('<a href="https://example.com">Link</a>');
    
    const result = await scraper.attribute('a', 'href');
    expect(result).toBe('https://example.com');
  });

  test('chain method should allow chaining of operations', async () => {
    await scraper.fetch('https://example.com');
    scraper.rewriter.setMockHTML('<div><p>Mock Content</p><a href="https://example.com">Link</a></div>');
    
    const results = await scraper.chain()
      .html('div')
      .text('p')
      .attribute('a', 'href')
      .getResult();
    
    expect(results).toEqual([
      '<div>Mock Content</div>',
      'Mock Content',
      'https://example.com'
    ]);
  });

  test('getResult should throw error when not in chain mode', async () => {
    await expect(scraper.getResult()).rejects.toThrow('getResult() can only be called in chain mode');
  });
});