import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from 'next-themes';
import { RouterProvider } from '@tanstack/react-router';
import { Analytics } from '@vercel/analytics/react';
import { router } from '@/router';
import { SettingsProvider } from '@/lib/settings.tsx';

import '@/lib/i18n';
import '@/index.css';

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
      <SettingsProvider>
        <RouterProvider router={router} />
        <Analytics />
      </SettingsProvider>
    </ThemeProvider>
  </StrictMode>,
);
