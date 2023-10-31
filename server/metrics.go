package main

import (
	"fmt"
	"net/http"

	"github.com/prometheus/client_golang/prometheus/promhttp"
)

func CreateMetricsServer(config *Config) {
	port := config.MetricsPort
	if port != 0 {
		http.Handle("/metrics", promhttp.Handler())
		http.ListenAndServe(fmt.Sprintf(":%d", config.MetricsPort), nil)
	}
}
