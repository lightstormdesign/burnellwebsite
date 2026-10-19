// The deer in Burnell's world, alive: cut from the original illustration
// into four pieces (body, head with antlers, ear, tail) that sit exactly
// where they were, so at rest it is the original image. It looks slowly
// around, flicks an ear now and then, swishes its tail and breathes.
// Stands in for the deer layer's <img>: the world positions and sizes it
// the same way (the ref gets the layer's width and transform).
const P = (k) => `/burnell-world-deer-${k}.webp`;

export const DeerRig = ({ refFn, load, onLoad }) => (
  <div ref={refFn} className="absolute left-0 top-0 select-none" style={{ willChange: "transform", transformOrigin: "0 0", aspectRatio: "300 / 430" }}>
    <img src={load ? P("tail") : undefined} alt="" className="deer-tail absolute inset-0 h-full w-full" />
    <img src={load ? P("body") : undefined} onLoad={onLoad} onError={onLoad} alt="" decoding="async" className="deer-body absolute inset-0 h-full w-full" />
    <div className="deer-head absolute inset-0">
      <img src={load ? P("head") : undefined} alt="" className="absolute inset-0 h-full w-full" />
      <img src={load ? P("ear") : undefined} alt="" className="deer-ear absolute inset-0 h-full w-full" />
    </div>
  </div>
);

export default DeerRig;
