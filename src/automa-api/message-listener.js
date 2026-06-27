import { MessageListener } from '@/utils/message';
import BrowserAPIService from '@/service/browser-api/BrowserAPIService';
import WorkflowManager from '@/workflowEngine/WorkflowManager';
import getBlockMessage from '@/utils/getBlockMessage';
import config from '@/automa-api/config.json';

const message = new MessageListener('automa-api');
const BASE_URL = config.BASE_URL;
const API_KEY = config.API_KEY;

// ============================================================================
// Workflow API Handlers
// ============================================================================

// API message handlers for external CDP access
// Note: MessageListener expects handlers to RETURN the response, not call sendResponse()
message.on('list-workflows', async () => {
    const { workflows, workflowHosts, teamWorkflows } =
        await BrowserAPIService.storage.local.get(['workflows', 'workflowHosts', 'teamWorkflows']);

    const allWorkflows = [];

    if (workflows) {
        const workflowList = Array.isArray(workflows) ? workflows : Object.values(workflows);
        allWorkflows.push(...workflowList);
    }

    if (workflowHosts) {
        allWorkflows.push(...Object.values(workflowHosts));
    }

    if (teamWorkflows) {
        Object.values(teamWorkflows).forEach((team) => {
            allWorkflows.push(...Object.values(team));
        });
    }

    return {
        success: true,
        workflows: allWorkflows,
    };
});

message.on('execute-workflow', (data) => {
    const { refNumber, workflow, options } = data;
    
    console.log(`[AUTOMA-API] execute-workflow called: refNumber=${refNumber}, workflow=${workflow?.name}`);
    
    const engine = WorkflowManager.instance.execute(workflow, options);

    // on workflow execution complete (i.e. engine.destroyed) listener
    engine.on('destroyed', async ({ id, status, history, blockDetail, ...rest }) => {
        console.log(`[AUTOMA-API] Workflow destroyed: refNumber=${refNumber}, status=${status}`);
        
        // Send completion notification to background script for API callbacks
        const workflowHistory = history.map((item) => {
            const cleanItem = { ...item };
            delete cleanItem.logId;
            delete cleanItem.prevBlockData;
            delete cleanItem.workerId;
            cleanItem.description = cleanItem.description || '';
            return cleanItem;
        });

        const completionResult = {
            executionId: id,
            status,
            success: status === 'success',
            error: status === 'error',
            isExecuting: false,
            message: status === 'error' ? getBlockMessage(blockDetail) : '',
            startedTimestamp: rest.startedTimestamp,
            endedTimestamp: rest.endedTimestamp,
            table: engine.referenceData?.table || [],
            variables: engine.referenceData?.variables || {},
            history: workflowHistory,
            workflow: workflow,
            refNumber: refNumber,
        };

        // send completion result back to the server to update the workflow execution status
        fetch(`${BASE_URL}/api/status/${refNumber}`, {
            method: 'PUT',
            body: JSON.stringify(completionResult),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
            },
        })
        .catch(error => {
            console.log('error', JSON.stringify(error));
            console.error('Failed to complete workflow execution:', error);
        });
    });

    // Return execution info back to the caller
    return {
        success: true,
        executionId: engine.id,
        refNumber,
    };
});


export default message;