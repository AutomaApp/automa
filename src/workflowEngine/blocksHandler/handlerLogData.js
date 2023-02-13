import getTranslateLog from '@/utils/getTranslateLog';
import { workflowState } from '../index';

export async function logData({ id, data }) {
  if (!data.workflowId) {
    throw new Error('No workflow is selected');
  }

  // 工作流状态数组
  const { states } = workflowState;
  let logs = [];
  if (states) {
    // 转换为数组
    const stateValues = Object.values(Object.fromEntries(states));
    // 当前工作流状态
    const curWorkflowState = stateValues.find(
      (item) => item.workflowId === data.workflowId
    )?.state;

    if (curWorkflowState) {
      // 当前工作流最新日志
      logs = getTranslateLog(curWorkflowState, 'json');

      if (data.assignVariable) {
        this.setVariable(data.variableName, logs);
      }
      if (data.saveData) {
        this.addDataToColumn(data.dataColumn, logs);
      }
    }
  }

  return {
    data: logs,
    nextBlockId: this.getBlockConnections(id),
  };
}

export default logData;
