import { getBlocks } from '@/utils/getSharedData';
import dayjs from '@/lib/dayjs';
import vueI18n from '@/lib/vueI18n';
import { countDuration } from '@/utils/helper';
import { messageHasReferences } from '@/utils/shared';

const blocks = getBlocks();

/**
 * 转换日志
 * @param {*} log
 * @returns
 */
function translateLog(log) {
  const copyLog = { ...log };
  const getTranslatation = (path, def) => {
    const params = typeof path === 'string' ? { path } : path;

    return vueI18n.global.te(params.path)
      ? vueI18n.global.t(params.path, params.params)
      : def;
  };

  if (['finish', 'stop'].includes(log.type)) {
    copyLog.name = vueI18n.global.t(`log.types.${log.type}`);
  } else {
    copyLog.name = getTranslatation(
      `workflow.blocks.${log.name}.name`,
      blocks[log.name].name
    );
  }

  if (copyLog.message && messageHasReferences.includes(copyLog.message)) {
    copyLog.messageId = `${copyLog.message}`;
  }

  copyLog.message = getTranslatation(
    { path: `log.messages.${log.message}`, params: log },
    log.message
  );

  return copyLog;
}

function getDataSnapshot(propsCtxData, refData) {
  if (!propsCtxData?.dataSnapshot) return;

  const data = propsCtxData.dataSnapshot;
  const getData = (key) => {
    const currentData = refData[key];
    if (typeof currentData !== 'string') return currentData;

    return data[currentData] ?? {};
  };

  refData.loopData = getData('loopData');
  refData.variables = getData('variables');
}

/**
 * 获取日志
 * @param {*} dataType 日志数据类型
 * @param {*} translatedLog 转换后的日志
 * @returns
 */
function getLogs(dataType, translatedLog, curStateCtxData) {
  let data = dataType === 'plain-text' ? '' : [];
  const getItemData = {
    'plain-text': ([
      timestamp,
      duration,
      status,
      name,
      description,
      message,
      ctxData,
    ]) => {
      data += `${timestamp}(${countDuration(
        0,
        duration || 0
      ).trim()}) - ${status} - ${name} - ${description} - ${message} - ${JSON.stringify(
        ctxData
      )} \n`;
    },
    json: ([
      timestamp,
      duration,
      status,
      name,
      description,
      message,
      ctxData,
    ]) => {
      data.push({
        timestamp,
        duration: countDuration(0, duration || 0).trim(),
        status,
        name,
        description,
        message,
        data: ctxData,
      });
    },
  };
  translatedLog.forEach((item, index) => {
    let logData = curStateCtxData;
    if (logData.ctxData) logData = logData.ctxData;

    const itemData = logData[item.id] || null;
    if (itemData) getDataSnapshot(curStateCtxData, itemData.referenceData);

    getItemData[dataType](
      [
        dayjs(item.timestamp || Date.now()).format('YYYY-MM-DD HH:mm:ss'),
        item.duration,
        item.type.toUpperCase(),
        item.name,
        item.description || 'NULL',
        item.message || 'NULL',
        itemData,
      ],
      index
    );
  });
  return data;
}

/**
 * 获取日志数据
 * @param {*} curState 当前工作流状态
 * @param {*} dataType 日志数据类型 plain-text 和 json
 * @returns
 */
export default function (curState, dataType = 'plain-text') {
  const { logs: curStateHistory, ctxData: curStateCtxData } = curState;
  // 经过转换后的日志
  const translatedLog = curStateHistory.map(translateLog);
  // 获取日志
  const logs = getLogs(dataType, translatedLog, curStateCtxData);
  // 获取日志
  return logs;
}
