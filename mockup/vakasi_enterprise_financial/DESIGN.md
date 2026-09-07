---
name: VAKASI Enterprise Financial
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#434655'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#747686'
  outline-variant: '#c4c5d7'
  surface-tint: '#2151da'
  primary: '#0037b0'
  on-primary: '#ffffff'
  primary-container: '#1d4ed8'
  on-primary-container: '#cad3ff'
  inverse-primary: '#b7c4ff'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#004f35'
  on-tertiary: '#ffffff'
  tertiary-container: '#006948'
  on-tertiary-container: '#76eab6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b7c4ff'
  on-primary-fixed: '#001551'
  on-primary-fixed-variant: '#0039b5'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#85f8c4'
  tertiary-fixed-dim: '#68dba9'
  on-tertiary-fixed: '#002114'
  on-tertiary-fixed-variant: '#005137'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 2rem
    fontWeight: '700'
    lineHeight: 2.5rem
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.5rem
    fontWeight: '600'
    lineHeight: 2rem
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.25rem
    fontWeight: '600'
    lineHeight: 1.75rem
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.125rem
    fontWeight: '600'
    lineHeight: 1.5rem
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.5rem
  body-md:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.25rem
  body-sm:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '400'
    lineHeight: 1rem
  label-lg:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '500'
    lineHeight: 1.25rem
  label-md:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '600'
    lineHeight: 1rem
    letterSpacing: 0.025em
  label-sm:
    fontFamily: Inter
    fontSize: 0.6875rem
    fontWeight: '600'
    lineHeight: 0.875rem
    letterSpacing: 0.05em
  currency-display:
    fontFamily: Inter
    fontSize: 1.75rem
    fontWeight: '700'
    lineHeight: 2.25rem
    letterSpacing: -0.02em
  currency-cell:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '600'
    lineHeight: 1.25rem
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  space-2xs: 0.125rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-base: 1rem
  space-lg: 1.25rem
  space-xl: 1.5rem
  space-2xl: 2rem
  space-3xl: 3rem
  sidebar-width: 17.5rem
  header-height: 4rem
  data-row-height: 2.75rem
  data-row-compact: 2.25rem
---

## Brand & Style

This design system serves an institutional-grade financial execution and budget administration platform. The visual tone commands absolute bureaucratic trust, fiscal transparency, and operational clarity. It merges the technical rigor of public finance accounting with the modern ergonomics of contemporary enterprise web applications.

The design movement is **Modern Institutional Precision**—an aesthetic influenced by clean component-driven interfaces (shadcn/ui), characterized by immaculate crispness, high contrast, subtle borders, and deliberate typographic restraint. It avoids superficial decorations, skeuomorphism, or whimsical rounded geometries in favor of sharp structural logic, rapid data digestion, and seamless auditability across dense multi-tier approval flows.

## Colors

The system employs a high-contrast corporate palette engineered for readability during long hours of fiscal review.

### Color Tiers & Roles
- **Base Canvas (`#f8fafc` to `#ffffff`)**: Canvas backgrounds leverage cold slate off-white (`#f8fafc`) to separate structural workspace containers from pure white (`#ffffff`) interactive paper modules, table surfaces, and data cards.
- **Primary Sovereign Blue (`#1d4ed8` primary, `#2563eb` hover, `#1e40af` pressed/active)**: The locus of authority and primary action. Used exclusively for primary buttons, active navigation markers, key totals, and confirmed batch workflows. Tints such as `#eff6ff` (50) and `#dbeafe` (100) serve as high-visibility hover states, active row selections, and subtle pill fills.
- **Structural Slate Neutrals**:
  - Headings and values: Deep Obsidian Slate (`#0f172a`)
  - Subtitles, labels, and secondary context: Medium Slate (`#475569`)
  - Subtle icons and metadata: Muted Slate (`#64748b`)
  - Borders, dividers, and structural rules: Crisp Slate Mist (`#e2e8f0` and `#cbd5e1`)
  - Inactive containers and input backgrounds: Slate Frost (`#f1f5f9`)

### Financial State Taxonomy
Status indicators strictly follow public sector administrative stages:
- **Draft / Unsubmitted**: Slate (`text-slate-700`, `bg-slate-100`, `border-slate-300`)
- **Submitted / In Review**: Amber (`#d97706` text, `#fef3c7` bg, `#fcd34d` border)
- **Verified / Approved**: Emerald (`#059669` text, `#ecfdf5` bg, `#a7f3d0` border)
- **Disbursed / Paid**: Royal Cobalt (`#1d4ed8` text, `#eff6ff` bg, `#bfdbfe` border)
- **Rejected / Revision Required**: Crimson Rose (`#e11d48` text, `#ffe4e6` bg, `#fecdd3` border)

## Typography

The type scale combines the modern geometric crispness of **Plus Jakarta Sans** for navigational elements, headings, and metric labels with the clinical legibility of **Inter** for forms, dense data grids, and audit logs.

### Financial Number Formatting Rules
- All numerical amounts, transaction IDs, Indonesian NIP/NIK strings, MAK account codes, and Rupiah currency values must explicitly activate tabular lining (`font-feature-settings: "tnum" 1, "cv05" 1`).
- Indonesian Rupiah values must maintain unambiguous visual alignment: `Rp` symbol rendered in a medium weight slate tint (`#64748b`), followed by a non-breaking space and the strict dot-separated thousand format (e.g., `Rp 1.450.000.000,00`).
- Negative balances or budget deficits must be enclosed in parentheses with rose coloration (e.g., `(Rp 12.450.000)`), never relying solely on a minus sign.

## Layout & Spacing

The layout is built for high information throughput on wide-aspect desktop monitors (1440px and 1920px typical administrative environments), backed by an adaptive 12-column grid system.

### Spatial Architecture
- **Navigation Shell**: Fixed left persistent sidebar (`17.5rem` / 280px) for institutional organizational tree navigation, collapsable to `4.5rem` icon-rail for dense balance sheet reviews.
- **Top Bar**: Rigid `4rem` (64px) global utility zone housing satker/agency switchers, fiscal year selectors (TA 2024/2025), and notification centers.
- **Content Area**: Fluid max-width `100rem` (1600px) with minimum lateral gutters of `1.5rem` (24px) on desktop and `1rem` (16px) on tablet viewports.
- **Grid Structure**: 12 columns, 16px gutter on desktop, 12px gutter on compact tablet views. Data forms adopt strict 2, 3, or 4 column spans without staggered heights.

### Density Tiers
- **Standard Layout**: Default padding of `1.25rem` (20px) inside cards and summaries.
- **Dense Table Grid**: Standard cell vertical rhythm is constrained to `2.75rem` (44px) and togglable to `2.25rem` (36px) compact mode for line-item SPD, SP2D, and BKU reconciliations.

## Elevation & Depth

Visual separation relies on structural hairpins and micro-elevation rather than heavy drop shadows, preserving an uncluttered shadcn-grade canvas.

### Depth Hierarchy
- **Level 0 (Base Canvas)**: `#f8fafc`. Flat ground layer.
- **Level 1 (Surface / Card)**: `#ffffff`, bordered by `1px solid #e2e8f0`. Shadow: `0 1px 2px 0 rgba(15, 23, 42, 0.04)`. All tabular grids, input forms, and metric panels exist at this level.
- **Level 2 (Interactive / Hover)**: `#ffffff`, border tinted to `#cbd5e1`. Shadow: `0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.05)`. Applied to active cards, row hovers, and segmented control handles.
- **Level 3 (Flyouts & Dropdowns)**: `#ffffff`, border `1px solid #e2e8f0`. Shadow: `0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.04)`. Used for account code autocompletes, filter popovers, and date pickers.
- **Level 4 (Modals & Command Palettes)**: `#ffffff`, border `1px solid #cbd5e1`. Shadow: `0 20px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.06)`. Backdropped by an absolute slate veil: `rgba(15, 23, 42, 0.45)` with `backdrop-filter: blur(4px)`.

## Shapes

The geometric framework is tailored for compact architectural stability. It uses restrained corner radii that maintain formal authority without sharp brutalism.

- **Base Radius (0.375rem / 6px)**: Standard for inputs, buttons, table cell indicators, badges, and dropdown trigger elements.
- **Container Radius (0.5rem / 8px)**: Applied to cards, balance sheets, modal panels, and embedded data sections (`rounded-lg`).
- **Pill Elements (`9999px`)**: Reserved exclusively for atomic state badges (e.g., status tags: "Disetujui", "Menunggu Verifikasi") and active avatar indicators. Never used for buttons or inputs.

## Components

### Buttons
- **Primary**: Solid `#1d4ed8` fill, white text, height 36px (compact) or 40px (regular), padding `0 1rem`, font weight 500 (`text-sm`). Hover: `#1e40af`, active shadow inset. Focus ring: `2px solid #2563eb` with 2px offset.
- **Secondary / Outline**: `#ffffff` background, `1px solid #e2e8f0` border, `#0f172a` text. Hover: `#f8fafc` surface and `#cbd5e1` border.
- **Ghost**: Transparent fill, `#475569` text. Hover: `#f1f5f9` fill and `#0f172a` text.
- **Destructive**: `#ffffff` fill, `1px solid #fecdd3` border, `#e11d48` text. Hover: `#ffe4e6` fill. For immediate deletion: `#e11d48` solid fill, white text.

### Data Inputs & Currency Fields
- **Field Anatomy**: Label above in `label-md` uppercase styling (`text-slate-600 font-semibold tracking-wider text-xs`). Container height 36px, `border: 1px solid #e2e8f0`, background `#ffffff`. Focus: `border-color: #2563eb`, shadow `0 0 0 1px #2563eb`.
- **Rupiah Currency Input**: Prefix adornment fixed on the left in a solid neutral container: `Rp` badge in `#f1f5f9` with right separator border. Right-aligned numerical value using `tabular-nums font-mono`.

### Status Badges / Chips
- Small, compact height (22px), `padding: 0 0.5rem`, `border-radius: 9999px`, font size `0.75rem`, font weight 600.
- Must always pair a 6px solid dot with the text string to support color-blind auditing (e.g., green dot + "Disetujui").

### Data Tables (BKU & SPJ Registers)
- **Header**: `#f8fafc` background, uppercase 11px slate typography (`#475569 font-bold tracking-wider`), bottom border `1px solid #cbd5e1`.
- **Rows**: Alternating subtle zebra row highlights or crisp bottom borders (`1px solid #f1f5f9`). Row hover triggers `#f8fafc` transition. Selected row sets background to `#eff6ff` with an active left edge border of 3px solid `#1d4ed8`.
- **Numeric Columns**: Always right-aligned with column header matching the alignment.

### Cards & Summary Panels
- Base card: White background, `1px solid #e2e8f0`, radius `8px`. Header section separated by a faint horizontal divider (`#f1f5f9`).
- **Fiscal KPI Widget**: Features a top primary accent border (2px `#1d4ed8`), a muted slate label, an oversized tabular number (`currency-display`), and a comparative percentage badge.

### Checkboxes & Selection Controls
- Custom square with `radius: 4px`, size 16px × 16px.
- Unchecked: `border: 1px solid #cbd5e1`, background `#ffffff`.
- Checked: Solid `#1d4ed8` fill with sharp white checkmark vector. Indeterminate state features a centered horizontal white minus bar.