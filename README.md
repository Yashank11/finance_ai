# AI Earnings Call Analyst

A premium, high-fidelity corporate intelligence dashboard designed to parse, analyze, and audit quarterly earnings call communications, financial statements, and investor presentations.

## Overview

The **AI Earnings Call Analyst** combines traditional Data Science/NLP algorithms with Generative AI (using Google Gemini with automated failovers to Groq, OpenRouter, and Mistral AI) to deliver comprehensive financial intelligence and investment insights.

## Features

### Core Analytics Modules

1. **Management Confidence Analysis** - Track shifts in CEO/CFO confidence quarter-over-quarter with linguistic sentiment analysis
2. **Trend Tracking Across Quarters** - Interactive charts showing revenue, profitability, margins, and stock price trends
3. **Bull vs Bear Arguments** - Balanced investment thesis with competing arguments and investment scoring
4. **Hidden Risks Detector** - Identify and categorize risks (Supply Chain, Regulatory, Legal, Debt, Customer Concentration)
5. **Competitor Comparison** - Side-by-side comparative intelligence matrix against sector peers
6. **Analyst Question Analysis** - K-Means clustering of Q&A segments with AI semantic topic naming and defensiveness scoring
7. **Earnings Call Personality** - Track communication style dimensions (Optimistic, Defensive, Aggressive, Evasive, Analytical)
8. **Watchlist & Autonomous Monitoring** - Manage watchlists and receive alerts for new filings and key changes

### Smart Tools

- **Interactive Monte Carlo Scenario Planner** - Stress-test financial expectations and analyze probability distributions
- **RAG-Powered Chat** - Ask questions about earnings data with vector search retrieval

## Technology Stack

### Backend
- **Framework**: FastAPI
- **Server**: Uvicorn
- **Data Processing**: NumPy, scikit-learn
- **Financial Data**: yfinance
- **Web Scraping**: BeautifulSoup4
- **Document Processing**: PyPDF
- **LLM Integration**: Google Gemini, Groq, OpenRouter, Mistral AI

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Visualization**: Recharts
- **Icons**: Lucide React
- **Styling**: CSS

## Prerequisites

- Python 3.8+
- Node.js 16+ and npm
- Google Gemini API key (primary LLM)
- Optional: Groq, OpenRouter, Mistral AI API keys (for failover)

## Installation

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Configure API keys:
   - Set `GEMINI_API_KEY` environment variable for Google Gemini
   - Optional: Set backup LLM API keys for failover support

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key (optional)
OPENROUTER_API_KEY=your_openrouter_api_key (optional)
MISTRAL_API_KEY=your_mistral_api_key (optional)
```

### Backend Configuration

The FastAPI backend runs on `http://localhost:8000` by default with CORS enabled for frontend development.

## Usage

### Starting the Backend

```bash
cd backend
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`

### Starting the Frontend

```bash
cd frontend
npm run dev
```

The application will be available at `http://localhost:5173`

## Project Structure

```
finance_ai/
├── README.md                          # This file
├── system_features.md                 # Detailed system documentation
├── backend/
│   ├── main.py                        # FastAPI application entry point
│   ├── requirements.txt                # Python dependencies
│   └── services/
│       ├── analyzer.py                # Financial analysis engine
│       ├── gemini_client.py            # LLM client with failover logic
│       ├── live_fetcher.py             # Real-time financial data fetcher
│       └── vector_search.py            # RAG and vector search implementation
└── frontend/
    ├── package.json                    # Node.js dependencies
    ├── vite.config.js                  # Vite configuration
    ├── eslint.config.js                # ESLint configuration
    ├── index.html                      # HTML entry point
    ├── README.md                       # Frontend documentation
    ├── src/
    │   ├── main.jsx                    # React application entry
    │   ├── App.jsx                     # Main application component
    │   ├── App.css                     # Global styles
    │   ├── index.css                   # Base styles
    │   ├── assets/                     # Static assets
    │   └── components/
    │       ├── OverviewTab.jsx         # Dashboard overview
    │       ├── ConfidenceTab.jsx       # Management confidence analysis
    │       ├── BullBearTab.jsx         # Bull vs bear arguments
    │       ├── RisksTab.jsx            # Risk detection module
    │       ├── CompetitorTab.jsx       # Competitor comparison
    │       ├── AnalystQuestionsTab.jsx # Analyst Q&A analysis
    │       ├── ScenarioTab.jsx         # Monte Carlo scenario planner
    │       ├── RAGChatTab.jsx          # AI chat with RAG
    │       └── UploadTab.jsx           # Document upload module
    └── public/                         # Public assets
```

## API Endpoints

### Companies
- `GET /api/companies/{ticker}` - Fetch company financials and analysis
- `POST /api/companies` - Query company data

### Analysis
- `POST /api/analyze` - Run full analysis on a company
- `POST /api/monte_carlo` - Run Monte Carlo simulation
- `POST /api/chat` - RAG-powered chat queries

### Watchlist
- `GET /api/watchlist` - Get active watchlist
- `POST /api/watchlist` - Add company to watchlist
- `DELETE /api/watchlist/{ticker}` - Remove from watchlist
- `POST /api/watchlist/check` - Check for new alerts

### Documents
- `POST /api/upload` - Upload and process earnings call transcripts/PDFs

## Development

### Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

### Linting

```bash
# Frontend
cd frontend
npm run lint
```

### Building for Production

```bash
# Frontend
cd frontend
npm run build

# Backend uses uvicorn with gunicorn in production
```

## Architecture Overview

```
┌─────────────────┐
│  React Frontend │
│   (Vite + UI)   │
└────────┬────────┘
         │ API Requests
         ▼
┌─────────────────────┐
│  FastAPI Backend    │
│  (Core Engine)      │
└──────┬──────────────┘
       │
       ├─► yfinance (Stock Data)
       ├─► DuckDuckGo (News & Quotes)
       ├─► Gemini LLM (Primary AI)
       ├─► Groq/OpenRouter/Mistral (Failover)
       └─► Vector DB (RAG Search)
```

## Key Dependencies

### Backend
- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `numpy` - Numerical computing
- `scikit-learn` - Machine learning (K-Means clustering)
- `yfinance` - Financial data API
- `beautifulsoup4` - Web scraping
- `pypdf` - PDF processing
- `requests` - HTTP client

### Frontend
- `react` - UI framework
- `vite` - Build tool
- `recharts` - Charts and visualization
- `lucide-react` - Icon library

## Troubleshooting

### API Connection Issues
- Ensure backend is running on `http://localhost:8000`
- Check CORS settings in `main.py`
- Verify API keys are correctly set

### LLM Errors
- Check primary Gemini API key validity
- Ensure backup LLM keys are configured for failover
- Monitor API rate limits

### Data Fetching Issues
- Verify internet connection
- Check yfinance API availability
- Confirm stock ticker symbols are valid

## Future Enhancements

- Real-time earnings call transcription
- Advanced portfolio optimization
- Predictive earnings modeling
- Integration with TradingView
- Mobile application support

## License

Proprietary - All rights reserved

## Support

For issues, feature requests, or documentation clarifications, refer to `system_features.md` for detailed module documentation.
