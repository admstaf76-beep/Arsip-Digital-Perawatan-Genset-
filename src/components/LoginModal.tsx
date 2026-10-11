import React, { useState } from 'react';
import { UserRole, UserSession } from '../types/genset';
import { ShieldCheck, User, Key, Check, AlertCircle, X } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeUser: UserSession;
  onSelectUser: (user: UserSession) => void;
}

interface RoleConfig {
  role: UserRole;
  name: string;
  title: string;
  requiresPassword: boolean;
  password?: string;
  badge: string;
  description: string;
  permissions: string[];
}

const ROLES: RoleConfig[] = [
  {
    role: 'TEKNISI',
    name: 'Teknisi Fasint',
    title: 'Teknisi Pemeliharaan Fasint',
    requiresPassword: true,
    password: 'fasint',
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Petugas lapangan operasional dan pemeliharaan genset.',
    permissions: [
      'Input & tambah master data',
      'Input pemeriksaan 13 parameter',
      'Input perawatan & perbaikan',
      'Upload dokumentasi foto',
      'Cetak dan download laporan',
    ],
  },
  {
    role: 'KADISLOG',
    name: 'Kadislog',
    title: 'Kepala Dinas Logistik / Komandan',
    requiresPassword: true,
    password: 'Kadis',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    description: 'Pimpinan dan pejabat pengambil keputusan logistik.',
    permissions: [
      'Melihat seluruh data genset',
      'Pemeriksaan hasil pekerjaan teknisi',
      'Approval pekerjaan perawatan/perbaikan',
      'Reject dengan catatan koreksi',
      'Cetak & download laporan dinas',
    ],
  },
  {
    role: 'ADMIN1',
    name: 'Staf Administrasi 1',
    title: 'Petugas Monitoring (View Only)',
    requiresPassword: false,
    badge: 'bg-slate-100 text-slate-800 border-slate-200',
    description: 'Akses publik/staf untuk monitoring kesiapan tanpa izin edit.',
    permissions: [
      'Melihat seluruh data kesiapan',
      'Monitoring status genset',
      'Cetak laporan',
      'Download data spreadsheet',
    ],
  },
  {
    role: 'ADMIN2',
    name: 'Staf Data Fasint',
    title: 'Administrator Logistik & Database',
    requiresPassword: true,
    password: 'admin2',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    description: 'Akses penuh administrasi master data dan koreksi entri.',
    permissions: [
      'Melihat seluruh data',
      'Edit & koreksi data master',
      'Sinkronisasi spreadsheet',
      'Cetak dan download',
    ],
  },
];

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  activeUser,
  onSelectUser,
}) => {
  const [selectedRole, setSelectedRole] = useState<RoleConfig>(
    ROLES.find((r) => r.role === activeUser.role) || ROLES[0]
  );
  const [manualTeknisiName, setManualTeknisiName] = useState(
    activeUser.role === 'TEKNISI' ? activeUser.name : 'Teknisi'
  );
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (selectedRole.requiresPassword) {
      if (passwordInput !== selectedRole.password) {
        setErrorMessage(`Password salah untuk role ${selectedRole.role}. Silakan coba lagi.`);
        return;
      }
    }

    const finalName =
      selectedRole.role === 'TEKNISI'
        ? manualTeknisiName.trim() || 'Teknisi'
        : selectedRole.name;

    onSelectUser({
      role: selectedRole.role,
      name: finalName,
      title: selectedRole.title,
    });
    setPasswordInput('');
    setErrorMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">Ganti Hak Akses Pengguna</h3>
              <p className="text-xs text-slate-400">Pilih role sesuai otoritas kedinasan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
              Pilih Role & Jabatan:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => {
                const isSelected = selectedRole.role === r.role;
                return (
                  <button
                    key={r.role}
                    type="button"
                    onClick={() => {
                      setSelectedRole(r);
                      setErrorMessage('');
                      setPasswordInput('');
                    }}
                    className={`text-left p-3 rounded-lg border transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-slate-900">{r.role}</span>
                      {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                    </div>
                    <div className="text-xs text-slate-600 line-clamp-1">{r.title}</div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {r.requiresPassword ? 'Perlu Password' : 'Tanpa Password'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Role Details */}
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                {selectedRole.name} ({selectedRole.title})
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {selectedRole.requiresPassword ? `Sandi: ${selectedRole.password}` : 'Bebas Akses'}
              </span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              {selectedRole.description}
            </p>
            <div className="pt-2 border-t border-slate-200">
              <span className="font-medium text-slate-700 block mb-1">Hak Otoritas:</span>
              <ul className="grid grid-cols-1 gap-1 text-[11px] text-slate-600">
                {selectedRole.permissions.map((perm, idx) => (
                  <li key={idx} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                    <span>{perm}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Manual technician name input if TEKNISI */}
          {selectedRole.role === 'TEKNISI' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  Nama Teknisi (Isi Manual):
                </span>
                <span className="text-[11px] text-slate-500">Dapat diganti sesuai nama petugas</span>
              </label>
              <input
                type="text"
                value={manualTeknisiName}
                onChange={(e) => setManualTeknisiName(e.target.value)}
                placeholder="Contoh: Budi Santoso / Teknisi Piket"
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
          )}

          {/* Password field if required */}
          {selectedRole.requiresPassword && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-slate-500" />
                  Password Akses:
                </span>
                <span className="text-[11px] text-blue-600 font-normal">
                  (Petunjuk: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold">{selectedRole.password}</code>)
                </span>
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder={`Masukkan password untuk ${selectedRole.role}`}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                autoFocus
              />
            </div>
          )}

          {errorMessage && (
            <div className="flex items-center gap-2 p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
            >
              Masuk Sebagai {selectedRole.role}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
