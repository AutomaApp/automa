import initApp from './main';
import injectAppStyles from '../injectAppStyles';

function pageLoaded() {
  return new Promise((resolve) => {
    const checkDocState = () => {
      if (document.readyState === 'loading') {
        setTimeout(checkDocState, 1000);
        return;
      }

      resolve();
    };

    checkDocState();
  });
}

export default async function () {
  try {
    const isMainFrame = window.self === window.top;
    if (!isMainFrame) return;

    await pageLoaded();

    const instanceExist = document.querySelector('automa-palette');
    if (instanceExist) return;

    const element = document.createElement('div');
    element.attachShadow({ mode: 'open' });
    element.id = 'automa-palette';

    await injectAppStyles(element.shadowRoot);
    initApp(element);

    document.body.appendChild(element);
  } catch (error) {
    console.error(error);
  }
}
