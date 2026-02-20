const versoElemento = document.getElementById("verso");
const referenciaElemento = document.getElementById("referencia");
const refreshBtn = document.getElementById("refreshBtn");
const whatsBtn = document.getElementById("whatsBtn");
const imgBtn = document.getElementById("imgBtn");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

async function carregarVerso() {
  versoElemento.textContent = "Carregando...";
  referenciaElemento.textContent = "";

  try {
    const resposta = await fetch(
      `https://bible-api.com/data/almeida/random?ts=${Date.now()}`
    );

    if (!resposta.ok) {
      throw new Error(`Erro HTTP: ${resposta.status}`);
    }

    const dados = await resposta.json();

    const verso = dados?.random_verse;

    if (!verso || !verso.text) {
      throw new Error("Formato inesperado da API");
    }

    versoElemento.textContent = `"${verso.text.trim()}"`;
    referenciaElemento.textContent =
      `${verso.book} ${verso.chapter}:${verso.verse}`;

  } catch (erro) {
    versoElemento.textContent = "Não foi possível carregar o versículo.";
    referenciaElemento.textContent = "";
    console.error("Erro:", erro);
  }
}
function compartilharWhatsApp() {
  const mensagem = `${versoElemento.textContent}\n\n${referenciaElemento.textContent}`;
  const url = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
  window.open(url, "_blank");
}

/* ================= CANVAS ================= */

function quebrarTexto(ctx, texto, maxWidth) {
  const palavras = texto.split(" ");
  let linhas = [];
  let linhaAtual = "";

  palavras.forEach((palavra) => {
    const teste = linhaAtual + palavra + " ";
    const largura = ctx.measureText(teste).width;

    if (largura > maxWidth) {
      linhas.push(linhaAtual);
      linhaAtual = palavra + " ";
    } else {
      linhaAtual = teste;
    }
  });

  linhas.push(linhaAtual);
  return linhas;
}

async function gerarImagem() {
  ctx.fillStyle = "#1e3c72";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "white";
  ctx.font = "bold 60px Segoe UI";
  ctx.textAlign = "center";

  const texto = versoElemento.textContent.replace(/^"|"$/g, "");
  const linhas = quebrarTexto(ctx, texto, 900);

  let y = 400;
  linhas.forEach((linha) => {
    ctx.fillText(linha.trim(), canvas.width / 2, y);
    y += 80;
  });

  ctx.fillStyle = "#ffd700";
  ctx.font = "50px Segoe UI";
  ctx.fillText(referenciaElemento.textContent, canvas.width / 2, y + 40);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve));

  if (
    navigator.share &&
    navigator.canShare({
      files: [new File([blob], "versiculo.png", { type: "image/png" })],
    })
  ) {
    const file = new File([blob], "versiculo.png", { type: "image/png" });
    await navigator.share({
      files: [file],
      title: "Versículo Bíblico",
    });
  } else {
    const link = document.createElement("a");
    link.download = "versiculo.png";
    link.href = canvas.toDataURL();
    link.click();
  }
}

/* ================= EVENTOS ================= */

refreshBtn.addEventListener("click", carregarVerso);
whatsBtn.addEventListener("click", compartilharWhatsApp);
imgBtn.addEventListener("click", gerarImagem);

carregarVerso();

/* ================= PWA ================= */

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}