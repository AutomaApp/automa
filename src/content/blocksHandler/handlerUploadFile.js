import { sendMessage } from '@/utils/message';
import handleSelector from '../handleSelector';

function injectFiles(element, files) {
  const notFileTypeAttr = element.getAttribute('type') !== 'file';

  if (element.tagName !== 'INPUT' || notFileTypeAttr) return;

  element.files = files;
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

export default async function (block) {
  const elements = await handleSelector(block, { returnElement: true });

  if (!elements) throw new Error('element-not-found');

  const getFile = async (path) => {
    let fileObject;
    if (
      path.includes('|') &&
      !path.startsWith('file') &&
      !path.startsWith('http')
    ) {
      const [filename, mime, base64] = path.split('|');
      const response = await fetch(base64);
      const arrayBuffer = await response.arrayBuffer();

      fileObject = new File([arrayBuffer], filename, { type: mime });
    } else {
      const file = await sendMessage('get:file', path, 'background');
      const name = file?.path?.replace(/^.*[\\/]/, '') || '';
      const blob = await fetch(file.objUrl).then((response) => response.blob());

      if (file.objUrl.startsWith('blob')) URL.revokeObjectURL(file.objUrl);

      fileObject = new File([blob], name, { type: file.type });
    }

    return fileObject;
  };
  const filesPromises = await Promise.all(block.data.filePaths.map(getFile));
  const dataTransfer = filesPromises.reduce((acc, file) => {
    acc.items.add(file);

    return acc;
  }, new DataTransfer());

  if (block.data.multiple) {
    elements.forEach((element) => {
      injectFiles(element, dataTransfer.files);
    });
  } else {
    injectFiles(elements, dataTransfer.files);
  }
}
