<template>
  <template v-if="retrieved">
    <app-sidebar />
    <main class="pl-16">
      <router-view />
    </main>
    <ui-dialog />
    <div
      v-if="isUpdated"
      class="p-4 shadow-2xl z-50 fixed bottom-8 left-1/2 -translate-x-1/2 rounded-lg bg-accent text-white flex items-center"
    >
      <v-remixicon name="riInformationLine" class="mr-3" />
      <p>
        {{ t('updateMessage.text1', { version: currentVersion }) }}
      </p>
      <a
        :href="`https://github.com/Kholid060/automa/releases/tag/v${currentVersion}`"
        target="_blank"
        rel="noopener"
        class="underline ml-1"
      >
        {{ t('updateMessage.text2') }}
      </a>
      <button class="ml-6 text-gray-300" @click="isUpdated = false">
        <v-remixicon size="20" name="riCloseLine" />
      </button>
    </div>
  </template>
</template>
<script setup>
import { ref, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import { compare } from 'compare-versions';
import browser from 'webextension-polyfill';
import { loadLocaleMessages, setI18nLanguage } from '@/lib/vue-i18n';
import AppSidebar from '@/components/newtab/app/AppSidebar.vue';

const store = useStore();
const { t } = useI18n();

const retrieved = ref(false);

const currentVersion = browser.runtime.getManifest().version;
const prevVersion = localStorage.getItem('ext-version') || '0.0.0';
const isUpdated = ref(false);

function handleStorageChanged(change) {
  if (change.logs) {
    store.dispatch('entities/create', {
      entity: 'logs',
      data: change.logs.newValue,
    });
  }

  if (change.workflowState) {
    store.commit('updateState', {
      key: 'workflowState',
      value: Object.values(change.workflowState.newValue || {}).filter(
        ({ isDestroyed, parentState }) =>
          !isDestroyed && !parentState?.isCollection
      ),
    });
  }
}

browser.storage.local.onChanged.addListener(handleStorageChanged);

window.addEventListener('beforeunload', () => {
  browser.storage.local.onChanged.removeListener(handleStorageChanged);
});

onMounted(async () => {
  try {
    const { isFirstTime } = await browser.storage.local.get('isFirstTime');

    isUpdated.value = !isFirstTime && compare(currentVersion, prevVersion, '>');

    await store.dispatch('retrieve', ['workflows', 'logs', 'collections']);
    await store.dispatch('retrieveWorkflowState');

    await loadLocaleMessages(store.state.settings.locale, 'newtab');
    await setI18nLanguage(store.state.settings.locale);

    retrieved.value = true;
  } catch (error) {
    retrieved.value = true;
    console.error(error);
  }

  localStorage.setItem('ext-version', currentVersion);
});
</script>
