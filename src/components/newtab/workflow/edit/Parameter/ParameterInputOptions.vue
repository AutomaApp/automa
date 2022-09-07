<template>
  <div class="flex items-center">
    <label class="flex items-center">
      <ui-switch v-model="options.useMask" />
      <span class="ml-2"> Use mask </span>
    </label>
    <v-remixicon
      v-tooltip="{ content: maskInfo, allowHTML: true }"
      name="riInformationLine"
      class="ml-1 text-gray-600 dark:text-gray-200"
      size="20"
    />
  </div>
  <div v-if="options.useMask" class="mt-4">
    <p>Masks</p>
    <div class="grid grid-cols-3 gap-4">
      <div
        v-for="(mask, index) in options.masks"
        :key="index"
        class="flex items-center"
      >
        <ui-input v-model="options.masks[index]" placeholder="###-###-###" />
        <v-remixicon
          name="riDeleteBin7Line"
          class="cursor-pointer flex-shrink-0 ml-1"
          @click="options.masks.splice(index, 1)"
        />
      </div>
    </div>
    <ui-button class="mt-4" @click="options.masks.push('')">
      Add mask
    </ui-button>
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
            class="flex-1 ml-2"
          />
          <v-remixicon
            name="riDeleteBin7Line"
            class="cursor-pointer flex-shrink-0 ml-1"
            @click="options.customTokens.splice(index, 1)"
          />
        </div>
      </div>
      <ui-button class="mt-4" @click="addToken"> Add token </ui-button>
    </template>
  </div>
</template>
<script setup>
import { reactive, watch } from 'vue';
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
<p class="mt-2">Supported tokens</p>
<table class="tokens">
	<tbody>
		<tr>
			<td>#</td>
			<td>Number (0-9)</td>
		</tr>
		<tr>
			<td>X</td>
			<td>Number (0-9) or Letter (A-Z|a-z)</td>
		</tr>
		<tr>
			<td>S</td>
			<td>Letter (A-Z|a-z)</td>
		</tr>
		<tr>
			<td>A</td>
			<td>Letter (A-Z)</td>
		</tr>
		<tr>
			<td>a</td>
			<td>Letter (a-z)</td>
		</tr>
		<tr>
			<td>!</td>
			<td>Escape character</td>
		</tr>
		<tr>
			<td>*</td>
			<td>Repeat character</td>
		</tr>
	<tbody>
</table>
`;

const cloneData = cloneDeep(props.modelValue || {});
const options = reactive({
  ...(props.defaultValue || {}),
  ...cloneData,
});

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
</script>
