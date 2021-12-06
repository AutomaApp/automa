import { nanoid } from 'nanoid';
import browser from 'webextension-polyfill';
import { toCamelCase } from '@/utils/helper';
import * as flowHandler from './flow-handler';
import workflowState from '../workflow-state';
import workflowEngine from '../workflow-engine';

class CollectionEngine {
  constructor(collection) {
    this.id = nanoid();
    this.collection = collection;
    this.workflows = [];
    this.data = [];
    this.logs = [];
    this.isDestroyed = false;
    this.currentFlow = null;
    this.workflowState = null;
    this.workflowEngine = null;
    this.currentWorkflow = null;
    this.currentIndex = 0;
    this.eventListeners = {};
  }

  async init() {
    try {
      if (this.collection.flow.length === 0) return;

      const { workflows } = await browser.storage.local.get('workflows');

      this.workflows = workflows;
      this.startedTimestamp = Date.now();

      if (this.collection?.options.atOnce) {
        this.collection.flow.forEach(({ itemId, type }) => {
          if (type !== 'workflow') return;

          const currentWorkflow = workflows.find(({ id }) => id === itemId);

          if (currentWorkflow) {
            const engine = workflowEngine(currentWorkflow, {});

            engine.init();
          }
        });
      } else {
        await workflowState.add(this.id, {
          state: this.state,
          isCollection: true,
          collectionId: this.collection.id,
        });
        this._flowHandler(this.collection.flow[0]);
      }
    } catch (error) {
      console.error(error);
    }
  }

  on(name, listener) {
    (this.eventListeners[name] = this.eventListeners[name] || []).push(
      listener
    );
  }

  dispatchEvent(name, params) {
    const listeners = this.eventListeners[name];

    if (!listeners) return;

    listeners.forEach((callback) => {
      callback(params);
    });
  }

  async destroy(status) {
    this.isDestroyed = true;
    this.dispatchEvent('destroyed', { id: this.id });

    const { logs } = await browser.storage.local.get('logs');
    const { name, icon } = this.collection;

    logs.push({
      name,
      icon,
      status,
      id: this.id,
      data: this.data,
      history: this.logs,
      endedAt: Date.now(),
      collectionId: this.collection.id,
      startedAt: this.startedTimestamp,
    });

    await browser.storage.local.set({ logs });
    await workflowState.delete(this.id);

    this.listeners = {};
  }

  nextFlow() {
    this.currentIndex += 1;

    if (this.currentIndex >= this.collection.flow.length) {
      this.destroy('success');

      return;
    }

    this._flowHandler(this.collection.flow[this.currentIndex]);
  }

  get state() {
    const data = {
      id: this.id,
      currentBlock: [],
      name: this.collection.name,
      startedTimestamp: this.startedTimestamp,
    };

    if (this.currentWorkflow) {
      const { name, icon } = this.currentWorkflow;

      data.currentBlock.push({ name, icon });
    }

    if (this.workflowState) {
      const { name } = this.workflowState.currentBlock;

      data.currentBlock.push({ name });
    }

    return data;
  }

  updateState() {
    workflowState.update(this.id, this.state);
  }

  stop() {
    this.workflowEngine.stop();

    this.destroy('stopped');
  }

  _flowHandler(flow) {
    if (this.isDestroyed) return;

    const handlerName =
      flow.type === 'workflow' ? 'workflow' : toCamelCase(flow.itemId);
    const handler = flowHandler[handlerName];
    const started = Date.now();

    this.currentFlow = flow;
    this.updateState();

    if (handler) {
      if (flow.type !== 'workflow') {
        this.workflowState = null;
        this.currentWorkflow = null;
        this.workflowEngine = null;
      }

      handler
        .call(this, flow)
        .then((data) => {
          this.logs.push({
            type: data.type || 'success',
            name: data.name,
            logId: data.id,
            message: data.message,
            duration: Math.round(Date.now() - started),
          });

          this.nextFlow();
        })
        .catch((error) => {
          this.logs.push({
            type: 'error',
            name: error.name,
            logId: error.id,
            message: error.message,
            duration: Math.round(Date.now() - started),
          });

          this.nextFlow();
        });
    } else {
      console.error(`"${flow.type}" flow doesn't have a handler`);
    }
  }
}

export default CollectionEngine;
