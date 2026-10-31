type TrialVideoPlan = {
  extra_info?: Record<string, unknown> | null;
};

/**
 * Keep the signed-in plan, but use the public response's video.
 * The free-plan API otherwise picks a video from the profile language.
 */
export function withPublicTrialVideo<T extends TrialVideoPlan>(
  plan: T,
  publicPlan: TrialVideoPlan,
): T {
  const extra = plan.extra_info;
  const publicExtra = publicPlan.extra_info;
  if (!extra || !publicExtra) return plan;
  const videoUrl = publicExtra.video_url;
  if (typeof videoUrl !== "string" || !videoUrl.trim()) return plan;
  const next: Record<string, unknown> = { ...extra, video_url: videoUrl };
  if ("mpd_video_url" in publicExtra) {
    const mpd = publicExtra.mpd_video_url;
    if (typeof mpd === "string" && mpd.trim()) next.mpd_video_url = mpd;
    else delete next.mpd_video_url;
  }
  return { ...plan, extra_info: next };
}
