import React, { useState } from 'react';
import { Radio, Wind, MapPin, AlertTriangle, ShieldCheck, ZoomIn, ZoomOut, Compass, Info } from 'lucide-react';
import { OutbreakReport, RegionalLanguage } from '../types';
import { getCropName, getDiseaseName } from '../utils/translations';

interface InteractiveOutbreakMapProps {
  reports: OutbreakReport[];
  selectedOutbreak: OutbreakReport | null;
  onSelectOutbreak: (report: OutbreakReport) => void;
  selectedRadius: number;
  userDistrict?: string;
  onReportClick: () => void;
  currentLanguage?: RegionalLanguage;
}

export const InteractiveOutbreakMap: React.FC<InteractiveOutbreakMapProps> = ({
  reports,
  selectedOutbreak,
  onSelectOutbreak,
  selectedRadius,
  userDistrict = 'Nashik / Deccan Belt',
  onReportClick,
  currentLanguage,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [mapStyle, setMapStyle] = useState<'tactical' | 'satellite'>('tactical');
  const [hoveredReport, setHoveredReport] = useState<OutbreakReport | null>(null);

  // Map canvas dimension in SVG viewBox
  const mapSize = 600;
  const center = mapSize / 2;

  // Scale: selectedRadius km corresponds to 240px from center
  const scale = 240 / selectedRadius;

  // Derive polar coordinates for each outbreak relative to center
  const getMarkerCoords = (report: OutbreakReport, index: number) => {
    // Generate deterministic angles based on id/index if lat/lng are close
    const baseAngle = (index * (360 / Math.max(1, reports.length)) + 25) * (Math.PI / 180);
    const distPx = Math.min(270, Math.max(35, report.distanceKm * scale * zoomLevel));
    
    // Slight offset based on lat/lng if available
    const x = center + distPx * Math.cos(baseAngle);
    const y = center + distPx * Math.sin(baseAngle);
    return { x, y, angle: baseAngle };
  };

  return (
    <div className="bg-slate-950 rounded-3xl border border-slate-800 shadow-xl overflow-hidden relative text-white select-none">
      
      {/* Top Map Control Bar */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
        {/* Live Vector & Wind Status Pill */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3 py-1.5 rounded-2xl flex items-center gap-2 text-xs shadow-md pointer-events-auto">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-mono text-emerald-400 font-bold">RADAR ACTIVE</span>
          <span className="text-slate-500">|</span>
          <span className="flex items-center gap-1 text-slate-300 font-medium">
            <Wind className="w-3.5 h-3.5 text-sky-400" />
            <span>WSW 14 km/h (Spore Drift East)</span>
          </span>
        </div>

        {/* Map View & Zoom Controls */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 flex items-center gap-1 shadow-md">
            <button
              type="button"
              onClick={() => setMapStyle('tactical')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                mapStyle === 'tactical'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tactical Radar
            </button>
            <button
              type="button"
              onClick={() => setMapStyle('satellite')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                mapStyle === 'satellite'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Field Grid
            </button>
          </div>

          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 flex items-center gap-0.5 shadow-md">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(1.6, z + 0.2))}
              className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.2))}
              className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main SVG Interactive Map Canvas */}
      <div className="relative w-full aspect-square max-h-[460px] sm:max-h-[500px] flex items-center justify-center overflow-hidden">
        <svg
          viewBox={`0 0 ${mapSize} ${mapSize}`}
          className="w-full h-full cursor-crosshair transition-transform duration-300"
          style={{
            background:
              mapStyle === 'satellite'
                ? 'radial-gradient(circle, #091913 0%, #06110d 50%, #020705 100%)'
                : 'radial-gradient(circle, #0b1522 0%, #060b13 60%, #020408 100%)',
          }}
        >
          <defs>
            {/* Field Grid Pattern */}
            <pattern id="fieldGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.75" strokeOpacity="0.4" />
              <circle cx="20" cy="20" r="1" fill="#334155" opacity="0.3" />
            </pattern>

            {/* Radar Sweep Gradient */}
            <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="70%" stopColor="#059669" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#047857" stopOpacity="0" />
            </radialGradient>

            {/* Contagion Danger Gradient */}
            <radialGradient id="redZoneGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Background Grid */}
          <rect width={mapSize} height={mapSize} fill="url(#fieldGrid)" />

          {/* Concentric Danger Radius Rings */}
          {/* Outer Buffer Zone (25 km) */}
          <circle
            cx={center}
            cy={center}
            r={Math.min(270, 25 * scale * zoomLevel)}
            fill="none"
            stroke="#475569"
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.4"
          />
          <text
            x={center + 8}
            y={center - Math.min(265, 25 * scale * zoomLevel) + 12}
            fill="#64748b"
            fontSize="10"
            fontFamily="monospace"
          >
            25 KM BUFFER
          </text>

          {/* Amber Vulnerable Zone (15 km) */}
          <circle
            cx={center}
            cy={center}
            r={Math.min(220, 15 * scale * zoomLevel)}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="1.2"
            strokeDasharray="3 3"
            opacity="0.5"
          />
          <text
            x={center + 8}
            y={center - Math.min(215, 15 * scale * zoomLevel) + 12}
            fill="#d97706"
            fontSize="10"
            fontFamily="monospace"
            fontWeight="bold"
          >
            15 KM DANGER ZONE (Spore Spread in &lt;48h)
          </text>

          {/* Critical Red Contagion Zone (5 km) */}
          <circle
            cx={center}
            cy={center}
            r={Math.max(40, 5 * scale * zoomLevel)}
            fill="url(#redZoneGlow)"
            stroke="#ef4444"
            strokeWidth="1.5"
            opacity="0.8"
          />
          <text
            x={center + 6}
            y={center - Math.max(38, 5 * scale * zoomLevel) + 12}
            fill="#ef4444"
            fontSize="10"
            fontFamily="monospace"
            fontWeight="bold"
          >
            5 KM CRITICAL ZONE
          </text>

          {/* Crosshair Axes */}
          <line x1={center} y1={20} x2={center} y2={mapSize - 20} stroke="#1e293b" strokeWidth="1" strokeDasharray="2 4" />
          <line x1={20} y1={center} x2={mapSize - 20} y2={center} stroke="#1e293b" strokeWidth="1" strokeDasharray="2 4" />

          {/* Spore Drift Wind Vector Trail */}
          <g opacity="0.6">
            <path
              d={`M ${center - 120} ${center + 60} Q ${center} ${center - 20} ${center + 140} ${center - 80}`}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2"
              strokeDasharray="6 6"
              className="animate-pulse"
            />
            <polygon
              points={`${center + 145},${center - 83} ${center + 133},${center - 77} ${center + 137},${center - 91}`}
              fill="#38bdf8"
            />
            <text x={center + 60} y={center - 60} fill="#38bdf8" fontSize="9" fontFamily="monospace">
              PREVAILING SPORE DRIFT →
            </text>
          </g>

          {/* Connecting Threat Rays to Selected Outbreak */}
          {selectedOutbreak && reports.length > 0 && (() => {
            const index = reports.findIndex((r) => r.id === selectedOutbreak.id);
            if (index === -1) return null;
            const { x, y } = getMarkerCoords(selectedOutbreak, index);
            return (
              <g>
                <line
                  x1={center}
                  y1={center}
                  x2={x}
                  y2={y}
                  stroke={selectedOutbreak.severity === 'high' ? '#ef4444' : '#f59e0b'}
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  opacity="0.9"
                />
                <circle cx={(center + x) / 2} cy={(center + y) / 2} r="12" fill="#0f172a" stroke="#ef4444" strokeWidth="1" />
                <text
                  x={(center + x) / 2}
                  y={(center + y) / 2 + 3}
                  fill="#fecaca"
                  fontSize="8"
                  fontFamily="monospace"
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  {selectedOutbreak.distanceKm}km
                </text>
              </g>
            );
          })()}

          {/* Outbreak Village Markers */}
          {reports.map((report, idx) => {
            const { x, y } = getMarkerCoords(report, idx);
            const isSelected = selectedOutbreak?.id === report.id;
            const isHigh = report.severity === 'high';
            const color = isHigh ? '#ef4444' : '#f59e0b';

            return (
              <g
                key={report.id}
                className="cursor-pointer transition-transform hover:scale-110"
                onClick={() => onSelectOutbreak(report)}
                onMouseEnter={() => setHoveredReport(report)}
                onMouseLeave={() => setHoveredReport(null)}
              >
                {/* Outer Pulsing Threat Ring */}
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? '24' : isHigh ? '18' : '14'}
                  fill={color}
                  opacity={isSelected ? 0.35 : 0.2}
                />
                {isHigh && (
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? '32' : '24'}
                    fill="none"
                    stroke={color}
                    strokeWidth="1.5"
                    opacity="0.6"
                    className="animate-ping"
                    style={{ transformOrigin: `${x}px ${y}px` }}
                  />
                )}

                {/* Pin Core */}
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? '11' : '8'}
                  fill={color}
                  stroke="#ffffff"
                  strokeWidth={isSelected ? '3' : '2'}
                  filter="drop-shadow(0 2px 4px rgba(0,0,0,0.8))"
                />

                {/* Village Tag Label */}
                <rect
                  x={x - 42}
                  y={y + 12}
                  width="84"
                  height="16"
                  rx="4"
                  fill="#0f172a"
                  stroke={isSelected ? color : '#334155'}
                  strokeWidth={isSelected ? '1.5' : '0.75'}
                  opacity="0.95"
                />
                <text
                  x={x}
                  y={y + 23}
                  fill={isSelected ? '#ffffff' : '#cbd5e1'}
                  fontSize="8.5"
                  fontWeight="bold"
                  textAnchor="middle"
                  fontFamily="sans-serif"
                >
                  {report.village.split(' ')[0]} ({report.distanceKm}k)
                </text>
              </g>
            );
          })}

          {/* Center Point: YOUR FARM (Farmer's Location) */}
          <g>
            {/* Radar sweep ambient ring */}
            <circle cx={center} cy={center} r="28" fill="url(#radarGlow)" />
            <circle cx={center} cy={center} r="16" fill="#047857" opacity="0.3" />
            
            {/* Center Beacon */}
            <circle
              cx={center}
              cy={center}
              r="7"
              fill="#10b981"
              stroke="#ffffff"
              strokeWidth="2"
              filter="drop-shadow(0 0 8px #10b981)"
            />

            {/* Farm Tag */}
            <rect
              x={center - 36}
              y={center - 26}
              width="72"
              height="16"
              rx="4"
              fill="#064e3b"
              stroke="#10b981"
              strokeWidth="1.5"
            />
            <text
              x={center}
              y={center - 15}
              fill="#ffffff"
              fontSize="9"
              fontWeight="900"
              textAnchor="middle"
              fontFamily="sans-serif"
            >
              📍 YOUR FARM
            </text>
          </g>

          {/* Compass Rose */}
          <g transform={`translate(${mapSize - 45}, 45)`} opacity="0.7">
            <circle cx="0" cy="0" r="16" fill="#0f172a" stroke="#334155" strokeWidth="1" />
            <line x1="0" y1="-12" x2="0" y2="12" stroke="#64748b" strokeWidth="1" />
            <line x1="-12" y1="0" x2="12" y2="0" stroke="#64748b" strokeWidth="1" />
            <polygon points="0,-14 -3,-4 3,-4" fill="#ef4444" />
            <text x="0" y="-16" fill="#ef4444" fontSize="8" fontWeight="bold" textAnchor="middle">
              N
            </text>
          </g>
        </svg>

        {/* Hover / Quick Tooltip Preview */}
        {hoveredReport && (
          <div className="absolute bottom-4 left-4 z-30 bg-slate-900/95 backdrop-blur-md border border-slate-700 p-3 rounded-2xl shadow-xl max-w-xs text-xs space-y-1 pointer-events-none animate-fade-in">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-amber-300">{hoveredReport.village}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-950 text-red-300 font-bold border border-red-800">
                {hoveredReport.distanceKm} km away
              </span>
            </div>
            <p className="font-black text-white text-sm">{getDiseaseName(hoveredReport.disease, currentLanguage?.code)}</p>
            <p className="text-slate-300 text-[11px]">
              Crop: <strong>{getCropName(hoveredReport.crop, currentLanguage?.code)}</strong> • {hoveredReport.affectedAcres} Acres affected
            </p>
            <p className="text-emerald-400 text-[11px] font-medium pt-0.5">
              Click marker to view preventive barrier protocol
            </p>
          </div>
        )}
      </div>

      {/* Bottom Map Legend & Broadcast Trigger */}
      <div className="bg-slate-900/90 border-t border-slate-800 p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-300">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white"></span>
            <span>Your Farm</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500 border border-white animate-pulse"></span>
            <span>High Outbreak (&lt;24h Threat)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 border border-white"></span>
            <span>Moderate Outbreak</span>
          </span>
          <span className="flex items-center gap-1.5 text-sky-400">
            <span className="w-4 h-0.5 border-t-2 border-dashed border-sky-400"></span>
            <span>Wind / Spore Drift Corridor</span>
          </span>
        </div>

        {/* Quick Report Trigger */}
        <button
          type="button"
          onClick={onReportClick}
          className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer shrink-0 self-stretch sm:self-auto justify-center"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>🚨 Report & Warn Nearby Farms</span>
        </button>
      </div>

    </div>
  );
};
