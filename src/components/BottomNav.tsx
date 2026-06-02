import { ViewState } from '../types';

interface BottomNavProps {
  view: ViewState;
  onNavigate: (view: ViewState) => void;
}

export function BottomNav({ view, onNavigate }: BottomNavProps) {
  return <div>BottomNav</div>;
}
