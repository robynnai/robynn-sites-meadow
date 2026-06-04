import Script from 'next/script';

import type { SiteContent } from '@/lib/content';

export function RobynnWidget({
  widget,
}: {
  widget: SiteContent['robynnWidget'];
}) {
  return (
    <Script
      src={widget.src}
      data-org={widget.org}
      data-key={widget.key}
      strategy="afterInteractive"
    />
  );
}
