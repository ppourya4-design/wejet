import React, { Suspense, useEffect, useState } from 'react';
import { WejetProvider, useWejet } from './context/WejetContext';
import { DesktopLayerWindow } from './components/DesktopLayerWindow';
import { CommandCenter } from './command-center/CommandCenter';
import { QuickNoteOverlay } from './components/QuickNoteOverlay';
import { WidgetSettingsModal } from './components/WidgetSettingsModal';
import { MiniToolsModal } from './tools/MiniToolsModal';
import { OnboardingModal } from './components/OnboardingModal';

// Lazy-load Manager window code chunk so Desktop Layer WebView keeps minimal JS footprint (Section 68)
const LazyManagerWindow = React.lazy(() => import('./manager/ManagerWindow'));

function resolveInitialWindowRole(): 'desktop' | 'manager' {
  const params = new URLSearchParams(window.location.search);
  const w = params.get('window');
  if (w === 'manager') return 'manager';
  return 'desktop';
}

const WejetShell: React.FC = () => {
  const { ready } = useWejet();
  const [role, setRole] = useState<'desktop' | 'manager'>(resolveInitialWindowRole);
  const [targetSection, setTargetSection] = useState<string | undefined>(undefined);

  useEffect(() => {
    const handler = (ev: Event) => {
      const detail = (ev as CustomEvent<{ mode: 'desktop' | 'manager'; section?: string }>).detail;
      if (detail?.mode) {
        setTargetSection(detail.section);
        setRole(detail.mode);
      }
    };
    window.addEventListener('wejet-local-switch-window', handler);
    return () => window.removeEventListener('wejet-local-switch-window', handler);
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <>
      {role === 'manager' ? (
        <Suspense fallback={null}>
          <LazyManagerWindow
            initialSection={targetSection}
            onSwitchToDesktopPreview={() => setRole('desktop')}
          />
        </Suspense>
      ) : (
        <DesktopLayerWindow />
      )}

      <OnboardingModal />
      <CommandCenter />
      <QuickNoteOverlay />
      <WidgetSettingsModal />
      <MiniToolsModal />
    </>
  );
};

export const App: React.FC = () => (
  <WejetProvider>
    <WejetShell />
  </WejetProvider>
);

export default App;
