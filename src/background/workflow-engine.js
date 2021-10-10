/* eslint-disable no-underscore-dangle */
import browser from 'webextension-polyfill';
import { toCamelCase } from '@/utils/helper';
import * as blocksHandler from './blocks-handler';

function tabMessageListener(a, b) {
  console.log(a, b);
}

class WorkflowEngine {
  constructor(workflow) {
    this.workflow = workflow;
    this.blocks = {};
    this.blocksArr = [];
    this.data = [];
    this.isDestroyed = false;

    this.tabMessageListener = tabMessageListener.bind(this);
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

    this.blocks = blocks;
    this.blocksArr = blocksArr;

    this._blockHandler(triggerBlock);
  }

  destroy() {
    // Add 'destroyed' log

    this.isDestroyed = true;
  }

  _blockHandler(block) {
    if (this.isDestroyed) return;

    console.log(`${block.name}(${toCamelCase(block.name)}):`, block);
    const handler = blocksHandler[toCamelCase(block?.name)];
    /* pass data from prev block */
    if (handler) {
      handler
        .call(this, block)
        .then((result) => {
          if (result.nextBlockId) {
            this._blockHandler(this.blocks[result.nextBlockId]);
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
    const tabRemovedListener = (id) => {
      if (id !== tabId) return;

      this.destroy();
      this.connectedTab.removeListener(this.tabMessageListener);
      this.connectedTab.disconnect();

      delete this.connectedTab;
      delete this.tabId;

      browser.tabs.onRemoved.removeListener(tabRemovedListener);
    };

    const connectedTab = browser.tabs.connect(tabId, {
      name: `${this.workflow.id}--${this.workflow.name.slice(0, 10)}`,
    });

    if (!this.connectedTab) {
      browser.tabs.onRemoved.addListener(tabRemovedListener);
    } else {
      // Add connectedTab message listener
    }

    this.connectedTab = connectedTab;
    this.tabId = tabId;

    return connectedTab;
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
