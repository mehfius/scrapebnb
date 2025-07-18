(async function () {
    const div = jte({ tag: 'div', });
    const dialog = navdialog.create_dialog(div, {});
    navdialog.show_dialog(dialog);

    const eJobTable = jte({
        tag: 'table',
        id: 'job-table',
    });
    div.append(eJobTable);

    const thead = jte({ tag: 'thead' });
    const theadRow = jte({ tag: 'tr' });
    thead.appendChild(theadRow);
    eJobTable.appendChild(thead);

    const tbody = jte({ tag: 'tbody' });
    eJobTable.appendChild(tbody);

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
            console.log(`Status do job ${jobId} atualizado para '${newStatus}'.`, data);
        } catch (error) {
            console.error('Erro ao atualizar job:', error);
            alert('Ocorreu um erro ao atualizar o status: ' + error.message);
        }
    };

    const displayJobs = (jobs) => {
        theadRow.innerHTML = '';
        tbody.innerHTML = '';

        if (jobs.length > 0) {
            const desiredColumns = ['id', 'adults', 'min_bedrooms', 'days', 'tag', 'status', 'remaining_seconds'];
            
            theadRow.appendChild(jte({ tag: 'th', innerhtml: 'Ação' }));
            desiredColumns.forEach(key => {
                theadRow.appendChild(jte({ tag: 'th', innerhtml: key }));
            });

            jobs.forEach(job => {
                const row = jte({ tag: 'tr' });
                
                const actionCell = jte({ tag: 'td' });
                const startButton = jte({ 
                    tag: 'button', 
                    innerhtml: 'Start', 
                    class: 'start-button'
                });
                
                if (job.status === 'start') {
                    startButton.setAttribute('disabled', '');
                } else {
                    startButton.removeAttribute('disabled');
                }

                startButton.onclick = () => updateJobStatus(job.id, 'start');
                actionCell.appendChild(startButton);

                row.appendChild(actionCell);

                desiredColumns.forEach(key => {
                    row.appendChild(jte({ tag: 'td', innerhtml: job[key] }));
                });
                tbody.appendChild(row);
            });
        } else {
            div.innerHTML = 'Nenhum dado encontrado na tabela de jobs.';
        }
    };

    const setupRealtimeListener = () => {
        if (!globalThis.supabase) {
            console.error('Cliente Supabase não inicializado. Certifique-se de que `globalThis.supabase` está configurado.');
            div.innerHTML = 'Ocorreu um erro: Cliente Supabase não inicializado.';
            return;
        }

        globalThis.supabase
            .from('jobs')
            .select('id,adults,min_bedrooms,days,tag,status,remaining_seconds')
            .then(({ data, error }) => {
                if (error) {
                    console.error('Erro ao buscar dados iniciais do Supabase:', error);
                    div.innerHTML = 'Ocorreu um erro ao carregar os dados: ' + error.message;
                    return;
                }
                globalThis.jobs = data;
                div.innerHTML = '';
                div.append(eJobTable);
                displayJobs(data);
            });

        globalThis.supabase
            .channel('public:jobs')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, payload => {
                console.log('Change received!', payload);
                globalThis.supabase
                    .from('jobs')
                    .select('id,adults,min_bedrooms,days,tag,status,remaining_seconds')
                    .then(({ data, error }) => {
                        if (error) {
                            console.error('Erro ao buscar dados do Supabase após atualização:', error);
                            return;
                        }
                        globalThis.jobs = data;
                        displayJobs(data);
                    });
            })
            .subscribe((status, err) => {
                if (status === 'SUBSCRIBED') {
                    console.log('Conectado ao canal em tempo real!');
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('Erro no canal em tempo real:', err.message);
                } else if (status === 'TIMED_OUT') {
                    console.warn('Tempo limite excedido para conexão em tempo real.');
                } else if (status === 'CLOSED') {
                    console.log('Canal em tempo real fechado inesperadamente.');
                }
            });
    };

    setupRealtimeListener();
})();