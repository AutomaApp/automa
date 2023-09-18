<template>
  <div class="flex items-center gap-2">
    <ui-select
      :model-value="data.method"
      @change="emitData({ method: $event })"
    >
      <option
        v-for="method in ['GET', 'PUT', 'POST', 'PATCH', 'DELETE']"
        :key="method"
        :value="method"
      >
        {{ method }}
      </option>
    </ui-select>
    <ui-input
      :model-value="data.url"
      placeholder="URL"
      type="url"
      class="flex-1"
      @change="emitData({ url: $event })"
    />
  </div>
  <ui-tabs v-model="activeTab" class="mt-1">
    <ui-tab value="headers">
      {{ t('workflow.blocks.webhook.tabs.headers') }}
    </ui-tab>
    <ui-tab v-if="data.method !== 'GET'" value="body">
      {{ t('workflow.blocks.webhook.tabs.body') }}
    </ui-tab>
  </ui-tabs>
  <ui-tab-panels v-model="activeTab">
    <ui-tab-panel value="headers">
      <div class="mt-4 grid grid-cols-7 justify-items-center gap-2">
        <template v-for="(header, index) in data.headers" :key="index">
          <ui-input
            v-model="header.name"
            :title="header.name"
            :placeholder="`Header ${index + 1}`"
            type="text"
            class="col-span-3"
          />
          <ui-input
            v-model="header.value"
            :title="header.value"
            placeholder="Value"
            type="text"
            class="col-span-3"
          />
          <button
            @click="
              emitData({
                headers: data.headers.filter((_, idx) => idx !== index),
              })
            "
          >
            <v-remixicon name="riCloseCircleLine" size="20" />
          </button>
        </template>
      </div>
      <ui-button
        class="mt-2"
        @click="
          emitData({ headers: [...data.headers, { name: '', value: '' }] })
        "
      >
        <span> {{ t('workflow.blocks.webhook.buttons.header') }} </span>
      </ui-button>
    </ui-tab-panel>
    <ui-tab-panel value="body" class="mt-4">
      <shared-codemirror
        :model-value="data.body"
        lang="json"
        class="h-full w-full"
        @change="emitData({ body: $event })"
      />
    </ui-tab-panel>
  </ui-tab-panels>
</template>
<script setup>
import { useI18n } from 'vue-i18n';
import { defineAsyncComponent, shallowRef } from 'vue';

const SharedCodemirror = defineAsyncComponent(() =>
  import('@/components/newtab/shared/SharedCodemirror.vue')
);

defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const { t } = useI18n();

const activeTab = shallowRef('headers');

function emitData(data) {
  emit('update:data', data);
}
</script>
