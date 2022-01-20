<template>
  <div class="py-16 max-w-xl mx-auto">
    <h1 class="font-semibold text-4xl mb-8">
      {{ t('welcome.title') }}
    </h1>
    <p class="text-lg">
      {{ t('welcome.text') }}
    </p>
    <div class="mt-8 space-x-2 flex items-center">
      <ui-button
        tag="a"
        href="https://docs.automa.site"
        target="_blank"
        rel="noopener"
      >
        <v-remixicon name="riBook3Line" class="-ml-1 mr-2" />
        {{ t('common.docs') }}
      </ui-button>
      <ui-button
        tag="a"
        href="https://automa.site/workflows"
        target="_blank"
        rel="noopener"
      >
        <v-remixicon name="riCompass3Line" class="-ml-1 mr-2" />
        {{ t('welcome.marketplace') }}
      </ui-button>
    </div>
  </div>
</template>
<script setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>
