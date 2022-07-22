<template>
  <div class="modal-ui">
    <div v-if="$slots.activator" class="modal-ui__activator">
      <slot name="activator" v-bind="{ open: () => (show = true) }"></slot>
    </div>
    <teleport :to="teleportTo" :disabled="disabledTeleport">
      <transition name="modal" mode="out-in">
        <div
          v-if="show"
          class="bg-black overflow-y-auto bg-opacity-20 dark:bg-opacity-60 modal-ui__content-container z-50 flex justify-center items-end md:items-center"
          :style="{ 'backdrop-filter': blur && 'blur(2px)' }"
          @click.self="closeModal"
        >
          <slot v-if="customContent"></slot>
          <ui-card
            v-else
            class="modal-ui__content shadow-lg w-full"
            :padding="padding"
            :class="[contentClass]"
          >
            <div class="mb-4 modal-ui__content-header">
              <div class="flex items-center justify-between">
                <span class="content-header">
                  <slot name="header">{{ title }}</slot>
                </span>
                <v-remixicon
                  v-show="!persist"
                  class="text-gray-600 dark:text-gray-300 cursor-pointer"
                  name="riCloseLine"
                  size="20"
                  @click="closeModal"
                ></v-remixicon>
              </div>
            </div>
            <slot :close="closeModal"></slot>
          </ui-card>
        </div>
      </transition>
    </teleport>
  </div>
</template>
<script>
import { ref, watch } from 'vue';

export default {
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    teleportTo: {
      type: String,
      default: 'body',
    },
    contentClass: {
      type: String,
      default: 'max-w-lg',
    },
    title: {
      type: String,
      default: '',
    },
    padding: {
      type: String,
      default: 'p-4',
    },
    customContent: Boolean,
    persist: Boolean,
    blur: Boolean,
    disabledTeleport: Boolean,
  },
  emits: ['close', 'update:modelValue'],
  setup(props, { emit }) {
    const show = ref(false);
    const modalContent = ref(null);

    function toggleBodyOverflow(value) {
      document.body.classList.toggle('overflow-hidden', value);
    }
    function closeModal() {
      if (props.persist) return;

      show.value = false;
      emit('close', false);
      emit('update:modelValue', false);

      toggleBodyOverflow(false);
    }
    function keyupHandler({ code }) {
      if (code === 'Escape') closeModal();
    }

    watch(
      () => props.modelValue,
      (value) => {
        show.value = value;
        toggleBodyOverflow(value);
      },
      { immediate: true }
    );

    watch(show, (value) => {
      if (value) window.addEventListener('keyup', keyupHandler);
      else window.removeEventListener('keyup', keyupHandler);
    });

    return {
      show,
      closeModal,
      modalContent,
    };
  },
};
</script>
<style>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .modal-ui__content,
.modal-leave-active .modal-ui__content {
  transition: transform 0.3s ease;
  transform: translateY(0px);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-ui__content,
.modal-leave-to .modal-ui__content {
  transform: translateY(30px);
}

.modal-ui__content-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
</style>
