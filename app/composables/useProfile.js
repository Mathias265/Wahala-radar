export const useProfile = () => {
    const { user } = useAuth();
    const db = useDb();
    const profile = useState("profile", () => null);
  
    const fetchProfile = async (force = false) => {
      if (!user.value) return null;
      if (profile.value && !force) return profile.value;
  
      const { data, error } = await db
        .from("profiles")
        .select("state, area, username")
        .eq("id", user.value.id)
        .maybeSingle();
  
      if (error) throw error;
      profile.value = data;
      return data;
    };
  
    return { profile, fetchProfile };
  };