---
name: Agbegilere Botanical
description: Minimalismo africano refinado para comercio botánico yoruba — tokens Stitch canónicos para la tienda en español (México).
colors:
  surface: '#fcf9f4'
  surface-dim: '#dcdad5'
  surface-bright: '#fcf9f4'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3ee'
  surface-container: '#f0ede9'
  surface-container-high: '#ebe8e3'
  surface-container-highest: '#e5e2dd'
  on-surface: '#1c1c19'
  on-surface-variant: '#57423c'
  inverse-surface: '#31302d'
  inverse-on-surface: '#f3f0eb'
  outline: '#8b716a'
  outline-variant: '#dec0b7'
  surface-tint: '#a53c19'
  primary: '#781f00'
  on-primary: '#ffffff'
  primary-container: '#9a3412'
  on-primary-container: '#ffbda9'
  inverse-primary: '#ffb59f'
  secondary: '#486458'
  on-secondary: '#ffffff'
  secondary-container: '#c7e7d7'
  on-secondary-container: '#4c695c'
  tertiary: '#633300'
  on-tertiary: '#ffffff'
  tertiary-container: '#854600'
  on-tertiary-container: '#ffbf8c'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbd1'
  primary-fixed-dim: '#ffb59f'
  on-primary-fixed: '#3a0a00'
  on-primary-fixed-variant: '#842503'
  secondary-fixed: '#caeada'
  secondary-fixed-dim: '#aecebe'
  on-secondary-fixed: '#032017'
  on-secondary-fixed-variant: '#304c41'
  tertiary-fixed: '#ffdcc3'
  tertiary-fixed-dim: '#ffb77d'
  on-tertiary-fixed: '#2f1500'
  on-tertiary-fixed-variant: '#6e3900'
  background: '#fcf9f4'
  on-background: '#1c1c19'
  surface-variant: '#e5e2dd'
typography:
  headline-xl:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 36px
    fontWeight: '500'
    lineHeight: 44px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 26px
    fontWeight: '500'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Playfair Display
    fontSize: 28px
    fontWeight: '500'
    lineHeight: 36px
  headline-sm:
    fontFamily: Playfair Display
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.08em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  gutter-lg: 2rem
  margin: 1rem
  margin-md: 2rem
  margin-lg: 4rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

<!-- Tokens in frontmatter are Stitch-authored and canonical. Map them to Tailwind theme.extend + shadcn CSS variables under src/web once scaffolded. Re-run $impeccable document after code exists to capture component tokens from implementation. -->

# Design System: Agbegilere Botanical

## Overview

**Creative North Star: "The Apothecary Specimen Archive"**

This design system embodies refined African minimalism—a modern, respectful convergence of Yoruba herbal tradition and contemporary digital commerce. It serves conscious wellness seekers, herbalists, and diaspora communities who want authentic traditional preparations (Ose Dudu, decocciones Agbo, aceites botánicos) inside a premium, trustworthy interface. The shop operates in **Spanish (es-MX)** with prices in **MXN**; see [ARCHITECTURE.md](ARCHITECTURE.md) and [AGENTS.md](AGENTS.md) for product boundaries.

The movement blends warm, tactile earthiness with disciplined grid structure and shadcn-style component architecture. Visual elements avoid folklore pastiche in favor of deliberate craftsmanship:

- **Geometry and motifs:** Hairline dividers and rhythmic grids informed by Adire textiles, distilled into 1px linework and micro-dots.
- **Atmosphere:** Warm, quiet, editorial, restorative—linen and sun-dried clay on `surface` (`#fcf9f4`).
- **Cultural markers:** Restrained brass seals (`tertiary-container`), cowrie silhouettes as inline SVG, and certification badges for botanical authenticity.

**Implementation binding:** Canonical tokens in this file’s YAML frontmatter are the only color and type source. When the app scaffold lands, mirror them into Tailwind `theme.extend` and shadcn CSS variables under `src/web`. Use primitives from `src/web/components/ui` only; compose feature UI in `src/web/features/*`. Forms use TanStack Form with shadcn fields. Icons ship via `@tabler/icons-react` (not Lucide). Impeccable reads this file with [PRODUCT.md](PRODUCT.md) when present; extended shadows and component snippets live in [.impeccable/design.json](.impeccable/design.json).

**Key Characteristics:**

- Specimen-archive editorial rhythm with commerce density where checkout demands it.
- Tonal depth over floating cards at rest; motion and shadow respond to state.
- Token-faithful palette: every UI color resolves to a frontmatter `colors.*` key.
- Spanish UI copy; Latin botanical names preserved; Yoruba product names where culturally accurate.
- Operate mode for shop, cart, checkout, account, and admin (see Impeccable `operate`).

## Colors

The palette balances fired clay, medicinal foliage, sacred linen, and ancestral brass. Light mode only; values below cite **exact** frontmatter tokens.

### Primary

- **Fired Clay** (`primary`, `#781f00`): Primary buttons, key links, focus rings, and high-intent actions. Text on primary uses `on-primary` (`#ffffff`).
- **Ember Container** (`primary-container`, `#9a3412`): Larger warm fills, hover deepening on primary actions, promotional bands. Pair with `on-primary-container` (`#ffbda9`) for text on those fills.
- **Fixed accents** (`primary-fixed`, `#ffdbd1`; `primary-fixed-dim`, `#ffb59f`): Hero tints and fixed promotional strips when needed.

**The Fired-Clay Restraint Rule.** `primary` (`#781f00`) should cover no more than roughly 10% of any screen. Its rarity is the point; larger warm areas use `primary-container` (`#9a3412`).

### Secondary

- **Medicinal Foliage** (`secondary`, `#486458`): Trust indicators, verified provenance, structured header bands, checkbox/radio selected states. Text on secondary uses `on-secondary` (`#ffffff`).
- **Leaf Container** (`secondary-container`, `#c7e7d7`): Soft green washes for tags and informational panels. Text: `on-secondary-container` (`#4c695c`).

### Tertiary

- **Ancestral Brass** (`tertiary`, `#633300`; `tertiary-container`, `#854600`): Authentication seals, star ratings, ritual badges, artisan accents. Text on container: `on-tertiary-container` (`#ffbf8c`).

### Neutral

- **Sacred Linen** (`surface`, `#fcf9f4`; `background`, `#fcf9f4`): Default page plane.
- **Raised surfaces:** `surface-container-lowest` (`#ffffff`) for cards and sheets; `surface-container-low` (`#f6f3ee`) and `surface-container` (`#f0ede9`) for nested regions; `surface-container-high` / `surface-container-highest` for subtle steps.
- **Borders:** Hairlines use `surface-variant` (`#e5e2dd`); stronger outlines use `outline` (`#8b716a`) and warm dividers `outline-variant` (`#dec0b7`).
- **Text:** Body and headings on `on-surface` (`#1c1c19`); secondary copy on `on-surface-variant` (`#57423c`).
- **Errors:** `error` (`#ba1a1a`) with `on-error` (`#ffffff`); messages in `error-container` (`#ffdad6`).

**The One Palette Rule.** Do not introduce hex values outside the frontmatter `colors` map. If a new role is needed, extend the Stitch export first, then update prose and Tailwind together.

## Typography

**Display font:** Playfair Display (Georgia, serif fallback)  
**Body and UI font:** Plus Jakarta Sans (system-ui fallback)

**Character:** Editorial reverence for botanical heritage paired with crisp transactional clarity.

### Hierarchy

- **Display** (`headline-xl`, 48px / 600 / 56px line-height; mobile `headline-xl-mobile`, 32px): Collection heroes and apothecary banners.
- **Headline** (`headline-lg`, 36px; `headline-md`, 28px; `headline-sm`, 20px): Category titles and Latin classifications.
- **Title** (`title-md`, 18px / 600): Card titles, dialog headings, checkout section labels.
- **Body** (`body-lg`, 16px; `body-md`, 14px; `body-sm`, 12px): Descriptions, dosing, ingredient lists. Prefer 65–75ch measure for long prose.
- **Label** (`label-lg`, `label-md`, `label-sm`): UI labels, table headers, specimen metadata.

**The Specimen Label Rule.** Technical and table headers use `label-sm` (10px, weight 700, letter-spacing `0.08em`) in uppercase Spanish where appropriate (e.g. `LOTE`, `DOSIS`).

## Layout

Disciplined fixed-to-fluid grid on an 8pt rhythm; spacing tokens from frontmatter `spacing.*`.

- **Desktop (≥1280px):** 12 columns, max width 1280px, `gutter-lg` (2rem), `margin-lg` (4rem). Align to columns like a specimen catalog.
- **Tablet (768px–1279px):** 8 columns, `gutter` (1.5rem), `margin-md` (2rem). Filters move to slide-over panels.
- **Mobile (<768px):** 4 columns, `gutter-sm` (1rem), `margin` (1rem). Product grid: two columns with consistent image ratio.

**Rhythm:** Section breaks use `space-xl` (2.5rem) or more. Component internals use `space-sm` and `space-md` for scanability during checkout.

## Elevation & Depth

Depth is tonal first: surfaces stack using `surface`, `surface-container-*`, and `surface-container-lowest` rather than default drop shadows.

- **At rest:** Cards and lists use `1px solid` `surface-variant` (`#e5e2dd`) without vertical shadow.
- **Hover:** Use sidecar role `card-hover` (tint derived from `primary` / `#781f00`).
- **Overlays:** Drawers, sheets, and menus use sidecar role `overlay-drawer` (tint derived from `on-surface` / `#1c1c19`).
- **Pinned chrome:** Frosted navigation uses sidecar role `nav-frosted` (`surface` at partial opacity + blur + `outline-variant` border).

Exact shadow and backdrop strings live in [.impeccable/design.json](.impeccable/design.json) under `extensions.shadows` and component CSS.

**The Flat-By-Default Rule.** Surfaces are flat at rest. Shadow appears only as a response to hover, elevation, or focus—not as decoration.

## Shapes

Rounded level 2: structural stability with organic softness.

- **Controls** (`rounded.DEFAULT`, 0.5rem): Buttons, inputs, list rows, popovers.
- **Containers** (`rounded.lg`, 1rem): Product cards, modals, detail sheets.
- **Pills** (`rounded.full`): Status chips, origin badges (e.g. “Origen verificado”), active filter pills.
- **Micro** (`rounded.sm`, 0.25rem): Checkboxes; radios remain circular.
- **Dividers:** 1px `surface-variant` or `outline-variant`; optional Adire-inspired micro-notches at intersections—sparingly.

## Components

Implement with shadcn primitives in `src/web/components/ui` (Button, Card, Input, Badge, Checkbox, Table, etc.) and TanStack Form field wrappers. Style via CSS variables mapped to frontmatter tokens.

### Buttons

- **Shape:** `rounded.DEFAULT` (0.5rem).
- **Primary:** Background `primary` (`#781f00`), text `on-primary` (`#ffffff`), typography `label-lg`. Hover: background `primary-container` (`#9a3412`).
- **Secondary:** Transparent fill, border `1px solid` `secondary` (`#486458`), text `secondary`. Hover: `secondary-container` at low opacity.
- **Ghost:** Text `on-surface` (`#1c1c19`); hover text `primary` with underline; optional Tabler arrow icon.

### Cards

- **Product cards:** Background `surface-container-lowest` (`#ffffff`), border `1px solid` `surface-variant` (`#e5e2dd`), radius `rounded.lg`. Image well on `surface-container-low` (`#f6f3ee`), ratio 4:5.
- **Typography:** Botanical Latin in Playfair (`headline-sm` or `title-md`); common name and price in Plus Jakarta (`body-md` / `label-lg`). Prices display MXN with two decimals (stored as centavos in API).
- **Badge:** “Origen verificado” on `tertiary-container` tint with `tertiary` border logic.

### Chips and badges

- **Herbal tags:** `rounded.full`, `label-md`, background `secondary-container` (`#c7e7d7`), text `on-secondary-container` (`#4c695c`).
- **Seals:** Circular brass accent using `tertiary-container` / `tertiary` with inline SVG (cowrie or leaf)—not icon fonts.

### Form inputs and search

- Background `surface-container-lowest`, border `surface-variant`, radius `rounded.DEFAULT`, text `body-md`.
- Focus: border `primary`, ring using `primary-container` at ~12% opacity (see sidecar `ds-input-search`).
- Search quick filters (Spanish): **Tinturas**, **Jabón negro (Ose Dudu)**, **Decocciones (Agbo)**, **Resinas sagradas**.

### Checkboxes and radios

- Checkbox radius `rounded.sm`; radio `rounded.full`.
- Unchecked: border `outline-variant`, fill `surface-container-lowest`.
- Checked: fill `secondary`, checkmark `on-secondary`.

### Data tables and dosage guides

- Horizontal rules `surface-variant` only; alternating rows `surface` and `surface-container-lowest`.
- Headers: uppercase `label-sm`, color `on-surface-variant` (`#57423c`). Column labels in Spanish (e.g. **Ingrediente**, **Cantidad**, **Contraindicaciones**).

## Do's and Don'ts

### Do:

- **Do** map every UI color to a frontmatter `colors.*` token and keep Tailwind/shadcn variables in sync with this file.
- **Do** write all shipped UI copy in Spanish (es-MX); show Latin botanical names and Yoruba product names where accurate.
- **Do** use `@tabler/icons-react` for standard icons; use inline SVG for cultural marks.
- **Do** compose screens inside feature folders; keep `components/ui` limited to shadcn primitives.
- **Do** consult `vitalis-conventions` and Impeccable (`impeccable` skill) for polish, audit, and harden passes before release.

### Don't:

- **Don't** paste ad hoc hex values (including legacy prose colors) that are not in the Stitch frontmatter.
- **Don't** ship Lucide icons in production UI; replace shadcn template defaults with Tabler.
- **Don't** add drop shadows on cards at rest; use borders and surface steps first.
- **Don't** use English for customer-facing labels in the shop, checkout, or account flows.
- **Don't** duplicate skills or agent instructions outside `.agents/skills/` and root `AGENTS.md`.
