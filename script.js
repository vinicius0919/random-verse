const versoElemento = document.getElementById("verso");
const referenciaElemento = document.getElementById("referencia");
const refreshBtn = document.getElementById("refreshBtn");
const whatsBtn = document.getElementById("whatsBtn");

let versoAtual = "";
let referenciaAtual = "";

const idiomaUsuario = navigator.language.split("-")[0];

async function traduzirTexto(texto, idiomaDestino) {
  try {
    const resposta = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(texto)}&langpair=en|${idiomaDestino}`,
    );
    const dados = await resposta.json();
    return dados.responseData.translatedText;
  } catch {
    return texto;
  }
}

async function carregarVerso() {
  versoElemento.textContent = "Carregando...";
  referenciaElemento.textContent = "";

  try {
    const resposta = await fetch("https://bible-api.com/?random=verse");
    const dados = await resposta.json();
    const versoData = dados.verses?.[0];

    if (!versoData) throw new Error("Formato inesperado da API");
    versoAtual = dados.text.trim();

    let textoFinal = versoAtual;

    if (idiomaUsuario !== "en") {
      textoFinal = await traduzirTexto(versoAtual, idiomaUsuario);
    }

    // 🔥 Pegando corretamente do array
    const livroOriginal = dados.verses[0].book_name;

    const livroTraduzido =
      idiomaUsuario === "pt" && livrosPT[livroOriginal]
        ? livrosPT[livroOriginal]
        : livroOriginal;
    const capitulo = dados.verses[0].chapter;
    const versiculo = dados.verses[0].verse;


    if (idiomaUsuario === "pt" && livrosPT[livroOriginal]) {
      livroTraduzido = livrosPT[livroOriginal];
    }

    const referenciaFinal = `${livroTraduzido} ${capitulo}:${versiculo}`;

    versoElemento.textContent = `"${textoFinal}"`;
    referenciaElemento.textContent = referenciaFinal;
  } catch (erro) {
    versoElemento.textContent = "Erro ao carregar o versículo.";
    console.error(erro);
  }
}

function compartilharWhatsApp() {
  const mensagem = `${versoElemento.textContent}\n\n${referenciaElemento.textContent}`;
  const url = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
  window.open(url, "_blank");
}

// CANVAS
const imgBtn = document.getElementById("imgBtn");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

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

  const linhas = quebrarTexto(ctx, versoElemento.textContent, 900);

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

imgBtn.addEventListener("click", gerarImagem);

refreshBtn.addEventListener("click", carregarVerso);
whatsBtn.addEventListener("click", compartilharWhatsApp);

// JSON COM OS NOMES DOS LIVROS

let livrosPT = {};

async function carregarLivros() {
  const resposta = await fetch("books.json");
  livrosPT = await resposta.json();
}

carregarLivros(); // chame antes de carregarVerso()

carregarVerso();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}
