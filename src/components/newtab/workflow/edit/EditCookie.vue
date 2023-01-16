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
        class="mt-4 w-full"
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
      <ui-checkbox
        :model-value="data.useJson"
        block
        class="mt-1"
        @change="updateData({ useJson: $event })"
      >
        {{ t('workflow.blocks.cookie.useJson') }}
      </ui-checkbox>
      <template v-if="data.useJson">
        <shared-codemirror
          :model-value="data.jsonCode"
          :extensions="codemirrorExts"
          lang="json"
          class="cookie-editor mt-4"
          @change="updateData({ jsonCode: $event })"
        />
        <a
          :href="`https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/cookies/${
            data.type === 'get' && data.getAll ? 'getAll' : data.type
          }`"
          rel="noopener"
          class="mt-2 inline-block underline"
          target="_blank"
        >
          See all available properties
        </a>
      </template>
      <template v-else>
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
          :label="`Name ${
            data.type === 'get' && !data.getAll ? '' : '(optional)'
          }`"
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
      </template>
      <div v-if="data.type === 'get'" class="cookie-data mt-4 border-t pt-4">
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
import { computed, defineAsyncComponent } from 'vue';
import { useI18n } from 'vue-i18n';
import { autocompletion } from '@codemirror/autocomplete';
import { syntaxTree } from '@codemirror/language';
import { useHasPermissions } from '@/composable/hasPermissions';
import InsertWorkflowData from './InsertWorkflowData.vue';

const SharedCodemirror = defineAsyncComponent(() =>
  import('@/components/newtab/shared/SharedCodemirror.vue')
);

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
const methodProps = {
  name: { label: 'name', type: 'text' },
  url: { label: 'url', type: 'text' },
  path: { label: 'path', type: 'text' },
  session: { label: 'session', type: 'text' },
  secure: { label: 'secure', type: 'text' },
  domain: { label: 'domain', type: 'text' },
  sameSite: { label: 'sameSite', type: 'text' },
  httpOnly: { label: 'httpOnly', type: 'text' },
};

const isGetOrSet = computed(
  () =>
    (props.data.type === 'get' && props.data.getAll) ||
    props.data.type === 'set'
);

function cookieOptionsAutocomplete(context) {
  const word = context.matchBefore(/\w*/);
  const nodeBefore = syntaxTree(context.state).resolveInner(context.pos, -1);

  if (
    nodeBefore.name !== 'PropertyName' ||
    (word.from === word.to && !context.explicit)
  )
    return null;

  let options = [];

  if (props.data.type === 'get') {
    if (props.data.getAll) {
      options = [
        methodProps.domain,
        methodProps.name,
        methodProps.path,
        methodProps.secure,
        methodProps.url,
      ];
    } else {
      options = [methodProps.name, methodProps.url];
    }
  } else if (props.data.type === 'set') {
    options = Object.values(methodProps);
  } else if (props.data.type === 'remove') {
    options = [methodProps.name, methodProps.url];
  }

  return {
    options,
    from: word.from,
  };
}
function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}

const codemirrorExts = [
  autocompletion({
    override: [cookieOptionsAutocomplete],
  }),
];
</script>
<style>
.cookie-data .block-variable {
  margin-top: 0;
}

.cookie-editor .cm-tooltip-autocomplete {
  margin-left: 0px !important;
  margin-top: -5px !important;
}
</style>
