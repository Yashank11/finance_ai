import React, { useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { ArrowRight, MessageSquare, ShieldAlert, Award, Smile } from 'lucide-react';

const ConfidenceTab = ({ data }) => {
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
  
  // Previous quarter helper
  const prevQ = selectedQuarterIdx > 0 ? quarters[selectedQuarterIdx - 1] : null;

  // Prepare data for the tone tracking chart
  const toneChartData = quarters.map(q => ({
    name: q.quarter_label,
    Optimistic: q.management_personality?.optimistic || 0,
    Defensive: q.management_personality?.defensive || 0,
    Aggressive: q.management_personality?.aggressive || 0,
    Evasive: q.management_personality?.evasive || 0,
    Analytical: q.management_personality?.analytical || 0,
  }));

  // Function to highlight phrases
  const highlightRemarks = (text) => {
    if (!text) return "";
    
    // List of optimistic and defensive keywords for color highlighting
    const positiveWords = ["strong growth", "excellent demand", "expansion", "accelerating", "robust", "momentum", "record", "leadership", "confidence", "excited", "delighted"];
    const negativeWords = ["challenging environment", "margin pressure", "uncertainty", "headwinds", "decline", "slowdown", "softness", "cautious", "pressure", "difficult", "cost management"];
    
    let html = text;
    positiveWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      html = html.replace(regex, `<span style="color: var(--color-emerald); font-weight: 600; text-decoration: underline;">$&</span>`);
    });
    
    negativeWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      html = html.replace(regex, `<span style="color: var(--color-rose); font-weight: 600; text-decoration: underline;">$&</span>`);
    });
    
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  };

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
            {q.quarter_label} Analysis
          </button>
        ))}
      </div>

      {/* Top Section: Confidence Score Meter */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
        {/* Confidence Gauge */}
        <div className="glass-card cyan-accent" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={18} color="var(--color-cyan)" />
            <span>Management Confidence Level</span>
          </h3>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: '20px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ position: 'relative', width: '130px', height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: '8px solid rgba(255,255,255,0.05)', borderTopColor: 'var(--color-cyan)', transform: 'rotate(45deg)' }}>
                <div style={{ transform: 'rotate(-45deg)', fontSize: '36px', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--color-cyan)' }}>
                  {currentQ.confidence_score}
                </div>
              </div>
              <p style={{ marginTop: '12px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>Confidence Index</p>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {prevQ && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div>
                    <p style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>PREVIOUS QUARTER</p>
                    <p style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{prevQ.confidence_score}</p>
                  </div>
                  <ArrowRight size={18} color="var(--color-text-muted)" />
                  <div>
                    <p style={{ fontSize: '11px', color: 'var(--color-cyan)' }}>CURRENT QUARTER</p>
                    <p style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-cyan)' }}>{currentQ.confidence_score}</p>
                  </div>
                </div>
              )}
              <div style={{ borderLeft: '3px solid var(--color-cyan)', paddingLeft: '12px', fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
                {prevQ ? (
                  currentQ.confidence_score > prevQ.confidence_score ? 
                    "Confidence score increased, indicating a more bullish outlook from management." :
                    currentQ.confidence_score < prevQ.confidence_score ?
                    "Confidence score declined, signaling growing caution or headwinds." :
                    "Confidence score remains unchanged from the prior period."
                ) : "Baseline quarter setup."}
              </div>
            </div>
          </div>
        </div>

        {/* Explain Card */}
        <div className="glass-card">
          <h3 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={18} color="var(--color-rose)" />
            <span>AI Confidence Narrative</span>
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
            {currentQ.confidence_explanation}
          </p>
        </div>
      </div>

      {/* Middle Section: Linguistic Tone Changes */}
      {prevQ && (
        <div className="glass-card">
          <h3 style={{ fontSize: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={18} color="var(--color-violet)" />
            <span>Management Tone Shift: {prevQ.quarter_label} vs {currentQ.quarter_label}</span>
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
            Highlights: <span style={{ color: 'var(--color-emerald)', fontWeight: 600 }}>Optimistic words</span> / <span style={{ color: 'var(--color-rose)', fontWeight: 600 }}>Defensive/Cautious words</span>
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)' }}>{prevQ.quarter_label} REMARKS</span>
                <span style={{ fontSize: '11px', background: 'rgba(16,185,129,0.1)', color: 'var(--color-emerald)', padding: '2px 8px', borderRadius: '4px' }}>Score: {prevQ.confidence_score}</span>
              </div>
              <blockquote style={{ fontSize: '13.5px', color: 'var(--color-text-secondary)', lineHeight: '1.6', fontStyle: 'italic' }}>
                "{highlightRemarks(prevQ.ceo_remarks)}"
              </blockquote>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)' }}>{currentQ.quarter_label} REMARKS</span>
                <span style={{ fontSize: '11px', background: 'rgba(244,63,94,0.1)', color: 'var(--color-rose)', padding: '2px 8px', borderRadius: '4px' }}>Score: {currentQ.confidence_score}</span>
              </div>
              <blockquote style={{ fontSize: '13.5px', color: 'var(--color-text-secondary)', lineHeight: '1.6', fontStyle: 'italic' }}>
                "{highlightRemarks(currentQ.ceo_remarks)}"
              </blockquote>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Section: Management Tone Across Quarters */}
      <div className="glass-card">
        <h3 style={{ fontSize: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Smile size={18} color="var(--color-cyan)" />
          <span>Management Personality Profile Trend (Linguistic Dimensions)</span>
        </h3>
        <div style={{ width: '100%', height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={toneChartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="name" stroke="var(--color-text-muted)" />
              <YAxis stroke="var(--color-text-muted)" unit="%" />
              <Tooltip contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-glass)', borderRadius: '8px', color: 'var(--color-text-primary)' }} />
              <Legend />
              <Line type="monotone" dataKey="Optimistic" stroke="var(--color-emerald)" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="Defensive" stroke="var(--color-rose)" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="Aggressive" stroke="var(--color-amber)" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="Evasive" stroke="#9ca3af" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="Analytical" stroke="var(--color-cyan)" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ConfidenceTab;
