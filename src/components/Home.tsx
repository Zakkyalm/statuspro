import { MediaItem } from '../types';

interface HomeProps {
  onSelectCompress: (media: MediaItem) => void;
  onNavigateHistory: () => void;
  recentItems: MediaItem[];
}

export function Home({ onSelectCompress, onNavigateHistory, recentItems }: HomeProps) {
  return <div>Home</div>;
}
