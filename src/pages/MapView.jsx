import React, { useEffect, useState, useRef } from 'react';
import { MapPin, Users, X } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const extractCity = (address) => {
  if (!address) return null;
  const parts = address.split(',').map(p => p.trim()).filter(Boolean);
  return parts[parts.length - 1] || null;
};

// Geocode using Nominatim (free, no key needed)
const geocodeCache = {};
const geocodeCity = async (city) => {
  if (!city) return null;
  if (geocodeCache[city]) return geocodeCache[city];
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city + ', Indonesia')}&format=json&limit=1`, {
      headers: { 'Accept-Language': 'id', 'User-Agent': 'FamTree/1.0' }
    });
    const data = await res.json();
    if (data?.[0]) {
      const result = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      geocodeCache[city] = result;
      return result;
    }
  } catch (_) {}
  return null;
};

const MapBounds = ({ markers }) => {
  const map = useMap();
  useEffect(() => {
    if (markers.length === 0) return;
    if (markers.length === 1) {
      map.setView([markers[0].lat, markers[0].lng], 10);
    } else {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [markers, map]);
  return null;
};

const MapView = ({ familyMembers, onClose }) => {
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const geocodeAll = async () => {
      setLoading(true);
      // Group members by city
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
        // Rate limit: Nominatim requires 1 req/sec
        if (i < cities.length - 1) await new Promise(r => setTimeout(r, 1100));
      }
      setMarkers(results);
      setLoading(false);
    };
    geocodeAll();
  }, [familyMembers]);

  const membersWithCity = familyMembers.filter(m => extractCity(m.address));
  const membersNoCity = familyMembers.length - membersWithCity.length;

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
            {markers.length} kota · {membersWithCity.length} anggota terpetakan
            {membersNoCity > 0 && ` · ${membersNoCity} belum punya alamat`}
          </div>
        </div>
        <button onClick={onClose} style={{ marginLeft: 'auto', width: 34, height: 34, borderRadius: 9, border: '1px solid var(--border-card)', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
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
        <MapContainer
          center={[-2.5, 118]}
          zoom={5}
          style={{ width: '100%', height: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {markers.length > 0 && <MapBounds markers={markers} />}
          {markers.map((m, i) => (
            <Marker key={i} position={[m.lat, m.lng]}>
              <Popup>
                <div style={{ fontFamily: 'Outfit, sans-serif', minWidth: 160 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: 8, color: '#1c1917', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MapPin size={14} color="#d97706" /> {m.city}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#78716c', marginBottom: 6 }}>{m.members.length} anggota keluarga</div>
                  {m.members.slice(0, 5).map(mem => (
                    <div key={mem.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: mem.gender === 'male' ? '#e0f2fe' : '#fce7f3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Users size={10} color={mem.gender === 'male' ? '#0284c7' : '#be185d'} />
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1c1917' }}>{mem.name}</span>
                      {mem.death && <span style={{ fontSize: '0.65rem', color: '#94a3b8', marginLeft: 'auto' }}>†</span>}
                    </div>
                  ))}
                  {m.members.length > 5 && (
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 4 }}>+{m.members.length - 5} lainnya</div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Bottom legend */}
      {!loading && markers.length === 0 && (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <MapPin size={32} style={{ opacity: 0.3, marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
          Belum ada anggota dengan alamat lengkap.<br />Tambahkan alamat di profil anggota.
        </div>
      )}
    </div>
  );
};

export default MapView;
