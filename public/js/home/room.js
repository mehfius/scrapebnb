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
                `${globalThis.auth.SUPABASE_URL}/rest/v1/frontend?select=*&id=eq.${itemId}`,
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