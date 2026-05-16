/* global React, UI */
const { Button: BtnA, IconArrow: ArA, IconMapPin: MpA, IconClock: ClkA } = UI;

function About({ lang, setPage }) {
  const t = (es, en) => lang === 'ES' ? es : en;
  return (
    <div className="page" style={{padding:'72px 0 0'}}>
      <div className="container">
        <div style={{display:'grid', gridTemplateColumns:'1fr 1.1fr', gap:64, alignItems:'center', marginBottom:96}}>
          <div className="img-ph pink fade-up" style={{aspectRatio:'4/5', borderRadius:'var(--radius-xl)'}}></div>
          <div className="fade-up d1">
            <div className="eyebrow" style={{marginBottom:24}}>{t('La práctica', 'The practice')}</div>
            <h1 style={{fontFamily:'var(--font-serif)', fontWeight:300, fontSize:'clamp(2.25rem, 4vw, 3.5rem)', lineHeight:1.1, letterSpacing:'-0.01em', margin:'0 0 24px'}}>
              {t('Una clínica fundada en la escucha.', 'A clinic rooted in listening.')}
            </h1>
            <p style={{fontSize:17, lineHeight:1.65, color:'var(--text-muted)', margin:'0 0 16px'}}>
              {t('Katya Heras es osteópata certificada con más de doce años de práctica clínica. Su trabajo combina la precisión de la osteopatía estructural con la sutileza de las terapias craneo-sacrales.',
                 'Katya Heras is a certified osteopath with over twelve years of clinical practice. Her work blends the precision of structural osteopathy with the subtlety of cranio-sacral therapy.')}
            </p>
            <p style={{fontSize:17, lineHeight:1.65, color:'var(--text-muted)', margin:0}}>
              {t('Cada sesión está diseñada para que el cuerpo, y el sistema nervioso, recuerden cómo descansar.',
                 'Every session is designed so the body — and the nervous system — remember how to rest.')}
            </p>
          </div>
        </div>

        {/* Space */}
        <div style={{marginBottom:96}}>
          <div className="eyebrow" style={{marginBottom:16, textAlign:'center'}}>{t('El espacio', 'The space')}</div>
          <h2 style={{fontFamily:'var(--font-serif)', fontWeight:400, fontSize:'clamp(1.75rem, 2.6vw, 2.5rem)', textAlign:'center', margin:'0 0 56px', lineHeight:1.2}}>
            {t('Lino, madera y luz natural.', 'Linen, wood, and natural light.')}
          </h2>
          <div style={{display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:16}}>
            <div className="img-ph green" style={{aspectRatio:'4/3', borderRadius:'var(--radius-xl)'}}></div>
            <div className="img-ph warm" style={{aspectRatio:'4/3', borderRadius:'var(--radius-xl)'}}></div>
            <div className="img-ph" style={{aspectRatio:'4/3', borderRadius:'var(--radius-xl)'}}></div>
          </div>
        </div>

        {/* Cross-border */}
        <div style={{
          background:'var(--bg-soft)', borderRadius:'var(--radius-xl)',
          padding:'56px 64px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:48, alignItems:'center'
        }}>
          <div>
            <div className="eyebrow" style={{marginBottom:16}}>{t('San Diego ↔ Tecate', 'San Diego ↔ Tecate')}</div>
            <h3 style={{fontFamily:'var(--font-serif)', fontWeight:400, fontSize:28, margin:'0 0 16px', lineHeight:1.2}}>
              {t('Cómo llegar.', 'How to find us.')}
            </h3>
            <p style={{fontSize:15, lineHeight:1.65, color:'var(--text-muted)', margin:'0 0 24px'}}>
              {t('A pocos minutos de la garita de Tecate. Estacionamiento privado y acceso peatonal directo.',
                 'A few minutes from the Tecate port of entry. Private parking and direct pedestrian access.')}
            </p>
            <ul style={{listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:14, fontSize:14}}>
              <li style={{display:'flex', gap:12, alignItems:'center'}}><span style={{color:'var(--bronze)'}}><MpA size={16}/></span>Av. Hidalgo 142, Tecate, BC</li>
              <li style={{display:'flex', gap:12, alignItems:'center'}}><span style={{color:'var(--bronze)'}}><ClkA size={16}/></span>{t('Lun–Vie 09:00–18:00 · Sáb 10:00–14:00', 'Mon–Fri 9am–6pm · Sat 10am–2pm')}</li>
            </ul>
            <div style={{marginTop:32}}>
              <BtnA variant="primary" icon={<ArA size={14}/>} onClick={() => setPage('booking')}>{t('Reservar una sesión', 'Book a session')}</BtnA>
            </div>
          </div>
          <div className="img-ph" style={{aspectRatio:'4/3', borderRadius:'var(--radius-xl)'}}></div>
        </div>
      </div>
    </div>
  );
}

window.AboutPage = About;
