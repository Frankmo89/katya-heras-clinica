"use client";

import { useState } from "react";
import { Check, ArrowRight, X } from "lucide-react";
import {
  SHOP_PRODUCTS,
  SHOP_CATEGORIES,
  type ShopProduct,
  type ProductTone,
  type CartItem,
} from "@/data/shop";
import { ShopProductCard } from "@/components/ui/ShopProductCard";
import { ShopProductDrawer } from "@/components/ui/ShopProductDrawer";
import { Button } from "@/components/ui/Button";
import { useClinicSettings } from "@/context/ClinicSettingsContext";
import { formatPrice } from "@/lib/format";
import { useLanguage } from "@/context/LanguageContext";

const toneVar: Record<ProductTone, string> = {
  pink:   "var(--color-surface-pink)",
  green:  "var(--color-surface-green)",
  blue:   "var(--color-surface-blue)",
  bronze: "rgba(192, 138, 94, 0.15)",
};

const COPY = {
  es: {
    heroBadge:         "Tienda \u00b7 Lo que se llevan a casa",
    heading1:          "La sesi\u00f3n",
    heading2:          "termina. La",
    headingAccent:     "calma",
    heading3:          "se queda.",
    desc:              "Velas, aceites y objetos peque\u00f1os que prolongan el trabajo de la sesi\u00f3n en casa. Curados a mano, en cantidades peque\u00f1as.",
    cart:              "Cesta",
    cartTitle:         "Tu cesta",
    cartEmpty:         "La cesta est\u00e1 vac\u00eda.",
    cartEmptySub:      "A\u00fan no has elegido nada.",
    removeItem:        "Quitar",
    subtotal:          "Subtotal",
    checkout:          "Finalizar compra",
    checkoutNote:      "Env\u00edo e impuestos calculados al finalizar.",
    logisticsOverline: "Entrega en cl\u00ednica",
    logisticsHeading:  "Compra local.",
    logisticsDesc:     "Todos nuestros productos est\u00e1n disponibles exclusivamente para venta y entrega presencial en nuestra cl\u00ednica en Tecate. No realizamos env\u00edos por paqueter\u00eda.",
    logisticsItems: [
      "Entrega exclusiva en nuestras instalaciones en Tecate",
      "Adquiere tus productos durante tu pr\u00f3xima cita",
      "Sin tiempos de espera ni costos de env\u00edo",
    ],
  },
  en: {
    heroBadge:         "Shop \u00b7 Take the calm home",
    heading1:          "The session",
    heading2:          "ends. The",
    headingAccent:     "calm",
    heading3:          "stays.",
    desc:              "Candles, oils, and small objects that extend the work of your session at home. Curated by hand, in small batches.",
    cart:              "Cart",
    cartTitle:         "Your cart",
    cartEmpty:         "Your cart is empty.",
    cartEmptySub:      "You haven\u2019t chosen anything yet.",
    removeItem:        "Remove",
    subtotal:          "Subtotal",
    checkout:          "Checkout",
    checkoutNote:      "Shipping and taxes calculated at checkout.",
    logisticsOverline: "Clinic pickup",
    logisticsHeading:  "Buy local.",
    logisticsDesc:     "All our products are available exclusively for in-person sale and pickup at our clinic in Tecate. We do not ship by courier.",
    logisticsItems: [
      "Exclusive pickup at our clinic in Tecate",
      "Pick up your products at your next appointment",
      "No waiting time, no shipping costs",
    ],
  },
};

export default function TiendaPage() {
  const [cat,      setCat]      = useState("todo");
  const [open,     setOpen]     = useState<ShopProduct | null>(null);
  const [cart,     setCart]     = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  const { settings } = useClinicSettings();
  const currency = settings.currency;
  const { lang } = useLanguage();
  const copy = COPY[lang];

  const products   = cat === "todo" ? SHOP_PRODUCTS : SHOP_PRODUCTS.filter((p) => p.cat === cat);
  const cartCount  = cart.reduce((n, i) => n + i.qty, 0);
  const cartTotal  = cart.reduce((s, i) => s + i.qty * i.price, 0);

  const addToCart = (p: ShopProduct, qty: number) =>
    setCart((prev) => {
      const existing = prev.find((i) => i.id === p.id);
      if (existing) {
        return prev.map((i) => (i.id === p.id ? { ...i, qty: i.qty + qty } : i));
      }
      return [...prev, { id: p.id, name: p.name, price: p.price, qty }];
    });

  const removeFromCart = (id: string) =>
    setCart((prev) => prev.filter((i) => i.id !== id));

  return (
    <div>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="pb-8 pt-10 md:pb-14 md:pt-16">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-end gap-8 px-5 md:gap-16 md:px-8 md:grid-cols-2">

          {/* Left — copy */}
          <div>
            <p className="mb-6 text-xs uppercase tracking-[0.2em] text-[var(--color-bronze)]">
              {copy.heroBadge}
            </p>
            <h1 className="mb-6 font-serif text-[clamp(2.5rem,4.5vw,4rem)] font-light leading-[1.05] tracking-[-0.01em] text-[var(--color-text)]">
              {copy.heading1}<br />
              {copy.heading2}{" "}
              <em className="not-italic font-normal text-[var(--color-bronze)]">{copy.headingAccent}</em>
              <br />
              {copy.heading3}
            </h1>
            <p className="max-w-[480px] text-[17px] leading-[1.65] text-[var(--color-text-muted)]">
              {copy.desc}
            </p>
          </div>

          {/* Right — bodegón editorial (3 staggered product blocks) */}
          <div className="grid grid-cols-3 gap-3.5">
            {SHOP_PRODUCTS.slice(0, 3).map((p, i) => (
              <div
                key={p.id}
                className={`flex aspect-[3/4] items-center justify-center rounded-2xl font-serif text-6xl text-black/[0.08] shadow-[var(--shadow-sm)] ${
                  i === 1 ? "-translate-y-6" : ""
                }`}
                style={{ background: `linear-gradient(135deg, ${toneVar[p.tone]} 0%, #FAFAF8 100%)` }}
              >
                {p.name[lang].charAt(0)}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── Filter bar + cart button ──────────────────────────────────── */}
      <div className="mx-auto max-w-[1200px] px-5 md:px-8">
        <div className="mb-12 flex flex-wrap items-center justify-between gap-4 border-b border-t border-[rgba(30,41,59,0.06)] py-5">

          {/* Category pills */}
          <div className="flex flex-wrap gap-1.5">
            {SHOP_CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCat(c.id)}
                className={`cursor-pointer rounded-full border-none px-4 py-2 font-sans text-[13px] font-medium transition-all duration-300 ${
                  cat === c.id
                    ? "bg-[var(--color-bronze)] text-white"
                    : "bg-transparent text-[var(--color-text)] hover:bg-[var(--color-background-soft)]"
                }`}
              >
                {c[lang]}
              </button>
            ))}
          </div>

          {/* Cart button */}
          <button
            onClick={() => setCartOpen(true)}
            className="inline-flex cursor-pointer items-center gap-2.5 rounded-full border border-[rgba(30,41,59,0.15)] bg-[var(--color-background)] px-4 py-2.5 font-sans text-[13px] font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-background-soft)]"
          >
            {copy.cart}
            {cartCount > 0 && (
              <span className="min-w-5 rounded-full bg-[var(--color-bronze)] px-2 py-0.5 text-center text-[11px] tabular-nums text-white">
                {cartCount}
              </span>
            )}
          </button>

        </div>
      </div>

      {/* ── Product grid ─────────────────────────────────────────────── */}
      <section className="pb-16 md:pb-24">
        <div className="mx-auto max-w-[1200px] px-5 md:px-8">
          <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <ShopProductCard key={p.id} p={p} onOpen={() => setOpen(p)} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Logistics section ────────────────────────────────────────── */}
      <section className="bg-[var(--color-background-soft)] py-12 md:py-20">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-10 px-5 md:gap-16 md:px-8 md:grid-cols-[1.2fr_1fr]">

          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.2em] text-[var(--color-bronze)]">
              {copy.logisticsOverline}
            </p>
            <h2 className="mb-5 font-serif text-[clamp(1.75rem,2.6vw,2.5rem)] font-normal leading-[1.2] text-[var(--color-text)]">
              {copy.logisticsHeading}
            </h2>
            <p className="max-w-[520px] text-base leading-[1.65] text-[var(--color-text-muted)]">
              {copy.logisticsDesc}
            </p>
          </div>

          <ul className="flex list-none flex-col gap-3.5 p-0 text-[14px] text-[var(--color-text)]">
            {copy.logisticsItems.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <Check
                  size={16}
                  strokeWidth={1.5}
                  className="mt-0.5 shrink-0 text-[var(--color-bronze)]"
                />
                {item}
              </li>
            ))}
          </ul>

        </div>
      </section>

      {/* ── Product drawer ───────────────────────────────────────────── */}
      {open && (
        <ShopProductDrawer
          p={open}
          onClose={() => setOpen(null)}
          onAdd={addToCart}
        />
      )}

      {/* ── Cart drawer ──────────────────────────────────────────────── */}
      {cartOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setCartOpen(false)}
            className="fixed inset-0 z-50 bg-[rgba(30,41,59,0.32)]"
          />

          {/* Cart panel */}
          <div className="fixed bottom-0 right-0 top-0 z-[51] flex w-[min(440px,92vw)] flex-col bg-[var(--color-background)] shadow-[-12px_0_40px_rgba(30,41,59,0.12)]">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-[rgba(30,41,59,0.08)] px-8 py-7">
              <h3 className="m-0 font-serif text-2xl font-normal text-[var(--color-text)]">
                {copy.cartTitle}
              </h3>
              <button
                onClick={() => setCartOpen(false)}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[rgba(30,41,59,0.1)] bg-[var(--color-background)] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
              >
                <X size={14} strokeWidth={1.5} />
              </button>
            </div>

            {/* Items list */}
            <div className="flex-1 overflow-auto px-8 py-2">
              {cart.length === 0 ? (
                <div className="py-20 text-center">
                  <p className="mb-2 font-serif text-[22px] text-[var(--color-text)]">
                    {copy.cartEmpty}
                  </p>
                  <p className="text-[14px] text-[var(--color-text-muted)]">
                    {copy.cartEmptySub}
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between border-b border-[rgba(30,41,59,0.08)] py-[18px]"
                  >
                    <div>
                      <p className="mb-1 font-serif text-[17px] text-[var(--color-text)]">
                        {item.name[lang]}
                      </p>
                      <p className="font-sans text-[12px] tabular-nums text-[var(--color-text-muted)]">
                        ×{item.qty} · {formatPrice(item.price * item.qty, currency)}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="cursor-pointer border-none bg-transparent text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
                    >
                      {copy.removeItem}
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer — only shown when cart has items */}
            {cart.length > 0 && (
              <div className="border-t border-[rgba(30,41,59,0.08)] bg-[var(--color-background-soft)] px-8 py-6">
                <div className="mb-[18px] flex items-baseline justify-between">
                  <span className="text-[13px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                    Subtotal
                  </span>
                  <span className="font-serif text-[26px] text-[var(--color-text)]">
                    {formatPrice(cartTotal, currency)}
                  </span>
                </div>
                <Button
                  variant="primary"
                  icon={<ArrowRight size={14} strokeWidth={1.5} />}
                  onClick={() => alert("Conexión con Stripe / WhatsApp aquí.")}
                  className="w-full justify-center"
                >
                  {copy.checkout}
                </Button>
                <p className="mt-3.5 text-center text-[12px] text-[var(--color-text-muted)]">
                  {copy.checkoutNote}
                </p>
              </div>
            )}

          </div>
        </>
      )}

    </div>
  );
}
