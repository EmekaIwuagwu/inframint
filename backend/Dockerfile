FROM rust:1.76-slim-bullseye AS builder

WORKDIR /app
COPY . .
RUN cargo build --release

FROM debian:bullseye-slim
WORKDIR /app
# Install OpenSSL as it is distinctively required by most Rust web apps dealing with HTTPS or DBs
RUN apt-get update && apt-get install -y libssl-dev ca-certificates && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/inframint-backend /usr/local/bin/inframint-backend
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/.env.example ./.env

EXPOSE 8000
CMD ["inframint-backend"]
