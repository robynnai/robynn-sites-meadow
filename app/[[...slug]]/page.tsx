import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PageRenderer } from '@/components/page-renderer';
import { RobynnWidget } from '@/components/robynn-widget';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import {
  canonicalUrl,
  getAllPages,
  getPageByRoute,
  getSiteContent,
  routeFromSlug,
} from '@/lib/content';

type PageProps = {
  params: Promise<{ slug?: string[] }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPages().map((page) => ({
    slug: page.routePath === '/' ? [] : page.routePath.replace(/^\/|\/$/g, '').split('/'),
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const site = getSiteContent();
  const page = getPageByRoute(routeFromSlug(slug));

  if (!page) {
    return {
      title: site.site.name,
      description: site.site.description,
    };
  }

  return {
    title: page.title,
    description: page.description ?? site.site.description,
    alternates: { canonical: canonicalUrl(site, page.routePath) },
  };
}

export default async function RobynnPage({ params }: PageProps) {
  const { slug } = await params;
  const site = getSiteContent();
  const page = getPageByRoute(routeFromSlug(slug));

  if (!page) {
    notFound();
  }

  return (
    <>
      <SiteHeader navigation={site.navigation} />
      <PageRenderer page={page} site={site} />
      <SiteFooter footer={site.footer} />
      <RobynnWidget widget={site.robynnWidget} />
    </>
  );
}
