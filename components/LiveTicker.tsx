import React from 'react';
import { FloodReport } from '../types';
import { AlertTriangle, Clock, Zap } from 'lucide-react';

interface LiveTickerProps {
  reports: FloodReport[];
  onReportClick: (report: FloodReport) => void;
}

const formatTimeAgo = (date: Date) => {
  const diff = (Date.now() - date.getTime()) / 1000; // seconds
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
};

const LiveTicker: React.FC<LiveTickerProps> = ({ reports, onReportClick }) => {
  return (
    <div className="absolute top-20 left-4 bottom-8 w-80 bg-slate-900/90 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-2xl z-[800] flex flex-col overflow-hidden pointer-events-auto">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-ping absolute top-0 left-0 opacity-75"></div>
            <div className="w-3 h-3 bg-red-500 rounded-full relative"></div>
          </div>
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Live Updates</h2>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">09/12/2025</span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
        {reports.map((report) => (
          <div 
            key={report.id}
            onClick={() => onReportClick(report)}
            className={`p-3 rounded-lg border cursor-pointer transition-all hover:translate-x-1 ${
              report.isSOS 
                ? 'bg-red-600/20 border-red-500 animate-[pulse_2s_ease-in-out_infinite]' // SOS Styling
                : report.risk === 'High' 
                    ? 'bg-purple-900/20 border-purple-500/30 hover:bg-purple-900/30' 
                    : report.risk === 'Medium'
                        ? 'bg-orange-900/20 border-orange-500/30 hover:bg-orange-900/30'
                        : 'bg-emerald-900/20 border-emerald-500/30 hover:bg-emerald-900/30'
            }`}
          >
            <div className="flex justify-between items-start mb-1">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 ${
                report.isSOS ? 'text-white bg-red-600 border-red-500' :
                report.risk === 'High' ? 'text-purple-400 border-purple-500/20 bg-purple-500/10' :
                report.risk === 'Medium' ? 'text-orange-400 border-orange-500/20 bg-orange-500/10' :
                'text-emerald-400 border-emerald-500/20 bg-emerald-500/10'
              }`}>
                {report.isSOS && <Zap className="w-3 h-3 fill-white" />}
                {report.isSOS ? 'SOS SIGNAL' : report.risk.toUpperCase()}
              </span>
              <div className="flex items-center gap-1 text-slate-500">
                <Clock className="w-3 h-3" />
                <span className="text-[10px]">{formatTimeAgo(report.timestamp)}</span>
              </div>
            </div>
            
            <p className={`text-xs font-medium line-clamp-2 mb-1 ${report.isSOS ? 'text-white' : 'text-slate-200'}`}>
              {report.isSOS ? 'URGENT: RESCUE REQUESTED' : report.advice}
            </p>
            
            <p className="text-[10px] text-slate-400 flex items-center gap-1 truncate">
              📍 {report.address}
            </p>
            
            {report.status === 'Acknowledged' && (
                <div className="mt-2 text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                    ✓ Responders En Route
                </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Footer Gradient */}
      <div className="h-4 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none absolute bottom-0 left-0 right-0"></div>
    </div>
  );
};

export default LiveTicker;