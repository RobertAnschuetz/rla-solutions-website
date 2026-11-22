/* RLA Solutions: header state, mobile menu, contact form. */
(() => {
  'use strict';

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
