import React, { useState } from 'react';
import { GensetItem, SOPChecklistRecord, UserSession } from '../types/genset';
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
} from 'lucide-react';

interface SopK3Props {
  sopLogs: SOPChecklistRecord[];
  gensets: GensetItem[];
  activeUser: UserSession;
  onSaveSOP: (record: SOPChecklistRecord) => void;
}

export const SopK3: React.FC<SopK3Props> = ({
  sopLogs,
  gensets,
  activeUser,
  onSaveSOP,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [selectedGensetId, setSelectedGensetId] = useState<string>(gensets[0]?.id || '');
  const [teknisiName, setTeknisiName] = useState<string>(activeUser.name);
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

  const canInput = activeUser.role === 'TEKNISI' || activeUser.role === 'ADMIN2';

  const checklistItems = [
    {
      key: 'area' as const,
      title: '1. Pemeriksaan Area',
      desc: 'Ventilasi udara terbuka, bebas dari genangan oli/air, bebas material mudah terbakar di dekat knalpot genset.',
      icon: Activity,
    },
    {
      key: 'unit' as const,
      title: '2. Pemeriksaan Unit',
      desc: 'Fisik mesin utuh, baut mounting kencang, pembumian (grounding) tersambung kokoh, tidak ada kebocoran udara.',
      icon: Zap,
    },
    {
      key: 'fluida' as const,
      title: '3. Pemeriksaan Fluida',
      desc: 'Level oli (dipstick berada di batas toleransi), coolant radiator terisi penuh, solar pada tangki harian > 50%.',
      icon: Droplets,
    },
    {
      key: 'loto' as const,
      title: '4. Prosedur LOTO (Lockout / Tagout)',
      desc: 'Gembok pengaman dan tanda peringatan bahaya terpasang pada saklar pemutus jika teknisi sedang melakukan perawatan.',
      icon: Lock,
    },
    {
      key: 'jsa' as const,
      title: '5. JSA (Job Safety Analysis)',
      desc: 'Analisis risiko sengatan listrik tegangan tinggi, suhu panas knalpot, kebisingan, dan bahaya mekanik berputar.',
      icon: FileCheck,
    },
    {
      key: 'apd' as const,
      title: '6. Kelengkapan APD',
      desc: 'Menggunakan Helm Safety, Sepatu Safety (Sol Karet), Sarung Tangan Isolator, Masker, dan Ear Protection (Ear Muff).',
      icon: HardHat,
    },
    {
      key: 'verifikasi' as const,
      title: '7. Verifikasi Sebelum Operasi',
      desc: 'Tegangan baterai starter > 24V DC, valve bahan bakar terbuka, APAR standby di dekat unit, exhaust duct bersih.',
      icon: ShieldAlert,
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const genset = gensets.find((g) => g.id === selectedGensetId) || gensets[0];
    const allChecked = Object.values(checks).every((v) => v === true);

    const newRecord: SOPChecklistRecord = {
      id: `SOP-${Date.now().toString().slice(-6)}`,
      tanggal: new Date().toISOString().slice(0, 10),
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

    onSaveSOP(newRecord);
    setIsModalOpen(false);
    setCatatan('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-blue-600" />
            <span>SOP & Keselamatan Kerja K3 (Safety First)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pemeriksaan Area, Unit, Fluida, LOTO, JSA, APD, dan Verifikasi Sebelum Operasi Genset
          </p>
        </div>

        {canInput && (
          <button
            onClick={() => {
              setTeknisiName(activeUser.name);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Isi Checklist SOP / K3 Baru</span>
          </button>
        )}
      </div>

      {/* 7 SOP Guidelines Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {checklistItems.map((item, idx) => {
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

      {/* Historical SOP Records Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900">
            Riwayat Verifikasi Kepatuhan SOP & K3
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            Total {sopLogs.length} Catatan Keselamatan
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">No / ID</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Unit Genset</th>
                <th className="py-3 px-4">Teknisi Bertanggungjawab</th>
                <th className="py-3 px-4 text-center">Area</th>
                <th className="py-3 px-4 text-center">Unit</th>
                <th className="py-3 px-4 text-center">Fluida</th>
                <th className="py-3 px-4 text-center">LOTO</th>
                <th className="py-3 px-4 text-center">JSA</th>
                <th className="py-3 px-4 text-center">APD</th>
                <th className="py-3 px-4 text-center">Verifikasi</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sopLogs.map((log, idx) => {
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

                    <td className="py-3 px-4 text-center">
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW SOP CHECKLIST MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between sticky top-0 z-10">
              <h3 className="font-bold text-base text-slate-100">
                Form Verifikasi SOP & Keselamatan K3
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
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
                  <label className="font-semibold text-slate-700 block mb-1">Teknisi Pengawas (Isi Manual):</label>
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
                        className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
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
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  Simpan Verifikasi K3
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
