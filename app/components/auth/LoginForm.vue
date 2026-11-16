<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { useAuth } from "~/composables/useAuth";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();

const db = useDb();
const { signUp, signIn } = useAuth();

const tab = ref("account");
const email = ref("");
const password = ref("");
const userName = ref("");
const error = ref("");
const info = ref("");
const loading = ref(false);
const googleLoading = ref(false);

const handleSignup = async () => {
  error.value = "";
  info.value = "";
  loading.value = true;

  try {
    await signUp(email.value, password.value);

    const {
      data: { session },
    } = await db.auth.getSession();

    if (!session) {
      // email confirmation is switched on: there is no session until they confirm
      info.value = "Check your email to confirm your account, then log in.";
      tab.value = "password";
      return;
    }

    // best effort: save the username they typed (onboarding lets them change it)
    if (userName.value.trim()) {
      await db
        .from("profiles")
        .update({ username: userName.value.trim() })
        .eq("id", session.user.id);
    }

    await navigateTo("/auth/callback");
  } catch (err: any) {
    error.value = err.message || "An unexpected error occurred.";
  } finally {
    loading.value = false;
  }
};

const handleLogin = async () => {
  error.value = "";
  info.value = "";
  loading.value = true;

  try {
    await signIn(email.value, password.value);
    // the callback page sends new users to onboarding and everyone else to /home
    await navigateTo("/auth/callback");
  } catch (err: any) {
    error.value = err.message || "An unexpected error occurred.";
  } finally {
    loading.value = false;
  }
};

const handleGoogle = async () => {
  error.value = "";
  info.value = "";
  googleLoading.value = true;

  const { error: oauthError } = await db.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: { prompt: "select_account" },
    },
  });

  if (oauthError) {
    console.error("Google sign-in error:", oauthError);
    error.value = oauthError.message;
    googleLoading.value = false;
  }
  // on success the browser leaves for Google, so the loading state stays on
};
</script>

<template>
  <div class="">
    <Tabs v-model="tab" class="w-full">
      <TabsList class="grid w-full grid-cols-2">
        <TabsTrigger
          value="account"
          class="data-[state=active]:bg-[#0B6B3A] bg-[#E8F5EC] text-[#064423] data-[state=active]:text-white data-[state=active]:font-semibold"
        >
          Sign up
        </TabsTrigger>

        <TabsTrigger
          value="password"
          class="data-[state=active]:bg-[#0B6B3A] bg-[#E8F5EC] text-[#064423] data-[state=active]:text-white data-[state=active]:font-semibold"
        >
          Log in
        </TabsTrigger>
      </TabsList>

      <!-- SIGN UP -->
      <TabsContent value="account">
        <form
          :class="cn('flex flex-col gap-6', props.class)"
          @submit.prevent="handleSignup"
        >
          <FieldGroup>
            <div class="mt-5">
              <h1
                class="font-display text-3xl font-extrabold tracking-tight text-[#064423]"
              >
                Create your account
              </h1>
            </div>
            <p v-if="error" class="text-sm text-red-500 text-center">
              {{ error }}
            </p>
            <p
              v-if="info"
              class="text-sm text-[#0B6B3A] text-center font-medium"
            >
              {{ info }}
            </p>

            <Field>
              <FieldLabel for="signup-username">Username</FieldLabel>
              <Input
                id="signup-username"
                type="text"
                v-model="userName"
                placeholder="Enter your username"
                required
              />
            </Field>

            <Field>
              <FieldLabel for="signup-email">Email</FieldLabel>
              <Input
                id="signup-email"
                type="email"
                v-model="email"
                placeholder="m@example.com"
                required
              />
            </Field>

            <Field>
              <FieldLabel for="signup-password">Password</FieldLabel>
              <Input
                id="signup-password"
                type="password"
                v-model="password"
                placeholder="At least 8 characters"
                minlength="8"
                required
              />
            </Field>

            <Field>
              <Button
                type="submit"
                class="bg-[#064423] hover:bg-[#0B6B3A]"
                :disabled="loading || googleLoading"
              >
                {{ loading ? "Creating account..." : "Create account" }}
              </Button>
            </Field>

            <FieldSeparator>Or continue with</FieldSeparator>

            <Field>
              <Button
                variant="outline"
                type="button"
                :disabled="googleLoading || loading"
                @click="handleGoogle"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  class="h-4 w-4"
                  xml:space="preserve"
                >
                  <path
                    fill="#EA4335"
                    d="M12.2 5c1.7 0 3 .7 3.7 1.4l2.8-2.8C16.9 1.8 14.8 1 12.2 1 7.6 1 3.7 3.6 1.8 7.4l3.3 2.6C6 6.9 8.8 5 12.2 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12.2v4.5h6.4c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.1-2 3.6-4.9 3.6-8.8z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.1 10c-.2-.7-.4-1.4-.4-2.2 0-.8.1-1.5.4-2.2L1.8 3C.6 5.3 0 7.9 0 10.7c0 2.8.6 5.4 1.8 7.7l3.3-2.6c-.3-.7-.4-1.4-.4-2.2z"
                  />
                  <path
                    fill="#34A853"
                    d="M12.2 19c-3.4 0-6.2-1.9-7.1-4.8L1.8 16.8c1.9 3.8 5.8 6.4 10.4 6.4 3.7 0 6.9-1.2 9.2-3.3l-3.7-2.9c-1.1.7-2.6 1.2-4.5 1.2z"
                  />
                </svg>
                {{ googleLoading ? "Redirecting..." : "Continue with Google" }}
              </Button>

              <FieldDescription class="text-center">
                Already have an account?
                <button
                  type="button"
                  class="text-[#064423] font-semibold hover:underline"
                  @click="tab = 'password'"
                >
                  Log in
                </button>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </TabsContent>

      <!-- LOG IN -->
      <TabsContent value="password">
        <form
          :class="cn('flex flex-col gap-6', props.class)"
          @submit.prevent="handleLogin"
        >
          <FieldGroup>
            <div class="mt-5">
              <h1
                class="font-display text-3xl font-extrabold tracking-tight text-[#064423]"
              >
                Welcome back
              </h1>
              <p class="text-sm text-muted-foreground mt-1">
                Enter your credentials to access your account.
              </p>
            </div>
            <p
              v-if="error"
              class="text-sm text-red-500 text-center font-medium"
            >
              {{ error }}
            </p>
            <p
              v-if="info"
              class="text-sm text-[#0B6B3A] text-center font-medium"
            >
              {{ info }}
            </p>

            <Field>
              <FieldLabel for="login-email">Email</FieldLabel>
              <Input
                id="login-email"
                type="email"
                v-model="email"
                placeholder="m@example.com"
                required
              />
            </Field>

            <Field>
              <div class="flex items-center justify-between">
                <FieldLabel for="login-password">Password</FieldLabel>
                <a
                  href="/forgot-password"
                  class="text-sm text-[#064423] hover:underline"
                >
                  Forgot password?
                </a>
              </div>

              <Input
                id="login-password"
                type="password"
                v-model="password"
                placeholder="Enter your password"
                required
              />
            </Field>

            <Field>
              <Button
                type="submit"
                class="bg-[#064423] hover:bg-[#0B6B3A] flex items-center justify-center gap-2"
                :disabled="loading || googleLoading"
              >
                <svg
                  v-if="loading"
                  class="animate-spin h-4 w-4 text-current"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {{ loading ? "Logging in..." : "Log in" }}
              </Button>
            </Field>

            <FieldSeparator>Or continue with</FieldSeparator>

            <Field>
              <Button
                variant="outline"
                type="button"
                :disabled="googleLoading || loading"
                @click="handleGoogle"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  class="h-4 w-4"
                  xml:space="preserve"
                >
                  <path
                    fill="#EA4335"
                    d="M12.2 5c1.7 0 3 .7 3.7 1.4l2.8-2.8C16.9 1.8 14.8 1 12.2 1 7.6 1 3.7 3.6 1.8 7.4l3.3 2.6C6 6.9 8.8 5 12.2 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12.2v4.5h6.4c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.1-2 3.6-4.9 3.6-8.8z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.1 10c-.2-.7-.4-1.4-.4-2.2 0-.8.1-1.5.4-2.2L1.8 3C.6 5.3 0 7.9 0 10.7c0 2.8.6 5.4 1.8 7.7l3.3-2.6c-.3-.7-.4-1.4-.4-2.2z"
                  />
                  <path
                    fill="#34A853"
                    d="M12.2 19c-3.4 0-6.2-1.9-7.1-4.8L1.8 16.8c1.9 3.8 5.8 6.4 10.4 6.4 3.7 0 6.9-1.2 9.2-3.3l-3.7-2.9c-1.1.7-2.6 1.2-4.5 1.2z"
                  />
                </svg>
                {{ googleLoading ? "Redirecting..." : "Continue with Google" }}
              </Button>

              <FieldDescription class="text-center">
                Don't have an account?
                <button
                  type="button"
                  class="text-[#064423] font-semibold hover:underline"
                  @click="tab = 'account'"
                >
                  Sign up
                </button>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </TabsContent>
    </Tabs>
  </div>
</template>
