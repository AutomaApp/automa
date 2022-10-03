import BackgroundUtils from './BackgroundUtils';
import BackgroundWorkflowTriggers from './BackgroundWorkflowTriggers';

class BackgroundEventsListeners {
  static onActionClicked() {
    BackgroundUtils.openDashboard();
  }

  static async onAlarms(event) {
    BackgroundWorkflowTriggers.scheduleWorkflow(event);
  }
}

export default BackgroundEventsListeners;
