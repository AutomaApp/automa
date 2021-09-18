import tippy from 'tippy.js';
import 'tippy.js/animations/shift-toward-subtle.css';

export const defaultOptions = {
  animation: 'shift-toward-subtle',
  theme: 'my-theme',
};

export default function (el, options = {}) {
  el?.setAttribute('vtooltip', '');

  const instance = tippy(el, {
    ...defaultOptions,
    ...options,
  });

  return instance;
}
