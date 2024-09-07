import Scraper from '../../src/index.js';

/**
 * JSON body structure for worker operations
 * 
 * 1. Single Extraction Mode:
 * {
 *   "url": "https://example.com",
 *   "operations": {
 *     "selector": "CSS selector string",
 *     "extractor": "html" | "text" | "attribute",
 *     "attribute": "attribute name", // Optional, only for "attribute" extractor
 *     "options": {} // Optional, additional options for the extractor
 *   }
 * }
 * 
 * 2. Multiple Extraction Mode:
 * {
 *   "url": "https://example.com",
 *   "operations": [
 *     {
 *       "selector": "CSS selector string",
 *       "extractor": "html" | "text" | "attribute",
 *       "attribute": "attribute name", // Optional, only for "attribute" extractor
 *       "options": {} // Optional, additional options for the extractor
 *     },
 *     // ... more operations can be added to the array
 *   ]
 * }
 */

export default {
    async fetch(request, env, ctx) {
        const { pathname } = new URL(request.url);
        const { url, html, operations } = await request.json();

        const scraper = new Scraper();
//        await scraper.fetch(url);

        if (html) {
            // If HTML is provided, use it directly
            await scraper.setHTML(html);
        } else {
            // Otherwise, fetch from URL
            await scraper.fetch(url);
        }

        let result;

        try {
            if (pathname === '/single') {
                const { selector, extractor, attribute, options = {} } = operations;
                switch (extractor) {
                    case 'html':
                        result = await scraper.html(selector);
                        break;
                    case 'text':
                        result = await scraper.text(selector, options);
                        break;
                    case 'attribute':
                        result = await scraper.attribute(selector, attribute);
                        break;
                    default:
                        throw new Error('Invalid operation extractor');
                }
            }
            else if (pathname === '/multiple') {
                const chainedScraper = scraper.chain();

                for (const op of operations) {
                    const { selector, extractor, attribute, options = {} } = op;

                    switch (extractor) {
                        case 'html':
                            chainedScraper.html(selector);
                            break;
                        case 'text':
                            chainedScraper.text(selector, options);
                            break;
                        case 'attribute':
                            chainedScraper.attribute(selector, attribute);
                            break;
                    }
                }

                result = await chainedScraper.getResult();
            }
            else {
                throw new Error('Invalid endpoint');
            }

            return new Response(JSON.stringify(result), {
                headers: { 'Content-Type': 'application/json' },
            });
        }
        catch (error) {
            return new Response(`Error: ${error.message}`, { status: 500 });
        }
    }
};