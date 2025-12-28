"use client";

import { Provider } from "react-redux";
import { useEffect } from "react";
import  store  from "./store";
import { Toaster } from "react-hot-toast";
import { refreshUser } from "@/lib/auth";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    refreshUser(store.dispatch);
  }, []);

  return (
    <Provider store={store}>
      <Toaster position="top-center" />
      {children}
    </Provider>
  );
}
