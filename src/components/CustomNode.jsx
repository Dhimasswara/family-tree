import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Heart, User, MapPin } from 'lucide-react';

const extractCity = (address) => {
  if (!address) return null;
  const parts = address.split(',').map(p => p.trim()).filter(Boolean);
  return parts[parts.length - 1] || null;
};

const FamilyMemberNode = ({ data }) => {
  const isDeceased = !!data.death;
  const isMale = data.gender === 'male';

  const accentDeep = isDeceased ? '#64748b' : isMale ? '#0ea5e9' : '#ec4899';
  const gradient   = isDeceased
    ? 'linear-gradient(135deg,#94a3b8 0%,#64748b 100%)'
    : isMale
      ? 'linear-gradient(135deg,#38bdf8 0%,#6366f1 100%)'
      : 'linear-gradient(135deg,#f472b6 0%,#f43f5e 100%)';

  const birthYear = data.birth && !isNaN(new Date(data.birth).getFullYear())
    ? new Date(data.birth).getFullYear() : '?';
  const deathYear = data.death && !isNaN(new Date(data.death).getFullYear())
    ? new Date(data.death).getFullYear() : null;
  const city = extractCity(data.address);

  return (
    <div className="fnc-wrap">
      <Handle type="target" position={Position.Top}   id="top"          style={{ background: accentDeep, width: 8, height: 8, border: '2px solid white', borderRadius: '50%' }} />
      <Handle type="target" position={Position.Left}  id="left-target"  style={{ opacity: 0, left: 0 }} />
      <Handle type="source" position={Position.Left}  id="left-source"  style={{ opacity: 0, left: 0 }} />
      <Handle type="target" position={Position.Right} id="right-target" style={{ opacity: 0, right: 0 }} />
      <Handle type="source" position={Position.Right} id="right-source" style={{ opacity: 0, right: 0 }} />

      {/* Glow border */}
      <div className="fnc-glow" style={{ background: gradient, opacity: isDeceased ? 0.3 : 0.5 }} />

      <div className={`fnc-card ${isDeceased ? 'deceased' : ''}`}>
        {/* Header */}
        <div className="fnc-header" style={{ background: gradient }}>
          {/* Spouse dots */}
          {data.spouses?.length > 0 && (
            <div className="fnc-spouses">
              {data.spouses.map((s, i) => (
                <div key={i} className={`fnc-heart ${s.type === 'divorced' ? 'divorced' : ''}`} title={s.type === 'divorced' ? 'Bercerai' : 'Menikah'}>
                  <Heart size={7} fill={s.type === 'divorced' ? 'transparent' : 'currentColor'} />
                </div>
              ))}
            </div>
          )}

          {/* Avatar */}
          <div className="fnc-avatar-wrap">
            {data.photo && !data.photo.includes('unsplash.com') ? (
              <img src={data.photo} alt={data.name} className="fnc-avatar-img" />
            ) : (
              <div className="fnc-avatar-placeholder">
                <User size={18} />
              </div>
            )}
            <div className={`fnc-dot ${isDeceased ? 'dead' : 'live'}`} />
          </div>

          {/* Name */}
          <div className="fnc-header-name">{data.name}</div>
        </div>

        {/* Body — fixed 2 rows for uniform card height */}
        <div className="fnc-body">
          <div className="fnc-years" style={{ color: accentDeep }}>
            {birthYear}{deathYear ? ` – ${deathYear}` : ''}
          </div>
          <div className="fnc-row">
            <MapPin size={9} style={{ color: accentDeep, flexShrink: 0 }} />
            <span>{city || '—'}</span>
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} id="bottom" style={{ background: accentDeep, width: 8, height: 8, border: '2px solid white', borderRadius: '50%' }} />
    </div>
  );
};

export default memo(FamilyMemberNode);
