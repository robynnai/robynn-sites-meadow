const fs = require('node:fs');
const path = require('node:path');

const {
  escapeHtml,
  loadPages,
  loadSite,
  normalizeRoutePath,
  rootDir,
  snapshotPathForRoute,
  textFromSection,
} = require('./robynn-template-utils.cjs');

const bundleDir = path.join(rootDir, '.robynn/site-bundle');
const snapshotsDir = path.join(bundleDir, 'snapshots');
const site = loadSite();
const pages = loadPages();
const commitSha = process.env.VERCEL_GIT_COMMIT_SHA || gitValue('rev-parse HEAD');
const branch = process.env.VERCEL_GIT_COMMIT_REF || gitValue('branch --show-current') || site.site.branch;

function gitValue(command) {
  try {
    return require('node:child_process')
      .execSync(`git ${command}`, { cwd: rootDir, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return '';
  }
}

function canonicalUrl(routePath) {
  const base = site.site.canonicalBaseUrl.replace(/\/+$/, '');
  const route = normalizeRoutePath(routePath);
  return route === '/' ? `${base}/` : `${base}${route}`;
}

function target(id, routePath, kind, label, selector, currentValue, sourceFile, jsonPath, propPath) {
  return {
    id,
    routePath,
    kind,
    label,
    selector,
    currentValue,
    source: {
      filePath: sourceFile,
      strategy: 'json-path',
      match: { jsonPath, propPath, value: currentValue },
    },
  };
}

function pageTargets(page) {
  const routePath = normalizeRoutePath(page.document.routePath);
  const sourceFile = page.sourceFile;
  const targets = [];

  page.document.sections.forEach((section, sectionIndex) => {
    const sectionPath = ['sections', String(sectionIndex)];
    const sectionTarget = (suffix, kind, label, value, extraPath = []) =>
      targets.push(
        target(
          `${section.id}__${suffix}`,
          routePath,
          kind,
          label,
          `[data-robynn-target='home__${section.id}_${suffix}'], [data-robynn-target='${section.id}__${suffix}']`,
          value,
          sourceFile,
          `$.${[...sectionPath, ...extraPath].join('.')}`,
          [...sectionPath, ...extraPath],
        ),
      );

    if (section.type === 'hero') {
      sectionTarget('script', 'text', 'Hero script', section.script, ['script']);
      sectionTarget(
        'heading',
        'text',
        'Hero heading',
        section.headingLines.join('\n'),
        ['headingLines'],
      );
      sectionTarget('tour_label', 'text', 'Hero tour label', section.tour.label, [
        'tour',
        'label',
      ]);
      sectionTarget('tour_link', 'link', 'Hero tour link', section.tour.href, [
        'tour',
        'href',
      ]);
      sectionTarget(
        'background',
        'image',
        'Hero background image',
        section.backgroundImage,
        ['backgroundImage'],
      );
    }

    if (section.type === 'welcome') {
      sectionTarget('heading', 'text', 'Welcome heading', section.heading, ['heading']);
      sectionTarget('body', 'text', 'Welcome body', section.body, ['body']);
      sectionTarget('cta', 'link', 'Welcome CTA', section.cta.href, ['cta', 'href']);
    }

    if (section.type === 'gallery') {
      sectionTarget('heading', 'text', 'Gallery heading', section.heading, ['heading']);
      section.images.forEach((image, imageIndex) => {
        sectionTarget(
          `image_${imageIndex}`,
          'image',
          `Gallery image ${imageIndex + 1}`,
          image.src,
          ['images', String(imageIndex), 'src'],
        );
      });
    }

    if (section.type === 'amenities') {
      sectionTarget('heading', 'text', 'Amenities heading', section.heading, ['heading']);
      section.groups.forEach((group, groupIndex) => {
        sectionTarget(
          `group_${groupIndex}`,
          'text',
          `${group.title} amenities`,
          [group.title, ...group.items].join('\n'),
          ['groups', String(groupIndex)],
        );
      });
    }

    if (section.type === 'contact') {
      sectionTarget('heading', 'text', 'Contact heading', section.heading, ['heading']);
      sectionTarget('subheading', 'text', 'Contact subheading', section.subheading, [
        'subheading',
      ]);
      sectionTarget('form', 'form', 'Contact form', section.formId, ['formId']);
    }

    if (section.type === 'legacy-html') {
      sectionTarget('legacy_html', 'section', section.label, section.html, ['html']);
    }
  });

  return targets;
}

function siteTargets(routePath) {
  return [
    target(
      'site__nav_cta',
      routePath,
      'link',
      'Header CTA',
      "[data-robynn-target='site__nav_cta']",
      site.navigation.cta.href,
      'content/site.json',
      '$.navigation.cta.href',
      ['navigation', 'cta', 'href'],
    ),
    target(
      'site__phone',
      routePath,
      'text',
      'Phone number',
      "[data-robynn-target='site__phone']",
      site.contact.phone,
      'content/site.json',
      '$.contact.phone',
      ['contact', 'phone'],
    ),
    target(
      'site__email',
      routePath,
      'text',
      'Email address',
      "[data-robynn-target='site__email']",
      site.contact.email,
      'content/site.json',
      '$.contact.email',
      ['contact', 'email'],
    ),
  ];
}

function formManifest(routePath) {
  const form = site.forms.tourRequest;
  return {
    id: form.id,
    routePath,
    selector: `[data-robynn-form='${form.id}']`,
    fields: form.fields.map((field) => ({
      name: field.name,
      label: field.label,
      type: field.type,
      required: field.required,
    })),
    submit: { type: 'webhook', urlEnv: form.webhookEnv },
  };
}

function snapshotHtml(page) {
  const doc = page.document;
  const sections = doc.sections
    .map((section) => {
      if (section.type === 'legacy-html') return section.html;
      return `<section id="${escapeHtml(section.id)}" data-robynn-target="${escapeHtml(section.id)}__summary"><h2>${escapeHtml(section.type)}</h2><p>${escapeHtml(textFromSection(section))}</p></section>`;
    })
    .join('\n');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(doc.title)}</title>
  <meta name="description" content="${escapeHtml(doc.description || site.site.description)}">
</head>
<body>
  <header data-robynn-target="site__header">${escapeHtml(site.site.name)}</header>
  <main>
${sections}
  </main>
</body>
</html>
`;
}

fs.rmSync(bundleDir, { recursive: true, force: true });
fs.mkdirSync(snapshotsDir, { recursive: true });

const routes = pages.map((page) => {
  const routePath = normalizeRoutePath(page.document.routePath);
  const snapshotPath = snapshotPathForRoute(routePath);
  fs.writeFileSync(path.join(bundleDir, snapshotPath), snapshotHtml(page));
  return {
    routePath,
    title: page.document.title,
    sourceFile: page.sourceFile,
    snapshotPath,
    canonical: canonicalUrl(routePath),
  };
});

const manifest = {
  schemaVersion: 1,
  site: {
    source: 'nextjs-app-router',
    owner: site.site.owner,
    repo: site.site.repo,
    branch,
    commitSha,
    generatedAt: new Date().toISOString(),
  },
  routes,
  assets: [],
  targets: pages.flatMap((page) => [
    ...siteTargets(normalizeRoutePath(page.document.routePath)),
    ...pageTargets(page),
  ]),
  forms: pages
    .filter((page) =>
      page.document.sections.some((section) => section.type === 'contact'),
    )
    .map((page) => formManifest(normalizeRoutePath(page.document.routePath))),
};

fs.writeFileSync(
  path.join(bundleDir, 'manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
);

console.log(
  `Wrote .robynn/site-bundle/manifest.json with ${manifest.routes.length} route(s) and ${manifest.targets.length} target(s).`,
);
