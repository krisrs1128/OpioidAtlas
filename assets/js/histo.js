
/**
 * drawHisto() creates a dot histogram given ordinal and linear scales for dot
 * positions
 *
 * @param elem {d3-selection} The d3 selection (html DOM element) on which to
 * attach the histogram.
 * @param binData {array} The data to use for the histogram. Each array element
 * must be an object with  fields rank_id [for the rank of the point within the
 * bin], bin_id [for the bin within which the point falls], and col_id [for the
 * color of the point.].
 * @param scales A dictionary with three scales, mapping rank, color, and bin
 * id onto the page. See getHistoScales() for one way to generate this.
 * @param keyFun A funciton that uniquely identifies each circle, to ensure
 * object constancy. Typically this will be drug + country identifiers.
 * @duration How long should the transitions last?
 * @return {}
 * @side-effects Attaches new histogram dots onto the elem selection, or updates
 * the scales of existing points.
 */
function drawHisto(elem, binData, scales, keyFun, hoverFuns, opts) {
  newElemData = elem.selectAll("circle")
    .data(binData, keyFun)

  // attach new data points
  newElemData.enter()
    .append("circle")
    .attr({
      "r": opts["r"],
      "cx": function(d) { return scales.rank(0) },
      "cy": function(d) {
	return scales.bin(d["bin_id"]) },
      "fill": function(d) { return drugsScale()(d["col_id"]) }
    })
    .on("mouseover", hoverFuns["over"])
    .on("mouseout", hoverFuns["out"]);

  // remove old points
  newElemData.exit()
    .remove()

  // update scales for existing points
  newElemData
    .transition()
    .duration(opts["duration"])
    .attr({
      "cx": function(d) { return scales.rank(d["rank_id"]) },
      "cy": function(d) { return scales.bin(d["bin_id"]) }
    })
}

/**
 * drawCognostics() wraps drawHisto() to draw histograms for incb cognostics.
 *
 * @param elem {d3-selection} The d3 selection (html DOM element) on which to
 * attach the histogram.
 * @param incb_histo {array} The data array describing the incb cognostics, as
 * created in the cognostics vignette of the incbStats package. It must be
 * preprocessed to match the binData argument in drawHisto().
 * @param incb_histo_levels {Object} A dictionary whose keys are the different
 * cognostics and whose values are arrays of the bin_ids for each type of
 * cognostic. This is important because there may be some bins with no points
 * in them, but we still want to know to draw them.
 * @param cog A string specifying the cognostic to use.
 * @param regions The regions to filter the cognostics down to.
 * @param drugs The drugs to filter the cognostics down to.
 * @return {}
 * @side-effects Attaches new histogram dots onto the elem selection, for the
 * cognostics / country / drug data specified by the parameters.
 */
function drawCognostics(elem, incb_histo, incb_histo_levels, cog, regions,
			drugs, hoverFuns, opts) {
  const f = function(d) {
    return (d["cog"] == cog) & (-1 != $.inArray(d["col_id"], drugs)) & (-1 != $.inArray(d["region"], regions))
  }

  const binData = getIncbHistoArray(incb_histo).filter(f);
  const paddings = [70, 20, 20, 20]
  var keyFun = function(d) { return d["col_id"] + "_" + d["group_id"] };
  var scales = histoScales(binData, incb_histo_levels[cog], elem, paddings);
  scales["col"] = drugsScale();
  drawHistoAxis(elem, scales, paddings);
  drawHisto(elem, binData, scales, keyFun, hoverFuns, opts);
}

function drawHistoAxis(elem, scales, paddings) {
  const nBins = scales.bin.domain().length
  const binAxis = d3.svg.axis()
	.tickValues(scales.bin.domain().filter(function(d, i) {
	  return !(i % (Math.floor(nBins / 6)));
	}))
	.orient("left")
	.scale(scales.bin);

  // if there is no axis yet, draw it
  if(elem.select(".binaxis").node() == null) {
    elem.append("g")
      .attr("class", "axis binaxis")
      .attr("transform", "translate(0," + paddings[2] + ")")
  }

  elem.selectAll("g.axis.binaxis")
    .call(binAxis)
    .attr("transform", "translate(" + paddings[0] + ", 0)")
}

function initializeTSElem(tsElem) {
  // background rectangle for plot
  tsElem.append("g")
    .attr({"id": "tsPlot",
	   "height": tsElem.attr("height") * .8,
	   "width": tsElem.attr("width"),
	   "transform": "translate(0," + .2 * tsElem.attr("height") + ")"})

  // title rect and text gets a group
  const titleHeight = .1 * tsElem.attr("height")
  const tsTitle = tsElem.append("g")
	.attr({"id": "tsTitle",
	       "width": tsElem.attr("width"),
	       "height": titleHeight + 10})

  // title rectangle
  tsElem.select("#tsTitle").append("rect")
    .attr({"width": tsElem.attr("width"),
	   "height": titleHeight + 10,
	   "fill": "#F7F7F7",}) // 10 pixels padding, 5 above title and five below

  // title text
  tsElem.select("#tsTitle").append("text")
    .attr({"id": "tsTitleText",
	   "text-anchor": "middle",
	   "transform": "translate(" + tsElem.attr("width") / 2 + "," + (titleHeight + 5) + ")"})
}


/**
 * updateCognostics() draws cognostics for the current drug and region selections
 *
 * @param {}
 * @return {}
 * @side-effects Draws cognostics for the current cognostic, drug, and region
 * selections.
 */
function updateCognostics() {
  const cog = $("#cogSelections #cogSelect").val();
  const drugs = $("#cogSelections #drugSelect").val();
  const regions = $("#cogSelections #regionSelect").val();
  const histoElem = d3.selectAll("#cognostics > svg")
  const tsElem = d3.selectAll("#cognosticsSeries > svg")
  if(tsElem.select("#tsPlot").node() == null) {
    initializeTSElem(tsElem)
  }

  const opts = {"r": 2, "y_enter": 0, "x_enter": undefined, "stroke-width": 0.5,
		"duration": 500}
  const hoverFuns = {"over": tsOverFun(tsElem, opts),
		     "out": tsOutFun(tsElem, opts)}
  drawCognostics(histoElem, incb_histo, incb_histo_levels, cog, regions, drugs,
		 hoverFuns, opts)
}
