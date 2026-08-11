import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, TrendingUp, HelpCircle } from 'lucide-react';

const BullBearTab = ({ data }) => {
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
            {q.quarter_label} Bull/Bear
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
        {/* Bull Case Card */}
        <div className="glass-card emerald-accent" style={{ borderTop: '4px solid var(--color-emerald)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ background: 'var(--color-emerald-glow)', padding: '10px', borderRadius: '8px' }}>
              <TrendingUp size={22} color="var(--color-emerald)" />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', color: '#fff' }}>The Bull Case</h3>
              <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Growth Drivers & Strengths</p>
            </div>
          </div>

          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {currentQ.bull_points?.map((point, idx) => (
              <li key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <CheckCircle2 size={18} color="var(--color-emerald)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
                  {point}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bear Case Card */}
        <div className="glass-card rose-accent" style={{ borderTop: '4px solid var(--color-rose)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ background: 'var(--color-rose-glow)', padding: '10px', borderRadius: '8px' }}>
              <AlertTriangle size={22} color="var(--color-rose)" />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', color: '#fff' }}>The Bear Case</h3>
              <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Threats, Volatilities & Softness</p>
            </div>
          </div>

          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {currentQ.bear_points?.map((point, idx) => (
              <li key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <AlertTriangle size={18} color="var(--color-rose)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
                  {point}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Analyst Rating Box */}
      <div className="glass-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <HelpCircle size={20} color="var(--color-cyan)" />
          <div>
            <h4 style={{ fontSize: '14px' }}>AI Investment Recommendation Score</h4>
            <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Weighted ratio of positive indicators to risks</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-cyan)', fontFamily: 'var(--font-display)' }}>
            {((currentQ.bull_points?.length || 1) / ((currentQ.bull_points?.length || 1) + (currentQ.bear_points?.length || 1)) * 10).toFixed(1)}
          </span>
          <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>/ 10 (Hold)</span>
        </div>
      </div>

    </div>
  );
};

export default BullBearTab;
