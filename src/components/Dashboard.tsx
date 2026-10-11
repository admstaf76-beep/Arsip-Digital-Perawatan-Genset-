import React from 'react';
import {
  GensetItem,
  InspectionRecord,
  MaintenanceRecord,
  IncidentRecord,
  UserSession,
} from '../types/genset';
import {
  Activity,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Wrench,
  FileSpreadsheet,
  ArrowRight,
  TrendingUp,
  MapPin,
  Flame,
  Gauge,
  PlusCircle,
  Zap,
  FileText,
  Printer,
  PieChart as PieChartIcon,
  Filter,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

interface DashboardProps {
  gensets: GensetItem[];
  inspections: InspectionRecord[];
  maintenances: MaintenanceRecord[];
  incidents: IncidentRecord[];
  activeUser: UserSession;
  onNavigate: (tab: string) => void;
  onSelectGensetDetail: (genset: GensetItem) => void;
  onOpenNewInspection: () => void;
  onOpenNewMaintenance: () => void;
  onOpenNewIncident: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  gensets,
  maintenances,
  incidents,
  activeUser,
  onNavigate,
  onSelectGensetDetail,
  onOpenNewInspection,
  onOpenNewMaintenance,
  onOpenNewIncident,
}) => {
  // Quantitative Calculations
  const totalGenset = gensets.length;
  const siapCount = gensets.filter((g) => g.kondisi === 'S').length;
  const usRinganCount = gensets.filter((g) => g.kondisi === 'US Ringan').length;
  const usCount = gensets.filter((g) => g.kondisi === 'US').length;

  const averageHealthScore =
    totalGenset > 0
      ? Math.round(gensets.reduce((acc, curr) => acc + curr.healthScore, 0) / totalGenset)
      : 0;

  const pendingApprovalCount = maintenances.filter(
    (m) => m.approvalStatus === 'Menunggu Review'
  ).length;

  const activeIncidents = incidents.filter((i) => i.status !== 'Selesai');

  // Breakdown by Satuan
  const denmaGensets = gensets.filter((g) => g.satuan === 'SATUAN DENMA');
  const denmaAvgHealth =
    denmaGensets.length > 0
      ? Math.round(denmaGensets.reduce((acc, g) => acc + g.healthScore, 0) / denmaGensets.length)
      : 0;

  // Filter state for Interactive Pie Chart & Unit List
  const [selectedKondisiFilter, setSelectedKondisiFilter] = React.useState<string>('ALL');

  // Breakdown data for Recharts Pie Chart (Kondisi S, US Ringan, US)
  const readinessData = [
    {
      name: 'Siap Operasi (S)',
      code: 'S',
      value: siapCount,
      percentage: totalGenset > 0 ? Math.round((siapCount / totalGenset) * 100) : 0,
      color: '#10b981', // emerald-500
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      dotColor: 'bg-emerald-500',
      cardBorder: 'border-emerald-200 hover:border-emerald-400',
      activeBorder: 'ring-2 ring-emerald-500 bg-emerald-50/60',
      description: 'Unit prima & standby otomatis',
      summary: `${siapCount} dari ${totalGenset} unit siaga penuh`,
      items: gensets.filter((g) => g.kondisi === 'S'),
    },
    {
      name: 'US Ringan',
      code: 'US Ringan',
      value: usRinganCount,
      percentage: totalGenset > 0 ? Math.round((usRinganCount / totalGenset) * 100) : 0,
      color: '#f59e0b', // amber-500
      badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
      dotColor: 'bg-amber-500',
      cardBorder: 'border-amber-200 hover:border-amber-400',
      activeBorder: 'ring-2 ring-amber-500 bg-amber-50/60',
      description: 'Dapat beroperasi, perlu servis/spare part',
      summary: `${usRinganCount} unit memerlukan atensi`,
      items: gensets.filter((g) => g.kondisi === 'US Ringan'),
    },
    {
      name: 'Tidak Siap (US)',
      code: 'US',
      value: usCount,
      percentage: totalGenset > 0 ? Math.round((usCount / totalGenset) * 100) : 0,
      color: '#ef4444', // red-500
      badgeBg: 'bg-red-100 text-red-800 border-red-300',
      dotColor: 'bg-red-500',
      cardBorder: 'border-red-200 hover:border-red-400',
      activeBorder: 'ring-2 ring-red-500 bg-red-50/60',
      description: 'Rusak berat / modul alarm, tidak siap',
      summary: `${usCount} unit dalam antrean perbaikan`,
      items: gensets.filter((g) => g.kondisi === 'US'),
    },
  ];

  const filteredGensets =
    selectedKondisiFilter === 'ALL'
      ? gensets
      : gensets.filter((g) => g.kondisi === selectedKondisiFilter);

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-xs text-white p-3 rounded-lg shadow-xl text-xs border border-slate-700 pointer-events-none z-50">
          <div className="flex items-center gap-2 font-bold mb-1">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: data.color }}
            />
            <span className="text-white">{data.name}</span>
          </div>
          <div className="text-slate-300">
            Jumlah:{' '}
            <strong className="text-white font-mono font-bold">{data.value} Unit</strong>{' '}
            ({data.percentage}%)
          </div>
          <p className="text-[11px] text-slate-400 mt-1 max-w-[220px] leading-relaxed">
            {data.description}
          </p>
          <div className="mt-1.5 pt-1.5 border-t border-slate-800 text-[10px] text-blue-300">
            Klik diagram untuk filter unit di bawah
          </div>
        </div>
      );
    }
    return null;
  };

  const getConditionBadge = (kondisi: string) => {
    switch (kondisi) {
      case 'S':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Siap Operasi (S)
          </span>
        );
      case 'US Ringan':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            US Ringan (Perhatian)
          </span>
        );
      case 'US':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
            US (Tidak Siap / Rusak)
          </span>
        );
      default:
        return <span>{kondisi}</span>;
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-500';
    if (score >= 60) return 'text-amber-600 bg-amber-500';
    return 'text-red-600 bg-red-500';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Welcome Info */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-xl p-6 text-white shadow-sm border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs uppercase tracking-wider font-semibold text-blue-300">
                Pusat Kendali Operasi Logistik
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-xs text-slate-300">Update Real-Time 2026</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Sistem Monitoring & Pemeliharaan Genset
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Memantau kesiapan operasional kelistrikan darurat seluruh unit genset Denma.
              Mendukung CMMS pemeliharaan berkala, pelaporan kerusakan, dan sistem persetujuan pimpinan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {(activeUser.role === 'TEKNISI' || activeUser.role === 'ADMIN2') && (
              <>
                <button
                  onClick={onOpenNewInspection}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-xs cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Input Pemeriksaan</span>
                </button>
                <button
                  onClick={onOpenNewMaintenance}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 transition-colors cursor-pointer"
                >
                  <Wrench className="w-4 h-4 text-blue-400" />
                  <span>Catat Maintenance</span>
                </button>
              </>
            )}
            {activeUser.role === 'KADISLOG' && (
              <button
                onClick={() => onNavigate('approval')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 transition-colors shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Review Approval ({pendingApprovalCount})</span>
              </button>
            )}
            <button
              onClick={() => onNavigate('laporan')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-xs cursor-pointer"
              title="Akses Cepat Cetak, Simpan & Download PDF Resmi A4"
            >
              <FileText className="w-4 h-4" />
              <span>Cetak & Download PDF (A4)</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards (Single Elevation, Tabular Numerals) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Genset */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Total Unit Genset</span>
            <Activity className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {totalGenset}
            </span>
            <span className="text-xs text-slate-500">Unit</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            <span>Satuan Denma ({totalGenset} Unit Operasional)</span>
          </div>
        </div>

        {/* Siap Operasi */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Kondisi Siap (S)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-emerald-700">
              {siapCount}
            </span>
            <span className="text-xs text-emerald-600 font-semibold">
              ({Math.round((siapCount / totalGenset) * 100)}%)
            </span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-700">
            Standby siap start otomatis
          </div>
        </div>

        {/* US Ringan */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>US Ringan</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-amber-700">
              {usRinganCount}
            </span>
            <span className="text-xs text-slate-500">Unit</span>
          </div>
          <div className="mt-2 text-[11px] text-amber-700">
            Perlu perbaikan ringan
          </div>
        </div>

        {/* US (Rusak) */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Tidak Siap (US)</span>
            <Flame className="w-4 h-4 text-red-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-red-700">
              {usCount}
            </span>
            <span className="text-xs text-slate-500">Unit</span>
          </div>
          <div className="mt-2 text-[11px] text-red-700">
            Kerusakan modul / injeksi
          </div>
        </div>

        {/* Average Health Score */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Rata-rata Health</span>
            <Gauge className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-blue-900">
              {averageHealthScore}%
            </span>
            <span className="text-xs text-slate-500">Indeks</span>
          </div>
          <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full ${getHealthColor(averageHealthScore).split(' ')[1]}`}
              style={{ width: `${averageHealthScore}%` }}
            />
          </div>
        </div>

        {/* Approval Pending */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Approval Kadislog</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {pendingApprovalCount}
            </span>
            <span className="text-xs text-slate-500">Pekerjaan</span>
          </div>
          <div className="mt-2 text-[11px]">
            {pendingApprovalCount > 0 ? (
              <button
                onClick={() => onNavigate('approval')}
                className="text-blue-600 hover:underline font-semibold flex items-center gap-0.5"
              >
                Tinjau sekarang <ArrowRight className="w-3 h-3" />
              </button>
            ) : (
              <span className="text-emerald-700">Semua SPK selesai disetujui</span>
            )}
          </div>
        </div>
      </div>

      {/* Critical Alert Banner if any US/US Ringan Genset exists */}
      {(usCount > 0 || usRinganCount > 0) && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800">
                Peringatan Kesiapan Operasional
              </h4>
              <p className="text-xs text-amber-900 mt-0.5">
                Terdapat <strong>{usCount} unit US</strong> (DEUTZ 250 KVA) dan{' '}
                <strong>{usRinganCount} unit US Ringan</strong> (PERKINS 150 KVA) yang memerlukan
                tindakan suku cadang dan pemeliharaan segera.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigate('gangguan')}
              className="px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors cursor-pointer"
            >
              Cek Laporan Gangguan
            </button>
          </div>
        </div>
      )}

      {/* Visual Readiness Summary with Recharts (Diagram Lingkaran) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <PieChartIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <span>Ringkasan Visual Kesiapan Genset</span>
                <span className="text-[10px] font-normal uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
                  Diagram Lingkaran
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Proporsi kondisi operasional unit Denma: Kondisi S, US Ringan, dan US
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs text-slate-500 hidden sm:inline">Kesiapan Armada:</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {Math.round((siapCount / totalGenset) * 100)}% Siap Operasi
            </span>
            {selectedKondisiFilter !== 'ALL' && (
              <button
                onClick={() => setSelectedKondisiFilter('ALL')}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold underline underline-offset-2 ml-1 cursor-pointer"
              >
                Tampilkan Semua
              </button>
            )}
          </div>
        </div>

        <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Recharts Pie Chart (Diagram Lingkaran) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="relative w-full h-64 sm:h-72 max-w-sm mx-auto flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Pie
                    data={readinessData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="48%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    stroke="#ffffff"
                    onClick={(entry: any) => {
                      const code = entry?.code || entry?.payload?.code;
                      if (code) {
                        setSelectedKondisiFilter((prev) =>
                          prev === code ? 'ALL' : code
                        );
                      }
                    }}
                    cursor="pointer"
                  >
                    {readinessData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        opacity={
                          selectedKondisiFilter === 'ALL' || selectedKondisiFilter === entry.code
                            ? 1
                            : 0.35
                        }
                      />
                    ))}
                  </Pie>
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => {
                      const item = readinessData.find((d) => d.name === value);
                      return (
                        <span className="text-[11px] sm:text-xs text-slate-700 font-medium ml-1">
                          {value} ({item?.value || 0})
                        </span>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Donut Chart Center Metric */}
              <div className="absolute top-[44%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none select-none">
                <span className="block text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-slate-900 leading-none">
                  {totalGenset}
                </span>
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
                  Total Unit
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 text-center mt-1">
              Tip: Sentuh atau klik segmen diagram untuk memfilter unit
            </p>
          </div>

          {/* Cards for Kondisi S, US Ringan, US */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {readinessData.map((cat) => {
              const isSelected = selectedKondisiFilter === cat.code;
              return (
                <button
                  type="button"
                  key={cat.code}
                  onClick={() =>
                    setSelectedKondisiFilter((prev) => (prev === cat.code ? 'ALL' : cat.code))
                  }
                  className={`p-4 rounded-xl border text-left transition-all duration-150 cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? cat.activeBorder
                      : `bg-slate-50/70 ${cat.cardBorder} hover:bg-white hover:shadow-xs`
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold border ${cat.badgeBg}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${cat.dotColor}`} />
                        {cat.code}
                      </span>
                      <span className="text-xs font-bold font-mono text-slate-900">
                        {cat.percentage}%
                      </span>
                    </div>

                    <div className="mt-1">
                      <span className="text-xl font-bold font-mono text-slate-900">
                        {cat.value}
                      </span>
                      <span className="text-xs text-slate-500 ml-1.5">Unit</span>
                    </div>

                    <p className="text-[11px] text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                      {cat.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-200/70">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                      Unit Terdaftar:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {cat.items.map((item) => (
                        <span
                          key={item.id}
                          className="text-[10px] bg-white border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono truncate max-w-[120px]"
                          title={`${item.nama} (${item.kode})`}
                        >
                          {item.nama.replace('GENSET ', '')}
                        </span>
                      ))}
                    </div>
                    <div className="mt-2 text-[10px] text-blue-600 font-semibold flex items-center gap-1">
                      <span>{isSelected ? '✓ Filter Aktif' : 'Tampilkan Unit →'}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid: Health by Unit & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Unit Health Status Matrix */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900">
                  Status Kesiapan & Health Score Per Unit
                </h3>
                {selectedKondisiFilter !== 'ALL' && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                    Filter: Kondisi {selectedKondisiFilter} ({filteredGensets.length} Unit)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {selectedKondisiFilter === 'ALL'
                  ? 'Daftar lengkap 8 genset Satuan Denma'
                  : `Menampilkan ${filteredGensets.length} unit dengan kondisi ${selectedKondisiFilter}`}
              </p>
            </div>
            <button
              onClick={() => onNavigate('master')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Lihat Spesifikasi Lengkap <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredGensets.map((g) => {
              const isUS = g.kondisi === 'US';
              const isUSRingan = g.kondisi === 'US Ringan';
              return (
                <div
                  key={g.id}
                  onClick={() => onSelectGensetDetail(g)}
                  className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        isUS
                          ? 'bg-red-100 text-red-700 border border-red-200'
                          : isUSRingan
                          ? 'bg-amber-100 text-amber-700 border border-amber-200'
                          : 'bg-blue-100 text-blue-700 border border-blue-200'
                      }`}
                    >
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{g.nama}</span>
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {g.kode}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {g.lokasi}
                        </span>
                        <span>·</span>
                        <span>{g.kapasitas}</span>
                        <span>·</span>
                        <span className="font-mono tabular-nums">{g.jamOperasi} Jam Kerja</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    <div className="text-right">
                      <div className="flex items-center gap-1.5 justify-end">
                        <span className="text-xs text-slate-500">Health:</span>
                        <span
                          className={`font-mono font-bold text-sm tabular-nums ${
                            getHealthColor(g.healthScore).split(' ')[0]
                          }`}
                        >
                          {g.healthScore}%
                        </span>
                      </div>
                      <div className="w-24 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div
                          className={`h-full ${getHealthColor(g.healthScore).split(' ')[1]}`}
                          style={{ width: `${g.healthScore}%` }}
                        />
                      </div>
                    </div>

                    <div className="w-32 text-right">{getConditionBadge(g.kondisi)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Satuan Summary & Quick Logs */}
        <div className="space-y-6">
          {/* Satuan Breakdown Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center justify-between">
              <span>Distribusi & Lokasi Unit</span>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </h3>

            {/* Power House & Fasint */}
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">POWER HOUSE & FASINT</span>
                <span className="text-xs font-mono font-bold text-blue-700 tabular-nums">
                  5 Unit
                </span>
              </div>
              <div className="text-[11px] text-slate-500">
                Pusdalops 350 kVA, Deutz 250 kVA, Mako 350 kVA, Genset 800 kVA, Portable 35 kVA
              </div>
            </div>

            {/* Gedung Operasional & Rumdis */}
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">GEDUNG & RUMDIS PIMPINAN</span>
                <span className="text-xs font-mono font-bold text-blue-700 tabular-nums">
                  3 Unit
                </span>
              </div>
              <div className="text-[11px] text-slate-500">
                Genset 150 kVA (G.D Leo Watimena), Rumdis Pangkoopsudnas, Rumdis Kas Koopsudnas
              </div>
            </div>
          </div>

          {/* Active Incidents / Issues Widget */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span>Gangguan Aktif ({activeIncidents.length})</span>
              </h3>
              <button
                onClick={onOpenNewIncident}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
              >
                + Laporkan
              </button>
            </div>

            {activeIncidents.length === 0 ? (
              <div className="text-xs text-slate-500 py-3 text-center bg-slate-50 rounded-lg">
                Tidak ada gangguan aktif saat ini.
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeIncidents.map((inc) => (
                  <div
                    key={inc.id}
                    className="p-3 rounded-lg border border-red-200 bg-red-50/50 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-slate-900">{inc.gensetName}</span>
                      <span className="text-[10px] bg-red-200 text-red-800 px-1.5 py-0.2 rounded font-bold">
                        {inc.status}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] line-clamp-2">{inc.gejala}</p>
                    <div className="text-[10px] text-slate-500 pt-1 border-t border-red-100 flex items-center justify-between">
                      <span>Tindakan: {inc.tindakanPerbaikan.slice(0, 32)}...</span>
                      <span>{inc.tanggal}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SOP Compliance Quick Link */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2 text-xs">
            <div className="flex items-center justify-between font-bold text-blue-900">
              <span>Prosedur K3 & SOP Operasi</span>
              <span className="bg-blue-200 text-blue-800 text-[10px] px-2 py-0.5 rounded">
                Wajib
              </span>
            </div>
            <p className="text-blue-800 text-[11px]">
              Sebelum menjalankan atau memelihara genset, pastikan checklist LOTO, JSA, APD, dan
              pemeriksaan fluida telah ditandatangani.
            </p>
            <button
              onClick={() => onNavigate('sop')}
              className="text-xs font-semibold text-blue-700 hover:underline flex items-center gap-1 pt-1"
            >
              Buka Form Checklist SOP & K3 <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
