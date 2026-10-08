import { useEffect } from "react";
import { TRACKING_PIXEL_IDS } from "@/data/site";

// Site-wide conversion/traffic tracking slot (Meta Pixel + Google Analytics)
// — mounted once in App.js so every page gets it, not just the Album page.
// Credentials pending from the client, same placeholder pattern as the
// Printful integration: this component is a functional no-op until real IDs
// are set in data/site.js, at which point it injects the real scripts with
// no further code changes needed.
export const TrackingPixel = () => {
  useEffect(() => {
    const { metaPixelId, googleAnalyticsId } = TRACKING_PIXEL_IDS;

    if (metaPixelId && !window.fbq) {
      /* eslint-disable */
      !(function (f, b, e, v, n, t, s) {
        if (f.fbq) return;
        n = f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = !0;
        n.version = "2.0";
        n.queue = [];
        t = b.createElement(e);
        t.async = !0;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
      })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
      /* eslint-enable */
      window.fbq("init", metaPixelId);
      window.fbq("track", "PageView");
    }

    if (googleAnalyticsId && !window.gtag) {
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`;
      document.head.appendChild(script);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () {
        window.dataLayer.push(arguments);
      };
      window.gtag("js", new Date());
      window.gtag("config", googleAnalyticsId);
    }
  }, []);

  return null;
};
