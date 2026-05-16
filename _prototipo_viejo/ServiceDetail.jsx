/* global React, UI, SERVICES, SERVICE_DETAIL, ServiceCard */
const { useState: useStateSD } = React;
const { Button: BtnSD, IconArrow: ArSD, IconCheck: CkSD, IconClock: ClkSD } = UI;

function ServiceDetail({ lang, setPage, serviceId='estructural' }) {
  const t = (es, en) => lang === 'ES' ? es : en;
  const lk = lang === 'ES' ? 'es' : 'en';
  const svc = SERVICES.find(s => s.id === serviceId) || SERVICES[0];
  const detail = SERVICE_DETAIL[svc.id];
  const tone = svc.tone;
  const toneBg = { green: 'var(--surface-green)', pink: 'var(--surface-pink)', blue: 'var(--surface-blue)' }[tone];
  const [openFaq, setOpenFaq] = useStateSD(0);

  const book = () => setPage(`booking:${svc.id}`);

  return (
    <div className="page">
      {/* Crumb */}
      <div className="container" style={{padding:'24px 0 8px'}}>
        <button onClick={() => setPage('services')} style={{
          background:'none', border:'none', cursor:'pointer', padding:0,
          fontSize:12, letterSpacing:'0.16em', textTransform:'uppercase',
          color:'var(--text-muted)', display:'inline-flex', alignItems:'center', gap:8
        }}>
          <span style={{transform:'rotate(180deg)', display:'inline-block'}}><ArSD size={12}/></span>
          {t('Servicios', 'Services')}
        </button>
      </div>

      {/* Hero */}
      <section style={{padding:'40px 0 80px'}}>
        <div className="container" style={{display:'grid', gridTemplateColumns:'1.15fr 1fr', gap:64, alignItems:'center'}}>
          <div className="breath" style={{animationDelay:'120ms'}}>
            <div className="eyebrow" style={{marginBottom:24}}>{detail.hero[lk].eyebrow}</div>
            <div style={{
              fontFamily:'var(--font-mono)', fontSize:11, letterSpacing:'0.16em',
              textTransform:'uppercase', color:'var(--bronze)', marginBottom:18
            }}>{detail.hero[lk].kicker}</div>
            <h1 style={{
              fontFamily:'var(--font-serif)', fontWeight:300,
              fontSize:'clamp(2.5rem, 4.6vw, 4.5rem)', lineHeight:1.05,
              letterSpacing:'-0.01em', margin:'0 0 28px', color:'var(--text)', textWrap:'balance'
            }}>
              {detail.hero[lk].head}
            </h1>
            <p style={{fontSize:18, lineHeight:1.65, color:'var(--text-muted)', maxWidth:520, margin:'0 0 36px', textWrap:'pretty'}}>
              {detail.hero[lk].lede}
            </p>
            <div style={{display:'flex', gap:32, alignItems:'center', marginBottom:36, flexWrap:'wrap'}}>
              <div>
                <div className="eyebrow" style={{marginBottom:6}}>{t('Duración', 'Duration')}</div>
                <div style={{fontFamily:'var(--font-serif)', fontSize:24}}>{svc.duration} <span style={{fontSize:13, color:'var(--text-muted)'}}>min</span></div>
              </div>
              <div style={{width:1, alignSelf:'stretch', background:'var(--border-faint)'}}></div>
              <div>
                <div className="eyebrow" style={{marginBottom:6}}>{t('Inversión', 'Investment')}</div>
                <div style={{fontFamily:'var(--font-serif)', fontSize:24}}>${svc.price} <span style={{fontSize:11, color:'var(--text-muted)', fontFamily:'var(--font-mono)'}}>MXN</span></div>
              </div>
            </div>
            <div style={{display:'flex', gap:16, alignItems:'center', flexWrap:'wrap'}}>
              <BtnSD variant="primary" icon={<ArSD size={14}/>} onClick={book}>
                {t('Reservar esta sesión', 'Book this session')}
              </BtnSD>
              <BtnSD variant="ghost" onClick={() => setPage('booking')}>
                {t('Ver disponibilidad', 'See availability')}
              </BtnSD>
            </div>
          </div>

          {/* Editorial visual block */}
          <div className="breath" style={{
            position:'relative', aspectRatio:'4/5', borderRadius:'var(--radius-xl)',
            background: `linear-gradient(135deg, ${toneBg} 0%, var(--bg-soft) 100%)`,
            overflow:'hidden', boxShadow:'var(--shadow-md)', animationDelay:'500ms'
          }}>
            <div style={{
              position:'absolute', inset:0,
              background:`radial-gradient(circle at 70% 40%, rgba(192,138,94,0.18), transparent 55%)`
            }}></div>
            <div style={{
              position:'absolute', top:32, left:32, right:32,
              fontFamily:'var(--font-mono)', fontSize:11, letterSpacing:'0.16em',
              textTransform:'uppercase', color:'rgba(0,0,0,0.4)',
              display:'flex', justifyContent:'space-between'
            }}>
              <span>№ {String(SERVICES.findIndex(s=>s.id===svc.id)+1).padStart(2,'0')}</span>
              <span>{svc.duration} min</span>
            </div>
            <div style={{
              position:'absolute', bottom:36, left:36, right:36,
              fontFamily:'var(--font-serif)', fontSize:120, fontWeight:300,
              color:'rgba(0,0,0,0.08)', lineHeight:0.9, letterSpacing:'-0.04em'
            }}>{detail.hero[lk].kicker.split(' ')[0]}.</div>
            <div style={{
              position:'absolute', inset:0,
              boxShadow:'inset 0 0 0 1px rgba(192,138,94,0.18)',
              borderRadius:'var(--radius-xl)',
              pointerEvents:'none'
            }}></div>
          </div>
        </div>
      </section>

      {/* Timeline — qué esperar minuto a minuto */}
      <section className="section section-soft">
        <div className="container">
          <div style={{maxWidth:560, marginBottom:48}}>
            <div className="eyebrow" style={{marginBottom:16}}>{t('La sesión', 'The session')}</div>
            <h2 style={{fontFamily:'var(--font-serif)', fontWeight:400, fontSize:'clamp(2rem, 3vw, 2.75rem)', lineHeight:1.15, margin:'0 0 16px'}}>
              {t('Qué esperar, minuto a minuto.', 'What to expect, minute by minute.')}
            </h2>
            <p style={{fontSize:16, color:'var(--text-muted)', lineHeight:1.65, margin:0}}>
              {t('No me gusta que llegues sin saber lo que va a pasar. Esto es un mapa, no un guion.',
                 'I don’t want you arriving unsure of what’s about to happen. This is a map, not a script.')}
            </p>
          </div>
          <ol style={{listStyle:'none', padding:0, margin:0, display:'grid', gap:0}}>
            {detail.timeline.map((row, i) => (
              <li key={i} style={{
                display:'grid', gridTemplateColumns:'120px 1fr', gap:32,
                padding:'24px 0', borderTop:'1px solid var(--border-faint)',
                borderBottom: i === detail.timeline.length-1 ? '1px solid var(--border-faint)' : 'none',
                alignItems:'baseline'
              }}>
                <div style={{
                  fontFamily:'var(--font-mono)', fontSize:13,
                  color:'var(--bronze)', letterSpacing:'0.04em',
                  fontVariantNumeric:'tabular-nums'
                }}>{row.t} <span style={{color:'var(--text-muted)'}}>min</span></div>
                <div>
                  <h3 style={{fontFamily:'var(--font-serif)', fontWeight:400, fontSize:22, margin:'0 0 8px', lineHeight:1.2}}>{row[lk].h}</h3>
                  <p style={{fontSize:15, color:'var(--text-muted)', lineHeight:1.65, margin:0, maxWidth:640}}>{row[lk].p}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Para quién / no es para */}
      <section className="section">
        <div className="container" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:48}}>
          <div className="card" style={{padding:40, background:toneBg, border:'none'}}>
            <div className="eyebrow" style={{marginBottom:14}}>{t('Buena opción si', 'Good fit if')}</div>
            <h3 style={{fontFamily:'var(--font-serif)', fontWeight:400, fontSize:26, margin:'0 0 24px', lineHeight:1.2}}>
              {t('Esta sesión es para ti si…', 'This session is for you if…')}
            </h3>
            <ul style={{listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:14}}>
              {detail.forWhom[lk].map((item, i) => (
                <li key={i} style={{display:'flex', gap:12, fontSize:15, lineHeight:1.55, color:'var(--text)'}}>
                  <span style={{color:'var(--bronze)', flexShrink:0, marginTop:2}}><CkSD size={16}/></span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="card" style={{padding:40, background:'#fff'}}>
            <div className="eyebrow" style={{marginBottom:14}}>{t('Honestidad clínica', 'Clinical honesty')}</div>
            <h3 style={{fontFamily:'var(--font-serif)', fontWeight:400, fontSize:26, margin:'0 0 24px', lineHeight:1.2}}>
              {t('Cuándo no es la indicada.', 'When it’s not the right call.')}
            </h3>
            <ul style={{listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:14}}>
              {detail.notFor[lk].map((item, i) => (
                <li key={i} style={{display:'flex', gap:12, fontSize:15, lineHeight:1.55, color:'var(--text-muted)'}}>
                  <span style={{flexShrink:0, marginTop:2, color:'var(--text-faint)', fontFamily:'var(--font-mono)', fontSize:14, lineHeight:1}}>—</span>
                  {item}
                </li>
              ))}
            </ul>
            <p style={{fontSize:13, color:'var(--text-muted)', lineHeight:1.6, marginTop:24, paddingTop:20, borderTop:'1px solid var(--border-faint)', fontStyle:'italic'}}>
              {t('Si dudas, reserva una Lectura postural primero. Es más corta y barata, y salimos con un plan claro.',
                 'If in doubt, book a Postural Read first. It’s shorter and cheaper — we leave with a clear plan.')}
            </p>
          </div>
        </div>
      </section>

      {/* Galería del espacio */}
      <section className="section section-soft">
        <div className="container">
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:32, flexWrap:'wrap', gap:16}}>
            <div style={{maxWidth:520}}>
              <div className="eyebrow" style={{marginBottom:14}}>{t('El espacio', 'The space')}</div>
              <h2 style={{fontFamily:'var(--font-serif)', fontWeight:400, fontSize:'clamp(1.75rem, 2.6vw, 2.5rem)', lineHeight:1.2, margin:0}}>
                {t('Diseñado para soltar.', 'Designed for letting go.')}
              </h2>
            </div>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gridTemplateRows:'200px 200px', gap:14}}>
            <div className="img-ph warm" style={{gridRow:'span 2', borderRadius:'var(--radius-lg)'}}></div>
            <div className="img-ph cool" style={{borderRadius:'var(--radius-lg)'}}></div>
            <div className="img-ph green" style={{borderRadius:'var(--radius-lg)'}}></div>
            <div className="img-ph cool" style={{borderRadius:'var(--radius-lg)'}}></div>
            <div className="img-ph warm" style={{borderRadius:'var(--radius-lg)'}}></div>
          </div>
          <p style={{fontSize:13, color:'var(--text-muted)', marginTop:16, fontStyle:'italic', textAlign:'center'}}>
            {t('Camilla térmica · luz cálida regulable · sonido aislado · té de bienvenida.',
               'Heated table · adjustable warm light · sound-insulated · welcome tea.')}
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="section">
        <div className="container" style={{maxWidth:820}}>
          <div className="eyebrow" style={{marginBottom:14}}>{t('Preguntas honestas', 'Honest questions')}</div>
          <h2 style={{fontFamily:'var(--font-serif)', fontWeight:400, fontSize:'clamp(2rem, 3vw, 2.5rem)', lineHeight:1.2, margin:'0 0 40px'}}>
            {t('Lo que la gente pregunta antes.', 'What people ask before.')}
          </h2>
          <div>
            {detail.faq.map((item, i) => {
              const open = openFaq === i;
              return (
                <div key={i} style={{borderTop:'1px solid var(--border-faint)', borderBottom: i === detail.faq.length-1 ? '1px solid var(--border-faint)' : 'none'}}>
                  <button onClick={() => setOpenFaq(open ? -1 : i)} style={{
                    width:'100%', padding:'24px 0', background:'none', border:'none', cursor:'pointer',
                    display:'flex', justifyContent:'space-between', alignItems:'center', gap:16, textAlign:'left'
                  }}>
                    <span style={{fontFamily:'var(--font-serif)', fontSize:21, fontWeight:400, color:'var(--text)'}}>{item[lk].q}</span>
                    <span style={{
                      width:32, height:32, borderRadius:9999,
                      background: open ? 'var(--bronze)' : 'transparent',
                      color: open ? '#fff' : 'var(--text-muted)',
                      border: open ? 'none' : '1px solid var(--border-soft)',
                      display:'inline-flex', alignItems:'center', justifyContent:'center',
                      fontFamily:'var(--font-serif)', fontSize:18, lineHeight:1, flexShrink:0,
                      transition:'all 300ms cubic-bezier(0.22,0.61,0.36,1)'
                    }}>{open ? '−' : '+'}</span>
                  </button>
                  {open && (
                    <div style={{paddingBottom:24, fontSize:16, lineHeight:1.7, color:'var(--text-muted)', maxWidth:640, animation:'fadeIn 400ms cubic-bezier(0.22,0.61,0.36,1) both'}}>
                      {item[lk].a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="section section-soft">
        <div className="container" style={{textAlign:'center', maxWidth:680}}>
          <h2 style={{fontFamily:'var(--font-serif)', fontWeight:300, fontSize:'clamp(2.25rem, 3.4vw, 3.25rem)', lineHeight:1.1, margin:'0 0 24px', textWrap:'balance'}}>
            {t(<>¿Lista para <em style={{color:'var(--bronze)', fontWeight:400}}>una hora</em> sin prisa?</>,
               <>Ready for <em style={{color:'var(--bronze)', fontWeight:400}}>an unhurried</em> hour?</>)}
          </h2>
          <p style={{fontSize:17, color:'var(--text-muted)', lineHeight:1.6, margin:'0 0 32px'}}>
            {t(`${svc[lk].name} · ${svc.duration} minutos · $${svc.price} MXN`,
               `${svc[lk].name} · ${svc.duration} minutes · $${svc.price} MXN`)}
          </p>
          <BtnSD variant="primary" icon={<ArSD size={14}/>} onClick={book}>
            {t('Reservar esta sesión', 'Book this session')}
          </BtnSD>
          <div style={{fontSize:13, color:'var(--text-muted)', marginTop:18}}>
            {t('Confirmación inmediata · Política de cancelación 24h', 'Instant confirmation · 24h cancellation policy')}
          </div>
        </div>
      </section>

      {/* Servicios relacionados */}
      <section className="section">
        <div className="container">
          <div className="eyebrow" style={{marginBottom:14}}>{t('Quizá también', 'You may also like')}</div>
          <h2 style={{fontFamily:'var(--font-serif)', fontWeight:400, fontSize:'clamp(1.75rem, 2.6vw, 2.5rem)', lineHeight:1.2, margin:'0 0 40px'}}>
            {t('Otras sesiones que combinan bien.', 'Other sessions that pair well.')}
          </h2>
          <div className="grid-3">
            {detail.related.map(rid => {
              const rs = SERVICES.find(s => s.id === rid);
              if (!rs) return null;
              return (
                <ServiceCard key={rid} svc={rs} lang={lang}
                             onBook={() => setPage(`service:${rid}`)} />
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

window.ServiceDetailPage = ServiceDetail;
