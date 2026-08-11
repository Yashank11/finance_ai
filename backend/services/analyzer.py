import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans
from services.gemini_client import GeminiClient
import logging
import re

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FinancialAnalyzer:
    @staticmethod
    def cluster_analyst_questions(quarters_data: list, num_clusters: int = 3) -> list:
        """
        Extracts all analyst questions across all quarters, clusters them using TF-IDF + KMeans,
        and uses Gemini to name the clusters.
        """
        # Collect all questions
        all_questions = []
        for q in quarters_data:
            q_label = q.get("quarter_label", "Unknown")
            for qa in q.get("analyst_qa", []):
                question_text = qa.get("question", "").strip()
                if question_text:
                    all_questions.append({
                        "quarter": q_label,
                        "analyst": qa.get("analyst_name", "Unknown Analyst"),
                        "firm": qa.get("firm", "Unknown Firm"),
                        "question": question_text,
                        "answer": qa.get("answer", ""),
                        "defensiveness": qa.get("defensiveness_rating", 1),
                        "original_category": qa.get("concern_category", "General")
                    })
        
        if not all_questions:
            return []
            
        # If we have fewer questions than clusters, reduce clusters
        actual_clusters = min(num_clusters, len(all_questions))
        if actual_clusters < 1:
            actual_clusters = 1

        # Extract texts
        texts = [q["question"] for q in all_questions]
        
        try:
            # TF-IDF Vectorizer
            vectorizer = TfidfVectorizer(stop_words='english')
            X = vectorizer.fit_transform(texts)
            
            # KMeans clustering
            kmeans = KMeans(n_clusters=actual_clusters, random_state=42, n_init=10)
            kmeans.fit(X)
            
            labels = kmeans.labels_
            
            # Group questions by cluster
            clusters = [[] for _ in range(actual_clusters)]
            for idx, label in enumerate(labels):
                clusters[label].append(all_questions[idx])
                
            result_clusters = []
            
            # Label clusters using Gemini
            for i, cluster_questions in enumerate(clusters):
                if not cluster_questions:
                    continue
                
                # Sample questions for context
                sample_texts = "\n- ".join([q["question"][:150] for q in cluster_questions[:5]])
                
                prompt = f"""
                Here is a cluster of analyst questions asked during earnings calls:
                - {sample_texts}
                
                Identify the core concern connecting these questions.
                Provide a short 2-3 word title (e.g., "Margin Pressure", "Demand Slowdown", "AI Chip Scaling", "Guidance Reductions").
                Return ONLY the 2-3 word title. Do not add markdown or punctuation.
                """
                try:
                    cluster_title = GeminiClient.generate_content(prompt, "You are a financial analyst summarizing investor topics.").strip()
                    # Clean up quotes if model added them
                    cluster_title = re.sub(r'[\'"]', '', cluster_title)
                except Exception as e:
                    logger.error(f"Error labeling cluster {i}: {e}")
                    cluster_title = f"Topic {i+1} ({cluster_questions[0]['original_category']})"
                
                # Calculate average defensiveness in the cluster
                avg_defensiveness = float(np.mean([q["defensiveness"] for q in cluster_questions]))
                
                result_clusters.append({
                    "id": i,
                    "title": cluster_title,
                    "questions": cluster_questions,
                    "count": len(cluster_questions),
                    "avg_defensiveness": round(avg_defensiveness, 2)
                })
                
            return result_clusters
        except Exception as e:
            logger.error(f"Error in question clustering: {e}")
            # Fallback grouping by original category
            fallback_groups = {}
            for q in all_questions:
                cat = q["original_category"]
                if cat not in fallback_groups:
                    fallback_groups[cat] = []
                fallback_groups[cat].append(q)
                
            result_clusters = []
            for idx, (cat, qs) in enumerate(fallback_groups.items()):
                avg_defensiveness = float(np.mean([q["defensiveness"] for q in qs]))
                result_clusters.append({
                    "id": idx,
                    "title": cat,
                    "questions": qs,
                    "count": len(qs),
                    "avg_defensiveness": round(avg_defensiveness, 2)
                })
            return result_clusters

    @staticmethod
    def run_earnings_simulation(revenue: float, margin: float, growth_shift: float, margin_shift: float, volatility: float = 0.05, num_paths: int = 500) -> dict:
        """
        Performs a Monte Carlo simulation of next quarter's revenue and operating income,
        and uses Gemini to draft a simulated response from the CEO regarding this scenario.
        """
        # Base growth rates and margins
        base_growth = (growth_shift / 100.0)
        base_margin = (margin + margin_shift) / 100.0
        
        # Simulate paths using numpy
        np.random.seed(42)
        # Revenue next quarter = Revenue * (1 + base_growth + normal_noise * volatility)
        rev_multiplier = 1.0 + base_growth + np.random.normal(0, volatility, num_paths)
        sim_revenues = revenue * rev_multiplier
        
        # Margin next quarter = base_margin + normal_noise * (volatility * 0.5)
        sim_margins = base_margin + np.random.normal(0, volatility * 0.5, num_paths)
        # Keep margin within 0 and 1
        sim_margins = np.clip(sim_margins, 0.0, 1.0)
        
        sim_op_incomes = sim_revenues * sim_margins
        
        # Calculate summary statistics
        p10_rev = float(np.percentile(sim_revenues, 10))
        p50_rev = float(np.percentile(sim_revenues, 50))
        p90_rev = float(np.percentile(sim_revenues, 90))
        
        p10_margin = float(np.percentile(sim_margins, 10)) * 100
        p50_margin = float(np.percentile(sim_margins, 50)) * 100
        p90_margin = float(np.percentile(sim_margins, 90)) * 100
        
        p10_op = float(np.percentile(sim_op_incomes, 10))
        p50_op = float(np.percentile(sim_op_incomes, 50))
        p90_op = float(np.percentile(sim_op_incomes, 90))
        
        # Generate simulated CEO commentary based on the p50 (median) result
        prompt = f"""
        Given the following earnings forecast scenario for a company:
        - Current Revenue: {revenue}
        - Projected Revenue (Median): {p50_rev} (growth shift of {growth_shift}%)
        - Current Operating Margin: {margin}%
        - Projected Operating Margin (Median): {p50_margin}% (margin shift of {margin_shift}%)
        - Projected Operating Income: {p50_op}
        
        Draft a simulated response from the CEO when asked by an analyst during the Q&A:
        "Can you walk us through the drivers behind this performance next quarter, particularly the margin profile and top-line trajectory?"
        
        Provide the response as a JSON object with:
        "ceo_commentary": "CEO statement here (~150 words, professional, detailed, defensive or optimistic depending on metrics)"
        "tone_analysis": "Brief analysis of the CEO's tone in this scenario (e.g. 'Cautiously Optimistic due to top line expansion, but defensive on rising capital expenditures')."
        
        Return ONLY valid JSON. No markdown tags.
        """
        try:
            commentary = GeminiClient.generate_json(prompt, "You are a CEO responding to analyst questions on an earnings call.")
        except Exception as e:
            logger.error(f"Error generating CEO scenario commentary: {e}")
            commentary = {
                "ceo_commentary": f"We are driving towards a revenue target of {p50_rev:.2f} next quarter, reflecting our strategic investments. While margins are subject to short-term pressures, reaching {p50_margin:.2f}%, we believe our long-term structural efficiency is fully intact.",
                "tone_analysis": "Pragmatic and execution-focused."
            }
            
        # Prepare charts points for distributions (histogram data)
        counts_rev, bins_rev = np.histogram(sim_revenues, bins=15)
        counts_margin, bins_margin = np.histogram(sim_margins * 100, bins=15)
        
        rev_dist = [{"bin": round(float(bins_rev[i]), 2), "count": int(counts_rev[i])} for i in range(len(counts_rev))]
        margin_dist = [{"bin": round(float(bins_margin[i]), 2), "count": int(counts_margin[i])} for i in range(len(counts_margin))]
        
        return {
            "summary": {
                "revenue": {
                    "p10": round(p10_rev, 2),
                    "p50": round(p50_rev, 2),
                    "p90": round(p90_rev, 2)
                },
                "margin": {
                    "p10": round(p10_margin, 2),
                    "p50": round(p50_margin, 2),
                    "p90": round(p90_margin, 2)
                },
                "operating_income": {
                    "p10": round(p10_op, 2),
                    "p50": round(p50_op, 2),
                    "p90": round(p90_op, 2)
                }
            },
            "distributions": {
                "revenue": rev_dist,
                "margin": margin_dist
            },
            "ceo_commentary": commentary.get("ceo_commentary"),
            "tone_analysis": commentary.get("tone_analysis")
        }

    @staticmethod
    def get_linguistic_timeline(ceo_remarks: str, cfo_remarks: str, analyst_qa: list) -> list:
        """
        Segments the call remarks and Q&A, scoring each segment to show an interactive timeline.
        """
        timeline = []
        timeline.append({
            "segment": "CEO Opening Remarks",
            "speaker": "CEO",
            "text": ceo_remarks[:400] + "...",
            "sentiment": 0.8,
            "type": "remarks"
        })
        timeline.append({
            "segment": "CFO Financial Review",
            "speaker": "CFO",
            "text": cfo_remarks[:400] + "...",
            "sentiment": 0.6,
            "type": "remarks"
        })
        
        for idx, qa in enumerate(analyst_qa[:6]): # Limit to 6 QA points for the timeline visual
            analyst = qa.get("analyst_name", "Analyst")
            firm = qa.get("firm", "")
            timeline.append({
                "segment": f"Q&A - {analyst} ({firm})",
                "speaker": analyst,
                "text": qa.get("question", "")[:200] + "...",
                "sentiment": -0.2 if qa.get("defensiveness_rating", 1) > 3 else 0.1,
                "type": "question"
            })
            timeline.append({
                "segment": f"Q&A Answer - Management",
                "speaker": "CEO/CFO",
                "text": qa.get("answer", "")[:200] + "...",
                "sentiment": 0.5 - (qa.get("defensiveness_rating", 1) * 0.15), # higher defensiveness -> lower sentiment
                "type": "answer"
            })
            
        return timeline
