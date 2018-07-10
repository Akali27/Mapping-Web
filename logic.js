(function () {
    /*let mymap = L.map('mapid').setView([36.2417576, -113.7522872], 4);

    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
        maxZoom     : 20,
        attribution : '',
        id          : 'mapbox.light'
    }).addTo(mymap);*/

    let earthQuakeArr  = [],
        earthQuakeData = [],
        latlngs = [],
        customObject   = {},
        color          = "green",
        colorsArr      = ["#b7f34d", "#e1f34d", "#f3db4d", "#f3ba4d", "#f0a76b", "#f06b6b"],
        radiusFactor   = 20000,
        lastWeekEQUrl  = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson",
        faultLinesUrl  = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json";

    let getColor = (d) => {
        return d > 5 ? colorsArr[5] :
            d > 4 ? colorsArr[4] :
                d > 3 ? colorsArr[3] :
                    d > 2 ? colorsArr[2] :
                        d > 1 ? colorsArr[1] :
                            colorsArr[0];
    };

    let onEachFaultLine = (feature, layer) => {
        L.polyline(feature.geometry.coordinates);
    };

    let getInterval = function(quake) {
        // earthquake data only has a time, so we'll use that as a "start"
        // and the "end" will be that + some value based on magnitude
        // 18000000 = 30 minutes, so a quake of magnitude 5 would show on the
        // map for 150 minutes or 2.5 hours
        return {
            start: quake.properties.time,
            end:   quake.properties.time + quake.properties.mag * 1800000
        };
    };

    let timelineControl = L.timelineSliderControl({
        formatOutput: function(date) {
            return new Date(date).toString();
        }
    });

    $.get("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson", function (data, status) {
        if (status && data && data.features) {

            for (let i in data.features) {
                customObject.title    = data.features[i].properties.title;
                customObject.place    = data.features[i].properties.place;
                customObject.time     = data.features[i].properties.time;
                customObject.mag      = data.features[i].properties.mag;
                customObject.type     = data.features[i].properties.type;
                customObject.geometry = data.features[i].geometry;
                earthQuakeArr.push({
                    title    : data.features[i].properties.title,
                    place    : data.features[i].properties.place,
                    time     : data.features[i].properties.time,
                    mag      : data.features[i].properties.mag,
                    type     : data.features[i].properties.type,
                    geometry : data.features[i].geometry
                });

                if (customObject.mag > 5) color = colorsArr[5];
                else if (customObject.mag > 4) color = colorsArr[4];
                else if (customObject.mag > 3) color = colorsArr[3];
                else if (customObject.mag > 2) color = colorsArr[2];
                else if (customObject.mag > 1) color = colorsArr[1];
                else if (customObject.mag <= 1) color = colorsArr[0];

                let circle = L.circle([customObject.geometry.coordinates[1], customObject.geometry.coordinates[0]], {
                    color       : color, //"#A9A9A9",
                    fillColor   : color,
                    fillOpacity : 1,
                    radius      : (customObject.mag * radiusFactor)
                });

                let content = "<table class='table table-bordered'><tr><td colspan='2'>" + customObject.title + "</td></tr><tr><td>Place</td><td>" + customObject.place + "</td></tr><tr><td>TIme</td><td>" + new Date(customObject.time) + "</td></tr><tr><td>Magnitude</td><td>" + customObject.mag + "</td></tr><tr><td>Type</td><td>" + customObject.type + "</td></tr></table>";
                circle.bindPopup(content);
                circle.on('mouseover', function (e) {
                    e.target.bringToFront();
                });
                earthQuakeData.push(circle);
            }

            let earthQuakes = L.layerGroup(earthQuakeData);

            let timeline = L.timeline(data, {
                getInterval: getInterval,
                pointToLayer: function(data, latlng){
                    let content = "<table class='table table-bordered'><tr><td colspan='2'>" + data.properties.title + "</td></tr><tr><td>Place</td><td>" + data.properties.place + "</td></tr><tr><td>TIme</td><td>" + new Date(data.properties.time) + "</td></tr><tr><td>Magnitude</td><td>" + data.properties.mag + "</td></tr><tr><td>Type</td><td>" + data.properties.type + "</td></tr></table>";
                    if (data.properties.mag > 5) color = colorsArr[5];
                    else if (data.properties.mag > 4) color = colorsArr[4];
                    else if (data.properties.mag > 3) color = colorsArr[3];
                    else if (data.properties.mag > 2) color = colorsArr[2];
                    else if (data.properties.mag > 1) color = colorsArr[1];
                    else if (data.properties.mag <= 1) color = colorsArr[0];

                    return L.circle(latlng, {
                        radius: data.properties.mag * radiusFactor,
                        color: color,
                        fillColor: color,
                        fillOpacity: 1
                    }).bindPopup(content).on('mouseover', function (e) {
                        e.target.bringToFront();
                    });
                }
            });

            $.get(faultLinesUrl, function (data, status) {
                if (status) {
                    let features = JSON.parse(data);

                    let faultLines = L.geoJSON(features, {
                        onEachFeature: onEachFaultLine,
                        style: {
                            weight: 2,
                            color: 'red'
                        }
                    });

                    let mapboxUrl = "https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw";
                    let grayscale = L.tileLayer(mapboxUrl, {id : 'mapbox.light'}),
                        outdoors  = L.tileLayer(mapboxUrl, {id : 'mapbox.outdoors'}),
                        satellite = L.tileLayer(mapboxUrl, {id : 'mapbox.satellite'});

                    let mymap      = L.map('mapid', {
                        center : [39.73, -104.99],
                        zoom   : 10,
                        layers : [satellite, grayscale, outdoors, faultLines, earthQuakes]
                    });

                    mymap.setView([37.6, -105.665], 5);

                    let baseMaps = {
                        "Satellite" : satellite,
                        "Grayscale" : grayscale,
                        "Outdoor"   : outdoors
                    };

                    let overlayMaps = {
                        "Fault Lines"  : faultLines,
                        "Earth Quakes" : earthQuakes
                    };

                    L.control.layers(baseMaps, overlayMaps).addTo(mymap);

                    let legend   = L.control({position : 'bottomright'});
                    legend.onAdd = function (map) {
                        let div    = L.DomUtil.create('div', 'info legend'),
                            grades = [0, 1, 2, 3, 4, 5],
                            labels = [];
                        // loop through our density intervals and generate a label with a colored square for each interval
                        for (let i = 0; i < grades.length; i++) {
                            div.innerHTML +=
                                '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
                                grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
                        }
                        return div;
                    };
                    legend.addTo(mymap);
                    timelineControl.addTo(mymap);
                    timelineControl.addTimelines(timeline);
                    timeline.addTo(mymap);
                    $(".leaflet-bottom").css({"width": "100%"});
                }
            });

        }
    });
})();