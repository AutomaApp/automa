import { sleep } from '@/utils/helper';
import handleSelector from '../handleSelector';

const SLEEP_TIME = 1700;

async function verifySelector(block) {
  let elements = await handleSelector(block);
  if (!elements) {
    await sleep(SLEEP_TIME);
    return { notFound: true };
  }

  if (!block.data.multiple) {
    elements.scrollIntoView({
      block: 'center',
      inline: 'center',
      behavior: 'smooth',
    });
    elements = [elements];
  }

  const divEl = document.createElement('div');
  divEl.style =
    'height: 100%; width: 100%; top: 0; left: 0; background-color: rgb(0 0 0 / 0.3); pointer-events: none; position: fixed; z-index: 99999';

  const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgEl.style =
    'height: 100%; width: 100%; top: 0; left: 0; pointer-events: none; position: relative;';

  divEl.appendChild(svgEl);

  elements.forEach((element) => {
    const { left, top, width, height } = element.getBoundingClientRect();
    const rectEl = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'rect'
    );

    rectEl.setAttribute('y', top);
    rectEl.setAttribute('x', left);
    rectEl.setAttribute('width', width);
    rectEl.setAttribute('height', height);
    rectEl.setAttribute('stroke', '#2563EB');
    rectEl.setAttribute('stroke-width', '2');
    rectEl.setAttribute('fill', 'rgba(37, 99, 235, 0.4)');

    svgEl.appendChild(rectEl);
  });

  document.body.appendChild(divEl);

  await sleep(SLEEP_TIME);

  divEl.remove();

  return { notFound: false };
}

export default verifySelector;
