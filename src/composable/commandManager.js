import { shallowRef, computed } from 'vue';

export function useCommandManager({ maxHistory = 100 } = {}) {
  const position = shallowRef(0);
  let history = [null];

  const state = computed(() => ({
    position: position.value,
    historyLen: history.length,
    canUndo: position.value > 0,
    canRedo: position.value < history.length - 1,
  }));

  return {
    state,
    add(command) {
      if (position.value < history.length - 1) {
        history = history.slice(0, position.value + 1);
      }
      if (history.length > maxHistory) {
        history.shift();
      }

      history.push(command);
      position.value += 1;
    },
    undo() {
      if (position.value > 0) {
        history[position.value].undo();
        position.value -= 1;
      }
    },
    redo() {
      if (position.value < history.length - 1) {
        position.value += 1;
        history[position.value].execute();
      }
    },
  };
}
