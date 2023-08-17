const osmBase = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
})

const map = L.map('map', {
    center: [0, 0],
    zoom: 2,
    layers: [osmBase]
})


let ids = [35165669, 406514935]
let gjLayers = {}
let query = `[out:json];way(id:${ids.join(',')});out tags;out geom;`
let waysLayer = L.geoJSON()

function zoomToGJLayer(gjLayer) {
    map.fitBounds(gjLayer.getBounds())
}

function getOverpassWaysData(ids) {
    const overpassEndpoint = 'https://overpass-api.de/api/interpreter'
    if (!Array.isArray(ids)) {
        if(typeof ids === 'number') {
            ids = [ids]
        } else {
            throw new Error('ids must be an array of numbers')
        }
    }
    let query = `[out:json];way(id:${ids.join(',')});out tags;out geom;`
    return fetch(`${overpassEndpoint}?data=${query}`)
        .then(response => response.json())
        .then(data => {
            let geojson = osmtogeojson(data)
            return geojson
        })
}

waysLayer.addTo(map)

waysLayer.on('layeradd', function (e) {
    let waysLayerKeys = Object.keys(waysLayer._layers)
    if(Object.keys(waysLayer._layers).length === ids.length) {
        for(let i=0;i<ids.length;i++) {
            let id = ids[i]
            for(let j=0;j<waysLayerKeys.length;j++) {
                let gjLayer = waysLayer._layers[waysLayerKeys[j]]
                if(gjLayer.feature.properties.id === `way/${id}`) {
                    gjLayers[id] = gjLayer._leaflet_id
                }
            }
        }

        for(let i=0;i<ids.length;i++) {
            let id = ids[i]
            let gjLayer = waysLayer._layers[gjLayers[id]]
            let props = gjLayer.feature.properties
            let popupContent = `<h3>way/${id}</h3>`
            if(props) {
                popupContent += '<ul>'
                for(let key in props) {
                    popupContent += `<li>${key}: ${props[key]}</li>`
                }
                popupContent += '</ul>'
            }
            gjLayer.bindPopup(popupContent)
            if(i === 0) {
                zoomToGJLayer(gjLayer)
            }else{
                // wait 5 seconds before using zoomToGJLayer
                setTimeout(() => {
                    zoomToGJLayer(gjLayer)
                }
                , 5000)
            }
          
        }
    }
    
})



let geojson = getOverpassWaysData(ids)
    .then(geojson => {
        waysLayer.addData(geojson)
        return geojson
    })

