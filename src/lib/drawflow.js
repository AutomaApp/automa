import { h, render } from 'vue';
import Drawflow from 'drawflow';
import '@/assets/css/drawflow.css';

const blockComponents = require.context('../components/block', false, /\.vue$/);

export default function (element, { context, options = {} }) {
  const editor = new Drawflow(element, { render, version: 3, h }, context);

  editor.useuuid = true;
  editor.curvature = 0;
  editor.reroute_curvature = 0;
  editor.reroute_curvature_start_end = 0;
  editor.reroute_fix_curvature = true;

  Object.entries(options).forEach(([key, value]) => {
    editor[key] = value;
  });

  blockComponents.keys().forEach((key) => {
    const name = key.replace(/(.\/)|\.vue$/g, '');

    editor.registerNode(name, blockComponents(key).default, { editor }, {});
  });

  return editor;
}
