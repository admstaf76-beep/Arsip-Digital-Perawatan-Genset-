import React, { useState, useEffect } from 'react';
import {
  X,
  FileSpreadsheet,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Clock,
  Sparkles,
  Database,
  ArrowRight,
  LogOut,
} from 'lucide-react';
import {
  googleSignIn,
  logoutGoogle,
  getAccessToken,
  getCurrentFirebaseUser,
} from '../services/googleAuth';
import {
  getSavedSpreadsheetId,
  setSavedSpreadsheetId,
  isAutoSyncEnabled,
  setAutoSyncEnabled,
  getLastSyncTime,
  createGensetSpreadsheet,
  syncAllToGoogleSheets,
  verifySpreadsheetAccess,
} from '../services/googleSheets';
import {
  GensetItem,
  InspectionRecord,
  MaintenanceRecord,
  IncidentRecord,
} from '../types/genset';

interface GoogleSheetsSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  gensets: GensetItem[];
  inspections: InspectionRecord[];
  maintenances: MaintenanceRecord[];
  incidents: IncidentRecord[];
  onNotify: (msg: string) => void;
}

export const GoogleSheetsSyncModal: React.FC<GoogleSheetsSyncModalProps> = ({
  isOpen,
  onClose,
  gensets,
  inspections,
  maintenances,
  incidents,
  onNotify,
}) => {
  const [currentUser, setCurrentUser] = useState(getCurrentFirebaseUser());
  const [token, setToken] = useState<string | null>(null);
  const [spreadsheetId, setSpreadsheetId] = useState<string>(getSavedSpreadsheetId());
  const [customSheetInput, setCustomSheetInput] = useState<string>('');
  const [autoSync, setAutoSync] = useState<boolean>(isAutoSyncEnabled());
  const [lastSync, setLastSync] = useState<string | null>(getLastSyncTime());

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [spreadsheetTitle, setSpreadsheetTitle] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      getAccessToken().then((t) => {
        setToken(t);
        const u = getCurrentFirebaseUser();
        setCurrentUser(u);
        const savedId = getSavedSpreadsheetId();
        setSpreadsheetId(savedId);
        setLastSync(getLastSyncTime());
        if (t && savedId) {
          verifySpreadsheetAccess(t, savedId).then((res) => {
            if (res.valid && res.title) {
              setSpreadsheetTitle(res.title);
            }
          });
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setToken(res.accessToken);
        setCurrentUser(res.user);
        onNotify(`Terhubung dengan Google: ${res.user.email}`);

        // If spreadsheet already configured, test connection
        const savedId = getSavedSpreadsheetId();
        if (savedId) {
          const verify = await verifySpreadsheetAccess(res.accessToken, savedId);
          if (verify.valid && verify.title) {
            setSpreadsheetTitle(verify.title);
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage('Gagal login ke Google. Periksa koneksi atau izin.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogout = async () => {
    await logoutGoogle();
    setToken(null);
    setCurrentUser(null);
    setSpreadsheetTitle('');
    onNotify('Koneksi Google telah diputuskan.');
  };

  const handleCreateNewSpreadsheet = async () => {
    if (!token) {
      onNotify('Silakan login dengan Google terlebih dahulu.');
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);
    try {
      const result = await createGensetSpreadsheet(
        token,
        `Sistem Kesiapan & Pemeliharaan Genset GMM - Satuan Denma (${new Date().toLocaleDateString('id-ID')})`
      );
      setSpreadsheetId(result.spreadsheetId);
      setSpreadsheetTitle('Sistem Kesiapan & Pemeliharaan Genset GMM');
      onNotify('Spreadsheet baru berhasil dibuat di Google Drive!');

      // Immediately sync initial data
      setIsSyncing(true);
      await syncAllToGoogleSheets(token, result.spreadsheetId, {
        gensets,
        inspections,
        maintenances,
        incidents,
      });
      setLastSync(getLastSyncTime());
      onNotify('Seluruh data awal berhasil disinkronkan ke Google Spreadsheet!');
    } catch (err: any) {
      console.error(err);
      setStatusMessage(err.message || 'Gagal membuat Google Spreadsheet.');
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  };

  const handleSaveCustomSpreadsheetId = async () => {
    if (!token) {
      onNotify('Silakan login dengan Google terlebih dahulu.');
      return;
    }
    let cleanId = customSheetInput.trim();
    // Support URL parsing (extract id from /spreadsheets/d/{id}/...)
    const urlMatch = cleanId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (urlMatch && urlMatch[1]) {
      cleanId = urlMatch[1];
    }

    if (!cleanId) return;

    setIsLoading(true);
    try {
      const verify = await verifySpreadsheetAccess(token, cleanId);
      if (verify.valid) {
        setSavedSpreadsheetId(cleanId);
        setSpreadsheetId(cleanId);
        setSpreadsheetTitle(verify.title || 'Google Spreadsheet Terhubung');
        setCustomSheetInput('');
        onNotify('Google Spreadsheet berhasil dihubungkan!');
      } else {
        setStatusMessage('Spreadsheet tidak ditemukan atau akun Google tidak memiliki hak akses edit.');
      }
    } catch (err: any) {
      setStatusMessage('Gagal memverifikasi Spreadsheet ID.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncNow = async () => {
    if (!token) {
      onNotify('Silakan login dengan Google terlebih dahulu.');
      return;
    }
    if (!spreadsheetId) {
      onNotify('Silakan buat atau hubungkan Google Spreadsheet terlebih dahulu.');
      return;
    }

    setIsSyncing(true);
    setStatusMessage(null);
    try {
      const res = await syncAllToGoogleSheets(token, spreadsheetId, {
        gensets,
        inspections,
        maintenances,
        incidents,
      });
      setLastSync(getLastSyncTime());
      onNotify(res.message);
    } catch (err: any) {
      console.error(err);
      setStatusMessage(err.message || 'Gagal sinkronisasi data.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleAutoSync = (enabled: boolean) => {
    setAutoSync(enabled);
    setAutoSyncEnabled(enabled);
    onNotify(
      enabled
        ? 'Sinkronisasi real-time otomatis AKTIF.'
        : 'Sinkronisasi otomatis DINONAKTIFKAN.'
    );
  };

  const spreadsheetUrl = spreadsheetId
    ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20">
              <FileSpreadsheet className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Integrasi Google Sheets Terpusat</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  Cloud Backup API
                </span>
              </h3>
              <p className="text-xs text-emerald-100/80">
                Sinkronisasi real-time data inspeksi, pemeliharaan SPK, dan laporan gangguan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto text-slate-800">
          {/* Status Message */}
          {statusMessage && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Section 1: Google Account Authentication */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  1. Status Autentikasi Google
                </span>
              </div>
              {currentUser && token ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Terhubung
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                  Belum Terhubung
                </span>
              )}
            </div>

            {currentUser && token ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200/80">
                <div className="flex items-center gap-3">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || ''}
                      className="w-9 h-9 rounded-full border border-slate-300"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
                      {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      {currentUser.displayName || 'Akun Google'}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {currentUser.email}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleGoogleLogout}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-slate-200"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Putuskan</span>
                </button>
              </div>
            ) : (
              <div className="text-center py-3 bg-white rounded-lg border border-slate-200/80">
                <p className="text-xs text-slate-500 mb-3 max-w-md mx-auto">
                  Hubungkan dengan Google Sheets & Drive untuk mencadangkan data secara otomatis.
                </p>
                {/* Official Sign in with Google Button Style */}
                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  type="button"
                  className="inline-flex items-center justify-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                  <span>{isLoading ? 'Menghubungkan...' : 'Sign in with Google'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Section 2: Target Google Spreadsheet */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  2. Google Spreadsheet Terhubung
                </span>
              </div>
            </div>

            {spreadsheetId ? (
              <div className="bg-white p-3.5 rounded-lg border border-slate-200/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span>{spreadsheetTitle || 'Spreadsheet GMM - Satuan Denma'}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate max-w-sm">
                      ID: {spreadsheetId}
                    </div>
                  </div>
                  {spreadsheetUrl && (
                    <a
                      href={spreadsheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Buka di Google Sheets</span>
                    </a>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
                  <span className="font-semibold text-slate-700">Tab Sheet:</span>
                  <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px]">
                    Inspeksi_Kondisi
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px]">
                    Pemeliharaan_SPK
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px]">
                    Laporan_Gangguan
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px]">
                    Master_Genset
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3 bg-white p-4 rounded-lg border border-slate-200/80">
                <p className="text-xs text-slate-600">
                  Belum ada Spreadsheet yang dipilih. Anda dapat membuat file baru langsung di Google Drive Anda:
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={handleCreateNewSpreadsheet}
                    disabled={!token || isLoading}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-200" />
                    <span>Buat Spreadsheet Baru Otomatis</span>
                  </button>
                </div>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="shrink mx-2 text-[10px] text-slate-400 uppercase font-semibold">
                    Atau Hubungkan yang Sudah Ada
                  </span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customSheetInput}
                    onChange={(e) => setCustomSheetInput(e.target.value)}
                    placeholder="Tempel Spreadsheet ID atau URL Google Sheets..."
                    className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                  <button
                    onClick={handleSaveCustomSpreadsheetId}
                    disabled={!token || !customSheetInput.trim() || isLoading}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Hubungkan
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Synchronization Controls & Real-Time Setting */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  3. Pengaturan & Aksi Sinkronisasi
                </span>
              </div>
              {lastSync && (
                <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Terakhir sync: {lastSync}</span>
                </div>
              )}
            </div>

            {/* Toggle Real-time */}
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200/80">
              <div>
                <div className="text-xs font-bold text-slate-900">
                  Sinkronisasi Real-Time Otomatis
                </div>
                <div className="text-[11px] text-slate-500">
                  Setiap kali teknisi menyimpan form inspeksi, SPK, atau gangguan, data langsung dikirim ke Google Sheets
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={(e) => handleToggleAutoSync(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Summary to Sync */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                  Master Unit
                </span>
                <span className="text-base font-bold font-mono text-slate-800">
                  {gensets.length}
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                  Inspeksi 13P
                </span>
                <span className="text-base font-bold font-mono text-blue-700">
                  {inspections.length}
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                  SPK Perawatan
                </span>
                <span className="text-base font-bold font-mono text-emerald-700">
                  {maintenances.length}
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                  Gangguan
                </span>
                <span className="text-base font-bold font-mono text-red-700">
                  {incidents.length}
                </span>
              </div>
            </div>

            {/* Manual Sync Button */}
            <button
              onClick={handleSyncNow}
              disabled={!token || !spreadsheetId || isSyncing}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-sm hover:shadow cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>
                {isSyncing
                  ? 'Sedang Menyinkronkan ke Google Sheets...'
                  : 'Sinkronkan Semua Data Sekarang (Full Backup)'}
              </span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px]">
            API Terenkripsi HTTPS · Google Workspace OAuth 2.0
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
