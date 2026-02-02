const fs = require('fs');
const path = require('path');
const Mustache = require('mustache');
const Ajv = require('ajv');

const ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content');
const TEMPLATES_DIR = path.join(ROOT, 'templates');
const ASSETS_DIR = path.join(ROOT, 'assets');
const DIST_DIR = path.join(ROOT, 'dist');

const validateOnly = process.argv.includes('--validate-only');

const schema = JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, 'week.schema.json'), 'utf8'));
const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(schema);

const weekFiles = fs.readdirSync(CONTENT_DIR)
  .filter(f => f.endsWith('.json') && f !== 'week.schema.json')
  .sort()
  .reverse();

const weeks = [];
let hasErrors = false;

for (const file of weekFiles) {
  const data = JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, file), 'utf8'));
  const valid = validate(data);
  if (!valid) {
    console.error(`Validation failed for ${file}:`);
    console.error(validate.errors);
    hasErrors = true;
  } else {
    console.log(`Validated ${file}`);
    weeks.push(data);
  }
}

if (hasErrors) {
  process.exit(1);
}

if (validateOnly) {
  console.log('All files valid.');
  process.exit(0);
}

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

fs.rmSync(DIST_DIR, { recursive: true, force: true });
fs.mkdirSync(DIST_DIR, { recursive: true });

const indexTemplate = fs.readFileSync(path.join(TEMPLATES_DIR, 'index.mustache.html'), 'utf8');
const weekTemplate = fs.readFileSync(path.join(TEMPLATES_DIR, 'week.mustache.html'), 'utf8');

const weeksWithDateRange = weeks.map(w => ({
  ...w,
  dateRange: formatDateRange(w.startDate, w.endDate),
}));

const indexHtml = Mustache.render(indexTemplate, { weeks: weeksWithDateRange });
fs.writeFileSync(path.join(DIST_DIR, 'index.html'), indexHtml);
console.log('Built dist/index.html');

for (const week of weeksWithDateRange) {
  const groceryCategories = Object.entries(week.groceryList).map(([category, items]) => ({
    category,
    items,
  }));

  const weekDir = path.join(DIST_DIR, 'week', week.startDate);
  fs.mkdirSync(weekDir, { recursive: true });

  const weekHtml = Mustache.render(weekTemplate, { ...week, groceryCategories });
  fs.writeFileSync(path.join(weekDir, 'index.html'), weekHtml);
  console.log(`Built dist/week/${week.startDate}/index.html`);
}

copyDirSync(ASSETS_DIR, path.join(DIST_DIR, 'assets'));
console.log('Copied assets/');
console.log('Build complete.');
