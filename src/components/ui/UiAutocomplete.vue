<template>
  <ui-popover
    v-model="state.showPopover"
    trigger-width
    trigger="manual"
    :padding="`p-2 max-h-56 overflow-auto scroll ${componentId}`"
  >
    <template #trigger>
      <ui-input
        v-bind="{ modelValue, placeholder, label, prependIcon }"
        autocomplete="off"
        @focus="state.showPopover = true"
        @blur="state.showPopover = false"
        @keydown="handleKeydown"
        @change="updateValue"
        @keyup.enter="selectItem(state.activeIndex)"
        @keyup.esc="state.showPopover = false"
      />
    </template>
    <p v-if="filteredItems.length === 0" class="text-center">No data to show</p>
    <ui-list v-else class="space-y-1">
      <ui-list-item
        v-for="(item, index) in filteredItems"
        :id="`list-item-${index}`"
        :key="getItem(item)"
        :class="{ 'bg-box-transparent': state.activeIndex === index }"
        class="cursor-pointer"
        @mousedown="selectItem(index)"
        @mouseenter="state.activeIndex = index"
      >
        <slot name="item" :item="item">
          {{ getItem(item) }}
        </slot>
      </ui-list-item>
    </ui-list>
  </ui-popover>
</template>
<script setup>
import { computed, onMounted, shallowReactive, watch } from 'vue';
import { useComponentId } from '@/composable/componentId';
import { debounce } from '@/utils/helper';

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  items: {
    type: Array,
    default: () => [],
  },
  itemKey: {
    type: String,
    default: '',
  },
  label: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: '',
  },
  prependIcon: {
    type: String,
    default: '',
  },
});
const emit = defineEmits(['update:modelValue', 'change']);

const componentId = useComponentId('autocomplete');

const state = shallowReactive({
  activeIndex: -1,
  showPopover: false,
  inputChanged: false,
});

const getItem = (item) => item[props.itemLabel] || item;

const filteredItems = computed(() =>
  props.items.filter(
    (item) =>
      !state.inputChanged ||
      getItem(item)
        ?.toLocaleLowerCase()
        .includes(props.modelValue.toLocaleLowerCase())
  )
);

function handleKeydown(event) {
  if (!state.showPopover) state.showPopover = true;

  const itemsLength = filteredItems.value.length - 1;

  if (event.key === 'ArrowUp') {
    if (state.activeIndex <= 0) state.activeIndex = itemsLength;
    else state.activeIndex -= 1;

    event.preventDefault();
  } else if (event.key === 'ArrowDown') {
    if (state.activeIndex >= itemsLength) state.activeIndex = 0;
    else state.activeIndex += 1;

    event.preventDefault();
  }
}
function checkInView(container, element, partial = false) {
  const cTop = container.scrollTop;
  const cBottom = cTop + container.clientHeight;

  const eTop = element.offsetTop;
  const eBottom = eTop + element.clientHeight;

  const isTotal = eTop >= cTop && eBottom <= cBottom;
  const isPartial =
    partial &&
    ((eTop < cTop && eBottom > cTop) || (eBottom > cBottom && eTop < cBottom));

  return isTotal || isPartial;
}
function updateValue(value) {
  if (!state.showPopover) state.showPopover = true;

  state.inputChanged = true;

  emit('change', value);
  emit('update:modelValue', value);
}
function selectItem(index) {
  const selectedItem = filteredItems.value[index];

  if (!selectedItem) return;

  updateValue(getItem(selectedItem));
  state.showPopover = false;
}

watch(
  () => state.activeIndex,
  debounce((activeIndex) => {
    const container = document.querySelector(`.${componentId}`);
    const element = container.querySelector(`#list-item-${activeIndex}`);

    if (element && !checkInView(container, element)) {
      element.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, 100)
);
watch(
  () => state.showPopover,
  (value) => {
    if (!value) state.inputChanged = false;
  }
);

onMounted(() => {
  if (props.modelValue) {
    const activeIndex = props.items(
      (item) => getItem(item) === props.modelValue
    );

    if (activeIndex !== -1) state.activeIndex = activeIndex;
  }
});
</script>
