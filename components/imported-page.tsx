/* eslint-disable @next/next/no-img-element -- Robynn preview proxies public assets directly. */

import { RobynnWebhookForm } from '@/components/robynn-webhook-form';
import type { PageSection, SiteContent } from '@/lib/content';

type ImportedPageSection = Extract<PageSection, { type: 'imported-page' }>;

function ArrowIcon() {
  return (
    <svg viewBox="0 0 448 512" aria-hidden="true">
      <path d="M438.6 278.6 278.6 438.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L338.8 288H32c-17.7 0-32-14.3-32-32s14.3-32 32-32h306.8L233.4 118.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l160 160c12.4 12.5 12.4 32.8-.1 45.3z" />
    </svg>
  );
}

function PageHero({ title, id }: { title: string; id: string }) {
  return (
    <section className="imported-hero">
      <div className="imported-inner">
        <h1 data-robynn-target={`${id}__title`}>{title}</h1>
      </div>
    </section>
  );
}

function Cta({ section }: { section: ImportedPageSection }) {
  if (!section.cta) return null;

  return (
    <section className="imported-cta">
      <div>
        <h2 data-robynn-target={`${section.id}__cta_heading`}>
          {section.cta.heading}
        </h2>
        <p data-robynn-target={`${section.id}__cta_body`}>{section.cta.body}</p>
      </div>
      <a
        className="btn-primary"
        href={section.cta.href}
        data-robynn-target={`${section.id}__cta_link`}
      >
        {section.cta.label}
        <ArrowIcon />
      </a>
    </section>
  );
}

function AboutPage({ section }: { section: ImportedPageSection }) {
  return (
    <>
      <PageHero id={section.id} title={section.title} />
      {section.intro ? (
        <section className="imported-section imported-split">
          {section.intro.image ? (
            <img
              src={section.intro.image.src}
              alt={section.intro.image.alt}
              width={section.intro.image.width}
              height={section.intro.image.height}
              data-robynn-target={`${section.id}__intro_image`}
            />
          ) : null}
          <div>
            <h2 data-robynn-target={`${section.id}__intro_heading`}>
              {section.intro.heading}
            </h2>
            <div className="imported-divider" />
            {section.intro.body.map((paragraph, index) => (
              <p
                key={paragraph}
                data-robynn-target={`${section.id}__intro_body_${index}`}
              >
                {paragraph}
              </p>
            ))}
            <div className="imported-highlights">
              {(section.intro.highlights ?? []).map((highlight, index) => (
                <span
                  key={highlight}
                  data-robynn-target={`${section.id}__intro_highlight_${index}`}
                >
                  {highlight}
                </span>
              ))}
            </div>
          </div>
        </section>
      ) : null}
      {section.cards ? (
        <section className="imported-section imported-muted">
          <div className="imported-heading">
            <h2 data-robynn-target={`${section.id}__cards_heading`}>
              {section.cards.heading}
            </h2>
            {section.cards.body ? (
              <p data-robynn-target={`${section.id}__cards_body`}>
                {section.cards.body}
              </p>
            ) : null}
          </div>
          <div className="imported-card-grid three">
            {section.cards.items.map((card, index) => (
              <article key={card.title} className="imported-card">
                {card.image ? (
                  <img
                    src={card.image.src}
                    alt={card.image.alt}
                    width={card.image.width}
                    height={card.image.height}
                    data-robynn-target={`${section.id}__card_${index}_image`}
                  />
                ) : null}
                <h3 data-robynn-target={`${section.id}__card_${index}_title`}>
                  {card.title}
                </h3>
                {card.body ? (
                  <p data-robynn-target={`${section.id}__card_${index}_body`}>
                    {card.body}
                  </p>
                ) : null}
                {card.cta ? (
                  <a
                    href={card.cta.href}
                    data-robynn-target={`${section.id}__card_${index}_link`}
                  >
                    {card.cta.label}
                  </a>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}
      {section.people ? (
        <section className="imported-section">
          <div className="imported-heading">
            <h2 data-robynn-target={`${section.id}__people_heading`}>
              {section.people.heading}
            </h2>
            <p data-robynn-target={`${section.id}__people_body`}>
              {section.people.body}
            </p>
          </div>
          <div className="imported-card-grid three">
            {section.people.items.map((person, index) => (
              <article key={person.name} className="imported-person">
                <img
                  src={person.image.src}
                  alt={person.image.alt}
                  width={person.image.width}
                  height={person.image.height}
                  data-robynn-target={`${section.id}__person_${index}_image`}
                />
                <h3 data-robynn-target={`${section.id}__person_${index}_name`}>
                  {person.name}
                </h3>
                <p data-robynn-target={`${section.id}__person_${index}_role`}>
                  {person.role}
                </p>
                <div className="imported-social">
                  {person.links.map((link) => (
                    <a key={link.label} href={link.href}>
                      {link.label}
                    </a>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
      <Cta section={section} />
    </>
  );
}

function ServicesPage({ section }: { section: ImportedPageSection }) {
  return (
    <>
      <PageHero id={section.id} title={section.title} />
      {section.services ? (
        <section className="imported-section">
          <div className="imported-heading">
            <h2 data-robynn-target={`${section.id}__services_heading`}>
              {section.services.heading}
            </h2>
            <p data-robynn-target={`${section.id}__services_body`}>
              {section.services.body}
            </p>
          </div>
          <div className="imported-card-grid four">
            {section.services.items.map((card, index) => (
              <article key={card.title} className="imported-service">
                <span data-robynn-target={`${section.id}__service_${index}_eyebrow`}>
                  {card.eyebrow}
                </span>
                <h3 data-robynn-target={`${section.id}__service_${index}_title`}>
                  {card.title}
                </h3>
                <p data-robynn-target={`${section.id}__service_${index}_body`}>
                  {card.body}
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
      {section.cards ? (
        <section className="imported-section imported-muted">
          <div className="imported-heading">
            <h2 data-robynn-target={`${section.id}__cards_heading`}>
              {section.cards.heading}
            </h2>
            {section.cards.body ? (
              <p data-robynn-target={`${section.id}__cards_body`}>
                {section.cards.body}
              </p>
            ) : null}
          </div>
          <div className="imported-icon-grid">
            {section.cards.items.map((card, index) => (
              <article key={card.title}>
                <div className="imported-icon-dot" />
                <h3 data-robynn-target={`${section.id}__card_${index}_title`}>
                  {card.title}
                </h3>
                <p data-robynn-target={`${section.id}__card_${index}_body`}>
                  {card.body}
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
      <Cta section={section} />
    </>
  );
}

function ContactPage({
  section,
  site,
}: {
  section: ImportedPageSection;
  site: SiteContent;
}) {
  const form =
    section.contact?.formId && section.contact.formId in site.forms
      ? site.forms[section.contact.formId]
      : null;

  return (
    <>
      <PageHero id={section.id} title={section.title} />
      {section.contact ? (
        <section className="imported-section imported-contact-page">
          <div>
            <h2 data-robynn-target={`${section.id}__contact_heading`}>
              {section.contact.heading}
            </h2>
            <div className="imported-divider" />
            <p data-robynn-target={`${section.id}__contact_body`}>
              {section.contact.body}
            </p>
            <h3>Send Us A Message</h3>
            {form ? <RobynnWebhookForm config={form} /> : null}
          </div>
          <aside>
            <h2>Contact Info</h2>
            {section.contact.details.map((detail, index) => (
              <div key={detail.label} className="imported-contact-detail">
                <h3 data-robynn-target={`${section.id}__detail_${index}_label`}>
                  {detail.label}
                </h3>
                {detail.values.map((value, valueIndex) => (
                  <p
                    key={`${detail.label}-${value}`}
                    data-robynn-target={`${section.id}__detail_${index}_${valueIndex}`}
                  >
                    {value}
                  </p>
                ))}
              </div>
            ))}
            <h3>Follow Us</h3>
            <div className="imported-social">
              {section.contact.socialLinks.map((link) => (
                <a key={link.label} href={link.href}>
                  {link.label}
                </a>
              ))}
            </div>
          </aside>
        </section>
      ) : null}
    </>
  );
}

function ProjectsPage({ section }: { section: ImportedPageSection }) {
  return (
    <>
      <PageHero id={section.id} title={section.title} />
      {section.projects ? (
        <section className="imported-section imported-projects">
          <div className="imported-heading">
            <h2 data-robynn-target={`${section.id}__projects_heading`}>
              {section.projects.heading}
            </h2>
            <p data-robynn-target={`${section.id}__projects_body`}>
              {section.projects.body}
            </p>
          </div>
          <blockquote>
            <p data-robynn-target={`${section.id}__projects_quote`}>
              &quot;{section.projects.openingTestimonial.quote}&quot;
            </p>
            <cite>
              <strong data-robynn-target={`${section.id}__projects_quote_name`}>
                {section.projects.openingTestimonial.name}
              </strong>
              <span data-robynn-target={`${section.id}__projects_quote_role`}>
                {section.projects.openingTestimonial.role}
              </span>
            </cite>
          </blockquote>
          {section.projects.items.map((project, index) => (
            <article key={project.title} className="imported-project">
              <img
                src={project.image.src}
                alt={project.image.alt}
                width={project.image.width}
                height={project.image.height}
                data-robynn-target={`${section.id}__project_${index}_image`}
              />
              <div>
                <span data-robynn-target={`${section.id}__project_${index}_category`}>
                  {project.category}
                </span>
                <h3 data-robynn-target={`${section.id}__project_${index}_title`}>
                  {project.title}
                </h3>
                <p data-robynn-target={`${section.id}__project_${index}_body`}>
                  {project.body}
                </p>
                <ul>
                  {project.items.map((item, itemIndex) => (
                    <li
                      key={item}
                      data-robynn-target={`${section.id}__project_${index}_item_${itemIndex}`}
                    >
                      {item}
                    </li>
                  ))}
                </ul>
                <a
                  className="btn-primary"
                  href={project.cta.href}
                  data-robynn-target={`${section.id}__project_${index}_link`}
                >
                  {project.cta.label}
                  <ArrowIcon />
                </a>
              </div>
              {project.testimonial ? (
                <blockquote className="imported-inline-testimonial">
                  <img
                    src={project.testimonial.image.src}
                    alt={project.testimonial.image.alt}
                    width={project.testimonial.image.width}
                    height={project.testimonial.image.height}
                  />
                  <p data-robynn-target={`${section.id}__project_${index}_quote`}>
                    &quot;{project.testimonial.quote}&quot;
                  </p>
                  <cite>
                    <strong>{project.testimonial.name}</strong>
                    <span>{project.testimonial.role}</span>
                  </cite>
                </blockquote>
              ) : null}
            </article>
          ))}
        </section>
      ) : null}
      <Cta section={section} />
    </>
  );
}

export function ImportedPage({
  section,
  site,
}: {
  section: ImportedPageSection;
  site: SiteContent;
}) {
  if (section.variant === 'about') return <AboutPage section={section} />;
  if (section.variant === 'services') return <ServicesPage section={section} />;
  if (section.variant === 'contact') {
    return <ContactPage section={section} site={site} />;
  }
  return <ProjectsPage section={section} />;
}
