<template>
  <div class="mx-auto max-w-xl py-16">
    <h1 class="mb-8 text-3xl font-semibold">
      {{ t('welcome.title') }}
    </h1>
    <p>
      Get started by reading the documentation or browsing workflows in the
      Automa Marketplace. <br />
      To learn how to use Automa, watch the tutorials on our YouTube Channel.
    </p>
    <div class="mt-8 flex items-center space-x-2">
      <a
        v-for="link in links"
        :key="link.name"
        :href="link.url"
        target="_blank"
        rel="noopener"
        class="hoverable w-40 flex-1 rounded-lg border-2 p-4 transition"
      >
        <v-remixicon size="28" :name="link.icon" />
        <p class="mt-2">
          {{ link.name }}
        </p>
      </a>
    </div>
    <div class="mt-8">
      <p>{{ t('home.communities') }}</p>
      <div class="mt-2 flex items-center space-x-2">
        <a
          v-for="link in communities"
          :key="link.name"
          :href="link.url"
          target="_blank"
          rel="noopener"
          class="hoverable w-40 rounded-lg border-2 p-4 transition"
        >
          <v-remixicon size="28" :name="link.icon" />
          <p class="mt-2">
            {{ link.name }}
          </p>
        </a>
      </div>
    </div>
  </div>
</template>
<script setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const communities = [
  {
    name: 'GitHub',
    icon: 'riGithubFill',
    url: 'https://github.com/AutomaApp/automa',
  },
  {
    name: 'Twitter',
    icon: 'riTwitterLine',
    url: 'https://twitter.com/AutomaApp',
  },
  {
    name: 'Discord',
    icon: 'riDiscordLine',
    url: 'https://discord.gg/C6khwwTE84',
  },
];
const links = [
  {
    name: t('common.docs'),
    icon: 'riBook3Line',
    url: 'https://docs.automa.site',
  },
  {
    name: t('welcome.marketplace'),
    icon: 'riCompass3Line',
    url: 'https://www.automa.site/workflows',
  },
  {
    name: 'YouTube',
    icon: 'riYoutubeLine',
    url: 'https://youtube.com/channel/UCL3qU64hW0fsIj2vOayOQUQ',
  },
  {
    name: 'Blog',
    icon: 'riArticleLine',
    url: 'https://blog.automa.site',
  },
];
</script>
