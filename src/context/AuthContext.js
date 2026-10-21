import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import * as authApi from "../api/auth";
import { getToken, setToken, removeToken } from "../api/storage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState(null);

  const restoreSession = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        setUser(null);
        setSessionError(null);
        return;
      }

      const { user: me } = await authApi.fetchMe();
      setUser(me);
      setSessionError(null);
    } catch (err) {
      if (err.response?.status === 401) {
        await removeToken();
        setUser(null);
        setSessionError(null);
      } else {
        setSessionError(err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = async (email, password) => {
    const { token, user: loggedInUser } = await authApi.login(email, password);
    await setToken(token);
    await queryClient.cancelQueries();
    queryClient.clear();
    setUser(loggedInUser);
    setSessionError(null);
    return loggedInUser;
  };

  const registerHeadmaster = async (payload) => {
    const { token, user: newUser } = await authApi.registerHeadmaster(payload);
    await setToken(token);
    await queryClient.cancelQueries();
    queryClient.clear();
    setUser(newUser);
    setSessionError(null);
    return newUser;
  };

  const logout = async () => {
    await removeToken();
    await queryClient.cancelQueries();
    queryClient.clear();
    setUser(null);
    setSessionError(null);
  };

  const refreshMe = async () => {
    const { user: me } = await authApi.fetchMe();
    setUser(me);
    setSessionError(null);
    return me;
  };

  const value = useMemo(
    () => ({ user, loading, sessionError, retrySession: restoreSession, login, registerHeadmaster, logout, refreshMe }),
    [user, loading, sessionError, restoreSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
