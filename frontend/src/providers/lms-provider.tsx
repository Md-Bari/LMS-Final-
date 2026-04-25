"use client";

import type { ReactNode } from "react";

import { MockLmsProvider, useMockLms } from "@/providers/mock/mock-lms-provider";

export function LmsProvider({ children }: { children: ReactNode }) {
  return <MockLmsProvider>{children}</MockLmsProvider>;
}

export const useLms = useMockLms;

export { dashboardPathForRole } from "@/providers/mock/mock-lms-provider";
