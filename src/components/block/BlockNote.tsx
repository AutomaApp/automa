import React, { useState, useEffect, useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

// Define data structure for BlockNote
interface BlockNoteData {
  label?: string; // Title, falls back to "Note"
  note?: string;
  color?: string;
  fontSize?: 'regular' | 'medium' | 'large' | 'extra-large';
  width?: number;
  height?: number;
  // Callback props, assuming they might be passed via data by WorkflowEditor
  // or WorkflowEditor handles these via onNodeClick, onNodesDelete etc.
  onUpdateData?: (data: Partial<BlockNoteData>) => void;
  onDelete?: () => void;
}

// Helper for debouncing
const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<F>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };

  return debounced as (...args: Parameters<F>) => ReturnType<F>;
};

const colors: Record<string, string> = {
  white: 'bg-white dark:bg-gray-800 text-black dark:text-white',
  red: 'bg-red-200 dark:bg-red-300 text-gray-900',
  indigo: 'bg-indigo-200 dark:bg-indigo-300 text-gray-900',
  green: 'bg-green-200 dark:bg-green-300 text-gray-900',
  amber: 'bg-amber-200 dark:bg-amber-300 text-gray-900',
  sky: 'bg-sky-200 dark:bg-sky-300 text-gray-900',
};

const fontSizes: Record<string, { name: string; class: string }> = {
  regular: { name: 'Regular', class: 'text-base' },
  medium: { name: 'Medium', class: 'text-xl' },
  large: { name: 'Large', class: 'text-2xl' },
  'extra-large': { name: 'Extra Large', class: 'text-3xl' },
};

const BlockNote: React.FC<NodeProps<BlockNoteData>> = ({ id, data, selected }) => {
  const {
    note = '',
    color = 'white',
    fontSize: currentFontSize = 'regular',
    width: initialWidth = 280, // Default width from Vue component's CSS
    height: initialHeight = 168, // Default height from Vue component's CSS
    onUpdateData, // This would be set up in WorkflowEditor
    onDelete,     // This would be set up in WorkflowEditor
  } = data;

  const [currentNote, setCurrentNote] = useState(note);
  const [size, setSize] = useState({ width: initialWidth, height: initialHeight });

  useEffect(() => {
    setCurrentNote(note);
  }, [note]);

  useEffect(() => {
    setSize({ width: initialWidth, height: initialHeight });
  }, [initialWidth, initialHeight]);

  const debouncedUpdate = useCallback(
    debounce((updatedData: Partial<BlockNoteData>) => {
      onUpdateData?.(updatedData);
    }, 250),
    [onUpdateData]
  );

  const handleNoteChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentNote(event.target.value);
    debouncedUpdate({ note: event.target.value });
  };

  const handleColorChange = (newColor: string) => {
    onUpdateData?.({ color: newColor });
  };

  const handleFontSizeChange = (newSize: string) => {
    onUpdateData?.({ fontSize: newSize as BlockNoteData['fontSize'] });
  };

  const handleResizeStop = (event: React.MouseEvent<HTMLTextAreaElement>) => {
    const target = event.target as HTMLTextAreaElement;
    const newWidth = parseInt(target.style.width, 10);
    const newHeight = parseInt(target.style.height, 10);

    if (newWidth !== size.width || newHeight !== size.height) {
      setSize({ width: newWidth, height: newHeight });
      debouncedUpdate({ width: newWidth, height: newHeight });
    }
  };

  // Basic popover for settings (simplified)
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div
      className={`block-note rounded-lg p-4 shadow-md ${colors[color] || colors.white}`}
      style={{ width: size.width, minWidth: '192px', borderColor: selected ? '#6366F1' : 'transparent', borderWidth: '2px' }}
    >
      {/* Add handles for connections, if BlockNote can be connected */}
      <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
      <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />

      <div className="flex items-center border-b pb-2 border-gray-300 dark:border-gray-700">
        {/* Using a generic icon, replace with v-remixicon if available or SVG */}
        <span role="img" aria-label="edit" style={{ fontSize: '20px' }}>📝</span>
        <p className="mx-2 flex-1 font-semibold">{data.label || 'Note'}</p>
        <div style={{position: 'relative'}}>
          <button onClick={() => setSettingsOpen(!settingsOpen)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
            {/* Settings Icon */}
            <span role="img" aria-label="settings" style={{ fontSize: '20px' }}>⚙️</span>
          </button>
          {settingsOpen && (
            <div className="absolute right-0 mt-2 p-2 bg-white dark:bg-gray-800 shadow-lg rounded-md z-10 w-48 border border-gray-200 dark:border-gray-700">
              <p className="mb-1 ml-1 text-sm text-gray-600 dark:text-gray-200">Colors</p>
              <div className="flex items-center space-x-1 mb-2">
                {Object.entries(colors).map(([colorId, className]) => (
                  <span
                    key={colorId}
                    className={`${className.split(' ')[0]} inline-block h-6 w-6 cursor-pointer rounded-full border-2 ${color === colorId ? 'border-blue-500' : 'border-transparent'}`}
                    onClick={() => handleColorChange(colorId)}
                    title={colorId}
                  />
                ))}
              </div>
              <label htmlFor={`fontSize-${id}`} className="text-sm text-gray-600 dark:text-gray-200 block mb-1">Font Size</label>
              <select
                id={`fontSize-${id}`}
                value={currentFontSize}
                onChange={(e) => handleFontSizeChange(e.target.value)}
                className="w-full p-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white text-sm"
              >
                {Object.entries(fontSizes).map(([sizeId, { name }]) => (
                  <option key={sizeId} value={sizeId}>{name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <hr className="mx-2 h-7 border-r border-gray-300 dark:border-gray-700" />
        <button onClick={onDelete} className="p-1 hover:bg-red-100 dark:hover:bg-red-700 rounded" title="Delete note">
          {/* Delete Icon */}
          <span role="img" aria-label="delete" style={{ fontSize: '20px' }}>🗑️</span>
        </button>
      </div>
      <textarea
        value={currentNote}
        placeholder="Write a note here..."
        className={`mt-2 bg-transparent focus:ring-0 w-full ${fontSizes[currentFontSize]?.class || fontSizes.regular.class}`}
        style={{
          width: '100%', // Textarea width should be 100% of its container
          height: `calc(${size.height}px - 60px)`, // Adjust based on header height
          resize: 'both',
          minWidth: 'calc(100% - 20px)', // account for padding
          minHeight: '100px', // Minimum height for textarea itself
        }}
        onChange={handleNoteChange}
        onMouseUp={handleResizeStop} // This captures resize via mouse up on the textarea's resize handle
        onKeyDown={(e) => e.stopPropagation()} // Stop propagation to prevent React Flow keydown handlers
        onMouseDown={(e) => e.stopPropagation()} // Stop mousedown propogation to allow text selection
      />
    </div>
  );
};

export default BlockNote;
