import { FloodReport, RiskLevel, FloodForecast } from './types';

// UPDATED MAP CENTER: BCONS PLAZA, BINH DUONG
export const MAP_CENTER = { lat: 10.8850, lng: 106.7810 };
export const DEFAULT_ZOOM = 14; 

// STOCK IMAGERY
const IMAGES = {
  URBAN: 'https://images.unsplash.com/photo-1598525046208-410c5710664f?auto=format&fit=crop&w=800&q=80', 
  DEEP: 'https://images.unsplash.com/photo-1476900164809-ff19b8ae5968?auto=format&fit=crop&w=800&q=80',
  RESCUE: 'https://images.unsplash.com/photo-1543857770-2646c0d8f0f0?auto=format&fit=crop&w=800&q=80',
  MUD: 'https://images.unsplash.com/photo-1603788770732-8411d3326164?auto=format&fit=crop&w=800&q=80',
  RURAL: 'https://images.unsplash.com/photo-1572960627787-25e296803277?auto=format&fit=crop&w=800&q=80'
};

// HELPER: Subtract minutes from now
const minsAgo = (mins: number) => new Date(Date.now() - mins * 60 * 1000);

// NEW DATASET: BCONS PLAZA & DONG HOA, BINH DUONG
const BINH_DUONG_DATA = [
  // 1. HIGH RISK - 5 Minutes Ago (Tests 4H Slider)
  { 
    lat: 10.8850, lng: 106.7810, 
    loc: "Cổng chính Bcons Plaza, Thống Nhất", 
    desc: "Nước tràn vào tầng hầm B1, 2 người già đang kẹt trong thang máy chưa ra được.", 
    img: IMAGES.DEEP, 
    risk: 'High', 
    depth: '1.2m', 
    obj: ['Basement', 'Elevator', 'Car'], 
    vulnerable: ['Elderly', 'Security Guard'], 
    trend: 'Rising', 
    change: '+0.1m', 
    time: 'Urgent',
    timestamp: minsAgo(5),
    peaks: [{ year: 2022, level: '0.8m', date: 'Oct 2022' }, { year: 2019, level: '1.0m', date: 'Nov 2019' }]
  },
  
  // 2. MEDIUM RISK - 45 Minutes Ago (Tests 4H/12H Slider)
  { 
    lat: 10.8900, lng: 106.7900, 
    loc: "Bến Xe Miền Đông Mới", 
    desc: "Ngập cục bộ bãi đón khách, xe buýt vẫn di chuyển được nhưng chậm.", 
    img: IMAGES.URBAN, 
    risk: 'Medium', 
    depth: '0.4m', 
    obj: ['Bus', 'Passenger'], 
    vulnerable: [], 
    trend: 'Stable', 
    change: '0m', 
    time: '1h',
    timestamp: minsAgo(45),
    peaks: [{ year: 2020, level: '0.5m', date: 'Sep 2020' }]
  },

  // 3. HIGH RISK - 3 Hours Ago (Tests 4H Slider Edge)
  { 
    lat: 10.8820, lng: 106.7780, 
    loc: "Khu dân cư Tân Hòa, Đông Hòa", 
    desc: "Nước ngập sâu vào nhà dân, có trẻ sơ sinh cần di tản gấp.", 
    img: IMAGES.RESCUE, 
    risk: 'High', 
    depth: '1.5m', 
    obj: ['House', 'Baby Crib'], 
    vulnerable: ['Baby', 'Mother'], 
    trend: 'Rising', 
    change: '+0.2m', 
    time: 'Now',
    timestamp: minsAgo(180), // 3 hours
    peaks: [{ year: 2018, level: '1.8m', date: 'Oct 2018' }]
  },

  // 4. LOW RISK - 8 Hours Ago (Tests 12H Slider)
  { 
    lat: 10.8750, lng: 106.7850, 
    loc: "Hồ Đá, Làng Đại Học", 
    desc: "Đường trơn trượt do bùn đất sau mưa, cảnh báo đi chậm.", 
    img: IMAGES.MUD, 
    risk: 'Low', 
    depth: '0.1m', 
    obj: ['Road', 'Tree'], 
    vulnerable: [], 
    trend: 'Receding', 
    change: '-0.1m', 
    time: '30m',
    timestamp: minsAgo(480), // 8 hours
    peaks: []
  },

  // 5. SOS SIGNAL - 20 Hours Ago (Tests History/>12h)
  { 
    lat: 10.8880, lng: 106.7720, 
    loc: "Gần Big C Go! Dĩ An", 
    desc: "Sự cố chập điện do nước ngập, cần cứu hỏa hỗ trợ.", 
    img: IMAGES.URBAN, 
    risk: 'High', 
    depth: '0.8m', 
    obj: ['Electric Pole', 'Sparks'], 
    vulnerable: [], 
    trend: 'Stable', 
    change: '0m', 
    time: 'Unknown',
    timestamp: minsAgo(1200), // 20 hours
    peaks: [{ year: 2023, level: '0.6m', date: 'Nov 2023' }]
  },
  
  // 6. OLD DATA - 2 Days Ago (Tests History Mode)
  {
    lat: 10.8800, lng: 106.7750,
    loc: "QL1K đoạn cầu vượt Linh Xuân",
    desc: "Ngập nhẹ sau cơn mưa lớn hôm kia.",
    img: IMAGES.RURAL,
    risk: 'Low',
    depth: '0.2m',
    obj: ['Road'],
    vulnerable: [],
    trend: 'Receding',
    change: '0m',
    time: 'Cleared',
    timestamp: minsAgo(2880), // 48 hours
    peaks: [{ year: 2021, level: '0.5m', date: 'Oct 2021' }]
  }
];

export const DEMO_REPORTS = BINH_DUONG_DATA.map((item, index) => {
    return {
      id: `rep-${index}`,
      location: { lat: item.lat, lng: item.lng },
      imageUrl: item.img,
      depth: item.depth,
      risk: item.risk as RiskLevel,
      objectsDetected: item.obj,
      vulnerablePeople: item.vulnerable,
      advice: `AI ANALYSIS: ${item.desc} \nRECOMMENDATION: ${item.risk === 'High' ? 'Evacuate immediately / Sơ tán ngay.' : 'Move to higher ground.'}`,
      timestamp: item.timestamp,
      address: item.loc,
      forecast: {
        trend: item.trend as any,
        predictedChange: item.change,
        estimatedClearanceTime: item.time
      },
      historicalPeaks: item.peaks
    };
}).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());