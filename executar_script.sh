#!/bin/bash

# Define a função para imprimir uma linha com cor
print_line() {
    local color="$1"
    local text="$2"
    echo -e "${color}${text}${NC}"
}

# Define cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[0;37m'
NC='\033[0m' # No Color

# Limpa a tela
clear

# Imprime uma mensagem de boas-vindas com formatação
print_line "${BLUE}" "======================================================="
print_line "${CYAN}" "          BEM-VINDO AO SISTEMA DE BAIXAR DADOS         "
print_line "${CYAN}" "                METEOROLÓGICOS AUTOMATIZADO             "
print_line "${BLUE}" "======================================================="

echo -e "\n${GREEN}Este sistema irá baixar dados meteorológicos para você."
echo -e "Para iniciar o processo, pressione qualquer tecla..."

# Espera o usuário pressionar uma tecla
read -n 1 -s

# Executa o script Node.js
./script_baixar_dados-linux

# Mensagem de conclusão
print_line "${GREEN}" "O processo foi iniciado. Verifique os arquivos na pasta especificada."
