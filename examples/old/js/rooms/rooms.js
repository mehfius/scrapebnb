(async function () {
    speedj('/css/rooms/rooms.css');

    globalThis.modal = globalThis.modal || {};

    const div = jte({ tag: 'div', });
    const dialog = navdialog.create_dialog(div, {});
    navdialog.show_dialog(dialog);

    const fetchReferences = async () => {
        try {
            const ref_r = await fetch(
                `${globalThis.auth.SUPABASE_URL}/rest/v1/reference?select=id,label`,
                { headers: { Apikey: globalThis.auth.SUPABASE_ANON_KEY, "Content-Type": "application/json" } }
            );

            if (!ref_r.ok) {
                throw new Error(`Erro ao buscar referências: ${ref_r.statusText}`);
            }

            return await ref_r.json();
        } catch (refError) {
            console.error('Erro ao carregar referências:', refError);
            return [];
        }
    };

    const fetchRoomsAndDisplay = async () => {
        div.innerHTML = 'Carregando todas as rooms...';

        try {
            const references = await fetchReferences();

            const r = await fetch(
                `${globalThis.auth.SUPABASE_URL}/rest/v1/rooms?select=id,title,images,reference&limit=5`,
                { headers: { Apikey: globalThis.auth.SUPABASE_ANON_KEY, "Content-Type": "application/json" } }
            );

            if (!r.ok) {
                throw new Error(`Erro ao buscar dados das rooms: ${r.statusText}`);
            }

            const data = await r.json();

            div.innerHTML = '';

            if (data && data.length > 0) {
                data.forEach(item => {
                    div.appendChild(jte({ tag: 'h2', innerhtml: item.title }));

                    const referenceSelect = jte({ tag: 'select' });
                    const defaultOption = jte({ tag: 'option', value: '', innerhtml: 'Não selecionado' });
                    referenceSelect.appendChild(defaultOption);

                    if (item.reference === null) {
                        defaultOption.selected = true;
                    }

                    references.forEach(ref => {
                        const option = jte({ tag: 'option', value: ref.id, innerhtml: ref.label });
                        if (item.reference === ref.id) {
                            option.selected = true;
                        }
                        referenceSelect.appendChild(option);
                    });

                    referenceSelect.onchange = async (event) => {
                        const selectedReferenceId = event.target.value === '' ? null : parseInt(event.target.value);
                        const roomIdToUpdate = item.id;

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
                                    console.log(`Referência da room ${roomIdToUpdate} atualizada com sucesso para ${selectedReferenceId}.`);
                                }
                            } catch (updateError) {
                                console.error('Erro ao atualizar a referência:', updateError);
                                alert('Erro ao atualizar a referência. Tente novamente.');
                            }
                        } else {
                            console.warn('ID da room não encontrado para atualização.');
                        }
                    };
                    div.appendChild(referenceSelect);

                    if (item.images && item.images.length > 0) {
                        const gallery = jte({ tag: 'gallery' });
                        item.images.forEach(imageUrl => {
                            gallery.appendChild(jte({ tag: 'img', src: imageUrl }));
                        });
                        div.appendChild(gallery);
                    } else {
                        div.appendChild(jte({ tag: 'p', innerhtml: "Nenhuma imagem encontrada para esta room." }));
                    }
                });
            } else {
                div.appendChild(jte({ tag: 'p', innerhtml: "Nenhuma room encontrada." }));
            }
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            div.innerHTML = 'Ocorreu um erro ao carregar os dados das rooms.';
        }
    };

    fetchRoomsAndDisplay();

})();