import type { Action, AppData, Panel } from '../types';

export interface SearchHit {
  kind: 'panel' | 'action';
  panel: Panel;
  action?: Action;
  score: number;
}

function includesQuery(haystack: string | undefined, query: string): boolean {
  if (!haystack) return false;
  return haystack.toLowerCase().includes(query);
}

export function searchAppData(data: AppData, rawQuery: string): SearchHit[] {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return [];

  const hits: SearchHit[] = [];

  for (const panel of data.panels) {
    let panelScore = 0;
    if (includesQuery(panel.name, query)) panelScore += 3;

    if (panelScore > 0) {
      hits.push({ kind: 'panel', panel, score: panelScore });
    }

    for (const action of panel.actions) {
      let score = 0;
      if (includesQuery(action.name, query)) score += 4;
      if (includesQuery(action.value, query)) score += 3;
      if (includesQuery(action.description, query)) score += 2;
      if (includesQuery(action.type, query)) score += 1;
      if (includesQuery(panel.name, query)) score += 1;

      if (score > 0) {
        hits.push({ kind: 'action', panel, action, score });
      }
    }
  }

  return hits.sort((a, b) => b.score - a.score);
}

export function getFavoriteActions(data: AppData): Array<{ panel: Panel; action: Action }> {
  const favorites: Array<{ panel: Panel; action: Action }> = [];
  for (const panel of data.panels) {
    for (const action of panel.actions) {
      if (action.favorite) {
        favorites.push({ panel, action });
      }
    }
  }
  return favorites.sort((a, b) => a.action.name.localeCompare(b.action.name, 'es'));
}
