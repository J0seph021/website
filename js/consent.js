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
      title: 'Avant de commencer…',
      message: 'Pour mieux comprendre votre parcours sur galogix.ca et améliorer votre expérience, nous aimerions activer Google Analytics. Aucune publicité, aucune revente de données — juste de la mesure anonyme.',
      accept: 'D’accord',
      refuse: 'Non merci',
      learnMore: 'En savoir plus'
    },
    en: {
      title: 'Before you continue…',
      message: 'To better understand your journey on galogix.ca and improve your experience, we’d like to enable Google Analytics. No ads, no data resale — just anonymous measurement.',
      accept: 'Sounds good',
      refuse: 'No thanks',
      learnMore: 'Learn more'
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
      + '#galogix-consent-banner{position:fixed;left:1rem;right:1rem;bottom:1rem;z-index:99999;'
      + 'background:#0C4466;color:#fff;border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,.35);'
      + 'font-family:Figtree,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:780px;margin:0 auto;'
      + 'padding:1.25rem 1.5rem;line-height:1.5;}'
      + '#galogix-consent-banner h2{font-size:1.1rem;margin:0 0 .35rem;font-weight:700;color:#fff;}'
      + '#galogix-consent-banner p{margin:0 0 1rem;font-size:.95rem;color:#dbeafe;}'
      + '#galogix-consent-banner .gcb-link{color:#fff;text-decoration:underline;}'
      + '#galogix-consent-banner .gcb-link:hover{color:#93c5fd;}'
      + '#galogix-consent-banner .gcb-buttons{display:flex;gap:.75rem;flex-wrap:wrap;}'
      + '#galogix-consent-banner button{flex:1;min-width:140px;padding:.65rem 1rem;border:none;border-radius:8px;'
      + 'font-family:inherit;font-weight:600;font-size:.95rem;cursor:pointer;transition:background .15s,transform .15s;}'
      + '#galogix-consent-banner .gcb-accept{background:#fff;color:#0C4466;}'
      + '#galogix-consent-banner .gcb-accept:hover{background:#dbeafe;transform:translateY(-1px);}'
      + '#galogix-consent-banner .gcb-refuse{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.45);}'
      + '#galogix-consent-banner .gcb-refuse:hover{background:rgba(255,255,255,.08);transform:translateY(-1px);}'
      + '@media (max-width:520px){#galogix-consent-banner{padding:1rem;}#galogix-consent-banner button{flex:1 1 100%;}}';
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
    banner.setAttribute('aria-label', t.title);
    banner.innerHTML =
      '<h2>' + t.title + '</h2>' +
      '<p>' + t.message + ' <a href="' + privacyUrl + '" class="gcb-link">' + t.learnMore + ' →</a></p>' +
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
