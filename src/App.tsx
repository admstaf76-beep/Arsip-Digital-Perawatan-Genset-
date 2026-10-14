import React, { useState, useEffect } from 'react';
import {
  GensetItem,
  InspectionRecord,
  MaintenanceRecord,
  IncidentRecord,
  SOPChecklistRecord,
  AuditLogItem,
  UserSession,
  ReadinessCondition,
  GensetOperationalRecord,
} from './types/genset';
import {
  getStoredGensets,
  saveStoredGensets,
  getStoredInspections,
  saveStoredInspections,
  getStoredMaintenances,
  saveStoredMaintenances,
  getStoredIncidents,
  saveStoredIncidents,
  getStoredOperational,
  saveStoredOperational,
  getStoredSOP,
  saveStoredSOP,
  getStoredAudit,
  logAuditEvent,
  getActiveUser,
  setActiveUser,
  exportFullDatabaseAsJSON,
  exportGensetToCSV,
} from './services/storage';

import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { MasterGenset } from './components/MasterGenset';
import { OperasionalGenset } from './components/OperasionalGenset';
import { PemeriksaanKondisi } from './components/PemeriksaanKondisi';
import { PerawatanGenset } from './components/PerawatanGenset';
import { KerusakanPerbaikan } from './components/KerusakanPerbaikan';
import { SopK3 } from './components/SopK3';
import { ApprovalSystem } from './components/ApprovalSystem';
import { ExportLaporan } from './components/ExportLaporan';
import { LoginModal } from './components/LoginModal';
import { AuditLogModal } from './components/AuditLogModal';
import { GoogleSheetsSyncModal } from './components/GoogleSheetsSyncModal';
import { getAccessToken, initAuth } from './services/googleAuth';
import {
  getSavedSpreadsheetId,
  isAutoSyncEnabled,
  appendInspectionToSheet,
  appendMaintenanceToSheet,
  appendIncidentToSheet,
  appendOperationalToSheet,
} from './services/googleSheets';

export default function App() {
  // Primary Persistent State
  const [gensets, setGensets] = useState<GensetItem[]>(getStoredGensets);
  const [inspections, setInspections] = useState<InspectionRecord[]>(getStoredInspections);
  const [maintenances, setMaintenances] = useState<MaintenanceRecord[]>(getStoredMaintenances);
  const [incidents, setIncidents] = useState<IncidentRecord[]>(getStoredIncidents);
  const [operationalRecords, setOperationalRecords] = useState<GensetOperationalRecord[]>(getStoredOperational);
  const [sopLogs, setSopLogs] = useState<SOPChecklistRecord[]>(getStoredSOP);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(getStoredAudit);
  const [activeUser, setUser] = useState<UserSession>(getActiveUser);

  // Active View Tab
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Modals & UI States
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [selectedGensetDetail, setSelectedGensetDetail] = useState<GensetItem | null>(null);

  // Sub-modal triggers for rapid input
  const [isNewInspectionOpen, setIsNewInspectionOpen] = useState(false);
  const [isNewMaintenanceOpen, setIsNewMaintenanceOpen] = useState(false);
  const [isNewIncidentOpen, setIsNewIncidentOpen] = useState(false);
  const [isGoogleSheetsModalOpen, setIsGoogleSheetsModalOpen] = useState(false);

  // Initialize Auth state listener
  useEffect(() => {
    initAuth();
  }, []);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Sync state changes with persistence
  useEffect(() => {
    saveStoredGensets(gensets);
  }, [gensets]);

  useEffect(() => {
    saveStoredInspections(inspections);
  }, [inspections]);

  useEffect(() => {
    saveStoredMaintenances(maintenances);
  }, [maintenances]);

  useEffect(() => {
    saveStoredIncidents(incidents);
  }, [incidents]);

  useEffect(() => {
    saveStoredSOP(sopLogs);
  }, [sopLogs]);

  // Handler for Role Switching
  const handleSelectUser = (newUser: UserSession) => {
    setUser(newUser);
    setActiveUser(newUser);
    const updatedLogs = logAuditEvent(
      newUser,
      'Ganti Akun Pengguna',
      `Login berhasil sebagai ${newUser.role} (${newUser.name})`
    );
    setAuditLogs(updatedLogs);
    showToast(`Berhasil login sebagai ${newUser.role}: ${newUser.name}`);
  };

  // Handler for Genset Master Save / Update
  const handleSaveGenset = (genset: GensetItem, isNew: boolean) => {
    if (isNew) {
      const updated = [genset, ...gensets];
      setGensets(updated);
      const updatedLogs = logAuditEvent(
        activeUser,
        'Tambah Master Genset',
        `Menambahkan unit ${genset.nama} (${genset.kode}) di ${genset.lokasi}`
      );
      setAuditLogs(updatedLogs);
      showToast(`Unit genset ${genset.nama} berhasil ditambahkan.`);
    } else {
      const updated = gensets.map((g) => (g.id === genset.id ? genset : g));
      setGensets(updated);
      const updatedLogs = logAuditEvent(
        activeUser,
        'Update Master Genset',
        `Memperbarui spesifikasi ${genset.nama} (${genset.kode})`
      );
      setAuditLogs(updatedLogs);
      showToast(`Data genset ${genset.nama} berhasil diperbarui.`);
    }
  };

  // Handler for Genset Delete
  const handleDeleteGenset = (id: string) => {
    const target = gensets.find((g) => g.id === id);
    if (!target) return;
    const updated = gensets.filter((g) => g.id !== id);
    setGensets(updated);
    saveStoredGensets(updated);
    if (selectedGensetDetail?.id === id) {
      setSelectedGensetDetail(null);
    }
    const updatedLogs = logAuditEvent(
      activeUser,
      'Hapus Master Genset',
      `Menghapus data unit ${target.nama} (${target.kode})`
    );
    setAuditLogs(updatedLogs);
    showToast(`Unit ${target.nama} telah dihapus.`);
  };

  // Handler for Inspection Checklist Save / Edit
  const handleSaveInspection = (record: InspectionRecord, isNew: boolean = true) => {
    let updatedInspections: InspectionRecord[];
    if (isNew) {
      updatedInspections = [record, ...inspections];
    } else {
      updatedInspections = inspections.map((i) => (i.id === record.id ? record : i));
    }
    setInspections(updatedInspections);
    saveStoredInspections(updatedInspections);

    // Automatically recalculate / adjust genset health score and condition
    let newScore = 85;
    if (record.status === 'Normal') newScore = 92;
    if (record.status === 'Perhatian') newScore = 70;
    if (record.status === 'Gangguan') newScore = 40;

    const updatedGensets = gensets.map((g) => {
      if (g.id === record.gensetId) {
        return {
          ...g,
          lastInspected: record.tanggal,
          healthScore: newScore,
          kondisi: (record.status === 'Gangguan'
            ? 'US'
            : record.status === 'Perhatian'
            ? 'US Ringan'
            : 'S') as ReadinessCondition,
        };
      }
      return g;
    });
    setGensets(updatedGensets);
    saveStoredGensets(updatedGensets);

    const updatedLogs = logAuditEvent(
      activeUser,
      isNew ? 'Input Pemeriksaan 13 Parameter' : 'Edit Pemeriksaan 13 Parameter',
      `Inspeksi ${record.gensetName} (${record.id}) status: ${record.status} oleh ${record.teknisi}`
    );
    setAuditLogs(updatedLogs);
    showToast(isNew ? `Checklist pemeriksaan ${record.gensetName} berhasil disimpan.` : `Data pemeriksaan ${record.id} berhasil diperbarui.`);

    // Real-time synchronization to Google Sheets if configured
    if (isAutoSyncEnabled()) {
      getAccessToken().then((token) => {
        const sheetId = getSavedSpreadsheetId();
        if (token && sheetId) {
          appendInspectionToSheet(token, sheetId, record)
            .then(() => {
              showToast(`Data inspeksi ${record.gensetName} otomatis disinkronkan ke Google Sheets.`);
            })
            .catch((err) => {
              console.warn('Real-time Google Sheets sync error:', err);
            });
        }
      });
    }
  };

  // Handler for Deleting Inspection Record
  const handleDeleteInspection = (id: string) => {
    const target = inspections.find((i) => i.id === id);
    const updated = inspections.filter((i) => i.id !== id);
    setInspections(updated);
    saveStoredInspections(updated);
    const updatedLogs = logAuditEvent(
      activeUser,
      'Hapus Pemeriksaan 13 Parameter',
      `Menghapus checklist pemeriksaan ID: ${id} (${target?.gensetName || ''})`
    );
    setAuditLogs(updatedLogs);
    showToast('Data pemeriksaan kondisi berhasil dihapus.');
  };

  // Handler for Maintenance Work Order Save / Edit
  const handleSaveMaintenance = (record: MaintenanceRecord, isNew: boolean = true) => {
    let updated: MaintenanceRecord[];
    if (isNew) {
      updated = [record, ...maintenances];
    } else {
      updated = maintenances.map((m) => (m.id === record.id ? record : m));
    }
    setMaintenances(updated);
    saveStoredMaintenances(updated);

    const updatedLogs = logAuditEvent(
      activeUser,
      isNew ? 'Submit SPK Perawatan (CMMS)' : 'Edit SPK Perawatan (CMMS)',
      `Perawatan ${record.komponen} pada ${record.gensetName} (${record.nomorPekerjaan})`
    );
    setAuditLogs(updatedLogs);
    showToast(isNew ? `SPK ${record.nomorPekerjaan} berhasil disubmit ke antrean Kadislog.` : `Data SPK ${record.nomorPekerjaan} berhasil diperbarui.`);

    // Real-time synchronization to Google Sheets if configured
    if (isAutoSyncEnabled()) {
      getAccessToken().then((token) => {
        const sheetId = getSavedSpreadsheetId();
        if (token && sheetId) {
          appendMaintenanceToSheet(token, sheetId, record)
            .then(() => {
              showToast(`SPK ${record.nomorPekerjaan} otomatis disinkronkan ke Google Sheets.`);
            })
            .catch((err) => {
              console.warn('Real-time Google Sheets sync error:', err);
            });
        }
      });
    }
  };

  // Handler for Deleting Maintenance Record
  const handleDeleteMaintenance = (id: string) => {
    const target = maintenances.find((m) => m.id === id);
    const updated = maintenances.filter((m) => m.id !== id);
    setMaintenances(updated);
    saveStoredMaintenances(updated);
    const updatedLogs = logAuditEvent(
      activeUser,
      'Hapus SPK Perawatan (CMMS)',
      `Menghapus catatan SPK: ${target?.nomorPekerjaan || id} (${target?.gensetName || ''})`
    );
    setAuditLogs(updatedLogs);
    showToast('Catatan perawatan berhasil dihapus.');
  };

  // Handler for Kadislog Approval
  const handleApproveMaintenance = (id: string, notes: string) => {
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    let targetSPK = '';
    const updated = maintenances.map((m) => {
      if (m.id === id) {
        targetSPK = m.nomorPekerjaan;
        return {
          ...m,
          approvalStatus: 'Disetujui' as const,
          catatanKadislog: notes || 'Pekerjaan telah diperiksa dan disetujui sesuai SOP.',
          kadislogName: activeUser.name,
          tanggalApproval: nowStr,
        };
      }
      return m;
    });
    setMaintenances(updated);
    saveStoredMaintenances(updated);

    const updatedLogs = logAuditEvent(
      activeUser,
      'Approval Disetujui (Kadislog)',
      `Menyetujui pekerjaan SPK ${targetSPK}. Catatan: ${notes || 'Sesuai standar'}`
    );
    setAuditLogs(updatedLogs);
    showToast(`Pekerjaan ${targetSPK} telah DISETUJUI oleh Kadislog.`);
  };

  // Handler for Kadislog Rejection
  const handleRejectMaintenance = (id: string, notes: string) => {
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    let targetSPK = '';
    const updated = maintenances.map((m) => {
      if (m.id === id) {
        targetSPK = m.nomorPekerjaan;
        return {
          ...m,
          approvalStatus: 'Ditolak' as const,
          catatanKadislog: notes || 'Ditolak untuk revisi pekerjaan / klarifikasi teknis.',
          kadislogName: activeUser.name,
          tanggalApproval: nowStr,
        };
      }
      return m;
    });
    setMaintenances(updated);
    saveStoredMaintenances(updated);

    const updatedLogs = logAuditEvent(
      activeUser,
      'Approval Ditolak (Kadislog)',
      `Menolak pekerjaan SPK ${targetSPK}. Alasan: ${notes || 'Perlu perbaikan'}`
    );
    setAuditLogs(updatedLogs);
    showToast(`Pekerjaan ${targetSPK} DITOLAK. Teknisi perlu melakukan perbaikan.`);
  };

  // Handler for Incident / Fault Report Save / Edit
  const handleSaveIncident = (incident: IncidentRecord, isNew: boolean = true) => {
    let updated: IncidentRecord[];
    if (isNew) {
      updated = [incident, ...incidents];
    } else {
      updated = incidents.map((inc) => (inc.id === incident.id ? incident : inc));
    }
    setIncidents(updated);
    saveStoredIncidents(updated);

    // Update genset condition to US if critical
    const updatedGensets = gensets.map((g) => {
      if (g.id === incident.gensetId) {
        return {
          ...g,
          kondisi: (incident.status === 'Selesai' ? 'S' : 'US') as ReadinessCondition,
          healthScore: incident.status === 'Selesai' ? 85 : Math.min(g.healthScore, 50),
        };
      }
      return g;
    });
    setGensets(updatedGensets);
    saveStoredGensets(updatedGensets);

    const updatedLogs = logAuditEvent(
      activeUser,
      isNew ? 'Lapor Kerusakan Genset' : 'Edit Laporan Kerusakan',
      `Laporan ${incident.nomorLaporan} pada ${incident.gensetName}: ${incident.gejala}`
    );
    setAuditLogs(updatedLogs);
    showToast(isNew ? `Laporan kerusakan ${incident.nomorLaporan} berhasil dicatat.` : `Laporan kerusakan ${incident.nomorLaporan} berhasil diperbarui.`);

    // Real-time synchronization to Google Sheets if configured
    if (isAutoSyncEnabled()) {
      getAccessToken().then((token) => {
        const sheetId = getSavedSpreadsheetId();
        if (token && sheetId) {
          appendIncidentToSheet(token, sheetId, incident)
            .then(() => {
              showToast(`Laporan ${incident.nomorLaporan} otomatis disinkronkan ke Google Sheets.`);
            })
            .catch((err) => {
              console.warn('Real-time Google Sheets sync error:', err);
            });
        }
      });
    }
  };

  // Handler for Deleting Incident Record
  const handleDeleteIncident = (id: string) => {
    const target = incidents.find((inc) => inc.id === id);
    const updated = incidents.filter((inc) => inc.id !== id);
    setIncidents(updated);
    saveStoredIncidents(updated);
    const updatedLogs = logAuditEvent(
      activeUser,
      'Hapus Laporan Kerusakan',
      `Menghapus laporan kerusakan ID: ${id} (${target?.nomorLaporan || ''})`
    );
    setAuditLogs(updatedLogs);
    showToast('Laporan kerusakan berhasil dihapus.');
  };

  // Handler for Incident Status Update
  const handleUpdateIncidentStatus = (
    id: string,
    newStatus: 'Open' | 'Dalam Penanganan' | 'Selesai'
  ) => {
    let reportNo = '';
    let targetGensetId = '';
    const updated = incidents.map((inc) => {
      if (inc.id === id) {
        reportNo = inc.nomorLaporan;
        targetGensetId = inc.gensetId;
        return { ...inc, status: newStatus };
      }
      return inc;
    });
    setIncidents(updated);
    saveStoredIncidents(updated);

    if (newStatus === 'Selesai') {
      const updatedGensets = gensets.map((g) => {
        if (g.id === targetGensetId) {
          return {
            ...g,
            kondisi: 'S' as const,
            healthScore: 85,
          };
        }
        return g;
      });
      setGensets(updatedGensets);
      saveStoredGensets(updatedGensets);
    }

    const updatedLogs = logAuditEvent(
      activeUser,
      'Update Status Gangguan',
      `Mengubah status laporan ${reportNo} menjadi: ${newStatus}`
    );
    setAuditLogs(updatedLogs);
    showToast(`Status laporan ${reportNo} diubah menjadi ${newStatus}.`);
  };

  // Handler for SOP / K3 Checklist Save / Edit
  const handleSaveSOP = (record: SOPChecklistRecord, isNew: boolean = true) => {
    let updated: SOPChecklistRecord[];
    if (isNew) {
      updated = [record, ...sopLogs];
    } else {
      updated = sopLogs.map((log) => (log.id === record.id ? record : log));
    }
    setSopLogs(updated);
    saveStoredSOP(updated);

    const updatedLogs = logAuditEvent(
      activeUser,
      isNew ? 'Verifikasi SOP & K3' : 'Edit Verifikasi SOP & K3',
      `${isNew ? 'Checklist K3 baru' : 'Update checklist K3'} untuk ${record.gensetName} (${record.id}) status: ${record.status}`
    );
    setAuditLogs(updatedLogs);
    showToast(
      isNew
        ? `Verifikasi keselamatan K3 untuk ${record.gensetName} berhasil disimpan.`
        : `Data verifikasi ${record.id} (${record.gensetName}) berhasil diperbarui.`
    );
  };

  // Handler for Deleting SOP / K3 Checklist Record
  const handleDeleteSOP = (id: string) => {
    const target = sopLogs.find((s) => s.id === id);
    const updated = sopLogs.filter((s) => s.id !== id);
    setSopLogs(updated);
    saveStoredSOP(updated);

    const updatedLogs = logAuditEvent(
      activeUser,
      'Hapus Verifikasi SOP & K3',
      `Menghapus catatan verifikasi SOP ID: ${id} (${target?.gensetName || ''})`
    );
    setAuditLogs(updatedLogs);
    showToast('Data verifikasi SOP & K3 berhasil dihapus.');
  };

  // Handler for Operational Logbook & 3-stage Inspection Save
  const handleSaveOperationalRecord = (record: GensetOperationalRecord, isNew: boolean) => {
    let updated: GensetOperationalRecord[];
    if (isNew) {
      updated = [record, ...operationalRecords];
    } else {
      updated = operationalRecords.map((r) => (r.id === record.id ? record : r));
    }
    setOperationalRecords(updated);
    saveStoredOperational(updated);

    // If final hour meter is provided and higher, sync back to master genset
    if (record.hourMeterAkhir && record.hourMeterAkhir > 0) {
      const updatedGensets = gensets.map((g) => {
        if (g.id === record.gensetId && record.hourMeterAkhir > g.jamOperasi) {
          return {
            ...g,
            jamOperasi: record.hourMeterAkhir,
          };
        }
        return g;
      });
      setGensets(updatedGensets);
      saveStoredGensets(updatedGensets);
    }

    const updatedLogs = logAuditEvent(
      activeUser,
      isNew ? 'Catat Operasional Genset' : 'Update Log Operasional',
      `Log ${record.nomorLog} pada ${record.gensetName} (${record.keperluan}), status: ${record.status}`
    );
    setAuditLogs(updatedLogs);
    showToast(`Catatan operasional ${record.nomorLog} berhasil disimpan.`);

    // Real-time synchronization to Google Sheets if configured
    if (isAutoSyncEnabled()) {
      getAccessToken().then((token) => {
        const sheetId = getSavedSpreadsheetId();
        if (token && sheetId) {
          appendOperationalToSheet(token, sheetId, record)
            .then(() => {
              showToast(`Log operasional ${record.nomorLog} otomatis disinkronkan ke Google Sheets.`);
            })
            .catch((err) => {
              console.warn('Real-time Google Sheets operational sync error:', err);
            });
        }
      });
    }
  };

  // Handler for Deleting Operational Record
  const handleDeleteOperationalRecord = (id: string) => {
    const updated = operationalRecords.filter((r) => r.id !== id);
    setOperationalRecords(updated);
    saveStoredOperational(updated);
    const updatedLogs = logAuditEvent(
      activeUser,
      'Hapus Log Operasional',
      `Menghapus catatan operasional ID: ${id}`
    );
    setAuditLogs(updatedLogs);
    showToast('Catatan operasional berhasil dihapus.');
  };

  // Export handlers
  const handleExportCSV = () => {
    exportGensetToCSV(gensets);
    logAuditEvent(
      activeUser,
      'Ekspor Spreadsheet',
      'Download data master genset dalam format CSV/Spreadsheet'
    );
    showToast('File spreadsheet CSV berhasil diunduh.');
  };

  const handleExportJSON = () => {
    exportFullDatabaseAsJSON();
    logAuditEvent(
      activeUser,
      'Backup Database',
      'Download cadangan database sistem lengkap (JSON)'
    );
    showToast('Cadangan database JSON berhasil diunduh.');
  };

  // Counts for Badges
  const pendingApprovalCount = maintenances.filter(
    (m) => m.approvalStatus === 'Menunggu Review'
  ).length;

  const openIncidentsCount = incidents.filter((i) => i.status !== 'Selesai').length;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Navbar with Role Badges & Responsive Nav */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeUser={activeUser}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onOpenAuditModal={() => setIsAuditModalOpen(true)}
        onOpenGoogleSheetsModal={() => setIsGoogleSheetsModalOpen(true)}
        pendingApprovalCount={pendingApprovalCount}
        openIncidentsCount={openIncidentsCount}
        runningOperationsCount={operationalRecords.filter((r) => r.status === 'Beroperasi').length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 lg:pb-8">
        {activeTab === 'dashboard' && (
          <Dashboard
            gensets={gensets}
            inspections={inspections}
            maintenances={maintenances}
            incidents={incidents}
            operationalRecords={operationalRecords}
            activeUser={activeUser}
            onNavigate={(tab) => setActiveTab(tab)}
            onSelectGensetDetail={(g) => {
              setSelectedGensetDetail(g);
              setActiveTab('master');
            }}
            onOpenNewInspection={() => {
              setActiveTab('pemeriksaan');
              setIsNewInspectionOpen(true);
            }}
            onOpenNewMaintenance={() => {
              setActiveTab('perawatan');
              setIsNewMaintenanceOpen(true);
            }}
            onOpenNewIncident={() => {
              setActiveTab('gangguan');
              setIsNewIncidentOpen(true);
            }}
          />
        )}

        {activeTab === 'master' && (
          <MasterGenset
            gensets={gensets}
            maintenances={maintenances}
            activeUser={activeUser}
            onSaveGenset={handleSaveGenset}
            onDeleteGenset={handleDeleteGenset}
            onExportCSV={handleExportCSV}
            selectedGensetDetail={selectedGensetDetail}
            setSelectedGensetDetail={setSelectedGensetDetail}
          />
        )}

        {activeTab === 'operasional' && (
          <OperasionalGenset
            operationalRecords={operationalRecords}
            gensets={gensets}
            activeUser={activeUser}
            onSaveOperationalRecord={handleSaveOperationalRecord}
            onDeleteOperationalRecord={handleDeleteOperationalRecord}
          />
        )}

        {activeTab === 'pemeriksaan' && (
          <PemeriksaanKondisi
            inspections={inspections}
            gensets={gensets}
            activeUser={activeUser}
            onSaveInspection={handleSaveInspection}
            onDeleteInspection={handleDeleteInspection}
            isNewModalOpen={isNewInspectionOpen}
            setIsNewModalOpen={setIsNewInspectionOpen}
          />
        )}

        {activeTab === 'perawatan' && (
          <PerawatanGenset
            maintenances={maintenances}
            gensets={gensets}
            activeUser={activeUser}
            onSaveMaintenance={handleSaveMaintenance}
            onDeleteMaintenance={handleDeleteMaintenance}
            onApproveMaintenance={handleApproveMaintenance}
            onRejectMaintenance={handleRejectMaintenance}
            isNewModalOpen={isNewMaintenanceOpen}
            setIsNewModalOpen={setIsNewMaintenanceOpen}
          />
        )}

        {activeTab === 'gangguan' && (
          <KerusakanPerbaikan
            incidents={incidents}
            gensets={gensets}
            activeUser={activeUser}
            onSaveIncident={handleSaveIncident}
            onDeleteIncident={handleDeleteIncident}
            onUpdateStatus={handleUpdateIncidentStatus}
            isNewModalOpen={isNewIncidentOpen}
            setIsNewModalOpen={setIsNewIncidentOpen}
          />
        )}

        {activeTab === 'sop' && (
          <SopK3
            sopLogs={sopLogs}
            gensets={gensets}
            activeUser={activeUser}
            onSaveSOP={handleSaveSOP}
            onDeleteSOP={handleDeleteSOP}
          />
        )}

        {activeTab === 'approval' && (
          <ApprovalSystem
            maintenances={maintenances}
            activeUser={activeUser}
            onApprove={handleApproveMaintenance}
            onReject={handleRejectMaintenance}
            onOpenLoginModal={() => setIsLoginModalOpen(true)}
          />
        )}

        {activeTab === 'laporan' && (
          <ExportLaporan
            gensets={gensets}
            inspections={inspections}
            maintenances={maintenances}
            incidents={incidents}
            activeUser={activeUser}
            onExportCSV={handleExportCSV}
            onExportJSON={handleExportJSON}
          />
        )}
      </main>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl text-xs font-medium flex items-center gap-2.5 border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Role Switcher Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        activeUser={activeUser}
        onSelectUser={handleSelectUser}
      />

      {/* History Audit Log Modal */}
      <AuditLogModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        logs={auditLogs}
      />

      {/* Google Sheets Sync & Real-Time Settings Modal */}
      <GoogleSheetsSyncModal
        isOpen={isGoogleSheetsModalOpen}
        onClose={() => setIsGoogleSheetsModalOpen(false)}
        gensets={gensets}
        inspections={inspections}
        maintenances={maintenances}
        incidents={incidents}
        onNotify={showToast}
      />

      {/* Footer (Anti-slop compliant) */}
      <footer className="print:hidden border-t border-slate-200 bg-white py-4 mt-auto mb-16 lg:mb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span>Genset Monitoring & Maintenance Management System (GMM)</span>
            <span className="mx-2">·</span>
            <span>Satuan Denma</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Standar Keselamatan K3 & Prosedur CMMS</span>
            <span>·</span>
            <span>Database Terintegrasi</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
