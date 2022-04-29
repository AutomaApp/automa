export default function ({ sendCommand, commandParams }) {
  async function mousedown() {
    commandParams.type = 'mousePressed';
    await sendCommand('Input.dispatchMouseEvent', commandParams);
  }
  async function mouseup() {
    commandParams.type = 'mouseReleased';
    await sendCommand('Input.dispatchMouseEvent', commandParams);
  }
  async function click() {
    if (!commandParams.clickCount) commandParams.clickCount = 1;

    await mousedown();
    await mouseup();
  }
  async function dblclick() {
    commandParams.clickCount = 2;
    await click();
  }
  async function mousemove() {
    commandParams.type = 'mouseMoved';
    await sendCommand('Input.dispatchMouseEvent', commandParams);
  }
  async function mouseenter() {
    await mousemove();
  }
  async function mouseleave() {
    await mousemove();

    commandParams.x = -100;
    commandParams.y = -100;
    await mousemove();
  }

  return {
    mousedown,
    mouseup,
    click,
    dblclick,
    mousemove,
    mouseenter,
    mouseleave,
  };
}
