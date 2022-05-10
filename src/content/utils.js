export function automaRefDataStr(stateId) {
  return `
function findData(obj, path) {
  const paths = path.split('.');
  const isWhitespace = paths.length === 1 && !/\\S/.test(paths[0]);

  if (path.startsWith('$last') && Array.isArray(obj)) {
    paths[0] = obj.length - 1;
  }

  if (paths.length === 0 || isWhitespace) return obj;
  else if (paths.length === 1) return obj[paths[0]];

  let result = obj;

  for (let i = 0; i < paths.length; i++) {
    if (result[paths[i]] == undefined) {
      return undefined;
    } else {
      result = result[paths[i]];
    }
  }

  return result;
}
function automaRefData(keyword, path = '') {
  const data = JSON.parse(sessionStorage.getItem('automa--${stateId}')) || null;

  if (data === null) return null;

  return findData(data[keyword], path);
}
  `;
}
