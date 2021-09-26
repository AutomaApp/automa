import { createApp, h } from 'vue';
import Drawflow from 'drawflow';
import '@/assets/css/drawflow.css';

const blockComponents = require.context('../components/block', false, /\.vue$/);

export default function (element, ctx) {
  const editor = new Drawflow(element, { createApp, version: 3, h }, ctx);

  editor.useuuid = true;
  editor.reroute = true;

  blockComponents.keys().forEach((key) => {
    const name = key.replace(/(.\/)|\.vue$/g, '');

    editor.registerNode(name, blockComponents(key).default, { editor }, {});
  });

  return editor;
}
