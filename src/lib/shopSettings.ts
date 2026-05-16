// Shared type and fallback defaults for shop logistics settings.
// Imported by both ClinicSettingsContext and the admin configuration page.

export type ShopSettings = {
  id: number;
  shipping_enabled: boolean;
  /** Cost per order in MXN. 0 while shipping is disabled is not valid. */
  shipping_cost: number;
  /** Orders at or above this amount qualify for free shipping. 0 = no threshold. */
  free_shipping_threshold: number;
  pickup_enabled: boolean;
  pickup_instructions: string | null;
};

/** Safe fallback shown while the DB fetch is in-flight or if it fails. */
export const SHOP_SETTINGS_DEFAULTS: ShopSettings = {
  id: 1,
  shipping_enabled: true,
  shipping_cost: 150,
  free_shipping_threshold: 1500,
  pickup_enabled: true,
  pickup_instructions: null,
};
