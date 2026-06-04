import { Amenities } from '@/components/amenities';
import { Contact } from '@/components/contact';
import { Gallery } from '@/components/gallery';
import { Hero } from '@/components/hero';
import { ImportedPage } from '@/components/imported-page';
import { Welcome } from '@/components/welcome';
import type { PageContent, PageSection, SiteContent } from '@/lib/content';

function LegacyHtml({
  section,
}: {
  section: Extract<PageSection, { type: 'legacy-html' }>;
}) {
  return (
    <div
      data-robynn-target={`${section.id}__legacy_html`}
      dangerouslySetInnerHTML={{ __html: section.html }}
    />
  );
}

export function PageRenderer({
  page,
  site,
}: {
  page: PageContent;
  site: SiteContent;
}) {
  return (
    <main>
      {page.sections.map((section) => {
        switch (section.type) {
          case 'hero':
            return <Hero key={section.id} section={section} />;
          case 'welcome':
            return <Welcome key={section.id} section={section} />;
          case 'gallery':
            return <Gallery key={section.id} section={section} />;
          case 'amenities':
            return <Amenities key={section.id} section={section} />;
          case 'contact':
            return <Contact key={section.id} section={section} site={site} />;
          case 'imported-page':
            return (
              <ImportedPage key={section.id} section={section} site={site} />
            );
          case 'legacy-html':
            return <LegacyHtml key={section.id} section={section} />;
        }
        return null;
      })}
    </main>
  );
}
