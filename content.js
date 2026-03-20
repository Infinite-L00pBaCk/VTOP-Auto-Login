/**
 * VTOP Auto Login v7
 * CAPTCHA solver: captop CRNN model (SykikXO/captop on GitHub)
 * Purpose-trained on 800+ real VTOP CAPTCHAs — near 100% accuracy.
 * API: https://captop-proxy.sykik.workers.dev/solve  (free, open)
 *
 
 */

(function () {
  "use strict";

  /* ─── Shared one-shot MutationObserver ─────────────────────────────────── */
  const triggers = new Map();
  const globalObserver = new MutationObserver(() => {
    for (const [sel, cb] of triggers) {
      let el; try { el = document.querySelector(sel); } catch(e) { continue; }
      if (el) { triggers.delete(sel); cb(el); }
    }
  });
  globalObserver.observe(document.documentElement, { childList: true, subtree: true });

  function onElement(sel, cb) {
    let el; try { el = document.querySelector(sel); } catch(e) { return; }
    if (el) { cb(el); return; }
    triggers.set(sel, cb);
  }

  /* ─── Settings ─────────────────────────────────────────────────────────── */
  let _cache = null;
  function getSettings() {
    if (_cache) return Promise.resolve(_cache);
    return new Promise(resolve =>
      chrome.storage.local.get(['vtop_username', 'vtop_password', 'vtop_role', 'vtop_enabled'], r => {
        _cache = {
          u:       r.vtop_username || '',
          p:       r.vtop_password || '',
          role:    r.vtop_role     || 'student',
          enabled: (r.vtop_enabled === undefined) ? true : r.vtop_enabled,
        };
        resolve(_cache);
      })
    );
  }

  /* ─── Fill input (React/Angular-safe) ──────────────────────────────────── */
  function fill(el, val) {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(el, val);
    el.dispatchEvent(new Event('input',  { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  /* ─── CAPTCHA solver: captop CRNN API ───────────────────────────────────
     The VTOP captcha <img> src is already "data:image/jpeg;base64,…"
     We send that base64 blob to the captop API which runs the trained
     CRNN model and returns the decoded text.
  ─────────────────────────────────────────────────────────────────────── */
  async function solveCaptcha(imgEl) {
    // Extract base64 from data URL  →  "data:image/jpeg;base64,<HERE>"
    const src = imgEl.src || '';
    if (!src.startsWith('data:')) {
      console.warn('[VTOP] CAPTCHA image has no data URL src:', src.substring(0, 60));
      return null;
    }

    const base64 = src.split(',')[1];
    if (!base64 || base64.length < 100) {
      console.warn('[VTOP] CAPTCHA base64 too short, image not ready yet');
      return null;
    }

    console.log('[VTOP] Sending CAPTCHA to captop CRNN API…');

    // Primary endpoint: Cloudflare Worker proxy (always up, no cold starts)
    const endpoints = [
      'https://captop-proxy.sykik.workers.dev/solve',
      'https://captop.duckdns.org/solve',
    ];

    for (const url of endpoints) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64 }),
        });

        if (!res.ok) {
          console.warn('[VTOP] captop API error', res.status, 'at', url);
          continue;
        }

        const json = await res.json();
        // API returns { text: "ZcWjZY" } or { result: "ZcWjZY" } or just a string
        const text = (json.text || json.result || json.captcha || json || '')
          .toString().trim().replace(/\s/g, '');

        if (text) {
          console.log('[VTOP] captop solved CAPTCHA:', text);
          return text;
        }
      } catch (e) {
        console.warn('[VTOP] captop endpoint failed:', url, e.message);
      }
    }

    return null;
  }

  /* ════════════════════════════════════════════════════════════
     PIPELINE
  ════════════════════════════════════════════════════════════ */

  /* STEP 1 — Landing page: click correct role card ───────────────────────── */
  async function step1_clickRoleCard() {
    const { role } = await getSettings();
    const pattern  = new RegExp('^' + role + '$', 'i');

    function findAndClick() {
      // Walk every card-like container and match by its title text
      const containers = document.querySelectorAll(
        '.card, [class*="card"], td, .col, .col-md-3, .col-sm-6, section > div'
      );
      for (const card of containers) {
        // Get shallow text (first heading/paragraph inside)
        const heading = card.querySelector('h1,h2,h3,h4,h5,h6,p,span');
        if (heading && pattern.test(heading.textContent.trim())) {
          const btn = card.querySelector('button,a,input[type=button],input[type=submit]');
          if (btn) { console.log('[VTOP] Clicking role card:', role); btn.click(); return true; }
          card.click(); return true;
        }
      }
      // Last resort: any clickable whose nearest ancestor text starts with role name
      const all = [...document.querySelectorAll('button, a')];
      const match = all.find(el => {
        const p = el.closest('[class]');
        return p && pattern.test(p.textContent.trim().split(/\s+/)[0]);
      });
      if (match) { console.log('[VTOP] Role click (fallback):', role); match.click(); return true; }
      return false;
    }

    if (!findAndClick()) {
      onElement('.card, [class*="col"]', () => findAndClick());
    }
    step2_waitForLoginForm();
  }

  /* STEP 2 — Wait for login form ─────────────────────────────────────────── */
  function step2_waitForLoginForm() {
    onElement(
      '[name="vtopLoginForm"], #vtopLoginForm, input[type="password"]',
      () => step3_fillCredentials()
    );
  }

  /* STEP 3 — Fill username + password instantly ──────────────────────────── */
  async function step3_fillCredentials() {
    const { u, p } = await getSettings();
    const form      = document.querySelector('[name="vtopLoginForm"]') || document;
    const userField = form.querySelector('input[type="text"]:not([name="_csrf"]):not([type=hidden])');
    const pwField   = form.querySelector('input[type="password"]');

    if (userField && u) { fill(userField, u); console.log('[VTOP] Username filled'); }
    if (pwField   && p) { fill(pwField,   p); console.log('[VTOP] Password filled'); }

    step3b_waitForCaptcha();
  }

  /* STEP 3b — Wait for CAPTCHA input AND image simultaneously ────────────── */
  function step3b_waitForCaptcha() {
    let captchaInput = null;
    let captchaImg   = null;

    function tryProceed() {
      if (captchaInput && captchaImg) {
        console.log('[VTOP] CAPTCHA elements ready — solving…');
        step4_solveCaptcha(captchaInput, captchaImg);
      }
    }

    // Input field — exact placeholder from page inspection
    onElement('input[placeholder="Enter CAPTCHA shown above"]', el => {
      console.log('[VTOP] CAPTCHA input found');
      captchaInput = el;
      tryProceed();
    });

    // Image — exact class from page inspection: img.form-control.img-fluid
    onElement('img.form-control.img-fluid', el => {
      console.log('[VTOP] CAPTCHA image element found');

      function checkSrc() {
        if (el.src && el.src.startsWith('data:') && el.src.length > 200) {
          console.log('[VTOP] CAPTCHA image src ready');
          captchaImg = el;
          tryProceed();
        } else {
          // src not populated yet — watch for the attribute to be set
          const ob = new MutationObserver(() => {
            if (el.src && el.src.startsWith('data:') && el.src.length > 200) {
              ob.disconnect();
              captchaImg = el;
              tryProceed();
            }
          });
          ob.observe(el, { attributes: true, attributeFilter: ['src'] });
        }
      }
      checkSrc();
    });
  }

  /* STEP 4 — Solve with captop CRNN, fill, submit ────────────────────────── */
  async function step4_solveCaptcha(inputEl, imgEl) {
    const text = await solveCaptcha(imgEl);

    if (text) {
      fill(inputEl, text);
      console.log('[VTOP] CAPTCHA filled:', text, '— submitting…');
      step5_submit();
    } else {
      // Both APIs failed — fall back to manual with auto-submit on completion
      console.warn('[VTOP] CRNN solve failed — manual entry fallback');
      inputEl.focus();
      attachManualSubmit(inputEl);
    }
  }

  /* STEP 5 — Click Submit ────────────────────────────────────────────────── */
  function step5_submit() {
    const form = document.querySelector('[name="vtopLoginForm"]') || document;
    const btn  =
      form.querySelector('button[type="submit"]') ||
      form.querySelector('input[type="submit"]')  ||
      [...document.querySelectorAll('button')]
        .find(b => /^submit$/i.test(b.textContent.trim()));

    if (btn) { console.log('[VTOP] Clicking Submit'); btn.click(); }
    else     { console.warn('[VTOP] Submit button not found'); }
  }

  /* Manual fallback: focus field, auto-submit when user types captcha ─────── */
  function attachManualSubmit(field) {
    let done = false;
    field.addEventListener('input', () => {
      if (done || field.value.trim().length < 4) return;
      done = true; step5_submit();
    });
    field.addEventListener('keydown', e => {
      if (done || e.key !== 'Enter') return;
      done = true; step5_submit();
    }, { once: true });
  }

  /* ─── Reload guard ──────────────────────────────────────────────────────
     If the CAPTCHA image src is never populated after 2s, the page
     loaded broken — reload it. This is the ONLY timeout in the script.
  ─────────────────────────────────────────────────────────────────────── */
  function installReloadGuard() {
    if (!document.querySelector('input[type="password"]')) return;

    const t = setTimeout(() => {
      const img = document.querySelector('img.form-control.img-fluid');
      const ready = img && img.src && img.src.startsWith('data:') && img.src.length > 200;
      if (!ready) {
        console.warn('[VTOP] CAPTCHA image never loaded — reloading');
        location.reload();
      }
    }, 1500);

    onElement('img.form-control.img-fluid', el => {
      const ob = new MutationObserver(() => {
        if (el.src && el.src.startsWith('data:') && el.src.length > 200) {
          ob.disconnect(); clearTimeout(t);
        }
      });
      if (el.src && el.src.length > 200) clearTimeout(t);
      else ob.observe(el, { attributes: true, attributeFilter: ['src'] });
    });
  }

  /* ─── Init ──────────────────────────────────────────────────────────────── */
  async function init() {
    console.log('[VTOP] v7 init on', location.pathname);

    const settings = await getSettings();
    if (!settings.enabled) {
      console.log('[VTOP] Auto-login is disabled — standing by.');
      return;
    }

    const onLoginPage = !!document.querySelector(
      '[name="vtopLoginForm"], input[type="password"]'
    );
    if (onLoginPage) {
      installReloadGuard();
      step3_fillCredentials();
    } else {
      step1_clickRoleCard();
    }
  }

  /* ─── SPA navigation ────────────────────────────────────────────────────── */
  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      _cache  = null;
      triggers.clear();
      setTimeout(init, 0);
    }
  }).observe(document, { subtree: true, childList: true });

  init();

})();
