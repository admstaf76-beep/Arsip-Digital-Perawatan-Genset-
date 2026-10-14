import React, { useState } from 'react';
import { UserSession } from '../types/genset';
import {
  Activity,
  Zap,
  Wrench,
  CheckSquare,
  AlertTriangle,
  ClipboardList,
  FileText,
  UserCheck,
  ChevronDown,
  Database,
  RefreshCw,
  Menu,
  X,
  FileSpreadsheet,
  History,
  Gauge,
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeUser: UserSession;
  onOpenLoginModal: () => void;
  onOpenAuditModal: () => void;
  onOpenGoogleSheetsModal: () => void;
  pendingApprovalCount: number;
  openIncidentsCount: number;
  runningOperationsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  activeUser,
  onOpenLoginModal,
  onOpenAuditModal,
  onOpenGoogleSheetsModal,
  pendingApprovalCount,
  openIncidentsCount,
  runningOperationsCount = 0,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('Google Sheets Terintegrasi');

  const handleManualSync = () => {
    setIsSyncing(true);
    setSyncStatus('Sinkronisasi Google Spreadsheet...');
    setTimeout(() => {
      setIsSyncing(false);
      setSyncStatus('Semua data tersinkronisasi');
    }, 800);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'master', label: 'Master Genset', icon: Zap },
    {
      id: 'operasional',
      label: 'Logbook Operasional',
      icon: Gauge,
      badge: runningOperationsCount > 0 ? runningOperationsCount : undefined,
      badgeColor: 'bg-emerald-600 text-white animate-pulse',
    },
    { id: 'pemeriksaan', label: 'Pemeriksaan (13 Item)', icon: CheckSquare },
    { id: 'perawatan', label: 'Perawatan CMMS', icon: Wrench },
    {
      id: 'gangguan',
      label: 'Kerusakan & Perbaikan',
      icon: AlertTriangle,
      badge: openIncidentsCount > 0 ? openIncidentsCount : undefined,
    },
    { id: 'sop', label: 'SOP & K3', icon: ClipboardList },
    {
      id: 'approval',
      label: 'Approval Kadislog',
      icon: UserCheck,
      badge: pendingApprovalCount > 0 ? pendingApprovalCount : undefined,
      badgeColor: 'bg-amber-500 text-white',
    },
    { id: 'laporan', label: 'Laporan Resmi', icon: FileText },
  ];

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'KADISLOG':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 'TEKNISI':
        return 'bg-blue-50 text-blue-800 border-blue-300';
      case 'ADMIN2':
        return 'bg-amber-50 text-amber-800 border-amber-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Top Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-700 text-white flex items-center justify-center font-black tracking-wider shadow-xs">
              <Zap className="w-5 h-5 fill-white text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-slate-900 whitespace-nowrap">
                  Fasint Denma Koopsudnas
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded font-mono">
                  GMM GENSET
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden md:block">
                Monitoring Kesiapan, Health Score & CMMS Pemeliharaan
              </p>
            </div>
          </div>

          {/* Zone 2: Sync Status & History (Desktop) */}
          <div className="hidden lg:flex items-center gap-4 text-xs text-slate-500">
            <button
              onClick={onOpenGoogleSheetsModal}
              title="Buka panel Sinkronisasi Google Sheets"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-semibold">{syncStatus}</span>
              <RefreshCw
                className={`w-3 h-3 text-emerald-600 ${isSyncing ? 'animate-spin' : ''}`}
              />
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={onOpenAuditModal}
              className="flex items-center gap-1.5 hover:text-blue-700 transition-colors cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-slate-500" />
              <span>Histori Perubahan</span>
            </button>
          </div>

          {/* Zone 3: Active User Role & Switcher */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenLoginModal}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${getRoleBadgeStyle(
                activeUser.role
              )} hover:brightness-95 shadow-xs`}
              title="Klik untuk mengganti akun / role"
            >
              <div className="text-left">
                <div className="font-bold tracking-wide flex items-center gap-1">
                  <span>{activeUser.role}</span>
                  <span className="text-[10px] opacity-75 hidden sm:inline">
                    ({activeUser.name})
                  </span>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Primary Navigation Tabs (Desktop) */}
      <div className="border-t border-slate-100 bg-slate-50/70 hidden lg:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 overflow-x-auto py-1 scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-md whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-blue-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        item.badgeColor || (isActive ? 'bg-white text-blue-700' : 'bg-red-500 text-white')
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
          <button
            onClick={() => {
              onOpenGoogleSheetsModal();
              setMobileMenuOpen(false);
            }}
            className="w-full p-2.5 mb-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs flex items-center justify-between hover:bg-emerald-100 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-1.5 font-semibold text-emerald-800">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Google Sheets Terintegrasi</span>
            </div>
            <span className="font-semibold text-emerald-700 flex items-center gap-1 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              Buka Pengaturan →
            </span>
          </button>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-700 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                      isActive ? 'bg-white text-blue-700' : 'bg-red-500 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                onOpenAuditModal();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <History className="w-4 h-4 text-slate-500" />
              <span>Lihat Histori Perubahan Data</span>
            </button>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (Persistent 1-Tap Access for Smartphones) */}
      <nav className="print:hidden lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-1 py-1 shadow-lg flex items-center justify-around safe-bottom">
        <button
          onClick={() => {
            setActiveTab('dashboard');
            setMobileMenuOpen(false);
          }}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] font-semibold transition-colors min-h-[44px] ${
            activeTab === 'dashboard' ? 'text-blue-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-5 h-5 mb-0.5" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('master');
            setMobileMenuOpen(false);
          }}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] font-semibold transition-colors min-h-[44px] ${
            activeTab === 'master' ? 'text-blue-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Zap className="w-5 h-5 mb-0.5" />
          <span>Genset</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('pemeriksaan');
            setMobileMenuOpen(false);
          }}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] font-semibold transition-colors min-h-[44px] ${
            activeTab === 'pemeriksaan' ? 'text-blue-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckSquare className="w-5 h-5 mb-0.5" />
          <span>Cek 13</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('perawatan');
            setMobileMenuOpen(false);
          }}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] font-semibold transition-colors min-h-[44px] ${
            activeTab === 'perawatan' || activeTab === 'gangguan' ? 'text-blue-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Wrench className="w-5 h-5 mb-0.5" />
          <span>CMMS</span>
        </button>

        {/* Highlighted Laporan / Cetak Tab for Instant Access */}
        <button
          onClick={() => {
            setActiveTab('laporan');
            setMobileMenuOpen(false);
          }}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] font-bold transition-colors min-h-[44px] ${
            activeTab === 'laporan'
              ? 'text-emerald-700 bg-emerald-50 border border-emerald-300'
              : 'text-emerald-600 hover:text-emerald-700'
          }`}
        >
          <div className="relative">
            <FileText className="w-5 h-5 mb-0.5" />
            <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>
          <span>Cetak PDF</span>
        </button>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-semibold min-h-[44px] transition-colors ${
            mobileMenuOpen ? 'text-blue-700 font-bold bg-slate-100' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {mobileMenuOpen ? <X className="w-5 h-5 mb-0.5" /> : <Menu className="w-5 h-5 mb-0.5" />}
          <span>{mobileMenuOpen ? 'Tutup' : 'Menu'}</span>
        </button>
      </nav>
    </header>
  );
};
