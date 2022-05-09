import browser from 'webextension-polyfill';
import initElementSelector from './main';
import injectAppStyles from '../injectAppStyles';

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

    initElementSelector(rootElement);
    await injectAppStyles(rootElement.shadowRoot);

    document.documentElement.appendChild(rootElement);
  } catch (error) {
    console.error(error);
  }
})();
