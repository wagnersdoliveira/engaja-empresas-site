// Engaja Empresas — interações do site
// IMPORTANTE: preencha o número abaixo com DDI + DDD + número, somente dígitos.
// Exemplo de formato: 5511999999999. Não use espaços, +, parênteses ou hífen.
const WHATSAPP_NUMBER = "5519997941418";

const menuToggle = document.querySelector("#menu-toggle");
const navLinks = document.querySelector("#nav-links");

if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Fechar menu" : "Abrir menu");
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Abrir menu");
    });
  });
}

document.querySelectorAll("[data-package]").forEach((link) => {
  link.addEventListener("click", () => {
    const interest = document.querySelector("#interest");
    const packageName = link.dataset.package || "";
    if (!interest) return;
    const matchingOption = [...interest.options].find((option) =>
      packageName.toLowerCase().startsWith(option.value.toLowerCase())
    );
    if (matchingOption) interest.value = matchingOption.value;
  });
});

document.querySelectorAll("[data-service]").forEach((link) => {
  link.addEventListener("click", () => {
    const interest = document.querySelector("#interest");
    if (!interest) return;
    const service = link.dataset.service;
    const option = [...interest.options].find((item) => item.value === service);
    if (option) interest.value = option.value;
  });
});

const contactForm = document.querySelector("#contact-form");
const feedback = document.querySelector("#form-feedback");

if (contactForm) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!contactForm.reportValidity()) return;

    const formData = new FormData(contactForm);
    const name = String(formData.get("name") || "").trim();
    const company = String(formData.get("company") || "").trim();
    const interest = String(formData.get("interest") || "").trim();
    const message = String(formData.get("message") || "").trim();

    const lines = [
      "Olá! Vim pelo site do Engaja Empresas e gostaria de conversar.",
      "",
      `Nome: ${name}`,
      company ? `Empresa: ${company}` : "",
      `Interesse: ${interest}`,
      message ? `Objetivo: ${message}` : ""
    ].filter(Boolean);

    const text = encodeURIComponent(lines.join("\n"));
    const validNumber = /^\d{12,13}$/.test(WHATSAPP_NUMBER);

    if (validNumber) {
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, "_blank", "noopener,noreferrer");
      if (feedback) feedback.textContent = "Mensagem preparada. Conclua o envio na conversa do WhatsApp que foi aberta.";
    } else {
      if (feedback) {
        feedback.textContent = "O formulário está funcionando, mas o WhatsApp ainda não foi configurado. Abra script.js e substitua COLOQUE_SEU_NUMERO_AQUI pelo número comercial com DDI 55 + DDD + telefone.";
      }
    }
  });
}

const year = document.querySelector("#year");
if (year) year.textContent = new Date().getFullYear();
