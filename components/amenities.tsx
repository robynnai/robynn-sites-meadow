import type { PageSection } from '@/lib/content';

type AmenitiesSection = Extract<PageSection, { type: 'amenities' }>;

function AmenityIcon() {
  return (
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 22.5 5.8 15.8l2.8-2.8 3.9 3.9L23.4 6l2.8 2.8z" />
    </svg>
  );
}

export function Amenities({ section }: { section: AmenitiesSection }) {
  return (
    <section className="amenities" id={section.id}>
      <h2 data-robynn-target="home__amenities_heading">{section.heading}</h2>
      <div className="divider"></div>
      <div className="amenities-grid">
        {section.groups.map((group, groupIndex) => (
          <div
            key={group.title}
            data-robynn-target={`home__amenities_group_${groupIndex}`}
          >
            <h4>{group.title}</h4>
            <ul>
              {group.items.map((item) => (
                <li key={item}>
                  <AmenityIcon />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
