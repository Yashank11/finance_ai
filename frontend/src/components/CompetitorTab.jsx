import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Plus, Trash2, ArrowRightLeft, Sparkles, RefreshCw } from 'lucide-react';

const CompetitorTab = ({ activeCompanyData, apiBaseUrl }) => {
  const [competitors, setCompetitors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize competitors with default resolved suggestions from active metadata
  useEffect(() => {
    if (activeCompanyData?.metadata?.competitor_tickers) {
      setCompetitors([]); // Clear old comparison
      loadCompetitorData(activeCompanyData.metadata.competitor_tickers.slice(0, 2));
    }
  }, [activeCompanyData]);

  const loadCompetitorData = async (tickers) => {
    if (!tickers || tickers.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const fetchPromises = tickers.map(ticker =>
        fetch(`${apiBaseUrl}/api/company/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ company_name: ticker })
        }).then(res => {
          if (!res.ok) throw new Error(`Failed to load competitor: ${ticker}`);
          return res.json();
        })
      );
      
      const results = await Promise.all(fetchPromises);
      setCompetitors(prev => {
        // Prevent duplicates
        const existingTickers = prev.map(c => c.metadata.ticker.toLowerCase());
        const newCompetitors = results.filter(r => !existingTickers.includes(r.metadata.ticker.toLowerCase()));
        return [...prev, ...newCompetitors];
      });
    } catch (err) {
      console.error(err);
      setError('Error loading competitor comparative profiles.');
    } finally {
      setLoading(false);
    }
  };

  const addCompetitor = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/api/company/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_name: searchQuery })
      });
      if (response.ok) {
        const data = await response.json();
        setCompetitors(prev => {
          if (prev.some(c => c.metadata.ticker.toLowerCase() === data.metadata.ticker.toLowerCase()) || 
              data.metadata.ticker.toLowerCase() === activeCompanyData.metadata.ticker.toLowerCase()) {
            return prev;
          }
          return [...prev, data];
        });
        setSearchQuery('');
      } else {
        const errData = await response.json();
        setError(errData.detail || 'Could not find or analyze this competitor.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error while adding competitor.');
    } finally {
      setLoading(false);
    }
  };

  const removeCompetitor = (ticker) => {
    setCompetitors(prev => prev.filter(c => c.metadata.ticker !== ticker));
  };

  if (!activeCompanyData) return null;

  // Compile comparison data
  const mainQuarter = activeCompanyData.quarters[activeCompanyData.quarters.length - 1];
  
  const comparisonRows = [
    {
      metric: 'Revenue Growth (%)',
      main: mainQuarter.revenue_growth,
      competitors: competitors.map(c => {
        const q = c.quarters[c.quarters.length - 1];
        return { ticker: c.metadata.ticker, value: q.revenue_growth };
      })
    },
    {
      metric: 'Operating Margin (%)',
      main: mainQuarter.margin,
      competitors: competitors.map(c => {
        const q = c.quarters[c.quarters.length - 1];
        return { ticker: c.metadata.ticker, value: q.margin };
      })
    },
    {
      metric: 'Confidence Score',
      main: mainQuarter.confidence_score,
      competitors: competitors.map(c => {
        const q = c.quarters[c.quarters.length - 1];
        return { ticker: c.metadata.ticker, value: q.confidence_score };
      })
    }
  ];

  // Prepare chart data
  const chartData = [
    {
      name: activeCompanyData.metadata.ticker,
      'Revenue Growth': mainQuarter.revenue_growth,
      'Operating Margin': mainQuarter.margin,
      'Confidence Score': mainQuarter.confidence_score
    },
    ...competitors.map(c => {
      const q = c.quarters[c.quarters.length - 1];
      return {
        name: c.metadata.ticker,
        'Revenue Growth': q.revenue_growth,
        'Operating Margin': q.margin,
        'Confidence Score': q.confidence_score
      };
    })
  ];

  return (
    <div className="animate-fade-in flex flex-col" style={{ gap: '24px' }}>
      
      {/* Competitor Search / Selection Row */}
      <div className="glass-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ArrowRightLeft size={18} color="var(--color-cyan)" />
          <div>
            <h3 style={{ fontSize: '15px' }}>Competitive Intelligence Grid</h3>
            <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Compare recent quarterly performance metrics side-by-side</p>
          </div>
        </div>

        <form onSubmit={addCompetitor} style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            className="glass-input"
            placeholder="Add Competitor (e.g. M&M.NS, AMD)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={loading}
            style={{ width: '220px', fontSize: '13px' }}
          />
          <button type="submit" className="glass-btn primary" disabled={loading} style={{ fontSize: '13px', padding: '6px 14px' }}>
            <Plus size={14} /> Add
          </button>
        </form>
      </div>

      {loading && (
        <div className="glass-card text-center py-6" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <RefreshCw size={16} className="animate-spin" />
          <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Fetching competitor financial disclosures...</span>
        </div>
      )}

      {error && (
        <div className="glass-card text-center py-4" style={{ borderColor: 'var(--color-rose)' }}>
          <p style={{ color: 'var(--color-rose)', fontSize: '13px' }}>{error}</p>
        </div>
      )}

      {/* Comparison Grid & Matrix */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        
        {/* Comparison Table */}
        <div className="glass-card">
          <h3 style={{ fontSize: '16px', marginBottom: '20px' }}>Comparative Matrix Table</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--color-text-secondary)' }}>
                  <th style={{ padding: '12px 8px' }}>Metric</th>
                  <th style={{ padding: '12px 8px', color: 'var(--color-cyan)', fontWeight: 600 }}>{activeCompanyData.metadata.ticker} (Active)</th>
                  {competitors.map(c => (
                    <th key={c.metadata.ticker} style={{ padding: '12px 8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <span>{c.metadata.ticker}</span>
                        <button 
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-rose)', opacity: 0.7 }}
                          onClick={() => removeCompetitor(c.metadata.ticker)}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                    <td style={{ padding: '14px 8px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>{row.metric}</td>
                    <td style={{ padding: '14px 8px', color: 'var(--color-cyan)', fontWeight: 700 }}>{row.main}</td>
                    {row.competitors.map(comp => (
                      <td key={comp.ticker} style={{ padding: '14px 8px' }}>{comp.value}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Comparison Charts */}
        <div className="glass-card">
          <h3 style={{ fontSize: '16px', marginBottom: '20px' }}>Cross-Company Metric Visualizer</h3>
          <div style={{ width: '100%', height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="name" stroke="var(--color-text-muted)" />
                <YAxis stroke="var(--color-text-muted)" />
                <Tooltip contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-glass)', borderRadius: '8px', color: 'var(--color-text-primary)' }} />
                <Legend />
                <Bar dataKey="Revenue Growth" fill="var(--color-rose)" name="Revenue Growth (%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Operating Margin" fill="var(--color-emerald)" name="Operating Margin (%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Confidence Score" fill="var(--color-cyan)" name="Confidence Score" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
      
    </div>
  );
};

export default CompetitorTab;
