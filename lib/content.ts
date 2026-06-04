import fs from 'node:fs';
import path from 'node:path';

export type ImageAsset = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type SiteContent = {
  schemaVersion: number;
  site: {
    name: string;
    description: string;
    canonicalBaseUrl: string;
    owner: string;
    repo: string;
    branch: string;
  };
  contact: {
    phone: string;
    phoneHref: string;
    email: string;
    emailHref: string;
    address: string[];
    mapSrc: string;
  };
  navigation: {
    logo: ImageAsset;
    items: Array<{ label: string; href: string }>;
    cta: { label: string; href: string };
  };
  footer: { copyright: string };
  robynnWidget: { src: string; org: string; key: string };
  forms: Record<
    string,
    {
      id: string;
      label: string;
      webhookEnv: string;
      fallbackEmail: string;
      fields: Array<{
        name: string;
        label: string;
        type: 'text' | 'email' | 'textarea';
        required: boolean;
        autoComplete?: string;
      }>;
      defaultSubject: string;
      submitLabel: string;
    }
  >;
};

export type PageContent = {
  schemaVersion: number;
  routePath: string;
  title: string;
  description?: string;
  sections: PageSection[];
  sourceFile?: string;
};

export type PageSection =
  | {
      id: string;
      type: 'hero';
      backgroundImage: string;
      script: string;
      headingLines: string[];
      tour: { label: string; href: string; ariaLabel: string };
    }
  | {
      id: string;
      type: 'welcome';
      heading: string;
      body: string;
      cta: { label: string; href: string };
    }
  | {
      id: string;
      type: 'gallery';
      heading: string;
      images: ImageAsset[];
    }
  | {
      id: string;
      type: 'amenities';
      heading: string;
      groups: Array<{ title: string; items: string[] }>;
    }
  | {
      id: string;
      type: 'contact';
      heading: string;
      subheading: string;
      formId: string;
    }
  | {
      id: string;
      type: 'legacy-html';
      label: string;
      html: string;
    };

const CONTENT_DIR = path.join(process.cwd(), 'content');
const PAGES_DIR = path.join(CONTENT_DIR, 'pages');

function readJsonFile<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

export function normalizeRoutePath(value: string): string {
  const route = `/${value.trim().replace(/^\/+|\/+$/g, '')}/`;
  return route === '//' ? '/' : route.replace(/\/+/g, '/');
}

export function routeFromSlug(slug?: string[]): string {
  return normalizeRoutePath((slug ?? []).join('/'));
}

export function snapshotPathForRoute(routePath: string): string {
  const route = normalizeRoutePath(routePath);
  return route === '/'
    ? 'snapshots/index.html'
    : `snapshots/${route.replace(/^\/|\/$/g, '').replace(/\//g, '-')}.html`;
}

export function getSiteContent(): SiteContent {
  return readJsonFile<SiteContent>(path.join(CONTENT_DIR, 'site.json'));
}

export function getAllPages(): PageContent[] {
  return fs
    .readdirSync(PAGES_DIR)
    .filter((fileName) => fileName.endsWith('.json'))
    .map((fileName) => ({
      ...readJsonFile<PageContent>(path.join(PAGES_DIR, fileName)),
      sourceFile: `content/pages/${fileName}`,
    }))
    .sort((left, right) => left.routePath.localeCompare(right.routePath));
}

export function getPageByRoute(routePath: string): PageContent | null {
  const normalized = normalizeRoutePath(routePath);
  return (
    getAllPages().find(
      (page) => normalizeRoutePath(page.routePath) === normalized,
    ) ?? null
  );
}

export function canonicalUrl(site: SiteContent, routePath: string): string {
  const base = site.site.canonicalBaseUrl.replace(/\/+$/, '');
  const route = normalizeRoutePath(routePath);
  return route === '/' ? `${base}/` : `${base}${route}`;
}
