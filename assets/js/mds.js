// Functions to draw the MDS

/**
 * drawMDS() draws the points resulting from an MDS
 *
 * @param elem {d3-selection} The SVG element with width and height attributes,
 * @param mdsData The data set containing the MDS information. It must have
 * a "group_id" specifying the country, "col_id" specifying the drug, and
 * "x_id" and "y_id" specifying the position the MDS scatterplot.
 * @return {}
 * @side-effects Draws the MDS associated with the current data set.
 */
function drawCountryScatter(elem, data, hoverFuns, opts) {
  var scales = getScatterScales(data, elem, [20, 60, 60, 20])
  scales["col"] = drugsScale()
  const keyFun = function(d) { return d["group_id"] + d["col_id"] }
  drawText(elem, data, scales, keyFun, hoverFuns, opts)
}

function updateMDS() {
  const mdsElem = d3.select("#mdsScatter > svg")
  const tsElem = d3.select("#mdsSeries > svg")
  const drugs = $("#mdsSelect #drugSelect").val();
  const regions = $("#mdsSelect #regionSelect").val();

  if(tsElem.select("#tsPlot").node() == null) {
    initializeTSElem(tsElem)
  }

  f1 = function(d) {
    return (-1 != $.inArray(d["col_id"], drugs))
  }
  f2 = function(d) {
    return (-1 != $.inArray(d["region"], regions))
  }

  mdsData = incbMDS.filter(f1).filter(f2)
  const opts = {"font-size": 10, "y_enter": undefined, "x_enter": undefined,
		"duration": 700, opacity: .6, "r": 0}
  const hoverFuns = {"over": tsOverFun(tsElem, opts),
		     "out": tsOutFun(tsElem, opts)}
  drawCountryScatter(mdsElem, mdsData, hoverFuns, opts)
}

function updateLocReg() {
  const locRegElem = d3.select("#locRegScatter > svg");
  const tsElem = d3.select("#locRegSeries > svg")
  const drugs = $("#locRegSelect #drugSelect").val();
  const regions = $("#locRegSelect #regionSelect").val();
  const year = $("#locRegSlider")[0].value;
  d3.select("#locRegYearInput text")
    .text("Year: " + year)

  if(tsElem.select("#tsPlot").node() == null) {
    initializeTSElem(tsElem)
  }

  f1 = function(d) {
    return (-1 != $.inArray(d["col_id"], drugs))
  }
  f2 = function(d) {
    return (-1 != $.inArray(d["region"], regions))
  }
  f3 = function(d) {
    return d["year"] == year;
  }

  locRegData = incb_local_reg.filter(f1).filter(f2).filter(f3);

  const opts = {"font-size": 10, "y_enter": undefined, "x_enter": undefined,
		"duration": 700, opacity: .6, "r": 0}
  const hoverFuns = {"over": tsOverFun(tsElem, opts),
		     "out": tsOutFun(tsElem, opts)}

  drawCountryScatter(locRegElem, locRegData, hoverFuns, opts)
  const scales = getScatterScales(locRegData, locRegElem, [20, 60, 60, 20])
  updateAxes(locRegElem, scales, [50, 50], opts["duration"], 10, true)

  // add labels, if not present
  if(locRegElem.select("#xAxisLabel").node() == null) {
    locRegElem.selectAll(".axis.xaxis")
      .append("text")
      .attr({"id": "xAxisLabel",
	     "text-anchor": "middle",
	     "transform": "translate(" + elem.attr("width") / 4 + ", 38)"})
      .text("Local Average (mg / person)")
    locRegElem.selectAll(".axis.yaxis")
      .append("text")
      .attr({"text-anchor": "middle",
	     "transform": "translate(-38, " + (elem.attr("height") / 2 - 40)+ ")rotate(90)"})
      .text("Local Slope (mg / person)")
  }
}
