<div align="center">
 
<img src="logo.png" alt="MathCraft 
 Logo" width="180"/>

# MathCraft
**AI-Powered Adaptive Learning & Web3 Gamified Math Platform**

![Version](https://img.shields.io/badge/version-1.0.0-blue?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)
![Build](https://img.shields.io/badge/build-passing-brightgreen?style=for-the-badge)
![NodeJS](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=nodedotjs&logoColor=white)

</div>

---

## 🌐 Live Demo & Deployment
- **Frontend App:** [https://romakhedr.github.io/MathCraft/](https://romakhedr.github.io/MathCraft/)
- **API Backend:** Hosted on Vercel Serverless Functions

---
🚀 Key Features
MathCraft is built on three core pillars:
🤖 AI-Powered Real-Time Tutor: Explains complex mathematical concepts and step-by-step mistake solutions powered by IBM watsonx AI
📊 Adaptive Progress Analytics: Dynamic dashboard that tracks student milestones, performance speed, and accuracy precision.
🪙 Web3 Tokenized Rewards (In Progress): A planned blockchain integration rewarding student progress with a native MathCraft Token (MTH). The ERC-20 contract is currently written and tested in a Remix IDE simulation environment and has not yet been compiled or deployed to a live/test network.
🛠️ Tech Stack
Frontend: HTML5, CSS3, JavaScript (ES6+), Web3.js / Ethers.js
Backend: Vercel Serverless Functions (Node.js)
AI Engine: IBM Bob API (IBM SaaS Console / Trial Environment)
Blockchain (Prototype): Solidity, ERC-20 token contract design (OpenZeppelin standard) — developed and tested in Remix IDE; not yet compiled or deployed on-chain
UI/UX Design: Minimalist 'Quiet Luxury' Aesthetic
📜 Smart Contract Details
Token Name: MathCraft Token
Symbol: MTH
Standard: ERC-20 (planned)
Status: Written in Solidity (MathCraftToken.sol) and tested in Remix IDE (Remix VM simulation environment). Not yet compiled or deployed to a live or test network. No live contract address exists at this time.
Target Network (planned): BNB Smart Chain / Ethereum Testnet
⚙️ Environment Setup
To run this project locally, create a .env file in the root directory and add:
IBMCloud=your_ibm_cloud_api_key
mathcraftv2=your_mathcraft_v2_key
mathcraft-backend=your_backend_key
IBMBOBAPIKEY=your_ibm_bob_api_key
📝 About
MathCraft aims to empower students worldwide by combining artificial intelligence with decentralized incentives, establishing a reliable, engaging, and efficient learning environment.
Built with passion by Reham Hamdy Elsayed khedr.
🚀 Selected Challenge Theme
Wildcard Challenge — Intelligent Systems for the Future of Work
MathCraft's adaptive-learning and credentialing engine has been extended into MathCraft for Work (/work), a version that helps working professionals build the quantitative skills their jobs actually require — pricing a deal, sizing a forecast, reading a dashboard — instead of a generic curriculum.
It directly answers the Wildcard brief of helping people plan, coordinate, decide, and execute work more effectively:
Plan — an AI diagnostic identifies which quantitative gap is costing someone time, tied to their actual role.
Coordinate — a team dashboard shows managers where a team's decision-readiness is thin, before it becomes a bottleneck.
Decide — scenario-based challenges are built from real workplace decisions, not textbook problems.
Execute — learning happens next to the task itself, so the skill is usable immediately.
🔗 Live demo: math-craft-gray.vercel.app/work
🤖 How IBM Bob Was Used
IBM Bob served as the primary development tool throughout this project:
Code Generation & Refactoring: Bob was used to write, debug, and refactor core backend logic in math_engine.py, including the IBM watsonx API integration and Web3 smart contract interaction functions.
Documentation: Bob assisted in generating and maintaining this README, including structuring sections, formatting badges, and writing setup instructions.
Debugging & Troubleshooting: Bob was used interactively to diagnose authentication issues, environment configuration, and API connectivity problems during development.
Project Structure Auditing: Bob helped verify the consistency of the project's file structure and identify missing configuration files (e.g., .env.example).
Verified Learning & Certification: Beyond hands-on development use, the author completed three official IBM SkillsBuild learning activities on Bob and the underlying Granite models — IBM Granite Models for Software Development, Lab: Troubleshoot Your Code Using IBM Bob, and How IBM Bob and AI Tools Are Changing the Way Solutions Are Built — completed July 18–19, 2026. Completion certificates are included in this repository (IBM Completion Certification Report-2026.pdf, IBM Completion Certificate_SkillsBuild.pdf) as verifiable proof of engagement with the platform.
