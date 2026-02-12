#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const readline = require('readline');

const DB_PATH = path.join(__dirname, '..', 'meals.db');
const db = new Database(DB_PATH);

const commands = {
  help: () => {
    console.log(`
Meal Planning CLI

Commands:
  recipes                    List all recipes
  recipe <id>                Show recipe details
  meals [weeks]              List recent meals (default: 2 weeks)
  week <YYYY-MM-DD>          Show meals for a specific week (use Monday date)
  add-meal <date> <recipe>   Add a meal (date: YYYY-MM-DD, recipe: id or name)
  search <term>              Search recipes by name
  unused [weeks]             Show recipes not used in recent weeks
  stats                      Show database statistics

Status tracking:
  defer <date>               Mark a meal as deferred
  made <date>                Mark a meal as made
  deferred                   Show deferred meals
`);
  },

  recipes: () => {
    const recipes = db.prepare(`
      SELECT r.id, r.name, r.style, COUNT(m.id) as times_used,
             MAX(m.date) as last_used
      FROM recipes r
      LEFT JOIN meals m ON r.id = m.recipe_id
      GROUP BY r.id
      ORDER BY r.name
    `).all();

    console.log('\nRecipes:\n');
    for (const r of recipes) {
      const used = r.times_used > 0 ? `(used ${r.times_used}x, last: ${r.last_used})` : '(never used)';
      console.log(`  ${r.id.toString().padStart(2)}. ${r.name} ${used}`);
    }
    console.log(`\nTotal: ${recipes.length} recipes`);
  },

  recipe: (id) => {
    const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(id);
    if (!recipe) {
      console.log('Recipe not found');
      return;
    }

    console.log(`\n${recipe.name}`);
    console.log(`Style: ${recipe.style || 'N/A'}`);
    console.log('\nIngredients:');
    for (const ing of JSON.parse(recipe.ingredients)) {
      console.log(`  - ${ing}`);
    }
    console.log(`\nInstructions: ${recipe.instructions}`);

    if (recipe.prep_steps) {
      console.log('\nPrep Steps:');
      JSON.parse(recipe.prep_steps).forEach((step, i) => {
        console.log(`  ${i + 1}. ${step}`);
      });
    }

    if (recipe.tips) {
      console.log('\nTips:');
      for (const tip of JSON.parse(recipe.tips)) {
        console.log(`  - ${tip}`);
      }
    }

    const meals = db.prepare('SELECT date FROM meals WHERE recipe_id = ? ORDER BY date DESC').all(id);
    if (meals.length > 0) {
      console.log(`\nUsed on: ${meals.map(m => m.date).join(', ')}`);
    }
  },

  meals: (weeks = 2) => {
    const meals = db.prepare(`
      SELECT m.date, m.status, r.name, r.style
      FROM meals m
      JOIN recipes r ON m.recipe_id = r.id
      ORDER BY m.date DESC
      LIMIT ?
    `).all(weeks * 7);

    console.log('\nRecent meals:\n');
    let currentWeek = '';
    for (const m of meals) {
      const weekStart = getWeekStart(m.date);
      if (weekStart !== currentWeek) {
        currentWeek = weekStart;
        console.log(`\nWeek of ${weekStart}:`);
      }
      const day = getDayName(m.date);
      const status = (m.status || '').padEnd(8);
      console.log(`  ${day.padEnd(9)} ${m.date}  ${status}  ${m.name}`);
    }
  },

  week: (weekStart) => {
    const meals = db.prepare(`
      SELECT m.date, m.status, r.name, r.style, r.id as recipe_id
      FROM meals m
      JOIN recipes r ON m.recipe_id = r.id
      WHERE date(m.date, 'weekday 0', '-6 days') = ?
      ORDER BY m.date
    `).all(weekStart);

    if (meals.length === 0) {
      console.log(`No meals found for week of ${weekStart}`);
      return;
    }

    console.log(`\nWeek of ${weekStart}:\n`);
    for (const m of meals) {
      const day = getDayName(m.date);
      const status = m.status === 'deferred' ? ' [deferred]' : m.status === 'made' ? ' [made]' : '';
      console.log(`  ${day.padEnd(9)} ${m.name}${status}`);
    }
  },

  'add-meal': (date, recipeIdOrName) => {
    let recipe;
    if (/^\d+$/.test(recipeIdOrName)) {
      recipe = db.prepare('SELECT id, name FROM recipes WHERE id = ?').get(recipeIdOrName);
    } else {
      recipe = db.prepare('SELECT id, name FROM recipes WHERE name LIKE ?').get(`%${recipeIdOrName}%`);
    }

    if (!recipe) {
      console.log('Recipe not found');
      return;
    }

    try {
      db.prepare('INSERT INTO meals (recipe_id, date) VALUES (?, ?)').run(recipe.id, date);
      console.log(`Added: ${date} - ${recipe.name}`);
    } catch (e) {
      if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        console.log(`A meal already exists for ${date}`);
      } else {
        throw e;
      }
    }
  },

  search: (term) => {
    const recipes = db.prepare(`
      SELECT id, name, style FROM recipes
      WHERE name LIKE ? OR ingredients LIKE ?
      ORDER BY name
    `).all(`%${term}%`, `%${term}%`);

    if (recipes.length === 0) {
      console.log('No recipes found');
      return;
    }

    console.log(`\nFound ${recipes.length} recipe(s):\n`);
    for (const r of recipes) {
      console.log(`  ${r.id.toString().padStart(2)}. ${r.name} (${r.style || 'N/A'})`);
    }
  },

  unused: (weeks = 4) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - weeks * 7);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    const recipes = db.prepare(`
      SELECT r.id, r.name, MAX(m.date) as last_used
      FROM recipes r
      LEFT JOIN meals m ON r.id = m.recipe_id AND m.status != 'deferred'
      GROUP BY r.id
      HAVING last_used IS NULL OR last_used < ?
      ORDER BY last_used
    `).all(cutoffStr);

    console.log(`\nRecipes not used in the last ${weeks} weeks:\n`);
    for (const r of recipes) {
      const lastUsed = r.last_used ? `last used: ${r.last_used}` : 'never used';
      console.log(`  ${r.id.toString().padStart(2)}. ${r.name} (${lastUsed})`);
    }
  },

  stats: () => {
    const recipeCount = db.prepare('SELECT COUNT(*) as c FROM recipes').get().c;
    const mealCount = db.prepare('SELECT COUNT(*) as c FROM meals').get().c;
    const groceryCount = db.prepare('SELECT COUNT(*) as c FROM grocery_items').get().c;
    const weekCount = db.prepare(`
      SELECT COUNT(DISTINCT date(date, 'weekday 0', '-6 days')) as c FROM meals
    `).get().c;
    const plannedCount = db.prepare("SELECT COUNT(*) as c FROM meals WHERE status = 'planned'").get().c;
    const madeCount = db.prepare("SELECT COUNT(*) as c FROM meals WHERE status = 'made'").get().c;
    const deferredCount = db.prepare("SELECT COUNT(*) as c FROM meals WHERE status = 'deferred'").get().c;

    const mostUsed = db.prepare(`
      SELECT r.name, COUNT(*) as times
      FROM meals m
      JOIN recipes r ON m.recipe_id = r.id
      WHERE m.status != 'deferred'
      GROUP BY r.id
      ORDER BY times DESC
      LIMIT 5
    `).all();

    console.log('\nDatabase Statistics:\n');
    console.log(`  Recipes: ${recipeCount}`);
    console.log(`  Meals: ${mealCount}`);
    console.log(`  Weeks: ${weekCount}`);
    console.log(`  Grocery items: ${groceryCount}`);
    console.log(`  Planned: ${plannedCount}`);
    console.log(`  Made: ${madeCount}`);
    console.log(`  Deferred: ${deferredCount}`);
    console.log('\nMost used recipes:');
    for (const r of mostUsed) {
      console.log(`  ${r.times}x ${r.name}`);
    }
  },

  defer: (date) => {
    if (!date) {
      console.log('Usage: defer <YYYY-MM-DD>');
      return;
    }
    const meal = db.prepare(`
      SELECT m.id, m.date, r.name FROM meals m
      JOIN recipes r ON m.recipe_id = r.id
      WHERE m.date = ?
    `).get(date);

    if (!meal) {
      console.log(`No meal found for ${date}`);
      return;
    }

    db.prepare("UPDATE meals SET status = 'deferred' WHERE id = ?").run(meal.id);
    console.log(`Marked as deferred: ${meal.date} - ${meal.name}`);
  },

  made: (date) => {
    if (!date) {
      console.log('Usage: made <YYYY-MM-DD>');
      return;
    }
    const meal = db.prepare(`
      SELECT m.id, m.date, r.name FROM meals m
      JOIN recipes r ON m.recipe_id = r.id
      WHERE m.date = ?
    `).get(date);

    if (!meal) {
      console.log(`No meal found for ${date}`);
      return;
    }

    db.prepare("UPDATE meals SET status = 'made' WHERE id = ?").run(meal.id);
    console.log(`Marked as made: ${meal.date} - ${meal.name}`);
  },

  deferred: () => {
    const deferred = db.prepare(`
      SELECT m.id, m.date, r.name, r.id as recipe_id
      FROM meals m
      JOIN recipes r ON m.recipe_id = r.id
      WHERE m.status = 'deferred'
      ORDER BY m.date
    `).all();

    if (deferred.length === 0) {
      console.log('\nNo deferred meals.');
      return;
    }

    console.log('\nDeferred meals:\n');
    for (const m of deferred) {
      const day = getDayName(m.date);
      console.log(`  ${m.date} (${day}) - ${m.name}`);
    }
  }
};

function getDayName(dateStr) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const d = new Date(dateStr + 'T00:00:00');
  return days[d.getDay()];
}

function getWeekStart(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

// Parse command
const [,, cmd, ...args] = process.argv;

if (!cmd || cmd === 'help') {
  commands.help();
} else if (commands[cmd]) {
  commands[cmd](...args);
} else {
  console.log(`Unknown command: ${cmd}`);
  commands.help();
}

db.close();
