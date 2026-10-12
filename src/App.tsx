import React, { useEffect, useState } from 'react';
import { AlertCircle, FileSearch, RefreshCw } from 'lucide-react';
import { Header } from './components/Header';
import { ExecutiveOverview } from './components/ExecutiveOverview';
import { PDFExplorer } from './components/PDFExplorer';
import { SurveyAnalytics } from './components/SurveyAnalytics';
import { SectoralImpacts } from './components/SectoralImpacts';
import { ParticipantActionPlans } from './components/ParticipantActionPlans';
import { GeoPhotoEvidence } from './components/GeoPhotoEvidence';
import { ResponseDetailModal } from './components/ResponseDetailModal';
import { PDFViewerModal } from './components/PDFViewerModal';
import { SourcesMethodology } from './components/SourcesMethodology';
import { WeatherAdvisor } from './components/WeatherAdvisor';
import { fetchPhotoEvidence, fetchSectoralImpacts, fetchSurveyData } from './services/api';
import { PhotoEvidenceResponse, SectoralImpactsData, SurveyRecord, SurveyResponseData } from './types';
import { useViewNavigation } from './hooks/useViewNavigation';

type ServiceErrors = Partial<Record<'survey' | 'sectors' | 'photos', string>>;

const emptyPhotoEvidence: PhotoEvidenceResponse = {
  items: [],
  summary: { total: 0, verified: 0, withCoordinates: 0, participantsWithEvidence: 0, byCategory: [] }
};

const AnalysisUnavailable = ({ message, title = 'The survey synthesis could not be loaded' }: { message: string; title?: string }) => (
  <section className="empty-state">
    <div><FileSearch /></div>
    <p className="eyebrow">PDF analysis unavailable</p>
    <h2>{title}</h2>
    <p>{message}</p>
    <button onClick={() => window.location.reload()}><RefreshCw /> Retry PDF analysis</button>
  </section>
);

export const App: React.FC = () => {
  const [surveyData, setSurveyData] = useState<SurveyResponseData | null>(null);
  const [sectorData, setSectorData] = useState<SectoralImpactsData | null>(null);
  const [photoEvidence, setPhotoEvidence] = useState<PhotoEvidenceResponse>(emptyPhotoEvidence);
  const [selectedRecord, setSelectedRecord] = useState<SurveyRecord | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<ServiceErrors>({});
  const { activeTab, filters, navigate, setFilters } = useViewNavigation(surveyData?.records);

  useEffect(() => {
    setSelectedRecord(null);
    setIsPdfModalOpen(false);
  }, [activeTab]);

  useEffect(() => {
    let mounted = true;
    Promise.allSettled([fetchSurveyData(), fetchSectoralImpacts(), fetchPhotoEvidence()]).then((results) => {
      if (!mounted) return;
      const nextErrors: ServiceErrors = {};
      if (results[0].status === 'fulfilled') setSurveyData(results[0].value);
      else nextErrors.survey = results[0].reason instanceof Error ? results[0].reason.message : 'PDF dataset unavailable';
      if (results[1].status === 'fulfilled') setSectorData(results[1].value);
      else nextErrors.sectors = results[1].reason instanceof Error ? results[1].reason.message : 'Survey synthesis unavailable';
      if (results[2].status === 'fulfilled') setPhotoEvidence(results[2].value);
      else nextErrors.photos = results[2].reason instanceof Error ? results[2].reason.message : 'Photo evidence unavailable';
      setErrors(nextErrors);
      setIsLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  if (isLoading) return <div className="boot-screen"><div className="boot-mark"><FileSearch /></div><p className="eyebrow">Reading verified source</p><h1>Loading PDF intelligence</h1><div className="boot-line"><i /><span>PDF records · verified calculations · concise interpretation</span></div></div>;

  if (!surveyData) return <div className="boot-screen"><AlertCircle className="h-10 w-10 text-rose-400"/><p className="eyebrow">Source load failed</p><h1>The verified survey dataset could not be opened.</h1><p className="max-w-lg text-sm text-slate-400">{errors.survey}</p><button className="retry-button" onClick={() => window.location.reload()}>Retry application</button></div>;

  return <div className="app-canvas">
    <Header activeTab={activeTab} setActiveTab={navigate} onOpenPdfModal={() => setIsPdfModalOpen(true)} />
    <main className="app-main">
      {activeTab === 'overview' && <ExecutiveOverview surveyData={surveyData} onNavigateTab={navigate} onOpenPdfModal={() => setIsPdfModalOpen(true)} />}
      {activeTab === 'evidence' && <PDFExplorer records={surveyData.records} filters={filters} onFiltersChange={setFilters} onSelectRecord={setSelectedRecord} onOpenPdfModal={() => setIsPdfModalOpen(true)} />}
      {activeTab === 'analytics' && <SurveyAnalytics surveyData={surveyData} />}
      <section hidden={activeTab !== 'weather-advisor'} aria-label="Weather advisor"><WeatherAdvisor /></section>
      {activeTab === 'geo-evidence' && (errors.photos ? <AnalysisUnavailable title="The field-evidence registry could not be loaded" message={errors.photos} /> : <GeoPhotoEvidence surveyData={surveyData} evidence={photoEvidence} onEvidenceChange={setPhotoEvidence} />)}
      {activeTab === 'impacts' && (sectorData ? <SectoralImpacts sectorData={sectorData} /> : <AnalysisUnavailable message={errors.sectors || 'The PDF-backed sector synthesis could not be loaded.'} />)}
      {activeTab === 'actions' && <ParticipantActionPlans surveyData={surveyData} photoEvidence={photoEvidence.items} onInspectResponse={(recordId) => setSelectedRecord(surveyData.records.find(record => record.id === recordId) || null)} />}
      {activeTab === 'sources' && <SourcesMethodology surveyData={surveyData} photoSummary={photoEvidence.summary} onOpenPdf={() => setIsPdfModalOpen(true)} />}
    </main>
    <footer className="app-footer"><div><strong>Climora</strong><span>PDF survey intelligence with separately labeled participant field evidence.</span></div><div><span>RESPONSES.pdf · p.1</span><span>51 responses</span><span>{photoEvidence.summary.total} field photos</span></div></footer>
    <ResponseDetailModal record={selectedRecord} questions={surveyData.metadata.questions} photoEvidence={photoEvidence.items} onClose={() => setSelectedRecord(null)} />
    <PDFViewerModal isOpen={isPdfModalOpen} onClose={() => setIsPdfModalOpen(false)} />
  </div>;
};
