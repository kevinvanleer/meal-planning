const fs = require('fs');
const path = require('path');

const WEEKS_DIR = path.resolve(__dirname, '../../weeks');
const CONTENT_DIR = path.resolve(__dirname, '../content');

function parseLine(line) {
  return line.replace(/^│\s*/, '').replace(/\s*│\s*$/, '').split(/\s*│\s*/);
}

function parseWeekFile(text) {
  const lines = text.split('\n');

  const meals = [];
  for (const line of lines) {
    if (!line.startsWith('│')) continue;
    if (line.includes('Day') && line.includes('Meal') && line.includes('Style')) continue;
    const cols = parseLine(line);
    if (cols.length >= 3 && cols[0].trim()) {
      const day = cols[0].trim();
      const meal = cols[1].trim();
      const style = cols[2].trim();
      if (day && meal && !day.includes('─')) {
        meals.push({ day, meal, style });
      }
    }
  }

  const recipeSectionStart = lines.findIndex(l => l.startsWith('Recipes'));
  const grocerySectionStart = lines.findIndex(l => l.startsWith('Grocery List'));

  const recipes = [];
  if (recipeSectionStart !== -1) {
    const end = grocerySectionStart !== -1 ? grocerySectionStart : lines.length;
    const recipeLines = lines.slice(recipeSectionStart + 1, end);

    let current = null;
    for (const line of recipeLines) {
      if (line === '---' || line.trim() === '') {
        if (current) {
          recipes.push(current);
          current = null;
        }
        continue;
      }

      const dayMatch = line.match(/^(\w+day)\s+—\s+(.+)/);
      if (dayMatch) {
        if (current) recipes.push(current);
        current = {
          day: dayMatch[1],
          name: dayMatch[2].trim(),
          ingredients: [],
          instructions: '',
        };
        continue;
      }

      if (current && line.startsWith('- ')) {
        const item = line.slice(2).trim();
        const looksLikeInstruction = /\b(cook|sear|sauté|saute|serve|place|slow cooker|shred|stir|grill|roast|marinate|brown|melt|toss)\b/i.test(item)
          && !/^\d/.test(item)
          && !item.includes('Toppings:')
          && !item.includes('Sauce:')
          && !item.includes('Marinade:')
          && !item.includes('Slaw:');
        if (looksLikeInstruction) {
          current.instructions = item;
        } else {
          current.ingredients.push(item);
        }
      }
    }
    if (current) recipes.push(current);
  }

  const groceryList = {};
  if (grocerySectionStart !== -1) {
    const groceryLines = lines.slice(grocerySectionStart + 1);
    let currentCategory = null;

    for (const line of groceryLines) {
      if (line.trim() === '' || line === '---') continue;

      if (!line.startsWith('- ') && line.trim()) {
        currentCategory = line.trim();
        groceryList[currentCategory] = [];
        continue;
      }

      if (currentCategory && line.startsWith('- ')) {
        const content = line.slice(2).trim();
        const dashMatch = content.match(/^(.+?)\s+—\s+(.+)$/);
        if (dashMatch) {
          groceryList[currentCategory].push({
            item: dashMatch[1].trim(),
            days: dashMatch[2].trim(),
          });
        } else {
          groceryList[currentCategory].push({
            item: content,
            days: '',
          });
        }
      }
    }
  }

  return { meals, recipes, groceryList };
}

const files = fs.readdirSync(WEEKS_DIR).filter(f => f.endsWith('.txt')).sort();

for (const file of files) {
  const dateStr = file.replace('.txt', '');
  const text = fs.readFileSync(path.join(WEEKS_DIR, file), 'utf8');
  const parsed = parseWeekFile(text);
  const startDate = new Date(dateStr + 'T00:00:00');
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  parsed.startDate = dateStr;
  parsed.endDate = endDate.toISOString().slice(0, 10);

  const outPath = path.join(CONTENT_DIR, `${dateStr}.json`);
  fs.writeFileSync(outPath, JSON.stringify(parsed, null, 2) + '\n');
  console.log(`Generated ${outPath}`);
}
