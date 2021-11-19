// @ts-nocheck

import React, { useRef, useEffect } from "react";
import { plugin } from "../core/umiExports";
import { ApplyPluginsType } from 'umi';
import { useModel } from "../plugin-model/useModel";
if (typeof useModel !== "function") {
  throw new Error(
    "[plugin-initial-state]: useModel is not a function, @umijs/plugin-model is required."
  );
}

interface Props {
  children: React.ReactNode;
}
export default (props: Props) => {
  const { children } = props;
  const appLoaded = useRef(false);
  // 获取用户的配置，暂时只支持 loading
  const useRuntimeConfig =
    plugin.applyPlugins({
      key: "initialStateConfig",
      type: ApplyPluginsType.modify,
      initialValue: {},
    }) || {};
  const { loading = false } = useModel("@@initialState") || {};
  useEffect(() => {
    if (!loading) {
      appLoaded.current = true;
    }
  }, [loading]);
  // initial state loading 时，阻塞渲染
  if (loading && !appLoaded.current) {
    return useRuntimeConfig.loading || null;
  }
  return children;
};
