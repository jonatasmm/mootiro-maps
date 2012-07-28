window.komoo ?= {}
window.komoo.event ?= google.maps.event

class GenericProvider
    name: 'Generic Provider'
    alt: 'Generic Data Provider'
    tileSize: new google.maps.Size 256, 256
    maxZoom: 32

    constructor: (@options) ->
        @addrLatLngCache = {}
        @fetchedTiles = {}

    setMap: (@map) ->
        @map.googleMap.overlayMapTypes.insertAt(0, @)
        @handleMapEvents?()

    getAddrLatLng: (coord, zoom) ->
        key = "x=#{coord.x},y=#{coord.y},z=#{zoom}"
        if @addrLatLngCache[key]
            return @addrLatLngCache[key]

        numTiles = 1 << zoom
        projection = @map.googleMap.getProjection()
        point1 = new google.maps.Point \
            (coord.x + 1) * @tileSize.width / numTiles,
            coord.y * @tileSize.height / numTiles
        point2 = new google.maps.Point \
            coord.x * @tileSize.width / numTiles,
            (coord.y + 1) * @tileSize.height / numTiles
        ne = projection.fromPointToLatLng point1
        sw = projection.fromPointToLatLng point2
        @addrLatLngCache[key] = \
            "bounds=#{ne.toUrlValue()},#{sw.toUrlValue()}&zoom=#{zoom}"


class FeatureProvider extends GenericProvider
    name: 'Feature Provider'
    alt: 'Feature Provider'
    fetchUrl: '/get_geojson?'

    constructor: (options) ->
        super options
        @keptFeatures = komoo.collections.makeFeatureCollection()

    handleMapEvents: ->
        komoo.event.addListener @map.googleMap, 'idle', =>
            bounds = @map.googleMap.getBounds()
            @keptFeatures.forEach (feature) =>
                if not bounds.intersects feature.getBounds()
                    feature.setMap null
            @keptFeatures.clear()


    releaseTile: (tile) ->
        if @fetchedTiles[tile.addr]
            bounds = @map.getBounds()
            @fetchedTiles[tile.addr].features.forEach (feature) =>
                if feature.getBounds
                    if not bounds.intersects feature.getBounds()
                        feature.setMap null
                    else if not bounds.contains feature.getBounds().getNorthEast() or \
                            not bounds.contains feature.getBounds().getSouthWest()
                        @keptFeatures.push feature
                        feature.setMap @map
                else if feature.getPosition
                    if not bounds.contains feature.getPosition()
                        feature.setMap null

    getTile: (coord, zoom, ownerDocument) ->
        div = ownerDocument.createElement('DIV')
        addr = @getAddrLatLng coord, zoom
        div.addr = addr

        # Verifies if we already loaded this block
        if @fetchedTiles[addr]
            @fetchedTiles[addr].features.setMap @map
            return div
        $.ajax
            url: @fetchUrl + addr
            dataType: 'json'
            type: 'GET'
            success: (data) =>
                features = @map.loadGeoJSON JSON.parse(data), false
                @fetchedTiles[addr] =
                    geojson: data
                    features: features
                features.setMap @map
            error: (jqXHR, textStatus) =>
                # TODO: Use Spock
                console?.error textStatus
                serverErrorContainer = $('#server-error')
                if serverErrorContainer.parent().length is 0
                    serverErrorContainer = $('<div>').attr('id', 'server-error')
                    $('body').append serverErrorContainer
                errorContainer = $('<div>').html jqXHR.responseText
                serverErrorContainer.append errorContainer
        return div


window.komoo.providers =
    GenericProvider: GenericProvider
    FeatureProvider: FeatureProvider
    makeFeatureProvider: (options) -> new FeatureProvider options