import os
import requests
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = "gemini-3.1-flash-lite"
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key="

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY", "")
MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions"

class GeminiClient:
    @staticmethod
    def generate_content(prompt: str, system_instruction: str = None, json_mode: bool = False) -> str:
        # Fallback 1: Try Gemini
        try:
            logger.info("Attempting generation using Google Gemini...")
            payload = {
                "contents": [{"parts": [{"text": prompt}]}]
            }
            if system_instruction:
                payload["systemInstruction"] = {
                    "parts": [{"text": system_instruction}]
                }
            if json_mode:
                payload["generationConfig"] = {
                    "responseMimeType": "application/json"
                }
                
            response = requests.post(
                f"{GEMINI_URL}{GEMINI_API_KEY}", 
                headers={"Content-Type": "application/json"}, 
                data=json.dumps(payload),
                timeout=60
            )
            if response.status_code == 200:
                res_json = response.json()
                candidates = res_json.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        return parts[0].get("text", "")
                raise ValueError(f"No text candidate in Gemini response: {res_json}")
            else:
                raise Exception(f"Gemini API returned status {response.status_code}: {response.text}")
        except Exception as gemini_err:
            logger.warning(f"Gemini generation failed: {gemini_err}. Attempting Groq fallback...")
            
            # Fallback 2: Try Groq
            try:
                messages = []
                if system_instruction:
                    messages.append({"role": "system", "content": system_instruction})
                messages.append({"role": "user", "content": prompt})
                
                payload = {
                    "model": "llama3-8b-8192",
                    "messages": messages,
                    "temperature": 0.2
                }
                if json_mode:
                    payload["response_format"] = {"type": "json_object"}
                    
                response = requests.post(
                    GROQ_URL,
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {GROQ_API_KEY}"
                    },
                    data=json.dumps(payload),
                    timeout=30
                )
                if response.status_code == 200:
                    logger.info("Generation succeeded via Groq (llama3-8b-8192)")
                    return response.json()["choices"][0]["message"]["content"]
                else:
                    raise Exception(f"Groq API returned status {response.status_code}: {response.text}")
            except Exception as groq_err:
                logger.warning(f"Groq generation failed: {groq_err}. Attempting OpenRouter fallback...")
                
                # Fallback 3: Try OpenRouter
                try:
                    messages = []
                    if system_instruction:
                        messages.append({"role": "system", "content": system_instruction})
                    messages.append({"role": "user", "content": prompt})
                    
                    payload = {
                        "model": "meta-llama/llama-3-8b-instruct:free",
                        "messages": messages,
                        "temperature": 0.2
                    }
                    if json_mode:
                        payload["response_format"] = {"type": "json_object"}
                        
                    response = requests.post(
                        OPENROUTER_URL,
                        headers={
                            "Content-Type": "application/json",
                            "Authorization": f"Bearer {OPENROUTER_API_KEY}"
                        },
                        data=json.dumps(payload),
                        timeout=30
                    )
                    if response.status_code == 200:
                        logger.info("Generation succeeded via OpenRouter (llama-3-8b-instruct:free)")
                        return response.json()["choices"][0]["message"]["content"]
                    else:
                        raise Exception(f"OpenRouter API returned status {response.status_code}: {response.text}")
                except Exception as or_err:
                    logger.warning(f"OpenRouter generation failed: {or_err}. Attempting Mistral fallback...")
                    
                    # Fallback 4: Try Mistral
                    try:
                        messages = []
                        if system_instruction:
                            messages.append({"role": "system", "content": system_instruction})
                        messages.append({"role": "user", "content": prompt})
                        
                        payload = {
                            "model": "open-mistral-7b",
                            "messages": messages,
                            "temperature": 0.2
                        }
                        if json_mode:
                            payload["response_format"] = {"type": "json_object"}
                            
                        response = requests.post(
                            MISTRAL_URL,
                            headers={
                                "Content-Type": "application/json",
                                "Authorization": f"Bearer {MISTRAL_API_KEY}"
                            },
                            data=json.dumps(payload),
                            timeout=30
                        )
                        if response.status_code == 200:
                            logger.info("Generation succeeded via Mistral (open-mistral-7b)")
                            return response.json()["choices"][0]["message"]["content"]
                        else:
                            raise Exception(f"Mistral API returned status {response.status_code}: {response.text}")
                    except Exception as mistral_err:
                        logger.error(f"All LLM providers failed. Last error: {mistral_err}")
                        raise Exception(f"All LLM fallback providers failed. Gemini Error: {gemini_err}, Groq Error: {groq_err}, OpenRouter Error: {or_err}, Mistral Error: {mistral_err}")

    @staticmethod
    def extract_first_json_block(text: str) -> str:
        # Find the first '{'
        start = text.find('{')
        if start == -1:
            return text
        
        # Count matching braces
        brace_count = 0
        in_string = False
        escape = False
        
        for i in range(start, len(text)):
            char = text[i]
            
            if escape:
                escape = False
                continue
                
            if char == '\\':
                escape = True
                continue
                
            if char == '"':
                in_string = not in_string
                continue
                
            if not in_string:
                if char == '{':
                    brace_count += 1
                elif char == '}':
                    brace_count -= 1
                    if brace_count == 0:
                        # Found the end of the first JSON object!
                        return text[start:i+1]
                        
        return text[start:]

    @staticmethod
    def generate_json(prompt: str, system_instruction: str = None) -> dict:
        text = GeminiClient.generate_content(prompt, system_instruction, json_mode=True)
        # Clean up code blocks if model added them despite json_mode
        text_clean = text.strip()
        if text_clean.startswith("```json"):
            text_clean = text_clean[7:]
        if text_clean.endswith("```"):
            text_clean = text_clean[:-3]
        text_clean = text_clean.strip()
        
        # Extract only the first valid JSON object
        text_clean = GeminiClient.extract_first_json_block(text_clean)
        
        try:
            return json.loads(text_clean)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON content: '{text_clean}'. Error: {e}")
            raise e
