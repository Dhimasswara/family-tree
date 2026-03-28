import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Heart, User } from 'lucide-react';
import { motion } from 'framer-motion';

const FamilyMemberNode = ({ data }) => {
    const isDeceased = !!data.death;
    const isMale = data.gender === 'male';
    const gradient = isDeceased
        ? 'linear-gradient(135deg, #94a3b8, #64748b)'
        : isMale
            ? 'linear-gradient(135deg, #0ea5e9, #6366f1)'
            : 'linear-gradient(135deg, #db2777, #f43f5e)';
    const accentColor = isDeceased ? '#94a3b8' : isMale ? '#0ea5e9' : '#db2777';

    const birthYear = data.birth && !isNaN(new Date(data.birth).getFullYear())
        ? new Date(data.birth).getFullYear() : '?';
    const deathYear = data.death && !isNaN(new Date(data.death).getFullYear())
        ? new Date(data.death).getFullYear() : null;

    return (
        <div className={`fn-card ${data.gender} ${isDeceased ? 'deceased' : ''}`}>
            <Handle type="target" position={Position.Top} id="top" style={{ background: accentColor, width: 8, height: 8, border: '2px solid white' }} />
            <Handle type="target" position={Position.Left}  id="left-target"  style={{ left: 0,  opacity: 0 }} />
            <Handle type="source" position={Position.Left}  id="left-source"  style={{ left: 0,  opacity: 0 }} />
            <Handle type="target" position={Position.Right} id="right-target" style={{ right: 0, opacity: 0 }} />
            <Handle type="source" position={Position.Right} id="right-source" style={{ right: 0, opacity: 0 }} />

            {/* Gradient Header */}
            <div className="fn-header" style={{ background: gradient }}>
                {/* Spouse dots top-right */}
                {data.spouses?.length > 0 && (
                    <div className="fn-spouses">
                        {data.spouses.map((s, i) => (
                            <div key={i} className={`fn-spouse-dot ${s.type || 'married'}`} title={s.type === 'divorced' ? 'Bercerai' : 'Menikah'}>
                                <Heart size={7} fill={s.type === 'divorced' ? 'transparent' : 'currentColor'} />
                            </div>
                        ))}
                    </div>
                )}

                {/* Avatar */}
                <div className="fn-avatar-wrap">
                    {data.photo && !data.photo.includes('unsplash.com') ? (
                        <img src={data.photo} alt={data.name} className="fn-avatar" />
                    ) : (
                        <motion.div
                            className="fn-avatar fn-avatar-placeholder"
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                        >
                            <User size={22} />
                        </motion.div>
                    )}
                    <span className={`fn-status-dot ${isDeceased ? 'deceased' : 'alive'}`} />
                </div>
            </div>

            {/* Body */}
            <div className="fn-body">
                <div className="fn-name">{data.name}</div>

                <div className="fn-years" style={{ color: accentColor }}>
                    {birthYear}{deathYear ? ` – ${deathYear}` : ''}
                </div>

                <div className="fn-tags">
                    <span className={`fn-tag ${isDeceased ? 'tag-deceased' : 'tag-alive'}`}>
                        {isDeceased
                            ? (isMale ? 'Almarhum' : 'Almarhumah')
                            : 'Masih Hidup'}
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

            <Handle type="source" position={Position.Bottom} id="bottom" style={{ background: accentColor, width: 8, height: 8, border: '2px solid white' }} />
        </div>
    );
};

export default memo(FamilyMemberNode);
