<template>
  <template v-if="!element.hide">
    <div class="overlay"></div>
    <div
      :style="{
        transform: `translate(${element.hovered.x}px, ${element.hovered.y}px)`,
        height: element.hovered.height + 'px',
        width: element.hovered.width + 'px',
      }"
      class="indicator pointer-events-auto"
    ></div>
    <div
      v-if="element.selector"
      :style="{
        transform: `translate(${element.selected.x}px, ${element.selected.y}px)`,
        height: element.selected.height + 'px',
        width: element.selected.width + 'px',
        zIndex: 99,
      }"
      class="indicator selected"
    ></div>
  </template>
  <div class="card">
    <button
      title="Toggle hide"
      class="mr-2"
      @click="element.hide = !element.hide"
    >
      <v-remix-icon :path="element.hide ? riEyeLine : riEyeOffLine" />
    </button>
    <div class="selector">
      <v-remix-icon
        style="cursor: pointer"
        title="Copy selector"
        :path="riFileCopyLine"
        @click="copySelector"
      />
      <input
        type="text"
        placeholder="Element selector"
        title="Element selector"
        readonly
        :value="element.selector"
      />
    </div>
    <template v-if="element.selector && !element.hide">
      <button
        title="Select parent element (press P)"
        class="ml-2"
        @click="selectParentElement"
      >
        <v-remix-icon :path="riArrowDownLine" rotate="180" />
      </button>
      <button
        title="Select parent element (press C)"
        class="ml-2"
        @click="selectChildElement"
      >
        <v-remix-icon :path="riArrowDownLine" />
      </button>
    </template>
    <button class="primary ml-2" @click="destroy">Close</button>
  </div>
</template>
<script setup>
import { reactive } from 'vue';
import { finder } from '@medv/finder';
import { VRemixIcon } from 'v-remixicon';
import {
  riFileCopyLine,
  riArrowDownLine,
  riEyeLine,
  riEyeOffLine,
} from 'v-remixicon/icons';

/* to-do get list of attribute value, add test for each of the web interation block */

const element = reactive({
  hide: window.self !== window.top,
  hovered: {},
  selected: {},
  selector: '',
});

let targetEl = null;
let selectedEl = null;
let pathIndex = 0;
let selectedPath = [];
const root = document.querySelector('element-selector');

function getElementRect(target) {
  if (!target) return {};

  const { x, y, height, width } = target.getBoundingClientRect();

  return {
    width,
    height,
    x: x - 2,
    y: y - 2,
  };
}
function handleMouseMove({ target }) {
  if (element.hide || targetEl === target || target === root) return;

  targetEl = target;

  element.hovered = getElementRect(target);
}
function copySelector() {
  root.shadowRoot.querySelector('input')?.select();

  navigator.clipboard.writeText(element.selector).catch((error) => {
    document.execCommand('copy');
    console.error(error);
  });
}
function selectChildElement() {
  if (selectedPath.length === 0 || element.hide) return;

  const currentEl = selectedPath[pathIndex];
  let activeEl = currentEl;

  if (pathIndex <= 0) {
    const childEl = Array.from(currentEl.children).find(
      (el) => !['STYLE', 'SCRIPT'].includes(el.tagName)
    );

    if (currentEl.childElementCount === 0 || currentEl === childEl) return;

    activeEl = childEl;
    selectedPath.unshift(childEl);
  } else {
    pathIndex -= 1;
    activeEl = selectedPath[pathIndex];
  }

  element.selected = getElementRect(activeEl);
  element.selector = finder(activeEl);
  selectedEl = activeEl;
}
function selectParentElement() {
  if (
    selectedEl.tagName === 'HTML' ||
    selectedPath.length === 0 ||
    element.hide
  )
    return;

  pathIndex += 1;
  const activeEl = selectedPath[pathIndex];

  element.selected = getElementRect(activeEl);
  element.selector = finder(activeEl);
  selectedEl = activeEl;
}
function handleClick(event) {
  if (event.target === root || element.hide) return;

  if (!element.hide) {
    event.preventDefault();
    event.stopPropagation();
  }

  selectedPath = event.path;
  element.selected = getElementRect(targetEl);
  element.selector = finder(targetEl);

  selectedEl = targetEl;
}
function handleKeyup({ code }) {
  const shortcuts = {
    /* eslint-disable-next-line */
    Escape: destroy,
    KeyC: selectChildElement,
    KeyP: selectParentElement,
  };

  if (shortcuts[code]) shortcuts[code]();
}
function handleScroll() {
  const { x: hoveredX, y: hoveredY } = getElementRect(targetEl);
  const { x: selectedX, y: selectedY } = getElementRect(selectedEl);

  element.hovered.x = hoveredX;
  element.hovered.y = hoveredY;
  element.selected.x = selectedX;
  element.selected.y = selectedY;
}
function destroy() {
  window.removeEventListener('keyup', handleKeyup);
  window.removeEventListener('scroll', handleScroll);
  document.removeEventListener('click', handleClick, true);
  window.removeEventListener('mousemove', handleMouseMove);

  root.remove();
}

window.addEventListener('keyup', handleKeyup);
window.addEventListener('scroll', handleScroll);
document.addEventListener('click', handleClick, true);
window.addEventListener('mousemove', handleMouseMove);
</script>
<style>
:host {
  position: fixed;
  height: 100%;
  width: 100%;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 999999999;
  color: #18181b;
  font-size: 16px;
  box-sizing: border-box;
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
    'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif,
    'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
}

:host * {
  font-size: 16px;
}

svg {
  display: inline-block;
}

button {
  border: none;
  background-color: transparent;
  color: inherit;
  border-radius: 8px;
  height: 38px;
  padding: 0 10px;
  background-color: #e4e4e7;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
button.primary {
  background-color: #18181b;
  color: white;
}

.selector {
  border-radius: 8px;
  display: flex;
  align-items: center;
  padding-left: 12px;
  background-color: #e4e4e7;
}

.ml-2 {
  margin-left: 6px;
}

.mr-2 {
  margin-right: 6px;
}

.overlay {
  background-color: rgba(0, 0, 0, 0.2);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

input {
  border: none;
  color: inherit;
  background-color: transparent;
  padding: 10px 12px 10px 6px;
  width: 150px;
}
input:focus {
  outline: none;
}

.card {
  position: absolute;
  display: flex;
  align-items: center;
  bottom: 12px;
  left: 12px;
  background-color: white;
  border-radius: 8px;
  padding: 12px;
  color: #1f2937;
  border: 1px solid #e4e4e7;
  pointer-events: all;
  z-index: 999;
}

.indicator {
  background-color: rgba(251, 191, 36, 0.2);
  border: 2px solid #fbbf24;
  position: absolute;
}
.indicator.selected {
  background-color: rgba(248, 113, 113, 0.2);
  border-color: #f87171;
}
</style>
