# Stage 1: Build Flutter Web
FROM ghcr.io/cirruslabs/flutter:stable AS build

WORKDIR /app

COPY pubspec.yaml pubspec.lock ./
RUN flutter pub get

COPY . .
# La SPA se sirve por el mismo origen que el proxy nginx (/api/ -> backend),
# de modo que la cookie HttpOnly del refresh token viaja sin CORS.
RUN flutter build web --release --no-tree-shake-icons \
    --dart-define=API_BASE_URL=/api/v1

# Stage 2: Serve with Nginx
FROM nginx:alpine

COPY --from=build /app/build/web /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
