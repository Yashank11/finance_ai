from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import logging
import json
from pypdf import PdfReader
from io import BytesIO
import os
from dotenv import load_dotenv

load_dotenv()

from services.live_fetcher import LiveFinanceService
from services.analyzer import FinancialAnalyzer
from services.vector_search import VectorSearchRAG
from services.gemini_client import GeminiClient

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AI Earnings Call Analyst Backend")

# Enable CORS for local react frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory caches
company_cache = {}
rag_cache = {}
watchlist = [
    {"company_name": "NVIDIA", "ticker": "NVDA", "last_quarter": "Q1 FY26", "status": "Stable"},
    {"company_name": "Tata Motors", "ticker": "TATAMOTORS.NS", "last_quarter": "Q4 FY25", "status": "Review required"}
]

class CompanyQuery(BaseModel):
    company_name: str

class SimulationQuery(BaseModel):
    revenue: float
    margin: float
    growth_shift: float
    margin_shift: float
    volatility: float = 0.05
    num_paths: int = 500

class ChatQuery(BaseModel):
    company_name: str
    message: str

@app.get("/")
def read_root():
    return {"status": "healthy", "service": "AI Earnings Call Analyst"}

@app.post("/api/company/analyze")
async def analyze_company(query: CompanyQuery):
    name_key = query.company_name.lower().strip()
    
    # Check cache first to avoid rate-limiting and make UI fast
    if name_key in company_cache:
        logger.info(f"Returning cached analysis for: {query.company_name}")
        return company_cache[name_key]
        
    try:
        logger.info(f"Gathering live analysis for: {query.company_name}")
        analysis_data = LiveFinanceService.gather_company_analysis(query.company_name)
        company_cache[name_key] = analysis_data
        
        # Instantiate RAG index in background cache
        rag_cache[name_key] = VectorSearchRAG(analysis_data.get("quarters", []))
        
        return analysis_data
    except Exception as e:
        logger.error(f"Error analyzing company: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze company {query.company_name}: {str(e)}")

@app.post("/api/company/cluster_questions")
async def cluster_questions(query: CompanyQuery):
    name_key = query.company_name.lower().strip()
    if name_key not in company_cache:
        # Try to run analysis first
        await analyze_company(query)
        
    data = company_cache.get(name_key, {})
    quarters = data.get("quarters", [])
    
    try:
        clusters = FinancialAnalyzer.cluster_analyst_questions(quarters)
        return {"clusters": clusters}
    except Exception as e:
        logger.error(f"Error clustering questions: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to cluster analyst questions: {str(e)}")

@app.post("/api/company/simulate")
async def simulate_earnings(query: SimulationQuery):
    try:
        results = FinancialAnalyzer.run_earnings_simulation(
            revenue=query.revenue,
            margin=query.margin,
            growth_shift=query.growth_shift,
            margin_shift=query.margin_shift,
            volatility=query.volatility,
            num_paths=query.num_paths
        )
        return results
    except Exception as e:
        logger.error(f"Error running simulation: {e}")
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")

@app.post("/api/company/chat")
async def chat_with_transcript(query: ChatQuery):
    name_key = query.company_name.lower().strip()
    if name_key not in company_cache:
        raise HTTPException(status_code=400, detail="Company analysis has not been loaded yet. Please select or search the company first.")
        
    # Lazy load or fetch RAG index
    if name_key not in rag_cache:
        data = company_cache[name_key]
        rag_cache[name_key] = VectorSearchRAG(data.get("quarters", []))
        
    rag = rag_cache[name_key]
    
    try:
        response = rag.query(query.message)
        return response
    except Exception as e:
        logger.error(f"Error in RAG chat: {e}")
        raise HTTPException(status_code=500, detail=f"Chat query failed: {str(e)}")

@app.post("/api/company/upload")
async def upload_pdf_report(
    file: UploadFile = File(...),
    company_name: str = Form(...)
):
    try:
        # Read PDF bytes
        contents = await file.read()
        pdf_file = BytesIO(contents)
        reader = PdfReader(pdf_file)
        
        # Extract first 30 pages of text (cap to avoid token limits)
        extracted_text = ""
        for i in range(min(30, len(reader.pages))):
            extracted_text += f"\n--- PAGE {i+1} ---\n" + reader.pages[i].extract_text()
            
        # Call Gemini to parse and structure this text into a standard quarter analysis
        prompt = f"""
        You are an AI financial data ingestion pipeline. We have extracted text from a PDF document uploaded for the company: "{company_name}".
        Your task is to analyze this document and structure it as a standard quarter analysis in the format below.
        Identify the company name, stock ticker, the specific quarter (e.g. Q1, Q2, Q3 or Q4) and year the PDF refers to.
        
        PDF Content Extract:
        {extracted_text[:35000]} # Safe slice within model context limits
        
        Structure the output as a JSON object inside our standard "quarters" array format:
        {{
            "metadata": {{
                "ticker": "UPLOAD",
                "name": "{company_name}",
                "currency": "USD",
                "country": "US",
                "sector": "Sector extracted from PDF",
                "industry": "Industry extracted from PDF",
                "summary": "Short business summary"
            }},
            "quarters": [
                {{
                    "quarter_label": "e.g. Q1",
                    "date": "2025-05-28", // estimated date
                    "revenue": 100000000, // Revenue if found, or estimate
                    "revenue_growth": 12.5, // YoY or QoQ %
                    "margin": 18.0, // Operating Margin %
                    "net_income": 12000000,
                    "confidence_score": 75, // score 0-100 based on tone
                    "confidence_explanation": "Explanation based on the text.",
                    "management_personality": {{
                        "optimistic": 60,
                        "defensive": 20,
                        "aggressive": 10,
                        "evasive": 10,
                        "analytical": 70
                    }},
                    "ceo_remarks": "Summary of CEO comments found in the PDF.",
                    "cfo_remarks": "Summary of CFO comments/financial highlights in the PDF.",
                    "investor_presentation": [
                        {{ "slide_title": "Slide Title", "slide_content": ["Bullet point 1", "Bullet point 2"] }}
                    ],
                    "quarterly_report_highlights": "Markdown summary of key highlights.",
                    "bull_points": ["Bull point 1", "Bull point 2"],
                    "bear_points": ["Bear point 1", "Bear point 2"],
                    "risks": [
                        {{
                            "category": "Regulatory / Supply Chain / Debt / Customer Concentration",
                            "risk_name": "Description of risk",
                            "severity": "Medium",
                            "discussion_frequency": 3,
                            "quote": "Quote from text referring to risk"
                        }}
                    ],
                    "analyst_qa": [
                        {{
                            "analyst_name": "General Analyst",
                            "firm": "Research Firm",
                            "question": "Simulated or extracted analyst concern from the text.",
                            "answer": "Management's position.",
                            "defensiveness_rating": 2,
                            "concern_category": "Margins"
                        }}
                    ]
                }}
            ]
        }}
        
        Ensure you only return valid JSON. Do not include markdown codeblocks or other wrapper texts.
        """
        
        logger.info(f"Calling Gemini to parse PDF upload for {company_name}...")
        parsed_data = GeminiClient.generate_json(prompt, "You are a financial PDF processing parser.")
        
        # Save in cache under unique key
        name_key = f"upload_{company_name.lower().strip()}"
        parsed_data["stock_history"] = [] # no historical chart for upload
        
        company_cache[name_key] = parsed_data
        rag_cache[name_key] = VectorSearchRAG(parsed_data.get("quarters", []))
        
        return {
            "status": "success",
            "name_key": name_key,
            "company_name": company_name,
            "analysis": parsed_data
        }
    except Exception as e:
        logger.error(f"Error parsing uploaded PDF: {e}")
        raise HTTPException(status_code=500, detail=f"PDF ingestion failed: {str(e)}")

# Watchlist endpoints
@app.get("/api/watchlist")
def get_watchlist():
    return watchlist

@app.post("/api/watchlist")
def add_to_watchlist(company: CompanyQuery):
    # Resolve ticker to verify and save
    try:
        res = LiveFinanceService.resolve_ticker(company.company_name)
        new_entry = {
            "company_name": res["resolved_name"],
            "ticker": res["ticker"],
            "last_quarter": "Q1 FY26",
            "status": "Stable"
        }
        # Check if already in watchlist
        if not any(w["ticker"] == res["ticker"] for w in watchlist):
            watchlist.append(new_entry)
        return watchlist
    except Exception as e:
        # Fallback simple append
        new_entry = {
            "company_name": company.company_name,
            "ticker": company.company_name.upper()[:4],
            "last_quarter": "Q1",
            "status": "Stable"
        }
        watchlist.append(new_entry)
        return watchlist

@app.delete("/api/watchlist/{ticker}")
def delete_from_watchlist(ticker: str):
    global watchlist
    watchlist = [w for w in watchlist if w["ticker"].lower() != ticker.lower()]
    return watchlist

@app.post("/api/watchlist/monitor")
async def monitor_watchlist():
    """
    Simulates background monitoring check. Fires notifications when new earnings arrive.
    """
    alerts = []
    
    # We will simulate a new quarter release check for Tata Motors or NVIDIA
    # and provide a detailed alert report
    for w in watchlist:
        company_name = w["company_name"]
        ticker = w["ticker"]
        
        prompt = f"""
        Simulate a background earnings release monitor event for:
        Company: {company_name} ({ticker})
        
        Assume a brand new quarter's earnings report was just published.
        Provide a JSON object detailing:
        - "alert_triggered": true/false (randomly make it true for at least one company to trigger the monitoring demo)
        - "title": "e.g. Tata Motors Earnings Released"
        - "time": "2026-06-15 16:30"
        - "key_changes": [
            "Confidence score down 8%",
            "Revenue beat estimates by 4%",
            "Margin concerns increased due to commodity price pressure",
            "Full year guidance reduced by 2%"
        ]
        - "alert_level": "High/Medium/Low"
        
        Return ONLY valid JSON.
        """
        try:
            alert = GeminiClient.generate_json(prompt, "You are an automated financial crawler and alerts engine.")
            if alert.get("alert_triggered"):
                alerts.append(alert)
        except Exception as e:
            logger.error(f"Error running watchlist monitor alert simulation: {e}")
            
    # Fallback to guarantee an alert is triggered in the demo
    if not alerts:
        alerts.append({
            "alert_triggered": True,
            "title": "Tata Motors Q4 Earnings Released",
            "time": "2026-06-15 16:30",
            "key_changes": [
                "Confidence score down 8% (from 78 to 70)",
                "Revenue beat estimates by 3.2%",
                "Margin concerns increased due to higher raw material costs",
                "FY26 guidance marginally reduced"
            ],
            "alert_level": "Medium"
        })
        
    return {"alerts": alerts}
