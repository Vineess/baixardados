const fs = require('fs');
const path = require('path');
const os = require('os');
const axios = require('axios');

// Caminho onde a pasta principal vai ser criada
const desktopPath = path.join(os.homedir(), 'Desktop');

// Nome da pasta principal
const pastaPrincipal = path.join(desktopPath, 'Dados_meteorologicos');

// Verifica se a pasta principal já existe e, se não, cria ela
if (!fs.existsSync(pastaPrincipal)) {
    fs.mkdirSync(pastaPrincipal);
}

// URL da API
const apiUrl = 'https://api.weather.com/v2/pws/history/daily?stationId=IRIOGRAN31&format=json&units=m&date=20240801&apiKey=de6a7c7407234831aa7c74072338319d';

// Extrai o stationId e a data da URL
const url = new URL(apiUrl);
const stationId = url.searchParams.get('stationId');
const dateParam = url.searchParams.get('date');
const ano = dateParam.slice(0, 4); // Obtém o ano a partir da data
const mes = dateParam.slice(4, 6); // Obtém o mês a partir da data

// Caminho para a pasta da estação
const pastaEstacao = path.join(pastaPrincipal, stationId);

// Verifica se a pasta da estação já existe e, se não, cria ela
if (!fs.existsSync(pastaEstacao)) {
    fs.mkdirSync(pastaEstacao);
}

// Caminho para a subpasta do ano dentro da pasta da estação
const pastaAno = path.join(pastaEstacao, ano);

// Verifica se a pasta do ano já existe e, se não, cria ela
if (!fs.existsSync(pastaAno)) {
    fs.mkdirSync(pastaAno);
}

// Caminho para a subpasta do mês dentro da pasta do ano
const pastaMes = path.join(pastaAno, mes);

// Verifica se a pasta do mês já existe e, se não, cria ela
if (!fs.existsSync(pastaMes)) {
    fs.mkdirSync(pastaMes);
}

// Função que vai gerar um nome de arquivo único com base na data da URL
function gerarNomeArquivoUnico() {
    // Usa a data da URL para gerar o nome do arquivo
    return `dados_${dateParam}.json`;
}

// Função que vai chamar a consulta da API e salvar o resultado
async function consultarESalvar() {
    try {
        const resposta = await axios.get(apiUrl);
        const dados = resposta.data;

        // Caminho onde os dados serão salvos com um nome de arquivo único baseado na data da URL
        const arquivo = path.join(pastaMes, gerarNomeArquivoUnico());

        // Salva os dados no arquivo
        fs.writeFileSync(arquivo, JSON.stringify(dados, null, 2));
        console.log(`Dados salvos em: ${arquivo}`);
    } catch (erro) {
        console.error('Erro ao consultar a API:', erro.message);
    }
}

// Chama a função
consultarESalvar();
