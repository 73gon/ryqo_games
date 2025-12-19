import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export interface AppSettings {
  pageWidth: 'narrow' | 'medium' | 'wide' | 'full';
  font: 'inter' | 'mono' | 'serif';
  theme: 'default' | 'blue' | 'green' | 'orange' | 'rose' | 'purple';
  textCase: 'normal' | 'lowercase' | 'uppercase';
}

const defaultSettings: AppSettings = {
  pageWidth: 'medium',
  font: 'inter',
  theme: 'default',
  textCase: 'normal',
};

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const STORAGE_KEY = 'ryqo-games-settings';

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          return { ...defaultSettings, ...JSON.parse(stored) };
        } catch {
          return defaultSettings;
        }
      }
    }
    return defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));

    const root = document.documentElement;

    // Apply font class
    root.classList.remove('font-inter', 'font-mono', 'font-serif');
    root.classList.add(`font-${settings.font}`);

    // Apply text case class
    root.classList.remove('text-case-normal', 'text-case-lowercase', 'text-case-uppercase');
    root.classList.add(`text-case-${settings.textCase}`);

    // Apply theme
    root.setAttribute('data-theme', settings.theme);
  }, [settings]);

  const updateSettings = (partial: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

export function getPageWidthClass(width: AppSettings['pageWidth']) {
  switch (width) {
    case 'narrow':
      return 'max-w-3xl';
    case 'medium':
      return 'max-w-6xl';
    case 'wide':
      return 'max-w-7xl';
    case 'full':
      return 'max-w-full';
    default:
      return 'max-w-6xl';
  }
}
