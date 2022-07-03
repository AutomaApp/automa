import browser from 'webextension-polyfill';

export async function newWindow(block) {
  const { incognito, windowState } = block.data;
  const windowOptions = { incognito, state: windowState };

  if (windowState === 'normal') {
    ['top', 'left', 'height', 'width'].forEach((key) => {
      if (block.data[key] <= 0) return;

      windowOptions[key] = block.data[key];
    });
  }

  const { id } = await browser.windows.create(windowOptions);
  this.windowId = id;

  return {
    data: id,
    nextBlockId: this.getBlockConnections(block.id),
  };
}

export default newWindow;
