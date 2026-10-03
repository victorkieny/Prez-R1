#!/bin/bash
# Personnalise la présentation avec le nom du client courant, en un
# minimum de clics (demande de Victor : même esprit que l'automatisation
# de Prez-R2, mais adaptée — Prez-R1 n'a pas de système multi-client,
# voir Lancer la présentation.command : data/deck.json est la seule
# source, pas un fichier par client dans data/clients/). D'où une mise à
# jour EN PLACE (JSON-aware, pas un remplacement de texte littéral sur
# "Prénom Nom" — ça casserait dès le 2e client, puisque le placeholder
# n'existe plus après la 1re personnalisation) plutôt qu'un système
# d'archivage par client.
#
# Se positionne toujours sur son propre emplacement (comme Lancer la
# présentation.command) pour fonctionner via un alias Finder sur le
# Bureau — jamais une copie, sinon il ne retrouve pas le projet.

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR" || { echo "Impossible d'accéder à $DIR"; read -r -p "Appuyez sur Entrée pour fermer..." _; exit 1; }

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 est introuvable sur cette machine."
  read -r -p "Appuyez sur Entrée pour fermer..." _
  exit 1
fi

read -r -p "Nom du client (ex. Jean Dupont) : " NAME
if [ -z "$NAME" ]; then
  echo "Nom requis."
  read -r -p "Appuyez sur Entrée pour fermer..." _
  exit 1
fi

# meta.client (coin haut-droit de chaque slide à chapitre, voir
# js/deck.js) ET le kicker de la slide "cover" (seule slide qui ne
# reçoit pas meta.client automatiquement, voir le commentaire dédié dans
# js/deck.js) — les deux affichent le même nom, mis à jour ensemble ici.
python3 -c "
import json, sys

name = sys.argv[1]
path = 'data/deck.json'

with open(path, encoding='utf-8') as f:
    deck = json.load(f)

deck['meta']['client'] = name
for slide in deck['slides']:
    if slide.get('id') == 'cover':
        slide['kicker'] = name

with open(path, 'w', encoding='utf-8') as f:
    json.dump(deck, f, ensure_ascii=False, indent=2)
    f.write('\n')
" "$NAME"

if [ $? -ne 0 ]; then
  echo "Échec de la mise à jour de data/deck.json."
  read -r -p "Appuyez sur Entrée pour fermer..." _
  exit 1
fi

echo ""
echo "Client mis à jour : $NAME"
echo "Ouverture de la présentation..."
sleep 0.5

exec ./"Lancer la présentation.command"
