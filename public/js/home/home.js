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

    eHeader.appendChild(eCalendar);
    eHeader.appendChild(eJobSelect);

    const viewJobLink = jte({ tag: 'a', innerhtml: 'Ver Anúncio', target: '_blank' });
    eHeader.appendChild(viewJobLink);

    const updateViewJobLink = () => {
        const selectedJobId = eJobSelect.value;
        const job = globalThis.jobs.find(j => j.id == selectedJobId);
        if (job) {
            const checkinDateString = eCalendar.value;
            const checkinDate = new Date(checkinDateString);
            const checkoutDate = new Date(checkinDate);
            checkoutDate.setDate(checkinDate.getDate() + 3);
            const checkoutDateString = checkoutDate.toISOString().split('T')[0];
            const url = `${job.url}&adults=${job.adults}&min_bedrooms=${job.min_bedrooms}&check_in=${checkinDateString}&check_out=${checkoutDateString}${job.amenities && job.amenities.length > 0 ? job.amenities.map(amenity => `&amenities%5B%5D=${amenity}`).join('') : ''}${job.price_max ? `&price_max=${job.price_max}&price_filter_input_type=${job.price_filter_input_type}` : ''}`;
            viewJobLink.href = url;
        } else {
            if (globalThis.jobs) {
                console.error('Job not found for selected ID:', selectedJobId);
            }
            viewJobLink.href = '#';
        }
    };

    document.body.append(eHeader);

    let eContent = jte({
        tag: 'content'
    });
    document.body.append(eContent);

    const icon = 'material-symbols-outlined';

    const populateJobSelect = async () => {
        const r = await fetch(
            `${globalThis.auth.SUPABASE_URL}/rest/v1/jobs?select=id,created_at,adults,min_bedrooms,qtd,url,amenities,price_max,created_at,price_filter_input_type`,
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
                    innerhtml: `${new Date(job.created_at).toLocaleString()} | Adults: ${job.adults || 'N/A'} | Min Bedrooms: ${job.min_bedrooms || 'N/A'} | Qtd: ${job.qtd || 'N/A'}`
                });
                eJobSelect.appendChild(option);
            });
        }

        if (latestJobId) {
            eJobSelect.value = latestJobId;
        }
        return latestJobId;
    };

    const fetchDataForDate = async (checkinDate, jobId) => {
        eContent.innerHTML = '';

        let url = `${globalThis.auth.SUPABASE_URL}/rest/v1/frontend?select=id,name,room_image_array,tiny_description,position,title,price,host_image,favorite,superhost&checkin=eq.${checkinDate}&limit=72&order=position`;

        if (jobId) {
            url += `&job=eq.${jobId}`;
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
                const eContainer = jte({ tag: 'container' });

                eContainer.appendChild(jte({ tag: 'figure', style: style }));
                eContainer.appendChild(jte({ tag: 'position', innerhtml: item.position }));
                eContainer.appendChild(jte({ tag: 'label', innerhtml: item.title }));
                eContainer.appendChild(jte({ tag: 'favorite', innerhtml: 'favorite', class: icon + ' ' + item.favorite }));
                eContainer.appendChild(jte({ tag: 'superhost', innerhtml: 'star', class: icon + ' ' + item.superhost }));
                eContainer.appendChild(jte({ tag: 'price', innerhtml: 'R$ ' + item.price }));

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
        fetchDataForDate(event.target.value, eJobSelect.value);
        updateViewJobLink();
    });

    eJobSelect.addEventListener('change', (event) => {
        fetchDataForDate(eCalendar.value, event.target.value);
        updateViewJobLink();
    });

    document.addEventListener('keydown', (event) => {
        const currentDate = new Date(eCalendar.value);
        if (event.key === 'ArrowLeft') {
            currentDate.setDate(currentDate.getDate() - 1);
            const newDateFormatted = currentDate.toISOString().split('T')[0];
            eCalendar.value = newDateFormatted;
            fetchDataForDate(newDateFormatted, eJobSelect.value);
            updateViewJobLink();
        } else if (event.key === 'ArrowRight') {
            currentDate.setDate(currentDate.getDate() + 1);
            const newDateFormatted = currentDate.toISOString().split('T')[0];
            eCalendar.value = newDateFormatted;
            fetchDataForDate(newDateFormatted, eJobSelect.value);
            updateViewJobLink();
        }
    });

    const initialJobId = await populateJobSelect();
    fetchDataForDate(tomorrowFormatted, initialJobId);
    updateViewJobLink();

})();
