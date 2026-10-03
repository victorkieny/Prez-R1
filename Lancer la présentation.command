#!/bin/bash
# Lance la présentation : démarre un serveur local et ouvre le poste
# présentateur dans le navigateur par défaut. Se positionne toujours sur
# son propre emplacement (double-clic possible sans dépendre du
# répertoire courant).
#
# Contrairement à Prez-R2, pas de système multi-client : data/deck.json
# est directement la source versionnée (voir js/deck.js).
#
# Le serveur local est détaché du Terminal (disown + I/O redirigées) :
# fermer la fenêtre Terminal n'arrête plus le serveur ni la présentation.

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR" || { echo "Impossible d'accéder à $DIR"; read -r -p "Appuyez sur Entrée pour fermer..." _; exit 1; }

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 est introuvable sur cette machine."
  echo "Installez-le, ou lancez le serveur local autrement, puis réessayez."
  read -r -p "Appuyez sur Entrée pour fermer..." _
  exit 1
fi

# Choisit un port libre à partir de 8834 (plage distincte de Prez-R2,
# pour pouvoir lancer les deux présentations en même temps sans conflit).
PORT=8834
while lsof -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; do
  PORT=$((PORT + 1))
done

python3 -c "
import http.server, sys
class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        super().end_headers()
http.server.test(HandlerClass=Handler, port=int(sys.argv[1]))
" "$PORT" </dev/null >/dev/null 2>&1 &
SERVER_PID=$!
disown "$SERVER_PID"

# Attend que le serveur réponde avant d'ouvrir le navigateur (jusqu'à ~5s).
for _ in $(seq 1 50); do
  curl -s -o /dev/null "http://localhost:$PORT/index.html" && break
  sleep 0.1
done

URL="http://localhost:$PORT/presenter.html"
open "$URL"

echo ""
echo "Poste présentateur ouvert : $URL"
echo "Cette fenêtre va se fermer — la présentation continue normalement."
sleep 1
exit 0
