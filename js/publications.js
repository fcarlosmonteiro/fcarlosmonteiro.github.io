(function($) {
  "use strict";

  // Mapeamento de meses em português para inglês
  const mesesMap = {
    'janeiro': 'January',
    'fevereiro': 'February',
    'março': 'March',
    'abril': 'April',
    'maio': 'May',
    'junho': 'June',
    'julho': 'July',
    'agosto': 'August',
    'setembro': 'September',
    'outubro': 'October',
    'novembro': 'November',
    'dezembro': 'December'
  };

  // Mapeamento numérico de meses para ordenação
  const mesesNum = {
    'janeiro': 1, 'fevereiro': 2, 'março': 3, 'abril': 4,
    'maio': 5, 'junho': 6, 'julho': 7, 'agosto': 8,
    'setembro': 9, 'outubro': 10, 'novembro': 11, 'dezembro': 12
  };

  // Formata autores no padrão do HTML (Sobrenome, Nome)
  function formatarAutores(autores) {
    return autores.map(autor => {
      const partes = autor.trim().split(' ');
      if (partes.length >= 2) {
        const sobrenome = partes[partes.length - 1];
        const nome = partes[0];
        const meio = partes.length > 2 ? ' ' + partes.slice(1, -1).join(' ') : '';
        return `${sobrenome}, ${nome}${meio}`;
      }
      return autor;
    }).join('; ');
  }

  // Converte mês para inglês e formata data
  function formatarData(ano, mes) {
    const mesIngles = mesesMap[mes.toLowerCase()] || mes;
    return `${mesIngles} ${ano}`;
  }

  // Gera HTML de uma publicação
  function criarPublicacaoHTML(publicacao) {
    const dataFormatada = formatarData(publicacao.ano, publicacao.mes);
    const autoresFormatados = formatarAutores(publicacao.autores);
    
    // Determina se deve ter link
    const temLink = publicacao.link && publicacao.link.trim() !== '';
    const tituloHTML = temLink 
      ? `<a href="${publicacao.link}" target="_blank" rel="noopener noreferrer">${publicacao.titulo}</a>`
      : publicacao.titulo;
    
    // Informação do evento/periódico
    const infoEvento = publicacao.evento_periodico || publicacao.tipo || '';
    
    return `
      <div class="resume-item d-flex flex-column flex-md-row justify-content-between mb-5">
        <div class="resume-content">
          <h5 class="mb-0">${tituloHTML}</h5>
          <div class="text-primary mb-3">${autoresFormatados}</div>
          ${infoEvento ? `<p>${infoEvento}</p>` : '<p></p>'}
        </div>
        <div class="resume-date text-md-right">
          <span class="text-primary">${dataFormatada}</span>
        </div>
      </div>
    `;
  }

  // Ordena publicações por data (mais recente primeiro)
  function ordenarPublicacoes(publicacoes) {
    return publicacoes.sort((a, b) => {
      if (a.ano !== b.ano) {
        return b.ano - a.ano; // Ano decrescente
      }
      // Se mesmo ano, ordena por mês
      const mesA = mesesNum[a.mes.toLowerCase()] || 0;
      const mesB = mesesNum[b.mes.toLowerCase()] || 0;
      return mesB - mesA; // Mês decrescente
    });
  }

  // Carrega JSON usando XMLHttpRequest (funciona melhor com file://)
  function carregarJSONComXHR(url, callback) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (xhr.status === 200 || xhr.status === 0) { // 0 para file://
          try {
            const data = JSON.parse(xhr.responseText);
            callback(null, data);
          } catch (e) {
            callback(new Error('Erro ao parsear JSON: ' + e.message), null);
          }
        } else {
          callback(new Error(`Erro HTTP: ${xhr.status}`), null);
        }
      }
    };
    xhr.onerror = function() {
      callback(new Error('Erro de rede ao carregar JSON'), null);
    };
    xhr.send();
  }

  // Carrega e renderiza publicações
  function carregarPublicacoes() {
    const container = document.getElementById('publications-container');
    
    if (!container) {
      console.error('Container de publicações não encontrado!');
      return;
    }

    // Mostra indicador de carregamento
    container.innerHTML = '<p class="text-center text-muted">Carregando publicações...</p>';

    // Tenta primeiro com fetch (melhor para servidores HTTP)
    const isFileProtocol = window.location.protocol === 'file:';
    
    if (isFileProtocol) {
      // Para file://, usa XMLHttpRequest
      carregarJSONComXHR('publicacoes.json', function(error, data) {
        if (error) {
          console.error('Erro ao carregar publicações:', error);
          container.innerHTML = `
            <div class="alert alert-warning" role="alert">
              <strong>Erro ao carregar publicações.</strong><br>
              <p>Para visualizar as publicações, é necessário usar um servidor local.</p>
              <p><strong>Soluções:</strong></p>
              <ul class="text-left">
                <li>Execute <code>npm start</code> ou <code>gulp dev</code> no terminal</li>
                <li>Ou use Python: <code>python -m http.server 8000</code></li>
                <li>Ou use um servidor local como Live Server</li>
              </ul>
              <br><small>Erro: ${error.message}</small>
            </div>
          `;
          return;
        }
        renderizarPublicacoes(data, container);
      });
    } else {
      // Para HTTP/HTTPS, usa fetch
      fetch('publicacoes.json')
        .then(response => {
          if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          renderizarPublicacoes(data, container);
        })
        .catch(error => {
          console.error('Erro ao carregar publicações:', error);
          container.innerHTML = `
            <div class="alert alert-danger" role="alert">
              <strong>Erro ao carregar publicações.</strong> Por favor, recarregue a página ou verifique sua conexão.
              <br><small>${error.message}</small>
            </div>
          `;
        });
    }
  }

  // Renderiza as publicações no container
  function renderizarPublicacoes(data, container) {
    // Limpa o container
    container.innerHTML = '';

    // Ordena publicações
    const publicacoesOrdenadas = ordenarPublicacoes(data.publicacoes);

    // Renderiza cada publicação
    publicacoesOrdenadas.forEach(publicacao => {
      container.innerHTML += criarPublicacaoHTML(publicacao);
    });

    // Adiciona link "MORE" se existir no JSON
    if (data.lattes_url) {
      container.innerHTML += `<h5><a href="${data.lattes_url}" target="_blank" rel="noopener noreferrer">MORE</a></h5>`;
    }
  }

  // Inicializa quando o DOM estiver pronto
  $(document).ready(function() {
    carregarPublicacoes();
  });

})(jQuery);

