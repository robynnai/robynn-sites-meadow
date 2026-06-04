import type { PageSection } from '@/lib/content';

type HeroSection = Extract<PageSection, { type: 'hero' }>;

export function Hero({ section }: { section: HeroSection }) {
  return (
    <section
      className="hero"
      style={{ backgroundImage: `url("${section.backgroundImage}")` }}
      data-robynn-target="home__hero_background"
    >
      <div className="hero-inner">
        <div className="hero-text">
          <span
            className="welcome-script"
            data-robynn-target="home__hero_script"
          >
            {section.script}
          </span>
          <h1 className="hero-title" data-robynn-target="home__hero_heading">
            {section.headingLines.map((line, index) => (
              <span key={line}>
                {line}
                {index < section.headingLines.length - 1 ? <br /> : null}
              </span>
            ))}
          </h1>
        </div>
        <div className="hero-tour">
          <span data-robynn-target="home__hero_tour_label">
            {section.tour.label}
          </span>
          <a
            href={section.tour.href}
            className="tour-btn"
            aria-label={section.tour.ariaLabel}
            data-robynn-target="home__hero_tour_link"
          >
            <svg viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg">
              <path d="M438.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-128-128c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L338.8 224H32c-17.7 0-32 14.3-32 32s14.3 32 32 32h306.8l-73.4 73.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l128-128z" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
