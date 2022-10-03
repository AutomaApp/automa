import BackgroundUtils from './BackgroundUtils';
import BackgroundRecordWorkflow from './BackgroundRecordWorkflow';
import BackgroundWorkflowTriggers from './BackgroundWorkflowTriggers';

class BackgroundEventsListeners {
  static onActionClicked() {
    BackgroundUtils.openDashboard();
  }

  static onAlarms(event) {
    BackgroundWorkflowTriggers.scheduleWorkflow(event);
  }

  static onWebNavigationCompleted({ tabId, url, frameId }) {
    if (frameId > 0) return;

    BackgroundRecordWorkflow.checkRecording(tabId, url);
    BackgroundWorkflowTriggers.visitWebTriggers(tabId, url);
  }
}

export default BackgroundEventsListeners;
