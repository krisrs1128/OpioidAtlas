
function drawText(elem, data, scales, keyFun, hoverFuns, opts) {
  newElemData = elem.selectAll(".mdsText")
    .data(data, keyFun)

  newElemData.enter()
    .append("text")
    .attr({"x": function(d) { return scales.x(d["x_id"]) },
	   "y": function(d) { return scales.y(d["y_id"]) },
	   "fill": function(d) { return scales.col(d["col_id"]) },
	   "class": "mdsText"
	  })
    .text(function(d) { return d["iso3"] })
    .style({"font-size": opts["font-size"],
	    "opacity": opts["opacity"]})
    .on("mouseover", hoverFuns["over"])
    .on("mouseout", hoverFuns["out"])

  newElemData.exit().remove()

  newElemData.transition()
    .duration(opts["duration"])
    .attr({"x": function(d) { return scales.x(d["x_id"]) },
	   "y": function(d) { return scales.y(d["y_id"]) },
	   "fill": function(d) { return scales.col(d["col_id"]) }
	  })
}
