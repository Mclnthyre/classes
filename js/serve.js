#!/usr/bin/env node

/**
 * Servidor de Desenvolvimento para English Planner
 * 
 * Este é um servidor HTTP simples para desenvolvimento local.
 * Serve os arquivos estáticos (HTML, CSS, JS) com CORS habilitado.
 * 
 * Uso:
 * node serve.js
 * node serve.js 8080 (para usar porta específica)
 * 
 * Acesse: http://localhost:8000
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { exec } = require('child_process');

// Configurações
const DEFAULT_PORT = 8000;
const HOST = 'localhost';

// Cores para console
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

// Mapeamento de tipos MIME
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain',
    '.pdf': 'application/pdf',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject'
};

// Arquivos que serão servidos
const FILES = {
    '/': 'index.html',
    '/index.html': 'index.html',
    '/style.css': 'style.css',
    '/app.js': 'app.js',
    '/serve.js': 'serve.js'
};

class DevelopmentServer {
    constructor(port = DEFAULT_PORT) {
        this.port = port;
        this.server = null;
        this.startTime = new Date();
        this.requestCount = 0;
    }

    /**
     * Inicia o servidor
     */
    start() {
        this.server = http.createServer(this.handleRequest.bind(this));
        
        this.server.listen(this.port, HOST, () => {
            this.showWelcomeMessage();
            this.openBrowser();
        });

        this.server.on('error', (error) => {
            this.handleServerError(error);
        });
    }

    /**
     * Manipula requisições HTTP
     */
    handleRequest(req, res) {
        this.requestCount++;
        
        const requestUrl = url.parse(req.url, true);
        const pathname = requestUrl.pathname;
        
        console.log(`${colors.cyan}[${this.getTimestamp()}]${colors.reset} ${req.method} ${pathname} ${colors.dim}(${req.socket.remoteAddress})${colors.reset}`);
        
        // Configura headers CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        // Handle preflight requests
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }
        
        // Roteamento de arquivos
        let filePath = this.getFilePath(pathname);
        
        if (!filePath) {
            this.send404(res, pathname);
            return;
        }
        
        this.serveFile(filePath, res);
    }

    /**
     * Determina o caminho do arquivo baseado na URL
     */
    getFilePath(pathname) {
        // Verifica se é um arquivo conhecido
        if (FILES[pathname]) {
            return path.join(process.cwd(), FILES[pathname]);
        }
        
        // Verifica se o arquivo existe no sistema de arquivos
        const possiblePath = path.join(process.cwd(), pathname.substring(1));
        
        try {
            if (fs.existsSync(possiblePath) && fs.statSync(possiblePath).isFile()) {
                return possiblePath;
            }
        } catch (error) {
            return null;
        }
        
        // Tenta servir index.html para rotas do SPA
        if (pathname.startsWith('/')) {
            const indexPath = path.join(process.cwd(), 'index.html');
            if (fs.existsSync(indexPath)) {
                return indexPath;
            }
        }
        
        return null;
    }

    /**
     * Serve um arquivo com os headers apropriados
     */
    serveFile(filePath, res) {
        const extname = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[extname] || 'application/octet-stream';
        
        fs.readFile(filePath, (error, content) => {
            if (error) {
                if (error.code === 'ENOENT') {
                    this.send404(res, filePath);
                } else {
                    this.send500(res, error);
                }
                return;
            }
            
            res.writeHead(200, {
                'Content-Type': contentType,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            });
            
            res.end(content, 'utf-8');
            
            // Log de sucesso
            const stats = fs.statSync(filePath);
            console.log(`${colors.green}  ↳ 200 OK${colors.reset} ${colors.dim}(${this.formatBytes(stats.size)})${colors.reset}`);
        });
    }

    /**
     * Envia resposta 404
     */
    send404(res, pathname) {
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>404 - Arquivo não encontrado</title>
                <style>
                    body { 
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        height: 100vh;
                        margin: 0;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                    }
                    .container {
                        text-align: center;
                        background: rgba(255, 255, 255, 0.1);
                        backdrop-filter: blur(10px);
                        padding: 3rem;
                        border-radius: 20px;
                        box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
                    }
                    h1 {
                        font-size: 6rem;
                        margin: 0;
                        color: #fff;
                        text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
                    }
                    h2 {
                        font-size: 2rem;
                        margin-top: 0;
                        margin-bottom: 2rem;
                    }
                    p {
                        font-size: 1.2rem;
                        margin-bottom: 2rem;
                        max-width: 500px;
                    }
                    code {
                        background: rgba(255, 255, 255, 0.2);
                        padding: 0.5rem 1rem;
                        border-radius: 5px;
                        font-family: 'Courier New', monospace;
                    }
                    a {
                        color: #ffd700;
                        text-decoration: none;
                        font-weight: bold;
                    }
                    a:hover {
                        text-decoration: underline;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>404</h1>
                    <h2>Arquivo não encontrado</h2>
                    <p>O arquivo <code>${pathname}</code> não foi encontrado no servidor.</p>
                    <p>Voltar para <a href="/">página inicial</a></p>
                </div>
            </body>
            </html>
        `;
        
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html, 'utf-8');
        
        console.log(`${colors.red}  ↳ 404 Not Found${colors.reset} ${colors.dim}(${pathname})${colors.reset}`);
    }

    /**
     * Envia resposta 500
     */
    send500(res, error) {
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>500 - Erro interno do servidor</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 2rem; }
                    h1 { color: #d32f2f; }
                    pre { background: #f5f5f5; padding: 1rem; border-radius: 5px; }
                </style>
            </head>
            <body>
                <h1>500 - Erro interno do servidor</h1>
                <p>Ocorreu um erro ao processar sua requisição:</p>
                <pre>${error.message}</pre>
                <p><a href="/">Voltar para página inicial</a></p>
            </body>
            </html>
        `;
        
        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html, 'utf-8');
        
        console.log(`${colors.red}  ↳ 500 Internal Server Error${colors.reset} ${colors.dim}(${error.message})${colors.reset}`);
    }

    /**
     * Mostra mensagem de boas-vindas
     */
    showWelcomeMessage() {
        const art = `
${colors.magenta}
     ___                           __    __          __         _____  __            
    /   |  ________  ____  ____ _/ /_  / /__  _____/ /_____ _/ / / /_/ /___  ____ _
   / /| | / ___/ _ \\/ __ \\/ __ \`/ __ \\/ / _ \\/ ___/ __/ __ \`/ / / __/ / __ \\/ __ \`/
  / ___ |/ /  /  __/ / / / /_/ / / / / /  __/ /__/ /_/ /_/ / / / /_/ / /_/ / /_/ / 
 /_/  |_/_/   \\___/_/ /_/\\__,_/_/ /_/_/\\___/\\___/\\__/\\__,_/_/_/\\__/_/\\____/\\__,_/  
                                                                                   
${colors.reset}
        `;
        
        console.log(art);
        console.log(`${colors.green}✓ Servidor de desenvolvimento iniciado com sucesso!${colors.reset}\n`);
        
        console.log(`${colors.bright}Informações:${colors.reset}`);
        console.log(`${colors.cyan}●${colors.reset} URL local:      ${colors.bright}http://${HOST}:${this.port}${colors.reset}`);
        console.log(`${colors.cyan}●${colors.reset} URL na rede:    ${colors.bright}http://${this.getLocalIP()}:${this.port}${colors.reset}`);
        console.log(`${colors.cyan}●${colors.reset} Diretório:       ${colors.dim}${process.cwd()}${colors.reset}`);
        console.log(`${colors.cyan}●${colors.reset} Arquivos servidos: ${colors.dim}index.html, style.css, app.js${colors.reset}`);
        
        console.log(`\n${colors.bright}Endpoints disponíveis:${colors.reset}`);
        console.log(`${colors.cyan}●${colors.reset} ${colors.bright}/${colors.reset}           - Aplicação principal`);
        console.log(`${colors.cyan}●${colors.reset} ${colors.bright}/index.html${colors.reset}  - Página inicial`);
        console.log(`${colors.cyan}●${colors.reset} ${colors.bright}/style.css${colors.reset}   - Estilos CSS`);
        console.log(`${colors.cyan}●${colors.reset} ${colors.bright}/app.js${colors.reset}     - JavaScript da aplicação`);
        
        console.log(`\n${colors.bright}Comandos úteis:${colors.reset}`);
        console.log(`${colors.cyan}●${colors.reset} ${colors.dim}Ctrl+C${colors.reset}         - Parar servidor`);
        console.log(`${colors.cyan}●${colors.reset} ${colors.dim}F5${colors.reset}           - Recarregar página`);
        console.log(`${colors.cyan}●${colors.reset} ${colors.dim}Ctrl+Shift+R${colors.reset}  - Recarregar forçado (limpar cache)`);
        
        console.log(`\n${colors.bright}Monitoramento:${colors.reset}`);
        console.log(`${colors.cyan}●${colors.reset} Requisições:    ${colors.green}0${colors.reset}`);
        console.log(`${colors.cyan}●${colors.reset} Iniciado em:    ${colors.dim}${this.startTime.toLocaleTimeString()}${colors.reset}`);
        console.log(`${colors.cyan}●${colors.reset} Uptime:         ${colors.dim}0 segundos${colors.reset}`);
        
        console.log(`\n${colors.yellow}⚠  Monitorando alterações nos arquivos...${colors.reset}`);
        this.setupFileWatchers();
    }

    /**
     * Obtém IP local
     */
    getLocalIP() {
        const interfaces = require('os').networkInterfaces();
        for (const name of Object.keys(interfaces)) {
            for (const iface of interfaces[name]) {
                if (iface.family === 'IPv4' && !iface.internal) {
                    return iface.address;
                }
            }
        }
        return 'localhost';
    }

    /**
     * Abre navegador automaticamente
     */
    openBrowser() {
        const url = `http://${HOST}:${this.port}`;
        
        let command;
        switch (process.platform) {
            case 'darwin':
                command = `open ${url}`;
                break;
            case 'win32':
                command = `start ${url}`;
                break;
            default:
                command = `xdg-open ${url}`;
        }
        
        setTimeout(() => {
            exec(command, (error) => {
                if (error) {
                    console.log(`${colors.yellow}⚠  Não foi possível abrir o navegador automaticamente.${colors.reset}`);
                    console.log(`${colors.dim}   Acesse manualmente: ${url}${colors.reset}`);
                } else {
                    console.log(`${colors.green}✓ Navegador aberto automaticamente!${colors.reset}`);
                }
            });
        }, 1000);
    }

    /**
     * Configura watchers para monitorar alterações nos arquivos
     */
    setupFileWatchers() {
        const filesToWatch = ['index.html', 'style.css', 'app.js'];
        
        filesToWatch.forEach(file => {
            const filePath = path.join(process.cwd(), file);
            
            if (fs.existsSync(filePath)) {
                fs.watch(filePath, (eventType) => {
                    if (eventType === 'change') {
                        console.log(`\n${colors.yellow}⚠  Arquivo alterado: ${file}${colors.reset}`);
                        console.log(`${colors.dim}   Recarregue a página no navegador para ver as mudanças.${colors.reset}`);
                    }
                });
                
                console.log(`${colors.green}✓${colors.reset} ${colors.dim}Monitorando: ${file}${colors.reset}`);
            }
        });
    }

    /**
     * Manipula erros do servidor
     */
    handleServerError(error) {
        if (error.code === 'EADDRINUSE') {
            console.log(`${colors.red}✗ A porta ${this.port} já está em uso!${colors.reset}`);
            console.log(`${colors.yellow}Tente:${colors.reset}`);
            console.log(`  1. Usar uma porta diferente: ${colors.cyan}node serve.js 8080${colors.reset}`);
            console.log(`  2. Parar o servidor que está usando a porta ${this.port}`);
            console.log(`  3. Esperar alguns segundos e tentar novamente`);
            
            // Sugere porta alternativa
            this.suggestAlternativePort();
        } else {
            console.log(`${colors.red}✗ Erro no servidor:${colors.reset}`);
            console.log(`${colors.red}${error.message}${colors.reset}`);
        }
        
        process.exit(1);
    }

    /**
     * Sugere porta alternativa
     */
    suggestAlternativePort() {
        const testPort = this.port + 1;
        const testServer = http.createServer();
        
        testServer.once('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                console.log(`${colors.yellow}  A porta ${testPort} também está ocupada.${colors.reset}`);
                testServer.close();
            }
        });
        
        testServer.once('listening', () => {
            console.log(`${colors.green}  A porta ${testPort} está disponível!${colors.reset}`);
            console.log(`${colors.cyan}  Execute: node serve.js ${testPort}${colors.reset}`);
            testServer.close();
        });
        
        testServer.listen(testPort, HOST);
    }

    /**
     * Formata bytes para tamanho legível
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Retorna timestamp formatado
     */
    getTimestamp() {
        const now = new Date();
        return now.toLocaleTimeString('pt-BR', { 
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    /**
     * Para o servidor
     */
    stop() {
        if (this.server) {
            this.server.close(() => {
                console.log(`\n${colors.yellow}Servidor parado.${colors.reset}`);
                process.exit(0);
            });
        }
    }
}

/**
 * Ponto de entrada principal
 */
function main() {
    // Obtém porta dos argumentos
    const args = process.argv.slice(2);
    let port = DEFAULT_PORT;
    
    if (args.length > 0) {
        const argPort = parseInt(args[0]);
        if (!isNaN(argPort) && argPort > 0 && argPort < 65536) {
            port = argPort;
        } else {
            console.log(`${colors.yellow}Aviso: Porta inválida. Usando porta padrão ${DEFAULT_PORT}${colors.reset}`);
        }
    }
    
    // Cria e inicia servidor
    const server = new DevelopmentServer(port);
    
    // Configura handlers para sinais de término
    process.on('SIGINT', () => {
        console.log(`\n${colors.yellow}Recebido sinal de término (Ctrl+C)...${colors.reset}`);
        server.stop();
    });
    
    process.on('SIGTERM', () => {
        console.log(`\n${colors.yellow}Recebido sinal de término...${colors.reset}`);
        server.stop();
    });
    
    // Handler para erros não tratados
    process.on('uncaughtException', (error) => {
        console.log(`${colors.red}Erro não tratado:${colors.reset}`, error);
        server.stop();
    });
    
    // Inicia servidor
    try {
        server.start();
    } catch (error) {
        console.log(`${colors.red}Falha ao iniciar servidor:${colors.reset}`, error.message);
        process.exit(1);
    }
}

/**
 * Verifica se o arquivo existe no diretório atual
 */
function checkRequiredFiles() {
    const requiredFiles = ['index.html', 'style.css', 'app.js'];
    const missingFiles = [];
    
    console.log(`${colors.blue}Verificando arquivos necessários...${colors.reset}\n`);
    
    requiredFiles.forEach(file => {
        const filePath = path.join(process.cwd(), file);
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            console.log(`${colors.green}✓${colors.reset} ${file.padEnd(15)} ${colors.dim}(${server.formatBytes(stats.size)})${colors.reset}`);
        } else {
            missingFiles.push(file);
            console.log(`${colors.red}✗${colors.reset} ${file.padEnd(15)} ${colors.red}NÃO ENCONTRADO${colors.reset}`);
        }
    });
    
    if (missingFiles.length > 0) {
        console.log(`\n${colors.red}Erro: Arquivos necessários não encontrados!${colors.reset}`);
        console.log(`${colors.yellow}Certifique-se de que os seguintes arquivos estão no diretório atual:${colors.reset}`);
        missingFiles.forEach(file => {
            console.log(`  ${colors.cyan}●${colors.reset} ${file}`);
        });
        console.log(`\n${colors.yellow}Diretório atual: ${colors.dim}${process.cwd()}${colors.reset}`);
        return false;
    }
    
    console.log(`\n${colors.green}Todos os arquivos necessários encontrados!${colors.reset}`);
    return true;
}

// Verifica argumentos de ajuda
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
    console.log(`
${colors.bright}English Planner - Servidor de Desenvolvimento${colors.reset}

${colors.cyan}Uso:${colors.reset}
  node serve.js [porta]
  node serve.js 8080

${colors.cyan}Argumentos:${colors.reset}
  porta          Porta para o servidor (padrão: ${DEFAULT_PORT})
  --help, -h     Mostra esta mensagem de ajuda
  --version, -v  Mostra versão

${colors.cyan}Exemplos:${colors.reset}
  node serve.js              # Inicia na porta ${DEFAULT_PORT}
  node serve.js 3000         # Inicia na porta 3000
  node serve.js --help       # Mostra ajuda

${colors.cyan}Requisitos:${colors.reset}
  Os seguintes arquivos devem estar no diretório atual:
  • index.html
  • style.css
  • app.js

${colors.cyan}Acesse:${colors.reset} http://localhost:${DEFAULT_PORT}
`);
    process.exit(0);
}

if (args.includes('--version') || args.includes('-v')) {
    const packageJson = require('./package.json');
    console.log(`English Planner v${packageJson.version || '1.0.0'}`);
    process.exit(0);
}

// Cria instância do servidor para usar suas funções auxiliares
const server = new DevelopmentServer();

// Verifica arquivos antes de iniciar
if (checkRequiredFiles()) {
    main();
} else {
    process.exit(1);
}
