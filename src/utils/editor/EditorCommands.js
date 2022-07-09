class EditorCommands {
  constructor(editor, initialStates = {}) {
    this.editor = editor;
    this.state = initialStates;
  }

  nodeAdded(addedNodes) {
    const ids = [];
    addedNodes.forEach((node) => {
      ids.push(node.id);
      this.state.nodes[node.id] = node;
    });

    return {
      name: 'node-added',
      execute: () => {
        this.editor.addNodes(addedNodes);
      },
      undo: () => {
        this.editor.removeNodes(ids);
      },
    };
  }

  nodeRemoved(ids) {
    return {
      name: 'node-removed',
      execute: () => {
        this.editor.removeNodes(ids);
      },
      undo: () => {
        const nodes = ids.map((id) => this.state.nodes[id]);
        this.editor.addNodes(nodes);
      },
    };
  }

  edgeAdded(addedEdges) {
    const ids = [];
    addedEdges.forEach((edge) => {
      ids.push(edge.id);
      this.state.edges[edge.id] = edge;
    });

    return {
      name: 'edge-added',
      execute: () => {
        this.editor.addEdges(addedEdges);
      },
      undo: () => {
        this.editor.removeEdges(ids);
      },
    };
  }

  edgeRemoved(ids) {
    return {
      name: 'edge-removed',
      execute: () => {
        this.editor.removeEdges(ids);
      },
      undo: () => {
        const edges = ids.map((id) => this.state.edges[id]);
        this.editor.addEdges(edges);
      },
    };
  }
}

export default EditorCommands;
