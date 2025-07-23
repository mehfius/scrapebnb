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

        if (jobs.length > 0) {
            jobs.forEach(job => {
                const jobItem = jte({ tag: 'item' });

                const desiredFields = ['id', 'label', 'adults', 'min_bedrooms', 'days', 'status', 'distinct_rooms' ];
                
                desiredFields.forEach(fieldKey => {
                    const fieldElement = jte({ tag: fieldKey });
                    // Removido o elemento strong e o nome do campo
                    fieldElement.appendChild(document.createTextNode(job[fieldKey] || 'N/A'));
                    jobItem.appendChild(fieldElement);
                });

                const startButton = jte({ 
                    tag: 'start', 
                    class: 'material-icons',
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
                .select('id,label,adults,min_bedrooms,days,tag,status,distinct_rooms')
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