# RLA Solutions Webdesign

## Project Overview
Marketing site for a solo web-design practice (Robert Anschütz, München). Editorial aesthetic — warm cream base with red accents. Bilingual (DE primary, EN mirror). Live at **rla-solutions.com** (All-Inkl shared hosting) and mirrored at **rlasolutions.netlify.app** (Netlify staging). All dynamic pieces stay host-portable so the site doesn't depend on Netlify-only or All-Inkl-only features.

## Tech Stack
- Vanilla HTML/CSS/JS (no framework, no build step)
- **Self-hosted fonts** in `assets/fonts/` — Bricolage Grotesque (display) + Plus Jakarta Sans (body) regular + italic. Variable woff2 files, latin subset only. No third-party font CDN — required for DSGVO compliance (LG München 3 O 17493/20).
- Local dev: `npx serve` or the Claude Preview server at :3000

## Structure
```
index.html                  — Homepage (DE)
about.html                  — About me page (DE)
impressum.html, datenschutz.html — Legal (DE)
en/                         — English mirror (same filenames + structure)
css/style.css               — All styles
js/main.js                  — All interactions
assets/                     — Portfolio screenshots, profile photo, favicon, og-image
.firecrawl/                 — Scraped reference-site data (gitignored)
```

## Homepage Sections
Hero → Services → Portfolio (horizontal carousel) → Process → Testimonials → Pricing → Contact → FAQ → Footer

## Design System

### Palette (CSS variables in `:root`)
- `--white` / `--cream` / `--sand` — warm neutrals
- `--charcoal` / `--graphite` / `--muted` — text
- `--primary` `#DC2626` — red
- `--primary-light`, `--primary-glow` (12% alpha), `--primary-border-soft` (28% alpha, for decorative card borders)
- `--accent` `#0055FF` (rarely used)

### Typography
- Display: Bricolage Grotesque 700/800, Italic for rotating words
- Body: Plus Jakarta Sans 400/600
- Section titles: `clamp(36px, 5vw, 64px)` desktop / `clamp(22px, 6.5vw, 38px)` mobile
- Contact title matches other section titles (64px desktop)

### Rhythm & spacing
- Radius scale: `--radius-sm` 8 / `--radius-md` 14 / `--radius-lg` 22 / `--radius-xl` 32
- Container: `--container-width` 1280px, `--container-padding` clamp(20px, 4vw, 48px)
- Section padding: `clamp(60px, 7vw, 100px)`

### Animation tokens
- `--ease-out` / `--ease-spring` for transitions
- `--rotator-enter-duration` 0.65s / `--rotator-exit-duration` 0.4s — shared between CSS keyframes and JS scheduling (read via `getComputedStyle` in `TextRotator`)

### Voice (IMPORTANT)
Main pages use the **personal "Ich"-voice** throughout (Ich baue, Ich gestalte, Ich mache…). When editing copy:
- Use: *ich, mir, meine*
- Avoid: *wir, uns, unser, unsere* in the agency voice
- Exceptions: customer testimonial quotes (customer's words — keep as-is), "Lassen Sie uns…" collaborative invitations, legal pages (standard legal "wir"), short conversational "Wir sprechen miteinander" (two-party dialogue, not agency plural)

## Reusable components

### Rotating word (class: `.rotating-word`)
- `<span class="rotating-word" data-text-rotate data-words="a,b,c">a</span>`
- JS `TextRotator` in main.js cycles via two stacked layers with overlap animation
- Italic padding is tuned to Bricolage Grotesque 700 italic; re-measure padding on the rotator if the display font ever changes
- `will-change` only applies during the active animation (stripped via JS `setTimeout` once enter finishes) to avoid permanent GPU layers that would clip italic glyph overhang

### Back-to-top button (`.back-to-top`, id `backToTop`)
- Fixed bottom-left (opposite the WhatsApp fab bottom-right), revealed once scrollY passes half the viewport
- Charcoal bg / white arrow by default, turns primary red on hover
- Present on all 8 pages; JS in main.js toggles `.visible` class + smooth-scroll on click

### Mobile menu (`.nav__mobile`) — architectural gotcha
**The mobile menu MUST stay as a direct child of `<body>`, outside `<nav>`.** `.nav.scrolled` applies `backdrop-filter`, which creates a new containing block for `position: fixed` descendants. If the menu is nested inside `.nav`, its `inset: 0` clips to the small nav bar height once the user scrolls. Every page has an HTML comment above the menu reminding of this.

## Interactive behaviors (main.js)
- Cursor glow (desktop only)
- Scroll-driven `.nav.scrolled` toggle
- Mobile menu open/close (display-toggle — not opacity, for reliability)
- Smooth-scroll on anchor links with 80px offset
- Logo → scroll-to-top interceptor
- IntersectionObserver-based `.reveal` → `.visible` staggered fade-ins
- Hero counter animation (data-count)
- Portfolio carousel (horizontal scroll + prev/next buttons + progress bar)
- FAQ accordion
- Contact form submit — wired to FormSubmit AJAX (`formsubmit.co/ajax/robert.anschuetz@rla-solutions.com`). Honeypot + 3s time-check run client-side, then `fetch()` POST. Success/error states shown inline on the submit button. No page redirect.
- Back-to-top scroll watcher

## Deployment

GitHub is the source of truth. Every push to `main` auto-deploys to **both** Netlify and All-Inkl in parallel.

```
                ┌─→ Netlify (rlasolutions.netlify.app) — staging mirror, ~30s
git push main →─┤
                └─→ All-Inkl (rla-solutions.com) — production, ~60s via GitHub Action FTPS
```

**Repo:** [`RobertAnschuetz/rla-solutions-website`](https://github.com/RobertAnschuetz/rla-solutions-website) (private)

**Netlify:** linked to the GitHub repo (Site configuration → Continuous deployment). Branch `main`, no build command, publish dir = root. Auto-rebuild on every push.

**All-Inkl:** GitHub Action `.github/workflows/deploy-allinkl.yml` syncs files via FTPS (port 21, TLS) using `SamKirkland/FTP-Deploy-Action@v4`. Credentials live in GitHub repo Secrets:
- `ALLINKL_HOST` = `w0216ad1.kasserver.com`
- `ALLINKL_USER` = `f01842cd` (the `rla-deploy` FTP user; full RWLV at `/`)
- `ALLINKL_PASSWORD` = (secret)
- `ALLINKL_PATH` = `/rla-solutions.com/` (per-domain subdirectory; All-Inkl's convention)

**Why both?** Netlify is fast, free, and easy to roll back via its UI; All-Inkl is the actual production host carrying the public domain. If ever migrating production again (IONOS, Hetzner, etc.), only the GitHub Action's FTP secret values change — the workflow stays portable.

**Things to keep host-portable** (avoid):
- Netlify Forms (use FormSubmit instead)
- Netlify redirects/edge functions/headers
- All-Inkl-specific PHP includes (the site is static anyway)

## Notes & open items
- Contact form is live via FormSubmit — submissions email `robert.anschuetz@rla-solutions.com`. Form `_subject` = "Neue Anfrage über rla-solutions.com" (DE) / "New inquiry from rla-solutions.com" (EN), `_template=table` for readable formatting, `_captcha=false` (we have honeypot + time check instead). Success copy now says "Ich melde mich." (was "Wir melden uns.").
- Portfolio uses real customer screenshots in `assets/portfolio-*.png`.
- Hero stats: `30+ Projekte`, `24h Antwortzeit`, `95+ PageSpeed` — defensible claims, do not inflate.
- Old `rla-solutions.de` domain mapping in KAS and the `/rla-solutions.de/` directory in webspace are orphaned (the .de domain is owned by someone else). Safe to delete via KAS → Domain and via WebFTP — pure cleanup, no functional impact.
- Honeypot spam protection is in place: hidden `name="_honey"` field + 3-second time-check in JS. The field name is intentional — when FormSubmit is wired, it auto-uses `_honey` as a server-side check too.

## Reference Sites
Original design inspiration: wibify.agency (pricing/social proof), vpv.co (editorial aesthetic), jasminegunarto.com (typography)
