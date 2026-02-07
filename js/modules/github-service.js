// js/modules/github-service.js

import { getAppData, saveData, getGitHubConfig } from './data-manager.js';

/**
 * Salva dados no GitHub
 */
export async function saveToGitHub() {
    try {
        const GITHUB_CONFIG = getGitHubConfig();
        
        // Verificar se há configuração
        if (!GITHUB_CONFIG.username || !GITHUB_CONFIG.repo || !GITHUB_CONFIG.token) {
            throw new Error('Configure o GitHub nas configurações primeiro!');
        }
        
        const appData = getAppData();
        const data = {
            ...appData,
            lastUpdated: new Date().toISOString()
        };
        
        const filename = 'dados.json';
        const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
        const getUrl = `https://api.github.com/repos/${GITHUB_CONFIG.username}/${GITHUB_CONFIG.repo}/contents/${filename}`;
        
        const headers = {
            'Authorization': `Bearer ${GITHUB_CONFIG.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        };
        
        let sha = null;
        
        // Verificar se arquivo já existe
        try {
            const response = await fetch(getUrl, { 
                method: 'GET',
                headers: headers
            });
            
            if (response.ok) {
                const fileData = await response.json();
                sha = fileData.sha;
            }
        } catch (e) {
            console.log('Arquivo não encontrado, será criado um novo');
        }
        
        const body = {
            message: `Update: ${new Date().toLocaleString('pt-BR')}`,
            content: content,
            ...(sha && { sha: sha })
        };
        
        const updateResponse = await fetch(getUrl, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(body)
        });
        
        if (!updateResponse.ok) {
            const errorData = await updateResponse.json();
            throw new Error(errorData.message || 'Erro ao salvar no GitHub');
        }
        
        saveData(); // Salvar também no localStorage
        return { success: true, message: 'Dados salvos no GitHub com sucesso!' };
        
    } catch (error) {
        console.error('Erro ao salvar no GitHub:', error);
        return { success: false, message: `Erro: ${error.message}` };
    }
}

/**
 * Carrega dados do GitHub
 */
export async function loadFromGitHub() {
    try {
        const GITHUB_CONFIG = getGitHubConfig();
        
        if (!GITHUB_CONFIG.username || !GITHUB_CONFIG.repo) {
            return { success: false, message: 'Configure o GitHub primeiro' };
        }
        
        const url = `https://raw.githubusercontent.com/${GITHUB_CONFIG.username}/${GITHUB_CONFIG.repo}/main/dados.json`;
        const response = await fetch(url + '?t=' + Date.now());
        
        if (response.ok) {
            const data = await response.json();
            return { success: true, data: data, message: 'Dados carregados do GitHub!' };
        } else {
            throw new Error('Arquivo não encontrado no GitHub');
        }
    } catch (error) {
        console.log('Erro ao carregar do GitHub:', error.message);
        return { success: false, message: 'Usando dados locais' };
    }
}
