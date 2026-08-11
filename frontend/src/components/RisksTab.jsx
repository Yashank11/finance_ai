import React, { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { AlertCircle, ShieldAlert, Sparkles, MessageSquare } from 'lucide-react';

const RisksTab = ({ data }) => {
  if (!data || !data.quarters || data.quarters.length === 0) {
    return (
      <div className="glass-card text-center py-12">
        <p className="color-text-secondary">No data available.</p>
      </div>
    );
  }

  const { quarters } = data;
  const [selectedQuarterIdx, setSelectedQuarterIdx] = useState(quarters.length - 1);
  const currentQ = quarters[selectedQuarterIdx];

  const getSeverityColor = (severity) => {
    switch (severity.toLowerCase()) {
      case 'high': return 'var(--color-rose)';
      case 'medium': return 'var(--color-amber)';
      case 'low': return 'var(--color-emerald)';
      default: return 'var(--color-text-secondary)';
    }
  };

  // Calculate overall risk level based on severity and counts
  const calculateOverallRisk = () => {
    if (!currentQ.risks || currentQ.risks.length === 0) return { level: 'Low', score: 20 };
    
    let totalScore = 0;
    currentQ.risks.forEach(r => {
      let weight = 1;
      if (r.severity.toLowerCase() === 'high') weight = 3;
      else if (r.severity.toLowerCase() === 'medium') weight = 2;
      
      totalScore += r.discussion_frequency * weight;
    });

    if (totalScore > 35) return { level: 'High Risk', score: totalScore, color: 'var(--color-rose)' };
    if (totalScore > 15) return { level: 'Medium Risk', score: totalScore, color: 'var(--color-amber)' };
    return { level: 'Low Risk', score: totalScore, color: 'var(--color-emerald)' };
  };

  const overallRisk = calculateOverallRisk();

  // Prepare chart data
  const riskChartData = currentQ.risks?.map(r => ({
    name: r.category,
    Mentions: r.discussion_frequency
  })) || [];

  return (
    <div className="animate-fade-in flex flex-col" style={{ gap: '24px' }}>
      
      {/* Quarter Selector */}
      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
        {quarters.map((q, idx) => (
          <button
            key={q.quarter_label}
            className={`glass-btn ${idx === selectedQuarterIdx ? 'primary' : ''}`}
            onClick={() => setSelectedQuarterIdx(idx)}
          >
            {q.quarter_label} Risks
          </button>
        ))}
      </div>

      {/* Top Row: Overall Risk Summary & Mentions Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
        {/* Overall Risk Score */}
        <div className="glass-card cyan-accent" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '16px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={18} color="var(--color-cyan)" />
              <span>Corporate Risk Assessment Profile</span>
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
              Linguistic risk density from earnings call transcript
            </p>
          </div>

          <div style={{ textAlign: 'center', margin: '15px 0' }}>
            <span style={{ fontSize: '42px', fontWeight: 800, color: overallRisk.color, fontFamily: 'var(--font-display)' }}>
              {overallRisk.level}
            </span>
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              Risk Score Density Index: {overallRisk.score}
            </p>
          </div>

          <div style={{ width: '100%', background: 'rgba(255,255,255,0.05)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, (overallRisk.score / 60) * 100)}%`, height: '100%', background: overallRisk.color }} />
          </div>
        </div>

        {/* Mentions Chart */}
        <div className="glass-card">
          <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Risk Topic Discussion Frequency</h3>
          <div style={{ width: '100%', height: '180px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskChartData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                <XAxis type="number" stroke="var(--color-text-muted)" />
                <YAxis type="category" dataKey="name" stroke="var(--color-text-muted)" width={80} style={{ fontSize: '11px' }} />
                <Tooltip contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-glass)', borderRadius: '8px', color: 'var(--color-text-primary)' }} />
                <Bar dataKey="Mentions" fill="var(--color-rose)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Risks Detailed Cards */}
      <h3 style={{ fontSize: '16px', marginTop: '12px' }}>Categorized Risks & Transcribed Management Defense</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {currentQ.risks?.map((risk, idx) => (
          <div key={idx} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', color: 'var(--color-cyan)', fontWeight: 600 }}>
                  {risk.category}
                </span>
                <h4 style={{ fontSize: '15px', fontWeight: 600 }}>{risk.risk_name}</h4>
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <span style={{ fontSize: '11px', background: `${getSeverityColor(risk.severity)}20`, color: getSeverityColor(risk.severity), border: `1px solid ${getSeverityColor(risk.severity)}50`, padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                  Severity: {risk.severity}
                </span>
                <span style={{ fontSize: '11px', background: 'var(--color-rose-glow)', color: 'var(--color-rose)', border: '1px solid rgba(244,63,94,0.3)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                  Mentions: {risk.discussion_frequency}
                </span>
              </div>
            </div>

            {/* Transcript Quote */}
            {risk.quote && (
              <div style={{ background: 'rgba(255,255,255,0.01)', borderLeft: '3px solid var(--color-rose)', padding: '12px 16px', borderRadius: '0 8px 8px 0', fontSize: '13px', fontStyle: 'italic', color: 'var(--color-text-secondary)', display: 'flex', gap: '10px' }}>
                <MessageSquare size={16} color="var(--color-rose)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <p>"{risk.quote}"</p>
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
};

export default RisksTab;
