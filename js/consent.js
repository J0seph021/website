/*!
 * G.A. Logix — Cookie consent banner + conditional Google Analytics loader
 * Conforme Loi 25 (Québec) et RGPD (UE).
 * Google Analytics ne se charge qu'après consentement explicite.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'galogix-cookie-consent';
  var GA_ID = 'G-FW2DLMHSMN';
  var PRIVACY = {
    fr: '/fr/politique-confidentialite.html',
    en: '/en/privacy-policy.html'
  };
  var TEXTS = {
    fr: {
      message: 'Nous utilisons des cookies pour améliorer votre expérience de navigation et analyser l’utilisation du site. En cliquant sur « Accepter », vous consentez à notre utilisation des cookies.',
      accept: 'Accepter',
      refuse: 'Refuser',
      learnMore: 'En savoir plus sur notre politique de confidentialité'
    },
    en: {
      message: 'We use cookies to enhance your browsing experience and analyze site usage. By clicking "Accept", you consent to our use of cookies.',
      accept: 'Accept',
      refuse: 'Decline',
      learnMore: 'Learn more about our privacy policy'
    }
  };

  function getLang() {
    var l = (document.documentElement.lang || 'fr').toLowerCase();
    return l.indexOf('en') === 0 ? 'en' : 'fr';
  }

  function readConsent() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function writeConsent(choice) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        choice: choice,
        date: new Date().toISOString(),
        version: 1
      }));
    } catch (e) {}
  }

  function loadGA() {
    if (window.__galogixGALoaded) return;
    window.__galogixGALoaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GA_ID, { anonymize_ip: true });
  }

  function injectStyles() {
    if (document.getElementById('galogix-consent-styles')) return;
    var css = ''
      + '#galogix-consent-banner{position:fixed;left:0;right:0;bottom:0;z-index:99999;'
      + 'background:#0C4466;color:#fff;box-shadow:0 -4px 20px rgba(0,0,0,.2);'
      + 'font-family:Figtree,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;'
      + 'display:flex;align-items:center;justify-content:space-between;gap:1.5rem;'
      + 'padding:.9rem 1.5rem;line-height:1.4;}'
      + '#galogix-consent-banner .gcb-content{display:flex;align-items:flex-start;gap:.85rem;flex:1;min-width:0;}'
      + '#galogix-consent-banner .gcb-icon{flex-shrink:0;width:32px;height:32px;border-radius:50%;'
      + 'background:rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;'
      + 'font-size:1.15rem;line-height:1;}'
      + '#galogix-consent-banner .gcb-text{font-size:.875rem;color:#fff;min-width:0;}'
      + '#galogix-consent-banner .gcb-text p{margin:0 0 .15rem;}'
      + '#galogix-consent-banner .gcb-link{color:#93c5fd;text-decoration:underline;font-size:.8rem;'
      + 'display:inline-block;}'
      + '#galogix-consent-banner .gcb-link:hover{color:#fff;}'
      + '#galogix-consent-banner .gcb-buttons{display:flex;gap:.5rem;flex-shrink:0;}'
      + '#galogix-consent-banner button{padding:.55rem 1.1rem;border:none;border-radius:6px;'
      + 'font-family:inherit;font-weight:600;font-size:.875rem;cursor:pointer;'
      + 'transition:background .15s,transform .1s;white-space:nowrap;}'
      + '#galogix-consent-banner .gcb-accept{background:#93c5fd;color:#0C4466;}'
      + '#galogix-consent-banner .gcb-accept:hover{background:#bfdbfe;}'
      + '#galogix-consent-banner .gcb-refuse{background:#93c5fd;color:#0C4466;}'
      + '#galogix-consent-banner .gcb-refuse:hover{background:#bfdbfe;}'
      + '@media (max-width:760px){'
      +   '#galogix-consent-banner{flex-direction:column;align-items:stretch;gap:.85rem;padding:1rem;}'
      +   '#galogix-consent-banner .gcb-buttons{justify-content:flex-end;}'
      +   '#galogix-consent-banner button{flex:1;}'
      + '}';
    var style = document.createElement('style');
    style.id = 'galogix-consent-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function showBanner() {
    if (document.getElementById('galogix-consent-banner')) return;
    injectStyles();
    var lang = getLang();
    var t = TEXTS[lang];
    var privacyUrl = PRIVACY[lang];
    var banner = document.createElement('div');
    banner.id = 'galogix-consent-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-live', 'polite');
    banner.setAttribute('aria-label', t.message);
    banner.innerHTML =
      '<div class="gcb-content">' +
        '<div class="gcb-icon" aria-hidden="true">🍪</div>' +
        '<div class="gcb-text">' +
          '<p>' + t.message + '</p>' +
          '<a href="' + privacyUrl + '" class="gcb-link">' + t.learnMore + '</a>' +
        '</div>' +
      '</div>' +
      '<div class="gcb-buttons">' +
        '<button type="button" class="gcb-refuse" id="gcb-refuse">' + t.refuse + '</button>' +
        '<button type="button" class="gcb-accept" id="gcb-accept">' + t.accept + '</button>' +
      '</div>';
    document.body.appendChild(banner);
    document.getElementById('gcb-accept').addEventListener('click', function () {
      writeConsent('accepted');
      loadGA();
      hideBanner();
    });
    document.getElementById('gcb-refuse').addEventListener('click', function () {
      writeConsent('refused');
      hideBanner();
    });
  }

  function hideBanner() {
    var b = document.getElementById('galogix-consent-banner');
    if (b && b.parentNode) b.parentNode.removeChild(b);
  }

  // Public API : called from "Gérer mes cookies" / "Manage cookies" links
  window.galogixOpenCookieSettings = function () {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    hideBanner();
    showBanner();
  };

  function init() {
    var saved = readConsent();
    if (saved && saved.choice === 'accepted') {
      loadGA();
      return;
    }
    if (saved && saved.choice === 'refused') {
      return;
    }
    if (document.body) {
      showBanner();
    } else {
      document.addEventListener('DOMContentLoaded', showBanner);
    }
  }

  init();
})();
