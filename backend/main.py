import logging
import os
import re
import time
from collections import defaultdict, deque
from html import escape
from typing import Annotated

import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field, field_validator

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger("engaja.leads")

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "").strip()
SITE_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "SITE_ORIGINS",
        "https://wagnersdoliveira.github.io,http://localhost:8000",
    ).split(",")
    if origin.strip()
]

app = FastAPI(title="Engaja Empresas - Captura de contatos", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=SITE_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

MAX_REQUESTS = 5
RATE_WINDOW_SECONDS = 600
request_times: dict[str, deque[float]] = defaultdict(deque)


class Lead(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    name: Annotated[str, Field(min_length=2, max_length=100)]
    company: Annotated[str, Field(max_length=120)] = ""
    phone: Annotated[str, Field(min_length=10, max_length=20)]
    interest: Annotated[str, Field(min_length=2, max_length=100)]
    message: Annotated[str, Field(max_length=1000)] = ""
    website: Annotated[str, Field(max_length=200)] = ""
    consent: bool

    @field_validator("phone")
    @classmethod
    def phone_has_enough_digits(cls, value: str) -> str:
        if len(re.sub(r"\D", "", value)) < 10:
            raise ValueError("Informe um número de WhatsApp válido.")
        return value


def format_telegram_message(lead: Lead) -> str:
    lines = [
        "📩 <b>Novo contato pelo site — Engaja Empresas</b>",
        "",
        f"<b>Nome:</b> {escape(lead.name)}",
        f"<b>WhatsApp:</b> {escape(lead.phone)}",
        f"<b>Interesse:</b> {escape(lead.interest)}",
    ]
    if lead.company:
        lines.append(f"<b>Negócio:</b> {escape(lead.company)}")
    if lead.message:
        lines.extend(["", f"<b>Desafio:</b> {escape(lead.message)}"])
    return "\n".join(lines)


def check_rate_limit(client_ip: str) -> None:
    now = time.monotonic()
    recent_requests = request_times[client_ip]
    while recent_requests and now - recent_requests[0] > RATE_WINDOW_SECONDS:
        recent_requests.popleft()
    if len(recent_requests) >= MAX_REQUESTS:
        raise HTTPException(
            status_code=429,
            detail="Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.",
        )
    recent_requests.append(now)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/leads", status_code=202)
async def create_lead(lead: Lead, request: Request) -> dict[str, str]:
    if lead.website:
        raise HTTPException(status_code=422, detail="Não foi possível validar o formulário.")
    if not lead.consent:
        raise HTTPException(
            status_code=422,
            detail="É necessário autorizar o uso dos dados para enviar a solicitação.",
        )

    check_rate_limit(request.client.host if request.client else "unknown")
    if not BOT_TOKEN or not CHAT_ID:
        logger.error("Telegram configuration is missing.")
        raise HTTPException(
            status_code=503,
            detail="O recebimento automático está temporariamente indisponível.",
        )

    telegram_url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                telegram_url,
                json={
                    "chat_id": CHAT_ID,
                    "text": format_telegram_message(lead),
                    "parse_mode": "HTML",
                    "disable_web_page_preview": True,
                },
            )
            response.raise_for_status()
            result = response.json()
            if not result.get("ok"):
                raise ValueError("Telegram API did not accept the message.")
    except (httpx.HTTPError, ValueError) as exc:
        logger.error("Telegram delivery failed (%s).", type(exc).__name__)
        raise HTTPException(
            status_code=502,
            detail="Não foi possível avisar a equipe agora. Tente novamente ou use o WhatsApp.",
        ) from exc

    logger.info("A lead notification was delivered to Telegram.")
    return {"status": "received"}
