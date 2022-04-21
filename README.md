# mapbox-gl-flatgeobuf
A little library provides a tiled approach to consuming flatgeobuf files.

**Note** This library is compatible with both mapbox-gl and maplibre-gl.

### Basic Usage
````
  const fsSourceId = "fgb-src";

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
````

## API
This library exposes a single `FlatGeobuf` class 

### Constructor Options
| Option | Type | Description |
--- | --- | ---
| `sourceId` | `String` **required** | A string  |
| `map` | `Object` **required** | A `mapbox-gl` or `maplibre-gl` `map` instance. |
| `flatGeobufOptions` | `Object` **required** | A range of options which will be used to access the flatgeobuf file. See below. |
| `geojsonSourceOptions` | `Object` | A object which will be passed to the creation of the mapbox-gl [geojson source](https://docs.mapbox.com/mapbox-gl-js/style-spec/sources/#geojson) |


#### FlatGeobuf Options
| Option | Type | Default | Description |
--- | --- | --- | ---
| `url` | `String` **required** | | The url of the flatgeobuf file eg `https://flatgeobuf.org/test/data/UScounties.fgb`. |
| `minZoom` | `Number` **required**  | 7 | The zoom level to start requesting tiles. |
| `idProperty` | `String` **required** | | An id field in the data to help minimise duplicate features being added to the map |


### Methods
| Method  | Description |
------- | -----------
| destroySource() | **Important** The `destroySource()` method removes the source from the map and associated event listeners for retrieving data which request data as the map is panned, so it's important to call this method if removing the layer from the map completely. |
| disableRequests() | **Important**  The `disableRequests()` method temporarily disables the associated event listeners for retrieving data which request data as the map is panned, you may want to call this if you toggle your layer off. |
| enableRequests() | **Important**  The `enableRequests()` method enables the associated event listeners for retrieving data which request data as the map is panned. By default this is called by the constructor. |


#### Example of disabling and enabling requests
It would be nice if disabling/enabling of requests happened automatically but unfortunantly I haven't found a way to make that happen because of how `sources` and `layers` are managed in mapbox-gl.
````
  const fsSourceId = "fgb-src";

  const fgb = new FlatGeobuf(fsSourceId, map, {
    url: "https://flatgeobuf.org/test/data/UScounties.fgb",
    minZoom: 8,
    idProperty: "FIPS",
  });
    
  const fgLyrId = 'fs-fill-lyr'
  map.addLayer({
    'id': fgLyrId,
    'source': fsSourceId,
    'type': 'fill',
    'paint': {
      'fill-opacity': 0.5,
      'fill-color': '#B42222'
    }
  })

  function hideFsLayer () {
      map.setLayoutProperty(fgLyrId, 'visibility', 'none')
      fgb.disableRequests()
  }

  function showFsLayer () {
      map.setLayoutProperty(fgLyrId, 'visibility', 'visible')
      fgb.enableRequests()
  }

  function removeFsCompletelyFromMap () {
    map.removeLayer(fgLyrId)
    fgb.destroySource()
  }
````