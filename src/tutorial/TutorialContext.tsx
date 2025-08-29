// src/tutorial/TutorialContext.tsx
/**
 * Module: TutorialContext
 * Purpose: Manage guided tour across Home → Levels → Practice → Profile.
 * Storage: tutorialActive:<username>
 */
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Step = 'home' | 'levels' | 'practice' | 'profile' | 'done';

type Ctx = {
  active: boolean;
  step: Step;
  /** Start tutorial for given username. */
  start: (username: string) => Promise<void>;
  /** Advance to next step manually (e.g., from Home/Levels/Profile). */
  next: () => void;
  /** Mark practice step done (only after a successful recording submit). */
  markPracticeDone: () => void;
  /** Finish tutorial and persist off. */
  finish: () => Promise<void>;
  /** Current username (for persistence). */
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
    // Auto-resume tutorial if flag exists for currentUser
    (async () => {
      const cur = await AsyncStorage.getItem('currentUser');
      if (cur) {
        const { username } = JSON.parse(cur) as { username: string };
        setUsername(username);
        const flag = await AsyncStorage.getItem(`tutorialActive:${username.toLowerCase()}`);
        if (flag === '1') {
          setActive(true);
          // When resuming, keep last step if stored (optional)
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
