import type { SiteContent } from '@/lib/content';

export function SiteFooter({ footer }: { footer: SiteContent['footer'] }) {
  return (
    <footer className="site-footer">
      <p data-robynn-target="site__footer_copyright">{footer.copyright}</p>
    </footer>
  );
}
