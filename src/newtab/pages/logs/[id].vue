<template>
  <p>Hello :)</p>
</template>
<script setup>
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import emitter from '@/lib/mitt';

const route = useRoute();
const router = useRouter();

onMounted(() => {
  emitter.emit('ui:logs', {
    show: true,
    logId: route.params.id,
  });

  router.replace('/');
});
</script>
