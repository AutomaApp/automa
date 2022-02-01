<template>
  <ui-modal
    :model-value="state.show"
    content-class="max-w-sm"
    @close="state.show = false"
  >
    <template #header>
      <h3 class="font-semibold">{{ state.options.title }}</h3>
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
      :type="
        state.options.inputType === 'password' && state.showPassword
          ? 'text'
          : state.options.inputType
      "
      class="w-full"
    >
      <template v-if="state.options.inputType === 'password'" #append>
        <v-remixicon
          :name="state.showPassword ? 'riEyeOffLine' : 'riEyeLine'"
          class="absolute right-2"
          @click="state.showPassword = !state.showPassword"
        />
      </template>
    </ui-input>
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
import { useI18n } from 'vue-i18n';
import emitter from '@/lib/mitt';

export default {
  setup() {
    const { t } = useI18n();

    const defaultOptions = {
      html: false,
      body: '',
      title: '',
      placeholder: '',
      label: '',
      inputType: 'text',
      okText: t('common.confirm'),
      okVariant: 'accent',
      cancelText: t('common.cancel'),
      onConfirm: null,
      onCancel: null,
    };
    const state = reactive({
      show: false,
      type: '',
      input: '',
      showPassword: false,
      options: defaultOptions,
    });

    emitter.on('show-dialog', ({ type, options }) => {
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
        state.showPassword = false;
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
