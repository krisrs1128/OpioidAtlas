/**
 * getMapDict() combines the incb time series with the topojson features
 *
 * @param incb {array} An array whose i^th element is an object with a "static" array
 *  and a "ts" array, containing static and time series features for the i^th
 *  country.
 * @param countries {Object} A topojson of the world.
 * @return mapDict {Object} The incb array as a keyed object.
 */
function getMapDict(incb, countries) {
  const mapData = topojson.feature(countries, countries.objects.units).features
  const mapDict = d3.map();
  for(d in mapData) {
    curCountryData = incb.filter(function(e) { return e.static.json_country == mapData[d].properties.name; })
    if(curCountryData.length > 0) {
      mapDict.set(mapData[d].properties.name, curCountryData);
    }
  }
  return mapDict;
}

/**
  * getIncbTS() converts incb time series so that there is one series
  * per drug-country pair.
  *
  * @param incb {array} An array whose i^th element is an object with a "static"
  * array and a "ts" array, containing static and time series features for the
  * i^th country.
  * @return incbTs {array} A reshaped array whose i^th element is an array
  * whose elements are dictionaries corresponding to years in the time series.
  */
function getIncbTS(incb) {
  incbTs = []
  const format = d3.time.format("%Y-%m-%d")
  for(var i = 0; i < incb.length; i++) {
    tsFields = Object.keys(incb[i].ts)
    for(var j = 0; j < tsFields.length; j++) {
      if(tsFields[j] != "years") {
	yearOrder = sortIndices(incb[i]["ts"]["years"]).sortIndices;
	curTs = []
	for(var t = 0; t < incb[i].ts[tsFields[j]].length; t++) {
	  curTs.push({"x_id": format.parse(incb[i]["ts"]["years"][yearOrder[t]]),
		      "y_id": incb[i]["ts"][tsFields[j]][yearOrder[t]],
		      "col_id": tsFields[j],
		      "appear_id": incb[i].static.country,
		      "iso3": incb[i].static.iso3,
		      "json_country": incb[i].static.json_country,
		      "supp": incb[i].static})
	}
	incbTs.push(curTs)
      }
    }
  }
  return incbTs;
}

/**
 * sortIndices returns the indices that sort an array.
 *
 * See discussion http://stackoverflow.com/questions/3730510/javascript-sort-array-and-return-an-array-of-indicies-that-indicates-the-positi
 */
function sortIndices(toSort) {
  for (var i = 0; i < toSort.length; i++) {
    toSort[i] = [toSort[i], i];
  }
  toSort.sort(function(left, right) {
    return left[0] < right[0] ? -1 : 1;
  });
  toSort.sortIndices = [];
  for (var j = 0; j < toSort.length; j++) {
    toSort.sortIndices.push(toSort[j][1]);
    toSort[j] = toSort[j][0];
  }
  return toSort;
}

/**
 * getIncbArray() reshapes the incb data so that each element is a
 * drug-country-year timepoint.
 *
 * @param incb {array} An array whose i^th element is an object with a "static"
 * array and a "ts" array, containing static and time series features for the
 * i^th country.
 * @return incbArray {array} A reshaped array whose i^th element is a dict with
 * a single year, called x_id, a single drugs quantity called y_id, a single
 * of drug name called col_id, and a field with the country name called
 * appear_id.
 */
function getIncbArray(incb) {
  incbTs = getIncbTS(incb);
  incbArray = [];
  for(var i = 0; i < incbTs.length; i++) {
    for(var j = 0; j < incbTs[i].length; j++) {
      incbArray.push({"x_id": incbTs[i][j]["x_id"],
		      "y_id": incbTs[i][j]["y_id"],
		      "col_id": incbTs[i][j]["col_id"],
		      "appear_id": incbTs[i][j]["appear_id"],
		      "iso3": incbTs[i][j]["iso3"],
		      "json_country": incbTs[i][j]["json_country"],
		      "supp": incbTs[i][0]["supp"]});
    }
  }
  return incbArray;
}

/**
 * getIncbHistoArray() processes the incb data to work with the more generic
 * drawHisto()
 *
 * @param incb_histo {array} The data array describing the incb cognostics, as
 * created in the cognostics vignette of the incbStats package. It must be
 * preprocessed to match the binData argument in drawHisto().
 * @return An array whose elements are dictionaries with bin_ids, color_ids,
 * rank_ids, and miscellaneous region / cognostic information.
 */
function getIncbHistoArray(incbHisto) {
  incbHistoArray = [];
  for(var i = 0; i < incbHisto.length; i++) {
    for(var j = 0; j < incbHisto[i].length; j++) {
      incbHistoArray.push({"bin_id": incbHisto[i][j]["q"],
			   "rank_id": incbHisto[i][j]["rank"],
			   "col_id": incbHisto[i][j]["drug"],
			   "value": incbHisto[i][j]["value"],
			   "cog": incbHisto[i][j]["L1"],
			   "subregion": incbHisto[i][j]["subregion"],
			   "region": incbHisto[i][j]["region"],
			   "group_id": incbHisto[i][j]["country"],
			   "json_country": incbHisto[i][j]["json_country"]
			  })
    }
  }
  return incbHistoArray;
}
