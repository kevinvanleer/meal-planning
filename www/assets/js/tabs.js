(function () {
  var tabs = { meals: 'tab-meals', recipes: 'tab-recipes', grocery: 'tab-grocery' };
  var wakeLock = null;

  function activateFromHash() {
    var hash = location.hash.slice(1);
    var id = tabs[hash];
    if (id) {
      document.getElementById(id).checked = true;
      releaseWakeLock();
    } else if (hash.startsWith('recipe-')) {
      showRecipeDetail(hash);
    }
  }

  function showRecipeDetail(recipeId) {
    var recipe = document.getElementById(recipeId);
    if (!recipe) return;

    var detailContent = document.getElementById('recipe-detail-content');
    detailContent.innerHTML = recipe.outerHTML;
    document.getElementById('tab-recipe-detail').checked = true;

    requestWakeLock();
  }

  function requestWakeLock() {
    if ('wakeLock' in navigator) {
      navigator.wakeLock.request('screen').then(function (lock) {
        wakeLock = lock;
        wakeLock.addEventListener('release', function () {
          wakeLock = null;
        });
      }).catch(function () {});
    }
  }

  function releaseWakeLock() {
    if (wakeLock) {
      wakeLock.release();
      wakeLock = null;
    }
  }

  activateFromHash();
  window.addEventListener('hashchange', activateFromHash);

  document.querySelectorAll('.tab-labels label').forEach(function (label) {
    label.addEventListener('click', function () {
      var key = label.getAttribute('for').replace('tab-', '');
      history.replaceState(null, '', '#' + key);
      releaseWakeLock();
    });
  });

  document.addEventListener('click', function (e) {
    var row = e.target.closest('.meal-row');
    if (row) {
      var day = row.getAttribute('data-day');
      location.hash = 'recipe-' + day;
      return;
    }

    var backBtn = e.target.closest('#back-to-meals');
    if (backBtn) {
      location.hash = 'meals';
      return;
    }

    var btn = e.target.closest('.copy-btn');
    if (btn) {
      var item = btn.getAttribute('data-item');
      navigator.clipboard.writeText(item).then(function () {
        btn.textContent = '\u2705';
        btn.classList.add('copied');
        setTimeout(function () {
          btn.textContent = '\uD83D\uDCCB';
          btn.classList.remove('copied');
        }, 1500);
      });
    }
  });

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && location.hash.startsWith('#recipe-')) {
      requestWakeLock();
    }
  });
})();
