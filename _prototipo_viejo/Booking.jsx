/* global React, UI, SERVICES */
const { useState: useStateB } = React;
const { Button: BtnB, IconCheck: CkB, IconCalendar: CalB, IconClock: ClkB, IconArrow: ArB, IconMapPin: MpH } = UI;

function Booking({ lang, initialService }) {
  const t = (es, en) => lang === 'ES' ? es : en;
  const [step, setStep] = useStateB(1);
  const [serviceId, setServiceId] = useStateB(initialService || 'estructural');
  const [date, setDate] = useStateB(null);
  const [time, setTime] = useStateB(null);
  const [name, setName] = useStateB('');
  const [email, setEmail] = useStateB('');
  const [phone, setPhone] = useStateB('');
  const [notes, setNotes] = useStateB('');
  const [bookingId, setBookingId] = useStateB('');
  const svc = SERVICES.find(s => s.id === serviceId);

  // Generate a clinic-style booking number on first entry to step 4.
  // Format: KH-YYYY-NNNN. Backend will issue the real one; this is for the UI.
  const ensureBookingId = () => {
    if (bookingId) return bookingId;
    const yr = new Date().getFullYear();
    const n = String(Math.floor(1000 + Math.random() * 8999)).padStart(4, '0');
    const id = `KH-${yr}-${n}`;
    setBookingId(id);
    return id;
  };

  // Generate an .ics file in-memory and trigger download.
  // RFC 5545 minimal — works with Apple Calendar, Google, Outlook.
  const downloadIcs = () => {
    if (!date || !time || !svc) return;
    const [hh, mm] = time.split(':').map(Number);
    const start = new Date(date);
    start.setHours(hh, mm, 0, 0);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + svc.duration);
    const fmt = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const sname = svc[lang==='ES'?'es':'en'].name;
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Katya Heras Clinica//Booking//ES',
      'BEGIN:VEVENT',
      `UID:${bookingId || 'kh'}-${Date.now()}@katyaheras.mx`,
      `DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:${sname} · Katya Heras Clínica`,
      'LOCATION:Av. Revolución 1234\\, Zona Centro\\, Tijuana\\, B.C. 22000',
      `DESCRIPTION:Sesión confirmada — ${bookingId}. Llega 5 min antes. Política de cancelación 24h.`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${bookingId || 'cita'}-katya-heras.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Generate next 14 days
  const today = new Date();
  const days = Array.from({length: 14}, (_, i) => {
    const d = new Date(today); d.setDate(d.getDate() + i); return d;
  });
  const monthName = (d) => d.toLocaleDateString(lang === 'ES' ? 'es-MX' : 'en-US', { month: 'long' });
  const dayNum = (d) => d.getDate();
  const dayName = (d) => d.toLocaleDateString(lang === 'ES' ? 'es-MX' : 'en-US', { weekday: 'short' });

  const TIMES_AM = ['09:00', '10:00', '11:00'];
  const TIMES_PM = ['14:00', '15:00', '16:00', '17:00'];

  const Step = ({ n, label, active, done }) => (
    <div style={{display:'flex', alignItems:'center', gap:12, opacity: active||done ? 1 : 0.5}}>
      <div style={{
        width:32, height:32, borderRadius:9999,
        background: done ? 'var(--bronze)' : (active ? 'var(--surface-pink)' : 'transparent'),
        border: active && !done ? '1px solid var(--bronze)' : (done ? 'none' : '1px solid var(--border-soft)'),
        color: done ? '#fff' : 'var(--text)',
        display:'inline-flex', alignItems:'center', justifyContent:'center',
        fontSize:13, fontFamily:'var(--font-serif)',
        transition:'all 400ms cubic-bezier(0.22,0.61,0.36,1)'
      }}>{done ? <CkB size={14}/> : n}</div>
      <span style={{fontSize:13, color:'var(--text)', fontWeight: active ? 500 : 400}}>{label}</span>
    </div>
  );

  return (
    <div className="page" style={{padding:'72px 0 0'}}>
      <div className="container" style={{maxWidth:920}}>
        <div className="eyebrow" style={{marginBottom:16}}>{t('Reservar', 'Book a session')}</div>
        <h1 style={{fontFamily:'var(--font-serif)', fontWeight:300, fontSize:'clamp(2.5rem, 4vw, 3.5rem)', lineHeight:1.05, letterSpacing:'-0.01em', margin:'0 0 56px'}}>
          {t('Tres pasos. Sin prisas.', 'Three steps. Unhurried.')}
        </h1>

        {/* Stepper */}
        <div style={{
          display:'flex', gap:32, padding:'24px 32px',
          background:'var(--bg-soft)', borderRadius:'var(--radius-xl)', marginBottom:32, flexWrap:'wrap'
        }}>
          <Step n="1" label={t('Servicio', 'Service')}  active={step===1} done={step>1} />
          <Step n="2" label={t('Fecha y hora', 'Date & time')} active={step===2} done={step>2} />
          <Step n="3" label={t('Tus datos', 'Your details')} active={step===3} done={step>3} />
          <Step n="4" label={t('Listo', 'Confirmed')} active={step===4} done={false} />
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="card fade-up" style={{padding:40}}>
            <h2 style={{fontFamily:'var(--font-serif)', fontWeight:400, fontSize:24, margin:'0 0 24px'}}>{t('Elige un servicio', 'Choose a service')}</h2>
            <div style={{display:'grid', gap:12}}>
              {SERVICES.map(s => {
                const tt = s[lang==='ES' ? 'es' : 'en'];
                const sel = serviceId === s.id;
                return (
                  <label key={s.id} style={{
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    padding:'18px 24px', borderRadius:'var(--radius-md)',
                    border: sel ? '1px solid var(--bronze)' : '1px solid var(--border-faint)',
                    background: sel ? 'var(--bronze-soft)' : '#fff',
                    cursor:'pointer', transition:'all 300ms cubic-bezier(0.22,0.61,0.36,1)'
                  }}>
                    <input type="radio" name="svc" checked={sel} onChange={() => setServiceId(s.id)} style={{display:'none'}} />
                    <div>
                      <div style={{fontFamily:'var(--font-serif)', fontSize:18, marginBottom:2}}>{tt.name}</div>
                      <div style={{fontSize:13, color:'var(--text-muted)'}}>{s.duration} min · ${s.price} MXN</div>
                    </div>
                    <div style={{
                      width:22, height:22, borderRadius:9999,
                      border:'1px solid', borderColor: sel ? 'var(--bronze)' : 'var(--border-soft)',
                      background: sel ? 'var(--bronze)' : 'transparent',
                      display:'inline-flex', alignItems:'center', justifyContent:'center', color:'#fff'
                    }}>{sel && <CkB size={12}/>}</div>
                  </label>
                );
              })}
            </div>
            <div style={{marginTop:32, display:'flex', justifyContent:'flex-end'}}>
              <BtnB onClick={() => setStep(2)} icon={<ArB size={14}/>}>{t('Continuar', 'Continue')}</BtnB>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="card fade-up" style={{padding:40}}>
            <h2 style={{fontFamily:'var(--font-serif)', fontWeight:400, fontSize:24, margin:'0 0 8px'}}>{t('Elige fecha y hora', 'Choose date and time')}</h2>
            <p style={{fontSize:14, color:'var(--text-muted)', margin:'0 0 28px'}}>{svc[lang==='ES'?'es':'en'].name} · {svc.duration} min</p>

            <div className="eyebrow" style={{marginBottom:14}}>{monthName(today)}</div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:8, marginBottom:32}}>
              {days.map((d, i) => {
                const sel = date && d.toDateString() === date.toDateString();
                const disabled = d.getDay() === 0; // Sunday closed
                return (
                  <button key={i} onClick={() => !disabled && setDate(d)} disabled={disabled} style={{
                    padding:'14px 0', borderRadius:'var(--radius-md)',
                    border: sel ? '1px solid var(--bronze)' : '1px solid var(--border-faint)',
                    background: sel ? 'var(--bronze)' : (disabled ? 'transparent' : '#fff'),
                    color: sel ? '#fff' : (disabled ? 'var(--text-faint)' : 'var(--text)'),
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    fontFamily:'var(--font-sans)', display:'flex', flexDirection:'column', alignItems:'center', gap:2,
                    transition:'all 300ms cubic-bezier(0.22,0.61,0.36,1)'
                  }}>
                    <span style={{fontSize:11, opacity:0.7, textTransform:'uppercase', letterSpacing:'0.08em'}}>{dayName(d)}</span>
                    <span style={{fontFamily:'var(--font-serif)', fontSize:20}}>{dayNum(d)}</span>
                  </button>
                );
              })}
            </div>

            {date && (
              <>
                <div className="eyebrow" style={{marginBottom:14}}>{t('Mañana', 'Morning')}</div>
                <div style={{display:'flex', gap:10, flexWrap:'wrap', marginBottom:24}}>
                  {TIMES_AM.map(tm => {
                    const sel = time === tm;
                    return <button key={tm} onClick={() => setTime(tm)} style={{
                      padding:'10px 22px', borderRadius:9999, border: sel ? '1px solid var(--bronze)' : '1px solid var(--border-soft)',
                      background: sel ? 'var(--bronze)' : '#fff', color: sel ? '#fff' : 'var(--text)',
                      cursor:'pointer', fontSize:14, fontFamily:'var(--font-sans)',
                      transition:'all 300ms cubic-bezier(0.22,0.61,0.36,1)'
                    }}>{tm}</button>;
                  })}
                </div>
                <div className="eyebrow" style={{marginBottom:14}}>{t('Tarde', 'Afternoon')}</div>
                <div style={{display:'flex', gap:10, flexWrap:'wrap'}}>
                  {TIMES_PM.map(tm => {
                    const sel = time === tm;
                    return <button key={tm} onClick={() => setTime(tm)} style={{
                      padding:'10px 22px', borderRadius:9999, border: sel ? '1px solid var(--bronze)' : '1px solid var(--border-soft)',
                      background: sel ? 'var(--bronze)' : '#fff', color: sel ? '#fff' : 'var(--text)',
                      cursor:'pointer', fontSize:14, fontFamily:'var(--font-sans)',
                      transition:'all 300ms cubic-bezier(0.22,0.61,0.36,1)'
                    }}>{tm}</button>;
                  })}
                </div>
              </>
            )}

            <div style={{marginTop:40, display:'flex', justifyContent:'space-between'}}>
              <BtnB variant="secondary" onClick={() => setStep(1)}>{t('Volver', 'Back')}</BtnB>
              <BtnB onClick={() => date && time && setStep(3)} icon={<ArB size={14}/>}>{t('Continuar', 'Continue')}</BtnB>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="card fade-up" style={{padding:40}}>
            <h2 style={{fontFamily:'var(--font-serif)', fontWeight:400, fontSize:24, margin:'0 0 28px'}}>{t('Tus datos', 'Your details')}</h2>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:20}}>
              <div><label className="label">{t('Nombre', 'Name')}</label><input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('Cómo te llamas', 'Your name')} /></div>
              <div><label className="label">{t('Teléfono', 'Phone')}</label><input className="field" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+52 664 ..." /></div>
              <div style={{gridColumn:'span 2'}}><label className="label">{t('Email', 'Email')}</label><input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="hola@ejemplo.mx" /></div>
              <div style={{gridColumn:'span 2'}}><label className="label">{t('Notas para la sesión', 'Notes for the session')}</label><textarea className="field" rows="3" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('Cuéntanos qué te trae por aquí…','Tell us what brings you here…')}></textarea></div>
            </div>
            <div style={{
              marginTop:32, padding:24, background:'var(--bg-soft)', borderRadius:'var(--radius-md)',
              display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:12
            }}>
              <div>
                <div style={{fontFamily:'var(--font-serif)', fontSize:18}}>{svc[lang==='ES'?'es':'en'].name}</div>
                <div style={{fontSize:13, color:'var(--text-muted)', marginTop:4, display:'flex', gap:14}}>
                  <span style={{display:'inline-flex', alignItems:'center', gap:6}}><CalB size={13}/>{date && date.toLocaleDateString(lang==='ES'?'es-MX':'en-US', {weekday:'long', day:'numeric', month:'long'})}</span>
                  <span style={{display:'inline-flex', alignItems:'center', gap:6}}><ClkB size={13}/>{time}</span>
                </div>
              </div>
              <div style={{fontFamily:'var(--font-serif)', fontSize:22}}>${svc.price} MXN</div>
            </div>
            <div style={{marginTop:32, display:'flex', justifyContent:'space-between'}}>
              <BtnB variant="secondary" onClick={() => setStep(2)}>{t('Volver', 'Back')}</BtnB>
              <BtnB onClick={() => { ensureBookingId(); setStep(4); }} icon={<ArB size={14}/>}>{t('Confirmar reserva', 'Confirm booking')}</BtnB>
            </div>
          </div>
        )}

        {/* Step 4 — full confirmation */}
        {step === 4 && (
          <div className="fade-up" style={{display:'flex', flexDirection:'column', gap:20}}>
            {/* Hero card — confirmation kicker */}
            <div className="card" style={{padding:'48px 40px 36px', textAlign:'center', background:'#fff', border:'1px solid var(--border-faint)'}}>
              <div style={{
                width:64, height:64, borderRadius:9999, background:'var(--surface-green)',
                display:'inline-flex', alignItems:'center', justifyContent:'center',
                color:'var(--bronze)', margin:'0 auto 24px'
              }}><CkB size={28}/></div>
              <div style={{fontFamily:'var(--font-mono)', fontSize:11, letterSpacing:'0.2em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:12}}>
                {t('Reserva confirmada', 'Booking confirmed')} · {bookingId}
              </div>
              <h2 style={{fontFamily:'var(--font-serif)', fontWeight:300, fontSize:'clamp(2.25rem, 3.4vw, 3rem)', lineHeight:1.1, margin:'0 0 16px', textWrap:'balance'}}>
                {t('Te espero.', 'See you soon.')}
              </h2>
              <p style={{fontSize:16, color:'var(--text-muted)', maxWidth:480, margin:'0 auto', lineHeight:1.65}}>
                {t(<>Te mandé un correo a <strong style={{color:'var(--text)', fontWeight:500}}>{email || 'tu correo'}</strong> con todos los detalles. Revisa también la carpeta de spam por si acaso.</>,
                   <>I’ve emailed you at <strong style={{color:'var(--text)', fontWeight:500}}>{email || 'your address'}</strong> with all the details. Please check spam just in case.</>)}
              </p>
            </div>

            {/* Detalles + acciones */}
            <div className="card" style={{padding:0, overflow:'hidden'}}>
              {/* Resumen */}
              <div style={{padding:'32px 40px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:32, borderBottom:'1px solid var(--border-faint)'}}>
                <div>
                  <div className="eyebrow" style={{marginBottom:10}}>{t('Sesión', 'Session')}</div>
                  <div style={{fontFamily:'var(--font-serif)', fontSize:22, fontWeight:400, marginBottom:6, lineHeight:1.2}}>
                    {svc[lang==='ES'?'es':'en'].name}
                  </div>
                  <div style={{fontSize:14, color:'var(--text-muted)', display:'flex', gap:12, alignItems:'center', flexWrap:'wrap'}}>
                    <span style={{display:'inline-flex', alignItems:'center', gap:6}}><ClkB size={13}/>{svc.duration} min</span>
                    <span style={{color:'var(--border-soft)'}}>·</span>
                    <span style={{fontFamily:'var(--font-mono)'}}>${svc.price} MXN</span>
                  </div>
                </div>
                <div>
                  <div className="eyebrow" style={{marginBottom:10}}>{t('Fecha y hora', 'Date and time')}</div>
                  <div style={{fontFamily:'var(--font-serif)', fontSize:22, fontWeight:400, marginBottom:6, lineHeight:1.2}}>
                    {date && date.toLocaleDateString(lang==='ES'?'es-MX':'en-US', {weekday:'long', day:'numeric', month:'long'})}
                  </div>
                  <div style={{fontSize:14, color:'var(--text-muted)', display:'flex', gap:12, alignItems:'center'}}>
                    <span style={{display:'inline-flex', alignItems:'center', gap:6}}><CalB size={13}/>{time} h</span>
                    <span style={{color:'var(--border-soft)'}}>·</span>
                    <span>{t('Llega 5 min antes', 'Arrive 5 min early')}</span>
                  </div>
                </div>
              </div>

              {/* Mapa + dirección */}
              <div style={{display:'grid', gridTemplateColumns:'1.4fr 1fr', borderBottom:'1px solid var(--border-faint)'}}>
                {/* Mapa stylizado — capa SVG sobre gradiente. No requiere API key. */}
                <div style={{
                  position:'relative', minHeight:240,
                  background:'linear-gradient(135deg, #EEF2F2 0%, #E1F5FE 60%, #F1E3D6 100%)',
                  overflow:'hidden'
                }}>
                  <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice"
                       style={{position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.55}}>
                    {/* Calles abstractas — solo trazos finos */}
                    <g stroke="rgba(30,41,59,0.18)" strokeWidth="0.8" fill="none">
                      <path d="M 0 80 L 400 90"/>
                      <path d="M 0 140 L 400 130"/>
                      <path d="M 0 200 L 400 195"/>
                      <path d="M 60 0 L 50 240"/>
                      <path d="M 160 0 L 150 240"/>
                      <path d="M 280 0 L 290 240"/>
                      <path d="M 360 0 L 365 240"/>
                    </g>
                    {/* Manchas de área verde / parque */}
                    <ellipse cx="320" cy="60" rx="50" ry="28" fill="rgba(170,200,170,0.28)"/>
                    <ellipse cx="100" cy="180" rx="42" ry="22" fill="rgba(170,200,170,0.22)"/>
                  </svg>
                  {/* Pin */}
                  <div style={{
                    position:'absolute', top:'50%', left:'50%', transform:'translate(-50%, -100%)',
                    display:'flex', flexDirection:'column', alignItems:'center'
                  }}>
                    <div style={{
                      width:44, height:44, borderRadius:'50% 50% 50% 0', transform:'rotate(-45deg)',
                      background:'var(--bronze)', boxShadow:'0 8px 16px rgba(192,138,94,0.4)',
                      display:'flex', alignItems:'center', justifyContent:'center'
                    }}>
                      <span style={{transform:'rotate(45deg)', color:'#fff', fontFamily:'var(--font-serif)', fontSize:18, lineHeight:1}}>K</span>
                    </div>
                    <div style={{
                      marginTop:10, padding:'4px 10px', background:'#fff', borderRadius:9999,
                      fontSize:11, fontFamily:'var(--font-mono)', letterSpacing:'0.08em',
                      textTransform:'uppercase', color:'var(--text)', boxShadow:'var(--shadow-sm)'
                    }}>{t('Clínica', 'Clinic')}</div>
                  </div>
                </div>
                <div style={{padding:'32px 36px', display:'flex', flexDirection:'column', gap:14}}>
                  <div className="eyebrow" style={{margin:0}}>{t('Dirección', 'Address')}</div>
                  <div style={{fontFamily:'var(--font-serif)', fontSize:18, lineHeight:1.4, fontWeight:400}}>
                    Av. Revolución 1234<br/>Zona Centro<br/>Tijuana, B.C. 22000
                  </div>
                  <a href="https://maps.google.com/?q=Av+Revolucion+1234+Tijuana"
                     target="_blank" rel="noopener noreferrer"
                     style={{
                       fontSize:13, color:'var(--bronze)', textDecoration:'none',
                       letterSpacing:'0.04em', display:'inline-flex', alignItems:'center', gap:6,
                       marginTop:4
                     }}>
                    {t('Abrir en Google Maps', 'Open in Google Maps')} <ArB size={12}/>
                  </a>
                </div>
              </div>

              {/* Acciones */}
              <div style={{padding:'24px 32px', display:'flex', gap:12, flexWrap:'wrap', justifyContent:'space-between', alignItems:'center', background:'var(--bg-soft)'}}>
                <div style={{display:'flex', gap:12, flexWrap:'wrap'}}>
                  <BtnB variant="primary" icon={<CalB size={14}/>} onClick={downloadIcs}>
                    {t('Añadir al calendario', 'Add to calendar')}
                  </BtnB>
                  <BtnB variant="secondary" onClick={() => window.print()}>
                    {t('Imprimir', 'Print')}
                  </BtnB>
                </div>
                <div style={{fontSize:12, color:'var(--text-muted)', fontFamily:'var(--font-mono)', letterSpacing:'0.04em'}}>
                  {t('Confirmación', 'Confirmation')} · <span style={{color:'var(--text)'}}>{bookingId}</span>
                </div>
              </div>
            </div>

            {/* Qué traer / cómo llegar */}
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:20}}>
              <div className="card" style={{padding:32}}>
                <div className="eyebrow" style={{marginBottom:14}}>{t('Qué traer', 'What to bring')}</div>
                <ul style={{listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:12, fontSize:14, lineHeight:1.6, color:'var(--text)'}}>
                  <li style={{display:'flex', gap:10}}><span style={{color:'var(--bronze)', flexShrink:0, marginTop:2}}><CkB size={14}/></span>{t('Ropa cómoda y elástica', 'Comfortable, stretchy clothes')}</li>
                  <li style={{display:'flex', gap:10}}><span style={{color:'var(--bronze)', flexShrink:0, marginTop:2}}><CkB size={14}/></span>{t('Estudios médicos previos si los tienes', 'Prior medical reports if you have them')}</li>
                  <li style={{display:'flex', gap:10}}><span style={{color:'var(--bronze)', flexShrink:0, marginTop:2}}><CkB size={14}/></span>{t('Una botella de agua', 'A bottle of water')}</li>
                  <li style={{display:'flex', gap:10}}><span style={{color:'var(--bronze)', flexShrink:0, marginTop:2}}><CkB size={14}/></span>{t('Diez minutos de margen para llegar sin prisa', 'Ten minutes of margin to arrive unhurried')}</li>
                </ul>
              </div>
              <div className="card" style={{padding:32}}>
                <div className="eyebrow" style={{marginBottom:14}}>{t('Cómo llegar relajada', 'How to arrive relaxed')}</div>
                <ul style={{listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:12, fontSize:14, lineHeight:1.6, color:'var(--text-muted)'}}>
                  <li style={{display:'flex', gap:10}}><MpH size={14} style={{color:'var(--bronze)', flexShrink:0, marginTop:2}}/>{t('Estacionamiento gratuito en la calle paralela', 'Free parking on the parallel street')}</li>
                  <li style={{display:'flex', gap:10}}><span style={{color:'var(--bronze)', flexShrink:0, marginTop:2, width:14, fontFamily:'var(--font-mono)', fontSize:13, textAlign:'center'}}>U</span>{t('A 4 cuadras de la Línea Internacional', '4 blocks from the U.S. border crossing')}</li>
                  <li style={{display:'flex', gap:10}}><span style={{color:'var(--bronze)', flexShrink:0, marginTop:2, width:14, fontFamily:'var(--font-mono)', fontSize:13, textAlign:'center'}}>·</span>{t('Café y té de bienvenida desde 10 min antes', 'Welcome coffee and tea from 10 min before')}</li>
                </ul>
              </div>
            </div>

            {/* Política + modificar */}
            <div className="card" style={{padding:32, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:20, background:'var(--bronze-soft)', border:'none'}}>
              <div style={{maxWidth:520}}>
                <div className="eyebrow" style={{marginBottom:8, color:'var(--bronze-hover)'}}>{t('Política de cancelación', 'Cancellation policy')}</div>
                <p style={{fontSize:14, lineHeight:1.6, margin:0, color:'var(--text)'}}>
                  {t('Puedes mover o cancelar la cita hasta 24 horas antes sin costo. Después de ese plazo, se cobra el 50% para liberar el bloque a otra persona.',
                     'You can move or cancel up to 24 hours before at no charge. After that window, a 50% fee applies to release the slot for someone else.')}
                </p>
              </div>
              <div style={{display:'flex', gap:10, flexWrap:'wrap'}}>
                <button onClick={() => alert(t('Aquí conectas tu backend de modificación.', 'Hook this up to your modify endpoint.'))} style={{
                  padding:'10px 20px', borderRadius:9999, border:'1px solid var(--border-soft)',
                  background:'#fff', cursor:'pointer', fontSize:13, color:'var(--text)', fontFamily:'var(--font-sans)'
                }}>{t('Modificar', 'Modify')}</button>
                <button onClick={() => confirm(t('¿Cancelar esta cita?', 'Cancel this booking?')) && alert(t('Aquí conectas tu backend de cancelación.', 'Hook this up to your cancel endpoint.'))} style={{
                  padding:'10px 20px', borderRadius:9999, border:'1px solid var(--border-soft)',
                  background:'transparent', cursor:'pointer', fontSize:13, color:'var(--text-muted)', fontFamily:'var(--font-sans)'
                }}>{t('Cancelar', 'Cancel')}</button>
              </div>
            </div>

            {/* Cierre poético */}
            <p style={{
              textAlign:'center', fontFamily:'var(--font-serif)', fontStyle:'italic',
              fontSize:18, color:'var(--bronze)', margin:'24px 0 64px', lineHeight:1.5
            }}>
              {t('"El cuerpo agradece, antes incluso de ser tocado, que alguien se haya hecho tiempo."',
                 '"The body is grateful, even before being touched, that someone has made time."')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

window.BookingPage = Booking;
