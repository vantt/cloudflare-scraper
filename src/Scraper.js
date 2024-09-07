export class Scraper {
  constructor() {
    this.rewriter = new HTMLRewriter();
    this.operations = [];
    this.response = null;
    this.chainMode = false;
    this.url = null;
  }

  static async create(url, options = {}) {
    const scraper = new Scraper();
    await scraper.fetch(url, options);
    return scraper;
  }

  async fetch(url, init) {
    this.url = url;
    try {
      this.response = await fetch(url, init);
      const server = this.response.headers.get('server');

      const isThisWorkerErrorNotErrorWithinScrapedSite = (
        [530, 503, 502, 403, 400].includes(this.response.status) &&
        (server === 'cloudflare' || !server /* Workers preview editor */)
      );

      if (isThisWorkerErrorNotErrorWithinScrapedSite) {
        throw new Error(`Status ${this.response.status} requesting ${url}`);
      }
    } catch (error) {
      throw new Error(`Failed to fetch URL: ${error.message}`);
    }
    return this;
  }

  querySelector(selector) {
    this.selector = selector;
    return this;
  }

  async html(selector) {
    if (this.chainMode) {
      this.operations.push({ extractor: 'html', selector });
      return this;
    }
    return this.executeOperation({ extractor: 'html', selector });
  }

  async text(selector, options = {}) {
    if (this.chainMode) {
      this.operations.push({ extractor: 'text', selector, options });
      return this;
    }
    return this.executeOperation({ extractor: 'text', selector, options });
  }

  async attribute(selector, attributeName) {
    if (this.chainMode) {
      this.operations.push({ extractor: 'attribute', selector, attributeName });
      return this;
    }
    return this.executeOperation({ extractor: 'attribute', selector, attributeName });
  }

  chain() {
    this.chainMode = true;
    return this;
  }

  async getResult() {
    if (!this.chainMode) {
      throw new Error('getResult() can only be called in chain mode');
    }
    const results = await Promise.all(this.operations.map(op => this.executeOperation(op)));
    this.operations = [];
    this.chainMode = false;
    return results;
  }

  async executeOperation(operation) {
    switch (operation.extractor) {
      case 'html':
        return this.extractHtml(operation.selector);
      case 'text':
        return this.getText(operation.selector, operation.options);
      case 'attribute':
        return this.getAttribute(operation.selector, operation.attributeName);
      default:
        throw new Error(`Unknown operation extractor: ${operation.extractor}`);
    }
  }

  /**
   * Extracts the HTML content of elements matching the given selector.
   * 
   * This method uses HTMLRewriter to parse the response and extract the HTML
   * content of matching elements. It handles nested elements, self-closing tags,
   * and ensures all opened tags are properly closed.
   * 
   * @param {string} selector - The CSS selector for target elements.
   * @returns {Promise<string>} A promise that resolves to the extracted HTML content.
   */
  async extractHtml(selector) {
    let html = '';
    let depth = 0;
    let capturing = false;
    let tagStack = [];
  
    await new HTMLRewriter()
      .on(selector, {
        element(element) {
          if (!capturing) {
            capturing = true;
            depth = 0;
          }
          if (capturing) {
            html += `<${element.tagName}`;
            for (const [name, value] of element.attributes) {
              html += ` ${name}="${value}"`;
            }
            html += element.selfClosing ? '/>' : '>';
            if (!element.selfClosing) {
              tagStack.push(element.tagName);
              depth++;
            }
          }
        },
        text(text) {
          if (capturing) {
            html += text.text;
          }
        },
        comments(comment) {
          if (capturing) {
            html += `<!--${comment.text}-->`;
          }
        },
        endTag(end) {
          if (capturing) {
            html += `</${end.tagName}>`;
            if (tagStack.length > 0 && tagStack[tagStack.length - 1] === end.tagName) {
              tagStack.pop();
              depth--;
              if (depth === 0) {
                capturing = false;
              }
            }
          }
        }
      })
      .transform(this.response.clone())
      .arrayBuffer();
  
    // Ensure all opened tags are closed
    while (tagStack.length > 0) {
      html += `</${tagStack.pop()}>`;
    }
  
    return html;
  }

  async getText(selector, { preserveWhitespace = false } = {}) {
    const matches = {};
    const selectors = selector.split(',').map(s => s.trim());

    selectors.forEach((sel) => {
      matches[sel] = [];
      let nextText = '';

      this.rewriter.on(sel, {
        element() {
          matches[sel].push(true);
          nextText = '';
        },
        text(text) {
          nextText += text.text;
          if (text.lastInTextNode) {
            if (preserveWhitespace) nextText += "\n";
            matches[sel].push(nextText);
            nextText = '';
          }
        }
      });
    });

    const transformed = this.rewriter.transform(this.response.clone());
    await transformed.arrayBuffer();

    selectors.forEach((sel) => {
      const nodeCompleteTexts = [];
      let nextText = '';

      matches[sel].forEach(text => {
        if (text === true) {
          if (nextText !== '') {
            nodeCompleteTexts.push(preserveWhitespace ? nextText : this.cleanText(nextText));
            nextText = '';
          }
        } else {
          nextText += text;
        }
      });

      const lastText = preserveWhitespace ? nextText : this.cleanText(nextText);
      if (lastText !== '') nodeCompleteTexts.push(lastText);
      matches[sel] = nodeCompleteTexts;
    });

    return selectors.length === 1 ? matches[selectors[0]].join('') : matches;
  }

  async getAttribute(selector, attribute) {
    let attributeValue = null;
    await new HTMLRewriter()
      .on(selector, {
        element(element) {
          if (attributeValue === null) {
            attributeValue = element.getAttribute(attribute) || '';
          }
        }
      })
      .transform(this.response.clone())
      .arrayBuffer();
    return attributeValue;
  }

  cleanText(text) {
    return text.trim().replace(/\s+/g, ' ');
  }

  /**
   * Sets the HTML content of the response.
   * 
   * This method allows you to set the HTML content of the response, which can be
   * useful for testing or simulating responses in a controlled environment.
   * 
   * @param {string} html - The HTML content to set as the response.
   * @returns {Promise<void>} A promise that resolves when the response is set.
   */
  async setHTML(html) {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    this.response = await fetch(url, {
      headers: { 'Content-Type': 'text/html' }
    });

    // Add properties to make it more like a real HTTP response
    Object.defineProperties(this.response, {
      url: { value: 'http://example.com', writable: false },
      status: { value: 200, writable: false },
      statusText: { value: 'OK', writable: false },
      ok: { value: true, writable: false },
    });

    URL.revokeObjectURL(url);
  }
}