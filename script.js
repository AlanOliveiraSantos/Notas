let db;
const limite = 81000;
const request = indexedDB.open('valoresDB', 1);

request.onupgradeneeded = function(event) {
    db = event.target.result;
    const objectStore = db.createObjectStore('valores', { autoIncrement: true });
    objectStore.createIndex('valor', 'valor', { unique: false });
};

request.onsuccess = function(event) {
    db = event.target.result;
    atualizarDisplay();
};

function formatarMoeda(input) {
    let valor = input.value.replace(/\D/g, ''); // Remove tudo que não for número
    valor = (parseFloat(valor) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    input.value = valor;
}

function registrarValor() {
    const valorInput = document.getElementById('valorInput');
    const valor = parseFloat(valorInput.value.replace(/\D/g, '')) / 100; // Converte para número
    
    if (!isNaN(valor)) {
        const transaction = db.transaction(['valores'], 'readwrite');
        const objectStore = transaction.objectStore('valores');
        objectStore.add({ valor: valor });

        valorInput.value = '';
        transaction.oncomplete = function() {
            atualizarDisplay();
        };
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

        atualizarBarraProgresso(total);
        atualizarLista(valores);
    };
}

function atualizarBarraProgresso(total) {
    const barraProgresso = document.getElementById('barraProgresso');
    const progresso = (total / limite) * 100;
    barraProgresso.style.width = `${progresso}%`;

    if (total >= limite) {
        barraProgresso.style.backgroundColor = '#ff6347'; // Muda a cor da barra quando o limite é atingido
    }
}

function atualizarLista(valores) {
    const listaValores = document.getElementById('listaValores');
    listaValores.innerHTML = '';

    valores.forEach((item, index) => {
        const li = document.createElement('li');

        // Formata cada valor para reais
        li.textContent = `${index + 1} | ${item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
        listaValores.appendChild(li);
    });
}

function resetarValores() {
    const transaction = db.transaction(['valores'], 'readwrite');
    const objectStore = transaction.objectStore('valores');
    const request = objectStore.clear();

    request.onsuccess = function() {
        console.log('Todos os valores foram removidos.');
        atualizarDisplay();
    };
}

function deletarBancoDeDados() {
    const request = indexedDB.deleteDatabase('valoresDB');

    request.onsuccess = function() {
        console.log('Banco de dados deletado com sucesso.');
        atualizarDisplay();
    };

    request.onerror = function(event) {
        console.error('Erro ao deletar o banco de dados:', event.target.errorCode);
    };
}

function removerUltimoValor() {
    const transaction = db.transaction(['valores'], 'readwrite');
    const objectStore = transaction.objectStore('valores');
    const request = objectStore.openCursor(null, 'prev'); // Pega o último item

    request.onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            objectStore.delete(cursor.primaryKey); // Remove apenas o último valor armazenado
            transaction.oncomplete = function() {
                atualizarDisplay();
            };
        }
    };
}
