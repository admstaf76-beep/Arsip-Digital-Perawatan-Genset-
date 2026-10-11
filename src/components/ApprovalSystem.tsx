import React, { useState } from 'react';
import { MaintenanceRecord, UserSession } from '../types/genset';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  User,
  Wrench,
  AlertCircle,
  FileCheck,
  Lock,
  Stamp,
  Check,
  ChevronRight,
} from 'lucide-react';

interface ApprovalSystemProps {
  maintenances: MaintenanceRecord[];
  activeUser: UserSession;
  onApprove: (id: string, notes: string) => void;
  onReject: (id: string, notes: string) => void;
  onOpenLoginModal: () => void;
}

export const ApprovalSystem: React.FC<ApprovalSystemProps> = ({
  maintenances,
  activeUser,
  onApprove,
  onReject,
  onOpenLoginModal,
}) => {
  const [activeTabFilter, setActiveTabFilter] = useState<'pending' | 'approved' | 'rejected'>(
    'pending'
  );
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  const isKadislog = activeUser.role === 'KADISLOG';

  const pendingList = maintenances.filter((m) => m.approvalStatus === 'Menunggu Review');
  const approvedList = maintenances.filter((m) => m.approvalStatus === 'Disetujui');
  const rejectedList = maintenances.filter((m) => m.approvalStatus === 'Ditolak');

  const displayedList =
    activeTabFilter === 'pending'
      ? pendingList
      : activeTabFilter === 'approved'
      ? approvedList
      : rejectedList;

  const handleSelectRecord = (rec: MaintenanceRecord) => {
    setSelectedRecord(rec);
    setReviewNotes(rec.catatanKadislog || '');
  };

  const handleAction = (approved: boolean) => {
    if (!selectedRecord) return;
    if (approved) {
      onApprove(selectedRecord.id, reviewNotes);
    } else {
      onReject(selectedRecord.id, reviewNotes);
    }
    setSelectedRecord(null);
    setReviewNotes('');
  };

  const totalApprovedCost = approvedList.reduce((acc, curr) => acc + curr.biaya, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>Sistem Approval & Otorisasi Kadislog</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Alur verifikasi pekerjaan teknisi: Input → Upload Bukti → Submit → Kadislog Review → Approve / Reject → Arsip Digital
          </p>
        </div>

        {/* Kadislog Role Warning or Indicator */}
        {!isKadislog ? (
          <div className="flex items-center gap-2 p-2 px-3 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-800">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Saat ini Anda login sebagai <strong>{activeUser.role}</strong>.</span>
            <button
              onClick={onOpenLoginModal}
              className="font-bold underline text-amber-900 hover:text-black ml-1 cursor-pointer"
            >
              Masuk sebagai KADISLOG
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-2 px-3 bg-emerald-50 border border-emerald-300 rounded-lg text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Otoritas Aktif: <strong>{activeUser.name} ({activeUser.title})</strong></span>
          </div>
        )}
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => setActiveTabFilter('pending')}
          className={`p-4 rounded-xl border text-left transition-all ${
            activeTabFilter === 'pending'
              ? 'bg-amber-50 border-amber-400 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Menunggu Review Kadislog</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-700">
            {pendingList.length} <span className="text-xs text-slate-500 font-normal">Pekerjaan</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Perlu pemeriksaan bukti foto & biaya</div>
        </button>

        <button
          onClick={() => setActiveTabFilter('approved')}
          className={`p-4 rounded-xl border text-left transition-all ${
            activeTabFilter === 'approved'
              ? 'bg-emerald-50 border-emerald-400 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Telah Disetujui (Approved)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-700">
            {approvedList.length} <span className="text-xs text-slate-500 font-normal">Pekerjaan</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            Total Anggaran: Rp {totalApprovedCost.toLocaleString('id-ID')}
          </div>
        </button>

        <button
          onClick={() => setActiveTabFilter('rejected')}
          className={`p-4 rounded-xl border text-left transition-all ${
            activeTabFilter === 'rejected'
              ? 'bg-red-50 border-red-400 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Ditolak / Memerlukan Revisi</span>
            <XCircle className="w-4 h-4 text-red-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-red-700">
            {rejectedList.length} <span className="text-xs text-slate-500 font-normal">Pekerjaan</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Dengan catatan evaluasi pimpinan</div>
        </button>
      </div>

      {/* Main Review Layout: Split Pane (List on Left, Executive Review Panel on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Col: Task Queue */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800">
              Daftar SPK ({displayedList.length})
            </span>
            <span className="text-slate-500 capitalize">Filter: {activeTabFilter}</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {displayedList.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Tidak ada data pada kategori ini.
              </div>
            ) : (
              displayedList.map((m) => {
                const isSelected = selectedRecord?.id === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => handleSelectRecord(m)}
                    className={`p-4 transition-all cursor-pointer text-xs ${
                      isSelected
                        ? 'bg-blue-50/80 border-l-4 border-l-blue-600 shadow-2xs'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-blue-700">{m.nomorPekerjaan}</span>
                      <span className="text-[10px] text-slate-500">{m.tanggal}</span>
                    </div>

                    <div className="font-bold text-slate-900 mb-1">{m.gensetName}</div>
                    <div className="text-slate-600 text-[11px] line-clamp-1 mb-1">
                      Komponen: {m.komponen}
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                      <span className="text-slate-500">Teknisi: {m.teknisi}</span>
                      <span className="font-mono font-bold text-slate-800">
                        Rp {m.biaya.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Col: Executive Review & Inspection Station */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-5">
          {selectedRecord ? (
            <>
              {/* Review Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                    Lembar Verifikasi Pimpinan (Kadislog)
                  </span>
                  <h3 className="font-bold text-base text-slate-900 mt-0.5">
                    {selectedRecord.nomorPekerjaan} - {selectedRecord.gensetName}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span>Tanggal: {selectedRecord.tanggal}</span>
                    <span>·</span>
                    <span>Pelaksana: {selectedRecord.teknisi}</span>
                    <span>·</span>
                    <span>Kategori: {selectedRecord.kategori} ({selectedRecord.frekuensi})</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-500 block">Total Biaya Suku Cadang</span>
                  <span className="text-lg font-mono font-bold text-slate-900 tabular-nums">
                    Rp {selectedRecord.biaya.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Technical Details */}
              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-semibold text-slate-700 block mb-0.5">
                    Komponen & Suku Cadang Diganti:
                  </span>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                    <p className="font-medium text-slate-900">
                      Komponen: {selectedRecord.komponen}
                    </p>
                    <p className="text-slate-600">
                      Sparepart: {selectedRecord.sparepart || 'Tidak ada'}
                    </p>
                  </div>
                </div>

                <div>
                  <span className="font-semibold text-slate-700 block mb-0.5">
                    Hasil Pengujian Pekerjaan Teknisi:
                  </span>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 leading-relaxed">
                    {selectedRecord.hasilPekerjaan}
                  </div>
                </div>
              </div>

              {/* 3 Photos Evidence: Sebelum, Proses, Sesudah */}
              <div>
                <span className="font-bold text-slate-900 block mb-2 text-xs uppercase tracking-wider">
                  Bukti Foto Lapangan (Sebelum · Proses · Sesudah):
                </span>
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-600 block">1. Sebelum</span>
                    <div className="aspect-4/3 rounded border border-slate-200 bg-slate-100 overflow-hidden flex items-center justify-center">
                      {selectedRecord.fotoSebelum ? (
                        <img
                          src={selectedRecord.fotoSebelum}
                          alt="Sebelum"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-slate-400 text-[10px]">Nihil Foto</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-600 block">2. Proses</span>
                    <div className="aspect-4/3 rounded border border-slate-200 bg-slate-100 overflow-hidden flex items-center justify-center">
                      {selectedRecord.fotoProses ? (
                        <img
                          src={selectedRecord.fotoProses}
                          alt="Proses"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-slate-400 text-[10px]">Nihil Foto</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-600 block">3. Sesudah</span>
                    <div className="aspect-4/3 rounded border border-slate-200 bg-slate-100 overflow-hidden flex items-center justify-center">
                      {selectedRecord.fotoSesudah ? (
                        <img
                          src={selectedRecord.fotoSesudah}
                          alt="Sesudah"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-slate-400 text-[10px]">Nihil Foto</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Approval Stamping or Review Box */}
              {selectedRecord.approvalStatus === 'Disetujui' ? (
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-xs text-emerald-900">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-sm text-emerald-800">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span>TELAH DISETUJUI SECARA DIGITAL OLEH KADISLOG</span>
                    </div>
                    <div className="text-[11px] text-emerald-700">
                      Pejabat: {selectedRecord.kadislogName} · {selectedRecord.tanggalApproval}
                    </div>
                    {selectedRecord.catatanKadislog && (
                      <p className="text-xs italic text-emerald-800 mt-1">
                        Catatan: "{selectedRecord.catatanKadislog}"
                      </p>
                    )}
                  </div>
                  <div className="border-2 border-dashed border-emerald-600 text-emerald-700 font-bold px-3 py-1.5 rounded rotate-[-3deg] text-center text-[10px] uppercase font-mono tracking-widest shrink-0">
                    APPROVED
                    <div className="text-[8px] font-sans">KADISLOG VERIFIED</div>
                  </div>
                </div>
              ) : selectedRecord.approvalStatus === 'Ditolak' ? (
                <div className="p-4 bg-red-50 border border-red-300 rounded-xl space-y-1 text-xs text-red-900">
                  <div className="flex items-center gap-1.5 font-bold text-sm text-red-800">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span>DITOLAK / MEMERLUKAN PERBAIKAN</span>
                  </div>
                  <p className="text-xs">
                    Catatan Pimpinan: "{selectedRecord.catatanKadislog || 'Belum ada catatan'}"
                  </p>
                </div>
              ) : (
                /* Pending Review Form */
                <div className="pt-2 border-t border-slate-200 space-y-3">
                  <label className="font-bold text-slate-800 block text-xs">
                    Catatan Evaluasi / Rekomendasi Kadislog:
                  </label>
                  <textarea
                    rows={3}
                    disabled={!isKadislog}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder={
                      isKadislog
                        ? 'Tuliskan catatan teknis persetujuan, arahan pengujian, atau instruksi pemeliharaan lanjutan...'
                        : 'Hanya pengguna dengan role KADISLOG yang dapat mengisi dan menyetujui.'
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none disabled:bg-slate-100"
                  />

                  {isKadislog ? (
                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        onClick={() => handleAction(false)}
                        className="px-4 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-300 rounded-lg transition-colors cursor-pointer"
                      >
                        Tolak (Reject)
                      </button>
                      <button
                        onClick={() => handleAction(true)}
                        className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Setujui (Approve SPK)</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={onOpenLoginModal}
                      className="w-full py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      Beralih ke Akun KADISLOG untuk Menyetujui
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="py-24 text-center space-y-2 text-slate-400">
              <FileCheck className="w-12 h-12 mx-auto opacity-30 text-slate-600" />
              <p className="text-sm font-medium text-slate-600">
                Pilih salah satu SPK di kolom kiri untuk melihat rincian bukti foto dan melakukan evaluasi.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
