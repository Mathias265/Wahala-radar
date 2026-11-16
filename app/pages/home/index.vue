<template>
  <div class="min-h-screen">
    <!-- Hero Section -->
    <div class="bg-[#E8F5EC]">
      <div class="flex flex-col gap-4 p-6 md:p-10">
        <h1
          class="text-[#064423] font-display text-4xl md:text-5xl font-extrabold leading-tight"
        >
          Wetin dey happen for your <br />
          area?
        </h1>

        <p class="text-[#064423] tracking-tight text-lg opacity-90">
          Light, fuel, network, market price. Na your neighbours dey tell you
          live, before you waste time or money.
        </p>

        <!-- Location Search -->
        <div class="flex items-center gap-3 mt-2 w-full max-w-lg">
          <div
            class="border-2 border-[#0B6B3A] rounded-xl bg-white flex items-center flex-1 px-3 py-1.5 shadow-sm"
          >
            <MapPin class="text-[#0B6B3A] h-5 w-5 shrink-0" />

            <input
              v-model="locationSearch"
              @keyup.enter="applyLocationSearch"
              type="text"
              placeholder="Type your area or cities"
              class="w-full px-3 py-1 bg-transparent text-gray-800 placeholder-gray-400 focus:outline-none"
            />
          </div>

          <Button
            @click="applyLocationSearch"
            :disabled="searchingGist"
            class="py-[22px] px-6 bg-[#064423] text-white hover:bg-[#042d17] rounded-xl font-bold"
          >
            {{ searchingGist ? "Checking" : "Check radar " }}
          </Button>
        </div>
      </div>
    </div>

    <!-- Main Dashboard -->
    <div class="p-6 md:p-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Left Column -->
      <div class="lg:col-span-2 flex flex-col gap-6">
        <!-- Category Navigation -->
        <Card class="p-3 border-none shadow-none">
          <div class="flex gap-2 overflow-x-auto no-scrollbar py-1">
            <Button
              v-for="category in categories"
              :key="category"
              @click="activeCategory = category"
              :variant="activeCategory === category ? 'default' : 'outline'"
              :class="[
                'capitalize rounded-full font-semibold px-5 text-sm transition-all shrink-0',
                activeCategory === category
                  ? 'bg-[#064423] text-white hover:bg-[#042d17]'
                  : 'text-[#064423] border-[#064423]/30 hover:bg-[#E8F5EC]',
              ]"
            >
              {{ category }}
            </Button>
          </div>
        </Card>

        <!-- Loading State -->
        <div v-if="loading" class="flex flex-col gap-4">
          <Card
            v-for="n in 3"
            :key="n"
            class="p-5 shadow-sm bg-white animate-pulse"
          >
            <div class="h-4 w-32 bg-gray-200 rounded mb-3"></div>
            <div class="h-3 w-24 bg-gray-100 rounded mb-5"></div>
            <div class="h-4 w-full bg-gray-100 rounded mb-2"></div>
            <div class="h-4 w-3/4 bg-gray-100 rounded"></div>
          </Card>
        </div>

        <!-- Error State -->
        <div
          v-else-if="errorMessage"
          class="text-center py-10 bg-white rounded-xl border border-red-100"
        >
          <p class="text-red-600 font-medium">{{ errorMessage }}</p>
          <Button @click="fetchGists()" class="mt-4 bg-[#064423] text-white">
            Try again
          </Button>
        </div>

        <!-- Gist Feed -->
        <div v-else-if="filteredGists.length > 0" class="flex flex-col gap-4">
          <Card
            v-for="gist in filteredGists"
            :key="gist.id"
            class="bg-white shadow-none overflow-hidden border border-[#064423]/30"
          >
            <NuxtLink :to="`/gist/${gist.id}`">
              <CardHeader
                class="flex flex-row justify-between items-start pb-2"
              >
                <div class="flex flex-col">
                  <CardTitle class="text-base font-bold text-gray-900">
                    {{ gist.profiles?.username || "Neighbour" }}
                  </CardTitle>

                  <CardDescription
                    class="text-xs text-gray-500 flex items-center gap-1 mt-0.5"
                  >
                    <MapPin class="h-3 w-3" />
                    {{ gist.area }} &bull; {{ formatTimeAgo(gist.created_at) }}
                  </CardDescription>
                </div>

                <!-- Category Badge -->
                <span
                  :class="[
                    'text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full',
                    getBadgeStyle(gist.category),
                  ]"
                >
                  {{ gist.category }}
                </span>
              </CardHeader>
            </NuxtLink>
            <CardContent class="pb-4">
              <p
                class="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap"
              >
                {{ gist.description }}
              </p>
            </CardContent>

            <!-- Latest comments -->
            <div
              v-if="gist.comments?.length"
              class="px-6 pb-4 flex flex-col gap-3"
            >
              <div v-for="c in gist.comments" :key="c.id" class="flex gap-2">
                <div
                  class="h-7 w-7 shrink-0 rounded-full bg-[#064423] text-white flex items-center justify-center text-[10px] font-black"
                >
                  {{ (c.profiles?.username || "N").slice(0, 2).toUpperCase() }}
                </div>
                <div class="min-w-0">
                  <p class="text-xs">
                    <span class="font-bold text-gray-900">
                      {{ c.profiles?.username || "Neighbour" }}
                    </span>
                    <span class="text-gray-500">
                      &middot; {{ formatTimeAgo(c.created_at) }}
                    </span>
                  </p>
                  <p class="text-sm text-gray-700 line-clamp-2 break-words">
                    {{ c.comment }}
                  </p>
                </div>
              </div>

              <NuxtLink
                v-if="
                  gist.comment_count > gist.comments.length ||
                  gist.comments.some((c) => c.comment.length > 120)
                "
                :to="`/gist/${gist.id}`"
                class="text-xs font-bold text-[#064423] hover:underline w-max"
              >
                See more comments
              </NuxtLink>
            </div>

            <!-- Gist Actions -->
            <CardFooter
              class="border-t border-gray-50 bg-gray-50/50 px-4 md:px-6 py-3 flex justify-normal items-center gap-5 text-gray-600"
            >
              <button
                @click="handleUpvote(gist)"
                :disabled="votingIds.includes(gist.id)"
                :class="[
                  'flex items-center gap-1.5 text-xs font-bold transition-colors',
                  gist.hasVoted
                    ? 'text-[#064423] bg-[#E8F5EC] rounded-full px-2 py-1'
                    : 'hover:text-[#064423]',
                  votingIds.includes(gist.id)
                    ? 'opacity-50 cursor-not-allowed'
                    : '',
                ]"
              >
                <Check v-if="gist.hasVoted" class="h-5 w-5" />
                <span>Na true ({{ gist.vote_count || 0 }})</span>
              </button>

              <button
                @click="openCommentBox(gist)"
                class="flex items-center gap-1.5 text-xs font-medium bg-[#E8F5EC] rounded-full px-2 py-2 hover:text-blue-600 transition-colors"
              >
                Comment
              </button>

              <button
                @click="shareGist(gist)"
                class="flex items-center gap-1.5 text-xs font-medium hover:text-gray-900 transition-colors bg-[#E8F5EC] rounded-full px-2 py-2"
              >
                Share
              </button>
            </CardFooter>
          </Card>
        </div>

        <!-- Empty State -->
        <div
          v-else
          class="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200"
        >
          <div class="text-4xl mb-3">📡</div>

          <p class="text-gray-700 font-bold">No gist dey here for now.</p>

          <p class="text-gray-400 text-sm mt-1">
            {{
              activeCategory === "all"
                ? "Be the first person to share wetin dey happen!"
                : `No updates under ${activeCategory} for this area.`
            }}
          </p>
        </div>
      </div>

      <!-- Right Sidebar -->
      <div class="flex flex-col gap-6">
        <!-- Area Metrics -->
        <Card class="bg-[#064423] text-white shadow-sm">
          <CardHeader class="pb-3 border-gray-50">
            <CardTitle class="text-2xl font-display font-extrabold text-white">
              <h1>Your area right now</h1>
            </CardTitle>
          </CardHeader>

          <CardContent class="pt-4 flex flex-col gap-3">
            <div
              v-for="status in areaMetrics"
              :key="status.label"
              class="flex justify-between items-center text-sm font-semibold p-2 border-b"
            >
              <span class="text-white capitalize">
                {{ status.label }}
              </span>

              <span
                :class="[
                  'px-2.5 py-0.5 rounded text-xs font-bold',
                  status.color,
                ]"
              >
                {{ status.value }}
              </span>
            </div>
          </CardContent>
        </Card>

        <!-- Radar Heroes -->
        <Card class="shadow-none bg-white border border-[#064423]/30">
          <CardHeader class="pb-3 border-b border-gray-50">
            <CardTitle class="text-2xl font-display text-[#064423]">
              Radar heroes this week
            </CardTitle>
          </CardHeader>

          <CardContent class="flex flex-col gap-3">
            <div
              v-for="(hero, idx) in radarHeroes"
              :key="hero.name"
              class="flex items-center justify-between gap-3"
            >
              <div class="flex items-center gap-3">
                <div
                  class="h-8 w-8 rounded-full bg-[#E8F5EC] flex items-center justify-center text-base font-black text-[#064423]"
                >
                  {{ idx + 1 }}
                </div>

                <div class="flex flex-col">
                  <span class="text-sm font-bold text-gray-900">
                    {{ hero.name }}
                    <span class="text-xs text-gray-400"
                      >({{ hero.post_count }} posts)</span
                    >
                  </span>
                </div>
              </div>
              <span class="text-xs font-bold px-2 py-0.5 rounded w-max mt-0.5">
                {{ hero.badge }}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Comment Dialog -->
    <div
      v-if="showCommentBox"
      class="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      @click.self="closeCommentBox"
    >
      <Card class="w-full max-w-md bg-white shadow-xl">
        <CardHeader>
          <CardTitle class="text-lg text-[#064423]">
            Drop your comment
          </CardTitle>
          <CardDescription>
            Join the conversation with your neighbours.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <textarea
            v-model="commentText"
            rows="4"
            maxlength="500"
            placeholder="Wetin you wan talk?"
            class="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0B6B3A]"
          ></textarea>

          <p class="text-xs text-gray-400 text-right mt-1">
            {{ commentText.length }}/500
          </p>

          <p v-if="commentError" class="text-sm text-red-600 mt-2">
            {{ commentError }}
          </p>
        </CardContent>

        <CardFooter class="flex justify-end gap-3">
          <Button variant="outline" @click="closeCommentBox"> Cancel </Button>

          <Button
            @click="submitComment"
            :disabled="!commentText.trim() || submittingComment"
            class="bg-[#064423] text-white hover:bg-[#042d17]"
          >
            {{ submittingComment ? "Posting..." : "Post comment" }}
          </Button>
        </CardFooter>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { Check, MapPin } from "@lucide/vue";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

definePageMeta({
  layout: "home",
});

const { user, initUser } = useAuth();
const db = useDb();
const { profile: userProfile, fetchProfile } = useProfile();
const gistsRefresh = useState("gistsRefresh", () => 0);

const locationSearch = ref("");
const appliedLocation = ref("");
const activeCategory = ref("all");
const searchingGist = ref(false);

const gistsList = ref([]);
const loading = ref(true);
const errorMessage = ref("");
const votingIds = ref([]);

const showCommentBox = ref(false);
const commentText = ref("");
const commentError = ref("");
const selectedGist = ref(null);
const submittingComment = ref(false);

// Categories
const categories = ["all", "light", "fuel", "network", "traffic", "market"];

const areaMetrics = ref([]);
const radarHeroes = ref([]);
const toneClasses = {
  red: "bg-red-100 text-red-700",
  green: "bg-green-100 text-green-700",
  amber: "bg-amber-100 text-amber-700",
};

// Initialize user and load dashboard
onMounted(async () => {
  try {
    await initUser();

    if (!user.value) {
      errorMessage.value = "Please log in to view your Radar dashboard.";
      return;
    }

    await fetchProfile();
    if (userProfile.value?.area) {
      // locationSearch.value = userProfile.value.area;
      // appliedLocation.value = userProfile.value.area;
    }

    await Promise.all([fetchGists(), fetchAreaMetrics(), fetchRadarHeroes()]);
    subscribeRealtime();
  } catch (error) {
    console.error("Dashboard initialization error:", error);
    errorMessage.value = "Something went wrong. Please try again.";
  } finally {
    loading.value = false;
  }
});

// Look usernames up separately so comments don't depend on a table relationship
const attachUsernames = async (rows) => {
  const ids = [...new Set(rows.map((r) => r.user_id).filter(Boolean))];
  if (!ids.length) return rows;

  const { data } = await db
    .from("profiles")
    .select("id, username")
    .in("id", ids);
  const names = Object.fromEntries((data || []).map((p) => [p.id, p.username]));

  return rows.map((r) => ({ ...r, profiles: { username: names[r.user_id] } }));
};

// Fetch gists, their vote counts and their latest comments
const fetchGists = async (silent = false) => {
  if (!silent) loading.value = true;
  errorMessage.value = "";
  searchingGist.value = true;

  try {
    const { data: gists, error } = await db
      .from("gists")
      .select(`*, profiles!gists_user_id_profiles_fkey(username)`)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const gistIds = (gists || []).map((g) => g.id);
    let votes = [];

    if (gistIds.length > 0) {
      const { data: voteData, error: voteError } = await db
        .from("gists_votes")
        .select("gist_id, user_id")
        .in("gist_id", gistIds);

      if (voteError) throw voteError;
      votes = voteData || [];
    }

    const voteCounts = {};
    votes.forEach((vote) => {
      voteCounts[vote.gist_id] = (voteCounts[vote.gist_id] || 0) + 1;
    });

    // latest comments for each gist (the feed still loads if this fails)
    const commentsByGist = {};
    if (gistIds.length > 0) {
      const { data: commentRows, error: commentsErr } = await db
        .from("gist_comments")
        .select("id, gist_id, user_id, comment, created_at")
        .in("gist_id", gistIds)
        .order("created_at", { ascending: true });

      if (commentsErr) console.error("Comments error:", commentsErr);

      const withNames = await attachUsernames(commentRows || []);
      withNames.forEach((c) => (commentsByGist[c.gist_id] ||= []).push(c));
    }

    gistsList.value = (gists || []).map((gist) => {
      const all = commentsByGist[gist.id] || [];
      return {
        ...gist,
        vote_count: voteCounts[gist.id] || 0,
        hasVoted: votes.some(
          (vote) => vote.gist_id === gist.id && vote.user_id === user.value?.id
        ),
        comment_count: all.length,
        comments: all.slice(-2), // the 2 newest, oldest first
      };
    });
  } catch (error) {
    console.error("Fetch gists error:", error);
    if (!silent) {
      errorMessage.value = "Unable to load community updates.";
      throw error;
    }
  } finally {
    if (!silent) loading.value = false;
    searchingGist.value = false;
  }
};

const fetchAreaMetrics = async () => {
  const area = userProfile.value?.area;

  const load = async (a) => {
    const { data, error } = await db
      .from("area_metrics")
      .select("label, value, tone")
      .eq("area", a)
      .order("sort_order");
    if (error) throw error;
    return data || [];
  };

  let rows = area ? await load(area) : [];
  if (!rows.length) rows = await load("default");

  areaMetrics.value = rows.map((r) => ({
    label: r.label,
    value: r.value,
    color: toneClasses[r.tone] || "bg-gray-100 text-gray-700",
  }));
};

const fetchRadarHeroes = async () => {
  const { data, error } = await db
    .from("radar_heroes")
    .select("name, badge, post_count")
    .order("post_count", { ascending: false });
  if (error) throw error;
  radarHeroes.value = data || [];
};

// Category and location filtering
const filteredGists = computed(() => {
  let results = gistsList.value;

  if (activeCategory.value !== "all") {
    results = results.filter(
      (gist) => gist.category?.toLowerCase() === activeCategory.value
    );
  }

  if (appliedLocation.value.trim()) {
    const search = appliedLocation.value.trim().toLowerCase();

    results = results.filter((gist) => {
      const area = gist.area?.toLowerCase() || "";
      const state = gist.state?.toLowerCase() || "";

      return area.includes(search) || state.includes(search);
    });
  }

  return results;
});

// Apply location search
const applyLocationSearch = () => {
  appliedLocation.value = locationSearch.value.trim();
};

// Upvote a gist
const handleUpvote = async (gist) => {
  if (!user.value) {
    alert("You need to log in before voting.");
    return;
  }

  if (gist.hasVoted || votingIds.value.includes(gist.id)) {
    return;
  }

  votingIds.value.push(gist.id);

  try {
    const { error } = await db.from("gists_votes").insert({
      gist_id: gist.id,
      user_id: user.value.id,
    });

    if (error) {
      if (error.code === "23505") {
        gist.hasVoted = true;
        return;
      }

      throw error;
    }

    gist.vote_count++;
    gist.hasVoted = true;
  } catch (error) {
    console.error("Vote error:", error);
    alert("Unable to submit your vote. Please try again.");
  } finally {
    votingIds.value = votingIds.value.filter((id) => id !== gist.id);
  }
};

// Open comment box
const openCommentBox = (gist) => {
  if (!user.value) {
    alert("Please log in to comment.");
    return;
  }

  selectedGist.value = gist;
  commentText.value = "";
  commentError.value = "";
  showCommentBox.value = true;
};

// Close comment box
const closeCommentBox = () => {
  showCommentBox.value = false;
  selectedGist.value = null;
  commentText.value = "";
  commentError.value = "";
};

// Submit comment (no alert: the comment shows up under the post right away)
const submitComment = async () => {
  if (!user.value || !selectedGist.value || !commentText.value.trim()) {
    return;
  }

  submittingComment.value = true;
  commentError.value = "";

  try {
    const { data, error } = await db
      .from("gist_comments")
      .insert({
        gist_id: selectedGist.value.id,
        user_id: user.value.id,
        comment: commentText.value.trim(),
      })
      .select("id, gist_id, user_id, comment, created_at")
      .single();

    if (error) throw error;

    const gist = gistsList.value.find((g) => g.id === selectedGist.value.id);
    if (gist) {
      const mine = {
        ...data,
        profiles: { username: userProfile.value?.username },
      };
      gist.comment_count = (gist.comment_count || 0) + 1;
      gist.comments = [...(gist.comments || []), mine].slice(-2);
    }

    closeCommentBox();
  } catch (error) {
    console.error("Comment error:", error);
    commentError.value = `Unable to post comment: ${error.message}`;
  } finally {
    submittingComment.value = false;
  }
};

// Realtime
let realtimeChannel = null;
let refreshTimer = null;

// Debounce so a burst of events triggers one refetch
const debounce = (fn, ms = 400) => {
  return () => {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(fn, ms);
  };
};

const refreshGistsAndHeroes = debounce(async () => {
  await Promise.all([fetchGists(true), fetchRadarHeroes()]);
});

const refreshMetrics = debounce(() => fetchAreaMetrics());

const subscribeRealtime = () => {
  realtimeChannel = db
    .channel("radar-live")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "gists" },
      refreshGistsAndHeroes
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "gists_votes" },
      refreshGistsAndHeroes
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "gist_comments" },
      refreshGistsAndHeroes
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "area_metrics" },
      refreshMetrics
    )
    .subscribe();
};

onBeforeUnmount(() => {
  clearTimeout(refreshTimer);
  if (realtimeChannel) db.removeChannel(realtimeChannel);
});

// Refetch when a gist is posted from the layout's modal
watch(gistsRefresh, () => fetchGists(true));

// Share gist
const shareGist = async (gist) => {
  const shareUrl = `${window.location.origin}/gist/${gist.id}`;

  const shareData = {
    title: "Radar - Community Update",
    text: `${gist.description} - Shared from Radar`,
    url: shareUrl,
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(`${shareData.text}\n${shareUrl}`);

      alert("Gist link copied!");
    }
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error("Share error:", error);
    }
  }
};

// Format relative time
const formatTimeAgo = (date) => {
  if (!date) return "Just now";

  const timestamp = new Date(date).getTime();

  if (Number.isNaN(timestamp)) return "Recently";

  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes} min${minutes > 1 ? "s" : ""} ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }

  return new Date(date).toLocaleDateString();
};

// Category badge styling
const getBadgeStyle = (category) => {
  const styles = {
    light: "bg-yellow-100 text-yellow-800 border border-yellow-200",
    fuel: "bg-purple-100 text-purple-800 border border-purple-200",
    network: "bg-blue-100 text-blue-800 border border-blue-200",
    traffic: "bg-red-100 text-red-800 border border-red-200",
    market: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    other: "bg-gray-100 text-gray-800 border border-gray-200",
  };

  return styles[category?.toLowerCase()] || "bg-gray-100 text-gray-800";
};
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
