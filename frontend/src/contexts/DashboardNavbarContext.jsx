import React, { createContext, useCallback, useContext, useState } from 'react';

const defaultConfig = {
  subtitle: '',
  back: null,
  search: null,
};

const DashboardNavbarContext = createContext(null);

export const DashboardNavbarProvider = ({ children }) => {
  const [config, setConfig] = useState(defaultConfig);

  const setNavbarConfig = useCallback((partial) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetNavbarConfig = useCallback(() => {
    setConfig(defaultConfig);
  }, []);

  return (
    <DashboardNavbarContext.Provider
      value={{ config, setNavbarConfig, resetNavbarConfig }}
    >
      {children}
    </DashboardNavbarContext.Provider>
  );
};

export const useDashboardNavbar = (pageConfig) => {
  const ctx = useContext(DashboardNavbarContext);
  if (!ctx) return;

  const { setNavbarConfig, resetNavbarConfig } = ctx;

  React.useEffect(() => {
    if (!pageConfig) {
      resetNavbarConfig();
      return undefined;
    }

    setNavbarConfig(pageConfig);
    return () => resetNavbarConfig();
  }, [pageConfig, resetNavbarConfig, setNavbarConfig]);
};

export const useDashboardNavbarConfig = () => {
  const ctx = useContext(DashboardNavbarContext);
  return ctx?.config ?? defaultConfig;
};
