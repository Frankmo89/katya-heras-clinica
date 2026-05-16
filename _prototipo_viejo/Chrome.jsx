/* global React */
const { useState } = React;

// ===== Icons (Lucide-style, stroke 1.5) =====
const Icon = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const IconArrow    = (p) => <Icon {...p} d={<><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></>} />;
const IconCalendar = (p) => <Icon {...p} d={<><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>} />;
const IconClock    = (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></>} />;
const IconMapPin   = (p) => <Icon {...p} d={<><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z"/><circle cx="12" cy="10" r="3"/></>} />;
const IconCheck    = (p) => <Icon {...p} d={<path d="M5 12l5 5L20 7"/>} />;
const IconPhone    = (p) => <Icon {...p} d={<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92Z"/>} />;
const IconMail     = (p) => <Icon {...p} d={<><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/></>} />;

// ===== Button =====
function Button({ variant = 'primary', children, onClick, icon }) {
  return (
    <button className={`btn btn-${variant}`} onClick={onClick}>
      <span>{children}</span>
      {icon && <span style={{display:'inline-flex'}}>{icon}</span>}
    </button>
  );
}

// ===== Language toggle =====
function LanguageToggle({ lang, onChange }) {
  return (
    <div style={{display:'inline-flex', background:'#fff', border:'1px solid var(--border-faint)', borderRadius:9999, padding:3, fontSize:12}}>
      {['ES','EN'].map(L => (
        <button key={L} onClick={() => onChange(L)} style={{
          border:'none', background: lang===L ? 'var(--bronze)' : 'transparent',
          color: lang===L ? '#fff' : 'var(--text-muted)',
          padding:'6px 12px', borderRadius:9999, cursor:'pointer', fontWeight:500, fontFamily:'var(--font-sans)',
          transition:'all 300ms cubic-bezier(0.22,0.61,0.36,1)'
        }}>{L}</button>
      ))}
    </div>
  );
}

// ===== Nav =====
function Nav({ page, setPage, lang, setLang }) {
  const t = (es, en) => lang === 'ES' ? es : en;
  const links = [
    ['home',     t('Inicio',    'Home')],
    ['services', t('Servicios', 'Services')],
    ['shop',     t('Tienda',    'Shop')],
    ['booking',  t('Reservar',  'Booking')],
    ['about',    t('Sobre Katya',  'About')],
  ];
  return (
    <div style={{position:'sticky', top:16, zIndex:50, padding:'0 32px'}}>
      <nav style={{
        maxWidth:1200, margin:'0 auto',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'12px 24px',
        background:'rgba(255,255,255,0.78)', backdropFilter:'blur(14px)', WebkitBackdropFilter:'blur(14px)',
        borderRadius:9999, boxShadow:'var(--shadow-sm)',
        border:'1px solid var(--border-faint)'
      }}>
        <button onClick={() => setPage('home')} style={{background:'none', border:'none', cursor:'pointer', padding:0, display:'flex', alignItems:'center', gap:12}}>
          <img src="../../assets/logo-mark.png" alt="Katya Heras" style={{height:56, width:'auto', display:'block'}} />
          <span style={{fontFamily:'var(--font-serif)', fontSize:22, color:'var(--text)', letterSpacing:'0.005em', lineHeight:1}}>Katya Heras</span>
        </button>
        <div style={{display:'flex', gap:32, fontSize:14}}>
          {links.map(([k, label]) => (
            <button key={k} onClick={() => setPage(k)} style={{
              border:'none', background:'none', cursor:'pointer', padding:'6px 0',
              color: page===k ? 'var(--bronze)' : 'var(--text)',
              fontFamily:'var(--font-sans)', fontWeight: page===k ? 500 : 400, fontSize:14,
              borderBottom: page===k ? '1px solid var(--bronze)' : '1px solid transparent',
              transition:'color 400ms cubic-bezier(0.22,0.61,0.36,1)'
            }}>{label}</button>
          ))}
        </div>
        <div style={{display:'flex', alignItems:'center', gap:14}}>
          <LanguageToggle lang={lang} onChange={setLang} />
          <button onClick={() => setPage('booking')} className="btn btn-primary" style={{padding:'10px 22px', fontSize:13}}>
            {t('Agendar Cita', 'Book Appointment')}
          </button>
        </div>
      </nav>
    </div>
  );
}

// ===== Footer =====
function Footer({ lang, setLang }) {
  const t = (es, en) => lang === 'ES' ? es : en;
  return (
    <footer style={{background:'var(--bg-soft)', padding:'80px 0 48px', marginTop:96}}>
      <div className="container" style={{display:'grid', gridTemplateColumns:'1.4fr 1fr 1fr 1fr', gap:32, alignItems:'start'}}>
        <div>
          <div style={{display:'flex', alignItems:'center', gap:14, marginBottom:18}}>
            <img src="../../assets/logo-mark.png" alt="Katya Heras" style={{height:72, width:'auto', display:'block'}} />
            <span style={{fontFamily:'var(--font-serif)', fontSize:24, color:'var(--text)', letterSpacing:'0.005em'}}>Katya Heras</span>
          </div>
          <p style={{fontSize:14, color:'var(--text-muted)', lineHeight:1.65, maxWidth:280}}>
            {t('Osteopatía y bienestar holístico. Una sesión a la vez.', 'Osteopathy and holistic wellness. One session at a time.')}
          </p>
        </div>
        <div>
          <div className="eyebrow" style={{marginBottom:14}}>{t('Visítanos', 'Visit')}</div>
          <p style={{fontSize:14, lineHeight:1.7, margin:0, color:'var(--text)'}}>
            Av. Hidalgo 142<br/>
            Tecate, BC<br/>
            <span style={{color:'var(--text-muted)'}}>{t('Cita previa', 'By appointment')}</span>
          </p>
        </div>
        <div>
          <div className="eyebrow" style={{marginBottom:14}}>{t('Horario', 'Hours')}</div>
          <p style={{fontSize:14, lineHeight:1.7, margin:0, color:'var(--text)'}}>
            {t('Lun – Vie', 'Mon – Fri')} · 09:00 – 18:00<br/>
            {t('Sáb', 'Sat')} · 10:00 – 14:00
          </p>
        </div>
        <div>
          <div className="eyebrow" style={{marginBottom:14}}>{t('Contacto', 'Contact')}</div>
          <p style={{fontSize:14, lineHeight:1.7, margin:0}}>
            <a href="#" style={{color:'var(--text)'}}>hola@katyaheras.mx</a><br/>
            <a href="#" style={{color:'var(--text)'}}>+52 664 000 0000</a>
          </p>
        </div>
      </div>
      <div className="container" style={{
        marginTop:64, paddingTop:24, borderTop:'1px solid var(--border-faint)',
        display:'flex', justifyContent:'space-between', alignItems:'center',
        fontSize:12, color:'var(--text-muted)'
      }}>
        <span>© 2026 Katya Heras Clínica · {t('San Diego ↔ Tecate', 'San Diego ↔ Tecate')}</span>
        <LanguageToggle lang={lang} onChange={setLang} />
      </div>
    </footer>
  );
}

window.UI = { Button, LanguageToggle, Nav, Footer, IconArrow, IconCalendar, IconClock, IconMapPin, IconCheck, IconPhone, IconMail };
