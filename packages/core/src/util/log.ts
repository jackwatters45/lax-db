import { createContext } from '../context';

export namespace Log {
  const ctx = createContext<{
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    tags: Record<string, any>;
  }>();

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  export function create(tags?: Record<string, any>) {
    // biome-ignore lint/style/noParameterAssign: <explanation>
    tags = tags || {};

    const result = {
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      info(msg: string, extra?: Record<string, any>) {
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
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      warn(msg: string, extra?: Record<string, any>) {
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

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  export function provide<R>(tags: Record<string, any>, cb: () => R) {
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
    } catch (e) {
      return { tags: {} };
    }
  }
}
