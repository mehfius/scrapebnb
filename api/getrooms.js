import { format, addDays } from 'date-fns';
import { NextRequest, NextResponse } from 'next/server.js';

export const runtime = 'nodejs';

const buildAirbnbUrl = (jobConfig, checkinStr, checkoutStr, pageNumber) => {
    const adults = 4;
    const min_bedrooms = 2;
    const selected_filter_order = `selected_filter_order%5B%5D=min_bedrooms%3A${min_bedrooms}`;

    let url = `https://www.airbnb.com.br/s/${jobConfig.tag}/homes?&adults=${adults}&min_bedrooms=${min_bedrooms}&${selected_filter_order}&checkin=${checkinStr}&checkout=${checkoutStr}`;

    if (pageNumber > 0) {
        const offset = 18 * pageNumber;
        const cursorObject = { section_offset: 0, items_offset: offset, version: 1 };
        const cursor = Buffer.from(JSON.stringify(cursorObject)).toString('base64');
        url = `${url}&cursor=${encodeURIComponent(cursor)}`;
    }
    return url;
};

const scrapeUrl = async (url) => {
    try {
        const airbnbResponse = await fetch(url, { headers: { 'User-Agent': 'curl/8.5.0' } });
        if (!airbnbResponse.ok) {
            throw new Error(`Request failed with status ${airbnbResponse.statusText}`);
        }
        const htmlText = await airbnbResponse.text();
        const startString = 'www.airbnb.com.br/rooms/';
        const roomIds = [...htmlText.matchAll(new RegExp(`${startString}(\\d+)`, 'g'))].map(match => match[1]);
        
        const jsonStartString = '"StaysSearchResponse",';
        const jsonEndString = ',"paginationInfo"';
        const jsonStartIndex = htmlText.indexOf(jsonStartString);

        if (jsonStartIndex === -1) {
            throw new Error("JSON start marker not found in HTML.");
        }

        const jsonEndIndex = htmlText.indexOf(jsonEndString, jsonStartIndex);
        
        if (jsonEndIndex === -1) {
            throw new Error("JSON end marker not found after start marker.");
        }

        const extractedContent = htmlText.substring(jsonStartIndex + jsonStartString.length, jsonEndIndex);
        const validJsonString = `{${extractedContent}}`;
        const jsonData = JSON.parse(validJsonString);
        
        // Extrai o nextPageCursor do HTML
        let nextPageCursor = null;
        const cursorMarker = '"nextPageCursor":"';
        const cursorStartIndex = htmlText.indexOf(cursorMarker);
        if (cursorStartIndex !== -1) {
            const cursorEndIndex = htmlText.indexOf('"', cursorStartIndex + cursorMarker.length);
            if (cursorEndIndex !== -1) {
                nextPageCursor = htmlText.substring(cursorStartIndex + cursorMarker.length, cursorEndIndex);
            }
        }

        const results = [];
        if (jsonData.searchResults && Array.isArray(jsonData.searchResults)) {
            for (let i = 0; i < jsonData.searchResults.length; i++) {
                const roomId = roomIds[i] || null;
                if (roomId) {
                    results.push({ room: roomId });
                }
            }
        }
        return { success: true, data: results, nextPageCursor: nextPageCursor };
    } catch (error) {
        console.error(`Failed to process URL ${url}:`, error.message);
        return { success: false, url: url, error: error.message };
    }
};

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        
        const jobConfig = {
            tag: searchParams.get('tag'),
            days: parseInt(searchParams.get('days'), 10),
            nights: parseInt(searchParams.get('nights'), 10),
            pages: parseInt(searchParams.get('pages'), 10),
        };

        if (!jobConfig.tag || isNaN(jobConfig.days) || isNaN(jobConfig.nights) || isNaN(jobConfig.pages)) {
            return NextResponse.json({ success: false, error: 'Invalid parameters. Ensure tag, days, nights, and pages are in the URL.' }, { status: 400 });
        }

        const today = new Date();
        const failedScrapes = [];
        const allResultsByDate = {};
        
        for (let dayOffset = 0; dayOffset < jobConfig.days; dayOffset++) {
            const checkinDate = addDays(today, (7 + dayOffset));
            const checkoutDate = addDays(checkinDate, jobConfig.nights);
            const checkinStr = format(checkinDate, 'yyyy-MM-dd');
            const checkoutStr = format(checkoutDate, 'yyyy-MM-dd');

            allResultsByDate[checkinStr] = { url: '', rooms: [], next_page_cursor: null };

            const pagePromises = [];
            for (let pageNumber = 0; pageNumber < jobConfig.pages; pageNumber++) {
                const url = buildAirbnbUrl(jobConfig, checkinStr, checkoutStr, pageNumber);
                if (pageNumber === 0) {
                    allResultsByDate[checkinStr].url = url;
                }
                pagePromises.push(scrapeUrl(url));
            }

            const pagesResults = await Promise.all(pagePromises);
            let positionCounter = 1;

            // Pega o cursor do resultado da primeira página
            if (pagesResults[0] && pagesResults[0].success) {
                allResultsByDate[checkinStr].next_page_cursor = pagesResults[0].nextPageCursor;
            }

            pagesResults.forEach(pageResult => {
                if (pageResult.success && pageResult.data?.length > 0) {
                    const augmentedData = pageResult.data.map(item => ({
                        position: positionCounter++,
                        room: item.room
                    }));
                    allResultsByDate[checkinStr].rooms.push(...augmentedData);
                } else if (!pageResult.success) {
                    failedScrapes.push({ url: pageResult.url, error: pageResult.error });
                }
            });
        }
        
        const historyData = Object.values(allResultsByDate).map(dateEntry => ({
            url: dateEntry.url,
            next_page_cursor: dateEntry.next_page_cursor,
            rooms: dateEntry.rooms
        }));

        return NextResponse.json({ success: true, data: historyData, errors: failedScrapes });

    } catch (error) {
        console.error('Error processing request:', error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
