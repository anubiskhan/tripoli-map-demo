#!/usr/bin/env sh
set -e # Prevents script from running if there are any errors.
git stash save # Stashes everything away incase you didn't commit them
git checkout master
gulp --env=production # Step 2, insert your build script here
git checkout livebuild # Step 3
git rm -rf . # Step 4
git checkout master -- .gitignore # Step 5
mv build/* .
rm -rf build # Step 6
git add . # Step 7
git commit -m "deployed to live enviroment" # Step 8
git push Livesite livebuild # Step 10
git checkout develop # Step 11
git stash pop # Applies previously saved stash so you can continue working on changes. Once applied, removes stash
