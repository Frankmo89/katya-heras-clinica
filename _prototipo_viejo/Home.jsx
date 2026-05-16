/* global React, UI, SERVICES, ServiceCard */
const { useState: useStateH } = React;
const { Button: BtnH, IconArrow: ArH, IconCheck: CkH, IconMapPin: MpH } = UI;

function Home({ lang, setPage, voz }) {
  const t = (es, en) => lang === 'ES' ? es : en;
  // Voice fallback if a parent didn't pass `voz` (e.g. someone embeds <Home/>
  // outside the App). Mirrors the "Íntima" preset from index.html.
  const v = voz || (lang === 'ES'
    ? { lead:'recuerda', headPre:'Tu cuerpo', headPost:'Yo te escucho.',
        sub:'Osteopatía manual y terapias suaves en un espacio diseñado para que el sistema nervioso, por fin, se afloje.' }
    : { lead:'remembers', headPre:'Your body', headPost:'I listen.',
        sub:'Manual osteopathy and soft therapies in a space designed for your nervous system to, finally, let go.' });
  return (
    <div className="page">
      {/* Hero — slow-breath video background */}
      <section style={{padding:'72px 0 96px'}}>
        <div className="container" style={{display:'grid', gridTemplateColumns:'1.1fr 1fr', gap:64, alignItems:'center'}}>
          <div>
            <div className="breath" style={{marginBottom:24, animationDelay:'200ms'}}>
              <div className="eyebrow">{t('Osteopatía · Bienestar holístico', 'Osteopathy · Holistic wellness')}</div>
            </div>
            <h1 className="breath" style={{
              fontFamily:'var(--font-serif)', fontWeight:300,
              fontSize:'clamp(3rem, 5.5vw, 5rem)', lineHeight:1.05,
              letterSpacing:'-0.01em', margin:'0 0 28px', color:'var(--text)',
              animationDelay:'500ms'
            }}>
              {v.headPre && <>{v.headPre}<br/></>}
              <em style={{color:'var(--bronze)', fontWeight:400}}>{v.lead}</em>{v.headPre ? '.' : ''}<br/>
              {v.headPost}
            </h1>
            <p className="breath" style={{fontSize:18, lineHeight:1.65, color:'var(--text-muted)', maxWidth:480, margin:'0 0 36px', animationDelay:'900ms'}}>
              {v.sub}
            </p>
            <div className="breath" style={{display:'flex', gap:16, alignItems:'center', animationDelay:'1300ms'}}>
              <BtnH variant="primary" icon={<ArH size={14} />} onClick={() => setPage('booking')}>{t('Reservar una sesión', 'Book a session')}</BtnH>
              <BtnH variant="ghost" onClick={() => setPage('services')}>{t('Ver servicios', 'See services')}</BtnH>
            </div>
          </div>
          <div className="hero-video breath" style={{
            aspectRatio:'4/5', borderRadius:'var(--radius-xl)',
            position:'relative', overflow:'hidden',
            background:'var(--hero-grad, linear-gradient(135deg, var(--surface-blue) 0%, var(--surface-pink) 100%))',
            boxShadow:'var(--shadow-md)', animationDelay:'700ms'
          }}>
            <video
              autoPlay loop muted playsInline
              poster="https://images.pexels.com/videos/6628242/free-video-6628242.jpg?auto=compress&cs=tinysrgb&w=1200"
              style={{position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover'}}
            >
              {/* KoolShooters · Pexels 6628242 — aromatherapy preparation, candlelight room.
                  https://www.pexels.com/es-es/video/relajacion-iluminacion-habitacion-preparando-6628242/ */}
              <source src="https://videos.pexels.com/video-files/6628242/6628242-hd_1920_1080_25fps.mp4" type="video/mp4" />
              <source src="https://videos.pexels.com/video-files/6628242/6628242-uhd_2732_1440_25fps.mp4" type="video/mp4" />
            </video>
            {/* Soft elegant overlay so text on adjacent column stays legible
                and the video reads quiet, not busy. */}
            <div style={{
              position:'absolute', inset:0,
              background:'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 50%, rgba(192,138,94,0.10) 100%)',
              backdropFilter:'saturate(0.92) brightness(1.02)',
              WebkitBackdropFilter:'saturate(0.92) brightness(1.02)',
              pointerEvents:'none'
            }}></div>
            {/* Subtle bronze hairline frame */}
            <div style={{
              position:'absolute', inset:0,
              borderRadius:'var(--radius-xl)',
              boxShadow:'inset 0 0 0 1px rgba(192,138,94,0.18)',
              pointerEvents:'none'
            }}></div>
            {/* Quiet motion indicator — implies video without shouting */}
            <div style={{
              position:'absolute', left:20, bottom:20,
              display:'inline-flex', alignItems:'center', gap:8,
              padding:'7px 12px 7px 10px',
              background:'rgba(255,255,255,0.78)', backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)',
              borderRadius:9999,
              fontSize:11, letterSpacing:'0.16em', textTransform:'uppercase', color:'var(--text)', fontWeight:500
            }}>
              <span className="pulse-dot"></span>
              {t('En vivo', 'Live')}
            </div>
          </div>
        </div>
      </section>

      {/* Services preview */}
      <section className="section section-soft">
        <div className="container">
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:48, flexWrap:'wrap', gap:16}}>
            <div style={{maxWidth:520}}>
              <div className="eyebrow" style={{marginBottom:16}}>{t('Servicios', 'Services')}</div>
              <h2 style={{fontFamily:'var(--font-serif)', fontWeight:400, fontSize:'clamp(2rem, 3vw, 2.75rem)', lineHeight:1.15, margin:0}}>
                {t('Una hora para soltar.', 'An hour to let go.')}
              </h2>
            </div>
            <BtnH variant="ghost" icon={<ArH size={14} />} onClick={() => setPage('services')}>{t('Todos los servicios', 'All services')}</BtnH>
          </div>
          <div className="grid-3">
            {SERVICES.slice(0, 3).map(s => (
              <div key={s.id} onClick={() => setPage(`service:${s.id}`)}
                   role="link" tabIndex={0}
                   onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setPage(`service:${s.id}`)}
                   style={{cursor:'pointer'}}>
                <ServiceCard svc={s} lang={lang} onBook={(id) => setPage(`service:${id}`)} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="section">
        <div className="container" style={{display:'grid', gridTemplateColumns:'1fr 1.2fr', gap:80, alignItems:'center'}}>
          <div className="img-ph green" style={{aspectRatio:'1/1.1', borderRadius:'var(--radius-xl)'}}></div>
          <div>
            <div className="eyebrow" style={{marginBottom:16}}>{t('Filosofía', 'Philosophy')}</div>
            <h2 style={{fontFamily:'var(--font-serif)', fontWeight:400, fontSize:'clamp(1.75rem, 2.6vw, 2.5rem)', lineHeight:1.2, margin:'0 0 24px'}}>
              {t('Trabajo con manos, no con prisa.', 'I work with hands, not with hurry.')}
            </h2>
            <p style={{fontSize:17, lineHeight:1.65, color:'var(--text-muted)', maxWidth:520, marginBottom:20}}>
              {t('Cada sesión empieza con una lectura postural y termina con un regreso lento. No mido minutos: noto cómo te vas.',
                 'Every session begins with a postural read and ends with a slow return. I don\'t count minutes — I notice how you leave.')}
            </p>
            <ul style={{listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:12}}>
              {[
                t('Lectura postural inicial · 45 min', 'Initial postural read · 45 min'),
                t('Tratamiento manual · sin prisas', 'Hands-on treatment · unhurried'),
                t('Regreso lento al movimiento', 'Slow return to movement'),
              ].map((item, i) => (
                <li key={i} style={{display:'flex', alignItems:'center', gap:12, fontSize:15, color:'var(--text)'}}>
                  <span style={{width:24, height:24, borderRadius:9999, background:'var(--surface-green)', display:'inline-flex', alignItems:'center', justifyContent:'center', color:'var(--bronze)'}}><CkH size={14}/></span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Quote */}
      <section style={{padding:'48px 0 96px'}}>
        <div className="container" style={{maxWidth:780, textAlign:'center'}}>
          <div style={{fontFamily:'var(--font-serif)', fontStyle:'italic', fontSize:'clamp(1.75rem, 2.6vw, 2.25rem)', lineHeight:1.4, color:'var(--text)'}}>
            {t('« Salí de la sesión sintiendo el suelo bajo los pies por primera vez en meses. »',
               '"I left the session feeling the ground beneath my feet for the first time in months."')}
          </div>
          <div style={{marginTop:24, fontSize:13, letterSpacing:'0.16em', textTransform:'uppercase', color:'var(--text-muted)'}}>
            Marisol R. · {t('Paciente', 'Patient')}
          </div>
        </div>
      </section>

      {/* Cross-border note (subtle) */}
      <section style={{padding:'0 0 96px'}}>
        <div className="container">
          <div style={{
            background:'var(--surface-blue)', borderRadius:'var(--radius-xl)',
            padding:'40px 48px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:32, flexWrap:'wrap'
          }}>
            <div style={{display:'flex', alignItems:'center', gap:20}}>
              <span style={{color:'var(--bronze)'}}><MpH size={28}/></span>
              <div>
                <div style={{fontFamily:'var(--font-serif)', fontSize:22, marginBottom:4}}>{t('Atiendo pacientes de San Diego.', 'I welcome patients from San Diego.')}</div>
                <div style={{fontSize:14, color:'var(--text-muted)'}}>{t('Garita de Tecate · estacionamiento privado.', 'Tecate port of entry · private parking.')}</div>
              </div>
            </div>
            <BtnH variant="secondary" onClick={() => setPage('about')}>{t('Cómo llegar', 'How to find us')}</BtnH>
          </div>
        </div>
      </section>
    </div>
  );
}

window.HomePage = Home;
