import os
import logging
import requests
from typing import Dict, Any
from web3 import Web3
from web3.middleware import ExtraDataToPOAMiddleware

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)


class MathCraftIBMEngine:
    """
    AI engine for the Math Craft platform, compatible with Vercel environment
    variables and the IBM Bob challenge.
    """

    def __init__(self):
        # Bind Vercel environment variables to the service with safe fallbacks
        self.api_url = os.getenv("IBMAPIURL") or os.getenv("IBMBOBAPIURL", "")
        self.api_key = os.getenv("IBMBOBAPIKEY") or os.getenv("IBMBOBAPIKEY", "")
        self.timeout = 30

        # Web3 and BSC network settings using Vercel environment variables
        self.bsc_rpc = os.getenv("BSC_RPC_URL") or os.getenv(
            "mathcraftv2", "https://data-seed-prebsc-1-s1.binance.org:8545/"
        )
        self.private_key = os.getenv("DISTRIBUTOR_PRIVATE_KEY") or os.getenv(
            "mathcraft_backend", ""
        )
        self.contract_address = os.getenv("CONTRACT_ADDRESS", "")

        self.w3 = Web3(Web3.HTTPProvider(self.bsc_rpc))
        try:
            self.w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
        except Exception:
            pass

        self.contract_abi = [
            {
                "inputs": [
                    {"internalType": "address", "name": "student", "type": "address"},
                    {"internalType": "uint256", "name": "amount", "type": "uint256"},
                ],
                "name": "distributeReward",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function",
            },
            {
                "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
                "name": "balanceOf",
                "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                "stateMutability": "view",
                "type": "function",
            },
        ]

        if self.contract_address and self.w3.is_connected():
            try:
                self.contract = self.w3.eth.contract(
                    address=Web3.to_checksum_address(self.contract_address),
                    abi=self.contract_abi,
                )
            except Exception:
                self.contract = None
        else:
            self.contract = None

    def _get_secure_headers(self) -> Dict[str, str]:
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }

    def process_math_request(
        self, equation: str, difficulty: str = "medium"
    ) -> Dict[str, Any]:
        """
        Send the equation to the IBM Bob / watsonx API to get a step-by-step solution.
        """
        if not self.api_url or not self.api_key:
            return {
                "success": False,
                "error": "Server configuration incomplete for IBM Bob API (Check IBMAPIURL and IBMBOBAPIKEY).",
            }

        if not equation or not equation.strip():
            return {"success": False, "error": "Equation string cannot be empty."}

        payload = {
            "input": f"Solve this math equation step by step for a {difficulty} level student and provide the final verified answer: {equation}",
            "parameters": {"max_new_tokens": 500, "temperature": 0.5},
        }

        logging.info(f"Dispatching equation to IBM Bob API: {equation}")

        try:
            response = requests.post(
                url=self.api_url,
                json=payload,
                headers=self._get_secure_headers(),
                timeout=self.timeout,
            )
            response.raise_for_status()
            return {"success": True, "data": response.json()}
        except requests.exceptions.RequestException as e:
            logging.error(f"IBM Bob API error: {e}")
            return {"success": False, "error": str(e)}

    def reward_student_on_success(
        self, student_wallet: str, reward_amount_tokens: float
    ) -> Dict[str, Any]:
        """
        Automatically grant a reward via the BSC smart contract when a student
        successfully completes the problem.
        """
        if not self.contract or not self.private_key:
            return {
                "success": False,
                "error": "Web3 contract or private key not configured.",
            }

        try:
            checksum_wallet = Web3.to_checksum_address(student_wallet)
            amount_wei = self.w3.to_wei(reward_amount_tokens, "ether")

            account = self.w3.eth.account.from_key(self.private_key)
            nonce = self.w3.eth.get_transaction_count(account.address)

            txn = self.contract.functions.distributeReward(
                checksum_wallet, amount_wei
            ).build_transaction(
                {
                    "chainId": self.w3.eth.chain_id,
                    "gas": 150000,
                    "gasPrice": self.w3.eth.gas_price,
                    "nonce": nonce,
                }
            )

            signed_txn = self.w3.eth.account.sign_transaction(
                txn, private_key=self.private_key
            )
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.raw_transaction)

            logging.info(f"Reward transaction sent on BSC: {tx_hash.hex()}")
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)

            return {
                "success": True,
                "tx_hash": tx_hash.hex(),
                "block_number": receipt.blockNumber,
            }
        except Exception as e:
            logging.error(f"Blockchain reward distribution failed: {e}")
            return {"success": False, "error": str(e)}

    def get_student_balance(self, student_wallet: str) -> Dict[str, Any]:
        """
        Read the student's current MTH token balance from the contract (read-only, no gas needed).
        """
        if not self.contract:
            return {"success": False, "error": "Contract not configured."}

        try:
            checksum_wallet = Web3.to_checksum_address(student_wallet)
            balance_wei = self.contract.functions.balanceOf(checksum_wallet).call()
            balance_tokens = self.w3.from_wei(balance_wei, "ether")
            return {"success": True, "balance": float(balance_tokens)}
        except Exception as e:
            logging.error(f"Failed to fetch balance: {e}")
            return {"success": False, "error": str(e)}
