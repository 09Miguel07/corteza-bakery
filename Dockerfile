# Imagen de producción del front de Corteza (Angular 22 servido por nginx).
#   docker build -t corteza-web .
#   docker run -p 8080:80 -e API_UPSTREAM=http://host.docker.internal:5080 corteza-web

# ---------- build ----------
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx ng build --configuration production

# ---------- runtime ----------
FROM nginx:1.27-alpine AS runtime
# La imagen de nginx procesa /etc/nginx/templates/*.template con envsubst al arrancar.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/web/browser /usr/share/nginx/html

# Dónde está la API: en compose "http://api:8080", en Kubernetes "http://corteza-api:8080".
ENV API_UPSTREAM=http://api:8080
EXPOSE 80
