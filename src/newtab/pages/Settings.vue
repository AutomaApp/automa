<template>
  <div class="container pt-8 pb-4">
    <h1 class="mb-10 text-2xl font-semibold">{{ t('common.settings') }}</h1>
    <div class="flex items-start">
      <ui-list class="sticky top-8 mr-12 hidden w-64 space-y-2 md:block">
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
                : 'text-gray-600 dark:text-gray-200',
            ]"
            tag="a"
            @click="navigate"
          >
            <v-remixicon :name="menu.icon" class="mr-2 -ml-1" />
            {{ t(`settings.menu.${menu.id}`) }}
          </ui-list-item>
        </router-link>
      </ui-list>
      <div class="settings-content flex-1">
        <ui-select
          :model-value="$route.path"
          class="mb-4 w-full md:hidden"
          @change="onSelectChanged"
        >
          <option v-for="menu in menus" :key="menu.id" :value="menu.path">
            {{ t(`settings.menu.${menu.id}`) }}
          </option>
        </ui-select>
        <router-view />
      </div>
    </div>
  </div>
</template>
<script setup>
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

const { t } = useI18n();
const router = useRouter();

const menus = [
  { id: 'general', path: '/settings', icon: 'riSettings3Line' },
  { id: 'backup', path: '/backup', icon: 'riDatabase2Line' },
  { id: 'editor', path: '/editor', icon: 'riMindMap' },
  { id: 'shortcuts', path: '/shortcuts', icon: 'riKeyboardLine' },
  { id: 'about', path: '/about', icon: 'riInformationLine' },
];

function onSelectChanged(value) {
  router.push(value);
}
</script>
