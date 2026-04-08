/* script.js – Unreal Tech interactive behaviours */

(() => {
  'use strict';

  /* ---------- Mobile Nav ---------- */
  const toggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });

    // Close when a link is clicked
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });

    // Close on outside click
    document.addEventListener('click', e => {
      if (!toggle.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- Back to Top ---------- */
  const backToTop = document.querySelector('.back-to-top');
  if (backToTop) {
    const handleScroll = () => {
      backToTop.classList.toggle('visible', window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  /* ---------- Footer Year ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Contact Form ---------- */
  const form = document.getElementById('contact-form');
  const successMsg = document.getElementById('form-success');
  const errorMsg = document.getElementById('form-error');

  // Record when the page/form loaded (timing spam check)
  const loadedAtEl = document.getElementById('_form_loaded_at');
  if (loadedAtEl) loadedAtEl.value = Date.now();

  if (form) {
    const fields = {
      name:    { el: form.querySelector('#name'),    msg: form.querySelector('#name + .field-error'),    validate: v => v.trim().length >= 2 ? '' : 'Please enter your full name.' },
      email:   { el: form.querySelector('#email'),   msg: form.querySelector('#email + .field-error'),   validate: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Please enter a valid email address.' },
      message: { el: form.querySelector('#message'), msg: form.querySelector('#message + .field-error'), validate: v => v.trim().length >= 10 ? '' : 'Please enter a message (at least 10 characters).' },
    };

    const validateField = key => {
      const { el, msg, validate } = fields[key];
      const error = validate(el.value);
      msg.textContent = error;
      el.classList.toggle('invalid', Boolean(error));
      return !error;
    };

    // Live validation on blur
    Object.keys(fields).forEach(key => {
      fields[key].el.addEventListener('blur', () => validateField(key));
      fields[key].el.addEventListener('input', () => {
        if (fields[key].el.classList.contains('invalid')) validateField(key);
      });
    });

    form.addEventListener('submit', async e => {
      e.preventDefault();

      // Client-side timing check (bots submit instantly)
      const loadedAt = Number(loadedAtEl ? loadedAtEl.value : 0);
      if (loadedAt && Date.now() - loadedAt < 3000) return;

      const allValid = Object.keys(fields)
        .map(key => validateField(key))
        .every(Boolean);

      if (!allValid) return;

      // Check hCaptcha token is present
      const captchaErrEl = document.getElementById('captcha-error');
      const formData = new FormData(form);
      const captchaToken = formData.get('h-captcha-response');
      if (!captchaToken) {
        if (captchaErrEl) captchaErrEl.textContent = 'Please complete the CAPTCHA.';
        return;
      }
      if (captchaErrEl) captchaErrEl.textContent = '';

      const submitBtn = form.querySelector('[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';
      if (successMsg) successMsg.hidden = true;
      if (errorMsg) errorMsg.hidden = true;

      try {
        const response = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: formData,
        });
        const data = await response.json();

        if (data.success) {
          form.reset();
          Object.keys(fields).forEach(key => {
            fields[key].el.classList.remove('invalid');
            fields[key].msg.textContent = '';
          });
          // Re-stamp load time after reset
          if (loadedAtEl) loadedAtEl.value = Date.now();
          if (successMsg) {
            successMsg.hidden = false;
            successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        } else {
          if (errorMsg) errorMsg.hidden = false;
        }
      } catch {
        if (errorMsg) errorMsg.hidden = false;
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';
      }
    });
  }

  /* ---------- Scroll Reveal ---------- */
  if ('IntersectionObserver' in window) {
    const style = document.createElement('style');
    style.textContent = `
      .reveal { opacity: 0; transform: translateY(28px); transition: opacity 0.55s ease, transform 0.55s ease; }
      .reveal.in-view { opacity: 1; transform: none; }
    `;
    document.head.appendChild(style);

    const revealTargets = [
      ...document.querySelectorAll('.service-card'),
      ...document.querySelectorAll('.feature'),
      ...document.querySelectorAll('.about-text'),
      ...document.querySelectorAll('.contact-form'),
      ...document.querySelectorAll('.contact-info'),
      ...document.querySelectorAll('.hero-stats'),
    ];

    revealTargets.forEach((el, i) => {
      el.classList.add('reveal');
      el.style.transitionDelay = `${(i % 6) * 0.07}s`;
    });

    const observer = new IntersectionObserver(
      entries => entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      }),
      { threshold: 0.12 }
    );

    revealTargets.forEach(el => observer.observe(el));
  }

  /* ---------- FAQ Accordion ---------- */
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(el => el.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });

})();
