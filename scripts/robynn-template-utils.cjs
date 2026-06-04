const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const rootDir = process.cwd();
const contentDir = path.join(rootDir, 'content');
const pagesDir = path.join(contentDir, 'pages');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function normalizeRoutePath(value) {
  const route = `/${String(value || '').trim().replace(/^\/+|\/+$/g, '')}/`;
  return route === '//' ? '/' : route.replace(/\/+/g, '/');
}

function routeSlug(routePath) {
  return normalizeRoutePath(routePath)
    .replace(/^\/|\/$/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'home';
}

function pagePathForRoute(routePath) {
  const route = normalizeRoutePath(routePath);
  const hash = crypto
    .createHash('sha1')
    .update(route)
    .digest('hex')
    .slice(0, 8);
  return `content/pages/${routeSlug(route)}--${hash}.json`;
}

function snapshotPathForRoute(routePath) {
  const route = normalizeRoutePath(routePath);
  return route === '/'
    ? 'snapshots/index.html'
    : `snapshots/${route.replace(/^\/|\/$/g, '').replace(/\//g, '-')}.html`;
}

function loadSite() {
  return readJson(path.join(contentDir, 'site.json'));
}

function loadPages() {
  return fs
    .readdirSync(pagesDir)
    .filter((fileName) => fileName.endsWith('.json'))
    .map((fileName) => ({
      fileName,
      sourceFile: `content/pages/${fileName}`,
      document: readJson(path.join(pagesDir, fileName)),
    }))
    .sort((left, right) =>
      normalizeRoutePath(left.document.routePath).localeCompare(
        normalizeRoutePath(right.document.routePath),
      ),
    );
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function textFromSection(section) {
  if (!section || typeof section !== 'object') return '';
  if (section.type === 'hero') {
    return [section.script, ...(section.headingLines || []), section.tour?.label]
      .filter(Boolean)
      .join(' ');
  }
  if (section.type === 'welcome') {
    return [section.heading, section.body, section.cta?.label]
      .filter(Boolean)
      .join(' ');
  }
  if (section.type === 'gallery') {
    return [section.heading, ...(section.images || []).map((image) => image.alt)]
      .filter(Boolean)
      .join(' ');
  }
  if (section.type === 'amenities') {
    return [
      section.heading,
      ...(section.groups || []).flatMap((group) => [
        group.title,
        ...(group.items || []),
      ]),
    ]
      .filter(Boolean)
      .join(' ');
  }
  if (section.type === 'contact') {
    return [section.heading, section.subheading].filter(Boolean).join(' ');
  }
  if (section.type === 'legacy-html') {
    return section.html || '';
  }
  return '';
}

module.exports = {
  escapeHtml,
  loadPages,
  loadSite,
  normalizeRoutePath,
  pagePathForRoute,
  rootDir,
  snapshotPathForRoute,
  textFromSection,
  writeJson,
};
