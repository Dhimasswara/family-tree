import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image, Send, Trash2, Heart, ChevronDown, ChevronUp, CornerDownRight } from 'lucide-react';

const formatDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const Avatar = ({ name, id, size = 36 }) => {
  const hue = (Array.from(name || 'A').reduce((s, c) => s + c.charCodeAt(0), 0) * 137) % 360;
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: `hsl(${hue},55%,52%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ color: 'white', fontWeight: 700, fontSize: size * 0.38 }}>{(name || '?')[0].toUpperCase()}</span>
    </div>
  );
};

// ── Compress image to max 900px, jpeg 0.78 ──
const compressImage = (file) => new Promise((resolve) => {
  const reader = new FileReader();
  reader.onload = (ev) => {
    const img = new window.Image();
    img.onload = () => {
      const MAX = 900;
      const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(img.width  * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.78));
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
});

// ── Comment thread ──
const CommentThread = ({ comments = [], postId, currentUser, canAdmin, onUpdate }) => {
  const [text, setText]         = useState('');
  const [replyTo, setReplyTo]   = useState(null); // { commentId, authorName }
  const [replyText, setReplyText] = useState('');
  const [expanded, setExpanded] = useState(true);

  const addComment = () => {
    if (!text.trim()) return;
    const c = { id: `c${Date.now()}`, authorId: currentUser.id, authorName: currentUser.name, text: text.trim(), createdAt: new Date().toISOString(), replies: [] };
    onUpdate([...comments, c]);
    setText('');
  };

  const addReply = (commentId) => {
    if (!replyText.trim()) return;
    const r = { id: `r${Date.now()}`, authorId: currentUser.id, authorName: currentUser.name, text: replyText.trim(), createdAt: new Date().toISOString() };
    onUpdate(comments.map(c => c.id === commentId ? { ...c, replies: [...(c.replies || []), r] } : c));
    setReplyText(''); setReplyTo(null);
  };

  const delComment = (commentId) => onUpdate(comments.filter(c => c.id !== commentId));
  const delReply = (commentId, replyId) => onUpdate(comments.map(c => c.id === commentId ? { ...c, replies: (c.replies || []).filter(r => r.id !== replyId) } : c));

  return (
    <div style={{ borderTop: '1px solid var(--border-card)', padding: '10px 16px 14px' }}>
      {/* Toggle */}
      {comments.length > 0 && (
        <button onClick={() => setExpanded(p => !p)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, marginBottom: expanded ? 10 : 0, padding: '2px 0' }}>
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          {comments.length} komentar
        </button>
      )}

      {/* Comment list */}
      <AnimatePresence>
        {expanded && comments.map(c => (
          <motion.div key={c.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <Avatar name={c.authorName} id={c.authorId} size={28} />
              <div style={{ flex: 1 }}>
                <div style={{ background: 'var(--bg-main)', borderRadius: '0 10px 10px 10px', padding: '7px 10px', fontSize: '0.82rem' }}>
                  <span style={{ fontWeight: 700, marginRight: 6 }}>{c.authorName}</span>
                  <span style={{ color: 'var(--text-main)', lineHeight: 1.5 }}>{c.text}</span>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 3, paddingLeft: 4 }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{formatDate(c.createdAt)}</span>
                  {currentUser && (
                    <button onClick={() => { setReplyTo({ commentId: c.id, authorName: c.authorName }); setReplyText(''); }}
                      style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      Balas
                    </button>
                  )}
                  {(canAdmin || currentUser?.id === c.authorId) && (
                    <button onClick={() => delComment(c.id)} style={{ fontSize: '0.68rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Hapus</button>
                  )}
                </div>

                {/* Replies */}
                {(c.replies || []).map(r => (
                  <div key={r.id} style={{ display: 'flex', gap: 8, marginTop: 6, paddingLeft: 8, alignItems: 'flex-start' }}>
                    <CornerDownRight size={11} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 6 }} />
                    <Avatar name={r.authorName} id={r.authorId} size={22} />
                    <div style={{ flex: 1 }}>
                      <div style={{ background: 'var(--bg-main)', borderRadius: '0 8px 8px 8px', padding: '5px 9px', fontSize: '0.78rem' }}>
                        <span style={{ fontWeight: 700, marginRight: 5 }}>{r.authorName}</span>
                        <span>{r.text}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 10, marginTop: 2, paddingLeft: 3 }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{formatDate(r.createdAt)}</span>
                        {(canAdmin || currentUser?.id === r.authorId) && (
                          <button onClick={() => delReply(c.id, r.id)} style={{ fontSize: '0.65rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Hapus</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Reply form */}
                {replyTo?.commentId === c.id && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 8, paddingLeft: 8 }}>
                    <input autoFocus value={replyText} onChange={e => setReplyText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addReply(c.id)}
                      placeholder={`Balas ${replyTo.authorName}...`}
                      className="fi" style={{ flex: 1, padding: '6px 10px', fontSize: '0.78rem', borderRadius: 8 }} />
                    <button onClick={() => addReply(c.id)} className="btn btn-primary" style={{ padding: '6px 10px', fontSize: '0.78rem' }}><Send size={11} /></button>
                    <button onClick={() => setReplyTo(null)} className="btn glass" style={{ padding: '6px 8px' }}><X size={11} /></button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* New comment input */}
      {currentUser && (
        <div style={{ display: 'flex', gap: 8, marginTop: comments.length > 0 ? 6 : 0, alignItems: 'center' }}>
          <Avatar name={currentUser.name} id={currentUser.id} size={28} />
          <input value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addComment()}
            placeholder="Tulis komentar..." className="fi"
            style={{ flex: 1, padding: '7px 12px', fontSize: '0.82rem', borderRadius: 20 }} />
          <button onClick={addComment} className="btn btn-primary" style={{ padding: '7px 11px', borderRadius: 20 }} disabled={!text.trim()}>
            <Send size={13} />
          </button>
        </div>
      )}
    </div>
  );
};

// ── Main GalleryView ──
const GalleryView = ({ posts = [], familyMembers = [], currentUser, canEdit, onSave }) => {
  const [showForm, setShowForm] = useState(false);
  const [text, setText]         = useState('');
  const [photo, setPhoto]       = useState(null);
  const [preview, setPreview]   = useState(null);
  const [likedIds, setLikedIds] = useState(new Set());
  const [lightbox, setLightbox] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const handlePhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const compressed = await compressImage(file);
      setPhoto(compressed);
      setPreview(compressed);
    } finally {
      setUploading(false);
      // Reset input so same file can be re-selected
      e.target.value = '';
    }
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
      comments: [],
    };
    onSave([newPost, ...posts]);
    setText(''); setPhoto(null); setPreview(null); setShowForm(false);
  };

  const handleDelete = (id) => onSave(posts.filter(p => p.id !== id));

  const toggleLike = (id) => setLikedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const updateComments = (postId, comments) => {
    onSave(posts.map(p => p.id === postId ? { ...p, comments } : p));
  };

  return (
    <motion.div key="gallery" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px 60px', width: '100%' }}>

      {/* Hidden file input — always mounted */}
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: '1.35rem' }}>Galeri Keluarga 📸</h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>Cerita, momen, dan kenangan bersama</p>
        </div>
        {canEdit && (
          <button className="btn btn-primary" style={{ padding: '9px 16px', fontSize: '0.82rem' }}
            onClick={() => setShowForm(p => !p)}>
            {showForm ? <><X size={13}/> Batal</> : <><Image size={13}/> Tambah</>}
          </button>
        )}
      </div>

      {/* Compose form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden', marginBottom: 20 }}>
            <div className="glass" style={{ padding: 18, border: '1.5px solid var(--primary)', borderRadius: 16 }}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <Avatar name={currentUser?.name || '?'} id={currentUser?.id} size={34} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{currentUser?.name || 'Anonim'}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Posting ke galeri keluarga</div>
                </div>
              </div>

              <textarea value={text} onChange={e => setText(e.target.value)}
                placeholder="Bagikan cerita, kenangan, atau momen spesial..."
                className="fi"
                style={{ width: '100%', minHeight: 80, resize: 'vertical', fontFamily: 'inherit', padding: '10px 12px', fontSize: '0.88rem', lineHeight: 1.6, borderRadius: 10, marginBottom: 10, boxSizing: 'border-box' }}
              />

              {preview && (
                <div style={{ position: 'relative', marginBottom: 10 }}>
                  <img src={preview} alt="preview" style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 10 }} />
                  <button onClick={() => { setPhoto(null); setPreview(null); }}
                    style={{ position: 'absolute', top: 7, right: 7, background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%', width: 26, height: 26, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={12} />
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn glass" style={{ fontSize: '0.78rem', padding: '7px 12px' }}
                  onClick={() => fileRef.current?.click()} disabled={uploading}>
                  <Image size={12} /> {uploading ? 'Memuat...' : 'Foto'}
                </button>
                <button className="btn btn-primary" style={{ marginLeft: 'auto', fontSize: '0.8rem', padding: '7px 16px' }}
                  disabled={!text.trim() && !photo} onClick={handleSubmit}>
                  <Send size={12} /> Posting
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Posts */}
      {posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2.8rem', marginBottom: 10 }}>📷</div>
          <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 5 }}>Belum ada cerita</div>
          <div style={{ fontSize: '0.82rem' }}>Jadilah yang pertama berbagi momen keluarga!</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {posts.map((post, idx) => {
            const isLiked  = likedIds.has(post.id);
            const canDelete = currentUser?.isAdmin || currentUser?.id === post.authorId;
            return (
              <motion.div key={post.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }} className="glass" style={{ borderRadius: 16, overflow: 'hidden' }}>

                {/* Header */}
                <div style={{ padding: '13px 14px 8px', display: 'flex', alignItems: 'center', gap: 9 }}>
                  <Avatar name={post.authorName} id={post.authorId} size={34} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.86rem' }}>{post.authorName}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{formatDate(post.createdAt)}</div>
                  </div>
                  {canDelete && (
                    <button onClick={() => handleDelete(post.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, borderRadius: 6 }}
                      title="Hapus post">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>

                {/* Photo */}
                {post.photo && (
                  <img src={post.photo} alt="post"
                    onClick={() => setLightbox(post.photo)}
                    style={{ width: '100%', maxHeight: 360, objectFit: 'cover', cursor: 'zoom-in', display: 'block' }} />
                )}

                {/* Caption */}
                {post.text && (
                  <div style={{ padding: '10px 14px 4px', fontSize: '0.88rem', lineHeight: 1.65, color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>
                    {post.text}
                  </div>
                )}

                {/* Reactions bar */}
                <div style={{ padding: '6px 14px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button onClick={() => toggleLike(post.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: isLiked ? '#ef4444' : 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, padding: '4px 8px', borderRadius: 8, transition: 'all 0.15s' }}>
                    <Heart size={14} fill={isLiked ? '#ef4444' : 'transparent'} />
                    {(post.likes || 0) + (isLiked ? 1 : 0)}
                  </button>
                </div>

                {/* Comments */}
                <CommentThread
                  comments={post.comments || []}
                  postId={post.id}
                  currentUser={currentUser}
                  canAdmin={currentUser?.isAdmin}
                  onUpdate={(comments) => updateComments(post.id, comments)}
                />
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
            <img src={lightbox} alt="full" style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: 10 }} />
            <button onClick={() => setLightbox(null)}
              style={{ position: 'fixed', top: 18, right: 18, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 38, height: 38, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={17} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default GalleryView;
