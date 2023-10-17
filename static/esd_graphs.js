const svgParams = {
    width: 1000,
    height: 400,
    margin: {top: 50, right: 120, bottom: 50, left: 120},
    color: d3.scaleOrdinal(d3.schemeCategory10)  // Adjust as needed
};

// Create SVG container
const svg = d3.select("#mjSavedOverTime")
    .append("svg")
    .attr("width", '100%')
    .attr("height", '100%')
    .attr("viewBox", "-100 0 1200 400")  // Adjust the viewBox values here
    .append("g")
    .attr("transform", "translate(150, 50)");

// Create tooltip
const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("background-color", "white")
    .style("padding", "5px")
    .style("border-radius", "5px")
    .style("box-shadow", "0 0 10px rgba(0,0,0,0.5)");

async function fetchAndRenderGraph() {
    const response = await fetch('/api/mj_saved_per_annum_over_time');  // Update this URL as needed
    const data = await response.json();

    data.sort((a, b) => a.year - b.year);

    const x = d3.scaleLinear()
    .domain([
        d3.min(data, d => d.year + (d.half_year - 1) * 0.5), 
        d3.max(data, d => d.year + (d.half_year - 1) * 0.5)
    ])
    .range([0, svgParams.width - svgParams.margin.left - svgParams.margin.right]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.avg_mj_saved_per_annum)])
        .range([svgParams.height - svgParams.margin.top - svgParams.margin.bottom, 0]);

    svg.selectAll('circle')
        .data(data)
        .enter()
        .append('circle')
        .attr('cx', d => {
            const xValue = x(d.year + (d.half_year - 1) * 0.5);  // Calculating x value
            return xValue;
        })
        .attr('cy', d => y(d.avg_mj_saved_per_annum))
        .attr('r', 5)
        .attr('fill', d => svgParams.color(d.class))
        .on('mouseover', (event, d) => {
            tooltip.transition().duration(200).style('opacity', .9);
            tooltip.html(`Year: ${d.year}<br/>Class: ${d.class}<br/>MJ Saved: ${d.avg_mj_saved_per_annum.toFixed(1)}`)
                .style('left', (event.pageX + 5) + 'px')
                .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', d => {
            tooltip.transition().duration(500).style('opacity', 0);
        })
        .on('click', (event, d) => {
            window.location.href = `/templates/esd/view_energy_rating_data.html?id=${d.id}`;
        });

    // Add hover circles
    svg.selectAll('.hover-circle')
        .data(data)
        .enter()
        .append('circle')
        .attr('class', 'hover-circle')
        .attr('cx', d => x(d.year + (d.half_year - 1) * 0.5))
        .attr('cy', d => y(d.avg_mj_saved_per_annum))
        .attr('r', 12) // You can adjust the radius value as needed
        .style('fill', 'none')
        .style('pointer-events', 'all')
        .on('mouseover', (event, d) => {
            tooltip.transition().duration(200).style('opacity', .9);
            tooltip.html(`Year: ${d.year}<br/>Class: ${d.class}<br/>MJ Saved: ${d.avg_mj_saved_per_annum.toFixed(1)}`)
                .style('left', (event.pageX + 5) + 'px')
                .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', d => {
            tooltip.transition().duration(500).style('opacity', 0);
        })
        .on('click', (event, d) => {
            window.location.href = `/view_energy_rating_data/${d.id}`;
        });
    
    

    const line = d3.line()
        .x(d => x(d.year + (d.half_year - 1) * 0.5))
        .y(d => y(d.avg_mj_saved_per_annum));
    

    svg.selectAll('.line')
        .data([1, 2])  // Assuming the classes are 1 and 2
        .enter()
        .append('path')
        .attr('d', classValue => line(data.filter(d => d.class === classValue)))
        .attr('stroke', classValue => svgParams.color(classValue))
        .attr('stroke-width', 2)
        .attr('fill', 'none');

    svg.append('g')
        .attr('transform', `translate(0,${svgParams.height - svgParams.margin.top - svgParams.margin.bottom})`)
        .call(d3.axisBottom(x).tickFormat(d => {
            const year = Math.floor(d);
            const half = d % 1 >= 0.5 ? 'H2' : 'H1';
            return `${year} ${half}`;
        }))        

    svg.append('g')
        .call(d3.axisLeft(y));

    // Adding labels and titles is as simple as appending text elements at the right positions:
    svg.append('text')
        .attr('x', (svgParams.width - svgParams.margin.left - svgParams.margin.right) / 2)
        .attr('y', svgParams.height - svgParams.margin.top)
        .attr('text-anchor', 'middle')
        .text('Year');

        svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -svgParams.margin.left + 40)  // Adjust this value to position the label correctly
        .attr('x', -(svgParams.height - svgParams.margin.top - svgParams.margin.bottom) / 2)
        .attr('dy', '1em')
        .attr('text-anchor', 'middle')
        .text('Average MJ Saved Per Annum');
    
    // Legend
    const legend = svg.selectAll('.legend')
        .data([1, 2])
        .enter().append('g')
        .attr('class', 'legend')
        .attr('transform', (d, i) => `translate(0,${i * 20})`);

    legend.append('rect')
        .attr('x', svgParams.width - svgParams.margin.right - 18)
        .attr('width', 18)
        .attr('height', 18)
        .style('fill', d => svgParams.color(d));

    legend.append('text')
        .attr('x', svgParams.width - svgParams.margin.right - 24)
        .attr('y', 9)
        .attr('dy', '.35em')
        .style('text-anchor', 'end')
        .text(d => `Class ${d}`);
}

document.addEventListener('DOMContentLoaded', fetchAndRenderGraph);
