"use client";

import { ReactNode, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RecoilRoot } from "recoil";
import { Global } from "@emotion/react";
import { globalStyles } from "@/styles/global";

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <RecoilRoot>
      <QueryClientProvider client={queryClient}>
        <Global styles={globalStyles} />
        {children}
      </QueryClientProvider>
    </RecoilRoot>
  );
}
