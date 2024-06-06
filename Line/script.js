// Set the dimensions and margins of the graph
const margin = {top: 50, right: 150, bottom: 50, left: 60},
    width = 860 - margin.left - margin.right,
    height = 440 - margin.top - margin.bottom;

// Append the svg object to the body of the page
const svg = d3.select("#my_dataviz")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

// Add chart title
svg.append("text")
    .attr("x", width / 2)
    .attr("y", -20)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("Life Expectancy by Year for Selected Countries");

// Add X axis label
svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 10)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .text("Year");

// Add Y axis label
svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -margin.left + 20)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .text("Life Expectancy (Years)");

// Add tooltip
const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background-color", "lightsteelblue")
    .style("padding", "5px")
    .style("border-radius", "5px")
    .style("pointer-events", "none")
    .style("opacity", 0);

// Read the data
d3.csv("data_updated.csv").then(function(data) {

    // List of groups (here I have one group per column)
    const allGroup = new Set(data.map(d => d.country));

    // Add the options to the button
    d3.selectAll("select")
      .selectAll('myOptions')
         .data(Array.from(allGroup))
      .enter()
        .append('option')
      .text(function (d) { return d; }) // text shown in the menu
      .attr("value", function (d) { return d; }); // corresponding value returned by the button

    // A color scale: one color for each group
    const myColor = d3.scaleOrdinal()
      .domain(allGroup)
      .range(d3.schemeSet2);

    // Add X axis --> it is a date format
    const x = d3.scaleLinear()
      .domain(d3.extent(data, function(d) { return +d.year; }))
      .range([ 0, width ]);
    const xAxis = svg.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x).tickFormat(d3.format("d"))); // Updated to format years without commas

    // Add Y axis
    const y = d3.scaleLinear()
      .domain([d3.min(data, function(d) { return +d['Total-population-at-birth']; }) - 20, d3.max(data, function(d) { return +d['Total-population-at-birth']; }) + 20])
      .range([ height, 0 ]);
    const yAxis = svg.append("g")
      .call(d3.axisLeft(y));

    // Initialize lines
    const lineGenerator = d3.line()
      .x(function(d) { return x(+d.year) })
      .y(function(d) { return y(+d['Total-population-at-birth']) });

    let selectedCountries = ['Afghanistan', 'Afghanistan']; // Default countries

    let lines = svg.append('g')
      .selectAll('.line')
      .data(selectedCountries)
      .enter()
      .append("path")
        .attr("class", "line")
        .style("fill", "none")
        .style("stroke-width", 4)
        .attr("stroke", function(d){ return myColor(d); }) // Correctly assign colors here
        .datum(function(d) { return data.filter(function(db){ return db.country == d; }); })
        .attr("d", lineGenerator);

    // Add legend
    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width + 20}, 0)`);

    function updateLegend() {
        legend.selectAll("*").remove();
        d3.selectAll("select").each(function(d, i) {
            const country = d3.select(this).property("value");
            legend.append("rect")
                .attr("x", 0)
                .attr("y", i * 20)
                .attr("width", 18)
                .attr("height", 18)
                .style("fill", myColor(country));
            legend.append("text")
                .attr("x", 24)
                .attr("y", i * 20 + 9)
                .attr("dy", ".35em")
                .text(country);
        });
    }

    updateLegend();

    // A function that updates the chart
    function update(selectedGroup, index) {
        selectedCountries[index] = selectedGroup;
        const allSelectedData = data.filter(d => selectedCountries.includes(d.country));

        // Update the x-axis domain
        x.domain(d3.extent(allSelectedData, function(d) { return +d.year; }));
        xAxis.transition().duration(1000).call(d3.axisBottom(x).tickFormat(d3.format("d"))); // Updated to format years without commas

        // Calculate y-axis domain and update
        const minY = d3.min(allSelectedData, function(d) { return +d['Total-population-at-birth']; });
        const maxY = d3.max(allSelectedData, function(d) { return +d['Total-population-at-birth']; });
        y.domain([minY - 10, maxY + 10]);
        yAxis.transition().duration(1000).call(d3.axisLeft(y));

        lines = svg.selectAll(".line")
            .data(selectedCountries)
            .join("path")
            .attr("class", "line")
            .style("fill", "none")
            .style("stroke-width", 4)
            .attr("stroke", function(d){ return myColor(d); }) // Correctly assign colors here
            .datum(function(d) { return data.filter(function(db) { return db.country == d; }); })
            .transition()
            .duration(1000)
            .attr("d", lineGenerator);

        updateLegend();
        addHoverEffect(); // Add hover effect after updating the chart
    }

    // When the button is changed, run the update function
    d3.selectAll("select").on("change", function(event, d) {
        const selectedOption = d3.select(this).property("value");
        const index = d3.select(this).attr("id") === "selectButton1" ? 0 : 1;
        update(selectedOption, index);
    });

    // Add country selection dropdown dynamically
    let selectCount = 2;
    d3.select("#addButton").on("click", function() {
        selectCount++;
        selectedCountries.push(Array.from(allGroup)[0]); // Default to first country
        const newSelect = d3.select(this.parentNode).insert("select", "#addButton")
            .attr("id", `selectButton${selectCount}`)
            .selectAll('myOptions')
            .data(Array.from(allGroup))
            .enter()
            .append('option')
            .text(function(d) { return d; })
            .attr("value", function(d) { return d; });

        // Add change event listener to the new dropdown
        d3.select(`#selectButton${selectCount}`).on("change", function(event, d) {
            const selectedOption = d3.select(this).property("value");
            update(selectedOption, selectCount - 1);
        });

        // Add new line to the chart
        lines = svg.selectAll(".line")
            .data(selectedCountries)
            .enter()
            .append("path")
            .attr("class", "line")
            .style("fill", "none")
            .style("stroke-width", 4)
            .attr("stroke", function(d){ return myColor(d); }) // Correctly assign colors here
            .datum(function(d) { return data.filter(function(db) { return db.country == d; }); })
            .attr("d", lineGenerator);

        updateLegend();

        // Show remove button if hidden
        d3.select("#removeButton").style("display", "inline-block");
    });

    // Remove country selection dropdown dynamically
    d3.select("#removeButton").on("click", function() {
        if (selectCount > 2) {
            d3.select(`#selectButton${selectCount}`).remove();
            selectedCountries.pop(); // Remove the last selected country
            d3.selectAll(".line").filter((d, i) => i === selectCount - 1).remove();
            selectCount--;

            updateLegend();

            // Hide remove button if only the initial dropdowns are left
            if (selectCount === 2) {
                d3.select("#removeButton").style("display", "none");
            }

            // Recalculate y-axis domain and update
            const allSelectedData = data.filter(d => selectedCountries.includes(d.country));
            const minY = d3.min(allSelectedData, function(d) { return +d['Total-population-at-birth']; });
            const maxY = d3.max(allSelectedData, function(d) { return +d['Total-population-at-birth']; });
            y.domain([minY - 10, maxY + 10]);
            yAxis.transition().duration(1000).call(d3.axisLeft(y));
        }
    });

    // Add hover effect
    function addHoverEffect() {
        svg.selectAll(".line")
            .on("mouseover", function(event, d) {
                const country = d[0].country;
                const year = d3.format(".0f")(x.invert(event.offsetX - margin.left));
                const value = y.invert(event.offsetY - margin.top).toFixed(2);
                tooltip.transition().duration(200).style("opacity", .9);
                tooltip.html(`${country}<br/>Year: ${year}<br/>Value: ${value}`)
                    .style("left", (event.pageX + 5) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mousemove", function(event, d) {
                const country = d[0].country;
                const year = d3.format(".0f")(x.invert(event.offsetX - margin.left));
                const value = y.invert(event.offsetY - margin.top).toFixed(2);
                tooltip.html(`${country}<br/>Year: ${year}<br/>Value: ${value}`)
                    .style("left", (event.pageX + 5) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function(d) {
                tooltip.transition().duration(500).style("opacity", 0);
            });
    }

    addHoverEffect(); // Initial call to add hover effect

});
