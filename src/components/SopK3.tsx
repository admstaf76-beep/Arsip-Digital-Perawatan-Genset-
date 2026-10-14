import React, { useState, useMemo } from 'react';
import { GensetItem, SOPChecklistRecord, UserSession } from '../types/genset';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  User,
  Calendar,
  Lock,
  HardHat,
  Droplets,
  Activity,
  Plus,
  X,
  Zap,
  Printer,
  BookOpen,
  Flame,
  Wrench,
  Gauge,
  FileText,
  Search,
  Sliders,
  CheckSquare,
  AlertOctagon,
  RefreshCw,
  PhoneCall,
  Volume2,
  Eye,
  Trash2,
  Pencil,
  FileEdit,
} from 'lucide-react';

interface SopK3Props {
  sopLogs: SOPChecklistRecord[];
  gensets: GensetItem[];
  activeUser: UserSession;
  onSaveSOP: (record: SOPChecklistRecord, isNew?: boolean) => void;
  onDeleteSOP: (id: string) => void;
}

type TabMode = 'protap-doc' | 'golden-rules' | 'apd-matrix' | 'emergency-protocol' | 'checklist-logs';

export const SopK3: React.FC<SopK3Props> = ({
  sopLogs,
  gensets,
  activeUser,
  onSaveSOP,
  onDeleteSOP,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<TabMode>('protap-doc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'ALL' | 'SEDANG' | 'BERAT' | 'K3'>('ALL');

  // Edit and Delete state
  const [editingRecord, setEditingRecord] = useState<SOPChecklistRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<SOPChecklistRecord | null>(null);

  // Table filter & search state for checklist history
  const [checklistSearch, setChecklistSearch] = useState('');
  const [checklistStatusFilter, setChecklistStatusFilter] = useState<'ALL' | 'Lengkap & Aman' | 'Belum Lengkap'>('ALL');

  // Form State for new / edit checklist
  const [selectedGensetId, setSelectedGensetId] = useState<string>(gensets[0]?.id || '');
  const [teknisiName, setTeknisiName] = useState<string>(activeUser.name);
  const [tanggalInput, setTanggalInput] = useState<string>(new Date().toISOString().slice(0, 10));
  const [checks, setChecks] = useState({
    area: true,
    unit: true,
    fluida: true,
    loto: true,
    jsa: true,
    apd: true,
    verifikasi: true,
  });
  const [catatan, setCatatan] = useState('');

  const canManage =
    activeUser.role === 'TEKNISI' ||
    activeUser.role === 'ADMIN1' ||
    activeUser.role === 'ADMIN2' ||
    activeUser.role === 'KADISLOG';

  // 11 Golden Rules of K3 Genset
  const goldenRules = [
    {
      num: '01',
      title: 'Lockout / Tagout (LOTO) & Pemutus Daya',
      desc: 'Wajib memutuskan Main Circuit Breaker (MCCB) dan memasang gembok pengaman serta label peringatan bahaya sebelum membuka pintu panel atau menyentuh komponen bertegangan.',
      risk: 'Bahaya Tersengat Listrik Tegangan Tinggi (High Voltage)',
      action: 'Pastikan voltmeter menunjukkan 0V dan test tegangan sisa dengan tester berisolasi.',
      category: 'Kritikal Listrik',
      color: 'red',
    },
    {
      num: '02',
      title: 'Pelepasan Terminal Aki Starter Negatif (-)',
      desc: 'Lepaskan kabel terminal negatif baterai sebelum melakukan intervensi mekanikal, penggantian oli, atau pembersihan filter guna mencegah mesin menyala otomatis (auto-start) secara tiba-tiba.',
      risk: 'Cidera Mekanikal Putaran Mesin Tanpa Peringatan',
      action: 'Bungkus kutub negatif aki dengan bahan isolator karet.',
      category: 'Kritikal Mekanikal',
      color: 'red',
    },
    {
      num: '03',
      title: 'Suhu Mesin & Tutup Radiator Bertekanan',
      desc: 'Dilarang keras membuka tutup radiator saat mesin baru saja mati atau temperatur coolant > 50°C. Uap mendidih bertekanan dapat menyembur seketika.',
      risk: 'Luka Bakar Panas Kimiawi & Uap Air Radiator',
      action: 'Gunakan kain pelindung tebal dan buka perlahan setengah putaran untuk melepas tekanan sisa.',
      category: 'Termal',
      color: 'amber',
    },
    {
      num: '04',
      title: 'Area Bebas Api & Larangan Merokok',
      desc: 'Kawasan ruang genset dan tangki solar harian (daily fuel tank) adalah zona bebas api. Dilarang merokok, menyalakan korek api, atau melakukan pekerjaan gerinda tanpa hot-work permit.',
      risk: 'Kebakaran Uap Bahan Bakar Diesel & Ledakan Gas',
      action: 'Pasang rambu larangan merokok dan periksa tidak ada kabel terkelupas dekat solar.',
      category: 'Kebakaran',
      color: 'red',
    },
    {
      num: '05',
      title: 'Kepatuhan Pemakaian APD Sesuai Matriks',
      desc: 'Setiap personel teknisi wajib mengenakan helm safety, sepatu safety berujung baja & sol anti-slip, sarung tangan khusus (nitril atau isolasi 1000V), serta ear protection saat unit running.',
      risk: 'Benturan Kepala, Terpeleset, Kejatuhan Benda, Kerusakan Pendengaran',
      action: 'Inspeksi fisik APD sebelum memasuki ruang pembangkit.',
      category: 'APD Wajib',
      color: 'blue',
    },
    {
      num: '06',
      title: 'Ventilasi Udara Ruangan & Gas Buang (CO)',
      desc: 'Pastikan kisi louver inlet dan outlet udara terbuka sempurna, blower exhaust aktif, dan saluran knalpot tidak bocor ke dalam ruangan sebelum menghidupkan mesin genset.',
      risk: 'Asfiksia & Keracunan Fatal Gas Karbon Monoksida (CO)',
      action: 'Segera matikan mesin jika tercium bau asap pekat atau alarm detektor gas aktif.',
      category: 'Kesehatan Kerja',
      color: 'amber',
    },
    {
      num: '07',
      title: 'Kesiapan APAR Standby di Dekat Akses Keluar',
      desc: 'Pastikan APAR jenis Clean Agent / CO2 (min 6 Kg) dan Dry Chemical Powder dalam kondisi jarum hijau pada manometer serta tidak kedaluwarsa di dekat pintu akses ruang genset.',
      risk: 'Kegagalan Pemadaman Dini Saat Muncul Percikan Api',
      action: 'Uji visual segel dan selang nozzle pemadam setiap pergantian dinas.',
      category: 'Proteksi Kebakaran',
      color: 'red',
    },
    {
      num: '08',
      title: 'Penggunaan Drip Pan & Penanganan Tumpahan B3',
      desc: 'Gunakan bak penampung (drip pan) di bawah titik kuras oli atau filter solar. Segera taburkan serbuk gergaji/oil absorbent pad jika terjadi rembesan fluida ke lantai.',
      risk: 'Lantai Licin, Tergelincir, & Pencemaran Lingkungan',
      action: 'Tampung oli bekas ke drum tertutup berlabel Limbah B3 khusus.',
      category: 'Lingkungan B3',
      color: 'emerald',
    },
    {
      num: '09',
      title: 'Larangan Menyentuh Komponen Berputar & Guarding',
      desc: 'Dilarang menyentuh atau mendekatkan anggota tubuh ke kipas pendingin, belt alternator, atau flywheel saat unit running. Pasang kembali semua pelindung (protective wire cage) sebelum running test.',
      risk: 'Terjepit Komponen Berputar Berkecepatan Tinggi',
      action: 'Verifikasi seluruh baut pengaman penutup cover kipas terpasang kencang.',
      category: 'Mekanikal',
      color: 'red',
    },
    {
      num: '10',
      title: 'Pengelolaan Limbah Terkontaminasi B3',
      desc: 'Kain majun berminyak, filter oli bekas, dan sisa bahan bakar dilarang dibakar atau dibuang ke tempat sampah umum. Wajib disimpan di TPS Limbah B3 berlisensi.',
      risk: 'Self-Combustion (Pembakaran Spontan Majun Berminyak) & Pencemaran',
      action: 'Gunakan wadah logam bertutup khusus limbah padat terkontaminasi B3.',
      category: 'Lingkungan B3',
      color: 'emerald',
    },
    {
      num: '11',
      title: 'Bekerja Berpasangan (Buddy System)',
      desc: 'Pekerjaan pemeliharaan tingkat sedang dan berat atau penanganan sistem kelistrikan tegangan tinggi wajib dilakukan minimal oleh 2 personel teknisi berkualifikasi.',
      risk: 'Ketiadaan Bantuan Cepat Saat Terjadi Kondisi Darurat / Cedera',
      action: 'Satu teknisi bertindak sebagai eksekutor, satu teknisi sebagai pengawas keselamatan (safety watcher).',
      category: 'Prosedural',
      color: 'blue',
    },
  ];

  // Matriks APD
  const apdMatrix = [
    {
      item: 'Helm Pengaman (Safety Helmet)',
      standar: 'SNI / EN 397 (Impact Resistant)',
      aktivitas: 'Seluruh kegiatan pemeliharaan mesin, inspeksi di bawah saluran pipa, dan ruang mesin terbatas.',
      fungsi: 'Melindungi kepala dari benturan pipa besi, benda jatuh, dan sudut tajam ruang kanopi genset.',
    },
    {
      item: 'Kacamata Safety / Goggles Pelindung',
      standar: 'ANSI Z87.1 / EN 166 (Anti-Splash & Impact)',
      aktivitas: 'Pembersihan kisi radiator dengan kompresor angin, draining oli panas, dan pengisian air aki.',
      fungsi: 'Mencegah cipratan zat kimia pendingin, serpihan logam, dan asam sulfat aki mengenai mata.',
    },
    {
      item: 'Pelindung Telinga (Ear Muff / Ear Plug)',
      standar: 'ANSI S3.19 (NRR > 25 dB)',
      aktivitas: 'Running test tanpa beban, uji sinkronisasi beban, dan verifikasi rpm genset.',
      fungsi: 'Mencegah kerusakan pendengaran permanen akibat intensitas suara knalpot & mesin > 85 dBA.',
    },
    {
      item: 'Sarung Tangan Nitril / Tahan Minyak & Solar',
      standar: 'EN 374 (Chemical & Oil Resistant)',
      aktivitas: 'Penggantian filter oli, kuras water separator bahan bakar, dan pengecekan dipstick oli.',
      fungsi: 'Melindungi kulit dari kontak karsinogenik oli mesin bekas dan dermatitis akibat solar.',
    },
    {
      item: 'Sarung Tangan Isolasi Listrik 1000V (Kelas 0)',
      standar: 'IEC 60903 / ASTM D120',
      aktivitas: 'Pemeriksaan panel ATS, pengukuran tegangan kabel keluaran generator, megger test belitan.',
      fungsi: 'Mencegah sengatan listrik tegangan tinggi AC 380V saat panel dalam keadaan beraliran arus.',
    },
    {
      item: 'Sepatu Safety (Steel Toe & Anti-Slip Sole)',
      standar: 'ISO 20345 / SNI 7079 (Toe Cap 200J)',
      aktivitas: 'Wajib digunakan di seluruh lantai ruang mesin genset dan area gardu listrik.',
      fungsi: 'Menahan benturan benda jatuh berat, tahan tusukan paku, dan isolasi anti-tergelincir oli.',
    },
    {
      item: 'Masker Respirator Debu & Gas (FFP2/KN95)',
      standar: 'EN 149 / NIOSH N95',
      aktivitas: 'Penyemprotan elemen filter udara luar, pembersihan kerak knalpot, dan ventilasi tertutup.',
      fungsi: 'Menyaring partikel jelaga karbon hitam dan partikulat debu halus silika agar tidak terhirup paru-paru.',
    },
  ];

  // Checklist Items for standard SOP verification
  const checklistItems = [
    {
      key: 'area' as const,
      title: '1. Pemeriksaan Area & Ventilasi',
      desc: 'Ventilasi udara terbuka, blower exhaust aktif, lantai bebas ceceran oli/solar, dan bebas material mudah terbakar.',
      icon: Activity,
    },
    {
      key: 'unit' as const,
      title: '2. Pemeriksaan Fisik Unit & Proteksi',
      desc: 'Fisik mesin utuh, baut mounting kencang, safety wire guard terpasang, pembumian (grounding) kokoh terhubung.',
      icon: Zap,
    },
    {
      key: 'fluida' as const,
      title: '3. Pemeriksaan Level Fluida',
      desc: 'Level oli pada batas full dipstick, coolant radiator penuh, tangki solar harian terisi minimal > 50%.',
      icon: Droplets,
    },
    {
      key: 'loto' as const,
      title: '4. Penerapan Prosedur LOTO',
      desc: 'Gembok pengaman dan tanda tagout terpasang pada breaker utama saat teknisi melaksanakan intervensi komponen.',
      icon: Lock,
    },
    {
      key: 'jsa' as const,
      title: '5. Job Safety Analysis (JSA)',
      desc: 'Identifikasi potensi risiko sengatan listrik, semburan fluida panas, bagian mekanik berputar, dan gas beracun.',
      icon: FileCheck,
    },
    {
      key: 'apd' as const,
      title: '6. Kelengkapan Matriks APD',
      desc: 'Menggunakan Helm Safety, Sepatu Safety Sol Minyak, Sarung Tangan Sesuai Tugas, Kacamata, dan Ear Protection.',
      icon: HardHat,
    },
    {
      key: 'verifikasi' as const,
      title: '7. Verifikasi Pra-Start & Alat Pemadam',
      desc: 'Tegangan aki > 24V DC, valve bahan bakar terbuka, APAR standby di akses keluar, kabel negatif aki siap sambung.',
      icon: ShieldAlert,
    },
  ];

  // Open modal for creating new checklist
  const handleOpenNewModal = () => {
    setEditingRecord(null);
    setSelectedGensetId(gensets[0]?.id || '');
    setTeknisiName(activeUser.name);
    setTanggalInput(new Date().toISOString().slice(0, 10));
    setChecks({
      area: true,
      unit: true,
      fluida: true,
      loto: true,
      jsa: true,
      apd: true,
      verifikasi: true,
    });
    setCatatan('');
    setIsModalOpen(true);
  };

  // Open modal for editing existing checklist
  const handleOpenEditModal = (record: SOPChecklistRecord) => {
    setEditingRecord(record);
    setSelectedGensetId(record.gensetId);
    setTeknisiName(record.teknisi);
    setTanggalInput(record.tanggal);
    setChecks({
      area: record.pemeriksaanArea,
      unit: record.pemeriksaanUnit,
      fluida: record.pemeriksaanFluida,
      loto: record.loto,
      jsa: record.jsa,
      apd: record.apd,
      verifikasi: record.verifikasiSebelumOperasi,
    });
    setCatatan(record.catatan || '');
    setIsModalOpen(true);
  };

  // Form submit handler for save or edit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const genset = gensets.find((g) => g.id === selectedGensetId) || gensets[0];
    const allChecked = Object.values(checks).every((v) => v === true);

    if (editingRecord) {
      const updatedRecord: SOPChecklistRecord = {
        ...editingRecord,
        tanggal: tanggalInput || editingRecord.tanggal,
        teknisi: teknisiName,
        gensetId: genset.id,
        gensetName: genset.nama,
        pemeriksaanArea: checks.area,
        pemeriksaanUnit: checks.unit,
        pemeriksaanFluida: checks.fluida,
        loto: checks.loto,
        jsa: checks.jsa,
        apd: checks.apd,
        verifikasiSebelumOperasi: checks.verifikasi,
        catatan: catatan || 'Pemeriksaan standar keselamatan K3 dipenuhi sebelum pekerjaan.',
        status: allChecked ? 'Lengkap & Aman' : 'Belum Lengkap',
      };
      onSaveSOP(updatedRecord, false);
    } else {
      const newRecord: SOPChecklistRecord = {
        id: `SOP-${Date.now().toString().slice(-6)}`,
        tanggal: tanggalInput || new Date().toISOString().slice(0, 10),
        teknisi: teknisiName,
        gensetId: genset.id,
        gensetName: genset.nama,
        pemeriksaanArea: checks.area,
        pemeriksaanUnit: checks.unit,
        pemeriksaanFluida: checks.fluida,
        loto: checks.loto,
        jsa: checks.jsa,
        apd: checks.apd,
        verifikasiSebelumOperasi: checks.verifikasi,
        catatan: catatan || 'Pemeriksaan standar keselamatan K3 dipenuhi sebelum pekerjaan.',
        status: allChecked ? 'Lengkap & Aman' : 'Belum Lengkap',
      };
      onSaveSOP(newRecord, true);
    }

    setIsModalOpen(false);
    setEditingRecord(null);
    setCatatan('');
  };

  // Filtered SOP guidelines for search
  const filteredGoldenRules = useMemo(() => {
    return goldenRules.filter((rule) => {
      const matchSearch =
        rule.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.risk.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.action.toLowerCase().includes(searchQuery.toLowerCase());

      if (selectedCategoryFilter === 'ALL') return matchSearch;
      if (selectedCategoryFilter === 'K3') return matchSearch;
      if (selectedCategoryFilter === 'SEDANG')
        return matchSearch && (rule.category.includes('Mekanikal') || rule.category.includes('Termal') || rule.category.includes('Lingkungan'));
      if (selectedCategoryFilter === 'BERAT')
        return matchSearch && (rule.category.includes('Kritikal') || rule.category.includes('Listrik'));
      return matchSearch;
    });
  }, [searchQuery, selectedCategoryFilter]);

  // Filtered Checklist History Logs
  const filteredChecklistLogs = useMemo(() => {
    return sopLogs.filter((log) => {
      const query = checklistSearch.toLowerCase();
      const matchSearch =
        log.id.toLowerCase().includes(query) ||
        log.gensetName.toLowerCase().includes(query) ||
        log.teknisi.toLowerCase().includes(query) ||
        log.tanggal.includes(query) ||
        (log.catatan && log.catatan.toLowerCase().includes(query));

      const matchStatus =
        checklistStatusFilter === 'ALL' ? true : log.status === checklistStatusFilter;

      return matchSearch && matchStatus;
    });
  }, [sopLogs, checklistSearch, checklistStatusFilter]);

  return (
    <div className="space-y-6 pb-16">
      {/* Official Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 text-white shadow-md border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 font-mono tracking-wider">
                PROTAP-GNS-002
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 font-mono">
                TINGKAT SEDANG & BERAT
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                FASINT DENMA KOOPSUDNAS
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <ShieldAlert className="w-6 h-6 text-blue-400 shrink-0" />
              <span>SOP & Prosedur Tetap (PROTAP) Pemeliharaan Rutin Genset</span>
            </h1>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Panduan operasional keselamatan kerja K3, aturan baku intervensi pemeliharaan tingkat sedang hingga berat, matriks APD wajib, dan penanganan tanggap darurat instalasi pembangkit tenaga listrik kedinasan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4 text-blue-600" />
              <span>Cetak PROTAP Resmi (PDF)</span>
            </button>

            {canManage && (
              <button
                onClick={handleOpenNewModal}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Input Checklist SOP / K3</span>
              </button>
            )}
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-6 mt-6 border-t border-slate-800/80">
          <button
            onClick={() => setActiveSubTab('protap-doc')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'protap-doc'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>1. Naskah Dokumen PROTAP</span>
          </button>

          <button
            onClick={() => setActiveSubTab('golden-rules')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'golden-rules'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>2. 11 Aturan Emas Keselamatan (K3)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('apd-matrix')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'apd-matrix'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <HardHat className="w-4 h-4" />
            <span>3. Matriks APD & Kategori Pekerjaan</span>
          </button>

          <button
            onClick={() => setActiveSubTab('emergency-protocol')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'emergency-protocol'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <AlertOctagon className="w-4 h-4" />
            <span>4. Protokol Tanggap Darurat</span>
          </button>

          <button
            onClick={() => setActiveSubTab('checklist-logs')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'checklist-logs'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>5. Riwayat Checklist Verifikasi ({sopLogs.length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: NASKAH DOKUMEN PROTAP RESMI LENGKAP                              */}
      {/* ========================================================================= */}
      {activeSubTab === 'protap-doc' && (
        <div className="space-y-6">
          {/* Executive Overview Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-blue-600">
                  Ringkasan Eksekutif & Dasar Kebijakan
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  Prosedur Tetap Pemeliharaan Rutin Genset: Tingkat Sedang sampai Berat
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-mono font-semibold rounded-lg border border-slate-200">
                  Dokumen No: PROTAP/02/X/2026/FASINT
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              Dokumen Prosedur Tetap (PROTAP) ini ditetapkan sebagai petunjuk baku dan wajib ditaati oleh seluruh personel teknisi, operator genset, dan pejabat logistik di lingkungan Fasint Denma Koopsudnas. PROTAP ini bertujuan untuk memastikan unit genset beroperasi dengan tingkat reliabilitas 100%, memperpanjang usia pakai mesin (*Mean Time Between Failures* / MTBF), serta meniadakan potensi kecelakaan kerja fatal (*Zero Accident*).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/60 space-y-1">
                <span className="text-[11px] font-bold text-blue-800 block">Kualifikasi Personel</span>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Hanya teknisi bersertifikat K3 Listrik / Mekanikal atau personel Denma dengan pengawasan Kepala Bengkel / Kadislog yang berhak mengeksekusi pekerjaan pemeliharaan tingkat berat.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/60 space-y-1">
                <span className="text-[11px] font-bold text-emerald-800 block">Metode Pelaksanaan</span>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Wajib menerapkan sistem berpasangan (*Buddy System*) minimal 2 teknisi. Pekerjaan tidak boleh dimulai sebelum izin kerja berisiko (*Job Safety Analysis* / JSA) dan LOTO disetujui.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200/60 space-y-1">
                <span className="text-[11px] font-bold text-purple-800 block">Kepatuhan Lingkungan (B3)</span>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Seluruh limbah cair (oli mesin bekas, coolant bekas) dan limbah padat terkontaminasi (filter, majun) wajib ditampung dalam wadah kedap dan diserahkan ke TPS Limbah B3.
                </p>
              </div>
            </div>
          </div>

          {/* Section: Rincian Prosedur Per Sistem (Sedang vs Berat) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Box 1: Tingkat Sedang (250 - 500 Jam Operasi) */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="px-6 py-4 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Wrench className="w-5 h-5 text-blue-700" />
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">
                      Bagian I: Pemeliharaan Rutin Tingkat Sedang
                    </h4>
                    <span className="text-[11px] text-blue-700 font-medium">
                      Interval Rutin: Setiap 250 - 500 Jam Operasi / 6 Bulan Sekali
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 text-[11px] font-bold bg-blue-100 text-blue-800 rounded-md">
                  Level 2
                </span>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div className="space-y-1.5 pb-3 border-b border-slate-100">
                  <h5 className="font-bold text-slate-900 flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-amber-600" />
                    <span>1. Sistem Pelumasan (Lubrication System)</span>
                  </h5>
                  <ul className="list-disc pl-5 space-y-1 text-slate-600">
                    <li>Kuras oli saat mesin bersuhu hangat (40°C - 50°C) agar endapan lumpur karbon mengalir keluar sepenuhnya.</li>
                    <li>Ganti seluruh filter oli pelumas mesin (*oil filter element*) dengan suku cadang orisinal / rekomendasi pabrikan.</li>
                    <li>Olesi gasket karet filter oli baru dengan lapisan tipis oli sebelum dikencangkan menggunakan kunci sabuk (*filter wrench*).</li>
                    <li>Isi oli baru berstandar SAE 15W-40 CI-4 / CK-4 hingga batas tanda batas 'FULL' pada tongkat dipstick.</li>
                  </ul>
                </div>

                <div className="space-y-1.5 pb-3 border-b border-slate-100">
                  <h5 className="font-bold text-slate-900 flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-blue-600" />
                    <span>2. Sistem Bahan Bakar (Fuel System)</span>
                  </h5>
                  <ul className="list-disc pl-5 space-y-1 text-slate-600">
                    <li>Kuras air dan kotoran sedimenter pada mangkuk *water separator*.</li>
                    <li>Ganti filter solar primer dan sekunder (*fuel cartridge filters*).</li>
                    <li>Lakukan *bleeding* (buang angin palsu) pada pompa injeksi solar (*priming pump*) hingga tidak ada gelembung udara dalam pipa injektor.</li>
                    <li>Periksa kekencangan klem selang fleksibel bahan bakar dari risiko rembesan atau getas.</li>
                  </ul>
                </div>

                <div className="space-y-1.5 pb-3 border-b border-slate-100">
                  <h5 className="font-bold text-slate-900 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-600" />
                    <span>3. Sistem Pendingin & Radiator</span>
                  </h5>
                  <ul className="list-disc pl-5 space-y-1 text-slate-600">
                    <li>Periksa level cairan pendingin (*coolant*) pada tangki ekspansi (rasio 50:50 glycol dan air demineral).</li>
                    <li>Bersihkan kisi-kisi radiator dari tumpukan debu menggunakan tiupan kompresor tekanan rendah (&lt; 30 psi) arah berlawanan.</li>
                    <li>Periksa tegangan sabuk kipas radiator (*fan belt*): defleksi ideal 10-15 mm dengan tekanan ibu jari tangan.</li>
                  </ul>
                </div>

                <div className="space-y-1.5">
                  <h5 className="font-bold text-slate-900 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>4. Sistem Baterai & Starting Motor</span>
                  </h5>
                  <ul className="list-disc pl-5 space-y-1 text-slate-600">
                    <li>Bersihkan kerak sulfat putih pada kutub terminal aki dengan air panas dan sikat kawat kuningan.</li>
                    <li>Lumasi kutub aki dengan vaselin teknis (*petroleum jelly*) untuk mencegah korosi kontak listrik.</li>
                    <li>Ukur tegangan baterai dalam keadaan *engine off* (standar minimal 25.0 VDC untuk sistem seri 2x12V).</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Box 2: Tingkat Berat (1.000 - 2.000 Jam Operasi) */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="px-6 py-4 bg-purple-50 border-b border-purple-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Gauge className="w-5 h-5 text-purple-700" />
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">
                      Bagian II: Pemeliharaan Rutin Tingkat Berat
                    </h4>
                    <span className="text-[11px] text-purple-700 font-medium">
                      Interval Berkala: Setiap 1.000 - 2.000 Jam Operasi / 1 - 2 Tahun
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 text-[11px] font-bold bg-purple-100 text-purple-800 rounded-md">
                  Level 3 (Major)
                </span>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div className="space-y-1.5 pb-3 border-b border-slate-100">
                  <h5 className="font-bold text-slate-900 flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-purple-600" />
                    <span>1. Kalibrasi Injektor & Boshpump</span>
                  </h5>
                  <ul className="list-disc pl-5 space-y-1 text-slate-600">
                    <li>Pelepasan unit nozzle injector untuk pengujian bentuk kabut semprot (*spray pattern*) dan tekanan buka katup di test bench.</li>
                    <li>Kalibrasi timing injeksi solar dan sinkronisasi pompa bahan bakar tekanan tinggi (*fuel injection pump*).</li>
                    <li>Penggantian cincin tembaga perapat (*copper washer seal*) pada setiap dudukan nozzle silinder head.</li>
                  </ul>
                </div>

                <div className="space-y-1.5 pb-3 border-b border-slate-100">
                  <h5 className="font-bold text-slate-900 flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-rose-600" />
                    <span>2. Penyetelan Celah Katup (Valve Clearance)</span>
                  </h5>
                  <ul className="list-disc pl-5 space-y-1 text-slate-600">
                    <li>Penyetelan celah katup hisap (*intake valve*) dan katup buang (*exhaust valve*) menggunakan *feeler gauge* sesuai manual pabrikan mesin dalam keadaan dingin.</li>
                    <li>Pemeriksaan keausan rocker arm, pushrod, dan pegas katup dari indikasi keretakan atau fatik logam.</li>
                  </ul>
                </div>

                <div className="space-y-1.5 pb-3 border-b border-slate-100">
                  <h5 className="font-bold text-slate-900 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-600" />
                    <span>3. Pengujian Tahanan Isolasi Alternator (Megger Test)</span>
                  </h5>
                  <ul className="list-disc pl-5 space-y-1 text-slate-600">
                    <li>Pengujian isolasi gulungan stator dan rotor ke ground menggunakan insulation tester tegangan 1000V DC.</li>
                    <li>Nilai tahanan isolasi minimal wajib &gt; 5 Megaohm. Jika di bawah batas toleransi, alternator wajib divakum & dipanggang (*varnish baking*).</li>
                    <li>Pemeriksaan kondisi bearing alternator dan penggantian gemuk tahan panas tinggi (*high-temp lithium grease*).</li>
                  </ul>
                </div>

                <div className="space-y-1.5">
                  <h5 className="font-bold text-slate-900 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-emerald-600" />
                    <span>4. Kalibrasi Sensor Proteksi & Flushing Radiator</span>
                  </h5>
                  <ul className="list-disc pl-5 space-y-1 text-slate-600">
                    <li>*Chemical flushing* kerak saluran pendingin mesin radiator dan penggantian 100% cairan coolant baru.</li>
                    <li>Uji simulasi *trip shutdown* sensor otomatis: *Low Oil Pressure* (&lt; 1.5 Bar), *High Water Temp* (&gt; 98°C), dan *Overspeed* (&gt; 1650 RPM).</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Prosedur Uji Beban & Baseline Parameter */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">
                  Bagian III: Verifikasi Pra-Start, Uji Coba Running, dan Uji Beban
                </h4>
                <p className="text-xs text-slate-500">
                  Standar evaluasi keberhasilan pemeliharaan sebelum unit dinyatakan siap siaga (Ready to Operate / Standby)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  1. Pra-Start Checklist
                </span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Semua tool & sisa lap disingkirkan. Terminal baterai dipasang kembali. Breaker beban posisi OFF. Selang radiator tidak menggelembung. APAR 6 Kg standby.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  2. Running Test No-Load (10 Menit)
                </span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Start manual. Pantau tekanan oli wajib naik &gt; 3 bar dalam 10 detik pertama. Cek tegangan alternator 380V - 400V, frekuensi 50.0 - 50.5 Hz, tidak ada kebocoran fluida.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-600" />
                  3. Uji Beban Bertahap (30-60 Menit)
                </span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Beban dimasukkan bertahap (25% → 50% → 75%). Pantau temperatur kerja (stabil di 75°C - 88°C), stabilitas frekuensi di bawah beban, dan tidak ada asap hitam pekat.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-purple-600" />
                  4. Cooling Down & Standby
                </span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Lepas beban, jalankan mesin idle cooling-down selama 5 menit. Matikan unit, kembalikan selector switch controller ke posisi AUTO (AMF/ATS) untuk siaga dinas.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: 11 ATURAN EMAS KESELAMATAN (11 GOLDEN RULES)                     */}
      {/* ========================================================================= */}
      {activeSubTab === 'golden-rules' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                11 Aturan Emas Keselamatan Kerja K3 Genset (Life-Saving Rules)
              </h3>
              <p className="text-xs text-slate-500">
                Prinsip perlindungan jiwa yang bersifat mutlak dan tidak dapat dikompromikan selama pemeliharaan genset.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari aturan K3..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 bg-white w-48 sm:w-60"
                />
              </div>

              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value as any)}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 bg-white font-medium"
              >
                <option value="ALL">Semua Kategori Bahaya</option>
                <option value="K3">Keselamatan Umum K3</option>
                <option value="SEDANG">Tingkat Sedang</option>
                <option value="BERAT">Tingkat Berat</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGoldenRules.map((rule) => {
              const badgeColors: Record<string, string> = {
                red: 'bg-red-50 text-red-700 border-red-200',
                amber: 'bg-amber-50 text-amber-700 border-amber-200',
                blue: 'bg-blue-50 text-blue-700 border-blue-200',
                emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
              };

              return (
                <div
                  key={rule.num}
                  className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-3 hover:border-blue-300 transition-colors flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <span className="w-8 h-8 rounded-lg bg-slate-900 text-white font-mono font-black text-xs flex items-center justify-center shrink-0">
                        {rule.num}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border font-mono ${badgeColors[rule.color] || badgeColors.blue}`}>
                        {rule.category}
                      </span>
                    </div>

                    <h4 className="font-bold text-xs text-slate-900 leading-snug">
                      {rule.title}
                    </h4>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {rule.desc}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-2 text-[11px]">
                    <div className="p-2 bg-red-50/70 rounded-lg border border-red-100/80">
                      <span className="font-bold text-red-800 block text-[10px] uppercase">Potensi Risiko:</span>
                      <span className="text-red-700">{rule.risk}</span>
                    </div>

                    <div className="p-2 bg-emerald-50/70 rounded-lg border border-emerald-100/80">
                      <span className="font-bold text-emerald-800 block text-[10px] uppercase">Tindakan Mitigasi Wajib:</span>
                      <span className="text-emerald-700">{rule.action}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: MATRIKS APD & KATEGORI PEKERJAAN                                 */}
      {/* ========================================================================= */}
      {activeSubTab === 'apd-matrix' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Matriks Standar Alat Pelindung Diri (APD) Wajib
                </h3>
                <p className="text-xs text-slate-500">
                  Ditetapkan berdasarkan Permenakertrans No. PER.08/MEN/VII/2010 tentang Alat Pelindung Diri
                </p>
              </div>
              <span className="px-2.5 py-1 text-[11px] font-bold bg-blue-100 text-blue-800 rounded-md">
                Wajib Digunakan 100%
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4">Alat Pelindung Diri (APD)</th>
                    <th className="py-3 px-4">Standar Mutu Sertifikasi</th>
                    <th className="py-3 px-4">Aktivitas Pemeliharaan Wajib</th>
                    <th className="py-3 px-4">Fungsi Utama Perlindungan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {apdMatrix.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 text-center font-bold text-slate-500">{idx + 1}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{item.item}</td>
                      <td className="py-3.5 px-4 font-mono text-blue-700 font-medium">{item.standar}</td>
                      <td className="py-3.5 px-4 text-slate-700">{item.aktivitas}</td>
                      <td className="py-3.5 px-4 text-slate-600 leading-relaxed">{item.fungsi}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Guidelines on Hazardous Waste (Limbah B3) */}
          <div className="p-6 bg-amber-50/60 rounded-xl border border-amber-200/80 space-y-3">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span>Protokol Pengelolaan Limbah Bahan Berbahaya & Beracun (B3) Genset</span>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              Berdasarkan PP No. 22 Tahun 2021, oli bekas (kode limbah B105d), filter terkontaminasi (B110d), dan majun berminyak (B107d) adalah limbah B3. 
              Dilarang keras membuang pelumas bekas ke saluran selokan atau tanah pekarangan. Wajib menampung oli di drum khusus berwarna biru/kuning dengan label B3, dan menyerahkannya kepada Seksi Fasint untuk diteruskan ke pihak pengolah B3 bersertifikasi resmi Kementerian LHK.
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: PROTOKOL TANGGAP DARURAT K3                                      */}
      {/* ========================================================================= */}
      {activeSubTab === 'emergency-protocol' && (
        <div className="space-y-6">
          <div className="p-4 bg-red-50 rounded-xl border border-red-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-red-950">
                  Rencana Tanggap Darurat Instalasi Genset (Emergency Response Action)
                </h3>
                <p className="text-xs text-red-800">
                  Langkah cepat 60 detik pertama yang wajib dilakukan saat terjadi insiden kritis di ruang genset
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-900 text-xs font-mono font-bold rounded-lg border border-red-300">
                <PhoneCall className="w-3.5 h-3.5 text-red-700" />
                <span>Posko Jaga Denma: Ext. 2101 / 2102</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Scenario 1: Kebakaran */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-3">
              <div className="flex items-center gap-2.5 text-red-600">
                <Flame className="w-5 h-5" />
                <h4 className="font-bold text-sm text-slate-900">Skenario A: Kebakaran di Ruang Genset / Panel</h4>
              </div>
              <ol className="list-decimal pl-5 space-y-1.5 text-xs text-slate-600">
                <li><strong className="text-slate-900">Tekan Emergency Stop:</strong> Matikan mesin genset seketika dengan menekan tombol merah jamur darurat.</li>
                <li><strong className="text-slate-900">Tutup Katup Solar:</strong> Tarik tuas darurat pemutus aliran tangki solar (*emergency fuel shutoff*).</li>
                <li><strong className="text-slate-900">Gunakan APAR yang Tepat:</strong> Ambil APAR CO2 atau Clean Agent. Arahkan nozzle ke pangkal lidah api. <span className="text-red-600 font-bold">DILARANG menyiram air ke panel listrik beraliran arus!</span></li>
                <li><strong className="text-slate-900">Evakuasi & Lapor:</strong> Jika api tidak padam dalam 30 detik, evakuasi seluruh personel dan bunyikan alarm pos jaga.</li>
              </ol>
            </div>

            {/* Scenario 2: Sengatan Listrik */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-3">
              <div className="flex items-center gap-2.5 text-amber-600">
                <Zap className="w-5 h-5" />
                <h4 className="font-bold text-sm text-slate-900">Skenario B: Personel Tersengat Listrik (Electric Shock)</h4>
              </div>
              <ol className="list-decimal pl-5 space-y-1.5 text-xs text-slate-600">
                <li><strong className="text-slate-900">JANGAN SENTUH KORBAN LANGSUNG:</strong> Memegang korban saat arus masih menyengat akan mencelakakan penolong.</li>
                <li><strong className="text-slate-900">Putuskan Breaker Utama:</strong> Segera matikan saklar pemutus utama atau cabut saklar darurat.</li>
                <li><strong className="text-slate-900">Gunakan Tongkat Isolator:</strong> Jika breaker tidak terjangkau, pisahkan korban menggunakan tongkat kayu kering atau bahan karet isolator.</li>
                <li><strong className="text-slate-900">Bantuan Medis Segera:</strong> Cek denyut nadi dan napas. Lakukan CPR bila henti jantung dan panggil tim medis Lanud/Denma.</li>
              </ol>
            </div>

            {/* Scenario 3: Tumpahan Bahan Bakar Skala Besar */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-3">
              <div className="flex items-center gap-2.5 text-blue-600">
                <Droplets className="w-5 h-5" />
                <h4 className="font-bold text-sm text-slate-900">Skenario C: Kebocoran Solar / Oli Skala Besar (&gt; 20 Liter)</h4>
              </div>
              <ol className="list-decimal pl-5 space-y-1.5 text-xs text-slate-600">
                <li><strong className="text-slate-900">Hentikan Sumber Kebocoran:</strong> Tutup manual valve pipa tangki dan hentikan pompa transfer solar (*fuel transfer pump*).</li>
                <li><strong className="text-slate-900">Jauhkan Sumber Panas:</strong> Matikan mesin dan pastikan tidak ada saklar yang dimatikan/dihidupkan yang memicu percikan.</li>
                <li><strong className="text-slate-900">Bendung Tumpahan:</strong> Taburkan pasir, serbuk gergaji, atau bentangkan bantalan penyerap oli (*spill sock/pads*) agar tidak masuk saluran air hujan.</li>
                <li><strong className="text-slate-900">Kumpulkan Limbah:</strong> Sekop serbuk gergaji terkontaminasi dan masukkan ke dalam drum limbah B3 berpenutup rapat.</li>
              </ol>
            </div>

            {/* Scenario 4: Asfiksia Karbon Monoksida */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-3">
              <div className="flex items-center gap-2.5 text-slate-700">
                <Activity className="w-5 h-5" />
                <h4 className="font-bold text-sm text-slate-900">Skenario D: Terjebak Asap Knalpot / Keracunan Gas CO</h4>
              </div>
              <ol className="list-decimal pl-5 space-y-1.5 text-xs text-slate-600">
                <li><strong className="text-slate-900">Gejala Awal:</strong> Kepala pusing mendadak, mual, lemas, dan penglihatan kabur saat berada di dekat knalpot genset.</li>
                <li><strong className="text-slate-900">Evakuasi Terbuka:</strong> Bawa korban segera ke ruang terbuka dengan hembusan angin segar.</li>
                <li><strong className="text-slate-900">Buka Pintu & Blower:</strong> Aktifkan sistem sirkulasi udara paksa ruangan genset hingga asap bersih.</li>
                <li><strong className="text-slate-900">Bantuan Oksigen:</strong> Berikan pertolongan pernapasan tabung oksigen murni di ruang kesehatan.</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 5: RIWAYAT & FORMULIR VERIFIKASI K3                                 */}
      {/* ========================================================================= */}
      {activeSubTab === 'checklist-logs' && (
        <div className="space-y-6">
          {/* Quick Guide Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {checklistItems.slice(0, 4).map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h4 className="font-bold text-xs text-slate-900">{item.title}</h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Historical SOP Records Table with Search & Filter */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <span>Riwayat Verifikasi Kepatuhan SOP & K3</span>
                  <span className="text-[11px] font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {filteredChecklistLogs.length} dari {sopLogs.length} data
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Daftar rekam kepatuhan sebelum dan sesudah intervensi pemeliharaan genset. Anda dapat mengedit atau menghapus data jika terjadi revisi.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                  <input
                    type="text"
                    placeholder="Cari ID / genset / teknisi..."
                    value={checklistSearch}
                    onChange={(e) => setChecklistSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 bg-white w-44 sm:w-56"
                  />
                </div>

                <select
                  value={checklistStatusFilter}
                  onChange={(e) => setChecklistStatusFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 bg-white font-medium"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="Lengkap & Aman">Lengkap & Aman</option>
                  <option value="Belum Lengkap">Belum Lengkap</option>
                </select>

                {canManage && (
                  <button
                    onClick={handleOpenNewModal}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Checklist Baru</span>
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">No / ID</th>
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Unit Genset</th>
                    <th className="py-3 px-4">Teknisi Pengawas</th>
                    <th className="py-3 px-4 text-center">Area</th>
                    <th className="py-3 px-4 text-center">Unit</th>
                    <th className="py-3 px-4 text-center">Fluida</th>
                    <th className="py-3 px-4 text-center">LOTO</th>
                    <th className="py-3 px-4 text-center">JSA</th>
                    <th className="py-3 px-4 text-center">APD</th>
                    <th className="py-3 px-4 text-center">Verifikasi</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Catatan K3</th>
                    <th className="py-3 px-4 text-center w-28">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredChecklistLogs.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="py-8 text-center text-slate-400">
                        Tidak ada catatan verifikasi SOP & K3 yang sesuai kriteria pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredChecklistLogs.map((log, idx) => {
                      const renderCheckIcon = (val: boolean) =>
                        val ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-red-500 mx-auto" />
                        );

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-700">
                            {idx + 1}. <span className="text-[11px] text-slate-500">{log.id}</span>
                          </td>

                          <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{log.tanggal}</span>
                            </div>
                          </td>

                          <td className="py-3 px-4 font-bold text-slate-900">{log.gensetName}</td>

                          <td className="py-3 px-4 text-slate-700">
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              <span>{log.teknisi}</span>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-center">{renderCheckIcon(log.pemeriksaanArea)}</td>
                          <td className="py-3 px-4 text-center">{renderCheckIcon(log.pemeriksaanUnit)}</td>
                          <td className="py-3 px-4 text-center">{renderCheckIcon(log.pemeriksaanFluida)}</td>
                          <td className="py-3 px-4 text-center">{renderCheckIcon(log.loto)}</td>
                          <td className="py-3 px-4 text-center">{renderCheckIcon(log.jsa)}</td>
                          <td className="py-3 px-4 text-center">{renderCheckIcon(log.apd)}</td>
                          <td className="py-3 px-4 text-center">
                            {renderCheckIcon(log.verifikasiSebelumOperasi)}
                          </td>

                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                log.status === 'Lengkap & Aman'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {log.status}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={log.catatan}>
                            {log.catatan || '-'}
                          </td>

                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              {canManage ? (
                                <>
                                  <button
                                    onClick={() => handleOpenEditModal(log)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer border border-blue-200 shadow-2xs"
                                    title="Edit data verifikasi K3"
                                  >
                                    <Pencil className="w-3 h-3" />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    onClick={() => setDeletingRecord(log)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer border border-rose-200 shadow-2xs"
                                    title="Hapus data verifikasi K3"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Hapus</span>
                                  </button>
                                </>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">Lihat saja</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: INPUT / EDIT CHECKLIST K3                                          */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2">
                {editingRecord ? (
                  <FileEdit className="w-5 h-5 text-amber-400" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-blue-400" />
                )}
                <div>
                  <h3 className="font-bold text-base text-slate-100">
                    {editingRecord ? 'Edit & Perbarui Verifikasi K3' : 'Form Verifikasi SOP & Keselamatan K3 Genset'}
                  </h3>
                  {editingRecord && (
                    <span className="text-[11px] text-amber-300 font-mono">
                      ID: {editingRecord.id} ({editingRecord.gensetName})
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingRecord(null);
                }}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Unit Genset:</label>
                  <select
                    value={selectedGensetId}
                    onChange={(e) => setSelectedGensetId(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none bg-white font-medium"
                  >
                    {gensets.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.nama}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tanggal Verifikasi:</label>
                  <input
                    type="date"
                    required
                    value={tanggalInput}
                    onChange={(e) => setTanggalInput(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Teknisi Pengawas:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ketik nama teknisi..."
                    value={teknisiName}
                    onChange={(e) => setTeknisiName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none bg-white"
                  />
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-900 block mb-2 uppercase tracking-wider text-[11px]">
                  Konfirmasi 7 Elemen SOP & K3 (Centang jika sudah diverifikasi):
                </span>
                <div className="space-y-2">
                  {checklistItems.map((item) => (
                    <label
                      key={item.key}
                      className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={checks[item.key]}
                        onChange={(e) =>
                          setChecks({ ...checks, [item.key]: e.target.checked })
                        }
                        className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block">{item.title}</span>
                        <span className="text-slate-600 text-[11px] leading-tight block mt-0.5">
                          {item.desc}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Catatan Khusus K3 / Potensi Bahaya
                </label>
                <textarea
                  rows={2}
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Kondisi cuaca, exhaust pipe, isolasi tegangan, atau perlindungan ekstra..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingRecord(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {editingRecord ? (
                    <>
                      <FileEdit className="w-3.5 h-3.5" />
                      <span>Simpan Perubahan Data</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Simpan Verifikasi K3</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CETAK PROTAP RESMI KEDINASAN                                       */}
      {/* ========================================================================= */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Bar */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-blue-400" />
                <span className="font-bold text-sm">Pratinjau Format Cetak Dokumen Kedinasan (PROTAP K3)</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / Simpan PDF</span>
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Printable Body */}
            <div className="p-8 overflow-y-auto space-y-6 text-slate-900 font-serif leading-relaxed text-xs">
              {/* Kop Surat Resmi */}
              <div className="text-center pb-4 border-b-2 border-slate-900 space-y-1">
                <p className="font-sans font-bold text-xs uppercase tracking-wider text-slate-800">
                  KOMANDO OPERASI UDARA NASIONAL
                </p>
                <p className="font-sans font-bold text-xs uppercase tracking-wider text-slate-800">
                  DETASEMEN MARKAS · FASILITAS DAN INSTALASI
                </p>
                <div className="w-24 h-0.5 bg-slate-900 mx-auto my-1.5" />
                <h2 className="text-sm font-sans font-black tracking-wide uppercase text-slate-900 pt-1">
                  PROSEDUR TETAP (PROTAP)
                </h2>
                <p className="font-sans font-bold text-xs uppercase text-slate-900">
                  PEMELIHARAAN RUTIN GENSET TINGKAT SEDANG SAMPAI BERAT
                </p>
                <p className="font-mono text-[11px] text-slate-600">
                  Nomor: PROTAP / 02 / X / 2026 / FASINT
                </p>
              </div>

              {/* Bab I */}
              <div className="space-y-2">
                <h3 className="font-sans font-bold text-xs uppercase tracking-wide border-b border-slate-300 pb-1">
                  BAB I: KETENTUAN UMUM & KESELAMATAN KERJA (K3)
                </h3>
                <ol className="list-decimal pl-5 space-y-1 text-slate-800">
                  <li>Setiap pekerjaan pemeliharaan genset wajib mendahulukan aspek keselamatan personel, material, dan instalasi (*Safety First*).</li>
                  <li>Prosedur Lockout / Tagout (LOTO) dan pelepasan kabel negatif aki adalah syarat mutlak sebelum melakukan pekerjaan mekanikal atau kelistrikan.</li>
                  <li>Alat Pelindung Diri (APD) helm, sepatu safety berujung baja, sarung tangan khusus, dan kacamata pelindung wajib digunakan sepanjang kegiatan.</li>
                  <li>Bekerja pada unit pembangkit wajib menerapkan *Buddy System* minimal 2 personel teknisi berkualifikasi.</li>
                </ol>
              </div>

              {/* Bab II */}
              <div className="space-y-2">
                <h3 className="font-sans font-bold text-xs uppercase tracking-wide border-b border-slate-300 pb-1">
                  BAB II: TATA CARA PEMELIHARAAN TINGKAT SEDANG (INTERVAL 250 - 500 JAM)
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-slate-800">
                  <li><strong>Sistem Pelumasan:</strong> Pengurasan oli kotor dalam kondisi hangat, penggantian filter oli orisinal, dan pengisian oli baru viskositas SAE 15W-40 CI-4.</li>
                  <li><strong>Sistem Bahan Bakar:</strong> Pembersihan sedimenter water separator, penggantian elemen filter solar primer dan sekunder, serta *bleeding* udara palsu.</li>
                  <li><strong>Sistem Pendingin:</strong> Pemeriksaan coolant, pembersihan kisi radiator dengan kompresor udara terarah, dan pengecekan ketegangan belt kipas.</li>
                  <li><strong>Sistem Starter:</strong> Pembersihan kerak sulfat kutub aki dengan air panas, pelapisan vaselin teknis, dan verifikasi tegangan aki stanby &gt; 25.0 VDC.</li>
                </ul>
              </div>

              {/* Bab III */}
              <div className="space-y-2">
                <h3 className="font-sans font-bold text-xs uppercase tracking-wide border-b border-slate-300 pb-1">
                  BAB III: TATA CARA PEMELIHARAAN TINGKAT BERAT (INTERVAL 1.000 - 2.000 JAM)
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-slate-800">
                  <li><strong>Injeksi Bahan Bakar:</strong> Kalibrasi nozzle injector diesel di test bench dan kalibrasi pompa injeksi bertekanan tinggi (*fuel injection pump*).</li>
                  <li><strong>Mekanikal Kepala Silinder:</strong> Pengukuran dan penyetelan celah katup hisap (*intake*) dan buang (*exhaust*) dengan *feeler gauge*.</li>
                  <li><strong>Insulasi Alternator:</strong> Pengujian tahanan isolasi menggunakan Megger Test 1000V DC dengan batas kelayakan minimal &gt; 5 Megaohm.</li>
                  <li><strong>Proteksi Shutdown:</strong> Pengujian sensor kegagalan darurat (*Low Oil Pressure*, *High Water Temperature*, *Overspeed*).</li>
                </ul>
              </div>

              {/* Bab IV */}
              <div className="space-y-2">
                <h3 className="font-sans font-bold text-xs uppercase tracking-wide border-b border-slate-300 pb-1">
                  BAB IV: PENGELOLAAN LIMBAH B3 & TANGGAP DARURAT
                </h3>
                <p className="text-slate-800">
                  Oli mesin bekas, kain majun terkontaminasi, dan sisa bahan bakar wajib dikumpulkan dalam drum penampungan tertutup bertanda Limbah B3. Bila timbul indikasi kebakaran, segera tekan Emergency Stop, putuskan pasokan solar, dan semprotkan APAR CO2/Clean Agent.
                </p>
              </div>

              {/* Tanda Tangan Pengesahan */}
              <div className="pt-8 grid grid-cols-2 text-center text-xs font-sans">
                <div className="space-y-16">
                  <p>Mengetahui,<br /><span className="font-bold">Kepala Fasilitas & Instalasi</span></p>
                  <div>
                    <p className="font-bold underline">LETTU TEK NURDIN SYAH, S.T.</p>
                    <p className="text-[11px] text-slate-600">NRP 534219</p>
                  </div>
                </div>

                <div className="space-y-16">
                  <p>Ditetapkan di Jakarta,<br /><span className="font-bold">Komandan Detasemen Markas</span></p>
                  <div>
                    <p className="font-bold underline">KOLONEL PNB HENDRA KUSUMA</p>
                    <p className="text-[11px] text-slate-600">NRP 518742</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONFIRMATION DELETE MODAL                                                 */}
      {/* ========================================================================= */}
      <ConfirmDeleteModal
        isOpen={deletingRecord !== null}
        title="Hapus Data Verifikasi SOP & K3"
        itemName={`ID: ${deletingRecord?.id} · Unit: ${deletingRecord?.gensetName}`}
        itemDetails={
          deletingRecord
            ? `Tanggal: ${deletingRecord.tanggal} · Teknisi: ${deletingRecord.teknisi} · Status: ${deletingRecord.status} (${deletingRecord.catatan})`
            : undefined
        }
        onConfirm={() => {
          if (deletingRecord) {
            onDeleteSOP(deletingRecord.id);
            setDeletingRecord(null);
          }
        }}
        onCancel={() => setDeletingRecord(null)}
      />
    </div>
  );
};
