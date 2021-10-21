<template>
  <router-view v-if="retrieved" />
  <ui-dialog />
</template>
<script setup>
import { ref } from 'vue';
import { useStore } from 'vuex';

const store = useStore();
const retrieved = ref(false);

store
  .dispatch('retrieve')
  .then(() => {
    retrieved.value = true;
  })
  .catch(() => {
    retrieved.value = true;
  });
</script>
<style>
body {
  height: 500px;
  width: 330px;
  font-size: 16px;
}
</style>
