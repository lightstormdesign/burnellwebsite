import { useEffect, useRef, useState } from "react";

// Brings a painted transparent PNG to life with one small WebGL pass, using a
// companion "fx" mask (same framing, any resolution): red channel = water,
// green channel = gold linework. Masks are generated offline from the art by
// colour, so swapping in new art only means regenerating its -fx.png.
//
//   water -> gentle flowing distortion + drifting foam streaks
//   gold  -> slow diagonal light sweep, twinkle, cursor-proximity glow, and a
//            ring of light that travels outward from every click/tap
//
// The plain <img> stays underneath as the no-WebGL / reduced-motion /
// still-loading fallback, so the art always shows even if the shader never
// runs. Coordinates for the cursor glow and tap pulse are in screen space
// (unflipped), so a mirrored copy (`flip`) still lights up exactly where the
// pointer is.

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  vUv.y = 1.0 - vUv.y;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uArt;
uniform sampler2D uFx;
uniform float uTime;
uniform float uFlip;
uniform vec2 uSize;      // canvas size in CSS px
uniform vec2 uTexel;     // 1 / art texture size
uniform vec3 uPointer;   // xy = CSS px within canvas, z = 1 when active
uniform vec3 uPulse;     // xy = CSS px origin, z = start time (s)
uniform float uPhase;    // per-instance offset so mirrored copies don't sync

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

void main() {
  vec2 uv = vUv;
  if (uFlip > 0.5) uv.x = 1.0 - uv.x;
  float t = uTime + uPhase;
  vec2 px = vUv * uSize;

  // Water: displace sampling along the current, but only pull from pixels
  // that are themselves water so rocks never smear into the stream.
  float water = texture2D(uFx, uv).r;
  vec2 q = px * 0.045;
  vec2 flow = vec2(noise(q + vec2(-t * 1.1, 0.0)), noise(q * 1.3 + vec2(-t * 0.9, 7.1))) - 0.5;
  vec2 duv = uv + flow * uTexel * 7.0 * water;
  float waterAt = texture2D(uFx, duv).r;
  vec4 col = texture2D(uArt, mix(uv, duv, waterAt));

  // Foam streaks drifting downstream.
  float streak = noise(vec2(px.x * 0.035 - t * 1.6, px.y * 0.45));
  col.rgb += water * smoothstep(0.7, 0.95, streak) * 0.32 * col.a;

  // Gold light.
  float gold = texture2D(uFx, uv).g;
  vec3 goldLight = vec3(1.0, 0.83, 0.48);

  float sweepPos = fract(t * 0.055) * 1.8 - 0.4;
  float d = (vUv.x + (1.0 - vUv.y) * 0.25) - sweepPos;
  float band = exp(-d * d * 90.0);

  vec2 cell = floor(px / 5.0);
  float tw = hash(cell);
  float twinkle = smoothstep(0.985, 1.0, tw) * (0.5 + 0.5 * sin(t * (2.0 + tw * 3.0) + tw * 40.0));

  float pd = length(px - uPointer.xy);
  float glow = uPointer.z * exp(-pd * pd / (170.0 * 170.0));

  float age = uTime - uPulse.z;
  float ring = 0.0;
  if (age > 0.0 && age < 3.0) {
    float r = age * 650.0;
    float pr = length(px - uPulse.xy);
    ring = exp(-pow((pr - r) / 70.0, 2.0)) * exp(-age * 1.1);
  }

  float light = band * 0.55 + twinkle * 1.2 + glow * 0.75 + ring * 1.1;
  col.rgb += gold * light * goldLight * col.a;
  col.rgb *= 1.0 + gold * 0.07 * sin(t * 0.7);

  gl_FragColor = col;
}`;

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const compile = (gl, type, src) => {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
};

const makeTexture = (gl, img) => {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  return tex;
};

export const LivingArt = ({ src, fx, flip = false, phase = 0, className = "", style }) => {
  const canvasRef = useRef(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const canvas = canvasRef.current;
    const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) return;

    let disposed = false;
    let raf = 0;
    let visible = true;
    const start = performance.now();
    const now = () => (performance.now() - start) / 1000;
    const pointer = { x: -9999, y: -9999, on: 0, target: 0 };
    const pulse = { x: 0, y: 0, t: -10 };
    let uniforms = null;
    let texSize = [1, 1];

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const local = (e) => {
      const r = canvas.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    };
    const onMove = (e) => {
      [pointer.x, pointer.y] = local(e);
      pointer.target = 1;
    };
    const onLeave = () => (pointer.target = 0);
    const onDown = (e) => {
      [pulse.x, pulse.y] = local(e);
      pulse.t = now();
    };
    if (finePointer) {
      window.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("pointerleave", onLeave);
    }
    window.addEventListener("pointerdown", onDown, { passive: true });

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !raf && uniforms) raf = requestAnimationFrame(draw);
    });
    io.observe(canvas);

    const draw = () => {
      raf = 0;
      if (disposed || !visible || document.hidden) return;
      pointer.on += (pointer.target - pointer.on) * 0.08;
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uniforms.time, now());
      gl.uniform2f(uniforms.size, canvas.clientWidth, canvas.clientHeight);
      gl.uniform2f(uniforms.texel, 1 / texSize[0], 1 / texSize[1]);
      gl.uniform3f(uniforms.pointer, pointer.x, pointer.y, pointer.on);
      gl.uniform3f(uniforms.pulse, pulse.x, pulse.y, pulse.t);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      raf = requestAnimationFrame(draw);
    };
    const onVis = () => {
      if (!document.hidden && !raf && uniforms) raf = requestAnimationFrame(draw);
    };
    document.addEventListener("visibilitychange", onVis);

    Promise.all([loadImage(src), loadImage(fx)])
      .then(([art, mask]) => {
        if (disposed) return;
        const prog = gl.createProgram();
        gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
        gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
        gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
        gl.useProgram(prog);

        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(prog, "aPos");
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

        gl.activeTexture(gl.TEXTURE0);
        makeTexture(gl, art);
        gl.activeTexture(gl.TEXTURE1);
        makeTexture(gl, mask);
        texSize = [art.naturalWidth, art.naturalHeight];

        const u = (n) => gl.getUniformLocation(prog, n);
        gl.uniform1i(u("uArt"), 0);
        gl.uniform1i(u("uFx"), 1);
        gl.uniform1f(u("uFlip"), flip ? 1 : 0);
        gl.uniform1f(u("uPhase"), phase);
        uniforms = { time: u("uTime"), size: u("uSize"), texel: u("uTexel"), pointer: u("uPointer"), pulse: u("uPulse") };

        resize();
        setLive(true);
        raf = requestAnimationFrame(draw);
      })
      .catch((e) => console.warn("LivingArt:", e));

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      if (finePointer) {
        window.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerleave", onLeave);
      }
      window.removeEventListener("pointerdown", onDown);
      // Free the GPU context only once the canvas is really gone — an
      // immediate remount (StrictMode, prop change) reuses this same canvas,
      // and a lost context can't be revived.
      setTimeout(() => {
        if (!canvas.isConnected) gl.getExtension("WEBGL_lose_context")?.loseContext();
      }, 0);
    };
  }, [src, fx, flip, phase]);

  return (
    <div className={`relative ${className}`} style={style} aria-hidden>
      <img
        src={src}
        alt=""
        draggable={false}
        className="absolute inset-0 h-full w-full select-none"
        style={{ opacity: live ? 0 : 1, transform: flip ? "scaleX(-1)" : undefined }}
      />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
};
