import { MessageListener } from '@/utils/message';
import { toRaw } from 'vue';

class RendererWorkflowService {
  static executeWorkflow(workflowData, options) {
    /**
     * Convert Vue-created proxy into plain object.
     * It will throw error if there a proxy inside the object.
     */
    const clonedWorkflowData = {};
    Object.keys(workflowData).forEach((key) => {
      clonedWorkflowData[key] = toRaw(workflowData[key]);
    });

    return MessageListener.sendMessage(
      'workflow:execute',
      { ...workflowData, options },
      'background'
    );
  }

  static stopWorkflowExecution(executionId) {
    return MessageListener.sendMessage(
      'workflow:stop',
      executionId,
      'background'
    );
  }
}

export default RendererWorkflowService;
