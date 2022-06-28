import dbLogs from '@/db/logs';

export async function logData({ id, data }) {
  if (!data.workflowId) {
    console.log(data);
    throw new Error('No workflow is selected');
  }

  const [workflowLog] = await dbLogs.items
    .where('workflowId')
    .equals(data.workflowId)
    .reverse()
    .sortBy('endedAt');
  let workflowLogData = null;

  if (workflowLog) {
    workflowLogData = (
      await dbLogs.logsData.where('logId').equals(workflowLog.id).first()
    ).data;

    if (data.assignVariable) {
      this.setVariable(data.variableName, workflowLogData);
    }
    if (data.saveData) {
      this.addDataToColumn(data.dataColumn, workflowLogData);
    }
  }

  return {
    data: workflowLogData,
    nextBlockId: this.getBlockConnections(id),
  };
}

export default logData;
