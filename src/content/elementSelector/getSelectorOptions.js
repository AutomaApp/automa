export default function ({ idName, tagName, className, attr, attrNames }) {
  return {
    idName: () => idName ?? true,
    tagName: () => tagName ?? true,
    className: () => className ?? true,
    attr: (name) => (attr ? attrNames.includes(name) : name === 'data-testid'),
  };
}
