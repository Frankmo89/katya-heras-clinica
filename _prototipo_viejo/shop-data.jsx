/* global React */
// Catálogo curado — 12 productos boutique. Editable: este array es la fuente
// única; añade/quita/edita items aquí y la grid + drawer se actualizan.

const SHOP_PRODUCTS = [
  // Velas
  { id:'v1', cat:'velas', name:{es:'Vela Lenta', en:'Slow Candle'},
    story:{es:'Cera de soja, mecha de algodón. Arde despacio, como debe ser.',
           en:'Soy wax, cotton wick. Burns slowly, as it should.'},
    price:480, size:'180g · 35h', tone:'pink' },
  { id:'v2', cat:'velas', name:{es:'Bosque de Tecate', en:'Tecate Forest'},
    story:{es:'Cedro, romero, niebla de la sierra al amanecer.',
           en:'Cedar, rosemary, mountain mist at dawn.'},
    price:520, size:'200g · 40h', tone:'green' },
  { id:'v3', cat:'velas', name:{es:'Hora Azul', en:'Blue Hour'},
    story:{es:'Lavanda y vetiver para los últimos veinte minutos del día.',
           en:'Lavender and vetiver for the last twenty minutes of the day.'},
    price:560, size:'200g · 40h', tone:'blue' },

  // Aceites
  { id:'a1', cat:'aceites', name:{es:'Aceite Cervical', en:'Cervical Oil'},
    story:{es:'Árnica, jengibre y romero. Para el cuello que carga semanas.',
           en:'Arnica, ginger, rosemary. For necks that carry weeks.'},
    price:680, size:'60ml', tone:'bronze' },
  { id:'a2', cat:'aceites', name:{es:'Aceite Lumbar', en:'Lumbar Oil'},
    story:{es:'Hipérico y caléndula, infusionados durante cuarenta días.',
           en:'St. John\u2019s wort and calendula, infused over forty days.'},
    price:780, size:'100ml', tone:'bronze' },
  { id:'a3', cat:'aceites', name:{es:'Aceite Esencial · Lavanda', en:'Lavender Essential Oil'},
    story:{es:'Destilada en Valle de Guadalupe. Una gota basta.',
           en:'Distilled in Valle de Guadalupe. A single drop is enough.'},
    price:420, size:'10ml', tone:'pink' },
  { id:'a4', cat:'aceites', name:{es:'Aceite Esencial · Eucalipto', en:'Eucalyptus Essential Oil'},
    story:{es:'Para la ducha caliente que se vuelve sauna.',
           en:'For the hot shower that becomes a steam room.'},
    price:380, size:'10ml', tone:'green' },

  // Anti-estrés
  { id:'e1', cat:'estres', name:{es:'Antifaz Pesado', en:'Weighted Eye Mask'},
    story:{es:'380g de semilla de lino. Apaga el ruido de adentro.',
           en:'380g of flaxseed. Quiets the noise inside.'},
    price:640, size:'380g · lino crudo', tone:'blue' },
  { id:'e2', cat:'estres', name:{es:'Saquito Cervical', en:'Neck Pillow'},
    story:{es:'Caliente o frío. Microondas o congelador, según el día.',
           en:'Warm or cool. Microwave or freezer, depending on the day.'},
    price:580, size:'40 × 14 cm', tone:'pink' },
  { id:'e3', cat:'estres', name:{es:'Cuarzo Rosa de Mano', en:'Rose Quartz Palm Stone'},
    story:{es:'Pulida a mano. Frío al tocarla, tibia a los cinco minutos.',
           en:'Hand-polished. Cool to the touch, warm in five minutes.'},
    price:340, size:'~6cm', tone:'pink' },

  // Rituales
  { id:'r1', cat:'rituales', name:{es:'Ritual de Domingo', en:'Sunday Ritual'},
    story:{es:'Vela Lenta + Aceite Esencial de Lavanda + antifaz. Una hora para nadie más.',
           en:'Slow Candle + Lavender Essential Oil + eye mask. An hour for no one else.'},
    price:1480, size:'Kit · 3 piezas', tone:'bronze' },
  { id:'r2', cat:'rituales', name:{es:'Ritual de Lunes', en:'Monday Ritual'},
    story:{es:'Aceite Cervical + Saquito Cervical. Para empezar la semana sin la semana pasada.',
           en:'Cervical Oil + Neck Pillow. Start the week without last week.'},
    price:1180, size:'Kit · 2 piezas', tone:'green' },
];

const SHOP_CATEGORIES = [
  { id:'todo',     es:'Todo',         en:'All' },
  { id:'velas',    es:'Velas',        en:'Candles' },
  { id:'aceites',  es:'Aceites',      en:'Oils' },
  { id:'estres',   es:'Anti-estrés',  en:'Calm' },
  { id:'rituales', es:'Rituales',     en:'Rituals' },
];

window.SHOP_PRODUCTS = SHOP_PRODUCTS;
window.SHOP_CATEGORIES = SHOP_CATEGORIES;
