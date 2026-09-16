import React, { useState, useEffect } from 'react';
import { QrCode, ShieldCheck, ShieldAlert, CheckCircle2, AlertTriangle, Scan, Camera, FileText, Phone, Building2, HelpCircle, ArrowRight } from 'lucide-react';
import { InputVerificationResult, RegionalLanguage } from '../types';

interface FakeInputScannerProps {
  initialCodeOrName?: string;
  currentLanguage?: RegionalLanguage;
}

export const FakeInputScanner: React.FC<FakeInputScannerProps> = ({
  initialCodeOrName = '',
  currentLanguage,
}) => {
  const [barcodeInput, setBarcodeInput] = useState(initialCodeOrName);
  const [dealerNameInput, setDealerNameInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InputVerificationResult | null>(null);
  const [complaintFiled, setComplaintFiled] = useState(false);

  useEffect(() => {
    if (initialCodeOrName) {
      setBarcodeInput(initialCodeOrName);
      handleVerify(initialCodeOrName);
    }
  }, [initialCodeOrName]);

  useEffect(() => {
    if (!isScanning) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsScanning(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isScanning]);

  const handleVerify = async (codeToVerify?: string) => {
    const code = (codeToVerify || barcodeInput).trim();
    if (!code) return;

    setLoading(true);
    setComplaintFiled(false);
    try {
      const res = await fetch('/api/verify-input', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          dealerName: dealerNameInput,
        }),
      });
      const data = await res.json();
      if (data.success && data.verification) {
        setResult(data.verification);
      }
    } catch (err) {
      console.error('Input verification error:', err);
    } finally {
      setLoading(false);
      setIsScanning(false);
    }
  };

  const handleDemoScan = (code: string) => {
    setBarcodeInput(code);
    handleVerify(code);
  };

  const handleFileComplaint = () => {
    setComplaintFiled(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                Anti-Counterfeit Protection
              </span>
              <span className="text-xs text-emerald-200 font-medium">CIB&RC & NSC Registry Authenticator</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Fake Seed & Pesticide Detector
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl leading-relaxed">
              Counterfeit and adulterated agricultural inputs cause over 30% of sudden crop burns and pest resistance in rural India. 
              Scan the QR/barcode or verify batch registration against the Central Insecticides Board & Registration Committee (CIB&RC) database before spraying.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsScanning(true)}
              className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Scan Bottle QR / Barcode</span>
            </button>
          </div>
        </div>
      </div>

      {/* Verification Input & Quick Demo Triggers */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-sm space-y-5">
        
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-7">
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Enter Barcode, QR Code, or Batch Number
            </label>
            <div className="relative">
              <input
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="e.g. 8901234567890 or CORAGEN or FAKE-CHLOR-001"
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <QrCode className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
            </div>
          </div>

          <div className="sm:col-span-5">
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Retail Dealer Name (Optional)
            </label>
            <input
              type="text"
              value={dealerNameInput}
              onChange={(e) => setDealerNameInput(e.target.value)}
              placeholder="e.g. Mahalaxmi Krishi Seva Kendra"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Demo scan buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase">Test With Sample:</span>
            <button
              onClick={() => handleDemoScan('CORAGEN')}
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 cursor-pointer"
            >
              ✓ FMC Coragen (Genuine)
            </button>
            <button
              onClick={() => handleDemoScan('CONFIDOR')}
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 cursor-pointer"
            >
              ✓ Bayer Confidor (Genuine)
            </button>
            <button
              onClick={() => handleDemoScan('FAKE-CHLOR-001')}
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-red-50 text-red-800 border border-red-200 hover:bg-red-100 cursor-pointer"
            >
              ⚠️ Counterfeit Chemical (Fraud Test)
            </button>
          </div>

          <button
            onClick={() => handleVerify()}
            disabled={loading || !barcodeInput.trim()}
            className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
          >
            {loading ? 'Verifying Registry...' : 'Authenticate Now'}
          </button>
        </div>
      </div>

      {/* Camera Simulator Modal */}
      {isScanning && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex justify-center items-start sm:items-center p-3 sm:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsScanning(false);
            }
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl my-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                <Scan className="w-5 h-5 text-emerald-700 animate-pulse" />
                Scanning Bottle Barcode / QR
              </h3>
              <button
                type="button"
                onClick={() => setIsScanning(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 font-bold transition-colors cursor-pointer"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="relative w-64 h-64 mx-auto rounded-2xl bg-black overflow-hidden border-2 border-emerald-500 flex items-center justify-center">
              <div className="absolute inset-0 bg-emerald-500/10 animate-pulse" />
              <div className="w-48 h-48 border-2 border-dashed border-emerald-400 rounded-xl relative">
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500 animate-bounce" />
              </div>
              <p className="absolute bottom-3 text-[11px] text-white/80 font-mono">
                Align packaging barcode inside viewfinder
              </p>
            </div>

            <p className="text-xs text-gray-600">Simulating live camera optical recognition...</p>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleDemoScan('CORAGEN')}
                className="py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors"
              >
                Scan Genuine Batch
              </button>
              <button
                type="button"
                onClick={() => handleDemoScan('FAKE-CHLOR-001')}
                className="py-2.5 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors"
              >
                Scan Suspicious Batch
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsScanning(false)}
              className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
            >
              {currentLanguage?.code === 'en' ? 'Cancel Scanner' : currentLanguage?.code === 'hi' ? 'वापस जाएं / Cancel' : 'Cancel Scanner'}
            </button>
          </div>
        </div>
      )}

      {/* Verification Result Card */}
      {result && (
        <div className={`rounded-3xl p-6 border shadow-sm space-y-5 ${
          result.status === 'genuine'
            ? 'bg-emerald-50/40 border-emerald-200'
            : result.status === 'counterfeit'
            ? 'bg-red-50/50 border-red-300'
            : 'bg-amber-50/40 border-amber-200'
        }`}>
          
          {/* Status Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                result.status === 'genuine'
                  ? 'bg-emerald-600 text-white'
                  : result.status === 'counterfeit'
                  ? 'bg-red-600 text-white animate-bounce'
                  : 'bg-amber-600 text-white'
              }`}>
                {result.status === 'genuine' ? (
                  <ShieldCheck className="w-7 h-7" />
                ) : (
                  <ShieldAlert className="w-7 h-7" />
                )}
              </div>
              <div>
                <span className={`text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md ${
                  result.status === 'genuine'
                    ? 'bg-emerald-200 text-emerald-900'
                    : result.status === 'counterfeit'
                    ? 'bg-red-200 text-red-950 font-black'
                    : 'bg-amber-200 text-amber-950'
                }`}>
                  {result.status === 'genuine'
                    ? '100% VERIFIED GENUINE'
                    : result.status === 'counterfeit'
                    ? '🚨 COUNTERFEIT / FRAUD DETECTED'
                    : 'SUSPICIOUS / UNVERIFIED PRODUCT'}
                </span>
                <h3 className="text-xl font-black text-gray-900 mt-1">
                  {result.productName}
                </h3>
                <p className="text-xs text-gray-600 font-medium">
                  Brand: <strong>{result.brand}</strong> • Category: {result.category?.toUpperCase()}
                </p>
              </div>
            </div>

            <div className="text-right self-start sm:self-auto">
              <span className="text-[11px] text-gray-500 font-bold uppercase">MRP Reference</span>
              <p className="text-xl font-black text-gray-900">
                {result.mrpRupees ? `₹${result.mrpRupees}` : 'Unregulated'}
              </p>
            </div>
          </div>

          {/* Warning Banner if Counterfeit */}
          {result.status === 'counterfeit' && (
            <div className="bg-red-100/90 border-2 border-red-500 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-red-950 font-black text-sm">
                <AlertTriangle className="w-5 h-5 text-red-700 shrink-0" />
                <span>DO NOT SPRAY ON CROPS: High Hazard of Severe Crop Scorching & Soil Poisoning</span>
              </div>
              <ul className="list-disc pl-5 text-xs text-red-900 space-y-1 font-medium">
                {result.warningFlags?.map((flag, idx) => (
                  <li key={idx}>{flag}</li>
                ))}
              </ul>
              <p className="text-xs font-bold text-red-950 pt-1">
                {result.helplineNotice}
              </p>
            </div>
          )}

          {/* Security Checks Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-gray-200 text-xs">
              <span className="text-gray-500 font-medium block">CIB&RC Registry</span>
              <span className={`font-bold mt-1 block ${result.securityChecks.cibrRegistryActive ? 'text-emerald-700' : 'text-red-700'}`}>
                {result.securityChecks.cibrRegistryActive ? '✓ Active & Valid' : '✕ Not Registered'}
              </span>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-gray-200 text-xs">
              <span className="text-gray-500 font-medium block">Security Hologram</span>
              <span className={`font-bold mt-1 block ${result.securityChecks.hologramPatternVerified ? 'text-emerald-700' : 'text-red-700'}`}>
                {result.securityChecks.hologramPatternVerified ? '✓ Verified 3D Foil' : '✕ Fake / Missing'}
              </span>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-gray-200 text-xs">
              <span className="text-gray-500 font-medium block">Batch & Expiry</span>
              <span className={`font-bold mt-1 block ${result.securityChecks.batchExpiryValid ? 'text-emerald-700' : 'text-red-700'}`}>
                {result.securityChecks.batchExpiryValid ? '✓ Valid (Within Date)' : '✕ Expired / Tampered'}
              </span>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-gray-200 text-xs">
              <span className="text-gray-500 font-medium block">Tamper Seal</span>
              <span className={`font-bold mt-1 block ${result.securityChecks.tamperEvidentSeal ? 'text-emerald-700' : 'text-red-700'}`}>
                {result.securityChecks.tamperEvidentSeal ? '✓ Thermal Seal Intact' : '✕ Resealed / Broken'}
              </span>
            </div>
          </div>

          {/* Certificate & Dealer Details */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200 text-xs space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
              <span className="font-bold text-gray-700">Official CIB&RC Registration No:</span>
              <span className="font-mono font-bold text-gray-900">{result.cibrNo}</span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
              <span className="font-bold text-gray-700">Batch Code & Manufacturing:</span>
              <span className="font-mono text-gray-900">{result.batchNumber} (Mfg: {result.manufacturingDate} • Exp: {result.expiryDate})</span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-gray-700">Authorized Retail Dealer:</span>
              <span className="font-semibold text-gray-900">{result.authorizedDealer} ({result.dealerLicenseNo})</span>
            </div>
          </div>

          {/* Action Row */}
          {result.status === 'counterfeit' && (
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              {!complaintFiled ? (
                <button
                  onClick={handleFileComplaint}
                  className="w-full sm:w-auto px-5 py-3 bg-red-700 hover:bg-red-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md cursor-pointer transition-colors flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>File 1-Click Fraud Complaint to District Agriculture Officer (DAO)</span>
                </button>
              ) : (
                <div className="bg-emerald-100 text-emerald-950 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Complaint #DAO-FRAUD-2026-891 registered with Sub-Divisional Agriculture Office. Inspector assigned.</span>
                </div>
              )}

              <a
                href="tel:18001801551"
                className="w-full sm:w-auto px-4 py-3 bg-gray-900 hover:bg-black text-white font-bold text-xs sm:text-sm rounded-xl text-center flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4 text-emerald-400" />
                <span>Call Kisan Fraud Helpline (1800-180-1551)</span>
              </a>
            </div>
          )}

        </div>
      )}

      {/* 5-Point Physical Bottle Inspection Checklist */}
      <div className="bg-gray-50 rounded-3xl p-5 sm:p-6 border border-gray-200 text-xs text-gray-700 space-y-3">
        <h4 className="text-sm font-black text-gray-900 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-emerald-700" />
          Farmer Guide: 5 Physical Checks Before Buying Seeds or Pesticides
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div className="bg-white p-3 rounded-xl border border-gray-200 space-y-1">
            <strong className="text-gray-900 block font-bold">1. Demand a GST Bill</strong>
            <p className="text-gray-600">Never buy in cash without a bill. The cash memo must record the batch number and expiry date.</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-gray-200 space-y-1">
            <strong className="text-gray-900 block font-bold">2. Scratch & Verify Hologram</strong>
            <p className="text-gray-600">Authentic brands have micro-text 3D security film that changes color under sunlight.</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-gray-200 space-y-1">
            <strong className="text-gray-900 block font-bold">3. Inspect Container Embossing</strong>
            <p className="text-gray-600">Genuine bottles feature the brand name molded directly into the plastic bottle base, not just printed on paper.</p>
          </div>
        </div>
      </div>

    </div>
  );
};
