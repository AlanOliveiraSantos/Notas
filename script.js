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
    
    // Remove qualquer coisa não numérica e transforma em valor numérico
    const valor = parseFloat(valorInput.value.replace(/\D/g, '')) / 100; // Divide por 100 para obter o valor correto
    const data = dataInput.value; // Obtém o valor da data no formato YYYY-MM-DD

    // Verificar se o valor é um número válido e se a data não está vazia
    if (!isNaN(valor) && data !== "") {
        const transaction = db.transaction(['valores'], 'readwrite');
        const objectStore = transaction.objectStore('valores');
        objectStore.add({ valor: valor, data: data });

        // Limpa os campos após o envio
        valorInput.value = '';
        dataInput.value = '';

        transaction.oncomplete = function() {
            atualizarDisplay();
        };
    } else {
        alert("Por favor, insira um valor válido e uma data.");
    }
}

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

        // Verifica se o total está a 10 mil do limite e exibe um alerta
        if (total >= (limite - 10000) && total < limite) {
            alert("Aviso: Você está a R$10.000 de atingir o limite!");
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
    listaValores.innerHTML = '';

    valores.forEach((item, index) => {
        const li = document.createElement('li');

        // Formata o valor para reais
        const valorFormatado = item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        // Formata a data para o formato BR (DD/MM/YYYY)
        const dataFormatada = new Date(item.data).toLocaleDateString('pt-BR');

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
    const transaction = db.transaction(['valores'], 'readwrite');
    const objectStore = transaction.objectStore('valores');
    objectStore.clear().onsuccess = function() {
        atualizarDisplay();
    };
}

function deletarBancoDeDados() {
    indexedDB.deleteDatabase('valoresDB').onsuccess = function() {
        atualizarDisplay();
    };
}
