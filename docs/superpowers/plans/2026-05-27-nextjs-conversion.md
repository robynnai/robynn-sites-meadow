# Next.js Conversion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the current static Meadowview Apartments HTML site into a maintainable Next.js App Router app while preserving the current page content, anchors, images, styling, map embed, and Robynn widget behavior.

**Architecture:** Start with a one-route App Router site that recreates the current single-page experience at `/`, then split the page into small server components for header, hero, welcome, gallery, amenities, contact, and footer. Keep assets in `public/` so image paths are stable, use `next/image` for local images where dimensions are known, and keep third-party scripts isolated in a dedicated client-safe component. Add a contact API route only after the preserved static page is passing visual and build checks.

**Tech Stack:** Next.js App Router, React, TypeScript, CSS Modules or global CSS, `next/font`, `next/image`, optional Vercel deployment.

---

## Current Site Inventory

The repo is currently a static site, not a Next.js app.

Existing files:
- `index.html`: full page markup, embedded CSS, Google Fonts link, Google Maps iframe, Robynn widget script, and contact form markup.
- `wp-content/uploads/2024/01/*.jpg`: apartment and property images.
- `wp-content/uploads/2024/04/*.png`: Meadowview logo variants.

Existing page sections:
- Header navigation with anchors: `#welcome`, `#gallery`, `#amenities`, `#contact`.
- Hero section with background image `wp-content/uploads/2024/01/1-PH-scaled.jpg`.
- Welcome section.
- Gallery section with eight image tiles.
- Amenities section.
- Contact section with phone, email, map iframe, and unhandled form.
- Footer.
- Third-party Robynn widget script from `https://robynn.ai/widget/v1/robynn-widget.js`.

## Target File Structure

Create:
- `package.json`: scripts and dependencies for the Next.js app.
- `next.config.ts`: minimal Next.js config.
- `tsconfig.json`: TypeScript config generated/compatible with Next.js.
- `eslint.config.mjs`: lint config if created by the scaffolder.
- `app/layout.tsx`: root HTML shell, metadata, font wiring.
- `app/page.tsx`: page composition only.
- `app/globals.css`: global variables, resets, shared typography, section layout.
- `components/site-header.tsx`: logo and anchor navigation.
- `components/hero.tsx`: hero background, title, and tour CTA.
- `components/welcome.tsx`: welcome copy and CTA.
- `components/gallery.tsx`: typed gallery image list and grid rendering.
- `components/amenities.tsx`: typed amenities list and grid rendering.
- `components/contact.tsx`: contact details, map iframe, and initial form UI.
- `components/site-footer.tsx`: footer content.
- `components/robynn-widget.tsx`: `next/script` wrapper for the Robynn widget.
- `lib/site-content.ts`: site constants for phone, email, address, gallery images, amenities, and map URL.
- `public/wp-content/uploads/...`: copied asset tree preserving current image paths.

Optional after static parity:
- `app/api/contact/route.ts`: contact form submission endpoint.
- `components/contact-form.tsx`: client component only if the form submits without a full page reload.
- `lib/contact-schema.ts`: validation schema if API submission is added.

## Migration Strategy

The first milestone is static parity. Do not redesign the page during conversion. Keep content, images, spacing, and anchors recognizably the same so regressions are easy to spot.

The second milestone is maintainability. Extract repeated image and amenity markup into data-driven components and move inline CSS into `app/globals.css`.

The third milestone is behavior. Decide where contact submissions should go, then wire the form to an API route, CRM, email provider, or third-party form service.

---

### Task 1: Scaffold Next.js In Place

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/globals.css`

- [ ] **Step 1: Confirm the current static server can be stopped**

Run:

```bash
lsof -iTCP:3000 -sTCP:LISTEN
```

Expected: a Python process may be listening because the static server was started with `python3 -m http.server 3000 --bind 127.0.0.1`.

- [ ] **Step 2: Stop the static server before starting Next.js**

Run:

```bash
pkill -f "python3 -m http.server 3000 --bind 127.0.0.1" || true
```

Expected: port `3000` is available.

- [ ] **Step 3: Create a Next.js app scaffold without overwriting `index.html`**

Run:

```bash
npx create-next-app@latest . --ts --app --eslint --no-tailwind --src-dir=false --import-alias "@/*" --use-npm
```

Expected: if the CLI refuses because the directory is not empty, create the files manually instead of deleting `index.html` or `wp-content`.

- [ ] **Step 4: If manual setup is needed, create this `package.json`**

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@next/env": "latest",
    "next": "latest",
    "react": "latest",
    "react-dom": "latest"
  },
  "devDependencies": {
    "@types/node": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "eslint": "latest",
    "eslint-config-next": "latest",
    "typescript": "latest"
  }
}
```

- [ ] **Step 5: Install dependencies**

Run:

```bash
npm install
```

Expected: `node_modules/` and `package-lock.json` are created.

- [ ] **Step 6: Add a temporary App Router page**

Create `app/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Meadowview Apartments',
  description: 'Meadowview Apartments in Springfield, Missouri.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

Create `app/page.tsx`:

```tsx
export default function Home() {
  return <main>Meadowview Apartments</main>;
}
```

Create `app/globals.css`:

```css
* {
  box-sizing: border-box;
}

body {
  margin: 0;
}
```

- [ ] **Step 7: Verify the scaffold**

Run:

```bash
npm run build
```

Expected: Next.js build succeeds and generates a production build.

- [ ] **Step 8: Commit the scaffold**

```bash
git add package.json package-lock.json next.config.ts tsconfig.json eslint.config.mjs app
git commit -m "chore: scaffold next app"
```

---

### Task 2: Move Static Assets Into Next.js Public Assets

**Files:**
- Create: `public/wp-content/uploads/2024/01/*.jpg`
- Create: `public/wp-content/uploads/2024/04/*.png`
- Preserve: `wp-content/uploads/...` until parity is verified

- [ ] **Step 1: Copy the current assets into `public/`**

Run:

```bash
mkdir -p public
cp -R wp-content public/wp-content
```

Expected: existing paths become available at URLs such as `/wp-content/uploads/2024/01/1-PH-scaled.jpg`.

- [ ] **Step 2: Verify expected assets exist**

Run:

```bash
test -f public/wp-content/uploads/2024/01/1-PH-scaled.jpg
test -f public/wp-content/uploads/2024/04/MV-Logo-Trans.png
```

Expected: both commands exit with status `0`.

- [ ] **Step 3: Commit the public assets**

```bash
git add public/wp-content
git commit -m "chore: move site assets to public"
```

---

### Task 3: Extract Site Content Into Data Constants

**Files:**
- Create: `lib/site-content.ts`

- [ ] **Step 1: Create `lib/site-content.ts`**

```ts
export const siteInfo = {
  name: 'Meadowview Apartments',
  phone: '417-823-3950',
  phoneHref: 'tel:+14178233950',
  email: 'info@jnmrealtygroup.com',
  emailHref: 'mailto:info@jnmrealtygroup.com',
  address: ['3460 E Lombard St', 'Springfield, MO 65809'],
  mapSrc:
    'https://maps.google.com/maps?q=3460%20E%20Lombard%20St%20Springfield%2C%20MO%2065809&t=m&z=10&output=embed&iwloc=near',
};

export const navItems = [
  { label: 'Home', href: '#welcome' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'Amenities', href: '#amenities' },
  { label: 'Contact', href: '#contact' },
] as const;

export const navCta = { label: 'Contact Us', href: '#contact' } as const;

export const galleryImages = [
  {
    src: '/wp-content/uploads/2024/01/Lombard-Drone-Back-1-scaled.jpg',
    alt: 'Aerial view',
  },
  {
    src: '/wp-content/uploads/2024/01/1-PH-scaled.jpg',
    alt: 'Interior',
  },
  {
    src: '/wp-content/uploads/2024/01/2-PH-scaled.jpg',
    alt: 'Interior',
  },
  {
    src: '/wp-content/uploads/2024/01/3-PH-scaled.jpg',
    alt: 'Interior',
  },
  {
    src: '/wp-content/uploads/2024/01/4-PH-scaled.jpg',
    alt: 'Interior',
  },
  {
    src: '/wp-content/uploads/2024/01/5-PH-scaled.jpg',
    alt: 'Interior',
  },
  {
    src: '/wp-content/uploads/2024/01/Kitchen.jpg',
    alt: 'Kitchen',
  },
  {
    src: '/wp-content/uploads/2024/01/Lombard-12-scaled.jpg',
    alt: 'Exterior',
  },
] as const;

export const amenityGroups = [
  {
    title: 'Features',
    items: [
      'BBQ Area',
      'Pool',
      'Ample Parking',
      'Pets welcome',
      'Quiet community',
      'Laundry Facilities on Site',
    ],
  },
  {
    title: 'Building Amenities',
    items: ['24 Hr Maintenance', 'Central Heat & Air', 'Quiet Community'],
  },
  {
    title: 'Unit Features',
    items: [
      '2 Bedrooms',
      '1.5 Bath',
      'Fully-Equipped Kitchens',
      '900 sq ft',
      'Patio or Balcony',
      'Garden Views',
    ],
  },
] as const;

export const robynnWidget = {
  src: 'https://robynn.ai/widget/v1/robynn-widget.js',
  org: 'the-meadow-view-apartments',
  key: 'rbw_2d2da1e153fc3cfddb39d25163544b2e00f78bd113dd4f61ede03ba0d55b42d9',
} as const;
```

- [ ] **Step 2: Commit the content constants**

```bash
git add lib/site-content.ts
git commit -m "chore: extract site content"
```

---

### Task 4: Rebuild The Static Page As Components

**Files:**
- Modify: `app/page.tsx`
- Create: `components/site-header.tsx`
- Create: `components/hero.tsx`
- Create: `components/welcome.tsx`
- Create: `components/gallery.tsx`
- Create: `components/amenities.tsx`
- Create: `components/contact.tsx`
- Create: `components/site-footer.tsx`
- Create: `components/robynn-widget.tsx`

- [ ] **Step 1: Create `components/site-header.tsx`**

Use `next/image` for the logo and `navItems` plus `navCta` from `lib/site-content.ts`. Preserve the current anchor destinations, including the header `Contact Us` CTA linking to `#contact`.

- [ ] **Step 2: Create `components/hero.tsx`**

Use the existing hero title text, background image URL `/wp-content/uploads/2024/01/1-PH-scaled.jpg`, and contact CTA linking to `#contact`.

- [ ] **Step 3: Create `components/welcome.tsx`**

Move the welcome section copy from `index.html` into this component. Preserve the section id `welcome`.

- [ ] **Step 4: Create `components/gallery.tsx`**

Render `galleryImages.map(...)` and preserve the section id `gallery`. Use fixed dimensions or `fill` with stable aspect-ratio wrappers so the grid does not shift during image loading.

- [ ] **Step 5: Create `components/amenities.tsx`**

Render `amenityGroups.map(...)` and preserve the section id `amenities`. Preserve the actual grouped static content from `index.html`:

- Features: BBQ Area, Pool, Ample Parking, Pets welcome, Quiet community, Laundry Facilities on Site
- Building Amenities: 24 Hr Maintenance, Central Heat & Air, Quiet Community
- Unit Features: 2 Bedrooms, 1.5 Bath, Fully-Equipped Kitchens, 900 sq ft, Patio or Balcony, Garden Views

- [ ] **Step 6: Create `components/contact.tsx`**

Render phone, email, map iframe, and the current form fields. Keep the form non-submitting in this milestone:

```tsx
<form>
  <div className="form-group">
    <input type="text" name="name" placeholder="Name" autoComplete="name" required />
  </div>
  <div className="form-group">
    <input type="email" name="email" placeholder="Email *" autoComplete="email" required />
  </div>
  <div className="form-group">
    <input type="text" name="subject" placeholder="Subject" />
  </div>
  <div className="form-group">
    <textarea name="message" placeholder="Message *" rows={5} required />
  </div>
  <button type="submit" className="btn-primary">Contact Us</button>
</form>
```

- [ ] **Step 7: Create `components/robynn-widget.tsx`**

Use Next.js `Script` and `robynnWidget` from `lib/site-content.ts`:

```tsx
import Script from 'next/script';
import { robynnWidget } from '@/lib/site-content';

export function RobynnWidget() {
  return (
    <Script
      src={robynnWidget.src}
      strategy="afterInteractive"
      data-org={robynnWidget.org}
      data-key={robynnWidget.key}
    />
  );
}
```

- [ ] **Step 8: Compose the page in `app/page.tsx`**

```tsx
import { Amenities } from '@/components/amenities';
import { Contact } from '@/components/contact';
import { Gallery } from '@/components/gallery';
import { Hero } from '@/components/hero';
import { RobynnWidget } from '@/components/robynn-widget';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { Welcome } from '@/components/welcome';

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <Welcome />
        <Gallery />
        <Amenities />
        <Contact />
      </main>
      <SiteFooter />
      <RobynnWidget />
    </>
  );
}
```

- [ ] **Step 9: Verify anchors still work**

Run the app and visit:

```bash
npm run dev
```

Open:
- `http://127.0.0.1:3000/#welcome`
- `http://127.0.0.1:3000/#gallery`
- `http://127.0.0.1:3000/#amenities`
- `http://127.0.0.1:3000/#contact`

Expected: each URL scrolls to the matching section.

- [ ] **Step 10: Commit component extraction**

```bash
git add app/page.tsx components
git commit -m "feat: rebuild homepage with next components"
```

---

### Task 5: Port The CSS And Fonts

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Replace Google Fonts link with `next/font/google`**

In `app/layout.tsx`, import the current families that map cleanly through `next/font/google`: Barlow, Open Sans, Great Vibes, and Cinzel.

- [ ] **Step 2: Move the CSS from `index.html` into `app/globals.css`**

Convert every `class` selector to the React `className` values used in components. Preserve the current responsive breakpoints before making design changes.

- [ ] **Step 3: Replace relative CSS image URLs**

Change:

```css
background: url('wp-content/uploads/2024/01/1-PH-scaled.jpg') center/cover no-repeat;
```

to:

```css
background: url('/wp-content/uploads/2024/01/1-PH-scaled.jpg') center/cover no-repeat;
```

- [ ] **Step 4: Run build**

```bash
npm run build
```

Expected: CSS compiles and no missing asset paths are reported.

- [ ] **Step 5: Commit styling parity**

```bash
git add app/layout.tsx app/globals.css
git commit -m "feat: port static site styling"
```

---

### Task 6: Visual And Functional Parity Pass

**Files:**
- Modify only component or CSS files needed for parity fixes.

- [ ] **Step 1: Start local Next.js**

```bash
npm run dev
```

Expected: app is available at `http://127.0.0.1:3000/`.

- [ ] **Step 2: Compare key viewports**

Check these viewport widths:
- `390x844` mobile
- `768x1024` tablet
- `1440x1000` desktop

Expected:
- Header logo and nav do not overlap.
- Hero image loads.
- Gallery images fill their cells.
- Amenities grid is readable.
- Contact form fields are visible.
- Google map iframe loads.
- Robynn widget script does not block rendering.

- [ ] **Step 3: Fix only parity issues**

Keep changes scoped to preserving the current static site. Do not redesign colors, content, spacing, or layout in this task.

- [ ] **Step 4: Run production build**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 5: Commit parity fixes**

```bash
git add app components lib
git commit -m "fix: match static site parity"
```

---

### Task 7: Decide And Wire Contact Form Behavior

**Files:**
- Modify: `components/contact.tsx`

- [x] **Step 1: Choose the submission destination**

Chosen implementation path: static `mailto:` fallback because no email provider or CRM credentials are available in the repo. Do not add an API route, dependencies, or environment variables for this task.

Current form fields stay unchanged for static page parity:
- `name="name"`, placeholder `Name`, required.
- `name="email"`, placeholder `Email *`, required.
- `name="subject"`, placeholder `Subject`.
- `name="message"`, placeholder `Message *`, rows `5`, required.

- [x] **Step 2: Wire static mailto fallback**

Keep `components/contact.tsx` as the client component and use browser-native required-field validation. On valid submit, prevent the default page navigation and set `window.location.href` to a `mailto:` URL for `siteInfo.email`.

The mailto URL uses:
- Subject: the provided subject, or `Meadowview Apartments Tour Request` when blank.
- Body: Name, Email, Subject, and Message on separate readable lines.

- [x] **Step 3: Test submission**

Run:

```bash
npm run lint
npm run build
```

Expected:
- Lint succeeds.
- Production build succeeds.
- Empty required fields keep browser-native validation.
- Valid submission opens the encoded mailto destination.

- [x] **Step 4: Commit contact behavior**

```bash
git add components/contact.tsx docs/superpowers/plans/2026-05-27-nextjs-conversion.md
git commit -m "feat: add mailto contact fallback"
```

---

### Task 8: Cleanup Legacy Static Entry Point

**Files:**
- Delete or archive: `index.html`
- Keep: `public/wp-content/uploads/...`
- Optional delete: root `wp-content/` after verifying all assets are served from `public/`

- [ ] **Step 1: Confirm the Next.js app is the source of truth**

Run:

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 2: Confirm no code references root `wp-content`**

Run:

```bash
rg "wp-content" app components lib public
```

Expected: all runtime references use `/wp-content/...` URLs or files under `public/wp-content`.

- [ ] **Step 3: Remove legacy files**

Run:

```bash
rm index.html
rm -rf wp-content
```

Expected: only the Next.js app and `public/wp-content` asset tree remain.

- [ ] **Step 4: Commit cleanup**

```bash
git add -A
git commit -m "chore: remove legacy static entrypoint"
```

---

## Verification Checklist

Run before considering the migration complete:

```bash
npm run build
npm run lint
```

Manual browser checks:
- `/` renders the full page.
- `/#amenities` lands on the amenities section.
- All gallery images load.
- Header links scroll to the correct sections.
- Phone link opens `tel:+14178233950`.
- Email link opens `mailto:info@jnmrealtygroup.com`.
- Map iframe displays the Springfield, Missouri location.
- Robynn widget script loads without console-blocking errors.
- Contact form behavior matches the chosen destination.

## Deployment Notes

This app can deploy as a normal Next.js App Router project. If using Vercel, upgrade the local Vercel CLI first because the installed CLI is outdated:

```bash
npm i -g vercel@latest
```

Then deploy through the GitHub integration or:

```bash
vercel
```

## Open Decisions Before Implementation

1. Should the final site preserve the current static design exactly first, or should the Next.js migration include a design refresh?
2. Where should the contact form submit?
3. Should the Robynn widget remain on every page, or only the homepage?
4. Should image filenames and `/wp-content/...` public URLs be preserved for compatibility, or should assets be renamed into a cleaner `/images/...` structure after parity?
