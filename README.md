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