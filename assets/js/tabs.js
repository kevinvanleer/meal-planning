(function () {
  var tabs = { meals: 'tab-meals', recipes: 'tab-recipes', grocery: 'tab-grocery' };

  function activateFromHash() {
    var id = tabs[location.hash.slice(1)];
    if (id) document.getElementById(id).checked = true;
  }

  activateFromHash();
  window.addEventListener('hashchange', activateFromHash);

  document.querySelectorAll('.tab-labels label').forEach(function (label) {
    label.addEventListener('click', function () {
      var key = label.getAttribute('for').replace('tab-', '');
      history.replaceState(null, '', '#' + key);
    });
  });

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.copy-btn');
    if (!btn) return;
    var item = btn.getAttribute('data-item');
    navigator.clipboard.writeText(item).then(function () {
      btn.textContent = '\u2705';
      btn.classList.add('copied');
      setTimeout(function () {
        btn.textContent = '\uD83D\uDCCB';
        btn.classList.remove('copied');
      }, 1500);
    });
  });
})();
