const fs = require('fs');
const path = require('path');
const os = require('os');
const axios = require('axios');
const readline = require('readline');

// Configuração do readline para obter a entrada do usuário
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Pergunta ao usuário qual estação deseja usar
function perguntarEstacao() {
    return new Promise((resolve) => {
        rl.question('Escolha a estação da qual deseja receber os dados (1 ou 2):\n1. IANTNI9\n2. IRIOGRAN31\n', (resposta) => {
            let stationId;
            if (resposta === '1') {
                stationId = 'IANTNI9';
            } else if (resposta === '2') {
                stationId = 'IRIOGRAN31';
            } else {
                console.log('Escolha inválida. Usando estação 1 como padrão.');
                stationId = 'IANTNI9';
            }
            resolve(stationId);
        });
    });
}

// Pergunta ao usuário o intervalo de anos
function perguntarIntervaloAnos() {
    return new Promise((resolve) => {
        rl.question('Digite o ano inicial:\n', (anoInicio) => {
            rl.question('Digite o ano final:\n', (anoFim) => {
                // Verifica se os anos são válidos
                if (/^\d{4}$/.test(anoInicio) && /^\d{4}$/.test(anoFim)) {
                    resolve({ anoInicio: parseInt(anoInicio), anoFim: parseInt(anoFim) });
                } else {
                    console.log('Anos inválidos. Usando intervalo padrão (2020-2021).');
                    resolve({ anoInicio: 2020, anoFim: 2021 });
                }
            });
        });
    });
}

// Função para gerar todas as datas dentro do intervalo
function gerarDatas(anoInicio, anoFim) {
    const datas = [];
    for (let ano = anoInicio; ano <= anoFim; ano++) {
        for (let mes = 1; mes <= 12; mes++) {
            const diasNoMes = new Date(ano, mes, 0).getDate();
            for (let dia = 1; dia <= diasNoMes; dia++) {
                const data = `${ano}${String(mes).padStart(2, '0')}${String(dia).padStart(2, '0')}`;
                datas.push(data);
            }
        }
    }
    return datas;
}

// Função principal que coordena a execução
async function executar() {
    const stationId = await perguntarEstacao();
    const { anoInicio, anoFim } = await perguntarIntervaloAnos();

    // Caminho onde a pasta principal vai ser criada
    const desktopPath = path.join(os.homedir(), 'Desktop');

    // Nome da pasta principal
    const pastaPrincipal = path.join(desktopPath, 'Dados_meteorologicos');

    // Verifica se a pasta principal já existe e, se não, cria ela
    if (!fs.existsSync(pastaPrincipal)) {
        fs.mkdirSync(pastaPrincipal);
    }

    // Caminho para a pasta da estação
    const pastaEstacao = path.join(pastaPrincipal, stationId);

    // Verifica se a pasta da estação já existe e, se não, cria ela
    if (!fs.existsSync(pastaEstacao)) {
        fs.mkdirSync(pastaEstacao);
    }

    // Gera todas as datas dentro do intervalo
    const datas = gerarDatas(anoInicio, anoFim);

    // Função que vai gerar um nome de arquivo único com base na data da URL
    function gerarNomeArquivoUnico(data) {
        // Usa a data para gerar o nome do arquivo
        return `dados_${data}.json`;
    }

    // Função que vai chamar a consulta da API e salvar o resultado
    async function consultarESalvar(data) {
        const apiUrl = `https://api.weather.com/v2/pws/history/daily?stationId=${stationId}&format=json&units=m&date=${data}&apiKey=de6a7c7407234831aa7c74072338319d`;
        try {
            const resposta = await axios.get(apiUrl);
            const dados = resposta.data;

            // Caminho onde os dados serão salvos com um nome de arquivo único baseado na data da URL
            const ano = data.slice(0, 4);
            const mes = data.slice(4, 6);
            const pastaAno = path.join(pastaEstacao, ano);
            if (!fs.existsSync(pastaAno)) {
                fs.mkdirSync(pastaAno);
            }
            const pastaMes = path.join(pastaAno, mes);
            if (!fs.existsSync(pastaMes)) {
                fs.mkdirSync(pastaMes);
            }
            const arquivo = path.join(pastaMes, gerarNomeArquivoUnico(data));

            // Salva os dados no arquivo
            fs.writeFileSync(arquivo, JSON.stringify(dados, null, 2));
            console.log(`Dados salvos em: ${arquivo}`);
        } catch (erro) {
            console.error('Erro ao consultar a API:', erro.message);
        }
    }

    // Consulta e salva os dados para todas as datas
    for (const data of datas) {
        await consultarESalvar(data);
    }

    rl.close();
}

// Executa o script
executar();
