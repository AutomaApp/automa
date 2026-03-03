<template>
  <div class="modal-ui">
    <div v-if="$slots.activator" class="modal-ui__activator">
      <slot name="activator" v-bind="{ open: () => (show = true) }"></slot>
    </div>
    <teleport :to="teleportTo" :disabled="disabledTeleport">
      <transition name="modal" mode="out-in">
        <div
          v-if="show"
          ref="modalContent"
          :class="[positions[contentPosition]]"
          class="modal-ui__content-container z-50 flex justify-center overflow-y-auto"
          :style="{ 'backdrop-filter': blur && 'blur(2px)' }"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="title ? 'modal-title' : undefined"
        >
          <div
            class="absolute h-full w-full bg-black bg-opacity-20 dark:bg-opacity-60"
            style="z-index: -2"
            aria-hidden="true"
            @click="closeModal"
          />
          <slot v-if="customContent"></slot>
          <ui-card
            v-else
            class="modal-ui__content w-full shadow-lg"
            :padding="padding"
            :class="[contentClass]"
          >
            <div class="modal-ui__content-header mb-4">
              <div class="flex items-center justify-between">
                <span class="content-header" id="modal-title">
                  <slot name="header">{{ title }}</slot>
                </span>
                <slot name="header-append" />
                <v-remixicon
                  v-show="!persist"
                  class="cursor-pointer text-gray-600 dark:text-gray-300"
                  name="riCloseLine"
                  size="20"
                  aria-label="Close modal"
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
    contentPosition: {
      type: String,
      default: 'center',
    },
    customContent: Boolean,
    persist: Boolean,
    blur: Boolean,
    disabledTeleport: Boolean,
  },
  emits: ['close', 'update:modelValue'],
  setup(props, { emit }) {
    const positions = {
      center: 'items-center',
      start: 'items-start',
    };

    const show = ref(false);
    const modalContent = ref(null);
    const lastActiveElement = ref(null);

    function toggleBodyOverflow(value) {
      document.body.classList.toggle('overflow-hidden', value);
    }
    function closeModal() {
      if (props.persist) return;

      // Restore focus to the element that opened the modal
      if (lastActiveElement.value) {
        lastActiveElement.value.focus();
        lastActiveElement.value = null;
      }

      show.value = false;
      emit('close', false);
      emit('update:modelValue', false);

      toggleBodyOverflow(false);
    }
    function openModal() {
      // Save the currently focused element to restore focus later
      lastActiveElement.value = document.activeElement;
      
      show.value = true;
      
      // Focus the first focusable element in the modal
      setTimeout(() => {
        const modal = modalContent.value?.querySelector?.('.modal-ui__content');
        if (modal) {
          const focusable = modal.querySelector(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusable) {
            focusable.focus();
          }
        }
      }, 100);
    }
    function keyupHandler({ code }) {
      if (code === 'Escape') closeModal();
    }

    watch(
      () => props.modelValue,
      (value) => {
        if (value) openModal();
        else show.value = false;
      },
      { immediate: true }
    );

    watch(show, (value) => {
      if (value) window.addEventListener('keyup', keyupHandler);
      else window.removeEventListener('keyup', keyupHandler);

      toggleBodyOverflow(value);
    });

    return {
      show,
      positions,
      closeModal,
      modalContent,
      lastActiveElement,
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
