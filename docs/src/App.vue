<template>
  <a-row id="app">
    <a-col :span="8" id="sidebar">
      <h2>FlatGeobuf</h2>
      <p v-if="zoom < 8" style="color: red;">
        Zoom in closer to load more data
      </p>
    </a-col>
    <a-col :span="16">
      <Map
        @zoom-changed="zoomChanged"
      />
    </a-col>
  </a-row>
</template>

<script>

import Map from './Map.vue'

export default {
    name: 'App',
    components: {
      Map
    },
    data () {
      return {
        zoom: 9
      }
    },
    methods: {
      zoomChanged (zoom) {
        this.zoom = zoom
      }
    }
}

</script>

<style>

  html, body, #app {
    height: 100%;
  }

  #sidebar {
    padding: 40px;
  }

</style>
