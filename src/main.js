import {deserialize} from 'flatgeobuf/lib/cjs/geojson'
import tilebelt from '@mapbox/tilebelt'

export default class FlatGeobuf {
  constructor (sourceId, map, flatGeobufOptions, geojsonSourceOptions) {
    if (!sourceId || !map || !flatGeobufOptions) throw new Error('Source id, map and url must be supplied as the first three arguments.')
    if (!flatGeobufOptions.url) throw new Error('A url must be supplied as part of the flatGeobufOptions object.')
    if (!flatGeobufOptions.idProperty) throw new Error('A idProperty must be supplied as part of the flatGeobufOptions object.')

    this.sourceId = sourceId
    this._map = map
    this._flatGeobufOptions = Object.assign(flatGeobufOptions, {
      minZoom: 9
    })
    this._options = geojsonSourceOptions ? geojsonSourceOptions : {}

    this._fc = this._getBlankFc()
    this._map.addSource(sourceId, Object.assign(this._options, {
      type: 'geojson',
      data: this._fc
    }))
    this._maxExtent = [-Infinity, Infinity, -Infinity, Infinity]

    this._tileIds = new Map()
    this._fcIds = new Map()

    this.enableRequests()
    this._getTileData()
  }

  destroySource () {
    this.disableRequests()
    this._map.removeSource(this.sourceId)
  }

  disableRequests () {
    this._map.off('moveend', this._boundEvent)
  }

  enableRequests () {
    this._boundEvent = this._getTileData.bind(this)
    this._map.on('moveend', this._boundEvent)
  }

  _getBlankFc () {
    return {
      type: 'FeatureCollection',
      features: []
    }
  }

  async _getTileData () {
    const z = this._map.getZoom()
    if (z < this._flatGeobufOptions.minZoom) return
  
    const bounds = this._map.getBounds().toArray()
    const primaryTile = tilebelt.bboxToTile([bounds[0][0], bounds[0][1], bounds[1][0], bounds[1][1]])
    const tilesToRequest = []

    if (primaryTile[2] < this._flatGeobufOptions.minZoom) {
      let candidateTiles = tilebelt.getChildren(primaryTile)
      let minZoomOfCandidates = candidateTiles[0][2]
      while (minZoomOfCandidates < this._flatGeobufOptions.minZoom) {
        const newCandidateTiles = []
        candidateTiles.forEach(t => newCandidateTiles.push(...tilebelt.getChildren(t)))
        candidateTiles = newCandidateTiles
        minZoomOfCandidates = candidateTiles[0][2]
      }
      for (let index = 0; index < candidateTiles.length; index++) {
        const t = candidateTiles[index]
        if (this._doesTileOverlapBbox(t, bounds)) {
          tilesToRequest.push(t)
        }
      }
    } else {
      tilesToRequest.push(primaryTile)
    }

    for (let index = 0; index < tilesToRequest.length; index++) {
      const t = tilesToRequest[index]
      const quadKey = tilebelt.tileToQuadkey(t)
      if (this._tileIds.has(quadKey)) {
        tilesToRequest.splice(index, 1)
        index--
      } else this._tileIds.set(quadKey, true)
    }
  
    if (tilesToRequest.length === 0) return
    const compiledBbox = mergeBoundingBoxes(tilesToRequest)
    let iter = this._loadData(compiledBbox)
    await this.iterateItems(iter)
    this._updateFc()
  }

  async iterateItems (iterator) {
    for await (let feature of iterator) {
      if (this._fcIds.has(feature.properties[this._flatGeobufOptions.idProperty])) continue
      this._fc.features.push(feature)
      this._fcIds.set(feature.properties[this._flatGeobufOptions.idProperty])
    }
  }

  _updateFc (fc) {
    this._map.getSource(this.sourceId).setData(this._fc)
  }

  _doesTileOverlapBbox(tile, bbox) {
    const tileBounds = tile.length === 4 ? tile : tilebelt.tileToBBOX(tile)
    if (tileBounds[2] < bbox[0][0]) return false
    if (tileBounds[0] > bbox[1][0]) return false
    if (tileBounds[3] < bbox[0][1]) return false
    if (tileBounds[1] > bbox[1][1]) return false
    return true
  }

  _loadData (bounds) {
    return deserialize(this._flatGeobufOptions.url, fgBoundingBox(bounds))
  }
}


function mergeBoundingBoxes (bboxes) {
  let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity

  for (let index = 0; index < bboxes.length; index++) {
    const tileBounds = tilebelt.tileToBBOX(bboxes[index])
    xMin = Math.min(xMin, tileBounds[0])
    xMax = Math.max(xMax, tileBounds[2])
    yMin = Math.min(yMin, tileBounds[1])
    yMax = Math.max(yMax, tileBounds[3])
  }
  return [xMin, yMin, xMax, yMax]
}

function fgBoundingBox(bounds) {
  return {
      minX: bounds[0],
      maxX: bounds[2],
      minY: bounds[1],
      maxY: bounds[3],
  };
}