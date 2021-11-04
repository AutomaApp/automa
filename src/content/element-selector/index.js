import '@webcomponents/custom-elements';
import { defineCustomElement } from 'vue';
import ElementSelector from './ElementSelector.ce.vue';

/* to-do attribute list */

export default function () {
  const isElementExists = document.querySelector('element-selector');

  if (isElementExists) return;
  if (!customElements.get('element-selector')) {
    window.customElements.define(
      'element-selector',
      defineCustomElement(ElementSelector)
    );
  }

  document.documentElement.appendChild(
    document.createElement('element-selector')
  );
}
