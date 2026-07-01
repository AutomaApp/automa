<template>
  <div>
    <ui-textarea
      :model-value="data.description"
      :placeholder="t('common.description')"
      class="w-full"
      @change="updateData({ description: $event })"
    />
    <edit-autocomplete v-if="!data.activeTab" class="mt-2">
      <label for="new-tab-url" class="input-label">
        {{ t('workflow.blocks.new-tab.url') }}
      </label>
      <div class="flex items-center gap-2 w-full">
        <ui-select v-model="state.protocol" class="w-28">
          <option
            v-for="proto in PROTOCOLS"
            :key="proto.value"
            :value="proto.value"
          >
            {{ proto.label }}
          </option>
        </ui-select>
        <ui-input
          id="new-tab-url"
          v-model="state.urlPath"
          placeholder="example.com/"
          class="flex-1"
          autocomplete="off"
          type="text"
        />
      </div>
    </edit-autocomplete>
    <ui-checkbox
      :model-value="data.updatePrevTab"
      class="mt-2 leading-tight"
      :title="t('workflow.blocks.new-tab.updatePrevTab.title')"
      @change="updateData({ updatePrevTab: $event })"
    >
      {{ t('workflow.blocks.new-tab.updatePrevTab.text') }}
    </ui-checkbox>
    <ui-checkbox
      :model-value="data.waitTabLoaded"
      class="mt-2 leading-tight"
      :title="t('workflow.blocks.new-tab.waitTabLoaded')"
      @change="updateData({ waitTabLoaded: $event })"
    >
      {{ t('workflow.blocks.new-tab.waitTabLoaded') }}
    </ui-checkbox>
    <ui-checkbox
      :model-value="data.active"
      class="my-2"
      @change="updateData({ active: $event })"
    >
      {{ t('workflow.blocks.new-tab.activeTab') }}
    </ui-checkbox>
    <template v-if="browserType === 'chrome'">
      <ui-checkbox
        :model-value="data.inGroup"
        @change="updateData({ inGroup: $event })"
      >
        {{ t('workflow.blocks.new-tab.tabToGroup') }}
      </ui-checkbox>
      <ui-checkbox
        :model-value="data.customUserAgent"
        block
        class="mt-2"
        @change="updateData({ customUserAgent: $event })"
      >
        {{ t('workflow.blocks.new-tab.customUserAgent') }}
      </ui-checkbox>
    </template>
    <ui-input
      v-if="data.customUserAgent"
      :model-value="data.userAgent"
      placeholder="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      class="mt-1 w-full"
      @change="updateData({ userAgent: $event })"
    />
    <div class="mt-4">
      <p>{{ t('workflow.blocks.new-tab.tab-zoom') }}</p>
      <vue-slider
        :min="0.25"
        :max="4.5"
        :interval="0.25"
        :model-value="data.tabZoom || 1"
        @change="updateData({ tabZoom: $event })"
      />
    </div>
  </div>
</template>
<script setup>
import UiInput from '@/components/ui/UiInput.vue';
import UiSelect from '@/components/ui/UiSelect.vue';
import { reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import VueSlider from 'vue-slider-component';
import 'vue-slider-component/theme/default.css';
import EditAutocomplete from './EditAutocomplete.vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const { t } = useI18n();
const browserType = BROWSER_TYPE;

const PROTOCOLS = [
  { value: 'https://', label: 'HTTPS' },
  { value: 'http://', label: 'HTTP' },
  { value: 'ftp://', label: 'FTP' },
  { value: 'file://', label: 'FILE' },
  { value: 'mailto:', label: 'MAILTO' },
];

function isTemplateVariable(str) {
  if (!str || typeof str !== 'string') return false;
  return str.includes('{{');
}

function parseUrl(url) {
  if (!url || typeof url !== 'string') {
    return { protocol: 'https://', path: '' };
  }

  if (isTemplateVariable(url)) {
    return { protocol: 'https://', path: url };
  }

  const protocolMatch = url.match(/^(https?:|ftp:|file:|mailto:)(\/\/)?/i);
  if (protocolMatch) {
    const protocolBase = protocolMatch[1].toLowerCase();
    const protocol = protocolBase + (protocolBase === 'mailto:' ? '' : '//');
    const path = url.slice(protocolMatch[0].length);
    return { protocol, path };
  }

  return { protocol: 'https://', path: url };
}

function cleanProtocol(path) {
  if (!path || typeof path !== 'string') return path;
  return path.replace(/^(https?:|ftp:|file:|mailto:)(\/\/)?/i, '');
}

const state = reactive({
  protocol: 'https://',
  urlPath: '',
});

const parsed = parseUrl(props.data.url || '');
state.protocol = parsed.protocol;
state.urlPath = parsed.path;

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}

watch(
  () => [state.protocol, state.urlPath],
  ([newProtocol, newPath]) => {
    const cleanPath = cleanProtocol(newPath || '');
    const fullUrl = cleanPath ? newProtocol + cleanPath : newProtocol;
    updateData({ url: fullUrl });
  },
  { deep: true }
);

watch(
  () => props.data.url,
  (newUrl) => {
    const urlData = parseUrl(newUrl || '');
    if (urlData.protocol !== state.protocol || urlData.path !== state.urlPath) {
      state.protocol = urlData.protocol;
      state.urlPath = urlData.path;
    }
  }
);
</script>
