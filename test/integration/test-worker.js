import Scraper from '../../src/Scraper.js';

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  if (request.method === 'POST' && new URL(request.url).pathname === '/scrape') {
    const { url, selector, attribute } = await request.json();
    const scraper = new Scraper();
    await scraper.fetch(url);

    let result;
    if (attribute) {
      result = { attribute: await scraper.attribute(selector, attribute) };
    } else {
      result = { text: await scraper.text(selector) };
    }

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response('Not Found', { status: 404 });
}