/* global React, UI, SERVICES, ServiceCard */
const { Button: BtnS, IconArrow: ArS } = UI;

function Services({ lang, setPage }) {
  const t = (es, en) => lang === 'ES' ? es : en;
  return (
    <div className="page" style={{padding:'72px 0 0'}}>
      <div className="container">
        <div style={{maxWidth:680, marginBottom:64}} className="fade-up">
          <div className="eyebrow" style={{marginBottom:24}}>{t('Servicios', 'Services')}</div>
          <h1 style={{fontFamily:'var(--font-serif)', fontWeight:300, fontSize:'clamp(2.5rem, 4.5vw, 4rem)', lineHeight:1.05, letterSpacing:'-0.01em', margin:'0 0 24px'}}>
            {t('Tratamientos pensados con calma.', 'Treatments designed with calm.')}
          </h1>
          <p style={{fontSize:18, lineHeight:1.65, color:'var(--text-muted)', margin:0}}>
            {t('Cada modalidad responde a una manera distinta de cargar el cuerpo. Si no estás segura cuál elegir, empieza por una lectura postural.',
               'Each modality responds to a different way the body holds tension. If you\'re unsure which to choose, start with a postural read.')}
          </p>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:24}}>
          {SERVICES.map((s, i) => (
            <div key={s.id} className="fade-up" style={{animationDelay: `${i*60}ms`, cursor:'pointer'}}
                 onClick={() => setPage(`service:${s.id}`)}
                 role="link" tabIndex={0}
                 onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setPage(`service:${s.id}`)}>
              <ServiceCard svc={s} lang={lang} onBook={(id) => { event?.stopPropagation?.(); setPage(`service:${id}`); }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

window.ServicesPage = Services;
