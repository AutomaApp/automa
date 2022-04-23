<template>
  <ui-popover
    :id="componentId"
    v-model="state.showPopover"
    :class="{ block }"
    :padding="`p-2 max-h-56 overflow-auto scroll ${componentId}`"
    trigger-width
    trigger="manual"
    class="ui-autocomplete"
  >
    <template #trigger>
      <slot />
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
import {
  computed,
  onMounted,
  onBeforeUnmount,
  shallowReactive,
  watch,
} from 'vue';
import { useComponentId } from '@/composable/componentId';
import { debounce } from '@/utils/helper';

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  items: {
    type: [Array, Object],
    default: () => [],
  },
  itemKey: {
    type: String,
    default: '',
  },
  triggerChar: {
    type: Array,
    default: () => [],
  },
  block: {
    type: Boolean,
    default: false,
  },
  hideEmpty: {
    type: Boolean,
    default: false,
  },
  customFilter: {
    type: Function,
    default: null,
  },
  replaceAfter: {
    type: [String, Array],
    default: null,
  },
});
const emit = defineEmits(['update:modelValue', 'change', 'search']);

let input = null;
const componentId = useComponentId('autocomplete');

const state = shallowReactive({
  charIndex: -1,
  searchText: '',
  activeIndex: -1,
  showPopover: false,
  inputChanged: false,
});

const getItem = (item) => item[props.itemLabel] || item;

const filteredItems = computed(() => {
  if (!state.showPopover) return [];

  const triggerChar = props.triggerChar.length > 0;
  const searchText = (
    triggerChar ? state.searchText : props.modelValue
  ).toLocaleLowerCase();

  const defaultFilter = ({ item, text }) => {
    return getItem(item)?.toLocaleLowerCase().includes(text);
  };
  const filterFunction = props.customFilter || defaultFilter;

  return props.items.filter(
    (item, index) =>
      !state.inputChanged || filterFunction({ item, index, text: searchText })
  );
});

function getLastKeyBeforeCaret(caretIndex) {
  const getPosition = (val, index) => ({
    index,
    charIndex: input.value.lastIndexOf(val, caretIndex - 1),
  });
  const [charData] = props.triggerChar
    .map(getPosition)
    .sort((a, b) => b.charIndex - a.charIndex);

  if (charData.index > 0) return -1;

  return charData.charIndex;
}
function getSearchText(caretIndex, charIndex) {
  if (charIndex !== -1) {
    const charsLength = props.triggerChar.length;
    const text = input.value.substring(charIndex + charsLength, caretIndex);

    if (!/\s/.test(text)) {
      return text;
    }
  }

  return null;
}
function showPopover() {
  if (props.triggerChar.length < 1) {
    state.showPopover = true;
    return;
  }

  const { selectionStart } = input;

  if (selectionStart >= 0) {
    const charIndex = getLastKeyBeforeCaret(selectionStart);
    const text = getSearchText(selectionStart, charIndex);

    emit('search', text);

    if (charIndex >= 0 && text) {
      state.inputChanged = true;
      state.showPopover = true;
      state.searchText = text;
      state.charIndex = charIndex;

      return;
    }
  }

  state.charIndex = -1;
  state.searchText = '';
  state.showPopover = false;
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
  state.inputChanged = true;

  emit('change', value);
  emit('update:modelValue', value);

  input.value = value;
  input.dispatchEvent(new Event('input'));
}
function selectItem(itemIndex) {
  let selectedItem = filteredItems.value[itemIndex];

  if (!selectedItem) return;

  selectedItem = getItem(selectedItem);

  let caretPosition;
  const isTriggerChar = state.charIndex >= 0 && state.searchText;

  if (isTriggerChar) {
    const val = input.value;
    const index = state.charIndex;
    const charLength = props.triggerChar[0].length;
    const lastSearchIndex = state.searchText.length + index + charLength;

    let charLastIndex = 0;

    if (props.replaceAfter) {
      const lastChars = Array.isArray(props.replaceAfter)
        ? props.replaceAfter
        : [props.replaceAfter];
      lastChars.forEach((char) => {
        const searchText = val.slice(0, lastSearchIndex);
        const lastIndex = searchText.lastIndexOf(char);

        if (lastIndex > charLastIndex && lastIndex > index) {
          charLastIndex = lastIndex - 1;
        }
      });
    }

    caretPosition = index + charLength + selectedItem.length + charLastIndex;
    selectedItem =
      val.slice(0, index + charLength + charLastIndex) +
      selectedItem +
      val.slice(lastSearchIndex, val.length);
  }

  updateValue(selectedItem);

  if (isTriggerChar) {
    input.selectionEnd = caretPosition;
    const isNotTextarea = input.tagName !== 'TEXTAREA';

    if (isNotTextarea) {
      input.blur();
      input.focus();
    }
  }
}
function handleKeydown(event) {
  const itemsLength = filteredItems.value.length - 1;

  if (event.key === 'ArrowUp') {
    if (state.activeIndex <= 0) state.activeIndex = itemsLength;
    else state.activeIndex -= 1;

    event.preventDefault();
  } else if (event.key === 'ArrowDown') {
    if (state.activeIndex >= itemsLength) state.activeIndex = 0;
    else state.activeIndex += 1;

    event.preventDefault();
  } else if (event.key === 'Enter' && state.showPopover) {
    selectItem(state.activeIndex);

    event.preventDefault();
  } else if (event.key === 'Escape') {
    state.showPopover = false;
  }
}
function handleBlur() {
  state.showPopover = false;
}
function handleFocus() {
  if (props.triggerChar.length < 1) return;

  showPopover();
}
function attachEvents() {
  if (!input) return;

  input.addEventListener('blur', handleBlur);
  input.addEventListener('focus', handleFocus);
  input.addEventListener('input', showPopover);
  input.addEventListener('keydown', handleKeydown);
}
function detachEvents() {
  if (!input) return;

  input.removeEventListener('blur', handleBlur);
  input.removeEventListener('focus', handleFocus);
  input.removeEventListener('input', showPopover);
  input.removeEventListener('keydown', handleKeydown);
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

    if (props.hideEmpty && filteredItems.value.length === 0) {
      state.showPopover = false;
    }
  }
);

onMounted(() => {
  if (props.modelValue) {
    const activeIndex = props.items.findIndex(
      (item) => getItem(item) === props.modelValue
    );

    if (activeIndex !== -1) state.activeIndex = activeIndex;
  }

  input = document.querySelector(
    `#${componentId} input, #${componentId} textarea`
  );

  attachEvents();
});
onBeforeUnmount(() => {
  detachEvents();
});
</script>
<style>
.ui-autocomplete.block,
.ui-autocomplete.block .ui-popover__trigger {
  width: 100%;
  display: block;
}
</style>
