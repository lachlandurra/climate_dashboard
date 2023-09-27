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
        .attr("fill", d => svgParams.color(d));

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

function setupBars(barsGroup, x, y, xSubgroup, data, svg, xAxisGroup, yAxisGroup, groups) {
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    const parentGs = barsGroup.selectAll("g.parent")
        .data(data)
        .enter()
        .append("g")
        .classed("parent", true)
        .attr("transform", d => `translate(${x(d.name ? d.name : `${d.start_month} ${d.start_year} - ${d.end_month} ${d.end_year}`)},0)`);

    parentGs.selectAll("rect")
        .data(d => svgParams.subgroups.map(key => ({ key: key, value: d[key] })))
        .enter().append("rect")
        .attr("x", d => xSubgroup(d.key))
        .attr("y", d => y(d.value))
        .attr("width", xSubgroup.bandwidth())
        .attr("height", d => svgParams.height - y(d.value) - svgParams.margin.top - svgParams.margin.bottom)
        .attr("fill", d => svgParams.color(d.key))
        .on("mouseover", function(event, d) {
            d3.select(this)
                .transition()
                .duration(200)
                .attr('opacity', 0.6)
                .attr('y', d => y(d.value) - 5)  // Subtract 5 pixels from the Y position for a small animation
                .attr('height', d => svgParams.height - y(d.value) + 5 - svgParams.margin.top - svgParams.margin.bottom);  // Add 5 pixels to the height for a small animation                                   

            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            
            const tooltipWidth = 200;  // estimate or dynamically calculate
            const leftPosition = event.pageX + 10 + tooltipWidth > window.innerWidth ? event.pageX - tooltipWidth - 10 : event.pageX + 10;
            tooltip.html(getFriendlyLabel(d.key) + "<br>" + d.value.toLocaleString() + " tCo2e")
                .style("left", leftPosition + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mousemove", function(event, d) {
            const tooltipWidth = 200;  // estimate or dynamically calculate
            const leftPosition = event.pageX + 10 + tooltipWidth > window.innerWidth ? event.pageX - tooltipWidth - 10 : event.pageX + 10;
            tooltip.style("left", leftPosition + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function(d) {
            d3.select(this)
                .transition()
                .duration(200)
                .attr('opacity', 1)
                .attr('x', d => xSubgroup(d.key))
                .attr('width', xSubgroup.bandwidth())
                .attr("y", d => y(d.value))
                .attr("height", d => svgParams.height - y(d.value) - svgParams.margin.top - svgParams.margin.bottom);
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        })
        .style("pointer-events", "all");

    // Adding the zoom functionality
    // svg.call(d3.zoom()
    //     .filter(event => {
    //         // Ignore mousedown, allow everything else
    //         return !event.type.includes('mousedown');
    //     })
    //     .extent([[0, 0], [svgParams.width, svgParams.height]])
    //     .scaleExtent([1, 8])
    //     .on("start", function() {
    //         svg.select("rect").style("pointer-events", "all");
    //     })
    //     .on("zoom", function({ transform }) {
    //         // Apply the transform to the x scale's range
    //         const updatedX = x.range().map(d => transform.applyX(d));
    //         x.range(updatedX);
        
    //         // Update the X axis
    //         xAxisGroup.call(d3.axisBottom(x).tickSize(0))
    //             .selectAll("text")
    //             .style("text-anchor", "end")
    //             .attr("dx", "-.8em")
    //             .attr("dy", ".15em")
    //             .attr("transform", "rotate(-65)");
        
    //         // Adjust the bars according to the zoomed scale
    //         barsGroup.selectAll("g.parent")
    //             .attr("transform", d => `translate(${x(d.name ? d.name : `${d.start_month} ${d.start_year} - ${d.end_month} ${d.end_year}`)},0)`);
    //     })
        
    //     .on("end", function() {
    //         svg.select("rect").style("pointer-events", "none");
    //     }));

}

function createGraph(data, containerId, titleText, xLabel) {
    const svg = createSVG(containerId);
    const barsGroup = svg.append('g');
    const groups = data.map(d => d.name ? d.name : `${d.start_month} ${d.start_year} - ${d.end_month} ${d.end_year}`);
    const x = d3.scaleBand()
        .domain(groups)
        .range([0, svgParams.width - svgParams.margin.left - svgParams.margin.right])
        .padding([0.2]);
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
    
    const xAxisGroup = svg.append("g")
        .attr("transform", `translate(0,${svgParams.height - svgParams.margin.top - svgParams.margin.bottom})`);

    const yAxisGroup = svg.append("g");
    createTitle(svg, titleText);


    setupBars(barsGroup, x, y, xSubgroup, data, svg, xAxisGroup, yAxisGroup, groups);

    xAxisGroup.call(d3.axisBottom(x).tickSize(0))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-65)");

    svg.append("text")
        .attr("x", svgParams.width / 2)
        .attr("y", svgParams.height - svgParams.margin.top + 40)
        .style("text-anchor", "middle")
        .text(xLabel);

    yAxisGroup.call(d3.axisLeft(y));

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -svgParams.margin.left + 10)
        .attr("x", -(svgParams.height - svgParams.margin.top - svgParams.margin.bottom) / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("fill", "black")
        .style("font-size", "14px")
        .text("Emissions (tCo2e)");

    createLegend(svg, svgParams.width - svgParams.margin.left - svgParams.margin.right, subgroups);

    applyFontStyles(svg);

    svg.append("rect")
        .attr("width", svgParams.width)
        .attr("height", svgParams.height)
        .style("fill", "none")
        .style("pointer-events", "none");

}

function monthToNumber(monthString) {
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    return months.indexOf(monthString);
}

function createEmissionsOverTimeLineGraph(data, containerId, titleText, xLabel) {
    const svg = createSVG(containerId);
    const linesGroup = svg.append('g');

    function splitMultilineText(selection, delimiter) {
        selection.each(function() {
            const text = d3.select(this),
                parts = text.text().split(delimiter),
                y = text.attr("y"),
                dy = parseFloat(text.attr("dy") || 0) + 5;
    
            text.text(parts[0])
                .attr("y", y)
                .attr("dy", dy);
    
            for (let i = 1; i < parts.length; i++) {
                text.append("tspan")
                    .text(parts[i])
                    .attr("x", 0)
                    .attr("y", y)
                    .attr("dy", `${i + 1.1}em`);  // Adjust this value if needed for vertical spacing
            }
        });
    }

    createTitle(svg, titleText);

    const x = d3.scaleTime()
        .domain(d3.extent(data, d => new Date(d.end_year, monthToNumber(d.end_month))))
        .range([0, svgParams.width - svgParams.margin.left - svgParams.margin.right]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => Math.max(d.solar_emissions, d.other_emissions))])
        .range([svgParams.height - svgParams.margin.top - svgParams.margin.bottom, 0]);

    const multiLineFormat = (date) => {
        const month = d3.timeFormat("%b")(date);  // This gives the abbreviated month format
        const year = d3.timeFormat("%Y")(date);
        return `${month} | ${year}`;
    };
        
        
    
    const xAxis = d3.axisBottom(x).tickFormat(multiLineFormat);
    svg.append("g")
        .attr("transform", `translate(0,${svgParams.height - svgParams.margin.top - svgParams.margin.bottom})`)
        .call(xAxis);    

    svg.append("g")
        .call(d3.axisLeft(y));

    const solarLine = d3.line()
        .x(d => x(new Date(d.end_year, monthToNumber(d.end_month))))
        .y(d => y(d.solar_emissions));

    const otherLine = d3.line()
        .x(d => x(new Date(d.end_year, monthToNumber(d.end_month))))
        .y(d => y(d.other_emissions));

    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("padding", "5px")
        .style("background-color", "white")
        .style("border", "1px solid #ccc")
        .style("border-radius", "4px");

    svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", svgParams.color('co2_solar'))
        .attr("stroke-width", 1.5)
        .attr("d", solarLine);

    svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", svgParams.color('other_emissions'))
        .attr("stroke-width", 1.5)
        .attr("d", otherLine);

    svg.selectAll(".tick text")  // select all tick labels
        .call(splitMultilineText, "|");  // call function to split multiline text

    // Add dots for solar_emissions
    svg.selectAll(".dot-solar")
        .data(data)
        .enter().append("circle") // Append circle elements
        .attr("class", "dot-solar")
        .attr("cx", d => x(new Date(d.end_year, monthToNumber(d.end_month))))
        .attr("cy", d => y(d.solar_emissions))
        .attr("r", 4.5) // Radius of circle
        .attr("fill", svgParams.color('co2_solar'))

    svg.selectAll(".dot-solar-hover")
        .data(data)
        .enter().append("circle")
        .attr("class", "dot-solar-hover")
        .attr("cx", d => x(new Date(d.end_year, monthToNumber(d.end_month))))
        .attr("cy", d => y(d.solar_emissions))
        .attr("r", 12) // Larger radius for hover area
        .style("fill", "none")
        .style("pointer-events", "all")  // Ensures the invisible circle can capture mouse events
        .on("mouseover", function(event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`Date: ${d.end_month} ${d.end_year}<br/>Solar Emissions: ${d.solar_emissions.toLocaleString()} tCo2e`)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        
        .on("mouseout", function(d) {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

    // Add dots for other_emissions
    svg.selectAll(".dot-other")
        .data(data)
        .enter().append("circle") // Append circle elements
        .attr("class", "dot-other")
        .attr("cx", d => x(new Date(d.end_year, monthToNumber(d.end_month))))
        .attr("cy", d => y(d.other_emissions))
        .attr("r", 4.5) // Radius of circle
        .attr("fill", svgParams.color('other_emissions'))

    svg.selectAll(".dot-other-hover")
        .data(data)
        .enter().append("circle")
        .attr("class", "dot-other-hover")
        .attr("cx", d => x(new Date(d.end_year, monthToNumber(d.end_month))))
        .attr("cy", d => y(d.other_emissions))
        .attr("r", 12) // Larger radius for hover area
        .style("fill", "none")
        .style("pointer-events", "all")  // Ensures the invisible circle can capture mouse events
        .on("mouseover", function(event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`Date: ${d.end_month} ${d.end_year}<br/>Solar Emissions: ${d.other_emissions.toLocaleString()} tCo2e`)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        
        .on("mouseout", function(d) {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });


    svg.append("text")
        .attr("x", svgParams.width / 2)
        .attr("y", svgParams.height - svgParams.margin.top + 40)
        .style("text-anchor", "middle")
        .text(xLabel);

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -svgParams.margin.left + 10)
        .attr("x", -(svgParams.height - svgParams.margin.top - svgParams.margin.bottom) / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("fill", "black")
        .style("font-size", "14px")
        .text("Emissions (tCo2e)");

    createLegend(svg, svgParams.width - svgParams.margin.left - svgParams.margin.right, ['co2_solar', 'other_emissions']);
    applyFontStyles(svg);
}

function createCostSavingsGraph(data, containerId, titleText) {
    
    const svgParams = { 
        width: 500, 
        height: 300, 
        margin: {top: 30, right: 30, bottom: 120, left: 90}
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

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -svgParams.margin.left+20)
        .attr("x", -(svgParams.height - svgParams.margin.top - svgParams.margin.bottom) / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("fill", "black")
        .style("font-size", "14px")
        .text("Cost Savings ($)");

    // Create bars
    const bars = svg.selectAll("bars")
        .data(data)
        .enter().append("rect")
        .attr("x", d => x(d.name))
        .attr("y", d => y(d.cost_savings))
        .attr("width", x.bandwidth())
        .attr("height", d => svgParams.height - svgParams.margin.top - svgParams.margin.bottom - y(d.cost_savings))
        .attr("fill", "#69b3a2");

    
    const tooltip = d3.select(".tooltip");

    bars.on("mouseenter", function(event, d) {
        // Increase the size of the hovered bar and change its opacity
        d3.select(this)
            .transition()
            .duration(300)
            .attr('opacity', 0.6)
            .attr('y', d => y(d.cost_savings) - 5)  // Subtract 5 pixels from the Y position for a small animation
            .attr('height', d => svgParams.height - svgParams.margin.top - svgParams.margin.bottom - y(d.cost_savings) + 5);  // Add 5 pixels to the height for a small animation

        // Show the tooltip
        tooltip.transition()
            .duration(200)
            .style("opacity", .9);
        tooltip.html("Cost Savings: $" + d.cost_savings.toLocaleString())
            .style("left", (event.pageX) + "px")
            .style("top", (event.pageY - 28) + "px");
    })
    .on("mousemove", function(event, d) {
        tooltip.style("left", (event.pageX) + "px")
            .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseleave", function(d) {
        // Return the bar to its original state
        d3.select(this)
            .transition()
            .duration(300)
            .attr('opacity', 1)
            .attr('y', d => y(d.cost_savings))
            .attr('height', d => svgParams.height - svgParams.margin.top - svgParams.margin.bottom - y(d.cost_savings));

        // Hide the tooltip
        tooltip.transition()
            .duration(500)
            .style("opacity", 0);
    });

    // Add title
    svg.append("text")
        .attr("x", (svgParams.width - svgParams.margin.left - svgParams.margin.right) / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .text(titleText);
    applyFontStyles(svg);
}

function applyFontStyles(svg) {
    svg.selectAll("text")
        .style("font-family", "'Montserrat', sans-serif")
        .style("font-weight", "600");
}

function handleBarHover(svg, tooltip) {
    const bars = svg.selectAll("rect");

    bars.on("mouseenter", function(event, d) {
        // Increase the height of the hovered bar and change its opacity
        d3.select(this)
            .transition()
            .duration(300)
            .attr('opacity', 0.6)
            .attr('y', d => yScale(d.value) - 5)  // Subtract 5 pixels from the Y position for a small animation
            .attr('height', d => height - yScale(d.value) + 5);  // Add 5 pixels to the height for a small animation
        
        // Display tooltip
        tooltip.transition()
            .duration(200)
            .style("opacity", .9);
        tooltip.html(`
            <strong>${d.key}</strong>: ${d.value.toLocaleString()} tCo2e
        `)
        .style("left", (event.pageX) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseleave", function(d) {
        // Return the bar to its original state
        d3.select(this)
            .transition()
            .duration(300)
            .attr('opacity', 1)
            .attr('y', d => yScale(d.value))
            .attr('height', d => height - yScale(d.value));

        // Hide tooltip
        tooltip.transition()
            .duration(500)
            .style("opacity", 0);
    });
}

function getFriendlyLabel(key) {
    const labels = {
        'other_emissions': 'Other Emissions',
        'co2_solar': 'Solar PV Emissions',
        'total_emissions': 'Total Emissions'
        // Add more mappings as needed
    };
    return labels[key] || key;  // returns the key itself if no mapping found
}

function sortDataChronologically(data) {
    return data.sort((a, b) => {
        // Compare by start year, then by start month, then by end year, and finally by end month
        return a.start_year - b.start_year || a.start_month - b.start_month || a.end_year - b.end_year || a.end_month - b.end_month;
    });
}

function createEmissionsByReportingPeriodGraph(data) {
    const sortedData = sortDataChronologically(data);

    // Abbreviate the month names
    const abbreviatedData = sortedData.map(d => {
        const startMonthAbbreviated = d.start_month ? d.start_month.slice(0, 3) : '';
        const endMonthAbbreviated = d.end_month ? d.end_month.slice(0, 3) : '';
        return {
            ...d,
            start_month: startMonthAbbreviated,
            end_month: endMonthAbbreviated
        };
    });

    createGraph(abbreviatedData, "#emissionsByPeriod", "Emissions by Reporting Period", "Reporting Period");
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

document.addEventListener('DOMContentLoaded', function() {
    fetch('/api/emissions_over_time')
    .then(response => response.json())
    .then(data => createEmissionsOverTimeLineGraph(data, "#emissionsOverTime", "Emissions Over Time", "Time"));

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

    // Tooltip code
    const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);
});

function svgToPng(svgElement, scale = 2) {  // scale is 2x by default
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const width = parseInt(svgElement.getAttribute("width") || svgElement.viewBox.baseVal.width);
        const height = parseInt(svgElement.getAttribute("height") || svgElement.viewBox.baseVal.height);

        canvas.width = width * scale;
        canvas.height = height * scale;
        ctx.scale(scale, scale);

        const data = (new XMLSerializer()).serializeToString(svgElement);
        const svg = new Blob([data], {type: 'image/svg+xml;charset=utf-8'});
        const url = URL.createObjectURL(svg);

        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/png'));
        };
        img.src = url;
    });
}


async function downloadImagesAsWord() {
    const imageContainers = document.querySelectorAll('.graph');

    const images = [];
    for (const container of imageContainers) {
        const svgElement = container.querySelector('svg');
        if (svgElement) {
            const pngData = await svgToPng(svgElement);
            const title = container.closest(".backlog-container").querySelector("h2").textContent;

            images.push({ title, data: pngData });
        }
    }

    // Send the image data to the server
    const response = await fetch('/download_word', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ images })
    });
    
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'graphs.docx';
    document.body.appendChild(a);
    a.click();
    a.remove();
}

