import { liveQuery } from 'dexie';
import { useObservable } from '@vueuse/rxjs';

export function useLiveQuery(querier) {
  return useObservable(liveQuery(querier));
}
