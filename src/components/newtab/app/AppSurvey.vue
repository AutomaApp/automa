<template>
  <ui-card
    v-if="modalState.show"
    class="fixed bottom-8 right-8 shadow-2xl border-2 w-72 group"
  >
    <button
      class="absolute bg-white shadow-md rounded-full -right-2 -top-2 transition scale-0 group-hover:scale-100"
      @click="closeModal"
    >
      <v-remixicon class="text-gray-600" name="riCloseLine" />
    </button>
    <h2 class="font-semibold text-lg">
      {{ activeModal.title }}
    </h2>
    <p class="mt-1 dark:text-gray-100 text-gray-700">
      {{ activeModal.body }}
    </p>
    <div class="space-y-2 mt-4">
      <ui-button
        :href="activeModal.url"
        tag="a"
        target="_blank"
        rel="noopener"
        class="w-full block"
        variant="accent"
      >
        {{ activeModal.button }}
      </ui-button>
    </div>
  </ui-card>
</template>
<script setup>
import { shallowReactive, computed, onMounted } from 'vue';
import browser from 'webextension-polyfill';
import dayjs from '@/lib/dayjs';

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
    url: 'https://www.automa.site/survey',
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
