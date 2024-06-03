// Load the data from the CSV file
d3.csv("data.csv").then(function(data) {
    // Parse the CSV data
    data.forEach(function(d) {
        d.year = +d.year;
        d["Total-population-at-birth"] = +d["Total-population-at-birth"];
    });

    // Create a dropdown for countries
    const countries = [...new Set(data.map(d => d.country))];
    const select = d3.select("#country-select")
        .on("change", updateChart)
        .selectAll("option")
        .data(countries)
        .enter().append("option")
            .text(d => d)
            .attr("value", d => d);

    // Initial chart setup
    const margin = {top: 20, right: 20, bottom: 30, left: 50},
          width = 960 - margin.left - margin.right,
          height = 500 - margin.top - margin.bottom;

    const svg = d3.select("#chart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    const x = d3.scaleLinear().range([0, width]);
    const y = d3.scaleLinear().range([height, 0]);

    const xAxis = d3.axisBottom(x).tickFormat(d3.format("d"));
    const yAxis = d3.axisLeft(y);

    const line = d3.line()
        .x(d => x(d.year))
        .y(d => y(d["Total-population-at-birth"]));

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")");

    svg.append("g")
        .attr("class", "y axis");

    // Function to update the chart
    function updateChart() {
        const selectedCountry = select.node().value;
        const filteredData = data.filter(d => d.country === selectedCountry);

        x.domain(d3.extent(filteredData, d => d.year));
        y.domain([0, d3.max(filteredData, d => d["Total-population-at-birth"])]);

        svg.select(".x.axis").call(xAxis);
        svg.select(".y.axis").call(yAxis);

        svg.selectAll(".line").remove();
        svg.append("path")
            .datum(filteredData)
            .attr("class", "line")
            .attr("d", line);
    }

    // Initial update
    updateChart();
}).catch(function(error) {
    console.error('Error loading the CSV file:', error);
});
