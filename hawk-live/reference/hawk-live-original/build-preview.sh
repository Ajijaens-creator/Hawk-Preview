#!/bin/sh
set -eu
cd "$(dirname "$0")"
awk '
/<link rel="stylesheet"/ {
  print "<!doctype html><html lang=\"id\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>HAWK ERP · Integrasi Demo</title><style>"
  while ((getline line < "style.css") > 0) print line
  print "</style></head>"
  next
}
/<\/body>/ {
  print "<script>"
  while ((getline line < "model.js") > 0) print line
  while ((getline line < "app.js") > 0) print line
  print "</script>"
}
{ print }
' index.html > preview.html
