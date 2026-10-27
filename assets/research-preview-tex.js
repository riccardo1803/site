/* Render only the Research Mode TeX example. Source formulas remain readable TeX. */
(function () {
  'use strict';
  var target = document.getElementById('ip-research-example');
  if (!target) return;
  if (!window.MathJax || !MathJax.startup || !MathJax.startup.promise) {
    console.error('MathJax did not load: Research Mode equations are not typeset.');
    return;
  }
  MathJax.startup.promise
    .then(function () { return MathJax.typesetPromise([target]); })
    .catch(function (error) { console.error('Research Mode TeX error:', error); });
})();
