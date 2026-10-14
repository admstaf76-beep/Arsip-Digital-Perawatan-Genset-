import React, { useState } from 'react';
import { GensetItem, IncidentRecord, UserSession } from '../types/genset';
import {
  AlertTriangle,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Wrench,
  Camera,
  Upload,
  X,
  FileText,
  Calendar,
  User,
  Zap,
  Edit3,
  Trash2,
} from 'lucide-react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface KerusakanPerbaikanProps {
  incidents: IncidentRecord[];
  gensets: GensetItem[];
  activeUser: UserSession;
  onSaveIncident: (incident: IncidentRecord, isNew?: boolean) => void;
  onDeleteIncident: (id: string) => void;
  onUpdateStatus: (id: string, newStatus: 'Open' | 'Dalam Penanganan' | 'Selesai') => void;
  isNewModalOpen: boolean;
  setIsNewModalOpen: (open: boolean) => void;
}

export const KerusakanPerbaikan: React.FC<KerusakanPerbaikanProps> = ({
  incidents,
  gensets,
  activeUser,
  onSaveIncident,
  onDeleteIncident,
  onUpdateStatus,
  isNewModalOpen,
  setIsNewModalOpen,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('SEMUA');
  const [selectedDetail, setSelectedDetail] = useState<IncidentRecord | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<IncidentRecord>>({
    status: 'Dalam Penanganan',
    pelapor: activeUser.name,
  });

  const canInput = activeUser.role === 'TEKNISI' || activeUser.role === 'ADMIN2';

  const filteredIncidents = incidents.filter((inc) => {
    const matchStatus = selectedStatus === 'SEMUA' || inc.status === selectedStatus;
    const matchSearch =
      inc.nomorLaporan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.gensetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.gejala.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.penyebab.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const [editingIncidentId, setEditingIncidentId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IncidentRecord | null>(null);

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      onDeleteIncident(deleteTarget.id);
      if (selectedDetail?.id === deleteTarget.id) {
        setSelectedDetail(null);
      }
      setDeleteTarget(null);
    }
  };

  const handleOpenAdd = () => {
    setEditingIncidentId(null);
    const defaultG = gensets[0];
    setFormData({
      id: `INC-${Date.now().toString().slice(-6)}`,
      nomorLaporan: `LKP-GMM-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      tanggal: new Date().toISOString().slice(0, 10),
      gensetId: defaultG?.id || '',
      gensetName: defaultG?.nama || '',
      kronologi: '',
      gejala: '',
      penyebab: '',
      dampak: '',
      tindakanPerbaikan: '',
      sparepart: '',
      hasilPengujian: '',
      status: 'Open',
      pelapor: activeUser.name,
      fotoKerusakan: '',
      fotoAlarm: '',
      fotoLapangan: '',
      fotoPerbaikan: '',
    });
    setIsNewModalOpen(true);
  };

  const handleOpenEdit = (inc: IncidentRecord) => {
    setEditingIncidentId(inc.id);
    setFormData({ ...inc });
    setIsNewModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.gensetId || !formData.gejala) return;

    const g = gensets.find((item) => item.id === formData.gensetId) || gensets[0];
    const isEditing = Boolean(editingIncidentId);

    const recordData: IncidentRecord = {
      ...(formData as IncidentRecord),
      id: editingIncidentId || formData.id || `INC-${Date.now().toString().slice(-6)}`,
      gensetName: g.nama,
    };

    onSaveIncident(recordData, !isEditing);
    setIsNewModalOpen(false);
    setEditingIncidentId(null);
  };

  const handlePhotoUpload = (
    field: 'fotoKerusakan' | 'fotoAlarm' | 'fotoLapangan' | 'fotoPerbaikan',
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

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span>Riwayat Kerusakan & Berita Acara Perbaikan</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencatatan nomor laporan, kronologi, gejala, penyebab, dampak, suku cadang, dan hasil pengujian
          </p>
        </div>

        {canInput && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Input Laporan Kerusakan Baru</span>
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
            placeholder="Cari nomor laporan, gejala, genset..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-medium text-slate-500">Status Penanganan:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-blue-600 font-medium"
          >
            <option value="SEMUA">Semua Status</option>
            <option value="Open">Open (Baru)</option>
            <option value="Dalam Penanganan">Dalam Penanganan</option>
            <option value="Selesai">Selesai (Fixed)</option>
          </select>
        </div>
      </div>

      {/* Incidents Table */}
      {/* Incidents View: Mobile Cards + Desktop Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Mobile View for Phones */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredIncidents.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              Tidak ada laporan gangguan atau perbaikan yang sesuai.
            </div>
          ) : (
            filteredIncidents.map((inc, idx) => (
              <div
                key={inc.id}
                onClick={() => setSelectedDetail(inc)}
                className="p-4 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-bold">
                        No. {idx + 1}
                      </span>
                      <span className="font-mono text-[10px] text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200 font-bold">
                        {inc.nomorLaporan}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 mt-1">{inc.gensetName}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{inc.tanggal} · Pelapor: {inc.pelapor}</p>
                  </div>
                  <div>
                    {inc.status === 'Open' && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">
                        Open
                      </span>
                    )}
                    {inc.status === 'Dalam Penanganan' && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        Dalam Penanganan
                      </span>
                    )}
                    {inc.status === 'Selesai' && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Selesai
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 text-xs space-y-1">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Gejala Gangguan:</span>
                    <p className="text-slate-800 font-medium line-clamp-2">{inc.gejala}</p>
                  </div>
                  {inc.tindakanPerbaikan && (
                    <div className="pt-1 border-t border-slate-200/50">
                      <span className="text-[10px] text-slate-400 block">Tindakan Perbaikan:</span>
                      <p className="text-slate-700 line-clamp-2">{inc.tindakanPerbaikan}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                  <span className="text-[11px] text-blue-600 font-semibold">
                    Ketuk untuk berita acara
                  </span>
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setSelectedDetail(inc)}
                      className="px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                    >
                      Rincian
                    </button>
                    {canInput && (
                      <button
                        onClick={() => handleOpenEdit(inc)}
                        className="p-1.5 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors"
                        title="Edit Laporan Kerusakan"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {(activeUser.role === 'ADMIN1' || activeUser.role === 'ADMIN2' || activeUser.role === 'TEKNISI') && (
                      <button
                        onClick={() => setDeleteTarget(inc)}
                        className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
                        title="Hapus Laporan Gangguan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
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
                <th className="py-3 px-3 text-center w-12 font-bold">No.</th>
                <th className="py-3 px-4">No. Laporan</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Unit Genset</th>
                <th className="py-3 px-4">Gejala & Dampak</th>
                <th className="py-3 px-4">Penyebab Kerusakan</th>
                <th className="py-3 px-4">Tindakan Perbaikan</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    Tidak ada laporan gangguan atau perbaikan yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((inc, idx) => {
                  return (
                    <tr
                      key={inc.id}
                      onClick={() => setSelectedDetail(inc)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">
                        {idx + 1}
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-red-700">
                        {inc.nomorLaporan}
                      </td>

                      <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{inc.tanggal}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                        {inc.gensetName}
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-slate-800 truncate" title={inc.gejala}>
                          {inc.gejala}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate" title={inc.dampak}>
                          Dampak: {inc.dampak}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-700 max-w-xs truncate" title={inc.penyebab}>
                        {inc.penyebab}
                      </td>

                      <td className="py-3 px-4 text-slate-700 max-w-xs truncate" title={inc.tindakanPerbaikan}>
                        {inc.tindakanPerbaikan}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {inc.status === 'Open' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">
                            Open
                          </span>
                        )}
                        {inc.status === 'Dalam Penanganan' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            Dalam Penanganan
                          </span>
                        )}
                        {inc.status === 'Selesai' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Selesai
                          </span>
                        )}
                      </td>

                      <td
                        className="py-3 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedDetail(inc)}
                            className="px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 rounded transition-colors"
                          >
                            Detail
                          </button>
                          {canInput && (
                            <button
                              onClick={() => handleOpenEdit(inc)}
                              className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded transition-colors"
                              title="Edit Laporan Kerusakan"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {(activeUser.role === 'ADMIN1' || activeUser.role === 'ADMIN2' || activeUser.role === 'TEKNISI') && (
                            <button
                              onClick={() => setDeleteTarget(inc)}
                              className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded transition-colors"
                              title="Hapus Laporan Gangguan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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

      {/* DETAIL MODAL (Kronologi, Gejala, Penyebab, Dampak, Sparepart, Pengujian + Foto) */}
      {selectedDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between sticky top-0 z-10">
              <div>
                <h3 className="font-bold text-base text-slate-100">
                  Laporan Kerusakan & Berita Acara: {selectedDetail.nomorLaporan}
                </h3>
                <p className="text-xs text-slate-400">
                  Unit: {selectedDetail.gensetName} · Tanggal: {selectedDetail.tanggal} · Pelapor:{' '}
                  {selectedDetail.pelapor}
                </p>
              </div>
              <button
                onClick={() => setSelectedDetail(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Status and Action bar */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700">Status Saat Ini:</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      selectedDetail.status === 'Selesai'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedDetail.status === 'Dalam Penanganan'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {selectedDetail.status}
                  </span>
                </div>

                {canInput && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-500">Ubah Status:</span>
                    <select
                      value={selectedDetail.status}
                      onChange={(e) => {
                        const newSt = e.target.value as 'Open' | 'Dalam Penanganan' | 'Selesai';
                        onUpdateStatus(selectedDetail.id, newSt);
                        setSelectedDetail({ ...selectedDetail, status: newSt });
                      }}
                      className="px-2 py-1 text-xs rounded border border-slate-300 bg-white"
                    >
                      <option value="Open">Open</option>
                      <option value="Dalam Penanganan">Dalam Penanganan</option>
                      <option value="Selesai">Selesai (Fixed)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Data fields from prompt */}
              <div className="space-y-3">
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">1. Kronologi Kejadian:</h4>
                  <p className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-slate-800 leading-relaxed">
                    {selectedDetail.kronologi || '-'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">2. Gejala Terindikasi:</h4>
                    <p className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-slate-800 leading-relaxed">
                      {selectedDetail.gejala}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">3. Penyebab Kerusakan:</h4>
                    <p className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-slate-800 leading-relaxed">
                      {selectedDetail.penyebab}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 mb-1">4. Dampak Operasional:</h4>
                  <p className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-slate-800 leading-relaxed">
                    {selectedDetail.dampak}
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 mb-1">5. Tindakan Perbaikan:</h4>
                  <p className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-slate-800 leading-relaxed">
                    {selectedDetail.tindakanPerbaikan}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">6. Sparepart Diganti:</h4>
                    <p className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-slate-800">
                      {selectedDetail.sparepart || '-'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">7. Hasil Pengujian Akhir:</h4>
                    <p className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-slate-800">
                      {selectedDetail.hasilPengujian || 'Menunggu pengetesan.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Photo Documentation Section */}
              <div className="pt-2 border-t border-slate-200">
                <h4 className="font-bold text-slate-900 mb-2 uppercase tracking-wider text-[11px]">
                  Dokumentasi Foto Kerusakan & Perbaikan
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <span className="font-semibold text-slate-600 block">Komponen Rusak</span>
                    <div className="aspect-4/3 rounded border border-slate-200 bg-slate-100 overflow-hidden flex items-center justify-center">
                      {selectedDetail.fotoKerusakan ? (
                        <img
                          src={selectedDetail.fotoKerusakan}
                          alt="Komponen Rusak"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-slate-400 text-[10px]">Nihil Foto</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="font-semibold text-slate-600 block">Alarm Panel</span>
                    <div className="aspect-4/3 rounded border border-slate-200 bg-slate-100 overflow-hidden flex items-center justify-center">
                      {selectedDetail.fotoAlarm ? (
                        <img
                          src={selectedDetail.fotoAlarm}
                          alt="Alarm Panel"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-slate-400 text-[10px]">Nihil Foto</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="font-semibold text-slate-600 block">Kondisi Lapangan</span>
                    <div className="aspect-4/3 rounded border border-slate-200 bg-slate-100 overflow-hidden flex items-center justify-center">
                      {selectedDetail.fotoLapangan ? (
                        <img
                          src={selectedDetail.fotoLapangan}
                          alt="Kondisi Lapangan"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-slate-400 text-[10px]">Nihil Foto</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="font-semibold text-slate-600 block">Hasil Perbaikan</span>
                    <div className="aspect-4/3 rounded border border-slate-200 bg-slate-100 overflow-hidden flex items-center justify-center">
                      {selectedDetail.fotoPerbaikan ? (
                        <img
                          src={selectedDetail.fotoPerbaikan}
                          alt="Hasil Perbaikan"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-slate-400 text-[10px]">Nihil Foto</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div>
                {(activeUser.role === 'ADMIN1' || activeUser.role === 'ADMIN2' || activeUser.role === 'TEKNISI') && (
                  <button
                    onClick={() => {
                      setDeleteTarget(selectedDetail);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus Laporan Ini
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {canInput && (
                  <button
                    onClick={() => {
                      const cur = selectedDetail;
                      setSelectedDetail(null);
                      handleOpenEdit(cur);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit Laporan Ini
                  </button>
                )}
                <button
                  onClick={() => setSelectedDetail(null)}
                  className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEW INCIDENT MODAL FORM */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between sticky top-0 z-10">
              <div>
                <h3 className="font-bold text-base text-slate-100">
                  {editingIncidentId ? 'Edit Berita Acara Kerusakan & Tindakan' : 'Input Berita Acara Kerusakan & Tindakan'}
                </h3>
                <p className="text-xs text-slate-400">
                  {editingIncidentId ? `Laporan: ${formData.nomorLaporan || ''}` : 'Pencatatan gangguan, analisis penyebab, dan tindakan perbaikan'}
                </p>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nomor Laporan</label>
                  <input
                    type="text"
                    required
                    value={formData.nomorLaporan || ''}
                    onChange={(e) => setFormData({ ...formData, nomorLaporan: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Unit Genset</label>
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
                  <label className="font-semibold text-slate-700 block mb-1">Tanggal Kejadian</label>
                  <input
                    type="date"
                    required
                    value={formData.tanggal || ''}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Pelapor / Teknisi (Isi Manual)</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama pelapor..."
                    value={formData.pelapor || ''}
                    onChange={(e) => setFormData({ ...formData, pelapor: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Kronologi Kejadian</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ceritakan urutan peristiwa saat genset trip, start, atau kendala..."
                  value={formData.kronologi || ''}
                  onChange={(e) => setFormData({ ...formData, kronologi: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Gejala (Symptoms)</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Hunting frekuensi, tegangan drop ke 340V, alarm AVR..."
                    value={formData.gejala || ''}
                    onChange={(e) => setFormData({ ...formData, gejala: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Penyebab (Root Cause)</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Dioda stator putus, seal pompa injeksi bocor..."
                    value={formData.penyebab || ''}
                    onChange={(e) => setFormData({ ...formData, penyebab: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Dampak Terhadap Operasional</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Status US, beban dialihkan ke genset cadangan..."
                    value={formData.dampak || ''}
                    onChange={(e) => setFormData({ ...formData, dampak: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tindakan Perbaikan</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Isolasi ATS, penggantian AVR, overhaul nozzle..."
                    value={formData.tindakanPerbaikan || ''}
                    onChange={(e) => setFormData({ ...formData, tindakanPerbaikan: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Sparepart Dibutuhkan</label>
                  <input
                    type="text"
                    placeholder="Contoh: Kit Dioda Stamford HCI, Filter Solar..."
                    value={formData.sparepart || ''}
                    onChange={(e) => setFormData({ ...formData, sparepart: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Hasil Pengujian Akhir</label>
                  <input
                    type="text"
                    placeholder="Contoh: Lulus uji beban bertahap 60%, voltase 380V stabil..."
                    value={formData.hasilPengujian || ''}
                    onChange={(e) => setFormData({ ...formData, hasilPengujian: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Photos upload */}
              <div className="pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-900 block mb-2">
                  Upload Foto Bukti Kerusakan & Perbaikan:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(['fotoKerusakan', 'fotoAlarm', 'fotoLapangan', 'fotoPerbaikan'] as const).map(
                    (key, idx) => {
                      const label = ['Komponen Rusak', 'Alarm Panel', 'Lapangan', 'Perbaikan'][idx];
                      return (
                        <div key={key} className="space-y-1">
                          <span className="font-semibold text-slate-700 block text-[11px]">
                            {label}
                          </span>
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
                                <Upload className="w-4 h-4 text-slate-400 mb-1" />
                                <span className="text-[10px] text-blue-600 font-semibold">Foto</span>
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
                    }
                  )}
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
                  className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  {editingIncidentId ? 'Perbarui Berita Acara Kerusakan' : 'Simpan Berita Acara Kerusakan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Deleting Incident Record */}
      <ConfirmDeleteModal
        isOpen={deleteTarget !== null}
        title="Konfirmasi Hapus Laporan Kerusakan"
        itemName={deleteTarget ? `${deleteTarget.nomorLaporan} - ${deleteTarget.gensetName}` : ''}
        itemDetails={
          deleteTarget
            ? `Tanggal: ${deleteTarget.tanggal} · Pelapor: ${deleteTarget.pelapor} · Gejala: ${deleteTarget.gejala} · Status: ${deleteTarget.status}`
            : undefined
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
