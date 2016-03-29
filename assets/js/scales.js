
/**
 * mgToColsScale() creates a threshold scale mapping mg's of a drug to a color
 *
 * @param mg {array, optional} An array of threshold scale cutoffs for the drug
 * milligrams. Defaults to something growing exponentially.
 * @param cols {array, optional} An array giving the colors between each
 * threshold group. Defaults to something chosen using
 * http://gka.github.io/palettes/. Refined with https://color.adobe.com/nl/create/.
 * @return {d3-scale} The threshold scale mapping milligrams to colors.
 */
function mgToColsScale(drug, mg) {
  // fill in domain default
  if(typeof mg == "undefined") {
    mg = [0, 0.010, 0.037, 0.139, 0.518, 1.931, 7.197, 26.827, 100, 1000]
    // round(10 ^ seq(-2, log(100, 10), length.out = 8), 3), with 0, and 1000 at start and end
  }

  var cols = [];
  switch (drug) {
  case "oxycodone":
    cols = ["#ffded6", "#ffbdae", "#ff9c88", "#fa7963", "#f05340", "#e41a1c", "#bb1e19", "#941e17", "#6e1c14", "#4b1710", "#291109"];
    break;
  case "morphine":
    cols = ["#efe1f0", "#dec3e0", "#cda5d1", "#bc88c1", "#aa6bb2", "#984ea3", "#7d4286", "#63366a", "#4b2a4f", "#331f36", "#1d131e"];
    break;
  case "pethidine":
    cols = ["#e1e8f3", "#c2d2e7", "#a3bcdc", "#84a7d0", "#6192c4", "#377eb8", "#316897", "#2b5377", "#243e58", "#1c2b3b", "#131921"];
    break;
  case "fentanyl":
    cols = ["#e3f2e0", "#c7e5c1", "#abd8a3", "#8eca85", "#6fbd68", "#4daf4a", "#42903f", "#377133", "#2c5428", "#20391d", "#152013"];
    break;
  case "hydrocodone":
    cols = ['#ffe3d6','#ffc8ae','#ffac87','#fa9061','#f1743b','#e6550d','#bd4810','#953b11','#6f2e11','#4b210f','#291509'];
    break;
  case "codeine":
    cols = ['#deeced','#bdd9dc','#9bc7cb','#78b4ba','#52a2a9','#1c9099','#1f777e','#1e5e63','#1c474a','#173033','#111c1d']
    break;
  case "total":
    cols = ['#ffe1ec','#ffc2da','#ffa2c8','#ff80b6','#ff59a4','#ff1493','#d01e79','#a32060','#791e48','#501a31','#2b121c']
    break;
  }

  return d3.scale.threshold()
    .domain(mg)
    .range(cols);
}

/**
 * drugsScale() creates an ordinal scale mapping drugs to colors
 *
 * @param drugs {string-array} The names of the drugs to associate colors with.
 * Defaults to ["oxycodone", "pethidine", "fentanyl", "morphine"]
 * @param cols {array of color strings} The names of the colors to associate the
 * different drugs.
 * @return {d3-scale} The ordinal scale mapping drugs to colors.
 */
function drugsScale(drugs, cols) {
  // fill in domain default
  if(typeof drugs == "undefined") {
    drugs = ["oxycodone", "pethidine", "fentanyl", "morphine", "hydrocodone", "codeine", "total"]
  }

  // fill in range default
  if(typeof cols == "undefined") {
    cols = ["#e41a1c","#377eb8","#4daf4a","#984ea3", "#e6550d", "#1c9099", "#ff59a4"]
  }

  return d3.scale.ordinal()
    .domain(drugs)
    .range(cols);
}

/**
 * getLinearScale() gets the linear scale for a data set
 *
 * @param data {array} An array whose elements will be points on the time
 * series. Each array element must be a dictionary with the fields x_id, y_id,
 * and col_id.
 * @param id {string} The name of the field in data to use for the domain in
 * the scale.
 * @param size {length 2 array} The bounds for the SVG on which the scale will
 * be applied.
 * @param paddings {length 4 float array} How much padding (pixels) should the
 * scales allow, across each of the sides of the SVG?
 * @return xScale {d3-scale} The linear scale associated the data input.
 */
function getLinearScale(data, id, paddings, size) {
  const x = data.map(function(d) { return d[id]; });
  var xScale = d3.scale.linear()
      .domain(d3.extent(x))
      .range([size - paddings[0], paddings[1]]);
  return xScale;
}

function getPowScale(data, id, paddings, size, lambda = 1/3) {
  const x = data.map(function(d) { return d[id]; });
  const xScale = d3.scale.pow()
	.exponent(lambda)
	.domain(d3.extent(x))
	.range([size - paddings[0], paddings[1]]);
  return xScale;
}

/**
 * getTimeScale() gets the time series scale for a data set
 *
 * @param data {array} An array whose elements will be points on the time
 * series. Each array element must be a dictionary with the fields x_id, y_id,
 * and col_id.
 * @param id {string} The name of the field in data to use for the domain in
 * the scale.
 * @param size {length 2 array} The bounds for the SVG on which the scale will
 * be applied.
 * @param paddings {length 4 float array} How much padding (pixels) should the
 * scales allow, across each of the sides of the SVG?
 * @return xScale {d3-scale} The time scale associated the data input.
 */
function getTimeScale(data, id, paddings, size) {
  const x = data.map(function(d) { return d[id]; });
  const xScale = d3.time.scale()
	.domain(d3.extent(x))
	.range([paddings[0], size - paddings[1]]);
  return xScale;
}

/**
 * getScatterScales() gets scales for a scatterplot associated with an SVG
 *
 * @param data {array} An array whose elements will be points on the time
 * series. Each array element must be a dictionary with the fields x_id, y_id,
 * and col_id.
 * @param elem {d3-selection} The SVG element with width and height attributes,
 * @param paddings {length 4 float array} How much padding (pixels) should the
 * scales allow, across each of the sides of the SVG?
 * @return An object with the following elements,
 *   x: The linear scale associated with the x_id field.
 *   y: The linear scale associated with the y_id field.
 *   col: The drug colors scale.
 */
function getScatterScales(data, elem, paddings) {
  const size = [elem.attr("width"), elem.attr("height")]
  var xScale = getLinearScale(data, "x_id", paddings.slice(0, 2), size[0])
  xScale = xScale.range(xScale.range().reverse())
  var yScale = getLinearScale(data, "y_id", paddings.slice(2, 4), size[1])
  return {"x": xScale, "y": yScale};
}

/**
 * getTSScales() gets scales for a time series associated with an SVG
 *
 * @param data {array} An array whose elements will be points on the time
 * series. Each array element must be a dictionary with the fields x_id, y_id,
 * and col_id.
 * @param elem {d3-selection} The SVG element with width and height attributes,
 * @param paddings {length 4 float array} How much padding (pixels) should the
 * scales allow, across each of the sides of the SVG?
 * @return An object with the following elements,
 *   x: The time scale associated with the x_id field.
 *   y: The linear scale associated with the y_id field.
 *   col: The drug colors scale.
 */
function getTSScales(data, elem, paddings) {
  const size = [elem.attr("width"), elem.attr("height")]
  const xScale = getTimeScale(data, "x_id", paddings.slice(0, 2), size[0]);
  data.push({"y_id": 0}); // ensure start at 0
  const yScale = getLinearScale(data, "y_id", paddings.slice(2, 4), size[1]);
  return {"x": xScale, "y": yScale};
}

function getTSScalesPow(data, elem, paddings) {
  const size = [elem.attr("width"), elem.attr("height")]
  const xScale = getTimeScale(data, "x_id", paddings.slice(0, 2), size[0]);
  data.push({"y_id": 0}); // ensure start at 0
  const yScale = getPowScale(data, "y_id", paddings.slice(2, 4), size[1]);
  return {"x": xScale, "y": yScale};
}

/**
 * insertRanks() getes the ranks of dots within each bin
 *
 * @param binData {array} An array with fields "bin_id" and "rank_id" for each
 * dot in dot histogram. "bin_id" species the bin in which the point belongs,
 * while "rank_id" species the height of the dot within that bin (but just it's
 * rank, not actual pixel values).
 * @param bins The bin id's / domain within which we will rank.
 * @return binData The original array, but with a "rank_id" added to each
 * element, specifying it's rank in the array.
 */
function insertRanks(binData, bins) {
  uniqueBins = d3.set(bins).values()
  var indices = d3.range(binData.length)
  for(var i = 0; i < uniqueBins.length; i++) {
    curBinIx = indices.filter(function(j) { return binData[j].bin_id == uniqueBins[i]})
    curBinData = binData.filter(function(d, j) { return $.inArray(j, curBinIx) != -1 })
    curRanks = sortIndices(curBinData.map(function(d) { return d.value })).sortIndices
    for(var j = 0; j < curBinIx.length; j++) {
      binData[curBinIx[j]]["rank_id"] = curRanks[j];
    }
  }
  return binData
}

/** histoScales() gets the scales associated with a dot histogram
 *
 * @param binData {array} An array with fields "bin_id" and "rank_id" for each
 * dot in dot histogram. "bin_id" species the bin in which the point belongs,
 * while "rank_id" species the height of the dot within that bin (but just it's
 * rank, not actual pixel values).
 * @param binDomain {array} An array of the possible bin values. This is
 * important because there may be some bin id's with no dots in them.
 * @param elem {d3-selection} The SVG element with width and height attributes,
 * @param paddings {gloat} How much padding (pixels) should the scales allow?
 * @return An array with the following three elements
 *   bin: The scale mapping binDomain id's to positions on the SVG
 *   rank: The scale mapping the ranks to heights on the SVG
 *   col: The drug colors scale.
 */
function histoScales(binData, binDomain, elem, paddings) {
  // get the ranks in each bin associated with points
  const bins = binData.map(function(d) { return d["bin_id"]} );
  binData = insertRanks(binData, bins);
  const ranks = binData.map(function(d) { return d["rank_id"]} );
  lowerEndpoints = d3.set(bins).values()
    .map(function(b) {
      j = b.indexOf(",")
      return parseFloat(b.slice(1, j))
  })

  // which of the bins do we actually need to display for the current data?
  binDomain = binDomain.filter(function(b) {
    j = b.indexOf(",")
    b = parseFloat(b.slice(1, j))
    return (b >= d3.min(lowerEndpoints)) & (b <= d3.max(lowerEndpoints)) // not all the bins for this cog are necessarily engaged
  })

  // build the scales
  const binScale = d3.scale.ordinal()
      .domain(binDomain)
      .rangePoints([elem.attr("height") - paddings[3], paddings[2]]);
  const rankScale = d3.scale.linear()
	.domain(d3.extent(ranks))
	.range([paddings[0], elem.attr("width") - paddings[1]])
  return {"bin": binScale, "rank": rankScale}
}
