const fs = require('node:fs');
const path = require('node:path');

const {
  escapeHtml,
  loadPages,
  loadSite,
  normalizeRoutePath,
  rootDir,
  snapshotPathForRoute,
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
  const routeKey =
    normalizeRoutePath(routePath)
      .replace(/^\/|\/$/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'home';
  return [
    target(
      `site__nav_cta__${routeKey}`,
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
      `site__phone__${routeKey}`,
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
      `site__email__${routeKey}`,
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

function htmlAttr(value) {
  return escapeHtml(value);
}

function imageUrl(src) {
  if (/^https?:\/\//i.test(src)) return src;
  const owner = site.site.owner || 'robynnai';
  const repo = site.site.repo || 'robynn-sites-meadow';
  const branchName = site.site.branch || 'main';
  const normalizedPath = String(src || '').replace(/^\/+/, '');
  return `https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/${encodeURIComponent(branchName)}/public/${normalizedPath}`;
}

function arrowSvg(className = '') {
  return `<svg${className ? ` class="${htmlAttr(className)}"` : ''} viewBox="0 0 448 512" aria-hidden="true"><path d="M438.6 278.6 278.6 438.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L338.8 288H32c-17.7 0-32-14.3-32-32s14.3-32 32-32h306.8L233.4 118.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l160 160c12.4 12.5 12.4 32.8-.1 45.3z"></path></svg>`;
}

function smallArrowSvg() {
  return `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M 18.71875 6.78125 L 17.28125 8.21875 L 24.0625 15 L 4 15 L 4 17 L 24.0625 17 L 17.28125 23.78125 L 18.71875 25.21875 L 27.21875 16.71875 L 27.90625 16 L 27.21875 15.28125 Z"></path></svg>`;
}

function checkIconSvg() {
  return `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M12.5 22.5 5.8 15.8l2.8-2.8 3.9 3.9L23.4 6l2.8 2.8z"></path></svg>`;
}

function phoneIconSvg() {
  return `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M497.39 361.8l-112-48a24 24 0 0 0-28 6.9l-49.6 60.6A370.66 370.66 0 0 1 130.6 204.11l60.6-49.6a23.94 23.94 0 0 0 6.9-28l-48-112A24.16 24.16 0 0 0 122.6.61l-104 24A24 24 0 0 0 0 48c0 256.5 207.9 464 464 464a24 24 0 0 0 23.4-18.6l24-104a24.29 24.29 0 0 0-14.01-27.6z"></path></svg>`;
}

function emailIconSvg() {
  return `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M502.3 190.8c3.9-3.1 9.7-.2 9.7 4.7V400c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V195.6c0-5 5.7-7.8 9.7-4.7 22.4 17.4 52.1 39.5 154.1 113.6 21.1 15.4 56.7 47.8 92.2 47.6 35.7.3 72-32.8 92.3-47.6 102-74.1 131.6-96.3 154-113.7zM256 320c23.2.4 56.6-29.2 73.4-41.4 132.7-96.3 142.8-104.7 173.4-128.7 5.8-4.5 9.2-11.5 9.2-18.9v-19c0-26.5-21.5-48-48-48H48C21.5 64 0 85.5 0 112v19c0 7.4 3.4 14.3 9.2 18.9 30.6 23.9 40.7 32.4 173.4 128.7 16.8 12.2 50.2 41.8 73.4 41.4z"></path></svg>`;
}

function renderImage(image, target, className = '') {
  if (!image) return '';
  const attrs = [
    `src="${htmlAttr(imageUrl(image.src || image))}"`,
    `alt="${htmlAttr(image.alt || '')}"`,
    image.width ? `width="${htmlAttr(image.width)}"` : '',
    image.height ? `height="${htmlAttr(image.height)}"` : '',
    target ? `data-robynn-target="${htmlAttr(target)}"` : '',
    className ? `class="${htmlAttr(className)}"` : '',
  ]
    .filter(Boolean)
    .join(' ');
  return `<img ${attrs}>`;
}

function renderSiteHeader() {
  const navItems = site.navigation.items
    .map(
      (item, index) =>
        `<a href="${htmlAttr(item.href)}" data-robynn-target="site__nav_item_${index}">${escapeHtml(item.label)}</a>`,
    )
    .join('');
  return `<header class="site-header">
  <a href="#" class="logo" data-robynn-target="site__logo">${renderImage(site.navigation.logo)}</a>
  <nav>${navItems}<a href="${htmlAttr(site.navigation.cta.href)}" class="nav-cta" data-robynn-target="site__nav_cta">${escapeHtml(site.navigation.cta.label)}</a></nav>
</header>`;
}

function renderForm(form) {
  if (!form) return '';
  const fields = form.fields
    .map((field) => {
      const attrs = [
        `name="${htmlAttr(field.name)}"`,
        `placeholder="${htmlAttr(field.label)}"`,
        field.required ? 'required' : '',
        field.autoComplete ? `autocomplete="${htmlAttr(field.autoComplete)}"` : '',
      ]
        .filter(Boolean)
        .join(' ');
      if (field.type === 'textarea') return `<textarea ${attrs}></textarea>`;
      return `<input type="${htmlAttr(field.type)}" ${attrs}>`;
    })
    .join('');
  return `<form class="robynn-form" data-robynn-form="${htmlAttr(form.id)}">${fields}<button type="submit">${escapeHtml(form.submitLabel)}</button></form>`;
}

function renderHero(section) {
  return `<section class="hero" data-robynn-target="home__hero_background">
  <img class="hero-background" src="${htmlAttr(imageUrl(section.backgroundImage))}" alt="" aria-hidden="true">
  <div class="hero-inner">
    <div class="hero-text">
      <span class="welcome-script" data-robynn-target="home__hero_script">${escapeHtml(section.script)}</span>
      <h1 class="hero-title" data-robynn-target="home__hero_heading">${section.headingLines.map((line) => `<span>${escapeHtml(line)}</span>`).join('<br>')}</h1>
    </div>
    <div class="hero-tour">
      <span data-robynn-target="home__hero_tour_label">${escapeHtml(section.tour.label)}</span>
      <a href="${htmlAttr(section.tour.href)}" class="tour-btn" aria-label="${htmlAttr(section.tour.ariaLabel)}" data-robynn-target="home__hero_tour_link">${smallArrowSvg()}</a>
    </div>
  </div>
</section>`;
}

function renderWelcome(section) {
  return `<section class="welcome" id="${htmlAttr(section.id)}">
  <h2 data-robynn-target="home__welcome_heading">${escapeHtml(section.heading)}</h2>
  <p data-robynn-target="home__welcome_body">${escapeHtml(section.body)}</p>
  <a href="${htmlAttr(section.cta.href)}" class="btn-primary" data-robynn-target="home__welcome_cta"><span>${escapeHtml(section.cta.label)}</span>${smallArrowSvg()}</a>
</section>`;
}

function renderGallery(section) {
  const images = section.images
    .map(
      (image, index) =>
        `<div class="gallery-item" data-robynn-target="home__gallery_image_${index}">${renderImage(image)}</div>`,
    )
    .join('');
  return `<section class="gallery" id="${htmlAttr(section.id)}">
  <h2 data-robynn-target="home__gallery_heading">${escapeHtml(section.heading)}</h2>
  <div class="divider"></div>
  <div class="gallery-grid">${images}</div>
</section>`;
}

function renderAmenities(section) {
  const groups = section.groups
    .map(
      (group, groupIndex) =>
        `<div data-robynn-target="home__amenities_group_${groupIndex}"><h4>${escapeHtml(group.title)}</h4><ul>${group.items.map((item) => `<li>${checkIconSvg()}${escapeHtml(item)}</li>`).join('')}</ul></div>`,
    )
    .join('');
  return `<section class="amenities" id="${htmlAttr(section.id)}">
  <h2 data-robynn-target="home__amenities_heading">${escapeHtml(section.heading)}</h2>
  <div class="divider"></div>
  <div class="amenities-grid">${groups}</div>
</section>`;
}

function renderContact(section) {
  const form = site.forms[section.formId];
  return `<section class="contact" id="${htmlAttr(section.id)}">
  <div class="contact-wrapper">
    <div class="contact-info">
      <h4 data-robynn-target="home__contact_heading">${escapeHtml(section.heading)}</h4>
      <div class="divider"></div>
      <h5 data-robynn-target="home__contact_subheading">${escapeHtml(section.subheading)}</h5>
      <a href="${htmlAttr(site.contact.phoneHref)}" data-robynn-target="site__phone">${phoneIconSvg()}Phone: ${escapeHtml(site.contact.phone)}</a>
      <a href="${htmlAttr(site.contact.emailHref)}" data-robynn-target="site__email">${emailIconSvg()}Email: ${escapeHtml(site.contact.email)}</a>
      <p data-robynn-target="site__address">Property Address:<br>${site.contact.address.map(escapeHtml).join('<br>')}</p>
      <iframe loading="lazy" src="${htmlAttr(site.contact.mapSrc)}" title="${htmlAttr(site.contact.address.join(' '))}" aria-label="${htmlAttr(site.contact.address.join(' '))}"></iframe>
    </div>
    <div class="contact-form">${renderForm(form)}</div>
  </div>
</section>`;
}

function renderPageHero(section) {
  return `<section class="imported-hero"><div class="imported-inner"><h1 data-robynn-target="${htmlAttr(section.id)}__title">${escapeHtml(section.title)}</h1></div></section>`;
}

function renderCta(section) {
  if (!section.cta) return '';
  return `<section class="imported-cta"><div><h2 data-robynn-target="${htmlAttr(section.id)}__cta_heading">${escapeHtml(section.cta.heading)}</h2><p data-robynn-target="${htmlAttr(section.id)}__cta_body">${escapeHtml(section.cta.body)}</p></div><a class="btn-primary" href="${htmlAttr(section.cta.href)}" data-robynn-target="${htmlAttr(section.id)}__cta_link">${escapeHtml(section.cta.label)}${arrowSvg()}</a></section>`;
}

function renderAbout(section) {
  const intro = section.intro
    ? `<section class="imported-section imported-split">${section.intro.image ? renderImage(section.intro.image, `${section.id}__intro_image`) : ''}<div><h2 data-robynn-target="${htmlAttr(section.id)}__intro_heading">${escapeHtml(section.intro.heading)}</h2><div class="imported-divider"></div>${section.intro.body.map((paragraph, index) => `<p data-robynn-target="${htmlAttr(section.id)}__intro_body_${index}">${escapeHtml(paragraph)}</p>`).join('')}<div class="imported-highlights">${(section.intro.highlights || []).map((highlight, index) => `<span data-robynn-target="${htmlAttr(section.id)}__intro_highlight_${index}">${escapeHtml(highlight)}</span>`).join('')}</div></div></section>`
    : '';
  const cards = section.cards
    ? `<section class="imported-section imported-muted"><div class="imported-heading"><h2 data-robynn-target="${htmlAttr(section.id)}__cards_heading">${escapeHtml(section.cards.heading)}</h2>${section.cards.body ? `<p data-robynn-target="${htmlAttr(section.id)}__cards_body">${escapeHtml(section.cards.body)}</p>` : ''}</div><div class="imported-card-grid three">${section.cards.items.map((card, index) => `<article class="imported-card">${card.image ? renderImage(card.image, `${section.id}__card_${index}_image`) : ''}<h3 data-robynn-target="${htmlAttr(section.id)}__card_${index}_title">${escapeHtml(card.title)}</h3>${card.body ? `<p data-robynn-target="${htmlAttr(section.id)}__card_${index}_body">${escapeHtml(card.body)}</p>` : ''}${card.cta ? `<a href="${htmlAttr(card.cta.href)}" data-robynn-target="${htmlAttr(section.id)}__card_${index}_link">${escapeHtml(card.cta.label)}</a>` : ''}</article>`).join('')}</div></section>`
    : '';
  const people = section.people
    ? `<section class="imported-section"><div class="imported-heading"><h2 data-robynn-target="${htmlAttr(section.id)}__people_heading">${escapeHtml(section.people.heading)}</h2><p data-robynn-target="${htmlAttr(section.id)}__people_body">${escapeHtml(section.people.body)}</p></div><div class="imported-card-grid three">${section.people.items.map((person, index) => `<article class="imported-person">${renderImage(person.image, `${section.id}__person_${index}_image`)}<h3 data-robynn-target="${htmlAttr(section.id)}__person_${index}_name">${escapeHtml(person.name)}</h3><p data-robynn-target="${htmlAttr(section.id)}__person_${index}_role">${escapeHtml(person.role)}</p><div class="imported-social">${person.links.map((link) => `<a href="${htmlAttr(link.href)}">${escapeHtml(link.label)}</a>`).join('')}</div></article>`).join('')}</div></section>`
    : '';
  return `${renderPageHero(section)}${intro}${cards}${people}${renderCta(section)}`;
}

function renderServices(section) {
  const services = section.services
    ? `<section class="imported-section"><div class="imported-heading"><h2 data-robynn-target="${htmlAttr(section.id)}__services_heading">${escapeHtml(section.services.heading)}</h2><p data-robynn-target="${htmlAttr(section.id)}__services_body">${escapeHtml(section.services.body)}</p></div><div class="imported-card-grid four">${section.services.items.map((card, index) => `<article class="imported-service"><span data-robynn-target="${htmlAttr(section.id)}__service_${index}_eyebrow">${escapeHtml(card.eyebrow)}</span><h3 data-robynn-target="${htmlAttr(section.id)}__service_${index}_title">${escapeHtml(card.title)}</h3><p data-robynn-target="${htmlAttr(section.id)}__service_${index}_body">${escapeHtml(card.body)}</p></article>`).join('')}</div></section>`
    : '';
  const cards = section.cards
    ? `<section class="imported-section imported-muted"><div class="imported-heading"><h2 data-robynn-target="${htmlAttr(section.id)}__cards_heading">${escapeHtml(section.cards.heading)}</h2>${section.cards.body ? `<p data-robynn-target="${htmlAttr(section.id)}__cards_body">${escapeHtml(section.cards.body)}</p>` : ''}</div><div class="imported-icon-grid">${section.cards.items.map((card, index) => `<article><div class="imported-icon-dot"></div><h3 data-robynn-target="${htmlAttr(section.id)}__card_${index}_title">${escapeHtml(card.title)}</h3><p data-robynn-target="${htmlAttr(section.id)}__card_${index}_body">${escapeHtml(card.body)}</p></article>`).join('')}</div></section>`
    : '';
  return `${renderPageHero(section)}${services}${cards}${renderCta(section)}`;
}

function renderImportedContact(section) {
  const form =
    section.contact?.formId && site.forms[section.contact.formId]
      ? site.forms[section.contact.formId]
      : null;
  const contact = section.contact
    ? `<section class="imported-section imported-contact-page"><div><h2 data-robynn-target="${htmlAttr(section.id)}__contact_heading">${escapeHtml(section.contact.heading)}</h2><div class="imported-divider"></div><p data-robynn-target="${htmlAttr(section.id)}__contact_body">${escapeHtml(section.contact.body)}</p><h3>Send Us A Message</h3>${renderForm(form)}</div><aside><h2>Contact Info</h2>${section.contact.details.map((detail, index) => `<div class="imported-contact-detail"><h3 data-robynn-target="${htmlAttr(section.id)}__detail_${index}_label">${escapeHtml(detail.label)}</h3>${detail.values.map((value, valueIndex) => `<p data-robynn-target="${htmlAttr(section.id)}__detail_${index}_${valueIndex}">${escapeHtml(value)}</p>`).join('')}</div>`).join('')}<h3>Follow Us</h3><div class="imported-social">${section.contact.socialLinks.map((link) => `<a href="${htmlAttr(link.href)}">${escapeHtml(link.label)}</a>`).join('')}</div></aside></section>`
    : '';
  return `${renderPageHero(section)}${contact}`;
}

function renderProjects(section) {
  const projects = section.projects
    ? `<section class="imported-section imported-projects"><div class="imported-heading"><h2 data-robynn-target="${htmlAttr(section.id)}__projects_heading">${escapeHtml(section.projects.heading)}</h2><p data-robynn-target="${htmlAttr(section.id)}__projects_body">${escapeHtml(section.projects.body)}</p></div><blockquote><p data-robynn-target="${htmlAttr(section.id)}__projects_quote">&quot;${escapeHtml(section.projects.openingTestimonial.quote)}&quot;</p><cite><strong data-robynn-target="${htmlAttr(section.id)}__projects_quote_name">${escapeHtml(section.projects.openingTestimonial.name)}</strong><span data-robynn-target="${htmlAttr(section.id)}__projects_quote_role">${escapeHtml(section.projects.openingTestimonial.role)}</span></cite></blockquote>${section.projects.items.map((project, index) => `<article class="imported-project">${renderImage(project.image, `${section.id}__project_${index}_image`)}<div><span data-robynn-target="${htmlAttr(section.id)}__project_${index}_category">${escapeHtml(project.category)}</span><h3 data-robynn-target="${htmlAttr(section.id)}__project_${index}_title">${escapeHtml(project.title)}</h3><p data-robynn-target="${htmlAttr(section.id)}__project_${index}_body">${escapeHtml(project.body)}</p><ul>${project.items.map((item, itemIndex) => `<li data-robynn-target="${htmlAttr(section.id)}__project_${index}_item_${itemIndex}">${escapeHtml(item)}</li>`).join('')}</ul><a class="btn-primary" href="${htmlAttr(project.cta.href)}" data-robynn-target="${htmlAttr(section.id)}__project_${index}_link">${escapeHtml(project.cta.label)}${arrowSvg()}</a></div>${project.testimonial ? `<blockquote class="imported-inline-testimonial">${renderImage(project.testimonial.image)}<p data-robynn-target="${htmlAttr(section.id)}__project_${index}_quote">&quot;${escapeHtml(project.testimonial.quote)}&quot;</p><cite><strong>${escapeHtml(project.testimonial.name)}</strong><span>${escapeHtml(project.testimonial.role)}</span></cite></blockquote>` : ''}</article>`).join('')}</section>`
    : '';
  return `${renderPageHero(section)}${projects}${renderCta(section)}`;
}

function renderImportedPage(section) {
  if (section.variant === 'about') return renderAbout(section);
  if (section.variant === 'services') return renderServices(section);
  if (section.variant === 'contact') return renderImportedContact(section);
  return renderProjects(section);
}

function renderSection(section) {
  if (section.type === 'hero') return renderHero(section);
  if (section.type === 'welcome') return renderWelcome(section);
  if (section.type === 'gallery') return renderGallery(section);
  if (section.type === 'amenities') return renderAmenities(section);
  if (section.type === 'contact') return renderContact(section);
  if (section.type === 'imported-page') return renderImportedPage(section);
  if (section.type === 'legacy-html') return section.html;
  return '';
}

function snapshotHtml(page) {
  const doc = page.document;
  const sections = doc.sections.map(renderSection).join('\n');
  const css = fs.readFileSync(path.join(rootDir, 'app/globals.css'), 'utf8');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(doc.title)}</title>
  <meta name="description" content="${escapeHtml(doc.description || site.site.description)}">
  <style>${css}</style>
</head>
<body>
  ${renderSiteHeader()}
  <main>
${sections}
  </main>
  <footer class="site-footer"><p data-robynn-target="site__footer_copyright">${escapeHtml(site.footer.copyright)}</p></footer>
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
