import browser from 'webextension-polyfill';
import initElementSelector from './main';

function generateStyleEl(css, classes = true) {
  const style = document.createElement('style');
  style.textContent = css;

  if (classes) {
    style.classList.add('automa-element-selector');
  }

  return style;
}
async function injectAppStyles(appRoot) {
  try {
    const response = await fetch(
      browser.runtime.getURL('/elementSelector.css')
    );
    const mainCSS = await response.text();
    const appStyleEl = generateStyleEl(mainCSS, false);
    appRoot.shadowRoot.appendChild(appStyleEl);

    const fontURL = browser.runtime.getURL('/Inter-roman-latin.var.woff2');
    const fontCSS = `@font-face { font-family: "Inter var"; font-weight: 100 900; font-display: swap; font-style: normal; font-named-instance: "Regular"; src: url("${fontURL}") format("woff2") }`;
    const fontStyleEl = generateStyleEl(fontCSS);
    document.head.appendChild(fontStyleEl);
  } catch (error) {
    console.error(error);
  }
}

function elementSelectorInstance() {
  const rootElementExist = document.querySelector(
    '#app-container.automa-element-selector'
  );

  if (rootElementExist) {
    rootElementExist.style.display = 'block';

    return true;
  }

  return false;
}

(async function () {
  browser.runtime.onMessage.addListener((data) => {
    return new Promise((resolve) => {
      if (data.type === 'automa-element-selector') {
        elementSelectorInstance();

        resolve(true);
      }
    });
  });

  try {
    const isAppExists = elementSelectorInstance();

    if (isAppExists) return;

    const rootElement = document.createElement('div');
    rootElement.setAttribute('id', 'app-container');
    rootElement.classList.add('automa-element-selector');
    rootElement.attachShadow({ mode: 'open' });

    const automaCSS = `.automa-element-selector { pointer-events: none; direction: ltr } \n [automa-isDragging] { user-select: none } \n [automa-el-list] {outline: 2px dashed #6366f1;}`;
    const automaStyleEl = generateStyleEl(automaCSS);

    initElementSelector(rootElement);
    await injectAppStyles(rootElement);

    document.documentElement.appendChild(rootElement);
    document.documentElement.appendChild(automaStyleEl);
  } catch (error) {
    console.error(error);
  }
})();
