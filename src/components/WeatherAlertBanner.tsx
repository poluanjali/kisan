import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Wind,
  CloudRain,
  AlertTriangle,
  Volume2,
  X,
  ChevronRight,
  MapPin,
  Compass,
  RefreshCw,
  Sparkles,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  SlidersHorizontal,
  Search,
} from 'lucide-react';
import { WeatherAlertData, RegionalLanguage } from '../types';
import { speakRegionalText, stopSpeech } from '../utils/speech';
import { formatBilingual, resolveBilingualString, cleanEnglishText } from '../utils/translations';

interface WeatherAlertBannerProps {
  currentLanguage: RegionalLanguage;
  district: string;
  onDistrictChange: (district: string) => void;
  onNavigateToWeather: () => void;
  simulationMode?: string;
  onSimulationModeChange?: (mode: string) => void;
}

const DISTRICT_LIST = [
  { name: 'Nashik / Deccan Belt', state: 'Maharashtra' },
  { name: 'Guntur / Krishna Delta', state: 'Andhra Pradesh' },
  { name: 'Warangal / North Telangana', state: 'Telangana' },
  { name: 'Bathinda / Malwa Punjab', state: 'Punjab' },
  { name: 'Karnal / GT Road Belt', state: 'Haryana' },
  { name: 'Indore / Malwa Region', state: 'Madhya Pradesh' },
  { name: 'Kolar / Southern Plateau', state: 'Karnataka' },
  { name: 'Agra / Yamuna Plains', state: 'Uttar Pradesh' },
  { name: 'Thanjavur / Cauvery Delta', state: 'Tamil Nadu' },
  { name: 'Shimla / Apple Belt', state: 'Himachal Pradesh' },
  { name: 'Pune / Western Ghats', state: 'Maharashtra' },
  { name: 'Nagpur / Vidarbha Belt', state: 'Maharashtra' },
  { name: 'Jaipur / Shekhawati', state: 'Rajasthan' },
  { name: 'Patna / Gangetic Plains', state: 'Bihar' },
  { name: 'Ludhiana / Central Punjab', state: 'Punjab' },
];

export const WeatherAlertBanner: React.FC<WeatherAlertBannerProps> = ({
  currentLanguage,
  district,
  onDistrictChange,
  onNavigateToWeather,
  simulationMode: externalSimMode,
  onSimulationModeChange,
}) => {
  const [alertData, setAlertData] = useState<WeatherAlertData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [showLocationSelector, setShowLocationSelector] = useState<boolean>(false);
  const [showSimControls, setShowSimControls] = useState<boolean>(false);
  const [internalSimMode, setInternalSimMode] = useState<string>('live');
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Search state for custom district/village
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Array<{ name: string; displayName: string; latitude: number; longitude: number }>>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const simulationMode = externalSimMode ?? internalSimMode;
  const setSimulationMode = (mode: string) => {
    setInternalSimMode(mode);
    onSimulationModeChange?.(mode);
  };

  const fetchWeatherAlert = useCallback(
    async (distName: string, simMode?: string, coords?: { lat: number; lon: number } | null) => {
      setLoading(true);
      try {
        let url = `/api/weather-alert?district=${encodeURIComponent(distName)}`;
        if (coords) {
          url += `&lat=${coords.lat}&lon=${coords.lon}`;
        }
        if (simMode && simMode !== 'live') {
          url += `&simulateAlert=${encodeURIComponent(simMode)}`;
        }
        const res = await fetch(url);
        const data = await res.json();
        if (data.success && data.alert) {
          setAlertData(data.alert);
          if (data.alert.hasAlert) {
            setIsDismissed(false);
          }
        }
      } catch (err) {
        console.warn('Weather alert banner fetch error:', err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchWeatherAlert(district, simulationMode, gpsCoords);
  }, [district, simulationMode, gpsCoords, fetchWeatherAlert]);

  // Handle location search query debounced
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search-location?query=${encodeURIComponent(searchQuery.trim())}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.results)) {
          setSearchResults(data.results);
        }
      } catch (_) {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 280);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Request browser GPS location
  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setGpsCoords(coords);
        setGpsLoading(false);
        const gpsLabel = `Farm GPS (${coords.lat.toFixed(2)}°N, ${coords.lon.toFixed(2)}°E)`;
        onDistrictChange(gpsLabel);
        try {
          localStorage.setItem('kisan_farm_district', gpsLabel);
          localStorage.setItem('kisan_farm_coords', JSON.stringify(coords));
        } catch (_) {}
        fetchWeatherAlert(gpsLabel, simulationMode, coords);
        setShowLocationSelector(false);
      },
      (err) => {
        console.warn('GPS location error:', err);
        setGpsLoading(false);
      },
      { timeout: 8000, maximumAge: 60000 }
    );
  };

  const handleSelectDistrict = (name: string, coords?: { lat: number; lon: number }) => {
    onDistrictChange(name);
    try {
      localStorage.setItem('kisan_farm_district', name);
    } catch (_) {}
    if (coords) {
      setGpsCoords(coords);
    } else {
      setGpsCoords(null);
    }
    setSearchQuery('');
    setSearchResults([]);
    setShowLocationSelector(false);
  };

  // Speak alert audio in regional language (toggle on/off)
  const handleSpeakAlert = () => {
    if (!alertData) return;

    if (isSpeaking) {
      stopSpeech();
      setIsSpeaking(false);
      return;
    }

    const lang = currentLanguage.code.toLowerCase().split('-')[0];
    const spokenDistrict = alertData.district.startsWith('Farm GPS')
      ? (lang === 'te' ? 'మీ పొలం ప్రాంతంలో' : lang === 'ta' ? 'உங்கள் பண்ணை பகுதியில்' : lang === 'hi' ? 'आपके खेत के क्षेत्र में' : 'in your farm area')
      : alertData.district.split('/')[0].trim();

    let text = '';

    if (alertData.alertType === 'wind') {
      if (lang === 'te') {
        text = `హెచ్చరిక: ${spokenDistrict} ప్రాంతంలో గాలి వేగం గంటకు ${alertData.windSpeedKmH} కిలోమీటర్లు. పురుగుమందుల పిచికారీని వెంటనే ఆపండి.`;
      } else if (lang === 'ta') {
        text = `எச்சரிக்கை: ${spokenDistrict} பகுதியில் காற்றின் வேகம் மணிக்கு ${alertData.windSpeedKmH} கிலோமீட்டர். மருந்து தெளிப்பதை உடனடியாக நிறுத்துங்கள்.`;
      } else if (lang === 'hi') {
        text = `मौसम चेतावनी: ${spokenDistrict} में ${alertData.windSpeedKmH} किलोमीटर प्रति घंटे की तेज हवाएं चल रही हैं। कीटनाशक छिड़काव तुरंत रोकें ताकि दवा बहने से नुकसान न हो।`;
      } else {
        text = `Weather Alert: High winds of ${alertData.windSpeedKmH} kilometers per hour in ${spokenDistrict}. Suspend all chemical spraying immediately to avoid drift loss.`;
      }
    } else if (alertData.alertType === 'rain') {
      if (lang === 'te') {
        text = `భారీ వర్ష హెచ్చరిక: ${spokenDistrict} లో రాబోయే 6 గంటల్లో ${alertData.rainChanceNext6h} శాతం వర్షం వచ్చే అవకాశం ఉంది. మందుల పిచికారీని వాయిదా వేయండి.`;
      } else if (lang === 'ta') {
        text = `கனமழை எச்சரிக்கை: ${spokenDistrict} பகுதியில் அடுத்த 6 மணி நேரத்தில் ${alertData.rainChanceNext6h} சதவீதம் மழை வாய்ப்பு உள்ளது. மருந்து தெளிப்பதை தள்ளி வைக்கவும்.`;
      } else if (lang === 'hi') {
        text = `भारी बारिश चेतावनी: ${spokenDistrict} में अगले 6 घंटों में ${alertData.rainChanceNext6h} प्रतिशत बारिश का खतरा है। छिड़काव स्थगित रखें ताकि दवा बह न जाए।`;
      } else {
        text = `Heavy Rain Warning: ${alertData.rainChanceNext6h} percent precipitation probability in ${spokenDistrict}. Delay foliar spraying to prevent wash-off.`;
      }
    } else if (alertData.alertType === 'both') {
      if (lang === 'hi') {
        text = `गंभीर मौसम चेतावनी: ${spokenDistrict} में ${alertData.windSpeedKmH} किलोमीटर प्रति घंटा की तेज आंधी और ${alertData.rainChanceNext6h} प्रतिशत भारी बारिश का अनुमान है। खेत का छिड़काव तुरंत बंद करें।`;
      } else if (lang === 'te') {
        text = `తీవ్ర వాతావరణ హెచ్చరిక: ${spokenDistrict} లో గాలి వేగం గంటకు ${alertData.windSpeedKmH} కిలోమీటర్లు మరియు ${alertData.rainChanceNext6h} శాతం భారీ వర్షం ఉంది. పిచికారీని వెంటనే ఆపండి.`;
      } else if (lang === 'ta') {
        text = `தீவிர வானிலை எச்சரிக்கை: ${spokenDistrict} பகுதியில் காற்றின் வேகம் ${alertData.windSpeedKmH} கிலோமீட்டர் மற்றும் ${alertData.rainChanceNext6h} சதவீத கனமழை வாய்ப்பு உள்ளது. தெளிப்பதை உடனே நிறுத்துங்கள்.`;
      } else {
        text = `Severe Weather Warning: High winds of ${alertData.windSpeedKmH} km/h and heavy rainfall forecasted in ${spokenDistrict}. Halt field spraying immediately.`;
      }
    } else {
      text = alertData.title;
    }

    setIsSpeaking(true);
    speakRegionalText(
      text,
      currentLanguage.code,
      1.0,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false),
      () => setIsSpeaking(false)
    );
  };

  // Sleek placeholder while loading so there is no layout jump
  if (!alertData) {
    return (
      <div id="global-weather-alert-bar" className="bg-emerald-950 text-emerald-200 text-xs border-b border-emerald-900 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
          <span className="font-semibold">{district}: Loading micro-weather & spray conditions...</span>
        </div>
      </div>
    );
  }

  // If there is NO active alert and user hasn't toggled demo, show compact safe status
  if (!alertData.hasAlert) {
    return (
      <div id="global-weather-alert-bar" className="bg-emerald-900 text-emerald-100 text-xs border-b border-emerald-800">
        <div className="max-w-6xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-800 text-emerald-200 font-bold text-[11px] border border-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{formatBilingual('Weather Safe', 'sprayWeather', currentLanguage.code)}</span>
            </span>
            <span className="font-semibold text-white truncate">
              {alertData.district}: {alertData.windSpeedKmH} km/h wind • {alertData.rainChanceNext6h}% rain
            </span>
            <span className="hidden sm:inline text-emerald-300">
              • {formatBilingual('Safe for spraying', 'safeToSpray', currentLanguage.code)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Location / Search / GPS Trigger */}
            <button
              type="button"
              onClick={() => {
                setShowLocationSelector(!showLocationSelector);
                if (showSimControls) setShowSimControls(false);
              }}
              title="Change region, search village or use GPS"
              className="px-2 py-1 rounded-lg bg-emerald-800/80 hover:bg-emerald-700 text-emerald-200 text-[11px] font-bold flex items-center gap-1 transition"
            >
              <MapPin className="w-3 h-3 text-amber-300" />
              <span className="max-w-[110px] truncate">{district}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showLocationSelector ? 'rotate-180' : ''}`} />
            </button>

            {/* Test Simulation Controls Trigger */}
            <button
              type="button"
              onClick={() => {
                setShowSimControls(!showSimControls);
                if (showLocationSelector) setShowLocationSelector(false);
              }}
              title="Test Severe Weather Alerts (High Wind / Heavy Rain)"
              className="px-2 py-1 rounded-lg bg-emerald-800/80 hover:bg-emerald-700 text-emerald-200 text-[11px] font-bold flex items-center gap-1 transition"
            >
              <SlidersHorizontal className="w-3 h-3 text-amber-300" />
              <span>Simulate Alert</span>
            </button>
          </div>
        </div>

        {/* Location Selector Drawer in Compact Bar */}
        {showLocationSelector && (
          <div className="bg-emerald-950 px-4 py-3 border-t border-emerald-800 space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-emerald-200 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-300" />
                <span>Search Farm Location or Use Auto-GPS</span>
              </span>

              {/* GPS Auto-Detect Button */}
              <button
                type="button"
                onClick={handleDetectGps}
                disabled={gpsLoading}
                className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs disabled:opacity-50"
              >
                <Compass className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
                <span>{gpsLoading ? 'Locating...' : '📍 Auto-Detect Farm GPS'}</span>
              </button>
            </div>

            {/* Live Search Input */}
            <div className="relative">
              <div className="flex items-center gap-2 bg-emerald-900/90 border border-emerald-700 rounded-xl px-3 py-1.5 text-xs text-white">
                <Search className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search any town, taluka or district (e.g. Pune, Akola, Guntur, Meerut, Kurnool)..."
                  className="bg-transparent border-none outline-none text-xs text-white placeholder:text-emerald-400/70 w-full"
                />
                {isSearching && <RefreshCw className="w-3 h-3 text-amber-300 animate-spin shrink-0" />}
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="text-emerald-300 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Search Results Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-stone-900 border border-stone-700 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-stone-800">
                  {searchResults.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectDistrict(item.displayName, { lat: item.latitude, lon: item.longitude })}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-emerald-900 text-stone-200 hover:text-white flex items-center justify-between"
                    >
                      <span className="font-bold">{item.displayName}</span>
                      <span className="text-[10px] text-stone-400 font-mono">
                        {item.latitude.toFixed(2)}°N, {item.longitude.toFixed(2)}°E
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Agricultural District Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-xs">
              {DISTRICT_LIST.map((d) => (
                <button
                  key={d.name}
                  type="button"
                  onClick={() => handleSelectDistrict(d.name)}
                  className={`px-2.5 py-1.5 rounded-xl font-bold text-left truncate transition ${
                    district === d.name
                      ? 'bg-amber-400 text-stone-950 shadow-xs'
                      : 'bg-emerald-900/60 hover:bg-emerald-800/80 text-emerald-100'
                  }`}
                >
                  <div className="truncate font-extrabold text-[11px]">{d.name}</div>
                  <div className="text-[9px] opacity-75">{d.state}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Simulation Bar Expansion */}
        {showSimControls && (
          <div className="bg-emerald-950 px-4 py-2 border-t border-emerald-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-emerald-300 font-medium">Test Agricultural Weather Alert Conditions:</span>
            <div className="flex items-center flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setSimulationMode('wind');
                  setShowSimControls(false);
                }}
                className="px-2.5 py-1 rounded-md bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-[11px] flex items-center gap-1 shadow-xs transition"
              >
                <Wind className="w-3 h-3" />
                <span>Simulate High Wind (&gt;25 km/h)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSimulationMode('rain');
                  setShowSimControls(false);
                }}
                className="px-2.5 py-1 rounded-md bg-sky-500 hover:bg-sky-400 text-white font-black text-[11px] flex items-center gap-1 shadow-xs transition"
              >
                <CloudRain className="w-3 h-3" />
                <span>Simulate Heavy Rain (75%)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSimulationMode('both');
                  setShowSimControls(false);
                }}
                className="px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-500 text-white font-black text-[11px] flex items-center gap-1 shadow-xs transition"
              >
                <AlertTriangle className="w-3 h-3" />
                <span>Simulate Storm (Wind + Rain)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSimulationMode('live');
                  setShowSimControls(false);
                }}
                className="px-2.5 py-1 rounded-md bg-stone-700 hover:bg-stone-600 text-stone-200 font-bold text-[11px] transition"
              >
                Reset to Live API
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ACTIVE ALERT STYLING (High Wind, Heavy Rain, or Both)
  const isWind = alertData.alertType === 'wind';
  const isRain = alertData.alertType === 'rain';
  const isBoth = alertData.alertType === 'both';

  const bannerTheme = isBoth
    ? 'bg-gradient-to-r from-red-700 via-rose-700 to-amber-800 border-red-900 text-white'
    : isWind
    ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 border-amber-800 text-white'
    : 'bg-gradient-to-r from-sky-800 via-blue-800 to-indigo-900 border-blue-950 text-white';

  // If farmer dismissed the banner, show compact persistent emergency pill
  if (isDismissed) {
    return (
      <div id="global-weather-alert-bar" className="bg-amber-950 text-amber-100 text-xs border-b border-amber-900 px-4 py-1.5 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span className="font-black text-amber-200 uppercase tracking-wide text-[11px]">
              {isWind ? 'High Wind Alert' : isRain ? 'Heavy Rain Warning' : 'Severe Weather'} Active:
            </span>
            <span className="truncate text-white font-semibold">
              {alertData.district} ({isWind ? `${alertData.windSpeedKmH} km/h wind` : `${alertData.rainChanceNext6h}% rain risk`})
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsDismissed(false)}
              className="text-amber-200 hover:text-white font-bold underline text-xs"
            >
              Expand Warning
            </button>
            <button
              type="button"
              onClick={onNavigateToWeather}
              className="px-2 py-0.5 rounded-md bg-amber-500 text-stone-950 font-black text-[10px] hover:bg-amber-400 transition"
            >
              View Radar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id="global-weather-alert-bar"
      role="alert"
      aria-live="assertive"
      className={`border-b-2 shadow-md relative z-50 transition-colors ${bannerTheme}`}
    >
      <div className="max-w-6xl mx-auto px-4 py-3 sm:py-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Main Warning Header & Message */}
          <div className="flex items-start gap-3 flex-1">
            {/* Animated Icon Container */}
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-black/25 backdrop-blur-xs flex items-center justify-center font-bold shrink-0 shadow-inner mt-0.5">
              {isWind ? (
                <Wind className="w-6 h-6 text-amber-200 animate-pulse" />
              ) : isRain ? (
                <CloudRain className="w-6 h-6 text-sky-200 animate-bounce" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-amber-300 animate-pulse" />
              )}
            </div>

            <div className="space-y-1 flex-1 min-w-0">
              {/* Category Badges & Region */}
              <div className="flex items-center flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs font-black text-[11px] uppercase tracking-wider text-white border border-white/30">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>
                    {isWind
                      ? formatBilingual('High Wind Warning', 'highWindAlert', currentLanguage.code)
                      : isRain
                      ? formatBilingual('Heavy Rain Warning', 'heavyRainAlert', currentLanguage.code)
                      : formatBilingual('Severe Storm Hazard', 'weatherAlert', currentLanguage.code)}
                  </span>
                </span>

                {/* Specific Threshold Metric Chip */}
                {isWind && (
                  <span className="px-2 py-0.5 rounded-full bg-black/30 font-black text-[11px] text-amber-200 border border-amber-300/40">
                    Wind: {alertData.windSpeedKmH} km/h (Gusts {alertData.windGustsKmH} km/h)
                  </span>
                )}
                {isRain && (
                  <span className="px-2 py-0.5 rounded-full bg-black/30 font-black text-[11px] text-sky-200 border border-sky-300/40">
                    Rain Chance: {alertData.rainChanceNext6h}% {alertData.rainfallMm ? `(${alertData.rainfallMm}mm)` : ''}
                  </span>
                )}

                {/* Region Tag */}
                <button
                  type="button"
                  onClick={() => setShowLocationSelector(!showLocationSelector)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-white/90 hover:text-white bg-black/20 hover:bg-black/30 px-2 py-0.5 rounded-lg border border-white/20 transition cursor-pointer"
                  title="Click to change your farming region"
                >
                  <MapPin className="w-3 h-3 text-amber-300 shrink-0" />
                  <span className="truncate max-w-[140px] sm:max-w-none">{alertData.district}</span>
                  <ChevronDown className="w-3 h-3 ml-0.5 opacity-70" />
                </button>
              </div>

              {/* Warning Headline */}
              <h2 className="text-sm sm:text-base font-black text-white leading-tight tracking-tight">
                {currentLanguage.code.toLowerCase().startsWith('en')
                  ? cleanEnglishText(alertData.title)
                  : currentLanguage.code.toLowerCase().startsWith('hi') && alertData.titleHindi
                  ? alertData.titleHindi
                  : resolveBilingualString(alertData.title, currentLanguage.code)}
              </h2>

              {/* Recommended Field Action */}
              <p className="text-xs sm:text-sm text-white/95 leading-relaxed font-medium">
                <span className="font-extrabold text-amber-200">
                  {formatBilingual('Farm Action Required:', 'fieldAdvisoryTitle', currentLanguage.code)}{' '}
                </span>
                {currentLanguage.code.toLowerCase().startsWith('en')
                  ? cleanEnglishText(alertData.recommendedAction)
                  : currentLanguage.code.toLowerCase().startsWith('hi') && alertData.recommendedActionHindi
                  ? alertData.recommendedActionHindi
                  : resolveBilingualString(alertData.recommendedAction, currentLanguage.code)}
              </p>
            </div>
          </div>

          {/* Action Buttons: Listen, View Radar, Location, Dismiss */}
          <div className="flex items-center flex-wrap md:flex-col lg:flex-row justify-end gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/15">
            
            {/* 1. Regional Audio Readout */}
            <button
              id="listen-weather-alert-button"
              type="button"
              onClick={handleSpeakAlert}
              title="Listen to emergency advisory in regional language"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all border border-white/30 active:scale-95 shadow-2xs"
            >
              <Volume2 className={`w-4 h-4 ${isSpeaking ? 'text-amber-300 animate-ping' : 'text-white'}`} />
              <span>{formatBilingual('Listen Advisory', 'listenAlert', currentLanguage.code)}</span>
            </button>

            {/* 2. Jump to Safe Spray Weather Radar Details */}
            <button
              id="view-spray-radar-button"
              type="button"
              onClick={onNavigateToWeather}
              title="Open the Micro-Weather & Safe Spray Window Radar"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white text-stone-900 hover:bg-amber-100 text-xs font-black transition-all shadow-sm active:scale-95"
            >
              <span>{formatBilingual('View Radar', 'viewWeatherDetails', currentLanguage.code)}</span>
              <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
            </button>

            {/* 3. Dismiss button */}
            <button
              id="dismiss-weather-alert-button"
              type="button"
              onClick={() => setIsDismissed(true)}
              title="Acknowledge and minimize alert banner"
              className="p-1.5 rounded-xl bg-black/20 hover:bg-black/30 text-white/90 hover:text-white transition-colors"
              aria-label="Dismiss alert banner"
            >
              <X className="w-4 h-4" />
            </button>

          </div>

        </div>

        {/* Location Dropdown Modal / Drawer */}
        <AnimatePresence>
          {showLocationSelector && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 pt-3 border-t border-white/20 overflow-hidden"
            >
              <div className="bg-black/30 backdrop-blur-md p-3 rounded-2xl border border-white/20 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-300" />
                    <span>{formatBilingual('Select Your Agricultural Region or Detect GPS', 'changeRegion', currentLanguage.code)}</span>
                  </span>
                  
                  {/* GPS Detect Button */}
                  <button
                    type="button"
                    onClick={handleDetectGps}
                    disabled={gpsLoading}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold transition shadow-2xs disabled:opacity-50"
                  >
                    <Compass className={`w-3 h-3 ${gpsLoading ? 'animate-spin' : ''}`} />
                    <span>{gpsLoading ? 'Locating...' : '📍 Detect My Farm GPS'}</span>
                  </button>
                </div>

                {/* Live Search Input */}
                <div className="relative">
                  <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white">
                    <Search className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search any town, taluka or district (e.g. Pune, Akola, Guntur, Meerut)..."
                      className="bg-transparent border-none outline-none text-xs text-white placeholder:text-white/50 w-full"
                    />
                    {isSearching && <RefreshCw className="w-3 h-3 text-amber-300 animate-spin shrink-0" />}
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setSearchResults([]);
                        }}
                        className="text-white/70 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Search Results Dropdown */}
                  {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-stone-900 border border-stone-700 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-stone-800">
                      {searchResults.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectDistrict(item.displayName, { lat: item.latitude, lon: item.longitude })}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-emerald-950/80 text-stone-200 hover:text-white flex items-center justify-between"
                        >
                          <span className="font-bold">{item.displayName}</span>
                          <span className="text-[10px] text-stone-400 font-mono">
                            {item.latitude.toFixed(2)}°N, {item.longitude.toFixed(2)}°E
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* District Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-xs">
                  {DISTRICT_LIST.map((d) => (
                    <button
                      key={d.name}
                      type="button"
                      onClick={() => handleSelectDistrict(d.name)}
                      className={`px-2.5 py-1.5 rounded-xl font-bold text-left truncate transition ${
                        district === d.name
                          ? 'bg-amber-400 text-stone-950 shadow-xs'
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      <div className="truncate font-extrabold text-[11px]">{d.name}</div>
                      <div className="text-[9px] opacity-75">{d.state}</div>
                    </button>
                  ))}
                </div>

                {/* Simulation & Test Selector */}
                <div className="pt-1 flex flex-wrap items-center justify-between gap-2 text-[11px] text-white/80 border-t border-white/10">
                  <div className="flex items-center gap-1">
                    <SlidersHorizontal className="w-3 h-3 text-amber-300" />
                    <span>Testing Modes:</span>
                  </div>
                  <div className="flex items-center flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => setSimulationMode('wind')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${simulationMode === 'wind' ? 'bg-amber-300 text-stone-950' : 'bg-white/10 hover:bg-white/20'}`}
                    >
                      💨 High Wind
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimulationMode('rain')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${simulationMode === 'rain' ? 'bg-sky-300 text-stone-950' : 'bg-white/10 hover:bg-white/20'}`}
                    >
                      🌧️ Heavy Rain
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimulationMode('both')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${simulationMode === 'both' ? 'bg-rose-400 text-stone-950' : 'bg-white/10 hover:bg-white/20'}`}
                    >
                      ⚡ Both
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimulationMode('calm')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${simulationMode === 'calm' ? 'bg-emerald-300 text-stone-950' : 'bg-white/10 hover:bg-white/20'}`}
                    >
                      ☀️ Safe / Calm
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimulationMode('live')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${simulationMode === 'live' ? 'bg-white text-stone-950' : 'bg-white/10 hover:bg-white/20'}`}
                    >
                      🌐 Live Open-Meteo
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};
