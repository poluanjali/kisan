import React, { useState, useEffect, useRef } from 'react';
import { QrCode, ShieldCheck, ShieldAlert, CheckCircle2, AlertTriangle, Scan, Camera, FileText, Phone, Building2, HelpCircle, ArrowRight, Upload, Video, RefreshCw, X } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
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
  
  // Real camera & optical scanner state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanTab, setScanTab] = useState<'camera' | 'upload' | 'samples'>('camera');
  const [cameraSupported, setCameraSupported] = useState<boolean | null>(null);
  const [uploadedBottlePhoto, setUploadedBottlePhoto] = useState<string | null>(null);
  const [isFileScanning, setIsFileScanning] = useState(false);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const bottleCameraInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (initialCodeOrName) {
      setBarcodeInput(initialCodeOrName);
      handleVerify(initialCodeOrName);
    }
  }, [initialCodeOrName]);

  useEffect(() => {
    if (!isScanning) {
      stopCameraScanner();
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsScanning(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      stopCameraScanner();
    };
  }, [isScanning]);

  const stopCameraScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('Notice stopping scanner:', err);
      }
      html5QrCodeRef.current = null;
    }
    setCameraActive(false);
  };

  const startCameraScanner = async () => {
    setCameraError(null);
    try {
      await stopCameraScanner();

      // Check if mediaDevices API is available
      if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraSupported(false);
        setCameraActive(false);
        setCameraError('Camera access is not supported on this browser. Please upload a photo of the bottle barcode/label.');
        setScanTab('upload');
        return;
      }

      // Check for available video cameras
      let cameras: Array<{ id: string; label: string }> = [];
      try {
        cameras = await Html5Qrcode.getCameras();
      } catch (e) {
        console.warn('Notice querying camera list:', e);
      }

      if (!cameras || cameras.length === 0) {
        setCameraSupported(false);
        setCameraActive(false);
        setCameraError('No physical camera detected on this device. You can upload a photo of the barcode or select from verified sample codes.');
        setScanTab('upload');
        return;
      }

      setCameraSupported(true);

      const qrCodeId = 'kisan-barcode-reader';
      const qrScanner = new Html5Qrcode(qrCodeId);
      html5QrCodeRef.current = qrScanner;

      // Select back/environment camera if available, otherwise first available camera
      const backCam = cameras.find((c) => /back|rear|environment|facing\s*back/i.test(c.label));
      const chosenCameraId = backCam ? backCam.id : cameras[0].id;

      const scanConfig = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      const onScanSuccess = (decodedText: string) => {
        console.log('Barcode/QR detected:', decodedText);
        stopCameraScanner();
        setIsScanning(false);
        setBarcodeInput(decodedText);
        handleVerify(decodedText);
      };

      try {
        await qrScanner.start(chosenCameraId, scanConfig, onScanSuccess, () => {});
        setCameraActive(true);
      } catch (startErr: any) {
        console.warn('Could not start preferred camera, attempting fallback...', startErr);
        if (cameras.length > 1 && chosenCameraId !== cameras[0].id) {
          await qrScanner.start(cameras[0].id, scanConfig, onScanSuccess, () => {});
          setCameraActive(true);
        } else {
          throw startErr;
        }
      }
    } catch (err: any) {
      console.warn('Camera initialization notice:', err?.message || err);
      setCameraActive(false);
      const isNotFound =
        err?.name === 'NotFoundError' ||
        err?.message?.includes('Requested device not found') ||
        err?.message?.includes('not found') ||
        err?.name === 'OverconstrainedError';

      const isPermissionDenied =
        err?.name === 'NotAllowedError' ||
        err?.name === 'PermissionDeniedError' ||
        err?.message?.includes('Permission');

      const friendlyMsg = isNotFound
        ? 'No active camera hardware detected on this device. Switch to Photo Upload or select a verified sample code.'
        : isPermissionDenied
        ? 'Camera permission was denied in browser settings. Please allow camera access or upload an image file.'
        : 'Camera could not be started. Please upload a photo of the bottle or choose a sample code.';

      setCameraError(friendlyMsg);
      setScanTab('upload');
    }
  };

  const handleOpenScanner = async () => {
    setIsScanning(true);
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        if (videoInputs.length === 0) {
          setCameraSupported(false);
          setScanTab('upload');
          return;
        }
      }
    } catch {
      // Ignore and proceed
    }
    setScanTab('camera');
  };

  // Launch camera when modal opens in camera tab
  useEffect(() => {
    if (isScanning && scanTab === 'camera') {
      const timer = setTimeout(() => {
        startCameraScanner();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      stopCameraScanner();
    }
  }, [isScanning, scanTab]);

  const processBottleFile = async (file: File) => {
    if (!file) return;

    setCameraError(null);
    setIsFileScanning(true);

    // Read preview
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setUploadedBottlePhoto(reader.result);
      }
    };
    reader.readAsDataURL(file);

    try {
      const fileReaderId = 'kisan-file-barcode-element';
      const fileScanner = new Html5Qrcode(fileReaderId);
      const decodedResult = await fileScanner.scanFile(file, true);
      try {
        await fileScanner.clear();
      } catch (_) {}

      stopCameraScanner();
      setIsScanning(false);
      setBarcodeInput(decodedResult);
      handleVerify(decodedResult);
    } catch (err: any) {
      console.warn('Optical barcode recognition from image notice:', err?.message || err);
      setCameraError('No standard 1D/QR barcode detected in this photo. You can select a verified formulation below or type the batch number manually.');
    } finally {
      setIsFileScanning(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (bottleCameraInputRef.current) {
        bottleCameraInputRef.current.value = '';
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processBottleFile(file);
    }
  };

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
    stopCameraScanner();
    setIsScanning(false);
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
              onClick={handleOpenScanner}
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

      {/* Real Optical Barcode / QR Scanner Modal */}
      {isScanning && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex justify-center items-start sm:items-center p-3 sm:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsScanning(false);
            }
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 text-center space-y-4 shadow-2xl my-auto relative animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div className="text-left">
                <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                  <Scan className="w-5 h-5 text-emerald-700 animate-pulse" />
                  Live Pesticide Bottle Scanner
                </h3>
                <p className="text-[11px] text-gray-500 font-medium">Scan QR code or 1D barcode printed on cap, seal, or label</p>
              </div>
              <button
                type="button"
                onClick={() => setIsScanning(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 font-bold transition-colors cursor-pointer"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Scan Mode Tabs */}
            <div className="flex items-center p-1 bg-gray-100 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setScanTab('camera')}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  scanTab === 'camera' ? 'bg-white text-emerald-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                Live Camera
              </button>
              <button
                type="button"
                onClick={() => setScanTab('upload')}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  scanTab === 'upload' ? 'bg-white text-emerald-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                Upload Photo
              </button>
              <button
                type="button"
                onClick={() => setScanTab('samples')}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  scanTab === 'samples' ? 'bg-white text-emerald-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Sample Codes
              </button>
            </div>

            {/* Camera Viewport */}
            {scanTab === 'camera' && (
              <div className="space-y-3">
                <div className="relative w-full aspect-square max-w-[280px] mx-auto rounded-2xl bg-black overflow-hidden border-2 border-emerald-500 flex items-center justify-center shadow-inner">
                  {/* Div mounting point for html5-qrcode video */}
                  <div id="kisan-barcode-reader" className="w-full h-full overflow-hidden [&_video]:w-full [&_video]:h-full [&_video]:object-cover" />

                  {/* Visual scanning reticle overlay */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-dashed border-emerald-400/80 rounded-xl relative">
                      <div className="absolute top-1/2 left-2 right-2 h-0.5 bg-red-500/90 shadow-sm animate-pulse" />
                      <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                      <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                      <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
                    </div>
                  </div>

                  {!cameraActive && !cameraError && (
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2 text-white p-4">
                      <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                      <p className="text-xs font-semibold">Starting camera feed...</p>
                    </div>
                  )}
                </div>

                {cameraError ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-left text-xs text-amber-900 space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-amber-950">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      Camera Permission or Availability Notice
                    </div>
                    <p className="text-[11px] leading-relaxed">{cameraError}</p>
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => startCameraScanner()}
                        className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-bold text-[11px] cursor-pointer"
                      >
                        Retry Camera
                      </button>
                      <button
                        type="button"
                        onClick={() => setScanTab('upload')}
                        className="px-3 py-1.5 bg-white border border-amber-300 text-amber-900 rounded-lg font-bold text-[11px] cursor-pointer"
                      >
                        Upload Bottle Photo Instead
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">
                    Hold bottle 15–20 cm away and center the barcode or QR in the green reticle.
                  </p>
                )}
              </div>
            )}

            {/* Hidden persistent container for file-based barcode decoding */}
            <div id="kisan-file-barcode-element" className="hidden" style={{ display: 'none' }} />

            {/* Photo Upload Mode */}
            {scanTab === 'upload' && (
              <div className="space-y-3">
                {/* Standard file selector without forced capture */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileUpload}
                  id="barcode-photo-gallery-input"
                />
                {/* Camera capture input */}
                <input
                  ref={bottleCameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileUpload}
                  id="barcode-photo-camera-input"
                />

                {isFileScanning ? (
                  <div className="w-full aspect-square max-w-[280px] mx-auto border-2 border-dashed border-emerald-400 bg-emerald-50/50 rounded-2xl flex flex-col items-center justify-center p-6 text-center">
                    <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mb-2" />
                    <p className="text-xs font-bold text-emerald-950">Analyzing Bottle Photo...</p>
                    <p className="text-[11px] text-emerald-700">Detecting optical barcode and QR security patterns</p>
                  </div>
                ) : uploadedBottlePhoto ? (
                  <div className="space-y-3">
                    <div className="relative rounded-2xl overflow-hidden border border-emerald-300 bg-black/5 max-h-48 flex items-center justify-center">
                      <img
                        src={uploadedBottlePhoto}
                        alt="Uploaded pesticide bottle"
                        className="max-h-44 w-auto object-contain rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedBottlePhoto(null);
                          setCameraError(null);
                        }}
                        className="absolute top-2 right-2 p-1 rounded-lg bg-black/60 hover:bg-black/80 text-white text-xs"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                      >
                        Choose Different Photo
                      </button>
                      <button
                        type="button"
                        onClick={() => bottleCameraInputRef.current?.click()}
                        className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
                      >
                        Snap Another
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const dropped = e.dataTransfer.files?.[0];
                      if (dropped) processBottleFile(dropped);
                    }}
                    className="w-full aspect-square max-w-[280px] mx-auto border-2 border-dashed border-gray-300 hover:border-emerald-500 rounded-2xl flex flex-col items-center justify-center p-5 text-center transition-colors bg-gray-50/50 hover:bg-emerald-50/30"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-2">
                      <Camera className="w-6 h-6" />
                    </div>
                    <h4 className="text-xs font-black text-gray-900">Upload Bottle Barcode Photo</h4>
                    <p className="text-[11px] text-gray-500 mt-1">Browse gallery, take a close-up photo, or drag & drop</p>
                    
                    <div className="flex flex-col sm:flex-row gap-2 mt-3 w-full max-w-[240px]">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold rounded-lg shadow-xs cursor-pointer"
                      >
                        Browse Files
                      </button>
                      <button
                        type="button"
                        onClick={() => bottleCameraInputRef.current?.click()}
                        className="flex-1 px-3 py-2 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 text-[11px] font-bold rounded-lg shadow-xs cursor-pointer"
                      >
                        Take Photo
                      </button>
                    </div>
                  </div>
                )}

                {cameraError && (
                  <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl text-xs text-left space-y-2">
                    <p className="font-bold flex items-center gap-1 text-amber-950">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      Notice: Barcode Not Detected
                    </p>
                    <p className="text-[11px] leading-relaxed">{cameraError}</p>
                    <div className="pt-1 flex flex-wrap gap-1.5">
                      <span className="text-[10px] text-amber-800 font-bold w-full">Quick verify known bottle:</span>
                      <button
                        type="button"
                        onClick={() => handleDemoScan('CORAGEN')}
                        className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 rounded-lg text-[10px] font-bold cursor-pointer"
                      >
                        Coragen SC
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDemoScan('CONFIDOR')}
                        className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 rounded-lg text-[10px] font-bold cursor-pointer"
                      >
                        Confidor SL
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDemoScan('SAAF')}
                        className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 rounded-lg text-[10px] font-bold cursor-pointer"
                      >
                        UPL Saaf
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sample Bottle Codes Mode */}
            {scanTab === 'samples' && (
              <div className="space-y-3 text-left">
                <p className="text-xs text-gray-600 font-medium">
                  Test instant authentication using verified laboratory pesticide batches:
                </p>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  <div
                    onClick={() => handleDemoScan('CORAGEN')}
                    className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/80 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-emerald-950">FMC Coragen 18.5% SC</span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded-md">Genuine</span>
                    </div>
                    <p className="text-[11px] text-emerald-800 font-mono mt-1">Barcode: 8901234567890 (Batch: FMC-2026-B812)</p>
                  </div>

                  <div
                    onClick={() => handleDemoScan('CONFIDOR')}
                    className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/80 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-emerald-950">Bayer Confidor 200 SL</span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded-md">Genuine</span>
                    </div>
                    <p className="text-[11px] text-emerald-800 font-mono mt-1">Barcode: 8909876543210 (Batch: BAY-2025-X419)</p>
                  </div>

                  <div
                    onClick={() => handleDemoScan('SAAF')}
                    className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/80 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-emerald-950">UPL Saaf Fungicide</span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded-md">Genuine</span>
                    </div>
                    <p className="text-[11px] text-emerald-800 font-mono mt-1">Barcode: 8905544332211 (Batch: UPL-2026-M109)</p>
                  </div>

                  <div
                    onClick={() => handleDemoScan('FAKE-CHLOR-001')}
                    className="p-3 rounded-xl border border-red-200 bg-red-50/60 hover:bg-red-100/80 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-red-950">Adulterated "Super Chlor" 20% EC</span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-red-200 text-red-900 rounded-md">Counterfeit</span>
                    </div>
                    <p className="text-[11px] text-red-800 font-mono mt-1">Bogus CIB&RC: CIR-INVALID-NOT-FOUND</p>
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsScanning(false)}
              className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
            >
              {currentLanguage?.code === 'en' ? 'Close Scanner' : currentLanguage?.code === 'hi' ? 'स्कैनर बंद करें / Close' : 'Close Scanner'}
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
