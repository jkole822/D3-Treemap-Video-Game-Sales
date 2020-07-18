const url =
	'https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/video-game-sales-data.json';

const getData = async () => {
	const response = await fetch(url);
	const data = await response.json();
	const dataset = { ...data };
	return dataset;
};

const renderData = async () => {
	const dataset = await getData();

	// Sort gaming systems by number of games
	const sortedGames = dataset.children.sort((a, b) => {
		return b.children.length - a.children.length;
	});

	const sortedDataset = { ...dataset, children: sortedGames };

	// Make Treemap Responsive
	const makeResponsive = svg => {
		// Get Container & Define Aspect Ratio
		const container = d3.select(svg.node().parentNode),
			width = parseInt(svg.style('width')),
			height = parseInt(svg.style('height')),
			aspect = width / height;

		// Set ViewBox and Preserve Aspect Ratio, Call Resize Function
		svg
			.attr('viewBox', `0 0 ${width} ${height}`)
			.attr('preserveAspectRatio', 'xMinYMid')
			.call(resize);

		// Add namespace to register multiple listeners for resize event
		d3.select(window).on(`resize.${container.attr('id')}`, resize);

		// Resize based on width of container
		function resize() {
			const targetWidth = parseInt(container.style('width'));
			svg.attr('width', targetWidth);
			svg.attr('height', Math.round(targetWidth / aspect));
		}
	};

	const renderTooltip = (name, value, category) => {
		return `Name: ${name} <br /> Category: ${category} <br /> Value: ${value}`;
	};

	// Main Container
	d3.select('body').append('div').attr('class', 'main');

	const main = d3.select('.main');

	// Title
	main.append('h1').text('Video Game Sales').attr('id', 'title');

	// Description
	main
		.append('h2')
		.text('Top 100 Most Sold Video Games Grouped by Platform')
		.attr('id', 'description');

	// SVG
	const w = 960;
	const h = 600;

	const svg = main
		.append('svg')
		.attr('width', w)
		.attr('height', h)
		.call(makeResponsive);

	// Tooltip
	const tooltip = main
		.append('div')
		.attr('id', 'tooltip')
		.attr('class', 'tooltip')
		.style('opacity', 0);

	// Format dataset to input into treemap
	const root = d3.hierarchy(sortedDataset).sum(d => d.value);

	// Create Treemap
	d3.treemap().size([w, h])(root);

	// Define Colors for Scale
	const colorArr = [];
	let count = 0;
	for (let i = 0; i < sortedGames.length; i++) {
		colorArr.push(d3.interpolateViridis(count));
		count += 1.0 / sortedGames.length;
	}

	// Match Category to Color
	const colors = d3
		.scaleOrdinal()
		.domain(sortedGames)
		.range([0, ...colorArr]);

	// Cells
	// 'root.leaves()' only contains all data objects (games)
	const cell = svg
		.selectAll('g')
		.data(root.leaves())
		.enter()
		.append('g')
		.attr('transform', d => `translate(${d.x0},${d.y0})`);

	// Fill Cells
	cell
		.append('rect')
		.attr('id', d => d.data.id)
		.attr('class', 'tile')
		.attr('data-name', d => d.data.name)
		.attr('data-value', d => d.data.value)
		.attr('data-category', d => d.data.category)
		.attr('width', d => d.x1 - d.x0)
		.attr('height', d => d.y1 - d.y0)
		.style('fill', d => colors(d.parent.data.name))
		.on('mousemove', d => {
			tooltip.transition().style('opacity', 0.9);
			tooltip
				.html(renderTooltip(d.data.name, d.data.value, d.data.category))
				.attr('data-value', d.data.value)
				.style('left', `${d3.event.pageX + 10}px`)
				.style('top', `${d3.event.pageY - 28}px`)
				.style('background-color', colors(d.parent.data.name));
		})
		.on('mouseout', d => {
			tooltip.transition().style('opacity', 0);
		});

	// Text Content
	cell
		.append('text')
		.selectAll('tspan')
		// Split text to allow readability & prevent text overflow
		.data(d => d.data.name.split(/(?=[A-Z][^A-Z])/g))
		.enter()
		// Append subsequent text elements of array created from split
		.append('tspan')
		.attr('font-size', '0.65em')
		.attr('x', 4)
		// Offset the y position with the index of the text element
		// First number offsets block of text from the border
		// Second number alters line spacing
		.attr('y', (d, i) => 10 + 12 * i)
		.text(d => d)
		.style('fill', 'white');

	// Legend SVG
	const legend = main
		.append('svg')
		.attr('width', w)
		.attr('height', h / 3)
		.call(makeResponsive);

	// Legend Variables
	const legendRectSize = 15;
	const legendHorizontalSpacing = 120;
	const legendVerticalSpacing = 10;
	const legendTextXOffset = 5;
	const legendTextYOffset = -2;
	const legendElemsPerRow = 3;

	// Legend Content
	const legendElem = legend
		.append('g')
		.attr('class', 'legend')
		.attr('id', 'legend')
		.attr('transform', `translate(0, 40)`)
		.selectAll('g')
		.data(sortedGames)
		.enter()
		.append('g')
		.attr('transform', (d, i) => {
			return `translate(
				${(i % legendElemsPerRow) * legendHorizontalSpacing},
				${
					Math.floor(i / legendElemsPerRow) * legendRectSize +
					legendVerticalSpacing * Math.floor(i / legendElemsPerRow)
				}
				)`;
		});

	// Legend Icons
	legendElem
		.append('rect')
		.attr('width', legendRectSize)
		.attr('height', legendRectSize)
		.attr('class', 'legend-item')
		.attr('fill', d => colors(d.name));

	// Legend Text
	legendElem
		.append('text')
		.attr('x', legendRectSize + legendTextXOffset)
		.attr('y', legendRectSize + legendTextYOffset)
		.text(d => d.name);
};

renderData();
