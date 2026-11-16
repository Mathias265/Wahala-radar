<template>
  <transition name="modal">
    <div
      v-if="props.isOpen"
      class="fixed flex justify-center items-center inset-0 bg-black/40 backdrop-blur-xs z-50 p-4"
      @click.self="closeModal"
    >
      <Card
        :class="[
          'modal-card w-full relative rounded-2xl shadow-xl p-6 md:p-8 bg-background border border-gray-100 overflow-y-auto transition-all duration-300',
          expanded ? 'max-w-[99vw] h-[97vh]' : 'max-w-5xl max-h-[92vh]',
        ]"
        @click.stop
      >
        <!-- Top controls -->
        <div class="absolute right-4 top-4 flex items-center gap-3">
          <button
            @click="expanded = !expanded"
            type="button"
            :title="expanded ? 'Make smaller' : 'Make bigger'"
            class="text-gray-400 hover:text-[#064423] transition-colors"
          >
            <Minimize2 v-if="expanded" class="w-5 h-5" />
            <Maximize2 v-else class="w-5 h-5" />
          </button>
          <button
            @click="closeModal"
            type="button"
            class="text-gray-400 hover:text-[#064423] transition-colors"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <h2
          class="text-[#064423] font-display text-3xl md:text-4xl font-extrabold mb-6"
        >
          Report wahala
        </h2>

        <form
          class="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6"
          @submit.prevent="submitGist"
        >
          <!-- LEFT: form -->
          <div class="flex flex-col gap-5 min-w-0">
            <!-- Category -->
            <div class="flex flex-col gap-2">
              <label class="text-sm font-bold text-[#064423]">
                Wetin dey happen?
              </label>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="c in categories"
                  :key="c"
                  type="button"
                  @click="form.category = c"
                  :class="[
                    'capitalize rounded-full px-5 py-2 text-sm font-bold border-2 transition-all',
                    form.category === c
                      ? 'bg-[#0B6B3A] text-white border-[#0B6B3A]'
                      : 'text-[#064423] border-[#064423]/20 hover:bg-[#E8F5EC]',
                  ]"
                >
                  {{ c }}
                </button>
              </div>
            </div>

            <!-- Area -->
            <div class="flex flex-col gap-2">
              <label class="text-sm font-bold text-[#064423]"
                >Which area?</label
              >
              <input
                v-model="form.area"
                type="text"
                placeholder="Your area name"
                class="border-2 border-[#064423]/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0B6B3A]"
              />
            </div>

            <!-- Description -->
            <div class="flex flex-col gap-2">
              <label class="text-sm font-bold text-[#064423]">Gist us</label>
              <textarea
                v-model="form.description"
                :rows="expanded ? 10 : 4"
                maxlength="280"
                placeholder="Tell us wetin you see, as e be..."
                class="w-full border-2 border-[#064423]/20 rounded-xl p-4 text-sm resize-y focus:outline-none focus:border-[#0B6B3A]"
              ></textarea>
              <p class="text-xs text-gray-500 text-right">
                {{ form.description.length }} / 280
              </p>
            </div>

            <!-- Severity -->
            <div class="flex flex-col gap-2">
              <label class="text-sm font-bold text-[#064423]"
                >How bad e be?</label
              >
              <div class="grid grid-cols-3 gap-3">
                <button
                  v-for="s in severities"
                  :key="s.value"
                  type="button"
                  @click="form.severity = s.value"
                  :class="[
                    'rounded-xl py-3 text-sm font-bold border-2 transition-all',
                    form.severity === s.value
                      ? 'bg-[#0B6B3A] text-white border-[#0B6B3A]'
                      : 'text-[#064423] border-[#064423]/20 hover:bg-[#E8F5EC]',
                  ]"
                >
                  {{ s.label }}
                </button>
              </div>
            </div>

            <!-- Photo -->
            <div>
              <input
                ref="fileInput"
                type="file"
                accept="image/*"
                class="hidden"
                @change="onFileChange"
              />

              <div
                v-if="!photoPreview"
                @click="fileInput?.click()"
                @dragover.prevent="dragging = true"
                @dragleave.prevent="dragging = false"
                @drop.prevent="onDrop"
                :class="[
                  'cursor-pointer rounded-xl border-2 border-dashed py-8 flex flex-col items-center justify-center text-center transition-colors',
                  dragging
                    ? 'border-[#0B6B3A] bg-[#E8F5EC]'
                    : 'border-[#0B6B3A]/40 bg-[#F1FAF4]',
                ]"
              >
                <Camera class="w-6 h-6 text-[#064423] mb-2" />
                <p class="text-sm font-bold text-[#064423]">
                  Add photo (optional)
                </p>
                <p class="text-xs text-gray-500 mt-1">
                  Drag am here or choose from your device
                </p>
              </div>

              <div
                v-else
                class="relative rounded-xl overflow-hidden border-2 border-[#064423]/20"
              >
                <img
                  :src="photoPreview"
                  alt="Preview"
                  class="w-full max-h-64 object-cover"
                />
                <button
                  type="button"
                  @click="removePhoto"
                  class="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>

            <p v-if="errorMessage" class="text-sm text-red-600 font-medium">
              {{ errorMessage }}
            </p>

            <!-- Actions -->
            <div class="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                @click="closeModal"
                class="rounded-xl border-2 border-[#064423]/20 text-[#064423] font-bold px-8 py-5"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                :disabled="!canSubmit || submitting"
                class="rounded-xl bg-[#064423] text-white hover:bg-[#042d17] font-bold px-8 py-5"
              >
                {{ submitting ? "Posting..." : "Post am" }}
              </Button>
            </div>
          </div>

          <!-- RIGHT: tips + preview -->
          <div class="flex flex-col gap-4">
            <div class="bg-[#E4F5EA] rounded-2xl p-5">
              <h3 class="text-[#064423] font-extrabold mb-3">
                How to report well
              </h3>
              <ul class="flex flex-col gap-3 text-sm text-[#064423]/90">
                <li>Say exactly where you dey, like street or landmark.</li>
                <li>Report wetin you see yourself, no forward rumour.</li>
                <li>Keep am short. People dey rush.</li>
              </ul>
            </div>

            <div class="border border-gray-200 rounded-2xl p-5">
              <h3 class="text-[#064423] font-extrabold mb-3">Preview</h3>

              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-3 min-w-0">
                  <div
                    class="h-9 w-9 shrink-0 rounded-full bg-[#0B6B3A] text-white flex items-center justify-center text-xs font-black"
                  >
                    {{ initials }}
                  </div>
                  <span class="text-sm font-bold text-gray-900 truncate">
                    {{ username || "You" }}
                  </span>
                </div>

                <span
                  :class="[
                    'text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full',
                    badgeStyles[form.category],
                  ]"
                >
                  {{ form.category }}
                </span>
              </div>

              <p
                class="text-sm text-gray-600 mt-3 whitespace-pre-wrap break-words"
              >
                {{
                  form.description.trim() ||
                  "Your gist go show here as you dey type."
                }}
              </p>

              <img
                v-if="photoPreview"
                :src="photoPreview"
                alt=""
                class="mt-3 rounded-lg w-full max-h-32 object-cover"
              />
            </div>
          </div>
        </form>
      </Card>
    </div>
  </transition>
</template>

<script setup>
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Maximize2, Minimize2, Camera } from "@lucide/vue";

const props = defineProps({
  isOpen: Boolean,
  area: { type: String, default: "" },
  state: { type: String, default: "" },
  username: { type: String, default: "" },
});
const emits = defineEmits(["cancel", "refetch"]);

const { user } = useAuth();
const db = useDb();

const categories = ["light", "fuel", "network", "traffic", "market", "other"];
const severities = [
  { value: "small", label: "Small" },
  { value: "e dey pain", label: "E dey pain" },
  { value: "wahala", label: "Wahala!" },
];

const badgeStyles = {
  light: "bg-yellow-100 text-yellow-800",
  fuel: "bg-purple-100 text-purple-800",
  network: "bg-blue-100 text-blue-800",
  traffic: "bg-red-100 text-red-800",
  market: "bg-emerald-100 text-emerald-800",
  other: "bg-gray-100 text-gray-800",
};

const expanded = ref(false);
const submitting = ref(false);
const errorMessage = ref("");
const dragging = ref(false);
const fileInput = ref(null);
const photoFile = ref(null);
const photoPreview = ref("");

const form = reactive({
  category: "light",
  area: "",
  description: "",
  severity: "e dey pain",
});

const initials = computed(() => {
  const name = props.username || "You";
  return name.slice(0, 2).toUpperCase();
});

const canSubmit = computed(
  () => form.category && form.area.trim() && form.description.trim()
);

const resetForm = () => {
  form.category = "light";
  form.area = props.area || "";
  form.description = "";
  form.severity = "e dey pain";
  errorMessage.value = "";
  expanded.value = false;
  removePhoto();
};

watch(
  () => props.isOpen,
  (open) => {
    if (open) resetForm();
  }
);

const setPhoto = (file) => {
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    errorMessage.value = "Please choose an image file.";
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    errorMessage.value = "Photo must be under 5MB.";
    return;
  }
  errorMessage.value = "";
  if (photoPreview.value) URL.revokeObjectURL(photoPreview.value);
  photoFile.value = file;
  photoPreview.value = URL.createObjectURL(file);
};

const onFileChange = (e) => setPhoto(e.target.files?.[0]);

const onDrop = (e) => {
  dragging.value = false;
  setPhoto(e.dataTransfer?.files?.[0]);
};

function removePhoto() {
  if (photoPreview.value) URL.revokeObjectURL(photoPreview.value);
  photoFile.value = null;
  photoPreview.value = "";
  if (fileInput.value) fileInput.value.value = "";
}

const closeModal = () => emits("cancel");

const uploadPhoto = async () => {
  if (!photoFile.value) return null;

  const ext = photoFile.value.name.split(".").pop() || "jpg";
  const path = `${user.value.id}/${Date.now()}.${ext}`;

  const { error } = await db.storage
    .from("gist-photos")
    .upload(path, photoFile.value, { contentType: photoFile.value.type });
  if (error) throw error;

  const { data } = db.storage.from("gist-photos").getPublicUrl(path);
  return data.publicUrl;
};

const submitGist = async () => {
  if (!user.value) {
    errorMessage.value = "Please log in to post.";
    return;
  }
  if (!canSubmit.value) return;

  submitting.value = true;
  errorMessage.value = "";

  try {
    const imageUrl = await uploadPhoto();

    const { error } = await db.from("gists").insert({
      user_id: user.value.id,
      category: form.category,
      area: form.area.trim(),
      state: props.state,
      description: form.description.trim(),
      severity: form.severity,
      image_url: imageUrl,
    });

    if (error) throw error;

    emits("refetch");
    closeModal();
  } catch (error) {
    console.error("Post gist error:", error);
    errorMessage.value = "Unable to post. Please try again.";
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-active .modal-card,
.modal-leave-active .modal-card {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.modal-enter-from .modal-card,
.modal-leave-to .modal-card {
  opacity: 0;
  transform: scale(0.95);
}
</style>
