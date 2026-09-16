import React, { useState } from 'react';
import {
  RegionalLanguage,
  TreatmentFollowUpTrack,
  FollowUpDayCheck,
} from '../types';
import { formatBilingual } from '../utils/translations';
import { speakAdvisory, stopSpeaking } from '../utils/speech';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Camera,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  FileCheck,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Plus,
  X,
  Calendar,
  Layers,
  FlaskConical,
  MessageSquare,
} from 'lucide-react';

interface Props {
  currentLanguage: RegionalLanguage;
  initialNewTrackPrefill?: {
    cropName?: string;
    diagnosisTitle?: string;
    treatmentPrescribed?: string;
    photoUrl?: string;
  } | null;
  onNavigateToDoctor?: () => void;
}

const DEFAULT_TRACKS: TreatmentFollowUpTrack[] = [
  {
    id: 'TRK-2026-101',
    cropName: 'Paddy / Rice',
    cropHindi: 'धान',
    farmerName: 'Kishan Ram',
    village: 'Pimpalgaon, Nashik',
    diagnosisTitle: 'Rice Blast (Pyricularia oryzae)',
    treatmentPrescribed: 'Tricyclazole 75% WP @ 0.6 g/liter with balanced Potash top dressing',
    chemicalUsed: 'Tricyclazole 75 WP',
    chemicalBrand: 'Beam / Rallis Baan',
    batchNumber: 'RAL-2026-T881',
    startDate: '10-Sep-2026',
    initialPhotoUrl: '/samples/paddy-blight.jpg',
    confirmedRecoveryPercent: 85,
    overallStatus: 'improving',
    fieldConfirmation: 'partially_controlled',
    checks: [
      {
        dayNumber: 0,
        date: '10-Sep-2026',
        photoUrl: '/samples/paddy-blight.jpg',
        observedSymptoms: 'Spindle-shaped necrotic lesions with grey centers on upper canopy leaves.',
        recoveryPercentage: 0,
        aiFeedback: 'Baseline established: 25% foliage coverage.',
        actionAdvice: 'Complete tank spray early morning under low wind conditions.',
      },
      {
        dayNumber: 3,
        date: '13-Sep-2026',
        photoUrl: '/samples/paddy-blight.jpg',
        observedSymptoms: 'Lesion edges dried and turned dark brown; no new yellow margins.',
        recoveryPercentage: 60,
        aiFeedback: 'Positive response: Spore spread arrested.',
        actionAdvice: 'Maintain alternate wetting and drying; do not apply excess urea.',
      },
      {
        dayNumber: 7,
        date: '16-Sep-2026',
        observedSymptoms: 'Fresh green tillers emerging without lesions. 85% canopy clean.',
        recoveryPercentage: 85,
        aiFeedback: 'Strong recovery observed. Fungal sporulation suppressed.',
        actionAdvice: 'Monitor tillering stage. No further chemical spray required unless rainfall >25mm.',
      },
    ],
  },
  {
    id: 'TRK-2026-102',
    cropName: 'Cotton',
    cropHindi: 'कपास',
    farmerName: 'Narayan Rao',
    village: 'Wardha Rural',
    diagnosisTitle: 'Pink Bollworm square infestation',
    treatmentPrescribed: 'Chlorantraniliprole 18.5% SC @ 0.3 ml/liter + 5 Pheromone Traps',
    chemicalUsed: 'Chlorantraniliprole 18.5% SC',
    chemicalBrand: 'Coragen',
    batchNumber: 'FMC-2026-B812',
    startDate: '08-Sep-2026',
    initialPhotoUrl: '/samples/cotton-crop.jpg',
    confirmedRecoveryPercent: 95,
    overallStatus: 'completed',
    fieldConfirmation: 'fully_cured',
    checks: [
      {
        dayNumber: 0,
        date: '08-Sep-2026',
        photoUrl: '/samples/cotton-crop.jpg',
        observedSymptoms: 'Rosette flowers with trapped larvae in 15% squares.',
        recoveryPercentage: 0,
        aiFeedback: 'Baseline established: Exceeds 8% threshold.',
        actionAdvice: 'Install pheromone lures immediately and apply ovicidal spray.',
      },
      {
        dayNumber: 3,
        date: '11-Sep-2026',
        observedSymptoms: 'Trap catches decreased from 14 to 2 moths per night.',
        recoveryPercentage: 70,
        aiFeedback: 'Larval feeding stopped.',
        actionAdvice: 'Collect remaining fallen rosette flowers by hand.',
      },
      {
        dayNumber: 7,
        date: '15-Sep-2026',
        observedSymptoms: 'New squares forming cleanly with no entry holes.',
        recoveryPercentage: 95,
        aiFeedback: 'Full containment achieved. Pest below economic threshold.',
        actionAdvice: 'Continue trap monitoring weekly.',
      },
    ],
  },
];

export function FollowUpTracker({ currentLanguage, initialNewTrackPrefill, onNavigateToDoctor }: Props) {
  const [tracks, setTracks] = useState<TreatmentFollowUpTrack[]>(() => {
    try {
      const saved = localStorage.getItem('kisan_treatment_tracks');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return DEFAULT_TRACKS;
  });

  const [selectedTrack, setSelectedTrack] = useState<TreatmentFollowUpTrack | null>(tracks[0] || null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [showNewModal, setShowNewModal] = useState<boolean>(Boolean(initialNewTrackPrefill));
  const [filterStatus, setFilterStatus] = useState<'all' | 'improving' | 'completed' | 'resistance'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New track form state
  const [newTrackForm, setNewTrackForm] = useState({
    cropName: initialNewTrackPrefill?.cropName || 'Tomato',
    diagnosisTitle: initialNewTrackPrefill?.diagnosisTitle || 'Early Blight & Foliar Spots',
    treatmentPrescribed: initialNewTrackPrefill?.treatmentPrescribed || 'Mancozeb 75% WP @ 2.5 g/liter',
    chemicalUsed: 'Mancozeb 75% WP',
    chemicalBrand: 'Dithane M-45',
    batchNumber: 'IND-2026-M49',
    farmerName: 'Farmer Self',
    village: 'Local Shivar',
    photoUrl: initialNewTrackPrefill?.photoUrl || '/samples/tomato-leaf.jpg',
  });

  // Check-in / progress modal state
  const [showCheckInModal, setShowCheckInModal] = useState<boolean>(false);
  const [checkInDay, setCheckInDay] = useState<3 | 7 | 14>(7);
  const [checkInSymptoms, setCheckInSymptoms] = useState<string>('');
  const [checkInRecovery, setCheckInRecovery] = useState<number>(75);
  const [checkInFeedback, setCheckInFeedback] = useState<'fully_cured' | 'partially_controlled' | 'no_effect_resistance'>('partially_controlled');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const saveTracksToStorage = (updated: TreatmentFollowUpTrack[]) => {
    setTracks(updated);
    try {
      localStorage.setItem('kisan_treatment_tracks', JSON.stringify(updated));
    } catch (_) {}
  };

  // Submit new follow-up tracking case
  const handleCreateNewTrack = (e: React.FormEvent) => {
    e.preventDefault();
    const newTrack: TreatmentFollowUpTrack = {
      id: `TRK-2026-${Math.floor(100 + Math.random() * 900)}`,
      cropName: newTrackForm.cropName,
      farmerName: newTrackForm.farmerName,
      village: newTrackForm.village,
      diagnosisTitle: newTrackForm.diagnosisTitle,
      treatmentPrescribed: newTrackForm.treatmentPrescribed,
      chemicalUsed: newTrackForm.chemicalUsed,
      chemicalBrand: newTrackForm.chemicalBrand,
      batchNumber: newTrackForm.batchNumber,
      startDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      initialPhotoUrl: newTrackForm.photoUrl,
      confirmedRecoveryPercent: 0,
      overallStatus: 'improving',
      checks: [
        {
          dayNumber: 0,
          date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          photoUrl: newTrackForm.photoUrl,
          observedSymptoms: 'Initial baseline diagnosis recorded. Treatment initiated today.',
          recoveryPercentage: 0,
          aiFeedback: 'Baseline established. Scheduled check-ins set for Day 3, Day 7, and Day 14.',
          actionAdvice: 'Ensure uniform spray coverage under leaves; avoid spraying if rain expected.',
        },
      ],
    };

    const updated = [newTrack, ...tracks];
    saveTracksToStorage(updated);
    setSelectedTrack(newTrack);
    setShowNewModal(false);
    showToast(`New tracking case created for ${newTrack.cropName}! Day 3 check-in scheduled.`);
  };

  // Record Day Check-in & Field Confirmation Feedback
  const handleRecordCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrack) return;

    let aiFeedback = 'Progress recorded by farmer.';
    let actionAdvice = 'Continue normal scouting.';
    let overallStatus: TreatmentFollowUpTrack['overallStatus'] = 'improving';
    let resistanceFlagged = false;
    let alertMsg = '';

    if (checkInFeedback === 'no_effect_resistance') {
      overallStatus = 'deteriorating';
      resistanceFlagged = true;
      aiFeedback = 'CRITICAL ALERT: Treatment showed NO response or pathogen worsened. High risk of chemical resistance or counterfeit formulation.';
      actionAdvice = 'STOP using this chemical batch. Rotate to an alternate chemical class (e.g. switch to Strobilurin or Bio-control) and alert KVK Extension Officer.';
      alertMsg = `Resistance alert logged for ${selectedTrack.chemicalUsed} (${selectedTrack.chemicalBrand})! Extension officers notified.`;
    } else if (checkInFeedback === 'fully_cured') {
      overallStatus = 'completed';
      aiFeedback = 'Complete recovery verified. Crop foliage healthy and sporulation arrested.';
      actionAdvice = 'Routine nutrient management only. No further fungicides required.';
    } else {
      overallStatus = 'improving';
      aiFeedback = 'Lesions shrinking and pest damage arrested.';
      actionAdvice = 'Observe for 4 more days before Day 14 final clearance.';
    }

    const newCheck: FollowUpDayCheck = {
      dayNumber: checkInDay,
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      photoUrl: selectedTrack.initialPhotoUrl,
      observedSymptoms: checkInSymptoms || `${checkInFeedback.replace('_', ' ')}: ${checkInRecovery}% recovery reported`,
      recoveryPercentage: checkInRecovery,
      aiFeedback,
      actionAdvice,
    };

    const updated = tracks.map((trk) => {
      if (trk.id === selectedTrack.id) {
        return {
          ...trk,
          confirmedRecoveryPercent: checkInRecovery,
          overallStatus,
          fieldConfirmation: checkInFeedback,
          resistanceFlagged,
          resistanceAlertMessage: alertMsg || undefined,
          lastFeedbackDate: new Date().toLocaleDateString('en-IN'),
          checks: [...trk.checks.filter((c) => c.dayNumber !== checkInDay), newCheck].sort((a, b) => a.dayNumber - b.dayNumber),
        };
      }
      return trk;
    });

    saveTracksToStorage(updated);
    const updatedSelected = updated.find((t) => t.id === selectedTrack.id) || null;
    setSelectedTrack(updatedSelected);
    setShowCheckInModal(false);
    setCheckInSymptoms('');
    showToast(alertMsg || `Day ${checkInDay} check-in saved! Recovery updated to ${checkInRecovery}%.`);
  };

  // Voice speech synthesis
  const handleToggleVoice = (text: string) => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      speakAdvisory(text, currentLanguage, () => {
        setIsSpeaking(false);
      });
    }
  };

  const filteredTracks = tracks.filter((t) => {
    if (filterStatus === 'improving') return t.overallStatus === 'improving';
    if (filterStatus === 'completed') return t.overallStatus === 'completed';
    if (filterStatus === 'resistance') return t.resistanceFlagged;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-emerald-500 flex items-center gap-2.5 animate-bounce text-xs font-bold">
          <CheckCircle2 className="w-5 h-5 text-amber-300 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Banner */}
      <section className="bg-gradient-to-r from-emerald-900 via-teal-900 to-stone-900 text-white p-5 sm:p-6 rounded-3xl shadow-md border border-emerald-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-emerald-950 text-xs font-black uppercase tracking-wider shadow-xs">
                <RotateCcw className="w-3.5 h-3.5" />
                SIH Problem Module
              </span>
              <span className="text-xs text-emerald-200">
                0-Day • 3-Day • 7-Day • 14-Day Audit & Chemical Resistance Tracker
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {formatBilingual(
                'Follow-up Monitoring & Field Feedback System',
                'followUpTitle',
                currentLanguage.code
              )}
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              Track multi-day recovery following treatment sprays. Compare before/after symptoms, verify cure percentage,
              and detect <strong>chemical resistance or fake formulations</strong> before crop loss occurs.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-xs shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Start New Treatment Tracker</span>
            </button>
          </div>
        </div>
      </section>

      {/* Quick Filters */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pb-1">
        <div className="flex items-center gap-2">
          {(['all', 'improving', 'completed', 'resistance'] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setFilterStatus(filter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all border ${
                filterStatus === filter
                  ? filter === 'resistance'
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-emerald-800 text-white border-emerald-800'
                  : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
              }`}
            >
              {filter === 'all'
                ? `All Tracks (${tracks.length})`
                : filter === 'improving'
                ? 'Active / Improving'
                : filter === 'completed'
                ? '100% Cured'
                : 'Resistance Flagged'}
            </button>
          ))}
        </div>

        <span className="text-xs text-stone-400 font-semibold hidden sm:inline">
          Automatic timeline reminders for day 3 & 7
        </span>
      </div>

      {/* 2-Column Layout: Left (Track List), Right (Active Track Progression & Timeline) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left List of Tracks */}
        <div className="lg:col-span-4 space-y-3">
          <h4 className="text-xs font-black text-stone-500 uppercase tracking-wide">
            Tracked Treatment Cases
          </h4>

          {filteredTracks.map((trk) => {
            const isSelected = selectedTrack?.id === trk.id;
            return (
              <div
                key={trk.id}
                onClick={() => setSelectedTrack(trk)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5 text-left ${
                  isSelected
                    ? 'bg-emerald-50/50 border-emerald-600 shadow-xs ring-1 ring-emerald-600'
                    : 'bg-white border-stone-200 hover:border-stone-400'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-stone-400 block">
                      {trk.id} • Started {trk.startDate}
                    </span>
                    <h5 className="font-black text-sm text-stone-900 mt-0.5">
                      {trk.cropName} {trk.cropHindi && `(${trk.cropHindi})`}
                    </h5>
                  </div>
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      trk.resistanceFlagged
                        ? 'bg-red-100 text-red-700 animate-pulse'
                        : trk.overallStatus === 'completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {trk.resistanceFlagged ? 'Resistance Flagged' : trk.overallStatus}
                  </span>
                </div>

                <div className="text-xs text-stone-600 line-clamp-1">
                  <strong>Issue:</strong> {trk.diagnosisTitle}
                </div>

                {/* Mini Recovery Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-stone-500 font-semibold">Recovery Rate</span>
                    <span className="font-extrabold text-emerald-700">{trk.confirmedRecoveryPercent}%</span>
                  </div>
                  <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        trk.resistanceFlagged
                          ? 'bg-red-500'
                          : trk.confirmedRecoveryPercent >= 90
                          ? 'bg-emerald-600'
                          : 'bg-blue-500'
                      }`}
                      style={{ width: `${trk.confirmedRecoveryPercent}%` }}
                    ></div>
                  </div>
                </div>

                <div className="text-[11px] text-stone-400 font-mono flex items-center justify-between">
                  <span>{trk.checks.length} check-in(s) recorded</span>
                  <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Selected Track Detailed Timeline & Action Hub */}
        {selectedTrack && (
          <div className="lg:col-span-8 space-y-5">
            
            {/* Top Detail Card */}
            <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-stone-500">
                      {selectedTrack.id}
                    </span>
                    <span className="text-xs text-stone-400">• Farmer: {selectedTrack.farmerName} ({selectedTrack.village})</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-stone-900 mt-0.5">
                    {selectedTrack.cropName} — {selectedTrack.diagnosisTitle}
                  </h3>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowCheckInModal(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log Day Progress Check-in</span>
                  </button>
                </div>
              </div>

              {/* Chemical Applied & Dosage Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-stone-400 uppercase">
                    Prescribed Treatment Spray
                  </span>
                  <div className="font-bold text-stone-900">{selectedTrack.treatmentPrescribed}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-stone-400 uppercase">
                    Formulation & Batch Audit
                  </span>
                  <div className="text-stone-700">
                    <strong>{selectedTrack.chemicalBrand || selectedTrack.chemicalUsed || 'Standard CIBRC'}</strong>
                    {selectedTrack.batchNumber && (
                      <span className="text-stone-400 font-mono ml-2">(Batch: {selectedTrack.batchNumber})</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Resistance Warning Banner if Flagged */}
              {selectedTrack.resistanceFlagged && (
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-300 text-red-950 text-xs space-y-1.5 animate-pulse">
                  <div className="flex items-center gap-2 font-black text-red-700">
                    <ShieldAlert className="w-4 h-4" />
                    <span>CHEMICAL RESISTANCE DETECTED (NO CLINICAL RESPONSE)</span>
                  </div>
                  <p className="text-red-900">
                    Farmer confirmed zero response following application. This active ingredient ({selectedTrack.chemicalUsed})
                    has likely encountered pathogen tolerance or a counterfeit batch. Rotational bio-control or an alternate chemical class is mandated.
                  </p>
                </div>
              )}

              {/* Day Timeline (0, 3, 7, 14) */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-stone-700 uppercase tracking-wide flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-700" />
                    Recovery Progression Timeline
                  </h4>
                  <span className="text-[11px] text-stone-400">
                    Current Recovery: <strong>{selectedTrack.confirmedRecoveryPercent}%</strong>
                  </span>
                </div>

                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
                  {selectedTrack.checks.map((check, idx) => (
                    <div key={idx} className="relative space-y-2">
                      <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-emerald-600 border-2 border-white shadow-xs flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                      </div>

                      <div className="p-4 rounded-2xl bg-stone-50/80 border border-stone-200 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-stone-200/60 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-md">
                              Day {check.dayNumber} Check
                            </span>
                            <span className="text-xs font-semibold text-stone-600">
                              {check.date}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-stone-700">
                              Recovery: <strong className="text-emerald-700">{check.recoveryPercentage}%</strong>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleToggleVoice(`${check.observedSymptoms}. ${check.aiFeedback} ${check.actionAdvice}`)}
                              className="p-1 rounded-md text-stone-500 hover:text-emerald-700"
                              title="Listen voice audio"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="text-xs text-stone-700">
                          <strong>Field Observation:</strong> {check.observedSymptoms}
                        </div>

                        <div className="p-2.5 rounded-xl bg-white border border-stone-200 text-xs text-stone-700 space-y-1">
                          <div className="font-bold text-stone-900 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            AI Agronomist Feedback:
                          </div>
                          <p className="text-stone-800">{check.aiFeedback}</p>
                          <div className="text-emerald-800 font-medium pt-0.5">
                            <strong>Action:</strong> {check.actionAdvice}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Log Progress Check-in Modal */}
      {showCheckInModal && selectedTrack && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-stone-200 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-base font-black text-stone-900">
                  Log Field Check-in & Recovery Feedback
                </h3>
                <p className="text-xs text-stone-500">{selectedTrack.cropName} • {selectedTrack.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCheckInModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordCheckIn} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700">Audit Milestone</label>
                <div className="grid grid-cols-3 gap-2">
                  {([3, 7, 14] as const).map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setCheckInDay(day)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        checkInDay === day
                          ? 'bg-emerald-800 text-white border-emerald-800'
                          : 'bg-stone-50 text-stone-700 border-stone-200'
                      }`}
                    >
                      Day {day} Post-Spray
                    </button>
                  ))}
                </div>
              </div>

              {/* Recovery Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700">
                  Farmer Field Evaluation & Chemical Response:
                </label>
                <div className="grid grid-cols-1 gap-2">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-stone-200 hover:bg-emerald-50/50 cursor-pointer text-xs">
                    <input
                      type="radio"
                      name="feedback"
                      checked={checkInFeedback === 'partially_controlled'}
                      onChange={() => {
                        setCheckInFeedback('partially_controlled');
                        setCheckInRecovery(75);
                      }}
                      className="accent-emerald-700"
                    />
                    <div>
                      <strong className="text-stone-900">Partially Controlled (Improving)</strong>
                      <span className="block text-stone-500 text-[11px]">Lesion spread halted, fresh shoots emerging clean.</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-stone-200 hover:bg-emerald-50/50 cursor-pointer text-xs">
                    <input
                      type="radio"
                      name="feedback"
                      checked={checkInFeedback === 'fully_cured'}
                      onChange={() => {
                        setCheckInFeedback('fully_cured');
                        setCheckInRecovery(100);
                      }}
                      className="accent-emerald-700"
                    />
                    <div>
                      <strong className="text-stone-900">Fully Cured (100% Recovery)</strong>
                      <span className="block text-stone-500 text-[11px]">No active spores or pests. Crop fully healthy.</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-red-200 hover:bg-red-50/50 cursor-pointer text-xs">
                    <input
                      type="radio"
                      name="feedback"
                      checked={checkInFeedback === 'no_effect_resistance'}
                      onChange={() => {
                        setCheckInFeedback('no_effect_resistance');
                        setCheckInRecovery(10);
                      }}
                      className="accent-red-600"
                    />
                    <div>
                      <strong className="text-red-700">No Effect / Symptoms Worsened (Flag Resistance)</strong>
                      <span className="block text-red-600 text-[11px]">Chemical showed zero efficacy. Alerts extension officers immediately.</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Observed Symptoms Text */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700">Observed Leaf / Crop Condition</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Lesions are dried up, no new yellow rings around leaf spots..."
                  value={checkInSymptoms}
                  onChange={(e) => setCheckInSymptoms(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-emerald-700"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <FileCheck className="w-4 h-4 text-amber-300" />
                <span>Save Milestone & Update Recovery Record</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Start New Tracker Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-stone-200 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-base font-black text-stone-900">
                  Initiate Multi-Day Treatment Tracker
                </h3>
                <p className="text-xs text-stone-500">Record baseline and verify chemical performance over 14 days.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewTrack} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">Crop Name</label>
                  <input
                    type="text"
                    required
                    value={newTrackForm.cropName}
                    onChange={(e) => setNewTrackForm({ ...newTrackForm, cropName: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">Farmer / Field</label>
                  <input
                    type="text"
                    required
                    value={newTrackForm.farmerName}
                    onChange={(e) => setNewTrackForm({ ...newTrackForm, farmerName: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">Diagnosed Disease or Pest</label>
                <input
                  type="text"
                  required
                  value={newTrackForm.diagnosisTitle}
                  onChange={(e) => setNewTrackForm({ ...newTrackForm, diagnosisTitle: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">Prescribed Treatment & Spray</label>
                <input
                  type="text"
                  required
                  value={newTrackForm.treatmentPrescribed}
                  onChange={(e) => setNewTrackForm({ ...newTrackForm, treatmentPrescribed: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">Chemical Brand Applied</label>
                  <input
                    type="text"
                    value={newTrackForm.chemicalBrand}
                    onChange={(e) => setNewTrackForm({ ...newTrackForm, chemicalBrand: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">Batch # on Container</label>
                  <input
                    type="text"
                    value={newTrackForm.batchNumber}
                    onChange={(e) => setNewTrackForm({ ...newTrackForm, batchNumber: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4 text-amber-300" />
                <span>Start Follow-up Tracking Protocol</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
