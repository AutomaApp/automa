import React, { useState, useEffect, useMemo } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import BlockBase, { BlockBaseProps, RemixIcon } from './BlockBase'; // Assuming BlockBase.tsx

// Define structure for input/output items
interface PackageIOItem {
  id: string; // Unique ID for the handle
  name: string;
}

// Define structure for block definition data BlockPackage expects
interface BlockPackageDefinition {
  id: string; // e.g., 'package'
  name: string; // Default name "Package" (but usually overridden by data.name)
  icon?: string; // Default icon if data.icon is not present
  category?: { color?: string };
}

import { usePackageStore, PackageData as PackageStorePackageData } from '@/stores/packageStore'; // Adjust path as needed

// Define data structure for BlockPackage node
// This can extend the store's PackageData if they are very similar,
// or map to it. For now, let's keep it distinct to match component's specific needs.
export interface BlockPackageData {
  packageId?: string; // The actual ID of the package definition/metadata from the store
  name?: string;
  icon?: string; // URL or Remixicon name
  author?: string;
  inputs?: PackageIOItem[];
  outputs?: PackageIOItem[];

  disableBlock?: boolean;
  $breakpoint?: boolean;
  blockDefinition?: BlockPackageDefinition; // Static definition for "Package" block type itself
  // Original full data from the store, if needed for install/update actions
  originalPackageData?: PackageStorePackageData;


  // Callbacks from WorkflowEditor
  onUpdateData?: (updatedData: Partial<BlockPackageData>) => void;
  onDelete?: () => void;
  onSettings?: () => void;
  onEdit?: () => void;
}

const BlockPackage: React.FC<NodeProps<BlockPackageData>> = ({ id: instanceId, data, selected, type }) => {
  const {
    // packageId is critical. It should be the ID used to find the package in the store.
    // It might be data.id from the node, or data.packageId if specifically set.
    packageId = data.id,
    name = 'Unnamed Package',
    icon = 'riBox3Line',
    author,
    inputs = [],
    outputs = [],
    disableBlock,
    $breakpoint,
    blockDefinition, // This is for the "Package" block type itself
    originalPackageData, // This would be the full package data from the store
    onUpdateData,
    onDelete,
    onSettings,
    onEdit,
  } = data;

  const { getEdges, deleteElements } = useReactFlow();
  const t = (key: string, defaultVal?: string) => defaultVal || key; // Placeholder i18n

  // Zustand store integration
  const storeGetById = usePackageStore((state) => state.getById);
  const storeIsShared = usePackageStore((state) => state.isShared); // Example if needed
  const storeInstallPackage = usePackageStore((state) => state.insert);
  const storeUpdatePackage = usePackageStore((state) => state.update);

  // Determine installation status from the store
  const isInstalled = useMemo(() => {
    if (!packageId) return false;
    return !!storeGetById(packageId);
  }, [packageId, storeGetById]);

  // Note: The original Pinia store had isExternal and other fields.
  // The `data` prop for this node should ideally contain all necessary info (like `packageId`, `name`, `icon`, `author`, `inputs`, `outputs`).
  // `originalPackageData` can hold the raw package object from the store if needed for updates.
  const currentPackageDataForStoreAction = useMemo(() => ({
    id: packageId, // This is the package's own ID from the store/registry
    name,
    icon,
    author,
    inputs,
    outputs,
    // Include other fields that `storeInstallPackage` or `storeUpdatePackage` expect,
    // e.g., content, variables, settings, data (nodes/edges of package).
    // These might need to be part of `data.originalPackageData` or constructed.
    // For simplicity, passing what's available in current `data` prop.
    ...originalPackageData, // Spread the original full package data from the store
    ...data, // Spread current node data to capture any local overrides before sending to store
  }), [packageId, name, icon, author, inputs, outputs, data, originalPackageData]);

  const definition = useMemo<BlockPackageDefinition>(() => data.blockDefinition || {
    id: type, // 'package' block type
    name: 'Package', // Default name for "Package" type blocks
    category: { color: 'bg-green-200' },
    icon: 'riBox3Line', // Default icon for "Package" type blocks
  }, [data.blockDefinition, type]);

  // Use the dynamic package name for the BlockBase header if available, else instanceId
  const blockBaseHeaderName = name || instanceId;

  const blockBaseProps: BlockBaseProps = {
    blockId: instanceId,
    data: { disableBlock, $breakpoint, ...data },
    blockData: { details: { id: definition.id, name: blockBaseHeaderName, icon: data.icon || definition.icon } },
    onDelete,
    onEdit: onEdit || onSettings,
    onSettings,
    onUpdate: onUpdateData,
    selected,
    contentClass: 'p-2',
  };

  const handleInstallPackage = async () => {
    if (packageId) {
      try {
        // `currentPackageDataForStoreAction` should be shaped like what `store.insert` expects
        await storeInstallPackage(currentPackageDataForStoreAction, false); // newId = false, as packageId already exists
        // No need to manually set isInstalled; it's derived from store via useMemo
        console.log(`Package ${packageId} install initiated via store.`);
      } catch (error) {
        console.error(`Error installing package ${packageId} via store:`, error);
      }
    } else {
      console.warn('Cannot install package: packageId is missing.');
    }
  };

  const handleUpdatePackage = async () => {
    if (packageId) {
      try {
        // The Pinia update action took { id, data }.
        // The Zustand update action takes (id, dataToUpdate).
        // We need to pass only the fields that are meant to be updated if the store action is partial,
        // or the full package data if the store action expects the full new state.
        // For now, assuming storeUpdatePackage expects the full new state for the package.
        const updatedStoreData = await storeUpdatePackage(packageId, currentPackageDataForStoreAction);

        if (updatedStoreData && onUpdateData) {
          // The node's data should be updated to reflect changes from the store
          // e.g., if inputs/outputs changed after an update.
          // This might involve mapping `updatedStoreData` back to `BlockPackageData` structure.
          onUpdateData({
            ...data, // Keep existing non-package specific data
            name: updatedStoreData.name,
            icon: updatedStoreData.icon,
            author: updatedStoreData.author,
            inputs: updatedStoreData.inputs,
            outputs: updatedStoreData.outputs,
            originalPackageData: updatedStoreData, // Update original data from store
            // any other relevant fields from updatedStoreData
          });
          console.log(`Package ${packageId} update initiated via store.`);
        }
      } catch (error) {
        console.error(`Error updating package ${packageId} via store:`, error);
      }
    } else {
      console.warn('Cannot update package: packageId is missing.');
    }
  };

  const displayIcon = icon && icon.startsWith('http');

  return (
    <BlockBase {...blockBaseProps} className="block-package w-72"> {/* w-64 in vue */}
      <div className="flex items-center mb-2">
        {displayIcon ? (
          <img src={icon} alt={name} width="32" height="32" className="mr-2 rounded-md object-cover" />
        ) : (
          <div className={`mr-2 inline-block rounded-md p-1.5 text-sm ${disableBlock ? 'bg-gray-300' : (definition.category?.color || 'bg-gray-200')} dark:text-black`}>
            <RemixIcon name={icon || definition.icon || 'riBox3Line'} size="20" />
          </div>
        )}
        <span className="font-semibold text-sm truncate flex-grow" title={name}>{name}</span>

        <div className="ml-2">
          {isInstalled ? (
            <button title="Update package" onClick={handleUpdatePackage} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
              <RemixIcon name="riRefreshLine" size="18" />
            </button>
          ) : (
            <button title="Install package" onClick={handleInstallPackage} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
              <RemixIcon name="riDownloadLine" size="18" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-1 grid grid-cols-2 gap-x-2">
        <ul className="pkg-handle-container space-y-0.5">
          {inputs.map((input) => (
            <li key={input.id} title={input.name} className="target relative h-7 flex items-center text-xs pl-2">
              <Handle
                type="target"
                position={Position.Left}
                id={`${instanceId}-input-${input.id}`}
                style={{ background: '#555', marginLeft: '-17px' }} // Adjusted for visibility
              />
              <p className="truncate">{input.name}</p>
            </li>
          ))}
        </ul>
        <ul className="pkg-handle-container space-y-0.5">
          {outputs.map((output) => (
            <li key={output.id} title={output.name} className="source relative h-7 flex items-center justify-end text-xs pr-2">
              <p className="truncate">{output.name}</p>
              <Handle
                type="source"
                position={Position.Right}
                id={`${instanceId}-output-${output.id}`}
                style={{ background: '#555', marginRight: '-17px' }} // Adjusted for visibility
              />
            </li>
          ))}
        </ul>
      </div>

      {author && (
        <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
          <p>By {author}</p>
          {packageId && (
            <a
              href={`https://automa.site/packages/${packageId}`} // Use packageId here
              target="_blank"
              rel="noopener noreferrer"
              title="Open package page"
              className="ml-1.5 hover:text-blue-500"
              onClick={(e) => e.stopPropagation()} // Prevent node selection
            >
              <RemixIcon size="16" name="riExternalLinkLine" />
            </a>
          )}
        </div>
      )}
      {/* Minimal styling for handles, similar to Vue version's intent */}
      <style jsx>{`
        .pkg-handle-container li .react-flow__handle {
          width: 8px;
          height: 8px;
        }
        .pkg-handle-container li.target .react-flow__handle {
          /* margin-left: -33px; from vue, reactflow handles are different */
        }
        .pkg-handle-container li.source .react-flow__handle {
          /* margin-right: -33px; from vue */
        }
      `}</style>
    </BlockBase>
  );
};

export default BlockPackage;
