export type UserRole = 'TEKNISI' | 'KADISLOG' | 'ADMIN1' | 'ADMIN2';

export interface UserSession {
  role: UserRole;
  name: string;
  title: string;
}

export type ReadinessCondition = 'S' | 'US' | 'US Ringan'; // S = Siap, US = Tidak Siap/Rusak, US Ringan = Perlu Perhatian

export interface GensetItem {
  id: string;
  kode: string;
  nama: string;
  satuan: string;
  lokasi: string;
  merk: string;
  model: string;
  serialNumber: string;
  noMesin: string;
  noGenerator: string;
  kapasitas: string; // e.g. "350 KVA", "27,5 KW"
  engine: string;
  alternator: string;
  tahun: number;
  sistemPendingin: string;
  sistemBahanBakar: string;
  tegangan: string; // e.g. "380 / 220 V"
  frekuensi: string; // e.g. "50 Hz"
  phase: string; // e.g. "3 Phase"
  rpm: number; // e.g. 1500
  jamOperasi: number; // Running hours
  kondisi: ReadinessCondition;
  healthScore: number; // 0 - 100%
  riwayatSingkat?: string;
  photos: {
    unit?: string;
    nameplate?: string;
    engine?: string;
    panel?: string;
  };
  lastInspected?: string;
}

export interface InspectionParameters {
  mesin: string; // Normal / Getaran Halus / Bising
  oli: string; // Cukup & Bersih / Perlu Tambah / Keruh
  temperatur: number; // in °C (e.g., 78-85°C)
  getaran: string; // Normal / Sedang / Tinggi
  pendingin: string; // Radiator & Coolant Level Normal
  bbm: number; // Fuel Level in % (e.g., 85%)
  battery: number; // Battery Voltage (e.g., 24.8 V)
  charger: string; // Float Charger Normal / Standby
  tegangan: number; // Voltage output (e.g., 385 V)
  frekuensi: number; // Frequency in Hz (e.g., 50.1 Hz)
  alarm: string; // Normal (No Alarm) / Warning / Trip
  controller: string; // Deepsea / ComAp Normal / Standby Auto
  ats: string; // Standby Auto / Manual
}

export interface InspectionRecord {
  id: string;
  gensetId: string;
  gensetName: string;
  tanggal: string;
  teknisi: string;
  parameter: InspectionParameters;
  status: 'Normal' | 'Perhatian' | 'Gangguan';
  catatan: string;
  foto?: string;
}

export type MaintenanceFrequency = 'Harian' | 'Mingguan' | 'Bulanan' | 'Tahunan';
export type MaintenanceCategory = 'Ringan' | 'Sedang' | 'Berat';
export type ApprovalStatus = 'Menunggu Review' | 'Disetujui' | 'Ditolak';

export interface MaintenanceRecord {
  id: string;
  nomorPekerjaan: string; // e.g. "SPK-GMM-2026-001"
  gensetId: string;
  gensetName: string;
  tanggal: string;
  teknisi: string;
  frekuensi: MaintenanceFrequency;
  kategori: MaintenanceCategory;
  komponen: string;
  sparepart: string;
  biaya: number;
  hasilPekerjaan: string;
  fotoSebelum?: string;
  fotoProses?: string;
  fotoSesudah?: string;
  approvalStatus: ApprovalStatus;
  catatanKadislog?: string;
  kadislogName?: string;
  tanggalApproval?: string;
}

export interface IncidentRecord {
  id: string;
  nomorLaporan: string; // e.g. "LKP-2026-004"
  tanggal: string;
  gensetId: string;
  gensetName: string;
  kronologi: string;
  gejala: string;
  penyebab: string;
  dampak: string;
  tindakanPerbaikan: string;
  sparepart: string;
  hasilPengujian: string;
  status: 'Open' | 'Dalam Penanganan' | 'Selesai';
  pelapor: string;
  fotoKerusakan?: string;
  fotoAlarm?: string;
  fotoLapangan?: string;
  fotoPerbaikan?: string;
}

export interface SOPChecklistRecord {
  id: string;
  tanggal: string;
  teknisi: string;
  gensetId: string;
  gensetName: string;
  pemeriksaanArea: boolean;
  pemeriksaanUnit: boolean;
  pemeriksaanFluida: boolean;
  loto: boolean;
  jsa: boolean;
  apd: boolean;
  verifikasiSebelumOperasi: boolean;
  catatan: string;
  status: 'Lengkap & Aman' | 'Belum Lengkap';
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  userRole: UserRole;
  userName: string;
  action: string;
  details: string;
}

export type OperationalStatus = 'Beroperasi' | 'Selesai' | 'Uji Coba';
export type OperationalPurpose =
  | 'Pemadaman PLN'
  | 'Uji Coba Rutin / Warm-up'
  | 'Support Operasi & Acara Khusus'
  | 'Pemeliharaan / Running Test'
  | 'Darurat / Emergency';
export type OperationalMode = 'Manual' | 'Auto (AMF/ATS)' | 'Test Run';

export interface PreOperationChecklist {
  levelOli: 'Cukup / Normal' | 'Kurang' | 'Keruh / Perlu Penggantian';
  levelCoolant: 'Normal / Cukup' | 'Kurang';
  levelBBM: number; // %
  teganganBaterai: number; // VDC
  kondisiFisikRuangan: 'Bersih & Aman' | 'Terdapat Kebocoran' | 'Ventilasi Tertutup';
  posisiSelector: 'Manual' | 'Auto' | 'Off';
  kondisiBelt: 'Kencang & Baik' | 'Kendor' | 'Retak';
  statusKesiapan: 'Siap & Aman Dioperasikan' | 'Perlu Perhatian' | 'Tidak Siap (Batal)';
  catatanPra: string;
}

export interface RunningOperationParameters {
  teganganL1L2: number; // V
  frekuensi: number; // Hz
  rpm: number; // RPM
  tekananOli: number; // Bar
  temperaturMesin: number; // °C
  arusBeban: number; // Ampere
  persenBeban: number; // %
  suaraDanGetaran: 'Halus & Normal' | 'Getaran Sedang' | 'Bising / Getaran Abnormal';
  kondisiAsap: 'Normal / Bersih' | 'Asap Hitam' | 'Asap Putih';
  catatanSaat: string;
}

export interface PostOperationChecklist {
  coolingDownDurasiMenit: number; // menit
  hourMeterAkhir: number; // jam
  levelBBMAkhir: number; // %
  estimasiKonsumsiSolarLiter: number; // liter
  cekKebocoran: 'Nihil Kebocoran (Aman)' | 'Rembesan Oli' | 'Tetesan Coolant' | 'Bocor BBM';
  kebersihanDanKunci: 'Unit Bersih & Ruang Terkunci' | 'Perlu Pembersihan';
  posisiSelectorAkhir: 'Standby Auto (AMF/ATS)' | 'Manual' | 'Off';
  chargerAkiNormal: boolean;
  kondisiAkhirGenset: 'Siap Siaga / Standby Normal' | 'Perlu Pemeliharaan' | 'Ada Temuan Gangguan';
  catatanPasca: string;
}

export interface GensetOperationalRecord {
  id: string;
  nomorLog: string;
  gensetId: string;
  gensetName: string;
  tanggal: string;
  waktuMulai: string;
  waktuSelesai?: string;
  durasiOperasiMenit: number;
  hourMeterAwal: number;
  hourMeterAkhir: number;
  keperluan: OperationalPurpose;
  modeOperasi: OperationalMode;
  operator: string;
  petugasPendamping?: string;
  status: OperationalStatus;
  praOperasi: PreOperationChecklist;
  saatOperasi: RunningOperationParameters;
  pascaOperasi: PostOperationChecklist;
  catatanKhusus?: string;
  fotoDokumentasi?: string;
  updatedAt?: string;
}
