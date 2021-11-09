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
        :key="tab.name"
        :to="tab.path"
        custom
      >
        <a
          v-tooltip:right.group="tab.name"
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
    <a
      v-tooltip:right="'Github'"
      href="https://github.com/kholid060/automa"
      rel="noopener"
      target="_blank"
    >
      <v-remixicon name="riGithubFill" />
    </a>
  </aside>
</template>
<script setup>
import { ref } from 'vue';
import { useGroupTooltip } from '@/composable/groupTooltip';

useGroupTooltip();

const tabs = [
  {
    name: 'Dashboard',
    icon: 'riHome5Line',
    path: '/',
  },
  {
    name: 'Worfklows',
    icon: 'riFlowChart',
    path: '/workflows',
  },
  {
    name: 'Collections',
    icon: 'riFolderLine',
    path: '/collections',
  },
  {
    name: 'Logs',
    icon: 'riHistoryLine',
    path: '/logs',
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
