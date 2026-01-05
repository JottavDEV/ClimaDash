# 🌤️ ClimaDash - Dashboard Climático Moderno

Dashboard climático moderno e robusto desenvolvido com Next.js, TypeScript, Tailwind CSS e integração com APIs de clima em tempo real.

![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat-square&logo=tailwind-css)

## 📋 Índice

- [Características](#-características)
- [Tecnologias](#-tecnologias)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Uso](#-uso)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [APIs Utilizadas](#-apis-utilizadas)
- [Funcionalidades](#-funcionalidades)

## ✨ Características

- 🌍 **Busca de Cidades**: Autocomplete inteligente para buscar qualquer cidade do mundo
- 📍 **Geolocalização**: Detecção automática da localização do usuário com permissão
- 🌡️ **Dados em Tempo Real**: Temperatura, umidade, vento, UV, pressão e visibilidade
- 📊 **Gráficos Interativos**: Visualização da variação de temperatura nas próximas 24h
- 📅 **Previsão 7 Dias**: Previsão completa para a semana
- 🔄 **Atualizações em Tempo Real**: WebSocket para atualizações automáticas (opcional)
- 🌓 **Dark Mode**: Suporte completo a tema claro/escuro
- 📱 **Responsivo**: Design mobile-first, funciona perfeitamente em todos os dispositivos
- 🎨 **Glassmorphism**: Interface moderna com efeito de vidro fosco

## 🛠️ Tecnologias

- **Framework**: Next.js 14.2 (App Router)
- **Linguagem**: TypeScript 5.4
- **Estilização**: Tailwind CSS 3.4
- **Ícones**: Lucide React
- **Gráficos**: Recharts 2.12
- **WebSocket**: Socket.io 4.7
- **Build Tool**: Next.js Built-in

## 📦 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Chave de API do Tomorrow.io ([obter aqui](https://www.tomorrow.io/))

## 🚀 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/JottavDEV/ClimaDash.git
cd ClimaDash
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env.local
```

4. Adicione sua chave de API no arquivo `.env.local`:
```env
TOMORROW_IO_API_KEY=sua_chave_aqui
```

## ⚙️ Configuração

### Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
TOMORROW_IO_API_KEY=sua_chave_tomorrow_io
```

### WebSocket (Opcional)

O sistema suporta atualizações em tempo real via WebSocket. Para usar:

1. O servidor WebSocket será iniciado automaticamente com `npm run dev:all`
2. O cliente tentará conectar automaticamente
3. Se o servidor não estiver disponível, o sistema usa a API REST como fallback

## 🎯 Uso

### Desenvolvimento

Apenas o frontend:
```bash
npm run dev
```

Frontend + WebSocket:
```bash
npm run dev:all
```

Acesse: [http://localhost:3000](http://localhost:3000)

### Produção

Build:
```bash
npm run build
```

Iniciar:
```bash
npm start
# ou com WebSocket
npm run start:all
```

## 📁 Estrutura do Projeto

```
ClimaDash/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   └── weather/       # Rotas de clima
│   ├── globals.css        # Estilos globais
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Página principal
├── components/            # Componentes React
│   ├── DailyForecast.tsx  # Previsão 7 dias
│   ├── ForecastChart.tsx  # Gráfico de temperatura
│   ├── SearchBar.tsx      # Barra de busca
│   ├── Sidebar.tsx        # Sidebar colapsável
│   └── WeatherCard.tsx   # Card principal
├── hooks/                 # Custom Hooks
│   ├── useGeolocation.ts # Hook de geolocalização
│   └── useWebSocket.ts   # Hook de WebSocket
├── lib/                   # Utilitários
│   ├── utils.ts          # Funções auxiliares
│   └── weather.ts        # Lógica de clima
├── server/                # Servidor WebSocket
│   └── socket-server.ts   # Servidor Socket.io
└── public/                # Arquivos estáticos
```

## 🌐 APIs Utilizadas

### Tomorrow.io
- **Uso**: Dados climáticos em tempo real e previsões
- **Endpoints**: 
  - `/v4/weather/realtime` - Dados atuais
  - `/v4/weather/forecast` - Previsões horárias e diárias
- **Documentação**: [Tomorrow.io Docs](https://docs.tomorrow.io/)

### OpenStreetMap Nominatim
- **Uso**: Reverse geocoding (buscar nome da cidade por coordenadas)
- **Endpoint**: `https://nominatim.openstreetmap.org/reverse`
- **Gratuito**: Sim, sem necessidade de API key
- **Documentação**: [Nominatim Docs](https://nominatim.org/release-docs/latest/api/Reverse/)

## 🎨 Funcionalidades Detalhadas

### 1. Busca de Cidades
- Autocomplete inteligente
- Suporte a múltiplas cidades com mesmo nome
- Busca por nome, estado e país

### 2. Geolocalização
- Solicita permissão do usuário
- Busca automática do nome da cidade via reverse geocoding
- Fallback para coordenadas se não encontrar nome
- Salva preferência do usuário

### 3. Dados Climáticos
- **Temperatura**: Atual e sensação térmica
- **Umidade**: Percentual
- **Vento**: Velocidade (km/h) e direção
- **UV Index**: Índice de radiação UV
- **Pressão**: Pressão atmosférica (hPa)
- **Visibilidade**: Distância de visibilidade (km)

### 4. Gráficos
- Linha de temperatura para próximas 24h
- Linha de sensação térmica
- Tooltips interativos
- Responsivo

### 5. Previsão 7 Dias
- Temperatura máxima e mínima
- Descrição do clima
- Umidade e vento
- Layout horizontal responsivo

### 6. WebSocket (Opcional)
- Atualizações automáticas a cada 5 minutos
- Cache inteligente para evitar requisições excessivas
- Fallback automático para REST se desconectar
- Indicador visual de status da conexão

### 7. Dark Mode
- Alternância manual
- Persistência no localStorage
- Transições suaves
- Cores otimizadas para ambos os temas

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Apenas frontend
npm run dev:all          # Frontend + WebSocket

# Produção
npm run build            # Build do projeto
npm start                # Iniciar produção
npm run start:all        # Produção + WebSocket

# WebSocket (standalone)
npm run socket:dev        # Desenvolvimento WebSocket
npm run socket:start     # Produção WebSocket

# Linting
npm run lint             # Verificar código
```

## 🎯 Como Funciona

### Fluxo de Busca de Clima

1. **Usuário busca cidade** ou **usa geolocalização**
2. **Sistema valida** se é coordenadas ou nome
3. **API Tomorrow.io** retorna dados climáticos
4. **Sistema extrai** nome da cidade da resposta (se coordenadas)
5. **Atualiza UI** com dados e nome correto

### Cache

- Cache em memória para evitar requisições excessivas
- TTL de 15 minutos por cidade
- Cache separado para WebSocket

### WebSocket

1. Cliente conecta ao servidor (porta 3001)
2. Cliente se inscreve em uma cidade
3. Servidor busca dados e envia atualizações
4. Atualizações automáticas a cada 5 minutos
5. Se desconectar, fallback para REST API

## 🐛 Troubleshooting

### Erro de API Key
- Verifique se a chave está correta no `.env.local`
- Confirme que a chave tem permissões para a API

### WebSocket não conecta
- Verifique se o servidor está rodando (`npm run socket:dev`)
- O sistema usa fallback automático para REST se falhar

### Geolocalização não funciona
- Verifique permissões do navegador
- HTTPS é necessário em produção
- Alguns navegadores bloqueiam em localhost

## 📝 Licença

Este projeto é privado e de uso pessoal.

## 👤 Autor

**JottavDEV**

- GitHub: [@JottavDEV](https://github.com/JottavDEV)

## 🙏 Agradecimentos

- [Tomorrow.io](https://www.tomorrow.io/) - API de dados climáticos
- [OpenStreetMap](https://www.openstreetmap.org/) - Dados de geocoding
- [Next.js](https://nextjs.org/) - Framework React
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS

---

⭐ Se este projeto foi útil, considere dar uma estrela!

