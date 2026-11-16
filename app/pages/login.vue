<script lang="ts">
export const description = "A two column login page with a cover image.";
</script>

<script setup lang="ts">
import { GalleryVerticalEnd } from "@lucide/vue";
import LoginForm from "@/components/auth/LoginForm.vue";
</script>

<template>
  <div class="grid min-h-svh lg:grid-cols-2">
    <div class="bg-[#064423] relative hidden lg:block p-6">
      <div class="flex justify-center gap-2 md:justify-start">
        <a href="#" class="flex items-center gap-2 font-medium">
          <div class="flex size-6 items-center justify-center rounded-md">
            <img
              src="~/assets/images/logo-icon-reversed.svg"
              alt=""
              class="size-56"
            />
          </div>
          <h1
            class="font-display text-xl font-extrabold tracking-tight text-white"
          >
            Wahala Rader
          </h1>
        </a>
      </div>

      <section class="flex justify-start flex-col h-full mt-20">
        <img src="/radar-illustration.svg" alt="" class="size-76 mb-10" />
        <div>
          <h1
            class="font-display text-4xl font-extrabold tracking-tight text-white"
          >
            Join your neighbours.See <br />
            wetin day happen
          </h1>
          <p class="mt-4 text-lg text-white">
            Free to join. Report wahala, confirm gist, and help person avoid
            <br />
            stress.
          </p>
        </div>
        <div class="flex justify-start items-end mt-19">
          <p class="text-white">Made for Naija, by Naija</p>
        </div>
      </section>
    </div>
    <div class="flex flex-col gap-4 p-6 md:p-10">
      <div class="flex flex-1 items-center justify-center">
        <div class="w-full max-w-xs">
          <LoginForm />
        </div>
      </div>
    </div>
  </div>
</template>
