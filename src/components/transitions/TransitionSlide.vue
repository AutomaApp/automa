<script>
import { h, Transition, TransitionGroup } from 'vue';

export default {
  props: {
    group: Boolean,
    direction: {
      type: String,
      default: 'left',
      validator: (value) => ['top', 'left', 'right', 'bottom'].includes(value),
    },
  },
  setup(props, { slots, attrs }) {
    const translateValues = {
      0: '-100%',
      1: '100%',
    };
    const directionsKey = {
      top: 0,
      left: 0,
      right: 1,
      bottom: 1,
    };

    function getTranslateStyle(key = 0) {
      const isHorizontal = ['left', 'right'].includes(props.direction);
      const value = translateValues[directionsKey[props.direction] + key];

      if (isHorizontal) return `translateX(${value})`;

      return `translateY(${value})`;
    }
    function enter(element) {
      element.style.transform = getTranslateStyle();
    }
    function leave(element) {
      element.style.transform = getTranslateStyle(1);
    }
    function afterEnter(element) {
      element.style.transform = 'translate(0, 0)';
    }

    return () =>
      h(
        props.group ? TransitionGroup : Transition,
        {
          ...attrs,
          name: 'slide',
          onEnter: enter,
          onAfterEnter: afterEnter,
          onLeave: leave,
        },
        slots.default
      );
  },
};
</script>
<style>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.25s ease-out;
}
</style>
