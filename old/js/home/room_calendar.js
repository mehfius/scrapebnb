(async function () {
    speedj('/css/room_calendar.css');

    globalThis.createCalendar = async function (item) {
        const calendarDiv = jte({ tag: 'calendar' });
        //calendarDiv.appendChild(jte({ tag: 'h2', innerhtml: 'Available Dates:' }));

        const today = new Date();
        const sixtyDaysFromNow = new Date(today);
        sixtyDaysFromNow.setDate(today.getDate() + 59); // +59 to include today and next 59 days

        const todayFormatted = today.toISOString().split('T')[0];
        const sixtyDaysFromNowFormatted = sixtyDaysFromNow.toISOString().split('T')[0];

        try {
            const r2 = await fetch(
                `${globalThis.auth.SUPABASE_URL}/rest/v1/frontend?select=checkin&room=eq.${item.room}&job=eq.${item.job}&checkin=gte.${todayFormatted}&checkin=lte.${sixtyDaysFromNowFormatted}`,
                { headers: { Apikey: globalThis.auth.SUPABASE_ANON_KEY, "Content-Type": "application/json" } }
            );

            if (!r2.ok) {
                throw new Error(`Erro ao buscar dados de disponibilidade: ${r2.statusText}`);
            }

            const availableDatesData = await r2.json();
            const availableDatesSet = new Set(availableDatesData.map(d => d.checkin));

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
        } catch (error) {
            console.error('Erro ao buscar detalhes do item:', error);
            calendarDiv.innerHTML = 'Ocorreu um erro ao carregar os detalhes do item.';
        }

        return calendarDiv;
    };
})();