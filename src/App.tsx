import React, { useEffect, useState } from 'react';
import { AlertCircle, FileSearch, RefreshCw } from 'lucide-react';
import { Header } from './components/Header';
import { ExecutiveOverview } from './components/ExecutiveOverview';
import { PDFExplorer } from './components/PDFExplorer';
import { SurveyAnalytics } from './components/SurveyAnalytics';
import { SectoralImpacts } from './components/SectoralImpacts';
import { RecommendationsRoadmap } from './components/RecommendationsRoadmap';
import { ResponseDetailModal } from './components/ResponseDetailModal';
import { PDFViewerModal } from './components/PDFViewerModal';
import { SourcesMethodology } from './components/SourcesMethodology';
import { fetchSectoralImpacts, fetchSurveyData } from './services/api';
import { SectoralImpactsData, SurveyRecord, SurveyResponseData } from './types';

type ServiceErrors = Partial<Record<'survey' | 'sectors', string>>;

const AnalysisUnavailable = ({ message }: { message: string }) => (
  <section className="empty-state">
    <div><FileSearch /></div>
    <p className="eyebrow">PDF analysis unavailable</p>
    <h2>The survey synthesis could not be loaded</h2>
    <p>{message}</p>
    <button onClick={() => window.location.reload()}><RefreshCw /> Retry PDF analysis</button>
  </section>
);

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [surveyData, setSurveyData] = useState<SurveyResponseData | null>(null);
  const [sectorData, setSectorData] = useState<SectoralImpactsData | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<SurveyRecord | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<ServiceErrors>({});

  useEffect(() => {
    let mounted = true;
    Promise.allSettled([fetchSurveyData(), fetchSectoralImpacts()]).then((results) => {
      if (!mounted) return;
      const nextErrors: ServiceErrors = {};
      if (results[0].status === 'fulfilled') setSurveyData(results[0].value);
      else nextErrors.survey = results[0].reason instanceof Error ? results[0].reason.message : 'PDF dataset unavailable';
      if (results[1].status === 'fulfilled') setSectorData(results[1].value);
      else nextErrors.sectors = results[1].reason instanceof Error ? results[1].reason.message : 'Survey synthesis unavailable';
      setErrors(nextErrors);
      setIsLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const routeTab = (tab: string) => {
    if (tab === 'pdf-explorer') setActiveTab('evidence');
    else if (tab === 'sector-impacts' || tab === 'risk-engine') setActiveTab('impacts');
    else if (tab === 'roadmap') setActiveTab('actions');
    else setActiveTab(tab);
  };

  if (isLoading) return <div className="boot-screen"><div className="boot-mark"><FileSearch /></div><p className="eyebrow">Reading verified source</p><h1>Loading PDF intelligence</h1><div className="boot-line"><i /><span>PDF records · verified calculations · concise interpretation</span></div></div>;

  if (!surveyData) return <div className="boot-screen"><AlertCircle className="h-10 w-10 text-rose-400"/><p className="eyebrow">Source load failed</p><h1>The verified survey dataset could not be opened.</h1><p className="max-w-lg text-sm text-slate-400">{errors.survey}</p><button className="retry-button" onClick={() => window.location.reload()}>Retry application</button></div>;

  return <div className="app-canvas">
    <Header activeTab={activeTab} setActiveTab={setActiveTab} onOpenPdfModal={() => setIsPdfModalOpen(true)} />
    <main className="app-main">
      {activeTab === 'overview' && <ExecutiveOverview surveyData={surveyData} onNavigateTab={routeTab} onOpenPdfModal={() => setIsPdfModalOpen(true)} />}
      {activeTab === 'evidence' && <PDFExplorer records={surveyData.records} onSelectRecord={setSelectedRecord} onOpenPdfModal={() => setIsPdfModalOpen(true)} />}
      {activeTab === 'analytics' && <SurveyAnalytics surveyData={surveyData} />}
      {activeTab === 'impacts' && (sectorData ? <SectoralImpacts sectorData={sectorData} /> : <AnalysisUnavailable message={errors.sectors || 'The PDF-backed sector synthesis could not be loaded.'} />)}
      {activeTab === 'actions' && <RecommendationsRoadmap />}
      {activeTab === 'sources' && <SourcesMethodology surveyData={surveyData} onOpenPdf={() => setIsPdfModalOpen(true)} />}
    </main>
    <footer className="app-footer"><div><strong>Climora</strong><span>Survey intelligence grounded exclusively in the supplied PDF.</span></div><div><span>RESPONSES.pdf · p.1</span><span>51 responses</span><span>15 questions</span></div></footer>
    <ResponseDetailModal record={selectedRecord} questions={surveyData.metadata.questions} onClose={() => setSelectedRecord(null)} />
    <PDFViewerModal isOpen={isPdfModalOpen} onClose={() => setIsPdfModalOpen(false)} />
  </div>;
};
