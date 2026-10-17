// Engaja Empresas — interações do site
// IMPORTANTE: preencha o número abaixo com DDI + DDD + número, somente dígitos.
// Exemplo de formato: 5511999999999. Não use espaços, +, parênteses ou hífen.
const WHATSAPP_NUMBER = "5519997941418";
const LEADS_API_URL = "";

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
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!contactForm.reportValidity()) return;

    const formData = new FormData(contactForm);
    const name = String(formData.get("name") || "").trim();
    const company = String(formData.get("company") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const interest = String(formData.get("interest") || "").trim();
    const message = String(formData.get("message") || "").trim();
    const website = String(formData.get("website") || "").trim();
    const submitButton = contactForm.querySelector('button[type="submit"]');

    if (website) return;

    const lines = [
      "Olá! Vim pelo site do Engaja Empresas e gostaria de conversar.",
      "",
      `Nome: ${name}`,
      company ? `Empresa: ${company}` : "",
      `WhatsApp: ${phone}`,
      `Interesse: ${interest}`,
      message ? `Objetivo: ${message}` : ""
    ].filter(Boolean);

    const setFeedback = (messageText, link) => {
      if (!feedback) return;
      feedback.replaceChildren(document.createTextNode(messageText));
      if (link) {
        const contactLink = document.createElement("a");
        contactLink.href = link;
        contactLink.target = "_blank";
        contactLink.rel = "noopener noreferrer";
        contactLink.textContent = "Abrir WhatsApp";
        feedback.append(" ", contactLink);
      }
    };

    const whatsappUrl = /^\d{12,13}$/.test(WHATSAPP_NUMBER)
      ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`
      : "";

    if (!LEADS_API_URL) {
      setFeedback(
        "O recebimento automático ainda não está configurado. Continue o contato pelo WhatsApp:",
        whatsappUrl
      );
      return;
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.setAttribute("aria-busy", "true");
    }
    if (feedback) feedback.textContent = "Enviando sua solicitação...";

    try {
      const response = await fetch(`${LEADS_API_URL.replace(/\/$/, "")}/api/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          company,
          phone,
          interest,
          message,
          website,
          consent: formData.get("consent") === "on"
        })
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        const detail = typeof result.detail === "string"
          ? result.detail
          : "Não foi possível enviar sua solicitação.";
        throw new Error(detail);
      }

      contactForm.reset();
      setFeedback("Pedido recebido! A equipe da Engaja Empresas entrará em contato pelo WhatsApp informado.");
    } catch (error) {
      setFeedback(
        `${error instanceof Error ? error.message : "Falha ao enviar o pedido."} Você também pode falar diretamente com a equipe:`,
        whatsappUrl
      );
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.removeAttribute("aria-busy");
      }
    }
  });
}

const year = document.querySelector("#year");
if (year) year.textContent = new Date().getFullYear();

if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const revealItems = document.querySelectorAll(
    ".section-heading, .service-card, .example-card, .motion-feature, .price-card, .about-copy, .contact-form"
  );

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });

    revealItems.forEach((item) => {
      item.classList.add("reveal");
      revealObserver.observe(item);
    });
  }
}
