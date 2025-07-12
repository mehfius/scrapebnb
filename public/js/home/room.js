(async function () {
    speedj('/css/room.css');
    speedj('/js/home/room_calendar.js');
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
                `${globalThis.auth.SUPABASE_URL}/rest/v1/frontend?select=id,name,room_image_array,tiny_description,position,title,price,checkin,host_image,favorite,superhost,room,job,reference&id=eq.${itemId}`,
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
                        let isExpanded = false; 

                        descriptionElement.onclick = () => {
                            if (isExpanded) {
                                descriptionElement.innerHTML = truncatedDescription;
                            } else {
                                descriptionElement.innerHTML = fullDescription;
                            }
                            isExpanded = !isExpanded; 
                        };
                    }
                    div.appendChild(descriptionElement);
                }

                const host = jte({ tag: 'host' });
                if (item.host_image) {
                    host.appendChild(jte({ tag: 'img', src: item.host_image }));
                }
                host.appendChild(jte({ tag: 'name', innerhtml: item.name }));
                
                // Adiciona o evento onclick ao elemento host
                if (item.room) {
                    host.onclick = () => {
                        window.open(`https://www.airbnb.com.br/rooms/${item.room}`, '_blank');
                    };
                }
                div.appendChild(host);

               
                const priceElement = jte({ tag: 'price', innerhtml: `R$ ${item.price}` });

                const referenceSelect = jte({ tag: 'select' });
                const defaultOption = jte({ tag: 'option', value: '', innerhtml: 'Não selecionado' });
                referenceSelect.appendChild(defaultOption);
                if (item.reference === null) {
                    defaultOption.selected = true;
                }

                try {
                    const ref_r = await fetch(
                        `${globalThis.auth.SUPABASE_URL}/rest/v1/reference?select=id,label`,
                        { headers: { Apikey: globalThis.auth.SUPABASE_ANON_KEY, "Content-Type": "application/json" } }
                    );

                    if (!ref_r.ok) {
                        throw new Error(`Erro ao buscar referências: ${ref_r.statusText}`);
                    }

                    const references = await ref_r.json();
                    references.forEach(ref => {
                        const option = jte({ tag: 'option', value: ref.id, innerhtml: ref.label });
                        if (item.reference === ref.id) {
                            option.selected = true;
                        }
                        referenceSelect.appendChild(option);
                    });
                } catch (refError) {
                    console.error('Erro ao carregar referências:', refError);
                    
                }
                //priceWrapper.appendChild(referenceSelect);
                div.appendChild(priceElement);
                div.appendChild(referenceSelect);
                referenceSelect.onchange = async (event) => {
                    const selectedReferenceId = event.target.value === '' ? null : parseInt(event.target.value);
                    const roomIdToUpdate = item.room; 

                    if (roomIdToUpdate) {
                        try {
                            const updateResponse = await fetch(
                                `${globalThis.auth.SUPABASE_URL}/rest/v1/rooms?id=eq.${roomIdToUpdate}`,
                                {
                                    method: 'PATCH',
                                    headers: {
                                        Apikey: globalThis.auth.SUPABASE_ANON_KEY,
                                        "Content-Type": "application/json",
                                        "Prefer": "return=minimal" 
                                    },
                                    body: JSON.stringify({ reference: selectedReferenceId })
                                }
                            );

                            if (!updateResponse.ok) {
                                throw new Error(`Erro ao atualizar a referência: ${updateResponse.statusText}`);
                            } else {
                                console.log('Referência atualizada com sucesso.');
                            }
                        } catch (updateError) {
                            console.error('Erro ao atualizar a referência:', updateError);
                            alert('Erro ao atualizar a referência. Tente novamente.');
                        }
                    } else {
                        console.warn('ID da sala não encontrado para atualização.');
                    }
                };

                const job = globalThis.jobs.find(j => j.id === item.job);
                if (job) {
                    //const url = `${job.url}?adults=${job.adults}&min_bedrooms=${job.min_bedrooms}`;
                    const checkinDateString = item.checkin;
                    const checkinDate = new Date(checkinDateString);
                    const checkoutDate = new Date(checkinDate);
                            checkoutDate.setDate(checkinDate.getDate() + 3);
                    const checkoutDateString = checkoutDate.toISOString().split('T')[0];
                    const url = `${job.url}&adults=${job.adults}&min_bedrooms=${job.min_bedrooms}&check_in=${checkinDateString}&check_out=${checkoutDateString}${job.amenities && job.amenities.length > 0 ? job.amenities.map(amenity => `&amenities%5B%5D=${amenity}`).join('') : ''}${job.price_max ? `&price_max=${job.price_max}&price_filter_input_type=${job.price_filter_input_type}` : ''}`;                    
                    const viewJobLink = jte({ tag: 'a', innerhtml: 'Ver Anúncio', target: '_blank', href: url });
                    div.appendChild(viewJobLink);
                } else {
                    console.error('Job not found for item.job:', item.job);
                }

                const calendarDiv = await globalThis.createCalendar(item);
                div.appendChild(calendarDiv);

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