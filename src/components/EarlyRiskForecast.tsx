import React, { useState, useMemo } from 'react';
import {
  RegionalLanguage,
  EarlyRiskForecastInput,
  EarlyRiskForecastResult,
  DiseaseThreatDetail,
} from '../types';
import { formatBilingual } from '../utils/translations';
import { speakAdvisory, stopSpeaking } from '../utils/speech';
import {
  AlertTriangle,
  ShieldCheck,
  Activity,
  CloudRain,
  Droplets,
  Thermometer,
  Wind,
  Layers,
  Bug,
  Volume2,
  VolumeX,
  Clock,
  Sparkles,
  ChevronRight,
  Info,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertCircle,
  FileText,
  Target,
  FlaskConical,
} from 'lucide-react';

interface Props {
  currentLanguage: RegionalLanguage;
  initialCrop?: string;
  initialDistrict?: string;
  onNavigateToSpray?: (chemicalName: string, dosagePerLiter: number, cropName: string) => void;
  onNavigateToOutbreak?: () => void;
}

const CROPS_LIST = [
  { id: 'Paddy / Rice', name: 'Paddy / Rice (धान)', defaultVariety: 'BPT-5204 (Samba Mahsuri)' },
  { id: 'Cotton', name: 'Cotton (कपास)', defaultVariety: 'Bt Cotton Hybrid RCH-659' },
  { id: 'Wheat', name: 'Wheat (गेहूं)', defaultVariety: 'HD-2967 / PBW-343' },
  { id: 'Maize', name: 'Maize (मक्का)', defaultVariety: 'Kaveri 50 / Pioneer 3396' },
  { id: 'Tomato', name: 'Tomato (टमाटर)', defaultVariety: 'Abhinav / US-440' },
  { id: 'Potato', name: 'Potato (आलू)', defaultVariety: 'Kufri Jyoti / Kufri Bahar' },
  { id: 'Soybean', name: 'Soybean (सोयाबीन)', defaultVariety: 'JS-335 / JS-9560' },
  { id: 'Chilli', name: 'Chilli (मिर्च)', defaultVariety: 'G4 / Teja' },
];

const PRESET_SCENARIOS = [
  {
    name: 'Monsoon Paddy Blast & BPH High Risk',
    crop: 'Paddy / Rice',
    stage: 'tillering_branching' as const,
    variety: 'BPT-5204',
    varietySusceptibility: 'susceptible' as const,
    temperatureC: 24,
    relativeHumidityPct: 92,
    leafWetnessHours: 9,
    rainfallPast48hMm: 45,
    soilDrainage: 'waterlogged' as const,
    trapCatchCount: 16,
    pestHistorySeason: 'severe_epidemic' as const,
    neighboringOutbreakDistanceKm: 3.5,
  },
  {
    name: 'Cotton Pink Bollworm Pheromone Surge (ETL Breached)',
    crop: 'Cotton',
    stage: 'flowering' as const,
    variety: 'Bt Cotton Hybrid',
    varietySusceptibility: 'moderate' as const,
    temperatureC: 30,
    relativeHumidityPct: 78,
    leafWetnessHours: 4,
    rainfallPast48hMm: 10,
    soilDrainage: 'well_drained' as const,
    trapCatchCount: 12,
    pestHistorySeason: 'mild_localized' as const,
    neighboringOutbreakDistanceKm: 6.0,
  },
  {
    name: 'Potato Late Blight Foggy Humid Window',
    crop: 'Potato',
    stage: 'vegetative' as const,
    variety: 'Kufri Jyoti',
    varietySusceptibility: 'susceptible' as const,
    temperatureC: 16,
    relativeHumidityPct: 95,
    leafWetnessHours: 11,
    rainfallPast48hMm: 22,
    soilDrainage: 'waterlogged' as const,
    trapCatchCount: 2,
    pestHistorySeason: 'severe_epidemic' as const,
    neighboringOutbreakDistanceKm: 4.0,
  },
  {
    name: 'Wheat Yellow Rust Spore Drift Alert',
    crop: 'Wheat',
    stage: 'tillering_branching' as const,
    variety: 'PBW-343',
    varietySusceptibility: 'susceptible' as const,
    temperatureC: 15,
    relativeHumidityPct: 88,
    leafWetnessHours: 8,
    rainfallPast48hMm: 5,
    soilDrainage: 'well_drained' as const,
    trapCatchCount: 1,
    pestHistorySeason: 'mild_localized' as const,
    neighboringOutbreakDistanceKm: 8.0,
  },
];

export function EarlyRiskForecast({
  currentLanguage,
  initialCrop,
  initialDistrict = 'Nashik / Deccan Belt',
  onNavigateToSpray,
  onNavigateToOutbreak,
}: Props) {
  const [inputs, setInputs] = useState<EarlyRiskForecastInput>({
    crop: initialCrop || 'Paddy / Rice',
    stage: 'tillering_branching',
    variety: 'BPT-5204 (Samba Mahsuri)',
    varietySusceptibility: 'susceptible',
    temperatureC: 25,
    relativeHumidityPct: 90,
    leafWetnessHours: 8,
    rainfallPast48hMm: 35,
    soilDrainage: 'waterlogged',
    trapCatchCount: 14,
    pestHistorySeason: 'mild_localized',
    neighboringOutbreakDistanceKm: 4.5,
  });

  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [showAdvancedInputs, setShowAdvancedInputs] = useState<boolean>(false);

  // Apply quick preset
  const handleApplyPreset = (preset: (typeof PRESET_SCENARIOS)[0]) => {
    setInputs({
      crop: preset.crop,
      stage: preset.stage,
      variety: preset.variety,
      varietySusceptibility: preset.varietySusceptibility,
      temperatureC: preset.temperatureC,
      relativeHumidityPct: preset.relativeHumidityPct,
      leafWetnessHours: preset.leafWetnessHours,
      rainfallPast48hMm: preset.rainfallPast48hMm,
      soilDrainage: preset.soilDrainage,
      trapCatchCount: preset.trapCatchCount,
      pestHistorySeason: preset.pestHistorySeason,
      neighboringOutbreakDistanceKm: preset.neighboringOutbreakDistanceKm,
    });
  };

  // Algorithmic Multi-Factor Risk Calculation Engine (Ground truth based on ICAR / SAU epidemiology models)
  const forecastResult = useMemo<EarlyRiskForecastResult>(() => {
    let baseScore = 20;

    // 1. Weather / Microclimate influence
    // High humidity (>80%) + leaf wetness (>6 hours) is the #1 fungal spore germination trigger
    if (inputs.relativeHumidityPct >= 85) baseScore += 22;
    else if (inputs.relativeHumidityPct >= 70) baseScore += 12;

    if (inputs.leafWetnessHours >= 8) baseScore += 24;
    else if (inputs.leafWetnessHours >= 5) baseScore += 14;

    if (inputs.rainfallPast48hMm > 25) baseScore += 10;
    if (inputs.soilDrainage === 'waterlogged') baseScore += 12;

    // 2. Variety susceptibility
    if (inputs.varietySusceptibility === 'susceptible') baseScore += 15;
    else if (inputs.varietySusceptibility === 'moderate') baseScore += 6;
    else if (inputs.varietySusceptibility === 'resistant') baseScore -= 15;

    // 3. Pest trap / Inoculum threshold
    if (inputs.trapCatchCount >= 10) baseScore += 18;
    else if (inputs.trapCatchCount >= 5) baseScore += 8;

    // 4. Local history & proximity to outbreak
    if (inputs.pestHistorySeason === 'severe_epidemic') baseScore += 12;
    else if (inputs.pestHistorySeason === 'mild_localized') baseScore += 5;

    if (inputs.neighboringOutbreakDistanceKm <= 5) baseScore += 14;
    else if (inputs.neighboringOutbreakDistanceKm <= 12) baseScore += 7;

    // Cap between 5 and 98
    const finalScore = Math.min(98, Math.max(8, baseScore));

    let riskLevel: 'low' | 'moderate' | 'critical' = 'low';
    if (finalScore >= 68) riskLevel = 'critical';
    else if (finalScore >= 38) riskLevel = 'moderate';

    // Generate specific threats based on Crop
    const primaryThreats: DiseaseThreatDetail[] = [];
    const ipmProtocol = {
      cultural: [] as string[],
      biological: [] as string[],
      mechanical: [] as string[],
      chemicalProphylactic: [] as string[],
    };

    if (inputs.crop.toLowerCase().includes('paddy') || inputs.crop.toLowerCase().includes('rice')) {
      primaryThreats.push({
        id: 'rice-blast',
        pathogenOrPest: 'Blast & Leaf Spot',
        pathogenHindi: 'धान का झुलसा रोग (ब्लास्ट)',
        scientificName: 'Pyricularia oryzae',
        threatType: 'fungal',
        calculatedRiskPercent: Math.min(98, finalScore + 4),
        riskCategory: finalScore > 65 ? 'critical' : 'moderate',
        etlThresholdDescription: 'Spore germination active when RH > 85% with leaf wetness > 7 hrs',
        currentEtlStatus: inputs.leafWetnessHours >= 6 ? 'BREACHED_ETL_ACTION_NOW' : 'APPROACHING_ETL',
        forecastedIncubationDays: 3,
        potentialYieldLossPct: 35,
        favorableConditionsMet: [
          `Relative Humidity ${inputs.relativeHumidityPct}% (>85% ideal for conidia)`,
          `Leaf Wetness ${inputs.leafWetnessHours} hrs (minimum 6 hrs needed for appressorium)`,
          inputs.soilDrainage === 'waterlogged' ? 'Standing water elevates canopy humidity' : 'Canopy micro-fog active',
        ],
        actionWindowHours: finalScore > 65 ? 24 : 48,
      });

      primaryThreats.push({
        id: 'rice-bph',
        pathogenOrPest: 'Brown Plant Hopper (BPH) & Stem Borer',
        pathogenHindi: 'भूरा माहू एवं तना छेदक',
        scientificName: 'Nilaparvata lugens',
        threatType: 'insect_pest',
        calculatedRiskPercent: Math.min(95, Math.round(inputs.trapCatchCount * 5.2 + 25)),
        riskCategory: inputs.trapCatchCount >= 10 ? 'high' : 'moderate',
        etlThresholdDescription: 'ETL: 8-10 hoppers per hill or >8 moths/trap/night',
        currentEtlStatus: inputs.trapCatchCount >= 10 ? 'BREACHED_ETL_ACTION_NOW' : 'BELOW_ETL',
        forecastedIncubationDays: 5,
        potentialYieldLossPct: 25,
        favorableConditionsMet: [
          `Trap catch count: ${inputs.trapCatchCount} moths/trap/night (ETL limit: 8)`,
          'Dense tillering canopy favors nymph multiplication',
        ],
        actionWindowHours: 36,
      });

      ipmProtocol.cultural = [
        'Drain water from paddy field for 2-3 days (alternate wetting and drying) to lower canopy moisture and suppress BPH multiplication.',
        'Avoid excessive top-dressing of Urea/Nitrogen; split into 3-4 doses with Potash (MOP) to harden leaf epidermis.',
        'Form alleyways (30 cm paths every 2-3 meters) to allow direct sunlight penetration into lower tillers.',
      ];
      ipmProtocol.biological = [
        'Foliar application of Pseudomonas fluorescens @ 5g/liter or 2.5 kg/ha mixed with 50 kg FYM.',
        'Spray Neem seed kernel extract (NSKE 5%) or Azadirachtin 10,000 ppm @ 2 ml/liter as ovicidal deterrent.',
      ];
      ipmProtocol.mechanical = [
        'Erect 8 Pheromone traps per acre with Scirpophaga incertulas lures to monitor yellow stem borer emergence.',
        'Set up light traps (1 per 2 acres) between 7 PM - 9 PM to mass-trap hoppers.',
      ];
      ipmProtocol.chemicalProphylactic = [
        'If Blast lesions appear or risk > 70%: Prophylactic spray of Tricyclazole 75 WP @ 0.6 g/liter or Isoprothiolane 40 EC @ 1.5 ml/liter.',
        'For BPH at ETL: Pymetrozine 50% WDG @ 0.6 g/liter or Triflumezopyrim 10% SC @ 0.5 ml/liter directed at base of plants.',
      ];
    } else if (inputs.crop.toLowerCase().includes('cotton')) {
      primaryThreats.push({
        id: 'cotton-pink-bollworm',
        pathogenOrPest: 'Pink Bollworm & Whitefly',
        pathogenHindi: 'गुलाबी सुंडी एवं सफेद मक्खी',
        scientificName: 'Pectinophora gossypiella',
        threatType: 'insect_pest',
        calculatedRiskPercent: Math.min(96, finalScore),
        riskCategory: finalScore > 65 ? 'critical' : 'moderate',
        etlThresholdDescription: 'ETL: 8 moths/trap/night for 3 consecutive days or 1 rosette flower per 20 plants',
        currentEtlStatus: inputs.trapCatchCount >= 8 ? 'BREACHED_ETL_ACTION_NOW' : 'APPROACHING_ETL',
        forecastedIncubationDays: 4,
        potentialYieldLossPct: 40,
        favorableConditionsMet: [
          `Pheromone catch: ${inputs.trapCatchCount} moths/night (Exceeds critical ETL threshold)`,
          'Flowering to square formation stage is primary oviposition window',
        ],
        actionWindowHours: 24,
      });

      ipmProtocol.cultural = [
        'Destroy rosette flowers immediately by hand collection and bury 3 feet under soil.',
        'Avoid ratoon cotton crop and maintain 120-day strict crop termination to break lifecycle.',
      ];
      ipmProtocol.biological = [
        'Release Trichogramma bactrae egg parasitoid @ 60,000 wasps/acre at weekly intervals 3 times.',
        'Spray Beauveria bassiana 1.15% WP @ 5 g/liter during late afternoon hours.',
      ];
      ipmProtocol.mechanical = [
        'Install 5 Pheromone traps with Gossyplure per acre for monitoring; 15 traps/acre for mass annihilation.',
        'Hang yellow sticky cards (15-20 per acre) at crop canopy level for whitefly surveillance.',
      ];
      ipmProtocol.chemicalProphylactic = [
        'If trap catch > 8 moths for 3 nights: Chlorantraniliprole 18.5% SC @ 0.3 ml/liter (60 ml/acre) or Profenofos 50% EC @ 2 ml/liter.',
      ];
    } else if (inputs.crop.toLowerCase().includes('potato') || inputs.crop.toLowerCase().includes('tomato')) {
      primaryThreats.push({
        id: 'solanaceous-blight',
        pathogenOrPest: 'Late Blight & Early Blight',
        pathogenHindi: 'पछेती झुलसा एवं अगेती झुलसा रोग',
        scientificName: 'Phytophthora infestans',
        threatType: 'fungal',
        calculatedRiskPercent: Math.min(99, finalScore + 6),
        riskCategory: 'critical',
        etlThresholdDescription: 'Blitecast model triggers alert when temperature is 12-24°C and RH > 90% for > 10 hours',
        currentEtlStatus: inputs.leafWetnessHours >= 7 ? 'BREACHED_ETL_ACTION_NOW' : 'APPROACHING_ETL',
        forecastedIncubationDays: 2,
        potentialYieldLossPct: 60,
        favorableConditionsMet: [
          `Continuous leaf wetness: ${inputs.leafWetnessHours} hours (Extreme zoospore motility)`,
          `Temperature ${inputs.temperatureC}°C is within optimal infection range (15-22°C)`,
          `Proximity to verified outbreak: ${inputs.neighboringOutbreakDistanceKm} km`,
        ],
        actionWindowHours: 18,
      });

      ipmProtocol.cultural = [
        'Avoid overhead sprinkler irrigation; switch to drip or furrow irrigation to keep foliage dry.',
        'Ensure proper ridge height and soil mounding around potato tubers to prevent spore wash-off into underground tubers.',
      ];
      ipmProtocol.biological = [
        'Foliar spray of Trichoderma harzianum @ 5g/liter before cloudy weather onset.',
      ];
      ipmProtocol.mechanical = [
        'Roguing and immediate disposal of first infected plant foci in polythene bags away from farm.',
      ];
      ipmProtocol.chemicalProphylactic = [
        'Preventative / Prophylactic: Mancozeb 75% WP @ 2.5 g/liter before rainfall.',
        'Curative if symptoms observed within 24h: Cymoxanil 8% + Mancozeb 64% WP @ 2.5 g/liter or Dimethomorph 50% WP @ 1 g/liter.',
      ];
    } else {
      primaryThreats.push({
        id: 'general-rust-leafspot',
        pathogenOrPest: 'Rust, Leaf Blight & Sucking Pests',
        pathogenHindi: 'गेरुआ / रतुआ एवं पर्ण झुलसा',
        scientificName: 'Puccinia spp. / Alternaria',
        threatType: 'fungal',
        calculatedRiskPercent: finalScore,
        riskCategory: finalScore > 65 ? 'critical' : 'moderate',
        etlThresholdDescription: 'Spore cloud dispersal rapid during high RH (>80%) and cool wind patterns',
        currentEtlStatus: finalScore > 65 ? 'BREACHED_ETL_ACTION_NOW' : 'APPROACHING_ETL',
        forecastedIncubationDays: 4,
        potentialYieldLossPct: 28,
        favorableConditionsMet: [
          `Canopy humidity ${inputs.relativeHumidityPct}% favors fungal germination`,
          `Variety class: ${inputs.varietySusceptibility.toUpperCase()} vulnerability`,
        ],
        actionWindowHours: 36,
      });

      ipmProtocol.cultural = [
        'Maintain balanced N:P:K nutrition; do not apply excessive urea.',
        'Ensure proper drainage channels to prevent root zone saturation.',
      ];
      ipmProtocol.biological = [
        'Spray Neem Azadirachtin 10,000 ppm @ 2 ml/liter or Trichoderma viride @ 5g/liter.',
      ];
      ipmProtocol.mechanical = [
        'Install yellow sticky traps (10 per acre) and pheromone traps for pest monitoring.',
      ];
      ipmProtocol.chemicalProphylactic = [
        'Preventative: Propiconazole 25% EC @ 1 ml/liter or Mancozeb 75% WP @ 2.5 g/liter.',
      ];
    }

    const urgentActionWindow =
      finalScore > 65
        ? 'CRITICAL PRE-EMPTIVE WINDOW: Intervene within next 24-36 Hours before visible leaf sporulation'
        : finalScore > 35
        ? 'ADVISORY MONITORING: Inspect field borders and trap counts every 48 hours'
        : 'LOW RISK WINDOW: Normal scouting routine adequate';

    const advisoryText =
      finalScore > 65
        ? `High infection risk detected for ${inputs.crop} due to prolonged leaf wetness (${inputs.leafWetnessHours}h) and favorable humidity (${inputs.relativeHumidityPct}%). Pathogen spore germination is predicted within 48-72 hours before visible symptoms. Implement IPM biological or prophylactic spray immediately to protect crop yield.`
        : `Moderate risk conditions observed for ${inputs.crop}. Weather microclimate and trap catch (${inputs.trapCatchCount}/night) require close surveillance. Implement cultural measures and set up pheromone lures.`;

    const advisoryHindi =
      finalScore > 65
        ? `चेतावनी: अत्यधिक नमी (${inputs.relativeHumidityPct}%) और पत्तों पर ओस/गीलापन (${inputs.leafWetnessHours} घंटे) के कारण ${inputs.crop} में रोग के बीजाणु तेजी से सक्रिय हो रहे हैं। फसल में लक्षण दिखने से पहले ही अगले 24-36 घंटों में जैविक या अनुशंसित रक्षात्मक छिड़काव करें।`
        : `सतर्कता: ${inputs.crop} में मध्यम जोखिम की स्थिति है। ट्रैप में कीटों की संख्या (${inputs.trapCatchCount}/रात) पर नजर रखें और खेत में जल निकासी सुनिश्चित करें।`;

    return {
      riskScore: finalScore,
      riskLevel,
      riskTitle:
        finalScore > 65
          ? 'HIGH EARLY INFECTION RISK (PRE-SYMPTOMATIC ALERT)'
          : finalScore > 35
          ? 'MODERATE RISK (WATCH & PREVENTATIVE ADVISORY)'
          : 'LOW RISK (STABLE MICROCLIMATE)',
      riskTitleHindi:
        finalScore > 65
          ? 'उच्च जोखिम चेतावनी (फसल में लक्षण दिखने से पूर्व पूर्वचेतावनी)'
          : 'मध्यम जोखिम (निगरानी एवं सुरक्षा सलाह)',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      crop: inputs.crop,
      stage: inputs.stage,
      variety: inputs.variety,
      weatherSummary: `Temp ${inputs.temperatureC}°C | RH ${inputs.relativeHumidityPct}% | Wetness ${inputs.leafWetnessHours}h | Rain ${inputs.rainfallPast48hMm}mm`,
      primaryThreats,
      ipmProtocol,
      urgentActionWindow,
      advisoryText,
      advisoryHindi,
    };
  }, [inputs]);

  // Voice speech readout
  const handleToggleVoice = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      const scriptToRead =
        currentLanguage.code === 'hi'
          ? `${forecastResult.riskTitleHindi}. ${forecastResult.advisoryHindi}`
          : `${forecastResult.riskTitle}. ${forecastResult.advisoryText} Recommended urgent action: ${forecastResult.urgentActionWindow}`;
      setIsSpeaking(true);
      speakAdvisory(scriptToRead, currentLanguage, () => {
        setIsSpeaking(false);
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <section className="bg-gradient-to-r from-emerald-900 via-teal-900 to-stone-900 text-white p-5 sm:p-6 rounded-3xl shadow-md border border-emerald-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-emerald-950 text-xs font-black uppercase tracking-wider shadow-xs">
                <Target className="w-3.5 h-3.5" />
                SIH Problem Module
              </span>
              <span className="text-xs text-emerald-200">
                Crop Stage • Weather • Pheromone Traps • Micro-climate
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {formatBilingual(
                'Multi-Factor Early Risk Forecasting Engine',
                'earlyRiskForecastTitle',
                currentLanguage.code
              )}
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              Detect pathogen sporulation and pest surges <strong>before visible crop foliage damage</strong>.
              Combines phenological stage, variety genetics, continuous leaf wetness hours, and pheromone trap ETL.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={handleToggleVoice}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-black transition-all shadow-xs ${
                isSpeaking
                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                  : 'bg-amber-400 hover:bg-amber-300 text-emerald-950'
              }`}
            >
              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>{isSpeaking ? 'Stop Voice' : 'Listen Early Advisory'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Quick Field Scenarios Selector */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Quick Scenario Presets (Load Known Epidemic Risk Profiles):
          </span>
          <span className="text-[11px] text-stone-400">Click to test instant simulation</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
          {PRESET_SCENARIOS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(preset)}
              className="text-left p-2.5 rounded-xl border border-stone-200 hover:border-emerald-600 hover:bg-emerald-50/40 transition-all text-xs group"
            >
              <div className="font-bold text-stone-900 group-hover:text-emerald-800 truncate">
                {preset.name}
              </div>
              <div className="text-[11px] text-stone-500 mt-0.5">
                {preset.crop} • {preset.stage}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 2-Column Main Workspace: Input Controls & Forecast Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN (Inputs & Parameter Controls) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm space-y-4">
            
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-700" />
                Farm Risk Factor Inputs
              </h3>
              <button
                type="button"
                onClick={() => setShowAdvancedInputs(!showAdvancedInputs)}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
              >
                {showAdvancedInputs ? 'Simple Mode' : 'Tune Micro-Sensors'}
              </button>
            </div>

            {/* Crop Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700">Crop Cultivated</label>
              <select
                value={inputs.crop}
                onChange={(e) => {
                  const selected = CROPS_LIST.find((c) => c.id === e.target.value);
                  setInputs({
                    ...inputs,
                    crop: e.target.value,
                    variety: selected ? selected.defaultVariety : inputs.variety,
                  });
                }}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden"
              >
                {CROPS_LIST.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Phenological Growth Stage */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700">Crop Growth Stage</label>
              <select
                value={inputs.stage}
                onChange={(e) => setInputs({ ...inputs, stage: e.target.value as any })}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden"
              >
                <option value="germination">1. Germination / Seedling (0-20 days)</option>
                <option value="vegetative">2. Active Vegetative (20-45 days)</option>
                <option value="tillering_branching">3. Tillering / Branching (Critical Foliage Density)</option>
                <option value="flowering">4. Flowering / Heading (High Vulnerability)</option>
                <option value="grain_pod_filling">5. Grain / Pod Filling (Late Season)</option>
                <option value="maturity">6. Ripening / Pre-Harvest Maturity</option>
              </select>
            </div>

            {/* Variety Susceptibility */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-700">Variety Resistance Tier</label>
                <span className="text-[11px] text-stone-500 font-mono">{inputs.variety}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['susceptible', 'moderate', 'resistant'] as const).map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setInputs({ ...inputs, varietySusceptibility: tier })}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold capitalize transition-all border ${
                      inputs.varietySusceptibility === tier
                        ? tier === 'susceptible'
                          ? 'bg-red-50 border-red-500 text-red-700'
                          : tier === 'moderate'
                          ? 'bg-amber-50 border-amber-500 text-amber-800'
                          : 'bg-emerald-50 border-emerald-600 text-emerald-800'
                        : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    {tier}
                  </button>
                ))}
              </div>
            </div>

            {/* Critical Weather & Microclimate Sliders */}
            <div className="space-y-3 pt-2 border-t border-stone-100">
              
              {/* Relative Humidity Slider */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-stone-700 flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5 text-blue-500" />
                    Relative Humidity (RH)
                  </span>
                  <span className="font-extrabold text-blue-700">{inputs.relativeHumidityPct}%</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="100"
                  step="1"
                  value={inputs.relativeHumidityPct}
                  onChange={(e) => setInputs({ ...inputs, relativeHumidityPct: Number(e.target.value) })}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-stone-400">
                  <span>Dry (&lt;50%)</span>
                  <span>Moderate (70%)</span>
                  <span className="text-red-500 font-bold">Sporulation Trigger (&gt;85%)</span>
                </div>
              </div>

              {/* Continuous Leaf Wetness Hours Slider */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-stone-700 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-teal-600" />
                    Continuous Leaf Wetness
                  </span>
                  <span className="font-extrabold text-teal-700">{inputs.leafWetnessHours} Hours</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="16"
                  step="1"
                  value={inputs.leafWetnessHours}
                  onChange={(e) => setInputs({ ...inputs, leafWetnessHours: Number(e.target.value) })}
                  className="w-full accent-teal-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-stone-400">
                  <span>Dry Leaves (0h)</span>
                  <span>Dew / Fog (4-6h)</span>
                  <span className="text-red-600 font-bold">Infection Penetration (&gt;8h)</span>
                </div>
              </div>

              {/* Temperature */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-stone-700 flex items-center gap-1">
                    <Thermometer className="w-3.5 h-3.5 text-amber-500" />
                    Canopy Temperature
                  </span>
                  <span className="font-extrabold text-amber-700">{inputs.temperatureC}°C</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="42"
                  step="1"
                  value={inputs.temperatureC}
                  onChange={(e) => setInputs({ ...inputs, temperatureC: Number(e.target.value) })}
                  className="w-full accent-amber-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Pheromone Trap Catch & Inoculum */}
            <div className="space-y-3 pt-2 border-t border-stone-100">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-stone-700 flex items-center gap-1">
                    <Bug className="w-3.5 h-3.5 text-purple-600" />
                    Pheromone Trap Count (Moths / Night)
                  </span>
                  <span
                    className={`font-black px-2 py-0.5 rounded-md ${
                      inputs.trapCatchCount >= 8 ? 'bg-red-100 text-red-700' : 'bg-stone-100 text-stone-700'
                    }`}
                  >
                    {inputs.trapCatchCount} {inputs.trapCatchCount >= 8 ? '• ETL Breached' : '• Normal'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="1"
                  value={inputs.trapCatchCount}
                  onChange={(e) => setInputs({ ...inputs, trapCatchCount: Number(e.target.value) })}
                  className="w-full accent-purple-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-stone-400">
                  <span>0 - Safe</span>
                  <span>ETL Threshold (8 moths)</span>
                  <span className="text-red-600 font-bold">20+ Outbreak</span>
                </div>
              </div>
            </div>

            {/* Advanced Field Drainage & Outbreak Distance */}
            {showAdvancedInputs && (
              <div className="space-y-3 pt-3 border-t border-stone-100 bg-stone-50/80 p-3 rounded-2xl">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">Soil Drainage Condition</label>
                  <select
                    value={inputs.soilDrainage}
                    onChange={(e) => setInputs({ ...inputs, soilDrainage: e.target.value as any })}
                    className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white"
                  >
                    <option value="well_drained">Well Drained (Aerated Root Zone)</option>
                    <option value="waterlogged">Waterlogged / Saturated (Spore Incubation)</option>
                    <option value="saline_alkaline">Saline / Alkaline (Stress Induced)</option>
                    <option value="acidic">Acidic Soil (Low Calcium)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-stone-700">
                    <span>Distance to Nearest Outbreak</span>
                    <span className="text-emerald-800">{inputs.neighboringOutbreakDistanceKm} km</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    step="0.5"
                    value={inputs.neighboringOutbreakDistanceKm}
                    onChange={(e) => setInputs({ ...inputs, neighboringOutbreakDistanceKm: Number(e.target.value) })}
                    className="w-full accent-emerald-700 cursor-pointer"
                  />
                </div>
              </div>
            )}

            <div className="text-[11px] text-stone-500 italic bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
              <strong>Dynamic Algorithm Active:</strong> Live recalculated based on ICAR epidemiological models for {inputs.crop}.
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (Forecast Results, Threat Matrix, IPM Strategy) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Main Risk Gauge Scorecard */}
          <div
            className={`p-6 rounded-3xl border shadow-sm transition-all ${
              forecastResult.riskLevel === 'critical'
                ? 'bg-gradient-to-br from-red-50 via-white to-amber-50/40 border-red-300'
                : forecastResult.riskLevel === 'moderate'
                ? 'bg-gradient-to-br from-amber-50 via-white to-stone-50 border-amber-300'
                : 'bg-gradient-to-br from-emerald-50 via-white to-teal-50 border-emerald-300'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                      forecastResult.riskLevel === 'critical'
                        ? 'bg-red-600 text-white'
                        : forecastResult.riskLevel === 'moderate'
                        ? 'bg-amber-500 text-stone-950'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5" />
                    {forecastResult.riskLevel} Level Risk
                  </span>
                  <span className="text-xs text-stone-500 font-mono">
                    Updated: {forecastResult.timestamp}
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-black text-stone-900">
                  {currentLanguage.code === 'hi'
                    ? forecastResult.riskTitleHindi
                    : forecastResult.riskTitle}
                </h3>
                <p className="text-xs text-stone-600">
                  {forecastResult.weatherSummary}
                </p>
              </div>

              {/* Large Circular / Number Gauge */}
              <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto bg-white/90 p-3 rounded-2xl border border-stone-200 shadow-2xs">
                <div className="text-center">
                  <div
                    className={`text-3xl sm:text-4xl font-black ${
                      forecastResult.riskLevel === 'critical'
                        ? 'text-red-600'
                        : forecastResult.riskLevel === 'moderate'
                        ? 'text-amber-600'
                        : 'text-emerald-700'
                    }`}
                  >
                    {forecastResult.riskScore}%
                  </div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-stone-500">
                    Risk Index
                  </div>
                </div>
              </div>
            </div>

            {/* Action Window Notification Banner */}
            <div
              className={`mt-4 p-3 rounded-2xl flex items-start gap-2.5 text-xs font-bold ${
                forecastResult.riskLevel === 'critical'
                  ? 'bg-red-600 text-white shadow-xs'
                  : forecastResult.riskLevel === 'moderate'
                  ? 'bg-amber-100 text-amber-950 border border-amber-300'
                  : 'bg-emerald-100 text-emerald-950 border border-emerald-300'
              }`}
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="block font-black uppercase tracking-wide text-[11px]">
                  Actionable Window Forecast
                </span>
                <span>{forecastResult.urgentActionWindow}</span>
              </div>
            </div>

            {/* Regional Language Advisory Text */}
            <div className="mt-3 p-3.5 bg-white/80 rounded-2xl border border-stone-200 text-xs text-stone-700 leading-relaxed">
              <strong className="text-stone-900 block mb-1">
                {formatBilingual('Advisory Summary', 'advisorySummary', currentLanguage.code)}:
              </strong>
              {currentLanguage.code === 'hi' && forecastResult.advisoryHindi
                ? forecastResult.advisoryHindi
                : forecastResult.advisoryText}
            </div>
          </div>

          {/* Primary Pathogen & Pest Threat Forecast Cards */}
          <div className="space-y-3">
            <h4 className="text-sm font-black text-stone-900 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Bug className="w-4 h-4 text-emerald-700" />
                Primary Pathogen & Insect Vectors Under Surveillance
              </span>
              <span className="text-xs text-stone-500 font-normal">Pre-Symptomatic Detection</span>
            </h4>

            <div className="grid grid-cols-1 gap-3">
              {forecastResult.primaryThreats.map((threat) => (
                <div
                  key={threat.id}
                  className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-3 hover:border-emerald-500 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-stone-900">
                          {threat.pathogenOrPest}
                        </span>
                        {threat.pathogenHindi && (
                          <span className="text-xs font-semibold text-emerald-800">
                            ({threat.pathogenHindi})
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            threat.threatType === 'fungal'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {threat.threatType}
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-400 italic font-mono">
                        {threat.scientificName}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span
                        className={`text-xs font-black px-2.5 py-1 rounded-xl ${
                          threat.currentEtlStatus === 'BREACHED_ETL_ACTION_NOW'
                            ? 'bg-red-600 text-white animate-pulse'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {threat.currentEtlStatus === 'BREACHED_ETL_ACTION_NOW'
                          ? 'ETL Breached'
                          : 'Approaching ETL'}
                      </span>
                      <span className="text-xs font-bold text-stone-700 bg-stone-100 px-2 py-1 rounded-xl">
                        Risk: {threat.calculatedRiskPercent}%
                      </span>
                    </div>
                  </div>

                  {/* Favorable Environmental Triggers Met */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-stone-600 block">
                      Favorable Microclimate Triggers Met:
                    </span>
                    <ul className="space-y-1">
                      {threat.favorableConditionsMet.map((cond, cIdx) => (
                        <li key={cIdx} className="text-xs text-stone-700 flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{cond}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-[11px] bg-stone-50 p-2.5 rounded-xl text-stone-600">
                    <div>
                      <span className="block text-stone-400">Potential Yield Loss</span>
                      <strong className="text-red-700">{threat.potentialYieldLossPct}% loss if untreated</strong>
                    </div>
                    <div>
                      <span className="block text-stone-400">Incubation Window</span>
                      <strong className="text-stone-800">{threat.forecastedIncubationDays} Days to Foliar Spots</strong>
                    </div>
                    <div>
                      <span className="block text-stone-400">Intervention Window</span>
                      <strong className="text-amber-700 font-bold">{threat.actionWindowHours} Hours Max</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4-Tier Integrated Pest Management (IPM) Advisory Protocol */}
          <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h4 className="text-sm font-black text-stone-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                4-Tier Integrated Pest Management (IPM) Protocol
              </h4>
              <span className="text-xs text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                ICAR / CIBRC Compliant
              </span>
            </div>

            <div className="space-y-3.5">
              {/* Tier 1: Cultural */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/40 border border-emerald-100 space-y-1.5">
                <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-900 uppercase tracking-wide">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">1</span>
                  Cultural & Agronomic Sanitation
                </span>
                <ul className="space-y-1 pl-6 list-disc text-xs text-stone-700">
                  {forecastResult.ipmProtocol.cultural.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* Tier 2: Biological */}
              <div className="p-3.5 rounded-2xl bg-teal-50/40 border border-teal-100 space-y-1.5">
                <span className="inline-flex items-center gap-1.5 text-xs font-black text-teal-900 uppercase tracking-wide">
                  <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px]">2</span>
                  Biological & Bio-Pesticide Agents
                </span>
                <ul className="space-y-1 pl-6 list-disc text-xs text-stone-700">
                  {forecastResult.ipmProtocol.biological.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* Tier 3: Mechanical */}
              <div className="p-3.5 rounded-2xl bg-amber-50/40 border border-amber-100 space-y-1.5">
                <span className="inline-flex items-center gap-1.5 text-xs font-black text-amber-900 uppercase tracking-wide">
                  <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px]">3</span>
                  Mechanical & Pheromone Lure Surveillance
                </span>
                <ul className="space-y-1 pl-6 list-disc text-xs text-stone-700">
                  {forecastResult.ipmProtocol.mechanical.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* Tier 4: Chemical Prophylactic */}
              <div className="p-3.5 rounded-2xl bg-red-50/30 border border-red-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-black text-red-950 uppercase tracking-wide">
                    <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px]">4</span>
                    Judicious Chemical Prophylactic (Last Resort)
                  </span>
                  {onNavigateToSpray && (
                    <button
                      type="button"
                      onClick={() => onNavigateToSpray('Tricyclazole / Mancozeb', 2.0, inputs.crop)}
                      className="flex items-center gap-1 text-[11px] font-black text-emerald-800 hover:text-emerald-900 underline"
                    >
                      <FlaskConical className="w-3.5 h-3.5" />
                      Calculate Tank Mix
                    </button>
                  )}
                </div>
                <ul className="space-y-1 pl-6 list-disc text-xs text-stone-700">
                  {forecastResult.ipmProtocol.chemicalProphylactic.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Direct Tool Bridges */}
            <div className="pt-2 flex flex-wrap gap-2.5">
              {onNavigateToSpray && (
                <button
                  type="button"
                  onClick={() => onNavigateToSpray('Tricyclazole 75 WP', 0.6, inputs.crop)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <FlaskConical className="w-3.5 h-3.5 text-amber-300" />
                  <span>Open Knapsack Tank Calculator for this Threat</span>
                </button>
              )}

              {onNavigateToOutbreak && (
                <button
                  type="button"
                  onClick={onNavigateToOutbreak}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-all cursor-pointer"
                >
                  <Activity className="w-3.5 h-3.5 text-red-600" />
                  <span>Check Nearby Village Outbreaks ({inputs.neighboringOutbreakDistanceKm} km)</span>
                </button>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
