/**
 * TutorialContext
 * Central state for the guided tour across Home → Levels → Practice → Profile.
 * - start(username): enables the tour and begins at Home.
 * - next(): advances to the next step; markPracticeDone(): jumps to Profile after a successful submit.
 * - finish(): ends the tour and clears persisted flags.
 * Persistence: AsyncStorage keys per user (tutorialActive:<username>, tutorialStep:<username>).
 * Usage: Wrap the app with <TutorialProvider/> and use `useTutorial()` in screens.
 */

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Step = 'home' | 'levels' | 'practice' | 'profile' | 'done';

type Ctx = {
  active: boolean;
  step: Step;
  start: (username: string) => Promise<void>;
  next: () => void;
  markPracticeDone: () => void;
  finish: () => Promise<void>;
  username: string | null;
  setUsername: (u: string | null) => void;
};

const TutorialContext = createContext<Ctx>({
  active: false,
  step: 'home',
  start: async () => {},
  next: () => {},
  markPracticeDone: () => {},
  finish: async () => {},
  username: null,
  setUsername: () => {},
});

export const TutorialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState<Step>('home');
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const cur = await AsyncStorage.getItem('currentUser');
      if (cur) {
        const { username } = JSON.parse(cur) as { username: string };
        setUsername(username);
        const flag = await AsyncStorage.getItem(`tutorialActive:${username.toLowerCase()}`);
        if (flag === '1') {
          setActive(true);
          const saved = await AsyncStorage.getItem(`tutorialStep:${username.toLowerCase()}`);
          setStep((saved as Step) || 'home');
        }
      }
    })();
  }, []);

  const persist = async (s: Step) => {
    if (!username) return;
    await AsyncStorage.setItem(`tutorialStep:${username.toLowerCase()}`, s);
  };

  const value = useMemo<Ctx>(() => ({
    active,
    step,
    start: async (u: string) => {
      setUsername(u);
      await AsyncStorage.setItem(`tutorialActive:${u.toLowerCase()}`, '1');
      await AsyncStorage.setItem(`tutorialStep:${u.toLowerCase()}`, 'home');
      setStep('home');
      setActive(true);
    },
    next: () => {
      const order: Step[] = ['home', 'levels', 'practice', 'profile', 'done'];
      const idx = order.indexOf(step);
      const n = order[Math.min(idx + 1, order.length - 1)];
      setStep(n);
      persist(n);
    },
    markPracticeDone: () => {
      setStep('profile');
      persist('profile');
    },
    finish: async () => {
      if (username) {
        await AsyncStorage.multiRemove([
          `tutorialActive:${username.toLowerCase()}`,
          `tutorialStep:${username.toLowerCase()}`,
        ]);
      }
      setActive(false);
      setStep('done');
    },
    username,
    setUsername,
  }), [active, step, username]);

  return <TutorialContext.Provider value={value}>{children}</TutorialContext.Provider>;
};

export const useTutorial = () => useContext(TutorialContext);
