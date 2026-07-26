const STORE_KEY = "komikstream_progress";
const MAX_ENTRIES_GUEST = 100;

export interface GuestProgress {
  chapterId: string;
  page: number;
  updatedAt: string;
}

function load(): GuestProgress[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getChapterPage(chapterId: string): number {
  return load().find((entry) => entry.chapterId === chapterId)?.page ?? 0;
}

export function setChapterPage(chapterId: string, page: number) {
  const list = load().filter((entry) => entry.chapterId !== chapterId);
  list.push({ chapterId, page, updatedAt: new Date().toISOString() });
  localStorage.setItem(STORE_KEY, JSON.stringify(list.slice(-MAX_ENTRIES_GUEST)));
}
