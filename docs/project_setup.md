# Publishing the Scraper Class as a Standalone Library using Rollup

This guide will walk you through the process of publishing the Scraper class as a standalone library using Rollup as the build tool.

## 1. Prepare the Project Structure

1. Create a new directory for your project:
   ```
   mkdir cloudflare-scraper
   cd cloudflare-scraper
   ```

2. Initialize a new npm project:
   ```
   npm init -y
   ```

3. Create a `src` directory and add your Scraper class:
   ```
   mkdir src
   touch src/index.js
   ```

4. Open `src/index.js` and add your Scraper class code:

```javascript
export class Scraper {
  // Your Scraper class implementation here
}
```

## 2. Set Up Rollup Build Process

1. Install Rollup and necessary plugins:
   ```
   npm install --save-dev rollup @rollup/plugin-node-resolve @rollup/plugin-commonjs @rollup/plugin-babel @babel/core @babel/preset-env @rollup/plugin-terser
   ```

2. Create a `rollup.config.js` file in the project root:
   ```javascript
   import resolve from '@rollup/plugin-node-resolve';
   import commonjs from '@rollup/plugin-commonjs';
   import babel from '@rollup/plugin-babel';
   import pkg from './package.json';

   export default {
     input: 'src/index.js',
     output: [
       {
         file: pkg.main,
         format: 'cjs',
         exports: 'named',
         plugins: [terser()],
       },
       {
         file: pkg.module,
         format: 'es',
         exports: 'named',
         plugins: [terser()],
       },
     ],
     plugins: [
       resolve(),
       commonjs(),
       babel({
         babelHelpers: 'bundled',
         exclude: 'node_modules/**',
         presets: ['@babel/preset-env'],
       }),
     ],
   };
   ```

3. Create a `.babelrc` file in the project root:
   ```json
   {
     "presets": [["@babel/preset-env", { "targets": { "node": "current" } }]]
   }
   ```

4. Update `package.json` with build scripts and output files:
   ```json
   {
     "main": "dist/index.cjs.js",
     "module": "dist/index.esm.js",
     "files": ["dist"],
     "scripts": {
       "build": "rollup -c",
       "prepublishOnly": "npm run build"
     }
   }
   ```

## 3. Add Documentation

1. Create a README.md file in the project root:
   ```
   touch README.md
   ```

2. Add basic usage instructions and examples to the README.md file.

## 4. Publish to GitHub

1. Initialize a git repository:
   ```
   git init
   ```

2. Create a `.gitignore` file:
   ```
   echo "node_modules/
   dist/
   " > .gitignore
   ```

3. Commit your files:
   ```
   git add .
   git commit -m "Initial commit of Scraper library using Rollup"
   ```

4. Create a new repository on GitHub.

5. Push your code to GitHub:
   ```
   git remote add origin https://github.com/your-username/cloudflare-scraper.git
   git push -u origin main
   ```

## 5. Publish to npm

1. Make sure you're logged in to npm:
   ```
   npm login
   ```

2. Update `package.json` with necessary information:
   ```json
   {
     "name": "cloudflare-scraper",
     "version": "1.0.0",
     "description": "A scraper class for Cloudflare Workers",
     "main": "dist/index.cjs.js",
     "module": "dist/index.esm.js",
     "files": ["dist"],
     "scripts": {
       "build": "rollup -c",
       "prepublishOnly": "npm run build"
     },
     "keywords": ["cloudflare", "worker", "scraper"],
     "author": "Your Name",
     "license": "MIT"
   }
   ```

3. Publish to npm:
   ```
   npm publish --access=public
   ```

## 6. Usage Instructions

Add the following usage instructions to your README.md:

```markdown
## Installation

```bash
npm install cloudflare-scraper
```

## Usage

In your Cloudflare Worker project:

```javascript
import { Scraper } from 'cloudflare-scraper';

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const scraper = new Scraper();
  await scraper.fetch('https://example.com');
  const title = await scraper.text('title');
  return new Response(`Title: ${title}`);
}
```
```