
################################################################################
# Script to preprocess data received from INCB. Result available at:
# https://www.dropbox.com/s/9vvg5os1rfvncv9/incb.csv?dl=0
################################################################################

## ---- setup ----
# only part of this script that needs to be updated depending on user's
# directories
root_dir <- getwd()

## ---- libraries ----
library("devtools")
library("jsonlite")
library("gdata")
library("maptools")
library("plyr")
library("dplyr")
library("stringr")
library("stringdist")

## ---- process-fun ----
get_incb_df <- function(type = "principal") {
  # get data
  type <- match.arg(type, c("principal", "analogues"))
  if(type == "principal") {
    incb_link <- "https://www.dropbox.com/s/kfp5iw7m6wnet0y/Table%20XII.Consumption%20of%20principal%20narcotic%20drugs%20%281989-2013%29.xls?dl=1"
    names_ix <- 2
  } else {
    incb_link <- "https://www.dropbox.com/s/qbl1pmlvheqx6bs/Table%20XIII.1.Consumption%20of%20fentanyl%20analogues%20in%20grams%20%281989-2013%29.xls?dl=1"
    names_ix <- 3
  }
  incb_file <- tempfile()
  download.file(incb_link, incb_file)
  incb <- read.xls(incb_file, stringsAsFactors = F)

  # fix column names
  colnames(incb) <- tolower(make.names(incb[names_ix, ]))
  drugs <- c("buprenorphine", "codeine", "dihydrocodeine", "ethylmorphine", "hydrocodone",
             "morphine", "oxycodone", "pholcodine", "dextropropoxyphene", "diphenoxylate",
             "methadone", "pethidine", "tilidine", "cocaine", "fentanyl", "alfentanil",
             "remifentanil", "sufentanil", "piritramide")
  colnames(incb) <- sapply(colnames(incb), function(x) {
    drugs[which.min(stringdist(x, drugs))]
  })
  colnames(incb)[1:2] <- c("country", "year")

  # filter to rows with actual data
  min_ix <- min(which(incb$country == "Afghanistan"))
  max_ix <- max(which(incb$country == "Zimbabwe"))
  incb <- incb[min_ix:max_ix, ]

  # fix country names
  data(matched_names)
  incb$country <- tolower(incb$country)
  incb$country <- as.factor(matched_names[incb$country])
  incb <- incb[!is.na(incb$country), ]

  # fix data types
  incb$year <- as.POSIXct(sprintf("%s-01-01", incb$year), format = "%Y-%m-%d")
  drug_ix <- setdiff(colnames(incb), c("country", "year"))
  string_to_num <- function(x) {
    x <- gsub(" ", "", x)
    as.numeric(x)
  }

  incb[, drug_ix] <- colwise(string_to_num)(incb[, drug_ix])
  if(type == "analogues") {
    incb[, drug_ix] <- 0.001 * incb[, drug_ix] # put everything into kilograms
  }

  # correct the country names
  data(matched_names)
  incb$country[matched_names]

  return (incb)
}

## ---- apply-process ----
principal <- get_incb_df(type = "principal")
analogues <- get_incb_df(type = "analogues")

# some complications due to changing countries (e.g. fall of soviet union)
sort(table(principal$country), decreasing = T)[1:10]
filter(principal, country == "czech_republic")
principal <- principal %>%
  group_by(country, year) %>%
  summarise_each(funs(sum))
sort(table(analogues$country), decreasing = T)[1:10]
analogues <- analogues %>%
  group_by(country, year) %>%
  summarise_each(funs(sum))

## ---- get-geo-data ----
data(wrld_simpl)
geo <- data.frame(country = tolower(gsub(" ", "_", wrld_simpl$NAME)),
                  region = wrld_simpl$REGION,
                  subregion = wrld_simpl$SUBREGION,
                  area = wrld_simpl$AREA,
                  pop2005 = wrld_simpl$POP2005,
                  iso3 = wrld_simpl$ISO3,
                  lon = wrld_simpl$LON, lat = wrld_simpl$LAT)

# taken from https://en.wikipedia.org/wiki/UN_M.49
region_map <- c("19" = "Americas", "2" = "Africa", "142" = "Asia", "150" = "Europe",
                "9" = "Oceania", "0" = NA)
subregion_map <- c("29" = "carribean", "15" = "northern_africa",
                   "145" = "western_asia",  "39" = "southern_europe",
                   "17" = "middle_africa",  "61" = "polynesia", "5" = "south_america",
                   "53" = "australia_nz", "21" = "north_america",  "34" = "southern_asia",
                   "13" = "central_america", "35" = "southeast_asia", "11" = "west_africa",
                   "54" = "melanesia", "151" = "eastern_europe", "14" = "east_africa",
                   "30" = "east_asia", "154" = "northern_europe", "155" = "western_europe",
                   "57" = "micronesia", "143" = "central_asia", "0" = NA, "18" = "south_africa")
geo$subregion <- subregion_map[as.character(geo$subregion)]
geo$region <- region_map[as.character(geo$region)]

## ---- merge ----
incb <- merge(principal, analogues, by = c("country", "year"), all.x = T)
incb <- merge(incb, geo, by = "country", all.x = T)
data(indicators)
incb <- merge(incb, indicators, by = "country", all.x = T)
incb <- arrange(incb, country, year)

## ---- quantize ----
incb$drug_sum <- rowSums(incb[, 3:21], na.rm = T)
incb <- incb %>%
  group_by(country, year) %>%
  mutate(all_years_sum = sum(drug_sum))
incb$drug_level <- cut(incb$all_years_sum,
                       breaks = unique(quantile(incb$all_years_sum)),
                       include.lowest = T)

## ---- normalize ----
d3_countries <- read.csv("https://www.dropbox.com/s/j62qyi5zoxonssu/d3_match_countries.csv?dl=1")
colnames(d3_countries) <- c("country", "json_country")
incb <- merge(incb, d3_countries, by = "country")
incb <- incb %>%
  filter(pop2005 > 1e5)

keep_drugs <- c("morphine", "fentanyl", "oxycodone", "pethidine", "hydrocodone", "codeine")
keep_ix <- apply(incb[, keep_drugs], 1, function(x) all(!is.na(x))) # only those which are non-na for all years
incb <- incb[keep_ix, ]

## ---- equivalents ----

# convert to morphine equivalents
incb$codeine <- .15 * incb$codeine
incb$fentanyl <- 2.4 * incb$fentanyl
incb$methadone <- 4 * incb$methadone
incb$oxycodone <- 1.5 * incb$oxycodone

## ---- write-output ----
incb$total <- rowSums(incb[, keep_drugs])
keep_drugs <- c(keep_drugs, "total")
incb <- incb %>%
  arrange(country, year)
incb2 <- as.data.frame(incb)
write.csv(incb2, file.path(root_dir, "incb.csv"))

## ---- json-output ----
incb2 <- dlply(incb2, .(country), function(x) {
  static <- list(country = x$country[1],
                 json_country = x$json_country[1],
                 iso3 = x$iso3[1],
                 region = x$region[1],
                 subregion = x$subregion[1],
                 gdp = x$gdp[1],
                 gdp_num = x$gdp_num[1])
  ts <- list(years = x$year)
  for(drug in keep_drugs) {
    if(all(!is.na(x[drug]))) {
      ts[drug] <- x[drug]
    }
  }
  list(static = static, ts = ts)
})
names(incb2) <- NULL


cat(sprintf("var incb = %s", toJSON(incb2, auto_unbox = TRUE)),
    file = file.path(root_dir, "incb.js"))
