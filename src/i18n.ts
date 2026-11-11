import { createContext, useContext } from 'react';
import type { Language, PlaceType, Restaurant, SortMode } from './types';

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'English',
  zh: '中文',
};

/** BCP 47 tags sent to Google / OSM / the <html lang> attribute. */
export const LANGUAGE_TAGS: Record<Language, string> = {
  en: 'en',
  zh: 'zh-CN',
};

/** Picks Chinese for visitors whose browser prefers it, English otherwise. */
export function detectLanguage(): Language {
  try {
    const prefs = navigator.languages?.length ? navigator.languages : [navigator.language];
    return prefs.some((l) => l?.toLowerCase().startsWith('zh')) ? 'zh' : 'en';
  } catch {
    return 'en';
  }
}

const en = {
  tagline: (radius: number, group: number, budget: number) =>
    `Spin to pick where your group eats — within ${radius}m, for ${group} people, ~$${budget}/person.`,
  refreshList: 'Refresh list',
  settings: 'Settings',
  lastKnown: 'Last known:',
  findingLocation: 'Finding your location…',
  tryAgain: 'Try again',
  geo: {
    unsupported: 'Geolocation is not supported by this browser.',
    denied: 'Location permission was denied.',
    unavailable: 'Unable to get your location.',
    timeout: 'Finding your location took too long.',
  },
  usingSavedLocation: "Using your last known location since a fresh fix isn't available.",
  usingDemoLocation: "Using a demo location since yours isn't available.",
  findingPlaces: 'Finding nearby places…',
  viaProxy: "Fetched live data via a backup connection (your network couldn't reach it directly).",
  viaBackup:
    'The main map data source was unreachable — showing real nearby places from a backup source instead (results may be less complete).',
  usingMock: "Couldn't reach live map data right now — showing demo restaurants so you can still try the spin.",
  noneFound: (radius: number) => `No restaurants found on the map within ${radius}m.`,
  tryBiggerRadius: 'Try a bigger radius',

  spin: 'SPIN',
  spinning: 'Spinning…',

  legendEmpty: 'No places found in range yet.',
  removeFromWheel: 'Remove from wheel',
  removeNamed: (name: string) => `Remove ${name} from the wheel`,

  notIncluded: (n: number) => `Not included in this spin (${n})`,
  include: 'Include',
  addBack: 'Add back to the wheel',

  winnerKicker: "🎉 Tonight's pick",
  away: (distance: string) => `${distance} away`,
  demoData: 'demo data',
  forGroup: (group: number, budget: number) =>
    `For ${group} ${group === 1 ? 'person' : 'people'} · ~$${budget}/person`,
  openInGoogleMaps: 'Open in Google Maps',
  respinExcluding: '🔁 Respin (exclude this)',
  spinAgain: '🔄 Spin again',

  mapLabel: 'Map of nearby places',
  youAreHere: 'You are here',
  searchCenter: 'Search center',
  mapKeyRejected:
    'Google Maps rejected the API key (check its HTTP referrer restrictions and that billing is enabled).',

  settingsTitle: 'Spin Settings',
  language: 'Language',
  searchRadius: 'Search radius:',
  budgetPerPerson: 'Budget per person ($)',
  groupSize: 'Group size',
  budgetHint:
    "Budget and group size are shown alongside your results as a reminder for the group — most map data doesn't reliably expose price levels, so this doesn't filter results yet.",
  placeTypes: 'Place types',
  maxOnWheel: 'Max places on the wheel:',
  wheelPicks: 'Wheel picks',
  sortModes: { nearest: 'Nearest', rating: 'Highest rated' } as Record<SortMode, string>,
  wheelPicksHint: 'When there are more nearby places than the max above, only these make it onto the wheel.',
  ratingHint: ' Places without a rating just fall back to nearest.',
  cuisineFilter: 'Cuisine filter (optional)',
  cancel: 'Cancel',
  save: 'Save',

  placeTypeLabels: {
    restaurant: 'Restaurant',
    fast_food: 'Fast Food',
    cafe: 'Cafe',
    pub: 'Bar / Pub',
    food_court: 'Food Court',
  } as Record<PlaceType, string>,
  foodCourtStalls: (n: number) => `${n} stalls`,
};

export type Translations = typeof en;

const zh: Translations = {
  tagline: (radius, group, budget) => `转动转盘，决定大家去哪吃 — ${radius} 米内，${group} 人，每人约 $${budget}。`,
  refreshList: '刷新列表',
  settings: '设置',
  lastKnown: '上次位置：',
  findingLocation: '正在获取你的位置…',
  tryAgain: '重试',
  geo: {
    unsupported: '此浏览器不支持定位。',
    denied: '位置权限被拒绝。',
    unavailable: '无法获取你的位置。',
    timeout: '获取位置超时。',
  },
  usingSavedLocation: '暂时无法获取最新位置，正在使用你上次的位置。',
  usingDemoLocation: '无法获取你的位置，正在使用演示位置。',
  findingPlaces: '正在查找附近的餐厅…',
  viaProxy: '已通过备用连接获取实时数据（你的网络无法直接访问）。',
  viaBackup: '主要地图数据源无法访问 — 正在显示备用数据源中的附近餐厅（结果可能不完整）。',
  usingMock: '暂时无法获取实时地图数据 — 正在显示演示餐厅，你仍然可以试转一下。',
  noneFound: (radius) => `${radius} 米内没有找到餐厅。`,
  tryBiggerRadius: '扩大搜索范围',

  spin: '开转',
  spinning: '转动中…',

  legendEmpty: '范围内暂时没有找到地点。',
  removeFromWheel: '从转盘移除',
  removeNamed: (name) => `将 ${name} 从转盘移除`,

  notIncluded: (n) => `未加入本次转盘（${n}）`,
  include: '加回',
  addBack: '重新加入转盘',

  winnerKicker: '🎉 今晚就吃这家',
  away: (distance) => `距离 ${distance}`,
  demoData: '演示数据',
  forGroup: (group, budget) => `${group} 人 · 每人约 $${budget}`,
  openInGoogleMaps: '在 Google 地图中打开',
  respinExcluding: '🔁 换一家（排除这家）',
  spinAgain: '🔄 再转一次',

  mapLabel: '附近地点地图',
  youAreHere: '你在这里',
  searchCenter: '搜索中心',
  mapKeyRejected: 'Google 地图拒绝了 API 密钥（请检查 HTTP 引荐来源限制及是否已启用结算）。',

  settingsTitle: '转盘设置',
  language: '语言',
  searchRadius: '搜索范围：',
  budgetPerPerson: '每人预算 ($)',
  groupSize: '人数',
  budgetHint: '预算和人数会和结果一起显示，方便大家参考 — 大多数地图数据没有可靠的价格信息，所以暂时不会按此筛选。',
  placeTypes: '地点类型',
  maxOnWheel: '转盘最多显示：',
  wheelPicks: '转盘优先',
  sortModes: { nearest: '最近', rating: '评分最高' },
  wheelPicksHint: '附近地点超过上限时，只有这些会出现在转盘上。',
  ratingHint: '没有评分的地点会按距离排序。',
  cuisineFilter: '菜系筛选（可选）',
  cancel: '取消',
  save: '保存',

  placeTypeLabels: {
    restaurant: '餐厅',
    fast_food: '快餐',
    cafe: '咖啡馆',
    pub: '酒吧',
    food_court: '美食广场',
  },
  foodCourtStalls: (n) => `${n} 个摊位`,
};

export const TRANSLATIONS: Record<Language, Translations> = { en, zh };

/** A place's name as shown in the UI (adds the stall count to merged food courts). */
export function placeName(r: Restaurant, t: Translations): string {
  return r.stallCount ? `${r.name} (${t.foodCourtStalls(r.stallCount)})` : r.name;
}

const I18nContext = createContext<Translations>(en);
export const I18nProvider = I18nContext.Provider;

export function useT(): Translations {
  return useContext(I18nContext);
}
