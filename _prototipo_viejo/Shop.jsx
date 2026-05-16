/* global React, UI, SHOP_PRODUCTS, SHOP_CATEGORIES, ShopProductCard, ShopProductDrawer */
const { useState: useStateSh, useEffect: useEffectSh } = React;
const { Button: BtnSh, IconArrow: ArSh, IconCheck: CkSh } = UI;

function Shop({ lang, setPage, gridDensity=3, cardStyle='editorial' }) {
  const t = (es, en) => lang === 'ES' ? es : en;
  const [cat, setCat] = useStateSh('todo');
  const [open, setOpen] = useStateSh(null);
  const [cart, setCart] = useStateSh([]);
  const [cartOpen, setCartOpen] = useStateSh(false);

  const products = cat === 'todo' ? SHOP_PRODUCTS : SHOP_PRODUCTS.filter(p => p.cat === cat);
  const cartCount = cart.reduce((n, i) => n + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + i.qty * i.price, 0);

  const addToCart = (p, qty) => setCart(prev => {
    const ex = prev.find(i => i.id === p.id);
    if (ex) return prev.map(i => i.id === p.id ? {...i, qty: i.qty + qty} : i);
    return [...prev, { id:p.id, name:p.name, price:p.price, qty }];
  });
  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));

  return (
    <div className="page">
      {/* Hero */}
      <section style={{padding:'72px 0 56px'}}>
        <div className="container" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:64, alignItems:'end'}}>
          <div className="breath" style={{animationDelay:'200ms'}}>
            <div className="eyebrow" style={{marginBottom:24}}>{t('Tienda · Lo que se llevan a casa', 'Shop · What you take home')}</div>
            <h1 style={{
              fontFamily:'var(--font-serif)', fontWeight:300,
              fontSize:'clamp(2.5rem, 4.5vw, 4rem)', lineHeight:1.05,
              letterSpacing:'-0.01em', margin:'0 0 24px', color:'var(--text)'
            }}>
              {t(<>La sesión<br/>termina. La <em style={{color:'var(--bronze)', fontWeight:400}}>calma</em><br/>se queda.</>,
                 <>The session<br/>ends. The <em style={{color:'var(--bronze)', fontWeight:400}}>calm</em><br/>stays.</>)}
            </h1>
            <p style={{fontSize:17, lineHeight:1.65, color:'var(--text-muted)', maxWidth:480, margin:0, textWrap:'pretty'}}>
              {t('Velas, aceites y objetos pequeños que prolongan el trabajo de la sesión en casa. Curados a mano, en cantidades pequeñas.',
                 'Candles, oils, and small objects that extend the work of a session at home. Hand-curated, in small batches.')}
            </p>
          </div>
          {/* Bodegón visual — 3 productos lado a lado */}
          <div className="breath" style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:14, animationDelay:'500ms'}}>
            {SHOP_PRODUCTS.slice(0,3).map((p, i) => {
              const tones = { pink:'var(--surface-pink)', green:'var(--surface-green)', blue:'var(--surface-blue)', bronze:'var(--bronze-soft)' };
              return (
                <div key={p.id} style={{
                  aspectRatio:'3/4', borderRadius:'var(--radius-lg)',
                  background:`linear-gradient(135deg, ${tones[p.tone]} 0%, #FAFAF8 100%)`,
                  transform: i === 1 ? 'translateY(-24px)' : 'translateY(0)',
                  boxShadow:'var(--shadow-sm)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontFamily:'var(--font-serif)', fontSize:64, color:'rgba(0,0,0,0.08)'
                }}>{p.name.es.charAt(0)}</div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Filtros + carrito */}
      <section className="container" style={{
        padding:'24px 0 16px', display:'flex', alignItems:'center', justifyContent:'space-between',
        flexWrap:'wrap', gap:16, borderTop:'1px solid var(--border-faint)', borderBottom:'1px solid var(--border-faint)', marginBottom:48
      }}>
        <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
          {SHOP_CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setCat(c.id)} style={{
              border:'none', background: cat===c.id ? 'var(--bronze)' : 'transparent',
              color: cat===c.id ? '#fff' : 'var(--text)',
              padding:'8px 16px', borderRadius:9999, cursor:'pointer',
              fontFamily:'var(--font-sans)', fontSize:13, fontWeight:500,
              transition:'all 300ms cubic-bezier(0.22,0.61,0.36,1)'
            }}>{t(c.es, c.en)}</button>
          ))}
        </div>
        <button onClick={() => setCartOpen(true)} style={{
          display:'inline-flex', alignItems:'center', gap:10,
          border:'1px solid var(--border-soft)', background:'#fff',
          padding:'10px 18px', borderRadius:9999, cursor:'pointer',
          fontFamily:'var(--font-sans)', fontSize:13, color:'var(--text)', fontWeight:500
        }}>
          {t('Cesta', 'Bag')}
          {cartCount > 0 && (
            <span style={{
              background:'var(--bronze)', color:'#fff', borderRadius:9999,
              padding:'2px 8px', fontSize:11, fontVariantNumeric:'tabular-nums',
              minWidth:20, textAlign:'center'
            }}>{cartCount}</span>
          )}
        </button>
      </section>

      {/* Grid */}
      <section className="container" style={{paddingBottom:96}}>
        <div style={{
          display:'grid',
          gridTemplateColumns:`repeat(${gridDensity}, minmax(0, 1fr))`,
          gap: gridDensity === 4 ? 20 : gridDensity === 2 ? 40 : 28
        }}>
          {products.map(p => (
            <ShopProductCard key={p.id} p={p} lang={lang} style={cardStyle} onOpen={() => setOpen(p)} />
          ))}
        </div>
      </section>

      {/* Cierre — recogida y envíos */}
      <section className="section section-soft">
        <div className="container" style={{display:'grid', gridTemplateColumns:'1.2fr 1fr', gap:64, alignItems:'center'}}>
          <div>
            <div className="eyebrow" style={{marginBottom:16}}>{t('Logística honesta', 'Honest logistics')}</div>
            <h2 style={{fontFamily:'var(--font-serif)', fontWeight:400, fontSize:'clamp(1.75rem, 2.6vw, 2.5rem)', lineHeight:1.2, margin:'0 0 20px'}}>
              {t('Pequeños envíos. Mucho cuidado.', 'Small shipments. Plenty of care.')}
            </h2>
            <p style={{fontSize:16, lineHeight:1.65, color:'var(--text-muted)', maxWidth:520, margin:0}}>
              {t('Empacamos a mano cada miércoles. Envíos a todo México y entrega gratuita en Tecate y San Diego con cita en clínica.',
                 'We pack by hand every Wednesday. Shipping across Mexico, with free pickup in Tecate and San Diego when paired with a clinic visit.')}
            </p>
          </div>
          <ul style={{listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:14, fontSize:14}}>
            <li style={{display:'flex', gap:12}}><span style={{color:'var(--bronze)', flexShrink:0}}><CkSh size={16}/></span>{t('Envíos a todo México · 3–5 días hábiles', 'Shipping across Mexico · 3–5 business days')}</li>
            <li style={{display:'flex', gap:12}}><span style={{color:'var(--bronze)', flexShrink:0}}><CkSh size={16}/></span>{t('Recogida gratuita en clínica con cita', 'Free pickup at the clinic with appointment')}</li>
            <li style={{display:'flex', gap:12}}><span style={{color:'var(--bronze)', flexShrink:0}}><CkSh size={16}/></span>{t('Empaque sin plástico, papel reciclado', 'Plastic-free packaging, recycled paper')}</li>
            <li style={{display:'flex', gap:12}}><span style={{color:'var(--bronze)', flexShrink:0}}><CkSh size={16}/></span>{t('Cambios y devoluciones por correo, sin preguntas', 'Easy email returns, no questions asked')}</li>
          </ul>
        </div>
      </section>

      {/* Drawer producto */}
      {open && <ShopProductDrawer p={open} lang={lang} onClose={() => setOpen(null)} onAdd={addToCart} />}

      {/* Drawer carrito */}
      {cartOpen && (
        <>
          <div onClick={() => setCartOpen(false)} style={{
            position:'fixed', inset:0, background:'rgba(30,41,59,0.32)',
            zIndex:50, animation:'fadeIn 400ms cubic-bezier(0.22,0.61,0.36,1) both'
          }}></div>
          <div style={{
            position:'fixed', top:0, right:0, bottom:0, width:'min(440px, 92vw)',
            background:'#fff', zIndex:51, display:'flex', flexDirection:'column',
            boxShadow:'-12px 0 40px rgba(30,41,59,0.12)',
            animation:'slideInRight 500ms cubic-bezier(0.22,0.61,0.36,1) both'
          }}>
            <div style={{padding:'28px 32px 20px', borderBottom:'1px solid var(--border-faint)', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <h3 style={{fontFamily:'var(--font-serif)', fontSize:24, margin:0, fontWeight:400}}>{t('Tu cesta', 'Your bag')}</h3>
              <button onClick={() => setCartOpen(false)} style={{border:'1px solid var(--border-faint)', background:'#fff', borderRadius:9999, width:32, height:32, cursor:'pointer', color:'var(--text-muted)'}}>✕</button>
            </div>
            <div style={{flex:1, overflow:'auto', padding:'8px 32px'}}>
              {cart.length === 0 ? (
                <div style={{textAlign:'center', padding:'80px 0', color:'var(--text-muted)'}}>
                  <div style={{fontFamily:'var(--font-serif)', fontSize:22, color:'var(--text)', marginBottom:8}}>{t('La cesta está vacía.', 'Your bag is empty.')}</div>
                  <div style={{fontSize:14}}>{t('Aún no has elegido nada.', 'Nothing chosen yet.')}</div>
                </div>
              ) : cart.map(item => (
                <div key={item.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'18px 0', borderBottom:'1px solid var(--border-faint)'}}>
                  <div>
                    <div style={{fontFamily:'var(--font-serif)', fontSize:17, marginBottom:4}}>{t(item.name.es, item.name.en)}</div>
                    <div style={{fontSize:12, color:'var(--text-muted)', fontFamily:'var(--font-mono)'}}>×{item.qty} · ${(item.price*item.qty).toLocaleString('es-MX')} MXN</div>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} style={{border:'none', background:'transparent', cursor:'pointer', fontSize:11, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--text-muted)'}}>{t('Quitar', 'Remove')}</button>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div style={{padding:'24px 32px 28px', borderTop:'1px solid var(--border-faint)', background:'var(--bg-soft)'}}>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:18, alignItems:'baseline'}}>
                  <span style={{fontSize:13, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.14em'}}>{t('Subtotal', 'Subtotal')}</span>
                  <span style={{fontFamily:'var(--font-serif)', fontSize:26}}>${cartTotal.toLocaleString('es-MX')} <span style={{fontSize:11, color:'var(--text-muted)', fontFamily:'var(--font-mono)'}}>MXN</span></span>
                </div>
                <BtnSh variant="primary" icon={<ArSh size={14}/>} onClick={() => alert(t('Conexión con Stripe / WhatsApp aquí.', 'Stripe / WhatsApp checkout goes here.'))} style={{width:'100%'}}>
                  {t('Finalizar compra', 'Checkout')}
                </BtnSh>
                <div style={{textAlign:'center', fontSize:12, color:'var(--text-muted)', marginTop:14}}>
                  {t('Envío y impuestos calculados al finalizar.', 'Shipping and taxes calculated at checkout.')}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

window.ShopPage = Shop;
