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

function registrarValor() {
    const valorInput = document.getElementById('valorInput');
    const valor = parseFloat(valorInput.value);

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
        totalDisplay.textContent = `Total: ${total}`;

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

    valores.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item.valor;
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
