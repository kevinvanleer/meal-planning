# Meal Planning Project

## Family

| Member   | Birth Year | Age (2026) | Notes                          |
|----------|------------|------------|--------------------------------|
| Dad      | 1981       | 44-45      | Primary planner                |
| Mom      | 1981       | 44-45      | Gluten-free                    |
| Daughter | 2012       | 13-14      |                                |
| Son      | 2007       | 18-19      | Occasional — not always eating |

## Planning Rules

- **Default servings**: 3 (Dad, Mom, Daughter)
- **Optional +1**: Son joins sometimes — note when scaling to 4
- **Meals per day**: 1 planned meal (dinner assumed unless specified)
- **Style**: Wholesome, easy to prepare
- **Output**: Recipes + grocery lists
- **Week starts Monday**: Plan runs Monday through Sunday
- **No repeats**: Never repeat a recipe within the same week
- **Leftovers OK**: Eating leftover meals on off-nights is fine, but not the goal
- **Portion control**: Prefer recipes scaled to exact servings needed (typically 3) to minimize leftovers

## Preferences & Constraints

- **Mom is gluten-free** — all planned meals must be gluten-free or include a gluten-free adaptation
- **Crockpot/slow cooker** — preferred for busy days, dump-and-go meals
- **Future consideration**: Migrate to SQLite DB when recipe collection and meal history grow large enough to benefit from structured queries (e.g., avoiding recent repeats, ingredient tracking)
- **Output format**: Use `template.txt` for meal plan output format. Save each week to `weeks/YYYY-MM-DD.txt` (Monday date)

## Favorite Recipes & Sources

- [Grilled Ham with Honey Bourbon Glaze](https://www.dadcooksdinner.com/grilled-ham-with-honey-bourbon-glaze/) ([printable](https://www.dadcooksdinner.com/grilled-ham-with-honey-bourbon-glaze/print/10897/)) — **taste reference only, not easy prep**
  - 10–12 lb bone-in smoked ham, ½ cup honey, ½ cup bourbon, 2 Tbsp Dijon mustard
  - Score rind, indirect grill at 300°F to 135°F internal (~3 hrs), glaze last 30 min
- [Pork Tenderloin Marinade](https://www.dinneratthezoo.com/pork-tenderloin-marinade/) ([printable](https://www.dinneratthezoo.com/wprm_print/pork-tenderloin-marinade-2))
  - 2½ lb pork tenderloin
  - Marinade: ½ cup olive oil, 3 Tbsp brown sugar, 2 tsp Dijon mustard, 3 Tbsp soy sauce, 1½ tsp lemon zest, 1 Tbsp parsley, 1 Tbsp thyme, 1 tsp salt, ½ tsp pepper, 1½ tsp minced garlic
  - Marinate 1–8 hours. Grill/broil/sauté medium-high to 145°F (~15 min). Rest 5 min, slice, serve.

## Cuisines & Dishes We Love

- **Rice bowls** — versatile base, various proteins and toppings
- **Mexican dishes** — tacos, burritos, enchiladas, etc.
- **Fettuccine Alfredo** — homemade sauce; Mom & Daughter favorite (use GF pasta)
- **Steak** — family favorite, various cuts and preparations
- **Grilled/marinated pork** — tenderloin, ham
- **Crockpot crack chicken** — family favorite dump-and-go meal

## Meal History

### Week of Feb 2–8, 2026
| Day            | Meal                                              |
|----------------|---------------------------------------------------|
| Mon Feb 2      | Crockpot Crack Chicken over Rice                  |
| Tue Feb 3      | Chicken Burrito Bowls                              |
| Wed Feb 4      | GF Fettuccine Alfredo with Garlic Butter Broccoli  |
| Thu Feb 5      | Honey Garlic Salmon with Steamed Green Beans       |
| Fri Feb 6      | Crockpot Chicken Tortilla Soup (corn chips)        |
| Sat Feb 7      | Crockpot Salsa Verde Chicken Tacos (corn tortillas)|
| Sun Feb 8      | Teriyaki Chicken Rice Bowls                        |

### Week of Feb 9–15, 2026
| Day            | Meal                                              |
|----------------|---------------------------------------------------|
| Mon Feb 9      | Steak Fajita Rice Bowls                            |
| Tue Feb 10     | Crockpot Beef Stew (GF)                            |
| Wed Feb 11     | Marinated Pork Tenderloin with Roasted Sweet Potato|
| Thu Feb 12     | Lemon Herb Chicken with Roasted Asparagus          |
| Fri Feb 13     | Shrimp Tacos (corn tortillas)                      |
| Sat Feb 14     | Crockpot Italian Sausage & Peppers over Rice       |
| Sun Feb 15     | GF Fettuccine Alfredo with Garlic Butter Broccoli  |

## Website (kevinvanleer.com/meal-planning)

- **Stack**: JSON data + Mustache templates + gh-pages deployment
- **Directory**: `www/` contains the static site source
- **Workflow**: Plan meals → `weeks/YYYY-MM-DD.txt` → `npm run generate` (in www/) → `npm run deploy`
- **Data format**: `www/content/*.json` generated from `weeks/*.txt`, validated against `www/content/week.schema.json`
- **Never edit JSON directly** — always edit `weeks/*.txt` then run `npm run generate`
- **Build**: `npm run build` validates JSON, compiles Mustache templates to `www/dist/`
- **Deploy**: `npm run deploy` builds and pushes `dist/` to gh-pages branch

## Saved Recipes

### Slow Cooker Crack Chicken
[Source](https://www.themagicalslowcooker.com/wprm_print/slow-cooker-crack-chicken) | Serves 6 | Prep 10 min | Cook 7 hrs (LOW)
- 2 lb boneless skinless chicken thighs
- 1 oz packet ranch seasoning mix
- 16 oz cream cheese
- 8 slices bacon (cooked and sliced)
- 1½ cups shredded cheddar cheese
- ½ cup sliced green onions
- Place chicken in slow cooker, sprinkle ranch seasoning, top with cream cheese. Cook LOW 7 hrs. Shred chicken, stir in cream cheese and bacon, top with cheddar, cover 10 min to melt. Serve over rice, baked potatoes, or GF rolls.
