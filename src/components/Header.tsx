import React from 'react';
import { BarChart3, Camera, Compass, Download, FileText, Gauge, LayoutDashboard, Lightbulb, Menu, ShieldCheck, X } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenPdfModal: () => void;
}

const nav = [
  { id: 'overview', label: 'Command center', short: 'Home', icon: LayoutDashboard },
  { id: 'evidence', label: 'Survey evidence', short: 'Evidence', icon: FileText },
  { id: 'analytics', label: 'Survey analytics', short: 'Analytics', icon: BarChart3 },
  { id: 'geo-evidence', label: 'Geo photo evidence', short: 'Photos', icon: Camera },
  { id: 'impacts', label: 'Impact analysis', short: 'Impacts', icon: Gauge },
  { id: 'actions', label: 'People action plans', short: 'Actions', icon: Lightbulb },
  { id: 'sources', label: 'Sources & method', short: 'More', icon: ShieldCheck }
];

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, onOpenPdfModal }) => {
  const [open, setOpen] = React.useState(false);
  const changeTab = (id: string) => { setActiveTab(id); setOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  return <>
    <aside className={`app-sidebar ${open ? 'sidebar-open' : ''}`} aria-label="Primary navigation">
      <div className="brand-lockup"><div className="brand-orbit"><Compass className="h-5 w-5"/></div><div><strong>Climora</strong><span>Intelligence studio</span></div><button className="sidebar-close" onClick={() => setOpen(false)} aria-label="Close navigation"><X/></button></div>
      <div className="project-chip"><span className="status-dot"/><div><strong>PDF study ready</strong><span>51 anonymous records</span></div></div>
      <nav className="sidebar-nav">{nav.map(({ id, label, icon: Icon }) => <button key={id} className={activeTab === id ? 'active' : ''} onClick={() => changeTab(id)}><Icon/><span>{label}</span>{activeTab === id && <i/>}</button>)}</nav>
      <div className="sidebar-spacer"/>
      <button className="sidebar-source" onClick={onOpenPdfModal}><FileText/><span><strong>RESPONSES.pdf</strong><small>Original · page 1</small></span></button>
      <a className="sidebar-export" href="/api/export/csv" download><Download/> Export clean CSV</a>
      <p className="sidebar-foot">PDF survey + participant field evidence<br/>No external weather or climate feeds</p>
    </aside>
    {open && <button className="sidebar-scrim" onClick={() => setOpen(false)} aria-label="Close navigation overlay"/>}

    <header className="app-topbar">
      <button className="menu-button" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu/></button>
      <div className="mobile-brand"><div className="brand-orbit"><Compass/></div><strong>Climora</strong></div>
      <div className="topbar-context"><span>PDF Intelligence Platform</span><strong>{nav.find(item => item.id === activeTab)?.label}</strong></div>
      <div className="topbar-right">
        <div className="live-pill"><span className="status-dot"/><FileText/><strong>51 PDF responses</strong><em>p.1</em></div>
        <button className="pdf-quick" onClick={onOpenPdfModal}><FileText/><span>Source PDF</span></button>
      </div>
    </header>

    <nav className="mobile-nav" aria-label="Mobile navigation">{nav.slice(0, 5).map(({ id, short, icon: Icon }) => <button key={id} className={activeTab === id ? 'active' : ''} onClick={() => changeTab(id)}><Icon/><span>{short}</span></button>)}<button onClick={() => setOpen(true)}><ShieldCheck/><span>More</span></button></nav>
  </>;
};
