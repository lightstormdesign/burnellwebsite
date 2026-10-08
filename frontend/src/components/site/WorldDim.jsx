// "The wand lights up the world" — the whole page reads 25% darker + a 10%
// black wash by default, and the wand punches a hole back to full
// brightness/opacity wherever it goes. See .world-dim in index.css for the
// actual effect (a backdrop-filter, masked to the wand's position, published
// every frame by MagicCursor.jsx as --wand-mx/--wand-my); this component is
// just the mount point. Desktop-with-a-wand only (hidden below md via the
// .world-dim rule's own responsive class here) — there's nothing to light
// up the world WITH on a touch device.
export const WorldDim = () => (
  <div aria-hidden className="world-dim pointer-events-none fixed inset-0 z-[500] hidden md:block" />
);
