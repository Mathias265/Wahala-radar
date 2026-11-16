<template>
  <div class="min-h-screen flex flex-col bg-[#F7FAF8]">
    <header
      class="sticky top-0 z-40 border-b border-[#064423]/10 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/10"
    >
      <div
        class="mx-auto flex items-center justify-between gap-4 px-4 md:px-8 h-16"
      >
        <!-- Logo -->
        <NuxtLink to="/home" class="shrink-0" aria-label="Radar home">
          <img
            src="~/assets/images/logo-lockup.svg"
            alt="Radar Logo"
            class="h-auto w-32 md:w-40"
          />
        </NuxtLink>

        <!-- Desktop links (pill group) -->
        <nav
          class="hidden lg:flex items-center gap-1 rounded-full bg-[#064423]/[0.05] p-1"
        >
          <NuxtLink
            v-for="l in links"
            :key="l.to"
            :to="l.to"
            :class="[
              'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200',
              isActive(l.to)
                ? 'bg-white text-[#064423] shadow-sm ring-1 ring-[#064423]/10'
                : 'text-[#064423]/70 hover:text-[#064423] hover:bg-white/60',
            ]"
          >
            <component :is="l.icon" class="h-4 w-4" />
            {{ l.label }}
          </NuxtLink>
        </nav>

        <!-- Right side -->
        <div class="flex items-center gap-2 md:gap-3">
          <div
            v-if="profile?.area"
            class="hidden xl:flex items-center gap-1.5 rounded-full bg-[#E4F5EA] px-3 py-1.5 text-xs font-semibold text-[#064423]"
          >
            <MapPin class="h-3.5 w-3.5" />
            {{ profile.area
            }}<template v-if="profile.state">, {{ profile.state }}</template>
          </div>

          <Button
            variant="ghost"
            @click="wahalaModal = true"
            class="h-10 gap-1.5 rounded-full bg-[#064423] px-4 font-bold text-white shadow-sm transition-all hover:bg-[#042d17] hover:text-white hover:shadow-md active:scale-95 cursor-pointer"
          >
            <Plus class="h-4 w-4" />
            <span class="hidden sm:inline">Report Wahala</span>
            <span class="sm:hidden">Report</span>
          </Button>

          <!-- Account (desktop) -->
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                class="hidden lg:flex h-10 w-10 items-center justify-center rounded-full bg-[#E4F5EA] text-sm font-bold uppercase text-[#064423] ring-2 ring-transparent transition hover:ring-[#064423]/20 focus:outline-none focus-visible:ring-[#064423]/40"
                aria-label="Account menu"
              >
                {{ initial }}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="end" class="w-48">
              <DropdownMenuLabel v-if="profile?.username" class="truncate">
                @{{ profile.username }}
              </DropdownMenuLabel>
              <DropdownMenuSeparator v-if="profile?.username" />
              <DropdownMenuItem
                @click="logout"
                class="cursor-pointer text-red-600 focus:text-red-600"
              >
                <LogOut class="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <!-- Hamburger -->
          <button
            class="lg:hidden flex h-10 w-10 items-center justify-center rounded-full text-[#064423] transition hover:bg-[#064423]/5"
            :aria-label="menuOpen ? 'Close menu' : 'Open menu'"
            :aria-expanded="menuOpen"
            @click="menuOpen = !menuOpen"
          >
            <X v-if="menuOpen" class="h-5 w-5" />
            <Menu v-else class="h-5 w-5" />
          </button>
        </div>
      </div>

      <!-- Mobile menu -->
      <transition name="menu">
        <nav
          v-if="menuOpen"
          class="lg:hidden border-t border-[#064423]/10 bg-white px-4 pb-4 pt-3"
        >
          <div
            v-if="profile?.area"
            class="mb-3 inline-flex items-center gap-1.5 rounded-full bg-[#E4F5EA] px-3 py-1.5 text-xs font-semibold text-[#064423]"
          >
            <MapPin class="h-3.5 w-3.5" />
            {{ profile.area
            }}<template v-if="profile.state">, {{ profile.state }}</template>
          </div>

          <div class="flex flex-col gap-1">
            <NuxtLink
              v-for="l in links"
              :key="l.to"
              :to="l.to"
              :class="[
                'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors',
                isActive(l.to)
                  ? 'bg-[#E4F5EA] text-[#064423]'
                  : 'text-[#064423]/80 hover:bg-gray-50',
              ]"
            >
              <component :is="l.icon" class="h-4 w-4" />
              {{ l.label }}
            </NuxtLink>
          </div>

          <button
            class="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 px-3 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50"
            @click="logout"
          >
            <LogOut class="h-4 w-4" />
            Log out
          </button>
        </nav>
      </transition>
    </header>

    <AddWahala
      :isOpen="wahalaModal"
      :area="profile?.area"
      :state="profile?.state"
      :username="profile?.username"
      @cancel="wahalaModal = false"
      @refetch="gistsRefresh++"
    />

    <main class="flex-1">
      <slot />
    </main>

    <footer
      class="px-5 md:px-9 py-4 border-t bg-white text-center text-xs text-gray-500"
    >
      &copy; {{ new Date().getFullYear() }} Radar. Na your neighbours dey tell
      you live.
    </footer>
  </div>
</template>

<script setup>
import {
  MapPin,
  Menu,
  X,
  LogOut,
  Plus,
  Map as MapIcon,
  Trophy,
  User,
  Settings,
} from "@lucide/vue";
import { Button } from "@/components/ui/button";
import AddWahala from "~/components/home/AddWahala.vue";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const route = useRoute();
const db = useDb();
const { user } = useAuth();
const { profile, fetchProfile } = useProfile();
const sharedProfile = useState("profile");

const wahalaModal = useState("wahalaModal", () => false);
const gistsRefresh = useState("gistsRefresh", () => 0);

const links = [
  { label: "Areas", to: "/area", icon: MapIcon },
  { label: "Ranks", to: "/ranks", icon: Trophy },
  { label: "Me", to: "/me", icon: User },
  { label: "Settings", to: "/setting", icon: Settings },
];

const isActive = (to) => route.path === to || route.path.startsWith(`${to}/`);

const initial = computed(
  () => (profile.value?.username || "U").charAt(0) || "U"
);

// Mobile menu
const menuOpen = ref(false);
watch(
  () => route.fullPath,
  () => (menuOpen.value = false)
);

const onKey = (e) => {
  if (e.key === "Escape") menuOpen.value = false;
};
onMounted(() => window.addEventListener("keydown", onKey));
onBeforeUnmount(() => window.removeEventListener("keydown", onKey));

// Load the profile as soon as the user is available
watch(
  user,
  (u) => {
    if (u) fetchProfile().catch((e) => console.error("Profile error:", e));
  },
  { immediate: true }
);

const logout = async () => {
  menuOpen.value = false;
  try {
    await db.auth.signOut();
  } catch (e) {
    console.error("Logout error:", e);
  }
  sharedProfile.value = null;
  await navigateTo("/login");
};
</script>

<style scoped>
.menu-enter-active,
.menu-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
