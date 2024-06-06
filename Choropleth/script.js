var width = 800, height = 350; // Adjusted to fit within the allocated space
var svg = d3.select(".map")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

var projection = d3.geoMercator()
                    .center([0, 20]) // Centering the map to focus on populated areas
                    .translate([width / 2, height / 2])
                    .scale(120); // Adjusted scale to fit the map within the dimensions

var path = d3.geoPath().projection(projection);

var color = d3.scaleThreshold()
              .domain([65, 70, 71, 75, 76, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88])
              .range(d3.schemeRdYlGn[9]);

var zoom = d3.zoom()
             .scaleExtent([1, 8])
             .on("zoom", zoomed);

svg.call(zoom);

function zoomed(event) {
    g.attr("transform", event.transform);
}

var g = svg.append("g");

var tooltip = d3.select("#tooltip");

// Horizontal legend
var legend = d3.select("#legend");

var legendItems = legend.selectAll(".legend-item")
    .data(color.range().map(function(d) {
        var invert = color.invertExtent(d);
        return {
            color: d,
            value: invert[0]
        };
    }))
    .enter().append("div")
    .attr("class", "legend-item")
    .style("display", "flex")
    .style("align-items", "center")
    .style("margin-right", "10px"); // Add space between legend items

legendItems.append("svg")
    .attr("width", 18)
    .attr("height", 18)
    .append("rect")
    .attr("width", 18)
    .attr("height", 18)
    .style("fill", function(d) { return d.color; });

legendItems.append("text")
    .style("margin-left", "5px") // Add space between the color block and the text
    .text(function(d, i) { return color.domain()[i] + "-" + (color.domain()[i + 1] || "+"); });

// Add legend entry for "No Data"
var noDataLegend = legend.append("div")
    .attr("class", "legend-item")
    .style("display", "flex")
    .style("align-items", "center")
    .style("margin-right", "10px");

noDataLegend.append("svg")
    .attr("width", 18)
    .attr("height", 18)
    .append("rect")
    .attr("width", 18)
    .attr("height", 18)
    .style("fill", "lightgray");

noDataLegend.append("text")
    .style("margin-left", "5px") // Add space between the color block and the text
    .text("No Data");


Promise.all([
    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"),
    d3.csv("data_updated.csv")
]).then(function([json, data]) {
    // Filter out Antarctica
    json.features = json.features.filter(function(d) {
        return d.properties.name !== "Antarctica";
    });

    function updateMap(selectedYear) {
        var yearData = data.filter(d => +d.year === selectedYear);
        var lifeExpectancyLookup = new Map(yearData.map(d => [d.country, parseFloat(d['Total-population-at-birth'])]));

        json.features.forEach(function(feature) {
            var lifeExpectancy = lifeExpectancyLookup.get(feature.properties.name);
            feature.properties.Value = lifeExpectancy || null; // Set to null if not found
        });

        color.domain([
            65, 70, 71, 75, 76, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88
        ]);

        var paths = g.selectAll("path")
                     .data(json.features);

        paths.enter()
             .append("path")
             .merge(paths)
             .attr("d", path)
             .transition()
             .duration(500)
             .attr("fill", d => d.properties.Value === null ? "lightgray" : color(d.properties.Value))
             .attr("stroke-width", 0);

        paths.on("mouseover", function(event, d) {
                tooltip.transition().duration(200).style("opacity", .9);
                tooltip.html(d.properties.name + "<br/>" + (d.properties.Value === null ? "No Data" : d.properties.Value))
                       .style("left", (event.pageX + 5) + "px")
                       .style("top", (event.pageY - 28) + "px");

                d3.selectAll("path").classed("dimmed", true); // Dim all countries
                d3.select(this).classed("dimmed", false).attr("stroke-width", 1.0).attr("stroke", "Black"); // Highlight hovered country
            })
            .on("mouseout", function(d) {
                tooltip.transition().duration(500).style("opacity", 0);

                d3.selectAll("path").classed("dimmed", false); // Remove dimming
                d3.select(this).attr("stroke-width", 0);
            })
            .on("click", function(event, d) {
                // Send message to parent window to update other charts
                window.parent.postMessage({ type: 'updateCountry', country: d.properties.name }, '*');
            });

        paths.exit().remove();
    }

    var initialYear = 2010;
    updateMap(initialYear); // Initially load the map with the first year

    window.addEventListener('message', function(event) {
        if (event.data.type === 'updateYear') {
            updateMap(event.data.year);
        }
    });
});
