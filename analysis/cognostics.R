
################################################################################
# Script for applying cognostics to the INCB data
# 
# csv output available at
# https://www.dropbox.com/s/7otn4xvru9sqgiq/incb_cogs.csv?dl=0
# JSON output (used in app) available at
# https://github.com/krisrs1128/OpioidDataBrowser/tree/gh-pages/assets/js
# [incb_histo_levels.js and incb_histo.js]
################################################################################

## ---- setup ----
# location where output files will be written
root_dir <- getwd()

## ---- libraries ----
library("jsonlite")
library("ggplot2")
library("reshape2")
library("plyr")
library("dplyr")
library("zoo")

incb_file <- tempfile()
download.file("https://www.dropbox.com/s/qxet5l7vdtxo1w3/incb.csv?dl=1", incb_file)
incb <- read.csv(incb_file)

## ---- reshape-data ----
# melt by drug
drug_names <- c("buprenorphine", "codeine", "dihydrocodeine", "ethylmorphine",
                "hydrocodone", "morphine", "oxycodone", "pholcodine",
                "dextropropoxyphene", "diphenoxylate", "methadone", "pethidine",
                "tilidine", "cocaine", "fentanyl", "alfentanil", "remifentanil",
                "sufentanil", "piritramide", "total")
mincb <- melt(incb, measure.vars = drug_names) %>%
  arrange(country, year)

## ---- impute-data ----
rev_na_locf <- function(x) {
  rev(na.locf(rev(x), na.rm = F))
}

# impute by pushing forwards (or backwards, if starts with NA)
mincb <- mincb %>%
  group_by(country, variable) %>%
  mutate(no_na_fw = na.locf(value, na.rm = F), value = rev_na_locf(no_na_fw)) %>%
  select(-no_na_fw)

## ---- compute-cogs ----
rel_increase_fun <- function(x, a = 1e-2) {
    x <- x + a
    shifts <- abs(x[-1] / x[seq_len(length(x) - 1)])
    shifts[which.max(shifts)]
}

rel_decrease_fun <- function(x, a = 1e-2) {
    x <- x + a
    shifts <- abs(x[-1] / x[seq_len(length(x) - 1)])
    shifts[which.min(shifts)]
}

abs_increase_fun <- function(x) {
    shifts <- diff(x)
    shifts[which.max(shifts)]
}

abs_decrease_fun <- function(x) {
    shifts <- diff(x)
    shifts[which.min(shifts)]
}

mincb$value <- mincb$value ^ (1/3)
rel_pseudo <- 1e-3

# compute cognostics for each
incb_cogs <- mincb %>%
  group_by(country, variable) %>%
    summarise(abs_increase = abs_increase_fun(value),
              abs_decrease = abs_decrease_fun(value),
              log_rel_increase = log(rel_increase_fun(value, rel_pseudo)),
              log_rel_decrease = log(rel_decrease_fun(value, rel_pseudo)),
              overall_rel_change = log((value[length(value)] + rel_pseudo) / (value[1] + rel_pseudo)),
              overall_change = value[length(value)] - value[1],
              first_five = mean(value[1:5]),
              second_five = mean(value[6:10]),
              third_five = mean(value[11:15]),
              fourth_five = mean(value[16:20]),
              fifth_five = mean(value[21:25]))

## ---- merge-region ----
# merge in region info
incb_cogs <- incb_cogs %>%
  merge(unique(mincb[, c("country", "json_country", "variable", "region", "subregion")]),
        by = c("country", "variable"), all.x = T)
write.csv(incb_cogs, file = file.path(root_dir, "incb_cogs.csv"), row.names = F)

## ---- histo-bins ----
keep_drugs <- c("morphine", "fentanyl", "oxycodone", "pethidine", "hydrocodone",
                "codeine", "total")

assign_quantile <- function(x, n_bins = 50) {
    finite_ix <- is.finite(x)
    cut(x[finite_ix], n_bins)
}

histo_id <- c("country", "json_country", "variable", "region", "subregion")
incb_histo <- incb_cogs %>%
  filter(variable %in% keep_drugs) %>%
  melt(id.vars = histo_id, variable.name = "cog") %>%
  dlply(.(cog), function(x) {
    data.frame(country = x$country, json_country = x$json_country,
               drug = x$variable, region = x$region,
               subregion = x$subregion, value = x$value,
               q = assign_quantile(x$value))
  })

# special case for 5 year bins, since I want them to be shared
incb_means <- melt(incb_histo[grep("five", names(incb_histo))])
incb_means$q <- assign_quantile(incb_means$value)
incb_means$variable <- NULL
incb_means <- dlply(incb_means, "L1")
incb_means$L1 <- NULL
incb_histo[grep("five", names(incb_histo))] <- NULL
incb_histo <- c(incb_histo, incb_means)

names(incb_histo) <- c("maximum one-year increase",
                       "maximum one-year decrease",
                       "log(maximum one-year relative increase)",
                       "log(maximum one-year relative decrease)",
                       "log(overall relative change)",
                       "overall change",
                       "average 2009 - 2013",
                       "average 1989 - 1993",
                       "average 2004 - 2009",
                       "average 1994 - 1998",
                       "average 1999 - 2003")

incb_histo <- incb_histo[c(6, 5, 7:11, 1:4)]

histo_levels <- toJSON(llply(incb_histo, function(x) levels(x$q)),
                       auto_unbox = T)
cat(sprintf("var incb_histo_levels = %s", histo_levels),
    file = file.path(root_dir, "incb_histo_levels.js"))

incb_histo <- llply(incb_histo, function(x) {
  x %>%
    group_by(q) %>%
    arrange(desc(value)) %>%
    mutate(rank = n():1)
})

## ---- jsonize ----
incb_histo_list <- melt(incb_histo,
                        id.vars = c("country", "json_country", "drug", "region", "subregion", "value", "q", "rank")) %>%
                          dlply(c("country", "drug"))

names(incb_histo_list) <- NULL
histo_json <- toJSON(incb_histo_list, auto_unbox = TRUE)
cat(sprintf("var incb_histo = %s", histo_json),
    file = file.path(root_dir, "incb_histo.js"))
