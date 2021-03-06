import { nanoid } from 'nanoid';

export default [
  {
    id: nanoid(),
    name: 'Google search',
    createdAt: Date.now(),
    drawflow: {
      nodes: [
        {
          type: 'BlockBasic',
          dimensions: { width: 192, height: 72 },
          handleBounds: {
            source: [
              {
                id: 'd634ff22-5dfe-44dc-83d2-842412bd9fbf-output-1',
                position: 'right',
                x: 196.00000657196182,
                y: 28.000021560199762,
                width: 16,
                height: 16,
              },
            ],
          },
          computedPosition: { x: 50, y: 300, z: 0 },
          id: 'd634ff22-5dfe-44dc-83d2-842412bd9fbf',
          label: 'trigger',
          position: { x: 50, y: 300 },
          data: { type: 'manual', interval: 10 },
          selected: false,
        },
        {
          type: 'BlockBasic',
          dimensions: { width: 192, height: 72 },
          handleBounds: {
            source: [
              {
                id: 'b9e7e0d4-e86a-4635-a352-31c63723fef4-output-1',
                position: 'right',
                x: 196.00006103515628,
                y: 27.999992370605472,
                width: 16,
                height: 16,
              },
            ],
            target: [
              {
                id: 'b9e7e0d4-e86a-4635-a352-31c63723fef4-input-1',
                position: 'left',
                x: -20,
                y: 27.999992370605472,
                width: 16,
                height: 16,
              },
            ],
          },
          computedPosition: { x: 353, y: 298, z: 0 },
          id: 'b9e7e0d4-e86a-4635-a352-31c63723fef4',
          label: 'new-tab',
          position: { x: 353, y: 298 },
          data: {
            disableBlock: false,
            description: '',
            url: 'https://google.com',
            userAgent: '',
            active: true,
            inGroup: false,
            waitTabLoaded: false,
            updatePrevTab: false,
            customUserAgent: false,
            onError: {},
          },
          selected: false,
        },
        {
          type: 'BlockBasic',
          dimensions: { width: 192, height: 72 },
          handleBounds: {
            source: [
              {
                id: '09f3a14c-0514-4287-93b0-aa92b0064fba-output-1',
                position: 'right',
                x: 195.99997405489208,
                y: 28.00001941411291,
                width: 16,
                height: 16,
              },
            ],
            target: [
              {
                id: '09f3a14c-0514-4287-93b0-aa92b0064fba-input-1',
                position: 'left',
                x: -20.000021574075806,
                y: 28.00001941411291,
                width: 16,
                height: 16,
              },
            ],
          },
          computedPosition: { x: 641, y: 290, z: 0 },
          id: '09f3a14c-0514-4287-93b0-aa92b0064fba',
          label: 'forms',
          position: { x: 641, y: 290 },
          data: {
            description: 'Type query',
            selector: "[name='q']",
            markEl: false,
            multiple: false,
            selected: true,
            type: 'text-field',
            value: 'Automa Extension',
            delay: '120',
            events: [],
          },
          selected: false,
        },
        {
          type: 'BlockBasic',
          dimensions: { width: 192, height: 72 },
          handleBounds: {
            source: [
              {
                id: '5f76370d-aa3d-4258-8319-230fcfc49a3a-output-1',
                position: 'right',
                x: 196.00006103515628,
                y: 27.999992370605472,
                width: 16,
                height: 16,
              },
            ],
            target: [
              {
                id: '5f76370d-aa3d-4258-8319-230fcfc49a3a-input-1',
                position: 'left',
                x: -20,
                y: 27.999992370605472,
                width: 16,
                height: 16,
              },
            ],
          },
          computedPosition: { x: 929, y: 293, z: 0 },
          id: '5f76370d-aa3d-4258-8319-230fcfc49a3a',
          label: 'event-click',
          position: { x: 929, y: 293 },
          data: {
            description: 'Click search',
            selector: 'center:nth-child(1) > .gNO89b',
            markEl: false,
            multiple: false,
          },
          selected: false,
        },
      ],
      edges: [
        {
          id: 'edge-0',
          sourceHandle: 'd634ff22-5dfe-44dc-83d2-842412bd9fbf-output-1',
          targetHandle: 'b9e7e0d4-e86a-4635-a352-31c63723fef4-input-1',
          source: 'd634ff22-5dfe-44dc-83d2-842412bd9fbf',
          target: 'b9e7e0d4-e86a-4635-a352-31c63723fef4',
          class:
            'source-d634ff22-5dfe-44dc-83d2-842412bd9fbf-output-1 target-b9e7e0d4-e86a-4635-a352-31c63723fef4-input-1',
          type: 'default',
          z: 0,
          sourceX: 0,
          sourceY: 0,
          targetX: 0,
          targetY: 0,
          markerEnd: 'arrowclosed',
        },
        {
          id: 'edge-1',
          sourceHandle: 'b9e7e0d4-e86a-4635-a352-31c63723fef4-output-1',
          targetHandle: '09f3a14c-0514-4287-93b0-aa92b0064fba-input-1',
          source: 'b9e7e0d4-e86a-4635-a352-31c63723fef4',
          target: '09f3a14c-0514-4287-93b0-aa92b0064fba',
          class:
            'source-b9e7e0d4-e86a-4635-a352-31c63723fef4-output-1 target-09f3a14c-0514-4287-93b0-aa92b0064fba-input-1',
          type: 'default',
          z: 0,
          sourceX: 0,
          sourceY: 0,
          targetX: 0,
          targetY: 0,
          markerEnd: 'arrowclosed',
          animated: false,
        },
        {
          id: 'edge-2',
          sourceHandle: '09f3a14c-0514-4287-93b0-aa92b0064fba-output-1',
          targetHandle: '5f76370d-aa3d-4258-8319-230fcfc49a3a-input-1',
          source: '09f3a14c-0514-4287-93b0-aa92b0064fba',
          target: '5f76370d-aa3d-4258-8319-230fcfc49a3a',
          class:
            'source-09f3a14c-0514-4287-93b0-aa92b0064fba-output-1 target-5f76370d-aa3d-4258-8319-230fcfc49a3a-input-1',
          type: 'default',
          z: 0,
          sourceX: 0,
          sourceY: 0,
          targetX: 0,
          targetY: 0,
          markerEnd: 'arrowclosed',
        },
      ],
      position: [-1.538468549623417, 35.22407674532957],
      zoom: 0.7999999999999999,
    },
  },
  {
    id: nanoid(),
    name: 'Generate lorem ipsum',
    createdAt: Date.now(),
    drawflow: {
      nodes: [
        {
          type: 'BlockBasic',
          dimensions: { width: 192, height: 72 },
          handleBounds: {
            source: [
              {
                id: 'c5774692-0be4-457f-82be-d5e4b3344ad7-output-1',
                position: 'right',
                x: 195.99998474121094,
                y: 27.99999237060547,
                width: 16,
                height: 16,
              },
            ],
          },
          computedPosition: { x: 50, y: 300, z: 0 },
          id: 'c5774692-0be4-457f-82be-d5e4b3344ad7',
          label: 'trigger',
          position: { x: 50, y: 300 },
          data: {
            disableBlock: false,
            description: '',
            type: 'manual',
            interval: 60,
            delay: 5,
            date: '',
            time: '00:00',
            url: '',
            shortcut: '',
            activeInInput: false,
            isUrlRegex: false,
            days: [],
          },
        },
        {
          type: 'BlockBasic',
          dimensions: { width: 192, height: 72 },
          handleBounds: {
            source: [
              {
                id: '10a0429e-b8c4-4c04-9ea3-df169cea78e4-output-1',
                position: 'right',
                x: 195.9999744943092,
                y: 28.000021560199755,
                width: 16,
                height: 16,
              },
            ],
            target: [
              {
                id: '10a0429e-b8c4-4c04-9ea3-df169cea78e4-input-1',
                position: 'left',
                x: -19.999903128358724,
                y: 28.000021560199755,
                width: 16,
                height: 16,
              },
            ],
          },
          computedPosition: { x: 315, y: 297, z: 0 },
          id: '10a0429e-b8c4-4c04-9ea3-df169cea78e4',
          label: 'new-tab',
          position: { x: 315, y: 297 },
          data: {
            disableBlock: false,
            description: '',
            url: 'http://lipsum.com',
            userAgent: '',
            active: true,
            inGroup: false,
            waitTabLoaded: false,
            updatePrevTab: true,
            customUserAgent: false,
          },
          selected: false,
        },
        {
          type: 'BlockBasic',
          dimensions: { width: 192, height: 72 },
          handleBounds: {
            source: [
              {
                id: '24bdec44-1e80-4cee-9139-00545b8d33d9-output-1',
                position: 'right',
                x: 195.99997198037403,
                y: 28.000015439189703,
                width: 16,
                height: 16,
              },
            ],
            target: [
              {
                id: '24bdec44-1e80-4cee-9139-00545b8d33d9-input-1',
                position: 'left',
                x: -20.000004547328174,
                y: 28.000015439189703,
                width: 16,
                height: 16,
              },
            ],
          },
          computedPosition: { x: 596, y: 302, z: 0 },
          id: '24bdec44-1e80-4cee-9139-00545b8d33d9',
          label: 'element-scroll',
          position: { x: 596, y: 302 },
          data: {
            disableBlock: false,
            description: '',
            findBy: 'cssSelector',
            waitForSelector: true,
            waitSelectorTimeout: 5000,
            selector: '#amount',
            markEl: false,
            multiple: false,
            scrollY: 0,
            scrollX: 0,
            incX: false,
            incY: false,
            smooth: true,
            scrollIntoView: true,
          },
          selected: false,
        },
        {
          type: 'BlockDelay',
          dimensions: { width: 192, height: 117 },
          handleBounds: {
            source: [
              {
                id: 'df24edcc-4c29-49f5-8a29-0e572a4bc6ae-output-1',
                position: 'right',
                x: 196.00015343897923,
                y: 50.687512658751125,
                width: 16,
                height: 16,
              },
            ],
            target: [
              {
                id: 'df24edcc-4c29-49f5-8a29-0e572a4bc6ae-input-1',
                position: 'left',
                x: -19.999913818025576,
                y: 50.687512658751125,
                width: 16,
                height: 16,
              },
            ],
          },
          computedPosition: { x: 878, y: 282, z: 0 },
          id: 'df24edcc-4c29-49f5-8a29-0e572a4bc6ae',
          label: 'delay',
          position: { x: 878, y: 282 },
          data: { time: '1000' },
          selected: false,
        },
        {
          type: 'BlockBasic',
          dimensions: { width: 192, height: 72 },
          handleBounds: {
            source: [
              {
                id: '2d93c1de-42ca-4f39-8e61-e3e55529fbba-output-1',
                position: 'right',
                x: 195.99997198037403,
                y: 28.000015439189703,
                width: 16,
                height: 16,
              },
            ],
            target: [
              {
                id: '2d93c1de-42ca-4f39-8e61-e3e55529fbba-input-1',
                position: 'left',
                x: -20.000004547328174,
                y: 28.000015439189703,
                width: 16,
                height: 16,
              },
            ],
          },
          computedPosition: { x: 1148, y: 297, z: 0 },
          id: '2d93c1de-42ca-4f39-8e61-e3e55529fbba',
          label: 'forms',
          position: { x: 1148, y: 297 },
          data: {
            disableBlock: false,
            description: 'Lipsum length',
            findBy: 'cssSelector',
            waitForSelector: false,
            waitSelectorTimeout: 5000,
            selector: '#amount',
            markEl: false,
            multiple: false,
            selected: true,
            clearValue: true,
            getValue: false,
            saveData: false,
            dataColumn: '',
            assignVariable: false,
            variableName: '',
            type: 'text-field',
            value: '3',
            delay: 0,
            events: [],
          },
          selected: false,
        },
        {
          type: 'BlockBasic',
          dimensions: { width: 192, height: 72 },
          handleBounds: {
            source: [
              {
                id: '0f3e2baa-8d6d-4323-8ac7-362f1be39ecb-output-1',
                position: 'right',
                x: 195.99997198037403,
                y: 27.999992756864053,
                width: 16,
                height: 16,
              },
            ],
            target: [
              {
                id: '0f3e2baa-8d6d-4323-8ac7-362f1be39ecb-input-1',
                position: 'left',
                x: -20.00009527663077,
                y: 27.999992756864053,
                width: 16,
                height: 16,
              },
            ],
          },
          computedPosition: { x: 1414, y: 299, z: 0 },
          id: '0f3e2baa-8d6d-4323-8ac7-362f1be39ecb',
          label: 'event-click',
          position: { x: 1414, y: 299 },
          data: {
            disableBlock: false,
            description: 'Generate button',
            findBy: 'cssSelector',
            waitForSelector: false,
            waitSelectorTimeout: 5000,
            selector: '#generate',
            markEl: false,
            multiple: false,
          },
          selected: false,
        },
        {
          type: 'BlockDelay',
          dimensions: { width: 192, height: 117 },
          handleBounds: {
            source: [
              {
                id: 'fb9be12f-8995-4876-8bfe-79323769474b-output-1',
                position: 'right',
                x: 195,
                y: 50.68748474121094,
                width: 16,
                height: 16,
              },
            ],
            target: [
              {
                id: 'fb9be12f-8995-4876-8bfe-79323769474b-input-1',
                position: 'left',
                x: -20,
                y: 50.68748474121094,
                width: 16,
                height: 16,
              },
            ],
          },
          computedPosition: { x: 1686, y: 280, z: 0 },
          id: 'fb9be12f-8995-4876-8bfe-79323769474b',
          label: 'delay',
          position: { x: 1686, y: 280 },
          data: { disableBlock: false, time: 2000 },
          selected: false,
        },
        {
          type: 'BlockBasic',
          dimensions: { width: 192, height: 72 },
          handleBounds: {
            source: [
              {
                id: '7205fcf2-deda-445e-9690-4e36adb52585-output-1',
                position: 'right',
                x: 195.99997449430924,
                y: 28.00000552137348,
                width: 16,
                height: 16,
              },
            ],
            target: [
              {
                id: '7205fcf2-deda-445e-9690-4e36adb52585-input-1',
                position: 'left',
                x: -20.000031438968968,
                y: 28.00000552137348,
                width: 16,
                height: 16,
              },
            ],
          },
          computedPosition: { x: 1973, y: 307, z: 0 },
          id: '7205fcf2-deda-445e-9690-4e36adb52585',
          label: 'get-text',
          position: { x: 1973, y: 307 },
          data: {
            disableBlock: false,
            description: 'Get text result',
            findBy: 'cssSelector',
            waitForSelector: false,
            waitSelectorTimeout: 5000,
            selector: '#lipsum',
            markEl: false,
            multiple: false,
            regex: '',
            prefixText: '',
            suffixText: '',
            regexExp: ['g', 'g'],
            dataColumn: '',
            saveData: true,
            includeTags: false,
            addExtraRow: false,
            assignVariable: false,
            variableName: '',
            extraRowValue: '',
            extraRowDataColumn: '',
          },
          selected: false,
        },
        {
          type: 'BlockRepeatTask',
          dimensions: { width: 193, height: 149 },
          handleBounds: {
            source: [
              {
                id: '3d3e8fac-97fa-4c3d-84bc-a3db18740184-output-1',
                position: 'right',
                x: 197.2124006448874,
                y: 66.6874815732158,
                width: 16,
                height: 16,
              },
              {
                id: '3d3e8fac-97fa-4c3d-84bc-a3db18740184-output-2',
                position: 'right',
                x: 197.2124006448874,
                y: 113.3875114484557,
                width: 16,
                height: 16,
              },
            ],
            target: [
              {
                id: '3d3e8fac-97fa-4c3d-84bc-a3db18740184-input-1',
                position: 'left',
                x: -20.000129470007995,
                y: 66.6874815732158,
                width: 16,
                height: 16,
              },
            ],
          },
          computedPosition: { x: 2253, y: 263.5, z: 0 },
          id: '3d3e8fac-97fa-4c3d-84bc-a3db18740184',
          label: 'repeat-task',
          position: { x: 2253, y: 263.5 },
          data: { disableBlock: false, repeatFor: 2 },
          selected: false,
        },
        {
          type: 'BlockBasic',
          dimensions: { width: 192, height: 72 },
          handleBounds: {
            source: [
              {
                id: '4d39ecd5-f33f-4e57-b11d-2f26b1076334-output-1',
                position: 'right',
                x: 195.9998661589599,
                y: 27.999992440129862,
                width: 16,
                height: 16,
              },
            ],
            target: [
              {
                id: '4d39ecd5-f33f-4e57-b11d-2f26b1076334-input-1',
                position: 'left',
                x: -20.00023736594018,
                y: 27.999992440129862,
                width: 16,
                height: 16,
              },
            ],
          },
          computedPosition: { x: 2529.75, y: 304, z: 0 },
          id: '4d39ecd5-f33f-4e57-b11d-2f26b1076334',
          label: 'export-data',
          position: { x: 2529.75, y: 304 },
          data: {
            disableBlock: false,
            name: 'Lipsum',
            refKey: '',
            type: 'plain-text',
            description: '',
            variableName: '',
            addBOMHeader: false,
            onConflict: 'uniquify',
            dataToExport: 'data-columns',
          },
          selected: false,
        },
        {
          type: 'BlockBasic',
          dimensions: { width: 192, height: 96 },
          handleBounds: {
            source: [
              {
                id: '2f5fec61-a318-4e2b-b7d3-bc7328bd282c-output-1',
                position: 'right',
                x: 196.00006103515625,
                y: 40.000038146972656,
                width: 16,
                height: 16,
              },
              {
                id: '2f5fec61-a318-4e2b-b7d3-bc7328bd282c-output-fallback',
                position: 'right',
                x: 196.00006103515625,
                y: 62.00000762939453,
                width: 16,
                height: 16,
              },
            ],
            target: [
              {
                id: '2f5fec61-a318-4e2b-b7d3-bc7328bd282c-input-1',
                position: 'left',
                x: -20,
                y: 40.000038146972656,
                width: 16,
                height: 16,
              },
            ],
          },
          computedPosition: { x: 1135.5, y: 628, z: 0 },
          id: '2f5fec61-a318-4e2b-b7d3-bc7328bd282c',
          label: 'go-back',
          position: { x: 1135.5, y: 628 },
          data: {
            disableBlock: false,
            onError: {
              retry: false,
              enable: true,
              retryTimes: 1,
              retryInterval: 2,
              toDo: 'fallback',
            },
          },
        },
      ],
      edges: [
        {
          id: 'edge-0',
          sourceHandle: 'c5774692-0be4-457f-82be-d5e4b3344ad7-output-1',
          targetHandle: '10a0429e-b8c4-4c04-9ea3-df169cea78e4-input-1',
          source: 'c5774692-0be4-457f-82be-d5e4b3344ad7',
          target: '10a0429e-b8c4-4c04-9ea3-df169cea78e4',
          class:
            'source-c5774692-0be4-457f-82be-d5e4b3344ad7-output-1 target-10a0429e-b8c4-4c04-9ea3-df169cea78e4-input-1',
          type: 'default',
          z: 0,
          sourceX: 0,
          sourceY: 0,
          targetX: 0,
          targetY: 0,
          markerEnd: 'arrowclosed',
        },
        {
          id: 'edge-1',
          sourceHandle: '10a0429e-b8c4-4c04-9ea3-df169cea78e4-output-1',
          targetHandle: '24bdec44-1e80-4cee-9139-00545b8d33d9-input-1',
          source: '10a0429e-b8c4-4c04-9ea3-df169cea78e4',
          target: '24bdec44-1e80-4cee-9139-00545b8d33d9',
          class:
            'source-10a0429e-b8c4-4c04-9ea3-df169cea78e4-output-1 target-24bdec44-1e80-4cee-9139-00545b8d33d9-input-1',
          type: 'default',
          z: 0,
          sourceX: 0,
          sourceY: 0,
          targetX: 0,
          targetY: 0,
          markerEnd: 'arrowclosed',
        },
        {
          id: 'edge-2',
          sourceHandle: '24bdec44-1e80-4cee-9139-00545b8d33d9-output-1',
          targetHandle: 'df24edcc-4c29-49f5-8a29-0e572a4bc6ae-input-1',
          source: '24bdec44-1e80-4cee-9139-00545b8d33d9',
          target: 'df24edcc-4c29-49f5-8a29-0e572a4bc6ae',
          class:
            'source-24bdec44-1e80-4cee-9139-00545b8d33d9-output-1 target-df24edcc-4c29-49f5-8a29-0e572a4bc6ae-input-1',
          type: 'default',
          z: 0,
          sourceX: 0,
          sourceY: 0,
          targetX: 0,
          targetY: 0,
          markerEnd: 'arrowclosed',
        },
        {
          id: 'edge-3',
          sourceHandle: 'df24edcc-4c29-49f5-8a29-0e572a4bc6ae-output-1',
          targetHandle: '2d93c1de-42ca-4f39-8e61-e3e55529fbba-input-1',
          source: 'df24edcc-4c29-49f5-8a29-0e572a4bc6ae',
          target: '2d93c1de-42ca-4f39-8e61-e3e55529fbba',
          class:
            'source-df24edcc-4c29-49f5-8a29-0e572a4bc6ae-output-1 target-2d93c1de-42ca-4f39-8e61-e3e55529fbba-input-1',
          type: 'default',
          z: 0,
          sourceX: 0,
          sourceY: 0,
          targetX: 0,
          targetY: 0,
          markerEnd: 'arrowclosed',
        },
        {
          id: 'edge-4',
          sourceHandle: '2d93c1de-42ca-4f39-8e61-e3e55529fbba-output-1',
          targetHandle: '0f3e2baa-8d6d-4323-8ac7-362f1be39ecb-input-1',
          source: '2d93c1de-42ca-4f39-8e61-e3e55529fbba',
          target: '0f3e2baa-8d6d-4323-8ac7-362f1be39ecb',
          class:
            'source-2d93c1de-42ca-4f39-8e61-e3e55529fbba-output-1 target-0f3e2baa-8d6d-4323-8ac7-362f1be39ecb-input-1',
          type: 'default',
          z: 0,
          sourceX: 0,
          sourceY: 0,
          targetX: 0,
          targetY: 0,
          markerEnd: 'arrowclosed',
        },
        {
          id: 'edge-5',
          sourceHandle: '0f3e2baa-8d6d-4323-8ac7-362f1be39ecb-output-1',
          targetHandle: 'fb9be12f-8995-4876-8bfe-79323769474b-input-1',
          source: '0f3e2baa-8d6d-4323-8ac7-362f1be39ecb',
          target: 'fb9be12f-8995-4876-8bfe-79323769474b',
          class:
            'source-0f3e2baa-8d6d-4323-8ac7-362f1be39ecb-output-1 target-fb9be12f-8995-4876-8bfe-79323769474b-input-1',
          type: 'default',
          z: 0,
          sourceX: 0,
          sourceY: 0,
          targetX: 0,
          targetY: 0,
          markerEnd: 'arrowclosed',
        },
        {
          id: 'edge-6',
          sourceHandle: 'fb9be12f-8995-4876-8bfe-79323769474b-output-1',
          targetHandle: '7205fcf2-deda-445e-9690-4e36adb52585-input-1',
          source: 'fb9be12f-8995-4876-8bfe-79323769474b',
          target: '7205fcf2-deda-445e-9690-4e36adb52585',
          class:
            'source-fb9be12f-8995-4876-8bfe-79323769474b-output-1 target-7205fcf2-deda-445e-9690-4e36adb52585-input-1',
          type: 'default',
          z: 0,
          sourceX: 0,
          sourceY: 0,
          targetX: 0,
          targetY: 0,
          markerEnd: 'arrowclosed',
        },
        {
          id: 'edge-7',
          sourceHandle: '7205fcf2-deda-445e-9690-4e36adb52585-output-1',
          targetHandle: '3d3e8fac-97fa-4c3d-84bc-a3db18740184-input-1',
          source: '7205fcf2-deda-445e-9690-4e36adb52585',
          target: '3d3e8fac-97fa-4c3d-84bc-a3db18740184',
          class:
            'source-7205fcf2-deda-445e-9690-4e36adb52585-output-1 target-3d3e8fac-97fa-4c3d-84bc-a3db18740184-input-1',
          type: 'default',
          z: 0,
          sourceX: 0,
          sourceY: 0,
          targetX: 0,
          targetY: 0,
          markerEnd: 'arrowclosed',
        },
        {
          id: 'edge-8',
          sourceHandle: '3d3e8fac-97fa-4c3d-84bc-a3db18740184-output-1',
          targetHandle: '4d39ecd5-f33f-4e57-b11d-2f26b1076334-input-1',
          source: '3d3e8fac-97fa-4c3d-84bc-a3db18740184',
          target: '4d39ecd5-f33f-4e57-b11d-2f26b1076334',
          class:
            'source-3d3e8fac-97fa-4c3d-84bc-a3db18740184-output-1 target-4d39ecd5-f33f-4e57-b11d-2f26b1076334-input-1',
          type: 'default',
          z: 0,
          sourceX: 0,
          sourceY: 0,
          targetX: 0,
          targetY: 0,
          markerEnd: 'arrowclosed',
        },
        {
          id: 'edge-9',
          sourceHandle: '3d3e8fac-97fa-4c3d-84bc-a3db18740184-output-2',
          targetHandle: '2f5fec61-a318-4e2b-b7d3-bc7328bd282c-input-1',
          source: '3d3e8fac-97fa-4c3d-84bc-a3db18740184',
          target: '2f5fec61-a318-4e2b-b7d3-bc7328bd282c',
          class:
            'source-3d3e8fac-97fa-4c3d-84bc-a3db18740184-output-2 target-2f5fec61-a318-4e2b-b7d3-bc7328bd282c-input-1',
          type: 'default',
          z: 0,
          sourceX: 0,
          sourceY: 0,
          targetX: 0,
          targetY: 0,
          markerEnd: 'arrowclosed',
        },
        {
          id: 'edge-10',
          sourceHandle: '2f5fec61-a318-4e2b-b7d3-bc7328bd282c-output-1',
          targetHandle: '24bdec44-1e80-4cee-9139-00545b8d33d9-input-1',
          source: '2f5fec61-a318-4e2b-b7d3-bc7328bd282c',
          target: '24bdec44-1e80-4cee-9139-00545b8d33d9',
          class:
            'source-2f5fec61-a318-4e2b-b7d3-bc7328bd282c-output-1 target-24bdec44-1e80-4cee-9139-00545b8d33d9-input-1',
          type: 'default',
          z: 0,
          sourceX: 0,
          sourceY: 0,
          targetX: 0,
          targetY: 0,
          markerEnd: 'arrowclosed',
        },
        {
          id: 'edge-11',
          sourceHandle: '2f5fec61-a318-4e2b-b7d3-bc7328bd282c-output-fallback',
          targetHandle: '10a0429e-b8c4-4c04-9ea3-df169cea78e4-input-1',
          source: '2f5fec61-a318-4e2b-b7d3-bc7328bd282c',
          target: '10a0429e-b8c4-4c04-9ea3-df169cea78e4',
          class:
            'source-2f5fec61-a318-4e2b-b7d3-bc7328bd282c-output-fallback target-10a0429e-b8c4-4c04-9ea3-df169cea78e4-input-1',
          type: 'default',
          z: 0,
          sourceX: 0,
          sourceY: 0,
          targetX: 0,
          targetY: 0,
          markerEnd: 'arrowclosed',
        },
      ],
      position: [29, 97],
      zoom: 0.5,
    },
  },
];
