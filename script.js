document.addEventListener("DOMContentLoaded", function () {
  const visitCounter = document.getElementById("visit-counter");
  const whatsappCounter = document.getElementById("whatsapp-counter");

  if (visitCounter) {
    let visitas = localStorage.getItem("darkzone_visitas");
    visitas = visitas ? parseInt(visitas) + 1 : 1;
    localStorage.setItem("darkzone_visitas", visitas);
    visitCounter.textContent = visitas;
  }

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

  const promoPopup = document.getElementById("promoPopup");
  const closePromo = document.getElementById("closePromo");

  if (promoPopup && closePromo) {
    const ultimaVista = localStorage.getItem("darkzone_promo_ultima_vista");
    const ahora = Date.now();
    const seisHoras = 6 * 60 * 60 * 1000;

    if (!ultimaVista || ahora - parseInt(ultimaVista) > seisHoras) {
      setTimeout(function () {
        promoPopup.style.display = "flex";
      }, 900);
    }

    closePromo.addEventListener("click", function () {
      promoPopup.style.display = "none";
      localStorage.setItem("darkzone_promo_ultima_vista", Date.now().toString());
    });

    promoPopup.addEventListener("click", function (e) {
      if (e.target === promoPopup) {
        promoPopup.style.display = "none";
        localStorage.setItem("darkzone_promo_ultima_vista", Date.now().toString());
      }
    });
  }
});
