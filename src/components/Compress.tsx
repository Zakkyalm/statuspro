import { MediaItem } from '../types';

interface CompressProps {
  media: MediaItem;
  onBack: () => void;
}

export function Compress({ media, onBack }: CompressProps) {
  return <div>Compress</div>;
}
