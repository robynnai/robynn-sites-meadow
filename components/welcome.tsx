import type { PageSection } from '@/lib/content';

type WelcomeSection = Extract<PageSection, { type: 'welcome' }>;

export function Welcome({ section }: { section: WelcomeSection }) {
  return (
    <section className="welcome" id={section.id}>
      <h2 data-robynn-target="home__welcome_heading">{section.heading}</h2>
      <p data-robynn-target="home__welcome_body">{section.body}</p>
      <a
        href={section.cta.href}
        className="btn-primary"
        data-robynn-target="home__welcome_cta"
      >
        <span>{section.cta.label}</span>
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <path d="M 18.71875 6.78125 L 17.28125 8.21875 L 24.0625 15 L 4 15 L 4 17 L 24.0625 17 L 17.28125 23.78125 L 18.71875 25.21875 L 27.21875 16.71875 L 27.90625 16 L 27.21875 15.28125 Z" />
        </svg>
      </a>
    </section>
  );
}
