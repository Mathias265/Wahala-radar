<template>
  <div class="min-h-screen px-6 md:px-8 py-8">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-[#064423] font-display text-4xl font-extrabold">
        Radar Heroes
      </h1>
      <p class="text-[#064423]/90 mt-2">
        Points dey come when you report and when people confirm your gist.
      </p>

      <!-- Tabs -->
      <div class="flex flex-wrap gap-3 mt-5">
        <button
          v-for="t in tabs"
          :key="t.key"
          @click="tab = t.key"
          :class="[
            'rounded-full px-5 py-2 text-sm font-bold border-2 transition-all',
            tab === t.key
              ? 'bg-[#0B6B3A] text-white border-[#0B6B3A]'
              : 'text-[#064423] border-[#064423]/20 hover:bg-[#E8F5EC]',
          ]"
        >
          {{ t.label }}
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="mt-8 animate-pulse flex flex-col gap-4">
        <div class="h-44 bg-gray-100 rounded-2xl"></div>
        <div class="h-40 bg-gray-100 rounded-2xl"></div>
      </div>

      <!-- Error / notice -->
      <div v-else-if="errorMessage" class="mt-10 text-center">
        <p class="text-gray-700 font-medium">{{ errorMessage }}</p>
        <button
          v-if="canRetry"
          @click="load"
          class="mt-4 rounded-xl bg-[#064423] text-white font-bold px-6 py-2"
        >
          Try again
        </button>
      </div>

      <!-- Empty -->
      <div
        v-else-if="!rows.length"
        class="mt-10 text-center py-12 rounded-xl border border-dashed border-gray-200"
      >
        <p class="text-gray-700 font-bold">No hero yet.</p>
        <p class="text-gray-400 text-sm mt-1">
          Report wetin dey happen to start the board.
        </p>
      </div>

      <template v-else>
        <!-- Podium -->
        <div class="grid grid-cols-3 gap-3 md:gap-6 items-end mt-8">
          <template v-for="slot in podium" :key="slot.place">
            <div
              :class="[
                'rounded-2xl flex flex-col items-center justify-center text-center px-2 py-5',
                slot.place === 1
                  ? 'bg-[#05411F] text-white h-52'
                  : slot.place === 2
                  ? 'bg-[#E4F5EA] text-[#064423] h-44'
                  : 'bg-[#E4F5EA] text-[#064423] h-40',
              ]"
            >
              <span class="text-3xl font-display font-extrabold">{{
                slot.place
              }}</span>

              <div
                :class="[
                  'mt-3 h-14 w-14 rounded-full flex items-center justify-center font-black',
                  slot.place === 1
                    ? 'bg-white text-[#064423]'
                    : slot.place === 2
                    ? 'bg-[#05411F] text-white'
                    : 'bg-[#0B6B3A] text-white',
                ]"
              >
                {{ initials(slot.p.name) }}
              </div>

              <p class="mt-2 text-sm font-extrabold truncate max-w-full">
                {{ displayName(slot.p) }}
              </p>
              <p
                :class="[
                  'text-xs',
                  slot.place === 1 ? 'text-white/80' : 'text-[#064423]/70',
                ]"
              >
                {{ slot.p.badge }}
              </p>
              <p
                :class="[
                  'text-[11px] mt-0.5',
                  slot.place === 1 ? 'text-white/60' : 'text-[#064423]/50',
                ]"
              >
                {{ slot.p.points }} pts
              </p>
            </div>
          </template>
        </div>

        <!-- Rest of the board -->
        <div
          v-if="listRows.length"
          class="mt-6 border border-[#064423]/15 rounded-2xl overflow-hidden bg-white"
        >
          <div
            v-for="(r, i) in listRows"
            :key="r.user_id"
            :class="[
              'flex items-center gap-4 px-5 py-4',
              i > 0 ? 'border-t border-gray-100' : '',
              isMe(r) ? 'bg-[#E4F5EA]' : '',
            ]"
          >
            <span class="w-5 text-sm font-extrabold text-[#064423]">{{
              r.place
            }}</span>

            <div
              :class="[
                'h-10 w-10 shrink-0 rounded-full text-white flex items-center justify-center text-xs font-black',
                i % 2 === 0 ? 'bg-[#0B6B3A]' : 'bg-[#05411F]',
              ]"
            >
              {{ initials(r.name) }}
            </div>

            <span class="flex-1 min-w-0 font-extrabold text-gray-900 truncate">
              {{ displayName(r) }}
            </span>

            <span class="text-xs text-gray-500 text-right">
              {{ r.badge
              }}<span class="text-gray-400"> &middot; {{ r.points }} pts</span>
            </span>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: "home" });

const db = useDb();
const { user, initUser } = useAuth();
const { profile, fetchProfile } = useProfile();

const tabs = [
  { key: "week", label: "This week" },
  { key: "all", label: "All time" },
  { key: "area", label: "My area" },
];
const tab = ref("week");

const rows = ref([]);
const loading = ref(true);
const errorMessage = ref("");
const canRetry = ref(true);

const load = async () => {
  loading.value = true;
  errorMessage.value = "";
  canRetry.value = true;

  try {
    await initUser();
    if (user.value) await fetchProfile().catch(() => {});

    let area = null;
    if (tab.value === "area") {
      area = profile.value?.area || null;
      if (!area) {
        rows.value = [];
        errorMessage.value =
          "Add your area to your profile to see heroes near you.";
        canRetry.value = false;
        return;
      }
    }

    const { data, error } = await db.rpc("radar_leaderboard", {
      p_period: tab.value === "week" ? "week" : "all",
      p_area: area,
    });
    if (error) throw error;

    rows.value = data || [];
  } catch (e) {
    console.error("Leaderboard error:", e);
    errorMessage.value = "Unable to load the leaderboard.";
  } finally {
    loading.value = false;
  }
};

onMounted(load);
watch(tab, load);

const podium = computed(() =>
  [
    { p: rows.value[1], place: 2 },
    { p: rows.value[0], place: 1 },
    { p: rows.value[2], place: 3 },
  ].filter((s) => s.p)
);

const isMe = (r) => !!user.value && r.user_id === user.value.id;

// Places 4-20, plus "You" at the bottom if you are not already shown
const listRows = computed(() => {
  const list = rows.value.slice(3, 20);
  if (user.value && !rows.value.slice(0, 20).some(isMe)) {
    const mine = rows.value.find(isMe);
    list.push(
      mine || {
        user_id: user.value.id,
        name: "You",
        points: 0,
        badge: "Newcomer",
        place: "-",
      }
    );
  }
  return list;
});

const displayName = (r) => (isMe(r) ? "You" : r.name);
const initials = (name) => (name || "N").slice(0, 2).toUpperCase();
</script>
