// General setup of the webpage background

/**
 * setupSVG() creates an SVG with the specified parameters
 *
 * @param id {string} A string with the css selector for the html element
 * to which to attach the SVG.
 * @param width The desired height of the SVG.
 * @param height The desired width of the SVG.
 * @param background: The background color for the rect on the SVG.
 * @return {}
 * @side-effects Attaches an SVG to the "id" element on the current page,
 * along with a rectangle with the specified background color.
 */
function setupSVG(id, width, height, background) {
  // setup svg
  const SVG = d3.select(id)
	.append("svg")
	.attr({"height": height,
	       "width": width,
	      });

  // background color
  SVG.append("rect")
    .attr({"height": height,
	   "width": width,
	   "fill": background})
  return SVG
}

/**
 * fillOptions() fills in options for a given selection, and specifies what to
 * do upon a change.
 *
 * @param id {string} A css-selection string, used to get the selection element.
 * @param options {array} A list of strings giving options to attach to the
 * selection.
 * @param changeFun {function} A function to call each time the selection is
 * changed.
 */
function fillOptions(id, options, defaultSelect) {
  const curSelect = d3.select(id)
  curSelect.selectAll("option")
    .data(options)
    .enter()
    .append("option")
    .text(function(d) { return d; });
  curSelect.select("option")
    .attr("selected", true)
}

