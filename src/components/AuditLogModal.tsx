import React from 'react';
import { AuditLogItem } from '../types/genset';
import { History, X, Clock, User, ShieldCheck } from 'lucide-react';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: AuditLogItem[];
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({
  isOpen,
  onClose,
  logs,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <History className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="font-bold text-base text-slate-100">Histori & Jejak Audit Perubahan Data</h3>
              <p className="text-xs text-slate-400">Pencatatan otomatis seluruh aktivitas sistem GMM</p>
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
        <div className="p-6 overflow-y-auto space-y-3 flex-1 text-xs">
          {logs.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              Belum ada riwayat aktivitas yang tercatat.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {logs.map((log) => (
                <div key={log.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{log.action}</span>
                      <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {log.userRole}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {log.timestamp}
                    </span>
                  </div>

                  <p className="text-slate-600 leading-relaxed text-[11px]">{log.details}</p>

                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" />
                    <span>Oleh: {log.userName}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
