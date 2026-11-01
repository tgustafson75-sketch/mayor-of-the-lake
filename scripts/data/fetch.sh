#!/usr/bin/env bash
# Downloads the raw real-world inputs into data/raw/ (gitignored).
# Sources and licences are listed in docs/SOURCES.md.
set -euo pipefail
cd "$(dirname "$0")/../.."
mkdir -p data/raw
UA="MayorOfTheLake-dev/0.1 (dev; github repo mayor-of-the-lake)"
BB="33.6185,-117.4200,33.7568,-117.2168"   # minlat,minlon,maxlat,maxlon (OSM city relation 11051981 bounds)
OVP=https://overpass-api.de/api/interpreter

# OpenStreetMap (ODbL) via Overpass
curl -sf -A "$UA" -o data/raw/osm-city-boundary.json --data-urlencode 'data=[out:json][timeout:110];rel(11051981);out geom;' $OVP
curl -sf -A "$UA" -o data/raw/osm-water.json --data-urlencode "data=[out:json][timeout:160];(way[\"natural\"=\"water\"]($BB);relation[\"natural\"=\"water\"]($BB););out geom;" $OVP
curl -sf -A "$UA" -o data/raw/osm-roads.json --data-urlencode "data=[out:json][timeout:160];way[\"highway\"~\"^(motorway|trunk|primary|secondary|tertiary)\$\"]($BB);out geom;" $OVP
curl -sf -A "$UA" -o data/raw/osm-buildings.json --data-urlencode 'data=[out:json][timeout:300];area(3611051981)->.a;way["building"](area.a);out geom;' $OVP

# USGS 3DEP bare-earth elevation, 512x384 float32 BIP grid over the same box
curl -sf -o data/raw/dem.bin "https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer/exportImage?bbox=-117.42,33.6185,-117.2168,33.7568&bboxSR=4326&imageSR=4326&size=512,384&format=bip&pixelType=F32&noData=-9999&interpolation=+RSP_BilinearInterpolation&f=image"
echo "raw data fetched into data/raw/"
