import { openDB } from 'idb';
import Mousetrap from 'mousetrap';
import browser from 'webextension-polyfill';
import secrets from 'secrets';
import { sendMessage } from '@/utils/message';

Mousetrap.prototype.stopCallback = function () {
  return false;
};

function getTriggerBlock(workflow) {
  const drawflow = JSON.parse(workflow?.drawflow || '{}');

  if (!drawflow?.drawflow?.Home?.data) return null;

  const blocks = Object.values(drawflow.drawflow.Home.data);
  const trigger = blocks.find(({ name }) => name === 'trigger');

  return trigger;
}

async function listenWindowMessage(workflows) {
  try {
    if (secrets?.webOrigin !== window.location.origin) return;

    const db = await openDB('automa', 1, {
      upgrade(event) {
        event.createObjectStore('store');
      },
    });

    db.put('store', workflows, 'workflows');

    window.addEventListener('__automa-ext__', async ({ detail }) => {
      if (detail.type === 'open-workflow') {
        if (!detail.workflowId) return;

        sendMessage(
          'open:dashboard',
          `/workflows/${detail.workflowId}`,
          'background'
        );
      }
    });
  } catch (error) {
    console.error(error);
  }
}

(async () => {
  try {
    const { shortcuts, workflows } = await browser.storage.local.get([
      'shortcuts',
      'workflows',
    ]);
    const shortcutsArr = Object.entries(shortcuts || {});

    listenWindowMessage(workflows);

    document.body.setAttribute('data-atm-ext-installed', '');

    if (shortcutsArr.length === 0) return;

    const keyboardShortcuts = shortcutsArr.reduce((acc, [id, value]) => {
      const workflow = [...workflows].find((item) => item.id === id);

      (acc[value] = acc[value] || []).push({
        id,
        workflow,
        activeInInput: getTriggerBlock(workflow)?.data?.activeInInput,
      });

      return acc;
    }, {});

    Mousetrap.bind(Object.keys(keyboardShortcuts), ({ target }, command) => {
      const isInputElement =
        ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName) ||
        target?.contentEditable === 'true';

      keyboardShortcuts[command].forEach((item) => {
        if (!item.activeInInput && isInputElement) return;

        sendMessage('workflow:execute', item.workflow, 'background');
      });

      return true;
    });
  } catch (error) {
    console.error(error);
  }
})();
