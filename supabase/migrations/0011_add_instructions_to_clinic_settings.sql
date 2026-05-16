-- Add pre-appointment and arrival instruction text to clinic_settings
alter table clinic_settings
  add column if not exists instructions_pre_appointment text,
  add column if not exists instructions_arrival text;

-- Seed with the content currently hardcoded in the booking success screen
update clinic_settings
set
  instructions_pre_appointment =
    'Ropa cómoda y elástica' || chr(10) ||
    'Estudios médicos previos si los tienes' || chr(10) ||
    'Una botella de agua' || chr(10) ||
    'Diez minutos de margen para llegar sin prisa',
  instructions_arrival =
    'Estacionamiento gratuito en la calle paralela' || chr(10) ||
    'A 4 cuadras de la Línea Internacional' || chr(10) ||
    'Café y té de bienvenida desde 10 min antes'
where id = 1;
