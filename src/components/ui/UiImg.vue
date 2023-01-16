<template>
  <div ref="imageContainer" class="ui-image relative">
    <div class="flex items-center justify-center">
      <slot v-if="state.loading" name="loading">
        <div
          class="bg-input-dark absolute h-full w-full animate-pulse rounded-lg"
        ></div>
      </slot>
      <slot v-else-if="state.error" name="error">
        <p class="text-lighter text-center">Failed to load image</p>
      </slot>
      <div
        v-else
        :style="{
          backgroundImage: `url(${src})`,
          backgroundSize: contain ? 'contain' : 'cover',
        }"
        v-bind="{ role: alt ? 'img' : null, 'aria-label': alt }"
        class="absolute top-0 left-0 h-full w-full bg-center bg-no-repeat"
      >
        <slot></slot>
      </div>
    </div>
  </div>
</template>
<script>
import { ref, shallowReactive, onMounted } from 'vue';

export default {
  props: {
    src: {
      type: String,
      default: '',
    },
    alt: {
      type: String,
      default: '',
    },
    lazy: Boolean,
    contain: Boolean,
  },
  emits: ['error', 'load'],
  setup(props, { emit }) {
    const imageContainer = ref(null);
    const state = shallowReactive({
      loading: true,
      error: false,
    });

    function handleImageLoad() {
      state.loading = false;
      state.error = false;

      emit('load', true);
    }
    function handleImageError() {
      state.loading = false;
      state.error = true;

      emit('error', true);
    }
    function loadImage() {
      const image = new Image();

      image.onload = () => handleImageLoad(image);
      image.onerror = handleImageError;
      image.src = props.src;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const { target } = entry;
          loadImage();
          observer.unobserve(target);
        }
      });
    });

    onMounted(() => {
      if (props.lazy) observer.observe(imageContainer.value);
      else loadImage();
    });

    return {
      state,
      imageContainer,
    };
  },
};
</script>
