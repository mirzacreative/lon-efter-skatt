/* LönEfterSkatt — kalkylator + cookie-banner.
   Förenklad modell (2026 års siffror). Alltid märkt som uppskattning. */
(function(){
"use strict";

/* --- 2026 års siffror (källor: Skatteverket via SCB/Compricer; Skatteverkets beloppsbilaga) --- */
var SKIKTGRANS = 643000;      // beskattningsbar inkomst där statlig skatt börjar
var STATLIG_SATS = 0.20;      // statlig inkomstskatt över skiktgränsen
var GRUNDAVDRAG_SCHABLON = 15000; // förenklat schablonbelopp (verkligt grundavdrag varierar)
var JSA_FAKTOR = 0.22;        // förenklad jobbskatteavdragsfaktor
var JSA_MAX = 35000;          // förenklat tak för jobbskatteavdrag
var JSA_INFASNING = 100000;   // infasning under denna årsinkomst

function fmt(n){
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " kr";
}

function berakna(manadslon, kommunalskattProcent){
  var arsinkomst = manadslon * 12;
  var beskattningsbar = Math.max(0, arsinkomst - GRUNDAVDRAG_SCHABLON);
  var kommunalskatt = beskattningsbar * (kommunalskattProcent / 100);
  var statligSkatt = Math.max(0, beskattningsbar - SKIKTGRANS) * STATLIG_SATS;

  // Förenklat jobbskatteavdrag med infasning vid låga inkomster
  var jsa = Math.min(beskattningsbar * (kommunalskattProcent / 100) * JSA_FAKTOR, JSA_MAX);
  if (arsinkomst < JSA_INFASNING) jsa *= (arsinkomst / JSA_INFASNING);

  var totalSkatt = Math.max(0, kommunalskatt + statligSkatt - jsa);
  var nettoAr = arsinkomst - totalSkatt;
  var effektiv = arsinkomst > 0 ? (totalSkatt / arsinkomst * 100) : 0;

  return {
    arsinkomst: arsinkomst,
    beskattningsbar: beskattningsbar,
    kommunalskatt: kommunalskatt,
    statligSkatt: statligSkatt,
    jobbskatteavdrag: jsa,
    totalSkatt: totalSkatt,
    nettoAr: nettoAr,
    nettoManad: nettoAr / 12,
    effektivSats: effektiv
  };
}

function visaResultat(r, kommunNamn, sats){
  var el = document.getElementById("resultat");
  document.getElementById("resKommun").textContent = kommunNamn + " (" + sats.toFixed(2).replace(".", ",") + " %)";
  document.getElementById("resNettoManad").textContent = fmt(r.nettoManad);
  document.getElementById("resNettoAr").textContent = fmt(r.nettoAr);
  document.getElementById("tdBrutto").textContent = fmt(r.arsinkomst);
  document.getElementById("tdBeskattningsbar").textContent = fmt(r.beskattningsbar);
  document.getElementById("tdKommunal").textContent = "− " + fmt(r.kommunalskatt);
  document.getElementById("tdStatlig").textContent = "− " + fmt(r.statligSkatt);
  document.getElementById("tdJsa").textContent = "+ " + fmt(r.jobbskatteavdrag);
  document.getElementById("tdTotal").textContent = "− " + fmt(r.totalSkatt);
  document.getElementById("tdEffektiv").textContent = r.effektivSats.toFixed(1).replace(".", ",") + " %";
  el.classList.add("show");
  el.scrollIntoView({behavior:"smooth", block:"start"});
}

/* Körs endast i webbläsare */
if (typeof document !== "undefined"){
document.addEventListener("DOMContentLoaded", function(){
  var form = document.getElementById("lonForm");
  if (form){
    form.addEventListener("submit", function(e){
      e.preventDefault();
      var lon = parseFloat(document.getElementById("manadslon").value);
      var sel = document.getElementById("kommun");
      if (!lon || lon <= 0){ alert("Ange en giltig månadslön."); return; }
      if (lon > 1000000){ alert("Ange en rimlig månadslön (max 1 000 000 kr)."); return; }
      var sats = parseFloat(sel.value);
      var namn = sel.options[sel.selectedIndex].text;
      visaResultat(berakna(lon, sats), namn, sats);
    });
  }

  /* --- Cookie-banner --- */
  var banner = document.getElementById("cookieBanner");
  function harVal(){ try { return localStorage.getItem("les_cookie"); } catch(e){ return "1"; } }
  if (banner && !harVal()){
    banner.classList.add("show");
    document.getElementById("cookieAccept").addEventListener("click", function(){
      try { localStorage.setItem("les_cookie","accepterad"); } catch(e){}
      banner.classList.remove("show");
    });
    document.getElementById("cookieDecline").addEventListener("click", function(){
      try { localStorage.setItem("les_cookie","nekad"); } catch(e){}
      banner.classList.remove("show");
    });
  }
});
} // slut webbläsar-guard

// Export för test
if (typeof module !== "undefined") module.exports = { berakna: berakna };

})();
