<template>
  <div class="flex items-start">
    <workflow-details-card
      class="mr-6"
      @dragstart="showEmptyState = false"
      @dragend="showEmptyState = true"
    />
    <div class="flex-1 relative">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-xl font-semibold">Tasks</h1>
        <ui-input
          v-model="query"
          placeholder="Search..."
          prepend-icon="riSearch2Line"
        />
      </div>
      <div
        v-if="workflowTasks.length === 0 && showEmptyState"
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

const query = ref('');
const showEmptyState = ref(true);

const workflowTasks = computed(() =>
  Task.query().where('workflowId', route.params.id).orderBy('order').get()
);
const tasks = computed({
  set(value) {
    const newTasks = value.map((item, index) => {
      let task = item;

      if (item.isNewTask) {
        task = {
          name: item.name,
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
    return workflowTasks.value.filter(({ name }) =>
      name.toLocaleLowerCase().includes(query.value.toLocaleLowerCase())
    );
  },
});

function deleteTask({ id }) {
  Task.delete(id);
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

.list-item-transition {
  transition: all 0.4s ease;
}

.list-leave-active {
  position: absolute;
  width: 100%;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
}

.list-enter-from,
.list-enter-from {
  transform: translateY(30px);
}
</style>
