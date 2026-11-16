<template>
  <div class="min-h-screen px-6 md:px-8 py-8">
    <div class="max-w-4xl mx-auto">
      <p v-if="loading" class="animate-pulse h-28 bg-gray-100 rounded-2xl"></p>

      <p
        v-else-if="errorMessage"
        class="text-center text-gray-700 font-medium py-12"
      >
        {{ errorMessage }}
      </p>

      <template v-else>
        <!-- Header -->
        <div
          class="bg-[#05411F] rounded-2xl px-6 py-6 flex flex-wrap items-center justify-between gap-4"
        >
          <div class="flex items-center gap-5 min-w-0">
            <div
              class="h-16 w-16 shrink-0 rounded-full bg-white text-[#064423] flex items-center justify-center text-xl font-black"
            >
              {{ initials }}
            </div>
            <div class="min-w-0">
              <h1
                class="text-white font-display text-3xl font-extrabold truncate"
              >
                {{ profile?.username || "Your username" }}
              </h1>
              <p class="text-white/80 text-sm mt-1">
                <template v-if="profile?.area">
                  {{ profile.area
                  }}<template v-if="profile.state"
                    >, {{ profile.state }}</template
                  >
                  &middot;
                </template>
                Joined {{ joined }}
              </p>
            </div>
          </div>

          <button
            @click="openEdit"
            class="rounded-full bg-white text-[#064423] font-bold px-6 py-2 text-sm hover:bg-[#E8F5EC] transition-colors"
          >
            Edit profile
          </button>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-3 gap-3 md:gap-4 mt-6">
          <div
            v-for="s in stats"
            :key="s.label"
            class="bg-white border border-[#064423]/15 rounded-2xl py-5 text-center"
          >
            <p class="text-3xl font-display font-extrabold text-[#064423]">
              {{ s.value }}
            </p>
            <p class="text-xs text-gray-600 mt-1">{{ s.label }}</p>
          </div>
        </div>

        <!-- Badges -->
        <h2 class="text-2xl font-display font-extrabold text-[#064423] mt-8">
          Badges
        </h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
          <div
            v-for="b in badges"
            :key="b.name"
            :class="[
              'rounded-xl p-4 flex flex-col gap-1',
              b.earned
                ? 'bg-[#E4F5EA]'
                : 'border-2 border-dashed border-[#064423]/20',
            ]"
          >
            <p class="font-extrabold text-[#064423]">{{ b.name }}</p>
            <p class="text-xs text-gray-600">{{ b.desc }}</p>
            <p class="text-xs font-extrabold text-[#064423] mt-1">
              {{ b.earned ? "Earned" : "Locked" }}
            </p>
          </div>
        </div>

        <!-- Tabs -->
        <div class="flex gap-3 mt-8">
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

        <!-- List -->
        <div v-if="activeList.length" class="flex flex-col gap-3 mt-4">
          <NuxtLink
            v-for="g in activeList"
            :key="g.id"
            :to="`/gist/${g.id}`"
            class="block bg-white border border-[#064423]/15 rounded-2xl p-5 hover:border-[#0B6B3A] transition-colors"
          >
            <div class="flex items-center justify-between gap-3">
              <span class="text-xs text-gray-500">
                <template v-if="tab === 'confirmed'">
                  {{ g.profiles?.username || "Neighbour" }} &middot;
                </template>
                {{ g.area }} &middot; {{ timeAgo(g.created_at) }}
              </span>
              <span
                :class="[
                  'text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full',
                  badgeStyle(g.category),
                ]"
              >
                {{ g.category }}
              </span>
            </div>
            <p class="text-sm text-gray-800 mt-2 line-clamp-2">
              {{ g.description }}
            </p>
            <p
              v-if="tab === 'reports'"
              class="text-xs font-bold text-[#064423] mt-3"
            >
              Na true ({{ confirmCounts[g.id] || 0 }})
            </p>
          </NuxtLink>
        </div>

        <!-- Empty -->
        <div
          v-else
          class="mt-4 rounded-2xl border-2 border-dashed border-[#064423]/20 text-center py-10 px-4"
        >
          <template v-if="tab === 'reports'">
            <p class="font-extrabold text-[#064423]">
              You never report anything yet
            </p>
            <p class="text-sm text-gray-600 mt-2">
              Your first report go show here.
            </p>
            <button
              @click="wahalaModal = true"
              class="mt-4 rounded-xl bg-[#05411F] text-white font-bold px-6 py-2.5 hover:bg-[#042d17]"
            >
              Report wahala
            </button>
          </template>
          <template v-else>
            <p class="font-extrabold text-[#064423]">
              You never confirm any gist yet
            </p>
            <p class="text-sm text-gray-600 mt-2">
              Gists wey you mark "Na true" go show here.
            </p>
            <NuxtLink
              to="/home"
              class="inline-block mt-4 rounded-xl bg-[#05411F] text-white font-bold px-6 py-2.5"
            >
              Check radar
            </NuxtLink>
          </template>
        </div>
      </template>
    </div>

    <!-- Edit profile -->
    <div
      v-if="editing"
      class="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      @click.self="editing = false"
    >
      <form
        @submit.prevent="saveProfile"
        class="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 flex flex-col gap-4"
      >
        <h3 class="text-xl font-display font-extrabold text-[#064423]">
          Edit profile
        </h3>

        <label class="flex flex-col gap-1.5 text-sm font-bold text-[#064423]">
          Username
          <input
            v-model="form.username"
            maxlength="30"
            class="border-2 border-[#064423]/20 rounded-xl px-4 py-2.5 text-sm font-normal text-gray-900 focus:outline-none focus:border-[#0B6B3A]"
          />
        </label>

        <label class="flex flex-col gap-1.5 text-sm font-bold text-[#064423]">
          Area
          <input
            v-model="form.area"
            class="border-2 border-[#064423]/20 rounded-xl px-4 py-2.5 text-sm font-normal text-gray-900 focus:outline-none focus:border-[#0B6B3A]"
          />
        </label>

        <label class="flex flex-col gap-1.5 text-sm font-bold text-[#064423]">
          State
          <input
            v-model="form.state"
            class="border-2 border-[#064423]/20 rounded-xl px-4 py-2.5 text-sm font-normal text-gray-900 focus:outline-none focus:border-[#0B6B3A]"
          />
        </label>

        <p v-if="editError" class="text-sm text-red-600">{{ editError }}</p>

        <div class="flex justify-end gap-3">
          <button
            type="button"
            @click="editing = false"
            class="rounded-xl border-2 border-[#064423]/20 text-[#064423] font-bold px-6 py-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="!form.username.trim() || saving"
            class="rounded-xl bg-[#064423] text-white font-bold px-6 py-2 disabled:opacity-60"
          >
            {{ saving ? "Saving..." : "Save" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: "home" });

const db = useDb();
const { user, initUser } = useAuth();
const { fetchProfile: refreshSharedProfile } = useProfile();

// Shared with the layout so the "Report wahala" modal opens from here
const wahalaModal = useState("wahalaModal", () => false);
const gistsRefresh = useState("gistsRefresh", () => 0);

const profile = ref(null);
const myGists = ref([]);
const confirmedGists = ref([]);
const confirmCounts = ref({});
const topThree = ref(false);

const loading = ref(true);
const errorMessage = ref("");

const tabs = [
  { key: "reports", label: "My reports" },
  { key: "confirmed", label: "Confirmed" },
];
const tab = ref("reports");

const load = async (silent = false) => {
  if (!silent) loading.value = true;
  errorMessage.value = "";

  try {
    await initUser();
    if (!user.value) {
      errorMessage.value = "Please log in to see your profile.";
      return;
    }
    const uid = user.value.id;

    const [prof, mine, myVotes, week] = await Promise.all([
      db.from("profiles").select("*").eq("id", uid).maybeSingle(),
      db
        .from("gists")
        .select("id, category, description, area, state, created_at")
        .eq("user_id", uid)
        .order("created_at", { ascending: false }),
      db.from("gists_votes").select("gist_id").eq("user_id", uid),
      db.rpc("radar_leaderboard", { p_period: "week", p_area: null }),
    ]);

    if (prof.error) throw prof.error;
    if (mine.error) throw mine.error;

    profile.value = prof.data;
    myGists.value = mine.data || [];

    // confirmations on my gists from other people
    const myIds = myGists.value.map((g) => g.id);
    const counts = {};
    if (myIds.length) {
      const { data: votes } = await db
        .from("gists_votes")
        .select("gist_id, user_id")
        .in("gist_id", myIds);
      (votes || [])
        .filter((v) => v.user_id !== uid)
        .forEach((v) => (counts[v.gist_id] = (counts[v.gist_id] || 0) + 1));
    }
    confirmCounts.value = counts;

    // gists I confirmed (not my own)
    const votedIds = (myVotes.data || [])
      .map((v) => v.gist_id)
      .filter((id) => !myIds.includes(id));
    if (votedIds.length) {
      const { data } = await db
        .from("gists")
        .select(
          "id, category, description, area, created_at, profiles!gists_user_id_profiles_fkey(username)"
        )
        .in("id", votedIds)
        .order("created_at", { ascending: false });
      confirmedGists.value = data || [];
    } else {
      confirmedGists.value = [];
    }

    // "Top 3 for a week" badge (ignored if the leaderboard function is missing)
    topThree.value = (week.data || []).some(
      (r) => r.user_id === uid && r.place <= 3
    );
  } catch (e) {
    console.error("Profile page error:", e);
    errorMessage.value = "Unable to load your profile.";
  } finally {
    loading.value = false;
  }
};

onMounted(() => load());
// reload after a gist is posted from the layout's modal
watch(gistsRefresh, () => load(true));

const reports = computed(() => myGists.value.length);
const confirmations = computed(() =>
  Object.values(confirmCounts.value).reduce((a, b) => a + b, 0)
);
// same formula as the leaderboard: 10 per report + 2 per confirmation
const points = computed(() => reports.value * 10 + confirmations.value * 2);

const stats = computed(() => [
  { label: "Reports", value: reports.value },
  { label: "Confirmed by others", value: confirmations.value },
  { label: "Points", value: points.value },
]);

const badges = computed(() => [
  { name: "Newcomer", desc: "Joined the radar", earned: true },
  {
    name: "Eye Don Open",
    desc: "Post 10 reports",
    earned: reports.value >= 10,
  },
  {
    name: "Street Reporter",
    desc: "Get 50 confirmations",
    earned: confirmations.value >= 50,
  },
  { name: "Gist Master", desc: "Top 3 for a week", earned: topThree.value },
]);

const activeList = computed(() =>
  tab.value === "reports" ? myGists.value : confirmedGists.value
);

const initials = computed(() =>
  (profile.value?.username || "ME").slice(0, 2).toUpperCase()
);

const joined = computed(() => {
  const d = profile.value?.created_at || user.value?.created_at;
  if (!d) return "recently";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
});

// ----- edit profile -----
const editing = ref(false);
const saving = ref(false);
const editError = ref("");
const form = reactive({ username: "", area: "", state: "" });

const openEdit = () => {
  form.username = profile.value?.username || "";
  form.area = profile.value?.area || "";
  form.state = profile.value?.state || "";
  editError.value = "";
  editing.value = true;
};

const saveProfile = async () => {
  saving.value = true;
  editError.value = "";

  const { data, error } = await db
    .from("profiles")
    .update({
      username: form.username.trim(),
      area: form.area.trim() || null,
      state: form.state.trim() || null,
    })
    .eq("id", user.value.id)
    .select();

  saving.value = false;

  if (error) {
    console.error("Save profile error:", error);
    editError.value =
      error.code === "23505"
        ? "That username don dey taken."
        : `Unable to save: ${error.message}`;
    return;
  }
  if (!data?.length) {
    editError.value = "Not saved. The update policy on profiles is missing.";
    return;
  }

  profile.value = { ...profile.value, ...data[0] };
  await refreshSharedProfile(true).catch(() => {}); // refresh the top bar
  editing.value = false;
};

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

const badgeStyle = (c) =>
  ({
    light: "bg-[#FFF1DC] text-[#7A3E00]",
    fuel: "bg-purple-100 text-purple-800",
    network: "bg-blue-100 text-blue-800",
    traffic: "bg-red-100 text-red-800",
    market: "bg-emerald-100 text-emerald-800",
    other: "bg-gray-100 text-gray-800",
  }[c?.toLowerCase()] || "bg-gray-100 text-gray-800");
</script>
