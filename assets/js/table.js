function makeTable(elemID, keys, padding) {
  const width = $(elemID).width()
  var table = d3.select(elemID)
      .append("table")
      .attr({"width": width - padding / 2,
	     "height": .1 * width} )

  table.append("tr")
    .selectAll("th")
    .data(keys)
    .enter()
    .append("th")
    .text(function(d) { return d; });
  table.append("tr")
    .selectAll("td")
    .data(keys)
    .enter()
    .append("td")
    .attr("id", function(d) { return d; })
}

// add table information
function hoverTable(d, elemID, keys) {
  var table = d3.select(elemID)
  keys.forEach(function(x) {
    table.select("#" + x)
      .html(d[x])
  })
}
