import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Train, Compass, MapPin, Navigation, Maximize2, ShieldAlert } from 'lucide-react';

// Fix standard Leaflet default icon path issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom Station Div Icon Generator
function createStationIcon(status, code) {
  let bg = '#475569';
  let border = '#64748B';
  let pulse = '';

  if (status === 'reached') {
    bg = '#10B981';
    border = '#059669';
  } else if (status === 'delayed') {
    bg = '#F59E0B';
    border = '#D97706';
  }

  return L.divIcon({
    className: 'custom-station-icon',
    html: `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        transform: translate(-50%, -50%);
      ">
        <div style="
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: ${bg};
          border: 2.5px solid #080E1A;
          box-shadow: 0 0 8px ${border}88;
        "></div>
        <div style="
          margin-top: 3px;
          padding: 1px 4px;
          background: #0F172AEE;
          border: 1px solid #243452;
          border-radius: 4px;
          font-family: monospace;
          font-size: 9px;
          font-weight: 700;
          color: #F8FAFC;
          letter-spacing: 0.5px;
          white-space: nowrap;
          box-shadow: 0 2px 5px rgba(0,0,0,0.5);
        ">
          ${code}
        </div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

// Custom Train Marker Div Icon
function createTrainIcon(speed) {
  return L.divIcon({
    className: 'custom-train-icon',
    html: `
      <div style="
        position: relative;
        width: 42px;
        height: 42px;
        transform: translate(-50%, -50%);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <!-- Radar Pulse Rings -->
        <div style="
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: rgba(245, 158, 11, 0.25);
          animation: pulse 1.5s ease-out infinite;
        "></div>
        <div style="
          position: absolute;
          width: 70%;
          height: 70%;
          border-radius: 50%;
          background: rgba(245, 158, 11, 0.4);
        "></div>
        <!-- Center Train Badge -->
        <div style="
          position: relative;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #F59E0B;
          border: 2px solid #080E1A;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 15px rgba(245, 158, 11, 0.8);
          color: #080E1A;
        ">
          <svg style="width: 16px; height: 16px; fill: #080E1A;" viewBox="0 0 24 24">
            <path d="M4 15.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h12v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V5c0-3.5-3.58-4-8-4s-8 .5-8 4v10.5zm8-11.5c3.75 0 6 .47 6 2H6c0-1.53 2.25-2 6-2zm-4 12c-.83 0-1.5-.67-1.5-1.5S7.17 13 8 13s1.5.67 1.5 1.5S8.83 16 8 16zm8 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM6 10h12v2H6v-2z"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
  });
}

// Map Controller for Dynamic Pan & Bounds Fitting
function MapController({ bounds, currentPosition, followTrain }) {
  const map = useMap();
  const prevPos = useRef(null);

  useEffect(() => {
    if (bounds && bounds.length > 0 && !followTrain) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 9 });
    }
  }, [bounds, map]);

  useEffect(() => {
    if (followTrain && currentPosition?.lat && currentPosition?.lng) {
      map.flyTo([currentPosition.lat, currentPosition.lng], 9, {
        duration: 1.2,
      });
    }
  }, [currentPosition, followTrain, map]);

  return null;
}

export default function TrainMap({ 
  stations = [], 
  currentPosition = null, 
  trainNumber = '', 
  trainName = '' 
}) {
  const [followTrain, setFollowTrain] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // Prepare coordinate arrays
  const routeCoords = stations.map(stn => [stn.lat, stn.lng]);
  
  // Calculate completed segment vs remaining segment
  const completedCoords = [];
  const upcomingCoords = [];
  let passedCurrent = false;

  stations.forEach((stn) => {
    if (stn.status === 'reached') {
      completedCoords.push([stn.lat, stn.lng]);
    } else {
      if (!passedCurrent && completedCoords.length > 0) {
        // bridge the gap from last reached to first upcoming
        completedCoords.push([stn.lat, stn.lng]);
      }
      upcomingCoords.push([stn.lat, stn.lng]);
      passedCurrent = true;
    }
  });

  // Calculate default map center
  const defaultCenter = routeCoords.length > 0 
    ? routeCoords[Math.floor(routeCoords.length / 2)] 
    : [22.5, 78.5]; // Central India default

  const bounds = routeCoords.length > 0 ? routeCoords : null;

  return (
    <div className="relative w-full h-[450px] lg:h-[620px] rounded-2xl overflow-hidden border border-rail-border bg-rail-dark shadow-2xl">
      
      {/* Top Map HUD Overlay */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-wrap items-center gap-2 pointer-events-auto">
        <div className="px-3 py-1.5 rounded-lg bg-rail-dark/90 backdrop-blur-md border border-rail-border text-xs font-mono text-white flex items-center gap-2 shadow-lg">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="font-bold text-rail-yellow">{trainNumber}</span>
          <span className="text-rail-muted">|</span>
          <span className="text-slate-300">Live GPS Stream</span>
        </div>

        {currentPosition?.speed_kmh !== undefined && (
          <div className="px-3 py-1.5 rounded-lg bg-rail-dark/90 backdrop-blur-md border border-rail-border text-xs font-mono text-white flex items-center gap-2 shadow-lg">
            <Compass className="w-3.5 h-3.5 text-rail-yellow" />
            <span>{currentPosition.speed_kmh} <span className="text-rail-muted text-[10px]">KM/H</span></span>
          </div>
        )}
      </div>

      {/* Map Control Buttons */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-2 pointer-events-auto">
        <button
          onClick={() => setFollowTrain(!followTrain)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border shadow-lg backdrop-blur-md transition-all ${
            followTrain 
              ? 'bg-rail-yellow text-rail-dark border-rail-yellow font-semibold' 
              : 'bg-rail-dark/90 text-rail-muted hover:text-white border-rail-border hover:bg-rail-card'
          }`}
          title="Follow train live position"
        >
          <Navigation className={`w-3.5 h-3.5 ${followTrain ? 'fill-rail-dark' : ''}`} />
          <span>{followTrain ? 'Tracking' : 'Follow'}</span>
        </button>

        <button
          onClick={() => setFollowTrain(false)}
          className="p-1.5 rounded-lg bg-rail-dark/90 text-rail-muted hover:text-white border border-rail-border hover:bg-rail-card shadow-lg backdrop-blur-md transition-colors"
          title="Fit whole route to screen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Map Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] px-3 py-2 rounded-xl bg-rail-dark/90 backdrop-blur-md border border-rail-border text-[11px] font-mono text-slate-300 flex items-center gap-3 shadow-lg pointer-events-auto hidden sm:flex">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>Passed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rail-yellow"></span>
          <span>Current / In Transit</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
          <span>Upcoming</span>
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <MapContainer
        center={defaultCenter}
        zoom={6}
        scrollWheelZoom={true}
        className="w-full h-full dark-map"
        whenReady={() => setMapReady(true)}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> & CartoDB'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        <MapController 
          bounds={bounds} 
          currentPosition={currentPosition} 
          followTrain={followTrain} 
        />

        {/* Route Polylines */}
        {/* Full Track Base Line */}
        {routeCoords.length > 1 && (
          <Polyline
            positions={routeCoords}
            pathOptions={{
              color: '#334155',
              weight: 6,
              opacity: 0.6,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        )}

        {/* Completed Route Segment (Emerald) */}
        {completedCoords.length > 1 && (
          <Polyline
            positions={completedCoords}
            pathOptions={{
              color: '#10B981',
              weight: 4,
              opacity: 0.9,
              lineCap: 'round',
            }}
          />
        )}

        {/* Upcoming Route Segment (Dashed Amber) */}
        {upcomingCoords.length > 1 && (
          <Polyline
            positions={upcomingCoords}
            pathOptions={{
              color: '#F59E0B',
              weight: 3,
              opacity: 0.8,
              dashArray: '6, 8',
              lineCap: 'round',
            }}
          />
        )}

        {/* Station Markers */}
        {stations.map((stn, index) => (
          <Marker
            key={`${stn.code}-${index}`}
            position={[stn.lat, stn.lng]}
            icon={createStationIcon(stn.status, stn.code)}
          >
            <Popup>
              <div className="p-1 space-y-1 text-xs">
                <div className="flex items-center justify-between gap-2 border-b border-rail-border pb-1">
                  <strong className="text-white font-semibold">{stn.name}</strong>
                  <span className="px-1.5 py-0.5 rounded bg-rail-navy border border-rail-border font-mono text-[10px] text-rail-yellow font-bold">
                    {stn.code}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-300 pt-1 text-[11px]">
                  <div>Distance: <strong className="text-white font-mono">{stn.distance_km} km</strong></div>
                  <div>Status: <strong className={`capitalize ${stn.status === 'delayed' ? 'text-amber-400' : stn.status === 'reached' ? 'text-emerald-400' : 'text-slate-300'}`}>{stn.status.replace('_', ' ')}</strong></div>
                  <div>Sched Offset: <strong className="text-white font-mono">+{stn.scheduled_offset_min}m</strong></div>
                  <div>ML Delay: <strong className="text-white font-mono">+{stn.predicted_delay_min || 0}m</strong></div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Current Train Location Marker */}
        {currentPosition?.lat && currentPosition?.lng && (
          <Marker
            position={[currentPosition.lat, currentPosition.lng]}
            icon={createTrainIcon(currentPosition.speed_kmh)}
            zIndexOffset={1000}
          >
            <Popup autoPan={false}>
              <div className="p-2 space-y-1.5 text-xs min-w-[200px]">
                <div className="flex items-center justify-between border-b border-rail-border pb-1.5">
                  <div className="flex items-center gap-1.5 text-rail-yellow font-bold">
                    <Train className="w-3.5 h-3.5" />
                    <span>{trainNumber}</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 font-semibold animate-pulse">
                    ● IN MOTION
                  </span>
                </div>
                <p className="text-slate-300 text-[11px] font-medium leading-tight">{trainName}</p>
                <div className="pt-1 space-y-1 font-mono text-[11px] text-slate-400">
                  <div className="flex justify-between">
                    <span>Speed:</span>
                    <strong className="text-white">{currentPosition.speed_kmh || 92} km/h</strong>
                  </div>
                  {currentPosition.next_station_name && (
                    <div className="flex justify-between">
                      <span>Next Halt:</span>
                      <strong className="text-rail-yellow">{currentPosition.next_station_name}</strong>
                    </div>
                  )}
                  <div className="flex justify-between text-[10px] text-slate-500 pt-1 border-t border-rail-border/60">
                    <span>Telemetry Sync:</span>
                    <span>{currentPosition.last_updated || 'Live'}</span>
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

