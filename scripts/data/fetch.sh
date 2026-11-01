#!/usr/bin/env bash
# Downloads the raw real-world inputs into data/raw/ (gitignored).
# Sources and licences are listed in docs/SOURCES.md.
set -euo pipefail
cd "$(dirname "$0")/../.."
mkdir -p data/raw
UA="MayorOfTheLake-dev/0.1 (dev; github repo mayor-of-the-lake)"
OVP=https://overpass-api.de/api/interpreter

# City boundary (OSM relation 11051981) and city buildings
curl -sf -A "$UA" -o data/raw/osm-city-boundary.json --data-urlencode 'data=[out:json][timeout:110];rel(11051981);out geom;' $OVP
curl -sf -A "$UA" -o data/raw/osm-buildings.json --data-urlencode 'data=[out:json][timeout:300];area(3611051981)->.a;way["building"](area.a);out geom;' $OVP

# Regional water and main roads, in four tiles (the server drops large single queries).
# Region: 33.50,-117.60 to 33.88,-117.05
i=0
for B in "33.50,-117.60,33.69,-117.33" "33.50,-117.33,33.69,-117.05" "33.69,-117.60,33.88,-117.33" "33.69,-117.33,33.88,-117.05"; do
  i=$((i+1))
  curl -sf -m 300 -A "$UA" -o "data/raw/rw-$i.json" --data-urlencode "data=[out:json][timeout:280];(way[\"natural\"=\"water\"]($B);way[\"highway\"~\"^(motorway|trunk|primary|secondary)\$\"]($B););out geom;" $OVP
done

# USGS 3DEP bare-earth elevation over the region, 768x576 float32 BIP grid
curl -sf -o data/raw/region-dem.bin "https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer/exportImage?bbox=-117.60,33.50,-117.05,33.88&bboxSR=4326&imageSR=4326&size=768,576&format=bip&pixelType=F32&noData=-9999&interpolation=+RSP_BilinearInterpolation&f=image"
echo "raw data fetched into data/raw/"
