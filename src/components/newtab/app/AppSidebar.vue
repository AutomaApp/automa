<template>
  <aside
    class="
      fixed
      flex flex-col
      items-center
      h-screen
      left-0
      top-0
      w-16
      py-6
      bg-white
      z-50
    "
  >
    <img src="@/assets/svg/logo.svg" class="w-10 mb-4 mx-auto" />
    <div
      class="space-y-2 w-full relative text-center"
      @mouseleave="showHoverIndicator = false"
    >
      <div
        v-show="showHoverIndicator"
        ref="hoverIndicator"
        class="
          rounded-lg
          h-10
          w-10
          absolute
          left-1/2
          bg-box-transparent
          transition-transform
          duration-200
        "
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
          v-tooltip:right.group="t(`common.${tab.id}`, 2)"
          :class="{ 'is-active': isActive }"
          :href="href"
          class="
            z-10
            relative
            w-full
            flex
            items-center
            justify-center
            tab
            relative
          "
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
    <ui-popover placement="right" trigger="mouseenter click">
      <template #trigger>
        <v-remixicon class="cursor-pointer" name="riInformationLine" />
      </template>
      <ui-list class="space-y-1">
        <ui-list-item
          v-for="item in links"
          :key="item.name"
          :href="item.url"
          tag="a"
          rel="noopener"
          target="_blank"
        >
          <v-remixicon :name="item.icon" class="-ml-1 mr-2" />
          <span>{{ item.name }}</span>
        </ui-list-item>
      </ui-list>
    </ui-popover>
  </aside>
</template>
<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useGroupTooltip } from '@/composable/groupTooltip';

useGroupTooltip();
const { t } = useI18n();

const links = [
  {
    name: 'Donate',
    icon: 'riHandHeartLine',
    url: 'https://paypal.me/akholid060',
  },
  {
    name: t('common.docs', 2),
    icon: 'riBookOpenLine',
    url: 'https://github.com/kholid060/automa/wiki',
  },
  {
    name: 'GitHub',
    icon: 'riGithubFill',
    url: 'https://github.com/kholid060/automa',
  },
];
const tabs = [
  {
    id: 'dashboard',
    icon: 'riHome5Line',
    path: '/',
  },
  {
    id: 'workflow',
    icon: 'riFlowChart',
    path: '/workflows',
  },
  {
    id: 'collection',
    icon: 'riFolderLine',
    path: '/collections',
  },
  {
    id: 'log',
    icon: 'riHistoryLine',
    path: '/logs',
  },
  {
    id: 'settings',
    icon: 'riSettings3Line',
    path: '/settings',
  },
];
const hoverIndicator = ref(null);
const showHoverIndicator = ref(false);

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
  @apply bg-accent;
}
</style>
