import React, { useState } from 'react';
import {
  GensetItem,
  MaintenanceRecord,
  MaintenanceFrequency,
  MaintenanceCategory,
  UserSession,
} from '../types/genset';
import {
  Wrench,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Calendar,
  User,
  Upload,
  X,
  DollarSign,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface PerawatanGensetProps {
  maintenances: MaintenanceRecord[];
  gensets: GensetItem[];
  activeUser: UserSession;
  onSaveMaintenance: (record: MaintenanceRecord) => void;
  onApproveMaintenance: (id: string, notes: string) => void;
  onRejectMaintenance: (id: string, notes: string) => void;
  isNewModalOpen: boolean;
  setIsNewModalOpen: (open: boolean) => void;
}

export const PerawatanGenset: React.FC<PerawatanGensetProps> = ({
  maintenances,
  gensets,
  activeUser,
  onSaveMaintenance,
  onApproveMaintenance,
  onRejectMaintenance,
  isNewModalOpen,
  setIsNewModalOpen,
}) => {
  const [selectedGensetId, setSelectedGensetId] = useState<string>('SEMUA');
  const [selectedFrequency, setSelectedFrequency] = useState<string>('SEMUA');
  const [selectedCategory, setSelectedCategory] = useState<string>('SEMUA');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDetail, setSelectedDetail] = useState<MaintenanceRecord | null>(null);

  // Review modal state for Kadislog
  const [reviewNotes, setReviewNotes] = useState('');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [recordToReview, setRecordToReview] = useState<MaintenanceRecord | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<MaintenanceRecord>>({
    frekuensi: 'Bulanan',
    kategori: 'Ringan',
    biaya: 0,
    fotoSebelum: '',
    fotoProses: '',
    fotoSesudah: '',
  });

  const canInput = activeUser.role === 'TEKNISI' || activeUser.role === 'ADMIN2';
  const isKadislog = activeUser.role === 'KADISLOG';

  const filteredMaintenances = maintenances.filter((m) => {
    const matchGenset = selectedGensetId === 'SEMUA' || m.gensetId === selectedGensetId;
    const matchFreq = selectedFrequency === 'SEMUA' || m.frekuensi === selectedFrequency;
    const matchCat = selectedCategory === 'SEMUA' || m.kategori === selectedCategory;
    const matchSearch =
      m.nomorPekerjaan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.komponen.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.teknisi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.gensetName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchGenset && matchFreq && matchCat && matchSearch;
  });

  const handleOpenAdd = () => {
    const defaultG = gensets[0];
    setFormData({
      id: `MNT-${Date.now().toString().slice(-6)}`,
      nomorPekerjaan: `SPK-GMM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      gensetId: defaultG?.id || '',
      gensetName: defaultG?.nama || '',
      tanggal: new Date().toISOString().slice(0, 10),
      teknisi: activeUser.name,
      frekuensi: 'Bulanan',
      kategori: 'Ringan',
      komponen: '',
      sparepart: '',
      biaya: 0,
      hasilPekerjaan: '',
      fotoSebelum: '',
      fotoProses: '',
      fotoSesudah: '',
      approvalStatus: 'Menunggu Review',
    });
    setIsNewModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.gensetId || !formData.komponen) return;

    const g = gensets.find((item) => item.id === formData.gensetId) || gensets[0];
    const newRecord: MaintenanceRecord = {
      ...(formData as MaintenanceRecord),
      gensetName: g.nama,
    };

    onSaveMaintenance(newRecord);
    setIsNewModalOpen(false);
  };

  const handlePhotoUpload = (
    field: 'fotoSebelum' | 'fotoProses' | 'fotoSesudah',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          [field]: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenReview = (rec: MaintenanceRecord) => {
    setRecordToReview(rec);
    setReviewNotes('');
    setIsReviewModalOpen(true);
  };

  const handleConfirmApproval = (approved: boolean) => {
    if (!recordToReview) return;
    if (approved) {
      onApproveMaintenance(recordToReview.id, reviewNotes);
    } else {
      onRejectMaintenance(recordToReview.id, reviewNotes);
    }
    setIsReviewModalOpen(false);
    if (selectedDetail && selectedDetail.id === recordToReview.id) {
      setSelectedDetail({
        ...selectedDetail,
        approvalStatus: approved ? 'Disetujui' : 'Ditolak',
        catatanKadislog: reviewNotes,
        kadislogName: activeUser.name,
        tanggalApproval: new Date().toISOString().replace('T', ' ').slice(0, 16),
      });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Wrench className="w-5 h-5 text-blue-600" />
            <span>Perawatan Genset (CMMS)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manajemen perawatan Harian/Mingguan/Bulanan/Tahunan, log suku cadang, dan approval Kadislog
          </p>
        </div>

        {canInput && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Perawatan Baru (SPK)</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari SPK, komponen, teknisi..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Unit Filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-[11px] font-medium text-slate-500">Unit:</span>
            <select
              value={selectedGensetId}
              onChange={(e) => setSelectedGensetId(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-blue-600"
            >
              <option value="SEMUA">Semua Unit</option>
              {gensets.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nama}
                </option>
              ))}
            </select>
          </div>

          {/* Frekuensi Filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-[11px] font-medium text-slate-500">Periode:</span>
            <select
              value={selectedFrequency}
              onChange={(e) => setSelectedFrequency(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-blue-600"
            >
              <option value="SEMUA">Semua Periode</option>
              <option value="Harian">Harian</option>
              <option value="Mingguan">Mingguan</option>
              <option value="Bulanan">Bulanan</option>
              <option value="Tahunan">Tahunan</option>
            </select>
          </div>

          {/* Kategori Filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-[11px] font-medium text-slate-500">Kategori:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-blue-600"
            >
              <option value="SEMUA">Semua Kategori</option>
              <option value="Ringan">Ringan</option>
              <option value="Sedang">Sedang</option>
              <option value="Berat">Berat</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table of Maintenance Records: Mobile Cards + Desktop Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Mobile View for Phones */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredMaintenances.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              Belum ada riwayat data perawatan sesuai filter.
            </div>
          ) : (
            filteredMaintenances.map((m) => (
              <div
                key={m.id}
                onClick={() => setSelectedDetail(m)}
                className="p-4 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 font-bold">
                      {m.nomorPekerjaan}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 mt-1">{m.gensetName}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{m.tanggal} · Teknisi: {m.teknisi}</p>
                  </div>
                  <div>
                    {m.approvalStatus === 'Disetujui' && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Disetujui
                      </span>
                    )}
                    {m.approvalStatus === 'Menunggu Review' && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        Menunggu Review
                      </span>
                    )}
                    {m.approvalStatus === 'Ditolak' && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">
                        Ditolak
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Kategori & Periode:</span>
                    <span className="font-semibold text-slate-800">{m.kategori} ({m.frekuensi})</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Komponen:</span>
                    <span className="font-medium text-slate-800 truncate max-w-[180px]">{m.komponen}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200/60 pt-1">
                    <span className="text-slate-500">Estimasi Biaya:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {m.biaya > 0 ? `Rp ${m.biaya.toLocaleString('id-ID')}` : 'Rutin (Rp 0)'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-blue-600 font-semibold">
                    Ketuk untuk detail SPK & foto
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDetail(m);
                    }}
                    className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                  >
                    Rincian SPK
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">No. SPK</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Genset</th>
                <th className="py-3 px-4">Kategori & Periode</th>
                <th className="py-3 px-4">Komponen & Suku Cadang</th>
                <th className="py-3 px-4">Teknisi Pelaksana</th>
                <th className="py-3 px-4 text-right">Biaya (Rp)</th>
                <th className="py-3 px-4 text-center">Status Approval</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMaintenances.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    Belum ada riwayat data perawatan sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredMaintenances.map((m) => {
                  return (
                    <tr
                      key={m.id}
                      onClick={() => setSelectedDetail(m)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">
                        {m.nomorPekerjaan}
                      </td>

                      <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{m.tanggal}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                          {m.gensetName}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              m.kategori === 'Berat'
                                ? 'bg-red-100 text-red-800'
                                : m.kategori === 'Sedang'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {m.kategori}
                          </span>
                          <span className="text-slate-500 text-[11px]">({m.frekuensi})</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-slate-800 truncate" title={m.komponen}>
                          {m.komponen}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate" title={m.sparepart}>
                          {m.sparepart || '-'}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{m.teknisi}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-800">
                        Rp {m.biaya.toLocaleString('id-ID')}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {m.approvalStatus === 'Disetujui' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Disetujui
                          </span>
                        )}
                        {m.approvalStatus === 'Menunggu Review' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" /> Menunggu Review
                          </span>
                        )}
                        {m.approvalStatus === 'Ditolak' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">
                            <XCircle className="w-3 h-3 text-red-600" /> Ditolak
                          </span>
                        )}
                      </td>

                      <td
                        className="py-3 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isKadislog && m.approvalStatus === 'Menunggu Review' ? (
                          <button
                            onClick={() => handleOpenReview(m)}
                            className="px-2.5 py-1 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-md transition-colors cursor-pointer"
                          >
                            Review SPK
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedDetail(m)}
                            className="px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 rounded transition-colors"
                          >
                            Detail
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL (With Photos Sebelum, Proses, Sesudah) */}
      {selectedDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between sticky top-0 z-10">
              <div>
                <h3 className="font-bold text-base text-slate-100">
                  Rincian SPK: {selectedDetail.nomorPekerjaan}
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedDetail.gensetName} · Tanggal: {selectedDetail.tanggal}
                </p>
              </div>
              <button
                onClick={() => setSelectedDetail(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              {/* Approval status banner */}
              <div
                className={`p-3.5 rounded-lg border flex items-center justify-between ${
                  selectedDetail.approvalStatus === 'Disetujui'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : selectedDetail.approvalStatus === 'Menunggu Review'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-red-50 border-red-200 text-red-900'
                }`}
              >
                <div>
                  <span className="font-bold text-sm block">
                    Status: {selectedDetail.approvalStatus}
                  </span>
                  {selectedDetail.kadislogName && (
                    <span className="text-[11px] block mt-0.5">
                      Direview oleh: {selectedDetail.kadislogName} ({selectedDetail.tanggalApproval})
                    </span>
                  )}
                  {selectedDetail.catatanKadislog && (
                    <p className="text-xs mt-1 font-medium italic">
                      Catatan Kadislog: "{selectedDetail.catatanKadislog}"
                    </p>
                  )}
                </div>

                {isKadislog && selectedDetail.approvalStatus === 'Menunggu Review' && (
                  <button
                    onClick={() => {
                      const rec = selectedDetail;
                      setSelectedDetail(null);
                      handleOpenReview(rec);
                    }}
                    className="px-3.5 py-1.5 text-xs font-semibold bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                  >
                    Buka Review Otoritas
                  </button>
                )}
              </div>

              {/* Work information */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Frekuensi & Kategori</span>
                  <span className="font-semibold text-slate-800">
                    {selectedDetail.frekuensi} · Kategori {selectedDetail.kategori}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Teknisi Pelaksana</span>
                  <span className="font-semibold text-slate-800">{selectedDetail.teknisi}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Biaya Pekerjaan</span>
                  <span className="font-semibold text-slate-800 font-mono">
                    Rp {selectedDetail.biaya.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1">Komponen Yang Dikerjakan:</h4>
                <p className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-slate-800 font-medium">
                  {selectedDetail.komponen}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1">Suku Cadang / Sparepart:</h4>
                <p className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-slate-800">
                  {selectedDetail.sparepart || 'Tidak ada penggantian sparepart.'}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1">Hasil Akhir Pekerjaan:</h4>
                <p className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-slate-800 leading-relaxed">
                  {selectedDetail.hasilPekerjaan}
                </p>
              </div>

              {/* 3 Photos Required: Sebelum, Proses, Sesudah */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2 uppercase tracking-wider text-[11px] flex items-center justify-between">
                  <span>Dokumentasi Foto Pekerjaan (CMMS)</span>
                  <span className="text-slate-400 text-xs font-normal">
                    Wajib: Sebelum · Proses · Sesudah
                  </span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Foto Sebelum */}
                  <div className="space-y-1">
                    <span className="font-semibold text-slate-700 block">1. Foto Sebelum (Kondisi Awal)</span>
                    <div className="aspect-4/3 rounded-lg border border-slate-200 bg-slate-100 overflow-hidden flex items-center justify-center">
                      {selectedDetail.fotoSebelum ? (
                        <img
                          src={selectedDetail.fotoSebelum}
                          alt="Foto Sebelum"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-slate-400 text-[10px]">Tidak ada foto</span>
                      )}
                    </div>
                  </div>

                  {/* Foto Proses */}
                  <div className="space-y-1">
                    <span className="font-semibold text-slate-700 block">2. Foto Proses Pengerjaan</span>
                    <div className="aspect-4/3 rounded-lg border border-slate-200 bg-slate-100 overflow-hidden flex items-center justify-center">
                      {selectedDetail.fotoProses ? (
                        <img
                          src={selectedDetail.fotoProses}
                          alt="Foto Proses"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-slate-400 text-[10px]">Tidak ada foto</span>
                      )}
                    </div>
                  </div>

                  {/* Foto Sesudah */}
                  <div className="space-y-1">
                    <span className="font-semibold text-slate-700 block">3. Foto Sesudah (Hasil Akhir)</span>
                    <div className="aspect-4/3 rounded-lg border border-slate-200 bg-slate-100 overflow-hidden flex items-center justify-center">
                      {selectedDetail.fotoSesudah ? (
                        <img
                          src={selectedDetail.fotoSesudah}
                          alt="Foto Sesudah"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-slate-400 text-[10px]">Tidak ada foto</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedDetail(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW MAINTENANCE MODAL */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between sticky top-0 z-10">
              <h3 className="font-bold text-base text-slate-100">
                Form Input Perawatan Genset (CMMS)
              </h3>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nomor SPK / Pekerjaan</label>
                  <input
                    type="text"
                    required
                    value={formData.nomorPekerjaan || ''}
                    onChange={(e) => setFormData({ ...formData, nomorPekerjaan: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Pilih Unit Genset</label>
                  <select
                    value={formData.gensetId || ''}
                    onChange={(e) => setFormData({ ...formData, gensetId: e.target.value })}
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
                  <label className="font-semibold text-slate-700 block mb-1">Tanggal Pelaksanaan</label>
                  <input
                    type="date"
                    required
                    value={formData.tanggal || ''}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Frekuensi Perawatan</label>
                  <select
                    value={formData.frekuensi || 'Bulanan'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        frekuensi: e.target.value as MaintenanceFrequency,
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none bg-white font-medium"
                  >
                    <option value="Harian">Harian</option>
                    <option value="Mingguan">Mingguan</option>
                    <option value="Bulanan">Bulanan</option>
                    <option value="Tahunan">Tahunan</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Kategori Pekerjaan</label>
                  <select
                    value={formData.kategori || 'Ringan'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        kategori: e.target.value as MaintenanceCategory,
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none bg-white font-medium"
                  >
                    <option value="Ringan">Ringan</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Berat">Berat</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Biaya Suku Cadang (Rp)</label>
                  <input
                    type="number"
                    value={formData.biaya || 0}
                    onChange={(e) => setFormData({ ...formData, biaya: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Teknisi Pelaksana (Isi Manual)</label>
                <input
                  type="text"
                  required
                  placeholder="Ketik nama teknisi pelaksana..."
                  value={formData.teknisi || ''}
                  onChange={(e) => setFormData({ ...formData, teknisi: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Komponen Yang Diperbaiki / Dirawat</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Modul AVR, Radiator, Alternator Dioda, Filter Oli..."
                  value={formData.komponen || ''}
                  onChange={(e) => setFormData({ ...formData, komponen: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Suku Cadang / Sparepart Diganti</label>
                <input
                  type="text"
                  placeholder="Contoh: Filter Oli Perkins 2654403, Rotating Diode Kit Stamford HCI..."
                  value={formData.sparepart || ''}
                  onChange={(e) => setFormData({ ...formData, sparepart: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Hasil Pekerjaan & Uji Fungsi</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Deskripsikan hasil uji running, voltase, dan kepatuhan prosedur..."
                  value={formData.hasilPekerjaan || ''}
                  onChange={(e) => setFormData({ ...formData, hasilPekerjaan: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
                />
              </div>

              {/* 3 Photo Upload slots */}
              <div className="pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-900 block mb-2">
                  Upload Foto Bukti Perawatan:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(['fotoSebelum', 'fotoProses', 'fotoSesudah'] as const).map((key, idx) => {
                    const label = ['Sebelum', 'Proses', 'Sesudah'][idx];
                    return (
                      <div key={key} className="space-y-1">
                        <span className="font-semibold text-slate-700 block">Foto {label}</span>
                        <div className="border border-dashed border-slate-300 rounded-lg p-2 text-center bg-slate-50">
                          {formData[key] ? (
                            <div className="aspect-4/3 rounded overflow-hidden relative">
                              <img
                                src={formData[key]}
                                alt={label}
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, [key]: '' })}
                                className="absolute top-1 right-1 bg-red-600 text-white rounded p-0.5 text-[10px]"
                              >
                                Hapus
                              </button>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center aspect-4/3 cursor-pointer">
                              <Upload className="w-5 h-5 text-slate-400 mb-1" />
                              <span className="text-[10px] text-blue-600 font-semibold">Pilih Foto</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handlePhotoUpload(key, e)}
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  Kirim ke Kadislog (Submit)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KADISLOG REVIEW MODAL */}
      {isReviewModalOpen && recordToReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-slate-100">Evaluasi Otoritas Kadislog</h3>
              </div>
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900">{recordToReview.gensetName}</div>
                <div className="text-slate-600">SPK: {recordToReview.nomorPekerjaan}</div>
                <div className="text-slate-600">Teknisi: {recordToReview.teknisi}</div>
                <div className="text-slate-600 font-mono">
                  Biaya: Rp {recordToReview.biaya.toLocaleString('id-ID')}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Catatan Evaluasi / Instruksi Kadislog:
                </label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Tuliskan catatan persetujuan atau alasan revisi/penolakan..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => handleConfirmApproval(false)}
                  className="px-4 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-300 rounded-lg transition-colors cursor-pointer"
                >
                  Tolak (Reject)
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmApproval(true)}
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  Setujui (Approve)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
