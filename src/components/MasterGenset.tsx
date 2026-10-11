import React, { useState } from 'react';
import { GensetItem, UserSession, ReadinessCondition } from '../types/genset';
import {
  Zap,
  Search,
  Plus,
  Edit3,
  Trash2,
  Image,
  Upload,
  X,
  FileSpreadsheet,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';

interface MasterGensetProps {
  gensets: GensetItem[];
  activeUser: UserSession;
  onSaveGenset: (genset: GensetItem, isNew: boolean) => void;
  onDeleteGenset: (id: string) => void;
  onExportCSV: () => void;
  selectedGensetDetail: GensetItem | null;
  setSelectedGensetDetail: (genset: GensetItem | null) => void;
}

export const MasterGenset: React.FC<MasterGensetProps> = ({
  gensets,
  activeUser,
  onSaveGenset,
  onDeleteGenset,
  onExportCSV,
  selectedGensetDetail,
  setSelectedGensetDetail,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSatuan, setSelectedSatuan] = useState<string>('SEMUA');
  const [selectedKondisi, setSelectedKondisi] = useState<string>('SEMUA');

  // Form Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<GensetItem>>({});

  const canEdit = activeUser.role === 'TEKNISI' || activeUser.role === 'ADMIN2';

  // Filtered List
  const filteredGensets = gensets.filter((g) => {
    const matchSearch =
      g.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.kode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.lokasi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.merk.toLowerCase().includes(searchQuery.toLowerCase());

    const matchSatuan = selectedSatuan === 'SEMUA' || g.satuan === selectedSatuan;
    const matchKondisi = selectedKondisi === 'SEMUA' || g.kondisi === selectedKondisi;

    return matchSearch && matchSatuan && matchKondisi;
  });

  const handleOpenAdd = () => {
    const newId = `GNS-00${gensets.length + 1}`;
    setFormData({
      id: newId,
      kode: `GNS-${Date.now().toString().slice(-4)}`,
      nama: '',
      satuan: 'SATUAN DENMA',
      lokasi: 'Power House',
      merk: 'Perkins',
      model: '',
      serialNumber: '',
      noMesin: '',
      noGenerator: '',
      kapasitas: '150 KVA',
      engine: '',
      alternator: 'STAMFORD',
      tahun: new Date().getFullYear(),
      sistemPendingin: 'Radiator Water-Cooled',
      sistemBahanBakar: 'Direct Injection Diesel',
      tegangan: '380 / 220 V',
      frekuensi: '50 Hz',
      phase: '3 Phase, 4 Wire',
      rpm: 1500,
      jamOperasi: 0,
      kondisi: 'S',
      healthScore: 90,
      riwayatSingkat: '',
      photos: {
        unit: '',
        nameplate: '',
        engine: '',
        panel: '',
      },
    });
    setIsEditing(false);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (g: GensetItem) => {
    setFormData({ ...g });
    setIsEditing(true);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama || !formData.id) return;
    onSaveGenset(formData as GensetItem, !isEditing);
    setIsFormOpen(false);
  };

  const handlePhotoUpload = (
    field: 'unit' | 'nameplate' | 'engine' | 'panel',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          photos: {
            ...prev?.photos,
            [field]: reader.result as string,
          },
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            <span>Data Master Genset</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Database teknis lengkap, spesifikasi kelistrikan, dan riwayat operasional unit
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Ekspor Spreadsheet (CSV)</span>
          </button>

          {canEdit && (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Genset Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kode, nama, merk, lokasi..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Filter Satuan */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="text-[11px] font-medium text-slate-500">Satuan:</span>
            <select
              value={selectedSatuan}
              onChange={(e) => setSelectedSatuan(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-blue-600 font-medium"
            >
              <option value="SEMUA">Semua Unit ({gensets.length})</option>
              <option value="SATUAN DENMA">SATUAN DENMA</option>
            </select>
          </div>

          {/* Filter Kondisi */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="text-[11px] font-medium text-slate-500">Kondisi:</span>
            <select
              value={selectedKondisi}
              onChange={(e) => setSelectedKondisi(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-blue-600 font-medium"
            >
              <option value="SEMUA">Semua Status</option>
              <option value="S">Siap (S)</option>
              <option value="US Ringan">US Ringan</option>
              <option value="US">Tidak Siap (US)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main View: Mobile Cards + Desktop Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Mobile Cards View (Visible on smartphone screens) */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredGensets.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              Tidak ditemukan data genset yang sesuai kriteria pencarian.
            </div>
          ) : (
            filteredGensets.map((g) => (
              <div
                key={g.id}
                onClick={() => setSelectedGensetDetail(g)}
                className="p-4 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 font-bold">
                        {g.kode}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900">{g.nama}</h4>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{g.satuan} · {g.lokasi}</p>
                  </div>
                  <div>
                    {g.kondisi === 'S' && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Siap (S)
                      </span>
                    )}
                    {g.kondisi === 'US Ringan' && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        US Ringan
                      </span>
                    )}
                    {g.kondisi === 'US' && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">
                        US (Rusak)
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Kapasitas:</span>
                    <span className="font-semibold text-slate-800">{g.kapasitas}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Jam Operasi:</span>
                    <span className="font-mono font-semibold text-slate-800">{g.jamOperasi} Jam</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Merk:</span>
                    <span className="text-slate-700 truncate block">{g.merk} ({g.tahun})</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Health Score:</span>
                    <span className={`font-mono font-bold ${
                      g.healthScore >= 80 ? 'text-emerald-700' : g.healthScore >= 60 ? 'text-amber-700' : 'text-red-700'
                    }`}>
                      {g.healthScore}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-blue-600 font-semibold flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" /> Ketuk untuk detail & foto
                  </span>
                  {canEdit && (
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleOpenEdit(g)}
                        className="px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded border border-amber-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDeleteGenset(g.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View (Hidden on mobile) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">No / Kode</th>
                <th className="py-3 px-4">Nama Genset & Satuan</th>
                <th className="py-3 px-4">Lokasi</th>
                <th className="py-3 px-4">Kapasitas & Engine</th>
                <th className="py-3 px-4">Generator & Seri</th>
                <th className="py-3 px-4 text-center">Tahun</th>
                <th className="py-3 px-4 text-right">Jam Operasi</th>
                <th className="py-3 px-4 text-center">Health</th>
                <th className="py-3 px-4 text-center">Kondisi</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGensets.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    Tidak ditemukan data genset yang sesuai kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredGensets.map((g, idx) => {
                  return (
                    <tr
                      key={g.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => setSelectedGensetDetail(g)}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        <div className="text-slate-900">{idx + 1}.</div>
                        <span className="text-[11px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                          {g.kode}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                          {g.nama}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <span className="font-semibold text-slate-600">{g.satuan}</span>
                          <span>·</span>
                          <span>{g.merk}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-700">
                        <span className="font-medium">{g.lokasi}</span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 font-mono tabular-nums">
                          {g.kapasitas}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs" title={g.engine}>
                          {g.engine}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-slate-700">{g.alternator}</div>
                        <div className="text-[11px] font-mono text-slate-500 truncate max-w-[150px]">
                          SN: {g.serialNumber || '-'}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center font-mono tabular-nums text-slate-700">
                        {g.tahun}
                      </td>

                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-800">
                        {g.jamOperasi} Jam
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1 font-mono font-bold">
                          <span
                            className={
                              g.healthScore >= 80
                                ? 'text-emerald-700'
                                : g.healthScore >= 60
                                ? 'text-amber-700'
                                : 'text-red-700'
                            }
                          >
                            {g.healthScore}%
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        {g.kondisi === 'S' && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            S (Siap)
                          </span>
                        )}
                        {g.kondisi === 'US Ringan' && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            US Ringan
                          </span>
                        )}
                        {g.kondisi === 'US' && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">
                            US (Rusak)
                          </span>
                        )}
                      </td>

                      <td
                        className="py-3 px-4 text-right space-x-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => setSelectedGensetDetail(g)}
                          title="Lihat Detail & Foto"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                        {canEdit && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(g)}
                              title="Edit Data Teknis"
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDeleteGenset(g.id)}
                              title="Hapus Unit"
                              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
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

      {/* DETAIL MODAL (Data Teknis Lengkap + 4 Foto Dokumentasi Awal) */}
      {selectedGensetDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-slate-100">
                      {selectedGensetDetail.nama}
                    </h3>
                    <span className="text-[11px] font-mono bg-blue-900 text-blue-200 px-2 py-0.5 rounded">
                      {selectedGensetDetail.kode}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {selectedGensetDetail.satuan} · Lokasi: {selectedGensetDetail.lokasi}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedGensetDetail(null)}
                className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 text-xs">
              {/* Quick Status Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[11px]">Kondisi Kesiapan:</span>
                  <div className="mt-1">
                    {selectedGensetDetail.kondisi === 'S' && (
                      <span className="font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Siap Operasi (S)
                      </span>
                    )}
                    {selectedGensetDetail.kondisi === 'US Ringan' && (
                      <span className="font-bold text-amber-700 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4 text-amber-600" /> US Ringan
                      </span>
                    )}
                    {selectedGensetDetail.kondisi === 'US' && (
                      <span className="font-bold text-red-700 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4 text-red-600" /> US (Tidak Siap)
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px]">Health Score:</span>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="font-mono font-bold text-base text-slate-900 tabular-nums">
                      {selectedGensetDetail.healthScore}%
                    </span>
                    <div className="w-16 bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full ${
                          selectedGensetDetail.healthScore >= 80
                            ? 'bg-emerald-500'
                            : selectedGensetDetail.healthScore >= 60
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${selectedGensetDetail.healthScore}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px]">Jam Kerja (Running Hours):</span>
                  <span className="font-mono font-bold text-base text-slate-900 tabular-nums mt-1 block">
                    {selectedGensetDetail.jamOperasi} Jam
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px]">Tahun Operasional:</span>
                  <span className="font-mono font-bold text-base text-slate-900 tabular-nums mt-1 block">
                    {selectedGensetDetail.tahun}
                  </span>
                </div>
              </div>

              {/* Technical Specifications Matrix (All 20+ fields) */}
              <div>
                <h4 className="font-bold text-sm text-slate-900 mb-3 pb-1 border-b border-slate-200">
                  Spesifikasi Teknis Engine & Generator
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-white">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase">Merk & Model</span>
                    <span className="font-semibold text-slate-800">
                      {selectedGensetDetail.merk} - {selectedGensetDetail.model || '-'}
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase">Kapasitas Daya</span>
                    <span className="font-semibold text-slate-800 font-mono">
                      {selectedGensetDetail.kapasitas}
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase">Engine Type</span>
                    <span className="font-semibold text-slate-800">{selectedGensetDetail.engine}</span>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase">Nomor Mesin (Engine SN)</span>
                    <span className="font-semibold text-slate-800 font-mono">
                      {selectedGensetDetail.noMesin || '-'}
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase">Alternator (Generator)</span>
                    <span className="font-semibold text-slate-800">
                      {selectedGensetDetail.alternator}
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase">Nomor Generator (SN)</span>
                    <span className="font-semibold text-slate-800 font-mono">
                      {selectedGensetDetail.noGenerator || selectedGensetDetail.serialNumber || '-'}
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase">Tegangan Output</span>
                    <span className="font-semibold text-slate-800 font-mono">
                      {selectedGensetDetail.tegangan}
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase">Frekuensi & RPM</span>
                    <span className="font-semibold text-slate-800 font-mono">
                      {selectedGensetDetail.frekuensi} · {selectedGensetDetail.rpm} RPM
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase">Fasa (Phase)</span>
                    <span className="font-semibold text-slate-800">{selectedGensetDetail.phase}</span>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase">Sistem Pendingin</span>
                    <span className="font-semibold text-slate-800">
                      {selectedGensetDetail.sistemPendingin}
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase">Sistem Bahan Bakar</span>
                    <span className="font-semibold text-slate-800">
                      {selectedGensetDetail.sistemBahanBakar}
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase">Pemeriksaan Terakhir</span>
                    <span className="font-semibold text-slate-800 font-mono">
                      {selectedGensetDetail.lastInspected || '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Riwayat Singkat */}
              {selectedGensetDetail.riwayatSingkat && (
                <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200">
                  <span className="font-bold text-blue-900 block mb-1">
                    Catatan Riwayat / Pengadaan / Servis:
                  </span>
                  <p className="text-slate-700 leading-relaxed">
                    {selectedGensetDetail.riwayatSingkat}
                  </p>
                </div>
              )}

              {/* 4 Documentation Photos (Data Awal: Unit genset, Nameplate, Engine, Panel) */}
              <div>
                <h4 className="font-bold text-sm text-slate-900 mb-3 pb-1 border-b border-slate-200 flex items-center justify-between">
                  <span>Dokumentasi Foto Data Awal Unit</span>
                  <span className="text-slate-400 text-xs font-normal">
                    Unit · Nameplate · Engine · Panel
                  </span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Foto 1: Unit Genset */}
                  <div className="space-y-1.5">
                    <span className="font-semibold text-slate-700 block">1. Unit Genset</span>
                    <div className="aspect-4/3 rounded-lg border border-slate-200 bg-slate-100 overflow-hidden flex items-center justify-center relative group">
                      {selectedGensetDetail.photos?.unit ? (
                        <img
                          src={selectedGensetDetail.photos.unit}
                          alt="Unit Genset"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="text-center p-2 text-slate-400">
                          <Image className="w-6 h-6 mx-auto mb-1 opacity-50" />
                          <span className="text-[10px]">Foto Unit Belum Diupload</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Foto 2: Nameplate */}
                  <div className="space-y-1.5">
                    <span className="font-semibold text-slate-700 block">2. Nameplate</span>
                    <div className="aspect-4/3 rounded-lg border border-slate-200 bg-slate-100 overflow-hidden flex items-center justify-center relative">
                      {selectedGensetDetail.photos?.nameplate ? (
                        <img
                          src={selectedGensetDetail.photos.nameplate}
                          alt="Nameplate Genset"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="text-center p-2 text-slate-400">
                          <Image className="w-6 h-6 mx-auto mb-1 opacity-50" />
                          <span className="text-[10px]">Foto Nameplate Belum Diupload</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Foto 3: Engine */}
                  <div className="space-y-1.5">
                    <span className="font-semibold text-slate-700 block">3. Engine Mesin</span>
                    <div className="aspect-4/3 rounded-lg border border-slate-200 bg-slate-100 overflow-hidden flex items-center justify-center relative">
                      {selectedGensetDetail.photos?.engine ? (
                        <img
                          src={selectedGensetDetail.photos.engine}
                          alt="Engine Genset"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="text-center p-2 text-slate-400">
                          <Image className="w-6 h-6 mx-auto mb-1 opacity-50" />
                          <span className="text-[10px]">Foto Engine Belum Diupload</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Foto 4: Panel Kontrol */}
                  <div className="space-y-1.5">
                    <span className="font-semibold text-slate-700 block">4. Panel Kontrol / ATS</span>
                    <div className="aspect-4/3 rounded-lg border border-slate-200 bg-slate-100 overflow-hidden flex items-center justify-center relative">
                      {selectedGensetDetail.photos?.panel ? (
                        <img
                          src={selectedGensetDetail.photos.panel}
                          alt="Panel Kontrol"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="text-center p-2 text-slate-400">
                          <Image className="w-6 h-6 mx-auto mb-1 opacity-50" />
                          <span className="text-[10px]">Foto Panel Belum Diupload</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono">
                ID Database: {selectedGensetDetail.id}
              </span>
              <div className="flex items-center gap-2">
                {canEdit && (
                  <button
                    onClick={() => {
                      const cur = selectedGensetDetail;
                      setSelectedGensetDetail(null);
                      handleOpenEdit(cur);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors cursor-pointer"
                  >
                    Edit Data & Foto Ini
                  </button>
                )}
                <button
                  onClick={() => setSelectedGensetDetail(null)}
                  className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT MODAL FORM */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between sticky top-0 z-10">
              <h3 className="font-bold text-base text-slate-100">
                {isEditing ? 'Edit Data Master Genset' : 'Tambah Unit Genset Baru'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Kode Genset</label>
                  <input
                    type="text"
                    required
                    value={formData.kode || ''}
                    onChange={(e) => setFormData({ ...formData, kode: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nama Genset</label>
                  <input
                    type="text"
                    required
                    value={formData.nama || ''}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Satuan</label>
                  <select
                    value={formData.satuan || 'SATUAN DENMA'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        satuan: e.target.value,
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none bg-white"
                  >
                    <option value="SATUAN DENMA">SATUAN DENMA</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Lokasi</label>
                  <input
                    type="text"
                    required
                    value={formData.lokasi || ''}
                    onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Merk</label>
                  <input
                    type="text"
                    value={formData.merk || ''}
                    onChange={(e) => setFormData({ ...formData, merk: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Model / Type</label>
                  <input
                    type="text"
                    value={formData.model || ''}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Kapasitas (kVA / kW)</label>
                  <input
                    type="text"
                    required
                    value={formData.kapasitas || ''}
                    onChange={(e) => setFormData({ ...formData, kapasitas: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nomor Mesin</label>
                  <input
                    type="text"
                    value={formData.noMesin || ''}
                    onChange={(e) => setFormData({ ...formData, noMesin: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nomor Generator</label>
                  <input
                    type="text"
                    value={formData.noGenerator || ''}
                    onChange={(e) => setFormData({ ...formData, noGenerator: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tahun Unit</label>
                  <input
                    type="number"
                    value={formData.tahun || 2024}
                    onChange={(e) => setFormData({ ...formData, tahun: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Jam Operasi (Hour)</label>
                  <input
                    type="number"
                    value={formData.jamOperasi || 0}
                    onChange={(e) =>
                      setFormData({ ...formData, jamOperasi: Number(e.target.value) })
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Status Kesiapan</label>
                  <select
                    value={formData.kondisi || 'S'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        kondisi: e.target.value as ReadinessCondition,
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none bg-white"
                  >
                    <option value="S">Siap (S)</option>
                    <option value="US Ringan">US Ringan</option>
                    <option value="US">Tidak Siap (US)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Health Score (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.healthScore || 85}
                    onChange={(e) =>
                      setFormData({ ...formData, healthScore: Number(e.target.value) })
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Riwayat Singkat</label>
                <textarea
                  rows={2}
                  value={formData.riwayatSingkat || ''}
                  onChange={(e) => setFormData({ ...formData, riwayatSingkat: e.target.value })}
                  placeholder="Contoh: Perbaikan modul kontrol, penggantian dioda stator..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
                />
              </div>

              {/* Photo Upload Sections */}
              <div className="pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-900 block mb-2">
                  Upload Foto Dokumentasi Data Awal:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(['unit', 'nameplate', 'engine', 'panel'] as const).map((key) => (
                    <div key={key} className="space-y-1">
                      <span className="capitalize font-semibold text-slate-600 block">
                        Foto {key}
                      </span>
                      <div className="border border-dashed border-slate-300 rounded-lg p-2 text-center bg-slate-50 relative">
                        {formData.photos?.[key] ? (
                          <div className="aspect-4/3 rounded overflow-hidden mb-1 relative">
                            <img
                              src={formData.photos[key]}
                              alt={key}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  photos: { ...prev?.photos, [key]: '' },
                                }))
                              }
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
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  {isEditing ? 'Simpan Perubahan' : 'Tambahkan Genset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
