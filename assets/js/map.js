// functions to setup the map

function getBounds(features, path) {
  bounds = {"right": 0, "left": 0, "top": 0, "bottom": 0}
  for(var i = 0; i < features.length; i++) {
    var curBounds = path.bounds(features[i]);
    if(curBounds[0][0] < bounds["left"]) {
      bounds["left"] = curBounds[0][0];
    }
    if(curBounds[1][0] > bounds["right"]) {
      bounds["right"] = curBounds[1][0];
    }
    if(curBounds[0][1] < bounds["bottom"]) {
      bounds["bottom"] = curBounds[0][1];
    }
    if(curBounds[1][1] > bounds["top"]) {
      bounds["top"] = curBounds[1][1];
    }
  }
  return bounds;
}

function getAppropriateProj(parentSVG, features) {
  const proj = d3.geo.equirectangular()
	.scale(1)
	.translate([0, 0])

  const path = d3.geo.path().projection(proj)
  const bounds = getBounds(features, path);

  // I'm trying to follow this
  // http://stackoverflow.com/questions/14492284/center-a-map-in-d3-given-a-geojson-object
  const height = parentSVG.attr("height"),
	width = parentSVG.attr("width")
  const s = .9 / Math.max((bounds["right"] - bounds["left"]) / width,
			  (bounds["bottom"] - bounds["top"]) / height),
	t = [(width - s * (bounds["right"] + bounds["left"])) / 2,
	     (height - s * (bounds["bottom"] + bounds["top"])) / 1.7]
  return {"s": s, "t": t, "proj": proj.scale(s).translate(t)}
}


/**
 * setupMap() instantiates the map on the map SVG element
 *
 * @param parentSVG  {d3-selection} The SVG on which we will draw the map "g"
 * element.
 * @param countries {Object} A topojson of the world.
 * @return None
 * @side-effects Attaches the map "g" element to the parentSVG, with paths as
 * specified by the countries json. This has nothing to do with the incb data.
 */
function setupMap(parentSVG, countries, incb, hoverFun) {
  const features = topojson.feature(countries, countries.objects.units).features
  const height = parentSVG.attr("height"),
	width = parentSVG.attr("width");
  const proj = getAppropriateProj(parentSVG, features)["proj"];
  // const proj =  d3.geo.equirectangular()

  // draw the map
  const mapElem = parentSVG.append("g")
  mapElem.selectAll(".mapPath")
    .data(features)
    .enter()
    .append("path")
    .attr({"d": d3.geo.path().projection(proj),
	   "class": "mapPath",
	   "fill": "#F7F7F7",
	   "stroke-width": ".2px",
	   "stroke": "black",
	   "fill-opacity": .9})

  mapElem.selectAll(".mapPath")
    .on("mouseover", hoverFun)

  mapElem.selectAll(".mapPath")
    .on("mouseout", function(d) {
      d3.select(this).attr("fill-opacity", .9);
    })

  return mapElem;
}

function getCountryMatch(jsonCountry, incb) {
  jsonCountries = incb.map(function(d) { return d.static.json_country })
  wrldSimpleCountries = incb.map(function(d) { return d.static.country })
  countryIX = jsonCountries.indexOf(jsonCountry)
  country = wrldSimpleCountries[countryIX]
  return {"countryIx": countryIX, "country": country}
}

function mapHoverFun(d) {
  // get current country
  var countryMatch = getCountryMatch(d.properties.name, incb)

  d3.select(this).attr("fill-opacity", 1);
  var curDrug = $("#mapSelect #drugSelect").val()
  var elem = d3.select("#countryTS")
  drawTSCountry(elem, incb, countryMatch.country, curDrug, 1000)

  // smaller font
  elem.selectAll("#tsLegend text")
    .style("font-size", "9.5px")
  d3.select("#tsTitle")
    .text(d.properties.name)
}

/**
 * updateMap() updates the map colors based on the current drug and year
 * selections.
 *
 * @param mapElem {d3-selection} The "g"-element containing the original map
 * projection. We will need to update colors based on the selections and the
 * incb data.
 * @param mapDict {object} The output of getMapDict(). An object whose elements
 * are country level objects, each of which ahs two arrays (one for static and
 * another for time series features).
 * @param curDrug {string} A string specifying the name of the currently
 * selected drug.
 * @param curYearIx {int} An integer specifying the current year (by its
 * distance from the start year).
 * @param mgToCols A color scale that takes the mg for a drug and returns the
 * map color to associate it with.
 * @return {}
 * @side-effects Updates the map colors based on the current year and country.
 */
function updateMap(mapElem, mapDict, curDrug, curYearIx, mgToCols) {
  mapElem.selectAll(".mapPath")
    .transition()
    .duration(1000)
    .attr("fill", function(d) {
      curCountry = mapDict.get(d.properties.name)
      if(typeof curCountry != "undefined") {
	return mgToCols(curCountry[0].ts[curDrug][curYearIx]);
      } else {
	return "#D3D3D3";
      }
    })

  // draw the legend and legend title
  mgLegend = d3.legend.color()
    .scale(mgToColsScale(curDrug))
    .shapeHeight(8)
    .labels(["0", "0.000 - 0.010", "0.010 - 0.037", "0.037 - 0.139", "0.139 - 0.518", "0.518 - 1.931", "1.931 - 7.197", "7.197 - 26.83", "26.83 - 100.0", "100.0 - 1000.0", " > 1000.0"])
    .labelOffset(3)
    .shapePadding(0)
    .ascending(true)
  mapElem.select("#mgLegend")
    .style("font-size", "9px")
    .call(mgLegend)
}

/**
 * mapPage() sets up the SVG for the map and draws it
 *
 * @param incb {array} An array whose i^th element is an object with a "static"
 * array and a "ts" array, containing static and time series features for the
 * i^th country.
 * @param countries {Object} A topojson of the world.
 * @param width {float} The width of the map SVG.
 * @param height {float} The height of the map SVG.
 * @return  {}
 * @side-effects Appends a background rect and map projection, but without
 * actual incb data colors.
 */
function setupMapVis(incb, countries, width, height) {
  const SVG = setupSVG("#map", width, height, "#F7F7F7");
  SVG.attr({"id": "mapSVG"})

  // setup map and ts rects + SVGs
  tsElem = SVG
  tsElem.append("g")
    .attr({"id": "countryTS",
	   "width": .33 * width,
	   "height": .4 * height,
	   "transform": "translate(0, " + .6 * height + ")"})

  // draw the title for the time series plot
  var titleHeight = .07 * height;
  SVG.append("rect")
    .attr({"width": width,
	   "height": .6 * height,
	   "fill": "#F7F7F7"});
  SVG.append("text")
    .attr({"id": "tsTitle",
	   "transform": "translate(60," + (.6 * height - 5) + ")"})
    .style({"font-size": titleHeight + "px"})


  // setup a legend and legend title
  SVG.append("g")
    .attr({"id": "mgLegend",
	   "transform": "translate(" + .45 * width + "," + .68 * height + ")"})
  SVG.append("g")
    .attr({"transform": "translate(" + .45 * width + "," + (.68 * height - 7) + ")"})
    .append("text")
    .text("mg per person")
    .style("font-size", 10)

  const mapElem = setupMap(SVG, countries, incb, mapHoverFun);
}

/**
 * updateMapColors() updates the map using colors from the slider and drug
 * selections.
 *
 * @side-effects Updates the map using the #slider and #drugSelect inputs.
 * Technically, the map isn't fully redrawn -- only the colors are changed.
 */
function updateMapColors() {
  const year = $("#mapSlider")[0].value;
  d3.select("#mapYearInput text")
    .text("Year: " + year)
  const drug = $("#mapSelect #drugSelect option:selected").text();
  if(drug.length == 0) drug = "morphine";
  const mapElem = d3.select("#map");
  const mapDict = getMapDict(incb, countries);
  updateMap(mapElem, mapDict, drug, year - 1989, mgToColsScale(drug));
}
