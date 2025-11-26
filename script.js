const API_BASE_URL = 'http://localhost:3000';

// ===============================
// FORMULÁRIO DE AGENDAMENTO
// (index.html)
// ===============================
const formAgendamento = document.getElementById('formAgendamento');

if (formAgendamento) {
    formAgendamento.addEventListener('submit', async (e) => {
        e.preventDefault();

        const payload = {
            nome_cliente: formAgendamento.nome.value,
            email: formAgendamento.email.value,
            telefone: formAgendamento.telefone.value,
            servico: formAgendamento.servico.value,
            data: formAgendamento.data.value,
            hora: formAgendamento.hora.value,
            observacoes: formAgendamento.observacoes.value
        };

        try {
            const response = await fetch(`${API_BASE_URL}/agendamentos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                alert('Erro ao agendar.');
                return;
            }

            alert('Agendamento enviado com sucesso!');
            formAgendamento.reset();
        } catch (error) {
            console.error(error);
            alert('Erro de conexão com o servidor.');
        }
    });
}


// ===============================
// PAINEL - LISTAR AGENDAMENTOS
// (painel.html)
// ===============================
const tabelaAgendamentosBody = document.getElementById('listaAgendamentos');

async function carregarAgendamentos() {
    // Se não estiver na página painel.html, não faz nada
    if (!tabelaAgendamentosBody) return;

    // Mensagem temporária
    tabelaAgendamentosBody.innerHTML = `
        <tr>
            <td colspan="5">Carregando agendamentos...</td>
        </tr>
    `;

    try {
        const resp = await fetch(`${API_BASE_URL}/agendamentos`);

        if (!resp.ok) {
            tabelaAgendamentosBody.innerHTML = `
                <tr>
                    <td colspan="5">Erro ao carregar agendamentos.</td>
                </tr>
            `;
            return;
        }

        const lista = await resp.json();

        if (!lista.length) {
            tabelaAgendamentosBody.innerHTML = `
                <tr>
                    <td colspan="5">Nenhum agendamento encontrado.</td>
                </tr>
            `;
            return;
        }

        // Limpa a tabela para preencher com os dados reais
        tabelaAgendamentosBody.innerHTML = '';

        lista.forEach(ag => {
            const tr = document.createElement('tr');

            const tdNome = document.createElement('td');
            tdNome.textContent = ag.nome_cliente;

            const tdServico = document.createElement('td');
            tdServico.textContent = ag.servico;

            // Formatando DATA
            const tdData = document.createElement('td');
            try {
                const d = new Date(ag.data);
                tdData.textContent = d.toLocaleDateString('pt-BR');
            } catch {
                tdData.textContent = ag.data;
            }

            // Formatando HORA
            const tdHora = document.createElement('td');
            try {
                const hora = ag.hora.substring(0, 5); // pega HH:MM
                tdHora.textContent = hora;
            } catch {
                tdHora.textContent = ag.hora;
            }

            const tdAcoes = document.createElement('td');
            const btnExcluir = document.createElement('button');
            btnExcluir.textContent = 'Excluir';
            btnExcluir.className = 'btn-secondary';
            btnExcluir.style.fontSize = '0.8rem';
            btnExcluir.style.padding = '0.3rem 0.6rem';

            btnExcluir.addEventListener('click', async () => {
                if (!confirm('Tem certeza que deseja excluir este agendamento?')) return;

                try {
                    const delResp = await fetch(`${API_BASE_URL}/agendamentos/${ag.id}`, {
                        method: 'DELETE'
                    });

                    if (!delResp.ok) {
                        alert('Erro ao excluir agendamento.');
                        return;
                    }

                    alert('Agendamento excluído com sucesso.');
                    carregarAgendamentos();
                } catch (error) {
                    console.error('Erro ao excluir:', error);
                    alert('Erro de conexão ao excluir agendamento.');
                }
            });

            tdAcoes.appendChild(btnExcluir);

            tr.appendChild(tdNome);
            tr.appendChild(tdServico);
            tr.appendChild(tdData);
            tr.appendChild(tdHora);
            tr.appendChild(tdAcoes);

            tabelaAgendamentosBody.appendChild(tr);
        });

    } catch (error) {
        console.error('Erro ao carregar agendamentos:', error);
        tabelaAgendamentosBody.innerHTML = `
            <tr>
                <td colspan="5">Erro de conexão ao buscar agendamentos.</td>
            </tr>
        `;
    }
}


// ===============================
// PROTEÇÃO DO PAINEL (painel.html)
// Só deixa entrar se estiver logado
// ===============================
if (tabelaAgendamentosBody) {
    const usuarioLogado = localStorage.getItem('usuarioLogado');

    if (!usuarioLogado) {
        alert('Você precisa estar logado para acessar o painel.');
        window.location.href = 'login.html';
    } else {
        carregarAgendamentos();
    }
}


// ===============================
// CADASTRO DE USUÁRIO (login.html)
// usando o link "Criar conta"
// ===============================
const btnCadastro = document.getElementById('btnFakeCadastro');

if (btnCadastro) {
    btnCadastro.addEventListener('click', async (e) => {
        e.preventDefault();

        const nome = prompt('Digite seu nome completo:');
        if (!nome) return;

        const email = prompt('Digite seu e-mail:');
        if (!email) return;

        const senha = prompt('Crie uma senha:');
        if (!senha) return;

        try {
            const resp = await fetch(`${API_BASE_URL}/usuarios`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, email, senha })
            });

            const dados = await resp.json();

            if (!resp.ok) {
                alert(dados.erro || 'Erro ao cadastrar usuário.');
                return;
            }

            alert('Usuário cadastrado com sucesso! Agora faça login.');
        } catch (error) {
            console.error('Erro no cadastro:', error);
            alert('Erro de conexão ao cadastrar usuário.');
        }
    });
}


// ===============================
// LOGIN (login.html)
// ===============================
const formLogin = document.getElementById('formLogin');

if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = formLogin.email.value;
        const senha = formLogin.senha.value;

        try {
            const resp = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha })
            });

            const dados = await resp.json();

            if (!resp.ok) {
                alert(dados.erro || 'Usuário ou senha inválidos.');
                return;
            }

            // Guarda o usuário logado no localStorage
            localStorage.setItem('usuarioLogado', JSON.stringify(dados.usuario));
            alert(`Bem-vindo, ${dados.usuario.nome}!`);
            window.location.href = 'painel.html';
        } catch (error) {
            console.error('Erro no login:', error);
            alert('Erro de conexão ao fazer login.');
        }
    });
}


// ===============================
// LOGOUT (botão "Sair" no painel)
// ===============================
const logoutBtn = document.getElementById('logoutBtn');

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('usuarioLogado');
        alert('Logout realizado.');
        window.location.href = 'login.html';
    });
}
