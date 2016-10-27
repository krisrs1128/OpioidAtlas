
################################################################################
# Script for computing multidimensional scaling on the INCB data
#
# csv output available at
# https://www.dropbox.com/s/sh9q7myopaiwe8y/incb_mds.csv?dl=0
# JSON output (used in app) available at
# https://github.com/krisrs1128/OpioidDataBrowser/tree/gh-pages/assets/js
# [incbMDS.js]
################################################################################

## ---- setup ----
# location where output files will be written
root_dir <- getwd()

## ---- libraries ----
library("ggplot2")
library("dplyr")
library("jsonlite")
library("reshape2")

## ---- data ----
#incb_file <- tempfile()
#download.file("https://www.dropbox.com/s/qxet5l7vdtxo1w3/incb.csv?dl=1", incb_file)
incb_file <- "incb.csv"
incb <- read.csv(incb_file)
keep_drugs <- c("morphine", "fentanyl", "oxycodone", "pethidine", "hydrocodone", "codeine", "total")

## ---- extract-numeric-data ----
X <- incb[, c("country", "year", keep_drugs)]
X2 <- melt(X, id.vars = c("country", "year")) %>%
  dcast(country + variable ~ year, value.var = "value") %>%
  filter(variable %in% keep_drugs) %>%
  filter(!(country %in% c("comoros", "equatorial_guinea", "gambia")))

## ---- transform ----
# impute with 0, take logs, and include differences
Z <- X2[, -c(1:2)]
Z[is.na(Z)] <- 0
Z <- log(1e-4 + Z)
Z_diff <- t(apply(Z, 1, diff))

## ---- MDS ----
Y <- cbind(Z, Z_diff)
D2 <- dist(Y)
D2_fit <- cmdscale(D2)

## ---- postprocess ----
X2 <- X2 %>%
  left_join(unique(incb[, c("country", "json_country", "iso3", "region", "subregion")]), by = "country")

json_data <- data.frame(X2[, c("country", "variable", "iso3", "json_country", "region", "subregion")],
                        D2_fit)
colnames(json_data) <- c("group_id", "col_id", "iso3", "json_country", "region", "subregion", "x_id", "y_id")

## ---- write-results ----
write.csv(json_data, file = file.path(root_dir, "incb_mds.csv"), row.names = F)
json_data <- paste0("var incbMDS = ", toJSON(json_data, auto_unbox = T))
cat(json_data, file = file.path(root_dir, "incbMDS.js"))
