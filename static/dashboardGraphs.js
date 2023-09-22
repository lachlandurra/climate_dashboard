const svgParams = {
    width: 600,
    height: 500,
    margin: {top: 130, right: 20, bottom: 130, left: 70},
    subgroups: ['co2_solar', 'other_emissions', 'total_emissions'],
    color: d3.scaleOrdinal().domain(['co2_solar', 'other_emissions', 'total_emissions']).range(['#e41a1c','#377eb8', '#4daf4a'])
};

function createSVG(containerId) {
    let svg = d3.select(containerId)
        .append("svg")
        .attr("width", svgParams.width)
        .attr("height", svgParams.height)
        .append("g")
        .attr("transform", `translate(${svgParams.margin.left},${svgParams.margin.top})`);

    applyFontStyles(svg);

    return svg;
}


function createTitle(svg, title) {
    svg.append("text")
        .attr("x", svgParams.width / 2 - 40)
        .attr("y", -svgParams.margin.top + 40)
        .attr("text-anchor", "middle")
        .attr("font-size", "20px")
        .attr("font-weight", "bold")
        .text(title);
    applyFontStyles(svg);

}

function createLegend(svg, width, subgroups) {
    const legend = svg.selectAll("legendGroup")
        .data(subgroups)
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
        .text(d => {
            switch(d) {
                case 'co2_solar':
                    return "Solar PV Emissions";
                case 'other_emissions':
                    return "Other Emissions";
                case 'total_emissions':
                    return "Total Emissions";
                default:
                    return d;
            }
        });
    applyFontStyles(svg);

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

        createLegend(svg, svgParams.width - svgParams.margin.left - svgParams.margin.right, subgroups);
    applyFontStyles(svg);

}

function createCostSavingsGraph(data, containerId, titleText) {
    const svgParams = { 
        width: 500, 
        height: 300, 
        margin: {top: 30, right: 30, bottom: 120, left: 60}
    };

    const svg = d3.select(containerId)
        .append("svg")
            .attr("width", svgParams.width)
            .attr("height", svgParams.height)
        .append("g")
            .attr("transform", `translate(${svgParams.margin.left},${svgParams.margin.top})`);

    // Create X axis
    const x = d3.scaleBand()
        .range([0, svgParams.width - svgParams.margin.left - svgParams.margin.right])
        .domain(data.map(d => d.name))
        .padding(0.2);
    
    svg.append("g")
        .attr("transform", `translate(0,${svgParams.height - svgParams.margin.top - svgParams.margin.bottom})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end");

    // Add Y axis
    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.cost_savings)])
        .range([svgParams.height - svgParams.margin.top - svgParams.margin.bottom, 0]);
    svg.append("g")
        .call(d3.axisLeft(y));

    // Create bars
    svg.selectAll("bars")
        .data(data)
        .enter().append("rect")
        .attr("x", d => x(d.name))
        .attr("y", d => y(d.cost_savings))
        .attr("width", x.bandwidth())
        .attr("height", d => svgParams.height - svgParams.margin.top - svgParams.margin.bottom - y(d.cost_savings))
        .attr("fill", "#69b3a2");

    // Add title
    svg.append("text")
        .attr("x", (svgParams.width - svgParams.margin.left - svgParams.margin.right) / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .text(titleText);
    applyFontStyles(svg);
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

function createTop5CouncilTotalEmissionsGraph(data) {
    createGraph(data, "#top5CouncilTotalEmissions", "Top 5 Council Facilities by Total Emissions", "Facility");
}

function createTop5LocalBusinessTotalEmissionsGraph(data) {
    createGraph(data, "#top5LocalBusinessTotalEmissions", "Top 5 Local Businesses by Total Emissions", "Facility");
}

function createTop5CouncilSolarPVEmissionsGraph(data) {
    createGraph(data, "#top5CouncilSolarPVEmissions", "Top 5 Council Facilities by Solar PV Emissions", "Facility");
}

function createTop5LocalBusinessSolarPVEmissionsGraph(data) {
    createGraph(data, "#top5LocalBusinessSolarPVEmissions", "Top 5 Local Businesses by Solar PV Emissions", "Facility");
}

function createTop5CouncilOtherEmissionsGraph(data) {
    createGraph(data, "#top5CouncilOtherEmissions", "Top 5 Council Facilities by Other Emissions", "Facility");
}

function createTop5LocalBusinessOtherEmissionsGraph(data) {
    createGraph(data, "#top5LocalBusinessOtherEmissions", "Top 5 Local Businesses by Other Emissions", "Facility");
}

function createTop5CostSavingsGraph(data) {
    const sortedData = data.sort((a, b) => b.cost_savings - a.cost_savings).slice(0, 5);
    createCostSavingsGraph(sortedData, "#top5CostSavings", "Top 5 Facilities by Cost Savings");
}

function createBottom5CostSavingsGraph(data) {
    const sortedData = data.sort((a, b) => a.cost_savings - b.cost_savings).slice(0, 5);
    createCostSavingsGraph(sortedData, "#bottom5CostSavings", "Bottom 5 Facilities by Cost Savings");
}

function applyFontStyles(svg) {
    svg.selectAll("text")
        .style("font-family", "'Montserrat', sans-serif")
        .style("font-weight", "600");
}


document.addEventListener('DOMContentLoaded', function() {
    fetch('/api/emissions_by_reporting_period')
        .then(response => response.json())
        .then(data => createEmissionsByReportingPeriodGraph(data));

    fetch('/api/emissions_by_council_and_business')
        .then(response => response.json())
        .then(data => createEmissionsByCouncilAndBusinessGraph(data));

        fetch('/api/top5_council_facilities_by_total_emissions')
        .then(response => response.json())
        .then(data => createTop5CouncilTotalEmissionsGraph(data));

    fetch('/api/top5_local_businesses_by_total_emissions')
        .then(response => response.json())
        .then(data => createTop5LocalBusinessTotalEmissionsGraph(data));

    fetch('/api/top5_council_facilities_by_solar_pv')
        .then(response => response.json())
        .then(data => createTop5CouncilSolarPVEmissionsGraph(data));

    fetch('/api/top5_local_businesses_by_solar_pv')
        .then(response => response.json())
        .then(data => createTop5LocalBusinessSolarPVEmissionsGraph(data));

    fetch('/api/top5_council_facilities_by_other_emissions')
        .then(response => response.json())
        .then(data => createTop5CouncilOtherEmissionsGraph(data));

    fetch('/api/top5_local_businesses_by_other_emissions')
        .then(response => response.json())
        .then(data => createTop5LocalBusinessOtherEmissionsGraph(data));

    fetch('/api/top5_facilities_by_cost_savings')
        .then(response => response.json())
        .then(data => createTop5CostSavingsGraph(data));

    fetch('/api/bottom5_facilities_by_cost_savings')
        .then(response => response.json())
        .then(data => createBottom5CostSavingsGraph(data));
});
