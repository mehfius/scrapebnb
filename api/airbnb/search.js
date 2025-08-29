import { format, addDays } from 'date-fns';
import { promises as fs } from 'fs';
import path from 'path';

const buildGraphQLRequest = (locationString, checkin, checkout, adults, minBedrooms, amenities, cursor = null) => {
    const rawParams = [
        { filterName: "adults", filterValues: [String(adults)] },
        { filterName: "minBedrooms", filterValues: [String(minBedrooms)] },
        { filterName: "cdnCacheSafe", filterValues: ["false"] },
        { filterName: "channel", filterValues: ["EXPLORE"] },
        { filterName: "checkin", filterValues: [checkin] },
        { filterName: "checkout", filterValues: [checkout] },
        { filterName: "datePickerType", filterValues: ["calendar"] },
        { filterName: "flexibleTripLengths", filterValues: ["one_week"] },
        { filterName: "guests", filterValues: ["9"] },
        { filterName: "itemsPerGrid", filterValues: ["18"] },
        { filterName: "monthlyEndDate", filterValues: ["2025-12-01"] },
        { filterName: "monthlyLength", filterValues: ["3"] },
        { filterName: "monthlyStartDate", filterValues: ["2025-09-01"] },
        { filterName: "priceFilterInputType", filterValues: ["2"] },
        { filterName: "priceFilterNumNights", filterValues: ["1"] },
        { filterName: "query", filterValues: [locationString] },
        { filterName: "refinementPaths", filterValues: ["/homes"] },
        { filterName: "screenSize", filterValues: ["large"] },
        { filterName: "searchMode", filterValues: ["regular_search"] },
        { filterName: "tabId", filterValues: ["home_tab"] },
        { filterName: "version", filterValues: ["1.8.3"] }
    ];

    if (minBedrooms) {
        rawParams.push({
            filterName: "selectedFilterOrder",
            filterValues: [`min_bedrooms:${minBedrooms}`]
        });
    }

    if (amenities && amenities.length > 0) {
        rawParams.push({
            filterName: "amenities",
            filterValues: amenities.map(String)
        });
    }

    const treatmentFlags = [
        "feed_map_decouple_m11_treatment",
        "recommended_amenities_2024_treatment_b",
        "filter_redesign_2024_treatment",
        "filter_reordering_2024_roomtype_treatment",
        "p2_category_bar_removal_treatment",
        "selected_filters_2024_treatment",
        "recommended_filters_2024_treatment_b",
        "m13_search_input_phase2_treatment",
        "m13_search_input_services_enabled"
    ];

    return {
        operationName: "StaysSearch",
        variables: {
            staysSearchRequest: {
                cursor: cursor,
                metadataOnly: false,
                requestedPageType: "STAYS_SEARCH",
                searchType: "AUTOSUGGEST",
                treatmentFlags: treatmentFlags,
                maxMapItems: 9999,
                rawParams: rawParams
            },
            staysMapSearchRequestV2: {
                cursor: cursor,
                metadataOnly: false,
                requestedPageType: "STAYS_SEARCH",
                searchType: "AUTOSUGGEST",
                treatmentFlags: treatmentFlags,
                rawParams: rawParams
            },
            isLeanTreatment: false,
            aiSearchEnabled: false,
            skipExtendedSearchParams: false
        },
        extensions: {
            persistedQuery: {
                version: 1,
                sha256Hash: "ede9baea7327182e76997f9edf7c39633802b8c42730897fbabfd7c268f9cc8e"
            }
        }
    };
};

const fetchAllPages = async (graphqlRequest, requestOptions) => {
    let allSearchResults = [];
    let allMapResults = [];
    let currentPageCursor = null;

    do {
        try {
            if (currentPageCursor) {
                graphqlRequest.variables.staysSearchRequest.cursor = currentPageCursor;
                graphqlRequest.variables.staysMapSearchRequestV2.cursor = currentPageCursor;
            }

            const response = await fetch("https://www.airbnb.com.br/api/v3/StaysSearch/ede9baea7327182e76997f9edf7c39633802b8c42730897fbabfd7c268f9cc8e", {
                ...requestOptions,
                body: JSON.stringify(graphqlRequest),
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`Failed to fetch data from Airbnb API. Status: ${response.status}. Details: ${errorBody}`);
            }

            const responseJson = await response.json();
            const searchResults = responseJson?.data?.presentation?.staysSearch?.results?.searchResults || [];
            const mapResults = responseJson?.data?.presentation?.staysSearch?.mapResults?.staysInViewport || [];

            allSearchResults = allSearchResults.concat(searchResults);
            allMapResults = allMapResults.concat(mapResults);

            currentPageCursor = responseJson?.data?.presentation?.staysSearch?.results?.paginationInfo?.nextPageCursor || null;

        } catch (error) {
            console.error("Error during paginated fetch:", error);
            break;
        }

    } while (currentPageCursor);

    return { allSearchResults, allMapResults };
};

export default async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        const { location, adults, min_bedrooms, amenities } = req.body;

        if (!location || typeof location !== 'string') {
            return res.status(400).json({ error: 'Missing or invalid parameter: \'location\' must be a string.' });
        }

        if (adults == null || min_bedrooms == null) {
            return res.status(400).json({ error: 'Missing required parameters: \'adults\' and \'min_bedrooms\' must be provided.' });
        }

        const today = new Date();
        const checkin = format(addDays(today, 1), 'yyyy-MM-dd');
        const checkout = format(addDays(today, 2), 'yyyy-MM-dd');

        const graphqlRequest = buildGraphQLRequest(location, checkin, checkout, adults, min_bedrooms, amenities);

        const requestOptions = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-airbnb-api-key": "d306zoyjsyarp7ifhu67rjxn52tv0t20",
                "x-csrf-without-token": "1"
            }
        };

        const { allSearchResults, allMapResults } = await fetchAllPages(graphqlRequest, requestOptions);

        const rooms = allSearchResults.map((_, index) => {
            const mapInfo = allMapResults[index];
            return mapInfo?.listingId ?? null;
        }).filter(Boolean);

        const pictures = allSearchResults.map(result => result?.contextualPictures?.[0]?.picture ?? null).filter(Boolean);

        const finalResultObject = {
            room: rooms,
            picture: pictures
        };

        const logsDir = path.join('/tmp', 'log');
        const timestamp = format(new Date(), 'yyyy-MM-dd-HH-mm-ss');
        const filename = `${timestamp}.json`;
        const filepath = path.join(logsDir, filename);

        await fs.mkdir(logsDir, { recursive: true });
        await fs.writeFile(filepath, JSON.stringify(finalResultObject, null, 2));

        return res.status(200).json(finalResultObject);

    } catch (error) {
        console.error("Internal Server Error:", error);
        return res.status(500).json({ error: 'An unexpected error occurred.', details: error.message });
    }
}