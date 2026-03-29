import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Send, ArrowLeft, Search, User, Check, CheckCheck, MessageCircle } from 'lucide-react';

export default function MessagesView({ 
  currentFamily, 
  familyMembers, 
  user, 
  familyUser, 
  userRole,
  onBack,
  targetChatId = null 
}) {
  const [messages, setMessages] = useState([]);
  const [activeContactId, setActiveContactId] = useState(targetChatId);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  const messagesEndRef = useRef(null);

  // ID pengirim: Gunakan familyUser.id (text, cocok dgn family_members.id)
  // Jika admin tanpa familyUser, cari family_member yang emailnya cocok
  // ID pengirim: familyUser untuk member login, atau user.id untuk admin
  const myId = useMemo(() => {
    if (familyUser?.id) return familyUser.id;
    if (user?.id) {
      // Coba cari anggota keluarga yang terkait dulu
      const adminMember = familyMembers.find(m => m.userId === user.id || m.email === user.email);
      if (adminMember) return adminMember.id;
      // Fallback: gunakan auth user.id langsung (admin mode)
      return user.id;
    }
    return null;
  }, [familyUser, user, familyMembers]);

  // ── Ambil Seluruh Percakapan ──
  useEffect(() => {
    if (!supabase || !currentFamily?.id || !myId) return;

    const fetchMessages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .eq('family_id', currentFamily.id)
        .or(`sender_id.eq.${myId},receiver_id.eq.${myId}`)
        .order('created_at', { ascending: true });
        
      if (error) console.error('Fetch messages error:', error);
      if (data) setMessages(data);
      setLoading(false);
      setIsInitialLoading(false);
    };

    fetchMessages();

    // ── Realtime Listener ──
    const channel = supabase.channel(`dm-${currentFamily.id}-${myId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'direct_messages',
        filter: `family_id=eq.${currentFamily.id}`
      }, (payload) => {
        const newMsg = payload.new;
        if (newMsg.sender_id === myId || newMsg.receiver_id === myId) {
            setMessages(prev => {
                if (prev.some(m => m.id === newMsg.id)) return prev;
                return [...prev, newMsg];
            });
        }
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'direct_messages',
        filter: `family_id=eq.${currentFamily.id}`
      }, (payload) => {
         setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new : m));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentFamily?.id, myId]);

  // Scroll otomatis ke bawah
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeContactId]);

  // Tandai pesan sebagai dibaca
  useEffect(() => {
    if (!activeContactId || !supabase || !myId) return;
    const unreadMsgs = messages.filter(m => m.sender_id === activeContactId && m.receiver_id === myId && !m.read);
    
    if (unreadMsgs.length > 0) {
       supabase.from('direct_messages')
               .update({ read: true })
               .in('id', unreadMsgs.map(m => m.id))
               .then(() => {});
       setMessages(prev => prev.map(m => 
          (m.sender_id === activeContactId && m.receiver_id === myId) ? { ...m, read: true } : m
       ));
    }
  }, [activeContactId, messages, myId]);

  // ── Fungsi Kirim Pesan ──
  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeContactId || !myId) return;

    const msgText = inputText.trim();
    setInputText('');

    const optimisticMsg = {
      id: 'temp-' + Date.now(),
      family_id: currentFamily.id,
      sender_id: myId,
      receiver_id: activeContactId,
      text: msgText,
      read: false,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimisticMsg]);

    const { data, error } = await supabase
      .from('direct_messages')
      .insert([{
        family_id: currentFamily.id,
        sender_id: myId,
        receiver_id: activeContactId,
        text: msgText,
        read: false,
      }])
      .select();
    
    if (data && data.length > 0) {
        setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? data[0] : m));
    } else if (error) {
        setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
        console.error("Gagal mengirim pesan:", error);
        alert("Gagal mengirim pesan: " + error.message);
    }
  };

  // ── Kontak ──
  // Gabungkan family members + partner percakapan yang tidak ada di daftar (misal Admin)
  const allContacts = useMemo(() => {
    const baseContacts = familyMembers.filter(m => m.id !== myId);
    
    // Cari partner percakapan dari messages yg tidak ada di familyMembers
    const knownIds = new Set(familyMembers.map(m => m.id));
    const extraPartnerIds = new Set();
    messages.forEach(m => {
      if (m.sender_id !== myId && !knownIds.has(m.sender_id)) extraPartnerIds.add(m.sender_id);
      if (m.receiver_id !== myId && !knownIds.has(m.receiver_id)) extraPartnerIds.add(m.receiver_id);
    });
    
    const extraContacts = [...extraPartnerIds].map(id => ({
      id,
      name: 'Admin',
      gender: 'male',
      photo: null,
    }));
    
    return [...baseContacts, ...extraContacts];
  }, [familyMembers, myId, messages]);

  let contacts = allContacts;
  if (searchQuery) {
    contacts = contacts.filter(c => c.name?.toLowerCase().includes(searchQuery.toLowerCase()));
  }

  // Urutkan kontak berdasarkan pesan terakhir
  const contactsWithLastMsg = contacts.map(c => {
    const msgsWithC = messages.filter(m => 
      (m.sender_id === myId && m.receiver_id === c.id) || 
      (m.sender_id === c.id && m.receiver_id === myId)
    );
    const lastMsg = msgsWithC.length > 0 ? msgsWithC[msgsWithC.length - 1] : null;
    const unreadCount = msgsWithC.filter(m => m.sender_id === c.id && m.receiver_id === myId && !m.read).length;
    return { ...c, lastMsg, unreadCount };
  }).sort((a, b) => {
    if (a.lastMsg && b.lastMsg) return new Date(b.lastMsg.created_at) - new Date(a.lastMsg.created_at);
    if (a.lastMsg) return -1;
    if (b.lastMsg) return 1;
    return (a.name || '').localeCompare(b.name || '');
  });

  const activeUser = allContacts.find(m => m.id === activeContactId);
  const activeChat = messages.filter(m => 
    (m.sender_id === myId && m.receiver_id === activeContactId) || 
    (m.sender_id === activeContactId && m.receiver_id === myId)
  );

  return (
    <>
      <style>{`
        .msg-container { display: flex; flex-direction: column; height: 100%; background: var(--bg-main); }
        .msg-header { padding: 14px 20px; background: var(--bg-card); border-bottom: 1px solid var(--border-card); display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
        .msg-body { display: flex; flex: 1; overflow: hidden; }
        
        /* Sidebar */
        .msg-sidebar { width: 340px; min-width: 340px; background: var(--bg-card); border-right: 1px solid var(--border-card); display: flex; flex-direction: column; flex-shrink: 0; }
        .msg-sidebar-search { padding: 14px; }
        .msg-sidebar-list { flex: 1; overflow-y: auto; }
        .msg-search-input { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 12px; border: 1.5px solid var(--border-card); background: var(--bg-main); transition: border-color 0.2s; }
        .msg-search-input:focus-within { border-color: var(--primary); }
        .msg-search-input svg { color: var(--text-muted); flex-shrink: 0; }
        .msg-search-input input { border: none; outline: none; background: transparent; color: var(--text-main); font-size: 0.9rem; font-family: inherit; width: 100%; }
        .msg-search-input input::placeholder { color: var(--text-muted); }
        
        .msg-contact { padding: 12px 16px; display: flex; align-items: center; gap: 12px; cursor: pointer; border-bottom: 1px solid var(--border-card); transition: background 0.15s; }
        .msg-contact:hover { background: var(--bg-hover, rgba(217,119,6,0.04)); }
        .msg-contact.active { background: var(--bg-hover, rgba(217,119,6,0.08)); border-left: 3px solid var(--primary); }
        .msg-contact-avatar { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
        .msg-contact-avatar-placeholder { width: 44px; height: 44px; border-radius: 50%; background: var(--bg-secondary, #f1f5f9); display: flex; align-items: center; justify-content: center; color: var(--text-muted); flex-shrink: 0; }
        .msg-contact-info { flex: 1; overflow: hidden; }
        .msg-contact-name { font-weight: 600; font-size: 0.95rem; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .msg-contact-preview { font-size: 0.8rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }
        .msg-contact-preview.unread { color: var(--text-main); font-weight: 700; }
        .msg-unread-badge { min-width: 20px; height: 20px; border-radius: 10px; background: var(--primary); color: white; font-size: 0.7rem; font-weight: 700; display: flex; align-items: center; justify-content: center; padding: 0 5px; }
        
        /* Chat area */
        .msg-chat { flex: 1; display: flex; flex-direction: column; background: var(--bg-main); }
        .msg-chat-header { padding: 12px 20px; background: var(--bg-card); border-bottom: 1px solid var(--border-card); display: flex; align-items: center; gap: 12px; }
        .msg-chat-header .dm-back-btn { display: none; border: none; background: transparent; color: var(--text-main); padding: 4px; cursor: pointer; }
        .msg-chat-messages { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 4px; }
        .msg-chat-input { padding: 14px 16px; background: var(--bg-card); border-top: 1px solid var(--border-card); }
        .msg-chat-input form { display: flex; gap: 10px; }
        .msg-chat-input input { flex: 1; padding: 11px 18px; border-radius: 24px; border: 1.5px solid var(--border-card); background: var(--bg-main); color: var(--text-main); font-size: 0.95rem; outline: none; font-family: inherit; transition: border-color 0.2s; }
        .msg-chat-input input:focus { border-color: var(--primary); }
        .msg-send-btn { background: var(--primary); color: white; border: none; width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: opacity 0.2s, transform 0.15s; }
        .msg-send-btn:hover:not(:disabled) { transform: scale(1.05); }
        .msg-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        
        /* Bubble */
        .msg-bubble-wrap { display: flex; flex-direction: column; margin-top: 2px; }
        .msg-bubble-wrap.me { align-items: flex-end; }
        .msg-bubble-wrap.other { align-items: flex-start; }
        .msg-bubble-wrap.gap { margin-top: 12px; }
        .msg-bubble { max-width: 75%; padding: 10px 14px; font-size: 0.93rem; line-height: 1.45; word-break: break-word; }
        .msg-bubble.me { background: var(--primary); color: white; border-radius: 18px 18px 4px 18px; }
        .msg-bubble.other { background: var(--bg-card); color: var(--text-main); border-radius: 18px 18px 18px 4px; border: 1px solid var(--border-card); }
        .msg-bubble-time { font-size: 0.65rem; color: var(--text-muted); margin: 3px 6px 0; display: flex; align-items: center; gap: 4px; }
        
        /* Empty state */
        .msg-empty { flex: 1; display: flex; align-items: center; justify-content: center; flex-direction: column; color: var(--text-muted); gap: 12px; }
        .msg-empty-icon { width: 80px; height: 80px; border-radius: 50%; background: var(--bg-card); display: flex; align-items: center; justify-content: center; }
        
        /* Mobile Responsive */
        @media (max-width: 768px) {
          .msg-sidebar { width: 100%; min-width: 100%; }
          .msg-sidebar.hidden-mobile { display: none; }
          .msg-chat-header .dm-back-btn { display: flex; }
        }
      `}</style>

      <div className="msg-container">
        <div className="msg-header">
          <button onClick={onBack} style={{ padding: 6, background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={20} />
          </button>
          <MessageCircle size={20} style={{ color: 'var(--primary)' }} />
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Pesan Langsung</h2>
          {myId && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>{familyMembers.find(m => m.id === myId)?.name || ''}</span>}
        </div>

        {!myId ? (
          <div className="msg-empty" style={{ height: '100%' }}>
            <div className="msg-empty-icon"><MessageCircle size={32} opacity={0.3} /></div>
            <div style={{ textAlign: 'center', maxWidth: 300 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Tidak dapat mengakses pesan</div>
              <div style={{ fontSize: '0.85rem' }}>Akun Anda belum terhubung dengan anggota keluarga manapun. Hubungi admin untuk menautkan profil Anda.</div>
            </div>
          </div>
        ) : (
          <div className="msg-body">
            {/* Sidebar */}
            <div className={`msg-sidebar ${activeContactId ? 'hidden-mobile' : ''}`}>
              <div className="msg-sidebar-search">
                <div className="msg-search-input">
                  <Search size={16} />
                  <input type="text" placeholder="Cari anggota keluarga..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
              </div>
              <div className="msg-sidebar-list">
                {isInitialLoading ? (
                  Array(6).fill(0).map((_, i) => (
                    <div key={i} className="msg-contact" style={{ opacity: 0.5, pointerEvents: 'none' }}>
                      <div className="fnc-avatar-placeholder" style={{ width: 44, height: 44, background: 'var(--border-card)' }} />
                      <div style={{ flex: 1 }}>
                         <div style={{ height: 12, width: '60%', background: 'var(--border-card)', borderRadius: 4, marginBottom: 6 }} />
                         <div style={{ height: 10, width: '40%', background: 'var(--border-card)', borderRadius: 4 }} />
                      </div>
                    </div>
                  ))
                ) : contactsWithLastMsg.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Belum ada kontak
                  </div>
                ) : contactsWithLastMsg.map(contact => (
                  <div 
                    key={contact.id} 
                    className={`msg-contact ${activeContactId === contact.id ? 'active' : ''}`}
                    onClick={() => setActiveContactId(contact.id)}
                  >
                    {contact.photo && !contact.photo.includes('unsplash.com') ? (
                      <img src={contact.photo} alt={contact.name} className="msg-contact-avatar" />
                    ) : (
                      <div className="msg-contact-avatar-placeholder"><User size={20} /></div>
                    )}
                    <div className="msg-contact-info">
                      <div className="msg-contact-name">{contact.name}</div>
                      <div className={`msg-contact-preview ${contact.unreadCount > 0 ? 'unread' : ''}`}>
                        {contact.lastMsg 
                          ? (contact.lastMsg.sender_id === myId ? `Anda: ${contact.lastMsg.text}` : contact.lastMsg.text)
                          : 'Ketuk untuk memulai chat'}
                      </div>
                    </div>
                    {contact.unreadCount > 0 && (
                      <div className="msg-unread-badge">{contact.unreadCount}</div>
                    )}
                  </div>
                ))}
                {contactsWithLastMsg.length === 0 && (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {searchQuery ? 'Tidak ditemukan.' : 'Belum ada kontak.'}
                  </div>
                )}
              </div>
            </div>

            {/* Chat area */}
            {activeContactId && activeUser ? (
              <div className="msg-chat">
                <div className="msg-chat-header">
                  <button className="dm-back-btn" onClick={() => setActiveContactId(null)}>
                    <ArrowLeft size={20} />
                  </button>
                  {activeUser.photo && !activeUser.photo.includes('unsplash.com') ? (
                    <img src={activeUser.photo} alt={activeUser.name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-secondary, #f1f5f9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={18} /></div>
                  )}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{activeUser.name}</div>
                    {activeUser.occupation && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{activeUser.occupation}</div>}
                  </div>
                </div>

                <div className="msg-chat-messages">
                  {activeChat.length === 0 && (
                    <div className="msg-empty">
                      <div className="msg-empty-icon"><Send size={28} opacity={0.3} /></div>
                      <span>Mulai percakapan dengan {activeUser.name?.split(' ')[0]}</span>
                    </div>
                  )}
                  {activeChat.map((msg, idx) => {
                    const isMe = msg.sender_id === myId;
                    const prevMsg = activeChat[idx - 1];
                    const isGap = prevMsg && prevMsg.sender_id !== msg.sender_id;

                    return (
                      <div key={msg.id} className={`msg-bubble-wrap ${isMe ? 'me' : 'other'} ${isGap ? 'gap' : ''}`}>
                        <div className={`msg-bubble ${isMe ? 'me' : 'other'}`}>
                          {msg.text}
                        </div>
                        <div className="msg-bubble-time">
                          {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          {isMe && (msg.read ? <CheckCheck size={12} color="var(--primary)" /> : <Check size={12} />)}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <div className="msg-chat-input">
                  <form onSubmit={handleSend}>
                    <input 
                      type="text" 
                      value={inputText} 
                      onChange={e => setInputText(e.target.value)} 
                      placeholder="Ketik pesan..."
                      autoFocus
                    />
                    <button type="submit" className="msg-send-btn" disabled={!inputText.trim()}>
                      <Send size={18} style={{ marginLeft: 2 }} />
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="msg-empty" style={{ flex: 1 }}>
                <div className="msg-empty-icon"><MessageCircle size={32} opacity={0.3} /></div>
                <span>Pilih kontak untuk mulai berkirim pesan</span>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
