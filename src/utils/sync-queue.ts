const QUEUE_KEY = "xpenses_offline_queue";

export interface QueuedAction {
  id: string; // Unique ID for this queued action
  action: "POST" | "PUT" | "DELETE";
  payload: Record<string, unknown>;
}

export function getQueuedActions(): QueuedAction[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error("Failed to parse queued actions:", err);
    return [];
  }
}

export function saveQueuedActions(actions: QueuedAction[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(actions));
  } catch (err) {
    console.error("Failed to save queued actions:", err);
  }
}

export function queueAction(action: "POST" | "PUT" | "DELETE", payload: Record<string, unknown>): void {
  const actions = getQueuedActions();
  const newAction: QueuedAction = {
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    action,
    payload,
  };
  actions.push(newAction);
  saveQueuedActions(actions);
}

export async function processSyncQueue(): Promise<boolean> {
  const actions = getQueuedActions();
  if (actions.length === 0) return true;

  console.log(`Processing sync queue: syncing ${actions.length} offline operations...`);
  
  const remainingActions: QueuedAction[] = [];
  let allSynced = true;

  for (const item of actions) {
    try {
      const response = await fetch("/api/expenses", {
        method: item.action,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.payload),
      });

      if (!response.ok) {
        if (response.status >= 400 && response.status < 500) {
          console.error(`Permanent sync failure (Status ${response.status}) for action:`, item);
          continue;
        }
        throw new Error(`Sync failed with status ${response.status}`);
      }
    } catch (err) {
      console.error("Failed to sync queued action (will retry later):", item, err);
      remainingActions.push(item);
      allSynced = false;
    }
  }

  saveQueuedActions(remainingActions);
  return allSynced;
}
