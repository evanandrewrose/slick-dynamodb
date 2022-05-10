// Returns true if the object is empty.
const empty = (obj: Record<any, any>) => !obj || Object.keys(obj).length == 0;

// Return undefined if the obj has no keys. Otherwise, return the object.
export const undefinedIfEmpty = (obj: Record<any, any>) =>
  empty(obj) ? undefined : obj;

// Return a new object with any undefined keys removed.
export const clean = <T>(obj: T): T => {
  const cleaned = Object.entries(obj).reduce((prev, [key, value]) => {
    if (value !== undefined) {
      (prev as any)[key] = value;
    }
    return prev;
  }, {} as T);
  return cleaned;
};
