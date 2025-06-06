import React, { useState, useEffect, useCallback } from 'react';

// --- Placeholder for child components ---
const PlaceholderBlockSettingGeneral: React.FC<any> = ({ data, onChange }) => (
  <div>
    <h4>General Settings (Placeholder)</h4>
    <label>
      Debug Mode:
      <input
        type="checkbox"
        checked={data.debugMode || false}
        onChange={(e) => onChange({ ...data, debugMode: e.target.checked })}
      />
    </label>
  </div>
);

const PlaceholderBlockSettingOnError: React.FC<any> = ({ data, onChange }) => (
  <div>
    <h4>On Error Settings (Placeholder)</h4>
    <label>
      Enable:
      <input
        type="checkbox"
        checked={data.enable || false}
        onChange={(e) => onChange({ ...data, enable: e.target.checked })}
      />
    </label>
    {/* Add more fields as needed based on BlockSettingOnError.vue */}
  </div>
);

const PlaceholderBlockSettingLines: React.FC<any> = ({ blockId }) => (
  <div>
    <h4>Lines Settings for Block ID: {blockId} (Placeholder)</h4>
    {/* Content for line settings */}
  </div>
);
// --- End Placeholder child components ---

// --- Placeholder for UI components (Tabs) ---
interface TabProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}
const UiTab: React.FC<TabProps> = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    style={{
      padding: '10px',
      borderBottom: isActive ? '2px solid blue' : '2px solid transparent',
      marginRight: '5px',
    }}
  >
    {label}
  </button>
);

interface EditBlockSettingsProps {
  // data prop similar to Vue's: { id: string, data: { onError?: object, settings?: object }, ... }
  blockData: {
    id: string; // block type id like 'trigger', 'delay' etc.
    blockId: string; // unique instance id of the block
    data: {
      onError?: any;
      settings?: any;
      // other block-specific data
    };
    itemId?: any; // Used to determine if "Lines" tab is shown
  };
  onErrorLabel?: string;
  onSettingsChange: (newSettings: { settings?: any; onError?: any }) => void;
  // onClose: () => void; // If the component itself has a close button
}

// Based on excludeOnError in Vue
const excludeOnError = ['trigger', 'delay', 'export-data', 'element-exists', 'execute-workflow', 'webhook', 'wait-connections'];

const EditBlockSettings: React.FC<EditBlockSettingsProps> = ({
  blockData,
  onErrorLabel,
  onSettingsChange,
}) => {
  const [activeTab, setActiveTab] = useState('general');
  const [retrieved, setRetrieved] = useState(false);

  const defaultSettings = {
    onError: {
      retry: false,
      enable: false,
      retryTimes: 1,
      retryInterval: 2,
      toDo: 'error',
      errorMessage: '',
      insertData: false,
      dataToInsert: [],
    },
    general: {
      debugMode: false,
    },
  };

  const [generalSettings, setGeneralSettings] = useState(
    { ...defaultSettings.general, ...(blockData.data.settings || {}) }
  );
  const [onErrorSettings, setOnErrorSettings] = useState(
    { ...defaultSettings.onError, ...(blockData.data.onError || {}) }
  );

  const t = (key: string, defaultVal?: string) => defaultVal || key; // Placeholder i18n

  const isOnErrorSupported = !excludeOnError.includes(blockData.id);
  const tabs = [{ id: 'general', name: t('settings.menu.general', 'General') }];

  if (isOnErrorSupported) {
    tabs.push({
      id: 'on-error',
      name: onErrorLabel || t('workflow.blocks.base.onError.button', 'On Error'),
    });
  }
  if (!blockData.itemId) { // itemId is present for items in a package block
    tabs.push({ id: 'lines', name: t('workflow.blocks.base.settings.line.title', 'Lines') });
  }


  useEffect(() => {
    // Simulate defu merge from Vue component
    setGeneralSettings(prev => ({ ...defaultSettings.general, ...(blockData.data.settings || {}), ...prev }));
    setOnErrorSettings(prev => ({ ...defaultSettings.onError, ...(blockData.data.onError || {}), ...prev }));

    // Simulate onMounted delay
    const timer = setTimeout(() => {
      setRetrieved(true);
    }, 200);
    return () => clearTimeout(timer);
  }, [blockData.data.settings, blockData.data.onError]);


  const handleGeneralSettingsChange = (newGenSettings: any) => {
    if (!retrieved) return;
    setGeneralSettings(newGenSettings);
    onSettingsChange({ settings: newGenSettings });
  };

  const handleOnErrorSettingsChange = (newErrSettings: any) => {
    if (!retrieved) return;
    setOnErrorSettings(newErrSettings);
    onSettingsChange({ onError: newErrSettings });
  };

  if (!retrieved) {
    return <div>Loading settings...</div>;
  }

  return (
    <div className="edit-block-settings p-4">
      <div className="tabs-header border-b border-gray-200 dark:border-gray-700 mb-4">
        {tabs.map((tab) => (
          <UiTab
            key={tab.id}
            label={tab.name}
            isActive={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          />
        ))}
      </div>
      <div className="tab-content">
        {activeTab === 'general' && (
          <PlaceholderBlockSettingGeneral
            data={generalSettings}
            block={blockData} // Pass original block data if needed by child
            onChange={handleGeneralSettingsChange}
          />
        )}
        {activeTab === 'on-error' && isOnErrorSupported && (
          <PlaceholderBlockSettingOnError
            data={onErrorSettings}
            onChange={handleOnErrorSettingsChange}
          />
        )}
        {activeTab === 'lines' && !blockData.itemId && (
          <PlaceholderBlockSettingLines blockId={blockData.blockId} />
        )}
      </div>
    </div>
  );
};

export default EditBlockSettings;
