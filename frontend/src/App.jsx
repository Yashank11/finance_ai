import React, { useState, useEffect } from 'react';
import { 
  LineChart as LineChartIcon, 
  Smile, 
  AlertTriangle, 
  HelpCircle, 
  TrendingUp, 
  Search, 
  Plus, 
  Bell, 
  Trash2, 
  ArrowRightLeft, 
  FileText, 
  Sparkles,
  RefreshCw,
  Play
} from 'lucide-react';

// Tabs
import OverviewTab from './components/OverviewTab';
import ConfidenceTab from './components/ConfidenceTab';
import BullBearTab from './components/BullBearTab';
import RisksTab from './components/RisksTab';
import AnalystQuestionsTab from './components/AnalystQuestionsTab';
import CompetitorTab from './components/CompetitorTab';
import RAGChatTab from './components/RAGChatTab';
import UploadTab from './components/UploadTab';
import ScenarioTab from './components/ScenarioTab';

const API_BASE_URL = 'http://127.0.0.1:8000';

function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [companyName, setCompanyName] = useState('NVIDIA');
  const [activeData, setActiveData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  
  // Watchlist & Monitoring Alerts
  const [watchlist, setWatchlist] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [checkingAlerts, setCheckingAlerts] = useState(false);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);

  // Fetch company analysis
  const fetchAnalysis = async (targetCompany) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/company/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_name: targetCompany })
      });
      if (response.ok) {
        const data = await response.json();
        setActiveData(data);
        setCompanyName(data.metadata.name);
      } else {
        const errData = await response.json();
        setError(errData.detail || 'Failed to retrieve earnings analysis.');
      }
    } catch (err) {
      console.error(err);
      setError('Could not connect to the backend server. Make sure FastAPI is running on port 8000.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch watchlist
  const fetchWatchlist = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/watchlist`);
      if (response.ok) {
        const data = await response.json();
        setWatchlist(data);
      }
    } catch (err) {
      console.error("Watchlist fetch error:", err);
    }
  };

  // Add to watchlist
  const addToWatchlist = async (name) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/watchlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_name: name })
      });
      if (response.ok) {
        const data = await response.json();
        setWatchlist(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete from watchlist
  const removeFromWatchlist = async (ticker) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/watchlist/${ticker}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        const data = await response.json();
        setWatchlist(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Run Watchlist background monitoring check
  const runMonitoringCheck = async () => {
    setCheckingAlerts(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/watchlist/monitor`, {
        method: 'POST'
      });
      if (response.ok) {
        const data = await response.json();
        if (data.alerts && data.alerts.length > 0) {
          setAlerts(prev => [...data.alerts, ...prev]);
          setShowNotificationPopup(true);
        }
      }
    } catch (err) {
      console.error("Monitoring check error:", err);
    } finally {
      setCheckingAlerts(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchAnalysis('NVIDIA');
    fetchWatchlist();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      fetchAnalysis(searchInput);
      setSearchInput('');
    }
  };

  const handleUploadSuccess = (nameKey, parsedData) => {
    // Select uploaded report
    setActiveData(parsedData);
    setCompanyName(parsedData.metadata.name);
    setActiveTab('overview');
  };

  return (
    <div className="app-container">
      
      {/* Sidebar navigation */}
      <aside className="sidebar">
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '12px', borderBottom: '1px solid var(--border-glass)' }}>
          <Sparkles color="var(--color-cyan)" size={24} className="pulse-active" style={{ borderRadius: '50%' }} />
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', fontFamily: 'var(--font-display)' }}>ALPHA CALL</h2>
            <span style={{ fontSize: '10px', color: 'var(--color-cyan)', fontWeight: 600, letterSpacing: '0.05em' }}>AI EARNINGS ANALYST</span>
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} style={{ position: 'relative' }}>
          <input
            type="text"
            className="glass-input"
            placeholder="Search company or ticker..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{ width: '100%', paddingLeft: '36px', fontSize: '13px' }}
          />
          <Search size={14} color="var(--color-text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
        </form>

        {/* Tabs Link */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '10px' }}>
          <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-text-muted)', paddingLeft: '12px', marginBottom: '6px', letterSpacing: '0.05em' }}>DEEP ANALYSIS MODULES</span>
          
          <div className={`tab-link ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            <LineChartIcon size={16} /> Overview & Trends
          </div>
          <div className={`tab-link ${activeTab === 'confidence' ? 'active' : ''}`} onClick={() => setActiveTab('confidence')}>
            <Smile size={16} /> Confidence & Tone
          </div>
          <div className={`tab-link ${activeTab === 'bullbear' ? 'active' : ''}`} onClick={() => setActiveTab('bullbear')}>
            <TrendingUp size={16} /> Bull vs Bear Case
          </div>
          <div className={`tab-link ${activeTab === 'risks' ? 'active' : ''}`} onClick={() => setActiveTab('risks')}>
            <AlertTriangle size={16} /> Risks Detector
          </div>
          <div className={`tab-link ${activeTab === 'questions' ? 'active' : ''}`} onClick={() => setActiveTab('questions')}>
            <HelpCircle size={16} /> Analyst Q&A Audit
          </div>
          <div className={`tab-link ${activeTab === 'competitors' ? 'active' : ''}`} onClick={() => setActiveTab('competitors')}>
            <ArrowRightLeft size={16} /> Competitor Grid
          </div>
          <div className={`tab-link ${activeTab === 'rag' ? 'active' : ''}`} onClick={() => setActiveTab('rag')}>
            <Search size={16} /> RAG Search Chat
          </div>
          <div className={`tab-link ${activeTab === 'scenario' ? 'active' : ''}`} onClick={() => setActiveTab('scenario')}>
            <Play size={16} /> Scenario Simulator
          </div>
          <div className={`tab-link ${activeTab === 'upload' ? 'active' : ''}`} onClick={() => setActiveTab('upload')}>
            <FileText size={16} /> Ingest PDF Report
          </div>
        </div>

        {/* Watchlist Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto', borderTop: '1px solid var(--border-glass)', paddingTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: '12px', paddingRight: '4px' }}>
            <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>WATCHLIST</span>
            <button 
              className="glass-btn" 
              style={{ padding: '2px 6px', fontSize: '9px', background: 'rgba(255,255,255,0.02)' }}
              onClick={runMonitoringCheck}
              disabled={checkingAlerts}
            >
              <Bell size={10} className={checkingAlerts ? 'animate-spin' : ''} /> Check
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
            {watchlist.map(w => (
              <div 
                key={w.ticker} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '8px 12px', 
                  borderRadius: '6px', 
                  background: companyName === w.company_name ? 'rgba(0, 240, 255, 0.04)' : 'rgba(255, 255, 255, 0.01)',
                  border: `1px solid ${companyName === w.company_name ? 'rgba(0, 240, 255, 0.2)' : 'transparent'}`,
                  cursor: 'pointer'
                }}
                onClick={() => fetchAnalysis(w.ticker)}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>{w.ticker}</span>
                  <span style={{ fontSize: '9px', color: 'var(--color-text-muted)' }}>{w.company_name.slice(0, 15)}...</span>
                </div>
                <button 
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-rose)', opacity: 0.5 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromWatchlist(w.ticker);
                  }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          <button 
            className="glass-btn" 
            style={{ fontSize: '11px', justifyContent: 'center' }}
            onClick={() => addToWatchlist(companyName)}
          >
            <Plus size={12} /> Add Current to Watchlist
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="main-content">
        
        {/* Header toolbar */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', background: 'var(--color-cyan-glow)', color: 'var(--color-cyan)', border: '1px solid rgba(0,240,255,0.3)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                {activeData?.metadata?.ticker || 'TICKER'}
              </span>
              <h1 style={{ fontSize: '24px', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800 }}>{companyName}</h1>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              {activeData?.metadata?.sector} • {activeData?.metadata?.industry}
            </p>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Currency: <strong>{activeData?.metadata?.currency}</strong></span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Origin: <strong>{activeData?.metadata?.country}</strong></span>
          </div>
        </header>

        {/* Global Loading / Error Panels */}
        {loading && (
          <div className="glass-card text-center py-24" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', flex: 1, justifyContent: 'center' }}>
            <div style={{ width: '40px', height: '40px', border: '4px solid var(--border-glass)', borderTopColor: 'var(--color-cyan)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <h3 style={{ fontSize: '16px' }}>Fetching financial disclosures & earnings transcripts...</h3>
            <p className="color-text-muted" style={{ fontSize: '13px' }}>Gathering live data points and synthesizing NLP context. This takes 10-15s.</p>
          </div>
        )}

        {error && (
          <div className="glass-card text-center py-12" style={{ borderColor: 'var(--color-rose)' }}>
            <AlertTriangle size={36} color="var(--color-rose)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '16px', color: 'var(--color-rose)', marginBottom: '8px' }}>Operation Failed</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '13.5px' }}>{error}</p>
          </div>
        )}

        {/* Tab content view */}
        {!loading && activeData && (
          <div style={{ flex: 1 }}>
            {activeTab === 'overview' && <OverviewTab data={activeData} />}
            {activeTab === 'confidence' && <ConfidenceTab data={activeData} />}
            {activeTab === 'bullbear' && <BullBearTab data={activeData} />}
            {activeTab === 'risks' && <RisksTab data={activeData} />}
            {activeTab === 'questions' && <AnalystQuestionsTab companyName={companyName} apiBaseUrl={API_BASE_URL} />}
            {activeTab === 'competitors' && <CompetitorTab activeCompanyData={activeData} apiBaseUrl={API_BASE_URL} />}
            {activeTab === 'rag' && <RAGChatTab companyName={companyName} apiBaseUrl={API_BASE_URL} />}
            {activeTab === 'scenario' && <ScenarioTab activeCompanyData={activeData} apiBaseUrl={API_BASE_URL} />}
            {activeTab === 'upload' && <UploadTab onUploadSuccess={handleUploadSuccess} apiBaseUrl={API_BASE_URL} />}
          </div>
        )}
      </main>

      {/* Floating Watchlist Monitor Notification Card */}
      {showNotificationPopup && alerts.length > 0 && (
        <div 
          className="glass-card rose-accent animate-fade-in" 
          style={{ 
            position: 'fixed', 
            bottom: '24px', 
            right: '24px', 
            width: '350px', 
            zIndex: 1000, 
            borderTop: '4px solid var(--color-rose)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.8)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <h4 style={{ fontSize: '14px', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Bell size={14} color="var(--color-rose)" /> {alerts[0].title}
            </h4>
            <button 
              style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '12px' }}
              onClick={() => setShowNotificationPopup(false)}
            >
              ✕
            </button>
          </div>
          
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: 'var(--color-text-secondary)', paddingLeft: '4px' }}>
            {alerts[0].key_changes.map((item, idx) => (
              <li key={idx} style={{ display: 'flex', gap: '6px' }}>
                <span style={{ color: 'var(--color-rose)' }}>•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
    </div>
  );
}

export default App;
