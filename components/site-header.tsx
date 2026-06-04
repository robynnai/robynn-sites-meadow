import Image from 'next/image';

import type { SiteContent } from '@/lib/content';

type SiteHeaderProps = {
  navigation: SiteContent['navigation'];
};

export function SiteHeader({ navigation }: SiteHeaderProps) {
  return (
    <header className="site-header">
      <a href="#" className="logo" data-robynn-target="site__logo">
        <Image
          src={navigation.logo.src}
          alt={navigation.logo.alt}
          width={navigation.logo.width}
          height={navigation.logo.height}
          priority
        />
      </a>
      <nav>
        {navigation.items.map((item, index) => (
          <a
            key={item.href}
            href={item.href}
            data-robynn-target={`site__nav_item_${index}`}
          >
            {item.label}
          </a>
        ))}
        <a
          href={navigation.cta.href}
          className="nav-cta"
          data-robynn-target="site__nav_cta"
        >
          {navigation.cta.label}
        </a>
      </nav>
    </header>
  );
}
