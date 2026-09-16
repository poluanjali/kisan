import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, Clock, CloudOff, AlertCircle, Database, ArrowUpRight, Zap } from 'lucide-react';
import { OfflineQueueItem, CropSoilAnalysisResult } from '../types';

interface OfflineSyncManagerProps {
  onSyncComplete?: (syncedResults: CropSoilAnalysisResult[]) => void;
  isSimulatedOffline?: boolean;
  onToggleSimulatedOffline?: () => void;
}

const QUEUE_STORAGE_KEY = 'kisan_offline_diagnoses_queue';
const MANDI_CACHE_KEY = 'kisan_offline_mandi_cache';

export const OfflineSyncManager: React.FC<OfflineSyncManagerProps> = ({
  onSyncComplete,
  isSimulatedOffline = false,
  onToggleSimulatedOffline,
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [queue, setQueue] = useState<OfflineQueueItem[]>(() => {
    try {
      const saved = localStorage.getItem(QUEUE_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string>('');

  // Track online/offline browser state
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check queue from localStorage periodically
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const saved = localStorage.getItem(QUEUE_STORAGE_KEY);
        if (saved) {
          setQueue(JSON.parse(saved));
        }
      } catch (e) {
        // ignore
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const effectiveOffline = isSimulatedOffline || !isOnline;

  const handleSyncNow = async () => {
    if (queue.length === 0 || isSyncing) return;
    setIsSyncing(true);
    setSyncMessage('Connecting to Kisan Mitra AI Cloud...');

    try {
      const updatedQueue = [...queue];
      const syncedResults: CropSoilAnalysisResult[] = [];

      for (let i = 0; i < updatedQueue.length; i++) {
        const item = updatedQueue[i];
        if (item.status === 'pending') {
          setSyncMessage(`Syncing case ${i + 1} of ${updatedQueue.length}: ${item.question || 'Crop specimen'}...`);
          try {
            const res = await fetch('/api/analyze', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                imageUrl: item.image,
                question: item.question,
                targetLang: item.languageName || 'Hindi',
              }),
            });
            const data = await res.json();
            if (data.success && data.result) {
              item.status = 'synced';
              item.cachedResult = data.result;
              syncedResults.push(data.result);
            }
          } catch (e) {
            console.error('Failed to sync item:', item.id, e);
          }
        }
      }

      // Filter out synced items or mark them
      const remainingQueue = updatedQueue.filter((item) => item.status !== 'synced');
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(remainingQueue));
      setQueue(remainingQueue);

      setSyncMessage(`Successfully synced ${syncedResults.length} pending diagnoses.`);
      if (onSyncComplete && syncedResults.length > 0) {
        onSyncComplete(syncedResults);
      }
      setTimeout(() => setSyncMessage(''), 4000);
    } catch (err) {
      console.error('Batch sync error:', err);
      setSyncMessage('Sync encountered network interruptions. Queued items preserved.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddSampleOfflineQueue = () => {
    const newItem: OfflineQueueItem = {
      id: `queue-${Date.now()}`,
      timestamp: Date.now(),
      image: 'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=600&auto=format&fit=crop&q=80',
      question: 'Tomato leaf brown concentric circles after rain',
      languageCode: 'hi',
      languageName: 'Hindi',
      status: 'pending',
    };
    const newQueue = [newItem, ...queue];
    setQueue(newQueue);
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(newQueue));
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-5 sm:p-6 space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
            effectiveOffline ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
          }`}>
            {effectiveOffline ? <WifiOff className="w-5 h-5" /> : <Wifi className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                effectiveOffline ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
              }`}>
                {effectiveOffline ? 'Offline Field Mode' : 'Online Sync Active'}
              </span>
              <span className="text-xs text-gray-500">Local-First Storage</span>
            </div>
            <h3 className="text-lg font-black text-gray-900 mt-0.5">
              Field Connectivity & Sync Engine
            </h3>
          </div>
        </div>

        {/* Manual Test Switch for Simulation */}
        {onToggleSimulatedOffline && (
          <button
            onClick={onToggleSimulatedOffline}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-colors cursor-pointer self-start sm:self-auto ${
              isSimulatedOffline
                ? 'bg-amber-600 text-white border-amber-700'
                : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
            }`}
          >
            {isSimulatedOffline ? 'Simulating Field Offline (Click to Go Online)' : 'Simulate Low Connectivity'}
          </button>
        )}
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Pending Diagnoses</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-gray-900 mt-1">{queue.length}</p>
          <p className="text-[11px] text-gray-600">Saved safely in phone storage</p>
        </div>

        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Offline Mandi Rates</span>
            <Database className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-1">Cached</p>
          <p className="text-[11px] text-gray-600">Available without internet</p>
        </div>

        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Expense Ledger</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-1">100% Local</p>
          <p className="text-[11px] text-gray-600">Persistent across app reloads</p>
        </div>
      </div>

      {/* Sync Action Area */}
      {queue.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-bold text-amber-950 flex items-center gap-1.5">
                <CloudOff className="w-4 h-4 text-amber-700" />
                {queue.length} Diagnosis Request{queue.length > 1 ? 's' : ''} Queued Offline
              </h4>
              <p className="text-xs text-amber-900/90">
                Captured while in the field. Sync when you return to cell tower range or Wi-Fi.
              </p>
            </div>
            <button
              onClick={handleSyncNow}
              disabled={isSyncing}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Queued Items Now'}</span>
            </button>
          </div>

          {/* Queue List Preview */}
          <div className="space-y-2 pt-1 max-h-40 overflow-y-auto">
            {queue.map((item) => (
              <div key={item.id} className="bg-white/90 p-2.5 rounded-xl border border-amber-200/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {item.image && (
                    <img src={item.image} alt="Queued" className="w-8 h-8 rounded-lg object-cover border" />
                  )}
                  <span className="font-semibold text-gray-800 line-clamp-1">{item.question || 'Photo specimen'}</span>
                </div>
                <span className="font-bold text-amber-700 uppercase text-[10px] bg-amber-100 px-2 py-0.5 rounded">
                  Pending Sync
                </span>
              </div>
            ))}
          </div>

          {syncMessage && (
            <p className="text-xs font-bold text-emerald-800 bg-emerald-100 p-2 rounded-lg">
              {syncMessage}
            </p>
          )}
        </div>
      )}

      {/* Add Sample Queue Item button for demo */}
      {queue.length === 0 && (
        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs text-gray-600">
          <span>All field diagnoses are currently synced with the cloud.</span>
          <button
            onClick={handleAddSampleOfflineQueue}
            className="text-emerald-700 font-bold hover:underline cursor-pointer"
          >
            + Test Queue an Offline Field Case
          </button>
        </div>
      )}
    </div>
  );
};
