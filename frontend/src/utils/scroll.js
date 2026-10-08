// Scroll to a normalized progress (0..1) within the pinned cinematic timeline.
export const scrollToState = (target) => {
  const el = document.getElementById("experience");
  if (!el) return false;
  const y = el.offsetTop + (el.offsetHeight - window.innerHeight) * target;
  window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
  return true;
};
