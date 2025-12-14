import { Outlet, createRootRoute, useRouterState } from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { TanStackDevtools } from '@tanstack/react-devtools';
import { AnimatePresence, motion } from 'motion/react';

import { Navbar } from '@/components/header';
import { Toaster } from '@/components/ui/sonner';
import { Footer } from '@/components/footer';
import { useSettings, getPageWidthClass } from '@/lib/settings';

function RootComponent() {
  const router = useRouterState();
  const { settings } = useSettings();

  return (
    <div className='flex flex-col min-h-screen'>
      <Navbar />
      <main className='flex-1 flex flex-col items-center w-full'>
        <AnimatePresence mode='wait'>
          <motion.div
            key={router.location.pathname}
            initial={{ opacity: 0, transition: { duration: 0.2 } }}
            animate={{ opacity: 1, transition: { duration: 0.2 } }}
            className={`flex-1 w-full ${getPageWidthClass(settings.pageWidth)}`}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <Toaster />
      <Footer />
      <TanStackDevtools
        config={{
          position: 'bottom-right',
        }}
        plugins={[
          {
            name: 'Tanstack Router',
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      />
    </div>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
});
