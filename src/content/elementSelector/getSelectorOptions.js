export default function ({ idName, tagName, className, attr, attrNames }) {
  const attrs = attr ? attrNames.split(',').map((item) => item.trim()) : false;

  return {
    idName: () => idName ?? true,
    tagName: () => tagName ?? true,
    className: () => className ?? true,
    attr: (name) => (attr ? false : attrs.includes(name)),
  };
}
