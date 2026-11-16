<template>
  <div class="min-h-screen px-6 md:px-8 py-8">
    <div class="max-w-5xl mx-auto">
      <p v-if="loading" class="animate-pulse h-40 bg-gray-100 rounded-2xl"></p>
      <p
        v-else-if="errorMessage"
        class="text-center text-gray-700 font-medium py-12"
      >
        {{ errorMessage }}
      </p>

      <div
        v-else
        class="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-6 items-start"
      >
        <!-- Side nav -->
        <aside class="md:sticky md:top-6">
          <h1 class="text-[#064423] font-display text-3xl font-extrabold">
            Settings
          </h1>
          <nav class="flex md:flex-col gap-1 mt-4 overflow-x-auto">
            <button
              v-for="s in sections"
              :key="s.id"
              @click="go(s.id)"
              :class="[
                'text-left text-xs font-bold rounded-lg px-3 py-2.5 whitespace-nowrap transition-colors',
                active === s.id
                  ? 'bg-[#E4F5EA] text-[#064423]'
                  : 'text-gray-600 hover:bg-gray-50',
              ]"
            >
              {{ s.label }}
            </button>
          </nav>
        </aside>

        <div class="flex flex-col gap-5 min-w-0">
          <!-- Account -->
          <section id="account" class="card scroll-mt-6">
            <h2 class="card-title">Account</h2>

            <form
              @submit.prevent="saveAccount"
              class="flex flex-col gap-4 mt-4"
            >
              <label class="field">
                Username
                <input
                  v-model="account.username"
                  maxlength="30"
                  class="input"
                />
              </label>
              <label class="field">
                Email
                <input v-model="account.email" type="email" class="input" />
              </label>

              <p
                v-if="accountMsg.text"
                :class="[
                  'text-sm',
                  accountMsg.ok ? 'text-[#0B6B3A]' : 'text-red-600',
                ]"
              >
                {{ accountMsg.text }}
              </p>

              <button
                type="submit"
                :disabled="savingAccount || !account.username.trim()"
                class="w-max rounded-xl bg-[#05411F] text-white font-bold text-sm px-5 py-2.5 hover:bg-[#042d17] disabled:opacity-60"
              >
                {{ savingAccount ? "Saving..." : "Save changes" }}
              </button>
            </form>
          </section>

          <!-- My area -->
          <section id="area" class="card scroll-mt-6">
            <h2 class="card-title">My area</h2>

            <div
              v-if="!editingArea"
              class="flex items-center justify-between mt-4"
            >
              <span class="text-sm font-bold text-gray-900">
                {{
                  profile?.area
                    ? `${profile.area}${
                        profile.state ? ", " + profile.state : ""
                      }`
                    : "No area set"
                }}
              </span>
              <button
                @click="startEditArea"
                class="text-xs font-bold text-[#064423] underline"
              >
                Change area
              </button>
            </div>

            <form
              v-else
              @submit.prevent="saveArea"
              class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4"
            >
              <label class="field">
                Area
                <input
                  v-model="areaForm.area"
                  class="input"
                  placeholder="e.g. Ikeja"
                />
              </label>
              <label class="field">
                State
                <input
                  v-model="areaForm.state"
                  class="input"
                  placeholder="e.g. Lagos"
                />
              </label>
              <div class="sm:col-span-2 flex items-center gap-3">
                <button
                  type="submit"
                  :disabled="savingArea || !areaForm.area.trim()"
                  class="rounded-xl bg-[#05411F] text-white font-bold text-sm px-5 py-2 disabled:opacity-60"
                >
                  {{ savingArea ? "Saving..." : "Save" }}
                </button>
                <button
                  type="button"
                  @click="editingArea = false"
                  class="text-sm font-bold text-gray-600"
                >
                  Cancel
                </button>
                <span v-if="areaError" class="text-sm text-red-600">{{
                  areaError
                }}</span>
              </div>
            </form>

            <div class="flex flex-wrap gap-2 mt-4">
              <span
                v-for="f in follows"
                :key="f.id"
                class="inline-flex items-center gap-1.5 rounded-full bg-[#E4F5EA] text-[#064423] text-xs font-bold pl-3 pr-2 py-1.5"
              >
                Following {{ f.name }}
                <button
                  @click="unfollow(f)"
                  :title="`Unfollow ${f.name}`"
                  class="h-4 w-4 rounded-full hover:bg-[#064423]/10 leading-none"
                >
                  &times;
                </button>
              </span>
              <span v-if="!follows.length" class="text-xs text-gray-500">
                You never follow any area yet.
                <NuxtLink to="/area" class="underline font-bold text-[#064423]"
                  >Find areas</NuxtLink
                >
              </span>
            </div>
          </section>

          <!-- Alerts -->
          <section id="alerts" class="card scroll-mt-6">
            <div class="flex items-center justify-between">
              <h2 class="card-title">Alerts</h2>
              <span class="text-xs font-bold text-[#0B6B3A]">{{
                prefsStatus
              }}</span>
            </div>
            <p class="text-xs text-gray-600 mt-2">
              Choose wetin you wan hear about for your areas.
            </p>

            <div class="flex flex-col gap-5 mt-5">
              <label
                v-for="c in alertCategories"
                :key="c"
                class="flex items-center gap-3 text-sm text-gray-800 cursor-pointer"
              >
                <input
                  type="checkbox"
                  :value="c"
                  v-model="prefs.categories"
                  class="h-5 w-5 rounded accent-[#0B6B3A]"
                />
                <span class="capitalize">{{ c }}</span>
              </label>
            </div>

            <label class="field mt-6">
              Only alert me when e be
              <select v-model="prefs.minSeverity" class="input">
                <option value="small">Small or worse</option>
                <option value="e dey pain">E dey pain or worse</option>
                <option value="wahala">Wahala only</option>
              </select>
            </label>
          </section>

          <!-- Danger zone -->
          <section
            id="danger"
            class="rounded-2xl border border-red-200 bg-white p-5 scroll-mt-6"
          >
            <h2 class="text-base font-extrabold text-[#9B0F17]">Danger zone</h2>
            <p class="text-xs text-gray-600 mt-2">
              Delete your account and all your reports. You no fit undo am.
            </p>

            <div class="flex gap-3 mt-4">
              <button
                @click="logout"
                class="rounded-xl border-2 border-[#064423]/20 text-[#064423] font-bold text-sm px-5 py-2 hover:bg-gray-50"
              >
                Log out
              </button>
              <button
                @click="openDelete"
                class="rounded-xl bg-[#9B0F17] text-white font-bold text-sm px-5 py-2 hover:bg-[#7d0c12]"
              >
                Delete account
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>

    <!-- Delete confirmation -->
    <div
      v-if="deleting"
      class="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      @click.self="deleting = false"
    >
      <form
        @submit.prevent="deleteAccount"
        class="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 flex flex-col gap-4"
      >
        <h3 class="text-xl font-display font-extrabold text-[#9B0F17]">
          Delete account?
        </h3>
        <p class="text-sm text-gray-700">
          All your reports, comments and votes go vanish for good. Type
          <b>DELETE</b> to confirm.
        </p>
        <input v-model="deleteText" class="input" placeholder="DELETE" />
        <p v-if="deleteError" class="text-sm text-red-600">{{ deleteError }}</p>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            @click="deleting = false"
            class="rounded-xl border-2 border-[#064423]/20 text-[#064423] font-bold text-sm px-5 py-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="deleteText !== 'DELETE' || deletingNow"
            class="rounded-xl bg-[#9B0F17] text-white font-bold text-sm px-5 py-2 disabled:opacity-50"
          >
            {{ deletingNow ? "Deleting..." : "Delete forever" }}
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
const sharedProfile = useState("profile");

const loading = ref(true);
const errorMessage = ref("");

const profile = ref(null);
const follows = ref([]);

// ---------- nav ----------
const sections = [
  { id: "account", label: "Account" },
  { id: "area", label: "My area" },
  { id: "alerts", label: "Alerts" },
  { id: "danger", label: "Danger zone" },
];
const active = ref("account");
const go = (id) => {
  active.value = id;
  document
    .getElementById(id)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
};

// ---------- load ----------
const alertCategories = ["light", "fuel", "network", "traffic", "market"];
const prefs = reactive({
  categories: ["light", "fuel", "traffic"],
  minSeverity: "e dey pain",
});
const prefsReady = ref(false);

onMounted(async () => {
  try {
    await initUser();
    if (!user.value) {
      errorMessage.value = "Please log in to open settings.";
      return;
    }
    const uid = user.value.id;

    const [prof, followRes, prefRes] = await Promise.all([
      db.from("profiles").select("*").eq("id", uid).maybeSingle(),
      db.from("area_follows").select("area_id").eq("user_id", uid),
      db.from("alert_preferences").select("*").eq("user_id", uid).maybeSingle(),
    ]);

    if (prof.error) throw prof.error;
    profile.value = prof.data;
    account.username = prof.data?.username || "";
    account.email = user.value.email || prof.data?.email || "";

    const ids = (followRes.data || []).map((f) => f.area_id);
    if (ids.length) {
      const { data } = await db
        .from("areas")
        .select("id, name")
        .in("id", ids)
        .order("name");
      follows.value = data || [];
    }

    if (prefRes.data) {
      prefs.categories = prefRes.data.categories || [];
      prefs.minSeverity = prefRes.data.min_severity || "e dey pain";
    }
  } catch (e) {
    console.error("Settings load error:", e);
    errorMessage.value = "Unable to load settings.";
  } finally {
    loading.value = false;
    await nextTick();
    prefsReady.value = true;
  }
});

//  account
const account = reactive({ username: "", email: "" });
const savingAccount = ref(false);
const accountMsg = reactive({ ok: true, text: "" });

const saveAccount = async () => {
  savingAccount.value = true;
  accountMsg.text = "";
  const notes = [];

  try {
    const { data, error } = await db
      .from("profiles")
      .update({ username: account.username.trim() })
      .eq("id", user.value.id)
      .select();
    if (error) throw error;
    if (!data?.length)
      throw new Error("The update policy on profiles is missing.");
    profile.value = { ...profile.value, ...data[0] };
    notes.push("Username saved.");

    const newEmail = account.email.trim();
    if (newEmail && newEmail !== user.value.email) {
      const { error: mailError } = await db.auth.updateUser({
        email: newEmail,
      });
      if (mailError) throw mailError;
      notes.push("Check your new email inbox to confirm the change.");
    }

    await refreshSharedProfile(true).catch(() => {});
    accountMsg.ok = true;
    accountMsg.text = notes.join(" ");
  } catch (e) {
    console.error("Save account error:", e);
    accountMsg.ok = false;
    accountMsg.text =
      e.code === "23505"
        ? "That username don dey taken."
        : `Unable to save: ${e.message}`;
  } finally {
    savingAccount.value = false;
  }
};

//area
const editingArea = ref(false);
const savingArea = ref(false);
const areaError = ref("");
const areaForm = reactive({ area: "", state: "" });

const startEditArea = () => {
  areaForm.area = profile.value?.area || "";
  areaForm.state = profile.value?.state || "";
  areaError.value = "";
  editingArea.value = true;
};

const saveArea = async () => {
  savingArea.value = true;
  areaError.value = "";
  const { data, error } = await db
    .from("profiles")
    .update({
      area: areaForm.area.trim(),
      state: areaForm.state.trim() || null,
    })
    .eq("id", user.value.id)
    .select();
  savingArea.value = false;

  if (error || !data?.length) {
    console.error("Save area error:", error);
    areaError.value = error
      ? error.message
      : "Not saved. The update policy on profiles is missing.";
    return;
  }
  profile.value = { ...profile.value, ...data[0] };
  await refreshSharedProfile(true).catch(() => {});
  editingArea.value = false;
};

const unfollow = async (f) => {
  const { error } = await db
    .from("area_follows")
    .delete()
    .eq("area_id", f.id)
    .eq("user_id", user.value.id);
  if (error) {
    console.error("Unfollow error:", error);
    return;
  }
  follows.value = follows.value.filter((x) => x.id !== f.id);
};

// alerts
const prefsStatus = ref("");
let prefsTimer = null;
let statusTimer = null;

watch(
  () => [[...prefs.categories], prefs.minSeverity],
  () => {
    if (!prefsReady.value || !user.value) return;
    clearTimeout(prefsTimer);
    prefsStatus.value = "Saving...";
    prefsTimer = setTimeout(async () => {
      const { error } = await db.from("alert_preferences").upsert({
        user_id: user.value.id,
        categories: prefs.categories,
        min_severity: prefs.minSeverity,
        updated_at: new Date().toISOString(),
      });
      if (error) {
        console.error("Save alerts error:", error);
        prefsStatus.value = "Not saved";
        return;
      }
      prefsStatus.value = "Saved";
      clearTimeout(statusTimer);
      statusTimer = setTimeout(() => (prefsStatus.value = ""), 2000);
    }, 400);
  },
  { deep: true }
);

onBeforeUnmount(() => {
  clearTimeout(prefsTimer);
  clearTimeout(statusTimer);
});

//danger zone
const logout = async () => {
  await db.auth.signOut();
  sharedProfile.value = null;
  await navigateTo("/");
};

const deleting = ref(false);
const deleteText = ref("");
const deleteError = ref("");
const deletingNow = ref(false);

const openDelete = () => {
  deleteText.value = "";
  deleteError.value = "";
  deleting.value = true;
};

const deleteAccount = async () => {
  if (deleteText.value !== "DELETE") return;
  deletingNow.value = true;
  deleteError.value = "";

  const { error } = await db.rpc("delete_my_account");
  if (error) {
    console.error("Delete account error:", error);
    deleteError.value = `Unable to delete: ${error.message}`;
    deletingNow.value = false;
    return;
  }

  await db.auth.signOut().catch(() => {});
  sharedProfile.value = null;
  await navigateTo("/login");
};
</script>

<style scoped>
.card {
  background: white;
  border: 1px solid rgb(6 68 35 / 0.15);
  border-radius: 1rem;
  padding: 1.25rem;
}
.card-title {
  font-size: 1rem;
  font-weight: 800;
  color: #064423;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: #064423;
}
.input {
  border: 2px solid rgb(6 68 35 / 0.2);
  border-radius: 0.75rem;
  padding: 0.6rem 0.9rem;
  font-size: 0.875rem;
  font-weight: 400;
  color: #111827;
  background: white;
}
.input:focus {
  outline: none;
  border-color: #0b6b3a;
}
</style>
