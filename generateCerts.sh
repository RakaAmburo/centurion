#!/bin/bash

# Limpieza previa
rm -f *.key *.crt *.csr *.pem *.srl

echo "📌 Generando CA (server.crt y server.key)..."
openssl req -x509 -newkey rsa:2048 -days 365 -nodes \
  -keyout server.key \
  -out server.crt \
  -subj "/C=ES/ST=Madrid/L=Madrid/O=JCEA/OU=JCEA/CN=automation.xyz" \
  -extensions v3_ca \
  -config config.cfg

echo "📌 Generando clave y CSR del cliente..."
openssl req -new -newkey rsa:2048 -nodes \
  -keyout client.key \
  -out client.csr \
  -subj "/C=ES/ST=Madrid/L=Madrid/O=JCEA/OU=JCEA/CN=automation.xyz"

echo "📌 Firmando certificado cliente con CA..."
openssl x509 -req -in client.csr \
  -CA server.crt -CAkey server.key -CAcreateserial \
  -out client-crt.pem -days 365 \
  -extensions v3_req -extfile config.cfg

echo "✅ Verificando certificado cliente..."
openssl verify -CAfile server.crt client-crt.pem