"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import type { FaqItem } from "@/data/services";
import { useLanguage } from "@/context/LanguageContext";

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number>(0);
  const { lang } = useLanguage();

  return (
    <div>
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div
            key={i}
            className={`border-t border-[rgba(30,41,59,0.08)] ${i === items.length - 1 ? "border-b" : ""}`}
          >
            <button
              onClick={() => setOpen(isOpen ? -1 : i)}
              className="flex w-full cursor-pointer items-center justify-between gap-4 py-6 text-left"
            >
              <span className="font-serif text-xl font-normal text-[var(--color-text)]">
                {item[lang].q}
              </span>
              <span
                className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                  isOpen
                    ? "bg-[var(--color-bronze)] text-white"
                    : "border border-[rgba(30,41,59,0.15)] text-[var(--color-text-muted)]"
                }`}
              >
                {isOpen
                  ? <Minus size={14} strokeWidth={1.5} />
                  : <Plus  size={14} strokeWidth={1.5} />}
              </span>
            </button>

            {isOpen && (
              <div className="max-w-[640px] pb-6 text-base leading-[1.7] text-[var(--color-text-muted)]">
                {item[lang].a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
