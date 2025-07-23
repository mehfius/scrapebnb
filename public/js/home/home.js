(async function () {
    globalThis.modal = globalThis.modal || {};

    const eHeader = jte({ tag: 'header' });

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    const tomorrowFormatted = `${year}-${month}-${day}`;

    const eCalendar = jte({
        tag: 'input',
        id: 'checkin-calendar',
        type: 'date',
        value: tomorrowFormatted
    });

    const eJobSelect = jte({
        tag: 'select',
        id: 'job-select'
    });
    const eConfigJob = jte({
        tag: 'config_job',
        innerhtml: 'settings',
        class: 'material-icons true'
    });
    eConfigJob.onclick = () => speedj('/js/config_job/config_job.js');
    const eRooms = jte({
        tag: 'rooms',
        innerhtml: 'holiday_village',
        class: 'material-icons true'
    });
    eRooms.addEventListener('click', () => {
        speedj('/js/rooms/rooms.js');
    });
    const eDateLabel = jte({ tag: 'label' });

    eHeader.appendChild(eDateLabel);
    eHeader.appendChild(eRooms);

    const airbnb = jte({ tag: 'airbnb', innerhtml: 'Ver Anúncio no Airbnb' });
    eHeader.appendChild(airbnb);

    eHeader.appendChild(eCalendar);
    eHeader.appendChild(eJobSelect);

    const eSortSelect = jte({
        tag: 'select',
        id: 'sort-select'
    });
    eHeader.appendChild(eSortSelect);

    const sortOptions = [
        { value: 'position', label: 'Ordernar por Posição' },
        { value: 'price', label: 'Ordernar por Preço' }
    ];

    sortOptions.forEach(option => {
        const opt = jte({
            tag: 'option',
            value: option.value,
            innerhtml: option.label
        });
        eSortSelect.appendChild(opt);
    });


    eHeader.appendChild(eConfigJob);

    const updateDateLabel = (dateString) => {
        const date = new Date(dateString + 'T00:00:00'); // Add T00:00:00 to avoid timezone issues
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        eDateLabel.innerHTML = date.toLocaleDateString('pt-BR', options);
    };

    const updateViewJobLink = () => {
        const selectedJobId = eJobSelect.value;
        const job = globalThis.jobs.find(j => j.id == selectedJobId);
        if (job) {
            const checkinDateString = eCalendar.value;
            const checkinDate = new Date(checkinDateString + 'T00:00:00');
            const checkoutDate = new Date(checkinDate);
            checkoutDate.setDate(checkinDate.getDate() + 3);
            const checkoutDateString = checkoutDate.toISOString().split('T')[0];
            const url = `https://www.airbnb.com.br/s/${job.tag}/homes?adults=${job.adults}&min_bedrooms=${job.min_bedrooms}&check_in=${checkinDateString}&check_out=${checkoutDateString}${job.amenities && job.amenities.length > 0 ? job.amenities.map(amenity => `&amenities%5B%5D=${amenity}`).join('') : ''}${job.price_max ? `&price_max=${job.price_max}&price_filter_input_type=${job.price_filter_input_type}` : ''}`;

            airbnb.onclick = () => window.open(url, '_blank');
        } else {
            if (globalThis.jobs) {
                console.error('Job not found for selected ID:', selectedJobId);
            }
            airbnb.onclick = () => false;
        }
    };

    document.body.append(eHeader);

    let eContent = jte({
        tag: 'content'
    });
    document.body.append(eContent);

    const icon = 'material-icons';

    const populateJobSelect = async () => {
        const r = await fetch(
            `${globalThis.auth.SUPABASE_URL}/rest/v1/jobs?select=*`,
            { headers: { Apikey: globalThis.auth.SUPABASE_ANON_KEY, "Content-Type": "application/json" } }
        ).catch(console.error);

        const jobs = r ? await r.json() : [];
        globalThis.jobs = jobs;

        eJobSelect.innerHTML = '';
        let latestJobId = null;

        if (jobs.length > 0) {
            jobs.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            latestJobId = jobs[jobs.length - 1].id;

            jobs.forEach(job => {
                const option = jte({
                    tag: 'option',
                    value: job.id,
                    innerhtml: `${job.id} | ${job.label || 'N/A'} | Adultos: ${job.adults || 'N/A'} | Quartos: ${job.min_bedrooms || 'N/A'} `
                });
                eJobSelect.appendChild(option);
            });
        }

        if (latestJobId) {
            eJobSelect.value = latestJobId;
        }
        return latestJobId;
    };

    const fetchDataForDate = async (checkinDate, jobId, sortBy) => {
        eContent.innerHTML = '';

        let url = `${globalThis.auth.SUPABASE_URL}/rest/v1/frontend?select=id,name,best_price,best_position,gold,room_image_array,tiny_description,position,title,price,host_image,favorite,superhost,reference_label,average_price_per_night&checkin=eq.${checkinDate}&limit=72`;

        if (jobId) {
            url += `&job=eq.${jobId}`;
        }

        if (sortBy === 'price') {
            url += `&order=average_price_per_night`;
        } else {
            url += `&order=position`;
        }

        const r = await fetch(
            url,
            { headers: { Apikey: globalThis.auth.SUPABASE_ANON_KEY, "Content-Type": "application/json" } }
        ).catch(console.error);

        const data = r ? await r.json() : null;

        if (data && data.length > 0) {
            data.forEach(item => {
                let style = 'background-image: url(' + item.host_image + '); background-size: cover; background-position: center;';
                const eItem = jte({ tag: 'item' });
                if (item.gold) {
                    eItem.setAttribute('gold', '');
                }
                const eContainer = jte({ tag: 'container' });

                eContainer.appendChild(jte({ tag: 'figure', style: style }));
                eContainer.appendChild(jte({ tag: 'position', innerhtml: item.position }));
                eContainer.appendChild(jte({ tag: 'room_title', innerhtml: item.title }));
                eContainer.appendChild(jte({ tag: 'reference', innerhtml: item.reference_label || '' }));
                eContainer.appendChild(jte({ tag: 'favorite', innerhtml: 'favorite', class: icon + ' ' + item.favorite }));
                eContainer.appendChild(jte({ tag: 'superhost', innerhtml: 'star', class: icon + ' ' + item.superhost }));
                eContainer.appendChild(jte({ tag: 'price', innerhtml: 'R$ ' + item.average_price_per_night }));


                eItem.appendChild(eContainer);
                eContent.appendChild(eItem);

                eItem.addEventListener('click', () => {
                    globalThis.modal.id = item.id;
                    console.log('globalThis.modal.id set to:', globalThis.modal.id);
                    speedj('/js/home/room.js');
                });
            });
        } else {
            eContent.appendChild(jte({ tag: 'item', innerhtml: "Nenhum dado disponível para esta data." }));
        }
    };

    eCalendar.addEventListener('change', (event) => {
        const newDate = event.target.value;
        fetchDataForDate(newDate, eJobSelect.value, eSortSelect.value);
        updateViewJobLink();
        updateDateLabel(newDate);
    });

    eJobSelect.addEventListener('change', (event) => {
        fetchDataForDate(eCalendar.value, event.target.value, eSortSelect.value);
        updateViewJobLink();
    });

    eSortSelect.addEventListener('change', (event) => {
        fetchDataForDate(eCalendar.value, eJobSelect.value, event.target.value);
    });

    document.addEventListener('keydown', (event) => {
        const currentDate = new Date(eCalendar.value + 'T00:00:00'); // Add T00:00:00 to avoid timezone issues
        if (event.key === 'ArrowLeft') {
            currentDate.setDate(currentDate.getDate() - 1);
            const newDateFormatted = currentDate.toISOString().split('T')[0];
            eCalendar.value = newDateFormatted;
            fetchDataForDate(newDateFormatted, eJobSelect.value, eSortSelect.value);
            updateViewJobLink();
            updateDateLabel(newDateFormatted);
        } else if (event.key === 'ArrowRight') {
            currentDate.setDate(currentDate.getDate() + 1);
            const newDateFormatted = currentDate.toISOString().split('T')[0];
            eCalendar.value = newDateFormatted;
            fetchDataForDate(newDateFormatted, eJobSelect.value, eSortSelect.value);
            updateViewJobLink();
            updateDateLabel(newDateFormatted);
        }
    });

    const initialJobId = await populateJobSelect();
    fetchDataForDate(tomorrowFormatted, initialJobId, eSortSelect.value);
    updateViewJobLink();
    updateDateLabel(tomorrowFormatted);

})();