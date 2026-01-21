# Parenthesis 🛡️

**Child-safe AI learning platform with 99% content moderation accuracy.**

## 📖 Overview

Parenthesis allows children (ages 6-14) to interact with AI models to ask questions and learn in a secure environment. It features a dual-layer moderation system to ensure safety while providing parents with full visibility and control over their child's digital interactions.

## ✨ Key Features

### 🧒 For Children

* **Natural Interaction:** Ask questions naturally and receive age-appropriate explanations.
* **Safe Learning:** All responses are filtered for toxicity, sensitive topics, and inappropriate content.

### 👨‍👩‍👧‍👦 For Parents

* **Real-Time Monitoring:** View all conversations as they happen.
* **Granular Control:** Block specific topics and set usage time limits.
* **Smart Alerts:** Receive immediate notifications for concerning interaction patterns.

### 🔒 Safety Architecture

* **Dual-Layer Moderation:** Filters both user input and AI output.
* **High Accuracy:** Utilizes LlamaGuard and Perspective API to achieve 99% moderation accuracy.
* **Audit Logging:** Every message is logged for parental review.

## Architecture
![Architecture](./assets/parenthesis-architecture.png)

## 🛠 Tech Stack

* **Frontend:** React, TypeScript
* **Backend:** Firebase (Firestore, Cloud Functions)
* **AI & Moderation:** GPT-4, LlamaGuard, Perspective API

## 🔄 How It Works

The system employs a strict validation pipeline for every interaction:

1. **Input Layer:** Child asks a question → **LlamaGuard** scans input for safety (Layer 1).
2. **Generation:** If safe, **GPT-4** generates a response.
3. **Output Layer:** **LlamaGuard** + **Perspective API** scan the AI response (Layer 2).
4. **Decision:**
* *Pass:* Response is displayed to the child.
* *Fail:* Content is blocked and logged.


5. **Sync:** Parents receive real-time updates on the dashboard.

## 📊 Performance & Results

* **99% Moderation Accuracy** (Validated on 1,000 test cases).
* **<500ms** Total latency per interaction.
* **60% Reduction** in Firebase read operations via optimized data structuring.

## 🚀 Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/parenthesis.git

# Install dependencies
npm install

# Configure Environment
cp .env.example .env
# Open .env and add your OpenAI, LlamaGuard, and Perspective API keys

# Deploy backend
firebase deploy

# Run locally
npm start

```

## 📄 License

MIT
