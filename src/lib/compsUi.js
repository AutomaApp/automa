import VAutofocus from '../directives/VAutofocus';
import VClosePopover from '../directives/VClosePopover';
import VTooltip from '../directives/VTooltip';

const uiModules = import.meta.glob('../components/ui/*.vue', { eager: true });
const transitionModules = import.meta.glob('../components/transitions/*.vue', {
  eager: true,
});

function registerModules(app, modules) {
  Object.entries(modules).forEach(([path, mod]) => {
    const componentName = path
      .split('/')
      .pop()
      .replace(/\.vue$/, '');
    const component = mod?.default ?? {};
    app.component(componentName, component);
  });
}

export default function (app) {
  app.directive('tooltip', VTooltip);
  app.directive('autofocus', VAutofocus);
  app.directive('close-popover', VClosePopover);

  registerModules(app, uiModules);
  registerModules(app, transitionModules);
}
