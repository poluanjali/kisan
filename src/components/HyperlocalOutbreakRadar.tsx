import React, { useState, useEffect } from 'react';
import {
  AlertOctagon,
  MapPin,
  Radio,
  ShieldAlert,
  Plus,
  Filter,
  Clock,
  Users,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Bell,
  Sparkles,
  Share2,
  Calculator,
  Wind,
  Layers,
  List,
  Map,
  ShieldCheck,
  Send,
  AlertTriangle,
} from 'lucide-react';
import { OutbreakReport, RegionalLanguage } from '../types';
import { InteractiveOutbreakMap } from './InteractiveOutbreakMap';
import { getCropName, getDiseaseName, formatBilingual } from '../utils/translations';

interface HyperlocalOutbreakRadarProps {
  userCrop?: string;
  userDistrict?: string;
  initialOutbreakData?: {
    crop?: string;
    disease?: string;
    symptomSummary?: string;
    preventionSpray?: string;
  };
  onOpenCalculator?: (params?: { chemicalName?: string; dosagePerLiter?: number; cropName?: string }) => void;
  currentLanguage?: RegionalLanguage;
}

export const HyperlocalOutbreakRadar: React.FC<HyperlocalOutbreakRadarProps> = ({
  userCrop,
  userDistrict = 'Nashik / Deccan Belt',
  initialOutbreakData,
  onOpenCalculator,
  currentLanguage,
}) => {
  const [reports, setReports] = useState<OutbreakReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCrop, setSelectedCrop] = useState<string>('all');
  const [selectedRadius, setSelectedRadius] = useState<number>(25);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedOutbreak, setSelectedOutbreak] = useState<OutbreakReport | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'split' | 'list'>('split');

  // Broadcast modal form state
  const [newCrop, setNewCrop] = useState(initialOutbreakData?.crop || userCrop || 'Tomato');
  const [newDisease, setNewDisease] = useState(initialOutbreakData?.disease || '');
  const [newVillage, setNewVillage] = useState('My Local Shivar');
  const [newAcres, setNewAcres] = useState(2);
  const [newSymptoms, setNewSymptoms] = useState(initialOutbreakData?.symptomSummary || '');
  const [newPreventionSpray, setNewPreventionSpray] = useState(initialOutbreakData?.preventionSpray || '');
  const [broadcastRadius, setBroadcastRadius] = useState<number>(15);
  const [submitting, setSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState('');
  const [broadcastStats, setBroadcastStats] = useState<{ count: number; network: string } | null>(null);

  // If initialOutbreakData is passed from diagnosis, auto-open broadcast modal
  useEffect(() => {
    if (initialOutbreakData && initialOutbreakData.disease) {
      setNewCrop(initialOutbreakData.crop || userCrop || 'Crop');
      setNewDisease(initialOutbreakData.disease);
      setNewSymptoms(initialOutbreakData.symptomSummary || '');
      setNewPreventionSpray(initialOutbreakData.preventionSpray || '');
      setIsReportModalOpen(true);
    }
  }, [initialOutbreakData, userCrop]);

  // Modal Escape key dismissal
  useEffect(() => {
    if (!isReportModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsReportModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isReportModalOpen]);

  const fetchOutbreaks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/outbreak-reports?crop=${selectedCrop}&radiusKm=${selectedRadius}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.outbreaks)) {
        setReports(data.outbreaks);
        if (!selectedOutbreak && data.outbreaks.length > 0) {
          setSelectedOutbreak(data.outbreaks[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load outbreak reports', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutbreaks();
  }, [selectedCrop, selectedRadius]);

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/outbreak-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crop: newCrop,
          disease: newDisease,
          district: userDistrict,
          village: newVillage || 'Local Shivar',
          affectedAcres: newAcres,
          symptomSummary: newSymptoms,
          reporterFarmer: 'My Field Report (Self-Reported)',
          preventionSpray: newPreventionSpray || 'Apply preventive chemical / biological shield immediately before vector migration.',
        }),
      });

      const data = await res.json();
      if (data.success && data.report) {
        setReports((prev) => [data.report, ...prev]);
        setSelectedOutbreak(data.report);
        setIsReportModalOpen(false);
        const farmersWarned = data.farmersAlerted || Math.round(broadcastRadius * 3.5);
        setBroadcastStats({
          count: farmersWarned,
          network: data.broadcastNetwork || 'Kisan Mitra Hyperlocal Cell + Krishi Seva Kendra SMS Gateway',
        });
        setSuccessNotice(
          `Outbreak broadcasted! ${farmersWarned} neighboring farmers within ${broadcastRadius} km alerted with preventive barrier instructions.`
        );
        setTimeout(() => setSuccessNotice(''), 7000);
        
        // Reset inputs
        setNewDisease('');
        setNewSymptoms('');
      }
    } catch (err) {
      console.error('Report submission failed', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleShareOnWhatsApp = (report: OutbreakReport) => {
    const cropDisp = getCropName(report.crop, currentLanguage?.code);
    const diseaseDisp = getDiseaseName(report.disease, currentLanguage?.code);
    const text = `🚨 *KISAN MITRA CROP OUTBREAK ALERT* 🚨\n\n` +
      `⚠️ *Pest/Disease:* ${diseaseDisp}\n` +
      `🌱 *Crop Affected:* ${cropDisp}\n` +
      `📍 *Location:* ${report.village} (~${report.distanceKm} km away)\n` +
      `🌾 *Area Affected:* ${report.affectedAcres} Acres\n` +
      `🌬️ *Spore/Vector Drift:* ${report.sporeDriftDirection || 'Carried by prevailing winds'}\n\n` +
      `🛡️ *PREVENTIVE SHIELD ACTION:*\n` +
      `${report.preventionSpray}\n\n` +
      `⚠️ Apply protective spray within 24-48 hours before spores reach your crops!`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const highSeverityCount = reports.filter((r) => r.severity === 'high').length;
  const nearestOutbreak = reports.length > 0 ? reports[0] : null;

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-red-900 via-rose-950 to-amber-950 text-white rounded-3xl p-6 sm:p-7 shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-red-500/30 text-red-200 border border-red-400/30">
                Hyperlocal Outbreak Radar
              </span>
              <span className="text-xs text-red-200">One Farmer Warns All • Community Early Warning</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Hyperlocal Outbreak Map & Spore Spread Warning
            </h2>
            <p className="text-xs sm:text-sm text-red-100 max-w-2xl leading-relaxed">
              When one farmer spots an infestation, spores and vector insects migrate downwind within <strong>24 to 48 hours</strong>. 
              View the real-time community danger map, calculate preventive barrier sprays, and broadcast new sightings to warn nearby farmers before it spreads.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="px-5 py-3.5 bg-white hover:bg-red-50 text-red-950 font-black text-xs sm:text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ring-2 ring-white/40"
            >
              <AlertTriangle className="w-4 h-4 text-red-700" />
              <span>🚨 Report & Warn Nearby Farmers</span>
            </button>
          </div>
        </div>

        {/* Ambient watermark */}
        <Radio className="absolute -right-8 -bottom-8 w-44 h-44 text-white/5 pointer-events-none" />
      </div>

      {/* Success Notification */}
      {successNotice && (
        <div className="bg-emerald-50 border-2 border-emerald-500/40 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-900 text-sm font-bold shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <p>{successNotice}</p>
              {broadcastStats && (
                <p className="text-xs text-emerald-700 font-medium mt-0.5">
                  Network: {broadcastStats.network}
                </p>
              )}
            </div>
          </div>
          {selectedOutbreak && (
            <button
              onClick={() => handleShareOnWhatsApp(selectedOutbreak)}
              className="px-3 py-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-black rounded-xl flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share to Village WhatsApp Group</span>
            </button>
          )}
        </div>
      )}

      {/* Key Metric Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-3.5 border border-gray-200 shadow-2xs">
          <span className="text-[11px] font-bold text-gray-500 uppercase">Active Outbreaks</span>
          <p className="text-xl font-black text-gray-900 mt-0.5">{reports.length} Zones</p>
          <span className="text-[10px] text-red-600 font-semibold">{highSeverityCount} High Priority</span>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-gray-200 shadow-2xs">
          <span className="text-[11px] font-bold text-gray-500 uppercase">Nearest Threat</span>
          <p className="text-xl font-black text-red-700 mt-0.5">
            {nearestOutbreak ? `${nearestOutbreak.distanceKm} km` : 'Safe'}
          </p>
          <span className="text-[10px] text-gray-600 font-semibold truncate block">
            {nearestOutbreak ? nearestOutbreak.village : 'No nearby threat'}
          </span>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-gray-200 shadow-2xs">
          <span className="text-[11px] font-bold text-gray-500 uppercase">Wind Vector</span>
          <p className="text-xl font-black text-sky-700 mt-0.5 flex items-center gap-1">
            <Wind className="w-4 h-4 text-sky-500" /> 14 km/h
          </p>
          <span className="text-[10px] text-gray-600 font-semibold">WSW → Spore Drift East</span>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-gray-200 shadow-2xs">
          <span className="text-[11px] font-bold text-gray-500 uppercase">Farmers Warned</span>
          <p className="text-xl font-black text-emerald-700 mt-0.5">277 Farmers</p>
          <span className="text-[10px] text-emerald-600 font-semibold">Across 5 Village Shivars</span>
        </div>
      </div>

      {/* Filter and View Controls */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Crop Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          <span className="text-xs font-bold text-gray-500 uppercase shrink-0 mr-1">
            {formatBilingual('Filter Crop', 'filterCrop', currentLanguage?.code)}:
          </span>
          {['all', 'Maize', 'Cotton', 'Tomato', 'Paddy', 'Chilli'].map((crop) => (
            <button
              key={crop}
              onClick={() => setSelectedCrop(crop)}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all shrink-0 cursor-pointer ${
                selectedCrop === crop
                  ? 'bg-red-800 text-white border-red-800 shadow-2xs'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {crop === 'all'
                ? formatBilingual('All Crops', 'allCrops', currentLanguage?.code)
                : getCropName(crop, currentLanguage?.code)}
            </button>
          ))}
        </div>

        {/* View Mode & Radius Selector */}
        <div className="flex items-center gap-3">
          {/* Radius Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-gray-500 uppercase">Radius:</span>
            {[5, 15, 25, 50].map((rad) => (
              <button
                key={rad}
                onClick={() => setSelectedRadius(rad)}
                className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  selectedRadius === rad
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {rad} km
              </button>
            ))}
          </div>

          {/* View Mode Switcher */}
          <div className="bg-gray-100 rounded-xl p-1 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'split' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Map + List</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'map' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>Map Only</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'list' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List Only</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary Map View Container */}
      {(viewMode === 'map' || viewMode === 'split') && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <Map className="w-4 h-4 text-emerald-700" />
              Interactive Community Outbreak Map
            </h3>
            <span className="text-xs text-gray-500">
              Center: <strong>Your Farm</strong> • Click any marker to view preventive barrier spray
            </span>
          </div>

          <InteractiveOutbreakMap
            reports={reports}
            selectedOutbreak={selectedOutbreak}
            onSelectOutbreak={(rep) => setSelectedOutbreak(rep)}
            selectedRadius={selectedRadius}
            userDistrict={userDistrict}
            onReportClick={() => setIsReportModalOpen(true)}
            currentLanguage={currentLanguage}
          />
        </div>
      )}

      {/* Main Grid: Outbreak List + Detail / Preventive Shield Protocol */}
      {(viewMode === 'list' || viewMode === 'split') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Left Column: Outbreak List (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-600" />
                Village Outbreak Reports ({reports.length})
              </h3>
              {highSeverityCount > 0 && (
                <span className="text-[11px] font-black bg-red-100 text-red-800 px-2 py-0.5 rounded-md">
                  {highSeverityCount} High Priority
                </span>
              )}
            </div>

            <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
              {reports.map((report) => {
                const isSelected = selectedOutbreak?.id === report.id;
                const isHigh = report.severity === 'high';
                return (
                  <div
                    key={report.id}
                    onClick={() => setSelectedOutbreak(report)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'bg-red-50/80 border-red-400 shadow-sm ring-2 ring-red-500/20'
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-gray-800 bg-gray-100 px-2.5 py-0.5 rounded-md">
                        {getCropName(report.crop, currentLanguage?.code)}
                      </span>
                      <span
                        className={`text-[11px] font-black uppercase px-2 py-0.5 rounded-md ${
                          isHigh ? 'bg-red-600 text-white' : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {report.severity === 'high' ? 'High Alert' : 'Moderate'}
                      </span>
                    </div>

                    <h4 className="text-sm sm:text-base font-black text-gray-900 mt-2 line-clamp-1">
                      {getDiseaseName(report.disease, currentLanguage?.code)}
                    </h4>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-2">
                      <span className="flex items-center gap-1 font-semibold text-gray-700">
                        <MapPin className="w-3.5 h-3.5 text-red-600" />
                        {report.village} ({report.distanceKm} km away)
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {report.reportedAt}
                      </span>
                      <span className="flex items-center gap-1 font-medium text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                        {report.affectedAcres} Acres
                      </span>
                    </div>

                    {report.farmersAlertedCount && (
                      <div className="mt-2 text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{report.farmersAlertedCount} neighboring farmers alerted in this zone</span>
                      </div>
                    )}
                  </div>
                );
              })}

              {reports.length === 0 && (
                <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-300 text-gray-500 text-sm">
                  No active disease outbreaks reported within {selectedRadius} km for this crop filter.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Outbreak Detail & Precautionary Advisory (7 cols) */}
          <div className="lg:col-span-7">
            {selectedOutbreak ? (
              <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-5">
                
                {/* Top Banner */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-red-700">
                      Outbreak Intel • {selectedOutbreak.distanceKm} km from your field
                    </span>
                    <h3 className="text-xl font-black text-gray-900 mt-0.5">
                      {getDiseaseName(selectedOutbreak.disease, currentLanguage?.code)}
                    </h3>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Target Crop: <strong>{getCropName(selectedOutbreak.crop, currentLanguage?.code)}</strong> • Reported by {selectedOutbreak.reporterFarmer} ({selectedOutbreak.reportedAt})
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold uppercase text-gray-500">Threat Distance</span>
                    <p className="text-2xl font-black text-red-700">{selectedOutbreak.distanceKm} km</p>
                  </div>
                </div>

                {/* Spore Drift & Threat ETA Meter */}
                <div className="bg-gradient-to-r from-slate-900 to-gray-900 rounded-2xl p-4 text-white border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Wind className="w-3.5 h-3.5" /> Spore & Pest Migration Vector
                    </span>
                    <p className="text-xs sm:text-sm font-semibold text-slate-200">
                      {selectedOutbreak.sporeDriftDirection || 'Dispersing downwind towards adjacent farms'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Wind Speed: {selectedOutbreak.windSpeedKmH || 14} km/h • Direction: {selectedOutbreak.windDirection || 'WSW'}
                    </p>
                  </div>

                  <div className="bg-slate-800 px-3.5 py-2 rounded-xl text-center shrink-0 border border-slate-700">
                    <span className="text-[10px] font-bold text-amber-300 uppercase">Estimated Spore Arrival</span>
                    <p className="text-lg font-black text-white">
                      ~{selectedOutbreak.estimatedSporeArrivalHours || Math.round(selectedOutbreak.distanceKm * 2)} Hours
                    </p>
                  </div>
                </div>

                {/* Field Symptoms Observed */}
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 text-xs text-gray-800 space-y-1">
                  <p className="font-bold text-gray-900 uppercase tracking-wider text-[11px]">
                    Observed Infestation Signature:
                  </p>
                  <p className="leading-relaxed">{selectedOutbreak.symptomSummary}</p>
                </div>

                {/* Protective Action Recommendation (Prophylactic Barrier Spray) */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-900 font-black text-sm">
                    <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
                    <span>Precautionary Barrier Spray for Neighboring Fields</span>
                  </div>
                  <p className="text-xs sm:text-sm text-emerald-950 font-bold leading-relaxed bg-white/70 p-3 rounded-xl border border-emerald-200/60">
                    {selectedOutbreak.preventionSpray}
                  </p>
                  <p className="text-[11px] text-emerald-800 font-medium">
                    Apply prophylactic spray within 24 to 48 hours to create a chemical/biological shield before vector insects migrate across village boundaries.
                  </p>

                  {/* Actions for this Outbreak */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {onOpenCalculator && (
                      <button
                        type="button"
                        onClick={() =>
                          onOpenCalculator({
                            chemicalName: selectedOutbreak.preventionSpray,
                            cropName: getCropName(selectedOutbreak.crop, currentLanguage?.code),
                            dosagePerLiter: 1.5,
                          })
                        }
                        className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-black rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Calculator className="w-3.5 h-3.5 text-amber-300" />
                        <span>Calculate Spray Tanks for this Shield</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleShareOnWhatsApp(selectedOutbreak)}
                      className="px-3.5 py-2 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-black rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5 text-white" />
                      <span>Warn Village WhatsApp Group</span>
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-white rounded-3xl p-10 text-center border border-gray-200 text-gray-500 space-y-2">
                <MapPin className="w-8 h-8 text-gray-400 mx-auto" />
                <p className="font-bold text-gray-700">Select an outbreak from the map or list</p>
                <p className="text-xs text-gray-500">
                  View spore flight vector, community reach, and protective shield spray protocols.
                </p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Modal: Report Sighting & Warn Nearby Farmers */}
      {isReportModalOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex justify-center items-start sm:items-center p-3 sm:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsReportModalOpen(false);
            }
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-red-200 space-y-4 my-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-red-700 bg-red-100 px-2 py-0.5 rounded">
                  One Farmer Warns All
                </span>
                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2 mt-1">
                  <AlertOctagon className="w-5 h-5 text-red-600" />
                  Report Disease & Warn Nearby Farmers
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 font-bold transition-colors cursor-pointer"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-600">
              When you submit, your sighting is immediately plotted on the Hyperlocal Outbreak Map and broadcasts an automated alert to registered farmers in neighboring fields so they can spray preventive barriers before spores spread.
            </p>

            <form onSubmit={handleSubmitReport} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Crop</label>
                  <input
                    type="text"
                    required
                    value={newCrop}
                    onChange={(e) => setNewCrop(e.target.value)}
                    placeholder="e.g. Tomato, Cotton, Maize"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Village / Shivar</label>
                  <input
                    type="text"
                    required
                    value={newVillage}
                    onChange={(e) => setNewVillage(e.target.value)}
                    placeholder="e.g. Pimpalgaon, Vani Shivar"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Suspected Disease / Pest</label>
                <input
                  type="text"
                  required
                  value={newDisease}
                  onChange={(e) => setNewDisease(e.target.value)}
                  placeholder="e.g. Fall Armyworm, Late Blight, Pink Bollworm"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Affected Area (Acres)</label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    required
                    value={newAcres}
                    onChange={(e) => setNewAcres(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Broadcast Radius</label>
                  <select
                    value={broadcastRadius}
                    onChange={(e) => setBroadcastRadius(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-500 bg-white"
                  >
                    <option value={5}>5 km (~25 farmers)</option>
                    <option value={15}>15 km (~60 farmers)</option>
                    <option value={25}>25 km (~120 farmers)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Observed Symptoms / Damage</label>
                <textarea
                  rows={2}
                  required
                  value={newSymptoms}
                  onChange={(e) => setNewSymptoms(e.target.value)}
                  placeholder="e.g. Ragged leaf holes on top shoots; larvae spotted inside whorl."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Recommended Barrier Spray (Optional)
                </label>
                <input
                  type="text"
                  value={newPreventionSpray}
                  onChange={(e) => setNewPreventionSpray(e.target.value)}
                  placeholder="e.g. Emamectin Benzoate 5% SG @ 0.4 g/L or Neem Oil 10000 ppm"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Broadcast Reach Preview */}
              <div className="bg-red-50 rounded-xl p-3 border border-red-200 text-xs text-red-950 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-red-900">
                  <Send className="w-3.5 h-3.5" />
                  <span>Early Warning Broadcast Reach:</span>
                </div>
                <p className="text-[11px] text-red-800">
                  Will alert ~{Math.round(broadcastRadius * 3.8)} registered farmers in your sector via SMS Gateway &amp; Krishi Seva Kendra network.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white font-black rounded-xl shadow-md text-xs sm:text-sm cursor-pointer transition-colors flex items-center justify-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-300" />
                  <span>{submitting ? 'Broadcasting Warning to Farmers...' : '🚨 Broadcast Warning to Neighboring Farmers'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
