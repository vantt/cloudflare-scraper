# cloudflare-scraper
A scraper class for Cloudflare Workers

## Overview

The Scraper class is a tool designed for web scraping tasks in a Cloudflare Worker environment. It provides an intuitive API for extracting HTML, text, and attributes from web pages, with support for both single operations and chained multiple operations.

## Basic Usage

### Creating a Scraper Instance

You can create a Scraper instance using the static `create` method:

```javascript
const scraper = await Scraper.create('https://example.com');
```

Alternatively, you can use the constructor and `fetch` method:

```javascript
const scraper = new Scraper();
await scraper.fetch('https://example.com');
```

### Single Operations

#### Extracting HTML

To extract the HTML content of an element:

```javascript
const html = await scraper.html('div.content');
```

#### Extracting Text

To extract the text content of an element:

```javascript
const text = await scraper.text('p.description');
```

You can also specify options:

```javascript
const text = await scraper.text('p.description', { spaced: true });
```

#### Extracting Attributes

To extract an attribute from an element:

```javascript
const href = await scraper.attribute('a.link', 'href');
```

### Chained Operations

You can chain multiple operations together:

```javascript
const results = await scraper.chain()
  .html('div.content')
  .text('p.description')
  .attribute('a.link', 'href')
  .getResult();
```

## Advanced Usage

### Using querySelector

For compatibility with the original API, you can use the `querySelector` method:

```javascript
const text = await scraper.querySelector('p.description').getText();
```

### Error Handling

The Scraper class includes built-in error handling for common issues, including Cloudflare-specific errors. It's recommended to wrap your scraping operations in try-catch blocks:

```javascript
try {
  const scraper = await Scraper.create('https://example.com');
  const content = await scraper.text('div.content');
} catch (error) {
  console.error('Scraping failed:', error.message);
}
```

## Explanation of Key Features

1. **HTMLRewriter Usage**: The Scraper class utilizes Cloudflare's HTMLRewriter for efficient HTML parsing. This allows for streaming parsing of HTML, which is crucial for performance in a Worker environment.

2. **Flexible API**: The class supports both immediate execution of single operations and chained execution of multiple operations. This flexibility allows for various scraping patterns.

3. **Error Handling**: The class includes robust error handling, especially for Cloudflare-specific scenarios. It distinguishes between errors in the Worker itself and errors from the scraped site.

4. **Text Extraction**: The `getText` method includes advanced features like handling multiple selectors and optional spacing between text nodes.

5. **Attribute Extraction**: The `getAttribute` method efficiently extracts the first matching attribute value.

6. **Chainable Operations**: The `chain` method allows for defining multiple operations that are executed together, which can be more efficient for complex scraping tasks.

7. **Stateless Design**: The class is designed to be stateless between operations, which aligns well with the Cloudflare Worker environment.

## Best Practices

1. Use chained operations when scraping multiple elements from the same page to reduce the number of HTTP requests.
2. Be mindful of the Worker CPU time limits (50ms on the free plan) when scraping large or complex pages.
3. Implement caching mechanisms in your Worker script to store frequently scraped data and reduce load on target websites.
4. Respect robots.txt files and implement rate limiting to be a good web citizen.
5. Use error handling to gracefully manage cases where the scraped website's structure changes.

## Limitations

1. The Scraper class is designed for use in a Cloudflare Worker environment and may not work in other contexts without modification.
2. Complex JavaScript-rendered content may not be scrapable with this class, as it operates on the initial HTML response.
3. Large pages may approach CPU time limits in the Worker environment. Consider implementing pagination or incremental scraping for such cases.

By following this guide, you should be able to effectively use the Scraper class for various web scraping tasks in your Cloudflare Worker projects.