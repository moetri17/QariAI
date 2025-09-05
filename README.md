# QariAI Project Repository

This repository contains the full codebase and scripts developed for the **QariAI MSc Dissertation Project**.  
It is organised into two main components: the mobile learning application and the AI Models for training and evaluation.

---

## 📱 Mobile Application
**Path:** [`Mobile Application/`](./Mobile%20Application)

A React Native (Expo + TypeScript) mobile app that delivers:
- A structured, level-based learning pathway for Arabic/Quranic recitation
- Real-time pronunciation feedback powered by locally trained AI models
- Offline-first functionality for learners in low-connectivity regions

👉 See the [`Mobile Application/README.md`](./Mobile%20Application/README.md) for setup, installation, and usage instructions.

---

## 🤖 AI Models
**Path:** [`AI Models/`](./AI%20Models)

Python scripts and Jupyter/Colab notebooks used to develop and evaluate the ASR models:
- Dataset loading and preprocessing
- Model architectures (letters, words, and verses)
- Training pipelines with TensorFlow/Keras
- Evaluation metrics (Top-1, Top-5, confusion matrices, classification reports)
- Inference demos for single-file predictions

👉 A separate `README.md` will describe how to run each notebook/script.

---

## 📂 Repository Structure
```plaintext
QariAI/
├── Mobile Application/    # Mobile app source code (React Native, TypeScript)
│   └── README.md          # Setup and usage instructions for the app
│
├── AI Models/            # Model training, evaluation, and demo scripts
│   └── (notebooks, .py files, etc.)
│
└── README.md              # Project overview (this file)
