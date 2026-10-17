import unittest
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

import main


class LeadApiTests(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(main.app)
        main.request_times.clear()
        self.lead = {
            "name": "Ana Souza",
            "company": "Clínica Ana",
            "phone": "(11) 99999-1234",
            "interest": "Presença Digital",
            "message": "Quero melhorar os agendamentos.",
            "website": "",
            "consent": True,
        }

    def test_health_check(self) -> None:
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})

    def test_lead_requires_telegram_configuration(self) -> None:
        with patch.object(main, "BOT_TOKEN", ""), patch.object(main, "CHAT_ID", ""):
            response = self.client.post("/api/leads", json=self.lead)
        self.assertEqual(response.status_code, 503)

    def test_valid_lead_is_sent_to_telegram(self) -> None:
        telegram_response = AsyncMock()
        telegram_response.raise_for_status = lambda: None
        telegram_response.json = lambda: {"ok": True}
        client_context = AsyncMock()
        client_context.__aenter__.return_value.post.return_value = telegram_response

        with (
            patch.object(main, "BOT_TOKEN", "test-token"),
            patch.object(main, "CHAT_ID", "test-chat"),
            patch.object(main.httpx, "AsyncClient", return_value=client_context),
        ):
            response = self.client.post("/api/leads", json=self.lead)

        self.assertEqual(response.status_code, 202)
        self.assertEqual(response.json(), {"status": "received"})
        sent_message = client_context.__aenter__.return_value.post.call_args.kwargs["json"]["text"]
        self.assertIn("Ana Souza", sent_message)
        self.assertIn("(11) 99999-1234", sent_message)

    def test_rejects_honeypot_and_invalid_phone(self) -> None:
        honeypot_response = self.client.post(
            "/api/leads",
            json={**self.lead, "website": "spam"},
        )
        invalid_phone_response = self.client.post(
            "/api/leads",
            json={**self.lead, "phone": "123"},
        )
        missing_consent_response = self.client.post(
            "/api/leads",
            json={**self.lead, "consent": False},
        )
        self.assertEqual(honeypot_response.status_code, 422)
        self.assertEqual(invalid_phone_response.status_code, 422)
        self.assertEqual(missing_consent_response.status_code, 422)

    def test_telegram_message_escapes_html(self) -> None:
        lead = main.Lead(**{**self.lead, "name": "<Ana & João>"})
        message = main.format_telegram_message(lead)
        self.assertIn("&lt;Ana &amp; João&gt;", message)


if __name__ == "__main__":
    unittest.main()
