#! /bin/bash

echo "Cleanup.."
rm -f ./stealthtests/_results/*.png
rm -f ./stealthtests/_results/_thumbs/*.png

echo "Running scripts.."
FILES=`find ./stealthtests -type f -name '*.js'`
for file in $FILES
do
  node $file
done

echo "Making thumbnails.."
cp ./stealthtests/_results/*.png ./stealthtests/_results/_thumbs
# Note: MacOS specific image resizing command
sips -Z 640 ./stealthtests/_results/_thumbs/*.png

echo "All done."
