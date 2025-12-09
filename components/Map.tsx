import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, ZoomControl, useMap, Polyline, Circle } from 'react-leaflet';
import L from 'leaflet';
import { FloodReport, GeoLocation } from '../types';
import { MAP_CENTER, DEFAULT_ZOOM } from '../constants';
import { renderToStaticMarkup } from 'react-dom/server';
import { Droplets, Crosshair, Zap, Layers, User, Baby, Accessibility, ShieldCheck } from 'lucide-react';

// Fix for Leaflet default icon issues in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '',
  iconUrl: '',
  shadowUrl: '',
});

interface MapProps {
  reports: FloodReport[];
  selectedReport: FloodReport | null;
  userLocation: GeoLocation | null;
  onLocationFound: (location: GeoLocation) => void;
  onMarkerClick: (report: FloodReport) => void;
}

// Haversine formula helper for map component
const calculateDistance = (loc1: GeoLocation, loc2: GeoLocation): number => {
    const R = 6371; 
    const dLat = (loc2.lat - loc1.lat) * (Math.PI / 180);
    const dLon = (loc2.lng - loc1.lng) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(loc1.lat * (Math.PI / 180)) * Math.cos(loc2.lat * (Math.PI / 180)) * 
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Custom DivIcon logic
const createCustomIcon = (report: FloodReport, isSelected: boolean) => {
  const isSOS = report.isSOS;
  const risk = report.risk;
  const hasVulnerable = report.vulnerablePeople && report.vulnerablePeople.length > 0;
  
  if (isSOS) {
    const sosHtml = renderToStaticMarkup(
        <div className="relative flex items-center justify-center w-16 h-16">
            <span className="absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-20 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></span>
            <span className="absolute inline-flex h-2/3 w-2/3 rounded-full bg-red-500 opacity-40 animate-[ping_1s_ease-in-out_infinite]"></span>
            <div className={`relative z-10 w-10 h-10 bg-red-600 rounded-full border-2 border-white shadow-[0_0_20px_rgba(220,38,38,0.8)] flex items-center justify-center ${isSelected ? 'scale-125 transition-transform' : ''}`}>
                <Zap className="w-6 h-6 text-white fill-white" />
            </div>
        </div>
    );
    return L.divIcon({
        html: sosHtml,
        className: 'sos-leaflet-icon',
        iconSize: [64, 64],
        iconAnchor: [32, 32],
    });
  }

  // Define Color
  const color = risk === 'High' ? '#a855f7' : risk === 'Medium' ? '#f97316' : '#10b981';
  
  // Icon content based on risk/type
  // Low Risk = Safe Point (Shield)
  // High Risk + Vulnerable = Baby
  // Default = Droplets
  let IconComponent = Droplets;
  if (risk === 'Low') IconComponent = ShieldCheck;
  else if (hasVulnerable) IconComponent = Baby;

  const iconHtml = renderToStaticMarkup(
    <div className="relative flex items-center justify-center w-10 h-10">
        {(risk === 'High' || hasVulnerable) && (
             <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${hasVulnerable ? 'bg-pink-500' : 'bg-purple-500'}`}></span>
        )}
        {/* SAFE POINT PULSE */}
        {risk === 'Low' && (
             <span className="absolute inline-flex h-full w-full rounded-full opacity-30 animate-pulse bg-emerald-500"></span>
        )}

      <div 
        className={`relative z-10 w-8 h-8 rounded-full border-2 border-white flex items-center justify-center shadow-lg transition-transform ${isSelected ? 'scale-125' : ''}`}
        style={{ backgroundColor: hasVulnerable ? '#ec4899' : color }} // Pink for vulnerable
      >
        <IconComponent className="w-5 h-5 text-white" />
      </div>
      <div 
        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 z-0"
        style={{ backgroundColor: hasVulnerable ? '#ec4899' : color }}
      ></div>
    </div>
  );

  return L.divIcon({
    html: iconHtml,
    className: 'custom-leaflet-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  });
};

// User Location Icon
const userIcon = L.divIcon({
  html: renderToStaticMarkup(
    <div className="relative flex items-center justify-center w-8 h-8">
      <span className="absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-40 animate-ping"></span>
      <div className="relative z-10 w-5 h-5 bg-blue-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
        <div className="w-2 h-2 bg-white rounded-full"></div>
      </div>
    </div>
  ),
  className: 'user-location-icon',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// Auto Locate & Controls Component
const MapEffects = ({ 
    onLocationFound, 
    showLayers, 
    toggleLayers 
}: { 
    onLocationFound: (loc: GeoLocation) => void,
    showLayers: boolean,
    toggleLayers: () => void
}) => {
  const map = useMap();
  const [hasInitialLocated, setHasInitialLocated] = useState(false);

  // AUTO LOCATE ON MOUNT
  useEffect(() => {
    if (!hasInitialLocated) {
        map.locate().on("locationfound", function (e) {
            onLocationFound({ lat: e.latlng.lat, lng: e.latlng.lng });
            map.flyTo(e.latlng, 13);
            setHasInitialLocated(true);
        }).on("locationerror", function () {
            console.warn("Auto-location failed or denied.");
            setHasInitialLocated(true); // Stop trying automatically
        });
    }
  }, [map, hasInitialLocated, onLocationFound]);

  const handleManualLocate = () => {
    map.locate().on("locationfound", function (e) {
      onLocationFound({ lat: e.latlng.lat, lng: e.latlng.lng });
      map.flyTo(e.latlng, 14);
    });
  };

  return (
    <div className="leaflet-bottom leaflet-right flex flex-col gap-2" style={{ marginBottom: '100px', marginRight: '10px', pointerEvents: 'auto' }}>
      <button
        onClick={toggleLayers}
        className={`p-2 rounded-lg shadow-xl transition-all flex items-center justify-center w-10 h-10 border ${showLayers ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'}`}
      >
        <Layers className="w-6 h-6" />
      </button>

      <button
        onClick={handleManualLocate}
        className="bg-slate-900 border border-slate-700 text-white p-2 rounded-lg shadow-xl hover:bg-slate-800 transition-colors flex items-center justify-center w-10 h-10"
      >
         <Crosshair className="w-6 h-6 text-blue-400" />
      </button>
    </div>
  );
};

const FloodMap: React.FC<MapProps> = ({ reports, selectedReport, userLocation, onLocationFound, onMarkerClick }) => {
  const [showFloodLayer, setShowFloodLayer] = useState(true);

  // Calculate nearest safe point for the selected report
  const nearestSafePoint = useMemo(() => {
      if (!selectedReport || selectedReport.risk === 'Low') return null;

      let closest: FloodReport | null = null;
      let minDistance = Infinity;

      reports.forEach(r => {
          if (r.risk === 'Low') { // Look for safe points
              const dist = calculateDistance(selectedReport.location, r.location);
              if (dist < minDistance && dist < 2.0) { // Limit to 2km radius
                  minDistance = dist;
                  closest = r;
              }
          }
      });
      return closest;
  }, [selectedReport, reports]);

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer 
        center={[MAP_CENTER.lat, MAP_CENTER.lng]} 
        zoom={DEFAULT_ZOOM} 
        style={{ height: '100%', width: '100%', background: '#0f172a' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <ZoomControl position="topright" />
        
        <MapEffects 
            onLocationFound={onLocationFound} 
            showLayers={showFloodLayer}
            toggleLayers={() => setShowFloodLayer(prev => !prev)}
        />
        
        {userLocation && <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon} />}

        {/* Line from User to Selected Report */}
        {userLocation && selectedReport && (
            <Polyline 
                positions={[[userLocation.lat, userLocation.lng], [selectedReport.location.lat, selectedReport.location.lng]]}
                pathOptions={{ color: '#3b82f6', dashArray: '10, 10', weight: 3, opacity: 0.6 }}
            />
        )}

        {/* ESCAPE ROUTE: Line from Selected Report (High Risk) to Nearest Safe Point */}
        {selectedReport && nearestSafePoint && (
             <Polyline 
                positions={[[selectedReport.location.lat, selectedReport.location.lng], [nearestSafePoint.location.lat, nearestSafePoint.location.lng]]}
                pathOptions={{ color: '#10b981', dashArray: '5, 10', weight: 4, opacity: 0.8 }}
             />
        )}

        {showFloodLayer && reports.map((report) => {
             const radius = report.risk === 'High' ? 800 : report.risk === 'Medium' ? 400 : 150;
             const fillColor = report.risk === 'High' ? '#a855f7' : report.risk === 'Medium' ? '#f97316' : '#10b981';
             return (
                 <Circle 
                    key={`circle-${report.id}`}
                    center={[report.location.lat, report.location.lng]}
                    radius={radius}
                    pathOptions={{ color: fillColor, fillColor: fillColor, fillOpacity: 0.15, weight: 1, opacity: 0.4 }}
                 />
             );
        })}

        {reports.map((report) => (
          <Marker 
            key={report.id} 
            position={[report.location.lat, report.location.lng]}
            icon={createCustomIcon(report, selectedReport?.id === report.id)}
            eventHandlers={{ click: () => onMarkerClick(report) }}
          />
        ))}
      </MapContainer>
    </div>
  );
};

export default FloodMap;