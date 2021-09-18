export default {
  mounted(el, { value = true }) {
    if (value) el.focus();
  },
};
