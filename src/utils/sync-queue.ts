const QUEUE_KEY = "xpenses_offline_queue";

export interface QueuedAction {
  id: string; // Unique ID for this queued action
  action: "POST" | "PUT" | "DELETE";
  target?: "expenses" | "pots";
  payload: Record<string, unknown>;
}

export interface SyncResult {
  allSynced: boolean;
  failedActionIds: string[];
  remainingCount: number;
}

let activeSyncPromise: Promise<SyncResult> | null = null;

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

export function queueAction(
  action: "POST" | "PUT" | "DELETE", 
  payload: Record<string, unknown>,
  target: "expenses" | "pots" = "expenses"
): string {
  const actions = getQueuedActions();
  const newAction: QueuedAction = {
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    action,
    target,
    payload,
  };
  actions.push(newAction);
  saveQueuedActions(actions);
  return newAction.id;
}

export function processSyncQueue(): Promise<SyncResult> {
  if (activeSyncPromise) return activeSyncPromise;

  activeSyncPromise = (async () => {
    let result = await processSyncQueueInternal();

    // Drain actions queued while the previous batch was being sent before
    // releasing the mutex, so rapid consecutive writes are not stranded.
    while (result.remainingCount === 0 && getQueuedActions().length > 0) {
      result = await processSyncQueueInternal();
    }

    return result;
  })().finally(() => {
    activeSyncPromise = null;
  });

  return activeSyncPromise;
}

async function processSyncQueueInternal(): Promise<SyncResult> {
  const actions = getQueuedActions();
  if (actions.length === 0) {
    return { allSynced: true, failedActionIds: [], remainingCount: 0 };
  }

  console.log(`Processing sync queue: syncing ${actions.length} offline operations...`);
  
  const remainingActions: QueuedAction[] = [];
  const failedActionIds: string[] = [];
  let allSynced = true;

  for (let index = 0; index < actions.length; index += 1) {
    const item = actions[index];
    try {
      const target = item.target || "expenses";
      const isDelete = item.action === "DELETE";
      
      let url = "/api/expenses";
      if (target === "pots") {
        url = "/api/pots";
      }

      if (isDelete && item.payload.id) {
        if (target === "pots") {
          url = `/api/pots?id=${item.payload.id}`;
        }
      }

      const fetchOptions: RequestInit = {
        method: item.action,
        headers: { "Content-Type": "application/json" },
      };

      // Only add body if it's not a GET/DELETE request with query params
      if (!isDelete || target === "expenses") {
        fetchOptions.body = JSON.stringify(item.payload);
      }

      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        if (response.status >= 400 && response.status < 500) {
          console.error(`Permanent sync failure (Status ${response.status}) for action:`, item);
          failedActionIds.push(item.id);
          allSynced = false;
          continue;
        }
        throw new Error(`Sync failed with status ${response.status}`);
      }
    } catch (err) {
      console.error("Failed to sync queued action (will retry later):", item, err);
      remainingActions.push(item, ...actions.slice(index + 1));
      allSynced = false;
      break;
    }
  }

  saveQueuedActions(remainingActions);
  return {
    allSynced,
    failedActionIds,
    remainingCount: remainingActions.length,
  };
}
