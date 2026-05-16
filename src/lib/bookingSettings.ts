export type BookingSettings = {
  min_hours_advance: number;
  max_days_advance: number;
  is_booking_enabled: boolean;
};

export const BOOKING_SETTINGS_DEFAULTS: BookingSettings = {
  min_hours_advance: 24,
  max_days_advance: 60,
  is_booking_enabled: true,
};
