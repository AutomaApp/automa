import emitter from '@/lib/mitt';

export function useDialog() {
  const emitDialog = (type, options = {}) => {
    emitter.emit('show-dialog', { type, options });
  };

  function confirm(options = {}) {
    emitDialog('confirm', options);
  }
  function prompt(options = {}) {
    emitDialog('prompt', options);
  }
  function custom(type, options = {}) {
    emitDialog(type, { ...options, custom: true });
  }

  return {
    custom,
    prompt,
    confirm,
  };
}
