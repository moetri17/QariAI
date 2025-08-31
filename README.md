# QariAI 📖🎙️

An educational mobile app built with **React Native** and **Expo** to help learners practise Arabic/Qur’anic recitation.
Users can follow guided levels, record their voice, receive instant feedback, and track progress with analytics.

---

## 🚀 Getting Started

### 1. Prerequisites

Make sure you have the following installed:

* [Node.js](https://nodejs.org/) (LTS recommended, v18 or above)
* [Expo CLI](https://docs.expo.dev/get-started/installation/)

  ```bash
npx create-expo-app@latest
  ```
* An emulator/simulator or the **Expo Go** app installed on your Android/iOS device.

---

### 2. Clone the repository

```bash
git clone https://github.com/yourusername/qariai.git
cd qariai
```

---

### 3. Install dependencies

```bash
npm install
```

This will install all packages listed in `package.json`, including:

* Navigation (`@react-navigation/*`)
* Local storage (`@react-native-async-storage/async-storage`)
* SQLite (`expo-sqlite`)
* Audio recording & playback (`expo-audio`, `expo-av`)
* UI libraries (`react-native-paper`, `react-native-svg`, `expo-linear-gradient`)

---

### 4. Run the app

Start the Expo development server:

```bash
npx expo start
```

Or launch directly:

```bash
npm run android   # run on Android emulator or device
npm run ios       # run on iOS simulator or device
npm run web       # run in web browser (limited functionality)
```

Open the **Expo Go** app on your phone and scan the QR code from the terminal or browser window.

---

## 📂 Project Structure

```
qariai/
├── App.tsx                 # App entry point
├── package.json            # Project metadata & dependencies
└── src/
    ├── navigation/         # App navigation (stack & tabs)
    ├── screens/            # Screens (Home, Levels, Practice, Profile, etc.)
    ├── components/         # Reusable UI components
    ├── constants/          # Static constants (letters, levels)
    ├── db/                 # SQLite schema & migrations
    ├── services/           # Data & user helpers
    └── tutorial/           # Guided tour context & overlay
```

---

## 🛠 Features

* 🎙 **Practice Mode** – record recitations and get instant feedback
* 📊 **Analytics Dashboard** – track per-letter accuracy, streaks, and progress
* ⭐ **XP & Levels** – unlock learning levels and earn XP points
* 🧭 **Guided Tutorial** – onboarding tour through core screens
* 💾 **Local-first Design** – data stored locally with **SQLite** + **AsyncStorage**

---

## ⚡ Notes

* Ensure microphone permissions are enabled on your device to record audio.
* Some features (e.g., PDF export, audio analysis) are only supported on native builds, not the web preview.
* This project uses **TypeScript** for type safety.

---

## 📜 License

MIT License © 2025 — QariAI Project
