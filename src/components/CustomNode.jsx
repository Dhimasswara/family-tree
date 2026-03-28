import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Heart, User, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

const extractCity = (address) => {
  if (!address) return null;
  const parts = address.split(',').map(p => p.trim()).filter(Boolean);
  return parts[parts.length - 1] || null;
};

const FamilyMemberNode = ({ data }) => {
  const isDeceased = !!data.death;
  const isMale = data.gender === 'male';
  const accent = isDeceased ? '#94a3b8' : isMale ? '#0ea5e9' : '#db2777';
  const gradient = isDeceased
    ? 'linear-gradient(135deg,#94a3b8,#64748b)'
    : isMale
      ? 'linear-gradient(135deg,#0ea5e9,#6366f1)'
      : 'linear-gradient(135deg,#db2777,#f43f5e)';

  const birthYear = data.birth && !isNaN(new Date(data.birth).getFullYear())
    ? new Date(data.birth).getFullYear() : '?';
  const deathYear = data.death && !isNaN(new Date(data.death).getFullYear())
    ? new Date(data.death).getFullYear() : null;
  const city = extractCity(data.address);

  return (
    <div className={`fn-card ${data.gender} ${isDeceased ? 'deceased' : ''}`}>
      <Handle type="target" position={Position.Top} id="top" style={{ background: accent, width: 7, height: 7, border: '2px solid white' }} />
      <Handle type="target" position={Position.Left}  id="left-target"  style={{ left: 0,  opacity: 0 }} />
      <Handle type="source" position={Position.Left}  id="left-source"  style={{ left: 0,  opacity: 0 }} />
      <Handle type="target" position={Position.Right} id="right-target" style={{ right: 0, opacity: 0 }} />
      <Handle type="source" position={Position.Right} id="right-source" style={{ right: 0, opacity: 0 }} />

      {/* Slim gradient strip */}
      <div className="fn-strip" style={{ background: gradient }}>
        {data.spouses?.length > 0 && (
          <div className="fn-spouses">
            {data.spouses.map((s, i) => (
              <div key={i} className={`fn-spouse-dot ${s.type || 'married'}`} title={s.type === 'divorced' ? 'Bercerai' : 'Menikah'}>
                <Heart size={6} fill={s.type === 'divorced' ? 'transparent' : 'currentColor'} />
              </div>
            ))}
          </div>
        )}
        {/* Avatar inline */}
        <div className="fn-avatar-sm">
          {data.photo && !data.photo.includes('unsplash.com') ? (
            <img src={data.photo} alt={data.name} className="fn-avatar-sm-img" />
          ) : (
            <motion.div className="fn-avatar-sm-placeholder"
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}>
              <User size={14} />
            </motion.div>
          )}
          <span className={`fn-status-dot ${isDeceased ? 'deceased' : 'alive'}`} />
        </div>
      </div>

      {/* Body */}
      <div className="fn-body">
        <div className="fn-name">{data.name}</div>
        <div className="fn-years" style={{ color: accent }}>
          {birthYear}{deathYear ? ` – ${deathYear}` : ''}
        </div>
        {city && (
          <div className="fn-city">
            <MapPin size={9} />
            {city}
          </div>
        )}
        <div className="fn-tags" style={{ marginTop: 5 }}>
          <span className={`fn-tag ${isDeceased ? 'tag-deceased' : 'tag-alive'}`}>
            {isDeceased ? (isMale ? 'Almarhum' : 'Almarhumah') : 'Hidup'}
          </span>
          {data.nasabLabel && (
            <span className="fn-tag tag-nasab" style={{
              background: isMale ? 'rgba(14,165,233,0.12)' : 'rgba(219,39,119,0.12)',
              color: isMale ? '#0369a1' : '#be185d',
            }}>
              {data.nasabLabel}
            </span>
          )}
        </div>
        {data.occupation && (
          <div className="fn-occupation">💼 {data.occupation}</div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} id="bottom" style={{ background: accent, width: 7, height: 7, border: '2px solid white' }} />
    </div>
  );
};

export default memo(FamilyMemberNode);
