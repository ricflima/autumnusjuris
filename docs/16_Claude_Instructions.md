 
Sempre que eu iniciar um chat você deve ler o 0_Roadmap.md para entender sobre o backlog do projeto.
Lembre-se de antes de realizar qualquer alteração grande no codigo você deve ler o codigo por inteiro na /src e atualiza-lo com as novas funcionalidades sem remover nenhuma funcionalidade ja implementada. Lembre-se também de verificar sem voce esta chamando dependencias que ainda não existem no projeto como hooks, types e components.
Ao final da implementação de uma nova funcionalidade, atualize /src/docs/0_Roadmap.md incrementando com as funcionalidade implementadas (Se uma fase for parcialmente implementada, deixe claro o que foi implementado e o que ainda nao foi). Ao final, execute tambem o comando npm run type-check e corrija os erros caso existam.
Se eu pedir para voce subir o codigo no git voce vai executar os comandos abaixo no terminal:
git add .
git commit -m "Verifique o modelo dos ultimos commits e escreva aqui um resumo do que foi modificado desde o ultimo commit"
git push -u origin main
