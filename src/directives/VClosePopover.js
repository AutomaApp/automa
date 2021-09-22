import { hideAll } from 'tippy.js';

export default {
  mounted(el) {
    el.addEventListener('click', hideAll);
  },
  beforeUnmount(el) {
    el.removeEventListener('click', hideAll);
  },
};
