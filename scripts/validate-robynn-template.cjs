const fs = require('node:fs');
const path = require('node:path');

const {
  loadPages,
  loadSite,
  normalizeRoutePath,
  pagePathForRoute,
  rootDir,
} = require('./robynn-template-utils.cjs');

const errors = [];
const site = loadSite();
const pages = loadPages();

function requireValue(condition, message) {
  if (!condition) errors.push(message);
}

requireValue(site.schemaVersion === 1, 'content/site.json must use schemaVersion 1.');
requireValue(site.site?.name, 'content/site.json must include site.name.');
requireValue(
  site.site?.canonicalBaseUrl,
  'content/site.json must include site.canonicalBaseUrl.',
);
requireValue(
  fs.existsSync(path.join(rootDir, 'app/[[...slug]]/page.tsx')),
  'app/[[...slug]]/page.tsx is required for Robynn page JSON routing.',
);
requireValue(pages.length > 0, 'At least one content/pages/*.json file is required.');

const routes = new Set();

for (const page of pages) {
  const doc = page.document;
  const routePath = normalizeRoutePath(doc.routePath);
  const expectedPath = pagePathForRoute(routePath);

  requireValue(doc.schemaVersion === 1, `${page.sourceFile} must use schemaVersion 1.`);
  requireValue(doc.title, `${page.sourceFile} must include title.`);
  requireValue(
    Array.isArray(doc.sections),
    `${page.sourceFile} must include sections array.`,
  );
  requireValue(
    page.sourceFile === expectedPath,
    `${page.sourceFile} should be named ${expectedPath}.`,
  );
  requireValue(!routes.has(routePath), `Duplicate routePath ${routePath}.`);
  routes.add(routePath);

  for (const [index, section] of (doc.sections || []).entries()) {
    requireValue(section.id, `${page.sourceFile} sections[${index}] must include id.`);
    requireValue(section.type, `${page.sourceFile} sections[${index}] must include type.`);
    if (section.type === 'legacy-html') {
      requireValue(
        typeof section.html === 'string',
        `${page.sourceFile} legacy-html section ${section.id} must include html.`,
      );
    }
  }
}

if (errors.length) {
  console.error('Robynn template validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Robynn template validation passed for ${pages.length} page(s).`);
