"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";

interface User {
  id: string;
  name: string;
  role: string;
}

interface UserContextType {
  currentUser: User | null;
  users: User[];
  setCurrentUser: (user: User | null) => void;
  refreshUsers: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  currentUser: null,
  users: [],
  setCurrentUser: () => {},
  refreshUsers: async () => {},
});

export function useCurrentUser() {
  return useContext(UserContext);
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  const refreshUsers = useCallback(async () => {
    const res = await fetch("/api/users");
    const data = await res.json();
    setUsers(data);
  }, []);

  useEffect(() => {
    refreshUsers();
    const savedId = localStorage.getItem("endless-bt-user-id");
    if (savedId) {
      fetch("/api/users")
        .then((r) => r.json())
        .then((allUsers: User[]) => {
          const found = allUsers.find((u) => u.id === savedId);
          if (found) setCurrentUserState(found);
        });
    }
  }, [refreshUsers]);

  const setCurrentUser = (user: User | null) => {
    setCurrentUserState(user);
    if (user) {
      localStorage.setItem("endless-bt-user-id", user.id);
    } else {
      localStorage.removeItem("endless-bt-user-id");
    }
  };

  return (
    <UserContext.Provider value={{ currentUser, users, setCurrentUser, refreshUsers }}>
      {children}
    </UserContext.Provider>
  );
}
