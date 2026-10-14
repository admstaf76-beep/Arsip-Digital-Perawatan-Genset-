import React from 'react';
import {
  GensetItem,
  InspectionRecord,
  MaintenanceRecord,
  IncidentRecord,
  UserSession,
  GensetOperationalRecord,
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
  BarChart3,
  SlidersHorizontal,
  Bell,
  CalendarClock,
  AlertOctagon,
  Timer,
  Calendar,
  Layers,
  Sparkles,
  BarChart2,
  CheckCircle,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  ComposedChart,
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
  operationalRecords?: GensetOperationalRecord[];
  activeUser: UserSession;
  onNavigate: (tab: string) => void;
  onSelectGensetDetail: (genset: GensetItem) => void;
  onOpenNewInspection: () => void;
  onOpenNewMaintenance: () => void;
  onOpenNewIncident: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  gensets,
  inspections,
  maintenances,
  incidents,
  operationalRecords = [],
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

  // Filter state for Health Score Trend (All Gensets or specific genset)
  const [selectedTrendGenset, setSelectedTrendGenset] = React.useState<string>('ALL');

  // Filter state for Preventive Maintenance (PM) Reminders & Highlights
  const [pmFilter, setPmFilter] = React.useState<'ACTION_NEEDED' | 'ALL' | 'OVERDUE' | 'UPCOMING'>('ACTION_NEEDED');

  // Preventive Maintenance (PM) Calculation: based on Operating Hours (250h cycle) & Date intervals (30 days)
  const pmScheduleData = React.useMemo(() => {
    const today = new Date();

    return gensets.map((g) => {
      // Find latest completed/approved maintenance
      const unitMaints = maintenances
        .filter((m) => m.gensetId === g.id)
        .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
      const lastMaint = unitMaints[0];

      // Operating Hours Interval: Every 250 Hours cycle (PM1 = 250, PM2 = 500, Top Overhaul = 2500, Major = 4000)
      const cycleHours = 250;
      const hoursInCycle = g.jamOperasi % cycleHours;
      const remainingHours = cycleHours - hoursInCycle;
      const nextTargetHours = (Math.floor(g.jamOperasi / cycleHours) + 1) * cycleHours;
      const hoursProgress = Math.min(100, Math.round((hoursInCycle / cycleHours) * 100));

      // Determine PM Type description based on target hours
      let pmType = 'PM Rutin (250 Jam - Ganti Oli & Filter)';
      let pmActionPlan = 'Ganti oli mesin (SAE 15W-40), filter oli pelumas, filter solar primer, bersihkan separator air';
      if (nextTargetHours % 4000 === 0) {
        pmType = 'Major Overhaul (4.000 Jam)';
        pmActionPlan = 'Overhaul total engine, kalibrasi governor & injektor, uji beban penuh 100%, flushing total';
      } else if (nextTargetHours % 2500 === 0) {
        pmType = 'Top Overhaul (2.500 Jam)';
        pmActionPlan = 'Pemeriksaan cylinder head, stel celah katup (valve clearance), descaling radiator, nozzle injector test';
      } else if (nextTargetHours % 500 === 0) {
        pmType = 'PM Menengah (500 Jam - Filter & Radiator)';
        pmActionPlan = 'Ganti filter bahan bakar sekunder, bersihkan filter udara, cek v-belt alternator & coolant radiator';
      }

      // Date Interval: Monthly service cycle (every 30 days)
      const lastDateStr = lastMaint ? lastMaint.tanggal : (g.lastInspected || '2026-09-15');
      const lastDate = new Date(lastDateStr);
      const diffTime = Math.max(0, today.getTime() - lastDate.getTime());
      const daysSinceLastMaint = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const daysRemainingMonthly = Math.max(0, 30 - daysSinceLastMaint);

      // Determine Urgency Status
      // Overdue: remaining hours <= 5 OR days >= 30 OR kondisi US
      // Upcoming: remaining hours <= 30 OR days >= 22 (<= 8 days remaining) OR kondisi US Ringan
      let urgency: 'OVERDUE' | 'UPCOMING' | 'NORMAL' = 'NORMAL';
      let urgencyLabel = 'Jadwal Normal';
      let primaryReason = '';

      if (g.kondisi === 'US') {
        urgency = 'OVERDUE';
        urgencyLabel = 'Unit Rusak (US) - Servis Kritis';
        primaryReason = 'Kerusakan komponen esensial, perlu perbaikan segera';
      } else if (remainingHours <= 5 || daysSinceLastMaint >= 30) {
        urgency = 'OVERDUE';
        urgencyLabel = 'Jatuh Tempo Perawatan';
        if (remainingHours <= 5 && daysSinceLastMaint >= 30) {
          primaryReason = `Sisa ${remainingHours} jam kerja & sudah ${daysSinceLastMaint} hari belum servis`;
        } else if (remainingHours <= 5) {
          primaryReason = `Mencapai batas siklus (${remainingHours} jam tersisa menuju ${nextTargetHours} HM)`;
        } else {
          primaryReason = `Sudah ${daysSinceLastMaint} hari sejak servis terakhir (${lastDateStr})`;
        }
      } else if (remainingHours <= 30 || daysSinceLastMaint >= 22 || g.kondisi === 'US Ringan') {
        urgency = 'UPCOMING';
        urgencyLabel = 'Mendekati Jadwal PM';
        if (remainingHours <= 30) {
          primaryReason = `Sisa ${remainingHours} jam operasi menuju target ${nextTargetHours} HM`;
        } else {
          primaryReason = `Sisa ${daysRemainingMonthly} hari menuju siklus pemeliharaan berkala bulanan`;
        }
      } else {
        urgency = 'NORMAL';
        urgencyLabel = 'Jadwal Normal';
        primaryReason = `Sisa ${remainingHours} jam kerja / ${daysRemainingMonthly} hari`;
      }

      return {
        genset: g,
        nextTargetHours,
        hoursInCycle,
        remainingHours,
        hoursProgress,
        lastMaintDate: lastDateStr,
        daysSinceLastMaint,
        daysRemainingMonthly,
        lastMaintSPK: lastMaint?.nomorPekerjaan || '-',
        pmType,
        pmActionPlan,
        urgency,
        urgencyLabel,
        primaryReason,
      };
    }).sort((a, b) => {
      const rank = { OVERDUE: 0, UPCOMING: 1, NORMAL: 2 };
      if (rank[a.urgency] !== rank[b.urgency]) {
        return rank[a.urgency] - rank[b.urgency];
      }
      return a.remainingHours - b.remainingHours;
    });
  }, [gensets, maintenances]);

  const overduePMCount = pmScheduleData.filter((p) => p.urgency === 'OVERDUE').length;
  const upcomingPMCount = pmScheduleData.filter((p) => p.urgency === 'UPCOMING').length;
  const actionNeededCount = overduePMCount + upcomingPMCount;

  const filteredPMSchedules = pmScheduleData.filter((item) => {
    if (pmFilter === 'ACTION_NEEDED') return item.urgency === 'OVERDUE' || item.urgency === 'UPCOMING';
    if (pmFilter === 'OVERDUE') return item.urgency === 'OVERDUE';
    if (pmFilter === 'UPCOMING') return item.urgency === 'UPCOMING';
    return true;
  });

  // Calculate 30-day Health Score trend from inspections
  const healthTrendData = React.useMemo(() => {
    // Generate dates for the last 30 days up to 2026-10-10
    const dates: string[] = [];
    const baseDate = new Date('2026-10-10T12:00:00Z');
    for (let i = 29; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().slice(0, 10));
    }

    // Filter inspections if specific genset is selected
    const targetInspections =
      selectedTrendGenset === 'ALL'
        ? inspections
        : inspections.filter((i) => i.gensetId === selectedTrendGenset);

    return dates.map((dateStr) => {
      // Find inspections on or right before this date to assess health
      const dateInspections = targetInspections.filter((i) => i.tanggal === dateStr);
      const priorInspections = targetInspections
        .filter((i) => i.tanggal <= dateStr)
        .sort((a, b) => (b.tanggal > a.tanggal ? 1 : -1));

      let score = 85; // baseline
      let inspCount = dateInspections.length;
      let statusLabel = 'Normal';

      if (dateInspections.length > 0) {
        const scores = dateInspections.map((i) => {
          if (i.status === 'Normal') return 92;
          if (i.status === 'Perhatian') return 70;
          return 42;
        });
        score = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        statusLabel = dateInspections[0].status;
      } else if (priorInspections.length > 0) {
        // Carry forward previous inspection status with minor variation
        const latest = priorInspections[0];
        if (latest.status === 'Normal') score = 90;
        else if (latest.status === 'Perhatian') score = 68;
        else score = 45;
        statusLabel = latest.status;
      }

      // Format human-readable date label: "12 Sep", "10 Okt"
      const parts = dateStr.split('-');
      const day = parts[2];
      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
        'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
      ];
      const monthName = monthNames[parseInt(parts[1], 10) - 1] || parts[1];
      const displayDate = `${day} ${monthName}`;

      return {
        date: dateStr,
        displayDate,
        healthScore: score,
        inspections: inspCount,
        status: statusLabel,
        kondisi: score >= 80 ? 'Siap (S)' : score >= 60 ? 'US Ringan' : 'Tidak Siap (US)',
      };
    });
  }, [inspections, selectedTrendGenset]);

  const currentAvgTrendScore = healthTrendData.length > 0
    ? Math.round(healthTrendData.reduce((acc, d) => acc + d.healthScore, 0) / healthTrendData.length)
    : 0;
  const latestTrendScore = healthTrendData.length > 0
    ? healthTrendData[healthTrendData.length - 1].healthScore
    : 0;
  const minTrendScore = healthTrendData.length > 0
    ? Math.min(...healthTrendData.map((d) => d.healthScore))
    : 0;
  const maxTrendScore = healthTrendData.length > 0
    ? Math.max(...healthTrendData.map((d) => d.healthScore))
    : 0;

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

  // Running Hours (Jam Operasi) state & data for Recharts
  const [hoursSortOrder, setHoursSortOrder] = React.useState<'desc' | 'asc' | 'kode'>('desc');

  const runningHoursData = React.useMemo(() => {
    const list = [...gensets].map((g) => {
      const shortName = g.nama
        .replace('GENSET ', '')
        .replace('(SATUAN DENMA)', '')
        .trim();
      return {
        id: g.id,
        kode: g.kode,
        nama: g.nama,
        shortName: `${g.kode} (${shortName})`,
        jamOperasi: g.jamOperasi,
        kondisi: g.kondisi,
        healthScore: g.healthScore,
        lokasi: g.lokasi,
        kapasitas: g.kapasitas,
        // Status threshold
        overhaulStatus:
          g.jamOperasi >= 4000
            ? 'Perlu Mayor Overhaul (>4000 Jam)'
            : g.jamOperasi >= 2500
            ? 'Menjelang Top Overhaul (2500-4000 Jam)'
            : 'Jam Operasi Normal (<2500 Jam)',
        barColor:
          g.kondisi === 'S'
            ? '#10b981'
            : g.kondisi === 'US Ringan'
            ? '#f59e0b'
            : '#ef4444',
      };
    });

    if (hoursSortOrder === 'desc') {
      return list.sort((a, b) => b.jamOperasi - a.jamOperasi);
    } else if (hoursSortOrder === 'asc') {
      return list.sort((a, b) => a.jamOperasi - b.jamOperasi);
    }
    return list.sort((a, b) => a.kode.localeCompare(b.kode));
  }, [gensets, hoursSortOrder]);

  const totalJamOperasi = gensets.reduce((acc, g) => acc + g.jamOperasi, 0);
  const avgJamOperasi = totalGenset > 0 ? Math.round(totalJamOperasi / totalGenset) : 0;
  const maxJamUnit = gensets.length > 0 ? [...gensets].sort((a, b) => b.jamOperasi - a.jamOperasi)[0] : null;
  const minJamUnit = gensets.length > 0 ? [...gensets].sort((a, b) => a.jamOperasi - b.jamOperasi)[0] : null;

  // ----------------------------------------------------
  // VISUALISASI RECHARTS 1: Tren Jam Operasi Bulanan (2026)
  // ----------------------------------------------------
  const [selectedMonthlyHoursUnit, setSelectedMonthlyHoursUnit] = React.useState<string>('ALL');
  const [monthlyChartMode, setMonthlyChartMode] = React.useState<'area' | 'breakdown'>('area');

  const monthlyHoursData = React.useMemo(() => {
    // 10 Bulan tahun 2026 (Januari s/d Oktober)
    const monthConfigs = [
      { key: '2026-01', short: 'Jan', full: 'Januari 2026', factor: 1.05, stormWeight: 0.8 },
      { key: '2026-02', short: 'Feb', full: 'Februari 2026', factor: 1.30, stormWeight: 1.4 },
      { key: '2026-03', short: 'Mar', full: 'Maret 2026', factor: 0.95, stormWeight: 0.9 },
      { key: '2026-04', short: 'Apr', full: 'April 2026', factor: 1.00, stormWeight: 1.0 },
      { key: '2026-05', short: 'Mei', full: 'Mei 2026', factor: 1.10, stormWeight: 1.1 },
      { key: '2026-06', short: 'Jun', full: 'Juni 2026', factor: 1.20, stormWeight: 1.2 },
      { key: '2026-07', short: 'Jul', full: 'Juli 2026', factor: 1.05, stormWeight: 0.9 },
      { key: '2026-08', short: 'Agt', full: 'Agustus 2026', factor: 1.40, stormWeight: 1.3 },
      { key: '2026-09', short: 'Sep', full: 'September 2026', factor: 1.15, stormWeight: 1.0 },
      { key: '2026-10', short: 'Okt', full: 'Oktober 2026 (Berjalan)', factor: 0.85, stormWeight: 0.7 },
    ];

    const targetGensets = selectedMonthlyHoursUnit === 'ALL'
      ? gensets
      : gensets.filter((g) => g.id === selectedMonthlyHoursUnit);

    const isAll = selectedMonthlyHoursUnit === 'ALL';

    return monthConfigs.map((cfg) => {
      const logsInMonth = operationalRecords.filter((rec) => {
        const matchesDate = rec.tanggal.startsWith(cfg.key);
        const matchesUnit = isAll || rec.gensetId === selectedMonthlyHoursUnit;
        return matchesDate && matchesUnit;
      });

      const unitCount = targetGensets.length;
      const baseWarmup = unitCount * 3.5;
      const baseOutage = unitCount * 8.5 * cfg.stormWeight;
      const baseSupport = unitCount * 4.0 * (cfg.key === '2026-08' ? 2.5 : 1.0);
      const baseTest = unitCount * 2.0;

      const pemadamanPLN = Math.round((baseOutage + (logsInMonth.filter((l) => l.keperluan === 'Pemadaman PLN').length * 4.5)) * 10) / 10;
      const ujiRutin = Math.round((baseWarmup + (logsInMonth.filter((l) => l.keperluan === 'Uji Coba Rutin / Warm-up').length * 1.5)) * 10) / 10;
      const supportAcara = Math.round((baseSupport + (logsInMonth.filter((l) => l.keperluan === 'Support Operasi & Acara Khusus').length * 3.0)) * 10) / 10;
      const runningTest = Math.round((baseTest + (logsInMonth.filter((l) => l.keperluan === 'Pemeliharaan / Running Test').length * 2.0)) * 10) / 10;

      const totalHours = Math.round((pemadamanPLN + ujiRutin + supportAcara + runningTest) * 10) / 10;
      const avgPerUnit = unitCount > 0 ? Math.round((totalHours / unitCount) * 10) / 10 : 0;

      return {
        monthKey: cfg.key,
        month: cfg.short,
        monthName: cfg.full,
        totalHours,
        avgPerUnit,
        pemadamanPLN,
        ujiRutin,
        supportAcara,
        runningTest,
        logCount: logsInMonth.length,
      };
    });
  }, [gensets, operationalRecords, selectedMonthlyHoursUnit]);

  const totalMonthlyTrendHours = Math.round(monthlyHoursData.reduce((acc, m) => acc + m.totalHours, 0));
  const avgMonthlyTrendHours = Math.round(totalMonthlyTrendHours / (monthlyHoursData.length || 1));
  const peakMonthData = monthlyHoursData.length > 0
    ? [...monthlyHoursData].sort((a, b) => b.totalHours - a.totalHours)[0]
    : null;
  const currentMonthData = monthlyHoursData[monthlyHoursData.length - 1];

  // ----------------------------------------------------
  // VISUALISASI RECHARTS 2: Frekuensi Gangguan Per Unit Genset
  // ----------------------------------------------------
  const [incidentSortOrder, setIncidentSortOrder] = React.useState<'freq_desc' | 'health_asc' | 'kode'>('freq_desc');
  const [incidentStatusFilter, setIncidentStatusFilter] = React.useState<'ALL' | 'ACTIVE_ONLY'>('ALL');

  const incidentFrequencyData = React.useMemo(() => {
    const list = gensets.map((g) => {
      const unitIncidents = incidents.filter(
        (inc) =>
          inc.gensetId === g.id ||
          inc.gensetName.toLowerCase().includes(g.nama.toLowerCase()) ||
          g.nama.toLowerCase().includes(inc.gensetName.toLowerCase()) ||
          inc.gensetName.toLowerCase().includes(g.kode.toLowerCase())
      );

      const openCount = unitIncidents.filter((i) => i.status === 'Open').length;
      const penangananCount = unitIncidents.filter((i) => i.status === 'Dalam Penanganan').length;
      const selesaiCount = unitIncidents.filter((i) => i.status === 'Selesai').length;
      const totalCount = unitIncidents.length;
      const activeCount = openCount + penangananCount;

      let primarySubsystem = 'Normal (Nihil Gangguan)';
      if (unitIncidents.length > 0) {
        const latest = unitIncidents[0];
        primarySubsystem = latest.gejala.length > 35 ? latest.gejala.slice(0, 35) + '...' : latest.gejala;
      } else if (g.kondisi === 'US') {
        primarySubsystem = 'Perlu Rekondisi Bospom / Modul';
      } else if (g.kondisi === 'US Ringan') {
        primarySubsystem = 'Perlu Servis Ringan / Part';
      }

      const mtbfHours = totalCount > 0 ? Math.round(g.jamOperasi / totalCount) : g.jamOperasi;

      const cleanShortName = g.nama
        .replace('GENSET ', '')
        .replace('(SATUAN DENMA)', '')
        .trim();

      return {
        id: g.id,
        kode: g.kode,
        nama: cleanShortName,
        fullName: g.nama,
        lokasi: g.lokasi,
        kapasitas: g.kapasitas,
        kondisi: g.kondisi,
        healthScore: g.healthScore,
        jamOperasi: g.jamOperasi,
        totalGangguan: totalCount,
        open: openCount,
        dalamPenanganan: penangananCount,
        selesai: selesaiCount,
        activeGangguan: activeCount,
        primarySubsystem,
        mtbfHours,
        unitItem: g,
      };
    });

    let filtered = list;
    if (incidentStatusFilter === 'ACTIVE_ONLY') {
      filtered = list.filter((item) => item.activeGangguan > 0 || item.kondisi !== 'S');
    }

    if (incidentSortOrder === 'freq_desc') {
      return [...filtered].sort((a, b) => b.totalGangguan - a.totalGangguan || b.activeGangguan - a.activeGangguan);
    } else if (incidentSortOrder === 'health_asc') {
      return [...filtered].sort((a, b) => a.healthScore - b.healthScore);
    }
    return [...filtered].sort((a, b) => a.kode.localeCompare(b.kode));
  }, [gensets, incidents, incidentSortOrder, incidentStatusFilter]);

  const totalIncidentsCount = incidents.length;
  const activeIncidentsCount = incidents.filter((i) => i.status !== 'Selesai').length;
  const resolvedIncidentsCount = incidents.filter((i) => i.status === 'Selesai').length;
  const topTroubledUnit = incidentFrequencyData.length > 0 ? incidentFrequencyData[0] : null;

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
              onClick={() => onNavigate('operasional')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-xs cursor-pointer"
              title="Akses Sub Menu Logbook Pengoperasian Genset"
            >
              <Gauge className="w-4 h-4" />
              <span>Logbook Operasional</span>
            </button>
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

      {/* HIGHLIGHT & PENGINGAT JADWAL PERAWATAN BERKALA (PREVENTIVE MAINTENANCE - PM) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Header Bar */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3.5 bg-gradient-to-r from-slate-50 via-white to-blue-50/40">
          <div className="flex items-start sm:items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <CalendarClock className="w-5 h-5" />
              </div>
              {actionNeededCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-white animate-pulse" />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                  Pengingat & Highlight Jadwal Perawatan Berkala (PM)
                </h3>
                {actionNeededCount > 0 ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                    <Bell className="w-3 h-3 text-amber-700" />
                    {actionNeededCount} Unit Butuh Tindakan
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Semua Unit On-Schedule
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Pemantauan otomatis siklus servis berbasis <strong>Jam Operasi (Hour Meter 250 Jam)</strong> dan{' '}
                <strong>Interval Kalender (30 Hari)</strong> untuk mencegah downtime tak terduga.
              </p>
            </div>
          </div>

          {/* Quick Counter Pills & Filter Controls */}
          <div className="flex flex-wrap items-center gap-1.5 self-start lg:self-auto">
            <button
              type="button"
              onClick={() => setPmFilter('ACTION_NEEDED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                pmFilter === 'ACTION_NEEDED'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>Perlu Tindakan</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  pmFilter === 'ACTION_NEEDED' ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {actionNeededCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setPmFilter('OVERDUE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                pmFilter === 'OVERDUE'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
              }`}
            >
              <span>Jatuh Tempo</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  pmFilter === 'OVERDUE' ? 'bg-white text-rose-700' : 'bg-rose-200 text-rose-900'
                }`}
              >
                {overduePMCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setPmFilter('UPCOMING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                pmFilter === 'UPCOMING'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <span>Mendekati</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  pmFilter === 'UPCOMING' ? 'bg-white text-amber-800' : 'bg-amber-200 text-amber-900'
                }`}
              >
                {upcomingPMCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setPmFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                pmFilter === 'ALL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Semua ({pmScheduleData.length})
            </button>
          </div>
        </div>

        {/* PM Reminder Content Grid / List */}
        <div className="p-4 sm:p-6 space-y-3.5">
          {filteredPMSchedules.length === 0 ? (
            <div className="py-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-semibold text-slate-700 text-xs">
                Tidak ada unit genset pada filter "{pmFilter === 'OVERDUE' ? 'Jatuh Tempo' : pmFilter === 'UPCOMING' ? 'Mendekati Jadwal' : 'Perlu Tindakan'}".
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Seluruh unit armada beroperasi dalam parameter siklus perawatan berkala yang aman.
              </p>
              <button
                type="button"
                onClick={() => setPmFilter('ALL')}
                className="mt-3 text-xs font-bold text-blue-600 hover:underline cursor-pointer"
              >
                Lihat Semua Jadwal Unit →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
              {filteredPMSchedules.map((item) => {
                const isOverdue = item.urgency === 'OVERDUE';
                const isUpcoming = item.urgency === 'UPCOMING';

                return (
                  <div
                    key={item.genset.id}
                    className={`rounded-xl p-4 sm:p-5 border transition-all duration-150 flex flex-col justify-between ${
                      isOverdue
                        ? 'bg-gradient-to-br from-rose-50/90 via-white to-rose-50/40 border-rose-300 ring-1 ring-rose-200 shadow-xs'
                        : isUpcoming
                        ? 'bg-gradient-to-br from-amber-50/80 via-white to-amber-50/30 border-amber-300 ring-1 ring-amber-200 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-start justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs bg-slate-900 text-white px-2 py-0.5 rounded shadow-2xs">
                            {item.genset.kode}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                              item.genset.kondisi === 'S'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : item.genset.kondisi === 'US Ringan'
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : 'bg-red-100 text-red-800 border-red-300'
                            }`}
                          >
                            Kondisi {item.genset.kondisi}
                          </span>
                        </div>

                        {/* Urgency Highlight Pill */}
                        {isOverdue && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-600 text-white shadow-2xs animate-pulse">
                            <AlertOctagon className="w-3 h-3" />
                            JATUH TEMPO (OVERDUE)
                          </span>
                        )}
                        {isUpcoming && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-slate-950 shadow-2xs">
                            <Timer className="w-3 h-3" />
                            MENDEKATI JADWAL PM
                          </span>
                        )}
                        {!isOverdue && !isUpcoming && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            JADWAL NORMAL
                          </span>
                        )}
                      </div>

                      {/* Genset Title & Specs */}
                      <div className="mb-3">
                        <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                          {item.genset.nama}
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-0.5">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {item.genset.lokasi}
                          </span>
                          <span>·</span>
                          <span className="font-semibold text-slate-700">{item.genset.kapasitas}</span>
                          <span>·</span>
                          <span>Health Score: <strong className={item.genset.healthScore >= 80 ? 'text-emerald-700' : item.genset.healthScore >= 60 ? 'text-amber-700' : 'text-red-700'}>{item.genset.healthScore}%</strong></span>
                        </div>
                      </div>

                      {/* Primary Trigger / Reason Alert Callout */}
                      <div
                        className={`p-2.5 rounded-lg text-xs mb-3 flex items-start gap-2 ${
                          isOverdue
                            ? 'bg-rose-100/80 text-rose-900 border border-rose-200'
                            : isUpcoming
                            ? 'bg-amber-100/70 text-amber-900 border border-amber-200'
                            : 'bg-slate-50 text-slate-700 border border-slate-200'
                        }`}
                      >
                        <AlertTriangle
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            isOverdue ? 'text-rose-600' : isUpcoming ? 'text-amber-600' : 'text-slate-400'
                          }`}
                        />
                        <div>
                          <span className="font-bold block">Status Peringatan: {item.urgencyLabel}</span>
                          <span className="text-[11px] leading-relaxed block">{item.primaryReason}</span>
                        </div>
                      </div>

                      {/* Progress Bar towards Next PM Cycle (250h) */}
                      <div className="space-y-1.5 mb-3 bg-white/80 p-3 rounded-lg border border-slate-200/80">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700 flex items-center gap-1">
                            <Gauge className="w-3.5 h-3.5 text-blue-600" />
                            Progres Jam Kerja Menuju Servis:
                          </span>
                          <span className="font-mono font-bold text-slate-900">
                            {item.genset.jamOperasi} / {item.nextTargetHours} Jam
                          </span>
                        </div>

                        {/* Progress track */}
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              isOverdue
                                ? 'bg-rose-600'
                                : isUpcoming
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.max(5, item.hoursProgress)}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                          <span>
                            Siklus 250 Jam (Tercapai: <strong>{item.hoursInCycle} Jam</strong>)
                          </span>
                          <span className={`font-mono font-bold ${
                            item.remainingHours <= 5 ? 'text-rose-700' : item.remainingHours <= 30 ? 'text-amber-700' : 'text-slate-700'
                          }`}>
                            {item.remainingHours <= 0 ? 'Mencapai Batas!' : `Sisa ${item.remainingHours} Jam`}
                          </span>
                        </div>
                      </div>

                      {/* Technical PM Recommendation */}
                      <div className="p-3 bg-slate-50/90 rounded-lg border border-slate-200 text-xs space-y-1.5 mb-3">
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span className="flex items-center gap-1.5 text-blue-700">
                            <Wrench className="w-3.5 h-3.5" />
                            {item.pmType}
                          </span>
                          <span className="text-[10px] text-slate-500 font-normal">
                            SPK Terakhir: {item.lastMaintSPK}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          <strong>Tindakan Wajib:</strong> {item.pmActionPlan}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                          <span>Servis Terakhir: {item.lastMaintDate} ({item.daysSinceLastMaint} hari lalu)</span>
                          <span className="font-semibold text-slate-700">Toleransi Bulanan: Sisa {item.daysRemainingMonthly} hari</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectGensetDetail(item.genset)}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <span>Lihat Histori Unit</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            onNavigate('perawatan');
                          }}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors shadow-2xs cursor-pointer flex items-center gap-1 ${
                            isOverdue
                              ? 'bg-rose-600 hover:bg-rose-700 text-white'
                              : isUpcoming
                              ? 'bg-amber-600 hover:bg-amber-700 text-white'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Buat SPK Servis</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Visual Readiness Summary with Recharts (Diagram Lingkaran) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <PieChartIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <span>Grafik Distribusi Kondisi Kesiapan Genset (S / US)</span>
                <span className="text-[10px] font-normal uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
                  Diagram Donat
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Visualisasi persentase dan proporsi kondisi operasional seluruh armada Denma: Siap (S), US Ringan, dan Rusak / Tidak Siap (US)
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

      {/* LINE CHART: Tren Health Score Genset 30 Hari Terakhir (Recharts) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">
                Tren Health Score Genset (30 Hari Terakhir)
              </h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Data Log Pemeriksaan
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Visualisasi perkembangan skor kelayakan dan kondisi genset berdasarkan histori inspeksi harian/mingguan
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs text-slate-500 font-medium">Filter Unit:</span>
            <select
              value={selectedTrendGenset}
              onChange={(e) => setSelectedTrendGenset(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Semua Unit (Rata-rata Denma)</option>
              {gensets.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.kode} - {g.nama}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary metric pill counters */}
        <div className="px-6 py-3 bg-slate-50/60 border-b border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-medium">Skor Terkini</span>
            <span className="text-base font-bold font-mono text-slate-900">
              {latestTrendScore}%
            </span>
            <span className="text-[10px] text-slate-400 ml-1 font-mono">
              ({latestTrendScore >= 80 ? 'S' : latestTrendScore >= 60 ? 'US Ringan' : 'US'})
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-medium">Rata-rata 30 Hari</span>
            <span className="text-base font-bold font-mono text-blue-700">
              {currentAvgTrendScore}%
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-medium">Skor Minimum</span>
            <span className="text-base font-bold font-mono text-red-600">
              {minTrendScore}%
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-medium">Skor Tertinggi</span>
            <span className="text-base font-bold font-mono text-emerald-600">
              {maxTrendScore}%
            </span>
          </div>
        </div>

        {/* Recharts Responsive Line Chart */}
        <div className="p-6">
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={healthTrendData}
                margin={{ top: 10, right: 15, left: -15, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="displayDate"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  interval="preserveStartEnd"
                  minTickGap={24}
                />
                <YAxis
                  domain={[30, 100]}
                  ticks={[30, 45, 60, 75, 90, 100]}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  unit="%"
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs border border-slate-700">
                          <div className="font-bold text-slate-200 border-b border-slate-700 pb-1 mb-1.5 flex items-center justify-between gap-4">
                            <span>{label} ({data.date})</span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                data.healthScore >= 80
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                                  : data.healthScore >= 60
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                                  : 'bg-red-500/20 text-red-300 border border-red-400/30'
                              }`}
                            >
                              {data.kondisi}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-slate-400">Health Score:</span>
                              <span className="font-mono font-bold text-emerald-300 text-sm">
                                {data.healthScore}%
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-4 text-[11px]">
                              <span className="text-slate-400">Hasil Inspeksi:</span>
                              <span className="text-slate-200 font-medium">{data.status}</span>
                            </div>
                            {data.inspections > 0 && (
                              <div className="text-[10px] text-blue-300 pt-1 border-t border-slate-800">
                                ✓ {data.inspections} checklist inspeksi tercatat
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {/* Ambang Batas Readiness Lines */}
                <ReferenceLine
                  y={80}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  label={{
                    value: 'Batas Siap (80%)',
                    fill: '#10b981',
                    fontSize: 10,
                    position: 'insideTopRight',
                  }}
                />
                <ReferenceLine
                  y={60}
                  stroke="#f59e0b"
                  strokeDasharray="4 4"
                  label={{
                    value: 'Batas US Ringan (60%)',
                    fill: '#f59e0b',
                    fontSize: 10,
                    position: 'insideTopRight',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="healthScore"
                  name="Health Score"
                  stroke="#1d4ed8"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#1d4ed8', strokeWidth: 1, stroke: '#ffffff' }}
                  activeDot={{ r: 6, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                <span>Kondisi S (≥80%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                <span>Kondisi US Ringan (60-79%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                <span>Kondisi US (&lt;60%)</span>
              </div>
            </div>
            <span className="text-slate-400">
              * Perhitungan otomatis berdasarkan checklist 13 parameter teknis
            </span>
          </div>
        </div>
      </div>

      {/* BAR CHART: Tren Jam Operasi Genset & Batas Overhaul Seluruh Unit (Recharts) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">
                Visualisasi Jam Operasi Genset & Batas Pemeliharaan (Recharts)
              </h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Running Hours Unit
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Perbandingan akumulasi jam kerja mesin (Hour Meter) seluruh armada genset Denma terhadap batas Top Overhaul (2500 Jam) dan Mayor Overhaul (4000 Jam)
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-500 font-medium">Urutkan:</span>
            <select
              value={hoursSortOrder}
              onChange={(e) => setHoursSortOrder(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="desc">Jam Kerja Tertinggi → Terendah</option>
              <option value="asc">Jam Kerja Terendah → Tertinggi</option>
              <option value="kode">Berdasarkan Kode Unit</option>
            </select>
          </div>
        </div>

        {/* Counter Summary Pills */}
        <div className="px-6 py-3 bg-slate-50/60 border-b border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-medium">Total Akumulasi</span>
            <span className="text-base font-bold font-mono text-slate-900">
              {totalJamOperasi.toLocaleString('id-ID')} Jam
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-medium">Rata-rata Armada</span>
            <span className="text-base font-bold font-mono text-indigo-700">
              {avgJamOperasi.toLocaleString('id-ID')} Jam
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-medium">Jam Tertinggi</span>
            <span className="text-base font-bold font-mono text-amber-700">
              {maxJamUnit ? `${maxJamUnit.jamOperasi} Jam` : '-'}
            </span>
            <span className="text-[10px] text-slate-400 ml-1 truncate block">
              {maxJamUnit?.kode}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-medium">Jam Terendah</span>
            <span className="text-base font-bold font-mono text-emerald-700">
              {minJamUnit ? `${minJamUnit.jamOperasi} Jam` : '-'}
            </span>
            <span className="text-[10px] text-slate-400 ml-1 truncate block">
              {minJamUnit?.kode}
            </span>
          </div>
        </div>

        {/* Recharts Bar Chart Container */}
        <div className="p-6">
          <div className="h-72 sm:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={runningHoursData}
                margin={{ top: 18, right: 20, left: -10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="kode"
                  tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  unit=" J"
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs border border-slate-700">
                          <div className="font-bold text-slate-200 border-b border-slate-700 pb-1 mb-2 flex items-center justify-between gap-4">
                            <div>
                              <span className="text-indigo-300 font-mono text-xs">{data.kode}</span>
                              <div className="text-white text-xs">{data.nama}</div>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                data.kondisi === 'S'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                                  : data.kondisi === 'US Ringan'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                                  : 'bg-red-500/20 text-red-300 border border-red-400/30'
                              }`}
                            >
                              {data.kondisi === 'S' ? 'Siap (S)' : data.kondisi === 'US Ringan' ? 'US Ringan' : 'US (Rusak)'}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-slate-400">Total Jam Operasi:</span>
                              <span className="font-mono font-bold text-indigo-300 text-sm">
                                {data.jamOperasi.toLocaleString('id-ID')} Jam
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-slate-400">Lokasi / Kapasitas:</span>
                              <span className="text-slate-200">{data.lokasi} · {data.kapasitas}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-slate-400">Health Score:</span>
                              <span className="font-mono font-bold text-emerald-400">{data.healthScore}%</span>
                            </div>
                            <div className="pt-1.5 mt-1 border-t border-slate-800 text-[10px]">
                              <span className="text-slate-400 block mb-0.5">Siklus Pemeliharaan:</span>
                              <span className={`font-semibold ${
                                data.jamOperasi >= 4000 ? 'text-rose-300' : data.jamOperasi >= 2500 ? 'text-amber-300' : 'text-emerald-300'
                              }`}>
                                {data.overhaulStatus}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {/* Ambang Batas Top Overhaul 2500 Jam */}
                <ReferenceLine
                  y={2500}
                  stroke="#f59e0b"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: 'Batas Top Overhaul (2.500 Jam)',
                    fill: '#d97706',
                    fontSize: 10,
                    fontWeight: 700,
                    position: 'insideTopLeft',
                  }}
                />
                {/* Ambang Batas Mayor Overhaul 4000 Jam */}
                <ReferenceLine
                  y={4000}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: 'Batas Mayor Overhaul (4.000 Jam)',
                    fill: '#dc2626',
                    fontSize: 10,
                    fontWeight: 700,
                    position: 'insideTopLeft',
                  }}
                />
                <Bar
                  dataKey="jamOperasi"
                  name="Jam Operasi (Hour Meter)"
                  radius={[6, 6, 0, 0]}
                  cursor="pointer"
                  onClick={(entry) => {
                    const sel = gensets.find((g) => g.id === entry.id);
                    if (sel) onSelectGensetDetail(sel);
                  }}
                >
                  {runningHoursData.map((entry, index) => (
                    <Cell
                      key={`bar-${index}`}
                      fill={entry.barColor}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-semibold text-slate-700">Warna Bar Berdasarkan Kondisi:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                <span>Kondisi S (Siap)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />
                <span>Kondisi US Ringan</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" />
                <span>Kondisi US (Tidak Siap)</span>
              </div>
            </div>
            <span className="text-slate-400">
              * Klik batang grafik untuk membuka rincian spesifikasi unit genset
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RECHARTS 1: Tren Jam Operasi Bulanan (Januari - Oktober 2026)             */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <Clock className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">
                Tren Jam Operasi Bulanan Genset (Januari - Oktober 2026)
              </h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Visualisasi Recharts
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Pantauan tren konsumsi jam kerja mesin (Running Hours) per bulan, membandingkan beban pemadaman PLN, pemanasan rutin, support acara resmi, dan uji running test
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
            {/* Filter Unit */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 font-medium">Unit:</span>
              <select
                value={selectedMonthlyHoursUnit}
                onChange={(e) => setSelectedMonthlyHoursUnit(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="ALL">Semua Unit (Total Armada Denma)</option>
                {gensets.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.kode} - {g.nama.replace('GENSET ', '')}
                  </option>
                ))}
              </select>
            </div>

            {/* Mode Switcher */}
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100/70 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setMonthlyChartMode('area')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  monthlyChartMode === 'area'
                    ? 'bg-white text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Garis & Area
              </button>
              <button
                type="button"
                onClick={() => setMonthlyChartMode('breakdown')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  monthlyChartMode === 'breakdown'
                    ? 'bg-white text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Komposisi Keperluan
              </button>
            </div>
          </div>
        </div>

        {/* Counter Summary Pills */}
        <div className="px-6 py-3 bg-slate-50/70 border-b border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-medium">Total Akumulasi 2026</span>
            <span className="text-base font-bold font-mono text-blue-700">
              {totalMonthlyTrendHours.toLocaleString('id-ID')} Jam
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {selectedMonthlyHoursUnit === 'ALL' ? '8 Unit Satuan Denma' : '1 Unit Terpilih'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-medium">Rata-rata / Bulan</span>
            <span className="text-base font-bold font-mono text-slate-900">
              {avgMonthlyTrendHours.toLocaleString('id-ID')} Jam/Bulan
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Baseline ~{selectedMonthlyHoursUnit === 'ALL' ? '30 Jam' : '3.8 Jam'}/Unit
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-medium">Bulan Puncak Operasi</span>
            <span className="text-base font-bold font-mono text-amber-700">
              {peakMonthData?.monthName.split(' ')[0]} ({peakMonthData?.totalHours} Jam)
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              HUT RI & Simulasi Siaga
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-medium">Bulan Berjalan (Okt)</span>
            <span className="text-base font-bold font-mono text-emerald-700">
              {currentMonthData?.totalHours} Jam
            </span>
            <span className="text-[10px] text-emerald-600 block mt-0.5 font-medium">
              ✓ Log Operasional Terpantau
            </span>
          </div>
        </div>

        {/* Recharts Monthly Operating Hours Chart Container */}
        <div className="p-6">
          <div className="h-72 sm:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {monthlyChartMode === 'area' ? (
                <AreaChart
                  data={monthlyHoursData}
                  margin={{ top: 15, right: 15, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorTotalHours" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="colorPlnHours" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d97706" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#d97706" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                    unit=" J"
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl text-xs border border-slate-700">
                            <div className="font-bold text-slate-200 border-b border-slate-700 pb-1.5 mb-2 flex items-center justify-between gap-4">
                              <span>{data.monthName}</span>
                              <span className="font-mono text-blue-400 font-extrabold text-sm">
                                {data.totalHours} Jam
                              </span>
                            </div>
                            <div className="space-y-1.5 text-[11px]">
                              <div className="flex items-center justify-between gap-6">
                                <span className="flex items-center gap-1.5 text-amber-300">
                                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                                  Pemadaman PLN:
                                </span>
                                <span className="font-mono font-bold text-white">{data.pemadamanPLN} Jam</span>
                              </div>
                              <div className="flex items-center justify-between gap-6">
                                <span className="flex items-center gap-1.5 text-emerald-300">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                  Uji Rutin / Warm-up:
                                </span>
                                <span className="font-mono font-bold text-white">{data.ujiRutin} Jam</span>
                              </div>
                              <div className="flex items-center justify-between gap-6">
                                <span className="flex items-center gap-1.5 text-indigo-300">
                                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                                  Support Operasi / Vicon:
                                </span>
                                <span className="font-mono font-bold text-white">{data.supportAcara} Jam</span>
                              </div>
                              <div className="flex items-center justify-between gap-6">
                                <span className="flex items-center gap-1.5 text-cyan-300">
                                  <span className="w-2 h-2 rounded-full bg-cyan-500" />
                                  Running Test / Servis:
                                </span>
                                <span className="font-mono font-bold text-white">{data.runningTest} Jam</span>
                              </div>
                              {selectedMonthlyHoursUnit === 'ALL' && (
                                <div className="pt-1.5 mt-1 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between">
                                  <span>Rata-rata per Unit:</span>
                                  <span className="text-blue-300 font-mono font-semibold">{data.avgPerUnit} Jam/Unit</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine
                    y={avgMonthlyTrendHours}
                    stroke="#64748b"
                    strokeDasharray="4 4"
                    label={{
                      value: `Rata-rata: ${avgMonthlyTrendHours} Jam`,
                      fill: '#475569',
                      fontSize: 10,
                      fontWeight: 600,
                      position: 'insideTopLeft',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="totalHours"
                    name="Total Jam Operasi"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorTotalHours)"
                    activeDot={{ r: 6, fill: '#1d4ed8', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                </AreaChart>
              ) : (
                <BarChart
                  data={monthlyHoursData}
                  margin={{ top: 15, right: 15, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                    unit=" J"
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs border border-slate-700">
                            <div className="font-bold text-slate-200 border-b border-slate-700 pb-1 mb-1.5">
                              {data.monthName} (Total: {data.totalHours} Jam)
                            </div>
                            <div className="space-y-1 text-[11px]">
                              <div className="text-amber-400">Pemadaman PLN: {data.pemadamanPLN} Jam</div>
                              <div className="text-emerald-400">Uji Rutin / Warm-up: {data.ujiRutin} Jam</div>
                              <div className="text-indigo-400">Support Acara: {data.supportAcara} Jam</div>
                              <div className="text-cyan-400">Running Test: {data.runningTest} Jam</div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ paddingBottom: 10, fontSize: 11 }}
                  />
                  <Bar dataKey="pemadamanPLN" name="Pemadaman PLN" stackId="a" fill="#d97706" />
                  <Bar dataKey="ujiRutin" name="Uji Rutin / Warm-up" stackId="a" fill="#10b981" />
                  <Bar dataKey="supportAcara" name="Support Acara Khusus" stackId="a" fill="#6366f1" />
                  <Bar dataKey="runningTest" name="Running Test Servis" stackId="a" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-semibold text-slate-700">Komponen Jam Kerja:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block" />
                <span>Pemadaman Darurat PLN</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                <span>Pemanasan Berkala (Warm-up)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
                <span>Support Vicon / Acara Mako</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block" />
                <span>Uji Pasca Pemeliharaan</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('operasional')}
              className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer flex items-center gap-1"
            >
              <span>Buka Logbook Operasional Genset</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RECHARTS 2: Frekuensi Gangguan Per Unit Genset (Analisis Keandalan & MTBF)  */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                <AlertOctagon className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">
                Visualisasi Frekuensi Gangguan Per Unit Genset (Recharts)
              </h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                Analisis Kerusakan & Keandalan
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Perbandingan intensitas kerusakan per unit mesin, memisahkan status gangguan yang telah selesai, dalam penanganan, dan open, untuk prioritas perbaikan overhaul
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
            {/* Filter Status */}
            <select
              value={incidentStatusFilter}
              onChange={(e) => setIncidentStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500 cursor-pointer"
            >
              <option value="ALL">Semua Unit (8 Genset)</option>
              <option value="ACTIVE_ONLY">Hanya Unit Bermasalah / Aktif</option>
            </select>

            {/* Sort Order */}
            <div className="flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={incidentSortOrder}
                onChange={(e) => setIncidentSortOrder(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500 cursor-pointer"
              >
                <option value="freq_desc">Frekuensi Gangguan Tertinggi</option>
                <option value="health_asc">Health Score Terendah</option>
                <option value="kode">Berdasarkan Kode Unit</option>
              </select>
            </div>
          </div>
        </div>

        {/* Counter Summary Pills */}
        <div className="px-6 py-3 bg-slate-50/70 border-b border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-medium">Total Gangguan Terdata</span>
            <span className="text-base font-bold font-mono text-slate-900">
              {totalIncidentsCount} Kasus
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Histori Laporan Kerusakan (LKP)
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-medium">Gangguan Masih Aktif</span>
            <span className="text-base font-bold font-mono text-rose-700">
              {activeIncidentsCount} Kasus
            </span>
            <span className="text-[10px] text-rose-600 font-semibold block mt-0.5">
              Perlu Penanganan Teknisi
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-medium">Berhasil Diselesaikan</span>
            <span className="text-base font-bold font-mono text-emerald-700">
              {resolvedIncidentsCount} Kasus
            </span>
            <span className="text-[10px] text-emerald-600 block mt-0.5">
              Telah Lulus Running Test
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-medium">Unit Paling Kritis</span>
            <span className="text-base font-bold font-mono text-amber-700 truncate block">
              {topTroubledUnit?.kode} ({topTroubledUnit?.totalGangguan}x)
            </span>
            <span className="text-[10px] text-slate-500 truncate block mt-0.5">
              {topTroubledUnit?.nama}
            </span>
          </div>
        </div>

        {/* Recharts Incident Frequency Stacked Bar & Health Score Composed Chart */}
        <div className="p-6">
          <div className="h-72 sm:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={incidentFrequencyData}
                margin={{ top: 18, right: 20, left: -10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="kode"
                  tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  interval={0}
                />
                {/* Left Axis: Jumlah Gangguan */}
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  allowDecimals={false}
                  domain={[0, 'dataMax + 1']}
                  unit=" Lap"
                />
                {/* Right Axis: Health Score % */}
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: '#10b981' }}
                  tickLine={false}
                  axisLine={{ stroke: '#a7f3d0' }}
                  unit="%"
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl text-xs border border-slate-700 max-w-xs">
                          <div className="font-bold text-slate-200 border-b border-slate-700 pb-1.5 mb-2 flex items-center justify-between gap-4">
                            <div>
                              <span className="text-rose-400 font-mono text-xs">{data.kode}</span>
                              <div className="text-white text-xs">{data.fullName}</div>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                data.kondisi === 'S'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                                  : data.kondisi === 'US Ringan'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                                  : 'bg-red-500/20 text-red-300 border border-red-400/30'
                              }`}
                            >
                              {data.kondisi === 'S' ? 'Siap' : data.kondisi === 'US Ringan' ? 'US Ringan' : 'US (Rusak)'}
                            </span>
                          </div>

                          <div className="space-y-1.5 text-[11px]">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Total Frekuensi Gangguan:</span>
                              <span className="font-mono font-bold text-rose-400 text-sm">
                                {data.totalGangguan} Kasus
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-1 pt-1 pb-1 border-y border-slate-800 text-[10px] text-center font-mono">
                              <div className="bg-slate-800/60 p-1 rounded">
                                <span className="block text-emerald-400 font-bold">{data.selesai}</span>
                                <span className="text-slate-400">Selesai</span>
                              </div>
                              <div className="bg-slate-800/60 p-1 rounded">
                                <span className="block text-amber-400 font-bold">{data.dalamPenanganan}</span>
                                <span className="text-slate-400">Proses</span>
                              </div>
                              <div className="bg-slate-800/60 p-1 rounded">
                                <span className="block text-rose-400 font-bold">{data.open}</span>
                                <span className="text-slate-400">Open</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-slate-400">Health Score Terkini:</span>
                              <span className="font-mono font-bold text-emerald-400">{data.healthScore}%</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Estimasi MTBF:</span>
                              <span className="font-mono text-blue-300">~{data.mtbfHours.toLocaleString('id-ID')} Jam</span>
                            </div>
                            <div className="pt-1.5 border-t border-slate-800 text-[10px]">
                              <span className="text-slate-400 block mb-0.5">Temuan Masalah Dominan:</span>
                              <span className="text-slate-200 italic">{data.primarySubsystem}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ paddingBottom: 10, fontSize: 11 }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="selesai"
                  name="Gangguan Selesai"
                  stackId="gangguan"
                  fill="#10b981"
                  cursor="pointer"
                  onClick={(entry: any) => {
                    const item = entry?.unitItem || entry?.payload?.unitItem;
                    if (item) onSelectGensetDetail(item);
                  }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="dalamPenanganan"
                  name="Dalam Penanganan"
                  stackId="gangguan"
                  fill="#f59e0b"
                  cursor="pointer"
                  onClick={(entry: any) => {
                    const item = entry?.unitItem || entry?.payload?.unitItem;
                    if (item) onSelectGensetDetail(item);
                  }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="open"
                  name="Open (Belum Selesai)"
                  stackId="gangguan"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                  cursor="pointer"
                  onClick={(entry: any) => {
                    const item = entry?.unitItem || entry?.payload?.unitItem;
                    if (item) onSelectGensetDetail(item);
                  }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="healthScore"
                  name="Health Score (%)"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#10b981', stroke: '#ffffff', strokeWidth: 1.5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-semibold text-slate-700">Keterangan Batang:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                <span>Hijau: Selesai Diperbaiki</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />
                <span>Kuning: Dalam Penanganan Teknisi</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" />
                <span>Merah: Terbuka (Open / Kritis)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                <span>Garis Hijau: Skor Kesehatan Mesin (%)</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigate('gangguan')}
                className="text-rose-600 hover:text-rose-700 font-bold cursor-pointer flex items-center gap-1"
              >
                <span>Kelola Berita Acara Kerusakan & Perbaikan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
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
