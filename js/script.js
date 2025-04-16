$(document).ready(function() {
    // Lista de janelas que devem estar ocultas no início
    const hiddenWindowsOnStart = ['#about-window', '#wallpaper-window', '#projects-window'];
    
    // Esconder janelas definidas na lista
    hiddenWindowsOnStart.forEach(function(windowId) {
        $(windowId).hide();
    });
    
    // Registrar janelas que estão atualmente abertas (em um objeto para acesso rápido)
    let openWindows = {};
    
    // Inicializar janelas que estão visíveis no início
    $('.frame').each(function() {
        const windowId = '#' + $(this).attr('id');
        if (!hiddenWindowsOnStart.includes(windowId)) {
            openWindows[windowId] = true;
        }
    });
    
    $('.frame').mousedown(function(){
        $(".active").removeClass("active");
        $(this).addClass("active");
    });
    
    $('.frame').not(".maximized").resizable({
        alsoResize: ".active .content",
        minWidth: 200,
        minHeight: 59
    }).draggable({
        handle: ".topbar"
    });

    // MAXIMIZED
    $('.maxbtn').click(function(){
        $(this).parent().parent().toggleClass("maximized");
    });
    
    // CLOSE - modificada para fechar janela e recalcular grid
    $('.xbtn').click(function(){
        const windowElement = $(this).parent().parent();
        const windowId = '#' + windowElement.attr('id');
        
        // Esconder a janela em vez de removê-la
        windowElement.hide();
        
        // Atualizar status de janelas abertas
        delete openWindows[windowId];
        
        // Recalcular a grid
        arrangeWindowsOptimized();
    });
    
    // Função para abrir uma janela
    window.openWindow = function(windowId) {
        // Garantir que o ID começa com #
        if (!windowId.startsWith('#')) {
            windowId = '#' + windowId;
        }
        
        // Verificar se a janela já está aberta
        if (openWindows[windowId]) {
            // Janela já está aberta, apenas trazê-la para frente
            $(windowId).mousedown();
            return;
        }
        
        // Verificar se a janela existe
        if ($(windowId).length === 0) {
            console.error('Janela não encontrada:', windowId);
            return;
        }
        
        // Mostrar a janela
        $(windowId).show();
        
        // Adicionar à lista de janelas abertas
        openWindows[windowId] = true;
        
        // Trazer a janela para frente
        $(windowId).mousedown();
        
        // Recalcular a grid
        arrangeWindowsOptimized();
    };
    
    function arrangeWindowsOptimized() {
        const windowWidth = $(window).width();
        const windowHeight = $(window).height();
        
        // Só considerar janelas visíveis
        const visibleFrames = $('.frame:visible');
        
        // Excluir as janelas especiais do grid normal
        const frames = visibleFrames.not('#navbar-window, #hello-window');
        const framesCount = frames.length;
        
        // Configuração especial para navbar (somente se estiver visível)
        const navbarWindow = $('#navbar-window:visible');
        if (navbarWindow.length > 0) {
            const navbarHeight = 90; // Altura fixa para navbar
            
            // Posicionar navbar no topo da tela
            navbarWindow.css({
                'top': '10px',
                'left': '10px',
                'width': (windowWidth * 0.95) + 'px',
                'height': navbarHeight + 'px',
                'z-index': 100 // Garantir que fique por cima das outras janelas
            });
            
            navbarWindow.find('.content').css({
                'width': (windowWidth * 0.95 - 30) + 'px',
                'height': (navbarHeight - 30) + 'px'
            });
        }
        
        // Descobrir se a navbar está visível e obter sua altura
        const navbarHeight = navbarWindow.length > 0 ? 90 + 20 : 0;
        
        // Configuração especial para hello-window (somente se estiver visível)
        const helloWindow = $('#hello-window:visible');
        if (helloWindow.length > 0) {
            const helloHeight = 250; // Altura específica para hello-window
            const helloWidth = 350;  // Largura para hello-window
            
            // Posicionar hello-window mais para a esquerda, logo abaixo da navbar
            helloWindow.css({
                'top': (navbarHeight + 10) + 'px',
                'left': '20px',
                'width': helloWidth + 'px',
                'height': helloHeight + 'px',
                'z-index': 50
            });
            
            helloWindow.find('.content').css({
                'width': (helloWidth - 30) + 'px',
                'height': (helloHeight - 50) + 'px'
            });
        }
        
        // Espaço disponível para as outras janelas (abaixo da navbar)
        const availableHeight = windowHeight - navbarHeight;
        
        // Se não há outras janelas para posicionar, retornar
        if (framesCount === 0) return;
        
        // Tentamos diferentes configurações de grid para encontrar a melhor
        let bestLayout = { cols: 1, rows: framesCount, score: 0 };
        
        // Testar várias configurações possíveis de grid
        for (let cols = 1; cols <= framesCount; cols++) {
            let rows = Math.ceil(framesCount / cols);
            
            // Calcular tamanho aproximado das janelas
            let frameWidth = (windowWidth / cols) * 0.95;
            let frameHeight = (availableHeight / rows) * 0.95;
            
            // Evitar janelas muito estreitas ou muito baixas
            if (frameWidth < 200 || frameHeight < 100) continue;
            
            // Calcular proporção das janelas (mais próximo de 1 é melhor)
            let ratio = frameWidth / frameHeight;
            if (ratio > 2 || ratio < 0.5) continue;
            
            // Calcular área utilizada
            let utilization = (framesCount / (cols * rows));
            
            // Pontuação baseada na proporção e utilização do espaço
            let score = utilization * (1 - Math.abs(1 - ratio));
            
            if (score > bestLayout.score) {
                bestLayout = { cols, rows, score };
            }
        }
        
        // Usar o melhor layout encontrado
        let { cols, rows } = bestLayout;
        
        // Se o layout não for bom o suficiente, voltar para layout baseado em raiz quadrada
        if (bestLayout.score < 0.4) {
            cols = Math.ceil(Math.sqrt(framesCount));
            rows = Math.ceil(framesCount / cols);
        }
        
        // Calcular tamanho das janelas com base no layout final
        let frameWidth = (windowWidth / cols) * 0.95;
        let frameHeight = (availableHeight / rows) * 0.95;
        
        frameWidth = Math.max(frameWidth, 250);
        frameHeight = Math.max(frameHeight, 150);
        
        // Reposicionar as janelas no grid (abaixo da navbar)
        // Dando preferência para a direita devido ao hello-window estar à esquerda
        let cellsOccupied = Array(rows * cols).fill(false);
        
        frames.each(function(index) {
            // Para cada janela, encontrar a melhor célula disponível
            // Preferir células da direita para evitar sobreposição com hello-window
            let bestCell = 0;
            
            // Atribuir preferencialmente células da direita
            for (let i = 0; i < cellsOccupied.length; i++) {
                const testRow = Math.floor(i / cols);
                const testCol = i % cols;
                
                // Preferir colunas mais à direita
                if (testCol > 0 && !cellsOccupied[i]) {
                    bestCell = i;
                    break;
                }
            }
            
            // Se não encontrou célula à direita, usar a primeira disponível
            if (cellsOccupied[bestCell]) {
                bestCell = 0;
                while (cellsOccupied[bestCell]) bestCell++;
            }
            
            // Marcar como ocupada
            cellsOccupied[bestCell] = true;
            
            const row = Math.floor(bestCell / cols);
            const col = bestCell % cols;
            
            // Ajuste para posicionar abaixo da navbar
            const topPosition = (availableHeight / rows) * row + navbarHeight + 10;
            const leftPosition = (windowWidth / cols) * col + 10;
            
            $(this).css({
                'top': topPosition + 'px',
                'left': leftPosition + 'px',
                'width': frameWidth + 'px',
                'height': frameHeight + 'px'
            });
            
            $(this).find('.content').css({
                'width': (frameWidth - 30) + 'px',
                'height': (frameHeight - 50) + 'px'
            });
        });
    }

    arrangeWindowsOptimized();
    
});