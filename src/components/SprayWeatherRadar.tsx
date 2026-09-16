import React, { useState, useEffect } from 'react';
import {
  Sun,
  CloudRain,
  Wind,
  Droplets,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Compass,
  MapPin,
  Volume2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { WeatherSprayWindow, RegionalLanguage } from '../types';
import { speakRegionalText, stopSpeech } from '../utils/speech';
import { formatBilingual } from '../utils/translations';

interface SprayWeatherRadarProps {
  currentLanguage: RegionalLanguage;
  initialDistrict?: string;
  onDistrictChange?: (district: string) => void;
  simulationMode?: string;
  onSimulationModeChange?: (mode: string) => void;
}

export const SprayWeatherRadar: React.FC<SprayWeatherRadarProps> = ({
  currentLanguage,
  initialDistrict = 'Nashik / Deccan Belt',
  onDistrictChange,
  simulationMode = 'live',
  onSimulationModeChange,
}) => {
  const [district, setDistrict] = useState<string>(initialDistrict);
  const [weather, setWeather] = useState<WeatherSprayWindow | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Sync when parent initialDistrict changes
  useEffect(() => {
    if (initialDistrict && initialDistrict !== district) {
      setDistrict(initialDistrict);
    }
  }, [initialDistrict]);

  const DISTRICTS = [
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
  ];

  const fetchWeatherData = async (distName: string, simMode?: string) => {
    setLoading(true);
    try {
      let url = `/api/spray-weather?district=${encodeURIComponent(distName)}`;
      if (simMode && simMode !== 'live') {
        url += `&simulateAlert=${encodeURIComponent(simMode)}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.weather) {
        setWeather(data.weather);
      }
    } catch (err) {
      console.warn('Weather fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeatherData(district, simulationMode);
  }, [district, simulationMode]);

  const speakWeatherAdvice = () => {
    if (!weather) return;

    if (isSpeaking) {
      stopSpeech();
      setIsSpeaking(false);
      return;
    }

    const lang = currentLanguage.code.toLowerCase().split('-')[0];
    const spokenDistrict = weather.district.startsWith('Farm GPS')
      ? (lang === 'te' ? 'మీ పొలం ప్రాంతంలో' : lang === 'ta' ? 'உங்கள் பண்ணை பகுதியில்' : lang === 'hi' ? 'आपके खेत के क्षेत्र में' : 'in your farm area')
      : weather.district.split('/')[0].trim();

    let text = '';

    // If an adverse weather alert is active, speak the warning in the farmer's language
    if (weather.alert && weather.alert.hasAlert) {
      if (weather.alert.alertType === 'wind') {
        if (lang === 'te') {
          text = `హెచ్చరిక: ${spokenDistrict} లో గాలి వేగం గంటకు ${weather.windSpeedKmH} కిలోమీటర్లు. పురుగుమందుల పిచికారీని వెంటనే ఆపండి. గాలి తీవ్రత వల్ల మందు పంటపై నిలవదు.`;
        } else if (lang === 'ta') {
          text = `எச்சரிக்கை: ${spokenDistrict} பகுதியில் காற்றின் வேகம் மணிக்கு ${weather.windSpeedKmH} கிலோமீட்டர். காற்று வீசுவதால் தெளிப்பு மருந்து வீணாகும், தெளிப்பதை உடனடியாக நிறுத்துங்கள்.`;
        } else if (lang === 'hi') {
          text = `चेतावनी: ${spokenDistrict} में हवा की गति ${weather.windSpeedKmH} किलोमीटर प्रति घंटा है। कीटनाशक छिड़काव तुरंत रोकें ताकि तेज हवा में दवा उड़कर बर्बाद न हो।`;
        } else {
          text = `Advisory: High wind speed of ${weather.windSpeedKmH} km/h in ${spokenDistrict}. Avoid spraying now to prevent chemical drift and wasted pesticide.`;
        }
      } else if (weather.alert.alertType === 'rain') {
        if (lang === 'te') {
          text = `హెచ్చరిక: ${spokenDistrict} లో రాబోయే 6 గంటల్లో ${weather.rainChanceNext6h} శాతం వర్ష సూచన ఉంది. పిచికారీని వాయిదా వేయండి, లేకపోతే మందు వర్షానికి కొట్టుకుపోతుంది.`;
        } else if (lang === 'ta') {
          text = `எச்சரிக்கை: ${spokenDistrict} பகுதியில் அடுத்த 6 மணி நேரத்தில் ${weather.rainChanceNext6h} சதவீத மழை வாய்ப்பு உள்ளது. தெளித்த மருந்து மழைநீரில் அடித்துச் செல்லப்படலாம், தெளிப்பதை தள்ளிப்போடுங்கள்.`;
        } else if (lang === 'hi') {
          text = `चेतावनी: ${spokenDistrict} में अगले 6 घंटों में ${weather.rainChanceNext6h} प्रतिशत बारिश की संभावना है। छिड़काव स्थगित रखें ताकि दवा बारिश में धुल न जाए।`;
        } else {
          text = `Advisory: Heavy rain risk of ${weather.rainChanceNext6h} percent in ${spokenDistrict}. Delay foliar spraying to prevent immediate chemical wash-off.`;
        }
      } else {
        if (lang === 'hi') {
          text = `खराब मौसम चेतावनी: ${spokenDistrict} में तेज हवा और बारिश का अनुमान है। अभी किसी भी फसल पर छिड़काव न करें।`;
        } else if (lang === 'te') {
          text = `ప్రతికూల వాతావరణ హెచ్చరిక: ${spokenDistrict} లో గాలి మరియు వర్షం కారణంగా పిచికారీ చేయవద్దు.`;
        } else if (lang === 'ta') {
          text = `வானிலை எச்சரிக்கை: ${spokenDistrict} பகுதியில் மழை மற்றும் காற்று உள்ளதால் தெளிப்பதை தவிர்க்கவும்.`;
        } else {
          text = `Severe Weather Advisory: High winds and rain forecast in ${spokenDistrict}. Halt all field spraying immediately.`;
        }
      }
    } else {
      if (lang === 'te') {
        text = `${spokenDistrict}: ఈరోజు పిచికారీకి వాతావరణం అనుకూలంగా ఉంది. గాలి వేగం గంటకు ${weather.windSpeedKmH} కిలోమీటర్లు మరియు వర్షం వచ్చే అవకాశం ${weather.rainChanceNext6h} శాతం మాత్రమే. ఉదయం ఆరున్నర నుండి పది గంటల వరకు పిచికారీకి అత్యుత్తమ సమయం.`;
      } else if (lang === 'ta') {
        text = `${spokenDistrict}: இன்று தெளிப்புக்கு வானிலை சாதகமாக உள்ளது. காற்றின் வேகம் மணிக்கு ${weather.windSpeedKmH} கிலோமீட்டர், மழை வாய்ப்பு ${weather.rainChanceNext6h} சதவீதம் மட்டுமே. காலை ஆறு முப்பது முதல் பத்து மணி வரை தெளிக்க சிறந்த நேரம்.`;
      } else if (lang === 'en') {
        text = `${spokenDistrict}: Today's weather is safe for field spraying. Wind speed is ${weather.windSpeedKmH} kilometers per hour and rain probability is ${weather.rainChanceNext6h} percent. Best spraying window is 6:30 AM to 10:00 AM.`;
      } else {
        text = `${spokenDistrict}: आज का मौसम स्प्रे के लिए अनुकूल है। हवा की गति ${weather.windSpeedKmH} किलोमीटर प्रति घंटा है और बारिश की संभावना केवल ${weather.rainChanceNext6h} प्रतिशत है। सुबह छह बजकर तीस मिनट से दस बजे तक छिड़काव का सबसे अच्छा समय है।`;
      }
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

  return (
    <div id="spray-weather-radar-module" className="bg-white rounded-3xl p-5 sm:p-7 border border-emerald-100 shadow-sm space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-bold shadow-xs">
            <Sun className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
                {formatBilingual('Micro-Weather & Safe Spray Window Radar', 'sprayWeather', currentLanguage.code)}
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-950 border border-sky-300">
                Rain & Drift Guard
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium">
              {formatBilingual('Never waste expensive pesticides due to rain wash-off or high wind drift', 'weatherAdvice', currentLanguage.code)}
            </p>
          </div>
        </div>

        {/* Location Dropdown */}
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
          <select
            value={district}
            onChange={(e) => {
              setDistrict(e.target.value);
              onDistrictChange?.(e.target.value);
            }}
            className="bg-stone-50 border border-stone-200 text-stone-800 text-xs sm:text-sm font-bold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            {DISTRICTS.map((d) => (
              <option key={d.name} value={d.name}>
                {d.name} ({d.state})
              </option>
            ))}
          </select>
        </div>
      </div>

      {weather && (
        <div className="space-y-5">

          {/* Active Adverse Weather Warning Notice if Alert is Present */}
          {weather.alert && weather.alert.hasAlert && (
            <div
              className={`p-4 rounded-2xl border-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs ${
                weather.alert.alertType === 'both' || weather.alert.severity === 'severe'
                  ? 'bg-red-50 border-red-500 text-red-950'
                  : weather.alert.alertType === 'wind'
                  ? 'bg-amber-50 border-amber-500 text-amber-950'
                  : 'bg-sky-50 border-sky-500 text-sky-950'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-black ${
                    weather.alert.alertType === 'wind'
                      ? 'bg-amber-500 text-white'
                      : weather.alert.alertType === 'rain'
                      ? 'bg-sky-600 text-white'
                      : 'bg-red-600 text-white'
                  }`}
                >
                  {weather.alert.alertType === 'wind' ? (
                    <Wind className="w-5 h-5" />
                  ) : weather.alert.alertType === 'rain' ? (
                    <CloudRain className="w-5 h-5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white/90 border border-black/10">
                      Active Weather Warning
                    </span>
                    <span className="text-xs font-black">
                      {currentLanguage.code.startsWith('hi') && weather.alert.titleHindi
                        ? weather.alert.titleHindi
                        : weather.alert.title}
                    </span>
                  </div>
                  <p className="text-xs mt-0.5 font-medium opacity-90">
                    <span className="font-bold">Required Precaution: </span>
                    {currentLanguage.code.startsWith('hi') && weather.alert.recommendedActionHindi
                      ? weather.alert.recommendedActionHindi
                      : weather.alert.recommendedAction}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={speakWeatherAdvice}
                className="px-3 py-1.5 rounded-xl bg-white text-stone-900 font-black text-xs hover:bg-stone-100 shadow-2xs border border-stone-300 flex items-center gap-1.5 shrink-0 self-end sm:self-center"
              >
                <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? 'text-amber-500 animate-pulse' : 'text-stone-700'}`} />
                <span>{isSpeaking ? 'Speaking...' : 'Listen Warning'}</span>
              </button>
            </div>
          )}
          
          {/* Main Spray Suitability Verdict Banner */}
          <div
            className={`p-5 rounded-2xl border-2 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
              weather.spraySuitability === 'optimal'
                ? 'bg-emerald-50/90 border-emerald-500 text-emerald-950'
                : weather.spraySuitability === 'moderate'
                ? 'bg-amber-50/90 border-amber-400 text-amber-950'
                : 'bg-red-50/90 border-red-400 text-red-950'
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black shrink-0 ${
                  weather.spraySuitability === 'optimal'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : weather.spraySuitability === 'moderate'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-red-600 text-white shadow-sm'
                }`}
              >
                {weather.spraySuitability === 'optimal' ? (
                  <CheckCircle2 className="w-7 h-7" />
                ) : (
                  <AlertTriangle className="w-7 h-7" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                      weather.spraySuitability === 'optimal'
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        : weather.spraySuitability === 'moderate'
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-red-100 text-red-900 border-red-300'
                    }`}
                  >
                    Verdict:{' '}
                    {weather.spraySuitability === 'optimal'
                      ? formatBilingual('Safe to Spray Now', 'safeToSprayNow', currentLanguage.code)
                      : weather.spraySuitability === 'moderate'
                      ? formatBilingual('Caution: High Weather Risk', 'cautionSpray', currentLanguage.code)
                      : formatBilingual('UNSAFE: Postpone Spraying', 'unsafeSpray', currentLanguage.code)}
                  </span>
                  <button
                    type="button"
                    onClick={speakWeatherAdvice}
                    title="Speak weather advisory in regional language"
                    className="p-1 rounded-md text-emerald-800 hover:bg-emerald-100 transition-colors"
                  >
                    <Volume2 className={`w-4 h-4 ${isSpeaking ? 'text-amber-600 animate-pulse' : ''}`} />
                  </button>
                </div>
                <h3 className="text-base sm:text-lg font-black mt-1">
                  {weather.statusHeading}
                </h3>
                <p className="text-xs sm:text-sm text-stone-800 mt-0.5 leading-relaxed max-w-2xl">
                  {weather.suitabilityReason}
                </p>
              </div>
            </div>

            {/* Optimal Hours Pill */}
            <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-2xs shrink-0 text-left sm:text-right">
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wide block">
                {formatBilingual('Best Spraying Hours Today', 'bestSprayHours', currentLanguage.code)}
              </span>
              <div className="text-sm font-black text-emerald-900 mt-0.5 flex items-center sm:justify-end gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>{weather.optimalSprayHours}</span>
              </div>
            </div>
          </div>

          {/* Environmental Parameter Meters with Dynamic Evaluation */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            
            {/* 1. Wind Speed */}
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-1">
              <div className="flex items-center justify-between text-xs text-stone-500 font-bold">
                <span className="flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-sky-600" />
                  {formatBilingual('Wind Speed', 'windSpeed', currentLanguage.code)}
                </span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                    weather.windSpeedKmH >= 19
                      ? 'text-red-700 bg-red-100'
                      : weather.windSpeedKmH >= 12
                      ? 'text-amber-700 bg-amber-100'
                      : 'text-emerald-700 bg-emerald-100'
                  }`}
                >
                  {weather.windSpeedKmH >= 19
                    ? 'Unsafe Drift'
                    : weather.windSpeedKmH >= 12
                    ? 'Moderate (12-18)'
                    : 'Safe (<12)'}
                </span>
              </div>
              <div className="text-2xl font-black text-stone-900">
                {weather.windSpeedKmH}{' '}
                <span className="text-xs font-semibold text-stone-500">km/h</span>
              </div>
              <p className="text-[10px] text-stone-500">
                {weather.windSpeedKmH >= 19
                  ? 'Severe drift loss into non-target areas'
                  : weather.windSpeedKmH >= 12
                  ? 'Use low-drift anti-drift nozzles'
                  : 'Minimal spray drift risk'}
              </p>
            </div>

            {/* 2. Rain Probability */}
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-1">
              <div className="flex items-center justify-between text-xs text-stone-500 font-bold">
                <span className="flex items-center gap-1.5">
                  <CloudRain className="w-3.5 h-3.5 text-sky-600" />
                  {formatBilingual('Rain Chance (6h)', 'rainChance', currentLanguage.code)}
                </span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                    weather.rainChanceNext6h >= 45
                      ? 'text-red-700 bg-red-100'
                      : weather.rainChanceNext6h >= 25
                      ? 'text-amber-700 bg-amber-100'
                      : 'text-emerald-700 bg-emerald-100'
                  }`}
                >
                  {weather.rainChanceNext6h >= 45
                    ? 'Wash-Off Threat'
                    : weather.rainChanceNext6h >= 25
                    ? 'Moderate'
                    : 'Low Risk'}
                </span>
              </div>
              <div className="text-2xl font-black text-stone-900">
                {weather.rainChanceNext6h}%
              </div>
              <p className="text-[10px] text-stone-500">
                {weather.rainChanceNext6h >= 45
                  ? 'Chemical wash-off danger within 6 hours'
                  : weather.rainChanceNext6h >= 25
                  ? 'Add non-ionic silicone sticker'
                  : 'No immediate wash-off danger'}
              </p>
            </div>

            {/* 3. Temperature */}
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-1">
              <div className="flex items-center justify-between text-xs text-stone-500 font-bold">
                <span className="flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  {formatBilingual('Temperature', 'temperature', currentLanguage.code)}
                </span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                    weather.currentTemp >= 34
                      ? 'text-red-700 bg-red-100'
                      : weather.currentTemp >= 30
                      ? 'text-amber-700 bg-amber-100'
                      : 'text-emerald-700 bg-emerald-100'
                  }`}
                >
                  {weather.currentTemp >= 34
                    ? 'High Evaporation'
                    : weather.currentTemp >= 30
                    ? 'Warm'
                    : 'Good'}
                </span>
              </div>
              <div className="text-2xl font-black text-stone-900">
                {weather.currentTemp}°C
              </div>
              <p className="text-[10px] text-stone-500">
                {weather.currentTemp >= 34
                  ? 'Avoid spraying: droplets dry too fast'
                  : weather.currentTemp >= 30
                  ? 'Spray early morning or late afternoon'
                  : 'Optimal systemic plant uptake'}
              </p>
            </div>

            {/* 4. Relative Humidity */}
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-1">
              <div className="flex items-center justify-between text-xs text-stone-500 font-bold">
                <span className="flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-emerald-600" />
                  {formatBilingual('Humidity', 'humidity', currentLanguage.code)}
                </span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                    weather.humidity > 85 || weather.humidity < 40
                      ? 'text-amber-700 bg-amber-100'
                      : 'text-emerald-700 bg-emerald-100'
                  }`}
                >
                  {weather.humidity > 85
                    ? 'High'
                    : weather.humidity < 40
                    ? 'Dry'
                    : 'Optimal'}
                </span>
              </div>
              <div className="text-2xl font-black text-stone-900">
                {weather.humidity}%
              </div>
              <p className="text-[10px] text-stone-500">
                {weather.humidity < 40
                  ? 'Dry air accelerates spray droplet loss'
                  : weather.humidity > 85
                  ? 'Slow drying on leaves'
                  : 'Ideal leaf stomata uptake'}
              </p>
            </div>

          </div>

          {/* 3-Day Spray Forecast Matrix */}
          <div className="bg-stone-50/70 rounded-2xl p-4 border border-stone-200 space-y-3">
            <span className="text-xs font-bold text-stone-700 uppercase tracking-wide flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              {formatBilingual('3-Day Spray Planning Forecast', 'threeDayForecast', currentLanguage.code)}
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {weather.forecastDays.map((f, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border bg-white flex flex-col justify-between space-y-2 ${
                    f.canSpray ? 'border-emerald-300 shadow-2xs' : 'border-red-300 bg-red-50/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-sm text-stone-900">{f.day}</span>
                      <span className="text-[11px] text-stone-500 block">{f.date}</span>
                    </div>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        f.canSpray
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-red-100 text-red-900 border border-red-300'
                      }`}
                    >
                      {f.canSpray ? `✓ ${formatBilingual('Safe to Spray', 'safeToSpray', currentLanguage.code)}` : `✕ ${formatBilingual('Avoid Spray', 'avoidSpray', currentLanguage.code)}`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-stone-600">
                    <span>Temp: {f.tempMin}° - {f.tempMax}°C</span>
                    <span>Rain: {f.rainChance}%</span>
                  </div>

                  <div className="text-[11px] text-stone-500 font-medium">
                    {f.condition}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
