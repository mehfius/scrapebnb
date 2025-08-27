import { format, addDays } from 'date-fns';

// Updated function to accept a location string directly
const buildGraphQLRequest = (locationString, checkin, checkout, adults = 1, pageNumber = 0) => {
    const itemsOffset = pageNumber > 0 ? 18 * pageNumber : 0;
    const cursor = Buffer.from(JSON.stringify({ section_offset: 0, items_offset: itemsOffset, version: 1 })).toString('base64');

    const rawParams = [
        { filterName: "adults", filterValues: [String(adults)] },
        { filterName: "checkin", filterValues: [checkin] },
        { filterName: "checkout", filterValues: [checkout] },
        { filterName: "datePickerType", filterValues: ["calendar"] },
        { filterName: "itemsPerGrid", filterValues: ["18"] },
        { filterName: "priceFilterInputType", filterValues: ["2"] },
        { filterName: "priceFilterNumNights", filterValues: ["1"] },
        // Use the location string directly here
        { filterName: "query", filterValues: [locationString] },
        { filterName: "refinementPaths", filterValues: ["/homes"] },
        { filterName: "tabId", filterValues: ["home_tab"] },
    ];

    return {
        operationName: "StaysSearch",
        variables: {
            staysSearchRequest: {
                cursor: cursor,
                metadataOnly: false,
                requestedPageType: "STAYS_SEARCH",
                searchType: "AUTOSUGGEST",
                maxMapItems: 9999,
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



// The main serverless function handler
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        // Expect a simple { location: "string" } in the body
        const { location } = req.body;

        if (!location || typeof location !== 'string') {
            return res.status(400).json({ error: 'Missing or invalid parameter: \'location\' must be a string.' });
        }

        // Generate default values for other parameters
        const today = new Date();
        const checkin = format(addDays(today, 1), 'yyyy-MM-dd');
        const checkout = format(addDays(today, 2), 'yyyy-MM-dd');
        const adults = 2;
        const pageNumber = 0;

        const graphqlRequest = buildGraphQLRequest(location, checkin, checkout, adults, pageNumber);

        const requestOptions = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-airbnb-api-key": "d306zoyjsyarp7ifhu67rjxn52tv0t20",
                "x-csrf-without-token": "1"
            },
            body: JSON.stringify(graphqlRequest)
        };

        const airbnbResponse = await fetch("https://www.airbnb.com.br/api/v3/StaysSearch/ede9baea7327182e76997f9edf7c39633802b8c42730897fbabfd7c268f9cc8e", requestOptions);

        if (!airbnbResponse.ok) {
            const errorBody = await airbnbResponse.text();
            console.error("Airbnb API Error:", errorBody);
            return res.status(airbnbResponse.status).json({ error: "Failed to fetch data from Airbnb API.", details: errorBody });
        }

        const responseJson = await airbnbResponse.json();

        // Extract the searchResults array, defaulting to an empty array if not found
        const searchResults = responseJson?.data?.presentation?.staysSearch?.results?.searchResults || [];

        return res.status(200).json(searchResults);

    } catch (error) {
        console.error("Internal Server Error:", error);
        return res.status(500).json({ error: 'An unexpected error occurred.', details: error.message });
    }
}