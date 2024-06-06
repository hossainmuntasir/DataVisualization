// Set the dimensions and margins of the graph
const margin = { top: 60, right: 100, bottom: 50, left: 50 },
      width = 600 - margin.left - margin.right, // Adjust width to fit within iframe
      height = 450 - margin.top - margin.bottom; // Adjust height to avoid scrolling

// Append the svg object to the body of the page
const svg = d3.select("#my_dataviz")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Add a title
const title = svg.append("text")
    .attr("class", "title")
    .attr("x", width / 2)
    .attr("y", -20)
    .attr("text-anchor", "middle");

const xLabel = svg.append("text")
    .attr("class", "x label")
    .attr("text-anchor", "middle")
    .attr("x", width / 2)
    .attr("y", height + 40)
    .text("Age Group");

const yLabel = svg.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -40)
    .text("Life Expectancy");

const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", "translate(" + (width + 20) + ", 0)");

legend.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 18)
    .attr("height", 18)
    .style("fill", "#f77");

legend.append("text")
    .attr("x", 24)
    .attr("y", 9)
    .attr("dy", ".35em")
    .text("Female");

legend.append("rect")
    .attr("x", 0)
    .attr("y", 20)
    .attr("width", 18)
    .attr("height", 18)
    .style("fill", "#77f");

legend.append("text")
    .attr("x", 24)
    .attr("y", 29)
    .attr("dy", ".35em")
    .text("Male");

// Load the data
d3.csv("data_updated.csv").then(function(data) {
    let selectedYear = 2010; // Default year
    let selectedCountry = "Australia"; // Default country

    const tooltip = d3.select("#tooltip");

    function updateChart() {
        const filteredData = data.filter(d => d.year == selectedYear && d.country == selectedCountry)[0];

        const ageGroups = ['birth', '40', '60', '65', '80'];
        const categories = ageGroups.map(group => {
            return [
                { name: 'Female', value: parseFloat(filteredData[`Females-at-age-${group}`]), ageGroup: group },
                { name: 'Male', value: parseFloat(filteredData[`Males-at-age-${group}`]), ageGroup: group }
            ];
        }).flat();

        // Remove previous axes
        svg.selectAll(".x-axis").remove();
        svg.selectAll(".y-axis").remove();

        const x0 = d3.scaleBand()
            .range([0, width])
            .domain(ageGroups)
            .padding(0.1);

        const x1 = d3.scaleBand()
            .domain(['Female', 'Male'])
            .range([0, x0.bandwidth()])
            .padding(0.05);

        const y = d3.scaleLinear()
            .domain([0, d3.max(categories, d => d.value)+3])
            .range([height, 0]);

        svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x0));

        svg.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(y));

        // Update the title
        title.text(`Life Expectancy in ${selectedCountry} for ${selectedYear}`);

        // Bind data
        const ageGroup = svg.selectAll(".ageGroup")
            .data(ageGroups, d => d);

        const ageGroupEnter = ageGroup.enter()
            .append("g")
            .attr("class", "ageGroup")
            .attr("transform", d => `translate(${x0(d)}, 0)`);

        ageGroupEnter.merge(ageGroup)
            .selectAll("rect")
            .data(d => [
                {name: 'Female', value: filteredData[`Females-at-age-${d}`], ageGroup: d},
                {name: 'Male', value: filteredData[`Males-at-age-${d}`], ageGroup: d}
            ])
            .join("rect")
            .attr("x", d => x1(d.name))
            .attr("width", x1.bandwidth())
            .transition()
            .duration(1000)
            .attr("y", d => y(d.value))
            .attr("height", d => height - y(d.value))
            .attr("fill", d => d.name === 'Female' ? '#f77' : '#77f')
            .ease(d3.easeLinear);

        ageGroupEnter.merge(ageGroup)
            .selectAll("rect")
            .on("mouseover", function(event, d) {
                tooltip.transition().duration(200).style("opacity", .9);
                tooltip.html(`Gender: ${d.name}<br>Value: ${d.value}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
                d3.select(this).attr("fill", "orange");
            })
            .on("mouseout", function(d) {
                tooltip.transition().duration(500).style("opacity", 0);
                d3.select(this).attr("fill", d => d.name === 'Female' ? '#f77' : '#77f');
            });

        ageGroup.exit().remove();
    }

    updateChart(); // Initial render

    window.addEventListener('message', function(event) {
        if (event.data.type === 'updateYear') {
            selectedYear = event.data.year;
            updateChart();
        }
        if (event.data.type === 'updateCountry') {
            selectedCountry = event.data.country;
            updateChart();
        }
    });
});
