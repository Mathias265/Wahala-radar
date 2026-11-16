<template>
  <div
    class="min-h-screen flex flex-col items-center justify-center gap-8 bg-[#E4F5EA] px-6"
  >
    <!-- Radar -->
    <div class="radar" aria-hidden="true">
      <span class="ring" style="--d: 0s"></span>
      <span class="ring" style="--d: 0.8s"></span>
      <span class="ring" style="--d: 1.6s"></span>

      <span class="sweep"></span>

      <span class="blip b1"></span>
      <span class="blip b2"></span>
      <span class="blip b3"></span>

      <span class="core"></span>
    </div>

    <!-- Logo -->
    <img
      src="~/assets/images/logo-lockup.svg"
      alt="Wahala Radar"
      class="w-48 md:w-56 h-auto"
    />

    <p class="text-[#064423] text-sm font-bold animate-pulse">
      Signing you in...
    </p>
  </div>
</template>

<script setup>
// Google sends people here. First-time users go to onboarding,
// returning users go straight to the home page.
definePageMeta({ layout: false });

const { user, initUser } = useAuth();
const { fetchProfile } = useProfile();
const { gtag } = useGtag();

onMounted(async () => {
  const started = Date.now();

  // give the OAuth session a moment to be picked up from the URL
  for (let i = 0; i < 6 && !user.value; i++) {
    await initUser();
    if (!user.value) await new Promise((r) => setTimeout(r, 500));
  }

  // keep the animation on screen for at least 1.5s so it doesn't flash
  const waitMinimum = async () => {
    const remaining = 1500 - (Date.now() - started);
    if (remaining > 0) await new Promise((r) => setTimeout(r, remaining));
  };

  if (!user.value) {
    await waitMinimum();
    return navigateTo("/", { replace: true });
  }

  // Track successful sign-in in Google Analytics
  const authMethod = user.value.app_metadata?.provider || "email";
  gtag("event", "login", {
    method: authMethod,
  });

  // Attach Supabase User ID so GA4 counts unique active users accurately
  const gtagId = useRuntimeConfig().public.gtag?.id;
  if (gtagId && user.value.id) {
    gtag("config", gtagId, {
      user_id: user.value.id,
    });
  }

  const profile = await fetchProfile(true).catch(() => null);
  await waitMinimum();
  await navigateTo(profile?.onboarded ? "/home" : "/onboarding", {
    replace: true,
  });
});
</script>

<style scoped>
.radar {
  position: relative;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  border: 2px solid rgb(6 68 35 / 0.35);
  background: radial-gradient(
    circle,
    rgb(11 107 58 / 0.12),
    rgb(11 107 58 / 0.02) 70%
  );
  overflow: hidden;
}

/* inner guide circles and crosshair */
.radar::before {
  content: "";
  position: absolute;
  inset: 25%;
  border-radius: 50%;
  border: 1.5px solid rgb(6 68 35 / 0.25);
}
.radar::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(rgb(6 68 35 / 0.18), rgb(6 68 35 / 0.18)) center /
      1.5px 100% no-repeat,
    linear-gradient(rgb(6 68 35 / 0.18), rgb(6 68 35 / 0.18)) center / 100%
      1.5px no-repeat;
}

/* pulses expanding from the centre */
.ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid #0b6b3a;
  opacity: 0;
  animation: ping 2.4s cubic-bezier(0, 0, 0.2, 1) infinite;
  animation-delay: var(--d);
}
@keyframes ping {
  0% {
    transform: scale(0.15);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}

/* rotating sweep */
.sweep {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg 270deg,
    rgb(11 107 58 / 0.55) 360deg
  );
  animation: spin 2s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* blips that flash as the sweep passes */
.blip {
  position: absolute;
  height: 10px;
  width: 10px;
  border-radius: 50%;
  background: #064423;
  opacity: 0;
  animation: blink 2s linear infinite;
}
.b1 {
  top: 22%;
  left: 62%;
  animation-delay: 0.1s;
}
.b2 {
  top: 66%;
  left: 70%;
  animation-delay: 0.65s;
}
.b3 {
  top: 58%;
  left: 24%;
  animation-delay: 1.3s;
}
@keyframes blink {
  0%,
  8% {
    opacity: 1;
    transform: scale(1.4);
  }
  50%,
  100% {
    opacity: 0;
    transform: scale(1);
  }
}

/* centre dot */
.core {
  position: absolute;
  top: 50%;
  left: 50%;
  height: 14px;
  width: 14px;
  margin: -7px 0 0 -7px;
  border-radius: 50%;
  background: #064423;
  box-shadow: 0 0 0 0 rgb(6 68 35 / 0.5);
  animation: glow 1.6s ease-out infinite;
}
@keyframes glow {
  to {
    box-shadow: 0 0 0 16px rgb(6 68 35 / 0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .ring,
  .sweep,
  .blip,
  .core {
    animation: none;
  }
  .blip {
    opacity: 1;
  }
}
</style>
