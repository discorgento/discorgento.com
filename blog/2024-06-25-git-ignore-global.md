---
slug: git-ignore-global
title: Configurar .gitignore Global no Git
authors: machado
tags: [git]
---
<!-- truncate -->

# Configurar .gitignore Global no Git

### Benefícios do .gitignore global:

- Mantém consistência nos padrões de ignorar arquivos entre todos os projetos.
- Permite ignorar arquivos específicos do ambiente do usuário.

### Cuidados ao usar o .gitignore global:

- Pode causar confusão entre membros da equipe devido a configurações diferentes.
- É crucial não ignorar por engano arquivos importantes para o projeto.

1.  **Criar ou editar o arquivo .gitignore_global**: Primeiramente, crie ou edite o arquivo `.gitignore_global` na sua home directory. Isso pode ser feito com o seguinte comando:
```
nano ~/.gitignore_global
```

Adicione os padrões de arquivos ou diretórios que você deseja ignorar globalmente. Por exemplo:

```
*.log
*.tmp
.madock
```

2. Configurar o Git para usar o arquivo .gitignore_global: Configure o Git para usar esse arquivo como o global ignore file. Execute o comando abaixo no terminal:

```
git config --global core.excludesfile ~/.gitignore_global
```

3. Verificar a configuração: Para verificar se a configuração foi aplicada corretamente, use o comando:

```
git config --get core.excludesfile
```