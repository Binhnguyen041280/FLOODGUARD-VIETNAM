import React, { useState, useEffect } from 'react';
import { Battery, CloudRain, Thermometer, Wifi, Zap, Droplets, Flame, Hammer, AlertOctagon, Power, Crosshair } from 'lucide-react';
import DIYModal from './DIYModal';

const SurvivalTab: React.FC = () => {
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState(false);
  const [isDIYOpen, setIsDIYOpen] = useState(false);
  
  // New State for Blackout Mode
  const [isBeaconMode, setIsBeaconMode] = useState(false);

  // Get Battery Info
  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.floor(battery.level * 100));
        setIsCharging(battery.charging);
        
        battery.addEventListener('levelchange', () => setBatteryLevel(Math.floor(battery.level * 100)));
        battery.addEventListener('chargingchange', () => setIsCharging(battery.charging));
      });
    }
  }, []);

  // EMERGENCY BEACON MODE (BLACKOUT)
  if (isBeaconMode) {
    return (
      <div className="fixed inset-0 z-[2000] bg-black flex flex-col items-center justify-center touch-none select-none">
        
        {/* Minimal Pulse Indicator */}
        <div className="relative mb-12">
            <span className="absolute inline-flex h-full w-full rounded-full bg-red-900 opacity-20 animate-[ping_3s_linear_infinite]"></span>
            <div className="w-2 h-2 bg-red-900 rounded-full shadow-[0_0_10px_rgba(153,27,27,0.5)]"></div>
        </div>

        {/* Very Dim Text */}
        <div className="text-center space-y-4 opacity-30">
            <h1 className="text-red-800 font-black text-3xl tracking-widest">SOS</h1>
            <div className="text-[10px] text-red-900 font-mono uppercase tracking-widest">
                <p>Screen: OFF</p>
                <p>GPS Signal: ACTIVE</p>
                <p>Battery Save: MAX</p>
            </div>
        </div>

        {/* Unlock Button */}
        <button 
            onClick={() => setIsBeaconMode(false)}
            className="absolute bottom-20 border border-red-900/30 text-red-900/40 px-6 py-3 rounded-full text-xs font-bold tracking-widest hover:bg-red-900/10 transition-colors"
        >
            CHẠM ĐỂ BẬT LẠI
        </button>

        {/* Fake GPS Coordinates Update Effect */}
        <div className="absolute bottom-4 text-[8px] text-red-950 font-mono">
            Lat: {10.88 + Math.random() * 0.0001} | Lng: {106.78 + Math.random() * 0.0001}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-950 overflow-y-auto p-4 pb-24">
      <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2">
        <AlertOctagon className="w-6 h-6 text-orange-500" />
        SINH TỒN & TỰ CỨU
      </h2>

      {/* 1. DEVICE & ENVIRONMENT STATUS */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between relative overflow-hidden">
          <div className="flex justify-between items-start mb-2 relative z-10">
            <Battery className={`w-6 h-6 ${batteryLevel && batteryLevel < 20 ? 'text-red-500' : 'text-emerald-500'}`} />
            <span className="text-xs text-slate-500">PHONE</span>
          </div>
          <div className="text-2xl font-black text-white flex items-end gap-1 relative z-10">
            {batteryLevel !== null ? `${batteryLevel}%` : '--'}
            {isCharging && <Zap className="w-4 h-4 text-yellow-400 mb-1" />}
          </div>
          
          {/* Quick Action for Low Power */}
          <p className="text-[10px] text-slate-400 mt-1 relative z-10">
             {batteryLevel && batteryLevel < 20 ? "Pin yếu! Bật chế độ tối thiểu ngay." : "Tiết kiệm pin: Tắt 4G khi không cần thiết."}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
           <div className="flex justify-between items-start mb-2">
            <CloudRain className="w-6 h-6 text-blue-400" />
            <span className="text-xs text-slate-500">OUTSIDE</span>
          </div>
           <div className="text-2xl font-black text-white">24°C</div>
           <p className="text-[10px] text-slate-400 mt-1">Mưa lớn. Gió giật cấp 6. Giữ ấm cơ thể.</p>
        </div>
      </div>

      {/* NEW: BLACKOUT BUTTON */}
      <button 
        onClick={() => setIsBeaconMode(true)}
        className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 p-4 rounded-xl mb-6 flex items-center justify-between group transition-all"
      >
        <div className="flex items-center gap-3">
            <div className="bg-black border border-slate-600 p-2 rounded-lg group-hover:border-red-500/50 transition-colors">
                <Power className="w-5 h-5 text-red-500" />
            </div>
            <div className="text-left">
                <div className="font-bold text-white text-sm">Chế độ Định vị Tối thiểu</div>
                <div className="text-[10px] text-slate-400">Tắt màn hình, chỉ gửi GPS để tiết kiệm pin.</div>
            </div>
        </div>
        <Crosshair className="w-5 h-5 text-slate-500 group-hover:text-red-400" />
      </button>

      {/* 2. AI DIY RESCUE TOOL */}
      <div className="mb-8">
        <div className="bg-gradient-to-br from-orange-600 to-red-700 rounded-xl p-5 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Hammer className="w-24 h-24 text-white" />
            </div>
            
            <h3 className="text-lg font-bold text-white mb-2 relative z-10">AI Chế Tạo Cứu Hộ</h3>
            <p className="text-sm text-orange-100 mb-4 relative z-10 max-w-[80%]">
              Bạn có chai nhựa, can nước, xốp? Chụp ảnh ngay để AI hướng dẫn làm phao/bè.
            </p>
            
            <button 
              onClick={() => setIsDIYOpen(true)}
              className="bg-white text-orange-700 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg relative z-10 active:scale-95 transition-transform"
            >
              <Hammer className="w-4 h-4" />
              Chụp ảnh & Hướng dẫn
            </button>
        </div>
      </div>

      {/* 3. SURVIVAL TIPS */}
      <h3 className="text-sm font-bold text-slate-400 uppercase mb-3 tracking-wider">Kỹ năng sinh tồn cơ bản</h3>
      <div className="space-y-3">
        
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
           <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-900/30 rounded-lg text-blue-400">
                  <Droplets className="w-5 h-5" />
              </div>
              <div>
                  <h4 className="font-bold text-slate-200">Nước sạch</h4>
                  <p className="text-xs text-slate-400 mt-1">Không uống nước lũ. Hứng nước mưa bằng bạt sạch. Nếu buộc phải dùng nước lũ, hãy lọc qua vải dày và đun sôi (nếu có thể) hoặc dùng viên khử khuẩn.</p>
              </div>
           </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
           <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-900/30 rounded-lg text-orange-400">
                  <Flame className="w-5 h-5" />
              </div>
              <div>
                  <h4 className="font-bold text-slate-200">Giữ nhiệt (Hypothermia)</h4>
                  <p className="text-xs text-slate-400 mt-1">Ngâm nước lâu gây mất nhiệt. Cố gắng tìm chỗ khô ráo. Quấn ni-lông hoặc áo mưa quanh người để giữ nhiệt tốt hơn áo ướt.</p>
              </div>
           </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
           <div className="flex items-start gap-3">
              <div className="p-2 bg-yellow-900/30 rounded-lg text-yellow-400">
                  <Zap className="w-5 h-5" />
              </div>
              <div>
                  <h4 className="font-bold text-slate-200">An toàn điện</h4>
                  <p className="text-xs text-slate-400 mt-1">Cắt cầu dao tổng ngay khi nước vào nhà. Không chạm vào cột điện hay dây đứt rơi xuống nước. Cách xa ít nhất 10m.</p>
              </div>
           </div>
        </div>

      </div>

      <DIYModal isOpen={isDIYOpen} onClose={() => setIsDIYOpen(false)} />
    </div>
  );
};

export default SurvivalTab;