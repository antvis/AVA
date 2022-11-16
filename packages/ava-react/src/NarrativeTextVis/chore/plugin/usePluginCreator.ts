import { useState, useEffect } from 'react';
import { PluginManager } from './PluginManager';
import { PluginType } from './plugin-protocol.type';

export const usePluginCreator = (pluginManager?: PluginManager, plugins?: PluginType[]) => {
  const [innerPluginManager, setInnerPluginManager] = useState<PluginManager>(null);
  useEffect(() => {
    if (!innerPluginManager) {
      if (pluginManager) {
        setInnerPluginManager(pluginManager);
        // Additional registration
        if (plugins) {
          innerPluginManager.registerAll(plugins);
        }
      } else {
        setInnerPluginManager(new PluginManager(plugins));
      }
    }
  }, [pluginManager, plugins]);
  return innerPluginManager;
};
