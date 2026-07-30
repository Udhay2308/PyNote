import { useEffect, useRef } from "react";

export default function SplashScreen({ onDone }) {
  const splashRef = useRef(null);
  const lightRef = useRef(null);
  const wrapRef = useRef(null);
  const subRef = useRef(null);
  const shimmerRef = useRef(null);

  useEffect(() => {
    function lerp(a, b, t) { return a + (b - a) * t; }
    function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
    function easeInOut(t) { return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2; }
    function ease(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }

    function animProp(el, props, duration, delay, easeFn) {
      return new Promise(res => {
        setTimeout(() => {
          const start = performance.now();
          const from = {}, to = {};
          for (const k in props) { from[k] = props[k][0]; to[k] = props[k][1]; }
          function frame(now) {
            const t = easeFn(Math.min(1, (now - start) / duration));
            let transform = '';
            let opacity = null;
            for (const k in props) {
              const v = lerp(from[k], to[k], t);
              if (k === 'opacity') opacity = v;
              else if (k === 'scale') transform += `scale(${v}) `;
              else if (k === 'translateY') transform += `translateY(${v}px) `;
              else if (k === 'translateX') transform += `translateX(${v}%) `;
            }
            if (transform) el.style.transform = transform.trim();
            if (opacity !== null) el.style.opacity = opacity;
            if (t < 1) requestAnimationFrame(frame);
            else res();
          }
          requestAnimationFrame(frame);
        }, delay);
      });
    }

    async function run() {
      const splash = splashRef.current;
      const light = lightRef.current;
      const wrap = wrapRef.current;
      const sub = subRef.current;
      const shimmer = shimmerRef.current;
      if (!splash) return;

      light.style.opacity = '0';
      wrap.style.opacity = '0';
      wrap.style.transform = 'scale(0.85)';
      sub.style.opacity = '0';
      sub.style.transform = 'translateY(8px)';
      shimmer.style.transform = 'translateX(-100%)';

      await new Promise(r => setTimeout(r, 200));
      animProp(light, { opacity: [0, 1] }, 800, 0, easeOut);
      await new Promise(r => setTimeout(r, 300));
      animProp(wrap, { opacity: [0, 1], scale: [0.85, 1.0] }, 700, 0, easeOut);
      await new Promise(r => setTimeout(r, 350));
      animProp(sub, { opacity: [0, 0.9], translateY: [8, 0] }, 600, 150, easeOut);
      await new Promise(r => setTimeout(r, 900));
      animProp(shimmer, { translateX: [-100, 120] }, 700, 0, easeInOut);
      await new Promise(r => setTimeout(r, 400));
      animProp(wrap, { scale: [1.0, 1.03] }, 500, 0, easeInOut);
      await new Promise(r => setTimeout(r, 600));
      await animProp(splash, { opacity: [1, 0] }, 500, 0, ease);
      onDone();
    }

    run();
  }, [onDone]);

  return (
    <div
      ref={splashRef}
      style={{
        position: "fixed",
        inset: 0,
        background: "#0a0a0f",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        fontFamily: "'Inter', sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Radial glow */}
      <div
        ref={lightRef}
        style={{
          position: "absolute",
          width: "600px", height: "600px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(184,155,94,0.1) 0%, transparent 70%)",
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          opacity: 0,
          pointerEvents: "none",
        }}
      />

      {/* Logo wrap */}
      <div
        ref={wrapRef}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
          opacity: 0,
          transform: "scale(0.85)",
          position: "relative",
          zIndex: 2,
        }}
      >
        {/* Logo image with shimmer */}
        <div style={{ width: "200px", height: "200px", position: "relative" }}>
          <img
            src="/logo.png"
            alt="Pynote"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              mixBlendMode: "screen",
            }}
          />
          {/* Gold shimmer */}
          <div
            ref={shimmerRef}
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(105deg, transparent 30%, rgba(184,155,94,0.4) 50%, transparent 70%)",
              transform: "translateX(-100%)",
              pointerEvents: "none",
            }}
          />
        </div>

        {/* Tagline */}
        <div
          ref={subRef}
          style={{
            fontSize: "11px",
            fontWeight: "400",
            color: "#B89B5E",
            letterSpacing: "2.5px",
            textTransform: "uppercase",
            opacity: 0,
            transform: "translateY(8px)",
          }}
        >
          Python Notebook
        </div>
      </div>
    </div>
  );
}