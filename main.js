let map = null, history = null, coord = [], marker = [], line = [];

// appends a string to the given DOM
function appendToDOM(DOM, str) {
    DOM.append(str);
}

// return the distance in kilometers between two points
function getDistance(from, to) {
    return (from.distanceTo(to) / 1000).toFixed(0);
}

function undo() {
    if (coord.length == 0) return;
    let str = history.html();
    history.empty().append(str.substr(0, str.lastIndexOf("to") || str.length - 1));
    coord.pop();
    map.removeLayer(marker.pop());
    if (line.length > 0) {
        map.removeLayer(line.pop());
    }
}

// placer des markers et dessiner une droite entre chacun
function draw(latlng) {
    coord.push(latlng);
    let last = coord.length - 1,
        m = L.marker(coord[last]);
    marker.push(m);
    m.addTo(map);
    if (coord.length >= 2) {
        let l = L.polyline([coord[last], coord[last - 1]]);
        line.push(l);
        l.addTo(map);
    }
}

// query pour obtenir le nom d'un pays en fonction de coordonées
function reverseSearch(x, y) {
    let result = "";
    $.ajax({
        async: false,
        type: "GET",
        url: `https://nominatim.openstreetmap.org/reverse?lat=${x}&lon=${y}&format=json`,
        success: function (response) {
            if (response.error) result = "not a country";
            else result = response.address.country;
        }
    });
    return result;
}

$(document).ready(function () {
    let undoBtn = $("#undo");
    history = $("#misc-container p");
    $("#map").droppable();
    undoBtn.draggable({ revert: "invalid" });
    undoBtn.on("click", () => undo());
    map = L.map("map", {
        minZoom: 2,
        maxZoom: 2,
        zoomControl: false,
        noWrap: true
    });
    map.setMaxBounds(  [[-90,-180],   [90,180]]  )
    L.tileLayer("http://{s}.tile.osm.org/{z}/{x}/{y}.png").addTo(map);
    map.setView([0, 0], 2);
    map.on("click", e => {
        draw(e.latlng);
        let str = "", distance = 0;
        if (coord.length < 2) {
            str = reverseSearch(e.latlng.lat, e.latlng.lng);
        } else {
            distance = getDistance(
                marker[marker.length - 1].getLatLng(),
                marker[marker.length - 2].getLatLng()
            );
            str = " to " + reverseSearch(e.latlng.lat, e.latlng.lng) + " : " + distance + "km<br>";
        }
        appendToDOM(history, str);
    });
});