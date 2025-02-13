let db;
const limite = 81000;
const request = indexedDB.open('valoresDB', 1);

request.onupgradeneeded = function(event) {
    db = event.target.result;
    const objectStore = db.createObjectStore('valores', { autoIncrement: true });
    objectStore.createIndex('valor', 'valor', { unique: false });
    objectStore.createIndex('data', 'data', { unique: false });
};

request.onsuccess = function(event) {
    db = event.target.result;
    atualizarDisplay();
};

// Formata o input para moeda brasileira (R$)
document.getElementById('valorInput').addEventListener('input', function (e) {
    // Remove qualquer coisa que não seja número ou vírgula
    let valor = e.target.value.replace(/\D/g, '');
    
    // Converte para número e formata para moeda (R$)
    if (valor) {
        valor = (valor / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        e.target.value = valor; // Exibe o valor no formato moeda
    }
});

function registrarValor() {
    const valorInput = document.getElementById('valorInput');
    const dataInput = document.getElementById('dataInput');
    const valor = parseFloat(valorInput.value.replace(/\D/g, '')); // Remove a formatação da moeda
    const data = dataInput.value.replace(/\D/g, ''); // Remove as barras

    // Verifica se a data tem 8 caracteres e o valor é um número válido
    if (!isNaN(valor) && data.length === 8) {
        // Formata a data para o formato YYYY-MM-DD
        const dataFormatada = `${data.slice(4, 8)}-${data.slice(2, 4)}-${data.slice(0, 2)}`;

        const transaction = db.transaction(['valores'], 'readwrite');
        const objectStore = transaction.objectStore('valores');
        objectStore.add({ valor: valor / 100, data: dataFormatada }); // Divide o valor por 100 para armazená-lo em centavos

        // Limpa os campos após o envio
        valorInput.value = '';
        dataInput.value = '';

        transaction.oncomplete = function() {
            atualizarDisplay();
        };
    } else {
        alert("Por favor, insira um valor válido e uma data no formato DD/MM/YYYY.");
    }
}


function validarData(data) {
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = data.match(regex);
    if (!match) return false;

    const dia = parseInt(match[1], 10);
    const mes = parseInt(match[2], 10) - 1; // Meses começam em 0 (Janeiro)
    const ano = parseInt(match[3], 10);
    
    const dataValida = new Date(ano, mes, dia);
    return dataValida.getDate() === dia && dataValida.getMonth() === mes && dataValida.getFullYear() === ano;
}

document.getElementById('dataInput').addEventListener('input', function (e) {
    let data = e.target.value.replace(/\D/g, ''); // Remove tudo que não for número

    // Adiciona as barras automaticamente, mas só após a quantidade de números adequada
    if (data.length <= 2) {
        // Adiciona a barra após o dia
        data = data.slice(0, 2);
    } else if (data.length <= 4) {
        // Adiciona a barra após o mês
        data = data.slice(0, 2) + '/' + data.slice(2, 4);
    } else if (data.length <= 8) {
        // Não remove as barras, apenas adiciona o ano
        data = data.slice(0, 2) + '/' + data.slice(2, 4) + '/' + data.slice(4, 8);
    }

    e.target.value = data; // Atualiza o valor do input com a data formatada
});



function atualizarDisplay() {
    const transaction = db.transaction(['valores'], 'readonly');
    const objectStore = transaction.objectStore('valores');
    const request = objectStore.getAll();

    request.onsuccess = function(event) {
        const valores = event.target.result;
        const total = valores.reduce((acc, item) => acc + item.valor, 0);
        const totalDisplay = document.getElementById('totalDisplay');

        // Formata o total para reais
        totalDisplay.textContent = `Total: ${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;

        // Calcula o valor que falta para o limite
        const faltando = limite - total;
        if (faltando <= 10000 && faltando > 0) {
            alert(`Aviso: Faltam apenas ${faltando.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} para atingir o limite de R$ 81.000!`);
        }

        atualizarBarraProgresso(total);
        atualizarLista(valores);
    };
}



function atualizarBarraProgresso(total) {
    const barraProgresso = document.getElementById('barraProgresso');
    const progresso = (total / limite) * 100;
    barraProgresso.style.width = `${progresso}%`;

    // Define a cor conforme o progresso
    if (progresso < 50) {
        barraProgresso.style.backgroundColor = '#0077ff'; // Azul
    } else if (progresso >= 50 && progresso < 80) {
        barraProgresso.style.backgroundColor = '#FFA500'; // Laranja
    } else {
        barraProgresso.style.backgroundColor = '#ff6347'; // Vermelho
    }
}


function atualizarLista(valores) {
    const listaValores = document.getElementById('listaValores');
    listaValores.innerHTML = ''; // Limpa a lista antes de adicionar os novos itens

    valores.forEach((item, index) => {
        const li = document.createElement('li');

        // Formata o valor para reais
        const valorFormatado = item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        // Corrige o problema da data reduzindo um dia
        const partesData = item.data.split('-'); // Divide o formato YYYY-MM-DD
        const dataFormatada = `${partesData[2]}/${partesData[1]}/${partesData[0]}`; // Formata para DD/MM/YYYY

        // Adiciona a numeração de forma crescente
        li.textContent = `${index + 1} | ${valorFormatado} | ${dataFormatada}`;
        listaValores.appendChild(li);
    });
}




function removerUltimoValor() {
    const transaction = db.transaction(['valores'], 'readwrite');
    const objectStore = transaction.objectStore('valores');
    const request = objectStore.openCursor(null, 'prev'); // Abre o cursor para iterar de trás pra frente

    request.onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            // Se houver um cursor, pega o último valor inserido
            objectStore.delete(cursor.primaryKey); // Deleta o item com o cursor

            transaction.oncomplete = function() {
                atualizarDisplay(); // Atualiza a lista após remoção
            };
        }
    };
}


function resetarValores() {
    const confirmarReset = confirm("Você tem certeza que deseja resetar todos os valores?");
    if (confirmarReset) {
        const transaction = db.transaction(['valores'], 'readwrite');
        const objectStore = transaction.objectStore('valores');
        objectStore.clear().onsuccess = function() {
            atualizarDisplay();
            alert("Todos os valores foram resetados.");
        };
    }
}

function deletarBancoDeDados() {
    const confirmarDeletar = confirm("Você tem certeza que deseja deletar o banco de dados? Esta ação não pode ser desfeita.");
    if (confirmarDeletar) {
        indexedDB.deleteDatabase('valoresDB').onsuccess = function() {
            alert("Banco de dados deletado com sucesso.");
            atualizarDisplay();
        };
    }
}

