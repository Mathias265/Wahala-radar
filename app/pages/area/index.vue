<template>
  <div class="min-h-screen">
    <!-- Header -->
    <div class="bg-[#E4F5EA] px-6 md:px-8 py-8">
      <h1 class="text-[#064423] font-display text-4xl font-extrabold">Areas</h1>

      <div class="mt-5 grid grid-cols-1 md:grid-cols-[1fr_260px] gap-4">
        <input
          v-model="search"
          type="text"
          placeholder="Search any area"
          class="border-2 border-[#0B6B3A] rounded-xl bg-white px-4 py-3 text-sm focus:outline-none"
        />

        <select
          v-model="stateFilter"
          class="border-2 border-[#064423]/20 rounded-xl bg-white px-4 py-3 text-sm focus:outline-none focus:border-[#0B6B3A]"
        >
          <option value="all">All states</option>
          <option v-for="s in states" :key="s" :value="s">{{ s }}</option>
        </select>
      </div>
    </div>

    <div class="px-6 md:px-8 py-6">
      <p v-if="actionError" class="text-sm text-red-600 mb-4">
        {{ actionError }}
      </p>

      <!-- Loading -->
      <div
        v-if="loading"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <div
          v-for="n in 6"
          :key="n"
          class="animate-pulse h-32 bg-gray-100 rounded-2xl"
        ></div>
      </div>

      <!-- Error -->
      <div v-else-if="errorMessage" class="text-center py-10">
        <p class="text-red-600 font-medium">{{ errorMessage }}</p>
        <button
          @click="load"
          class="mt-4 rounded-xl bg-[#064423] text-white font-bold px-6 py-2"
        >
          Try again
        </button>
      </div>

      <!-- Cards -->
      <div
        v-else-if="filtered.length"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <TransitionGroup name="fade" class="container">
          <div
            v-for="a in filtered"
            :key="a.id"
            class="bg-white border border-[#064423]/15 rounded-2xl p-5 flex flex-col gap-3"
          >
            <div class="flex items-start justify-between gap-3">
              <h2 class="text-2xl font-display font-extrabold text-[#064423]">
                {{ a.name }}
              </h2>
              <span class="text-xs text-gray-600 mt-2 text-right">{{
                a.state
              }}</span>
            </div>

            <div class="flex flex-wrap gap-2 min-h-[26px]">
              <span
                v-for="m in metricsFor(a)"
                :key="m.label"
                :class="[
                  'text-xs font-bold px-2.5 py-1 rounded-md',
                  toneClass(m.tone),
                ]"
              >
                <span class="capitalize">{{ m.label }}</span
                >: {{ m.value }}
              </span>
              <span v-if="!metricsFor(a).length" class="text-xs text-gray-400">
                No status yet
              </span>
            </div>

            <div class="flex items-center justify-between gap-3 mt-1">
              <span class="text-sm text-gray-600">
                {{
                  a.last_report_at
                    ? `Last report ${timeAgo(a.last_report_at)}`
                    : "No report yet"
                }}
              </span>

              <button
                @click="toggleFollow(a)"
                :disabled="busyIds.includes(a.id)"
                :class="[
                  'rounded-full px-5 py-2 text-sm font-bold border-2 transition-all disabled:opacity-60',
                  isFollowing(a.id)
                    ? 'bg-[#0B6B3A] text-white border-[#0B6B3A]'
                    : 'text-[#064423] border-[#0B6B3A] hover:bg-[#E8F5EC]',
                ]"
              >
                {{ isFollowing(a.id) ? "Following" : "Follow" }}
              </button>
            </div>
          </div>
        </TransitionGroup>
      </div>

      <!-- Empty -->
      <div
        v-else
        class="text-center py-12 rounded-xl border border-dashed border-gray-200"
      >
        <p class="text-gray-700 font-bold">No area match your search.</p>
        <p class="text-gray-400 text-sm mt-1">Try another name or state.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: "home" });

const db = useDb();
const { user, initUser } = useAuth();

const areas = ref([]);
const metricsByArea = ref({});
const followedIds = ref([]);

const loading = ref(true);
const errorMessage = ref("");
const actionError = ref("");
const busyIds = ref([]);

const search = ref("");
const stateFilter = ref("all");

const load = async () => {
  loading.value = true;
  errorMessage.value = "";

  try {
    await initUser();

    const [areaRes, metricRes, followRes] = await Promise.all([
      db.from("area_cards").select("*").order("name"),
      db
        .from("area_metrics")
        .select("area, label, value, tone, sort_order")
        .order("sort_order"),
      user.value
        ? db.from("area_follows").select("area_id").eq("user_id", user.value.id)
        : Promise.resolve({ data: [] }),
    ]);

    if (areaRes.error) throw areaRes.error;
    areas.value = areaRes.data || [];

    const grouped = {};
    (metricRes.data || []).forEach((m) => {
      const key = m.area.toLowerCase();
      (grouped[key] ||= []).push(m);
    });
    metricsByArea.value = grouped;

    followedIds.value = (followRes.data || []).map((f) => f.area_id);
  } catch (e) {
    console.error("Load areas error:", e);
    errorMessage.value = "Unable to load areas.";
  } finally {
    loading.value = false;
  }
};

onMounted(load);

const states = computed(() =>
  [...new Set(areas.value.map((a) => a.state))].sort()
);

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  return areas.value.filter((a) => {
    if (stateFilter.value !== "all" && a.state !== stateFilter.value)
      return false;
    if (!q) return true;
    return (
      a.name.toLowerCase().includes(q) || a.state.toLowerCase().includes(q)
    );
  });
});

const metricsFor = (a) => metricsByArea.value[a.name.toLowerCase()] || [];
const isFollowing = (id) => followedIds.value.includes(id);

const toggleFollow = async (a) => {
  actionError.value = "";
  if (!user.value) {
    actionError.value = "Please log in to follow an area.";
    return;
  }
  if (busyIds.value.includes(a.id)) return;
  busyIds.value.push(a.id);

  try {
    if (isFollowing(a.id)) {
      const { error } = await db
        .from("area_follows")
        .delete()
        .eq("area_id", a.id)
        .eq("user_id", user.value.id);
      if (error) throw error;
      followedIds.value = followedIds.value.filter((id) => id !== a.id);
    } else {
      const { error } = await db
        .from("area_follows")
        .insert({ area_id: a.id, user_id: user.value.id });
      if (error && error.code !== "23505") throw error;
      followedIds.value.push(a.id);
    }
  } catch (e) {
    console.error("Follow error:", e);
    actionError.value = `Unable to update: ${e.message}`;
  } finally {
    busyIds.value = busyIds.value.filter((id) => id !== a.id);
  }
};

const toneClass = (tone) =>
  ({
    green: "bg-[#E4F5EA] text-[#064423]",
    red: "bg-red-100 text-red-700",
    amber: "bg-[#FFF1DC] text-[#7A3E00]",
  }[tone] || "bg-gray-100 text-gray-700");

const timeAgo = (date) => {
  const t = new Date(date).getTime();
  if (Number.isNaN(t)) return "recently";
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr${h > 1 ? "s" : ""} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d > 1 ? "s" : ""} ago`;
};
</script>
<style scoped>
.fade-move,
.fade-enter-active,
.fade-leave-active {
  transition: all 0.5s cubic-bezier(0.55, 0, 0.1, 1);
}

/* 2. declare enter from and leave to state */
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scaleY(0.01) translate(30px, 0);
}

/* 3. ensure leaving items are taken out of layout flow so that moving
      animations can be calculated correctly. */
.fade-leave-active {
  position: absolute;
}
</style>
