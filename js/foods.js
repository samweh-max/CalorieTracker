// Samslimmer — food sources: built-in basics, Open Food Facts (UK/Canada), Canadian Nutrient File.
import { state } from './store.js';

const OZ = 28.35;

/* Built-in everyday foods. Values per 100 g (or 100 ml for drinks), typical averages.
   [name, kcal, protein, carbs, fat, fibre, sugar, sat fat, salt, 'unit label:grams|…', flags] flags: L = liquid */
const BASIC_ROWS = [
  // fruit
  ['Apple, raw', 52, 0.3, 11.8, 0.2, 2.4, 10.4, 0, 0, 'small (100 g):100|medium (150 g):150|large (200 g):200'],
  ['Banana', 89, 1.1, 20.3, 0.3, 2.6, 12.2, 0.1, 0, 'small (90 g):90|medium (120 g):120|large (150 g):150'],
  ['Orange', 47, 0.9, 9.4, 0.1, 2.4, 9.4, 0, 0, 'medium (140 g):140'],
  ['Satsuma / clementine', 47, 0.9, 10.5, 0.2, 1.7, 9.2, 0, 0, 'fruit (75 g):75'],
  ['Grapes', 69, 0.7, 17.2, 0.2, 0.9, 15.5, 0.1, 0, 'handful (80 g):80|cup (150 g):150'],
  ['Strawberries', 32, 0.7, 5.7, 0.3, 2, 4.9, 0, 0, 'handful (80 g):80|cup (150 g):150'],
  ['Blueberries', 57, 0.7, 12.1, 0.3, 2.4, 10, 0, 0, 'handful (80 g):80|cup (148 g):148'],
  ['Raspberries', 52, 1.2, 5.4, 0.7, 6.5, 4.4, 0, 0, 'handful (80 g):80|cup (123 g):123'],
  ['Pear', 57, 0.4, 12.1, 0.1, 3.1, 9.8, 0, 0, 'medium (170 g):170'],
  ['Avocado', 160, 2, 1.8, 14.7, 6.7, 0.7, 2.1, 0, 'half (75 g):75|whole (150 g):150'],
  ['Mango', 60, 0.8, 13.4, 0.4, 1.6, 13.7, 0.1, 0, 'cup (165 g):165'],
  ['Pineapple', 50, 0.5, 11.7, 0.1, 1.4, 9.9, 0, 0, 'slice (80 g):80|cup (165 g):165'],
  ['Watermelon', 30, 0.6, 7.2, 0.2, 0.4, 6.2, 0, 0, 'slice (280 g):280|cup (150 g):150'],
  ['Kiwi fruit', 61, 1.1, 11.7, 0.5, 3, 9, 0, 0, 'fruit (75 g):75'],
  ['Raisins', 299, 3.1, 75.3, 0.5, 3.7, 59, 0.1, 0.03, 'tbsp (10 g):10|small box (14 g):14'],
  // veg
  ['Broccoli, boiled', 35, 2.4, 3.9, 0.4, 3.3, 1.4, 0.1, 0.1, 'portion (80 g):80|cup (156 g):156'],
  ['Carrot, raw', 41, 0.9, 6.8, 0.2, 2.8, 4.7, 0, 0.2, 'medium (60 g):60'],
  ['Spinach, raw', 23, 2.9, 1.4, 0.4, 2.2, 0.4, 0.1, 0.2, 'handful (30 g):30'],
  ['Tomato, raw', 18, 0.9, 2.7, 0.2, 1.2, 2.6, 0, 0, 'medium (120 g):120|cherry tomato (15 g):15'],
  ['Cucumber', 15, 0.7, 3.1, 0.1, 0.5, 1.7, 0, 0, 'slice (7 g):7|cup sliced (120 g):120'],
  ['Onion', 40, 1.1, 7.6, 0.1, 1.7, 4.2, 0, 0, 'medium (150 g):150'],
  ['Peas, frozen, boiled', 79, 5.4, 9, 0.4, 5.1, 5.7, 0.1, 0, 'portion (80 g):80'],
  ['Sweetcorn', 86, 3.3, 16.3, 1.4, 2.7, 6.3, 0.2, 0, 'portion (80 g):80|cup (150 g):150'],
  ['Potato, boiled', 87, 1.9, 18.2, 0.1, 1.8, 0.9, 0, 0, 'small (120 g):120|medium (175 g):175'],
  ['Sweet potato, baked', 90, 2, 17.4, 0.2, 3.3, 6.5, 0, 0.1, 'medium (150 g):150'],
  ['Oven chips', 162, 2.7, 25, 4.5, 2.6, 0.5, 0.6, 0.1, 'portion (150 g):150'],
  ['Mushrooms', 22, 3.1, 2.3, 0.3, 1, 2, 0, 0, 'handful (80 g):80'],
  ['Pepper (bell)', 31, 1, 3.9, 0.3, 2.1, 4.2, 0, 0, 'whole (160 g):160'],
  ['Lettuce / salad leaves', 15, 1.4, 1.6, 0.2, 1.3, 0.8, 0, 0, 'handful (30 g):30|bowl (80 g):80'],
  ['Green beans', 31, 1.8, 4.3, 0.2, 2.7, 3.3, 0, 0, 'portion (80 g):80'],
  ['Cauliflower', 25, 1.9, 3, 0.3, 2, 1.9, 0.1, 0.1, 'portion (80 g):80'],
  ['Courgette / zucchini', 17, 1.2, 2.1, 0.3, 1, 2.5, 0.1, 0, 'medium (200 g):200'],
  ['Baked beans in tomato sauce', 79, 4.7, 9.2, 0.4, 3.7, 4.9, 0.1, 0.6, 'half can (207 g):207|can (415 g):415'],
  // grains
  ['White rice, cooked', 130, 2.7, 27.6, 0.3, 0.4, 0.1, 0.1, 0, 'cup (160 g):160|portion (180 g):180'],
  ['Brown rice, cooked', 123, 2.7, 24, 1, 1.6, 0.4, 0.2, 0, 'cup (160 g):160|portion (180 g):180'],
  ['White rice, dry', 360, 7, 78, 0.6, 1, 0.1, 0.2, 0, 'portion (75 g):75|cup (185 g):185'],
  ['Pasta, cooked', 158, 5.8, 29.2, 0.9, 1.8, 0.6, 0.2, 0, 'portion (180 g):180|cup (140 g):140'],
  ['Pasta, dry', 359, 12.5, 69, 1.5, 3, 3.5, 0.3, 0, 'portion (75 g):75'],
  ['Porridge oats, dry', 379, 13, 60, 7, 9.5, 1, 1.2, 0, 'serving (40 g):40|cup (80 g):80'],
  ['White bread', 235, 9, 44, 2, 2.5, 3.5, 0.4, 1, 'slice (40 g):40|thick slice (44 g):44'],
  ['Wholemeal bread', 217, 10, 37, 2.5, 7, 3, 0.5, 1, 'slice (40 g):40'],
  ['Bagel, plain', 257, 10, 48, 1.5, 2.5, 6, 0.4, 1.1, 'bagel (85 g):85'],
  ['Tortilla wrap', 300, 8.5, 47, 7, 3, 2.5, 3, 1.2, 'wrap (62 g):62'],
  ['Crumpet', 185, 6, 36, 0.9, 2, 1.6, 0.2, 1.2, 'crumpet (55 g):55'],
  ['Cornflakes', 378, 7, 81, 0.9, 3, 8, 0.2, 1.1, 'bowl (30 g):30'],
  ['Wheat biscuits (e.g. Weetabix)', 362, 12, 59, 2, 10, 4.4, 0.6, 0.28, 'biscuit (18.75 g):18.75'],
  ['Granola', 450, 10, 53, 18, 7, 20, 4, 0.1, 'serving (45 g):45'],
  ['Couscous, cooked', 112, 3.8, 21.6, 0.2, 1.4, 0.1, 0, 0, 'cup (160 g):160'],
  ['Quinoa, cooked', 120, 4.4, 18.5, 1.9, 2.8, 0.9, 0.2, 0, 'cup (185 g):185'],
  ['Egg noodles, cooked', 138, 4.5, 24, 2, 1.2, 0.4, 0.4, 0.1, 'portion (180 g):180'],
  // protein
  ['Chicken breast, grilled', 165, 31, 0, 3.6, 0, 0, 1, 0.2, 'portion (100 g):100|breast (150 g):150'],
  ['Chicken breast, raw', 110, 24, 0, 1.3, 0, 0, 0.4, 0.15, 'breast (170 g):170'],
  ['Chicken thigh, cooked', 209, 26, 0, 10.9, 0, 0, 3, 0.2, 'thigh (70 g):70'],
  ['Beef mince, lean, cooked', 210, 27, 0, 11, 0, 0, 4.5, 0.2, 'portion (125 g):125'],
  ['Beef mince 20% fat, raw', 254, 17, 0, 20, 0, 0, 8, 0.2, 'portion (125 g):125|pack (500 g):500'],
  ['Sirloin steak, grilled', 206, 29, 0, 9.6, 0, 0, 4, 0.15, 'steak (200 g):200'],
  ['Pork chop, grilled', 231, 29, 0, 12.6, 0, 0, 4.5, 0.15, 'chop (150 g):150'],
  ['Bacon, back, grilled', 287, 23, 0, 21, 0, 0, 8, 3, 'rasher (25 g):25'],
  ['Pork sausage, grilled', 294, 14, 9, 22, 1, 1.5, 8, 1.8, 'sausage (45 g):45'],
  ['Ham, sliced', 107, 18, 1.4, 3.3, 0, 1, 1.1, 2.2, 'slice (15 g):15'],
  ['Salmon fillet, baked', 206, 22, 0, 13, 0, 0, 2.5, 0.15, 'fillet (120 g):120'],
  ['Tuna in water, drained', 116, 26, 0, 0.8, 0, 0, 0.2, 0.8, 'can, drained (112 g):112'],
  ['Cod, baked', 105, 23, 0, 0.9, 0, 0, 0.2, 0.3, 'fillet (140 g):140'],
  ['Prawns, cooked', 99, 24, 0, 0.3, 0, 0, 0.1, 1, 'handful (60 g):60'],
  ['Egg, boiled', 155, 13, 1.1, 11, 0, 1.1, 3.3, 0.3, 'medium egg (50 g):50|large egg (60 g):60'],
  ['Egg, fried', 196, 13.6, 0.8, 15, 0, 0.4, 4.3, 0.4, 'egg (60 g):60'],
  ['Scrambled eggs (with milk)', 160, 11, 1.6, 12, 0, 1.4, 4.5, 0.6, 'portion (120 g):120'],
  ['Tofu, firm', 144, 15.5, 0.5, 8.7, 2.3, 0.6, 1.3, 0, 'portion (100 g):100'],
  ['Lentils, boiled', 116, 9, 12, 0.4, 7.9, 1.8, 0.1, 0, 'portion (80 g):80|cup (200 g):200'],
  ['Chickpeas, canned, drained', 139, 7.2, 16.1, 2.6, 6.4, 0.3, 0.3, 0.6, 'half can (120 g):120'],
  ['Kidney beans, canned', 109, 7, 11.6, 0.5, 6.4, 1, 0.1, 0.5, 'half can (120 g):120'],
  ['Hummus', 290, 7.5, 9, 25, 6, 0.5, 2.3, 0.9, 'tbsp (30 g):30|pot (200 g):200'],
  ['Peanut butter', 597, 25, 13, 50, 6, 6, 9, 0.8, 'tsp (5 g):5|tbsp (16 g):16'],
  ['Almonds', 579, 21, 9.5, 50, 12.5, 4.4, 3.8, 0, 'handful (30 g):30'],
  ['Walnuts', 654, 15, 7, 65, 6.7, 2.6, 6.1, 0, 'handful (30 g):30'],
  ['Cashews', 553, 18, 27, 44, 3.3, 5.9, 7.8, 0, 'handful (30 g):30'],
  // dairy
  ['Milk, semi-skimmed (2%)', 46, 3.5, 4.7, 1.7, 0, 4.7, 1.1, 0.1, 'splash in tea (30 ml):30|glass (200 ml):200|cup (250 ml):250|pint (568 ml):568', 'L'],
  ['Milk, whole (3.25%)', 64, 3.4, 4.7, 3.6, 0, 4.7, 2.3, 0.1, 'splash in tea (30 ml):30|glass (200 ml):200|cup (250 ml):250|pint (568 ml):568', 'L'],
  ['Milk, skimmed', 34, 3.5, 4.8, 0.2, 0, 4.8, 0.1, 0.1, 'splash in tea (30 ml):30|glass (200 ml):200|cup (250 ml):250', 'L'],
  ['Oat drink', 45, 1, 6.6, 1.5, 0.8, 4, 0.2, 0.1, 'splash (30 ml):30|glass (200 ml):200', 'L'],
  ['Cheddar cheese', 416, 25, 0.1, 34.9, 0, 0.1, 21.7, 1.8, 'slice (20 g):20|matchbox size (30 g):30'],
  ['Mozzarella', 254, 18.6, 1, 19.6, 0, 1, 13, 0.6, 'portion (30 g):30|ball (125 g):125'],
  ['Feta', 264, 14, 4, 21, 0, 4, 15, 2.7, 'portion (30 g):30'],
  ['Greek yoghurt, 0% fat', 54, 10, 3.4, 0.2, 0, 3.4, 0.1, 0.1, 'tbsp (17 g):17|pot (150 g):150|cup (245 g):245'],
  ['Greek style yoghurt, full fat', 133, 5.7, 4.8, 10.2, 0, 4.8, 6.8, 0.1, 'tbsp (17 g):17|pot (150 g):150'],
  ['Natural yoghurt, low fat', 63, 5.3, 7, 1.5, 0, 7, 1, 0.2, 'pot (125 g):125'],
  ['Butter', 744, 0.6, 0.6, 82, 0, 0.6, 52, 1.2, 'thin spread (7 g):7|tsp (5 g):5|tbsp (14 g):14'],
  ['Vanilla ice cream', 207, 3.5, 24, 11, 0.7, 21, 6.8, 0.2, 'scoop (60 g):60'],
  // fats, sauces, sweet
  ['Olive oil', 899, 0, 0, 99.9, 0, 0, 14, 0, 'tsp (4.5 g):4.5|tbsp (13.5 g):13.5'],
  ['Mayonnaise', 691, 1, 1.3, 75.6, 0, 1.3, 5.7, 1.5, 'tbsp (15 g):15'],
  ['Ketchup', 112, 1.2, 26, 0.1, 0.3, 22, 0, 1.8, 'tbsp (15 g):15'],
  ['Honey', 304, 0.3, 82, 0, 0.2, 82, 0, 0, 'tsp (7 g):7|tbsp (21 g):21'],
  ['Maple syrup', 260, 0, 67, 0, 0, 60, 0, 0, 'tbsp (20 g):20'],
  ['Sugar', 400, 0, 100, 0, 0, 100, 0, 0, 'tsp (4 g):4'],
  ['Jam', 250, 0.4, 62, 0.1, 1, 60, 0, 0, 'tsp (7 g):7|tbsp (15 g):15'],
  // snacks
  ['Crisps / chips, ready salted', 530, 6, 52, 32, 4.4, 0.5, 2.6, 1.2, 'bag (25 g):25|bag (32.5 g):32.5'],
  ['Milk chocolate', 535, 7.7, 57, 30, 2.1, 56, 18, 0.2, 'square (6 g):6|bar (45 g):45'],
  ['Dark chocolate 70%', 598, 7.8, 36, 43, 11, 24, 24, 0, 'square (10 g):10'],
  ['Digestive biscuit', 483, 7, 62, 21, 4, 17, 9.8, 0.95, 'biscuit (15 g):15'],
  ['Rice cake', 387, 8, 81, 3, 4, 0.5, 0.6, 0.5, 'cake (8 g):8'],
  ['Protein bar (typical)', 360, 30, 35, 12, 6, 5, 5, 0.4, 'bar (60 g):60'],
  // drinks
  ['Coffee, black', 2, 0.1, 0, 0, 0, 0, 0, 0, 'mug (250 ml):250', 'L'],
  ['Tea with semi-skimmed milk', 7, 0.4, 0.6, 0.2, 0, 0.6, 0.1, 0, 'mug (250 ml):250', 'L'],
  ['Latte, semi-skimmed milk', 40, 2.7, 4, 1.4, 0, 4, 0.9, 0.1, 'small (250 ml):250|medium (350 ml):350|large (450 ml):450', 'L'],
  ['Orange juice', 45, 0.7, 10, 0.2, 0.2, 8.4, 0, 0, 'small glass (150 ml):150|glass (250 ml):250', 'L'],
  ['Cola', 42, 0, 10.6, 0, 0, 10.6, 0, 0, 'can (330 ml):330|bottle (500 ml):500', 'L'],
  ['Diet cola', 0.4, 0, 0, 0, 0, 0, 0, 0.02, 'can (330 ml):330|bottle (500 ml):500', 'L'],
  ['Lager / beer (4%)', 41, 0.3, 3, 0, 0, 0.2, 0, 0, 'bottle (330 ml):330|can (440 ml):440|pint (568 ml):568', 'L'],
  ['Red wine', 85, 0.1, 2.6, 0, 0, 0.6, 0, 0, 'small glass (125 ml):125|medium glass (175 ml):175|large glass (250 ml):250', 'L'],
  ['White wine', 82, 0.1, 2.6, 0, 0, 1, 0, 0, 'small glass (125 ml):125|medium glass (175 ml):175|large glass (250 ml):250', 'L'],
  // meals
  ['Pizza, margherita', 250, 11, 28, 9.5, 2, 3, 4.5, 1.2, 'slice (100 g):100|whole 12" (400 g):400'],
  ['Beef lasagne', 135, 7.5, 12, 6, 1.1, 2.3, 2.8, 0.6, 'portion (400 g):400'],
  ['Poutine', 227, 6, 22, 12, 2, 0.5, 5, 1.1, 'small (300 g):300|regular (500 g):500']
];

function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

function stdUnits(units, liquid) {
  const extra = liquid ? [{ label: 'Millilitres', short: 'ml', g: 1 }, { label: 'Fluid ounces', short: 'fl oz', g: 29.57 }]
    : [{ label: 'Grams', short: 'g', g: 1 }, { label: 'Ounces', short: 'oz', g: OZ }];
  return units.concat(extra.filter(x => !units.some(u => u.short === x.short)));
}
export function unitShort(label) { return label.split(' (')[0]; }

export const BASICS = BASIC_ROWS.map(r => {
  const liquid = r[10] === 'L';
  const units = r[9].split('|').map(s => { const [label, g] = s.split(':'); return { label, short: unitShort(label), g: parseFloat(g) }; });
  return {
    id: 'g:' + slug(r[0]), name: r[0], src: 'generic', liquid,
    per: { kcal: r[1], p: r[2], c: r[3], f: r[4], fib: r[5], sug: r[6], sat: r[7], salt: r[8] },
    units: stdUnits(units, liquid)
  };
});

export const SRC = {
  generic: { label: 'Generic', bg: 'var(--src-gen-bg)', fg: 'var(--src-gen-fg)' },
  off_uk: { label: 'UK product', bg: 'var(--src-uk-bg)', fg: 'var(--src-uk-fg)' },
  off_ca: { label: 'Canadian product', bg: 'var(--src-ca-bg)', fg: 'var(--src-ca-fg)' },
  off: { label: 'Product', bg: 'var(--src-gen-bg)', fg: 'var(--src-gen-fg)' },
  cnf: { label: 'Canadian Nutrient File', bg: 'var(--src-ca-bg)', fg: 'var(--src-ca-fg)' },
  mine: { label: 'My food', bg: 'var(--src-mine-bg)', fg: 'var(--src-mine-fg)' },
  recipe: { label: 'My recipe', bg: '#FFEBD2', fg: '#92400E' }
};

/* ---------- local search ---------- */
function words(q) { return q.toLowerCase().split(/[^a-z0-9%]+/).filter(Boolean); }
function score(food, ws) {
  const name = (food.name + ' ' + (food.brand || '')).toLowerCase();
  let s = 0;
  for (const w of ws) {
    const i = name.indexOf(w);
    if (i < 0) return -1;
    s += i === 0 ? 3 : (name[i - 1] === ' ' || name[i - 1] === '(' ? 2 : 1);
  }
  return s;
}

// Every food we know about: most used first, then everything else A–Z.
export function allFoods() {
  const lib = Object.values(state.foods);
  const seen = new Set(lib.map(f => f.id));
  const everything = lib.concat(BASICS.filter(f => !seen.has(f.id)));
  const used = everything.filter(f => (f.used || 0) > 0).sort((a, b) => (b.used || 0) - (a.used || 0) || a.name.localeCompare(b.name));
  const rest = everything.filter(f => !(f.used > 0)).sort((a, b) => a.name.localeCompare(b.name));
  return { used, rest };
}

export function localSearch(q, tab) {
  const ws = words(q);
  const lib = Object.values(state.foods);
  let pool;
  if (tab === 'mine') pool = lib.filter(f => f.src === 'mine');
  else if (tab === 'recipes') pool = lib.filter(f => f.src === 'recipe').sort((a, b) => (b.used || 0) - (a.used || 0));
  else if (tab === 'recent') pool = state.recents.map(id => state.foods[id]).filter(Boolean);
  else {
    const seen = new Set(lib.map(f => f.id));
    pool = lib.concat(BASICS.filter(f => !seen.has(f.id)));
  }
  if (!ws.length) {
    if (tab === 'all') {
      const rec = state.recents.map(id => state.foods[id]).filter(Boolean);
      if (rec.length) return rec.slice(0, 20);
      // A varied starter list: one of each kind of food, then a second round.
      const seenCat = {}, first = [], second = [];
      BASICS.forEach(f => { const c = catOf(f); seenCat[c] = (seenCat[c] || 0) + 1; (seenCat[c] === 1 ? first : seenCat[c] === 2 ? second : []).push(f); });
      return first.concat(second).slice(0, 24);
    }
    return pool;
  }
  return pool.map(f => ({ f, base: score(f, ws) }))
    .filter(x => x.base >= 0)
    .map(x => ({ f: x.f, s: x.base + (x.f.src === 'recipe' ? 5 : x.f.src === 'mine' ? 4 : 0) + Math.min(x.f.used || 0, 5) })).sort((a, b) => b.s - a.s).map(x => x.f).slice(0, 30);
}

/* ---------- Open Food Facts ---------- */
const OFF_COUNTRY = { UK: 'en:united-kingdom', CA: 'en:canada' };
const offCache = new Map();
let lastOffCall = 0;

function num(v) { const n = parseFloat(v); return isNaN(n) ? 0 : n; }

export function offToFood(p, country) {
  const n = p.nutriments || {};
  let kcal = n['energy-kcal_100g'];
  if (kcal == null && n['energy_100g'] != null) kcal = n['energy_100g'] / 4.184;
  if (kcal == null || !p.product_name) return null;
  const liquid = /ml|cl|\bl\b|litre|liter/i.test(p.quantity || '') && !/g\b/i.test(p.quantity || '');
  const units = [];
  const sq = num(p.serving_quantity);
  if (sq > 0) units.push({ label: 'Serving (' + (p.serving_size || (sq + (liquid ? ' ml' : ' g'))) + ')', short: 'servings', g: sq });
  const pq = num(p.product_quantity);
  if (pq > 0 && pq !== sq && pq < 3000) units.push({ label: 'Whole pack (' + Math.round(pq) + (liquid ? ' ml' : ' g') + ')', short: 'packs', g: pq });
  const salt = n['salt_100g'] != null ? num(n['salt_100g']) : num(n['sodium_100g']) * 2.5;
  const tags = p.countries_tags || [];
  const src = tags.indexOf(OFF_COUNTRY[country]) >= 0 ? (country === 'CA' ? 'off_ca' : 'off_uk') : 'off';
  return {
    id: 'off:' + p.code, code: p.code, name: p.product_name.trim(), brand: (p.brands || '').split(',')[0].trim(), src, liquid,
    per: { kcal: Math.round(num(kcal)), p: num(n['proteins_100g']), c: num(n['carbohydrates_100g']), f: num(n['fat_100g']),
           fib: num(n['fiber_100g']), sug: num(n['sugars_100g']), sat: num(n['saturated-fat_100g']), salt },
    units: stdUnits(units, liquid)
  };
}

const OFF_FIELDS = 'code,product_name,brands,nutriments,serving_size,serving_quantity,product_quantity,quantity,countries_tags';

export async function offSearch(q, country, signal) {
  const key = country + '|' + q.toLowerCase();
  if (offCache.has(key)) return offCache.get(key);
  // Open Food Facts asks apps to keep search calls gentle (about 10 a minute).
  const wait = Math.max(0, 1500 - (Date.now() - lastOffCall));
  if (wait) await new Promise(r => setTimeout(r, wait));
  if (signal && signal.aborted) throw new DOMException('aborted', 'AbortError');
  lastOffCall = Date.now();
  const url = 'https://world.openfoodfacts.org/cgi/search.pl?action=process&json=1&search_simple=1&page_size=24' +
    '&search_terms=' + encodeURIComponent(q) +
    '&tagtype_0=countries&tag_contains_0=contains&tag_0=' + encodeURIComponent(OFF_COUNTRY[country]) +
    '&fields=' + OFF_FIELDS;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error('Open Food Facts error ' + res.status);
  const data = await res.json();
  const seen = new Set();
  const foods = (data.products || []).map(p => offToFood(p, country)).filter(f => {
    if (!f) return false;
    const k = (f.name + '|' + f.brand + '|' + f.per.kcal).toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k); return true;
  });
  offCache.set(key, foods);
  return foods;
}

export async function offBarcode(code, country) {
  const res = await fetch('https://world.openfoodfacts.org/api/v2/product/' + encodeURIComponent(code) + '.json?fields=' + OFF_FIELDS);
  if (!res.ok) throw new Error('not found');
  const data = await res.json();
  if (data.status !== 1 || !data.product) return null;
  return offToFood(Object.assign({ code }, data.product), country);
}

/* ---------- Canadian Nutrient File (Health Canada) ---------- */
const CNF = 'https://food-nutrition.canada.ca/api/canadian-nutrient-file/';
const CNF_LIST_KEY = 'samslimmer.cnf.list';
let cnfList = null, cnfFailed = false;

async function cnfLoadList() {
  if (cnfList) return cnfList;
  try { const c = localStorage.getItem(CNF_LIST_KEY); if (c) { cnfList = JSON.parse(c); return cnfList; } } catch (e) {}
  const res = await fetch(CNF + 'food/?lang=en&type=json');
  if (!res.ok) throw new Error('CNF ' + res.status);
  const data = await res.json();
  cnfList = data.map(d => [d.food_code, d.food_description]);
  try { localStorage.setItem(CNF_LIST_KEY, JSON.stringify(cnfList)); } catch (e) {}
  return cnfList;
}

export function cnfAvailable() { return !cnfFailed; }

export async function cnfSearch(q) {
  if (cnfFailed) return [];
  try {
    const list = await cnfLoadList();
    const ws = words(q);
    return list.map(([code, name]) => ({ code, name, s: score({ name }, ws) }))
      .filter(x => x.s >= 0).sort((a, b) => b.s - a.s || a.name.length - b.name.length).slice(0, 12)
      .map(x => ({ id: 'cnf:' + x.code, code: x.code, name: x.name, src: 'cnf', partial: true }));
  } catch (e) { cnfFailed = true; console.warn('Canadian Nutrient File unavailable', e); return []; }
}

const CNF_IDS = { 208: 'kcal', 203: 'p', 205: 'c', 204: 'f', 291: 'fib', 269: 'sug', 606: 'sat', 307: 'sodium' };
export async function cnfDetails(food) {
  const [amounts, servings] = await Promise.all([
    fetch(CNF + 'nutrientamount/?lang=en&type=json&id=' + food.code).then(r => r.json()),
    fetch(CNF + 'servingsize/?lang=en&type=json&id=' + food.code).then(r => r.json()).catch(() => [])
  ]);
  const per = { kcal: 0, p: 0, c: 0, f: 0, fib: 0, sug: 0, sat: 0, salt: 0 };
  (amounts || []).forEach(a => {
    const k = CNF_IDS[a.nutrient_name_id];
    if (k === 'sodium') per.salt = num(a.nutrient_value) * 2.5 / 1000;
    else if (k) per[k] = num(a.nutrient_value);
  });
  per.kcal = Math.round(per.kcal);
  const units = (servings || []).filter(s => num(s.conversion_factor_value) > 0).slice(0, 6)
    .map(s => { const g = Math.round(num(s.conversion_factor_value) * 1000) / 10; const label = s.measure_name + ' (' + g + ' g)'; return { label, short: unitShort(s.measure_name), g }; });
  return Object.assign({}, food, { partial: false, per, units: stdUnits(units, false) });
}

export const ATTRIBUTION = 'Food data: Open Food Facts (ODbL) · Canadian Nutrient File, Health Canada (Open Government Licence – Canada) · built-in typical values';

/* ---------- food icons ---------- */
// Each category: [stroke-svg-inner, tile background, icon colour]
export const CATS = {
  fruit: ['<path d="M12 7c-3-2-8-1-8 5 0 5 3 9 5 9 1 0 2-.6 3-.6s2 .6 3 .6c2 0 5-4 5-9 0-6-5-7-8-5z"/><path d="M12 7c0-2 1-4 3-4"/>', '#FDECEC', '#B91C1C'],
  veg: ['<path d="M5 19c0-8.5 6-14 15-14 0 9-6 15-14.5 15z"/><path d="M5 19 14 10M10 14.5h3.5M9 11v3"/>', '#E7F6EC', '#15803D'],
  bread: ['<path d="M5 10.5A3.5 3.5 0 0 1 7 4h10a3.5 3.5 0 0 1 2 6.5V20H5z"/><path d="M9 13h.01M13 15h.01"/>', '#FEF3E2', '#B45309'],
  grain: ['<path d="M3 11h18a9 9 0 0 1-18 0z"/><path d="M8 8c0-1.5 1-2.5 2-3M12 8c0-1.5 1-2.5 2-3M16 8c0-1 .5-2 1-2.5"/>', '#FEF7E0', '#A16207'],
  meat: ['<path d="M15.5 3.5a5 5 0 0 1 5 5c0 3.5-3.5 5.5-6.5 5.5l-4.5 4.5a2 2 0 1 1-3-.9 2 2 0 1 1-.9-3l4.5-4.5c0-3 2-6.6 5.4-6.6z"/>', '#FCE7EC', '#BE123C'],
  fish: ['<path d="M2 12c3-5 9-6 14-3l5-3v12l-5-3c-5 3-11 2-14-3z"/><circle cx="7" cy="11" r=".8" fill="currentColor"/>', '#E3F0FB', '#1D4ED8'],
  egg: ['<path d="M12 3c4 0 7 7 7 11a7 7 0 0 1-14 0c0-4 3-11 7-11z"/>', '#FEF9C3', '#A16207'],
  dairy: ['<path d="M8 2h8v4l2 3v13H6V9l2-3z"/><path d="M6 10h12M8 6h8"/>', '#EAF2FD', '#2563EB'],
  cheese: ['<path d="M3 18v-7l13-6 5 6v7z"/><path d="M3 11h18"/><circle cx="9" cy="14.5" r="1"/><circle cx="15.5" cy="14" r=".8"/>', '#FEF6D8', '#A16207'],
  nut: ['<path d="M8 3.5a4.5 4.5 0 0 1 4.5 4.5 3.5 3.5 0 0 0 3.5 3.5A4.5 4.5 0 1 1 11.5 16 3.5 3.5 0 0 0 8 12.5a4.5 4.5 0 0 1 0-9z"/>', '#F5EBE0', '#92400E'],
  snack: ['<path d="M6 3h12l-1 3 1 15H6l1-15z"/><path d="M9 11c1 1 2 1 3 0s2-1 3 0"/>', '#FFEDD5', '#C2410C'],
  sweet: ['<circle cx="12" cy="12" r="9"/><circle cx="9" cy="9" r="1" fill="currentColor"/><circle cx="15" cy="11" r="1" fill="currentColor"/><circle cx="10.5" cy="15" r="1" fill="currentColor"/>', '#FCE7F3', '#BE185D'],
  hot: ['<path d="M4 9h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M17 11h1a3 3 0 0 1 0 6h-1M8 3v3M12 3v3"/>', '#F3EDE7', '#78350F'],
  drink: ['<path d="M6 7h12l-1.5 14h-9z"/><path d="M12 7l2-5h3M6.5 12h11"/>', '#E0F5FA', '#0E7490'],
  alcohol: ['<path d="M7 2h10v5a5 5 0 0 1-10 0z"/><path d="M12 12v8M8 21h8M7 6h10"/>', '#F3E8FF', '#7E22CE'],
  oil: ['<path d="M10 2h4v4l2 3v13H8V9l2-3z"/><path d="M8 14h8"/>', '#ECF4E4', '#4D7C0F'],
  pizza: ['<path d="M12 3 3.5 20c5.5 1.6 11.5 1.6 17 0z"/><path d="M5.5 16c4 1 9 1 13 0"/><circle cx="11" cy="12" r="1"/><circle cx="13.5" cy="16" r="1"/>', '#FEECDC', '#C2410C'],
  recipe: ['<path d="M4 10h16v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/><path d="M2 10h20M9 6c0-1 1-1 1-2M14 6c0-1 1-1 1-2"/>', '#FFEBD2', '#92400E'],
  meal: ['<circle cx="12" cy="13" r="7"/><circle cx="12" cy="13" r="3.5"/><path d="M3 3v5M5 3v5M4 8v13M21 3c-1.5 1-2 3-2 5h2v13"/>', '#EEF1F1', '#3D4B50']
};
const CAT_RULES = [
  ['alcohol', /\b(wine|beer|lager|cider|ale|stout|vodka|gin|rum|whisk(e)?y|prosecco|champagne|cocktail)\b/],
  ['hot', /\b(coffee|latte|cappuccino|espresso|mocha|americano|tea|hot chocolate)\b/],
  ['snack', /(rice cake|crispbread)/],
  ['grain', /(weetabix|wheat biscuit|noodle|shredded wheat)/],
  ['veg', /(sweet potato|oven chips|fries|potato|wedges|green beans|runner beans|hash brown)/],
  ['sweet', /(chocolate|biscuit|cookie|cake|ice cream|sweets?\b|candy|donut|doughnut|brownie|\bjam\b|honey|sugar|syrup|dessert|pudding|muffin|flapjack|digestive)/],
  ['cheese', /(cheese|cheddar|mozzarella|feta|brie|parmesan|halloumi|camembert)/],
  ['egg', /\beggs?\b|omelette/],
  ['dairy', /\b(milk|yog(h)?urt|kefir|skyr|cream|oat drink|soya drink|almond drink)\b/],
  ['fish', /(salmon|tuna|\bcod\b|prawn|shrimp|fish|haddock|mackerel|sardine|crab|seafood)/],
  ['meal', /(lasagne|lasagna|curry|tikka|masala|korma|poutine|\bpie\b|sandwich|soup|stew|chilli|bolognese|ready meal|dinner|risotto|burrito|stir fry|salad bowl|mac (and|&|n) cheese)/],
  ['meat', /(chicken|beef|pork|lamb|bacon|\bham\b|sausage|steak|turkey|mince|burger|chorizo|salami|pepperoni|meat|kebab)/],
  ['nut', /(almond|walnut|cashew|peanut|pistachio|hazelnut|\bnuts?\b|seeds?\b|hummus|lentil|chickpea|\bbeans?\b|beanz|tofu|edamame)/],
  ['snack', /(crisps|\bchips\b|popcorn|pretzel|protein bar|cereal bar|\bbar\b|cracker|ready salted|salt (and|&) vinegar|tortilla chips|nachos)/],
  ['pizza', /pizza/],
  ['bread', /(bread|toast|bagel|\bwrap\b|tortilla|crumpet|\broll\b|\bbun\b|pitta|naan|croissant|baguette)/],
  ['grain', /(\brice\b|pasta|\boats?\b|porridge|cereal|flakes|granola|wheat|couscous|quinoa|muesli|spaghetti)/],
  ['oil', /(\boil\b|mayo|mayonnaise|ketchup|sauce|dressing|butter|margarine|pesto|spread|vinegar|mustard)/],
  ['drink', /(juice|cola|soda|lemonade|smoothie|\bwater\b|drink|squash|energy drink|\bpop\b|tonic)/],
  ['fruit', /(apple|banana|orange|satsuma|clementine|grape|berry|berries|\bpear|avocado|mango|pineapple|melon|kiwi|raisin|peach|plum|cherr|lemon|lime|fruit|\bdates?\b|\bfigs?\b|apricot|nectarine)/],
  ['veg', /(broccoli|carrot|spinach|tomato|cucumber|onion|\bpeas?\b|corn|mushroom|pepper|lettuce|salad|cauliflower|courgette|zucchini|\bveg|kale|cabbage|leek|garlic|celery|beetroot|asparagus|aubergine|eggplant|sprout)/]
];
export function catOf(food) {
  if (food.cat && CATS[food.cat]) return food.cat;
  if (food.src === 'recipe' || food.recipeId) return 'recipe';
  const s = ((food.name || '') + ' ' + (food.brand || '')).toLowerCase();
  for (const [c, re] of CAT_RULES) if (re.test(s)) return c;
  return 'meal';
}
export function foodTile(food, size = 40) {
  const [d, bg, fg] = CATS[catOf(food)];
  const s = Math.round(size * 0.52);
  return `<span class="tile" style="width:${size}px;height:${size}px;--tb:${bg};--tc:${fg}" aria-hidden="true"><svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg></span>`;
}

/* ---------- extra units + favourites ---------- */
const VOL_RE = /soup|sauce|yog|milk|cream|juice|honey|syrup|dressing|ketchup|mayo|custard|kefir|smoothie|stock|broth|vinegar|\boil\b|gravy|squash|cordial|wine|beer|cider|coffee|tea\b|water|cola|lemonade|soda|shake/i;
export function canVolume(f) {
  if (f.liquid) return true;
  const c = catOf(f);
  if (['drink', 'alcohol', 'oil'].indexOf(c) >= 0) return true;
  if (['sweet', 'snack', 'bread', 'grain', 'meat', 'fish', 'egg', 'nut', 'pizza', 'cheese', 'fruit', 'recipe'].indexOf(c) >= 0) return false;
  return VOL_RE.test(f.name || '');
}
function density(f) {
  if (f.liquid) return 1;
  if (catOf(f) === 'oil' || /\boil\b|butter/i.test(f.name || '')) return 0.92;
  if (/honey|syrup|treacle/i.test(f.name || '')) return 1.4;
  return 1.03;
}
const SOLID = [['g', 'Grams', 1], ['oz', 'Ounces', 28.35], ['kg', 'Kilograms', 1000], ['lb', 'Pounds', 453.6]];
const VOL = [['ml', 'Millilitres', 1], ['l', 'Litres', 1000], ['tsp', 'Teaspoon (5 ml)', 5], ['tbsp', 'Tablespoon (15 ml)', 15], ['cup', 'Cup (250 ml)', 250], ['fl oz', 'Fluid ounces', 29.57]];
export const MEASURES = ['g', 'ml', 'oz', 'fl oz', 'kg', 'lb', 'l', 'cup', 'tbsp', 'tsp'];
export const ALL_UNITS = [['serving', 'Servings (slice, pot, pack…)'], ['g', 'Grams'], ['ml', 'Millilitres'], ['oz', 'Ounces'], ['fl oz', 'Fluid ounces'], ['cup', 'Cups'], ['tbsp', 'Tablespoons'], ['tsp', 'Teaspoons'], ['kg', 'Kilograms'], ['lb', 'Pounds'], ['l', 'Litres']];
export const DEFAULT_FAVS = ['serving', 'g', 'ml'];
export function isMeasure(u) { return !!u && MEASURES.indexOf(u.short) >= 0; }
export function startAmt(u) { return u && (u.short === 'g' || u.short === 'ml') ? 100 : 1; }
// Adds the standard weight / volume units a food is missing and puts favourite units first.
export function withUnits(food, favs) {
  favs = favs && favs.length ? favs : DEFAULT_FAVS;
  const key = favs.join(',');
  if (food._uk === key) return food;
  const base = (food.units || []).slice(), has = s => base.some(u => u.short === s);
  const want = s => ['kg', 'lb', 'l'].indexOf(s) < 0 || favs.indexOf(s) >= 0; // big units only if you've favourited them
  if (!food.liquid) SOLID.forEach(([s, l, g]) => { if (!has(s) && want(s)) base.push({ label: l, short: s, g }); });
  if (canVolume(food)) { const d = density(food); VOL.forEach(([s, l, g]) => { if (!has(s) && want(s)) base.push({ label: d === 1 ? l : l + ' ≈', short: s, g: +(g * d).toFixed(2) }); }); }
  const rank = u => { const i = favs.indexOf(MEASURES.indexOf(u.short) >= 0 ? u.short : 'serving'); return i < 0 ? 99 : i; };
  const units = base.map((u, i) => [u, i]).sort((a, b) => rank(a[0]) - rank(b[0]) || a[1] - b[1]).map(x => x[0]);
  return Object.assign({}, food, { units, _uk: key });
}
