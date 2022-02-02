<template>
  <div class="max-w-lg">
    <div class="p-3 mb-2 bg-box-transparent rounded-full inline-block">
      <img src="@/assets/svg/logo.svg" class="w-14" />
    </div>
    <p class="text-2xl font-semibold">Automa</p>
    <p class="mb-2 mt-1">Version: {{ extensionVersion }}</p>
    <p class="text-gray-600 dark:text-gray-200">
      Automa is a chrome extension for browser automation. From auto-fill forms,
      doing a repetitive task, taking a screenshot, to scraping data of the
      website, it's up to you what you want to do with this extension.
    </p>
    <div class="mt-4 space-x-2">
      <a
        v-for="link in links"
        :key="link.name"
        v-tooltip.group="link.name"
        :href="link.url"
        target="_blank"
        class="inline-block p-2 rounded-lg transition hoverable"
      >
        <v-remixicon :name="link.icon" />
        <p class="ml-1 hidden">{{ link.name }}</p>
      </a>
    </div>
    <div class="border-b dark:border-gray-700 my-8"></div>
    <h2 class="text-xl font-semibold">Contributors</h2>
    <p class="mt-1 text-gray-600 dark:text-gray-200">
      Thanks to everyone who has submitted issues, made suggestions, and
      generally helped make this a better project.
    </p>
    <div class="mt-4 gap-2 mb-12 grid grid-cols-7">
      <a
        v-for="contributor in store.state.contributors"
        :key="contributor.username"
        v-tooltip.group="contributor.username"
        :href="contributor.url"
        target="_blank"
        rel="noopener"
      >
        <img
          :src="contributor.avatar"
          :alt="`${contributor.username} avatar`"
          class="w-16 rounded-lg"
        />
      </a>
    </div>
  </div>
</template>
<script setup>
/* eslint-disable camelcase */
import { onMounted } from 'vue';
import { useStore } from 'vuex';
import { useGroupTooltip } from '@/composable/groupTooltip';

useGroupTooltip();
const store = useStore();

const extensionVersion = chrome.runtime.getManifest().version;
const links = [
  {
    name: 'GitHub',
    icon: 'riGithubFill',
    url: 'https://github.com/kholid060/automa',
  },
  { name: 'Website', icon: 'riGlobalLine', url: 'https://www.automa.site' },
  {
    name: 'Documentation',
    icon: 'riBook3Line',
    url: 'https://docs.automa.site',
  },
  {
    name: 'Donate',
    icon: 'riHandHeartLine',
    url: 'https://paypal.me/akholid060',
  },
];

onMounted(async () => {
  if (store.contributors) return;

  try {
    const response = await fetch(
      'https://api.github.com/repos/Kholid060/automa/contributors'
    );
    const contributors = (await response.json()).reduce(
      (acc, { type, avatar_url, login, html_url }) => {
        if (type !== 'Bot') {
          acc.push({
            username: login,
            url: html_url,
            avatar: avatar_url,
          });
        }

        return acc;
      },
      []
    );

    store.commit('updateState', {
      key: 'contributors',
      value: contributors,
    });
  } catch (error) {
    console.error(error);
  }
});
</script>
