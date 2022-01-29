<template>
  <div class="container pt-8 pb-4">
    <h1 class="text-2xl font-semibold mb-10">{{ t('common.settings') }}</h1>
    <div class="flex items-start">
      <ui-list class="w-64 mr-12 space-y-2">
        <router-link
          v-for="menu in menus"
          :key="menu.id"
          v-slot="{ href, navigate, isExactActive }"
          custom
          :to="menu.path"
        >
          <ui-list-item
            :href="href"
            :class="[
              isExactActive
                ? 'bg-box-transparent'
                : 'text-gray-600 dark:text-gray-600',
            ]"
            tag="a"
            @click="navigate"
          >
            <v-remixicon :name="menu.icon" class="mr-2 -ml-1" />
            {{ t(`settings.menu.${menu.id}`) }}
          </ui-list-item>
        </router-link>
      </ui-list>
      <div class="settings-content">
        <router-view />
      </div>
    </div>
  </div>
</template>
<script setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const menus = [
  { id: 'general', path: '/settings', icon: 'riSettings3Line' },
  { id: 'about', path: '/about', icon: 'riInformationLine' },
];
</script>
