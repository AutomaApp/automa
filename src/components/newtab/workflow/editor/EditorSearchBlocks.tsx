import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useReactFlow, Node } from 'reactflow';

// Placeholder for ui-autocomplete or a simple custom autocomplete
interface AutocompleteItem {
  id: string;
  name: string;
  description: string;
  node: Node; // Store the actual node for easy access
}

interface EditorSearchBlocksProps {
  // No editor prop needed if using useReactFlow
}

const EditorSearchBlocks: React.FC<EditorSearchBlocksProps> = () => {
  const { getNodes, setViewport, addSelectedNodes, getNode } = useReactFlow();
  const [query, setQuery] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [filteredItems, setFilteredItems] = useState<AutocompleteItem[]>([]);
  const [allItems, setAllItems] = useState<AutocompleteItem[]>([]);
  const [initialViewport, setInitialViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const [selectedViaFocus, setSelectedViaFocus] = useState<Node | null>(null);


  const inputRef = useRef<HTMLInputElement>(null);
  const t = (key: string, defaultVal?: string) => defaultVal || key; // Placeholder i18n

  const extractBlocks = useCallback(() => {
    const nodes = getNodes();
    const items = nodes.map((node) => ({
      id: node.id,
      // Assuming 'name' might be in data.label or a dedicated data.name field.
      // The Vue component uses t(`workflow.blocks.${label}.name`) which implies 'label' might be a type key.
      // For now, let's try to get a displayable name.
      name: node.data.label || node.data.name || node.id,
      description: node.data.description || '',
      node,
    }));
    setAllItems(items);
    setFilteredItems(items); // Initially show all
  }, [getNodes]);

  useEffect(() => {
    if (isActive) {
      extractBlocks();
      const currentViewport = { x: 0, y: 0, zoom: 1 }; // TODO: Get current viewport, ReactFlow doesn't expose getTransform directly.
                                                       // viewport is available on ReactFlow instance or useReactFlow hook directly in some versions
                                                       // For now, this part of centering logic might be incomplete.
      // setInitialViewport(currentViewport);
      inputRef.current?.focus();
    }
  }, [isActive, extractBlocks]);

  const searchNodes = useCallback((searchText: string) => {
    const lowerText = searchText.toLowerCase();
    if (!lowerText) {
      setFilteredItems(allItems);
      return;
    }
    const filtered = allItems.filter(
      (item) =>
        item.id.toLowerCase().includes(lowerText) ||
        item.name.toLowerCase().includes(lowerText) ||
        item.description.toLowerCase().includes(lowerText)
    );
    setFilteredItems(filtered);
  }, [allItems]);

  const handleQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
    searchNodes(event.target.value);
  };

  const clearHighlightedNodes = () => {
    document.querySelectorAll('.search-select-node').forEach((el) => {
      el.classList.remove('search-select-node');
    });
  };

  const highlightNode = (nodeId: string) => {
    clearHighlightedNodes();
    const nodeElement = document.querySelector(`.react-flow__node[data-id="${nodeId}"]`);
    nodeElement?.classList.add('search-select-node');
  }

  const handleSelectItem = (item: AutocompleteItem) => {
    const node = item.node;
    if (!node) return;

    highlightNode(node.id);

    // Center view on the node. React Flow's setViewport is different from Vue Flow's setTransform.
    // It requires x, y for the top-left of the viewport, not the center.
    // Calculation for centering:
    const { position, width, height } = node;
    if (width && height) {
      // const zoom = 1; // Or keep current zoom, or get it from useReactFlow().getViewport()
      // const x = position.x - (viewportWidth / 2 / zoom) + (width / 2);
      // const y = position.y - (viewportHeight / 2 / zoom) + (height / 2);
      // setViewport({ x: -x, y: -y, zoom }); // This needs careful calculation based on viewport dimensions
      // For now, a simpler focus:
      setViewport({ x: position.x - 100, y: position.y - 50, zoom: 1 }, { duration: 300 });
    }
    setSelectedViaFocus(node); // Keep track of node focused by search
  };

  const handleConfirmItem = (item: AutocompleteItem) => {
    const node = getNode(item.id); // Get the latest node instance
    if (node) {
      addSelectedNodes([node.id]); // Selects the node
      handleSelectItem(item); // Focus and highlight
    }
    setIsActive(false); // Close search
    setQuery('');
    setFilteredItems([]);
    setSelectedViaFocus(null);
  };

  const handleBlur = () => {
    // Don't blur if an item was just clicked from results, allow click to process
    setTimeout(() => {
        if (!inputRef.current?.contains(document.activeElement) &&
            !document.querySelector('.search-results-list')?.contains(document.activeElement)) {

            // If a node was selected via search focus, but not confirmed, keep its highlight.
            // Otherwise, clear highlights and reset viewport if needed.
            if (!selectedViaFocus) {
                 clearHighlightedNodes();
                // props.editor.setTransform(initialState.position); // Restore initial viewport
            }
            setIsActive(false);
            setQuery('');
            setFilteredItems([]);
            // Do not reset selectedViaFocus here, allow it to persist until next search interaction
        }
    }, 100);
  };

  const toggleSearch = () => {
    if (isActive) { // If turning OFF search
        clearHighlightedNodes();
        setSelectedViaFocus(null); // Clear any node selection from search
    }
    setIsActive(!isActive);
  }

  return (
    <div className="editor-search-blocks ml-2 inline-flex items-center rounded-lg bg-white dark:bg-gray-800 shadow">
      <button
        title={t('workflow.searchBlocks.title', 'Search Blocks')}
        className="hoverable rounded-lg p-2"
        onClick={toggleSearch}
      >
        {/* Replace with an actual search icon */}
        <span role="img" aria-label="search">🔍</span>
      </button>
      {isActive && (
        <div className="search-input-and-results relative">
          <input
            ref={inputRef}
            type="search"
            placeholder={t('common.search', 'Search...')}
            value={query}
            onChange={handleQueryChange}
            onBlur={handleBlur}
            className="rounded-lg bg-transparent py-2 px-3 focus:ring-0 w-64" // Fixed width for active state
            autoFocus
          />
          {filteredItems.length > 0 && query && (
            <ul className="search-results-list absolute left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-20 max-h-60 overflow-y-auto">
              {filteredItems.map((item) => (
                <li
                  key={item.id}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  onMouseDown={(e) => e.preventDefault()} // Prevent input blur before click
                  onClick={() => handleConfirmItem(item)}
                  onFocus={() => handleSelectItem(item)} // Highlight and center on focus (e.g. keyboard nav)
                  tabIndex={0} // Make it focusable
                >
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">{item.description}</p>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">ID: {item.id}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {/* Styling for .search-select-node needs to be global or injected */}
      <style jsx global>{`
        .react-flow__node.search-select-node > div { /* Assuming custom node has a div child or adjust selector */
          outline: 3px solid #3b82f6 !important; /* Use important if needed to override other styles */
          box-shadow: 0 0 10px #3b82f6;
        }
        // Vue flow transition: .vue-flow.add-transition .vue-flow__transformationpane { transition: transform 250ms ease; }
        // React Flow doesn't have a direct equivalent class, but transitions can be applied to .react-flow__viewport
      `}</style>
    </div>
  );
};

export default EditorSearchBlocks;
