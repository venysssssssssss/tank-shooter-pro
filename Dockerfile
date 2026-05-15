FROM node:20-alpine

WORKDIR /app

# Apenas arquivos necessários do servidor (em um cenário real seria feito o build e compilado de TS para JS)
# Como estamos usando TSX no dev ou o vite para cliente, precisamos configurar para produção
COPY package*.json ./
RUN npm install --omit=dev && npm install tsx

COPY server/ ./server/

EXPOSE 3001

CMD ["npx", "tsx", "server/index.ts"]