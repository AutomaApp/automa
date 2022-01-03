class WorkflowLogger {
  constructor({ storage, key = 'logs' }) {
    this.key = key;
    this.storage = storage;
  }

  async add(data) {
    const logs = (await this.storage.get(this.key)) || {};

    logs.unshift(data);

    await this.storage.set(this.key, logs);
  }
}

export default WorkflowLogger;
