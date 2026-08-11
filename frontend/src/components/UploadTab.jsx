import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

const UploadTab = ({ onUploadSuccess, apiBaseUrl }) => {
  const [companyName, setCompanyName] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [uploadLog, setUploadLog] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
      setSuccess(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setError('Please provide a company name.');
      return;
    }
    if (!file) {
      setError('Please select a PDF report to upload.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);
    setUploadLog('Reading PDF file...');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('company_name', companyName);

    try {
      setTimeout(() => setUploadLog('Extracting pages and text segments (limit: 30 pages)...'), 1500);
      setTimeout(() => setUploadLog('Feeding text into Gemini for semantic parsing...'), 3000);
      setTimeout(() => setUploadLog('Extracting financial statement tables & calculating margins...'), 5000);
      setTimeout(() => setUploadLog('Structuring transcript CEO/CFO statements & analyst Q&A...'), 7000);

      const response = await fetch(`${apiBaseUrl}/api/company/upload`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(true);
        setCompanyName('');
        setFile(null);
        // Clean file input
        const fileInput = document.getElementById('pdf-file-input');
        if (fileInput) fileInput.value = '';
        
        // Return parsed company data to the parent App
        onUploadSuccess(data.name_key, data.analysis);
      } else {
        const errData = await response.json();
        setError(errData.detail || 'Failed to parse the PDF file.');
      }
    } catch (err) {
      console.error(err);
      setError('Network error. Verify connection to backend.');
    } finally {
      setLoading(false);
      setUploadLog('');
    }
  };

  return (
    <div className="animate-fade-in flex flex-col" style={{ gap: '24px' }}>
      
      {/* Intro info */}
      <div className="glass-card cyan-accent" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <FileText size={18} color="var(--color-cyan)" />
          <span>Upload Custom Earnings Reports / Transcripts PDF</span>
        </h3>
        <p style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
          Have a specific 10-Q, investor deck, or custom PDF transcript? Upload it here. Our parser will read the document, extract the key metrics, compile the bull/bear case, and structure the management remarks for instant auditing.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
        {/* Upload Form */}
        <div className="glass-card">
          <h3 style={{ fontSize: '15px', marginBottom: '20px' }}>PDF Ingestion Configuration</h3>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Company / Entity Name</label>
              <input
                type="text"
                className="glass-input"
                placeholder="e.g. Tesla, Apple, Hexagon Nutrition"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Upload PDF Disclosures</label>
              <div 
                style={{ 
                  border: '2px dashed var(--border-glass)', 
                  borderRadius: '12px', 
                  padding: '30px 20px', 
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: 'rgba(255,255,255,0.01)',
                  position: 'relative'
                }}
                onClick={() => document.getElementById('pdf-file-input').click()}
              >
                <input
                  id="pdf-file-input"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  disabled={loading}
                  style={{ display: 'none' }}
                />
                
                <Upload size={30} color="var(--color-cyan)" style={{ margin: '0 auto 12px' }} />
                
                {file ? (
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{file.name}</p>
                    <p style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Click to browse or drag PDF here</p>
                    <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>Quarterly reports, transcripts, or presentations</p>
                  </div>
                )}
              </div>
            </div>

            <button type="submit" className="glass-btn primary" disabled={loading} style={{ justifyContent: 'center', marginTop: '8px' }}>
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" /> Ingesting PDF...
                </>
              ) : 'Submit PDF for AI Analysis'}
            </button>
          </form>

          {/* Logging status */}
          {loading && uploadLog && (
            <div className="animate-fade-in" style={{ marginTop: '16px', fontSize: '12px', color: 'var(--color-cyan)', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <RefreshCw size={12} className="animate-spin" />
              <span>Status: {uploadLog}</span>
            </div>
          )}

          {error && (
            <div className="animate-fade-in" style={{ marginTop: '16px', display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--color-rose)', fontSize: '13px', border: '1px solid rgba(244,63,94,0.2)', padding: '10px 14px', borderRadius: '8px', background: 'var(--color-rose-glow)' }}>
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="animate-fade-in" style={{ marginTop: '16px', display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--color-emerald)', fontSize: '13px', border: '1px solid rgba(16,185,129,0.2)', padding: '10px 14px', borderRadius: '8px', background: 'var(--color-emerald-glow)' }}>
              <CheckCircle2 size={16} />
              <span>Report ingested successfully! Dashboard updated.</span>
            </div>
          )}
        </div>

        {/* Requirements info card */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '15px' }}>Ingestion Engine Spec</h3>
          <ul style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '12px', listStyle: 'none' }}>
            <li style={{ display: 'flex', gap: '8px' }}>
              <span style={{ color: 'var(--color-cyan)', fontWeight: 600 }}>•</span>
              <span><strong>Max Pages:</strong> Reads up to 30 pages of text. Files containing scanned images will undergo local text extraction.</span>
            </li>
            <li style={{ display: 'flex', gap: '8px' }}>
              <span style={{ color: 'var(--color-cyan)', fontWeight: 600 }}>•</span>
              <span><strong>AI Structuring:</strong> Gemini analyzes key balances, extracts the transcript dialog segments, and computes defensiveness index.</span>
            </li>
            <li style={{ display: 'flex', gap: '8px' }}>
              <span style={{ color: 'var(--color-cyan)', fontWeight: 600 }}>•</span>
              <span><strong>Local Vector Store:</strong> Extracted chunks are immediately indexed in the background RAG database for semantic querying.</span>
            </li>
          </ul>
        </div>
      </div>

    </div>
  );
};

export default UploadTab;
