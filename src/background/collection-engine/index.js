import { nanoid } from 'nanoid';
import browser from 'webextension-polyfill';
import { toCamelCase } from '@/utils/helper';
import * as flowHandler from './flow-handler';
import blocksHandler from '../workflow-engine/blocks-handler';
import WorkflowEngine from '../workflow-engine/engine';

const executedWorkflows = (workflows, options) => {
  if (workflows.length === 0) return;

  const workflow = workflows.shift();
  const engine = new WorkflowEngine(workflow, options);

  engine.init();

  setTimeout(() => {
    executedWorkflows(workflows, options);
  }, 500);
};

class CollectionEngine {
  constructor(collection, { states, logger }) {
    this.id = nanoid();
    this.states = states;
    this.logger = logger;
    this.collection = collection;

    this.data = [];
    this.history = [];
    this.workflows = [];

    this.isDestroyed = false;
    this.currentFlow = null;
    this.currentIndex = 0;
    this.eventListeners = {};

    this.executedWorkflow = {
      data: null,
      state: null,
    };

    this.onStatesUpdated = ({ data, id }) => {
      if (id === this.executedWorkflow.data?.id) {
        this.executedWorkflow.state = data.state;
        this.states.update(this.id, { state: this.state });
      }
    };
    this.onStatesStopped = (id) => {
      if (id !== this.id) return;

      this.stop();
    };
  }

  async init() {
    try {
      if (this.collection.flow.length === 0) return;

      const { workflows } = await browser.storage.local.get('workflows');

      this.workflows = workflows;
      this.startedTimestamp = Date.now();

      if (this.collection?.options.atOnce) {
        const filteredWorkflows = this.collection.flow.reduce(
          (acc, { itemId, type }) => {
            if (type !== 'workflow') return acc;

            const currentWorkflow = workflows.find(({ id }) => id === itemId);

            if (currentWorkflow) {
              acc.push(currentWorkflow);
            }

            return acc;
          },
          []
        );

        executedWorkflows(filteredWorkflows, {
          blocksHandler,
          states: this.states,
          logger: this.logger,
        });
      } else {
        await this.states.add(this.id, {
          state: this.state,
          collectionId: this.collection.id,
        });

        this.states.on('stop', this.onStatesStopped);
        this.states.on('update', this.onStatesUpdated);

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
    try {
      if (this.isDestroyed) return;

      this.isDestroyed = true;
      this.dispatchEvent('destroyed', { id: this.id });

      const { name, icon } = this.collection;

      await this.logger.add({
        name,
        icon,
        status,
        id: this.id,
        data: this.data,
        endedAt: Date.now(),
        history: this.history,
        collectionId: this.collection.id,
        startedAt: this.startedTimestamp,
      });

      await this.states.delete(this.id);

      this.states.off('stop', this.onStatesStopped);
      this.states.off('update', this.onStatesUpdated);

      this.listeners = {};
    } catch (error) {
      console.error(error);
    }
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
      currentIndex: this.currentIndex,
      executedWorkflow: this.executedWorkflow,
      startedTimestamp: this.startedTimestamp,
    };

    if (this.executedWorkflow.data) {
      data.currentBlock.push(this.executedWorkflow.data);
    }

    if (this.executedWorkflow.state) {
      data.currentBlock.push(this.executedWorkflow.state.currentBlock);
    }

    return data;
  }

  async stop() {
    try {
      if (this.executedWorkflow.data) {
        await this.states.stop(this.executedWorkflow.data.id);
      }

      setTimeout(() => {
        this.destroy('stopped');
      }, 1000);
    } catch (error) {
      console.error(error);
    }
  }

  async _flowHandler(flow) {
    const currentState = await this.states.get(this.id);

    if (!currentState || currentState.isDestroyed) {
      if (this.isDestroyed) return;

      await this.destroy('stopped');
      return;
    }

    const handlerName =
      flow.type === 'workflow' ? 'workflow' : toCamelCase(flow.itemId);
    const handler = flowHandler[handlerName];
    const started = Date.now();

    this.currentFlow = flow;
    await this.states.update(this.id, { state: this.state });

    if (!handler) {
      console.error(`"${flow.type}" flow doesn't have a handler`);
      return;
    }

    try {
      if (flow.type !== 'workflow') {
        this.executedWorkflow = {
          data: null,
          state: null,
        };
      }

      const data = await handler.call(this, flow);

      this.history.push({
        type: data.type || 'success',
        name: data.name,
        logId: data.id,
        message: data.message,
        duration: Math.round(Date.now() - started),
      });
      this.nextFlow();
    } catch (error) {
      this.history.push({
        type: 'error',
        name: error.name,
        logId: error.id,
        message: error.message,
        duration: Math.round(Date.now() - started),
      });

      this.nextFlow();
    }
  }
}

export default CollectionEngine;
