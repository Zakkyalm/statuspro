import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ViewState, MediaItem } from './types';
import { Home } from './components/Home';
import { Preview } from './components/Preview';
import { Compress } from './components/Compress';
import { History } from './components/History';
import { BottomNav } from './components/BottomNav';
import { SplashScreen } from './components/SplashScreen';
import { InstallBanner } from './components/InstallBanner';
import { Onboarding } from './components/Onboarding';
import { ThemeProvider } from './contexts/ThemeContext';
import { useScreenInit } from './useScreenInit.js';
import { fetchHistory, deleteHistoryEntry as apiDeleteHistory } from './api';

function StatusProApp() {
  const screenInit = useScreenInit();
  const [splashDone, setSplashDone] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(
    () => localStorage.getItem('statuspro-onboarding-done') !== 'true'
  );
  const [view, setView] = useState<ViewState>(screenInit.view ?? 'home');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(
    screenInit.selectedMedia ?? null
  );
  const [historyItems, setHistoryItems] = useState<MediaItem[]>([]);

  // Load history from server on mount
  useEffect(() => {
    fetchHistory(50, 0)
      .then(({ items }) => {
        const mapped: MediaItem[] = items.map((entry) => ({
          id: entry.id,
          mediaId: entry.mediaId,
          type: entry.type,
          url: entry.url,
          name: entry.name,
          size: entry.sizeLabel,
          caption: entry.caption,
          date: new Date(entry.sharedAt).toLocaleDateString(),
          uploaded: true,
        }));
        setHistoryItems(mapped);
      })
      .catch(() => {
        // Server unavailable — history stays empty (local-only mode)
      });
  }, []);

  // Media selected → go straight to preview so caption is immediately accessible
  const handleSelectMedia = (media: MediaItem) => {
    setSelectedMedia(media);
    setView('preview');
  };

  // Compress flow — go to compress screen
  const handleSelectCompress = (media: MediaItem) => {
    setSelectedMedia(media);
    setView('compress');
  };

  // caption is passed from Preview so the local history entry carries it
  const handleShare = (caption: string) => {
    if (selectedMedia) {
      const itemWithCaption: MediaItem = { ...selectedMedia, caption };
      if (!historyItems.find((item) => item.id === selectedMedia.id)) {
        setHistoryItems((prev) => [itemWithCaption, ...prev]);
      }
      // Refresh history from server to get persistent URLs + server-stored caption
      fetchHistory(50, 0)
        .then(({ items }) => {
          const mapped: MediaItem[] = items.map((entry) => ({
            id: entry.id,
            mediaId: entry.mediaId,
            type: entry.type,
            url: entry.url,
            name: entry.name,
            size: entry.sizeLabel,
            caption: entry.caption,
            date: new Date(entry.sharedAt).toLocaleDateString(),
            uploaded: true,
          }));
          setHistoryItems(mapped);
        })
        .catch(() => {
          // Keep local state if server is unavailable
        });
      setTimeout(() => {
        setView('home');
        setSelectedMedia(null);
      }, 500);
    }
  };

  const handleDeleteHistoryItem = (id: string) => {
    // Optimistic local update
    setHistoryItems((prev) => prev.filter((item) => item.id !== id));
    // Persist deletion on server (best-effort)
    apiDeleteHistory(id).catch((err) => {
      console.warn('Failed to delete history entry on server:', err);
    });
  };

  const variants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit:    { opacity: 0, x: -20 },
  };

  return (
    <>
      {/* Splash — renders on top until dismissed */}
      <SplashScreen onComplete={() => setSplashDone(true)} />

      {/* Main app / Onboarding — fades in once splash exits */}
      <AnimatePresence mode="wait">
        {splashDone && showOnboarding && (
          <Onboarding
            key="onboarding"
            onComplete={() => {
              localStorage.setItem('statuspro-onboarding-done', 'true');
              setShowOnboarding(false);
            }}
          />
        )}
        {splashDone && !showOnboarding && (
          <motion.div
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="h-screen w-full max-w-full bg-neutral-50 dark:bg-neutral-950 theme-transition relative flex flex-col overflow-hidden">
            {/* Ambient backdrop */}
            <div className="absolute inset-0 ambient-grain pointer-events-none" />

            <div className="relative w-full flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                {view === 'home' && (
                  <motion.div
                    key="home"
                    variants={variants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="absolute inset-0 overflow-y-auto overflow-x-hidden pb-20">
                    <Home
                      onSelectCompress={handleSelectCompress}
                      onNavigateHistory={() => setView('history')}
                      recentItems={historyItems} />
                  </motion.div>
                )}

                {view === 'preview' && selectedMedia && (
                  <motion.div
                    key="preview"
                    variants={variants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="absolute inset-0 overflow-y-auto overflow-x-hidden">
                    <Preview
                      media={selectedMedia}
                      onBack={() => setView('home')}
                      onShare={handleShare} />
                  </motion.div>
                )}

                {view === 'compress' && selectedMedia && (
                  <motion.div
                    key="compress"
                    variants={variants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="absolute inset-0 overflow-y-auto overflow-x-hidden">
                    <Compress
                      media={selectedMedia}
                      onBack={() => setView('home')} />
                  </motion.div>
                )}

                {view === 'history' && (
                  <motion.div
                    key="history"
                    variants={variants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="absolute inset-0 overflow-y-auto overflow-x-hidden pb-20">
                    <History
                      items={historyItems}
                      onBack={() => setView('home')}
                      onShareItem={(item) => {
                        setSelectedMedia(item);
                        setView('preview');
                      }}
                      onDeleteItem={handleDeleteHistoryItem} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom navigation — home & history tabs */}
            <BottomNav view={view} onNavigate={setView} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <StatusProApp />
      <InstallBanner />
    </ThemeProvider>
  );
}
