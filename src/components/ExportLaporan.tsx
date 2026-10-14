import React, { useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  GensetItem,
  InspectionRecord,
  MaintenanceRecord,
  IncidentRecord,
  UserSession,
} from '../types/genset';
import {
  FileText,
  Printer,
  Download,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Zap,
  Loader2,
  FileCheck,
  Eye,
} from 'lucide-react';

interface ExportLaporanProps {
  gensets: GensetItem[];
  inspections: InspectionRecord[];
  maintenances: MaintenanceRecord[];
  incidents: IncidentRecord[];
  activeUser: UserSession;
  onExportCSV?: () => void;
  onExportJSON?: () => void;
}

type ReportType = 'ringkasan_dinas' | 'teknis' | 'pemeriksaan' | 'perawatan' | 'kerusakan';

export const ExportLaporan: React.FC<ExportLaporanProps> = ({
  gensets,
  inspections,
  maintenances,
  incidents,
  activeUser,
  onExportCSV,
  onExportJSON,
}) => {
  const [selectedReport, setSelectedReport] = useState<ReportType>('ringkasan_dinas');
  const [selectedSatuan, setSelectedSatuan] = useState<string>('SEMUA');
  const [reportDate, setReportDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [namaTeknisiManual, setNamaTeknisiManual] = useState<string>('');
  const [namaKadislogManual, setNamaKadislogManual] = useState<string>('');
  const [namaKomandanManual, setNamaKomandanManual] = useState<string>('');
  const [paperOrientation, setPaperOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [previewZoom, setPreviewZoom] = useState<number>(100);

  const filteredGensets = gensets.filter(
    (g) => selectedSatuan === 'SEMUA' || g.satuan === selectedSatuan
  );

  const totalGensetCount = filteredGensets.length;
  const siapList = filteredGensets.filter((g) => g.kondisi === 'S');
  const usRinganList = filteredGensets.filter((g) => g.kondisi === 'US Ringan');
  const usList = filteredGensets.filter((g) => g.kondisi === 'US');
  const totalJamKerjaArmada = filteredGensets.reduce((acc, g) => acc + g.jamOperasi, 0);
  const averageHealthArmada =
    totalGensetCount > 0
      ? Math.round(filteredGensets.reduce((acc, g) => acc + g.healthScore, 0) / totalGensetCount)
      : 0;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const reportElement = document.getElementById('printable-report-canvas');
    if (!reportElement) return;

    setIsGeneratingPDF(true);
    setDownloadSuccess(false);

    // Save previous transform and reset temporarily for pristine capture
    const prevTransform = reportElement.style.transform;
    reportElement.style.transform = 'none';

    try {
      // Tunggu render DOM stabil
      await new Promise((resolve) => setTimeout(resolve, 150));

      const isMobile = window.innerWidth < 768;
      const captureScale = isMobile ? 1.5 : 2;

      const canvas = await html2canvas(reportElement, {
        scale: captureScale,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: Math.max(1024, reportElement.scrollWidth),
      });

      const isLandscape = paperOrientation === 'landscape';
      const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = isLandscape ? 297 : 210;
      const pdfHeight = isLandscape ? 210 : 297;
      const margin = 10; // Margin 10mm A4
      const printableWidth = pdfWidth - margin * 2;
      const printableHeight = pdfHeight - margin * 2;

      // Tinggi per halaman dalam piksel canvas
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
            canvas.width,
            sliceHeightPx
          );
        }

        const pageImgData = pageCanvas.toDataURL('image/png');
        const sliceHeightMm = (sliceHeightPx * printableWidth) / canvas.width;

        if (pageIndex > 0) {
          pdf.addPage();
        }

        pdf.addImage(
          pageImgData,
          'PNG',
          margin,
          margin,
          printableWidth,
          sliceHeightMm,
          undefined,
          'FAST'
        );

        currentY += sliceHeightPx;
        pageIndex++;
      }

      const reportNames: Record<ReportType, string> = {
        ringkasan_dinas: 'Laporan-Dinas-Ringkasan-Status-Genset',
        teknis: 'Data-Teknis-Kesiapan',
        pemeriksaan: 'Hasil-Pemeriksaan-13-Parameter',
        perawatan: 'Rekapitulasi-Perawatan-CMMS',
        kerusakan: 'Berita-Acara-Kerusakan',
      };

      const filename = `Laporan-Genset-${reportNames[selectedReport]}-${reportDate}.pdf`;
      pdf.save(filename);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Error saat proses unduh PDF:', err);
      window.print();
    } finally {
      reportElement.style.transform = prevTransform;
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Control Toolbar (Hidden during print) */}
      <div className="print:hidden space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>Cetak & Unduh Laporan Resmi Kedinasan</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Format standar dinas lengkap dengan tabel spesifikasi, status teknis, dan kolom tanda tangan pejabat
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Format Kertas A4 Orientasi */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 shadow-2xs">
              <span className="font-semibold text-slate-600">Format A4:</span>
              <select
                value={paperOrientation}
                onChange={(e) => setPaperOrientation(e.target.value as 'portrait' | 'landscape')}
                className="bg-transparent font-medium text-slate-800 outline-none cursor-pointer"
              >
                <option value="portrait">A4 Portrait (Tegak)</option>
                <option value="landscape">A4 Landscape (Mendatar)</option>
              </select>
            </div>

            {/* Pengatur Ukuran Pratinjau Layar */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 shadow-2xs">
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-600 hidden sm:inline">Ukuran Layar:</span>
              <select
                value={previewZoom}
                onChange={(e) => setPreviewZoom(Number(e.target.value))}
                className="bg-transparent font-medium text-slate-800 outline-none cursor-pointer"
                title="Sesuaikan zoom pratinjau di layar monitor atau handphone"
              >
                <option value={100}>100% (Normal)</option>
                <option value={85}>85% (Pas Layar HP)</option>
                <option value={70}>70% (Ringkas HP)</option>
                <option value={120}>120% (Perbesar)</option>
              </select>
            </div>

            {/* Tombol Download PDF A4 */}
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 rounded-lg transition-colors shadow-xs cursor-pointer"
              title="Download file PDF ukuran A4 sesuai tampilan monitor"
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses PDF...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <FileCheck className="w-4 h-4" />
                  <span>PDF Terunduh!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download PDF (A4)</span>
                </>
              )}
            </button>

            {/* Tombol Cetak / Simpan PDF */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors shadow-xs cursor-pointer"
              title="Cetak langsung ke printer atau Simpan sebagai PDF dari browser"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>
          </div>
        </div>

        {/* Dynamic @page orientation rule */}
        <style>{`
          @media print {
            @page {
              size: A4 ${paperOrientation};
              margin: 10mm;
            }
          }
        `}</style>

        {/* Report Selector & Option Pills */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <span className="font-semibold text-slate-700">Pilih Jenis Laporan:</span>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setSelectedReport('ringkasan_dinas')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 shadow-2xs ${
                  selectedReport === 'ringkasan_dinas'
                    ? 'bg-slate-900 text-amber-300 ring-2 ring-amber-400'
                    : 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
                }`}
              >
                <span>★ Laporan Dinas (Ringkasan Status)</span>
              </button>
              <button
                onClick={() => setSelectedReport('teknis')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  selectedReport === 'teknis'
                    ? 'bg-blue-700 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                1. Data Teknis & Kesiapan
              </button>
              <button
                onClick={() => setSelectedReport('pemeriksaan')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  selectedReport === 'pemeriksaan'
                    ? 'bg-blue-700 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                2. Pemeriksaan (13 Item)
              </button>
              <button
                onClick={() => setSelectedReport('perawatan')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  selectedReport === 'perawatan'
                    ? 'bg-blue-700 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                3. Perawatan Berkala (CMMS)
              </button>
              <button
                onClick={() => setSelectedReport('kerusakan')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  selectedReport === 'kerusakan'
                    ? 'bg-blue-700 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                4. Berita Acara Kerusakan
              </button>
            </div>
          </div>
        </div>

        {/* Manual Signers & Date Control Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3 text-xs">
          <div className="flex flex-wrap items-center gap-4 justify-between border-b border-slate-100 pb-2.5">
            <span className="font-bold text-slate-800">Pengaturan Tanda Tangan Laporan (Diisi Manual):</span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Satuan:</span>
                <select
                  value={selectedSatuan}
                  onChange={(e) => setSelectedSatuan(e.target.value)}
                  className="px-2.5 py-1 text-xs rounded border border-slate-300 bg-white"
                >
                  <option value="SEMUA">Semua Unit</option>
                  <option value="SATUAN DENMA">SATUAN DENMA</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Tanggal:</span>
                <input
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="px-2 py-1 text-xs rounded border border-slate-300"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                1. Nama Teknisi:
              </label>
              <input
                type="text"
                value={namaTeknisiManual}
                onChange={(e) => setNamaTeknisiManual(e.target.value)}
                placeholder="Kosongkan untuk tanda tangan basah..."
                className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                2. Nama Kadislog:
              </label>
              <input
                type="text"
                value={namaKadislogManual}
                onChange={(e) => setNamaKadislogManual(e.target.value)}
                placeholder="Kosongkan untuk tanda tangan basah..."
                className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                3. Nama Komandan:
              </label>
              <input
                type="text"
                value={namaKomandanManual}
                onChange={(e) => setNamaKomandanManual(e.target.value)}
                placeholder="Kosongkan untuk tanda tangan basah..."
                className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Helper Banner & Quick Status */}
      <div className="sm:hidden flex items-center justify-between text-[11px] text-slate-600 bg-blue-50/80 border border-blue-200 px-3.5 py-2 rounded-xl">
        <span>📄 Format Standar A4 (Geser samping untuk melihat tabel)</span>
        <button
          onClick={() => setPreviewZoom(previewZoom === 85 ? 100 : 85)}
          className="text-blue-700 font-bold underline cursor-pointer"
        >
          {previewZoom === 85 ? 'Zoom 100%' : 'Pas Layar HP'}
        </button>
      </div>

      {/* PRINTABLE OFFICIAL REPORT CANVAS WRAPPER */}
      <div className="w-full overflow-x-auto rounded-xl scrollbar-thin">
        <div
          id="printable-report-canvas"
          style={{
            transform: previewZoom !== 100 ? `scale(${previewZoom / 100})` : undefined,
            transformOrigin: 'top center',
            marginBottom: previewZoom < 100 ? `-${(100 - previewZoom) * 4}px` : undefined,
          }}
          className="bg-white rounded-xl border border-slate-300 shadow-sm p-4 sm:p-10 max-w-5xl mx-auto min-w-[760px] sm:min-w-0 print:min-w-0 print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none print:w-full text-slate-900 font-sans transition-transform"
        >

        {/* KOP SURAT DINAS RESMI MILITER / KEDINASAN */}
        <div className="border-b-2 border-slate-900 pb-3 mb-5">
          <div className="flex items-start justify-between">
            <div className="text-left font-serif uppercase tracking-wider leading-tight">
              <div className="font-extrabold text-xs sm:text-sm text-slate-900">
                DETASEMEN MARKAS
              </div>
              <div className="text-[10px] sm:text-xs text-slate-700 font-sans tracking-normal mt-0.5">
                SATUAN FASILITAS DAN INSTALASI (FASINT)
              </div>
            </div>
            <div className="text-right text-[10px] text-slate-700 font-mono space-y-0.5">
              <div>KLASIFIKASI: BIASA</div>
              <div>NOMOR: B / LAP-GENSET / X / 2026 / FASINT</div>
              <div>LAMPIRAN: 1 (SATU) BERKAS</div>
            </div>
          </div>
          <div className="border-t border-slate-900 mt-2 pt-0.5" />
        </div>

        {/* REPORT TITLE */}
        <div className="text-center mb-6">
          <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-slate-900 underline underline-offset-4">
            {selectedReport === 'ringkasan_dinas' && 'LAPORAN DINAS: RINGKASAN STATUS KESIAPAN & PEMELIHARAAN SELURUH ARMADA GENSET'}
            {selectedReport === 'teknis' && 'LAPORAN DATA TEKNIS & STATUS KESIAPAN GENSET'}
            {selectedReport === 'pemeriksaan' && 'LEMBAR HASIL PEMERIKSAAN KONDISI FISIK & LISTRIK (13 PARAMETER)'}
            {selectedReport === 'perawatan' && 'REKAPITULASI PEMELIHARAAN BERKALA & SPK GENSET (CMMS)'}
            {selectedReport === 'kerusakan' && 'BERITA ACARA GANGGUAN KERUSAKAN & TINDAKAN PERBAIKAN'}
          </h2>
          <div className="text-xs text-slate-600 mt-1">
            <span>Per Tanggal: {reportDate}</span> ·{' '}
            <span>Satuan: {selectedSatuan === 'SEMUA' ? 'SATUAN DETASEMEN MARKAS (DENMA)' : selectedSatuan}</span>
          </div>
        </div>

        {/* CONTENT SECTION 0: LAPORAN DINAS RINGKASAN STATUS SEMUA UNIT GENSET */}
        {selectedReport === 'ringkasan_dinas' && (
          <div className="space-y-6">
            {/* Bagian I: Ringkasan Eksekutif */}
            <div className="space-y-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 flex items-center justify-between">
                <span>I. Ringkasan Eksekutif Kesiapan Operasional Armada</span>
                <span className="font-mono text-[10px] text-slate-500 font-normal">
                  Total Terdaftar: {totalGensetCount} Unit
                </span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded text-center">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                    Kondisi Siap (S)
                  </span>
                  <span className="text-lg font-bold font-mono text-emerald-900 tabular-nums">
                    {siapList.length} <span className="text-xs font-normal">Unit</span>
                  </span>
                  <span className="text-[10px] text-emerald-700 block font-semibold">
                    {totalGensetCount > 0 ? Math.round((siapList.length / totalGensetCount) * 100) : 0}% Siap Operasi
                  </span>
                </div>

                <div className="p-2.5 bg-amber-50 border border-amber-300 rounded text-center">
                  <span className="text-[10px] font-bold text-amber-800 uppercase block">
                    Kondisi US Ringan
                  </span>
                  <span className="text-lg font-bold font-mono text-amber-900 tabular-nums">
                    {usRinganList.length} <span className="text-xs font-normal">Unit</span>
                  </span>
                  <span className="text-[10px] text-amber-700 block font-semibold">
                    {totalGensetCount > 0 ? Math.round((usRinganList.length / totalGensetCount) * 100) : 0}% Perlu Atensi
                  </span>
                </div>

                <div className="p-2.5 bg-rose-50 border border-rose-300 rounded text-center">
                  <span className="text-[10px] font-bold text-rose-800 uppercase block">
                    Tidak Siap (US)
                  </span>
                  <span className="text-lg font-bold font-mono text-rose-900 tabular-nums">
                    {usList.length} <span className="text-xs font-normal">Unit</span>
                  </span>
                  <span className="text-[10px] text-rose-700 block font-semibold">
                    {totalGensetCount > 0 ? Math.round((usList.length / totalGensetCount) * 100) : 0}% Dalam Perbaikan
                  </span>
                </div>

                <div className="p-2.5 bg-slate-100 border border-slate-300 rounded text-center">
                  <span className="text-[10px] font-bold text-slate-800 uppercase block">
                    Rata-rata Kelaikan
                  </span>
                  <span className="text-lg font-bold font-mono text-blue-900 tabular-nums">
                    {averageHealthArmada}%
                  </span>
                  <span className="text-[10px] text-slate-600 block">
                    Total: {totalJamKerjaArmada.toLocaleString('id-ID')} Jam Kerja
                  </span>
                </div>
              </div>
            </div>

            {/* Bagian II: Tabel Rekapitulasi Status Semua Unit Genset */}
            <div className="space-y-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
                II. Rekapitulasi Status Kesiapan & Jadwal Pemeliharaan Seluruh Unit Genset
              </h3>

              <div className="overflow-x-auto print:overflow-visible">
                <table className="w-full text-left text-[11px] border-collapse border border-slate-400">
                  <thead className="bg-slate-100 border-b border-slate-400 font-bold uppercase text-[10px] text-slate-800">
                    <tr>
                      <th className="border border-slate-300 p-2 text-center w-8">No</th>
                      <th className="border border-slate-300 p-2">Kode & Nama Unit</th>
                      <th className="border border-slate-300 p-2">Lokasi Penempatan</th>
                      <th className="border border-slate-300 p-2">Kapasitas</th>
                      <th className="border border-slate-300 p-2 text-right">Jam Kerja</th>
                      <th className="border border-slate-300 p-2 text-center">Kondisi</th>
                      <th className="border border-slate-300 p-2 text-center">Health</th>
                      <th className="border border-slate-300 p-2">Servis Terakhir</th>
                      <th className="border border-slate-300 p-2">Jadwal PM Terdekat</th>
                      <th className="border border-slate-300 p-2">Keterangan / Catatan Teknis</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGensets.map((g, idx) => {
                      // Find latest maintenance
                      const unitMaints = maintenances
                        .filter((m) => m.gensetId === g.id)
                        .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
                      const lastMaint = unitMaints[0];

                      // Calculate remaining hours to 250h cycle
                      const cycleHours = 250;
                      const hoursInCycle = g.jamOperasi % cycleHours;
                      const remainingHours = cycleHours - hoursInCycle;

                      // PM Status label
                      let pmStatusText = `Sisa ${remainingHours} Jam (PM 250J)`;
                      if (remainingHours <= 5) {
                        pmStatusText = 'JATUH TEMPO (PM 250J)';
                      } else if (remainingHours <= 30) {
                        pmStatusText = `Mendekati (Sisa ${remainingHours} Jam)`;
                      }

                      return (
                        <tr
                          key={g.id}
                          className={`border-b border-slate-300 ${
                            g.kondisi === 'US'
                              ? 'bg-rose-50/50'
                              : g.kondisi === 'US Ringan'
                              ? 'bg-amber-50/40'
                              : ''
                          }`}
                        >
                          <td className="border border-slate-300 p-2 text-center font-bold">
                            {idx + 1}
                          </td>
                          <td className="border border-slate-300 p-2">
                            <div className="font-bold text-slate-900">{g.nama}</div>
                            <div className="text-[10px] font-mono text-slate-500">{g.kode}</div>
                          </td>
                          <td className="border border-slate-300 p-2">
                            <div>{g.lokasi}</div>
                            <div className="text-[10px] text-slate-500">{g.satuan}</div>
                          </td>
                          <td className="border border-slate-300 p-2 font-mono font-bold">
                            {g.kapasitas}
                          </td>
                          <td className="border border-slate-300 p-2 text-right font-mono font-bold">
                            {g.jamOperasi.toLocaleString('id-ID')} Jam
                          </td>
                          <td className="border border-slate-300 p-2 text-center font-bold">
                            {g.kondisi === 'S' && (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px]">
                                S (Siap)
                              </span>
                            )}
                            {g.kondisi === 'US Ringan' && (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px]">
                                US Ringan
                              </span>
                            )}
                            {g.kondisi === 'US' && (
                              <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded text-[10px]">
                                US (Rusak)
                              </span>
                            )}
                          </td>
                          <td className="border border-slate-300 p-2 text-center font-mono font-bold">
                            <span
                              className={
                                g.healthScore >= 80
                                  ? 'text-emerald-800'
                                  : g.healthScore >= 60
                                  ? 'text-amber-800'
                                  : 'text-rose-800'
                              }
                            >
                              {g.healthScore}%
                            </span>
                          </td>
                          <td className="border border-slate-300 p-2 text-[10px]">
                            {lastMaint ? (
                              <>
                                <div className="font-medium text-slate-800">{lastMaint.tanggal}</div>
                                <div className="text-slate-500 font-mono">{lastMaint.nomorPekerjaan}</div>
                              </>
                            ) : (
                              <span className="text-slate-500">{g.lastInspected || '-'}</span>
                            )}
                          </td>
                          <td className="border border-slate-300 p-2 text-[10px]">
                            <span
                              className={`font-semibold ${
                                remainingHours <= 5
                                  ? 'text-rose-700 font-bold'
                                  : remainingHours <= 30
                                  ? 'text-amber-700'
                                  : 'text-slate-700'
                              }`}
                            >
                              {pmStatusText}
                            </span>
                          </td>
                          <td className="border border-slate-300 p-2 text-[10px] text-slate-700">
                            {g.kondisi === 'S' && 'Unit normal, pelumasan & baterai stabil, standby otomatis.'}
                            {g.kondisi === 'US Ringan' && 'Dapat beroperasi terbatas; perlu penggantian aki baterai & filter udara.'}
                            {g.kondisi === 'US' && 'Non-operasional; kerusakan modul AVR & sensor oli. Menunggu suku cadang.'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bagian III: Catatan Gangguan Menonjol & Suku Cadang Mendesak */}
            <div className="space-y-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
                III. Catatan Gangguan Menonjol & Kebutuhan Suku Cadang Mendesak
              </h3>

              <div className="p-3 bg-slate-50 border border-slate-300 rounded text-xs space-y-2">
                <div className="flex items-start gap-2">
                  <span className="font-bold text-rose-800 min-w-[120px]">1. DEUTZ 250 KVA (US):</span>
                  <span className="text-slate-700">
                    Terjadi ketidakstabilan tegangan keluaran generator (output fluktuatif) akibat kerusakan modul
                    Automatic Voltage Regulator (AVR) dan indikasi alarm tekanan oli rendah. Telah diterbitkan Berita Acara Kerusakan;
                    tindakan prioritas pengadaan modul AVR Deutz tipe DVC310 dan sensor oli.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-amber-800 min-w-[120px]">2. PERKINS 150 KVA (US Ringan):</span>
                  <span className="text-slate-700">
                    Penurunan voltase baterai starter (tegangan drop ke 21.8V saat cranking) dan penumpukan jelaga pada filter udara.
                    Unit masih dapat beroperasi manual darurat; direkomendasikan peremajaan 2 unit aki N100 12V 100Ah dan pembersihan radiator.
                  </span>
                </div>
              </div>
            </div>

            {/* Bagian IV: Rekomendasi & Saran Tindak Lanjut Dinas */}
            <div className="space-y-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
                IV. Kesimpulan dan Saran Tindak Lanjut
              </h3>

              <ol className="list-decimal pl-5 text-[11px] text-slate-700 space-y-1">
                <li>
                  Tingkat kesiapan operasional seluruh armada genset Detasemen Markas berada pada angka{' '}
                  <strong>{totalGensetCount > 0 ? Math.round((siapList.length / totalGensetCount) * 100) : 0}%</strong> ({siapList.length} dari {totalGensetCount} unit siaga penuh menyuplai beban kritis Pusdalops dan Mako).
                </li>
                <li>
                  Disarankan kepada Kepala Dinas Logistik untuk merealisasikan pengadaan suku cadang prioritas AVR genset Deutz 250 kVA guna memulihkan kesiapan menjadi 100%.
                </li>
                <li>
                  Pelaksanaan inspeksi 13 parameter teknis harian dan pemanasan unit (warming up) berkala 2 kali seminggu tetap dilaksanakan secara konsisten oleh teknisi Fasint.
                </li>
              </ol>
            </div>
          </div>
        )}

        {/* CONTENT SECTION 1: DATA TEKNIS & KESIAPAN */}
        {selectedReport === 'teknis' && (
          <div className="space-y-4">
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-left text-[11px] border-collapse border border-slate-300">
                <thead className="bg-slate-100 border-b border-slate-300 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="border border-slate-300 p-2 text-center w-8">No</th>
                    <th className="border border-slate-300 p-2">Kode & Nama Genset</th>
                    <th className="border border-slate-300 p-2">Satuan & Lokasi</th>
                    <th className="border border-slate-300 p-2">Kapasitas</th>
                    <th className="border border-slate-300 p-2">Engine / No Mesin</th>
                    <th className="border border-slate-300 p-2">Generator / No Gen</th>
                    <th className="border border-slate-300 p-2 text-center">Tahun</th>
                    <th className="border border-slate-300 p-2 text-right">Jam Kerja</th>
                    <th className="border border-slate-300 p-2 text-center">Health</th>
                    <th className="border border-slate-300 p-2 text-center">Kondisi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGensets.map((g, idx) => (
                    <tr key={g.id} className="border-b border-slate-300">
                      <td className="border border-slate-300 p-2 text-center font-bold">
                        {idx + 1}
                      </td>
                      <td className="border border-slate-300 p-2 font-bold">
                        <div>{g.nama}</div>
                        <div className="text-[10px] text-slate-500 font-mono font-normal">
                          {g.kode}
                        </div>
                      </td>
                      <td className="border border-slate-300 p-2">
                        <div>{g.satuan}</div>
                        <div className="text-[10px] text-slate-600">{g.lokasi}</div>
                      </td>
                      <td className="border border-slate-300 p-2 font-mono font-bold">
                        {g.kapasitas}
                      </td>
                      <td className="border border-slate-300 p-2">
                        <div>{g.engine}</div>
                        <div className="text-[10px] font-mono text-slate-500">
                          {g.noMesin || '-'}
                        </div>
                      </td>
                      <td className="border border-slate-300 p-2">
                        <div>{g.alternator}</div>
                        <div className="text-[10px] font-mono text-slate-500">
                          {g.noGenerator || g.serialNumber || '-'}
                        </div>
                      </td>
                      <td className="border border-slate-300 p-2 text-center font-mono">
                        {g.tahun}
                      </td>
                      <td className="border border-slate-300 p-2 text-right font-mono font-bold">
                        {g.jamOperasi} Jam
                      </td>
                      <td className="border border-slate-300 p-2 text-center font-mono font-bold">
                        {g.healthScore}%
                      </td>
                      <td className="border border-slate-300 p-2 text-center font-bold">
                        {g.kondisi === 'S' && 'S (Siap)'}
                        {g.kondisi === 'US Ringan' && 'US Ringan'}
                        {g.kondisi === 'US' && 'US (Rusak)'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-300 rounded text-xs space-y-1">
              <span className="font-bold">Keterangan Status Kesiapan Operasional:</span>
              <ul className="list-disc pl-5 text-[11px] text-slate-700 space-y-0.5">
                <li>
                  <strong>S (Siap):</strong> Genset dalam kondisi normal, pelumasan baik, baterai stabil, siap operasi otomatis kapan saja terjadi pemadaman PLN.
                </li>
                <li>
                  <strong>US Ringan (Perlu Perhatian):</strong> Genset dapat beroperasi darurat namun terdapat suku cadang minor atau sensor yang membutuhkan perawatan.
                </li>
                <li>
                  <strong>US (Tidak Siap / Rusak):</strong> Unit dalam status non-operasional karena kerusakan komponen esensial (AVR, injektor, modul) menunggu suku cadang.
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* CONTENT SECTION 2: PEMERIKSAAN 13 PARAMETER */}
        {selectedReport === 'pemeriksaan' && (
          <div className="space-y-4">
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-left text-[11px] border-collapse border border-slate-300">
                <thead className="bg-slate-100 border-b border-slate-300 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="border border-slate-300 p-2 text-center w-8">No</th>
                    <th className="border border-slate-300 p-2">Tanggal</th>
                    <th className="border border-slate-300 p-2">Unit Genset</th>
                    <th className="border border-slate-300 p-2">Teknisi</th>
                    <th className="border border-slate-300 p-2 text-center">Voltase</th>
                    <th className="border border-slate-300 p-2 text-center">Hz</th>
                    <th className="border border-slate-300 p-2 text-center">Suhu</th>
                    <th className="border border-slate-300 p-2 text-center">BBM</th>
                    <th className="border border-slate-300 p-2 text-center">Battery</th>
                    <th className="border border-slate-300 p-2">Ringkasan Catatan 13 Parameter</th>
                    <th className="border border-slate-300 p-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {inspections.map((insp, idx) => (
                    <tr key={insp.id} className="border-b border-slate-300">
                      <td className="border border-slate-300 p-2 text-center font-bold">
                        {idx + 1}
                      </td>
                      <td className="border border-slate-300 p-2 whitespace-nowrap">{insp.tanggal}</td>
                      <td className="border border-slate-300 p-2 font-bold">{insp.gensetName}</td>
                      <td className="border border-slate-300 p-2">{insp.teknisi}</td>
                      <td className="border border-slate-300 p-2 text-center font-mono font-bold">
                        {insp.parameter.tegangan} V
                      </td>
                      <td className="border border-slate-300 p-2 text-center font-mono">
                        {insp.parameter.frekuensi} Hz
                      </td>
                      <td className="border border-slate-300 p-2 text-center font-mono">
                        {insp.parameter.temperatur}°C
                      </td>
                      <td className="border border-slate-300 p-2 text-center font-mono">
                        {insp.parameter.bbm}%
                      </td>
                      <td className="border border-slate-300 p-2 text-center font-mono">
                        {insp.parameter.battery} V
                      </td>
                      <td className="border border-slate-300 p-2 text-[10px]">{insp.catatan}</td>
                      <td className="border border-slate-300 p-2 text-center font-bold">
                        {insp.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CONTENT SECTION 3: PERAWATAN BERKALA CMMS */}
        {selectedReport === 'perawatan' && (
          <div className="space-y-4">
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-left text-[11px] border-collapse border border-slate-300">
                <thead className="bg-slate-100 border-b border-slate-300 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="border border-slate-300 p-2 text-center w-8">No</th>
                    <th className="border border-slate-300 p-2">No. SPK</th>
                    <th className="border border-slate-300 p-2">Tanggal</th>
                    <th className="border border-slate-300 p-2">Genset</th>
                    <th className="border border-slate-300 p-2">Kategori</th>
                    <th className="border border-slate-300 p-2">Komponen & Sparepart</th>
                    <th className="border border-slate-300 p-2">Hasil Pekerjaan</th>
                    <th className="border border-slate-300 p-2 text-right">Biaya (Rp)</th>
                    <th className="border border-slate-300 p-2 text-center">Approval Kadislog</th>
                  </tr>
                </thead>
                <tbody>
                  {maintenances.map((m, idx) => (
                    <tr key={m.id} className="border-b border-slate-300">
                      <td className="border border-slate-300 p-2 text-center font-bold">
                        {idx + 1}
                      </td>
                      <td className="border border-slate-300 p-2 font-mono font-bold text-slate-900">
                        {m.nomorPekerjaan}
                      </td>
                      <td className="border border-slate-300 p-2 whitespace-nowrap">{m.tanggal}</td>
                      <td className="border border-slate-300 p-2 font-bold">{m.gensetName}</td>
                      <td className="border border-slate-300 p-2">
                        {m.frekuensi} ({m.kategori})
                      </td>
                      <td className="border border-slate-300 p-2">
                        <div className="font-semibold">{m.komponen}</div>
                        <div className="text-[10px] text-slate-500">{m.sparepart || '-'}</div>
                      </td>
                      <td className="border border-slate-300 p-2 text-[10px]">{m.hasilPekerjaan}</td>
                      <td className="border border-slate-300 p-2 text-right font-mono font-bold">
                        Rp {m.biaya.toLocaleString('id-ID')}
                      </td>
                      <td className="border border-slate-300 p-2 text-center font-bold">
                        {m.approvalStatus}
                        {m.kadislogName && (
                          <div className="text-[9px] text-slate-500 font-normal">
                            ({m.kadislogName})
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CONTENT SECTION 4: BERITA ACARA KERUSAKAN */}
        {selectedReport === 'kerusakan' && (
          <div className="space-y-4">
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-left text-[11px] border-collapse border border-slate-300">
                <thead className="bg-slate-100 border-b border-slate-300 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="border border-slate-300 p-2 text-center w-8">No</th>
                    <th className="border border-slate-300 p-2">No. Laporan</th>
                    <th className="border border-slate-300 p-2">Tanggal</th>
                    <th className="border border-slate-300 p-2">Genset</th>
                    <th className="border border-slate-300 p-2">Kronologi & Gejala</th>
                    <th className="border border-slate-300 p-2">Penyebab Kerusakan</th>
                    <th className="border border-slate-300 p-2">Tindakan Perbaikan</th>
                    <th className="border border-slate-300 p-2">Hasil Pengujian</th>
                    <th className="border border-slate-300 p-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.map((inc, idx) => (
                    <tr key={inc.id} className="border-b border-slate-300">
                      <td className="border border-slate-300 p-2 text-center font-bold">
                        {idx + 1}
                      </td>
                      <td className="border border-slate-300 p-2 font-mono font-bold text-slate-900">
                        {inc.nomorLaporan}
                      </td>
                      <td className="border border-slate-300 p-2 whitespace-nowrap">{inc.tanggal}</td>
                      <td className="border border-slate-300 p-2 font-bold">{inc.gensetName}</td>
                      <td className="border border-slate-300 p-2">
                        <div className="font-semibold">{inc.gejala}</div>
                        <div className="text-[10px] text-slate-500">{inc.kronologi}</div>
                      </td>
                      <td className="border border-slate-300 p-2">{inc.penyebab}</td>
                      <td className="border border-slate-300 p-2">{inc.tindakanPerbaikan}</td>
                      <td className="border border-slate-300 p-2">{inc.hasilPengujian}</td>
                      <td className="border border-slate-300 p-2 text-center font-bold">
                        {inc.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* OFFICIAL SIGNATURE BLOCK (KOP SURAT MILITER / KEDINASAN) */}
        <div className="mt-12 pt-6 border-t border-slate-300 text-xs">
          <div className="grid grid-cols-3 gap-6 text-center">
            {/* Signature 1: Teknisi (Manual Input, No NRP) */}
            <div className="space-y-16">
              <div>
                <p className="font-medium text-slate-600">Pelaksana Pemeliharaan,</p>
                <p className="font-bold text-slate-800">Teknisi Fasint</p>
              </div>
              <div>
                {namaTeknisiManual.trim() ? (
                  <p className="font-bold text-slate-900 underline underline-offset-2 uppercase tracking-wide">
                    {namaTeknisiManual}
                  </p>
                ) : (
                  <p className="font-bold text-slate-900 underline underline-offset-2">
                    ( .................................................... )
                  </p>
                )}
              </div>
            </div>

            {/* Signature 2: Kadislog (Manual Input, No NRP/Pangkat) */}
            <div className="space-y-16">
              <div>
                <p className="font-medium text-slate-600">Mengetahui / Memeriksa,</p>
                <p className="font-bold text-slate-800">Kepala Dinas Logistik</p>
              </div>
              <div>
                {namaKadislogManual.trim() ? (
                  <p className="font-bold text-slate-900 underline underline-offset-2 uppercase tracking-wide">
                    {namaKadislogManual}
                  </p>
                ) : (
                  <p className="font-bold text-slate-900 underline underline-offset-2">
                    ( .................................................... )
                  </p>
                )}
              </div>
            </div>

            {/* Signature 3: Komandan (Manual Input, No NRP/Pangkat) */}
            <div className="space-y-16">
              <div>
                <p className="font-medium text-slate-600">Menyetujui,</p>
                <p className="font-bold text-slate-800">Komandan Detasemen Markas</p>
              </div>
              <div>
                {namaKomandanManual.trim() ? (
                  <p className="font-bold text-slate-900 underline underline-offset-2 uppercase tracking-wide">
                    {namaKomandanManual}
                  </p>
                ) : (
                  <p className="font-bold text-slate-900 underline underline-offset-2">
                    ( .................................................... )
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* FLOATING QUICK ACTION BAR (Akses Cepat Download & Cetak Kapan Saja) */}
      <aside aria-label="Aksi Cepat Cetak dan Unduh" className="print:hidden fixed bottom-16 lg:bottom-6 right-3 sm:right-6 z-30 flex items-center gap-2 bg-slate-900/95 backdrop-blur-md p-2 rounded-2xl shadow-2xl border border-slate-700 text-white animate-in fade-in duration-200">
        <button
          onClick={handleDownloadPDF}
          disabled={isGeneratingPDF}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-400 text-white transition-all shadow-sm cursor-pointer"
          title="Download PDF format A4 langsung ke perangkat"
        >
          {isGeneratingPDF ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : downloadSuccess ? (
            <FileCheck className="w-4 h-4 text-white" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">Download PDF (A4)</span>
          <span className="sm:hidden">Unduh PDF</span>
        </button>

        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-sm cursor-pointer"
          title="Cetak langsung ke printer atau Simpan sebagai PDF browser"
        >
          <Printer className="w-4 h-4" />
          <span className="hidden sm:inline">Cetak / Simpan</span>
          <span className="sm:hidden">Cetak</span>
        </button>

        <button
          onClick={() => setPaperOrientation(paperOrientation === 'portrait' ? 'landscape' : 'portrait')}
          className="px-2.5 py-2 text-slate-300 hover:text-white rounded-xl transition-colors border border-slate-700 text-[10px] font-semibold cursor-pointer"
          title="Ganti orientasi kertas A4"
        >
          {paperOrientation === 'portrait' ? 'A4 Tegak' : 'A4 Datar'}
        </button>
      </aside>
    </div>
  );
};
