export interface RegionalLanguage {
  code: string;
  name: string;
  nativeName: string;
  speechCode: string;
  greeting: string;
  placeholderText: string;
}

export const REGIONAL_LANGUAGES: RegionalLanguage[] = [
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    speechCode: 'hi-IN',
    greeting: 'नमस्ते किसान भाई! फसल या मिट्टी की तुरंत जांच करें',
    placeholderText: 'यहाँ बोलें या लिखें (जैसे: धान के पत्ते पीले क्यों पड़ रहे हैं?)',
  },
  {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    speechCode: 'te-IN',
    greeting: 'నమస్కారం రైతు మిత్రమా! పంట లేదా నేల ఆరోగ్యాన్ని పరీక్షించండి',
    placeholderText: 'ఇక్కడ మాట్లాడండి లేదా రాయండి (ఉదా: పత్తి ఆకులు ఎర్రబడుతున్నాయి ఎందుకు?)',
  },
  {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    speechCode: 'ta-IN',
    greeting: 'வணக்கம் விவசாய பெருமக்களே! பயிர் அல்லது மண் நலனை கண்டறியுங்கள்',
    placeholderText: 'இங்கு பேசுங்கள் அல்லது தட்டச்சு செய்யுங்கள் (எ.கா: நெல் இலைகள் மஞ்சள் ஆவது ஏன்?)',
  },
  {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    speechCode: 'kn-IN',
    greeting: 'ನಮಸ್ಕಾರ ರೈತ ಬಾಂಧವರೇ! ಬೆಳೆ ಅಥವಾ ಮಣ್ಣಿನ ಆರೋಗ್ಯ ಪರಿಶೀಲಿಸಿ',
    placeholderText: 'ಇಲ್ಲಿ ಧ್ವನಿಯಲ್ಲಿ ಮಾತನಾಡಿ ಅಥವಾ ಬರೆಯಿರಿ...',
  },
  {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    speechCode: 'mr-IN',
    greeting: 'नमस्कार शेतकरी मित्र! आपल्या पिकाचे किंवा मातीचे त्वरित निदान करा',
    placeholderText: 'येथे बोला किंवा लिहा (उदा: सोयाबीन पिकावर कीड पडली आहे)...',
  },
  {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    speechCode: 'bn-IN',
    greeting: 'নমস্কার কৃষক ভাই! আপনার ফসল বা মাটির স্বাস্থ্য পরীক্ষা করুন',
    placeholderText: 'এখানে কথা বলুন বা লিখুন...',
  },
  {
    code: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    speechCode: 'gu-IN',
    greeting: 'નમસ્તે ખેડૂત મિત્ર! પાક અથવા જમીનનું સચોટ નિદાન મેળવો',
    placeholderText: 'અહીં બોલો અથવા લખો...',
  },
  {
    code: 'pa',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    speechCode: 'pa-IN',
    greeting: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਕਿਸਾਨ ਵੀਰੋ! ਫਸਲ ਜਾਂ ਮਿੱਟੀ ਦੀ ਜਾਂਚ ਕਰੋ',
    placeholderText: 'ਇੱਥੇ ਬੋਲੋ ਜਾਂ ਲਿਖੋ...',
  },
  {
    code: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    speechCode: 'ml-IN',
    greeting: 'നമസ്കാരം കർഷക സുഹൃത്തേ! വിളയുടെയോ മണ്ണിന്റെയോ ആരോഗ്യം പരിശോധിക്കുക',
    placeholderText: 'ഇവിടെ സംസാരിക്കുക അല്ലെങ്കിൽ എഴുതുക...',
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    speechCode: 'en-IN',
    greeting: 'Welcome Farmer! Instant Crop & Soil Health Advisory',
    placeholderText: 'Speak or type your question (e.g. Paddy leaves turning yellow)...',
  },
];

export interface PesticideGuide {
  recommendedSpray: string;
  dosagePerLiter: string;
  dosagePerAcre: string;
  applicationMethod: string;
  precautions: string[];
  organicAlternative: string;
  safetyIntervalDays: string;
}

export interface SoilHealth {
  soilType: string;
  textureAndMoisture: string;
  estimatedFertility: string;
  phRangeEstimate: string;
  organicMatterTips: string[];
}

export interface CultivableCrops {
  primaryCrops: string[];
  commercialCashCrops: string[];
  seasonalFit: string;
  cropRotationTip: string;
}

export interface WeatherAndFieldAdvisory {
  irrigationAdvice: string;
  weatherPrecaution: string;
  bestTimeToAct: string;
}

export interface KvkEscalationTicket {
  isEscalated: boolean;
  ticketId: string;
  agronomistName: string;
  specialization: string;
  kvkCenter: string;
  phone: string;
  whatsappNumber: string;
  status: 'assigned' | 'reviewing' | 'callback_scheduled' | 'resolved';
  scheduledTime?: string;
  agronomistNotes?: string;
}

export interface CropSoilAnalysisResult {
  mode: 'crop' | 'soil' | 'both';
  detectedEntity: string;
  scientificOrLocalName: string;
  healthStatus: 'healthy' | 'moderate' | 'critical' | 'alert';
  healthScorePercent: number;
  confidenceScore?: number; // 0-100% confidence of the diagnosis
  aiCertaintyLevel?: 'high' | 'moderate' | 'low';
  shouldEscalateToKvk?: boolean; // Automatically triggered if confidence < 75% or critical ambiguity
  kvkReason?: string;
  kvkEscalation?: KvkEscalationTicket;
  conditionSummary: string;
  earlyDiseaseSignals: string[];
  identifiedPests: string[];
  pesticideGuide: PesticideGuide;
  soilHealth: SoilHealth;
  cultivableCrops: CultivableCrops;
  weatherAndFieldAdvisory: WeatherAndFieldAdvisory;
  spokenAudioScript: string;
  spokenAudioEnglishSummary: string;
  quickActionSteps: string[];
  isContingency?: boolean;
  audioData?: string; // base64 data URI (data:audio/wav;base64,...) from studio voice synthesis
}

export interface SampleFieldItem {
  id: string;
  title: string;
  category: 'crop' | 'soil';
  description: string;
  imageUrl: string;
  promptHint: string;
}

export interface MandiCropPrice {
  id: string;
  crop: string;
  cropHindi: string;
  variety: string;
  market: string;
  state: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number; // ₹ per Quintal
  unit: string;
  trend: 'up' | 'down' | 'stable';
  changeAmount: number;
  mspPrice: number;
  demandStatus: 'high' | 'moderate' | 'low';
  sellAdvice: string;
  lastUpdated: string;
}

export interface SprayCalculationResult {
  tankSizeLiters: number;
  totalAreaAcres: number;
  dosagePerLiterNum: number;
  dosageUnit: 'g' | 'ml';
  waterPerAcreLiters: number;
  totalWaterNeededLiters: number;
  totalTanksNeeded: number;
  chemicalPerTank: number;
  totalChemicalNeeded: number;
  estimatedCostChemicalRupees: number;
  estimatedCostOrganicRupees: number;
  savingsRupees: number;
  nozzleType: string;
  spraySpeedAdvice: string;
}

export interface WeatherAlertData {
  hasAlert: boolean;
  alertType: 'wind' | 'rain' | 'both' | 'none';
  severity: 'severe' | 'warning' | 'advisory' | 'none';
  title: string;
  titleHindi?: string;
  summary: string;
  summaryHindi?: string;
  recommendedAction: string;
  recommendedActionHindi?: string;
  windSpeedKmH: number;
  windGustsKmH?: number;
  rainChanceNext6h: number;
  rainfallMm?: number;
  district: string;
  state?: string;
  optimalHours?: string;
  isLive?: boolean;
}

export interface WeatherSprayWindow {
  district: string;
  state: string;
  currentTemp: number;
  humidity: number;
  windSpeedKmH: number;
  rainChanceNext6h: number;
  spraySuitability: 'optimal' | 'moderate' | 'unsafe';
  statusHeading: string;
  suitabilityReason: string;
  optimalSprayHours: string;
  evaporationRisk: 'low' | 'moderate' | 'high';
  driftRisk: 'low' | 'moderate' | 'high';
  alert?: WeatherAlertData;
  forecastDays: Array<{
    day: string;
    date: string;
    tempMax: number;
    tempMin: number;
    rainChance: number;
    windSpeed: number;
    canSpray: boolean;
    condition: string;
  }>;
}

export interface KisanGovScheme {
  id: string;
  name: string;
  hindiName: string;
  category: 'subsidy' | 'insurance' | 'credit' | 'machinery' | 'soil';
  benefitAmount: string;
  benefitDescription: string;
  eligibility: string;
  keyDocuments: string[];
  helpline: string;
  officialUrl: string;
  maxEstimatedGrant: number; // estimated grant calculation per acre or base
}

export interface CropEmergencyGuide {
  id: string;
  crop: string;
  emergency: string;
  emergencyHindi: string;
  urgency: 'high' | 'critical';
  symptoms: string[];
  first24HourAction: string[];
  organicImmediateSpray: string;
  emergencyHelpline: string;
}

// 1. Re-photograph Treatment Recovery Tracker & Field Feedback
export interface FollowUpDayCheck {
  dayNumber: 0 | 3 | 7 | 14;
  date: string;
  photoUrl?: string;
  observedSymptoms: string;
  recoveryPercentage: number;
  aiFeedback: string;
  actionAdvice: string;
}

export interface TreatmentFollowUpTrack {
  id: string;
  cropName: string;
  cropHindi?: string;
  farmerName: string;
  village: string;
  diagnosisTitle: string;
  treatmentPrescribed: string;
  chemicalUsed?: string;
  chemicalBrand?: string;
  batchNumber?: string;
  startDate: string;
  initialPhotoUrl?: string;
  checks: FollowUpDayCheck[];
  overallStatus: 'improving' | 'stagnant' | 'deteriorating' | 'completed';
  confirmedRecoveryPercent: number;
  fieldConfirmation?: 'fully_cured' | 'partially_controlled' | 'no_effect_resistance';
  resistanceFlagged?: boolean;
  resistanceAlertMessage?: string;
  lastFeedbackDate?: string;
}

// Multi-Factor Early Risk Forecasting Types
export interface EarlyRiskForecastInput {
  crop: string;
  stage: 'germination' | 'vegetative' | 'tillering_branching' | 'flowering' | 'grain_pod_filling' | 'maturity';
  variety: string;
  varietySusceptibility: 'susceptible' | 'moderate' | 'resistant';
  temperatureC: number;
  relativeHumidityPct: number;
  leafWetnessHours: number;
  rainfallPast48hMm: number;
  soilDrainage: 'well_drained' | 'waterlogged' | 'saline_alkaline' | 'acidic';
  trapCatchCount: number; // Moths or pests per trap per night
  pestHistorySeason: 'none' | 'mild_localized' | 'severe_epidemic';
  neighboringOutbreakDistanceKm: number;
}

export interface DiseaseThreatDetail {
  id: string;
  pathogenOrPest: string;
  pathogenHindi?: string;
  scientificName: string;
  threatType: 'fungal' | 'bacterial' | 'viral' | 'insect_pest';
  calculatedRiskPercent: number;
  riskCategory: 'low' | 'moderate' | 'high' | 'critical';
  etlThresholdDescription: string;
  currentEtlStatus: 'BELOW_ETL' | 'APPROACHING_ETL' | 'BREACHED_ETL_ACTION_NOW';
  forecastedIncubationDays: number;
  potentialYieldLossPct: number;
  favorableConditionsMet: string[];
  actionWindowHours: number;
}

export interface EarlyRiskForecastResult {
  riskScore: number; // 0 - 100
  riskLevel: 'low' | 'moderate' | 'critical';
  riskTitle: string;
  riskTitleHindi?: string;
  timestamp: string;
  crop: string;
  stage: string;
  variety: string;
  weatherSummary: string;
  primaryThreats: DiseaseThreatDetail[];
  ipmProtocol: {
    cultural: string[];
    biological: string[];
    mechanical: string[];
    chemicalProphylactic: string[];
  };
  urgentActionWindow: string;
  advisoryText: string;
  advisoryHindi?: string;
}

// Extension Worker & Agriculture Official Surveillance Types
export interface OfficerValidationItem {
  id: string;
  farmerName: string;
  farmerPhone: string;
  village: string;
  district: string;
  crop: string;
  aiDiagnosis: string;
  aiConfidenceScore: number;
  reportedTime: string;
  severity: 'high' | 'moderate' | 'low';
  photoUrl?: string;
  status: 'pending' | 'verified_by_officer' | 'lab_referred' | 'rejected';
  officerDiagnosis?: string;
  officialPrescriptionId?: string;
  notes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface LabSampleReferral {
  sampleId: string;
  farmerName: string;
  village: string;
  crop: string;
  suspectedPathogen: string;
  specimenType: 'leaf_tissue' | 'stem_cross_section' | 'soil_rhizosphere' | 'root_core';
  targetLab: string;
  status: 'sample_collected' | 'in_transit' | 'testing_in_progress' | 'report_ready';
  dispatchDate: string;
  expectedReportDate: string;
  labResultSummary?: string;
  labTechnician?: string;
}

export interface ExtensionBroadcastAlert {
  id: string;
  timestamp: string;
  title: string;
  targetDistrict: string;
  targetMandalOrVillages: string[];
  crop: string;
  diseaseOrPest: string;
  severity: 'high' | 'critical';
  warningMessage: string;
  farmersReachedCount: number;
  deliveryChannels: string[];
  dispatchedBy: string;
}

export interface ExtensionDashboardSummary {
  activeHotspotsCount: number;
  pendingValidationCount: number;
  labSamplesUnderAnalysisCount: number;
  totalBroadcastsThisWeek: number;
  totalFarmersUnderSurveillance: number;
  resistanceAlertsCount: number;
}

// 2. Offline Mode & Queue
export interface OfflineQueueItem {
  id: string;
  timestamp: number;
  image?: string;
  question: string;
  languageCode: string;
  languageName: string;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  cachedResult?: CropSoilAnalysisResult;
}

// 3. Hyperlocal Outbreak Map
export interface OutbreakReport {
  id: string;
  crop: string;
  cropHindi?: string;
  disease: string;
  diseaseHindi?: string;
  severity: 'high' | 'moderate' | 'low';
  district: string;
  village: string;
  distanceKm: number;
  reportedAt: string;
  affectedAcres: number;
  reporterFarmer: string;
  coordinates: { lat: number; lng: number };
  symptomSummary: string;
  preventionSpray: string;
  windSpeedKmH?: number;
  windDirection?: string;
  sporeDriftDirection?: string;
  estimatedSporeArrivalHours?: number;
  farmersAlertedCount?: number;
  verifiedByKvk?: boolean;
}

// 4. Fake Input & Counterfeit Scanner
export interface InputVerificationResult {
  barcodeOrCode: string;
  productName: string;
  brand: string;
  category: 'pesticide' | 'seed' | 'fertilizer';
  cibrNo: string; // Central Insecticides Board & Registration Committee No.
  batchNumber: string;
  manufacturingDate: string;
  expiryDate: string;
  mrpRupees: number;
  authorizedDealer: string;
  dealerLicenseNo: string;
  status: 'genuine' | 'counterfeit' | 'expired' | 'suspicious';
  securityChecks: {
    tamperEvidentSeal: boolean;
    hologramPatternVerified: boolean;
    qrCodedSignatureValid: boolean;
    cibrRegistryActive: boolean;
    batchExpiryValid: boolean;
  };
  warningFlags?: string[];
  helplineNotice: string;
}

// 5. Farm Loan Eligibility (KCC & Crop Loan)
export interface KccLoanEligibility {
  totalAcreage: number;
  cultivatedCrop: string;
  scaleOfFinancePerAcre: number;
  baseCropLoanAmount: number;
  householdConsumption10Percent: number;
  farmAssetMaintenance20Percent: number;
  totalKccLimitRupees: number;
  subsidizedInterestRate: number; // 4% after prompt subvention
  monthlyInterestBurden: number;
  dscrCoverageRatio: number;
  eligibilityStatus: 'pre_approved' | 'eligible' | 'requires_guarantor';
  calculatedFromLedger: {
    totalLedgerSpent: number;
    projectedLedgerRevenue: number;
    netProjectedSurplus: number;
  };
}

// 6. PMFBY Crop Insurance Auto-Fill Claim
export interface PmfbyClaimRecord {
  claimId: string;
  policyOrApplicationNo: string;
  farmerName: string;
  mobileNumber: string;
  aadhaarLast4: string;
  bankAccountLast4: string;
  district: string;
  state: string;
  village: string;
  surveyOrKhasraNo: string;
  cropName: string;
  acreageAffected: number;
  sumInsuredPerAcre: number;
  lossEventCause: string;
  lossDate: string;
  assessedLossPercent: number;
  estimatedCompensationRupees: number;
  photoUrl?: string;
  geoCoordinates: string;
  intimationStatus: 'draft' | 'intimated_to_aic' | 'surveyor_scheduled';
  deadlineNotice: string;
}

// 7. Cold Storage & Store-vs-Sell Decision
export interface ColdStorageFacility {
  id: string;
  name: string;
  district: string;
  distanceKm: number;
  capacityMT: number;
  availableMT: number;
  ratePerQuintalPerMonth: number;
  temperatureRange: string;
  suitableCrops: string[];
  managerPhone: string;
  address: string;
  bookingStatus: 'available' | 'fast_filling' | 'full';
}

export interface StoreVsSellDecision {
  crop: string;
  quantityQuintals: number;
  currentMandiPrice: number;
  projectedFuturePrice60Days: number;
  storagePeriodMonths: number;
  storageRentTotal: number;
  transportFreightTotal: number;
  expectedWeightLossMoistureLossRupees: number;
  sellNowGrossRevenue: number;
  storeAndSellFutureGrossRevenue: number;
  netGainIfStored: number;
  verdict: 'STORE_AND_WAIT' | 'SELL_NOW';
  verdictReason: string;
}
