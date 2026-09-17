import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, UploadCloud, X, RefreshCw, Sparkles, CheckCircle2, AlertCircle, Image as ImageIcon, Loader2 } from 'lucide-react';
import { SAMPLE_FIELD_ITEMS, getLocalizedSampleItem } from '../sampleData';
import { SampleFieldItem, RegionalLanguage } from '../types';
import { formatBilingual } from '../utils/translations';
import { BilingualText } from './BilingualText';

interface PhotoUploaderProps {
  currentLanguage: RegionalLanguage;
  selectedImage: string | null;
  onImageSelected: (base64OrUrl: string, sampleItem?: SampleFieldItem) => void;
  onClearImage: () => void;
  isLoading: boolean;
}

/**
 * Optimizes an uploaded image file:
 * - Decodes using Image/Canvas
 * - Resizes smoothly to a max dimension (1600px)
 * - Compresses to clean JPEG (quality 0.85)
 * - Returns lightweight base64 string (~150KB-350KB) preventing browser memory spikes and localStorage quota limits
 */
function optimizeImageFile(file: File, maxDimension = 1600, quality = 0.85): Promise<{ base64: string; sizeKb: number }> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Selected file is not an image'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read photo file'));
    reader.onload = (e) => {
      const src = e.target?.result;
      if (typeof src !== 'string') {
        return reject(new Error('Invalid image data'));
      }

      const img = new Image();
      img.onerror = () => reject(new Error('Could not parse image format'));
      img.onload = () => {
        let { width, height } = img;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback to original src if canvas 2D context fails
          const sizeKb = Math.round((src.length * 0.75) / 1024);
          return resolve({ base64: src, sizeKb });
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const optimizedBase64 = canvas.toDataURL('image/jpeg', quality);
        const sizeKb = Math.round((optimizedBase64.length * 0.75) / 1024);
        resolve({ base64: optimizedBase64, sizeKb });
      };

      img.src = src;
    };

    reader.readAsDataURL(file);
  });
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  currentLanguage,
  selectedImage,
  onImageSelected,
  onClearImage,
  isLoading,
}) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imageMeta, setImageMeta] = useState<{ name: string; sizeKb: number } | null>(null);

  const processFile = useCallback(async (file: File) => {
    if (!file) return;
    setUploadError(null);

    // Validate mime type
    if (!file.type.startsWith('image/')) {
      setUploadError(
        currentLanguage.code === 'hi'
          ? 'कृपया केवल फोटो (JPG, PNG, WEBP) फाइल चुनें।'
          : 'Please select a valid image file (JPG, PNG, WEBP).'
      );
      return;
    }

    setIsProcessing(true);
    try {
      const { base64, sizeKb } = await optimizeImageFile(file, 1600, 0.85);
      setImageMeta({
        name: file.name || 'Crop_Specimen.jpg',
        sizeKb,
      });
      onImageSelected(base64);
    } catch (err: any) {
      console.error('Error processing photo:', err);
      // Fallback: attempt direct read if canvas optimization fails
      const fallbackReader = new FileReader();
      fallbackReader.onload = () => {
        if (typeof fallbackReader.result === 'string') {
          setImageMeta({
            name: file.name || 'Crop_Specimen.jpg',
            sizeKb: Math.round(file.size / 1024),
          });
          onImageSelected(fallbackReader.result);
        }
      };
      fallbackReader.onerror = () => {
        setUploadError(
          currentLanguage.code === 'hi'
            ? 'फोटो लोड करने में असमर्थ। कृपया दोबारा प्रयास करें।'
            : 'Unable to load photo. Please try a different image.'
        );
      };
      fallbackReader.readAsDataURL(file);
    } finally {
      setIsProcessing(false);
    }
  }, [currentLanguage.code, onImageSelected]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // Reset file input value so selecting the same file triggers change
    e.target.value = '';
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  // Clipboard paste support (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (selectedImage || isLoading) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            processFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [selectedImage, isLoading, processFile]);

  const handleClear = () => {
    setImageMeta(null);
    setUploadError(null);
    onClearImage();
  };

  const handleSelectSample = (imageUrl: string, item: SampleFieldItem) => {
    setImageMeta({
      name: item.title,
      sizeKb: 120,
    });
    setUploadError(null);
    onImageSelected(imageUrl, item);
  };

  return (
    <div id="photo-uploader-section" className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-100 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
          <Camera className="w-5 h-5 text-emerald-600" />
          <span>{formatBilingual('1. Upload Crop or Soil Photo', 'uploadPhotoPrompt', currentLanguage.code)}</span>
        </h2>
        {selectedImage && (
          <button
            type="button"
            onClick={handleClear}
            disabled={isLoading}
            className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>{formatBilingual('Remove Photo', 'cancel', currentLanguage.code)}</span>
          </button>
        )}
      </div>

      {/* Hidden file input elements */}
      {/* 1. Camera-targeted capture (on mobile opens camera; on desktop falls back gracefully) */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        id="camera-file-input"
      />
      {/* 2. Gallery / Document file selector (no capture attribute to ensure file dialog opens reliably) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,image/jpeg,image/png,image/webp,image/heic,image/heif"
        onChange={handleFileChange}
        className="hidden"
        id="gallery-file-input"
      />

      {/* Upload Error Banner */}
      {uploadError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span className="font-semibold">{uploadError}</span>
        </div>
      )}

      {/* Processing State */}
      {isProcessing && (
        <div className="py-12 px-4 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 flex flex-col items-center justify-center gap-2 text-center">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-sm font-bold text-emerald-950">
            {currentLanguage.code === 'hi' ? 'फोटो प्रोसेस हो रही है...' : 'Optimizing and preparing photo...'}
          </p>
          <p className="text-xs text-emerald-700">Scaling image for instant AI diagnostic accuracy</p>
        </div>
      )}

      {/* Image Preview or Drop Zone */}
      {!isProcessing && selectedImage ? (
        <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500 bg-emerald-950/5 flex flex-col items-center justify-center p-2 shadow-inner">
          <div className="relative max-h-80 w-full flex items-center justify-center overflow-hidden rounded-xl bg-black/5">
            <img
              src={selectedImage}
              alt="Field Crop or Soil Specimen"
              className="max-h-72 w-auto max-w-full object-contain rounded-xl shadow-xs"
            />
            
            {/* Badges */}
            <div className="absolute top-3 left-3 bg-emerald-800/90 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm flex items-center gap-1.5 shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />
              <span>{currentLanguage.code === 'hi' ? 'फोटो चुना गया' : 'Photo Selected'}</span>
            </div>

            {imageMeta && (
              <div className="absolute bottom-3 left-3 bg-black/70 text-white text-[11px] font-mono px-2.5 py-1 rounded-lg backdrop-blur-xs flex items-center gap-1.5">
                <ImageIcon className="w-3 h-3 text-emerald-400" />
                <span className="truncate max-w-[160px] sm:max-w-xs">{imageMeta.name}</span>
                <span className="text-emerald-300 font-bold">• {imageMeta.sizeKb} KB</span>
              </div>
            )}
          </div>

          <div className="w-full flex items-center justify-end gap-2 pt-2 px-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="bg-white hover:bg-gray-50 text-gray-800 text-xs font-bold px-3.5 py-2 rounded-xl border border-gray-200 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
              <span>{formatBilingual('Change Photo', 'uploadPhoto', currentLanguage.code)}</span>
            </button>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={isLoading}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{currentLanguage.code === 'hi' ? 'नया फोटो लें' : 'Retake'}</span>
            </button>
          </div>
        </div>
      ) : !isProcessing && (
        <div className="space-y-4">
          {/* Main Action Drag-and-Drop Area */}
          <div
            ref={dropZoneRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative rounded-3xl border-2 border-dashed p-6 sm:p-8 transition-all text-center ${
              isDragging
                ? 'border-emerald-600 bg-emerald-100/60 scale-[1.01]'
                : 'border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50/70 hover:border-emerald-500'
            }`}
          >
            <div className="max-w-md mx-auto space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                <UploadCloud className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-base font-extrabold text-emerald-950">
                  {formatBilingual('Upload Crop, Leaf, Pest, or Soil Photo', 'uploadPhoto', currentLanguage.code)}
                </h3>
                <p className="text-xs text-emerald-800/80 mt-1">
                  Drag and drop photo here, paste from clipboard (Ctrl+V), or choose an option below
                </p>
              </div>

              {/* Action Buttons: Camera Photo vs Browse Gallery */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  id="btn-take-photo"
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full sm:w-auto px-5 py-3 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-amber-300" />
                  <span>{formatBilingual('Take Camera Photo', 'cameraPhoto', currentLanguage.code)}</span>
                </button>

                <button
                  id="btn-upload-gallery"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-auto px-5 py-3 bg-white hover:bg-emerald-50 active:scale-95 text-emerald-900 border border-emerald-300 font-bold text-xs sm:text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4 text-emerald-600" />
                  <span>{formatBilingual('Browse Gallery / Files', 'uploadPhoto', currentLanguage.code)}</span>
                </button>
              </div>

              <div className="text-[11px] text-gray-500 font-medium pt-1">
                Supports JPG, PNG, WEBP • Auto-compressed for fast field upload
              </div>
            </div>
          </div>

          {/* Sample Field Presets for quick evaluation */}
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-600 flex items-center gap-1.5 uppercase tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                {formatBilingual('Or Try Sample Field Photos', 'sampleLeaves', currentLanguage.code)}:
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
              {SAMPLE_FIELD_ITEMS.map((rawItem) => {
                const item = getLocalizedSampleItem(rawItem, currentLanguage.code);
                return (
                  <button
                    key={item.id}
                    id={`sample-item-${item.id}`}
                    type="button"
                    onClick={() => handleSelectSample(item.imageUrl, item)}
                    className="group flex flex-col text-left rounded-xl overflow-hidden border border-gray-200 hover:border-emerald-500 bg-white hover:shadow-md transition-all p-1.5 cursor-pointer"
                  >
                    <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-gray-100 mb-1.5">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                      <span className={`absolute top-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded text-white ${
                        item.category === 'crop' ? 'bg-emerald-700' : 'bg-amber-700'
                      }`}>
                        {item.category === 'crop' 
                          ? formatBilingual('Crop', 'cropTag', currentLanguage.code)
                          : formatBilingual('Soil', 'soilTag', currentLanguage.code)}
                      </span>
                    </div>
                    <div className="text-[11px] font-bold text-gray-800 line-clamp-1 group-hover:text-emerald-700">
                      <BilingualText text={item.title} langCode={currentLanguage.code} />
                    </div>
                    <div className="text-[10px] text-gray-500 line-clamp-1">
                      <BilingualText text={item.description} langCode={currentLanguage.code} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
