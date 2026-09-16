import React, { useState } from 'react';
import {
  RegionalLanguage,
  OfficerValidationItem,
  LabSampleReferral,
  ExtensionBroadcastAlert,
  ExtensionDashboardSummary,
} from '../types';
import { formatBilingual } from '../utils/translations';
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  Send,
  FlaskRound,
  FileCheck,
  Radio,
  Users,
  MapPin,
  Phone,
  Search,
  Filter,
  Check,
  X,
  ExternalLink,
  Download,
  Clock,
  Sparkles,
  Building2,
  Eye,
} from 'lucide-react';

interface Props {
  currentLanguage: RegionalLanguage;
  onSelectCropForDoctor?: (cropName: string) => void;
}

const INITIAL_SUMMARY: ExtensionDashboardSummary = {
  activeHotspotsCount: 8,
  pendingValidationCount: 5,
  labSamplesUnderAnalysisCount: 3,
  totalBroadcastsThisWeek: 12,
  totalFarmersUnderSurveillance: 3420,
  resistanceAlertsCount: 2,
};

const INITIAL_QUEUE: OfficerValidationItem[] = [
  {
    id: 'CASE-2026-081',
    farmerName: 'Rameshwar Patil',
    farmerPhone: '+91 98221 44512',
    village: 'Pimpalgaon Baswant',
    district: 'Nashik',
    crop: 'Tomato',
    aiDiagnosis: 'Late Blight (Phytophthora infestans) & Early Spotting',
    aiConfidenceScore: 78,
    reportedTime: '2 hours ago',
    severity: 'high',
    photoUrl: '/samples/tomato-leaf.jpg',
    status: 'pending',
  },
  {
    id: 'CASE-2026-082',
    farmerName: 'Suresh Chandra Gowda',
    farmerPhone: '+91 94481 99201',
    village: 'Channagiri Rural',
    district: 'Davanagere',
    crop: 'Paddy / Rice',
    aiDiagnosis: 'Bacterial Leaf Blight (Xanthomonas oryzae)',
    aiConfidenceScore: 71,
    reportedTime: '3.5 hours ago',
    severity: 'high',
    photoUrl: '/samples/paddy-blight.jpg',
    status: 'pending',
  },
  {
    id: 'CASE-2026-083',
    farmerName: 'Balwant Singh Dhillon',
    farmerPhone: '+91 98765 12093',
    village: 'Kotkapura Shivar',
    district: 'Faridkot',
    crop: 'Cotton',
    aiDiagnosis: 'Pink Bollworm square infestation (Pectinophora gossypiella)',
    aiConfidenceScore: 84,
    reportedTime: '5 hours ago',
    severity: 'high',
    photoUrl: '/samples/cotton-crop.jpg',
    status: 'pending',
  },
  {
    id: 'CASE-2026-084',
    farmerName: 'Anil Kumar Verma',
    farmerPhone: '+91 93351 88231',
    village: 'Mohanlalganj',
    district: 'Lucknow',
    crop: 'Wheat',
    aiDiagnosis: 'Yellow / Stripe Rust early pustules (Puccinia striiformis)',
    aiConfidenceScore: 89,
    reportedTime: '1 day ago',
    severity: 'moderate',
    photoUrl: '/samples/wheat-crop.jpg',
    status: 'verified_by_officer',
    officerDiagnosis: 'Confirmed Yellow Rust. Spray Propiconazole 25 EC.',
    officialPrescriptionId: 'KVK-LKO-RX-9821',
    reviewedBy: 'Dr. S. K. Awasthi (Sr. Pathologist, KVK)',
    reviewedAt: 'Yesterday 4:15 PM',
  },
];

const INITIAL_LAB_REFERRALS: LabSampleReferral[] = [
  {
    sampleId: 'LAB-ICAR-2026-301',
    farmerName: 'Gajanan More',
    village: 'Niphad Shivar, Nashik',
    crop: 'Grapes / Horticultural',
    suspectedPathogen: 'Suspected Downy Mildew Fungicide Resistance (Metalaxyl)',
    specimenType: 'leaf_tissue',
    targetLab: 'National Research Centre for Grapes (NRCG) Pathology Core',
    status: 'testing_in_progress',
    dispatchDate: '14-Sep-2026',
    expectedReportDate: '18-Sep-2026',
    labTechnician: 'Dr. V. Deshmukh',
  },
  {
    sampleId: 'LAB-ICAR-2026-302',
    farmerName: 'Venkat Rao',
    village: 'Bapatla Delta, Guntur',
    crop: 'Paddy',
    suspectedPathogen: 'Sheath Rot complex / Fusarium co-infection',
    specimenType: 'stem_cross_section',
    targetLab: 'ICAR-Indian Institute of Rice Research (IIRR) Hyderabad',
    status: 'in_transit',
    dispatchDate: '15-Sep-2026',
    expectedReportDate: '19-Sep-2026',
    labTechnician: 'Courier Dispatch tracking #APH-4921',
  },
  {
    sampleId: 'LAB-ICAR-2026-299',
    farmerName: 'Harjit Sandhu',
    village: 'Khanna Block, Ludhiana',
    crop: 'Basmati Rice',
    suspectedPathogen: 'Foot Rot / Bakanae disease',
    specimenType: 'root_core',
    targetLab: 'Punjab Agricultural University (PAU) Plant Pathology Lab',
    status: 'report_ready',
    dispatchDate: '10-Sep-2026',
    expectedReportDate: '14-Sep-2026',
    labResultSummary: 'Fusarium fujikuroi positive. Advised seed treatment with Trichoderma + carbendazim for future nursery.',
    labTechnician: 'Dr. P. S. Brar',
  },
];

const INITIAL_BROADCASTS: ExtensionBroadcastAlert[] = [
  {
    id: 'BC-2026-44',
    timestamp: 'Today, 08:30 AM',
    title: 'High Humidity Rice Blast Warning - 15km Perimeter',
    targetDistrict: 'Nashik & Godavari Basin',
    targetMandalOrVillages: ['Pimpalgaon', 'Niphad', 'Ozar', 'Dindori'],
    crop: 'Paddy / Rice',
    diseaseOrPest: 'Leaf & Neck Blast (Pyricularia oryzae)',
    severity: 'critical',
    warningMessage: 'Relative Humidity >90% forecasted for next 48h. Prophylactic Tricyclazole 75 WP spray recommended immediately for BPT-5204.',
    farmersReachedCount: 1420,
    deliveryChannels: ['SMS Gateway', 'WhatsApp Krishi Cell', 'KVK Audio Push'],
    dispatchedBy: 'District Ag Officer (DAO) Nashik',
  },
  {
    id: 'BC-2026-43',
    timestamp: 'Yesterday, 04:00 PM',
    title: 'Fall Armyworm Trap Surge Alert',
    targetDistrict: 'Dharwad',
    targetMandalOrVillages: ['Navalgund', 'Hubballi Rural'],
    crop: 'Maize',
    diseaseOrPest: 'Fall Armyworm (Spodoptera frugiperda)',
    severity: 'high',
    warningMessage: 'Pheromone trap catch crossed 14 moths/trap. Inspect whorls immediately and apply sand-lime mixture or Emamectin benzoate.',
    farmersReachedCount: 890,
    deliveryChannels: ['SMS Gateway', 'Krishi Seva Kendra Notice'],
    dispatchedBy: 'KVK Agronomist Team',
  },
];

export function ExtensionWorkerDashboard({ currentLanguage, onSelectCropForDoctor }: Props) {
  const [activeTab, setActiveTab] = useState<'validation' | 'lab' | 'broadcast' | 'surveillance'>('validation');
  const [validationQueue, setValidationQueue] = useState<OfficerValidationItem[]>(INITIAL_QUEUE);
  const [labReferrals, setLabReferrals] = useState<LabSampleReferral[]>(INITIAL_LAB_REFERRALS);
  const [broadcasts, setBroadcasts] = useState<ExtensionBroadcastAlert[]>(INITIAL_BROADCASTS);
  const [selectedCase, setSelectedCase] = useState<OfficerValidationItem | null>(null);
  const [officerReviewNotes, setOfficerReviewNotes] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // New broadcast form state
  const [newBroadcast, setNewBroadcast] = useState({
    title: '',
    district: 'Nashik',
    villages: 'Pimpalgaon, Niphad, Ozar',
    crop: 'Paddy / Rice',
    disease: 'Pyricularia oryzae (Blast)',
    severity: 'critical' as 'critical' | 'high',
    message: '',
  });

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // Officer action: Validate & Approve
  const handleApproveCase = (item: OfficerValidationItem) => {
    const rxId = `KVK-OFFICER-RX-${Math.floor(1000 + Math.random() * 9000)}`;
    const updated = validationQueue.map((c) => {
      if (c.id === item.id) {
        return {
          ...c,
          status: 'verified_by_officer' as const,
          officerDiagnosis: officerReviewNotes || `Verified as ${c.aiDiagnosis}. Prescribed CIBRC certified protocol.`,
          officialPrescriptionId: rxId,
          reviewedBy: 'Agriculture Extension Officer (AEO) Field Unit',
          reviewedAt: 'Just now',
          notes: officerReviewNotes,
        };
      }
      return c;
    });
    setValidationQueue(updated);
    setSelectedCase(null);
    setOfficerReviewNotes('');
    showToast(`Case ${item.id} validated! Official prescription ${rxId} sent to farmer via SMS & WhatsApp.`);
  };

  // Officer action: Refer to Lab
  const handleReferToLab = (item: OfficerValidationItem) => {
    const sampleId = `LAB-ICAR-${Date.now().toString().slice(-6)}`;
    const newLabSample: LabSampleReferral = {
      sampleId,
      farmerName: item.farmerName,
      village: `${item.village}, ${item.district}`,
      crop: item.crop,
      suspectedPathogen: `Deep confirmation: ${item.aiDiagnosis}`,
      specimenType: 'leaf_tissue',
      targetLab: 'Regional Plant Health Diagnostic Laboratory (ICAR-SAU)',
      status: 'sample_collected',
      dispatchDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      expectedReportDate: '3-4 working days',
      labTechnician: 'Sample barcode generated for field courier pickup',
    };

    setLabReferrals([newLabSample, ...labReferrals]);
    const updated = validationQueue.map((c) => (c.id === item.id ? { ...c, status: 'lab_referred' as const } : c));
    setValidationQueue(updated);
    setSelectedCase(null);
    showToast(`Sample barcode ${sampleId} generated! Courier pickup requested for accredited ICAR lab.`);
  };

  // Dispatch new broadcast
  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBroadcast.title || !newBroadcast.message) return;

    const reach = Math.floor(800 + Math.random() * 1200);
    const item: ExtensionBroadcastAlert = {
      id: `BC-2026-${Math.floor(50 + Math.random() * 50)}`,
      timestamp: 'Just now',
      title: newBroadcast.title,
      targetDistrict: newBroadcast.district,
      targetMandalOrVillages: newBroadcast.villages.split(',').map((v) => v.trim()),
      crop: newBroadcast.crop,
      diseaseOrPest: newBroadcast.disease,
      severity: newBroadcast.severity,
      warningMessage: newBroadcast.message,
      farmersReachedCount: reach,
      deliveryChannels: ['SMS Priority Gateway', 'WhatsApp Community Push', 'Kisan Seva Kendra Siren'],
      dispatchedBy: 'Duty Extension Officer',
    };

    setBroadcasts([item, ...broadcasts]);
    setNewBroadcast({
      title: '',
      district: 'Nashik',
      villages: 'Pimpalgaon, Niphad, Ozar',
      crop: 'Paddy / Rice',
      disease: 'Pyricularia oryzae (Blast)',
      severity: 'critical',
      message: '',
    });
    showToast(`Early warning alert dispatched to ${reach} registered farmers across ${item.targetDistrict}!`);
  };

  const filteredQueue = validationQueue.filter((item) => {
    const q = searchFilter.toLowerCase();
    return (
      item.farmerName.toLowerCase().includes(q) ||
      item.crop.toLowerCase().includes(q) ||
      item.village.toLowerCase().includes(q) ||
      item.aiDiagnosis.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-emerald-500 flex items-center gap-2.5 animate-bounce text-xs font-bold">
          <CheckCircle2 className="w-5 h-5 text-amber-300 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Top Header Banner for Extension Officials */}
      <section className="bg-gradient-to-r from-teal-950 via-emerald-950 to-stone-950 text-white p-5 sm:p-6 rounded-3xl shadow-md border border-teal-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-400 text-teal-950 text-xs font-black uppercase tracking-wider shadow-xs">
                <Building2 className="w-3.5 h-3.5" />
                Department of Agriculture & KVK
              </span>
              <span className="text-xs text-teal-200">
                Official Surveillance & Rapid Response Console
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {formatBilingual(
                'Agriculture Official & Extension Worker Dashboard',
                'extensionDashboardTitle',
                currentLanguage.code
              )}
            </h2>
            <p className="text-xs sm:text-sm text-teal-100/90 leading-relaxed">
              Empowering Extension Officers, KVK Scientists, and Field Staff to audit AI diagnoses, track tissue lab cultures,
              and dispatch emergency community broadcasts before epidemics spread.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-emerald-800/70 border border-emerald-600/70 text-xs font-bold text-emerald-100">
              <Shield className="w-4 h-4 text-amber-300" />
              <span>Duty Officer: AEO Zone-3 Active</span>
            </span>
          </div>
        </div>
      </section>

      {/* Metric Stat Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wide">
            Surveillance Zones
          </span>
          <div className="text-2xl font-black text-stone-900">
            {INITIAL_SUMMARY.activeHotspotsCount}
          </div>
          <span className="text-[10px] text-red-600 font-bold">2 high spore clusters</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wide">
            Pending Reviews
          </span>
          <div className="text-2xl font-black text-amber-600">
            {validationQueue.filter((q) => q.status === 'pending').length}
          </div>
          <span className="text-[10px] text-amber-700 font-bold">Needs agronomist sign-off</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wide">
            Lab Referrals
          </span>
          <div className="text-2xl font-black text-teal-700">
            {labReferrals.length}
          </div>
          <span className="text-[10px] text-teal-700 font-bold">ICAR / SAU testing</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wide">
            Alerts Sent
          </span>
          <div className="text-2xl font-black text-emerald-800">
            {broadcasts.length}
          </div>
          <span className="text-[10px] text-stone-400">Multi-village reach</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wide">
            Farmers Protected
          </span>
          <div className="text-2xl font-black text-stone-900">
            3,420
          </div>
          <span className="text-[10px] text-emerald-700 font-bold">Active in cell boundary</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wide">
            Resistance Flags
          </span>
          <div className="text-2xl font-black text-red-600">
            {INITIAL_SUMMARY.resistanceAlertsCount}
          </div>
          <span className="text-[10px] text-red-700 font-bold">Chemical failure reports</span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-3 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('validation')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'validation'
              ? 'bg-teal-900 text-white shadow-xs'
              : 'text-stone-700 bg-white hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <FileCheck className="w-4 h-4 text-amber-300" />
          <span>Expert Validation Queue ({validationQueue.filter((q) => q.status === 'pending').length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('lab')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'lab'
              ? 'bg-teal-900 text-white shadow-xs'
              : 'text-stone-700 bg-white hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <FlaskRound className="w-4 h-4 text-teal-300" />
          <span>ICAR Lab Sample Referrals ({labReferrals.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('broadcast')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'broadcast'
              ? 'bg-teal-900 text-white shadow-xs'
              : 'text-stone-700 bg-white hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <Radio className="w-4 h-4 text-red-300" />
          <span>Rapid Community Broadcast ({broadcasts.length})</span>
        </button>
      </div>

      {/* TAB 1: EXPERT VALIDATION QUEUE */}
      {activeTab === 'validation' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-stone-200">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by farmer name, crop, village, or disease..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-stone-200 focus:outline-emerald-600"
              />
            </div>
            <div className="text-xs text-stone-500 font-semibold">
              Showing {filteredQueue.length} farm submissions under district review
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredQueue.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-2xl bg-white border transition-all space-y-3 ${
                  item.status === 'pending'
                    ? 'border-amber-300 shadow-2xs'
                    : item.status === 'verified_by_officer'
                    ? 'border-emerald-300 bg-emerald-50/20'
                    : 'border-stone-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2 border-b border-stone-100 pb-2.5">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-stone-900">{item.farmerName}</span>
                      <span className="text-[11px] font-mono text-stone-400 font-semibold">
                        {item.id}
                      </span>
                    </div>
                    <div className="text-xs text-stone-500 flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-stone-400" />
                      <span>
                        {item.village}, {item.district}
                      </span>
                      <span>•</span>
                      <Phone className="w-3 h-3 text-stone-400" />
                      <span>{item.farmerPhone}</span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                      item.status === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : item.status === 'verified_by_officer'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-teal-100 text-teal-800'
                    }`}
                  >
                    {item.status === 'pending'
                      ? 'Pending Sign-off'
                      : item.status === 'verified_by_officer'
                      ? 'Officer Verified'
                      : 'Referred to Lab'}
                  </span>
                </div>

                <div className="flex gap-3 items-center">
                  {item.photoUrl && (
                    <img
                      src={item.photoUrl}
                      alt={item.crop}
                      className="w-16 h-16 rounded-xl object-cover border border-stone-200 shrink-0"
                    />
                  )}
                  <div className="space-y-1 flex-1 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-stone-900">{item.crop}</span>
                      <span className="text-[11px] text-stone-400">• {item.reportedTime}</span>
                    </div>
                    <div className="text-stone-700">
                      <strong>AI Diagnosis:</strong> {item.aiDiagnosis}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-stone-500">
                      <span>Certainty: {item.aiConfidenceScore}%</span>
                      <span className="w-1 h-1 rounded-full bg-stone-300"></span>
                      <span className="font-bold text-red-600 uppercase">Severity: {item.severity}</span>
                    </div>
                  </div>
                </div>

                {/* If already verified */}
                {item.status === 'verified_by_officer' && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-emerald-900">
                      <span className="flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-700" />
                        Official Prescription Issued
                      </span>
                      <span className="font-mono text-[11px] text-emerald-700">
                        {item.officialPrescriptionId}
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-800">{item.officerDiagnosis}</p>
                    <div className="text-[10px] text-emerald-600 italic">
                      Signed: {item.reviewedBy} ({item.reviewedAt})
                    </div>
                  </div>
                )}

                {/* Review Action Controls */}
                {item.status === 'pending' && (
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setSelectedCase(item)}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-teal-800 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Review & Issue Prescription
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReferToLab(item)}
                      className="py-1.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <FlaskRound className="w-3.5 h-3.5 text-teal-700" />
                      Lab Sample
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Review Modal / Drawer when inspecting a pending case */}
          {selectedCase && (
            <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-stone-200 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div>
                    <h3 className="text-base font-black text-stone-900">
                      Expert Verification & Official Sign-off
                    </h3>
                    <p className="text-xs text-stone-500 font-mono">{selectedCase.id} • {selectedCase.farmerName}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCase(null)}
                    className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex gap-3 items-start bg-stone-50 p-3 rounded-2xl border border-stone-200">
                  {selectedCase.photoUrl && (
                    <img
                      src={selectedCase.photoUrl}
                      alt={selectedCase.crop}
                      className="w-20 h-20 rounded-xl object-cover border border-stone-300"
                    />
                  )}
                  <div className="text-xs space-y-1">
                    <div className="font-bold text-stone-900">{selectedCase.crop} - {selectedCase.village}</div>
                    <div className="text-stone-600">
                      <strong>AI Detected:</strong> {selectedCase.aiDiagnosis} ({selectedCase.aiConfidenceScore}%)
                    </div>
                    <div className="text-stone-500">Contact: {selectedCase.farmerPhone}</div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700">
                    Agronomist / Officer Official Advisory & Prescription:
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter confirmed diagnosis, recommended CIBRC registered active ingredient, and safe pre-harvest interval..."
                    value={officerReviewNotes}
                    onChange={(e) => setOfficerReviewNotes(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-teal-700 focus:ring-1 focus:ring-teal-700"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleApproveCase(selectedCase)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-amber-300" />
                    Authorize & Dispatch via WhatsApp/SMS
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReferToLab(selectedCase)}
                    className="py-2.5 px-4 rounded-xl bg-teal-100 hover:bg-teal-200 text-teal-900 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <FlaskRound className="w-4 h-4" />
                    Forward to ICAR Lab
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ICAR LAB SAMPLE REFERRALS */}
      {activeTab === 'lab' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-stone-200 flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
                <FlaskRound className="w-4 h-4 text-teal-700" />
                Laboratory Tissue & Soil Diagnostic Pipeline
              </h3>
              <p className="text-xs text-stone-500">
                Track tissue cultures, PCR molecular tests, and fungicide resistance assays with accredited institutes.
              </p>
            </div>
            <button
              type="button"
              onClick={() => showToast('Connecting to National Plant Diagnostic Laboratory Network (NPDN) API...')}
              className="px-3 py-1.5 rounded-xl bg-teal-50 text-teal-800 text-xs font-bold border border-teal-200 hover:bg-teal-100"
            >
              Sync NPDN Gateway
            </button>
          </div>

          <div className="space-y-3">
            {labReferrals.map((sample) => (
              <div
                key={sample.sampleId}
                className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                        {sample.sampleId}
                      </span>
                      <span className="font-bold text-sm text-stone-900">
                        {sample.crop} • {sample.farmerName}
                      </span>
                    </div>
                    <div className="text-xs text-stone-500 mt-0.5">
                      Origin: {sample.village} | Specimen: <strong className="capitalize">{sample.specimenType.replace('_', ' ')}</strong>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full self-start sm:self-auto ${
                      sample.status === 'report_ready'
                        ? 'bg-emerald-100 text-emerald-800'
                        : sample.status === 'testing_in_progress'
                        ? 'bg-amber-100 text-amber-800 animate-pulse'
                        : 'bg-stone-100 text-stone-700'
                    }`}
                  >
                    {sample.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-stone-700">
                  <div className="bg-stone-50 p-2.5 rounded-xl">
                    <span className="text-[11px] text-stone-400 block font-bold">Investigating Lab:</span>
                    <span className="font-semibold text-stone-900">{sample.targetLab}</span>
                    <div className="text-[11px] text-stone-500 mt-1">Officer / Tech: {sample.labTechnician}</div>
                  </div>

                  <div className="bg-stone-50 p-2.5 rounded-xl">
                    <span className="text-[11px] text-stone-400 block font-bold">Suspected Issue / Objective:</span>
                    <span className="font-medium text-stone-800">{sample.suspectedPathogen}</span>
                    <div className="text-[11px] text-stone-500 mt-1">Dispatched: {sample.dispatchDate} • Expected: {sample.expectedReportDate}</div>
                  </div>
                </div>

                {sample.labResultSummary && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      Diagnostic Pathology Finding & Recommendation:
                    </div>
                    <p className="text-stone-800 leading-relaxed">{sample.labResultSummary}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: RAPID COMMUNITY BROADCAST ALERT DISPATCHER */}
      {activeTab === 'broadcast' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* New Broadcast Trigger Form */}
          <div className="lg:col-span-6 bg-white p-5 rounded-3xl border border-stone-200 shadow-sm space-y-4">
            <div className="border-b border-stone-100 pb-3">
              <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
                <Radio className="w-4 h-4 text-red-600 animate-pulse" />
                Dispatch Early Warning Village Siren
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Send targeted SMS, WhatsApp, and Krishi Seva alert to farmers in high-risk microclimates.
              </p>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">Alert Headline</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Spore Drift Alert: Late Blight Threat Next 36h"
                  value={newBroadcast.title}
                  onChange={(e) => setNewBroadcast({ ...newBroadcast, title: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300 focus:outline-teal-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">Target District</label>
                  <input
                    type="text"
                    required
                    value={newBroadcast.district}
                    onChange={(e) => setNewBroadcast({ ...newBroadcast, district: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">Affected Crop</label>
                  <input
                    type="text"
                    required
                    value={newBroadcast.crop}
                    onChange={(e) => setNewBroadcast({ ...newBroadcast, crop: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">Target Mandals / Village Clusters</label>
                <input
                  type="text"
                  required
                  value={newBroadcast.villages}
                  onChange={(e) => setNewBroadcast({ ...newBroadcast, villages: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">Actionable Farmer Advisory Message</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Specific cultural step (e.g. drain standing water) and preventative spray with dilution per liter..."
                  value={newBroadcast.message}
                  onChange={(e) => setNewBroadcast({ ...newBroadcast, message: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-teal-700"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                Dispatch Perimeter Broadcast Warning (15 km Cell)
              </button>
            </form>
          </div>

          {/* Past Broadcast History */}
          <div className="lg:col-span-6 space-y-3">
            <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wide">
              Recent Dispatched Early Warnings
            </h4>

            {broadcasts.map((bc) => (
              <div
                key={bc.id}
                className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h5 className="font-black text-sm text-stone-900">{bc.title}</h5>
                    <div className="text-xs text-stone-500 mt-0.5">
                      {bc.targetDistrict} • {bc.crop} ({bc.timestamp})
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      bc.severity === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {bc.severity}
                  </span>
                </div>

                <p className="text-xs text-stone-700 bg-stone-50 p-2.5 rounded-xl leading-relaxed">
                  {bc.warningMessage}
                </p>

                <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
                  <span className="flex items-center gap-1 font-bold text-emerald-800">
                    <Users className="w-3.5 h-3.5" />
                    {bc.farmersReachedCount} farmers reached
                  </span>
                  <span>Dispatched by: {bc.dispatchedBy}</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  );
}
