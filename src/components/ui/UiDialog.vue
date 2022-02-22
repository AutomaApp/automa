<template>
  <ui-modal
    :model-value="state.show"
    content-class="max-w-sm"
    @close="state.show = false"
  >
    <template #header>
      <h3 class="font-semibold">{{ state.options.title }}</h3>
    </template>
    <slot
      v-if="state.options.custom"
      v-bind="{ options: state.options }"
      :name="state.type"
    />
    <template v-else>
      <p class="text-gray-600 dark:text-gray-200 leading-tight">
        {{ state.options.body }}
      </p>
      <ui-input
        v-if="state.type === 'prompt'"
        v-model="state.input"
        autofocus
        :disabled="state.loading"
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
          :loading="state.loading"
          :variant="state.options.okVariant"
          @click="fireCallback('onConfirm')"
        >
          {{ state.options.okText }}
        </ui-button>
      </div>
    </template>
  </ui-modal>
</template>
<script>
import { reactive, watch, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import defu from 'defu';
import { throttle } from '@/utils/helper';
import emitter from '@/lib/mitt';

export default {
  setup() {
    const { t } = useI18n();

    const defaultOptions = {
      body: '',
      title: '',
      label: '',
      html: false,
      onCancel: null,
      onConfirm: null,
      placeholder: '',
      inputType: 'text',
      showLoading: false,
      okVariant: 'accent',
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
    };
    const state = reactive({
      type: '',
      input: '',
      show: false,
      loading: false,
      showPassword: false,
      options: defaultOptions,
    });

    function handleShowDialog({ type, options }) {
      state.type = type;
      state.input = options?.inputValue ?? '';
      state.options = defu(options, defaultOptions);

      state.show = true;
    }
    function destroy() {
      state.input = '';
      state.show = false;
      state.showPassword = false;
      state.options = defaultOptions;
    }
    const fireCallback = throttle((type) => {
      const callback = state.options[type];
      const param = state.type === 'prompt' ? state.input : true;

      if (callback) {
        const isAsync = state.options.async;
        if (isAsync) state.loading = true;

        const cbReturn = callback(param) ?? true;

        if (typeof cbReturn === 'boolean') {
          if (cbReturn) destroy();
          state.loading = false;

          return;
        }
        if (isAsync && cbReturn?.then) {
          cbReturn.then((value) => {
            if (value) destroy();
            state.loading = false;
          });

          return;
        }

        destroy();
      } else {
        destroy();
      }
    }, 200);
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

    emitter.on('show-dialog', handleShowDialog);

    onUnmounted(() => {
      emitter.off('show-dialog', handleShowDialog);
    });

    return {
      state,
      fireCallback,
    };
  },
};
</script>
