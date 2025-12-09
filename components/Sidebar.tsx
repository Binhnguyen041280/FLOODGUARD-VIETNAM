import React, { useMemo, useState } from 'react';
import { FloodReport, GeoLocation } from '../types';
import { Ruler, AlertOctagon, Info, MapPin, Navigation, X, ExternalLink, TrendingUp, TrendingDown, Minus, Clock, AlertTriangle, ShieldAlert, Baby, Calendar, ShieldCheck, ArrowRight } from 'lucide-react';
import { DEMO_REPORTS } from '../constants'; // Import to search for safe points

interface SidebarProps {
  report: FloodReport | null;
  userLocation: GeoLocation | null;
  onClose: () => void;
}

// Maximum radius for navigation (in KM). Beyond this, navigation is disabled.
const MAX_NAVIGATION_RADIUS_KM = 30;

// Haversine formula for distance in km
const calculateDistance = (loc1: GeoLocation, loc2: GeoLocation): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = (loc2.lat - loc1.lat) * (Math.PI / 180);
  const dLon = (loc2.lng - loc1.lng) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(loc1.lat * (Math.PI / 180)) * Math.cos(loc2.lat * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

const Sidebar: React.FC<SidebarProps> = ({ report, userLocation, onClose }) => {
  const [showRiskConfirm, setShowRiskConfirm] = useState(false);

  React.useEffect(() => {
    setShowRiskConfirm(false);
  }, [report?.id]);

  const distanceKm = useMemo(() => {
    if (userLocation && report) {
      return calculateDistance(userLocation, report.location);
    }
    return null;
  }, [userLocation, report]);

  // FIND NEAREST SAFE POINT (Low Risk) Logic
  const nearestSafePoint = useMemo(() => {
      if (!report || report.risk === 'Low') return null; // Already safe

      let closest: { report: FloodReport, dist: number } | null = null;
      
      // Ideally this should come from props to be dynamic, but utilizing DEMO_REPORTS + current report for context works for now
      // In a real app, 'reports' would be passed down to Sidebar or accessed via Context
      DEMO_REPORTS.forEach(r => {
          if (r.risk === 'Low') {
              const dist = calculateDistance(report.location, r.location);
              // CONSTRAINT: Safe point must be walkable (e.g., < 2km)
              if (dist < 2.0) { 
                  if (!closest || dist < closest.dist) {
                      closest = { report: r, dist };
                  }
              }
          }
      });
      return closest;
  }, [report]);

  if (!report) return null;

  const riskColor = 
    report.risk === 'High' ? 'text-purple-400 border-purple-500/30 bg-purple-500/10' :
    report.risk === 'Medium' ? 'text-orange-400 border-orange-500/30 bg-orange-500/10' :
    'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';

  const handleNavigationClick = (targetLoc: GeoLocation) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${targetLoc.lat},${targetLoc.lng}`;
    window.open(url, '_blank');
  };

  const isTooFar = distanceKm !== null && distanceKm > MAX_NAVIGATION_RADIUS_KM;

  return (
    <div className="fixed top-0 right-0 bottom-0 w-full md:w-96 bg-slate-900/95 backdrop-blur-md border-l border-slate-700 shadow-2xl z-[900] overflow-y-auto transition-transform duration-300 transform translate-x-0 h-[calc(100vh-64px)] md:h-full">
      
      {/* Header */}
      <div className="sticky top-0 bg-slate-900/95 border-b border-slate-700 p-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 text-xs font-bold uppercase tracking-wider border rounded ${riskColor}`}>
                {report.isSOS ? 'SOS SIGNAL' : `${report.risk} Risk`}
            </span>
            {report.risk === 'Low' && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-900/20 px-2 py-0.5 rounded border border-emerald-500/30">
                    <ShieldCheck className="w-3 h-3" /> SAFE POINT
                </span>
            )}
        </div>
        <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-full text-slate-400">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="p-0 relative">
        <img 
            src={report.imageUrl} 
            alt="Flood report" 
            className="w-full h-56 object-cover"
        />
        
        {/* VULNERABLE PEOPLE BADGE OVER IMAGE */}
        {report.vulnerablePeople && report.vulnerablePeople.length > 0 && (
            <div className="absolute bottom-4 right-4 bg-pink-600 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg animate-pulse">
                <Baby className="w-4 h-4" />
                {report.vulnerablePeople.length} Vulnerable Detected
            </div>
        )}
      </div>

      <div className="p-5 space-y-5 pb-20">

        {/* --- SAFE POINT EVACUATION SUGGESTION --- */}
        {nearestSafePoint && report.risk !== 'Low' && (
            <div className="bg-emerald-900/20 border border-emerald-500/50 rounded-lg p-4 animate-pulse">
                 <div className="flex items-start gap-3 mb-3">
                     <ShieldCheck className="w-6 h-6 text-emerald-500 shrink-0" />
                     <div>
                         <h4 className="text-sm font-bold text-emerald-400 uppercase">Nearest Safe Zone</h4>
                         <p className="text-xs text-slate-300 mt-1">
                             <span className="font-bold text-white">{nearestSafePoint.report.address}</span> is reported safe.
                         </p>
                         <p className="text-xs text-emerald-300 font-mono mt-1">
                             Distance: {nearestSafePoint.dist.toFixed(2)} km
                         </p>
                     </div>
                 </div>
                 <button 
                    onClick={() => handleNavigationClick(nearestSafePoint.report.location)}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold flex items-center justify-center gap-2"
                 >
                     <Navigation className="w-3 h-3" /> Evacuate Here
                 </button>
            </div>
        )}
        
        {/* Navigation & Distance */}
        <div className="flex flex-col gap-3">
            {distanceKm !== null && (
                <div className="flex items-center justify-between text-slate-300 text-sm bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                    <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-blue-400"/> Distance to User</span>
                    <div className="text-right">
                        <span className={`font-mono font-bold ${isTooFar ? 'text-red-400' : 'text-white'}`}>
                            {distanceKm.toFixed(1)} km
                        </span>
                    </div>
                </div>
            )}
            
            {showRiskConfirm ? (
                <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 space-y-3">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                        <div>
                            <h4 className="text-sm font-bold text-red-400">CONFIRM HIGH RISK ENTRY</h4>
                            <p className="text-xs text-red-200 mt-1">Area is dangerous. Proceed?</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setShowRiskConfirm(false)} className="flex-1 py-2 bg-slate-800 rounded text-xs">Cancel</button>
                        <button onClick={() => {setShowRiskConfirm(false); handleNavigationClick(report.location);}} className="flex-1 py-2 bg-red-600 text-white rounded text-xs font-bold">YES, PROCEED</button>
                    </div>
                </div>
            ) : (
                <button 
                    onClick={() => {
                        if (report.risk === 'High') setShowRiskConfirm(true);
                        else handleNavigationClick(report.location);
                    }}
                    disabled={isTooFar}
                    className={`flex items-center justify-center gap-2 w-full py-3 font-bold rounded-lg shadow-lg ${isTooFar ? 'bg-slate-800 text-slate-500' : 'bg-blue-600 text-white'}`}
                >
                    <Navigation className="w-4 h-4" />
                    {isTooFar ? 'Too Far to Route' : 'Route to Report'}
                </button>
            )}
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                <span className="text-xs text-slate-400 uppercase block mb-1">Water Depth</span>
                <div className="text-xl font-bold text-slate-100">{report.depth}</div>
            </div>
            <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                <span className="text-xs text-slate-400 uppercase block mb-1">Forecast</span>
                <div className={`text-xl font-bold flex items-center gap-1 ${report.forecast?.trend === 'Rising' ? 'text-red-400' : 'text-emerald-400'}`}>
                    {report.forecast?.trend === 'Rising' ? <TrendingUp className="w-4 h-4"/> : <Minus className="w-4 h-4"/>}
                    {report.forecast?.trend}
                </div>
            </div>
        </div>

        {/* HISTORICAL COMPARISON */}
        {report.historicalPeaks && report.historicalPeaks.length > 0 ? (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
                 <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Historical Context
                 </h3>
                 <div className="space-y-2">
                    {/* Current */}
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-300 font-medium">Today</span>
                        <div className="flex items-center gap-2">
                             <div className="h-2 bg-blue-500 rounded-full" style={{ width: '40px' }}></div>
                             <span className="font-bold text-white">{report.depth}</span>
                        </div>
                    </div>
                    {/* Peaks */}
                    {report.historicalPeaks.map((peak, idx) => {
                         const width = parseFloat(peak.level) > parseFloat(report.depth) ? '60px' : '30px';
                         return (
                            <div key={idx} className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">{peak.date} (Peak)</span>
                                <div className="flex items-center gap-2">
                                    <div className="h-2 bg-slate-600 rounded-full" style={{ width: width }}></div>
                                    <span className="font-bold text-slate-400">{peak.level}</span>
                                </div>
                            </div>
                         );
                    })}
                 </div>
            </div>
        ) : (
            <div className="bg-slate-800/30 p-3 rounded-lg text-center">
                 <p className="text-xs text-slate-500 italic">No historical flood data for this specific coordinate.</p>
            </div>
        )}

        {/* Vulnerable Groups Detail */}
        {report.vulnerablePeople && report.vulnerablePeople.length > 0 && (
            <div className="bg-pink-900/10 border border-pink-500/30 rounded-lg p-3">
                <h3 className="text-xs font-bold text-pink-400 uppercase mb-2 flex items-center gap-2">
                    <Baby className="w-4 h-4" /> Rescue Priority
                </h3>
                <div className="flex flex-wrap gap-2">
                    {report.vulnerablePeople.map((p, i) => (
                        <span key={i} className="px-2 py-1 bg-pink-600/20 text-pink-200 text-xs rounded border border-pink-500/30">
                            {p}
                        </span>
                    ))}
                </div>
            </div>
        )}

        {/* Advice */}
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
             <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">AI Safety Advice</h3>
             <p className="text-sm text-slate-200 italic">"{report.advice}"</p>
        </div>

      </div>
    </div>
  );
};

export default Sidebar;