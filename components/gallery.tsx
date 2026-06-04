import Image from 'next/image';

import type { PageSection } from '@/lib/content';

type GallerySection = Extract<PageSection, { type: 'gallery' }>;

export function Gallery({ section }: { section: GallerySection }) {
  return (
    <section className="gallery" id={section.id}>
      <h2 data-robynn-target="home__gallery_heading">{section.heading}</h2>
      <div className="divider"></div>
      <div className="gallery-grid">
        {section.images.map((image, index) => (
          <div
            className="gallery-item"
            key={image.src}
            data-robynn-target={`home__gallery_image_${index}`}
          >
            <Image
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
