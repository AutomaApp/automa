<template>
  <aside class="fixed h-screen left-0 top-0 w-16 py-5 bg-white z-50">
    <div
      class="space-y-2 relative text-center"
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
