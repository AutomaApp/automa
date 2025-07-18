import { postRunAPWorkflow } from '@/utils/getAIPoweredInfo';

async function aiWorkflow(block) {
  const {
    flowUuid,
    inputs,
    assignVariable,
    variableName,
    saveData,
    dataColumn,
  } = block.data;

  const aipowerToken = this.engine.workflow.settings?.aipowerToken;

  if (!aipowerToken) {
    throw Error('aipower Token is not set');
  }

  const input = Object.fromEntries(
    inputs.map((item) => [item.name, item.value])
  );

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
    };
  } catch (error) {
    console.error('ai workflow run failed', error);
    throw Error('ai workflow run failed', error.message);
  }
}

export default aiWorkflow;
