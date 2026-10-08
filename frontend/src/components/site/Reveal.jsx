import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

// Scroll-reveal wrapper. Drives its own IntersectionObserver (rather than
// relying on framer-motion's `whileInView`, which depends on the browser's
// visibility/focus state) plus a timeout safety net — some environments
// (backgrounded/hidden tabs, certain automation contexts) throttle or never
// fire IntersectionObserver callbacks at all, which left content stuck
// permanently invisible with the previous whileInView-only approach.
export const Reveal = ({ children, delay = 0, y = 28, className = "", ...rest }) => {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    let done = false;
    const reveal = () => {
      if (done) return;
      done = true;
      setShown(true);
    };
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) reveal();
    });
    if (ref.current) io.observe(ref.current);
    const fallback = setTimeout(reveal, 1000);
    return () => {
      io.disconnect();
      clearTimeout(fallback);
    };
  }, []);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={shown ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
};
