rsync -r src/ docs/
rsync build/contracts/* docs/
git add .
git commit -m "Compile assets for Github Pages"
git push -U origin2 master
