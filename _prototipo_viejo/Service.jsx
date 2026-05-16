/* global React, UI */
const { Button, IconArrow, IconClock, IconCheck } = UI;

// ===== Service data (shared) =====
const SERVICES = [
  { id: 'estructural', tone: 'green', es: { name: 'Osteopatía estructural', tagline: 'Para el cuerpo que carga el día.', desc: 'Liberación de tensión profunda en columna y articulaciones, con manipulación suave y precisa.' }, en: { name: 'Structural osteopathy', tagline: 'For the body that carries the day.', desc: 'Deep release of tension in spine and joints through soft, precise manipulation.' }, duration: 60, price: '1,800' },
  { id: 'visceral',    tone: 'pink',  es: { name: 'Osteopatía visceral',    tagline: 'Cuando el estrés se aloja por dentro.', desc: 'Sesión profunda para liberar tensión acumulada en el sistema digestivo y respiratorio.' }, en: { name: 'Visceral osteopathy',    tagline: 'When stress settles deep inside.',     desc: 'A deep session to release tension held in the digestive and respiratory systems.' }, duration: 75, price: '2,200' },
  { id: 'craneal',     tone: 'blue',  es: { name: 'Cráneo-sacral',          tagline: 'El descanso que el sistema nervioso necesita.', desc: 'Trabajo sutil sobre el cráneo y la columna para regular el sistema nervioso autónomo.' }, en: { name: 'Cranio-sacral therapy',  tagline: 'The rest your nervous system needs.', desc: 'Subtle work on the skull and spine to regulate the autonomic nervous system.' }, duration: 60, price: '1,800' },
  { id: 'postural',    tone: 'green', es: { name: 'Lectura postural',       tagline: 'Un punto de partida.', desc: 'Evaluación inicial de 45 minutos. Recomendada antes de cualquier tratamiento continuado.' }, en: { name: 'Postural read',          tagline: 'A starting point.',              desc: 'Initial 45-minute evaluation. Recommended before any continued treatment plan.' }, duration: 45, price: '1,200' },
  { id: 'deportiva',   tone: 'pink',  es: { name: 'Recuperación deportiva',  tagline: 'Después del esfuerzo.', desc: 'Sesión orientada a deportistas: liberación miofascial, drenaje y movilización articular.' }, en: { name: 'Sports recovery',        tagline: 'After the effort.',              desc: 'Session for athletes: myofascial release, drainage, and articular mobilization.' }, duration: 75, price: '2,200' },
  { id: 'embarazo',    tone: 'blue',  es: { name: 'Acompañamiento prenatal', tagline: 'Para los nueve meses.', desc: 'Trabajo seguro y especializado durante el embarazo, en cualquier trimestre.' }, en: { name: 'Prenatal care',          tagline: 'For the nine months.',           desc: 'Safe, specialized work during pregnancy, at any trimester.' }, duration: 60, price: '1,800' },
];

// ===== Service card =====
function ServiceCard({ svc, lang, onBook }) {
  const t = svc[lang === 'ES' ? 'es' : 'en'];
  const toneBg = { green: 'var(--surface-green)', pink: 'var(--surface-pink)', blue: 'var(--surface-blue)' }[svc.tone];
  return (
    <div className="card" style={{display:'flex', flexDirection:'column', gap:16, height:'100%'}}>
      <span style={{
        alignSelf:'flex-start', background:toneBg,
        padding:'6px 14px', borderRadius:9999, fontSize:11,
        letterSpacing:'0.16em', textTransform:'uppercase', fontWeight:500
      }}>{lang === 'ES' ? svc.es.name.split(' ').slice(-1) : svc.en.name.split(' ').slice(-1)}</span>
      <h3 style={{fontFamily:'var(--font-serif)', fontWeight:400, fontSize:24, lineHeight:1.2, margin:0}}>{t.name}</h3>
      <p style={{fontFamily:'var(--font-serif)', fontStyle:'italic', fontSize:16, color:'var(--bronze)', margin:0, lineHeight:1.4}}>{t.tagline}</p>
      <p style={{fontSize:14, lineHeight:1.6, color:'var(--text-muted)', margin:0, flex:1}}>{t.desc}</p>
      <div style={{
        display:'flex', justifyContent:'space-between', alignItems:'center',
        paddingTop:16, borderTop:'1px solid var(--border-faint)'
      }}>
        <span style={{display:'inline-flex', alignItems:'center', gap:6, fontSize:13, color:'var(--text-muted)'}}>
          <IconClock size={14} /> {svc.duration} min
        </span>
        <span style={{fontFamily:'var(--font-serif)', fontSize:22, color:'var(--text)'}}>${svc.price} <span style={{fontSize:11, color:'var(--text-muted)', letterSpacing:'0.1em'}}>MXN</span></span>
      </div>
      {onBook && (
        <button onClick={() => onBook(svc.id)} className="btn btn-ghost" style={{padding:'8px 0', justifyContent:'flex-start'}}>
          {lang === 'ES' ? 'Reservar' : 'Book'} <IconArrow size={14} />
        </button>
      )}
    </div>
  );
}

window.SERVICES = SERVICES;
window.ServiceCard = ServiceCard;
