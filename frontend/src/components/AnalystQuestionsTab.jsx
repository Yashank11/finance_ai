import React, { useState, useEffect } from 'react';
import { MessageSquare, ShieldAlert, Users, Layers, ArrowDownRight, RefreshCw } from 'lucide-react';

const AnalystQuestionsTab = ({ companyName, apiBaseUrl }) => {
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedClusterId, setExpandedClusterId] = useState(null);
  const [selectedQA, setSelectedQA] = useState(null);

  const fetchClusters = async () => {
    if (!companyName) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/api/company/cluster_questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_name: companyName })
      });
      if (response.ok) {
        const data = await response.json();
        setClusters(data.clusters || []);
        if (data.clusters && data.clusters.length > 0) {
          setExpandedClusterId(data.clusters[0].id);
        }
      } else {
        const errData = await response.json();
        setError(errData.detail || 'Failed to fetch analyst question clusters.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error while fetching question clusters.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClusters();
  }, [companyName]);

  const getDefensivenessLabel = (score) => {
    if (score >= 4.0) return { label: 'High / Defensive', color: 'var(--color-rose)' };
    if (score >= 2.5) return { label: 'Medium / Cautious', color: 'var(--color-amber)' };
    return { label: 'Low / Open', color: 'var(--color-emerald)' };
  };

  return (
    <div className="animate-fade-in flex flex-col" style={{ gap: '24px' }}>
      
      {/* Tab Intro */}
      <div className="glass-card cyan-accent" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Layers size={18} color="var(--color-cyan)" />
            <span>NLP Question Clustering & Response Auditing</span>
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            We pull all questions asked by Wall Street analysts and cluster them using TF-IDF + K-Means, then audit management's answers.
          </p>
        </div>
        
        <button className="glass-btn" onClick={fetchClusters} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Re-Cluster
        </button>
      </div>

      {loading && (
        <div className="glass-card text-center py-12" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '30px', height: '30px', border: '3px solid var(--border-glass)', borderTopColor: 'var(--color-cyan)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p className="color-text-secondary">Running TF-IDF feature extraction and K-Means clustering in backend...</p>
        </div>
      )}

      {error && (
        <div className="glass-card text-center py-6" style={{ borderColor: 'var(--color-rose)' }}>
          <p style={{ color: 'var(--color-rose)' }}>{error}</p>
        </div>
      )}

      {!loading && !error && clusters.length === 0 && (
        <div className="glass-card text-center py-12">
          <p className="color-text-secondary">No analyst Q&A transcript data found to cluster.</p>
        </div>
      )}

      {!loading && !error && clusters.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', alignItems: 'flex-start' }}>
          {/* Left Side: Cluster List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>CLUSTERS IDENTIFIED</span>
            {clusters.map((c) => {
              const def = getDefensivenessLabel(c.avg_defensiveness);
              const isSelected = expandedClusterId === c.id;
              
              return (
                <div
                  key={c.id}
                  className="glass-card"
                  style={{
                    padding: '16px',
                    cursor: 'pointer',
                    borderColor: isSelected ? 'var(--color-cyan)' : 'var(--border-glass)',
                    background: isSelected ? 'rgba(0, 240, 255, 0.03)' : 'var(--bg-glass)'
                  }}
                  onClick={() => {
                    setExpandedClusterId(c.id);
                    setSelectedQA(null);
                  }}
                >
                  <h4 style={{ fontSize: '14.5px', color: isSelected ? '#fff' : 'var(--color-text-secondary)', marginBottom: '8px' }}>
                    {c.title}
                  </h4>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Users size={12} /> {c.count} Questions
                    </span>
                    <span style={{ color: def.color, fontWeight: 600 }}>
                      Defensiveness: {c.avg_defensiveness}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Side: Questions in Selected Cluster */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {(() => {
              const activeCluster = clusters.find(c => c.id === expandedClusterId);
              if (!activeCluster) return null;
              
              return (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>
                      QUESTIONS IN: {activeCluster.title.toUpperCase()}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      Topic Defensiveness Avg: <strong style={{ color: getDefensivenessLabel(activeCluster.avg_defensiveness).color }}>{activeCluster.avg_defensiveness} / 5</strong>
                    </span>
                  </div>

                  {activeCluster.questions.map((qa, idx) => {
                    const qaDef = getDefensivenessLabel(qa.defensiveness);
                    const isQASelected = selectedQA === idx;
                    
                    return (
                      <div
                        key={idx}
                        className="glass-card"
                        style={{
                          padding: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px'
                        }}
                      >
                        {/* Meta */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                            {qa.analyst} <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)' }}>({qa.firm})</span>
                          </span>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.05)', padding: '1px 6px', borderRadius: '4px' }}>
                              {qa.quarter}
                            </span>
                            <span style={{ fontSize: '11px', color: qaDef.color, fontWeight: 600, background: `${qaDef.color}15`, padding: '1px 6px', borderRadius: '4px', border: `1px solid ${qaDef.color}40` }}>
                              Answer Defensiveness: {qa.defensiveness}
                            </span>
                          </div>
                        </div>

                        {/* Question Text */}
                        <div style={{ fontSize: '13.5px', color: 'var(--color-text-secondary)', lineHeight: '1.5', display: 'flex', gap: '8px' }}>
                          <ArrowDownRight size={16} color="var(--color-cyan)" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <p><strong>Q:</strong> {qa.question}</p>
                        </div>

                        {/* Answer Toggle Button */}
                        <button
                          className="glass-btn"
                          style={{ alignSelf: 'flex-start', fontSize: '12px', padding: '6px 12px' }}
                          onClick={() => setSelectedQA(isQASelected ? null : idx)}
                        >
                          {isQASelected ? 'Hide Response' : 'View Response & Audit'}
                        </button>

                        {/* Answer Panel */}
                        {isQASelected && (
                          <div
                            className="animate-fade-in"
                            style={{
                              background: 'rgba(255,255,255,0.01)',
                              borderLeft: `3px solid ${qaDef.color}`,
                              padding: '12px 16px',
                              borderRadius: '0 8px 8px 0',
                              fontSize: '13px',
                              color: 'var(--color-text-secondary)',
                              lineHeight: '1.6',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px'
                            }}
                          >
                            <p><strong>A:</strong> {qa.answer}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--color-text-muted)', borderTop: '1px solid var(--border-glass)', paddingTop: '8px', marginTop: '4px' }}>
                              <ShieldAlert size={14} color={qaDef.color} />
                              <span>AI Audit: Management response evaluated as <strong>{qaDef.label.toLowerCase()}</strong>.</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalystQuestionsTab;
