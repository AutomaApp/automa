import VAutofocus from '../directives/VAutofocus';

const uiComponents = require.context('../components/ui', false, /\.vue$/);

function componentsExtractor(app, components) {
  components.keys().forEach((key) => {
    const componentName = key.replace(/(.\/)|\.vue$/g, '');
    const component = components(key)?.default ?? {};

    app.component(componentName, component);
  });
}

export default function (app) {
  console.log(app, 'anana');
  app.directive('autofocus', VAutofocus);

  componentsExtractor(app, uiComponents);
}
