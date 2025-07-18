import { postRunAPWorkflow } from '@/utils/getAIPoweredInfo';
import renderString from '../templating/renderString';

async function aiWorkflow(block, { refData }) {
  const {
    flowUuid,
    inputs,
    assignVariable,
    variableName,
    saveData,
    dataColumn,
  } = block.data;

  const replacedValueList = {};

  const aipowerToken = this.engine.workflow.settings?.aipowerToken;

  if (!aipowerToken) {
    throw Error('aipower Token is not set');
  }

  const input = {};
  for (const item of inputs) {
    const renderedValue = await renderString(
      item.value,
      refData,
      this.engine.isPopup
    );
    input[item.name] = renderedValue.value;
    Object.assign(replacedValueList, renderedValue.list);
  }

  try {
    const runResponse = await postRunAPWorkflow(
      { flowUuid, input },
      aipowerToken
    );
    const { success } = runResponse;

    if (!success) {
      throw Error('ai workflow run failed', runResponse.msg);
    }

    if (assignVariable) {
      this.setVariable(variableName, runResponse.data.result);
    }

    if (saveData) {
      this.addDataToColumn(dataColumn, runResponse.data.result);
    }

    const nextBlockId = this.getBlockConnections(block.id);

    return {
      data: runResponse.data.result,
      nextBlockId,
      replacedValue: replacedValueList,
    };
  } catch (error) {
    console.error('ai workflow run failed', error);
    throw Error('ai workflow run failed', error.message);
  }
}

export default aiWorkflow;
