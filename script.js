document.addEventListener("DOMContentLoaded", function () {
  const promoPopup = document.getElementById("promoPopup");
  const closePromo = document.getElementById("closePromo");

  if (promoPopup && closePromo) {
    const promoVista = localStorage.getItem("darkzone_promo_vista");

    if (!promoVista) {
      setTimeout(() => {
        promoPopup.style.display = "flex";
      }, 900);
    }

    closePromo.addEventListener("click", () => {
      promoPopup.style.display = "none";
      localStorage.setItem("darkzone_promo_vista", "true");
    });

    promoPopup.addEventListener("click", function (e) {
      if (e.target === promoPopup) {
        promoPopup.style.display = "none";
        localStorage.setItem("darkzone_promo_vista", "true");
      }
    });
  }

  const visitCounter = document.getElementById("visit-counter");
  if (visitCounter) {
    let visitas = localStorage.getItem("darkzone_visitas");
    visitas = visitas ? parseInt(visitas) + 1 : 1;
    localStorage.setItem("darkzone_visitas", visitas);
    visitCounter.textContent = visitas;
  }

  const whatsappCounter = document.getElementById("whatsapp-counter");
  if (whatsappCounter) {
    let whatsappClicks = localStorage.getItem("darkzone_whatsapp_clicks");
    whatsappClicks = whatsappClicks ? parseInt(whatsappClicks) : 0;
    whatsappCounter.textContent = whatsappClicks;

    document.querySelectorAll(".whatsapp-link").forEach(function (btn) {
      btn.addEventListener("click", function () {
        let clicks = localStorage.getItem("darkzone_whatsapp_clicks");
        clicks = clicks ? parseInt(clicks) + 1 : 1;
        localStorage.setItem("darkzone_whatsapp_clicks", clicks);
        whatsappCounter.textContent = clicks;
      });
    });
  }
});
