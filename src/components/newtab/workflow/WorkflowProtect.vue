<template>
  <div>
    <form
      class="mb-4 flex items-center w-full"
      @submit.prevent="protectWorkflow"
    >
      <ui-input
        v-model="state.password"
        :placeholder="t('common.password')"
        :type="state.showPassword ? 'text' : 'password'"
        input-class="pr-10"
        autofocus
        class="flex-1 mr-6"
      >
        <template #append>
          <v-remixicon
            :name="state.showPassword ? 'riEyeOffLine' : 'riEyeLine'"
            class="absolute right-2"
            @click="state.showPassword = !state.showPassword"
          />
        </template>
      </ui-input>
      <ui-button variant="accent">
        {{ t('workflow.protect.button') }}
      </ui-button>
    </form>
    <p>
      {{ t('workflow.protect.note') }}
    </p>
  </div>
</template>
<script setup>
import { shallowReactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { nanoid } from 'nanoid';
import AES from 'crypto-js/aes';
import hmacSHA256 from 'crypto-js/hmac-sha256';
import getPassKey from '@/utils/get-pass-key';

const props = defineProps({
  workflow: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update', 'close']);

const { t } = useI18n();

const state = shallowReactive({
  password: '',
  showPassword: false,
});

async function protectWorkflow() {
  const key = getPassKey(nanoid());
  const encryptedPass = AES.encrypt(state.password, key).toString();
  const hmac = hmacSHA256(encryptedPass, state.password).toString();

  const { drawflow } = props.workflow;
  const flow =
    typeof drawflow === 'string' ? drawflow : JSON.stringify(drawflow);

  emit('update', {
    isProtected: true,
    pass: hmac + encryptedPass,
    drawflow: AES.encrypt(flow, state.password).toString(),
  });
  emit('close');
}
</script>
