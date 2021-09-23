<template>
  <div class="flex items-start">
    <workflow-details-card
      class="mr-6"
      :workflow="workflow"
      @dragstart="showEmptyState = false"
      @dragend="showEmptyState = true"
      @update-workflow="updateWorkflowSchema"
    />
    <div class="flex-1 relative">
      <h1 class="font-semibold text-xl mb-4">Tasks</h1>
      <div
        v-if="tasks.length === 0 && showEmptyState"
        class="text-center absolute w-full mt-20"
      >
        <div class="inline-block p-6 rounded-lg mb-4 bg-box-transparent">
          <v-remixicon name="riDragDropLine" size="36" />
        </div>
        <p class="text-lg">Drag and drop tasks to here</p>
      </div>
      <div class="space-y-1 z-20 relative" style="min-height: 400px">
        <draggable
          v-model="tasks"
          :component-data="{ name: 'list' }"
          handle="#drag-handler"
          item-key="id"
          group="tasks"
          ghost-class="ghost-task"
          tag="transition-group"
        >
          <template #item="{ element }">
            <workflow-task
              :task="element"
              class="list-item-transition"
              @delete="deleteTask"
              @update="updateTask"
            />
          </template>
        </draggable>
      </div>
    </div>
  </div>
</template>
<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Draggable from 'vuedraggable';
import Workflow from '@/models/workflow';
import Task from '@/models/task';
import WorkflowDetailsCard from '@/components/newtab/workflow/WorkflowDetailsCard.vue';
import WorkflowTask from '@/components/newtab/workflow/WorkflowTask.vue';

const route = useRoute();
const router = useRouter();

const showEmptyState = ref(true);

const workflow = computed(() => Workflow.find(route.params.id));
const tasks = computed({
  set(value) {
    const newTasks = value.map((item, index) => {
      let task = item;

      if (item.isNewTask) {
        task = {
          name: '',
          type: item.id,
          createdAt: Date.now(),
          workflowId: route.params.id,
        };
      }

      task.order = index;

      return task;
    });

    Task.insertOrUpdate({ data: newTasks });
  },
  get() {
    return Task.query()
      .where('workflowId', route.params.id)
      .orderBy('order')
      .get();
  },
});

function deleteTask({ id }) {
  Task.delete(id);
}
function updateTask(id, data) {
  Task.update({
    where: id,
    data,
  });
}
function updateWorkflowSchema(data) {
  console.log(data, route.params.id);
  Workflow.update({
    where: route.params.id,
    data: { dataSchema: data },
  });
}

onMounted(() => {
  const isWorkflowExists = Workflow.query()
    .where('id', route.params.id)
    .exists();

  if (!isWorkflowExists) {
    router.push('/workflows');
  }
});
</script>
<style>
.ghost-task {
  height: 40px;
  @apply bg-box-transparent;
}
.ghost-task:not(.workflow-task) * {
  display: none;
}
</style>
