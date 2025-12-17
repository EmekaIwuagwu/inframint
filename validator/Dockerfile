FROM rust:1.76-slim-bullseye AS builder

WORKDIR /app
COPY . .
RUN cargo build --release

FROM debian:bullseye-slim
WORKDIR /app
# Install OpenSSL/Ca-certificates
RUN apt-get update && apt-get install -y libssl-dev ca-certificates && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/validator /usr/local/bin/validator

EXPOSE 50051
CMD ["validator"]
