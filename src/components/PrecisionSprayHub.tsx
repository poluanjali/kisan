import React, { useState } from 'react';
import {
  FlaskConical,
  CloudSun,
  ShieldCheck,
  AlertTriangle,
  Wind,
  Droplets,
  Clock,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';
import { RegionalLanguage } from '../types';
import { SprayTankCalculator } from './SprayTankCalculator';
import { SprayWeatherRadar } from './SprayWeatherRadar';
import { formatBilingual } from '../utils/translations';

interface PrecisionSprayHubProps {
  currentLanguage: RegionalLanguage;
  initialChemicalName?: string;
  initialCropName?: string;
  initialDosagePerLiter?: number;
  initialDistrict?: string;
  onDistrictChange?: (district: string) => void;
  simulationMode?: string;
  onSimulationModeChange?: (mode: string) => void;
  defaultSubTab?: 'calculator' | 'weather';
}

export const PrecisionSprayHub: React.FC<PrecisionSprayHubProps> = ({
  currentLanguage,
  initialChemicalName,
  initialCropName,
  initialDosagePerLiter = 2.0,
  initialDistrict = 'Nashik / Deccan Belt',
  onDistrictChange,
  simulationMode = 'live',
  onSimulationModeChange,
  defaultSubTab = 'calculator',
}) => {
  const [subTab, setSubTab] = useState<'calculator' | 'weather'>(defaultSubTab);

  return (
    <div id="precision-spray-hub" className="space-y-5">
      {/* Top Banner explaining the Real-World Solution */}
      <div className="bg-gradient-to-r from-teal-900 via-emerald-900 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-400 text-emerald-950">
                Precision Agriculture 2.0
              </span>
              <span className="text-xs text-emerald-200 hidden sm:inline font-medium">
                Prevent Chemical Burn & Spray Drift
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              {formatBilingual('Precision Spray & Weather Window Hub', 'sprayCalculator', currentLanguage.code)}
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              Over-spraying wastes ₹3,500/acre and creates chemical toxicity. Spraying before rain washes away expensive chemicals. 
              Calculate exact pump dosages and check the real-time weather window before taking your sprayer into the field.
            </p>
          </div>

          {/* Quick Sub-Tab Switcher */}
          <div className="flex items-center gap-1.5 bg-emerald-950/80 p-1.5 rounded-2xl border border-emerald-700/60 shrink-0">
            <button
              type="button"
              onClick={() => setSubTab('calculator')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                subTab === 'calculator'
                  ? 'bg-amber-400 text-emerald-950 shadow-sm'
                  : 'text-emerald-200 hover:text-white hover:bg-emerald-800/60'
              }`}
            >
              <FlaskConical className="w-4 h-4" />
              <span>{formatBilingual('Tank Dose Calculator', 'sprayCalculator', currentLanguage.code)}</span>
            </button>

            <button
              type="button"
              onClick={() => setSubTab('weather')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                subTab === 'weather'
                  ? 'bg-amber-400 text-emerald-950 shadow-sm'
                  : 'text-emerald-200 hover:text-white hover:bg-emerald-800/60'
              }`}
            >
              <CloudSun className="w-4 h-4" />
              <span>{formatBilingual('Safe Weather Radar', 'sprayWeather', currentLanguage.code)}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Render Active View */}
      {subTab === 'calculator' ? (
        <div className="space-y-4">
          <SprayTankCalculator
            currentLanguage={currentLanguage}
            initialChemicalName={initialChemicalName}
            initialCropName={initialCropName}
            initialDosagePerLiter={initialDosagePerLiter}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <SprayWeatherRadar
            currentLanguage={currentLanguage}
            initialDistrict={initialDistrict}
            onDistrictChange={onDistrictChange}
            simulationMode={simulationMode}
            onSimulationModeChange={onSimulationModeChange}
          />
        </div>
      )}
    </div>
  );
};
