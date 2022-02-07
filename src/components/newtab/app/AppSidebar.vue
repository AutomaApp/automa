<template>
  <aside
    class="fixed flex flex-col items-center h-screen left-0 top-0 w-16 py-6 bg-white dark:bg-gray-800 z-50"
  >
    <img
      :title="`v${extensionVersion}`"
      src="@/assets/svg/logo.svg"
      class="w-10 mb-4 mx-auto"
    />
    <div
      class="space-y-2 w-full relative text-center"
      @mouseleave="showHoverIndicator = false"
    >
      <div
        v-show="showHoverIndicator"
        ref="hoverIndicator"
        class="rounded-lg h-10 w-10 absolute left-1/2 bg-box-transparent transition-transform duration-200"
        style="transform: translate(-50%, 0)"
      ></div>
      <router-link
        v-for="tab in tabs"
        v-slot="{ href, navigate, isActive }"
        :key="tab.id"
        :to="tab.path"
        custom
      >
        <a
          v-tooltip:right.group="
            `${t(`common.${tab.id}`, 2)} (${tab.shortcut.readable})`
          "
          :class="{ 'is-active': isActive }"
          :href="href"
          class="z-10 relative w-full flex items-center justify-center tab relative"
          @click="navigate"
          @mouseenter="hoverHandler"
        >
          <div class="p-2 rounded-lg transition-colors inline-block">
            <v-remixicon :name="tab.icon" />
          </div>
        </a>
      </router-link>
    </div>
    <div class="flex-grow"></div>
    <ui-popover
      v-if="store.state.user"
      trigger="mouseenter"
      placement="right"
      class="mb-4"
    >
      <template #trigger>
        <span class="inline-block p-1 bg-box-transparent rounded-full">
          <img
            :src="store.state.user.avatar_url"
            height="32"
            width="32"
            class="rounded-full"
          />
        </span>
      </template>
      {{ store.state.user.username }}
    </ui-popover>
    <router-link v-tooltip:right.group="t('settings.menu.about')" to="/about">
      <v-remixicon class="cursor-pointer" name="riInformationLine" />
    </router-link>
  </aside>
</template>
<script setup>
import { ref } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useShortcut, getShortcut } from '@/composable/shortcut';
import { useGroupTooltip } from '@/composable/groupTooltip';

useGroupTooltip();

const { t } = useI18n();
const store = useStore();
const router = useRouter();

const extensionVersion = chrome.runtime.getManifest().version;
const tabs = [
  {
    id: 'dashboard',
    icon: 'riHome5Line',
    path: '/',
    shortcut: getShortcut('page:dashboard', '/'),
  },
  {
    id: 'workflow',
    icon: 'riFlowChart',
    path: '/workflows',
    shortcut: getShortcut('page:workflows', '/workflows'),
  },
  {
    id: 'collection',
    icon: 'riFolderLine',
    path: '/collections',
    shortcut: getShortcut('page:collections', '/collections'),
  },
  {
    id: 'log',
    icon: 'riHistoryLine',
    path: '/logs',
    shortcut: getShortcut('page:logs', '/logs'),
  },
  {
    id: 'settings',
    icon: 'riSettings3Line',
    path: '/settings',
    shortcut: getShortcut('page:settings', '/settings'),
  },
];
const hoverIndicator = ref(null);
const showHoverIndicator = ref(false);

useShortcut(
  tabs.map(({ shortcut }) => shortcut),
  ({ data }) => {
    if (!data) return;

    router.push(data);
  }
);

function hoverHandler({ target }) {
  showHoverIndicator.value = true;
  hoverIndicator.value.style.transform = `translate(-50%, ${target.offsetTop}px)`;
}
</script>
<style scoped>
.tab.is-active:after {
  content: '';
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  width: 4px;
  @apply bg-accent dark:bg-gray-100;
}
</style>
