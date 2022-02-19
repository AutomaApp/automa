import { getBlockConnection } from '../helper';

export default async function ({ data, outputs }) {
  const nextBlockId = getBlockConnection({ outputs });

  try {
    this.addDataToColumn(data.rowDataColumn, data.rowValue);

    return {
      nextBlockId,
      data: '',
    };
  } catch (error) {
    error.nextBlockId = nextBlockId;

    throw error;
  }
}
