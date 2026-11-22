# RLA Solutions: Commercial Excellence & AI Consulting for Pharma

## Project Overview
One-page site for Robert Anschütz's independent consulting practice (Munich): **commercial excellence and applied AI for pharmaceutical companies**. Audience: pharma commercial leaders (Head of Commercial Excellence, BU/launch leads, CCOs). The page's one job is credibility → intro call.

**English only.** The former German webdesign site (DE + EN mirror) was replaced in Nov 2026. Old URLs (`about.html`, `impressum.html`, `datenschutz.html`, `en/*`) are kept as tiny `noindex` meta-refresh stubs pointing to the new pages, so external links and search results don't 404. Don't delete them.

Live at **rla-solutions.com** (All-Inkl) and mirrored at **rlasolutions.netlify.app** (Netlify). Everything stays host-portable (no Netlify Forms/redirects, no All-Inkl PHP, no `.htaccess` dependencies).

## Tech Stack
- Vanilla HTML/CSS/JS, no framework, no build step
- **Self-hosted fonts** in `assets/fonts/`: Bricolage Grotesque (display, variable wght + opsz) and Plus Jakarta Sans (body). No third-party font CDN (GDPR, LG München 3 O 17493/20).
- Local dev: `npx serve` / Claude Preview `dev` config

## Structure
```
index.html          Single page: Hero + commercial chain → Services → Copilot training → Client questions → Ways to work together → About → FAQ → Contact
legal-notice.html   Impressum in English (§ 5 DDG, § 18 (2) MStV, VAT ID DE462805450 per § 27a UStG; Robert is no longer a small business under § 19 UStG since Nov 2026, so prices are shown "plus VAT")
privacy.html        Privacy policy in English (GDPR)
about.html, impressum.html, datenschutz.html, en/*   Redirect stubs (see above)
css/style.css       All styles (~600 lines, tokens in :root)
js/main.js          Header border, mobile menu, hero chain reveal, contact form
assets/             Portrait (robert-anschuetz*.jpg), favicon.svg, og-image.png, fonts
assets/downloads/   rla-copilot-training-offer.pdf (public download; source: KI Training/General Deck/RLA_Copilot_Premium_Training_Offer.pdf)
robots.txt, sitemap.xml
Images/             Source portrait PNG (not referenced by the site)
```

## Design system (minimalist)
- **Palette:** `--paper` #FFF, `--mist` #F3F4F6 (alternate section band), `--ink` #151922, `--slate` #596171 (secondary text), `--rule` #E1E4E9 (hairlines), single accent `--accent` #2747C7 "compound blue". No other colours.
- **Type:** Bricolage Grotesque *light* (340–450) for headings with tight negative tracking; Plus Jakarta Sans 400/600 body. Sentence case everywhere; no all-caps eyebrows, no middle-dot meta strings, no arrows in buttons.
- **Layout:** left-aligned 12-col grid. Section title in cols 1–4 (sticky on desktop ≥1025px), content in cols 6–12. Lists separated by hairlines, no card grids or shadows.
- **Hero:** statement headline "Turn commercial strategy into results in the field." (two lines that rise in on load; on ≤760px it wraps naturally and fades in), lead text, "Request an intro call" + "See what I work on" (CTA wording is "Request", since it leads to the form, not a calendar), and a slim pill above the headline that downloads the Copilot training PDF. Behind it, ~34 fine animated "uptake" curves (pattern inspired by the 21st.dev "Background Paths" hero, rebuilt in vanilla SVG; one curve in the accent blue). `main.js` draws them in the hero's real pixel size (no stretching) within the band down to the headline's bottom edge, redrawing on width changes; CSS masks fade them out towards the text. No proof figures in the hero (Robert's choice). Reduced motion: static curves, no text animation.
- **Signature element:** the hero's commercial chain: five steps (brand strategy → segmentation and targeting → channel and engagement plan → field execution → performance review) on a solid ink line, with a dashed blue AI layer underneath naming one AI application per step (potential models, next best action, call-note insights, forecasting) and the note "AI where it improves a decision, not everywhere." It shows both practices and how they connect. Desktop: 5-column grid (row 1 steps, row 2 AI, row 3 note). Mobile ≤760px: vertical, step left / AI right per row via `--r`. Only ambient motion on the page: items fade in left to right once in view (IntersectionObserver adds `.is-visible`; the `js` class on `<html>` hides them first, so they stay visible without JS). Respects `prefers-reduced-motion`. Replaced the earlier product-lifecycle curve (Nov 2026).
- Numbered markers only for the Copilot training modules (a real sequence).
- **Copilot training section** (`#copilot-training`): the page's only dark band (`.section--ink`, ink background, light-blue accent `#9DB0FF`) so the offer stands out. Contains intro, "Download the training offer" button (PDF), scoping-call link (`data-topic` preselects "Copilot training" in the form), proof figures (400+ trained, NPS 95+, from Robert's deck), five modules with outcomes, format/included/investment (€3,000 plus VAT, matching the PDF deck). Linked from the nav and from the "AI in commercial" list. **When the deck changes, replace the PDF and update size/page count, modules, figures and price on the page to match.**

## Voice
Personal first-person "I" (I help, I work alongside…). Plain, specific, no hype. British spelling (organisation, prioritised, enquiry). Use "generative AI", not "GenAI". Footer carries a trademark note for Microsoft 365/Copilot and Net Promoter Score.

**Do not invent credentials.** Background copy stays at what Robert has stated: more than twelve years in the pharmaceutical industry, a wide range of commercial roles, deep expertise, and recognised as a leader in commercial excellence (his wording, approved Nov 2026). No employer names, client names, numbers or results unless he supplies them.

## Contact form
FormSubmit AJAX → `formsubmit.co/ajax/robert.anschuetz@rla-solutions.com`. Fields: name, company, email, topic (radio), message. `_subject` "New inquiry from rla-solutions.com", `_template=table`, `_captcha=false`. Spam protection: hidden `_honey` field + 3-second time check (bots get a fake success). Inline status via `#formStatus` (aria-live). The privacy policy mentions FormSubmit and possible non-EU processing.

## Deployment
GitHub is the source of truth. Every push to `main` auto-deploys to **both** Netlify and All-Inkl. **Never push without Robert's go-ahead: it goes live immediately.**

```
                ┌─→ Netlify (rlasolutions.netlify.app), staging mirror, ~30s
git push main →─┤
                └─→ All-Inkl (rla-solutions.com), production, ~60s via GitHub Action FTPS
```

**Repo:** [`RobertAnschuetz/rla-solutions-website`](https://github.com/RobertAnschuetz/rla-solutions-website) (private)

**All-Inkl:** `.github/workflows/deploy-allinkl.yml` syncs via FTPS (`SamKirkland/FTP-Deploy-Action@v4`); the server is mirrored to the repo, so deleted files are deleted live. Secrets: `ALLINKL_HOST`, `ALLINKL_USER`, `ALLINKL_PASSWORD`, `ALLINKL_PATH` (`/rla-solutions.com/`).

## Caching and stale-copy protection
All-Inkl's Apache sends no cache headers by default, so browsers heuristically cached the pre-relaunch site for weeks, separately for each of http/https x www/non-www. `.htaccess` (Apache only, ignored by Netlify) now:
1. **Redirects every variant (301) to `https://rla-solutions.com`** and sends HSTS (1 year, no subdomains, no preload), so there is one cache entry.
2. **Sets cache rules:** `no-cache` for HTML, 1h for CSS/JS, 1 week for images/fonts, `no-cache` for PDF/XML/TXT.
3. **Sends `Clear-Site-Data: "cache"`** on requests only a stale old page makes: unversioned `css/style.css` / `js/main.js` (current pages always use `?v=N`) and removed old assets (portfolio PNGs etc.).

`js/main.js` starts with a self-healing check: if it runs inside old-site markup (`[data-text-rotate]`, `.wa-fab`, `.nav__mobile`, `#backToTop`), it reloads once with `?fresh=<timestamp>` (sessionStorage + URL guard against loops); the new page strips `?fresh=` from the address bar.

**Rules:** when changing `css/style.css` or `js/main.js`, bump the `?v=N` query in all three HTML pages, and never reference them without `?v=` (that would trigger the cache wipe on every visit). Don't reuse the old-site class names above in new markup.

## Open items
- Add specifics to the About section (roles, therapy areas, achievements) once Robert provides them.
- Consider a real booking link (e.g. a calendar tool) for "Book an intro call"; today it scrolls to the contact form.
- Legal pages were translated and updated (DDG instead of TMG; EU ODR platform section removed after its July 2025 shutdown). Have them reviewed if in doubt.
- Old `rla-solutions.de` mapping in KAS and `/rla-solutions.de/` webspace dir are orphaned; safe to delete.
