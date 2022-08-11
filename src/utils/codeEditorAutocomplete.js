/* eslint-disable no-template-curly-in-string */
import { snippet } from '@codemirror/autocomplete';
import { syntaxTree } from '@codemirror/language';

const completePropertyAfter = ['PropertyName', '.', '?.'];
const excludeProps = ['chrome', 'Mousetrap'];

function completeProperties(from, object) {
  const options = [];
  /* eslint-disable-next-line */
  for (const name in object) {
    if (
      !name.startsWith('__') &&
      !name.startsWith('webpack') &&
      !excludeProps.includes(name)
    )
      options.push({
        label: name,
        type: typeof object[name] === 'function' ? 'function' : 'variable',
      });
  }
  return {
    from,
    options,
    validFor: /^[\w$]*$/,
  };
}

export const dontCompleteIn = [
  'String',
  'TemplateString',
  'LineComment',
  'BlockComment',
  'VariableDefinition',
  'PropertyDefinition',
];
export function completeFromGlobalScope(context) {
  const nodeBefore = syntaxTree(context.state).resolveInner(context.pos, -1);

  if (
    completePropertyAfter.includes(nodeBefore.name) &&
    nodeBefore.parent?.name === 'MemberExpression'
  ) {
    const object = nodeBefore.parent.getChild('Expression');
    if (object?.name === 'VariableName') {
      const from = /\./.test(nodeBefore.name) ? nodeBefore.to : nodeBefore.from;
      const variableName = context.state.sliceDoc(object.from, object.to);
      if (typeof window[variableName] === 'object')
        return completeProperties(from, window[variableName]);
    }
  } else if (nodeBefore.name === 'VariableName') {
    return completeProperties(nodeBefore.from, window);
  } else if (context.explicit && !dontCompleteIn.includes(nodeBefore.name)) {
    return completeProperties(context.pos, window);
  }
  return null;
}

export function automaFuncsCompletion(snippets) {
  return function (context) {
    const word = context.matchBefore(/\w*/);
    const nodeBefore = syntaxTree(context.state).resolveInner(context.pos, -1);

    if (
      (word.from === word.to && !context.explicit) ||
      dontCompleteIn.includes(nodeBefore.name)
    )
      return null;

    return {
      from: word.from,
      options: snippets,
    };
  };
}

export const automaFuncsSnippets = {
  automaNextBlock: {
    label: 'automaNextBlock',
    type: 'function',
    apply: snippet('automaNextBlock(${data})'),
    info: () => {
      const container = document.createElement('div');

      container.innerHTML = `
        <code>automaNextBlock(<i>data</i>, <i>insert?</i>)</code>
        <p class="mt-2">
          Execute the next block
          <a href="https://docs.automa.site/blocks/javascript-code.html#automanextblock-data" target="_blank" class="underline">
            Read more
          </a>
        </p>
      `;

      return container;
    },
  },
  automaSetVariable: {
    label: 'automaSetVariable',
    type: 'function',
    apply: snippet("automaSetVariable('${name}', ${value})"),
    info: () => {
      const container = document.createElement('div');

      container.innerHTML = `
        <code>automaRefData(<i>name</i>, <i>value</i>)</code>
        <p class="mt-2">
          Set the value of a variable
        </p>
      `;

      return container;
    },
  },
  automaRefData: {
    label: 'automaRefData',
    type: 'function',
    apply: snippet("automaRefData('${keyword}', '${path}')"),
    info: () => {
      const container = document.createElement('div');

      container.innerHTML = `
        <code>automaRefData(<i>keyword</i>, <i>path</i>)</code>
        <p class="mt-2">
          Use this function to
          <a href="https://docs.automa.site/api-reference/reference-data.html" target="_blank" class="underline">
            reference data
          </a>
        </p>
      `;

      return container;
    },
  },
  automaResetTimeout: {
    label: 'automaResetTimeout',
    type: 'function',
    info: 'Reset javascript execution timeout',
    apply: 'automaResetTimeout()',
  },
  automaExecWorkflow: {
    label: 'automaExecWorkflow',
    type: 'function',
    apply: snippet("automaExecWorkflow({ id: '${workflowId}' })"),
    info: () => {
      const container = document.createElement('div');

      container.innerHTML = `
        <code>automaRefData(<i>options</i>)</code>
        <p class="mt-2">
          Execute a workflow
        </p>
      `;

      return container;
    },
  },
};
