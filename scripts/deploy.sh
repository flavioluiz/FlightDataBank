#!/bin/bash

echo "Atualizando branch gh-pages..."

# Salvar o branch atual
CURRENT_BRANCH=$(git symbolic-ref --short HEAD)

# Mudar para o branch gh-pages
git checkout gh-pages

# Atualizar o branch gh-pages com o conteúdo da pasta docs do main
git checkout main -- docs/* data/* images/* js/*
mv docs/* .
rmdir docs

# Commitar as alterações
git add .
git commit -m "chore: sync with docs folder"

# Fazer push das alterações
git push origin gh-pages

# Voltar para o branch original
git checkout $CURRENT_BRANCH

echo "Deploy concluído! O site estará disponível em alguns minutos em https://flavioluiz.github.io/FlightDataBank/" 