(async function () {
    speedj('http://localhost:8080/css/room.css');
    globalThis.modal = globalThis.modal || {};

    const div = jte({ tag: 'div', });
    const dialog = navdialog.create_dialog(div, {});
    navdialog.show_dialog(dialog);

    const icon = 'material-symbols-outlined';

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
                const today = new Date();
                const sixtyDaysFromNow = new Date(today);
                sixtyDaysFromNow.setDate(today.getDate() + 59); // +59 to include today and next 59 days

                const todayFormatted = today.toISOString().split('T')[0];
                const sixtyDaysFromNowFormatted = sixtyDaysFromNow.toISOString().split('T')[0];

                const allNext60Days = [];
                for (let i = 0; i < 60; i++) {
                    const date = new Date(today);
                    date.setDate(today.getDate() + i);
                    allNext60Days.push(date);
                }

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

                    allNext60Days.forEach(date => {
                        const month = date.getMonth();
                        const year = date.getFullYear();

                        if (month !== currentMonth) {
                            currentMonth = month;
                            monthContainer = jte({ tag: 'div', class: 'month-container' });
                            monthContainer.appendChild(jte({ tag: 'div', class: 'month-header', innerhtml: `${date.toLocaleString('default', { month: 'long' })} ${year}` }));
                            const daysGrid = jte({ tag: 'div', class: 'days-grid' });
                            monthContainer.appendChild(daysGrid);
                            calendarDiv.appendChild(monthContainer);
                        }

                        const dateString = date.toISOString().split('T')[0];
                        const dayCell = jte({ tag: 'div', class: 'day-cell', innerhtml: date.getDate() });

                        if (!availableDatesSet.has(dateString)) {
                            dayCell.classList.add('unavailable-date');
                        }
                        monthContainer.querySelector('.days-grid').appendChild(dayCell);
                    });

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