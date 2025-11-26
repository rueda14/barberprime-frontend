// ================================
// CONFIGURAÇÃO DA API
// ================================
const API_BASE_URL = "https://barberprime-backend.onrender.com"; 
// Se a URL do backend no Render for outra, TROQUE aqui em cima.

// ================================
// FUNÇÕES GERAIS
// ================================

function formatarDataBR(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso; // se não for ISO, devolve como veio
  return d.toLocaleDateString("pt-BR");
}

function mostrarErroPadrao(mensagemExtra) {
  alert(mensagemExtra || "Ocorreu um erro. Tente novamente.");
}

// ================================
// PÁGINA INICIAL (index.html)
// ================================
function initPaginaIndex() {
  const cardsServicos = document.querySelectorAll(".card-servico");
  const selectedServiceText = document.getElementById("selectedServiceText");
  const servicoSelect = document.getElementById("servicoSelect");
  const resumoPreco = document.getElementById("resumoPreco");
  const formAgendamento = document.getElementById("formAgendamento");

  // Seleção de serviço clicando nos cards
  cardsServicos.forEach(card => {
    card.addEventListener("click", () => {
      cardsServicos.forEach(c => c.classList.remove("selecionado"));
      card.classList.add("selecionado");

      const servico = card.dataset.servico;
      const preco = card.dataset.preco;

      if (selectedServiceText) {
        selectedServiceText.textContent = `Serviço selecionado: ${servico} (R$ ${preco},00)`;
      }

      if (servicoSelect) {
        servicoSelect.value = servico;
      }

      if (resumoPreco) {
        resumoPreco.textContent = `Valor estimado: R$ ${preco},00`;
      }
    });
  });

  // Atualiza resumo quando escolher pelo select
  if (servicoSelect && resumoPreco) {
    servicoSelect.addEventListener("change", () => {
      const option = servicoSelect.options[servicoSelect.selectedIndex];
      const texto = option.textContent || "";
      if (!servicoSelect.value) {
        resumoPreco.textContent = "Selecione um serviço para ver o valor estimado.";
        return;
      }
      resumoPreco.textContent = `Serviço selecionado: ${texto}`;
    });
  }

  // Envio do formulário de agendamento
  if (formAgendamento) {
    formAgendamento.addEventListener("submit", async (e) => {
      e.preventDefault();

      const nome = document.getElementById("nome")?.value.trim();
      const email = document.getElementById("email")?.value.trim();
      const telefone = document.getElementById("telefone")?.value.trim();
      const servico = servicoSelect?.value || "";
      const data = document.getElementById("data")?.value;
      const hora = document.getElementById("hora")?.value;
      const observacoes = document.getElementById("observacoes")?.value.trim();

      if (!nome || !email || !servico || !data || !hora) {
        alert("Preencha todos os campos obrigatórios.");
        return;
      }

      try {
        const resp = await fetch(`${API_BASE_URL}/agendamentos`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            nome_cliente: nome,
            email,
            telefone,
            servico,
            data,
            hora,
            observacoes
          })
        });

        if (!resp.ok) {
          console.error("Erro ao criar agendamento:", await resp.text());
          mostrarErroPadrao("Não foi possível enviar o agendamento.");
          return;
        }

        alert("Agendamento enviado com sucesso! Entraremos em contato para confirmação.");
        formAgendamento.reset();
        cardsServicos.forEach(c => c.classList.remove("selecionado"));
        if (selectedServiceText) {
          selectedServiceText.textContent = "Nenhum serviço selecionado.";
        }
        if (resumoPreco) {
          resumoPreco.textContent = "Selecione um serviço para ver o valor estimado.";
        }
      } catch (err) {
        console.error("Erro inesperado ao agendar:", err);
        mostrarErroPadrao();
      }
    });
  }
}

// ================================
// LOGIN (login.html)
// ================================
function initPaginaLogin() {
  const formLogin = document.getElementById("formLogin");
  const btnFakeCadastro = document.getElementById("btnFakeCadastro");

  if (btnFakeCadastro) {
    btnFakeCadastro.addEventListener("click", (e) => {
      e.preventDefault();
      alert("Cadastro de funcionário é realizado apenas pela administração da barbearia.");
    });
  }

  if (formLogin) {
    formLogin.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("email")?.value.trim();
      const senha = document.getElementById("senha")?.value.trim();

      if (!email || !senha) {
        alert("Preencha e-mail e senha.");
        return;
      }

      try {
        const resp = await fetch(`${API_BASE_URL}/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ email, senha })
        });

        if (!resp.ok) {
          if (resp.status === 401) {
            alert("Usuário ou senha inválidos.");
          } else {
            console.error("Erro no login:", await resp.text());
            mostrarErroPadrao("Erro ao realizar login.");
          }
          return;
        }

        const dados = await resp.json();
        // Guarda info simples no localStorage
        localStorage.setItem("usuarioLogado", JSON.stringify(dados.usuario));

        // Redireciona para o painel
        window.location.href = "painel.html";
      } catch (err) {
        console.error("Erro inesperado no login:", err);
        mostrarErroPadrao();
      }
    });
  }
}

// ================================
// PAINEL (painel.html)
// ================================
function initPaginaPainel() {
  const listaAgendamentos = document.getElementById("listaAgendamentos");
  const logoutBtn = document.getElementById("logoutBtn");

  // Checa se tem "usuário logado" (bem simples, só front)
  const usuarioStr = localStorage.getItem("usuarioLogado");
  if (!usuarioStr) {
    // Se não tiver, manda para login
    window.location.href = "login.html";
    return;
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("usuarioLogado");
      window.location.href = "login.html";
    });
  }

  async function carregarAgendamentos() {
    try {
      const resp = await fetch(`${API_BASE_URL}/agendamentos`);
      if (!resp.ok) {
        console.error("Erro ao listar agendamentos:", await resp.text());
        mostrarErroPadrao("Erro ao buscar agendamentos.");
        return;
      }

      const agendamentos = await resp.json();

      if (!listaAgendamentos) return;
      listaAgendamentos.innerHTML = "";

      if (!agendamentos || agendamentos.length === 0) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 5;
        td.textContent = "Nenhum agendamento encontrado.";
        tr.appendChild(td);
        listaAgendamentos.appendChild(tr);
        return;
      }

      agendamentos.forEach((ag) => {
        const tr = document.createElement("tr");

        const tdCliente = document.createElement("td");
        tdCliente.textContent = ag.nome_cliente || "";

        const tdServico = document.createElement("td");
        tdServico.textContent = ag.servico || "";

        const tdData = document.createElement("td");
        tdData.textContent = ag.data || "";

        const tdHora = document.createElement("td");
        tdHora.textContent = ag.hora || "";

        const tdAcoes = document.createElement("td");
        const btnExcluir = document.createElement("button");
        btnExcluir.textContent = "Excluir";
        btnExcluir.className = "btn-secondary";
        btnExcluir.style.fontSize = "0.8rem";
        btnExcluir.dataset.id = ag.id; // UUID do agendamento
        tdAcoes.appendChild(btnExcluir);

        tr.appendChild(tdCliente);
        tr.appendChild(tdServico);
        tr.appendChild(tdData);
        tr.appendChild(tdHora);
        tr.appendChild(tdAcoes);

        listaAgendamentos.appendChild(tr);
      });

    } catch (err) {
      console.error("Erro inesperado ao carregar agendamentos:", err);
      mostrarErroPadrao("Erro ao carregar agendamentos.");
    }
  }

  // Clique no botão Excluir (event delegation)
  if (listaAgendamentos) {
    listaAgendamentos.addEventListener("click", async (e) => {
      const alvo = e.target;
      if (alvo.tagName === "BUTTON" && alvo.dataset.id) {
        const id = alvo.dataset.id;
        const confirmar = window.confirm("Deseja realmente excluir este agendamento?");
        if (!confirmar) return;

        try {
          const resp = await fetch(`${API_BASE_URL}/agendamentos/${id}`, {
            method: "DELETE"
          });

          if (!resp.ok) {
            console.error("Erro ao deletar agendamento:", await resp.text());
            mostrarErroPadrao("Erro ao deletar agendamento.");
            return;
          }

          // Recarrega a lista
          await carregarAgendamentos();
        } catch (err) {
          console.error("Erro inesperado ao deletar agendamento:", err);
          mostrarErroPadrao();
        }
      }
    });
  }

  // Carrega ao abrir o painel
  carregarAgendamentos();
}

// ================================
// INICIALIZAÇÃO GLOBAL
// ================================
document.addEventListener("DOMContentLoaded", () => {
  // Pela classe do body a gente sabe qual página é
  if (document.body.classList.contains("login-body")) {
    initPaginaLogin();
  } else if (document.body.classList.contains("painel-body")) {
    initPaginaPainel();
  } else {
    // Se não for login nem painel, assumimos que é index.html
    initPaginaIndex();
  }
});
