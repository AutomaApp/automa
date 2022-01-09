import emitter from '@/lib/mitt';

export function useDialog() {
  function confirm(options) {
    emitter.emit('show-dialog', { type: 'confirm', options });
  }

  function prompt(options) {
    emitter.emit('show-dialog', { type: 'prompt', options });
  }

  return {
    prompt,
    confirm,
  };
}
