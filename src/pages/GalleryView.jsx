import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image, Send, Trash2, Heart, ChevronDown, ChevronUp, CornerDownRight, MapPin, Crop, Loader } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { supabase } from '../lib/supabase';

// ── Helpers ──
const formatDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const Avatar = ({ name = '?', size = 36 }) => {
  const hue = Array.from(name).reduce((s, c) => s + c.charCodeAt(0), 0) * 137 % 360;
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: `hsl(${hue},52%,50%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ color: 'white', fontWeight: 700, fontSize: size * 0.4 }}>{name[0].toUpperCase()}</span>
    </div>
  );
};

const MAX_IMG = 1000; // max px on longest side
const getCroppedImg = (imageSrc, pixelCrop) => new Promise((resolve, reject) => {
  const image = new window.Image();
  image.onload = () => {
    let w = pixelCrop.width, h = pixelCrop.height;
    if (w > MAX_IMG || h > MAX_IMG) {
      const scale = Math.min(MAX_IMG / w, MAX_IMG / h);
      w = Math.round(w * scale); h = Math.round(h * scale);
    }
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    canvas.getContext('2d').drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, w, h);
    resolve(canvas.toDataURL('image/jpeg', 0.72));
  };
  image.onerror = reject;
  image.src = imageSrc;
});

// ── Location Autocomplete ──
const LocationInput = ({ value, onChange }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loadingLoc, setLoadingLoc]   = useState(false);
  const [open, setOpen]               = useState(false);
  const debounceRef = useRef(null);
  const wrapRef     = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = (q) => {
    onChange(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) { setSuggestions([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      setLoadingLoc(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&addressdetails=1`,
          { headers: { 'Accept-Language': 'id', 'User-Agent': 'FamTree/1.0' } }
        );
        const data = await res.json();
        setSuggestions(data.map(d => {
          const a = d.address || {};
          const parts = [a.city || a.town || a.village || a.county, a.state, a.country].filter(Boolean);
          return { label: parts.join(', ') || d.display_name, full: d.display_name };
        }));
        setOpen(true);
      } catch (_) {}
      setLoadingLoc(false);
    }, 550);
  };

  const pick = (label) => { onChange(label); setSuggestions([]); setOpen(false); };

  return (
    <div ref={wrapRef} style={{ position: 'relative', flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-main)', borderRadius: 8, border: '1px solid var(--border-card)', padding: '5px 10px' }}>
        <MapPin size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <input
          value={value}
          onChange={e => search(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder="Tambah lokasi (opsional)..."
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '0.8rem', fontFamily: 'inherit', color: 'var(--text-main)' }}
        />
        {loadingLoc && <Loader size={11} style={{ color: 'var(--text-muted)', animation: 'spin 1s linear infinite', flexShrink: 0 }} />}
        {value && !loadingLoc && (
          <button onClick={() => { onChange(''); setSuggestions([]); setOpen(false); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex', alignItems: 'center' }}>
            <X size={11}/>
          </button>
        )}
      </div>
      <AnimatePresence>
        {open && suggestions.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 9999, background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', marginTop: 4, overflow: 'hidden' }}>
            {suggestions.map((s, i) => (
              <button key={i} onMouseDown={() => pick(s.label)}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 8, width: '100%', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: i < suggestions.length - 1 ? '1px solid var(--border-card)' : 'none' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-main)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                <MapPin size={11} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: '0.79rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.3 }}>{s.label}</div>
                  <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', lineHeight: 1.3, marginTop: 1 }}>{s.full}</div>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Crop Modal ──
const CropModal = ({ src, onConfirm, onCancel }) => {
  const [crop, setCrop]     = useState({ x: 0, y: 0 });
  const [zoom, setZoom]     = useState(1);
  const [aspect, setAspect] = useState(4 / 3);
  const cropAreaRef = useRef(null);

  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    cropAreaRef.current = croppedAreaPixels;
  }, []);

  const handleConfirm = async () => {
    if (!cropAreaRef.current) return;
    const cropped = await getCroppedImg(src, cropAreaRef.current);
    onConfirm(cropped);
  };

  const aspects = [
    { label: '4:3', val: 4/3 },
    { label: '1:1', val: 1 },
    { label: '16:9', val: 16/9 },
    { label: '3:4', val: 3/4 },
    { label: 'Bebas', val: undefined },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(0,0,0,0.5)', flexShrink: 0 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#d97706,#b45309)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Crop size={15} color="white" />
        </div>
        <span style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>Sesuaikan Foto</span>
        <button onClick={onCancel} style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 32, height: 32, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X size={15} />
        </button>
      </div>
      <div style={{ flex: 1, position: 'relative' }}>
        <Cropper image={src} crop={crop} zoom={zoom} aspect={aspect}
          onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />
      </div>
      <div style={{ padding: '14px 18px', background: 'rgba(0,0,0,0.5)', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          {aspects.map(a => (
            <button key={a.label} onClick={() => setAspect(a.val)}
              style={{ padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'Outfit,sans-serif',
                background: aspect === a.val ? '#d97706' : 'rgba(255,255,255,0.15)', color: 'white' }}>
              {a.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', width: 40 }}>Zoom</span>
          <input type="range" min={1} max={3} step={0.05} value={zoom} onChange={e => setZoom(+e.target.value)}
            style={{ flex: 1, accentColor: '#d97706' }} />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel}
            style={{ flex: 1, padding: '11px', background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 10, color: 'white', fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit,sans-serif', fontSize: '0.88rem' }}>
            Batal
          </button>
          <button onClick={handleConfirm}
            style={{ flex: 2, padding: '11px', background: 'linear-gradient(135deg,#d97706,#b45309)', border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit,sans-serif', fontSize: '0.88rem' }}>
            ✓ Gunakan Foto Ini
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ── Comment Thread ──
const CommentThread = ({ comments = [], currentUser, canAdmin, onUpdate, onMemberClick }) => {
  const [text, setText]           = useState('');
  const [replyTo, setReplyTo]     = useState(null);
  const [replyText, setReplyText] = useState('');
  const [expanded, setExpanded]   = useState(true);

  const addComment = () => {
    if (!text.trim()) return;
    onUpdate([...comments, { id: `c${Date.now()}`, authorId: currentUser.id, authorName: currentUser.name, text: text.trim(), createdAt: new Date().toISOString(), replies: [] }]);
    setText('');
  };
  const addReply = (cid) => {
    if (!replyText.trim()) return;
    onUpdate(comments.map(c => c.id === cid ? { ...c, replies: [...(c.replies || []), { id: `r${Date.now()}`, authorId: currentUser.id, authorName: currentUser.name, text: replyText.trim(), createdAt: new Date().toISOString() }] } : c));
    setReplyText(''); setReplyTo(null);
  };
  const delComment = (cid)      => onUpdate(comments.filter(c => c.id !== cid));
  const delReply   = (cid, rid) => onUpdate(comments.map(c => c.id === cid ? { ...c, replies: (c.replies||[]).filter(r => r.id !== rid) } : c));

  return (
    <div style={{ borderTop: '1px solid var(--border-card)', padding: '10px 14px 12px' }}>
      {comments.length > 0 && (
        <button onClick={() => setExpanded(p => !p)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, marginBottom: expanded ? 10 : 4, padding: '2px 0' }}>
          {expanded ? <ChevronUp size={12}/> : <ChevronDown size={12}/>} {comments.length} komentar
        </button>
      )}
      <AnimatePresence>
        {expanded && comments.map(c => (
          <motion.div key={c.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
              <div 
                style={{ cursor: onMemberClick ? 'pointer' : 'default' }} 
                onClick={() => onMemberClick && onMemberClick(c.authorId)}
              >
                <Avatar name={c.authorName} size={26} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ background: 'var(--bg-main)', borderRadius: '0 10px 10px 10px', padding: '6px 10px', fontSize: '0.82rem' }}>
                  <span 
                    style={{ fontWeight: 700, marginRight: 5, cursor: onMemberClick ? 'pointer' : 'default' }}
                    onClick={() => onMemberClick && onMemberClick(c.authorId)}
                  >
                    {c.authorName}
                  </span>
                  <span style={{ lineHeight: 1.5 }}>{c.text}</span>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 2, paddingLeft: 3 }}>
                  <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>{formatDate(c.createdAt)}</span>
                  {currentUser && <button onClick={() => { setReplyTo({ cid: c.id, name: c.authorName }); setReplyText(''); }} style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Balas</button>}
                  {(canAdmin || currentUser?.id === c.authorId) && <button onClick={() => delComment(c.id)} style={{ fontSize: '0.66rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Hapus</button>}
                </div>
                {(c.replies||[]).map(r => (
                  <div key={r.id} style={{ display: 'flex', gap: 6, marginTop: 5, paddingLeft: 6, alignItems: 'flex-start' }}>
                    <CornerDownRight size={10} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 5 }}/>
                    <Avatar name={r.authorName} size={20} />
                    <div style={{ flex: 1 }}>
                      <div style={{ background: 'var(--bg-main)', borderRadius: '0 8px 8px 8px', padding: '4px 8px', fontSize: '0.78rem' }}>
                        <span style={{ fontWeight: 700, marginRight: 4 }}>{r.authorName}</span><span>{r.text}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 1, paddingLeft: 2 }}>
                        <span style={{ fontSize: '0.63rem', color: 'var(--text-muted)' }}>{formatDate(r.createdAt)}</span>
                        {(canAdmin || currentUser?.id === r.authorId) && <button onClick={() => delReply(c.id, r.id)} style={{ fontSize: '0.63rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Hapus</button>}
                      </div>
                    </div>
                  </div>
                ))}
                {replyTo?.cid === c.id && (
                  <div style={{ display: 'flex', gap: 5, marginTop: 6, paddingLeft: 6 }}>
                    <input autoFocus value={replyText} onChange={e => setReplyText(e.target.value)} onKeyDown={e => e.key === 'Enter' && addReply(c.id)}
                      placeholder={`Balas ${replyTo.name}...`} className="fi" style={{ flex: 1, padding: '5px 9px', fontSize: '0.76rem', borderRadius: 8 }}/>
                    <button onClick={() => addReply(c.id)} className="btn btn-primary" style={{ padding: '5px 9px' }}><Send size={11}/></button>
                    <button onClick={() => setReplyTo(null)} className="btn glass" style={{ padding: '5px 7px' }}><X size={11}/></button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      {currentUser && (
        <div style={{ display: 'flex', gap: 7, marginTop: 4, alignItems: 'center' }}>
          <Avatar name={currentUser.name} size={26} />
          <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && addComment()}
            placeholder="Tulis komentar..." className="fi" style={{ flex: 1, padding: '6px 11px', fontSize: '0.8rem', borderRadius: 20 }}/>
          <button onClick={addComment} className="btn btn-primary" style={{ padding: '6px 10px', borderRadius: 20 }} disabled={!text.trim()}><Send size={12}/></button>
        </div>
      )}
    </div>
  );
};

// ── Main GalleryView ──
// posts + loading come from App.jsx (persists across view switches)
// Mutations (add/delete/like/comment) still go directly to Supabase here
const GalleryView = ({ familyId, posts = [], loading = false, currentUser, canEdit, familyMembers, onMemberClick }) => {
  const [showForm, setShowForm] = useState(false);
  const [text, setText]         = useState('');
  const [location, setLocation] = useState('');
  const [rawSrc, setRawSrc]     = useState(null);
  const [photo, setPhoto]       = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [saving, setSaving]         = useState(false);
  const [errMsg, setErrMsg]         = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // post id to delete
  const fileRef = useRef();

  const userId = currentUser?.id || 'anon';

  // ── File pick ──
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setRawSrc(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // ── Submit post ──
  const handleSubmit = async () => {
    if (!text.trim() && !photo) return;
    if (!supabase || !familyId) { setErrMsg('Tidak terhubung ke database.'); return; }
    setSaving(true);
    setErrMsg(null);
    const post = {
      id: `p${Date.now()}`,
      family_id: familyId,
      author_id: currentUser?.id || 'anon',
      author_name: currentUser?.name || 'Anonim',
      text: text.trim(),
      photo: photo || null,
      location: location.trim() || null,
      created_at: new Date().toISOString(),
      liked_by: [],
      comments: [],
    };
    setText(''); setPhoto(null); setLocation(''); setShowForm(false);
    const { error } = await supabase.from('gallery_posts').insert(post);
    if (error) {
      setErrMsg('Gagal memposting: ' + error.message);
      console.error('Gagal post:', error.message);
    }
    setSaving(false);
  };

  // ── Delete post ──
  const handleDelete = async (id) => {
    await supabase?.from('gallery_posts').delete().eq('id', id);
  };

  // ── Toggle like ──
  const toggleLike = async (id) => {
    const post = posts.find(p => p.id === id);
    if (!post) return;
    const likedBy = post.liked_by || [];
    const newLikedBy = likedBy.includes(userId)
      ? likedBy.filter(x => x !== userId)
      : [...likedBy, userId];
    await supabase?.from('gallery_posts').update({ liked_by: newLikedBy }).eq('id', id);
  };

  // ── Update comments ──
  const updateComments = async (postId, comments) => {
    await supabase?.from('gallery_posts').update({ comments }).eq('id', postId);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ maxWidth: 660, margin: '0 auto', padding: '22px 14px 60px', width: '100%' }}>

      {/* Hidden file input */}
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />

      {/* Crop modal */}
      <AnimatePresence>
        {rawSrc && (
          <CropModal
            src={rawSrc}
            onConfirm={(cropped) => { setPhoto(cropped); setRawSrc(null); }}
            onCancel={() => setRawSrc(null)}
          />
        )}
      </AnimatePresence>

      {/* Error toast */}
      <AnimatePresence>
        {errMsg && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: '#b91c1c' }}>
            <span style={{ flex: 1 }}>{errMsg}</span>
            <button onClick={() => setErrMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b91c1c', padding: 2 }}><X size={13}/></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: '1.3rem' }}>Galeri Keluarga 📸</h2>
          <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 2 }}>Cerita, momen, dan kenangan bersama</p>
        </div>
        {canEdit && (
          <button className="btn btn-primary" style={{ padding: '8px 14px', fontSize: '0.8rem' }} onClick={() => setShowForm(p => !p)}>
            {showForm ? <><X size={12}/> Batal</> : <><Image size={12}/> Tambah</>}
          </button>
        )}
      </div>

      {/* Compose form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', marginBottom: 18 }}>
            <div className="glass" style={{ padding: 16, border: '1.5px solid var(--primary)', borderRadius: 14 }}>
              <div style={{ display: 'flex', gap: 9, marginBottom: 10 }}>
                <Avatar name={currentUser?.name || '?'} size={32} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.84rem' }}>{currentUser?.name || 'Anonim'}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Posting ke galeri keluarga</div>
                </div>
              </div>

              <textarea value={text} onChange={e => setText(e.target.value)}
                placeholder="Bagikan cerita, kenangan, atau momen spesial..."
                className="fi"
                style={{ width: '100%', minHeight: 76, resize: 'vertical', fontFamily: 'inherit', padding: '9px 11px', fontSize: '0.86rem', lineHeight: 1.6, borderRadius: 10, marginBottom: 8, boxSizing: 'border-box' }}
              />

              <div style={{ marginBottom: 10 }}>
                <LocationInput value={location} onChange={setLocation} />
              </div>

              {photo && (
                <div style={{ position: 'relative', marginBottom: 10 }}>
                  <img src={photo} alt="preview" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 9 }}/>
                  <button onClick={() => setPhoto(null)}
                    style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 24, height: 24, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={11}/>
                  </button>
                  <button onClick={() => fileRef.current?.click()}
                    style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: 7, padding: '4px 8px', color: 'white', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Crop size={10}/> Ganti
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', gap: 7 }}>
                <button className="btn glass" style={{ fontSize: '0.76rem', padding: '6px 11px' }} onClick={() => fileRef.current?.click()}>
                  <Image size={12}/> {photo ? 'Ganti Foto' : 'Pilih Foto'}
                </button>
                <button className="btn btn-primary" style={{ marginLeft: 'auto', fontSize: '0.78rem', padding: '6px 14px' }}
                  disabled={(!text.trim() && !photo) || saving} onClick={handleSubmit}>
                  {saving ? <Loader size={11} style={{ animation: 'spin 0.8s linear infinite' }}/> : <><Send size={11}/> Posting</>}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Posts */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <Loader size={28} style={{ animation: 'spin 1s linear infinite', opacity: 0.5, display: 'block', margin: '0 auto 12px' }} />
          <div style={{ fontSize: '0.82rem' }}>Memuat galeri...</div>
        </div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '56px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2.6rem', marginBottom: 10 }}>📷</div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>Belum ada cerita</div>
          <div style={{ fontSize: '0.8rem' }}>Jadilah yang pertama berbagi momen keluarga!</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {posts.map((post, idx) => {
            const likedBy  = post.liked_by || [];
            const isLiked  = likedBy.includes(userId);
            const canDelete = currentUser?.isAdmin || currentUser?.id === post.author_id;
            return (
              <motion.div key={post.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                className="glass" style={{ borderRadius: 14, overflow: 'hidden' }}>

                {/* Header */}
                <div style={{ padding: '12px 13px 7px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div 
                    style={{ cursor: 'pointer' }} 
                    onClick={() => onMemberClick && onMemberClick(post.author_id)}
                  >
                    <Avatar name={post.author_name} size={32} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div 
                      style={{ fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                      onClick={() => onMemberClick && onMemberClick(post.author_id)}
                    >
                      {post.author_name}
                    </div>
                    <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span>{formatDate(post.created_at)}</span>
                      {post.location && <><span>·</span><MapPin size={9}/><span>{post.location}</span></>}
                    </div>
                  </div>
                  {canDelete && (
                    <button onClick={() => setConfirmDelete(post.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 3 }}><Trash2 size={13}/></button>
                  )}
                </div>

                {/* Photo */}
                {post.photo && (
                  <img src={post.photo} alt="post" onClick={() => setLightbox(post.photo)}
                    style={{ width: '100%', maxHeight: 340, objectFit: 'cover', cursor: 'zoom-in', display: 'block' }}/>
                )}

                {/* Text */}
                {post.text && (
                  <div style={{ padding: '9px 13px 3px', fontSize: '0.87rem', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{post.text}</div>
                )}

                {/* Like bar */}
                <div style={{ padding: '5px 13px 6px', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button onClick={() => toggleLike(post.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: isLiked ? '#ef4444' : 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600, padding: '3px 7px', borderRadius: 7, transition: 'all 0.15s' }}>
                    <Heart size={13} fill={isLiked ? '#ef4444' : 'transparent'}/> {likedBy.length}
                  </button>
                </div>

                {/* Comments */}
                <CommentThread
                  comments={post.comments || []}
                  currentUser={currentUser}
                  canAdmin={currentUser?.isAdmin}
                  onUpdate={(comments) => updateComments(post.id, comments)}
                  onMemberClick={onMemberClick}
                />
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Confirm delete modal */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 99998, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="glass" style={{ borderRadius: 16, padding: '24px 22px', maxWidth: 320, width: '100%', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: 10 }}>🗑️</div>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 6 }}>Hapus postingan?</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 20 }}>Postingan ini akan dihapus permanen dan tidak bisa dikembalikan.</div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setConfirmDelete(null)} className="btn glass" style={{ flex: 1, padding: '10px', fontSize: '0.85rem' }}>Batal</button>
                <button onClick={() => { handleDelete(confirmDelete); setConfirmDelete(null); }}
                  style={{ flex: 1, padding: '10px', background: '#ef4444', border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'Outfit,sans-serif' }}>
                  Hapus
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, cursor: 'zoom-out' }}>
            <img src={lightbox} alt="full" style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: 10 }}/>
            <button onClick={() => setLightbox(null)}
              style={{ position: 'fixed', top: 16, right: 16, background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 36, height: 36, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={16}/>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default GalleryView;
