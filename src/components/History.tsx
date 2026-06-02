import { MediaItem } from '../types';

interface HistoryProps {
  items: MediaItem[];
  onBack: () => void;
  onShareItem: (item: MediaItem) => void;
  onDeleteItem: (id: string) => void;
}

export function History({ items, onBack, onShareItem, onDeleteItem }: HistoryProps) {
  return <div>History</div>;
}
