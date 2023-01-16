<template>
  <div class="flex items-center">
    <label class="flex items-center">
      <ui-switch v-model="options.useMask" />
      <span class="ml-2"> Use input masking </span>
    </label>
    <v-remixicon
      v-tooltip="{ content: maskInfo, allowHTML: true }"
      name="riInformationLine"
      class="ml-1 text-gray-600 dark:text-gray-200"
      size="20"
    />
    <label v-if="false" class="ml-4 flex items-center">
      <ui-switch v-model="options.unmaskValue" />
      <span class="ml-2">Return unmask value</span>
    </label>
  </div>
  <div v-if="options.useMask" class="mt-2">
    <p>Masks</p>
    <div class="space-y-2">
      <div
        v-for="(mask, index) in options.masks"
        :key="index"
        class="flex items-center"
      >
        <ui-input
          v-model="options.masks[index].mask"
          placeholder="aaa-aaa-aaa"
        />
        <ui-checkbox v-model="mask.isRegex" class="ml-4">
          Is RegEx
        </ui-checkbox>
        <div class="grow" />
        <v-remixicon
          name="riDeleteBin7Line"
          class="ml-1 shrink-0 cursor-pointer"
          @click="options.masks.splice(index, 1)"
        />
      </div>
    </div>
    <template v-if="false">
      <p>Custom tokens</p>
      <div class="grid grid-cols-2 gap-4">
        <div
          v-for="(token, index) in options.customTokens"
          :key="index"
          class="flex items-center"
        >
          <ui-input
            v-model="token.symbol"
            placeholder="Symbol"
            style="width: 120px"
          />
          <ui-input
            v-model="token.regex"
            placeholder="RegEx"
            class="ml-2 flex-1"
          />
          <v-remixicon
            name="riDeleteBin7Line"
            class="ml-1 shrink-0 cursor-pointer"
            @click="options.customTokens.splice(index, 1)"
          />
        </div>
      </div>
      <ui-button class="mt-4" @click="addToken"> Add token </ui-button>
    </template>
  </div>
</template>
<script setup>
import { reactive, watch, onMounted } from 'vue';
import cloneDeep from 'lodash.clonedeep';

const props = defineProps({
  modelValue: {
    type: [Object, String],
    default: () => ({}),
  },
  defaultValue: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:modelValue']);

const maskInfo = `
Add mask to the input field
<p class="mt-2">Supported patterns</p>
<table class="tokens">
	<tbody>
		<tr>
			<td>0</td>
			<td>Any digit</td>
		</tr>
		<tr>
			<td>a</td>
			<td>Any letter</td>
		</tr>
		<tr>
			<td>*</td>
			<td>Any char</td>
		</tr>
		<tr>
			<td>[]</td>
			<td>Make input optional</td>
		</tr>
		<tr>
			<td>{}</td>
			<td>Include fixed part in unmasked value</td>
		</tr>
		<tr>
			<td>\`</td>
			<td>Prevent symbols shift back</td>
		</tr>
    <tr>
      <td>!</td>
      <td>Escape char</td>
    </tr>
	<tbody>
</table>
`;

const cloneData = cloneDeep(props.modelValue || {});
const options = reactive({
  ...(props.defaultValue || {}),
  ...cloneData,
});

function addMask() {
  options.masks.push({
    isRegex: false,
    mask: '',
    lazy: false,
  });
}
function addToken() {
  options.customTokens.push({
    symbol: '',
    regex: '',
  });
}

watch(
  options,
  () => {
    emit('update:modelValue', options);
  },
  { deep: true }
);

onMounted(() => {
  if (options.masks.length === 0) {
    addMask();
  }
});
</script>
