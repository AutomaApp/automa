<template>
  <ui-tabs
    :model-value="activeTab"
    class="mt-2"
    fill
    @change="$emit('update:activeTab', $event)"
  >
    <ui-tab value="attributes"> Attributes </ui-tab>
    <ui-tab v-if="selectElements.length > 0" value="options"> Options </ui-tab>
    <ui-tab value="blocks"> Blocks </ui-tab>
  </ui-tabs>
  <ui-tab-panels
    :model-value="activeTab"
    class="overflow-y-auto scroll"
    style="max-height: calc(100vh - 17rem)"
  >
    <ui-tab-panel value="attributes">
      <selector-element-list
        :elements="selectedElements"
        @highlight="$emit('highlight', $event)"
      >
        <template #item="{ element }">
          <div
            v-for="(value, name) in element.attributes"
            :key="name"
            class="bg-box-transparent mb-1 rounded-lg py-2 px-3"
          >
            <p
              class="text-sm text-overflow leading-tight text-gray-600"
              title="Attribute name"
            >
              {{ name }}
            </p>
            <ui-input
              :model-value="value"
              :placeholder="!value ? 'EMPTY' : null"
              :data-testid="name"
              :title="name"
              readonly
              class="w-full"
            >
              <template #prepend>
                <button
                  class="absolute ml-2"
                  @click="copySelector(name, value)"
                >
                  <v-remixicon name="riFileCopyLine" />
                </button>
              </template>
            </ui-input>
          </div>
        </template>
      </selector-element-list>
    </ui-tab-panel>
    <ui-tab-panel value="options">
      <selector-element-list
        :elements="selectElements"
        element-name="Select element options"
        @highlight="
          $emit('highlight', {
            index: $event.element.index,
            highlight: $event.highlight,
          })
        "
      >
        <template #item="{ element }">
          <div
            v-for="option in element.options"
            :key="option.name"
            class="bg-box-transparent mb-1 rounded-lg py-2 px-3"
          >
            <p
              class="text-sm text-overflow leading-tight text-gray-600"
              title="Option name"
            >
              {{ option.name }}
            </p>
            <input
              :value="option.value"
              title="Option value"
              class="text-overflow focus:ring-0 w-full bg-transparent"
              readonly
              @click="$event.target.select()"
            />
          </div>
        </template>
      </selector-element-list>
    </ui-tab-panel>
    <ui-tab-panel value="blocks">
      <selector-blocks
        :elements="selectedElements"
        :selector="elSelector"
        @execute="$emit('execute', $event)"
        @update="$emit('update')"
      />
    </ui-tab-panel>
  </ui-tab-panels>
</template>
<script setup>
import { inject } from 'vue';
import SelectorBlocks from './SelectorBlocks.vue';
import SelectorElementList from './SelectorElementList.vue';

const props = defineProps({
  activeTab: {
    type: String,
    default: '',
  },
  selectElements: {
    type: Array,
    default: () => [],
  },
  selectedElements: {
    type: Array,
    default: () => [],
  },
  elSelector: {
    type: String,
    default: '',
  },
});
defineEmits(['update:activeTab', 'execute', 'highlight', 'update']);

const rootElement = inject('rootElement');

function copySelector(name, value) {
  rootElement.shadowRoot
    .querySelector(`[data-testid="${name}"] input`)
    ?.select();
  const input = rootElement.shadowRoot.querySelector(`select#select--1`)?.value;
  if (input === 'css') {
    navigator.clipboard
      .writeText(
        `${props.selectedElements[0].tagName.toLowerCase()}[${name}="${value}"]`
      )
      .catch((error) => {
        document.execCommand('copy');
        console.error(error);
      });
  } else {
    navigator.clipboard
      .writeText(
        `//${props.selectedElements[0].tagName.toLowerCase()}[@${name}='${value}']`
      )
      .catch((error) => {
        document.execCommand('copy');
        console.error(error);
      });
  }
}
</script>
