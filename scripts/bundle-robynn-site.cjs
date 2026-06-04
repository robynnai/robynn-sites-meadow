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

    if (section.type === 'imported-page') {
      sectionTarget('title', 'text', `${section.title} title`, section.title, [
        'title',
      ]);

      if (section.intro) {
        sectionTarget(
          'intro_heading',
          'text',
          `${section.title} intro heading`,
          section.intro.heading,
          ['intro', 'heading'],
        );
        section.intro.body.forEach((paragraph, paragraphIndex) => {
          sectionTarget(
            `intro_body_${paragraphIndex}`,
            'text',
            `${section.title} intro paragraph ${paragraphIndex + 1}`,
            paragraph,
            ['intro', 'body', String(paragraphIndex)],
          );
        });
        section.intro.highlights?.forEach((highlight, highlightIndex) => {
          sectionTarget(
            `intro_highlight_${highlightIndex}`,
            'text',
            `${section.title} highlight ${highlightIndex + 1}`,
            highlight,
            ['intro', 'highlights', String(highlightIndex)],
          );
        });
        if (section.intro.image) {
          sectionTarget(
            'intro_image',
            'image',
            `${section.title} intro image`,
            section.intro.image.src,
            ['intro', 'image', 'src'],
          );
        }
      }

      if (section.cards) {
        sectionTarget(
          'cards_heading',
          'text',
          `${section.title} cards heading`,
          section.cards.heading,
          ['cards', 'heading'],
        );
        if (section.cards.body) {
          sectionTarget(
            'cards_body',
            'text',
            `${section.title} cards body`,
            section.cards.body,
            ['cards', 'body'],
          );
        }
        section.cards.items.forEach((card, cardIndex) => {
          sectionTarget(
            `card_${cardIndex}_title`,
            'text',
            `${section.title} card ${cardIndex + 1} title`,
            card.title,
            ['cards', 'items', String(cardIndex), 'title'],
          );
          if (card.body) {
            sectionTarget(
              `card_${cardIndex}_body`,
              'text',
              `${section.title} card ${cardIndex + 1} body`,
              card.body,
              ['cards', 'items', String(cardIndex), 'body'],
            );
          }
          if (card.image) {
            sectionTarget(
              `card_${cardIndex}_image`,
              'image',
              `${section.title} card ${cardIndex + 1} image`,
              card.image.src,
              ['cards', 'items', String(cardIndex), 'image', 'src'],
            );
          }
          if (card.cta) {
            sectionTarget(
              `card_${cardIndex}_link`,
              'link',
              `${section.title} card ${cardIndex + 1} link`,
              card.cta.href,
              ['cards', 'items', String(cardIndex), 'cta', 'href'],
            );
          }
        });
      }

      if (section.people) {
        sectionTarget(
          'people_heading',
          'text',
          `${section.title} people heading`,
          section.people.heading,
          ['people', 'heading'],
        );
        sectionTarget(
          'people_body',
          'text',
          `${section.title} people body`,
          section.people.body,
          ['people', 'body'],
        );
        section.people.items.forEach((person, personIndex) => {
          sectionTarget(
            `person_${personIndex}_image`,
            'image',
            `${section.title} person ${personIndex + 1} image`,
            person.image.src,
            ['people', 'items', String(personIndex), 'image', 'src'],
          );
          sectionTarget(
            `person_${personIndex}_name`,
            'text',
            `${section.title} person ${personIndex + 1} name`,
            person.name,
            ['people', 'items', String(personIndex), 'name'],
          );
          sectionTarget(
            `person_${personIndex}_role`,
            'text',
            `${section.title} person ${personIndex + 1} role`,
            person.role,
            ['people', 'items', String(personIndex), 'role'],
          );
        });
      }

      if (section.services) {
        sectionTarget(
          'services_heading',
          'text',
          `${section.title} services heading`,
          section.services.heading,
          ['services', 'heading'],
        );
        sectionTarget(
          'services_body',
          'text',
          `${section.title} services body`,
          section.services.body,
          ['services', 'body'],
        );
        section.services.items.forEach((service, serviceIndex) => {
          sectionTarget(
            `service_${serviceIndex}_eyebrow`,
            'text',
            `${section.title} service ${serviceIndex + 1} number`,
            service.eyebrow,
            ['services', 'items', String(serviceIndex), 'eyebrow'],
          );
          sectionTarget(
            `service_${serviceIndex}_title`,
            'text',
            `${section.title} service ${serviceIndex + 1} title`,
            service.title,
            ['services', 'items', String(serviceIndex), 'title'],
          );
          sectionTarget(
            `service_${serviceIndex}_body`,
            'text',
            `${section.title} service ${serviceIndex + 1} body`,
            service.body,
            ['services', 'items', String(serviceIndex), 'body'],
          );
        });
      }

      if (section.contact) {
        sectionTarget(
          'contact_heading',
          'text',
          `${section.title} contact heading`,
          section.contact.heading,
          ['contact', 'heading'],
        );
        sectionTarget(
          'contact_body',
          'text',
          `${section.title} contact body`,
          section.contact.body,
          ['contact', 'body'],
        );
        section.contact.details.forEach((detail, detailIndex) => {
          sectionTarget(
            `detail_${detailIndex}_label`,
            'text',
            `${section.title} detail ${detailIndex + 1} label`,
            detail.label,
            ['contact', 'details', String(detailIndex), 'label'],
          );
          detail.values.forEach((value, valueIndex) => {
            sectionTarget(
              `detail_${detailIndex}_${valueIndex}`,
              'text',
              `${section.title} detail ${detailIndex + 1} value ${valueIndex + 1}`,
              value,
              [
                'contact',
                'details',
                String(detailIndex),
                'values',
                String(valueIndex),
              ],
            );
          });
        });
      }

      if (section.projects) {
        sectionTarget(
          'projects_heading',
          'text',
          `${section.title} projects heading`,
          section.projects.heading,
          ['projects', 'heading'],
        );
        sectionTarget(
          'projects_body',
          'text',
          `${section.title} projects body`,
          section.projects.body,
          ['projects', 'body'],
        );
        sectionTarget(
          'projects_quote',
          'text',
          `${section.title} opening quote`,
          section.projects.openingTestimonial.quote,
          ['projects', 'openingTestimonial', 'quote'],
        );
        sectionTarget(
          'projects_quote_name',
          'text',
          `${section.title} opening quote name`,
          section.projects.openingTestimonial.name,
          ['projects', 'openingTestimonial', 'name'],
        );
        sectionTarget(
          'projects_quote_role',
          'text',
          `${section.title} opening quote role`,
          section.projects.openingTestimonial.role,
          ['projects', 'openingTestimonial', 'role'],
        );
        section.projects.items.forEach((project, projectIndex) => {
          sectionTarget(
            `project_${projectIndex}_image`,
            'image',
            `${section.title} project ${projectIndex + 1} image`,
            project.image.src,
            ['projects', 'items', String(projectIndex), 'image', 'src'],
          );
          sectionTarget(
            `project_${projectIndex}_category`,
            'text',
            `${section.title} project ${projectIndex + 1} category`,
            project.category,
            ['projects', 'items', String(projectIndex), 'category'],
          );
          sectionTarget(
            `project_${projectIndex}_title`,
            'text',
            `${section.title} project ${projectIndex + 1} title`,
            project.title,
            ['projects', 'items', String(projectIndex), 'title'],
          );
          sectionTarget(
            `project_${projectIndex}_body`,
            'text',
            `${section.title} project ${projectIndex + 1} body`,
            project.body,
            ['projects', 'items', String(projectIndex), 'body'],
          );
          project.items.forEach((item, itemIndex) => {
            sectionTarget(
              `project_${projectIndex}_item_${itemIndex}`,
              'text',
              `${section.title} project ${projectIndex + 1} item ${itemIndex + 1}`,
              item,
              [
                'projects',
                'items',
                String(projectIndex),
                'items',
                String(itemIndex),
              ],
            );
          });
          sectionTarget(
            `project_${projectIndex}_link`,
            'link',
            `${section.title} project ${projectIndex + 1} link`,
            project.cta.href,
            ['projects', 'items', String(projectIndex), 'cta', 'href'],
          );
          if (project.testimonial) {
            sectionTarget(
              `project_${projectIndex}_quote`,
              'text',
              `${section.title} project ${projectIndex + 1} quote`,
              project.testimonial.quote,
              ['projects', 'items', String(projectIndex), 'testimonial', 'quote'],
            );
          }
        });
      }

      if (section.cta) {
        sectionTarget(
          'cta_heading',
          'text',
          `${section.title} CTA heading`,
          section.cta.heading,
          ['cta', 'heading'],
        );
        sectionTarget('cta_body', 'text', `${section.title} CTA body`, section.cta.body, [
          'cta',
          'body',
        ]);
        sectionTarget('cta_link', 'link', `${section.title} CTA link`, section.cta.href, [
          'cta',
          'href',
        ]);
      }
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
