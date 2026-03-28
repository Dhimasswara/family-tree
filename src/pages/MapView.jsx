import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Users, X } from 'lucide-react';

const extractCity = (address) => {
  if (!address) return null;
  const parts = address.split(',').map(p => p.trim()).filter(Boolean);
  return parts[parts.length - 1] || null;
};

const geocodeCache = {};
const geocodeCity = async (city) => {
  if (!city) return null;
  if (geocodeCache[city]) return geocodeCache[city];
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city + ', Indonesia')}&format=json&limit=1`,
      { headers: { 'Accept-Language': 'id', 'User-Agent': 'FamTree/1.0' } }
    );
    const data = await res.json();
    if (data?.[0]) {
      const result = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      geocodeCache[city] = result;
      return result;
    }
  } catch (_) {}
  return null;
};

const MapView = ({ familyMembers, onClose }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [markerCount, setMarkerCount] = useState(0);

  const membersWithCity = familyMembers.filter(m => extractCity(m.address));
  const membersNoCity = familyMembers.length - membersWithCity.length;

  useEffect(() => {
    // Dynamically load Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const initMap = async () => {
      // Dynamically import Leaflet
      const L = (await import('leaflet')).default;

      // Fix default icon
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!mapRef.current || mapInstanceRef.current) return;

      const map = L.map(mapRef.current).setView([-2.5, 118], 5);
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      // Group by city
      const cityMap = {};
      familyMembers.forEach(m => {
        const city = extractCity(m.address);
        if (!city) return;
        if (!cityMap[city]) cityMap[city] = [];
        cityMap[city].push(m);
      });

      const cities = Object.keys(cityMap);
      const results = [];

      for (let i = 0; i < cities.length; i++) {
        const city = cities[i];
        setProgress(Math.round(((i + 1) / cities.length) * 100));
        const coords = await geocodeCity(city);
        if (coords) {
          results.push({ ...coords, city, members: cityMap[city] });
        }
        if (i < cities.length - 1) await new Promise(r => setTimeout(r, 1100));
      }

      // Add markers
      results.forEach(m => {
        const memberList = m.members.slice(0, 5)
          .map(mem => `
            <div style="display:flex;align-items:center;gap:6px;padding:3px 0;border-bottom:1px solid #f1f5f9">
              <div style="width:20px;height:20px;border-radius:50%;background:${mem.gender === 'male' ? '#e0f2fe' : '#fce7f3'};display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:10px">
                ${mem.gender === 'male' ? '♂' : '♀'}
              </div>
              <span style="font-size:0.8rem;font-weight:600;color:#1c1917">${mem.name}</span>
              ${mem.death ? '<span style="font-size:0.65rem;color:#94a3b8;margin-left:auto">†</span>' : ''}
            </div>
          `).join('');

        const extra = m.members.length > 5
          ? `<div style="font-size:0.72rem;color:#94a3b8;margin-top:4px">+${m.members.length - 5} lainnya</div>`
          : '';

        const popup = L.popup().setContent(`
          <div style="font-family:Outfit,sans-serif;min-width:160px">
            <div style="font-weight:800;font-size:0.95rem;margin-bottom:8px;color:#1c1917;display:flex;align-items:center;gap:6px">
              📍 ${m.city}
            </div>
            <div style="font-size:0.78rem;color:#78716c;margin-bottom:6px">${m.members.length} anggota keluarga</div>
            ${memberList}
            ${extra}
          </div>
        `);

        L.marker([m.lat, m.lng]).addTo(map).bindPopup(popup);
      });

      setMarkerCount(results.length);

      // Fit bounds
      if (results.length === 1) {
        map.setView([results[0].lat, results[0].lng], 10);
      } else if (results.length > 1) {
        const bounds = L.latLngBounds(results.map(r => [r.lat, r.lng]));
        map.fitBounds(bounds, { padding: [40, 40] });
      }

      setLoading(false);
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'var(--bg-main)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '14px 20px', background: 'var(--bg-header)', borderBottom: '1px solid var(--border-card)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, backdropFilter: 'blur(16px)' }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#0ea5e9,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <MapPin size={18} color="white" />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1rem' }}>Peta Persebaran Keluarga</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {loading ? `Memuat lokasi... ${progress}%` : `${markerCount} kota · ${membersWithCity.length} anggota terpetakan${membersNoCity > 0 ? ` · ${membersNoCity} belum punya alamat` : ''}`}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ marginLeft: 'auto', width: 34, height: 34, borderRadius: 9, border: '1px solid var(--border-card)', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: 'relative' }}>
        {loading && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <div style={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>Memuat lokasi... {progress}%</div>
            <div style={{ width: 200, height: 6, background: 'rgba(255,255,255,0.2)', borderRadius: 3 }}>
              <div style={{ width: `${progress}%`, height: '100%', background: '#38bdf8', borderRadius: 3, transition: 'width 0.3s' }} />
            </div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>Menggunakan OpenStreetMap (gratis)</div>
          </div>
        )}
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      </div>

      {!loading && markerCount === 0 && (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <MapPin size={32} style={{ opacity: 0.3, marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
          Belum ada anggota dengan alamat lengkap.<br />Tambahkan alamat di profil anggota.
        </div>
      )}
    </div>
  );
};

export default MapView;
