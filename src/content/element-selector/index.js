async function getStyles() {
  try {
    const response = await fetch(chrome.runtime.getURL('/elementSelector.css'));
    const mainCSS = await response.text();

    const fontCSS = `
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
function getLocale() {
  return new Promise((resolve) => {
    chrome.storage.local.get('settings', ({ settings }) => {
      resolve(settings?.locale || 'en');
    });
  });
}

export default async function () {
  try {
    const rootElement = document.createElement('div');
    rootElement.classList.add('automa-element-selector');
    rootElement.attachShadow({ mode: 'open' });

    const automaStyle = document.createElement('style');
    automaStyle.classList.add('automa-element-selector');
    automaStyle.innerHTML = `.automa-element-selector { pointer-events: none } \n [automa-isDragging] { user-select: none }`;

    const scriptEl = document.createElement('script');
    scriptEl.setAttribute('type', 'module');
    scriptEl.setAttribute(
      'src',
      chrome.runtime.getURL('/elementSelector.bundle.js')
    );

    const appContainer = document.createElement('div');
    appContainer.setAttribute('data-id', chrome.runtime.id);
    appContainer.setAttribute('data-locale', await getLocale());
    appContainer.setAttribute('id', 'app');

    const appStyle = document.createElement('style');
    appStyle.innerHTML = await getStyles();

    rootElement.shadowRoot.appendChild(appContainer);
    rootElement.shadowRoot.appendChild(appStyle);
    rootElement.shadowRoot.appendChild(scriptEl);

    document.documentElement.appendChild(rootElement);
    document.documentElement.appendChild(automaStyle);
  } catch (error) {
    console.error(error);
  }
}
