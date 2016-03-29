
/**
 * drawLines() moves time series lines to reflect new scales
 *
 * @param elem {d3-selection} The SVG element over which the time series is
 * to be drawn.
 * @param data {array} An array of arrays of dicts. Each dict is an x-y pair to
 * put on the plot. Its parent array specifies a single time series path. The
 * top array is a collection of time series paths. Each bottom level dictionary
 * must have the fields x_id, y_id, and col_id.
 * @param scales {Object} A dictionary of x, y, and color scales. See
 * getScales() for an example.
 * @return {}
 * @side-effects Moves the "path.ts" dom selections from the elem selection to
 * reflect  new scales.
 */
function drawLines(elem, data, scales, keyFun, hoverFuns, opts) {
  newElemData = elem.selectAll("path.ts")
    .data(data, keyFun)

  newElemData.exit().remove()

  lineGeneratorInit = d3.svg.line()
    .x(function(d) { return scales.x(d.x_id); })
    .y(function(d) { return scales.y(0); })
  lineGenerator = d3.svg.line()
    .x(function(d) { return scales.x(d.x_id); })
    .y(function(d) { return scales.y(d.y_id); })

  newElemData.enter()
    .append("path")
    .attr({"d": lineGeneratorInit,
	   "id": function(d) {
	     return "series_" + d[0]["col_id"] + "_" + d[0]["appear_id"];
	   },
	   "class": "ts"})
    .style({"stroke": function(d) { return scales.col(d[0]["col_id"]) },
	    "opacity": 0
	   })
    .on("mouseover", hoverFuns["over"])
    .on("mouseout", hoverFuns["out"])

  newElemData
    .transition()
    .delay(0)
    .duration(opts["duration"])
    .attr({"d": lineGenerator})
    .style({"opacity": 1,
	    "stroke-width": function(d) {
	      if(d[0]["class"] != "ts unselected") {
		return 5 * opts["stroke-width"]
	      } else {
		return opts["stroke-width"]
	      }
    }})
}
