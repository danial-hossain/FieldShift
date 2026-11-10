import React, { useEffect, useRef, useState } from 'react';

const VITE_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Known agricultural preset coordinates in Bangladesh research zones
const PRESETS = [
  { name: 'Dhaka', lat: 23.8103, lng: 90.4125, desc: 'Central Agricultural Basin' },
  { name: 'Barisal', lat: 22.7010, lng: 90.3535, desc: 'Coastal Delta Region' },
  { name: 'Rajshahi', lat: 24.3636, lng: 88.6241, desc: 'Northwest Arid / Barind Tract' }
];

// Web Mercator Slippy Tile Projection (EPSG:3857)
function calculateVisibleTiles(centerLat, centerLng, zoom, width, height) {
  const n = Math.pow(2, zoom);
  const xExact = ((centerLng + 180) / 360) * n;
  const clampedLat = Math.max(-85, Math.min(85, centerLat));
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
          top: Math.round(y * 256 - originY)
        });
      }
    }
  }

  const project = (lat, lng) => {
    const px = ((lng + 180) / 360) * n * 256 - originX;
    const lClamped = Math.max(-85, Math.min(85, lat));
    const lRad = (lClamped * Math.PI) / 180;
    const py = ((1 - Math.log(Math.tan(lRad) + 1 / Math.cos(lRad)) / Math.PI) / 2) * n * 256 - originY;
    return { left: Math.round(px), top: Math.round(py) };
  };

  const unproject = (screenX, screenY) => {
    const worldX = originX + screenX;
    const worldY = originY + screenY;
    const uLng = (worldX / 256 / n) * 360 - 180;
    const nRad = Math.PI - (2 * Math.PI * worldY) / (256 * n);
    const uLat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(nRad) - Math.exp(-nRad)));
    return { lat: Number(uLat.toFixed(4)), lng: Number(uLng.toFixed(4)) };
  };

  return { tiles, project, unproject };
}

export function GoogleFieldMapPicker({
  latitude,
  longitude,
  onChange,
  onLocationNameChange,
  readOnly = false,
  fields = [],
  selectedFieldId = null,
  onSelectField = null,
  height = '260px',
  lang = 'bn'
}) {
  const mapContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerInstanceRef = useRef(null);
  const extraMarkersRef = useRef([]);

  const [mapStatus, setMapStatus] = useState('loading'); // 'loading' | 'ready' | 'fallback_interactive'
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedAddress, setSelectedAddress] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [mapType, setMapType] = useState('hybrid'); // 'hybrid' | 'roadmap' | 'satellite'
  const [tileSource, setTileSource] = useState('esri'); // 'esri' | 'osm'
  const [zoomLevel, setZoomLevel] = useState(fields && fields.length > 1 ? 8 : 13);
  const [containerDimensions, setContainerDimensions] = useState({ width: 700, height: 380 });
  const fallbackContainerRef = useRef(null);

  // Measure fallback container dimensions for exact Web Mercator projection
  useEffect(() => {
    if (!fallbackContainerRef.current) return;
    const updateSize = () => {
      const rect = fallbackContainerRef.current?.getBoundingClientRect();
      if (rect && rect.width > 0 && rect.height > 0) {
        setContainerDimensions({ width: Math.round(rect.width), height: Math.round(rect.height) });
      }
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(fallbackContainerRef.current);
    return () => ro.disconnect();
  }, [height]);

  // Resolve active field from fields if latitude/longitude not explicitly passed
  const activeFieldMatch = (fields && selectedFieldId)
    ? fields.find(f => String(f.id) === String(selectedFieldId))
    : null;

  const rawLat = latitude !== undefined && latitude !== '' && latitude !== null
    ? latitude
    : (activeFieldMatch?.latitude);
  const rawLng = longitude !== undefined && longitude !== '' && longitude !== null
    ? longitude
    : (activeFieldMatch?.longitude);

  const parsedLat = rawLat === '' || rawLat == null ? NaN : Number(rawLat);
  const parsedLng = rawLng === '' || rawLng == null ? NaN : Number(rawLng);
  const hasCoordinates = Number.isFinite(parsedLat) && Number.isFinite(parsedLng);
  const currentLat = hasCoordinates ? parsedLat : null;
  const currentLng = hasCoordinates ? parsedLng : null;

  const centerLat = currentLat || (fields && fields[0]?.latitude ? Number(fields[0].latitude) : 24.62);
  const centerLng = currentLng || (fields && fields[0]?.longitude ? Number(fields[0].longitude) : 88.55);

  // Reverse Geocode helper
  const reverseGeocode = (lat, lng) => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    if (!window.google?.maps?.Geocoder) {
      const fallback = `${Number(lat).toFixed(4)}° N, ${Number(lng).toFixed(4)}° E`;
      setSelectedAddress(fallback);
      if (onLocationNameChange) onLocationNameChange(fallback);
      return;
    }
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const addr = results[0].formatted_address;
        setSelectedAddress(addr);
        if (onLocationNameChange) onLocationNameChange(addr);
      } else {
        const fallback = `${Number(lat).toFixed(4)}° N, ${Number(lng).toFixed(4)}° E`;
        setSelectedAddress(fallback);
        if (onLocationNameChange) onLocationNameChange(fallback);
      }
    });
  };

  // Initialize or re-center Google Map
  const initGoogleMap = async () => {
    if (!hasCoordinates) {
      setMapStatus('fallback_interactive');
      return;
    }
    if (!mapContainerRef.current || !window.google?.maps) {
      setMapStatus('fallback_interactive');
      return;
    }

    try {
      const center = { lat: currentLat, lng: currentLng };

      let MapConstructor = window.google.maps.Map;
      let MarkerConstructor = window.google.maps.Marker;

      if (!MapConstructor && window.google.maps.importLibrary) {
        try {
          const mapsLib = await window.google.maps.importLibrary('maps');
          MapConstructor = mapsLib.Map;
        } catch {}
      }
      if (!MarkerConstructor && window.google.maps.importLibrary) {
        try {
          const markerLib = await window.google.maps.importLibrary('marker');
          MarkerConstructor = markerLib.Marker || markerLib.AdvancedMarkerElement;
        } catch {}
      }

      if (!MapConstructor) {
        setMapStatus('fallback_interactive');
        return;
      }

      if (!mapInstanceRef.current) {
        const map = new MapConstructor(mapContainerRef.current, {
          center,
          zoom: 13,
          mapTypeId: mapType || 'hybrid',
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          gestureHandling: readOnly ? 'none' : 'auto'
        });

        const marker = MarkerConstructor
          ? new MarkerConstructor({
              position: center,
              map,
              draggable: !readOnly,
              title: 'Agricultural Field Location'
            })
          : null;

        if (!readOnly && marker) {
          // Click on map to place/move marker
          map.addListener('click', e => {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            marker.setPosition({ lat, lng });
            onChange(lat.toFixed(4), lng.toFixed(4));
            reverseGeocode(lat, lng);
          });

          // Drag marker to adjust location
          marker.addListener('dragend', e => {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            onChange(lat.toFixed(4), lng.toFixed(4));
            reverseGeocode(lat, lng);
          });

          // Connect Places Autocomplete if available
          if (searchInputRef.current && window.google.maps.places?.Autocomplete) {
            const autocomplete = new window.google.maps.places.Autocomplete(searchInputRef.current, {
              fields: ['geometry', 'formatted_address', 'name']
            });
            autocomplete.addListener('place_changed', () => {
              const place = autocomplete.getPlace();
              if (place.geometry && place.geometry.location) {
                const loc = place.geometry.location;
                map.panTo(loc);
                map.setZoom(14);
                marker.setPosition(loc);
                const lat = loc.lat();
                const lng = loc.lng();
                onChange(lat.toFixed(4), lng.toFixed(4));
                const addr = place.formatted_address || place.name || `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`;
                setSelectedAddress(addr);
                if (onLocationNameChange) onLocationNameChange(addr);
              }
            });
          }
        }

        mapInstanceRef.current = map;
        markerInstanceRef.current = marker;

        // Trigger resize event after short delay to fix modal rendering
        setTimeout(() => {
          if (mapInstanceRef.current && window.google?.maps?.event) {
            window.google.maps.event.trigger(mapInstanceRef.current, 'resize');
            mapInstanceRef.current.setCenter(center);
          }
        }, 150);
      } else {
        // Map already exists, update center & marker
        mapInstanceRef.current.panTo(center);
        if (markerInstanceRef.current) {
          markerInstanceRef.current.setPosition(center);
        }
      }

      // Render extra markers if fields array provided
      if (fields && fields.length > 0 && MarkerConstructor) {
        extraMarkersRef.current.forEach(m => m && m.setMap && m.setMap(null));
        extraMarkersRef.current = [];
        fields.forEach(f => {
          const fLat = Number(f.latitude);
          const fLng = Number(f.longitude);
          if (!Number.isFinite(fLat) || !Number.isFinite(fLng)) return;
          const fm = new MarkerConstructor({
            position: { lat: fLat, lng: fLng },
            map: mapInstanceRef.current,
            title: f.name || 'Field'
          });
          fm.addListener('click', () => {
            if (onSelectField) onSelectField(f);
          });
          extraMarkersRef.current.push(fm);
        });
      }

      setMapStatus('ready');
      reverseGeocode(currentLat, currentLng);
    } catch (err) {
      console.warn('Google Maps initialization fallback:', err);
      setMapStatus('fallback_interactive');
    }
  };

  // Switch Map Type
  const handleMapTypeToggle = type => {
    setMapType(type);
    if (mapInstanceRef.current && window.google?.maps) {
      mapInstanceRef.current.setMapTypeId(type);
    }
  };

  // Load Google Maps Script
  useEffect(() => {
    window.gm_authFailure = () => {
      console.info('Google Maps: Dev/Demo mode active without billing key.');
      setMapStatus('ready');
    };

    if (window.google?.maps) {
      initGoogleMap();
      return;
    }

    const scriptId = 'google-maps-api-script';
    let script = document.getElementById(scriptId);

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.type = 'text/javascript';
      const keyParam = VITE_KEY ? `&key=${encodeURIComponent(VITE_KEY)}` : '';
      script.src = `https://maps.googleapis.com/maps/api/js?libraries=places,geometry${keyParam}`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        initGoogleMap();
      };

      script.onerror = () => {
        console.warn('Could not load Google Maps script from CDN. Activating interactive terrain map.');
        setMapStatus('fallback_interactive');
      };

      document.head.appendChild(script);
    } else {
      const interval = setInterval(() => {
        if (window.google?.maps) {
          clearInterval(interval);
          initGoogleMap();
        }
      }, 100);
      const timer = setTimeout(() => {
        clearInterval(interval);
        if (!window.google?.maps) {
          setMapStatus('fallback_interactive');
        }
      }, 3000);
      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    }
  }, []);

  // Update marker if coordinates prop changes externally
  useEffect(() => {
    if (hasCoordinates && mapInstanceRef.current && markerInstanceRef.current && window.google?.maps) {
      const center = { lat: currentLat, lng: currentLng };
      markerInstanceRef.current.setPosition(center);
      mapInstanceRef.current.panTo(center);
      reverseGeocode(currentLat, currentLng);
    }
  }, [latitude, longitude, hasCoordinates]);

  // Auto-dismiss any Google Maps development dialog so the map is never blocked
  useEffect(() => {
    const dismissTimer = setInterval(() => {
      const okBtn = document.querySelector('.dismissButton') || document.querySelector('.gm-err-container button');
      if (okBtn) {
        try { okBtn.click(); } catch {}
      }
    }, 150);
    return () => clearInterval(dismissTimer);
  }, []);

  // Apply Preset Location
  const handleApplyPreset = preset => {
    onChange(preset.lat.toFixed(4), preset.lng.toFixed(4));
    if (mapInstanceRef.current && markerInstanceRef.current) {
      const pos = { lat: preset.lat, lng: preset.lng };
      mapInstanceRef.current.panTo(pos);
      mapInstanceRef.current.setZoom(13);
      markerInstanceRef.current.setPosition(pos);
      reverseGeocode(preset.lat, preset.lng);
    } else {
      setSelectedAddress(`${preset.name} Agricultural Research Zone (${preset.lat}° N, ${preset.lng}° E)`);
      if (onLocationNameChange) onLocationNameChange(`${preset.name} Agricultural Zone`);
    }
  };

  // Get User's Browser GPS Location (UP5: 8s timeout with subtle spinner, small toast)
  const handleGetGPS = () => {
    setStatusMessage('');
    if (!navigator.geolocation) {
      setStatusMessage(lang === 'bn' ? 'জিপিএস পাওয়া যায়নি — মানচিত্রে ট্যাপ করে জমি চিহ্নিত করুন' : 'GPS not available — tap the map to place your field');
      setTimeout(() => setStatusMessage(''), 4000);
      return;
    }
    setIsLocating(true);
    let resolved = false;
    const timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        setIsLocating(false);
        setStatusMessage(lang === 'bn' ? 'জিপিএস পাওয়া যায়নি — মানচিত্রে ট্যাপ করে জমি চিহ্নিত করুন' : 'GPS not available — tap the map to place your field');
        setTimeout(() => setStatusMessage(''), 4000);
      }
    }, 8000);

    navigator.geolocation.getCurrentPosition(
      pos => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeoutId);
        setIsLocating(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (onChange) onChange(lat.toFixed(4), lng.toFixed(4));
        if (mapInstanceRef.current && markerInstanceRef.current) {
          const loc = { lat, lng };
          mapInstanceRef.current.panTo(loc);
          mapInstanceRef.current.setZoom(15);
          markerInstanceRef.current.setPosition(loc);
          reverseGeocode(lat, lng);
        } else {
          setSelectedAddress(`${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E (GPS Measured)`);
        }
      },
      () => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeoutId);
        setIsLocating(false);
        setStatusMessage(lang === 'bn' ? 'জিপিএস পাওয়া যায়নি — মানচিত্রে ট্যাপ করে জমি চিহ্নিত করুন' : 'GPS not available — tap the map to place your field');
        setTimeout(() => setStatusMessage(''), 4000);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Search Address Fallback if Autocomplete didn't fire
  const handleManualSearch = e => {
    if (e) e.preventDefault();
    setStatusMessage('');
    const query = searchInputRef.current?.value?.trim();
    if (!query) return;

    if (window.google?.maps?.Geocoder) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: query }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const loc = results[0].geometry.location;
          const lat = loc.lat();
          const lng = loc.lng();
          if (mapInstanceRef.current && markerInstanceRef.current) {
            mapInstanceRef.current.panTo(loc);
            mapInstanceRef.current.setZoom(14);
            markerInstanceRef.current.setPosition(loc);
          }
          onChange(lat.toFixed(4), lng.toFixed(4));
          setSelectedAddress(results[0].formatted_address);
          if (onLocationNameChange) onLocationNameChange(results[0].formatted_address);
        } else {
          // Fallback search match with presets
          const match = PRESETS.find(p => typeof p?.name === 'string' && p.name.toLowerCase().includes((query || '').toLowerCase()));
          if (match) {
            handleApplyPreset(match);
          } else {
            setStatusMessage(`Location "${query}" not found.`);
          }
        }
      });
    } else {
      const match = PRESETS.find(p => typeof p?.name === 'string' && p.name.toLowerCase().includes((query || '').toLowerCase()));
      if (match) {
        handleApplyPreset(match);
      } else {
        setStatusMessage(`Preset for "${query}" not found. Try Dhaka, Barisal, or Rajshahi.`);
      }
    }
  };

  // Interactive Fallback Map click handler (when Google CDN is offline/blocked)
  const handleFallbackCanvasClick = e => {
    if (readOnly) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pctX = x / rect.width;
    const pctY = y / rect.height;

    // Map pixel relative offset to geographic delta around Bangladesh / target coordinate
    const latSpan = 2.0; // +/- 1 deg
    const lngSpan = 2.0;
    const baseLat = Number.isFinite(currentLat) ? currentLat : 23.8103;
    const baseLng = Number.isFinite(currentLng) ? currentLng : 90.4125;
    const newLat = baseLat + (0.5 - pctY) * latSpan;
    const newLng = baseLng + (pctX - 0.5) * lngSpan;

    onChange(newLat.toFixed(4), newLng.toFixed(4));
    setSelectedAddress(`${newLat.toFixed(4)}° N, ${newLng.toFixed(4)}° E`);
  };

  return (
    <div className="google-map-picker-wrapper">
      {/* Search Bar & Controls */}
      {!readOnly && (
        <div className="map-picker-search-bar">
          <div className="search-input-wrap">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={searchInputRef}
              className="map-search-input"
              placeholder="Search farm location, district, or place name..."
              onKeyDown={e => e.key === 'Enter' && handleManualSearch(e)}
            />
          </div>
          <button type="button" className="btn-map-search" onClick={handleManualSearch}>
            Search
          </button>
        </div>
      )}

      {/* Preset Chips & GPS */}
      {!readOnly && (
        <div className="map-presets-row">
          <span className="preset-label">Quick Locations:</span>
          {PRESETS.map(p => (
            <button
              type="button"
              key={p.name}
              className="preset-pill-btn"
              onClick={() => handleApplyPreset(p)}
              title={`${p.desc} (${p.lat}°, ${p.lng}°)`}
            >
              📍 {p.name}
            </button>
          ))}
          <button
            type="button"
            className="preset-pill-btn gps-btn"
            onClick={handleGetGPS}
            disabled={isLocating}
            title={lang === 'bn' ? 'ব্রাউজার থেকে জিপিএস স্থানাঙ্ক নির্ধারণ করুন' : 'Detect GPS coordinates from browser'}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            {isLocating ? (
              <>
                <span style={{ display: 'inline-block', width: 11, height: 11, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <span>{lang === 'bn' ? 'জিপিএস খোঁজা হচ্ছে…' : 'Locating…'}</span>
              </>
            ) : (
              <span>🎯 {lang === 'bn' ? 'বর্তমান জিপিএস' : 'Current GPS'}</span>
            )}
          </button>
        </div>
      )}

      {/* Google Maps Canvas Container */}
      <div className="map-canvas-container" style={{ position: 'relative' }}>
        {/* Real Google Map Element */}
        <div
          ref={mapContainerRef}
          className="google-map-element"
          style={{
            width: '100%',
            height: height || '260px',
            display: mapStatus === 'fallback_interactive' ? 'none' : 'block'
          }}
        />

        {/* Fallback Real Map Slippy Tile Layer (ESRI World Imagery / OSM) */}
        {mapStatus === 'fallback_interactive' && (
          <div
            ref={fallbackContainerRef}
            className="fallback-interactive-map"
            onClick={e => {
              if (readOnly) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const clickY = e.clientY - rect.top;
              const { unproject } = calculateVisibleTiles(centerLat, centerLng, zoomLevel, containerDimensions.width, containerDimensions.height);
              const { lat: newLat, lng: newLng } = unproject(clickX, clickY);
              if (onChange) onChange(newLat.toFixed(4), newLng.toFixed(4));
              setSelectedAddress(`${newLat.toFixed(4)}° N, ${newLng.toFixed(4)}° E`);
              if (onLocationNameChange) onLocationNameChange(`${newLat.toFixed(4)}° N, ${newLng.toFixed(4)}° E`);
            }}
            style={{
              width: '100%',
              height: height || '260px',
              position: 'relative',
              backgroundColor: '#0c150f',
              cursor: readOnly ? 'default' : 'crosshair',
              overflow: 'hidden',
              borderRadius: 12
            }}
          >
            {/* Real Map Tiles */}
            {(() => {
              const { tiles, project } = calculateVisibleTiles(centerLat, centerLng, zoomLevel, containerDimensions.width, containerDimensions.height);
              return (
                <>
                  <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                    {tiles.map(t => (
                      <img
                        key={`${t.zoom}-${t.x}-${t.y}`}
                        src={
                          tileSource === 'esri'
                            ? `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${t.zoom}/${t.y}/${t.x}`
                            : `https://tile.openstreetmap.org/${t.zoom}/${t.x}/${t.y}.png`
                        }
                        alt=""
                        loading="lazy"
                        style={{
                          position: 'absolute',
                          left: `${t.left}px`,
                          top: `${t.top}px`,
                          width: '256px',
                          height: '256px',
                          userSelect: 'none',
                          display: 'block'
                        }}
                        onError={ev => { ev.currentTarget.style.display = 'none'; }}
                      />
                    ))}
                  </div>

                  {/* Multi-Field Markers or Single Field Pin */}
                  {fields && fields.length > 0 ? (
                    fields.map(f => {
                      const fLat = Number(f.latitude);
                      const fLng = Number(f.longitude);
                      if (!Number.isFinite(fLat) || !Number.isFinite(fLng)) return null;
                      const pos = project(fLat, fLng);
                      if (pos.left < -60 || pos.left > containerDimensions.width + 60 || pos.top < -60 || pos.top > containerDimensions.height + 60) return null;
                      const isSelected = selectedFieldId && String(f.id) === String(selectedFieldId);
                      return (
                        <div
                          key={f.id}
                          onClick={ev => {
                            ev.stopPropagation();
                            if (onSelectField) onSelectField(f);
                          }}
                          style={{
                            position: 'absolute',
                            left: `${pos.left}px`,
                            top: `${pos.top}px`,
                            transform: 'translate(-50%, -100%)',
                            cursor: 'pointer',
                            zIndex: isSelected ? 25 : 15,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            transition: 'transform 0.15s ease'
                          }}
                          title={`${f.name} (${fLat.toFixed(4)}°N, ${fLng.toFixed(4)}°E)`}
                        >
                          <div
                            style={{
                              background: isSelected ? 'var(--primary, #10b981)' : 'rgba(10,16,12,0.85)',
                              color: '#ffffff',
                              padding: '2px 8px',
                              borderRadius: 10,
                              fontSize: 11,
                              fontWeight: 700,
                              whiteSpace: 'nowrap',
                              marginBottom: 2,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
                              border: isSelected ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.3)'
                            }}
                          >
                            {f.name}
                          </div>
                          <svg width={isSelected ? "32" : "24"} height={isSelected ? "32" : "24"} viewBox="0 0 24 24" fill={isSelected ? "#10b981" : "#38bdf8"} stroke="#ffffff" strokeWidth="1.5">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                            <circle cx="12" cy="9" r="2.5" fill="#ffffff" />
                          </svg>
                        </div>
                      );
                    })
                  ) : hasCoordinates ? (
                    (() => {
                      const pos = project(currentLat, currentLng);
                      return (
                        <div
                          style={{
                            position: 'absolute',
                            left: `${pos.left}px`,
                            top: `${pos.top}px`,
                            transform: 'translate(-50%, -100%)',
                            pointerEvents: 'none',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            zIndex: 20
                          }}
                        >
                          <div
                            style={{
                              background: '#ef4444',
                              color: '#fff',
                              padding: '3px 8px',
                              borderRadius: 12,
                              fontSize: 11,
                              fontWeight: 700,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                              whiteSpace: 'nowrap',
                              marginBottom: 2
                            }}
                          >
                            {`${Number(currentLat).toFixed(4)}° N, ${Number(currentLng).toFixed(4)}° E`}
                          </div>
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                            <circle cx="12" cy="9" r="2.5" fill="#ffffff" />
                          </svg>
                        </div>
                      );
                    })()
                  ) : null}
                </>
              );
            })()}

            {/* Map terrain badge & Layer label */}
            <div
              style={{
                position: 'absolute',
                top: 10,
                left: 10,
                background: 'rgba(10, 16, 12, 0.85)',
                color: '#85e89d',
                padding: '4px 10px',
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                zIndex: 10,
                border: '1px solid rgba(255,255,255,0.12)'
              }}
            >
              <span>{tileSource === 'esri' ? '🛰️ ESRI World Imagery' : '🗺️ OpenStreetMap'}</span>
              <span style={{ color: '#bbb', fontSize: 10 }}>
                {fields && fields.length > 0 ? `${fields.length} Fields` : (hasCoordinates ? `${Number(currentLat).toFixed(2)}°N, ${Number(currentLng).toFixed(2)}°E` : 'Click to pin')}
              </span>
            </div>

            {/* Zoom & Layer Toggle Controls */}
            <div
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                display: 'flex',
                gap: 6,
                zIndex: 10
              }}
              onClick={e => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setTileSource(prev => prev === 'esri' ? 'osm' : 'esri')}
                style={{
                  padding: '4px 8px',
                  borderRadius: 6,
                  background: 'rgba(10, 16, 12, 0.85)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                title={tileSource === 'esri' ? 'Switch to OpenStreetMap' : 'Switch to ESRI Satellite'}
              >
                {tileSource === 'esri' ? '🗺️ Map' : '🛰️ Satellite'}
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(z => Math.min(17, z + 1))}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 6,
                  background: 'rgba(10, 16, 12, 0.85)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                title="Zoom In"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(z => Math.max(6, z - 1))}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 6,
                  background: 'rgba(10, 16, 12, 0.85)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                title="Zoom Out"
              >
                −
              </button>
            </div>

            {/* Attribution */}
            <div style={{ position: 'absolute', bottom: 4, right: 8, fontSize: 10, color: 'rgba(255,255,255,0.65)', zIndex: 10, pointerEvents: 'none' }}>
              © Esri · OpenStreetMap
            </div>

            {/* Small non-blocking GPS Toast at the bottom (UP5: auto-dismisses after 4s) */}
            {statusMessage && (
              <div style={{
                position: 'absolute',
                bottom: 16,
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: 12,
                fontWeight: 600,
                color: '#ffffff',
                padding: '6px 14px',
                background: 'rgba(15, 23, 18, 0.94)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: 9999,
                boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                zIndex: 100,
                whiteSpace: 'nowrap',
                pointerEvents: 'none'
              }}>
                📍 {statusMessage}
              </div>
            )}
          </div>
        )}

        {/* Map Type Toggle Overlays */}
        {mapStatus !== 'fallback_interactive' && (
          <div className="map-layer-controls">
            <button
              type="button"
              className={`map-layer-btn ${mapType === 'hybrid' ? 'active' : ''}`}
              onClick={() => handleMapTypeToggle('hybrid')}
              title="Satellite Imagery with Road Network"
            >
              Satellite
            </button>
            <button
              type="button"
              className={`map-layer-btn ${mapType === 'roadmap' ? 'active' : ''}`}
              onClick={() => handleMapTypeToggle('roadmap')}
              title="Standard Vector Roadmap"
            >
              Map
            </button>
          </div>
        )}

        {/* Interactive Instruction Hint */}
        {!readOnly && (
          <div className="map-hint-pill">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            Click anywhere on the map or drag the red pin to set field location
          </div>
        )}
      </div>

      {/* Selected Location Details Strip */}
      <div className="selected-location-strip">
        <div className="selected-location-details">
          <div className="loc-label-row">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5">
              <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <strong>Selected Field Coordinates:</strong>
            <span className="coords-readout">
              {hasCoordinates ? `${Number(currentLat).toFixed(4)}° N, ${Number(currentLng).toFixed(4)}° E` : 'Not set'}
            </span>
          </div>
          {selectedAddress && (
            <div className="loc-address-text">
              {selectedAddress}
            </div>
          )}
        </div>

        {!readOnly && (
          hasCoordinates ? (
            <div className="location-confirmed-tag">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>{lang === 'bn' ? '✓ পিন চিহ্নিত' : '✓ Pin Synchronized'}</span>
            </div>
          ) : (
            <div className="location-pending-tag" style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}>
              <span>{lang === 'bn' ? '⚠ মানচিত্রে জমি চিহ্নিত করুন' : '⚠ Please pin field on map'}</span>
            </div>
          )
        )}
      </div>
    </div>
  );
}
