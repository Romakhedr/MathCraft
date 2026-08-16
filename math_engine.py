import os
import logging
import requests
from requests.exceptions import HTTPError, ConnectionError, Timeout, RequestException
from typing import Dict, Any

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - MathCraft-IBM-Engine - %(levelname)s - %(message)s"
)

class MathCraftIBMEngine:
    def __init__(self):
        self.api_url = os.getenv("IBMAPIURL")
        self.api_key = os.getenv("IBMBOBAPIKEY")
        self.timeout = 15.0

        if not self.api_url or not self.api_key:
            logging.error("Configuration Warning: Missing environment variables.")

    def _get_secure_headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

    def process_math_request(self, equation: str, difficulty: str = "beginner") -> Dict[str, Any]:
        if not self.api_url or not self.api_key:
            return {"success": False, "error": "Server configuration incomplete. Missing IBM credentials."}

        if not equation or not equation.strip():
            return {"success": False, "error": "Equation string cannot be empty."}

        payload = {
            "input": f"Solve this math equation step by step for a {difficulty} student: {equation}",
            "parameters": {
                "max_new_tokens": 500,
                "temperature": 0.5
            }
        }

        logging.info(f"Dispatching equation to IBM Bob API: {equation}")

        try:
            response = requests.post(
                url=self.api_url,
                json=payload,
                headers=self._get_secure_headers(),
                timeout=self.timeout
            )
            response.raise_for_status()
            return {"success": True, "data": response.json()}

        except ConnectionError as ce:
            logging.error(f"Network Connection Failed: {ce}")
            return {"success": False, "error": "Unable to connect to IBM servers."}
        except Timeout as te:
            logging.error(f"Request Timeout Error: {te}")
            return {"success": False, "error": "The AI model response timed out."}
        except HTTPError as he:
            logging.error(f"IBM API HTTP Error [{response.status_code}]: {he}")
            return {"success": False, "error": f"IBM API returned error status: {response.status_code}"}
        except ValueError as ve:
            logging.error(f"JSON Parsing Error: {ve}")
            return {"success": False, "error": "Received malformed data from AI service."}
        except RequestException as re:
            logging.error(f"Unhandled Request Exception: {re}")
            return {"success": False, "error": "Network communication error occurred."}
        except Exception as e:
            logging.critical(f"Critical System Failure: {str(e)}")
            return {"success": False, "error": "An internal system error occurred."}

if __name__ == "__main__":
    print("--- Running MathCraft IBM Engine Test ---")
    engine = MathCraftIBMEngine()
    test_equation = "3x + 5 = 20"
    result = engine.process_math_request(test_equation)
    print("Test Execution Result:")
    print(result)
