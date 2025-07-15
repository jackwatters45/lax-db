import { createContext } from './context.js';

export namespace Log {
  const ctx = createContext<{
    tags: Record<string, unknown>;
  }>();

  export function create(tags: Record<string, unknown> = {}) {
    const result = {
      info(msg: string, extra?: Record<string, unknown>) {
        const prefix = Object.entries({
          ...use().tags,
          ...tags,
          ...extra,
        })
          .map(([key, value]) => `${key}=${value}`)
          .join(' ');
        console.log(prefix, msg);
        return result;
      },
      warn(msg: string, extra?: Record<string, unknown>) {
        const prefix = Object.entries({
          ...use().tags,
          ...tags,
          ...extra,
        })
          .map(([key, value]) => `${key}=${value}`)
          .join(' ');
        console.warn(prefix, msg);
        return result;
      },
      error(error: Error) {
        const prefix = Object.entries({
          ...use().tags,
          ...tags,
        })
          .map(([key, value]) => `${key}=${value}`)
          .join(' ');
        console.error(prefix, error);
        return result;
      },
      tag(key: string, value: string) {
        tags[key] = value;
        return result;
      },
      clone() {
        return Log.create({ ...tags });
      },
    };

    return result;
  }

  export function provide<R>(tags: Record<string, unknown>, cb: () => R) {
    const existing = use();
    return ctx.provide(
      {
        tags: {
          ...existing.tags,
          ...tags,
        },
      },
      cb,
    );
  }

  function use() {
    try {
      return ctx.use();
    } catch (_e) {
      return { tags: {} };
    }
  }
}
