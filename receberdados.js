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

// Pergunta ao usuário o mês inicial
function perguntarMesInicial() {
    return new Promise((resolve) => {
        rl.question('Digite o mês inicial (no formato MM, ex: 01, 02, ..., 12):\n', (mesInicio) => {
            if (/^(0[1-9]|1[0-2])$/.test(mesInicio)) {
                resolve(mesInicio);
            } else {
                console.log('Mês inválido. Usando mês inicial padrão (01).');
                resolve('01');
            }
        });
    });
}

// Função para gerar todas as datas dentro do intervalo
function gerarDatas(anoInicio, anoFim, mesInicio) {
    const datas = [];
    for (let ano = anoInicio; ano <= anoFim; ano++) {
        for (let mes = ano === anoInicio ? parseInt(mesInicio, 10) : 1; mes <= 12; mes++) {
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
    const mesInicio = await perguntarMesInicial();

    const desktopPath = path.join(os.homedir(), 'Desktop');
    const pastaPrincipal = path.join(desktopPath, 'Dados_meteorologicos');

    if (!fs.existsSync(pastaPrincipal)) fs.mkdirSync(pastaPrincipal);

    const pastaEstacao = path.join(pastaPrincipal, stationId);
    if (!fs.existsSync(pastaEstacao)) fs.mkdirSync(pastaEstacao);

    const datas = gerarDatas(anoInicio, anoFim, mesInicio);

    function gerarNomeArquivoUnico(data) {
        return `dados_${data}`;
    }

    async function consultarESalvar(data) {
        const apiUrl = `https://api.weather.com/v2/pws/history/all?stationId=${stationId}&format=json&units=m&date=${data}&apiKey=de6a7c7407234831aa7c74072338319d`;
        try {
            const resposta = await axios.get(apiUrl);
            const dados = resposta.data;

            const ano = data.slice(0, 4);
            const mes = data.slice(4, 6);
            const pastaAno = path.join(pastaEstacao, ano);
            if (!fs.existsSync(pastaAno)) fs.mkdirSync(pastaAno);
            const pastaMes = path.join(pastaAno, mes);
            if (!fs.existsSync(pastaMes)) fs.mkdirSync(pastaMes);

            const nomeBase = gerarNomeArquivoUnico(data);
            const caminhoJson = path.join(pastaMes, `${nomeBase}.json`);
            fs.writeFileSync(caminhoJson, JSON.stringify(dados, null, 2));
            console.log(`JSON salvo em: ${caminhoJson}`);

            // Se houver observações, exporta como CSV
            if (dados && dados.observations && dados.observations.length > 0) {
                const observacoes = dados.observations;
                const primeiro = observacoes[0];

                const cabecalho = [
                    ...Object.keys(primeiro).filter(k => k !== 'metric'),
                    ...Object.keys(primeiro.metric)
                ].join(';');

                const linhas = observacoes.map(obs => {
                    const principais = Object.entries(obs).filter(([k]) => k !== 'metric');
                    const metricas = Object.entries(obs.metric);
                    const valores = [...principais, ...metricas].map(([_, v]) => {
                        if (typeof v === 'string' && v.includes(';')) {
                            return `"${v}"`; // Escapa strings com ponto e vírgula
                        }
                        return v;
                    });
                    return valores.join(';');
                });

                const conteudoCSV = [cabecalho, ...linhas].join('\n');
                const caminhoCSV = path.join(pastaMes, `${nomeBase}.csv`);
                fs.writeFileSync(caminhoCSV, conteudoCSV);
                console.log(`CSV salvo em: ${caminhoCSV}`);
            } else {
                console.warn(`Sem observações para ${data}`);
            }

        } catch (erro) {
            console.error('Erro ao consultar a API:', erro.message);
        }
    }

    for (let i = 0; i < datas.length; i++) {
        const data = datas[i];
        console.log(`Baixando dados para ${data} (${i + 1}/${datas.length})...`);
        await consultarESalvar(data);
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    rl.close();
}

executar();
