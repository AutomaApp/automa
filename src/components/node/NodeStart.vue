<template>
  <div class="flex items-center relative p-4 overflow-hidden rounded-lg">
    <div class="absolute top-0 left-0 w-full h-2 bg-yellow-200"></div>
    <span class="inline-block p-2 mr-4 rounded-lg bg-yellow-200">
      <v-remixicon :path="riFlagLine" />
    </span>
    <p class="font-semibold mr-4">Start</p>
  </div>
</template>
<script setup>
import { VRemixIcon as VRemixicon } from 'v-remixicon';
import { riFlagLine } from 'v-remixicon/icons';
</script>
