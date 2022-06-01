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

    const payload = { ...block, data, refData: { variables: {} } };
    if (data.code.includes('automaRefData')) payload.refData = refData;
    console.log(data.code.includes('automaRefData'), payload);

    const result = await this._sendMessageToTab(payload);

    if (result) {
      if (result.columns.data?.$error) {
        throw new Error(result.columns.data.message);
      }

      if (result.variables) {
        Object.keys(result.variables).forEach((varName) => {
          this.setVariable(varName, result.variables[varName]);
        });
      }

      if (result.columns.insert && result.columns.data) {
        const params = Array.isArray(result.columns.data)
          ? result.columns.data
          : [result.columns.data];

        this.addDataToColumn(params);
      }
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
