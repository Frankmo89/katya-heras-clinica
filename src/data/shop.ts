export type ProductTone = "green" | "pink" | "blue" | "bronze";
export type ProductCardStyle = "editorial" | "minimal" | "polaroid";

export interface ProductTranslation {
  es: string;
  en: string;
}

// Fixed category taxonomy — the "products" table has no separate categories
// table, so admin/tienda stores one of these Spanish values in
// products.category. This is the single source of truth for both the admin
// picker and the public category label (see categoryLabel below): the
// admin form no longer keeps its own separate CATEGORY_OPTIONS list.
export const PRODUCT_CATEGORIES: ProductTranslation[] = [
  { es: "Aceites & Aromaterapia",   en: "Oils & Aromatherapy" },
  { es: "Suplementos",              en: "Supplements" },
  { es: "Herramientas de Terapia",  en: "Therapy Tools" },
  { es: "Libros & Guías",           en: "Books & Guides" },
  { es: "Kits & Sets",              en: "Kits & Sets" },
  { es: "Ropa & Accesorios",        en: "Clothing & Accessories" },
  { es: "Otro",                     en: "Other" },
];

/**
 * Category display label in the given language. products.category always
 * stores the Spanish value (see PRODUCT_CATEGORIES); this looks up its
 * English counterpart so English mode never falls back to showing Spanish
 * text. A category value that predates this list (or was edited directly
 * in the database) falls back to showing itself as-is, in both languages.
 */
export function categoryLabel(cat: string | null, lang: "es" | "en"): string {
  if (!cat) return "";
  const match = PRODUCT_CATEGORIES.find((c) => c.es === cat);
  return match ? match[lang] : cat;
}

export interface ShopProduct {
  id: string;
  // One of PRODUCT_CATEGORIES' Spanish values (or legacy/free text) — always
  // stored in Spanish; use categoryLabel() to display it in English mode.
  cat: string | null;
  name: ProductTranslation;
  story: ProductTranslation;
  price: number;
  size?: string;
  tone: ProductTone;
  images: string[];
  cardStyle: ProductCardStyle;
}

export interface CartItem {
  id: string;
  name: ProductTranslation;
  price: number;
  qty: number;
}

// ── DB row type & mapper ─────────────────────────────────────────────────
export interface DbProduct {
  id: string;
  title_es: string;
  title_en: string | null;
  description_es: string | null;
  description_en: string | null;
  price: number | null;
  category: string | null;
  card_style: string | null;
  tone: string | null;
  images: string[] | null;
}

export function mapDbProduct(row: DbProduct): ShopProduct {
  return {
    id:   row.id,
    cat:  row.category,
    name: {
      es: row.title_es,
      en: row.title_en ?? row.title_es,
    },
    story: {
      es: row.description_es ?? "",
      en: row.description_en ?? row.description_es ?? "",
    },
    price:     row.price ?? 0,
    tone:      (row.tone as ProductTone) ?? "bronze",
    images:    row.images ?? [],
    cardStyle: (row.card_style as ProductCardStyle) ?? "editorial",
  };
}
