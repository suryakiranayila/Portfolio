document.addEventListener('DOMContentLoaded', () => {
  const CONTACT_ENDPOINT = '/.netlify/functions/contact';
  const NAV_HIDE_OFFSET = 50;
  const SCROLL_DEBOUNCE_MS = 50;
  const q = (selector, root = document) => root.querySelector(selector);
  const qa = (selector, root = document) => Array.from((root || document).querySelectorAll(selector));
  const debounce = (fn, wait) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  };
  const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  (function setActiveNavLink() {
    const navLinks = qa('.nav-links a');
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    navLinks.forEach(link => {
      link.classList.remove('active');
      const href = link.getAttribute('href') || '';
      const linkPath = href.split('/').pop().split('?')[0].split('#')[0];

      if (linkPath === currentPath || (currentPath === '' && linkPath === 'index.html')) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  })();
  (function navShowHideOnScroll() {
    const navbar = q('.navbar');
    if (!navbar) return;
    let lastScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    let lastDirection = null;
    const onScroll = () => {
      const st = window.pageYOffset || document.documentElement.scrollTop;
      const direction = st > lastScrollTop ? 'down' : 'up';
      if (Math.abs(st - lastScrollTop) < NAV_HIDE_OFFSET) {
        lastScrollTop = st <= 0 ? 0 : st;
        return;
      }
      if (direction === 'down' && lastDirection !== 'down') {
        navbar.style.transform = 'translateY(-110%)';
        navbar.setAttribute('data-hidden', 'true');
      } else if (direction === 'up' && lastDirection !== 'up') {
        navbar.style.transform = 'translateY(0)';
        navbar.removeAttribute('data-hidden');
      }
      lastDirection = direction;
      lastScrollTop = st <= 0 ? 0 : st;
    };
    if (!navbar.style.transition) navbar.style.transition = 'transform 220ms ease';
    window.addEventListener('scroll', debounce(onScroll, SCROLL_DEBOUNCE_MS), { passive: true });
  })();
  (function projectFiltering() {
    const filterButtons = qa('.filter-btn');
    if (!filterButtons.length) return;
    const projectCards = qa('.project-card');
    projectCards.forEach(card => {
      if (!card.style.display) card.style.display = getComputedStyle(card).display || 'flex';
    });
    const setFilter = (filter) => {
      projectCards.forEach(card => {
        const category = card.dataset.category || 'uncategorized';
        const shouldShow = filter === 'all' || category === filter;
        if (shouldShow) {
          card.style.display = card.dataset._display || 'flex';
          card.classList.remove('hidden');
          card.setAttribute('aria-hidden', 'false');
        } else {
          if (!card.dataset._display) card.dataset._display = card.style.display || 'flex';
          card.style.display = 'none';
          card.classList.add('hidden');
          card.setAttribute('aria-hidden', 'true');
        }
      });
    };
    filterButtons.forEach(btn => {
      btn.setAttribute('role', 'button');
      if (!btn.hasAttribute('tabindex')) btn.setAttribute('tabindex', '0');
      const clickHandler = () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter || 'all';
        setFilter(filter);
      };
      btn.addEventListener('click', clickHandler);
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          clickHandler();
        }
      });
    });
    const activeBtn = filterButtons.find(b => b.classList.contains('active')) || filterButtons[0];
    if (activeBtn) {
      const initialFilter = activeBtn.dataset.filter || 'all';
      setFilter(initialFilter);
      activeBtn.classList.add('active');
    }
  })();
  (function contactFormHandler() {
    const form = q('#contactForm');
    if (!form) return;
    let live = q('#form-live-region');
    if (!live) {
      live = document.createElement('div');
      live.id = 'form-live-region';
      live.setAttribute('aria-live', 'polite');
      live.setAttribute('aria-atomic', 'true');
      live.style.position = 'absolute';
      live.style.left = '-9999px';
      live.style.width = '1px';
      live.style.height = '1px';
      live.style.overflow = 'hidden';
      document.body.appendChild(live);
    }
    const submitButton = form.querySelector('button[type="submit"]');
    const setFormState = (isSending) => {
      if (submitButton) {
        submitButton.disabled = !!isSending;
        submitButton.setAttribute('aria-busy', isSending ? 'true' : 'false');
        submitButton.textContent = isSending ? 'Sending...' : 'Send Message';
      }
    };
    const showMessage = (message, isError = false) => {
      let msgEl = q('#contact-msg');
      if (!msgEl) {
        msgEl = document.createElement('div');
        msgEl.id = 'contact-msg';
        msgEl.setAttribute('role', 'status');
        msgEl.style.marginTop = '1rem';
        form.parentNode.insertBefore(msgEl, form.nextSibling);
      }
      msgEl.textContent = message;
      msgEl.style.color = isError ? '#b00020' : '#0a7a07';
      live.textContent = message;
    };
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const name = (formData.get('name') || '').trim();
      const email = (formData.get('email') || '').trim();
      const message = (formData.get('message') || '').trim();
      if (!name || !email || !message) {
        showMessage('Please complete all required fields.', true);
        return;
      }
      if (!isEmail(email)) {
        showMessage('Please enter a valid email address.', true);
        return;
      }
      const payload = {
        name,
        email,
        message
      };
      setFormState(true);
      showMessage('Sending message...');
      try {
        const res = await fetch(CONTACT_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          mode: 'cors'
        });
        if (!res.ok) {
          let errorText = 'Error sending message.';
          try { const json = await res.json(); if (json?.error) errorText = json.error; } catch (err) { /* ignore */ }
          throw new Error(errorText);
        }
        showMessage('Message sent — thank you! I will get back to you soon.');
        form.reset();
      } catch (err) {
        console.error('Contact form error:', err);
        showMessage('Unable to send message right now. Please try again later or email directly to suryakiranaeila@gmail.com', true);
      } finally {
        setFormState(false);
      }
    });
  })();
  (function addSkipLink() {
    if (!q('a.skip-link')) {
      const skip = document.createElement('a');
      skip.href = '#main';
      skip.className = 'skip-link';
      skip.textContent = 'Skip to content';
      skip.style.position = 'absolute';
      skip.style.left = '-999px';
      skip.style.top = 'auto';
      skip.style.height = '1px';
      skip.style.width = '1px';
      skip.style.overflow = 'hidden';
      document.body.insertBefore(skip, document.body.firstChild);
    }
  })();
});