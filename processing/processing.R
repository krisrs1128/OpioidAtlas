
################################################################################
# Script to preprocess data received from INCB. Result available at:
# https://www.dropbox.com/s/9vvg5os1rfvncv9/incb.csv?dl=0
################################################################################

## ---- setup ----
# only part of this script that needs to be updated depending on user's
# directories
root_dir <- "~/Documents/programming/OpioidAtlas/assets/js"

## ---- libraries ----
library("devtools")
library("jsonlite")
library("gdata")
library("maptools")
library("plyr")
library("dplyr")
library("reshape2")
library("stringr")
library("stringdist")

## ---- process-fun ----
get_incb_df <- function(data_dir = "~/Desktop/opioid_data") {
  # read in and reshape ata
  data_paths <- list.files(data_dir, full.names = TRUE)
  incb <- lapply(data_paths, read.csv, skip = 3)
  names(incb) <- sub("[.][^.]*$", "", basename(data_paths), perl=TRUE)
  mincb <- melt(incb) %>%
    filter(variable != "Grand.Total")

  # clean original variables and variable names
  mincb$variable <- gsub("X", "01-01-", mincb$variable) %>%
    as.Date("%m-%d-%Y")
  colnames(mincb) <- c("country", "region", "subregion", "year", "value", "opioid")
  mincb$country <- tolower(gsub(" ", "_", mincb$country))
  mincb$subregion <- NULL
  mincb$region <- NULL

  # use country names compatible with D3
  matched_countries <- read.csv(
    "https://www.dropbox.com/s/6ljf4yhvph9pzm4/matched_country_names.csv?dl=1",
    stringsAsFactors = FALSE
  )
  matched_countries[which(matched_countries$raw_country == "united_states"), "raw_country"] <- "united_states_of_america"
  matched_countries[which(matched_countries$raw_country == "russia"), "raw_country"] <- "russian_federation"
  matched_countries[which(matched_countries$raw_country == "bolivia (plurinational state of)"), "raw_country"] <- "bolivia_(plurinational_state_of)"
  matched_countries[which(matched_countries$raw_country == "venezuela"), "raw_country"] <- "venezuela_(bolivarian_rep._of)"
  matched_countries[which(matched_countries$raw_country == "lao_people's_democratic_republic"), "raw_country"] <- "lao_people's_democratic_republic_"
  matched_countries[which(matched_countries$raw_country == "republic of korea"), "raw_country"] <- "republic_of_korea"
  matched_countries[which(matched_countries$raw_country == "democratic people's republic of korea"), "raw_country"] <- "democratic_people's_republic_of_korea"
  matched_countries[which(matched_countries$raw_country == "cote_d'ivoire"), "raw_country"] <- "c\364te_d'ivoire"

  match_ix <- match(tolower(mincb$country), matched_countries$raw_country)
  country_label <- c("country", "json_country")
  mincb[, country_label] <- matched_countries[match_ix, country_label]
  mincb <- mincb[!is.na(mincb$country), ]

  # cast to wide
  mincb %>%
    dcast(country + json_country + year ~ opioid, value.var = "value")
}

## ---- apply-process ----
incb <- get_incb_df()

## ---- get-geo-data ----
data(wrld_simpl)
geo <- data.frame(
  country = tolower(gsub(" ", "_", wrld_simpl$NAME)),
  region = wrld_simpl$REGION,
  subregion = wrld_simpl$SUBREGION,
  area = wrld_simpl$AREA,
  pop2005 = wrld_simpl$POP2005,
  iso3 = wrld_simpl$ISO3,
  lon = wrld_simpl$LON, lat = wrld_simpl$LAT
)

# taken from https://en.wikipedia.org/wiki/UN_M.49
region_map <- c(
  "19" = "Americas",
  "2" = "Africa",
  "142" = "Asia",
  "150" = "Europe",
  "9" = "Oceania",
  "0" = NA
)

subregion_map <- c(
  "29" = "carribean",
  "15" = "northern_africa",
  "145" = "western_asia",
  "39" = "southern_europe",
  "17" = "middle_africa",
  "61" = "polynesia",
  "5" = "south_america",
  "53" = "australia_nz",
  "21" = "north_america",
  "34" = "southern_asia",
  "13" = "central_america",
  "35" = "southeast_asia",
  "11" = "west_africa",
  "54" = "melanesia",
  "151" = "eastern_europe",
  "14" = "east_africa",
  "30" = "east_asia",
  "154" = "northern_europe",
  "155" = "western_europe",
  "57" = "micronesia",
  "143" = "central_asia",
  "0" = NA,
  "18" = "south_africa"
)
geo$subregion <- subregion_map[as.character(geo$subregion)]
geo$region <- region_map[as.character(geo$region)]

## ---- merge ----
incb <- merge(incb, geo, by = "country", all.x = T) %>%
  arrange(country, year)

## ---- filter ----
incb <- incb %>%
  filter(pop2005 > 1e5)

keep_drugs <- c(
  "morphine",
  "fentanyl",
  "oxycodone",
  "pethidine",
  "hydrocodone",
  "codeine"
)

# only those which are non-na for all years
#keep_ix <- apply(incb[, keep_drugs], 1, function(x) all(!is.na(x)))
#incb <- incb[keep_ix, ]
incb[, keep_drugs][is.na(incb[, keep_drugs])] <- 0

## ---- equivalents ----
# convert to morphine equivalents
incb$codeine <- .15 * incb$codeine
incb$fentanyl <- 2.4 * incb$fentanyl
incb$oxycodone <- 1.5 * incb$oxycodone
incb$pethidine <- .1 * incb$pethidine

## ---- write-output ----
incb$total <- rowSums(incb[, keep_drugs], na.rm = TRUE)
keep_drugs <- c(keep_drugs, "total")
incb <- incb %>%
  arrange(country, year)
incb2 <- as.data.frame(incb)
#write.csv(incb2, file.path(root_dir, "incb.csv"), row.names = F)

## ---- json-output ----
incb2 <- dlply(incb2, .(country), function(x) {
  static <- list(
    country = x$country[1],
    json_country = x$json_country[1],
    iso3 = x$iso3[1],
    region = x$region[1],
    subregion = x$subregion[1],
    gdp = x$gdp[1],
    gdp_num = x$gdp_num[1]
  )
  ts <- list(years = x$year)

  for (drug in keep_drugs) {
    if (all(!is.na(x[drug]))) {
      ts[drug] <- x[drug]
    }
  }
  list(static = static, ts = ts)
})

names(incb2) <- NULL
cat(sprintf("var incb = %s", toJSON(incb2, auto_unbox = TRUE)),
    file = file.path(root_dir, "incb.js"))
