import React from 'react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Percent, BarChart3, AlertCircle } from 'lucide-react';

const OverviewTab = ({ data }) => {
  if (!data || !data.quarters || data.quarters.length === 0) {
    return (
      <div className="glass-card animate-fade-in text-center py-12">
        <p className="color-text-secondary">No financial data available. Select or search a company.</p>
      </div>
    );
  }

  const { quarters, stock_history, metadata } = data;
  const latestQ = quarters[quarters.length - 1];
  const firstQ = quarters[0];

  // Format big numbers
  const formatCurrency = (value) => {
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
    return new Intl.NumberFormat().format(value);
  };

  // Detect trend
  const detectRevenueTrend = () => {
    if (quarters.length < 2) return { status: 'neutral', text: 'Insufficient historical data.' };
    const growths = quarters.map(q => q.revenue_growth);
    const last = growths[growths.length - 1];
    const prev = growths[growths.length - 2];
    
    // Check if growth is decreasing across quarters
    let decreasing = true;
    for (let i = 1; i < growths.length; i++) {
      if (growths[i] > growths[i-1]) {
        decreasing = false;
        break;
      }
    }

    if (decreasing) {
      return { 
        status: 'negative', 
        text: `Growth slowdown trend detected. Revenue growth rate has slowed down sequentially for the last ${growths.length} quarters, moving from ${growths[0]}% to ${growths[growths.length - 1]}%.` 
      };
    } else if (last > prev) {
      return { 
        status: 'positive', 
        text: `Growth acceleration detected. Revenue growth increased from ${prev}% to ${last}% in the latest quarter.` 
      };
    } else {
      return { 
        status: 'stable', 
        text: `Consistent performance. Revenue growth is currently hovering around ${last}%.` 
      };
    }
  };

  const trend = detectRevenueTrend();

  return (
    <div className="animate-fade-in flex flex-col" style={{ gap: '24px' }}>
      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        <div className="glass-card cyan-accent" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>REVENUE ({latestQ.quarter_label})</span>
            <DollarSign size={18} color="var(--color-cyan)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
            {metadata.currency === 'INR' ? '₹' : '$'}{formatCurrency(latestQ.revenue)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', fontSize: '12px' }}>
            {latestQ.revenue_growth >= 0 ? (
              <TrendingUp size={14} color="var(--color-emerald)" />
            ) : (
              <TrendingDown size={14} color="var(--color-rose)" />
            )}
            <span style={{ color: latestQ.revenue_growth >= 0 ? 'var(--color-emerald)' : 'var(--color-rose)', fontWeight: 600 }}>
              {latestQ.revenue_growth}%
            </span>
            <span style={{ color: 'var(--color-text-muted)' }}>YoY Growth</span>
          </div>
        </div>

        <div className="glass-card emerald-accent" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>OPERATING MARGIN</span>
            <Percent size={18} color="var(--color-emerald)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
            {latestQ.margin}%
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            <span>Prior Q: {firstQ.margin}%</span>
          </div>
        </div>

        <div className="glass-card violet-accent" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>NET INCOME ({latestQ.quarter_label})</span>
            <BarChart3 size={18} color="var(--color-violet)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
            {metadata.currency === 'INR' ? '₹' : '$'}{formatCurrency(latestQ.net_income)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            <span>Net Profit Margin: {((latestQ.net_income / latestQ.revenue) * 100).toFixed(1)}%</span>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>CONFIDENCE SCORE</span>
            <AlertCircle size={18} color="var(--color-cyan)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--color-cyan)' }}>
            {latestQ.confidence_score} <span style={{ fontSize: '16px', color: 'var(--color-text-secondary)', fontWeight: 400 }}>/100</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            <span>Shift: {firstQ.confidence_score} → {latestQ.confidence_score}</span>
          </div>
        </div>
      </div>

      {/* AI Trend Alert Banner */}
      <div className="glass-card cyan-accent" style={{ padding: '16px 24px', display: 'flex', gap: '16px', alignItems: 'flex-start', background: 'rgba(0, 240, 255, 0.03)' }}>
        <AlertCircle size={24} color={trend.status === 'negative' ? 'var(--color-rose)' : 'var(--color-cyan)'} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <h4 style={{ fontSize: '15px', color: '#fff', marginBottom: '4px', fontWeight: 600 }}>AI Financial Trend Detector</h4>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>{trend.text}</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
        {/* Revenue & Net Income Chart */}
        <div className="glass-card">
          <h3 style={{ fontSize: '16px', marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span>Revenue & Net Income Trend</span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 400 }}>(Quarterly Profile)</span>
          </h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={quarters} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="quarter_label" stroke="var(--color-text-muted)" />
                <YAxis tickFormatter={formatCurrency} stroke="var(--color-text-muted)" />
                <Tooltip 
                  contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-glass)', borderRadius: '8px', color: 'var(--color-text-primary)' }}
                  formatter={(value) => [`${metadata.currency === 'INR' ? '₹' : '$'}${formatCurrency(value)}`]}
                />
                <Legend />
                <Bar dataKey="revenue" name="Revenue" fill="var(--color-cyan)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="net_income" name="Net Income" fill="var(--color-violet)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Growth & Margin Trend */}
        <div className="glass-card">
          <h3 style={{ fontSize: '16px', marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span>Revenue Growth & Margin Trajectory</span>
          </h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={quarters} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="quarter_label" stroke="var(--color-text-muted)" />
                <YAxis stroke="var(--color-text-muted)" unit="%" />
                <Tooltip 
                  contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-glass)', borderRadius: '8px', color: 'var(--color-text-primary)' }}
                />
                <Legend />
                <Line type="monotone" dataKey="revenue_growth" name="Revenue Growth (%)" stroke="var(--color-rose)" strokeWidth={3} dot={{ fill: 'var(--color-rose)', r: 5 }} />
                <Line type="monotone" dataKey="margin" name="Operating Margin (%)" stroke="var(--color-emerald)" strokeWidth={3} dot={{ fill: 'var(--color-emerald)', r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Stock Price History (Full Year) */}
      {stock_history && stock_history.length > 0 && (
        <div className="glass-card">
          <h3 style={{ fontSize: '16px', marginBottom: '20px' }}>Historical Market Valuation (1-Year Stock Price Trend)</h3>
          <div style={{ width: '100%', height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stock_history} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-cyan)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--color-cyan)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="date" stroke="var(--color-text-muted)" tickFormatter={(str) => {
                  const d = new Date(str);
                  return d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
                }} />
                <YAxis stroke="var(--color-text-muted)" tickFormatter={(val) => `${metadata.currency === 'INR' ? '₹' : '$'}${val}`} />
                <Tooltip 
                  contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-glass)', borderRadius: '8px', color: 'var(--color-text-primary)' }}
                  formatter={(value) => [`${metadata.currency === 'INR' ? '₹' : '$'}${value}`, "Price"]}
                />
                <Area type="monotone" dataKey="close" stroke="var(--color-cyan)" strokeWidth={2} fillOpacity={1} fill="url(#colorClose)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverviewTab;
