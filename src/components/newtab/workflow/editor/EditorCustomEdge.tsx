import React from 'react';
import {
  EdgeProps,
  getBezierPath,
  getSmoothStepPath,
  EdgeLabelRenderer,
  BaseEdge, // React Flow's BaseEdge is for advanced use, not direct equivalent of Vue Flow's
} from 'reactflow';

const EditorCustomEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
  style,
}) => {
  const pathParams = {
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  };

  // Determine which path function to use
  // React Flow's getSmoothStepPath has a different signature and options than Vue Flow's.
  // For simplicity, we'll use getBezierPath for now, or choose one based on a simple condition.
  // The original logic was: if (props.sourceX > props.targetX) return getSmoothStepPath(options);
  // We can replicate a similar choice if needed, but React Flow's getSmoothStepPath might need adjustments.
  // Let's use getBezierPath as a starting point, as it's more standard.
  // Or, let's try to somewhat mimic the original logic more closely,
  // noting that React Flow's getSmoothStepPath often looks best with specific curvatures or offsets.

  let edgePathTuple: [path: string, labelX: number, labelY: number];

  if (sourceX > targetX) {
    // getSmoothStepPath in React Flow returns a string directly, not a tuple with label positions.
    // We might need to calculate label positions manually or use a simpler path for now.
    // For now, let's use getSmoothStepPath and manually estimate label position or rely on EdgeLabelRenderer.
    // The getSmoothStepPath in React Flow also can take `borderRadius` and `offset` options.
    const smoothStepParams = { ...pathParams, borderRadius: 5 }; // Adjust borderRadius as needed
    edgePathTuple = getSmoothStepPath(smoothStepParams) as any; // It returns a string path, need to handle labelX, labelY
    // Manually calculating midpoint for label for smooth step
    if (typeof edgePathTuple === 'string') {
        edgePathTuple = [edgePathTuple, (sourceX + targetX) / 2, (sourceY + targetY) / 2];
    }

  } else {
    edgePathTuple = getBezierPath(pathParams);
  }

  const [edgePath, labelX, labelY] = edgePathTuple;

  const label = data?.label || '';

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              background: '#3b82f6', // Corresponds to label-bg-style fill
              padding: '2px 4px', // Corresponds to label-bg-padding
              borderRadius: '2px', // Corresponds to label-bg-border-radius
              color: 'white', // Corresponds to label-style fill
              fontSize: 10, // Adjust as needed
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default EditorCustomEdge;
