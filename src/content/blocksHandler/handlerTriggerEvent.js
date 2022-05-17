import { sendMessage } from '@/utils/message';
import simulateEvent from '@/utils/simulateEvent';
import simulateMouseEvent from '@/utils/simulateEvent/mouseEvent';
import { keyDefinitions } from '@/utils/USKeyboardLayout';
import { getElementPosition } from '../utils';
import handleSelector from '../handleSelector';

const modifiers = {
  altKey: 1,
  ctrlKey: 2,
  metKey: 3,
  shiftKey: 4,
};
const eventHandlers = {
  'mouse-event': async ({ params, sendCommand, name }) => {
    const mouseButtons = {
      0: { id: 1, name: 'left' },
      1: { id: 4, name: 'middle' },
      2: { id: 2, name: 'right' },
    };
    const commandParams = {
      button: mouseButtons[params.button]?.name || 'left',
    };

    if (params.clientX) commandParams.x = +params.clientX;
    if (params.clientY) commandParams.y = +params.clientY;

    Object.keys(modifiers).forEach((key) => {
      if (commandParams.modifiers) return;
      if (params[key]) commandParams.modifiers = modifiers[key];
    });

    const mouseEvents = simulateMouseEvent({ sendCommand, commandParams });
    const eventHandler = {
      mouseover: 'mouseenter',
      mouseout: 'mouseleave',
    };
    const eventName = eventHandler[name] || name;

    await mouseEvents[eventName]();
  },
  'keyboard-event': async ({ name, params, sendCommand }) => {
    const definition = keyDefinitions[params?.key];

    const commandParams = {
      key: params.key ?? '',
      code: params.code ?? '',
      autoRepeat: params.repeat,
      windowsVirtualKeyCode: params.keyCode ?? 0,
      type: name === 'keyup' ? 'keyUp' : 'keyDown',
    };

    if (definition.text || params.key.length === 1) {
      commandParams.text = definition.text || params.key;
    }

    Object.keys(modifiers).forEach((key) => {
      if (commandParams.modifiers) return;
      if (params[key]) commandParams.modifiers = modifiers[key];
    });

    await sendCommand('Input.dispatchKeyEvent', commandParams);
  },
};

function triggerEvent({ data, id, frameSelector, debugMode, activeTabId }) {
  return new Promise((resolve, reject) => {
    handleSelector(
      { data, id, frameSelector },
      {
        async onSelected(element) {
          const eventHandler = eventHandlers[data.eventType];

          if (debugMode && eventHandler) {
            let elCoordinate = {};

            if (data.eventType === 'mouse-event') {
              const { x, y } = await getElementPosition(element);
              elCoordinate = { x, y };
            }

            const sendCommand = (method, params = {}) => {
              const payload = {
                method,
                params: {
                  ...elCoordinate,
                  ...params,
                },
                tabId: activeTabId,
              };

              return sendMessage(
                'debugger:send-command',
                payload,
                'background'
              );
            };

            await eventHandler({
              element,
              sendCommand,
              name: data.eventName,
              params: data.eventParams,
            });

            return;
          }

          simulateEvent(element, data.eventName, data.eventParams);
        },
        onSuccess() {
          resolve(data.eventName);
        },
        onError(error) {
          reject(error);
        },
      }
    );

    resolve(data.eventName);
  });
}

export default triggerEvent;
