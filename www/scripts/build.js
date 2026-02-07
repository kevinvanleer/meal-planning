const fs = require('fs');
const path = require('path');
const Mustache = require('mustache');
const Database = require('better-sqlite3');

const ROOT = path.resolve(__dirname, '..');
const DB_PATH = path.join(ROOT, 'meals.db');
const TEMPLATES_DIR = path.join(ROOT, 'templates');
const ASSETS_DIR = path.join(ROOT, 'assets');
const DIST_DIR = path.join(ROOT, 'dist');

const validateOnly = process.argv.includes('--validate-only');

// Open database
if (!fs.existsSync(DB_PATH)) {
  console.error('Database not found. Run: node scripts/migrate-from-json.js');
  process.exit(1);
}

const db = new Database(DB_PATH, { readonly: true });

// Validate database has data
const recipeCount = db.prepare('SELECT COUNT(*) as count FROM recipes').get().count;
const mealCount = db.prepare('SELECT COUNT(*) as count FROM meals').get().count;

if (recipeCount === 0 || mealCount === 0) {
  console.error('Database is empty. Run migration first.');
  process.exit(1);
}

console.log(`Database: ${recipeCount} recipes, ${mealCount} meals`);

if (validateOnly) {
  console.log('Validation passed.');
  db.close();
  process.exit(0);
}

// Get all weeks (grouped by week start date)
const getWeeks = db.prepare(`
  SELECT DISTINCT
    date(date, 'weekday 0', '-6 days') as week_start,
    date(date, 'weekday 0') as week_end
  FROM meals
  ORDER BY week_start DESC
`);

const getMealsForWeek = db.prepare(`
  SELECT
    m.date,
    m.notes,
    r.id as recipe_id,
    r.name,
    r.style,
    r.ingredients,
    r.instructions,
    r.prep_steps,
    r.tips
  FROM meals m
  JOIN recipes r ON m.recipe_id = r.id
  WHERE date(m.date, 'weekday 0', '-6 days') = ?
  ORDER BY m.date
`);

const getGroceryForWeek = db.prepare(`
  SELECT category, item, days
  FROM grocery_items
  WHERE week_start = ?
  ORDER BY category, id
`);

function formatDateRange(startDate, endDate) {
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const startMonth = months[start.getMonth()];
  const endMonth = months[end.getMonth()];
  const year = end.getFullYear();
  if (startMonth === endMonth) {
    return `${startMonth} ${start.getDate()}\u2013${end.getDate()}, ${year}`;
  }
  return `${startMonth} ${start.getDate()} \u2013 ${endMonth} ${end.getDate()}, ${year}`;
}

function getDayName(dateStr) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const d = new Date(dateStr + 'T00:00:00');
  return days[d.getDay()];
}

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Build
fs.rmSync(DIST_DIR, { recursive: true, force: true });
fs.mkdirSync(DIST_DIR, { recursive: true });

const indexTemplate = fs.readFileSync(path.join(TEMPLATES_DIR, 'index.mustache.html'), 'utf8');
const archiveTemplate = fs.readFileSync(path.join(TEMPLATES_DIR, 'archive.mustache.html'), 'utf8');
const weekTemplate = fs.readFileSync(path.join(TEMPLATES_DIR, 'week.mustache.html'), 'utf8');

const weeks = getWeeks.all();
const weeksData = [];

for (const week of weeks) {
  const meals = getMealsForWeek.all(week.week_start);
  const groceryRows = getGroceryForWeek.all(week.week_start);

  // Build meals array for template
  const mealsForTemplate = meals.map(m => ({
    day: getDayName(m.date),
    meal: m.name,
    style: m.style || ''
  }));

  // Build recipes array for template
  const recipesForTemplate = meals.map(m => ({
    day: getDayName(m.date),
    name: m.name,
    ingredients: JSON.parse(m.ingredients),
    instructions: m.instructions,
    prepSteps: m.prep_steps ? JSON.parse(m.prep_steps) : null,
    tips: m.tips ? JSON.parse(m.tips) : null
  }));

  // Build grocery list grouped by category
  const groceryByCategory = {};
  for (const row of groceryRows) {
    if (!groceryByCategory[row.category]) {
      groceryByCategory[row.category] = [];
    }
    groceryByCategory[row.category].push({
      item: row.item,
      days: row.days
    });
  }

  const groceryCategories = Object.entries(groceryByCategory).map(([category, items]) => ({
    category,
    items
  }));

  const dateRange = formatDateRange(week.week_start, week.week_end);

  const weekData = {
    startDate: week.week_start,
    endDate: week.week_end,
    dateRange,
    meals: mealsForTemplate,
    recipes: recipesForTemplate,
    groceryCategories
  };

  weeksData.push(weekData);

  // Build week page
  const weekDir = path.join(DIST_DIR, 'week', week.week_start);
  fs.mkdirSync(weekDir, { recursive: true });
  const weekHtml = Mustache.render(weekTemplate, weekData);
  fs.writeFileSync(path.join(weekDir, 'index.html'), weekHtml);
  console.log(`Built dist/week/${week.week_start}/index.html`);
}

// Build index page (redirect to current week)
const weeksJson = JSON.stringify(weeksData.map(w => w.startDate));
const indexHtml = Mustache.render(indexTemplate, { weeks: weeksData, weeksJson });
fs.writeFileSync(path.join(DIST_DIR, 'index.html'), indexHtml);
console.log('Built dist/index.html');

// Build archive page
const archiveDir = path.join(DIST_DIR, 'archive');
fs.mkdirSync(archiveDir, { recursive: true });
const archiveHtml = Mustache.render(archiveTemplate, { weeks: weeksData });
fs.writeFileSync(path.join(archiveDir, 'index.html'), archiveHtml);
console.log('Built dist/archive/index.html');

// Copy assets
copyDirSync(ASSETS_DIR, path.join(DIST_DIR, 'assets'));
console.log('Copied assets/');

db.close();
console.log('Build complete.');
