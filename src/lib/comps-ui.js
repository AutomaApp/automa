import VAutofocus from '../directives/VAutofocus';
import VClosePopover from '../directives/VClosePopover';

const uiComponents = require.context('../components/ui', false, /\.vue$/);
const transitionComponents = require.context(
  '../components/transitions',
  false,
  /\.vue$/
);

function componentsExtractor(app, components) {
  components.keys().forEach((key) => {
    const componentName = key.replace(/(.\/)|\.vue$/g, '');
    const component = components(key)?.default ?? {};

    app.component(componentName, component);
  });
}

export default function (app) {
  app.directive('autofocus', VAutofocus);
  app.directive('close-popover', VClosePopover);
  console.log(app);
  componentsExtractor(app, uiComponents);
  componentsExtractor(app, transitionComponents);
}
