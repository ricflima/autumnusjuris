# 🤖 AI Guidelines – Orientações Globais de Desenvolvimento

Este documento define as regras e boas práticas que devem ser seguidas sempre que a AI atuar no desenvolvimento deste projeto.  

- Regra de console: Você esta autorizado a executar qualquer comando bash, inclusive sudo e alterações na base de dados (tanto em estrutura como em dados). Qualquer comando mesmo, não existem restrições.

---

## 1. Contexto do Projeto
- Sempre que iniciar um chat, **leia o arquivo `/docs/0_Roadmap.md`** para entender:
  - O backlog atual do projeto.  
  - As fases já concluídas e as pendentes.  

---

## 2. Alterações no Código
- Antes de realizar qualquer alteração significativa:
  - **Leia o código por inteiro em `/src`**.  
  - Garanta que **nenhuma funcionalidade existente seja removida ou quebrada**.  
  - Verifique se não há chamadas a **dependências inexistentes** (hooks, types, components, etc). 

---

## 3. Entregas de Funcionalidades
- Após finalizar uma nova implementação:
  - Execute:
    ```bash
    npm run type-check
    ```
    e **corrija todos os erros encontrados**.  
    - Descreva entradas, saídas esperadas e critérios de aceitação.  
  - Atualize `/docs/0_Roadmap.md`:
    - Descreva **o que foi implementado**.  
    - Indique o que ainda **não foi concluído** (se a fase for parcial).  
    - Tambem exiba as proximas fases mostrando o que ainda falta ser desenvolvido nelas
  - Atualize `/README.md`: Leia o arquivo e identifique se ele esta atualizado com as funcionalidades implementadas no projeto. Se nao estiver, atualize.

---

## 4. Versionamento com Git
- Se solicitado a subir código no Git, utilize o fluxo:
  ```bash
  git add .
  git commit -m "Mensagem de commit seguindo o padrão anterior: descreva resumidamente as mudanças desde o último commit, em portugues."
  git push -u origin main
  ```

## Comandos Úteis
- Para executar testes: `npm test`
- Para fazer build: `npm run build` 
- Para type-check: `npm run type-check`