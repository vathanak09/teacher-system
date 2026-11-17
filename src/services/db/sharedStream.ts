export interface SharedStream<V> {
  subscribers: Set<(data: V) => void>;
  unsubscribeSource: (() => void) | null;
  idleTimer: ReturnType<typeof setTimeout> | null;
  hasData: boolean;
  latestData: V;
}

export const STREAM_KEEP_ALIVE_MS = 5 * 60 * 1000;

export function cloneStreamPayload<V>(val: V): V {
  if (Array.isArray(val)) return ([...val] as unknown) as V;
  if (val && typeof val === 'object') return ({ ...val } as unknown) as V;
  return val;
}

/**
 * Multiplexes real-time database listeners across components and page transitions.
 * Immediately delivers the live snapshot when switching tabs while keeping
 * server push updates and local latency compensation active.
 */
export function subscribeToSharedStream<V>(
  streamMap: Map<string, SharedStream<V>>,
  key: string,
  initialValue: V,
  callback: (data: V) => void,
  label: string,
  startListener: (
    onNext: (value: V) => void,
    onError: (err: unknown) => void
  ) => () => void
): () => void {
  let stream = streamMap.get(key);
  if (!stream) {
    stream = {
      subscribers: new Set(),
      unsubscribeSource: null,
      idleTimer: null,
      hasData: false,
      latestData: initialValue,
    };
    streamMap.set(key, stream);
  }

  if (stream.idleTimer) {
    clearTimeout(stream.idleTimer);
    stream.idleTimer = null;
  }

  stream.subscribers.add(callback);

  if (stream.hasData) {
    callback(cloneStreamPayload(stream.latestData));
  }

  if (!stream.unsubscribeSource) {
    stream.unsubscribeSource = startListener(
      (nextValue) => {
        stream!.hasData = true;
        stream!.latestData = nextValue;
        stream!.subscribers.forEach((sub) => {
          try {
            sub(cloneStreamPayload(nextValue));
          } catch (err) {
            console.error(`[${label}] Subscriber error:`, err);
          }
        });
      },
      (err) => {
        console.error(`[${label}] Listener error (${key}):`, err);
        if (stream?.unsubscribeSource) {
          try {
            stream.unsubscribeSource();
          } catch {}
          stream.unsubscribeSource = null;
        }
        if (stream) {
          stream.hasData = false;
        }
      }
    );
  }

  let isSubscribed = true;
  return () => {
    if (!isSubscribed) return;
    isSubscribed = false;
    stream!.subscribers.delete(callback);

    if (stream!.subscribers.size === 0 && !stream!.idleTimer) {
      stream!.idleTimer = setTimeout(() => {
        stream!.idleTimer = null;
        if (stream!.subscribers.size === 0) {
          if (stream!.unsubscribeSource) {
            try {
              stream!.unsubscribeSource();
            } catch {}
            stream!.unsubscribeSource = null;
          }
          stream!.hasData = false;
          streamMap.delete(key);
        }
      }, STREAM_KEEP_ALIVE_MS);
    }
  };
}
