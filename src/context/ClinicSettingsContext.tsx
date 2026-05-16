"use client";

// ClinicSettingsContext — fetches clinic_settings once at the app level so
// every consumer (Footer, booking page, etc.) shares the same data without
// triggering duplicate network requests.

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import {
  type ClinicSettings,
  CLINIC_SETTINGS_DEFAULTS,
} from "@/lib/clinicSettings";
import {
  type ShopSettings,
  SHOP_SETTINGS_DEFAULTS,
} from "@/lib/shopSettings";
import {
  type BookingSettings,
  BOOKING_SETTINGS_DEFAULTS,
} from "@/lib/bookingSettings";

export type { ClinicSettings };
export { CLINIC_SETTINGS_DEFAULTS };
export type { ShopSettings };
export { SHOP_SETTINGS_DEFAULTS };
export type { BookingSettings };
export { BOOKING_SETTINGS_DEFAULTS };

export type DaySchedule = {
  id: string;
  day_of_week: number;
  is_open: boolean;
  open_time: string | null;
  close_time: string | null;
};

interface ClinicSettingsContextValue {
  settings: ClinicSettings;
  weeklySchedule: DaySchedule[];
  shopSettings: ShopSettings;
  bookingSettings: BookingSettings;
  /** True during the initial parallel fetch of all tables. */
  loading: boolean;
}

const ClinicSettingsContext = createContext<ClinicSettingsContextValue>({
  settings: CLINIC_SETTINGS_DEFAULTS,
  weeklySchedule: [],
  shopSettings: SHOP_SETTINGS_DEFAULTS,
  bookingSettings: BOOKING_SETTINGS_DEFAULTS,
  loading: false,
});

export function ClinicSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings]               = useState<ClinicSettings>(CLINIC_SETTINGS_DEFAULTS);
  const [weeklySchedule, setWeeklySchedule]   = useState<DaySchedule[]>([]);
  const [shopSettings, setShopSettings]       = useState<ShopSettings>(SHOP_SETTINGS_DEFAULTS);
  const [bookingSettings, setBookingSettings] = useState<BookingSettings>(BOOKING_SETTINGS_DEFAULTS);
  const [loading, setLoading]                 = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("clinic_settings").select("*").eq("id", 1).single(),
      supabase.from("clinic_schedule").select("*").order("day_of_week"),
      supabase.from("shop_settings").select("*").eq("id", 1).single(),
      supabase.from("booking_settings").select("*").eq("id", 1).single(),
    ]).then(([settingsRes, scheduleRes, shopRes, bookingRes]) => {
      if (!settingsRes.error && settingsRes.data)
        setSettings(settingsRes.data as ClinicSettings);
      if (!scheduleRes.error && scheduleRes.data)
        setWeeklySchedule(scheduleRes.data as DaySchedule[]);
      if (!shopRes.error && shopRes.data)
        setShopSettings(shopRes.data as ShopSettings);
      if (!bookingRes.error && bookingRes.data)
        setBookingSettings(bookingRes.data as BookingSettings);
      setLoading(false);
    });
  }, []);

  return (
    <ClinicSettingsContext.Provider value={{ settings, weeklySchedule, shopSettings, bookingSettings, loading }}>
      {children}
    </ClinicSettingsContext.Provider>
  );
}

export function useClinicSettings(): ClinicSettingsContextValue {
  return useContext(ClinicSettingsContext);
}
