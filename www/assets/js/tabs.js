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
})();
