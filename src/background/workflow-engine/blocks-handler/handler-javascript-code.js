import { getBlockConnection } from '../helper';

export async function javascriptCode({ outputs, data, ...block }, { refData }) {
  const nextBlockId = getBlockConnection({ outputs });

  try {
    if (data.everyNewTab) {
      const isScriptExist = this.preloadScripts.find(
        ({ id }) => id === block.id
      );

      if (!isScriptExist) {
        this.preloadScripts.push({ ...block, data });
      }
    }
    if (!this.activeTab.id) {
      if (!data.everyNewTab) {
        throw new Error('no-tab');
      } else {
        return { data: '', nextBlockId };
      }
    }

    const result = await this._sendMessageToTab({ ...block, data, refData });

    if (result?.variables) {
      Object.keys(result.variables).forEach((varName) => {
        this.setVariable(varName, result.variables[varName]);
      });
    }
    if (result?.columns.insert) {
      const params = Array.isArray(result.columns.data)
        ? result.columns.data
        : [result.columns.data];

      this.addDataToColumn(params);
    }

    return {
      nextBlockId,
      data: result?.columns.data || {},
    };
  } catch (error) {
    error.nextBlockId = nextBlockId;

    throw error;
  }
}

export default javascriptCode;
