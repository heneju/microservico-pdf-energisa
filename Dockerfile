FROM node:18-alpine

WORKDIR /app

# Copiar package.json primeiro
COPY package.json ./

# Limpar cache e instalar dependências
RUN npm cache clean --force
RUN npm install

# Copiar resto dos arquivos
COPY . .

EXPOSE 3000

CMD ["npm", "start"]