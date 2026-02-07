-- Recipes table - single source of truth for all recipes
CREATE TABLE IF NOT EXISTS recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    style TEXT,
    ingredients TEXT NOT NULL,  -- JSON array
    instructions TEXT NOT NULL,
    prep_steps TEXT,            -- JSON array (optional)
    tips TEXT                   -- JSON array (optional)
);

-- Meals table - instances of recipes on specific dates
CREATE TABLE IF NOT EXISTS meals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id INTEGER NOT NULL REFERENCES recipes(id),
    date TEXT NOT NULL,         -- YYYY-MM-DD
    notes TEXT,
    UNIQUE(date)                -- One meal per day
);

-- Grocery items - curated per-week shopping list
CREATE TABLE IF NOT EXISTS grocery_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    week_start TEXT NOT NULL,   -- YYYY-MM-DD (Monday)
    category TEXT NOT NULL,
    item TEXT NOT NULL,
    days TEXT                   -- e.g., "Monday, Wednesday"
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_meals_date ON meals(date);
CREATE INDEX IF NOT EXISTS idx_grocery_week ON grocery_items(week_start);
