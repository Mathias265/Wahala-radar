import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import WebSocket from "ws";

declare module "#app" {
  interface NuxtApp {
    $supabaseClient?: SupabaseClient;
  }
}

export const useDb = (): SupabaseClient => {
  const nuxtApp = useNuxtApp();

  // Reuse the client within the current Nuxt application instance
  if (!nuxtApp.$supabaseClient) {
    const config = useRuntimeConfig();

    nuxtApp.$supabaseClient = createClient(
      config.public.supabaseUrl as string,
      config.public.supabaseAnonKey as string,
      {
        ...(import.meta.server
          ? {
              realtime: {
                transport: WebSocket,
              },
            }
          : {}),
      }
    );
  }

  return nuxtApp.$supabaseClient;
};
