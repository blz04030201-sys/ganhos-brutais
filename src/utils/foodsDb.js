// ── Built-in food database ────────────────────────────────────
// Values are per 100g unless unit is 'unid' or 'ml'
// c=calories, p=protein, cb=carbs, f=fat, u=default unit, alt=alternate units
export const FOODS_DB = [
  // Carnes
  {n:"Frango grelhado (peito)",c:159,p:32,cb:0,f:2.7,u:"g"},
  {n:"Frango cozido (peito)",c:173,p:31,cb:0,f:4,u:"g"},
  {n:"Peito de frango cru",c:110,p:23.1,cb:0,f:1.2,u:"g"},
  {n:"Frango desfiado",c:166,p:32,cb:0,f:3.2,u:"g"},
  {n:"Frango coxa grelhada",c:215,p:26,cb:0,f:12,u:"g"},
  {n:"Carne moída (patinho)",c:219,p:24,cb:0,f:13,u:"g"},
  {n:"Carne moída magra",c:175,p:26,cb:0,f:8,u:"g"},
  {n:"Patinho grelhado",c:188,p:28,cb:0,f:8.3,u:"g"},
  {n:"Alcatra grelhada",c:195,p:28.5,cb:0,f:9,u:"g"},
  {n:"Filé mignon grelhado",c:186,p:30,cb:0,f:7,u:"g"},
  {n:"Picanha grelhada",c:285,p:23,cb:0,f:21,u:"g"},
  {n:"Atum em lata (água)",c:116,p:26,cb:0,f:0.5,u:"g"},
  {n:"Atum em lata (óleo)",c:188,p:25,cb:0,f:10,u:"g"},
  {n:"Sardinha em lata",c:191,p:23,cb:0,f:11,u:"g"},
  {n:"Salmão grelhado",c:206,p:22,cb:0,f:13,u:"g"},
  {n:"Tilápia grelhada",c:128,p:26,cb:0,f:2.7,u:"g"},
  {n:"Camarão grelhado",c:99,p:24,cb:0.9,f:0.3,u:"g"},
  {n:"Peito de peru",c:109,p:18.5,cb:1.5,f:3,u:"g"},
  {n:"Presunto magro",c:121,p:17,cb:2,f:5,u:"g"},
  {n:"Bacon",c:541,p:37,cb:1.4,f:42,u:"g"},
  {n:"Hambúrguer (120g)",c:242,p:18,cb:0,f:18,u:"unid",g:120,alt:["g"]},
  // Ovos
  {n:"Ovo inteiro",c:143,p:12.6,cb:0.6,f:9.5,u:"unid",g:50,alt:["g"]},
  {n:"Clara de ovo",c:17,p:3.6,cb:0.2,f:0.1,u:"unid",g:33,alt:["g"]},
  {n:"Ovo cozido",c:155,p:13,cb:1.1,f:10.6,u:"unid",g:50,alt:["g"]},
  // Suplementos
  {n:"Whey Protein concentrado",c:370,p:73,cb:12,f:5,u:"g"},
  {n:"Whey Protein isolado",c:357,p:86,cb:3,f:1.5,u:"g"},
  {n:"Caseína",c:353,p:78,cb:5,f:2,u:"g"},
  {n:"Creatina",c:0,p:0,cb:0,f:0,u:"g"},
  {n:"BCAA",c:36,p:8,cb:0,f:0,u:"g"},
  {n:"Maltodextrina",c:380,p:0,cb:95,f:0,u:"g"},
  // Aveia
  {n:"Aveia em flocos finos",c:367,p:14.5,cb:62,f:7.5,u:"g"},
  {n:"Aveia em flocos grossos",c:364,p:13.2,cb:64,f:6.8,u:"g"},
  {n:"Aveia em flocos médios",c:366,p:13.9,cb:63,f:7,u:"g"},
  {n:"Farinha de aveia",c:370,p:14.8,cb:62.5,f:7.2,u:"g"},
  {n:"Farelo de aveia",c:246,p:17,cb:42,f:7,u:"g"},
  {n:"Aveia instantânea",c:366,p:13,cb:65,f:6.5,u:"g"},
  {n:"Granola",c:436,p:9.5,cb:63,f:17,u:"g"},
  {n:"Granola sem açúcar",c:398,p:10,cb:58,f:15,u:"g"},
  // Laticínios
  {n:"Leite desnatado",c:35,p:3.4,cb:5,f:0.1,u:"ml"},
  {n:"Leite semidesnatado",c:47,p:3.3,cb:5,f:1.6,u:"ml"},
  {n:"Leite integral",c:61,p:3.2,cb:4.8,f:3.3,u:"ml"},
  {n:"Leite em pó integral",c:496,p:25,cb:38,f:26,u:"g"},
  {n:"Leite em pó desnatado",c:357,p:36,cb:52,f:0.7,u:"g"},
  {n:"Iogurte grego integral",c:97,p:9,cb:5.7,f:5,u:"g"},
  {n:"Iogurte grego 0%",c:57,p:10,cb:3.5,f:0.4,u:"g"},
  {n:"Iogurte natural",c:61,p:3.5,cb:4.7,f:3.3,u:"g"},
  {n:"Queijo mussarela",c:280,p:22,cb:2.2,f:20,u:"g"},
  {n:"Queijo mussarela fatiado",c:250,p:20,cb:2,f:18,u:"unid",g:20,alt:["g"]},
  {n:"Queijo cottage",c:98,p:11,cb:3.4,f:4.3,u:"g"},
  {n:"Requeijão light",c:140,p:7.5,cb:4,f:10,u:"g"},
  {n:"Creme de ricota light",c:92,p:8,cb:4,f:4.5,u:"g"},
  {n:"Manteiga",c:717,p:0.9,cb:0.1,f:81,u:"g"},
  // Carboidratos
  {n:"Arroz branco cozido",c:128,p:2.5,cb:28,f:0.2,u:"g"},
  {n:"Arroz integral cozido",c:124,p:2.6,cb:26,f:0.9,u:"g"},
  {n:"Batata doce cozida",c:77,p:1.4,cb:18,f:0.1,u:"g"},
  {n:"Batata inglesa cozida",c:77,p:2,cb:17,f:0.1,u:"g"},
  {n:"Macarrão cozido",c:131,p:4.8,cb:26,f:0.9,u:"g"},
  {n:"Macarrão integral cozido",c:124,p:5.3,cb:25,f:0.8,u:"g"},
  {n:"Feijão carioca cozido",c:76,p:4.8,cb:13.6,f:0.5,u:"g"},
  {n:"Feijão preto cozido",c:77,p:5,cb:14,f:0.5,u:"g"},
  {n:"Lentilha cozida",c:116,p:9,cb:20,f:0.4,u:"g"},
  {n:"Grão-de-bico cozido",c:164,p:8.9,cb:27,f:2.6,u:"g"},
  {n:"Pão francês",c:300,p:9,cb:58,f:3,u:"unid",g:50,alt:["g"]},
  {n:"Pão de hambúrguer",c:270,p:8,cb:50,f:4,u:"unid",g:50,alt:["g"]},
  {n:"Pão de forma integral",c:247,p:9.4,cb:44,f:3.5,u:"unid",g:25,alt:["g"]},
  {n:"Tapioca (goma)",c:340,p:0.2,cb:85,f:0.1,u:"g"},
  {n:"Torrada",c:388,p:10,cb:72,f:6.5,u:"unid",g:10,alt:["g"]},
  {n:"Cuscuz",c:340,p:11,cb:72,f:1.3,u:"g"},
  // Frutas
  {n:"Banana prata",c:92,p:1.4,cb:23.8,f:0.1,u:"unid",g:70,alt:["g"]},
  {n:"Banana nanica",c:89,p:1.1,cb:22.8,f:0.1,u:"unid",g:100,alt:["g"]},
  {n:"Maçã",c:52,p:0.3,cb:14,f:0.2,u:"unid",g:130,alt:["g"]},
  {n:"Manga",c:65,p:0.5,cb:17,f:0.3,u:"g"},
  {n:"Melancia",c:30,p:0.6,cb:7.6,f:0.2,u:"g"},
  {n:"Morango",c:32,p:0.7,cb:7.7,f:0.3,u:"g"},
  {n:"Uva",c:69,p:0.7,cb:18,f:0.2,u:"g"},
  {n:"Laranja",c:43,p:0.9,cb:10,f:0.1,u:"unid",g:130,alt:["g"]},
  {n:"Mamão",c:45,p:0.5,cb:11.7,f:0.1,u:"g"},
  {n:"Abacaxi",c:50,p:0.5,cb:13,f:0.1,u:"g"},
  {n:"Kiwi",c:61,p:1.1,cb:15,f:0.5,u:"unid",g:70,alt:["g"]},
  {n:"Pera",c:57,p:0.4,cb:15.2,f:0.1,u:"unid",g:150,alt:["g"]},
  // Verduras & Legumes
  {n:"Brócolis",c:34,p:2.8,cb:7,f:0.4,u:"g"},
  {n:"Alface",c:15,p:1.4,cb:2.9,f:0.2,u:"g"},
  {n:"Tomate",c:18,p:0.9,cb:3.9,f:0.2,u:"g"},
  {n:"Cenoura",c:41,p:0.9,cb:10,f:0.2,u:"g"},
  {n:"Cebola",c:40,p:1.1,cb:9.3,f:0.1,u:"g"},
  {n:"Pepino",c:16,p:0.7,cb:3.6,f:0.1,u:"g"},
  {n:"Espinafre",c:23,p:2.9,cb:3.6,f:0.4,u:"g"},
  {n:"Couve",c:49,p:4.3,cb:9,f:0.9,u:"g"},
  {n:"Abobrinha",c:17,p:1.2,cb:3.1,f:0.3,u:"g"},
  // Gorduras & Óleos
  {n:"Azeite de oliva",c:884,p:0,cb:0,f:100,u:"ml"},
  {n:"Óleo de coco",c:862,p:0,cb:0,f:100,u:"g"},
  {n:"Pasta de amendoim",c:588,p:25,cb:20,f:50,u:"g"},
  {n:"Amendoim",c:567,p:25.8,cb:16,f:49,u:"g"},
  {n:"Castanha de caju",c:553,p:18,cb:30,f:44,u:"g"},
  {n:"Castanha-do-pará",c:656,p:14,cb:12,f:66,u:"unid",g:5,alt:["g"]},
  {n:"Amêndoas",c:579,p:21,cb:22,f:49,u:"g"},
  {n:"Abacate",c:160,p:2,cb:9,f:15,u:"g"},
  {n:"Creme de avelã",c:539,p:6,cb:58,f:31,u:"g"},
  // Bebidas
  {n:"Café sem açúcar",c:2,p:0.3,cb:0,f:0,u:"ml"},
  {n:"Café com leite",c:24,p:1.5,cb:2.4,f:1,u:"ml"},
  {n:"Suco de laranja",c:47,p:0.7,cb:11,f:0.2,u:"ml"},
  {n:"Água de coco",c:19,p:0.7,cb:3.7,f:0.2,u:"ml"},
  // Condimentos
  {n:"Molho de tomate",c:29,p:1.5,cb:5,f:0.4,u:"g"},
  {n:"Mel",c:304,p:0.3,cb:82,f:0,u:"g"},
  {n:"Shoyu light",c:60,p:8.6,cb:5.3,f:0.1,u:"ml"},
]

/** Find food in DB by name. Checks custom foods first (so a custom item with the
 *  same name as a built-in one wins, matching the order shown in searchFoods). */
export function findFood(name, customFoods = []) {
  const custom = customFoods.find(f => f.name === name)
  if (custom) {
    return {
      n: custom.name, c: custom.calories, p: custom.protein,
      cb: custom.carbs, f: custom.fat, u: custom.default_unit || 'g',
      isCustom: true, id: custom.id,
    }
  }
  return FOODS_DB.find(f => f.n === name) || null
}

/** Calculate macros for a food given amount and unit.
 *  IMPORTANT: food.c/p/cb/f are always stored on a per-100g (or per-100ml) basis,
 *  matching TACO/USDA tables. For "unid" (per-unit) foods, food.g holds the
 *  typical weight in grams of ONE unit, so amount×g/100 gives the real grams
 *  consumed before applying the per-100g values. This keeps "unid" and "g"
 *  representations of the same food always consistent with each other. */
export function calcMacros(food, amount, unit) {
  const a = parseFloat(amount) || 0
  const isUnit = unit === 'unid'
  const grams = isUnit ? a * (food.g || 100) : a

  return {
    cal:  Math.round((food.c * grams / 100) * 10) / 10,
    prot: Math.round((food.p * grams / 100) * 10) / 10,
    carb: Math.round((food.cb * grams / 100) * 10) / 10,
    fat:  Math.round((food.f * grams / 100) * 10) / 10,
  }
}

/** Build a food item object */
export function buildFoodItem(name, amount, unit) {
  const fd = findFood(name)
  const u = unit || fd?.u || 'g'
  const macros = fd ? calcMacros(fd, amount, u) : { cal: 0, prot: 0, carb: 0, fat: 0 }
  return { food_name: name, amount, unit: u, ...macros }
}

/** Recompute a single meal-item's macros live from the food DB/custom foods,
 *  using its stored amount+unit. This "heals" any item whose persisted
 *  snapshot (calories/protein/carbs/fat columns in meal_items) went stale or
 *  was saved as 0 — e.g. from an older calculation bug — without requiring
 *  the user to touch the quantity again. Items whose food can't be matched
 *  (e.g. the underlying custom food was deleted) keep their stored snapshot. */
export function recalcItem(item, customFoods = []) {
  const fd = findFood(item.food_name, customFoods)
  if (!fd) return item
  const m = calcMacros(fd, item.amount, item.unit)
  return { ...item, calories: m.cal, protein: m.prot, carbs: m.carb, fat: m.fat }
}

/** Same as recalcItem but for a list of items. */
export function recalcItems(items = [], customFoods = []) {
  return items.map(i => recalcItem(i, customFoods))
}

/** Get available units for a food */
export function getFoodUnits(name, customFoods = []) {
  const fd = findFood(name, customFoods)
  if (!fd) return ['g', 'ml']
  return [fd.u, ...(fd.alt || [])].filter((v, i, arr) => arr.indexOf(v) === i)
}

/** Search foods by name (DB + custom) */
export function searchFoods(query, customFoods = []) {
  const q = (query || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  if (!q) return []
  const dbResults = FOODS_DB
    .filter(f => f.n.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(q))
    .map(f => ({ name: f.n, unit: f.u, isCustom: false }))
  const customResults = customFoods
    .filter(f => f.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(q))
    .map(f => ({ name: f.name, unit: f.default_unit || 'g', isCustom: true, id: f.id }))
  // Merge, custom first
  const seen = new Set()
  return [...customResults, ...dbResults].filter(f => {
    if (seen.has(f.name)) return false
    seen.add(f.name)
    return true
  }).slice(0, 20)
}

// ── Meal presets ─────────────────────────────────────────────
export const MEAL_PRESETS = {
  breakfast: {
    label: 'Café da Manhã', icon: '☀️',
    options: [
      { key: 'shake', name: 'Shake Proteico', icon: '🥤', foods: [
        buildFoodItem('Whey Protein concentrado',30,'g'),
        buildFoodItem('Aveia em flocos médios',20,'g'),
        buildFoodItem('Banana prata',2,'unid'),
        buildFoodItem('Leite desnatado',200,'ml'),
      ]},
      { key: 'pao_ovo', name: 'Pão com Ovo', icon: '🍳', foods: [
        buildFoodItem('Pão francês',2,'unid'),
        buildFoodItem('Ovo inteiro',3,'unid'),
        buildFoodItem('Requeijão light',30,'g'),
        buildFoodItem('Café sem açúcar',200,'ml'),
      ]},
      { key: 'mingau', name: 'Mingau de Aveia', icon: '🥣', foods: [
        buildFoodItem('Aveia em flocos grossos',50,'g'),
        buildFoodItem('Leite desnatado',200,'ml'),
        buildFoodItem('Banana prata',1,'unid'),
        buildFoodItem('Mel',10,'g'),
        buildFoodItem('Whey Protein concentrado',25,'g'),
      ]},
      { key: 'tapioca', name: 'Tapioca com Frango', icon: '🫓', foods: [
        buildFoodItem('Tapioca (goma)',80,'g'),
        buildFoodItem('Frango desfiado',100,'g'),
        buildFoodItem('Requeijão light',30,'g'),
      ]},
    ],
  },
  lunch: {
    label: 'Almoço', icon: '🍽️',
    options: [
      { key: 'arroz_frango', name: 'Arroz + Frango', icon: '🍚', foods: [
        buildFoodItem('Arroz branco cozido',350,'g'),
        buildFoodItem('Frango grelhado (peito)',150,'g'),
        buildFoodItem('Feijão carioca cozido',100,'g'),
      ]},
      { key: 'batata_frango', name: 'Batata Doce + Frango', icon: '🍠', foods: [
        buildFoodItem('Batata doce cozida',300,'g'),
        buildFoodItem('Frango grelhado (peito)',180,'g'),
        buildFoodItem('Brócolis',100,'g'),
      ]},
      { key: 'mac_carne', name: 'Macarrão + Carne', icon: '🍝', foods: [
        buildFoodItem('Macarrão cozido',300,'g'),
        buildFoodItem('Carne moída (patinho)',150,'g'),
        buildFoodItem('Molho de tomate',80,'g'),
      ]},
      { key: 'arroz_atum', name: 'Arroz + Atum', icon: '🐟', foods: [
        buildFoodItem('Arroz branco cozido',300,'g'),
        buildFoodItem('Atum em lata (água)',120,'g'),
      ]},
    ],
  },
  snack: {
    label: 'Lanche', icon: '☕',
    options: [
      { key: 'iogurte', name: 'Iogurte + Granola', icon: '🥛', foods: [
        buildFoodItem('Iogurte grego integral',150,'g'),
        buildFoodItem('Granola',30,'g'),
      ]},
      { key: 'shake', name: 'Shake Proteico', icon: '🥤', foods: [
        buildFoodItem('Whey Protein concentrado',30,'g'),
        buildFoodItem('Leite desnatado',300,'ml'),
        buildFoodItem('Banana prata',1,'unid'),
      ]},
      { key: 'pao_ovo', name: 'Pão com Ovo', icon: '🍳', foods: [
        buildFoodItem('Pão francês',1,'unid'),
        buildFoodItem('Ovo inteiro',2,'unid'),
      ]},
    ],
  },
  dinner: {
    label: 'Janta', icon: '🌙',
    options: [
      { key: 'frango_legumes', name: 'Frango + Legumes', icon: '🥗', foods: [
        buildFoodItem('Frango grelhado (peito)',200,'g'),
        buildFoodItem('Brócolis',150,'g'),
        buildFoodItem('Batata doce cozida',200,'g'),
      ]},
      { key: 'arroz_frango', name: 'Arroz + Frango', icon: '🍚', foods: [
        buildFoodItem('Arroz branco cozido',300,'g'),
        buildFoodItem('Frango grelhado (peito)',150,'g'),
        buildFoodItem('Feijão carioca cozido',100,'g'),
      ]},
      { key: 'atum_batata', name: 'Atum + Batata', icon: '🐟', foods: [
        buildFoodItem('Atum em lata (água)',120,'g'),
        buildFoodItem('Batata doce cozida',250,'g'),
      ]},
    ],
  },
}

// ── Meal grouping for substitutions ─────────────────────────────
// "Café da manhã" and "Café da tarde" (and any generic "Lanche") share the
// same pool of substitute dishes; "Almoço" and "Jantar" share another pool.
// Meals whose name doesn't match either group get no automatic sharing —
// their presets stay private to them (matched via meal_group = null).
export function mealGroupKey(name = '') {
  const n = String(name).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  if (n.includes('manha') || n.includes('tarde') || n.includes('lanche')) return 'breakfast_snack'
  if (n.includes('almoco') || n.includes('jantar') || n.includes('janta')) return 'lunch_dinner'
  return null
}

/** Built-in suggested dishes for a given meal group (used when the user has
 *  no custom presets yet for that group). Falls back to everything if the
 *  meal doesn't match a known group. */
export function mealPresetSuggestions(groupKey) {
  const tag = opt => ({ ...opt, _suggested: true })
  if (groupKey === 'breakfast_snack') return [...MEAL_PRESETS.breakfast.options, ...MEAL_PRESETS.snack.options].map(tag)
  if (groupKey === 'lunch_dinner') return [...MEAL_PRESETS.lunch.options, ...MEAL_PRESETS.dinner.options].map(tag)
  return Object.values(MEAL_PRESETS).flatMap(cat => cat.options.map(tag))
}
