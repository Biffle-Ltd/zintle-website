/**
 * WebView first paint + prefetch. Vite inlines this into index.html (blocking).
 * React skeletons call window.__ZNW.*SkeletonHtml so markup cannot drift.
 *
 * Keep HOST in sync with utils/host.ts.
 * Keep org mapping in sync with utils/organisationIdFromUrl.ts.
 * Keep token sanitizing in sync with utils/headerSafeToken.ts.
 */
(function (window) {
  var HOST = "https://prod.biffle.ai";
  var BONE = "znw-skel-bone";
  var ZINTLE_CTA =
    "linear-gradient(90deg,#FF4B7A,#FF5E4D,#FF8A3D)";
  var BIFFLE_CTA = "linear-gradient(90deg,#7c3aed,#ec4899)";
  var WB_CTA = "linear-gradient(90deg,#EF68FF,#7E1AFC)";

  function bone(style) {
    return '<div class="' + BONE + '" style="' + style + '"></div>';
  }

  function repeat(count, html) {
    var out = "";
    for (var i = 0; i < count; i++) out += html;
    return out;
  }

  function headerSafeToken(raw) {
    if (!raw) return "";
    return String(raw).replace(/[\u0100-\uFFFF]/g, "");
  }

  function parseIsCampaign(raw) {
    var v = String(raw || "")
      .trim()
      .toLowerCase();
    return v === "true" || v === "1" || v === "yes";
  }

  function organisationIdFromRaw(rawOrg) {
    if (rawOrg === "ZINTEL1234" || rawOrg === "CAMPAIGN_Z") return "ZINTEL1234";
    if (rawOrg === "BIFFLE1234" || rawOrg === "CAMPAIGN_B") return "BIFFLE1234";
    return "ZINTEL1234";
  }

  function detectBoot() {
    var path = (window.location.pathname || "/").replace(/\/+$/, "") || "/";
    var coins = path === "/coins";
    var welcome = path === "/welcome-back-offer";
    var subscriptions = path === "/subscriptions";
    var params = new URLSearchParams(window.location.search);
    var rawOrg = (params.get("organisation_id") || "").trim();
    var org = organisationIdFromRaw(rawOrg);
    var biffle = org === "BIFFLE1234";
    var token = headerSafeToken(params.get("id"));
    var boot = {
      coins: coins,
      biffle: biffle,
      qr:
        coins &&
        (params.get("quick_recharge") || "").toLowerCase() === "true",
      welcome: welcome,
      subscriptions: subscriptions,
      webview: coins || welcome || subscriptions,
      hasAuth: !!token,
      isCampaign: parseIsCampaign(params.get("is_campaign")),
    };
    return {
      boot: boot,
      token: token,
      params: params,
      org: org,
    };
  }

  function addStylesheet(href, opts) {
    var l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = href;
    if (opts && opts.media) l.media = opts.media;
    if (opts && opts.onload) l.onload = opts.onload;
    document.head.appendChild(l);
  }

  function injectBootCss() {
    if (document.getElementById("znw-boot-css")) return;
    var style = document.createElement("style");
    style.id = "znw-boot-css";
    style.textContent =
      "@keyframes znw-skel{0%{background-position:100% 0}100%{background-position:-100% 0}}" +
      ".znw-skel-bone{background-image:linear-gradient(90deg,var(--znw-skel-a,rgba(255,255,255,.1)) 0%,var(--znw-skel-b,rgba(255,255,255,.22)) 50%,var(--znw-skel-a,rgba(255,255,255,.1)) 100%);background-size:200% 100%;animation:znw-skel 1.15s ease-in-out infinite}" +
      "html.znw-coins-webview,html.znw-coins-webview body,html.znw-coins-webview body.font-sans{background:#000d26;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif!important}" +
      'html.znw-coins-webview[data-org="biffle"],html.znw-coins-webview[data-org="biffle"] body{background:#f5f5f5;--znw-skel-a:rgba(0,0,0,.06);--znw-skel-b:rgba(0,0,0,.12)}' +
      "html.znw-welcome-webview,html.znw-welcome-webview body,html.znw-welcome-webview body.font-sans{background:#fff;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif!important;--znw-skel-a:rgba(0,0,0,.06);--znw-skel-b:rgba(0,0,0,.12)}" +
      "html.znw-subs-webview,html.znw-subs-webview body,html.znw-subs-webview body.font-sans{background:#000;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif!important}" +
      "html.znw-coins-webview #znw-bg,html.znw-welcome-webview #znw-bg,html.znw-subs-webview #znw-bg{display:none}";
    document.head.appendChild(style);
  }

  function applyDocumentBoot(ctx) {
    var boot = ctx.boot;
    var token = ctx.token;
    var params = ctx.params;
    var org = ctx.org;
    injectBootCss();
    document.documentElement.classList.add(
      boot.webview ? "znw-webview" : "znw-marketing",
    );
    if (boot.coins) {
      document.documentElement.classList.add("znw-coins-webview");
      document.documentElement.setAttribute(
        "data-org",
        boot.biffle ? "biffle" : "zintle",
      );
    }
    if (boot.welcome)
      document.documentElement.classList.add("znw-welcome-webview");
    if (boot.subscriptions)
      document.documentElement.classList.add("znw-subs-webview");

    if (!boot.webview) {
      addStylesheet(
        "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@500;700&family=Playfair+Display:wght@700;900&display=swap",
      );
      addStylesheet(
        "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css",
      );
      addStylesheet("/index.css");
    } else {
      var fa = document.createElement("link");
      fa.rel = "stylesheet";
      fa.href =
        "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";
      fa.media = "print";
      fa.onload = function () {
        this.media = "all";
      };
      document.head.appendChild(fa);
    }

    if (boot.coins) {
      try {
        var packHeaders = { "X-Organisation-ID": org };
        if (token) packHeaders.Authorization = "Bearer " + token;
        window.__ZNW_COIN_PACKS = {
          organisationId: org,
          hasAuth: !!token,
          promise: fetch(
            HOST + "/api/v1.2/creator_center/details/get-coin-pack-details/",
            { headers: packHeaders },
          ),
        };
      } catch (e) {
        /* invalid headers must not abort fonts / later prefetches */
      }
    }
    if (boot.welcome) {
      var heroPreload = document.createElement("link");
      heroPreload.rel = "preload";
      heroPreload.as = "image";
      heroPreload.href = "/welcome-back-offer/hero.png";
      document.head.appendChild(heroPreload);
    }
    if (boot.welcome && token && !params.get("coin_pack")) {
      try {
        window.__ZNW_WELCOME_BACK = {
          organisationId: org,
          hasAuth: true,
          promise: fetch(
            HOST + "/api/v1/creator_center/details/get-welcome-back-offer/",
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token,
                "X-Organisation-ID": org,
              },
            },
          ),
        };
      } catch (e) {
        /* invalid headers must not abort boot */
      }
    }
    if (
      boot.subscriptions &&
      token &&
      params.get("plan_id") &&
      !params.get("plan_details")
    ) {
      try {
        var planId = params.get("plan_id");
        window.__ZNW_PLAN_DETAILS = {
          organisationId: org,
          planId: String(planId),
          hasAuth: true,
          promise: fetch(
            HOST +
              "/api/v1/monetization/plans/" +
              encodeURIComponent(String(planId)) +
              "/details/",
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token,
                "X-Organisation-ID": org,
              },
            },
          ),
        };
      } catch (e) {
        /* invalid headers must not abort boot */
      }
    }
  }

  function zintleOfferHtml() {
    return (
      '<div style="border-radius:20px;overflow:hidden;background:linear-gradient(90deg,#FF5A3C,#FF4D5E,#FF7A52);padding:16px">' +
      bone(
        "height:14px;width:112px;border-radius:6px;background:rgba(255,255,255,.25)",
      ) +
      '<div style="margin-top:10px;height:36px;width:148px;border-radius:999px;background:#fff"></div>' +
      '<div style="margin-top:16px;display:flex;justify-content:space-between;align-items:center;border-radius:16px;background:rgba(0,0,0,.2);padding:14px 16px"><div style="display:flex;gap:10px;align-items:center">' +
      bone(
        "height:28px;width:28px;border-radius:99px;background:rgba(255,255,255,.25)",
      ) +
      bone(
        "height:24px;width:64px;border-radius:6px;background:rgba(255,255,255,.3)",
      ) +
      "</div>" +
      bone(
        "height:24px;width:56px;border-radius:6px;background:rgba(255,255,255,.3)",
      ) +
      "</div></div>"
    );
  }

  function biffleOfferHtml() {
    return (
      '<div style="border-radius:22px;overflow:hidden;background:linear-gradient(135deg,#BE185D,#DB2777,#F97316);padding:14px 14px 12px">' +
      bone(
        "height:14px;width:112px;border-radius:6px;background:rgba(255,255,255,.25)",
      ) +
      '<div style="margin:10px 0;height:32px;width:148px;border-radius:8px;background:#fff"></div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;border-radius:16px;background:rgba(0,0,0,.15);padding:10px 16px"><div style="display:flex;gap:8px;align-items:center">' +
      bone(
        "height:28px;width:28px;border-radius:99px;background:rgba(255,255,255,.25)",
      ) +
      bone(
        "height:22px;width:64px;border-radius:6px;background:rgba(255,255,255,.3)",
      ) +
      "</div>" +
      bone(
        "height:22px;width:56px;border-radius:6px;background:rgba(255,255,255,.3)",
      ) +
      "</div></div>"
    );
  }

  function packRowHtml(biffle) {
    if (biffle) {
      return (
        '<div style="display:flex;justify-content:space-between;align-items:center;border-radius:16px;background:#FFF8F0;padding:16px"><div style="display:flex;gap:8px;align-items:center">' +
        bone("height:24px;width:24px;border-radius:99px") +
        bone("height:18px;width:56px;border-radius:6px") +
        "</div>" +
        bone("height:32px;width:72px;border-radius:8px") +
        "</div>"
      );
    }
    return (
      '<div style="display:flex;justify-content:space-between;align-items:center;border-radius:16px;background:#0f1f3d;padding:16px"><div style="display:flex;gap:8px;align-items:center">' +
      bone("height:24px;width:24px;border-radius:99px") +
      bone("height:18px;width:56px;border-radius:6px") +
      "</div>" +
      bone("height:18px;width:48px;border-radius:6px") +
      "</div>"
    );
  }

  function micropackTileHtml(biffle) {
    if (biffle) {
      return (
        '<div style="display:flex;flex-direction:column;align-items:center;border-radius:16px;background:#F3F4F6;padding:16px 12px">' +
        bone("height:24px;width:24px;border-radius:99px") +
        bone("height:16px;width:48px;border-radius:6px;margin-top:8px") +
        bone("height:36px;width:100%;border-radius:12px;margin-top:12px") +
        "</div>"
      );
    }
    return (
      '<div style="display:flex;flex-direction:column;border-radius:16px;background:#1e293b;padding:14px 12px">' +
      bone("height:20px;width:20px;border-radius:99px") +
      bone("height:16px;width:40px;border-radius:6px;margin-top:8px") +
      bone("height:16px;width:48px;border-radius:6px;margin-top:12px") +
      "</div>"
    );
  }

  function ctaButtonHtml(label, gradient, extra) {
    return (
      '<button type="button" disabled style="width:100%;border:0;border-radius:999px;background:' +
      gradient +
      ";opacity:.4;color:#fff;font-weight:700;" +
      (extra || "height:56px") +
      '">' +
      label +
      "</button>"
    );
  }

  function coinsSkeletonHtml(opts) {
    opts = opts || {};
    var biffle = !!opts.biffle;
    var qr = !!opts.qr;
    var offer = biffle ? biffleOfferHtml() : zintleOfferHtml();
    var row = packRowHtml(biffle);
    var tile = micropackTileHtml(biffle);
    var cta = biffle ? "Pay" : qr ? "Continue Call" : "Recharge Now";
    var btnBg = biffle ? BIFFLE_CTA : ZINTLE_CTA;
    var tiles = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:' +
      (biffle ? "12px" : "10px") +
      ';margin-top:' +
      (biffle ? "12px" : "10px") +
      '">' +
      repeat(4, tile) +
      "</div>";
    if (qr && biffle) {
      return (
        '<div role="status" aria-live="polite" aria-label="Loading coin packs" style="position:fixed;inset:0;display:flex;align-items:flex-end;background:rgba(0,0,0,.2)">' +
        '<div style="width:100%;background:#fff;padding:20px 20px 24px;border-radius:20px 20px 0 0">' +
        bone("height:20px;width:220px;border-radius:6px;margin-bottom:20px") +
        offer +
        tiles +
        '<div style="margin-top:16px">' +
        ctaButtonHtml(cta, btnBg, "height:52px") +
        "</div></div></div>"
      );
    }
    if (qr) {
      return (
        '<div role="status" aria-live="polite" aria-label="Loading coin packs" style="min-height:100dvh;background:#001A3D;padding:8px 20px 16px">' +
        bone("height:16px;width:210px;border-radius:6px;margin-bottom:10px") +
        offer +
        tiles +
        '<div style="margin-top:12px">' +
        ctaButtonHtml(cta, btnBg, "height:52px") +
        "</div></div>"
      );
    }
    var bg = biffle ? "#F5F5F5" : "#000D26";
    var barBg = biffle ? "rgba(255,255,255,.95)" : "rgba(0,13,38,.95)";
    var sectionLabel = biffle
      ? "background:rgba(0,0,0,.08)"
      : "background:rgba(255,255,255,.15)";
    var gap = '<div style="height:12px"></div>';
    return (
      '<div role="status" aria-live="polite" aria-label="Loading coin store">' +
      '<div style="min-height:100dvh;background:' +
      bg +
      ';padding:16px 16px 140px">' +
      offer +
      bone(
        "height:16px;width:140px;border-radius:6px;margin:24px 0 12px;" +
          sectionLabel,
      ) +
      row +
      gap +
      row +
      gap +
      row +
      bone(
        "height:16px;width:96px;border-radius:6px;margin:24px 0 12px;" +
          sectionLabel,
      ) +
      row +
      gap +
      row +
      gap +
      row +
      "</div>" +
      '<div style="position:fixed;left:0;right:0;bottom:0;padding:16px;background:' +
      barBg +
      '">' +
      ctaButtonHtml(cta, btnBg, "height:56px") +
      "</div></div>"
    );
  }

  function welcomeSkeletonHtml() {
    return (
      '<div role="status" aria-live="polite" aria-label="Loading welcome back offer" style="flex:1;width:100%;min-height:100dvh;background:#fff;display:flex;flex-direction:column">' +
      bone(
        "height:min(42dvh,360px);width:100%;background:rgba(0,0,0,.05)",
      ) +
      '<div style="padding:12px 24px 0;text-align:center">' +
      bone(
        "height:16px;width:160px;border-radius:6px;margin:0 auto;background:rgba(0,0,0,.08)",
      ) +
      bone(
        "height:24px;width:240px;border-radius:6px;margin:8px auto 0;background:rgba(0,0,0,.08)",
      ) +
      "</div>" +
      '<div style="margin:16px auto 0;display:flex;gap:12px;align-items:center;border-radius:16px;border:1px solid #E8B4E8;background:#F8F0FC;padding:10px 20px">' +
      bone("height:28px;width:56px;border-radius:6px") +
      '<div style="height:20px;width:64px;border-radius:999px;background:#DCFCE7"></div></div>' +
      '<div style="margin-top:auto;padding:16px 24px 24px">' +
      '<button type="button" disabled style="width:100%;height:52px;border:0;border-radius:16px;background:' +
      WB_CTA +
      ';opacity:.4;color:#fff;font-weight:700">Get the Pack</button>' +
      '<div style="margin-top:8px;border-radius:12px;background:#FFF8E1;padding:12px 14px">' +
      bone(
        "height:32px;width:100%;border-radius:6px;background:rgba(0,0,0,.06)",
      ) +
      "</div></div></div>"
    );
  }

  function timelineRowHtml() {
    return (
      '<div style="display:flex;gap:12px;margin-bottom:4px">' +
      '<div style="display:flex;width:20px;flex-direction:column;align-items:center">' +
      '<div style="height:10px;width:10px;border-radius:99px;background:#34C759;flex-shrink:0"></div>' +
      '<div style="min-height:28px;width:2px;flex:1;background:#34C759"></div></div>' +
      '<div style="display:flex;flex:1;justify-content:space-between;gap:12px">' +
      bone(
        "height:16px;width:112px;border-radius:6px;background:rgba(255,255,255,.15)",
      ) +
      bone(
        "height:16px;width:64px;border-radius:6px;background:rgba(255,255,255,.15)",
      ) +
      "</div></div>"
    );
  }

  function upiRowHtml() {
    return (
      '<div style="display:flex;align-items:center;gap:12px;padding:4px 0">' +
      bone(
        "height:40px;width:40px;border-radius:99px;flex-shrink:0;background:rgba(255,255,255,.15)",
      ) +
      bone(
        "height:16px;flex:1;border-radius:6px;background:rgba(255,255,255,.15)",
      ) +
      bone(
        "height:16px;width:12px;border-radius:6px;background:rgba(255,255,255,.1)",
      ) +
      "</div>"
    );
  }

  function subscriptionsSkeletonHtml(opts) {
    opts = opts || {};
    var showPaymentMethods = !!opts.showPaymentMethods;
    var embedded = !!opts.embedded;
    var inner =
      '<div style="overflow:hidden;border-radius:16px;background:#1E1E21;padding:16px 16px 0;box-shadow:0 10px 24px rgba(0,0,0,.4)">' +
      timelineRowHtml() +
      timelineRowHtml() +
      '<div style="display:flex;gap:12px">' +
      '<div style="display:flex;width:20px;justify-content:center;padding-top:2px">' +
      '<div style="height:10px;width:10px;border-radius:99px;border:2px solid rgba(255,255,255,.5)"></div></div>' +
      '<div style="display:flex;flex:1;justify-content:space-between;gap:12px;padding-bottom:12px">' +
      bone(
        "height:16px;width:144px;border-radius:6px;background:rgba(255,255,255,.1)",
      ) +
      bone(
        "height:16px;width:80px;border-radius:6px;background:rgba(255,255,255,.1)",
      ) +
      "</div></div>" +
      '<div style="display:flex;gap:10px;border-top:1px solid rgba(255,255,255,.08);background:rgba(0,0,0,.25);margin:0 -16px;padding:12px 16px">' +
      bone(
        "height:16px;width:16px;border-radius:4px;background:rgba(255,255,255,.15)",
      ) +
      bone(
        "height:32px;flex:1;border-radius:6px;background:rgba(255,255,255,.1)",
      ) +
      "</div></div>" +
      bone(
        "height:16px;width:256px;border-radius:6px;margin-top:12px;background:rgba(255,255,255,.1)",
      ) +
      '<div style="margin-top:12px;border-radius:16px;background:#1E1E21;padding:12px 16px">' +
      bone(
        "height:16px;width:192px;border-radius:6px;background:rgba(255,255,255,.1)",
      ) +
      "</div>" +
      bone(
        "height:16px;width:160px;border-radius:6px;margin-top:12px;background:rgba(255,255,255,.1)",
      );
    if (showPaymentMethods) {
      inner +=
        '<div style="margin-top:16px">' +
        '<div style="border-radius:12px;background:#1E1E21;padding:8px 14px;color:#fff;font-size:12px;font-weight:600">UPI</div>' +
        '<div style="margin-top:8px;padding:0 4px">' +
        repeat(4, upiRowHtml()) +
        "</div></div>";
    }
    if (embedded) {
      return (
        '<div role="status" aria-live="polite" aria-label="Loading plan details">' +
        inner +
        "</div>"
      );
    }
    return (
      '<div role="status" aria-live="polite" aria-label="Loading subscription" style="min-height:100dvh;background:#000;padding:12px 16px 24px;max-width:32rem;margin:0 auto">' +
      '<div style="display:flex;align-items:center;gap:8px;color:#fff;font-weight:600;font-size:16px;margin-bottom:12px">' +
      '<span style="height:32px;width:32px;border-radius:99px;background:rgba(52,199,89,.13)"></span>Pay Securely</div>' +
      inner +
      "</div>"
    );
  }

  function bootHead() {
    var ctx = detectBoot();
    window.__ZNW_BOOT = ctx.boot;
    applyDocumentBoot(ctx);
  }

  function bootPaint() {
    var boot = window.__ZNW_BOOT;
    var root = document.getElementById("root");
    if (!root || !boot || !boot.webview) return;
    if (boot.welcome) {
      root.innerHTML = welcomeSkeletonHtml();
      return;
    }
    if (boot.subscriptions) {
      if (!boot.hasAuth) return;
      root.innerHTML = subscriptionsSkeletonHtml({
        showPaymentMethods: boot.isCampaign,
        embedded: false,
      });
      return;
    }
    if (boot.coins) {
      root.innerHTML = coinsSkeletonHtml({
        biffle: boot.biffle,
        qr: boot.qr,
      });
    }
  }

  window.__ZNW = {
    HOST: HOST,
    bootHead: bootHead,
    bootPaint: bootPaint,
    coinsSkeletonHtml: coinsSkeletonHtml,
    welcomeSkeletonHtml: welcomeSkeletonHtml,
    subscriptionsSkeletonHtml: subscriptionsSkeletonHtml,
  };
})(window);
