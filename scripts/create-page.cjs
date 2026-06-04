const fs = require('node:fs');
const path = require('node:path');

const {
  normalizeRoutePath,
  pagePathForRoute,
  rootDir,
  writeJson,
} = require('./robynn-template-utils.cjs');

const routePath = normalizeRoutePath(process.argv[2] || '');
const title = process.argv.slice(3).join(' ') || routePath;

if (!process.argv[2]) {
  console.error('Usage: npm run create-page -- /route/ "Page title"');
  process.exit(1);
}

const relativePath = pagePathForRoute(routePath);
const absolutePath = path.join(rootDir, relativePath);

if (fs.existsSync(absolutePath)) {
  console.error(`${relativePath} already exists.`);
  process.exit(1);
}

writeJson(absolutePath, {
  schemaVersion: 1,
  routePath,
  title,
  description: '',
  sections: [
    {
      id: 'imported-content',
      type: 'legacy-html',
      label: `${title} content`,
      html: `<section class="welcome"><h2>${title}</h2><p>Replace this imported content with structured sections when ready.</p></section>`,
    },
  ],
});

console.log(`Created ${relativePath}`);
