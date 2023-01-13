<template>
  <div>
    <ui-textarea
      :model-value="data.description"
      :placeholder="t('common.description')"
      class="mb-2 w-full"
      @change="updateData({ description: $event })"
    />
    <template v-if="permission.has.notifications">
      <edit-autocomplete class="mb-2">
        <ui-input
          :model-value="data.title"
          :label="t('workflow.blocks.notification.title')"
          placeholder="Hello world!"
          class="w-full"
          @change="updateData({ title: $event })"
        />
      </edit-autocomplete>
      <label class="input-label" for="notification-message">
        {{ t('workflow.blocks.notification.message') }}
      </label>
      <edit-autocomplete>
        <ui-textarea
          id="notification-message"
          :model-value="data.message"
          placeholder="Notification message"
          class="w-full"
          @change="updateData({ message: $event })"
        />
      </edit-autocomplete>
      <edit-autocomplete
        v-for="type in ['iconUrl', 'imageUrl']"
        :key="type"
        class="mt-2"
      >
        <ui-input
          :model-value="data[type]"
          :label="t(`workflow.blocks.notification.${type}`)"
          class="w-full"
          placeholder="https://example.com/image.png"
          @change="updateData({ [type]: $event })"
        />
      </edit-autocomplete>
    </template>
    <template v-else>
      <p class="mt-4">
        {{ t('workflow.blocks.base.noPermission') }}
      </p>
      <ui-button
        variant="accent"
        class="mt-2"
        @click="permission.request(true)"
      >
        {{ t('workflow.blocks.base.grantPermission') }}
      </ui-button>
    </template>
  </div>
</template>
<script setup>
import { useI18n } from 'vue-i18n';
import { useHasPermissions } from '@/composable/hasPermissions';
import EditAutocomplete from './EditAutocomplete.vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const { t } = useI18n();
const permission = useHasPermissions(['notifications']);

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
</script>
