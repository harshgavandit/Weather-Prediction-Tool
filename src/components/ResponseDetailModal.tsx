import React from 'react';
import { X, FileText, User, ShieldCheck, Calendar, AlertCircle, Copy, Check } from 'lucide-react';
import { SurveyRecord, QuestionInfo } from '../types';
import { BadgeOrigin } from './BadgeOrigin';

interface ResponseDetailModalProps {
  record: SurveyRecord | null;
  questions: Record<string, QuestionInfo>;
  onClose: () => void;
}

export const ResponseDetailModal: React.FC<ResponseDetailModalProps> = ({
  record,
  questions,
  onClose
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!record) return null;

  const handleCopyCitation = () => {
    navigator.clipboard.writeText(`RESPONSES.pdf, Page ${record.pageNumber}, Row ${record.rowNumber} (${record.respondentId})`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const questionKeys = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8', 'Q9', 'Q10', 'Q11', 'Q12', 'Q13', 'Q14', 'Q15'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Respondent Inspection Record</h3>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {record.id}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Provenance: <strong className="text-slate-300">RESPONSES.pdf</strong>, Page {record.pageNumber}, Row {record.rowNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCitation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition"
              title="Copy citation reference"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Citation'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Respondent Metadata Strip */}
        <div className="p-6 bg-slate-900/60 border-b border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-slate-400 flex items-center gap-1.5 mb-1">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>Public participant ID</span>
            </span>
            <p className="font-semibold text-white">{record.respondentId}</p>
          </div>

          <div>
            <span className="text-slate-400 flex items-center gap-1.5 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Privacy status</span>
            </span>
            <p className="font-mono text-emerald-300">Personal fields withheld</p>
          </div>

          <div>
            <span className="text-slate-400 flex items-center gap-1.5 mb-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Recorded Timestamp</span>
            </span>
            <p className="font-mono text-slate-300">{record.timestamp}</p>
          </div>
        </div>

        {/* Missing Status Notice */}
        {record.missingCount > 0 && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>Authentic Omission Notice:</strong> This respondent record contains{' '}
              {record.missingCount} blank answer(s) in the original PDF. Preserved as non-response to ensure zero data fabrication.
            </span>
          </div>
        )}

        {/* 15 Questions and Answers List */}
        <div className="p-6 max-h-[50vh] overflow-y-auto space-y-3 divide-y divide-slate-800/60">
          {questionKeys.map((qk, idx) => {
            const qInfo = questions[qk];
            const answer = record.answers[qk];
            const isMissing = answer === null || answer === undefined || answer === '';

            return (
              <div key={qk} className={`pt-3 first:pt-0 ${isMissing ? 'bg-amber-500/5 -mx-2 px-2 py-2 rounded-lg' : ''}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        Q{idx + 1}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">{qInfo?.category || 'General'}</span>
                    </div>
                    <p className="text-xs font-medium text-slate-200">
                      {qInfo?.text || `Question ${idx + 1}`}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    {isMissing ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        <AlertCircle className="w-3 h-3" />
                        <span>Omitted in PDF</span>
                      </span>
                    ) : (
                      <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded bg-slate-800 text-white border border-slate-700">
                        {answer}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-800/40 flex items-center justify-between text-xs text-slate-400">
          <BadgeOrigin type="source" citation={`RESPONSES.pdf, Row ${record.rowNumber}`} />
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
