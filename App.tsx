import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Camera, Map as MapIcon, Bell, Radio, Zap, ShieldCheck, Clock, History, Calendar, Volume2, AlertTriangle, Menu, X, Baby, Activity, ChevronsRight, CheckCircle2, LifeBuoy } from 'lucide-react';
import FloodMap from './components/Map';
import Sidebar from './components/Sidebar';
import AnalysisModal from './components/AnalysisModal';
import LiveTicker from './components/LiveTicker';
import SurvivalTab from './components/SurvivalTab'; // Import new tab
import { FloodReport, AnalysisResult, RiskLevel, GeoLocation } from './types';
import { DEMO_REPORTS, MAP_CENTER } from './constants';

// Haversine formula for distance
const calculateDistance = (loc1: GeoLocation, loc2: GeoLocation): number => {
  const R = 6371; 
  const dLat = (loc2.lat - loc1.lat) * (Math.PI / 180);
  const dLon = (loc2.lng - loc1.lng) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(loc1.lat * (Math.PI / 180)) * Math.cos(loc2.lat * (Math.PI / 180)) * 
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

type TimeMode = 'urgent' | 'day' | 'history';
type Tab = 'map' | 'stats' | 'survival'; 

const App: React.FC = () => {
  const [reports, setReports] = useState<FloodReport[]>(DEMO_REPORTS);
  const [selectedReport, setSelectedReport] = useState<FloodReport | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'All'>('All');
  const [userLocation, setUserLocation] = useState<GeoLocation | null>(null);
  
  // TIME FILTER STATE
  const [timeMode, setTimeMode] = useState<TimeMode>('urgent'); 
  const [sliderValue, setSliderValue] = useState<number>(240); 

  const [activeTab, setActiveTab] = useState<Tab>('map');
  const [isTimeMenuOpen, setIsTimeMenuOpen] = useState(false);

  // Danger / Alert States
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [immediateDanger, setImmediateDanger] = useState<{report: FloodReport, dist: number} | null>(null);
  const [isUserSafeOverride, setIsUserSafeOverride] = useState(false); 

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Audio
  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); // Warning Siren
    audioRef.current.volume = 0.5;
  }, []);

  // 1. INTELLIGENT DANGER CHECK (Local Truth Priority)
  useEffect(() => {
    if (!userLocation) return;

    // A. CHECK LOCAL TRUTH: Did the user recently report "Low" risk here?
    const localReports = reports.filter(r => calculateDistance(userLocation, r.location) < 0.05); // 0.05 km = 50m
    localReports.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // Newest first

    const mostRecentLocal = localReports[0];
    const userIsSafe = mostRecentLocal && mostRecentLocal.risk === 'Low';
    
    setIsUserSafeOverride(userIsSafe || false);

    // B. SCAN FOR DANGER
    let closestDanger: {report: FloodReport, dist: number} | null = null;
    let playAudio = false;

    reports.forEach(r => {
        const dist = calculateDistance(userLocation, r.location);
        
        // LOGIC: If user marked themselves SAFE, we ignore "High Risk" reports within 1KM.
        if (userIsSafe && dist < 1.0) {
            return; 
        }

        // Standard Warning Logic
        if (dist < 2.0) {
            if (r.risk === 'High' || r.forecast?.trend === 'Rising') {
                if (!closestDanger || dist < closestDanger.dist) {
                    closestDanger = { report: r, dist };
                }
                if (r.forecast?.trend === 'Rising' && !userIsSafe) playAudio = true;
            }
        }
    });

    setImmediateDanger(closestDanger);

    if (playAudio && audioRef.current) {
        audioRef.current.play().catch(e => console.log("Audio play blocked until interaction"));
    }
  }, [userLocation, reports]);


  const handleAnalysisComplete = (result: AnalysisResult, imageSrc: string) => {
    const location = userLocation || MAP_CENTER; 

    const newReport: FloodReport = {
      id: Date.now().toString(),
      location: {
        lat: location.lat,
        lng: location.lng
      },
      imageUrl: imageSrc,
      depth: result.depth,
      risk: result.risk,
      objectsDetected: result.objectsDetected,
      vulnerablePeople: result.vulnerablePeople,
      advice: result.advice,
      timestamp: new Date(),
      address: userLocation ? "My Current Location" : "Map Center (No GPS)",
      forecast: { trend: 'Rising', predictedChange: '+?', estimatedClearanceTime: 'Unknown' },
      historicalPeaks: []
    };

    setReports(prev => [newReport, ...prev]);
    setIsUploadModalOpen(false);
    setSelectedReport(newReport); 
    setTimeMode('urgent');
    setSliderValue(240); 
    setActiveTab('map');
  };

  const filteredReports = useMemo(() => {
    const now = Date.now();
    
    return reports.filter(r => {
      if (riskFilter !== 'All' && r.risk !== riskFilter) return false;

      const diffMinutes = (now - r.timestamp.getTime()) / (1000 * 60);

      if (timeMode === 'history') {
         return true; 
      }

      if (timeMode === 'day') {
          return diffMinutes <= sliderValue;
      }

      if (timeMode === 'urgent') {
          return diffMinutes <= sliderValue;
      }

      return true;
    });
  }, [reports, riskFilter, timeMode, sliderValue]);

  const stats = useMemo(() => {
      const total = filteredReports.length;
      const highRisk = filteredReports.filter(r => r.risk === 'High').length;
      const vulnerable = filteredReports.filter(r => r.vulnerablePeople && r.vulnerablePeople.length > 0).length;
      return { total, highRisk, vulnerable };
  }, [filteredReports]);

  const renderTimeLabel = () => {
      if (timeMode === 'history') return "All History";
      if (sliderValue < 60) return `Last ${sliderValue} mins`;
      const h = Math.floor(sliderValue / 60);
      const m = sliderValue % 60;
      return `Last ${h}h ${m > 0 ? m + 'm' : ''}`;
  }

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 overflow-hidden relative font-sans text-slate-100">
      
      {/* 1. COMPACT HEADER */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 z-50 shrink-0">
        <div className="flex items-center gap-2">
            <div className="bg-rose-600 p-1.5 rounded animate-pulse">
                <Radio className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-md font-black tracking-tight">FLOODGUARD <span className="text-rose-500">VN</span></h1>
        </div>
        
        <div className="flex items-center gap-3">
             <button 
                onClick={() => setIsSOSActive(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold animate-pulse flex items-center gap-1 shadow-lg shadow-red-900/50"
             >
                <Zap className="w-3 h-3 fill-white" />
                SOS
             </button>
             <div className="flex items-center gap-1 bg-slate-800 px-2 py-1.5 rounded-lg text-xs text-slate-400 border border-slate-700">
                 <Volume2 className="w-3 h-3" />
             </div>
        </div>
      </header>

      {/* 2. DYNAMIC STATUS BANNER: DANGER VS SAFETY CONFIRMED */}
      {isUserSafeOverride ? (
          <div className="absolute top-16 left-4 right-4 z-[999] bg-emerald-900/95 backdrop-blur-md border-l-4 border-emerald-500 rounded-r-lg shadow-2xl p-4 flex items-center gap-3 animate-in slide-in-from-top-4">
              <div className="bg-emerald-800 p-2 rounded-full">
                  <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Safety Confirmed</h3>
                  <p className="text-xs text-emerald-100 mt-1">
                      Your latest report overrides nearby flood warnings. Alerts silenced.
                  </p>
              </div>
          </div>
      ) : (
          immediateDanger && (
              <div className="absolute top-16 left-4 right-4 z-[999] bg-red-900/95 backdrop-blur-md border-l-4 border-red-500 rounded-r-lg shadow-2xl p-4 flex items-start gap-3 animate-bounce-in">
                  <div className="bg-red-800 p-2 rounded-full animate-pulse">
                      <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">Warning: Danger Zone</h3>
                      <p className="text-xs text-red-100 mt-1">
                          Rising flood detected <strong>{(immediateDanger.dist).toFixed(1)} km</strong> from you.
                      </p>
                      <p className="text-xs font-bold text-white mt-1 italic">"{immediateDanger.report.advice}"</p>
                  </div>
                  <button onClick={() => setImmediateDanger(null)} className="text-red-300 hover:text-white"><X className="w-5 h-5"/></button>
              </div>
          )
      )}

      {/* 3. MAIN CONTENT */}
      <main className="flex-1 relative bg-slate-950 overflow-hidden">
        
        {activeTab === 'survival' ? (
           <SurvivalTab />
        ) : activeTab === 'map' ? (
            <>
                <FloodMap 
                  reports={filteredReports} 
                  selectedReport={selectedReport}
                  userLocation={userLocation}
                  onLocationFound={setUserLocation}
                  onMarkerClick={setSelectedReport} 
                />
                
                <div className="hidden md:block">
                     <LiveTicker reports={filteredReports} onReportClick={setSelectedReport} />
                </div>

                <div className="absolute top-4 left-0 right-0 z-[800] flex justify-center gap-2 overflow-x-auto px-4 scrollbar-hide">
                     {(['All', 'High', 'Medium', 'Low'] as const).map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setRiskFilter(filter)}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold shadow-lg border backdrop-blur ${
                                riskFilter === filter 
                                ? 'bg-slate-900 text-white border-slate-500' 
                                : 'bg-slate-900/60 text-slate-400 border-transparent'
                            }`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </>
        ) : (
            <div className="p-6 h-full overflow-y-auto bg-slate-900">
                <h2 className="text-xl font-bold mb-6 text-slate-200">Rescue Coordination Stats</h2>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                        <div className="text-slate-400 text-xs uppercase font-bold mb-2">Total Reports</div>
                        <div className="text-3xl font-black text-white">{stats.total}</div>
                    </div>
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                        <div className="text-rose-400 text-xs uppercase font-bold mb-2">High Risk</div>
                        <div className="text-3xl font-black text-rose-500">{stats.highRisk}</div>
                    </div>
                </div>

                <div className="bg-pink-900/20 border border-pink-500/30 p-5 rounded-xl mb-6 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-pink-400 font-bold mb-1">
                            <Baby className="w-5 h-5" /> Vulnerable Groups
                        </div>
                        <p className="text-xs text-slate-400">Elderly & Children detected in need</p>
                    </div>
                    <div className="text-4xl font-black text-pink-500">{stats.vulnerable}</div>
                </div>

                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-400 uppercase">Priority Rescue Queue</h3>
                    {filteredReports.filter(r => r.vulnerablePeople && r.vulnerablePeople.length > 0).slice(0, 5).map(r => (
                        <div key={r.id} className="bg-slate-800 p-3 rounded-lg border border-slate-700 flex justify-between items-center" onClick={() => {setActiveTab('map'); setSelectedReport(r);}}>
                            <div>
                                <div className="text-sm font-bold text-white">{r.address}</div>
                                <div className="text-xs text-pink-400 flex gap-1 mt-1">
                                    {r.vulnerablePeople?.join(', ')}
                                </div>
                            </div>
                            <div className="bg-slate-700 px-2 py-1 rounded text-xs font-mono">
                                {r.depth}
                            </div>
                        </div>
                    ))}
                    {stats.vulnerable === 0 && <p className="text-xs text-slate-500 italic">No vulnerable groups detected yet.</p>}
                </div>
            </div>
        )}

      </main>

      {/* 4. BOTTOM NAVIGATION BAR */}
      <nav className="h-16 bg-slate-900 border-t border-slate-800 flex items-center justify-around px-2 z-[900] shrink-0">
          <button 
            onClick={() => setActiveTab('map')}
            className={`flex flex-col items-center gap-1 p-2 w-14 ${activeTab === 'map' ? 'text-blue-400' : 'text-slate-500'}`}
          >
              <MapIcon className="w-5 h-5" />
              <span className="text-[9px] font-bold">Map</span>
          </button>

           <button 
             onClick={() => setActiveTab('survival')}
             className={`flex flex-col items-center gap-1 p-2 w-14 ${activeTab === 'survival' ? 'text-orange-400' : 'text-slate-500'}`}
          >
              <LifeBuoy className="w-5 h-5" />
              <span className="text-[9px] font-bold">Survival</span>
          </button>

          {/* CENTRAL ACTION BUTTON (CAMERA) */}
          <div className="-mt-8">
              <button 
                onClick={() => {
                    if (!userLocation) {
                        alert("Vui lòng bật GPS để báo cáo chính xác vị trí của bạn!");
                    }
                    setIsUploadModalOpen(true);
                }}
                className="w-14 h-14 bg-blue-600 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.5)] border-4 border-slate-900 flex items-center justify-center text-white hover:scale-105 transition-transform"
              >
                  <Camera className="w-7 h-7" />
              </button>
          </div>

           <button 
             onClick={() => setActiveTab('stats')}
             className={`flex flex-col items-center gap-1 p-2 w-14 ${activeTab === 'stats' ? 'text-blue-400' : 'text-slate-500'}`}
          >
              <Activity className="w-5 h-5" />
              <span className="text-[9px] font-bold">Stats</span>
          </button>

          {/* Time Filter Slider Control (Restored) */}
           <div className="relative">
                {isTimeMenuOpen && (
                    <div className="absolute bottom-16 -right-4 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-4 animate-in fade-in slide-in-from-bottom-4 z-50">
                        {/* MODE TABS */}
                        <div className="flex p-1 bg-slate-800 rounded-lg mb-4">
                            <button 
                                onClick={() => { setTimeMode('urgent'); setSliderValue(240); }}
                                className={`flex-1 py-1.5 text-[10px] font-bold rounded transition-colors ${timeMode === 'urgent' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                                URGENT (4H)
                            </button>
                            <button 
                                onClick={() => { setTimeMode('day'); setSliderValue(720); }}
                                className={`flex-1 py-1.5 text-[10px] font-bold rounded transition-colors ${timeMode === 'day' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                                DAY (12H)
                            </button>
                            <button 
                                onClick={() => { setTimeMode('history'); }}
                                className={`flex-1 py-1.5 text-[10px] font-bold rounded transition-colors ${timeMode === 'history' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                                HISTORY
                            </button>
                        </div>

                        <div className="flex justify-between items-center mb-3">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Time Window</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${timeMode === 'urgent' ? 'text-red-400 bg-red-400/10' : 'text-blue-400 bg-blue-400/10'}`}>
                                {renderTimeLabel()}
                            </span>
                        </div>
                        
                        {timeMode !== 'history' ? (
                            <>
                                <input 
                                    type="range" 
                                    min="5" 
                                    max={timeMode === 'urgent' ? 240 : 720}
                                    step={timeMode === 'urgent' ? 5 : 30}
                                    value={sliderValue} 
                                    onChange={(e) => setSliderValue(parseInt(e.target.value))}
                                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 mb-2"
                                />
                                <div className="flex justify-between mt-1 text-[9px] text-slate-500 font-mono">
                                    <span>Now</span>
                                    <span>{timeMode === 'urgent' ? '-2h' : '-6h'}</span>
                                    <span>{timeMode === 'urgent' ? '-4h' : '-12h'}</span>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-4 bg-slate-800/50 rounded-lg border border-slate-700/50 border-dashed">
                                <History className="w-8 h-8 text-purple-500 mx-auto mb-2 opacity-50" />
                                <p className="text-xs text-slate-400">Showing all historical records.</p>
                            </div>
                        )}
                        
                    </div>
                )}
                
                <button 
                    onClick={() => setIsTimeMenuOpen(!isTimeMenuOpen)}
                    className={`flex flex-col items-center gap-1 p-2 w-14 ${isTimeMenuOpen ? 'text-blue-400' : 'text-slate-500'}`}
                >
                    <History className="w-5 h-5" />
                    <span className="text-[9px] font-bold">
                       Timeline
                    </span>
                </button>
           </div>
      </nav>

      {/* Modals */}
      <Sidebar 
        report={selectedReport} 
        userLocation={userLocation}
        onClose={() => setSelectedReport(null)} 
      />
      
      <AnalysisModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)}
        onAnalysisComplete={handleAnalysisComplete}
      />

    </div>
  );
};

export default App;