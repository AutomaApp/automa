<template>
  <div class="flex items-center">
    <ui-popover v-tooltip:bottom="t('packages.icon')" class="mr-2">
      <template #trigger>
        <img
          v-if="state.icon.startsWith('http')"
          :src="state.icon"
          width="38px"
          height="38px"
          class="rounded-lg"
        />
        <span
          v-else
          icon
          class="bg-box-transparent inline-block rounded-lg p-2"
        >
          <v-remixicon :name="state.icon || 'mdiPackageVariantClosed'" />
        </span>
      </template>
      <div class="w-64">
        <p>{{ t('packages.icon') }}</p>
        <div class="mt-4 grid grid-cols-6 gap-2">
          <div v-for="icon in icons" :key="icon">
            <span
              :class="{ 'bg-box-transparent': icon === state.icon }"
              class="hoverable inline-block cursor-pointer rounded-lg p-2"
              @click="state.icon = icon"
            >
              <v-remixicon :name="icon" />
            </span>
          </div>
        </div>
        <ui-input
          :model-value="state.icon.startsWith('http') ? state.icon : ''"
          type="url"
          placeholder="http://example.com/img.png"
          label="Icon URL"
          class="mt-2 w-full"
          @change="updatePackageIcon"
        />
      </div>
    </ui-popover>
    <ui-input
      v-model="state.name"
      :placeholder="t('common.name')"
      autofocus
      class="w-full"
      @keyup.enter="$emit('add')"
    />
  </div>
  <ui-textarea
    v-model="state.description"
    :label="t('common.description')"
    placeholder="Description..."
    class="mt-4 w-full"
  />
  <div class="mt-6 flex items-center justify-end space-x-4">
    <ui-button @click="$emit('cancel')">
      {{ t('common.cancel') }}
    </ui-button>
    <ui-button variant="accent" class="w-20" @click="$emit('add')">
      {{ t('common.add') }}
    </ui-button>
  </div>
</template>
<script setup>
import { reactive, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update', 'add', 'cancel']);

const icons = [
  'mdiPackageVariantClosed',
  'riGlobalLine',
  'riFileTextLine',
  'riEqualizerLine',
  'riTimerLine',
  'riCalendarLine',
  'riFlashlightLine',
  'riLightbulbFlashLine',
  'riDatabase2Line',
  'riWindowLine',
  'riCursorLine',
  'riDownloadLine',
  'riCommandLine',
];

const { t } = useI18n();

const state = reactive({
  name: '',
  icon: '',
  description: '',
});

function updatePackageIcon(value) {
  if (!value.startsWith('http')) return;

  state.icon = value.slice(0, 1024);
}

watch(
  state,
  () => {
    emit('update', state);
  },
  { deep: true }
);

onMounted(() => {
  Object.assign(state, props.data);
});
</script>
