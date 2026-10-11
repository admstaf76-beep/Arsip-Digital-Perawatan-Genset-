import {
  GensetItem,
  InspectionRecord,
  MaintenanceRecord,
  IncidentRecord,
  SOPChecklistRecord,
  AuditLogItem,
  UserSession,
  GensetOperationalRecord,
} from '../types/genset';
import {
  INITIAL_GENSETS,
  INITIAL_INSPECTIONS,
  INITIAL_MAINTENANCES,
  INITIAL_INCIDENTS,
  INITIAL_SOP_LOGS,
  INITIAL_AUDIT_LOGS,
  INITIAL_OPERATIONAL_RECORDS,
} from '../data/initialData';

const KEYS = {
  GENSETS: 'gmm_gensets_v2',
  INSPECTIONS: 'gmm_inspections_v2',
  MAINTENANCES: 'gmm_maintenances_v2',
  INCIDENTS: 'gmm_incidents_v2',
  OPERATIONAL: 'gmm_operational_v2',
  SOP: 'gmm_sop_v2',
  AUDIT: 'gmm_audit_v2',
  USER: 'gmm_active_user_v2',
  CLOUD_SYNC: 'gmm_cloud_sync_time_v2',
};

export const getStoredGensets = (): GensetItem[] => {
  try {
    const raw = localStorage.getItem(KEYS.GENSETS);
    if (!raw) {
      localStorage.setItem(KEYS.GENSETS, JSON.stringify(INITIAL_GENSETS));
      return INITIAL_GENSETS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_GENSETS;
  }
};

export const saveStoredGensets = (items: GensetItem[]) => {
  localStorage.setItem(KEYS.GENSETS, JSON.stringify(items));
};

export const getStoredInspections = (): InspectionRecord[] => {
  try {
    const raw = localStorage.getItem(KEYS.INSPECTIONS);
    if (!raw) {
      localStorage.setItem(KEYS.INSPECTIONS, JSON.stringify(INITIAL_INSPECTIONS));
      return INITIAL_INSPECTIONS;
    }
    const parsed: InspectionRecord[] = JSON.parse(raw);
    // Ensure all rich initial records exist by id
    const existingIds = new Set(parsed.map((p) => p.id));
    const missing = INITIAL_INSPECTIONS.filter((i) => !existingIds.has(i.id));
    if (missing.length > 0) {
      const merged = [...parsed, ...missing];
      localStorage.setItem(KEYS.INSPECTIONS, JSON.stringify(merged));
      return merged;
    }
    return parsed;
  } catch {
    return INITIAL_INSPECTIONS;
  }
};

export const saveStoredInspections = (items: InspectionRecord[]) => {
  localStorage.setItem(KEYS.INSPECTIONS, JSON.stringify(items));
};

export const getStoredMaintenances = (): MaintenanceRecord[] => {
  try {
    const raw = localStorage.getItem(KEYS.MAINTENANCES);
    if (!raw) {
      localStorage.setItem(KEYS.MAINTENANCES, JSON.stringify(INITIAL_MAINTENANCES));
      return INITIAL_MAINTENANCES;
    }
    const parsed: MaintenanceRecord[] = JSON.parse(raw);
    const existingIds = new Set(parsed.map((p) => p.id));
    const missing = INITIAL_MAINTENANCES.filter((m) => !existingIds.has(m.id));
    if (missing.length > 0) {
      const merged = [...parsed, ...missing];
      localStorage.setItem(KEYS.MAINTENANCES, JSON.stringify(merged));
      return merged;
    }
    return parsed;
  } catch {
    return INITIAL_MAINTENANCES;
  }
};

export const saveStoredMaintenances = (items: MaintenanceRecord[]) => {
  localStorage.setItem(KEYS.MAINTENANCES, JSON.stringify(items));
};

export const getStoredIncidents = (): IncidentRecord[] => {
  try {
    const raw = localStorage.getItem(KEYS.INCIDENTS);
    if (!raw) {
      localStorage.setItem(KEYS.INCIDENTS, JSON.stringify(INITIAL_INCIDENTS));
      return INITIAL_INCIDENTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_INCIDENTS;
  }
};

export const saveStoredIncidents = (items: IncidentRecord[]) => {
  localStorage.setItem(KEYS.INCIDENTS, JSON.stringify(items));
};

export const getStoredOperational = (): GensetOperationalRecord[] => {
  try {
    const raw = localStorage.getItem(KEYS.OPERATIONAL);
    if (!raw) {
      localStorage.setItem(KEYS.OPERATIONAL, JSON.stringify(INITIAL_OPERATIONAL_RECORDS));
      return INITIAL_OPERATIONAL_RECORDS;
    }
    const parsed: GensetOperationalRecord[] = JSON.parse(raw);
    const existingIds = new Set(parsed.map((p) => p.id));
    const missing = INITIAL_OPERATIONAL_RECORDS.filter((o) => !existingIds.has(o.id));
    if (missing.length > 0) {
      const merged = [...parsed, ...missing];
      localStorage.setItem(KEYS.OPERATIONAL, JSON.stringify(merged));
      return merged;
    }
    return parsed;
  } catch {
    return INITIAL_OPERATIONAL_RECORDS;
  }
};

export const saveStoredOperational = (items: GensetOperationalRecord[]) => {
  localStorage.setItem(KEYS.OPERATIONAL, JSON.stringify(items));
};

export const getStoredSOP = (): SOPChecklistRecord[] => {
  try {
    const raw = localStorage.getItem(KEYS.SOP);
    if (!raw) {
      localStorage.setItem(KEYS.SOP, JSON.stringify(INITIAL_SOP_LOGS));
      return INITIAL_SOP_LOGS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_SOP_LOGS;
  }
};

export const saveStoredSOP = (items: SOPChecklistRecord[]) => {
  localStorage.setItem(KEYS.SOP, JSON.stringify(items));
};

export const getStoredAudit = (): AuditLogItem[] => {
  try {
    const raw = localStorage.getItem(KEYS.AUDIT);
    if (!raw) {
      localStorage.setItem(KEYS.AUDIT, JSON.stringify(INITIAL_AUDIT_LOGS));
      return INITIAL_AUDIT_LOGS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_AUDIT_LOGS;
  }
};

export const logAuditEvent = (user: UserSession, action: string, details: string) => {
  const current = getStoredAudit();
  const dateStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
  const newItem: AuditLogItem = {
    id: `LOG-${Date.now()}`,
    timestamp: dateStr,
    userRole: user.role,
    userName: user.name,
    action,
    details,
  };
  const updated = [newItem, ...current];
  localStorage.setItem(KEYS.AUDIT, JSON.stringify(updated.slice(0, 100)));
  return updated;
};

export const getActiveUser = (): UserSession => {
  try {
    const raw = localStorage.getItem(KEYS.USER);
    if (!raw) {
      const defaultUser: UserSession = {
        role: 'TEKNISI',
        name: 'Teknisi',
        title: 'Teknisi Pemeliharaan Fasint',
      };
      localStorage.setItem(KEYS.USER, JSON.stringify(defaultUser));
      return defaultUser;
    }
    return JSON.parse(raw);
  } catch {
    return {
      role: 'TEKNISI',
      name: 'Teknisi',
      title: 'Teknisi Pemeliharaan Fasint',
    };
  }
};

export const setActiveUser = (user: UserSession) => {
  localStorage.setItem(KEYS.USER, JSON.stringify(user));
};

export const exportFullDatabaseAsJSON = () => {
  const data = {
    app: 'Genset Monitoring & Maintenance Management System (GMM)',
    exportedAt: new Date().toISOString(),
    gensets: getStoredGensets(),
    inspections: getStoredInspections(),
    maintenances: getStoredMaintenances(),
    incidents: getStoredIncidents(),
    sopLogs: getStoredSOP(),
    auditLogs: getStoredAudit(),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup_database_genset_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportGensetToCSV = (items: GensetItem[]) => {
  const headers = [
    'ID Genset',
    'Kode',
    'Nama Genset',
    'Satuan',
    'Lokasi',
    'Merk',
    'Model',
    'No Seri',
    'No Mesin',
    'No Generator',
    'Kapasitas',
    'Engine',
    'Alternator',
    'Tahun',
    'Tegangan',
    'Frekuensi',
    'Phase',
    'RPM',
    'Jam Operasi (Hour Meter)',
    'Kondisi (S/US/US Ringan)',
    'Health Score (%)',
    'Riwayat Singkat',
  ];

  const rows = items.map((g) => [
    `"${g.id}"`,
    `"${g.kode}"`,
    `"${g.nama}"`,
    `"${g.satuan}"`,
    `"${g.lokasi}"`,
    `"${g.merk}"`,
    `"${g.model}"`,
    `"${g.serialNumber}"`,
    `"${g.noMesin}"`,
    `"${g.noGenerator}"`,
    `"${g.kapasitas}"`,
    `"${g.engine}"`,
    `"${g.alternator}"`,
    g.tahun,
    `"${g.tegangan}"`,
    `"${g.frekuensi}"`,
    `"${g.phase}"`,
    g.rpm,
    g.jamOperasi,
    `"${g.kondisi}"`,
    g.healthScore,
    `"${(g.riwayatSingkat || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `master_data_genset_spreadsheet_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
