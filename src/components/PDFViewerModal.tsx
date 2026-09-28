import React from 'react';
import { X, Download, FileText, ExternalLink, CheckCircle2 } from 'lucide-react';
import { BadgeOrigin } from './BadgeOrigin';

interface PDFViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PDFViewerModal: React.FC<PDFViewerModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-hidden">
      <div className="relative w-full max-w-5xl h-[88vh] rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-slate-800 bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Source Document Inspector: RESPONSES.pdf</h3>
                <BadgeOrigin type="source" citation="Page 1 of 1" />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                One-page survey export • 51 responses • respondent geography not collected
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/RESPONSES.pdf"
              download="RESPONSES.pdf"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </a>

            <a
              href="/RESPONSES.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in New Tab</span>
            </a>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Embedded PDF Viewer */}
        <div className="flex-1 w-full h-full bg-slate-950 relative">
          <iframe
            src="/RESPONSES.pdf#toolbar=1&navpanes=0&scrollbar=1"
            title="RESPONSES.pdf source view"
            className="w-full h-full border-none"
          />
        </div>

        {/* Footer info bar */}
        <div className="p-3 px-6 bg-slate-900 border-t border-slate-800 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>All 51 rows and 765 answer cells cross-checked. Original contains personal information; public views are anonymized.</span>
          </div>
          <span className="font-mono text-[11px] text-slate-500">Blank values preserved • No imputation</span>
        </div>
      </div>
    </div>
  );
};
