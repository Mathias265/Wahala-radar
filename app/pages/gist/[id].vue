<template>
  <div class="min-h-screen p-6 md:p-10">
    <NuxtLink to="/home" class="text-sm font-bold text-[#064423]">
      ← Back to radar
    </NuxtLink>

    <!-- Loading -->
    <div
      v-if="loading"
      class="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6"
    >
      <div class="animate-pulse h-72 bg-gray-100 rounded-2xl"></div>
      <div class="animate-pulse h-40 bg-gray-100 rounded-2xl"></div>
    </div>

    <p v-else-if="!gist" class="mt-6 text-gray-600 font-medium">
      This gist no dey again.
    </p>

    <div
      v-else
      class="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start"
    >
      <!-- LEFT -->
      <div class="min-w-0">
        <Card
          class="bg-white shadow-none border border-[#064423]/20 rounded-2xl"
        >
          <CardContent class="p-6 flex flex-col gap-5">
            <!-- Header -->
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-3 min-w-0">
                <div
                  class="h-11 w-11 shrink-0 rounded-full bg-[#0B6B3A] text-white flex items-center justify-center text-sm font-black"
                >
                  {{ initials(gist.profiles?.username) }}
                </div>
                <div class="flex flex-col min-w-0">
                  <span class="font-extrabold text-gray-900 truncate">
                    {{ gist.profiles?.username || "Neighbour" }}
                  </span>
                  <span class="text-xs text-gray-500">
                    {{ gist.area
                    }}<template v-if="gist.state">, {{ gist.state }}</template>
                    &middot; {{ timeAgo(gist.created_at) }}
                  </span>
                </div>
              </div>

              <span
                :class="[
                  'text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full',
                  badgeStyle(gist.category),
                ]"
              >
                {{ gist.category }}
              </span>
            </div>

            <!-- Body -->
            <p
              class="text-lg md:text-xl text-gray-900 leading-relaxed whitespace-pre-wrap"
            >
              {{ gist.description }}
            </p>

            <img
              v-if="gist.image_url"
              :src="gist.image_url"
              alt="Photo from reporter"
              class="w-full max-h-96 object-cover rounded-xl"
            />

            <!-- Actions -->
            <div class="flex flex-wrap items-center gap-3">
              <button
                @click="vote"
                :disabled="acting"
                :title="hasVoted ? 'Tap to undo' : 'Mark as true'"
                :class="[
                  'rounded-full px-5 py-2 text-sm font-bold border-2 transition-all flex items-center gap-2',
                  hasVoted
                    ? 'bg-[#0B6B3A] text-white border-[#0B6B3A]'
                    : 'text-[#064423] border-[#064423]/30 hover:bg-[#E8F5EC]',
                ]"
              >
                <Check v-if="hasVoted" class="h-4 w-4" />
                Na true, {{ voteCount }}
              </button>

              <button
                @click="dispute"
                :disabled="hasDisputed || acting"
                :class="[
                  'rounded-full px-5 py-2 text-sm font-bold border-2 transition-all',
                  hasDisputed
                    ? 'bg-red-50 text-red-700 border-red-300'
                    : 'text-red-800 border-red-200 hover:bg-red-50',
                ]"
              >
                E no be true<template v-if="disputeCount">
                  ({{ disputeCount }})</template
                >
              </button>

              <button
                @click="share"
                class="rounded-full px-5 py-2 text-sm font-bold border-2 text-[#064423] border-[#064423]/30 hover:bg-[#E8F5EC] transition-all"
              >
                Share
              </button>

              <button
                @click="reportAbuse"
                class="ml-auto text-xs text-gray-600 underline hover:text-gray-900"
              >
                Report abuse
              </button>
            </div>
          </CardContent>
        </Card>

        <!-- Comments -->
        <section class="mt-8">
          <h2 class="text-2xl font-display font-extrabold text-[#064423]">
            Comments ({{ comments.length }})
          </h2>

          <form class="flex gap-3 mt-4" @submit.prevent="postComment">
            <input
              v-model="commentText"
              type="text"
              maxlength="500"
              placeholder="Add your own gist..."
              class="flex-1 border-2 border-[#064423]/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0B6B3A] bg-white"
            />
            <Button
              type="submit"
              :disabled="!commentText.trim() || posting"
              class="rounded-xl bg-[#064423] text-white hover:bg-[#042d17] font-bold px-8 py-6"
            >
              {{ posting ? "..." : "Send" }}
            </Button>
          </form>

          <p v-if="actionError" class="text-sm text-red-600 mt-2">
            {{ actionError }}
          </p>

          <ul class="flex flex-col gap-5 mt-6">
            <li v-for="c in comments" :key="c.id" class="flex gap-3">
              <div
                class="h-9 w-9 shrink-0 rounded-full bg-[#064423] text-white flex items-center justify-center text-xs font-black"
              >
                {{ initials(c.profiles?.username) }}
              </div>
              <div class="min-w-0">
                <p class="text-sm">
                  <span class="font-bold text-gray-900">
                    {{ c.profiles?.username || "Neighbour" }}
                  </span>
                  <span class="text-xs text-gray-500">
                    &middot; {{ timeAgo(c.created_at) }}
                  </span>
                </p>
                <p
                  class="text-sm text-gray-800 whitespace-pre-wrap break-words"
                >
                  {{ c.comment }}
                </p>
              </div>
            </li>

            <li v-if="!comments.length" class="text-sm text-gray-500">
              No comment yet. Be the first to talk.
            </li>
          </ul>
        </section>
      </div>

      <!-- RIGHT -->
      <aside class="flex flex-col gap-5">
        <Card
          class="bg-[#064423] text-white border-none shadow-none rounded-2xl"
        >
          <CardContent class="p-5 flex flex-col gap-3">
            <h3 class="text-xl font-display font-extrabold">Status</h3>
            <span
              class="w-max rounded-full bg-[#FFF1DC] text-[#7A3E00] text-xs font-extrabold px-3 py-1"
            >
              {{ isFixed ? "Don fix" : "Still dey" }}
            </span>
            <p class="text-sm text-white/90">
              <template v-if="isFixed"
                >The reporter don mark am as fixed.</template
              >
              <template v-else
                >Reporter fit mark am as fixed when e don clear.</template
              >
            </p>

            <Button
              v-if="isOwner && !isFixed"
              @click="markFixed"
              :disabled="acting"
              class="bg-white text-[#064423] hover:bg-[#E8F5EC] font-bold rounded-xl"
            >
              Mark as fixed
            </Button>
          </CardContent>
        </Card>

        <Card
          class="bg-white shadow-none border border-[#064423]/20 rounded-2xl"
        >
          <CardContent class="p-5">
            <h3 class="text-lg font-display font-extrabold text-[#064423]">
              More from {{ gist.area }}
            </h3>

            <ul class="mt-3 flex flex-col">
              <li
                v-for="(r, i) in related"
                :key="r.id"
                :class="['py-3', i > 0 ? 'border-t border-gray-100' : '']"
              >
                <NuxtLink :to="`/gist/${r.id}`" class="block group">
                  <span
                    :class="[
                      'text-[10px] font-extrabold uppercase tracking-wider',
                      categoryText(r.category),
                    ]"
                  >
                    {{ r.category }}
                  </span>
                  <p
                    class="text-sm text-gray-800 mt-0.5 line-clamp-2 group-hover:underline"
                  >
                    {{ r.description }}
                  </p>
                </NuxtLink>
              </li>

              <li v-if="!related.length" class="text-sm text-gray-500 py-2">
                Nothing else for this area yet.
              </li>
            </ul>
          </CardContent>
        </Card>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { Check } from "@lucide/vue";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

definePageMeta({ layout: "home" });

const route = useRoute();
const db = useDb();
const { user, initUser } = useAuth();

const gist = ref(null);
const loading = ref(true);
const acting = ref(false);
const posting = ref(false);
const actionError = ref("");

const voteCount = ref(0);
const hasVoted = ref(false);
const disputeCount = ref(0);
const hasDisputed = ref(false);

const comments = ref([]);
const commentText = ref("");
const related = ref([]);

const isOwner = computed(
  () => !!user.value && gist.value?.user_id === user.value.id
);
const isFixed = computed(() => gist.value?.status === "fixed");

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

const loadGist = async () => {
  loading.value = true;
  actionError.value = "";

  try {
    await initUser();
    const id = route.params.id;

    const { data, error } = await db
      .from("gists")
      .select("*, profiles!gists_user_id_profiles_fkey(username)")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;

    gist.value = data;
    if (!data) return;

    const uid = user.value?.id;

    const [votes, disputes, commentRows, more] = await Promise.all([
      db.from("gists_votes").select("user_id").eq("gist_id", id),
      db.from("gists_disputes").select("user_id").eq("gist_id", id),
      db
        .from("gist_comments")
        .select("id, user_id, comment, created_at")
        .eq("gist_id", id)
        .order("created_at", { ascending: true }),
      db
        .from("gists")
        .select("id, category, description")
        .eq("area", data.area)
        .neq("id", id)
        .order("created_at", { ascending: false })
        .limit(3),
    ]);

    voteCount.value = votes.data?.length || 0;
    hasVoted.value = !!uid && (votes.data || []).some((v) => v.user_id === uid);

    // disputes table is optional until the SQL is run
    disputeCount.value = disputes.data?.length || 0;
    hasDisputed.value =
      !!uid && (disputes.data || []).some((v) => v.user_id === uid);

    if (commentRows.error) console.error("Comments error:", commentRows.error);
    comments.value = await attachUsernames(commentRows.data || []);
    related.value = more.data || [];
  } catch (e) {
    console.error("Load gist error:", e);
  } finally {
    loading.value = false;
  }
};

onMounted(loadGist);
watch(() => route.params.id, loadGist);

const requireLogin = () => {
  if (!user.value) {
    actionError.value = "Please log in first.";
    return false;
  }
  return true;
};

// Click once to vote, click again to undo
const vote = async () => {
  if (!requireLogin() || acting.value) return;
  acting.value = true;
  actionError.value = "";

  if (hasVoted.value) {
    const { data, error } = await db
      .from("gists_votes")
      .delete()
      .eq("gist_id", gist.value.id)
      .eq("user_id", user.value.id)
      .select();

    if (error) {
      console.error("Unvote error:", error);
      actionError.value = `Unable to remove vote: ${error.message}`;
    } else if (!data?.length) {
      // RLS silently blocks deletes without a policy: 0 rows removed, no error
      actionError.value =
        "Vote was not removed. The delete policy on gists_votes is missing.";
    } else {
      voteCount.value = Math.max(0, voteCount.value - 1);
      hasVoted.value = false;
    }
  } else {
    const { error } = await db
      .from("gists_votes")
      .insert({ gist_id: gist.value.id, user_id: user.value.id });

    if (!error || error.code === "23505") {
      if (!error) voteCount.value++;
      hasVoted.value = true;
    } else {
      console.error("Vote error:", error);
      actionError.value = `Unable to vote: ${error.message}`;
    }
  }

  acting.value = false;
};

const dispute = async () => {
  if (!requireLogin() || hasDisputed.value) return;
  acting.value = true;
  const { error } = await db
    .from("gists_disputes")
    .insert({ gist_id: gist.value.id, user_id: user.value.id });
  if (!error || error.code === "23505") {
    if (!error) disputeCount.value++;
    hasDisputed.value = true;
  } else {
    console.error(error);
    actionError.value = "Unable to submit. Try again.";
  }
  acting.value = false;
};

const markFixed = async () => {
  acting.value = true;
  const { error } = await db
    .from("gists")
    .update({ status: "fixed" })
    .eq("id", gist.value.id);
  if (error) {
    console.error(error);
    actionError.value = "Unable to update status.";
  } else {
    gist.value.status = "fixed";
  }
  acting.value = false;
};

const reportAbuse = async () => {
  if (!requireLogin()) return;
  if (!confirm("Report this gist as abuse?")) return;
  const { error } = await db
    .from("gist_reports")
    .insert({ gist_id: gist.value.id, user_id: user.value.id });
  if (error && error.code !== "23505") {
    console.error(error);
    actionError.value = "Unable to send report.";
    return;
  }
  alert("Thank you. We go check am.");
};

const postComment = async () => {
  if (!requireLogin() || !commentText.value.trim()) return;
  posting.value = true;
  actionError.value = "";

  const { data, error } = await db
    .from("gist_comments")
    .insert({
      gist_id: gist.value.id,
      user_id: user.value.id,
      comment: commentText.value.trim(),
    })
    .select("id, user_id, comment, created_at")
    .single();

  if (error) {
    console.error("Comment error:", error);
    actionError.value = `Unable to post comment: ${error.message}`;
  } else {
    const [withName] = await attachUsernames([data]);
    comments.value.push(withName);
    commentText.value = "";
  }
  posting.value = false;
};

const share = async () => {
  const url = `${window.location.origin}/gist/${gist.value.id}`;
  const data = {
    title: "Radar - Community Update",
    text: `${gist.value.description} - Shared from Radar`,
    url,
  };
  try {
    if (navigator.share) {
      await navigator.share(data);
    } else {
      await navigator.clipboard.writeText(`${data.text}\n${url}`);
      alert("Gist link copied!");
    }
  } catch (e) {
    if (e.name !== "AbortError") console.error("Share error:", e);
  }
};

const initials = (name) => (name || "N").slice(0, 2).toUpperCase();

const timeAgo = (date) => {
  if (!date) return "Just now";
  const t = new Date(date).getTime();
  if (Number.isNaN(t)) return "Recently";
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return "Just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h > 1 ? "s" : ""} ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} day${d > 1 ? "s" : ""} ago`;
  return new Date(date).toLocaleDateString();
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

const categoryText = (c) =>
  ({
    light: "text-yellow-700",
    fuel: "text-purple-700",
    network: "text-blue-800",
    traffic: "text-red-800",
    market: "text-emerald-700",
    other: "text-gray-600",
  }[c?.toLowerCase()] || "text-gray-600");
</script>
