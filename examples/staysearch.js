const myHeaders = new Headers();
myHeaders.append("x-airbnb-api-key", "d306zoyjsyarp7ifhu67rjxn52tv0t20");
myHeaders.append("x-csrf-without-token", "1");
myHeaders.append("Content-Type", "application/json");

const raw = JSON.stringify({
  "operationName": "StaysSearch",
  "variables": {
    "staysSearchRequest": {
      "cursor": "eyJzZWN0aW9uX29mZnNldCI6MCwiaXRlbXNfb2Zmc2V0IjowLCJ2ZXJzaW9uIjoxfQ==",
      "metadataOnly": false,
      "requestedPageType": "STAYS_SEARCH",
      "searchType": "AUTOSUGGEST",
      "treatmentFlags": [
        "feed_map_decouple_m11_treatment",
        "recommended_amenities_2024_treatment_b",
        "filter_redesign_2024_treatment",
        "filter_reordering_2024_roomtype_treatment",
        "p2_category_bar_removal_treatment",
        "selected_filters_2024_treatment",
        "recommended_filters_2024_treatment_b",
        "m13_search_input_phase2_treatment",
        "m13_search_input_services_enabled"
      ],
      "maxMapItems": 9999,
      "rawParams": [
        {
          "filterName": "adults",
          "filterValues": [
            "9"
          ]
        },
        {
          "filterName": "cdnCacheSafe",
          "filterValues": [
            "false"
          ]
        },
        {
          "filterName": "channel",
          "filterValues": [
            "EXPLORE"
          ]
        },
        {
          "filterName": "checkin",
          "filterValues": [
            "2025-09-26"
          ]
        },
        {
          "filterName": "checkout",
          "filterValues": [
            "2025-09-29"
          ]
        },
        {
          "filterName": "datePickerType",
          "filterValues": [
            "calendar"
          ]
        },
        {
          "filterName": "flexibleTripLengths",
          "filterValues": [
            "one_week"
          ]
        },
        {
          "filterName": "guests",
          "filterValues": [
            "9"
          ]
        },
        {
          "filterName": "itemsPerGrid",
          "filterValues": [
            "18"
          ]
        },
        {
          "filterName": "monthlyEndDate",
          "filterValues": [
            "2025-12-01"
          ]
        },
        {
          "filterName": "monthlyLength",
          "filterValues": [
            "3"
          ]
        },
        {
          "filterName": "monthlyStartDate",
          "filterValues": [
            "2025-09-01"
          ]
        },
        {
          "filterName": "priceFilterInputType",
          "filterValues": [
            "2"
          ]
        },
        {
          "filterName": "priceFilterNumNights",
          "filterValues": [
            "3"
          ]
        },
        {
          "filterName": "query",
          "filterValues": [
            "Belo Horizonte, Minas gerais"
          ]
        },
        {
          "filterName": "refinementPaths",
          "filterValues": [
            "/homes"
          ]
        },
        {
          "filterName": "screenSize",
          "filterValues": [
            "large"
          ]
        },
        {
          "filterName": "searchMode",
          "filterValues": [
            "regular_search"
          ]
        },
        {
          "filterName": "tabId",
          "filterValues": [
            "home_tab"
          ]
        },
        {
          "filterName": "version",
          "filterValues": [
            "1.8.3"
          ]
        }
      ]
    },
    "isLeanTreatment": false,
    "aiSearchEnabled": false,
    "skipExtendedSearchParams": false
  },
  "extensions": {
    "persistedQuery": {
      "version": 1,
      "sha256Hash": "ede9baea7327182e76997f9edf7c39633802b8c42730897fbabfd7c268f9cc8e"
    }
  }
});

const requestOptions = {
  method: "POST",
  headers: myHeaders,
  body: raw,
  redirect: "follow"
};

fetch("https://www.airbnb.com.br/api/v3/StaysSearch/ede9baea7327182e76997f9edf7c39633802b8c42730897fbabfd7c268f9cc8e", requestOptions)
  .then((response) => response.text())
  .then((result) => console.log(result))
  .catch((error) => console.error(error));