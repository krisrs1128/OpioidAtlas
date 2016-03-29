
// functions for hovering

/**
 * mdsOverFun() updates plots / size on mds mouseover
 *
 * @param d The data associated with the current hover. This is the usual
 * input for functions of the form .on("mousover", function(d) { ... })
 * @return {}
 * @side-effects Updates the time series plot with the current country,
 * and resizes the hovered over point.
 */
function tsOverFun(elem, opts) {
  return function(d) {
    var curCircle = d3.select(this)
    curCircle.transition()
      .duration(opts["duration"])
      .attr({"r": 2 * opts["r"]})
      .style({"font-size": 1.5 * opts["font-size"],
	      "opacity": 1})

    // get current country
    const countryIx = incb.map(function(e) { return e["static"]["country"] })
	  .indexOf(d["group_id"]);
    drawTSCountry(elem.select("#tsPlot"), incb,
		  d["group_id"], d["col_id"], opts["duration"])
    elem.select("#tsTitleText")
      .text(d["json_country"])
  }
}

/**
 * mdsOverFun() updates plots / size on mds mouseout
 *
 * @param d The data associated with the current hover. This is the usual
 * input for functions of the form .on("mouseout", function(d) { ... })
 * @return {}
 * @side-effects Returns the hovered over point to it's original size.
 */
function tsOutFun(id, opts) {
  return function(d) {
    var curCircle = d3.select(this)

    curCircle.transition()
      .duration(opts["duration"])
      .attr({"r": opts["r"]})
      .style({"font-size": opts["font-size"],
	      "opacity": opts["opacity"]})
  }
}

function trendOverFun(id, opts) {
  return function(d) {
    var curPath = d3.select(this);
    curPath.transition()
      .duration(50)
      .style({"stroke-width": 2 * opts["stroke-width"]}); // since class is "ts selected", baseline is 3 * opts["stroke-width"]

    d3.select("#trendsTitle")
      .transition().duration(50)
      .text(d[0]["json_country"]);
    
    d3.select("#label_" + d[0].col_id + "_" + d[0].appear_id)
      .transition().duration(50)
      .style({"font-size": "18px"});

  }
}

function trendOutFun(id, opts) {
  return function(d) {
    var curPath = d3.select(this);
    curPath
      .transition().duration(50)
      .style({"stroke-width": opts["stroke-width"]});

    d3.select("#label_" + d[0].col_id + "_" + d[0].appear_id)
      .transition().duration(50)
      .style({"font-size": "14px"});
  }
}

function trendLabelOverFun(opts) {
  return function(d) {
    var curText = d3.select(this);
    curText
      .transition().duration(50)
      .style({"font-size": "18px"})
    d3.select("#series_" + d["col_id"] + "_" + d["appear_id"])
      .transition().duration(50)
      .style({"stroke-width": 2 * opts["stroke-width"]})

    d3.select("#trendsTitle")
      .transition().duration(50)
      .text(d["json_country"]);
  }
}

function trendLabelOutFun(opts) {
  return function(d) {
    var curText = d3.select(this);
    curText
      .transition().duration(50)
      .style({"font-size": "14px"})

    d3.select("#series_" + d["col_id"] + "_" + d["appear_id"])
      .transition().duration(50)
      .style({"stroke-width": opts["stroke-width"]})
  }
}

