FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

ENV VITE_API_URL=http://localhost:5678
ENV VITE_APP_ENV=docker

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
