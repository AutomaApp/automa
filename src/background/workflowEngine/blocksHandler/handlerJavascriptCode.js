export async function javascriptCode({ outputs, data, ...block }, { refData }) {
  const nextBlockId = this.getBlockConnections(block.id);

  if (data.everyNewTab) {
    const isScriptExist = this.preloadScripts.find(({ id }) => id === block.id);

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

  if (!data.code.includes('automaNextBlock'))
    payload.data.code += `\nautomaNextBlock()`;

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
}

export default javascriptCode;
