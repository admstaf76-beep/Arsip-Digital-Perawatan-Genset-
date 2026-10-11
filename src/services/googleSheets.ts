import {
  GensetItem,
  InspectionRecord,
  MaintenanceRecord,
  IncidentRecord,
  GensetOperationalRecord,
} from '../types/genset';

const SPREADSHEET_ID_KEY = 'gmm_google_spreadsheet_id';
const AUTO_SYNC_KEY = 'gmm_google_auto_sync_enabled';
const LAST_SYNC_KEY = 'gmm_google_last_sync_timestamp';

export const getSavedSpreadsheetId = (): string => {
  return localStorage.getItem(SPREADSHEET_ID_KEY) || '';
};

export const setSavedSpreadsheetId = (id: string) => {
  if (id) {
    localStorage.setItem(SPREADSHEET_ID_KEY, id.trim());
  } else {
    localStorage.removeItem(SPREADSHEET_ID_KEY);
  }
};

export const isAutoSyncEnabled = (): boolean => {
  const val = localStorage.getItem(AUTO_SYNC_KEY);
  return val === null ? true : val === 'true'; // Default true
};

export const setAutoSyncEnabled = (enabled: boolean) => {
  localStorage.setItem(AUTO_SYNC_KEY, String(enabled));
};

export const getLastSyncTime = (): string | null => {
  return localStorage.getItem(LAST_SYNC_KEY);
};

export const setLastSyncTime = () => {
  const now = new Date().toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  localStorage.setItem(LAST_SYNC_KEY, now);
};

// Create a new centralized Google Spreadsheet for Genset Readiness & Maintenance
export const createGensetSpreadsheet = async (
  accessToken: string,
  title: string = 'Sistem Kesiapan & Pemeliharaan Genset (GMM) - Satuan Denma'
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> => {
  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
      },
      sheets: [
        {
          properties: {
            title: 'Inspeksi_Kondisi',
            gridProperties: { frozenRowCount: 1 },
          },
        },
        {
          properties: {
            title: 'Pemeliharaan_SPK',
            gridProperties: { frozenRowCount: 1 },
          },
        },
        {
          properties: {
            title: 'Laporan_Gangguan',
            gridProperties: { frozenRowCount: 1 },
          },
        },
        {
          properties: {
            title: 'Master_Genset',
            gridProperties: { frozenRowCount: 1 },
          },
        },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gagal membuat Spreadsheet di Google Drive: ${errText}`);
  }

  const data = await response.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = data.spreadsheetUrl;

  setSavedSpreadsheetId(spreadsheetId);
  return { spreadsheetId, spreadsheetUrl };
};

// Verify if spreadsheet exists and is accessible
export const verifySpreadsheetAccess = async (
  accessToken: string,
  spreadsheetId: string
): Promise<{ valid: boolean; title?: string }> => {
  try {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title,sheets.properties.title`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    if (!res.ok) return { valid: false };
    const data = await res.json();
    return { valid: true, title: data.properties?.title };
  } catch {
    return { valid: false };
  }
};

// Full Initial / Batch Synchronization
export const syncAllToGoogleSheets = async (
  accessToken: string,
  spreadsheetId: string,
  data: {
    gensets: GensetItem[];
    inspections: InspectionRecord[];
    maintenances: MaintenanceRecord[];
    incidents: IncidentRecord[];
  }
): Promise<{ success: boolean; message: string }> => {
  // Ensure the 4 sheets exist
  try {
    const metaRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (metaRes.ok) {
      const meta = await metaRes.json();
      const existingSheetTitles: string[] = (meta.sheets || []).map(
        (s: any) => s.properties?.title
      );
      const neededSheets = [
        'Inspeksi_Kondisi',
        'Pemeliharaan_SPK',
        'Laporan_Gangguan',
        'Master_Genset',
      ];
      const sheetsToAdd = neededSheets.filter((t) => !existingSheetTitles.includes(t));

      if (sheetsToAdd.length > 0) {
        await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              requests: sheetsToAdd.map((title) => ({
                addSheet: {
                  properties: { title, gridProperties: { frozenRowCount: 1 } },
                },
              })),
            }),
          }
        );
      }
    }

    // 1. Prepare Inspeksi_Kondisi data
    const inspectionHeader = [
      'ID Inspeksi',
      'Tanggal',
      'Kode Genset',
      'Nama Genset',
      'Teknisi',
      'Status Kesiapan',
      'Temp (°C)',
      'BBM (%)',
      'Baterai (V)',
      'Tegangan L-L (V)',
      'Frekuensi (Hz)',
      'Kondisi Mesin',
      'Kondisi Oli',
      'Getaran Mesin',
      'Sistem Pendingin',
      'Charger Baterai',
      'Status Alarm',
      'Modul Controller',
      'Panel ATS',
      'Catatan Lapangan',
    ];

    const inspectionRows = data.inspections.map((i) => [
      i.id,
      i.tanggal,
      i.gensetId,
      i.gensetName,
      i.teknisi,
      i.status,
      i.parameter.temperatur,
      i.parameter.bbm,
      i.parameter.battery,
      i.parameter.tegangan,
      i.parameter.frekuensi,
      i.parameter.mesin,
      i.parameter.oli,
      i.parameter.getaran,
      i.parameter.pendingin,
      i.parameter.charger,
      i.parameter.alarm,
      i.parameter.controller,
      i.parameter.ats,
      i.catatan || '-',
    ]);

    // 2. Prepare Pemeliharaan_SPK data
    const maintenanceHeader = [
      'No. SPK',
      'Tanggal',
      'Kode Genset',
      'Nama Genset',
      'Teknisi',
      'Frekuensi',
      'Kategori',
      'Komponen',
      'Suku Cadang / Sparepart',
      'Biaya (Rp)',
      'Hasil Pekerjaan & Uji',
      'Status Approval',
      'Kadislog Approval',
      'Waktu Approval',
      'Catatan Kadislog',
    ];

    const maintenanceRows = data.maintenances.map((m) => [
      m.nomorPekerjaan,
      m.tanggal,
      m.gensetId,
      m.gensetName,
      m.teknisi,
      m.frekuensi,
      m.kategori,
      m.komponen,
      m.sparepart,
      m.biaya,
      m.hasilPekerjaan,
      m.approvalStatus,
      m.kadislogName || '-',
      m.tanggalApproval || '-',
      m.catatanKadislog || '-',
    ]);

    // 3. Prepare Laporan_Gangguan data
    const incidentHeader = [
      'No. Laporan',
      'Tanggal',
      'Kode Genset',
      'Nama Genset',
      'Pelapor',
      'Status Gangguan',
      'Gejala Kerusakan',
      'Penyebab Teknis',
      'Dampak Operasional',
      'Tindakan Perbaikan',
      'Suku Cadang Pengganti',
      'Hasil Pengujian',
      'Kronologi Lengkap',
    ];

    const incidentRows = data.incidents.map((inc) => [
      inc.nomorLaporan,
      inc.tanggal,
      inc.gensetId,
      inc.gensetName,
      inc.pelapor,
      inc.status,
      inc.gejala,
      inc.penyebab,
      inc.dampak,
      inc.tindakanPerbaikan,
      inc.sparepart || '-',
      inc.hasilPengujian,
      inc.kronologi,
    ]);

    // 4. Prepare Master_Genset data
    const masterHeader = [
      'Kode Unit',
      'Nama Genset',
      'Satuan',
      'Lokasi',
      'Kapasitas',
      'Merk & Model',
      'Tahun',
      'Running Hours (Jam)',
      'Kondisi',
      'Health Score (%)',
      'No. Mesin / Seri',
      'Generator / Alternator',
      'Sistem Pendingin',
      'Tegangan & Fasa',
      'Pemeriksaan Terakhir',
    ];

    const masterRows = data.gensets.map((g) => [
      g.kode,
      g.nama,
      g.satuan,
      g.lokasi,
      g.kapasitas,
      `${g.merk} ${g.model}`,
      g.tahun,
      g.jamOperasi,
      g.kondisi,
      `${g.healthScore}%`,
      `${g.noMesin || '-'} / SN: ${g.serialNumber || '-'}`,
      g.alternator,
      g.sistemPendingin,
      `${g.tegangan} (${g.phase})`,
      g.lastInspected || '-',
    ]);

    // Write all ranges using values:batchUpdate
    const payload = {
      valueInputOption: 'USER_ENTERED',
      data: [
        {
          range: 'Inspeksi_Kondisi!A1:T',
          values: [inspectionHeader, ...inspectionRows],
        },
        {
          range: 'Pemeliharaan_SPK!A1:O',
          values: [maintenanceHeader, ...maintenanceRows],
        },
        {
          range: 'Laporan_Gangguan!A1:M',
          values: [incidentHeader, ...incidentRows],
        },
        {
          range: 'Master_Genset!A1:O',
          values: [masterHeader, ...masterRows],
        },
      ],
    };

    const writeRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!writeRes.ok) {
      const err = await writeRes.text();
      throw new Error(`Gagal menulis data ke Google Sheets: ${err}`);
    }

    setLastSyncTime();
    return {
      success: true,
      message: 'Seluruh data inspeksi, pemeliharaan, gangguan, dan master berhasil disinkronkan ke Google Sheets.',
    };
  } catch (error: any) {
    console.error('Batch sync error:', error);
    throw error;
  }
};

// Real-time: Append a single Inspection record
export const appendInspectionToSheet = async (
  accessToken: string,
  spreadsheetId: string,
  record: InspectionRecord
) => {
  const row = [
    record.id,
    record.tanggal,
    record.gensetId,
    record.gensetName,
    record.teknisi,
    record.status,
    record.parameter.temperatur,
    record.parameter.bbm,
    record.parameter.battery,
    record.parameter.tegangan,
    record.parameter.frekuensi,
    record.parameter.mesin,
    record.parameter.oli,
    record.parameter.getaran,
    record.parameter.pendingin,
    record.parameter.charger,
    record.parameter.alarm,
    record.parameter.controller,
    record.parameter.ats,
    record.catatan || '-',
  ];

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Inspeksi_Kondisi!A:T:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [row] }),
    }
  );
  setLastSyncTime();
};

// Real-time: Append a single Maintenance record
export const appendMaintenanceToSheet = async (
  accessToken: string,
  spreadsheetId: string,
  record: MaintenanceRecord
) => {
  const row = [
    record.nomorPekerjaan,
    record.tanggal,
    record.gensetId,
    record.gensetName,
    record.teknisi,
    record.frekuensi,
    record.kategori,
    record.komponen,
    record.sparepart,
    record.biaya,
    record.hasilPekerjaan,
    record.approvalStatus,
    record.kadislogName || '-',
    record.tanggalApproval || '-',
    record.catatanKadislog || '-',
  ];

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Pemeliharaan_SPK!A:O:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [row] }),
    }
  );
  setLastSyncTime();
};

// Real-time: Append a single Incident record
export const appendIncidentToSheet = async (
  accessToken: string,
  spreadsheetId: string,
  record: IncidentRecord
) => {
  const row = [
    record.nomorLaporan,
    record.tanggal,
    record.gensetId,
    record.gensetName,
    record.pelapor,
    record.status,
    record.gejala,
    record.penyebab,
    record.dampak,
    record.tindakanPerbaikan,
    record.sparepart || '-',
    record.hasilPengujian,
    record.kronologi,
  ];

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Laporan_Gangguan!A:M:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [row] }),
    }
  );
  setLastSyncTime();
};

// Real-time: Append a single Operational record with 3-stage inspection data
export const appendOperationalToSheet = async (
  accessToken: string,
  spreadsheetId: string,
  record: GensetOperationalRecord
) => {
  const row = [
    record.nomorLog,
    record.tanggal,
    record.waktuMulai,
    record.waktuSelesai || (record.status === 'Beroperasi' ? 'Running' : '-'),
    record.durasiOperasiMenit,
    record.gensetId,
    record.gensetName,
    record.keperluan,
    record.modeOperasi,
    record.operator,
    record.petugasPendamping || '-',
    record.hourMeterAwal,
    record.hourMeterAkhir,
    record.status,
    // Pra-Operasi
    record.praOperasi.levelOli,
    record.praOperasi.levelCoolant,
    record.praOperasi.levelBBM,
    record.praOperasi.teganganBaterai,
    record.praOperasi.kondisiFisikRuangan,
    record.praOperasi.statusKesiapan,
    // Saat Operasi
    record.saatOperasi.teganganL1L2,
    record.saatOperasi.frekuensi,
    record.saatOperasi.rpm,
    record.saatOperasi.tekananOli,
    record.saatOperasi.temperaturMesin,
    record.saatOperasi.arusBeban,
    record.saatOperasi.persenBeban,
    record.saatOperasi.suaraDanGetaran,
    record.saatOperasi.kondisiAsap,
    // Pasca-Operasi
    record.pascaOperasi.coolingDownDurasiMenit,
    record.pascaOperasi.levelBBMAkhir,
    record.pascaOperasi.estimasiKonsumsiSolarLiter,
    record.pascaOperasi.cekKebocoran,
    record.pascaOperasi.posisiSelectorAkhir,
    record.pascaOperasi.kondisiAkhirGenset,
    record.catatanKhusus || '-',
  ];

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Log_Operasional!A:AJ:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [row] }),
    }
  );
  setLastSyncTime();
};

