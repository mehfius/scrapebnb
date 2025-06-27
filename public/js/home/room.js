(async function () {
    speedj('http://localhost:8080/css/room.css');
    globalThis.modal = globalThis.modal || {};

    const div = jte({ tag: 'div', });
    const dialog = navdialog.create_dialog(div, {});
    navdialog.show_dialog(dialog);

    const icon = 'material-symbols-outlined';

    console.log('globalThis.jobs:', globalThis.jobs);

    const fetchDataForId = async (itemId) => {
        if (!itemId) {
            div.innerHTML = 'Selecione um item para ver os detalhes.';
            return;
        }

        div.innerHTML = 'Carregando detalhes do item...';

        try {
            const r = await fetch(
                `${globalThis.auth.SUPABASE_URL}/rest/v1/frontend?select=id,name,room_image_array,tiny_description,position,title,price,host_image,favorite,superhost,room,job&id=eq.${itemId}`,
                { headers: { Apikey: globalThis.auth.SUPABASE_ANON_KEY, "Content-Type": "application/json" } }
            );

            if (!r.ok) {
                throw new Error(`Erro ao buscar dados: ${r.statusText}`);
            }

            const data = await r.json();

            div.innerHTML = '';

            if (data && data.length > 0) {
                const item = data[0];

                div.appendChild(jte({ tag: 'h1', innerhtml: item.title }));
                div.appendChild(jte({ tag: 'tiny_description', innerhtml: item.tiny_description }));

                const badges = jte({ tag: 'badges' });
                if (item.superhost) {
                    badges.appendChild(jte({ tag: 'superhost', innerhtml: 'star', class: icon }));
                }
                if (item.favorite) {
                    badges.appendChild(jte({ tag: 'favorite', innerhtml: 'favorite', class: icon }));
                }
                div.appendChild(badges);

                

                if (item.room_image_array && item.room_image_array.length > 0) {
                    const gallery = jte({ tag: 'gallery' });
                    item.room_image_array.forEach(imageUrl => {
                        gallery.appendChild(jte({ tag: 'img', src: imageUrl }));
                    });
                    div.appendChild(gallery);
                }

                if (item.description) {
                    const fullDescription = item.description;
                    const words = fullDescription.split(' ');
                    const truncatedDescription = words.slice(0, 30).join(' ') + (words.length > 30 ? '...' : '');
                    const descriptionElement = jte({ tag: 'description', innerhtml: truncatedDescription });

                    if (words.length > 30) {
                        let isExpanded = false; // State variable

                        descriptionElement.onclick = () => {
                            if (isExpanded) {
                                descriptionElement.innerHTML = truncatedDescription;
                            } else {
                                descriptionElement.innerHTML = fullDescription;
                            }
                            isExpanded = !isExpanded; // Toggle state
                        };
                    }
                    div.appendChild(descriptionElement);
                }

                const host = jte({ tag: 'host' });
                if (item.host_image) {
                    host.appendChild(jte({ tag: 'img', src: item.host_image }));
                }
                host.appendChild(jte({ tag: 'name', innerhtml: item.name }));
                div.appendChild(host);

                const priceElement = jte({ tag: 'price', innerhtml: `💰 R$ ${item.price}` });
                div.appendChild(priceElement);

                

                // Second query for next 60 days
                // Second query for next 60 days
                const today = new Date();
                const sixtyDaysFromNow = new Date(today);
                sixtyDaysFromNow.setDate(today.getDate() + 59); // +59 to include today and next 59 days

                const todayFormatted = today.toISOString().split('T')[0];
                const sixtyDaysFromNowFormatted = sixtyDaysFromNow.toISOString().split('T')[0];

                const r2 = await fetch(
                    `${globalThis.auth.SUPABASE_URL}/rest/v1/frontend?select=checkin&room=eq.${item.room}&job=eq.${item.job}&checkin=gte.${todayFormatted}&checkin=lte.${sixtyDaysFromNowFormatted}`,
                    { headers: { Apikey: globalThis.auth.SUPABASE_ANON_KEY, "Content-Type": "application/json" } }
                );

                if (r2.ok) {
                    const availableDatesData = await r2.json();
                    const availableDatesSet = new Set(availableDatesData.map(d => d.checkin));

                    const calendarDiv = jte({ tag: 'calendar' });
                    calendarDiv.appendChild(jte({ tag: 'h2', innerhtml: 'Available Dates:' }));

                    let currentMonth = -1;
                    let monthContainer;
                    let daysGrid;

                    const startDate = new Date(today.getFullYear(), today.getMonth(), 1); // Start from 1st of current month
                    const endDate = new Date(sixtyDaysFromNow.getFullYear(), sixtyDaysFromNow.getMonth() + 1, 0); // End at last day of the month containing the 60th day

                    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                        const month = d.getMonth();
                        const year = d.getFullYear();

                        if (month !== currentMonth) {
                            // Complete the grid of the *previous* month if it exists
                            if (currentMonth !== -1) {
                                const lastDayOfPreviousMonth = new Date(d.getFullYear(), currentMonth + 1, 0);
                                const lastDayOfPreviousMonthDayOfWeek = lastDayOfPreviousMonth.getDay();
                                for (let j = lastDayOfPreviousMonthDayOfWeek; j < 6; j++) {
                                    daysGrid.appendChild(jte({ tag: 'div', class: 'day-cell empty', innerhtml: '&nbsp;' }));
                                }
                            }

                            currentMonth = month;
                            monthContainer = jte({ tag: 'div', class: 'month-container' });
                            monthContainer.appendChild(jte({ tag: 'div', class: 'month-header', innerhtml: `${d.toLocaleString('default', { month: 'long' })} ${year}` }));
                            daysGrid = jte({ tag: 'div', class: 'days-grid' });
                            calendarDiv.appendChild(monthContainer);
                            monthContainer.appendChild(daysGrid);

                            // Add leading empty cells for the current month
                            const firstDayOfMonth = new Date(year, month, 1);
                            const firstDayOfMonthDayOfWeek = firstDayOfMonth.getDay(); // 0 for Sunday, 6 for Saturday
                            for (let j = 0; j < firstDayOfMonthDayOfWeek; j++) {
                                daysGrid.appendChild(jte({ tag: 'div', class: 'day-cell empty', innerhtml: '&nbsp;' }));
                            }
                        }

                        const dateString = d.toISOString().split('T')[0];
                        const dayCell = jte({ tag: 'div', class: 'day-cell' });

                        // Only add date number if it's within the 60-day range
                        if (d >= today && d <= sixtyDaysFromNow) {
                            dayCell.innerHTML = d.getDate();
                            if (availableDatesSet.has(dateString)) {
                                dayCell.classList.add('available');
                                dayCell.onclick = () => {
                                    const checkinDate = new Date(dateString);
                                    const checkoutDate = new Date(checkinDate);
                                    checkoutDate.setDate(checkinDate.getDate() + 3);
                                    const checkoutDateString = checkoutDate.toISOString().split('T')[0];
                                    window.open(`https://www.airbnb.com.br/rooms/${item.room}?adults=12&check_in=${dateString}&check_out=${checkoutDateString}`, '_blank');
                                };
                            } else {
                                dayCell.classList.add('unavailable-date');
                                dayCell.onclick = () => {
                                    const checkinDate = new Date(dateString);
                                    const checkoutDate = new Date(checkinDate);
                                    checkoutDate.setDate(checkinDate.getDate() + 3);
                                    const checkoutDateString = checkoutDate.toISOString().split('T')[0];
                                    window.open(`https://www.airbnb.com.br/rooms/${item.room}?adults=12&check_in=${dateString}&check_out=${checkoutDateString}`, '_blank');
                                };
                            }
                        } else {
                            dayCell.classList.add('empty'); // Mark as empty if outside 60-day range
                            dayCell.innerHTML = '&nbsp;'; // Add &nbsp; for empty cells
                        }
                        daysGrid.appendChild(dayCell);
                    }

                    // After the loop, complete the grid for the very last month displayed
                    if (daysGrid) {
                        const lastDayOfLastMonthDisplayed = new Date(endDate); // Use endDate for the last day
                        const lastDayOfLastMonthDisplayedDayOfWeek = lastDayOfLastMonthDisplayed.getDay();

                        for (let j = lastDayOfLastMonthDisplayedDayOfWeek; j < 6; j++) {
                            daysGrid.appendChild(jte({ tag: 'div', class: 'day-cell empty', innerhtml: '&nbsp;' }));
                        }
                    }

                    div.appendChild(calendarDiv);
                }

            } else {
                div.appendChild(jte({ tag: 'p', innerhtml: "Nenhum detalhe encontrado para este ID." }));
            }
        } catch (error) {
            console.error('Erro ao buscar detalhes do item:', error);
            div.innerHTML = 'Ocorreu um erro ao carregar os detalhes do item.';
        }
    };


    fetchDataForId(globalThis.modal.id);

})();