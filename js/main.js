/* ============================================
   RLA Solutions — Main JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // --- Auto-update copyright year in footer ---
  const currentYear = new Date().getFullYear();
  document.querySelectorAll('.js-year').forEach(el => { el.textContent = currentYear; });

  // --- Cursor Glow ---
  const cursorGlow = document.getElementById('cursorGlow');
  if (cursorGlow && window.innerWidth > 768) {
    let mouseX = 0, mouseY = 0, glowX = 0, glowY = 0;
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });
    function animateGlow() {
      glowX += (mouseX - glowX) * 0.08;
      glowY += (mouseY - glowY) * 0.08;
      cursorGlow.style.left = glowX + 'px';
      cursorGlow.style.top = glowY + 'px';
      requestAnimationFrame(animateGlow);
    }
    animateGlow();
  }

  // --- Navbar scroll ---
  const nav = document.getElementById('nav');
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    if (scrollY > 60) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
    lastScroll = scrollY;
  }, { passive: true });

  // --- Mobile menu ---
  const burger = document.getElementById('navBurger');
  const mobileMenu = document.getElementById('navMobile');
  if (burger && mobileMenu) {
    burger.addEventListener('click', () => {
      burger.classList.toggle('active');
      mobileMenu.classList.toggle('open');
      document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
    });
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        burger.classList.remove('active');
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // --- Back-to-top button ---
  // Toggles .visible once the user has scrolled past the hero; smooth-scrolls
  // to top on click. Threshold is half the viewport height so the button
  // reveals around the end of the hero on typical screens.
  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    const toggleBackToTop = () => {
      backToTop.classList.toggle('visible', window.scrollY > window.innerHeight * 0.5);
    };
    window.addEventListener('scroll', toggleBackToTop, { passive: true });
    toggleBackToTop();
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // --- Smooth scroll for anchor links ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // --- Logo + "Start/Home" links: smooth-scroll to top when already on homepage ---
  // href="index.html" reloads when clicked on the homepage; this intercepts that case
  // and smooth-scrolls to top instead — keeping scroll state on refresh would feel jarring.
  document.querySelectorAll('.nav__logo, .footer__logo, .nav__link, .nav__mobile-link').forEach(link => {
    link.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (!href) return;
      // Only intercept links to index.html with no hash
      if (href !== 'index.html') return;
      // Check if we are already on the homepage (last path segment is index.html or empty)
      const path = window.location.pathname;
      const isHomepage = path.endsWith('/index.html') || path.endsWith('/') || path.endsWith('/en/') || path.endsWith('/en');
      if (isHomepage) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });

  // --- Reveal on scroll ---
  // Hero elements get staggered reveal immediately on load
  const heroReveals = document.querySelectorAll('.hero .reveal');
  heroReveals.forEach((el, i) => {
    setTimeout(() => {
      el.classList.add('visible');
    }, 200 + i * 150);
  });

  // All other elements use IntersectionObserver
  const reveals = document.querySelectorAll('.reveal:not(.visible)');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = parseInt(entry.target.dataset.delay) || 0;
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, delay);
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });

  // Small delay to let hero reveals settle, then observe the rest
  setTimeout(() => {
    document.querySelectorAll('.reveal:not(.visible)').forEach(el => revealObserver.observe(el));
  }, 100);

  // --- Counter animation (runs once per element, ever) ---
  const counters = document.querySelectorAll('[data-count]');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;

      // Hard lock: bail out immediately if already started/completed
      if (el.dataset.counted === 'true') {
        counterObserver.unobserve(el);
        return;
      }
      // Set lock BEFORE animating so a rapid re-entry can't double-fire
      el.dataset.counted = 'true';
      counterObserver.unobserve(el);

      const target = parseInt(el.dataset.count, 10);
      if (!Number.isFinite(target)) return;

      const duration = 2000;
      const startTime = performance.now();

      function easeOutExpo(t) {
        return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      }

      function updateCounter(currentTime) {
        // Defensive: if lock was cleared externally, stop animating
        if (el.dataset.counted !== 'true') return;
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutExpo(progress);
        el.textContent = Math.round(easedProgress * target);
        if (progress < 1) {
          requestAnimationFrame(updateCounter);
        } else {
          // Lock the final value in so nothing can overwrite it later
          el.textContent = target;
          el.dataset.counted = 'done';
        }
      }

      requestAnimationFrame(updateCounter);
    });
  }, { threshold: 0.5 });

  counters.forEach(el => counterObserver.observe(el));

  // -----------------------------------------------------------
  // Work carousel — native horizontal scroll + arrow buttons.
  // - Cards scroll via trackpad/mouse-wheel/touch drag
  // - Prev/Next buttons scrollBy() one "page" with smooth behavior
  // - Progress bar reflects track.scrollLeft / scrollable distance
  // - Arrow keys navigate when the track has focus
  // -----------------------------------------------------------
  (function initWorkCarousel() {
    const track = document.querySelector('[data-work-track]');
    if (!track) return;
    const carousel = document.querySelector('.work__carousel');
    const prevBtn = document.querySelector('[data-work-prev]');
    const nextBtn = document.querySelector('[data-work-next]');
    const progress = document.querySelector('[data-work-progress]');
    let rafScheduled = false;

    function getScrollStep() {
      // Scroll by one card + gap per button click
      const card = track.querySelector('.work-card');
      const gap = parseInt(getComputedStyle(track).gap, 10) || 24;
      return card ? card.offsetWidth + gap : 400;
    }

    function update() {
      rafScheduled = false;
      const max = track.scrollWidth - track.clientWidth;
      const p = max > 1 ? Math.max(0, Math.min(1, track.scrollLeft / max)) : 0;
      if (progress) {
        // Scrollbar-thumb: width = visible-to-total ratio; left = scroll progress
        // × remaining space. At start the thumb is already ~30% wide on the
        // left, signalling more content to the right. Capped at 100% so a
        // non-overflowing track still shows a full bar rather than vanishing.
        const visibleRatio = track.scrollWidth > 0
          ? Math.min(1, track.clientWidth / track.scrollWidth)
          : 1;
        progress.style.width = (visibleRatio * 100).toFixed(2) + '%';
        progress.style.left = (p * (1 - visibleRatio) * 100).toFixed(2) + '%';
      }
      const atStart = track.scrollLeft <= 2;
      const atEnd = track.scrollLeft >= max - 2;
      // Arrow state (hide on mobile via CSS; still safe to update)
      if (prevBtn) prevBtn.disabled = atStart;
      if (nextBtn) nextBtn.disabled = atEnd;
      // Hide edge fades at boundaries so first/last card isn't masked
      if (carousel) {
        carousel.toggleAttribute('data-at-start', atStart);
        carousel.toggleAttribute('data-at-end', atEnd);
      }
    }

    function scheduleUpdate() {
      if (!rafScheduled) {
        rafScheduled = true;
        requestAnimationFrame(update);
      }
    }

    track.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate, { passive: true });

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        track.scrollBy({ left: -getScrollStep(), behavior: 'smooth' });
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        track.scrollBy({ left: getScrollStep(), behavior: 'smooth' });
      });
    }

    // Keyboard: left/right arrows advance one card when track is focused
    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        track.scrollBy({ left: -getScrollStep(), behavior: 'smooth' });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        track.scrollBy({ left: getScrollStep(), behavior: 'smooth' });
      }
    });

    // Initial state
    update();
  })();

  // --- FAQ Accordion ---
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const trigger = item.querySelector('.faq-item__trigger');
    const content = item.querySelector('.faq-item__content');

    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      // Close all others
      faqItems.forEach(other => {
        if (other !== item) {
          other.classList.remove('open');
          other.querySelector('.faq-item__content').style.maxHeight = '0';
        }
      });

      // Toggle current
      if (isOpen) {
        item.classList.remove('open');
        content.style.maxHeight = '0';
      } else {
        item.classList.add('open');
        content.style.maxHeight = content.scrollHeight + 'px';
      }
    });
  });

  // --- Contact form handling ---
  // Submits via fetch() to the form's `action` URL (FormSubmit's AJAX endpoint).
  // No page redirect — the user stays on the page and sees an inline success
  // state on the submit button.
  //
  // Spam guards (zero-friction):
  //   1. Honeypot — `<input name="_honey">` is hidden from humans via CSS but
  //      bots blindly fill every text field. Any value = bot. FormSubmit also
  //      checks `_honey` server-side as a second layer.
  //   2. Time check — humans take longer than 3s to read + fill the form;
  //      a sub-3s submit is almost certainly a script.
  // Both fail silently so bots don't learn what tripped them.
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    const formLoadedAt = Date.now();

    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const honeypot = contactForm.querySelector('input[name="_honey"]');
      if ((honeypot && honeypot.value) || Date.now() - formLoadedAt < 3000) {
        return; // silent drop
      }
      const btn = contactForm.querySelector('button[type="submit"]');
      const originalHTML = btn.innerHTML;
      const isDE = document.documentElement.lang === 'de';

      // Sending state
      btn.innerHTML = isDE ? '<span>Wird gesendet...</span>' : '<span>Sending...</span>';
      btn.disabled = true;

      const restoreButton = () => {
        btn.innerHTML = originalHTML;
        btn.disabled = false;
        btn.style.background = '';
        btn.style.boxShadow = '';
      };

      try {
        const response = await fetch(contactForm.action, {
          method: 'POST',
          body: new FormData(contactForm),
          headers: { 'Accept': 'application/json' }
        });
        if (!response.ok) throw new Error('HTTP ' + response.status);

        // Success state
        btn.innerHTML = isDE
          ? '<span>Gesendet! Ich melde mich.</span>'
          : "<span>Sent! I'll be in touch.</span>";
        btn.style.background = 'var(--success)';
        btn.style.boxShadow = '0 4px 20px rgba(16, 185, 129, 0.25)';
        contactForm.reset();
        setTimeout(restoreButton, 4000);
      } catch (err) {
        // Failure state — keep error visible a bit longer than success
        btn.innerHTML = isDE
          ? '<span>Senden fehlgeschlagen. Bitte später erneut versuchen.</span>'
          : '<span>Failed to send. Please try again later.</span>';
        btn.style.background = 'var(--primary)';
        btn.style.boxShadow = '0 4px 20px rgba(220, 38, 38, 0.25)';
        setTimeout(restoreButton, 5000);
      }
    });
  }

  // --- Active nav link on scroll ---
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav__link');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 120;
      if (window.scrollY >= sectionTop) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + current) {
        link.classList.add('active');
      }
    });
  }, { passive: true });

  // -----------------------------------------------------------
  // Rotating headline word (hero)
  // -----------------------------------------------------------
  class TextRotator {
    static cssDurationMs(style, varName, fallback) {
      const raw = style.getPropertyValue(varName).trim();
      if (!raw) return fallback;
      const num = parseFloat(raw);
      if (Number.isNaN(num)) return fallback;
      return raw.endsWith('ms') ? num : num * 1000;
    }

    constructor(element) {
      this.el = element;
      this.words = (element.dataset.words || '').split(',').map(w => w.trim()).filter(Boolean);
      if (this.words.length < 2) return;

      this.interval = parseInt(element.dataset.interval, 10) || 5600;
      this.stagger = parseInt(element.dataset.stagger, 10) || 35;
      this.startDelay = parseInt(element.dataset.startDelay, 10) || 1600;
      // Read durations from CSS tokens so keyframes and JS scheduling stay
      // in sync. Fallback to literals if the CSS vars are ever removed.
      const rootStyle = getComputedStyle(document.documentElement);
      this.enterDuration = TextRotator.cssDurationMs(rootStyle, '--rotator-enter-duration', 650);
      this.exitDuration = TextRotator.cssDurationMs(rootStyle, '--rotator-exit-duration', 400);
      this.index = 0;
      this.widths = [];

      this.measure();
      this.render(this.words[0], false);
      this.el.style.width = this.widths[0] + 'px';

      // Re-measure once fonts have loaded (prevents clipping when fallback font was narrower)
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          this.measure();
          this.el.style.width = this.widths[this.index] + 'px';
        });
      }

      this._timeoutId = setTimeout(() => {
        this._intervalId = setInterval(() => this.next(), this.interval);
      }, this.startDelay);

      window.addEventListener('resize', () => {
        this.measure();
        this.el.style.width = this.widths[this.index] + 'px';
      }, { passive: true });
    }

    measure() {
      // Clone the actual element to measure with identical inherited styles and char structure
      const clone = this.el.cloneNode(false);
      clone.style.cssText = 'position:absolute;visibility:hidden;top:-9999px;left:-9999px;width:auto;transition:none;';
      this.el.parentNode.insertBefore(clone, this.el);
      this.widths = this.words.map(word => {
        clone.innerHTML = '';
        const graphemes = typeof Intl !== 'undefined' && Intl.Segmenter
          ? Array.from(new Intl.Segmenter().segment(word), s => s.segment)
          : Array.from(word);
        graphemes.forEach(char => {
          const span = document.createElement('span');
          span.className = 'rotating-word__char';
          span.textContent = char === ' ' ? '\u00A0' : char;
          clone.appendChild(span);
        });
        return Math.ceil(clone.offsetWidth) + 24;
      });
      clone.remove();
    }

    // Overlap exit/enter so the container is never visually empty.
    // Old chars animate up & out while new chars arrive from below at the same time.
    next() {
      const nextIndex = (this.index + 1) % this.words.length;
      const oldLayer = this.el.querySelector('.rotating-word__layer');
      const oldChars = oldLayer ? oldLayer.querySelectorAll('.rotating-word__char') : [];

      // Step 1 — pin old layer in place so it can exit without affecting flow
      if (oldLayer) {
        oldLayer.classList.add('is-leaving');
        oldChars.forEach((char, i) => {
          char.classList.remove('is-enter');
          char.style.animationDelay = (i * this.stagger) + 'ms';
          char.classList.add('is-exit');
        });
      }

      // Step 2 — immediately add the new layer so its chars start entering now
      const newLayer = this.createLayer(this.words[nextIndex], true);
      this.el.appendChild(newLayer);

      // Step 3 — size container to new word
      this.el.style.width = this.widths[nextIndex] + 'px';
      this.index = nextIndex;

      // Step 4 — remove old layer once its exit animation finishes
      const exitTotalMs = this.exitDuration + (oldChars.length * this.stagger) + 60;
      setTimeout(() => {
        if (oldLayer && oldLayer.parentNode) oldLayer.remove();
      }, exitTotalMs);
    }

    createLayer(word, animate) {
      const layer = document.createElement('span');
      layer.className = 'rotating-word__layer';
      const graphemes = typeof Intl !== 'undefined' && Intl.Segmenter
        ? Array.from(new Intl.Segmenter().segment(word), s => s.segment)
        : Array.from(word);
      graphemes.forEach((char, i) => {
        const span = document.createElement('span');
        span.className = 'rotating-word__char';
        // Preserve space width inside inline-block spans
        span.textContent = char === ' ' ? '\u00A0' : char;
        if (animate) {
          const delay = i * this.stagger;
          span.style.animationDelay = delay + 'ms';
          span.classList.add('is-enter');
          // Drop the class (and its `will-change`) once the enter animation
          // finishes, so the steady-state letter no longer sits on a GPU
          // compositing layer — that layer's raster would clip italic glyph
          // overhang (ascender peaks, slant) at its box edges. A scheduled
          // timeout is more reliable than animationend here (the layer may
          // be removed before the event fires on slower devices).
          setTimeout(() => {
            span.classList.remove('is-enter');
          }, delay + this.enterDuration + 80);
        }
        layer.appendChild(span);
      });
      return layer;
    }

    render(word, animate) {
      this.el.innerHTML = '';
      this.el.appendChild(this.createLayer(word, animate));
    }
  }

  document.querySelectorAll('[data-text-rotate]').forEach(el => new TextRotator(el));

});
