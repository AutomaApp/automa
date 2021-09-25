import { createApp, h } from 'vue';
import Drawflow from 'drawflow';
import '@/assets/css/drawflow.css';

const nodeComponents = require.context('../components/node', false, /\.vue$/);

export default function (element, ctx) {
  const editor = new Drawflow(element, { createApp, version: 3, h }, ctx);

  editor.useuuid = true;
  editor.reroute = true;

  nodeComponents.keys().forEach((key) => {
    const name = key.replace(/(.\/)|\.vue$/g, '');

    editor.registerNode(name, nodeComponents(key).default, { editor }, {});
  });

  editor.start();
  editor.addNode(
    'NodeStart',
    0,
    1,
    150,
    300,
    'node-start',
    {},
    'NodeStart',
    'vue'
  );
  editor.on('nodeCreated', (id) => {
    const { name } = editor.getNodeFromId(id);

    console.log(name, id, editor.getNodeFromId(id));

    // Node.insert({
    //   data: {
    //     id,
    //     data: nodeData,
    //     storyId,
    //     type: name,
    //   },
    // });
  });

  return editor;
}
