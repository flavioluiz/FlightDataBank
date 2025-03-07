#!/bin/bash

# Salva o nome da branch atual
current_branch=$(git symbolic-ref --short HEAD)

# Verifica se há mudanças não commitadas
if ! git diff-index --quiet HEAD --; then
    echo "Há mudanças não commitadas. Por favor, faça commit ou stash antes de prosseguir."
    exit 1
fi

# Atualiza a branch gh-pages
echo "Atualizando branch gh-pages..."
git checkout gh-pages || git checkout -b gh-pages
git pull origin gh-pages || true

# Remove todos os arquivos exceto .git
find . -maxdepth 1 ! -name '.git' ! -name '.' ! -name '..' -exec rm -rf {} +

# Copia o conteúdo da pasta docs da branch main
git checkout main -- docs/
cp -r docs/* .
rm -rf docs/

# Adiciona todas as mudanças
git add .
git commit -m "chore: sync with docs folder"

# Push para o GitHub
git push origin gh-pages

# Volta para a branch original
git checkout $current_branch

echo "Deploy concluído! O site estará disponível em alguns minutos em https://flavioluiz.github.io/FlightDataBank/" 