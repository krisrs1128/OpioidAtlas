
################################################################################
# Script for computing local regressions on the INCB data
# 
# csv output available at
# https://www.dropbox.com/s/gjgz7c5dn93oyt5/incb_local_reg.csv?dl=0
# JSON output (used in app) available at
# https://github.com/krisrs1128/OpioidDataBrowser/tree/gh-pages/assets/js
# [incb_local_reg.js]
################################################################################

## ---- setup ----
# location where output files will be written
root_dir <- getwd()

## ---- libraries ----
library("reshape2")
library("plyr")
library("dplyr")
library("ggplot2")
library("jsonlite")
library("data.table")

## ---- data ----
incb_file <- tempfile()
download.file("https://www.dropbox.com/s/qxet5l7vdtxo1w3/incb.csv?dl=1", incb_file)
incb <- read.csv(incb_file)
keep_drugs <- c("morphine", "fentanyl", "oxycodone", "pethidine", "hydrocodone", "codeine", "total")

## ---- funs ----
k_fun <- function(x0, x, h) {
    diag(exp(-(1 / h) * (x - x0)^ 2))
}

weighted_regr_coef <- function(x, W, y, lambda) {
    B <- cbind(1, x)
    Lambda <- diag(c(0, lambda))
    solve(t(B) %*% W %*% B + Lambda) %*% t(B) %*% W %*% y
}

local_regr_fits <- function(x, y, targets, h, lambda) {
    y_hat <- vector(length = length(targets))
    beta <- vector(length = length(targets), mode = "list")
    for(i in seq_along(targets)) {
        bi <- c(1, targets[i])
        Wi <- k_fun(x, targets[i], h)
        beta[[i]] <- weighted_regr_coef(x, Wi, y, lambda)
        rownames(beta[[i]]) <- c("intercept", "slope")
        y_hat[i] <- t(bi) %*% beta[[i]]
    }
    list(y_hat = y_hat, betas = beta)
}

## ---- reshape ----
keep_cols <- c("country", "year", keep_drugs, "iso3", "region", "subregion",
               "json_country", "total")
mincb <- incb[, keep_cols] %>%
  melt(id.vars = c("country", "year", "json_country", "iso3", "region", "subregion"),
       variable.name = "drug") %>%
  filter(drug %in% keep_drugs) %>%
  arrange(country, drug, year)

## ---- run-regs ----
series_fit <- function(ts, h = 1, lambda = 0.01) {
    x <- year(ts$year) - 1989
    y <- ts$value ^ (1 / 3)
    targets <- seq_len(nrow(ts))
    fit  <- local_regr_fits(x, y, targets, h, lambda)
    mbeta <- melt(fit$beta) %>%
        dcast(L1 + Var2 ~ Var1, value.var = "value")
    mbeta[, "target"] <- targets[mbeta[, "L1"]]

    mbeta[, "y_hat"] <- fit$y_hat
    mbeta[, "y"] <- y
    mbeta
}

fits <- mincb %>%
    group_by(drug, country) %>%
    do(series_fit(.))

fits$year <- fits$target + 1989 - 1
fits$y_hat[fits$y_hat < 1e-10] <- 1e-10
fits  <- data.table(fits) %>%
    arrange(country, drug, year)

## ---- output-results ----
write.csv(fits, file = file.path(root_dir, "incb_local_reg.csv"), row.names = F)

fits2 <- fits %>%
    select(country, year, drug, slope, y_hat) %>%
    left_join(data.table(unique(incb[, c("country", "json_country", "iso3", "region")])), by = "country")
fits2$slope <- round(fits2$slope, 2)
fits2$y_hat <- round(fits2$y_hat, 2)

new_names <- colnames(fits2)
new_names[c(1, 3:5)] <- c("group_id", "col_id", "y_id", "x_id")
setnames(fits2, new_names)
fits2 <- toJSON(fits2, auto_unbox = T)
cat(sprintf("var incb_local_reg = %s", fits2),
    file = file.path(root_dir, "incb_local_reg.js"))
