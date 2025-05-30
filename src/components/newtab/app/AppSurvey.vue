<template>
  <ui-card
    v-if="modalState.show"
    class="group fixed bottom-8 right-8 w-72 border-2 shadow-2xl"
  >
    <button
      class="absolute -right-2 -top-2 scale-0 rounded-full bg-white shadow-md transition group-hover:scale-100"
      @click="closeModal"
    >
      <v-remixicon class="text-gray-600" name="riCloseLine" />
    </button>
    <h2 class="text-lg font-semibold">
      {{ activeModal.title }}
    </h2>
    <p class="mt-1 text-gray-700 dark:text-gray-100">
      {{ activeModal.body }}
    </p>
    <div class="mt-4 space-y-2">
      <ui-button
        :href="activeModal.url"
        tag="a"
        target="_blank"
        rel="noopener"
        class="block w-full"
        variant="accent"
      >
        {{ activeModal.button }}
      </ui-button>
    </div>
  </ui-card>
</template>
<script setup>
import dayjs from '@/lib/dayjs';
import { computed, onMounted, shallowReactive } from 'vue';
import browser from 'webextension-polyfill';

const modalTypes = {
  testimonial: {
    title: 'Hi There 👋',
    body: 'Thank you for using Automa, and if you have a great experience. Would you like to give us a testimonial?',
    button: 'Give Testimonial',
    url: 'https://testimonial.to/automa',
  },
  survey: {
    title: "How do you think we're doing?",
    body: 'To help us make Automa as best it can be, we need a few minutes of your time to get your feedback.',
    button: 'Take Survey',
    url: 'https://extension.automa.site/survey',
  },
};

const modalState = shallowReactive({
  show: true,
  type: 'survey',
});

function closeModal() {
  let value = true;

  if (modalState.type === 'survey') {
    value = new Date().toString();
  }

  modalState.show = false;
  localStorage.setItem(`has-${modalState.type}`, value);
}
async function checkModal() {
  try {
    const { isFirstTime } = await browser.storage.local.get('isFirstTime');

    if (isFirstTime) {
      modalState.show = false;
      localStorage.setItem('has-testimonial', true);
      localStorage.setItem('has-survey', Date.now());
      return;
    }

    const survey = localStorage.getItem('has-survey');

    if (!survey) return;

    const daysDiff = dayjs().diff(survey, 'day');
    const showTestimonial =
      daysDiff >= 2 && !localStorage.getItem('has-testimonial');

    if (showTestimonial) {
      modalState.show = true;
      modalState.type = 'testimonial';
    } else {
      modalState.show = false;
    }
  } catch (error) {
    console.error(error);
  }
}

const activeModal = computed(() => modalTypes[modalState.type]);

onMounted(checkModal);
</script>
