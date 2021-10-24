import { getCurrentInstance, onMounted, shallowRef } from 'vue';
import { createSingleton } from 'tippy.js';
import createTippy, { defaultOptions } from '@/lib/tippy';

export function useGroupTooltip(elements, options = {}) {
  const singleton = shallowRef(null);

  onMounted(() => {
    let tippyInstances = [];

    if (Array.isArray(elements)) {
      tippyInstances = elements.map((el) => el._tippy || createTippy(el));
    } else {
      const instance = getCurrentInstance();
      const ctx = instance && instance.ctx;

      tippyInstances = ctx._tooltipGroup || [];
    }

    singleton.value = createSingleton(tippyInstances, {
      ...defaultOptions,
      ...options,
      theme: 'tooltip-theme',
      placement: 'right',
      moveTransition: 'transform 0.2s ease-out',
      overrides: ['placement', 'theme'],
    });
  });

  return singleton;
}
