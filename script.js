(() => {
  "use strict";

  const cfg = window.DZ_CONFIG || {};
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const toast = $("#toast");
  let toastTimer;

  const showToast = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
  };

  const safeUUID = () => {
    if (window.crypto?.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  const backendReady = Boolean(cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase?.createClient);
  const supabaseClient = backendReady
    ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
      })
    : null;

  async function rpc(functionName, payload = {}) {
    if (!supabaseClient) throw new Error("BACKEND_NOT_CONFIGURED");
    const { data, error } = await supabaseClient.rpc(functionName, payload);
    if (error) throw error;
    return data;
  }

  const formatNumber = (digits) => {
    const d = String(digits || "").replace(/\D/g, "");
    if (d.startsWith("549") && d.length >= 13) {
      const n = d.slice(3);
      const local = n.slice(-8);
      const area = n.slice(0, -8);
      return `+54 9 ${area} ${local.slice(0, 4)}-${local.slice(4)}`;
    }
    return d ? `+${d}` : "";
  };

  const normalizeArgentinaMobile = (raw) => {
    let d = String(raw || "").replace(/\D/g, "");
    if (!d) return "";
    if (d.startsWith("0054")) d = d.slice(4);
    if (d.startsWith("54")) {
      const rest = d.slice(2).replace(/^0/, "");
      if (rest.startsWith("9")) d = `54${rest}`;
      else if (rest.length === 10) d = `549${rest}`;
      else d = `54${rest}`;
    } else {
      d = d.replace(/^0/, "");
      if (d.startsWith("9") && d.length === 11) d = `54${d}`;
      else if (d.length === 10) d = `549${d}`;
      else d = `54${d}`;
    }
    return d;
  };

  const baseWaText = "Hola 👋 Quiero pedir mi usuario o hacer una consulta en DarkZone.";
  let activeReferralCode = "";
  let activeReferrerPhone = "";

  const whatsappUrl = (text = baseWaText) => `https://wa.me/${cfg.whatsappNumber}?text=${encodeURIComponent(text)}`;

  function refreshGlobalLinks() {
    let waText = baseWaText;
    if (activeReferralCode) {
      waText = `Hola 👋 Quiero crear mi usuario en DarkZone.\n\nCódigo de invitación: ${activeReferralCode}`;
      if (activeReferrerPhone) waText += `\nVengo de parte de: ${formatNumber(activeReferrerPhone)}`;
    }
    $$('[data-wa]').forEach((a) => {
      a.href = whatsappUrl(waText);
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    });
    $$('[data-channel]').forEach((a) => {
      a.href = cfg.channelUrl;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    });
    const waDisplay = $("#waDisplay");
    if (waDisplay) waDisplay.textContent = cfg.whatsappDisplay;
    const bet = $("#bet30Link");
    const gan = $("#ganamosLink");
    if (bet) bet.href = cfg.platforms?.bet30 || "#";
    if (gan) gan.href = cfg.platforms?.ganamos || "#";
  }

  // Age gate
  const ageGate = $("#ageGate");
  if (ageGate && localStorage.getItem("dz_age_ok") !== "1") ageGate.hidden = false;
  $("#ageAccept")?.addEventListener("click", () => {
    localStorage.setItem("dz_age_ok", "1");
    ageGate.hidden = true;
  });
  $("#ageLeave")?.addEventListener("click", () => {
    window.location.replace("about:blank");
  });

  // Navigation
  const menuBtn = $("#menuBtn");
  const mainNav = $("#mainNav");
  menuBtn?.addEventListener("click", () => {
    const open = mainNav.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", String(open));
  });
  $$("a", mainNav).forEach((a) => a.addEventListener("click", () => {
    mainNav.classList.remove("open");
    menuBtn?.setAttribute("aria-expanded", "false");
  }));

  // Scroll progress and back-to-top
  const scrollProgress = $("#scrollProgress");
  const backTop = $("#backTop");
  const updateScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const pct = max > 0 ? (scrollY / max) * 100 : 0;
    if (scrollProgress) scrollProgress.style.width = `${pct}%`;
    if (backTop) backTop.style.opacity = scrollY > 600 ? "1" : ".72";
  };
  addEventListener("scroll", updateScroll, { passive: true });
  updateScroll();
  backTop?.addEventListener("click", () => scrollTo({ top: 0, behavior: "smooth" }));

  // Reveal
  const reveal = $$(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.11, rootMargin: "0px 0px -35px" });
    reveal.forEach((el) => io.observe(el));
  } else reveal.forEach((el) => el.classList.add("visible"));

  // Pointer glow + subtle hero tilt
  const glow = $("#cursorGlow");
  if (matchMedia("(pointer:fine)").matches) {
    addEventListener("pointermove", (e) => {
      if (!glow) return;
      glow.style.opacity = "1";
      glow.style.left = `${e.clientX}px`;
      glow.style.top = `${e.clientY}px`;
    }, { passive: true });
    $$('[data-tilt]').forEach((wrap) => {
      const frame = $(".hero-frame", wrap);
      wrap.addEventListener("pointermove", (e) => {
        const r = wrap.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5;
        const y = (e.clientY - r.top) / r.height - .5;
        if (frame) frame.style.transform = `rotateY(${x * 4}deg) rotateX(${-y * 4}deg)`;
      });
      wrap.addEventListener("pointerleave", () => { if (frame) frame.style.transform = ""; });
    });
  }

  // Tabs
  $$(".info-tab").forEach((tab) => tab.addEventListener("click", () => {
    $$(".info-tab").forEach((t) => t.classList.remove("active"));
    $$(".info-panel").forEach((p) => p.classList.remove("active"));
    tab.classList.add("active");
    $(`#tab-${tab.dataset.tab}`)?.classList.add("active");
  }));

  // FAQ
  $$(".faq-q").forEach((button) => button.addEventListener("click", () => {
    const item = button.closest(".faq-item");
    const open = !item.classList.contains("open");
    $$(".faq-item.open").forEach((i) => {
      if (i !== item) {
        i.classList.remove("open");
        $(".faq-q", i)?.setAttribute("aria-expanded", "false");
      }
    });
    item.classList.toggle("open", open);
    button.setAttribute("aria-expanded", String(open));
  }));

  // Poster modal
  const modal = $("#posterModal");
  const modalImg = $("#posterImage");
  const modalTitle = $("#posterTitle");
  $$('[data-poster]').forEach((button) => button.addEventListener("click", () => {
    if (!modal || !modalImg) return;
    modalImg.src = button.dataset.poster;
    modalImg.alt = button.dataset.title || "Información DarkZone";
    if (modalTitle) modalTitle.textContent = button.dataset.title || "DarkZone";
    modal.showModal();
  }));
  $("#posterClose")?.addEventListener("click", () => modal?.close());
  modal?.addEventListener("click", (e) => {
    const rect = modal.getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) modal.close();
  });

  // Copy number
  $("#copyNumber")?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(cfg.whatsappDisplay);
      showToast("Número copiado");
    } catch {
      showToast(cfg.whatsappDisplay);
    }
  });

  // Stats: total sessions + online presence
  const totalVisits = $("#totalVisits");
  const onlineUsers = $("#onlineUsers");
  let sessionId = sessionStorage.getItem("dz_session_id");
  if (!sessionId) {
    sessionId = safeUUID();
    sessionStorage.setItem("dz_session_id", sessionId);
  }
  const prettyCount = (value) => new Intl.NumberFormat("es-AR").format(Number(value || 0));
  const paintStats = (data) => {
    if (!data) return;
    if (totalVisits && data.total_visits !== undefined) totalVisits.textContent = prettyCount(data.total_visits);
    if (onlineUsers && data.online_users !== undefined) onlineUsers.textContent = prettyCount(data.online_users);
  };
  async function registerAndLoadStats() {
    if (!backendReady) return;
    try {
      paintStats(await rpc("dz_register_visit", { p_session: sessionId }));
    } catch (err) { console.warn("DarkZone stats:", err); }
  }
  async function heartbeat() {
    if (!backendReady || document.hidden) return;
    try {
      await rpc("dz_heartbeat", { p_session: sessionId });
      paintStats(await rpc("dz_get_stats"));
    } catch (err) { console.warn("DarkZone heartbeat:", err); }
  }
  registerAndLoadStats();
  setInterval(heartbeat, 30000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) heartbeat(); });

  // Referral visitor identity
  let visitorId = localStorage.getItem("dz_visitor_id");
  if (!visitorId) {
    visitorId = safeUUID();
    localStorage.setItem("dz_visitor_id", visitorId);
  }

  const params = new URLSearchParams(location.search);
  const incomingCode = (params.get("ref") || "").trim().toUpperCase();
  if (/^DZ-[A-Z0-9]{6,16}$/.test(incomingCode)) {
    activeReferralCode = incomingCode;
    const strip = $("#inviteStrip");
    if (strip) strip.hidden = false;
    const stripCode = $("#inviteStripCode");
    if (stripCode) stripCode.textContent = incomingCode;

    if (backendReady) {
      rpc("dz_get_referral", { p_code: incomingCode })
        .then((data) => {
          if (data?.phone) activeReferrerPhone = data.phone;
          refreshGlobalLinks();
        })
        .catch(() => refreshGlobalLinks());
      rpc("dz_track_referral", { p_code: incomingCode, p_visitor: visitorId, p_event: "landing" }).catch(() => {});
    }
  }

  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-wa]");
    if (a && activeReferralCode && backendReady) {
      rpc("dz_track_referral", { p_code: activeReferralCode, p_visitor: visitorId, p_event: "contact" }).catch(() => {});
    }
  });

  // Referral generator
  const refPhone = $("#refPhone");
  const refConsent = $("#refConsent");
  const generateBtn = $("#generateReferral");
  const refStatus = $("#refStatus");
  const refResult = $("#refResult");
  const refCode = $("#refCode");
  const refLink = $("#refLink");
  const confirmedRefs = $("#confirmedRefs");
  const progressBar = $("#refProgressBar");
  const contactedInfo = $("#contactedInfo");
  let generatedCode = "";
  let generatedLink = "";

  const setReferralStatus = (text, error = false) => {
    if (!refStatus) return;
    refStatus.textContent = text;
    refStatus.style.color = error ? "#ff9ba7" : "";
  };

  async function loadReferralProgress(code) {
    if (!backendReady || !code) return;
    try {
      const data = await rpc("dz_referral_progress", { p_code: code });
      const confirmed = Math.min(3, Number(data?.confirmed || 0));
      const contacted = Number(data?.contacted || 0);
      if (confirmedRefs) confirmedRefs.textContent = String(confirmed);
      if (progressBar) progressBar.style.width = `${(confirmed / 3) * 100}%`;
      if (contactedInfo) {
        contactedInfo.textContent = confirmed >= 3
          ? "🎉 3/3 confirmados. Contactanos para aplicar el beneficio en la recarga elegible."
          : `${contacted} contacto${contacted === 1 ? "" : "s"} iniciado${contacted === 1 ? "" : "s"} desde tu enlace. La validación final la realiza el equipo.`;
      }
    } catch (err) { console.warn("Referral progress:", err); }
  }

  generateBtn?.addEventListener("click", async () => {
    const phone = normalizeArgentinaMobile(refPhone?.value);
    if (!refConsent?.checked) {
      setReferralStatus("Marcá la confirmación para continuar.", true);
      refConsent?.focus();
      return;
    }
    if (!/^549\d{10}$/.test(phone)) {
      setReferralStatus("Ingresá un número argentino válido. Ejemplo: 9 249 466 3665.", true);
      refPhone?.focus();
      return;
    }
    if (!backendReady) {
      setReferralStatus("El generador necesita activar el sistema de referidos. Mientras tanto podés solicitar tu enlace por WhatsApp.", true);
      showToast("Falta conectar el sistema de referidos");
      return;
    }

    generateBtn.disabled = true;
    generateBtn.textContent = "Generando…";
    setReferralStatus("Creando tu invitación…");
    try {
      const data = await rpc("dz_get_or_create_referral", { p_phone: phone });
      generatedCode = typeof data === "string" ? data : data?.code;
      if (!generatedCode) throw new Error("No se recibió código");
      generatedLink = `${(cfg.siteUrl || location.origin).replace(/\/$/, "")}/?ref=${encodeURIComponent(generatedCode)}`;
      if (refCode) refCode.textContent = generatedCode;
      if (refLink) refLink.value = generatedLink;
      if (refResult) refResult.hidden = false;
      setReferralStatus("¡Listo! Tu enlace personal ya está preparado.");
      await loadReferralProgress(generatedCode);
    } catch (err) {
      console.warn(err);
      setReferralStatus("No pudimos generar el enlace en este momento. Probá nuevamente o escribinos por WhatsApp.", true);
    } finally {
      generateBtn.disabled = false;
      generateBtn.innerHTML = "Generar mi enlace <b>↗</b>";
    }
  });

  $("#copyRef")?.addEventListener("click", async () => {
    if (!generatedLink) return;
    try {
      await navigator.clipboard.writeText(generatedLink);
      showToast("Enlace copiado");
    } catch { showToast("Mantené presionado el enlace para copiarlo"); }
  });

  $("#openRef")?.addEventListener("click", () => {
    if (generatedLink) window.open(generatedLink, "_blank", "noopener");
  });

  $("#shareRef")?.addEventListener("click", async () => {
    if (!generatedLink) return;
    const shareText = `🎰 Te invito a conocer DarkZone 💜\n\n🎁 Entrá desde mi invitación:\n${generatedLink}\n\n🌐 Sitio oficial:\n${cfg.siteUrl}\n\n📢 Canal oficial de WhatsApp:\n${cfg.channelUrl}\n\nCuando tengas tu usuario, vos también podés generar tu propio enlace e invitar a 3 amigos.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "DarkZone", text: shareText });
      } else {
        await navigator.clipboard.writeText(shareText);
        showToast("Invitación copiada para compartir");
      }
    } catch (err) {
      if (err?.name !== "AbortError") showToast("No se pudo compartir. Probá con Copiar.");
    }
  });

  refreshGlobalLinks();
  $("#year").textContent = new Date().getFullYear();
})();
