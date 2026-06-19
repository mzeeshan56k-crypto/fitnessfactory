import { clients, getClient } from "@/lib/data";

// The client persona used for the member-facing app demo.
export const CURRENT_CLIENT_ID = "c1";

export function getCurrentClient() {
  return getClient(CURRENT_CLIENT_ID) ?? clients[0];
}
