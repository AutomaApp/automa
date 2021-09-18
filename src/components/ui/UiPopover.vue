<template>
  <div class="ui-popover inline-block" :class="{ hidden: to }">
    <div ref="targetEl" class="ui-popover__trigger h-full inline-block">
      <slot name="trigger" v-bind="{ isShow }"></slot>
    </div>
    <div
      ref="content"
      class="
        ui-popover__content
        bg-white
        dark:bg-gray-800
        rounded-lg
        shadow-xl
        border
      "
      :class="[padding]"
    >
      <slot v-bind="{ isShow }"></slot>
    </div>
  </div>
</template>
<script>
import { ref, onMounted, watch, shallowRef, onUnmounted } from 'vue';
import createTippy from '@/lib/tippy';

export default {
  props: {
    placement: {
      type: String,
      default: 'bottom',
    },
    trigger: {
      type: String,
      default: 'click',
    },
    padding: {
      type: String,
      default: 'p-4',
    },
    to: {
      type: [String, Object, HTMLElement],
      default: '',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    modelValue: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['show', 'trigger', 'close'],
  setup(props, { emit }) {
    const targetEl = ref(null);
    const content = ref(null);
    const isShow = ref(false);
    const instance = shallowRef(null);

    watch(
      () => props.disabled,
      (value) => {
        if (value) {
          instance.value.enable();
        } else {
          instance.value.hide();
          instance.value.disable();
        }
      }
    );
    watch(
      () => props.modelValue,
      (value) => {
        if (value === isShow.value) return;

        isShow.value = value;

        /* eslint-disable-next-line */
        value ? instance.value.show() : instance.value.hide();
      }
    );

    onMounted(() => {
      /* eslint-disable-next-line */
      const target = props.to
        ? typeof to === 'string'
          ? document.querySelector(props.to)
          : props.to
        : targetEl.value;

      instance.value = createTippy(target, {
        role: 'popover',
        theme: null,
        content: content.value,
        placement: props.placement,
        trigger: props.trigger,
        interactive: true,
        appendTo: () => document.body,
        onShow: (event) => {
          emit('show', event);
          isShow.value = true;
        },
        onHide: () => {
          emit('close');
          isShow.value = false;
        },
        onTrigger: () => emit('trigger'),
      });
    });
    onUnmounted(() => {
      instance.value.destroy();
    });

    return {
      isShow,
      content,
      targetEl,
    };
  },
};
</script>
