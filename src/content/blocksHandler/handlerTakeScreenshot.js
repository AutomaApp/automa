/* eslint-disable no-await-in-loop */
import { sendMessage } from '@/utils/message';
import { sleep } from '@/utils/helper';

function findScrollableElement(
  element = document.documentElement,
  maxDepth = 5
) {
  if (maxDepth === 0) return null;

  const excludeTags = ['SCRIPT', 'STYLE', 'SVG', 'HEAD'];
  const isScrollable = element.scrollHeight > window.innerHeight;

  if (isScrollable) return element;

  for (let index = 0; index < element.childElementCount; index += 1) {
    const currentChild = element.children.item(index);
    const isExcluded =
      currentChild.tagName.includes('-') ||
      excludeTags.includes(currentChild.tagName);

    if (!isExcluded) {
      const scrollableElement = findScrollableElement(
        currentChild,
        maxDepth - 1
      );

      if (scrollableElement) return scrollableElement;
    }
  }

  return null;
}
function injectStyle() {
  const style = document.createElement('style');
  style.innerText =
    'html::-webkit-scrollbar, body::-webkit-scrollbar, .automa-scrollable-el::-webkit-scrollbar{ width: 0 !important; height: 0 !important } body.is-screenshotting [is-sticky] { position: relative !important; } .hide-fixed [is-fixed] {visibility: hidden !important; opacity: 0 !important;}';
  style.id = 'automa-css-scroll';
  document.body.appendChild(style);

  return style;
}
function canvasToBase64(canvas, { format, quality }) {
  return canvas.toDataURL(`image/${format}`, quality / 100);
}
function loadAsyncImg(src) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      resolve(image);
    };
    image.src = src;
  });
}
async function takeScreenshot(tabId, options) {
  await sendMessage('set:active-tab', tabId, 'background');
  const imageUrl = await sendMessage(
    'get:tab-screenshot',
    options,
    'background'
  );

  return imageUrl;
}
async function captureElement({ selector, tabId, options }) {
  const element = document.querySelector(selector);

  if (!element) {
    const error = new Error('element-not-found');

    throw error;
  }

  element.scrollIntoView({
    block: 'center',
    inline: 'center',
  });

  await sleep(500);

  const imageUrl = await takeScreenshot(tabId, options);
  const image = await loadAsyncImg(imageUrl);

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const { height, width, x, y } = element.getBoundingClientRect();

  const diffHeight = image.height / window.innerHeight;
  const diffWidth = image.width / window.innerWidth;

  const newWidth = width * diffWidth;
  const newHeight = height * diffHeight;

  canvas.width = newWidth;
  canvas.height = newHeight;

  context.drawImage(
    image,
    x * diffHeight,
    y * diffWidth,
    newWidth,
    newHeight,
    0,
    0,
    newWidth,
    newHeight
  );

  return canvasToBase64(canvas, options);
}

export default async function ({ tabId, options, data: { type, selector } }) {
  if (type === 'element') {
    const imageUrl = await captureElement({
      tabId,
      options,
      selector,
    });

    return imageUrl;
  }

  document.body.classList.add('is-screenshotting');

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const maxCanvasSize = 32767;

  const scrollElement = document.querySelector('.automa-scrollable-el');
  let scrollableElement = scrollElement || findScrollableElement();

  if (!scrollableElement) {
    const imageUrl = await takeScreenshot(tabId, options);

    return imageUrl;
  }

  scrollableElement.classList?.add('automa-scrollable-el');

  const style = injectStyle();
  const originalYPosition = window.scrollY;
  const originalScrollHeight = scrollableElement.scrollHeight;

  canvas.height =
    scrollableElement.scrollHeight > maxCanvasSize
      ? maxCanvasSize
      : scrollableElement.scrollHeight;
  canvas.width = window.innerWidth;

  document.body
    .querySelectorAll('*:not([is-sticky], [is-fixed])')
    .forEach((el) => {
      const { position } = getComputedStyle(el);

      if (position === 'sticky') el.setAttribute('is-sticky', '');
      else if (position === 'fixed') el.setAttribute('is-fixed', '');
    });

  let scrollPosition = 0;

  if (scrollableElement.tagName === 'HTML') scrollableElement = window;

  while (scrollPosition <= originalScrollHeight) {
    const imageUrl = await takeScreenshot(tabId, options);

    if (scrollPosition > 0 && !document.body.classList.contains('hide-fixed')) {
      document.body.classList.add('hide-fixed');
    }

    const image = await loadAsyncImg(imageUrl);
    const newScrollPos = scrollPosition + window.innerHeight;

    if (newScrollPos - originalScrollHeight > 0) {
      context.drawImage(
        image,
        0,
        newScrollPos - originalScrollHeight,
        image.width,
        image.height,
        0,
        scrollPosition,
        image.width,
        image.height
      );
    } else {
      context.drawImage(image, 0, scrollPosition);
    }

    scrollPosition = newScrollPos;
    scrollableElement.scrollTo(0, newScrollPos);

    await sleep(1000);
  }

  style.remove();
  document.body.classList.remove('hide-fixed');
  document.body.classList.remove('is-screenshotting');

  scrollableElement.scrollTo(0, originalYPosition);

  return canvasToBase64(canvas, options);
}
