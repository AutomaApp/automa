import browser from 'webextension-polyfill';
import dayjs from '@/lib/dayjs';
import { useWorkflowStore } from '@/stores/workflow';
import decryptFlow, { getWorkflowPass } from '@/utils/decryptFlow';
import { parseJSON } from '@/utils/helper';
import { fetchApi } from '@/utils/api';
import getBlockMessage from '@/utils/getBlockMessage';
import convertWorkflowData from '@/utils/convertWorkflowData';
import WorkflowState from './WorkflowState';
import WorkflowLogger from './WorkflowLogger';
import WorkflowEngine from './WorkflowEngine';
import blocksHandler from './blocksHandler';

const workflowStateStorage = {
  get() {
    const workflowStore = useWorkflowStore();
    return workflowStore.states;
  },
  set(key, value) {
    const workflowStore = useWorkflowStore();
    const states = Object.values(value);

    browser.storage.local.set({ workflowStates: states });
    workflowStore.updateStates(states);
  },
};
const browserStorage = {
  async get(key) {
    try {
      const result = await browser.storage.local.get(key);

      return result[key];
    } catch (error) {
      console.error(error);
      return [];
    }
  },
  async set(key, value) {
    await browser.storage.local.set({ [key]: value });

    if (key === 'workflowState') {
      sessionStorage.setItem(key, JSON.stringify(value));
    }
  },
};

export const workflowLogger = new WorkflowLogger({ storage: browserStorage });
export const workflowState = new WorkflowState({
  storage: workflowStateStorage,
});

export function executeWorkflow(workflowData, options) {
  if (workflowData.isDisabled) return null;
  if (workflowData.isProtected) {
    const flow = parseJSON(workflowData.drawflow, null);

    if (!flow) {
      const pass = getWorkflowPass(workflowData.pass);

      workflowData.drawflow = decryptFlow(workflowData, pass);
    }
  }

  const convertedWorkflow = convertWorkflowData(workflowData);
  const engine = new WorkflowEngine(convertedWorkflow, {
    options,
    states: workflowState,
    logger: workflowLogger,
    blocksHandler: blocksHandler(),
  });

  engine.init();
  engine.on(
    'destroyed',
    ({
      id,
      status,
      history,
      startedTimestamp,
      endedTimestamp,
      blockDetail,
    }) => {
      if (workflowData.id.startsWith('team') && workflowData.teamId) {
        const payload = {
          status,
          workflowId: workflowData.id,
          workflowLog: {
            status,
            endedTimestamp,
            startedTimestamp,
          },
        };

        if (status === 'error') {
          const message = getBlockMessage(blockDetail);
          const workflowHistory = history.map((item) => {
            delete item.logId;
            delete item.prevBlockData;
            delete item.workerId;

            item.description = item.description || '';

            return item;
          });
          payload.workflowLog = {
            status,
            message,
            endedTimestamp,
            startedTimestamp,
            history: workflowHistory,
            blockId: blockDetail.blockId,
          };
        }

        fetchApi(`/teams/${workflowData.teamId}/workflows/logs`, {
          method: 'POST',
          body: JSON.stringify(payload),
        }).catch((error) => {
          console.error(error);
        });
      }

      if (status !== 'stopped') {
        browser.permissions
          .contains({ permissions: ['notifications'] })
          .then((hasPermission) => {
            if (!hasPermission || !workflowData.settings.notification) return;

            const name = workflowData.name.slice(0, 32);

            browser.notifications.create(`logs:${id}`, {
              type: 'basic',
              iconUrl: browser.runtime.getURL('icon-128.png'),
              title: status === 'success' ? 'Success' : 'Error',
              message: `${
                status === 'success' ? 'Successfully' : 'Failed'
              } to run the "${name}" workflow`,
            });
          });
      }
    }
  );

  const lastCheckStatus = localStorage.getItem('check-status');
  const isSameDay = dayjs().isSame(lastCheckStatus, 'day');
  if (!isSameDay) {
    fetchApi('/status')
      .then((response) => response.json())
      .then(() => {
        localStorage.setItem('check-status', new Date());
      });
  }

  return engine;
}
