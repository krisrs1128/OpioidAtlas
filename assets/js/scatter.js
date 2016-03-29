// Functions to draw scatterplots of points

/**
 * drawPoints() instantiates a scatterplot
 *
 * @param elem {d3-selection} The SVG element over which the time series is
 * to be drawn.
 * @param data {array} An array whose elements will be points on the time
 * series. Each array element must be a dictionary with the fields x_id, y_id,
 * and col_id.
 * @param scales {Object} A dictionary of x, y, and color scales. See
 * getScales() for an example.
 * @return {}
 * @side-effects Updates circles on the specified SVG, according to the new
 * positions specified by data and scales.
 */
function drawPoints(elem, data, scales, keyFun, hoverFuns, opts) {
  newElemData = elem.selectAll("circle")
    .data(data, keyFun)

  // remove exit selection
  newElemData.exit()
    .remove()

  // add new points for enter selection
  newElemData.enter()
    .append("circle")
    .attr({"opacity": 0,
	   "cx": function(d) {
	     if(opts["x_enter"] != undefined) {
	       return scales.x(opts["x_enter"])
	     } else {
	       return scales.x(d["x_id"])
	     }},
	   "cy": function(d) {
	     if(opts["y_enter"] != undefined) {
	       return scales.y(opts["y_enter"])
	     } else {
	       return scales.y(d["y_id"])
	     }},
	   "fill": function(d) { return drugsScale()(d["col_id"]); }})
  .on("mouseover", hoverFuns["over"])
  .on("mouseout", hoverFuns["out"])

  // update positions of previous points
  newElemData
    .transition()
    .delay(0)
    .duration(opts["duration"])
    .attr({"cy": function(d) { return scales.y(d["y_id"]); },
	   "cx": function(d) { return scales.x(d["x_id"]); },
	   "r": function(d) {
	     if(d["class"] != "unselected") {
	       return 3 * opts["r"];
	     } else {
	       return opts["r"];
	     }
	   },
	   "opacity": 1})
}

/**
 * Updates axis for a scatterplot
 *
 * @param elem {d3-selection} The SVG element over which the time series is
 * to be drawn. Must have width and height attributes.
 * @param scales {Object} A dictionary of x, y, and color scales. See
 * getScales() for an example.
 * @param padding {float} The amount of padding to put between the axis and the
 * element sides.
 * @return {}
 * @side-effects Updates the ticks on the axis to reflect the given scale, or
 * if the axis has not been drawn yet, updates it.
 */
function updateAxes(elem, scales, paddings, duration, nTicks) {
  const xAxis = d3.svg.axis()
	.ticks(nTicks[0])
	.orient("bottom")
	.scale(scales.x);
  const yAxis = d3.svg.axis()
	.ticks(nTicks[1])
	.orient("left")
	.scale(scales.y);

  var xElem = elem.selectAll("g.axis.xaxis");
  var yElem = elem.selectAll("g.axis.yaxis");

  if(xElem.node() == undefined) {
    elem.append("g").attr("class", "axis xaxis")
  }
  if(yElem.node() == undefined) {
    elem.append("g").attr("class", "axis yaxis")
  }

  elem.selectAll("g.axis.xaxis")
    .attr("transform", "translate(0," + (elem.attr("height") - paddings[0]) + ")")
    .transition()
    .duration(duration)
    .call(xAxis)

  elem.selectAll("g.axis.yaxis")
    .attr("transform", "translate(" + paddings[1] + ", 0)")
    .transition()
    .duration(duration)
    .call(yAxis)

}
