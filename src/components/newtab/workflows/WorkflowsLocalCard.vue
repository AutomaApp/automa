<template>
  <shared-card
    :data="workflow"
    :data-workflow="workflow.id"
    draggable="true"
    class="cursor-default select-none ring-accent local-workflow"
    @click="$router.push(`/workflows/${$event.id}`)"
  >
    <template #header>
      <div class="flex items-center mb-4">
        <template v-if="workflow && !workflow.isDisabled">
          <ui-img
            v-if="workflow.icon.startsWith('http')"
            :src="workflow.icon"
            class="rounded-lg overflow-hidden"
            style="height: 40px; width: 40px"
            alt="Can not display"
          />
          <span v-else class="p-2 rounded-lg bg-box-transparent inline-block">
            <v-remixicon :name="workflow.icon" />
          </span>
        </template>
        <p v-else class="py-2">{{ t('common.disabled') }}</p>
        <div class="flex-grow"></div>
        <button
          v-if="!workflow.isDisabled"
          class="invisible group-hover:visible"
          @click="$emit('execute')"
        >
          <v-remixicon name="riPlayLine" />
        </button>
        <ui-popover class="h-6 ml-2">
          <template #trigger>
            <button>
              <v-remixicon name="riMoreLine" />
            </button>
          </template>
          <ui-list class="space-y-1" style="min-width: 165px">
            <ui-list-item
              class="cursor-pointer"
              @click="$emit('toggleDisable')"
            >
              <v-remixicon name="riToggleLine" class="mr-2 -ml-1" />
              <span class="capitalize">
                {{ t(`common.${workflow.isDisabled ? 'enable' : 'disable'}`) }}
              </span>
            </ui-list-item>
            <ui-list-item class="cursor-pointer" @click="$emit('togglePin')">
              <v-remixicon name="riPushpin2Line" class="mr-2 -ml-1" />
              <span>{{
                t(`workflow.pinWorkflow.${isPinned ? 'unpin' : 'pin'}`)
              }}</span>
            </ui-list-item>
            <ui-list-item
              v-for="item in menu"
              :key="item.id"
              v-close-popover
              class="cursor-pointer"
              @click="item.action(workflow)"
            >
              <v-remixicon :name="item.icon" class="mr-2 -ml-1" />
              <span class="capitalize">{{ item.name }}</span>
            </ui-list-item>
          </ui-list>
        </ui-popover>
      </div>
    </template>
    <template #footer-content>
      <v-remixicon
        v-if="isShared"
        v-tooltip:bottom.group="
          t('workflow.share.sharedAs', {
            name: isShared?.name.slice(0, 64),
          })
        "
        name="riShareLine"
        size="20"
        class="ml-2"
      />
      <v-remixicon
        v-if="isHosted"
        v-tooltip:bottom.group="t('workflow.host.title')"
        name="riBaseStationLine"
        size="20"
        class="ml-2"
      />
    </template>
  </shared-card>
</template>
<script setup>
import { useI18n } from 'vue-i18n';
import SharedCard from '@/components/newtab/shared/SharedCard.vue';

defineProps({
  workflow: {
    type: Object,
    default: () => ({}),
  },
  menu: {
    type: Array,
    default: () => [],
  },
  isShared: {
    type: Object,
    default: null,
  },
  isHosted: {
    type: Object,
    default: null,
  },
  isPinned: Boolean,
});
defineEmits(['toggleDisable', 'togglePin', 'execute']);

const { t } = useI18n();
</script>
