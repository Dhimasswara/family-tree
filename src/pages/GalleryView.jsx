import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image, Send, Trash2, Heart, User } from 'lucide-react';

const formatDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const GalleryView = ({ posts = [], familyMembers = [], currentUser, canEdit, onSave }) => {
  const [showForm, setShowForm]   = useState(false);
  const [text, setText]           = useState('');
  const [photo, setPhoto]         = useState(null);
  const [preview, setPreview]     = useState(null);
  const [likedIds, setLikedIds]   = useState(new Set());
  const [lightbox, setLightbox]   = useState(null);
  const fileRef = useRef();

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      // Resize to max 800px to keep storage light
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 800;
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
        canvas.width  = img.width  * ratio;
        canvas.height = img.height * ratio;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL('image/jpeg', 0.75);
        setPhoto(compressed);
        setPreview(compressed);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!text.trim() && !photo) return;
    const newPost = {
      id: `p${Date.now()}`,
      authorId:   currentUser?.id   || 'anon',
      authorName: currentUser?.name || 'Anonim',
      text:  text.trim(),
      photo: photo || null,
      createdAt: new Date().toISOString(),
      likes: 0,
    };
    onSave([newPost, ...posts]);
    setText(''); setPhoto(null); setPreview(null); setShowForm(false);
  };

  const handleDelete = (id) => {
    onSave(posts.filter(p => p.id !== id));
  };

  const toggleLike = (id) => {
    setLikedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  return (
    <motion.div key="gallery" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px 60px', width: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: '1.4rem' }}>Galeri Keluarga 📸</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>Cerita, momen, dan kenangan bersama</p>
        </div>
        {canEdit && (
          <button className="btn btn-primary" style={{ padding: '9px 18px', fontSize: '0.82rem' }}
            onClick={() => setShowForm(p => !p)}>
            {showForm ? <><X size={14}/> Batal</> : <><Image size={14}/> Tambah Cerita</>}
          </button>
        )}
      </div>

      {/* Form post baru */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="glass" style={{ padding: 20, marginBottom: 24, border: '1px solid var(--primary)', borderRadius: 16 }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#0ea5e9,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User size={16} color="white" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{currentUser?.name || 'Anonim'}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Posting cerita baru</div>
              </div>
            </div>

            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Bagikan cerita, kenangan, atau momen spesial keluarga..."
              className="fi"
              style={{ width: '100%', minHeight: 90, resize: 'vertical', fontFamily: 'inherit', padding: '10px 14px', fontSize: '0.88rem', lineHeight: 1.6, borderRadius: 12, marginBottom: 12 }}
            />

            {preview && (
              <div style={{ position: 'relative', marginBottom: 12 }}>
                <img src={preview} alt="preview" style={{ width: '100%', maxHeight: 240, objectFit: 'cover', borderRadius: 10 }} />
                <button onClick={() => { setPhoto(null); setPreview(null); }}
                  style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 28, height: 28, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={13} />
                </button>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn glass" style={{ fontSize: '0.8rem', padding: '8px 14px' }} onClick={() => fileRef.current.click()}>
                <Image size={13} /> Pilih Foto
              </button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
              <button className="btn btn-primary" style={{ marginLeft: 'auto', fontSize: '0.8rem', padding: '8px 18px' }}
                disabled={!text.trim() && !photo}
                onClick={handleSubmit}>
                <Send size={13} /> Posting
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timeline posts */}
      {posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>📷</div>
          <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 6 }}>Belum ada cerita</div>
          <div style={{ fontSize: '0.82rem' }}>Jadilah yang pertama berbagi momen keluarga!</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {posts.map((post, idx) => {
            const isLiked = likedIds.has(post.id);
            const canDelete = currentUser?.isAdmin || currentUser?.id === post.authorId;
            return (
              <motion.div key={post.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="glass"
                style={{ borderRadius: 16, overflow: 'hidden' }}>

                {/* Post header */}
                <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: `hsl(${(post.authorId?.charCodeAt(0) || 0) * 137 % 360}, 60%, 55%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>{post.authorName?.[0]?.toUpperCase() || '?'}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{post.authorName}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{formatDate(post.createdAt)}</div>
                  </div>
                  {canDelete && (
                    <button onClick={() => handleDelete(post.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center' }}
                      title="Hapus">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                {/* Photo */}
                {post.photo && (
                  <img src={post.photo} alt="post" onClick={() => setLightbox(post.photo)}
                    style={{ width: '100%', maxHeight: 340, objectFit: 'cover', cursor: 'zoom-in', display: 'block' }} />
                )}

                {/* Text */}
                {post.text && (
                  <div style={{ padding: '12px 16px', fontSize: '0.9rem', lineHeight: 1.65, color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>
                    {post.text}
                  </div>
                )}

                {/* Footer: like */}
                <div style={{ padding: '8px 16px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button onClick={() => toggleLike(post.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: isLiked ? '#ef4444' : 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, padding: '4px 8px', borderRadius: 8, transition: 'all 0.15s' }}>
                    <Heart size={14} fill={isLiked ? '#ef4444' : 'transparent'} />
                    {(post.likes || 0) + (isLiked ? 1 : 0)}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, cursor: 'zoom-out' }}>
            <img src={lightbox} alt="full" style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: 12 }} />
            <button onClick={() => setLightbox(null)}
              style={{ position: 'fixed', top: 20, right: 20, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 40, height: 40, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default GalleryView;
