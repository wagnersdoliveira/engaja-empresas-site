# Engaja Empresas

Landing page da Engaja Empresas, feita com HTML, CSS e JavaScript puros. A API de contatos é separada e feita em Python/FastAPI.

- Site publicado: https://wagnersdoliveira.github.io/engaja-empresas-site/
- Hospedagem: GitHub Pages, branch `main`, diretório raiz
- Contato: o formulário pode enviar novos pedidos ao bot privado da equipe no Telegram pela API Python em `backend/`; até que a API seja publicada, o WhatsApp continua disponível como alternativa
- Pacotes e preços: exibidos na página e sujeitos à confirmação do escopo antes da contratação

Para editar, mantenha `index.html`, `style.css`, `script.js` e a pasta `assets/` juntos. O site usa Google Fonts e precisa de conexão para carregar a tipografia.

## Ativar notificações de leads no Telegram

O GitHub Pages publica apenas os arquivos estáticos do site. O token do bot nunca deve ser colocado no `script.js` nem em qualquer arquivo enviado ao GitHub. A API FastAPI fica separada em `backend/` e o arquivo `render.yaml` na raiz prepara o serviço no Render.

1. Crie um bot com o `@BotFather` no Telegram e obtenha o token. Envie uma mensagem ao bot e descubra o ID do chat privado da equipe.
2. Crie o serviço web no Render usando `render.yaml` e configure `TELEGRAM_BOT_TOKEN` e `TELEGRAM_CHAT_ID` como variáveis secretas no painel do serviço. Não use GitHub Pages para hospedar a API Python.
3. Mantenha `SITE_ORIGINS` limitado à origem do site e acrescente `http://localhost:8000` apenas durante desenvolvimento local.
4. Após o deploy, confirme que `https://SEU-SERVICO.onrender.com/health` retorna `{"status":"ok"}`.
5. Em `script.js`, substitua o valor vazio de `LEADS_API_URL` pela URL HTTPS do serviço, sem barra no final.
6. Publique as alterações do site e teste um pedido real. O formulário também oferece o WhatsApp como alternativa se a API falhar.

Para executar a API localmente, instale `backend/requirements.txt`, defina as variáveis de ambiente indicadas em `backend/.env.example` e rode `uvicorn main:app --reload` a partir da pasta `backend/`.

## Validações

Execute os testes da API com `python -m unittest discover -s backend -p 'test_*.py'` a partir da raiz do projeto.
