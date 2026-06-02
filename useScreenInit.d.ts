import type { ViewState, MediaItem } from './types';

interface ScreenInitState {
  view?: ViewState;
  selectedMedia?: MediaItem;
}

export declare function useScreenInit(): ScreenInitState;
