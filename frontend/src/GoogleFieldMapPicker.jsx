import React, { useEffect, useRef, useState, useMemo } from 'react';
import { MapPin, X, Pencil, Target } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Known agricultural preset coordinates in Bangladesh research zones
const PRESETS = [
  { name: 'Rajshahi / Barind', lat: 24.3636, lng: 88.6241, desc: 'Barind Groundwater Stress Zone' },
  { name: 'Chapainawabganj', lat: 24.62, lng: 88.55, desc: 'Rahim Demo Barind Plot' },
  { name: 'Bogura', lat: 24.8467, lng: 89.3777, desc: 'Intensive Multi-Crop Alluvial Plain' },
  { name: 'Dhaka', lat: 23.8103, lng: 90.4125, desc: 'Central Agricultural Basin' },
  { name: 'Barisal', lat: 22.7010, lng: 90.3535, desc: 'Coastal Salinity / Tidal Zone' },
];

/**
 * Calculates a field's polygon coordinates:
 * If field has stored boundary (array of [lat, lng]), return it.
 * Otherwise, generate a square polygon centered at (lat, lng) matching area_ha.
 */
export function getFieldPolygon(field) {
  if (field?.boundary && Array.isArray(field.boundary) && field.boundary.length >= 3) {
    return field.boundary.map(p => Array.isArray(p) ? [Number(p[0]), Number(p[1])] : [Number(p.lat), Number(p.lng)]);
  }
  const lat = Number(field?.latitude);
  const lng = Number(field?.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const areaHa = Number(field?.area_ha) > 0 ? Number(field.area_ha) : 1.0;
  
  // Side in meters = sqrt(areaHa * 10,000 m2)
  const sideM = Math.sqrt(areaHa * 10000);
  const halfSideM = sideM / 2;
  const dLat = halfSideM / 111320;
  const cosLat = Math.cos((lat * Math.PI) / 180);
  const dLng = halfSideM / (111320 * (cosLat || 1));

  return [
    [lat - dLat, lng - dLng],
    [lat + dLat, lng - dLng],
    [lat + dLat, lng + dLng],
    [lat - dLat, lng + dLng],
  ];
}

/**
 * Computes polygon area in hectares using planar projection around reference point + Shoelace formula.
 */
export function computePolygonAreaHa(coords) {
  if (!coords || coords.length < 3) return 0;
  const refLat = Number(coords[0][0]);
  const refLng = Number(coords[0][1]);
  const cosLat = Math.cos((refLat * Math.PI) / 180);

  const points = coords.map(([lat, lng]) => [
    (Number(lng) - refLng) * 111320 * cosLat,
    (Number(lat) - refLat) * 111320,
  ]);

  let areaM2 = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    areaM2 += points[i][0] * points[j][1];
    areaM2 -= points[j][0] * points[i][1];
  }
  areaM2 = Math.abs(areaM2) / 2;
  return Number((areaM2 / 10000).toFixed(2));
}

export function GoogleFieldMapPicker({
  latitude,
  longitude,
  onChange,
  onLocationNameChange,
  boundary = null,
  onBoundaryChange = null,
  readOnly = false,
  fields = [],
  selectedFieldId = null,
  onSelectField = null,
  height = '380px',
  lang = 'bn',
}) {
  const isBn = lang === 'bn';
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const leafletRef = useRef(null);
  const fieldLayersGroupRef = useRef(null);
  const drawLayerGroupRef = useRef(null);
  const activeMarkerRef = useRef(null);

  const [isDrawingBoundary, setIsDrawingBoundary] = useState(false);
  const [drawnPoints, setDrawnPoints] = useState([]);
  const [computedAreaHa, setComputedAreaHa] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  // Active coordinates
  const activeFieldMatch = useMemo(() => {
    return (fields && selectedFieldId)
      ? fields.find(f => String(f.id) === String(selectedFieldId))
      : null;
  }, [fields, selectedFieldId]);

  const rawLat = latitude !== undefined && latitude !== '' && latitude !== null
    ? latitude
    : (activeFieldMatch?.latitude);
  const rawLng = longitude !== undefined && longitude !== '' && longitude !== null
    ? longitude
    : (activeFieldMatch?.longitude);

  const parsedLat = rawLat === '' || rawLat == null ? NaN : Number(rawLat);
  const parsedLng = rawLng === '' || rawLng == null ? NaN : Number(rawLng);
  const hasCoordinates = Number.isFinite(parsedLat) && Number.isFinite(parsedLng);

  const centerLat = hasCoordinates ? parsedLat : (fields?.[0]?.latitude ? Number(fields[0].latitude) : 24.62);
  const centerLng = hasCoordinates ? parsedLng : (fields?.[0]?.longitude ? Number(fields[0].longitude) : 88.55);

  // Initialize Leaflet Map (SSR Safe via dynamic import in useEffect)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let isCancelled = false;

    import('leaflet').then((module) => {
      if (isCancelled || !mapContainerRef.current) return;
      const L = module.default || module;
      leafletRef.current = L;

      // Clean existing instance
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Initialize Leaflet
      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLng],
        zoom: 16,
        zoomControl: true,
        attributionControl: false, // Custom styled attribution below
      });
      mapInstanceRef.current = map;

      // 1. ESRI World Imagery Satellite Tiles
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
      }).addTo(map);

      // 2. Reference Boundaries & Places Labels Overlay
      L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        opacity: 0.85,
      }).addTo(map);

      // Groups for field polygons and dynamic drawing
      const fieldGroup = L.layerGroup().addTo(map);
      const drawGroup = L.layerGroup().addTo(map);
      fieldLayersGroupRef.current = fieldGroup;
      drawLayerGroupRef.current = drawGroup;

      // Fly to active field on first open (zoom 16)
      if (hasCoordinates) {
        map.setView([centerLat, centerLng], 16);
      }

      // Invalidate size once rendered
      setTimeout(() => {
        if (!isCancelled && mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 150);
    });

    return () => {
      isCancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update field polygons when fields or active field change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = leafletRef.current;
    const group = fieldLayersGroupRef.current;
    if (!map || !L || !group) return;

    group.clearLayers();

    if (fields && fields.length > 0) {
      fields.forEach(f => {
        const polyCoords = getFieldPolygon(f);
        if (!polyCoords) return;

        const isSelected = selectedFieldId && String(f.id) === String(selectedFieldId);

        // Lime polygon with soft neon glow
        const polygon = L.polygon(polyCoords, {
          color: '#C8F169',
          weight: isSelected ? 3.5 : 2.0,
          opacity: isSelected ? 1.0 : 0.75,
          fillColor: '#C8F169',
          fillOpacity: isSelected ? 0.38 : 0.16,
          className: isSelected ? 'field-poly-active-glow' : 'field-poly-glow',
        }).addTo(group);

        // Click on polygon selects field
        polygon.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          if (onSelectField) onSelectField(f);
        });

        // Field Label Pin in Center
        const center = polygon.getBounds().getCenter();
        const pinHtml = `
          <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%);pointer-events:auto;cursor:pointer;">
            <div style="background:${isSelected ? '#C8F169' : 'rgba(10,20,16,0.88)'};color:${isSelected ? '#0c1a10' : '#EAF2EC'};padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700;white-space:nowrap;margin-bottom:2px;box-shadow:0 2px 10px rgba(0,0,0,0.6);border:1px solid ${isSelected ? '#ffffff' : 'rgba(200,241,105,0.45)'};">
              ${f.name || 'Field'}
            </div>
            <svg width="${isSelected ? 30 : 22}" height="${isSelected ? 30 : 22}" viewBox="0 0 24 24" fill="${isSelected ? '#C8F169' : '#38BDF8'}" stroke="#ffffff" stroke-width="1.5" style="filter:drop-shadow(0 2px 6px rgba(0,0,0,0.7));">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              <circle cx="12" cy="9" r="2.5" fill="#ffffff"/>
            </svg>
          </div>
        `;

        const pinIcon = L.divIcon({
          className: 'leaflet-custom-field-pin',
          html: pinHtml,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });

        const marker = L.marker(center, { icon: pinIcon }).addTo(group);
        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          if (onSelectField) onSelectField(f);
        });
      });
    } else if (hasCoordinates) {
      // Single field editing mode
      const polyCoords = boundary && boundary.length >= 3
        ? boundary.map(p => Array.isArray(p) ? [Number(p[0]), Number(p[1])] : [Number(p.lat), Number(p.lng)])
        : getFieldPolygon({ latitude: parsedLat, longitude: parsedLng, area_ha: 1.0 });

      if (polyCoords) {
        L.polygon(polyCoords, {
          color: '#C8F169',
          weight: 3,
          opacity: 1.0,
          fillColor: '#C8F169',
          fillOpacity: 0.35,
          className: 'field-poly-active-glow',
        }).addTo(group);
      }

      // Marker for single field
      const pinHtml = `
        <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%);pointer-events:none;">
          <div style="background:#C8F169;color:#0c1a10;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700;white-space:nowrap;margin-bottom:2px;box-shadow:0 2px 10px rgba(0,0,0,0.6);">
            ${parsedLat.toFixed(4)}°N, ${parsedLng.toFixed(4)}°E
          </div>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="#C8F169" stroke="#ffffff" stroke-width="1.5" style="filter:drop-shadow(0 2px 6px rgba(0,0,0,0.7));">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            <circle cx="12" cy="9" r="2.5" fill="#ffffff"/>
          </svg>
        </div>
      `;

      const pinIcon = L.divIcon({
        className: 'leaflet-single-pin',
        html: pinHtml,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      if (activeMarkerRef.current) {
        activeMarkerRef.current.remove();
      }
      activeMarkerRef.current = L.marker([parsedLat, parsedLng], {
        icon: pinIcon,
        draggable: !readOnly && !isDrawingBoundary,
      }).addTo(group);

      if (!readOnly && !isDrawingBoundary) {
        activeMarkerRef.current.on('dragend', (e) => {
          const pos = e.target.getLatLng();
          if (onChange) onChange(pos.lat.toFixed(4), pos.lng.toFixed(4));
        });
      }
    }
  }, [fields, selectedFieldId, hasCoordinates, parsedLat, parsedLng, boundary, readOnly, isDrawingBoundary, onSelectField, onChange]);

  // Handle flyTo when selectedFieldId or coordinates change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (activeFieldMatch?.latitude && activeFieldMatch?.longitude) {
      map.flyTo([Number(activeFieldMatch.latitude), Number(activeFieldMatch.longitude)], 16, {
        duration: 1.2,
      });
    }
  }, [selectedFieldId, activeFieldMatch]);

  // Click handler for map (pin drop OR boundary drawing)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = leafletRef.current;
    if (!map || !L || readOnly) return;

    const handleMapClick = (e) => {
      const { lat, lng } = e.latlng;
      if (isDrawingBoundary) {
        setDrawnPoints(prev => {
          const next = [...prev, [Number(lat.toFixed(5)), Number(lng.toFixed(5))]];
          const area = computePolygonAreaHa(next);
          setComputedAreaHa(area);
          return next;
        });
      } else {
        if (onChange) onChange(lat.toFixed(4), lng.toFixed(4));
      }
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [readOnly, isDrawingBoundary, onChange]);

  // Update dynamic drawing preview on map
  useEffect(() => {
    const L = leafletRef.current;
    const group = drawLayerGroupRef.current;
    if (!L || !group) return;

    group.clearLayers();
    if (!isDrawingBoundary || drawnPoints.length === 0) return;

    // Draw vertex handles
    drawnPoints.forEach(([lat, lng]) => {
      L.circleMarker([lat, lng], {
        radius: 6,
        color: '#ffffff',
        weight: 2,
        fillColor: '#C8F169',
        fillOpacity: 1,
      }).addTo(group);
    });

    // Draw lines connecting points
    if (drawnPoints.length >= 2) {
      L.polyline(drawnPoints, {
        color: '#C8F169',
        weight: 3,
        dashArray: '6, 6',
      }).addTo(group);
    }

    // Draw closed polygon if >= 3 points
    if (drawnPoints.length >= 3) {
      L.polygon(drawnPoints, {
        color: '#C8F169',
        weight: 2,
        fillColor: '#C8F169',
        fillOpacity: 0.35,
        className: 'field-poly-active-glow',
      }).addTo(group);
    }
  }, [isDrawingBoundary, drawnPoints]);

  // Apply Boundary & Area
  const handleSaveBoundary = () => {
    if (drawnPoints.length >= 3) {
      const area = computePolygonAreaHa(drawnPoints);
      if (onBoundaryChange) {
        onBoundaryChange(drawnPoints, area);
      }
      if (onChange && drawnPoints[0]) {
        onChange(drawnPoints[0][0].toFixed(4), drawnPoints[0][1].toFixed(4));
      }
      setIsDrawingBoundary(false);
      setStatusMessage(isBn ? `সীমানা সংরক্ষিত: ${((area / 0.13378)).toFixed(2)} বিঘা (${area} হেক্টর)` : `Boundary saved: ${((area / 0.13378)).toFixed(2)} bigha (${area} ha)`);
      setTimeout(() => setStatusMessage(''), 4000);
    }
  };

  const handleClearBoundary = () => {
    setDrawnPoints([]);
    setComputedAreaHa(0);
  };

  // Browser GPS Location
  const handleGetGPS = () => {
    setStatusMessage('');
    if (!navigator.geolocation) {
      setStatusMessage(isBn ? 'জিপিএস পাওয়া যায়নি' : 'GPS not available');
      setTimeout(() => setStatusMessage(''), 3000);
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (onChange) onChange(lat.toFixed(4), lng.toFixed(4));
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 16, { duration: 1.0 });
        }
      },
      () => {
        setIsLocating(false);
        setStatusMessage(isBn ? 'জিপিএস সংযোগ ব্যর্থ হয়েছে' : 'GPS detection failed');
        setTimeout(() => setStatusMessage(''), 3000);
      },
      { timeout: 7000, enableHighAccuracy: true }
    );
  };

  return (
    <div style={{ position: 'relative', width: '100%', borderRadius: 14, overflow: 'hidden', background: '#0a1410', border: '1px solid var(--line, rgba(255,255,255,0.12))' }}>
      <style>{`
        .field-poly-glow path {
          filter: drop-shadow(0 0 6px rgba(200, 241, 105, 0.5));
          cursor: pointer;
        }
        .field-poly-active-glow path {
          filter: drop-shadow(0 0 10px #C8F169) drop-shadow(0 0 4px #C8F169);
          cursor: pointer;
        }
      `}</style>

      {/* Top Toolbar (Presets, Boundary Drawer, GPS) */}
      {!readOnly && (
        <div style={{
          padding: '8px 12px',
          background: 'rgba(10, 20, 16, 0.92)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          zIndex: 10,
        }}>
          {/* Quick Presets */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3, #9fb3a5)' }}>
              {isBn ? 'দ্রুত স্থান:' : 'Presets:'}
            </span>
            {PRESETS.slice(0, 3).map(p => (
              <button
                key={p.name}
                type="button"
                onClick={() => {
                  if (onChange) onChange(p.lat.toFixed(4), p.lng.toFixed(4));
                  if (mapInstanceRef.current) {
                    mapInstanceRef.current.flyTo([p.lat, p.lng], 16, { duration: 1.0 });
                  }
                }}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#EAF2EC',
                  padding: '3px 8px',
                  borderRadius: 6,
                  fontSize: 11,
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                <MapPin size={14} strokeWidth={1.75} color="var(--lime, #c8f169)" style={{ verticalAlign: 'middle', marginRight: 4 }} />{p.name}
              </button>
            ))}
          </div>

          {/* Boundary Drawing & GPS Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={() => {
                setIsDrawingBoundary(prev => !prev);
                if (isDrawingBoundary) handleClearBoundary();
              }}
              style={{
                background: isDrawingBoundary ? '#C8F169' : 'rgba(200, 241, 105, 0.12)',
                color: isDrawingBoundary ? '#0c1a10' : '#C8F169',
                border: '1px solid rgba(200, 241, 105, 0.4)',
                padding: '4px 10px',
                borderRadius: 8,
                fontSize: 11.5,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <span>{isDrawingBoundary ? <X size={16} strokeWidth={1.75} /> : <Pencil size={16} strokeWidth={1.75} />}</span>
              <span>{isDrawingBoundary ? (isBn ? 'আঁকা বন্ধ করুন' : 'Cancel Drawing') : (isBn ? 'সীমানা আঁকুন (৪+ ক্লিক)' : 'Draw Boundary (4+ clicks)')}</span>
            </button>

            <button
              type="button"
              onClick={handleGetGPS}
              disabled={isLocating}
              style={{
                background: 'rgba(56, 189, 248, 0.12)',
                color: '#38BDF8',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                padding: '4px 10px',
                borderRadius: 8,
                fontSize: 11.5,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Target size={14} strokeWidth={1.75} style={{ verticalAlign: 'middle', marginRight: 4 }} />{isLocating ? (isBn ? 'খোঁজা হচ্ছে…' : 'Locating…') : (isBn ? 'জিপিএস' : 'GPS')}
            </button>
          </div>
        </div>
      )}

      {/* Main Map Container */}
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height,
          minHeight: '260px',
          background: '#0a1610',
          cursor: isDrawingBoundary ? 'crosshair' : 'default',
        }}
      />

      {/* Live Polygon Drawing Bar */}
      {isDrawingBoundary && (
        <div style={{
          position: 'absolute',
          bottom: 28,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(10, 22, 16, 0.94)',
          border: '1px solid #C8F169',
          borderRadius: 14,
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          zIndex: 1000,
          boxShadow: '0 8px 24px rgba(0,0,0,0.65)',
        }}>
          <span style={{ fontSize: 12, color: '#C8F169', fontWeight: 700 }}>
            {drawnPoints.length} {isBn ? 'পয়েন্ট' : 'points'}
            {drawnPoints.length >= 3 && (
              <>
                {' '}• {isBn ? 'আয়তন:' : 'Area:'} <b style={{ color: '#ffffff' }}>{((computedAreaHa / 0.13378)).toFixed(2)} {isBn ? 'বিঘা' : 'bigha'}</b> ({computedAreaHa} ha)
              </>
            )}
          </span>

          {drawnPoints.length >= 3 && (
            <button
              type="button"
              onClick={handleSaveBoundary}
              style={{
                background: '#C8F169',
                color: '#0c1a10',
                border: 'none',
                borderRadius: 8,
                padding: '4px 12px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ✓ {isBn ? 'সীমানা সংরক্ষণ করুন' : 'Save Boundary'}
            </button>
          )}

          <button
            type="button"
            onClick={handleClearBoundary}
            style={{
              background: 'rgba(255,255,255,0.1)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              padding: '4px 10px',
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            {isBn ? 'মুছুন' : 'Clear'}
          </button>
        </div>
      )}

      {/* Required Attribution Bar (LB1: "Esri, Maxar, Earthstar Geographics" visible) */}
      <div
        data-testid="map-esri-attribution"
        style={{
          position: 'absolute',
          bottom: 4,
          right: 8,
          fontSize: 10,
          color: 'rgba(255, 255, 255, 0.75)',
          background: 'rgba(0, 0, 0, 0.6)',
          padding: '2px 8px',
          borderRadius: 4,
          zIndex: 999,
          pointerEvents: 'none',
        }}
      >
        Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics
      </div>

      {/* Floating Status Toast */}
      {statusMessage && (
        <div style={{
          position: 'absolute',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(10, 22, 16, 0.94)',
          border: '1px solid rgba(200, 241, 105, 0.4)',
          color: '#C8F169',
          padding: '6px 14px',
          borderRadius: 99,
          fontSize: 12,
          fontWeight: 700,
          zIndex: 1000,
          boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
        }}>
          {statusMessage}
        </div>
      )}
    </div>
  );
}

export default GoogleFieldMapPicker;
