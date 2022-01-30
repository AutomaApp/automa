import { sendMessage } from '@/utils/message';
import { handleElement } from '../helper';

function injectFiles(element, files) {
  const notFileTypeAttr = element.getAttribute('type') !== 'file';

  if (element.tagName !== 'INPUT' || notFileTypeAttr) return;

  element.files = files;

  element.dispatchEvent(new Event('change', { bubbles: true }));
}

export default async function (block) {
  const elements = handleElement(block, { returnElement: true });

  if (!elements) throw new Error('element-not-found');

  const getFile = async (path) => {
    const file = await sendMessage('get:file', path, 'background');
    const name = file.path?.replace(/^.*[\\/]/, '') || '';
    const blob = await fetch(file.objUrl).then((response) => response.blob());

    URL.revokeObjectURL(file.objUrl);

    return new File([blob], name, { type: file.type });
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
