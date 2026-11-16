export default defineNuxtRouteMiddleware(async () => {
  const supabase = useDb();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return navigateTo("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("area_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.area_id) return navigateTo("/onboarding");
});
