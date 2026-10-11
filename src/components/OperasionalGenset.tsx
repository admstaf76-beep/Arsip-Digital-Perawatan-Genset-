import React, { useState } from 'react';
import {
  GensetItem,
  UserSession,
  GensetOperationalRecord,
  OperationalStatus,
  OperationalPurpose,
  OperationalMode,
  PreOperationChecklist,
  RunningOperationParameters,
  PostOperationChecklist,
} from '../types/genset';
import {
  Gauge,
  Plus,
  Search,
  Filter,
  Clock,
  Play,
  Square,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Printer,
  Calendar,
  User,
  Zap,
  Activity,
  Fuel,
  Battery,
  ShieldCheck,
  ChevronRight,
  X,
  Thermometer,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { PrintableOperationalLogModal } from './PrintableOperationalLogModal';

interface OperasionalGensetProps {
  operationalRecords: GensetOperationalRecord[];
  gensets: GensetItem[];
  activeUser: UserSession;
  onSaveOperationalRecord: (record: GensetOperationalRecord, isNew: boolean) => void;
  onDeleteOperationalRecord: (id: string) => void;
}

export const OperasionalGenset: React.FC<OperasionalGensetProps> = ({
  operationalRecords,
  gensets,
  activeUser,
  onSaveOperationalRecord,
  onDeleteOperationalRecord,
}) => {
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGensetId, setFilterGensetId] = useState<string>('SEMUA');
  const [filterStatus, setFilterStatus] = useState<string>('SEMUA');
  const [filterPurpose, setFilterPurpose] = useState<string>('SEMUA');

  // Modals
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedDetailRecord, setSelectedDetailRecord] = useState<GensetOperationalRecord | null>(null);
  const [printModalRecord, setPrintModalRecord] = useState<GensetOperationalRecord | null>(null);
  const [completingRecord, setCompletingRecord] = useState<GensetOperationalRecord | null>(null);

  // New Record Form State
  const [targetGensetId, setTargetGensetId] = useState<string>(gensets[0]?.id || '');
  const [nomorLog, setNomorLog] = useState<string>(`LOG-OPS-${new Date().getFullYear()}-${String(operationalRecords.length + 1).padStart(3, '0')}`);
  const [tanggal, setTanggal] = useState<string>(new Date().toISOString().split('T')[0]);
  const [waktuMulai, setWaktuMulai] = useState<string>('08:00');
  const [waktuSelesai, setWaktuSelesai] = useState<string>('10:00');
  const [isCurrentlyRunning, setIsCurrentlyRunning] = useState<boolean>(false);
  const [keperluan, setKeperluan] = useState<OperationalPurpose>('Uji Coba Rutin / Warm-up');
  const [modeOperasi, setModeOperasi] = useState<OperationalMode>('Manual');
  const [operatorName, setOperatorName] = useState<string>(activeUser.name || 'Teknisi Fasint');
  const [pendampingName, setPendampingName] = useState<string>('');
  const [hourMeterAwal, setHourMeterAwal] = useState<number>(gensets[0]?.jamOperasi || 1500);
  const [hourMeterAkhir, setHourMeterAkhir] = useState<number>((gensets[0]?.jamOperasi || 1500) + 2);
  const [catatanKhusus, setCatatanKhusus] = useState<string>('');

  // Pre-operation Checklist State
  const [praLevelOli, setPraLevelOli] = useState<'Cukup / Normal' | 'Kurang' | 'Keruh / Perlu Penggantian'>('Cukup / Normal');
  const [praLevelCoolant, setPraLevelCoolant] = useState<'Normal / Cukup' | 'Kurang'>('Normal / Cukup');
  const [praLevelBBM, setPraLevelBBM] = useState<number>(85);
  const [praVoltaseBaterai, setPraVoltaseBaterai] = useState<number>(25.2);
  const [praKondisiRuang, setPraKondisiRuang] = useState<'Bersih & Aman' | 'Terdapat Kebocoran' | 'Ventilasi Tertutup'>('Bersih & Aman');
  const [praPosisiSelector, setPraPosisiSelector] = useState<'Manual' | 'Auto' | 'Off'>('Manual');
  const [praKondisiBelt, setPraKondisiBelt] = useState<'Kencang & Baik' | 'Kendor' | 'Retak'>('Kencang & Baik');
  const [praStatusKesiapan, setPraStatusKesiapan] = useState<'Siap & Aman Dioperasikan' | 'Perlu Perhatian' | 'Tidak Siap (Batal)'>('Siap & Aman Dioperasikan');
  const [praCatatan, setPraCatatan] = useState<string>('Pemeriksaan pra-start lengkap, semua item dalam kondisi prima.');

  // Running Operation Parameters State
  const [runVoltase, setRunVoltase] = useState<number>(384);
  const [runFrekuensi, setRunFrekuensi] = useState<number>(50.0);
  const [runRpm, setRunRpm] = useState<number>(1500);
  const [runTekananOli, setRunTekananOli] = useState<number>(4.2);
  const [runSuhuMesin, setRunSuhuMesin] = useState<number>(82);
  const [runArusBeban, setRunArusBeban] = useState<number>(120);
  const [runPersenBeban, setRunPersenBeban] = useState<number>(45);
  const [runSuaraGetaran, setRunSuaraGetaran] = useState<'Halus & Normal' | 'Getaran Sedang' | 'Bising / Getaran Abnormal'>('Halus & Normal');
  const [runKondisiAsap, setRunKondisiAsap] = useState<'Normal / Bersih' | 'Asap Hitam' | 'Asap Putih'>('Normal / Bersih');
  const [runCatatan, setRunCatatan] = useState<string>('Engine running stabil, frekuensi dan voltase seimbang.');

  // Post-operation Checklist State
  const [postCoolingDown, setPostCoolingDown] = useState<number>(5);
  const [postHourMeterAkhir, setPostHourMeterAkhir] = useState<number>(hourMeterAkhir);
  const [postLevelBBM, setPostLevelBBM] = useState<number>(78);
  const [postKonsumsiSolar, setPostKonsumsiSolar] = useState<number>(24);
  const [postCekKebocoran, setPostCekKebocoran] = useState<'Nihil Kebocoran (Aman)' | 'Rembesan Oli' | 'Tetesan Coolant' | 'Bocor BBM'>('Nihil Kebocoran (Aman)');
  const [postKebersihan, setPostKebersihan] = useState<'Unit Bersih & Ruang Terkunci' | 'Perlu Pembersihan'>('Unit Bersih & Ruang Terkunci');
  const [postSelectorAkhir, setPostSelectorAkhir] = useState<'Standby Auto (AMF/ATS)' | 'Manual' | 'Off'>('Standby Auto (AMF/ATS)');
  const [postChargerAki, setPostChargerAki] = useState<boolean>(true);
  const [postKondisiAkhir, setPostKondisiAkhir] = useState<'Siap Siaga / Standby Normal' | 'Perlu Pemeliharaan' | 'Ada Temuan Gangguan'>('Siap Siaga / Standby Normal');
  const [postCatatan, setPostCatatan] = useState<string>('Cooling down 5 menit selesai, sistem standby otomatis siap beroperasi kembali.');

  // Completing (Shutdown) modal quick states
  const [shutdownWaktu, setShutdownWaktu] = useState<string>(new Date().toTimeString().slice(0, 5));
  const [shutdownCoolingDown, setShutdownCoolingDown] = useState<number>(5);
  const [shutdownHMAkhir, setShutdownHMAkhir] = useState<number>(0);
  const [shutdownLevelBBM, setShutdownLevelBBM] = useState<number>(80);
  const [shutdownKonsumsi, setShutdownKonsumsi] = useState<number>(20);
  const [shutdownKebocoran, setShutdownKebocoran] = useState<'Nihil Kebocoran (Aman)' | 'Rembesan Oli' | 'Tetesan Coolant' | 'Bocor BBM'>('Nihil Kebocoran (Aman)');
  const [shutdownSelector, setShutdownSelector] = useState<'Standby Auto (AMF/ATS)' | 'Manual' | 'Off'>('Standby Auto (AMF/ATS)');
  const [shutdownCatatan, setShutdownCatatan] = useState<string>('Genset selesai dioperasikan, pendinginan selesai dan unit standby normal.');

  // Update HM initial value when selected genset changes
  const handleSelectGensetChange = (id: string) => {
    setTargetGensetId(id);
    const selectedG = gensets.find((g) => g.id === id);
    if (selectedG) {
      setHourMeterAwal(selectedG.jamOperasi);
      setHourMeterAkhir(selectedG.jamOperasi + 2);
      setPostHourMeterAkhir(selectedG.jamOperasi + 2);
    }
  };

  // Open New Modal with fresh IDs
  const handleOpenNewModal = () => {
    const nextNum = operationalRecords.length + 1;
    setNomorLog(`LOG-OPS-${new Date().getFullYear()}-${String(nextNum).padStart(3, '0')}`);
    setTanggal(new Date().toISOString().split('T')[0]);
    const selGenset = gensets.find((g) => g.id === targetGensetId) || gensets[0];
    if (selGenset) {
      setHourMeterAwal(selGenset.jamOperasi);
      setHourMeterAkhir(selGenset.jamOperasi + 2);
      setPostHourMeterAkhir(selGenset.jamOperasi + 2);
    }
    setIsCurrentlyRunning(false);
    setIsNewModalOpen(true);
  };

  // Handle Submit New Record
  const handleSubmitNewRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const selGenset = gensets.find((g) => g.id === targetGensetId) || gensets[0];

    // Calculate duration
    let durasi = 0;
    if (!isCurrentlyRunning && waktuMulai && waktuSelesai) {
      const [h1, m1] = waktuMulai.split(':').map(Number);
      const [h2, m2] = waktuSelesai.split(':').map(Number);
      durasi = (h2 * 60 + m2) - (h1 * 60 + m1);
      if (durasi < 0) durasi += 24 * 60; // Crosses midnight
    } else if (isCurrentlyRunning) {
      durasi = 60; // Initial estimated
    }

    const newRecord: GensetOperationalRecord = {
      id: `OPR-${Date.now()}`,
      nomorLog: nomorLog.trim(),
      gensetId: targetGensetId,
      gensetName: selGenset ? selGenset.nama : 'GENSET',
      tanggal,
      waktuMulai,
      waktuSelesai: isCurrentlyRunning ? undefined : waktuSelesai,
      durasiOperasiMenit: durasi,
      hourMeterAwal: Number(hourMeterAwal),
      hourMeterAkhir: isCurrentlyRunning ? Number(hourMeterAwal) : Number(postHourMeterAkhir || hourMeterAkhir),
      keperluan,
      modeOperasi,
      operator: operatorName,
      petugasPendamping: pendampingName,
      status: isCurrentlyRunning ? 'Beroperasi' : keperluan.includes('Uji Coba') ? 'Uji Coba' : 'Selesai',
      praOperasi: {
        levelOli: praLevelOli,
        levelCoolant: praLevelCoolant,
        levelBBM: Number(praLevelBBM),
        teganganBaterai: Number(praVoltaseBaterai),
        kondisiFisikRuangan: praKondisiRuang,
        posisiSelector: praPosisiSelector,
        kondisiBelt: praKondisiBelt,
        statusKesiapan: praStatusKesiapan,
        catatanPra: praCatatan,
      },
      saatOperasi: {
        teganganL1L2: Number(runVoltase),
        frekuensi: Number(runFrekuensi),
        rpm: Number(runRpm),
        tekananOli: Number(runTekananOli),
        temperaturMesin: Number(runSuhuMesin),
        arusBeban: Number(runArusBeban),
        persenBeban: Number(runPersenBeban),
        suaraDanGetaran: runSuaraGetaran,
        kondisiAsap: runKondisiAsap,
        catatanSaat: runCatatan,
      },
      pascaOperasi: {
        coolingDownDurasiMenit: isCurrentlyRunning ? 0 : Number(postCoolingDown),
        hourMeterAkhir: isCurrentlyRunning ? Number(hourMeterAwal) : Number(postHourMeterAkhir || hourMeterAkhir),
        levelBBMAkhir: isCurrentlyRunning ? Number(praLevelBBM) : Number(postLevelBBM),
        estimasiKonsumsiSolarLiter: isCurrentlyRunning ? 0 : Number(postKonsumsiSolar),
        cekKebocoran: postCekKebocoran,
        kebersihanDanKunci: postKebersihan,
        posisiSelectorAkhir: postSelectorAkhir,
        chargerAkiNormal: postChargerAki,
        kondisiAkhirGenset: isCurrentlyRunning ? 'Siap Siaga / Standby Normal' : postKondisiAkhir,
        catatanPasca: isCurrentlyRunning ? 'Unit sedang beroperasi aktif.' : postCatatan,
      },
      catatanKhusus,
      updatedAt: new Date().toLocaleString('id-ID'),
    };

    onSaveOperationalRecord(newRecord, true);
    setIsNewModalOpen(false);
  };

  // Open Shutdown / Complete Modal
  const handleOpenCompleteModal = (record: GensetOperationalRecord) => {
    setCompletingRecord(record);
    setShutdownWaktu(new Date().toTimeString().slice(0, 5));
    setShutdownHMAkhir(Number((record.hourMeterAwal + 1.5).toFixed(1)));
    setShutdownLevelBBM(Math.max(20, record.praOperasi.levelBBM - 10));
    setShutdownKonsumsi(25);
    setShutdownCatatan('Operasional selesai, genset dimatikan dan kembali standby.');
  };

  // Submit Shutdown / Complete Operation
  const handleSubmitComplete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingRecord) return;

    // Calculate duration
    let durasi = completingRecord.durasiOperasiMenit;
    if (completingRecord.waktuMulai && shutdownWaktu) {
      const [h1, m1] = completingRecord.waktuMulai.split(':').map(Number);
      const [h2, m2] = shutdownWaktu.split(':').map(Number);
      let calculated = (h2 * 60 + m2) - (h1 * 60 + m1);
      if (calculated < 0) calculated += 24 * 60;
      durasi = calculated > 0 ? calculated : 60;
    }

    const updatedRecord: GensetOperationalRecord = {
      ...completingRecord,
      waktuSelesai: shutdownWaktu,
      durasiOperasiMenit: durasi,
      hourMeterAkhir: Number(shutdownHMAkhir),
      status: 'Selesai',
      pascaOperasi: {
        coolingDownDurasiMenit: Number(shutdownCoolingDown),
        hourMeterAkhir: Number(shutdownHMAkhir),
        levelBBMAkhir: Number(shutdownLevelBBM),
        estimasiKonsumsiSolarLiter: Number(shutdownKonsumsi),
        cekKebocoran: shutdownKebocoran,
        kebersihanDanKunci: 'Unit Bersih & Ruang Terkunci',
        posisiSelectorAkhir: shutdownSelector,
        chargerAkiNormal: true,
        kondisiAkhirGenset: 'Siap Siaga / Standby Normal',
        catatanPasca: shutdownCatatan,
      },
      updatedAt: new Date().toLocaleString('id-ID'),
    };

    onSaveOperationalRecord(updatedRecord, false);
    setCompletingRecord(null);
  };

  // Filtered Records
  const filteredRecords = operationalRecords.filter((rec) => {
    const matchGenset = filterGensetId === 'SEMUA' || rec.gensetId === filterGensetId;
    const matchStatus = filterStatus === 'SEMUA' || rec.status === filterStatus;
    const matchPurpose = filterPurpose === 'SEMUA' || rec.keperluan === filterPurpose;
    const matchSearch =
      rec.nomorLog.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.gensetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.operator.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.keperluan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rec.catatanKhusus && rec.catatanKhusus.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchGenset && matchStatus && matchPurpose && matchSearch;
  });

  // Calculate Metrics
  const runningRecords = operationalRecords.filter((r) => r.status === 'Beroperasi');
  const runningCount = runningRecords.length;
  const totalMinutes = operationalRecords.reduce((acc, r) => acc + (r.durasiOperasiMenit || 0), 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalRemMinutes = totalMinutes % 60;
  const totalSolar = operationalRecords.reduce((acc, r) => acc + (r.pascaOperasi.estimasiKonsumsiSolarLiter || 0), 0);
  const totalRecordsCount = operationalRecords.length;

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Gauge className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Logbook Pengoperasian Genset
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Catatan Aktivitas Operasional, Pemeriksaan Pra-Operasi, Parameter Running, dan Pasca-Operasi
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenNewModal}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Catat Pengoperasian Baru
          </button>
        </div>
      </div>

      {/* Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Live Status */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Status Operasi (Live)</span>
            {runningCount > 0 ? (
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            ) : (
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {runningCount}
            </span>
            <span className="text-xs font-bold text-emerald-600">
              {runningCount > 0 ? 'Unit Aktif Beroperasi' : 'Standby / Siap Siaga'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {runningCount > 0 ? `${runningRecords[0]?.gensetName}` : 'Nihil genset berjalan saat ini'}
          </p>
        </div>

        {/* Card 2: Total Running Hours */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Total Jam Operasi</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {totalHours}
            </span>
            <span className="text-xs font-medium text-slate-500">Jam {totalRemMinutes} Mnt</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Akumulasi seluruh running hour tercatat
          </p>
        </div>

        {/* Card 3: Total Aktivitas */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Total Log Operasional</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {totalRecordsCount}
            </span>
            <span className="text-xs font-medium text-slate-500">Kegiatan</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Uji coba rutin & pasokan pemadaman PLN
          </p>
        </div>

        {/* Card 4: Konsumsi BBM */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Estimasi Solar Terpakai</span>
            <Fuel className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              ±{totalSolar}
            </span>
            <span className="text-xs font-medium text-slate-500">Liter</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Berdasarkan selisih level tangki solar harian
          </p>
        </div>
      </div>

      {/* LIVE ACTIVE UNIT BANNER (If any unit is currently running) */}
      {runningCount > 0 && (
        <div className="bg-linear-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-emerald-500/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  SEDANG BEROPERASI (LIVE RUNNING)
                </span>
                <span className="text-xs text-slate-300 font-mono">
                  Mulai: {runningRecords[0]?.waktuMulai} WIB
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                {runningRecords[0]?.gensetName}
              </h2>
              <p className="text-xs text-slate-300">
                Keperluan: <strong className="text-emerald-200">{runningRecords[0]?.keperluan}</strong> · Operator:{' '}
                <span className="text-slate-200">{runningRecords[0]?.operator}</span> · Hour Meter Awal:{' '}
                <span className="font-mono">{runningRecords[0]?.hourMeterAwal} Jam</span>
              </p>
            </div>

            {/* Quick Live Gauges & Action Button */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-white/10 backdrop-blur-xs rounded-xl px-3 py-2 text-center border border-white/10">
                <span className="text-[10px] text-slate-300 block">Tegangan</span>
                <span className="text-sm font-bold font-mono text-emerald-300">
                  {runningRecords[0]?.saatOperasi.teganganL1L2} V
                </span>
              </div>
              <div className="bg-white/10 backdrop-blur-xs rounded-xl px-3 py-2 text-center border border-white/10">
                <span className="text-[10px] text-slate-300 block">Frekuensi</span>
                <span className="text-sm font-bold font-mono text-emerald-300">
                  {runningRecords[0]?.saatOperasi.frekuensi} Hz
                </span>
              </div>
              <div className="bg-white/10 backdrop-blur-xs rounded-xl px-3 py-2 text-center border border-white/10">
                <span className="text-[10px] text-slate-300 block">Tekanan Oli</span>
                <span className="text-sm font-bold font-mono text-emerald-300">
                  {runningRecords[0]?.saatOperasi.tekananOli} Bar
                </span>
              </div>
              <div className="bg-white/10 backdrop-blur-xs rounded-xl px-3 py-2 text-center border border-white/10">
                <span className="text-[10px] text-slate-300 block">Suhu Mesin</span>
                <span className="text-sm font-bold font-mono text-emerald-300">
                  {runningRecords[0]?.saatOperasi.temperaturMesin} °C
                </span>
              </div>

              <button
                onClick={() => handleOpenCompleteModal(runningRecords[0])}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-colors cursor-pointer"
              >
                <Square className="w-4 h-4 fill-slate-950" />
                Matikan & Input Pasca-Operasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari no log, operator, genset..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter Genset */}
          <div>
            <select
              value={filterGensetId}
              onChange={(e) => setFilterGensetId(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="SEMUA">Semua Unit Genset</option>
              {gensets.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nama} ({g.kapasitas})
                </option>
              ))}
            </select>
          </div>

          {/* Filter Status */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="SEMUA">Semua Status Operasi</option>
              <option value="Beroperasi">Sedang Beroperasi</option>
              <option value="Selesai">Selesai Beroperasi</option>
              <option value="Uji Coba">Uji Coba / Warm-up</option>
            </select>
          </div>

          {/* Filter Keperluan */}
          <div>
            <select
              value={filterPurpose}
              onChange={(e) => setFilterPurpose(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="SEMUA">Semua Keperluan Operasi</option>
              <option value="Pemadaman PLN">Pemadaman PLN</option>
              <option value="Uji Coba Rutin / Warm-up">Uji Coba Rutin / Warm-up</option>
              <option value="Support Operasi & Acara Khusus">Support Acara Khusus</option>
              <option value="Pemeliharaan / Running Test">Pemeliharaan / Test</option>
            </select>
          </div>
        </div>
      </div>

      {/* OPERATIONAL RECORDS LIST */}
      <div className="space-y-3">
        {filteredRecords.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
            <Gauge className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">Belum Ada Catatan Operasional</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Tidak ada catatan operasional yang sesuai dengan filter. Klik tombol &ldquo;Catat Pengoperasian Baru&rdquo; untuk memulai.
            </p>
          </div>
        ) : (
          filteredRecords.map((record) => {
            const relatedGenset = gensets.find((g) => g.id === record.gensetId);
            const isRunning = record.status === 'Beroperasi';
            const durasiJam = Math.floor(record.durasiOperasiMenit / 60);
            const durasiMenit = record.durasiOperasiMenit % 60;
            const durasiStr = `${durasiJam > 0 ? `${durasiJam}j ` : ''}${durasiMenit}m`;

            return (
              <div
                key={record.id}
                className={`bg-white rounded-xl border transition-all overflow-hidden ${
                  isRunning
                    ? 'border-emerald-400 shadow-md ring-1 ring-emerald-400'
                    : 'border-slate-200 hover:border-slate-300 shadow-xs'
                }`}
              >
                {/* Header Row */}
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    
                    {/* Left: Info Unit & Identity */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {record.nomorLog}
                        </span>

                        {isRunning ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                            Sedang Beroperasi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Selesai
                          </span>
                        )}

                        <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">
                          {record.keperluan}
                        </span>

                        <span className="text-xs text-slate-400">·</span>

                        <span className="text-xs text-slate-600 font-medium">
                          Mode: {record.modeOperasi}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-0.5">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900">
                          {record.gensetName}
                        </h2>
                        <span className="text-xs text-slate-500 font-medium">
                          ({relatedGenset?.kapasitas || '350 KVA'})
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {record.tanggal}
                        </span>
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {record.waktuMulai} - {record.waktuSelesai || 'Sekarang'} ({durasiStr})
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          Operator: <strong className="text-slate-700">{record.operator}</strong>
                        </span>
                        <span className="flex items-center gap-1 font-mono">
                          HM: {record.hourMeterAwal} → {record.hourMeterAkhir}
                        </span>
                      </div>
                    </div>

                    {/* Right: Action Buttons */}
                    <div className="flex items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      {isRunning && (
                        <button
                          onClick={() => handleOpenCompleteModal(record)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          <Square className="w-3.5 h-3.5 fill-white" />
                          Selesaikan & Shutdown
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedDetailRecord(record)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        title="Lihat Hasil Pemeriksaan 3 Tahap"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                        Pemeriksaan 3 Tahap
                      </button>

                      <button
                        onClick={() => setPrintModalRecord(record)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        title="Cetak Berita Acara / Lembar Logbook"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Cetak
                      </button>

                      {(activeUser.role === 'ADMIN1' || activeUser.role === 'ADMIN2') && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Yakin ingin menghapus catatan logbook ${record.nomorLog}?`)) {
                              onDeleteOperationalRecord(record.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Catatan"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 3-Stage Inspection Mini Summary Badge Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
                    {/* Tahap 1: Pra-Operasi */}
                    <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          I. Pra-Operasi (Sebelum)
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700">
                          {record.praOperasi.statusKesiapan}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 space-y-0.5">
                        <div className="flex justify-between">
                          <span>BBM Awal: <strong>{record.praOperasi.levelBBM}%</strong></span>
                          <span>Aki: <strong>{record.praOperasi.teganganBaterai}V</strong></span>
                        </div>
                        <div className="text-slate-500 truncate" title={record.praOperasi.catatanPra}>
                          Oli: {record.praOperasi.levelOli} · Coolant: {record.praOperasi.levelCoolant}
                        </div>
                      </div>
                    </div>

                    {/* Tahap 2: Saat Beroperasi */}
                    <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-700 flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-blue-600" />
                          II. Saat Beroperasi (Running)
                        </span>
                        <span className="text-[10px] font-mono font-bold text-blue-700">
                          {record.saatOperasi.teganganL1L2}V · {record.saatOperasi.frekuensi}Hz
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 space-y-0.5">
                        <div className="flex justify-between">
                          <span>Oli: <strong>{record.saatOperasi.tekananOli} Bar</strong></span>
                          <span>Suhu: <strong>{record.saatOperasi.temperaturMesin}°C</strong></span>
                          <span>Beban: <strong>{record.saatOperasi.persenBeban}%</strong></span>
                        </div>
                        <div className="text-slate-500 truncate">
                          Getaran: {record.saatOperasi.suaraDanGetaran} · Asap: {record.saatOperasi.kondisiAsap}
                        </div>
                      </div>
                    </div>

                    {/* Tahap 3: Pasca-Operasi */}
                    <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-700 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                          III. Pasca-Operasi (Sesudah)
                        </span>
                        <span className="text-[10px] font-bold text-teal-700">
                          {isRunning ? 'Menunggu Shutdown' : record.pascaOperasi.kondisiAkhirGenset}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 space-y-0.5">
                        <div className="flex justify-between">
                          <span>Cooling: <strong>{record.pascaOperasi.coolingDownDurasiMenit}m</strong></span>
                          <span>Sisa BBM: <strong>{record.pascaOperasi.levelBBMAkhir}%</strong></span>
                          <span>Solar: <strong>±{record.pascaOperasi.estimasiKonsumsiSolarLiter}L</strong></span>
                        </div>
                        <div className="text-slate-500 truncate">
                          {record.pascaOperasi.cekKebocoran} · {record.pascaOperasi.posisiSelectorAkhir}
                        </div>
                      </div>
                    </div>
                  </div>

                  {record.catatanKhusus && (
                    <div className="mt-2.5 text-xs text-slate-600 bg-amber-50/50 border border-amber-200/60 rounded px-2.5 py-1.5">
                      <strong className="text-amber-800">Catatan Khusus:</strong> {record.catatanKhusus}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL 1: CATAT OPERASIONAL BARU (FULL 3-STAGE FORM) */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex justify-center items-start p-3 sm:p-4">
          <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Gauge className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg">Catat Pengoperasian & Pemeriksaan Genset</h3>
                  <p className="text-xs text-slate-300">
                    Formulir Terpadu: Pra-Operasi, Parameter Running, dan Pasca-Operasi (Satuan Denma)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewRecord} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              
              {/* SECTION A: INFORMASI DASAR OPERASI */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  A. Informasi Unit & Waktu Pengoperasian
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Pilih Unit Genset *
                    </label>
                    <select
                      value={targetGensetId}
                      onChange={(e) => handleSelectGensetChange(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-bold"
                      required
                    >
                      {gensets.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.nama} ({g.kapasitas})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nomor Log Operasional
                    </label>
                    <input
                      type="text"
                      value={nomorLog}
                      onChange={(e) => setNomorLog(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tanggal Operasi
                    </label>
                    <input
                      type="date"
                      value={tanggal}
                      onChange={(e) => setTanggal(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Keperluan Pengoperasian *
                    </label>
                    <select
                      value={keperluan}
                      onChange={(e) => setKeperluan(e.target.value as OperationalPurpose)}
                      className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-semibold"
                    >
                      <option value="Pemadaman PLN">Pemadaman PLN (Listrik Padam)</option>
                      <option value="Uji Coba Rutin / Warm-up">Uji Coba Rutin / Warm-up (Pemanasan)</option>
                      <option value="Support Operasi & Acara Khusus">Support Acara / Vicon / Upacara</option>
                      <option value="Pemeliharaan / Running Test">Pemeliharaan / Running Test Pasca Servis</option>
                      <option value="Darurat / Emergency">Darurat / Emergency</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mode Operasi
                    </label>
                    <select
                      value={modeOperasi}
                      onChange={(e) => setModeOperasi(e.target.value as OperationalMode)}
                      className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-semibold"
                    >
                      <option value="Manual">Manual Starting</option>
                      <option value="Auto (AMF/ATS)">Auto (AMF / ATS Otomatis)</option>
                      <option value="Test Run">Test Run Mode</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Operator / Teknisi Penanggung Jawab
                    </label>
                    <input
                      type="text"
                      value={operatorName}
                      onChange={(e) => setOperatorName(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Petugas Pendamping / Saksi
                    </label>
                    <input
                      type="text"
                      value={pendampingName}
                      onChange={(e) => setPendampingName(e.target.value)}
                      placeholder="e.g. Kopda Eko"
                      className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Waktu Mulai (Start Engine)
                    </label>
                    <input
                      type="time"
                      value={waktuMulai}
                      onChange={(e) => setWaktuMulai(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Hour Meter Awal (HM Start)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={hourMeterAwal}
                      onChange={(e) => setHourMeterAwal(Number(e.target.value))}
                      className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                      required
                    />
                  </div>
                </div>

                {/* Status Toggle: Sedang Beroperasi vs Sudah Selesai */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isCurrentlyRunning}
                      onChange={(e) => setIsCurrentlyRunning(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span className="text-xs font-bold text-slate-800">
                      Genset Sedang Aktif Beroperasi Saat Ini (Pemeriksaan Pasca Operasi Diisi Saat Shutdown)
                    </span>
                  </label>
                </div>
              </div>

              {/* SECTION B: PEMERIKSAAN SEBELUM PENGOPERASIAN (PRA-OPERASI) */}
              <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-200 space-y-4">
                <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                  <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    B. Hasil Pemeriksaan SEBELUM Pengoperasian (Pra-Operasi / Pre-Start)
                  </h4>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    Wajib Diperiksa Sebelum Crank
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Level Oli Mesin (Dipstick)
                    </label>
                    <select
                      value={praLevelOli}
                      onChange={(e) => setPraLevelOli(e.target.value as any)}
                      className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-medium"
                    >
                      <option value="Cukup / Normal">Cukup / Normal (Garis Aman)</option>
                      <option value="Kurang">Kurang (Perlu Ditambah)</option>
                      <option value="Keruh / Perlu Penggantian">Keruh / Perlu Ganti</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Air Radiator / Coolant
                    </label>
                    <select
                      value={praLevelCoolant}
                      onChange={(e) => setPraLevelCoolant(e.target.value as any)}
                      className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-medium"
                    >
                      <option value="Normal / Cukup">Normal / Cukup Penuh</option>
                      <option value="Kurang">Kurang (Perlu Top-up)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Level BBM Solar Harian (%)
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="100"
                      value={praLevelBBM}
                      onChange={(e) => setPraLevelBBM(Number(e.target.value))}
                      className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tegangan Baterai / Aki (VDC)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={praVoltaseBaterai}
                      onChange={(e) => setPraVoltaseBaterai(Number(e.target.value))}
                      className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-bold font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Kondisi Ruangan & Kebocoran
                    </label>
                    <select
                      value={praKondisiRuang}
                      onChange={(e) => setPraKondisiRuang(e.target.value as any)}
                      className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-medium"
                    >
                      <option value="Bersih & Aman">Bersih & Aman (Ventilasi Buka)</option>
                      <option value="Terdapat Kebocoran">Terdapat Rembesan / Bocor</option>
                      <option value="Ventilasi Tertutup">Ventilasi Tertutup</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Posisi Selector Switch
                    </label>
                    <select
                      value={praPosisiSelector}
                      onChange={(e) => setPraPosisiSelector(e.target.value as any)}
                      className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-medium"
                    >
                      <option value="Manual">Manual</option>
                      <option value="Auto">Auto</option>
                      <option value="Off">Off</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Kondisi V-Belt Kipas & Dinamo
                    </label>
                    <select
                      value={praKondisiBelt}
                      onChange={(e) => setPraKondisiBelt(e.target.value as any)}
                      className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-medium"
                    >
                      <option value="Kencang & Baik">Kencang & Baik</option>
                      <option value="Kendor">Kendor (Perlu Setel)</option>
                      <option value="Retak">Retak (Perlu Diganti)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Status Kesiapan Pra-Operasi
                    </label>
                    <select
                      value={praStatusKesiapan}
                      onChange={(e) => setPraStatusKesiapan(e.target.value as any)}
                      className="w-full text-xs p-2 bg-white border border-emerald-400 rounded-lg font-bold text-emerald-800"
                    >
                      <option value="Siap & Aman Dioperasikan">Siap & Aman Dioperasikan</option>
                      <option value="Perlu Perhatian">Perlu Perhatian</option>
                      <option value="Tidak Siap (Batal)">Tidak Siap (Batal)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Catatan Pemeriksaan Pra-Operasi
                  </label>
                  <input
                    type="text"
                    value={praCatatan}
                    onChange={(e) => setPraCatatan(e.target.value)}
                    placeholder="Catatan kondisi awal sebelum engine di-crank..."
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* SECTION C: PENGUKURAN PARAMETER SAAT PENGOPERASIAN (RUNNING PARAMETERS) */}
              <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-200 space-y-4">
                <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                  <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-600" />
                    C. Parameter Teknis SAAT Pengoperasian (Running Parameters)
                  </h4>
                  <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                    Catat saat Engine Berputar Stabil
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tegangan (Volt L-L)
                    </label>
                    <input
                      type="number"
                      value={runVoltase}
                      onChange={(e) => setRunVoltase(Number(e.target.value))}
                      className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-bold font-mono text-blue-700"
                    />
                    <span className="text-[10px] text-slate-400">Standar 380V</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Frekuensi (Hz)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={runFrekuensi}
                      onChange={(e) => setRunFrekuensi(Number(e.target.value))}
                      className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-bold font-mono text-blue-700"
                    />
                    <span className="text-[10px] text-slate-400">Standar 50.0 Hz</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Putaran RPM
                    </label>
                    <input
                      type="number"
                      value={runRpm}
                      onChange={(e) => setRunRpm(Number(e.target.value))}
                      className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-bold font-mono text-blue-700"
                    />
                    <span className="text-[10px] text-slate-400">Standar 1500 RPM</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tekanan Oli (Bar)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={runTekananOli}
                      onChange={(e) => setRunTekananOli(Number(e.target.value))}
                      className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-bold font-mono text-blue-700"
                    />
                    <span className="text-[10px] text-slate-400">3.5 - 5.5 Bar</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Suhu Mesin (°C)
                    </label>
                    <input
                      type="number"
                      value={runSuhuMesin}
                      onChange={(e) => setRunSuhuMesin(Number(e.target.value))}
                      className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-bold font-mono text-blue-700"
                    />
                    <span className="text-[10px] text-slate-400">75 - 85°C</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Beban (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={runPersenBeban}
                      onChange={(e) => setRunPersenBeban(Number(e.target.value))}
                      className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-bold font-mono text-blue-700"
                    />
                    <span className="text-[10px] text-slate-400">{runArusBeban} Ampere</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Getaran & Suara Mesin
                    </label>
                    <select
                      value={runSuaraGetaran}
                      onChange={(e) => setRunSuaraGetaran(e.target.value as any)}
                      className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-medium"
                    >
                      <option value="Halus & Normal">Halus & Normal</option>
                      <option value="Getaran Sedang">Getaran Sedang</option>
                      <option value="Bising / Getaran Abnormal">Bising / Getaran Abnormal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Kondisi Asap Gas Buang
                    </label>
                    <select
                      value={runKondisiAsap}
                      onChange={(e) => setRunKondisiAsap(e.target.value as any)}
                      className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-medium"
                    >
                      <option value="Normal / Bersih">Normal / Bersih (Tipis Normal)</option>
                      <option value="Asap Hitam">Asap Hitam (Kelebihan Beban / Injektor)</option>
                      <option value="Asap Putih">Asap Putih (Kandungan Air / Oli)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Catatan Selama Mesin Beroperasi
                  </label>
                  <input
                    type="text"
                    value={runCatatan}
                    onChange={(e) => setRunCatatan(e.target.value)}
                    placeholder="Catatan kestabilan beban, temperatur ruangan, dsb..."
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* SECTION D: PEMERIKSAAN SESUDAH PENGOPERASIAN (PASCA-OPERASI & SHUTDOWN) */}
              {!isCurrentlyRunning ? (
                <div className="bg-teal-50/50 rounded-xl p-4 border border-teal-200 space-y-4">
                  <div className="flex items-center justify-between border-b border-teal-200 pb-2">
                    <h4 className="text-xs font-bold text-teal-900 uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-teal-600" />
                      D. Hasil Pemeriksaan SESUDAH Pengoperasian (Pasca-Operasi & Shutdown)
                    </h4>
                    <span className="text-[11px] font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded">
                      Dilakukan Setelah Engine Dimatikan
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Waktu Selesai (Stop)
                      </label>
                      <input
                        type="time"
                        value={waktuSelesai}
                        onChange={(e) => setWaktuSelesai(e.target.value)}
                        className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Cooling Down (Menit)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="15"
                        value={postCoolingDown}
                        onChange={(e) => setPostCoolingDown(Number(e.target.value))}
                        className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-bold"
                      />
                      <span className="text-[10px] text-slate-400">Standar 3 - 5 menit tanpa beban</span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Hour Meter Akhir (HM Stop)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={postHourMeterAkhir}
                        onChange={(e) => setPostHourMeterAkhir(Number(e.target.value))}
                        className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Level BBM Akhir (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={postLevelBBM}
                        onChange={(e) => setPostLevelBBM(Number(e.target.value))}
                        className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Estimasi Konsumsi Solar (L)
                      </label>
                      <input
                        type="number"
                        value={postKonsumsiSolar}
                        onChange={(e) => setPostKonsumsiSolar(Number(e.target.value))}
                        className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Pemeriksaan Kebocoran Fluida
                      </label>
                      <select
                        value={postCekKebocoran}
                        onChange={(e) => setPostCekKebocoran(e.target.value as any)}
                        className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-medium"
                      >
                        <option value="Nihil Kebocoran (Aman)">Nihil Kebocoran (Aman)</option>
                        <option value="Rembesan Oli">Ada Rembesan Oli</option>
                        <option value="Tetesan Coolant">Ada Tetesan Coolant</option>
                        <option value="Bocor BBM">Ada Bocor BBM Solar</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Posisi Selector Akhir
                      </label>
                      <select
                        value={postSelectorAkhir}
                        onChange={(e) => setPostSelectorAkhir(e.target.value as any)}
                        className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-medium"
                      >
                        <option value="Standby Auto (AMF/ATS)">Standby Auto (AMF / ATS)</option>
                        <option value="Manual">Manual</option>
                        <option value="Off">Off</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Kondisi Akhir Genset
                      </label>
                      <select
                        value={postKondisiAkhir}
                        onChange={(e) => setPostKondisiAkhir(e.target.value as any)}
                        className="w-full text-xs p-2 bg-white border border-teal-400 rounded-lg font-bold text-teal-800"
                      >
                        <option value="Siap Siaga / Standby Normal">Siap Siaga / Standby Normal</option>
                        <option value="Perlu Pemeliharaan">Perlu Pemeliharaan</option>
                        <option value="Ada Temuan Gangguan">Ada Temuan Gangguan</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Catatan Pasca-Operasi
                    </label>
                    <input
                      type="text"
                      value={postCatatan}
                      onChange={(e) => setPostCatatan(e.target.value)}
                      placeholder="Catatan pendinginan mesin, kondisi baterai setelah float charger aktif, dsb..."
                      className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5">
                  <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Mode Sedang Beroperasi Aktif</strong>
                    Pemeriksaan pasca operasi (cooling down time, sisa solar, hour meter shutdown, dan penguncian unit) akan diisi saat Anda menekan tombol <strong>&ldquo;Selesaikan & Shutdown&rdquo;</strong> nanti setelah kegiatan selesai.
                  </div>
                </div>
              )}

              {/* Catatan Khusus Tambahan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Khusus / Ringkasan Operasional (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={catatanKhusus}
                  onChange={(e) => setCatatanKhusus(e.target.value)}
                  placeholder="Catatan tambahan kejadian atau instruksi khusus dari perwira jaga..."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              {/* Form Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Simpan Catatan Logbook
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DETAIL PEMERIKSAAN 3 TAHAP LENGKAP */}
      {selectedDetailRecord && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex justify-center items-start p-3 sm:p-4">
          <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            
            {/* Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base sm:text-lg">Detail Hasil Pemeriksaan Operasional</h3>
                    <span className="text-xs font-mono font-bold bg-slate-800 px-2 py-0.5 rounded">
                      {selectedDetailRecord.nomorLog}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    {selectedDetailRecord.gensetName} · Tanggal {selectedDetailRecord.tanggal}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setPrintModalRecord(selectedDetailRecord);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Cetak Lembar
                </button>
                <button
                  onClick={() => setSelectedDetailRecord(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto text-xs">
              
              {/* Summary Stats Header */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block">Status Operasi:</span>
                  <span className="font-bold text-slate-900">{selectedDetailRecord.status}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Keperluan:</span>
                  <span className="font-bold text-blue-700">{selectedDetailRecord.keperluan}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Operator:</span>
                  <span className="font-bold text-slate-900">{selectedDetailRecord.operator}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Hour Meter:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {selectedDetailRecord.hourMeterAwal} → {selectedDetailRecord.hourMeterAkhir} Jam
                  </span>
                </div>
              </div>

              {/* TAHAP I: PRE-START */}
              <div className="border border-emerald-200 rounded-xl overflow-hidden">
                <div className="bg-emerald-50 px-4 py-2.5 border-b border-emerald-200 flex items-center justify-between">
                  <h4 className="font-bold text-emerald-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    I. Pemeriksaan SEBELUM Pengoperasian (Pra-Operasi)
                  </h4>
                  <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                    {selectedDetailRecord.praOperasi.statusKesiapan}
                  </span>
                </div>
                <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white">
                  <div>
                    <span className="text-slate-500 block">Level Oli:</span>
                    <span className="font-semibold text-slate-800">{selectedDetailRecord.praOperasi.levelOli}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Air Radiator / Coolant:</span>
                    <span className="font-semibold text-slate-800">{selectedDetailRecord.praOperasi.levelCoolant}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Level BBM Solar:</span>
                    <span className="font-semibold text-slate-800">{selectedDetailRecord.praOperasi.levelBBM}%</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Tegangan Aki / Starting:</span>
                    <span className="font-mono font-semibold text-slate-800">{selectedDetailRecord.praOperasi.teganganBaterai} VDC</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Kondisi Fisik Ruangan:</span>
                    <span className="font-semibold text-slate-800">{selectedDetailRecord.praOperasi.kondisiFisikRuangan}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Posisi Selector:</span>
                    <span className="font-semibold text-slate-800">{selectedDetailRecord.praOperasi.posisiSelector}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Kondisi V-Belt Kipas:</span>
                    <span className="font-semibold text-slate-800">{selectedDetailRecord.praOperasi.kondisiBelt}</span>
                  </div>
                </div>
                {selectedDetailRecord.praOperasi.catatanPra && (
                  <div className="px-4 py-2 bg-emerald-50/50 border-t border-emerald-100 text-slate-600">
                    <strong>Catatan Pra:</strong> {selectedDetailRecord.praOperasi.catatanPra}
                  </div>
                )}
              </div>

              {/* TAHAP II: SAAT BEROPERASI */}
              <div className="border border-blue-200 rounded-xl overflow-hidden">
                <div className="bg-blue-50 px-4 py-2.5 border-b border-blue-200 flex items-center justify-between">
                  <h4 className="font-bold text-blue-900 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-600" />
                    II. Parameter Teknis SAAT Pengoperasian (Running Parameters)
                  </h4>
                  <span className="font-mono font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded text-[11px]">
                    Output: {selectedDetailRecord.saatOperasi.teganganL1L2}V · {selectedDetailRecord.saatOperasi.frekuensi}Hz
                  </span>
                </div>
                <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white">
                  <div>
                    <span className="text-slate-500 block">Tegangan Generator:</span>
                    <span className="font-mono font-bold text-blue-700">{selectedDetailRecord.saatOperasi.teganganL1L2} Volt</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Frekuensi Output:</span>
                    <span className="font-mono font-bold text-blue-700">{selectedDetailRecord.saatOperasi.frekuensi} Hz</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Putaran Mesin (RPM):</span>
                    <span className="font-mono font-bold text-blue-700">{selectedDetailRecord.saatOperasi.rpm} RPM</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Tekanan Oli Mesin:</span>
                    <span className="font-mono font-bold text-blue-700">{selectedDetailRecord.saatOperasi.tekananOli} Bar</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Suhu Mesin / Coolant:</span>
                    <span className="font-mono font-bold text-blue-700">{selectedDetailRecord.saatOperasi.temperaturMesin} °C</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Beban Generator:</span>
                    <span className="font-mono font-bold text-blue-700">{selectedDetailRecord.saatOperasi.persenBeban}% ({selectedDetailRecord.saatOperasi.arusBeban}A)</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Suara & Getaran:</span>
                    <span className="font-semibold text-slate-800">{selectedDetailRecord.saatOperasi.suaraDanGetaran}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Kondisi Gas Buang:</span>
                    <span className="font-semibold text-slate-800">{selectedDetailRecord.saatOperasi.kondisiAsap}</span>
                  </div>
                </div>
                {selectedDetailRecord.saatOperasi.catatanSaat && (
                  <div className="px-4 py-2 bg-blue-50/50 border-t border-blue-100 text-slate-600">
                    <strong>Catatan Running:</strong> {selectedDetailRecord.saatOperasi.catatanSaat}
                  </div>
                )}
              </div>

              {/* TAHAP III: PASCA-OPERASI */}
              <div className="border border-teal-200 rounded-xl overflow-hidden">
                <div className="bg-teal-50 px-4 py-2.5 border-b border-teal-200 flex items-center justify-between">
                  <h4 className="font-bold text-teal-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-teal-600" />
                    III. Pemeriksaan SESUDAH Pengoperasian (Pasca-Operasi & Shutdown)
                  </h4>
                  <span className="font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded text-[11px]">
                    {selectedDetailRecord.pascaOperasi.kondisiAkhirGenset}
                  </span>
                </div>
                <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white">
                  <div>
                    <span className="text-slate-500 block">Cooling Down Tanpa Beban:</span>
                    <span className="font-semibold text-slate-800">{selectedDetailRecord.pascaOperasi.coolingDownDurasiMenit} Menit</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Hour Meter Final:</span>
                    <span className="font-mono font-bold text-slate-800">{selectedDetailRecord.pascaOperasi.hourMeterAkhir} Jam</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Sisa BBM Solar Harian:</span>
                    <span className="font-semibold text-slate-800">{selectedDetailRecord.pascaOperasi.levelBBMAkhir}%</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Estimasi Solar Terpakai:</span>
                    <span className="font-semibold text-slate-800">±{selectedDetailRecord.pascaOperasi.estimasiKonsumsiSolarLiter} Liter</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Pemeriksaan Kebocoran:</span>
                    <span className="font-semibold text-slate-800">{selectedDetailRecord.pascaOperasi.cekKebocoran}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Posisi Selector Akhir:</span>
                    <span className="font-semibold text-slate-800">{selectedDetailRecord.pascaOperasi.posisiSelectorAkhir}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Float Charger Aki:</span>
                    <span className="font-semibold text-slate-800">{selectedDetailRecord.pascaOperasi.chargerAkiNormal ? 'Aktif (Normal)' : 'Tidak Aktif'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Kebersihan & Keamanan:</span>
                    <span className="font-semibold text-slate-800">{selectedDetailRecord.pascaOperasi.kebersihanDanKunci}</span>
                  </div>
                </div>
                {selectedDetailRecord.pascaOperasi.catatanPasca && (
                  <div className="px-4 py-2 bg-teal-50/50 border-t border-teal-100 text-slate-600">
                    <strong>Catatan Pasca:</strong> {selectedDetailRecord.pascaOperasi.catatanPasca}
                  </div>
                )}
              </div>

            </div>

            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedDetailRecord(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Tutup Detail
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 3: SELESAIKAN & SHUTDOWN OPERASI (QUICK POST-RUN INPUT) */}
      {completingRecord && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex justify-center items-center p-3 sm:p-4">
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="bg-emerald-800 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Square className="w-5 h-5 fill-white" />
                <div>
                  <h3 className="font-bold text-base">Shutdown & Input Pasca-Operasi</h3>
                  <p className="text-xs text-emerald-200">{completingRecord.gensetName}</p>
                </div>
              </div>
              <button
                onClick={() => setCompletingRecord(null)}
                className="text-emerald-200 hover:text-white p-1 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitComplete} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Waktu Selesai (Stop Engine)
                  </label>
                  <input
                    type="time"
                    value={shutdownWaktu}
                    onChange={(e) => setShutdownWaktu(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Cooling Down (Menit)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={shutdownCoolingDown}
                    onChange={(e) => setShutdownCoolingDown(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Hour Meter Akhir (HM)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={shutdownHMAkhir}
                    onChange={(e) => setShutdownHMAkhir(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Sisa BBM Solar Harian (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={shutdownLevelBBM}
                    onChange={(e) => setShutdownLevelBBM(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Estimasi Solar Terpakai (Liter)
                  </label>
                  <input
                    type="number"
                    value={shutdownKonsumsi}
                    onChange={(e) => setShutdownKonsumsi(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Pemeriksaan Kebocoran
                  </label>
                  <select
                    value={shutdownKebocoran}
                    onChange={(e) => setShutdownKebocoran(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
                  >
                    <option value="Nihil Kebocoran (Aman)">Nihil Kebocoran (Aman)</option>
                    <option value="Rembesan Oli">Ada Rembesan Oli</option>
                    <option value="Tetesan Coolant">Ada Tetesan Coolant</option>
                    <option value="Bocor BBM">Ada Bocor BBM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Posisi Selector Dikembalikan ke:
                </label>
                <select
                  value={shutdownSelector}
                  onChange={(e) => setShutdownSelector(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
                >
                  <option value="Standby Auto (AMF/ATS)">Standby Auto (AMF / ATS)</option>
                  <option value="Manual">Manual</option>
                  <option value="Off">Off</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan Pasca-Operasi
                </label>
                <textarea
                  rows={2}
                  value={shutdownCatatan}
                  onChange={(e) => setShutdownCatatan(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCompletingRecord(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  Selesaikan Operasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE MODAL LEMBAR LOGBOOK */}
      <PrintableOperationalLogModal
        isOpen={Boolean(printModalRecord)}
        onClose={() => setPrintModalRecord(null)}
        record={printModalRecord}
        genset={gensets.find((g) => g.id === printModalRecord?.gensetId)}
      />

    </div>
  );
};
