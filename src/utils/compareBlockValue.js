const handlers = {
  '==': (a, b) => a === b,
  '!=': (a, b) => a !== b,
  '>': (a, b) => a > b,
  '>=': (a, b) => a >= b,
  '<': (a, b) => a < b,
  '<=': (a, b) => a <= b,
  '()': (a, b) => a?.includes(b) ?? false,
};

export default function (type, valueA, valueB) {
  const handler = handlers[type];

  if (handler) return handler(valueA, valueB);

  return false;
}
