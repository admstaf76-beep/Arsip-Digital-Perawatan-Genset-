import React from 'react';
import { GensetOperationalRecord, GensetItem } from '../types/genset';
import { Printer, X, Download, ShieldCheck, Gauge, CheckCircle2 } from 'lucide-react';

interface PrintableOperationalLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: GensetOperationalRecord | null;
  genset?: GensetItem;
}

export const PrintableOperationalLogModal: React.FC<PrintableOperationalLogModalProps> = ({
  isOpen,
  onClose,
  record,
  genset,
}) => {
  if (!isOpen || !record) return null;

  const handlePrint = () => {
    window.print();
  };

  const jamMulai = record.waktuMulai || '-';
  const jamSelesai = record.waktuSelesai || (record.status === 'Beroperasi' ? 'Masih Beroperasi' : '-');
  const durasiJam = Math.floor(record.durasiOperasiMenit / 60);
  const durasiMenit = record.durasiOperasiMenit % 60;
  const durasiStr = `${durasiJam > 0 ? `${durasiJam} Jam ` : ''}${durasiMenit} Menit`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex justify-center items-start p-2 sm:p-4 print:p-0 print:bg-white">
      <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 sm:my-8 print:my-0 print:border-none print:shadow-none print:rounded-none">
        
        {/* Screen Action Bar (Hidden when printing) */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Gauge className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg">Lembar Logbook Pengoperasian Genset</h2>
              <p className="text-xs text-slate-300">
                Dokumen Resmi Catatan Operasional & Pemeriksaan Pra - Saat - Pasca Operasi
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Cetak / Simpan PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Content */}
        <div className="p-6 sm:p-10 text-slate-900 bg-white print:p-6 print:text-black">
          {/* Header Surat / Berita Acara */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  MARKAS BESAR TNI · SATUAN DENMA
                </p>
                <p className="text-xs font-semibold text-slate-600">
                  SEKSI FASILITAS & INSTALASI TEKNIK (FASINT)
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 border border-slate-300 rounded font-mono">
                  {record.nomorLog}
                </span>
                <p className="text-[11px] text-slate-500 mt-1">Tanggal: {record.tanggal}</p>
              </div>
            </div>
            <div className="text-center mt-4">
              <h1 className="text-lg sm:text-xl font-extrabold uppercase tracking-wide">
                LEMBAR CATATAN PENGOPERASIAN GENSET (RUNNING LOGBOOK)
              </h1>
              <p className="text-xs text-slate-600 font-medium">
                Pemeriksaan Teknis Sebelum, Selama, dan Sesudah Pengoperasian Generator Listrik Cadangan
              </p>
            </div>
          </div>

          {/* Section 1: Informasi Unit & Aktivitas Operasi */}
          <div className="mb-6 bg-slate-50 border border-slate-200 rounded-lg p-4 print:bg-white print:border-slate-300">
            <h3 className="text-xs font-bold uppercase text-slate-700 tracking-wider mb-2 border-b border-slate-200 pb-1">
              I. IDENTITAS UNIT & DATA OPERASIONAL
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Unit Genset:</span>
                <span className="font-bold text-slate-900">{record.gensetName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Kapasitas:</span>
                <span className="font-semibold text-slate-800">{genset?.kapasitas || '350 KVA (280 kW)'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Keperluan:</span>
                <span className="font-bold text-blue-700">{record.keperluan}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Mode Operasi:</span>
                <span className="font-semibold text-slate-800">{record.modeOperasi}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Waktu Mulai:</span>
                <span className="font-semibold text-slate-800">{jamMulai} WIB</span>
              </div>
              <div>
                <span className="text-slate-500 block">Waktu Selesai:</span>
                <span className="font-semibold text-slate-800">{jamSelesai} {jamSelesai !== 'Masih Beroperasi' ? 'WIB' : ''}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Total Durasi:</span>
                <span className="font-bold text-slate-900">{durasiStr}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Hour Meter (HM):</span>
                <span className="font-mono font-bold text-slate-900">
                  {record.hourMeterAwal} → {record.hourMeterAkhir} ({((record.hourMeterAkhir || 0) - (record.hourMeterAwal || 0)).toFixed(1)} Jam)
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Operator Teknisi:</span>
                <span className="font-semibold text-slate-800">{record.operator}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Petugas Pendamping:</span>
                <span className="font-semibold text-slate-800">{record.petugasPendamping || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Status Operasi:</span>
                <span className="font-bold text-emerald-700">{record.status}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Lokasi Unit:</span>
                <span className="font-semibold text-slate-800">{genset?.lokasi || 'Power House'}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Pemeriksaan SEBELUM Pengoperasian (Pra-Operasi) */}
          <div className="mb-6 border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex justify-between items-center print:bg-slate-200">
              <h3 className="text-xs font-bold uppercase text-slate-800 tracking-wider">
                II. HASIL PEMERIKSAAN SEBELUM PENGOPERASIAN (PRA-OPERASI / PRE-START)
              </h3>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Status: {record.praOperasi.statusKesiapan}
              </span>
            </div>
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-2 px-3">Item Pemeriksaan</th>
                  <th className="py-2 px-3">Standar / Kondisi</th>
                  <th className="py-2 px-3">Hasil Pemeriksaan</th>
                  <th className="py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                <tr>
                  <td className="py-2 px-3 font-medium">Level Oli Mesin (Dipstick)</td>
                  <td className="py-2 px-3 text-slate-500">Antara garis Low & High</td>
                  <td className="py-2 px-3 font-semibold">{record.praOperasi.levelOli}</td>
                  <td className="py-2 px-3 text-emerald-700 font-bold">NORMAL</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium">Air Radiator / Coolant</td>
                  <td className="py-2 px-3 text-slate-500">Penuh / Tangki reservoir cukup</td>
                  <td className="py-2 px-3 font-semibold">{record.praOperasi.levelCoolant}</td>
                  <td className="py-2 px-3 text-emerald-700 font-bold">NORMAL</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium">Bahan Bakar Solar (Daily Tank)</td>
                  <td className="py-2 px-3 text-slate-500">Minimal 50% kapasitas</td>
                  <td className="py-2 px-3 font-semibold">{record.praOperasi.levelBBM}%</td>
                  <td className="py-2 px-3 text-emerald-700 font-bold">CUKUP</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium">Tegangan Baterai / Aki Starting</td>
                  <td className="py-2 px-3 text-slate-500">24.0 V - 27.5 V (Sistem 24V)</td>
                  <td className="py-2 px-3 font-semibold">{record.praOperasi.teganganBaterai} VDC</td>
                  <td className="py-2 px-3 text-emerald-700 font-bold">SIAP CRANK</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium">Kondisi Fisik Ruangan & Kebocoran</td>
                  <td className="py-2 px-3 text-slate-500">Bebas bocor, ventilasi dibuka</td>
                  <td className="py-2 px-3 font-semibold">{record.praOperasi.kondisiFisikRuangan}</td>
                  <td className="py-2 px-3 text-emerald-700 font-bold">AMAN</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium">Posisi Selector / Saklar Kontrol</td>
                  <td className="py-2 px-3 text-slate-500">Sesuai kebutuhan (Auto/Manual)</td>
                  <td className="py-2 px-3 font-semibold">{record.praOperasi.posisiSelector}</td>
                  <td className="py-2 px-3 text-emerald-700 font-bold">SESUAI</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium">Kekencangan V-Belt Kipas</td>
                  <td className="py-2 px-3 text-slate-500">Defleksi 10-15 mm, tidak retak</td>
                  <td className="py-2 px-3 font-semibold">{record.praOperasi.kondisiBelt}</td>
                  <td className="py-2 px-3 text-emerald-700 font-bold">BAIK</td>
                </tr>
              </tbody>
            </table>
            {record.praOperasi.catatanPra && (
              <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-700">
                <span className="font-bold">Catatan Pra-Operasi:</span> {record.praOperasi.catatanPra}
              </div>
            )}
          </div>

          {/* Section 3: Pengukuran Parameter SAAT Pengoperasian (Running) */}
          <div className="mb-6 border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex justify-between items-center print:bg-slate-200">
              <h3 className="text-xs font-bold uppercase text-slate-800 tracking-wider">
                III. PARAMETER TEKNIS SAAT PENGOPERASIAN (RUNNING PARAMETERS)
              </h3>
              <span className="text-[11px] font-semibold text-slate-700">
                Toleransi: Tegangan 380V ±5%, Frekuensi 50Hz ±2%
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 divide-x divide-y divide-slate-200 text-xs text-center">
              <div className="p-3 bg-white">
                <span className="text-slate-500 block text-[11px]">Tegangan Output:</span>
                <span className="text-base font-extrabold text-blue-700">{record.saatOperasi.teganganL1L2} V</span>
                <span className="text-[10px] text-slate-400 block">Fasa ke Fasa (380V)</span>
              </div>
              <div className="p-3 bg-white">
                <span className="text-slate-500 block text-[11px]">Frekuensi Generator:</span>
                <span className="text-base font-extrabold text-blue-700">{record.saatOperasi.frekuensi} Hz</span>
                <span className="text-[10px] text-slate-400 block">Standar 50.0 Hz</span>
              </div>
              <div className="p-3 bg-white">
                <span className="text-slate-500 block text-[11px]">Putaran Mesin (RPM):</span>
                <span className="text-base font-extrabold text-blue-700">{record.saatOperasi.rpm} RPM</span>
                <span className="text-[10px] text-slate-400 block">Kecepatan Standar 1500</span>
              </div>
              <div className="p-3 bg-white">
                <span className="text-slate-500 block text-[11px]">Tekanan Oli Mesin:</span>
                <span className="text-base font-extrabold text-blue-700">{record.saatOperasi.tekananOli} Bar</span>
                <span className="text-[10px] text-slate-400 block">Normal: 3.5 - 5.5 Bar</span>
              </div>
              <div className="p-3 bg-white">
                <span className="text-slate-500 block text-[11px]">Suhu Mesin / Coolant:</span>
                <span className="text-base font-extrabold text-blue-700">{record.saatOperasi.temperaturMesin} °C</span>
                <span className="text-[10px] text-slate-400 block">Normal: 75°C - 88°C</span>
              </div>
              <div className="p-3 bg-white">
                <span className="text-slate-500 block text-[11px]">Arus Beban Total:</span>
                <span className="text-base font-extrabold text-blue-700">{record.saatOperasi.arusBeban} A</span>
                <span className="text-[10px] text-slate-400 block">Beban: {record.saatOperasi.persenBeban}%</span>
              </div>
              <div className="p-3 bg-white">
                <span className="text-slate-500 block text-[11px]">Getaran & Suara:</span>
                <span className="text-xs font-bold text-slate-800">{record.saatOperasi.suaraDanGetaran}</span>
                <span className="text-[10px] text-slate-400 block">Engine Mounting Baik</span>
              </div>
              <div className="p-3 bg-white">
                <span className="text-slate-500 block text-[11px]">Kondisi Gas Buang:</span>
                <span className="text-xs font-bold text-slate-800">{record.saatOperasi.kondisiAsap}</span>
                <span className="text-[10px] text-slate-400 block">Pembakaran Sempurna</span>
              </div>
            </div>
            {record.saatOperasi.catatanSaat && (
              <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-700">
                <span className="font-bold">Catatan Selama Running:</span> {record.saatOperasi.catatanSaat}
              </div>
            )}
          </div>

          {/* Section 4: Pemeriksaan SESUDAH Pengoperasian (Pasca-Operasi & Shutdown) */}
          <div className="mb-6 border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex justify-between items-center print:bg-slate-200">
              <h3 className="text-xs font-bold uppercase text-slate-800 tracking-wider">
                IV. HASIL PEMERIKSAAN SESUDAH PENGOPERASIAN (PASCA-OPERASI & SHUTDOWN)
              </h3>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Kondisi Akhir: {record.pascaOperasi.kondisiAkhirGenset}
              </span>
            </div>
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-2 px-3">Item Pasca-Operasi</th>
                  <th className="py-2 px-3">Keterangan / Nilai</th>
                  <th className="py-2 px-3">Hasil Evaluasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                <tr>
                  <td className="py-2 px-3 font-medium">Prosedur Cooling Down (Tanpa Beban)</td>
                  <td className="py-2 px-3 font-semibold">{record.pascaOperasi.coolingDownDurasiMenit} Menit</td>
                  <td className="py-2 px-3 text-emerald-700 font-bold">DILAKSANAKAN DENGAN BENAR</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium">Hour Meter Final Mesin</td>
                  <td className="py-2 px-3 font-mono font-semibold">{record.pascaOperasi.hourMeterAkhir} Jam</td>
                  <td className="py-2 px-3 text-slate-600 font-medium">Penambahan tercatat dalam logbook</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium">Sisa BBM Solar & Konsumsi</td>
                  <td className="py-2 px-3 font-semibold">
                    Sisa: {record.pascaOperasi.levelBBMAkhir}% | Estimasi: ±{record.pascaOperasi.estimasiKonsumsiSolarLiter} Liter
                  </td>
                  <td className="py-2 px-3 text-slate-600 font-medium">Sesuai durasi beban</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium">Pemeriksaan Kebocoran Fluida</td>
                  <td className="py-2 px-3 font-semibold">{record.pascaOperasi.cekKebocoran}</td>
                  <td className="py-2 px-3 text-emerald-700 font-bold">NIHIL KEBOCORAN</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium">Posisi Breaker & Selector Kontrol</td>
                  <td className="py-2 px-3 font-semibold">{record.pascaOperasi.posisiSelectorAkhir}</td>
                  <td className="py-2 px-3 text-emerald-700 font-bold">SIAP STANDBY OTOMATIS</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium">Float Charger Baterai (Aki)</td>
                  <td className="py-2 px-3 font-semibold">{record.pascaOperasi.chargerAkiNormal ? 'Aktif Mengisi (Float Normal)' : 'Tidak Aktif'}</td>
                  <td className="py-2 px-3 text-emerald-700 font-bold">NORMAL</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium">Kebersihan & Keamanan Ruang Genset</td>
                  <td className="py-2 px-3 font-semibold">{record.pascaOperasi.kebersihanDanKunci}</td>
                  <td className="py-2 px-3 text-emerald-700 font-bold">AMAN & TERKUNCI</td>
                </tr>
              </tbody>
            </table>
            {record.pascaOperasi.catatanPasca && (
              <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-700">
                <span className="font-bold">Catatan Pasca-Operasi:</span> {record.pascaOperasi.catatanPasca}
              </div>
            )}
          </div>

          {/* Section 5: Lembar Tanda Tangan & Pengesahan */}
          <div className="mt-8 pt-4 border-t border-slate-300">
            <div className="grid grid-cols-2 text-center text-xs">
              <div>
                <p className="text-slate-600 mb-1">Operator Pelaksana / Teknisi</p>
                <p className="text-[11px] text-slate-400 mb-14">Tanggal: {record.tanggal}</p>
                <p className="font-bold underline text-slate-900">{record.operator}</p>
                <p className="text-[11px] text-slate-600">Teknisi Listrik & Genset Denma</p>
              </div>
              <div>
                <p className="text-slate-600 mb-1">Mengetahui / Mengesahkan</p>
                <p className="text-[11px] text-slate-400 mb-14">Kepala Dinas Logistik / Perwira Jaga</p>
                <p className="font-bold underline text-slate-900">KOLONEL CPL KADISLOG</p>
                <p className="text-[11px] text-slate-600">Kadislog Satuan Denma</p>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-8 pt-3 border-t border-dashed border-slate-200 flex justify-between items-center text-[10px] text-slate-400">
            <span>Sistem Informasi GMM · Denma Genset Management Module</span>
            <span>ID Dokumen: {record.id}</span>
          </div>

        </div>

      </div>
    </div>
  );
};
