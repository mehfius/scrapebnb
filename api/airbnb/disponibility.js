const API_KEY = process.env.AIRBNB_API_KEY || 'd306zoyjsyarp7ifhu67rjxn52tv0t20';
const API_HASH = process.env.PDP_AVAILABILITY_HASH || '8f08e03c7bd16fcad3c92a3592c19a8b559a0d0855a84028d1163d4733ed9ade';
const API_BASE_URL = `https://www.airbnb.com.br/api/v3/PdpAvailabilityCalendar/${API_HASH}`;

async function fetchListingAvailability(room) {
    const variables = {
        request: {
            count: 12,
            listingId: String(room),
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear()
        }
    };

    const extensions = {
        persistedQuery: {
            version: 1,
            sha256Hash: API_HASH
        }
    };

    const params = new URLSearchParams({
        operationName: 'PdpAvailabilityCalendar',
        locale: 'pt',
        currency: 'BRL',
        variables: JSON.stringify(variables),
        extensions: JSON.stringify(extensions)
    });

    const url = `${API_BASE_URL}?${params.toString()}`;

    const response = await fetch(url, {
        method: "GET",
        headers: { "X-Airbnb-API-Key": API_KEY },
    });

    if (!response.ok) {
        throw new Error(`Falha na chamada da API do Airbnb. Status: ${response.status}`);
    }

    const result = await response.json();
    const calendarMonths = result?.data?.merlin?.pdpAvailabilityCalendar?.calendarMonths;

    if (!calendarMonths) {
        throw new Error("Não foi possível encontrar 'calendarMonths' na resposta da API.");
    }

    const availabilityRecords = [];
    calendarMonths.forEach(month => {
        month.days.forEach(day => {
            availabilityRecords.push({
                calendar_date: day.calendarDate,
                available: day.available,
                available_for_checkin: day.availableForCheckin,
                available_for_checkout: day.availableForCheckout,
            });
        });
    });

    return availabilityRecords;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Método ${req.method} não permitido`);
    }

    try {
        const { room } = req.body;

        if (!room) {
            return res.status(400).json({ error: "Parâmetro 'room' é obrigatório." });
        }

        console.log(`Iniciando busca de disponibilidade para o quarto: ${room}`);

        const availabilityRecords = await fetchListingAvailability(room);
        
        console.log(`Sucesso: ${availabilityRecords.length} registros de disponibilidade encontrados para o quarto ${room}.`);

        return res.status(200).json({
            success: true,
            availability: availabilityRecords
        });

    } catch (error) {
        console.error("Erro na API get-availability:", error);
        return res.status(500).json({ success: false, error: 'Ocorreu um erro inesperado.', details: error.message });
    }
}

