import React, { useMemo, useState } from 'react';
import { Satellite } from 'lucide-react';
import { getFieldPolygon } from './GoogleFieldMapPicker.jsx';

// Web Mercator Tile Calculation for Static Satellite Crop
function getThumbnailTiles(lat, lng, zoom, width = 360, height = 150) {
  const n = Math.pow(2, zoom);
  const xExact = ((lng + 180) / 360) * n;
  const clampedLat = Math.max(-85, Math.min(85, lat));
  const latRad = (clampedLat * Math.PI) / 180;
  const yExact = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;

  const originX = xExact * 256 - width / 2;
  const originY = yExact * 256 - height / 2;

  const minX = Math.floor(originX / 256);
  const maxX = Math.floor((originX + width) / 256);
  const minY = Math.floor(originY / 256);
  const maxY = Math.floor((originY + height) / 256);

  const tiles = [];
  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      if (y >= 0 && y < n) {
        const wrappedX = ((x % n) + n) % n;
        tiles.push({
          zoom,
          x: wrappedX,
          y,
          left: Math.round(x * 256 - originX),
          top: Math.round(y * 256 - originY),
        });
      }
    }
  }

  const project = (pLat, pLng) => {
    const px = ((pLng + 180) / 360) * n * 256 - originX;
    const lClamped = Math.max(-85, Math.min(85, pLat));
    const lRad = (lClamped * Math.PI) / 180;
    const py = ((1 - Math.log(Math.tan(lRad) + 1 / Math.cos(lRad)) / Math.PI) / 2) * n * 256 - originY;
    return [Math.round(px), Math.round(py)];
  };

  return { tiles, project };
}

export function GoogleFieldMapThumbnail({
  latitude,
  longitude,
  name = '',
  boundary = null,
  area_ha = 1.0,
  height = '140px',
  onClick = null,
}) {
  const [containerWidth, setContainerWidth] = useState(340);

  const lat = latitude === null || latitude === undefined || latitude === '' ? NaN : Number(latitude);
  const lng = longitude === null || longitude === undefined || longitude === '' ? NaN : Number(longitude);
  const hasCoordinates = Number.isFinite(lat) && Number.isFinite(lng);

  const numHeight = parseInt(height, 10) || 140;

  const tileData = useMemo(() => {
    if (!hasCoordinates) return null;
    return getThumbnailTiles(lat, lng, 16, containerWidth, numHeight);
  }, [lat, lng, hasCoordinates, containerWidth, numHeight]);

  const polyPoints = useMemo(() => {
    if (!tileData || !hasCoordinates) return '';
    const rawPoly = getFieldPolygon({ latitude: lat, longitude: lng, boundary, area_ha });
    if (!rawPoly || rawPoly.length < 3) return '';
    return rawPoly.map(([pLat, pLng]) => {
      const [px, py] = tileData.project(pLat, pLng);
      return `${px},${py}`;
    }).join(' ');
  }, [tileData, hasCoordinates, lat, lng, boundary, area_ha]);

  if (!hasCoordinates) {
    return (
      <div
        className="field-card-map-thumbnail map-location-unavailable"
        style={{
          height,
          display: 'grid',
          placeItems: 'center',
          background: '#0d1812',
          color: 'var(--text-3, #7a9485)',
          fontSize: 12,
        }}
      >
        Coordinates not registered
      </div>
    );
  }

  return (
    <div
      ref={(el) => {
        if (el && el.clientWidth && el.clientWidth !== containerWidth) {
          setContainerWidth(el.clientWidth);
        }
      }}
      className="field-card-map-thumbnail"
      onClick={onClick || undefined}
      style={{
        height,
        position: 'relative',
        width: '100%',
        overflow: 'hidden',
        borderTopLeftRadius: '14px',
        borderTopRightRadius: '14px',
        background: '#0a1410',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
      }}
      title={onClick ? `Click to view ${name || 'field'}` : (name || 'Field')}
    >
      {/* 1. ESRI World Imagery Base Tiles */}
      {tileData && tileData.tiles.map(t => (
        <img
          key={`sat-${t.zoom}-${t.x}-${t.y}`}
          src={`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${t.zoom}/${t.y}/${t.x}`}
          alt=""
          loading="lazy"
          style={{
            position: 'absolute',
            left: `${t.left}px`,
            top: `${t.top}px`,
            width: '256px',
            height: '256px',
            display: 'block',
            pointerEvents: 'none',
          }}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      ))}

      {/* 2. ESRI Reference Labels Overlay */}
      {tileData && tileData.tiles.map(t => (
        <img
          key={`lbl-${t.zoom}-${t.x}-${t.y}`}
          src={`https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/${t.zoom}/${t.y}/${t.x}`}
          alt=""
          loading="lazy"
          style={{
            position: 'absolute',
            left: `${t.left}px`,
            top: `${t.top}px`,
            width: '256px',
            height: '256px',
            display: 'block',
            opacity: 0.85,
            pointerEvents: 'none',
          }}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      ))}

      {/* 3. Lime Field Boundary Polygon with Neon Glow */}
      {polyPoints && (
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          <polygon
            points={polyPoints}
            fill="rgba(200, 241, 105, 0.28)"
            stroke="#C8F169"
            strokeWidth="2.5"
            style={{ filter: 'drop-shadow(0 0 6px #C8F169)' }}
          />
        </svg>
      )}

      {/* 4. Center Glowing Pin */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pointerEvents: 'none',
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="#C8F169"
          stroke="#ffffff"
          strokeWidth="1.5"
          style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.85))' }}
        >
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
          <circle cx="12" cy="9" r="2.5" fill="#ffffff" />
        </svg>
      </div>

      {/* 5. Top-Left Satellite Badge */}
      <div
        style={{
          position: 'absolute',
          top: 8,
          left: 8,
          background: 'rgba(10, 20, 16, 0.82)',
          color: '#C8F169',
          padding: '2px 7px',
          borderRadius: 6,
          fontSize: 10,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
          border: '1px solid rgba(200, 241, 105, 0.3)',
        }}
      >
        <span><Satellite size={14} strokeWidth={1.75} style={{ verticalAlign: 'middle', marginRight: 4 }} />ESRI Satellite</span>
      </div>

      {/* 6. Top-Right Name Badge */}
      {name && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            background: 'rgba(10, 20, 16, 0.88)',
            color: '#EAF2EC',
            padding: '2px 8px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            maxWidth: '60%',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.15)',
          }}
        >
          {name}
        </div>
      )}
    </div>
  );
}

export default GoogleFieldMapThumbnail;
