
export type RiskLevel = 'High' | 'Medium' | 'Low';

export interface GeoLocation {
  lat: number;
  lng: number;
}

export interface FloodForecast {
  trend: 'Rising' | 'Receding' | 'Stable'; // Trend direction
  predictedChange: string; // e.g., "+0.2m", "-0.5m"
  estimatedClearanceTime?: string; // e.g., "4 hours", "Unknown"
}

export interface HistoricalPeak {
  year: number;
  level: string; // e.g. "1.5m"
  date: string; // e.g. "Oct 2020"
}

export interface FloodReport {
  id: string;
  location: GeoLocation;
  imageUrl: string;
  depth: string;
  risk: RiskLevel;
  objectsDetected: string[];
  vulnerablePeople?: string[]; // New: List specific vulnerable groups (Elderly, Children)
  advice: string;
  timestamp: Date;
  address?: string; // Optional approximate address
  isSOS?: boolean; // True if this is an emergency signal
  status?: 'Pending' | 'Acknowledged' | 'Rescued'; // Status of the rescue
  forecast?: FloodForecast; // Hydrological forecast data
  historicalPeaks?: HistoricalPeak[]; // Compare with past years
}

export interface AnalysisResult {
  depth: string;
  risk: RiskLevel;
  objectsDetected: string[];
  vulnerablePeople: string[]; // New
  advice: string;
}

// New Type for DIY Rescue Guide
export interface DIYGuide {
  title: string;
  materialsDetected: string[];
  steps: string[];
  safetyNote: string;
}
