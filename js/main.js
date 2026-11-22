/* RLA Solutions: header state, mobile menu, contact form. */
(() => {
  'use strict';

  // Self-healing for stale browser caches. A cached copy of the pre-relaunch
  // site still requests js/main.js, so it receives this script. If the page
  // carries old-site markup, fetch the page fresh once (unique query = no cache).
  const isLegacyPage = document.querySelector('[data-text-rotate], .wa-fab, .nav__mobile, #backToTop');
  if (isLegacyPage) {
    let alreadyTried = false;
    try {
      alreadyTried = sessionStorage.getItem('rla-refresh') === '1';
      sessionStorage.setItem('rla-refresh', '1');
    } catch (e) { /* storage blocked: the URL check below still prevents loops */ }
    if (!alreadyTried && !/[?&]fresh=/.test(location.search)) {
      location.replace(location.pathname + '?fresh=' + Date.now() + location.hash);
    }
    return;
  }
  // Fresh page loaded: tidy the address bar
  if (/[?&]fresh=/.test(location.search)) {
    try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) { /* ignore */ }
  }

  // Header border once the page scrolls
  const header = document.querySelector('.header');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Mobile menu
  const toggle = document.querySelector('.nav__toggle');
  const list = document.getElementById('navList');
  if (toggle && list) {
    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      list.classList.toggle('is-open', open);
      document.body.classList.toggle('menu-open', open);
    };
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    list.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && list.classList.contains('is-open')) { setOpen(false); toggle.focus(); }
    });
    window.matchMedia('(min-width: 861px)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });
  }

  // Hero background: flowing "uptake" curves (low plateau, long gentle S, high
  // plateau), drawn in the hero's real pixel size so they never stretch. They
  // occupy the band from the top of the hero to just below the headline.
  const pathsSvg = document.getElementById('heroPaths');
  if (pathsSvg) {
    const box = pathsSvg.parentElement;
    const hero = box.parentElement;
    const title = hero.querySelector('.hero__title');
    const N = 34;
    const drawPaths = () => {
      if (title) {
        box.style.height = Math.round(title.getBoundingClientRect().bottom - hero.getBoundingClientRect().top + 48) + 'px';
      }
      const W = box.clientWidth, H = box.clientHeight;
      if (!W || !H) return;
      pathsSvg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      const narrow = W < 860;
      let out = '';
      for (let i = 0; i < N; i++) {
        const t = i / (N - 1);
        const y0 = H * 1.00 - t * H * 0.34;                     // start height
        const y1 = H * 0.42 - t * H * 0.40;                     // end height
        const xs = W * (narrow ? 0.00 : 0.16) + t * W * 0.22;   // where the rise begins
        const c1 = xs + W * (narrow ? 0.35 : 0.24);
        const c2 = xs + W * (narrow ? 0.85 : 0.56);
        const d = 'M-20 ' + y0.toFixed(1) + ' L' + xs.toFixed(1) + ' ' + y0.toFixed(1) +
                  ' C' + c1.toFixed(1) + ' ' + y0.toFixed(1) + ', ' + c1.toFixed(1) + ' ' + y1.toFixed(1) + ', ' + c2.toFixed(1) + ' ' + y1.toFixed(1) +
                  ' L' + (W + 20) + ' ' + (y1 - H * 0.02).toFixed(1);
        const accent = i === Math.round(N * 0.62);
        const opacity = accent ? 0.55 : (0.05 + 0.15 * Math.sin(Math.PI * t)).toFixed(3);
        const width = accent ? 1.6 : (0.8 + 0.6 * t).toFixed(2);
        out += '<path pathLength="1" d="' + d + '" stroke-opacity="' + opacity + '" stroke-width="' + width + '"' +
               (accent ? ' class="is-accent"' : '') +
               ' style="--dur:' + (14 + (i % 7) * 2.5) + 's; --delay:-' + (i * 1.3).toFixed(1) + 's"/>';
      }
      pathsSvg.innerHTML = out;
    };
    drawPaths();
    let resizeTimer;
    let lastWidth = window.innerWidth;
    window.addEventListener('resize', () => {
      // Ignore height-only changes (mobile address bar) to avoid redraw jitter
      if (window.innerWidth === lastWidth) return;
      lastWidth = window.innerWidth;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(drawPaths, 150);
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawPaths);
  }

  // Hero chain: reveal once when it enters the viewport
  const chain = document.querySelector('.chain');
  if (chain) {
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          chain.classList.add('is-visible');
          io.disconnect();
        }
      }, { threshold: 0.3 });
      io.observe(chain);
    } else {
      chain.classList.add('is-visible');
    }
  }

  // Links with data-topic (e.g. "Book a scoping call") preselect the form topic
  document.querySelectorAll('a[data-topic]').forEach((a) => {
    a.addEventListener('click', () => {
      const radio = document.querySelector('input[name="topic"][value="' + a.dataset.topic + '"]');
      if (radio) radio.checked = true;
    });
  });

  // Current year in footer
  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  // Contact form: FormSubmit AJAX with honeypot + 3-second time check
  const form = document.getElementById('contactForm');
  if (!form) return;

  const status = document.getElementById('formStatus');
  const button = form.querySelector('button[type="submit"]');
  const loadedAt = Date.now();

  const setStatus = (text, type) => {
    status.textContent = text;
    status.classList.toggle('is-error', type === 'error');
    status.classList.toggle('is-success', type === 'success');
  };

  const required = Array.from(form.querySelectorAll('[required]'));
  required.forEach((el) => el.addEventListener('input', () => el.removeAttribute('aria-invalid')));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const invalid = required.filter((el) => !el.checkValidity());
    required.forEach((el) => {
      if (invalid.includes(el)) el.setAttribute('aria-invalid', 'true');
      else el.removeAttribute('aria-invalid');
    });
    if (invalid.length) {
      const emailBad = invalid.some((el) => el.type === 'email' && el.value.trim());
      setStatus(emailBad ? 'Please enter a valid email address.' : 'Please fill in your name, email and question.', 'error');
      invalid[0].focus();
      return;
    }

    // Bots: fill the hidden field or submit instantly. Pretend success, send nothing.
    const honey = form.querySelector('input[name="_honey"]');
    if ((honey && honey.value) || Date.now() - loadedAt < 3000) {
      form.reset();
      setStatus('Thank you. Your message has been sent. I will reply within one business day.', 'success');
      return;
    }

    button.disabled = true;
    button.textContent = 'Sending…';
    setStatus('', null);

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || String(data.success) === 'false') throw new Error(data.message || res.statusText);
      form.reset();
      setStatus('Thank you. Your message has been sent. I will reply within one business day.', 'success');
      button.textContent = 'Message sent';
    } catch (err) {
      setStatus('The message could not be sent. Please try again or email robert.anschuetz@rla-solutions.com directly.', 'error');
      button.textContent = 'Send message';
    } finally {
      button.disabled = false;
      if (button.textContent === 'Message sent') {
        setTimeout(() => { button.textContent = 'Send message'; }, 4000);
      }
    }
  });
})();
