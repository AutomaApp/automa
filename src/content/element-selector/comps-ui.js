import VAutofocus from '@/directives/VAutofocus';
import UiTab from '@/components/ui/UiTab.vue';
import UiTabs from '@/components/ui/UiTabs.vue';
import UiInput from '@/components/ui/UiInput.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiSelect from '@/components/ui/UiSelect.vue';
import UiTextarea from '@/components/ui/UiTextarea.vue';
import UiCheckbox from '@/components/ui/UiCheckbox.vue';
import UiTabPanel from '@/components/ui/UiTabPanel.vue';
import UiTabPanels from '@/components/ui/UiTabPanels.vue';
import TransitionExpand from '@/components/transitions/TransitionExpand.vue';

export default function (app) {
  app.component('UiTab', UiTab);
  app.component('UiTabs', UiTabs);
  app.component('UiInput', UiInput);
  app.component('UiButton', UiButton);
  app.component('UiSelect', UiSelect);
  app.component('UiTextarea', UiTextarea);
  app.component('UiCheckbox', UiCheckbox);
  app.component('UiTabPanel', UiTabPanel);
  app.component('UiTabPanels', UiTabPanels);
  app.component('TransitionExpand', TransitionExpand);

  app.directive('autofocus', VAutofocus);
}
