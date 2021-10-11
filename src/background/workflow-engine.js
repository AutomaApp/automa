/* eslint-disable no-underscore-dangle */
import browser from 'webextension-polyfill';
import { toCamelCase } from '@/utils/helper';
import { tasks } from '@/utils/shared';
import * as blocksHandler from './blocks-handler';

function tabMessageListenerHandler({ type, data }) {
  const listener = this.tabMessageListeners[type];

  if (listener) {
    listener.callback(data);

    if (listener.once) delete this.tabMessageListeners[type];
  }
}
function tabRemovedListener(tabId) {
  if (tabId !== this.tabId) return;

  this.connectedTab?.onMessage.removeListener(this.tabMessageListenerHandler);
  this.connectedTab?.disconnect();

  delete this.connectedTab;
  delete this.tabId;
}

class WorkflowEngine {
  constructor(workflow) {
    this.workflow = workflow;
    this.blocks = {};
    this.blocksArr = [];
    this.data = [];
    this.isDestroyed = false;
    this.isPaused = false;
    this.logs = [];

    this.tabMessageListeners = {};
    this.tabRemovedListener = tabRemovedListener.bind(this);
    this.tabMessageListenerHandler = tabMessageListenerHandler.bind(this);
  }

  init() {
    const drawflowData =
      typeof this.workflow.drawflow === 'string'
        ? JSON.parse(this.workflow.drawflow || '{}')
        : this.workflow.drawflow;
    const blocks = drawflowData?.drawflow.Home.data;

    if (!blocks) return;

    const blocksArr = Object.values(blocks);
    const triggerBlock = blocksArr.find(({ name }) => name === 'trigger');

    if (!triggerBlock) {
      console.error('A trigger block is required');
      return;
    }
    /* to do: pause if website is loading and inject content-script */
    browser.tabs.onRemoved.addListener(this.tabRemovedListener);

    this.blocks = blocks;
    this.blocksArr = blocksArr;

    this._blockHandler(triggerBlock);
  }

  destroy() {
    // save log
    browser.tabs.onRemoved.removeListener(this.tabRemovedListener);

    this.isDestroyed = true;
  }

  _blockHandler(block, prevBlockData) {
    if (this.isDestroyed) {
      console.log(
        '%cDestroyed',
        'color: red; font-size: 24px; font-weight: bold'
      );
      return;
    }
    if (this.isPaused) {
      setTimeout(() => {
        this._blockHandler(block, prevBlockData);
      }, 1000);

      return;
    }
    console.log(`${block.name}:`, block);
    const isInteraction = tasks[block.name].category === 'interaction';
    const handlerName = isInteraction
      ? 'interactionHandler'
      : toCamelCase(block?.name);
    const handler = blocksHandler[handlerName];

    if (handler) {
      handler
        .call(this, block, prevBlockData)
        .then((result) => {
          if (result.nextBlockId) {
            this._blockHandler(this.blocks[result.nextBlockId], result.data);
          } else {
            console.log('Done');
          }
        })
        .catch((error) => {
          console.error(error, 'new');
        });
    } else {
      console.error(`"${block.name}" block doesn't have a handler`);
    }
  }

  _connectTab(tabId) {
    const connectedTab = browser.tabs.connect(tabId, {
      name: `${this.workflow.id}--${this.workflow.name.slice(0, 10)}`,
    });

    if (this.connectedTab) {
      this.connectedTab.onMessage.removeListener(
        this.tabMessageListenerHandler
      );
      this.connectedTab.disconnect();
    }

    console.log('===Message Listener===');
    connectedTab.onMessage.addListener(this.tabMessageListenerHandler);

    this.connectedTab = connectedTab;
    this.tabId = tabId;

    return connectedTab;
  }

  _listenTabMessage(name, callback, options = { once: false }) {
    this.tabMessageListeners[name] = { callback, ...options };

    return () => {
      delete this.tabMessageListeners[name];
    };
  }

  get _connectedTab() {
    if (!this.connectedTab) {
      this.destroy();

      return null;
    }

    return this.connectedTab;
  }
}

export default WorkflowEngine;
