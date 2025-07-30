(async function () {
    speedj('/css/config_job/config_job.css');
    const mainContainer = jte({ tag: 'div' });
    const dialog = navdialog.create_dialog(mainContainer, {});
    navdialog.show_dialog(dialog);

    const updateJobStatus = async (jobId, newStatus) => {
        if (!globalThis.supabase) {
            console.error('Cliente Supabase não inicializado.');
            return;
        }

        try {
            const { data, error } = await globalThis.supabase
                .from('jobs')
                .update({ status: newStatus })
                .eq('id', jobId)
                .select();

            if (error) {
                throw new Error(`Erro ao atualizar o status do job ${jobId}: ${error.message}`);
            }
            fetchAndDisplayJobs();
        } catch (error) {
            console.error('Erro ao atualizar job:', error);
            alert('Ocorreu um erro ao atualizar o status: ' + error.message);
        }
    };

    const displayJobs = (jobs) => {
        mainContainer.innerHTML = '';
        let label = null;

        if (jobs.length > 0) {
            jobs.forEach(job => {
                const jobItem = jte({ tag: 'item' });

                // Exibir room_title apenas se for o primeiro registro ou se for diferente do anterior
                if (job.label !== label) {
                    const roomTitleElement = jte({ tag: 'label' });
                    roomTitleElement.appendChild(document.createTextNode(job.room_title || 'N/A'));
                    jobItem.appendChild(roomTitleElement);
                    label = job.label;
                }

                const desiredFields = ['room_title','id', 'adults', 'min_bedrooms', 'days', 'distinct_rooms', 'total_records_for_tagged_room', 'best_price_count_for_tagged_room', 'best_position_count_for_tagged_room'];
                
                desiredFields.forEach(fieldKey => {
                    const fieldElement = jte({ tag: fieldKey });
                    fieldElement.appendChild(document.createTextNode(job[fieldKey] || '0'));
                    jobItem.appendChild(fieldElement);
                });

                const startButton = jte({ 
                    tag: 'start', 
                    class: 'material-symbols-outlined',
                    innerhtml: 'start' 
                });
                
                if (job.status === 'start') {
                    startButton.setAttribute('disabled', '');
                } else {
                    startButton.removeAttribute('disabled');
                }

                startButton.onclick = () => updateJobStatus(job.id, 'start');
                jobItem.appendChild(startButton);

                mainContainer.appendChild(jobItem);
            });
        } else {
            mainContainer.innerHTML = 'Nenhum dado encontrado na tabela de jobs.';
        }
    };

    const fetchAndDisplayJobs = async () => {
        if (!globalThis.supabase) {
            console.error('Cliente Supabase não inicializado. Certifique-se de que `globalThis.supabase` está configurado.');
            mainContainer.innerHTML = 'Ocorreu um erro: Cliente Supabase não inicializado.';
            return;
        }

        try {
            const { data, error } = await globalThis.supabase
                .from('view_jobs')
                .select('id,label,adults,min_bedrooms,days,tag,status,distinct_rooms,total_records_for_tagged_room,best_price_count_for_tagged_room,best_position_count_for_tagged_room,room_title,room_host,room_id')
                .order('id', { ascending: false });

            if (error) {
                console.error('Erro ao buscar dados do Supabase:', error);
                mainContainer.innerHTML = 'Ocorreu um erro ao carregar os dados: ' + error.message;
                return;
            }
            globalThis.jobs = data;
            displayJobs(data);
        } catch (error) {
            console.error('Erro geral ao buscar e exibir jobs:', error);
            mainContainer.innerHTML = 'Ocorreu um erro inesperado ao carregar os dados.';
        }
    };

    fetchAndDisplayJobs();
})();