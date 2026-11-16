<template>
  <div class="min-h-screen flex items-center justify-center bg-[#E4F5EA]">
    <p class="text-[#064423] font-bold animate-pulse">Loading...</p>
  </div>
</template>

<script setup>
definePageMeta({ layout: false });

const { user, initUser } = useAuth();

onMounted(async () => {
  await initUser();
  await navigateTo(user.value ? "/home" : "/login", { replace: true });
});
</script>
