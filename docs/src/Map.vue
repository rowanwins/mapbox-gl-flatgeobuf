<template>
  <div id="map"></div>
</template>

<script>
import { Map } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { FlatGeobuf } from "../../src/main";

let map = null;
export default {
  name: "Map",
  mounted() {
    const center = [-122.271111, 37.804363];
    const zoom = 9;
    const basemapUrl = "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";

    map = new Map({
      container: "map",
      style: basemapUrl,
      center: center,
      zoom: zoom,
    });

    map.on("load", async () => {
      this.$emit("mapReady", map);
      
      map.on('moveend', () => {
        this.$emit('zoom-changed', map.getZoom())
      })

      const fsSourceId = "featureserver-src";

      new FlatGeobuf(fsSourceId, map, {
        url: "https://flatgeobuf.org/test/data/UScounties.fgb",
        minZoom: 8,
        idProperty: "FIPS",
      });

      map.addLayer({
        id: "fill-lyr",
        source: fsSourceId,
        type: "fill",
        paint: {
          "fill-opacity": 0.5,
          "fill-color": "#B42222",
        },
      });

      map.addLayer({
        id: "fill-ly",
        type: "line",
        source: fsSourceId,
        paint: {
          "line-color": "#B42222",
          "line-width": 3,
        },
      });
    });
  },
};
</script>

<style>
#map {
  height: 100vh;
}
</style>