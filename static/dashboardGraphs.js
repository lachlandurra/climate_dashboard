const svgParams = {
    width: 600,
    height: 500,
    margin: {top: 130, right: 20, bottom: 130, left: 70},
    subgroups: ['co2_solar', 'other_emissions'],
    color: d3.scaleOrdinal().domain(['co2_solar', 'other_emissions']).range(['#e41a1c','#377eb8'])
};

function createSVG(containerId) {
    return d3.select(containerId)
        .append("svg")
        .attr("width", svgParams.width)
        .attr("height", svgParams.height)
        .append("g")
        .attr("transform", `translate(${svgParams.margin.left},${svgParams.margin.top})`);
}

function createTitle(svg, title) {
    svg.append("text")
        .attr("x", svgParams.width / 2 - 40)
        .attr("y", -svgParams.margin.top + 40)
        .attr("text-anchor", "middle")
        .attr("font-size", "20px")
        .attr("font-weight", "bold")
        .text(title);
}

function createLegend(svg, width) {
    const legend = svg.selectAll("legendGroup")
        .data(svgParams.subgroups)
        .enter().append("g")
            .attr("transform", (d, i) => `translate(0,${i * 20 - svgParams.margin.top/2})`);

    legend.append("rect")
        .attr("x", 0)
        .attr("width", 19)
        .attr("height", 19)
        .attr("fill", svgParams.color);

    legend.append("text")
        .attr("x", 24)
        .attr("y", 9.5)
        .attr("dy", "0.32em")
        .text(d => d === 'co2_solar' ? "Solar PV Emissions" : "Other Emissions");
}

function setupBars(svg, x, y, xSubgroup, data) {
    svg.append("g")
        .selectAll("g")
        .data(data)
        .enter()
        .append("g")
        .attr("transform", d => `translate(${x(d.name ? d.name : `${d.start_month} ${d.start_year} - ${d.end_month} ${d.end_year}`)},0)`)
        .selectAll("rect")
        .data(d => svgParams.subgroups.map(key => ({key: key, value: d[key]})))
        .enter().append("rect")
            .attr("x", d => xSubgroup(d.key))
            .attr("y", d => y(d.value))
            .attr("width", xSubgroup.bandwidth())
            .attr("height", d => svgParams.height - y(d.value) - svgParams.margin.top - svgParams.margin.bottom)
            .attr("fill", d => svgParams.color(d.key));
}

function createGraph(data, containerId, titleText, xLabel) {
    const svg = createSVG(containerId);
    createTitle(svg, titleText);

    const groups = data.map(d => d.name ? d.name : `${d.start_month} ${d.start_year} - ${d.end_month} ${d.end_year}`);

    const x = d3.scaleBand()
        .domain(groups)
        .range([0, svgParams.width - svgParams.margin.left - svgParams.margin.right])
        .padding([0.2]);

    // Check if 'total_emissions' exists in the data
    const hasTotalEmissions = data.some(d => d.total_emissions !== undefined);
    const subgroups = hasTotalEmissions ? ['co2_solar', 'other_emissions', 'total_emissions'] : ['co2_solar', 'other_emissions'];

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => {
            const values = [d.co2_solar, d.other_emissions];
            if (hasTotalEmissions) values.push(d.total_emissions);
            return Math.max(...values);
        })])
        .range([svgParams.height - svgParams.margin.top - svgParams.margin.bottom, 0]);

    const xSubgroup = d3.scaleBand()
        .domain(subgroups)
        .range([0, x.bandwidth()])
        .padding([0.05]);

    setupBars(svg, x, y, xSubgroup, data);

    // X-axis
    svg.append("g")
        .attr("transform", `translate(0,${svgParams.height - svgParams.margin.top - svgParams.margin.bottom})`)
        .call(d3.axisBottom(x).tickSize(0))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-65)");

    // X-axis label
    svg.append("text")
        .attr("x", svgParams.width / 2)
        .attr("y", svgParams.height - svgParams.margin.top + 40)
        .style("text-anchor", "middle")
        .text(xLabel);

    // Y-axis
    svg.append("g")
        .call(d3.axisLeft(y));

    // Y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -svgParams.margin.left + 10)
        .attr("x", -(svgParams.height - svgParams.margin.top - svgParams.margin.bottom) / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("fill", "black")
        .style("font-size", "14px")
        .text("Emissions");

    createLegend(svg, svgParams.width - svgParams.margin.left - svgParams.margin.right);
}

function createEmissionsByReportingPeriodGraph(data) {
    createGraph(data, "#emissionsByPeriod", "Emissions by Reporting Period", "Reporting Period");
}

function createEmissionsByCouncilAndBusinessGraph(data) {
    const aggregatedData = data.reduce((acc, report) => {
        if (report.type === 'council facility') {
            acc[0].co2_solar += report.co2_solar;
            acc[0].other_emissions += report.other_emissions;
        } else if (report.type === 'local business') {
            acc[1].co2_solar += report.co2_solar;
            acc[1].other_emissions += report.other_emissions;
        }
        return acc;
    }, [
        { name: 'Council Facilities', co2_solar: 0, other_emissions: 0 },
        { name: 'Local Businesses', co2_solar: 0, other_emissions: 0 }
    ]);

    createGraph(aggregatedData, "#emissionsByCouncilAndBusiness", "Emissions by Council and Local Businesses", "Council and Local Businesses");
}

function createTop5TotalEmissionsGraph(data) {
    // Assuming that the 'createGraph' function accepts data in a certain format.
    // You might need to adjust the below transformation according to your graphing library.
    const transformedData = data.map(entry => {
        return {
            name: entry.name,
            co2_solar: entry.co2_solar,
            other_emissions: entry.other_emissions,
            total_emissions: entry.total_emissions
        };
    });

    const sortedData = transformedData.sort((a, b) => b.total_emissions - a.total_emissions).slice(0, 5);

    // The createGraph function will need to handle the plotting of three bars.
    // I'm providing a general call here, but you will likely need to adjust it depending on your library.
    createGraph(sortedData, "#top5TotalEmissions", "Top 5 Facilities by Total Emissions", "Facility");
}


function createTop5SolarPVEmissionsGraph(data) {
    const sortedData = data.sort((a, b) => b.co2_solar - a.co2_solar).slice(0, 5);
    createGraph(sortedData, "#top5SolarPVEmissions", "Top 5 Facilities by Solar PV Emissions", "Facility");
}

function createTop5OtherEmissionsGraph(data) {
    const sortedData = data.sort((a, b) => b.other_emissions - a.other_emissions).slice(0, 5);
    createGraph(sortedData, "#top5OtherEmissions", "Top 5 Facilities by Other Emissions", "Facility");
}

function createTop5CostSavingsGraph(data) {
    const sortedData = data.sort((a, b) => b.cost_savings - a.cost_savings).slice(0, 5);
    createGraph(sortedData, "#top5CostSavings", "Top 5 Facilities by Cost Savings", "Facility");
}

function createBottom5CostSavingsGraph(data) {
    const sortedData = data.sort((a, b) => a.cost_savings - b.cost_savings).slice(0, 5);
    createGraph(sortedData, "#bottom5CostSavings", "Bottom 5 Facilities by Cost Savings", "Facility");
}

function createPieChartOfCostSavings(data) {
    // Assuming you want a pie chart that shows the cost savings of each facility
    const svg = createSVG("#pieChartCostSavings");
    createTitle(svg, "Pie Chart of Cost Savings by Facility");

    const pie = d3.pie().value(d => d.cost_savings);
    const arc = d3.arc().innerRadius(0).outerRadius(Math.min(svgParams.width, svgParams.height) / 2 - 40);

    const arcs = svg.selectAll(".arc")
        .data(pie(data))
        .enter().append("g")
        .attr("class", "arc");

    arcs.append("path")
        .attr("d", arc)
        .attr("fill", (d, i) => d3.interpolateRainbow(i / data.length));

    arcs.append("text")
        .attr("transform", d => `translate(${arc.centroid(d)})`)
        .attr("dy", ".35em")
        .style("text-anchor", "middle")
        .text(d => d.data.name); // Display facility name
}


document.addEventListener('DOMContentLoaded', function() {
    fetch('/api/emissions_by_reporting_period')
        .then(response => response.json())
        .then(data => createEmissionsByReportingPeriodGraph(data));

    fetch('/api/emissions_by_council_and_business')
        .then(response => response.json())
        .then(data => createEmissionsByCouncilAndBusinessGraph(data));

    fetch('/api/top5_total_emissions')
        .then(response => response.json())
        .then(data => createTop5TotalEmissionsGraph(data));

    fetch('/api/top5_solar_pv_emissions')
        .then(response => response.json())
        .then(data => createTop5SolarPVEmissionsGraph(data));

    fetch('/api/top5_facilities_by_other_emissions')
        .then(response => response.json())
        .then(data => createTop5OtherEmissionsGraph(data));

    fetch('/api/top5_facilities_by_cost_savings')
        .then(response => response.json())
        .then(data => createTop5CostSavingsGraph(data));

    fetch('/api/bottom5_facilities_by_cost_savings')
        .then(response => response.json())
        .then(data => createBottom5CostSavingsGraph(data));

    fetch('/api/pie_chart_cost_savings')
        .then(response => response.json())
        .then(data => createPieChartOfCostSavings(data));
});
