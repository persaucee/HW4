import React, { Component } from "react";
import * as d3 from "d3";

class InteractiveStreamGraph extends Component {
  constructor(props) {
    super(props);
    this.svgRef = React.createRef();
    this.state = {
      tooltip: null
    };
  }

  componentDidUpdate() {
    const chartData = this.props.csvData;
    console.log("componentDidUpdate called with data:", chartData);

    if (!chartData || chartData.length === 0) {
      console.log("No data to render");
      return;
    }

    console.log("Calling renderStreamgraph");
    this.renderStreamgraph(chartData);
  }

  renderStreamgraph = (data) => {
    console.log("renderStreamgraph called with:", data);
    console.log("this.svgRef.current:", this.svgRef.current);

    const COOLARS = {
      "GPT-4": "#e41a1c",
      "Gemini": "#377eb8",
      "PaLM-2": "#4daf4a",
      "Claude": "#984ea3",
      "LLaMA-3.1": "#ff7f00"
    };

    const models = ["GPT-4", "Gemini", "PaLM-2", "Claude", "LLaMA-3.1"];

    const margin = { top: 20, right: 200, bottom: 50, left: 60 };
    const svgWidth = 1200;
    const width = svgWidth - margin.left - margin.right;
    const height = 400;

    // Clear previous SVG
    d3.select(this.svgRef.current).selectAll("*").remove();
    console.log("SVG cleared");

    const svg = d3.select(this.svgRef.current)
      .attr('width', svgWidth)
      .attr('height', height + margin.top + margin.bottom);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleTime()
      .domain(d3.extent(data, d => d.Date))
      .range([0, width]);

    const stackedData = d3.stack()
      .keys(models)
      (data);

    const maxY = d3.max(stackedData, layer =>
      d3.max(layer, d => d[1])
    );

    const yScale = d3.scaleLinear()
      .domain([0, maxY])
      .range([height, 0]);

    const area = d3.area()
      .x(d => xScale(d.data.Date))
      .y0(d => yScale(d[0]))
      .y1(d => yScale(d[1]))
      .curve(d3.curveBasis);

    g.selectAll('.stream').data(stackedData)
      .enter()
      .append('path')
      .attr('class', 'stream')
      .attr('d', area)
      .attr('fill', (d, i) => COOLARS[models[i]])
      .attr('opacity', 0.8)
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        const modelIndex = stackedData.indexOf(d);
        const modelName = models[modelIndex];
        this.showTooltip(modelName, event, data, COOLARS);
      })
      .on('mousemove', (event) => {
        this.updateTooltipPosition(event);
      })
      .on('mouseout', () => {
        this.hideTooltip();
      });

    const xAxis = g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale)
        .tickFormat(d3.timeFormat('%Y-%m'))
      );

    xAxis.append('text').attr('x', width / 2)
       .attr('y', 40)
      .attr('fill', 'black')
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .text('Date');

    const yAxis = g.append('g')
      .call(d3.axisLeft(yScale));

    yAxis.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
       .attr('x', 0 - (height / 2))
      .attr('dy', '1em')
      .attr('fill', 'black')
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .text('Total Counts');

    this.renderLegend(svg, margin, width, height, models, COOLARS);
  };

     renderLegend = (svg, margin, width, height, models, COOLARS) => {
    const legendGroup = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${margin.left + width + 40},${margin.top})`);

    legendGroup.append('text')
      .attr('x', 0)
      .attr('y', 0)
      .attr('font-weight', 'bold')
      .attr('font-size', '14px')
      .text('Models');

    models.forEach((model, i) => {
      const y = (i + 1) * 25;

      legendGroup.append('rect')
        .attr('x', 0)
        .attr('y', y)
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', COOLARS[model]);

      legendGroup.append('text')
        .attr('x', 18)
        .attr('y', y + 10)
        .attr('font-size', '14px')
        .text(model);
    });
  };

    showTooltip = (modelName, event, data, COOLARS) => {
    const tooltip = document.getElementById('interactive-tooltip');
    const svgContent = this.createMiniBarChart(modelName, data, COOLARS);
    tooltip.innerHTML = svgContent;
    tooltip.style.display = 'block';
    this.updateTooltipPosition(event);
  };

  updateTooltipPosition = (event) => {
    const tooltip = document.getElementById('interactive-tooltip');
    let x = event.pageX + 10;
    let y = event.pageY + 10;

    const tooltipWidth = tooltip.offsetWidth;
     const tooltipHeight = tooltip.offsetHeight;
    const windowWidth = window.innerWidth;
       const windowHeight = window.innerHeight;

    if (x + tooltipWidth > windowWidth) {
      x = event.pageX - tooltipWidth - 10;
    }

    if (y + tooltipHeight > windowHeight) {
      y = event.pageY - tooltipHeight - 10;
    }

    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
  };

  hideTooltip = () => {
    const tooltip = document.getElementById('interactive-tooltip');
     tooltip.style.display = 'none';
  };

  createMiniBarChart = (modelName, data, COOLARS) => {
    const miniWidth = 220;
    const miniHeight = 160;
    const miniMargin = { top: 25, right: 10, bottom: 35, left: 35 };
    const innerWidth = miniWidth - miniMargin.left - miniMargin.right;
    const innerHeight = miniHeight - miniMargin.top - miniMargin.bottom;

    const values = data.map(d => ({
      date: d.Date,
      value: d[modelName]
    }));

    const xScale = d3.scaleTime()
      .domain(d3.extent(values, d => d.date))
       .range([0, innerWidth]);

    const maxValue = d3.max(values, d => d.value);
    const yScale = d3.scaleLinear()
      .domain([0, maxValue])
      .range([innerHeight, 0]);

    let svg = `<svg width="${miniWidth}" height="${miniHeight}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<g transform="translate(${miniMargin.left},${miniMargin.top})">`;

    svg += `<text x="${innerWidth / 2}" y="-8" text-anchor="middle" font-weight="bold" font-size="13px">${modelName}</text>`;

    const barWidth = Math.max(1, innerWidth / values.length * 0.65);
    const barGap = innerWidth / values.length;

    values.forEach((d, i) => {
      const x = i * barGap + (barGap - barWidth) / 2;
      const y = yScale(d.value);
      const barHeight = innerHeight - y;

      if (barHeight > 0) {
        svg += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${COOLARS[modelName]}" opacity="0.85"></rect>`;
      }
    });

    svg += `<line x1="0" y1="${innerHeight}" x2="${innerWidth}" y2="${innerHeight}" stroke="black" stroke-width="1"></line>`;
    svg += `<line x1="0" y1="0" x2="0" y2="${innerHeight}" stroke="black" stroke-width="1"></line>`;

    const yTicks = yScale.ticks(4);
    yTicks.forEach(tick => {
      const y = yScale(tick);
       svg += `<line x1="-5" y1="${y}" x2="0" y2="${y}" stroke="black" stroke-width="1"></line>`;
      svg += `<text x="-8" y="${y + 3}" text-anchor="end" font-size="10px">${tick}</text>`;
    });

    const xTicks = xScale.ticks(3);
    xTicks.forEach(tick => {
      const x = xScale(tick);
      const dateStr = d3.timeFormat('%b %y')(tick);
      svg += `<line x1="${x}" y1="${innerHeight}" x2="${x}" y2="${innerHeight + 5}" stroke="black" stroke-width="1"></line>`;
        svg += `<text x="${x}" y="${innerHeight + 18}" text-anchor="middle" font-size="9px">${dateStr}</text>`;
    });

    svg += `<text x="-20" y="${innerHeight / 2}" text-anchor="middle" font-size="10px" transform="rotate(-90 -20 ${innerHeight / 2})">Count</text>`;

     svg += `</g></svg>`;

    return svg;
  };

     componentDidMount() {
    if (!document.getElementById('interactive-tooltip')) {
      const tooltip = document.createElement('div');
      tooltip.id = 'interactive-tooltip';
      tooltip.style.cssText = `
        position: fixed;
        background: white;
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 10px;
        pointer-events: none;
        display: none;
        z-index: 1000;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      `;
      document.body.appendChild(tooltip);
    }
  }

  render() {
    return (
      <svg
        ref={this.svgRef}
        style={{ width: '100%', maxWidth: 1200, display: 'block', margin: '0 auto' }}
        className="svg_parent"
      />
    );
  }
}

export default InteractiveStreamGraph;
