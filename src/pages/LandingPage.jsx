import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trees, Users, MapPin, Download, Calculator, Shield, Star, ChevronRight, Menu, X } from 'lucide-react';
import { PLANS } from '../config/plans';

const LandingPage = ({ onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const navStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
    padding: '0 5%',
    background: scrolled ? 'rgba(255,252,245,0.95)' : 'transparent',
    backdropFilter: scrolled ? 'blur(16px)' : 'none',
    borderBottom: scrolled ? '1px solid rgba(0,0,0,0.06)' : 'none',
    transition: 'all 0.3s',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    height: 68,
  };

  // Animated tree illustration (SVG-based)
  const TreeIllustration = () => (
    <svg viewBox="0 0 400 320" style={{ width: '100%', maxWidth: 420, height: 'auto' }}>
      {/* Generation lines */}
      <line x1="200" y1="60" x2="200" y2="100" stroke="#d97706" strokeWidth="2.5" strokeDasharray="6,3" opacity="0.6" />
      <line x1="100" y1="100" x2="300" y2="100" stroke="#d4c4a8" strokeWidth="2" />
      <line x1="100" y1="100" x2="100" y2="140" stroke="#d4c4a8" strokeWidth="2" />
      <line x1="300" y1="100" x2="300" y2="140" stroke="#d4c4a8" strokeWidth="2" />
      <line x1="100" y1="200" x2="100" y2="240" stroke="#d4c4a8" strokeWidth="2" />
      <line x1="60" y1="240" x2="140" y2="240" stroke="#d4c4a8" strokeWidth="1.5" />
      <line x1="60" y1="240" x2="60" y2="275" stroke="#d4c4a8" strokeWidth="1.5" />
      <line x1="140" y1="240" x2="140" y2="275" stroke="#d4c4a8" strokeWidth="1.5" />
      <line x1="300" y1="200" x2="300" y2="240" stroke="#d4c4a8" strokeWidth="2" />
      <line x1="255" y1="240" x2="345" y2="240" stroke="#d4c4a8" strokeWidth="1.5" />
      <line x1="255" y1="240" x2="255" y2="275" stroke="#d4c4a8" strokeWidth="1.5" />
      <line x1="345" y1="240" x2="345" y2="275" stroke="#d4c4a8" strokeWidth="1.5" />
      {/* Root person */}
      <rect x="160" y="20" width="80" height="40" rx="10" fill="#d97706" opacity="0.9" />
      <circle cx="185" cy="40" r="10" fill="rgba(255,255,255,0.4)" />
      <rect x="198" y="30" width="32" height="6" rx="3" fill="rgba(255,255,255,0.7)" />
      <rect x="198" y="40" width="22" height="5" rx="2.5" fill="rgba(255,255,255,0.5)" />
      {/* Gen 2 left */}
      <rect x="60" y="140" width="80" height="40" rx="10" fill="rgba(2,132,199,0.15)" stroke="#0284c7" strokeWidth="1.5" />
      <circle cx="83" cy="160" r="9" fill="rgba(2,132,199,0.3)" />
      <rect x="96" y="152" width="30" height="5" rx="2.5" fill="#0284c7" opacity="0.5" />
      <rect x="96" y="161" width="20" height="4" rx="2" fill="#0284c7" opacity="0.3" />
      {/* Gen 2 right */}
      <rect x="260" y="140" width="80" height="40" rx="10" fill="rgba(190,24,93,0.12)" stroke="#be185d" strokeWidth="1.5" />
      <circle cx="283" cy="160" r="9" fill="rgba(190,24,93,0.25)" />
      <rect x="296" y="152" width="30" height="5" rx="2.5" fill="#be185d" opacity="0.5" />
      <rect x="296" y="161" width="20" height="4" rx="2" fill="#be185d" opacity="0.3" />
      {/* Gen 3 nodes */}
      {[{x:25,y:260,c:'#0284c7'},{x:110,y:260,c:'#0284c7'},{x:220,y:260,c:'#be185d'},{x:308,y:260,c:'#be185d'}].map((n,i) => (
        <rect key={i} x={n.x} y={n.y} width="65" height="32" rx="8" fill={`${n.c}20`} stroke={n.c} strokeWidth="1.2" opacity="0.8" />
      ))}
      {/* Decorative dots */}
      {[{cx:200,cy:100},{cx:100,cy:200},{cx:300,cy:200}].map((d,i) => (
        <circle key={i} cx={d.cx} cy={d.cy} r="5" fill="#d97706" opacity="0.7" />
      ))}
      <text x="200" y="16" textAnchor="middle" fontSize="10" fill="#78716c" opacity="0.7">Gen. 1</text>
      <text x="200" y="136" textAnchor="middle" fontSize="9" fill="#78716c" opacity="0.6">Gen. 2</text>
      <text x="200" y="252" textAnchor="middle" fontSize="9" fill="#78716c" opacity="0.6">Gen. 3</text>
    </svg>
  );

  return (
    <div style={{ background: '#f7f4ef', minHeight: '100vh', color: '#1c1917', overflowX: 'hidden' }}>

      {/* ── Navbar ── */}
      <nav style={navStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#d97706,#b45309)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Trees size={18} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.02em' }}>FamTree</span>
        </div>
        {/* Desktop nav */}
        <div style={{ display: 'flex', gap: 32, fontSize: '0.88rem', fontWeight: 500 }} className="desktop-only">
          <a href="#features" style={{ textDecoration: 'none', color: 'inherit', opacity: 0.7 }}>Fitur</a>
          <a href="#pricing" style={{ textDecoration: 'none', color: 'inherit', opacity: 0.7 }}>Harga</a>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="btn glass desktop-only" onClick={() => onNavigate('auth')} style={{ padding: '8px 18px', fontWeight: 600 }}>Masuk</button>
          <button className="btn btn-primary desktop-only" onClick={() => onNavigate('auth')} style={{ padding: '8px 18px' }}>
            Daftar Gratis <ChevronRight size={15} />
          </button>
          <button className="btn glass mobile-only" style={{ padding: 8 }} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div style={{ position: 'fixed', top: 68, left: 0, right: 0, zIndex: 199, background: 'rgba(255,252,245,0.98)', backdropFilter: 'blur(16px)', padding: '20px 5%', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button className="btn glass" style={{ justifyContent: 'center', padding: '13px' }} onClick={() => { onNavigate('auth'); setMobileMenuOpen(false); }}>Masuk</button>
          <button className="btn btn-primary" style={{ justifyContent: 'center', padding: '13px' }} onClick={() => { onNavigate('auth'); setMobileMenuOpen(false); }}>Daftar Gratis</button>
        </div>
      )}

      {/* ── Hero ── */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 5% 60px', textAlign: 'center', background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(217,119,6,0.08), transparent)' }}>
        <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(217,119,6,0.1)', border: '1px solid rgba(217,119,6,0.25)', borderRadius: 99, padding: '5px 14px', fontSize: '0.78rem', fontWeight: 600, color: '#b45309', marginBottom: 24 }}>
            <Star size={12} fill="#b45309" /> Manajemen Silsilah Keluarga Modern
          </div>
          <h1 style={{ fontSize: 'clamp(2.2rem, 6vw, 4rem)', fontWeight: 900, lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: 20, maxWidth: 700, margin: '0 auto 20px' }}>
            Dokumentasikan Silsilah<br />
            <span style={{ color: '#d97706' }}>Keluarga Anda</span> dengan Elegan
          </h1>
          <p style={{ fontSize: 'clamp(0.95rem, 2vw, 1.15rem)', color: '#78716c', maxWidth: 520, margin: '0 auto 36px', lineHeight: 1.7 }}>
            Platform digital untuk mendokumentasikan, mengelola, dan berbagi silsilah keluarga besar. Mudah digunakan, aman, dan bisa diakses semua anggota keluarga.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="btn btn-primary" style={{ padding: '14px 28px', fontSize: '1rem', borderRadius: 14 }} onClick={() => onNavigate('auth')}>
              Mulai Gratis Sekarang <ChevronRight size={18} />
            </motion.button>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="btn glass" style={{ padding: '14px 28px', fontSize: '1rem', borderRadius: 14 }} onClick={() => onNavigate('auth')}>
              Sudah punya akun? Masuk
            </motion.button>
          </div>
          <p style={{ fontSize: '0.78rem', color: '#a8a29e', marginTop: 14 }}>Gratis untuk 15 anggota · Tidak perlu kartu kredit</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }} style={{ marginTop: 56, padding: '24px', background: 'rgba(255,252,245,0.8)', borderRadius: 24, border: '1px solid rgba(217,119,6,0.15)', boxShadow: '0 24px 60px rgba(0,0,0,0.08)', backdropFilter: 'blur(12px)', maxWidth: 480, width: '100%' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a8a29e', marginBottom: 16, textAlign: 'left' }}>Preview Pohon Silsilah</div>
          <TreeIllustration />
        </motion.div>
      </section>

      {/* ── Features ── */}
      <section id="features" style={{ padding: '80px 5%', background: '#fff8ee' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ display: 'inline-block', background: 'rgba(217,119,6,0.1)', color: '#b45309', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '4px 14px', borderRadius: 99, marginBottom: 14 }}>Fitur</div>
          <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 12 }}>Semua yang Anda Butuhkan</h2>
          <p style={{ color: '#78716c', maxWidth: 440, margin: '0 auto', lineHeight: 1.7 }}>Dirancang khusus untuk keluarga besar yang ingin mendokumentasikan nasab secara digital</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, maxWidth: 1100, margin: '0 auto' }}>
          {[
            { icon: <Trees size={24} />, color: '#d97706', title: 'Pohon Visual Interaktif', desc: 'Visualisasi silsilah dalam bentuk pohon yang bisa di-zoom, pan, dan diklik untuk detail.' },
            { icon: <Users size={24} />, color: '#0284c7', title: 'Login Anggota Keluarga', desc: 'Setiap anggota bisa login dengan nama dan PIN yang ditetapkan admin keluarga.' },
            { icon: <Calculator size={24} />, color: '#7c3aed', title: 'Kalkulator Nasab', desc: 'Hitung hubungan kekerabatan antar dua anggota keluarga secara otomatis.' },
            { icon: <MapPin size={24} />, color: '#be185d', title: 'Integrasi Google Maps', desc: 'Simpan alamat anggota dan langsung buka di Google Maps dengan satu klik.' },
            { icon: <Download size={24} />, color: '#059669', title: 'Export & Import Data', desc: 'Export data ke Excel atau import dari file yang sudah ada dengan mudah.' },
            { icon: <Shield size={24} />, color: '#f59e0b', title: 'Data Aman & Privat', desc: 'Data keluarga Anda aman dan hanya bisa diakses oleh anggota yang terotorisasi.' },
          ].map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              style={{ background: 'rgba(255,252,245,0.9)', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 18, padding: '24px', backdropFilter: 'blur(8px)' }}>
              <div style={{ width: 46, height: 46, borderRadius: 13, background: `${f.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: f.color, marginBottom: 14 }}>{f.icon}</div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 8 }}>{f.title}</div>
              <div style={{ fontSize: '0.82rem', color: '#78716c', lineHeight: 1.65 }}>{f.desc}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" style={{ padding: '80px 5%' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ display: 'inline-block', background: 'rgba(217,119,6,0.1)', color: '#b45309', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '4px 14px', borderRadius: 99, marginBottom: 14 }}>Harga</div>
          <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 12 }}>Pilih Paket yang Sesuai</h2>
          <p style={{ color: '#78716c', maxWidth: 400, margin: '0 auto' }}>Mulai gratis, upgrade kapan saja sesuai pertumbuhan keluarga Anda</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, maxWidth: 1000, margin: '0 auto' }}>
          {Object.entries(PLANS).map(([key, plan], i) => (
            <motion.div key={key} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              style={{ background: key === 'family' ? `linear-gradient(160deg, rgba(255,252,245,1), rgba(255,243,220,0.8))` : 'rgba(255,252,245,0.9)', border: `1.5px solid ${key === 'family' ? 'rgba(217,119,6,0.35)' : 'rgba(0,0,0,0.07)'}`, borderRadius: 20, padding: '24px 20px', position: 'relative', boxShadow: key === 'family' ? '0 12px 36px rgba(217,119,6,0.12)' : '0 4px 16px rgba(0,0,0,0.05)' }}>
              {key === 'family' && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#d97706,#b45309)', color: 'white', fontSize: '0.65rem', fontWeight: 800, padding: '3px 12px', borderRadius: 99, letterSpacing: '0.06em' }}>PALING POPULER</div>}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: `${plan.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: plan.color }} />
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>{plan.name}</div>
              </div>
              <div style={{ marginBottom: 20 }}>
                {plan.price === 0 ? (
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#1c1917' }}>Gratis</div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1c1917' }}>Rp{(plan.price/1000).toFixed(0)}K</span>
                    <span style={{ fontSize: '0.8rem', color: '#78716c' }}>/bln</span>
                  </div>
                )}
                <div style={{ fontSize: '0.75rem', color: '#a8a29e', marginTop: 2 }}>{plan.priceLabel}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                {plan.featureList.map((f, fi) => (
                  <div key={fi} style={{ fontSize: '0.78rem', color: f.startsWith('✓') ? '#1c1917' : '#a8a29e', display: 'flex', gap: 6 }}>
                    <span style={{ flexShrink: 0 }}>{f.slice(0,1)}</span>
                    <span>{f.slice(2)}</span>
                  </div>
                ))}
              </div>
              <button className={key === 'family' ? 'btn btn-primary' : 'btn glass'} style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: '0.85rem' }} onClick={() => onNavigate('auth')}>
                {key === 'free' ? 'Mulai Gratis' : 'Pilih Paket Ini'}
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section style={{ padding: '60px 5%', background: 'linear-gradient(135deg, #1c1917, #292524)', textAlign: 'center', color: 'white' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', fontWeight: 800, marginBottom: 14, letterSpacing: '-0.02em' }}>Mulai Dokumentasikan Keluarga Anda Hari Ini</h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', marginBottom: 28, maxWidth: 420, margin: '0 auto 28px' }}>Bergabung bersama ribuan keluarga yang sudah mempercayakan silsilah mereka ke FamTree.</p>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="btn btn-primary" style={{ padding: '14px 32px', fontSize: '1rem', borderRadius: 14, margin: '0 auto' }} onClick={() => onNavigate('auth')}>
            Daftar Gratis Sekarang <ChevronRight size={18} />
          </motion.button>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ padding: '28px 5%', background: '#1c1917', color: 'rgba(255,255,255,0.5)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, fontSize: '0.8rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#d97706,#b45309)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Trees size={14} color="white" />
          </div>
          <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 700 }}>FamTree</span>
        </div>
        <div>© 2025 FamTree. Platform silsilah keluarga digital.</div>
      </footer>
    </div>
  );
};

export default LandingPage;
