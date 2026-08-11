import requests
from bs4 import BeautifulSoup
import urllib.parse
import yfinance as yf
import json
import logging
from datetime import datetime
from services.gemini_client import GeminiClient

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LiveFinanceService:
    @staticmethod
    def search_ddg(query: str, limit: int = 8) -> list:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
        }
        url = f"https://html.duckduckgo.com/html/?q={urllib.parse.quote(query)}"
        try:
            response = requests.get(url, headers=headers, timeout=15)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                results = []
                for a in soup.find_all('div', class_='result__body'):
                    title_a = a.find('a', class_='result__a')
                    snippet = a.find('a', class_='result__snippet')
                    if title_a and snippet:
                        results.append({
                            "title": title_a.text.strip(),
                            "link": title_a['href'],
                            "snippet": snippet.text.strip()
                        })
                return results[:limit]
            return []
        except Exception as e:
            logger.error(f"DuckDuckGo search error: {e}")
            return []

    @staticmethod
    def resolve_ticker(company_name: str) -> dict:
        prompt = f"""
        Resolve the official stock ticker and details for the company name: "{company_name}".
        Provide the response in raw JSON format with the following keys:
        - "ticker": The standard stock ticker (e.g., "NVDA", "TATAMOTORS.NS", "MARUTI.NS", "AAPL", "HEXAGONNUTR.BO"). For Indian companies, prioritize NSE (.NS suffix) or BSE (.BO suffix).
        - "resolved_name": Official corporate name (e.g., "NVIDIA Corporation").
        - "currency": The trading currency (e.g., "USD", "INR").
        - "country": Country of origin (e.g., "USA", "India").
        - "competitors": A list of 3 competitor tickers (e.g., ["AMD", "INTC", "QCOM"] or ["M&M.NS", "MARUTI.NS", "ASHOKLEY.NS"]).
        
        Ensure you only return valid JSON, no markdown formatting.
        """
        try:
            res = GeminiClient.generate_json(prompt, "You are a financial stock resolver.")
            logger.info(f"Resolved ticker for {company_name}: {res}")
            return res
        except Exception as e:
            logger.error(f"Error resolving ticker: {e}")
            # Fallback values
            return {
                "ticker": company_name.upper(),
                "resolved_name": company_name,
                "currency": "USD",
                "country": "US",
                "competitors": []
            }

    @staticmethod
    def fetch_yf_financials(ticker: str) -> dict:
        t = yf.Ticker(ticker)
        
        # 1. Fetch info metadata with fallback
        info = {}
        try:
            info = t.info
            if not info or not isinstance(info, dict):
                info = {}
        except Exception as e:
            logger.warning(f"Failed to fetch yfinance info for {ticker}: {e}")
            
        # 2. Fetch quarterly financials with fallback
        q_financials = None
        try:
            q_financials = t.quarterly_financials
        except Exception as e:
            logger.warning(f"Failed to fetch quarterly financials for {ticker}: {e}")
            
        financials_data = []
        if q_financials is not None and not q_financials.empty:
            try:
                # Get the last 4 quarters (columns)
                cols = q_financials.columns.tolist()[:4]
                # Reverse order to go from oldest to newest
                cols.reverse()
                
                for idx, col in enumerate(cols):
                    date_str = str(col.date())
                    
                    # Safe get helper
                    def get_val(df, row_name):
                        if df is not None and row_name in df.index:
                            val = df.loc[row_name, col]
                            if hasattr(val, 'item'):
                                val = val.item()
                            return val if (val is not None and not (isinstance(val, float) and val != val)) else 0
                        return 0

                    revenue = get_val(q_financials, "Total Revenue") or get_val(q_financials, "Revenue")
                    net_income = get_val(q_financials, "Net Income")
                    operating_income = get_val(q_financials, "Operating Income")
                    gross_profit = get_val(q_financials, "Gross Profit")
                    
                    # Margin calculations
                    op_margin = (operating_income / revenue * 100) if revenue else 0
                    gross_margin = (gross_profit / revenue * 100) if revenue else 0
                    net_margin = (net_income / revenue * 100) if revenue else 0
                    
                    financials_data.append({
                        "quarter": f"Q{idx+1}",
                        "date": date_str,
                        "revenue": revenue,
                        "net_income": net_income,
                        "operating_income": operating_income,
                        "gross_profit": gross_profit,
                        "operating_margin": round(op_margin, 2),
                        "gross_margin": round(gross_margin, 2),
                        "net_margin": round(net_margin, 2),
                    })
                    
                # Calculate revenue growth YoY or QoQ
                for idx in range(len(financials_data)):
                    if idx == 0:
                        financials_data[idx]["revenue_growth"] = 15.0
                    else:
                        prev_rev = financials_data[idx-1]["revenue"]
                        curr_rev = financials_data[idx]["revenue"]
                        growth = ((curr_rev - prev_rev) / prev_rev * 100) if prev_rev else 0
                        financials_data[idx]["revenue_growth"] = round(growth, 2)
            except Exception as e:
                logger.warning(f"Error parsing financials columns for {ticker}: {e}")

        # 3. Fetch stock price history with fallback
        chart_data = []
        try:
            hist = t.history(period="1y")
            if hist is not None and not hist.empty:
                # Downsample to monthly average
                hist_downsampled = hist.resample('ME').mean()
                for date, row in hist_downsampled.iterrows():
                    chart_data.append({
                        "date": str(date.date()),
                        "close": round(float(row["Close"]), 2),
                        "volume": int(row["Volume"])
                    })
        except Exception as e:
            logger.warning(f"Failed to fetch stock history for {ticker}: {e}")
            
        return {
            "metadata": {
                "ticker": ticker,
                "name": info.get("longName") or info.get("shortName") or ticker,
                "sector": info.get("sector") or "N/A",
                "industry": info.get("industry") or "N/A",
                "summary": info.get("longBusinessSummary") or "N/A",
                "employees": info.get("fullTimeEmployees") or 0,
                "pe_ratio": info.get("trailingPE") or None,
                "market_cap": info.get("marketCap") or None
            },
            "financials": financials_data,
            "stock_history": chart_data
        }

    @staticmethod
    def gather_company_analysis(company_name: str) -> dict:
        # 1. Resolve ticker
        resolution = LiveFinanceService.resolve_ticker(company_name)
        ticker = resolution["ticker"]
        resolved_name = resolution["resolved_name"]
        currency = resolution["currency"]
        country = resolution["country"]
        competitors = resolution["competitors"]
        
        # 2. Fetch yfinance stats
        yf_data = LiveFinanceService.fetch_yf_financials(ticker)
        
        # 3. Search DDG for news & earnings details
        ddg_query = f"{resolved_name} {ticker} earnings call transcript Q1 Q2 Q3 Q4 news CEO CFO statements"
        logger.info(f"Searching web for: {ddg_query}")
        search_results = LiveFinanceService.search_ddg(ddg_query, limit=10)
        search_text = "\n".join([f"Source: {r['title']}\nContent: {r['snippet']}" for r in search_results])
        
        # Assemble financials overview to pass to Gemini
        financials_str = ""
        if yf_data and yf_data.get("financials"):
            financials_str = json.dumps(yf_data["financials"], indent=2)
        else:
            financials_str = "No structured financials found. Please use web search results to estimate realistic quarterly numbers."
            
        # 4. Generate the complete earnings quarters analysis via Gemini
        prompt = f"""
        Analyze financial communications and generate an earnings dashboard data package for:
        Company: {resolved_name} ({ticker})
        Country: {country}
        Currency: {currency}
        
        Real-world Financials (from Yahoo Finance):
        {financials_str}
        
        Real-world News/Context (from Web Search):
        {search_text}
        
        You must generate a structured JSON object detailing the last 4 quarters (Q1, Q2, Q3, Q4) of earnings calls, investor presentations, and transcripts.
        To support the deep NLP analyses requested, you must synthesize highly realistic text content matching the real-world performance, management statements, and events of the last year.
        
        Provide the response in raw JSON format with the following structure:
        {{
            "metadata": {{
                "ticker": "{ticker}",
                "name": "{resolved_name}",
                "currency": "{currency}",
                "country": "{country}",
                "sector": "{yf_data['metadata']['sector'] if yf_data else 'N/A'}",
                "industry": "{yf_data['metadata']['industry'] if yf_data else 'N/A'}",
                "summary": "{yf_data['metadata']['summary'][:300] if yf_data else 'N/A'}",
                "competitor_tickers": {json.dumps(competitors)}
            }},
            "quarters": [
                {{
                    "quarter_label": "Q1",
                    "date": "YYYY-MM-DD",
                    "revenue": 123456789,
                    "revenue_growth": 12.3, // YoY or QoQ %
                    "margin": 15.4, // Operating Margin %
                    "net_income": 1234567,
                    "confidence_score": 82, // Confidence Score (0-100) based on management's language
                    "confidence_explanation": "Detailed explanation of why the confidence score is at this level, quoting CEO remarks.",
                    "management_personality": {{
                        "optimistic": 75,
                        "defensive": 15,
                        "aggressive": 10,
                        "evasive": 0,
                        "analytical": 80
                    }},
                    "ceo_remarks": "CEO's opening remarks summary. Must contain direct-sounding quotes reflecting the tone of the call.",
                    "cfo_remarks": "CFO's financial remarks summary.",
                    "investor_presentation": [
                        {{ "slide_title": "Q1 Performance Summary", "slide_content": ["Key point 1", "Key point 2"] }}
                    ],
                    "quarterly_report_highlights": "Markdown summary of key balance sheet and segment performance.",
                    "bull_points": ["Strong growth drivers", "Product expansion success"],
                    "bear_points": ["Competitive headwind in X", "Raw material margin pressure"],
                    "risks": [
                        {{
                            "category": "Supply Chain / Regulatory / Legal / Debt / Customer Concentration",
                            "risk_name": "Description of risk",
                            "severity": "High/Medium/Low",
                            "discussion_frequency": 5, // how many times mentioned in call
                            "quote": "Direct quote from management discussing this risk"
                        }}
                    ],
                    "analyst_qa": [
                        {{
                            "analyst_name": "Toni Sacconaghi",
                            "firm": "Bernstein",
                            "question": "The question asked by the analyst about margins or growth slowdown.",
                            "answer": "Management's response.",
                            "defensiveness_rating": 2, // 1-5 scale
                            "concern_category": "Margin Pressure / Demand Slowdown / Competitive Headwinds / Guidance Reduction"
                        }}
                    ]
                }},
                // Repeat for Q2, Q3, Q4 (ordered chronologically from Q1 to Q4). 
                // Ensure there is a clear trend over the quarters (e.g. tracking how their confidence or growth changes!).
            ]
        }}
        
        Ensure you only return valid JSON, no markdown formatting. Do not exceed the model token limits but make the texts detailed and realistic.
        """
        try:
            logger.info("Calling Gemini to synthesize quarterly analyses...")
            analysis = GeminiClient.generate_json(prompt, "You are a senior investment research analyst and financial data scientist.")
            
            # Merge chart data from yfinance if available
            if yf_data:
                analysis["stock_history"] = yf_data.get("stock_history", [])
            else:
                analysis["stock_history"] = []
                
            return analysis
        except Exception as e:
            logger.error(f"Error gathering company analysis: {e}")
            raise e
