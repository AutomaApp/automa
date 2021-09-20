let id = 0;

export function useComponentId(prefix) {
  id += 1;

  if (!prefix) return id;

  return `${prefix}--${id}`;
}
