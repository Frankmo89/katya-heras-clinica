/* global React, UI, SHOP_PRODUCTS, SHOP_CATEGORIES */
const { useState: useStateS } = React;
const { Button: BtnS, IconArrow: ArS, IconCheck: CkS } = UI;

// ─── ProductCard ────────────────────────────────────────────────────────────
// Editorial style by default. `style` prop swaps presentation:
//   minimal   — foto + nombre + precio, mucho aire
//   editorial — foto + 1 línea de historia + precio en serif (default)
//   polaroid  — foto centrada con borde blanco

function ProductCard({ p, lang, style='editorial', onOpen }) {
  const t = (es, en) => lang === 'ES' ? es : en;
  const tones = {
    pink:'var(--surface-pink)', green:'var(--surface-green)',
    blue:'var(--surface-blue)', bronze:'var(--bronze-soft)',
  };
  const swatch = tones[p.tone] || 'var(--surface-blue)';

  if (style === 'polaroid') {
    return (
      <button onClick={onOpen} className="card-fade" style={{
        textAlign:'left', cursor:'pointer', background:'#fff',
        padding:'16px 16px 22px', border:'1px solid var(--border-faint)',
        borderRadius:6, boxShadow:'var(--shadow-sm)',
        transition:'all 500ms cubic-bezier(0.22,0.61,0.36,1)',
        display:'flex', flexDirection:'column', gap:14
      }}>
        <div style={{
          aspectRatio:'1/1', borderRadius:2, background:`linear-gradient(135deg, ${swatch} 0%, #fff 100%)`,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontFamily:'var(--font-serif)', fontSize:48, color:'rgba(0,0,0,0.08)'
        }}>{(p.name[lang.toLowerCase()] || p.name.es).charAt(0)}</div>
        <div style={{textAlign:'center'}}>
          <div style={{fontFamily:'var(--font-serif)', fontSize:18, marginBottom:4}}>{t(p.name.es, p.name.en)}</div>
          <div style={{fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-muted)', letterSpacing:'0.08em'}}>
            ${p.price.toLocaleString('es-MX')} MXN
          </div>
        </div>
      </button>
    );
  }

  if (style === 'minimal') {
    return (
      <button onClick={onOpen} className="card-fade" style={{
        textAlign:'left', cursor:'pointer', background:'transparent',
        border:'none', padding:0,
        display:'flex', flexDirection:'column', gap:16
      }}>
        <div style={{
          aspectRatio:'4/5', borderRadius:'var(--radius-lg)',
          background:`linear-gradient(135deg, ${swatch} 0%, #fff 100%)`,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontFamily:'var(--font-serif)', fontSize:64, color:'rgba(0,0,0,0.08)',
          transition:'all 600ms cubic-bezier(0.22,0.61,0.36,1)'
        }}>{(p.name[lang.toLowerCase()] || p.name.es).charAt(0)}</div>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', gap:12, padding:'0 4px'}}>
          <div style={{fontFamily:'var(--font-serif)', fontSize:19, fontWeight:400}}>{t(p.name.es, p.name.en)}</div>
          <div style={{fontSize:13, color:'var(--text-muted)', fontVariantNumeric:'tabular-nums'}}>${p.price.toLocaleString('es-MX')}</div>
        </div>
      </button>
    );
  }

  // editorial (default)
  return (
    <button onClick={onOpen} className="card-fade" style={{
      textAlign:'left', cursor:'pointer', background:'#fff',
      borderRadius:'var(--radius-lg)', overflow:'hidden',
      boxShadow:'var(--shadow-sm)', border:'1px solid var(--border-faint)',
      transition:'all 500ms cubic-bezier(0.22,0.61,0.36,1)',
      display:'flex', flexDirection:'column', padding:0
    }}>
      <div style={{
        aspectRatio:'1/1',
        background:`linear-gradient(135deg, ${swatch} 0%, #FAFAF8 100%)`,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontFamily:'var(--font-serif)', fontSize:72, color:'rgba(0,0,0,0.08)'
      }}>{(p.name[lang.toLowerCase()] || p.name.es).charAt(0)}</div>
      <div style={{padding:'22px 22px 24px', display:'flex', flexDirection:'column', gap:10, flex:1}}>
        <h3 style={{fontFamily:'var(--font-serif)', fontWeight:400, fontSize:21, lineHeight:1.2, margin:0}}>
          {t(p.name.es, p.name.en)}
        </h3>
        <p style={{fontSize:13, lineHeight:1.55, color:'var(--text-muted)', margin:0, flex:1, textWrap:'pretty'}}>
          {t(p.story.es, p.story.en)}
        </p>
        <div style={{
          display:'flex', justifyContent:'space-between', alignItems:'center',
          paddingTop:14, borderTop:'1px solid var(--border-faint)', marginTop:6
        }}>
          <span style={{fontFamily:'var(--font-serif)', fontSize:20, color:'var(--text)'}}>
            ${p.price.toLocaleString('es-MX')} <span style={{fontSize:11, color:'var(--text-muted)', fontFamily:'var(--font-mono)', letterSpacing:'0.06em'}}>MXN</span>
          </span>
          <span style={{fontSize:11, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--text-muted)'}}>{p.size}</span>
        </div>
      </div>
    </button>
  );
}

// ─── ProductDrawer ──────────────────────────────────────────────────────────
function ProductDrawer({ p, lang, onClose, onAdd }) {
  const t = (es, en) => lang === 'ES' ? es : en;
  const [qty, setQty] = useStateS(1);
  if (!p) return null;
  const tones = { pink:'var(--surface-pink)', green:'var(--surface-green)', blue:'var(--surface-blue)', bronze:'var(--bronze-soft)' };
  const swatch = tones[p.tone] || 'var(--surface-blue)';
  return (
    <>
      <div onClick={onClose} style={{
        position:'fixed', inset:0, background:'rgba(30,41,59,0.32)',
        zIndex:50, animation:'fadeIn 400ms cubic-bezier(0.22,0.61,0.36,1) both'
      }}></div>
      <div style={{
        position:'fixed', top:0, right:0, bottom:0, width:'min(560px, 92vw)',
        background:'#fff', zIndex:51, display:'flex', flexDirection:'column',
        boxShadow:'-12px 0 40px rgba(30,41,59,0.12)',
        animation:'slideInRight 500ms cubic-bezier(0.22,0.61,0.36,1) both', overflow:'auto'
      }}>
        <button onClick={onClose} style={{
          position:'absolute', top:20, right:20, width:36, height:36, borderRadius:9999,
          border:'1px solid var(--border-faint)', background:'#fff', cursor:'pointer',
          fontSize:18, color:'var(--text-muted)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1
        }}>✕</button>
        <div style={{
          aspectRatio:'4/3', background:`linear-gradient(135deg, ${swatch} 0%, #FAFAF8 100%)`,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontFamily:'var(--font-serif)', fontSize:140, color:'rgba(0,0,0,0.06)', flexShrink:0
        }}>{(p.name[lang.toLowerCase()] || p.name.es).charAt(0)}</div>
        <div style={{padding:'40px 44px 48px', display:'flex', flexDirection:'column', gap:24}}>
          <div className="eyebrow">{t(SHOP_CATEGORIES.find(c=>c.id===p.cat)?.es, SHOP_CATEGORIES.find(c=>c.id===p.cat)?.en)}</div>
          <h2 style={{fontFamily:'var(--font-serif)', fontWeight:300, fontSize:'clamp(2rem, 3vw, 2.5rem)', lineHeight:1.15, margin:0}}>
            {t(p.name.es, p.name.en)}
          </h2>
          <p style={{fontSize:16, lineHeight:1.7, color:'var(--text-muted)', margin:0, textWrap:'pretty'}}>
            {t(p.story.es, p.story.en)}
          </p>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', paddingTop:8, borderTop:'1px solid var(--border-faint)'}}>
            <span style={{fontFamily:'var(--font-serif)', fontSize:32, color:'var(--text)'}}>
              ${p.price.toLocaleString('es-MX')} <span style={{fontSize:13, color:'var(--text-muted)', fontFamily:'var(--font-mono)', letterSpacing:'0.06em'}}>MXN</span>
            </span>
            <span style={{fontSize:12, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--text-muted)'}}>{p.size}</span>
          </div>

          {/* Ritual de uso */}
          <div style={{background:'var(--bg-soft)', padding:'22px 24px', borderRadius:'var(--radius-md)'}}>
            <div className="eyebrow" style={{marginBottom:10}}>{t('Ritual de uso', 'How to use')}</div>
            <p style={{fontSize:14, lineHeight:1.65, color:'var(--text)', margin:0}}>
              {t('Encuentra una hora sin pendientes. Apaga el teléfono. Respira tres veces antes de empezar.',
                 'Find an hour with nothing pending. Silence the phone. Take three breaths before you begin.')}
            </p>
          </div>

          {/* Cantidad + CTA */}
          <div style={{display:'flex', alignItems:'center', gap:16, marginTop:8}}>
            <div style={{display:'inline-flex', alignItems:'center', border:'1px solid var(--border-soft)', borderRadius:9999, overflow:'hidden'}}>
              <button onClick={() => setQty(Math.max(1, qty-1))} style={{border:'none', background:'transparent', padding:'10px 14px', cursor:'pointer', fontSize:16, color:'var(--text-muted)'}}>−</button>
              <span style={{padding:'0 14px', fontFamily:'var(--font-mono)', fontSize:14, fontVariantNumeric:'tabular-nums', minWidth:24, textAlign:'center'}}>{qty}</span>
              <button onClick={() => setQty(qty+1)} style={{border:'none', background:'transparent', padding:'10px 14px', cursor:'pointer', fontSize:16, color:'var(--text-muted)'}}>+</button>
            </div>
            <BtnS variant="primary" icon={<ArS size={14} />} onClick={() => { onAdd(p, qty); onClose(); }} style={{flex:1}}>
              {t('Llevar a casa', 'Take it home')}
            </BtnS>
          </div>
        </div>
      </div>
    </>
  );
}

window.ShopProductCard = ProductCard;
window.ShopProductDrawer = ProductDrawer;
