<template>
  <ui-modal
    :model-value="state.show"
    content-class="max-w-sm"
    @close="state.show = false"
  >
    <template #header>
      <h3 class="font-semibold text-lg">{{ state.options.title }}</h3>
    </template>
    <p class="text-gray-600 dark:text-gray-200 leading-tight">
      {{ state.options.body }}
    </p>
    <ui-input
      v-if="state.type === 'prompt'"
      v-model="state.input"
      autofocus
      :placeholder="state.options.placeholder"
      :label="state.options.label"
      class="w-full"
    ></ui-input>
    <div class="mt-8 flex space-x-2">
      <ui-button class="w-6/12" @click="fireCallback('onCancel')">
        {{ state.options.cancelText }}
      </ui-button>
      <ui-button
        class="w-6/12"
        :variant="state.options.okVariant"
        @click="fireCallback('onConfirm')"
      >
        {{ state.options.okText }}
      </ui-button>
    </div>
  </ui-modal>
</template>
<script>
import { reactive, watch } from 'vue';
import emitter from 'tiny-emitter/instance';

const defaultOptions = {
  html: false,
  body: '',
  title: '',
  placeholder: '',
  label: '',
  okText: 'Confirm',
  okVariant: 'accent',
  cancelText: 'Cancel',
  onConfirm: null,
  onCancel: null,
};

export default {
  setup() {
    const state = reactive({
      show: false,
      type: '',
      input: '',
      options: defaultOptions,
    });

    emitter.on('show-dialog', (type, options) => {
      state.type = type;
      state.input = options?.inputValue ?? '';
      state.options = {
        ...defaultOptions,
        ...options,
      };

      state.show = true;
    });

    function fireCallback(type) {
      const callback = state.options[type];
      const param = state.type === 'prompt' ? state.input : true;
      let hide = true;

      if (callback) {
        const cbReturn = callback(param);

        if (typeof cbReturn === 'boolean') hide = cbReturn;
      }

      if (hide) {
        state.options = defaultOptions;
        state.show = false;
        state.input = '';
      }
    }
    function keyupHandler({ code }) {
      if (code === 'Enter') {
        fireCallback('onConfirm');
      } else if (code === 'Escape') {
        fireCallback('onCancel');
      }
    }

    watch(
      () => state.show,
      (value) => {
        if (value) {
          window.addEventListener('keyup', keyupHandler);
        } else {
          window.removeEventListener('keyup', keyupHandler);
        }
      }
    );

    return {
      state,
      fireCallback,
    };
  },
};
</script>
