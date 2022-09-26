import BackgroundUtils from './BackgroundUtils';

class BackgroundEventsListeners {
  static onActionClicked() {
    BackgroundUtils.openDashboard();
  }
}

export default BackgroundEventsListeners;
