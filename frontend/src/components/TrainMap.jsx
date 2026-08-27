import React, { useEffect, useMemo, useState, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, Maximize2, Gauge } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

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
      map.fitBounds(bounds, { padding: [35, 35], maxZoom: 8 });
    }
  }, [bounds, map, followTrain]);

  useEffect(() => {
    if (followTrain && currentPosition?.lat && currentPosition?.lng) {
      map.flyTo([currentPosition.lat, currentPosition.lng], 8.5, {
        duration: 1.0,
      });
    }
  }, [currentPosition, followTrain, map]);

  return null;
}

/**
 * Creates clean railway station node markers
 */
function createRailwayStationIcon(status, code, isDark = false) {
  let dotBg = isDark ? '#3B82F6' : '#17324D';
  let dotBorder = isDark ? '#0F172A' : '#FFFFFF';
  let textColor = isDark ? '#93C5FD' : '#17324D';
  let labelBg = isDark ? '#1E293B' : '#FFFFFF';
  let labelBorder = isDark ? '#334155' : '#D9DEE5';

  if (status === 'reached') {
    dotBg = '#2E7D32';
    dotBorder = isDark ? '#0F172A' : '#FFFFFF';
    textColor = isDark ? '#6EE7B7' : '#2E7D32';
  } else if (status === 'delayed') {
    dotBg = '#ED8B00';
    dotBorder = isDark ? '#0F172A' : '#FFFFFF';
    textColor = isDark ? '#FDE68A' : '#ED8B00';
  } else {
    dotBg = isDark ? '#1E293B' : '#FFFFFF';
    dotBorder = isDark ? '#60A5FA' : '#17324D';
    textColor = isDark ? '#94A3B8' : '#667085';
  }

  return L.divIcon({
    className: 'railway-station-node',
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -50%);">
        <div style="
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background-color: ${dotBg};
          border: 2px solid ${dotBorder};
          box-shadow: 0 1px 3px rgba(0,0,0,0.4);
        "></div>
        <div style="
          margin-top: 3px;
          padding: 1px 4px;
          background: ${labelBg};
          border: 1px solid ${labelBorder};
          border-radius: 3px;
          font-family: 'Inter', sans-serif;
          font-size: 9px;
          font-weight: 700;
          color: ${textColor};
          box-shadow: 0 1px 2px rgba(0,0,0,0.15);
          white-space: nowrap;
        ">
          ${code}
        </div>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

/**
 * Creates live locomotive position marker
 */
function createLiveTrainIcon(trainNumber, speed, isDark = false) {
  const bg = isDark ? '#1E3A8A' : '#17324D';
  const border = isDark ? '#60A5FA' : '#FFFFFF';

  return L.divIcon({
    className: 'railway-locomotive-marker',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -50%);">
        <div style="
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 3px 6px;
          background-color: ${bg};
          color: #FFFFFF;
          border: 2px solid ${border};
          border-radius: 6px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.35);
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
        ">
          <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #2E7D32;"></span>
          <span>${trainNumber || 'TRAIN'}</span>
          <span style="font-size: 9px; opacity: 0.9; font-weight: 500;">${speed || 95} km/h</span>
        </div>
        <div style="
          width: 0; 
          height: 0; 
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 6px solid ${bg};
        "></div>
      </div>
    `,
    iconSize: [80, 36],
    iconAnchor: [40, 36],
  });
}

export default function TrainMap({ 
  stations = [], 
  currentPosition = null, 
  trainNumber = '', 
  trainName = '',
  onSelectStation = null
}) {
  const { theme, t } = useSettings();
  const isDark = theme === 'dark';

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
    const duration = 1000;

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
    <div className="relative w-full h-[340px] sm:h-[450px] lg:h-[600px] bg-slate-100 dark:bg-slate-900 rounded-lg border border-border dark:border-slate-800 shadow-card overflow-hidden font-sans transition-colors">
      
      {/* Top Left Floating Status Card */}
      <div className="absolute top-2 sm:top-3 left-2 sm:left-3 z-[1000] flex flex-wrap items-center gap-1.5 sm:gap-2 pointer-events-auto max-w-[calc(100%-120px)]">
        <div className="px-2.5 sm:px-3 py-1.5 rounded-md bg-white dark:bg-slate-900 border border-border dark:border-slate-700 shadow-sm text-xs text-foreground dark:text-slate-100 flex items-center gap-1.5 sm:gap-2 font-medium">
          <span className="w-2 h-2 rounded-full bg-transit-green inline-block shrink-0"></span>
          <span className="font-bold text-navy dark:text-blue-400">#{trainNumber}</span>
          <span className="text-slate-300 dark:text-slate-700 hidden xs:inline">|</span>
          <span className="text-muted dark:text-slate-300 text-[11px] hidden xs:inline">{t('routeMap')}</span>
        </div>

        {currentPosition?.speed_kmh !== undefined && (
          <div className="hidden sm:flex px-3 py-1.5 rounded-md bg-white dark:bg-slate-900 border border-border dark:border-slate-700 shadow-sm text-xs text-foreground dark:text-slate-100 items-center gap-1.5 font-sans">
            <Gauge className="w-3.5 h-3.5 text-navy dark:text-blue-400" />
            <span className="font-bold text-navy dark:text-blue-400">{currentPosition.speed_kmh}</span>
            <span className="text-muted dark:text-slate-400 text-[11px]">{t('km')}/h</span>
          </div>
        )}
      </div>

      {/* Top Right Controls Overlay */}
      <div className="absolute top-2 sm:top-3 right-2 sm:right-3 z-[1000] flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
        <button
          onClick={() => setFollowTrain(!followTrain)}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 min-h-[36px] rounded-md text-xs font-semibold border shadow-sm transition-all active:scale-95 ${
            followTrain 
              ? 'bg-navy dark:bg-blue-600 text-white border-navy dark:border-blue-500' 
              : 'bg-white dark:bg-slate-900 text-muted dark:text-slate-300 hover:text-navy dark:hover:text-white border-border dark:border-slate-700'
          }`}
          title="Auto-follow train"
        >
          <Navigation className={`w-3.5 h-3.5 ${followTrain ? 'fill-white' : ''}`} />
          <span className="hidden xs:inline">{followTrain ? 'Tracking' : 'Follow'}</span>
        </button>

        <button
          onClick={() => setFollowTrain(false)}
          className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-md bg-white dark:bg-slate-900 text-muted dark:text-slate-300 hover:text-navy dark:hover:text-white border border-border dark:border-slate-700 shadow-sm transition-all active:scale-95"
          title={t('recenterRoute')}
          aria-label={t('recenterRoute')}
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Leaflet Map with Dynamic CartoDB Tiles (Positron in Light, Dark Matter in Dark) */}
      <MapContainer
        center={defaultCenter}
        zoom={6}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          key={isDark ? 'dark-tiles' : 'light-tiles'}
          attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap'
          url={
            isDark
              ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
              : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
          }
        />

        <MapController 
          bounds={bounds} 
          currentPosition={currentPosition} 
          followTrain={followTrain} 
        />

        {/* Completed Route Segment (Solid Navy/Blue Polyline) */}
        {completedCoords.length > 1 && (
          <Polyline
            positions={completedCoords}
            pathOptions={{
              color: isDark ? '#3B82F6' : '#17324D',
              weight: 4,
              opacity: 0.9,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        )}

        {/* Upcoming Route Segment (Dashed Grey Polyline) */}
        {upcomingCoords.length > 1 && (
          <Polyline
            positions={upcomingCoords}
            pathOptions={{
              color: isDark ? '#64748B' : '#667085',
              weight: 3.5,
              opacity: 0.6,
              dashArray: '6, 8',
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        )}

        {/* Station Markers with Status Nodes */}
        {stations.map((stn, index) => (
          <Marker
            key={`${stn.code}-${index}`}
            position={[stn.lat, stn.lng]}
            icon={createRailwayStationIcon(stn.status, stn.code, isDark)}
          >
            <Popup>
              <div className="font-sans text-xs space-y-1.5 text-foreground dark:text-slate-100 min-w-[190px]">
                <div className="flex items-center justify-between border-b border-border dark:border-slate-700 pb-1">
                  <span className="font-bold text-navy dark:text-blue-400 text-xs">{stn.name}</span>
                  <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-muted dark:text-slate-300 font-bold text-[10px]">
                    {stn.code}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-muted dark:text-slate-400 pt-0.5">
                  <div>{t('distance')} <span className="text-foreground dark:text-slate-200 font-semibold">{stn.distance_km || 0} {t('km')}</span></div>
                  <div>{t('action')} <span className={stn.status === 'delayed' ? 'text-transit-orange font-semibold' : stn.status === 'reached' ? 'text-transit-green font-semibold' : 'text-navy dark:text-blue-400 font-medium'}>{stn.status.toUpperCase()}</span></div>
                  <div>{t('scheduled')} <span className="text-foreground dark:text-slate-200 font-medium">+{stn.scheduled_offset_min}m</span></div>
                  <div>{t('peakDelay')} <span className={stn.predicted_delay_min > 2 ? 'text-transit-red dark:text-red-400 font-semibold' : 'text-transit-green dark:text-emerald-400 font-semibold'}>+{stn.predicted_delay_min || 0}m</span></div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Current Train Location Marker */}
        {interpolatedPos && (
          <Marker
            position={interpolatedPos}
            icon={createLiveTrainIcon(trainNumber, currentPosition?.speed_kmh, isDark)}
            zIndexOffset={1000}
          >
            <Popup autoPan={false}>
              <div className="font-sans text-xs space-y-1.5 min-w-[210px] text-foreground dark:text-slate-100">
                <div className="flex items-center justify-between border-b border-border dark:border-slate-700 pb-1">
                  <span className="text-navy dark:text-blue-400 font-bold text-xs">{trainNumber} {trainName}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-transit-green-light dark:bg-emerald-950 text-transit-green dark:text-emerald-400 font-bold">
                    {t('liveTrack')}
                  </span>
                </div>
                <div className="space-y-1 text-[11px] text-muted dark:text-slate-400">
                  <div className="flex justify-between">
                    <span>{t('currentSpeed')}:</span>
                    <span className="text-navy dark:text-blue-400 font-bold">{currentPosition?.speed_kmh || 95} {t('km')}/h</span>
                  </div>
                  {currentPosition?.next_station_name && (
                    <div className="flex justify-between">
                      <span>{t('nextStation')}:</span>
                      <span className="text-navy dark:text-blue-300 font-semibold">{currentPosition.next_station_name}</span>
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}




