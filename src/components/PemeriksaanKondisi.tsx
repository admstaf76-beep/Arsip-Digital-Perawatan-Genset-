import React, { useState } from 'react';
import {
  GensetItem,
  InspectionRecord,
  InspectionParameters,
  UserSession,
} from '../types/genset';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Camera,
  Upload,
  Calendar,
  User,
  Activity,
  X,
  Gauge,
  Zap,
  Edit3,
  Trash2,
} from 'lucide-react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface PemeriksaanKondisiProps {
  inspections: InspectionRecord[];
  gensets: GensetItem[];
  activeUser: UserSession;
  onSaveInspection: (record: InspectionRecord, isNew?: boolean) => void;
  onDeleteInspection: (id: string) => void;
  isNewModalOpen: boolean;
  setIsNewModalOpen: (open: boolean) => void;
}

export const PemeriksaanKondisi: React.FC<PemeriksaanKondisiProps> = ({
  inspections,
  gensets,
  activeUser,
  onSaveInspection,
  onDeleteInspection,
  isNewModalOpen,
  setIsNewModalOpen,
}) => {
  const [selectedGensetId, setSelectedGensetId] = useState<string>('SEMUA');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDetail, setSelectedDetail] = useState<InspectionRecord | null>(null);
  const [editingInspectionId, setEditingInspectionId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InspectionRecord | null>(null);

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      onDeleteInspection(deleteTarget.id);
      if (selectedDetail?.id === deleteTarget.id) {
        setSelectedDetail(null);
      }
      setDeleteTarget(null);
    }
  };

  // Form State for 13 Parameters
  const [targetGensetId, setTargetGensetId] = useState<string>(gensets[0]?.id || '');
  const [teknisiName, setTeknisiName] = useState<string>(activeUser.name);
  const [params, setParams] = useState<InspectionParameters>({
    mesin: 'Halus dan Stabil',
    oli: 'Level Normal & Warna Bersih',
    temperatur: 82,
    getaran: 'Normal (Rendah)',
    pendingin: 'Radiator Bersih & Coolant Cukup',
    bbm: 85,
    battery: 25.2,
    charger: 'Float Charger Berfungsi Normal',
    tegangan: 382,
    frekuensi: 50.0,
    alarm: 'Normal (Nihil Alarm)',
    controller: 'Standby Auto Mode',
    ats: 'Standby Auto Mode',
  });
  const [catatan, setCatatan] = useState('');
  const [fotoPemeriksaan, setFotoPemeriksaan] = useState<string>('');

  const canInput = activeUser.role === 'TEKNISI' || activeUser.role === 'ADMIN2';

  // Filtered Inspections
  const filteredInspections = inspections.filter((insp) => {
    const matchGenset = selectedGensetId === 'SEMUA' || insp.gensetId === selectedGensetId;
    const matchSearch =
      insp.gensetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      insp.teknisi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      insp.catatan.toLowerCase().includes(searchQuery.toLowerCase());
    return matchGenset && matchSearch;
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPemeriksaan(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const calculateStatus = (): 'Normal' | 'Perhatian' | 'Gangguan' => {
    if (
      params.tegangan < 350 ||
      params.tegangan > 420 ||
      params.frekuensi < 48 ||
      params.frekuensi > 52 ||
      params.temperatur > 95 ||
      params.battery < 23
    ) {
      return 'Gangguan';
    }
    if (
      params.temperatur > 88 ||
      params.bbm < 30 ||
      params.battery < 24.2 ||
      params.mesin.toLowerCase().includes('bising') ||
      params.alarm.toLowerCase().includes('warning')
    ) {
      return 'Perhatian';
    }
    return 'Normal';
  };

  const handleOpenAdd = () => {
    setEditingInspectionId(null);
    setTargetGensetId(gensets[0]?.id || '');
    setTeknisiName(activeUser.name);
    setParams({
      mesin: 'Halus dan Stabil',
      oli: 'Level Normal & Warna Bersih',
      temperatur: 82,
      getaran: 'Normal (Rendah)',
      pendingin: 'Radiator Bersih & Coolant Cukup',
      bbm: 85,
      battery: 25.2,
      charger: 'Float Charger Berfungsi Normal',
      tegangan: 382,
      frekuensi: 50.0,
      alarm: 'Normal (Nihil Alarm)',
      controller: 'Standby Auto Mode',
      ats: 'Standby Auto Mode',
    });
    setCatatan('');
    setFotoPemeriksaan('');
    setIsNewModalOpen(true);
  };

  const handleOpenEdit = (insp: InspectionRecord) => {
    setEditingInspectionId(insp.id);
    setTargetGensetId(insp.gensetId);
    setTeknisiName(insp.teknisi);
    setParams({ ...insp.parameter });
    setCatatan(insp.catatan || '');
    setFotoPemeriksaan(insp.foto || '');
    setIsNewModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const genset = gensets.find((g) => g.id === targetGensetId) || gensets[0];
    const status = calculateStatus();
    const isEditing = Boolean(editingInspectionId);

    const recordData: InspectionRecord = {
      id: editingInspectionId || `INSP-${Date.now().toString().slice(-6)}`,
      gensetId: genset.id,
      gensetName: genset.nama,
      tanggal: isEditing
        ? (inspections.find((i) => i.id === editingInspectionId)?.tanggal || new Date().toISOString().slice(0, 10))
        : new Date().toISOString().slice(0, 10),
      teknisi: teknisiName,
      parameter: { ...params },
      status,
      catatan: catatan || 'Pemeriksaan rutin berkala 13 parameter.',
      foto: fotoPemeriksaan,
    };

    onSaveInspection(recordData, !isEditing);
    setIsNewModalOpen(false);
    setEditingInspectionId(null);
    setCatatan('');
    setFotoPemeriksaan('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-blue-600" />
            <span>Pemeriksaan Kondisi Genset (13 Parameter)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengecekan Mesin, Oli, Temperatur, Getaran, Pendingin, BBM, Battery, Charger, Tegangan, Frekuensi, Alarm, Controller, dan ATS
          </p>
        </div>

        {canInput && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Input Checklist Pemeriksaan</span>
          </button>
        )}
      </div>

      {/* Filter and Overview */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari teknisi, genset, catatan..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-medium text-slate-500">Pilih Genset:</span>
          <select
            value={selectedGensetId}
            onChange={(e) => setSelectedGensetId(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-blue-600 font-medium"
          >
            <option value="SEMUA">Semua Unit ({inspections.length} Riwayat)</option>
            {gensets.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nama} ({g.kode})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* List of Inspections: Mobile Cards + Desktop Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Mobile View for Phones */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredInspections.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              Belum ada riwayat checklist pemeriksaan kondisi.
            </div>
          ) : (
            filteredInspections.map((insp, idx) => (
              <div
                key={insp.id}
                onClick={() => setSelectedDetail(insp)}
                className="p-4 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-bold">
                        No. {idx + 1}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900">{insp.gensetName}</h4>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 font-bold">
                        {insp.id}
                      </span>
                      <span>{insp.tanggal}</span>
                    </div>
                  </div>
                  <div>
                    {insp.status === 'Normal' && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Normal
                      </span>
                    )}
                    {insp.status === 'Perhatian' && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        Perhatian
                      </span>
                    )}
                    {insp.status === 'Gangguan' && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">
                        Gangguan
                      </span>
                    )}
                  </div>
                </div>

                {/* Key Measurement Metrics */}
                <div className="grid grid-cols-4 gap-1.5 text-center bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                  <div className="bg-white p-1 rounded border border-slate-200/50">
                    <span className="text-[10px] text-slate-400 block">Tegangan</span>
                    <span className="text-xs font-mono font-bold text-slate-800">{insp.parameter.tegangan}V</span>
                  </div>
                  <div className="bg-white p-1 rounded border border-slate-200/50">
                    <span className="text-[10px] text-slate-400 block">Frekuensi</span>
                    <span className="text-xs font-mono font-bold text-slate-800">{insp.parameter.frekuensi}Hz</span>
                  </div>
                  <div className="bg-white p-1 rounded border border-slate-200/50">
                    <span className="text-[10px] text-slate-400 block">Suhu</span>
                    <span className="text-xs font-mono font-bold text-slate-800">{insp.parameter.temperatur}°C</span>
                  </div>
                  <div className="bg-white p-1 rounded border border-slate-200/50">
                    <span className="text-[10px] text-slate-400 block">Battery</span>
                    <span className="text-xs font-mono font-bold text-slate-800">{insp.parameter.battery}V</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                  <span className="text-[11px] text-slate-500">
                    Teknisi: <strong className="text-slate-700">{insp.teknisi}</strong>
                  </span>
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setSelectedDetail(insp)}
                      className="px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                    >
                      13 Parameter
                    </button>
                    {canInput && (
                      <button
                        onClick={() => handleOpenEdit(insp)}
                        className="p-1.5 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors"
                        title="Edit Pemeriksaan"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {(activeUser.role === 'ADMIN1' || activeUser.role === 'ADMIN2' || activeUser.role === 'TEKNISI') && (
                      <button
                        onClick={() => setDeleteTarget(insp)}
                        className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
                        title="Hapus Pemeriksaan"
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
                <th className="py-3 px-4">ID Inspeksi</th>
                <th className="py-3 px-4">Tanggal & Waktu</th>
                <th className="py-3 px-4">Unit Genset</th>
                <th className="py-3 px-4">Teknisi Pemeriksa</th>
                <th className="py-3 px-4 text-center">Tegangan (V)</th>
                <th className="py-3 px-4 text-center">Frekuensi (Hz)</th>
                <th className="py-3 px-4 text-center">Suhu (°C)</th>
                <th className="py-3 px-4 text-center">Battery (V)</th>
                <th className="py-3 px-4 text-center">BBM (%)</th>
                <th className="py-3 px-4 text-center">Hasil 13 Item</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInspections.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-500">
                    Belum ada riwayat checklist pemeriksaan kondisi.
                  </td>
                </tr>
              ) : (
                filteredInspections.map((insp, idx) => {
                  return (
                    <tr
                      key={insp.id}
                      onClick={() => setSelectedDetail(insp)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">
                        {idx + 1}
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-blue-700">
                        <span className="bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[11px]">
                          {insp.id}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{insp.tanggal}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                          {insp.gensetName}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{insp.teknisi}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-800 tabular-nums">
                        {insp.parameter.tegangan} V
                      </td>

                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-800 tabular-nums">
                        {insp.parameter.frekuensi} Hz
                      </td>

                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-800 tabular-nums">
                        {insp.parameter.temperatur}°C
                      </td>

                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-800 tabular-nums">
                        {insp.parameter.battery} V
                      </td>

                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-800 tabular-nums">
                        {insp.parameter.bbm}%
                      </td>

                      <td className="py-3 px-4 text-center">
                        {insp.status === 'Normal' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Normal
                          </span>
                        )}
                        {insp.status === 'Perhatian' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            Perhatian
                          </span>
                        )}
                        {insp.status === 'Gangguan' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">
                            Gangguan
                          </span>
                        )}
                      </td>

                      <td
                        className="py-3 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedDetail(insp)}
                            className="px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 rounded transition-colors"
                            title="Lihat 13 Parameter"
                          >
                            Detail
                          </button>
                          {canInput && (
                            <button
                              onClick={() => handleOpenEdit(insp)}
                              className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded transition-colors"
                              title="Edit Pemeriksaan"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {(activeUser.role === 'ADMIN1' || activeUser.role === 'ADMIN2' || activeUser.role === 'TEKNISI') && (
                            <button
                              onClick={() => setDeleteTarget(insp)}
                              className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded transition-colors"
                              title="Hapus Pemeriksaan"
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

      {/* DETAIL MODAL (13 Parameter Matrix) */}
      {selectedDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between sticky top-0 z-10">
              <div>
                <h3 className="font-bold text-base text-slate-100">
                  Rincian Pemeriksaan: {selectedDetail.gensetName}
                </h3>
                <p className="text-xs text-slate-400">
                  Tanggal: {selectedDetail.tanggal} · Teknisi: {selectedDetail.teknisi}
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
              {/* Status Banner */}
              <div
                className={`p-3.5 rounded-lg border flex items-center justify-between ${
                  selectedDetail.status === 'Normal'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : selectedDetail.status === 'Perhatian'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-red-50 border-red-200 text-red-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  <span className="font-bold text-sm">Status: {selectedDetail.status}</span>
                </div>
                <span className="font-mono text-[11px]">ID: {selectedDetail.id}</span>
              </div>

              {/* 13 Item Matrix Table */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2 uppercase tracking-wider text-[11px]">
                  Pemeriksaan 13 Parameter Kondisi
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">1. Mesin</span>
                    <span className="font-semibold text-slate-800">{selectedDetail.parameter.mesin}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">2. Oli Mesin</span>
                    <span className="font-semibold text-slate-800">{selectedDetail.parameter.oli}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">3. Temperatur Mesin</span>
                    <span className="font-semibold text-slate-800 font-mono">
                      {selectedDetail.parameter.temperatur} °C
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">4. Getaran (Vibrasi)</span>
                    <span className="font-semibold text-slate-800">{selectedDetail.parameter.getaran}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">5. Sistem Pendingin</span>
                    <span className="font-semibold text-slate-800">{selectedDetail.parameter.pendingin}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">6. Level Bahan Bakar (BBM)</span>
                    <span className="font-semibold text-slate-800 font-mono">
                      {selectedDetail.parameter.bbm} %
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">7. Tegangan Battery (Aki)</span>
                    <span className="font-semibold text-slate-800 font-mono">
                      {selectedDetail.parameter.battery} V DC
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">8. Charger Battery</span>
                    <span className="font-semibold text-slate-800">{selectedDetail.parameter.charger}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">9. Tegangan Output (Volt)</span>
                    <span className="font-semibold text-slate-800 font-mono">
                      {selectedDetail.parameter.tegangan} V AC
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">10. Frekuensi (Hz)</span>
                    <span className="font-semibold text-slate-800 font-mono">
                      {selectedDetail.parameter.frekuensi} Hz
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">11. Sistem Alarm / Trip</span>
                    <span className="font-semibold text-slate-800">{selectedDetail.parameter.alarm}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">12. Modul Controller</span>
                    <span className="font-semibold text-slate-800">{selectedDetail.parameter.controller}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 sm:col-span-2">
                    <span className="text-slate-400 block text-[10px]">13. Automatic Transfer Switch (ATS)</span>
                    <span className="font-semibold text-slate-800">{selectedDetail.parameter.ats}</span>
                  </div>
                </div>
              </div>

              {/* Catatan */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-700 block mb-1">Catatan Teknisi:</span>
                <p className="text-slate-600">{selectedDetail.catatan}</p>
              </div>

              {/* Foto if attached */}
              {selectedDetail.foto && (
                <div>
                  <span className="font-bold text-slate-700 block mb-1">Dokumentasi Foto Lapangan:</span>
                  <div className="aspect-16/9 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                    <img
                      src={selectedDetail.foto}
                      alt="Foto Pemeriksaan"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
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
                    Hapus Pemeriksaan
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
                    Edit Pemeriksaan Ini
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

      {/* NEW INSPECTION MODAL FORM (13 Parameters) */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between sticky top-0 z-10">
              <div>
                <h3 className="font-bold text-base text-slate-100">
                  {editingInspectionId ? 'Edit Lembar Pemeriksaan Kondisi (13 Item)' : 'Input Lembar Pemeriksaan Kondisi (13 Item)'}
                </h3>
                <p className="text-xs text-slate-400">
                  {editingInspectionId ? `ID: ${editingInspectionId}` : 'Checklist berkala kondisi mesin dan kelistrikan'}
                </p>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
              {/* Unit & Technician Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Pilih Unit Genset:</label>
                  <select
                    value={targetGensetId}
                    onChange={(e) => setTargetGensetId(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none bg-white font-medium"
                  >
                    {gensets.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.nama} ({g.kode} - {g.satuan})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nama Teknisi Pemeriksa (Isi Manual):</label>
                  <input
                    type="text"
                    required
                    placeholder="Ketik nama teknisi..."
                    value={teknisiName}
                    onChange={(e) => setTeknisiName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* 13 Parameters Input Form */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2 uppercase tracking-wider text-[11px]">
                  Isi 13 Parameter Pemeriksaan
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">1. Kondisi Mesin</label>
                    <input
                      type="text"
                      value={params.mesin}
                      onChange={(e) => setParams({ ...params, mesin: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">2. Oli Mesin</label>
                    <input
                      type="text"
                      value={params.oli}
                      onChange={(e) => setParams({ ...params, oli: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">3. Temperatur (°C)</label>
                    <input
                      type="number"
                      value={params.temperatur}
                      onChange={(e) =>
                        setParams({ ...params, temperatur: Number(e.target.value) })
                      }
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">4. Getaran (Vibrasi)</label>
                    <input
                      type="text"
                      value={params.getaran}
                      onChange={(e) => setParams({ ...params, getaran: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">5. Pendingin (Coolant)</label>
                    <input
                      type="text"
                      value={params.pendingin}
                      onChange={(e) => setParams({ ...params, pendingin: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">6. Level BBM (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={params.bbm}
                      onChange={(e) => setParams({ ...params, bbm: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">7. Battery Voltage (V)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={params.battery}
                      onChange={(e) =>
                        setParams({ ...params, battery: Number(e.target.value) })
                      }
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">8. Charger Battery</label>
                    <input
                      type="text"
                      value={params.charger}
                      onChange={(e) => setParams({ ...params, charger: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">9. Tegangan Output (V)</label>
                    <input
                      type="number"
                      value={params.tegangan}
                      onChange={(e) =>
                        setParams({ ...params, tegangan: Number(e.target.value) })
                      }
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">10. Frekuensi (Hz)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={params.frekuensi}
                      onChange={(e) =>
                        setParams({ ...params, frekuensi: Number(e.target.value) })
                      }
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">11. Alarm Sistem</label>
                    <input
                      type="text"
                      value={params.alarm}
                      onChange={(e) => setParams({ ...params, alarm: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">12. Controller</label>
                    <input
                      type="text"
                      value={params.controller}
                      onChange={(e) => setParams({ ...params, controller: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2 md:col-span-3">
                    <label className="font-semibold text-slate-700 block mb-1">13. Panel ATS</label>
                    <input
                      type="text"
                      value={params.ats}
                      onChange={(e) => setParams({ ...params, ats: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Catatan Hasil Pemeriksaan</label>
                <textarea
                  rows={2}
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Kondisi filter, suara knalpot, tes running 15 menit tanpa beban..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
                />
              </div>

              {/* Photo Upload */}
              <div>
                <span className="font-bold text-slate-900 block mb-1">
                  Upload Foto Bukti Pemeriksaan (Opsional)
                </span>
                <div className="border border-dashed border-slate-300 rounded-lg p-3 text-center bg-slate-50">
                  {fotoPemeriksaan ? (
                    <div className="relative inline-block max-w-xs">
                      <img
                        src={fotoPemeriksaan}
                        alt="Bukti Pemeriksaan"
                        className="rounded max-h-32 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setFotoPemeriksaan('')}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded p-0.5 text-[10px]"
                      >
                        Hapus Foto
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center cursor-pointer py-2">
                      <Camera className="w-6 h-6 text-slate-400 mb-1" />
                      <span className="text-xs text-blue-600 font-semibold">Pilih / Ambil Foto</span>
                      <span className="text-[10px] text-slate-400">Panel indikator, mesin, atau fisik</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                      />
                    </label>
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
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  {editingInspectionId ? 'Perbarui Pemeriksaan' : 'Simpan Hasil Pemeriksaan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Deleting Inspection */}
      <ConfirmDeleteModal
        isOpen={deleteTarget !== null}
        title="Konfirmasi Hapus Checklist Pemeriksaan"
        itemName={deleteTarget ? `${deleteTarget.id} - ${deleteTarget.gensetName}` : ''}
        itemDetails={
          deleteTarget
            ? `Tanggal: ${deleteTarget.tanggal} · Teknisi: ${deleteTarget.teknisi} · Status: ${deleteTarget.status}`
            : undefined
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
