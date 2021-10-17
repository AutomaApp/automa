<template>
  <div class="bg-accent rounded-b-2xl absolute top-0 left-0 h-32 w-full"></div>
  <div
    class="flex dark placeholder-black text-white px-5 pt-8 mb-6 items-center"
  >
    <ui-input
      autofocus
      prepend-icon="riSearch2Line"
      class="flex-1 search-input"
      placeholder="Search..."
    ></ui-input>
    <ui-button
      icon
      title="Element selector"
      class="ml-3"
      @click="selectElement"
    >
      <v-remixicon name="riFocus3Line" />
    </ui-button>
    <ui-button icon title="Dashboard" class="ml-3" @click="openDashboard">
      <v-remixicon name="riHome5Line" />
    </ui-button>
  </div>
  <div class="px-5 pb-5 space-y-2">
    <home-workflow-card v-for="i in 10" :key="i" />
  </div>
</template>
<script setup>
import browser from 'webextension-polyfill';
import HomeWorkflowCard from '@/components/popup/home/HomeWorkflowCard.vue';

function openDashboard() {
  const newTabURL = chrome.runtime.getURL('/newtab.html');

  browser.tabs.query({ url: newTabURL }).then(([tab]) => {
    if (tab) browser.tabs.update(tab.id, { active: true });
    else browser.tabs.create({ url: newTabURL, active: true });
  });
}
async function selectElement() {
  const [tab] = await browser.tabs.query({ active: true });

  try {
    await browser.tabs.sendMessage(tab.id, {
      type: 'content-script-exists',
    });

    browser.tabs.sendMessage(tab.id, {
      type: 'select-element',
    });
  } catch (error) {
    if (error.message.includes('Could not establish connection.')) {
      await browser.tabs.executeScript(tab.id, {
        file: './contentScript.bundle.js',
      });

      selectElement();
    }

    console.error(error);
  }
}
</script>
