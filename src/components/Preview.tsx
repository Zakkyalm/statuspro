import { MediaItem } from '../types';

interface PreviewProps {
  media: MediaItem;
  onBack: () => void;
  onShare: (caption: string) => void;
}

export function Preview({ media, onBack, onShare }: PreviewProps) {
  return <div>Preview</div>;
}
