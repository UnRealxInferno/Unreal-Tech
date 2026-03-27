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

  /* ---------- Contact Form Validation ---------- */
  const form = document.getElementById('contact-form');
  const successMsg = document.getElementById('form-success');
  const formLoadedAt = Date.now();

  if (form) {
    const honeypot = form.querySelector('#website');
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

    form.addEventListener('submit', e => {
      e.preventDefault();

      // Spam checks: honeypot filled or form submitted in under 5 seconds
      if ((honeypot && honeypot.value) || (Date.now() - formLoadedAt < 5000)) {
        // Silently ignore — look like a success to bots
        form.reset();
        if (successMsg) successMsg.hidden = false;
        return;
      }

      const allValid = Object.keys(fields)
        .map(key => validateField(key))
        .every(Boolean);

      if (!allValid) return;

      const submitBtn = form.querySelector('[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';

      const serviceEl = form.querySelector('#service');
      const serviceText = serviceEl && serviceEl.value ? serviceEl.options[serviceEl.selectedIndex].text : '';

      const payload = {
        name:    fields.name.el.value.trim(),
        email:   fields.email.el.value.trim(),
        phone:   (form.querySelector('#phone').value || '').trim(),
        service: serviceText,
        message: fields.message.el.value.trim(),
        website: honeypot ? honeypot.value : '',
        _loaded: formLoadedAt,
      };

      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then(res => {
          if (!res.ok) return res.json().then(d => Promise.reject(d));
          return res.json();
        })
        .then(() => {
          form.reset();
          Object.keys(fields).forEach(key => {
            fields[key].el.classList.remove('invalid');
            fields[key].msg.textContent = '';
          });
          if (successMsg) {
            successMsg.hidden = false;
            successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        })
        .catch(err => {
          const errMsg = (err && err.error) || 'Something went wrong. Please try again.';
          if (successMsg) {
            successMsg.hidden = false;
            successMsg.textContent = errMsg;
            successMsg.style.borderColor = '#f85149';
            successMsg.style.color = '#f85149';
            successMsg.style.background = 'rgba(248,81,73,0.12)';
          }
        })
        .finally(() => {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send Message';
        });
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

})();
