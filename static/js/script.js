/* ══════════════════════════════════════════════════
   JAUNDICE DETECTION AI — MASTER SCRIPT
   Works across all pages; each block guards itself
   with null-checks so it's safe to include everywhere.
══════════════════════════════════════════════════ */

/* ─── PAGE LOADER ───────────────────────────────── */
(function initSiteLoader() {
  const loader = document.createElement('div');
  loader.className = 'site-loader show';
  loader.setAttribute('aria-live', 'polite');
  loader.innerHTML = `
    <div class="loader-card" role="status">
      <div class="loader-mark" aria-hidden="true"></div>
      <div class="loader-text">
        <span id="loaderMessage">Preparing JaundiceAI</span>
        <small>Keeping things smooth</small>
      </div>
    </div>
  `;
  document.body.prepend(loader);

  const message = loader.querySelector('#loaderMessage');
  const startedAt = performance.now();

  window.showSiteLoader = function (text = 'Loading') {
    if (message) message.textContent = text;
    loader.classList.add('show');
  };

  window.hideSiteLoader = function () {
    loader.classList.remove('show');
  };

  window.addEventListener('load', () => {
    const remaining = Math.max(0, 420 - (performance.now() - startedAt));
    setTimeout(window.hideSiteLoader, remaining);
  });

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link || event.defaultPrevented) return;

    const href = link.getAttribute('href');
    const target = link.getAttribute('target');
    if (!href || href.startsWith('#') || target === '_blank') return;

    try {
      const url = new URL(href, window.location.href);
      if (url.origin === window.location.origin) {
        window.showSiteLoader('Opening page');
      }
    } catch {
      window.showSiteLoader('Opening page');
    }
  });
})();

/* ─── CUSTOM CURSOR ─────────────────────────────── */
document.body.classList.add('cursor-ready');

/* ─── ENTER-TO-NEXT FORM FLOW ───────────────────── */
(function initEnterKeyFormFlow() {
  const fieldSelector = [
    'input:not([type="hidden"]):not([type="button"]):not([type="submit"])',
    'select',
    'textarea',
  ].join(',');

  function isUsableField(field) {
    return (
      !field.disabled &&
      !field.readOnly &&
      field.offsetParent !== null &&
      field.type !== 'checkbox' &&
      field.type !== 'radio' &&
      field.type !== 'file'
    );
  }

  function focusNextField(currentField) {
    const form = currentField.form;
    if (!form) return false;

    const fields = Array.from(form.querySelectorAll(fieldSelector)).filter(
      isUsableField
    );
    const currentIndex = fields.indexOf(currentField);

    if (currentIndex === -1) return false;

    if (currentIndex < fields.length - 1) {
      const nextField = fields[currentIndex + 1];
      nextField.focus();
      if (typeof nextField.select === 'function') nextField.select();
      return true;
    }

    const submitter =
      form.querySelector('[data-enter-submit]') ||
      form.querySelector('button[type="submit"]') ||
      form.querySelector('.btn-primary.full');

    if (submitter) {
      submitter.click();
    } else if (typeof form.requestSubmit === 'function') {
      form.requestSubmit();
    }

    return true;
  }

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return;
    if (event.target instanceof HTMLTextAreaElement) return;
    if (!(event.target instanceof HTMLElement)) return;
    if (!event.target.matches(fieldSelector)) return;

    if (focusNextField(event.target)) {
      event.preventDefault();
    }
  });
})();

/* ─── REVEAL-ON-SCROLL ──────────────────────────── */
(function initReveal() {
  const targets = document.querySelectorAll('.reveal-up, .reveal-soft');
  if (!targets.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  targets.forEach((el) => io.observe(el));
})();

/* ─── BUTTON RADIAL LIGHT EFFECT ────────────────── */
document.querySelectorAll('.btn-primary').forEach((btn) => {
  btn.addEventListener('mousemove', (e) => {
    const r = btn.getBoundingClientRect();
    btn.style.setProperty('--mx', `${e.clientX - r.left}px`);
    btn.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
});

/* ─── PROFILE DROPDOWN ──────────────────────────── */
function hasStoredAccount() {
  return Boolean(
    localStorage.getItem('userEmail') ||
      localStorage.getItem('userName') ||
      localStorage.getItem('accountProfile')
  );
}

function ensureHistoryNavItem(nav) {
  let item = nav.querySelector('.history-nav-item');

  if (!item) {
    item = document.createElement('li');
    item.className = 'history-nav-item';
    item.innerHTML = '<a href="/history">History</a>';
    nav.appendChild(item);
  }

  item
    .querySelector('a')
    ?.classList.toggle('active', window.location.pathname.endsWith('/history'));

  return item;
}

window.setLoggedInUI = function (isLoggedIn) {
  document.querySelectorAll('.profile-wrapper').forEach((wrapper) => {
    wrapper.hidden = !isLoggedIn;
    wrapper.classList.toggle('is-hidden', !isLoggedIn);
  });

  document.querySelectorAll('.nav-links').forEach((nav) => {
    const historyItem = ensureHistoryNavItem(nav);
    historyItem.hidden = !isLoggedIn;
    historyItem.classList.toggle('is-hidden', !isLoggedIn);
  });

  document.querySelectorAll('.auth-cta').forEach((button) => {
    const label = isLoggedIn
      ? button.dataset.authLabel
      : button.dataset.guestLabel;
    const icon = isLoggedIn ? button.dataset.authIcon : button.dataset.guestIcon;
    const href = isLoggedIn ? button.dataset.authHref : button.dataset.guestHref;

    button.dataset.currentHref = href || '/login';

    const labelEl = button.querySelector('.cta-label');
    const iconEl = button.querySelector('.material-icons');
    if (labelEl && label) labelEl.textContent = label;
    if (iconEl && icon) iconEl.textContent = icon;
  });
};

window.setAccountMenuVisible = window.setLoggedInUI;
window.setLoggedInUI(hasStoredAccount());

document.querySelectorAll('.auth-cta').forEach((button) => {
  button.addEventListener('click', () => {
    window.location.href =
      button.dataset.currentHref ||
      (hasStoredAccount() ? button.dataset.authHref : button.dataset.guestHref) ||
      '/login';
  });
});

(function initProfileMenu() {
  const toggle = document.getElementById('profileToggle');
  const menu   = document.getElementById('profileMenu');
  if (!toggle || !menu) return;

  const wrapper = toggle.closest('.profile-wrapper');

  toggle.setAttribute('aria-haspopup', 'menu');
  toggle.setAttribute('aria-expanded', 'false');

  function closeMenu() {
    menu.classList.remove('show');
    wrapper?.classList.remove('menu-open');
    toggle.setAttribute('aria-expanded', 'false');
  }

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = menu.classList.toggle('show');
    wrapper?.classList.toggle('menu-open', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  menu.addEventListener('click', (e) => e.stopPropagation());

  menu.querySelectorAll('a[href]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href || href === '#') return;

      e.preventDefault();
      window.location.href = href;
    });
  });

  document.addEventListener('click', closeMenu);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
})();

/* ─── LOGIN CARD 3-D TILT ────────────────────────── */
(function initLoginTilt() {
  const card = document.querySelector('.login-card');
  if (!card) return;

  card.addEventListener('mousemove', (e) => {
    const { left, top, width, height } = card.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;
    const rY =  ((x - width  / 2) / (width  / 2)) * 2.5;
    const rX = -((y - height / 2) / (height / 2)) * 2.5;
    card.style.setProperty('--rotateX', `${rX}deg`);
    card.style.setProperty('--rotateY', `${rY}deg`);
    card.style.setProperty('--moveZ',   '8px');
  });

  card.addEventListener('mouseleave', () => {
    clearTimeout(card._tiltTimer);
    card._tiltTimer = setTimeout(() => {
      card.style.setProperty('--rotateX', '0deg');
      card.style.setProperty('--rotateY', '0deg');
      card.style.setProperty('--moveZ',   '0px');
    }, 80);
  });
})();

/* ─── MULTI-IMAGE UPLOAD ─────────────────────────── */
(function initUpload() {
  const input   = document.getElementById('imageInput');
  const preview = document.getElementById('uploadPreview');
  if (!input || !preview) return;

  let selectedFiles = [];
  // Expose globally so uploadImage() can access
  window._selectedFiles = selectedFiles;

  input.addEventListener('change', () => {
    Array.from(input.files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      selectedFiles.push(file);

      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.onload = () => URL.revokeObjectURL(img.src);
      preview.appendChild(img);
    });
    input.value = '';
  });
})();

/* ─── UPLOAD → BACKEND ───────────────────────────── */
window.uploadImage = function () {
  const errorMsg = document.getElementById('errorMsg');
  const uploadBtn = document.querySelector('.upload-form .btn-primary');
  if (!errorMsg) return;
  errorMsg.style.display = 'none';

  const files = window._selectedFiles || [];
  if (files.length === 0) {
    errorMsg.style.display = 'block';
    return;
  }

  function readImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function historyKey() {
    const user =
      localStorage.getItem('userEmail') ||
      localStorage.getItem('userName') ||
      'local';

    return `screeningHistory:${user.toLowerCase()}`;
  }

  function saveHistoryEntry(result, image) {
    const key = historyKey();
    let history = [];

    try {
      history = JSON.parse(localStorage.getItem(key)) || [];
    } catch {
      history = [];
    }

    const entry = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      createdAt: new Date().toISOString(),
      image,
      result,
      prediction: result?.prediction || 'Unknown Result',
      confidence:
        result?.confidence ?? result?.confidence_score ?? result?.probability ?? null,
    };

    history.unshift(entry);

    try {
      localStorage.setItem(key, JSON.stringify(history.slice(0, 24)));
    } catch {
      try {
        localStorage.setItem(key, JSON.stringify(history.slice(0, 8)));
      } catch {
        // History is a convenience feature; analysis should still complete.
      }
    }
  }

  const formData = new FormData();
  files.forEach((f) => formData.append('images', f));

  if (uploadBtn) {
    uploadBtn.classList.add('btn-loading');
    uploadBtn.disabled = true;
    uploadBtn.dataset.originalText = uploadBtn.textContent.trim();
    uploadBtn.innerHTML =
      '<span class="material-icons" style="font-size: 18px">autorenew</span>Analysing Image';
  }
  window.showSiteLoader?.('Analysing image');

  readImage(files[0])
    .then((image) => {
      localStorage.setItem('uploadedImage', image);

      return fetch('/predict', {
        method: 'POST',
        body: formData,
      }).then((res) =>
        res.json().then((data) => {
          localStorage.setItem('predictionResult', JSON.stringify(data));
          saveHistoryEntry(data, image);
        })
      );
    })
    .then(() => {
      window.location.href = '/result';
    })
    .catch(() => {
      window.hideSiteLoader?.();
      if (uploadBtn) {
        uploadBtn.classList.remove('btn-loading');
        uploadBtn.disabled = false;
        uploadBtn.innerHTML =
          '<span class="material-icons" style="font-size: 18px">biotech</span>Analyse Image';
      }
      errorMsg.innerText =
        'Backend is not running. Close this page and start the app using start-jaundice-ai.bat, then try again.';
      errorMsg.style.display = 'block';
    });
};

/* ─── LOGOUT BUTTON ──────────────────────────────── */
(function initLogout() {
  const btn = document.getElementById('logoutBtn');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    btn.disabled = true;
    window.setAccountMenuVisible?.(false);

    // Firebase sign-out is handled in firebase.js if available;
    // fall back to redirect.
    if (window.firebaseSignOut) {
      await window.firebaseSignOut();
    } else {
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
      localStorage.removeItem('accountProfile');
      localStorage.removeItem('accountSettings');
      window.location.href = '/login';
    }
  });
})();
