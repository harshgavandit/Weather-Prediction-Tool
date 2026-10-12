import React, { useMemo } from 'react';
import {
  Search,
  FileText,
  AlertCircle,
  Download,
  ChevronRight
} from 'lucide-react';
import { SurveyRecord } from '../types';
import { BadgeOrigin } from './BadgeOrigin';
import { createSurveyCsv } from '../../shared/surveyCsv.js';
import { DEFAULT_EVIDENCE_FILTERS, EvidenceFilters } from '../../shared/viewNavigation.js';
import { ShareSurveyView } from './ShareSurveyView';

interface PDFExplorerProps {
  records: SurveyRecord[];
  filters: EvidenceFilters;
  onFiltersChange: (filters: EvidenceFilters) => void;
  onSelectRecord: (record: SurveyRecord) => void;
  onOpenPdfModal: () => void;
}

export const PDFExplorer: React.FC<PDFExplorerProps> = ({
  records,
  filters,
  onFiltersChange,
  onSelectRecord,
  onOpenPdfModal
}) => {
  const { search: searchTerm, concern: concernFilter, problem: problemFilter, action: actionFilter, flood: floodFilter } = filters;
  const changeFilter = (key: keyof EvidenceFilters, value: string) => onFiltersChange({ ...filters, [key]: value });

  // Filtered dataset
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      // Search
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchesId = r.respondentId.toLowerCase().includes(q) || r.id.toLowerCase().includes(q);
        const matchesAnswers = Object.values(r.answers).some(a => a?.toLowerCase().includes(q));
        if (!matchesId && !matchesAnswers) {
          return false;
        }
      }

      // Concern
      if (concernFilter !== 'all' && r.answers.Q12 !== concernFilter) {
        return false;
      }

      // Problem
      if (problemFilter !== 'all' && r.answers.Q14 !== problemFilter) {
        return false;
      }

      // Action
      if (actionFilter !== 'all' && r.answers.Q15 !== actionFilter) {
        return false;
      }

      // Flooding
      if (floodFilter !== 'all' && r.answers.Q4 !== floodFilter) {
        return false;
      }

      return true;
    });
  }, [records, searchTerm, concernFilter, problemFilter, actionFilter, floodFilter]);

  // Unique options for filters
  const uniqueProblems = useMemo(() => {
    const s = new Set<string>();
    records.forEach(r => { if (r.answers.Q14) s.add(r.answers.Q14); });
    return Array.from(s).sort();
  }, [records]);

  const uniqueActions = useMemo(() => {
    const s = new Set<string>();
    records.forEach(r => { if (r.answers.Q15) s.add(r.answers.Q15); });
    return Array.from(s).sort();
  }, [records]);

  const downloadFilteredCsv = () => {
    const csv = createSurveyCsv(filteredRecords);
    const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'survey_filtered_responses.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    // Give the browser time to start the download before releasing the blob.
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header and PDF Reference Info */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">Extracted Survey Dataset &amp; Provenance</h2>
            <BadgeOrigin type="source" citation="RESPONSES.pdf, Page 1" />
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Complete structured view of the 51 respondent entries parsed from <code>RESPONSES.pdf</code>.
            Each row provides verifiable provenance with source document name, page number, and original row index.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenPdfModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>View Original RESPONSES.pdf</span>
          </button>
          <a
            href="/api/export/csv"
            download="survey_responses.csv"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition"
          >
            <Download className="w-4 h-4" />
            <span>Download All Records</span>
          </a>
        </div>
      </div>

      {/* Missing Data Disclosure Card */}
      <div className="rounded-xl bg-slate-900/60 border border-amber-500/20 p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-amber-300">Data Integrity &amp; Non-Fabrication Guarantee:</span>
            <span className="font-mono text-[10px] bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded border border-amber-500/20">
              Zero Imputation Policy
            </span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            In compliance with strict data integrity rules, no missing values have been fabricated.
            Survey Row 1 skipped <code className="text-amber-300">Q7 (Daily Activities)</code>, and Survey Row 17
            skipped <code className="text-amber-300">Q12 (Concern Level)</code> and <code className="text-amber-300">Q13 (Awareness)</code>.
            These empty fields are transparently designated as <em className="text-slate-300">Non-Response</em> rather than assumed or synthesized.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-4 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              aria-label="Search survey records"
              value={searchTerm}
              onChange={(e) => changeFilter('search', e.target.value)}
              maxLength={200}
              placeholder="Search participant ID or answer content..."
              className="w-full bg-slate-800/90 border border-slate-700/80 rounded-lg pl-9 pr-16 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
            />
            {searchTerm && (
              <button
                onClick={() => changeFilter('search', '')}
                aria-label="Clear survey search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Concern Filter */}
            <select
              aria-label="Filter by concern level"
              value={concernFilter}
              onChange={(e) => changeFilter('concern', e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Concern Levels</option>
              <option value="Very Concerned">Very Concerned</option>
              <option value="Concerned">Concerned</option>
              <option value="Neutral">Neutral</option>
              <option value="Not concerned">Not concerned</option>
            </select>

            {/* Problem Filter */}
            <select
              aria-label="Filter by climate problem"
              value={problemFilter}
              onChange={(e) => changeFilter('problem', e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Climate Problems</option>
              {uniqueProblems.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            {/* Action Filter */}
            <select
              aria-label="Filter by recommended action"
              value={actionFilter}
              onChange={(e) => changeFilter('action', e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Recommended Actions</option>
              {uniqueActions.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>

            {/* Flooding Experience Filter */}
            <select
              aria-label="Filter by flooding exposure"
              value={floodFilter}
              onChange={(e) => changeFilter('flood', e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Flooding Exposure</option>
              <option value="Frequently">Frequently Flooded</option>
              <option value="Sometimes">Sometimes Flooded</option>
              <option value="Rarely">Rarely Flooded</option>
              <option value="Never">Never Flooded</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 pt-1">
          <span role="status" aria-live="polite">Showing <strong className="text-white">{filteredRecords.length}</strong> of {records.length} records</span>
          <div className="flex flex-wrap items-center gap-3">
          {(searchTerm || concernFilter !== 'all' || problemFilter !== 'all' || actionFilter !== 'all' || floodFilter !== 'all') && (
            <button
              onClick={() => onFiltersChange({ ...DEFAULT_EVIDENCE_FILTERS })}
              className="text-emerald-400 hover:underline"
            >
              Reset All Filters
            </button>
          )}
            <button
              type="button"
              onClick={downloadFilteredCsv}
              disabled={filteredRecords.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              Download Filtered CSV ({filteredRecords.length})
            </button>
          </div>
        </div>
        <ShareSurveyView filters={filters} />
      </div>

      {/* Main Table */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-300 font-semibold border-b border-slate-700/60 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Provenance ID</th>
                <th className="py-3.5 px-4">Respondent</th>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Top Problem (Q14)</th>
                <th className="py-3.5 px-4">Recommended Action (Q15)</th>
                <th className="py-3.5 px-4">Concern (Q12)</th>
                <th className="py-3.5 px-4">Flooding (Q4)</th>
                <th className="py-3.5 px-4">Shortage (Q5)</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-normal text-slate-300">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No survey records match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  return (
                    <tr
                      key={r.id}
                      onClick={() => onSelectRecord(r)}
                      className="hover:bg-slate-800/50 cursor-pointer transition-colors group"
                    >
                      {/* Provenance ID & Citation */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-mono font-medium text-emerald-400">{r.id}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Page {r.pageNumber}, Row {r.rowNumber}
                          </span>
                        </div>
                      </td>

                      {/* Respondent */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-white group-hover:text-emerald-300 transition-colors">
                            {r.respondentId}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
                            Personal details withheld in public view
                          </span>
                        </div>
                      </td>

                      {/* Timestamp */}
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                        {r.timestamp}
                      </td>

                      {/* Top Problem */}
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                          r.answers.Q14 === 'Heat'
                            ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                            : r.answers.Q14 === 'Flooding'
                            ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                            : r.answers.Q14 === 'Water Shortage'
                            ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                            : r.answers.Q14 === 'Rainfall changes'
                            ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {r.answers.Q14 || 'Unspecified'}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4">
                        <span className="text-slate-300 font-medium">
                          {r.answers.Q15 || 'Unspecified'}
                        </span>
                      </td>

                      {/* Concern */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {r.answers.Q12 ? (
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                            r.answers.Q12 === 'Very Concerned'
                              ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                              : r.answers.Q12 === 'Concerned'
                              ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {r.answers.Q12}
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-400 italic">Omitted in PDF</span>
                        )}
                      </td>

                      {/* Flooding */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`text-[11px] ${
                          r.answers.Q4 === 'Frequently' ? 'text-rose-400 font-medium' : 'text-slate-400'
                        }`}>
                          {r.answers.Q4}
                        </span>
                      </td>

                      {/* Water Shortage */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`text-[11px] ${
                          r.answers.Q5 === 'Frequently' ? 'text-amber-400 font-medium' : 'text-slate-400'
                        }`}>
                          {r.answers.Q5}
                        </span>
                      </td>

                      {/* Detail Link */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectRecord(r);
                          }}
                          className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-medium group-hover:underline"
                        >
                          <span>Inspect</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
