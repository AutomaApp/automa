import { openDB } from 'idb';
import { nanoid } from 'nanoid';
import browser from 'webextension-polyfill';
import deepmerge from 'lodash.merge';
import { sendMessage } from '@/utils/message';
import { objectHasKey, parseJSON } from '@/utils/helper';

function initWebListener() {
  const listeners = {};

  function on(name, callback) {
    (listeners[name] = listeners[name] || []).push(callback);
  }

  window.addEventListener('__automa-ext__', ({ detail }) => {
    if (!detail || !objectHasKey(listeners, detail.type)) return;

    listeners[detail.type].forEach((listener) => {
      listener(detail.data);
    });
  });

  return { on };
}

window.addEventListener('DOMContentLoaded', async () => {
  try {
    document.body.setAttribute(
      'data-atm-ext-installed',
      browser.runtime.getManifest().version
    );

    const { workflows } = await browser.storage.local.get('workflows');
    const db = await openDB('automa', 1, {
      upgrade(event) {
        event.createObjectStore('store');
      },
    });

    await db.put('store', workflows, 'workflows');

    const session =
      parseJSON(localStorage.getItem('supabase.auth.token'), null)
        ?.currentSession ?? null;
    await browser.storage.local.set({ session });

    const webListener = initWebListener();
    webListener.on('open-dashboard', ({ path }) => {
      if (!path) return;

      sendMessage('open:dashboard', path, 'background');
    });
    webListener.on('open-workflow', ({ workflowId }) => {
      if (!workflowId) return;

      sendMessage('open:dashboard', `/workflows/${workflowId}`, 'background');
    });
    webListener.on('add-workflow', async ({ workflow }) => {
      try {
        const { workflows: workflowsStorage } = await browser.storage.local.get(
          'workflows'
        );

        const workflowId = nanoid();
        const workflowData = {
          ...workflow,
          id: workflowId,
          dataColumns: [],
          createdAt: Date.now(),
          table: workflow.table || workflow.dataColumns,
        };

        workflowData.drawflow =
          typeof workflowData.drawflow === 'string'
            ? parseJSON(workflowData.drawflow, workflowData.drawflow)
            : workflowData.drawflow;

        if (Array.isArray(workflowsStorage)) {
          workflowsStorage.push(workflowData);
        } else {
          workflowsStorage[workflowId] = workflowData;
        }

        await browser.storage.local.set({ workflows: workflowsStorage });
        sendMessage('workflow:added', { workflowId }, 'background');
      } catch (error) {
        console.error(error);
      }
    });
    webListener.on('add-team-workflow', async ({ workflow }) => {
      let { teamWorkflows } = await browser.storage.local.get('teamWorkflows');

      let workflowData = {
        ...workflow,
        createdAt: Date.now(),
        table: workflow.table ?? [],
      };
      workflowData.drawflow =
        typeof workflowData.drawflow === 'string'
          ? parseJSON(workflowData.drawflow, workflowData.drawflow)
          : workflowData.drawflow;

      if (!teamWorkflows) teamWorkflows = {};
      if (!teamWorkflows[workflowData.teamId])
        teamWorkflows[workflowData.teamId] = {};

      const workflowToMerge =
        teamWorkflows[workflowData.teamId][workflow.id] || null;
      if (workflowToMerge) {
        workflowData = deepmerge(workflowToMerge, workflowData);
      }

      teamWorkflows[workflowData.teamId][workflow.id] = workflowData;
      await browser.storage.local.set({ teamWorkflows });

      const triggerBlock = workflowData.drawflow.nodes?.find(
        (node) => node.label === 'trigger'
      );
      if (triggerBlock) {
        await sendMessage(
          'workflow:register',
          { triggerBlock, workflowId: workflowData.id },
          'background'
        );
      }

      sendMessage(
        'workflow:added',
        {
          workflowId: workflowData.id,
          teamId: workflowData.teamId,
          source: 'team',
        },
        'background'
      );
    });
    webListener.on('check-team-workflow', async ({ teamId, workflowId }) => {
      const { teamWorkflows } = await browser.storage.local.get(
        'teamWorkflows'
      );
      const workflowExist = Boolean(teamWorkflows?.[teamId]?.[workflowId]);

      window.dispatchEvent(
        new CustomEvent('__automa-team-workflow__', {
          detail: { exists: workflowExist },
        })
      );
    });
  } catch (error) {
    console.error(error);
  }
});
