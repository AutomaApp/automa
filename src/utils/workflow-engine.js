/* eslint-disable no-underscore-dangle */
import { toCamelCase } from './helper';
import * as blocksHandler from './blocks-handler';

class WorkflowEngine {
  constructor(workflow) {
    this.workflow = workflow;
    this.blocks = {};
    this.blocksArr = [];
    this.data = [];
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

  _blockHandler(block) {
    console.log(`${block.name}(${toCamelCase(block.name)}):`, block);
    const handler = blocksHandler[toCamelCase(block?.name)];

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
}

export default WorkflowEngine;
