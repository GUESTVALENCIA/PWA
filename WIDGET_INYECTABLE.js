// Compatibility loader: keep `/WIDGET_INYECTABLE.js` working while the real widget lives in `/assets/js/galaxy/WIDGET_INYECTABLE.js`.
(function () {
  'use strict';

  if (window.__SANDRA_WIDGET_LOADER__) return;
  window.__SANDRA_WIDGET_LOADER__ = true;

  var script = document.createElement('script');
  script.src = '/assets/js/galaxy/WIDGET_INYECTABLE.js';
  script.async = true;
  document.head.appendChild(script);
})();

