import React, { useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  GensetItem,
  MaintenanceRecord,
  UserSession,
} from '../types/genset';
import {
  X,
  Printer,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  Wrench,
  DollarSign,
  Building2,
  Zap,
  Loader2,
  FileCheck,
  Shield,
} from 'lucide-react';

interface PrintableGensetMaintenanceReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  genset: GensetItem | null;
  maintenances: MaintenanceRecord[];
  activeUser: UserSession;
}

export const PrintableGensetMaintenanceReportModal: React.FC<
  PrintableGensetMaintenanceReportModalProps
> = ({ isOpen, onClose, genset, maintenances, activeUser }) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen || !genset) return null;

  // Filter maintenance records for this specific genset over the last 3 months
  // Reference date: current date (e.g. October 2026), 90 days back
  const today = new Date('2026-10-10T12:00:00Z');
  const threeMonthsAgoDate = new Date(today);
  threeMonthsAgoDate.setDate(threeMonthsAgoDate.getDate() - 92);
  const threeMonthsAgoStr = threeMonthsAgoDate.toISOString().slice(0, 10);

  // Get maintenances for this genset within the last 3 months, sorted newest first
  const gensetMaintenances = maintenances
    .filter((m) => m.gensetId === genset.id)
    .filter((m) => m.tanggal >= threeMonthsAgoStr || m.tanggal >= '2026-07-01')
    .sort((a, b) => (b.tanggal > a.tanggal ? 1 : -1));

  // If there are zero records within 90 days, fallback to all available records for this genset
  const displayMaintenances =
    gensetMaintenances.length > 0
      ? gensetMaintenances
      : maintenances
          .filter((m) => m.gensetId === genset.id)
          .sort((a, b) => (b.tanggal > a.tanggal ? 1 : -1));

  // Statistics calculation
  const totalPekerjaan = displayMaintenances.length;
  const approvedCount = displayMaintenances.filter(
    (m) => m.approvalStatus === 'Disetujui'
  ).length;
  const pendingCount = displayMaintenances.filter(
    (m) => m.approvalStatus === 'Menunggu Review'
  ).length;
  const totalBiaya = displayMaintenances.reduce(
    (acc, curr) => acc + (curr.biaya || 0),
    0
  );

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const reportElement = document.getElementById(
      'printable-3month-maintenance-report'
    );
    if (!reportElement) return;

    setIsGeneratingPDF(true);
    setDownloadSuccess(false);

    try {
      await new Promise((resolve) => setTimeout(resolve, 200));

      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1024,
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = 210;
      const pdfHeight = 297;
      const margin = 8;
      const printableWidth = pdfWidth - margin * 2;
      const printableHeight = pdfHeight - margin * 2;

      const pageHeightPx = (printableHeight / printableWidth) * canvas.width;
      let currentY = 0;
      let pageIndex = 0;

      while (currentY < canvas.height) {
        const sliceHeightPx = Math.min(pageHeightPx, canvas.height - currentY);
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeightPx;
        const ctx = pageCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          ctx.drawImage(
            canvas,
            0,
            currentY,
            canvas.width,
            sliceHeightPx,
            0,
            0,
            pageCanvas.width,
            sliceHeightPx
          );

          const pageData = pageCanvas.toDataURL('image/jpeg', 0.95);
          if (pageIndex > 0) {
            pdf.addPage('a4', 'portrait');
          }

          const sliceHeightMm = (sliceHeightPx / canvas.width) * printableWidth;
          pdf.addImage(
            pageData,
            'JPEG',
            margin,
            margin,
            printableWidth,
            sliceHeightMm,
            undefined,
            'FAST'
          );
        }
        currentY += sliceHeightPx;
        pageIndex++;
      }

      pdf.save(
        `Laporan_Pemeliharaan_3Bulan_${genset.kode}_${new Date()
          .toISOString()
          .slice(0, 10)}.pdf`
      );
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    } catch (err) {
      console.error('PDF Generation Error:', err);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:z-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden print:max-w-none print:w-full print:max-h-none print:shadow-none print:border-none print:rounded-none">
        {/* Top Control Bar (Hidden on print) */}
        <div className="print:hidden px-4 sm:px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Laporan Pemeliharaan 3 Bulan Terakhir</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-200 border border-blue-400/30">
                  Format A4
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Unit: <strong className="text-white">{genset.nama}</strong> ({genset.kode})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cetak Dokumen</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Memproses PDF...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <FileCheck className="w-3.5 h-3.5 text-emerald-300" />
                  <span>PDF Diunduh!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF A4</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Preview Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-100 print:bg-white print:p-0 print:overflow-visible">
          {/* Printable Sheet Canvas Container (Formatted for A4) */}
          <div
            id="printable-3month-maintenance-report"
            className="bg-white max-w-[800px] mx-auto p-6 sm:p-10 shadow-md border border-slate-200 print:shadow-none print:border-none print:p-0 print:max-w-none text-slate-900 font-sans"
            style={{ minHeight: '297mm' }}
          >
            {/* KOP SURAT RESMI */}
            <div className="border-b-2 border-slate-900 pb-3 mb-5 text-center">
              <div className="text-[11px] font-bold tracking-widest text-slate-700 uppercase">
                MARKAS BESAR TENTARA NASIONAL INDONESIA
              </div>
              <div className="text-[12px] font-bold tracking-wider text-slate-900 uppercase">
                SATUAN DETASEMEN MARKAS (DENMA) KOOPSUDNAS
              </div>
              <div className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">
                SEKSI PEMELIHARAAN FASILITAS & INSTALASI LISTRIK (FASINT)
              </div>
              <div className="text-[9px] text-slate-500 mt-0.5">
                Jl. Suryadarma No. 1, Halim Perdanakusuma, Jakarta Timur 13610
              </div>

              <div className="mt-4 pt-2 border-t border-slate-300">
                <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-950">
                  LAPORAN REKAPITULASI PEMELIHARAAN GENSET
                </h2>
                <div className="text-xs font-semibold text-slate-700 mt-0.5">
                  PERIODE 3 BULAN TERAKHIR (JULI - OKTOBER 2026)
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Nomor Arsip Dokumen: FASINT/GMM/3M-{genset.kode}/2026
                </div>
              </div>
            </div>

            {/* IDENTITAS UNIT GENSET */}
            <div className="mb-5 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1.5 mb-2.5 flex items-center justify-between">
                <span>I. DATA IDENTITAS & SPESIFIKASI UNIT</span>
                <span className="font-mono text-[10px] text-slate-500">
                  Tanggal Laporan: 10 Oktober 2026
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-[11px]">
                <div>
                  <span className="text-slate-500 block text-[10px]">Nama Unit:</span>
                  <strong className="text-slate-900 font-bold">{genset.nama}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Kode Inventaris:</span>
                  <strong className="text-blue-800 font-mono font-bold">{genset.kode}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Lokasi Instalasi:</span>
                  <span className="text-slate-800 font-semibold">{genset.lokasi}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Kapasitas Daya:</span>
                  <span className="text-slate-800 font-semibold">{genset.kapasitas}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Engine & Generator:</span>
                  <span className="text-slate-800 truncate block">{genset.merk} / {genset.alternator}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">No. Seri / Mesin:</span>
                  <span className="text-slate-800 font-mono">{genset.noMesin || genset.serialNumber || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Total Jam Operasi:</span>
                  <strong className="text-slate-900 font-mono">{genset.jamOperasi} Jam</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Health Score Terkini:</span>
                  <strong className={`font-mono font-bold ${
                    genset.healthScore >= 80 ? 'text-emerald-700' : genset.healthScore >= 60 ? 'text-amber-700' : 'text-red-700'
                  }`}>
                    {genset.healthScore}% ({genset.kondisi === 'S' ? 'Siap Operasi' : genset.kondisi === 'US Ringan' ? 'US Ringan' : 'Tidak Siap'})
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Tegangan / Frekuensi:</span>
                  <span className="text-slate-800">{genset.tegangan} · {genset.frekuensi}</span>
                </div>
              </div>
            </div>

            {/* RINGKASAN EKSEKUTIF 3 BULAN */}
            <div className="mb-5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-2">
                II. RINGKASAN PEKERJAAN & BIAYA (3 BULAN TERAKHIR)
              </div>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[10px] text-slate-500 block">Total SPK</span>
                  <span className="text-base font-bold font-mono text-slate-900">
                    {totalPekerjaan} Kegiatan
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[10px] text-slate-500 block">Disetujui Kadislog</span>
                  <span className="text-base font-bold font-mono text-emerald-700">
                    {approvedCount} Disetujui
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[10px] text-slate-500 block">Menunggu Review</span>
                  <span className="text-base font-bold font-mono text-amber-700">
                    {pendingCount} SPK
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[10px] text-slate-500 block">Total Pengeluaran</span>
                  <span className="text-xs sm:text-sm font-bold font-mono text-blue-900 block truncate mt-0.5">
                    Rp {totalBiaya.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

            {/* TABEL RINCIAN KEGIATAN PEMELIHARAAN */}
            <div className="mb-6">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center justify-between">
                <span>III. LOG RINCIAN PEMELIHARAAN & PENGGANTIAN SUKU CADANG</span>
                <span className="text-[10px] text-slate-500 font-normal">
                  {displayMaintenances.length} Rekaman Ditemukan
                </span>
              </div>

              {displayMaintenances.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded">
                  Tidak ada rekaman aktivitas pemeliharaan dalam rentang 3 bulan terakhir untuk unit ini.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse border border-slate-300 text-[10px]">
                    <thead>
                      <tr className="bg-slate-100 text-slate-800 uppercase font-bold tracking-wider border-b border-slate-300">
                        <th className="p-2 border border-slate-300 text-center w-8">No</th>
                        <th className="p-2 border border-slate-300 w-20">Tanggal</th>
                        <th className="p-2 border border-slate-300 w-28">No. SPK / Kategori</th>
                        <th className="p-2 border border-slate-300">Komponen & Suku Cadang</th>
                        <th className="p-2 border border-slate-300 w-24 text-right">Biaya (Rp)</th>
                        <th className="p-2 border border-slate-300">Hasil Pekerjaan & Uji</th>
                        <th className="p-2 border border-slate-300 w-24 text-center">Pengesahan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {displayMaintenances.map((m, idx) => (
                        <tr key={m.id} className="hover:bg-slate-50/50">
                          <td className="p-2 border border-slate-300 text-center font-mono font-bold">
                            {idx + 1}
                          </td>
                          <td className="p-2 border border-slate-300 font-mono">
                            {m.tanggal}
                          </td>
                          <td className="p-2 border border-slate-300 font-mono">
                            <strong className="text-slate-900 block font-bold">
                              {m.nomorPekerjaan}
                            </strong>
                            <span className="text-slate-600 block text-[9px]">
                              {m.frekuensi} ({m.kategori})
                            </span>
                            <span className="text-slate-500 block text-[9px]">
                              Teknisi: {m.teknisi}
                            </span>
                          </td>
                          <td className="p-2 border border-slate-300">
                            <strong className="text-slate-900 block font-semibold">
                              {m.komponen}
                            </strong>
                            <p className="text-slate-600 text-[9px] mt-0.5 leading-snug">
                              <strong>Part:</strong> {m.sparepart || 'Penyetelan rutin'}
                            </p>
                          </td>
                          <td className="p-2 border border-slate-300 text-right font-mono font-semibold">
                            {m.biaya ? `Rp ${m.biaya.toLocaleString('id-ID')}` : 'Rp 0'}
                          </td>
                          <td className="p-2 border border-slate-300 leading-snug">
                            <p className="text-slate-800">{m.hasilPekerjaan}</p>
                            {m.catatanKadislog && (
                              <p className="text-[9px] text-blue-900 bg-blue-50/80 p-1 rounded mt-1 border border-blue-100 italic">
                                Catatan Kadislog: "{m.catatanKadislog}"
                              </p>
                            )}
                          </td>
                          <td className="p-2 border border-slate-300 text-center">
                            {m.approvalStatus === 'Disetujui' ? (
                              <span className="inline-block px-1.5 py-0.5 rounded font-bold text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Disetujui
                                <span className="block font-normal text-[8px] text-slate-500">
                                  {m.kadislogName || 'Kadislog'}
                                </span>
                              </span>
                            ) : m.approvalStatus === 'Ditolak' ? (
                              <span className="inline-block px-1.5 py-0.5 rounded font-bold text-[9px] bg-red-100 text-red-800 border border-red-200">
                                Ditolak
                              </span>
                            ) : (
                              <span className="inline-block px-1.5 py-0.5 rounded font-bold text-[9px] bg-amber-100 text-amber-800 border border-amber-200">
                                Menunggu
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* LEMBAR PENGESAHAN RESMI (TANDA TANGAN) */}
            <div className="mt-8 pt-4 border-t border-slate-300 text-xs break-inside-avoid">
              <div className="text-center font-semibold text-slate-700 mb-6 text-[11px]">
                Jakarta, 10 Oktober 2026
              </div>
              <div className="grid grid-cols-2 gap-8 text-center">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Petugas Pelaksana Pemeliharaan</div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">
                    Teknisi Fasilitas & Instalasi Listrik
                  </div>
                  <div className="h-16 flex items-center justify-center">
                    <span className="text-[10px] font-mono text-slate-400 italic">
                      [Tanda Tangan Elektronik]
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 border-b border-slate-400 inline-block px-4 pb-0.5">
                    {activeUser.role === 'TEKNISI' ? activeUser.name : 'Sertu Agus Prasetyo'}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                    NRP 532189 / Teknisi Fasint
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Mengetahui / Menyetujui</div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">
                    Kepala Dinas Logistik (Kadislog) Denma
                  </div>
                  <div className="h-16 flex items-center justify-center">
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 font-bold">
                      ✓ DISAHKAN & DIVERIFIKASI
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 border-b border-slate-400 inline-block px-4 pb-0.5">
                    {activeUser.role === 'KADISLOG' ? activeUser.name : 'Mayor Tek Bambang Sujatmiko, S.T.'}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                    NRP 518420 / Kadislog Satuan Denma
                  </div>
                </div>
              </div>
            </div>

            {/* Footnote */}
            <div className="mt-8 pt-2 border-t border-slate-200 text-[9px] text-slate-400 flex items-center justify-between">
              <span>Sistem Manajemen Pemeliharaan Terkomputerisasi (CMMS) · Satuan Denma</span>
              <span>Dokumen Sah Dinolkan dari Database GMM</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
