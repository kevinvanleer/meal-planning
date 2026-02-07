(function () {
  var tabs = { meals: 'tab-meals', recipes: 'tab-recipes', grocery: 'tab-grocery' };
  var wakeLock = null;

  function updateHeaderNav(isRecipeDetail) {
    var archiveLink = document.getElementById('back-to-archive');
    var mealsLink = document.getElementById('back-to-meals');
    if (archiveLink && mealsLink) {
      archiveLink.hidden = isRecipeDetail;
      mealsLink.hidden = !isRecipeDetail;
    }
  }

  function activateFromHash() {
    var hash = location.hash.slice(1);
    var id = tabs[hash];
    if (id) {
      document.getElementById(id).checked = true;
      updateHeaderNav(false);
      releaseWakeLock();
    } else if (hash.startsWith('recipe-')) {
      showRecipeDetail(hash);
    } else {
      updateHeaderNav(false);
    }
  }

  function showRecipeDetail(recipeId) {
    var recipe = document.getElementById(recipeId);
    if (!recipe) return;

    var detailContent = document.getElementById('recipe-detail-content');
    var name = recipe.querySelector('h3').textContent;
    var ingredients = recipe.querySelector('ul').outerHTML;
    var prepSteps = recipe.querySelector('.prep-steps');
    var tips = recipe.querySelector('.tips');

    var html = '<article class="recipe-detail">';
    html += '<h3>' + name + '</h3>';
    html += '<h4>Ingredients</h4>' + ingredients;

    if (prepSteps) {
      html += '<h4>Prep Steps</h4>' + prepSteps.innerHTML;
    } else {
      var instructions = recipe.querySelector('.instructions').textContent;
      html += '<h4>Instructions</h4><p class="instructions">' + instructions + '</p>';
    }

    if (tips) {
      html += '<h4>Tips</h4>' + tips.innerHTML;
    }

    html += '</article>';
    detailContent.innerHTML = html;
    document.getElementById('tab-recipe-detail').checked = true;
    updateHeaderNav(true);

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
