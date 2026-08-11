import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Play, Sparkles, AlertCircle, Percent, BarChart3, TrendingUp } from 'lucide-react';

const ScenarioTab = ({ activeCompanyData, apiBaseUrl }) => {
  const [revenue, setRevenue] = useState(0);
  const [margin, setMargin] = useState(0);
  const [growthShift, setGrowthShift] = useState(5.0);
  const [marginShift, setMarginShift] = useState(-1.0);
  const [volatility, setVolatility] = useState(5.0);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  // Initialize values from latest quarter data
  useEffect(() => {
    if (activeCompanyData && activeCompanyData.quarters) {
      const latestQ = activeCompanyData.quarters[activeCompanyData.quarters.length - 1];
      setRevenue(latestQ.revenue);
      setMargin(latestQ.margin);
      setResults(null);
    }
  }, [activeCompanyData]);

  const runSimulation = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/api/company/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          revenue: revenue,
          margin: margin,
          growth_shift: parseFloat(growthShift),
          margin_shift: parseFloat(marginShift),
          volatility: parseFloat(volatility) / 100.0 // convert percent to ratio
        })
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data);
      } else {
        const errData = await response.json();
        setError(errData.detail || 'Simulation error.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error running forecast simulation.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
    return new Intl.NumberFormat().format(value);
  };

  if (!activeCompanyData) return null;

  return (
    <div className="animate-fade-in flex flex-col" style={{ gap: '24px' }}>
      
      {/* Intro */}
      <div className="glass-card cyan-accent" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <Sparkles size={18} color="var(--color-cyan)" />
          <span>Interactive Monte Carlo Earnings Forecast & Scenario Planner</span>
        </h3>
        <p style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
          Adjust strategic growth assumptions and profit expansion profiles. The engine executes a NumPy-based Monte Carlo path analysis to simulate next quarter's revenue and operating income distributions, then uses Gemini to draft a simulated CEO defense response for that forecast.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', alignItems: 'flex-start' }}>
        
        {/* Left Side: Controls */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '15px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px' }}>Projection Assumptions</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Revenue growth target:</span>
              <span style={{ color: 'var(--color-cyan)', fontWeight: 600 }}>{growthShift}%</span>
            </div>
            <input 
              type="range" 
              min="-20" 
              max="20" 
              step="0.5"
              value={growthShift} 
              onChange={(e) => setGrowthShift(e.target.value)}
              disabled={loading}
              style={{ accentColor: 'var(--color-cyan)' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Operating margin expansion:</span>
              <span style={{ color: 'var(--color-emerald)', fontWeight: 600 }}>{marginShift}%</span>
            </div>
            <input 
              type="range" 
              min="-10" 
              max="10" 
              step="0.2"
              value={marginShift} 
              onChange={(e) => setMarginShift(e.target.value)}
              disabled={loading}
              style={{ accentColor: 'var(--color-emerald)' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Volatility / Uncertainty index:</span>
              <span style={{ color: 'var(--color-rose)', fontWeight: 600 }}>{volatility}%</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="20" 
              step="0.5"
              value={volatility} 
              onChange={(e) => setVolatility(e.target.value)}
              disabled={loading}
              style={{ accentColor: 'var(--color-rose)' }}
            />
          </div>

          <button 
            className="glass-btn primary" 
            onClick={runSimulation} 
            disabled={loading}
            style={{ justifyContent: 'center', marginTop: '10px' }}
          >
            <Play size={14} fill="currentColor" /> Run Monte Carlo Forecast
          </button>
        </div>

        {/* Right Side: Simulation Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {loading && (
            <div className="glass-card text-center py-20" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '30px', height: '30px', border: '3px solid var(--border-glass)', borderTopColor: 'var(--color-cyan)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <p className="color-text-secondary">Simulating 500 projection paths and generating AI CEO narrative...</p>
            </div>
          )}

          {error && (
            <div className="glass-card text-center py-6" style={{ borderColor: 'var(--color-rose)' }}>
              <p style={{ color: 'var(--color-rose)' }}>{error}</p>
            </div>
          )}

          {!loading && !results && (
            <div className="glass-card text-center py-20">
              <Sparkles size={30} color="var(--color-cyan)" style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p className="color-text-secondary">Configure assumptions on the left and trigger simulation to run the predictive model.</p>
            </div>
          )}

          {!loading && results && (
            <>
              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <div className="glass-card" style={{ padding: '16px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-rose)', fontWeight: 600 }}>BEAR PROJECTION (10th)</span>
                  <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '6px' }}>
                    {activeCompanyData.metadata.currency === 'INR' ? '₹' : '$'}{formatCurrency(results.summary.revenue.p10)}
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Margin: {results.summary.margin.p10.toFixed(1)}%</span>
                </div>
                <div className="glass-card cyan-accent" style={{ padding: '16px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-cyan)', fontWeight: 600 }}>EXPECTED OUTCOME (Median)</span>
                  <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '6px', color: 'var(--color-cyan)' }}>
                    {activeCompanyData.metadata.currency === 'INR' ? '₹' : '$'}{formatCurrency(results.summary.revenue.p50)}
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Margin: {results.summary.margin.p50.toFixed(1)}%</span>
                </div>
                <div className="glass-card" style={{ padding: '16px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-emerald)', fontWeight: 600 }}>BULL PROJECTION (90th)</span>
                  <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '6px' }}>
                    {activeCompanyData.metadata.currency === 'INR' ? '₹' : '$'}{formatCurrency(results.summary.revenue.p90)}
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Margin: {results.summary.margin.p90.toFixed(1)}%</span>
                </div>
              </div>

              {/* Distribution curve chart */}
              <div className="glass-card">
                <h3 style={{ fontSize: '14px', marginBottom: '16px' }}>Projected Revenue Probability Density Curve</h3>
                <div style={{ width: '100%', height: '180px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={results.distributions.revenue} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSim" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-cyan)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--color-cyan)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                      <XAxis dataKey="bin" stroke="var(--color-text-muted)" tickFormatter={formatCurrency} />
                      <YAxis stroke="var(--color-text-muted)" />
                      <Tooltip 
                        contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-glass)', borderRadius: '8px', color: 'var(--color-text-primary)' }}
                        formatter={(value) => [value, "Occurrences"]}
                        labelFormatter={(label) => `Value: ${activeCompanyData.metadata.currency === 'INR' ? '₹' : '$'}${formatCurrency(label)}`}
                      />
                      <Area type="monotone" dataKey="count" stroke="var(--color-cyan)" strokeWidth={2} fillOpacity={1} fill="url(#colorSim)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Simulated CEO Q&A Response */}
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={{ fontSize: '14.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={16} color="var(--color-cyan)" />
                  <span>Simulated CEO Outlook (Projected Case Q&A)</span>
                </h3>
                <blockquote style={{ background: 'rgba(255,255,255,0.01)', borderLeft: '3px solid var(--color-cyan)', padding: '12px 16px', borderRadius: '0 8px 8px 0', fontSize: '13px', fontStyle: 'italic', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                  "{results.ceo_commentary}"
                </blockquote>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--color-text-muted)', borderTop: '1px solid var(--border-glass)', paddingTop: '8px' }}>
                  <Sparkles size={14} color="var(--color-cyan)" />
                  <span>AI Tone Audit: <strong>{results.tone_analysis}</strong></span>
                </div>
              </div>
            </>
          )}

        </div>

      </div>

    </div>
  );
};

export default ScenarioTab;
