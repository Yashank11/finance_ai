import requests
import json
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from services.gemini_client import GeminiClient, GEMINI_API_KEY
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class VectorSearchRAG:
    def __init__(self, transcripts_data: list):
        """
        Initializes the index by chunking transcript data and generating vector embeddings.
        transcripts_data is a list of quarters, each containing ceo_remarks, cfo_remarks, Q&As, etc.
        """
        self.chunks = []
        self.embeddings = []
        self.tfidf_vectorizer = None
        self.tfidf_matrix = None
        
        # Prepare text chunks
        self._prepare_chunks(transcripts_data)
        
        # Build index
        if self.chunks:
            self._build_index()

    def _prepare_chunks(self, quarters_data: list):
        for q in quarters_data:
            q_label = q.get("quarter_label", "Unknown Quarter")
            
            # 1. Chunk CEO Remarks
            ceo = q.get("ceo_remarks", "")
            if ceo:
                self._add_to_chunks(ceo, q_label, "CEO Remarks")
                
            # 2. Chunk CFO Remarks
            cfo = q.get("cfo_remarks", "")
            if cfo:
                self._add_to_chunks(cfo, q_label, "CFO Remarks")
                
            # 3. Chunk Q&As
            for qa in q.get("analyst_qa", []):
                qa_text = f"Analyst: {qa.get('analyst_name')} ({qa.get('firm')})\nQuestion: {qa.get('question')}\nAnswer: {qa.get('answer')}"
                self.chunks.append({
                    "text": qa_text,
                    "metadata": {
                        "quarter": q_label,
                        "section": f"Q&A - {qa.get('analyst_name')}"
                    }
                })
                
            # 4. Chunk highlights
            highlights = q.get("quarterly_report_highlights", "")
            if highlights:
                self._add_to_chunks(highlights, q_label, "Quarterly Report Highlights")

    def _add_to_chunks(self, text: str, quarter: str, section: str, chunk_size: int = 800):
        # Clean markdown if any
        text_clean = text.replace("#", "").replace("*", "")
        # Simple splitting by paragraph
        paragraphs = text_clean.split("\n\n")
        current_chunk = ""
        
        for p in paragraphs:
            p = p.strip()
            if not p:
                continue
            if len(current_chunk) + len(p) < chunk_size:
                current_chunk += p + "\n\n"
            else:
                if current_chunk:
                    self.chunks.append({
                        "text": current_chunk.strip(),
                        "metadata": {
                            "quarter": quarter,
                            "section": section
                        }
                    })
                current_chunk = p + "\n\n"
                
        if current_chunk:
            self.chunks.append({
                "text": current_chunk.strip(),
                "metadata": {
                    "quarter": quarter,
                    "section": section
                }
            })

    def _get_gemini_embedding(self, text: str) -> list:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key={GEMINI_API_KEY}"
        payload = {
            "model": "models/gemini-embedding-001",
            "content": {
                "parts": [{"text": text}]
            }
        }
        try:
            response = requests.post(url, headers={"Content-Type": "application/json"}, data=json.dumps(payload), timeout=10)
            if response.status_code == 200:
                return response.json().get("embedding", {}).get("values", [])
            else:
                logger.warning(f"Gemini embedding failed with status {response.status_code}: {response.text}")
                return []
        except Exception as e:
            logger.warning(f"Error calling Gemini embedding: {e}")
            return []

    def _build_index(self):
        logger.info(f"Building vector search index for {len(self.chunks)} chunks...")
        
        # Attempt to use Gemini Embeddings
        embeddings_list = []
        use_fallback = False
        
        for i, chunk in enumerate(self.chunks):
            # Limit embeddings requests to avoid rate limits
            if i >= 40: # Only embed top 40 chunks using Gemini, fallback if too large
                use_fallback = True
                break
                
            emb = self._get_gemini_embedding(chunk["text"])
            if emb:
                embeddings_list.append(emb)
            else:
                use_fallback = True
                break
                
        if not use_fallback and len(embeddings_list) == len(self.chunks):
            self.embeddings = np.array(embeddings_list)
            logger.info("Successfully indexed using Gemini embeddings.")
        else:
            # Fallback to local TF-IDF
            logger.info("Falling back to local TF-IDF embeddings to bypass rate limits.")
            texts = [c["text"] for c in self.chunks]
            self.tfidf_vectorizer = TfidfVectorizer(stop_words='english')
            self.tfidf_matrix = self.tfidf_vectorizer.fit_transform(texts)

    def search(self, query: str, top_k: int = 3) -> list:
        if not self.chunks:
            return []
            
        # If Gemini embeddings are indexed
        if len(self.embeddings) > 0 and self.tfidf_vectorizer is None:
            query_emb = self._get_gemini_embedding(query)
            if query_emb:
                query_vector = np.array(query_emb).reshape(1, -1)
                similarities = cosine_similarity(query_vector, self.embeddings)[0]
                top_indices = np.argsort(similarities)[::-1][:top_k]
                results = []
                for idx in top_indices:
                    results.append({
                        "chunk": self.chunks[idx],
                        "score": float(similarities[idx])
                    })
                return results
                
        # Fallback to TF-IDF cosine similarity
        if self.tfidf_matrix is not None:
            query_vector = self.tfidf_vectorizer.transform([query])
            similarities = cosine_similarity(query_vector, self.tfidf_matrix)[0]
            top_indices = np.argsort(similarities)[::-1][:top_k]
            results = []
            for idx in top_indices:
                results.append({
                    "chunk": self.chunks[idx],
                    "score": float(similarities[idx])
                })
            return results
            
        return []

    def query(self, query: str) -> dict:
        """
        Executes a RAG query: searches for matching chunks and calls Gemini to answer.
        """
        results = self.search(query, top_k=4)
        
        context_parts = []
        for r in results:
            meta = r["chunk"]["metadata"]
            context_parts.append(f"[{meta['quarter']} - {meta['section']} (Relevance Score: {r['score']:.2f})]\n{r['chunk']['text']}")
            
        context = "\n\n".join(context_parts)
        
        prompt = f"""
        You are a financial assistant for a hedge fund. Use the following retrieved transcript context to answer the question.
        If the answer cannot be found in the context, use your financial knowledge to provide a helpful answer, but clearly demarcate what is found in the transcript versus general knowledge.
        
        Retrieved Transcript Context:
        {context}
        
        Question: {query}
        
        Provide a detailed answer. In your answer, cite the specific quarters and sections (e.g. Q1 - CEO Remarks) that you used.
        """
        try:
            answer = GeminiClient.generate_content(prompt, "You are a professional financial RAG assistant.")
            return {
                "answer": answer,
                "sources": [r["chunk"] for r in results]
            }
        except Exception as e:
            logger.error(f"Error in RAG generation: {e}")
            return {
                "answer": f"Sorry, I encountered an error while processing your request. Here are the matching segments found in the transcripts:\n\n" + "\n\n".join([f"- **{r['chunk']['metadata']['quarter']} {r['chunk']['metadata']['section']}**: {r['chunk']['text'][:200]}..." for r in results]),
                "sources": [r["chunk"] for r in results]
            }
