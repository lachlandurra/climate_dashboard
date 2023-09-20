// Emissions By Reporting Period Graph Logic
// Emissions By Reporting Period Graph Logic
function createEmissionsByReportingPeriodGraph(data) {
    const svgWidth = 600, svgHeight = 450;  // Increased the svgHeight to make space for the graph title
    const margin = {top: 40, right: 20, bottom: 100, left: 70};
    const width = svgWidth - margin.left - margin.right;
    const height = svgHeight - margin.top - margin.bottom;

    const svg = d3.select("#emissionsByPeriod")
                  .append("svg")
                  .attr("width", svgWidth)
                  .attr("height", svgHeight);

    const subgroups = ['co2_solar', 'other_emissions'];
    const groups = data.map(d => `${d.start_month} ${d.start_year} - ${d.end_month} ${d.end_year}`);

    const x = d3.scaleBand()
                .domain(groups)
                .range([0, width])
                .padding([0.2]);

    const y = d3.scaleLinear()
                .domain([0, d3.max(data, d => Math.max(d.co2_solar, d.other_emissions))])
                .range([height, 0]);

    const xSubgroup = d3.scaleBand()
                        .domain(subgroups)
                        .range([0, x.bandwidth()])
                        .padding([0.05]);

    const color = d3.scaleOrdinal()
                    .domain(subgroups)
                    .range(['#e41a1c','#377eb8']);

    const g = svg.append("g")
                 .attr("transform", `translate(${margin.left},${margin.top})`);

    // Graph title
    svg.append("text")
       .attr("x", svgWidth / 2)
       .attr("y", 10)
       .attr("text-anchor", "middle")
       .attr("font-size", "20px")
       .attr("font-weight", "bold")
       .text("Emissions by Reporting Period");

    // Add the bars
    g.append("g")
     .selectAll("g")
     .data(data)
     .enter()
     .append("g")
       .attr("transform", d => `translate(${x(`${d.start_month} ${d.start_year} - ${d.end_month} ${d.end_year}`)},0)`)
     .selectAll("rect")
     .data(d => subgroups.map(key => ({key: key, value: d[key]})))
     .enter().append("rect")
       .attr("x", d => xSubgroup(d.key))
       .attr("y", d => y(d.value))
       .attr("width", xSubgroup.bandwidth())
       .attr("height", d => height - y(d.value))
       .attr("fill", d => color(d.key));

       svg.append("g")
       .attr("transform", "translate(" + margin.left + "," + (height + margin.top) + ")")
       .call(d3.axisBottom(x).tickSize(0))
       .selectAll("text")  
       .style("text-anchor", "end")
       .attr("dx", "-.8em")
       .attr("dy", ".15em")
       .attr("transform", "rotate(-65)");

    // X-axis
    svg.append("text")
        .attr("x", svgWidth / 2)
        .attr("y", height + margin.top + 40)
        .style("text-anchor", "middle")
        .text("Reporting Period");

    // Y-axis
    svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .call(d3.axisLeft(y));

    // Y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", margin.left - 60) // Increased distance from the left edge
        .attr("x", -(height / 2)-20)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("fill", "black") // Set the font color to black
        .style("font-size", "14px") // Set the font size
        .text("Emissions");
        
    // Add a legend
    const legend = svg.append("g")
                    .attr("font-family", "sans-serif")
                    .attr("font-size", 10)
                    .attr("text-anchor", "end")
                    .selectAll("g")
                    .data(subgroups)
                    .enter().append("g")
                        .attr("transform", (d, i) => `translate(0,${i * 20 + 10})`); // Added 5 to the y-axis position to lower the legend slightly

    legend.append("rect")
        .attr("x", width - 19)
        .attr("width", 19)
        .attr("height", 19)
        .attr("fill", color);

    legend.append("text")
        .attr("x", width - 24)
        .attr("y", 9.5)
        .attr("dy", "0.32em")
        .text(d => d === 'co2_solar' ? "Solar PV Emissions" : "Other Emissions");

}


// Emissions By Council And Local Businesses Graph Logic
function createEmissionsByCouncilAndBusinessGraph(data) {
    // Aggregate the data
    let councilEmissions = {
        co2_solar: 0,
        other_emissions: 0
    };

    let businessEmissions = {
        co2_solar: 0,
        other_emissions: 0
    };

    for (let report of data) {
        if (report.type === 'council facility') {
            councilEmissions.co2_solar += report.co2_solar;
            councilEmissions.other_emissions += report.other_emissions;
        } else if (report.type === 'local business') {
            businessEmissions.co2_solar += report.co2_solar;
            businessEmissions.other_emissions += report.other_emissions;
        }
    }

    const aggregatedData = [
        { name: 'Council Facilities', ...councilEmissions },
        { name: 'Local Businesses', ...businessEmissions }
    ];
    data = aggregatedData;
    
    const svgWidth = 600, svgHeight = 450;
    const margin = {top: 40, right: 20, bottom: 100, left: 70};
    const width = svgWidth - margin.left - margin.right;
    const height = svgHeight - margin.top - margin.bottom;

    const svg = d3.select("#emissionsByCouncilAndBusiness")
                  .append("svg")
                  .attr("width", svgWidth)
                  .attr("height", svgHeight);

    const subgroups = ['co2_solar', 'other_emissions'];
    const groups = data.map(d => d.name);

    const x = d3.scaleBand()
                .domain(groups)
                .range([0, width])
                .padding([0.2]);

    const y = d3.scaleLinear()
                .domain([0, d3.max(data, d => Math.max(d.co2_solar, d.other_emissions))])
                .range([height, 0]);

    const xSubgroup = d3.scaleBand()
                        .domain(subgroups)
                        .range([0, x.bandwidth()])
                        .padding([0.05]);

    const color = d3.scaleOrdinal()
                    .domain(subgroups)
                    .range(['#e41a1c','#377eb8']);

    const g = svg.append("g")
                 .attr("transform", `translate(${margin.left},${margin.top})`);

    // Graph title
    svg.append("text")
       .attr("x", svgWidth / 2)
       .attr("y", 10)
       .attr("text-anchor", "middle")
       .attr("font-size", "20px")
       .attr("font-weight", "bold")
       .text("Emissions by Council and Local Businesses");

    // Add the bars
    g.append("g")
     .selectAll("g")
     .data(data)
     .enter()
     .append("g")
       .attr("transform", d => `translate(${x(d.name)},0)`)
     .selectAll("rect")
     .data(d => subgroups.map(key => ({key: key, value: d[key]})))
     .enter().append("rect")
       .attr("x", d => xSubgroup(d.key))
       .attr("y", d => y(d.value))
       .attr("width", xSubgroup.bandwidth())
       .attr("height", d => height - y(d.value))
       .attr("fill", d => color(d.key));

    svg.append("g")
       .attr("transform", "translate(" + margin.left + "," + (height + margin.top) + ")")
       .call(d3.axisBottom(x).tickSize(0))
       .selectAll("text")  
       .style("text-anchor", "end")
       .attr("dx", "-.8em")
       .attr("dy", ".90em")

    // X-axis label
    svg.append("text")
        .attr("x", svgWidth / 2)
        .attr("y", height + margin.top + 40)
        .style("text-anchor", "middle")
        .text("Council and Local Businesses");

    // Y-axis
    svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .call(d3.axisLeft(y));

    // Y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", margin.left - 60)
        .attr("x", -(height / 2)-20)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("fill", "black")
        .style("font-size", "14px")
        .text("Emissions");

    // Add a legend
    const legend = svg.append("g")
                    .attr("font-family", "sans-serif")
                    .attr("font-size", 10)
                    .attr("text-anchor", "end")
                    .selectAll("g")
                    .data(subgroups)
                    .enter().append("g")
                        .attr("transform", (d, i) => `translate(0,${i * 20 + 10})`);

    legend.append("rect")
        .attr("x", width - 19)
        .attr("width", 19)
        .attr("height", 19)
        .attr("fill", color);

    legend.append("text")
        .attr("x", width - 24)
        .attr("y", 9.5)
        .attr("dy", "0.32em")
        .text(d => d === 'co2_solar' ? "Solar PV Emissions" : "Other Emissions");
}



document.addEventListener('DOMContentLoaded', function() {
    // Fetch data for the first graph
    fetch('/api/emissions_by_reporting_period')
    .then(response => response.json())
    .then(data => createEmissionsByReportingPeriodGraph(data));
    
    // Fetch data for the second graph (assuming an endpoint is available)
    fetch('/api/emissions_by_council_and_business')
    .then(response => response.json())
    .then(data => createEmissionsByCouncilAndBusinessGraph(data));
});
