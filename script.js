document.addEventListener('DOMContentLoaded', function() {
    const yearFilter = d3.select("#year-filter");

    const years = Array.from({length: 13}, (v, i) => 2010 + i); // Generating years from 2010 to 2022

    years.forEach(year => {
        yearFilter.append("button")
            .text(year)
            .attr("data-year", year)
            .on("click", function() {
                d3.selectAll(".year-filter button").classed("selected", false);
                d3.select(this).classed("selected", true);
                updateYear(year);
            });
    });

    function updateYear(year) {
        // Update the choropleth map, bar chart, and line graph with the selected year
        document.getElementById('choropleth-iframe').contentWindow.postMessage({ type: 'updateYear', year: year }, '*');
        document.getElementById('bar-iframe').contentWindow.postMessage({ type: 'updateYear', year: year }, '*');
        document.getElementById('line-iframe').contentWindow.postMessage({ type: 'updateYear', year: year }, '*');
    }

    window.addEventListener('message', function(event) {
        if (event.data.type === 'updateCountry') {
            // Update the bar chart and line graph with the selected country
            const country = event.data.country;
            document.getElementById('bar-iframe').contentWindow.postMessage({ type: 'updateCountry', country: country }, '*');
            document.getElementById('line-iframe').contentWindow.postMessage({ type: 'updateCountry', country: country }, '*');
        }
    });

    function resizeIframes() {
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(iframe => {
            iframe.style.height = `${window.innerHeight * 0.7}px`;
        });
    }

    window.addEventListener('resize', resizeIframes);
    window.addEventListener('load', resizeIframes);
});
