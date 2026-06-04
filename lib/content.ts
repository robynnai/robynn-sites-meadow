import fs from 'node:fs';
import path from 'node:path';

export type ImageAsset = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type ImportedCard = {
  title: string;
  body?: string;
  eyebrow?: string;
  image?: ImageAsset;
  cta?: { label: string; href: string };
  items?: string[];
};

export type ImportedPerson = {
  name: string;
  role: string;
  image: ImageAsset;
  links: Array<{ label: string; href: string }>;
};

export type ImportedProject = {
  category: string;
  title: string;
  body: string;
  image: ImageAsset;
  items: string[];
  cta: { label: string; href: string };
  testimonial?: {
    quote: string;
    name: string;
    role: string;
    image: ImageAsset;
  };
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
      type: 'imported-page';
      variant: 'about' | 'services' | 'contact' | 'projects';
      title: string;
      intro?: {
        heading: string;
        body: string[];
        image?: ImageAsset;
        highlights?: string[];
      };
      cards?: {
        heading: string;
        body?: string;
        items: ImportedCard[];
      };
      people?: {
        heading: string;
        body: string;
        items: ImportedPerson[];
      };
      services?: {
        heading: string;
        body: string;
        items: ImportedCard[];
      };
      contact?: {
        heading: string;
        body: string;
        formId: string;
        details: Array<{ label: string; values: string[] }>;
        socialLinks: Array<{ label: string; href: string }>;
      };
      projects?: {
        heading: string;
        body: string;
        openingTestimonial: { quote: string; name: string; role: string };
        items: ImportedProject[];
      };
      cta?: {
        heading: string;
        body: string;
        label: string;
        href: string;
      };
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
