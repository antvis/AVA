export const LANGUAGE_STORAGE_KEY = 'ava.locale';

// Only the unprefixed homepage negotiates language; shared page URLs stay explicit.
export const languageRedirectScript = `
(function () {
  if (location.pathname !== '/') return;
  var preferred;
  try {
    preferred = localStorage.getItem('${LANGUAGE_STORAGE_KEY}');
  } catch (_) {
    // Without storage, keep English reachable after a manual switch.
    return;
  }
  if (preferred !== 'en' && preferred !== 'zh') {
    var language = navigator.languages && navigator.languages[0] || navigator.language || '';
    preferred = /^zh(?:-|$)/i.test(language) ? 'zh' : 'en';
  }
  if (preferred === 'zh') {
    location.replace('/zh/' + location.search + location.hash);
  }
})();
`;
