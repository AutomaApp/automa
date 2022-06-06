async function downloadFile(url) {
  const response = await fetch(url);
  const blob = await response.blob();
  const objUrl = URL.createObjectURL(blob);

  return { objUrl, path: url, type: blob.type };
}
function getLocalFile(path) {
  return new Promise((resolve, reject) => {
    const isFile = /\.(.*)/.test(path);

    if (!isFile) {
      reject(new Error(`"${path}" is invalid file path.`));
      return;
    }

    const fileUrl = path?.startsWith('file://') ? path : `file://${path}`;

    const xhr = new XMLHttpRequest();
    xhr.responseType = 'blob';
    xhr.onreadystatechange = () => {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        if (xhr.status === 0 || xhr.status === 200) {
          const objUrl = URL.createObjectURL(xhr.response);

          resolve({ path, objUrl, type: xhr.response.type });
        } else {
          reject(new Error(xhr.statusText));
        }
      }
    };
    xhr.onerror = function () {
      reject(
        new Error(xhr.statusText || `Can't find a file with "${path}" path`)
      );
    };
    xhr.open('GET', fileUrl);
    xhr.send();
  });
}

export default function (path) {
  if (path.startsWith('http')) return downloadFile(path);

  return getLocalFile(path);
}
