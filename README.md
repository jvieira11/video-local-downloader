# Video Downloader

Downloader de vídeos do com interface web responsiva.  
Funciona no computador e no celular (mesma rede Wi-Fi).

---

## Requisitos

- Python 3.9+
- ffmpeg

### Instalando o ffmpeg

| Sistema       | Comando |
|---------------|---------|
| Windows       | Baixe em https://ffmpeg.org/download.html e adicione ao PATH |
| macOS         | `brew install ffmpeg` |
| Ubuntu/Debian | `sudo apt install ffmpeg` |

---

## Instalação

Clone o repositório e instale as dependências:

```bash
git clone https://github.com/seu-usuario/ytdl.git
cd ytdl
pip install -r requirements.txt
```

---

## Configuração

Por padrão o projeto usa o ffmpeg do PATH do sistema. Para apontar um caminho específico, defina a variável de ambiente antes de rodar:

**Windows:**
```powershell
$env:FFMPEG_PATH = "C:\caminho\para\ffmpeg\bin"
```

**macOS/Linux:**
```bash
export FFMPEG_PATH="/caminho/para/ffmpeg/bin"
```

---

## Como usar

Inicie o servidor:

```bash
python app.py
```

O terminal vai exibir dois endereços:

```
Computador:  http://localhost:5000
Celular:     http://192.168.x.x:5000
```

Acesse pelo navegador, cole o link do YouTube, escolha a resolução e clique em baixar.  
Para acessar pelo celular, ele precisa estar na mesma rede Wi-Fi que o computador.

---

## Estrutura do projeto

```
ytdl/
├── app.py
├── requirements.txt
├── README.md
├── static/
│   ├── style.css
│   └── script.js
└── templates/
    └── index.html
```

---

## Observacao

Use apenas para conteudo que voce tem permissao de baixar.  
Respeite os termos de servico do YouTube.
