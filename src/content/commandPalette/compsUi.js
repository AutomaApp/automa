import VAutofocus from '@/directives/VAutofocus';
import UiCard from '@/components/ui/UiCard.vue';
import UiInput from '@/components/ui/UiInput.vue';
import UiList from '@/components/ui/UiList.vue';
import UiListItem from '@/components/ui/UiListItem.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiSelect from '@/components/ui/UiSelect.vue';
import UiSpinner from '@/components/ui/UiSpinner.vue';
import UiTextarea from '@/components/ui/UiTextarea.vue';
import TransitionExpand from '@/components/transitions/TransitionExpand.vue';

export default function (app) {
  app.component('UiCard', UiCard);
  app.component('UiList', UiList);
  app.component('UiListItem', UiListItem);
  app.component('UiInput', UiInput);
  app.component('UiButton', UiButton);
  app.component('UiSelect', UiSelect);
  app.component('UiSpinner', UiSpinner);
  app.component('UiTextarea', UiTextarea);
  app.component('TransitionExpand', TransitionExpand);

  app.directive('autofocus', VAutofocus);
}
