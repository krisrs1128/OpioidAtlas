
/**
 * drawTS() redraws the positions of the points initialized by drawTS
 * @param elem {d3-selection} The SVG element over which the time series is
 * to be drawn.
 * @param data {array} An array whose elements will be points on the time
 * series. Each array element must be a dictionary with the fields x_id, y_id,
 * and col_id.
 * @return {}
 * @side-effects Pulls out the current time series elements on the elem
 * selection, and moves them according to new positions in ts. The key that
 * ensures object constancy is specified in scatter.js -- it is currently
 * set to be the cartesian product of x_ids and col_ids.
 */
function drawTS(elem, scales, circleData, lineData, keyFuns,
		hoverFuns, paddings, opts, nTicks) {
  drawPoints(elem, circleData, scales, keyFuns["points"], hoverFuns, opts)
  drawLines(elem, lineData, scales, keyFuns["ts"], hoverFuns, opts)
  updateAxes(elem, scales, paddings, opts["duration"], nTicks)
}

function insertClass(array, drug) {
  insertedArray = array;
  for(var i = 0; i < array.length; i++) {
    if(drug == undefined || drug == array[i]["col_id"]) {
      insertedArray[i]["class"] = "selected"
    } else {
      insertedArray[i]["class"] = "unselected"
    }
  }
  return insertedArray;
}

function insertTSClass(array, drug) {
  var insertedArray = array
  for(var i = 0; i < array.length; i++ ) {
    for(var j = 0; j < array[i].length; j++ ) {
      var drugSelected = array[i][j]["col_id"] == drug;
      if(drug == array[i][j]["col_id"]) {
	insertedArray[i][j]["class"] = "ts selected"
      } else {
	insertedArray[i][j]["class"] = "ts unselected"
      }
    }
  }
  return insertedArray;
}

/**
 * drawTSCountry() wraps drawTS() to update y-positions for a
 * new country
 *
 * @param elem {d3-selection} The SVG element over which the time series is
 * to be updated.
 * @param incb {array} An array whose i^th element is an object with a "static" array
 *  and a "ts" array, containing static and time series features for the i^th
 *  country.
 * @param country {string} The name of the new country to plot data for.
 * @side-effects Updates the circles on the time series plot to a new country.
 */
function drawTSCountry(elem, incb, country, drug, duration, paddings) {
  f1 = function(d) { return d.appear_id == country }
  f2 = function(d) { return d[0].appear_id == country }
  f3 = function(d) { return d["col_id"] == drug }
  var curCountryArray = getIncbArray(incb).filter(f1)
  var curCountryTS = getIncbTS(incb).filter(f2)
  curCountryArray = insertClass(curCountryArray, drug)
  curCountryTS = insertTSClass(curCountryTS, drug)

  const keyFuns = {"points": function(d) { return d.x_id + "_" + d.col_id },
		   "ts": function(d) { return d[0].x_id + "_" + d[0].col_id }}
  const hoverFuns = {"over": function() {}, "out": function() {}}
  const opts = {"r": .75, "y_enter": 0, "x_enter": undefined, "stroke-width": .2,
		"opacity": 1, "duration": duration}
  paddings = [70, 95, 30, 15]
  var scales = getTSScales(curCountryArray.filter(f3), elem, paddings)
  scales["col"] = drugsScale();

  drawTS(elem, scales, curCountryArray, curCountryTS, keyFuns, hoverFuns,
	 [paddings[2], paddings[0]], opts, [4, 5])
  tsLegend(elem, drugsScale(), [elem.attr("width") - 87, elem.attr("height") / 4]);
  elem.select("#tsLegend")
    .selectAll("text")
    .style({"font-size": "10px"})

  // add axis labels
  const axisElem = elem.select(".axis.yaxis")
  if(elem.select("#yAxisLabel").node() == null) {
    axisElem.append("text")
      .attr({"text-anchor": "middle",
	     "id": "yAxisLabel",
	     "transform": "translate(-55, " + elem.attr("height") / 2 + ")rotate(90)"})
      .text("mg per person")
  }  
}

/**
 * drawTSRegions() wraps drawTS() to update y-positions for a region / drug
 * combination.
 *
 * @param elem {d3-selection} The SVG element over which the time series is
 * to be updated.
 * @param incb {array} An array whose i^th element is an object with a "static"
 * array and a "ts" array, containing static and time series features for the
 * i^th country.
 * @param regions {string array} An array of the regions to draw time series
 * for.
 * @param drugs {string array} An array of the drugs to draw time series for.
 * @parma duration {float} How long should transitions between plot states last?
 * @side-effects Updates the circles on the time series plot to a new country.
 */
function drawTSRegions(elem, incb, regions, drugs, duration) {
  f1 = function(d) {
    return (-1 != $.inArray(d["supp"]["json_country"], regions)) & (-1 != $.inArray(d["col_id"], drugs));
  };
  f2 = function(d) {
    return (-1 != $.inArray(d[0]["supp"]["json_country"], regions)) & (-1 != $.inArray(d[0]["col_id"], drugs))
  };

  var curCountryArray = getIncbArray(incb).filter(f1);
  var curCountryTS = getIncbTS(incb).filter(f2);
  curCountryArray = insertClass(curCountryArray);
  curCountryTS = insertTSClass(curCountryTS);

  keyFuns = {"points": function(d) { return d.x_id + "_" + d.col_id + "_" + d.appear_id },
	     "ts": function(d) { return d[0].x_id + "_" + d[0].col_id + "_" + d[0].appear_id }};
  paddings = [75, 150, 50, 40];
  labelPaddings = [paddings[2], paddings[0]]
  var scales = getTSScalesPow(curCountryArray, elem, paddings)
  scales["col"] = drugsScale();

  const opts = {"r": .8, "y_enter": 0, "x_enter": undefined, "stroke-width": .75,
		"opacity": 1, "duration": duration};
  const hoverFuns = {"over": trendOverFun("ts", opts),
		     "out": trendOutFun("ts", opts)};
  const labelHoverFuns = {"over": trendLabelOverFun(opts),
			  "out": trendLabelOutFun(opts)};

  curCountryArray = curCountryArray.filter(function(d) { return Object.keys(d).length > 1})  // not sure why additional point is appearing at end of the array
  drawTS(elem, scales, curCountryArray, curCountryTS, keyFuns, hoverFuns,
	 labelPaddings, opts, [5, 9]);
  labelTS(elem, scales, curCountryTS, keyFuns["points"], labelHoverFuns,
	  labelPaddings, opts);
  tsLegend(elem, drugsScale(), [elem.attr("width") - 100, elem.attr("height") / 4]);

  // add axis labels
  elem.select(".axis.yaxis")
    .append("text")
    .attr({"text-anchor": "middle",
	   "transform": "translate(-55, " + elem.attr("height") / 2 + ")rotate(90)"})
    .text("mg per person");

  // add title
  elem.append("text")
    .attr({"transform": "translate(" + .25 * elem.attr("width") + ", 40)",
	   "id": "trendsTitle"})
    .style({"font-size": "30px"});
}

function labelTS(elem, scales, curCountryTS, keyFun, hoverFuns, paddings, opts) {
  const endpoints = curCountryTS.map(function(d) { return d[d.length - 1] });
  newElemData = elem.selectAll(".countryTrendText")
    .data(endpoints, keyFun);

  newElemData.exit().remove();

  newElemData.enter()
    .append("text")
    .attr({"class": "countryTrendText",
	   "id": function(d) { return "label_" + d["col_id"] + "_"+ d["appear_id"]; },
	   "x": function(d) { return scales["x"](d["x_id"]) + 10; },
	   "y": function(d) { return scales["y"](d["y_id"]); }})
    .style({"fill": function(d) { return drugsScale()(d["col_id"]); }})
    .text(function(d) { return d["iso3"]; })
    .on("mouseover", hoverFuns["over"])
    .on("mouseout", hoverFuns["out"]);

  newElemData
    .transition()
    .duration(opts["duration"])
    .attr({"class": "countryTrendText",
	   "id": function(d) { return "label_" + d["col_id"] + "_"+ d["appear_id"]; },
	   "x": function(d) { return scales["x"](d["x_id"]) + 10; },
	   "y": function(d) { return scales["y"](d["y_id"]); }})
    .style({"fill": function(d) { return drugsScale()(d["col_id"]); }})
    .text(function(d) { return d["iso3"]; });
}

function tsLegend(elem, colScale, paddings) {
  var colLegend = d3.legend.color()
      .scale(colScale)
      .labelOffset(3)
      .shapeHeight(10)
      .shapeWidth(8);
  elem.append("g")
    .attr({"id": "tsLegend",
	   "transform": "translate(" + paddings[0] + "," + paddings[1] + ")"});
  elem.select("#tsLegend")
    .call(colLegend);
}

/**
 * updateShownTS() wraps drawTSRegions() so it can be called by the select
 * inputs.
 *
 * @param {}
 * @return {}
 * @side-effects Redraws the tsRegions plot according to the current drug and
 * region selections.
 */
function updateShownTS() {
  const drugs = $("#tsSelect #drugSelect").val();
  const regions = $("#tsSelect #regionSelect").val();
  elem = d3.selectAll("#tsRegions > svg")
  drawTSRegions(elem, incb, regions, drugs, 500)
}
