const STORAGE_KEY = "userActivityLog";

export const readUserActivity = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
};

export const appendUserActivity = (entry) => {
  const newEntry = {
    id:
      entry.id ||
      (typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`),
    date: entry.date || new Date().toISOString(),
    type: entry.type || "general",
    title: entry.title || "Activity",
    description: entry.description || "",
    meta: entry.meta || {},
  };

  const existing = readUserActivity();
  const updated = [newEntry, ...existing].slice(0, 200);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

export const clearUserActivity = () => {
  localStorage.removeItem(STORAGE_KEY);
};

