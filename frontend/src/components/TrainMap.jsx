import React, { useEffect, useMemo, useState, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Compass, Navigation, Maximize2 } from 'lucide-react';

// Fix standard Leaflet default icon path issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/**
 * Custom Map Controller for pan and bounds fitting
 */
function MapController({ bounds, currentPosition, followTrain }) {
  const map = useMap();

  useEffect(() => {
    if (bounds && bounds.length > 0 && !followTrain) {
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 9 });
    }
  }, [bounds, map, followTrain]);

  useEffect(() => {
    if (followTrain && currentPosition?.lat && currentPosition?.lng) {
      map.flyTo([currentPosition.lat, currentPosition.lng], 9, {
        duration: 1.0,
      });
    }
  }, [currentPosition, followTrain, map]);

  return null;
}

/**
 * Creates custom square station node markers (0px border-radius)
 */
function createSquareStationIcon(status, code) {
  let innerHtml = '';
  if (status === 'reached') {
    // Reached: solid white square
    innerHtml = '<div style="width: 7px; height: 7px; background-color: #FFFFFF; border: 1px solid #FFFFFF;"></div>';
  } else if (status === 'delayed') {
    // Delayed: solid Muted Red square
    innerHtml = '<div style="width: 7px; height: 7px; background-color: #B22222; border: 1px solid #B22222;"></div>';
  } else {
    // Upcoming: hollow white/50 square
    innerHtml = '<div style="width: 7px; height: 7px; background-color: #000000; border: 1px solid rgba(255,255,255,0.6);"></div>';
  }

  return L.divIcon({
    className: 'custom-square-station-marker',
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -50%);">
        ${innerHtml}
        <div style="
          margin-top: 2px;
          padding: 1px 3px;
          background: #111111;
          border: 1px solid rgba(255,255,255,0.15);
          font-family: 'IBM Plex Sans', sans-serif;
          font-size: 8px;
          font-weight: 600;
          color: #FFFFFF;
          letter-spacing: 0.5px;
          white-space: nowrap;
        ">
          ${code}
        </div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

/**
 * Creates live train position marker: solid filled amber square with slow 2s pulse
 */
function createLiveTrainIcon() {
  return L.divIcon({
    className: 'custom-live-train-marker',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; transform: translate(-50%, -50%);">
        <style>
          @keyframes squarePulse {
            0% { transform: scale(1); opacity: 0.9; }
            50% { transform: scale(1.25); opacity: 0.4; }
            100% { transform: scale(1); opacity: 0.9; }
          }
          @media (prefers-reduced-motion: reduce) {
            .pulse-square { animation: none !important; }
          }
        </style>
        <!-- Outer pulsing square outline -->
        <div class="pulse-square" style="
          position: absolute;
          width: 22px;
          height: 22px;
          border: 1.5px solid #FFB300;
          background-color: rgba(255, 179, 0, 0.15);
          animation: squarePulse 2s ease-in-out infinite;
        "></div>
        <!-- Center solid signal amber square -->
        <div style="
          width: 10px;
          height: 10px;
          background-color: #FFB300;
          box-shadow: 0 0 8px rgba(255, 179, 0, 0.9);
          z-index: 2;
        "></div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

export default function TrainMap({ 
  stations = [], 
  currentPosition = null, 
  trainNumber = '',
  trainName = '' 
}) {
  const [followTrain, setFollowTrain] = useState(false);
  const [interpolatedPos, setInterpolatedPos] = useState(
    currentPosition ? [currentPosition.lat, currentPosition.lng] : null
  );

  const prevPosRef = useRef(currentPosition ? [currentPosition.lat, currentPosition.lng] : null);
  const animFrameRef = useRef(null);

  useEffect(() => {
    if (!currentPosition?.lat || !currentPosition?.lng) return;
    const target = [currentPosition.lat, currentPosition.lng];
    const start = prevPosRef.current || target;

    if (start[0] === target[0] && start[1] === target[1]) {
      setInterpolatedPos(target);
      return;
    }

    const startTime = performance.now();
    const duration = 1200; // 1.2s ease

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 2);

      const curLat = start[0] + (target[0] - start[0]) * ease;
      const curLng = start[1] + (target[1] - start[1]) * ease;
      setInterpolatedPos([curLat, curLng]);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        prevPosRef.current = target;
      }
    };

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [currentPosition?.lat, currentPosition?.lng]);

  // Route path calculations
  const routeCoords = useMemo(() => {
    return stations.map(stn => [stn.lat, stn.lng]);
  }, [stations]);

  const { completedCoords, upcomingCoords } = useMemo(() => {
    const completed = [];
    const upcoming = [];
    let passedCurrent = false;

    stations.forEach((stn) => {
      if (stn.status === 'reached') {
        completed.push([stn.lat, stn.lng]);
      } else {
        if (!passedCurrent && completed.length > 0) {
          completed.push([stn.lat, stn.lng]);
        }
        upcoming.push([stn.lat, stn.lng]);
        passedCurrent = true;
      }
    });

    return { completedCoords: completed, upcomingCoords: upcoming };
  }, [stations]);

  const defaultCenter = routeCoords.length > 0 
    ? routeCoords[Math.floor(routeCoords.length / 2)] 
    : [22.5, 78.5];

  const bounds = routeCoords.length > 0 ? routeCoords : null;

  return (
    <div className="relative w-full h-[450px] lg:h-[620px] bg-black border border-white/10 border-t-2 border-t-[#FFB300] overflow-hidden font-sans">
      
      {/* Top Map HUD Overlay */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-wrap items-center gap-2 pointer-events-auto">
        <div className="px-2.5 py-1.5 bg-[#111111] border border-white/15 text-xs text-white flex items-center gap-2">
          <span className="w-2 h-2 bg-[#FFB300] inline-block" />
          <span className="font-sora font-bold text-[#FFB300]">{trainNumber}</span>
          <span className="text-white/30">|</span>
          <span className="text-white/70 text-[11px] font-sora uppercase">LIVE_GIS_TRACK</span>
        </div>

        {currentPosition?.speed_kmh !== undefined && (
          <div className="px-2.5 py-1.5 bg-[#111111] border border-white/15 text-xs text-white flex items-center gap-1.5 font-sans">
            <Compass className="w-3.5 h-3.5 text-[#FFB300]" />
            <span className="font-bold text-white">{currentPosition.speed_kmh}</span>
            <span className="text-white/40 text-[10px]">KM/H</span>
          </div>
        )}
      </div>

      {/* Map Control Buttons */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-2 pointer-events-auto">
        <button
          onClick={() => setFollowTrain(!followTrain)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-sora border transition-all focus-visible:ring-1 focus-visible:ring-[#FFB300] ${
            followTrain 
              ? 'bg-[#FFB300] text-black border-[#FFB300] font-bold' 
              : 'bg-[#111111] text-white/70 hover:text-white border-white/10 hover:border-white/30'
          }`}
          title="Follow train live position"
        >
          <Navigation className={`w-3.5 h-3.5 ${followTrain ? 'fill-black' : ''}`} />
          <span>{followTrain ? 'TRACKING' : 'FOLLOW'}</span>
        </button>

        <button
          onClick={() => setFollowTrain(false)}
          className="p-1.5 bg-[#111111] text-white/70 hover:text-white border border-white/10 hover:border-white/30 transition-colors focus-visible:ring-1 focus-visible:ring-[#FFB300]"
          title="Fit whole route to screen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Map Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] px-3 py-1.5 bg-[#111111] border border-white/10 text-[10px] font-sora text-white/60 flex items-center gap-4 pointer-events-auto hidden sm:flex">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-white inline-block"></span>
          <span>REACHED</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-[#FFB300] inline-block"></span>
          <span>LIVE_RAKE</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 border border-white/40 inline-block"></span>
          <span>UPCOMING</span>
        </div>
      </div>

      {/* Leaflet Map Canvas with CartoDB Dark Matter Tiles */}
      <MapContainer
        center={defaultCenter}
        zoom={6}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <MapController 
          bounds={bounds} 
          currentPosition={currentPosition} 
          followTrain={followTrain} 
        />

        {/* Completed Route Segment (Full Opacity Amber) */}
        {completedCoords.length > 1 && (
          <Polyline
            positions={completedCoords}
            pathOptions={{
              color: '#FFB300',
              weight: 2,
              opacity: 1.0,
              lineCap: 'square',
              lineJoin: 'miter',
            }}
          />
        )}

        {/* Upcoming Route Segment (Reduced Opacity Amber) */}
        {upcomingCoords.length > 1 && (
          <Polyline
            positions={upcomingCoords}
            pathOptions={{
              color: '#FFB300',
              weight: 2,
              opacity: 0.35,
              lineCap: 'square',
              lineJoin: 'miter',
            }}
          />
        )}

        {/* Station Markers (Square Outline Language) */}
        {stations.map((stn, index) => (
          <Marker
            key={`${stn.code}-${index}`}
            position={[stn.lat, stn.lng]}
            icon={createSquareStationIcon(stn.status, stn.code)}
          >
            <Popup>
              <div className="font-sans text-xs space-y-1.5 bg-[#111111] text-white">
                <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-1">
                  <span className="font-sora font-bold text-white text-[11px]">{stn.name}</span>
                  <span className="text-[#FFB300] font-sora font-bold text-[10px]">[{stn.code}]</span>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-white/60 pt-0.5 font-sans">
                  <div>DISTANCE: <span className="text-white">{stn.distance_km} KM</span></div>
                  <div>STATUS: <span className={stn.status === 'delayed' ? 'text-[#B22222] font-semibold' : stn.status === 'reached' ? 'text-white' : 'text-[#FFB300]'}>{stn.status.toUpperCase()}</span></div>
                  <div>SCHED: <span className="text-white">+{stn.scheduled_offset_min}M</span></div>
                  <div>DELAY: <span className={stn.predicted_delay_min > 2 ? 'text-[#B22222] font-semibold' : 'text-white'}>+{stn.predicted_delay_min || 0}M</span></div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Current Train Location Marker (Pulsing Amber Square with Interpolation) */}
        {interpolatedPos && (
          <Marker
            position={interpolatedPos}
            icon={createLiveTrainIcon()}
            zIndexOffset={1000}
          >
            <Popup autoPan={false}>
              <div className="font-sans text-xs space-y-1.5 min-w-[190px] bg-[#111111] text-white">
                <div className="flex items-center justify-between border-b border-white/10 pb-1 font-sora">
                  <span className="text-[#FFB300] font-bold text-[11px]">[{trainNumber}]</span>
                  <span className="text-[10px] text-[#FFB300] font-bold">[ IN_TRANSIT ]</span>
                </div>
                <p className="text-white text-[11px] font-medium leading-snug font-sans">{trainName}</p>
                <div className="pt-1 space-y-1 text-[10px] text-white/60 font-sans">
                  <div className="flex justify-between">
                    <span className="font-sora uppercase">SPEED:</span>
                    <span className="text-white font-bold">{currentPosition?.speed_kmh || 92} KM/H</span>
                  </div>
                  {currentPosition?.next_station_name && (
                    <div className="flex justify-between">
                      <span className="font-sora uppercase">NEXT_HALT:</span>
                      <span className="text-[#FFB300]">{currentPosition.next_station_name}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-white/40 pt-1 border-t border-white/10">
                    <span className="font-sora uppercase">SYNC_FEED:</span>
                    <span>{currentPosition?.last_updated || 'LIVE'}</span>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}

