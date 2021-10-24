import createTippy from '@/lib/tippy';

function getContent(content) {
  if (typeof content === 'string') {
    return { content };
  }

  if (typeof content === 'object' && content !== null) {
    return content;
  }

  return {};
}

export default {
  mounted(el, { value, arg = 'top', instance, modifiers }) {
    const content = getContent(value);

    const tooltip = createTippy(el, {
      ...content,
      theme: 'tooltip-theme',
      placement: arg,
    });

    if (modifiers.group) {
      if (!Array.isArray(instance._tooltipGroup)) instance._tooltipGroup = [];

      instance._tooltipGroup.push(tooltip);
    }
  },
  updated(el, { value, arg = 'top' }) {
    const content = getContent(value);

    el._tippy.setProps({
      placement: arg,
      ...content,
    });
  },
};
