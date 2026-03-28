import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trees, Mail, Lock, User, Users, Key, ChevronLeft, Eye, EyeOff, Building } from 'lucide-react';
import { supabase } from '../lib/supabase';

// Generate 6-char family code
const genCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

const AuthPage = ({ onNavigate, onLoginSuccess, onFamilyLoginSuccess, familyMembers, setFamilyMembers }) => {
  const [tab, setTab] = useState('admin'); // 'admin' | 'member'
  const [mode, setMode] = useState('login'); // 'login' | 'register' (admin only)

  // Admin form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Register extra
  const [familyName, setFamilyName] = useState('');
  const [adminName, setAdminName] = useState('');

  // Member login
  const [familyCode, setFamilyCode] = useState('');
  const [memberList, setMemberList] = useState(null);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [pin, setPin] = useState('');
  const [loadingFamily, setLoadingFamily] = useState(false);

  const reset = () => { setError(''); setLoading(false); };

  // ── Admin Login ──
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    if (!supabase) { setError('Supabase belum dikonfigurasi.'); setLoading(false); return; }
    try {
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) throw err;
      const userId = data.user?.id;

      // Fetch family for this admin
      const { data: fam } = await supabase
        .from('families')
        .select('*')
        .eq('admin_id', userId)
        .single();

      onLoginSuccess(data.user, fam || null);
    } catch (err) {
      setError(err.message || 'Email atau password salah.');
    } finally { setLoading(false); }
  };

  // ── Admin Register ──
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!familyName.trim()) { setError('Nama keluarga wajib diisi.'); return; }
    setLoading(true); setError('');
    if (!supabase) { setError('Supabase belum dikonfigurasi.'); setLoading(false); return; }
    try {
      // 1. Create Supabase auth account
      const { data: authData, error: authErr } = await supabase.auth.signUp({ email, password });
      if (authErr) throw authErr;
      const userId = authData.user?.id;
      if (!userId) throw new Error('Gagal membuat akun.');

      // 2. Create family record via security-definer function (bypasses RLS during registration)
      const code = genCode();
      const { data: familyRows, error: famErr } = await supabase
        .rpc('create_family', { p_name: familyName.trim(), p_code: code });
      if (famErr) throw famErr;
      const familyData = familyRows?.[0];
      if (!familyData) throw new Error('Gagal membuat data keluarga.');

      // 3. Update profile with family_id and role
      await supabase.from('profiles').upsert({
        id: userId,
        email,
        role: 'super_admin',
        family_id: familyData.id,
      });

      onLoginSuccess(authData.user, familyData);
    } catch (err) {
      setError(err.message || 'Gagal mendaftar. Coba lagi.');
    } finally { setLoading(false); }
  };

  // ── Look up family by code ──
  const handleLookupFamily = async () => {
    if (!familyCode.trim()) { setError('Masukkan kode keluarga.'); return; }
    setLoadingFamily(true); setError(''); setMemberList(null);
    try {
      if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
      // Get family by code
      const { data: fam, error: famErr } = await supabase
        .from('families')
        .select('id, name')
        .eq('code', familyCode.trim().toUpperCase())
        .single();
      if (famErr || !fam) throw new Error('Kode keluarga tidak ditemukan.');

      // Get members with PIN for this family
      const { data: members, error: memErr } = await supabase
        .from('family_members')
        .select('id, name, gender, photo, pin')
        .eq('family_id', fam.id)
        .not('pin', 'is', null)
        .neq('pin', '');
      if (memErr) throw memErr;

      setMemberList({ family: fam, members: members || [] });
    } catch (err) {
      setError(err.message);
    } finally { setLoadingFamily(false); }
  };

  // ── Member PIN Login ──
  const handleMemberLogin = () => {
    if (!selectedMemberId) { setError('Pilih nama kamu.'); return; }
    if (!pin) { setError('Masukkan PIN.'); return; }
    const member = memberList?.members?.find(m => m.id === selectedMemberId);
    if (!member || member.pin !== pin) { setError('PIN salah.'); return; }
    onFamilyLoginSuccess(member, memberList.family);
  };

  const tabStyle = (active) => ({
    flex: 1, padding: '12px', border: 'none', background: 'transparent',
    fontFamily: 'Outfit, sans-serif', fontSize: '0.88rem', fontWeight: 600,
    cursor: 'pointer', borderBottom: `2.5px solid ${active ? '#d97706' : 'transparent'}`,
    color: active ? '#d97706' : '#78716c', transition: 'all 0.2s',
  });

  const inputWrapper = (icon, children) => (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#a8a29e', pointerEvents: 'none' }}>{icon}</div>
      {children}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f7f4ef', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ padding: '18px 5%', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button className="btn glass" style={{ padding: '7px 14px', gap: 6, fontSize: '0.82rem' }} onClick={() => onNavigate('landing')}>
          <ChevronLeft size={15} /> Kembali
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#d97706,#b45309)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Trees size={16} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1rem' }}>FamTree</span>
        </div>
      </div>

      {/* Card */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 5%' }}>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: 440, background: 'rgba(255,252,245,0.95)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 24, boxShadow: '0 24px 60px rgba(0,0,0,0.08)', overflow: 'hidden' }}>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
            <button style={tabStyle(tab === 'admin')} onClick={() => { setTab('admin'); setMode('login'); setError(''); }}>
              👤 Login Admin
            </button>
            <button style={tabStyle(tab === 'member')} onClick={() => { setTab('member'); setError(''); }}>
              👨‍👩‍👦 Login Anggota
            </button>
          </div>

          <div style={{ padding: '28px 28px 32px' }}>
            <AnimatePresence mode="wait">

              {/* ── ADMIN TAB ── */}
              {tab === 'admin' && (
                <motion.div key="admin" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 4 }}>{mode === 'login' ? 'Masuk sebagai Admin' : 'Daftar Admin Baru'}</h2>
                  <p style={{ fontSize: '0.8rem', color: '#a8a29e', marginBottom: 24 }}>
                    {mode === 'login' ? 'Admin yang mengelola data keluarga' : 'Buat akun & keluarga baru'}
                  </p>
                  <form onSubmit={mode === 'login' ? handleAdminLogin : handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {mode === 'register' && (
                      <>
                        {inputWrapper(<User size={15} />, <input className="fi" style={{ paddingLeft: 38 }} placeholder="Nama lengkap Anda" value={adminName} onChange={e => setAdminName(e.target.value)} />)}
                        {inputWrapper(<Building size={15} />, <input className="fi" style={{ paddingLeft: 38 }} placeholder="Nama keluarga (mis: Keluarga Besar Hasan)" value={familyName} onChange={e => setFamilyName(e.target.value)} />)}
                      </>
                    )}
                    {inputWrapper(<Mail size={15} />, <input className="fi" style={{ paddingLeft: 38 }} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />)}
                    {inputWrapper(<Lock size={15} />,
                      <div style={{ position: 'relative' }}>
                        <input className="fi" style={{ paddingLeft: 38, paddingRight: 38 }} type={showPass ? 'text' : 'password'} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
                        <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#a8a29e' }}>
                          {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    )}
                    {error && <p style={{ color: '#dc2626', fontSize: '0.78rem', fontWeight: 600, textAlign: 'center' }}>{error}</p>}
                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ justifyContent: 'center', padding: '13px', fontSize: '0.95rem', marginTop: 4 }}>
                      {loading ? 'Memproses...' : mode === 'login' ? 'Masuk' : 'Daftar & Buat Keluarga'}
                    </button>
                  </form>
                  <div style={{ textAlign: 'center', marginTop: 18, fontSize: '0.8rem', color: '#a8a29e' }}>
                    {mode === 'login' ? (
                      <>Belum punya akun? <button onClick={() => { setMode('register'); setError(''); }} style={{ background: 'none', border: 'none', color: '#d97706', fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>Daftar Gratis</button></>
                    ) : (
                      <>Sudah punya akun? <button onClick={() => { setMode('login'); setError(''); }} style={{ background: 'none', border: 'none', color: '#d97706', fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>Masuk</button></>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ── MEMBER TAB ── */}
              {tab === 'member' && (
                <motion.div key="member" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 4 }}>Masuk sebagai Anggota</h2>
                  <p style={{ fontSize: '0.8rem', color: '#a8a29e', marginBottom: 24 }}>Minta kode keluarga dari admin Anda</p>

                  {!memberList ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div className="form-group">
                        <label className="form-label">Kode Keluarga</label>
                        {inputWrapper(<Key size={15} />,
                          <input className="fi" style={{ paddingLeft: 38, fontFamily: 'monospace', letterSpacing: '0.08em', textTransform: 'uppercase' }} placeholder="Contoh: AB12CD" maxLength={6}
                            value={familyCode} onChange={e => setFamilyCode(e.target.value.toUpperCase())}
                            onKeyDown={e => e.key === 'Enter' && handleLookupFamily()} />
                        )}
                        <div style={{ fontSize: '0.72rem', color: '#a8a29e', marginTop: 4 }}>Minta kode 6 huruf ini dari admin keluargamu</div>
                      </div>
                      {error && <p style={{ color: '#dc2626', fontSize: '0.78rem', fontWeight: 600, textAlign: 'center' }}>{error}</p>}
                      <button className="btn btn-primary" onClick={handleLookupFamily} disabled={loadingFamily} style={{ justifyContent: 'center', padding: '13px', fontSize: '0.95rem' }}>
                        {loadingFamily ? 'Mencari...' : 'Cari Keluarga'}
                      </button>
                    </div>
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div style={{ padding: '10px 14px', background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.2)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#d97706,#b45309)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Users size={15} color="white" />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{memberList.family.name}</div>
                          <div style={{ fontSize: '0.7rem', color: '#a8a29e' }}>{memberList.members.length} anggota dengan PIN</div>
                        </div>
                        <button onClick={() => { setMemberList(null); setFamilyCode(''); setError(''); setSelectedMemberId(''); setPin(''); }} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#a8a29e' }}>
                          <ChevronLeft size={16} />
                        </button>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Pilih Nama Kamu</label>
                        <select className="fi" value={selectedMemberId} onChange={e => setSelectedMemberId(e.target.value)}>
                          <option value="">— Pilih nama —</option>
                          {memberList.members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">PIN</label>
                        {inputWrapper(<Key size={15} />,
                          <input className="fi" style={{ paddingLeft: 38 }} type="password" placeholder="Masukkan PIN kamu" value={pin} onChange={e => setPin(e.target.value)} maxLength={20}
                            onKeyDown={e => e.key === 'Enter' && handleMemberLogin()} />
                        )}
                      </div>
                      {error && <p style={{ color: '#dc2626', fontSize: '0.78rem', fontWeight: 600, textAlign: 'center' }}>{error}</p>}
                      <button className="btn btn-primary" onClick={handleMemberLogin} style={{ justifyContent: 'center', padding: '13px', fontSize: '0.95rem' }}>
                        <Key size={16} /> Masuk
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      <div style={{ textAlign: 'center', padding: '16px', fontSize: '0.75rem', color: '#a8a29e' }}>
        © 2025 FamTree · Platform silsilah keluarga digital
      </div>
    </div>
  );
};

export default AuthPage;
