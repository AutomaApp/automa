<template>
  <div>
    <ui-textarea
      :model-value="data.description"
      class="w-full"
      :placeholder="t('common.description')"
      @change="updateData({ description: $event })"
    />
    <template v-if="permission.has.cookies">
      <ui-select
        :model-value="data.type"
        class="w-full mt-4"
        @change="updateData({ type: $event })"
      >
        <option v-for="type in types" :key="type" :value="type">
          {{ t(`workflow.blocks.cookie.types.${type}`) }}
        </option>
      </ui-select>
      <ui-checkbox
        v-if="data.type === 'get'"
        :model-value="data.getAll"
        class="mt-1"
        @change="updateData({ getAll: $event })"
      >
        {{ t('workflow.blocks.cookie.types.getAll') }}
      </ui-checkbox>
      <ui-input
        :model-value="data.url"
        class="mt-2 w-full"
        type="url"
        label="URL"
        placeholder="https://example.com/"
        @change="updateData({ url: $event })"
      />
      <ui-input
        :model-value="data.name"
        :label="`Name ${isOptional(isGetOrSet)}`"
        class="mt-2 w-full"
        placeholder="site-cookie"
        @change="updateData({ name: $event })"
      />
      <ui-input
        v-if="data.type === 'set'"
        :model-value="data.value"
        label="Value (optional)"
        class="mt-2 w-full"
        placeholder="value"
        @change="updateData({ value: $event })"
      />
      <ui-input
        :model-value="data.path"
        class="mt-2 w-full"
        label="Path (optional)"
        placeholder="/"
        @change="updateData({ path: $event })"
      />
      <ui-input
        v-if="isGetOrSet"
        :model-value="data.domain"
        class="mt-2 w-full"
        label="Domain (optional)"
        placeholder=".example.com"
        @change="updateData({ domain: $event })"
      />
      <ui-input
        v-if="data.type === 'set'"
        :model-value="data.sameSite"
        class="mt-2 w-full"
        label="sameSite (optional)"
        placeholder="lax"
        @change="updateData({ sameSite: $event })"
      />
      <ui-input
        v-if="data.type === 'set'"
        :model-value="data.expirationDate"
        class="mt-2 w-full"
        label="expirationDate (seconds) (optional)"
        placeholder="3600"
        @change="updateData({ expirationDate: $event })"
      />
      <div
        v-if="data.type === 'set' || (data.type === 'get' && data.getAll)"
        class="mt-4"
      >
        <ui-checkbox
          v-if="data.type === 'set'"
          :model-value="data.httpOnly"
          class="mr-4"
          @change="updateData({ httpOnly: $event })"
        >
          httpOnly
        </ui-checkbox>
        <ui-checkbox
          :model-value="data.secure"
          @change="updateData({ secure: $event })"
        >
          secure
        </ui-checkbox>
      </div>
      <div v-if="data.type === 'get'" class="pt-4 border-t mt-4 cookie-data">
        <insert-workflow-data :data="data" variables @update="updateData" />
      </div>
    </template>
    <template v-else>
      <p class="mt-4">
        This block requires "Cookies" permission to work properly
      </p>
      <ui-button variant="accent" class="mt-2" @click="permission.request">
        {{ t('workflow.blocks.clipboard.grantPermission') }}
      </ui-button>
    </template>
  </div>
</template>
<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useHasPermissions } from '@/composable/hasPermissions';
import InsertWorkflowData from './InsertWorkflowData.vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const { t } = useI18n();
const permission = useHasPermissions(['cookies']);

const types = ['get', 'set', 'remove'];
const isOptional = (optional = false) => (optional ? '(optional)' : '');

const isGetOrSet = computed(
  () =>
    (props.data.type === 'get' && props.data.getAll) ||
    props.data.type === 'set'
);

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
</script>
<style>
.cookie-data .block-variable {
  margin-top: 0;
}
</style>
