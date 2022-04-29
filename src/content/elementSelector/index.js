import browser from 'webextension-polyfill';
import initElementSelector from './main';

async function getStyles() {
  try {
    const response = await fetch(chrome.runtime.getURL('/elementSelector.css'));
    const mainCSS = await response.text();

    const fontCSS = `
      :host { font-size: 16px }
      @font-face {
        font-family: Inter var;
        font-weight: 100 900;
        font-display: swap;
        font-style: normal;
        font-named-instance: "Regular";
        src: url('${chrome.runtime.getURL(
          '/Inter-roman-latin.var.woff2'
        )}') format("woff2");
      }
    `;

    return `${mainCSS}\n${fontCSS}`;
  } catch (error) {
    console.error(error);
    return '';
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

    const automaStyle = document.createElement('style');
    automaStyle.classList.add('automa-element-selector');
    automaStyle.innerHTML = `.automa-element-selector { pointer-events: none; direction: ltr } \n [automa-isDragging] { user-select: none } \n [automa-el-list] {outline: 2px dashed #6366f1;}`;

    initElementSelector(rootElement);

    const appStyle = document.createElement('style');
    appStyle.innerHTML = await getStyles();

    rootElement.shadowRoot.appendChild(appStyle);

    document.documentElement.appendChild(rootElement);
    document.documentElement.appendChild(automaStyle);
  } catch (error) {
    console.error(error);
  }
})();
